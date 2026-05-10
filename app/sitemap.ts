import type { MetadataRoute } from "next";
import { getAllCountries } from "@/lib/page-relations";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://almistudy.almiworld.com";
  const lastModified = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/universities`, lastModified, changeFrequency: "weekly", priority: 0.9 }
  ];
  const countryEntries: MetadataRoute.Sitemap = getAllCountries().map((c) => ({
    url: `${base}/universities/${c.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7
  }));
  return [...staticEntries, ...countryEntries];
}
