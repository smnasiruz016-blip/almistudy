import { getAllCountries, getUniversitiesByCountrySlug, type University } from "@/lib/page-relations";

const allUniversities = () => getAllCountries().flatMap((c) => getUniversitiesByCountrySlug(c.slug));

/**
 * RR-408 A5 · ONE TITLE PER UNIVERSITY PAGE. The AlmiVisibility scan found 228 /university pages whose title equalled
 * another page's: different universities with one name in different countries ("Victoria University" in Australia and
 * Uganda), and the same university listed twice (merged: lib/university-merges.json). The title now carries the place:
 *   "Victoria University, Melbourne, Australia (2026)"   (+ " · AlmiStudy" from the root layout)
 * A long name is shortened; the place is NEVER dropped. The <h1> and the meta description use the same place.
 */
export const TITLE_MAX = 60; // before the layout's " · AlmiStudy"

/** "Melbourne, Australia"; the city alone when it already names the country; the country alone without a city */
export function placeOf(u: Pick<University, "city" | "country">): string {
  const city = (u.city ?? "").trim();
  const country = u.country.name;
  if (!city) return country;
  if (city.toLowerCase() === country.toLowerCase() || city.toLowerCase().endsWith(`, ${country.toLowerCase()}`)) return city;
  return `${city}, ${country}`;
}

/** the title with the name shortened to fit TITLE_MAX (the place is never cut) */
export function shortTitle(u: Pick<University, "name" | "city" | "country">, year: number): string {
  const tail = `, ${placeOf(u)} (${year})`;
  const room = TITLE_MAX - tail.length;
  /* a place so long it leaves under 16 characters for the name: keep the place and let the title run long, never cut it */
  const fit = Math.max(16, room);
  const name = u.name.length <= fit ? u.name : `${u.name.slice(0, fit - 1).trimEnd()}…`;
  return `${name}${tail}`;
}

/** the AlmiVisibility scan's title key: lower case, every run of other characters one space */
export const titleKey = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * The titles of a whole set at once. Shortening can make two long names equal ("Indian Institute of Technology
 * Del…"): where the short titles of two pages meet, both keep their FULL name instead. Uniqueness wins over length.
 */
export function titlesFor(unis: ReadonlyArray<Pick<University, "slug" | "name" | "city" | "country">>, year: number): Map<string, string> {
  const short = new Map(unis.map((u) => [u.slug, shortTitle(u, year)]));
  const count = new Map<string, number>();
  for (const t of short.values()) count.set(titleKey(t), (count.get(titleKey(t)) ?? 0) + 1);
  return new Map(unis.map((u) => {
    const t = short.get(u.slug)!;
    return [u.slug, (count.get(titleKey(t)) ?? 0) > 1 ? `${u.name}, ${placeOf(u)} (${year})` : t];
  }));
}

let cache: { year: number; titles: Map<string, string> } | null = null;
/** the page title (bare: the root layout appends " · AlmiStudy"), unique among every published university */
export function universityTitle(u: Pick<University, "slug" | "name" | "city" | "country">, year: number): string {
  if (!cache || cache.year !== year) cache = { year, titles: titlesFor(allUniversities(), year) };
  return cache.titles.get(u.slug) ?? shortTitle(u, year);
}

/** the <h1>: the full name, then the place */
export function universityHeading(u: Pick<University, "name" | "city" | "country">): string {
  return `${u.name}, ${placeOf(u)}`;
}

/** the meta description: the place comes first after the (shortened) name, so a cut never removes it */
export function universityDescription(u: University): string {
  const accred = u.accreditationBody ?? "national accrediting body";
  const verified = u.accreditationBodyVerifiedDate ?? u.lastVerified;
  const place = placeOf(u);
  const rest = `: accredited by ${accred}. Subjects, registry link${verified ? `, last verified ${verified}` : ""}.`;
  const room = 160 - ` in ${place}`.length - 40; // keep room for the start of the accreditation line
  const name = u.name.length <= room ? u.name : `${u.name.slice(0, Math.max(20, room) - 1).trimEnd()}…`;
  const full = `${name} in ${place}${rest}`;
  return full.length > 160 ? `${full.slice(0, 157)}…` : full;
}
