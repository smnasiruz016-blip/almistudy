import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Runtime validator for lib/universities-publishable.json.
//
// Doctrine: AlmiStudy is a directory. Display-only fields deep-link out to the
// official university source. Guards below enforce that contact data (email,
// phone) and time-sensitive notes (deadlines) always ship alongside an
// official source URL so the entry remains verifiable.

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = resolve(__dirname, "../lib/universities-publishable.json");

const NOTE_MAX = 200;
const URL_FIELDS = [
  "contactUrl",
  "admissionsUrl",
  "deadlinesUrl",
  "scholarshipsUrl"
];

function isString(v) {
  return typeof v === "string";
}

function isHttpsUrl(v) {
  if (!isString(v) || !v.startsWith("https://")) return false;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

// Pragmatic email shape: one "@", non-empty local, dotted domain with TLD
// of at least 2 letters. Not RFC 5322 — directory entries only.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
// Leading "+", then digits/spaces/dashes only.
const PHONE_RE = /^\+[0-9][0-9\s\-]*$/;

function validateEntry(entry, idx) {
  const errors = [];
  const id = entry?.id ?? `index ${idx}`;

  for (const f of URL_FIELDS) {
    if (entry[f] === undefined) continue;
    if (entry[f] === null) continue; // existing fields permit null
    if (!isHttpsUrl(entry[f])) {
      errors.push(`${id}: ${f} must be an https:// URL (got ${JSON.stringify(entry[f])})`);
    }
  }

  if (entry.admissionsEmail !== undefined) {
    if (!isString(entry.admissionsEmail) || !EMAIL_RE.test(entry.admissionsEmail)) {
      errors.push(`${id}: admissionsEmail has invalid shape (got ${JSON.stringify(entry.admissionsEmail)})`);
    }
    if (!entry.admissionsUrl) {
      errors.push(`${id}: admissionsEmail requires admissionsUrl on the same entry`);
    }
  }

  if (entry.mainPhone !== undefined) {
    if (!isString(entry.mainPhone) || !PHONE_RE.test(entry.mainPhone)) {
      errors.push(`${id}: mainPhone must start with "+" and contain only digits, spaces, dashes (got ${JSON.stringify(entry.mainPhone)})`);
    }
    if (!entry.contactUrl && !entry.admissionsUrl) {
      errors.push(`${id}: mainPhone requires contactUrl or admissionsUrl on the same entry`);
    }
  }

  if (entry.englishTestNote !== undefined && entry.englishTestNote !== null) {
    if (!isString(entry.englishTestNote) || entry.englishTestNote.length > NOTE_MAX) {
      errors.push(`${id}: englishTestNote must be a string ≤ ${NOTE_MAX} chars (got length ${entry.englishTestNote?.length})`);
    }
  }

  if (entry.deadlinesNote !== undefined) {
    if (!isString(entry.deadlinesNote) || entry.deadlinesNote.length > NOTE_MAX) {
      errors.push(`${id}: deadlinesNote must be a string ≤ ${NOTE_MAX} chars (got length ${entry.deadlinesNote?.length})`);
    }
    if (!entry.deadlinesUrl) {
      errors.push(`${id}: deadlinesNote requires deadlinesUrl on the same entry`);
    }
  }

  if (entry.subjects !== undefined) {
    if (!Array.isArray(entry.subjects) || !entry.subjects.every(isString)) {
      errors.push(`${id}: subjects must be an array of strings`);
    }
  }
  if (entry.categoryTags !== undefined) {
    if (!Array.isArray(entry.categoryTags) || !entry.categoryTags.every(isString)) {
      errors.push(`${id}: categoryTags must be an array of strings`);
    }
  }

  return errors;
}

function main() {
  const path = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : DEFAULT_PATH;
  const raw = readFileSync(path, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    console.error(`validate-universities: expected an array at ${path}`);
    process.exit(1);
  }

  const allErrors = [];
  data.forEach((entry, idx) => {
    allErrors.push(...validateEntry(entry, idx));
  });

  if (allErrors.length) {
    console.error(`validate-universities: ${allErrors.length} error(s) in ${path}`);
    for (const e of allErrors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(`validate-universities: ${data.length} entries OK (${path})`);
}

main();
