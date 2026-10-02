import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_LIFT, CAM_STIFF, camEase, hash } from "./fieldShared";
import {
  BAR_W,
  type Cam,
  GROUND_Y,
  type Glide,
  INK_HI,
  INK_LO,
  KraftStage,
  LOGO_FRACTION,
  LogoTile,
  MercedesTile,
  MoneyBar,
  RUNG_F,
  SPORT_NAMES,
  type SportName,
  SportTile,
  TILE,
  TILE_TOP,
  X_NOW,
  camJerk,
  clamp01,
  easeOut,
  lerp,
  rung,
  settleBump,
  smoothstep,
  toScreen,
} from "./wolffShared";
import { CRESTS, type Crest, type CrestId } from "./wolffLogos";

// ---------------------------------------------------------------------------
// MostSponsorship — Toto Wolff, "Mercedes F1 financials" (Cheeky Pint S4E01),
// cut 5 of 5. Cheeky Pint style, opaque kraft, 1080x1920, 24 fps.
//
// THE LINE: "And if you look at Mercedes, things that are unknown, we are the
// team that's generating the most sponsorship of any sports team in the world."
// In 0:40.280 on the 54.6 s edit. Speech ends 48.520.
// DURATION = round((48.520 - 40.280) x 24) = round(197.76) = 198, + 16-frame
// tail = 214. The cut has its own story clock: S = this cut's frame.
//
// ONSETS (f, from the SRT; checked against media-to-srt output):
//   and if 0 · you 12 · look 15 · at 19 · Mercedes 23 · things 47 · that 60 ·
//   are 64 · unknown 66 · we are 81 · the 91 · team 94 · that's 98 ·
//   generating 104 · the 116 · most 129 · sponsorship 136 · of any 152 ·
//   sports 170 · team 178 · in the 182 · world 188 · speech ends 198.
//
// ONE SENTENCE OF MOTION: ONE CLIMB — Mercedes' sponsorship bar rises out of
// its tile and overtakes four of the biggest names in sport, then the camera
// pulls back until every other team in the world is below it.
//
// THE PICTURE (the clip's one world, this cut's own scale): a team is a tile
// standing on its contact shadow; the money it takes in (here: sponsorship) is
// a white bar standing on the tile's top edge. Mercedes = the star tile. The
// four named rivals = crest tiles (placeholder sport tiles until the crest
// files arrive: wolffLogos.ts). The world = one row of anonymous sport tiles
// with short bars on the same ground line, all at INK_LO: the resolved frame is
// a skyline of low bars with Mercedes' single tower in the middle. NOTHING is
// amber in this cut (amber = profit). No numbers and no labels on screen.
//
// GESTURES (gesture -> the word it serves -> frames). Every frame below is the
// built track's, measured; the camera numbers are the damped follower's.
//   1. The four rivals' bars rise out of their tiles together, ONE group move
//      (starts hashed -2..+2 f: Real Madrid -2, Lakers -1, Cowboys +1, Man
//      United +2; 29 f each on the flow ease) -> "and if you look" -> f-2..f31.
//      INK_HI. Mercedes' tile has no bar.
//   2. The camera, already creeping on f0 (pre-rolled), pushes in on Mercedes'
//      tile, k 1.23 -> 1.37 -> "look at Mercedes" -> glide f-8..f22, k 1.365
//      on f23.
//   3. The creep continues, long and even (warp 1.0), down to the top edge of
//      the tile, k -> 1.46; then the HELD BREATH, camera < 0.1 px/f
//      -> "things that are unknown" -> glide f14..f66, still f72..f80.
//   4. Mercedes' bar rises out of its tile: accelerates out of the breath,
//      climbs steadily (flow ease, peak 19 world px/f), decelerates onto 700 px
//      with a 3 px zero-sloped settle -> "we are the team that's generating the
//      most" -> f80..f132, settle to f142 (lands 4 f before "sponsorship").
//   5. As its top passes each rival's top, that rival's tile and bar ease
//      INK_HI -> INK_LO over 12 f (`rung`), on the crossing frames solved off the
//      bar's own track (OVERTAKE_F): Lakers f102.4, Cowboys f107.5, Man United
//      f110.4, Real Madrid f118.8 — the overtakes alternate sides
//      -> "generating ... the most" -> f102..f131.
//   6. The camera rides the top up and eases back, k 1.46 -> 1.05, look from the
//      tile's top edge to the resolved picture's centre -> "we are the team
//      that's generating the most sponsorship" -> glide f79..f138.
//   7. ONE big pull-back, k 1.05 -> 0.511, while the world rises: ONE ROW of
//      anonymous teams on the named five's ground line, running out both sides
//      at the tighter pitch 128; each team rises from the ground as the frame's
//      edge reaches it, so the camera reveals it (the reveal, below)
//      -> "of any sports team in the world" -> glide f134..f182; the five pairs
//      settle f150 / f157 / f166 / f174 / f185, resolving on "world" (f188).
//   8. Tail: the pull-back's decaying drift, k 0.511 (f188) -> 0.4875 (f213),
//      which slides the sixth team on each side in at the frame's edges,
//      already standing, until the edges cut it in half: the row runs off both
//      edges, it continues beyond the frame -> held picture -> glide f170..f220.
//   No click in this cut (group arrivals never click). Mercedes' tile and bar
//   stay INK_HI throughout.
//
// DATA (out/wolff/briefs/data.md; no numbers on screen):
//   Mercedes F1 sponsorship ~$558M, 2025 season (SponsorUnited via The Race,
//   30 Apr 2026) = 700 world px in this cut.
//   Dallas Cowboys ~$300M (Sportico 2025) -> 0.54 x 700 = 378 px (sourced).
//   Real Madrid 0.85 (595 px), Manchester United 0.62 (434 px), LA Lakers 0.40
//   (280 px): ILLUSTRATIVE (published club figures are broader commercial
//   revenue, not sponsorship-only). Toto's claim is his; the picture shows his
//   claim with every rival below him.
//   The world's anonymous teams: illustrative texture, bars hashed 0.06-0.28
//   x 700 (42-196 px; the drawn ones run 46-144), every one far under the
//   Lakers' 280.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 214;

