// AlmiStudy MASTER copy — doctrine-clean, Nasir's approved voice
// (AlmiStudy_Perfect_Master.md). Single source of the anti-agent master copy so
// it flows onto every landing route. Each page keeps its own LOCALIZED data
// (verified universities, accreditation, subjects, origin-specific funding/visa
// context) and wraps it with these master sections.
//
// THEME: AlmiStudy uses Tailwind utilities — brand @theme tokens WITHOUT the
// almi- prefix (text-plum, bg-cream, border-peach, text-coral, text-gold) for
// branded surfaces + zinc grays with dark: variants for body text. RESPECT DARK
// MODE on every element. FREE product — no pricing.

import Link from "next/link";

const TOTAL = "3,197";
const SEARCH_HREF = "/universities";

export type StudyFaqItem = { q: string; a: string };

// ── 1. Anti-agent hook — localized tagline + framing + value strip ───────────
// `localizedSuffix` localizes the hook, e.g. " for Medicine & Health Sciences at
// University of Oxford". Rendered under each page's own H1 (NOT a second <h1>).
export function StudyMasterHook({
  localizedSuffix = "",
  ctaHref = SEARCH_HREF,
}: {
  localizedSuffix?: string;
  ctaHref?: string;
}) {
  return (
    <section className="mb-10 rounded-xl border border-peach bg-cream-soft dark:border-zinc-800 dark:bg-zinc-900/40 p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-coral mb-2">
        Free, verified directory · no agent commissions · no sign-up wall
      </p>
      <p className="text-xl sm:text-2xl font-semibold tracking-tight text-plum dark:text-zinc-100 mb-2">
        Find the university that says yes{localizedSuffix}.
      </p>
      <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-3xl">
        Most people choose a university abroad on an agent&apos;s advice — but agents are paid
        commissions to send you to the schools that pay them, not the ones that fit you.
        AlmiStudy is the honest alternative: {TOTAL} verified universities, searchable by you.
        No biased middleman, no sales calls, no account required — just the facts, so you choose
        with confidence.
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
        <li className="flex items-center gap-1.5"><span aria-hidden className="text-coral">✓</span> A true directory, not a commission-paid agent</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="text-coral">✓</span> Verified facts — checked, not guessed</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="text-coral">✓</span> Free — no account, no sales calls</li>
      </ul>
      <div className="mt-5">
        <Link
          href={ctaHref}
          className="inline-block rounded-pill bg-coral px-6 py-3 text-sm font-semibold text-white hover:bg-coral-deep transition-colors"
        >
          Search {TOTAL} Universities — Free →
        </Link>
      </div>
    </section>
  );
}

// ── 3. The anti-agent truth ──────────────────────────────────────────────────
export function StudyMasterAntiAgent() {
  return (
    <section className="mb-10" aria-labelledby="anti-agent-title">
      <h2 id="anti-agent-title" className="text-lg font-semibold tracking-tight text-plum dark:text-zinc-100 mb-3">
        Choosing a university shouldn&apos;t mean trusting whoever gets paid the most to send you there
      </h2>
      <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-3xl mb-3">
        Traditional study-abroad agents push the schools that pay them the highest referral fees.
        Student forums are full of strangers guessing on your behalf. International students are
        expected to bet years of their lives, and their family&apos;s savings, on biased advice.
      </p>
      <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-3xl">
        AlmiStudy gives you the truth directly: a comprehensive, unbiased database of {TOTAL}{" "}
        verified universities, searchable entirely by you. No pushy nudges, no commercial hype —
        just data, so the final choice is genuinely <strong>yours</strong>.
      </p>
    </section>
  );
}

// ── 6. Master FAQ items (append to each page's localized FAQ) ─────────────────
export const STUDY_MASTER_FAQ: ReadonlyArray<StudyFaqItem> = [
  {
    q: "How do I find universities abroad for international students?",
    a: "Use our free directory — sort 3,197 verified institutions by region, country, or subject. No registration wall, no phone tracking, just open access.",
  },
  {
    q: "Do I need an agent to apply to a university abroad?",
    a: "No. Universities welcome direct applications. AlmiStudy gives you the verified data directly, so you can pick your school, prepare your documents, and apply yourself — without losing thousands to middlemen.",
  },
];

// Standalone FAQ section. `extra` prepends the page's LOCALIZED Q&A; one FAQPage
// JSON-LD covers the combined set.
export function StudyMasterFaq({
  heading,
  extra = [],
}: {
  heading: string;
  extra?: ReadonlyArray<StudyFaqItem>;
}) {
  const items = [...extra, ...STUDY_MASTER_FAQ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({ "@type": "Question", name: it.q, acceptedAnswer: { "@type": "Answer", text: it.a } })),
  };
  return (
    <section className="mb-10" aria-labelledby="faq-title">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 id="faq-title" className="text-lg font-semibold tracking-tight text-plum dark:text-zinc-100 mb-3">
        {heading}
      </h2>
      <dl className="space-y-4 max-w-3xl">
        {items.map((it) => (
          <div key={it.q} className="rounded-md border border-peach bg-cream dark:border-zinc-800 dark:bg-zinc-900/40 p-4">
            <dt className="text-sm font-semibold text-plum dark:text-zinc-100">{it.q}</dt>
            <dd className="mt-1.5 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{it.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ── 5. Found your university? Here's the rest of the path (cross-product) ─────
const CROSS: ReadonlyArray<{ title: string; body: string; href: string }> = [
  { title: "Know your English score →", body: "Your real IELTS, TOEFL, or PTE level before you pay the official exam fee. — AlmiPrep / AlmiTOEFL / AlmiPTE", href: "https://almiprep.almiworld.com/" },
  { title: "Build a clean application →", body: "An ATS-safe CV that recruiters and their software can actually read. — AlmiCV", href: "https://almicv.almiworld.com/" },
  { title: "Is the degree worth it? →", body: "See what your target role really earns at home vs your destination. — AlmiSalary", href: "https://almisalary.almiworld.com/" },
];

export function StudyMasterCrossProduct() {
  return (
    <section className="mb-10" aria-label="The rest of the path across AlmiWorld">
      <h2 className="text-lg font-semibold tracking-tight text-plum dark:text-zinc-100 mb-3">
        Found your university? Here&apos;s the rest of the path.
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {CROSS.map((c) => (
          <li key={c.href}>
            <a href={c.href} className="block h-full rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
              <div className="font-semibold text-sm text-plum dark:text-zinc-100 mb-1">{c.title}</div>
              <div className="text-zinc-600 dark:text-zinc-400 text-sm">{c.body}</div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── 9. Shamool pledge (in the body) ──────────────────────────────────────────
export function StudyMasterShamool() {
  return (
    <section className="mb-10 rounded-xl border border-peach bg-cream-soft dark:border-zinc-800 dark:bg-zinc-900/40 p-5 text-center" aria-label="Shamool Foundation pledge">
      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-2xl mx-auto">
        <span className="font-semibold text-plum dark:text-zinc-100">25% of our sales go to the Shamool Foundation in Lahore</span> —
        funding free education, learning materials, and daily meals for underprivileged children.
      </p>
    </section>
  );
}
