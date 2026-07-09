import Coupon from "../models/Coupon.js";

// Create coupon - Admin only
export const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountAmount, expirationDate, isActive, minOrderAmount } = req.body;
    
    const exists = await Coupon.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountAmount,
      expirationDate,
      isActive: isActive !== undefined ? isActive : true,
      minOrderAmount: minOrderAmount || 0,
    });

    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List all coupons - Admin only
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Validate and apply coupon - Public/User
export const applyCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: "Coupon is no longer active" });
    }

    if (new Date(coupon.expirationDate) < new Date()) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount of ₹${coupon.minOrderAmount} is required to apply this coupon.`,
      });
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round((subtotal * coupon.discountAmount) / 100);
    } else {
      discount = coupon.discountAmount;
    }

    // Cap discount at subtotal to prevent negative totals
    if (discount > subtotal) {
      discount = subtotal;
    }

    res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountAmount: coupon.discountAmount,
      discount,
      finalTotal: subtotal - discount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
