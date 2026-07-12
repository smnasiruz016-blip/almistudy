import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  StudyMasterHook,
  StudyMasterAntiAgent,
  StudyMasterFaq,
  StudyMasterShamool,
  type StudyFaqItem,
} from "@/components/study-master";
import {
  getCountriesForSubject,
  getUniversitiesBySubject,
} from "@/lib/page-relations";
import {
  SUBJECT_NAMES,
  SUBJECT_ORDER,
  type SubjectSlug,
} from "@/lib/subject-mapper";

// Cache indefinitely (revalidate:Infinity). Page data is static in-repo JSON that
// only changes on redeploy (which cold-starts the ISR cache -- pages re-render on
// next hit); a timed TTL only produced byte-identical daily ISR re-writes (cost).
export const revalidate = false;
export const dynamicParams = true;

const SITE_URL = "https://almistudy.almiworld.com";
const PRINCIPLES_URL =
  "https://github.com/smnasiruz016-blip/docs/blob/main/docs/AlmiStudy_Product_Principles.md";

type Params = { subject: string };

export const SUBJECT_NAMES_REEXPORT = SUBJECT_NAMES; // legacy import compat
export { SUBJECT_NAMES, SUBJECT_ORDER, type SubjectSlug };

function isSubjectSlug(s: string): s is SubjectSlug {
  return (SUBJECT_ORDER as readonly string[]).includes(s);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { subject } = await params;
  if (!isSubjectSlug(subject)) return {};
  const name = SUBJECT_NAMES[subject];
  const unis = getUniversitiesBySubject(subject);
  const countries = getCountriesForSubject(subject);
  const url = `${SITE_URL}/subjects/${subject}`;
  const year = new Date().getFullYear();
  // Bare title — the root layout template appends " · AlmiStudy" once.
  const title = `${name} Universities Worldwide (${year})`;
  const description = `${unis.length.toLocaleString("en-US")} accredited universities teaching ${name} across ${countries.length} countries, each verified against a recognized national accrediting body.`;
  return {
    title: title.length <= 60 ? title : `${name} (${year})`,
    description: description.length > 160 ? description.slice(0, 157) + "…" : description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: "AlmiStudy" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { subject } = await params;
  if (!isSubjectSlug(subject)) notFound();
  const name = SUBJECT_NAMES[subject];
  const allUnis = getUniversitiesBySubject(subject);
  const countries = getCountriesForSubject(subject);

  // Top countries by uni count for this subject (head of long-tail)
  const countriesByCount = countries
    .slice()
    .sort((a, b) => b.count - a.count);
  const topCountries = countriesByCount.slice(0, 16);
  const featuredUnis = allUnis.slice(0, 12);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListUnordered",
    numberOfItems: featuredUnis.length,
    itemListElement: featuredUnis.map((u, i) => ({
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
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "AlmiStudy", item: SITE_URL },
      { "@type": "ListItem", position: 3, name: "Subjects", item: `${SITE_URL}/subjects/${subject}` },
      { "@type": "ListItem", position: 4, name: name, item: `${SITE_URL}/subjects/${subject}` },
    ],
  };

  return (
    <main className="flex flex-col flex-1 px-6 py-10 sm:py-14 bg-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <div className="mx-auto w-full max-w-4xl">
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-plum-faint mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-coral transition-colors">Home</Link></li>
            <li aria-hidden="true">·</li>
            <li><Link href="/universities" className="hover:text-coral transition-colors">AlmiStudy</Link></li>
            <li aria-hidden="true">·</li>
            <li><span className="font-medium text-plum">{name}</span></li>
          </ol>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-medium tracking-tight text-plum mb-3">
            Universities offering {name} worldwide
          </h1>
          <p className="text-base sm:text-lg text-plum-soft leading-relaxed max-w-3xl">
            AlmiStudy lists {allUnis.length} accredited{" "}
            {allUnis.length === 1 ? "university" : "universities"} teaching {name} across{" "}
            {countries.length} {countries.length === 1 ? "country" : "countries"}, all verified
            against national accreditation registries.
          </p>
        </header>

        <StudyMasterHook localizedSuffix={` for ${name}`} />

        {topCountries.length > 0 ? (
          <section className="mb-10" aria-labelledby="top-countries">
            <h2 id="top-countries" className="text-lg font-semibold tracking-tight text-plum mb-3">
              Top countries for {name}
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {topCountries.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/study/${c.slug}/${subject}`}
                    className="block rounded-md border border-peach bg-cream p-3 hover:bg-cream-soft transition-colors"
                  >
                    <p className="text-plum font-medium text-sm">{c.name}</p>
                    <p className="text-plum-soft text-xs mt-1">{c.count} {c.count === 1 ? "university" : "universities"}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {featuredUnis.length > 0 ? (
          <section className="mb-10" aria-labelledby="featured-unis">
            <h2 id="featured-unis" className="text-lg font-semibold tracking-tight text-plum mb-3">
              Featured universities
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuredUnis.map((u) => (
                <li key={u.slug}>
                  <Link
                    href={`/university/${u.slug}`}
                    className="block rounded-md border border-peach bg-cream p-4 hover:bg-cream-soft transition-colors"
                  >
                    <p className="text-plum font-medium text-sm">{u.name}</p>
                    <p className="text-plum-soft text-xs mt-1">{u.city} · {u.country.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {countriesByCount.length > 0 ? (
          <section className="mb-10" aria-labelledby="all-countries">
            <h2 id="all-countries" className="text-lg font-semibold tracking-tight text-plum mb-3">
              All countries with {name} programs
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
              {countriesByCount.map((c) => (
                <li key={c.slug}>
                  <Link href={`/study/${c.slug}/${subject}`} className="text-plum hover:text-coral underline-offset-4 hover:underline">
                    {c.name} <span className="text-plum-faint">({c.count})</span>
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
            href="https://almisalary.almiworld.com"
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 transition-colors"
          >
            <div className="font-semibold mb-1">Salary by country →</div>
            <div className="text-zinc-600">AlmiSalary — what graduates earn, honest ranges.</div>
          </a>
          <a
            href="https://almicv.almiworld.com"
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 transition-colors"
          >
            <div className="font-semibold mb-1">Build your CV →</div>
            <div className="text-zinc-600">AlmiCV — free templates, every country.</div>
          </a>
          <a
            href="https://almijob.almiworld.com"
            className="block rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 transition-colors"
          >
            <div className="font-semibold mb-1">Find jobs →</div>
            <div className="text-zinc-600">AlmiJob — one CV, every site.</div>
          </a>
        </section>

        <StudyMasterFaq
          heading={`Studying ${name} abroad — questions answered`}
          extra={[
            {
              q: `Which universities teach ${name}?`,
              a: `AlmiStudy verifies ${allUnis.length} accredited ${allUnis.length === 1 ? "university" : "universities"} teaching ${name} across ${countries.length} ${countries.length === 1 ? "country" : "countries"} — each checked against a national accreditation registry. Browse by country above.`,
            },
            {
              q: `Do I need an agent to study ${name} abroad?`,
              a: `No. Universities welcome direct applications. AlmiStudy gives you the verified ${name} directory directly, so you choose and apply yourself — without a commission-paid middleman.`,
            },
          ] satisfies StudyFaqItem[]}
        />
        <StudyMasterAntiAgent />
        <StudyMasterShamool />

        <p className="text-xs text-plum-soft max-w-3xl leading-relaxed mb-2">
          We list institutions whose accreditation we have verified against a recognized national or international accrediting body. Listing does not vouch for any specific program&apos;s recognition by destination-country regulators or individual admissions outcomes.
        </p>
        <footer className="text-xs text-plum-faint border-t border-peach pt-4 leading-relaxed mt-6">
          <p>
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
