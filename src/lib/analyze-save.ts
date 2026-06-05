import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import type { Analysis } from "@/lib/types";

type SaveResult =
  | { ok: true; source: "prisma" | "supabase-rest" }
  | { ok: false; reason: string; code?: string };

/**
 * Save an analysis row + the related User + Document rows.
 *
 * Tries Prisma first (works locally when DB is reachable), then falls back
 * to the Supabase REST API (PostgREST) which uses HTTPS and works from
 * Vercel serverless where direct TCP to the DB is blocked.
 */
export async function saveAnalysisWithUser(
  analysis: Analysis,
  userHint: { userId?: string | null; demoPhone?: string },
  contentExcerpt: string,
): Promise<SaveResult> {
  // 1) Resolve a real user id (reuse prisma's upsert — fast & uses the same connection)
  let realUserId = userHint.userId ?? null;
  const isCuid = realUserId && /^[a-z0-9]{20,30}$/i.test(realUserId);

  // Helper: do the write using supabase-js (REST)
  const writeViaRest = async (userId: string): Promise<SaveResult> => {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return { ok: false, reason: "supabase not configured" };
    }
    try {
      const now = new Date().toISOString();
      // Ensure document exists
      const docPayload = {
        id: analysis.documentId,
        userId,
        fileUrl: "",
        fileType: "pdf",
        fileSize: 0,
        title: analysis.documentTitle,
        documentType: analysis.documentType,
        status: "REVIEWED",
        contentExcerpt: (contentExcerpt ?? "").slice(0, 500),
        createdAt: now,
        updatedAt: now,
      };
      const { error: docErr } = await supabaseAdmin
        .from("Document")
        .upsert(docPayload, { onConflict: "id" });
      if (docErr) return { ok: false, reason: `document upsert: ${docErr.message}`, code: docErr.code };

      const analysisPayload = {
        id: analysis.id,
        documentId: analysis.documentId,
        userId,
        documentType: analysis.documentType,
        documentTitle: analysis.documentTitle,
        summary: analysis.summary,
        rights: analysis.rights,
        obligations: analysis.obligations,
        risks: analysis.risks,
        lawyerScore: analysis.lawyerScore,
        lawyerReason: analysis.lawyerReason,
        nextSteps: analysis.nextSteps,
        sources: analysis.sources,
        confidenceScore: analysis.confidenceScore,
        reviewStatus: analysis.reviewStatus,
        rawResponse: { provider: "gemini" },
        createdAt: now,
        updatedAt: now,
      };
      const { error: aErr } = await supabaseAdmin
        .from("Analysis")
        .insert(analysisPayload);
      if (aErr) return { ok: false, reason: `analysis insert: ${aErr.message}`, code: aErr.code };

      return { ok: true, source: "supabase-rest" };
    } catch (e: any) {
      return { ok: false, reason: e?.message ?? "unknown rest error" };
    }
  };

  // Helper: do the write using Prisma
  const writeViaPrisma = async (userId: string): Promise<SaveResult> => {
    try {
      await prisma.document.upsert({
        where: { id: analysis.documentId },
        update: {},
        create: {
          id: analysis.documentId,
          userId,
          fileUrl: "",
          fileType: "pdf",
          title: analysis.documentTitle,
          documentType: analysis.documentType,
          status: "REVIEWED",
          contentExcerpt: (contentExcerpt ?? "").slice(0, 500),
        },
      });
      await prisma.analysis.create({
        data: {
          id: analysis.id,
          documentId: analysis.documentId,
          userId,
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
          rawResponse: { provider: "gemini" } as any,
        },
      });
      return { ok: true, source: "prisma" };
    } catch (e: any) {
      return { ok: false, reason: e?.message ?? "unknown prisma error", code: e?.code };
    }
  };

  // 2) Resolve the user (try Prisma upsert, fall back to REST upsert)
  if (!isCuid) {
    if (process.env.DATABASE_URL) {
      try {
        const demo = await prisma.user.upsert({
          where: { phone: userHint.demoPhone ?? "+962791234567" },
          update: {},
          create: {
            phone: userHint.demoPhone ?? "+962791234567",
            name: "سامي العلي",
            role: "CITIZEN",
            isVerified: true,
          },
        });
        realUserId = demo.id;
      } catch {
        // fall through to REST user lookup
      }
    }
    if (!realUserId && isSupabaseConfigured && supabaseAdmin) {
      const { data: existing } = await supabaseAdmin
        .from("User")
        .select("id")
        .eq("phone", userHint.demoPhone ?? "+962791234567")
        .maybeSingle();
      if (existing?.id) {
        realUserId = existing.id;
      } else {
        const { data: created, error: uErr } = await supabaseAdmin
          .from("User")
          .insert({
            phone: userHint.demoPhone ?? "+962791234567",
            name: "سامي العلي",
            role: "CITIZEN",
            isVerified: true,
          })
          .select("id")
          .single();
        if (uErr) return { ok: false, reason: `user insert: ${uErr.message}`, code: uErr.code };
        realUserId = created?.id ?? null;
      }
    }
  }

  if (!realUserId) {
    return { ok: false, reason: "could not resolve user" };
  }

  // 3) Try Prisma first; on failure, fall back to Supabase REST
  const prismaRes = await writeViaPrisma(realUserId);
  if (prismaRes.ok) return prismaRes;

  const restRes = await writeViaRest(realUserId);
  if (restRes.ok) return restRes;

  return {
    ok: false,
    reason: `prisma=[${prismaRes.code ?? "?"}/${prismaRes.reason.slice(0, 60)}]; rest=[${restRes.code ?? "?"}/${restRes.reason.slice(0, 60)}]`,
    code: prismaRes.code ?? restRes.code,
  };
}
