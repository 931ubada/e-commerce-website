from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is missing! Set it in the backend .env or hosting environment.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str

class ProductVariant(BaseModel):
    size: Optional[str] = None
    color: Optional[str] = None
    inventory: int = 0

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float
    description: str
    images: List[str] = []
    variants: List[ProductVariant] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    price: float
    description: str
    images: List[str] = []
    variants: List[ProductVariant] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    variants: Optional[List[ProductVariant]] = None

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def prepare_for_mongo(data: dict) -> dict:
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('updated_at'), datetime):
        data['updated_at'] = data['updated_at'].isoformat()
    return data

def parse_from_mongo(item: dict) -> dict:
    """Convert ISO strings back to datetime objects"""
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    return item

# Initialize default admin (username: admin, password: admin123)
@app.on_event("startup")
async def create_default_admin():
    # Read desired admin credentials from env vars (fallback to secure defaults if missing)
    new_admin_username = os.environ.get("ADMIN_USERNAME", None)
    new_admin_password = os.environ.get("ADMIN_PASSWORD", None)

    if not new_admin_username or not new_admin_password:
        # if env not provided, do not auto-create an insecure default — log warning and return
        logger.warning("ADMIN_USERNAME or ADMIN_PASSWORD not set. Skipping default admin creation.")
        return

    existing_admin = await db.admins.find_one({"username": new_admin_username})
    if not existing_admin:
        admin = Admin(
            username=new_admin_username,
            password_hash=hash_password(new_admin_password)
        )
        await db.admins.insert_one(admin.model_dump())
        logger.info(f"Default admin created: username='{new_admin_username}'")
    else:
        logger.info(f"Admin user '{new_admin_username}' already exists; no creation performed.")


# Public Routes (Customer View)
@api_router.get("/products", response_model=List[Product])
async def get_all_products():
    """Get all products for customer view"""
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    for product in products:
        product = parse_from_mongo(product)
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get single product detail"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return parse_from_mongo(product)

# Admin Auth Routes
@api_router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(login_data: AdminLogin):
    """Admin login endpoint"""
    admin = await db.admins.find_one({"username": login_data.username})
    if not admin or not verify_password(login_data.password, admin["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(data={"sub": admin["username"]})
    return AdminLoginResponse(
        access_token=access_token,
        username=admin["username"]
    )

@api_router.get("/admin/verify")
async def verify_admin_token(username: str = Depends(verify_token)):
    """Verify if token is valid"""
    return {"username": username, "valid": True}

# Admin Product Management Routes
@api_router.get("/admin/products", response_model=List[Product])
async def get_admin_products(username: str = Depends(verify_token)):
    """Get all products for admin view"""
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    for product in products:
        product = parse_from_mongo(product)
    return products

@api_router.post("/admin/products", response_model=Product)
async def create_product(product_data: ProductCreate, username: str = Depends(verify_token)):
    """Create a new product"""
    product = Product(**product_data.model_dump())
    doc = prepare_for_mongo(product.model_dump())
    await db.products.insert_one(doc)
    return product

@api_router.put("/admin/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_data: ProductUpdate,
    username: str = Depends(verify_token)
):
    """Update an existing product"""
    existing_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    update_doc = prepare_for_mongo(update_data)
    await db.products.update_one({"id": product_id}, {"$set": update_doc})
    
    updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return parse_from_mongo(updated_product)

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, username: str = Depends(verify_token)):
    """Delete a product"""
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()