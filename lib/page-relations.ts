import publishable from "@/lib/universities-publishable.json";
import { getCanonicalSubjects, type SubjectSlug } from "./subject-mapper";

export type University = {
  id: string;
  slug: string;
  name: string;
  country: { iso2: string; name: string; slug: string };
  city: string;
  region: string;
  controlType: string | null;
  officialWebsite: string | null;
  admissionsUrl: string | null;
  primaryLanguage: string | null;
  subjects: string[];
  categoryTags: string[];
  scholarshipsAvailable: string | null;
  englishTestNote: string | null;
  tuitionNote: string | null;
  studentNotes: string | null;
  contactUrl?: string;
  admissionsEmail?: string;
  mainPhone?: string;
  deadlinesUrl?: string;
  deadlinesNote?: string;
  scholarshipsUrl?: string;
  accreditationBody: string | null;
  accreditationRegistryUrl: string | null;
  accreditationBodyVerifiedDate: string | null;
  recognitionByDestination: Array<{
    destinationCountry: string;
    regulatoryBody: string;
    recognized: boolean;
    registryUrl: string;
    asOf: string;
  }>;
  source: {
    id: string;
    title: string | null;
    publisher: string | null;
    url: string | null;
    tier: string | null;
    description?: string;
  };
  lastVerified: string | null;
  verificationStatus: string;
  publishable: boolean;
};

const ALL: University[] = publishable as University[];

export type CountryEntry = {
  slug: string;
  name: string;
  iso2: string;
  region: string;
  count: number;
};

const BY_COUNTRY: Map<string, University[]> = (() => {
  const m = new Map<string, University[]>();
  for (const u of ALL) {
    const list = m.get(u.country.slug) ?? [];
    list.push(u);
    m.set(u.country.slug, list);
  }
  return m;
})();

const COUNTRIES: CountryEntry[] = (() => {
  const seen = new Map<string, CountryEntry>();
  for (const u of ALL) {
    if (seen.has(u.country.slug)) continue;
    seen.set(u.country.slug, {
      slug: u.country.slug,
      name: u.country.name,
      iso2: u.country.iso2,
      region: u.region,
      count: BY_COUNTRY.get(u.country.slug)?.length ?? 0
    });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
})();

export function getAllCountries(): CountryEntry[] {
  return COUNTRIES;
}

export function getCountryBySlug(slug: string): CountryEntry | undefined {
  return COUNTRIES.find((c) => c.slug === slug);
}

export function getUniversitiesByCountrySlug(slug: string): University[] {
  return (BY_COUNTRY.get(slug) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
}

// Founding-corridor first, then alphabetical. Used on the homepage to surface
// the most-relevant countries to AlmiStudy's §1.2 audience first.
const FOUNDING_CORRIDOR_ORDER = [
  "saudi-arabia",
  "united-arab-emirates",
  "qatar",
  "kuwait",
  "bahrain",
  "oman",
  "philippines",
  "pakistan",
  "india",
  "bangladesh",
  "nepal",
  "united-kingdom",
  "canada",
  "ireland",
  "sweden"
];

export function getCountriesForHomepage(): CountryEntry[] {
  const order = new Map(FOUNDING_CORRIDOR_ORDER.map((s, i) => [s, i]));
  return COUNTRIES.slice().sort((a, b) => {
    const ai = order.get(a.slug);
    const bi = order.get(b.slug);
    if (ai !== undefined && bi !== undefined) return ai - bi;
    if (ai !== undefined) return -1;
    if (bi !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });
}

// ─────────────────────────────────────────────────────────────────────
// L1 + L4 indices (added in feat/4-layer-expansion).
//   • BY_SLUG: O(1) university lookup for L1 /university/[slug]
//   • BY_SUBJECT: every university teaching a given canonical subject
//   • BY_COUNTRY_SUBJECT: country → subject → unis. Partial<Record> on
//     the inner so callers get `undefined` (not empty array) when there
//     is no data, distinguishing "we haven't reviewed this combo yet"
//     from "we reviewed and found zero".
// ─────────────────────────────────────────────────────────────────────

const BY_SLUG: Map<string, University> = new Map(ALL.map((u) => [u.slug, u]));

const BY_SUBJECT: Record<SubjectSlug, University[]> = (() => {
  const out = {} as Record<SubjectSlug, University[]>;
  for (const u of ALL) {
    for (const s of getCanonicalSubjects(u)) {
      (out[s] ??= []).push(u);
    }
  }
  return out;
})();

const BY_COUNTRY_SUBJECT: Record<string, Partial<Record<SubjectSlug, University[]>>> = (() => {
  const out: Record<string, Partial<Record<SubjectSlug, University[]>>> = {};
  for (const u of ALL) {
    const cs = u.country.slug;
    out[cs] ??= {};
    for (const s of getCanonicalSubjects(u)) {
      (out[cs][s] ??= []).push(u);
    }
  }
  return out;
})();

export function getUniversityBySlug(slug: string): University | undefined {
  return BY_SLUG.get(slug);
}

export function getUniversitiesBySubject(subject: SubjectSlug): University[] {
  return (BY_SUBJECT[subject] ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns the universities matching {country × subject}, or `undefined`
 * when AlmiStudy has no entry for that combination. Honest: distinguish
 * "no data yet" from "we reviewed, found zero" — the former returns
 * undefined, the latter is impossible because we only build the index
 * from real publishable rows.
 */
export function getUniversitiesByCountrySubject(
  countrySlug: string,
  subject: SubjectSlug,
): University[] | undefined {
  const bySubject = BY_COUNTRY_SUBJECT[countrySlug];
  if (!bySubject) return undefined;
  const arr = bySubject[subject];
  return arr ? arr.slice().sort((a, b) => a.name.localeCompare(b.name)) : undefined;
}

/** Sister subjects: SubjectSlugs the same country has at least one uni for. */
export function getSubjectsForCountry(countrySlug: string): SubjectSlug[] {
  const bySubject = BY_COUNTRY_SUBJECT[countrySlug];
  if (!bySubject) return [];
  return (Object.keys(bySubject) as SubjectSlug[]).sort();
}

/** Sister countries: countries that have at least one uni for the subject. */
export function getCountriesForSubject(subject: SubjectSlug): CountryEntry[] {
  return COUNTRIES.filter((c) => (BY_COUNTRY_SUBJECT[c.slug] ?? {})[subject]);
}
