// scripts/migrate-corpus.ts
// One-off: remove old seed-* duplicates and apply unique index.
// Run: npx tsx scripts/migrate-corpus.ts

import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  console.log("Step 1: Removing seed-* duplicates (keeping longer content)…");
  // For each (lawName, articleNumber) with multiple rows, keep the one with longest content
  // and delete the seed-* ones.
  const deleted = await p.$executeRawUnsafe(`
    DELETE FROM "LegalCorpus"
     WHERE id LIKE 'seed-%'
       AND EXISTS (
         SELECT 1 FROM "LegalCorpus" lc2
          WHERE lc2.id NOT LIKE 'seed-%'
            AND lc2."lawName" = "LegalCorpus"."lawName"
            AND lc2."articleNumber" IS NOT DISTINCT FROM "LegalCorpus"."articleNumber"
       )
  `);
  console.log(`  ✓ Deleted ${deleted} seed-* duplicates`);

  console.log("Step 2: Applying unique index on (lawName, articleNumber)…");
  await p.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "LegalCorpus_law_article_uniq"
      ON "LegalCorpus" ("lawName", "articleNumber")
  `);
  console.log("  ✓ Index created");

  const total = await p.legalCorpus.count();
  console.log(`\nTotal corpus articles now: ${total}`);
}
main().finally(() => p.$disconnect());
