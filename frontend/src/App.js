import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Edit, Plus, LogOut, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Customer Homepage
const Homepage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6" />
              <span className="text-xl font-medium">Store</span>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("/admin/login")}
              className="text-sm"
              data-testid="admin-login-nav-button"
            >
              Admin
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl font-semibold text-gray-900 mb-4">Discover Our Collection</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Carefully curated products for modern living</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Card
                key={product.id}
                className="group cursor-pointer border-gray-200 hover:shadow-lg transition-shadow duration-300"
                onClick={() => navigate(`/product/${product.id}`)}
                data-testid={`product-card-${product.id}`}
              >
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-medium text-lg text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                    <p className="text-2xl font-semibold text-gray-900">${product.price.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Product Detail Page
const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data);
      if (response.data.variants && response.data.variants.length > 0) {
        setSelectedVariant(response.data.variants[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching product:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:text-gray-600"
              data-testid="back-to-home-button"
            >
              <ShoppingBag className="w-6 h-6" />
              <span className="text-xl font-medium">Store</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 overflow-hidden rounded-lg">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-semibold text-gray-900 mb-4" data-testid="product-detail-name">{product.name}</h1>
            <p className="text-3xl font-semibold text-gray-900 mb-6" data-testid="product-detail-price">${product.price.toFixed(2)}</p>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">{product.description}</p>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Available Options</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {product.variants.map((variant, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedVariant(variant)}
                        className={`p-4 border rounded-lg text-left transition-all ${
                          selectedVariant === variant
                            ? "border-gray-900 bg-gray-50"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                        data-testid={`variant-option-${index}`}
                      >
                        {variant.size && <div className="font-medium">Size: {variant.size}</div>}
                        {variant.color && <div className="text-sm text-gray-600">Color: {variant.color}</div>}
                        <div className="text-sm text-gray-600 mt-1">
                          {variant.inventory > 0 ? `${variant.inventory} in stock` : "Out of stock"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Login
const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, { username, password });
      localStorage.setItem("admin_token", response.data.access_token);
      localStorage.setItem("admin_username", response.data.username);
      toast.success("Login successful!");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error("Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-gray-200">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600 text-sm">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="border-gray-300"
                data-testid="admin-username-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="border-gray-300"
                data-testid="admin-password-input"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              disabled={loading}
              data-testid="admin-login-submit-button"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-gray-600 hover:text-gray-900"
              data-testid="back-to-store-button"
            >
              Back to Store
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              Default credentials: <br />
              <span className="font-medium">username: admin</span> | <span className="font-medium">password: admin123</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("admin_token");
        navigate("/admin/login");
      }
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_username");
    navigate("/admin/login");
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`${API}/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your products</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-sm"
                data-testid="view-store-button"
              >
                View Store
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-sm"
                data-testid="admin-logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">Products</h2>
          <Button
            onClick={handleAddNew}
            className="bg-gray-900 hover:bg-gray-800 text-white"
            data-testid="add-product-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : products.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 mb-4">No products yet. Add your first product to get started.</p>
              <Button onClick={handleAddNew} className="bg-gray-900 hover:bg-gray-800 text-white">
                Add Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variants</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Inventory</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} data-testid={`product-row-${product.id}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded">
                            {product.images && product.images.length > 0 ? (
                              <img src={product.images[0]} alt={product.name} className="h-12 w-12 rounded object-cover" />
                            ) : (
                              <div className="h-12 w-12 flex items-center justify-center text-gray-400 text-xs">No img</div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">${product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{product.variants?.length || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.variants?.reduce((sum, v) => sum + v.inventory, 0) || 0}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-gray-600 hover:text-gray-900"
                          data-testid={`edit-product-${product.id}`}
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                          data-testid={`delete-product-${product.id}`}
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            setShowProductModal(false);
            setEditingProduct(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
};

// Product Modal Component
const ProductModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    price: product?.price || "",
    description: product?.description || "",
    images: product?.images?.join(", ") || "",
    variants: product?.variants || [],
  });

  const [newVariant, setNewVariant] = useState({ size: "", color: "", inventory: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      description: formData.description,
      images: formData.images.split(",").map((url) => url.trim()).filter((url) => url),
      variants: formData.variants,
    };

    try {
      const token = localStorage.getItem("admin_token");
      if (product) {
        // Update
        await axios.put(`${API}/admin/products/${product.id}`, productData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Product updated successfully");
      } else {
        // Create
        await axios.post(`${API}/admin/products`, productData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Product created successfully");
      }
      onSave();
    } catch (error) {
      toast.error("Failed to save product");
    }
  };

  const addVariant = () => {
    if (!newVariant.size && !newVariant.color) {
      toast.error("Please enter at least size or color");
      return;
    }
    if (!newVariant.inventory) {
      toast.error("Please enter inventory");
      return;
    }

    const variant = {
      size: newVariant.size || undefined,
      color: newVariant.color || undefined,
      inventory: parseInt(newVariant.inventory),
    };

    setFormData({ ...formData, variants: [...formData.variants, variant] });
    setNewVariant({ size: "", color: "", inventory: "" });
  };

  const removeVariant = (index) => {
    const newVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: newVariants });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Product Name *</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter product name"
              required
              data-testid="product-name-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Price *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              required
              data-testid="product-price-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Description *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter product description"
              rows={3}
              required
              data-testid="product-description-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Image URLs (comma-separated)</label>
            <Input
              type="text"
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
              placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              data-testid="product-images-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Variants</label>
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              {formData.variants.map((variant, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded" data-testid={`variant-${index}`}>
                  <div className="flex-1">
                    {variant.size && <span className="text-sm">Size: {variant.size}</span>}
                    {variant.size && variant.color && <span className="text-sm mx-2">|</span>}
                    {variant.color && <span className="text-sm">Color: {variant.color}</span>}
                    <span className="text-sm ml-2">- Inventory: {variant.inventory}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-red-600 hover:text-red-900"
                    data-testid={`remove-variant-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="grid grid-cols-4 gap-2">
                <Input
                  type="text"
                  placeholder="Size"
                  value={newVariant.size}
                  onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                  data-testid="new-variant-size-input"
                />
                <Input
                  type="text"
                  placeholder="Color"
                  value={newVariant.color}
                  onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                  data-testid="new-variant-color-input"
                />
                <Input
                  type="number"
                  placeholder="Inventory"
                  value={newVariant.inventory}
                  onChange={(e) => setNewVariant({ ...newVariant, inventory: e.target.value })}
                  data-testid="new-variant-inventory-input"
                />
                <Button type="button" onClick={addVariant} className="bg-gray-900 hover:bg-gray-800" data-testid="add-variant-button">
                  Add
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-product-button">
              Cancel
            </Button>
            <Button type="submit" className="bg-gray-900 hover:bg-gray-800" data-testid="save-product-button">
              {product ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;