import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Kazakhstan Turn 1 (35 rows, UNI_1121-UNI_1155) per Nasir directive.
//   - 0 promotions (no existing KZ rows in publishable or flagged)
//   - 35 net-new appended
//   - 2 historical-slug fixes per Iraq UNI_1039 precedent (match current
//     institutional name)
//   - 4 admissionsUrl backfills for the 4 collector rows (2 WebFetch
//     verified, 2 cert-fallback to officialWebsite since the Kazakh SSL
//     chain isn't trusted by the fetcher — same approach as BGU PR #87)
//   - source.description boilerplate "41 curator-research" -> "31"

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISHABLE_PATH = resolve(__dirname, "../../lib/universities-publishable.json");
const INPUT_PATH =
  process.argv[2] ??
  resolve(
    process.env.USERPROFILE ?? "",
    "OneDrive/Desktop/almi cleand uni data/AlmiStudy_Kazakhstan_Cleaned.json",
  );

// Historical-name slug fixes (institution rebranded, current name in cleaned
// file drops the obsolete qualifier).
const SLUG_FIX = {
  // "Semey State Medical University" -> "Semey Medical University" (post-
  // Soviet "State" qualifier dropped; current institutional name in file).
  UNI_1136: "semey-medical-university",
  // "Pavlodar State University named after S. Toraighyrov" -> "Toraighyrov
  // University" (renamed ~2020; current name in file).
  UNI_1144: "toraighyrov-university",
};

// admissionsUrl backfill for 4 collector rows that ship phone + email but
// null URLs. WebFetch sourced 2026-05-15.
const URL_BACKFILL = {
  // KazNU's farabi.university SSL chain isn't trusted by the fetcher
  // (cert-expired error). Falling back to officialWebsite as anchor;
  // +7-727-377-3333 and admissions@kaznu.kz are real per institutional
  // public records.
  UNI_1121: { admissionsUrl: "https://farabi.university" },
  // Satbayev University SSL chain unverifiable from fetcher. Falling back
  // to officialWebsite.
  UNI_1122: { admissionsUrl: "https://satbayev.university" },
  // Verified via WebFetch.
  UNI_1123: { admissionsUrl: "https://nu.edu.kz/admissions/" },
  // Verified via WebFetch. Note: the institution's current canonical site
  // is abaiuniversity.edu.kz; cleaned file's officialWebsite kaznpu.kz is
  // the older Russian-acronym domain (still redirects, but stale).
  UNI_1124: { admissionsUrl: "https://abaiuniversity.edu.kz/en/admission/" },
};

const STRIP_IF_NULL = ["admissionsEmail", "mainPhone", "deadlinesNote"];

function normalizeIncoming(row) {
  const out = { ...row };
  if (out.source?.description) {
    out.source = {
      ...out.source,
      description: out.source.description.replace(
        "41 curator-research expansion",
        "31 curator-research expansion",
      ),
    };
  }
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
  console.log(`kazakhstan-turn-1: net-new ${incoming.length}, publishable ${outPublishable.length}`);
}

main();
