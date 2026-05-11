import type { Metadata } from "next";
import Link from "next/link";
import { getAllCountries } from "@/lib/page-relations";

const SITE_URL = "https://almistudy.almiworld.com";
const PRINCIPLES_URL =
  "https://github.com/smnasiruz016-blip/almistudy/blob/main/docs/AlmiStudy_Product_Principles.md";

export const metadata: Metadata = {
  title: "Accredited universities directory",
  description:
    "AlmiStudy university directory by country. Verified-accreditation institutions checked against recognized national accrediting bodies.",
  alternates: { canonical: `${SITE_URL}/universities` }
};

export default function UniversitiesIndexPage() {
  const countries = getAllCountries();

  // Group by region for navigability
  const byRegion = new Map<string, typeof countries>();
  for (const c of countries) {
    const list = byRegion.get(c.region) ?? [];
    list.push(c);
    byRegion.set(c.region, list);
  }
  const REGION_ORDER = [
    "Middle East",
    "South Asia",
    "Southeast Asia",
    "Europe",
    "North America"
  ];
  const regions = [...byRegion.keys()].sort((a, b) => {
    const ai = REGION_ORDER.indexOf(a);
    const bi = REGION_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const total = countries.reduce((s, c) => s + c.count, 0);

  return (
    <main className="flex flex-col flex-1 px-6 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-zinc-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Universities</span>
            </li>
          </ol>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-3">
            Accredited universities directory
          </h1>
          <p className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3 max-w-3xl">
            Verified-accreditation universities organized by country. Every listing is checked
            against a recognized national accrediting body, with a public registry link so you can
            verify it yourself.
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            We&apos;ve reviewed {total} {total === 1 ? "university" : "universities"} across{" "}
            {countries.length} {countries.length === 1 ? "country" : "countries"}. We&apos;re working on
            expanding coverage.
          </p>
        </header>

        <section aria-label="Countries by region" className="space-y-8 mb-10">
          {regions.map((region) => {
            const list = (byRegion.get(region) ?? [])
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name));
            return (
              <div key={region}>
                <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">{region}</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {list.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/universities/${c.slug}`}
                        className="block rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="text-zinc-500 ml-2 text-sm">
                          {c.count} {c.count === 1 ? "university" : "universities"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed mb-2">
          We list institutions whose accreditation we have verified against a recognized national or
          international accrediting body. Listing does not vouch for any specific program&apos;s
          recognition by destination-country regulators or individual admissions outcomes.
        </p>

        <footer className="text-xs text-zinc-500 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-8 leading-relaxed">
          <p>
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
