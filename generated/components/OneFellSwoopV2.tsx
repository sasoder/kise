// ---------------------------------------------------------------------------
// OneFellSwoopV2: graphic 3 of 3 of the clip "Sheppard: centralized empires
// fell fast" (Dwarkesh with Si Sheppard), EXTENDED. Dwarkesh map style; a real
// map. 1080x1920, 24 fps, opaque.
//
// LINE (sequence 44.336-57.391 s): "...meant that the Spanish couldn't take
// out the Maya in one fell swoop. They couldn't do to the Maya what they'd done
// to the Aztecs. They had to reduce their cities one by one. And that was a
// long, laborious process that took almost to the end of the 17th century to
// finally consummate."
// DURATION = round(13.055 s x 24) = 313 frames, no tail (the edit fixes it).
//
// f0-f141 ARE OneFellSwoop (V1 R1) frame for frame: this file imports V1's
// camera, clocks and strokes and repeats its scene (gestures 0-4: see V1's
// header). The Aztec collapse front simply runs on and is done by ~f145.
//
// CLIP RULE: ORANGE = THE ONE AT THE TOP, the head of a polity. The Spaniards'
// strokes and the year are neutral cream. MECHANISM of the new part: time
// becomes a number. The Maya lights go out ONE AT A TIME, each by its own small
// stroke, while a year readout counts; then the count has to run on for a
// century and a half while the last two lights in the Peten keep burning.
//
// NEW GESTURES (the only ones), word onset -> frame
//   5. "They had to reduce their cities" f141-172: ONE eased glide back east
//      and in to the Maya world (f141 -> f176, k 1.06 -> ~1.7, still easing in
//      afterwards); the fallen Aztec tree leaves to the left; the city struck
//      at f71 stays out. THE YEAR slides up f160-172 over the open Gulf
//      (screen-anchored, IM Fell English roman, 120 px): 1524.
//   6. "one / by / one" f175 / f185 / f190 -> "long, laborious process" f240:
//      the cities fall singly, in order. Each fall = a SHORT swoop (the same
//      tapering stroke at 10 px, ~84 px, 7 frames, from the side the Spaniards
//      came from), the head emptying to the dashed ring over 8 f, its links
//      drooping a rung (V1's struck state, no ring, no flash). Landings f173,
//      f183, f188, then every 2-4 frames to f240 (20 falls); the year steps to
//      each fall's year with a 4-frame roll of only the digits that change.
//      The camera drifts up from the highlands through Yucatan, one move.
//   7. "that took almost to the end of the 17th century" f240-285: two lights
//      left (Itza / Nojpeten, Lakandon Ch'ol / Sac Balam). ONE slow push in on
//      the Peten (to k 2.6) while the year ROLLS 1544 -> 1695 (f242 -> f275, a
//      true odometer, its wheels blurred by their speed, easing in and out; "17th" f272).
//      On 1695 one short stroke takes Sac Balam (lands f277).
//   8. "to finally consummate" f291 / f299: the year turns 1695 -> 1696 -> 1697
//      (f283 -> f292) and the last stroke, full weight like the first, lands on
//      Nojpeten at f296: the last orange head empties f296-306 (with the
//      first stroke's ripple). f306-313: the creep goes on, the trail gone, the
//      year holds 1697, the map dark of orange for the first time.
//
// FACTS OF RECORD (the readout is a displayed fact)
//   Q'umarkaj burned March 1524 (K'iche'); Zaculeu surrendered October 1525
//   (Mam); Mixco Viejo taken 1525 (Poqomam); Mazariegos's conquest of highland
//   Chiapas 1528 (Zinacantan; it had first submitted in 1524); the Kaqchikel
//   surrendered 1530; Davila's entrada reached Acalan 1530; Merida founded on
//   T'ho January 1542; the Xiu of Mani submitted 1542; the Uaymil-Chetumal
//   campaign 1544; Sac Balam taken 1695; Nojpeten fell 13 March 1697 (the last
//   independent Maya kingdom).
//   APPROXIMATE: the years of the individual Yucatan provinces are approximate
//   submission dates within Montejo's 1540-46 campaign (several rose again in
//   1546); Rabinal 1537 is the start of the Dominicans' peaceful entry into
//   Tezulutlan (Verapaz), not a conquest date; Cozumel (not in the director's
//   list; it is drawn, so it must fall) is put with Ecab at 1544. The city
//   struck at f71 (the first stroke's "one city") stays out and is skipped;
//   Tz'utujil is not drawn (dropped for room in V1).
//   Stroke directions are gestures from the side the Spaniards came from
//   (highlands: from the west, Alvarado out of Soconusco; Yucatan: from the
//   Campeche side; Uaymil-Chetumal: from the north), not routes.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FRONT_V, SWOOP_1, SWOOP_2, T, cameraAt as cameraV1, swoopAt } from "./OneFellSwoop";
import {
  AZTEC_NODES,
  DARK,
  Dot,
  EmpireHatch,
  Head,
  INK,
  INK_CONTEXT,
  INK_FULL,
  MAYA_POLITIES,
  MapLabel,
  MapPage,
  Ripple,
  SEA,
  Swoop,
  TENOCHTITLAN,
  TreeLink,
  WorldSvg,
  breath,
  camFor,
  clamp01,
  fell,
  hash,
  labelSlide,
  linkPoint,
  makeSwoop,
  project,
  screenOf,
  sizeAt,
  smoothstep,
  swayCam,
  swoopShapeOf,
  worldOf,
  type Cam,
  type P2,
  type SwoopPath,
} from "./mayaShared";
import { pchip } from "./incaShared";

