import { NextResponse } from "next/server";
import { z } from "zod";
import { createLead } from "@/lib/data";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Schema = z.object({
  lawyerId: z.string(),
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
  userId: z.string().optional(),
  userName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
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
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    const { lawyerId, message, feeOffered, analysisContext, userId, userName } = parsed.data;
    const lead = await createLead({
      userId: userId ?? "u1",
      userName: userName ?? "مستخدم",
      lawyerId,
      documentType: "rental",
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
