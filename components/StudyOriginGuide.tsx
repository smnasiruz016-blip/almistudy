import Link from "next/link";
import {
  getUniversitiesByCountrySlug,
  getSubjectsForCountry,
} from "@/lib/page-relations";
import { SUBJECT_NAMES } from "@/lib/subject-mapper";
import {
  findStudyOrigin,
  getStudyOriginLocalization,
  destScholarshipLinks,
} from "@/lib/study-origin-localization";

const SITE_URL = "https://almistudy.almiworld.com";

type CountryLite = { slug: string; name: string; iso2: string; count: number };

// Origin × destination study guide (Tier 1: /study/[country]/from-[origin]).
// Leads with funding (per the playbook), then keeps real verified-uni data so
// the page is genuinely useful, not a thin name-swap. Self-canonical + indexed.
export function StudyOriginGuide({
  country,
  originSlug,
  year,
}: {
  country: CountryLite;
  originSlug: string;
  year: number;
}) {
  const origin = findStudyOrigin(originSlug);
  const local = getStudyOriginLocalization(originSlug, country.slug);
  if (!origin || !local) return null;

  const unis = getUniversitiesByCountrySlug(country.slug);
  const scholarshipLinks = destScholarshipLinks(country.slug);

  const splitList = (v: string | null) =>
    (v ?? "").split(/[;,/]/).map((s) => s.trim()).filter(Boolean);
  const bodies = Array.from(
    new Set(
      unis
        .map((u) => u.accreditationBody)
        .filter((b): b is string => Boolean(b))
        .map((b) => b.split(/[,—-]/)[0].trim()),
    ),
  );
  const withScholarships = unis.filter((u) => u.scholarshipsAvailable).length;
  const withEnglishNote = unis.filter((u) => u.englishTestNote).length;
  const languages = Array.from(new Set(unis.flatMap((u) => splitList(u.primaryLanguage))));
  const subjects = getSubjectsForCountry(country.slug);

  const url = `${SITE_URL}/study/${country.slug}/from-${origin.slug}`;
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "AlmiStudy", item: SITE_URL },
      { "@type": "ListItem", position: 3, name: country.name, item: `${SITE_URL}/universities/${country.slug}` },
      { "@type": "ListItem", position: 4, name: `From ${origin.name}`, item: url },
    ],
  };

  return (
    <main className="flex flex-col flex-1 px-6 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <div className="mx-auto w-full max-w-4xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-zinc-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/universities" className="hover:underline">AlmiStudy</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href={`/universities/${country.slug}`} className="hover:underline">{country.name}</Link></li>
            <li aria-hidden="true">›</li>
            <li><span className="font-medium">From {origin.name}</span></li>
          </ol>
        </nav>

        {/* Hero — origin-led, funding-first */}
        <header className="mb-8">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-coral mb-2">
            {origin.flag} {origin.name} → {country.name}
          </p>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-3">
            Study in {country.name} from {origin.name}: Scholarships &amp; Accredited Universities ({year})
          </h1>
          <p className="text-base sm:text-lg text-plum-soft leading-relaxed max-w-3xl">
            {local.subHook}
          </p>
        </header>

        {/* Origin-specific section — the localized angle + honesty */}
        <section aria-labelledby="origin-title" className="mb-8 rounded-lg border border-peach bg-cream-soft p-5 sm:p-6">
          <h2 id="origin-title" className="text-lg font-semibold tracking-tight mb-3">
            {local.heading}
          </h2>
          {local.paras.map((p) => (
            <p key={p} className="text-sm sm:text-base text-plum-soft leading-relaxed mb-3 max-w-3xl">
              {p}
            </p>
          ))}
          <ul className="space-y-2.5 mb-4">
            {local.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm sm:text-base text-plum-soft leading-relaxed">
                <span aria-hidden className="mt-1 text-coral">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-md border border-coral/30 bg-cream p-4">
            <p className="text-sm text-plum leading-relaxed">
              <span className="font-semibold">Honest note:</span> {local.callout}
            </p>
          </div>
          {scholarshipLinks.length > 0 ? (
            <p className="text-sm text-plum-soft mt-3">
              Official scholarship sources:{" "}
              {scholarshipLinks.map((l, i) => (
                <span key={l.url}>
                  {i > 0 ? " · " : ""}
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-coral underline hover:no-underline">
                    {l.label}
                  </a>
                </span>
              ))}
            </p>
          ) : null}
        </section>

        {/* Real verified-uni snapshot for the destination — not thin */}
        {country.count > 0 ? (
          <section className="mb-8 rounded-lg border border-peach bg-cream p-5 sm:p-6" aria-labelledby="verified">
            <h2 id="verified" className="text-lg font-semibold tracking-tight mb-3">
              Accredited universities in {country.name} — verified, not advertised
            </h2>
            <p className="text-sm sm:text-base text-plum-soft leading-relaxed max-w-3xl mb-4">
              AlmiStudy lists{" "}
              <strong className="text-plum">
                {country.count.toLocaleString("en-US")} accredited{" "}
                {country.count === 1 ? "university" : "universities"} in {country.name}
              </strong>
              , each checked against its official national accrediting body
              {bodies.length > 0 ? ` (${bodies.slice(0, 4).join(", ")})` : ""} — with a registry link so you can verify it yourself.
              {withScholarships > 0 ? ` ${withScholarships} list scholarship information.` : ""}
              {withEnglishNote > 0 ? ` ${withEnglishNote} carry an English-requirement note.` : ""}
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href={`/universities/${country.slug}`}
                className="inline-block rounded-md border border-peach bg-cream-soft px-4 py-2 text-plum hover:bg-cream transition-colors"
              >
                See all {country.count.toLocaleString("en-US")} {country.name} universities →
              </Link>
            </div>
          </section>
        ) : null}

        {/* Subject quick links for this destination */}
        {subjects.length > 0 ? (
          <section className="mb-8" aria-labelledby="subjects">
            <h2 id="subjects" className="text-lg font-semibold tracking-tight mb-3">
              Browse {country.name} study by subject
            </h2>
            <ul className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <li key={s}>
                  <Link
                    href={`/study/${country.slug}/${s}`}
                    className="inline-block px-3 py-1.5 rounded-full border border-peach bg-cream hover:bg-cream-soft text-sm text-plum transition-colors"
                  >
                    {SUBJECT_NAMES[s]}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Cross-product — localized to the origin where it helps */}
        <section aria-label="Other AlmiWorld products" className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm mb-10">
          <a
            href={`https://almicv.almiworld.com/cv-guide/${country.slug}/from-${origin.slug}`}
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 transition-colors"
          >
            <div className="font-semibold mb-1">Build a {country.name} CV from {origin.name} →</div>
            <div className="text-zinc-600">AlmiCV — localized for applicants from {origin.name}.</div>
          </a>
          <a
            href={`https://almijob.almiworld.com/jobs/${country.slug}/from-${origin.slug}`}
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 transition-colors"
          >
            <div className="font-semibold mb-1">Work-after-study jobs in {country.name} →</div>
            <div className="text-zinc-600">AlmiJob — visa-sponsorship roles, from {origin.name}.</div>
          </a>
          <a
            href={`https://almisalary.almiworld.com/salary/${country.slug}`}
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 transition-colors"
          >
            <div className="font-semibold mb-1">What do graduates earn in {country.name}? →</div>
            <div className="text-zinc-600">AlmiSalary — honest ranges, native currency.</div>
          </a>
        </section>

        {/* Disclaimer — verified accreditation, not an agent */}
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed mb-2">
          We list institutions whose accreditation we have verified against a recognized national or international accrediting body. Listing does not vouch for any specific program&apos;s recognition, scholarship outcome, or admissions decision.
        </p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed mb-10">
          AlmiStudy takes no commission and is not an agent — confirm scholarships, fees and visa rules on the official source before you rely on them.
        </p>
      </div>
    </main>
  );
}
