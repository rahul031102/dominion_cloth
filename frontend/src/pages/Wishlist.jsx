import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getProductImage } from "../utils/images.js";

export default function Wishlist() {
  const { wishlist, toggleWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Size selection popup state
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleMoveToBag = (product, size) => {
    // Add to cart
    addToCart(product, size);
    // Remove from wishlist
    toggleWishlist(product._id);
    setSelectedProduct(null);
    showToast(`Moved "${product.name}" to your bag.`);
  };

  const handleRemove = async (productId) => {
    await toggleWishlist(productId);
    showToast("Removed item from wishlist.");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 text-center text-gray-500 bg-paper">
        <div className="skeleton h-12 w-48 mx-auto rounded mb-8" />
        <div className="skeleton h-48 w-full rounded" />
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-10 page-enter bg-paper text-ink font-body relative">
      
      {/* Title */}
      <div className="border-b border-line pb-4 mb-8">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-navy">
          My Wishlist
        </h1>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
          {wishlist.length} Items wishlisted
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-20 bg-white border border-line rounded p-8 shadow-xs">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-navy opacity-80">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <h2 className="text-base font-bold text-ink uppercase tracking-wider">Your wishlist is empty</h2>
          <p className="text-xs text-gray-500 mt-2.5 uppercase tracking-wider leading-relaxed">
            Bookmark items you love to save them for later checkouts.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-block bg-navy text-white text-xs font-bold px-6 py-3 rounded uppercase tracking-wider hover:opacity-90 transition-all shadow"
          >
            Explore catalogue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {wishlist.map((p) => {
            if (!p || !p.name) return null; // Safeguard empty optimistic elements
            const discount = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
            return (
              <div
                key={p._id}
                className="bg-white border border-line rounded overflow-hidden flex flex-col group relative shadow-xs hover:border-navy hover:shadow-md transition-all duration-300"
              >
                
                {/* Close/Remove Button */}
                <button
                  onClick={() => handleRemove(p._id)}
                  className="absolute top-2.5 right-2.5 z-10 w-7 h-7 bg-white/80 hover:bg-white backdrop-blur-xs rounded-full flex items-center justify-center border border-line hover:border-navy transition-all shadow-xs"
                  aria-label="Remove item"
                >
                  <span className="text-ink font-semibold text-sm leading-none">&times;</span>
                </button>

                {/* Image & Tag */}
                <Link to={`/product/${p._id}`} className="block relative aspect-[3/4] overflow-hidden bg-paper border-b border-line">
                  <img
                    src={getProductImage(p)}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  {p.tag && (
                    <span className="absolute top-2.5 left-2.5 text-[8px] font-bold bg-navy text-white px-2 py-0.5 rounded-sm uppercase tracking-wide">
                      {p.tag}
                    </span>
                  )}
                </Link>

                {/* Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-[12px] text-ink uppercase tracking-wide truncate">{p.brand}</h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{p.name}</p>
                    
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[13px] font-bold text-navy">₹{p.price.toLocaleString("en-IN")}</span>
                      {discount > 0 && (
                        <>
                          <span className="text-[10px] text-gray-400 line-through">₹{p.mrp.toLocaleString("en-IN")}</span>
                          <span className="text-[10px] text-crimson font-bold">({discount}% OFF)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-line/60 pt-3">
                    <button
                      onClick={() => setSelectedProduct(p)}
                      className="w-full py-2 bg-navy text-white text-[10px] font-bold uppercase tracking-widest rounded hover:opacity-90 transition-all flex items-center justify-center gap-1 shadow-xs"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      Move to bag
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Select Size Popup Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-line rounded-lg shadow-2xl max-w-sm w-full p-6 animate-scale-up text-ink font-body">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-navy">Select Size</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-navy text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider mb-4">
              Choose a size to move <strong className="text-navy">{selectedProduct.name}</strong> to your shopping bag.
            </p>

            <div className="flex gap-2 flex-wrap mb-6">
              {(selectedProduct.sizes || ["S", "M", "L", "XL"]).map((sz) => (
                <button
                  key={sz}
                  onClick={() => handleMoveToBag(selectedProduct, sz)}
                  className="w-10 h-10 border border-line hover:border-navy text-xs font-bold rounded-full flex items-center justify-center transition-all hover:bg-navy hover:text-white"
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
