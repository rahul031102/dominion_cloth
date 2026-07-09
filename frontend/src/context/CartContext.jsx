import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";
import { fetchCart, syncCartApi } from "../api/products.js";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]); // { product, qty, size, color }
  const [isOpen, setIsOpen] = useState(false);

  // Sync DB cart on login / logout
  useEffect(() => {
    if (user) {
      fetchCart()
        .then((dbCart) => {
          if (dbCart && dbCart.length > 0) {
            const loadedCart = dbCart.map((item) => ({
              product: item.product,
              size: item.size,
              qty: item.qty,
              color: item.color || "",
            }));
            setCart(loadedCart);
          } else if (cart.length > 0) {
            // Guest items exist, upload them
            syncCartApi(
              cart.map((item) => ({
                product: item.product._id,
                size: item.size,
                qty: item.qty,
                color: item.color || "",
              }))
            ).catch(console.error);
          }
        })
        .catch(console.error);
    } else {
      setCart([]);
    }
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

  const changeQty = (productId, size, color = "", delta) => {
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
