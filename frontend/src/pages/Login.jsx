import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const redirect = searchParams.get("redirect") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await login(email, password);
      showToast(`Welcome back, ${data.name}!`);
      navigate(redirect);
    } catch (err) {
      showToast(err.response?.data?.message || "Invalid credentials, try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-md mx-auto px-4 sm:px-6 py-10 sm:py-16 bg-white border border-line rounded-none sm:rounded shadow-sm mt-0 sm:mt-12 text-ink page-enter font-body min-h-[calc(100vh-7rem)] sm:min-h-0 flex flex-col justify-center">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-navy">Sign In</h1>
        <p className="text-[11px] sm:text-xs text-gray-500 mt-2.5 uppercase tracking-widest font-semibold px-2 sm:px-0">
          Unlock your wardrobe credentials
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
            Email Address
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-line rounded px-4 py-3 text-sm sm:text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-medium"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
            Password
          </label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line rounded px-4 py-3 text-sm sm:text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-medium"
            placeholder="••••••••"
          />
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-[11px] font-bold uppercase tracking-wide text-navy hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          disabled={submitting}
          type="submit"
          className="w-full py-3.5 text-sm sm:text-xs font-bold uppercase tracking-widest bg-navy text-white hover:opacity-95 active:scale-95 transition-all rounded shadow-md flex items-center justify-center disabled:opacity-50"
        >
          {submitting ? "VERIFYING..." : "SIGN IN"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-line text-center text-xs text-gray-500 font-semibold px-2 sm:px-0">
        <span>New to Dominion Clothing? </span>
        <Link
          to={`/signup?redirect=${encodeURIComponent(redirect)}`}
          className="text-navy hover:underline uppercase tracking-wide font-bold"
        >
          Create Account
        </Link>
      </div>
    </section>
  );
}
