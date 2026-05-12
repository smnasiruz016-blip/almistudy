import Link from "next/link";
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
import HeroIllustration from "@/components/HeroIllustration";

// Manual curation: update when a new country flagship ships. Future
// enhancement: derive from latest lastVerified date across countries.
const LATEST_COUNTRY_SLUG = "canada";
const LATEST_FEATURED_UNI_ID = "UNI_0219";

const TRUST_BULLETS: Array<{ dot: string; text: string }> = [
  { dot: "bg-coral", text: "A directory, not a counselor" },
  { dot: "bg-sage", text: "Verification, not opinion" },
  { dot: "bg-gold", text: "Free, no account required" },
];

function maxLastVerified(unis: ReadonlyArray<{ lastVerified: string | null }>): string | null {
  let max: string | null = null;
  for (const u of unis) {
    if (!u.lastVerified) continue;
    if (max === null || u.lastVerified > max) max = u.lastVerified;
  }
  return max;
}

export default function Home() {
  const countries = getAllCountries();
  const totalUniversities = countries.reduce((s, c) => s + c.count, 0);
  const regions = getRegionsForHomepage();
  const lastVerified = maxLastVerified(publishable as Array<{ lastVerified: string | null }>);
  const builtInOpenBullet = lastVerified
    ? `Built in the open · ${totalUniversities} universities · last verified ${lastVerified}`
    : `Built in the open · ${totalUniversities} universities`;

  const latestCountryUnis = getUniversitiesByCountrySlug(LATEST_COUNTRY_SLUG);
  const featured: University | undefined = latestCountryUnis.find(
    (u) => u.id === LATEST_FEATURED_UNI_ID,
  );

  return (
    <main className="flex flex-col flex-1 bg-cream">
      {/* HERO */}
      <section className="px-6 pt-6 pb-10 sm:pt-10 sm:pb-14">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6 sm:mb-8">
            <HeroIllustration />
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-plum leading-tight max-w-[460px] mb-4">
            Where to study for credentials that transfer.
          </h1>
          <p className="text-sm sm:text-base text-plum-soft leading-relaxed max-w-[460px] mb-6">
            A directory of verified-accreditation universities. Free to browse. No account
            required, no applications brokered.
          </p>
          <Link
            href="/universities"
            className="inline-flex items-center gap-1.5 bg-coral hover:bg-coral-deep text-cream text-sm font-medium px-4 py-2.5 rounded-md transition-colors"
          >
            Browse all <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-cream-soft px-6 py-5 sm:py-6">
        <div className="mx-auto w-full max-w-4xl">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {TRUST_BULLETS.map((b) => (
              <li key={b.text} className="flex items-center gap-2 text-xs sm:text-sm text-plum-soft">
                <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${b.dot}`} aria-hidden="true" />
                <span>{b.text}</span>
              </li>
            ))}
            <li className="flex items-center gap-2 text-xs sm:text-sm text-plum-soft">
              <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0 bg-plum" aria-hidden="true" />
              <span>{builtInOpenBullet}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* BROWSE BY REGION */}
      <section className="px-6 py-8 sm:py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[15px] font-medium text-plum">Browse by region</h2>
            <p className="text-xs text-plum-faint">
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
                      <p className="text-sm font-medium text-plum">{r.name}</p>
                      <p className="text-xs text-plum-soft mt-1">
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
                  <p className="text-sm font-medium text-plum-soft">{r.name}</p>
                  <p className="text-xs text-plum-faint mt-1">Coverage coming</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* BROWSE BY SUBJECT */}
      <section className="px-6 py-8 sm:py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[15px] font-medium text-plum">Browse by subject</h2>
            <p className="text-xs text-plum-faint">{SUBJECT_ORDER.length} categories</p>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUBJECT_ORDER.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/subjects/${slug}`}
                  className="block rounded-md border border-peach bg-cream px-3 py-2.5 text-[13px] text-plum hover:bg-cream-soft transition-colors"
                >
                  {SUBJECT_NAMES[slug]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LATEST COUNTRY FEATURED */}
      {featured && (
        <section className="px-6 py-8 sm:py-10">
          <div className="mx-auto w-full max-w-4xl">
            <div className="flex items-baseline justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="inline-block uppercase tracking-wide text-[10px] font-medium text-gold bg-peach px-2 py-0.5 rounded">
                  Latest country
                </span>
                <h2 className="text-[15px] font-medium text-plum">Canada</h2>
              </div>
              <p className="text-xs text-plum-faint">
                {latestCountryUnis.length} universities · shipped today
              </p>
            </div>

            <article className="rounded-md border border-peach bg-cream p-5 sm:p-6">
              <header className="flex items-start justify-between gap-3 mb-1">
                <h3 className="text-base font-medium text-plum">{featured.name}</h3>
                <span className="text-[11px] font-mono text-plum-faint shrink-0">
                  {featured.id}
                </span>
              </header>
              <p className="text-xs text-plum-soft mb-4">
                {featured.city}
                {featured.controlType ? ` · ${featured.controlType[0].toUpperCase()}${featured.controlType.slice(1)}` : ""}
                {featured.primaryLanguage ? ` · ${featured.primaryLanguage}` : ""}
              </p>

              <dl className="text-xs grid grid-cols-[92px_1fr] gap-x-3 gap-y-1.5 text-plum-soft mb-4">
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

              <div className="flex flex-wrap gap-4 text-xs pt-3 border-t border-peach">
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
    </main>
  );
}
