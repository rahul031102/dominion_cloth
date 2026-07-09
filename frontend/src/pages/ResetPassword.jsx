import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetUserPassword } from "../api/products.js";
import { useToast } from "../context/ToastContext.jsx";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast("No token found in reset request.");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetUserPassword(token, password);
      showToast(res.message || "Password updated successfully!");
      navigate("/login");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update password. Reset token may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-md mx-auto px-6 py-16 bg-white border border-line rounded shadow-sm mt-16 text-ink page-enter font-body">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-navy">New Password</h1>
        <p className="text-xs text-gray-500 mt-2.5 uppercase tracking-widest font-semibold">
          Define new credentials for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
            New Password
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

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
            Confirm New Password
          </label>
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-line rounded px-4 py-3 text-xs bg-white text-ink focus:outline-none focus:border-navy transition-colors font-medium"
            placeholder="Re-enter password"
          />
        </div>

        <button
          disabled={submitting}
          type="submit"
          className="w-full py-3.5 text-xs font-bold uppercase tracking-widest bg-navy text-white hover:opacity-95 active:scale-95 transition-all rounded shadow-md flex items-center justify-center disabled:opacity-50"
        >
          {submitting ? "UPDATING..." : "UPDATE PASSWORD"}
        </button>
      </form>
    </section>
  );
}
