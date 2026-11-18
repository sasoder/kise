// ---------------------------------------------------------------------------
// SecondOnlyToTheCowboys (toto-worth-twelve, cut 1). Cheeky Pint style, the STOUT BOARD (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 114 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "Of every sports team in the world, only the Dallas Cowboys make more profit than Mercedes."
//
// THE LINE: "We are probably generating, other | than the Dallas Cowboys, the most profit of any sports team in
// the world."
// WORD -> FRAME: than 3 · the 7 · Dallas 10 · Cowboys 14 · the 32 · most 38 · profit 46 · of 62 · any 71 ·
// sports 76 · team 83 · in 93 · the 102 · world ~105 (notes/words.json, sequence s - 1.400, x 25).
// DURATION: the slot 1.400 -> 5.960 s = 4.56 s x 25 = 114 frames (f0..f113).
//
// THE MOTION: one camera move along a skyline. It opens close on the Dallas Cowboys crest tile (k 3.0), its tall
// cream profit bar already rising out of the slot, and pulls back up the bar as it lands ("Dallas Cowboys", lands
// f30, k ~1.6: the 473 px Cowboys pillar fits the 780 px keep-in box only at k <= 1.649, so most of the pull-back
// happens here). Travelling right, the light pool moves to the next tile, Mercedes, which lights from board to
// cream, and its AMBER profit bar rises to about half the Cowboys' height ("the most profit", f36-58). Then the
// camera eases back the last bit (k 1.5625, tiles 150 px) while still drifting right, and the rest of the world's teams (anonymous sport tiles, board bars, every one
// clearly lower than Mercedes) rise in a wave outward from the pair off both frame edges ("of any sports team in
// the world", f60-100). The resolved frame (f100-113, camera still creeping): the row runs off both edges, the
// cream Cowboys tower and the amber Mercedes tower stand together near the centre, #1 and #2. No numbers, no text.
// AMBER = Mercedes' money (here its profit); cream = the one the line names (the Cowboys); board = context.
//
// CAUSE -> EFFECT: each bar rises out of its own tile's slot (the slot joint). The Mercedes tile turns cream as
// the light pool reaches it (pool arrives ~f34, tone f32-44). The world's teams rise on a wave front leaving the
// pair (n-th tile from the pair starts at WAVE_F0 + (n-1) * WAVE_STEP).
//
// SCALE: worthShared PROFIT 600 px / $1B: Cowboys 377 px, Mercedes 180 px (snapped at k 1.5625).
// SOURCES (COMMON.md, out/wolff/briefs/data.md): Mercedes profit $300M (Toto's own figure, as in the financials
// clip); Dallas Cowboys operating income $629M (Forbes 2025 NFL valuations / Sportico): the most profitable team.
// Toto's "second only to the Cowboys" is his claim (Golden State's $409M, Forbes Oct 2025, is above Mercedes):
// no other NAMED team is drawn; the rest of the field is anonymous sport tiles, illustrative heights, no numbers.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  GEO,
  TILE_TOP,
  Pillar,
  StoutStage,
  amberBandFor,
  clamp01,
  easeOutCubic,
  smoothstep,
  snapLen,
  toScreen,
  type Figure,
} from "../kits/cheeky-pint/stoutShared";
import { camCheck, makeClockCam, makePoolTrack } from "../kits/cheeky-pint/museShared";
import { DATA, DY, FIG, KEEP, PITCH, X_MERC, profitH } from "./worthShared";
import type { SportName } from "../kits/cheeky-pint/wolffShared";

export const FPS = 25;
export const DURATION = 114;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- money and the row (worthShared: one PROFIT scale for the clip) -------------------------------------
// Cowboys left, Mercedes right (the camera travels right, toward Mercedes); the world's teams continue both
// ways at PITCH. Heights snapped at the resolved k.
const X_M = X_MERC;
const X_C = X_MERC - PITCH;
const X_PAIR = (X_C + X_M) / 2;
const K_END = 1.5625; // the resolved frame: tiles 150 px wide (the brief's floor)
const H_C = snapLen(profitH(DATA.COWBOYS_PROFIT), K_END); // $629M
const H_M = snapLen(profitH(DATA.MERC_PROFIT), K_END); // $300M

