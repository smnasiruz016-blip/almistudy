"use client";

/**
 * RR-408 A2 + A4 · the home-page search: one large box (a university's English or local name, or a city) with
 * suggestions as you type, Country and Subject filters, a Search button, results on this page in pages of 20.
 * The index is one static file (/search-index.json) fetched the first time the box or a filter is touched; every
 * search runs in the browser (lib/search-core.ts). Results never change the address, so a search makes no new
 * indexable URL; "/?q=" (the WebSite SearchAction) is answered noindex by next.config.ts.
 */
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { PAGE_SIZE, search, suggest, type Hit, type SearchIndex } from "@/lib/search-core";

type Option = { slug: string; name: string };

let INDEX: Promise<SearchIndex> | null = null;
function loadIndex(): Promise<SearchIndex> {
  INDEX ??= fetch("/search-index.json").then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json() as Promise<SearchIndex>;
  });
  INDEX.catch(() => {
    INDEX = null; // a failed load is tried again on the next touch
  });
  return INDEX;
}

export default function HomeSearch({
  countries,
  subjects,
  chips,
}: {
  countries: Option[];
  subjects: Option[];
  chips: Option[];
}) {
  const [ix, setIx] = useState<SearchIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [subject, setSubject] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);
  const [asked, setAsked] = useState<{ q: string; country: string; subject: string } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const warm = useCallback(() => {
    if (ix) return Promise.resolve(ix);
    return loadIndex().then(
      (x) => {
        setIx(x);
        setFailed(false);
        return x;
      },
      () => {
        setFailed(true);
        return null;
      },
    );
  }, [ix]);

  const run = useCallback(
    async (query: { q: string; country: string; subject: string }) => {
      const x = await warm();
      if (!x) return;
      setHits(search(x, query));
      setAsked(query);
      setShown(PAGE_SIZE);
      setOpen(false);
      requestAnimationFrame(() => resultsRef.current?.focus({ preventScroll: false }));
    },
    [warm],
  );

  /* the WebSite SearchAction lands here as /?q=…: run that search once */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("q");
    if (p && p.trim()) {
      void Promise.resolve().then(() => {
        setQ(p);
        return run({ q: p, country: "", subject: "" });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sugg = useMemo(() => (ix && open ? suggest(ix, q) : []), [ix, q, open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && sugg[active]) {
      window.location.href = `/university/${sugg[active].slug}`;
      return;
    }
    void run({ q, country, subject });
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!sugg.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, sugg.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  const countryName = (slug: string) => countries.find((c) => c.slug === slug)?.name ?? slug;
  const subjectName = (slug: string) => subjects.find((s) => s.slug === slug)?.name ?? slug;

  return (
    <div className="w-full text-left">
      <form role="search" aria-label="Search universities" onSubmit={submit} className="rounded-xl border border-peach bg-cream-soft p-3 sm:p-4 shadow-sm">
        <div className="relative">
          <label htmlFor="home-q" className="sr-only">
            University name or city
          </label>
          <input
            id="home-q"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder="University or city, e.g. Monash, Lahore"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(-1);
              void warm();
            }}
            onFocus={() => {
              setOpen(true);
              void warm();
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={onKey}
            role="combobox"
            aria-expanded={sugg.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            className="w-full min-h-[52px] rounded-lg border border-peach bg-cream px-4 text-base sm:text-lg text-plum placeholder:text-plum-faint focus:outline-none focus:ring-2 focus:ring-coral-deep"
          />
          {sugg.length > 0 ? (
            <ul id={listId} role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-peach bg-cream shadow-lg">
              {sugg.map((s, i) => (
                <li key={s.slug} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                  <a
                    href={`/university/${s.slug}`}
                    onMouseDown={(e) => e.preventDefault()}
                    className={`block px-4 py-2.5 text-sm ${i === active ? "bg-peach" : "hover:bg-cream-soft"}`}
                  >
                    <span className="block font-medium text-plum">{s.name}</span>
                    <span className="block text-xs text-plum-soft">{s.place}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <label className="sr-only" htmlFor="home-country">
            Country
          </label>
          <select
            id="home-country"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setOpen(false);
              void warm();
            }}
            className="min-h-[44px] w-full rounded-lg border border-peach bg-cream px-3 text-sm text-plum"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="home-subject">
            Subject
          </label>
          <select
            id="home-subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setOpen(false);
              void warm();
            }}
            className="min-h-[44px] w-full rounded-lg border border-peach bg-cream px-3 text-sm text-plum"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="col-span-2 sm:col-span-1 min-h-[44px] rounded-lg bg-coral-deep px-6 text-sm font-semibold text-cream hover:bg-coral-ink transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {chips.length ? (
        <nav aria-label="Popular study destinations" className="mt-4">
          <ul className="flex flex-wrap justify-center gap-2">
            {chips.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/universities/${c.slug}`}
                  className="inline-flex min-h-[36px] items-center rounded-full border border-peach bg-cream px-3.5 text-sm text-plum hover:bg-peach transition-colors"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {failed ? (
        <p className="mt-4 text-sm text-plum-soft" role="status">
          The search could not load just now. Try again, or browse by region below.
        </p>
      ) : null}

      <div ref={resultsRef} tabIndex={-1} aria-live="polite" className="outline-none">
        {hits && asked ? (
          <section aria-label="Search results" className="mt-6">
            <p className="text-sm text-plum-soft">
              {hits.length.toLocaleString("en-US")} {hits.length === 1 ? "university" : "universities"}
              {asked.q.trim() ? <> for &ldquo;{asked.q.trim()}&rdquo;</> : null}
              {asked.country ? ` in ${countryName(asked.country)}` : ""}
              {asked.subject ? ` · ${subjectName(asked.subject)}` : ""}
            </p>
            {hits.length === 0 ? (
              <p className="mt-3 rounded-lg border border-peach bg-cream-soft p-4 text-sm text-plum-soft">
                No university matches that yet. Check the spelling, try the city, or{" "}
                <a href="#browse-regions" className="font-medium text-coral-deep underline hover:text-coral-ink">
                  browse by region
                </a>
                .
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {hits.slice(0, shown).map(({ row }) => (
                  <ResultCard key={row[0]} row={row} ix={ix!} />
                ))}
              </ul>
            )}
            {hits.length > shown ? (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE_SIZE)}
                  className="min-h-[44px] rounded-lg border border-coral-deep px-6 text-sm font-semibold text-coral-deep hover:bg-peach transition-colors"
                >
                  Show more ({Math.min(PAGE_SIZE, hits.length - shown)} of {(hits.length - shown).toLocaleString("en-US")} left)
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

/* what the country page shows for each university */
function ResultCard({ row, ix }: { row: Hit["row"]; ix: SearchIndex }) {
  const [slug, name, city, ci, , ctrl, body, reg, verified, site, raw] = row;
  const t = (i: number) => ix.strings[i] ?? "";
  const control = t(ctrl);
  return (
    <li className="rounded-lg border border-peach bg-cream p-4 sm:p-5">
      <h3 className="text-base sm:text-lg font-semibold text-plum">
        <Link href={`/university/${slug}`} className="hover:underline">
          {name}
        </Link>
      </h3>
      <p className="mt-0.5 text-sm text-plum-soft">
        {[city, ix.countries[ci][1]].filter(Boolean).join(", ")}
        {control ? ` · ${control[0].toUpperCase()}${control.slice(1)}` : ""}
      </p>
      {raw.length ? (
        <p className="mt-2 text-sm text-plum-soft">
          <span className="mr-2 text-xs uppercase tracking-wide text-plum-faint">Subjects</span>
          {raw.map(t).join(" · ")}
        </p>
      ) : null}
      {t(body) && t(reg) ? (
        <p className="mt-2 text-sm text-plum-soft">
          <span className="mr-2 text-xs uppercase tracking-wide text-plum-faint">Accreditation</span>
          {t(body)}.{" "}
          <a href={t(reg)} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
            Verify on the public registry
          </a>
          {t(verified) ? ` · last verified ${t(verified)}` : ""}.
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium">
        {site ? (
          <a href={site} target="_blank" rel="noopener noreferrer nofollow" className="text-coral-deep underline hover:text-coral-ink">
            Official website →
          </a>
        ) : null}
        <Link href={`/university/${slug}`} className="text-plum underline hover:no-underline">
          Full profile
        </Link>
      </div>
    </li>
  );
}
