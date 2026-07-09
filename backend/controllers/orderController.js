import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { sendEmail } from "../utils/sendEmail.js";
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

// Send order status email helper
const sendOrderStatusEmail = async (orderId, subjectLine, bodyHeading, customMessage = "") => {
  try {
    const order = await Order.findById(orderId).populate("user", "email name");
    if (!order) {
      console.log(`Could not send email: Order ${orderId} not found`);
      return;
    }

    const userEmail = order.user?.email || (order.phone ? `${order.customerName}@test.com` : "test@test.com");
    const userName = order.user?.name || order.customerName || "Customer";

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.name} (${item.size}${item.color ? ` - ${item.color}` : ""})</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.qty}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">₹${item.price.toLocaleString("en-IN")}</td>
        </tr>
      `
      )
      .join("");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #1B2A4A; text-align: center;">${bodyHeading}</h2>
        <p>Dear ${userName},</p>
        <p>${customMessage || `Your order status has been updated.`}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f4f2ec;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Item</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Qty</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            ${order.discount > 0 ? `
            <tr>
              <td colspan="2" style="padding: 8px; border: 1px solid #ddd; font-weight: bold; text-align: right;">Discount (${order.couponCode || 'Coupon'}):</td>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; text-align: right; color: #b91c1c;">-₹${order.discount.toLocaleString("en-IN")}</td>
            </tr>
            ` : ""}
            <tr style="background-color: #fafafa;">
              <td colspan="2" style="padding: 8px; border: 1px solid #ddd; font-weight: bold; text-align: right;">Total Bill:</td>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; text-align: right; color: #1B2A4A;">₹${order.subtotal.toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 4px;">
          <h4 style="margin: 0 0 10px 0; color: #1B2A4A;">Delivery Details:</h4>
          <p style="margin: 0; font-size: 14px;"><strong>Address:</strong> ${order.address}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Current Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: #1B2A4A;">${order.status}</span></p>
          ${order.trackingNumber ? `<p style="margin: 5px 0 0 0; font-size: 14px;"><strong>Tracking Number:</strong> <span style="font-family: monospace;">${order.trackingNumber}</span></p>` : ""}
        </div>
        
        <p style="margin-top: 20px; text-align: center; font-size: 12px; color: #666;">
          Thank you for shopping with Dominion Clothing!
        </p>
      </div>
    `;

    await sendEmail({
      to: userEmail,
      subject: subjectLine,
      html: emailHtml,
    });
  } catch (error) {
    console.error(`Failed to send order email for order ${orderId}:`, error);
  }
};

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
    const { customerName, phone, address, items, subtotal, couponCode, paymentMethod } = req.body;
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

    // Recalculate Coupon validation and Discount on server
    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (!coupon) {
        return res.status(400).json({ message: "Invalid coupon code" });
      }
      if (!coupon.isActive) {
        return res.status(400).json({ message: "Coupon is no longer active" });
      }
      if (new Date(coupon.expirationDate) < new Date()) {
        return res.status(400).json({ message: "Coupon has expired" });
      }
      if (calculatedSubtotal < coupon.minOrderAmount) {
        return res.status(400).json({
          message: `Minimum order amount of ₹${coupon.minOrderAmount} is required to apply this coupon.`,
        });
      }
      if (coupon.discountType === "percentage") {
        discount = Math.round((calculatedSubtotal * coupon.discountAmount) / 100);
      } else {
        discount = coupon.discountAmount;
      }
      if (discount > calculatedSubtotal) {
        discount = calculatedSubtotal;
      }
    }

    const finalPayableTotal = calculatedSubtotal - discount;

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

    // Create the order locally
    const order = await Order.create({
      user: req.user ? req.user._id : null,
      customerName,
      phone,
      address,
      items: orderItems,
      subtotal: finalPayableTotal,
      paymentStatus: "pending",
      paymentMethod: paymentMethod || "Razorpay",
      couponCode: couponCode || "",
      coupon: couponCode || "",
      discount: discount,
    });

    if (paymentMethod === "COD") {
      // Cash on Delivery
      // Trigger order confirmation email immediately
      await sendOrderStatusEmail(
        order._id,
        `Order Placed Successfully [COD] - Dominion Clothing`,
        `Order Confirmed (Cash on Delivery)`,
        `Thank you for shopping with us! Your order has been placed using Cash on Delivery (COD) and is currently being processed.`
      );

      return res.status(201).json({
        order,
        isMock: false,
        paymentMethod: "COD",
      });
    }

    if (razorpayInstance) {
      const options = {
        amount: Math.round(finalPayableTotal * 100), // amount in paise
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

      // Trigger email
      await sendOrderStatusEmail(
        order._id,
        `Payment Verified & Order Confirmed (Simulation) - Dominion Clothing`,
        `Order Confirmed (Mock Payment)`,
        `Thank you for shopping with us! Your mock payment has been processed, and your order is currently being processed.`
      );

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

      // Trigger email
      await sendOrderStatusEmail(
        order._id,
        `Payment Verified & Order Confirmed - Dominion Clothing`,
        `Order Confirmed`,
        `Thank you for shopping with us! Your payment has been verified, and your order is currently being processed.`
      );

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
    const { status, trackingNumber = "" } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const nextStatus = status || order.status;
    const normalizedTrackingNumber = typeof trackingNumber === "string" ? trackingNumber.trim() : "";

    if (nextStatus !== order.status) {
      const validNextStates = ALLOWED_TRANSITIONS[order.status] || [];
      if (!validNextStates.includes(nextStatus)) {
        return res.status(400).json({
          message: `Invalid transition from "${order.status}" to "${nextStatus}". Allowed: ${validNextStates.join(", ") || "None"}`,
        });
      }
    } else if (!normalizedTrackingNumber) {
      return res.json(order);
    }

    const originalStatus = order.status;
    order.status = nextStatus;
    if (normalizedTrackingNumber) {
      order.trackingNumber = normalizedTrackingNumber;
    }
    await order.save();

    // Revert stock if transition went to Cancelled
    if (status === "Cancelled" && originalStatus !== "Cancelled") {
      await restoreOrderStock(order);
    }

    // Trigger status update email
    await sendOrderStatusEmail(
      order._id,
      `Order Status Update: ${nextStatus} - Dominion Clothing`,
      `Order Status Updated to ${nextStatus}`,
      `Good news! The status of your order #${order._id} has been updated to "${nextStatus}".${order.trackingNumber ? ` Tracking number: ${order.trackingNumber}.` : ""}`
    );

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

    // Trigger cancel email
    await sendOrderStatusEmail(
      order._id,
      `Order Cancelled - Dominion Clothing`,
      `Order Cancelled`,
      `Your order #${order._id} has been cancelled. If any payment was made, a refund will be processed shortly. Product stock levels have been restored.`
    );

    res.json({ message: "Order successfully cancelled and product stock returned.", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Customer return order endpoint
export const returnOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ message: "Order not found or unauthorized" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({
        message: `Cannot return order at "${order.status}" stage. Only Delivered orders can be returned.`,
      });
    }

    // Restore product stock counts via helper
    await restoreOrderStock(order);

    order.status = "Returned";
    await order.save();

    // Trigger return email
    await sendOrderStatusEmail(
      order._id,
      `Order Returned - Dominion Clothing`,
      `Order Returned`,
      `We have processed your return request for order #${order._id}. A refund has been issued to the payment source, and product stock levels have been restored.`
    );

    res.json({ message: "Return request submitted successfully and product stock returned.", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
