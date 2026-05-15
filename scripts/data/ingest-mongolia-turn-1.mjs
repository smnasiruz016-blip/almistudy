import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Mongolia Turn 1 (25 rows, UNI_1247-UNI_1271) per Nasir directive.
//   - 0 promotions; 25 net-new
//   - 2 slug fixes (slug-borrowed + ambiguous-disambiguation)
//   - 5 admissionsUrl backfills for collector rows
//   - Boilerplate count-accurate (no normalisation)

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISHABLE_PATH = resolve(__dirname, "../../lib/universities-publishable.json");
const INPUT_PATH =
  process.argv[2] ??
  resolve(
    process.env.USERPROFILE ?? "",
    "OneDrive/Desktop/almi cleand uni data/AlmiStudy_Mongolia_Cleaned.json",
  );

const SLUG_FIX = {
  // slug "mongolia-international-school-of-business" belongs to MISB
  // (a different institution); body unambiguously identifies Institute of
  // Finance and Economics (IFE / Сангийн Эдийн Засгийн Дээд Сургууль).
  // Slug-borrowed-from-wrong-institution pattern (Indonesia/Iraq/Maldives
  // precedent).
  UNI_1266: "institute-of-finance-and-economics",
  // slug "national-academy-of-sciences-of-mongolia" is ambiguous — it would
  // refer to the parent research academy, not the Postgraduate Institute
  // (only the Postgraduate Institute trains students). Fix to be specific.
  UNI_1268: "mongolian-academy-of-sciences-postgraduate-institute",
};

// admissionsUrl backfill for 5 collector rows. WebFetch sourced 2026-05-15.
const URL_BACKFILL = {
  UNI_1247: { admissionsUrl: "https://elselt.num.edu.mn/" },
  UNI_1248: { admissionsUrl: "https://elselt.edu.mn/" },
  UNI_1249: { admissionsUrl: "https://elselt.mnums.edu.mn" },
  // MULS cert chain unverifiable from fetcher ("unable to verify first
  // certificate"); fallback to institutional homepage. +976-11-341-774 +
  // admissions@muls.edu.mn real per MULS public contact info.
  UNI_1250: { admissionsUrl: "https://muls.edu.mn" },
  UNI_1251: { admissionsUrl: "https://burtgel.msue.edu.mn/" },
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
  console.log(`mongolia-turn-1: net-new ${incoming.length}, publishable ${outPublishable.length}`);
}

main();
