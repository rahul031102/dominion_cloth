import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProducts } from "../api/products.js";
import ProductCard from "../components/ProductCard.jsx";
import ProductGridSkeleton from "../components/ProductGridSkeleton.jsx";

const CATEGORIES = ["All", "New", "Shirts", "Polos", "T-Shirts", "Trousers", "Jeans", "Jackets", "Sweatshirts", "Shorts", "Sale"];
const BRANDS = ["Tommy Hilfiger", "Lacoste", "BOSS", "Calvin Klein", "Armani Exchange", "Michael Kors", "Emporio Armani", "Zara Man", "Levi's", "H&M"];

export default function Home() {
  const [newIn, setNewIn] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts("New")
      .then(setNewIn)
      .catch(() => setNewIn([]))
      .finally(() => setLoading(false));
  }, []);

  const budgetBargains = [
    { cat: "Shirts", label: "UNDER ₹1699", img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=400&auto=format&fit=crop" },
    { cat: "Polos", label: "UNDER ₹3499", img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=400&auto=format&fit=crop" },
    { cat: "T-Shirts", label: "UNDER ₹1999", img: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=400&auto=format&fit=crop" },
    { cat: "Jeans", label: "UNDER ₹5499", img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=400&auto=format&fit=crop" },
    { cat: "Jackets", label: "UNDER ₹3999", img: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=400&auto=format&fit=crop" },
    { cat: "Shorts", label: "UNDER ₹1999", img: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=400&auto=format&fit=crop" },
  ];

  return (
    <div className="page-enter bg-paper text-ink">
      
      {/* 1. Classic Navy Hero Savings Banner (Explicit Hex backgrounds to ensure Tailwind v3 parses correctly) */}
      <section className="relative w-full bg-[#1B2A4A] py-10 md:py-16 px-4 overflow-hidden flex flex-col md:flex-row items-center justify-between border-b border-line text-white shadow-sm">
        <div className="relative z-10 max-w-xl text-center md:text-left md:pl-12">
          <div className="inline-block bg-crimson text-white font-bold text-xs uppercase px-3 py-1 rounded-sm mb-4 tracking-widest shadow-md">
            SAVINGS SALE LIVE
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-wide mb-2 text-white">
            Offers You Can't <span className="text-paper select-none font-semibold">Resist</span>
          </h2>
          <p className="text-sm md:text-base text-white/80 font-medium mb-8 max-w-md">
            Explore premium lifestyle selections tailored to your taste. Classic fits from top brands now on sale.
          </p>
          
          <div className="flex justify-center md:justify-start gap-4">
            <Link 
              to="/products?cat=Shirts" 
              className="bg-white text-navy font-bold px-6 py-2.5 rounded-full text-xs uppercase hover:bg-paper transition-all transform hover:scale-105 flex items-center gap-1.5 shadow-md"
            >
              Shop Him <span className="font-sans">&rarr;</span>
            </Link>
            <Link 
              to="/products?cat=Jackets" 
              className="bg-transparent border border-white text-white hover:bg-white/10 font-bold px-6 py-2.5 rounded-full text-xs uppercase transition-all transform hover:scale-105 flex items-center gap-1.5 shadow-sm"
            >
              Shop Her <span className="font-sans">&rarr;</span>
            </Link>
          </div>
        </div>

        <div className="relative z-10 hidden md:block w-full max-w-md pr-12">
          {/* Collages with subtle borders */}
          <div className="flex gap-4 items-center justify-end">
            <img 
              src="https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=300"
              alt="Model 1" 
              className="w-32 h-44 object-cover rounded-lg border border-white/20 shadow-2xl rotate-[-4deg] hover:rotate-0 transition-all" 
            />
            <img 
              src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=300"
              alt="Model 2" 
              className="w-36 h-48 object-cover rounded-lg border-2 border-white shadow-2xl scale-105 z-10 hover:scale-110 transition-all" 
            />
            <img 
              src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=300"
              alt="Model 3" 
              className="w-32 h-44 object-cover rounded-lg border border-white/20 shadow-2xl rotate-[4deg] hover:rotate-0 transition-all" 
            />
          </div>
        </div>
      </section>

      {/* 2. Card Discount Offer Bar */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="border border-line bg-white rounded px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <span className="bg-[#1B2A4A]/10 border border-[#1B2A4A]/25 text-navy font-bold text-[9px] px-2 py-0.5 rounded">BOBCARD</span>
              <span className="bg-[#1B2A4A]/10 border border-[#1B2A4A]/25 text-navy font-bold text-[9px] px-2 py-0.5 rounded">HSBC</span>
              <span className="bg-[#1B2A4A]/10 border border-[#1B2A4A]/25 text-navy font-bold text-[9px] px-2 py-0.5 rounded">SBI CARD</span>
            </div>
            <p className="text-xs md:text-sm font-bold text-gray-700">
              10% Instant Discount on credit cards & net banking. Min purchase ₹2,999.
            </p>
          </div>
          <Link to="/products" className="text-xs font-bold text-navy hover:text-crimson uppercase tracking-wider shrink-0 underline">
            Shop Now &rarr;
          </Link>
        </div>
      </section>

      {/* 3. Budget Bargains Category Highlights */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h3 className="text-xl md:text-2xl font-bold uppercase text-navy tracking-widest">
            BUDGET BARGAINS
          </h3>
          <div className="w-12 h-0.5 bg-navy mx-auto mt-2 rounded-full" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {budgetBargains.map((b) => (
            <Link 
              key={b.cat} 
              to={`/products?cat=${b.cat}`}
              className="bg-white border border-line rounded overflow-hidden group shadow-sm hover:border-navy hover:shadow-md transition-all duration-300 relative"
            >
              <div className="aspect-[1/1] overflow-hidden bg-paper border-b border-line">
                <img 
                  src={b.img} 
                  alt={b.cat} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 text-center bg-white">
                <h4 className="font-bold text-xs text-ink uppercase tracking-wide truncate">
                  {b.cat}
                </h4>
                <p className="font-extrabold text-[11px] text-crimson mt-1 tracking-wider">
                  {b.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Horizontal Categories Strip */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-6 border-t border-line border-b mb-8 bg-white/40">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3.5">
          Browse Hot Categories
        </p>
        <div className="cat-strip flex gap-2.5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to={`/products${c !== "All" ? `?cat=${c}` : ""}`}
              className="shrink-0 px-4 py-1.5 rounded border border-line bg-white text-xs font-semibold text-ink hover:border-navy hover:text-navy transition-colors"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Brands We Stock */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-6">
        <p className="text-[9px] uppercase font-bold tracking-widest text-gray-500 mb-3">Brands in Focus</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-gray-700 font-bold uppercase tracking-wider">
          {BRANDS.map((b) => (
            <span key={b} className="bg-white px-3 py-1 rounded border border-line hover:text-navy transition-colors cursor-pointer">{b}</span>
          ))}
        </div>
      </section>

      {/* 6. Products Grid (New In) */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16 pt-6">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide border-l-4 border-navy pl-3 text-ink">
            NEW IN STORE
          </h2>
          <Link to="/products" className="text-xs font-bold text-navy hover:underline uppercase tracking-wider">
            View All &rarr;
          </Link>
        </div>
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newIn.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
