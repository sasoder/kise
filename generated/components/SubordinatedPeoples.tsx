import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  CREAM_BORDERS_D,
  DARK,
  DURATIONS,
  EMPIRE_REST_D,
  ENCLAVES,
  EmpireBorder,
  EmpireHatch,
  EmpireLayer,
  EnemyBorder,
  EnemyHatch,
  FPS as WORLD_FPS,
  G,
  INK,
  INK_CONTEXT,
  FRAME_H,
  FRAME_W,
  INK_FULL,
  fellSC,
  labelSlide,
  screenOf,
  MapStack,
  PaperTop,
  SEA,
  TlaxcalaClaims,
  WorldSvg,
  clamp01,
  hash,
  makeTrack,
  octaveDashes,
  smootherstep,
  swayCam,
  type Cam,
  type Bump,
  type P2,
} from "./tlaxShared";
import { ENCLAVE_ENTRIES, FLIP_ORDER, FRONTS, PROVINCES, PROVINCE_SEAMS, type ProvinceCell } from "./tlaxProvinces";
import { B_END, EMPIRE_MAIN_CENTROID } from "./SeemedImpressive";

// ---------------------------------------------------------------------------
// SubordinatedPeoples: cut C of Si Sheppard on Dwarkesh,
// "Sheppard_Tlaxcalans_thought_they_used_Cortes" (71.9 s edit; SP/clip.srt), on
// THE TLAXCALA WORLD (tlaxShared.tsx) + the 1519 tributary provinces
// (tlaxProvinces.ts, builder P). Clip clock G = 229 + f (CLIP_G0.C). f0 IS cut
// B's last frame (B_END imported and asserted below; the join is 0 px).
// "not just the remaining independent entities like the Tlaxcalans were hostile
//  to the Aztecs; so were so many of their subordinated peoples."
//
// TIMELINE. In-point 31.50 s = f0; f = round((t - 31.50) * 24) (SP/frames.txt):
//   not f0 · just f14 · the f23 · remaining f33 · independent f42 · entities f60 ·
//   like f80 · the f87 · Tlaxcalans f90 · were f103 · hostile f109 · to the f118 ·
//   Aztecs f126 · so f136 · were f143 · so f147 · many f152 · of f158 · their f161 ·
//   subordinated f167 · peoples f181.
// DURATION: the last word ends 39.579 s: round((39.579 - 31.500) * 24) =
//   round(193.9) = 194, + the 16-frame house tail = 210 frames (f0..f209).
//
// DWARKESH MAP STYLE; PALETTE RULE: orange = the Aztecs' enemies only (Tlaxcala,
// its claim, the independent enclaves, every people that turned on the Aztecs);
// the empire is cream. The one label: TLAXCALA.
//
// THE GESTURES, each with its word and frames:
//   1. "not just the" f0-33. The creep on the solid wide (B's revised solid
//      state: cream wash + hatch at the full rung, solid 3 px borders, drawn by
//      W's EmpireLayer), continuing B's creep (B_END.camVel through f0;
//      k 2.66 -> 2.72 by f33).
//   2. "remaining independent entities" f31-60. Metztitlan (f31-45) and
//      Teotitlan (f32-46), then Yopitzinco (f46-60) turn orange: each one's
//      hatch grows inward from its edge with the empire (a band, its own eased
//      14 f arc, started by distance from Tlaxcala) and its cream border turns
//      orange with it. Tlaxcala is orange already.
//   3. "like the Tlaxcalans" f60-90. The push (one raised cosine f60-90, 98.5 %
//      by f86): k 2.76 -> 4.36 (x 1.64; outside the 3.3-3.6 / 4.6-5.0 bands),
//      Tlaxcala's centroid onto (540, 835). TLAXCALA slides up from f82 (opaque
//      f91, settled f96) INSIDE Tlaxcala (the period-atlas convention): centred
//      on the blob's pole of inaccessibility (the chord's middle at its height),
//      IM Fell English SC 36 px, letter spacing 0.03 em so the word (215 px with
//      its halo) sits inside the 245-250 px chord with ~15-17 px each side; cream
//      at the full rung over a 4.5 px DARK engraved halo (paint-order stroke).
//   4. "were hostile to the Aztecs" f101-126. Every enclave's edge with the
//      empire becomes a front, a heavier orange line with teeth facing the
//      empire, drawn on from one point, each tooth growing out as the line
//      passes it: Tlaxcala's (the outline of Tlaxcala + cut A's claim, from its
//      west point clockwise) f101-126 landing on "Aztecs"; Teotitlan's f102-125,
//      Yopitzinco's f102-124, Metztitlan's f103-126 (at or past the frame's
//      edge). The creep: k 4.36 -> 4.47.
//   5. "so were so many" f131-163. The pull-back (one raised cosine f131-163,
//      97.6 % on "of" f158) to a tighter empire wide (k 3.18; the main body's
//      area centroid on (540, 835), side margins ~95 px; Soconusco off frame).
//      TLAXCALA leaves (f138-152, its entrance reversed). The province seams
//      draw in as fine dashed cream at the context rung (80 seams, each its own
//      eased 13 f stroke, starts hashed f137-146) while the empire's solidity
//      eases 1 -> 0 (f136-160), the wash fading out with it: the monolith turns
//      out to be a mosaic.
//   6. "so many of their subordinated peoples" f147-181. Orange crosses the
//      seams: the nine flipped provinces convert in order of distance from
//      Tlaxcala (start times proportional to it, f147 -> f165, hashed jitter
//      <= 1.5 f), each a 16 f band growing inward from its edge that touches
//      orange (Toluca, an island, from its side facing the nearest orange); the
//      last (Tollocan) lands on "peoples" f181. A converted cell is the same
//      full EnemyHatch as an enclave (the cream hatch + wash cut out under it),
//      and a thin solid orange line (1.8 px, no teeth) lands with its sweep
//      wherever its orange meets cream (and the empire's outer border); the
//      line and the dashed seam between two orange cells fade (the seam to
//      0.2) as the second lands. The Tenochca-Tepanec core, the north, the
//      south-west, Oaxaca, the Gulf coast and Soconusco stay cream.
//   7. f163-209. The creep on the mosaic (k 3.18 -> 3.24, still moving on the
//      last frame: D continues it). Nothing else.
//
// CAMERA (camScan over f0-209, the house sway included): probe grid max 23.5
// px/f (f75, the push), max |dv| 2.51 px/f^2 (f83) in smooth bells (the push
// and the pull are single raised cosines, the creeps cosine-tapered plateaus
// that overlap them: C1 end to end, no spikes); fixed world points <= 16 px/f.
// k crosses the 3.3-3.6 band only in motion (f74-76, f150-154); the map stays
// sharp (min 1.08 texels / px). Subject of every framing near y 835.
//
// SOURCES (and SP/FACTS.md, P; scripts/tlax-provinces.json). The provinces:
// "Provincias tributarias de la Triple Alianza (s. XVI).svg" (Wikimedia
// Commons, Yavidaxiu 2008, CC BY-SA 3.0; after Solanes Carraro & Vela Ramirez,
// Atlas del Mexico prehispanico, Arqueologia Mexicana 2000), georeferenced
// (affine to 33 towns + coastline ICP: rms 12.9 km, coast median 5 km). The
// flips (the people documented joining / submitting to Cortes before 13 Aug
// 1521): Tepeaca with Huaquechula and Izucar (Aug-Nov 1520; Cortes, Second
// Letter, MacNutt 1908 pp.305-17), Huaxtepec (Mar-Apr 1521; Third Letter
// pp.37-46), Chalco (Jan 1521; pp.22-24), the Acolhua of Texcoco (Jan-Jun 1521;
// pp.16-36, 77-78), the southern lake towns / Petlacalco (June 1521; pp.78-86;
// Codex Mendoza ff.20r-v), the Totonacs (Aug 1519; Second Letter p.187; drawn
// on the Tlatlauhquitepec cell as a proxy, Cempoala being no Codex province),
// Cuauhnahuac (Apr-Jul 1521; pp.48, 100-01), Malinalco and the Matlatzinca of
// Toluca (late July 1521; p.106; Ixtlilxochitl, Relacion XIII pp.370-71).
// Xilotepec dropped (late, contested sources). Spread order = great-circle km
// from Tlaxcala city to each cell's nearest edge.
// ---------------------------------------------------------------------------

