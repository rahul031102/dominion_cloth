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
      return false; // Suggest redirection to login
    }
    try {
      const data = await toggleWishlistApi(productId);
      setWishlist(data);
      return true;
    } catch (err) {
      console.error("Error toggling wishlist:", err);
      return false;
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
