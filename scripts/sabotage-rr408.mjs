// RR-408 A9 · the count tests must turn RED when a count is broken on purpose and GREEN when restored (each file
// restored byte-for-byte). Run: node scripts/sabotage-rr408.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
const TEST = "scripts/rr408-home-search.test.mts";
const run = () => spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsx", "--test", TEST], { encoding: "utf8", shell: process.platform === "win32" });
const CASES = [
  /* a country falls out of the region map: the region counts no longer add up to the total */
  { name: "Pakistan is dropped from the region map", file: "lib/regions.ts", from: 'pakistan: "south-asia", ', to: "", fail: "pakistan (Asia) belongs to a region" },
  /* a region count is computed wrongly (each country counted once more) */
  { name: "a region's university count is off by one per country", file: "lib/regions.ts", from: "b.unis += c.count;", to: "b.unis += c.count + 1;", fail: "region university counts add up to the total" },
  /* a merged slug goes back into the sitemap */
  { name: "the merges are ignored", file: "lib/page-relations.ts", from: "!MERGED.has(u.slug)", to: "true", fail: "out of the pages and the sitemap" },
  /* the full-name rescue for shortened titles that meet is switched off */
  { name: "two shortened titles may meet", file: "lib/university-title.ts", from: "(count.get(titleKey(t)) ?? 0) > 1 ?", to: "(count.get(titleKey(t)) ?? 0) > 99 ?", fail: "title clashes" },
  /* the place leaves the full-name title too */
  { name: "the title drops the place", file: "lib/university-title.ts", from: "`${u.name}, ${placeOf(u)} (${year})` : t", to: "`${u.name} (${year})` : t", fail: "the title names the city" },
];
const out = [];
for (const c of CASES) {
  if (!existsSync(c.file)) { out.push({ name: c.name, red: false, why: "file not found" }); continue; }
  const raw = readFileSync(c.file, "utf8");
  if (!raw.includes(c.from)) { out.push({ name: c.name, red: false, why: "anchor missing" }); continue; }
  try { writeFileSync(c.file, raw.split(c.from).join(c.to)); const r = run(); out.push({ name: c.name, red: r.status !== 0 && (r.stdout + r.stderr).includes(c.fail) }); }
  finally { writeFileSync(c.file, raw); }
  if (readFileSync(c.file, "utf8") !== raw) throw new Error(`${c.file} NOT restored`);
}
const g = run();
for (const o of out) console.log(`  [${o.red ? "RED as required" : "STAYED GREEN — BLIND"}] ${o.name}${o.why ? ` (${o.why})` : ""}`);
console.log(`  restored: tests ${g.status === 0 ? "GREEN" : "NOT GREEN"}`);
const pass = out.every((o) => o.red) && g.status === 0;
console.log(pass ? `\nSABOTAGE PASS — ${out.length}/${out.length} RED, then GREEN` : "\nSABOTAGE FAIL");
process.exitCode = pass ? 0 : 1;
