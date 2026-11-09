/**
 * RR-408 A2 · THE HOME-PAGE SEARCH INDEX, built once at build time.
 *
 * Every published university (after the merges in lib/university-merges.json) is written to /search-index.json
 * (app/search-index.json/route.ts, force-static), served from the CDN and searched in the browser
 * (lib/search-core.ts). No server function runs per keystroke, no ISR page is written, no search creates a URL.
 * Repeated strings (countries, subjects, accreditation bodies, registry links, dates) are stored once.
 */
import { getAllCountries, getUniversitiesByCountrySlug } from "@/lib/page-relations";
import { SUBJECT_ORDER, SUBJECT_NAMES, getCanonicalSubjects } from "@/lib/subject-mapper";
import type { Row, SearchIndex } from "@/lib/search-core";

export function buildSearchIndex(): SearchIndex {
  const countries = getAllCountries();
  const strings: string[] = [""];
  const at = new Map<string, number>([["", 0]]);
  const s = (x: string | null | undefined) => {
    const k = (x ?? "").trim();
    let i = at.get(k);
    if (i === undefined) {
      i = strings.length;
      strings.push(k);
      at.set(k, i);
    }
    return i;
  };
  const rows: Row[] = [];
  countries.forEach((c, ci) => {
    for (const u of getUniversitiesByCountrySlug(c.slug)) {
      let bits = 0;
      for (const sub of getCanonicalSubjects(u)) bits |= 1 << SUBJECT_ORDER.indexOf(sub);
      rows.push([
        u.slug,
        u.name,
        u.city ?? "",
        ci,
        bits,
        s(u.controlType),
        s(u.accreditationBody),
        s(u.accreditationRegistryUrl),
        s(u.accreditationBodyVerifiedDate),
        u.officialWebsite ?? "",
        [...new Set(u.subjects)].map(s),
      ]);
    }
  });
  return {
    v: 1,
    total: rows.length,
    countries: countries.map((c) => [c.slug, c.name]),
    subjects: SUBJECT_ORDER.map((x) => [x, SUBJECT_NAMES[x]]),
    strings,
    rows,
  };
}
