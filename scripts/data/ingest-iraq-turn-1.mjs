import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Iraq Turn 1 of multi-turn build (per Nasir directive).
// Reads `AlmiStudy_Iraq_Cleaned.json` (42 rows, UNI_1005-UNI_1046):
//   - 0 promotions (no existing Iraq rows in publishable or flagged)
//   - 42 net-new appended to publishable
//   - 2 curator slug fixes (UNI_1040 wrong slug, UNI_1039 historical-name slug)
//   - source.description boilerplate normalised "44 curator-research" -> "36"
//     to match the actual 6+36=42 split

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISHABLE_PATH = resolve(__dirname, "../../lib/universities-publishable.json");
const INPUT_PATH =
  process.argv[2] ??
  resolve(
    process.env.USERPROFILE ?? "",
    "OneDrive/Desktop/almi cleand uni data/AlmiStudy_Iraq_Cleaned.json",
  );

// Curator slug corrections (caught in pre-flight slug-words-not-in-name scan).
const SLUG_FIX = {
  // Slug borrowed from a different institution (Maysan); body unambiguously
  // identifies University of Sumer in Rifai/Thi-Qar.
  UNI_1040: "university-of-sumer",
  // Institution gained full university status ~2021 and now calls itself
  // "Al-Mustaqbal University"; the "-college" suffix is historical.
  UNI_1039: "al-mustaqbal-university",
};

const STRIP_IF_NULL = ["admissionsEmail", "mainPhone", "deadlinesNote"];

function normalizeIncoming(row) {
  const out = { ...row };
  if (out.source?.description) {
    out.source = {
      ...out.source,
      description: out.source.description.replace(
        "44 curator-research expansion",
        "36 curator-research expansion",
      ),
    };
  }
  for (const f of STRIP_IF_NULL) {
    if (out[f] === null) delete out[f];
  }
  if (SLUG_FIX[out.id]) out.slug = SLUG_FIX[out.id];
  return out;
}

function main() {
  const incoming = JSON.parse(readFileSync(INPUT_PATH, "utf8")).map(normalizeIncoming);
  const publishable = JSON.parse(readFileSync(PUBLISHABLE_PATH, "utf8"));
  const outPublishable = publishable.concat(incoming);
  writeFileSync(PUBLISHABLE_PATH, JSON.stringify(outPublishable, null, 2) + "\n", "utf8");
  console.log(`iraq-turn-1: net-new ${incoming.length}, publishable ${outPublishable.length}`);
}

main();