export const BEATS = {
  andIf: 0,
  you: 12,
  look: 15,
  at: 19,
  mercedes: 23,
  things: 47,
  that: 60,
  are: 64,
  unknown: 66,
  weAre: 81,
  the: 91,
  team: 94,
  thats: 98,
  generating: 104,
  theMost: 116,
  most: 129,
  sponsorship: 136,
  ofAny: 152,
  sports: 170,
  team2: 178,
  inThe: 182,
  world: 188,
  end: 198,
} as const;

// -- the travel ease -----------------------------------------------------------
/** FLOW: the velocity ramps up (smoothstep) over the first `a` of the window,
 *  holds one speed, ramps down over the last `a`. Peak speed 1 / (1 - a) of
 *  the average, so a long climb reads as steady, never as a lurch. */
export const flowFrac = (u: number, a: number) => {
  const x = clamp01(u);
  const ramp = (g: number) => a * (g * g * g - (g * g * g * g) / 2);
  const area = 1 - a;
  if (x < a) return ramp(x / a) / area;
  if (x > 1 - a) return (area - ramp((1 - x) / a)) / area;
  return (a / 2 + (x - a)) / area;
};

// -- the cast -----------------------------------------------------------------
export const MERC_BAR = 700; // ~$558M (2025) = 700 world px
export const PITCH = 170;

export const SPORTS: readonly SportName[] = SPORT_NAMES;

