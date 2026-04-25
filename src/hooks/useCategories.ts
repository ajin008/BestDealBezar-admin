//cspell:disable
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { Category, CategoryFormData, ApiResponse } from "@/types";

type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  createCategory: (data: CategoryFormData) => Promise<ApiResponse<Category>>;
  updateCategory: (
    id: string,
    data: Partial<CategoryFormData>
  ) => Promise<ApiResponse<Category>>;
  deleteCategory: (id: string) => Promise<ApiResponse<null>>;
  toggleActive: (
    id: string,
    is_active: boolean
  ) => Promise<ApiResponse<Category>>;
  uploadCategoryImage: (file: File) => Promise<ApiResponse<string>>;
  deleteCategoryImage: (url: string) => Promise<ApiResponse<null>>;
  refetch: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true });
        if (!isMounted) return;
        if (error) throw error;
        setCategories((data ?? []) as Category[]);
      } catch (err: unknown) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to fetch categories";
        setError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setCategories((data ?? []) as Category[]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch categories";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const createCategory = useCallback(
    async (data: CategoryFormData): Promise<ApiResponse<Category>> => {
      try {
        const { data: created, error } = await supabase
          .from("categories")
          .insert({
            name: data.name,
            slug: data.slug,
            image_url: data.image_url ?? null,
            is_active: data.is_active,
            sort_order: data.sort_order,
          })
          .select()
          .single();
        if (error) throw error;
        setCategories((prev) => [...prev, created]);
        return { data: created, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create category";
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  const updateCategory = useCallback(
    async (
      id: string,
      data: Partial<CategoryFormData>
    ): Promise<ApiResponse<Category>> => {
      try {
        const updateData: CategoryUpdate = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.image_url !== undefined) updateData.image_url = data.image_url;
        if (data.is_active !== undefined) updateData.is_active = data.is_active;
        if (data.sort_order !== undefined)
          updateData.sort_order = data.sort_order;

        const { data: updated, error } = await supabase
          .from("categories")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        setCategories((prev) =>
          prev.map((cat) => (cat.id === id ? (updated as Category) : cat))
        );
        return { data: updated as Category, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update category";
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<ApiResponse<null>> => {
      try {
        const { error } = await supabase
          .from("categories")
          .delete()
          .eq("id", id);
        if (error) throw error;
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
        return { data: null, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to delete category";
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  const toggleActive = useCallback(
    async (id: string, is_active: boolean): Promise<ApiResponse<Category>> => {
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, is_active } : cat))
      );
      try {
        const updateData: CategoryUpdate = { is_active };
        const { data: updated, error } = await supabase
          .from("categories")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return { data: updated as Category, error: null };
      } catch (err: unknown) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === id ? { ...cat, is_active: !is_active } : cat
          )
        );
        const message =
          err instanceof Error ? err.message : "Failed to update category";
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // ─── Upload category image ─────────────────────────────────────────────────

  const uploadCategoryImage = useCallback(
    async (file: File): Promise<ApiResponse<string>> => {
      try {
        const ext = file.name.split(".").pop();
        const filename = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("category-image")
          .upload(filename, file, {
            cacheControl: "31536000",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("category-image")
          .getPublicUrl(filename);

        return { data: urlData.publicUrl, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to upload image";
        console.error("[useCategories] uploadCategoryImage error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  // ─── Delete category image ─────────────────────────────────────────────────

  const deleteCategoryImage = useCallback(
    async (url: string): Promise<ApiResponse<null>> => {
      try {
        const filename = url.split("/category-image/")[1];
        if (!filename) return { data: null, error: null };

        const { error } = await supabase.storage
          .from("category-image")
          .remove([filename]);

        if (error) throw error;
        return { data: null, error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to delete image";
        console.error("[useCategories] deleteCategoryImage error:", err);
        return { data: null, error: message };
      }
    },
    [supabase]
  );

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleActive,
    uploadCategoryImage,
    deleteCategoryImage,
    refetch: fetchCategories,
  };
}
