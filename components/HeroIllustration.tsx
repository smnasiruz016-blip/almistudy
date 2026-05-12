import Image from "next/image";

// Founder-provided PNG banner bakes in wordmark + headline + subhead +
// 6-region pins + dot world map + students/landmarks composite + feature
// icons + stats bar. PNG was explicitly chosen for lossless text crispness;
// do not compress or convert.
//
// Alt text is load-bearing for accessibility AND SEO — since the headline
// is no longer in the DOM as text, the alt copy spells out the wordmark,
// the doctrine line, and the 6 global regions so search engines and
// screen readers can still extract semantic content.
//
// next/image with priority: this is the LCP element above the fold.

export default function HeroIllustration() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
      <Image
        src="/hero-banner.png"
        alt="AlmiStudy: Find your university anywhere. A verified directory of universities worldwide across 6 global regions — North America, South America, Europe, Africa, Asia, Oceania. Built in the open."
        width={1831}
        height={859}
        priority
        className="w-full h-auto rounded-lg"
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
      />
    </div>
  );
}
