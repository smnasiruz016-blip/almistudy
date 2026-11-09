/**
 * RR-408 Part A · proof for the home-page search, region browsing, unique titles and merges.
 *   npx tsx --test scripts/rr408-home-search.test.mts
 * Reads the real data (lib/universities-publishable.json through lib/page-relations.ts) and the real search code
 * (lib/search-core.ts) the browser runs. scripts/sabotage-rr408.mjs breaks one count on purpose: RED, then GREEN.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import publishable from "../lib/universities-publishable.json";
import { getAllCountries, getUniversitiesByCountrySlug, getUniversityBySlug, type University } from "../lib/page-relations";
import { buildSearchIndex } from "../lib/search-index";
import { search, suggest, fold } from "../lib/search-core";
import { getCanonicalSubjects } from "../lib/subject-mapper";
import { getRegions, getCountriesByRegion, regionOfCountry, REGION_ORDER } from "../lib/regions";
import { REGION_PAGE_SLUGS } from "../lib/region-slugs";
import { universityTitle, universityHeading, universityDescription } from "../lib/university-title";
import { HOME_CANONICAL, SEARCH_URL_TEMPLATE, websiteJsonLd, CHIP_SLUGS } from "../lib/home-seo";
import * as StaticIndex from "../lib/static-index";
import merges from "../lib/university-merges.json";
import * as nextConfigModule from "../next.config";
import type { NextConfig } from "next";

/* tsx may hand the config over as the module or as its default */
let cfg: unknown = nextConfigModule;
while (cfg && typeof cfg === "object" && !("redirects" in cfg) && "default" in cfg) cfg = (cfg as { default: unknown }).default;
const nextConfig = cfg as NextConfig;

const ROOT = path.join(import.meta.dirname, "..");
const src = (p: string) => readFileSync(path.join(ROOT, p), "utf8");
const ix = buildSearchIndex();
const YEAR = 2026;
/* the AlmiVisibility scan's own title key (desktop/site-scan.mjs norm): lower case, every non a-z0-9 run one space */
const scanNorm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const slugsOf = (hits: ReturnType<typeof search>) => hits.map((h) => h.row[0]);
const country = (slug: string) => getAllCountries().find((c) => c.slug === slug)!;

test("A2 · search by English name, local name and city each find the right university", () => {
  const vic = search(ix, { q: "victoria university" });
  assert.ok(slugsOf(vic).includes("victoria-university"), "English name: Victoria University (Melbourne)");
  assert.ok(slugsOf(vic).includes("victoria-university-uganda"), "and its namesake in Uganda");
  /* local name: the name field carries it, e.g. "American University of Sharjah (AUS / الجامعة الأمريكية في الشارقة)" */
  const aus = getUniversityBySlug("american-university-of-sharjah")!;
  const local = /\/\s*([^)]+)\)/.exec(aus.name)![1].trim();
  assert.match(local, /[؀-ۿ]/, "the local (Arabic) name is in the data");
  assert.deepEqual(slugsOf(search(ix, { q: local })).slice(0, 1), ["american-university-of-sharjah"], `local name "${local}"`);
  assert.ok(slugsOf(search(ix, { q: "Ош мамлекеттик" })).includes("osh-state-university"), "local name in Cyrillic");
  assert.ok(slugsOf(search(ix, { q: "universite du faso" })).includes("universite-du-faso"), "accents off: Université du Faso");
  /* city */
  const lahore = search(ix, { q: "Lahore" });
  assert.ok(slugsOf(lahore).includes("beaconhouse-national-university"), "city: Beaconhouse National University is in Lahore");
  for (const h of lahore) assert.ok(/lahore/i.test(`${h.row[1]} ${h.row[2]}`), `${h.row[0]} matched Lahore by name or city`);
  const melb = search(ix, { q: "melbourne" });
  assert.ok(slugsOf(melb).includes("victoria-university"), "city: Melbourne finds Victoria University");
  /* suggestions carry the place, and a name that starts with the query comes first */
  const s = suggest(ix, "monash");
  assert.ok(s.length >= 1 && /^monash/i.test(s[0].name), JSON.stringify(s));
  assert.ok(s[0].place.includes("Australia") || s[0].place.includes("Malaysia"), s[0].place);
  assert.deepEqual(suggest(ix, "m"), [], "one letter suggests nothing");
});