export type Rival = { id: CrestId; x: number; ratio: number; h: number; placeholder: SportName; start: number };
const RIVAL_DEFS: { id: CrestId; x: number; ratio: number; placeholder: SportName }[] = [
  { id: "LAKERS", x: 200, ratio: 0.4, placeholder: "BASKETBALL" }, // illustrative
  { id: "MANUTD", x: 370, ratio: 0.62, placeholder: "SOCCER" }, // illustrative
  { id: "REALMADRID", x: 710, ratio: 0.85, placeholder: "SOCCER" }, // illustrative
  { id: "COWBOYS", x: 880, ratio: 0.54, placeholder: "FOOTBALL" }, // Sportico 2025, ~$300M
];

// Gesture 1: one group rise, each bar's start hashed in -2..+2 f.
export const RISE_D = 29;
export const RISE_A = 0.25;
export const RIVALS: Rival[] = RIVAL_DEFS.map((r, i) => ({
  ...r,
  h: r.ratio * MERC_BAR,
  start: Math.round(hash(i + 3, 26) * 4) - 2, // -1, +2, -2, +1
}));
export const rivalH = (i: number, f: number) => RIVALS[i].h * flowFrac((f - RIVALS[i].start) / RISE_D, RISE_A);

// Gesture 4: Mercedes' bar. Out of the breath at f80, lands on 700 at f132
// (4 f before "sponsorship"), then a 3 px zero-sloped settle (sin^2) to f142.
export const BAR_F0 = 80;
export const BAR_F1 = 132;
export const BAR_A = 0.3;
export const SETTLE_PX = 3;
export const SETTLE_F = 10;
export const mercH = (f: number) => {
  if (f <= BAR_F0) return 0;
  if (f <= BAR_F1) return MERC_BAR * flowFrac((f - BAR_F0) / (BAR_F1 - BAR_F0), BAR_A);
  return MERC_BAR + settleBump(f - BAR_F1, SETTLE_F, SETTLE_PX);
};

// Gesture 5: the frame Mercedes' top passes each rival's top, solved off the
// bar's own track (never typed): that is when the rival is reached.
export const OVERTAKE_F: number[] = RIVALS.map((r) => {
  for (let f = BAR_F0; f <= BAR_F1; f += 0.01) if (mercH(f) >= r.h) return Number(f.toFixed(2));
  return BAR_F1;
});
export const DIM_F = RUNG_F; // 12 f, the clip's rung change
export const rivalOp = (i: number, f: number) => rung(f, OVERTAKE_F[i], INK_HI, INK_LO);

// -- the camera ---------------------------------------------------------------
// The outgrowShared rig (glides superposed on look x / look y / ln k, then the
// CAM_STIFF / CAM_DAMP follower), with one addition: the follower is PRE-ROLLED
// from f -PRE so the camera is already creeping on f0 — the cut opens moving.
// `look` is the content centre; the camera centre is look + CAM_LIFT / k.
export const CAM_PRE = 30;
export const cameraTrackPre = (start: Cam, glides: Glide[], frames: number, pre: number): Cam[] => {
  const T: Cam[] = [];
  for (let f = -pre; f <= frames + 2; f++) {
    let x = start.x;
    let y = start.y;
    let lk = Math.log(start.k);
    let kPrev = start.k;
    for (const g of glides) {
      const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp ?? 1);
      x += (g.dx ?? 0) * e;
      y += (g.dy ?? 0) * e;
      if (g.k !== undefined) {
        lk += (Math.log(g.k) - Math.log(kPrev)) * e;
        kPrev = g.k;
      }
    }
    const k = Math.exp(lk);
    T.push({ x, y: y + CAM_LIFT / k, k });
  }
  const out: Cam[] = [];
  let c = { ...T[0] };
  let v = { x: 0, y: 0, k: 0 };
  for (let i = 0; i < T.length; i++) {
    if (i > 0) {
      const t = T[i];
      v = {
        x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
        y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
        k: v.k + (t.k - c.k) * CAM_STIFF - v.k * CAM_DAMP,
      };
      c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    }
    if (i >= pre) out.push({ ...c });
  }
  return out;
};

