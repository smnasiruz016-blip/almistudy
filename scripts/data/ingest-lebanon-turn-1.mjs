import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Lebanon Turn 1 (27 rows, UNI_1205-UNI_1231) per Nasir directive.
//   - 1 flagged->publishable promotion (UNI_1205 AUB -> existing UNI_0093)
//   - 26 net-new appended
//   - 2 admissionsUrl backfills for LAU + Lebanese University
//   - source.description boilerplate "27 curator-research" -> "24"

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISHABLE_PATH = resolve(__dirname, "../../lib/universities-publishable.json");
const FLAGGED_PATH = resolve(__dirname, "../../lib/universities-flagged.json");
const INPUT_PATH =
  process.argv[2] ??
  resolve(
    process.env.USERPROFILE ?? "",
    "OneDrive/Desktop/almi cleand uni data/AlmiStudy_Lebanon_Cleaned.json",
  );

const FLAGGED_PROMOTION_MAP = {
  UNI_1205: "UNI_0093", // American University of Beirut (AUB)
};

// admissionsUrl backfill for collector rows. WebFetch-verified 2026-05-15.
// AUB's flagged record already carries admissionsUrl=https://www.aub.edu.lb
// /admissions/ — merge logic preserves it via null-incoming-keep-existing,
// so no backfill needed for UNI_0093.
const URL_BACKFILL = {
  UNI_1206: { admissionsUrl: "https://www.lau.edu.lb/apply/" },
  // Lebanese University SSL chain not verifiable from fetcher ("unable to
  // verify first certificate"); falling back to institutional homepage as
  // anchor (same approach as BGU PR #87, KazNU PR #89, Iran UT/AUT PR #85).
  // +961-5-463-000 and admissions@ul.edu.lb are real per LU public contact
  // info.
  UNI_1207: { admissionsUrl: "https://www.ul.edu.lb" },
};

const STRIP_IF_NULL = ["admissionsEmail", "mainPhone", "deadlinesNote"];

function normalizeIncoming(row) {
  const out = { ...row };
  if (out.source?.description) {
    out.source = {
      ...out.source,
      description: out.source.description.replace(
        "27 curator-research expansion",
        "24 curator-research expansion",
      ),
    };
  }
  for (const f of STRIP_IF_NULL) {
    if (out[f] === null) delete out[f];
  }
  const backfill = URL_BACKFILL[out.id];
  if (backfill) {
    if (backfill.admissionsUrl !== undefined) out.admissionsUrl = backfill.admissionsUrl;
    if (backfill.contactUrl !== undefined) out.contactUrl = backfill.contactUrl;
  }
  return out;
}

function mergePromotion(existing, incoming) {
  const merged = {
    ...incoming,
    id: existing.id,
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
  const flagged = JSON.parse(readFileSync(FLAGGED_PATH, "utf8"));

  const flaggedById = new Map(flagged.map((r, i) => [r.id, i]));
  const flaggedIdxToRemove = new Set();

  let promoted = 0;
  let netNew = 0;
  const outPublishable = publishable.slice();

  for (const row of incoming) {
    const targetFlaggedId = FLAGGED_PROMOTION_MAP[row.id];
    if (targetFlaggedId) {
      const idx = flaggedById.get(targetFlaggedId);
      if (idx === undefined) {
        throw new Error(`Flagged promotion target ${targetFlaggedId} not found for incoming ${row.id}`);
      }
      const merged = mergePromotion(flagged[idx], row);
      outPublishable.push(merged);
      flaggedIdxToRemove.add(idx);
      promoted++;
    } else {
      outPublishable.push(row);
      netNew++;
    }
  }

  const outFlagged = flagged.filter((_, i) => !flaggedIdxToRemove.has(i));
  writeFileSync(PUBLISHABLE_PATH, JSON.stringify(outPublishable, null, 2) + "\n", "utf8");
  writeFileSync(FLAGGED_PATH, JSON.stringify(outFlagged, null, 2) + "\n", "utf8");

  console.log(
    `lebanon-turn-1: promoted ${promoted}, net-new ${netNew}, ` +
      `publishable ${outPublishable.length}, flagged ${outFlagged.length}`,
  );
}

main();
