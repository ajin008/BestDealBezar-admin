import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/auth/profile
 * Returns the admin profile for the currently authenticated user.
 * Uses service role client to bypass RLS — safe because we
 * verify the user's JWT first via the regular server client.
 */
export async function GET() {
  try {
    // Step 1 — Verify the user's JWT using the regular server client
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2 — Fetch profile using admin client (bypasses RLS)
    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from("admin_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Admin profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[GET /api/auth/profile] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
