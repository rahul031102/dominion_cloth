import Order from "../models/Order.js";

// Demo checkout: creates the order record as "pending".
// Swap this for real Razorpay order-create + verify-signature flow
// when the client is ready to go live with payments.
export const placeOrder = async (req, res) => {
  try {
    const { customerName, phone, address, items, subtotal } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    const order = await Order.create({
      customerName,
      phone,
      address,
      items,
      subtotal,
      paymentStatus: "pending",
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
