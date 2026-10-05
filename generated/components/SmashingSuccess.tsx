import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, clamp01, lerp, rectPath, smoothstep } from "./stoutShared";
import {
  DTS_LIGHT,
  DtsStage,
  F1Logo,
  FPS,
  NetflixLogo,
  ObjectShadow,
  Person,
  Screen,
  camJerk,
  dtsAmberBandP,
  dtsCameraTrackP,
  hash01,
  reachFrame,
  screenBox,
  toScreenP,
  toneAt,
  type LightPool,
} from "./dtsShared";

// ---------------------------------------------------------------------------
// SmashingSuccess — cut A of Toto Wolff's "why Drive to Survive worked" (Cheeky Pint S4E01), on the DTS
// world (dtsShared.tsx; briefs out/dts/briefs/BRIEF.md + BRIEF_9x16.md + the director's 9:16 pass-2 notes).
// Cheeky Pint S4 stout system, B1. 9:16, 1080x1920, 24 fps, opaque. Replaces the picture while the HOST speaks.
// (The approved 16:9 pass-2 source: out/dts/W/SmashingSuccess_16x9_pass2.tsx.txt.)
//
// THE LINE: "Drive to Survive has been a smashing success for Netflix and a big success for F1, where
// it's brought lots of new people into the sport."
// WINDOW: seq 0.000-7.040. DURATION = ceil(7.040 x 24) = ceil(168.96) = 169, no tail.
// ONSETS (f, ±2): drive 0 · to 4 · survive 8 · has 17 · been 22 · a 24 · smashing 28 · success 34 · for 44 ·
// netflix 48 · and 57 · a 68 · big 71 · success 73 · for 82 · f1 86 · where 98 · it's 102 · brought 108 ·
// lots 116 · of 123 · new 127 · people 132 · into 142 · the 153 · sport 157 · speech ends 164.
//
// ACCENT RULE: AMBER = Drive to Survive's light — the screen's face and whatever its light reaches. The light
// falls from the screen in one soft cone onto the ground; every walker is DARK until it walks into the pool's
// front there (+ a hashed 0-22 px), then crossfades DARK -> amber over 13 f and stays a fan. Logos are cream;
// the stand is board (context).
//
// ONE MOTION: people walk in from both sides into the show's light and gather in it; the F1 grandstand rises
// out of the ground in the light between them, and they climb into it.
//
// THE COLUMN (world = screen px at rest, centred on x 540): NETFLIX (y 305-363) over THE SCREEN (760 wide =
// 70 %, y 391-839); its light falls in a soft cone onto ONE ground line (y 1320, the bust bottoms) and pools
// there; the F1 mark (y 867-931) between the screen and the stand; the stand (three terraced board tiers of
// 96, 436 wide at the foot, base on the ground line) rises out of a slot at x 540. People 88 px. Everyone moves
// horizontally on the ground line or straight up. No ramps, no diagonals.
//
// GESTURES (gesture -> word -> frames)
//   1. THE SCREEN already on, its light falling in a soft cone to the ground and pooling there; the camera
//      holds (a slow creep, k 1.0 -> 1.012) -> "Drive to Survive" -> f0-169
//   2. DARK people already walking in from BOTH frame edges along the ground toward the centre, three depth
//      lanes (each fan keeps its own; no two visible busts share > 21 %); each crossfades to amber as it
//      enters the light's front (the first on f9, "survive"); they gather in the light in a queue on each
//      side of the centre (five each), the stream thickening through "smashing success" -> f0-60
//   3. NETFLIX rises into place over the screen (blur-in + 24 px slide-up, f30-44), lands f44 -> "netflix" f48
//   4. a 2 px slot opens in the ground at the centre (f54-62) and the F1 GRANDSTAND RISES out of it inside the
//      light (one eased rise, decelerating, f62-84): three terraced board tiers, slot joints, one union shadow
//      -> "a big success" -> f54-84
//   5. the F1 mark rises as the stand's headline, centred between screen and stand (f67-81), lands f81, the
//      light passing behind it -> "f1" f86
//   6. from f78 each queue's front fan in turn (every 8 f, a 3 f breath between rows, the sides 2 f apart)
//      walks in behind the stand to beneath its seat and rises STRAIGHT up into it in ONE eased lift (12 f,
//      soft start, long deceleration, no bounce, one elevation up, settling); it sits IN its tier, its
//      shoulders on the tier's top lip; each queue steps up as its front leaves. Front row first, from the
//      outside in: row 1 lands f104-122 ("brought lots of"), row 2 f124-141 ("new people"), row 3 f144-161
//      ("into the sport"). FULL for the last 8 f -> "brought lots of new people into the sport" -> f78-161
//   7. more fans keep arriving (briskly now, each as a place opens) and gather at the back of the queues,
//      beside the stand; the stream is still walking in at the end -> f69-169
// Resolved frame: NETFLIX over the lit screen, F1 between, the full amber stand in the light on the ground
// line, the gathered fans on both sides of it. Nothing else. CLICK: none (a group arrival).
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = 169;
const P = 88; // the person size (k ~1.0: 88 px >= 72)
const CX = 540;
/** the screen's bottom (y): NETFLIX + THE SCREEN above, the F1 mark and the stand below */
const SCREEN_BOTTOM = 839;

