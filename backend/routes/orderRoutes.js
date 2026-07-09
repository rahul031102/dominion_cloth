import express from "express";
import {
  placeOrder,
  getOrders,
  updateOrderStatus,
  verifyPayment,
  getMyOrders,
  cancelOrder,
  returnOrder,
} from "../controllers/orderController.js";
import { protect, admin } from "../config/authMiddleware.js";

const router = express.Router();

// User protected endpoints
router.post("/", protect, placeOrder);
router.post("/verify", protect, verifyPayment);
router.get("/mine", protect, getMyOrders);
router.post("/:id/cancel", protect, cancelOrder);
router.post("/:id/return", protect, returnOrder);

// Admin protected endpoints
router.get("/", protect, admin, getOrders);
router.put("/:id/status", protect, admin, updateOrderStatus);

export default router;
