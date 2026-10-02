import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_LIFT, CAM_STIFF } from "./fieldShared";
import {
  BAR_A,
  BAR_F0,
  BAR_F1,
  BEATS,
  DURATION,
  FPS,
  RISE_A,
  RISE_D,
  RIVALS,
  cameraTrackPre,
  flowFrac,
} from "./MostSponsorship";
import {
  GEO,
  MONEY,
  RUNG_F,
  TILE_TOP,
  Pillar,
  StoutStage,
  amberBandFor,
  camFor,
  clamp01,
  easeOutCubic,
  smoothstep,
  toScreen,
  type Figure,
  type Pool,
} from "./stoutShared";
import { camJerk, settleBump, type Cam, type Glide, type SportName } from "./wolffShared";
import type { CrestId } from "./wolffLogos";

// ---------------------------------------------------------------------------
// MostSponsorshipStout — Toto Wolff, "Mercedes F1 financials" (Cheeky Pint
// S4E01), cut 5, rebuilt in the STOUT system (stoutShared.tsx, chosen by the
// user, approved by the director). 1080x1920, 24 fps, opaque.
//
// THE LINE: "And if you look at Mercedes, things that are unknown, we are the
// team that's generating the most sponsorship of any sports team in the world."
// In 0:40.280. DURATION = round((48.520 - 40.280) x 24) = 198, + 16 = 214.
// Its own story clock: S = this cut's frame. Onsets, BEATS (MostSponsorship):
// and if 0 · look 15 · Mercedes 23 · things 47 · unknown 66 · we are 81 ·
// generating 104 · most 129 · sponsorship 136 · of any 152 · sports 170 ·
// team 178 · world 188 · speech ends 198.
//
// THE STORY (V2's, unchanged): ONE CLIMB — Mercedes' AMBER sponsorship tower
// rises out of its tile past four of the biggest names in sport, each dimming
// by tone as its top is passed; then the camera pulls back until every other
// team in the world is a low bar beside it: a skyline with one tower.
//
// THE LOOK (stout, new): the named five and the world stand on ONE row on the
// system's floor at its pitch (GEO.PITCH 128, X_NOW 544): Lakers, Man United,
// MERCEDES, Real Madrid, Cowboys at j = -2..2, the world's anonymous teams at
// |j| >= 3 — exactly the row of the style frames (StoutFrames C5Row). Every
// team is one Pillar (one union shadow, the slot joint): crests through the
// system's crest figure, Mercedes' bar the accent (amber, bloom on amber only),
// rivals dimmed by TONE (Pillar `dim`), the world on the dark board. Money:
// MONEY.C5_MERC_BAR (576 px = Mercedes' ~$558M); rivals and world as ratios.
// The resting framings are the style frames': the opening and the overtake
// rest = c5_overtake's camera (k 1.5625, floor on y 1368); the end = c5_end's
// (k 0.8125, floor on y 1108).
//
// GESTURES (gesture -> word -> frames; the mechanism and timing are V2's)
//   1. The four rivals' bars rise out of their slots together (ONE group move,
//      starts hashed -2..+2 f, 29 f, flow ease) -> "and if you look" -> f-2..f31.
//      Cream (hi). Mercedes' tile has no bar.
//   2. The camera, already moving on f0, pushes in on Mercedes' tile
//      (k 1.5625 -> 1.70) -> "look at Mercedes" -> glide f-8..f22.
//   3. The creep continues, long and even, to the tile's top edge (k 1.95),
//      then the HELD BREATH -> "things that are unknown" -> f14..f62, still
//      ~f72..f80. The light pool waits over the tile.
//   4. Mercedes' AMBER bar rises out of its slot: out of the breath, a steady
//      climb, onto 576 px with a 2 px zero-sloped settle -> "we are the team
//      that's generating the most" -> f80..f132 (+ settle to f142). The pool
//      climbs with it, lagging.
//   5. Each rival dims by TONE over 12 f (Pillar `dim`) on the frame Mercedes'
//      top passes its top (solved off the bar's track): Lakers f102.4, Cowboys
//      f107.5, Man United f110.4, Real Madrid f118.8 -> "generating ... most".
//   6. The camera rides the top up and eases back onto the overtake framing
//      (c5_overtake) -> "...the most sponsorship" -> glide f79..f138.
//   7. ONE pull-back onto c5_end while the world's teams rise from the ground
//      as the frame's edge reaches them (lifted while they move, settling on
//      landing) -> "of any sports team in the world" -> glide f138..f176; the
//      three pairs rise f140..f152, f160..f172, f175.7..f187.7 (landing on
//      "of any", "sports", "world").
//   8. Tail: the pull-back's decaying drift onto c5_end (k 0.8119 on f213;
//      the style frame is 0.8125) -> glide f176..f214.
//   CLICK: none (the director's "at most one" — my call, with the test in the
//   report): a LightSweep across the tower as it tops out does not work on a
//   tall, narrow amber body. Clipped to the tower's cap, its band ends in a
//   hard horizontal edge half-way down the tower and reads as a lit block;
//   across the whole 900 px tower the slanted band's glint runs down it at
//   ~100 px/f, three times the speed cap, in any click-length duration. The
//   climb and its overtakes are the payoff, as in V1 / V2.
//
// DATA (out/wolff/briefs/data.md; no numbers on screen): Mercedes F1 ~$558M
// (2025, SponsorUnited via The Race, 30 Apr 2026) = 576 px; Dallas Cowboys 0.54
// (Sportico 2025); Real Madrid 0.85, Manchester United 0.62, LA Lakers 0.40
// illustrative. The world's teams: StoutFrames' row, ratios 0.06-0.28.
// ---------------------------------------------------------------------------

