import express from "express";
import { createCoupon, getCoupons, applyCoupon } from "../controllers/couponController.js";
import { protect, admin } from "../config/authMiddleware.js";

const router = express.Router();

router.post("/", protect, admin, createCoupon);
router.get("/", protect, admin, getCoupons);
router.post("/apply", protect, applyCoupon);

export default router;
