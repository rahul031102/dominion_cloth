import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function CartDrawer() {
  const { cart, changeQty, removeFromCart, subtotal, isOpen, setIsOpen } = useCart();
  const navigate = useNavigate();

  return (
    <>
      {/* Dark overlay backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      
      {/* Off-white sliding drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white text-ink z-50 flex flex-col shadow-2xl border-l border-line transition-transform duration-400 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 h-20 border-b border-line bg-paper">
          <div className="flex items-baseline gap-2">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-navy">YOUR SHOPPING BAG</h2>
            <span className="text-xs font-semibold text-gray-500">({cart.reduce((sum, item) => sum + item.qty, 0)} Items)</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-ink hover:text-navy border border-line hover:border-navy transition-all rounded px-2.5 py-1 text-xs leading-none"
          >
            &times;
          </button>
        </div>

        {/* Drawer Scroll Area (Items) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-paper/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-24">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 text-navy">
                <path d="M6 7h12l-1 13H7L6 7Z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
              <p className="text-sm font-semibold text-ink">Your bag is empty!</p>
              <p className="text-xs text-gray-400 mt-1 uppercase mb-6">Add items to it now to build your style.</p>
              <button 
                onClick={() => { setIsOpen(false); navigate("/products"); }}
                className="bg-navy text-white text-xs font-bold px-6 py-2.5 rounded shadow hover:opacity-90 transition-all uppercase"
              >
                Shop Now
              </button>
            </div>
          ) : (
            cart.map((c) => (
              <div key={`${c.product._id}-${c.size}`} className="flex gap-4 border-b border-line pb-4 last:border-0 last:pb-0">
                <img
                  src={c.product.image}
                  alt={c.product.name}
                  className="w-20 h-24 object-cover rounded bg-paper border border-line"
                />
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-ink truncate max-w-[180px]">{c.product.brand}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{c.product.name}</p>
                        <p className="text-[11px] text-navy font-bold mt-1 uppercase tracking-wider">Size: {c.size}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(c.product._id, c.size)}
                        className="text-gray-400 hover:text-navy text-lg leading-none p-1 transition-colors"
                        aria-label="Remove item"
                      >
                        &times;
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs font-bold text-ink">
                      ₹{(c.product.price * c.qty).toLocaleString("en-IN")}
                    </p>
                    
                    {/* Qty selectors */}
                    <div className="flex items-center gap-2 border border-line rounded px-2 py-1 bg-paper">
                      <button
                        onClick={() => changeQty(c.product._id, c.size, -1)}
                        className="w-5 h-5 flex items-center justify-center text-xs font-bold text-ink hover:text-navy rounded active:scale-95 transition-all"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-ink px-1">{c.qty}</span>
                      <button
                        onClick={() => changeQty(c.product._id, c.size, 1)}
                        className="w-5 h-5 flex items-center justify-center text-xs font-bold text-ink hover:text-navy rounded active:scale-95 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer (Summary & Place Order) */}
        <div className="border-t border-line px-6 py-5 bg-paper">
          <div className="flex justify-between items-center text-xs font-bold text-ink mb-4">
            <span className="uppercase tracking-wider">Total Amount</span>
            <span className="text-sm text-navy">₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          
          <button
            disabled={cart.length === 0}
            onClick={() => {
              setIsOpen(false);
              navigate("/checkout");
            }}
            className="w-full py-3.5 text-xs font-bold uppercase tracking-wider bg-navy text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all rounded shadow-md flex items-center justify-center gap-1.5"
          >
            Checkout Securely
          </button>
        </div>
      </aside>
    </>
  );
}
