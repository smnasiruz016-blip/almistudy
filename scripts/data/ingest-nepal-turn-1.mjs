import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Nepal Turn 1 (25 rows, UNI_1272-UNI_1296) per Nasir directive.
//   - 1 publishable->publishable promote-in-place (UNI_1294 -> existing
//     UNI_0148 Tribhuvan University Institute of Medicine; existing slug
//     preserved per promote-pattern "drop abbreviation slug suffixes")
//   - 24 net-new
//   - 1 slug fix (slug-borrowed pattern)
//   - 4 admissionsUrl backfills

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISHABLE_PATH = resolve(__dirname, "../../lib/universities-publishable.json");
const INPUT_PATH =
  process.argv[2] ??
  resolve(
    process.env.USERPROFILE ?? "",
    "OneDrive/Desktop/almi cleand uni data/AlmiStudy_Nepal_Cleaned.json",
  );

// Incoming UNI_NNNN -> existing publishable UNI_NNNN to merge into.
// Same shape as India PR #83 promote-in-place (collector row duplicates an
// existing publishable; preserve existing id + existing slug per "drop
// abbreviation slug suffixes" rule).
const PUBLISHABLE_PROMOTION_MAP = {
  UNI_1294: "UNI_0148", // TU Institute of Medicine -> Tribhuvan University Institute of Medicine
};

const SLUG_FIX = {
  // slug "shankaracharya-sanskrit-university" refers to a different
  // institution (Shankaracharya is an Adi Shankaracharya namesake); body
  // identifies Pashupati Sanskrit University. Slug-borrowed-from-wrong-
  // institution pattern.
  UNI_1296: "pashupati-sanskrit-university",
};

const URL_BACKFILL = {
  // TU SSL chain unverifiable from fetcher ("certificate has expired");
  // fallback to institutional homepage. +977-1-4330-433 +
  // admissions@tu.edu.np real per TU public contact info.
  UNI_1272: { admissionsUrl: "https://www.tu.edu.np" },
  UNI_1273: { admissionsUrl: "https://ku.edu.np/admission" },
  UNI_1274: { admissionsUrl: "https://pu.edu.np/admission/" },
  // Purbanchal ECONNREFUSED from fetcher; fallback to institutional
  // homepage.
  UNI_1275: { admissionsUrl: "https://purbu.edu.np" },
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

// Promote-in-place into an existing publishable row: keep existing id and
// existing slug (per "drop abbreviation slug suffixes" rule — existing
// `tribhuvan-university-institute-of-medicine` is more descriptive than
// incoming `tu-institute-of-medicine`). Force publishable=true. Preserve
// any existing field the incoming sets to null/undefined.
function mergePublishablePromotion(existing, incoming) {
  const merged = {
    ...incoming,
    id: existing.id,
    slug: existing.slug,
    publishable: true,
  };
  for (const k of Object.keys(existing)) {
    if (merged[k] === undefined || merged[k] === null) merged[k] = existing[k];
  }
  return merged;
}

function main() {
  const incoming = JSON.parse(readFileSync(INPUT_PATH, "utf8")).map(normalizeIncoming);
  const publishable = JSON.parse(readFileSync(PUBLISHABLE_PATH, "utf8"));
  const idIndex = new Map(publishable.map((r, i) => [r.id, i]));

  let promoted = 0;
  let netNew = 0;
  const output = publishable.slice();

  for (const row of incoming) {
    const targetId = PUBLISHABLE_PROMOTION_MAP[row.id];
    if (targetId) {
      const idx = idIndex.get(targetId);
      if (idx === undefined) {
        throw new Error(`Publishable promotion target ${targetId} not found for incoming ${row.id}`);
      }
      output[idx] = mergePublishablePromotion(output[idx], row);
      promoted++;
    } else {
      output.push(row);
      netNew++;
    }
  }

  writeFileSync(PUBLISHABLE_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(
    `nepal-turn-1: promoted ${promoted} (publishable in-place), net-new ${netNew}, total publishable ${output.length}`,
  );
}

main();
