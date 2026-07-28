// University × subject base page: /university/[uni]/[subject]
//
// "Study [subject] at [university]" — real where the university teaches the
// subject (self-canonical + indexable), else canonical-up to /university/[slug]
// (never a fabricated subject claim, never noindex). On-demand ISR.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUniversityBySlug, type University } from "@/lib/page-relations";
import { getCanonicalSubjects, SUBJECT_NAMES, SUBJECT_ORDER, type SubjectSlug } from "@/lib/subject-mapper";
import {
  StudyMasterHook,
  StudyMasterAntiAgent,
  StudyMasterFaq,
  StudyMasterCrossProduct,
  StudyMasterShamool,
  type StudyFaqItem,
} from "@/components/study-master";
import * as StaticIndex from "@/lib/static-index";

// Cache indefinitely (revalidate:Infinity). Page data is static in-repo JSON that
// only changes on redeploy (which cold-starts the ISR cache -- pages re-render on
// next hit); a timed TTL only produced byte-identical daily ISR re-writes (cost).
export const revalidate = false;
// BOUNDED ON DEMAND — see lib/isr-policy.ts for the rule and the entry.
//
// 19,310 university x subject-TAUGHT pairs. They are NOT prebuilt: doing so produced
// 244,331 of the 270,400 output files that made the 2026-07-28 deployment fail after
// a successful 7-minute build. They render on first request instead — ~19,310 ISR
// writes per deploy, pennies against the millions that caused the $254.57 bill.
//
// This is safe ONLY because the valid space is finite and known: resolve() returns
// null for any slug or subject outside the in-repo data and the page calls notFound(),
// so an invented URL costs one cached 404, never a fabricated page. The sitemap
// advertises exactly these 19,310 and nothing more.
export const dynamicParams = true;

const SITE_URL = "https://almistudy.almiworld.com";

type Params = { slug: string; subject: string };

// Intentionally empty: this route is bounded-on-demand, not prebuilt. The valid set
// lives in StaticIndex.universitySubjectPairs() and is what the SITEMAP advertises —
// it is not returned here, or Next would prebuild all 19,310 and blow the output limit.
export function generateStaticParams() {
  return [];
}

function resolve(p: { slug: string; subject: string }) {
  const u = getUniversityBySlug(p.slug);
  if (!u) return null;
  if (!SUBJECT_ORDER.includes(p.subject as SubjectSlug)) return null;
  const subject = p.subject as SubjectSlug;
  return { u, subject, taught: getCanonicalSubjects(u).includes(subject) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const r = resolve(await params);
  if (!r) return {};
  const { u, subject, taught } = r;
  const subjectName = SUBJECT_NAMES[subject];
  const year = new Date().getFullYear();
  const self = `${SITE_URL}/university/${u.slug}/${subject}`;
  const canonical = taught ? self : `${SITE_URL}/university/${u.slug}`;
  const title = taught ? `${subjectName} at ${u.name} (${year})` : `${u.name} (${year})`;
  const description = taught
    ? `Study ${subjectName} at ${u.name}, ${u.country.name} — verified accreditation, the direct application route, and the English-test context. Free, no agent. AlmiStudy.`
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
      {u.officialWebsite ? (
        <>
          <dt className="text-xs uppercase tracking-wide text-zinc-500">Official site</dt>
          <dd><a href={u.officialWebsite} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:no-underline">{u.officialWebsite}</a></dd>
        </>
      ) : null}
    </dl>
  );
}

export default async function UniversitySubjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const r = resolve(await params);
  if (!r) notFound();
  const { u, subject, taught } = r;
  const subjectName = SUBJECT_NAMES[subject];

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
                  <Link href={`/university/${u.slug}/${s}`} className="inline-block px-3 py-1.5 rounded-full border border-peach bg-cream hover:bg-cream-soft text-sm text-plum transition-colors">
                    {SUBJECT_NAMES[s]}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    );
  }

  const year = new Date().getFullYear();
  const localizedFaq: StudyFaqItem[] = [
    {
      q: `Does ${u.name} offer ${subjectName}?`,
      a: `Yes — ${u.name} lists ${subjectName} among its subjects${u.accreditationBody ? `, and is accredited by ${u.accreditationBody}` : ""}. Confirm the specific programme and its entry requirements on the university's official admissions page.`,
    },
    {
      q: `What does ${u.name} require for ${subjectName}?`,
      a: `Entry expectations are set per programme by ${u.name}, and you'll typically need a verified English score (IELTS/TOEFL/PTE). We link the official admissions page directly and never quote a number that can go stale.`,
    },
    {
      q: `Do I need an agent to apply for ${subjectName} at ${u.name}?`,
      a: `No. Universities welcome direct applications. AlmiStudy gives you the verified data directly so you can apply yourself — without a commission-paid middleman.`,
    },
  ];

  return (
    <main className="flex flex-col flex-1 px-6 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-zinc-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href={`/universities/${u.country.slug}`} className="hover:underline">{u.country.name}</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href={`/university/${u.slug}`} className="hover:underline">{u.name}</Link></li>
            <li aria-hidden="true">›</li>
            <li><span className="font-medium text-zinc-900 dark:text-zinc-100">{subjectName}</span></li>
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-3">
            {subjectName} at {u.name} ({year})
          </h1>
          <p className="text-base sm:text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-3xl">
            {u.name} in {u.city}, {u.country.name} offers {subjectName}. Here&apos;s the verified
            picture — accreditation you can check, the direct application route, and the English-test
            context — so you can apply yourself, no agent needed.
          </p>
        </header>

        <StudyMasterHook localizedSuffix={` for ${subjectName} at ${u.name}`} />
        <Facts u={u} />

        <StudyMasterFaq heading={`${subjectName} at ${u.name} — questions answered`} extra={localizedFaq} />
        <StudyMasterAntiAgent />
        <StudyMasterCrossProduct />
        <StudyMasterShamool />

        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
          We list institutions whose accreditation we have verified against a recognized national or
          international accrediting body. Listing does not vouch for any specific programme&apos;s
          recognition, admissions outcomes, or credential transferability.
        </p>
      </div>
    </main>
  );
}
