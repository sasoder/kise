// ---------------------------------------------------------------------------
// overwhelmingFigures: the cast, the layout and the camera of
// OverwhelmingNumbers (cut C of "Sheppard_Conquistador_Advantages"), the
// CHARACTER version: the engraved people of SteelAndHorses in place of dots.
//
// THE WORLD is in METRES: x to screen right, y UP the page; (0, 0) = the ground
// under the horseman's saddle. Side-on figures stand in ROWS stacked up the
// page (a period battle engraving): a row further up the page is further back
// and is drawn first. Everyone marches to screen LEFT at one pace (MARCH_V);
// the camera travels with them and the page slides to the right under them.
//
// THE SPANIARDS (read-only imports): the hero of SteelAndHorses (cut A's
// conquistador seated on steelHorsesShared's orange horse, his sword carried
// upright at rest) and eight men on foot, each cut A's full conquistador
// walking with his sword at the hip and a pike on the shoulder (the pike is
// this module's): two ahead of the horse and two behind it on its own ground
// line, four more a row behind, clear of the rider. They are live SVG.
//
// THE ALLIES: techAdvFigures' Warrior (quilted cotton, chimalli, macuahuitl),
// mirrored to face left, walking (warWalk), in six VARIANTS: how the
// macuahuitl is carried, the head, a feather crest, a bow on the back, a
// headband with two feathers, three painted shields, and (two variants in six)
// a tall SPEAR carried upright in the shield hand with the macuahuitl held
// low. The Warrior drawing is read-only and always draws its shield and
// macuahuitl, so the variants paint over or add to it. Each variant x walk
// frame is rendered ONCE to an SVG image (renderToStaticMarkup -> data URL);
// every frame the images in view are rasterised at the size they have on
// screen right now (never soft) and blitted for every man who shares them.
// ---------------------------------------------------------------------------
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
// @ts-expect-error react-dom ships no types for its server entry here (and nothing may be installed); typed below
import * as ReactDomServer from "react-dom/server";
import { DARK, FRAME_H, FRAME_W, LAND, clamp01, hash, smootherstep, type Cam, type P2 } from "./incaShared";
import { CONQ_IDLE, CONQ_K, Conquistador, SCAB_REST, WAR_READY, Warrior, conqRig, holdAt, swordInScabbard, warRig, type ConqPose, type WarPose } from "./techAdvFigures";
import { CREAM, ORANGE } from "./texcocoFigures";
import { HorseRider, SADDLE_Y, mkPen } from "./steelHorsesShared";

const renderToStaticMarkup = (ReactDomServer as { renderToStaticMarkup: (el: React.ReactElement) => string }).renderToStaticMarkup;

// ---------------------------------------------------------------------------
// SCALE AND MARCH
// ---------------------------------------------------------------------------
/** cm per figure unit (a man of ~310 units stands 1.70 m), as SteelAndHorses */
export const UC = 170 / 310;
/** the march: metres per frame (the horse's brisk walk: a 46 cm stance over 0.62 of an 18-frame stride) */
export const HORSE_CYCLE = 18;
export const MARCH_V = 0.46 / (0.62 * HORSE_CYCLE);
/** the walkers' cycle, frames (an integer: one sprite per frame of it), and their step to match the pace */
export const WAR_CYCLE = 24;
const WAR_STRIDE = (MARCH_V * WAR_CYCLE * 100) / UC / 2; // units a planted foot travels per step (~90)

