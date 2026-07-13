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
import { StudyOriginGuide } from "@/components/StudyOriginGuide";
import {
  StudyMasterHook,
  StudyMasterAntiAgent,
  StudyMasterShamool,
  STUDY_MASTER_FAQ,
} from "@/components/study-master";
import {
  findStudyOrigin,
  isStudyOriginIndexable,
} from "@/lib/study-origin-localization";

// Cache indefinitely (revalidate:Infinity). Page data is static in-repo JSON that
// only changes on redeploy (which cold-starts the ISR cache -- pages re-render on
// next hit); a timed TTL only produced byte-identical daily ISR re-writes (cost).
export const revalidate = false;
export const dynamicParams = true;

const SITE_URL = "https://almistudy.almiworld.com";

// The [subject] segment doubles as the origin segment when prefixed "from-"
// (e.g. /study/canada/from-bangladesh). No subject slug starts with "from-",
// so the dispatch is unambiguous — mirrors AlmiCV/AlmiJob origin nesting.
const FROM = "from-";

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

  // Origin × destination study guide — distinct, self-canonical + indexed.
  if (subject.startsWith(FROM)) {
    const originSlug = subject.slice(FROM.length);
    const c = getCountryBySlug(country);
    const origin = findStudyOrigin(originSlug);
    if (!c || c.count <= 0 || !origin || !isStudyOriginIndexable(c.slug, originSlug)) return {};
    const url = `${SITE_URL}/study/${c.slug}/from-${origin.slug}`;
    const year = new Date().getFullYear();
    // Bare title — the root layout template appends " · AlmiStudy" once.
    const title = `Study in ${c.name} from ${origin.name} — Scholarships & Universities (${year})`;
    const description = `Fully-funded scholarships and accredited universities in ${c.name} for students from ${origin.name} — verified accreditation, no agent, no commission. ${year}.`;
    return {
      title,
      description: description.length > 160 ? description.slice(0, 157) + "…" : description,
      alternates: { canonical: url },
      openGraph: { type: "website", url, title, description, siteName: "AlmiStudy" },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  if (!isSubjectSlug(subject)) return {};
  const c = getCountryBySlug(country);
  if (!c) return {};
  const subjectName = SUBJECT_NAMES[subject];
  const unis = getUniversitiesByCountrySubject(country, subject);
  const url = `${SITE_URL}/study/${country}/${subject}`;
  const year = new Date().getFullYear();
  // Bare title — the root layout template appends " · AlmiStudy" once.
  // Lead with the high-volume "study {subject} in {country}" search query.
  const title = `Study ${subjectName} in ${c.name} (${year})`;
  const description = unis
    ? `${unis.length.toLocaleString("en-US")} accredited ${unis.length === 1 ? "university" : "universities"} in ${c.name} teaching ${subjectName}, each verified against a recognized national accrediting body. No agent, no commission.`
    : `AlmiStudy hasn't yet verified ${subjectName} programs in ${c.name}. Browse ${subjectName} worldwide or other ${c.name} subjects.`;
  return {
    title: title.length <= 60 ? title : `Study ${subjectName} in ${c.name}`,
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

  // Origin × destination study guide (Tier 1).
  if (subject.startsWith(FROM)) {
    const originSlug = subject.slice(FROM.length);
    const oc = getCountryBySlug(country);
    if (!oc || oc.count <= 0 || !findStudyOrigin(originSlug) || !isStudyOriginIndexable(oc.slug, originSlug)) {
      notFound();
    }
    return <StudyOriginGuide country={oc} originSlug={originSlug} year={new Date().getFullYear()} />;
  }

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

  // Real, page-specific aggregates derived ONLY from the verified set —
  // no fabricated numbers. These values differ per (country, subject) page,
  // which is what gives each combo page genuinely unique content.
  const splitList = (v: string | null) =>
    (v ?? "").split(/[;,/]/).map((s) => s.trim()).filter(Boolean);
  const stats = unis
    ? {
        pub: unis.filter((u) => u.controlType?.toLowerCase().includes("public")).length,
        priv: unis.filter((u) => u.controlType?.toLowerCase().includes("private")).length,
        cities: Array.from(new Set(unis.map((u) => u.city).filter(Boolean))),
        languages: Array.from(new Set(unis.flatMap((u) => splitList(u.primaryLanguage)))),
        bodies: Array.from(
          new Set(
            unis
              .map((u) => u.accreditationBody)
              .filter((b): b is string => Boolean(b))
              .map((b) => b.split(/[,—-]/)[0].trim()),
          ),
        ),
        withScholarships: unis.filter((u) => u.scholarshipsAvailable).length,
        withEnglishNote: unis.filter((u) => u.englishTestNote).length,
      }
    : null;

  // FAQ — every answer is backed by the data above (visible on-page + schema).
  const faqs =
    unis && stats
      ? [
          {
            q: `How many accredited universities teach ${subjectName} in ${c.name}?`,
            a: `AlmiStudy lists ${unis.length.toLocaleString("en-US")} accredited ${unis.length === 1 ? "university" : "universities"} teaching ${subjectName} in ${c.name}, each verified against a recognized national accrediting body.`,
          },
          ...(stats.pub + stats.priv > 0
            ? [
                {
                  q: `Are ${subjectName} universities in ${c.name} public or private?`,
                  a: `Of the verified institutions on record, ${stats.pub} ${stats.pub === 1 ? "is" : "are"} publicly run and ${stats.priv} ${stats.priv === 1 ? "is" : "are"} private.`,
                },
              ]
            : []),
          ...(stats.languages.length > 0
            ? [
                {
                  q: `What language are ${subjectName} programs taught in across ${c.name}?`,
                  a: `The primary languages of instruction on record are ${stats.languages.join(", ")}. Confirm the language of each specific program directly with the university.`,
                },
              ]
            : []),
          {
            q: `How does AlmiStudy verify these universities?`,
            a: `Each listed university is checked against a recognized national accreditation body before publication${stats.bodies.length > 0 ? ` — for this set: ${stats.bodies.slice(0, 6).join(", ")}` : ""}. Listing does not guarantee a specific program's recognition by destination-country regulators.`,
          },
        ]
      : [];
  // Append the master data-provenance / anti-agent Qs (one FAQPage JSON-LD).
  const faqsAll = [...faqs, ...STUDY_MASTER_FAQ];
  const faqJsonLd =
    faqsAll.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqsAll.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

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
      {faqJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
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
            Study {subjectName} in {c.name}
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

        <StudyMasterHook localizedSuffix={` for ${subjectName} in ${c.name}`} />

        {unis && stats ? (
          <section
            className="mb-8 rounded-lg border border-peach bg-cream-soft p-5 sm:p-6"
            aria-labelledby="snapshot"
          >
            <h2 id="snapshot" className="text-lg font-semibold tracking-tight mb-4">
              {subjectName} in {c.name}: at a glance
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-peach/60 pb-2">
                <dt className="text-plum-soft">Accredited universities</dt>
                <dd className="font-medium text-plum text-right">{unis.length.toLocaleString("en-US")}</dd>
              </div>
              {stats.pub + stats.priv > 0 ? (
                <div className="flex justify-between gap-4 border-b border-peach/60 pb-2">
                  <dt className="text-plum-soft">Public · private</dt>
                  <dd className="font-medium text-plum text-right">{stats.pub} · {stats.priv}</dd>
                </div>
              ) : null}
              {stats.cities.length > 0 ? (
                <div className="flex justify-between gap-4 border-b border-peach/60 pb-2">
                  <dt className="text-plum-soft">Cities</dt>
                  <dd className="font-medium text-plum text-right">
                    {stats.cities.length} ({stats.cities.slice(0, 3).join(", ")}{stats.cities.length > 3 ? "…" : ""})
                  </dd>
                </div>
              ) : null}
              {stats.languages.length > 0 ? (
                <div className="flex justify-between gap-4 border-b border-peach/60 pb-2">
                  <dt className="text-plum-soft">Language(s) of instruction</dt>
                  <dd className="font-medium text-plum text-right">{stats.languages.slice(0, 4).join(", ")}</dd>
                </div>
              ) : null}
              {stats.withScholarships > 0 ? (
                <div className="flex justify-between gap-4 border-b border-peach/60 pb-2">
                  <dt className="text-plum-soft">List scholarships</dt>
                  <dd className="font-medium text-plum text-right">{stats.withScholarships}</dd>
                </div>
              ) : null}
              {stats.bodies.length > 0 ? (
                <div className="flex justify-between gap-4 border-b border-peach/60 pb-2 sm:col-span-2">
                  <dt className="text-plum-soft">Accrediting bodies</dt>
                  <dd className="font-medium text-plum text-right">{stats.bodies.slice(0, 4).join(" · ")}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

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

        {faqsAll.length > 0 ? (
          <section className="mb-10" aria-labelledby="faq">
            <h2 id="faq" className="text-lg font-semibold tracking-tight mb-3">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {faqsAll.map((f) => (
                <div key={f.q}>
                  <h3 className="text-sm font-medium text-plum mb-1">{f.q}</h3>
                  <p className="text-sm text-plum-soft leading-relaxed max-w-3xl">{f.a}</p>
                </div>
              ))}
            </div>
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

        <StudyMasterAntiAgent />
        <StudyMasterShamool />

        <p className="text-xs text-zinc-600 max-w-3xl leading-relaxed mb-6">
          We list institutions whose accreditation we have verified against a recognized national or international accrediting body. Listing does not vouch for any specific program&apos;s recognition by destination-country regulators or individual admissions outcomes.
        </p>
      </div>
    </main>
  );
}
