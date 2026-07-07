import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { placeOrder } from "../api/products.js";

export default function Checkout() {
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customerName: "", phone: "", address: "" });
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      await placeOrder({
        ...form,
        items: cart.map((c) => ({
          product: c.product._id,
          name: c.product.name,
          price: c.product.price,
          qty: c.qty,
          size: c.size,
        })),
        subtotal,
      });
      clearCart();
      setDone(true);
    } catch (err) {
      alert("Something went wrong placing the order. Check that the backend server is running.");
    } finally {
      setPlacing(false);
    }
  };

  if (done) {
    return (
      <section className="max-w-md mx-auto px-6 py-20 text-center bg-white border border-line rounded shadow-sm mt-16 text-ink">
        <div className="w-16 h-16 bg-green-50 border border-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-sm">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold uppercase mb-3 tracking-wider text-ink">ORDER PLACED</h1>
        <p className="text-sm text-gray-600 mb-8 leading-relaxed uppercase">
          Thank you, <strong className="text-navy">{form.customerName}</strong>. Your order is confirmed and queued for fulfillment.
        </p>
        <button
          onClick={() => navigate("/products")}
          className="w-full py-3.5 text-xs font-bold uppercase tracking-wider bg-navy text-white rounded hover:opacity-90 transition-all"
        >
          Continue Shopping
        </button>
      </section>
    );
  }

  if (cart.length === 0) {
    return (
      <section className="max-w-md mx-auto px-6 py-20 text-center bg-white border border-line rounded shadow-sm mt-16 text-ink">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-navy">
          <path d="M6 7h12l-1 13H7L6 7Z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
        <p className="text-sm font-semibold text-ink mb-6">Your shopping bag is empty.</p>
        <button
          onClick={() => navigate("/products")}
          className="w-full py-3.5 text-xs font-bold uppercase tracking-wider bg-navy text-white rounded hover:opacity-90 transition-all shadow"
        >
          Explore Shop
        </button>
      </section>
    );
  }

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-8 py-10 grid md:grid-cols-2 gap-10 bg-paper text-ink font-body">
      
      {/* Left Column: Address Form */}
      <div className="border border-line bg-white p-6 md:p-8 rounded shadow-sm">
        <h1 className="text-lg md:text-xl font-bold uppercase text-ink tracking-wider mb-6 border-b border-line pb-3">
          Delivery Address
        </h1>
        
        <form onSubmit={handlePlaceOrder} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Full Name</label>
            <input
              required
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-medium"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Mobile Number</label>
            <input
              required
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-medium"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Delivery Location</label>
            <textarea
              required
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-medium"
              placeholder="Flat/House No., Street Name, City, Pincode"
            />
          </div>

          <div className="pt-5 border-t border-line mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">Payment Method</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3 border border-line rounded px-4 py-3 cursor-pointer bg-white hover:border-navy transition-colors">
                <input type="radio" name="payment" className="accent-navy" defaultChecked />
                <span className="text-xs font-bold text-ink uppercase">Cards / UPI / Netbanking (Razorpay Gateway)</span>
              </label>
              <label className="flex items-center gap-3 border border-line rounded px-4 py-3 cursor-pointer opacity-40 bg-white">
                <input type="radio" name="payment" disabled />
                <span className="text-xs font-bold text-gray-400 uppercase">Cash on Delivery (Disabled)</span>
              </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wide">
              *Simulation Mode: Orders are registered without charging cards.
            </p>
          </div>

          <button
            disabled={placing}
            className="w-full py-4 mt-6 text-xs font-bold uppercase tracking-widest bg-navy text-white hover:opacity-90 active:scale-95 transition-all rounded shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {placing ? (
              "PROCESSING..."
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {`Pay ₹${subtotal.toLocaleString("en-IN")}`}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Order Summary */}
      <div className="border border-line bg-white p-6 rounded shadow-sm h-max">
        <h2 className="text-xs font-bold uppercase tracking-widest text-navy mb-4 border-b border-line pb-3">
          ORDER MANIFEST ({cart.reduce((sum, item) => sum + item.qty, 0)} Items)
        </h2>
        
        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
          {cart.map((c) => (
            <div key={`${c.product._id}-${c.size}`} className="flex gap-3 bg-paper p-3 rounded border border-line shadow-sm">
              <img
                src={c.product.image}
                alt={c.product.name}
                className="w-14 h-18 object-cover rounded bg-white border border-line"
              />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink truncate max-w-[200px]">{c.product.brand}</h4>
                  <p className="text-[10px] text-gray-500 truncate">{c.product.name}</p>
                </div>
                <div className="flex justify-between items-baseline mt-1.5">
                  <span className="text-[10px] font-bold text-navy uppercase tracking-wider">Size: {c.size} · Qty: {c.qty}</span>
                  <span className="text-xs font-bold text-ink">
                    ₹{(c.product.price * c.qty).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-line mt-6 pt-4 space-y-2.5 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Manifest Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="text-navy font-bold">FREE</span>
          </div>
          <hr className="border-line my-2" />
          <div className="flex justify-between font-bold text-sm text-navy uppercase tracking-wider">
            <span>Total Payable</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

    </section>
  );
}
