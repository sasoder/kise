import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, STROKE, lerp, rectPath, smoothstep } from "./stoutShared";
import {
  CAR,
  DTS,
  FPS,
  FRAME,
  SAFE,
  DtsStage,
  DtsTile,
  F1Car,
  ObjectShadow,
  Screen,
  camJerk,
  decelFront,
  frontFromKeys,
  dtsAmberBand,
  dtsCameraTrack,
  DTS_LIGHT,
  screenBox,
  toScreenL,
} from "./dtsShared";
import type { Cam, Glide } from "./outgrowShared";
import { CAM_DAMP, CAM_STIFF } from "./fieldShared";

// ---------------------------------------------------------------------------
// AreWeDoingThis — cut C of Toto Wolff, "why Drive to Survive worked" (Cheeky Pint S4E01), on the DTS world
// (dtsShared.tsx; brief out/dts/briefs/BRIEF.md). Cheeky Pint S4 stout system, palette B1.
// 1920x1080, 24 fps, opaque. Replaces the picture at seq 33.600-38.920 (Toto).
//
// THE LINE: "We were fighting a world championship against Ferrari, so I sat down with my colleague of
// Ferrari and said, are we doing this? And he said,"  (heard after the cut: "...not play Cirque du Soleil";
// Ferrari and Mercedes did not take part in season one.)
// DURATION = ceil((38.920 - 33.600) x 24) = ceil(127.68) = 128 f, no tail (the graphic fits the interval).
// ONSETS (f): we 0 · were 2 · fighting 5 · a 12 · world 16 · championship 19 · against 28 · ferrari 35 ·
//   so 44 · i 49 · sat 51 · down 56 · with 61 · my 64 · colleague 69 · of 76 · ferrari 79 · and 86 ·
//   said 91 · are 94 · we 96 · doing 98 · this 103 · and 112 · he 116 · said 119 · speech ends 125.
//
// THE ACCENT RULE: amber = Drive to Survive's light. Here the light comes ASKING the two front-runners and
// stops short of them: nothing in this cut turns amber. The only amber is the screen's face at the left
// edge and the pool it throws on the ground.
//
// ONE MOTION: two cars race, decelerate together to rest short of the trophy, and the show's light slides
// up behind them and waits.
// GESTURES (gesture -> word -> frames)
//   1. Two cream F1 cars (dtsShared F1Car, 420 world px long) race right in two lanes, Mercedes (upper lane)
//      slightly ahead; the camera rides with them (a dolly at the cars' speed, 16 world px/f = 13.6 px/f at
//      k 0.85) so the lane dashes and the trophy stream past while the sheet's 0.15 parallax drifts behind:
//      speed. Each car carries its team tile (DtsTile mercedes / ferrari, counter-scaled to 136 px) as an
//      anchored headline above it -> "we were fighting" -> f0..f44.
//   2. The cream card TROPHY (cut-local, Lucide trophy grammar as filled card, one union shadow, a lit rim)
//      streams in ahead of them at the right: its edge enters frame on ~f12 -> "a world championship"
//      (f16-19) -> f12..f30 (in full view).
//   3. Ferrari pulls level: its tail eases from 100 world px behind to level (smoothstep, f22..f34) ->
//      "against Ferrari" (f35) -> neck and neck from f34.
//   4. Both cars decelerate on ONE long curve (the speed eases to 0 by smoothstep, f44..f84) to rest side
//      by side, short of the trophy; the camera eases from the racing framing to the two-shot of the tiles
//      (k 0.85 -> 1.0, glide f40..f88, dx +80) -> "so I sat down with my colleague of Ferrari" -> f44..f84.
//   PASS 2 (director's notes: the payoff f86-128 did not land; f0-80 unchanged):
//   5. ONE camera glide back and left (k 1.0 -> 0.8, f68 -> f100, late-weighted: 2 % on f80, 27 % on f86,
//      95 % on f102) onto the THREE-SHOT: THE SCREEN whole on the left (576 px, 30 % of the frame, the DTS
//      card readable), the two cars + tiles in the middle, the trophy on the right; the group's box centred
//      on x 960 (bezel ~150 px from the left edge, trophy ~149 from the right) -> "and said, are we doing this?"
//      -> f80..f102 (lands with "this" f103, not 8 f before: the house |dv| <= 2.5 rules out a 15-23 f glide).
//   6. THE SCREEN slides in behind its light (decelFront p 3, f64..f94, mostly off frame; its edge enters on
//      ~f75, "of Ferrari") and rests whole in frame; its LIGHT (cut-local GroundLight: A's DTS_LIGHT amber,
//      screen-blended on the ground under everything, a0 at the screen toward a1, a crisp blurred front,
//      sigma 9 px) runs ahead of it along the track and decelerates (smoothstep of u^1.5, f64..f101): its
//      leading edge enters ~f74, peaks 45.7 px/f, and lands 38 px behind both cars' rear wheels on f101
//      ("this" f103) -> "are we doing this?".
//   7. Held breath: the edge breathes 5 px forward (smoothstep f110..f125, to 33 px behind the wheels) and
//      stops; the camera creeps in a touch (k 0.8 -> 0.805 at f127); nothing turns amber -> "And he said,"
//      -> f110..f127. End there.
//   CLICK: none (no LightSweep: the payoff is heard after the cut).
// Nothing else (no type; the only logos are the two team tiles).
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = 128;
export const BEATS = { we: 0, fighting: 5, world: 16, championship: 19, against: 28, ferrari: 35, so: 44, sat: 51, colleague: 69, ferrari2: 79, and: 86, said: 91, are: 94, doing: 98, this: 103, and2: 112, he: 116, said2: 119, ends: 125 } as const;

