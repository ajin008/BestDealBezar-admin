"use client";

import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/constants";
import type { DashboardStats } from "@/hooks/useDashboard";
import type { OrderStatus } from "@/lib/constants";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface OrderStatusBreakdownProps {
  stats: DashboardStats;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function OrderStatusBreakdown({ stats }: OrderStatusBreakdownProps) {
  const total = stats.order_status_breakdown.reduce(
    (sum, s) => sum + s.count,
    0
  );

  // Sort by status flow order
  const statusOrder = ["pending", "confirmed", "out_for_delivery", "delivered"];
  const sorted = [...stats.order_status_breakdown].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 flex-1">
      <h3 className="text-sm font-semibold text-gray-900">
        Order Status Breakdown
      </h3>
      <p className="text-xs text-gray-500 mt-0.5">
        Distribution across all orders
      </p>

      {total === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-400">No orders yet</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {sorted.map(({ status, count }) => {
            const percentage = Math.round((count / total) * 100);
            const colorClass =
              ORDER_STATUS_COLORS[status as OrderStatus] ??
              "bg-gray-100 text-gray-700";
            const label = ORDER_STATUS_LABELS[status as OrderStatus] ?? status;

            // Extract bg color for progress bar
            const barColor =
              status === "pending"
                ? "bg-yellow-400"
                : status === "confirmed"
                ? "bg-blue-400"
                : status === "out_for_delivery"
                ? "bg-purple-400"
                : "bg-green-400";

            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
                    >
                      {label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {count}
                    </span>
                    <span className="text-xs text-gray-400">{percentage}%</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-1.5 rounded-full ${barColor} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
