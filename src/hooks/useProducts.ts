//cspell:disable
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PAGINATION } from "@/lib/constants";
import type { Database } from "@/types/database";
import type {
  Product,
  ProductFormData,
  ProductFilters,
  ApiResponse,
} from "@/types";

// ─── Database types from generated schema ──────────────────────────────────────

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type ProductImageInsert =
  Database["public"]["Tables"]["product_images"]["Insert"];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UseProductsReturn {
  products: Product[];
  totalCount: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filters: ProductFilters;
  setFilters: (filters: Partial<ProductFilters>) => void;
  refetch: () => Promise<void>;
}

interface UseProductReturn {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  createProduct: (data: ProductFormData) => Promise<ApiResponse<Product>>;
  updateProduct: (
    id: string,
    data: Partial<ProductFormData>
  ) => Promise<ApiResponse<Product>>;
  deleteProduct: (id: string) => Promise<ApiResponse<null>>;
  toggleActive: (
    id: string,
    is_active: boolean
  ) => Promise<ApiResponse<Product>>;
  toggleFeatured: (
    id: string,
    is_featured: boolean
  ) => Promise<ApiResponse<Product>>;
  uploadImage: (productId: string, file: File) => Promise<ApiResponse<string>>;
  deleteImage: (imageId: string, url: string) => Promise<ApiResponse<null>>;
}

// ─── Default filters ───────────────────────────────────────────────────────────

const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  category_id: "",
  is_active: null,
  page: 1,
};

// ─── Query builder helper — avoids duplicating filter logic ───────────────────

const PRODUCTS_SELECT = `
  *,
  category:categories(id, name, slug),
  images:product_images(id, url, sort_order)
`;

// ─── useProducts — for product list page ──────────────────────────────────────

