import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getUniversitiesByCountrySlug,
  getUniversityBySlug,
  type University,
} from "@/lib/page-relations";
import { getCanonicalSubjects, SUBJECT_NAMES } from "@/lib/subject-mapper";
import { indefiniteArticle } from "@/lib/study-origin-localization";

export const revalidate = 86400;
export const dynamicParams = true;

const SITE_URL = "https://almistudy.almiworld.com";
const PRINCIPLES_URL =
  "https://github.com/smnasiruz016-blip/almistudy/blob/main/docs/AlmiStudy_Product_Principles.md";

type Params = { slug: string };

// Bare title — the root layout template appends " · AlmiStudy" once.
// Name fits inside 60 chars alongside the " (YEAR)" freshness suffix.
function truncateTitle(name: string, year: number): string {
  const suffix = ` (${year})`;
  const max = 60;
  const room = max - suffix.length;
  if (name.length <= room) return name + suffix;
  return name.slice(0, room - 1).trimEnd() + "…" + suffix;
}

function buildDescription(u: University): string {
  const accred = u.accreditationBody ?? "national accrediting body";
  const verified = u.accreditationBodyVerifiedDate ?? u.lastVerified;
  const base = `${u.name} in ${u.city}, ${u.country.name}: accredited by ${accred}. Subjects, registry link${
    verified ? `, last verified ${verified}` : ""
  }.`;
  if (base.length > 160) return base.slice(0, 157) + "…";
  return base;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const u = getUniversityBySlug(slug);
  if (!u) return {};
  const url = `${SITE_URL}/university/${u.slug}`;
  const title = truncateTitle(u.name, new Date().getFullYear());
  const description = buildDescription(u);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: "AlmiStudy" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function Intro({ u, canonicalSubjects }: { u: University; canonicalSubjects: ReturnType<typeof getCanonicalSubjects> }) {
  const accred = u.accreditationBody ?? "a national accrediting body";
  const lang = u.primaryLanguage ? `Primary language: ${u.primaryLanguage}.` : "";
  const subjectCount = canonicalSubjects.length;
  const control = u.controlType ? `${u.controlType} ` : "";
  return (
    <p className="text-base sm:text-lg text-plum-soft leading-relaxed mb-3 max-w-3xl">
      {u.name} is a {control}institution in {u.city}, {u.country.name}, accredited by{" "}
      {accred}. {lang} AlmiStudy lists {subjectCount}{" "}
      {subjectCount === 1 ? "canonical subject area" : "canonical subject areas"}, all
      verified against {u.accreditationBody ?? "the national registry"}.
    </p>
  );
}

function QuickFacts({ u }: { u: University }) {
  return (
    <dl className="text-sm text-zinc-700 dark:text-zinc-300 grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-4 gap-y-2 mb-6">
      <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">Country</dt>
      <dd>{u.country.name} ({u.country.iso2})</dd>
      <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">City</dt>
      <dd>{u.city}</dd>
      {u.controlType ? (
        <>
          <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">Control</dt>
          <dd>{u.controlType}</dd>
        </>
      ) : null}
      {u.primaryLanguage ? (
        <>
          <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">Language</dt>
          <dd>{u.primaryLanguage}</dd>
        </>
      ) : null}
      {u.accreditationBody ? (
        <>
          <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">Accreditation</dt>
          <dd>
            {u.accreditationBody}.{" "}
            {u.accreditationRegistryUrl ? (
              <a
                href={u.accreditationRegistryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                Verify on the public registry
              </a>
            ) : null}
            {u.accreditationBodyVerifiedDate
              ? ` · last verified ${u.accreditationBodyVerifiedDate}`
              : ""}
            .
          </dd>
        </>
      ) : null}
      {u.source ? (
        <>
          <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">Source</dt>
          <dd>
            {u.source.title ?? u.source.publisher ?? "Source on file"}
            {u.source.tier ? ` · tier: ${u.source.tier}` : ""}
          </dd>
        </>
      ) : null}
      {u.officialWebsite ? (
        <>
          <dt className="text-xs uppercase tracking-wide text-zinc-500 sm:pt-0.5">Website</dt>
          <dd>
            <a
              href={u.officialWebsite}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline hover:no-underline"
            >
              {u.officialWebsite}
            </a>
          </dd>
        </>
      ) : null}
    </dl>
  );
}

function CanonicalSubjects({ u }: { u: University }) {
  const canonical = getCanonicalSubjects(u);
  if (canonical.length === 0) return null;
  return (
    <section className="mb-8" aria-labelledby="subjects-canonical">
      <h2 id="subjects-canonical" className="text-lg font-semibold tracking-tight mb-3">
        Subjects offered
      </h2>
      <ul className="flex flex-wrap gap-2 mb-3">
        {canonical.map((s) => (
          <li key={s}>
            <Link
              href={`/study/${u.country.slug}/${s}/${u.slug}`}
              className="inline-block px-3 py-1.5 rounded-full border border-peach bg-cream hover:bg-cream-soft text-sm text-plum transition-colors"
            >
              {SUBJECT_NAMES[s]}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RawSubjects({ u }: { u: University }) {
  if (!u.subjects || u.subjects.length === 0) return null;
  return (
    <section className="mb-8" aria-labelledby="subjects-raw">
      <details className="text-sm text-plum-soft">
        <summary className="cursor-pointer font-medium text-plum">
          Show all {u.subjects.length} listed subjects (raw)
        </summary>
        <p className="mt-2 leading-relaxed">{u.subjects.join(" · ")}</p>
      </details>
    </section>
  );
}

function CrossProductCtas({ u }: { u: University }) {
  return (
    <section
      aria-label="Other AlmiWorld products"
      className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm mb-10"
    >
      <a
        href={`https://almisalary.almiworld.com/salary/${u.country.slug}`}
        className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
      >
        <div className="font-semibold mb-1">See {u.country.name} salary data →</div>
        <div className="text-zinc-600 dark:text-zinc-400">
          AlmiSalary — what graduates earn, honest ranges.
        </div>
      </a>
      <a
        href={`https://almicv.almiworld.com/cv-guide/${u.country.slug}`}
        className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
      >
        <div className="font-semibold mb-1">Build {indefiniteArticle(u.country.name)} {u.country.name}-Ready CV →</div>
        <div className="text-zinc-600 dark:text-zinc-400">
          AlmiCV — guide tailored to {u.country.name} conventions.
        </div>
      </a>
      <a
        href={`https://almijob.almiworld.com/jobs/${u.country.slug}`}
        className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
      >
        <div className="font-semibold mb-1">Find jobs in {u.country.name} →</div>
        <div className="text-zinc-600 dark:text-zinc-400">
          AlmiJob — one CV, every site.
        </div>
      </a>
    </section>
  );
}

function RelatedUniversities({ u }: { u: University }) {
  const peers = getUniversitiesByCountrySlug(u.country.slug)
    .filter((p) => p.slug !== u.slug)
    .slice(0, 6);
  if (peers.length === 0) return null;
  return (
    <section className="mb-10" aria-labelledby="related-unis">
      <h2 id="related-unis" className="text-lg font-semibold tracking-tight mb-3">
        Other universities in {u.country.name}
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {peers.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/university/${p.slug}`}
              className="block rounded-md border border-peach bg-cream p-4 hover:bg-cream-soft transition-colors"
            >
              <p className="text-plum font-medium text-sm">{p.name}</p>
              <p className="text-plum-soft text-xs mt-1">{p.city}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">
        <Link href={`/universities/${u.country.slug}`} className="underline hover:no-underline">
          All universities in {u.country.name} →
        </Link>
      </p>
    </section>
  );
}

function StructuredData({ u }: { u: University }) {
  const url = `${SITE_URL}/university/${u.slug}`;
  const college = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: u.name,
    url: u.officialWebsite ?? url,
    sameAs: url,
    address: {
      "@type": "PostalAddress",
      addressLocality: u.city,
      addressCountry: u.country.iso2,
    },
    ...(u.accreditationBody
      ? {
          accreditingBody: {
            "@type": "Organization",
            name: u.accreditationBody,
            url: u.accreditationRegistryUrl ?? undefined,
          },
        }
      : {}),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "AlmiStudy", item: SITE_URL },
      { "@type": "ListItem", position: 3, name: u.country.name, item: `${SITE_URL}/universities/${u.country.slug}` },
      { "@type": "ListItem", position: 4, name: u.name, item: url },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(college) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
    </>
  );
}

export default async function UniversityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const u = getUniversityBySlug(slug);
  if (!u) notFound();

  const canonical = getCanonicalSubjects(u);

  return (
    <main className="flex flex-col flex-1 px-6 py-10 sm:py-14">
      <StructuredData u={u} />
      <div className="mx-auto w-full max-w-4xl">
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-zinc-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:underline">Home</Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <Link href="/universities" className="hover:underline">AlmiStudy</Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <Link href={`/universities/${u.country.slug}`} className="hover:underline">{u.country.name}</Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{u.name}</span>
            </li>
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-3">{u.name}</h1>
          <Intro u={u} canonicalSubjects={canonical} />
        </header>

        <QuickFacts u={u} />
        <CanonicalSubjects u={u} />
        <RawSubjects u={u} />

        {u.studentNotes ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 italic leading-snug mb-8">
            {u.studentNotes}
          </p>
        ) : null}

        <RelatedUniversities u={u} />
        <CrossProductCtas u={u} />

        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed mb-2">
          We list institutions whose accreditation we have verified against a recognized national or international accrediting body. Listing does not vouch for any specific program&apos;s recognition by destination-country regulators, individual admissions outcomes, or post-graduation credential transferability.
        </p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed mb-10">
          When you click through to a university&apos;s website, you are interacting with that institution&apos;s admissions process under their terms. Our responsibility ends at pointing you to a verified-accreditation institution.
        </p>

        <footer className="text-xs text-zinc-500 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 pt-4 leading-relaxed">
          <p className="mb-1">
            Listings reviewed against{" "}
            <a href={PRINCIPLES_URL} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
              AlmiStudy product principles
            </a>{" "}
            (v1.0). Per §8.1, every listing is re-verified at least annually.
          </p>
        </footer>
      </div>
    </main>
  );
}