type World = { key: string; side: -1 | 1; n: number; x: number; figure: Figure; h: number };
const WORLD_N = 5; // per side (the outer ones only rise off frame)
// The anonymous cast (director, review 1): no star-like glyph beside the Cowboys star, so no SOCCER (its
// filled pentagon reads as a star). Four glyphs cycled along the row: no two neighbours alike.
const CAST: SportName[] = ["FOOTBALL", "BASKETBALL", "HOCKEY", "BASEBALL"];
// Heights (director, review 1): every rival 35-65 % of Mercedes' bar, growing with distance from the pair
// (so the pair stands out as the only towers), jittered +-3 % so no two read alike.
const RIVAL_LO = 0.35;
const RIVAL_HI = 0.65;
const rivalRatio = (n: number, slot: number) =>
  Math.max(RIVAL_LO, Math.min(RIVAL_HI, RIVAL_LO + ((RIVAL_HI - RIVAL_LO) * (n - 1)) / (WORLD_N - 1) + (hash01(slot + 3) - 0.5) * 0.06));
const hash01 = (n: number) => {
  const s = Math.sin(n * 91.7 + 13.1) * 43758.5453;
  return s - Math.floor(s);
};
export const WORLD: World[] = (() => {
  const out: World[] = [];
  for (const side of [-1, 1] as const) {
    for (let n = 1; n <= WORLD_N; n++) {
      const slot = side < 0 ? WORLD_N - n : WORLD_N + n - 1; // left to right along the row
      out.push({
        key: `${side}${n}`,
        side,
        n,
        x: (side < 0 ? X_C : X_M) + side * n * PITCH,
        figure: { kind: "sport", sport: CAST[slot % CAST.length] },
        // illustrative, no numbers
        h: snapLen(H_M * rivalRatio(n, slot), K_END),
      });
    }
  }
  return out;
})();

// --- timing ---------------------------------------------------------------------------------------------
export const T = {
  C_RISE: [-8, 30], // the Cowboys bar: already rising on f0, lands f30 ("Dallas Cowboys" 10-14, "the" 32)
  M_TONE: [30, 44], // the Mercedes tile lights board -> cream as the pool reaches it
  M_RISE: [36, 58], // Mercedes' amber bar ("most" 38, "profit" 46; lands before "of" 62)
  WAVE_F0: 60, // the first world pair starts rising ("of" 62)
  WAVE_STEP: 8, // per tile outward
  WAVE_RISE: 14, // one tile's entrance + bar
} as const;

/** One decelerating curve from rest to rest: p(t) = 1 - (1-t)^b (1 + b t). */
const flow = (t: number, b: number) => {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, b) * (1 + b * u);
};
const riseC = (f: number) => H_C * flow((f - T.C_RISE[0]) / (T.C_RISE[1] - T.C_RISE[0]), 2);
const riseM = (f: number) => H_M * flow((f - T.M_RISE[0]) / (T.M_RISE[1] - T.M_RISE[0]), 3);
const toneM = (f: number) => 1 - smoothstep((f - T.M_TONE[0]) / (T.M_TONE[1] - T.M_TONE[0]));
const worldState = (w: World, f: number) => {
  const s = T.WAVE_F0 + (w.n - 1) * T.WAVE_STEP + (w.side > 0 ? 2 : 0);
  const u = (f - s) / 12;
  if (u <= 0) return null;
  const e = clamp01(u);
  return {
    enter: e,
    lift: 1 - easeOutCubic(e),
    bar: w.h * flow((f - (s + 4)) / (T.WAVE_RISE - 2), 2.5),
  };
};

// --- the camera (look = the frame's middle, before the dy shift) -----------------------------------------
// OPEN close on the Cowboys tile; MID the Cowboys bar landed whole inside the keep-in box (its 473 px pillar
// fits 780 px only at k <= 1.649); END the resolved row, tiles 150 px, the pair centred, both edges cutting a
// tile. One pull-back throughout, fastest during the Cowboys rise, the last part over the world's wave.
const K_OPEN = 3.0;
const K_MID = 1.6;
const lookY = (floorScreenY: number, k: number) => GEO.FLOOR - (floorScreenY - 960) / k;
const OPEN = { x: X_C, y: lookY(1010, K_OPEN), k: K_OPEN };
const MID_X = X_PAIR - 6;
const END_X = X_PAIR + 6;
const MID_Y = lookY(1068, K_MID);
const END_Y = lookY(1062, K_END);
const CAM = makeClockCam(
  OPEN,
  [
    { f0: -24, f1: 30, k: K_MID, dy: MID_Y - OPEN.y, warp: 0.9 }, // eases back up the Cowboys bar
    { f0: 10, f1: 58, dx: MID_X - X_C, warp: 1 }, // travels right toward Mercedes
    { f0: 46, f1: 104, k: K_END, dy: END_Y - MID_Y, warp: 0.9 }, // pulls back over the world's wave
    { f0: 48, f1: 130, dx: END_X - MID_X, warp: 1 }, // and keeps travelling right
    { f0: 96, f1: 160, k: K_END * 1.015, warp: 1 }, // the creep into the tail: a slow lean in on the pair
  ],
  DURATION,
);