// -- the column ----------------------------------------------------------------------------------------------
const SCR_W = 760;
const SB0 = screenBox(0, 0, SCR_W);
const SCR_Y = SCREEN_BOTTOM - SB0.outer.h / 2;
const SCR = { x: CX, y: SCR_Y, w: SCR_W } as const;
const SB = screenBox(SCR.x, SCR.y, SCR.w);
/** THE GROUND LINE: lane-0 bust bottoms (the front lane); the back lanes stand 23 / 46 px behind (higher) */
export const GROUND_Y = 1320;
const LANES = [0, -27, -54];

// -- the light: one soft cone from the screen's bottom to the ground, and its pool there ------------------
const POOL: LightPool = { cx: CX, cy: GROUND_Y - 28, rx: 480, ry: 90 };
/** the pool's fronts (where a walker is reached): each walker a hashed 0-22 px inside */
export const FRONT_L = 110;
const FRONT_SPAN = 22;

// -- the stand: three terraced board tiers (front = tier 0, lowest) rising out of a slot at x 540 ------------
const T = 96; // tier height
const TIERS = 3;
const tierTop = (r: number) => GROUND_Y - T * (r + 1);
const TIER_HW = [218, 206, 194]; // half widths (each tier holds its row with 24 px to spare)
const STAND_H = T * TIERS;
/** the stand's rise out of its slot: below the ground until f62, eased up to rest on f84 (decelerating) */
const SLOT_IN = [54, 62] as const;
const RISE = [62, 84] as const;
const riseDy = (f: number) => STAND_H * Math.pow(1 - clamp01((f - RISE[0]) / (RISE[1] - RISE[0])), 2.4);
/** 12 seats: row r on tier r, its fans' SHOULDERS on the tier's top (they sit IN the tier); fill order: the
 *  front row first, from the outside in, the two sides alternating */
const SEAT_DX = [
  [150, 50],
  [138, 46],
  [126, 42],
];
/** a seated fan: its whole shoulder dome above the tier's top (it sits behind the tier's lip), the lowest 12 %
 *  of the bust hidden by the tier */
const SEAT_SINK = 0.12;
const seatBottom = (r: number) => tierTop(r) + SEAT_SINK * P;
type Seat = { row: number; x: number; side: 0 | 1 };
export const SEATS: Seat[] = [0, 1, 2].flatMap((r) =>
  [0, 1].flatMap((j) => [0, 1].map((side) => ({ row: r, side: side as 0 | 1, x: side === 0 ? CX - SEAT_DX[r][j] : CX + SEAT_DX[r][j] }))),
);
const LIFT_F = 12;
/** the departures from each queue's front: from f78 (the stand up), every 8 f, +3 f between rows, the right side
 *  2 f behind the left; the walk in averages 12 px/f */
