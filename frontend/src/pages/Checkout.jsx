import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { placeOrder, verifyPayment, applyCouponApi } from "../api/products.js";
import { getProductImage } from "../utils/images.js";

export default function Checkout() {
  const { cart, subtotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ customerName: "", phone: "", address: "" });
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);

  // Simulation state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  // Coupons & Payment States
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const data = await applyCouponApi(couponInput, subtotal);
      setAppliedCoupon(data);
      showToast(`Coupon "${data.code}" applied successfully!`);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || "Invalid coupon code");
      showToast(err.response?.data?.message || "Invalid coupon code");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    showToast("Coupon removed.");
  };

  // Authenticate user before checkout
  useEffect(() => {
    if (!authLoading && !user) {
      showToast("Please sign in to proceed with checkout.");
      navigate("/login?redirect=/checkout");
    }
  }, [user, authLoading, navigate]);

  // Autofill name from profile
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        customerName: f.customerName || user.name || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Load Razorpay script helper
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const orderPayload = {
        ...form,
        items: cart.map((c) => ({
          product: c.product._id,
          name: c.product.name,
          price: c.product.price,
          qty: c.qty,
          size: c.size,
          color: c.color || "",
        })),
        subtotal,
        couponCode: appliedCoupon ? appliedCoupon.code : "",
        paymentMethod,
      };

      // Create order locally + create Razorpay order on backend
      const response = await placeOrder(orderPayload);
      const localOrder = response.order;

      if (paymentMethod === "COD") {
        clearCart();
        setDone(true);
        showToast("Order placed successfully with Cash on Delivery!");
        return;
      }

      if (response.isMock) {
        // Fallback to custom sandbox simulation
        setCurrentOrderId(localOrder._id);
        setShowSimulator(true);
      } else {
        // Real Razorpay modal execution
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          showToast("Failed to load payment gateway script. Using simulation fallback.");
          setCurrentOrderId(localOrder._id);
          setShowSimulator(true);
          return;
        }

        const options = {
          key: response.razorpayKeyId,
          amount: response.razorpayOrder.amount,
          currency: response.razorpayOrder.currency,
          name: "Dominion Clothing",
          description: "Manifest Purchase",
          image: "/logo.png",
          order_id: response.razorpayOrder.id,
          handler: async function (razorpayRes) {
            setPlacing(true);
            try {
              await verifyPayment({
                orderId: localOrder._id,
                razorpayOrderId: razorpayRes.razorpay_order_id,
                razorpayPaymentId: razorpayRes.razorpay_payment_id,
                razorpaySignature: razorpayRes.razorpay_signature,
                isMock: false,
              });
              clearCart();
              setDone(true);
              showToast("Payment verified! Order placed.");
            } catch (err) {
              showToast("Payment verification failed. Please contact support.");
            } finally {
              setPlacing(false);
            }
          },
          prefill: {
            name: form.customerName,
            contact: form.phone,
            email: user?.email || "",
          },
          theme: {
            color: "#1B2A4A",
          },
          modal: {
            ondismiss: function () {
              showToast("Payment window closed.");
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Something went wrong placing the order.");
    } finally {
      setPlacing(false);
    }
  };

  const handleSimulateSuccess = async () => {
    setSimulating(true);
    try {
      const mockPayId = "mock_pay_" + Math.random().toString(36).substring(2, 9).toUpperCase();
      await verifyPayment({
        orderId: currentOrderId,
        razorpayOrderId: `mock_order_${currentOrderId}`,
        razorpayPaymentId: mockPayId,
        isMock: true,
      });
      clearCart();
      setShowSimulator(false);
      setDone(true);
      showToast("Order simulated successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to verify simulated payment.");
    } finally {
      setSimulating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 text-center text-gray-500 bg-paper">
        <div className="skeleton h-12 w-48 mx-auto rounded mb-8" />
        <div className="skeleton h-48 w-full rounded" />
      </div>
    );
  }

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
          onClick={() => navigate("/orders")}
          className="w-full py-3.5 text-xs font-bold uppercase tracking-wider bg-navy text-white rounded hover:opacity-90 transition-all"
        >
          View Your Orders
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
    <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 grid md:grid-cols-2 gap-6 sm:gap-10 bg-paper text-ink font-body relative">
      
      {/* Left Column: Address Form */}
      <div className="border border-line bg-white p-5 sm:p-6 md:p-8 rounded shadow-sm">
        <h1 className="text-base sm:text-lg md:text-xl font-bold uppercase text-ink tracking-wider mb-5 sm:mb-6 border-b border-line pb-3">
          Delivery Address
        </h1>
        
        <form onSubmit={handlePlaceOrder} className="space-y-4">
          <div>
            <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Full Name</label>
            <input
              required
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              className="w-full border border-line rounded px-4 py-3 text-sm sm:text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-medium"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Mobile Number</label>
            <input
              required
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-line rounded px-4 py-3 text-sm sm:text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-medium"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
          <div>
            <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Delivery Location</label>
            <textarea
              required
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className="w-full border border-line rounded px-4 py-3 text-sm sm:text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-medium"
              placeholder="Flat/House No., Street Name, City, Pincode"
            />
          </div>

          <div className="pt-5 border-t border-line mt-6">
            <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">Payment Method</h4>
            <div className="space-y-2">
              <label className="flex items-start sm:items-center gap-3 border border-line rounded px-4 py-3 cursor-pointer bg-white hover:border-navy transition-colors">
                <input 
                  type="radio" 
                  name="payment" 
                  value="Razorpay"
                  checked={paymentMethod === "Razorpay"}
                  onChange={() => setPaymentMethod("Razorpay")}
                  className="accent-navy" 
                />
                <span className="text-xs font-bold text-ink uppercase leading-relaxed">Cards / UPI / Netbanking (Razorpay Gateway)</span>
              </label>
              <label className="flex items-start sm:items-center gap-3 border border-line rounded px-4 py-3 cursor-pointer bg-white hover:border-navy transition-colors">
                <input 
                  type="radio" 
                  name="payment" 
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="accent-navy" 
                />
                <span className="text-xs font-bold text-ink uppercase leading-relaxed">Cash on Delivery (COD)</span>
              </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wide">
              *Simulation Mode will automatically trigger if Razorpay keys are not set.
            </p>
          </div>

          <button
            disabled={placing}
            className="w-full py-4 mt-6 text-sm sm:text-xs font-bold uppercase tracking-widest bg-navy text-white hover:opacity-90 active:scale-95 transition-all rounded shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {placing ? (
              "PROCESSING..."
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {paymentMethod === "COD" 
                  ? `Place Order (COD) - ₹${(appliedCoupon ? appliedCoupon.finalTotal : subtotal).toLocaleString("en-IN")}`
                  : `Pay ₹${(appliedCoupon ? appliedCoupon.finalTotal : subtotal).toLocaleString("en-IN")}`}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Order Summary */}
      <div className="border border-line bg-white p-5 sm:p-6 rounded shadow-sm h-max">
        <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-navy mb-4 border-b border-line pb-3">
          ORDER MANIFEST ({cart.reduce((sum, item) => sum + item.qty, 0)} Items)
        </h2>
        
        <div className="space-y-4 max-h-[260px] sm:max-h-[320px] overflow-y-auto pr-1">
          {cart.map((c) => (
            <div key={`${c.product._id}-${c.size}`} className="flex gap-3 bg-paper p-3 rounded border border-line shadow-sm">
              <img
                src={getProductImage(c.product)}
                alt={c.product.name}
                className="w-14 h-18 object-cover rounded bg-white border border-line"
              />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink truncate max-w-[160px] sm:max-w-[200px]">{c.product.brand}</h4>
                  <p className="text-[10px] text-gray-500 truncate">{c.product.name}</p>
                </div>
                <div className="flex justify-between items-baseline mt-1.5">
                  <span className="text-[10px] font-bold text-navy uppercase tracking-wider max-w-[120px] sm:max-w-none">Size: {c.size} · Qty: {c.qty}</span>
                  <span className="text-xs font-bold text-ink">
                    ₹{(c.product.price * c.qty).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coupon Section */}
        <div className="border-t border-b border-line my-6 py-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Apply Promo Code</label>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2 text-xs">
              <div>
                <span className="font-bold text-green-700 uppercase tracking-wide">{appliedCoupon.code}</span>
                <span className="text-gray-500 ml-1.5 font-medium">Applied (-₹{appliedCoupon.discount})</span>
              </div>
              <button 
                type="button" 
                onClick={handleRemoveCoupon} 
                className="text-gray-400 hover:text-crimson text-sm font-bold"
              >
                &times;
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="WELCOME10, SAVE20..."
                className="flex-1 border border-line rounded px-3 py-2 text-sm sm:text-xs bg-white uppercase tracking-wider text-ink focus:outline-none focus:border-navy"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={applyingCoupon || !couponInput.trim()}
                className="px-4 py-2 bg-navy text-white text-sm sm:text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 disabled:opacity-50 transition-all shrink-0"
              >
                {applyingCoupon ? "APPLYING..." : "APPLY"}
              </button>
            </div>
          )}
          {couponError && (
            <p className="text-[10px] text-crimson font-semibold uppercase tracking-wide mt-1.5">{couponError}</p>
          )}
        </div>

        <div className="border-t border-line mt-6 pt-4 space-y-2.5 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Manifest Subtotal</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-crimson font-semibold">
              <span>Coupon Discount ({appliedCoupon.code})</span>
              <span>-₹{appliedCoupon.discount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="text-navy font-bold">FREE</span>
          </div>
          <hr className="border-line my-2" />
          <div className="flex justify-between font-bold text-sm text-navy uppercase tracking-wider">
            <span>Total Payable</span>
            <span>₹{(appliedCoupon ? appliedCoupon.finalTotal : subtotal).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Premium Sandbox Simulator Modal */}
      {showSimulator && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-line rounded-lg shadow-2xl max-w-sm w-full p-6 animate-scale-up text-ink font-body">
            <div className="flex items-center gap-2 mb-4 text-navy border-b border-line pb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Gateway Sandbox</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed uppercase">
              No active payment keys detected. You are using the secure checkout simulation.
            </p>

            {/* Credit Card Graphic */}
            <div className="bg-gradient-to-tr from-navy to-[#2c3e66] text-white rounded-xl p-5 shadow-lg mb-6 relative overflow-hidden font-mono">
              <div className="absolute right-4 top-4 text-white/20 uppercase tracking-widest text-[9px] font-extrabold">SANDBOX CARD</div>
              <div className="text-[10px] text-white/60 uppercase tracking-wider mb-4">Dominion Card</div>
              <div className="text-base tracking-widest mb-5">4111 2222 3333 4444</div>
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="text-[7px] text-white/50 block leading-none">VALID THRU</span>
                  <span>12/30</span>
                </div>
                <div>
                  <span className="text-[7px] text-white/50 block leading-none">CVV</span>
                  <span>•••</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSimulateSuccess}
                disabled={simulating}
                className="w-full py-3.5 text-xs font-bold uppercase tracking-wider bg-navy text-white rounded hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2"
              >
                {simulating ? "PROCESSING SIMULATION..." : "Simulate Successful Payment"}
              </button>
              <button
                onClick={() => {
                  setShowSimulator(false);
                  showToast("Payment simulation cancelled.");
                }}
                className="w-full py-2.5 text-xs font-bold uppercase tracking-wider border border-line text-gray-600 rounded hover:bg-paper transition-all text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
