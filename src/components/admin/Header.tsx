"use client";

import { useCallback } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export function Header() {
  const { adminProfile, logout, isLoading } = useAuth();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Left — can add breadcrumbs here later */}
      <div />

      {/* Right — admin info + logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900">
            <span className="text-xs font-semibold text-white">
              {adminProfile?.name
                ? adminProfile.name.slice(0, 2).toUpperCase()
                : "AD"}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-none">
              {adminProfile?.name ?? "Admin"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Admin</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          isLoading={isLoading}
          aria-label="Sign out"
          className="text-gray-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