const DEP0 = 78;
const DEP_STEP = 8;
const DEP_ROW = 3;
const DEP_SIDE = 2;
const WALK_V = 12;

// -- the walkers ---------------------------------------------------------------------------------------------
// Two mirrored streams (side 0 from the left, side 1 from the right). A walker walks in at V0 along the lane of
// its queue spot and stops there on one deceleration (STOP_D); the queue's spots run outward from beside the
// stand (spot n at x 300 - 30 n on the left; each fan in its own lane, the lanes in turn by arrival); when the front fan leaves, the queue steps up one
// spot (SHUF_F). The front fan walks in behind the stand to beneath its seat (one eased walk) and lifts.
const V0 = 6; // the opening stream strolls in
const V_LATE = 8; // the fans who come once the stand has appeared walk briskly
const LATE_Q = 5; // from this queue place on
const STOP_D = 60;
const SPOT_X0 = CX - TIER_HW[0] - P / 2 - 4; // beside the stand (274)
const SPOT_DX = 35;
/** the queue's last spot (x 134 on the left: inside the light and the side margin) */
const SPOT_MAX = 4;
const SHUF_F = 7;
const sideX = (side: 0 | 1, x: number) => (side === 0 ? x : 2 * CX - x);
/** each fan keeps its own depth lane (by its order in the queue), so a queue step moves x only and neighbours
 *  never cross */
const laneY = (q: number) => GROUND_Y + LANES[q % 3];
/** entry times per side (when the walker is at x -40, just off frame): the first three are already in frame at
 *  f0 and the stream thickens through "smashing success" (five per side fill the queue); each later fan enters
 *  only as the queue's front leaves (so it never walks up to a spot past the queue's last), and the stream is
 *  still walking in at the end */
const ENTRIES: number[][] = [
  [-17, -9, -2, 5, 11, 71, 79, 90, 98, 109, 117, 160],
  [-15, -7, 0, 7, 13, 74, 82, 93, 101, 112, 120, 163],
];
type Walker = {
  i: number;
  side: 0 | 1;
  q: number; // its order in its side's queue
  tEntry: number;
  off: number;
  reach: number;
  seat: Seat | null;
  depart: number; // when it leaves the queue's front for its seat (Infinity: it stays)
  stopF: number; // when it stops beneath its seat
};
/** the departure times of the fans ahead of each walker (filled with WALKERS) */
const DEPS_AHEAD: number[][] = [];
/** the walker's queue index at frame f (continuous: it steps up as the fans ahead leave) */
const idxAt = (w: { i: number; q: number }, f: number) => w.q - departCount(DEPS_AHEAD[w.i] ?? [], f);
/** the departures of a side's queue front (seat fans only), and its smooth count up to frame f */
const departCount = (deps: number[], f: number) => deps.reduce((a, d) => a + smoothstep((f - d) / SHUF_F), 0);
export const WALKERS: Walker[] = (() => {
  const out: Walker[] = [];
  // the seat fans, in fill order: seat k goes to its side's next fan (FIFO)
  const perSide: Seat[][] = [[], []];
  SEATS.forEach((s) => perSide[s.side].push(s));
  let n = 0;
  ([0, 1] as const).forEach((side) => {
    ENTRIES[side].forEach((tEntry, q) => {
      const seat = q < perSide[side].length ? perSide[side][q] : null;
      // the queue's front leaves every DEP_STEP f (a breath between rows; the right side a beat behind), once the
      // stand is up; the walk in to beneath the seat is one smooth ease, its length by distance
      const depart = seat ? DEP0 + side * DEP_SIDE + DEP_STEP * q + DEP_ROW * Math.floor(q / 2) : Infinity;
      const dist = seat ? Math.abs(seat.x - sideX(side, SPOT_X0)) : 0;
      const stopF = seat ? depart + 4 + dist / WALK_V : Infinity;
      out.push({ i: n++, side, q, tEntry, off: FRONT_SPAN * hash01(n, 1), reach: 0, seat, depart, stopF });
    });
  });
  // each walker's queue steps up when a fan ahead of it (same side, FIFO) leaves for its seat
  out.forEach((w) => {
    DEPS_AHEAD[w.i] = out.filter((v) => v.side === w.side && v.q < w.q && Number.isFinite(v.depart)).map((v) => v.depart);
  });
  for (const w of out) w.reach = reachFrame((f) => sideX(w.side, walkerAt(w, f).x) - (FRONT_L + w.off), -120, DURATION + 40, 1);
  return out;
})();
/** the constant deceleration into a stop at xs (C1) */
function stopped(x: number, xs: number) {
  if (x <= xs - STOP_D) return x;
  const q = Math.min(1, (x - (xs - STOP_D)) / (2 * STOP_D));
  return xs - STOP_D + STOP_D * (1 - (1 - q) * (1 - q));
}
function liftEase(u: number) {
  return smoothstep(Math.pow(clamp01(u), 0.72));
}
/** where walker w is at frame f (left-side coordinates mirrored for side 1): bottom-centre, its lift (0..1),
 *  its depth class (-1 = on the ground, behind the stand; r = in row r) and whether it is seated */
