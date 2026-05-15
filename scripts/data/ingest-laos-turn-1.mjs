import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Laos Turn 1 (22 rows, UNI_1183-UNI_1204) per Nasir directive.
//   - 0 promotions; 22 net-new
//   - 1 admissionsUrl backfill for the single collector row with contact data
//   - source.description boilerplate is count-accurate (no normalisation)

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISHABLE_PATH = resolve(__dirname, "../../lib/universities-publishable.json");
const INPUT_PATH =
  process.argv[2] ??
  resolve(
    process.env.USERPROFILE ?? "",
    "OneDrive/Desktop/almi cleand uni data/AlmiStudy_Laos_Cleaned.json",
  );

// WebFetch-verified 2026-05-15.
const URL_BACKFILL = {
  UNI_1183: { admissionsUrl: "https://entrance.nuol.edu.la/" },
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

function main() {
  const incoming = JSON.parse(readFileSync(INPUT_PATH, "utf8")).map(normalizeIncoming);
  const publishable = JSON.parse(readFileSync(PUBLISHABLE_PATH, "utf8"));
  const outPublishable = publishable.concat(incoming);
  writeFileSync(PUBLISHABLE_PATH, JSON.stringify(outPublishable, null, 2) + "\n", "utf8");
  console.log(`laos-turn-1: net-new ${incoming.length}, publishable ${outPublishable.length}`);
}

main();