export const DURATION = DURATIONS.C; // 210
export const FPS = WORLD_FPS;
export const LAST = DURATION - 1;

export const schema = z.object({
  vignette: z.number(),
  label: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, label: "TLAXCALA" });

// ---------------------------------------------------------------------------
// small maths
// ---------------------------------------------------------------------------
const ease = (f: number, a: number, b: number) => smootherstep((f - a) / (b - a));
/** the integral of a cosine-tapered velocity plateau (taper 0..1 of the span at each end), 0..1 */
const taperEase = (u0: number, taper = 0.6) => {
  const u = clamp01(u0);
  const t = Math.max(1e-6, taper / 2);
  const h = 1 / (1 - t); // plateau height: area 1
  // velocity: ramp up over [0, t], plateau, ramp down over [1 - t, 1] (raised cosine)
  const rampArea = (x: number) => h * (x / 2 - (t / (2 * Math.PI)) * Math.sin((Math.PI * x) / t));
  if (u <= t) return rampArea(u);
  if (u >= 1 - t) return 1 - rampArea(1 - u);
  return rampArea(t) + h * (u - t);
};
const dOf = (pts: P2[], close = false) =>
  pts.length ? `M${pts.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join("L")}${close ? "Z" : ""}` : "";
const parseD = (d: string): P2[][] =>
  d
    .split("M")
    .filter(Boolean)
    .map((sp) => sp.split("L").map((q) => q.split(",").map(Number) as P2));
