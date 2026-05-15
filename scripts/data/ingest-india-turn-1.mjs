import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// India Turn 1 of multi-turn build (per Nasir directive).
// Reads `AlmiStudy_India_Cleaned.json` (90 rows, UNI_0787-UNI_0876), promotes
// 16 collisions into existing publishable rows under their original UNI_NNNN
// (per AlmiStudy promote-not-duplicate doctrine), appends the remaining 74 as
// net-new, and rewrites `lib/universities-publishable.json` in place.
//
// Argument: path to the cleaned India JSON. Defaults to ~/Downloads/...

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLISHABLE_PATH = resolve(__dirname, "../../lib/universities-publishable.json");
const INPUT_PATH = process.argv[2] ?? resolve(process.env.USERPROFILE ?? "", "Downloads/AlmiStudy_India_Cleaned.json");

// Incoming UNI_NNNN -> existing UNI_NNNN to promote into.
const DUPLICATE_MAP = {
  UNI_0787: "UNI_0075", // IISc Bangalore
  UNI_0788: "UNI_0078", // University of Delhi
  UNI_0789: "UNI_0076", // IIT Bombay
  UNI_0790: "UNI_0079", // JNU
  UNI_0791: "UNI_0199", // BHU
  UNI_0792: "UNI_0196", // IIT Kharagpur
  UNI_0793: "UNI_0194", // IIT Madras
  UNI_0794: "UNI_0077", // IIT Delhi
  UNI_0795: "UNI_0195", // IIT Kanpur
  UNI_0796: "UNI_0197", // IIT Roorkee
  UNI_0803: "UNI_0198", // IIM Ahmedabad
  UNI_0805: "UNI_0204", // IIM Bangalore
  UNI_0853: "UNI_0143", // AIIMS New Delhi
  UNI_0855: "UNI_0144", // CMC Vellore
  UNI_0858: "UNI_0145", // Maulana Azad Medical College
  UNI_0875: "UNI_0207", // Punjab Agricultural University
};

// Slug overrides for net-new rows where curator slug disagrees with name.
// IIIT-Hyderabad and IIIT-Bangalore are "International" deemed universities,
// not "Indian" — slug must match.
const SLUG_FIX = {
  UNI_0870: "international-institute-of-information-technology-hyderabad",
  UNI_0871: "international-institute-of-information-technology-bangalore",
};

// Contact/admissions URLs sourced from each university's official site on
// 2026-05-15 so the 5 collector-kept rows pass scripts/validate-universities
// (admissionsEmail requires admissionsUrl; mainPhone requires contactUrl OR
// admissionsUrl).
const URL_BACKFILL = {
  UNI_0075: {
    contactUrl: "https://iisc.ac.in/about/general-information/contact/",
    admissionsUrl: "https://iisc.ac.in/admissions/",
  },
  UNI_0078: {
    admissionsUrl: "https://www.du.ac.in/index.php?page=study-at-du",
  },
  UNI_0076: {
    contactUrl: "https://www.iitb.ac.in/contact-us",
    admissionsUrl: "https://www.iitb.ac.in/admissions/why-iitb",
  },
  UNI_0079: {
    admissionsUrl: "https://www.jnu.ac.in/admissions",
  },
  UNI_0199: {
    admissionsUrl: "https://admission.bhu.ac.in",
  },
};

// Validator rejects null for admissionsEmail / mainPhone / deadlinesNote
// (URL fields permit null; these don't). Drop them when null so the validator
// treats them as absent.
const STRIP_IF_NULL = ["admissionsEmail", "mainPhone", "deadlinesNote"];

// Normalize incoming row: fix the stale "95 curator-research" boilerplate in
// the source.description (actual count is 85; 5+85=90), and strip
// validator-incompatible null fields.
function normalizeIncoming(row) {
  const out = { ...row };
  if (out.source?.description) {
    out.source = {
      ...out.source,
      description: out.source.description.replace(
        "95 curator-research expansion",
        "85 curator-research expansion",
      ),
    };
  }
  for (const f of STRIP_IF_NULL) {
    if (out[f] === null) delete out[f];
  }
  return out;
}

// Promote: replace the existing publishable record's payload with the richer
// incoming record but keep the existing id+slug, force publishable=true, and
// backfill verified URLs so the validator passes.
function mergePromotion(existing, incoming) {
  const merged = {
    ...incoming,
    id: existing.id,
    slug: existing.slug,
    publishable: true,
  };
  const backfill = URL_BACKFILL[existing.id];
  if (backfill) {
    if (backfill.contactUrl !== undefined) merged.contactUrl = backfill.contactUrl;
    if (backfill.admissionsUrl !== undefined) merged.admissionsUrl = backfill.admissionsUrl;
  }
  for (const k of Object.keys(existing)) {
    if (merged[k] === undefined) merged[k] = existing[k];
  }
  return merged;
}

function transformNetNew(row) {
  const out = { ...row };
  if (SLUG_FIX[out.id]) out.slug = SLUG_FIX[out.id];
  return out;
}

function main() {
  const incoming = JSON.parse(readFileSync(INPUT_PATH, "utf8")).map(normalizeIncoming);
  const publishable = JSON.parse(readFileSync(PUBLISHABLE_PATH, "utf8"));
  const idIndex = new Map(publishable.map((r, i) => [r.id, i]));

  let promoted = 0;
  let netNew = 0;
  const output = publishable.slice();

  for (const row of incoming) {
    const targetId = DUPLICATE_MAP[row.id];
    if (targetId) {
      const idx = idIndex.get(targetId);
      if (idx === undefined) {
        throw new Error(`Promotion target ${targetId} not found for incoming ${row.id}`);
      }
      output[idx] = mergePromotion(output[idx], row);
      promoted++;
    } else {
      output.push(transformNetNew(row));
      netNew++;
    }
  }

  writeFileSync(PUBLISHABLE_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(
    `india-turn-1: promoted ${promoted}, net-new ${netNew}, total publishable ${output.length}`,
  );
}

main();