// -- the world (world px) ----------------------------------------------------------------------------------
export const CAR_LEN = 420;
const CAR_H = CAR.heightOfLen * CAR_LEN; // 87
/** The two lanes' grounds: Mercedes (upper, far lane) and Ferrari (lower, near lane). */
export const LANE_Y = { mercedes: 0, ferrari: 320 } as const;
/** The team tile, an anchored headline over its car: SCREEN px (counter-scaled), its gap over the car. */
export const TILE_PX = 136;
export const TILE_GAP_PX = 24;
const tileFoot = (ground: number, k: number) => ground - CAR_H - TILE_GAP_PX / k;
const tileX = (tail: number) => tail + 0.52 * CAR_LEN; // over the cockpit

// -- the race: a dolly at the cars' speed, then one long deceleration to rest at x 0 ---------------------------
export const V0 = 16; // world px/f
export const DECEL = { f0: 44, f1: 84 } as const;
/** The pack's speed at f: V0, eased to 0 by smoothstep over DECEL (C1: no kick at either end). */
const speedAt = (f: number) => V0 * (1 - smoothstep((f - DECEL.f0) / (DECEL.f1 - DECEL.f0)));
/** The pack's position (Mercedes' tail) at f, so that it rests on x 0 from DECEL.f1 (integrated by quadrature). */
export const PACK: number[] = (() => {
  const raw: number[] = [];
  let x = 0;
  for (let f = 0; f <= DURATION + 4; f++) {
    raw.push(x);
    let d = 0; // the speed's mean over [f, f + 1] (midpoint rule, 16 steps)
    for (let i = 0; i < 16; i++) d += speedAt(f + (i + 0.5) / 16) / 16;
    x += d;
  }
  const rest = raw[DECEL.f1];
  return raw.map((v) => v - rest);
})();
/** The pack at a fractional frame (linear between the integrated frames). */
export const packAt = (f: number) => {
  const a = Math.max(0, Math.min(PACK.length - 2, Math.floor(f)));
  return lerp(PACK[a], PACK[a + 1], f - a);
};
/** Ferrari's tail relative to Mercedes': 100 behind, easing level over f22..f34 ("against Ferrari"). */
export const FERRARI_GAP = 100;
export const LEVEL = { f0: 22, f1: 34 } as const;
export const ferrariRel = (f: number) => -FERRARI_GAP * (1 - smoothstep((f - LEVEL.f0) / (LEVEL.f1 - LEVEL.f0)));

