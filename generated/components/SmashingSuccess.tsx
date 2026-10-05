import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, clamp01, lerp, smoothstep } from "./stoutShared";
import {
  DTS,
  DtsStage,
  F1Logo,
  FPS,
  NetflixLogo,
  ObjectShadow,
  Person,
  Screen,
  camJerk,
  dtsAmberBand,
  dtsCameraTrack,
  hash01,
  reachFrame,
  screenBox,
  screenLight,
  toScreenL,
  toneAt,
} from "./dtsShared";

// ---------------------------------------------------------------------------
// SmashingSuccess — cut A of Toto Wolff's "why Drive to Survive worked" (Cheeky Pint S4E01), on the DTS
// world (dtsShared.tsx; brief out/dts/briefs/BRIEF.md). Cheeky Pint S4 stout system, palette B1.
// 1920x1080, 24 fps, opaque. Replaces the picture while the HOST speaks.
//
// THE LINE: "Drive to Survive has been a smashing success for Netflix and a big success for F1, where
// it's brought lots of new people into the sport."
// WINDOW: seq 0.000-7.040. DURATION = ceil(7.040 x 24) = ceil(168.96) = 169, no tail.
// ONSETS (f, ±2): drive 0 · to 4 · survive 8 · has 17 · been 22 · a 24 · smashing 28 · success 34 · for 44 ·
// netflix 48 · and 57 · a 68 · big 71 · success 73 · for 82 · f1 86 · where 98 · it's 102 · brought 108 ·
// lots 116 · of 123 · new 127 · people 132 · into 142 · the 153 · sport 157 · speech ends 164.
//
// ACCENT RULE: AMBER = Drive to Survive's light — the screen's face and whatever its light reaches. Every
// walker is DARK until it walks into the light's front (the pool's left edge + a hashed 0-22 px offset);
// then it crossfades DARK -> amber over 13 f and stays a fan. Logos are cream; the stand is board (context).
//
// ONE MOTION: a stream of passers-by walks through the show's light, turns amber, and flows on into the
// F1 grandstand; the camera follows the stream from the screen to the stand.
//
// GESTURES (gesture -> word -> frames)
//   1. THE SCREEN already on, left of centre (bezel 914 px = 48 % of the frame, k 1.27): the DTS title card on its
//      amber face; its light pool on the ground in front of it -> "Drive to Survive" -> f0-169
//   2. the stream: a loose single file of DARK people walking in from off-frame left, ~one every 7 f,
//      gliding on one path (hashed speed, no bob). Each crossfades to amber as it enters the light's front
//      (the first at f2.4, "drive") and, lit, quickens (9 -> 19 world px/f over 24 f: the show draws them
//      on to the sport; without it no fan could reach a stand that is off frame at f0 before the cut
//      ends) -> "Drive to Survive has been a smashing success" -> f0-169
//   3. NETFLIX rises into place over the screen (blur-in + 24 px slide-up, f30-44), lands f44 -> "netflix" f48
//   4. ONE camera glide right and out (k 1.29 -> 0.95, target f50-84; k 0.958 by f86) reveals the EMPTY
//      grandstand right of the screen: four terraced board tiers, slot joints, one union shadow; the
//      path leads to its foot -> "a big success for F1" -> f50-86
//   5. the F1 mark rises as the stand's headline (f67-81), lands f81 -> "f1" f86
//   6. the stand fills, 12 seats (3 rows of 4, the rows a third of a pitch apart): each of the earliest-lit
//      fans walks the ground path to beneath its seat, stops on one deceleration, and rises STRAIGHT up
//      into it in ONE eased lift (11 f, soft start, long deceleration, no bounce), lifting one elevation
//      and settling as it lands. Front row first: row 1 lands f102-107 ("where it's brought"), row 2
//      f133-135 ("new people"), row 3 f154-161 ("into the sport"); within a row the far seat first, so no
//      fan ever walks beneath one mid-lift; a 5 f breath in the stream before the back row's first fan.
//      FULL from f161 (the last 8 f) -> "brought lots of new people into the sport" -> f91-161
//   7. the stream THICKENS: from ~f30 the incoming people come three abreast (three depth lanes 18 px apart,
//      used in turn; no two busts share more than 23 % of a bust anywhere); the fans who cannot be seated
//      flow on and gather on the ground at the stand's foot, packed back along the path (f142-169)
//      -> "lots of new people" -> f30-169
//   8. the tail: a slow creep-in on screen + stand (k 0.958 -> 0.969) -> f86-169
//   The cream subject pool follows the stream from the screen to the stand (lagged).
//   CLICK: none. The stand filling is a group arrival (group arrivals never click).
// Resolved frame: NETFLIX over the glowing screen on the left, F1 over a FULL amber stand on the right, the
// stream still flowing between them and gathering at the stand's foot. Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = 169;
const P = DTS.PERSON_H;
const SCR = DTS.SCREEN;
const SB = screenBox(SCR.x, SCR.y, SCR.w);
const PATH_Y = DTS.PATH_Y;

