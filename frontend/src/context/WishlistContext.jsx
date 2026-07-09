import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";
import { fetchWishlist, toggleWishlistApi } from "../api/products.js";

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setWishlist([]);
    }
  }, [user]);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const data = await fetchWishlist();
      setWishlist(data);
    } catch (err) {
      console.error("Error loading wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) {
      return { success: false, error: "auth" };
    }

    const wasWished = wishlist.some((item) => (item._id || item) === productId);
    const originalWishlist = [...wishlist];

    if (wasWished) {
      setWishlist((prev) => prev.filter((item) => (item._id || item) !== productId));
    } else {
      setWishlist((prev) => [...prev, { _id: productId }]);
    }

    try {
      const data = await toggleWishlistApi(productId);
      setWishlist(data);
      return { success: true, action: wasWished ? "removed" : "added" };
    } catch (err) {
      console.error("Error toggling wishlist:", err);
      // Rollback on error
      setWishlist(originalWishlist);
      return { success: false, error: "api" };
    }
  };

  const inWishlist = (productId) => {
    return wishlist.some((item) => item._id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, loading, toggleWishlist, inWishlist, reloadWishlist: loadWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
