import Link from "next/link";
import { getCountriesForHomepage } from "@/lib/page-relations";

const PRINCIPLES_URL =
  "https://github.com/smnasiruz016-blip/almistudy/blob/main/docs/AlmiStudy_Product_Principles.md";

export default function Home() {
  const countries = getCountriesForHomepage();
  const total = countries.reduce((s, c) => s + c.count, 0);

  return (
    <main className="flex flex-col flex-1 px-6 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-4 leading-tight">
            Where to study for credentials that transfer.
          </h1>
          <p className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4 max-w-3xl">
            AlmiStudy is a curated directory of accredited universities. Every listing is verified
            against a recognized national accrediting body, with a public registry link so you can
            check it yourself.
          </p>
          <ul className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-2 list-disc pl-5 max-w-3xl">
            <li>
              <strong>A directory, not a counselor.</strong> We point you to verified universities.
              We don&apos;t broker applications.
            </li>
            <li>
              <strong>Verification, not opinion.</strong> Each university is checked against a
              named national accrediting body. The registry link is public.
            </li>
            <li>
              <strong>Free, no account required.</strong> No sign-up wall. No CV upload. No data
              captured.
            </li>
            <li>
              <strong>Built in the open.</strong> {total}{" "}
              {total === 1 ? "university" : "universities"} reviewed so far. We expand
              deliberately, country by country, not by padding the list.
            </li>
          </ul>
        </header>

        <section aria-label="Countries with reviewed universities" className="mb-10">
          <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">Browse by country</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {countries.map((c) => (
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
        </section>

        <section aria-label="What AlmiStudy is and isn't" className="mb-10 max-w-3xl">
          <h2 className="text-sm uppercase tracking-wide text-zinc-500 mb-3">What this is</h2>
          <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2 list-disc pl-5">
            <li>A directory. We point you to verified-accreditation universities.</li>
            <li>Free to browse. No account required, no CV upload, no applications brokered.</li>
            <li>
              Honest about coverage. If we haven&apos;t reviewed enough universities for a country
              yet, we say so.
            </li>
          </ul>
          <h2 className="text-sm uppercase tracking-wide text-zinc-500 mt-6 mb-3">
            What this is not
          </h2>
          <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2 list-disc pl-5">
            <li>Not a recruitment agency. We don&apos;t take university money to surface programs.</li>
            <li>
              Not a paid placement service. No money flows in either direction in exchange for
              matching.
            </li>
            <li>
              Not a list of unaccredited institutions. Diploma mills are excluded outright, with no
              exceptions.
            </li>
          </ul>
        </section>

        <footer className="text-xs text-zinc-500 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 pt-4 leading-relaxed">
          <p>
            Read the full{" "}
            <a
              href={PRINCIPLES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              AlmiStudy product principles
            </a>{" "}
            (v1.0).
          </p>
        </footer>
      </div>
    </main>
  );
}
