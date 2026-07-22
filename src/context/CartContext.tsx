import React, { useState, useEffect } from "react";
import type { CartItem, Product } from "../types";
import { CartContext } from "./cartContextInstance";

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Load cart from localStorage during initial state creation
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("cart");
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, size: string, quantity: number, stockId: number) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id && item.size === size,
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item === existingItem
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [
        ...prevItems,
        {
          id: `${product.id}-${size}-${Date.now()}`,
          product,
          size,
          quantity,
          stockId,
        },
      ];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== cartItemId),
    );
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0,
  );

  const cartItemCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
