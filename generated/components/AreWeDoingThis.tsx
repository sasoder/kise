import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, STROKE, lerp, rectPath, smoothstep } from "./stoutShared";
import {
  CAR,
  DTS,
  FPS,
  FRAME_P,
  SAFE_P,
  DtsStage,
  DtsTile,
  F1Car,
  ObjectShadow,
  Screen,
  camJerk,
  decelFront,
  frontFromKeys,
  dtsAmberBandP,
  dtsCameraTrackP,
  DTS_LIGHT,
  screenBox,
  toScreenP,
} from "./dtsShared";
import type { Cam, Glide } from "./outgrowShared";
import { CAM_DAMP, CAM_STIFF } from "./fieldShared";

// ---------------------------------------------------------------------------
// AreWeDoingThis — cut C of Toto Wolff, "why Drive to Survive worked" (Cheeky Pint S4E01), on the DTS world
// (dtsShared.tsx; briefs out/dts/briefs/BRIEF.md + BRIEF_9x16.md). Cheeky Pint S4 stout system, palette B1.
// PASS 3: 9:16, 1080x1920, 24 fps, opaque (portrait stage). The delivered 16:9 version is kept in
// out/dts/P/landscape/. Replaces the picture at seq 33.600-38.920 (Toto).
//
// THE LINE: "We were fighting a world championship against Ferrari, so I sat down with my colleague of
// Ferrari and said, are we doing this? And he said,"  (heard after the cut: "...not play Cirque du Soleil";
// Ferrari and Mercedes did not take part in season one.)
// DURATION = ceil((38.920 - 33.600) x 24) = ceil(127.68) = 128 f, no tail (the graphic fits the interval).
// ONSETS (f): we 0 · were 2 · fighting 5 · a 12 · world 16 · championship 19 · against 28 · ferrari 35 ·
//   so 44 · i 49 · sat 51 · down 56 · with 61 · my 64 · colleague 69 · of 76 · ferrari 79 · and 86 ·
//   said 91 · are 94 · we 96 · doing 98 · this 103 · and 112 · he 116 · said 119 · speech ends 125.
//
// THE ACCENT RULE: amber = Drive to Survive's light. The light comes ASKING the two front-runners and stops
// short of them: nothing in this cut turns amber. The only amber is the screen's face and the light it pours.
//
// ONE MOTION: two cars race, brake together to rest beside the trophy, and the show's light pours down from
// above and waits over them.
// GESTURES (gesture -> word -> frames)
//   1. Two cream F1 cars (F1Car, 420 world px = 563 px, 52 % of the width) race right in two stacked lanes,
//      Mercedes (upper) slightly ahead; the camera rides with them (a dolly at the cars' speed, V0 ~8.4
//      world px/f = 11 px/f) so the lane dashes stream past; each car carries its team tile (counter-scaled,
//      150 px) as an anchored headline -> "we were fighting" -> f0..f22.
//   2. The cream card TROPHY streams in at the right (its edge enters on f18) -> "a world championship"
//      (f16-19) -> f18..f40, and the cars start braking as it comes into view.
//   3. Ferrari pulls level (f22..f34) -> "against Ferrari" (f35).
//   4. ONE long braking curve (speed V0 (1 - u)^4 over f22..f86: the portrait frame is narrow, so the dolly may
//      carry the trophy only ~140 world px after it enters; the cars shed most of their speed early and roll
//      the rest of the way) to rest side by side, the trophy beside them in the Ferrari lane; the camera eases
//      onto the two-shot of the row (k 1.34 -> 1.25, centred, glide f40..f88) -> "so I sat down with my
//      colleague of Ferrari" -> f22..f86.
//   5. ONE camera glide UP and OUT (f68 -> f100, late-weighted as pass 2) onto the end column: THE SCREEN
//      centred at the top (DTS readable), the light, the Mercedes tile + car, the Ferrari tile + car + trophy
//      -> "and said, are we doing this?" -> lands ~f102 ("this" f103).
//   6. THE SCREEN slides down into frame from ABOVE (decelFront p 3, f58..f100, mostly off frame; its foot
//      enters ~f79) and its LIGHT (cut-local FallingLight: pass 2's GroundLight re-aimed: A's DTS_LIGHT amber,
//      screen-blended under everything, a0 at the screen toward a1, a crisp blurred front) pours DOWN ahead of
//      it (its front enters on f78, "of Ferrari", <= 42 px/f) and decelerates: it lands 44 px above the
//      Mercedes tile on f101 -> "are we doing this?".
//   7. Held breath: the front breathes 6 px down (f110..f125, still a clear gap) and stops; a slow creep;
//      nothing turns amber -> "And he said," -> f110..f127. End there.
//   CLICK: none (no LightSweep: the payoff is heard after the cut).
// Nothing else (no type; the only logos are the two team tiles).
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = 128;
export const BEATS = { we: 0, fighting: 5, world: 16, championship: 19, against: 28, ferrari: 35, so: 44, sat: 51, colleague: 69, ferrari2: 79, and: 86, said: 91, are: 94, doing: 98, this: 103, and2: 112, he: 116, said2: 119, ends: 125 } as const;
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// -- the world (world px) ----------------------------------------------------------------------------------
export const CAR_LEN = 420;
const CAR_H = CAR.heightOfLen * CAR_LEN; // 87
const CAR_REACH = CAR.reachOfLen * CAR_LEN; // 429: the front wing's tip
/** The two lanes' grounds: Mercedes (upper, far lane) and Ferrari (lower, near lane). */
export const LANE_Y = { mercedes: 0, ferrari: 320 } as const;
const DASH_DY = 18; // the dashed rule under each car
/** The team tile, an anchored headline over its car: SCREEN px (counter-scaled), its gap over the car. */
export const TILE_PX = 150;
export const TILE_GAP_PX = 24;
const tileFoot = (ground: number, k: number) => ground - CAR_H - TILE_GAP_PX / k;
const tileTop = (ground: number, k: number) => tileFoot(ground, k) - TILE_PX / k;
const tileX = (tail: number) => tail + 0.52 * CAR_LEN; // over the cockpit

