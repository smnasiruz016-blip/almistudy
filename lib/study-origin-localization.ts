// AlmiStudy — origin localization layer for the country study pages.
//
// Per the AlmiWorld Origin Localization Playbook: searchers from different
// origins want the SAME destination study info but lead with a DIFFERENT worry.
// Here the dominant query is funding — "scholarships for [origin] students in
// [country]", "study in [country] from [origin]", "without IELTS / MOI". So most
// origin pages LEAD with fully-funded scholarships, named honestly, localized
// per origin (BD/NP/NG/EG/LK → scholarship-first; PK → funded + HEC + proof-of-
// funds + scam; IN → ROI + PR-after-study + cost-in-INR + MOI; CN → ranked unis
// + score ranges; PH/VN → study incl. healthcare/nursing education + work-after).
//
// Route: /study/[country]/from-[origin] (mirrors AlmiCV's
// /cv-guide/[country]/from-[origin]). Dispatched inside the existing
// /study/[country]/[subject] route on the "from-" prefix — no subject slug
// starts with "from-", so there is no collision.
//
// HONESTY (AlmiStudy's heart, surfaced loudly): a directory, NOT a commission-
// paid agent; facts verified, accreditation checked against the official body;
// no agent, no commission; real scholarships never charge a fee; no fabricated
// figures ("confirm on official [authority]") and no scholarship/admission
// guarantees. The per-origin recognition body is the genuine difference and is
// kept REAL (Pakistan = HEC, Sri Lanka = UGC, Nigeria = NUC, India = AIU …).

import {
  ORIGINS as SHARED_ORIGINS,
  indefiniteArticle as sharedIndefiniteArticle,
} from "@smnasiruz016-blip/almi-data";

export type StudyOrigin = { slug: string; name: string; flag: string };

// The 10 researched origins — identity now READ from the shared data layer
// (@smnasiruz016-blip/almi-data) instead of an inlined copy. Order preserved;
// verified identical to the prior inlined list. The Study scholarship copy-
// templates below (recognitionLine credential prose etc.) stay local.
export const STUDY_ORIGINS: StudyOrigin[] = SHARED_ORIGINS.map((o) => ({
  slug: o.slug,
  name: o.name,
  flag: o.flag,
}));

// v1 live study destinations (all confirmed to have verified-uni data). Origin
// pages render + index only for these; promotion is data-only (add a slug).
export const STUDY_ORIGIN_DESTINATIONS = [
  "united-kingdom",
  "united-states",
  "canada",
  "australia",
  "germany",
  "ireland",
  "new-zealand",
  "netherlands",
] as const;

export type StudyLink = { label: string; url: string };

type DestMeta = {
  body: string; // "the UK", "the Netherlands" — running prose
  englishMedium: boolean; // many English-taught programmes (EU) vs anglophone
  scholarships: string; // named, free-to-apply options sentence
  links: StudyLink[];
  nurseBody: string; // destination nurse-registration authority (PH/VN)
};