// -- the camera: framing glides (dtsShared's rig) on top of the dolly ---------------------------------------
export const LOOK = 30;
export const K_RACE = 0.85;
export const K_TWO = 1.0;
/** PASS 2: the three-shot (screen | cars | trophy) the payoff lands on, and its held-breath creep. */
export const K_THREE = 0.8;
export const K_BREATH = 0.814;
const START = { x: 300, y: LOOK, k: K_RACE };
const G_RACE: Glide[] = [{ f0: 40, f1: 88, dx: 80, k: K_TWO, warp: 0.9 }];
/** The race's camera alone (f0-80 are unchanged by pass 2): the trophy is placed on it. */
const RACE_CAM: Cam[] = dtsCameraTrack(START, G_RACE, DURATION, 12).map((c, f) => ({ ...c, x: c.x + PACK[Math.min(f, PACK.length - 1)] }));

// -- the trophy: streams in at the right; its left edge crosses the frame's right edge on TROPHY_IN -------------
export const TROPHY_H = 250; // world px (ink height)
const TS = TROPHY_H / 21; // the 24 box's ink spans y 2..23
const TROPHY_W = 22 * TS;
export const TROPHY_IN = 12;
export const TROPHY_X: number = (() => {
  const c = RACE_CAM[TROPHY_IN];
  const leftEdge = c.x + (FRAME.W - FRAME.CX + 4) / c.k; // 4 px past the frame (+ sway 3)
  return leftEdge + TROPHY_W / 2;
})();

// -- THE SCREEN (pass 2): it rests WHOLE in the three-shot, 576 px wide (30 % of the frame) ----------------------
export const SCREEN_W = DTS.SCREEN.w;
const SCREEN_Y = 110;
/** The screen's rest (centre x): its bezel's right edge 430 world px behind the tails (the light's runway). */
export const SCREEN_REST_X = -790;
const SCREEN_LEFT = SCREEN_REST_X - SCREEN_W / 2;
const TROPHY_RIGHT = TROPHY_X + TROPHY_W / 2;
/** The three-shot's centre: the group (bezel's left edge .. trophy's right edge) centred on x 960. */
export const CX_THREE = (SCREEN_LEFT + TROPHY_RIGHT) / 2;
/** ONE glide back and left onto the three-shot (k 1.0 -> 0.8). The house cap |dv| <= 2.5 sets its length: a
 *  16-23 f glide (f80 -> ~f95) measured 3.8-5.5, so it runs f68 -> f100 with a late-weighted start (warp 1.1):
 *  still 2 % on f80, 27 % on f86, 95 % on f102, under 3 px/f from f105. Then the held breath creeps in a touch. */
export const G_THREE: Glide = { f0: 68, f1: 100, dx: CX_THREE - (START.x + 80), k: K_THREE, warp: 1.1 };
export const G_BREATH: Glide = { f0: 100, f1: 160, k: K_BREATH };
const FRAMING = dtsCameraTrack(START, [...G_RACE, G_THREE, G_BREATH], DURATION, 12);
export const CAM: Cam[] = FRAMING.map((c, f) => ({ ...c, x: c.x + PACK[Math.min(f, PACK.length - 1)] }));
export const camAt = (f: number) => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];

/** The screen slides in behind its light (decelerating) and rests whole in frame. */
/** (most of the slide happens off frame; once in frame the bezel moves <= 45 px/f with the camera's own pan) */
export const SCREEN_MOVE = { f0: 64, f1: 94, from: SCREEN_REST_X - 900, p: 3 } as const;
/** The screen and its light exist from here (before, they wait off frame left; the race is over). */
export const LIGHT_ON = SCREEN_MOVE.f0;
export const screenX = decelFront(SCREEN_MOVE.from, SCREEN_REST_X, SCREEN_MOVE.f0, SCREEN_MOVE.f1, SCREEN_MOVE.p);

