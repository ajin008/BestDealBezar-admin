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
        console.log("[fetchAdminProfile] calling API for:", userId);

        const response = await fetch("/api/auth/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Important — send cookies with the request
          credentials: "include",
        });

        console.log("[fetchAdminProfile] response status:", response.status);

        if (!response.ok) {
          console.error("[fetchAdminProfile] API error:", response.status);
          return null;
        }

        const { profile } = await response.json();
        console.log("[fetchAdminProfile] profile:", profile);
        return profile as AdminProfile;
      } catch (err) {
        console.error("[fetchAdminProfile] exception:", err);
        return null;
      }
    },
    [] // No supabase dependency — uses fetch API instead
  );

  // ─── Core auth handler ────────────────────────────────────────────────────
  // Shared between onAuthStateChange and getSession fallback

  const handleSession = useCallback(
    async (userId: string, userObj: object) => {
      // Already have this user loaded — skip
      const state = useAuthStore.getState();
      if (state.user?.id === userId && state.adminProfile) {
        setInitialized(true);
        return;
      }

      const profile = await fetchAdminProfile(userId);

      if (!profile || !profile.is_active) {
        await supabase.auth.signOut();
        reset();
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setUser(userObj as any);
      setAdminProfile(profile);
      setInitialized(true);
    },
    [
      supabase,
      fetchAdminProfile,
      setUser,
      setAdminProfile,
      setInitialized,
      reset,
    ]
  );

  // ─── Initialize ───────────────────────────────────────────────────────────

  useEffect(() => {
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

      if (event === "SIGNED_OUT" || !session?.user) {
        reset();
        return;
      }

      // ── Set user immediately — don't wait for profile ──────────────────────
      // This unblocks the UI right away
      setUser(session.user);
      setInitialized(true); // ← MOVE THIS UP — unblock UI immediately

      // Fetch profile in background
      const profile = await fetchAdminProfile(session.user.id);
      if (!isMounted) return;

      if (!profile || !profile.is_active) {
        await supabase.auth.signOut();
        reset();
        return;
      }

      setAdminProfile(profile); // ← update profile when ready
    });

    // Fallback
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted || !session?.user) {
        if (isMounted) reset();
        return;
      }
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
