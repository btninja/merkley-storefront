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
  /** User-entered personalization notes (free text). Distinct from
   *  customization_options (catalog-side prompt). Survives the cart →
   *  quote-builder hydration round-trip so reorder / edit flows preserve
   *  what the user already typed. */
  customization_notes?: string | null;
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
const MAX_QTY = 10000;

const CartContext = createContext<CartContextValue | null>(null);

// ── Helpers ──

function isValidCartItem(x: unknown): x is CartItem {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.item_code === "string" && o.item_code.length > 0 &&
    typeof o.item_name === "string" &&
    typeof o.qty === "number" && Number.isFinite(o.qty) && o.qty > 0 && o.qty <= MAX_QTY &&
    typeof o.rate === "number" && Number.isFinite(o.rate) && o.rate >= 0 &&
    typeof o.minimum_order_qty === "number" && Number.isFinite(o.minimum_order_qty)
  );
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop entries that don't match the CartItem shape — protects
    // downstream code (totals, qty bumps) from TypeErrors when
    // tampered/legacy localStorage carries malformed rows.
    return parsed.filter(isValidCartItem);
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
            ? { ...i, qty: Math.min(i.qty + newItem.qty, MAX_QTY) }
            : i
        );
      }
      return [...prev, { ...newItem, qty: Math.min(newItem.qty, MAX_QTY) }];
    });
    trackAddToCart(newItem.item_code, newItem.item_name, newItem.qty, newItem.rate);
    setLastAddedAt(Date.now());
  }, []);

  const updateQty = useCallback((item_code: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.item_code === item_code
          ? { ...i, qty: Math.min(Math.max(i.minimum_order_qty || 1, qty), MAX_QTY) }
          : i
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