export { BEATS, DURATION, FPS };

const X_NOW = GEO.X_NOW;
const PITCH = GEO.PITCH;
const FLOOR = GEO.FLOOR;
const MERC = MONEY.C5_MERC_BAR;

// -- the cast: one row ---------------------------------------------------------------
export type Team = {
  j: number;
  x: number;
  figure: Figure;
  /** full bar height, world px */
  h: number;
  kind: "rival" | "mercedes" | "world";
  /** rivals: the hashed start of their rise (V2's) */
  start?: number;
};
/** The named five, left to right (V1's order by x): Lakers, Man United, MERCEDES, Real Madrid, Cowboys. */
export const RIVALS_ROW: { id: CrestId; ratio: number; start: number; j: number }[] = [...RIVALS]
  .sort((a, b) => a.x - b.x)
  .map((r, i) => ({ id: r.id, ratio: r.ratio, start: r.start, j: [-2, -1, 1, 2][i] }));

// The world's row — StoutFrames' C5Row, exactly, so the end frame is the style frame's row.
const WORLD_SPORTS: SportName[] = ["BASEBALL", "HOCKEY", "SOCCER", "RACECAR", "FOOTBALL", "BASKETBALL"];
const hashW = (n: number) => {
  const s = Math.sin(n * 91.7 + 13.1) * 43758.5453;
  return s - Math.floor(s);
};
const worldTeam = (j: number) => {
  const idx = (Math.abs(j) * 2 + (j < 0 ? 1 : 0)) % WORLD_SPORTS.length;
  return { sport: WORLD_SPORTS[idx], ratio: 0.06 + 0.22 * hashW(j + 40) };
};
export const WORLD_SPAN = 6;

export const TEAMS: Team[] = (() => {
  const out: Team[] = [{ j: 0, x: X_NOW, figure: { kind: "mercedes" }, h: MERC, kind: "mercedes" }];
  for (const r of RIVALS_ROW) {
    out.push({ j: r.j, x: X_NOW + r.j * PITCH, figure: { kind: "crest", id: r.id }, h: r.ratio * MERC, kind: "rival", start: r.start });
  }
  for (let j = -WORLD_SPAN; j <= WORLD_SPAN; j++) {
    if (Math.abs(j) <= 2) continue;
    const w = worldTeam(j);
    out.push({ j, x: X_NOW + j * PITCH, figure: { kind: "sport", sport: w.sport }, h: w.ratio * MERC, kind: "world" });
  }
  return out;
})();

// -- the tracks (V2's mechanism) ---------------------------------------------------------
export const SETTLE_PX = 2;
export const SETTLE_F = 10;
export const rivalH = (t: Team, f: number) => t.h * flowFrac((f - (t.start ?? 0)) / RISE_D, RISE_A);
export const mercH = (f: number) => {
  if (f <= BAR_F0) return 0;
  if (f <= BAR_F1) return MERC * flowFrac((f - BAR_F0) / (BAR_F1 - BAR_F0), BAR_A);
  return MERC + settleBump(f - BAR_F1, SETTLE_F, SETTLE_PX);
};
/** The frame Mercedes' top passes each rival's top, solved off the bar's own track. */
export const OVERTAKE: Record<number, number> = (() => {
  const o: Record<number, number> = {};
  for (const t of TEAMS.filter((v) => v.kind === "rival")) {
    for (let f = BAR_F0; f <= BAR_F1; f += 0.01) {
      if (mercH(f) >= t.h) {
        o[t.j] = Number(f.toFixed(2));
        break;
      }
    }
  }
  return o;
})();
/** A rival's tone, 0 = cream (hi) .. 1 = board (lo), eased over RUNG_F from its overtake. */
export const rivalDim = (t: Team, f: number) => smoothstep((f - OVERTAKE[t.j]) / RUNG_F);

