"use client";

import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { formatPrice, formatDateTime } from "@/lib/utils";
import {
  ROUTES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/lib/constants";
import type { DashboardStats } from "@/hooks/useDashboard";
import type { OrderStatus } from "@/lib/constants";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RecentOrdersProps {
  stats: DashboardStats;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function RecentOrders({ stats }: RecentOrdersProps) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 10 orders</p>
        </div>
        <button
          onClick={() => router.push(ROUTES.ORDERS)}
          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          View all →
        </button>
      </div>

      {stats.recent_orders.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-400">No orders yet</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.recent_orders.map((order) => {
              const statusColor =
                ORDER_STATUS_COLORS[order.status as OrderStatus] ??
                "bg-gray-100 text-gray-700";
              const statusLabel =
                ORDER_STATUS_LABELS[order.status as OrderStatus] ??
                order.status;

              return (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(ROUTES.ORDER_DETAIL(order.id))}
                >
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">
                      #{order.order_number}
                    </p>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell">
                    <p className="text-gray-700">{order.customer_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.customer_phone}
                    </p>
                  </td>
                  <td className="px-6 py-3 hidden lg:table-cell">
                    <p className="text-gray-600 text-xs">
                      {formatDateTime(order.created_at)}
                    </p>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <p className="font-medium text-gray-900">
                      {formatPrice(order.total_amount)}
                    </p>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Eye size={15} className="text-gray-300 inline" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
