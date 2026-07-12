// Origin leaf: /university/[uni]/[subject]/from-[origin]
//
// "Can a student from [origin] study [subject] at [university]?" — a real page,
// because the origin changes the visa route, the home-vs-destination cost
// picture, and the English-test context. Real-data-or-canonical-up: where the
// university genuinely teaches the subject AND the origin is a real country, the
// page is SELF-CANONICAL + indexable. Where the university does NOT list the
// subject, there is no real data, so the page canonicalises UP to /university/
// [slug] (the verified profile) — never a fabricated subject claim, never noindex.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getUniversityBySlug,
  getCountryBySlug,
  type University,
} from "@/lib/page-relations";
import { getCanonicalSubjects, SUBJECT_NAMES, SUBJECT_ORDER, type SubjectSlug } from "@/lib/subject-mapper";
import { getStudyOriginLocalization } from "@/lib/study-origin-localization";
import {
  StudyMasterHook,
  StudyMasterAntiAgent,
  StudyMasterFaq,
  StudyMasterCrossProduct,
  StudyMasterShamool,
  type StudyFaqItem,
} from "@/components/study-master";

// Cache indefinitely (revalidate:Infinity). Page data is static in-repo JSON that
// only changes on redeploy (which cold-starts the ISR cache -- pages re-render on
// next hit); a timed TTL only produced byte-identical daily ISR re-writes (cost).
export const revalidate = false;
// On-demand ISR — the origin universe is millions of leaves; we seed nothing and
// render each on first request, exactly like the big matrix routes on the other
// products. (generateStaticParams returns [] so the build never enumerates them.)
export const dynamicParams = true;

const SITE_URL = "https://almistudy.almiworld.com";
const FROM = "from-";

type Params = { slug: string; subject: string; origin: string };

export function generateStaticParams() {
  return [];
}

