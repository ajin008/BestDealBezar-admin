"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";
import type { OrderStatus } from "@/lib/constants";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  orders_today: number;
  revenue_today: number;
  active_products: number;
  low_stock_count: number;
  recent_orders: Order[];
  order_status_breakdown: {
    status: OrderStatus;
    count: number;
  }[];
}

interface UseDashboardReturn {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// ─── Default stats ─────────────────────────────────────────────────────────────

const DEFAULT_STATS: DashboardStats = {
  orders_today: 0,
  revenue_today: 0,
  active_products: 0,
  low_stock_count: 0,
  recent_orders: [],
  order_status_breakdown: [],
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useDashboard(): UseDashboardReturn {
  const supabase = createClient();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDashboardData() {
    setIsLoading(true);
    setError(null);

    try {
      // Today's date range
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Run all queries in parallel for performance
      const [
        ordersToday,
        activeProducts,
        lowStockProducts,
        allOrders,
        recentOrders,
      ] = await Promise.all([
        // Orders placed today
        supabase
          .from("orders")
          .select("total_amount", { count: "exact" })
          .gte("created_at", todayStart.toISOString())
          .lte("created_at", todayEnd.toISOString()),

        // Active products count
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),

        // Low stock products (quantity <= 5)
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .lte("stock_quantity", 5)
          .gt("stock_quantity", 0)
          .eq("is_active", true),

        // All orders for status breakdown
        supabase.from("orders").select("status"),

        // Recent 10 orders
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      // Calculate revenue today
      const revenueToday = (ordersToday.data ?? []).reduce(
        (sum, order) => sum + (order.total_amount ?? 0),
        0
      );

      // Calculate order status breakdown
      const statusBreakdown = (allOrders.data ?? []).reduce((acc, order) => {
        const status = order.status as OrderStatus;
        const existing = acc.find((s) => s.status === status);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ status, count: 1 });
        }
        return acc;
      }, [] as { status: OrderStatus; count: number }[]);

      setStats({
        orders_today: ordersToday.count ?? 0,
        revenue_today: revenueToday,
        active_products: activeProducts.count ?? 0,
        low_stock_count: lowStockProducts.count ?? 0,
        recent_orders: (recentOrders.data ?? []) as unknown as Order[],
        order_status_breakdown: statusBreakdown,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load dashboard";
      setError(message);
      console.error("[useDashboard] error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [
          ordersToday,
          activeProducts,
          lowStockProducts,
          allOrders,
          recentOrders,
        ] = await Promise.all([
          supabase
            .from("orders")
            .select("total_amount", { count: "exact" })
            .gte("created_at", todayStart.toISOString())
            .lte("created_at", todayEnd.toISOString()),
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .lte("stock_quantity", 5)
            .gt("stock_quantity", 0)
            .eq("is_active", true),
          supabase.from("orders").select("status"),
          supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        if (!isMounted) return;

        const revenueToday = (ordersToday.data ?? []).reduce(
          (sum, order) => sum + (order.total_amount ?? 0),
          0
        );

        const statusBreakdown = (allOrders.data ?? []).reduce((acc, order) => {
          const status = order.status as OrderStatus;
          const existing = acc.find((s) => s.status === status);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ status, count: 1 });
          }
          return acc;
        }, [] as { status: OrderStatus; count: number }[]);

        setStats({
          orders_today: ordersToday.count ?? 0,
          revenue_today: revenueToday,
          active_products: activeProducts.count ?? 0,
          low_stock_count: lowStockProducts.count ?? 0,
          recent_orders: (recentOrders.data ?? []) as unknown as Order[],
          order_status_breakdown: statusBreakdown,
        });
      } catch (err: unknown) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load dashboard";
        setError(message);
        console.error("[useDashboard] load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchDashboardData,
  };
}
