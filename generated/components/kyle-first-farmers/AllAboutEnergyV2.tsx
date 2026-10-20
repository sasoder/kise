// ---------------------------------------------------------------------------
// AllAboutEnergyV2 (kyle-first-farmers, 34_AllAboutEnergy, cold-review V2). A copy of AllAboutEnergy.tsx (the
// delivered cut, untouched) on allAboutEnergyStateV2.ts. Same 241 frames, fps and word timing; its LAST frame is
// the delivered f240 pixel for pixel (cut E opens on the delivered EnergyWorld at f240).
// What V2 changes, all before the join (see allAboutEnergyStateV2.ts):
// - the heap starts at zero: grain visibly makes it (first contact f126, thrown by carrier 0);
// - the throws are handfuls: kernels leave the shaken ears scattered, on varied high ballistic arcs (gravity), 14 f;
// - a second carrier (1) arrives and takes over: two throwing together f140-150, the heap speeding up into
//   "efficiently" (f153); the close-up widens to hold both;
// - "It's all about energy": carrier 1's last kernels land on "energy" (f225) and the heap tops out, the next
//   carrier's sheaf already rising (delivered schedule); from f238 everything is the delivered schedule;
// - the field's rows keep their orange through the pull-back (the ear line comes in from k 1.0, full by k 0.6).
// The delivered header (check line, word table, sources) applies; see AllAboutEnergy.tsx.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { add, mix, mix2, mul, rot } from "../kits/maps/stringsMotion";
import { figureRig } from "../kits/maps/texcocoFigures";
import { hash } from "../kits/maps/incaShared";
import { ACCENT, DARK, INK, LAND, LAND_RIM, Page, SEA, WorldSvg, inkPath, mixColor, roughen, type Cam, type P2 } from "./firstFarmersShared";
import { Cow, Farmer, Goat, Longhouse, ORANGE, POSES, Sheaf, TurnFarmer, WheatField, aimTool, aimToolWorld, turnPose, idle, lerpFig, mirrorPose, mixInk, specOf, walkPose, type FigPose, type Ink } from "./farmersFigures";
import {
  ANIMALS,
  CARRY_STRIDE,
  DROP_AT,
  DURATION as D_DURATION,
  FIELD,
  FPS as D_FPS,
  HEAP,
  HOUSE,
  LANE_BULGE,
  LOWER,
  N_CARRIERS,
  PEOPLE,
  PICK,
  PICK_GRAB,
  RAISE,
  REAPERS,
  STOOKS,
  STOOK_GRABS,
  STROKE,
  STUMPS,
  TURN,
  clearingOutline,
  cutFront,
  reaperFeetX,
  riverW,
  riverY,
  rowSeed,
  rowY,
  scrubIn,
  swathEnd,
  treesIn,
  type Leg,
  type Tree,
} from "./allAboutEnergyStateV2";
import { LEGS_V2, V2_FLIGHT, V2_JOIN, camAtV2, outOfV2, heapAmountV2, shakeV2, throwingAt } from "./allAboutEnergyStateV2";

export const FPS = D_FPS;
export const DURATION = D_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
/** pale threshed straw */
const STRAW: Ink = { main: "#CBBD95", deep: "#AE9F78", hair: "#857858" };
const PLANE = "#2B2219";
/** a tree's canopy plane: a shade under the page, so the forest stays a drawing and the page shows between */
const CANOPY = mixColor(LAND, DARK, 0.34);
const CTX = mixColor(LAND, INK, 0.56); // cream as context (the wild)

