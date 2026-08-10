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

/**
 * HOLDING 2026-08-09 — EMPTY, deliberately. Page generation is frozen network-wide
 * until the page factory rebuilds these pages properly, so no route may render on
 * demand: the one entry below is retired (kept as FROZEN_UNDER_HOLDING so the reason
 * and the counted bound survive the freeze rather than being rediscovered later).
 *
 * With this empty, isr-cost-gate's allowlist check has nothing to wave through — any
 * route that sets `dynamicParams = true` now fails the build, which is exactly the
 * holding invariant. Reversing the freeze means moving the entry back into
 * BOUNDED_ON_DEMAND, restoring `dynamicParams = true` on the route, and restoring
 * boundedOnDemandPaths() in lib/static-index.ts. All three, or the gates fail.
 */
export const BOUNDED_ON_DEMAND: BoundedRoute[] = [];

/** The single entry retired by the 2026-08-09 holding freeze. Not read by the gate. */
export const FROZEN_UNDER_HOLDING: BoundedRoute[] = [
  {
    file: "app/university/[slug]/[subject]/page.tsx",
    approxPages: 34431,
    reason:
      "34,431 university x subject-TAUGHT pairs — finite, derived from in-repo JSON via " +
      "getCanonicalSubjects(), and advertised in full by lib/static-index.ts. Prebuilding " +
      "them produced 244,331 of the 270,400 output files that made the 2026-07-28 " +
      "deployment fail, so these render on first request instead: ~34,431 ISR writes per " +
      "deploy, which is pennies against the millions that caused the bill. resolve() " +
      "returns null for a slug or subject outside the data and the page calls notFound(), " +
      "so an invented URL costs one cached 404 rather than a fabricated page. " +
      "Counted 2026-08-09 against 7,609 universities (was 23,902 at 4,277): 4.53 taught " +
      "pairs per university, so the 50,000 ceiling arrives at roughly 11,000 universities. " +
      "That is two or three enrichment passes away, and the decision it forces — shrink " +
      "the route, split it, or raise the ceiling with a written reason — is still open.",
  },
];

const BOUNDED_FILES = new Set(BOUNDED_ON_DEMAND.map((r) => r.file));

/** Is this route file allowed to set dynamicParams = true? */
export function isBoundedOnDemand(fileRelPath: string): boolean {
  return BOUNDED_FILES.has(fileRelPath.replace(/\\/g, "/"));
}
