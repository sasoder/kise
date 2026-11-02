// ---------------------------------------------------------------------------
// CheaperFasterVersatile (pushp-trailer, cut 8). Core memory podcast style (styles/core-memory.md), real-photo world
// (notes/COMMON.md): Airbound's real sky and aircraft in colour, the show's ink on top. Opaque 1920x1080, 23.976 fps,
// 218 frames.
//
// CHECK LINE: "Airbound's real aircraft is out to beat most of logistics (80%) and nearly all human transport (90%) on
// cost, speed and versatility: the viewer sees those shares get claimed by the aircraft's own flight."
//
// THE LINE: "that are cheaper, faster, and more versatile than 80% of the entire logistics market and 90% of the human
// transportation market."
// WORD -> FRAME: cheaper 8 · faster 27 · and 40 · more 44 · versatile 48 · than 55 · 80 68 · % 77 · entire 101 ·
// logistics 109 · market 124 · and 135 · 90 144 · % 151 · human 176 · transportation 189 · market 200 · ends ~200-210.
// DURATION: the slot 8.634 -> 17.726 s = 9.092 s x 23.976 = 218 frames (f0..f217).
//
// THE MOTION: one long sky, the camera tracking right with the aircraft, easing up from f0 and down into the end. Three
// words rise behind the passing aircraft, each held fully in frame past its word on a slower pan, and slide off with the
// world (VERSATILE fully off by f80, the camera picking up from f52 into one curve); the aircraft flies under the letters
// so the hull covers no more than their bottom third on the landing frames, climbs
// onto pie one's rim and its own clockwise flight draws the wedge (contact f68, first wedge f69, 288 deg at f105), swinging
// wide of the rim on the lower-left arc so the wing stays off the digits, carries on over the open slice to pie two
// (contact f144, 324 deg at f178) and flies on past the sliver, clear of the crown, with both pies in shot. The numerals
// are print on the whole disc, settled by f72 and f148; the glyphs are uncovered by the wedge.
// CHAIN = what Airbound's aircraft outdoes: a small crown steps up from behind each finished wedge. The words use the
// show's sting by the brief.
//
// SOURCES: 80% and 90% are Naman Pushp's stated goal as spoken, not measured data; deliberately unsourced on screen.
// Plate and aircraft: Airbound's own photograph, airbound.co img-slide1-desktop (notes/hero_sources.txt; not a free
// licence). aircraft_palms_decon.png is aircraft_palms.png with the sky colour keyed and decontaminated
// (scripts/clips/pushp-trailer/clean-aircraft-matte.ts); sky_palms_healed.jpg is sky_palms_clean.jpg with the paint-out
// patch re-sampled from the same photo's cloud (scripts/clips/pushp-trailer/heal-sky-plate.ts). Glyphs: Lucide `package` and `user-round` geometry, made solid.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { camEase, clamp01, sway } from "../kits/dwarkesh/fieldShared";
import {
  BLACK,
  CHAIN,
  CROWN_STEP,
  EASE_LAND,
  INK,
  Inked,
  OP_LOW,
  SHADOW,
  SHADOW_OFF,
  runCamera2,
  textRise,
  type,
} from "../kits/core-memory/cerroShared";

export const FPS = 24000 / 1001;
export const DURATION = 218;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const W = 1920;
const H = 1080;
const LAST = DURATION - 1;

// -- beats (from the word table) ----------------------------------------------
const F_RIM1 = 68; // "80": the aircraft is on pie one's rim at 12 o'clock
const F_DONE1 = 105; // 288 deg, ahead of "logistics"
const F_LEAVE1 = 118; // creep ends, the run to pie two begins, so it is well under way on "and" (f135)
const F_RIM2 = 144; // "90"
const F_DONE2 = 178; // 324 deg, just after "human"
const DEG1 = 288;
const DEG2 = 324;

// -- world layout -------------------------------------------------------------
const PIE_R = 260;
const PIE_Y = 490;
const PIE1_X = 4510;
const PIE2_X = PIE1_X + 950;
const WORD_SIZE = 250; // cap height 175
const WORD_BASE = 424;
const WORDS = [
  { text: "CHEAPER", x: 932, start: 1, stagger: 1, travel: 18 }, // squeezed: its word is at f8, the cut starts at f0
  { text: "FASTER", x: 1945, start: 15, stagger: 2, travel: 22 },
  { text: "VERSATILE", x: 3065, start: 36, stagger: 2, travel: 22 },
];
const STING_RISE = 130;
// The aircraft's anchor inside the 760x400 cut-out (its body, not the image box) and its wings' share of the width.
const AC_W = 760;
const AC_H = 400;
const AC_ANCHOR_X = 365;
const AC_ANCHOR_Y = 190;
const AC_WING = 645 / 760;
const WING_BIG = 640;
const WING_RIM = 300;

