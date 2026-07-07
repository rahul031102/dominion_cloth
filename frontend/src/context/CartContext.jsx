import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]); // { product, qty, size }
  const [isOpen, setIsOpen] = useState(false);

  const addToCart = (product, size) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product._id === product._id && c.size === size);
      if (existing) {
        return prev.map((c) =>
          c.product._id === product._id && c.size === size ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { product, qty: 1, size }];
    });
  };

  const changeQty = (productId, size, delta) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.product._id === productId && c.size === size ? { ...c, qty: c.qty + delta } : c
        )
        .filter((c) => c.qty > 0)
    );
  };

  const removeFromCart = (productId, size) => {
    setCart((prev) => prev.filter((c) => !(c.product._id === productId && c.size === size)));
  };

  const clearCart = () => setCart([]);

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
