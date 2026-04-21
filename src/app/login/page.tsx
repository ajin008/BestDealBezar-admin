import { Suspense } from "react";
import { Metadata } from "next";
import { APP_CONFIG } from "@/lib/constants";
import { LoginForm } from "./_components/LoginForm";

// ─── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: `Login — ${APP_CONFIG.NAME} Admin`,
  description: "Admin panel login",
};

// ─── Page ──────────────────────────────────────────────────────────────────────
// Server Component — no auth check needed here
// Middleware already redirects authenticated users away from /login

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900 rounded-xl mb-4">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {APP_CONFIG.NAME}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to admin panel</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Suspense required because LoginForm uses useSearchParams */}
          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          {APP_CONFIG.DESCRIPTION}
        </p>
      </div>
    </main>
  );
}
