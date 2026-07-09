import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay SDK if environment variables are set
let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log("Razorpay initialized successfully.");
} else {
  console.log("Razorpay credentials missing. Running checkout in Simulation Mode.");
}

// Create order record and generate Razorpay session
export const placeOrder = async (req, res) => {
  try {
    const { customerName, phone, address, items, subtotal } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Create the order locally as "pending"
    const order = await Order.create({
      user: req.user ? req.user._id : null,
      customerName,
      phone,
      address,
      items,
      subtotal,
      paymentStatus: "pending",
    });

    if (razorpayInstance) {
      const options = {
        amount: Math.round(subtotal * 100), // amount in paise
        currency: "INR",
        receipt: `receipt_order_${order._id}`,
      };

      try {
        const razorpayOrder = await razorpayInstance.orders.create(options);
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        return res.status(201).json({
          order,
          razorpayOrder,
          isMock: false,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        });
      } catch (rzErr) {
        console.error("Razorpay order creation failed, falling back to mock:", rzErr);
        order.razorpayOrderId = `mock_order_${order._id}`;
        await order.save();
        return res.status(201).json({
          order,
          isMock: true,
          message: "Razorpay API error. Fell back to simulator mode.",
        });
      }
    } else {
      // Simulation Mode
      order.razorpayOrderId = `mock_order_${order._id}`;
      await order.save();
      return res.status(201).json({
        order,
        isMock: true,
      });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Verify payment signature
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isMockOrder = !razorpayInstance || (order.razorpayOrderId && order.razorpayOrderId.startsWith("mock_order_"));

    if (isMockOrder) {
      // Simulator mode verification
      order.paymentStatus = "paid";
      order.paymentId = razorpayPaymentId || `mock_pay_${Date.now()}`;
      order.razorpayOrderId = order.razorpayOrderId || razorpayOrderId;
      order.razorpayPaymentId = razorpayPaymentId || `mock_pay_${Date.now()}`;
      await order.save();
      return res.json({ message: "Payment verified (Simulation Mode)", order });
    }

    // Real HMAC verification
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpaySignature) {
      order.paymentStatus = "paid";
      order.paymentId = razorpayPaymentId;
      order.razorpayOrderId = razorpayOrderId;
      order.razorpayPaymentId = razorpayPaymentId;
      order.razorpaySignature = razorpaySignature;
      await order.save();
      res.json({ message: "Payment verified successfully", order });
    } else {
      order.paymentStatus = "failed";
      await order.save();
      res.status(400).json({ message: "Invalid payment signature" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Logged-in user's orders
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin list all orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const ALLOWED_TRANSITIONS = {
  Processing: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipped", "Cancelled"],
  Shipped: ["Out for Delivery"],
  "Out for Delivery": ["Delivered"],
  Delivered: ["Returned"],
  Cancelled: [],
  Returned: [],
};

// Admin update order delivery/processing status with state machine verification
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const validNextStates = ALLOWED_TRANSITIONS[order.status] || [];
    if (!validNextStates.includes(status)) {
      return res.status(400).json({
        message: `Invalid transition from "${order.status}" to "${status}". Allowed: ${validNextStates.join(", ") || "None"}`,
      });
    }

    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Customer cancel order endpoint
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ message: "Order not found or unauthorized" });
    }

    if (order.status !== "Processing" && order.status !== "Confirmed") {
      return res.status(400).json({
        message: `Cannot cancel order at "${order.status}" stage. Only Processing or Confirmed orders are cancellable.`,
      });
    }

    // Restore product stock counts
    for (const item of order.items) {
      if (item.product) {
        const product = await Product.findById(item.product);
        if (product) {
          // Adjust variant stock
          const variant = product.variants?.find(
            (v) => v.size === item.size && (!item.color || v.color === item.color)
          );
          if (variant) {
            variant.stock += item.qty;
          }
          if (product.stock !== undefined) {
            product.stock += item.qty;
          }
          await product.save();
        }
      }
    }

    order.status = "Cancelled";
    await order.save();
    res.json({ message: "Order successfully cancelled and product stock returned.", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
