// SITEMAP == PREBUILT GATE.
//
//   npx tsx scripts/sitemap-prebuild-gate.mts
//
// Every URL the sitemap advertises must be a page the build actually produces.
// Advertising a URL that 404s is worse than not advertising it: it spends crawl
// budget teaching Google the page is missing, and it is invisible until GSC reports
// it weeks later.
//
// EQUALITY, now that it is honest. Prebuilt used to be a strict superset because
// /study/[country]/[subject]/[uni] (19,310 pages) was a canonical duplicate that had
// to exist for internal links but must not be indexed. That set is now a single 301
// in next.config.ts, so prebuilt and sitemapped are the same set and the gate asserts
// it BOTH ways: an advertised URL that is not built is a 404 sold to Google, and a
// built page that is not advertised is either dead weight or a missing sitemap entry.
//
// SEEN RED: add a path to sitemapPaths() that no generateStaticParams produces
// (e.g. "/university/not-a-real-university") → this gate names it and exits 1.

import * as StaticIndex from "../lib/static-index";
import { STUDY_ORIGINS, studyOriginsWithContent } from "../lib/study-origin-localization";

// SERVABLE = prebuilt at build time  +  bounded-on-demand (finite, data-derived,
// allowlisted in lib/isr-policy.ts). Both are pages this site really has; the second
// group simply renders on first request because prebuilding it produced 244,331 output
// files and failed the deployment.
const prebuilt = new Set<string>(StaticIndex.prebuiltPaths());
const bounded = new Set<string>(StaticIndex.boundedOnDemandPaths());
const servable = new Set<string>([...prebuilt, ...bounded]);

const advertised = StaticIndex.sitemapPaths();
const orphans = advertised.filter((p) => !servable.has(p));
const advertisedSet = new Set(advertised);
const unadvertised = [...servable].filter((p) => !advertisedSet.has(p));

const dupes = advertised.length - new Set(advertised).size;

if (orphans.length || dupes || unadvertised.length) {
  console.error(`\n✗ SITEMAP == SERVABLE GATE FAILED\n`);
  if (orphans.length) {
    console.error(`  ${orphans.length} advertised URL(s) are neither prebuilt nor bounded-on-demand and would 404:`);
    for (const o of orphans.slice(0, 10)) console.error(`    ${o}`);
    if (orphans.length > 10) console.error(`    … and ${orphans.length - 10} more`);
  }
  if (unadvertised.length) {
    console.error(`\n  ${unadvertised.length} prebuilt page(s) are NOT advertised:`);
    for (const u of unadvertised.slice(0, 10)) console.error(`    ${u}`);
    if (unadvertised.length > 10) console.error(`    … and ${unadvertised.length - 10} more`);
  }
  if (dupes) console.error(`\n  ${dupes} duplicate path(s) in the sitemap.`);
  console.error("");
  process.exit(1);
}

// SHARED-VS-LOCAL DRIFT NOTICE — not fatal, because an origin without copy is now
// simply absent (safe). It is printed loudly because the last time this drifted it
// put 8 HTTP 500s into the live sitemap and nothing said a word for weeks.
const covered = new Set(studyOriginsWithContent().map((o) => o.slug));
const drift = STUDY_ORIGINS.filter((o) => !covered.has(o.slug)).map((o) => o.slug);
if (drift.length) {
  console.log("");
  console.log(`  ⚠ ORIGIN DRIFT: ${drift.length} origin(s) exist in the SHARED list`);
  console.log(`    (@smnasiruz016-blip/almi-data) with NO local copy: ${drift.join(", ")}`);
  console.log(`    They are excluded from the build and the sitemap — correct, but it`);
  console.log(`    means ${drift.length * 8} origin-guide page(s) we could serve, we do not.`);
  console.log(`    Fix = write the BUILDERS entry in lib/study-origin-localization.ts.`);
  console.log("");
}

console.log(
  `✓ SITEMAP == SERVABLE GATE: ${advertised.length.toLocaleString()} advertised URL(s) == ` +
  `${servable.size.toLocaleString()} servable page(s) — identical sets ` +
  `(${prebuilt.size.toLocaleString()} prebuilt + ${bounded.size.toLocaleString()} bounded-on-demand).`,
);
