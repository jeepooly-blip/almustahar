import { NextResponse } from "next/server";
import { mockAnalyses } from "@/lib/mock-data";
import { generateAnalysis, isGeminiConfigured } from "@/lib/ai-gemini";
import { prisma } from "@/lib/db";
import { saveAnalysisWithUser } from "@/lib/analyze-save";
import { z } from "zod";
import type { DocumentType } from "@/lib/types";

const RequestSchema = z.object({
  id: z.string(),
  docType: z.enum(["rental", "employment", "traffic", "consumer", "general"]),
  title: z.string().nullish(),
  plan: z.string().nullish(),
  userId: z.string().nullish(),
  content: z.string().nullish(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
    }
    const { id, docType, title, userId, content } = parsed.data;

    const analysis = await generateAnalysis({
      id,
      docType: docType as DocumentType,
      title: title ?? "",
      content: content ?? undefined,
    });

    const provider = isGeminiConfigured() ? "gemini" : "mock";

    if (process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const saveRes = await saveAnalysisWithUser(
        analysis,
        { userId: userId ?? null, demoPhone: "+962791234567" },
        content ?? "",
      );
      if (saveRes.ok) {
        return NextResponse.json({
          analysisId: analysis.id,
          provider,
          savedVia: saveRes.source,
        });
      }
      console.error("SAVE_FAILED:", saveRes.reason);
      return NextResponse.json(
        { error: "db_insert_failed", reason: saveRes.reason, code: saveRes.code, analysisId: analysis.id, provider },
        { status: 500 },
      );
    }

    mockAnalyses.unshift(analysis);
    return NextResponse.json({ analysisId: analysis.id, provider });
  } catch (e) {
    console.error("Analyze error:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