// -- the trophy: 200 world px tall, standing in the Ferrari lane 72 world px past the cars' noses at rest -------
export const TROPHY_H = 200;
const TS = TROPHY_H / 21; // the 24 box's ink spans y 2..23
const TROPHY_W = 22 * TS;
const TROPHY_LEFT = CAR_REACH + 72;
export const TROPHY_X = TROPHY_LEFT + TROPHY_W / 2;
const TROPHY_RIGHT = TROPHY_LEFT + TROPHY_W;

// -- the race: speed V0, then ONE braking curve V0 (1 - u)^4 to rest at x 0 on BRAKE.f1 ---------------------------
export const BRAKE = { f0: 22, f1: 86, p: 4 } as const;
const unitSpeed = (f: number) => (f < BRAKE.f0 ? 1 : Math.pow(1 - Math.min(1, (f - BRAKE.f0) / (BRAKE.f1 - BRAKE.f0)), BRAKE.p));
const integrate = (fn: (f: number) => number, a: number, b: number) => {
  let s = 0;
  const n = Math.max(1, Math.round((b - a) * 16));
  for (let i = 0; i < n; i++) s += fn(a + ((i + 0.5) * (b - a)) / n) * ((b - a) / n);
  return s;
};
/** The race framing: k (the cars 52 % of the width) and the camera centre ahead of the Mercedes tail (Ferrari's
 *  tail, 100 behind on f0, 90 px from the left edge). */
export const K_RACE = 563 / CAR_LEN;
export const C_RACE = -100 + (FRAME_P.CX - 90) / K_RACE;
/** The trophy's edge enters the frame's right edge on TROPHY_IN: V0 is solved for it. */
export const TROPHY_IN = 18;
export const V0 = (C_RACE + (FRAME_P.W - FRAME_P.CX + 4) / K_RACE - TROPHY_LEFT) / integrate(unitSpeed, TROPHY_IN, BRAKE.f1);
const speedAt = (f: number) => V0 * unitSpeed(f);
export const PACK: number[] = (() => {
  const out: number[] = [];
  for (let f = 0; f <= DURATION + 4; f++) out.push(-integrate(speedAt, f, Math.max(f, BRAKE.f1)));
  return out;
})();
export const packAt = (f: number) => {
  const a = Math.max(0, Math.min(PACK.length - 2, Math.floor(f)));
  return lerp(PACK[a], PACK[a + 1], f - a);
};
/** Ferrari's tail relative to Mercedes': 100 behind, easing level over f22..f34 ("against Ferrari"). */
export const FERRARI_GAP = 100;
export const LEVEL = { f0: 22, f1: 34 } as const;
export const ferrariRel = (f: number) => -FERRARI_GAP * (1 - smoothstep((f - LEVEL.f0) / (LEVEL.f1 - LEVEL.f0)));

