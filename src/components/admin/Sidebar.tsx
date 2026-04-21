"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Ticket,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES, APP_CONFIG } from "@/lib/constants";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// ─── Nav Items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    href: ROUTES.PRODUCTS,
    icon: Package,
  },
  {
    label: "Categories",
    href: ROUTES.CATEGORIES,
    icon: Tag,
  },
  {
    label: "Orders",
    href: ROUTES.ORDERS,
    icon: ShoppingBag,
  },
  {
    label: "Coupons",
    href: ROUTES.COUPONS,
    icon: Ticket,
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();

  // A route is active if the current path starts with the nav item href
  // This handles nested routes like /products/123 highlighting Products nav
  const isActive = (href: string) => {
    if (href === ROUTES.DASHBOARD) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-screen w-[220px] flex-col border-r border-gray-200 bg-white">
      {/* ── Brand ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 shrink-0">
          <Store size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {APP_CONFIG.NAME}
          </p>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav
        className="flex flex-col gap-1 p-3 flex-1"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                // Base styles
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                "transition-colors duration-150",
                // Active state
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={18}
                className={cn(
                  "shrink-0",
                  active ? "text-white" : "text-gray-400"
                )}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 p-3">
        <p className="px-3 text-xs text-gray-400">
          {APP_CONFIG.DELIVERY_AREA} district
        </p>
      </div>
    </aside>
  );
}