export function useProducts(): UseProductsReturn {
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ProductFilters>(DEFAULT_FILTERS);

  // ─── Auto-fetch when filters change ─────────────────────────────────────────
  // isMounted prevents setState on unmounted component
  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("products")
          .select(PRODUCTS_SELECT, { count: "exact" })
          .order("created_at", { ascending: false });

        if (filters.search) {
          query = query.or(
            `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`
          );
        }
        if (filters.category_id) {
          query = query.eq("category_id", filters.category_id);
        }
        if (filters.is_active !== null) {
          query = query.eq("is_active", filters.is_active);
        }

        const from = (filters.page - 1) * PAGINATION.DEFAULT_PAGE_SIZE;
        const to = from + PAGINATION.DEFAULT_PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (!isMounted) return;
        if (error) throw error;

        setProducts((data ?? []) as unknown as Product[]);
        setTotalCount(count ?? 0);
      } catch (err: unknown) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to fetch products";
        setError(message);
        console.error("[useProducts] load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [supabase, filters]);

  // ─── Manual refetch — called after create/delete operations ─────────────────
  const refetch = useCallback(async () => {
    let query = supabase
      .from("products")
      .select(PRODUCTS_SELECT, { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`
      );
    }
    if (filters.category_id) {
      query = query.eq("category_id", filters.category_id);
    }
    if (filters.is_active !== null) {
      query = query.eq("is_active", filters.is_active);
    }

    const from = (filters.page - 1) * PAGINATION.DEFAULT_PAGE_SIZE;
    const to = from + PAGINATION.DEFAULT_PAGE_SIZE - 1;
    query = query.range(from, to);

    setIsLoading(true);
    try {
      const { data, error, count } = await query;
      if (error) throw error;
      setProducts((data ?? []) as unknown as Product[]);
      setTotalCount(count ?? 0);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch products";
      setError(message);
      console.error("[useProducts] refetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, filters]);

  // ─── Set filters ─────────────────────────────────────────────────────────────

  const setFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1,
    }));
  }, []);

  return {
    products,
    totalCount,
    totalPages: Math.ceil(totalCount / PAGINATION.DEFAULT_PAGE_SIZE),
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
  };
}

// ─── useProduct — for single product add/edit page ────────────────────────────

export function useProduct(id?: string): UseProductReturn {
  const supabase = createClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(!!id && id !== "new");
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch single product on mount ───────────────────────────────────────────

  useEffect(() => {
    if (!id || id === "new") return;

    let isMounted = true;

    async function load() {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("products")
          .select(PRODUCTS_SELECT)
          .eq("id", id)
          .single();

        if (!isMounted) return;
        if (error) throw error;

        setProduct(data as unknown as Product);
      } catch (err: unknown) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to fetch product";
        setError(message);
        console.error("[useProduct] load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [id, supabase]);

  // ─── Create product ──────────────────────────────────────────────────────────

  const createProduct = useCallback(
    async (data: ProductFormData): Promise<ApiResponse<Product>> => {
      try {
        console.log("[createProduct] starting...");

        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("[createProduct] session:", session?.user?.id);

        const insertData: ProductInsert = {
          name: data.name,
          slug: data.slug,
          sku: data.sku || null,
          category_id: data.category_id || null,
          short_description: data.short_description || null,
          full_description: data.full_description || null,
          unit: data.unit,
          actual_price: data.actual_price,
          selling_price: data.selling_price,
          tax_percent: data.tax_percent,
          stock_quantity: data.stock_quantity,
          low_stock_threshold: data.low_stock_threshold,
          weight_grams: data.weight_grams || null,
          is_active: data.is_active,
          is_featured: data.is_featured,
          is_new_arrival: data.is_new_arrival,
        };

        console.log("[createProduct] insertData:", insertData);

        const { data: created, error } = await supabase
          .from("products")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        console.log("[createProduct] result:", { created, error });

        setProduct(created as unknown as Product);
        return { data: created as unknown as Product, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create product";
        console.error("[useProduct] createProduct error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // ─── Update product ──────────────────────────────────────────────────────────

  const updateProduct = useCallback(
    async (
      id: string,
      data: Partial<ProductFormData>
    ): Promise<ApiResponse<Product>> => {
      try {
        const updateData: ProductUpdate = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.sku !== undefined) updateData.sku = data.sku || null;
        if (data.category_id !== undefined)
          updateData.category_id = data.category_id || null;
        if (data.short_description !== undefined)
          updateData.short_description = data.short_description || null;
        if (data.full_description !== undefined)
          updateData.full_description = data.full_description || null;
        if (data.unit !== undefined) updateData.unit = data.unit;
        if (data.actual_price !== undefined)
          updateData.actual_price = data.actual_price;
        if (data.selling_price !== undefined)
          updateData.selling_price = data.selling_price;
        if (data.tax_percent !== undefined)
          updateData.tax_percent = data.tax_percent;
        if (data.stock_quantity !== undefined)
          updateData.stock_quantity = data.stock_quantity;
        if (data.low_stock_threshold !== undefined)
          updateData.low_stock_threshold = data.low_stock_threshold;
        if (data.weight_grams !== undefined)
          updateData.weight_grams = data.weight_grams || null;
        if (data.is_active !== undefined) updateData.is_active = data.is_active;
        if (data.is_featured !== undefined)
          updateData.is_featured = data.is_featured;
        if (data.is_new_arrival !== undefined)
          updateData.is_new_arrival = data.is_new_arrival;

        const { data: updated, error } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        setProduct(updated as unknown as Product);
        return { data: updated as unknown as Product, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update product";
        console.error("[useProduct] updateProduct error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // ─── Delete product ──────────────────────────────────────────────────────────

  const deleteProduct = useCallback(
    async (id: string): Promise<ApiResponse<null>> => {
      try {
        const { error } = await supabase.from("products").delete().eq("id", id);

        if (error) throw error;

        setProduct(null);
        return { data: null, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to delete product";
        console.error("[useProduct] deleteProduct error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // ─── Toggle active ───────────────────────────────────────────────────────────

  const toggleActive = useCallback(
    async (id: string, is_active: boolean): Promise<ApiResponse<Product>> => {
      try {
        const updateData: ProductUpdate = { is_active };
        const { data: updated, error } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        setProduct(updated as unknown as Product);
        return { data: updated as unknown as Product, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update product";
        console.error("[useProduct] toggleActive error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // ─── Toggle featured ─────────────────────────────────────────────────────────

  const toggleFeatured = useCallback(
    async (id: string, is_featured: boolean): Promise<ApiResponse<Product>> => {
      try {
        const updateData: ProductUpdate = { is_featured };
        const { data: updated, error } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        setProduct(updated as unknown as Product);
        return { data: updated as unknown as Product, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update product";
        console.error("[useProduct] toggleFeatured error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // ─── Upload image ────────────────────────────────────────────────────────────

  const uploadImage = useCallback(
    async (productId: string, file: File): Promise<ApiResponse<string>> => {
      try {
        const ext = file.name.split(".").pop();
        const filename = `${productId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filename, file, { cacheControl: "31536000", upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filename);

        const publicUrl = urlData.publicUrl;

        const { count } = await supabase
          .from("product_images")
          .select("*", { count: "exact", head: true })
          .eq("product_id", productId);

        const imageInsert: ProductImageInsert = {
          product_id: productId,
          url: publicUrl,
          sort_order: count ?? 0,
        };

        const { error: dbError } = await supabase
          .from("product_images")
          .insert(imageInsert);

        if (dbError) throw dbError;

        return { data: publicUrl, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to upload image";
        console.error("[useProduct] uploadImage error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // ─── Delete image ────────────────────────────────────────────────────────────

  const deleteImage = useCallback(
    async (imageId: string, url: string): Promise<ApiResponse<null>> => {
      try {
        const filename = url.split("/product-images/")[1];

        const { error: storageError } = await supabase.storage
          .from("product-images")
          .remove([filename]);

        if (storageError) throw storageError;

        const { error: dbError } = await supabase
          .from("product_images")
          .delete()
          .eq("id", imageId);

        if (dbError) throw dbError;

        return { data: null, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to delete image";
        console.error("[useProduct] deleteImage error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  return {
    product,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleActive,
    toggleFeatured,
    uploadImage,
    deleteImage,
  };
}
