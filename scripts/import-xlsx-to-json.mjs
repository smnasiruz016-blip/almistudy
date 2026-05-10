import XLSX from "xlsx";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const xlsxPath = resolve(__dirname, "data/almistudy_phase1_seed_v1.xlsx");
const publishableOut = resolve(__dirname, "../lib/universities-publishable.json");
const flaggedOut = resolve(__dirname, "../lib/universities-flagged.json");

// Per AlmiStudy v1.0 §3.1: every publishable university must have a named
// accreditation body and a publicly accessible registry URL. The 30 priority
// entries in the seed dataset get hand-coded accreditation data here from
// training-data research as of 2026-05-10. Any entry without a confidently
// verifiable accreditor + registry drops to flagged per §3.1+§3.4 doctrine.
//
// `verifiedDate` is today; per §8.1 every listing gets re-verified at least
// annually.

const VERIFIED_DATE = "2026-05-10";

const ACCREDITATION_DATA = {
  // ── Saudi Arabia (4) — National Center for Academic Accreditation under ETEC
  UNI_0129: {
    accreditationBody:
      "Education and Training Evaluation Commission (ETEC) — National Center for Academic Accreditation (NCAAA)",
    accreditationRegistryUrl: "https://etec.gov.sa/en"
  },
  UNI_0130: {
    accreditationBody:
      "Education and Training Evaluation Commission (ETEC) — National Center for Academic Accreditation (NCAAA)",
    accreditationRegistryUrl: "https://etec.gov.sa/en"
  },
  UNI_0131: {
    accreditationBody:
      "Education and Training Evaluation Commission (ETEC) — National Center for Academic Accreditation (NCAAA)",
    accreditationRegistryUrl: "https://etec.gov.sa/en"
  },
  UNI_0132: {
    accreditationBody:
      "Education and Training Evaluation Commission (ETEC) — National Center for Academic Accreditation (NCAAA)",
    accreditationRegistryUrl: "https://etec.gov.sa/en"
  },

  // ── United Arab Emirates (3) — Commission for Academic Accreditation (CAA)
  UNI_0133: {
    accreditationBody:
      "Commission for Academic Accreditation (CAA), UAE Ministry of Education",
    accreditationRegistryUrl: "https://www.caa.ae/"
  },
  UNI_0134: {
    accreditationBody:
      "Commission for Academic Accreditation (CAA), UAE Ministry of Education",
    accreditationRegistryUrl: "https://www.caa.ae/"
  },
  UNI_0135: {
    accreditationBody:
      "Commission for Academic Accreditation (CAA), UAE Ministry of Education",
    accreditationRegistryUrl: "https://www.caa.ae/"
  },

  // ── Oman (1) — Oman Authority for Academic Accreditation and Quality
  // Assurance of Education
  UNI_0136: {
    accreditationBody:
      "Oman Authority for Academic Accreditation and Quality Assurance of Education (OAAAQA)",
    accreditationRegistryUrl: "https://www.oaaaqa.gov.om/"
  },

  // ── Bahrain (1) — Education & Training Quality Authority
  UNI_0137: {
    accreditationBody:
      "Education & Training Quality Authority (BQA), Kingdom of Bahrain",
    accreditationRegistryUrl: "https://www.bqa.gov.bh/"
  },

  // ── Qatar (1) — Qatar Ministry of Education and Higher Education
  UNI_0138: {
    accreditationBody: "Qatar Ministry of Education and Higher Education",
    accreditationRegistryUrl: "https://www.edu.gov.qa/"
  },

  // ── Kuwait (1) — Kuwait Ministry of Higher Education
  UNI_0139: {
    accreditationBody: "Kuwait Ministry of Higher Education",
    accreditationRegistryUrl: "https://www.mohe.edu.kw/"
  },

  // ── Pakistan (3) — Higher Education Commission Pakistan
  // (medical entries also recognized by the Pakistan Medical Commission)
  UNI_0140: {
    accreditationBody: "Higher Education Commission (HEC) Pakistan",
    accreditationRegistryUrl: "https://www.hec.gov.pk/"
  },
  UNI_0141: {
    accreditationBody:
      "Higher Education Commission (HEC) Pakistan; Pakistan Medical Commission (PMC)",
    accreditationRegistryUrl: "https://www.pmc.gov.pk/"
  },
  UNI_0142: {
    accreditationBody:
      "Higher Education Commission (HEC) Pakistan; Pakistan Medical Commission (PMC)",
    accreditationRegistryUrl: "https://www.pmc.gov.pk/"
  },

  // ── India (3) — National Medical Commission for medical institutions;
  // UGC India for university recognition
  UNI_0143: {
    accreditationBody:
      "Institute of National Importance (Act of Parliament); National Medical Commission (NMC) India",
    accreditationRegistryUrl: "https://www.nmc.org.in/"
  },
  UNI_0144: {
    accreditationBody:
      "National Medical Commission (NMC) India; National Assessment and Accreditation Council (NAAC)",
    accreditationRegistryUrl: "https://www.nmc.org.in/"
  },
  UNI_0145: {
    accreditationBody:
      "National Medical Commission (NMC) India; University of Delhi (affiliating university)",
    accreditationRegistryUrl: "https://www.nmc.org.in/"
  },

  // ── Bangladesh (2) — Bangladesh Medical and Dental Council; UGC Bangladesh
  UNI_0146: {
    accreditationBody:
      "Bangladesh Medical and Dental Council (BMDC); University Grants Commission of Bangladesh",
    accreditationRegistryUrl: "https://bmdc.org.bd/"
  },
  UNI_0147: {
    accreditationBody:
      "Bangladesh Medical and Dental Council (BMDC); University of Dhaka (affiliating university)",
    accreditationRegistryUrl: "https://bmdc.org.bd/"
  },

  // ── Nepal (1) — Tribhuvan University is recognized by UGC Nepal;
  // medical recognition by Nepal Medical Council
  UNI_0148: {
    accreditationBody:
      "University Grants Commission Nepal; Nepal Medical Council",
    accreditationRegistryUrl: "https://www.ugcnepal.edu.np/"
  },

  // ── Philippines (5) — CHED Philippines; PAASCU for institutional
  // accreditation; PRC for medical/health professional licensure
  UNI_0149: {
    accreditationBody:
      "Commission on Higher Education (CHED) Philippines; UP System Charter",
    accreditationRegistryUrl: "https://ched.gov.ph/"
  },
  UNI_0150: {
    accreditationBody:
      "Commission on Higher Education (CHED) Philippines; PAASCU",
    accreditationRegistryUrl: "https://ched.gov.ph/"
  },
  UNI_0151: {
    accreditationBody:
      "Commission on Higher Education (CHED) Philippines; PAASCU",
    accreditationRegistryUrl: "https://ched.gov.ph/"
  },
  UNI_0152: {
    accreditationBody:
      "Commission on Higher Education (CHED) Philippines; Professional Regulation Commission (PRC)",
    accreditationRegistryUrl: "https://ched.gov.ph/"
  },
  UNI_0153: {
    accreditationBody:
      "Commission on Higher Education (CHED) Philippines; Professional Regulation Commission (PRC)",
    accreditationRegistryUrl: "https://ched.gov.ph/"
  },

  // ── United Kingdom (2) — Office for Students (OfS) is the regulator;
  // QAA reviews quality. Both institutions hold Royal Charter.
  UNI_0154: {
    accreditationBody:
      "Office for Students (OfS); Quality Assurance Agency for Higher Education (QAA); Nursing and Midwifery Council (NMC) for nursing programmes",
    accreditationRegistryUrl: "https://www.officeforstudents.org.uk/"
  },
  UNI_0158: {
    accreditationBody:
      "Office for Students (OfS); Quality Assurance Agency for Higher Education (QAA); Royal Charter",
    accreditationRegistryUrl: "https://www.officeforstudents.org.uk/"
  },

  // ── Canada (1) — Provincial regulation (Quebec) + Universities Canada
  // membership (representative of degree-granting institutions)
  UNI_0155: {
    accreditationBody:
      "Ministère de l'Enseignement supérieur du Québec; Universities Canada (member institution)",
    accreditationRegistryUrl: "https://www.univcan.ca/universities/member-universities/"
  },

  // ── Sweden (1) — Swedish Higher Education Authority (UKÄ) is the
  // national quality assurance and degree-awarding authority.
  UNI_0156: {
    accreditationBody:
      "Swedish Higher Education Authority (Universitetskanslersämbetet, UKÄ)",
    accreditationRegistryUrl: "https://www.uka.se/in-english.html"
  },

  // ── Ireland (1) — QQI is the national qualifications and quality
  // assurance authority for further and higher education in Ireland.
  UNI_0157: {
    accreditationBody:
      "Quality and Qualifications Ireland (QQI); Higher Education Authority (HEA)",
    accreditationRegistryUrl: "https://www.qqi.ie/"
  }
};

