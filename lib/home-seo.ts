/**
 * RR-408 A8 · the home page's canonical and its WebSite + SearchAction structured data. The SearchAction lands on
 * the home page itself ("/?q=…", the search box runs it); that address answers X-Robots-Tag: noindex
 * (next.config.ts), and the page's canonical stays the bare home, so a search never becomes an indexable URL.
 */
export const SITE_URL = "https://almistudy.almiworld.com";
export const HOME_CANONICAL = `${SITE_URL}/`;
export const SEARCH_URL_TEMPLATE = `${SITE_URL}/?q={search_term_string}`;

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AlmiStudy",
    url: HOME_CANONICAL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: SEARCH_URL_TEMPLATE },
      "query-input": "required name=search_term_string",
    },
  };
}

/** popular study destinations (A4): one click to the country's list; a slug the data lacks is left out */
export const CHIP_SLUGS: Array<{ slug: string; label: string }> = [
  { slug: "united-kingdom", label: "UK" },
  { slug: "united-states", label: "USA" },
  { slug: "canada", label: "Canada" },
  { slug: "australia", label: "Australia" },
  { slug: "germany", label: "Germany" },
  { slug: "turkiye", label: "Turkey" },
  { slug: "malaysia", label: "Malaysia" },
  { slug: "china", label: "China" },
];
