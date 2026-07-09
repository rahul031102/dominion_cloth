import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProductById, fetchProducts, createProductReviewApi } from "../api/products.js";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import ProductCard from "../components/ProductCard.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { toggleWishlist, inWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review states
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast("Please enter a comment.");
      return;
    }
    setSubmittingReview(true);
    try {
      await createProductReviewApi(product._id, { rating, comment });
      showToast("Review submitted successfully!");
      setComment("");
      setRating(5);
      // Re-fetch product
      const updatedProduct = await fetchProductById(id);
      setProduct(updatedProduct);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Variant & Image States
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [zoomStyle, setZoomStyle] = useState({ display: "none" });

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
        setSelectedColor(p.colors?.[0] || null);
        setSelectedSize(p.sizes?.[0] || null);
        setActiveImage(p.image);
        setLoading(false);

        fetchProducts(p.category)
          .then((all) => setRelated(all.products ? all.products.filter((x) => x._id !== p._id).slice(0, 4) : []))
          .catch(() => setRelated([]));
      })
      .catch(() => {
        setProduct(null);
        setLoading(false);
      });
  }, [id]);

  const handleAdd = () => {
    if (!selectedSize || !selectedColor) {
      showToast("Please choose a size and color first.");
      return;
    }

    const matchedVariant = product.variants?.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    );
    const stockCount = matchedVariant ? matchedVariant.stock : 0;
    if (stockCount === 0) {
      showToast("Selected option combo is Out of Stock!");
      return;
    }

    addToCart(product, selectedSize, selectedColor);
    showToast(`Added "${product.name}" to your bag`);
  };

  const handleWishlistToggle = async () => {
    const res = await toggleWishlist(product._id);
    if (!res.success) {
      if (res.error === "auth") {
        showToast("Please sign in to add items to your wishlist.");
      } else {
        showToast("Connection error. Could not update wishlist.");
      }
    } else {
      showToast(res.action === "added" ? "Added to wishlist" : "Removed from wishlist");
    }
  };

  // Image Hover Zoom Handler
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: "block",
      backgroundImage: `url(${activeImage})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: "220%",
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: "none" });
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

  // Check matched variant stock
  const activeVariant = product.variants?.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );
  const variantStock = activeVariant ? activeVariant.stock : 0;
  const isOutOfStock = variantStock === 0;

  const wished = inWishlist(product._id);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-28 md:pb-20 page-enter bg-paper text-ink font-body">
      {/* Breadcrumbs */}
      <div className="text-xs text-gray-400 mb-6 flex items-center gap-1.5 font-semibold">
        <Link to="/" className="hover:text-navy">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-navy">Shop</Link>
        <span>/</span>
        <Link to={`/products?cat=${product.category}`} className="hover:text-navy">{product.category}</Link>
        <span>/</span>
        <span className="text-ink font-bold truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-12 gap-8 md:gap-12">
        {/* Left Column: Image Gallery Thumbnails */}
        <div className="md:col-span-1 flex md:flex-col gap-2 order-2 md:order-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          {(product.images || [product.image]).map((img, idx) => {
            const isSelected = img === activeImage;
            return (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                onMouseEnter={() => setActiveImage(img)}
                className={`w-14 h-18 md:w-full aspect-[3/4] border rounded overflow-hidden shrink-0 transition-all ${
                  isSelected ? "border-navy opacity-100" : "border-line opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>

        {/* Center Column: Zoomable Main Image Display */}
        <div className="md:col-span-6 order-1 md:order-2">
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="rounded border border-line overflow-hidden bg-white aspect-[3/4] shadow-sm relative cursor-zoom-in group select-none"
          >
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-200"
            />
            {/* Zoom Overlay panel */}
            <div
              style={zoomStyle}
              className="absolute inset-0 bg-no-repeat pointer-events-none border border-line bg-white"
            />
          </div>
        </div>

        {/* Right Column: Variant & Detail Specs */}
        <div className="md:col-span-5 order-3 h-max">
          <h1 className="font-extrabold text-xl md:text-2xl text-ink tracking-wide uppercase">
            {product.brand}
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 mb-3">
            {product.name}
          </p>

          {/* Rating Badge */}
          <div className="inline-flex items-center gap-1.5 border border-line bg-white rounded px-2.5 py-1 text-xs font-bold text-navy mb-5 cursor-pointer">
            <span>{product.rating ? product.rating.toFixed(1) : "0.0"}</span>
            <span className="text-navy text-xs">★</span>
            <span className="text-line">|</span>
            <span className="text-gray-500 font-normal">{product.numReviews || 0} Ratings</span>
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

          {/* Description */}
          <div className="mb-6 bg-white border border-line p-4 rounded text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1.5 text-navy">Product Description</h4>
            <p className="text-gray-600 leading-relaxed font-sans text-xs">
              {product.description}
            </p>
          </div>

          {/* Colors Selection */}
          {product.colors?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Select Color</p>
              <div className="flex gap-2.5">
                {product.colors.map((c, i) => {
                  const isSelected = selectedColor === c;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedColor(c)}
                      className={`w-8 h-8 rounded-full border relative transition-all shadow-sm ${
                        isSelected ? "scale-110 border-navy border-2 shadow-md" : "border-line hover:scale-105"
                      }`}
                      style={{ background: c }}
                      aria-label={`Color dot ${c}`}
                    >
                      {isSelected && (
                        <span
                          className="absolute text-[8px] font-bold"
                          style={{
                            color: c === "#FFFFFF" ? "#000" : "#FFF",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes Selection */}
          <div className="mb-6">
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

          {/* Stock Availability status */}
          <div className="mb-6">
            {isOutOfStock ? (
              <span className="text-xs font-bold text-crimson uppercase tracking-widest px-2.5 py-1 bg-crimson/5 border border-crimson/20 rounded">
                Out Of Stock
              </span>
            ) : (
              <span className="text-xs font-bold text-green-700 uppercase tracking-widest px-2.5 py-1 bg-green-50 border border-green-200 rounded">
                In Stock ({variantStock} items remaining)
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex gap-4 mb-3">
            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className="flex-1 py-3.5 text-xs uppercase tracking-wider font-extrabold bg-navy text-white hover:opacity-90 active:scale-95 transition-all rounded shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Add to Bag
            </button>

            <button
              onClick={handleWishlistToggle}
              className={`flex-1 py-3.5 text-xs uppercase tracking-wider font-extrabold border rounded transition-all flex items-center justify-center gap-2 ${
                wished
                  ? "bg-crimson/5 text-crimson border-crimson/35"
                  : "border-line text-ink bg-white hover:border-navy hover:text-navy"
              }`}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill={wished ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wished ? "Wishlisted" : "Wishlist"}
            </button>
          </div>

          <p className="hidden md:block text-[11px] text-gray-500 text-center font-semibold mt-4">
            Easy 14 days returns · Free delivery on orders above ₹2,999
          </p>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 border-t border-line pt-12 grid md:grid-cols-12 gap-10">
        
        {/* Left Column: Review Summary & Write Form */}
        <div className="md:col-span-5 space-y-8">
          <div>
            <h2 className="text-lg font-bold uppercase tracking-wide border-l-4 border-navy pl-3 text-ink mb-4">
              Ratings & Reviews
            </h2>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-navy">
                {product.rating ? product.rating.toFixed(1) : "0.0"}
              </span>
              <div className="space-y-1">
                <div className="flex text-amber-500 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-xs">
                      {i < Math.round(product.rating || 0) ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 font-semibold uppercase">
                  Based on {product.numReviews || 0} reviews
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-line p-5 rounded-lg shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">
              Write a Product Review
            </h3>
            {user ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                    Your Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-xl focus:outline-none transition-all ${
                          star <= rating ? "text-amber-500 scale-110" : "text-gray-300 hover:text-amber-400"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                    Your Review
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like or dislike about this product?"
                    className="w-full border border-line rounded px-3 py-2 text-xs bg-white text-ink focus:outline-none focus:border-navy"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 bg-navy text-white text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {submittingReview ? "SUBMITTING..." : "SUBMIT REVIEW"}
                </button>
              </form>
            ) : (
              <div className="text-center py-4 bg-paper rounded border border-line">
                <p className="text-xs text-gray-500 font-semibold mb-3 uppercase">
                  Please sign in to write a review.
                </p>
                <Link
                  to={`/login?redirect=/products/${product._id}`}
                  className="inline-block bg-navy text-white text-[10px] font-bold px-4 py-2 rounded uppercase tracking-wider hover:opacity-90"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reviews List */}
        <div className="md:col-span-7 space-y-4 max-h-[500px] overflow-y-auto pr-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 font-body">
            Customer Comments
          </h3>
          {!product.reviews || product.reviews.length === 0 ? (
            <div className="text-center py-10 bg-white border border-line border-dashed rounded-lg text-gray-400 font-medium text-xs uppercase tracking-wide">
              No reviews yet. Be the first to share your thoughts!
            </div>
          ) : (
            product.reviews.map((r, i) => (
              <div key={i} className="bg-white border border-line p-4 rounded-lg shadow-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-bold text-ink uppercase tracking-wide">
                      {r.name}
                    </h5>
                    <div className="flex text-amber-500 text-[10px] mt-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx}>{idx < r.rating ? "★" : "☆"}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-sans">
                  {r.comment}
                </p>
              </div>
            ))
          )}
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

      {/* Sticky Mobile Add to Bag Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-line px-4 py-3 flex items-center justify-between shadow-2xl gap-3">
        <div className="shrink-0 pl-1 font-mono">
          <p className="text-xs font-bold text-ink">₹{product.price.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-navy font-bold uppercase">Stock: {variantStock}</p>
        </div>
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className="flex-1 py-3 text-xs uppercase tracking-wider font-extrabold bg-navy text-white rounded active:scale-95 shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
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
