import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Japan Turn 1 (50 rows, UNI_1071-UNI_1120) per Nasir directive.
//   - 4 flagged->publishable promotions (UTokyo / Kyoto / ISCT / Osaka)
//   - 46 net-new appended
//   - 1 curator slug fix (UNI_1087 "tohoku-region-2" leftover template slug)

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISHABLE_PATH = resolve(__dirname, "../../lib/universities-publishable.json");
const FLAGGED_PATH = resolve(__dirname, "../../lib/universities-flagged.json");
const INPUT_PATH =
  process.argv[2] ??
  resolve(
    process.env.USERPROFILE ?? "",
    "OneDrive/Desktop/almi cleand uni data/AlmiStudy_Japan_Cleaned.json",
  );

// Incoming UNI_NNNN -> existing flagged UNI_NNNN to promote into.
// UNI_0069's flagged slug "tokyo-institute-of-science" was a curator
// mistranslation; the post-2024-merger official English name is
// "Institute of Science Tokyo" (東京科学大学). Promotion takes the incoming
// slug + name (correct) while preserving the existing UNI_0069 id.
const FLAGGED_PROMOTION_MAP = {
  UNI_1071: "UNI_0066", // University of Tokyo (UTokyo)
  UNI_1072: "UNI_0067", // Kyoto University
  UNI_1073: "UNI_0069", // Institute of Science Tokyo (slug+name corrected)
  UNI_1077: "UNI_0068", // Osaka University
};

// Curator slug correction (slug-words-not-in-name scan caught it).
// "tohoku-region-2" is a leftover template/generation-step slug; the
// institution is Niigata University in Niigata Prefecture (Chubu region,
// not Tohoku).
const SLUG_FIX = {
  UNI_1087: "niigata-university",
};

const STRIP_IF_NULL = ["admissionsEmail", "mainPhone", "deadlinesNote"];

function normalizeIncoming(row) {
  const out = { ...row };
  for (const f of STRIP_IF_NULL) {
    if (out[f] === null) delete out[f];
  }
  if (SLUG_FIX[out.id]) out.slug = SLUG_FIX[out.id];
  return out;
}

// Promote a flagged record: replace payload with incoming, keep existing
// id, take incoming slug, force publishable=true, preserve any existing
// field the incoming sets to null/undefined (so verified admissionsUrls in
// the flagged rows survive blanket-null clobber).
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
    `japan-turn-1: promoted ${promoted}, net-new ${netNew}, ` +
      `publishable ${outPublishable.length}, flagged ${outFlagged.length}`,
  );
}

main();
