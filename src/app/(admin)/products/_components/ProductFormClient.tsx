/* eslint-disable @next/next/no-img-element */
//cspell:disable
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import { useProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { slugify, formatPrice } from "@/lib/utils";
import { ROUTES, PRODUCT_CONFIG } from "@/lib/constants";
import type { ProductFormData } from "@/types";

// ─── Default form values ───────────────────────────────────────────────────────

const DEFAULT_FORM: ProductFormData = {
  name: "",
  slug: "",
  sku: "",
  category_id: "",
  short_description: "",
  full_description: "",
  unit: "piece",
  actual_price: 0,
  selling_price: 0,
  tax_percent: 0,
  stock_quantity: 0,
  low_stock_threshold: 5,
  weight_grams: 0,
  is_active: true,
  is_featured: false,
  is_new_arrival: false,
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProductFormClientProps {
  id: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ProductFormClient({ id }: ProductFormClientProps) {
  const router = useRouter();
  const isNew = id === "new";

  const {
    product,
    isLoading,
    createProduct,
    updateProduct,
    uploadImage,
    deleteImage,
  } = useProduct(isNew ? undefined : id);

  const { categories } = useCategories();

  const [form, setForm] = useState<ProductFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductFormData, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // For NEW products — files not yet uploaded
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  // ─── Populate form when editing ─────────────────────────────────────────────

  useEffect(() => {
    if (!product) return;

    // Use functional update to avoid stale closure
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: product.name,
      slug: product.slug,
      sku: product.sku ?? "",
      category_id: product.category_id ?? "",
      short_description: product.short_description ?? "",
      full_description: product.full_description ?? "",
      unit: product.unit,
      actual_price: product.actual_price,
      selling_price: product.selling_price,
      tax_percent: product.tax_percent,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
      weight_grams: product.weight_grams ?? 0,
      is_active: product.is_active,
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival,
    });
  }, [product?.id]); // ← use product?.id not product — only re-runs when ID changes, not every render

  // ─── Total images count — existing + new pending ─────────────────────────────

  const existingImages = product?.images ?? [];
  const totalImages = isNew
    ? imagePreview.length
    : existingImages.length + imagePreview.length;

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleChange = useCallback(
    (field: keyof ProductFormData, value: string | number | boolean) => {
      setForm((prev) => {
        const updated = { ...prev, [field]: value };
        if (field === "name" && isNew) {
          updated.slug = slugify(value as string);
        }
        return updated;
      });
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors, isNew]
  );

  // ─── Select new images (local preview only) ──────────────────────────────────

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      const remaining = PRODUCT_CONFIG.MAX_IMAGES - totalImages;
      const toAdd = files.slice(0, remaining);

      setImageFiles((prev) => [...prev, ...toAdd]);

      toAdd.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });

      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [totalImages]
  );

  // ─── Remove new image before upload ─────────────────────────────────────────

  const handleRemoveNewImage = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Delete existing image from database + storage ───────────────────────────

  const handleDeleteExistingImage = useCallback(
    async (imageId: string, url: string) => {
      if (!confirm("Remove this image?")) return;
      const result = await deleteImage(imageId, url);
      if (result.error) {
        alert(result.error);
        return;
      }
      // Refresh page to update images list
      router.refresh();
    },
    [deleteImage, router]
  );

  // ─── Validation ──────────────────────────────────────────────────────────────
  //   const validate = useCallback((): boolean => {
  //     const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
  //     if (!form.name.trim()) newErrors.name = "Product name is required";
  //     if (!form.slug.trim()) newErrors.slug = "Slug is required";
  //     if (form.actual_price <= 0)
  //       newErrors.actual_price = "Actual price must be greater than 0";
  //     if (form.selling_price <= 0)
  //       newErrors.selling_price = "Selling price must be greater than 0";
  //     if (isNew && imageFiles.length === 0)
  //       newErrors.name = "At least one image is required";
  //     setErrors(newErrors);
  //     return Object.keys(newErrors).length === 0;
  //   }, [form, isNew, imageFiles]);

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setIsSaving(true);
      setGeneralError(null);

      try {
        if (isNew) {
          const result = await createProduct(form);
          if (result.error || !result.data) {
            setGeneralError(result.error ?? "Failed to create product");
            return;
          }
          // Upload images after product is created
          for (const file of imageFiles) {
            await uploadImage(result.data.id, file);
          }
          router.push(ROUTES.PRODUCTS);
        } else {
          const result = await updateProduct(id, form);
          if (result.error) {
            setGeneralError(result.error);
            return;
          }
          // Upload any new images added during edit
          if (imageFiles.length > 0 && product?.id) {
            for (const file of imageFiles) {
              await uploadImage(product.id, file);
            }
          }
          router.push(ROUTES.PRODUCTS);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [
      form,
      isNew,
      imageFiles,
      createProduct,
      updateProduct,
      uploadImage,
      id,
      product,
      router,
    ]
  );

  // ─── Loading state ───────────────────────────────────────────────────────────

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-6">
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push(ROUTES.PRODUCTS)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to products
          </button>
        </div>

        <div className="flex items-start gap-6">
          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6 flex-1 min-w-0">
            {generalError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {generalError}
              </div>
            )}

            {/* Basic information */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Basic information
              </h3>
              <div className="flex flex-col gap-4">
                <Input
                  label="Product name"
                  required
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  error={errors.name}
                  placeholder="Basmati Rice 5kg"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Slug"
                    required
                    value={form.slug}
                    onChange={(e) => handleChange("slug", e.target.value)}
                    error={errors.slug}
                    placeholder="basmati-rice-5kg"
                    hint="Auto-generated from name"
                  />
                  <Input
                    label="SKU"
                    value={form.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    placeholder="ATC-RICE-5KG"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      value={form.category_id}
                      onChange={(e) =>
                        handleChange("category_id", e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Unit"
                    value={form.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                    placeholder="piece"
                  />
                </div>
                <Input
                  label="Short description"
                  value={form.short_description}
                  onChange={(e) =>
                    handleChange("short_description", e.target.value)
                  }
                  placeholder="One-line summary shown on product cards"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Full description
                  </label>
                  <textarea
                    value={form.full_description}
                    onChange={(e) =>
                      handleChange("full_description", e.target.value)
                    }
                    placeholder="Detailed product description..."
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Images
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {totalImages}/{PRODUCT_CONFIG.MAX_IMAGES} — PNG, JPG, WebP up
                  to 5MB
                </span>
              </h3>

              <div className="grid grid-cols-4 gap-3">
                {/* Existing images from database (edit mode) */}
                {!isNew &&
                  existingImages.map((img, index) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group"
                    >
                      <img
                        src={img.url}
                        alt={`Product image ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-gray-900/70 px-1.5 py-0.5 text-xs text-white">
                          Primary
                        </span>
                      )}
                      {/* Delete button — shows on hover */}
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteExistingImage(img.id, img.url)
                        }
                        className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                {/* New images — local preview only, uploaded on save */}
                {imagePreview.map((src, index) => (
                  <div
                    key={`new-${index}`}
                    className="relative aspect-square rounded-lg overflow-hidden border border-dashed border-blue-300 bg-blue-50 group"
                  >
                    <img
                      src={src}
                      alt={`New image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {isNew && index === 0 && existingImages.length === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-gray-900/70 px-1.5 py-0.5 text-xs text-white">
                        Primary
                      </span>
                    )}
                    {/* New badge */}
                    <span className="absolute top-1 left-1 rounded bg-blue-500/80 px-1.5 py-0.5 text-xs text-white">
                      New
                    </span>
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(index)}
                      className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* Upload button */}
                {totalImages < PRODUCT_CONFIG.MAX_IMAGES && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-colors">
                    <span className="text-2xl text-gray-400">+</span>
                    <span className="text-xs text-gray-500">Add image</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      className="sr-only"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Pricing & inventory */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Pricing & inventory
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Actual price (₹)"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.actual_price}
                  onChange={(e) =>
                    handleChange(
                      "actual_price",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  error={errors.actual_price}
                />
                <Input
                  label="Selling price (₹)"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.selling_price}
                  onChange={(e) =>
                    handleChange(
                      "selling_price",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  error={errors.selling_price}
                />
                <Input
                  label="Tax %"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.tax_percent}
                  onChange={(e) =>
                    handleChange("tax_percent", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <Input
                  label="Stock quantity"
                  type="number"
                  min="0"
                  value={form.stock_quantity}
                  onChange={(e) =>
                    handleChange(
                      "stock_quantity",
                      parseInt(e.target.value) || 0
                    )
                  }
                />
                <Input
                  label="Low stock alert"
                  type="number"
                  min="0"
                  value={form.low_stock_threshold}
                  onChange={(e) =>
                    handleChange(
                      "low_stock_threshold",
                      parseInt(e.target.value) || 0
                    )
                  }
                />
                <Input
                  label="Weight (grams)"
                  type="number"
                  min="0"
                  value={form.weight_grams}
                  onChange={(e) =>
                    handleChange("weight_grams", parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>

          {/* ── Right column — visibility + save ────────────────────────── */}
          <div className="flex flex-col gap-4 w-64 shrink-0">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Visibility
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Active</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Show this product to customers
                    </p>
                  </div>
                  <Toggle
                    checked={form.is_active}
                    onChange={(v) => handleChange("is_active", v)}
                  />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Featured
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Highlight on the homepage
                    </p>
                  </div>
                  <Toggle
                    checked={form.is_featured}
                    onChange={(v) => handleChange("is_featured", v)}
                  />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      New arrival
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Mark as recently added
                    </p>
                  </div>
                  <Toggle
                    checked={form.is_new_arrival}
                    onChange={(v) => handleChange("is_new_arrival", v)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-2">
              <Button
                type="submit"
                isLoading={isSaving}
                loadingText="Saving..."
                className="w-full"
              >
                <Save size={16} />
                {isNew ? "Create product" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(ROUTES.PRODUCTS)}
                disabled={isSaving}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
