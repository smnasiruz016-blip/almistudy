import type { MetadataRoute } from "next";
import {
  getAllCountries,
  getUniversitiesByCountrySlug,
  getUniversitiesByCountrySubject,
} from "@/lib/page-relations";
import { SUBJECT_ORDER } from "@/lib/subject-mapper";
import { V2_REGION_ORDER } from "@/lib/regions";
import {
  STUDY_ORIGINS,
  STUDY_ORIGIN_DESTINATIONS,
} from "@/lib/study-origin-localization";

/**
 * Flat sitemap of canonical, indexable URLs only.
 *
 * Total ~5,700 URLs (statics + 12 subjects + 6 regions + 197 country
 * pages + non-empty country×subject combos + 3,197 university pages).
 * The 4th layer (study/[c]/[s]/[u], ~23.8k) is deliberately excluded —
 * it canonicalises to /university/[slug], so it is not a canonical URL.
 * Well under Google's 50k-per-sitemap cap; if we ever cross ~45k, adopt
 * the async-id chunked pattern from almijob-v2/docs/SITEMAP_CHUNKING_FUTURE.md.
 *
 * Honesty: L4 Route B (study/[c]/[s]) URLs are emitted ONLY for non-empty
 * country×subject combos. Empty combos are NOT in the sitemap — that page
 * renders the honest empty-state banner if a user lands there directly,
 * but we don't actively crawl-promote URLs we have no data for.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://almistudy.almiworld.com";
  const lastModified = new Date();
  const out: MetadataRoute.Sitemap = [];

  // Statics
  out.push({ url: base, lastModified, changeFrequency: "weekly", priority: 1.0 });
  out.push({ url: `${base}/universities`, lastModified, changeFrequency: "weekly", priority: 0.9 });

  // L2: 12 subject pages
  for (const subject of SUBJECT_ORDER) {
    out.push({
      url: `${base}/subjects/${subject}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Bonus: 6 region pages
  for (const region of V2_REGION_ORDER) {
    out.push({
      url: `${base}/regions/${region}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // L3: 197 country pages + L4 + L1
  const countries = getAllCountries();
  for (const c of countries) {
    // L3
    out.push({
      url: `${base}/universities/${c.slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    });
    // L4 Route B — only emit combos that actually have universities
    for (const subject of SUBJECT_ORDER) {
      if (getUniversitiesByCountrySubject(c.slug, subject)) {
        out.push({
          url: `${base}/study/${c.slug}/${subject}`,
          lastModified,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
    // L1 per-uni canonical page
    const unis = getUniversitiesByCountrySlug(c.slug);
    for (const u of unis) {
      out.push({
        url: `${base}/university/${u.slug}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    // NOTE: L4 Route A (study/[c]/[s]/[u], ~23.8k URLs) is intentionally
    // NOT in the sitemap. Those pages canonicalise to /university/[slug]
    // (see app/study/[country]/[subject]/[uni]/page.tsx) — listing thin
    // near-duplicates here would dilute crawl budget and contradict the
    // "sitemap holds only canonical URLs" rule.
  }

  // Origin × destination study guides (8 study destinations × 10 researched
  // origins). Distinct funding-led copy → self-canonical + indexed (not thin).
  // Emitted only where the destination actually has verified-uni data, so we
  // never crawl-promote a data-less page. Promotion is data-only (add a slug).
  for (const dest of STUDY_ORIGIN_DESTINATIONS) {
    if (getUniversitiesByCountrySlug(dest).length === 0) continue;
    for (const o of STUDY_ORIGINS) {
      out.push({
        url: `${base}/study/${dest}/from-${o.slug}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return out;
}
