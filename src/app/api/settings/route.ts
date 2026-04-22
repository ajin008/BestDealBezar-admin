import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── GET /api/settings ─────────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("store_settings")
      .select("*")
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/settings ───────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    const admin = createAdminClient();

    // Get the single settings row id first
    const { data: existing } = await admin
      .from("store_settings")
      .select("id")
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Settings not found" },
        { status: 404 }
      );
    }

    const { data, error } = await admin
      .from("store_settings")
      .update({
        flat_delivery_charge: body.flat_delivery_charge,
        free_delivery_above: body.free_delivery_above,
        default_tax_percent: body.default_tax_percent,
        is_cod_enabled: body.is_cod_enabled,
        is_online_payment_enabled: body.is_online_payment_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[PATCH /api/settings]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
