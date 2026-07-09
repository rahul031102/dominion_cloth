import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";
import ProductGridSkeleton from "../components/ProductGridSkeleton.jsx";

const CATEGORIES = ["All", "New", "Shirts", "Polos", "T-Shirts", "Trousers", "Jeans", "Jackets", "Sweatshirts", "Shorts", "Sale"];
const BRANDS = ["Tommy Hilfiger", "Lacoste", "BOSS", "Calvin Klein", "Armani Exchange", "Michael Kors", "Emporio Armani", "Zara Man", "Levi's", "H&M"];
const SIZES = ["S", "M", "L", "XL", "30", "32", "34", "36"];
const COLORS = ["#000000", "#FFFFFF", "#1B2A4A", "#C9BFA6", "#3A3A32", "#14213D", "#5C1F26", "#1C1C1C", "#2E3A4E"];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters directly from URL query parameters
  const activeCategory = searchParams.get("cat") || "All";
  const searchQuery = searchParams.get("q") || "";
  const selectedBrands = searchParams.get("brand") ? searchParams.get("brand").split(",") : [];
  const selectedSizes = searchParams.get("size") ? searchParams.get("size").split(",") : [];
  const selectedColors = searchParams.get("color") ? searchParams.get("color").split(",") : [];
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page")) || 1;

  // Local inputs state for price inputs to prevent instant URL update on typing
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Sync inputs with URL parameter changes (e.g. on clear all)
  useEffect(() => {
    setMinPriceInput(minPrice);
    setMaxPriceInput(maxPrice);
  }, [minPrice, maxPrice]);

  // Update query parameters in the URL
  const updateUrlParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams);
    
    // Reset to page 1 on any filter change unless page is explicitly updated
    if (!updates.hasOwnProperty("page")) {
      nextParams.set("page", "1");
    }

    Object.entries(updates).forEach(([key, val]) => {
      if (val === "" || val === null || (Array.isArray(val) && val.length === 0)) {
        nextParams.delete(key);
      } else if (Array.isArray(val)) {
        nextParams.set(key, val.join(","));
      } else {
        nextParams.set(key, val.toString());
      }
    });

    setSearchParams(nextParams);
  };

  // Fetch products from server on searchParams change
  useEffect(() => {
    setLoading(true);
    const filterParams = {
      category: activeCategory === "All" ? "" : activeCategory,
      q: searchQuery,
      brand: selectedBrands.join(","),
      size: selectedSizes.join(","),
      color: selectedColors.join(","),
      minPrice,
      maxPrice,
      sort,
      pageNumber: page,
      pageSize: 8, // Page size of 8
    };

    fetchProducts(filterParams)
      .then((data) => {
        setProducts(data.products || []);
        setTotalPages(data.totalPages || data.pages || 1);
        setTotalResults(data.totalResults !== undefined ? data.totalResults : data.count || 0);
      })
      .catch((err) => {
        console.error(err);
        setProducts([]);
        setTotalPages(1);
        setTotalResults(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeCategory, searchQuery, searchParams]); // watch searchParams object

  const handleBrandChange = (brand) => {
    const nextBrands = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    updateUrlParams({ brand: nextBrands });
  };

  const handleSizeChange = (size) => {
    const nextSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    updateUrlParams({ size: nextSizes });
  };

  const handleColorToggle = (color) => {
    const nextColors = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
    updateUrlParams({ color: nextColors });
  };

  const applyPriceFilter = (e) => {
    e.preventDefault();
    updateUrlParams({ minPrice: minPriceInput, maxPrice: maxPriceInput });
  };

  const clearAllFilters = () => {
    const nextParams = new URLSearchParams();
    if (activeCategory !== "All") nextParams.set("cat", activeCategory);
    if (searchQuery) nextParams.set("q", searchQuery);
    nextParams.set("page", "1");
    setSearchParams(nextParams);
    setMinPriceInput("");
    setMaxPriceInput("");
  };

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-16 bg-paper text-ink font-body">
      
      {/* Search Header Banner */}
      <div className="border-b border-line pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-baseline gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider text-navy">
            {searchQuery ? `Search Results for "${searchQuery}"` : activeCategory === "All" ? "Shop All Collection" : `${activeCategory} Collection`}
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
            {loading ? "Loading items..." : `${totalResults} matches found`}
          </p>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SORT BY</label>
          <select
            value={sort}
            onChange={(e) => updateUrlParams({ sort: e.target.value })}
            className="text-xs font-bold uppercase tracking-wider bg-white border border-line rounded px-3 py-2 text-ink focus:outline-none focus:border-navy"
          >
            <option value="newest">New Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      {/* Horizontal Scroll Categories Strip */}
      <div className="cat-strip flex gap-2.5 overflow-x-auto mb-8 pb-1">
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            to={`/products${c !== "All" ? `?cat=${c}` : ""}`}
            className={`shrink-0 px-4 py-2 rounded-full border text-xs font-bold transition-all uppercase tracking-wider ${
              c === activeCategory
                ? "bg-navy text-white border-navy"
                : "bg-white border-line text-ink hover:border-navy hover:text-navy"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        
        {/* Left Column: Filter Panel (Desktop View) */}
        <div className="md:col-span-1 space-y-6">
          <div className="border border-line bg-white rounded p-5 space-y-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <h3 className="text-xs font-extrabold text-navy uppercase tracking-widest">FILTERS</h3>
              <button
                onClick={clearAllFilters}
                className="text-[10px] text-crimson font-bold uppercase hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Brands Filter */}
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">BRAND</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {BRANDS.map((b) => (
                  <label key={b} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 font-semibold uppercase hover:text-navy">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(b)}
                      onChange={() => handleBrandChange(b)}
                      className="accent-navy"
                    />
                    <span>{b}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">PRICE RANGE</h4>
              <form onSubmit={applyPriceFilter} className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-navy"
                />
                <span className="text-gray-400 font-sans">&ndash;</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full border border-line rounded px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-navy"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-navy text-white text-[10px] font-bold rounded uppercase hover:opacity-90"
                >
                  Go
                </button>
              </form>
            </div>

            {/* Sizes Filter */}
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">SIZE</h4>
              <div className="grid grid-cols-4 gap-1.5">
                {SIZES.map((sz) => {
                  const isSel = selectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      onClick={() => handleSizeChange(sz)}
                      className={`py-1.5 text-[10px] font-bold border rounded uppercase transition-all ${
                        isSel
                          ? "bg-navy text-white border-navy"
                          : "bg-white border-line text-ink hover:border-navy"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors Filter */}
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">COLOR</h4>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((col) => {
                  const isSel = selectedColors.includes(col);
                  return (
                    <button
                      key={col}
                      onClick={() => handleColorToggle(col)}
                      className={`w-6 h-6 rounded-full border border-line relative hover:scale-105 active:scale-95 transition-all flex items-center justify-center`}
                      style={{ background: col }}
                      aria-label={`Filter color ${col}`}
                    >
                      {isSel && (
                        <span className="absolute text-[8px] font-bold text-navy" style={{ color: col === "#FFFFFF" ? "#000" : "#FFF" }}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Catalog Grid */}
        <div className="md:col-span-3 space-y-10">
          
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white border border-line rounded p-8">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-navy opacity-80">
                <circle cx="12" cy="12" r="10" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wide">No items found matching the selected filters</h3>
              <p className="text-xs text-gray-500 mt-2 uppercase tracking-wider">Try clearing filters or search terms</p>
              <button
                onClick={clearAllFilters}
                className="mt-6 bg-navy text-white text-xs font-bold px-6 py-3 rounded uppercase tracking-wider hover:opacity-90 shadow"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 pt-6 border-t border-line/60">
              <button
                disabled={page === 1}
                onClick={() => updateUrlParams({ page: Math.max(1, page - 1) })}
                className="px-3.5 py-2 border border-line text-xs font-bold text-ink uppercase rounded hover:border-navy disabled:opacity-40 disabled:hover:border-line"
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const pNum = i + 1;
                const isAct = pNum === page;
                return (
                  <button
                    key={pNum}
                    onClick={() => updateUrlParams({ page: pNum })}
                    className={`w-9 h-9 border text-xs font-bold rounded flex items-center justify-center transition-all ${
                      isAct
                        ? "bg-navy text-white border-navy"
                        : "border-line bg-white text-ink hover:border-navy"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
              <button
                disabled={page === totalPages}
                onClick={() => updateUrlParams({ page: Math.min(totalPages, page + 1) })}
                className="px-3.5 py-2 border border-line text-xs font-bold text-ink uppercase rounded hover:border-navy disabled:opacity-40 disabled:hover:border-line"
              >
                Next
              </button>
            </div>
          )}

        </div>

      </div>

    </section>
  );
}
