// bun run cut — start a new cut from its style's template, so no builder copies boilerplate.
//
// Usage:
//   bun run cut <Name> --clip <clip-slug> --style <style> [--fps 24000/1001 | 23.976 | 25 | 30 ...]
//               [--seconds S | --frames N] [--wide] [--size WxH] [--overlay] [--tag <tag-style>]
//
//   <style>  dwarkesh | map | 3d | chinatalk | cheeky-pint | core-memory | humble | sporttouchen | lovable | name-tag
//   --wide   16:9 at 2048x1080 (CRAFT.md Format); --size sets any other frame (Lovable matches its sequence)
//   --overlay  a transparent overlay: no ground, static camera (Humble and name tags always are)
//   --tag    name-tag only: whose tag to wrap (core-memory | cheeky-pint | chinatalk | map | humble)
//
// Writes generated/components/<clip>/<Name>.tsx (from scripts/templates/<style>.tsx), src/Root.<Name>.tsx and
// src/entry.<Name>.ts. Never overwrites; prints the preview and final render commands.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const COMPONENTS = join(ROOT, "generated/components");
const TEMPLATES = join(ROOT, "scripts/templates");

const fail = (msg) => {
  console.error(`bun run cut: ${msg}`);
  process.exit(1);
};

// ---- arguments
const STYLES = {
  dwarkesh: { label: "Dwarkesh style", file: "styles/dwarkesh.md", wide: false, noOverlay: true },
  map: { label: "Dwarkesh map style", file: "styles/dwarkesh-map.md", wide: false },
  "3d": { label: "Dwarkesh 3D style", file: "styles/dwarkesh-3d.md", wide: false, noOverlay: true },
  chinatalk: { label: "ChinaTalk style (newsprint)", file: "styles/chinatalk.md", wide: false, noOverlay: true },
  "cheeky-pint": { label: "Cheeky Pint style (stout)", file: "styles/cheeky-pint.md", wide: false },
  "core-memory": { label: "Core memory podcast style", file: "styles/core-memory.md", wide: true },
  humble: { label: "Humble Co. style", file: "styles/humble.md", wide: true, overlay: true, fps: 30 },
  sporttouchen: { label: "Sporttouchen style", file: "styles/sporttouchen.md", wide: true, fps: 30 },
  lovable: { label: "Lovable style", file: "styles/lovable.md", wide: true },
  "name-tag": { label: "Name tag", file: "styles/name-tags.md", wide: false, overlay: true },
};
// name-tag --tag: the style's current tag (styles/name-tags.md), its props, and the full-size point of the tag
// that goes to the house spot (x 180; bottom y 1280, or top y 1140 for the map plate) at 0.72x.
const TAGS = {
  "core-memory": { file: "NameTagCoreMemory", extra: "", frames: 96, at: "{ x: 84, y: 1620, toX: 180, toY: 1280 }", atNote: "bottom-left" },
  "cheeky-pint": { file: "NameTagStout", extra: " backdrop={false}", frames: 96, at: "{ x: 84, y: 1620, toX: 180, toY: 1280 }", atNote: "bottom-left" },
  chinatalk: { file: "NameTagNewsprint", extra: " durationInFrames={DURATION}", frames: null, at: "{ x: 84, y: 1620, toX: 180, toY: 1280 }", atNote: "bottom-left" },
  map: { file: "NameTagMapStyle", extra: " durationInFrames={DURATION}", frames: null, at: "{ x: 84, y: 1330, toX: 180, toY: 1140 }", atNote: "the plate's top-left" },
  humble: { file: "NameTagHumble", extra: "", frames: 150, at: "{ x: 84, y: 1620, toX: 180, toY: 1280 }", atNote: "bottom-left" },
};

