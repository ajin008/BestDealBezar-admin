"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

// ─── Validation ────────────────────────────────────────────────────────────────

function validateForm(values: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address";
  }

  if (!values.password) {
    errors.password = "Password is required";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  return errors;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuth();

  const [formState, setFormState] = useState<FormState>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear error for this field as user types
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Client-side validation
      const validationErrors = validateForm(formState);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Clear previous errors
      setErrors({});

      // Call login from useAuth hook
      const result = await login({
        email: formState.email.trim(),
        password: formState.password,
      });

      if (result.error) {
        setErrors({ general: result.error });
        return;
      }

      // Redirect — go back to where they were trying to go, or dashboard
      const redirectTo = searchParams.get("redirectTo") ?? ROUTES.DASHBOARD;
      router.push(redirectTo);
      router.refresh();
    },
    [formState, login, router, searchParams]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* General error */}
      {errors.general && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {errors.general}
        </div>
      )}

      {/* Email */}
      <div className="relative">
        <Input
          label="Email"
          type="email"
          placeholder="admin@example.com"
          value={formState.email}
          onChange={handleChange("email")}
          error={errors.email}
          required
          autoComplete="email"
          autoFocus
          disabled={isLoading}
        />
        <Mail
          size={16}
          className="absolute right-3 top-9 text-gray-400 pointer-events-none"
        />
      </div>

      {/* Password */}
      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={formState.password}
          onChange={handleChange("password")}
          error={errors.password}
          required
          autoComplete="current-password"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        isLoading={isLoading}
        loadingText="Signing in..."
        className="w-full mt-1"
      >
        <Lock size={16} />
        Sign in
      </Button>
    </form>
  );
}
