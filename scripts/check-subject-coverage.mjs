#!/usr/bin/env node
/**
 * Subject vocabulary coverage check.
 *
 * Mirrors the regex PATTERNS in lib/subject-mapper.ts (most-specific-first).
 * Reports:
 *   • Total freeform subject-uni pairs
 *   • How many map to a canonical SubjectSlug
 *   • Per-canonical uni count
 *   • Top-20 unmapped freeform strings (review candidates for the next
 *     pattern PR — do NOT force-fit; null is honest)
 *
 * Run:  node scripts/check-subject-coverage.mjs
 *
 * NOTE: keep the PATTERNS array below in sync with lib/subject-mapper.ts.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, "..", "lib", "universities-publishable.json");
const data = JSON.parse(readFileSync(dataPath, "utf8"));

const PATTERNS = [
  { pattern: /computer|software|information tech|data science|cyber|\bAI\b|informatics/i, slug: "computer-science-it" },
  { pattern: /medicine|medical|health|nursing|pharmacy|dental|dentist|odontolog|veterinary/i, slug: "medicine-health-sciences" },
  { pattern: /engineer|mechanical|electrical|civil eng/i, slug: "engineering-technology" },
  { pattern: /business|management|\bMBA\b|finance|marketing|economics|accounting|tourism|hospitality|public administration/i, slug: "business-management" },
  { pattern: /\blaw\b|legal|jurisprudence/i, slug: "law" },
  { pattern: /architect|\bdesign\b|urban plan/i, slug: "architecture-design" },
  { pattern: /agricultur|agronom|forestry|environment|ecology/i, slug: "agriculture-environment" },
  { pattern: /math|statistic|actuarial/i, slug: "mathematics-statistics" },
  { pattern: /educat|pedagog|teaching/i, slug: "education" },
  { pattern: /physics|chemistry|biology|biotech|natural sci|geograph|geolog|marine science|sport science|materials science|earth science|applied science/i, slug: "natural-sciences" },
  { pattern: /sociolog|psycholog|political|social sci|anthropolog|communication|international relations|journalism|criminolog/i, slug: "social-sciences" },
  { pattern: /\barts?\b|humanit|history|philosoph|literature|language|theology|religious|linguistic|music|film|\bletters?\b|philolog/i, slug: "arts-humanities" },
];

function mapToCanonical(freeform) {
  if (!freeform) return null;
  for (const { pattern, slug } of PATTERNS) {
    if (pattern.test(freeform)) return slug;
  }
  return null;
}

let totalPairs = 0;
let mappedPairs = 0;
const unmappedCounts = new Map();
const perSlugUnis = new Map();
let unisWithAny = 0;

for (const u of data) {
  const subjects = u.subjects ?? [];
  const slugs = new Set();
  for (const s of subjects) {
    totalPairs++;
    const slug = mapToCanonical(s);
    if (slug) {
      mappedPairs++;
      slugs.add(slug);
    } else {
      unmappedCounts.set(s, (unmappedCounts.get(s) ?? 0) + 1);
    }
  }
  if (slugs.size > 0) unisWithAny++;
  for (const s of slugs) {
    perSlugUnis.set(s, (perSlugUnis.get(s) ?? 0) + 1);
  }
}

console.log(`Total universities:           ${data.length}`);
console.log(`Universities w/ ≥1 canonical: ${unisWithAny} (${((unisWithAny / data.length) * 100).toFixed(1)}%)`);
console.log(`Total freeform subject-uni pairs: ${totalPairs}`);
console.log(`Mapped pairs: ${mappedPairs} (${((mappedPairs / totalPairs) * 100).toFixed(1)}%)`);
console.log(`Unmapped pairs: ${totalPairs - mappedPairs} (${(((totalPairs - mappedPairs) / totalPairs) * 100).toFixed(1)}%)`);

console.log("\nPer-canonical-slug uni counts:");
for (const [slug, count] of [...perSlugUnis.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${slug.padEnd(30)} ${count}`);
}

console.log("\nTop-20 unmapped freeform strings (review for next pattern PR — do NOT force-fit):");
const top = [...unmappedCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
for (const [str, count] of top) {
  console.log(`  ${String(count).padStart(4)}  ${str}`);
}
