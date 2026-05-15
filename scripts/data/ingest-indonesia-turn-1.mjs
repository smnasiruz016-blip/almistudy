import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Indonesia Turn 1 of multi-turn build (per Nasir directive).
// Reads `AlmiStudy_Indonesia_Cleaned.json` (84 rows, UNI_0877-UNI_0960):
//   - 1 promotion from flagged (UI: incoming UNI_0877 -> existing UNI_0091)
//     with slug language-change english -> bahasa indonesia
//     ("university-of-indonesia" -> "universitas-indonesia")
//   - 83 net-new appended to publishable
//   - 2 curator record-level fixes (UNI_0950 slug+name; UNI_0958 slug)
// Removes the promoted row from `universities-flagged.json` and rewrites
// `lib/universities-publishable.json`.

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISHABLE_PATH = resolve(__dirname, "../../lib/universities-publishable.json");
const FLAGGED_PATH = resolve(__dirname, "../../lib/universities-flagged.json");
const INPUT_PATH =
  process.argv[2] ??
  resolve(
    process.env.USERPROFILE ?? "",
    "OneDrive/Desktop/almi cleand uni data/AlmiStudy_Indonesia_Cleaned.json",
  );

// Incoming UNI_NNNN -> existing flagged UNI_NNNN to promote into.
const FLAGGED_PROMOTION_MAP = {
  UNI_0877: "UNI_0091", // Universitas Indonesia (was University of Indonesia)
};

// Record-level fixes for curator slug/name errors caught in pre-flight.
const RECORD_FIXES = {
  UNI_0950: {
    slug: "universitas-bangka-belitung",
    name: "Universitas Bangka Belitung (UBB)",
  },
  UNI_0958: {
    slug: "universitas-nusa-putra",
  },
};

// admissionsUrl backfill for 4 collector rows that ship mainPhone +
// admissionsEmail but no URL pair (UI promotion inherits admission.ui.ac.id
// from the existing flagged record). Sourced via WebFetch 2026-05-15.
const URL_BACKFILL = {
  UNI_0878: { admissionsUrl: "https://admission.ugm.ac.id/" },
  UNI_0879: { admissionsUrl: "https://ppmb.unair.ac.id" },
  UNI_0880: { admissionsUrl: "https://smb.telkomuniversity.ac.id" },
  UNI_0881: { admissionsUrl: "https://admission.unpad.ac.id/" },
};

// Validator rejects null for these fields (URL fields permit null; these
// don't). Drop them when null so the validator treats them as absent.
const STRIP_IF_NULL = ["admissionsEmail", "mainPhone", "deadlinesNote"];

function normalizeIncoming(row) {
  const out = { ...row };
  for (const f of STRIP_IF_NULL) {
    if (out[f] === null) delete out[f];
  }
  const fix = RECORD_FIXES[out.id];
  if (fix) {
    if (fix.slug) out.slug = fix.slug;
    if (fix.name) out.name = fix.name;
  }
  const backfill = URL_BACKFILL[out.id];
  if (backfill) {
    if (backfill.admissionsUrl !== undefined) out.admissionsUrl = backfill.admissionsUrl;
    if (backfill.contactUrl !== undefined) out.contactUrl = backfill.contactUrl;
  }
  return out;
}

// Promote a flagged record by overwriting its payload with the incoming
// curator-research record. Keep existing id; take incoming slug (the file's
// convention is local-language for all 84 Indonesia rows). Force
// publishable=true. Preserve any existing field that the incoming sets to
// null or omits — this protects verified URLs (admissionsUrl, contactUrl)
// from being clobbered by the incoming's blanket nulls.
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
    `indonesia-turn-1: promoted ${promoted} (flagged->publishable), net-new ${netNew}, ` +
      `publishable ${outPublishable.length}, flagged ${outFlagged.length}`,
  );
}

main();