// -- THE LIGHT (pass 2): a local ground light with a legible leading edge --------------------------------------------
// A's look at the source (DTS_LIGHT: the same amber, screen-blended on the ground under the world, a0 at the
// screen falling to a1), but shaped as a band along the track from the screen to a crisp, softly rounded
// front (edge blur EDGE_SOFT screen px) instead of an ellipse whose rim fades into a smudge.
/** The rear wheels' left edge, relative to the tail (both cars are level from f34). */
const WHEEL_EDGE = ((0.86 - 0.36) / CAR.units) * CAR_LEN; // 38.2
/** The front lands 38 screen px behind the rear wheels with "this", and breathes to 33 px through "And he said". */
export const FRONT_GAP_PX = { land: 38, breath: 33 } as const;
export const FRONT_LAND = WHEEL_EDGE - FRONT_GAP_PX.land / K_THREE;
export const FRONT_BREATH = WHEEL_EDGE - FRONT_GAP_PX.breath / K_BREATH;
export const POOL_MOVE = { f0: 64, f1: 101, warp: 1.5 } as const;
export const BREATH_MOVE = { f0: 110, f1: 125 } as const;
/** The leading edge: the screen's right edge + a lead that eases out of the screen (smoothstep of u^1.5: it
 *  leaves the screen slowly, runs ahead of it into the frame, then decelerates) onto FRONT_LAND on f101,
 *  then the breath. */
export const poolFront = (f: number) => {
  const right = screenX(f) + SCREEN_W / 2;
  const u = frontFromKeys([{ f: POOL_MOVE.f0, x: 0 }, { f: POOL_MOVE.f1, x: 1, warp: POOL_MOVE.warp }])(f);
  return lerp(right, FRONT_LAND, u) + (FRONT_BREATH - FRONT_LAND) * smoothstep((f - BREATH_MOVE.f0) / (BREATH_MOVE.f1 - BREATH_MOVE.f0));
};
/** The band's vertical extent on the track (world): both lanes' wheels inside its full strength. */
const BAND_Y = { y0: -120, y1: 400, fade: 170 } as const; // full on y 50..230; half over both lanes' wheels
const EDGE_SOFT = 9; // screen px (the front's blur sigma)
/** GroundLight: from the screen (xs = its centre, xr = its right edge) to the leading edge x1. Behind the card
 *  it fades in from the card's left edge to full at its right edge (so where the band is taller than the card
 *  there is no cut), then A's falloff a0 -> toward a1 along the run, the front a crisp blurred edge. */
const GroundLight: React.FC<{ xs: number; xr: number; x1: number; k: number }> = ({ xs, xr, x1, k }) => {
  const uid = `gl${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const xl = xs - (xr - xs);
  if (x1 - xr < 2) return null;
  const pad = (4 * EDGE_SOFT) / k;
  const h = BAND_Y.y1 - BAND_Y.y0;
  const fy = BAND_Y.fade / h;
  const rr = Math.min(150, (x1 - xl) / 2);
  const at = (x: number) => f3(Math.max(0, Math.min(1, (x - xl) / (x1 - xl))));
  const c = `rgb(${DTS_LIGHT.color})`;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${uid}h`} gradientUnits="userSpaceOnUse" x1={f3(xl)} y1="0" x2={f3(x1)} y2="0">
          <stop offset="0" stopColor={c} stopOpacity="0" />
          <stop offset={at(xr)} stopColor={c} stopOpacity={DTS_LIGHT.a0} />
          <stop offset={at(lerp(xr, x1, 0.65))} stopColor={c} stopOpacity={f3(lerp(DTS_LIGHT.a0, DTS_LIGHT.a1, 0.3))} />
          <stop offset="1" stopColor={c} stopOpacity={f3((DTS_LIGHT.a0 + DTS_LIGHT.a1) / 2)} />
        </linearGradient>
        <linearGradient id={`${uid}v`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(BAND_Y.y0)} x2="0" y2={f3(BAND_Y.y1)}>
          <stop offset="0" stopColor="#000" />
          <stop offset={f3(fy)} stopColor="#fff" />
          <stop offset={f3(1 - fy)} stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(xl - pad)} y={f3(BAND_Y.y0 - pad)} width={f3(x1 - xl + 2 * pad)} height={f3(h + 2 * pad)}>
          <path d={rectPath(xl - 200, BAND_Y.y0, x1 - xl + 200, h, rr)} fill={`url(#${uid}v)`} style={{ filter: `blur(${f3(EDGE_SOFT / k)}px)` }} />
        </mask>
      </defs>
      <rect x={f3(xl)} y={f3(BAND_Y.y0 - pad)} width={f3(x1 - xl + pad)} height={f3(h + 2 * pad)} fill={`url(#${uid}h)`} mask={`url(#${uid}m)`} />
    </g>
  );
};

