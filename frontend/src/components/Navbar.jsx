import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

export default function Navbar() {
  const { count, setIsOpen } = useCart();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { wishlist } = useWishlist();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState("");

  // Sync search input with URL query param
  useEffect(() => {
    setSearchVal(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchVal.trim())}`);
    } else {
      navigate("/products");
    }
  };

  const navLinks = [
    { to: "/products?cat=Shirts", label: "Shirts" },
    { to: "/products?cat=Polos", label: "Polos" },
    { to: "/products?cat=T-Shirts", label: "T-Shirts" },
    { to: "/products?cat=Trousers", label: "Trousers" },
    { to: "/products?cat=Jeans", label: "Jeans" },
    { to: "/products?cat=Jackets", label: "Jackets" },
    { to: "/products?cat=Sweatshirts", label: "Sweatshirts" },
    { to: "/products?cat=Shorts", label: "Shorts" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-line shadow-sm">
        {/* Top Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-20">
          
          {/* Left: Mobile Menu Trigger & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden text-ink p-1.5 hover:bg-paper rounded"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>

            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Dominion Clothing Logo"
                className="h-16 w-auto object-contain transition-transform hover:scale-105"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-[14px] text-navy tracking-[0.18em] font-display uppercase leading-none">
                  DOMINION
                </span>
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.25em] mt-1 leading-none">
                  CLOTHING
                </span>
              </div>
            </Link>
          </div>

          {/* Center-Left: Shop Dropdown + quick links */}
          <nav className="hidden lg:flex items-center gap-6 h-full">
            <div
              className="relative h-full"
              onMouseEnter={() => setShowShopDropdown(true)}
              onMouseLeave={() => setShowShopDropdown(false)}
            >
              <button className="font-bold text-[12px] uppercase tracking-widest text-gray-700 hover:text-navy transition-colors h-full flex items-center gap-1 px-1">
                Shop
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {showShopDropdown && (
                <div className="absolute top-full left-0 bg-white border border-line rounded shadow-lg py-2 w-48 grid grid-cols-1 z-50">
                  {navLinks.map((l) => (
                    <Link
                      key={l.label}
                      to={l.to}
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 hover:bg-[#FAFAF8] hover:text-navy transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link to="/products?cat=New" className="font-bold text-[12px] uppercase tracking-widest text-gray-700 hover:text-navy transition-colors h-full flex items-center px-1">
              New In
            </Link>
            <Link to="/products?cat=Sale" className="font-bold text-[12px] uppercase tracking-widest text-crimson hover:text-navy transition-colors h-full flex items-center px-1">
              Sale
            </Link>
          </nav>

          {/* Center-Right: Search Input Box */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-xs relative">
            <span className="absolute left-3.5 text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search products, brands..."
              className="w-full bg-[#FAFAF8] text-ink placeholder-gray-400 text-xs border border-line rounded pl-10 pr-4 py-2.5 focus:outline-none focus:bg-white focus:border-navy transition-all"
            />
          </form>

          {/* Right Side Actions */}
          <div className="flex items-center gap-5 md:gap-6">
            
            {/* Admin Console Link (desktop shortcut) */}
            {user && user.isAdmin && (
              <Link 
                to="/admin" 
                className="hidden lg:flex items-center gap-1 bg-[#1B2A4A]/10 border border-[#1B2A4A]/25 text-navy font-extrabold text-[10px] uppercase px-3 py-1.5 rounded-sm tracking-wider hover:bg-navy hover:text-white transition-all shadow-sm"
              >
                Admin Panel
              </Link>
            )}

            {/* Profile / Account Dropdown */}
            <div className="relative">
              <div
                onClick={() => {
                  if (user) {
                    setShowProfileDropdown(!showProfileDropdown);
                  } else {
                    navigate("/login");
                  }
                }}
                className="flex flex-col items-center cursor-pointer text-ink hover:text-navy transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mb-1">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-[9px] font-bold tracking-wider uppercase">
                  {user ? user.name.split(" ")[0] : "Profile"}
                </span>
              </div>

              {/* Profile Dropdown Menu */}
              {showProfileDropdown && user && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-line rounded shadow-lg py-2 z-50 text-xs text-ink font-semibold">
                  <div className="px-4 py-2 border-b border-line font-bold text-gray-500 uppercase tracking-widest text-[9px]">
                    Account: {user.name}
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setShowProfileDropdown(false)}
                    className="block px-4 py-2 text-ink hover:bg-[#FAFAF8] hover:text-navy transition-colors uppercase tracking-wide font-bold"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setShowProfileDropdown(false)}
                    className="block px-4 py-2 text-ink hover:bg-[#FAFAF8] hover:text-navy transition-colors uppercase tracking-wide font-bold"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setShowProfileDropdown(false)}
                    className="block px-4 py-2 text-ink hover:bg-[#FAFAF8] hover:text-navy transition-colors uppercase tracking-wide font-bold"
                  >
                    My Wishlist
                  </Link>
                  {user.isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowProfileDropdown(false)}
                      className="block px-4 py-2 text-ink hover:bg-[#FAFAF8] hover:text-navy transition-colors uppercase tracking-wide lg:hidden font-bold"
                    >
                      Admin Panel
                  </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileDropdown(false);
                      showToast("Signed out successfully.");
                      navigate("/");
                    }}
                    className="w-full text-left px-4 py-2 text-crimson hover:bg-[#FAFAF8] transition-colors uppercase tracking-wide font-bold"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* New In */}
            <Link to="/products?cat=New" className="flex flex-col items-center cursor-pointer text-ink hover:text-navy transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mb-1">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-[9px] font-bold tracking-wider uppercase">New In</span>
            </Link>
            
            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              className="relative flex flex-col items-center cursor-pointer text-ink hover:text-navy transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mb-1">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className="text-[9px] font-bold tracking-wider uppercase">Wishlist</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-navy text-white text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Shopping Bag */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative flex flex-col items-center text-ink hover:text-navy transition-colors"
              aria-label="Open bag"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mb-1">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="text-[9px] font-bold tracking-wider uppercase">Bag</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-navy text-white text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="block md:hidden px-4 pb-3 bg-white">
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
            <span className="absolute left-3.5 text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search products, brands..."
              className="w-full bg-paper text-ink placeholder-gray-400 text-xs border border-line rounded pl-9 pr-4 py-2 focus:outline-none focus:border-navy transition-all"
            />
          </form>
        </div>
      </header>

      {/* Slide-out Drawer Navigation (Mobile/Tablet) - Kept OUTSIDE the header backdrop-blur stacking context */}
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          />
          <div className="fixed top-0 left-0 h-screen w-[80%] max-w-[280px] bg-white z-50 shadow-2xl mobile-menu-enter flex flex-col">
            <div className="flex items-center justify-between h-20 px-5 border-b border-line bg-[#FAFAF8]/80">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-12 w-auto object-contain"
                />
                <div className="flex flex-col">
                  <span className="font-extrabold text-[12px] text-navy tracking-[0.15em] font-display uppercase leading-none">
                    DOMINION
                  </span>
                  <span className="text-[7px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1 leading-none">
                    CLOTHING
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-ink hover:bg-paper transition-colors px-2.5 py-1 rounded text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="flex gap-2 px-4 pt-4 pb-1">
              <Link to="/products?cat=New" onClick={() => setMenuOpen(false)} className="flex-1 flex items-center justify-center gap-1.5 bg-navy text-white text-[10px] font-extrabold uppercase tracking-wider py-2.5 rounded-sm">
                New In
              </Link>
              <Link to="/products?cat=Sale" onClick={() => setMenuOpen(false)} className="flex-1 flex items-center justify-center gap-1.5 bg-crimson text-white text-[10px] font-extrabold uppercase tracking-wider py-2.5 rounded-sm">
                Sale
              </Link>
            </div>

            <div className="px-5 pt-4 pb-2 text-[10px] font-bold text-navy tracking-widest uppercase">
              Shop Categories
            </div>

            <nav className="flex-1 overflow-y-auto flex flex-col px-3 py-1 space-y-0.5">
              <Link to="/products" onClick={() => setMenuOpen(false)} className="text-ink text-xs uppercase tracking-wider font-semibold px-4 py-3 rounded hover:bg-paper hover:text-navy transition-colors">
                Shop All
              </Link>
              {navLinks.map((l) => (
                <Link key={l.label} to={l.to} onClick={() => setMenuOpen(false)} className="text-gray-700 text-xs uppercase tracking-wider font-semibold px-4 py-3 rounded hover:bg-paper hover:text-navy transition-colors border-l-2 border-transparent hover:border-navy">
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-line px-5 py-4 bg-[#F4F2EC]/50 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="text-xs font-bold text-navy uppercase mb-1">Hi, {user.name.split(" ")[0]}</div>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="text-[10px] text-gray-700 font-extrabold uppercase tracking-wider hover:text-navy transition-colors py-1"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setMenuOpen(false)}
                    className="text-[10px] text-gray-700 font-extrabold uppercase tracking-wider hover:text-navy transition-colors py-1"
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setMenuOpen(false)}
                    className="text-[10px] text-gray-700 font-extrabold uppercase tracking-wider hover:text-navy transition-colors py-1"
                  >
                    My Wishlist
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      showToast("Signed out successfully.");
                      navigate("/");
                    }}
                    className="text-left text-[10px] text-crimson font-extrabold uppercase tracking-wider transition-colors py-1"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center justify-center bg-navy text-white text-[10px] font-extrabold uppercase tracking-wider py-2.5 rounded-sm">
                  Login / Sign Up
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
