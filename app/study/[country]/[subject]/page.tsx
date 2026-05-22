import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCountriesForSubject,
  getCountryBySlug,
  getSubjectsForCountry,
  getUniversitiesByCountrySubject,
} from "@/lib/page-relations";
import {
  SUBJECT_NAMES,
  SUBJECT_ORDER,
  type SubjectSlug,
} from "@/lib/subject-mapper";

export const revalidate = 86400;
export const dynamicParams = true;

const SITE_URL = "https://almistudy.almiworld.com";

type Params = { country: string; subject: string };

function isSubjectSlug(s: string): s is SubjectSlug {
  return (SUBJECT_ORDER as readonly string[]).includes(s);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { country, subject } = await params;
  if (!isSubjectSlug(subject)) return {};
  const c = getCountryBySlug(country);
  if (!c) return {};
  const subjectName = SUBJECT_NAMES[subject];
  const unis = getUniversitiesByCountrySubject(country, subject);
  const url = `${SITE_URL}/study/${country}/${subject}`;
  const title = `${subjectName} Universities in ${c.name} | AlmiStudy`;
  const description = unis
    ? `${unis.length} accredited ${unis.length === 1 ? "university" : "universities"} in ${c.name} teaching ${subjectName}. Verified against national accreditation registries. AlmiStudy.`
    : `AlmiStudy hasn't yet verified ${subjectName} programs in ${c.name}. Browse ${subjectName} worldwide or other ${c.name} subjects.`;
  return {
    title: title.length <= 60 ? title : `${subjectName} in ${c.name} | AlmiStudy`,
    description: description.length > 160 ? description.slice(0, 157) + "…" : description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: "AlmiStudy" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function L4SubjectInCountryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { country, subject } = await params;
  if (!isSubjectSlug(subject)) notFound();
  const c = getCountryBySlug(country);
  if (!c) notFound();

  const subjectName = SUBJECT_NAMES[subject];
  const unis = getUniversitiesByCountrySubject(country, subject);
  const url = `${SITE_URL}/study/${country}/${subject}`;

  // Sister subjects in this country (excluding current)
  const siblingSubjects = getSubjectsForCountry(country).filter((s) => s !== subject);
  // Sister countries that have this subject (peers — top 8)
  const siblingCountries = getCountriesForSubject(subject)
    .filter((cc) => cc.slug !== country)
    .slice(0, 8);

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "AlmiStudy", item: SITE_URL },
      { "@type": "ListItem", position: 3, name: c.name, item: `${SITE_URL}/universities/${country}` },
      { "@type": "ListItem", position: 4, name: subjectName, item: url },
    ],
  };

  const itemList = unis
    ? {
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
            url: `${SITE_URL}/university/${u.slug}`,
            address: {
              "@type": "PostalAddress",
              addressLocality: u.city,
              addressCountry: u.country.iso2,
            },
          },
        })),
      }
    : null;

  return (
    <main className="flex flex-col flex-1 px-6 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      {itemList ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      ) : null}
      <div className="mx-auto w-full max-w-4xl">
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-zinc-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/universities" className="hover:underline">AlmiStudy</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href={`/universities/${country}`} className="hover:underline">{c.name}</Link></li>
            <li aria-hidden="true">›</li>
            <li><span className="font-medium">{subjectName}</span></li>
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-3">
            Universities offering {subjectName} in {c.name}
          </h1>
          {unis ? (
            <p className="text-base sm:text-lg text-plum-soft leading-relaxed max-w-3xl">
              {unis.length} accredited {unis.length === 1 ? "institution" : "institutions"} in {c.name} teach {subjectName}, verified by AlmiStudy against national accreditation registries.
            </p>
          ) : (
            <p className="text-base sm:text-lg text-plum-soft leading-relaxed max-w-3xl">
              We haven&apos;t verified any {subjectName} programs in {c.name} yet.
            </p>
          )}
        </header>

        {unis ? (
          <section className="mb-10" aria-labelledby="unis-list">
            <h2 id="unis-list" className="sr-only">Universities</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {unis.map((u) => (
                <li key={u.slug}>
                  <Link
                    href={`/study/${country}/${subject}/${u.slug}`}
                    className="block rounded-md border border-peach bg-cream p-4 hover:bg-cream-soft transition-colors"
                  >
                    <p className="text-plum font-medium text-sm">{u.name}</p>
                    <p className="text-plum-soft text-xs mt-1">
                      {u.city}
                      {u.accreditationBody ? ` · ${u.accreditationBody.split(/[,—-]/)[0].trim()}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="mb-10 rounded-md border border-peach bg-cream-soft p-6" aria-labelledby="empty-state">
            <h2 id="empty-state" className="text-base font-medium mb-2">
              No verified {subjectName} universities in {c.name} yet
            </h2>
            <p className="text-sm text-plum-soft leading-relaxed max-w-3xl mb-3">
              AlmiStudy adds institutions as accreditation is verified. We list a university only after confirming it against a recognized national accreditation body — that work is in progress for {c.name} × {subjectName}.
            </p>
            <p className="text-sm text-plum-soft leading-relaxed">
              In the meantime:{" "}
              <Link href={`/subjects/${subject}`} className="text-coral underline hover:no-underline">
                Browse {subjectName} worldwide →
              </Link>{" "}
              or{" "}
              <Link href={`/universities/${country}`} className="text-coral underline hover:no-underline">
                explore other subjects in {c.name} →
              </Link>
            </p>
          </section>
        )}

        {siblingSubjects.length > 0 ? (
          <section className="mb-8" aria-labelledby="sibling-subjects">
            <h2 id="sibling-subjects" className="text-lg font-semibold tracking-tight mb-3">
              Other subjects in {c.name}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {siblingSubjects.map((s) => (
                <li key={s}>
                  <Link
                    href={`/study/${country}/${s}`}
                    className="inline-block px-3 py-1.5 rounded-full border border-peach bg-cream hover:bg-cream-soft text-sm text-plum transition-colors"
                  >
                    {SUBJECT_NAMES[s]}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {siblingCountries.length > 0 ? (
          <section className="mb-8" aria-labelledby="sibling-countries">
            <h2 id="sibling-countries" className="text-lg font-semibold tracking-tight mb-3">
              {subjectName} in other countries
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {siblingCountries.map((cc) => (
                <li key={cc.slug}>
                  <Link
                    href={`/study/${cc.slug}/${subject}`}
                    className="block rounded-md border border-peach bg-cream p-3 hover:bg-cream-soft transition-colors text-sm"
                  >
                    {cc.name}
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
            href="https://almicv.almiworld.com"
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 transition-colors"
          >
            <div className="font-semibold mb-1">Build your CV →</div>
            <div className="text-zinc-600">Free templates, every country.</div>
          </a>
          <a
            href={`https://almijob.almiworld.com/jobs/${country}`}
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 transition-colors"
          >
            <div className="font-semibold mb-1">Find jobs in {c.name} →</div>
            <div className="text-zinc-600">One CV, every site.</div>
          </a>
        </section>

        <p className="text-xs text-zinc-600 max-w-3xl leading-relaxed mb-6">
          We list institutions whose accreditation we have verified against a recognized national or international accrediting body. Listing does not vouch for any specific program&apos;s recognition by destination-country regulators or individual admissions outcomes.
        </p>
      </div>
    </main>
  );
}