// Resolve the params into the entities the page needs, or null when invalid.
function resolve(slugParams: { slug: string; subject: string; origin: string }) {
  const u = getUniversityBySlug(slugParams.slug);
  if (!u) return null;
  if (!slugParams.origin.startsWith(FROM)) return null;
  const originSlug = slugParams.origin.slice(FROM.length);
  const originCountry = getCountryBySlug(originSlug);
  if (!originCountry) return null; // origin must be a real directory country
  if (!SUBJECT_ORDER.includes(slugParams.subject as SubjectSlug)) return null;
  const subject = slugParams.subject as SubjectSlug;
  const taught = getCanonicalSubjects(u).includes(subject);
  return { u, subject, originSlug, originCountry, taught };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const p = await params;
  const r = resolve(p);
  if (!r) return {};
  const { u, subject, originSlug, originCountry, taught } = r;
  const subjectName = SUBJECT_NAMES[subject];
  const year = new Date().getFullYear();
  const selfUrl = `${SITE_URL}/university/${u.slug}/${subject}/from-${originSlug}`;
  // Real-data-or-canonical-up: untaught subject → up to the verified uni profile.
  const canonical = taught ? selfUrl : `${SITE_URL}/university/${u.slug}`;
  const title = taught
    ? `${subjectName} at ${u.name} from ${originCountry.name} (${year})`
    : `${u.name} (${year})`;
  const description = taught
    ? `Can a student from ${originCountry.name} study ${subjectName} at ${u.name}, ${u.country.name}? Verified accreditation, the application route, and the English-test and cost context — no agent needed. AlmiStudy.`
    : `${u.name} in ${u.city}, ${u.country.name} — verified accreditation and the subjects it offers. AlmiStudy.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description, siteName: "AlmiStudy" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function Facts({ u }: { u: University }) {
  const verified = u.accreditationBodyVerifiedDate ?? null;
  return (
    <dl className="text-sm text-zinc-700 dark:text-zinc-300 grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-4 gap-y-2 mb-8">
      <dt className="text-xs uppercase tracking-wide text-zinc-500">University</dt>
      <dd>{u.name} — {u.city}, {u.country.name}</dd>
      {u.accreditationBody ? (
        <>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Accreditation</dt>
          <dd>
            {u.accreditationBody}
            {u.accreditationRegistryUrl ? (
              <> · <a href={u.accreditationRegistryUrl} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">verify on the public registry</a></>
            ) : null}
            {verified ? ` · last verified ${verified}` : ""}
          </dd>
        </>
      ) : null}
      {u.primaryLanguage ? (
        <>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Language</dt>
          <dd>{u.primaryLanguage}</dd>
        </>
      ) : null}
      {u.officialWebsite ? (
        <>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Official site</dt>
          <dd><a href={u.officialWebsite} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:no-underline">{u.officialWebsite}</a></dd>
        </>
      ) : null}
    </dl>
  );
}

export default async function OriginLeafPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const p = await params;
  const r = resolve(p);
  if (!r) notFound();
  const { u, subject, originSlug, originCountry, taught } = r;
  const subjectName = SUBJECT_NAMES[subject];
  const origin = originCountry.name;
  const dest = u.country.name;

  // ── Canonical-up render: the university does not list this subject. No
  // fabricated claim — point to the verified profile + the subjects it offers.
  if (!taught) {
    const offered = getCanonicalSubjects(u);
    return (
      <main className="flex flex-col flex-1 px-6 py-10 sm:py-14">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">{u.name}</h1>
          <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6 max-w-3xl">
            Our verified directory doesn&apos;t list {subjectName} at {u.name}. We won&apos;t claim a
            subject a university doesn&apos;t teach — here is {u.name}&apos;s verified profile and the
            subjects it does offer.
          </p>
          <p className="mb-6">
            <Link href={`/university/${u.slug}`} className="inline-block rounded-pill bg-coral px-6 py-3 text-sm font-semibold text-white hover:bg-coral-deep transition-colors">
              See {u.name} — verified profile →
            </Link>
          </p>
          {offered.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {offered.map((s) => (
                <li key={s}>
                  <Link href={`/university/${u.slug}/${s}/from-${originSlug}`} className="inline-block px-3 py-1.5 rounded-full border border-peach bg-cream hover:bg-cream-soft text-sm text-plum transition-colors">
                    {SUBJECT_NAMES[s]} from {origin}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    );
  }

  // ── Full self-canonical origin leaf (real data: the uni teaches the subject) ──
  const local = getStudyOriginLocalization(originSlug, u.country.slug); // rich for 8 dests × 10 origins, else null
  const year = new Date().getFullYear();

  const localizedFaq: StudyFaqItem[] = [
    {
      q: `Can a student from ${origin} study ${subjectName} at ${u.name}?`,
      a: `Yes. ${u.name} accepts direct international applications, including from ${origin}, and lists ${subjectName} among its subjects. You'll meet the programme's entry requirements and typically a verified English score (IELTS/TOEFL/PTE) — apply directly to the university, no agent needed.`,
    },
    {
      q: `What does ${u.name} require for ${subjectName}?`,
      a: `Entry expectations are set per programme by ${u.name}${u.accreditationBody ? ` (accredited by ${u.accreditationBody})` : ""}. Confirm the current ${subjectName} requirement on the university's official admissions page — we link it directly and never quote a number that can go stale.`,
    },
    {
      q: `Do I need an agent to apply to ${u.name} from ${origin}?`,
      a: `No. Universities welcome direct applications. AlmiStudy gives you ${u.name}'s verified data directly so you can apply yourself — without losing thousands to a commission-paid middleman.`,
    },
  ];

  return (
    <main className="flex flex-col flex-1 px-6 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-zinc-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href={`/universities/${u.country.slug}`} className="hover:underline">{dest}</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href={`/university/${u.slug}`} className="hover:underline">{u.name}</Link></li>
            <li aria-hidden="true">›</li>
            <li><span className="font-medium text-zinc-900 dark:text-zinc-100">{subjectName} from {origin}</span></li>
          </ol>
        </nav>

        <header className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-coral mb-2">{origin} → {dest} · {subjectName} · {year}</p>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-3">
            {subjectName} at {u.name} — from {origin}
          </h1>
          <p className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-3xl">
            Planning to study {subjectName} at {u.name} in {dest} from {origin}? Here&apos;s the honest
            picture — the verified university, the direct application route, and the funding, visa and
            English-test context that changes when you apply from {origin}.
          </p>
        </header>

        {/* MASTER anti-agent hook (localized) */}
        <StudyMasterHook localizedSuffix={` for ${subjectName} at ${u.name}`} />

        <Facts u={u} />

        {/* LOCALIZED origin-specific block — rich for researched corridors, honest
            generic otherwise. Real funding/visa/English context, never invented. */}
        <section className="mb-10" aria-labelledby="origin-title">
          <h2 id="origin-title" className="text-lg font-semibold tracking-tight text-plum dark:text-zinc-100 mb-3">
            {local ? local.heading : `Coming from ${origin}: studying ${subjectName} in ${dest}`}
          </h2>
          {local ? (
            <>
              <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-3xl mb-3">{local.subHook}</p>
              {local.bullets.length > 0 && (
                <ul className="space-y-2 max-w-3xl">
                  {local.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      <span aria-hidden className="mt-0.5 text-coral">✓</span><span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-3xl">
              Applying from {origin}, the route is: meet {u.name}&apos;s {subjectName} entry requirements,
              prove your English with a verified test (IELTS/TOEFL/PTE), and apply directly — then arrange
              the student visa for {dest}. {u.name} is accredited{u.accreditationBody ? ` by ${u.accreditationBody}` : ""};
              confirm the live requirement on its official admissions page.
            </p>
          )}
        </section>

        {/* MASTER FAQ (localized + master Qs) */}
        <StudyMasterFaq heading={`${subjectName} at ${u.name} from ${origin} — questions answered`} extra={localizedFaq} />

        {/* MASTER anti-agent truth + rest-of-the-path + Shamool */}
        <StudyMasterAntiAgent />
        <StudyMasterCrossProduct />
        <StudyMasterShamool />

        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
          We list institutions whose accreditation we have verified against a recognized national or
          international accrediting body. Listing does not vouch for any specific programme&apos;s
          recognition, admissions outcomes, or credential transferability. This is honest guidance, not
          immigration advice — confirm visa rules with the official authority for {dest}.
        </p>
      </div>
    </main>
  );
}
