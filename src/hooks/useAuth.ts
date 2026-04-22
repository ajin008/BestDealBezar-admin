"use client";

import { createClient, resetClient } from "@/lib/supabase/client";
import { useEffect, useCallback, useRef } from "react";
import {
  useAuthStore,
  selectUser,
  selectAdminProfile,
  selectIsLoading,
  selectIsAuthenticated,
  selectIsInitialized,
} from "@/store/authStore";
import { ROUTES } from "@/lib/constants";
import type { ApiResponse, AdminProfile } from "@/types";

interface LoginCredentials {
  email: string;
  password: string;
}

interface UseAuthReturn {
  user: ReturnType<typeof selectUser>;
  adminProfile: ReturnType<typeof selectAdminProfile>;
  isLoading: ReturnType<typeof selectIsLoading>;
  isAuthenticated: ReturnType<typeof selectIsAuthenticated>;
  isInitialized: ReturnType<typeof selectIsInitialized>;
  login: (credentials: LoginCredentials) => Promise<ApiResponse<AdminProfile>>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const supabase = createClient();
  const hasInitialized = useRef(false);

  const user = useAuthStore(selectUser);
  const adminProfile = useAuthStore(selectAdminProfile);
  const isLoading = useAuthStore(selectIsLoading);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isInitialized = useAuthStore(selectIsInitialized);

  const { setUser, setAdminProfile, setLoading, setInitialized, reset } =
    useAuthStore();

  // ─── Fetch admin profile ──────────────────────────────────────────────────

  const fetchAdminProfile = useCallback(
    async (userId: string): Promise<AdminProfile | null> => {
      try {
        const { data, error } = await supabase
          .from("admin_profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error || !data) {
          console.error("[useAuth] fetchAdminProfile:", error?.message);
          return null;
        }
        return data as AdminProfile;
      } catch {
        return null;
      }
    },
    [supabase]
  );

  // ─── Auth listener — single source of truth ───────────────────────────────
  // onAuthStateChange fires INITIAL_SESSION on mount with the existing session
  // This replaces the manual getSession() call entirely

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log(
        "[useAuth] event:",
        event,
        "user:",
        session?.user?.id ?? "none"
      );

      // INITIAL_SESSION fires on every mount with the current session state
      // SIGNED_IN fires after login
      // TOKEN_REFRESHED fires when JWT is auto-refreshed
      // SIGNED_OUT fires after logout
      if (event === "SIGNED_OUT") {
        reset();
        return;
      }

      if (!session?.user) {
        // No session — mark initialized so UI stops showing skeleton
        reset();
        return;
      }

      // We have a session — check if we already have this user's profile loaded
      const state = useAuthStore.getState();
      if (state.user?.id === session.user.id && state.adminProfile) {
        // Already have everything — just mark initialized
        setInitialized(true);
        return;
      }

      // Fetch admin profile
      const profile = await fetchAdminProfile(session.user.id);

      if (!isMounted) return;

      if (!profile || !profile.is_active) {
        await supabase.auth.signOut();
        reset();
        return;
      }

      setUser(session.user);
      setAdminProfile(profile);
      setInitialized(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Login ────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (
      credentials: LoginCredentials
    ): Promise<ApiResponse<AdminProfile>> => {
      setLoading(true);
      try {
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

        if (authError || !authData.user) {
          return {
            data: null,
            error: authError?.message ?? "Login failed. Please try again.",
          };
        }

        const profile = await fetchAdminProfile(authData.user.id);

        if (!profile) {
          await supabase.auth.signOut();
          return { data: null, error: "Admin profile not found." };
        }

        if (!profile.is_active) {
          await supabase.auth.signOut();
          return { data: null, error: "Your account has been deactivated." };
        }

        setUser(authData.user);
        setAdminProfile(profile);
        setInitialized(true);
        return { data: profile, error: null };
      } catch (err) {
        console.error("[useAuth] login error:", err);
        return { data: null, error: "An unexpected error occurred." };
      } finally {
        setLoading(false);
      }
    },
    [
      supabase,
      fetchAdminProfile,
      setLoading,
      setUser,
      setAdminProfile,
      setInitialized,
    ]
  );

  // ─── Logout ───────────────────────────────────────────────────────────────

  const logout = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      resetClient();
      reset();
      window.location.href = ROUTES.LOGIN;
    } catch (err) {
      console.error("[useAuth] logout error:", err);
    }
  }, [supabase, reset]);

  return {
    user,
    adminProfile,
    isLoading,
    isAuthenticated,
    isInitialized,
    login,
    logout,
  };
}