// -- the camera: its own key track ---------------------------------------------
const WORD_SPEED = 43.5; // over the words, slow enough to read each one
const RUN_SPEED = 61; // from f52 into the sweep, carrying VERSATILE off the left
// The end of the camera's travel relative to the pies; the onward move is solved to land there.
const CAM_END_X = PIE1_X + 534;
// A speed profile integrated into a target, then the kit's damped follower. It never reads the aircraft.
const onwardShape = (f: number) => camEase((f - 100) / 18, 1) * (1 - camEase((f - 118) / 22, 1)); // before 3 o'clock
const speedAt = (f: number) => {
  const ramp = (a: number, b: number) => camEase((f - a) / (b - a), 1);
  const run = (WORD_SPEED + (RUN_SPEED - WORD_SPEED) * ramp(52, 64)) * ramp(0, 14) * (1 - ramp(70, 88));
  return 1.1 * (1 - 0.6 * ramp(140, 170)) + run;
};
const CAM_F: number[] = [];
const CAM_CX: number[] = [];
const CAM_CY: number[] = [];
const CAM_K: number[] = [];
{
  let base = W / 2;
  let shape = 0;
  for (let f = 0; f < DURATION; f++) {
    base += speedAt(f + 5);
    shape += onwardShape(f + 5);
  }
  const onwardSpeed = (CAM_END_X - base) / shape;
  let x = W / 2;
  for (let f = 0; f <= DURATION; f++) {
    CAM_F.push(f);
    CAM_CX.push(x);
    x += speedAt(f + 5) + onwardSpeed * onwardShape(f + 5); // the follower lags about five frames; lead it by that
    const inK = camEase((f - 60) / 24, 1);
    const outK = camEase((f - 102) / 44, 1);
    const k = 1 + 0.46 * inK - 0.41 * outK; // 1.0 on the words, 1.46 on pie one, 1.05 on the comparison
    CAM_K.push(k);
    CAM_CY.push(H / 2 + 14.5 * inK * (1 - outK) + 1.4 * outK); // pie one centre at screen y 450, the comparison at 486
  }
}
const CAM = Array.from({ length: DURATION + 1 }, (_, f) => runCamera2(f, CAM_F, CAM_CY, CAM_CX, CAM_K));

// -- the aircraft's flight: one C1 path, one table --------------------------------
const hermite = (u: number, a: number, va: number, b: number, vb: number, span: number) => {
  const t = u;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + t) * va * span + (-2 * t3 + 3 * t2) * b + (t3 - t2) * vb * span
  );
};
const rad = (d: number) => (d * Math.PI) / 180;
// The flight line: the rim, swinging wide on the lower-left arc so the wing stays off the numeral's digits.
const WIDE_ARC = 62;
const flightR = (deg: number) => {
  const d = ((deg % 360) + 360) % 360;
  return PIE_R + WIDE_ARC * camEase((d - 140) / 105, 1) * (1 - camEase((d - 285) / 35, 1));
};
const rimPos = (px: number, deg: number) => {
  const r = flightR(deg);
  return { x: px + r * Math.sin(rad(deg)), y: PIE_Y - r * Math.cos(rad(deg)) };
};
// Clockwise on the flight line, velocity in world px per frame for an angular speed in deg per frame.
const rimVel = (deg: number, w: number) => {
  const a = rimPos(0, deg - 0.5);
  const b = rimPos(0, deg + 0.5);
  return { x: (b.x - a.x) * w, y: (b.y - a.y) * w };
};
const W_IN = 10; // deg per frame on contact, about 45 px per frame
const W_OUT1 = 1.0; // the creep after the sweep eases
const W_OUT2 = 2.4;
const DEG_LEAVE1 = DEG1 + 22;

const F_FREE = 53; // tracking the camera until here, drawing ahead of it and under the words, then the climb to the rim
const trackX = (f: number) => CAM[f].cx - 130 + 680 * camEase(f / F_FREE, 1);
const trackY = (f: number) => 536 + 2 * camEase(f / F_FREE, 1);

