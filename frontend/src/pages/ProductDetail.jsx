import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProductById, fetchProducts } from "../api/products.js";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import ProductCard from "../components/ProductCard.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setProduct(null);
    fetchProductById(id)
      .then((p) => {
        if (!p) {
          setLoading(false);
          return;
        }
        setProduct(p);
        setSelectedSize(p.sizes?.[0] || null);
        setLoading(false);
        fetchProducts(p.category)
          .then((all) => setRelated(all.filter((x) => x._id !== p._id).slice(0, 4)))
          .catch(() => setRelated([]));
      })
      .catch(() => {
        setProduct(null);
        setLoading(false);
      });
  }, [id]);

  const handleAdd = () => {
    addToCart(product, selectedSize);
    showToast(`Added "${product.name}" to your bag`);
  };

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-20 bg-paper text-ink">
        <div className="skeleton h-4 w-24 rounded mb-6" />
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          <div className="skeleton rounded aspect-[3/4]" />
          <div>
            <div className="skeleton h-3 w-20 rounded mb-3" />
            <div className="skeleton h-10 w-3/4 rounded mb-4" />
            <div className="skeleton h-5 w-32 rounded mb-6" />
            <div className="skeleton h-16 w-full rounded mb-6" />
            <div className="skeleton h-12 w-full rounded" />
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-24 text-center bg-paper text-ink font-body">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-navy">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Product Not Found</h2>
        <p className="text-xs text-gray-500 mt-2">The product you are looking for might have been removed or does not exist.</p>
        <Link to="/products" className="mt-6 inline-block bg-navy text-white text-xs font-bold px-6 py-3 rounded uppercase tracking-wider hover:opacity-90 transition-all">
          Back to Shop
        </Link>
      </section>
    );
  }

  const discount =
    product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-28 md:pb-20 page-enter bg-paper text-ink font-body">
      {/* Breadcrumb navigation */}
      <div className="text-xs text-gray-400 mb-6 flex items-center gap-1.5 font-semibold">
        <Link to="/" className="hover:text-navy">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-navy">Shop</Link>
        <span>/</span>
        <Link to={`/products?cat=${product.category}`} className="hover:text-navy">{product.category}</Link>
        <span>/</span>
        <span className="text-ink font-bold truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-10 md:gap-16">
        {/* Left Column: Product Image */}
        <div className="rounded border border-line overflow-hidden bg-white aspect-[3/4] md:sticky md:top-28 h-max shadow-sm">
          <img
            src={product.image}
            alt={product.name}
            onLoad={(e) => e.currentTarget.classList.add("img-fade")}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Column: Product Info details */}
        <div className="md:sticky md:top-28 h-max">
          <h1 className="font-extrabold text-xl md:text-2xl text-ink tracking-wide uppercase">
            {product.brand}
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 mb-3">
            {product.name}
          </p>

          {/* Rating Badge */}
          <div className="inline-flex items-center gap-1.5 border border-line bg-white rounded px-2.5 py-1 text-xs font-bold text-navy mb-5 cursor-pointer">
            <span>4.3</span>
            <span className="text-navy text-xs">★</span>
            <span className="text-line">|</span>
            <span className="text-gray-500 font-normal">842 Ratings</span>
          </div>

          <hr className="border-line mb-4" />

          {/* Pricing Box */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2.5">
              <span className="text-xl font-bold text-ink">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-gray-400 line-through text-xs">
                    ₹{product.mrp.toLocaleString("en-IN")}
                  </span>
                  <span className="text-crimson text-xs font-bold">
                    ({discount}% OFF)
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-navy font-bold mt-1 uppercase tracking-wide">
              inclusive of all taxes
            </p>
          </div>

          {/* Product Description */}
          <div className="mb-6 bg-white border border-line p-4 rounded text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1.5 text-navy">Product Description</h4>
            <p className="text-gray-600 leading-relaxed font-sans text-xs">
              {product.description}
            </p>
          </div>

          {product.colors?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Select Color</p>
              <div className="flex gap-2.5">
                {product.colors.map((c, i) => (
                  <button
                    key={i}
                    className="w-8 h-8 rounded-full border border-line hover:scale-110 active:scale-95 transition-all shadow-sm"
                    style={{ background: c }}
                    aria-label={`Color dot ${c}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider mb-2.5 text-gray-500">Select Size</p>
            <div className="flex gap-3 flex-wrap">
              {(product.sizes || []).map((s) => {
                const isSelected = selectedSize === s;
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`w-10 h-10 rounded-full border text-xs font-bold transition-all flex items-center justify-center ${
                      isSelected
                        ? "bg-navy text-white border-navy scale-105 shadow-sm"
                        : "border-line bg-white text-ink hover:border-navy hover:text-navy"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons row */}
          <div className="hidden md:flex gap-4 mb-3">
            <button
              onClick={handleAdd}
              className="flex-1 py-3.5 text-xs uppercase tracking-wider font-extrabold bg-navy text-white hover:opacity-90 active:scale-95 transition-all rounded shadow-md flex items-center justify-center gap-2"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Add to Bag
            </button>
            <Link
              to="/products"
              className="flex-1 py-3.5 text-xs uppercase tracking-wider font-extrabold border border-line text-ink bg-white hover:border-navy hover:text-navy rounded transition-colors flex items-center justify-center gap-2"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              Wishlist
            </Link>
          </div>
          <p className="hidden md:block text-[11px] text-gray-500 text-center font-semibold">
            Easy 14 days returns · Free delivery on orders above ₹2,999
          </p>
        </div>
      </div>

      {/* Similar items */}
      {related.length > 0 && (
        <div className="mt-20 border-t border-line pt-12">
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide border-l-4 border-navy pl-3 text-ink mb-6">
            SIMILAR PRODUCTS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((r) => (
              <ProductCard key={r._id} product={r} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky mobile add-to-bag bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-line px-4 py-3 flex items-center justify-between shadow-2xl gap-3">
        <div className="shrink-0 pl-1 font-mono">
          <p className="text-xs font-bold text-ink">₹{product.price.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-navy font-bold uppercase">Size: {selectedSize || "N/A"}</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex-1 py-3 text-xs uppercase tracking-wider font-extrabold bg-navy text-white rounded active:scale-95 shadow-md flex items-center justify-center gap-1.5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          Add to Bag
        </button>
      </div>
    </section>
  );
}
