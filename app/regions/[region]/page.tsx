import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  V2_REGION_ORDER,
  V2_REGION_NAMES,
  getCountriesByRegion,
  getRegionBySlug,
  type V2RegionSlug,
} from "@/lib/regions";

const SITE_URL = "https://almistudy.almiworld.com";

export function generateStaticParams() {
  return V2_REGION_ORDER.map((region) => ({ region }));
}

function isV2RegionSlug(s: string): s is V2RegionSlug {
  return (V2_REGION_ORDER as readonly string[]).includes(s);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const { region } = await params;
  if (!isV2RegionSlug(region)) return {};
  const name = V2_REGION_NAMES[region];
  const r = getRegionBySlug(region);
  const url = `${SITE_URL}/regions/${region}`;
  const description =
    r && r.status === "active"
      ? `Accredited universities in ${name}. ${r.universityCount} ${r.universityCount === 1 ? "institution" : "institutions"} across ${r.countryCount} ${r.countryCount === 1 ? "country" : "countries"}, verified against recognized national accrediting bodies.`
      : `${name} coverage is on the AlmiStudy roadmap. We expand deliberately, country by country, when accreditation can be verified.`;
  // Bare title — the root layout template appends " · AlmiStudy" once.
  const title = `${name} universities`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: "AlmiStudy" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const { region } = await params;
  if (!isV2RegionSlug(region)) notFound();
  const r = getRegionBySlug(region);
  if (!r) notFound();
  const name = V2_REGION_NAMES[region];
  const countries = getCountriesByRegion(region);

  return (
    <main className="flex flex-col flex-1 px-6 py-10 sm:py-14 bg-cream">{/* Header + Footer provided by root layout */}
        <div className="mx-auto w-full max-w-4xl">
          <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-plum-faint mb-5">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-coral transition-colors">
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
            <h1 className="text-2xl sm:text-4xl font-medium tracking-tight text-plum mb-3">
              {name}
            </h1>
            {r.status === "active" ? (
              <p className="text-base sm:text-lg text-plum-soft leading-relaxed max-w-3xl">
                {r.universityCount}{" "}
                {r.universityCount === 1 ? "university" : "universities"} across{" "}
                {r.countryCount} {r.countryCount === 1 ? "country" : "countries"}, each
                verified against a recognized national accrediting body.
              </p>
            ) : (
              <p className="text-base sm:text-lg text-plum-soft leading-relaxed max-w-3xl">
                We haven&apos;t reviewed universities in this region yet.
              </p>
            )}
          </header>

          {r.status === "active" ? (
            <section
              aria-label={`Countries in ${name}`}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10"
            >
              {countries.map((c) => (
                <Link
                  key={c.slug}
                  href={`/universities/${c.slug}`}
                  className="block rounded-md border border-peach bg-cream p-4 hover:bg-cream-soft transition-colors"
                >
                  <p className="text-plum font-medium text-sm">{c.name}</p>
                  <p className="text-plum-soft text-xs mt-1">
                    {c.count} {c.count === 1 ? "university" : "universities"}
                  </p>
                </Link>
              ))}
            </section>
          ) : (
            <section className="mb-10 rounded-md border border-peach bg-cream-soft p-6">
              <p className="text-sm text-plum-soft leading-relaxed max-w-3xl mb-4">
                AlmiStudy expands deliberately, country by country, not by padding the
                list. When we&apos;ve verified accreditation for the first university in
                this region, we&apos;ll surface it here. In the meantime,{" "}
                <Link
                  href="/universities"
                  className="text-coral hover:text-coral-deep underline"
                >
                  browse by country →
                </Link>
              </p>
            </section>
          )}
        </div>
    </main>
  );
}
