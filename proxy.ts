import { NextResponse } from "next/server";

// COST FIX (Oct 2026): the old programmatic pages are removed (owner ruling,
// 17 Oct: deleted, no redirects). Their URL families answer 410 Gone here,
// before any render, ISR write or build-time page:
//   /study/...              (country x subject, from-{origin} guides, old uni triples)
//   /subjects/{subject}
//   /regions/{region}
//   /university/{slug}/{subject} and /university/{slug}/{subject}/{origin}
// NOT matched: /university/{slug} (kept), /universities, /universities/{country},
// the home page, sitemaps, robots and assets.
export function proxy() {
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
