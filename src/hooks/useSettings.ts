"use client";

import { useState, useEffect, useCallback } from "react";
import type { StoreSettings } from "@/types";

interface UseSettingsReturn {
  settings: StoreSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (
    data: Partial<StoreSettings>
  ) => Promise<{ error: string | null }>;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/settings", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch settings");
        const { data } = await res.json();
        if (isMounted) setSettings(data);
      } catch (err: unknown) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load settings";
        setError(message);
        console.error("[useSettings] load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateSettings = useCallback(
    async (data: Partial<StoreSettings>): Promise<{ error: string | null }> => {
      try {
        const res = await fetch("/api/settings", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const { error } = await res.json();
          return { error: error ?? "Failed to update settings" };
        }

        const { data: updated } = await res.json();
        setSettings(updated);
        return { error: null };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update settings";
        console.error("[useSettings] updateSettings error:", err);
        return { error: message };
      }
    },
    []
  );

  return { settings, isLoading, error, updateSettings };
}
