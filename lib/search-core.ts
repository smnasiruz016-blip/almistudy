/**
 * RR-408 A2 · THE SEARCH ITSELF: pure functions over the static index (lib/search-index.ts builds it; the browser
 * fetches it from /search-index.json). Imported by the home-page search box AND by the tests, so what the tests
 * prove is what a student gets. Never imports the university data: this file goes to the browser.
 */

/** one university: [slug, name, city, country#, subjectBits, control#, body#, registry#, verified#, website, rawSubject#[]] */
export type Row = [string, string, string, number, number, number, number, number, number, string, number[]];
export type SearchIndex = {
  v: 1;
  total: number;
  countries: Array<[slug: string, name: string]>;
  subjects: Array<[slug: string, name: string]>;
  strings: string[]; // control types, bodies, registry links, dates, raw subject names; index 0 = ""
  rows: Row[];
};

/** lower case, accents off ("Université" finds "universite"), every non-letter a space; other scripts kept */
export const fold = (x: string) =>
  x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export type Query = { q?: string; country?: string; subject?: string };
export type Hit = { row: Row; score: number };

const folded = new WeakMap<SearchIndex, Array<{ name: string; city: string }>>();
function foldedOf(ix: SearchIndex) {
  let f = folded.get(ix);
  if (!f) {
    f = ix.rows.map((r) => ({ name: ` ${fold(r[1])} `, city: ` ${fold(r[2])} ` }));
    folded.set(ix, f);
  }
  return f;
}

/**
 * Every word of the query must START a word of the name (the English and the local name are both in it) or of the
 * city. The country and subject filters narrow. Ranked: a name that starts with the query, a name holding the whole
 * query, more words in the name than in the city; then A to Z.
 */
export function search(ix: SearchIndex, { q = "", country = "", subject = "" }: Query): Hit[] {
  const words = fold(q).split(" ").filter(Boolean);
  const ci = country ? ix.countries.findIndex(([slug]) => slug === country) : -1;
  if (country && ci < 0) return [];
  const si = subject ? ix.subjects.findIndex(([slug]) => slug === subject) : -1;
  if (subject && si < 0) return [];
  const f = foldedOf(ix);
  const phrase = ` ${words.join(" ")}`;
  const out: Hit[] = [];
  ix.rows.forEach((r, i) => {
    if (ci >= 0 && r[3] !== ci) return;
    if (si >= 0 && !(r[4] & (1 << si))) return;
    if (!words.length) {
      out.push({ row: r, score: 0 });
      return;
    }
    let inName = 0;
    let inCity = 0;
    for (const w of words) {
      if (f[i].name.includes(` ${w}`)) inName++;
      else if (f[i].city.includes(` ${w}`)) inCity++;
      else return;
    }
    const score = (f[i].name.startsWith(phrase) ? 4 : 0) + (f[i].name.includes(phrase) ? 2 : 0) + inName - (inCity ? 1 : 0);
    out.push({ row: r, score });
  });
  return out.sort((a, b) => b.score - a.score || a.row[1].localeCompare(b.row[1]));
}

/** the suggestions under the box: the best few names, each with its city and country */
export function suggest(ix: SearchIndex, q: string, n = 6): Array<{ slug: string; name: string; place: string }> {
  if (fold(q).length < 2) return [];
  return search(ix, { q })
    .slice(0, n)
    .map(({ row }) => ({ slug: row[0], name: row[1], place: [row[2], ix.countries[row[3]][1]].filter(Boolean).join(", ") }));
}

export const PAGE_SIZE = 20;
