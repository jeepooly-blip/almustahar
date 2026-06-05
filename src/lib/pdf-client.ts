"use client";

/**
 * Client-side PDF text extraction using PDF.js (Mozilla).
 * Falls back to a stub if PDF.js fails to load (e.g. CSP issues on some hosts).
 */

let pdfjs: typeof import("pdfjs-dist") | null = null;
let loadingPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function loadPdfjs() {
  if (pdfjs) return pdfjs;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const lib = await import("pdfjs-dist");
    // Set worker source — use the bundled worker file shipped with the package
    if (typeof window !== "undefined" && !lib.GlobalWorkerOptions.workerSrc) {
      lib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
    }
    pdfjs = lib;
    return lib;
  })();
  return loadingPromise;
}

export interface ExtractResult {
  text: string;
  pageCount: number;
  ok: boolean;
  error?: string;
}

export async function extractPdfText(file: File): Promise<ExtractResult> {
  try {
    const lib = await loadPdfjs();
    const buf = await file.arrayBuffer();
    const doc = await lib.getDocument({ data: buf }).promise;
    const pageCount = doc.numPages;
    const maxPages = Math.min(pageCount, 10); // cap to avoid huge outputs
    let text = "";
    for (let i = 1; i <= maxPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const strings: string[] = content.items
        .map((it) => ("str" in it ? (it as { str: string }).str : ""))
        .filter(Boolean);
      text += strings.join(" ") + "\n\n";
    }
    return { text: text.trim(), pageCount, ok: true };
  } catch (e: any) {
    return { text: "", pageCount: 0, ok: false, error: e?.message ?? "PDF extraction failed" };
  }
}

export async function extractImageText(file: File): Promise<ExtractResult> {
  // For now, images return empty text. OCR (Tesseract.js) is heavy — can be added later.
  return { text: "", pageCount: 1, ok: true, error: "image_ocr_not_implemented" };
}