const argv = process.argv.slice(2);
const flags = new Map();
const positional = [];
const BOOL = new Set(["--wide", "--overlay"]);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--help" || a === "-h") {
    const head = readFileSync(join(ROOT, "scripts/new-cut.mjs"), "utf8").split("\n");
    console.log(head.slice(0, head.findIndex((l) => !l.startsWith("//"))).map((l) => l.slice(3)).join("\n"));
    process.exit(0);
  }
  if (a.startsWith("--")) {
    const [key, inline] = a.split("=", 2);
    if (BOOL.has(key)) flags.set(key, true);
    else {
      const v = inline ?? argv[++i];
      if (v === undefined || v.startsWith("--")) fail(`${key} needs a value`);
      flags.set(key, v);
    }
  } else positional.push(a);
}
const known = new Set(["--clip", "--style", "--fps", "--seconds", "--frames", "--wide", "--size", "--overlay", "--tag"]);
for (const k of flags.keys()) if (!known.has(k)) fail(`unknown flag ${k} (bun run cut --help)`);
if (positional.length !== 1) fail("give exactly one cut name: bun run cut <Name> --clip <clip-slug> --style <style>");

const name = positional[0];
const clip = flags.get("--clip");
const styleKey = flags.get("--style");
if (!/^[A-Z][A-Za-z0-9]*$/.test(name) || !/[a-z]/.test(name) || name.length < 3)
  fail(`"${name}" is not a PascalCase cut name (letters and digits, starting with a capital, e.g. SixMonthsBehind)`);
if (!clip) fail("--clip <clip-slug> is required (lowercase-hyphen, e.g. sarah-death-ground)");
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clip)) fail(`clip slug "${clip}" must be lowercase words joined by hyphens`);
if (clip === "kits") fail(`"kits" holds the shared kits; give the clip's own slug`);
if (!styleKey || !STYLES[styleKey]) fail(`--style must be one of: ${Object.keys(STYLES).join(", ")}`);
const style = STYLES[styleKey];

// ---- name not used anywhere (case-insensitive: the Mac's disk is)
const taken = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      const hit = taken(p);
      if (hit) return hit;
    } else if (e.name.replace(/\.(tsx?|mjs|js)$/, "").toLowerCase() === name.toLowerCase()) return p;
  }
  return null;
};
const clash = taken(COMPONENTS);
if (clash) fail(`${name} is already used: ${clash.slice(ROOT.length + 1)}`);
const compRel = `generated/components/${clip}/${name}.tsx`;
const rootRel = `src/Root.${name}.tsx`;
const entryRel = `src/entry.${name}.ts`;
const srcNames = readdirSync(join(ROOT, "src")).map((f) => f.toLowerCase());
for (const rel of [rootRel, entryRel])
  if (existsSync(join(ROOT, rel)) || srcNames.includes(rel.slice(4).toLowerCase())) fail(`${rel} already exists; pick another name`);

// ---- frame rate
const parseFps = (raw) => {
  const s = String(raw).trim();
  const ntsc = { "23.976": 24000, "23.98": 24000, "29.97": 30000, "59.94": 60000, "47.952": 48000 };
  if (ntsc[s]) return { value: ntsc[s] / 1001, expr: `${ntsc[s]} / 1001`, label: (ntsc[s] / 1001).toFixed(3).replace(/0+$/, "") };
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const v = +frac[1] / +frac[2];
    return { value: v, expr: `${frac[1]} / ${frac[2]}`, label: Number.isInteger(v) ? `${v}` : v.toFixed(3).replace(/0+$/, "") };
  }
  if (/^\d+$/.test(s)) return { value: +s, expr: s, label: s };
  fail(`--fps "${s}": use the sequence's rate, e.g. 24000/1001 (23.976), 24, 25, 30, 30000/1001`);
};
const warnings = [];
let fpsRaw = flags.get("--fps");
if (!fpsRaw) {
  fpsRaw = style.fps ? String(style.fps) : "24000/1001";
  warnings.push(`--fps not given: using ${fpsRaw}. FPS must be the Premiere sequence's rate (CRAFT.md).`);
}
const fps = parseFps(fpsRaw);
if (!(fps.value > 1 && fps.value <= 120)) fail(`--fps ${fpsRaw} is out of range`);

