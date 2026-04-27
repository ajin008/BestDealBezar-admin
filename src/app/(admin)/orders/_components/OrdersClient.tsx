"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/Button";
import { formatPrice, formatDateTime } from "@/lib/utils";
import {
  ROUTES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/constants";
import type { Order } from "@/types";
import type { OrderStatus } from "@/lib/constants";

// ─── Component ─────────────────────────────────────────────────────────────────

export function OrdersClient() {
  const router = useRouter();
  const {
    orders,
    totalCount,
    totalPages,
    isLoading,
    error,
    filters,
    setFilters,
  } = useOrders();

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ search: e.target.value, page: 1 });
    },
    [setFilters]
  );

  const handleStatusFilter = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilters({ status: e.target.value as OrderStatus | "", page: 1 });
    },
    [setFilters]
  );

  const handlePaymentFilter = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilters({
        payment_method: e.target.value as "razorpay" | "cod" | "",
        page: 1,
      });
    },
    [setFilters]
  );

  const handleViewOrder = useCallback(
    (id: string) => {
      router.push(ROUTES.ORDER_DETAIL(id));
    },
    [router]
  );

  // ─── Pagination helpers ───────────────────────────────────────────────────────

  const pageSize = 15;
  const currentPage = filters.page;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Generate page numbers to show — always show first, last, current ± 1
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [];
    const showAround = new Set([
      1,
      totalPages,
      currentPage,
      currentPage - 1,
      currentPage + 1,
    ]);

    let prev: number | null = null;
    for (let i = 1; i <= totalPages; i++) {
      if (showAround.has(i)) {
        if (prev !== null && i - prev > 1) pages.push("...");
        pages.push(i);
        prev = i;
      }
    }

    return pages;
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount} order{totalCount !== 1 ? "s" : ""} total
          </p>
        </div>
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
              placeholder="Search by order #, name or phone..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={handleStatusFilter}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment filter */}
          <select
            value={filters.payment_method}
            onChange={handlePaymentFilter}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">All payments</option>
            <option value="razorpay">Online Payment</option>
            <option value="cod">Cash on Delivery</option>
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
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-gray-900">No orders found</p>
            <p className="text-sm text-gray-500 mt-1">
              {filters.search || filters.status || filters.payment_method
                ? "Try adjusting your filters"
                : "Orders will appear here once customers start purchasing"}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onView={handleViewOrder}
                  />
                ))}
              </tbody>
            </table>

            {/* ── Table footer — count + pagination ────────────────────────── */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                {/* Result count */}
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-medium text-gray-700">{startItem}</span>
                  {" – "}
                  <span className="font-medium text-gray-700">{endItem}</span>
                  {" of "}
                  <span className="font-medium text-gray-700">
                    {totalCount}
                  </span>
                  {" orders"}
                </p>

                {/* Page controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    {/* Prev */}
                    <button
                      onClick={() => setFilters({ page: currentPage - 1 })}
                      disabled={!hasPrev || isLoading}
                      className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {/* Page numbers */}
                    {getPageNumbers().map((page, index) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="flex items-center justify-center h-8 w-8 text-xs text-gray-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setFilters({ page: page as number })}
                          disabled={isLoading}
                          className={`flex items-center justify-center h-8 w-8 rounded-lg text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                            page === currentPage
                              ? "bg-gray-900 text-white"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                          aria-label={`Page ${page}`}
                          aria-current={
                            page === currentPage ? "page" : undefined
                          }
                        >
                          {page}
                        </button>
                      )
                    )}

                    {/* Next */}
                    <button
                      onClick={() => setFilters({ page: currentPage + 1 })}
                      disabled={!hasNext || isLoading}
                      className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Order Row ─────────────────────────────────────────────────────────────────

interface OrderRowProps {
  order: Order;
  onView: (id: string) => void;
}

function OrderRow({ order, onView }: OrderRowProps) {
  const statusColor =
    ORDER_STATUS_COLORS[order.status as OrderStatus] ??
    "bg-gray-100 text-gray-700";
  const statusLabel =
    ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status;
  const paymentLabel =
    PAYMENT_METHOD_LABELS[order.payment_method as "razorpay" | "cod"] ??
    order.payment_method;
  const itemCount = order.items?.length ?? 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Order number + items */}
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">#{order.order_number}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </p>
      </td>

      {/* Customer */}
      <td className="px-4 py-3 hidden md:table-cell">
        <p className="font-medium text-gray-900">{order.customer_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{order.customer_phone}</p>
      </td>

      {/* Date */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <p className="text-gray-600">{formatDateTime(order.created_at)}</p>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
        >
          {statusLabel}
        </span>
      </td>

      {/* Payment */}
      <td className="px-4 py-3 hidden sm:table-cell">
        <p className="text-gray-600">{paymentLabel}</p>
        <p
          className={`text-xs mt-0.5 ${
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
      </td>

      {/* Total */}
      <td className="px-4 py-3 text-right">
        <p className="font-medium text-gray-900">
          {formatPrice(order.total_amount)}
        </p>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onView(order.id)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label={`View order ${order.order_number}`}
        >
          <Eye size={15} />
        </button>
      </td>
    </tr>
  );
}
