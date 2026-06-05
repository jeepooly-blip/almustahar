// scripts/test-rag.ts
// Direct RAG test (bypasses server-only guard by inlining the helpers).

import { PrismaClient } from "@prisma/client";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIM = 768;

async function embed(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${apiKey}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text: cleaned }] },
      outputDimensionality: EMBED_DIM,
    }),
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { embedding?: { values?: number[] } };
  return j.embedding?.values ?? null;
}

async function matchLegalCorpus(query: string, limit = 3) {
  const p = new PrismaClient();
  const vec = await embed(query);
  if (!vec) return [];
  const vecLit = "[" + vec.join(",") + "]";
  const rows = await p.$queryRawUnsafe<any[]>(
    `SELECT id, "lawName", "lawType", "articleNumber", title, content, similarity
       FROM match_legal_corpus($1::vector, 0.5, $2::int)`,
    vecLit,
    limit,
  );
  await p.$disconnect();
  return rows;
}

async function main() {
  const queries = [
    "تعرضت لفصل تعسفي من العمل، ما حقوقي؟",
    "ما هي غرامة قطع الإشارة الضوئية في الأردن؟",
    "حقوقي كمستأجر عند إخلاء الشقة من المالك",
    "حق إرجاع المنتج بعد الشراء من الإنترنت",
    "نفقة الأولاد على الأب",
  ];
  for (const q of queries) {
    console.log(`\n═══ Query: ${q} ═══`);
    const matches = await matchLegalCorpus(q, 3);
    if (matches.length === 0) {
      console.log("  (no matches)");
      continue;
    }
    matches.forEach((m: any, i: number) => {
      console.log(`  [${i + 1}] (sim=${m.similarity.toFixed(3)}) ${m.lawName} ${m.articleNumber ?? ""} — ${m.title}`);
      console.log(`      "${m.content.slice(0, 120)}…"`);
    });
  }
}
main();
