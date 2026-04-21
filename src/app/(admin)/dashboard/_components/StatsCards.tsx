"use client";

import { ShoppingBag, IndianRupee, Package, AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { DashboardStats } from "@/hooks/useDashboard";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StatsCardsProps {
  stats: DashboardStats;
}

interface StatCard {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function StatsCards({ stats }: StatsCardsProps) {
  const cards: StatCard[] = [
    {
      label: "Orders Today",
      value: String(stats.orders_today),
      icon: ShoppingBag,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Revenue Today",
      value: formatPrice(stats.revenue_today),
      icon: IndianRupee,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Active Products",
      value: String(stats.active_products),
      icon: Package,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      label: "Low Stock",
      value: String(stats.low_stock_count),
      icon: AlertTriangle,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="mt-1.5 text-2xl font-semibold text-gray-900">
                  {card.value}
                </p>
              </div>
              <div className={`rounded-lg p-2.5 ${card.iconBg}`}>
                <Icon size={20} className={card.iconColor} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
