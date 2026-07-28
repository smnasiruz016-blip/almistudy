/**
 * Manual sitemap index — lists the chunk sitemaps that generateSitemaps() emits
 * (Next 16 does NOT auto-aggregate them). Lives at /sitemap-index.xml (NOT
 * /sitemap.xml, which collides with the metadata route). Submit THIS URL to GSC.
 *
 * Chunk count comes from numSitemapChunks() in app/sitemap.ts — single source,
 * so the index can never advertise a phantom /sitemap/N.xml that 404s.
 */
import { numSitemapChunks, LASTMOD } from "@/app/sitemap";

const SITE = "https://almistudy.almiworld.com";

export function GET() {
  // Data-snapshot date, NOT wall-clock — imported from app/sitemap.ts so the index
  // and the chunks can never disagree about when the data last changed.
  //
  // This line was the ISR bill. `new Date().toISOString()` stamped a fresh
  // millisecond onto all 86 chunk entries on EVERY fetch, so each crawl of the index
  // saw all ~3.8M URLs as just-modified and re-crawled at maximum rate — driving
  // first-write ISR generation deeper into the matrix. Measured on prod 2026-07-28:
  // two fetches 348ms apart returned 20:15:01.191Z and 20:15:01.539Z.
  //
  // The 2026-07-12 fix (006aec2) set this constant in app/sitemap.ts but never
  // touched this file, which is why the bill came back while the fix looked applied.
  const lastmod = LASTMOD.toISOString();
  const entries = Array.from({ length: numSitemapChunks() }, (_, i) =>
    `  <sitemap>
    <loc>${SITE}/sitemap/${i}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`,
  ).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