test("A2 · the country and subject filters narrow the results, exactly as the data says", () => {
  const all = search(ix, {});
  assert.equal(all.length, ix.total);
  const pk = search(ix, { country: "pakistan" });
  assert.equal(pk.length, getUniversitiesByCountrySlug("pakistan").length, "country filter = the country's list");
  for (const h of pk) assert.equal(ix.countries[h.row[3]][0], "pakistan");
  const med = search(ix, { subject: "medicine-health-sciences" });
  assert.ok(med.length > 0 && med.length < all.length);
  const pkMed = search(ix, { country: "pakistan", subject: "medicine-health-sciences" });
  assert.ok(pkMed.length > 0 && pkMed.length < pk.length && pkMed.length < med.length, "both filters narrow further");
  const want = getUniversitiesByCountrySlug("pakistan").filter((u) => getCanonicalSubjects(u).includes("medicine-health-sciences")).length;
  assert.equal(pkMed.length, want, "equal to the data's own count (subject-mapper), not to the search's");
  assert.equal(med.length, getAllCountries().flatMap((c) => getUniversitiesByCountrySlug(c.slug)).filter((u) => getCanonicalSubjects(u).includes("medicine-health-sciences")).length);
  const lahoreMed = search(ix, { q: "lahore", subject: "medicine-health-sciences" });
  for (const h of lahoreMed) assert.ok(slugsOf(pkMed).includes(h.row[0]), "a query plus a filter stays inside the filter");
  assert.deepEqual(search(ix, { country: "atlantis" }), [], "an unknown country finds nothing");
  assert.deepEqual(search(ix, { q: "zzqxv nowhere" }), [], "no match: an empty list (the page then suggests browsing by region)");
});

test("A3/A6 · region counts add up to the total; each country count matches its list; every country in exactly one region", () => {
  const countries = getAllCountries();
  const total = countries.reduce((n, c) => n + c.count, 0);
  const regions = getRegions();
  for (const c of countries) assert.ok(regionOfCountry(c), `${c.slug} (${c.region}) belongs to a region`);
  assert.equal(regions.reduce((n, r) => n + r.universityCount, 0), total, "region university counts add up to the total");
  assert.equal(regions.reduce((n, r) => n + r.countryCount, 0), countries.length, "region country counts add up to every country");
  for (const c of countries) {
    assert.equal(c.count, getUniversitiesByCountrySlug(c.slug).length, `${c.slug}: count = its list`);
    assert.equal(c.count, ix.rows.filter((r) => ix.countries[r[3]][0] === c.slug).length, `${c.slug}: count = the search index`);
  }
  for (const r of regions) {
    const cs = getCountriesByRegion(r.slug);
    assert.equal(cs.length, r.countryCount, `${r.slug}: country count`);
    assert.equal(cs.reduce((n, c) => n + c.count, 0), r.universityCount, `${r.slug}: university count`);
  }
  assert.equal(ix.total, total, "the search index holds every university");
  assert.ok(regions.length >= 8, "the large continents are split");
  assert.deepEqual([...REGION_PAGE_SLUGS], [...REGION_ORDER], "proxy.ts and the region pages read the same list");
  for (const r of regions) assert.ok(StaticIndex.sitemapPaths().includes(`/regions/${r.slug}`), `/regions/${r.slug} is in the sitemap`);
  for (const ch of CHIP_SLUGS) assert.ok(country(ch.slug), `chip ${ch.label} opens a real country`);
});

test("A8 · the home page has its canonical and a WebSite SearchAction; search views are not indexable", async () => {
  const page = src("app/page.tsx");
  assert.match(page, /alternates:\s*\{\s*canonical:\s*HOME_CANONICAL\s*\}/, "home generateMetadata sets the canonical");
  assert.equal(HOME_CANONICAL, "https://almistudy.almiworld.com/");
  assert.match(page, /websiteJsonLd\(\)/, "the WebSite JSON-LD is rendered");
  const ld = websiteJsonLd();
  assert.equal(ld["@type"], "WebSite");
  assert.equal(ld.potentialAction["@type"], "SearchAction");
  assert.equal(ld.potentialAction.target.urlTemplate, SEARCH_URL_TEMPLATE);
  assert.match(SEARCH_URL_TEMPLATE, /\/\?q=\{search_term_string\}$/);
  /* the SearchAction address answers noindex */
  const headers = await nextConfig.headers!();
  const rule = headers.find((h) => h.source === "/" && h.has?.some((x) => x.type === "query" && x.key === "q"));
  assert.ok(rule, "a header rule for /?q=");
  assert.ok(rule!.headers.some((h) => h.key.toLowerCase() === "x-robots-tag" && /noindex/.test(h.value)), "it says noindex");
  /* the search never writes an address */
  const box = src("components/HomeSearch.tsx");
  assert.doesNotMatch(box, /pushState|replaceState|router\.(push|replace)|useRouter/, "results never change the URL");
  assert.match(src("app/search-index.json/route.ts"), /force-static/, "the index is one static file");
  assert.match(src("app/search-index.json/route.ts"), /x-robots-tag/i);
  assert.ok(!StaticIndex.sitemapPaths().some((p) => p.includes("?") || p.startsWith("/search")), "no search address in the sitemap");
});

