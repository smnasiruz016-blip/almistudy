import type { NextConfig } from "next";

// COST FIX (Oct 2026): the 301 /study/:country/:subject/:uni →
// /university/:uni/:subject was removed. Both ends are now gone pages (owner
// ruling 17 Oct: deleted, no redirects), so /study/... answers 410 Gone
// directly from proxy.ts instead of redirecting into another 410.
const nextConfig: NextConfig = {};

export default nextConfig;
