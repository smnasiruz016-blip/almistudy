"use client";

/**
 * RR-408 A3 · browse in three clicks: region card → its countries (here, on the home page) → the country's list
 * (/universities/[country], unchanged). Each card is a real link to /regions/[region] (crawlable, in the sitemap);
 * a plain click opens the countries in place, a new-tab click follows the link.
 */
import Link from "next/link";
import { useState } from "react";

export type RegionCard = {
  slug: string;
  name: string;
  universityCount: number;
  countryCount: number;
  countries: Array<{ slug: string; name: string; count: number }>;
};

const n = (x: number) => x.toLocaleString("en-US");

export default function RegionBrowser({ regions }: { regions: RegionCard[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const current = regions.find((r) => r.slug === open) ?? null;
  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {regions.map((r) => (
          <li key={r.slug}>
            <a
              href={`/regions/${r.slug}`}
              aria-expanded={open === r.slug}
              aria-controls="region-countries"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                setOpen((o) => (o === r.slug ? null : r.slug));
              }}
              className={`block h-full rounded-lg border px-3 py-3 sm:px-4 transition-colors ${
                open === r.slug ? "border-coral-deep bg-peach" : "border-peach bg-cream hover:bg-cream-soft"
              }`}
            >
              <span className="block text-base font-semibold text-plum">{r.name}</span>
              <span className="mt-1 block text-xs sm:text-sm text-plum-soft">
                {n(r.universityCount)} {r.universityCount === 1 ? "university" : "universities"}
              </span>
              <span className="block text-xs sm:text-sm text-plum-soft">
                {n(r.countryCount)} {r.countryCount === 1 ? "country" : "countries"}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <div id="region-countries" aria-live="polite">
        {current ? (
          <section aria-label={`Countries in ${current.name}`} className="mt-4 rounded-lg border border-peach bg-cream-soft p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold text-plum">{current.name}</h3>
              <Link href={`/regions/${current.slug}`} className="text-sm font-medium text-coral-deep underline hover:text-coral-ink">
                The {current.name} page →
              </Link>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {current.countries.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/universities/${c.slug}`}
                    className="flex min-h-[44px] items-center justify-between gap-2 rounded-md border border-peach bg-cream px-3 py-2 text-sm text-plum hover:bg-peach transition-colors"
                  >
                    <span>{c.name}</span>
                    <span className="shrink-0 text-xs text-plum-soft">{n(c.count)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
