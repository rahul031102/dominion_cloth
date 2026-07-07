import express from "express";
import { placeOrder, getOrders, updateOrderStatus } from "../controllers/orderController.js";
import { protect, admin } from "../config/authMiddleware.js";

const router = express.Router();

router.post("/", placeOrder);

// Admin protected endpoints
router.get("/", protect, admin, getOrders);
router.put("/:id/status", protect, admin, updateOrderStatus);

export default router;
