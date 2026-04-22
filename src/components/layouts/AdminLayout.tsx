"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isInitialized, isAuthenticated } = useAuth();
  const [forceShow, setForceShow] = useState(false);

  // Safety net — if auth takes more than 3s, force show content
  // This prevents permanent skeleton if something goes wrong
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isInitialized) {
        console.warn("[AdminLayout] auth timeout — forcing render");
        setForceShow(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isInitialized]);

  const shouldShow = isInitialized || forceShow;

  if (!shouldShow) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="w-55 border-r border-gray-200 bg-white shrink-0" />
        <div className="flex flex-1 flex-col min-w-0">
          <div className="h-16 border-b border-gray-200 bg-white shrink-0" />
          <div className="flex-1 p-6">
            <div className="h-7 w-40 rounded-lg bg-gray-200 animate-pulse mb-4" />
            <div className="h-40 rounded-xl bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
