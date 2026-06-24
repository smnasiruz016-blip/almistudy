/**
 * Manual sitemap index — lists the chunk sitemaps that generateSitemaps() emits
 * (Next 16 does NOT auto-aggregate them). Lives at /sitemap-index.xml (NOT
 * /sitemap.xml, which collides with the metadata route). Submit THIS URL to GSC.
 *
 * Chunk count comes from numSitemapChunks() in app/sitemap.ts — single source,
 * so the index can never advertise a phantom /sitemap/N.xml that 404s.
 */
import { numSitemapChunks } from "@/app/sitemap";

const SITE = "https://almistudy.almiworld.com";

export function GET() {
  const now = new Date().toISOString();
  const entries = Array.from({ length: numSitemapChunks() }, (_, i) =>
    `  <sitemap>
    <loc>${SITE}/sitemap/${i}.xml</loc>
    <lastmod>${now}</lastmod>
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