// Framing. LOOK_OPEN puts the five tiles low in an open frame with the room
// above them that the bars will fill; LOOK_TILE is the top edge of Mercedes'
// tile (where the bar comes out); LOOK_WIDE centres the resolved picture
// (Mercedes' top 504 .. the contact shadows ~1306) on screen y 835.
export const K_OPEN = 1.22;
export const LOOK_OPEN = 1110;
export const LOOK_TILE = TILE_TOP;
export const LOOK_WIDE = (TILE_TOP - MERC_BAR + GROUND_Y + 6) / 2;
export const K_ARRIVE = 1.37;
export const K_BREATH = 1.46;
export const K_RIDE = 1.05;
export const K_WIDE = 0.53; // the pull-back's own target: with the damper it reads k 0.511 on "world"
export const K_TAIL = 0.485; // the drift's target, reached just past the cut: k 0.4875 on f213
const ARRIVE_DY = 25; // most of the tilt is left to the long creep, so the rivals' tops stay under the speed cap
export const GLIDES: Glide[] = [
  // 2. creep in on Mercedes' tile, arriving as "Mercedes" lands
  { f0: -8, f1: 22, k: K_ARRIVE, dy: ARRIVE_DY, warp: 0.9 },
  // 3. the creep continues, long and even, to the tile's top edge; still by ~f72
  { f0: 14, f1: 66, k: K_BREATH, dy: LOOK_TILE - LOOK_OPEN - ARRIVE_DY, warp: 1.0 },
  // 6. ride the top up and ease back
  { f0: 79, f1: 138, k: K_RIDE, dy: LOOK_WIDE - LOOK_TILE, warp: 0.9 },
  // 7. the big pull-back, resolving on "world"
  { f0: 134, f1: 182, k: K_WIDE, warp: 1.0 },
  // 8. an early-weighted drift laid over its landing: what is left of it after
  //    "world" is the tail's decaying drift (|d ln k| 4.0e-3 on f188 falling
  //    smoothly to 0.9e-3 on f213; it would stop on f220, past the cut)
  { f0: 170, f1: 220, k: K_TAIL, warp: 0.6 },
];
export const CAM: Cam[] = cameraTrackPre({ x: X_NOW, y: LOOK_OPEN, k: K_OPEN }, GLIDES, DURATION, CAM_PRE);
export const camAt = (f: number): Cam => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];
const kAt = (f: number) => {
  const a = Math.max(0, Math.min(CAM.length - 2, Math.floor(f)));
  const t = f - a;
  return CAM[a].k * (1 - t) + CAM[a + 1].k * t;
};

// -- the world -----------------------------------------------------------------
// ONE ROW of anonymous teams on the same ground line as the named five,
// extending outward on both sides at a tighter pitch than the named row
// (WORLD_PITCH 128 against 170), so the row gets denser as it goes out. The
// same 96 tile; bars hashed WORLD_LO..WORLD_HI x 700, every one well under the
// Lakers' 280; glyphs hashed, no two neighbours alike; all INK_LO. The resolved
// frame's edges cut the sixth team on each side in half, so the row runs off
// both edges: it continues beyond the frame.
export const WORLD_PITCH = 128;
export const WORLD_PER_SIDE = 9; // six reach the resolved frame, the rest are beyond it
export const WORLD_LO = 0.06;
export const WORLD_HI = 0.28;

export type WorldTile = {
  x: number;
  /** -1 left of the named five, +1 right */
  side: -1 | 1;
  /** 1 = next to the named five, counting outward */
  j: number;
  sport: SportName;
  /** bar height, world px */
  h: number;
  /** the frame it settles after rising as the frame's edge reaches it; null =
   *  beyond the frame until the tail, already standing (never seen to rise) */
  settle: number | null;
};

