import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const total = await p.legalCorpus.count();
  const withEmbed = await p.$queryRawUnsafe<{ n: number }[]>(
    `SELECT COUNT(*)::int as n FROM "LegalCorpus" WHERE embedding IS NOT NULL`
  );
  const byType = await p.legalCorpus.groupBy({
    by: ["lawType"],
    _count: { _all: true },
  });
  console.log("Total corpus articles:", total);
  console.log("With embeddings:", withEmbed[0]?.n ?? 0);
  console.log("By lawType:");
  byType.forEach((b) => console.log(`  ${b.lawType}: ${b._count._all}`));

  // Sanity check: similarity between two related labor articles
  const related = await p.$queryRawUnsafe<{ lawName: string; articleNumber: string; title: string; sim: number }[]>(
    `SELECT "lawName", "articleNumber", title,
            1 - (embedding <=> (SELECT embedding FROM "LegalCorpus" WHERE id = 'labor-32')) AS sim
       FROM "LegalCorpus"
       WHERE id != 'labor-32'
       ORDER BY embedding <=> (SELECT embedding FROM "LegalCorpus" WHERE id = 'labor-32')
       LIMIT 3`
  );
  console.log("\nTop-3 most similar to labor-32 (المادة 32 - التعويض عن الفصل التعسفي):");
  related.forEach((r) => console.log(`  ${r.lawName} ${r.articleNumber} — ${r.title} (sim=${r.sim.toFixed(3)})`));
}
main().finally(() => p.$disconnect());
