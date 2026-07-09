import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL: API_BASE });

// Automatically attach JWT token to all requests if present in localStorage
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem("userInfo")
      ? JSON.parse(localStorage.getItem("userInfo"))
      : null;
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Product Endpoints
export const fetchProducts = (category) =>
  api.get("/products", { params: category ? { category } : {} }).then((r) => r.data);

export const fetchProductById = (id) => api.get(`/products/${id}`).then((r) => r.data);

// Order Placement
export const placeOrder = (orderData) => api.post("/orders", orderData).then((r) => r.data);

export const verifyPayment = (verificationData) =>
  api.post("/orders/verify", verificationData).then((r) => r.data);

export const fetchMyOrders = () =>
  api.get("/orders/mine").then((r) => r.data);

// Auth Endpoints
export const loginUser = (email, password) =>
  api.post("/users/login", { email, password }).then((r) => r.data);

export const signupUser = (name, email, password) =>
  api.post("/users/signup", { name, email, password }).then((r) => r.data);

// Admin Endpoints
export const createProduct = (productData) =>
  api.post("/products", productData).then((r) => r.data);

export const updateProduct = (id, productData) =>
  api.put(`/products/${id}`, productData).then((r) => r.data);

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`).then((r) => r.data);

export const fetchOrders = () =>
  api.get("/orders").then((r) => r.data);

export const updateOrderStatus = (id, status) =>
  api.put(`/orders/${id}/status`, { status }).then((r) => r.data);
