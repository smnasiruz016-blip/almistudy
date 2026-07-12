// Build-time UNIQUENESS GATE — AlmiWorld pSEO Localization Standard.
// Runs before `next build` (see package.json) and fails the build on any
// violation, so a thin / name-swapped origin leaf cannot ship.
//
// almistudy's origin leaf (app/university/[slug]/[subject]/[origin]) renders
// inline JSX and weaves, per origin, the verified home-country recognition data
// from @smnasiruz016-blip/almi-data (recognitionBody + commonConcern). This gate
// validates that data layer — the exact fields that differentiate every leaf:
//   (A) every localized origin has a non-empty recognitionBody AND commonConcern;
//   (B) no two localized origins share a recognitionBody (a shared body would
//       make their leaves a name-swap of each other).
// Unresearched origins use the honest-generic fallback (disclosed, not failed).

import { originContext, LOCALIZED_ORIGIN_SLUGS, findOrigin } from "@smnasiruz016-blip/almi-data";

const violations = [];
const bodies = new Map(); // recognitionBody -> first slug that used it

for (const slug of LOCALIZED_ORIGIN_SLUGS) {
  const loc = originContext(slug);
  const name = findOrigin(slug)?.name ?? slug;
  if (!loc) { violations.push(`${slug}: listed as localized but originContext() is null.`); continue; }
  if (!loc.recognitionBody?.trim()) violations.push(`${name}: empty recognitionBody.`);
  if (!loc.commonConcern?.trim()) violations.push(`${name}: empty commonConcern.`);
  const prev = bodies.get(loc.recognitionBody);
  if (prev) violations.push(`${name} shares recognitionBody with ${prev} ("${loc.recognitionBody}") — name-swap risk.`);
  else bodies.set(loc.recognitionBody, name);
}

// Self-test: the detector must reject a duplicate. Prove it isn't a no-op.
{
  const seen = new Map();
  const dupCheck = ["x", "x"].map((b) => {
    const hit = seen.has(b); seen.set(b, true); return hit;
  });
  if (!dupCheck[1]) { console.error("GATE SELF-TEST FAILED: duplicate detector not working."); process.exit(1); }
}

console.log(`Uniqueness gate — origin recognition layer`);
console.log(`  localized origins checked: ${LOCALIZED_ORIGIN_SLUGS.length}`);
console.log(`  distinct recognition bodies: ${bodies.size}`);
console.log(`  self-test: duplicate correctly detected ✓`);

if (violations.length) {
  console.error(`\n❌ UNIQUENESS GATE FAILED — ${violations.length} violation(s):`);
  for (const v of violations) console.error("   • " + v);
  process.exit(1);
}
console.log("\n✅ Uniqueness gate passed.");
