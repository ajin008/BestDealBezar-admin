import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { User } from "@supabase/supabase-js";
import type { AdminProfile } from "@/types";

// ─── State Shape ───────────────────────────────────────────────────────────────

interface AuthState {
  // ── State ──────────────────────────────────────────────────────────────────
  user: User | null;
  adminProfile: AdminProfile | null;
  isLoading: boolean;
  isInitialized: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  setUser: (user: User | null) => void;
  setAdminProfile: (profile: AdminProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      // ── Initial state ───────────────────────────────────────────────────────
      user: null,
      adminProfile: null,
      isLoading: false,
      isInitialized: false,

      // ── Actions ─────────────────────────────────────────────────────────────

      setUser: (user) => set({ user }, false, "auth/setUser"),

      setAdminProfile: (adminProfile) =>
        set({ adminProfile }, false, "auth/setAdminProfile"),

      setLoading: (isLoading) => set({ isLoading }, false, "auth/setLoading"),

      setInitialized: (isInitialized) =>
        set({ isInitialized }, false, "auth/setInitialized"),

      // reset sets isInitialized: true intentionally —
      // so the UI never gets stuck showing the skeleton
      // after a failed auth or sign out
      reset: () =>
        set(
          {
            user: null,
            adminProfile: null,
            isLoading: false,
            isInitialized: true,
          },
          false,
          "auth/reset"
        ),
    }),
    {
      name: "AuthStore",
    }
  )
);

// ─── Selectors ─────────────────────────────────────────────────────────────────
// Use selectors in components to prevent unnecessary re-renders.
// Component only re-renders when the specific piece of state it
// subscribes to actually changes.

export const selectUser = (state: AuthState) => state.user;
export const selectAdminProfile = (state: AuthState) => state.adminProfile;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
export const selectIsAuthenticated = (state: AuthState) =>
  state.isInitialized && !!state.user;
