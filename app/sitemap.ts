import type { MetadataRoute } from "next";
import * as StaticIndex from "@/lib/static-index";

/**
 * Chunked sitemap (Next 16 generateSitemaps async-id pattern).
 *
 * The sitemap advertises EXACTLY what the routes prebuild — both read
 * lib/static-index.ts, so they cannot drift. scripts/sitemap-prebuild-gate.mjs
 * enforces SITEMAPPED ⊆ PREBUILT at build time.
 *
 * WHAT THIS USED TO BE (until 2026-07-28). It emitted ~3,828,938 URLs: ~24,868 real
 * pages plus 3,804,070 origin leaves (19,310 taught pairs × 197 origin countries),
 * none of which were prebuilt. Every one of those leaves minted itself on first
 * request at the cost of one ISR write, re-armed on every deploy. $89.07 on this
 * project in the 2026-07 cycle, $254.57 team-wide, against $4.36 of ISR reads.
 *
 * The origin leaves are gone from the routes (dynamicParams = false → they 404) and
 * so they are gone from here. Advertising a URL that 404s is worse than not
 * advertising it: it spends crawl budget to teach Google the page is missing.
 *
 * Next 16: `id` is a Promise — await it, then Number(...). The manual index at
 * app/sitemap-index.xml/route.ts derives its entries from numSitemapChunks(), so it
 * can never list a phantom chunk. Test via build + next start + curl, never tsx.
 */

const SITE = "https://almistudy.almiworld.com";
const CHUNK = 45_000; // under Google's 50k/sitemap cap

// Data-snapshot date, NOT wall-clock. The pages are built from static in-repo JSON;
// emitting `new Date()` told crawlers every URL "just changed" on every fetch, driving
// needless re-crawls (and thus ISR first-write cost). Bump this ONLY when the
// underlying university/subject/country data actually changes.
//
// Exported because app/sitemap-index.xml/route.ts needs the SAME value: it was still
// stamping wall-clock into every <lastmod> long after this constant was introduced
// here, which is why the 2026-07-12 fix looked applied while the bill continued.
export const LASTMOD = new Date("2026-07-12");

/** Priority + change frequency by path shape. Hubs rank above leaves. */
function weight(path: string): { priority: number; changeFrequency: "weekly" | "monthly" } {
  if (path === "") return { priority: 1.0, changeFrequency: "weekly" };
  if (path === "/universities") return { priority: 0.9, changeFrequency: "weekly" };
  if (path.startsWith("/subjects/")) return { priority: 0.8, changeFrequency: "weekly" };
  if (path.startsWith("/regions/")) return { priority: 0.7, changeFrequency: "weekly" };
  const depth = path.split("/").filter(Boolean).length;
  if (path.startsWith("/universities/")) return { priority: 0.7, changeFrequency: "monthly" };
  if (path.startsWith("/study/")) return { priority: 0.6, changeFrequency: "monthly" };
  return { priority: depth >= 3 ? 0.55 : 0.6, changeFrequency: "monthly" };
}

let _entries: MetadataRoute.Sitemap | null = null;
function entries(): MetadataRoute.Sitemap {
  if (_entries) return _entries;
  _entries = StaticIndex.sitemapPaths().map((path) => ({
    url: `${SITE}${path}`,
    lastModified: LASTMOD,
    ...weight(path),
  }));
  return _entries;
}

/** Total advertised URLs — the number the index and the gate both key off. */
export function totalSitemapUrls(): number {
  return entries().length;
}

export function numSitemapChunks(): number {
  return Math.max(1, Math.ceil(totalSitemapUrls() / CHUNK));
}

export async function generateSitemaps() {
  return Array.from({ length: numSitemapChunks() }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const idNum = Number(await id);
  const start = (Number.isNaN(idNum) ? 0 : idNum) * CHUNK;
  return entries().slice(start, start + CHUNK);
}