// ---- name tag
let tag = null;
if (styleKey === "name-tag") {
  const t = flags.get("--tag");
  if (!t || !TAGS[t])
    fail(
      `name-tag needs --tag <${Object.keys(TAGS).join("|")}>. Dwarkesh, Sporttouchen and Lovable have no tag yet: ` +
        `build one on "A style without a tag" (styles/name-tags.md) after asking the director.`,
    );
  tag = { key: t, ...TAGS[t] };
} else if (flags.has("--tag")) fail("--tag is only for --style name-tag");

// ---- duration
const sec = flags.get("--seconds");
const frm = flags.get("--frames");
if (sec && frm) fail("give --seconds or --frames, not both");
let frames;
let durationNote;
const f = (n) => `${n} frames (f0..f${n - 1})`;
if (frm) {
  if (!/^\d+$/.test(frm) || +frm < 1) fail(`--frames ${frm} must be a positive whole number`);
  frames = +frm;
  durationNote = `the slot <in> -> <out> s = ${(frames / fps.value).toFixed(3)} s x ${fps.label} = ${f(frames)}.`;
} else if (sec) {
  const s = Number(sec);
  if (!(s > 0)) fail(`--seconds ${sec} must be a positive number`);
  frames = Math.round(s * fps.value);
  durationNote = `the slot <in> -> <out> s = ${s} s x ${fps.label} = ${f(frames)}.`;
} else {
  frames = tag?.frames ?? Math.round(5 * fps.value);
  durationNote = `PLACEHOLDER ${f(frames)}: set it from the slot, <in> -> <out> s x ${fps.label}.`;
  warnings.push(`no --seconds/--frames: DURATION is a placeholder ${frames} frames. Set it from the slot (in -> out x FPS).`);
}

// ---- frame size and overlay
const overlay = Boolean(style.overlay || flags.get("--overlay"));
if (overlay && style.noOverlay)
  fail(`${style.file} has no transparent overlay (its cutaway is opaque); a name tag is --style name-tag. Ask the director.`);
let [W, H] = [1080, 1920];
if (flags.get("--wide")) [W, H] = [2048, 1080];
if (flags.get("--size")) {
  const m = String(flags.get("--size")).match(/^(\d{3,4})x(\d{3,4})$/);
  if (!m) fail(`--size ${flags.get("--size")}: use WxH, e.g. 1080x1080`);
  [W, H] = [+m[1], +m[2]];
}
if ((W !== 1080 || H !== 1920) && !style.wide)
  fail(`${styleKey}'s kit stage is 1080x1920 only; a ${W}x${H} cut needs a kit addition (ask the director).`);
if (styleKey === "lovable" && !flags.get("--size"))
  warnings.push("Lovable builds at the sequence's own frame (styles/lovable.md): pass --size WxH (Full Stack Fika: 1080x1080).");
const format = `${overlay ? "Transparent overlay" : "Opaque"} ${W}x${H}, ${fps.label} fps, ${frames} frames`;

