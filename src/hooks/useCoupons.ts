"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { Coupon, CouponFormData, ApiResponse } from "@/types";

// ─── Database types ────────────────────────────────────────────────────────────

type CouponInsert = Database["public"]["Tables"]["coupons"]["Insert"];
type CouponUpdate = Database["public"]["Tables"]["coupons"]["Update"];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UseCouponsReturn {
  coupons: Coupon[];
  isLoading: boolean;
  error: string | null;
  createCoupon: (data: CouponFormData) => Promise<ApiResponse<Coupon>>;
  updateCoupon: (
    id: string,
    data: Partial<CouponFormData>
  ) => Promise<ApiResponse<Coupon>>;
  deleteCoupon: (id: string) => Promise<ApiResponse<null>>;
  toggleActive: (
    id: string,
    is_active: boolean
  ) => Promise<ApiResponse<Coupon>>;
  refetch: () => Promise<void>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useCoupons(): UseCouponsReturn {
  const supabase = createClient();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .order("created_at", { ascending: false });

        if (!isMounted) return;
        if (error) throw error;
        setCoupons((data ?? []) as Coupon[]);
      } catch (err: unknown) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to fetch coupons";
        setError(message);
        console.error("[useCoupons] load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCoupons((data ?? []) as Coupon[]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch coupons";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // ─── Create ──────────────────────────────────────────────────────────────────

  const createCoupon = useCallback(
    async (data: CouponFormData): Promise<ApiResponse<Coupon>> => {
      try {
        const insertData: CouponInsert = {
          code: data.code.toUpperCase().trim(),
          description: data.description || null,
          type: data.type,
          discount_value: data.discount_value,
          min_order_amount: data.min_order_amount,
          max_discount_amount: data.max_discount_amount ?? null,
          usage_limit: data.usage_limit ?? null,
          valid_from: data.valid_from,
          valid_until: data.valid_until ?? null,
          is_active: data.is_active,
        };

        const { data: created, error } = await supabase
          .from("coupons")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        setCoupons((prev) => [created as Coupon, ...prev]);
        return { data: created as Coupon, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create coupon";
        console.error("[useCoupons] createCoupon error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // ─── Update ──────────────────────────────────────────────────────────────────

  const updateCoupon = useCallback(
    async (
      id: string,
      data: Partial<CouponFormData>
    ): Promise<ApiResponse<Coupon>> => {
      try {
        const updateData: CouponUpdate = {};
        if (data.code !== undefined)
          updateData.code = data.code.toUpperCase().trim();
        if (data.description !== undefined)
          updateData.description = data.description || null;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.discount_value !== undefined)
          updateData.discount_value = data.discount_value;
        if (data.min_order_amount !== undefined)
          updateData.min_order_amount = data.min_order_amount;
        if (data.max_discount_amount !== undefined)
          updateData.max_discount_amount = data.max_discount_amount;
        if (data.usage_limit !== undefined)
          updateData.usage_limit = data.usage_limit;
        if (data.valid_from !== undefined)
          updateData.valid_from = data.valid_from;
        if (data.valid_until !== undefined)
          updateData.valid_until = data.valid_until;
        if (data.is_active !== undefined) updateData.is_active = data.is_active;

        const { data: updated, error } = await supabase
          .from("coupons")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? (updated as Coupon) : c))
        );
        return { data: updated as Coupon, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update coupon";
        console.error("[useCoupons] updateCoupon error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // ─── Delete ──────────────────────────────────────────────────────────────────

  const deleteCoupon = useCallback(
    async (id: string): Promise<ApiResponse<null>> => {
      try {
        const { error } = await supabase.from("coupons").delete().eq("id", id);
        if (error) throw error;
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        return { data: null, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to delete coupon";
        console.error("[useCoupons] deleteCoupon error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // ─── Toggle active ────────────────────────────────────────────────────────────

  const toggleActive = useCallback(
    async (id: string, is_active: boolean): Promise<ApiResponse<Coupon>> => {
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active } : c))
      );
      try {
        const updateData: CouponUpdate = { is_active };
        const { data: updated, error } = await supabase
          .from("coupons")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return { data: updated as Coupon, error: null };
      } catch (err: unknown) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, is_active: !is_active } : c))
        );
        const message =
          err instanceof Error ? err.message : "Failed to update coupon";
        console.error("[useCoupons] toggleActive error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  return {
    coupons,
    isLoading,
    error,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleActive,
    refetch,
  };
}