// ---------------------------------------------------------------------------
// THE CAMERA: one log-space pull-back off the Spanish knot. ppm = screen px
// per metre.
// ---------------------------------------------------------------------------
/** tight: horse and rider (2.5 m, hoof to helmet) stand ~1000 px */
export const PPM_TIGHT = 400;
/** wide: a 1.70 m man stands ~150 px upright (~138 px in his stride) as the pull-back lands */
export const PPM_WIDE = 88;
/** the pull-back began before the cut (the camera is already moving on f0), peaks around f22 and lands on f60 */
const PULL: [number, number] = [-6, 60];
const SKEW = 1.15;
/** the hold's creep, ln ppm per frame (it runs under the whole cut) */
const CREEP = 0.0008;
const pullRaw = (f: number) => smootherstep(1 - Math.pow(1 - clamp01((f - PULL[0]) / (PULL[1] - PULL[0])), SKEW));
const E0 = pullRaw(0);
/** 0 on f0 -> 1 on f60 */
export const pull = (f: number) => (pullRaw(f) - E0) / (1 - E0);
/** the point of the knot the camera holds (the rider's seat), metres */
const ANCHOR: P2 = [-0.1, 1.35];
export type View = { ppm: number; S: number; g: P2 };
/** ppm, S (px per cm) and g = the screen place of the world origin */
export const viewAt = (f: number): View => {
  const e = pull(f);
  const ppm = Math.exp(Math.log(PPM_TIGHT) + (Math.log(PPM_WIDE) + CREEP * PULL[1] - Math.log(PPM_TIGHT)) * e - CREEP * f);
  // the anchor: (540, 960) tight -> (540, 892) wide (the knot just above the caption strip)
  const sy = 960 - 68 * e;
  return { ppm, S: ppm / 100, g: [540 - ANCHOR[0] * ppm, sy + ANCHOR[1] * ppm] };
};
export const toScreen = (v: View, x: number, y: number): P2 => [v.g[0] + x * v.ppm, v.g[1] - y * v.ppm];
/** the page under the marchers (incaShared's Cam, world units = cm): it slides to the right as they march left */
export const groundCam = (v: View, f: number): Cam => {
  const k = v.S;
  const ox = -MARCH_V * 100 * f + 211; // the ground's cm under the world origin
  return { k, cx: ox + (540 - v.g[0]) / k, cy: 137 + (960 - v.g[1]) / k };
};

// ---------------------------------------------------------------------------
// THE WARRIOR'S WALK (he is drawn facing screen RIGHT; the sprite mirrors him)
// ---------------------------------------------------------------------------
const frac = (v: number) => v - Math.floor(v);
const ease = (v: number) => v * v * (3 - 2 * v);
type Carry = { near: WarPose["near"]; club: number; far: WarPose["far"]; shield: number; headYaw: number; pitch: number; lean: number; paint: 0 | 1 | 2; spear: 0 | 1 | 2 };
const LOW: Pick<Carry, "near" | "club"> = { near: { w: [22, -128], elbow: [-0.7, 0.6], fist: 1, hand: 0 }, club: -24 };
/** how each variant carries his arms; paint = his shield's design (0 = the drawing's own down balls); spear 1 = one tall spear, 2 = three darts */
const CARRY: Carry[] = [
  // 0: the macuahuitl upright before the shoulder; a half-dark shield
  { near: { w: [36, -206], elbow: [0, 1], fist: 1, hand: 0 }, club: -84, far: { w: [25, -146], elbow: [-0.5, 1], fist: 1, hand: 0 }, shield: -6, headYaw: 0.95, pitch: -1, lean: 3, paint: 1, spear: 0 },
  // 1: sloped back over the shoulder, a feather crest; a ringed shield
  { near: { w: [4, -204], elbow: [0.6, 1], fist: 1, hand: 0 }, club: -128, far: { w: [28, -150], elbow: [-0.5, 1], fist: 1, hand: 0 }, shield: -2, headYaw: 1.05, pitch: -3, lean: 4, paint: 2, spear: 0 },
  // 2: a tall spear upright in the shield hand, the macuahuitl carried low
  { ...LOW, far: { w: [30, -168], elbow: [-0.5, 1], fist: 1, hand: 0 }, shield: 2, headYaw: 0.9, pitch: 2, lean: 5, paint: 0, spear: 1 },
  // 3: upright, close to the chest, a bow on the back
  { near: { w: [26, -186], elbow: [0.2, 1], fist: 1, hand: 0 }, club: -96, far: { w: [22, -146], elbow: [-0.5, 1], fist: 1, hand: 0 }, shield: -10, headYaw: 0.8, pitch: -2, lean: 2.5, paint: 0, spear: 0 },
  // 4: three darts upright behind the shield, the macuahuitl low, a headband with two feathers
  { ...LOW, far: { w: [32, -172], elbow: [-0.6, 1], fist: 1, hand: 0 }, shield: 4, headYaw: 1.1, pitch: -4, lean: 4, paint: 0, spear: 2 },
  // 5: the macuahuitl high and forward; a ringed shield, a crest of two feathers
  { near: { w: [44, -212], elbow: [-0.2, 1], fist: 1, hand: 0 }, club: -66, far: { w: [24, -142], elbow: [-0.5, 1], fist: 1, hand: 0 }, shield: -4, headYaw: 1.0, pitch: -5, lean: 3.5, paint: 1, spear: 0 },
];
export const N_VARIANTS = CARRY.length;
/** variant v at phase p (0..1 per two steps) */
export const warWalk = (v: number, p: number): WarPose => {
  const c = CARRY[v];
  const leg = (u0: number) => {
    const u = frac(u0);
    if (u < 0.5) {
      // planted: it travels back under him; the heel peels off at the end
      const t = u / 0.5;
      const peel = ease(Math.max(0, (t - 0.62) / 0.38));
      return { x: WAR_STRIDE * (0.5 - t), y: -9 * peel, lift: 30 * peel - 12 * Math.max(0, 1 - t / 0.14) };
    }
    // carried forward: it lifts, the toes come up to land on the heel
    const t = (u - 0.5) / 0.5;
    return { x: WAR_STRIDE * (-0.5 + ease(t)), y: -22 * Math.sin(Math.PI * t) - 9 * (1 - t) * (1 - t), lift: 30 * (1 - ease(Math.min(1, t * 1.6))) - 12 * ease(Math.max(0, (t - 0.45) / 0.55)) };
  };
  const F = leg(p);
  const N = leg(p + 0.5);
  const sw = Math.sin(2 * Math.PI * (p + 0.1));
  const bob = Math.cos(4 * Math.PI * p);
  return {
    ...WAR_READY,
    headYaw: c.headYaw,
    pitch: c.pitch,
    roll: 0.6 * sw,
    lean: c.lean + 4 + 0.5 * bob,
    crouch: 7 + 4.6 * bob,
    far: { ...c.far, w: [c.far.w[0] + 2.5 * sw, c.far.w[1] + 4 * bob] },
    near: { ...c.near, w: [c.near.w[0] - 3 * sw, c.near.w[1] + 4.2 * bob] },
    footFar: [-12 + F.x, F.y],
    footNear: [8 + N.x, N.y],
    liftFar: F.lift,
    liftNear: N.lift,
    brow: 0.5,
    mouth: -0.25,
    hem: -3.5 * bob - 2,
    club: c.club + 1.8 * sw,
    shield: c.shield + 1.5 * sw,
  };
};

