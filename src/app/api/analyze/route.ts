import { NextResponse } from "next/server";
import { mockAnalyses } from "@/lib/mock-data";
import { generateAnalysis, isGeminiConfigured } from "@/lib/ai-gemini";
import { saveAnalysisWithUser } from "@/lib/analyze-save";
import { uploadDocument } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifySession } from "@/lib/auth";
import { z } from "zod";
import type { DocumentType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  id: z.string(),
  docType: z.enum(["rental", "employment", "traffic", "consumer", "general"]),
  title: z.string().nullish(),
  plan: z.string().nullish(),
  content: z.string().nullish(),
});

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
]);
// Vercel Hobby plan caps serverless request bodies at 4.5 MB.
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

export async function POST(req: Request) {
  try {
    // ---- Authentication: userId comes from the session, NOT the request body ----
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const userId = session.id;

    // Reject oversized uploads BEFORE parsing formData (Vercel Hobby body limit is 4.5MB).
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_FILE_SIZE + 4096) {
      return NextResponse.json(
        { error: "file_too_large", maxBytes: MAX_FILE_SIZE, gotBytes: contentLength },
        { status: 413 },
      );
    }

    // Rate limit by user ID (not IP) for authenticated users
    const rl = checkRateLimit(`analyze:${userId}`, { perMinute: 10, perHour: 100 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "rate_limited", retryAfter: rl.retryAfter },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } },
      );
    }

    const contentType = req.headers.get("content-type") ?? "";

    // Two modes: JSON (text-only) or multipart/form-data (with file upload)
    let body: z.infer<typeof RequestSchema>;
    let file: File | null = null;
    if (contentType.startsWith("multipart/form-data")) {
      let form: FormData;
      try {
        form = await req.formData();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json(
          { error: "body_parse_failed", hint: "File may be too large for the server (max 4 MB on Hobby plan).", reason: message },
          { status: 413 },
        );
      }
      const parsed = RequestSchema.safeParse({
        id: form.get("id"),
        docType: form.get("docType"),
        title: form.get("title"),
        plan: form.get("plan"),
        content: form.get("content"),
      });
      if (!parsed.success) {
        return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
      }
      body = parsed.data;
      const f = form.get("file");
      if (f instanceof File) {
        if (!ALLOWED_MIME.has(f.type)) {
          return NextResponse.json({ error: "unsupported_file_type", got: f.type }, { status: 400 });
        }
        if (f.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: "file_too_large", maxBytes: MAX_FILE_SIZE, gotBytes: f.size }, { status: 413 });
        }
        file = f;
      }
    } else {
      const json = await req.json();
      const parsed = RequestSchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json({ error: "invalid_request", details: parsed.error.flatten() }, { status: 400 });
      }
      body = parsed.data;
    }

    const { id, docType, title, content } = body;

    const analysis = await generateAnalysis({
      id,
      docType: docType as DocumentType,
      title: title ?? "",
      content: content ?? undefined,
      userId,
    });

    const provider = isGeminiConfigured() ? "gemini" : "mock";

    // If a file was uploaded, try to store it
    let storagePath: string | null = null;
    if (file) {
      const up = await uploadDocument(analysis.userId || userId, analysis.documentId, file, file.type);
      storagePath = up?.path ?? null;
    }

    if (process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const saveRes = await saveAnalysisWithUser(
        analysis,
        { userId, demoPhone: session.phone },
        content ?? "",
        storagePath,
      );
      if (saveRes.ok) {
        return NextResponse.json({
          analysisId: analysis.id,
          provider,
          savedVia: saveRes.source,
          storagePath,
        });
      }
      return NextResponse.json(
        { error: "db_insert_failed", reason: saveRes.reason, code: saveRes.code, analysisId: analysis.id, provider },
        { status: 500 },
      );
    }

    mockAnalyses.unshift(analysis);
    return NextResponse.json({ analysisId: analysis.id, provider, storagePath });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}