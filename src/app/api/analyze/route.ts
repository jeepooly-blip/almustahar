import { NextResponse } from "next/server";
import { mockAnalyses } from "@/lib/mock-data";
import { generateAnalysis, isGeminiConfigured } from "@/lib/ai-gemini";
import { prisma } from "@/lib/db";
import { z } from "zod";
import type { DocumentType } from "@/lib/types";

const RequestSchema = z.object({
  id: z.string(),
  docType: z.enum(["rental", "employment", "traffic", "consumer", "general"]),
  title: z.string().optional(),
  plan: z.string().optional(),
  userId: z.string().optional(),
  content: z.string().optional(), // extracted text from the document
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
      content,
    });

    if (process.env.DATABASE_URL) {
      try {
        // Resolve a real userId (create a demo user if none provided)
        let realUserId = userId;
        const isCuid = realUserId && /^[a-z0-9]{20,30}$/i.test(realUserId);
        if (!isCuid) {
          const demo = await prisma.user.upsert({
            where: { phone: "+962791234567" },
            update: {},
            create: { phone: "+962791234567", name: "سامي العلي", role: "CITIZEN", isVerified: true },
          });
          realUserId = demo.id;
        }
        const finalUserId = realUserId!;

        // Ensure a Document row exists (FK target for Analysis)
        await prisma.document.upsert({
          where: { id: analysis.documentId },
          update: {},
          create: {
            id: analysis.documentId,
            userId: finalUserId,
            fileUrl: "",
            fileType: "pdf",
            title: analysis.documentTitle,
            documentType: analysis.documentType,
            status: "REVIEWED",
            contentExcerpt: (content ?? "").slice(0, 500),
          },
        });

        const created = await prisma.analysis.create({
          data: {
            id: analysis.id,
            documentId: analysis.documentId,
            userId: finalUserId,
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
            rawResponse: { provider: isGeminiConfigured() ? "gemini" : "mock" } as any,
          },
        });
        return NextResponse.json({ analysisId: created.id, provider: isGeminiConfigured() ? "gemini" : "mock" });
      } catch (e: any) {
        console.error("PRISMA_INSERT_FAILED_FULL:", JSON.stringify(e, null, 2).slice(0, 2000));
        console.error("PRISMA_ERROR_NAME:", e?.constructor?.name);
        console.error("PRISMA_ERROR_CODE:", e?.code);
        console.error("PRISMA_ERROR_MESSAGE:", e?.message);
      }
    }

    mockAnalyses.unshift(analysis);
    return NextResponse.json({ analysisId: analysis.id, provider: isGeminiConfigured() ? "gemini" : "mock" });
  } catch (e) {
    console.error("Analyze error:", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
