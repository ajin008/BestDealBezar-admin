"use client";

import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Package,
  ShoppingBag,
  Ticket,
  Settings,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Manage products",
    description: "Add or edit products",
    icon: Package,
    href: ROUTES.PRODUCTS,
  },
  {
    label: "View all orders",
    description: "See and update orders",
    icon: ShoppingBag,
    href: ROUTES.ORDERS,
  },
  {
    label: "Create coupon",
    description: "Add a discount code",
    icon: Ticket,
    href: ROUTES.COUPONS,
  },
  {
    label: "Manage categories",
    description: "Organise product categories",
    icon: Settings,
    href: ROUTES.CATEGORIES,
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
      <p className="text-xs text-gray-500 mt-0.5">Jump into common tasks</p>

      <div className="mt-4 flex flex-col gap-1">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.href}
              onClick={() => router.push(action.href)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                  <Icon size={15} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-400">{action.description}</p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className="text-gray-300 group-hover:text-gray-500 transition-colors"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
