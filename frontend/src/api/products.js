import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL: API_BASE, withCredentials: true });

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

// Interceptor to handle token refresh on 401 errors
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401, not already retried, and not on login/signup/refresh
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/users/login") &&
      !originalRequest.url.includes("/users/signup") &&
      !originalRequest.url.includes("/users/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE}/users/refresh`,
          {},
          { withCredentials: true }
        );
        const token = data.token;

        const userInfo = localStorage.getItem("userInfo")
          ? JSON.parse(localStorage.getItem("userInfo"))
          : {};
        userInfo.token = token;
        localStorage.setItem("userInfo", JSON.stringify(userInfo));

        processQueue(null, token);
        originalRequest.headers.Authorization = "Bearer " + token;
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Clear auth and redirect on failure
        localStorage.removeItem("userInfo");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login?expired=true";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Product Endpoints
export const fetchProducts = (params = {}) => {
  const queryParams = typeof params === "string" ? { category: params } : params;
  return api.get("/products", { params: queryParams }).then((r) => r.data);
};

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

export const verifyUserEmail = (token) =>
  api.post("/users/verify-email", { token }).then((r) => r.data);

export const forgotUserPassword = (email) =>
  api.post("/users/forgot-password", { email }).then((r) => r.data);

export const resetUserPassword = (token, password) =>
  api.post("/users/reset-password", { token, password }).then((r) => r.data);

export const logoutUserApi = () =>
  api.post("/users/logout").then((r) => r.data);

export const fetchUserProfile = () =>
  api.get("/users/profile").then((r) => r.data);

export const updateUserProfileApi = (profileData) =>
  api.put("/users/profile", profileData).then((r) => r.data);

export const fetchAddresses = () =>
  api.get("/users/addresses").then((r) => r.data);

export const addAddressApi = (addrData) =>
  api.post("/users/addresses", addrData).then((r) => r.data);

export const updateAddressApi = (id, addrData) =>
  api.put(`/users/addresses/${id}`, addrData).then((r) => r.data);

export const deleteAddressApi = (id) =>
  api.delete(`/users/addresses/${id}`).then((r) => r.data);

export const fetchWishlist = () =>
  api.get("/users/wishlist").then((r) => r.data);

export const toggleWishlistApi = (productId) =>
  api.post("/users/wishlist", { productId }).then((r) => r.data);

export const fetchCart = () =>
  api.get("/users/cart").then((r) => r.data);

export const syncCartApi = (cartItems) =>
  api.post("/users/cart/sync", { cartItems }).then((r) => r.data);

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
