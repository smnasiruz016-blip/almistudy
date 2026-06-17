import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllCountries,
  getCountryBySlug,
  getUniversitiesByCountrySlug
} from "@/lib/page-relations";
import { indefiniteArticle, STUDY_ORIGINS, isStudyOriginIndexable } from "@/lib/study-origin-localization";

const SITE_URL = "https://almistudy.almiworld.com";
const PRINCIPLES_URL =
  "https://github.com/smnasiruz016-blip/almistudy/blob/main/docs/AlmiStudy_Product_Principles.md";

export function generateStaticParams() {
  return getAllCountries().map((c) => ({ country: c.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const c = getCountryBySlug(country);
  if (!c) return {};
  const url = `${SITE_URL}/universities/${c.slug}`;
  const year = new Date().getFullYear();
  // Bare title — the root layout template appends " · AlmiStudy" once.
  // "Courses & Tuition" matches what the page actually shows (subjects +
  // tuition notes); we don't claim "Admissions" data the page doesn't have.
  const title = `Universities in ${c.name} ${year} — Courses & Tuition`;
  const description = `All ${c.count.toLocaleString("en-US")} accredited ${c.count === 1 ? "university" : "universities"} in ${c.name}, each verified against a recognized national accrediting body — with subjects and registry links.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "AlmiStudy"
    },
    twitter: { card: "summary_large_image", title, description }
  };
}

export default async function CountryPage({
  params
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: slug } = await params;
  const country = getCountryBySlug(slug);
  if (!country) notFound();

  const unis = getUniversitiesByCountrySlug(slug);

  // Real aggregates derived only from the verified set — no fabricated numbers.
  const splitList = (v: string | null) =>
    (v ?? "").split(/[;,/]/).map((s) => s.trim()).filter(Boolean);
  const agg = {
    pub: unis.filter((u) => u.controlType?.toLowerCase().includes("public")).length,
    priv: unis.filter((u) => u.controlType?.toLowerCase().includes("private")).length,
    cities: Array.from(new Set(unis.map((u) => u.city).filter(Boolean))),
    languages: Array.from(new Set(unis.flatMap((u) => splitList(u.primaryLanguage)))),
    subjects: Array.from(new Set(unis.flatMap((u) => u.subjects ?? []))),
    verifiedLast12mo: unis.filter((u) => {
      const d = u.accreditationBodyVerifiedDate ?? u.lastVerified;
      if (!d) return false;
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return new Date(d) >= oneYearAgo;
    }).length,
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListUnordered",
    numberOfItems: unis.length,
    itemListElement: unis.map((u, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CollegeOrUniversity",
        name: u.name,
        url: u.officialWebsite ?? undefined,
        address: {
          "@type": "PostalAddress",
          addressLocality: u.city,
          addressCountry: country.iso2
        }
      }
    }))
  };

  return (
    <main className="flex flex-col flex-1 px-6 py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="mx-auto w-full max-w-4xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-zinc-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <Link href="/universities" className="hover:underline">
                Universities
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{country.name}</span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-3">
            Universities in {country.name}
          </h1>
          <p className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3 max-w-3xl">
            Verified-accreditation universities in {country.name}. Each entry links to its national accrediting body so you can verify independently.
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            We&apos;ve reviewed {unis.length}{" "}
            {unis.length === 1 ? "university" : "universities"} for {country.name}. We&apos;re working on expanding coverage.
          </p>
        </header>

        {/* Country snapshot — real aggregates from the verified set */}
        {unis.length > 0 ? (
          <section
            className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
            aria-label={`${country.name} coverage at a glance`}
          >
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="text-2xl font-semibold tracking-tight">{unis.length.toLocaleString("en-US")}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Accredited universities</div>
            </div>
            {agg.pub + agg.priv > 0 ? (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="text-2xl font-semibold tracking-tight">{agg.pub} · {agg.priv}</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Public · private</div>
              </div>
            ) : null}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="text-2xl font-semibold tracking-tight">{agg.cities.length.toLocaleString("en-US")}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Cities</div>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <div className="text-2xl font-semibold tracking-tight">{agg.subjects.length.toLocaleString("en-US")}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Subject areas</div>
            </div>
            {agg.languages.length > 0 ? (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 col-span-2 sm:col-span-3">
                <div className="text-sm font-medium">{agg.languages.slice(0, 6).join(", ")}</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Languages of instruction on record</div>
              </div>
            ) : null}
            {agg.verifiedLast12mo > 0 ? (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="text-2xl font-semibold tracking-tight">{agg.verifiedLast12mo.toLocaleString("en-US")}</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Verified in last 12 mo</div>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* University list */}
        <section aria-label={`Universities in ${country.name}`} className="space-y-4 sm:space-y-5 mb-10">
          {unis.map((u) => (
            <article
              key={u.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 bg-white dark:bg-zinc-950"
            >
              <header className="mb-3">
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight mb-1">
                  {u.officialWebsite ? (
                    <a
                      href={u.officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="hover:underline"
                    >
                      {u.name}
                    </a>
                  ) : (
                    u.name
                  )}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {u.city}
                  {u.controlType ? ` · ${u.controlType}` : ""}
                  {u.primaryLanguage ? ` · ${u.primaryLanguage}` : ""}
                </p>
              </header>

              {u.subjects.length > 0 ? (
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
                  <span className="text-xs uppercase tracking-wide text-zinc-500 mr-2">
                    Subjects
                  </span>
                  {u.subjects.join(" · ")}
                </p>
              ) : null}

              <dl className="text-sm text-zinc-700 dark:text-zinc-300 grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-4 gap-y-2 mb-3">
                {u.accreditationBody && u.accreditationRegistryUrl ? (
                  <>
                    <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">
                      Accreditation
                    </dt>
                    <dd>
                      {u.accreditationBody}.{" "}
                      <a
                        href={u.accreditationRegistryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        Verify on the public registry
                      </a>
                      {u.accreditationBodyVerifiedDate
                        ? ` · last verified ${u.accreditationBodyVerifiedDate}`
                        : ""}
                      .
                    </dd>
                  </>
                ) : null}
                {u.englishTestNote ? (
                  <>
                    <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">
                      English
                    </dt>
                    <dd>{u.englishTestNote}</dd>
                  </>
                ) : null}
                {u.tuitionNote ? (
                  <>
                    <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">
                      Tuition
                    </dt>
                    <dd>{u.tuitionNote}</dd>
                  </>
                ) : null}
                {u.scholarshipsAvailable ? (
                  <>
                    <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">
                      Scholarships
                    </dt>
                    <dd>{u.scholarshipsAvailable}</dd>
                  </>
                ) : null}
                {u.contactUrl ? (
                  <>
                    <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">
                      Contact
                    </dt>
                    <dd>
                      <a
                        href={u.contactUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        University contact page
                      </a>
                    </dd>
                  </>
                ) : null}
                {u.admissionsEmail ? (
                  <>
                    <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">
                      Email
                    </dt>
                    <dd>
                      <a
                        href={`mailto:${u.admissionsEmail}`}
                        className="underline hover:no-underline"
                      >
                        {u.admissionsEmail}
                      </a>
                    </dd>
                  </>
                ) : null}
                {u.mainPhone ? (
                  <>
                    <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">
                      Phone
                    </dt>
                    <dd>
                      <a
                        href={`tel:${u.mainPhone}`}
                        className="underline hover:no-underline"
                      >
                        {u.mainPhone}
                      </a>
                    </dd>
                  </>
                ) : null}
                {u.deadlinesUrl ? (
                  <>
                    <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">
                      Deadlines
                    </dt>
                    <dd>
                      <a
                        href={u.deadlinesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                      >
                        View official deadlines
                      </a>
                      {u.deadlinesNote ? (
                        <span className="block text-xs text-zinc-500 mt-1 italic">
                          {u.deadlinesNote}
                        </span>
                      ) : null}
                    </dd>
                  </>
                ) : null}
              </dl>

              {u.studentNotes ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 italic leading-snug mb-3">
                  {u.studentNotes}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3 text-xs">
                {u.officialWebsite ? (
                  <a
                    href={u.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="underline hover:no-underline"
                  >
                    Official website →
                  </a>
                ) : null}
                {u.admissionsUrl ? (
                  <a
                    href={u.admissionsUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="underline hover:no-underline"
                  >
                    Admissions →
                  </a>
                ) : null}
                {u.scholarshipsUrl ? (
                  <a
                    href={u.scholarshipsUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="underline hover:no-underline"
                  >
                    Scholarships info →
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        {/* §3.1 + §3.5 disclaimers */}
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed mb-2">
          We list institutions whose accreditation we have verified against a recognized national or international accrediting body. Listing does not vouch for any specific program&apos;s recognition by destination-country regulators, individual admissions outcomes, or post-graduation credential transferability.
        </p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed mb-10">
          When you click through to a university&apos;s website, you are interacting with that institution&apos;s admissions process under their terms. Our responsibility ends at pointing you to a verified-accreditation institution.
        </p>

        {/* Origin down-links — push hub authority into the from-[origin] pages */}
        {(() => {
          const originLinks = STUDY_ORIGINS.filter(
            (o) => country.count > 0 && isStudyOriginIndexable(country.slug, o.slug),
          ).slice(0, 10);
          if (originLinks.length === 0) return null;
          return (
            <section className="mb-10" aria-labelledby="origin-links-title">
              <h2 id="origin-links-title" className="text-lg font-semibold tracking-tight mb-3">
                Studying from a specific country?
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {originLinks.map((o) => (
                  <li key={o.slug}>
                    <Link
                      href={`/study/${country.slug}/from-${o.slug}`}
                      className="block rounded-md border border-peach bg-cream p-3 hover:bg-cream-soft transition-colors text-sm"
                    >
                      <span aria-hidden="true">{o.flag} </span>Study in {country.name} from {o.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })()}

        {/* Cross-product CTAs */}
        <section
          aria-label="Other AlmiWorld products"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm mb-10"
        >
          <a
            href={`https://almicv.almiworld.com/cv-guide/${country.slug}`}
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            <div className="font-semibold mb-1">Build {indefiniteArticle(country.name)} {country.name}-Ready CV →</div>
            <div className="text-zinc-600 dark:text-zinc-400">
              AlmiCV — guide tailored to {country.name} conventions.
            </div>
          </a>
          <a
            href={`https://almisalary.almiworld.com/salary/${country.slug}`}
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            <div className="font-semibold mb-1">Wondering what graduates earn?</div>
            <div className="text-zinc-600 dark:text-zinc-400">
              Check {country.name} salary ranges with AlmiSalary →
            </div>
          </a>
        </section>

        {/* Footer */}
        <footer className="text-xs text-zinc-500 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 pt-4 leading-relaxed">
          <p className="mb-1">
            Listings reviewed against{" "}
            <a
              href={PRINCIPLES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              AlmiStudy product principles
            </a>{" "}
            (v1.0). Per §8.1, every listing is re-verified at least annually.
          </p>
        </footer>
      </div>
    </main>
  );
}
