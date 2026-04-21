"use client";

import { useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useCoupons } from "@/hooks/useCoupons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Coupon, CouponFormData, CouponType } from "@/types";

// ─── Default form ──────────────────────────────────────────────────────────────

const DEFAULT_FORM: CouponFormData = {
  code: "",
  description: "",
  type: "percentage",
  discount_value: 10,
  min_order_amount: 0,
  max_discount_amount: null,
  usage_limit: null,
  valid_from: new Date().toISOString().slice(0, 16),
  valid_until: null,
  is_active: true,
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function CouponsClient() {
  const {
    coupons,
    isLoading,
    error,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleActive,
  } = useCoupons();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof CouponFormData, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Filtered coupons ────────────────────────────────────────────────────────

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  // ─── Modal handlers ──────────────────────────────────────────────────────────

  const handleAddClick = useCallback(() => {
    setEditingCoupon(null);
    setForm(DEFAULT_FORM);
    setFormErrors({});
    setGeneralError(null);
    setIsModalOpen(true);
  }, []);

  const handleEditClick = useCallback((coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description ?? "",
      type: coupon.type as CouponType,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_discount_amount: coupon.max_discount_amount,
      usage_limit: coupon.usage_limit,
      valid_from: coupon.valid_from.slice(0, 16),
      valid_until: coupon.valid_until ? coupon.valid_until.slice(0, 16) : null,
      is_active: coupon.is_active,
    });
    setFormErrors({});
    setGeneralError(null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setForm(DEFAULT_FORM);
    setFormErrors({});
    setGeneralError(null);
  }, []);

  // ─── Form change ─────────────────────────────────────────────────────────────

  const handleChange = useCallback(
    (field: keyof CouponFormData, value: string | number | boolean | null) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (field in formErrors) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [formErrors]
  );

  // ─── Validate ────────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errors: Partial<Record<keyof CouponFormData, string>> = {};
    if (!form.code.trim()) errors.code = "Coupon code is required";
    if (form.discount_value <= 0)
      errors.discount_value = "Discount must be greater than 0";
    if (form.type === "percentage" && form.discount_value > 100) {
      errors.discount_value = "Percentage cannot exceed 100";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setIsSaving(true);
    setGeneralError(null);

    try {
      const result = editingCoupon
        ? await updateCoupon(editingCoupon.id, form)
        : await createCoupon(form);

      if (result.error) {
        setGeneralError(result.error);
        return;
      }

      handleCloseModal();
    } finally {
      setIsSaving(false);
    }
  }, [form, editingCoupon, createCoupon, updateCoupon, handleCloseModal]);

  // ─── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Delete this coupon? This cannot be undone.")) return;
      setDeletingId(id);
      try {
        const result = await deleteCoupon(id);
        if (result.error) alert(result.error);
      } finally {
        setDeletingId(null);
      }
    },
    [deleteCoupon]
  );

  // ─── Coupon status ───────────────────────────────────────────────────────────

  function getCouponStatus(coupon: Coupon): {
    label: string;
    variant: "success" | "danger" | "warning" | "neutral";
  } {
    if (!coupon.is_active) return { label: "Inactive", variant: "neutral" };
    const now = new Date();
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return { label: "Expired", variant: "danger" };
    }
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { label: "Exhausted", variant: "warning" };
    }
    return { label: "Active", variant: "success" };
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Coupons</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {coupons.length} coupon{coupons.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus size={16} />
          New coupon
        </Button>
      </div>

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
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
        ) : filteredCoupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-gray-900">
              No coupons found
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {search
                ? "Try a different search"
                : "Create your first coupon to offer discounts"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Discount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Min order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  Usage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  Validity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Active
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCoupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <tr
                    key={coupon.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Code + description */}
                    <td className="px-4 py-3">
                      <p className="font-mono font-medium text-gray-900">
                        {coupon.code}
                      </p>
                      {coupon.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">
                          {coupon.description}
                        </p>
                      )}
                    </td>

                    {/* Discount */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {coupon.type === "percentage"
                          ? `${coupon.discount_value}%`
                          : formatPrice(coupon.discount_value)}
                      </p>
                      {coupon.max_discount_amount && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Max {formatPrice(coupon.max_discount_amount)}
                        </p>
                      )}
                    </td>

                    {/* Min order */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-600">
                        {coupon.min_order_amount > 0
                          ? formatPrice(coupon.min_order_amount)
                          : "—"}
                      </span>
                    </td>

                    {/* Usage */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-600">
                        {coupon.usage_count}
                        {coupon.usage_limit
                          ? ` / ${coupon.usage_limit}`
                          : " / ∞"}
                      </span>
                    </td>

                    {/* Validity */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-gray-600 text-xs">
                        From {formatDate(coupon.valid_from)}
                      </p>
                      {coupon.valid_until && (
                        <p className="text-gray-400 text-xs mt-0.5">
                          Until {formatDate(coupon.valid_until)}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge label={status.label} variant={status.variant} />
                    </td>

                    {/* Active toggle */}
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={coupon.is_active}
                        onChange={(checked) => toggleActive(coupon.id, checked)}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(coupon)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          aria-label={`Edit ${coupon.code}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          disabled={deletingId === coupon.id}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                          aria-label={`Delete ${coupon.code}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add / Edit Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCoupon ? "Edit coupon" : "New coupon"}
        size="md"
      >
        <div className="flex flex-col gap-4">
          {generalError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {generalError}
            </div>
          )}

          {/* Code + Type */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Code"
              required
              value={form.code}
              onChange={(e) =>
                handleChange("code", e.target.value.toUpperCase())
              }
              error={
                typeof formErrors.code === "string"
                  ? formErrors.code
                  : undefined
              }
              placeholder="WELCOME10"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  handleChange("type", e.target.value as CouponType)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="10% off on first order"
          />

          {/* Discount + Min order + Max discount */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label={
                form.type === "percentage" ? "Discount (%)" : "Discount (₹)"
              }
              required
              type="number"
              min="0"
              max={form.type === "percentage" ? "100" : undefined}
              value={form.discount_value}
              onChange={(e) =>
                handleChange("discount_value", parseFloat(e.target.value) || 0)
              }
              error={
                typeof formErrors.discount_value === "string"
                  ? formErrors.discount_value
                  : undefined
              }
            />
            <Input
              label="Min order (₹)"
              type="number"
              min="0"
              value={form.min_order_amount}
              onChange={(e) =>
                handleChange(
                  "min_order_amount",
                  parseFloat(e.target.value) || 0
                )
              }
            />
            <Input
              label="Max discount (₹)"
              type="number"
              min="0"
              value={form.max_discount_amount ?? ""}
              onChange={(e) =>
                handleChange(
                  "max_discount_amount",
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              hint="Leave empty for no limit"
            />
          </div>

          {/* Usage limit + Valid from + Valid until */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Usage limit"
              type="number"
              min="0"
              value={form.usage_limit ?? ""}
              onChange={(e) =>
                handleChange(
                  "usage_limit",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              hint="Empty = unlimited"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Valid from <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.valid_from}
                onChange={(e) => handleChange("valid_from", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Valid until
              </label>
              <input
                type="datetime-local"
                value={form.valid_until ?? ""}
                onChange={(e) =>
                  handleChange("valid_until", e.target.value || null)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Active</p>
              <p className="text-xs text-gray-500">
                Disable to stop accepting this coupon
              </p>
            </div>
            <Toggle
              checked={form.is_active}
              onChange={(v) => handleChange("is_active", v)}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleCloseModal}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              isLoading={isSaving}
              loadingText="Saving..."
            >
              {editingCoupon ? "Save changes" : "Create coupon"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
