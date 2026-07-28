/**
 * THE STATIC INDEX — the single list of pages this site actually has.
 *
 * Every matrix route's generateStaticParams and app/sitemap.ts both read from here.
 * That is the whole point: before this module they were two independent computations,
 * and the site advertised ~3.83M URLs while prebuilding none of them.
 *
 * WHAT CHANGED AND WHY (2026-07-28). The origin leaves —
 * /university/[uni]/[subject]/from-[origin], 19,310 taught pairs × 197 origin
 * countries = 3,804,070 URLs — were never prebuilt. They were minted on first request
 * (dynamicParams = true, generateStaticParams returning []), one ISR write each,
 * re-armed on every deploy because a deploy resets the ISR cache. That cost $89.07 in
 * ISR writes on this project alone in the 2026-07 cycle, out of $254.57 across the
 * team, against $4.36 of ISR reads — pages written far more than they were ever read.
 *
 * They are not prebuilt now either: 3.8M pages cannot be built inside a 45-minute
 * build. The decision (beta-g, GREEN via Nasir) is that they should not exist at all —
 * dynamicParams = false on every matrix route, so an origin leaf 404s instead of
 * minting itself, and the sitemap no longer advertises them.
 *
 * PREBUILT == SITEMAPPED. The one set that used to break the equality —
 * /study/[country]/[subject]/[uni], a canonical duplicate that was prebuilt but not
 * sitemapped — is now a 301 in next.config.ts rather than 19,310 pages, so the two
 * sets are identical again. scripts/sitemap-prebuild-gate.mts asserts both
 * containment AND equality.
 */

import {
  getAllCountries,
  getUniversitiesByCountrySlug,
  getUniversitiesByCountrySubject,
} from "@/lib/page-relations";
import { SUBJECT_ORDER, getCanonicalSubjects, type SubjectSlug } from "@/lib/subject-mapper";
import { V2_REGION_ORDER } from "@/lib/regions";
import {
  STUDY_ORIGINS,
  STUDY_ORIGIN_DESTINATIONS,
  studyOriginsWithContent,
} from "@/lib/study-origin-localization";

export const FROM = "from-";

/** All 12 canonical subjects. Route: /subjects/[subject] */
export function subjects(): SubjectSlug[] {
  return [...SUBJECT_ORDER];
}

/** All 6 regions. Rendered by /regions/[region], which has its own params. */
export function regions(): string[] {
  return [...V2_REGION_ORDER];
}

/** Every verified university. Route: /university/[slug]
 *
 *  ⚠️ DEDUPED, and the dedupe is hiding a DATA BUG — see the note on uniqueSlugs().
 *  Duplicate params would make Next build the same page twice and make the sitemap
 *  advertise the same URL twice; deduping fixes the build, NOT the underlying data. */
let _unis: string[] | null = null;
export function universities(): string[] {
  if (_unis) return _unis;
  const out: string[] = [];
  for (const c of getAllCountries()) for (const u of getUniversitiesByCountrySlug(c.slug)) out.push(u.slug);
  _unis = uniqueStrings(out);
  return _unis;
}

/** ⚠️ KNOWN SLUG COLLISION, 2026-07-28 — one, and it loses a real university.
 *
 *  `middle-east-university` is claimed by TWO distinct real institutions:
 *    jordan   — Middle East University (MEU), Amman
 *    lebanon  — Middle East University (MEU), Sabtieh
 *  getUniversityBySlug() resolves it to LEBANON, so the Jordanian university has no
 *  reachable page at all: /university/middle-east-university and its six subject
 *  pages render Lebanon's city and accreditation, under a URL that Jordan's country
 *  hub links to. A visitor sent from Jordan is shown a Lebanese university.
 *
 *  Deduping here stops the build and the sitemap from double-counting it. It does NOT
 *  fix the data, and it must not be mistaken for a fix: the repair is distinct slugs
 *  (e.g. middle-east-university-jordan) plus a redirect decision for the existing
 *  indexed URL. Flagged for Nasir; not changed here, because renaming a live indexed
 *  URL is not a side effect a cost fix gets to make. */
function uniqueStrings(xs: string[]): string[] {
  return [...new Set(xs)];
}

