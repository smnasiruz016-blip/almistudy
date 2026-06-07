import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCountryBySlug,
  getUniversitiesByCountrySubject,
  type University,
} from "@/lib/page-relations";
import {
  getCanonicalSubjects,
  SUBJECT_NAMES,
  SUBJECT_ORDER,
  type SubjectSlug,
} from "@/lib/subject-mapper";

export const revalidate = 86400;
export const dynamicParams = true;

const SITE_URL = "https://almistudy.almiworld.com";

type Params = { country: string; subject: string; uni: string };

function isSubjectSlug(s: string): s is SubjectSlug {
  return (SUBJECT_ORDER as readonly string[]).includes(s);
}

// Bare title — the root layout template appends " · AlmiStudy" once.
function buildTitle(u: University, subjectName: string, countryName: string, year: number): string {
  const candidate = `Study ${subjectName} at ${u.name} in ${countryName} (${year})`;
  if (candidate.length <= 60) return candidate;
  const shortened = `${subjectName} at ${u.name.slice(0, 30)}… (${year})`;
  return shortened.length <= 60 ? shortened : `${subjectName} (${year})`;
}

function buildDescription(u: University, subjectName: string, countryName: string, peerCount: number): string {
  const accred = u.accreditationBody ?? "national accreditation";
  const verified = u.accreditationBodyVerifiedDate ?? u.lastVerified;
  const base = `${u.name} offers ${subjectName} in ${u.city}, ${countryName}. Verified against ${accred}${verified ? ` on ${verified}` : ""}. One of ${peerCount.toLocaleString("en-US")} accredited ${peerCount === 1 ? "institution" : "institutions"} teaching ${subjectName} in ${countryName}.`;
  if (base.length > 160) return base.slice(0, 157) + "…";
  return base;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { country, subject, uni: uniSlug } = await params;
  if (!isSubjectSlug(subject)) return {};
  const c = getCountryBySlug(country);
  if (!c) return {};
  const unis = getUniversitiesByCountrySubject(country, subject);
  if (!unis) return {};
  const uni = unis.find((u) => u.slug === uniSlug);
  if (!uni) return {};
  const subjectName = SUBJECT_NAMES[subject];
  const url = `${SITE_URL}/study/${country}/${subject}/${uniSlug}`;
  // SEO consolidation: this 4th-layer page is a subject-scoped preview of the
  // full /university/[slug] profile. To avoid 23k+ thin near-duplicates eating
  // crawl budget, it canonicalises to the richer university page (and is kept
  // out of the sitemap). The page still renders for users who land here.
  const uniUrl = `${SITE_URL}/university/${uniSlug}`;
  const title = buildTitle(uni, subjectName, c.name, new Date().getFullYear());
  const description = buildDescription(uni, subjectName, c.name, unis.length);
  return {
    title,
    description,
    alternates: { canonical: uniUrl },
    openGraph: { type: "website", url: uniUrl, title, description, siteName: "AlmiStudy" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function StructuredData({
  u,
  subjectName,
  countryName,
  countrySlug,
  subjectSlug,
  uniSlug,
}: {
  u: University;
  subjectName: string;
  countryName: string;
  countrySlug: string;
  subjectSlug: SubjectSlug;
  uniSlug: string;
}) {
  const url = `${SITE_URL}/study/${countrySlug}/${subjectSlug}/${uniSlug}`;
  const program = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    name: `${subjectName} at ${u.name}`,
    url,
    educationalProgramMode: "full-time",
    provider: {
      "@type": "CollegeOrUniversity",
      name: u.name,
      url: u.officialWebsite ?? `${SITE_URL}/university/${u.slug}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: u.city,
        addressCountry: u.country.iso2,
      },
    },
    occupationalCategory: subjectName,
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "AlmiStudy", item: SITE_URL },
      { "@type": "ListItem", position: 3, name: countryName, item: `${SITE_URL}/universities/${countrySlug}` },
      { "@type": "ListItem", position: 4, name: subjectName, item: `${SITE_URL}/study/${countrySlug}/${subjectSlug}` },
      { "@type": "ListItem", position: 5, name: u.name, item: url },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(program) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
    </>
  );
}

export default async function L4UniPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { country, subject, uni: uniSlug } = await params;
  if (!isSubjectSlug(subject)) notFound();
  const c = getCountryBySlug(country);
  if (!c) notFound();
  const unis = getUniversitiesByCountrySubject(country, subject);
  if (!unis) notFound();
  const uni = unis.find((u) => u.slug === uniSlug);
  if (!uni) notFound();

  const subjectName = SUBJECT_NAMES[subject];
  const peers = unis.filter((u) => u.slug !== uniSlug).slice(0, 8);
  const otherSubjects = getCanonicalSubjects(uni).filter((s) => s !== subject);

  return (
    <main className="flex flex-col flex-1 px-6 py-10 sm:py-14">
      <StructuredData
        u={uni}
        subjectName={subjectName}
        countryName={c.name}
        countrySlug={country}
        subjectSlug={subject}
        uniSlug={uniSlug}
      />
      <div className="mx-auto w-full max-w-4xl">
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-zinc-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/universities" className="hover:underline">AlmiStudy</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href={`/universities/${country}`} className="hover:underline">{c.name}</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href={`/study/${country}/${subject}`} className="hover:underline">{subjectName}</Link></li>
            <li aria-hidden="true">›</li>
            <li><span className="font-medium">{uni.name}</span></li>
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-3">
            Study {subjectName} at {uni.name}
          </h1>
          <p className="text-base sm:text-lg text-plum-soft leading-relaxed mb-3 max-w-3xl">
            {uni.name} offers {subjectName} as part of its accredited programs in {uni.city}, {c.name}.
            {" "}Verified against {uni.accreditationBody ?? "the national accreditation registry"}
            {uni.accreditationBodyVerifiedDate ? ` on ${uni.accreditationBodyVerifiedDate}` : ""}.
            {" "}AlmiStudy lists this combination as one of {unis.length}{" "}
            {unis.length === 1 ? "institution" : "institutions"} teaching {subjectName} in {c.name}.
          </p>
        </header>

        <section className="mb-8" aria-labelledby="uni-card-title">
          <h2 id="uni-card-title" className="text-lg font-semibold tracking-tight mb-3">University detail</h2>
          <Link
            href={`/university/${uni.slug}`}
            className="block rounded-lg border border-peach bg-cream p-5 sm:p-6 hover:bg-cream-soft transition-colors"
          >
            <p className="font-semibold mb-1">{uni.name}</p>
            <p className="text-sm text-plum-soft">{uni.city} · {c.name}{uni.controlType ? ` · ${uni.controlType}` : ""}</p>
            {uni.accreditationBody ? (
              <p className="text-xs text-plum-soft mt-2">Accreditation: {uni.accreditationBody}</p>
            ) : null}
            <p className="text-sm text-coral mt-3">Full university profile →</p>
          </Link>
        </section>

        {peers.length > 0 ? (
          <section className="mb-8" aria-labelledby="peers-title">
            <h2 id="peers-title" className="text-lg font-semibold tracking-tight mb-3">
              Other universities offering {subjectName} in {c.name}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {peers.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/study/${country}/${subject}/${p.slug}`}
                    className="block rounded-md border border-peach bg-cream p-4 hover:bg-cream-soft transition-colors"
                  >
                    <p className="text-plum font-medium text-sm">{p.name}</p>
                    <p className="text-plum-soft text-xs mt-1">{p.city}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm">
              <Link href={`/study/${country}/${subject}`} className="underline hover:no-underline">
                All {subjectName} universities in {c.name} →
              </Link>
            </p>
          </section>
        ) : null}

        {otherSubjects.length > 0 ? (
          <section className="mb-8" aria-labelledby="other-subjects-title">
            <h2 id="other-subjects-title" className="text-lg font-semibold tracking-tight mb-3">
              Other subjects at {uni.name}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {otherSubjects.map((s) => (
                <li key={s}>
                  <Link
                    href={`/study/${country}/${s}/${uni.slug}`}
                    className="inline-block px-3 py-1.5 rounded-full border border-peach bg-cream hover:bg-cream-soft text-sm text-plum transition-colors"
                  >
                    {SUBJECT_NAMES[s]}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section
          aria-label="Other AlmiWorld products"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm mb-10"
        >
          <a
            href={`https://almisalary.almiworld.com/salary/${country}`}
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 transition-colors"
          >
            <div className="font-semibold mb-1">See {c.name} salary data →</div>
            <div className="text-zinc-600">What graduates earn, honest ranges.</div>
          </a>
          <a
            href={`https://almicv.almiworld.com/cv-guide/${country}`}
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 transition-colors"
          >
            <div className="font-semibold mb-1">Build a {c.name}-Ready CV →</div>
            <div className="text-zinc-600">AlmiCV — guide tailored to {c.name} conventions.</div>
          </a>
          <a
            href={`https://almijob.almiworld.com/jobs/${country}`}
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 transition-colors"
          >
            <div className="font-semibold mb-1">Find jobs in {c.name} →</div>
            <div className="text-zinc-600">One CV, every site.</div>
          </a>
        </section>

        <p className="text-xs text-zinc-600 max-w-3xl leading-relaxed mb-2">
          We list institutions whose accreditation we have verified against a recognized national or international accrediting body. Listing does not vouch for any specific program&apos;s recognition by destination-country regulators, individual admissions outcomes, or post-graduation credential transferability.
        </p>
        <p className="text-xs text-zinc-600 max-w-3xl leading-relaxed mb-6">
          When you click through to a university&apos;s website, you are interacting with that institution&apos;s admissions process under their terms.
        </p>
      </div>
    </main>
  );
}