// -- framing helpers: a world box [top, bottom] centred on the band y 200-1400 (the look lands on y 835) ----------
const BAND_MID = (SAFE_P.top + SAFE_P.bottom) / 2; // 800
const lookFor = (top: number, bottom: number, k: number) => (top + bottom) / 2 + (835 - BAND_MID) / k;
const LANES_BOTTOM = LANE_Y.ferrari + DASH_DY + 4;

// -- the end column: THE SCREEN at the top, its light, the two lanes; K_FIT fills y 200-1400 ---------------------
export const SCREEN_W = DTS.SCREEN.w;
const SBOX_H = screenBox(0, 0, SCREEN_W).outer.h;
/** The light's front lands 44 px above the Mercedes tile; the light runs RUNWAY world px from the screen. */
export const FRONT_GAP_PX = { land: 44, breath: 38 } as const;
const RUNWAY = 230;
const columnAt = (k: number) => {
  const front = tileTop(LANE_Y.mercedes, k) - FRONT_GAP_PX.land / k;
  const bottom = front - RUNWAY;
  return { front, screenBottom: bottom, top: bottom - SBOX_H };
};
export const K_FIT: number = (() => {
  let k = 0.9;
  for (let i = 0; i < 30; i++) k = (SAFE_P.bottom - SAFE_P.top - 2 * 5 - 6) / (LANES_BOTTOM - columnAt(k).top);
  return k;
})();
export const K_END = K_FIT / 1.008; // the glide lands here; the held breath creeps to K_FIT
const COL = columnAt(K_FIT);
export const SCREEN_X = (0 + TROPHY_RIGHT) / 2; // the row's centre (the cars' rear wing .. the trophy)
export const SCREEN_REST_Y = COL.screenBottom - SBOX_H / 2;
export const FRONT_LAND = columnAt(K_END).front;
export const FRONT_BREATH = tileTop(LANE_Y.mercedes, K_FIT) - FRONT_GAP_PX.breath / K_FIT;

// -- the camera: the dolly + framing glides (dtsShared's portrait rig) --------------------------------------------
export const K_TWO = 1.25;
const LOOK_RACE = lookFor(tileTop(LANE_Y.mercedes, K_RACE), LANES_BOTTOM, K_RACE);
const LOOK_TWO = lookFor(tileTop(LANE_Y.mercedes, K_TWO), LANES_BOTTOM, K_TWO);
const LOOK_END = lookFor(COL.top, LANES_BOTTOM, K_FIT);
const START = { x: C_RACE, y: LOOK_RACE, k: K_RACE };
export const G_TWO: Glide = { f0: 40, f1: 88, dx: SCREEN_X - C_RACE, dy: LOOK_TWO - LOOK_RACE, k: K_TWO, warp: 0.9 };
/** ONE glide up and out onto the end column (the pass-2 timing: the house |dv| <= 2.5 sets its length). */
export const G_UP: Glide = { f0: 68, f1: 100, dy: LOOK_END - LOOK_TWO, k: K_END, warp: 1.1 };
export const G_BREATH: Glide = { f0: 100, f1: 150, k: K_FIT };
const FRAMING = dtsCameraTrackP(START, [G_TWO, G_UP, G_BREATH], DURATION, 12);
export const CAM: Cam[] = FRAMING.map((c, f) => ({ ...c, x: c.x + PACK[Math.min(f, PACK.length - 1)] }));
export const camAt = (f: number) => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];