// ---------------------------------------------------------------------------
// WHAT A VARIANT ADDS (figure units, drawn in the Warrior's own frame)
// ---------------------------------------------------------------------------
const OUT = { stroke: DARK, strokeWidth: 2.2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const Pf = (p: P2) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
/** a feather: from `a`, `len` long toward `deg` (0 = screen right, -90 = up), `w` wide */
const Feather: React.FC<{ a: P2; deg: number; len: number; w: number; deep?: boolean }> = ({ a, deg, len, w, deep }) => {
  const r = (deg * Math.PI) / 180;
  const d: P2 = [Math.cos(r), Math.sin(r)];
  const n: P2 = [-d[1], d[0]];
  const at = (t: number, s: number): P2 => [a[0] + d[0] * len * t + n[0] * w * s, a[1] + d[1] * len * t + n[1] * w * s];
  return (
    <>
      <path d={`M${Pf(a)}Q${Pf(at(0.45, 0.62))} ${Pf(at(1, 0))}Q${Pf(at(0.45, -0.62))} ${Pf(a)}Z`} fill={deep ? CREAM.deep : CREAM.main} {...OUT} strokeWidth={1.9} />
      <path d={`M${Pf(a)}L${Pf(at(0.86, 0))}`} fill="none" stroke={DARK} strokeWidth={0.9} strokeOpacity={0.6} />
    </>
  );
};
const Shaft: React.FC<{ a: P2; b: P2 }> = ({ a, b }) => (
  <>
    <path d={`M${Pf(a)}L${Pf(b)}`} fill="none" stroke={DARK} strokeWidth={6.4} strokeLinecap="round" />
    <path d={`M${Pf(a)}L${Pf(b)}`} fill="none" stroke={CREAM.deep} strokeWidth={3} strokeLinecap="round" />
  </>
);
const Point: React.FC<{ b: P2; len: number; w: number }> = ({ b, len, w }) => (
  <path d={`M${Pf([b[0] - w, b[1] + 2])}Q${Pf([b[0] - w * 0.9, b[1] - len * 0.5])} ${Pf([b[0] + 1, b[1] - len])}Q${Pf([b[0] + w * 1.1, b[1] - len * 0.5])} ${Pf([b[0] + w, b[1] + 2])}Z`} fill="#070605" stroke={CREAM.main} strokeWidth={2.2} strokeLinejoin="round" />
);
/** behind the figure */
const Behind: React.FC<{ v: number; pose: WarPose }> = ({ v, pose }) => {
  const r = warRig(pose);
  const c = CARRY[v];
  const g = r.far.grip;
  if (c.spear === 1) {
    // one tall spear, upright in the shield hand, behind the shield: a long obsidian point, a tuft under it
    const a: P2 = [g[0] - 2, g[1] + 96];
    const b: P2 = [g[0] + 5, g[1] - 196];
    return (
      <>
        <path d={`M${Pf(a)}L${Pf(b)}`} fill="none" stroke={DARK} strokeWidth={8} strokeLinecap="round" />
        <path d={`M${Pf(a)}L${Pf(b)}`} fill="none" stroke={CREAM.main} strokeWidth={4.2} strokeLinecap="round" />
        <Feather a={[b[0] - 1, b[1] + 6]} deg={118} len={26} w={10} deep />
        <Feather a={[b[0] + 1, b[1] + 6]} deg={62} len={24} w={10} />
        <Point b={b} len={40} w={8} />
      </>
    );
  }
  if (c.spear === 2) {
    // three darts carried upright in the shield hand, behind the shield
    return (
      <>
        {[-7, 0, 7].map((dx, i) => {
          const a: P2 = [g[0] + dx - 3, g[1] + 62];
          const b: P2 = [g[0] + dx * 1.7 + 4, g[1] - 160 - 9 * (i % 2)];
          return (
            <g key={i}>
              <Shaft a={a} b={b} />
              <Point b={b} len={24} w={5.5} />
            </g>
          );
        })}
      </>
    );
  }
  if (v === 3) {
    // a bow slung on the back
    const a = r.toFig([-30, -168]);
    const b = r.toFig([-26, 26]);
    const m = r.toFig([-78, -70]);
    return (
      <>
        <path d={`M${Pf(a)}L${Pf(b)}`} fill="none" stroke={DARK} strokeWidth={1.6} strokeOpacity={0.8} />
        <path d={`M${Pf(a)}Q${Pf(m)} ${Pf(b)}`} fill="none" stroke={DARK} strokeWidth={8.4} strokeLinecap="round" />
        <path d={`M${Pf(a)}Q${Pf(m)} ${Pf(b)}`} fill="none" stroke={CREAM.main} strokeWidth={4.6} strokeLinecap="round" />
      </>
    );
  }
  if (v === 1 || v === 5) {
    // a crest of long feathers rising behind the topknot
    const t = r.topknot;
    return (
      <>
        {v === 1 ? <Feather a={[t[0] - 2, t[1] + 12]} deg={-128} len={62} w={15} deep /> : null}
        <Feather a={[t[0], t[1] + 10]} deg={-106} len={v === 1 ? 74 : 58} w={16} />
        <Feather a={[t[0] + 2, t[1] + 12]} deg={-84} len={v === 1 ? 60 : 50} w={15} deep />
      </>
    );
  }
  return null;
};
/** the shield's painted field, laid over the drawing's own (inside its bound rim): shield-local, its middle at (0, 0) */
const SHIELD_RX = 39 * 0.8 * 0.8;
const SHIELD_RY = 39 * 0.8;
const Paint: React.FC<{ kind: 1 | 2; uid: string }> = ({ kind, uid }) => (
  <>
    <clipPath id={`${uid}-pt`}>
      <ellipse cx={0} cy={0} rx={SHIELD_RX} ry={SHIELD_RY} />
    </clipPath>
    <ellipse cx={0} cy={0} rx={SHIELD_RX} ry={SHIELD_RY} fill={CREAM.main} stroke={DARK} strokeWidth={1.6} />
    <g clipPath={`url(#${uid}-pt)`}>
      {kind === 1 ? (
        <>
          {/* half dark: a stepped division, the lower field in deep ink */}
          <path d={`M-40,-2L-9,-2L-9,9L9,9L9,-2L40,-2L40,44L-40,44Z`} fill="#5E533D" stroke={DARK} strokeWidth={2.2} strokeLinejoin="round" />
          <circle cx={0} cy={-15} r={6} fill="#5E533D" stroke={DARK} strokeWidth={1.8} />
        </>
      ) : (
        <>
          {/* a dark ring and a boss */}
          <ellipse cx={0} cy={0} rx={SHIELD_RX * 0.66} ry={SHIELD_RY * 0.66} fill="none" stroke="#3F3729" strokeWidth={8} />
          <ellipse cx={0} cy={0} rx={5.4} ry={6.6} fill="#3F3729" stroke={DARK} strokeWidth={1.6} />
        </>
      )}
    </g>
  </>
);
/** over the figure */
const Over: React.FC<{ v: number; pose: WarPose; uid: string }> = ({ v, pose, uid }) => {
  const r = warRig(pose);
  const c = CARRY[v];
  const t = r.topknot;
  return (
    <>
      {c.paint ? (
        <g transform={`translate(${r.far.grip[0].toFixed(2)} ${r.far.grip[1].toFixed(2)}) rotate(${pose.shield.toFixed(2)})`}>
          <Paint kind={c.paint} uid={uid} />
        </g>
      ) : null}
      {v === 4 ? (
        <>
          <Feather a={[t[0] - 5, t[1] + 16]} deg={-112} len={40} w={12} />
          <Feather a={[t[0] + 3, t[1] + 16]} deg={-78} len={36} w={11} deep />
        </>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// THE SPRITES: variant x walk frame -> one SVG image
// ---------------------------------------------------------------------------
/** the sprite's box in figure units and the feet's place in it */
const BOX = { w: 420, h: 470, ax: 210, ay: 440 };
const spriteMarkup = (v: number, ph: number) => {
  const pose = warWalk(v, ph / WAR_CYCLE);
  return renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={BOX.w} height={BOX.h} viewBox={`0 0 ${BOX.w} ${BOX.h}`}>
      {/* mirrored: he faces and walks to screen LEFT */}
      <g transform={`translate(${BOX.ax} ${BOX.ay}) scale(-1 1)`}>
        <Behind v={v} pose={pose} />
        <Warrior pose={pose} at={[0, 0]} scale={1} uid={`w${v}-${ph}`} />
        <Over v={v} pose={pose} uid={`w${v}-${ph}`} />
      </g>
    </svg>,
  );
};
type Sprites = HTMLImageElement[][];
let SPRITES: Sprites | null = null;
let LOADING: Promise<Sprites> | null = null;
const loadSprites = (): Promise<Sprites> => {
  if (LOADING) return LOADING;
  const jobs: Promise<HTMLImageElement>[] = [];
  for (let v = 0; v < N_VARIANTS; v++)
    for (let ph = 0; ph < WAR_CYCLE; ph++) {
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(spriteMarkup(v, ph))}`;
      jobs.push(img.decode().then(() => img));
    }
  LOADING = Promise.all(jobs).then((all) => {
    SPRITES = Array.from({ length: N_VARIANTS }, (_, v) => all.slice(v * WAR_CYCLE, (v + 1) * WAR_CYCLE));
    return SPRITES;
  });
  return LOADING;
};
/** holds the render until every sprite image is decoded */
export const useSprites = () => {
  const [ready, setReady] = useState(SPRITES !== null);
  const [handle] = useState(() => delayRender("OverwhelmingNumbers: the warriors' sprites"));
  useEffect(() => {
    loadSprites()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);
  return ready;
};

// ---------------------------------------------------------------------------
// THE HOST: rows of warriors round the Spanish knot
// ---------------------------------------------------------------------------
const ROW_PITCH = 1.45;
const COL_PITCH = 0.9;
/** the lanes of page before and behind the knot's own row (the rows beyond start this much further off) */
const FRONT_LANE = 0.7;
const BACK_LANE = 1.05;
const rowY = (r: number) => (r > 0 ? r * ROW_PITCH + BACK_LANE : r < 0 ? r * ROW_PITCH - FRONT_LANE : 0);
/** the Spaniards' second row */
export const SP_BACK_Y = rowY(1);
/** a warrior: x, y metres; v variant; off walk-frame offset; s height factor; tone 0..3 (0 = full); layer 0 = behind the knot */
export type Man = { x: number; y: number; v: number; off: number; s: number; tone: number; layer: 0 | 1 };
/** the tones of the rows further back: the cream sunk this far toward the page */
const TONE_SINK = [0, 0.15, 0.28, 0.4];
const N_TONES = TONE_SINK.length;
/** round the knot: per row, the x span left to the Spaniards and to the air before and behind the horse [left, right] */
const CLEAR: Record<number, [number, number]> = { 0: [-4.15, 4.25], 1: [-3.95, 4.05], [-1]: [-2.0, 2.5] };
export const MEN: Man[] = (() => {
  const out: Man[] = [];
  let i = 0;
  for (let r = 11; r >= -11; r--) {
    const y0 = rowY(r);
    const shift = (hash(r, 11) - 0.5) * COL_PITCH;
    const rowOff = Math.floor(hash(r, 12) * 6) * 4;
    for (let c = -12; c <= 12; c++) {
      i++;
      const x = c * COL_PITCH + shift + (hash(i, 13) - 0.5) * 0.2;
      const clear = CLEAR[r];
      if (clear && x > clear[0] && x < clear[1]) continue;
      // the row's line wanders a little; each man a hair off it
      const y = y0 + 0.08 * Math.sin(x * 0.55 + r * 1.7) + (hash(i, 14) - 0.5) * 0.12;
      // in step by row; one man in six a step out
      const off = (rowOff + (hash(i, 15) < 0.16 ? 12 : 0)) % WAR_CYCLE;
      out.push({ x, y, v: Math.floor(hash(i, 17) * N_VARIANTS), off, s: 0.93 + 0.12 * hash(i, 18), tone: r >= 5 ? 3 : r >= 3 ? 2 : r >= 1 ? 1 : 0, layer: r >= 1 ? 0 : 1 });
    }
  }
  // back to front
  return out.sort((a, b) => b.y - a.y);
})();

/** one layer of the host on a canvas */
export const Host: React.FC<{ view: View; frame: number; layer: 0 | 1; ready: boolean }> = ({ view, frame, layer, ready }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const cache = useRef(new Map<number, HTMLCanvasElement>());
  useLayoutEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    ctx.clearRect(0, 0, FRAME_W, FRAME_H);
    if (!ready || !SPRITES) return;
    /** px per figure unit for a man of height factor 1 */
    const su = view.S * UC;
    // every sprite is rasterised for the tallest man and scaled down a few % for the others
    const rs = su * 1.05;
    const sw = Math.ceil(BOX.w * rs);
    const sh = Math.ceil(BOX.h * rs);
    const used = new Set<number>();
    const spriteFor = (v: number, ph: number, tone: number) => {
      const key = (v * WAR_CYCLE + ph) * N_TONES + tone;
      let c = cache.current.get(key);
      if (!c) {
        c = document.createElement("canvas");
        cache.current.set(key, c);
      }
      if (!used.has(key)) {
        used.add(key);
        c.width = sw;
        c.height = sh;
        const x = c.getContext("2d");
        if (x) {
          x.imageSmoothingQuality = "high";
          x.drawImage((SPRITES as Sprites)[v][ph], 0, 0, sw, sh);
          if (tone > 0) {
            x.globalCompositeOperation = "source-atop";
            x.globalAlpha = TONE_SINK[tone];
            x.fillStyle = LAND;
            x.fillRect(0, 0, sw, sh);
          }
        }
      }
      return c;
    };
    ctx.imageSmoothingQuality = "high";
    const fi = Math.round(frame);
    for (const m of MEN) {
      if (m.layer !== layer) continue;
      const [sx, sy] = toScreen(view, m.x, m.y);
      const k = m.s / 1.05;
      const w = sw * k;
      const h = sh * k;
      const x0 = sx - BOX.ax * rs * k;
      const y0 = sy - BOX.ay * rs * k;
      if (x0 > FRAME_W || y0 > FRAME_H || x0 + w < 0 || y0 + h < 0) continue;
      const ph = (((fi + m.off) % WAR_CYCLE) + WAR_CYCLE) % WAR_CYCLE;
      ctx.drawImage(spriteFor(m.v, ph, m.tone), x0, y0, w, h);
    }
  });
  return <canvas ref={ref} width={FRAME_W} height={FRAME_H} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />;
};

// ---------------------------------------------------------------------------
// THE SPANISH KNOT (live SVG): hero cm, the ground under the saddle at (0, 0),
// y DOWN (steelHorsesShared's frame)
// ---------------------------------------------------------------------------
const horsePhase = (f: number) => (f + 6) / HORSE_CYCLE;
const horseBob = (f: number) => 1.1 * Math.cos(4 * Math.PI * horsePhase(f));
/** the rider of SteelAndHorses: seated, the reins in his near hand, the sword carried up before him */
const RIDE: ConqPose = {
  ...CONQ_IDLE,
  farElbow: undefined,
  headYaw: -0.98,
  pitch: 3,
  lean: -9,
  near: { w: [-26, -166], elbow: [1, 0.3], fist: 0.9, hand: 12 },
  footNear: [-49, -27],
  footFar: [-7, -27],
  brow: 0.6,
  mouth: -0.2,
};
const DY = SADDLE_Y + 157;
const riderAt = (f: number) => {
  const o: P2 = [1, SADDLE_Y + horseBob(f) + 152 * UC];
  const base: ConqPose = { ...RIDE, lean: RIDE.lean + 0.6 * Math.sin(f / 15), roll: 0.5 * Math.sin(f / 17) };
  const S = conqRig(base).far.S;
  // at rest: the fist before his chest (hero cm), the blade carried upright, tipped a little forward
  const fist: P2 = [-37 + 0.8 * Math.sin(f / 13), -171 + DY + horseBob(f) * 0.8];
  const a = 74 + 1.6 * Math.sin(f / 11 + 1);
  const pose: ConqPose = { ...base, far: holdAt(S, [(fist[0] - o[0]) / UC, (fist[1] - o[1]) / UC], CONQ_K, [0.2, 1], 0, 1) };
  const r = conqRig(pose);
  return { o, pose, grip: r.far.grip, dirDeg: 180 + a, rein: [o[0] + r.near.grip[0] * UC, o[1] + r.near.grip[1] * UC] as P2 };
};

// ---- the men on foot: cut A's conquistador, walking to screen left (the way he faces)
/** phase p (0..1 per two steps) */
const conqWalk = (p: number, seed: number): ConqPose => {
  const leg = (u0: number) => {
    const u = frac(u0);
    if (u < 0.5) {
      const t = u / 0.5;
      const peel = ease(Math.max(0, (t - 0.62) / 0.38));
      return { x: -WAR_STRIDE * (0.5 - t), y: -9 * peel, lift: -(30 * peel - 12 * Math.max(0, 1 - t / 0.14)) };
    }
    const t = (u - 0.5) / 0.5;
    return { x: -WAR_STRIDE * (-0.5 + ease(t)), y: -22 * Math.sin(Math.PI * t) - 9 * (1 - t) * (1 - t), lift: -(30 * (1 - ease(Math.min(1, t * 1.6))) - 12 * ease(Math.max(0, (t - 0.45) / 0.55))) };
  };
  const F = leg(p);
  const N = leg(p + 0.5);
  const sw = Math.sin(2 * Math.PI * (p + 0.1));
  const bob = Math.cos(4 * Math.PI * p);
  return {
    ...CONQ_IDLE,
    headYaw: -0.95 - 0.1 * hash(seed, 1),
    pitch: -1,
    roll: 0.6 * sw,
    lean: -6 - 0.5 * bob,
    crouch: 3 + 3.4 * bob,
    // the pike hand before the chest; the other swings by the hilt
    far: { w: [-30, -176 + 4 * bob], elbow: [-0.4, 1], fist: 1, hand: 0 },
    farElbow: undefined,
    near: { w: [26 + 7 * sw, -148 + 3 * bob], elbow: [1, 0.3], fist: 0.9, hand: 16 },
    footFar: [14 + F.x, F.y],
    footNear: [-12 + N.x, N.y],
    liftFar: F.lift,
    liftNear: N.lift,
    brow: 0.45,
    mouth: -0.1,
  };
};
/** the pike: an ash shaft through the far fist, sloped back over the shoulder, a steel head (orange) and a butt spike. Figure units. */
const Pike: React.FC<{ grip: P2; tilt: number }> = ({ grip, tilt }) => {
  const r = ((-90 + 9 + tilt) * Math.PI) / 180;
  const d: P2 = [Math.cos(r), Math.sin(r)];
  const n: P2 = [-d[1], d[0]];
  const at = (t: number, s = 0): P2 => [grip[0] + d[0] * t + n[0] * s, grip[1] + d[1] * t + n[1] * s];
  return (
    <>
      <path d={`M${Pf(at(-150))}L${Pf(at(292))}`} fill="none" stroke={DARK} strokeWidth={8.4} strokeLinecap="round" />
      <path d={`M${Pf(at(-150))}L${Pf(at(292))}`} fill="none" stroke={CREAM.deep} strokeWidth={4.4} strokeLinecap="round" />
      <path d={`M${Pf(at(286, -7.5))}Q${Pf(at(312, -8.5))} ${Pf(at(344))}Q${Pf(at(312, 8.5))} ${Pf(at(286, 7.5))}Z`} fill={ORANGE.main} stroke={DARK} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={`M${Pf(at(290))}L${Pf(at(336))}`} fill="none" stroke={DARK} strokeWidth={1} strokeOpacity={0.6} />
      <path d={`M${Pf(at(278, -5.5))}L${Pf(at(288, -5.5))}L${Pf(at(288, 5.5))}L${Pf(at(278, 5.5))}Z`} fill={ORANGE.deep} stroke={DARK} strokeWidth={1.8} strokeLinejoin="round" />
    </>
  );
};
/** x metres, the row (0 = the horse's ground line, 1 = the row behind), walk-frame offset, the pike's tilt, height factor */
const FOOT: { x: number; row: 0 | 1; off: number; tilt: number; s: number }[] = [
  { x: -3.05, row: 1, off: 0, tilt: 3, s: 0.99 },
  { x: -1.95, row: 1, off: 0, tilt: -2, s: 1.03 },
  { x: 1.95, row: 1, off: 0, tilt: 4, s: 1.0 },
  { x: 3.05, row: 1, off: 0, tilt: -3, s: 0.97 },
  { x: -3.2, row: 0, off: 12, tilt: -1, s: 1.01 },
  { x: -2.05, row: 0, off: 12, tilt: 4, s: 0.98 },
  { x: 2.0, row: 0, off: 12, tilt: -3, s: 1.02 },
  { x: 3.15, row: 0, off: 12, tilt: 2, s: 0.99 },
];
export const SpanishKnot: React.FC<{ view: View; frame: number }> = ({ view, frame }) => {
  const { S, g } = view;
  const pen = mkPen(S);
  const rd = riderAt(frame);
  const U = S * UC;
  const scr = (p: P2): P2 => [g[0] + p[0] * S, g[1] + p[1] * S];
  const foot = (m: (typeof FOOT)[number], i: number) => {
    const p = toScreen(view, m.x, m.row ? SP_BACK_Y : 0);
    const pose = conqWalk((frame + m.off) / WAR_CYCLE + 0.02 * i, i);
    const rg = conqRig(pose);
    const scab = SCAB_REST + 5 + 3 * Math.sin((2 * Math.PI * (frame + m.off)) / WAR_CYCLE);
    const u = U * m.s;
    return (
      <g key={i}>
        <g transform={`translate(${p[0].toFixed(2)} ${p[1].toFixed(2)}) scale(${u.toFixed(5)})`}>
          <Pike grip={rg.far.grip} tilt={m.tilt} />
        </g>
        <Conquistador pose={pose} at={p} scale={u} uid={`on-f${i}`} sword={swordInScabbard(rg.mouth, scab, 0)} scab={scab} steel={{ lead: null, all: true }} sheathed />
      </g>
    );
  };
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      {FOOT.map((m, i) => (m.row === 1 ? foot(m, i) : null))}
      {FOOT.map((m, i) => (m.row === 0 ? foot(m, i) : null))}
      <g transform={`translate(${g[0].toFixed(2)} ${g[1].toFixed(2)}) scale(${S.toFixed(5)})`}>
        <HorseRider pen={pen} phase={horsePhase(frame)} uid="on-hero" rider={false} reinTo={rd.rein} />
      </g>
      <Conquistador pose={rd.pose} at={scr(rd.o)} scale={U} uid="on-c" sword={{ g: rd.grip, dir: rd.dirDeg }} scab={SCAB_REST + 6} steel={{ lead: null, all: true }} sheathed={false} />
    </svg>
  );
};

/** review sheet: the six warrior variants (two walk frames each) and a man on foot, large */
export const OverwhelmingCastSheet: React.FC = () => {
  const U = 1.25;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, backgroundColor: LAND }}>
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}>
        {Array.from({ length: N_VARIANTS }, (_, v) =>
          [0, 9].map((ph, j) => {
            const pose = warWalk(v, ph / WAR_CYCLE);
            return (
              <g key={`${v}-${j}`} transform={`translate(${200 + (v % 3) * 340 + j * 150} ${560 + Math.floor(v / 3) * 600}) scale(${-U} ${U})`}>
                <Behind v={v} pose={pose} />
                <Warrior pose={pose} at={[0, 0]} scale={1} uid={`cs${v}-${j}`} />
                <Over v={v} pose={pose} uid={`cs${v}-${j}`} />
              </g>
            );
          }),
        )}
        {[0, 6, 12].map((ph, j) => {
          const pose = conqWalk(ph / WAR_CYCLE, j);
          const rg = conqRig(pose);
          const at: P2 = [240 + j * 300, 1840];
          return (
            <g key={`c${j}`}>
              <g transform={`translate(${at[0]} ${at[1]}) scale(${U})`}>
                <Pike grip={rg.far.grip} tilt={0} />
              </g>
              <Conquistador pose={pose} at={at} scale={U} uid={`csf${j}`} sword={swordInScabbard(rg.mouth, SCAB_REST + 5, 0)} scab={SCAB_REST + 5} steel={{ lead: null, all: true }} sheathed />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