const DEST: Record<string, DestMeta> = {
  "united-kingdom": {
    body: "the UK",
    englishMedium: false,
    scholarships:
      "Chevening (UK government, master's), Commonwealth Scholarships, and GREAT Scholarships are the headline fully-funded options — all free to apply, all competitive.",
    links: [
      { label: "Chevening Scholarships (UK government)", url: "https://www.chevening.org/" },
      { label: "Commonwealth Scholarship Commission", url: "https://cscuk.fcdo.gov.uk/" },
      { label: "GREAT Scholarships (British Council)", url: "https://study-uk.britishcouncil.org/scholarships/great-scholarships" },
    ],
    nurseBody: "the NMC",
  },
  "united-states": {
    body: "the US",
    englishMedium: false,
    scholarships:
      "the Fulbright Foreign Student Program is the headline fully-funded route, alongside university funding and graduate assistantships — free to apply, competitive.",
    links: [{ label: "Fulbright Foreign Student Program", url: "https://foreign.fulbrightonline.org/" }],
    nurseBody: "CGFNS and the NCLEX-RN",
  },
  canada: {
    body: "Canada",
    englishMedium: false,
    scholarships:
      "the Vanier Canada Graduate Scholarships and many university and provincial awards — free to apply, competitive.",
    links: [{ label: "Vanier Canada Graduate Scholarships", url: "https://vanier.gc.ca/en/home-accueil.html" }],
    nurseBody: "NNAS and the provincial nursing regulator",
  },
  australia: {
    body: "Australia",
    englishMedium: false,
    scholarships:
      "Australia Awards (government) and the Research Training Program (RTP), plus university scholarships — free to apply, competitive.",
    links: [{ label: "Australia Awards (DFAT)", url: "https://www.dfat.gov.au/people-to-people/australia-awards" }],
    nurseBody: "AHPRA",
  },
  germany: {
    body: "Germany",
    englishMedium: true,
    scholarships:
      "DAAD scholarships and Erasmus Mundus joint master's are the headline funded routes — and many German public universities charge little or no tuition. All free to apply.",
    links: [
      { label: "DAAD scholarship database", url: "https://www.daad.de/en/" },
      { label: "Erasmus Mundus Joint Masters", url: "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters-scholarships" },
    ],
    nurseBody: "the state nursing-recognition authority (Anerkennung)",
  },
  ireland: {
    body: "Ireland",
    englishMedium: true,
    scholarships:
      "the Government of Ireland International Education Scholarships and Erasmus Mundus are the headline funded routes — free to apply, competitive.",
    links: [
      { label: "Education in Ireland — scholarships", url: "https://www.educationinireland.com/en/" },
      { label: "Erasmus Mundus Joint Masters", url: "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters-scholarships" },
    ],
    nurseBody: "the NMBI",
  },
  "new-zealand": {
    body: "New Zealand",
    englishMedium: false,
    scholarships:
      "Manaaki New Zealand Scholarships (government) and university awards are the headline funded routes — free to apply, competitive.",
    links: [{ label: "Manaaki New Zealand Scholarships", url: "https://www.nzscholarships.govt.nz/" }],
    nurseBody: "the Nursing Council of New Zealand",
  },
  netherlands: {
    body: "the Netherlands",
    englishMedium: true,
    scholarships:
      "the Holland Scholarship, the Orange Knowledge Programme, and Erasmus Mundus are the headline funded routes — and the Netherlands has many English-taught programmes. All free to apply.",
    links: [
      { label: "Holland Scholarship (Study in NL)", url: "https://www.studyinnl.org/finances/holland-scholarship" },
      { label: "Erasmus Mundus Joint Masters", url: "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters-scholarships" },
    ],
    nurseBody: "the BIG register",
  },
};

export function destBody(slug: string): string {
  return DEST[slug]?.body ?? slug;
}

// Indefinite article — now re-exported from the shared data layer (was
// duplicated 3× across CV/Study/Salary). Same implementation; the 3 cross-link
// pages importing it from this module keep working unchanged.
export const indefiniteArticle = sharedIndefiniteArticle;
export function destScholarshipLinks(slug: string): StudyLink[] {
  return DEST[slug]?.links ?? [];
}

// English-test honesty line, destination-aware (anglophone vs English-medium EU).
function ieltsLine(destSlug: string): string {
  const body = destBody(destSlug);
  return DEST[destSlug]?.englishMedium
    ? `${body} has many English-taught programmes; most still ask for IELTS or PTE, though some universities waive it where your degree was English-medium (MOI). Confirm with each programme.`
    : `Most ${body} universities and scholarships ask for IELTS or PTE; some waive a separate test where your degree was English-medium (MOI). Confirm the rule with each university — don't assume.`;
}

// The origin's home recognition body — the genuine per-origin distinction.
function recognitionLine(originSlug: string, destSlug: string): string {
  const body = destBody(destSlug);
  switch (originSlug) {
    case "pakistan":
      return `Present your degree with HEC (Higher Education Commission) attestation — ${body} universities and visa officers expect Pakistani qualifications to be HEC-attested.`;
    case "india":
      return `Your degree is recognised through your university and, where a ${body} body asks, AIU (Association of Indian Universities) equivalence — keep that ready.`;
    case "nigeria":
      return `Show that your institution is NUC-recognised (National Universities Commission) — it's the recognition ${body} admissions check for Nigerian degrees.`;
    case "bangladesh":
      return `Present your UGC-recognised degree (University Grants Commission of Bangladesh) with clear transcripts.`;
    case "nepal":
      return `Studying abroad from Nepal needs a No Objection Certificate (NOC) from the Ministry of Education, alongside your transcripts — factor it into your timeline.`;
    case "philippines":
      return `Present your CHED-recognised qualifications (and, for nursing, your PRC licence) clearly.`;
    case "vietnam":
      return `Give a certified English translation of your MOET-overseen qualifications so ${body} admissions can place them.`;
    case "china":
      return `Note CHSI/CHESICC verification (China's Ministry of Education service) where ${body} admissions ask — international evaluators accept it.`;
    case "egypt":
      return `Present your degree from the Supreme Council of Universities system with certified transcripts.`;
    case "sri-lanka":
      return `Present your UGC-recognised degree — Sri Lanka's University Grants Commission, not Pakistan's HEC — with clear transcripts.`;
    default:
      return "";
  }
}

export type StudyOriginContent = {
  subHook: string;
  heading: string;
  paras: string[];
  bullets: string[];
  callout: string;
};

