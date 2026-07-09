import express from "express";
import rateLimit from "express-rate-limit";
import {
  signupUser,
  loginUser,
  verifyEmail,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  toggleWishlist,
  getCart,
  syncCart,
} from "../controllers/userController.js";
import { protect } from "../config/authMiddleware.js";
import {
  validateRequest,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  addressSchema,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

// Rate limiter for authentication attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: "Too many auth attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication endpoints
router.post("/signup", validateRequest(signupSchema), signupUser);
router.post("/login", authLimiter, validateRequest(loginSchema), loginUser);
router.post("/verify-email", verifyEmail);
router.post("/refresh", refreshToken);
router.post("/logout", logoutUser);

// Password recovery
router.post("/forgot-password", authLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validateRequest(resetPasswordSchema), resetPassword);

// Profile
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, validateRequest(updateProfileSchema), updateUserProfile);

// Addresses
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, validateRequest(addressSchema), addAddress);
router.put("/addresses/:addressId", protect, validateRequest(addressSchema), updateAddress);
router.delete("/addresses/:addressId", protect, deleteAddress);

// Wishlist
router.get("/wishlist", protect, getWishlist);
router.post("/wishlist", protect, toggleWishlist);

// Cart
router.get("/cart", protect, getCart);
router.post("/cart/sync", protect, syncCart);

export default router;
