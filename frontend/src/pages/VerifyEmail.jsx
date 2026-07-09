import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyUserEmail } from "../api/products.js";
import { useToast } from "../context/ToastContext.jsx";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No verification token found in URL.");
      setVerifying(false);
      return;
    }

    verifyUserEmail(token)
      .then((res) => {
        setSuccess(true);
        showToast(res.message || "Email verified successfully!");
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Verification failed. Token may be expired or invalid.");
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token, showToast]);

  return (
    <section className="max-w-md mx-auto px-6 py-20 text-center bg-white border border-line rounded shadow-sm mt-16 text-ink page-enter font-body">
      {verifying && (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-line border-t-navy rounded-full animate-spin mb-4" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Verifying Account...</h2>
        </div>
      )}

      {!verifying && success && (
        <div>
          <div className="w-16 h-16 bg-green-50 border border-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold uppercase mb-3 tracking-wider text-navy">ACCOUNT VERIFIED</h1>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed uppercase">
            Your registration is confirmed. You can now log in to place orders and manage your wardrobe.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3.5 text-xs font-bold uppercase tracking-wider bg-navy text-white rounded hover:opacity-90 transition-all shadow"
          >
            Go to Login
          </button>
        </div>
      )}

      {!verifying && error && (
        <div>
          <div className="w-16 h-16 bg-crimson/5 border border-crimson rounded-full flex items-center justify-center mx-auto mb-6 text-crimson shadow-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-xl font-bold uppercase mb-3 tracking-wider text-crimson">VERIFICATION FAILED</h1>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed uppercase">
            {error}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3.5 text-xs font-bold uppercase tracking-wider border border-line text-gray-600 rounded hover:bg-paper transition-all"
          >
            Back to Sign In
          </button>
        </div>
      )}
    </section>
  );
}
