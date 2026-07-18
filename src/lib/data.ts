import "server-only";

import { prisma } from "./db";
import { supabaseAdmin, isSupabaseConfigured } from "./supabase";
import { mockAnalyses, mockLawyers, mockDocuments, mockLeads, mockUsers } from "./mock-data";
import type { Analysis, Document, DocumentType, DocStatus, LawyerProfile, Lead, LawyerScore, ReviewStatus, LeadStatus } from "./types";

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
    documentType: r.documentType as DocumentType,
    status: r.status as DocStatus,
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
  const rows = await prisma.lawyerProfile.findMany({
    where: {
      ...(opts?.verifiedOnly ? { verified: true } : {}),
      ...(opts?.specialty ? { specialties: { has: opts.specialty } } : {}),
      ...(opts?.city ? { cities: { has: opts.city } } : {}),
    },
    orderBy: [{ rating: "desc" }, { totalReviews: "desc" }],
    include: { user: true },
  });
  return rows.map(mapLawyerRow);
}

export async function getLawyerById(id: string): Promise<LawyerProfile | null> {
  if (!useDatabase) return mockLawyers.find((l) => l.id === id) ?? null;
  const row = await prisma.lawyerProfile.findUnique({ where: { id }, include: { user: true } });
  return row ? mapLawyerRow(row) : null;
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
    documentType: r.documentType as DocumentType,
    message: r.message,
    feeOffered: r.feeOffered ?? undefined,
    status: r.status as LeadStatus,
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
    documentType: r.documentType as DocumentType,
    message: r.message,
    feeOffered: r.feeOffered ?? undefined,
    status: r.status as LeadStatus,
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
      documentType: data.documentType,
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
    documentType: created.documentType as DocumentType,
    message: created.message,
    feeOffered: created.feeOffered ?? undefined,
    status: created.status as LeadStatus,
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
  const updated = await prisma.analysis.update({
    where: { id },
    data: { reviewStatus: status, reviewedById: reviewerId, reviewNotes: notes, reviewedAt: new Date() },
  });
  return rowToAnalysis(updated);
}

function rowToAnalysis(row: {
  id: string;
  documentId: string;
  userId: string;
  documentType: string;
  documentTitle: string;
  summary: string;
  rights: unknown;
  obligations: unknown;
  risks: unknown;
  lawyerScore: string;
  lawyerReason: string;
  nextSteps: unknown;
  sources: unknown;
  confidenceScore: number;
  reviewStatus: string;
  reviewedById: string | null;
  reviewNotes: string | null;
  createdAt: Date;
}): Analysis {
  return {
    id: row.id,
    documentId: row.documentId,
    userId: row.userId,
    documentType: row.documentType as DocumentType,
    documentTitle: row.documentTitle,
    summary: row.summary,
    rights: (Array.isArray(row.rights) ? row.rights : []) as string[],
    obligations: (Array.isArray(row.obligations) ? row.obligations : []) as string[],
    risks: (Array.isArray(row.risks) ? row.risks : []) as Analysis["risks"],
    lawyerScore: row.lawyerScore as LawyerScore,
    lawyerReason: row.lawyerReason,
    nextSteps: (Array.isArray(row.nextSteps) ? row.nextSteps : []) as Analysis["nextSteps"],
    sources: (Array.isArray(row.sources) ? row.sources : []) as Analysis["sources"],
    confidenceScore: row.confidenceScore,
    reviewStatus: row.reviewStatus as ReviewStatus,
    reviewedBy: row.reviewedById ?? undefined,
    reviewNotes: row.reviewNotes ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapLawyerRow(row: { id: string; userId: string; barNumber: string; bio: unknown; specialties: unknown; cities: unknown; hourlyRate: number; yearsExperience: number; successStories: number; languages: unknown; verified: boolean; isAvailable: boolean; rating: number; totalReviews: number; avatarUrl: string | null; isFeatured: boolean; subscriptionTier: string | null; user: { name: string; phone: string } }): LawyerProfile {
  const bio = (typeof row.bio === "object" && row.bio !== null && "ar" in row.bio)
    ? row.bio as { ar: string; en: string }
    : { ar: "", en: "" };
  return {
    id: row.id,
    userId: row.userId,
    name: row.user.name,
    avatar: row.avatarUrl ?? "/favicon.svg",
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    cities: Array.isArray(row.cities) ? row.cities : [],
    hourlyRate: row.hourlyRate,
    bio,
    verified: row.verified,
    rating: row.rating,
    totalReviews: row.totalReviews,
    barNumber: row.barNumber,
    isAvailable: row.isAvailable,
    languages: Array.isArray(row.languages) ? row.languages : ["ar" as const],
    yearsExperience: row.yearsExperience,
    successStories: row.successStories,
  };
}
