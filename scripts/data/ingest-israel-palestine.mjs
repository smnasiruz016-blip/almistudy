import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Israel + Palestine dual-country file (24 rows, UNI_1047-UNI_1070; 11 IL +
// 13 PS) per Nasir's "full standard treatment" directive.
//   - 1 flagged->publishable promotion (UNI_1048 Tel Aviv -> existing
//     UNI_0094 in lib/universities-flagged.json)
//   - 23 net-new appended to publishable
//   - 5 IL flagship admissionsUrl backfills (validator requires URL pair
//     for admissionsEmail + mainPhone). Sourced via WebFetch 2026-05-15.

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISHABLE_PATH = resolve(__dirname, "../../lib/universities-publishable.json");
const FLAGGED_PATH = resolve(__dirname, "../../lib/universities-flagged.json");
const INPUT_PATH =
  process.argv[2] ??
  resolve(
    process.env.USERPROFILE ?? "",
    "OneDrive/Desktop/almi cleand uni data/AlmiStudy_Israel_Palestine_Cleaned.json",
  );

// Incoming UNI_NNNN -> existing flagged UNI_NNNN to promote into.
const FLAGGED_PROMOTION_MAP = {
  UNI_1048: "UNI_0094", // Tel Aviv University
};

// admissionsUrl backfill for 5 IL flagship rows that ship mainPhone +
// admissionsEmail but null URLs. UNI_1048 backfill targets UNI_0094 after
// the promotion rewrites the id.
const URL_BACKFILL = {
  UNI_1047: { admissionsUrl: "https://overseas.huji.ac.il/admissions/apply-now/" },
  UNI_1048: { admissionsUrl: "https://international.tau.ac.il/" },
  UNI_1049: { admissionsUrl: "https://www.technion.ac.il/en/admission/" },
  // BGU's institutional infrastructure sits behind Akamai bot protection
  // that rejected every WebFetch attempt (ECONNREFUSED + Akamai stub
  // shells). Falling back to the canonical Wikipedia-cited official site;
  // users navigate to admissions from there. The +972-8-646-1111 phone +
  // admissions@bgu.ac.il email are real per BGU contact info.
  UNI_1050: { admissionsUrl: "https://www.bgu.ac.il/en/" },
  UNI_1051: {
    admissionsUrl:
      "https://www.biu.ac.il/en/registration-and-admission/information/registration",
  },
};

const STRIP_IF_NULL = ["admissionsEmail", "mainPhone", "deadlinesNote"];

function normalizeIncoming(row) {
  const out = { ...row };
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

// Promote a flagged record: replace payload with incoming, keep existing
// id, take incoming slug (slug already matches in this case), force
// publishable=true, preserve any existing field the incoming sets to
// null/undefined.
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
    `israel-palestine: promoted ${promoted} (flagged->publishable), net-new ${netNew}, ` +
      `publishable ${outPublishable.length}, flagged ${outFlagged.length}`,
  );
}

main();
