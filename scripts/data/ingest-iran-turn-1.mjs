import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Iran Turn 1 of multi-turn build (per Nasir directive).
// Reads `AlmiStudy_Iran_Cleaned.json` (44 rows, UNI_0961-UNI_1004):
//   - 0 promotions (no existing Iran rows in publishable or flagged)
//   - 44 net-new appended to publishable
//   - source.description boilerplate normalised "62 curator-research" -> "31"
//     to match the actual 13+31=44 split
//   - UNI_0961 UT and UNI_0963 AUT: admissionsEmail + mainPhone stripped
//     (4-digit PBX prefixes aren't usable; sites are JS-SPA so admissionsUrl
//     can't be verified externally; null > fabrication)
//   - UNI_0962 Sharif: admissionsUrl backfilled with verified
//     https://www.sharif.ir/admission

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISHABLE_PATH = resolve(__dirname, "../../lib/universities-publishable.json");
const INPUT_PATH =
  process.argv[2] ??
  resolve(
    process.env.USERPROFILE ?? "",
    "OneDrive/Desktop/almi cleand uni data/AlmiStudy_Iran_Cleaned.json",
  );

// Rows where the curator kept a 4-digit PBX prefix as the "phone" — the
// preflight Q&A picked "Strip email+phone" since we can't pair them with a
// verified admissionsUrl (JS-SPA renders + Iran sanctions infrastructure
// block external verification).
const STRIP_CONTACT_FIELDS = new Set(["UNI_0961", "UNI_0963"]);

// admissionsUrl backfill for the one collector row with a phone+email where
// we could verify a real admissions subpath (Sharif via 301 from .edu->.ir).
const URL_BACKFILL = {
  UNI_0962: { admissionsUrl: "https://www.sharif.ir/admission" },
};

// Validator rejects null for these fields (URL fields permit null; these
// don't). Drop them when null so the validator treats them as absent.
const STRIP_IF_NULL = ["admissionsEmail", "mainPhone", "deadlinesNote"];

function normalizeIncoming(row) {
  const out = { ...row };
  if (out.source?.description) {
    out.source = {
      ...out.source,
      description: out.source.description.replace(
        "62 curator-research expansion",
        "31 curator-research expansion",
      ),
    };
  }
  for (const f of STRIP_IF_NULL) {
    if (out[f] === null) delete out[f];
  }
  if (STRIP_CONTACT_FIELDS.has(out.id)) {
    delete out.admissionsEmail;
    delete out.mainPhone;
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
  console.log(
    `iran-turn-1: net-new ${incoming.length}, publishable ${outPublishable.length}`,
  );
}

main();