export const FPS = 24;
export const DURATION = 313; // round(13.055 s x 24)

export const schema = z.object({
  vignette: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---------------------------------------------------------------------------
// V1's constants (repeated: V1 does not export them)
// ---------------------------------------------------------------------------
const HEAD_OUT = 10;
const RIPPLE_F = 12;
const RIPPLE_PX = 34;
const FRONT_SOFT = 6;
const STRUCK = MAYA_POLITIES.findIndex((p) => p.name === "Chanputun");
const AZ_LINKS = AZTEC_NODES.map((n, i) => ({
  a: (n.parent < 0 ? TENOCHTITLAN : [AZTEC_NODES[n.parent].x, AZTEC_NODES[n.parent].y]) as P2,
  b: [n.x, n.y] as P2,
  bow: (i % 2 ? 1 : -1) * (0.05 + 0.05 * hash(i, 5)),
}));
const AZ_LINK_W = 3;
const distTen = (p: P2) => Math.hypot(p[0] - TENOCHTITLAN[0], p[1] - TENOCHTITLAN[1]);
const LABEL_MAYA = project(-90.35, 17.36);
const LABEL_AZTECS = project(-98.55, 22.55);
const mixCam = (a: Cam, b: Cam, g: number): Cam => {
  const k = Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * g);
  const w = Math.abs(a.k - b.k) < 1e-6 ? g : (1 / k - 1 / a.k) / (1 / b.k - 1 / a.k);
  return { k, cx: a.cx + (b.cx - a.cx) * w, cy: a.cy + (b.cy - a.cy) * w };
};

// ---------------------------------------------------------------------------
// Timing of the new part
// ---------------------------------------------------------------------------
export const T2 = {
  back: [141, 176] as [number, number], // the glide back to the Maya
  readout: 160,
  roll: [242, 275] as [number, number], // 1544 -> 1695
  sacBalam: 277,
  turn: [
    [283, 287, 1696],
    [288, 292, 1697],
  ] as [number, number, number][],
  last: [280, 296] as [number, number], // the full-weight stroke on Nojpeten
};
const FALL_OUT = 8; // frames: a head empties
const SHORT_F = 7; // frames: a short stroke
const SHORT_PX = 84; // its length on screen
const SHORT_W = 10; // its head (screen px)
const STEP_F = 4; // frames: a year step's roll

// ---------------------------------------------------------------------------
// THE FALLS: polity, landing frame, year, the side the stroke comes from
// (degrees on the page: 180 = from the west, 270 = from the north, 90 = from
// the south)
// ---------------------------------------------------------------------------
const FALL_LIST: [string, number, number, number][] = [
  ["K'iche'", 173, 1524, 212],
  ["Mam", 183, 1525, 238],
  ["Poqomam", 188, 1525, 196],
  ["Tzotzil", 192, 1528, 248],
  ["Kaqchikel", 195, 1530, 178],
  ["Acalan", 198, 1530, 214],
  ["Rabinal", 201, 1537, 192],
  ["Can Pech", 204, 1541, 118],
  ["Ah Canul", 208, 1541, 104],
  ["Ceh Pech", 211, 1542, 152],
  ["Ah Kin Chel", 213, 1542, 168],
  ["Tutul Xiu", 216, 1542, 138],
  ["Sotuta", 220, 1542, 172],
  ["Cupul", 223, 1543, 190],
  ["Chikinchel", 226, 1543, 158],
  ["Ecab", 228, 1544, 184],
  ["Cozumel", 231, 1544, 206],
  ["Cochuah", 235, 1544, 148],
  ["Uaymil", 238, 1544, 268],
  ["Chetumal", 240, 1544, 286],
  ["Lakandon Ch'ol", T2.sacBalam, 1695, 122],
];
const ITZA = MAYA_POLITIES.findIndex((p) => p.name === "Itza");
const ITZA_P: P2 = [MAYA_POLITIES[ITZA].x, MAYA_POLITIES[ITZA].y];
const SACBALAM = MAYA_POLITIES.findIndex((p) => p.name === "Lakandon Ch'ol");

// ---------------------------------------------------------------------------
// The camera: V1's to f141; then ONE blend into the Maya track W(f), a pchip
// through four framings (each key: a world point at a screen point at zoom k)
// that never rests: the whole Maya world, low (the highlands in play) ->
// drifted up through Yucatan -> the push in on the two Peten lights.
// ---------------------------------------------------------------------------
const MID_PETEN: P2 = (() => {
  const a = MAYA_POLITIES[ITZA];
  const b = MAYA_POLITIES[SACBALAM];
  return [(a.x + b.x) / 2, (a.y + b.y) / 2] as P2;
})();
type WKey = { f: number; k: number; p: P2; sx: number; sy: number };
const W_KEYS: WKey[] = [
  { f: 141, k: 1.62, p: project(-89.9, 17.5), sx: 590, sy: 742 },
  { f: 176, k: 1.72, p: project(-89.9, 17.6), sx: 585, sy: 738 },
  { f: 240, k: 1.86, p: project(-89.9, 18.45), sx: 580, sy: 765 },
  { f: 285, k: 2.6, p: MID_PETEN, sx: 690, sy: 870 },
  { f: 313, k: 2.68, p: MID_PETEN, sx: 690, sy: 870 },
];
const W_LK = pchip(W_KEYS.map((q) => [q.f, Math.log(q.k)] as [number, number]));
const W_CX = pchip(W_KEYS.map((q) => [q.f, camFor(q.p, q.k, q.sx, q.sy).cx] as [number, number]));
const W_CY = pchip(W_KEYS.map((q) => [q.f, camFor(q.p, q.k, q.sx, q.sy).cy] as [number, number]));
const camW = (f: number): Cam => ({ k: Math.exp(W_LK(f)), cx: W_CX(f), cy: W_CY(f) });
export const cameraAt = (f: number): Cam => {
  if (f <= T2.back[0]) return cameraV1(f);
  const g = smoothstep((f - T2.back[0]) / (T2.back[1] - T2.back[0]));
  return g >= 1 ? camW(f) : mixCam(cameraV1(f), camW(f), g);
};

// ---------------------------------------------------------------------------
// The strokes of the new part: V1's ONE shape, short
// ---------------------------------------------------------------------------
// V1's shape (its first stroke's cubic: the same two control points)
const S1_PTS = SWOOP_1.pts;
const SHAPE = swoopShapeOf(S1_PTS[0], project(-88.3, 21.6), project(-90.8, 21.0), S1_PTS[S1_PTS.length - 1]);
const SHAPE_RATIO = SWOOP_1.len / Math.hypot(S1_PTS[S1_PTS.length - 1][0] - S1_PTS[0][0], S1_PTS[S1_PTS.length - 1][1] - S1_PTS[0][1]);
export type Fall = { idx: number; name: string; land: number; year: number; path: SwoopPath; p: P2 };
export const FALLS: Fall[] = FALL_LIST.map(([name, land, year, deg]) => {
  const idx = MAYA_POLITIES.findIndex((p) => p.name === name);
  if (idx < 0) throw new Error(`no polity ${name}`);
  const p: P2 = [MAYA_POLITIES[idx].x, MAYA_POLITIES[idx].y];
  const chord = SHORT_PX / cameraAt(land).k / SHAPE_RATIO;
  const a = (deg * Math.PI) / 180;
  return { idx, name, land, year, p, path: makeSwoop([p[0] + Math.cos(a) * chord, p[1] - Math.sin(a) * chord], p, SHAPE) };
});
// the last stroke: full weight, entering at screen (320, 765) of its first frame (clear of the MAYA label)
export const SWOOP_LAST = makeSwoop(worldOf([320, 765], cameraAt(T2.last[0])), ITZA_P, SHAPE);
/** each polity's landing frame (Infinity = never) */
const LAND: number[] = MAYA_POLITIES.map((_, i) => {
  if (i === STRUCK) return T.swoop1[1];
  if (i === ITZA) return T2.last[1];
  const fl = FALLS.find((q) => q.idx === i);
  return fl ? fl.land : Infinity;
});
const shortAt = (f: number, land: number, len: number) => {
  const f0 = land - SHORT_F;
  const t = clamp01((f - f0) / SHORT_F);
  const head = len * (0.5 * t + 0.5 * smoothstep(t));
  const tl = 0.8 * len;
  const after = clamp01((f - land) / 6);
  const tail = f <= land ? Math.max(0, head - tl) : len - tl * (1 - smoothstep(after));
  const opacity = f < f0 ? 0 : 1 - smoothstep((f - land - 1) / 5);
  return { head, tail, opacity };
};

// ---------------------------------------------------------------------------
// THE YEAR: a real-valued clock and its odometer
// ---------------------------------------------------------------------------
type Seg = { f0: number; f1: number; to: number };
const YEAR_0 = 1524;
const SEGS: Seg[] = (() => {
  const out: Seg[] = [];
  let y = YEAR_0;
  for (const fl of FALLS) {
    if (fl.year === y || fl.year > 1600) continue;
    out.push({ f0: fl.land - 1, f1: fl.land - 1 + STEP_F, to: fl.year });
    y = fl.year;
  }
  out.push({ f0: T2.roll[0], f1: T2.roll[1], to: 1695 });
  for (const [f0, f1, to] of T2.turn) out.push({ f0, f1, to });
  return out;
})();
export const yearAt = (f: number) => {
  let y = YEAR_0;
  for (const s of SEGS) {
    if (f <= s.f0) break;
    if (f >= s.f1) {
      y = s.to;
      continue;
    }
    y = y + (s.to - y) * smoothstep((f - s.f0) / (s.f1 - s.f0));
    break;
  }
  return y;
};
/** the four columns' positions (units first), a true odometer: a digit d shows
 *  at position d; the units wheel turns with the year; each higher wheel turns
 *  only while the wheel below it runs from 9 to 0 */
export const columnsAt = (f: number) => {
  const y = yearAt(f);
  const pos: number[] = [((y % 10) + 10) % 10];
  for (let i = 1; i < 4; i++) pos.push((Math.floor(y / Math.pow(10, i) + 1e-9) % 10) + clamp01(pos[i - 1] - 9));
  return pos;
};
const READ_SIZE = 120;
const READ_X = 330; // the readout's centre
const READ_TOP = 296;
const CELL_W = 0.5 * READ_SIZE;
const CELL_H = 1.2 * READ_SIZE;
const SHUTTER = 0.35; // frames
const BLUR_N = 3;
const BLUR_MAX = 42; // px: the vertical blur of a wheel at full run
const COPY_A = 1 - Math.pow(1 - INK_FULL, 1 / BLUR_N);
const Readout: React.FC<{ frame: number }> = ({ frame }) => {
  const sl = labelSlide(frame, T2.readout, 12, 9);
  if (sl.op <= 0.002) return null;
  // one slow drift up-left through the Peten push: the coast comes up under the readout
  const drift = smoothstep((frame - T2.roll[0]) / (285 - T2.roll[0]));
  const dX = -30 * drift;
  const dY = -34 * drift;
  const samples = Array.from({ length: BLUR_N }, (_, j) => columnsAt(frame + (j / (BLUR_N - 1) - 0.5) * SHUTTER));
  // each wheel's speed (px per frame) -> its vertical blur
  const pa = columnsAt(frame - 0.25);
  const pb = columnsAt(frame + 0.25);
  const sigma = pa.map((a, i) => {
    let d = Math.abs(pb[i] - a);
    if (d > 5) d = 10 - d;
    // a slow turn (a year in ~4 frames) stays crisp; the blur comes in above ~60 px per frame
    return Math.min(BLUR_MAX, 0.25 * Math.max(0, d * 2 * CELL_H - 60));
  });
  const glyph = (key: string, d: number, dy: number, halo: boolean) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: CELL_W,
        height: CELL_H,
        lineHeight: `${CELL_H}px`,
        textAlign: "center",
        fontFamily: fell,
        fontSize: READ_SIZE,
        transform: `translateY(${dy.toFixed(2)}px)`,
        color: halo ? "transparent" : INK,
        opacity: halo ? 0.5 / BLUR_N + 0.06 : COPY_A,
        WebkitTextStroke: halo ? `${READ_SIZE * 0.085}px ${SEA}` : undefined,
      }}
    >
      {d}
    </div>
  );
  const column = (c: number) => {
    const els: React.ReactNode[] = [];
    for (const halo of [true, false])
      samples.forEach((pos, j) => {
        const p = pos[c];
        const d = Math.floor(p + 1e-9);
        const fr = p - d;
        els.push(glyph(`${halo ? "h" : "f"}${j}a`, ((d % 10) + 10) % 10, -fr * CELL_H, halo));
        if (fr > 0.002) els.push(glyph(`${halo ? "h" : "f"}${j}b`, (d + 1) % 10, (1 - fr) * CELL_H, halo));
      });
    return els;
  };
  const fade = "linear-gradient(to bottom, transparent 0%, #000 13%, #000 87%, transparent 100%)";
  return (
    <div style={{ position: "absolute", left: READ_X - 2 * CELL_W + dX, top: READ_TOP + sl.dy + dY, width: 4 * CELL_W, height: CELL_H, opacity: sl.op }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          {sigma.map((sg, c) => (
            <filter key={c} id={`readBlur${c}`} x="-10%" y="-60%" width="120%" height="220%">
              <feGaussianBlur stdDeviation={`0 ${sg.toFixed(2)}`} />
            </filter>
          ))}
        </defs>
      </svg>
      {[3, 2, 1, 0].map((c, i) => (
        <div
          key={c}
          style={{
            position: "absolute",
            left: i * CELL_W - 12,
            top: 0,
            width: CELL_W + 24,
            height: CELL_H,
            overflow: "hidden",
            WebkitMaskImage: fade,
            maskImage: fade,
          }}
        >
          <div style={{ position: "absolute", left: 12, top: 0, width: CELL_W, height: CELL_H, filter: sigma[c] > 0.3 ? `url(#readBlur${c})` : undefined }}>
            {column(c)}
          </div>
        </div>
      ))}
    </div>
  );
};

