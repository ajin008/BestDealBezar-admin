"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { StatsCards } from "./StatsCards";
import { OrderStatusBreakdown } from "./OrderStatusBreakdown";
import { QuickActions } from "./QuickActions";
import { RecentOrders } from "./RecentOrders";

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DashboardClient() {
  const { stats, isLoading, error } = useDashboard();

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-5 h-24 animate-pulse"
            />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white h-64 animate-pulse" />
          <div className="rounded-xl border border-gray-200 h-64 animate-pulse bg-gray-50" />
        </div>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load dashboard: {error}
      </div>
    );
  }

  if (!stats) return null;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page title ───────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your store</p>
      </div>

      {/* ── Stats cards ──────────────────────────────────────────────────────── */}
      <StatsCards stats={stats} />

      {/* ── Middle row — status breakdown + quick actions ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrderStatusBreakdown stats={stats} />
        </div>
        <QuickActions />
      </div>

      {/* ── Recent orders ────────────────────────────────────────────────────── */}
      <RecentOrders stats={stats} />
    </div>
  );
}
