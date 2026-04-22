"use client";

import { useState, useEffect, useCallback } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import type { StoreSettings } from "@/types";

// ─── Default form ──────────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  flat_delivery_charge: 0,
  free_delivery_above: 0,
  default_tax_percent: 0,
  is_cod_enabled: true,
  is_online_payment_enabled: false,
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function SettingsClient() {
  const { settings, isLoading, error, updateSettings } = useSettings();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Populate form when settings load
  useEffect(() => {
    if (!settings) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      flat_delivery_charge: settings.flat_delivery_charge,
      free_delivery_above: settings.free_delivery_above,
      default_tax_percent: settings.default_tax_percent,
      is_cod_enabled: settings.is_cod_enabled,
      is_online_payment_enabled: settings.is_online_payment_enabled,
    });
  }, [settings?.id]);

  const handleChange = useCallback(
    (field: keyof typeof DEFAULT_FORM, value: number | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setSaveSuccess(false);
      setSaveError(null);
    },
    []
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const result = await updateSettings(form);

    if (result.error) {
      setSaveError(result.error);
    } else {
      setSaveSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    }

    setIsSaving(false);
  }, [form, updateSettings]);

  const handleReset = useCallback(() => {
    if (!settings) return;
    setForm({
      flat_delivery_charge: settings.flat_delivery_charge,
      free_delivery_above: settings.free_delivery_above,
      default_tax_percent: settings.default_tax_percent,
      is_cod_enabled: settings.is_cod_enabled,
      is_online_payment_enabled: settings.is_online_payment_enabled,
    });
    setSaveError(null);
    setSaveSuccess(false);
  }, [settings]);

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-7 w-32 rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure your store delivery, tax, and payment options
        </p>
      </div>

      {/* ── Success / Error messages ─────────────────────────────────────────── */}
      {saveSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Settings saved successfully
        </div>
      )}
      {saveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* ── Delivery & Tax ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900">Delivery & Tax</h3>
        <p className="text-xs text-gray-500 mt-0.5 mb-5">
          Defaults applied to new orders. Existing orders are not affected.
        </p>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Flat Delivery Charge (₹)"
              type="number"
              min="0"
              step="0.01"
              value={form.flat_delivery_charge}
              onChange={(e) =>
                handleChange(
                  "flat_delivery_charge",
                  parseFloat(e.target.value) || 0
                )
              }
              hint="Charged on every order"
            />
            <Input
              label="Free Delivery Above (₹)"
              type="number"
              min="0"
              step="0.01"
              value={form.free_delivery_above}
              onChange={(e) =>
                handleChange(
                  "free_delivery_above",
                  parseFloat(e.target.value) || 0
                )
              }
              hint="Set 0 to always charge delivery"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default Tax (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.default_tax_percent}
              onChange={(e) =>
                handleChange(
                  "default_tax_percent",
                  parseFloat(e.target.value) || 0
                )
              }
              hint="Applied to products with no tax set"
            />
          </div>
        </div>
      </div>

      {/* ── Payment Methods ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900">Payment Methods</h3>
        <p className="text-xs text-gray-500 mt-0.5 mb-5">
          Enable or disable payment options for customers
        </p>

        <div className="flex flex-col gap-4">
          {/* COD */}
          <div className="flex items-start justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Cash on Delivery
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Accept COD payments at the doorstep.
              </p>
            </div>
            <Toggle
              checked={form.is_cod_enabled}
              onChange={(v) => handleChange("is_cod_enabled", v)}
            />
          </div>

          {/* Online payments */}
          <div className="flex items-start justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Online Payments
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Accept UPI, cards, and netbanking via Razorpay.
              </p>
            </div>
            <Toggle
              checked={form.is_online_payment_enabled}
              onChange={(v) => handleChange("is_online_payment_enabled", v)}
            />
          </div>

          {/* Warning if both disabled */}
          {!form.is_cod_enabled && !form.is_online_payment_enabled && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
              Warning — at least one payment method must be enabled for
              customers to checkout.
            </div>
          )}
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={handleReset} disabled={isSaving}>
          Reset
        </Button>
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          loadingText="Saving..."
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}