// -- THE SCREEN slides down from above; its light pours down ahead of it ------------------------------------------
export const SCREEN_MOVE = { f0: 58, f1: 100, from: SCREEN_REST_Y - 700, p: 3 } as const;
export const LIGHT_ON = SCREEN_MOVE.f0;
export const screenY = decelFront(SCREEN_MOVE.from, SCREEN_REST_Y, SCREEN_MOVE.f0, SCREEN_MOVE.f1, SCREEN_MOVE.p);
export const POOL_MOVE = { f0: 64, f1: 101, warp: 2.5 } as const;
export const BREATH_MOVE = { f0: 110, f1: 125 } as const;
/** The falling front: the screen's bottom + a lead that eases out (smoothstep of u^2.5: it leaves the screen
 *  late, off frame, so its front enters on f78 under 45 px/f) onto FRONT_LAND on f101,
 *  then the breath (a few px further down, and stop). */
export const poolFront = (f: number) => {
  const bottom = screenY(f) + SBOX_H / 2;
  const u = frontFromKeys([{ f: POOL_MOVE.f0, x: 0 }, { f: POOL_MOVE.f1, x: 1, warp: POOL_MOVE.warp }])(f);
  return lerp(bottom, FRONT_LAND, u) + (FRONT_BREATH - FRONT_LAND) * smoothstep((f - BREATH_MOVE.f0) / (BREATH_MOVE.f1 - BREATH_MOVE.f0));
};
/** The band's horizontal extent (world): the face's width, fading out over FADE at each side. */
const BAND_X = { half: SCREEN_W / 2 + 60, fade: 170 } as const;
const EDGE_SOFT = 9; // screen px (the front's blur sigma)
/** FallingLight: pass 2's GroundLight turned to fall from the screen (yt its top, yb its bottom) down to the
 *  front y1: behind the card it fades in from the card's top to full at its bottom, then A's falloff a0 ->
 *  toward a1 along the fall; the front a crisp blurred edge; the sides fade. */
const FallingLight: React.FC<{ xc: number; yt: number; yb: number; y1: number; k: number }> = ({ xc, yt, yb, y1, k }) => {
  const uid = `gl${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  if (y1 - yb < 2) return null;
  const pad = (4 * EDGE_SOFT) / k;
  const x0 = xc - BAND_X.half;
  const w = 2 * BAND_X.half;
  const fx = BAND_X.fade / w;
  const rr = Math.min(150, (y1 - yt) / 2);
  const at = (y: number) => f3(Math.max(0, Math.min(1, (y - yt) / (y1 - yt))));
  const c = `rgb(${DTS_LIGHT.color})`;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${uid}v`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(yt)} x2="0" y2={f3(y1)}>
          <stop offset="0" stopColor={c} stopOpacity="0" />
          <stop offset={at(yb)} stopColor={c} stopOpacity={DTS_LIGHT.a0} />
          <stop offset={at(lerp(yb, y1, 0.65))} stopColor={c} stopOpacity={f3(lerp(DTS_LIGHT.a0, DTS_LIGHT.a1, 0.3))} />
          <stop offset="1" stopColor={c} stopOpacity={f3((DTS_LIGHT.a0 + DTS_LIGHT.a1) / 2)} />
        </linearGradient>
        <linearGradient id={`${uid}h`} gradientUnits="userSpaceOnUse" x1={f3(x0)} y1="0" x2={f3(x0 + w)} y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset={f3(fx)} stopColor="#fff" />
          <stop offset={f3(1 - fx)} stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(x0 - pad)} y={f3(yt - 200 - pad)} width={f3(w + 2 * pad)} height={f3(y1 - yt + 200 + 2 * pad)}>
          <path d={rectPath(x0, yt - 200, w, y1 - yt + 200, rr)} fill={`url(#${uid}h)`} style={{ filter: `blur(${f3(EDGE_SOFT / k)}px)` }} />
        </mask>
      </defs>
      <rect x={f3(x0 - pad)} y={f3(yt)} width={f3(w + 2 * pad)} height={f3(y1 - yt + pad)} fill={`url(#${uid}v)`} mask={`url(#${uid}m)`} />
    </g>
  );
};

// -- the lane dashes (the track under each car): world-fixed, so they stream at the cars' speed ----------------
const DASH = 30;

// -- the cream subject pool follows the two tiles with the house lag ----------------------------------------------
const SUBJECT_Y = 90;
const POOL_X: number[] = (() => {
  const out: number[] = [];
  const target = (f: number) => packAt(f) + 0.5 * CAR_LEN;
  let x = target(0);
  let v = V0;
  for (let f = 0; f <= DURATION + 2; f++) {
    if (f > 0) {
      v = v + (target(f) - x) * CAM_STIFF - v * CAM_DAMP;
      x += v;
    }
    out.push(x);
  }
  return out;
})();

