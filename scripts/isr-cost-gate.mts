// ISR COST GATE — refuses the build on the two defects that produced a $254 ISR bill.
//
//   node scripts/isr-cost-gate.mjs
//
// DEFECT 1 — wall-clock in a sitemap route.
//   app/sitemap-index.xml/route.ts stamped `new Date().toISOString()` into all 86
//   chunk entries on every fetch, so every crawl saw ~3.8M URLs as just-modified and
//   re-crawled at full rate. Proven on prod 2026-07-28: two fetches 348ms apart
//   returned different <lastmod> values. The 2026-07-12 fix (006aec2) corrected
//   app/sitemap.ts and missed this file — the bill came back while the fix looked
//   applied. Nothing in the build could see the difference. Now it can.
//
// DEFECT 2 — an unbounded on-demand page factory.
//   `dynamicParams = true` + a generateStaticParams that returns [] means NOTHING is
//   prebuilt and EVERY unknown URL mints a page on first request. One ISR write per
//   unique URL, re-armed on every deploy because a deploy resets the ISR cache.
//
// WHY A GATE AND NOT A CODE REVIEW: both defects are invisible in a diff that looks
// correct. `new Date()` in a sitemap reads as ordinary; an empty generateStaticParams
// reads as "nothing to prebuild yet". Only the bill disagreed, 18 days later.
//
// SEEN RED (both proven to fire before this gate was trusted):
//   • restore `new Date().toISOString()` in app/sitemap-index.xml/route.ts → DEFECT 1
//   • add `export const dynamicParams = true` to a page whose generateStaticParams
//     returns [] → DEFECT 2

import fs from "node:fs";
import { isBoundedOnDemand, BOUNDED_ON_DEMAND } from "../lib/isr-policy";
import path from "node:path";

const APP = path.join(process.cwd(), "app");
const failures: string[] = [];

// ── THE ALLOWLIST IS NOT A RUBBER STAMP ─────────────────────────────────────
// Proven while building it: adding the 3,804,070-page origin route to
// BOUNDED_ON_DEMAND made this gate pass in silence — the exact bug that cost $254.57,
// waved through by a one-line edit. An exemption that anything can claim protects
// nothing. So a declared bound above this ceiling is itself a failure: past a certain
// size "bounded" stops meaning anything a build can rely on, and the route needs a
// decision, not an entry.
const MAX_BOUNDED_PAGES = 50_000;
for (const r of BOUNDED_ON_DEMAND) {
  if (r.approxPages > MAX_BOUNDED_PAGES) {
    failures.push(
      `lib/isr-policy.ts — ${r.file} declares ${r.approxPages.toLocaleString()} pages:
` +
      `      that is above the ${MAX_BOUNDED_PAGES.toLocaleString()} ceiling for a bounded route.
` +
      `      A space this size is not "bounded by real data", it is a page factory with
` +
      `      a note attached. Shrink the route or retire it — do not widen the ceiling
` +
      `      without deciding what the pages are for.`,
    );
  }
}

/** Every .ts/.tsx under app/, recursively. */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(e.name)) out.push(full);
  }
  return out;
}

const files = fs.existsSync(APP) ? walk(APP) : [];

// ── DEFECT 1: wall-clock time inside any sitemap/robots route ───────────────
// Scoped to sitemap* and robots* because those are the files a crawler re-reads.
// `new Date("2026-07-12")` (a CONSTANT date) is fine and is the intended fix, so the
// check is for the no-argument forms only — a literal argument means someone chose
// a snapshot date deliberately.
const WALL_CLOCK = /\bnew Date\(\s*\)|\bDate\.now\(\s*\)|\bperformance\.now\(\s*\)/;

for (const f of files) {
  const rel = path.relative(process.cwd(), f).replace(/\\/g, "/");
  if (!/\/(sitemap|robots)[^/]*(\/route)?\.tsx?$/.test(rel)) continue;
  const src = fs.readFileSync(f, "utf8");
  src.split(/\r?\n/).forEach((line, i) => {
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) return;
    if (WALL_CLOCK.test(line)) {
      failures.push(
        `${rel}:${i + 1} — wall-clock time in a crawler-facing route:\n` +
        `      ${line.trim()}\n` +
        `      Crawlers read this as "everything just changed" on EVERY fetch.\n` +
        `      Use a constant snapshot date (e.g. LASTMOD in app/sitemap.ts).`,
      );
    }
  });
}

// ── DEFECT 2: dynamicParams=true alongside an empty generateStaticParams ────
// The empty-return forms seen in this codebase and its forks: `return []`, and a
// body that is only `return [];`. A generateStaticParams that returns a real list is
// exactly what we want and must pass.
const EMPTY_GSP = /generateStaticParams\s*\([^)]*\)\s*(?::[^{]+)?\{\s*return\s*\[\s*\]\s*;?\s*\}/;

// NOT ONLY the empty-return form. `dynamicParams = true` with NO generateStaticParams
// at all is the SAME defect and costs the same: nothing is prebuilt, so every unknown
// URL mints a page. Four of this app's six matrix routes are that shape, and a gate
// written to the narrower spec would have called them clean.
for (const f of files) {
  const rel = path.relative(process.cwd(), f).replace(/\\/g, "/");
  const src = fs.readFileSync(f, "utf8");
  const dynamicTrue = /export\s+const\s+dynamicParams\s*=\s*true/.test(src);
  if (!dynamicTrue) continue;
  // ALLOWLISTED BOUNDED ROUTES. On-demand is not forbidden — unbounded on-demand is.
  // A route may render on first request when its valid space is finite, derived from
  // in-repo data, and advertised in full by the sitemap. lib/isr-policy.ts holds the
  // entry and the written reason; an unlisted route still fails exactly as before.
  if (isBoundedOnDemand(rel)) continue;
  const hasGsp = /function\s+generateStaticParams|const\s+generateStaticParams/.test(src);
  const why = !hasGsp
    ? "dynamicParams = true and NO generateStaticParams at all"
    : EMPTY_GSP.test(src)
      ? "dynamicParams = true AND generateStaticParams returns []"
      : null;
  if (!why) continue;
  const line = src.split(/\r?\n/).findIndex((l) => /dynamicParams\s*=\s*true/.test(l)) + 1;
  failures.push(
    `${rel}:${line} — unbounded on-demand page factory:\n` +
    `      ${why}.\n` +
    `      Nothing is prebuilt, so every unknown URL mints a page and costs one ISR\n` +
    `      write — re-armed on every deploy. Prebuild the real set, or set\n` +
    `      dynamicParams = false so unlisted paths 404.`,
  );
}

if (failures.length) {
  console.error(`\n✗ ISR COST GATE FAILED — ${failures.length} defect(s)\n`);
  for (const f of failures) console.error(`  ${f}\n`);
  console.error(`  These are the two defects that produced $254.57 in ISR writes in the`);
  console.error(`  2026-07 cycle. Fix them or raise the ceiling deliberately.\n`);
  process.exit(1);
}

const allow = BOUNDED_ON_DEMAND.map((r) => `${r.file} (~${r.approxPages.toLocaleString()} pages)`).join(", ");
if (allow) console.log(`  bounded-on-demand allowlist: ${allow}`);
console.log(`✓ ISR COST GATE: ${files.length} app route file(s) scanned; no wall-clock sitemap, no unbounded page factory.`);
