"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PAGINATION, ORDER_STATUS } from "@/lib/constants";
import type { Database } from "@/types/database";
import type { Order, OrderFilters, ApiResponse } from "@/types";

// ─── Database types ────────────────────────────────────────────────────────────

type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UseOrdersReturn {
  orders: Order[];
  totalCount: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filters: OrderFilters;
  setFilters: (filters: Partial<OrderFilters>) => void;
  refetch: () => Promise<void>;
}

interface UseOrderReturn {
  order: Order | null;
  isLoading: boolean;
  error: string | null;
  updateStatus: (id: string, status: string) => Promise<ApiResponse<Order>>;
  updateNotes: (id: string, notes: string) => Promise<ApiResponse<Order>>;
}

// ─── Default filters ───────────────────────────────────────────────────────────

const DEFAULT_FILTERS: OrderFilters = {
  search: "",
  status: "",
  payment_method: "",
  date_from: "",
  date_to: "",
  page: 1,
};

// ─── Orders select query ───────────────────────────────────────────────────────

const ORDERS_SELECT = `
  *,
  items:order_items(*)
`;

// ─── useOrders — for orders list page ─────────────────────────────────────────

export function useOrders(): UseOrdersReturn {
  const supabase = createClient();

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<OrderFilters>(DEFAULT_FILTERS);

  // ─── Auto fetch when filters change ─────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("orders")
          .select(ORDERS_SELECT, { count: "exact" })
          .order("created_at", { ascending: false });

        if (filters.search) {
          query = query.or(
            `order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`
          );
        }
        if (filters.status) {
          query = query.eq("status", filters.status);
        }
        if (filters.payment_method) {
          query = query.eq("payment_method", filters.payment_method);
        }
        if (filters.date_from) {
          query = query.gte("created_at", filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte("created_at", filters.date_to);
        }

        const from = (filters.page - 1) * PAGINATION.ORDERS_PAGE_SIZE;
        const to = from + PAGINATION.ORDERS_PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (!isMounted) return;
        if (error) throw error;

        setOrders((data ?? []) as unknown as Order[]);
        setTotalCount(count ?? 0);
      } catch (err: unknown) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to fetch orders";
        setError(message);
        console.error("[useOrders] load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [supabase, filters]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(ORDERS_SELECT, { count: "exact" })
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(
          `order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`
        );
      }
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.payment_method)
        query = query.eq("payment_method", filters.payment_method);

      const from = (filters.page - 1) * PAGINATION.ORDERS_PAGE_SIZE;
      const to = from + PAGINATION.ORDERS_PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      setOrders((data ?? []) as unknown as Order[]);
      setTotalCount(count ?? 0);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch orders";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, filters]);

  const setFilters = useCallback((newFilters: Partial<OrderFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1,
    }));
  }, []);

  return {
    orders,
    totalCount,
    totalPages: Math.ceil(totalCount / PAGINATION.ORDERS_PAGE_SIZE),
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
  };
}

// ─── useOrder — for single order detail page ──────────────────────────────────

export function useOrder(id: string): UseOrderReturn {
  const supabase = createClient();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`*, items:order_items(*)`)
          .eq("id", id)
          .single();

        if (!isMounted) return;
        if (error) throw error;
        setOrder(data as unknown as Order);
      } catch (err: unknown) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to fetch order";
        setError(message);
        console.error("[useOrder] load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id, supabase]);

  // ─── Update order status ─────────────────────────────────────────────────────

  const updateStatus = useCallback(
    async (id: string, status: string): Promise<ApiResponse<Order>> => {
      try {
        const updateData: OrderUpdate = { status };

        if (
          status === ORDER_STATUS.DELIVERED &&
          order?.payment_method === "cod"
        ) {
          updateData.payment_status = "paid";
        }

        const { data, error } = await supabase
          .from("orders")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        if (
          status === ORDER_STATUS.DELIVERED &&
          order?.payment_method === "cod"
        ) {
          await supabase
            .from("payments")
            .update({
              status: "paid",
              collected_at: new Date().toISOString(),
            })
            .eq("order_id", id);
        }
        setOrder(data as unknown as Order);
        return { data: data as unknown as Order, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update status";
        console.error("[useOrder] updateStatus error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // ─── Update order notes ──────────────────────────────────────────────────────

  const updateNotes = useCallback(
    async (id: string, notes: string): Promise<ApiResponse<Order>> => {
      try {
        const updateData: OrderUpdate = { notes };
        const { data, error } = await supabase
          .from("orders")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        setOrder(data as unknown as Order);
        return { data: data as unknown as Order, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update notes";
        console.error("[useOrder] updateNotes error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  return { order, isLoading, error, updateStatus, updateNotes };
}