type Pt = { x: number; y: number; deg1: number; deg2: number };
const FLIGHT: Pt[] = [];
{
  const freeEnd = { x: trackX(F_FREE), y: trackY(F_FREE) };
  const freeVel = { x: trackX(F_FREE) - trackX(F_FREE - 1), y: trackY(F_FREE) - trackY(F_FREE - 1) };
  const seg = (f: number, f0: number, f1: number, a: { x: number; y: number }, va: { x: number; y: number }, b: { x: number; y: number }, vb: { x: number; y: number }) => {
    const span = f1 - f0;
    const u = (f - f0) / span;
    return { x: hermite(u, a.x, va.x, b.x, vb.x, span), y: hermite(u, a.y, va.y, b.y, vb.y, span) };
  };
  const leave1 = rimPos(PIE1_X, DEG_LEAVE1);
  // Past the sliver: clear of the disc and crown from f198 on, then drifting up and right.
  const F_CLEAR = 198;
  const clear = { x: PIE2_X + 110, y: 122 };
  const clearVel = { x: 9.5, y: -1.2 };
  const end = { x: PIE2_X + 230, y: 118 };
  for (let f = 0; f <= DURATION; f++) {
    let p: { x: number; y: number };
    let deg1 = 0;
    let deg2 = 0;
    if (f <= F_FREE) {
      p = { x: trackX(f), y: trackY(f) };
    } else if (f < F_RIM1) {
      p = seg(f, F_FREE, F_RIM1, freeEnd, freeVel, rimPos(PIE1_X, 0), rimVel(0, W_IN));
    } else if (f < F_DONE1) {
      deg1 = hermite((f - F_RIM1) / (F_DONE1 - F_RIM1), 0, W_IN, DEG1, W_OUT1 * 2, F_DONE1 - F_RIM1);
      p = rimPos(PIE1_X, deg1);
    } else if (f < F_LEAVE1) {
      deg1 = hermite((f - F_DONE1) / (F_LEAVE1 - F_DONE1), DEG1, W_OUT1 * 2, DEG_LEAVE1, W_OUT1 * 1.2, F_LEAVE1 - F_DONE1);
      p = rimPos(PIE1_X, deg1);
    } else if (f < F_RIM2) {
      deg1 = DEG1;
      p = seg(f, F_LEAVE1, F_RIM2, leave1, rimVel(DEG_LEAVE1, W_OUT1 * 1.2), rimPos(PIE2_X, 0), rimVel(0, W_IN));
    } else if (f < F_DONE2) {
      deg1 = DEG1;
      deg2 = hermite((f - F_RIM2) / (F_DONE2 - F_RIM2), 0, W_IN, DEG2, W_OUT2, F_DONE2 - F_RIM2);
      p = rimPos(PIE2_X, deg2);
    } else {
      deg1 = DEG1;
      deg2 = DEG2;
      p =
        f < F_CLEAR
          ? seg(f, F_DONE2, F_CLEAR, rimPos(PIE2_X, DEG2), rimVel(DEG2, W_OUT2), clear, clearVel)
          : seg(f, F_CLEAR, DURATION, clear, clearVel, end, { x: 6, y: -0.6 });
    }
    FLIGHT.push({ x: p.x, y: p.y, deg1, deg2 });
  }
}
// The wedge is read off the aircraft's visible position (its angle round the disc), clamped at the share. Never a timer.
const angleRound = (x: number, y: number, px: number) => {
  const a = (Math.atan2(x - px, PIE_Y - y) * 180) / Math.PI;
  return a < 0 ? a + 360 : a;
};
const WEDGE1: number[] = [];
const WEDGE2: number[] = [];
{
  let w1 = 0;
  let w2 = 0;
  FLIGHT.forEach((p, f) => {
    if (f > F_RIM1 && f <= F_DONE1) w1 = Math.max(w1, Math.min(DEG1, angleRound(p.x, p.y, PIE1_X)));
    if (f >= F_DONE1) w1 = DEG1;
    if (f > F_RIM2 && f <= F_DONE2) w2 = Math.max(w2, Math.min(DEG2, angleRound(p.x, p.y, PIE2_X)));
    if (f >= F_DONE2) w2 = DEG2;
    WEDGE1.push(w1);
    WEDGE2.push(w2);
  });
}
// Roll: continuous, from horizontal velocity (averaged over seven frames), right wing down when moving right.
const VX = FLIGHT.map((p, f) => p.x - FLIGHT[Math.max(0, f - 1)].x);
VX[0] = VX[1];
const ROLL = FLIGHT.map((_, f) => {
  let sum = 0;
  let n = 0;
  for (let i = f - 3; i <= f + 3; i++) {
    sum += VX[Math.max(0, Math.min(DURATION, i))];
    n++;
  }
  return 15 * Math.tanh(sum / n / 62);
});
const WING_FAR = 240; // it keeps flying away past pie two
const WING = (f: number) =>
  WING_BIG + (WING_RIM - WING_BIG) * camEase((f - 46) / 26, 1) + (WING_FAR - WING_RIM) * camEase((f - 176) / 41, 1);

