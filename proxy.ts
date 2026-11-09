import { NextResponse, type NextRequest } from "next/server";
import { REGION_PAGE_SLUGS } from "./lib/region-slugs";

// COST FIX (Oct 2026): the old programmatic pages are removed (owner ruling,
// 17 Oct: deleted, no redirects). Their URL families answer 410 Gone here,
// before any render, ISR write or build-time page:
//   /study/...              (country x subject, from-{origin} guides, old uni triples)
//   /subjects/{subject}
//   /regions/{region}
//   /university/{slug}/{subject} and /university/{slug}/{subject}/{origin}
// NOT matched: /university/{slug} (kept), /universities, /universities/{country},
// the home page, sitemaps, robots and assets.
//
// RR-408 A3/A8: the region pages of the home page's "Browse by region" (lib/region-slugs.ts, ten at most, prebuilt
// and static) pass through. Every other /regions/... (the old continents asia, south-america, anything else) stays
// 410 Gone, as the 17 Oct ruling set.
const LIVE_REGIONS = new Set<string>(REGION_PAGE_SLUGS.map((s) => `/regions/${s}`));

export function proxy(request: NextRequest) {
  if (LIVE_REGIONS.has(request.nextUrl.pathname.replace(/\/+$/, ""))) return NextResponse.next();
  return new NextResponse("410 Gone — this page has been removed.", {
    status: 410,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
      "x-robots-tag": "noindex",
    },
  });
}

export const config = {
  matcher: [
    "/study/:path+",
    "/subjects/:path+",
    "/regions/:path+",
    "/university/:slug/:subject",
    "/university/:slug/:subject/:origin",
  ],
};
