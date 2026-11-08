// RR-398 · the AlmiWorld family footer (the same columns and links as almiworld.com), from the one generated kit
// (lib/almiworld-family.ts + components/almiworld/, made by almiworld-site/tools/make-family-kit.mjs). No eBooks, no old
// WordPress links. AlmiStudy's own links sit in one row under the columns.
import { AlmiWorldFooter } from "@/components/almiworld/AlmiWorldFooter";

export default function Footer() {
  return (
    <div className="mt-14">
      <AlmiWorldFooter
        own={[
          { label: "AlmiStudy", href: "/" },
          { label: "Universities", href: "/universities" },
        ]}
      />
    </div>
  );
}
