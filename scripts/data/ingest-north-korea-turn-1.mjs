import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// DPRK / North Korea Turn 1 (22 rows, UNI_1297-UNI_1318) per Nasir directive.
//   - 0 promotions; 22 net-new
//   - 2 historical-name slug fixes (college -> university post-rename)
//   - No URL backfill needed (0 rows ship phone or email)
//   - Boilerplate count-accurate (5+17=22 ✓)

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISHABLE_PATH = resolve(__dirname, "../../lib/universities-publishable.json");
const INPUT_PATH =
  process.argv[2] ??
  resolve(
    process.env.USERPROFILE ?? "",
    "OneDrive/Desktop/almi cleand uni data/AlmiStudy_North_Korea_Cleaned.json",
  );

// Historical-name slug fixes (Iraq UNI_1039 + Kazakhstan UNI_1136 precedent).
// Both institutions were promoted from "College" to "University" status;
// curator's name reflects the current institutional name.
const SLUG_FIX = {
  UNI_1302: "pyongyang-medical-university",
  UNI_1311: "chongjin-mining-and-metallurgy-university",
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

function main() {
  const incoming = JSON.parse(readFileSync(INPUT_PATH, "utf8")).map(normalizeIncoming);
  const publishable = JSON.parse(readFileSync(PUBLISHABLE_PATH, "utf8"));
  const outPublishable = publishable.concat(incoming);
  writeFileSync(PUBLISHABLE_PATH, JSON.stringify(outPublishable, null, 2) + "\n", "utf8");
  console.log(`north-korea-turn-1: net-new ${incoming.length}, publishable ${outPublishable.length}`);
}

main();