// -- the plate: a far layer. Its edges are computed here, so they can never show. ----------------------------------
const PLATE_SCALE = 1.04;
const PLATE_W = 3000 * PLATE_SCALE;
const PLATE_H = 1600 * PLATE_SCALE;
const PLATE_X0 = -8;
const PLATE_Y0 = -216; // palm crowns in the bottom third at f0
const PLATE_DRIFT = 0.08; // px per frame, the clouds' own slow move
// Solved so the whole budget is spent and the right edge lands 10 px past the frame on the last frame.
const PLATE_PARALLAX = (PLATE_W - W - 10 + PLATE_X0 - LAST * PLATE_DRIFT) / (CAM[LAST].cx - CAM[0].cx);
const plateAt = (frame: number) => {
  const c = CAM[frame];
  return {
    x: PLATE_X0 - (c.cx - CAM[0].cx) * PLATE_PARALLAX - frame * PLATE_DRIFT,
    y: PLATE_Y0 - (c.cy - CAM[0].cy) * PLATE_PARALLAX,
  };
};
{
  const endX = plateAt(LAST).x;
  if (endX + PLATE_W < W + 8) throw new Error(`plate's right edge shows at the end: ${endX + PLATE_W}`);
}

// -- drawing ------------------------------------------------------------------
const wedgePath = (px: number, deg: number) => {
  if (deg <= 0) return "";
  const endX = px + PIE_R * Math.sin(rad(deg));
  const endY = PIE_Y - PIE_R * Math.cos(rad(deg));
  const large = deg > 180 ? 1 : 0;
  return `M ${px} ${PIE_Y} L ${px} ${PIE_Y - PIE_R} A ${PIE_R} ${PIE_R} 0 ${large} 1 ${endX} ${endY} Z`;
};

const PackageGlyph: React.FC = () => (
  <g strokeLinecap="round" strokeLinejoin="round">
    <path
      d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
      fill={BLACK}
      stroke={BLACK}
      strokeWidth={2}
    />
    <path d="M12 21.6V12M3.6 7.2 12 12l8.4-4.8M7.5 4.27l9 5.15" fill="none" stroke={INK} strokeWidth={1.25} />
  </g>
);
const PersonGlyph: React.FC = () => (
  <g strokeLinecap="round" strokeLinejoin="round" fill={BLACK} stroke={BLACK} strokeWidth={2}>
    <circle cx={12} cy={8} r={5} />
    <path d="M20 21a8 8 0 0 0-16 0Z" />
  </g>
);

const NUM_DX = 20;
const NUM_BASE = 111;

