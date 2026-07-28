import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /study/<country>/<subject>/<uni> was 19,310 prebuilt pages duplicating
      // /university/<uni>/<subject> — the same "study X at Y" content under a second
      // URL. Now a single 301 rule instead of 19,310 built pages:
      //   • halves the build (44,171 → 24,861 pages)
      //   • removes the duplicate-content surface entirely
      //   • keeps every existing inbound and internal link working
      //
      // SAFE BY MEASUREMENT, not assumption: all 19,310 triples were checked against
      // the prebuilt pair set and 0 had a missing canonical target, so no redirect can
      // land on a 404. The triples come from getUniversitiesByCountrySubject(), which
      // only returns a university for a subject it actually teaches — the same
      // real-data gate that decides which /university/<uni>/<subject> pages exist, so
      // the two sets cannot diverge.
      //
      // The link sites that pointed here (app/study/[country]/[subject] and
      // app/university/[slug]) now emit one hop. The route directory is deleted; this
      // rule is what serves those URLs.
      {
        source: "/study/:country/:subject/:uni",
        destination: "/university/:uni/:subject",
        permanent: true, // 301 — the university URL is the canonical one
      },
    ];
  },
};

export default nextConfig;