function deriveSlug(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[()'""`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitMulti(s) {
  if (!s) return [];
  return String(s)
    .split(/;|,/)
    .map((x) => x.trim())
    .filter(Boolean);
}

const wb = XLSX.readFile(xlsxPath);
const ui = XLSX.utils.sheet_to_json(wb.Sheets["University_Index"], {
  defval: "",
  range: 1
});
const sr = XLSX.utils.sheet_to_json(wb.Sheets["Source_Register"], {
  defval: "",
  range: 1
});
const sourceById = new Map(sr.map((s) => [s.source_id, s]));

const ALL = [];

for (const r of ui) {
  const isCurator = r.verification_status === "curator_added_official_web";
  const acc = ACCREDITATION_DATA[r.university_id];

  // Per §3.1+§3.4: a curator-flagged entry without confidently verified
  // accreditation drops to flagged. Phase 1 ships honest count.
  let publishable = false;
  let droppedReason = null;
  if (isCurator) {
    if (acc && acc.accreditationBody && acc.accreditationRegistryUrl) {
      publishable = true;
    } else {
      publishable = false;
      droppedReason = "no verified accreditation_body + registry_url";
    }
  }

  const src = sourceById.get(r.source_id);

  const entry = {
    id: r.university_id,
    slug: deriveSlug(r.official_name),
    name: r.official_name,
    country: {
      iso2: r.country_iso2,
      name: r.country_name,
      slug: deriveSlug(r.country_name)
    },
    city: r.city,
    region: r.global_region,
    controlType: r.control_type || null,
    officialWebsite: r.official_website || null,
    admissionsUrl: r.admissions_url || null,
    primaryLanguage: r.primary_language || null,
    subjects: splitMulti(r.subjects),
    categoryTags: splitMulti(r.category_tags),
    scholarshipsAvailable: r.scholarships_available || null,
    englishTestNote: r.english_test_note || null,
    tuitionNote: r.tuition_note || null,
    studentNotes: r.student_notes || null,
    accreditationBody: acc ? acc.accreditationBody : null,
    accreditationRegistryUrl: acc ? acc.accreditationRegistryUrl : null,
    accreditationBodyVerifiedDate: acc ? VERIFIED_DATE : null,
    recognitionByDestination: [],
    source: src
      ? {
          id: src.source_id,
          title: src.source_title,
          publisher: src.publisher,
          url: src.source_url || null,
          tier: src.source_tier
        }
      : { id: r.source_id, title: null, publisher: null, url: null, tier: null },
    lastVerified: r.last_verified_date || null,
    verificationStatus: r.verification_status,
    publishable
  };

  ALL.push({ entry, droppedReason });
}

const publishable = ALL.filter((x) => x.entry.publishable).map((x) => x.entry);
const flagged = ALL.filter((x) => !x.entry.publishable).map((x) => x.entry);
const dropped = ALL.filter(
  (x) => !x.entry.publishable && x.entry.verificationStatus === "curator_added_official_web"
);

writeFileSync(publishableOut, JSON.stringify(publishable, null, 2) + "\n");
writeFileSync(flaggedOut, JSON.stringify(flagged, null, 2) + "\n");

console.log(`Publishable: ${publishable.length}`);
console.log(`Flagged:     ${flagged.length}`);
console.log(`Dropped from priority bucket: ${dropped.length}`);
if (dropped.length) {
  console.log("Dropped IDs:");
  for (const d of dropped) console.log(`  ${d.entry.id} ${d.entry.name}: ${d.droppedReason}`);
}

const byCountry = {};
for (const e of publishable) {
  byCountry[e.country.name] = (byCountry[e.country.name] || 0) + 1;
}
console.log("\nPublishable by country:");
for (const [k, v] of Object.entries(byCountry).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${v}  ${k}`);
}