// -- the trophy as a card: Lucide's trophy (cup, two handles, stem, foot, base) as FILLED shapes ------------------
type Cmd = (string | number)[];
const TROPHY_CMDS: Cmd[][] = [
  // cup
  [["M", 6, 2], ["H", 18], ["V", 9], ["A", 6, 6, 0, 0, 1, 6, 9], ["Z"]],
  // the handles as rings (outer r 3.5, inner r 1.5, Lucide's 2.5 centre line)
  [["M", 6, 3], ["H", 4.5], ["A", 3.5, 3.5, 0, 0, 0, 4.5, 10], ["H", 6], ["V", 8], ["H", 4.5], ["A", 1.5, 1.5, 0, 0, 1, 4.5, 5], ["H", 6], ["Z"]],
  [["M", 18, 3], ["H", 19.5], ["A", 3.5, 3.5, 0, 0, 1, 19.5, 10], ["H", 18], ["V", 8], ["H", 19.5], ["A", 1.5, 1.5, 0, 0, 0, 19.5, 5], ["H", 18], ["Z"]],
  // stem flaring into the foot
  [["M", 10.6, 14.4], ["H", 13.4], ["V", 16.9], ["C", 13.4, 17.8, 13.9, 18.4, 14.8, 18.9], ["L", 16.8, 20.4], ["H", 7.2], ["L", 9.2, 18.9], ["C", 10.1, 18.4, 10.6, 17.8, 10.6, 16.9], ["Z"]],
  // the base
  [["M", 6, 20.4], ["H", 18], ["Q", 18.6, 20.4, 18.6, 21], ["V", 23], ["H", 5.4], ["V", 21], ["Q", 5.4, 20.4, 6, 20.4], ["Z"]],
] as unknown as Cmd[][];
/** The trophy's paths in WORLD px: centre x, foot on `ground`. */
const trophyPaths = (cx: number, ground: number) => {
  const mx = (u: number) => cx + (u - 12) * TS;
  const my = (v: number) => ground - (23 - v) * TS;
  return (TROPHY_CMDS as unknown as Cmd[][]).map((path) =>
    path
      .map((c) => {
        const op = c[0] as string;
        const n = c.slice(1) as number[];
        if (op === "M" || op === "L") return `${op}${f3(mx(n[0]))} ${f3(my(n[1]))}`;
        if (op === "H") return `H${f3(mx(n[0]))}`;
        if (op === "V") return `V${f3(my(n[0]))}`;
        if (op === "A") return `A${f3(n[0] * TS)} ${f3(n[1] * TS)} ${n[2]} ${n[3]} ${n[4]} ${f3(mx(n[5]))} ${f3(my(n[6]))}`;
        if (op === "C") return `C${f3(mx(n[0]))} ${f3(my(n[1]))} ${f3(mx(n[2]))} ${f3(my(n[3]))} ${f3(mx(n[4]))} ${f3(my(n[5]))}`;
        if (op === "Q") return `Q${f3(mx(n[0]))} ${f3(my(n[1]))} ${f3(mx(n[2]))} ${f3(my(n[3]))}`;
        return "Z";
      })
      .join(""),
  );
};
/** TrophyCard — cream card material: one gradient (cream -> foot), one union shadow + contact, the lit rim. */
const TrophyCard: React.FC<{ cx: number; ground: number; k: number }> = ({ cx, ground, k }) => {
  const uid = `aw${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const paths = trophyPaths(cx, ground);
  const top = ground - TROPHY_H;
  return (
    <g>
      <ObjectShadow paths={paths} size={Math.sqrt(TROPHY_W * TROPHY_H)} contact={{ x: cx, y: ground, w: 13.2 * TS }} />
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(top)} x2="0" y2={f3(ground)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <g fill={`url(#${uid}c)`}>
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {/* the lit top edges: the cup's rim and the base's top */}
      <g stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f3(EDGE.CREAM / k)}>
        <path d={`M${f3(cx - 6 * TS)} ${f3(top + EDGE.CREAM / k / 2)}H${f3(cx + 6 * TS)}`} />
        <path d={`M${f3(cx - 6 * TS)} ${f3(ground - 2.6 * TS + EDGE.CREAM / k / 2)}H${f3(cx + 6 * TS)}`} />
      </g>
    </g>
  );
};

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const AreWeDoingThis: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const band = dtsAmberBandP(cam);
  const pack = packAt(f);
  const tails = { mercedes: pack, ferrari: pack + ferrariRel(f) };
  const sy = screenY(f);
  const front = poolFront(f);
  const showLight = f >= LIGHT_ON;
  const x0 = Math.floor((cam.x - (FRAME_P.CX + 80) / k) / (2 * DASH)) * 2 * DASH;
  const x1 = cam.x + (FRAME_P.CX + 80) / k;
  const tilePx = TILE_PX / k;
  const frameTop = cam.y - (FRAME_P.CY + 40) / k;
  return (
    <AbsoluteFill>
      <DtsStage orientation="portrait" S={f} cam={cam} rest={CAM[0]} pool={{ x: POOL_X[Math.min(f, POOL_X.length - 1)], y: SUBJECT_Y }}>
        {/* the show's light, falling from the screen to its front, under everything */}
        {showLight ? <FallingLight xc={SCREEN_X} yt={sy - SBOX_H / 2} yb={sy + SBOX_H / 2} y1={front} k={k} /> : null}
        {/* the lanes: one dashed rule under each car */}
        <g stroke={COLOR.rule} strokeWidth={f3(STROKE.RULE / k)} strokeDasharray={`${DASH} ${DASH}`} fill="none">
          {[LANE_Y.mercedes, LANE_Y.ferrari].map((y) => (
            <path key={y} d={`M${f3(x0)} ${f3(y + DASH_DY)}H${f3(x1)}`} />
          ))}
        </g>
        {/* the screen, sliding down from above behind its light; it rests whole at the top of the column */}
        {showLight && sy + SBOX_H / 2 > frameTop ? <Screen x={SCREEN_X} y={sy} w={SCREEN_W} k={k} band={band} on={1} /> : null}
        <TrophyCard cx={TROPHY_X} ground={LANE_Y.ferrari} k={k} />
        {/* the far lane first (Mercedes), then the near lane (Ferrari) */}
        <F1Car x={tails.mercedes} y={LANE_Y.mercedes} len={CAR_LEN} k={k} />
        <DtsTile x={tileX(tails.mercedes)} y={tileFoot(LANE_Y.mercedes, k)} size={tilePx} k={k} figure="mercedes" />
        <F1Car x={tails.ferrari} y={LANE_Y.ferrari} len={CAR_LEN} k={k} />
        <DtsTile x={tileX(tails.ferrari)} y={tileFoot(LANE_Y.ferrari, k)} size={tilePx} k={k} figure="ferrari" />
      </DtsStage>
    </AbsoluteFill>
  );
};

