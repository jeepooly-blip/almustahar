import "server-only";

import { prisma } from "./db";
import { supabaseAdmin, isSupabaseConfigured } from "./supabase";
import { mockAnalyses, mockLawyers, mockDocuments, mockLeads, mockUsers } from "./mock-data";
import type { Analysis, Document, DocumentType, LawyerProfile, Lead } from "./types";

/**
 * Data access layer. Falls back to in-memory mock data when DATABASE_URL is not configured
 * (e.g. local dev or Vercel preview without a database). Once Supabase is wired up,
 * these functions return real data.
 *
 * For reads, when the Supabase REST API is available, we also fall back to it
 * (PostgREST over HTTPS) if Prisma can't reach the DB (e.g. Vercel serverless
 * where direct TCP to Supabase is blocked).
 */

const useDatabase = Boolean(process.env.DATABASE_URL);

async function fetchAnalysisByIdViaRest(id: string): Promise<Analysis | null> {
  if (!isSupabaseConfigured || !supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin
      .from("Analysis")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return rowToAnalysis(data);
  } catch {
    return null;
  }
}

export async function getAnalyses(userId: string): Promise<Analysis[]> {
  if (!useDatabase) return mockAnalyses.filter((a) => a.userId === userId);
  try {
    const rows = await prisma.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(rowToAnalysis);
  } catch (e) {
    // Fallback to REST
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("Analysis")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false });
      if (!error && data) return data.map(rowToAnalysis);
    }
    throw e;
  }
}

export async function getAnalysisById(id: string): Promise<Analysis | null> {
  if (!useDatabase) return mockAnalyses.find((a) => a.id === id) ?? null;
  try {
    const row = await prisma.analysis.findUnique({ where: { id } });
    return row ? rowToAnalysis(row) : null;
  } catch {
    // Fallback to REST (works from Vercel serverless)
    return fetchAnalysisByIdViaRest(id);
  }
}

export async function getDocuments(userId: string): Promise<Document[]> {
  if (!useDatabase) return mockDocuments.filter((d) => d.userId === userId);
  const rows = await prisma.document.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    fileUrl: r.fileUrl,
    fileType: r.fileType as "pdf" | "image",
    fileSize: r.fileSize,
    title: r.title,
    documentType: r.documentType as unknown as DocumentType,
    status: r.status as unknown as Document["status"],
    contentExcerpt: r.contentExcerpt ?? "",
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getLawyers(opts?: {
  specialty?: string;
  city?: string;
  verifiedOnly?: boolean;
}): Promise<LawyerProfile[]> {
  if (!useDatabase) {
    let list = mockLawyers;
    if (opts?.specialty) list = list.filter((l) => l.specialties.includes(opts.specialty!));
    if (opts?.city) list = list.filter((l) => l.cities.includes(opts.city!));
    if (opts?.verifiedOnly) list = list.filter((l) => l.verified);
    return list;
  }
  return prisma.lawyerProfile.findMany({
    where: {
      ...(opts?.verifiedOnly ? { verified: true } : {}),
      ...(opts?.specialty ? { specialties: { has: opts.specialty } } : {}),
      ...(opts?.city ? { cities: { has: opts.city } } : {}),
    },
    orderBy: [{ rating: "desc" }, { totalReviews: "desc" }],
    include: { user: true },
  }) as unknown as LawyerProfile[];
}

export async function getLawyerById(id: string): Promise<LawyerProfile | null> {
  if (!useDatabase) return mockLawyers.find((l) => l.id === id) ?? null;
  return prisma.lawyerProfile.findUnique({ where: { id }, include: { user: true } }) as unknown as LawyerProfile | null;
}

export async function getLeadsForUser(userId: string): Promise<Lead[]> {
  if (!useDatabase) return mockLeads.filter((l) => l.userId === userId);
  const rows = await prisma.lead.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.user.name,
    lawyerId: r.lawyerId,
    analysisId: r.analysisId ?? undefined,
    documentType: r.documentType as unknown as DocumentType,
    message: r.message,
    feeOffered: r.feeOffered ?? undefined,
    status: r.status as unknown as Lead["status"],
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getLeadsForLawyer(lawyerId: string): Promise<Lead[]> {
  if (!useDatabase) return mockLeads.filter((l) => l.lawyerId === lawyerId);
  const rows = await prisma.lead.findMany({
    where: { lawyerId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    userName: r.user.name,
    lawyerId: r.lawyerId,
    analysisId: r.analysisId ?? undefined,
    documentType: r.documentType as unknown as DocumentType,
    message: r.message,
    feeOffered: r.feeOffered ?? undefined,
    status: r.status as unknown as Lead["status"],
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createLead(data: Omit<Lead, "id" | "createdAt" | "status">): Promise<Lead> {
  if (!useDatabase) {
    const lead: Lead = {
      ...data,
      id: `ld_${Date.now()}`,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    mockLeads.unshift(lead);
    return lead;
  }
  const created = await prisma.lead.create({
    data: {
      userId: data.userId,
      lawyerId: data.lawyerId,
      analysisId: data.analysisId,
      documentType: data.documentType as any,
      message: data.message,
      feeOffered: data.feeOffered,
      status: "PENDING",
    },
  });
  return {
    id: created.id,
    userId: created.userId,
    userName: data.userName,
    lawyerId: created.lawyerId,
    analysisId: created.analysisId ?? undefined,
    documentType: created.documentType as unknown as DocumentType,
    message: created.message,
    feeOffered: created.feeOffered ?? undefined,
    status: created.status as unknown as Lead["status"],
    createdAt: created.createdAt.toISOString(),
  };
}

export async function getPendingAnalysesForReview(): Promise<Analysis[]> {
  if (!useDatabase) return mockAnalyses.filter((a) => a.reviewStatus === "PENDING");
  const rows = await prisma.analysis.findMany({
    where: { reviewStatus: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(rowToAnalysis);
}

export async function updateAnalysisReview(
  id: string,
  status: "APPROVED" | "REJECTED" | "FLAGGED",
  reviewerId?: string,
  notes?: string,
): Promise<Analysis | null> {
  if (!useDatabase) {
    const a = mockAnalyses.find((x) => x.id === id);
    if (a) {
      a.reviewStatus = status;
      a.reviewedBy = reviewerId;
      a.reviewNotes = notes;
    }
    return a ?? null;
  }
  return prisma.analysis.update({
    where: { id },
    data: { reviewStatus: status, reviewedById: reviewerId, reviewNotes: notes, reviewedAt: new Date() },
  }) as unknown as Analysis;
}

function rowToAnalysis(row: any): Analysis {
  return {
    id: row.id,
    documentId: row.documentId,
    userId: row.userId,
    documentType: row.documentType,
    documentTitle: row.documentTitle,
    summary: row.summary,
    rights: row.rights ?? [],
    obligations: row.obligations ?? [],
    risks: row.risks ?? [],
    lawyerScore: row.lawyerScore,
    lawyerReason: row.lawyerReason,
    nextSteps: row.nextSteps ?? [],
    sources: row.sources ?? [],
    confidenceScore: row.confidenceScore,
    reviewStatus: row.reviewStatus,
    reviewedBy: row.reviewedById,
    reviewNotes: row.reviewNotes,
    createdAt: row.createdAt.toISOString(),
  };
}
