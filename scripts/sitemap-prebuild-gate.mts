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

const prebuilt = new Set<string>();

prebuilt.add("");
prebuilt.add("/universities");
for (const s of StaticIndex.subjects()) prebuilt.add(`/subjects/${s}`);
for (const r of StaticIndex.regions()) prebuilt.add(`/regions/${r}`);
for (const c of StaticIndex.countries()) prebuilt.add(`/universities/${c}`);
for (const u of StaticIndex.universities()) prebuilt.add(`/university/${u}`);
for (const p of StaticIndex.universitySubjectPairs()) prebuilt.add(`/university/${p.slug}/${p.subject}`);
for (const p of StaticIndex.countrySubjectPairs()) prebuilt.add(`/study/${p.country}/${p.subject}`);
for (const g of StaticIndex.originGuides()) prebuilt.add(`/study/${g.country}/${g.subject}`);

const advertised = StaticIndex.sitemapPaths();
const orphans = advertised.filter((p) => !prebuilt.has(p));
const advertisedSet = new Set(advertised);
const unadvertised = [...prebuilt].filter((p) => !advertisedSet.has(p));

const dupes = advertised.length - new Set(advertised).size;

if (orphans.length || dupes || unadvertised.length) {
  console.error(`\n✗ SITEMAP == PREBUILT GATE FAILED\n`);
  if (orphans.length) {
    console.error(`  ${orphans.length} advertised URL(s) are NOT prebuilt and would 404:`);
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
  `✓ SITEMAP == PREBUILT GATE: ${advertised.length.toLocaleString()} advertised URL(s) ` +
  `and ${prebuilt.size.toLocaleString()} prebuilt page(s) — identical sets.`,
);