const Pie: React.FC<{
  id: string;
  frame: number;
  px: number;
  wedge: number;
  doneAt: number;
  printAt: number;
  k: number;
  label: string;
  glyph: React.ReactNode;
}> = ({ id, frame, px, wedge, doneAt, printAt, k, label, glyph }) => {
  const d = wedgePath(px, wedge);
  const print = textRise(frame, printAt, k);
  const crown = (i: number) => {
    // A colour starts hidden exactly behind the wedge and steps out to its rung: nothing fades, nothing pops.
    const t = EASE_LAND(clamp01((frame - doneAt - i * 2) / 22));
    return -t * (CROWN_STEP - 2) * (3 - i);
  };
  return (
    <g>
      <circle cx={px} cy={PIE_Y} r={PIE_R} fill={INK} opacity={OP_LOW} />
      {frame >= doneAt
        ? CHAIN.map((c, i) => <path key={c} d={d} fill={c} transform={`translate(0 ${crown(i)})`} />)
        : null}
      {d ? <Inked render={(fill) => <path d={d} fill={fill} />} /> : null}
      {d ? (
        <>
          <defs>
            <clipPath id={id}>
              <path d={d} />
            </clipPath>
          </defs>
          {/* the glyph lives on the wedge, so the sweep uncovers it */}
          <g clipPath={`url(#${id})`}>
            <g transform={`translate(${px + 26} ${PIE_Y - 188}) scale(5.4)`}>{glyph}</g>
          </g>
        </>
      ) : null}
      {/* the numeral is print on the whole disc, settled as he says it; local coordinates, as Chrome misplaces <text> at
          very large x */}
      {print.opacity > 0 ? (
        <g transform={`translate(${px + NUM_DX} ${PIE_Y + NUM_BASE + print.dy})`} opacity={print.opacity}>
          <text x={0} y={0} textAnchor="middle" fill={BLACK} style={type(150, 900)}>
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
};

const StingWord: React.FC<{ frame: number; word: (typeof WORDS)[number]; offLeft: boolean }> = ({ frame, word, offLeft }) => {
  const { text, x, start, stagger, travel } = word;
  if (frame < start || offLeft) return null;
  const at = (s: number) => STING_RISE * (1 - EASE_LAND(clamp01((frame - s) / travel)));
  const coreStart = start + 3 * stagger;
  const coreDy = at(coreStart);
  const lastColourLand = start + 2 * stagger + travel;
  const node = (fill: string, dx: number, dy: number) => (
    <text x={dx} y={dy} textAnchor="middle" fill={fill} style={type(WORD_SIZE, 900)}>
      {text}
    </text>
  );
  return (
    <g transform={`translate(${x} ${WORD_BASE})`}>
      {frame >= coreStart ? node(SHADOW, SHADOW_OFF, SHADOW_OFF + coreDy) : null}
      {frame < lastColourLand + stagger
        ? CHAIN.map((c, i) => (frame >= start + i * stagger ? <g key={c}>{node(c, 0, at(start + i * stagger))}</g> : null))
        : null}
      {frame >= coreStart ? node(INK, 0, coreDy) : null}
    </g>
  );
};

const CheaperFasterVersatile: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = Math.max(0, Math.min(DURATION, frame));
  const { cx, cy, k } = CAM[f];
  const s = sway(frame);
  const tx = W / 2 - cx * k + s.dx;
  const ty = H / 2 - cy * k + s.dy;
  const plate = plateAt(f);
  const p = FLIGHT[f];
  const wing = WING(f);
  const acScale = wing / AC_WING / AC_W;
  // A very small hover, on top of the path, never read by the wedge.
  const bobY = 2.4 * Math.sin(frame / 8.5);
  const bobX = 1.2 * Math.sin(frame / 13);
  const acTransform = `translate(${p.x + bobX - AC_ANCHOR_X}px, ${p.y + bobY - AC_ANCHOR_Y}px) rotate(${ROLL[f]}deg) scale(${acScale})`;
  return (
    <AbsoluteFill style={{ backgroundColor: "#7E8CA4", overflow: "hidden" }}>
      <Img
        src={staticFile("pushp-trailer/sky_palms_healed.jpg")}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PLATE_W,
          height: PLATE_H,
          maxWidth: "none",
          transform: `translate(${plate.x + s.dx * 0.32}px, ${plate.y + s.dy * 0.32}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
        }}
      >
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {WORDS.map((w) => (
            <StingWord key={w.text} frame={frame} word={w} offLeft={tx + (w.x + 800) * k < 0} />
          ))}
          <Pie id="pie-one" frame={frame} px={PIE1_X} wedge={WEDGE1[f]} doneAt={F_DONE1} printAt={60} k={k} label="80%" glyph={<PackageGlyph />} />
          <Pie id="pie-two" frame={frame} px={PIE2_X} wedge={WEDGE2[f]} doneAt={F_DONE2} printAt={136} k={k} label="90%" glyph={<PersonGlyph />} />
        </svg>
        <Img
          src={staticFile("pushp-trailer/aircraft_palms_decon.png")}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: AC_W,
            height: AC_H,
            maxWidth: "none",
            transformOrigin: `${AC_ANCHOR_X}px ${AC_ANCHOR_Y}px`,
            transform: acTransform,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export default CheaperFasterVersatile;
