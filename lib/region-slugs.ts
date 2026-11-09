/**
 * RR-408 · the region page slugs, with no data import (proxy.ts reads this on every /regions request, so it must stay
 * tiny). lib/regions.ts holds the same list as REGION_ORDER; scripts/rr408-home-search.test.mts asserts they are equal.
 */
export const REGION_PAGE_SLUGS = [
  "europe",
  "north-america",
  "south-asia",
  "east-asia",
  "southeast-asia",
  "middle-east",
  "central-asia",
  "africa",
  "latin-america",
  "oceania",
] as const;
