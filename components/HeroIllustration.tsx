// Abstract sunrise/horizon SVG for the homepage hero. Audience-neutral —
// no people, no geography, no buildings. The dawn metaphor stands in for
// "credentials that transfer" (new horizon, fresh start) without leaning
// on any cultural or migration imagery.
//
// Solid fills only (no CSS gradients) for predictable cross-browser render.
// Hex codes match the locked brand palette in app/globals.css exactly.

export default function HeroIllustration() {
  return (
    <svg
      width="100%"
      viewBox="0 0 600 180"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ maxWidth: 600, height: "auto" }}
      role="presentation"
    >
      {/* Soft staggered sky bands above horizon (varied widths, peach + cream-soft) */}
      <rect x="100" y="24" width="380" height="10" fill="#FFE8D6" rx="2" />
      <rect x="160" y="48" width="300" height="10" fill="#FFF5E8" rx="2" />
      <rect x="60" y="72" width="440" height="10" fill="#FFE8D6" rx="2" />
      <rect x="120" y="96" width="360" height="10" fill="#FFF5E8" rx="2" />

      {/* Sun rays — 8 thin coral lines emanating from sun center (430, 110) */}
      <line x1="430" y1="60" x2="430" y2="40" stroke="#FF7A6B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="464" y1="76" x2="492" y2="58" stroke="#FF7A6B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="478" y1="110" x2="510" y2="110" stroke="#FF7A6B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="464" y1="144" x2="492" y2="162" stroke="#FF7A6B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="396" y1="76" x2="368" y2="58" stroke="#FF7A6B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="382" y1="110" x2="350" y2="110" stroke="#FF7A6B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="396" y1="144" x2="368" y2="162" stroke="#FF7A6B" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="430" y1="160" x2="430" y2="178" stroke="#FF7A6B" strokeWidth="1.5" strokeLinecap="round" />

      {/* Sun — solid coral, center-right */}
      <circle cx="430" cy="110" r="30" fill="#FF7A6B" />

      {/* Horizon line, thin plum */}
      <line x1="0" y1="130" x2="600" y2="130" stroke="#2D1B3D" strokeWidth="1" />

      {/* Sage mound below horizon — a hint, not a feature */}
      <ellipse cx="180" cy="139" rx="50" ry="9" fill="#A8D5BA" opacity="0.6" />
    </svg>
  );
}
