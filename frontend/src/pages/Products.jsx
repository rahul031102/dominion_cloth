import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";
import ProductGridSkeleton from "../components/ProductGridSkeleton.jsx";

const CATEGORIES = ["All", "New", "Shirts", "Polos", "T-Shirts", "Trousers", "Jeans", "Jackets", "Sweatshirts", "Shorts", "Sale"];

export default function Products() {
  const [searchParams] = useSearchParams();
  const active = searchParams.get("cat") || "All";
  const searchQuery = searchParams.get("q") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProducts(active)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [active]);

  // Client-side search filtering
  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  });

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-16 page-enter bg-paper text-ink">
      
      {/* Title & Count Info */}
      <div className="border-b border-line pb-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-ink">
          {searchQuery ? `Search Results for "${searchQuery}"` : active === "All" ? "Shop All Collection" : `${active} Collection`}
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          {loading ? "Loading items..." : `${filteredProducts.length} items found`}
        </p>
      </div>

      {/* Horizontal Scroll Filter Pills */}
      <div className="cat-strip flex gap-2.5 overflow-x-auto mb-8 pb-1">
        {CATEGORIES.map((c) => {
          const isActive = c === active;
          return (
            <Link
              key={c}
              to={`/products${c !== "All" ? `?cat=${c}` : ""}`}
              className={`shrink-0 px-5 py-2 rounded border text-xs font-bold transition-all ${
                isActive
                  ? "bg-navy text-white border-navy"
                  : "bg-white border-line text-ink hover:border-navy hover:text-navy"
              }`}
            >
              {c}
            </Link>
          );
        })}
      </div>

      {/* Products Grid */}
      {loading ? (
        <ProductGridSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => <ProductCard key={p._id} product={p} />)
          ) : (
            <div className="col-span-4 text-center py-20 bg-white border border-line rounded">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-navy">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-sm font-bold text-ink uppercase">No items found matching search query</p>
              <Link to="/products" className="mt-4 inline-block bg-navy text-white text-xs font-bold px-5 py-2.5 rounded hover:opacity-90 transition-all uppercase">
                View All Products
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
