import {
  getAllCountries,
  getUniversitiesByCountrySlug,
  type CountryEntry,
  type University,
} from "@/lib/page-relations";

/**
 * RR-408 A3 · BROWSE BY REGION. The data stores six continents (`region` on every row); the two largest, Asia and the
 * Americas, are split into the sub-regions students search by. Europe, Africa and Oceania stay whole.
 *
 * Every country belongs to exactly ONE region: Asia and North/South America are assigned by country slug below; the
 * other continents map whole. A country the data adds later in Asia or the Americas without a line here makes
 * scripts/rr408-home-search.test.mts fail ("every country in exactly one region"), so a count can never drop silently.
 *
 * Every number (universities, countries) is counted from the live data on each build, never written by hand.
 */
export type RegionSlug =
  | "europe"
  | "middle-east"
  | "south-asia"
  | "east-asia"
  | "southeast-asia"
  | "central-asia"
  | "africa"
  | "north-america"
  | "latin-america"
  | "oceania";

export const REGION_ORDER: RegionSlug[] = [
  "europe",
  "north-america",
  "south-asia",
  "east-asia",
  "southeast-asia",
  "middle-east",
  "central-asia",
  "africa",
  "latin-america",
  "oceania",
];

export const REGION_NAMES: Record<RegionSlug, string> = {
  europe: "Europe",
  "middle-east": "Middle East",
  "south-asia": "South Asia",
  "east-asia": "East Asia",
  "southeast-asia": "Southeast Asia",
  "central-asia": "Central Asia & Caucasus",
  africa: "Africa",
  "north-america": "North America",
  "latin-america": "Latin America & Caribbean",
  oceania: "Oceania",
};

/* the continents that map whole */
const WHOLE: Record<string, RegionSlug> = { Europe: "europe", Africa: "africa", Oceania: "oceania", "South America": "latin-america" };
/* Asia and North America, by country slug */
const BY_COUNTRY: Record<string, RegionSlug> = {
  // Middle East
  bahrain: "middle-east", iran: "middle-east", iraq: "middle-east", israel: "middle-east", jordan: "middle-east",
  kuwait: "middle-east", lebanon: "middle-east", oman: "middle-east", palestine: "middle-east", qatar: "middle-east",
  "saudi-arabia": "middle-east", syria: "middle-east", turkiye: "middle-east", "united-arab-emirates": "middle-east", yemen: "middle-east",
  // South Asia
  afghanistan: "south-asia", bangladesh: "south-asia", bhutan: "south-asia", india: "south-asia", maldives: "south-asia",
  nepal: "south-asia", pakistan: "south-asia", "sri-lanka": "south-asia",
  // East Asia
  china: "east-asia", japan: "east-asia", mongolia: "east-asia", "north-korea": "east-asia", "south-korea": "east-asia", taiwan: "east-asia",
  // Southeast Asia
  brunei: "southeast-asia", cambodia: "southeast-asia", indonesia: "southeast-asia", laos: "southeast-asia", malaysia: "southeast-asia",
  myanmar: "southeast-asia", philippines: "southeast-asia", singapore: "southeast-asia", thailand: "southeast-asia",
  "timor-leste": "southeast-asia", vietnam: "southeast-asia",
  // Central Asia & Caucasus
  kazakhstan: "central-asia", kyrgyzstan: "central-asia", tajikistan: "central-asia", turkmenistan: "central-asia",
  uzbekistan: "central-asia", armenia: "central-asia", azerbaijan: "central-asia",
  // North America (the rest of the data's "North America" is Latin America & Caribbean)
  canada: "north-america", "united-states": "north-america",
};
const AMERICAS_REST: RegionSlug = "latin-america";

/** the region of one country, or undefined when the data holds a country this map does not know (a test fails then) */
export function regionOfCountry(c: Pick<CountryEntry, "slug" | "region">): RegionSlug | undefined {
  if (WHOLE[c.region]) return WHOLE[c.region];
  if (c.region === "Asia") return BY_COUNTRY[c.slug];
  if (c.region === "North America") return BY_COUNTRY[c.slug] ?? AMERICAS_REST;
  return undefined;
}

export type Region = { slug: RegionSlug; name: string; universityCount: number; countryCount: number };

export function getRegions(): Region[] {
  const n = new Map<RegionSlug, { unis: number; countries: number }>();
  for (const c of getAllCountries()) {
    const r = regionOfCountry(c);
    if (!r) continue;
    const b = n.get(r) ?? { unis: 0, countries: 0 };
    b.unis += c.count;
    b.countries += 1;
    n.set(r, b);
  }
  return REGION_ORDER.filter((slug) => (n.get(slug)?.countries ?? 0) > 0).map((slug) => ({
    slug,
    name: REGION_NAMES[slug],
    universityCount: n.get(slug)!.unis,
    countryCount: n.get(slug)!.countries,
  }));
}

export function isRegionSlug(s: string): s is RegionSlug {
  return (REGION_ORDER as readonly string[]).includes(s);
}

export function getRegionBySlug(slug: RegionSlug): Region | undefined {
  return getRegions().find((r) => r.slug === slug);
}

export function getCountriesByRegion(slug: RegionSlug): CountryEntry[] {
  return getAllCountries()
    .filter((c) => regionOfCountry(c) === slug)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getUniversitiesByRegion(slug: RegionSlug): University[] {
  return getCountriesByRegion(slug).flatMap((c) => getUniversitiesByCountrySlug(c.slug));
}