export function walkerAt(w: Walker, f: number): { x: number; y: number; lift: number; row: number; seated: boolean } {
  const xLin = -40 + (w.q >= LATE_Q ? V_LATE : V0) * (f - w.tEntry);
  if (!w.seat || f < w.depart) {
    const idx = Math.max(0, idxAt(w, f));
    const xs = SPOT_X0 - SPOT_DX * idx;
    return { x: sideX(w.side, stopped(xLin, xs)), y: laneY(w.q), lift: 0, row: -1, seated: false };
  }
  // the walk in: from spot 0 (where it stood at its departure) to beneath its seat
  const x0 = SPOT_X0;
  const x1 = w.side === 0 ? w.seat.x : 2 * CX - w.seat.x;
  const y0 = laneY(w.q);
  if (f <= w.stopF) {
    const u = smoothstep((f - w.depart) / (w.stopF - w.depart));
    return { x: sideX(w.side, lerp(x0, x1, u)), y: y0, lift: 0, row: -1, seated: false };
  }
  const u = (f - w.stopF) / LIFT_F;
  const lift = u >= 1 ? 0 : smoothstep(u / 0.3) * (1 - smoothstep((u - 0.55) / 0.45));
  return { x: w.seat.x, y: lerp(y0, seatBottom(w.seat.row), liftEase(u)), lift, row: w.seat.row, seated: u >= 1 };
}
export const landF = (w: Walker) => (w.seat ? w.stopF + LIFT_F : Infinity);

// -- the camera: a hold with a slow creep ----------------------------------------------------------------------
const LOOK = 835;
export const CAM = dtsCameraTrackP({ x: CX, y: LOOK, k: 1.0 }, [{ f0: 0, f1: DURATION + 10, k: 1.012 }], DURATION);
const camAt = (f: number) => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];

// -- the logos -----------------------------------------------------------------------------------------------
const NETFLIX_PX = 58;
const NETFLIX_GAP = 28;
const NETFLIX_IN = [30, 44] as const;
const F1_IN = [67, 81] as const;
const F1_PX = 64;
const F1_BOTTOM = tierTop(TIERS - 1) - (1 - SEAT_SINK) * P - 24; // over the top row's heads

