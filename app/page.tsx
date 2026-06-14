import Link from "next/link";
import type { Metadata } from "next";
import publishable from "@/lib/universities-publishable.json";
import {
  getAllCountries,
  getUniversitiesByCountrySlug,
  type University,
} from "@/lib/page-relations";
import { getRegionsForHomepage } from "@/lib/regions";
import {
  SUBJECT_ORDER,
  SUBJECT_NAMES,
} from "@/app/subjects/[subject]/page";

// Manual curation: update when a new country flagship ships.
const LATEST_COUNTRY_SLUG = "canada";
const LATEST_FEATURED_UNI_ID = "UNI_0219";

// Single source of truth for the headline count — derived from the data so
// it can never go stale or overstate. Used in metadata + hero + trust + CTA.
function totalUniversitiesCount(): number {
  return getAllCountries().reduce((s, c) => s + c.count, 0);
}

function maxLastVerified(unis: ReadonlyArray<{ lastVerified: string | null }>): string | null {
  let max: string | null = null;
  for (const u of unis) {
    if (!u.lastVerified) continue;
    if (max === null || u.lastVerified > max) max = u.lastVerified;
  }
  return max;
}

// Metadata is generated so the count in the description stays true to the data.
// Title is `absolute` to opt out of the layout's "%s · AlmiStudy" template
// (this title already carries the brand) — no double-brand.
export function generateMetadata(): Metadata {
  const n = totalUniversitiesCount().toLocaleString();
  const title = "Find Universities Worldwide — Free, Verified Directory | AlmiStudy";
  const description = `Search ${n} verified universities around the world. A directory, not a counselor — verification, not opinion. Free, no account required. Find where you can actually study abroad.`;
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

// One primary CTA, repeated. Search-the-directory is the action.
const CTA_HREF = "/universities";
const CTA_CLASS =
  "inline-flex min-h-[44px] items-center justify-center bg-coral hover:bg-coral-deep text-cream text-sm font-semibold px-6 py-3 rounded-lg transition-colors";

const TRUST = [
  { dot: "bg-coral", text: "A directory, not a counselor" },
  { dot: "bg-sage", text: "Verification, not opinion" },
  { dot: "bg-gold", text: "Free, no account required" },
];

const BENEFITS = [
  {
    title: "Verified, not hyped",
    body: "Real, checked information. We show facts, not opinions or paid placements.",
  },
  {
    title: "Search the whole world",
    body: "Universities across the globe, in one place, free to explore.",
  },
  {
    title: "No account, no catch",
    body: "Search instantly. No sign-up wall, no spam, no agent calling you.",
  },
  {
    title: "Built in the open",
    body: "A directory you can trust because it isn't trying to sell you a specific school.",
  },
];

// Bridge → the rest of the ecosystem (the conversion engine).
const BRIDGE = [
  {
    label: "Need IELTS?",
    body: "Practise with honest AI band scores",
    product: "AlmiPrep",
    href: "https://almiprep.almiworld.com",
  },
  {
    label: "Application CV?",
    body: "Build one that gets noticed",
    product: "AlmiCV",
    href: "https://almicv.almiworld.com",
  },
  {
    label: "Know what your degree will earn?",
    body: "Check real salaries",
    product: "AlmiSalary",
    href: "https://almisalary.almiworld.com",
  },
];

export default function Home() {
  const countries = getAllCountries();
  const totalUniversities = countries.reduce((s, c) => s + c.count, 0);
  const totalLabel = totalUniversities.toLocaleString();
  const regions = getRegionsForHomepage();
  const lastVerified = maxLastVerified(
    publishable as Array<{ lastVerified: string | null }>,
  );
  const builtInOpenBullet = lastVerified
    ? `Built in the open · ${totalLabel} universities · last verified ${lastVerified}`
    : `Built in the open · ${totalLabel} universities`;

  const latestCountryUnis = getUniversitiesByCountrySlug(LATEST_COUNTRY_SLUG);
  const featured: University | undefined = latestCountryUnis.find(
    (u) => u.id === LATEST_FEATURED_UNI_ID,
  );

  return (
    <main className="flex flex-col flex-1 bg-cream">
      {/* HERO — result hook + one CTA (replaces the baked-text PNG banner) */}
      <section className="px-6 pt-14 pb-12 sm:pt-20">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-semibold leading-tight text-plum sm:text-5xl">
            Find the university that says yes.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-plum-soft">
            Stop drowning in options and agent opinions. Search {totalLabel}{" "}
            verified universities worldwide — facts, not sales pitches — and find
            the ones that actually fit you. Free, no account needed.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href={CTA_HREF} className={CTA_CLASS}>
              Search universities
            </Link>
          </div>
          <p className="mt-4 text-sm text-plum-faint">
            Free. No sign-up. {totalLabel} universities
            {lastVerified ? ` · last verified ${lastVerified}` : ""}.
          </p>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-cream-soft px-6 py-5 sm:py-6">
        <div className="mx-auto w-full max-w-4xl">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {TRUST.map((b) => (
              <li key={b.text} className="flex items-center gap-2 text-sm sm:text-base text-plum-soft">
                <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${b.dot}`} aria-hidden="true" />
                <span>{b.text}</span>
              </li>
            ))}
            <li className="flex items-center gap-2 text-sm sm:text-base text-plum-soft">
              <span className="inline-block w-2 h-2 rounded-full shrink-0 bg-plum" aria-hidden="true" />
              <span>{builtInOpenBullet}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* PROBLEM (PAS) */}
      <section className="px-6 py-16">
        <div className="mx-auto w-full max-w-3xl">
          <h2 className="text-balance text-3xl font-semibold leading-tight text-plum">
            Choosing a university abroad shouldn&apos;t mean trusting whoever
            shouts loudest.
          </h2>
          <p className="mt-6 text-lg leading-8 text-plum-soft">
            Agents push the universities that pay them. Forums are full of
            guesses. And you&apos;re left making one of life&apos;s biggest
            decisions on hype instead of facts.
          </p>
          <p className="mt-4 text-lg leading-8 text-plum-soft">
            AlmiStudy is the opposite: a clean, verified directory of {totalLabel}{" "}
            universities you can search yourself — no account, no sales pitch, no
            one steering you toward a commission. Just the facts, so <em>you</em>{" "}
            decide.
          </p>
        </div>
      </section>

      {/* BENEFITS (4 cards) */}
      <section className="bg-cream-soft px-6 py-16">
        <div className="mx-auto w-full max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-md border border-peach bg-cream p-6">
                <h3 className="text-lg font-medium text-plum">{b.title}</h3>
                <p className="mt-2 text-sm text-plum-soft">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BROWSE BY REGION — the SEO directory (kept) */}
      <section className="px-6 py-8 sm:py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-medium text-plum">Browse by region</h2>
            <p className="text-sm text-plum-faint">
              {regions.length} regions · {countries.length} countries
            </p>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {regions.map((r) => {
              if (r.status === "active") {
                return (
                  <li key={r.slug}>
                    <Link
                      href={`/regions/${r.slug}`}
                      className="block rounded-md border border-peach bg-cream px-4 py-3 hover:bg-cream-soft transition-colors"
                    >
                      <p className="text-lg font-medium text-plum">{r.name}</p>
                      <p className="text-sm text-plum-soft mt-1">
                        {r.universityCount} universities · {r.countryCount}{" "}
                        {r.countryCount === 1 ? "country" : "countries"}
                      </p>
                    </Link>
                  </li>
                );
              }
              return (
                <li
                  key={r.slug}
                  className="rounded-md border border-peach bg-cream-soft px-4 py-3 opacity-70"
                  aria-label={`${r.name} — coverage coming`}
                >
                  <p className="text-lg font-medium text-plum-soft">{r.name}</p>
                  <p className="text-sm text-plum-faint mt-1">Coverage coming</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* BROWSE BY SUBJECT — the SEO directory (kept) */}
      <section className="px-6 py-8 sm:py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-medium text-plum">Browse by subject</h2>
            <p className="text-sm text-plum-faint">{SUBJECT_ORDER.length} categories</p>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUBJECT_ORDER.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/subjects/${slug}`}
                  className="block rounded-md border border-peach bg-cream px-3 py-2.5 text-base text-plum hover:bg-cream-soft transition-colors"
                >
                  {SUBJECT_NAMES[slug]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LATEST COUNTRY FEATURED (kept) */}
      {featured && (
        <section className="px-6 py-8 sm:py-10">
          <div className="mx-auto w-full max-w-4xl">
            <div className="flex items-baseline justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="inline-block uppercase tracking-wide text-xs font-medium text-gold bg-peach px-2 py-0.5 rounded">
                  Latest country
                </span>
                <h2 className="text-xl font-medium text-plum">Canada</h2>
              </div>
              <p className="text-sm text-plum-faint">
                {latestCountryUnis.length} universities
              </p>
            </div>

            <article className="rounded-md border border-peach bg-cream p-5 sm:p-6">
              <header className="flex items-start justify-between gap-3 mb-1">
                <h3 className="text-xl font-medium text-plum">{featured.name}</h3>
                <span className="text-[11px] font-mono text-plum-faint shrink-0">
                  {featured.id}
                </span>
              </header>
              <p className="text-sm text-plum-soft mb-4">
                {featured.city}
                {featured.controlType ? ` · ${featured.controlType[0].toUpperCase()}${featured.controlType.slice(1)}` : ""}
                {featured.primaryLanguage ? ` · ${featured.primaryLanguage}` : ""}
              </p>

              <dl className="text-sm grid grid-cols-[92px_1fr] gap-x-3 gap-y-1.5 text-plum-soft mb-4">
                {featured.subjects.length > 0 ? (
                  <>
                    <dt className="text-plum-faint">Subjects</dt>
                    <dd>{featured.subjects.join(" · ")}</dd>
                  </>
                ) : null}
                {featured.accreditationBody && featured.accreditationRegistryUrl ? (
                  <>
                    <dt className="text-plum-faint">Accreditation</dt>
                    <dd>
                      {featured.accreditationBody} ·{" "}
                      <a
                        href={featured.accreditationRegistryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-coral hover:text-coral-deep underline"
                      >
                        Verify on registry
                      </a>
                    </dd>
                  </>
                ) : null}
                {featured.englishTestNote ? (
                  <>
                    <dt className="text-plum-faint">English</dt>
                    <dd>{featured.englishTestNote}</dd>
                  </>
                ) : null}
                {featured.mainPhone ? (
                  <>
                    <dt className="text-plum-faint">Phone</dt>
                    <dd>
                      <a
                        href={`tel:${featured.mainPhone}`}
                        className="text-coral hover:text-coral-deep underline"
                      >
                        {featured.mainPhone}
                      </a>
                    </dd>
                  </>
                ) : null}
                {featured.deadlinesUrl ? (
                  <>
                    <dt className="text-plum-faint">Deadlines</dt>
                    <dd>
                      <a
                        href={featured.deadlinesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-coral hover:text-coral-deep underline"
                      >
                        View official deadlines
                      </a>
                      {featured.deadlinesNote ? (
                        <span className="block italic text-plum-soft mt-0.5">
                          {featured.deadlinesNote}
                        </span>
                      ) : null}
                    </dd>
                  </>
                ) : null}
              </dl>

              <div className="flex flex-wrap gap-4 text-sm font-medium pt-3 border-t border-peach">
                {featured.officialWebsite ? (
                  <a
                    href={featured.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-coral hover:text-coral-deep underline"
                  >
                    Official website →
                  </a>
                ) : null}
                {featured.admissionsUrl ? (
                  <a
                    href={featured.admissionsUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-coral hover:text-coral-deep underline"
                  >
                    Admissions →
                  </a>
                ) : null}
                {featured.scholarshipsUrl ? (
                  <a
                    href={featured.scholarshipsUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-coral hover:text-coral-deep underline"
                  >
                    Scholarships info →
                  </a>
                ) : null}
              </div>
            </article>
          </div>
        </section>
      )}

      {/* BRIDGE → the rest of the ecosystem (conversion engine) */}
      <section className="bg-cream-soft px-6 py-16">
        <div className="mx-auto w-full max-w-4xl">
          <h2 className="text-2xl font-semibold text-plum">
            Found your university? Here&apos;s your next step.
          </h2>
          <p className="mt-3 text-base text-plum-soft">
            Most universities abroad need an English test score — and your
            application needs a CV that stands out.
          </p>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {BRIDGE.map((b) => (
              <li key={b.product}>
                <a
                  href={b.href}
                  className="block h-full rounded-md border border-peach bg-cream p-5 hover:bg-cream-soft transition-colors"
                >
                  <p className="text-sm font-medium text-plum">{b.label}</p>
                  <p className="mt-1 text-sm text-plum-soft">{b.body}</p>
                  <p className="mt-3 text-sm font-semibold text-coral">{b.product} →</p>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-plum-faint">
            One place: find the university, pass the test, build the CV, know your
            worth.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto w-full max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-semibold text-plum">
            Your university is in here. Go find it.
          </h2>
          <div className="mt-7 flex justify-center">
            <Link href={CTA_HREF} className={CTA_CLASS}>
              Search {totalLabel} universities — free
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
