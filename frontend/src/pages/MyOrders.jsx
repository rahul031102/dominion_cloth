import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { fetchMyOrders, cancelOrderApi, returnOrderApi } from "../api/products.js";

const STEPS = ["Processing", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      showToast("Access denied. Please login first.");
      navigate("/login");
    } else if (user) {
      loadOrders();
    }
  }, [user, authLoading, navigate]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchMyOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
      showToast("Error retrieving your orders. Ensure the server is online.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (
      window.confirm(
        "Are you sure you want to cancel this order? This will restore item stock levels and void your delivery."
      )
    ) {
      try {
        await cancelOrderApi(orderId);
        showToast("Order cancelled successfully.");
        loadOrders();
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to cancel order.");
      }
    }
  };

  const handleReturnOrder = async (orderId) => {
    if (
      window.confirm(
        "Are you sure you want to return this order? This will restore item stock levels and issue a refund request."
      )
    ) {
      try {
        await returnOrderApi(orderId);
        showToast("Return request submitted successfully.");
        loadOrders();
      } catch (err) {
        showToast(err.response?.data?.message || "Failed to submit return request.");
      }
    }
  };

  const getStepStatusClass = (orderStatus, step) => {
    const currentIndex = STEPS.indexOf(orderStatus);
    const stepIndex = STEPS.indexOf(step);
    if (currentIndex === -1) return "bg-white text-gray-300 border-line"; // e.g. Cancelled/Returned
    if (stepIndex <= currentIndex) {
      return "bg-navy text-white border-navy font-bold";
    }
    return "bg-white text-gray-400 border-line font-medium";
  };

  const getStepLineClass = (orderStatus, stepIndex) => {
    const currentIndex = STEPS.indexOf(orderStatus);
    if (currentIndex === -1) return "bg-line";
    if (stepIndex < currentIndex) {
      return "bg-navy";
    }
    return "bg-line";
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500 bg-paper">
        <div className="skeleton h-12 w-48 mx-auto rounded mb-8 animate-pulse" />
        <div className="space-y-6">
          <div className="skeleton h-40 w-full rounded animate-pulse" />
          <div className="skeleton h-40 w-full rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 page-enter bg-paper text-ink font-body">
      
      {/* Title */}
      <div className="border-b border-line pb-4 mb-6 sm:mb-8">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wider text-navy">
          My Order History
        </h1>
        <p className="text-[11px] sm:text-xs text-gray-500 mt-1 uppercase tracking-wide">
          Review recent transactions, tracking details, and items dispatched
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 sm:py-20 px-4 bg-white border border-line rounded shadow-sm">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-navy opacity-80">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
            <path d="M12 14v4" />
            <path d="M10 18h4" />
          </svg>
          <h2 className="text-sm sm:text-base font-bold text-ink uppercase tracking-wider">No Orders Placed Yet</h2>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-2.5 uppercase tracking-wider leading-relaxed px-2 sm:px-0">
            Your credentials have no matching transactions. Explore the store to place an order.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-block bg-navy text-white text-xs font-bold px-6 py-3 rounded uppercase tracking-wider hover:opacity-90 transition-all shadow"
          >
            Explore Catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((o) => (
            <div
              key={o._id}
              className="bg-white border border-line rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              
              {/* Order Card Header */}
              <div className="bg-[#F4F2EC]/40 border-b border-line px-4 sm:px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:gap-8 gap-4 font-semibold text-gray-600">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">DATE PLACED</span>
                    <span>{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">TOTAL BILL</span>
                    <span className="text-navy font-bold">₹{o.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">ORDER ID</span>
                    <span className="font-mono text-gray-500">{o._id}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3">
                  <span className="px-3 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest border bg-navy/5 text-navy border-navy/20">
                    Payment: {o.paymentStatus}
                  </span>
                  
                  <span className={`px-3 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest border ${
                    o.status === "Delivered" 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : o.status === "Cancelled"
                      ? "bg-crimson/5 text-crimson border-crimson/20"
                      : "bg-[#1B2A4A]/5 text-navy border-[#1B2A4A]/10"
                  }`}>
                    {o.status || "Processing"}
                  </span>

                  {/* Customer Cancel button */}
                  {(o.status === "Processing" || o.status === "Confirmed") && (
                    <button
                      onClick={() => handleCancelOrder(o._id)}
                      className="w-full sm:w-auto px-3.5 py-1.5 border border-crimson/30 hover:border-crimson text-crimson bg-white hover:bg-crimson/5 text-[10px] font-extrabold uppercase tracking-widest rounded transition-all active:scale-95"
                    >
                      Cancel Order
                    </button>
                  )}

                  {/* Customer Return button */}
                  {o.status === "Delivered" && (
                    <button
                      onClick={() => handleReturnOrder(o._id)}
                      className="w-full sm:w-auto px-3.5 py-1.5 border border-gray-400 hover:border-navy text-gray-700 hover:text-navy bg-white hover:bg-gray-50 text-[10px] font-extrabold uppercase tracking-widest rounded transition-all active:scale-95"
                    >
                      Return Order
                    </button>
                  )}
                </div>
              </div>

              {/* Order Card Body */}
              <div className="p-4 sm:p-5 grid md:grid-cols-3 gap-6 sm:gap-8">
                
                {/* Items column */}
                <div className="md:col-span-2 space-y-4">
                    <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest mb-1">
                    ORDER MANIFEST DETAILS
                  </h4>
                  <div className="space-y-3.5">
                    {o.items.map((item, idx) => (
                        <div key={idx} className="flex gap-3 sm:gap-4 items-center bg-paper/20 p-2 border border-line/50 rounded">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs uppercase text-ink tracking-wide truncate">{item.name}</h5>
                          <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">
                            Size: {item.size} {item.color && `· Color: ${item.color}`} · Qty: {item.qty}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-ink shrink-0">
                          ₹{(item.price * item.qty).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery column */}
                <div className="text-xs space-y-3">
                  <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest mb-1">
                    SHIPMENT DESTINATION
                  </h4>
                  <div className="bg-[#FAFAF8] p-3 border border-line rounded">
                    <p className="font-bold text-ink uppercase tracking-wide mb-1">{o.customerName}</p>
                    <p className="text-gray-500 font-semibold mb-2">{o.phone}</p>
                    <p className="text-gray-400 leading-relaxed font-sans text-xs italic">{o.address}</p>
                  </div>
                  {o.trackingNumber && (
                    <div className="bg-white border border-line rounded p-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                        Tracking Number
                      </span>
                      <p className="font-mono text-xs font-bold text-navy break-all">{o.trackingNumber}</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Tracker Timeline Footer */}
              <div className="border-t border-line px-4 sm:px-5 py-5 bg-white">
                <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest mb-4">
                  REALTIME DELIVERY PROGRESS
                </h4>
                
                {/* Timeline Render */}
                {o.status === "Cancelled" && (
                  <div className="flex items-center gap-3 bg-crimson/5 border border-crimson/20 p-4 rounded text-crimson font-bold text-xs uppercase tracking-wider">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>This order was cancelled. Product inventory count has been restored.</span>
                  </div>
                )}

                {o.status === "Returned" && (
                  <div className="flex items-center gap-3 bg-gray-50 border border-line p-4 rounded text-gray-500 font-bold text-xs uppercase tracking-wider">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                    <span>This order has been returned. A refund has been issued to the payment source.</span>
                  </div>
                )}

                {o.status !== "Cancelled" && o.status !== "Returned" && (
                  <div className="relative py-4 mb-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-0">
                    {/* Connector lines behind steps */}
                    <div className="hidden sm:block absolute left-[10%] right-[10%] h-0.5 bg-line -z-10 top-1/2 -translate-y-1/2" />
                    
                    {/* Dynamic segment progression coloring */}
                    <div className="hidden sm:flex absolute left-[10%] right-[10%] h-0.5 -z-10 top-1/2 -translate-y-1/2">
                      {STEPS.slice(0, -1).map((_, idx) => (
                        <div
                          key={idx}
                          className={`flex-1 h-full transition-all duration-300 ${getStepLineClass(o.status, idx)}`}
                        />
                      ))}
                    </div>

                    {STEPS.map((step, idx) => {
                      const statusClass = getStepStatusClass(o.status, step);
                      return (
                        <div key={step} className="flex flex-row sm:flex-col items-center sm:flex-1 text-left sm:text-center gap-3 sm:gap-0">
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] transition-all ${statusClass}`}>
                            {idx + 1}
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 sm:mt-2 block max-w-[80px]">
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>
          ))}
        </div>
      )}

    </section>
  );
}
