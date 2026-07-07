import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL: API_BASE });

export const fetchProducts = (category) =>
  api.get("/products", { params: category ? { category } : {} }).then((r) => r.data);

export const fetchProductById = (id) => api.get(`/products/${id}`).then((r) => r.data);

export const placeOrder = (orderData) => api.post("/orders", orderData).then((r) => r.data);