// -- the light ---------------------------------------------------------------------------------------------
const LIGHT = screenLight(SCR.x, SCR.y, SCR.w);
/** the light's front for walkers: the face's left edge (each walker is reached a hashed 0-44 px inside it) */
export const FRONT_X = SB.face.x + 8;
const FRONT_SPAN = 22;

// -- the grandstand (world px) -----------------------------------------------------------------------------
export const STAND = { SL: 870, SR: 1314, STEP: 16, T: 72, base: PATH_Y + 10, tiers: 4 } as const;
/** pass 1's right edge: the camera's end framing and the F1 headline stay where pass 1 put them */
const SR_PASS1 = 1290;
const tierTop = (r: number) => STAND.base - STAND.T * (r + 1);
const tierX0 = (r: number) => STAND.SL + r * STAND.STEP;
/** 12 seats: 3 rows of 4 on tiers 0-2, each row backed by the next tier's face. The rows are staggered half a
 *  pitch, so a fan lifting into a back row rises between two seated fans of the row in front. FILL ORDER:
 *  the front row first, then the back rows; within a row from the end nearest the path (left). */
const SEAT_PITCH = 100;
const SEAT_X0 = [916, 916 + 100 / 3, 916 + 200 / 3]; // three rows a third of a pitch apart: a rising fan clears every seated one by >= 33 px
export const SEATS: { row: number; x: number }[] = [0, 1, 2].flatMap((r) => {
  const row = [0, 1, 2, 3].map((j) => ({ row: r, x: SEAT_X0[r] + j * SEAT_PITCH }));
  return row.reverse(); // the far seat first: a fan never walks beneath one that is lifting
});
/** in front of the stand the ground path comes toward us (DROP px lower), so the crowd on the ground clears
 *  the seated front row; it bends just beyond the f0 frame's right edge */
const DROP = 40;
const DROP_X = [812, 940] as const;
const dropAt = (x: number) => DROP * smoothstep((x - DROP_X[0]) / (DROP_X[1] - DROP_X[0]));
/** the fans who cannot be seated gather on the ground at the stand's foot, packed from its left end back along
 *  the path: spot n at GATHER_X0 - 24 n in lane LANES[n % 3] (lanes 18 px apart, so neighbours share <= 20 %);
 *  each later spot lies left of every earlier one, so nobody walks through the crowd */
const GATHER_X0 = 905;
const GATHER_STEP = 24;

// -- the walkers ---------------------------------------------------------------------------------------------
// Each walker i: crosses FRONT_X at t0 in the dark (speed vd), is lit at tLit (when it passes FRONT_X + off)
// and quickens to vl over RAMP f; a lane (a depth offset in y: 0 = front, single file before the thickening);
// a destination: a seat (walk to under it, stop, ONE eased lift into it) or a gathering spot (walk, stop).
type Pt = [number, number];
const RAMP = 24;
const VD = 9;
const VL = 19;
/** three lanes, 18 px apart in depth, used in turn once the stream thickens; with the dark gap >= 3.2 f a
 *  bust and its neighbour one lane over are >= 28 px apart (<= 13 % overlap), and in one lane >= 86 px */
