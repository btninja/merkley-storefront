"use client";

import React, { createContext, useContext, useCallback, useEffect, useState, useMemo } from "react";
import { trackAddToCart } from "@/lib/analytics";

// ── Cart Item type ──

export interface CartItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  customization_options: string | null;
  is_personalizable: boolean;
  image_url: string | null;
  minimum_order_qty: number;
}

// ── Context value ──

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  addItem: (item: CartItem) => void;
  updateQty: (item_code: string, qty: number) => void;
  removeItem: (item_code: string) => void;
  replaceItems: (items: CartItem[]) => void;
  clearCart: () => void;
  lastAddedAt: number;
}

const STORAGE_KEY = "mw_cart";

const CartContext = createContext<CartContextValue | null>(null);

// ── Helpers ──

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or blocked — silently ignore
  }
}

// ── Provider ──

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);

  // Hydrate from localStorage on mount (SSR guard)
  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  // Sync to localStorage on change (only after hydration)
  useEffect(() => {
    if (hydrated) {
      saveCart(items);
    }
  }, [items, hydrated]);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.item_code === newItem.item_code);
      if (existing) {
        return prev.map((i) =>
          i.item_code === newItem.item_code
            ? { ...i, qty: i.qty + newItem.qty }
            : i
        );
      }
      return [...prev, newItem];
    });
    trackAddToCart(newItem.item_code, newItem.item_name, newItem.qty, newItem.rate);
    setLastAddedAt(Date.now());
  }, []);

  const updateQty = useCallback((item_code: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.item_code === item_code ? { ...i, qty: Math.max(1, qty) } : i
      )
    );
  }, []);

  const removeItem = useCallback((item_code: string) => {
    setItems((prev) => prev.filter((i) => i.item_code !== item_code));
  }, []);

  const replaceItems = useCallback((newItems: CartItem[]) => {
    setItems(newItems);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, itemCount, addItem, updateQty, removeItem, replaceItems, clearCart, lastAddedAt }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ── Hook ──

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
