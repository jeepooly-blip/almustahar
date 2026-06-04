import { NextResponse } from "next/server";
import { mockAnalyses } from "@/lib/mock-data";
import { generateAnalysis } from "@/lib/ai-mock";
import { prisma } from "@/lib/db";
import { z } from "zod";
import type { DocumentType } from "@/lib/types";

const RequestSchema = z.object({
  id: z.string(),
  docType: z.enum(["rental", "employment", "traffic", "consumer", "general"]),
  title: z.string().optional(),
  plan: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
    }
    const { id, docType, title, userId } = parsed.data;

    const analysis = await generateAnalysis({
      id,
      docType: docType as DocumentType,
      title: title ?? "",
    });

    if (process.env.DATABASE_URL) {
      try {
        const created = await prisma.analysis.create({
          data: {
            id: analysis.id,
            documentId: analysis.documentId,
            userId: userId ?? analysis.userId,
            documentType: analysis.documentType,
            documentTitle: analysis.documentTitle,
            summary: analysis.summary,
            rights: analysis.rights,
            obligations: analysis.obligations,
            risks: analysis.risks as any,
            lawyerScore: analysis.lawyerScore,
            lawyerReason: analysis.lawyerReason,
            nextSteps: analysis.nextSteps as any,
            sources: analysis.sources as any,
            confidenceScore: analysis.confidenceScore,
            reviewStatus: analysis.reviewStatus,
          },
        });
        return NextResponse.json({ analysisId: created.id });
      } catch (e) {
        console.error("Prisma insert failed, returning generated analysis anyway:", e);
      }
    }

    mockAnalyses.unshift(analysis);
    return NextResponse.json({ analysisId: analysis.id });
  } catch (e) {
    console.error("Analyze error:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