const LANES = [0, -18, -36];
const gapAt = (t: number) => lerp(6.8, 3.3, smoothstep((t - 24) / 40)); // ~one every 7 f, thickening to ~3.3 f by f64
const LIFT_F = 11;
const BACK_ROW_BREATH = 5;
const STOP_D = 40; // the stop: a constant deceleration over the last 40 px
type Dest = { kind: "seat"; row: number; x: number } | { kind: "gather"; x: number };
type Walker = { i: number; t0: number; tLit: number; off: number; lane: number; vd: number; vl: number; reach: number; dest: Dest | null; stopF: number };
/** distance walked since being lit (tau = f - tLit; negative before): vd, then eased up to vl over RAMP */
const walked = (tau: number, vd: number, vl: number) => {
  if (tau <= 0) return vd * tau;
  const u = Math.min(tau / RAMP, 1);
  const I = RAMP * (u * u * u - (u * u * u * u) / 2) + Math.max(0, tau - RAMP);
  return vd * tau + (vl - vd) * I;
};
/** a walker's free ground x at frame f: dark speed up to FRONT_X + off (crossing FRONT_X at t0), then lit and quickening */
const groundX = (w: Pick<Walker, "t0" | "tLit" | "off" | "vd" | "vl">, f: number) =>
  f < w.tLit ? FRONT_X + w.vd * (f - w.t0) : FRONT_X + w.off + walked(f - w.tLit, w.vd, w.vl);
/** the ground x with its stop at xs: a constant deceleration over the last STOP_D (C1, no overshoot) */
const stopped = (xg: number, xs: number) => {
  if (xg <= xs - STOP_D) return xg;
  const q = Math.min(1, (xg - (xs - STOP_D)) / (2 * STOP_D));
  return xs - STOP_D + STOP_D * (1 - (1 - q) * (1 - q));
};
const firstF = (fn: (f: number) => boolean, f0: number) => {
  let f = f0;
  while (!fn(f) && f < f0 + 600) f += 0.5;
  let lo = f - 0.5;
  let hi = f;
  for (let it = 0; it < 24; it++) {
    const m = (lo + hi) / 2;
    if (fn(m)) hi = m;
    else lo = m;
  }
  return hi;
};
/** the lift into a seat: eased (soft start, long deceleration), no overshoot */
const liftEase = (u: number) => smoothstep(Math.pow(clamp01(u), 0.72));
export const WALKERS: Walker[] = (() => {
  const out: Walker[] = [];
  let t = 1;
  let i = 0;
  let nThick = 0;
  while (t < DURATION + 80) {
    const thick = gapAt(t) < 6.6; // single file while one gap keeps a bust clear; abreast after
    const lane = thick ? LANES[(nThick++ + 1) % 3] : 0; // abreast: the three lanes in turn
    const vd = VD * (1 + (hash01(i, 3) - 0.5) * 0.006); // near-equal in the dark (the queue keeps its spacing)
    const vl = VL * (1 + (hash01(i, 4) - 0.5) * 0.03);
    const off = FRONT_SPAN * hash01(i, 1);
    out.push({ i, t0: t, tLit: t + off / vd, off, vd, vl, lane, reach: 0, dest: null, stopF: Infinity });
    t += gapAt(t) * (0.94 + 0.12 * hash01(i, 6));
    // a breath in the stream before the back row's first fan, so it passes under the middle row's last fan
    // only once that one has risen clear
    if (i === 7) t += BACK_ROW_BREATH;
    i++;
  }
  // the light's front reaches each walker where its ground x crosses FRONT_X + off (the dtsShared helper)
  for (const w of out) w.reach = reachFrame((f) => groundX(w, f) - (FRONT_X + w.off), -300, 400, 1);
  // the earliest-lit walkers take the seats in fill order; the next ones gather; each stop is solved
  let g = 0;
  out.forEach((w, n) => {
    if (n < SEATS.length) w.dest = { kind: "seat", ...SEATS[n] };
    else {
      // the next free spot in this walker's lane (spots cycle through the lanes as the walkers do)
      while (LANES[g % 3] !== w.lane) g++;
      w.dest = { kind: "gather", x: GATHER_X0 - g * GATHER_STEP };
      g++;
    }
    const xs = (w.dest as Dest).x;
    w.stopF = firstF((f) => groundX(w, f) >= xs + STOP_D, w.t0);
  });
  return out;
})();
/** where walker w is at frame f: bottom-centre, its lift (0..1 toward the next elevation) and whether it is seated */
export const walkerAt = (w: Walker, f: number): { x: number; y: number; lift: number; seated: boolean } => {
  const xg = groundX(w, f);
  const x = w.dest ? stopped(xg, w.dest.x) : xg;
  const yg = PATH_Y + w.lane + dropAt(x);
  if (!w.dest || w.dest.kind === "gather" || f <= w.stopF) return { x, y: yg, lift: 0, seated: false };
  const u = (f - w.stopF) / LIFT_F;
  const e = liftEase(u);
  // one elevation level while it rises, settling as it lands
  const lift = u >= 1 ? 0 : smoothstep(u / 0.3) * (1 - smoothstep((u - 0.55) / 0.45));
  return { x, y: lerp(yg, tierTop(w.dest.row), e), lift, seated: u >= 1 };
};
/** draw order (back to front): a fan lifting into row r is already at row r's depth (it rises BEHIND the rows
 *  in front of it); everyone on the ground by their lane's depth */
