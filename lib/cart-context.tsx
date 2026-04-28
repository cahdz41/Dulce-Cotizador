"use client";

import React, { createContext, useContext, useReducer } from "react";
import { CartItem, Producto } from "./types";

type CartState = { items: CartItem[] };

type CartAction =
  | { type: "ADD"; product: Producto; cantidad: number }
  | { type: "REMOVE"; codigo: string }
  | { type: "UPDATE_QTY"; codigo: string; cantidad: number }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.codigo === action.product.codigo);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.codigo === action.product.codigo
              ? { ...i, cantidad: i.cantidad + action.cantidad }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...action.product, cantidad: action.cantidad }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.codigo !== action.codigo) };
    case "UPDATE_QTY":
      if (action.cantidad <= 0) {
        return { items: state.items.filter((i) => i.codigo !== action.codigo) };
      }
      return {
        items: state.items.map((i) =>
          i.codigo === action.codigo ? { ...i, cantidad: action.cantidad } : i
        ),
      };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

type CartContextType = {
  items: CartItem[];
  total: number;
  count: number;
  add: (product: Producto, cantidad?: number) => void;
  remove: (codigo: string) => void;
  updateQty: (codigo: string, cantidad: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const total = state.items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  const count = state.items.reduce((sum, i) => sum + i.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        total,
        count,
        add: (product, cantidad = 1) => dispatch({ type: "ADD", product, cantidad }),
        remove: (codigo) => dispatch({ type: "REMOVE", codigo }),
        updateQty: (codigo, cantidad) => dispatch({ type: "UPDATE_QTY", codigo, cantidad }),
        clear: () => dispatch({ type: "CLEAR" }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