// THE REVEAL. A team rises from the ground as the frame's edge reaches it. The
// edge, in world px from the camera centre, is E(f) = (540 - 6) / k(f) (6 px
// for sway); a team settles the moment it is fully in frame (E reaches its
// outer edge), having risen over the RISE_W frames before, so it is still
// rising as it comes into view. Two clamps keep the approved phases clean: no
// team settles before WORLD_F_FIRST, so nothing rises while the bar is still
// landing; and a team the pull-back has not fully revealed by "world" never
// rises at all: it is the row continuing beyond the frame, already standing
// when the tail's drift slides it in at the edge.
export const RISE_W = 12;
export const WORLD_F_FIRST = 150; // the first pair rises over f138-150, landing 2 f before "of any" (f152)
export const WORLD_F_LAST = 188; // "world"
const frameEdge = (f: number) => (540 - 6) / kAt(f);
const fullyInAt = (outer: number) => {
  for (let f = BAR_F1; f < DURATION; f += 0.05) if (frameEdge(f) >= outer) return Number(f.toFixed(2));
  return null;
};

export const WORLD: WorldTile[] = (() => {
  type Slot = { x: number; side: -1 | 1; j: number; fixed?: SportName | null };
  const slots: Slot[] = [
    ...RIVALS.map((r) => ({ x: r.x, side: 1 as const, j: 0, fixed: r.placeholder })),
    { x: X_NOW, side: 1 as const, j: 0, fixed: null },
  ];
  const left = Math.min(...RIVALS.map((r) => r.x));
  const right = Math.max(...RIVALS.map((r) => r.x));
  for (let j = 1; j <= WORLD_PER_SIDE; j++) {
    slots.push({ x: left - WORLD_PITCH * j, side: -1, j });
    slots.push({ x: right + WORLD_PITCH * j, side: 1, j });
  }
  slots.sort((a, b) => a.x - b.x);
  const out: WorldTile[] = [];
  // left to right: no two neighbours alike, and for variety no glyph repeats
  // within two places either (an A-B-A run reads as a pattern); a named slot
  // (the Lakers' and Cowboys' placeholders, Mercedes) counts as a neighbour
  const seq: (SportName | null)[] = [];
  slots.forEach((slot, i) => {
    if (slot.fixed !== undefined) {
      seq.push(slot.fixed);
      return;
    }
    const near = [seq[seq.length - 1], seq[seq.length - 2], slots[i + 1]?.fixed, slots[i + 2]?.fixed];
    let idx = Math.floor(hash(i, 29) * SPORTS.length);
    for (let n = 0; n < SPORTS.length && near.includes(SPORTS[idx]); n++) {
      idx = (idx + 1) % SPORTS.length;
    }
    const sport = SPORTS[idx];
    seq.push(sport);
    const h = lerp(WORLD_LO, WORLD_HI, hash(Math.round(slot.x), 71)) * MERC_BAR;
    const full = fullyInAt(Math.abs(slot.x - X_NOW) + TILE / 2);
    const settle = full !== null && full <= WORLD_F_LAST ? Math.max(WORLD_F_FIRST, full) : null;
    out.push({ x: slot.x, side: slot.side, j: slot.j, sport, h, settle });
  });
  return out;
})();

export const worldState = (t: WorldTile, f: number) => {
  if (t.settle === null) return { presence: 1, op: INK_LO, dy: 0, bar: t.h };
  const u = (f - (t.settle - RISE_W)) / RISE_W;
  if (u <= 0) return null;
  const e = easeOut(u);
  const lift = (1 - e) * 0.3 * TILE; // world px below its place at the start: it rises from the ground
  const bar = t.h * smoothstep((f - (t.settle - 6)) / 10);
  return { presence: e, op: INK_LO * e, dy: lift, bar };
};