export const depthOf = (w: Walker, f: number) => (w.dest?.kind === "seat" && f > w.stopF ? tierTop(w.dest.row) : PATH_Y + w.lane + dropAt(walkerAt(w, f).x));
/** the frame each seat's fan lands */
export const landF = (w: Walker) => (w.dest?.kind === "seat" ? w.stopF + LIFT_F : Infinity);

// -- the camera ----------------------------------------------------------------------------------------------
const K0 = 1.27;
const LOOK0 = 18;
const X0 = SCR.x + (960 - 860) / K0; // the screen's centre on screen x 860 (left of centre)
const X_END = (SB.outer.x + SR_PASS1) / 2;
export const CAM = dtsCameraTrack(
  { x: X0, y: LOOK0, k: K0 },
  [
    { f0: 0, f1: 56, k: 1.29, dx: 6 }, // the hold creeps
    { f0: 50, f1: 84, dx: X_END - X0 - 6, dy: -2, k: 0.95, warp: 0.92 }, // ONE glide right and out
    { f0: 84, f1: DURATION + 8, k: 0.97, dx: 4 }, // the tail creeps in
  ],
  DURATION,
);
const camAt = (f: number) => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];
/** the cream subject pool: from the screen to the stand, lagged (the camera's own damper) */
const POOL_TRACK: Pt[] = (() => {
  const tgt = (f: number): Pt => [lerp(SCR.x + 60, (SCR.x + STAND.SL) / 2 + 150, smoothstep((f - 52) / 40)), 120];
  const out: Pt[] = [];
  let p = tgt(-20);
  let v: Pt = [0, 0];
  for (let f = -20; f <= DURATION + 2; f++) {
    const t = tgt(f);
    v = [v[0] + (t[0] - p[0]) * 0.09 - v[0] * 0.468, v[1] + (t[1] - p[1]) * 0.09 - v[1] * 0.468];
    p = [p[0] + v[0], p[1] + v[1]];
    if (f >= 0) out.push(p);
  }
  return out;
})();

// -- the logos -----------------------------------------------------------------------------------------------
const NETFLIX_PX = 58;
const NETFLIX_GAP = 28;
const NETFLIX_IN = [30, 44] as const;
const F1_IN = [67, 81] as const;
const F1_X = (STAND.SL + 3 * 40 + SR_PASS1) / 2; // pass 1's top tier centre (the headline stays put)
const F1_GAP = 24; // SPACE.CLEAR over the top row's heads
const enterOf = (f: number, w: readonly [number, number]) => clamp01((f - w[0]) / (w[1] - w[0]));

