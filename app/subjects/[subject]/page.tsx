// Placeholder pages. Real subject pages ship after University.subjectCategories
// controlled vocabulary migration (queued). Until then, each subject route
// renders a brief explainer + cross-links to the working browse paths.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const SITE_URL = "https://almistudy.almiworld.com";

export type SubjectSlug =
  | "medicine-health-sciences"
  | "engineering-technology"
  | "computer-science-it"
  | "business-management"
  | "law"
  | "natural-sciences"
  | "arts-humanities"
  | "social-sciences"
  | "education"
  | "mathematics-statistics"
  | "architecture-design"
  | "agriculture-environment";

export const SUBJECT_ORDER: SubjectSlug[] = [
  "medicine-health-sciences",
  "engineering-technology",
  "computer-science-it",
  "business-management",
  "law",
  "natural-sciences",
  "arts-humanities",
  "social-sciences",
  "education",
  "mathematics-statistics",
  "architecture-design",
  "agriculture-environment",
];

export const SUBJECT_NAMES: Record<SubjectSlug, string> = {
  "medicine-health-sciences": "Medicine & Health Sciences",
  "engineering-technology": "Engineering & Technology",
  "computer-science-it": "Computer Science & IT",
  "business-management": "Business & Management",
  law: "Law",
  "natural-sciences": "Natural Sciences",
  "arts-humanities": "Arts & Humanities",
  "social-sciences": "Social Sciences",
  education: "Education",
  "mathematics-statistics": "Mathematics & Statistics",
  "architecture-design": "Architecture & Design",
  "agriculture-environment": "Agriculture & Environment",
};

export function generateStaticParams() {
  return SUBJECT_ORDER.map((subject) => ({ subject }));
}

function isSubjectSlug(s: string): s is SubjectSlug {
  return (SUBJECT_ORDER as readonly string[]).includes(s);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>;
}): Promise<Metadata> {
  const { subject } = await params;
  if (!isSubjectSlug(subject)) return {};
  const name = SUBJECT_NAMES[subject];
  const url = `${SITE_URL}/subjects/${subject}`;
  const title = `${name} · AlmiStudy`;
  const description = `${name} programs at verified-accreditation universities. Subject pages are in active development; explore by country or region while we complete the controlled-vocabulary tagging across all reviewed universities.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title, description, siteName: "AlmiStudy" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  if (!isSubjectSlug(subject)) notFound();
  const name = SUBJECT_NAMES[subject];

  return (
    <main className="flex flex-col flex-1 px-6 py-10 sm:py-14 bg-cream">{/* Header + Footer provided by root layout */}
        <div className="mx-auto w-full max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-plum-faint mb-5">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-coral transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">·</li>
              <li>
                <span className="font-medium text-plum">{name}</span>
              </li>
            </ol>
          </nav>

          <header className="mb-6">
            <h1 className="text-2xl sm:text-4xl font-medium tracking-tight text-plum mb-3">
              {name}
            </h1>
            <p className="text-base sm:text-lg text-plum-soft leading-relaxed">
              We&apos;re building this section.
            </p>
          </header>

          <section className="rounded-md border border-peach bg-cream-soft p-6 mb-10">
            <p className="text-sm text-plum-soft leading-relaxed mb-4">
              Subject filtering requires controlled-vocabulary tagging across all
              reviewed universities. That work is in progress. In the meantime:
            </p>
            <ul className="text-sm text-plum-soft leading-relaxed space-y-2 list-disc pl-5">
              <li>
                <Link
                  href="/universities"
                  className="text-coral hover:text-coral-deep underline"
                >
                  Browse by country →
                </Link>
              </li>
              <li>
                <Link
                  href="/regions/asia"
                  className="text-coral hover:text-coral-deep underline"
                >
                  Browse by region →
                </Link>
              </li>
            </ul>
          </section>
        </div>
    </main>
  );
}
