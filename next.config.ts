import type { NextConfig } from "next";
import merges from "./lib/university-merges.json";

// COST FIX (Oct 2026): the 301 /study/:country/:subject/:uni →
// /university/:uni/:subject was removed. Both ends are now gone pages (owner
// ruling 17 Oct: deleted, no redirects), so /study/... answers 410 Gone
// directly from proxy.ts instead of redirecting into another 410.
const nextConfig: NextConfig = {
  // RR-408 A5: the same university listed twice. Each merged slug goes, permanently (Next's permanent = 308), to the
  // page that was kept (lib/university-merges.json); the merged slug left the pages and the sitemap (lib/page-relations.ts).
  async redirects() {
    return merges.merges.map((m) => ({
      source: `/university/${m.from}`,
      destination: `/university/${m.to}`,
      permanent: true,
    }));
  },
  // RR-408 A8: the WebSite SearchAction lands on "/?q=…" (the home-page search runs it in the browser). That address
  // is a search view, not a page: never indexed. The home page itself stays indexable, with its canonical.
  async headers() {
    return [
      {
        source: "/",
        has: [{ type: "query", key: "q" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      },
    ];
  },
};

export default nextConfig;
