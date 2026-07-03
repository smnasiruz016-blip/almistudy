import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-sm border-b border-peach">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
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

        <nav className="hidden md:flex items-center gap-6 text-sm text-plum-soft">
          <Link href="/" className="hover:text-coral transition-colors">AlmiStudy Home</Link>
          <a href="https://almicv.almiworld.com" className="hover:text-coral transition-colors">AlmiCV</a>
          <a href="https://almiprep.almiworld.com" className="hover:text-coral transition-colors">AlmiPrep</a>
          <a href="https://almijob.almiworld.com" className="hover:text-coral transition-colors">AlmiJob</a>
          <a href="https://almisalary.almiworld.com" className="hover:text-coral transition-colors">Salary Checker</a>
          <a href="https://almipte.almiworld.com" className="hover:text-coral transition-colors">AlmiPTE</a>
          <a href="https://almitoefl.almiworld.com" className="hover:text-coral transition-colors">AlmiTOEFL</a>
          <a href="https://almioet.almiworld.com" className="hover:text-coral transition-colors">AlmiOET</a>
          <a href="https://almidet.almiworld.com" className="hover:text-coral transition-colors">AlmiDET</a>
          <a href="https://almicelpip.almiworld.com" className="hover:text-coral transition-colors">AlmiCELPIP</a>
          <a href="https://almigoethe.almiworld.com" className="hover:text-coral transition-colors">AlmiGoethe</a>
          <a href="https://almifrench.almiworld.com" className="hover:text-coral transition-colors">AlmiFrench</a>
          <a href="https://almispanish.almiworld.com" className="hover:text-coral transition-colors">AlmiSpanish</a>
          <a href="https://almijapanese.almiworld.com" className="hover:text-coral transition-colors">AlmiJapanese</a>
          <a href="https://almiworld.com/ebooks-2/" className="hover:text-coral transition-colors">eBooks</a>
          <a href="https://almiworld.com" className="hover:text-coral transition-colors">AlmiWorld</a>
        </nav>

        <Link
          href="/universities"
          className="bg-coral hover:bg-coral-deep text-cream text-sm font-medium px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg transition-colors shrink-0"
        >
          Browse universities
        </Link>
      </div>
    </header>
  );
}
