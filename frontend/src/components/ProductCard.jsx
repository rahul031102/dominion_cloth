import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const discount =
    product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;

  return (
    <Link 
      to={`/product/${product._id}`} 
      className="block bg-white border border-line hover:border-navy transition-all duration-300 group overflow-hidden rounded"
    >
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