// -- the camera: the house rig, re-solved on the style frames' framings ---------------------
/** c5_overtake's camera (StoutFrames CAM5O) and c5_end's (CAM5E). */
export const CAM_OVER: Cam = camFor(X_NOW, FLOOR, 540, 1368, 1.5625);
export const CAM_END: Cam = camFor(X_NOW, FLOOR, 540, 1108, 0.8125);
const lookOf = (c: Cam) => c.y - CAM_LIFT / c.k; // cameraTrackPre's look = centre - CAM_LIFT / k
export const LOOK_OVER = lookOf(CAM_OVER);
export const LOOK_END = lookOf(CAM_END);
export const LOOK_TILE = TILE_TOP; // the breath: the top edge of Mercedes' tile on y 835
export const K_ARRIVE = 1.7;
export const K_BREATH = 1.95;
const ARRIVE_DY = 30; // most of the tilt is left to the long creep, so the rivals' tops stay well under the cap
export const K_PULL = 0.88; // the pull-back's own target
export const K_DRIFT = 0.81; // the drift's target: with the damper the cut ends on k 0.8119 (c5_end: 0.8125)
export const GLIDES: Glide[] = [
  // 2. in on Mercedes' tile, arriving as "Mercedes" lands
  { f0: -8, f1: 22, k: K_ARRIVE, dy: ARRIVE_DY, warp: 0.9 },
  // 3. the long even creep to the tile's top edge; still by ~f72
  { f0: 14, f1: 62, k: K_BREATH, dy: LOOK_TILE - LOOK_OVER - ARRIVE_DY, warp: 1.0 },
  // 6. ride the top up and ease back onto the overtake framing
  { f0: 79, f1: 138, k: CAM_OVER.k, dy: LOOK_OVER - LOOK_TILE, warp: 0.9 },
  // 7. the pull-back onto the world (a little early-weighted, so the world's pairs rise evenly)
  { f0: 138, f1: 176, k: K_PULL, dy: LOOK_END - LOOK_OVER, warp: 0.85 },
  // 8. an early-weighted drift laid over its landing: the tail, decaying onto c5_end
  { f0: 176, f1: 214, k: K_DRIFT, warp: 0.6 },
];
export const CAM: Cam[] = cameraTrackPre({ x: X_NOW, y: LOOK_OVER, k: CAM_OVER.k }, GLIDES, DURATION, 30);
export const camAt = (f: number): Cam => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];
const kAt = (f: number) => {
  const a = Math.max(0, Math.min(CAM.length - 2, Math.floor(f)));
  const t = f - a;
  return CAM[a].k * (1 - t) + CAM[a + 1].k * t;
};

// -- the world's reveal -------------------------------------------------------------------
// A team rises from the ground as the frame's edge reaches it: its rise starts when the
// edge, E(f) = (540 - 6) / k(f) world px from the camera centre (6 px for sway), passes the
// tile's INNER edge, and it settles RISE_W frames later — it is still rising as it comes
// into view. No team starts before WORLD_F_FIRST (the bar has landed; the pull-back begins).
// A team the edge never reaches stays out of frame and is not drawn.
export const RISE_W = 12;
export const WORLD_F_FIRST = 140;
const frameEdge = (f: number) => (540 - 6) / kAt(f);
export const RISE_START: Record<number, number | null> = (() => {
  const o: Record<number, number | null> = {};
  for (const t of TEAMS.filter((v) => v.kind === "world")) {
    const inner = Math.abs(t.x - X_NOW) - GEO.TILE / 2;
    let s: number | null = null;
    for (let f = WORLD_F_FIRST; f < DURATION; f += 0.05) {
      if (frameEdge(f) >= inner) {
        s = Number(f.toFixed(2));
        break;
      }
    }
    o[t.j] = s;
  }
  return o;
})();
/** A world team at frame f: entrance 0..1 (the house entrance: slide up + fade), its lift
 *  (one elevation level while it moves, settling back on landing), its bar growing out of
 *  the slot over the second half of the rise. null = not risen (or never in frame). */
