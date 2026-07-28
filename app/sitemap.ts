import type { MetadataRoute } from "next";
import {
  getAllCountries,
  getUniversitiesByCountrySlug,
  getUniversitiesByCountrySubject,
} from "@/lib/page-relations";
import { SUBJECT_ORDER, getCanonicalSubjects } from "@/lib/subject-mapper";
import { V2_REGION_ORDER } from "@/lib/regions";
import {
  STUDY_ORIGINS,
  STUDY_ORIGIN_DESTINATIONS,
} from "@/lib/study-origin-localization";

/**
 * Chunked sitemap (Next 16 generateSitemaps async-id pattern).
 *
 * The 2026 full-index scale makes EVERY data-real page indexable:
 *   BASE (~24,868): home + /universities + 12 subjects + 6 regions + 197
 *     country hubs + non-empty country×subject + origin study-guides + 3,197
 *     universities + 19,310 university×subject-TAUGHT pages.
 *   ORIGIN LEAVES (~3.8M): 19,310 uni×subject-taught × 197 origin countries
 *     (/university/[uni]/[subject]/from-[origin]).
 *
 * Real-data-or-canonical-up: only subjects a university actually teaches are
 * emitted (getCanonicalSubjects). A uni×subject it does NOT teach canonicalises
 * up to /university/[slug] and is never sitemapped — never a fabricated subject.
 *
 * MEMORY-SAFE: the ~3.8M origin leaves are NEVER materialised as one array. Each
 * chunk computes its slice index-mathematically (pairIndex = L / nOrigins,
 * originIndex = L % nOrigins). Only BASE_URLS (~25k) and PAIRS (~19k) are cached.
 *
 * Next 16: `id` is a Promise — await it, then Number(...). The manual index at
 * app/sitemap-index.xml/route.ts MUST mirror NUM_CHUNKS exactly (no phantom
 * chunks). Test sitemaps via build + next start + curl, never tsx.
 */

const SITE = "https://almistudy.almiworld.com";
const CHUNK = 45_000; // under Google's 50k/sitemap cap

// Data-snapshot date, NOT wall-clock. The pages are built from static in-repo JSON;
// emitting `new Date()` told crawlers every URL "just changed" on every fetch, driving
// needless re-crawls (and thus ISR first-write cost). Bump this ONLY when the
// underlying university/subject/country data actually changes.
export const LASTMOD = new Date("2026-07-12");

const ORIGIN_SLUGS: string[] = getAllCountries().map((c) => c.slug); // 197 real origin countries

let _base: MetadataRoute.Sitemap | null = null;
function baseUrls(): MetadataRoute.Sitemap {
  if (_base) return _base;
  const lm = LASTMOD;
  const out: MetadataRoute.Sitemap = [];
  out.push({ url: SITE, lastModified: lm, changeFrequency: "weekly", priority: 1.0 });
  out.push({ url: `${SITE}/universities`, lastModified: lm, changeFrequency: "weekly", priority: 0.9 });
  for (const s of SUBJECT_ORDER) out.push({ url: `${SITE}/subjects/${s}`, lastModified: lm, changeFrequency: "weekly", priority: 0.8 });
  for (const r of V2_REGION_ORDER) out.push({ url: `${SITE}/regions/${r}`, lastModified: lm, changeFrequency: "weekly", priority: 0.7 });
  for (const c of getAllCountries()) {
    out.push({ url: `${SITE}/universities/${c.slug}`, lastModified: lm, changeFrequency: "monthly", priority: 0.7 });
    for (const s of SUBJECT_ORDER) {
      if (getUniversitiesByCountrySubject(c.slug, s)) {
        out.push({ url: `${SITE}/study/${c.slug}/${s}`, lastModified: lm, changeFrequency: "monthly", priority: 0.6 });
      }
    }
  }
  // Origin study guides (existing): destinations with data × researched origins.
  for (const dest of STUDY_ORIGIN_DESTINATIONS) {
    if (getUniversitiesByCountrySlug(dest).length === 0) continue;
    for (const o of STUDY_ORIGINS) {
      out.push({ url: `${SITE}/study/${dest}/from-${o.slug}`, lastModified: lm, changeFrequency: "weekly", priority: 0.6 });
    }
  }
  // ALL university pages (3,197 — every verified uni, even those with no mapped
  // canonical subject).
  for (const c of getAllCountries()) {
    for (const u of getUniversitiesByCountrySlug(c.slug)) {
      out.push({ url: `${SITE}/university/${u.slug}`, lastModified: lm, changeFrequency: "monthly", priority: 0.6 });
    }
  }
  // University × subject-TAUGHT base pages (19,310, PAIRS order).
  for (const p of pairsList()) {
    out.push({ url: `${SITE}/university/${p.uni}/${p.subject}`, lastModified: lm, changeFrequency: "monthly", priority: 0.55 });
  }
  _base = out;
  return out;
}

type Pair = { uni: string; subject: string };
let _pairs: Pair[] | null = null;
function pairsList(): Pair[] {
  if (_pairs) return _pairs;
  const out: Pair[] = [];
  for (const c of getAllCountries()) {
    for (const u of getUniversitiesByCountrySlug(c.slug)) {
      for (const s of getCanonicalSubjects(u)) {
        out.push({ uni: u.slug, subject: s });
      }
    }
  }
  _pairs = out;
  return out;
}

function totalUrls(): number {
  return baseUrls().length + pairsList().length * ORIGIN_SLUGS.length;
}

export function numSitemapChunks(): number {
  return Math.max(1, Math.ceil(totalUrls() / CHUNK));
}

export async function generateSitemaps() {
  return Array.from({ length: numSitemapChunks() }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const idNum = Number(await id);
  const start = (Number.isNaN(idNum) ? 0 : idNum) * CHUNK;
  const end = start + CHUNK;

  const base = baseUrls();
  const out: MetadataRoute.Sitemap = [];

  // Base portion of this chunk.
  for (let i = Math.max(0, start); i < Math.min(base.length, end); i++) out.push(base[i]);

  // Origin-leaf portion (computed, never materialised whole).
  const oStart = Math.max(0, start - base.length);
  const oEnd = end - base.length;
  if (oEnd > 0) {
    const pairs = pairsList();
    const nOrigins = ORIGIN_SLUGS.length;
    const lm = LASTMOD;
    const cap = Math.min(pairs.length * nOrigins, oEnd);
    for (let L = oStart; L < cap; L++) {
      const p = pairs[Math.floor(L / nOrigins)];
      const o = ORIGIN_SLUGS[L % nOrigins];
      out.push({ url: `${SITE}/university/${p.uni}/${p.subject}/from-${o}`, lastModified: lm, changeFrequency: "monthly", priority: 0.45 });
    }
  }

  return out;
}