// -- the grandstand ------------------------------------------------------------------------------------------
const Grandstand: React.FC<{ k: number }> = ({ k }) => {
  const { SL, SR, base, tiers } = STAND;
  // the outline: each tier's left end goes up from the tread below
  const outline = (() => {
    const p: Pt[] = [[SL, base], [SL, tierTop(0)]];
    for (let r = 1; r < tiers; r++) {
      p.push([tierX0(r), tierTop(r - 1)]);
      p.push([tierX0(r), tierTop(r)]);
    }
    p.push([SR, tierTop(tiers - 1)], [SR, base]);
    return `M${p.map(([x, y]) => `${x} ${y}`).join("L")}Z`;
  })();
  const lip = EDGE.SLOT_LIP / k;
  const slotH = EDGE.SLOT / k;
  const ao = EDGE.FOOT_AO / k;
  return (
    <g>
      <defs>
        <linearGradient id="dtsStandFace" gradientUnits="userSpaceOnUse" x1="0" y1={tierTop(tiers - 1)} x2="0" y2={base}>
          <stop offset="0" stopColor={COLOR.board} />
          <stop offset="1" stopColor={COLOR.boardFoot} />
        </linearGradient>
        <linearGradient id="dtsStandAO" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
      </defs>
      {/* one union shadow, its contact on the ground */}
      <ObjectShadow paths={[outline]} size={260} contact={{ x: (SL + SR) / 2, y: base, w: SR - SL }} />
      <path d={outline} fill="url(#dtsStandFace)" />
      {/* the joints: each tier rises out of a slot in the one below (foot occlusion + the 2 px slot line) */}
      {Array.from({ length: tiers - 1 }, (_, r) => {
        const y = tierTop(r);
        const x0 = tierX0(r + 1);
        return (
          <g key={r}>
            <rect x={x0} y={y - ao} width={SR - x0} height={ao} fill="url(#dtsStandAO)" />
            <rect x={x0 - lip} y={y - slotH / 2} width={SR - x0 + lip} height={slotH} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
          </g>
        );
      })}
      {/* the lit top edges: each tread of the stair, and the top tier */}
      <g stroke={COLOR.edge} strokeOpacity={ALPHA.edgeBoard} strokeWidth={EDGE.CREAM / k}>
        {Array.from({ length: tiers }, (_, r) => {
          const x0 = tierX0(r);
          const x1 = r < tiers - 1 ? tierX0(r + 1) - lip : SR;
          return <path key={r} d={`M${x0} ${tierTop(r) + EDGE.CREAM / k / 2}H${x1}`} />;
        })}
      </g>
    </g>
  );
};

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const SmashingSuccess: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const band = dtsAmberBand(cam);
  const pool = POOL_TRACK[Math.max(0, Math.min(POOL_TRACK.length - 1, f))];
  const half = 960 / k + P;
  const people = WALKERS.map((w) => ({ w, ...walkerAt(w, f), depth: depthOf(w, f) }))
    .filter((p) => Math.abs(p.x - cam.x) < half)
    .sort((a, b) => a.depth - b.depth || a.w.i - b.w.i);
  return (
    <AbsoluteFill>
      <DtsStage S={f} cam={cam} rest={CAM[0]} pool={{ x: pool[0], y: pool[1] }} lights={[LIGHT]}>
        <Screen x={SCR.x} y={SCR.y} w={SCR.w} k={k} band={band} on={1} />
        <NetflixLogo x={SCR.x} y={SB.top - NETFLIX_GAP / k} k={k} px={NETFLIX_PX} enter={enterOf(f, NETFLIX_IN)} />
        <Grandstand k={k} />
        <F1Logo x={F1_X} y={tierTop(STAND.tiers - 1) - P - F1_GAP / k} k={k} enter={enterOf(f, F1_IN)} />
        {people.map((p) => (
          <Person key={p.w.i} x={p.x} y={p.y} h={P} k={k} amber={toneAt(p.w.reach, f)} lift={p.lift} />
        ))}
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
  if (NETFLIX_IN[1] > 48 - 4 || F1_IN[1] > 86 - 4) fail("a logo does not land ahead of its word");
  // nothing of the stand on screen before the glide
  for (let f = 0; f < 50; f++) {
    const s = toScreenL(camAt(f), STAND.SL - 4, tierTop(0));
    if (s.x < 1920 + 4) fail(`the stand shows on f${f}`);
  }
  // the seats: the stand is empty at the reveal, fills front row first, and is FULL for the last >= 8 f
  const lands = WALKERS.filter((w) => w.dest?.kind === "seat").map(landF);
  if (lands.length !== SEATS.length) fail(`${lands.length} fans for ${SEATS.length} seats`);
  if (Math.min(...lands) < 88) fail(`the first fan lands on f${Math.min(...lands).toFixed(1)} (the stand must be empty at the reveal)`);
  const last = Math.max(...lands);
  if (last < 156 || last > DURATION - 8) fail(`the last seat lands on f${last.toFixed(1)} (want f156-${DURATION - 8})`);
  for (let r = 1; r < 3; r++) {
    const prev = WALKERS.filter((w) => w.dest?.kind === "seat" && w.dest.row === r - 1).map(landF);
    const cur = WALKERS.filter((w) => w.dest?.kind === "seat" && w.dest.row === r).map(landF);
    if (Math.min(...cur) < Math.min(...prev)) fail(`row ${r} starts filling before row ${r - 1}`);
  }
  WALKERS.forEach((w) => {
    if (Math.abs(w.reach - w.tLit) > 0.05) fail(`walker ${w.i}: the front reaches it at ${w.reach} not ${w.tLit}`);
    if (!w.dest && groundX(w, DURATION) > STAND.SL - 40) fail(`walker ${w.i} reaches the stand with nowhere to go`);
  });
  // every walker under 45 screen px/f
  for (let f = 1; f < DURATION; f++) {
    const c0 = camAt(f - 1);
    const c1 = camAt(f);
    for (const w of WALKERS) {
      const a = walkerAt(w, f - 1);
      const b = walkerAt(w, f);
      const sa = toScreenL(c0, a.x, a.y);
      const sb = toScreenL(c1, b.x, b.y);
      if (sb.x < -60 || sb.x > 1980) continue;
      const v = Math.hypot(sb.x - sa.x, sb.y - sa.y);
      if (v > 45) fail(`walker ${w.i} moves ${v.toFixed(1)} px on f${f}`);
    }
  }
  // NO OVERLAPS: any two busts on screen share at most 25 % of a bust's area (measured on the bust's own
  // silhouette, 1 px grid at h 60), on every frame
  const M = 60;
  const inBust = (x: number, y: number) => {
    // unit space (height 1, bottom-centre origin) -> person.png units
    const u = (x / M) * 429 + 255.5;
    const v = (y / M) * 429 + 470;
    if ((u - 255.5) ** 2 + (v - 143) ** 2 <= 102 * 102) return true;
    if (v < 266 || v > 470) return false;
    let lb = 41;
    if (v <= 458) {
      // the dome's left edge: the cubic (41,458) (41,352) (126,266) (232,266), solved for v
      let lo = 0;
      let hi = 1;
      for (let it = 0; it < 20; it++) {
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
  const cells: [number, number][] = [];
  for (let y = -M + 0.5; y < 0; y++) for (let x = -M / 2 + 0.5; x < M / 2; x++) if (inBust(x, y)) cells.push([x, y]);
  const grid = new Set(cells.map(([x, y]) => `${x},${y}`));
  const ovMemo = new Map<string, number>();
  const overlap = (dx: number, dy: number) => {
    const ix = Math.round(Math.abs(dx));
    const iy = Math.round(dy);
    if (ix >= M || Math.abs(iy) >= M) return 0;
    const key = `${ix},${iy}`;
    const hit = ovMemo.get(key);
    if (hit !== undefined) return hit;
    let n = 0;
    for (const [x, y] of cells) if (grid.has(`${x - ix},${y - iy}`)) n++;
    const v = n / cells.length;
    ovMemo.set(key, v);
    return v;
  };
  let worst = 0;
  let worstAt = "";
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    const ps = WALKERS.map((w) => ({ w, ...walkerAt(w, f) })).filter((p) => Math.abs(toScreenL(c, p.x, p.y).x - 960) < 1000);
    for (let a = 0; a < ps.length; a++)
      for (let b = a + 1; b < ps.length; b++) {
        const o = overlap(ps[b].x - ps[a].x, ps[b].y - ps[a].y);
        if (o > worst) {
          worst = o;
          worstAt = `walkers ${ps[a].w.i} / ${ps[b].w.i} on f${f}`;
        }
      }
  }
  if (worst > 0.25) fail(`busts overlap ${(worst * 100).toFixed(0)} % (${worstAt})`);
  if (DIAG) console.log(`worst overlap ${(worst * 100).toFixed(1)} % (${worstAt})`);
  // subject ink inside y 90-880: NETFLIX on top, every bust on screen at the bottom
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    const top = toScreenL(c, 0, SB.top).y - (f >= NETFLIX_IN[0] ? NETFLIX_GAP + NETFLIX_PX : 0);
    if (top < 90 - 0.5) fail(`ink reaches y ${top.toFixed(0)} on f${f}`);
    for (const w of WALKERS) {
      const p = walkerAt(w, f);
      const sp = toScreenL(c, p.x, p.y);
      if (sp.x > -40 && sp.x < 1960 && sp.y > 880.5) fail(`walker ${w.i} reaches y ${sp.y.toFixed(0)} on f${f}`);
    }
  }
}
