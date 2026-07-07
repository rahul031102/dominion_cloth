import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchOrders,
  updateOrderStatus,
} from "../api/products.js";

const CATEGORIES = ["Shirts", "Polos", "T-Shirts", "Trousers", "Jeans", "Jackets", "Sweatshirts", "Shorts"];
const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview"); // overview, products, orders
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Product Form Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null if creating
  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "Shirts",
    price: "",
    mrp: "",
    tag: "",
    colors: "",
    sizes: [],
    image: "",
    description: "",
    stock: "",
  });

  // Verify Admin Access
  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.isAdmin) {
        showToast("Access Denied. Admins only.");
        navigate("/");
      } else {
        loadDashboardData();
      }
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      const [allProds, allOrders] = await Promise.all([
        fetchProducts(),
        fetchOrders(),
      ]);
      setProducts(allProds);
      setOrders(allOrders);
    } catch (err) {
      console.error(err);
      showToast("Error loading admin data. Check backend connection.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSizeToggle = (sz) => {
    const nextSizes = form.sizes.includes(sz)
      ? form.sizes.filter((x) => x !== sz)
      : [...form.sizes, sz];
    setForm({ ...form, sizes: nextSizes });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      name: "",
      brand: "",
      category: "Shirts",
      price: "",
      mrp: "",
      tag: "",
      colors: "",
      sizes: ["S", "M", "L"],
      image: "",
      description: "",
      stock: "10",
    });
    setShowModal(true);
  };

  const openEditModal = (prod) => {
    setEditingId(prod._id);
    setForm({
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      price: prod.price.toString(),
      mrp: prod.mrp ? prod.mrp.toString() : prod.price.toString(),
      tag: prod.tag || "",
      colors: prod.colors ? prod.colors.join(", ") : "",
      sizes: prod.sizes || [],
      image: prod.image,
      description: prod.description || "",
      stock: prod.stock ? prod.stock.toString() : "10",
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        mrp: Number(form.mrp || form.price),
        stock: Number(form.stock || 10),
        colors: form.colors
          ? form.colors.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        showToast("Product updated successfully.");
      } else {
        await createProduct(payload);
        showToast("Product created successfully.");
      }
      setShowModal(false);
      loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || "Error saving product.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        showToast("Product deleted.");
        loadDashboardData();
      } catch (err) {
        showToast("Failed to delete product.");
      }
    }
  };

  const handleStatusChange = async (orderId, nextStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      showToast(`Order status updated to "${nextStatus}"`);
      loadDashboardData();
    } catch (err) {
      showToast("Failed to update status.");
    }
  };

  // Metrics
  const totalSales = orders
    .filter((o) => o.paymentStatus === "paid" || o.paymentStatus === "pending")
    .reduce((sum, o) => sum + o.subtotal, 0);

  if (authLoading || loadingData) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 text-center text-gray-500 bg-paper">
        <div className="skeleton h-12 w-48 mx-auto rounded mb-8" />
        <div className="skeleton h-48 w-full rounded" />
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 page-enter bg-paper text-ink font-body">
      
      {/* Title */}
      <div className="border-b border-line pb-4 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-navy">
            Admin Console
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
            Manage your store catalogs, shipments, and inventory metrics
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border border-line rounded p-1 bg-white w-max">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-1.5 rounded text-xs font-bold transition-all uppercase ${
              activeTab === "overview" ? "bg-navy text-white" : "text-gray-600 hover:text-navy"
            }`}
          >
            Metrics
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-1.5 rounded text-xs font-bold transition-all uppercase ${
              activeTab === "products" ? "bg-navy text-white" : "text-gray-600 hover:text-navy"
            }`}
          >
            Catalog
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-1.5 rounded text-xs font-bold transition-all uppercase ${
              activeTab === "orders" ? "bg-navy text-white" : "text-gray-600 hover:text-navy"
            }`}
          >
            Shipments
          </button>
        </div>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Status widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-line p-6 rounded shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                Gross Turnover
              </span>
              <p className="text-2xl font-extrabold text-navy">
                ₹{totalSales.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-gray-400 mt-1.5 font-bold uppercase">
                Includes pending & paid manifest orders
              </p>
            </div>

            <div className="bg-white border border-line p-6 rounded shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                Completed Shipments
              </span>
              <p className="text-2xl font-extrabold text-ink">
                {orders.filter((o) => o.status === "Delivered").length} / {orders.length}
              </p>
              <p className="text-[10px] text-gray-400 mt-1.5 font-bold uppercase">
                Orders with Delivered status code
              </p>
            </div>

            <div className="bg-white border border-line p-6 rounded shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                Inventory SKU Count
              </span>
              <p className="text-2xl font-extrabold text-ink">
                {products.length} Items
              </p>
              <p className="text-[10px] text-gray-400 mt-1.5 font-bold uppercase">
                Products currently loaded in catalog
              </p>
            </div>
          </div>

          {/* Quick instructions strip */}
          <div className="bg-white border border-line rounded p-5 text-xs text-gray-600 leading-relaxed max-w-3xl">
            <h3 className="font-bold text-navy uppercase tracking-wider mb-2">Seeding & Operations Manual</h3>
            <p className="mb-2">
              All items rendered on the catalog tab are dynamically fetched from the MongoDB database. 
              You can instantly add new custom designer shirts, polos, jackets, or trousers directly using the <strong>Add New Product</strong> drawer control.
            </p>
            <p>
              Under the Shipments tab, click the status update selectors to transition customer orders from 
              <span className="font-semibold text-navy"> Processing &rarr; Dispatched &rarr; Delivered</span>.
            </p>
          </div>
        </div>
      )}

      {/* --- PRODUCTS TAB --- */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
              Product Inventory ({products.length} items)
            </h2>
            <button
              onClick={openCreateModal}
              className="bg-navy text-white text-xs font-bold px-4 py-2.5 rounded shadow hover:opacity-90 transition-all uppercase tracking-wider"
            >
              Add New Product
            </button>
          </div>

          <div className="bg-white border border-line rounded overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-line text-navy uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Item details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price / MRP</th>
                    <th className="px-6 py-4">Tag</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-paper/30 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-12 object-cover rounded border border-line bg-paper"
                        />
                        <div>
                          <p className="font-bold text-ink uppercase tracking-wide">{p.brand}</p>
                          <p className="text-[11px] text-gray-500">{p.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700 uppercase">{p.category}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-navy">₹{p.price}</span>
                        {p.mrp > p.price && (
                          <span className="text-[10px] text-gray-400 line-through ml-2">₹{p.mrp}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {p.tag ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-navy/10 text-navy border border-navy/20">
                            {p.tag}
                          </span>
                        ) : (
                          <span className="text-gray-400">&mdash;</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{p.stock || 10}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => openEditModal(p)}
                          className="text-navy hover:underline font-bold uppercase text-[10px] tracking-wider"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p._id)}
                          className="text-crimson hover:underline font-bold uppercase text-[10px] tracking-wider"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ORDERS TAB --- */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
            Shipments Manifest ({orders.length} orders)
          </h2>

          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o._id}
                className="bg-white border border-line rounded p-5 shadow-sm space-y-4"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-3 gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy block">
                      Order Identifier
                    </span>
                    <span className="text-xs font-semibold text-gray-500">{o._id}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block text-right">
                        Payment
                      </span>
                      <span className="text-xs font-bold text-navy uppercase tracking-wider bg-navy/10 border border-navy/20 px-2 py-0.5 rounded">
                        {o.paymentStatus}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block text-right">
                        Order Status
                      </span>
                      <select
                        value={o.status || "Processing"}
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        className="text-xs font-bold bg-paper border border-line rounded px-2.5 py-1 text-ink focus:outline-none focus:border-navy uppercase tracking-wider"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Items & Shipping address grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Customer details */}
                  <div className="text-xs space-y-1.5">
                    <h4 className="font-bold text-navy uppercase tracking-wider">Customer Details</h4>
                    <p className="font-bold text-ink">{o.customerName}</p>
                    <p className="text-gray-500 font-semibold">{o.phone}</p>
                    <p className="text-gray-400 italic max-w-xs">{o.address}</p>
                  </div>

                  {/* Items list */}
                  <div className="text-xs md:col-span-2 space-y-2">
                    <h4 className="font-bold text-navy uppercase tracking-wider">Manifest Manifest Details</h4>
                    <div className="space-y-1.5">
                      {o.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs bg-paper/30 p-2 rounded border border-line"
                        >
                          <div>
                            <span className="font-bold text-ink uppercase tracking-wide">{item.name}</span>
                            <span className="text-gray-400 ml-2 font-mono">[{item.size}] x{item.qty}</span>
                          </div>
                          <span className="font-bold text-navy">₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Total subtotal bar */}
                <div className="flex justify-between items-center border-t border-line pt-3 text-xs">
                  <span className="font-semibold text-gray-400 uppercase">Placed: {new Date(o.createdAt).toLocaleString("en-IN")}</span>
                  <span className="text-sm font-extrabold text-navy">Total Bill: ₹{o.subtotal.toLocaleString("en-IN")}</span>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- FORM MODAL FOR CREATE/EDIT PRODUCT --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-line rounded shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto page-enter">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-paper/50">
              <h3 className="font-bold text-xs uppercase tracking-wider text-navy">
                {editingId ? "Edit Product Information" : "Create New Catalog SKU"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-navy text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Product Title
                  </label>
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    className="w-full border border-line rounded px-3 py-2 text-xs bg-white text-ink focus:outline-none focus:border-navy"
                    placeholder="E.g. Linen Blend Shirt"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Brand Name
                  </label>
                  <input
                    required
                    name="brand"
                    value={form.brand}
                    onChange={handleInputChange}
                    className="w-full border border-line rounded px-3 py-2 text-xs bg-white text-ink focus:outline-none focus:border-navy"
                    placeholder="E.g. Tommy Hilfiger"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleInputChange}
                    className="w-full border border-line rounded px-3 py-2 text-xs bg-white text-ink focus:outline-none focus:border-navy"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Tag / Label
                  </label>
                  <select
                    name="tag"
                    value={form.tag}
                    onChange={handleInputChange}
                    className="w-full border border-line rounded px-3 py-2 text-xs bg-white text-ink focus:outline-none focus:border-navy"
                  >
                    <option value="">None (Regular)</option>
                    <option value="New">New</option>
                    <option value="Sale">Sale</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Inventory Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleInputChange}
                    className="w-full border border-line rounded px-3 py-2 text-xs bg-white text-ink focus:outline-none focus:border-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Retail Price (₹)
                  </label>
                  <input
                    required
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleInputChange}
                    className="w-full border border-line rounded px-3 py-2 text-xs bg-white text-ink focus:outline-none focus:border-navy"
                    placeholder="2499"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Original MRP (₹)
                  </label>
                  <input
                    required
                    type="number"
                    name="mrp"
                    value={form.mrp}
                    onChange={handleInputChange}
                    className="w-full border border-line rounded px-3 py-2 text-xs bg-white text-ink focus:outline-none focus:border-navy"
                    placeholder="3499"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                  Product Image URL
                </label>
                <input
                  required
                  name="image"
                  value={form.image}
                  onChange={handleInputChange}
                  className="w-full border border-line rounded px-3 py-2 text-xs bg-white text-ink focus:outline-none focus:border-navy"
                  placeholder="https://images.unsplash.com/photo-xxx..."
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                  Available Sizes
                </label>
                <div className="flex gap-4 mt-1.5">
                  {SIZES.map((sz) => {
                    const isChecked = form.sizes.includes(sz);
                    return (
                      <label key={sz} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSizeToggle(sz)}
                          className="accent-navy"
                        />
                        <span>{sz}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                  Colors (comma-separated hex codes)
                </label>
                <input
                  name="colors"
                  value={form.colors}
                  onChange={handleInputChange}
                  className="w-full border border-line rounded px-3 py-2 text-xs bg-white text-ink focus:outline-none focus:border-navy"
                  placeholder="#FFFFFF, #000000, #1B2A4A"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-line rounded px-3 py-2 text-xs bg-white text-ink focus:outline-none focus:border-navy"
                  placeholder="Describe fabric blend, fit details..."
                />
              </div>

              <div className="pt-4 border-t border-line flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-line text-ink rounded text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-white rounded text-xs font-bold uppercase hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