// -- a crest -------------------------------------------------------------------
// A named rival's crest as LogoTile's `figure`: the 1-bit markup from
// wolffLogos.ts, fitted and centred in `fraction` of the tile exactly the way
// LogoTile fits its own paths.
const crestFigure = (crest: Crest, size: number) => {
  const [vx, vy, vw, vh] = crest.viewBox.trim().split(/[\s,]+/).map(Number);
  const sc = (size * (crest.fraction ?? LOGO_FRACTION)) / Math.max(vw, vh);
  const ox = (size - vw * sc) / 2 - vx * sc;
  const oy = (size - vh * sc) / 2 - vy * sc;
  return (
    <g
      transform={`translate(${ox.toFixed(3)} ${oy.toFixed(3)}) scale(${sc.toFixed(5)})`}
      dangerouslySetInnerHTML={{ __html: crest.markup }}
    />
  );
};

// -- one team -----------------------------------------------------------------
// A team at row scale `s` is the clip's team at s x size: tile TILE * s standing
// on (x, base + dy) — the centre of its bottom edge — and its bar BAR_W * s wide
// standing on the tile's top edge.
type TileDraw = (p: { x: number; y: number; size: number; op: number }) => React.ReactNode;
const Team: React.FC<{
  x: number;
  base: number;
  s: number;
  k: number;
  bar: number;
  op: number;
  dy?: number;
  tile: TileDraw;
}> = ({ x, base, s, k, bar, op, dy = 0, tile }) => {
  if (op <= 0.002) return null;
  const size = TILE * s;
  return (
    <g>
      {tile({ x, y: base + dy, size, op })}
      <MoneyBar x={x} baseY={base + dy - size} h={bar} k={k} opacity={op} w={BAR_W * s} />
    </g>
  );
};

export const schema = z.object({
  /** "auto" draws a crest wherever wolffLogos has one; "placeholder" forces the sport tiles */
  crests: z.enum(["auto", "placeholder"]),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ crests: "auto" });

const MostSponsorship: React.FC<Props> = ({ crests }) => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;

  const rivalTile: (i: number) => TileDraw = (i) => {
    const r = RIVALS[i];
    const crest = crests === "auto" ? CRESTS[r.id] : undefined;
    const draw: TileDraw = ({ x, y, size, op }) =>
      crest ? (
        <LogoTile x={x} y={y} k={k} size={size} opacity={op} figure={crestFigure(crest, size)} />
      ) : (
        <SportTile x={x} y={y} k={k} size={size} sport={r.placeholder} opacity={op} />
      );
    return draw;
  };
  const sportTile: (sport: SportName) => TileDraw = (sport) => {
    const draw: TileDraw = ({ x, y, size, op }) => <SportTile x={x} y={y} k={k} size={size} sport={sport} opacity={op} />;
    return draw;
  };
  // the row's teams beyond the frame are skipped: nothing is drawn off screen
  const half = 540 / k + TILE;

  return (
    <KraftStage S={S} cam={cam} rest={CAM[0]}>
      {WORLD.map((t) => {
        const w = worldState(t, S);
        if (!w || Math.abs(t.x - cam.x) > half) return null;
        return (
          <Team
            key={`w${t.x}`}
            x={t.x}
            base={GROUND_Y}
            s={1}
            k={k}
            bar={w.bar}
            op={w.op}
            dy={w.dy}
            tile={sportTile(t.sport)}
          />
        );
      })}
      {RIVALS.map((r, i) => (
        <Team key={r.id} x={r.x} base={GROUND_Y} s={1} k={k} bar={rivalH(i, S)} op={rivalOp(i, S)} tile={rivalTile(i)} />
      ))}
      <Team
        x={X_NOW}
        base={GROUND_Y}
        s={1}
        k={k}
        bar={mercH(S)}
        op={INK_HI}
        tile={({ x, y, size }) => <MercedesTile x={x} y={y} k={k} size={size} opacity={INK_HI} />}
      />
    </KraftStage>
  );
};

export default MostSponsorship;

