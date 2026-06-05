import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  // List indexes on LegalCorpus
  const idx = await p.$queryRawUnsafe<any[]>(`
    SELECT indexname, indexdef
      FROM pg_indexes
     WHERE tablename = 'LegalCorpus'
  `);
  console.log("Indexes on LegalCorpus:");
  idx.forEach((i) => console.log(`  ${i.indexname}: ${i.indexdef}`));

  // Find any (lawName, articleNumber) duplicates
  const dups = await p.$queryRawUnsafe<any[]>(`
    SELECT "lawName", "articleNumber", COUNT(*) as n, array_agg(id) as ids
      FROM "LegalCorpus"
     GROUP BY "lawName", "articleNumber"
    HAVING COUNT(*) > 1
  `);
  console.log("\nDuplicates:");
  if (dups.length === 0) console.log("  (none)");
  dups.forEach((d) => console.log(`  ${d.lawName} ${d.articleNumber}: ${d.n} copies — ${d.ids.join(", ")}`));
}
main().finally(() => p.$disconnect());
