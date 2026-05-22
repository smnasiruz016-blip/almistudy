/**
 * Subject vocabulary mapper — freeform string → 12 canonical SubjectSlug.
 *
 * The publishable dataset has 1,908 unique freeform subject strings across
 * 3,197 universities. AlmiStudy's L2 + L4 SEO surfaces need to filter by
 * the 12 canonical categories. This file does the mapping at runtime.
 *
 * Design choices (Q2 = hybrid):
 *   • Regex array, MOST-SPECIFIC FIRST. First match wins.
 *   • Returns `null` when nothing matches (honest "no canonical category"
 *     surface — better than a forced "Other" bucket that lies).
 *   • Pure function — no side effects, no DB.
 *
 * Sync discipline: `scripts/check-subject-coverage.mjs` mirrors these
 * patterns in plain JS. Update both files together when adding patterns.
 *
 * The follow-up Q2 (ii) data backfill — add `subjectCategories:
 * SubjectSlug[]` to the University schema, populate via this mapper + manual
 * review of the unmapped tail, then remove this file's runtime lookup —
 * is on the roadmap, not this PR.
 */

import type { University } from "./page-relations";

export type SubjectSlug =
  | "medicine-health-sciences"
  | "engineering-technology"
  | "computer-science-it"
  | "business-management"
  | "law"
  | "natural-sciences"
  | "arts-humanities"
  | "social-sciences"
  | "education"
  | "mathematics-statistics"
  | "architecture-design"
  | "agriculture-environment";

export const SUBJECT_ORDER: readonly SubjectSlug[] = [
  "medicine-health-sciences",
  "engineering-technology",
  "computer-science-it",
  "business-management",
  "law",
  "natural-sciences",
  "arts-humanities",
  "social-sciences",
  "education",
  "mathematics-statistics",
  "architecture-design",
  "agriculture-environment",
];

export const SUBJECT_NAMES: Record<SubjectSlug, string> = {
  "medicine-health-sciences": "Medicine & Health Sciences",
  "engineering-technology": "Engineering & Technology",
  "computer-science-it": "Computer Science & IT",
  "business-management": "Business & Management",
  law: "Law",
  "natural-sciences": "Natural Sciences",
  "arts-humanities": "Arts & Humanities",
  "social-sciences": "Social Sciences",
  education: "Education",
  "mathematics-statistics": "Mathematics & Statistics",
  "architecture-design": "Architecture & Design",
  "agriculture-environment": "Agriculture & Environment",
};

/**
 * Pattern table — most-specific FIRST. First match wins.
 *
 * Word-boundary anchors (`\b...\b`) are deliberate where the unanchored
 * token would over-match (e.g. /law/ inside "outlaws", /art/ inside
 * "cartography"). The catchall pattern (arts-humanities) lives at the
 * end and stays loose.
 */
const PATTERNS: ReadonlyArray<{ pattern: RegExp; slug: SubjectSlug }> = [
  // Tech first — "Computer Engineering" goes here, not Engineering
  { pattern: /computer|software|information tech|data science|cyber|\bAI\b|informatics/i, slug: "computer-science-it" },
  // Health second — "Medical Engineering" stays here
  { pattern: /medicine|medical|health|nursing|pharmacy|dental|dentist|odontolog|veterinary/i, slug: "medicine-health-sciences" },
  { pattern: /engineer|mechanical|electrical|civil eng/i, slug: "engineering-technology" },
  { pattern: /business|management|\bMBA\b|finance|marketing|economics|accounting|tourism|hospitality|public administration/i, slug: "business-management" },
  { pattern: /\blaw\b|legal|jurisprudence/i, slug: "law" },
  { pattern: /architect|\bdesign\b|urban plan/i, slug: "architecture-design" },
  { pattern: /agricultur|agronom|forestry|environment|ecology/i, slug: "agriculture-environment" },
  { pattern: /math|statistic|actuarial/i, slug: "mathematics-statistics" },
  { pattern: /educat|pedagog|teaching/i, slug: "education" },
  // Natural sciences — adds biotech, geography, earth-science, marine/materials/sport
  // sciences. Bare "Science" / "Sciences" stays UNMAPPED (genuinely ambiguous).
  { pattern: /physics|chemistry|biology|biotech|natural sci|geograph|geolog|marine science|sport science|materials science|earth science|applied science/i, slug: "natural-sciences" },
  { pattern: /sociolog|psycholog|political|social sci|anthropolog|communication|international relations|journalism|criminolog/i, slug: "social-sciences" },
  // Arts & humanities — catchall LAST. Includes religious/theology
  // (where AlmiStudy hosts seminary-style institutions).
  { pattern: /\barts?\b|humanit|history|philosoph|literature|language|theology|religious|linguistic|music|film|\bletters?\b|philolog/i, slug: "arts-humanities" },
];

/**
 * Map a single freeform subject string to a canonical SubjectSlug.
 * Returns null if no pattern matches — caller decides how to render
 * (don't pad with a fake "Other" bucket).
 */
export function mapToCanonical(freeform: string): SubjectSlug | null {
  if (!freeform) return null;
  for (const { pattern, slug } of PATTERNS) {
    if (pattern.test(freeform)) return slug;
  }
  return null;
}

/**
 * Canonical SubjectSlug set for one university — deduped, ordered by
 * SUBJECT_ORDER for deterministic rendering across builds.
 */
export function getCanonicalSubjects(uni: Pick<University, "subjects">): SubjectSlug[] {
  const seen = new Set<SubjectSlug>();
  for (const s of uni.subjects ?? []) {
    const slug = mapToCanonical(s);
    if (slug) seen.add(slug);
  }
  return SUBJECT_ORDER.filter((s) => seen.has(s));
}
