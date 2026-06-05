import { NextResponse } from "next/server";
import { z } from "zod";
import { mockAnalyses } from "@/lib/mock-data";
import { updateAnalysisReview } from "@/lib/data";
import { getServerSession } from "@/lib/session-server";

const Schema = z.object({
  action: z.enum(["approve", "reject", "flag", "edit"]),
  notes: z.string().optional(),
  reviewerId: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Auth: only ADMIN or LAWYER can review
    const user = await getServerSession();
    if (!user || (user.role !== "ADMIN" && user.role !== "LAWYER")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    const status =
      parsed.data.action === "approve"
        ? "APPROVED"
        : parsed.data.action === "reject"
          ? "REJECTED"
          : "FLAGGED";
    const reviewerId = parsed.data.reviewerId ?? user.id;
    const updated = await updateAnalysisReview(
      id,
      status,
      reviewerId,
      parsed.data.notes,
    );
    if (!updated) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error("Review error:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
