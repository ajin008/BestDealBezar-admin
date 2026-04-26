"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { useOrder } from "@/hooks/useOrders";
import { Button } from "@/components/ui/Button";
import { formatPrice, formatDateTime } from "@/lib/utils";
import {
  ROUTES,
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/constants";
import type { OrderStatus } from "@/lib/constants";

// ─── Props ─────────────────────────────────────────────────────────────────────

interface OrderDetailClientProps {
  id: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function OrderDetailClient({ id }: OrderDetailClientProps) {
  const router = useRouter();
  const { order, isLoading, error, updateStatus, updateNotes } = useOrder(id);

  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);

  // ─── Status update ───────────────────────────────────────────────────────────

  const handleStatusUpdate = useCallback(
    async (newStatus: string) => {
      if (!order) return;
      setIsUpdating(true);
      setUpdateError(null);
      const result = await updateStatus(order.id, newStatus);
      if (result.error) setUpdateError(result.error);
      setIsUpdating(false);
    },
    [order, updateStatus]
  );

  // ─── Notes update ────────────────────────────────────────────────────────────

  const handleNotesUpdate = useCallback(async () => {
    if (!order) return;
    setIsUpdating(true);
    const result = await updateNotes(order.id, notes);
    if (result.error) setUpdateError(result.error);
    setIsUpdating(false);
  }, [order, notes, updateNotes]);

  // ─── Cancel order ─────────────────────────────────────────────────────────────

  const handleCancelOrder = useCallback(async () => {
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    await handleStatusUpdate("cancelled");
  }, [handleStatusUpdate]);

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error ?? "Order not found"}
      </div>
    );
  }

  // ─── Status logic ─────────────────────────────────────────────────────────────

  const statusFlow: OrderStatus[] = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED,
  ];

  const isCancelled = order.status === ORDER_STATUS.CANCELLED;
  const isDelivered = order.status === ORDER_STATUS.DELIVERED;
  const isTerminal = isCancelled || isDelivered;

  const currentIndex = statusFlow.indexOf(order.status as OrderStatus);
  const nextStatus =
    currentIndex >= 0 ? statusFlow[currentIndex + 1] : undefined;

  const statusColor = isCancelled
    ? ORDER_STATUS_COLORS[ORDER_STATUS.CANCELLED]
    : ORDER_STATUS_COLORS[order.status as OrderStatus] ??
      "bg-gray-100 text-gray-700";

  const statusLabel = isCancelled
    ? ORDER_STATUS_LABELS[ORDER_STATUS.CANCELLED]
    : ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(ROUTES.ORDERS)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to orders
        </button>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusColor}`}
          >
            {statusLabel}
          </span>

          {/* Cancel button — visible for all non-terminal statuses */}
          {!isTerminal && (
            <Button
              size="sm"
              variant="danger"
              isLoading={isUpdating}
              onClick={handleCancelOrder}
            >
              Cancel order
            </Button>
          )}

          {/* Next status button — visible only if there's a next step */}
          {!isTerminal && nextStatus && (
            <Button
              size="sm"
              isLoading={isUpdating}
              onClick={() => handleStatusUpdate(nextStatus)}
            >
              Mark as {ORDER_STATUS_LABELS[nextStatus]}
            </Button>
          )}
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {updateError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {updateError}
        </div>
      )}

      {/* ── Cancelled banner ──────────────────────────────────────────────────── */}
      {isCancelled && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          This order has been cancelled and cannot be updated further.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left — order items + notes ───────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Order items */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                Order #{order.order_number}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDateTime(order.created_at)}
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    {item.product_image_url ? (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name}
                        className="h-full w-full object-cover rounded-lg"
                        loading="lazy"
                      />
                    ) : (
                      <Package size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatPrice(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatPrice(item.total_price)}
                  </p>
                </div>
              ))}
            </div>

            {/* Order totals */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Discount {order.coupon_code && `(${order.coupon_code})`}
                  </span>
                  <span>− {formatPrice(order.discount_amount)}</span>
                </div>
              )}
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery fee</span>
                  <span>{formatPrice(order.delivery_fee)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Notes — hide for cancelled orders */}
          {!isCancelled && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Notes
              </h3>
              <textarea
                value={notes || order.notes || ""}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this order..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
              />
              <Button
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={handleNotesUpdate}
                isLoading={isUpdating}
              >
                Save notes
              </Button>
            </div>
          )}
        </div>

        {/* ── Right — customer + payment info ──────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Customer info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Customer
            </h3>
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {order.customer_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {order.customer_phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {order.customer_email}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Delivery address
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>{order.delivery_address}</p>
              <p>
                {order.delivery_city} — {order.delivery_pincode}
              </p>
            </div>
          </div>

          {/* Payment info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Payment
            </h3>
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Method</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {PAYMENT_METHOD_LABELS[
                    order.payment_method as "razorpay" | "cod"
                  ] ?? order.payment_method}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p
                  className={`font-medium mt-0.5 ${
                    order.payment_status === "paid"
                      ? "text-green-600"
                      : order.payment_status === "failed"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {order.payment_status.charAt(0).toUpperCase() +
                    order.payment_status.slice(1)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
