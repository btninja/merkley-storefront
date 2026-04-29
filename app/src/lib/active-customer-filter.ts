"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";

const KEY = "mw_active_customer_filter";
const ALL = "all" as const;

type FilterValue = string | typeof ALL;

export function useActiveCustomerFilter() {
  const { availableCustomers } = useAuth();
  const [filter, setFilter] = useState<FilterValue>(ALL);

  // Read from localStorage on mount and when availableCustomers changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (!stored) return;
      if (stored === ALL) {
        setFilter(ALL);
        return;
      }
      // Validate the stored customer is still accessible
      const stillAccessible = availableCustomers?.some((c) => c.name === stored);
      if (stillAccessible) {
        setFilter(stored);
      } else {
        localStorage.setItem(KEY, ALL);
        setFilter(ALL);
      }
    } catch {
      // localStorage unavailable (SSR/private mode) — silently default to ALL
    }
  }, [availableCustomers]);

  const update = useCallback((value: FilterValue) => {
    setFilter(value);
    try {
      localStorage.setItem(KEY, value);
    } catch {}
  }, []);

  return {
    filter,
    setFilter: update,
    isAll: filter === ALL,
    customer: filter === ALL ? undefined : filter,
  };
}