const cumOf = (pts: P2[]) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
};
/** the polyline from arclength 0 to s */
const partial = (pts: P2[], cum: number[], s: number): P2[] => {
  if (s <= 0) return [];
  const L = cum[cum.length - 1];
  if (s >= L) return pts;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < s) i++;
  const u = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return [...pts.slice(0, i), [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]];
};
const boxOf = (mp: P2[][][], m = 4) => {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const poly of mp) for (const [x, y] of poly[0]) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  return { x: x0 - m, y: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m };
};

// ---------------------------------------------------------------------------
// WORDS (f = round((t - 31.50) * 24), SP/frames.txt)
// ---------------------------------------------------------------------------
export const W = {
  not: 0,
  just: 14,
  the: 23,
  remaining: 33,
  independent: 42,
  entities: 60,
  like: 80,
  the2: 87,
  tlaxcalans: 90,
  were: 103,
  hostile: 109,
  toThe: 118,
  aztecs: 126,
  so: 136,
  were2: 143,
  so2: 147,
  many: 152,
  of: 158,
  their: 161,
  subordinated: 167,
  peoples: 181,
};

// ---------------------------------------------------------------------------
// THE PLACES
// ---------------------------------------------------------------------------
/** Tlaxcala's area centroid (cut A's TLAX_C): the subject of the push-in and the label's anchor */
export const TLAX_C: P2 = [97.75, 868.5];
const FRONT_BY: Record<string, (typeof FRONTS)[number]> = Object.fromEntries(FRONTS.map((f) => [f.key, f]));
const TLAX_W: P2 = FRONT_BY.tlaxcala.pts[0] as P2; // Tlaxcala's westernmost point (facing Tenochtitlan)
const byId = new Map<number, ProvinceCell>(PROVINCES.map((c) => [c.id, c]));

// ---------------------------------------------------------------------------
// 2. "remaining independent entities": the other enclaves turn orange, nearest
//    to Tlaxcala first; each its own eased arc from its border with the empire
// ---------------------------------------------------------------------------
type EnclKey = "teotitlan" | "metztitlan" | "yopitzinco";
const ENCL_KEYS: EnclKey[] = ["teotitlan", "metztitlan", "yopitzinco"];
const ENCL_DUR = 14;
const enclDist = (key: EnclKey) => Math.min(...FRONT_BY[key].pts.map(([x, y]) => Math.hypot(x - TLAX_C[0], y - TLAX_C[1])));
const ENCL = (() => {
  const ds = ENCL_KEYS.map(enclDist);
  const d0 = Math.min(...ds);
  const d1 = Math.max(...ds);
  return ENCL_KEYS.map((key, i) => {
    const t0 = 31 + Math.round((15 * (ds[i] - d0)) / (d1 - d0 || 1));
    const en = ENCLAVE_ENTRIES.find((q) => q.key === key)!;
    return { key, t0, t1: t0 + ENCL_DUR, entryD: en.d, reach: en.reach, box: boxOf(ENCLAVES[key].polys as P2[][][]) };
  });
})();
export const enclaveAt = (f: number, key: EnclKey) => {
  const e = ENCL.find((q) => q.key === key)!;
  return ease(f, e.t0, e.t1);
};

// ---------------------------------------------------------------------------
// 4. "were hostile to the Aztecs": every enclave's edge with the empire becomes a
//    front, an orange line with short teeth facing the empire, drawn on from one
//    point (Tlaxcala's from its west point, facing Tenochtitlan; Teotitlan's from
//    its point nearest Tlaxcala; the notches from one end)
// ---------------------------------------------------------------------------
const TOOTH_SP = 5.6; // world px between teeth (~23 px at the push-in, ~13 px at the wide)
const FRONT_T: Record<string, [number, number]> = {
  tlaxcala: [101, 126],
  teotitlan: [102, 125],
  metztitlan: [103, 126],
  yopitzinco: [102, 124],
};
const FRONT_GEOM = FRONTS.map((fr) => {
  let pts = fr.pts as P2[];
  if (fr.key === "teotitlan") {
    // start at its point nearest Tlaxcala (a closed ring: rotate it)
    let j = 0;
    pts.forEach((p, i) => {
      if (Math.hypot(p[0] - TLAX_C[0], p[1] - TLAX_C[1]) < Math.hypot(pts[j][0] - TLAX_C[0], pts[j][1] - TLAX_C[1])) j = i;
    });
    pts = [...pts.slice(j, -1), ...pts.slice(0, j + 1)];
  }
  const cum = cumOf(pts);
  const L = cum[cum.length - 1];
  const teeth: { s: number; p: P2; t: P2; n: P2 }[] = [];
  for (let s = TOOTH_SP / 2; s < L - TOOTH_SP / 4; s += TOOTH_SP) {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const u = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    const p: P2 = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
    const a = pts[Math.max(0, i - 3)];
    const b = pts[Math.min(pts.length - 1, i + 2)];
    const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const t: P2 = [(b[0] - a[0]) / tl, (b[1] - a[1]) / tl];
    const n: P2 = fr.out === 1 ? [t[1], -t[0]] : [-t[1], t[0]];
    teeth.push({ s, p, t, n });
  }
  return { key: fr.key, pts, cum, L, teeth };
});
export const frontAt = (f: number, key: string) => {
  const [a, b] = FRONT_T[key];
  return taperEase((f - a) / (b - a), 0.6);
};