// ---------------------------------------------------------------------------
// The joins the cut rests on, asserted at module load.
// ---------------------------------------------------------------------------
if (BAR_F1 > BEATS.sponsorship - 4 || BAR_F1 < BEATS.sponsorship - 10) {
  throw new Error(`MostSponsorship: the bar lands on f${BAR_F1}, not 4-10 f before "sponsorship" (f${BEATS.sponsorship})`);
}
if (RIVALS.some((r) => r.h >= MERC_BAR)) {
  throw new Error("MostSponsorship: a rival is not below Mercedes");
}
{
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) throw new Error(`MostSponsorship: camera |dv| ${j.maxA.toFixed(2)} px/f^2 at f${j.at} > 2.5`);
}
// Every head under 45 screen px/frame: the rivals' tops, Mercedes' top, and
// every world team's bar top while it rises.
{
  type P = { x: number; y: number } | null;
  const heads: ((f: number) => P)[] = [
    ...RIVALS.map((r, i) => (f: number) => toScreen(camAt(f), r.x, TILE_TOP - rivalH(i, f))),
    (f: number) => toScreen(camAt(f), X_NOW, TILE_TOP - mercH(f)),
    ...WORLD.map((t) => (f: number) => {
      const w = worldState(t, f);
      return w ? toScreen(camAt(f), t.x, GROUND_Y + w.dy - TILE - w.bar) : null;
    }),
  ];
  heads.forEach((fn, h) => {
    for (let f = 1; f < DURATION; f++) {
      const a = fn(f - 1);
      const b = fn(f);
      if (!a || !b) continue;
      const v = Math.hypot(b.x - a.x, b.y - a.y);
      if (v > 45) throw new Error(`MostSponsorship: head ${h} moves ${v.toFixed(1)} px on f${f} (> 45)`);
    }
  });
}
// THE ROW. Every anonymous bar far under the shortest named rival's; the
// resolved frame holds 17-21 teams and its edges cut a team on BOTH sides (the
// row runs off the frame); a team that never rises is out of frame until
// "world" (nothing appears standing mid-reveal).
{
  const lakers = Math.min(...RIVALS.map((r) => r.h));
  if (WORLD.some((t) => t.h > WORLD_HI * MERC_BAR + 0.01 || t.h >= lakers)) {
    throw new Error("MostSponsorship: an anonymous bar reaches the shortest named rival's");
  }
  const c = CAM[DURATION - 1];
  const H = 540 / c.k;
  const inFrame = WORLD.filter((t) => Math.abs(t.x - c.x) - TILE / 2 < H).length + RIVALS.length + 1;
  if (inFrame < 17 || inFrame > 21) throw new Error(`MostSponsorship: ${inFrame} teams in the resolved frame, not 17-21`);
  for (const side of [-1, 1]) {
    const cut = WORLD.some((t) => t.side === side && Math.abs(Math.abs(t.x - c.x) - H) < TILE * 0.3);
    if (!cut) throw new Error(`MostSponsorship: the resolved frame's ${side < 0 ? "left" : "right"} edge does not cut a team`);
  }
  for (let f = 0; f <= WORLD_F_LAST; f++) {
    const cf = CAM[f];
    const seen = WORLD.find((t) => t.settle === null && Math.abs(t.x - cf.x) - TILE / 2 < 540 / cf.k);
    if (seen) throw new Error(`MostSponsorship: the standing team at x ${seen.x} is in frame on f${f}, before "world"`);
  }
}
// The caption band: no subject ink below screen y 1400 on any frame (every tile's
// foot, contact shadow included, while it is in frame).
for (let f = 0; f < DURATION; f++) {
  const c = camAt(f);
  const feet = [GROUND_Y, ...WORLD.filter((t) => worldState(t, f)).map((t) => GROUND_Y + (worldState(t, f)?.dy ?? 0))];
  const low = Math.max(...feet.map((y) => toScreen(c, X_NOW, y + 6).y));
  if (low > 1400) throw new Error(`MostSponsorship: subject ink reaches y ${low.toFixed(0)} on f${f} (> 1400)`);
}