// AlmiStudy's directory / no-agent / no-commission doctrine — in every callout.
const NO_AGENT =
  "AlmiStudy is a directory, not a commission-paid agent — we verify each university's accreditation against its official national body and link the registry so you can check it yourself. No agent, no commission, nothing to sell you.";
const SCHOLARSHIP_NO_FEE =
  "Real scholarships are free to apply for — if anyone charges a fee to 'secure' funding, a place or a visa, it is not a real scholarship.";

type Builder = (destSlug: string) => StudyOriginContent;

// Scholarship-first archetype shared shape, with per-origin nuance layered in.
function scholarshipFirst(
  originSlug: string,
  originName: string,
  destSlug: string,
  opts: { extraBullets?: string[]; extraCallout?: string } = {},
): StudyOriginContent {
  const body = destBody(destSlug);
  const sch = DEST[destSlug]?.scholarships ?? "";
  return {
    subHook: `For students from ${originName}, the first question about studying in ${body} is almost always funding — so this page leads with the fully-funded scholarships that are real and free to apply, the honest IELTS/MOI picture, and the accredited universities we've verified.`,
    heading: `Coming from ${originName}: funded study in ${body}`,
    paras: [
      `Self-funding ${body} study is out of reach for many families, so the realistic route is a funded scholarship — and the good news is that the named ones are genuine and cost nothing to apply for.`,
    ],
    bullets: [
      sch,
      ieltsLine(destSlug),
      recognitionLine(originSlug, destSlug),
      ...(opts.extraBullets ?? []),
    ],
    callout: `${SCHOLARSHIP_NO_FEE} ${NO_AGENT}${opts.extraCallout ? " " + opts.extraCallout : ""}`,
  };
}