// ---------------------------------------------------------------------------
// THE WHEAT: replicate WheatField's own stalk layout (rows = 1, r = 0) so a stalk
// that falls is exactly the one the field turns to stubble on that frame
// ---------------------------------------------------------------------------
type Stalk = { x: number; h: number; lean0: number; i: number };
const stalkCache = new Map<number, Stalk[]>();
const rowStalks = (j: number): Stalk[] => {
  const hit = stalkCache.get(j);
  if (hit) return hit;
  const seed = rowSeed(j);
  const sc = FIELD.scale;
  const sp = FIELD.spacing * sc;
  const out: Stalk[] = [];
  let i = 0;
  for (let x = FIELD.x0 + sp * hash(0, 841 + seed); x < FIELD.x1; x += sp * (0.75 + 0.5 * hash(i, 842 + seed)), i++) {
    out.push({ x, h: (140 + 26 * hash(i, 843 + seed)) * sc, lean0: (hash(i, 844 + seed) - 0.5) * 10 * sc, i });
  }
  stalkCache.set(j, out);
  return out;
};
/** the stalk's lean in the wind at frame g (WheatField's formula) */
const leanAt = (s: Stalk, g: number) => s.lean0 + (8 + 14 * Math.max(0, Math.sin(s.x * 0.006 - g * 0.07))) * FIELD.scale + 3 * FIELD.scale * Math.sin(g * 0.05 + s.x * 0.02);
/** the frame the cut front of reaper i passes x (the front only moves left) */
const cutFrameOf = (i: number, x: number) => {
  let lo = -2000;
  let hi = 2000;
  if (cutFront(i, hi) > x) return Infinity;
  for (let it = 0; it < 30; it++) {
    const m = (lo + hi) / 2;
    if (cutFront(i, m) > x) lo = m;
    else hi = m;
  }
  return hi;
};
const FALL_F = 9;
/** one cut stalk: falling (t 0..1) toward the viewer and behind the reaper, then lying in the swath */
const stalkD = (s: Stalk, y: number, t: number, lean: number) => {
  const sc = FIELD.scale;
  const a0 = Math.atan2(-s.h, lean); // standing
  const a1 = Math.atan2(0.3 * s.h, 0.58 * s.h + 10 * (hash(s.i, 3) - 0.5)); // lying, foreshortened
  const e = t * t;
  const a = a0 + (a1 - a0) * e;
  const len = s.h * (1 - 0.36 * e);
  const base: P2 = [s.x, y];
  const top: P2 = [s.x + Math.cos(a) * len, y + Math.sin(a) * len];
  const mid: P2 = mix2(base, top, 0.55);
  const d: P2 = [Math.cos(a), Math.sin(a)];
  const nn: P2 = [-d[1], d[0]];
  const el = 30 * sc;
  const ew = 5.2 * sc;
  const e1: P2 = add(top, mul(d, el));
  const m1 = mix2(top, e1, 0.45);
  return {
    stem: `M${P(base)}Q${P(add(mid, mul(nn, 2)))} ${P(top)}`,
    ear: `M${P(top)}Q${P(add(m1, mul(nn, ew)))} ${P(e1)}Q${P(add(m1, mul(nn, -ew)))} ${P(top)}Z`,
    awn: `M${P(mix2(top, e1, 0.7))}l${P(add(mul(d, 14 * sc), mul(nn, 5 * sc)))}M${P(mix2(top, e1, 0.85))}l${P(add(mul(d, 15 * sc), mul(nn, -4 * sc)))}`,
  };
};
const CutStalks: React.FC<{ ri: number; f: number }> = ({ ri, f }) => {
  const R = REAPERS[ri];
  const y = rowY(R.row);
  const end = swathEnd(ri);
  const front = cutFront(ri, f);
  let stem = "";
  let ear = "";
  let awn = "";
  for (const s of rowStalks(R.row)) {
    if (s.x <= front || s.x > end) continue;
    const fc = cutFrameOf(ri, s.x);
    const t = c01((f - fc) / FALL_F);
    const d = stalkD(s, y, t, leanAt(s, fc));
    stem += d.stem;
    ear += d.ear;
    awn += d.awn;
  }
  const w = (v: number) => Math.max(0.6, v * FIELD.scale);
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d={stem} fill="none" stroke={DARK} strokeWidth={w(4.2)} strokeOpacity={0.9} />
      <path d={stem} fill="none" stroke={ORANGE.deep} strokeWidth={w(1.8)} />
      <path d={awn} fill="none" stroke={DARK} strokeWidth={w(1.2)} strokeOpacity={0.6} />
      <path d={ear} fill={ORANGE.main} stroke={DARK} strokeWidth={w(1.7)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FOREST: engraved trees in elevation, dark umber canopy planes in cream
// context line, hatched on the shaded (lower right) side; scrub; stumps
// ---------------------------------------------------------------------------
type Glyph = { outline: string; hatch: string; trunk: string; trunkLine: string; lit: string };
const glyphCache = new Map<string, Glyph>();
const treeGlyph = (kind: 0 | 1 | 2, v: number): Glyph => {
  const key = `${kind}-${v}`;
  const hit = glyphCache.get(key);
  if (hit) return hit;
  const spec = kind === 0 ? { cy: -360, rx: 172, ry: 172, lobes: 11, tr: 205 } : kind === 1 ? { cy: -440, rx: 118, ry: 236, lobes: 13, tr: 230 } : { cy: -175, rx: 158, ry: 150, lobes: 9, tr: 0 };
  const pts: P2[] = [];
  const N = 72;
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    const lobe = Math.abs(Math.sin((spec.lobes * th) / 2 + v * 0.7));
    const r = 1 - 0.09 * (1 - lobe) + 0.025 * Math.sin(5 * th + v);
    pts.push([Math.cos(th) * spec.rx * r, spec.cy + Math.sin(th) * spec.ry * r * (th > 0 && th < Math.PI ? 0.94 : 1)]);
  }
  const outline = inkPath(pts, true);
  // hatching: lines at 45 deg (down-left to up-right) across the canopy, kept on the shaded lower-right side
  let hatch = "";
  const gap = 17;
  for (let c = -spec.rx - spec.ry; c < spec.rx + spec.ry; c += gap) {
    // line: x - (y - cy) = c  ->  points (x, y) with x = c + (y - cy)
    const segs: P2[] = [];
    for (let k = 0; k <= 24; k++) {
      const yy = -spec.ry + (2 * spec.ry * k) / 24;
      const xx = c + yy;
      const inside = (xx / spec.rx) ** 2 + (yy / spec.ry) ** 2 < 0.86;
      const shade = xx / spec.rx + yy / spec.ry > 0.15 + 0.25 * hash(Math.round(c), 7 + v);
      if (inside && shade) segs.push([xx, spec.cy - yy]);
      else if (segs.length) break;
    }
    if (segs.length > 1) hatch += `M${P(segs[0])}L${P(segs[segs.length - 1])}`;
  }
  // lit scallops on the upper left
  let lit = "";
  for (let k = 0; k < 3; k++) {
    const th = Math.PI * (1.12 + 0.16 * k) + 0.08 * (hash(k, v) - 0.5);
    const p0: P2 = [Math.cos(th) * spec.rx * 0.72, spec.cy + Math.sin(th) * spec.ry * 0.72];
    lit += `M${P(p0)}q${(spec.rx * 0.12).toFixed(1)},${(-spec.ry * 0.1).toFixed(1)} ${(spec.rx * 0.26).toFixed(1)},${(-spec.ry * 0.04).toFixed(1)}`;
  }
  const tw = kind === 1 ? 20 : 26;
  const trunk = spec.tr ? `M${-tw},0Q${-tw * 0.6},${-spec.tr * 0.5} ${-tw * 0.5},${-spec.tr}L${tw * 0.5},${-spec.tr}Q${tw * 0.6},${-spec.tr * 0.5} ${tw},0Z` : "";
  const trunkLine = spec.tr ? `M${(tw * 0.2).toFixed(1)},-8L${(tw * 0.15).toFixed(1)},${(-spec.tr * 0.8).toFixed(1)}` : "";
  const g = { outline, hatch, trunk, trunkLine, lit };
  glyphCache.set(key, g);
  return g;
};
/** a tree / bush at its base point; s = its size (1 = a broadleaf ~540 world px tall) */
const TreeArt: React.FC<{ t: Tree; scale?: number; squash?: number; k: number }> = ({ t, scale = 1, squash = 1, k }) => {
  const g = treeGlyph(t.kind, Math.floor(hash(t.seed, 9) * 6));
  const s = t.s * scale;
  const lw = (px: number) => Math.max(px / k, 1.2) / s; // a line weight in screen px, at least 1.2 world px
  return (
    <g transform={`translate(${t.x.toFixed(1)} ${t.y.toFixed(1)}) scale(${s.toFixed(3)} ${(s * squash).toFixed(3)})`}>
      <ellipse cx={0} cy={2} rx={150} ry={22} fill={DARK} fillOpacity={0.28} />
      {g.trunk ? <path d={g.trunk} fill={PLANE} stroke={DARK} strokeWidth={lw(2.4)} /> : null}
      {g.trunk ? <path d={g.trunk + g.trunkLine} fill="none" stroke={CTX} strokeWidth={lw(1.1)} strokeOpacity={0.8} /> : null}
      <path d={g.outline} fill={CANOPY} stroke={DARK} strokeWidth={lw(3.4)} strokeOpacity={0.8} />
      <path d={g.hatch} fill="none" stroke={CTX} strokeWidth={lw(1)} strokeOpacity={0.6} />
      <path d={g.lit} fill="none" stroke={CTX} strokeWidth={lw(1.1)} strokeOpacity={0.8} strokeLinecap="round" />
      <path d={g.outline} fill="none" stroke={CTX} strokeWidth={lw(1.6)} />
    </g>
  );
};
const Stump: React.FC<{ at: P2; i: number; k: number }> = ({ at, i, k }) => {
  const w = 34 + 14 * hash(i, 77);
  const h = 30 + 16 * hash(i, 78);
  const lw = Math.max(1.1 / k, 1.2);
  return (
    <g transform={`translate(${at[0].toFixed(1)} ${at[1].toFixed(1)})`}>
      <ellipse cx={0} cy={2} rx={w * 1.4} ry={9} fill={DARK} fillOpacity={0.3} />
      <path d={`M${-w},0L${-w * 0.9},${-h}L${w * 0.9},${-h}L${w},0Z`} fill={PLANE} stroke={CTX} strokeWidth={lw} />
      <ellipse cx={0} cy={-h} rx={w * 0.9} ry={w * 0.3} fill={mixColor(LAND, INK, 0.42)} stroke={CTX} strokeWidth={lw} />
      <ellipse cx={0} cy={-h} rx={w * 0.45} ry={w * 0.14} fill="none" stroke={DARK} strokeWidth={lw * 0.8} strokeOpacity={0.6} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE RIVER (plan view): dark water between cream banks, two engraved water-lines
// ---------------------------------------------------------------------------
const River: React.FC<{ x0: number; x1: number; k: number }> = ({ x0, x1, k }) => {
  const step = Math.max(40, 6 / k);
  const top: P2[] = [];
  const bot: P2[] = [];
  const l1: P2[] = [];
  const l2: P2[] = [];
  for (let x = x0 - step; x <= x1 + step; x += step) {
    const y = riverY(x);
    const w = riverW(x);
    top.push([x, y - w / 2]);
    bot.push([x, y + w / 2]);
    l1.push([x, y - w * 0.18]);
    l2.push([x, y + w * 0.2]);
  }
  const water = `${inkPath(top)}L${P(bot[bot.length - 1])}${inkPath([...bot].reverse()).replace(/^M/, "L")}Z`;
  const lw = Math.max(1.4 / k, 2);
  return (
    <g fill="none" strokeLinecap="round">
      <path d={water} fill={SEA} fillOpacity={0.9} />
      <path d={inkPath(l1)} stroke={CTX} strokeWidth={lw * 0.6} strokeOpacity={0.35} strokeDasharray={`${70} ${45}`} />
      <path d={inkPath(l2)} stroke={CTX} strokeWidth={lw * 0.6} strokeOpacity={0.3} strokeDasharray={`${50} ${60}`} />
      <path d={inkPath(top)} stroke={DARK} strokeWidth={lw * 2.2} strokeOpacity={0.6} />
      <path d={inkPath(bot)} stroke={DARK} strokeWidth={lw * 2.2} strokeOpacity={0.6} />
      <path d={inkPath(top)} stroke={CTX} strokeWidth={lw} />
      <path d={inkPath(bot)} stroke={CTX} strokeWidth={lw} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CARRIERS: poses, and the sheaf held in the rig's R hand (his far hand when
// he faces right, his near hand when he faces left); the sheaf is drawn as a free
// Sheaf so its ink can drain to straw as the kernels come out
// ---------------------------------------------------------------------------
const SP = specOf("farmer");
const SPW = specOf("farmer", true);
const WOMEN = [false, true, false, true];
/** the R-hand tool frame (farmersFigures' toolFrame, the sheaf's +6 offset): world grip, angle, mirror */
const rHand = (q: FigPose, at: P2, scale: number, woman: boolean) => {
  const sp = woman ? SPW : SP;
  const r = figureRig(sp, q);
  const ar = r.armR;
  const G = r.s >= 0 ? 1 : -1;
  const v = rot(ar.dir, -90 * G);
  const grip = add(add(ar.W, mul(ar.dir, 9 * sp.limb)), mul(v, 6));
  return { at: [at[0] + grip[0] * scale, at[1] + grip[1] * scale] as P2, angle: (Math.atan2(v[0], -v[1]) * 180) / Math.PI, G };
};
const unwrap = (a: number, ref: number) => a + 360 * Math.round((ref - a) / 360);

const STAND_R = POSES.stand(1);
const STAND_L = POSES.stand(-1);
/** the sheaf in the crook of the far (R) arm, the near hand free at his side */
const CARRY_R: FigPose = { ...POSES.sheaf(1), armL: { w: [4, -150], elbow: [-0.6, 1], fist: 0.4, hand: 0 } };
/** facing left (R = near): stooped, the near hand down at a sheaf at local (-gx, gy) */
const reachL = (gx: number, gy: number): FigPose => mirrorPose({ ...POSES.stand(1), lean: 44, crouch: 58, pitch: 14, brow: 0.3, armL: { w: [gx, gy], elbow: [-0.2, 1], fist: 0.2, hand: 0 }, armR: { w: [30, -150], elbow: [-0.5, 1], fist: 0.3, hand: 0 } });
/** facing left, risen with the sheaf held at his chest in the near (R) hand */
const HOLD_L: FigPose = mirrorPose({ ...POSES.stand(1), lean: 4, armL: { w: [44, -196], elbow: [-0.6, 1], fist: 0.9, hand: -40 }, armR: { w: [20, -150], elbow: [-0.5, 1], fist: 0.3, hand: 0 } });
/** facing right, the sheaf raised over the heap in both hands, ears forward and down */
const raisedR = (u: number): FigPose => {
  const sh = Math.sin(2 * Math.PI * 3 * u);
  const q: FigPose = {
    ...POSES.stand(1),
    lean: -5 + 3 * sh,
    pitch: -12,
    brow: 0.4,
    footL: [-22, 0],
    footR: [24, 0],
    armL: { w: [66 + 10 * sh, -318 - 8 * sh], elbow: [-0.3, 0.9], fist: 1, hand: 0 },
    armR: { w: [80 + 10 * sh, -326 - 8 * sh], elbow: [-0.3, 0.9], fist: 1, hand: 0 },
  };
  return aimTool(q, 122 + 16 * sh, "far");
};
const RAISED_0 = raisedR(0);
/** how far (units) the sheaf hand and the free hand swing out beside the body at the middle of the pickup turn */
const TURN_OUT_R = 78;
const TURN_OUT_L = 44;
/** the same for the empty-handed about-turn after the shake (both hands) */
const TURN_OUT_FREE = 46;
/** the binders' loop at the stook before their first trip (facing left, stooped over a sheaf at their feet) */
const bindL = (g: number, seed: number): FigPose => {
  const u = Math.sin(g / 9 + seed);
  return mirrorPose({ ...POSES.stand(1), lean: 46, crouch: 62, pitch: 16, brow: 0.4, armL: { w: [74 + 8 * u, -66 - 6 * u], elbow: [-0.2, 1], fist: 0.7, hand: 0 }, armR: { w: [104 - 6 * u, -60 + 5 * u], elbow: [-0.2, 1], fist: 0.7, hand: 0 } });
};
const BIND_SHEAF: P2 = [-92, -12]; // the bound sheaf's band, lying at his feet (local, facing left)

/** dir: the mirror, continuous through a turn (Sheaf multiplies its x scale by it: edge-on at 0) */
type SheafDraw = { at: P2; angle: number; dir: number; ink: Ink; uid: string };
/** held: the orange sheaf is in his R fist and the figure draws it there (TurnFarmer holdSide "R": it never changes
 *  hands or layer, whatever the yaw); sheaf: a free Sheaf (lying, being taken, draining to straw, let go); sheafFront:
 *  draw the free one over him (it is coming into his near hand) */
type CarrierDraw = { c: number; at: P2; pose: FigPose; woman: boolean; sheaf: SheafDraw | null; shakeN: number | null; held?: boolean; sheafFront?: boolean };
const smoother = (v: number) => {
  const x = c01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
/** a stook's sheaf k (front first): where its band is when it stands in the stook */
const stookSheaf = (s: number, k: number) => {
  const st = STOOKS[s];
  const n = st.n;
  // two ranks: k even front, odd behind; spread across
  const col = Math.floor(k / 2);
  const ncol = Math.ceil(n / 2);
  const u = ncol === 1 ? 0 : (col / (ncol - 1)) * 2 - 1;
  const back = k % 2 === 1;
  const foot: P2 = [st.x + u * 34 + (back ? 8 : 0), st.y - (back ? 10 : 0)];
  const angle = -u * 13 + (hash(k, st.seed) - 0.5) * 5;
  const band = add(foot, rot([0, -44 * PEOPLE], angle));
  return { band, angle, back };
};
const carrierAt = (c: number, f: number): CarrierDraw => {
  const leg = legAtLocal(c, f);
  const woman = WOMEN[c];
  const sc = PEOPLE;
  const uid = `cr${c}`;
  const g = f + c * 37;
  const sheafOn = (q: FigPose, at: P2, ink: Ink = ORANGE): SheafDraw => {
    const h = rHand(q, at, sc, woman);
    return { at: h.at, angle: h.angle, dir: h.G, ink, uid: `${uid}s` };
  };
  switch (leg.kind) {
    case "wait": {
      if (leg.bind) {
        const q = bindL(g, c);
        const band: P2 = [leg.x + BIND_SHEAF[0] * sc, leg.y + BIND_SHEAF[1] * sc];
        return { c, at: [leg.x, leg.y], pose: q, woman, sheaf: { at: band, angle: 90, dir: 1, ink: ORANGE, uid: `${uid}s` }, shakeN: null };
      }
      return { c, at: [leg.x, leg.y], pose: idle(STAND_L, g, c), woman, sheaf: null, shakeN: null };
    }
    case "pick": {
      const t = f - leg.t0;
      const at: P2 = [leg.x, leg.y];
      // the sheaf: his own bound sheaf at his feet, or sheaf `take` of the stook
      const src = leg.take < 0 ? { band: [leg.x + BIND_SHEAF[0] * sc, leg.y + BIND_SHEAF[1] * sc] as P2, angle: 90 } : stookSheaf(leg.stook, leg.take);
      const lx = (leg.x - src.band[0]) / sc;
      const ly = (src.band[1] - leg.y) / sc;
      const start = leg.take < 0 ? bindL(g, c) : STAND_L;
      const reach = reachL(lx - 4, ly + 2);
      const q = t < PICK_GRAB ? lerpFig(start, reach, sstep(t / PICK_GRAB)) : lerpFig(reach, HOLD_L, sstep((t - PICK_GRAB) / (PICK - PICK_GRAB)));
      if (t < PICK_GRAB) {
        const sh: SheafDraw | null = leg.take < 0 ? { at: src.band, angle: 90, dir: 1, ink: ORANGE, uid: `${uid}s` } : null;
        return { c, at, pose: q, woman, sheaf: sh, shakeN: null };
      }
      // in the hand: blend from where it was into the hand's frame over 7 frames
      const e = sstep((t - PICK_GRAB) / 7);
      if (e >= 1) return { c, at, pose: q, woman, sheaf: null, shakeN: null, held: true };
      const h = sheafOn(q, at);
      const a0 = unwrap(src.angle, h.angle);
      return { c, at, pose: q, woman, sheaf: { ...h, at: mix2(src.band, h.at, e), angle: mix(a0, h.angle, e) }, shakeN: null, sheafFront: true };
    }
    case "turnR": {
      // the turn through the front (farmersFigures turnPose: one eased yaw, hands round the body axis, a step), the
      // sheaf kept in the R fist and aimed in screen degrees from its angle at his chest to its angle in the crook
      const w0 = rHand(HOLD_L, [leg.x, leg.y], sc, woman).angle;
      const w1 = rHand(CARRY_R, [leg.x, leg.y], sc, woman).angle;
      const tq0 = turnPose(HOLD_L, CARRY_R, f, leg.t0, leg.t1, { headLead: 0 });
      // the rig can only change an arm's layer at yaw 0 (mid-turn): carry both hands out beside the body there, so
      // the sheaf (R) and the free hand (L) are clear of the torso at the moment they pass behind / come in front
      const b = Math.sin(Math.PI * c01((f - leg.t0) / TURN)) ** 2;
      const tq: FigPose = { ...tq0, armR: { ...tq0.armR, w: [tq0.armR.w[0] + TURN_OUT_R * b, tq0.armR.w[1] - 14 * b] }, armL: { ...tq0.armL, w: [tq0.armL.w[0] - TURN_OUT_L * b, tq0.armL.w[1]] } };
      const q = f >= leg.t1 ? CARRY_R : aimToolWorld(tq, mix(unwrap(w0, w1), w1, smoother((f - leg.t0) / TURN)), "R", "farmer", woman);
      return { c, at: [leg.x, leg.y], pose: q, woman, sheaf: null, shakeN: null, held: true };
    }
    case "walkR": {
      const u = c01((f - leg.t0) / (leg.t1 - leg.t0));
      const x = mix(leg.x0, leg.x1, u);
      const y = mix(leg.y0, leg.y1, u);
      const ph = (x - leg.x0) / (2 * CARRY_STRIDE * sc);
      const q = { ...walkPose(CARRY_R, ph, 1, CARRY_STRIDE), armL: CARRY_R.armL, armR: CARRY_R.armR };
      return { c, at: [x, y], pose: q, woman, sheaf: null, shakeN: null, held: true };
    }
    case "shake": {
      const S = shakeV2(leg.n);
      const at: P2 = [leg.x, leg.y];
      const tr = f - (S.t0 - RAISE); // into the raise
      if (tr < 0) return { c, at, pose: idle(CARRY_R, g, c), woman, sheaf: null, shakeN: null, held: true };
      if (tr < RAISE) {
        const q = lerpFig(CARRY_R, RAISED_0, sstep(tr / RAISE));
        return { c, at, pose: q, woman, sheaf: null, shakeN: null, held: true };
      }
      const ts = f - S.t0;
      if (ts < S.dur) {
        const u = ts / S.dur;
        const q = raisedR(u);
        // the sheaf drains as its kernels come out (over its output, which may end before the shaking)
        const o = outOfV2(leg.n, f);
        const drain = o === null ? sstep(u * 1.05) : sstep(o * 1.02);
        return { c, at, pose: q, woman, sheaf: sheafOn(q, at, mixInk(ORANGE, STRAW, drain)), shakeN: leg.n };
      }
      const tl = (ts - S.dur) / LOWER;
      const q = lerpFig(raisedR(1), STAND_R, sstep(tl));
      return { c, at, pose: q, woman, sheaf: ts - S.dur < DROP_AT ? sheafOn(q, at, STRAW) : null, shakeN: null };
    }
    case "turnL": {
      // the hands swing out to his sides mid-turn, clear of the body where the rig changes the arms' layer (yaw 0)
      const tq = turnPose(STAND_R, STAND_L, f, leg.t0, leg.t1, { headLead: 0 });
      const b = Math.sin(Math.PI * c01((f - leg.t0) / TURN)) ** 2;
      const q: FigPose = f >= leg.t1 ? tq : { ...tq, armL: { ...tq.armL, w: [tq.armL.w[0] - TURN_OUT_FREE * b, tq.armL.w[1]] }, armR: { ...tq.armR, w: [tq.armR.w[0] + TURN_OUT_FREE * b, tq.armR.w[1]] } };
      return { c, at: [leg.x, leg.y], pose: q, woman, sheaf: null, shakeN: null };
    }
    case "walkL": {
      const u = c01((f - leg.t0) / (leg.t1 - leg.t0));
      const x = mix(leg.x0, leg.x1, u);
      const y = mix(leg.y0, leg.y1, u) + LANE_BULGE * Math.sin(Math.PI * u);
      const ph = (leg.x0 - x) / (2 * CARRY_STRIDE * sc);
      return { c, at: [x, y], pose: walkPose(STAND_L, ph, 1, CARRY_STRIDE), woman, sheaf: null, shakeN: null };
    }
  }
};
const legAtLocal = (c: number, f: number): Leg => {
  const L = LEGS_V2[c];
  for (const l of L) if (f >= l.t0 && f < l.t1) return l;
  return L[L.length - 1];
};
/** the straw a shaker lets go of: it falls from his hand and lies at his feet (the heap later grows over it) */
const strawsAt = (f: number): SheafDraw[] => {
  const out: SheafDraw[] = [];
  for (let n = 0; ; n++) {
    const S = shakeV2(n);
    const tDrop = S.t0 + S.dur + DROP_AT;
    if (tDrop > f) break;
    const woman = WOMEN[S.c];
    const q = lerpFig(raisedR(1), STAND_R, sstep(DROP_AT / LOWER));
    const h = rHand(q, [S.x, S.y], PEOPLE, woman);
    const t = c01((f - tDrop) / 10);
    const e = t * t;
    const rest: P2 = [S.x + 58 + 10 * hash(n, 5), S.y - 8];
    out.push({ at: mix2(h.at, rest, e), angle: mix(unwrap(h.angle, 90), 88 + 6 * hash(n, 6), e), dir: 1, ink: STRAW, uid: `st${n}` });
  }
  return out;
};

// the ears of the sheaf being shaken in shake n at frame f (where its kernels leave from), cached per frame
const earsCache = new Map<string, P2>();
const earsOf = (n: number, f: number): P2 => {
  const fr = Math.round(f * 2) / 2;
  const key = `${n}:${fr}`;
  const hit = earsCache.get(key);
  if (hit) return hit;
  const S = shakeV2(n);
  const q = raisedR(c01((fr - S.t0) / S.dur));
  const h = rHand(q, [S.x, S.y], PEOPLE, WOMEN[S.c]);
  const p = add(h.at, rot([0, -92 * PEOPLE], h.angle));
  earsCache.set(key, p);
  return p;
};
/** the delivered source (the ears of the sheaf being shaken, a little jitter): kernels landing from the join on */
const heapSource = (fLeave: number, kx: number): P2 | null => {
  const act = throwingAt(fLeave);
  if (!act.length) return null;
  const S = act.length > 1 ? act[Math.floor(hash(Math.round(kx * 10), 3) * act.length)] : act[0];
  const e = earsOf(S.n, fLeave);
  const j = hash(Math.round(kx * 7 + fLeave * 3), 11) - 0.5;
  return [e[0] + j * 36, e[1] + j * 24];
};
/** V2's throw (kernels landing before the join): out of the ears as a handful, scattered across the ear fan and a
 *  little up and down; each kernel picks its own carrier when two throw at once */
const throwSource = (fLeave: number, kx: number, i: number): P2 | null => {
  const act = throwingAt(fLeave);
  if (!act.length) return null;
  const S = act.length > 1 ? act[Math.floor(hash(i, 17) * act.length)] : act[0];
  const e = earsOf(S.n, fLeave);
  return [e[0] + (hash(i, 18) - 0.5) * 56, e[1] + (hash(i, 19) - 0.5) * 34 + 4 * Math.sin(kx)];
};

// ---------------------------------------------------------------------------
// THE HEAP, V2: farmersFigures' GrainHeapFed (copied here, the shared module untouched) with its kernels landing
// before the join thrown on V2's arcs; every kernel landing from the join on is drawn exactly as GrainHeapFed draws
// it (the same kernels, cache, bisection, source, arc), so the delivered f240 is unchanged
// ---------------------------------------------------------------------------
const heapCacheV2 = new globalThis.Map<string, { x: number; y: number; a: number; ang: number; s: number }[]>();
const heapKernelsV2 = (n: number, W: number, H: number, seed: number) => {
  const key = `${n}-${W}-${H}-${seed}`;
  const hit = heapCacheV2.get(key);
  if (hit) return hit;
  const out: { x: number; y: number; a: number; ang: number; s: number }[] = [];
  const kh = 7.2;
  let i = 0;
  for (let row = 0; out.length < n * 1.6 && row < 200; row++) {
    const yy = row * kh * 0.8;
    if (yy > H) break;
    const half = W * Math.sqrt(Math.max(0, 1 - yy / H));
    for (let x = -half + (row % 2) * 5; x <= half; x += 10.5) {
      const jx = x + (hash(i, 861 + seed) - 0.5) * 4;
      const jy = yy + (hash(i, 862 + seed) - 0.5) * 3;
      const u = jy / H;
      const v2 = (jx * jx) / (W * W);
      const sF = (u + Math.sqrt(u * u + 4 * v2)) / 2;
      out.push({ x: jx, y: -jy - 3.5, a: sF * sF, ang: hash(i, 863 + seed) * 180 - 90, s: 0.85 + 0.3 * hash(i, 864 + seed) });
      i++;
    }
  }
  out.sort((p, q) => p.a - q.a);
  heapCacheV2.set(key, out);
  return out;
};
const PK = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const kernelD = (x: number, y: number, ang: number, s: number) => {
  const a = (ang * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const L = 5.6 * s;
  const R = 3.1 * s;
  const p = (u: number, v: number): P2 => [x + u * ca - v * sa, y + u * sa + v * ca];
  return { body: `M${PK(p(-L, 0))}Q${PK(p(-L * 0.7, -R * 1.4))} ${PK(p(0, -R))}Q${PK(p(L * 0.7, -R * 1.4))} ${PK(p(L, 0))}Q${PK(p(L * 0.7, R * 1.4))} ${PK(p(0, R))}Q${PK(p(-L * 0.7, R * 1.4))} ${PK(p(-L, 0))}Z`, crease: `M${PK(p(-L * 0.6, 0.2))}L${PK(p(L * 0.6, 0.2))}` };
};
const fedCacheV2 = new globalThis.Map<string, { body: string[]; crease: string[] }>();
const HeapV2: React.FC<{ frame: number }> = ({ frame }) => {
  const { at, scale, width, height, seed, flight, arc } = HEAP;
  const ink = ORANGE;
  const W = width / 2;
  const H = height;
  const ks = heapKernelsV2(1e6, W, H, seed);
  const key = `${W}-${H}-${seed}`;
  let cache = fedCacheV2.get(key);
  if (!cache) {
    const c = { body: [] as string[], crease: [] as string[] };
    ks.forEach((k0) => {
      const d = kernelD(k0.x, k0.y, k0.ang, k0.s);
      c.body.push(d.body);
      c.crease.push(d.crease);
    });
    fedCacheV2.set(key, c);
    cache = c;
  }
  const amountAt = heapAmountV2;
  const am = c01(amountAt(frame));
  const TMAX = Math.max(flight, V2_FLIGHT);
  const amF = c01(amountAt(frame + TMAX));
  let lo = 0;
  let hi = ks.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (ks[m].a <= am) lo = m + 1;
    else hi = m;
  }
  const nRest = lo;
  const flying: React.ReactNode[] = [];
  for (let i = nRest; i < ks.length && ks[i].a <= amF; i++) {
    const k0 = ks[i];
    // the delivered GrainHeapFed's own bisection over its flight (kernels landing from the join on)
    let f0 = frame;
    let f1 = frame + flight;
    for (let it = 0; it < 14; it++) {
      const fm = (f0 + f1) / 2;
      if (amountAt(fm) >= k0.a) f1 = fm;
      else f0 = fm;
    }
    let fl = f1;
    const delivered = amountAt(frame + flight) >= k0.a && fl >= V2_JOIN;
    if (!delivered) {
      // V2: the landing frame within the longer flight
      f0 = frame;
      f1 = frame + V2_FLIGHT;
      for (let it = 0; it < 16; it++) {
        const fm = (f0 + f1) / 2;
        if (amountAt(fm) >= k0.a) f1 = fm;
        else f0 = fm;
      }
      fl = f1;
      if (fl >= V2_JOIN) continue; // lands from the join on but beyond the delivered flight window: not yet in the air
    }
    if (delivered) {
      const t = c01(1 - (fl - frame) / flight);
      const sw = heapSource(fl - flight, k0.x);
      const s: P2 = sw ? [(sw[0] - at[0]) / scale, (sw[1] - at[1]) / scale] : [k0.x * 0.2, -H * 1.6 - 60];
      const lift = arc + 0.22 * Math.abs(k0.x - s[0]);
      const x = mix(s[0], k0.x, t) + (hash(i, 871 + seed) - 0.5) * 8 * (1 - t);
      const y = mix(s[1], k0.y, t) - lift * 4 * t * (1 - t);
      const d = kernelD(x, y, k0.ang + 260 * (1 - t) * (hash(i, 872 + seed) > 0.5 ? 1 : -1), k0.s);
      flying.push(<path key={i} d={d.body} fill={ink.main} stroke={DARK} strokeWidth={1.3} />);
      continue;
    }
    // V2's throw: a ballistic arc (uniform gravity: the chord plus a parabola) from the scattered handful to its
    // place on the heap; the lift varies kernel to kernel, so the handful spreads out and rains down
    // a thrown handful lands near the top of the heap it is building and runs down the slope to its place:
    // 70% of the flight a ballistic arc to a point near the apex (the heap at the size this kernel completes),
    // then a slide down that heap's surface to the kernel's own spot
    const t = c01(1 - (fl - frame) / V2_FLIGHT);
    const sw = throwSource(fl - V2_FLIGHT, k0.x, i);
    const s: P2 = sw ? [(sw[0] - at[0]) / scale, (sw[1] - at[1]) / scale] : [k0.x * 0.2, -H * 1.6 - 60];
    const sz = Math.sqrt(Math.max(k0.a, 1e-4)); // the heap's size (fraction of the full one) when this kernel lands
    const surf = (x: number) => -H * sz * Math.max(0, 1 - (x / (W * sz)) ** 2) - 3.5;
    const xTop = k0.x * 0.22 + (hash(i, 874 + seed) - 0.5) * W * sz * 0.34;
    const top: P2 = [xTop, surf(xTop) - 4];
    const TA = 0.7;
    let x: number;
    let y: number;
    if (t < TA) {
      const u = t / TA;
      const lift = 40 + 0.14 * Math.abs(top[0] - s[0]) + 130 * hash(i, 873 + seed) ** 1.5;
      x = mix(s[0], top[0], u);
      y = mix(s[1], top[1], u) - lift * 4 * u * (1 - u);
    } else {
      const u = (t - TA) / (1 - TA);
      const e = u * (2 - u); // it slows as it settles
      x = mix(top[0], k0.x, e);
      y = Math.min(surf(x) - 3, mix(top[1], k0.y, e)) * (1 - e * e) + k0.y * e * e;
    }
    const d = kernelD(x, y, k0.ang + 300 * (1 - t) * (hash(i, 872 + seed) > 0.5 ? 1 : -1), k0.s);
    flying.push(<path key={i} d={d.body} fill={ink.main} stroke={DARK} strokeWidth={1.3} />);
  }
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`}>
      {am > 0.002 ? <ellipse cx={0} cy={1} rx={W * Math.sqrt(am) * 1.08} ry={(8 * Math.sqrt(am) + 2) * Math.max(1, W / 130)} fill={DARK} fillOpacity={0.35} /> : null}
      <path d={cache.body.slice(0, nRest).join("")} fill={ink.main} stroke={DARK} strokeWidth={1.35} />
      <path d={cache.crease.slice(0, nRest).join("")} fill="none" stroke={ink.hair} strokeWidth={0.9} strokeOpacity={0.8} />
      {flying}
    </g>
  );
};

/** "It's all about energy": a wind crest rolls through the rows left to right (f205 -> f225, a hair later on each row
 *  further back), the ears bending down and springing back behind it; it reaches the heap's side on "energy" (f225)
 *  and is gone by f236 (null = no wave: the delivered line exactly) */
const sm01 = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
const WAVE = { f0: 205, f1: 225, end: 236, amp: 46, w: 170 };
const windCrest = (f: number, j: number): ((x: number) => number) | null => {
  if (f <= WAVE.f0 - 4 || f >= WAVE.end) return null;
  const env = sm01((f - (WAVE.f0 - 4)) / 6) * (1 - sm01((f - (WAVE.f1 + 2)) / (WAVE.end - WAVE.f1 - 2)));
  if (env <= 0) return null;
  const lag = (FIELD.rows - 1 - j) * 0.35; // the back rows a hair later
  const xc = FIELD.x0 - 250 + ((f - lag - WAVE.f0) / (WAVE.f1 - WAVE.f0)) * (FIELD.x1 - FIELD.x0 + 250);
  return (x: number) => {
    const u = (x - xc) / WAVE.w;
    // the crest bends the ears down; behind it they spring back past upright and settle
    return env * WAVE.amp * (Math.exp(-u * u) - 0.4 * Math.exp(-((u + 1.7) ** 2)));
  };
};

// ---------------------------------------------------------------------------
// THE WORLD at frame f seen by cam (exported: cut E renders it on and on)
// ---------------------------------------------------------------------------
type Item = { y: number; o: number; el: React.ReactNode };
export const EnergyWorldV2: React.FC<{ frame: number; cam: Cam; children?: React.ReactNode }> = ({ frame: f, cam, children }) => {
  const k = cam.k;
  const hw = 540 / k;
  const hh = 960 / k;
  const vx0 = cam.x - hw - 200;
  const vx1 = cam.x + hw + 200;
  const vy0 = cam.y - hh - 200;
  const vy1 = cam.y + hh + 700; // objects stand up from their base: take in bases below the frame
  const items: Item[] = [];
  const push = (y: number, el: React.ReactNode, o = 0) => items.push({ y, o, el });
  // the forest, scrub, stumps
  for (const t of treesIn(vx0 - 200, vy0, vx1 + 200, vy1)) push(t.y, <TreeArt key={`t${t.seed}`} t={t} k={k} />);
  for (const t of scrubIn(vx0, vy0, vx1, vy1)) push(t.y, <TreeArt key={`s${t.seed}`} t={{ ...t, kind: 2 }} scale={0.5} squash={0.5} k={k} />);
  STUMPS.forEach((p, i) => (p[0] > vx0 && p[0] < vx1 && p[1] > vy0 && p[1] < vy1 ? push(p[1], <Stump key={`p${i}`} at={p} i={i} k={k} />) : null));
  // the field: one WheatField per row (the reapers' rows cut from the right)
  for (let j = 0; j < FIELD.rows; j++) {
    const y = rowY(j);
    if (y < vy0 - 50 || y - 200 > vy1) continue;
    const ri = REAPERS.findIndex((r) => r.row === j);
    const cut = ri >= 0 ? cutFront(ri, f) : undefined;
    // the wide: the ears of the standing wheat read as one orange line per row (an LOD of the same rows)
    // V2: the line GROWS out of the ears as the scale drops (its width, at full orange, from a hairline at k 1.0 to the
    // delivered 15 by k 0.6), so the stalks gather into stripes instead of dissolving into them
    const band = sstep((1.0 - k) / 0.4);
    if (band > 0.01) {
      const xe = cut ?? FIELD.x1;
      let pts = roughen([[FIELD.x0 + 6, y - 150], [xe - 4, y - 150]], 40 + j, 6);
      const wv = windCrest(f, j);
      if (wv) pts = pts.map(([px, py]): P2 => [px, py + wv(px)]);
      push(y, <path key={`eb${j}`} d={inkPath(pts)} fill="none" stroke={ACCENT} strokeWidth={band >= 1 ? 15 : 15 * band} strokeOpacity={band >= 1 ? 0.75 * band : 0.75} strokeLinecap="round" />, 0.5);
    }
    push(y, <WheatField key={`w${j}`} x0={FIELD.x0} x1={FIELD.x1} y={y} scale={FIELD.scale} rows={1} g={f} cutX={cut} cutFrom="right" seed={rowSeed(j)} />, 0);
    if (ri >= 0) push(y, <CutStalks key={`cs${j}`} ri={ri} f={f} />, 1);
  }
  // the reapers (in their row, a hair in front of its stalks)
  REAPERS.forEach((R, i) => {
    const ph = (f + R.phase) / STROKE;
    const x = reaperFeetX(i, f);
    const u = (f + R.phase) / STROKE;
    const inPair = u - Math.floor(u / 2) * 2;
    const w = c01((inPair - 1.55) / 0.42);
    const base = POSES.harvest(-1, ph);
    const q = w > 0 && w < 1 ? { ...walkPose(base, 0.5 * w, Math.sin(Math.PI * w)), armL: base.armL, armR: base.armR } : base;
    push(rowY(R.row) + 8, <Farmer key={`r${i}`} pose={q} at={[x, rowY(R.row) + 8]} scale={PEOPLE} uid={`rp${i}`} seed={R.seed} woman={i === 2} hold="sickle" />, 2);
  });
  // the stooks (sheaves not yet taken)
  STOOKS.forEach((st, s) => {
    const gone = STOOK_GRABS[s].filter((t) => t <= f).length;
    for (let kk = st.n - 1; kk >= gone; kk--) {
      const sh = stookSheaf(s, kk);
      push(st.y - (sh.back ? 10 : 0), <Sheaf key={`k${s}-${kk}`} at={sh.band} scale={PEOPLE} angle={sh.angle} uid={`sk${s}-${kk}`} dir={hash(kk, s) > 0.5 ? 1 : -1} />, 3);
    }
  });
  // the dropped straw
  strawsAt(f).forEach((s, i) => push(shakeV2(i).y - 2, <Sheaf key={s.uid} at={s.at} scale={PEOPLE} angle={s.angle} dir={s.dir as 1} ink={s.ink} uid={s.uid} />, 1));
  // the carriers (each with his sheaf drawn first: behind him, as the rig draws a far-hand tool)
  for (let c = 0; c < N_CARRIERS; c++) {
    const d = carrierAt(c, f);
    if (d.at[0] < vx0 - 300 || d.at[0] > vx1 + 300) continue;
    push(
      d.at[1],
      <g key={`c${c}`}>
        {d.sheaf && !d.sheafFront ? <Sheaf at={d.sheaf.at} scale={PEOPLE} angle={d.sheaf.angle} dir={d.sheaf.dir as 1} ink={d.sheaf.ink} uid={d.sheaf.uid} /> : null}
        <TurnFarmer pose={d.pose} at={d.at} scale={PEOPLE} uid={`cf${c}`} woman={d.woman} hold={d.held ? "sheaf" : "none"} holdSide="R" seed={c + 5} />
        {d.sheaf && d.sheafFront ? <Sheaf at={d.sheaf.at} scale={PEOPLE} angle={d.sheaf.angle} dir={d.sheaf.dir as 1} ink={d.sheaf.ink} uid={d.sheaf.uid} /> : null}
      </g>,
      2,
    );
  }
  // the farm's animals grazing on the cleared ground
  ANIMALS.forEach((a, i) => {
    if (a.at[0] < vx0 - 300 || a.at[0] > vx1 + 300 || a.at[1] < vy0 || a.at[1] > vy1) return;
    const graze = 0.5 + 0.5 * Math.sin(f / 37 + a.seed * 1.7);
    const A = a.kind === "cow" ? Cow : Goat;
    // V2: the cream animals recede to context while the pull carries them through the caption band, full again by f230
    const dim = sm01((f - 146) / 8) * (1 - sm01((f - 200) / 30));
    push(a.at[1], dim > 0 ? <A key={`a${i}`} at={a.at} scale={PEOPLE} dir={a.dir} graze={graze} g={f} seed={a.seed} uid={`an${i}`} tone={1 - 0.82 * dim} /> : <A key={`a${i}`} at={a.at} scale={PEOPLE} dir={a.dir} graze={graze} g={f} seed={a.seed} uid={`an${i}`} />);
  });
  // the longhouse (cream line on dark planes; a thin orange touch on the ridge)
  push(
    HOUSE.at[1],
    <g key="house">
      <Longhouse at={HOUSE.at} scale={HOUSE.scale} len={HOUSE.len} tint={0} uid="lh" />
      <path d={`M${HOUSE.at[0] - (HOUSE.len / 2 - 160) * HOUSE.scale},${HOUSE.at[1] - 936 * HOUSE.scale}L${HOUSE.at[0] + (HOUSE.len / 2 - 160) * HOUSE.scale},${HOUSE.at[1] - 936 * HOUSE.scale}`} stroke={ACCENT} strokeWidth={3.2 * HOUSE.scale} strokeLinecap="round" strokeOpacity={0.85} />
    </g>,
  );
  // the heap
  push(HEAP.at[1], <HeapV2 key="heap" frame={f} />, 5);
  items.sort((a, b) => a.y - b.y || a.o - b.o);
  const outline = clearingOutline(180);
  return (
    <WorldSvg cam={cam}>
      {/* the cleared ground, a shade lighter than the wild */}
      <path d={inkPath(roughen(outline, 5, 14), true)} fill={mixColor(LAND, LAND_RIM, 0.28)} fillOpacity={0.55} />
      <River x0={vx0} x1={vx1} k={k} />
      {/* the field's soil under each row */}
      {Array.from({ length: FIELD.rows }, (_, j) => (
        <rect key={j} x={FIELD.x0 - 10} y={rowY(j) - 4} width={FIELD.x1 - FIELD.x0 + 20} height={16} fill={DARK} fillOpacity={0.22} rx={6} />
      ))}
      {items.map((it) => it.el)}
      {children}
    </WorldSvg>
  );
};

const AllAboutEnergyV2: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAtV2(frame);
  return (
    <AbsoluteFill>
      <Page>
        <EnergyWorldV2 frame={frame} cam={cam} />
      </Page>
    </AbsoluteFill>
  );
};

export default AllAboutEnergyV2;