// -- the light cone (cut-local: P's FallingLight language, widening as it falls) -------------------------------
const LightCone: React.FC<{ k: number }> = ({ k }) => {
  const uid = `lc${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const yt = SB.face.y + SB.face.h * 0.5;
  const yb = SB.bottom;
  const y1 = GROUND_Y + 30;
  const top = SB.face.w / 2 - 20;
  const bot = 500;
  const c = `rgb(${DTS_LIGHT.color})`;
  const at = (y: number) => clamp01((y - yt) / (y1 - yt)).toFixed(3);
  const blur = 26 / k;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${uid}v`} gradientUnits="userSpaceOnUse" x1="0" y1={yt} x2="0" y2={y1}>
          <stop offset="0" stopColor={c} stopOpacity="0" />
          <stop offset={at(yb)} stopColor={c} stopOpacity={0.3} />
          <stop offset={at(lerp(yb, y1, 0.6))} stopColor={c} stopOpacity={0.16} />
          <stop offset="1" stopColor={c} stopOpacity={0.06} />
        </linearGradient>
      </defs>
      <path
        d={`M${CX - top} ${yt}L${CX + top} ${yt}L${CX + bot} ${y1}L${CX - bot} ${y1}Z`}
        fill={`url(#${uid}v)`}
        style={{ filter: `blur(${blur.toFixed(2)}px)` }}
      />
    </g>
  );
};