const BUILDERS: Record<string, Builder> = {
  // ── Scholarship-first ────────────────────────────────────────────────────────
  bangladesh: (d) => scholarshipFirst("bangladesh", "Bangladesh", d),
  nepal: (d) =>
    scholarshipFirst("nepal", "Nepal", d, {
      extraBullets: [
        "Many Nepali students also plan to work part-time during study and stay on after — those routes are real but capped and not automatic; confirm the current rules on the official source.",
      ],
    }),
  nigeria: (d) =>
    scholarshipFirst("nigeria", "Nigeria", d, {
      extraCallout:
        "Proof of funds is a genuine visa requirement, and visas turn on a complete, honest application — not on a 'success rate' anyone sells.",
    }),
  egypt: (d) =>
    scholarshipFirst("egypt", "Egypt", d, {
      extraBullets: [
        "Famous funded options like DAAD (Germany) and Erasmus Mundus (Europe) are real too — and many Egyptian degrees are English-medium, which can ease the language step.",
      ],
    }),
  "sri-lanka": (d) =>
    scholarshipFirst("sri-lanka", "Sri Lanka", d, {
      extraBullets: [
        "Nursing and healthcare study is a strong route from Sri Lanka — confirm any professional-registration step separately from admission.",
      ],
    }),

  // ── Pakistan: funded study + HEC + proof-of-funds + scam ──────────────────────
  pakistan: (d) => {
    const body = destBody(d);
    const sch = DEST[d]?.scholarships ?? "";
    return {
      subHook: `For students from Pakistan, studying in ${body} comes down to two things: funding, and getting the paperwork right. This page leads with the fully-funded scholarships that are real and free to apply, plus the HEC attestation and bank-statement realities no agent likes to spell out.`,
      heading: `Coming from Pakistan: funded study in ${body}, honestly`,
      paras: [
        `Scholarships to ${body} are real but competitive, and the parts that decide a Pakistani application are the ones generic guides skip: proof of funds, HEC attestation, and a clean file.`,
      ],
      bullets: [
        sch,
        recognitionLine("pakistan", d),
        `Proof of funds / bank statement: a ${body} student visa requires you to show you can cover tuition and living costs — confirm the current figure on the official authority before you rely on any number online.`,
        ieltsLine(d),
      ],
      callout: `${SCHOLARSHIP_NO_FEE} ${NO_AGENT}`,
    };
  },

  // ── India: ROI + PR-after-study + cost-in-INR + MOI ──────────────────────────
  india: (d) => {
    const body = destBody(d);
    const sch = DEST[d]?.scholarships ?? "";
    return {
      subHook: `From India, the question about ${body} study is ROI: will it pay back, and does it lead to post-study work or PR? This page leads with that — the real cost-and-return picture, the post-study work route, scholarships, and the MOI rule that can save you an IELTS sitting.`,
      heading: `Coming from India: ROI and the post-study route in ${body}`,
      paras: [
        `Indian applicants weigh ${body} study in rupees and in outcomes, so the honest framing is total cost versus the post-study work and residence routes — which are real but never guaranteed.`,
      ],
      bullets: [
        `Post-study work routes in ${body} exist and can lead toward skilled-residence pathways, but they are not automatic — confirm the current rules on the official immigration source.`,
        sch,
        `${ieltsLine(d)} An MOI certificate can sometimes replace the test where your degree was English-medium.`,
        recognitionLine("india", d),
      ],
      callout: `No one can guarantee PR or a job after study — the real routes are on the official government source. ${NO_AGENT}`,
    };
  },

  // ── China: ranked universities + admissions + score ranges ───────────────────
  china: (d) => {
    const body = destBody(d);
    return {
      subHook: `From China, ${body} study searches centre on highly-ranked universities and competitive admissions. This page leads with that — realistic entry expectations, the CHSI verification step, and the accredited universities we've verified, with no inflated admit-chance claims.`,
      heading: `Coming from China: ranked universities and honest admissions in ${body}`,
      paras: [
        `Chinese applicants often target the most selective ${body} universities, where admission is competitive and decided on the whole profile — grades, statement and references — not on any single test.`,
      ],
      bullets: [
        `More selective universities ask for higher entry grades and English scores; the exact figure is set per university and programme, so confirm it on each official admissions page.`,
        recognitionLine("china", d),
        `${DEST[d]?.scholarships ?? ""}`,
        ieltsLine(d),
      ],
      callout: `No service can guarantee admission to a ranked university or quote your 'chances'. ${NO_AGENT}`,
    };
  },

  // ── Philippines: study incl. nursing/healthcare education + work-after ───────
  philippines: (d) => {
    const body = destBody(d);
    const nurse = DEST[d]?.nurseBody ?? "the destination health regulator";
    return {
      subHook: `From the Philippines, ${body} study often means healthcare and nursing education, with work afterward in mind. This page leads with that — study routes, the registration step that's separate from your course (${nurse}), scholarships, and the accredited universities we've verified.`,
      heading: `Coming from the Philippines: study, nursing education and work-after in ${body}`,
      paras: [
        `Healthcare and nursing are the Philippines' strongest study-and-work corridors abroad — but the course, the professional registration, and the work-after route are separate steps, and the order matters.`,
      ],
      bullets: [
        `Registration is separate from study: ${nurse} handles nurse registration in ${body} — confirm its requirements on the official source, not through an agent.`,
        recognitionLine("philippines", d),
        `${DEST[d]?.scholarships ?? ""}`,
        ieltsLine(d),
      ],
      callout: `Work-after-study and registration are real but not automatic — confirm both on the official sources. ${NO_AGENT} Be wary of any agency charging a placement or 'guarantee' fee.`,
    };
  },

  // ── Vietnam: study incl. healthcare/skilled + work-after ─────────────────────
  vietnam: (d) => {
    const body = destBody(d);
    const nurse = DEST[d]?.nurseBody ?? "the destination health regulator";
    return {
      subHook: `From Vietnam, ${body} study spans healthcare, skilled and technical fields, with work afterward in mind. This page leads with that — study routes, clear credential translation, the registration step for healthcare (${nurse}), scholarships, and the accredited universities we've verified.`,
      heading: `Coming from Vietnam: study and work-after in ${body}`,
      paras: [
        `Vietnamese applicants' strongest routes are healthcare, skilled and technical study — where a clear English rendering of your qualifications and (for healthcare) a separate registration step matter as much as the course.`,
      ],
      bullets: [
        recognitionLine("vietnam", d),
        `For healthcare, registration is separate from study: ${nurse} handles it — confirm requirements on the official source.`,
        `${DEST[d]?.scholarships ?? ""}`,
        ieltsLine(d),
      ],
      callout: `Work-after-study and registration are real but not automatic — confirm on the official sources. ${NO_AGENT}`,
    };
  },
};

const ORIGIN_BY_SLUG = new Map(STUDY_ORIGINS.map((o) => [o.slug, o]));
export function findStudyOrigin(slug: string): StudyOrigin | undefined {
  return ORIGIN_BY_SLUG.get(slug);
}

// Index gate for the NEW page type: the destination must be a v1 study market
// AND the origin researched. (The destination's verified-uni count is additionally
// checked at the page/sitemap layer so we never promote a data-less page.)
export function isStudyOriginIndexable(destSlug: string, originSlug: string): boolean {
  return (
    (STUDY_ORIGIN_DESTINATIONS as readonly string[]).includes(destSlug) &&
    ORIGIN_BY_SLUG.has(originSlug)
  );
}

export function getStudyOriginLocalization(
  originSlug: string,
  destSlug: string,
): StudyOriginContent | null {
  if (!isStudyOriginIndexable(destSlug, originSlug)) return null;
  const content = BUILDERS[originSlug](destSlug);
  // Drop any empty bullets (e.g. a destination with no scholarship sentence).
  content.bullets = content.bullets.filter((b) => b && b.trim().length > 0);
  return content;
}