// ---------------------------------------------------------------------------
// 5. "so were so many": the province seams draw in (fine dashed cream, the
//    context rung) while the empire's solidity eases back to the context hatch
// ---------------------------------------------------------------------------
const SOLID_T: [number, number] = [136, 160];
export const solidityAt = (f: number) => 1 - ease(f, SOLID_T[0], SOLID_T[1]);
const SEAM_DUR = 13;
const SEAMS = PROVINCE_SEAMS.map((sm, i) => {
  const pts = parseD(sm.d).flat();
  const cum = cumOf(pts);
  return { i, d: sm.d, len: cum[cum.length - 1], t0: 137 + Math.round(9 * hash(i, 31)) };
});
export const seamAt = (f: number, i: number) => taperEase((f - SEAMS[i].t0) / SEAM_DUR, 0.7);

// ---------------------------------------------------------------------------
// 6. "so many of their subordinated peoples": the flipped cells, one after another
//    by distance from Tlaxcala, each sweeping in from the edge that touches orange
// ---------------------------------------------------------------------------
const CELL_DUR = 16;
const CELL_SPREAD: [number, number] = [147, W.peoples - CELL_DUR]; // first start, last start (lands on "peoples")
const CELLS = (() => {
  const cs = FLIP_ORDER.map((id) => byId.get(id)!);
  const d0 = cs[0].distKm;
  const d1 = cs[cs.length - 1].distKm;
  return cs.map((c, r) => {
    const last = r === cs.length - 1;
    const jitter = last || r === 0 ? 0 : (hash(c.id, 7) - 0.5) * 3; // < one cell's duration: the order still reads
    const t0 = CELL_SPREAD[0] + ((CELL_SPREAD[1] - CELL_SPREAD[0]) * (c.distKm - d0)) / (d1 - d0) + jitter;
    return { c, t0, t1: t0 + CELL_DUR };
  });
})();
export const cellAt = (f: number, id: number) => {
  const q = CELLS.find((x) => x.c.id === id)!;
  return ease(f, q.t0, q.t1);
};

// ---------------------------------------------------------------------------
// THE STATE of the world layer at a frame (C_END = its value at LAST)
// ---------------------------------------------------------------------------
export type MosaicState = {
  solidity: number;
  enclaves: Record<EnclKey, number>;
  fronts: Record<string, number>;
  seams: number[];
  cells: Record<number, number>;
};
export const stateAt = (f: number): MosaicState => ({
  solidity: solidityAt(f),
  enclaves: Object.fromEntries(ENCL_KEYS.map((k) => [k, enclaveAt(f, k)])) as Record<EnclKey, number>,
  fronts: Object.fromEntries(FRONT_GEOM.map((g) => [g.key, frontAt(f, g.key)])),
  seams: SEAMS.map((s) => seamAt(f, s.i)),
  cells: Object.fromEntries(CELLS.map((q) => [q.c.id, cellAt(f, q.c.id)])),
});

