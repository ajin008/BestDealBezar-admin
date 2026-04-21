"use client";

import { createClient, resetClient } from "@/lib/supabase/client";
import { useEffect, useCallback } from "react";
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

  const user = useAuthStore(selectUser);
  const adminProfile = useAuthStore(selectAdminProfile);
  const isLoading = useAuthStore(selectIsLoading);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isInitialized = useAuthStore(selectIsInitialized);

  const { setUser, setAdminProfile, setLoading, setInitialized, reset } =
    useAuthStore();

  const fetchAdminProfile = useCallback(
    async (userId: string): Promise<AdminProfile | null> => {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !data) {
        console.error("[useAuth] fetchAdminProfile error:", error?.message);
        return null;
      }

      return data as AdminProfile;
    },
    [supabase]
  );

  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      try {
        // getSession reads from cookies — fast, no network call
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (!session?.user) {
          reset();
          return;
        }

        // If we already have the profile in store — skip fetching
        if (user?.id === session.user.id && adminProfile) {
          setInitialized(true);
          return;
        }

        const profile = await fetchAdminProfile(session.user.id);

        if (!isMounted) return;

        if (!profile || !profile.is_active) {
          await supabase.auth.signOut();
          reset();
          return;
        }

        setUser(session.user);
        setAdminProfile(profile);
      } catch (err) {
        console.error("[useAuth] initializeSession error:", err);
        if (isMounted) reset();
      } finally {
        if (isMounted) setInitialized(true);
      }
    }

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        reset();
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const profile = await fetchAdminProfile(session.user.id);

        if (!profile || !profile.is_active) {
          await supabase.auth.signOut();
          reset();
          return;
        }

        setUser(session.user);
        setAdminProfile(profile);
        setInitialized(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
