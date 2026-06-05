import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session-server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await getServerSession();
    if (!user || (user.role !== "ADMIN" && user.role !== "LAWYER")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? "PENDING_REVIEW";
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);

    const { data, error } = await supabaseAdmin
      .from("Analysis")
      .select("id, documentId, documentTitle, documentType, lawyerScore, confidenceScore, reviewStatus, createdAt, userId, summary")
      .eq("reviewStatus", status)
      .order("createdAt", { ascending: false })
      .limit(limit);
    if (error) {
      return NextResponse.json({ error: "db_error", reason: error.message }, { status: 500 });
    }
    return NextResponse.json({ analyses: data ?? [], count: (data ?? []).length });
  } catch (e) {
    console.error("List analyses error:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