// ---------------------------------------------------------------------------
// THE CONVERSION MASK: a band growing inward from the entry edge (the edge that
// touches orange / the enclave's edge with the empire): the edge polylines stroked
// 2w wide, softened by a FEATHER world px blur; w runs from 0 to reach + 2 FEATHER
// ---------------------------------------------------------------------------
const FEATHER = 2.2; // world px
type Box = { x: number; y: number; w: number; h: number };
const BandMask: React.FC<{ id: string; d: string; reach: number; p: number; box: Box }> = ({ id, d, reach, p, box }) => {
  const w = Math.max(0, (reach + 2 * FEATHER) * p);
  return (
    <>
      <filter id={`${id}-f`} filterUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
        <feGaussianBlur stdDeviation={FEATHER / 2} />
      </filter>
      <mask id={id} maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
        <path d={d} fill="none" stroke="#fff" strokeWidth={2 * w} strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}-f)`} />
      </mask>
    </>
  );
};
const CELL_BOX = new Map<number, Box>(PROVINCES.filter((c) => c.flip).map((c) => [c.id, boxOf(c.polys as P2[][][])]));

// ---------------------------------------------------------------------------
// THE FRONT: the orange line drawn on to s, its teeth as the line passes them
// ---------------------------------------------------------------------------
const FRONT_W = 2.9; // screen px (EnemyBorder's 2.3, a hair heavier: a front)
const FrontLine: React.FC<{ g: (typeof FRONT_GEOM)[number]; p: number; cam: Cam }> = ({ g, p, cam }) => {
  if (p <= 0.0005) return null;
  const s = g.L * Math.min(1, p);
  const k = cam.k;
  const px = (v: number) => v / k;
  const sz = Math.min(1.2, Math.max(0.7, Math.pow(k / 4.1, 0.5)));
  const base = px(11 * sz);
  const hgt = px(8.5 * sz);
  const line = p >= 1 ? g.pts : partial(g.pts, g.cum, s);
  let teeth = "";
  for (const t of g.teeth) {
    // a tooth grows out of the line as the pen passes it (over ~1.5 teeth of travel)
    const q = clamp01((s - (t.s - TOOTH_SP * 0.25)) / (TOOTH_SP * 1.5));
    if (q <= 0.001) continue;
    const h = hgt * q;
    const b = (base / 2) * (0.6 + 0.4 * q);
    const [x, y] = t.p;
    const a: P2 = [x - t.t[0] * b, y - t.t[1] * b];
    const c: P2 = [x + t.t[0] * b, y + t.t[1] * b];
    const tip: P2 = [x + t.n[0] * h, y + t.n[1] * h];
    teeth += `M${a[0].toFixed(3)},${a[1].toFixed(3)}L${tip[0].toFixed(3)},${tip[1].toFixed(3)}L${c[0].toFixed(3)},${c[1].toFixed(3)}Z`;
  }
  const d = dOf(line, false);
  return (
    <g>
      {teeth ? <path d={teeth} fill={ACCENT} stroke={DARK} strokeOpacity={0.55} strokeWidth={px(1.5)} strokeLinejoin="round" paintOrder="stroke" /> : null}
      <path d={d} fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={px(FRONT_W + 2.8)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={ACCENT} strokeWidth={px(FRONT_W)} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SEAMS: fine dashed cream at the context rung (EmpireBorder's solidity-0 look),
// each drawn on along its length (world-anchored octave dashes, truncated at the pen)
// ---------------------------------------------------------------------------
const SEAM_W = 1.7; // screen px (EmpireBorder at solidity 0)
const truncDash = (period: number, s: number, len: number) => {
  const on = period * 0.58;
  const off = period * 0.42;
  const out: number[] = [];
  let x = 0;
  while (x < s) {
    const a = Math.min(on, s - x);
    out.push(a);
    x += a;
    if (x >= s) break;
    out.push(off);
    x += off;
  }
  if (out.length % 2 === 0) out.push(0); // end on a dash entry: then the closing gap
  out.push(len + period);
  return out.map((v) => v.toFixed(4)).join(" ");
};
const SEAM_FLIP = PROVINCE_SEAMS.map((sm) => ({ a: sm.a, b: sm.b, both: FLIP_ORDER.includes(sm.a) && FLIP_ORDER.includes(sm.b) }));
const SEAM_FAINT = 0.2; // a seam between two orange cells: very faint once the second lands
const Seams: React.FC<{ cam: Cam; seams: number[]; cells: Record<number, number> }> = ({ cam, seams, cells }) => {
  const dashes = octaveDashes(cam.k);
  const w = SEAM_W / cam.k;
  return (
    <g fill="none" strokeLinecap="butt" strokeLinejoin="round">
      {SEAMS.map((sm) => {
        const p = seams[sm.i];
        if (p <= 0.0005) return null;
        const f = SEAM_FLIP[sm.i];
        const fade = f.both ? 1 - (1 - SEAM_FAINT) * Math.min(cells[f.a] ?? 0, cells[f.b] ?? 0) : 1;
        return dashes.map((q) => (
          <path
            key={`s${sm.i}-${q.p}`}
            d={sm.d}
            stroke={INK}
            strokeOpacity={INK_CONTEXT * q.op * fade}
            strokeWidth={w}
            strokeDasharray={p >= 1 ? `${(q.p * 0.58).toFixed(5)} ${(q.p * 0.42).toFixed(5)}` : truncDash(q.p, sm.len * p, sm.len)}
          />
        ));
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE WORLD LAYER (children of one WorldSvg): B's end state + this cut's state
// ---------------------------------------------------------------------------
const FLIPPED = CELLS.map((q) => q.c);
const RANK = new Map<number, number>(CELLS.map((q, r) => [q.c.id, r]));
const EDGE_W = 1.8; // screen px: the edge of the orange (thinner than an enclave's 2.3 border, no teeth)
/** the cream empire: W's EmpireLayer, with the converted cells cut out of its hatch + wash
 *  (so a flipped cell is the same full orange as an enclave, with nothing cream under it).
 *  Before the first cell starts it IS EmpireLayer (C f0 = B f98). */
const CreamEmpire: React.FC<{ cam: Cam; st: MosaicState }> = ({ cam, st }) => {
  const started = FLIPPED.filter((c) => st.cells[c.id] > 0.0005);
  if (!started.length) return <EmpireLayer cam={cam} solidity={st.solidity} />;
  const done = started.filter((c) => st.cells[c.id] >= 1);
  const live = started.filter((c) => st.cells[c.id] < 1);
  return (
    <>
      <defs>
        <mask id="spCream" maskUnits="userSpaceOnUse" x={-400} y={500} width={1200} height={800}>
          <rect x={-400} y={500} width={1200} height={800} fill="#fff" />
          {done.length ? <path d={done.map((c) => c.d).join("")} fillRule="evenodd" fill="#000" /> : null}
          {live.map((c) => (
            <path key={`cm-${c.id}`} d={c.d} fillRule="evenodd" fill="#000" mask={`url(#spCm-${c.id})`} />
          ))}
        </mask>
      </defs>
      <g mask="url(#spCream)">
        <EmpireHatch d={EMPIRE_REST_D} cam={cam} solidity={st.solidity} />
      </g>
      <EnemyHatch d={ENCLAVES.tlaxcala.d} cam={cam} />
      <EmpireBorder d={CREAM_BORDERS_D} cam={cam} solidity={st.solidity} />
      <EnemyBorder d={ENCLAVES.tlaxcala.border} cam={cam} />
    </>
  );
};
/** a flipped cell's edges where its orange meets cream (and the empire's outer border):
 *  the runs facing a cell that flips later fade out as that cell lands; the runs facing
 *  one that flipped earlier are that cell's to draw */