// ---- template: line conditions, then placeholders
const tplPath = join(TEMPLATES, `${styleKey}.tsx`);
if (!existsSync(tplPath)) fail(`no template at scripts/templates/${styleKey}.tsx`);
const conds = { overlay, wide: W > H };
const cond = /^\s*(?:\/\/|\{\/\*)\s*#(if|else|endif)\b\s*(!?)(\w*)\s*(?:\*\/\})?\s*$/;
const out = [];
const stack = [];
const tplLines = readFileSync(tplPath, "utf8").split("\n");
tplLines.forEach((line, i) => {
  const m = line.match(cond);
  if (!m) {
    if (stack.every(Boolean)) out.push(line);
    return;
  }
  const [, op, neg, key] = m;
  if (op === "if") {
    if (!(key in conds)) fail(`${tplPath}:${i + 1}: unknown condition "${key}"`);
    stack.push(neg ? !conds[key] : conds[key]);
  } else if (op === "else") stack.push(!stack.pop());
  else if (!stack.length) fail(`${tplPath}:${i + 1}: #endif without #if`);
  else stack.pop();
});
if (stack.length) fail(`${tplPath}: an #if is not closed`);
const values = {
  NAME: name,
  CLIP: clip,
  STYLE: style.label,
  FPS: fps.expr,
  FPS_LABEL: fps.label,
  DURATION: String(frames),
  DURATION_NOTE: durationNote,
  FORMAT: format,
  W: String(W),
  H: String(H),
  OVERLAY: String(overlay),
  TAG: tag?.file ?? "",
  TAG_EXTRA: tag?.extra ?? "",
  TAG_AT: tag?.at ?? "",
  TAG_AT_NOTE: tag?.atNote ?? "",
};
let code = out.join("\n").replace(/__([A-Z_]+)__/g, (whole, key) => {
  if (!(key in values)) fail(`${tplPath}: unknown placeholder ${whole}`);
  return values[key];
});
// the cut's name must not shadow anything the template imports
const imported = new Set();
for (const m of code.matchAll(/^import\s+([^;]+?)\s+from\s/gm)) for (const id of m[1].matchAll(/[A-Za-z_$][\w$]*/g)) imported.add(id[0]);
if (imported.has(name)) fail(`${name} clashes with a name the ${styleKey} template imports; pick another name`);

// (the paths are quoted through quote() so bun run check does not read them as this script's own imports)
const quote = (path) => `'${path}'`;
const root = `import {Composition} from 'remotion';
import ${name}, {DURATION, FPS, defaultProps, schema} from ${quote(`../generated/components/${clip}/${name}`)};

// Private render entry for ${name} (${clip}; ${style.label}): <one line on the picture>.
// ${format}.
export const RemotionRoot = () => (
  <Composition
    id="${name}"
    component={${name}}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={${W}}
    height={${H}}
  />
);
`;
const entry = `import {registerRoot} from 'remotion';
import {RemotionRoot} from ${quote(`./Root.${name}`)};

registerRoot(RemotionRoot);
`;

// ---- write (never overwrite: 'wx' fails if a file appeared meanwhile)
const clipDir = join(COMPONENTS, clip);
const newFolder = !existsSync(clipDir);
mkdirSync(clipDir, { recursive: true });
for (const [rel, text] of [
  [compRel, code],
  [rootRel, root],
  [entryRel, entry],
]) {
  try {
    writeFileSync(join(ROOT, rel), text, { flag: "wx" });
  } catch (e) {
    fail(`could not write ${rel}: ${e.code === "EEXIST" ? "it already exists" : e.message}`);
  }
}

// ---- report
const e = `src/entry.${name}.ts`;
const conc = "--concurrency=4";
const finalScale = W === 2048 ? " --scale=2" : "";
const todo = tag
  ? `Set the real name and job in defaultProps, then check a full-size still of the settled tag (${style.file}).`
  : `Fill the header (Check line, the line, word -> frame, motion, sources), delete the MARKER, then build to\n${style.file}.`;
console.log(`Created (${style.label}, ${format}):
  ${compRel}${newFolder ? "   (new clip folder)" : ""}
  ${rootRel}
  ${entryRel}

${todo} Next, with <scratch> = your session scratchpad:

  bunx remotion still ${e} ${name} <scratch>/${name}.png --frame=${tag ? Math.min(frames - 1, 40) : 0}${tag ? "" : " --scale=0.25"}
  bunx remotion render ${e} ${name} <scratch>/${name}.mp4 --config=scripts/preview.config.ts --scale=0.5 ${conc}
  bunx remotion render ${e} ${name} <scratch>/${name}.mov --muted${finalScale} ${conc}     # final, when the brief says so`);
if (styleKey === "sporttouchen")
  console.log(`  bunx remotion render ${e} ${name} <scratch>/${name}_alpha.mov --muted --props='{"transparent":true}' ${conc}   # the second render`);
if (overlay || styleKey === "sporttouchen") console.log(`  KISE_TRANSPARENT=1 bun run review <scratch>/${name}${styleKey === "sporttouchen" ? "_alpha" : ""}.mov     # confirm the alpha`);
console.log(`  bun run lint`);
for (const w of warnings) console.log(`\nNOTE  ${w}`);