export const worldState = (t: Team, f: number) => {
  const s = RISE_START[t.j];
  if (s === null || s === undefined) return null;
  const u = (f - s) / RISE_W;
  if (u <= 0) return null;
  const e = clamp01(u);
  return {
    enter: e,
    lift: 1 - easeOutCubic(e),
    bar: t.h * smoothstep((f - (s + RISE_W * 0.35)) / (RISE_W * 0.85)),
  };
};

// -- the light pool: follows the subject (Mercedes' tower) with a lag -----------------------
// Target: the middle of Mercedes' bar, held between 150 and 300 px over the tile top (the
// style frames rest it at TILE_TOP - 300); followed by the camera's own damper.
const poolTarget = (f: number) => TILE_TOP - Math.max(150, Math.min(300, mercH(f) * 0.52));
export const POOL_Y: number[] = (() => {
  const out: number[] = [];
  let y = poolTarget(-30);
  let v = 0;
  for (let f = -30; f < DURATION + 2; f++) {
    v = v + (poolTarget(f) - y) * CAM_STIFF - v * CAM_DAMP;
    y += v;
    if (f >= 0) out.push(y);
  }
  return out;
})();

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const MostSponsorshipStout: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const pool: Pool = { x: X_NOW, y: POOL_Y[Math.max(0, Math.min(POOL_Y.length - 1, S))] };
  const half = 540 / k + GEO.TILE;
  const merc = mercH(S);

  return (
    <StoutStage S={S} cam={cam} rest={CAM[0]} pool={pool}>
      {TEAMS.filter((t) => t.kind === "world").map((t) => {
        const w = worldState(t, S);
        if (!w || Math.abs(t.x - cam.x) > half) return null;
        return (
          <Pillar
            key={`w${t.j}`}
            x={t.x}
            k={k}
            figure={t.figure}
            bar={w.bar}
            role="lo"
            enter={w.enter}
            lift={w.lift}
            amberBand={band}
          />
        );
      })}
      {TEAMS.filter((t) => t.kind === "rival").map((t) => (
        <Pillar key={`r${t.j}`} x={t.x} k={k} figure={t.figure} bar={rivalH(t, S)} dim={rivalDim(t, S)} amberBand={band} />
      ))}
      <Pillar x={X_NOW} k={k} figure={{ kind: "mercedes" }} bar={merc} accent role="hi" amberBand={band} />
    </StoutStage>
  );
};

export default MostSponsorshipStout;

// ---------------------------------------------------------------------------
// Load-time checks: the rules the cut rests on.
// ---------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`MostSponsorshipStout: ${m}`);
  };
  if (BAR_F1 > BEATS.sponsorship - 4 || BAR_F1 < BEATS.sponsorship - 10) fail("the tower does not land 4-10 f before 'sponsorship'");
  if (TEAMS.some((t) => t.kind !== "mercedes" && t.h >= MERC)) fail("a team is not below Mercedes");
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) fail(`camera |dv| ${j.maxA.toFixed(2)} px/f^2 at f${j.at}`);
  // every head under 45 screen px/f
  type P = { x: number; y: number } | null;
  const heads: ((f: number) => P)[] = [
    ...TEAMS.filter((t) => t.kind === "rival").map((t) => (f: number) => toScreen(camAt(f), t.x, TILE_TOP - rivalH(t, f))),
    (f: number) => toScreen(camAt(f), X_NOW, TILE_TOP - mercH(f)),
    ...TEAMS.filter((t) => t.kind === "world").map((t) => (f: number) => {
      const w = worldState(t, f);
      return w ? toScreen(camAt(f), t.x, TILE_TOP - w.bar + ((1 - easeOutCubic(w.enter)) * 24) / camAt(f).k) : null;
    }),
  ];
  heads.forEach((fn, h) => {
    for (let f = 1; f < DURATION; f++) {
      const a = fn(f - 1);
      const b = fn(f);
      if (!a || !b) continue;
      const v = Math.hypot(b.x - a.x, b.y - a.y);
      if (v > 45) fail(`head ${h} moves ${v.toFixed(1)} px on f${f}`);
    }
  });
  // the caption band: the floor (and its contact shadow) above y 1400 on every frame
  for (let f = 0; f < DURATION; f++) {
    const y = toScreen(camAt(f), X_NOW, FLOOR + 3).y;
    if (y > 1400) fail(`the floor reaches y ${y.toFixed(0)} on f${f}`);
  }
}