// -- the grandstand: tiers as bands, drawn back to front with the rows between them ---------------------------
const bandPath = (r: number, dy: number) => rectPath(CX - TIER_HW[r], tierTop(r) + dy, 2 * TIER_HW[r], T + (r === 0 ? 0 : 0.5), r === TIERS - 1 ? 4 : 0, r === TIERS - 1, false);
const standOutline = (dy: number) => {
  const p: [number, number][] = [[CX - TIER_HW[0], GROUND_Y + dy]];
  for (let r = 0; r < TIERS; r++) {
    p.push([CX - TIER_HW[r], tierTop(r) + T + dy], [CX - TIER_HW[r], tierTop(r) + dy]);
  }
  for (let r = TIERS - 1; r >= 0; r--) {
    p.push([CX + TIER_HW[r], tierTop(r) + dy], [CX + TIER_HW[r], tierTop(r) + T + dy]);
  }
  p.push([CX + TIER_HW[0], GROUND_Y + dy]);
  return `M${p.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L")}Z`;
};
const StandShadow: React.FC<{ f: number; clip: string }> = ({ f, clip }) => {
  const dy = riseDy(f);
  if (dy >= STAND_H - 0.5) return null;
  return (
    <g clipPath={`url(#${clip})`}>
      <ObjectShadow paths={[standOutline(dy)]} size={260} contact={dy < 1 ? { x: CX, y: GROUND_Y, w: 2 * TIER_HW[0] } : null} />
    </g>
  );
};
const Band: React.FC<{ r: number; f: number; k: number; grad: string; clip: string }> = ({ r, f, k, grad, clip }) => {
  const dy = riseDy(f);
  if (dy >= STAND_H - 0.5) return null;
  const y = tierTop(r) + dy;
  const x0 = CX - TIER_HW[r];
  const w = 2 * TIER_HW[r];
  const lip = EDGE.SLOT_LIP / k;
  return (
    <g clipPath={`url(#${clip})`}>
      <path d={bandPath(r, dy)} fill={`url(#${grad})`} />
      {/* the joint with the tier above: it rises out of a slot in this tier's top (foot occlusion + slot line) */}
      {r < TIERS - 1 ? (
        <>
          <rect x={CX - TIER_HW[r + 1] - lip} y={y - EDGE.SLOT / k / 2} width={2 * TIER_HW[r + 1] + 2 * lip} height={EDGE.SLOT / k} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
        </>
      ) : null}
      {/* the lit top edge: the exposed treads at the ends (and the top tier's whole top) */}
      {r < TIERS - 1 ? (
        <g stroke={COLOR.edge} strokeOpacity={ALPHA.edgeBoard} strokeWidth={EDGE.CREAM / k}>
          <path d={`M${x0} ${y + EDGE.CREAM / k / 2}H${CX - TIER_HW[r + 1] - lip}`} />
          <path d={`M${CX + TIER_HW[r + 1] + lip} ${y + EDGE.CREAM / k / 2}H${x0 + w}`} />
        </g>
      ) : (
        <path d={`M${x0 + 4} ${y + EDGE.CREAM / k / 2}H${x0 + w - 4}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edgeBoard} strokeWidth={EDGE.CREAM / k} />
      )}
    </g>
  );
};

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const SmashingSuccess: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const uid = `ss${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const cam = camAt(f);
  const k = cam.k;
  const band = dtsAmberBandP(cam);
  const ps = WALKERS.map((w) => ({ w, ...walkerAt(w, f) })).filter((p) => p.x > -60 && p.x < 1140);
  const byRow = (row: number) => ps.filter((p) => p.row === row).sort((a, b) => a.y - b.y || a.w.i - b.w.i);
  const person = (p: (typeof ps)[number]) => <Person key={p.w.i} x={p.x} y={p.y} h={P} k={k} amber={toneAt(p.w.reach, f)} lift={p.lift} />;
  const slot = smoothstep((f - SLOT_IN[0]) / (SLOT_IN[1] - SLOT_IN[0]));
  const lip = EDGE.SLOT_LIP / k;
  return (
    <AbsoluteFill>
      <DtsStage orientation="portrait" S={f} cam={cam} rest={CAM[0]} pool={{ x: CX, y: lerp(GROUND_Y - 120, tierTop(1), smoothstep((f - 60) / 40)) }} lights={[POOL]}>
        <defs>
          <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={tierTop(TIERS - 1)} x2="0" y2={GROUND_Y}>
            <stop offset="0" stopColor={COLOR.board} />
            <stop offset="1" stopColor={COLOR.boardFoot} />
          </linearGradient>
          {/* the slot: the stand exists only above the ground line */}
          <clipPath id={`${uid}c`}>
            <rect x={CX - 400} y={GROUND_Y - 600} width={800} height={600} />
          </clipPath>
          <clipPath id={`${uid}s`}>
            <rect x={CX - 420} y={GROUND_Y - 600} width={840} height={640} />
          </clipPath>
        </defs>
        <LightCone k={k} />
        <Screen x={SCR.x} y={SCR.y} w={SCR.w} k={k} band={band} on={1} />
        <NetflixLogo x={SCR.x} y={SB.top - NETFLIX_GAP / k} k={k} px={NETFLIX_PX} enter={clamp01((f - NETFLIX_IN[0]) / (NETFLIX_IN[1] - NETFLIX_IN[0]))} />
        <F1Logo x={CX} y={F1_BOTTOM} k={k} px={F1_PX} enter={clamp01((f - F1_IN[0]) / (F1_IN[1] - F1_IN[0]))} />
        {/* the ground: everyone walking, queued or walking in (behind the stand) */}
        {byRow(-1).map(person)}
        {/* the slot in the ground (the stand's joint with the ground) */}
        {slot > 0.002 ? (
          <rect x={CX - TIER_HW[0] - lip} y={GROUND_Y - EDGE.SLOT / k / 2} width={2 * TIER_HW[0] + 2 * lip} height={EDGE.SLOT / k} fill={COLOR.inkDark} fillOpacity={ALPHA.slot * slot} />
        ) : null}
        <StandShadow f={f} clip={`${uid}s`} />
        {/* back to front: row 2, tier 2, row 1, tier 1, row 0, tier 0 (each tier hides its row's body) */}
        {byRow(2).map(person)}
        <Band r={2} f={f} k={k} grad={`${uid}g`} clip={`${uid}c`} />
        {byRow(1).map(person)}
        <Band r={1} f={f} k={k} grad={`${uid}g`} clip={`${uid}c`} />
        {byRow(0).map(person)}
        <Band r={0} f={f} k={k} grad={`${uid}g`} clip={`${uid}c`} />
      </DtsStage>
    </AbsoluteFill>
  );
};

export default SmashingSuccess;

// ---------------------------------------------------------------------------
// Load-time checks: the rules the cut rests on.
// ---------------------------------------------------------------------------
{
  const DIAG = (globalThis as { __DTS_DIAG__?: boolean }).__DTS_DIAG__ === true;
  const fail = (m: string) => {
    if (DIAG) console.log(`CHECK: ${m}`);
    else throw new Error(`SmashingSuccess: ${m}`);
  };
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) fail(`camera |dv| ${j.maxA.toFixed(2)} px/f^2 at f${j.at}`);
  if (NETFLIX_IN[1] !== 44 || F1_IN[1] !== 81) fail("the logo timings moved (NETFLIX f44, F1 f81)");
  // the seats: empty until the stand is up, front row first, FULL for the last >= 8 f
  const seatW = WALKERS.filter((w) => w.seat);
  const lands = seatW.map(landF);
  if (lands.length !== SEATS.length) fail(`${lands.length} fans for ${SEATS.length} seats`);
  if (Math.max(...lands) > DURATION - 8) fail(`the last seat lands on f${Math.max(...lands).toFixed(1)}`);
  for (const w of seatW) {
    if (w.depart < RISE[1] - 6) fail(`walker ${w.i} leaves the queue on f${w.depart.toFixed(1)}, before the stand is up`);
    // it must be standing at the queue's front when it leaves
    const p = walkerAt(w, w.depart - 0.01);
    if (Math.abs(p.x - sideX(w.side, SPOT_X0)) > 2) fail(`walker ${w.i} is not at the queue's front when it leaves (x ${p.x.toFixed(0)})`);
    if (w.reach > w.depart) fail(`walker ${w.i} reaches its seat unlit`);
  }
  const firstLit = Math.min(...WALKERS.map((w) => w.reach));
  if (firstLit > 12 || firstLit < 4) fail(`the first fan is lit on f${firstLit.toFixed(1)} (want f8-12)`);
  if (DIAG) console.log(`first lit f${firstLit.toFixed(1)}; departures ${seatW.map((w) => w.depart.toFixed(0)).join(" ")}; landings ${lands.map((v) => v.toFixed(0)).join(" ")}`);
  // every walker under 45 screen px/f; no fan arrives at a spot past the queue's last (SPOT_MAX: inside the light)
  for (let f = 1; f < DURATION; f++) {
    const c0 = camAt(f - 1);
    const c1 = camAt(f);
    for (const w of WALKERS) {
      const a = walkerAt(w, f - 1);
      const b = walkerAt(w, f);
      const sa = toScreenP(c0, a.x, a.y);
      const sb = toScreenP(c1, b.x, b.y);
      if (sb.x < -60 || sb.x > 1140) continue;
      const v = Math.hypot(sb.x - sa.x, sb.y - sa.y);
      if (v > 45) fail(`walker ${w.i} moves ${v.toFixed(1)} px on f${f}`);
      const idx = idxAt(w, f);
      if (b.row === -1 && idx > SPOT_MAX + 0.01 && sideX(w.side, b.x) > SPOT_X0 - SPOT_DX * idx - STOP_D) fail(`walker ${w.i} queues at spot ${idxAt(w, f).toFixed(1)} on f${f}`);
    }
  }
  // NO OVERLAPS (what is SEEN): two busts may share at most 25 % of a bust's area where both are visible, the
  // stand's tiers hiding whatever they are drawn in front of (ground walkers: the whole stand; a fan in row r:
  // tiers 0..r)
  const inBustUnit = (u0: number, v0: number) => {
    const u = u0 * 429 + 255.5;
    const v = v0 * 429 + 470;
    if ((u - 255.5) ** 2 + (v - 143) ** 2 <= 102 * 102) return true;
    if (v < 266 || v > 470) return false;
    let lb = 41;
    if (v <= 458) {
      let lo = 0;
      let hi = 1;
      for (let it = 0; it < 16; it++) {
        const t = (lo + hi) / 2;
        const vy = (1 - t) ** 3 * 458 + 3 * (1 - t) ** 2 * t * 352 + 3 * (1 - t) * t * t * 266 + t ** 3 * 266;
        if (vy > v) lo = t;
        else hi = t;
      }
      const t = (lo + hi) / 2;
      lb = (1 - t) ** 3 * 41 + 3 * (1 - t) ** 2 * t * 41 + 3 * (1 - t) * t * t * 126 + t ** 3 * 232;
    }
    return u >= lb && u <= 511 - lb;
  };
  const STEP = 3;
  const cells: [number, number][] = [];
  for (let y = -P + STEP / 2; y < 0; y += STEP) for (let x = -P / 2 + STEP / 2; x < P / 2; x += STEP) if (inBustUnit(x / P, y / P)) cells.push([x, y]);
  const occluded = (x: number, y: number, row: number, f: number) => {
    const dy = riseDy(f);
    for (let r = 0; r < TIERS; r++) {
      if (row >= 0 && r > row) continue;
      const y0 = tierTop(r) + dy;
      if (y >= Math.max(y0, -Infinity) && y <= Math.min(y0 + T, GROUND_Y) && Math.abs(x - CX) <= TIER_HW[r]) return true;
    }
    return false;
  };
  const inside = (px: number, py: number, x: number, y: number) => inBustUnit((x - px) / P, (y - py) / P);
  let worst = 0;
  let worstAt = "";
  for (let f = 0; f < DURATION; f += 1) {
    const ps = WALKERS.map((w) => ({ w, ...walkerAt(w, f) })).filter((p) => p.x > -40 && p.x < 1120);
    for (let a = 0; a < ps.length; a++)
      for (let b = a + 1; b < ps.length; b++) {
        const A = ps[a];
        const B = ps[b];
        if (Math.abs(A.x - B.x) >= P || Math.abs(A.y - B.y) >= P) continue;
        let n = 0;
        for (const [cx, cy] of cells) {
          const x = A.x + cx;
          const y = A.y + cy;
          if (!inside(B.x, B.y, x, y)) continue;
          if (occluded(x, y, A.row, f) || occluded(x, y, B.row, f)) continue;
          n++;
        }
        const o = n / cells.length;
        if (o > worst) {
          worst = o;
          worstAt = `walkers ${A.w.i} / ${B.w.i} on f${f}`;
        }
      }
  }
  if (worst > 0.25) fail(`visible busts overlap ${(worst * 100).toFixed(0)} % (${worstAt})`);
  if (DIAG) console.log(`worst visible overlap ${(worst * 100).toFixed(1)} % (${worstAt})`);
  // the seated sit IN their tier: shoulders on the tier top, the body hidden by it (tier height >= the body)
  if (T < (1 - SEAT_SINK) * P + 8) fail("a row's heads would rise above the tier behind it");
  // subject ink inside y 200-1400 (NETFLIX on top, the ground line at the bottom) and x 72-1008
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    const top = toScreenP(c, CX, SB.top).y - NETFLIX_GAP - NETFLIX_PX;
    const bot = toScreenP(c, CX, GROUND_Y).y;
    if (top < 200 || bot > 1400) fail(`ink spans y ${top.toFixed(0)}-${bot.toFixed(0)} on f${f}`);
  }
  {
    const c = camAt(DURATION - 1);
    if (P * c.k < 72) fail(`people are ${(P * c.k).toFixed(1)} px at the end`);
    if ((SCR_W * c.k) / 1080 < 0.6) fail("the screen is under 60 % of the width at the end");
    // the gathered and the seated (not the stream still walking in from the edges)
    const xs = WALKERS.filter((w) => w.seat || walkerAt(w, DURATION - 1).x === walkerAt(w, DURATION - 2).x)
      .map((w) => walkerAt(w, DURATION - 1))
      .map((p) => toScreenP(c, p.x, 0).x);
    const l = Math.min(...xs) - (P / 2) * c.k;
    const r = Math.max(...xs) + (P / 2) * c.k;
    if (l < 72 || r > 1008) fail(`the end frame's people span x ${l.toFixed(0)}-${r.toFixed(0)}`);
  }
}
