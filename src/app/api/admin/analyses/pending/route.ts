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
    const page = Math.max(parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 200);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const [{ data, error }, countResult] = await Promise.all([
      supabaseAdmin
        .from("Analysis")
        .select("id, documentId, documentTitle, documentType, lawyerScore, confidenceScore, reviewStatus, createdAt, userId, summary")
        .eq("reviewStatus", status)
        .order("createdAt", { ascending: false })
        .range(from, to),
      supabaseAdmin
        .from("Analysis")
        .select("id", { count: "exact", head: true })
        .eq("reviewStatus", status),
    ]);

    if (error) {
      return NextResponse.json({ error: "db_error", reason: error.message }, { status: 500 });
    }
    return NextResponse.json({
      analyses: data ?? [],
      page,
      limit,
      totalCount: countResult.count ?? 0,
      totalPages: Math.ceil((countResult.count ?? 0) / limit),
    });
  } catch (e) {
    console.error("List analyses error:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