test("A5 · no two indexable university pages share a title (or an h1); the place is never cut", () => {
  const unis = StaticIndex.universities().map((s) => getUniversityBySlug(s)!) as University[];
  const seen = new Map<string, string>(), clash: string[] = [];
  for (const u of unis) {
    const t = scanNorm(`${universityTitle(u, YEAR)} · AlmiStudy`);
    if (seen.has(t)) clash.push(`${u.slug} = ${seen.get(t)} ("${universityTitle(u, YEAR)}")`);
    else seen.set(t, u.slug);
  }
  assert.deepEqual(clash, [], `${clash.length} title clashes`);
  const h1 = new Set(unis.map((u) => fold(universityHeading(u))));
  assert.equal(h1.size, unis.length, "every h1 is unique");
  for (const u of unis) {
    const place = universityTitle(u, YEAR);
    assert.ok(place.includes(u.country.name) || (u.city ?? "").includes(u.country.name), `${u.slug}: the title names the country`);
    if (u.city) assert.ok(place.includes(u.city.trim()), `${u.slug}: the title names the city`);
    const d = universityDescription(u);
    assert.ok(d.length <= 160, `${u.slug}: description length`);
    assert.ok(d.includes(u.country.name), `${u.slug}: the description names the country`);
  }
  assert.equal(universityTitle(getUniversityBySlug("victoria-university")!, YEAR), "Victoria University, Melbourne, Australia (2026)");
});

test("A5 · each merged slug answers 308 to the kept page and leaves the sitemap, the pages and the search", async () => {
  const redirects = await nextConfig.redirects!();
  const sitemap = new Set(StaticIndex.sitemapPaths());
  const pages = new Set(StaticIndex.universities());
  const all = new Set((publishable as University[]).map((u) => u.slug));
  assert.ok(merges.merges.length > 0);
  for (const m of merges.merges) {
    const r = redirects.find((x) => x.source === `/university/${m.from}`);
    assert.ok(r, `${m.from}: a redirect`);
    assert.equal(r!.destination, `/university/${m.to}`);
    assert.equal(r!.permanent, true, "permanent: true is Next's 308");
    assert.ok(!("statusCode" in r!), "no other status code");
    assert.ok(all.has(m.from), `${m.from} is a real row (kept in the data, not deleted)`);
    assert.ok(pages.has(m.to) && sitemap.has(`/university/${m.to}`), `${m.to}: the kept page exists and is in the sitemap`);
    assert.ok(!pages.has(m.from) && !sitemap.has(`/university/${m.from}`), `${m.from}: out of the pages and the sitemap`);
    assert.equal(getUniversityBySlug(m.from), undefined, `${m.from}: no page renders`);
    assert.ok(!ix.rows.some((x) => x[0] === m.from), `${m.from}: out of the search`);
    assert.ok(!merges.merges.some((x) => x.from === m.to), `${m.to} is not itself merged away (no chain)`);
  }
  /* beta-g 9 Nov: Swat merged (one website), Osh medical faculty to its parent; Madan Bhandari and EAUR stay two campuses */
  const to = (from: string) => merges.merges.find((x) => x.from === from)?.to;
  assert.equal(to("osh-state-medical-faculty"), "osh-state-university");
  assert.ok(to("university-of-swat") || to("university-of-engineering-and-applied-sciences-swat"), "the Swat pair is one page");
  for (const s of ["madan-bhandari-university", "madan-bhandari-university-of-science-and-technology", "east-african-university-rwanda", "east-african-university-rwanda-eaur"])
    assert.ok(pages.has(s), `${s} kept as its own campus page`);
  /* the total drops by exactly the number merged (rows marked publishable:false were never counted) */
  const live = (publishable as University[]).filter((u) => u.publishable !== false).length;
  assert.equal(getAllCountries().reduce((n, c) => n + c.count, 0), live - merges.merges.length);
});
