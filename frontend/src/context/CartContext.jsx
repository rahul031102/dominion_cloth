import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";
import { fetchCart, syncCartApi } from "../api/products.js";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(() => {
    try {
      const guestCart = localStorage.getItem("guestCart");
      return guestCart ? JSON.parse(guestCart) : [];
    } catch (err) {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  // Sync guest cart changes to localStorage (runs only for unauthenticated guest sessions)
  useEffect(() => {
    if (!user) {
      localStorage.setItem("guestCart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("guestCart");
    }
  }, [cart, user]);

  // Sync DB cart on login / logout
  useEffect(() => {
    if (user) {
      fetchCart()
        .then((dbCart) => {
          const parsedDbCart = (dbCart || []).map((item) => ({
            product: item.product,
            size: item.size,
            qty: item.qty,
            color: item.color || "",
          }));

          // Merge guest cart items into DB cart if any exist
          if (cart.length > 0) {
            const merged = [...parsedDbCart];
            
            cart.forEach((guestItem) => {
              const match = merged.find(
                (dbItem) =>
                  dbItem.product._id === guestItem.product._id &&
                  dbItem.size === guestItem.size &&
                  dbItem.color === guestItem.color
              );
              if (match) {
                match.qty += guestItem.qty;
              } else {
                merged.push(guestItem);
              }
            });

            setCart(merged);
            syncCartApi(
              merged.map((item) => ({
                product: item.product._id,
                size: item.size,
                qty: item.qty,
                color: item.color || "",
              }))
            ).catch(console.error);
          } else {
            // No guest items to merge, just load the DB cart
            setCart(parsedDbCart);
          }
        })
        .catch(console.error);
    } else {
      // Load guest cart from localStorage when logging out
      try {
        const guestCart = localStorage.getItem("guestCart");
        setCart(guestCart ? JSON.parse(guestCart) : []);
      } catch (err) {
        setCart([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const syncWithDB = (updatedCart) => {
    if (user) {
      syncCartApi(
        updatedCart.map((item) => ({
          product: item.product._id,
          size: item.size,
          qty: item.qty,
          color: item.color || "",
        }))
      ).catch(console.error);
    }
  };

  const addToCart = (product, size, color = "") => {
    setCart((prev) => {
      const existing = prev.find(
        (c) => c.product._id === product._id && c.size === size && c.color === color
      );
      let nextCart;
      if (existing) {
        nextCart = prev.map((c) =>
          c.product._id === product._id && c.size === size && c.color === color
            ? { ...c, qty: c.qty + 1 }
            : c
        );
      } else {
        nextCart = [...prev, { product, qty: 1, size, color }];
      }
      syncWithDB(nextCart);
      return nextCart;
    });
  };

  const changeQty = (productId, size, colorOrDelta = "", maybeDelta) => {
    const color = typeof colorOrDelta === "string" ? colorOrDelta : "";
    const delta = typeof colorOrDelta === "number" ? colorOrDelta : maybeDelta;

    setCart((prev) => {
      const nextCart = prev
        .map((c) =>
          c.product._id === productId && c.size === size && c.color === color
            ? { ...c, qty: c.qty + delta }
            : c
        )
        .filter((c) => c.qty > 0);
      syncWithDB(nextCart);
      return nextCart;
    });
  };

  const removeFromCart = (productId, size, color = "") => {
    setCart((prev) => {
      const nextCart = prev.filter(
        (c) => !(c.product._id === productId && c.size === size && c.color === color)
      );
      syncWithDB(nextCart);
      return nextCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    if (user) {
      syncCartApi([]).catch(console.error);
    } else {
      localStorage.removeItem("guestCart");
    }
  };

  const subtotal = cart.reduce((sum, c) => sum + c.product.price * c.qty, 0);
  const count = cart.reduce((sum, c) => sum + c.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        changeQty,
        removeFromCart,
        clearCart,
        subtotal,
        count,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
