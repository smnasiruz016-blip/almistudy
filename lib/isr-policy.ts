/**
 * WHICH ROUTES MAY RENDER ON DEMAND, AND WHY.
 *
 * The default answer is none. `dynamicParams = true` with nothing prebuilt is a page
 * factory: every unknown URL mints a page at the cost of one ISR write, re-armed on
 * every deploy. That shape billed $254.57 across the team in the 2026-07 cycle against
 * $4.36 of ISR reads.
 *
 * But "prebuild everything" has its own ceiling, and we found it by hitting it. The
 * fully-static build produced 270,400 files / 4.8 GB — Vercel built it in 7 minutes
 * and then failed the deployment with no message. 244,331 of those files were one
 * route.
 *
 * So the rule is not "never on demand". It is: ON DEMAND IS ALLOWED ONLY WHERE THE
 * VALID SPACE IS BOUNDED BY REAL DATA AND THE SITEMAP ADVERTISES EXACTLY THAT SPACE.
 * An entry here is a claim that both hold, and scripts/isr-cost-gate.mjs will not
 * accept `dynamicParams = true` on any route that is not listed.
 *
 * What makes a bounded route safe:
 *   • generateStaticParams may be empty — the pages are NOT prebuilt — but
 *   • the set of VALID params is finite and derived from in-repo data, and
 *   • the page calls notFound() on anything outside it, so junk costs one cached 404
 *     rather than a real page, and
 *   • lib/static-index.ts advertises exactly the valid set, never a superset.
 *
 * The counter-example, and the reason this file is not just a list: the origin-leaf
 * route was ALSO "bounded by real data" — 19,310 taught pairs × 197 real countries.
 * Every one of those 3,804,070 URLs was data-backed and every one was in the sitemap.
 * Bounded is not the same as small. A route belongs here only if its bound is a number
 * someone has actually looked at.
 */

export type BoundedRoute = {
  /** Route file, repo-relative, forward slashes. */
  file: string;
  /** How many valid pages, at the time this entry was written. */
  approxPages: number;
  /** Why on-demand is correct here, and what keeps the space bounded. */
  reason: string;
};

export const BOUNDED_ON_DEMAND: BoundedRoute[] = [
  {
    file: "app/university/[slug]/[subject]/page.tsx",
    approxPages: 19310,
    reason:
      "19,310 university x subject-TAUGHT pairs — finite, derived from in-repo JSON via " +
      "getCanonicalSubjects(), and advertised in full by lib/static-index.ts. Prebuilding " +
      "them produced 244,331 of the 270,400 output files that made the 2026-07-28 " +
      "deployment fail, so these render on first request instead: ~19,310 ISR writes per " +
      "deploy, which is pennies against the millions that caused the bill. resolve() " +
      "returns null for a slug or subject outside the data and the page calls notFound(), " +
      "so an invented URL costs one cached 404 rather than a fabricated page.",
  },
];

const BOUNDED_FILES = new Set(BOUNDED_ON_DEMAND.map((r) => r.file));

/** Is this route file allowed to set dynamicParams = true? */
export function isBoundedOnDemand(fileRelPath: string): boolean {
  return BOUNDED_FILES.has(fileRelPath.replace(/\\/g, "/"));
}