function uniqueBy<T>(xs: T[], key: (x: T) => string): T[] {
  const seen = new Set<string>();
  return xs.filter((x) => {
    const k = key(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** University × subject-TAUGHT. Route: /university/[slug]/[subject]
 *
 *  Real-data gate: getCanonicalSubjects returns only subjects the university actually
 *  teaches, so a uni×subject it does not teach is never built and never sitemapped —
 *  it canonicalises up to /university/[slug]. Never a fabricated subject. */
let _pairs: Array<{ slug: string; subject: SubjectSlug }> | null = null;
export function universitySubjectPairs(): Array<{ slug: string; subject: SubjectSlug }> {
  if (_pairs) return _pairs;
  const out: Array<{ slug: string; subject: SubjectSlug }> = [];
  for (const c of getAllCountries()) {
    for (const u of getUniversitiesByCountrySlug(c.slug)) {
      for (const s of getCanonicalSubjects(u)) out.push({ slug: u.slug, subject: s });
    }
  }
  _pairs = uniqueBy(out, (x) => `${x.slug}/${x.subject}`);
  return _pairs;
}

/** Country hubs. Route: /universities/[country] */
export function countries(): string[] {
  return getAllCountries().map((c) => c.slug);
}

/** Country × subject, only where universities exist. Route: /study/[country]/[subject] */
let _cs: Array<{ country: string; subject: string }> | null = null;
export function countrySubjectPairs(): Array<{ country: string; subject: string }> {
  if (_cs) return _cs;
  const out: Array<{ country: string; subject: string }> = [];
  for (const c of getAllCountries()) {
    for (const s of SUBJECT_ORDER) {
      if (getUniversitiesByCountrySubject(c.slug, s)) out.push({ country: c.slug, subject: s });
    }
  }
  _cs = out;
  return out;
}

/** Origin study guides — destinations that have data × the 11 researched origins.
 *  Served by /study/[country]/[subject] with the subject segment as "from-<origin>". */
let _guides: Array<{ country: string; subject: string }> | null = null;
export function originGuides(): Array<{ country: string; subject: string }> {
  if (_guides) return _guides;
  const out: Array<{ country: string; subject: string }> = [];
  for (const dest of STUDY_ORIGIN_DESTINATIONS) {
    if (getUniversitiesByCountrySlug(dest).length === 0) continue;
    // CONTENT-backed origins only. STUDY_ORIGINS is the shared identity list (11);
    // this is the subset we have written copy for (10). Advertising the difference
    // put 8 live 500s in the sitemap — see hasOriginContent().
    for (const o of studyOriginsWithContent()) out.push({ country: dest, subject: `${FROM}${o.slug}` });
  }
  _guides = out;
  return out;
}

/** RETIRED 2026-07-28 — /study/[country]/[subject]/[uni] is gone.
 *
 *  It was 19,310 prebuilt pages duplicating /university/[slug]/[subject]. It is now a
 *  single 301 in next.config.ts pointing at that canonical URL: same content, same
 *  links, half the build, no duplicate-content surface. Verified before removal: all
 *  19,310 triples had their canonical target in the prebuilt pair set, 0 orphans, so
 *  no redirect lands on a 404.
 *
 *  Nothing should reintroduce a prebuilt list here. If those URLs ever need to be
 *  pages again, the question to answer first is what they would say that
 *  /university/[slug]/[subject] does not. */

/** Paths that are PREBUILT at build time (dynamicParams = false → unknown 404s).
 *  Deliberately small: this is everything except the 19,310 pair pages. */
export function prebuiltPaths(): string[] {
  const out: string[] = ["", "/universities"];
  for (const s of subjects()) out.push(`/subjects/${s}`);
  for (const r of regions()) out.push(`/regions/${r}`);
  for (const c of countries()) out.push(`/universities/${c}`);
  for (const p of countrySubjectPairs()) out.push(`/study/${p.country}/${p.subject}`);
  for (const g of originGuides()) out.push(`/study/${g.country}/${g.subject}`);
  for (const u of universities()) out.push(`/university/${u}`);
  return out;
}

/** Paths served BOUNDED-ON-DEMAND — real, finite, advertised, but not prebuilt.
 *  See lib/isr-policy.ts. Prebuilding these produced 244,331 output files and failed
 *  the deployment; they are the one route allowed to render on first request. */
export function boundedOnDemandPaths(): string[] {
  return universitySubjectPairs().map((p) => `/university/${p.slug}/${p.subject}`);
}

/** Every URL PATH this site advertises = prebuilt + bounded-on-demand, and NOTHING
 *  else. The sitemap is built from this and nothing else, so it can advertise neither
 *  a page that does not exist nor an unbounded space. */
export function sitemapPaths(): string[] {
  return [...prebuiltPaths(), ...boundedOnDemandPaths()];
}