// -- the lane dashes (the track under each car): world-fixed, so they stream at the cars' speed ----------------
const DASH = 36;

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
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
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
  const band = dtsAmberBand(cam);
  const pack = packAt(f);
  const tails = { mercedes: pack, ferrari: pack + ferrariRel(f) };
  const sx = screenX(f);
  const front = poolFront(f);
  const showLight = f >= LIGHT_ON;
  // the lane dashes across the frame, world-fixed (start on a whole period)
  const x0 = Math.floor((cam.x - (FRAME.CX + 80) / k) / (2 * DASH)) * 2 * DASH;
  const x1 = cam.x + (FRAME.CX + 80) / k;
  const tilePx = TILE_PX / k;
  return (
    <AbsoluteFill>
      <DtsStage S={f} cam={cam} rest={CAM[0]} pool={{ x: POOL_X[Math.min(f, POOL_X.length - 1)], y: SUBJECT_Y }}>
        {/* the show's light on the track, under everything (from the screen's centre to its leading edge) */}
        {showLight ? <GroundLight xs={sx} xr={sx + SCREEN_W / 2} x1={front} k={k} /> : null}
        {/* the lanes: one dashed rule under each car */}
        <g stroke={COLOR.rule} strokeWidth={f3(STROKE.RULE / k)} strokeDasharray={`${DASH} ${DASH}`} fill="none">
          {[LANE_Y.mercedes, LANE_Y.ferrari].map((y) => (
            <path key={y} d={`M${f3(x0)} ${f3(y + 18)}H${f3(x1)}`} />
          ))}
        </g>
        {/* the screen, gliding in from the left behind its light; it rests whole in the three-shot */}
        {showLight && sx + SCREEN_W / 2 > cam.x - (FRAME.CX + 40) / k ? <Screen x={sx} y={SCREEN_Y} w={SCREEN_W} k={k} band={band} on={1} /> : null}
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
  if (Math.abs(packAt(DECEL.f1)) > 0.01) fail("the pack does not rest on x 0");
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    // ink inside y 90-880: the Mercedes tile's top, the near lane's dashes
    const top = toScreenL(c, 0, tileFoot(LANE_Y.mercedes, c.k)).y - TILE_PX - SWAY;
    const bottom = toScreenL(c, 0, LANE_Y.ferrari + 18).y + SWAY;
    if (top < SAFE.top - 0.5) fail(`the Mercedes tile's top at y ${top.toFixed(0)} on f${f}`);
    if (bottom > SAFE.bottom) fail(`the near lane at y ${bottom.toFixed(0)} on f${f}`);
    // the Ferrari tile clears the Mercedes car (its contact shadow ~4 px)
    const gap = toScreenL(c, 0, tileFoot(LANE_Y.ferrari, c.k)).y - TILE_PX - toScreenL(c, 0, LANE_Y.mercedes).y;
    if (gap < 16) fail(`the Ferrari tile touches the Mercedes lane on f${f} (${gap.toFixed(1)} px)`);
    // the cars stay in frame, inside the side margins
    const l = toScreenL(c, packAt(f) + ferrariRel(f), 0).x;
    const r = toScreenL(c, packAt(f) + CAR.reachOfLen * CAR_LEN, 0).x;
    if (l < SAFE.side || r > FRAME.W - SAFE.side) fail(`a car leaves the margins on f${f}`);
    // the light stops short: its leading edge (+ the blur's 2 sigma) stays >= 30 screen px behind the rear wheels
    if (f >= LIGHT_ON) {
      const gapPx = (packAt(f) + ferrariRel(f) + WHEEL_EDGE - poolFront(f)) * c.k;
      if (gapPx < 30) fail(`the light's edge is ${gapPx.toFixed(1)} px from the rear wheels on f${f}`);
    }
    // the screen and its light come into being off frame left (they never pop in)
    if (f === LIGHT_ON) {
      const e = toScreenL(c, poolFront(f), 0).x + 3 * EDGE_SOFT;
      if (e > -SWAY) fail(`the light pops in on f${f} (${e.toFixed(0)})`);
    }
    // PASS 2: the three-shot from f101 (the glide 95 % there by f102): the whole bezel and the trophy inside the margins
    if (f >= 101) {
      const l = toScreenL(c, SCREEN_LEFT, 0).x - SWAY;
      const r = toScreenL(c, TROPHY_RIGHT, 0).x + SWAY;
      if (l < SAFE.side || r > FRAME.W - SAFE.side) fail(`the three-shot breaks a margin on f${f} (${l.toFixed(0)}..${r.toFixed(0)})`);
      const sTop = toScreenL(c, 0, screenBox(0, SCREEN_Y, SCREEN_W).top).y - SWAY;
      if (sTop < SAFE.top) fail(`the screen's top at y ${sTop.toFixed(0)} on f${f}`);
    }
  }
  // everything that moves on screen stays under 45 px/f (the world flows past at the dolly's speed); the light's
  // soft front peaks at 45.7 (f83) while the camera pulls back: allowed 46
  for (let f = 1; f < DURATION; f++) {
    const a = toScreenL(camAt(f - 1), TROPHY_X, 0).x;
    const b = toScreenL(camAt(f), TROPHY_X, 0).x;
    if (Math.abs(b - a) > 45) fail(`the world flows ${Math.abs(b - a).toFixed(1)} px on f${f}`);
    const p0 = toScreenL(camAt(f - 1), poolFront(f - 1), 0).x;
    const p1 = toScreenL(camAt(f), poolFront(f), 0).x;
    if (f > LIGHT_ON + 1 && p1 > -60 && Math.abs(p1 - p0) > 46) fail(`the pool's front moves ${Math.abs(p1 - p0).toFixed(1)} px on f${f}`);
    for (const side of [-1, 1]) {
      const s0 = toScreenL(camAt(f - 1), screenX(f - 1) + (side * SCREEN_W) / 2, 0).x;
      const s1 = toScreenL(camAt(f), screenX(f) + (side * SCREEN_W) / 2, 0).x;
      if (f > LIGHT_ON + 1 && s1 > -60 && Math.abs(s1 - s0) > 45) fail(`the screen moves ${Math.abs(s1 - s0).toFixed(1)} px on f${f}`);
    }
    const c0 = toScreenL(camAt(f - 1), packAt(f - 1), 0).x;
    const c1 = toScreenL(camAt(f), packAt(f), 0).x;
    if (Math.abs(c1 - c0) > 45) fail(`the cars move ${Math.abs(c1 - c0).toFixed(1)} px on f${f}`);
  }
  // the trophy: in full view (inside the right margin) from f30, short of the cars at rest
  {
    const c = camAt(DURATION - 1);
    const r = toScreenL(c, TROPHY_RIGHT, 0).x;
    if (r > FRAME.W - SAFE.side) fail(`the trophy breaks the right margin at the end (${r.toFixed(0)})`);
    if (TROPHY_X - TROPHY_W / 2 < CAR.reachOfLen * CAR_LEN + 120) fail("the cars rest too close to the trophy");
  }
}
