import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotUserPassword } from "../api/products.js";
import { useToast } from "../context/ToastContext.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await forgotUserPassword(email);
      showToast(res.message);
      setSuccess(true);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to process forgot password request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-md mx-auto px-4 sm:px-6 py-10 sm:py-16 bg-white border border-line rounded-none sm:rounded shadow-sm mt-0 sm:mt-12 text-ink page-enter font-body min-h-[calc(100vh-7rem)] sm:min-h-0 flex flex-col justify-center">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-navy">Forgot Password</h1>
        <p className="text-[11px] sm:text-xs text-gray-500 mt-2.5 uppercase tracking-widest font-semibold px-2 sm:px-0">
          Get a recovery link sent to your inbox
        </p>
      </div>

      {!success ? (
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

          <button
            disabled={submitting}
            type="submit"
            className="w-full py-3.5 text-sm sm:text-xs font-bold uppercase tracking-widest bg-navy text-white hover:opacity-95 active:scale-95 transition-all rounded shadow-md flex items-center justify-center disabled:opacity-50"
          >
            {submitting ? "SENDING..." : "SEND RECOVERY LINK"}
          </button>
        </form>
      ) : (
        <div className="text-center">
          <div className="w-12 h-12 bg-green-50 border border-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed uppercase mb-6 px-1 sm:px-0">
            If an account is registered under <strong className="text-navy">{email}</strong>, a secure password reset link has been dispatched to that inbox. Check spam if not received in 5 minutes.
          </p>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-line text-center text-xs text-gray-500 font-semibold px-2 sm:px-0">
        <Link to="/login" className="text-navy hover:underline uppercase tracking-wide font-bold">
          Back to Sign In
        </Link>
      </div>
    </section>
  );
}
