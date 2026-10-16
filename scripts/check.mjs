// bun run check — finds leftovers and broken references before you commit or finish a clip.
//
// Errors (exit 1): a staticFile() path that does not exist, a referenced asset that git does not track,
// a script import or output folder that points nowhere, a path cited in the docs that does not exist
// (repo paths, and kits/... or <clip>/... paths under generated/components/), a Root without its entry
// (or the reverse).
// Notes (exit 0): components nothing uses, older takes that a newer V<n> replaces.
//
// Usage: bun run check            (everything)
//        bun run check --errors   (errors only)

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join, normalize, relative } from "node:path";

const ROOT = join(import.meta.dir, "..");
process.chdir(ROOT);
const errorsOnly = process.argv.includes("--errors");

const read = (p) => readFileSync(p, "utf8");
const walk = (dir, keep) => {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, keep));
    else if (keep(e.name)) out.push(p);
  }
  return out;
};
const tracked = new Set(execSync("git ls-files", { encoding: "utf8", maxBuffer: 1 << 26 }).split("\n"));
const isTracked = (p) => tracked.has(p) || [...tracked].some((t) => t.startsWith(p + "/"));
const resolveModule = (p) =>
  ["", ".ts", ".tsx", ".mjs", ".js", ".json", "/index.ts", "/index.tsx"].map((x) => p + x).find((c) => existsSync(c) && statSync(c).isFile());

const errors = [];
const notes = [];

