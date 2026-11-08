import Link from "next/link";
import Image from "next/image";
import { AlmiWorldBar } from "@/components/almiworld/AlmiWorldBar";

// AlmiStudy header. RR-398: on top, the AlmiWorld family bar (logo + Home to almiworld.com, and the same menus as almiworld.com)
// from the one generated kit (lib/almiworld-family.ts + components/almiworld/). Under it AlmiStudy's own logo link and its own
// "Browse universities" button. The old family strip (with its eBooks and WordPress links) is gone; the family links, including
// their phone menu ("AlmiWorld ☰"), live in the bar.
export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-sm border-b border-peach">
      <AlmiWorldBar />
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
      </div>
    </header>
  );
}
