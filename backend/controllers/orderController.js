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

// Shared helper to restore reserved stock counts for a failed/cancelled order
export const restoreOrderStock = async (order) => {
  for (const item of order.items) {
    if (item.product) {
      await Product.updateOne(
        {
          _id: item.product,
          variants: {
            $elemMatch: {
              size: item.size,
              color: item.color
            }
          }
        },
        {
          $inc: {
            "variants.$.stock": item.qty
          }
        }
      );
    }
  }
};

// Create order record and generate Razorpay session
export const placeOrder = async (req, res) => {
  try {
    const { customerName, phone, address, items, subtotal } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 1. Re-calculate subtotal and build order items list with database-verified product prices
    const orderItems = [];
    let calculatedSubtotal = 0;
    
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.name || item.product}` });
      }

      // Check variant existence and gather size/color combo specs
      const matchedVariant = product.variants?.find(
        (v) => v.size === item.size && (!item.color || v.color === item.color)
      );

      if (!matchedVariant) {
        return res.status(400).json({
          message: `Option combo not available for product "${product.name}" (${item.size}${item.color ? ` - ${item.color}` : ""})`
        });
      }

      // Construct verified item entry using the database price
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        qty: item.qty,
        size: item.size,
        color: item.color || "",
      });

      calculatedSubtotal += product.price * item.qty;
    }

    // Sanity comparison logging
    if (Math.round(calculatedSubtotal) !== Math.round(subtotal)) {
      console.warn(`[SECURITY ALERT] Price tampering detected! Client sent subtotal of ₹${subtotal}, but server calculated ₹${calculatedSubtotal}. Overriding with server calculation.`);
    }

    // 2. Perform atomic stock reservation
    const reservedItems = [];
    for (const item of orderItems) {
      const result = await Product.updateOne(
        {
          _id: item.product,
          variants: {
            $elemMatch: {
              size: item.size,
              color: item.color,
              stock: { $gte: item.qty }
            }
          }
        },
        {
          $inc: {
            "variants.$.stock": -item.qty
          }
        }
      );

      if (result.modifiedCount === 0) {
        // Rollback already reserved stock elements
        for (const rev of reservedItems) {
          await Product.updateOne(
            {
              _id: rev.product,
              variants: {
                $elemMatch: {
                  size: rev.size,
                  color: rev.color
                }
              }
            },
            {
              $inc: {
                "variants.$.stock": rev.qty
              }
            }
          );
        }

        return res.status(400).json({
          message: `Insufficient stock for item: ${item.name} (${item.size}${item.color ? ` - ${item.color}` : ""}). Please adjust quantities.`
        });
      }

      reservedItems.push(item);
    }

    // Create the order locally as "pending"
    const order = await Order.create({
      user: req.user ? req.user._id : null,
      customerName,
      phone,
      address,
      items: orderItems,
      subtotal: calculatedSubtotal,
      paymentStatus: "pending",
    });

    if (razorpayInstance) {
      const options = {
        amount: Math.round(calculatedSubtotal * 100), // amount in paise
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
      const wasPending = order.paymentStatus === "pending";
      order.paymentStatus = "failed";
      await order.save();
      if (wasPending) {
        await restoreOrderStock(order);
      }
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

    const originalStatus = order.status;
    order.status = status;
    await order.save();

    // Revert stock if transition went to Cancelled
    if (status === "Cancelled" && originalStatus !== "Cancelled") {
      await restoreOrderStock(order);
    }

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

    // Restore product stock counts via helper
    await restoreOrderStock(order);

    order.status = "Cancelled";
    await order.save();
    res.json({ message: "Order successfully cancelled and product stock returned.", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
