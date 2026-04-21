import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { User } from "@supabase/supabase-js";
import type { AdminProfile } from "@/types";

interface AuthState {
  user: User | null;
  adminProfile: AdminProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setAdminProfile: (profile: AdminProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  adminProfile: null,
  isLoading: false,
  isInitialized: false,
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setUser: (user) => set({ user }, false, "auth/setUser"),

        setAdminProfile: (adminProfile) =>
          set({ adminProfile }, false, "auth/setAdminProfile"),

        setLoading: (isLoading) => set({ isLoading }, false, "auth/setLoading"),

        setInitialized: (isInitialized) =>
          set({ isInitialized }, false, "auth/setInitialized"),

        reset: () =>
          set({ ...initialState, isInitialized: true }, false, "auth/reset"),
      }),
      {
        name: "adithya-admin-auth", // localStorage key
        // Only persist user and adminProfile — not loading states
        partialize: (state) => ({
          user: state.user,
          adminProfile: state.adminProfile,
          isInitialized: state.isInitialized,
        }),
      }
    ),
    { name: "AuthStore" }
  )
);

export const selectUser = (state: AuthState) => state.user;
export const selectAdminProfile = (state: AuthState) => state.adminProfile;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
export const selectIsAuthenticated = (state: AuthState) =>
  state.isInitialized && !!state.user;
