import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  StudyMasterHook,
  StudyMasterAntiAgent,
  StudyMasterFaq,
  StudyMasterCrossProduct,
  StudyMasterShamool,
  type StudyFaqItem,
} from "@/components/study-master";
import { REGION_ORDER, REGION_NAMES, getCountriesByRegion, getRegionBySlug, isRegionSlug } from "@/lib/regions";

/**
 * RR-408 A3/A8 · the region pages, back as a small fixed set: one page per region on the home page (ten at most),
 * prebuilt and never revalidated (no ISR write, no on-demand render). The old continent slugs that are not regions
 * now (asia, south-america) still answer 410 Gone from proxy.ts, as the 17 Oct cost ruling set.
 */
export const dynamicParams = false;
export const revalidate = false;

const SITE_URL = "https://almistudy.almiworld.com";

export function generateStaticParams() {
  return REGION_ORDER.filter((r) => getRegionBySlug(r)).map((region) => ({ region }));
}

export async function generateMetadata({ params }: { params: Promise<{ region: string }> }): Promise<Metadata> {
  const { region } = await params;
  if (!isRegionSlug(region)) return {};
  const r = getRegionBySlug(region);
  if (!r) return {};
  const name = REGION_NAMES[region];
  const url = `${SITE_URL}/regions/${region}`;
  const year = new Date().getFullYear();
  const title = `${r.universityCount.toLocaleString("en-US")} Accredited Universities in ${name} (${year})`;
  const description = `${r.universityCount.toLocaleString("en-US")} accredited universities across ${r.countryCount} ${r.countryCount === 1 ? "country" : "countries"} in ${name}, each verified against a recognized national accrediting body.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: "AlmiStudy" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function RegionPage({ params }: { params: Promise<{ region: string }> }) {
  const { region } = await params;
  if (!isRegionSlug(region)) notFound();
  const r = getRegionBySlug(region);
  if (!r) notFound();
  const name = REGION_NAMES[region];
  const countries = getCountriesByRegion(region);

  return (
    <main className="flex flex-col flex-1 px-6 py-10 sm:py-14 bg-cream">
      <div className="mx-auto w-full max-w-4xl">
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-plum-faint mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-coral-deep transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">·</li>
            <li>
              <span className="font-medium text-plum">{name}</span>
            </li>
          </ol>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-medium tracking-tight text-plum mb-3">Universities in {name}</h1>
          <p className="text-base sm:text-lg text-plum-soft leading-relaxed max-w-3xl">
            {r.universityCount.toLocaleString("en-US")} {r.universityCount === 1 ? "university" : "universities"} across{" "}
            {r.countryCount} {r.countryCount === 1 ? "country" : "countries"}, each verified against a recognized national
            accrediting body. Choose a country to see its list.
          </p>
        </header>

        <StudyMasterHook localizedSuffix={` in ${name}`} />

        <section aria-label={`Countries in ${name}`} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
          {countries.map((c) => (
            <Link
              key={c.slug}
              href={`/universities/${c.slug}`}
              className="block rounded-md border border-peach bg-cream p-4 hover:bg-cream-soft transition-colors"
            >
              <p className="text-plum font-medium text-sm">{c.name}</p>
              <p className="text-plum-soft text-xs mt-1">
                {c.count.toLocaleString("en-US")} {c.count === 1 ? "university" : "universities"}
              </p>
            </Link>
          ))}
        </section>

        <StudyMasterFaq
          heading={`Studying in ${name}: questions answered`}
          extra={[
            {
              q: `How many universities does AlmiStudy verify in ${name}?`,
              a: `${r.universityCount.toLocaleString("en-US")} ${r.universityCount === 1 ? "university" : "universities"} across ${r.countryCount} ${r.countryCount === 1 ? "country" : "countries"} in ${name}, each checked against a recognized national accrediting body.`,
            },
            {
              q: `Do I need an agent to apply to a university in ${name}?`,
              a: `No. Universities welcome direct applications. AlmiStudy gives you the verified data directly so you apply yourself, with no commission-paid middleman.`,
            },
          ] satisfies StudyFaqItem[]}
        />
        <StudyMasterAntiAgent />
        <StudyMasterCrossProduct />
        <StudyMasterShamool />
      </div>
    </main>
  );
}
