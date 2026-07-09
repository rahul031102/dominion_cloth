import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function ProductCard({ product }) {
  const { toggleWishlist, inWishlist } = useWishlist();
  const { showToast } = useToast();

  const discount =
    product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;

  const wished = inWishlist(product._id);

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggleWishlist(product._id);
    if (!res.success) {
      if (res.error === "auth") {
        showToast("Please sign in to manage wishlist.");
      } else {
        showToast("Connection error. Could not update wishlist.");
      }
    } else {
      showToast(res.action === "added" ? "Added to wishlist" : "Removed from wishlist");
    }
  };

  return (
    <Link 
      to={`/product/${product._id}`} 
      className="block bg-white border border-line hover:border-navy transition-all duration-300 group overflow-hidden rounded relative"
    >
      {/* Wishlist Heart Icon */}
      <button
        onClick={handleWishlistClick}
        className="absolute top-2.5 right-2.5 z-10 w-7 h-7 bg-white/80 hover:bg-white backdrop-blur-xs rounded-full flex items-center justify-center border border-line hover:border-navy transition-all shadow-xs"
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={wished ? "#E11D48" : "none"}
          stroke={wished ? "#E11D48" : "currentColor"}
          strokeWidth="2.5"
          className="transition-transform active:scale-75"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      <div className="relative aspect-[3/4] overflow-hidden bg-paper border-b border-line">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onLoad={(e) => e.currentTarget.classList.add("img-fade")}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
        />
        {product.tag && (
          <span
            className={`absolute top-2.5 left-2.5 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${
              product.tag === "Sale" 
                ? "bg-crimson text-white shadow-sm" 
                : "bg-navy text-white shadow-sm"
            }`}
          >
            {product.tag}
          </span>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="font-bold text-[12px] text-ink tracking-wide uppercase truncate">
          {product.brand}
        </h3>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {product.name}
        </p>
        
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-[13px] font-bold text-navy">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          {discount > 0 && (
            <>
              <span className="text-[10px] text-gray-400 line-through">
                ₹{product.mrp.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-crimson font-bold">
                ({discount}% OFF)
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