export default AreWeDoingThis;

// ---------------------------------------------------------------------------
// Load-time checks: the rules the cut rests on.
// ---------------------------------------------------------------------------
{
  // a load-time rule throws, except under the analysis probe (out/dts/P), which collects the misses
  const PROBE = (globalThis as { __AWDT_PROBE__?: string[] }).__AWDT_PROBE__;
  const fail = (m: string) => {
    if (PROBE) PROBE.push(m);
    else throw new Error(`AreWeDoingThis: ${m}`);
  };
  const SWAY = 5;
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) fail(`camera |dv| ${j.maxA.toFixed(2)} px/f^2 at f${j.at}`);
  if (Math.abs(packAt(BRAKE.f1)) > 0.01) fail("the pack does not rest on x 0");
  if (CAR_LEN * K_RACE < 0.5 * FRAME_P.W) fail("the racing cars under 50 % of the width");
  if (TILE_PX < 150) fail("tiles under 150 px");
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    // ink inside y 200-1400: the near lane on every frame; the Mercedes tile until the screen takes the top
    const bottom = toScreenP(c, 0, LANES_BOTTOM).y + SWAY;
    if (bottom > SAFE_P.bottom) fail(`the near lane at y ${bottom.toFixed(0)} on f${f}`);
    const tTop = toScreenP(c, 0, tileTop(LANE_Y.mercedes, c.k)).y - SWAY;
    if (tTop < SAFE_P.top) fail(`the Mercedes tile's top at y ${tTop.toFixed(0)} on f${f}`);
    // the Ferrari tile clears the Mercedes lane
    const gap = toScreenP(c, 0, tileTop(LANE_Y.ferrari, c.k)).y - toScreenP(c, 0, LANE_Y.mercedes).y;
    if (gap < 16) fail(`the Ferrari tile touches the Mercedes lane on f${f} (${gap.toFixed(1)} px)`);
    // the cars inside the side margins
    const l = toScreenP(c, packAt(f) + ferrariRel(f), 0).x;
    const r = toScreenP(c, packAt(f) + CAR_REACH, 0).x;
    if (l < SAFE_P.side || r > FRAME_P.W - SAFE_P.side) fail(`a car leaves the margins on f${f} (${l.toFixed(0)}..${r.toFixed(0)})`);
    // from the two-shot on: the trophy inside the right margin
    if (f >= 86) {
      const tr = toScreenP(c, TROPHY_RIGHT, 0).x + SWAY;
      if (tr > FRAME_P.W - SAFE_P.side) fail(`the trophy breaks the right margin on f${f} (${tr.toFixed(0)})`);
    }
    // the light stops short: its front (+ the blur) stays >= 30 px above the Mercedes tile
    if (f >= LIGHT_ON) {
      const gapPx = (tileTop(LANE_Y.mercedes, c.k) - poolFront(f)) * c.k;
      if (gapPx < 30) fail(`the light's front is ${gapPx.toFixed(1)} px from the Mercedes tile on f${f}`);
    }
    if (f === LIGHT_ON) {
      const e = toScreenP(c, 0, poolFront(f)).y + 3 * EDGE_SOFT;
      if (e > -SWAY) fail(`the light pops in on f${f} (${e.toFixed(0)})`);
    }
    // the end column: from f106 (the glide 95 % there by ~f102) the whole screen inside y 200 and the margins
    if (f >= 106) {
      const st = toScreenP(c, 0, SCREEN_REST_Y - SBOX_H / 2).y - SWAY;
      if (st < SAFE_P.top) fail(`the screen's top at y ${st.toFixed(0)} on f${f}`);
      const sl = toScreenP(c, SCREEN_X - SCREEN_W / 2, 0).x;
      if (sl < SAFE_P.side) fail(`the screen breaks the side margin on f${f}`);
    }
  }
  // everything that moves on screen stays under ~45 px/f
  for (let f = 1; f < DURATION; f++) {
    const a = toScreenP(camAt(f - 1), TROPHY_X, 0).x;
    const b = toScreenP(camAt(f), TROPHY_X, 0).x;
    if (Math.abs(b - a) > 45) fail(`the world flows ${Math.abs(b - a).toFixed(1)} px on f${f}`);
    if (f > LIGHT_ON + 1) {
      const p0 = toScreenP(camAt(f - 1), 0, poolFront(f - 1)).y;
      const p1 = toScreenP(camAt(f), 0, poolFront(f)).y;
      if (p1 > -60 && Math.abs(p1 - p0) > 46) fail(`the light's front moves ${Math.abs(p1 - p0).toFixed(1)} px on f${f}`);
      for (const side of [-1, 1]) {
        const s0 = toScreenP(camAt(f - 1), SCREEN_X, screenY(f - 1) + (side * SBOX_H) / 2).y;
        const s1 = toScreenP(camAt(f), SCREEN_X, screenY(f) + (side * SBOX_H) / 2).y;
        if (s1 > -60 && Math.abs(s1 - s0) > 45) fail(`the screen moves ${Math.abs(s1 - s0).toFixed(1)} px on f${f}`);
      }
    }
    const c0 = toScreenP(camAt(f - 1), packAt(f - 1), 0);
    const c1 = toScreenP(camAt(f), packAt(f), 0);
    if (Math.hypot(c1.x - c0.x, c1.y - c0.y) > 45) fail(`the cars move ${Math.hypot(c1.x - c0.x, c1.y - c0.y).toFixed(1)} px on f${f}`);
  }
  void ALPHA;
  void EDGE;
  void ObjectShadow;
}
