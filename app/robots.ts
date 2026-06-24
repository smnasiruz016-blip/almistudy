import type { MetadataRoute } from "next";

// Points crawlers at the chunked sitemap INDEX (not the per-chunk files).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] }],
    sitemap: "https://almistudy.almiworld.com/sitemap-index.xml",
    host: "https://almistudy.almiworld.com",
  };
}
