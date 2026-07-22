import { createContext } from "react";
import type { CartItem, Product } from "../types";

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, size: string, quantity: number, stockId: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
