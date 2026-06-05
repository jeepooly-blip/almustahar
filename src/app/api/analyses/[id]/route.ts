import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session-server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getAnalysisById } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getServerSession();

    // Try direct REST first (works on Vercel)
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("Analysis")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        return NextResponse.json({ error: "db_error", reason: error.message }, { status: 500 });
      }
      if (data) {
        // Authorize: owner, admin, or lawyer
        if (!user) {
          return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }
        if (
          user.role !== "ADMIN" &&
          user.role !== "LAWYER" &&
          data.userId !== user.id
        ) {
          return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }
        return NextResponse.json({ analysis: data });
      }
    }

    // Fallback: Prisma data layer
    const a = await getAnalysisById(id);
    if (!a) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN" && user.role !== "LAWYER" && a.userId !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ analysis: a });
  } catch (e) {
    console.error("Get analysis error:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
