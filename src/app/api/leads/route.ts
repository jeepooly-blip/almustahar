import { NextResponse } from "next/server";
import { z } from "zod";
import { createLead } from "@/lib/data";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";

const Schema = z.object({
  lawyerId: z.string(),
  documentType: z.enum(["rental", "employment", "traffic", "consumer", "general"]).default("general"),
  message: z.string().min(5),
  feeOffered: z.number().min(0).optional(),
  attachAnalysis: z.boolean().optional(),
  analysisContext: z
    .object({
      id: z.string(),
      title: z.string(),
      summary: z.string(),
    })
    .nullable()
    .optional(),
  userName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // ---- Authentication required ----
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = checkRateLimit(`leads:${ip}`, { perMinute: 3, perHour: 20 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "rate_limited", retryAfter: rl.retryAfter },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } },
      );
    }

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
    }
    const { lawyerId, documentType, message, feeOffered, analysisContext, userName } = parsed.data;

    const lead = await createLead({
      userId: session.id,
      userName: userName ?? session.name,
      lawyerId,
      documentType,
      message,
      feeOffered,
      analysisId: analysisContext?.id,
      analysisSummary: analysisContext?.summary,
    });
    return NextResponse.json({ leadId: lead.id, status: "ok" });
  } catch (e) {
    console.error("Leads POST error:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}