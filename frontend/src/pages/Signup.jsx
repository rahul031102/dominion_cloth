import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const redirect = searchParams.get("redirect") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await signup(name, email, password);
      showToast(`Welcome, ${data.name}!`);
      navigate(redirect);
    } catch (err) {
      showToast(err.response?.data?.message || "Sign up failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-md mx-auto px-6 py-16 bg-white border border-line rounded shadow-sm mt-16 text-ink page-enter font-body">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-navy">Sign Up</h1>
        <p className="text-xs text-gray-500 mt-2.5 uppercase tracking-widest font-semibold">
          Create an account to track your orders
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
            Full Name
          </label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-medium"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
            Email Address
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-medium"
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
            className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-medium"
            placeholder="Min 6 characters"
          />
        </div>

        <button
          disabled={submitting}
          type="submit"
          className="w-full py-3.5 text-xs font-bold uppercase tracking-widest bg-navy text-white hover:opacity-95 active:scale-95 transition-all rounded shadow-md flex items-center justify-center disabled:opacity-50"
        >
          {submitting ? "CREATING..." : "SIGN UP"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-line text-center text-xs text-gray-500 font-semibold">
        <span>Already have an account? </span>
        <Link
          to={`/login?redirect=${encodeURIComponent(redirect)}`}
          className="text-navy hover:underline uppercase tracking-wide font-bold"
        >
          Sign In
        </Link>
      </div>
    </section>
  );
}