const POOL = makePoolTrack(
  { x: X_C, y: TILE_TOP - 60 },
  [
    { f0: -6, f1: 30, x: X_C, y: TILE_TOP - H_C * 0.5 },
    { f0: 24, f1: 46, x: X_M, y: TILE_TOP - 140 },
    { f0: 56, f1: 100, x: X_PAIR, y: TILE_TOP - H_C * 0.45 },
  ],
  DURATION,
);

const SecondOnlyToTheCowboys: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const half = 540 / k + GEO.TILE;
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={POOL(S)} dy={DY}>
      {WORLD.map((w) => {
        const st = worldState(w, S);
        if (!st || Math.abs(w.x - cam.x) > half) return null;
        return (
          <Pillar
            key={w.key}
            x={w.x}
            k={k}
            figure={w.figure}
            bar={st.bar}
            role="lo"
            enter={st.enter}
            lift={st.lift}
            amberBand={band}
          />
        );
      })}
      <Pillar x={X_C} k={k} figure={FIG.COWBOYS} bar={riseC(S)} role="hi" amberBand={band} />
      <Pillar x={X_M} k={k} figure={FIG.MERC} bar={riseM(S)} accent dim={toneM(S)} amberBand={band} />
    </StoutStage>
  );
};

export default SecondOnlyToTheCowboys;

// --- load-time checks -------------------------------------------------------------------------------------
export const CHECKS = (() => {
  const fail = (m: string) => {
    throw new Error(`SecondOnlyToTheCowboys: ${m}`);
  };
  if (WORLD.some((w) => w.h > H_M * (RIVAL_HI + 0.005) || w.h < H_M * (RIVAL_LO - 0.005))) fail("a rival outside 35-65 % of Mercedes");
  // neighbours never share a glyph
  const row = [...WORLD].sort((a, b) => a.x - b.x);
  row.forEach((w, i) => {
    const nb = row[i + 1];
    if (nb && nb.x - w.x === PITCH && w.figure.kind === "sport" && nb.figure.kind === "sport" && w.figure.sport === nb.figure.sport) fail(`neighbours ${w.key} ${nb.key} share a glyph`);
  });
  // collisions, every frame of the wave: no two drawn tiles (or bars) overlap in screen x, with the entrance slide
  const xs = [X_C, X_M, ...WORLD.map((w) => w.x)].sort((a, b) => a - b);
  if (new Set(xs).size !== xs.length) fail("two tiles on one x");
  for (let f = 0; f < DURATION; f++) {
    const cm = CAM.at(f);
    const drawn = [X_C, X_M, ...WORLD.filter((w) => worldState(w, f)).map((w) => w.x)].sort((a, b) => a - b);
    for (let i = 1; i < drawn.length; i++) {
      const gap = (drawn[i] - drawn[i - 1] - GEO.TILE) * cm.k;
      if (gap < 30) fail(`f${f}: tiles at ${drawn[i - 1]} and ${drawn[i]} only ${gap.toFixed(0)} px apart`);
    }
  }
  const c = camCheck(CAM.at, 0, DURATION - 1);
  const end = CAM.at(DURATION - 1);
  if (end.k * GEO.TILE < 149.5) fail(`resolved tiles ${(end.k * GEO.TILE).toFixed(0)} px wide`);
  // keep-in box (before dy): the pair on every frame from f30
  const out: string[] = [];
  for (let f = 0; f < DURATION; f++) {
    const cm = CAM.at(f);
    const topC = toScreen(cm, X_C, TILE_TOP - riseC(f)).y;
    const fl = toScreen(cm, X_C, GEO.FLOOR).y;
    const l = toScreen(cm, X_C - GEO.TILE / 2, 0).x;
    const r = toScreen(cm, X_M + GEO.TILE / 2, 0).x;
    if (topC < KEEP.y0 - 2 || fl > KEEP.y1 + 2 || l < KEEP.x0 || r > KEEP.x1) out.push(`f${f}: top ${topC.toFixed(0)} floor ${fl.toFixed(0)} l ${l.toFixed(0)} r ${r.toFixed(0)}`);
  }
  return { cam: c, keepIn: out };
})();
