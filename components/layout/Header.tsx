import Link from "next/link";
import Image from "next/image";

// Full canonical AlmiWorld family strip. Every sibling product + network links,
// with AlmiStudy (this site) omitted — its own home is the logo. Rendered inline
// as real <a> anchors that wrap to 2–3 rows; no dropdown, no overflow clipping.
const FAMILY_LINKS = [
  { label: "Home", href: "https://almiworld.com/" },
  { label: "eBooks", href: "https://almiworld.com/ebooks-2/" },
  { label: "AlmiJob", href: "https://almijob.almiworld.com/" },
  { label: "Salary Checker", href: "https://almisalary.almiworld.com/" },
  { label: "AlmiCV", href: "https://almicv.almiworld.com/" },
  { label: "AlmiPrep", href: "https://almiprep.almiworld.com/" },
  { label: "AlmiPTE", href: "https://almipte.almiworld.com/" },
  { label: "AlmiTOEFL", href: "https://almitoefl.almiworld.com/" },
  { label: "AlmiOET", href: "https://almioet.almiworld.com/" },
  { label: "AlmiDET", href: "https://almidet.almiworld.com/" },
  { label: "AlmiCELPIP", href: "https://almicelpip.almiworld.com/" },
  { label: "AlmiFrench", href: "https://almifrench.almiworld.com/" },
  { label: "AlmiSpanish", href: "https://almispanish.almiworld.com/" },
  { label: "AlmiJapanese", href: "https://almijapanese.almiworld.com/" },
  { label: "AlmiKorean", href: "https://almikorean.almiworld.com/" },
  { label: "AlmiGoethe", href: "https://almigoethe.almiworld.com/" },
  { label: "AlmiItalian", href: "https://almiitalian.almiworld.com/" },
  { label: "Contact Us", href: "https://almiworld.com/contact-us/" },
  { label: "Shamool Foundation", href: "https://shamoolfoundation.com/" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-sm border-b border-peach">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="https://almiworld.com/wp-content/uploads/2026/04/almi-latest.png"
              alt="AlmiWorld"
              width={120}
              height={40}
              className="h-8 sm:h-10 w-auto"
              unoptimized
              priority
            />
          </Link>

          <Link
            href="/universities"
            className="bg-coral hover:bg-coral-deep text-cream text-sm font-medium px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg transition-colors shrink-0"
          >
            Browse universities
          </Link>
        </div>

        <nav className="hidden md:flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-base font-semibold text-plum-soft">
          {FAMILY_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-coral transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
