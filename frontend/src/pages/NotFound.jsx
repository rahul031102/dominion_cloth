import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <section className="max-w-md mx-auto px-6 py-20 text-center bg-white border border-line rounded shadow-sm mt-20 text-ink page-enter font-body">
      <div className="w-16 h-16 bg-navy/5 border border-navy/20 rounded-full flex items-center justify-center mx-auto mb-6 text-navy shadow-sm">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </div>
      
      <h1 className="text-4xl font-extrabold text-navy tracking-widest mb-2 font-mono">404</h1>
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">PAGE NOT FOUND</h2>
      
      <p className="text-xs text-gray-600 mb-8 leading-relaxed uppercase">
        The link you followed may be broken, or the page has been removed. Check the URL and try again.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate("/products")}
          className="w-full py-3.5 text-xs font-bold uppercase tracking-wider bg-navy text-white rounded hover:opacity-90 transition-all shadow"
        >
          Continue Shopping
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full py-3.5 text-xs font-bold uppercase tracking-wider border border-line text-gray-500 rounded hover:bg-paper transition-all"
        >
          Go to Homepage
        </button>
      </div>
    </section>
  );
}
