import {
  getAllCountries,
  getUniversitiesByCountrySlug,
  type CountryEntry,
  type University,
} from "@/lib/page-relations";

export type V2RegionSlug =
  | "asia"
  | "europe"
  | "north-america"
  | "oceania"
  | "africa"
  | "south-america";

export type V2Region = {
  slug: V2RegionSlug;
  name: string;
  universityCount: number;
  countryCount: number;
  status: "active" | "coming-soon";
};

// Map current DB region strings to v2 consolidated region slugs.
// Middle East + South Asia + Southeast Asia all map to 'asia' — single
// Asia region per v2 IA decision; sub-regions preserved at country level
// for users who want to browse by specific country.
export const DB_REGION_TO_V2_SLUG: Record<string, V2RegionSlug> = {
  "Middle East": "asia",
  "South Asia": "asia",
  "Southeast Asia": "asia",
  Europe: "europe",
  "North America": "north-america",
  Oceania: "oceania",
};

export const V2_REGION_ORDER: V2RegionSlug[] = [
  "asia",
  "europe",
  "north-america",
  "oceania",
  "africa",
  "south-america",
];

export const V2_REGION_NAMES: Record<V2RegionSlug, string> = {
  asia: "Asia",
  europe: "Europe",
  "north-america": "North America",
  oceania: "Oceania",
  africa: "Africa",
  "south-america": "South America",
};

export function getRegionsForHomepage(): V2Region[] {
  const buckets: Record<V2RegionSlug, { unis: number; countries: number }> = {
    asia: { unis: 0, countries: 0 },
    europe: { unis: 0, countries: 0 },
    "north-america": { unis: 0, countries: 0 },
    oceania: { unis: 0, countries: 0 },
    africa: { unis: 0, countries: 0 },
    "south-america": { unis: 0, countries: 0 },
  };
  for (const c of getAllCountries()) {
    const v2 = DB_REGION_TO_V2_SLUG[c.region];
    if (!v2) continue;
    buckets[v2].unis += c.count;
    buckets[v2].countries += 1;
  }
  return V2_REGION_ORDER.map((slug) => ({
    slug,
    name: V2_REGION_NAMES[slug],
    universityCount: buckets[slug].unis,
    countryCount: buckets[slug].countries,
    status: buckets[slug].countries > 0 ? "active" : "coming-soon",
  }));
}

export function getCountriesByRegion(slug: V2RegionSlug): CountryEntry[] {
  return getAllCountries()
    .filter((c) => DB_REGION_TO_V2_SLUG[c.region] === slug)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getUniversitiesByRegion(slug: V2RegionSlug): University[] {
  return getCountriesByRegion(slug).flatMap((c) =>
    getUniversitiesByCountrySlug(c.slug),
  );
}

export function getRegionBySlug(slug: V2RegionSlug): V2Region | undefined {
  return getRegionsForHomepage().find((r) => r.slug === slug);
}
