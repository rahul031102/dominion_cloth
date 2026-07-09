import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { fetchMyOrders } from "../api/products.js";

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

  const getStepStatusClass = (orderStatus, step) => {
    const steps = ["Processing", "Dispatched", "Delivered"];
    const currentIndex = steps.indexOf(orderStatus || "Processing");
    const stepIndex = steps.indexOf(step);

    if (stepIndex <= currentIndex) {
      return "bg-navy text-white border-navy";
    }
    return "bg-white text-gray-400 border-line";
  };

  const getStepLineClass = (orderStatus, step) => {
    const steps = ["Processing", "Dispatched", "Delivered"];
    const currentIndex = steps.indexOf(orderStatus || "Processing");
    const stepIndex = steps.indexOf(step);

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
    <section className="max-w-4xl mx-auto px-4 md:px-8 py-10 page-enter bg-paper text-ink font-body">
      
      {/* Title */}
      <div className="border-b border-line pb-4 mb-8">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-navy">
          My Order History
        </h1>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
          Review recent transactions, tracking details, and items dispatched
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-line rounded shadow-sm">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-navy opacity-80">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
            <path d="M12 14v4" />
            <path d="M10 18h4" />
          </svg>
          <h2 className="text-base font-bold text-ink uppercase tracking-wider">No Orders Placed Yet</h2>
          <p className="text-xs text-gray-500 mt-2.5 uppercase tracking-wider leading-relaxed">
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
              <div className="bg-[#F4F2EC]/40 border-b border-line px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="grid grid-cols-2 md:flex md:gap-8 gap-4 font-semibold text-gray-600">
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

                <div className="flex gap-2.5">
                  <span className="px-3 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest border bg-navy/5 text-navy border-navy/20">
                    Payment: {o.paymentStatus}
                  </span>
                  <span className={`px-3 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest border ${
                    o.status === "Delivered" 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-[#1B2A4A]/5 text-navy border-[#1B2A4A]/10"
                  }`}>
                    {o.status || "Processing"}
                  </span>
                </div>
              </div>

              {/* Order Card Body */}
              <div className="p-5 grid md:grid-cols-3 gap-8">
                
                {/* Items column */}
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest mb-1">
                    ORDER MANIFEST DETAILS
                  </h4>
                  <div className="space-y-3.5">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center bg-paper/20 p-2 border border-line/50 rounded">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs uppercase text-ink tracking-wide truncate">{item.name}</h5>
                          <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">
                            Size: {item.size} · Qty: {item.qty}
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
                </div>

              </div>

              {/* Tracker Timeline Footer */}
              <div className="border-t border-line px-5 py-4 bg-white">
                <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest mb-4">
                  REALTIME DELIVERY PROGRESS
                </h4>
                
                <div className="flex items-center w-full max-w-lg mx-auto relative py-2 mb-2">
                  {/* Progress Line */}
                  <div className="absolute left-0 right-0 h-0.5 top-1/2 -translate-y-1/2 bg-line -z-10" />
                  
                  {/* Dynamic Colored Lines */}
                  <div 
                    className={`absolute left-0 h-0.5 top-1/2 -translate-y-1/2 ${getStepLineClass(o.status, "Dispatched")} -z-10`}
                    style={{ width: "50%" }}
                  />
                  <div 
                    className={`absolute left-[50%] h-0.5 top-1/2 -translate-y-1/2 ${getStepLineClass(o.status, "Delivered")} -z-10`}
                    style={{ width: "50%" }}
                  />

                  {/* Processing Step */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-colors ${getStepStatusClass(o.status, "Processing")}`}>
                      1
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mt-2">Processing</span>
                  </div>

                  {/* Dispatched Step */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-colors ${getStepStatusClass(o.status, "Dispatched")}`}>
                      2
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mt-2">Dispatched</span>
                  </div>

                  {/* Delivered Step */}
                  <div className="flex flex-col items-center flex-1 relative">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-colors ${getStepStatusClass(o.status, "Delivered")}`}>
                      3
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mt-2">Delivered</span>
                  </div>

                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </section>
  );
}