const cellEdgesD = (c: ProvinceCell, st: MosaicState) => {
  const r = RANK.get(c.id)!;
  const parts: { d: string; op: number }[] = [];
  for (const e of c.edges) {
    const nr = RANK.get(e.nb);
    if (nr === undefined) parts.push({ d: e.d, op: 1 }); // cream cell or the outer border
    else if (nr > r) parts.push({ d: e.d, op: 1 - (st.cells[e.nb] ?? 0) });
  }
  return parts;
};
const CellEdges: React.FC<{ c: ProvinceCell; st: MosaicState; cam: Cam }> = ({ c, st, cam }) => (
  <>
    {cellEdgesD(c, st).map((q, i) => (q.op > 0.002 ? <EnemyBorder key={`ce-${c.id}-${i}`} d={q.d} cam={cam} width={EDGE_W} opacity={q.op} /> : null))}
  </>
);
export const MosaicLayer: React.FC<{ cam: Cam; st: MosaicState }> = ({ cam, st }) => {
  const doneCells = FLIPPED.filter((c) => st.cells[c.id] >= 1);
  const liveCells = FLIPPED.filter((c) => st.cells[c.id] > 0.0005 && st.cells[c.id] < 1);
  const doneEncl = ENCL.filter((e) => st.enclaves[e.key] >= 1);
  const liveEncl = ENCL.filter((e) => st.enclaves[e.key] > 0.0005 && st.enclaves[e.key] < 1);
  return (
    <>
      {/* the conversion masks of the live cells (used by the cream cut-out and the cells) */}
      <defs>
        {liveCells.map((c) => (
          <BandMask key={`bm-${c.id}`} id={`spCm-${c.id}`} d={c.entryD} reach={c.reach} p={st.cells[c.id]} box={CELL_BOX.get(c.id)!} />
        ))}
      </defs>
      <CreamEmpire cam={cam} st={st} />
      {/* the other enclaves turn orange */}
      {doneEncl.length ? <EnemyHatch d={doneEncl.map((e) => ENCLAVES[e.key].d).join("")} cam={cam} /> : null}
      {liveEncl.map((e) => (
        <g key={`le-${e.key}`}>
          <defs>
            <BandMask id={`spEm-${e.key}`} d={e.entryD} reach={e.reach} p={st.enclaves[e.key]} box={e.box} />
          </defs>
          <g mask={`url(#spEm-${e.key})`}>
            <EnemyHatch d={ENCLAVES[e.key].d} cam={cam} />
          </g>
        </g>
      ))}
      {/* the flipped provinces: the same full EnemyHatch as the enclaves */}
      {doneCells.length ? <EnemyHatch d={doneCells.map((c) => c.d).join("")} cam={cam} /> : null}
      {liveCells.map((c) => (
        <g key={`lc-${c.id}`} mask={`url(#spCm-${c.id})`}>
          <EnemyHatch d={c.d} cam={cam} />
        </g>
      ))}
      {/* the seams of the construct (fading between two orange cells) */}
      <Seams cam={cam} seams={st.seams} cells={st.cells} />
      {/* the edge of the orange: lands with each cell's own sweep */}
      {doneCells.map((c) => (
        <CellEdges key={`de-${c.id}`} c={c} st={st} cam={cam} />
      ))}
      {liveCells.map((c) => (
        <g key={`le-${c.id}`} mask={`url(#spCm-${c.id})`}>
          <CellEdges c={c} st={st} cam={cam} />
        </g>
      ))}
      {/* cut A's claim, tie and fortress (over everything below) */}
      <TlaxcalaClaims cam={cam} />
      {/* the converted enclaves' borders: cream -> orange with their hatch */}
      {ENCL.map((e) => (
        <EnemyBorder key={`eb-${e.key}`} d={ENCLAVES[e.key].border} cam={cam} opacity={st.enclaves[e.key]} />
      ))}
      {/* the fronts */}
      {FRONT_GEOM.map((g) => (
        <FrontLine key={`fr-${g.key}`} g={g} p={st.fronts[g.key]} cam={cam} />
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
// THE CAMERA: its own track. ln k, cx, cy are each the integral of cosine-tapered
// velocity bumps (tlaxShared makeTrack: C1 end to end): two long creeps, the push,
// a creep on the fronts, the pull-back, the creep on the mosaic. The push and the
// pull are raised cosines whose areas are solved so the camera stands exactly on its
// target framing at the bump's end (the creeps running through them).
// ---------------------------------------------------------------------------
const K_B = B_END.cam.k;
export const K_PUSH = 1.64; // the push-in's ratio in k (k 4.36: outside the 3.3-3.6 and 4.6-5.0 bands through the creep)
// the mosaic's wide (Fable's review: tighter than B's): the main body's area centroid (B's
// EMPIRE_MAIN_CENTROID) on (540, 835) at k 3.18 = side margins ~105 / 110 px (the main body
// box x -50 .. 228), the creep carrying it to k 3.24 by f209 (under the 3.3-3.6 band)
const K_WIDE = 3.18;
const PUSH: [number, number] = [60, 90]; // lands on Tlaxcala 4 f before "Tlaxcalans" (98.5 % by f86)
const PULL: [number, number] = [131, 163]; // the empire wide by "of" f158 (97.6 %)
type Chan = "lnk" | "cx" | "cy";
const camOf = (k: number, p: P2, sx: number, sy: number) => ({ lnk: Math.log(k), cx: p[0] - (sx - 540) / k, cy: p[1] - (sy - 960) / k });
const T_PUSH = camOf(K_B * K_PUSH, TLAX_C, 540, 835);
const T_WIDE = camOf(K_WIDE, EMPIRE_MAIN_CENTROID, 540, 835);
const C0 = { lnk: Math.log(K_B), cx: B_END.cam.cx, cy: B_END.cam.cy };
/** the creeps (per channel: [from, to, area]; taper 1); they start before f0 and run past the end */
// creep A continues B's creep: its plateau velocity is B_END.camVel (per frame) through f0
// (a bump [-40, 70] with taper 0.5: plateau -12.5 .. 42.5, area = v x 82.5)
const CREEP_A = (v: number): Bump => [-40, 70, v * 82.5, 0.5];
const CREEPS: Record<Chan, Bump[]> = {
  lnk: [CREEP_A(B_END.camVel.lnk), [72, 150, 0.035, 0.5], [146, 330, 0.064, 0.5]],
  cx: [CREEP_A(B_END.camVel.cx), [72, 150, -0.6, 0.5], [146, 330, -1.2, 0.5]],
  cy: [CREEP_A(B_END.camVel.cy), [72, 150, -0.9, 0.5], [146, 330, -2.6, 0.5]],
};
const chanTrack = (ch: Chan) => {
  const unit = (b: [number, number]) => makeTrack([[b[0], b[1], 1, 1]], 0, -90, 340);
  const base = makeTrack(CREEPS[ch], C0[ch], -90, 340);
  const uPush = unit(PUSH);
  const uPull = unit(PULL);
  // solve: base(PUSH end) + aPush = T_PUSH; base(PULL end) + aPush + aPull = T_WIDE
  const aPush = T_PUSH[ch] - base(PUSH[1]);
  const aPull = T_WIDE[ch] - base(PULL[1]) - aPush;
  return (f: number) => base(f) + aPush * uPush(f) + aPull * uPull(f);
};
const TR = { lnk: chanTrack("lnk"), cx: chanTrack("cx"), cy: chanTrack("cy") };
/** the authored camera at frame f (no sway); f0 = B_END.cam exactly */
export const camAt = (f: number): Cam => (f === 0 ? { ...B_END.cam } : { k: Math.exp(TR.lnk(f)), cx: TR.cx(f), cy: TR.cy(f) });
/** the camera as rendered: the house sway on the clip clock */
export const camShown = (f: number): Cam => swayCam(camAt(f), G("C", f));

// the label (Fable's override: the period-atlas convention, the name INSIDE its territory):
// TLAXCALA centred on Tlaxcala's blob - vertically on its pole of inaccessibility (96.75, 868.88;
// inscribed radius 21.9 world px), horizontally on the middle of the blob's chord at that height
// (x 70.0 .. 126.2 -> 98.1), so the margins left and right are equal - in cream at the full rung
// over a dark engraved halo, letter spacing tightened so the word sits inside with margin
const LABEL_SIZE = 36;
const LABEL_SPACING = 0.03; // em: the house 0.32 overruns the blob (239 px at 0.12 in a 250 px chord); 0.03 leaves ~15-17 px each side
const LABEL_AT: P2 = [98.1, 868.88];
const LABEL_CAP_MID = 0.33; // em: the caps' middle above the baseline
const LABEL_HALO = 4.5; // screen px: the DARK casing stroke, painted under the fill
/** a territory name: IM Fell English SC spaced caps centred on a world point, cream over a dark
 *  engraved halo; the house slide-up / fade from f0 (labelSlide), plus an exit offset and fade */
const TerritoryLabel: React.FC<{ text: string; at: P2; cam: Cam; frame: number; f0: number; dyExit: number; opacity: number }> = ({
  text,
  at,
  cam,
  frame,
  f0,
  dyExit,
  opacity,
}) => {
  const sl = labelSlide(frame, f0);
  const op = sl.op * opacity;
  if (op <= 0.002) return null;
  const [sx, sy] = screenOf(at, cam);
  const trail = LABEL_SIZE * LABEL_SPACING; // letter-spacing trails the last glyph: shift so the ink is centred
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <text
        x={sx + trail / 2}
        y={sy + LABEL_SIZE * LABEL_CAP_MID + sl.dy + dyExit}
        textAnchor="middle"
        opacity={op}
        fill={INK}
        fillOpacity={INK_FULL}
        stroke={DARK}
        strokeOpacity={0.85}
        strokeWidth={LABEL_HALO}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: fellSC, fontSize: LABEL_SIZE, letterSpacing: LABEL_SIZE * LABEL_SPACING }}
      >
        {text}
      </text>
    </svg>
  );
};
const LABEL_IN = 82;
const LABEL_OUT: [number, number] = [138, 152];

// ---------------------------------------------------------------------------
// C_END: the state D opens on (camera at f209 without sway, its velocity, the world state)
// ---------------------------------------------------------------------------
export const C_END = {
  f: LAST,
  g: G("C", LAST),
  cam: camAt(LAST),
  camVel: (() => {
    const a = camAt(LAST - 0.5);
    const b = camAt(LAST + 0.5);
    return { lnk: Math.log(b.k) - Math.log(a.k), cx: b.cx - a.cx, cy: b.cy - a.cy };
  })(),
  state: stateAt(LAST),
  orangeCells: FLIP_ORDER.slice(),
  orangeEnclaves: ["tlaxcala", ...ENCL_KEYS],
};
{
  const s = C_END.state;
  const all = (r: Record<string | number, number>) => Object.values(r).every((v) => v === 1);
  if (s.solidity !== 0 || !all(s.enclaves) || !all(s.fronts) || !all(s.cells) || !s.seams.every((v) => v === 1))
    throw new Error("cut C must end with every gesture complete (solidity 0)");
  // the join: C f0 = B's last frame (camera and world state)
  const c0 = camAt(0);
  if (Math.abs(c0.k - B_END.cam.k) > 1e-9 || Math.abs(c0.cx - B_END.cam.cx) > 1e-9 || Math.abs(c0.cy - B_END.cam.cy) > 1e-9) throw new Error("C f0 camera != B_END.cam");
  if (B_END.solidity !== 1 || solidityAt(0) !== 1) throw new Error("C f0 must open at B's solidity 1");
  if (G("C", 0) !== B_END.g) throw new Error("C f0's clip clock != B_END.g");
}
/** the END state of cut C in one line, for D and E: its own full-frame svg over <MapStack /> */
export const ProvinceMosaic: React.FC<{ cam: Cam }> = ({ cam }) => (
  <WorldSvg cam={cam}>
    <MosaicLayer cam={cam} st={C_END.state} />
  </WorldSvg>
);

// ---------------------------------------------------------------------------
const SubordinatedPeoples: React.FC<Props> = ({ vignette, label }) => {
  const frame = useCurrentFrame();
  const cam = camShown(frame);
  const st = stateAt(frame);
  // TLAXCALA: in (the house slide-up) from LABEL_IN; out as the reverse (fade, slide down 24 px)
  const out = ease(frame, LABEL_OUT[0], LABEL_OUT[1]);
  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <WorldSvg cam={cam}>
        <MosaicLayer cam={cam} st={st} />
      </WorldSvg>
      {frame >= LABEL_IN && out < 1 ? (
        <TerritoryLabel text={label} at={LABEL_AT} cam={cam} frame={frame} f0={LABEL_IN} dyExit={24 * out} opacity={1 - clamp01((frame - LABEL_OUT[0]) / 9)} />
      ) : null}
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

export default SubordinatedPeoples;
export { TLAX_W };
