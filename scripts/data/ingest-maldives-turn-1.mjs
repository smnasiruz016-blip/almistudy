import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Maldives Turn 1 (15 rows, UNI_1232-UNI_1246) per Nasir directive.
//   - 0 promotions; 15 net-new
//   - 2 slug fixes (slug-borrowed-from-wrong-institution pattern)
//   - 4 admissionsUrl backfills for collector rows

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISHABLE_PATH = resolve(__dirname, "../../lib/universities-publishable.json");
const INPUT_PATH =
  process.argv[2] ??
  resolve(
    process.env.USERPROFILE ?? "",
    "OneDrive/Desktop/almi cleand uni data/AlmiStudy_Maldives_Cleaned.json",
  );

// Slug-borrowed-from-wrong-institution fixes (Indonesia PR #84 UNI_0950/0958
// + Iraq PR #86 UNI_1040 precedent).
const SLUG_FIX = {
  // slug "maldives-institute-of-tourism-and-hospitality" belongs to a
  // different institution; body says "Faculty of Hospitality and Tourism
  // Studies, MNU". Pattern-matched to UNI_1243 "faculty-of-health-
  // sciences-mnu".
  UNI_1242: "faculty-of-hospitality-and-tourism-studies-mnu",
  // slug "mandhu-school-of-education" — Mandhu College is at UNI_1236; body
  // says "MNU Centre for Open Learning (CFOL)". Pattern-matched to
  // UNI_1244/1245 "mnu-X-campus".
  UNI_1246: "mnu-centre-for-open-learning",
};

// admissionsUrl backfill for 4 collector rows. WebFetch-verified 2026-05-15.
const URL_BACKFILL = {
  UNI_1232: { admissionsUrl: "https://portal.mnu.edu.mv/" },
  UNI_1233: { admissionsUrl: "https://villacollege.edu.mv/adminssion-requirments" },
  // IUM cert chain unverifiable from fetcher ("unable to verify first
  // certificate"); fallback to institutional homepage. +960-302-0200 +
  // admissions@ium.edu.mv real per IUM public contact info.
  UNI_1234: { admissionsUrl: "https://ium.edu.mv" },
  UNI_1235: { admissionsUrl: "https://apply.cyryxcollege.edu.mv/" },
};

const STRIP_IF_NULL = ["admissionsEmail", "mainPhone", "deadlinesNote"];

function normalizeIncoming(row) {
  const out = { ...row };
  for (const f of STRIP_IF_NULL) {
    if (out[f] === null) delete out[f];
  }
  if (SLUG_FIX[out.id]) out.slug = SLUG_FIX[out.id];
  const backfill = URL_BACKFILL[out.id];
  if (backfill) {
    if (backfill.admissionsUrl !== undefined) out.admissionsUrl = backfill.admissionsUrl;
    if (backfill.contactUrl !== undefined) out.contactUrl = backfill.contactUrl;
  }
  return out;
}

function main() {
  const incoming = JSON.parse(readFileSync(INPUT_PATH, "utf8")).map(normalizeIncoming);
  const publishable = JSON.parse(readFileSync(PUBLISHABLE_PATH, "utf8"));
  const outPublishable = publishable.concat(incoming);
  writeFileSync(PUBLISHABLE_PATH, JSON.stringify(outPublishable, null, 2) + "\n", "utf8");
  console.log(`maldives-turn-1: net-new ${incoming.length}, publishable ${outPublishable.length}`);
}

main();
