import { buildSearchIndex } from "@/lib/search-index";

// RR-408 A2: written once at build time and served from the CDN (no function per search, no ISR write).
export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  return new Response(JSON.stringify(buildSearchIndex()), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      // a search file is not a page: never indexed
      "x-robots-tag": "noindex",
    },
  });
}
