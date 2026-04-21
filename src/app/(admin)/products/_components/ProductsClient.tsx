"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { formatPrice } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { Product, ApiResponse } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProductRowProps {
  product: Product;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onRefetch: () => Promise<void>;
  onToggleActive: (
    id: string,
    is_active: boolean
  ) => Promise<ApiResponse<Product>>;
  onToggleFeatured: (
    id: string,
    is_featured: boolean
  ) => Promise<ApiResponse<Product>>;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ProductsClient() {
  const router = useRouter();
  const supabase = createClient();

  const {
    products,
    totalCount,
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
  } = useProducts();

  const { categories } = useCategories();

  // ─── Toggle handlers ─────────────────────────────────────────────────────────

  const handleToggleActive = useCallback(
    async (id: string, is_active: boolean): Promise<ApiResponse<Product>> => {
      const { data, error } = await supabase
        .from("products")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Product, error: null };
    },
    [supabase]
  );

  const handleToggleFeatured = useCallback(
    async (id: string, is_featured: boolean): Promise<ApiResponse<Product>> => {
      const { data, error } = await supabase
        .from("products")
        .update({ is_featured })
        .eq("id", id)
        .select()
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as unknown as Product, error: null };
    },
    [supabase]
  );

  // ─── Filter handlers ─────────────────────────────────────────────────────────

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ search: e.target.value, page: 1 });
    },
    [setFilters]
  );

  const handleCategoryFilter = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilters({ category_id: e.target.value, page: 1 });
    },
    [setFilters]
  );

  const handleStatusFilter = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setFilters({
        is_active: value === "" ? null : value === "true",
        page: 1,
      });
    },
    [setFilters]
  );

  const handleAddProduct = useCallback(() => {
    router.push(ROUTES.PRODUCT_NEW);
  }, [router]);

  const handleEditProduct = useCallback(
    (id: string) => {
      router.push(ROUTES.PRODUCT_EDIT(id));
    },
    [router]
  );

  const handleDeleteProduct = useCallback(
    async (id: string) => {
      if (
        !confirm(
          "Are you sure you want to delete this product? This cannot be undone."
        )
      )
        return;

      const { data, error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        alert("Failed to delete product: " + error.message);
        return;
      }

      await refetch();
    },
    [supabase, refetch]
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount} product{totalCount !== 1 ? "s" : ""} in catalog
          </p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus size={16} />
          Add Product
        </Button>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by name, SKU or slug..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          {/* Category filter */}
          <select
            value={filters.category_id}
            onChange={handleCategoryFilter}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filters.is_active === null ? "" : String(filters.is_active)}
            onChange={handleStatusFilter}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-gray-900">
              No products found
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {filters.search ||
              filters.category_id ||
              filters.is_active !== null
                ? "Try adjusting your filters"
                : "Add your first product to get started"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Image
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Active
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                  Featured
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onRefetch={refetch}
                  onToggleActive={handleToggleActive}
                  onToggleFeatured={handleToggleFeatured}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {totalCount > 20 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>
            Showing {(filters.page - 1) * 20 + 1}–
            {Math.min(filters.page * 20, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={filters.page === 1}
              onClick={() => setFilters({ page: filters.page - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={filters.page * 20 >= totalCount}
              onClick={() => setFilters({ page: filters.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Product Row ───────────────────────────────────────────────────────────────

function ProductRow({
  product,
  onEdit,
  onDelete,
  onRefetch,
  onToggleActive,
  onToggleFeatured,
}: ProductRowProps) {
  const primaryImage = product.images?.[0];
  const isLowStock =
    product.stock_quantity <= product.low_stock_threshold &&
    product.stock_quantity > 0;
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Image */}
      <td className="px-4 py-3">
        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-xs text-gray-400">—</span>
            </div>
          )}
        </div>
      </td>

      {/* Name + SKU */}
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900 truncate max-w-45">
          {product.name}
        </p>
        {product.sku && (
          <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
        )}
      </td>

      {/* Category */}
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-gray-600">{product.category?.name ?? "—"}</span>
      </td>

      {/* Price */}
      <td className="px-4 py-3 text-right">
        <p className="font-medium text-gray-900">
          {formatPrice(product.selling_price)}
        </p>
        {product.actual_price > product.selling_price && (
          <p className="text-xs text-gray-400 line-through mt-0.5">
            {formatPrice(product.actual_price)}
          </p>
        )}
      </td>

      {/* Stock */}
      <td className="px-4 py-3 text-right hidden sm:table-cell">
        {isOutOfStock ? (
          <Badge label="Out of stock" variant="danger" />
        ) : isLowStock ? (
          <Badge label={`Low: ${product.stock_quantity}`} variant="warning" />
        ) : (
          <span className="text-gray-700">{product.stock_quantity}</span>
        )}
      </td>

      {/* Active toggle */}
      <td className="px-4 py-3 text-center">
        <Toggle
          checked={product.is_active}
          onChange={async (checked) => {
            await onToggleActive(product.id, checked);
            await onRefetch();
          }}
        />
      </td>

      {/* Featured toggle */}
      <td className="px-4 py-3 text-center hidden sm:table-cell">
        <Toggle
          checked={product.is_featured}
          onChange={async (checked) => {
            await onToggleFeatured(product.id, checked);
            await onRefetch();
          }}
        />
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onEdit(product.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label={`Edit ${product.name}`}
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            aria-label={`Delete ${product.name}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}