const OneFellSwoopV2: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(cameraAt(frame), frame);
  const k = cam.k;

  // --- each Maya head: out (0..1) and the droop front of its little tree
  const state = MAYA_POLITIES.map((m, i) => {
    const land = LAND[i];
    if (frame < land) return { out: 0, passed: undefined as undefined | ((p: P2) => number), ring: 0, ringR: 0 };
    const big = i === STRUCK || i === ITZA;
    const rt = clamp01((frame - land) / RIPPLE_F);
    const rippleR = RIPPLE_PX * (1 - (1 - rt) * (1 - rt));
    const front = rt >= 1 ? 1e6 : rippleR / k;
    return {
      out: (frame - land) / (big ? HEAD_OUT : FALL_OUT),
      passed: (p: P2) => (front - Math.hypot(p[0] - m.x, p[1] - m.y)) / (FRONT_SOFT / k),
      ring: big ? 1 - smoothstep((rt - 0.5) / 0.5) : 0,
      ringR: rippleR,
    };
  });

  // --- the Aztec stroke lands (V1)
  const hit2 = T.swoop2[1];
  const out2 = (frame - hit2) / HEAD_OUT;
  const R = Math.max(0, frame - hit2) * FRONT_V;
  const passedAz = (p: P2) => (R <= 0 ? 0 : (R - distTen(p)) / (FRONT_SOFT / k));
  const ringNear = R <= 0 ? 0 : 1 - smoothstep((R * k - 22) / 16);
  const beadOp = smoothstep((R * k - 14) / 14);
  const aztecInView = screenOf([TENOCHTITLAN[0] + 260, TENOCHTITLAN[1]], cam)[0] > -40;

  const s1 = swoopAt(frame, T.swoop1, SWOOP_1.len);
  const s2 = swoopAt(frame, T.swoop2, SWOOP_2.len);
  const sL = swoopAt(frame, T2.last, SWOOP_LAST.len);

  const depR = sizeAt(3.0, k);
  const provR = sizeAt(6.7, k);
  const mayaR = sizeAt(7, k);
  const tenR = sizeAt(17.5, k);

  const beads: P2[] = [];
  if (beadOp > 0.01)
    for (const { a, b, bow } of AZ_LINKS) {
      if (R <= distTen(a) || R >= distTen(b)) continue;
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 14; i++) {
        const m = (lo + hi) / 2;
        if (distTen(linkPoint(a, b, bow, m)) < R) lo = m;
        else hi = m;
      }
      beads.push(linkPoint(a, b, bow, lo));
    }

  const mayaSize = 64 * Math.pow(k / 1.95, 0.37);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1B2226" }}>
      <MapPage cam={cam} vignette={vignette}>
        <WorldSvg cam={cam}>
          {/* THE AZTEC EMPIRE (V1) */}
          {aztecInView ? (
            <>
              <EmpireHatch cam={cam} sunk={R > 0 ? { r: R, to: 0.3 } : undefined} />
              {AZ_LINKS.map((l, i) => (
                <TreeLink key={`al${i}`} a={l.a} b={l.b} cam={cam} passed={passedAz} sag={9} width={AZ_LINK_W} bow={l.bow} />
              ))}
              {AZTEC_NODES.map((n, i) => (
                <Dot key={`an${i}`} x={n.x} y={n.y} cam={cam} r={provR} level={1 - clamp01(passedAz([n.x, n.y]))} />
              ))}
              {beads.map((p, i) => (
                <g key={`bd${i}`} opacity={beadOp}>
                  <circle cx={p[0]} cy={p[1]} r={6.6 / k} fill={DARK} fillOpacity={0.6} />
                  <circle cx={p[0]} cy={p[1]} r={4.6 / k} fill={INK} fillOpacity={INK_FULL} />
                </g>
              ))}
              <Head x={TENOCHTITLAN[0]} y={TENOCHTITLAN[1]} cam={cam} r={tenR} out={out2} breath={breath(frame, 99)} />
              {R > 0 && R < 330 ? (
                <Ripple x={TENOCHTITLAN[0]} y={TENOCHTITLAN[1]} cam={cam} r={R * k} opacity={1 - ringNear} rung={INK_CONTEXT} inEmpire />
              ) : null}
              <Ripple x={TENOCHTITLAN[0]} y={TENOCHTITLAN[1]} cam={cam} r={R * k} opacity={ringNear} />
            </>
          ) : null}

          {/* THE MAYA */}
          {MAYA_POLITIES.map((m, i) =>
            m.deps.map((d, j) => <TreeLink key={`ml${i}-${j}`} a={[m.x, m.y]} b={d as P2} cam={cam} passed={state[i].passed} sag={7} />),
          )}
          {MAYA_POLITIES.map((m, i) =>
            m.deps.map((d, j) => {
              const ps = state[i].passed;
              return <Dot key={`md${i}-${j}`} x={d[0]} y={d[1]} cam={cam} r={depR} level={ps ? 1 - clamp01(ps(d as P2)) : 1} />;
            }),
          )}
          {MAYA_POLITIES.map((m, i) => (
            <Head key={`mh${i}`} x={m.x} y={m.y} cam={cam} r={mayaR} out={state[i].out} breath={breath(frame, i + 1)} />
          ))}
          {MAYA_POLITIES.map((m, i) => (state[i].ring > 0 ? <Ripple key={`rp${i}`} x={m.x} y={m.y} cam={cam} r={state[i].ringR} opacity={state[i].ring} /> : null))}

          {/* THE STROKES: the two swoops of V1, the short ones, the last */}
          <Swoop path={SWOOP_1} cam={cam} head={s1.head} tail={s1.tail} opacity={s1.opacity} />
          <Swoop path={SWOOP_2} cam={cam} head={s2.head} tail={s2.tail} opacity={s2.opacity} />
          {FALLS.map((fl) => {
            if (frame < fl.land - SHORT_F || frame > fl.land + 7) return null;
            const s = shortAt(frame, fl.land, fl.path.len);
            return <Swoop key={`fs${fl.idx}`} path={fl.path} cam={cam} head={s.head} tail={s.tail} opacity={s.opacity} width={SHORT_W} />;
          })}
          <Swoop path={SWOOP_LAST} cam={cam} head={sL.head} tail={sL.tail} opacity={sL.opacity} />
        </WorldSvg>
        <MapLabel text="MAYA" x={LABEL_MAYA[0]} y={LABEL_MAYA[1]} cam={cam} frame={frame} f0={T.mayaLabel} size={mayaSize} spacing={0.34} />
        <MapLabel text="AZTECS" x={LABEL_AZTECS[0]} y={LABEL_AZTECS[1]} cam={cam} frame={frame} f0={T.aztecsLabel} size={56} spacing={0.3} />
        <Readout frame={frame} />
      </MapPage>
    </AbsoluteFill>
  );
};

export default OneFellSwoopV2;