// ---- components and what reaches them
const compFiles = walk("generated/components", (n) => /\.(tsx?)$/.test(n));
const byName = new Map(compFiles.map((p) => [p.replace(/^.*\//, "").replace(/\.tsx?$/, ""), p]));
const text = new Map(compFiles.map((p) => [p, read(p)]));
const importRe = /(?:from\s+|import\(\s*)["'](\.{1,2}\/[^"']+)["']/g;
const importsOf = (file, src) => {
  const out = [];
  for (const m of src.matchAll(importRe)) {
    const target = resolveModule(normalize(join(dirname(file), m[1])));
    if (target) out.push(target);
    else errors.push(`${file}: import ${m[1]} points nowhere`);
  }
  return out;
};

const srcFiles = readdirSync("src").filter((f) => /\.tsx?$/.test(f)).map((f) => `src/${f}`);
const seeds = new Set();
for (const f of srcFiles) for (const t of importsOf(f, read(f))) if (t.startsWith("generated/")) seeds.add(t);

const docs = [
  "README.md",
  "AGENTS.md",
  "CRAFT.md",
  "scripts/README.md",
  "scripts/maps/README.md",
  "pipeline/README.md",
  "generated/components/kits/chinatalk/chinatalkVintage.md",
  ...["premiere-project", "news-card", "stills-sourcing"].map((s) => `.agents/skills/${s}/SKILL.md`),
  ...readdirSync("styles").map((f) => `styles/${f}`),
].filter(existsSync);
const docText = docs.map(read).join("\n");
for (const [name, p] of byName) if (new RegExp(`(?<![A-Za-z0-9_])${name}(?![A-Za-z0-9_])`).test(docText)) seeds.add(p);

const scriptFiles = walk("scripts", (n) => /\.(mjs|ts|js|py)$/.test(n));
const scriptText = new Map(scriptFiles.map((p) => [p, read(p)]));
for (const [, src] of scriptText)
  for (const m of src.matchAll(/generated\/components\/([A-Za-z0-9_/.-]+?)(?:\.tsx?)?["'`]/g)) {
    const p = resolveModule(`generated/components/${m[1]}`);
    if (p) seeds.add(p);
  }

const reached = new Set();
const stack = [...seeds];
const deps = new Map(compFiles.map((p) => [p, importsOf(p, text.get(p))]));
while (stack.length) {
  const p = stack.pop();
  if (reached.has(p)) continue;
  reached.add(p);
  for (const d of deps.get(p) ?? []) if (!reached.has(d)) stack.push(d);
}
const orphans = compFiles.filter((p) => !reached.has(p));
if (orphans.length) notes.push(`Components nothing uses (no cut, script or doc reaches them): ${orphans.length}\n  ` + orphans.join("\n  "));

// older takes: X, XV2, XV3 … where a higher V exists
const takes = new Map();
for (const name of byName.keys()) {
  const m = name.match(/^(.*?)(?:V(\d+))?$/);
  const base = m[1], v = m[2] ? +m[2] : 1;
  if (!takes.has(base)) takes.set(base, []);
  takes.get(base).push([v, name]);
}
const older = [];
for (const [, list] of takes) {
  if (list.length < 2) continue;
  const top = Math.max(...list.map(([v]) => v));
  for (const [v, name] of list) if (v < top) older.push(`${name} (newest V${top})`);
}
if (older.length) notes.push(`Older takes a newer V<n> replaces (keep while the user is still comparing): ${older.length}\n  ` + older.sort().join("\n  "));

// ---- assets
const literal = /staticFile\(\s*["']([^"'$`]+)["']\s*\)/g;
const template = /staticFile\(\s*`([^`$]*)\$\{/g;
for (const [p, src] of [...text, ...srcFiles.map((f) => [f, read(f)])]) {
  for (const m of src.matchAll(literal)) {
    const a = `public/${m[1].replace(/^\//, "")}`;
    if (!existsSync(a)) errors.push(`${p}: staticFile('${m[1]}') does not exist`);
    else if (!isTracked(a) && !/^public\/lovable\/fika1\/src\//.test(a)) errors.push(`${p}: ${a} exists but is not committed`);
  }
  for (const m of src.matchAll(template)) {
    const pre = m[1].replace(/^\//, "");
    if (pre.includes("/") && !existsSync(`public/${pre.slice(0, pre.lastIndexOf("/"))}`))
      errors.push(`${p}: staticFile(\`${pre}…\`) folder does not exist`);
  }
}

// ---- scripts: imports and cwd-relative inputs/outputs
for (const [p, src] of scriptText) {
  if (p.endsWith(".py")) continue;
  for (const m of src.matchAll(importRe)) {
    if (resolveModule(normalize(join(dirname(p), m[1])))) continue;
    // an import inside code the script writes out resolves next to its output instead
    const outDirs = [...src.matchAll(/["'`](generated\/components[A-Za-z0-9_/-]*)\/[^"'`/]*["'`]/g)].map((o) => o[1]);
    if (outDirs.some((d) => resolveModule(normalize(join(d, m[1]))))) continue;
    errors.push(`${p}: import ${m[1]} points nowhere`);
  }
  for (const m of src.matchAll(/["'`]((?:generated|public|scripts|assets-src)\/[A-Za-z0-9_./-]+)["'`]/g)) {
    const q = m[1];
    if (existsSync(q)) continue;
    const folder = q.includes(".") ? dirname(q) : q;
    if (!existsSync(folder)) errors.push(`${p}: path ${q} — folder ${folder} does not exist`);
  }
}

// ---- docs: backticked repo paths must exist
// Repo paths (with an extension) from the root; kits/... and <clip>/... (as the Styles table and the style files
// write them, or ../kits/... as a cut imports a kit) from generated/components/. A <clip>/... path counts when its
// first folder is a clip folder, or looks like a clip slug and the path ends in .ts/.tsx.
const prefixes = ["generated/", "src/", "scripts/", "public/", "styles/", "assets-src/", ".agents/", "pipeline/"];
const COMP = "generated/components";
const compDirs = new Set(readdirSync(COMP, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name));
for (const d of docs)
  for (const m of read(d).matchAll(/`([A-Za-z0-9_./-]+)`/g)) {
    const q = m[1];
    if (!q.includes("/") || q.includes("...")) continue; // `kits/...` is a placeholder
    const hasExt = /\.[a-z0-9]+$/.test(q);
    if (prefixes.some((x) => q.startsWith(x))) {
      if (hasExt && !existsSync(q)) errors.push(`${d}: cites ${q}, which does not exist`);
      continue;
    }
    const r = q.replace(/^\.\.\//, "");
    const first = r.split("/")[0];
    const underComp =
      first === "kits" || (compDirs.has(first) ? hasExt : /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(first) && /\.tsx?$/.test(r));
    if (underComp && !existsSync(`${COMP}/${r}`) && !resolveModule(`${COMP}/${r}`))
      errors.push(`${d}: cites ${q}, which is not in ${COMP}/`);
  }

// ---- Root / entry pairs
const roots = new Set(srcFiles.filter((f) => /^src\/Root\..+\.tsx$/.test(f)).map((f) => f.slice(9, -4)));
const entries = new Set(srcFiles.filter((f) => /^src\/entry\..+\.ts$/.test(f)).map((f) => f.slice(10, -3)));
for (const n of entries) if (!roots.has(n)) errors.push(`src/entry.${n}.ts has no src/Root.${n}.tsx`);
for (const n of roots) if (!entries.has(n)) errors.push(`src/Root.${n}.tsx has no src/entry.${n}.ts`);

// ---- report
const uniq = [...new Set(errors)];
if (!errorsOnly) for (const n of notes) console.log(`NOTE  ${n}\n`);
for (const e of uniq) console.log(`ERROR ${e}`);
console.log(`\n${uniq.length} error(s)${errorsOnly ? "" : `, ${orphans.length} unused component(s), ${older.length} older take(s)`}.`);
process.exit(uniq.length ? 1 : 0);
