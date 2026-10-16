// MUSE_WORLD_READY
import React, { useId } from "react";
import {
  ALPHA,
  COLOR,
  EDGE,
  ELEVATION,
  FONT_LABEL,
  GEO,
  METRIC,
  STROKE,
  TRACK,
  TYPE,
  AmberGradient,
  Label,
  LightSweep,
  StoutStage,
  amberBandFor,
  bloomFilter,
  clamp01,
  lerp,
  mixHex,
  opticalFit,
  rectPath,
  smoothstep,
  type Elevation,
  type Pool,
  type Role,
  type ShadowLayer,
} from "./stoutShared";
import { camEase, type Cam, type Glide } from "../dwarkesh/outgrowShared";
import { CAM_DAMP, CAM_STIFF } from "../dwarkesh/fieldShared";

// ===========================================================================
// museShared — Alexandr Wang, "Alex on agentic commerce" (Cheeky Pint S4E03, the Meta episode).
// ONE family for seven cuts (brief: out/musecommerce/briefs/BRIEF.md; usage: out/musecommerce/WORLD_READY.md)
// in the Cheeky Pint S4 system (stoutShared, palette B1): every colour, edge, radius, shadow recipe and type
// token is stoutShared's, imported, never restated.
//
// THE LANGUAGE
//   * AMBER = the agent (Muse), and nothing else: AgentTile (the Muse brush-"M" in ink on an amber tile),
//     AmberThread (what it reaches / learns), DeadlinePost (the limit it was given).
//   * PEOPLE = cream tiles with a person bust in ink (PersonTile; `variant` = different people, one family).
//   * PRODUCTS = tiles with ONE heavy Lucide-grammar glyph in ink (ProductTile); cream = chosen / lit,
//     board = context. Tone changes are eased over TONE_F frames, never by opacity.
//   * PIECES (payment card, shopping bag, gift box, parcel, a small product tile) rise out of the SLOT in a
//     tile's top edge (`Slotted`), or travel on their own (`Piece`: lift one elevation, move, settle).
//   * ONE object, ONE shadow: a tile with a piece standing in its slot casts one union shadow (UnionShadow).
//
// UNITS: world px under the camera for geometry and shadows; SCREEN px (`px / k`) for type, hairlines, lit
// edges and bloom, exactly as stoutShared. A tile is TILE (96) world px; `size` rescales a tile and
// everything standing in it, and its shadow recipe with it.
// FRAMING: the look point lands on the TRUE MIDDLE of the frame (540, 960). Captions sit in the strip
// CAPTION_Y0..CAPTION_Y1 (screen y 1080-1250): nothing that must be read stands there.
// KNOCK-OUTS: every mark is drawn in COLOR.inkDark ON the tile (not a hole to the ground): the same picture
// as stoutShared's masks over the tile's own shadow, but it stays right when a tile passes over another or
// turns (cut 5's flip).
// ===========================================================================

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `mu${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
type P = [number, number];

// ===========================================================================
// FRAME + CLOCK CONSTANTS
// ===========================================================================
export const FPS = 24000 / 1001;
export const FRAME_W = 1080;
export const FRAME_H = 1920;
/** The look point's screen y: the true middle of the frame. */
export const LOOK_Y = 960;
/** The editor's caption strip (screen y): nothing that must be read stands inside it. */
export const CAPTION_Y0 = 1080;
export const CAPTION_Y1 = 1250;
/** Labels keep this far from the frame's sides (screen px). */
export const SIDE_MARGIN = 90;
/** Every cut: round(span x FPS) + TAIL frames. */
export const TAIL = 16;
export const durationOf = (spanSeconds: number) => Math.round(spanSeconds * FPS) + TAIL;
/** Frames a card takes to change tone (board <-> cream). */
export const TONE_F = 12;
/** The seven cuts: seq in / out (s), the slot's length and the composition's duration (frames). */
export const CUTS = {
  DelegatingPurchases: { in: 5.422, out: 9.593, slot: 100, duration: 116 },
  FindingGreatProducts: { in: 18.769, out: 24.233, slot: 131, duration: 147 },
  ThatStepTakenCare: { in: 30.364, out: 36.662, slot: 151, duration: 167 },
  ByWednesday: { in: 40.082, out: 44.753, slot: 112, duration: 128 },
  GreaterPersonalization: { in: 64.94, out: 70.737, slot: 139, duration: 155 },
  RightGiftForBestFriend: { in: 81.206, out: 94.761, slot: 325, duration: 341 },
  SiloedToWhole: { in: 104.438, out: 117.034, slot: 302, duration: 318 },
} as const;

// ===========================================================================
// WORLD TOKENS (world px, for a TILE-sized tile; everything scales with `size / TILE`)
// ===========================================================================
export const TILE = GEO.TILE; // 96
export const RADIUS = GEO.RADIUS; // 4
/** The default slot (and the widest piece): 3/4 of the tile. */
export const SLOT_W = 72;
/** A body that travels rises this far (world px at TILE scale) while it is lifted. */
export const LIFT_DY = 6;
/** Every stroked glyph: stoutShared's sport-glyph weight (2.6 units of a 24 box filling SPORT_FILL of a tile). */
export const GLYPH_STROKE = (2.6 * GEO.TILE * GEO.SPORT_FILL) / 24; // 6.864 world px on a 96 tile
/** A glyph's 20-unit ink box as a share of its tile (the sport glyphs' rule). */
export const GLYPH_FILL = 0.68;
/** The mark / knock-out colour (ink on cream, board and amber). */
export const KNOCK = COLOR.inkDark;

// ===========================================================================
// MOTION HELPERS
// ===========================================================================
/** Rest to rest with a long soft landing: velocity ∝ t (1 - t)^(p - 1); exactly 1 at t = 1; no overshoot. */
export const restToRest = (t: number, p = 2.5) => {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, p) * (1 + p * u);
};
/** Window progress (unclamped): (f - f0) / (f1 - f0). */
export const winU = (f: number, f0: number, f1: number) => (f - f0) / (f1 - f0);
/**
 * tone — a card's tone as `dim` (0 = cream, lit; 1 = board, context), eased over TONE_F frames from f0.
 * tone(f, 53) turns board -> cream starting on f53; tone(f, 59, 0, 1) turns cream -> board.
 */
export const tone = (f: number, f0: number, from = 1, to = 0, frames = TONE_F) => lerp(from, to, smoothstep((f - f0) / frames));
/** The two card tones mixed (top / foot of the card's gradient). */
export const toneTop = (dim: number) => mixHex(COLOR.cream, COLOR.board, clamp01(dim));
export const toneFoot = (dim: number) => mixHex(COLOR.creamFoot, COLOR.boardFoot, clamp01(dim));
export type Pose = { x: number; y: number };
/**
 * travel — the house move for anything that travels: LIFT one elevation, MOVE, SETTLE. No hop, no bounce.
 * From pose a to pose b over [f0, f1] (y = the thing's floor / bottom): x eases rest to rest with a long soft
 * landing (power `p`, default 2.5); y follows the same progress (`riseLead` > 0 runs the vertical ahead of
 * the horizontal, to clear a corner on an up-and-over move); `lift` (0..1) is the elevation envelope: up over
 * the first 25 %, held, settled over the last (1 - settleFrom): pass it to the component's `lift`, which grows
 * the shadow and raises the body LIFT_DY. Before f0 it rests on a, after f1 on b (lift 0).
 */
export const travel = (a: Pose, b: Pose, f: number, f0: number, f1: number, opts: { p?: number; settleFrom?: number; riseLead?: number } = {}) => {
  const u = winU(f, f0, f1);
  const pw = opts.p ?? 2.5;
  const sf = opts.settleFrom ?? 0.7;
  const ux = restToRest(u, pw);
  const uy = (opts.riseLead ?? 0) > 0 ? restToRest(clamp01(u * (1 + (opts.riseLead as number))), pw) : ux;
  const lift = u <= 0 || u >= 1 ? 0 : smoothstep(u / 0.25) * (1 - smoothstep((u - sf) / (1 - sf)));
  return { x: lerp(a.x, b.x, ux), y: lerp(a.y, b.y, uy), lift, u: clamp01(u) };
};
/** A lift in place (a pick, a wake): up over `up` frames from f0, held; pass `f1` to settle over `down` frames. */
export const liftAt = (f: number, f0: number, f1 = Infinity, up = 7, down = 8) => smoothstep((f - f0) / up) * (1 - smoothstep((f - f1) / down));

// ===========================================================================
// CAMERA — the house superposed glides + damped follower; the LOOK lands on (540, 960)
// ===========================================================================
export type { Cam, Glide, Pool };
export const toScreenM = (c: Cam, x: number, y: number) => ({ x: FRAME_W / 2 + (x - c.x) * c.k, y: FRAME_H / 2 + (y - c.y) * c.k });
/** A camera whose centre puts world point (wx, wy) at screen point (sx, sy). */
export const camForM = (wx: number, wy: number, sx: number, sy: number, k: number): Cam => ({ x: wx - (sx - FRAME_W / 2) / k, y: wy - (sy - FRAME_H / 2) / k, k });
/** The visible world rect of a camera (no sway). */
export const viewOf = (c: Cam) => ({ x0: c.x - FRAME_W / 2 / c.k, x1: c.x + FRAME_W / 2 / c.k, y0: c.y - FRAME_H / 2 / c.k, y1: c.y + FRAME_H / 2 / c.k });
/**
 * cameraTrackM: `start` is a LOOK (the world point on the frame's middle) + k; glides are eased deltas of
 * look x / y and ln k over [f0, f1] (smoothstep^warp, so they superpose C1); then the house damped follower
 * (CAM_STIFF / CAM_DAMP). Returns camera CENTRES at full precision, one per frame f = 0 .. frames + 2.
 */
export const cameraTrackM = (start: { x: number; y: number; k: number }, glides: Glide[], frames: number): Cam[] => {
  const T: Cam[] = [];
  for (let f = 0; f <= frames + 2; f++) {
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
    T.push({ x, y, k: Math.exp(lk) });
  }
  const out: Cam[] = [];
  let c = { ...T[0] };
  let v = { x: 0, y: 0, k: 0 };
  for (let f = 0; f < T.length; f++) {
    if (f > 0) {
      const t = T[f];
      v = {
        x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
        y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
        k: v.k + (t.k - c.k) * CAM_STIFF - v.k * CAM_DAMP,
      };
      c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    }
    out.push({ ...c });
  }
  return out;
};
/**
 * makeClockCam: a camera keyed on the cut's frame clock: glides in frames, a pre-roll (PRE) so f0 is already
 * settled or already moving (give the opening creep a NEGATIVE f0), sampled continuously (linear between
 * frames). Returns { at(f), rest (the f0 camera: MuseStage's `rest`), track }.
 */
export const makeClockCam = (startLook: { x: number; y: number; k: number }, glides: Glide[], F_END: number, PRE = 40) => {
  const track = cameraTrackM(
    startLook,
    glides.map((g) => ({ ...g, f0: g.f0 + PRE, f1: g.f1 + PRE })),
    F_END + PRE + 4,
  ).slice(PRE);
  const at = (f: number): Cam => {
    const a = Math.max(0, Math.min(track.length - 2, Math.floor(f)));
    const t = Math.max(0, Math.min(1, f - a));
    const A = track[a];
    const B = track[a + 1];
    return { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), k: lerp(A.k, B.k, t) };
  };
  return { track, at, rest: track[0] };
};
/**
 * camCheck: the two house camera numbers over [f0, f1]: the largest screen speed (px/f; cap 45) and the
 * largest change of screen velocity (|dv|, px/f^2; cap 2.5) of fixed world points at the frame's centre and
 * at (±200, ±300) from it. Also `minV`: the slowest frame (a dead hold if it is ~0 for long).
 */
export const camCheck = (at: (f: number) => Cam, f0: number, f1: number) => {
  let maxA = 0;
  let atA = f0;
  let maxV = 0;
  let atV = f0;
  let minV = Infinity;
  const pts: P[] = [
    [0, 0],
    [-200, -300],
    [200, 300],
    [-200, 300],
    [200, -300],
  ];
  for (let f = f0 + 1; f < f1; f++) {
    const c0 = at(f - 1);
    const c1 = at(f);
    const c2 = at(f + 1);
    let vMaxHere = 0;
    for (const [ox, oy] of pts) {
      const wx = c1.x + ox / c1.k;
      const wy = c1.y + oy / c1.k;
      const s0 = toScreenM(c0, wx, wy);
      const s1 = toScreenM(c1, wx, wy);
      const s2 = toScreenM(c2, wx, wy);
      const v = Math.hypot(s1.x - s0.x, s1.y - s0.y);
      const a = Math.hypot(s2.x - 2 * s1.x + s0.x, s2.y - 2 * s1.y + s0.y);
      vMaxHere = Math.max(vMaxHere, v);
      if (a > maxA) {
        maxA = a;
        atA = f;
      }
      if (v > maxV) {
        maxV = v;
        atV = f;
      }
    }
    minV = Math.min(minV, vMaxHere);
  }
  return { maxA, atA, maxV, atV, minV };
};
/** A damped follower over eased keys (the light pool's lag), sampled continuously on the cut's clock. */
export const POOL_STIFF = 0.09;
export const POOL_DAMP = 0.468;
export type PoolKey = { f0: number; f1: number; x: number; y: number; strength?: number };
export const makePoolTrack = (start: { x: number; y: number; strength?: number }, keys: PoolKey[], F_END: number, PRE = 40) => {
  const target = (f: number) => {
    let p = { x: start.x, y: start.y, strength: start.strength ?? POOL_STRENGTH };
    for (const w of keys) {
      const e = smoothstep((f - w.f0) / (w.f1 - w.f0));
      p = { x: lerp(p.x, w.x, e), y: lerp(p.y, w.y, e), strength: lerp(p.strength, w.strength ?? p.strength, e) };
    }
    return p;
  };
  const out: { x: number; y: number; strength: number }[] = [];
  let p = target(-PRE);
  let v = { x: 0, y: 0, strength: 0 };
  for (let f = -PRE; f <= F_END + 2; f++) {
    const t = target(f);
    v = {
      x: v.x + (t.x - p.x) * POOL_STIFF - v.x * POOL_DAMP,
      y: v.y + (t.y - p.y) * POOL_STIFF - v.y * POOL_DAMP,
      strength: v.strength + (t.strength - p.strength) * POOL_STIFF - v.strength * POOL_DAMP,
    };
    p = { x: p.x + v.x, y: p.y + v.y, strength: p.strength + v.strength };
    if (f >= 0) out.push({ ...p });
  }
  return (f: number) => {
    const i = Math.max(0, Math.min(out.length - 2, Math.floor(f)));
    const t = Math.max(0, Math.min(1, f - i));
    return { x: lerp(out[i].x, out[i + 1].x, t), y: lerp(out[i].y, out[i + 1].y, t), strength: lerp(out[i].strength, out[i + 1].strength, t) };
  };
};
/** The pool's strength in this set (the mercjob set's: its slide must read as motion). */
export const POOL_STRENGTH = 1.8;

/**
 * MuseStage — the set: stoutShared's StoutStage (palette B1: the baked espresso ground with parallax and
 * drift, the cream light pool following `pool`, the vignette, film grain on twos, the house sway) under a
 * camera whose look is the frame's middle. `S` = the cut's frame; `cam` = makeClockCam(...).at(S); `rest` =
 * its `.rest` (the ground's parallax origin); `pool` = a world point (+ strength) the light follows.
 * Children are drawn in WORLD px; `overlay` in SCREEN px above the world, under the vignette and grain.
 */
export const MuseStage: React.FC<{ S: number; cam: Cam; rest?: Cam; pool?: Pool; sway?: boolean; children?: React.ReactNode; overlay?: React.ReactNode }> = ({
  S,
  cam,
  rest,
  pool = null,
  sway = true,
  children,
  overlay,
}) => (
  <StoutStage S={S} cam={cam} rest={rest ?? cam} pool={pool ? { strength: POOL_STRENGTH, ...pool } : null} sway={sway} overlay={overlay}>
    {children}
  </StoutStage>
);
/** The amber band of a frame: pass it to every amber thing of the frame (one light across the screen). */
export const amberBandM = (cam: Cam): [number, number] => amberBandFor(cam);
export { Label, LightSweep };

// ===========================================================================
// SHADOWS — one object, one union silhouette, one light (stoutShared's recipe, any scale)
// ===========================================================================
/** A part of an object's silhouette (world px): a filled path, or a stroked one (`stroke` = its width);
 *  `a` < 1 for glass; `clip` keeps only the part inside a rect (a piece still inside its slot);
 *  `tf` = an SVG transform of the part (a flip). */
export type SilItem = { d: string; a?: number; stroke?: number; clip?: { x: number; y: number; w: number; h: number }; tf?: string };
const NEXT: Record<Elevation, Elevation> = { rest: "lifted", lifted: "float", float: "float" };
/**
 * UnionShadow — the shadow of ONE object: its parts filled once per layer (so touching parts never stack),
 * offset and blurred by the elevation's recipe x `s` (the recipe is for TILE-scale objects: s = size / TILE).
 * Draw it BEFORE the object's body. `lift` 0..1 eases toward the next elevation; `contact` = the foot of an
 * object standing on the floor.
 */
export const UnionShadow: React.FC<{
  sil: SilItem[];
  s?: number;
  elevation?: Elevation;
  lift?: number;
  contact?: { x: number; y: number; w: number } | null;
  strength?: number;
}> = ({ sil, s = 1, elevation = "rest", lift = 0, contact = null, strength = 1 }) => {
  const uid = uidOf(useId());
  if (strength <= 0.002) return null;
  const A = ELEVATION[elevation];
  const B = ELEVATION[NEXT[elevation]];
  const t = clamp01(lift);
  const mix = (a: ShadowLayer, b: ShadowLayer): ShadowLayer => ({ dx: lerp(a.dx, b.dx, t), dy: lerp(a.dy, b.dy, t), blur: lerp(a.blur, b.blur, t), a: lerp(a.a, b.a, t) });
  const layers = [mix(A.amb, B.amb), mix(A.key, B.key)];
  const c = A.contact;
  const parts = sil.map((q, i) => {
    const el = q.stroke ? (
      <path d={q.d} fill="none" stroke={COLOR.shadow} strokeWidth={f3(q.stroke)} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={q.a ?? 1} transform={q.tf} />
    ) : (
      <path d={q.d} fillOpacity={q.a ?? 1} transform={q.tf} />
    );
    return q.clip ? (
      <g key={i} clipPath={`url(#${uid}c${i})`}>
        {el}
      </g>
    ) : (
      <React.Fragment key={i}>{el}</React.Fragment>
    );
  });
  return (
    <g fill={COLOR.shadow} style={{ pointerEvents: "none" }}>
      <defs>
        {sil.map((q, i) =>
          q.clip ? (
            <clipPath key={i} id={`${uid}c${i}`}>
              <rect x={f3(q.clip.x)} y={f3(q.clip.y)} width={f3(q.clip.w)} height={f3(q.clip.h)} />
            </clipPath>
          ) : null,
        )}
      </defs>
      {contact && c ? (
        <ellipse cx={f3(contact.x + c.dx * s)} cy={f3(contact.y)} rx={f3(contact.w * 0.58)} ry={f3(3 * s)} opacity={f3(c.a * (1 - t) * strength)} style={{ filter: `blur(${f3(c.blur * s)}px)` }} />
      ) : null}
      {layers.map((l, i) => (
        <g key={i} opacity={f3(l.a * strength)} transform={`translate(${fx(l.dx * s)} ${fx(l.dy * s)})`} style={{ filter: `blur(${f3(l.blur * s)}px)` }}>
          {parts}
        </g>
      ))}
    </g>
  );
};

// ===========================================================================
// PATH TOOLS
// ===========================================================================
type Cmd = ["M" | "L", number, number] | ["Q", number, number, number, number] | ["C", number, number, number, number, number, number] | ["Z"];
type Map2 = (x: number, y: number) => P;
const KAPPA = 0.5522847498;
const circleCmds = (cx: number, cy: number, r: number): Cmd[] => {
  const c = r * KAPPA;
  return [
    ["M", cx + r, cy],
    ["C", cx + r, cy + c, cx + c, cy + r, cx, cy + r],
    ["C", cx - c, cy + r, cx - r, cy + c, cx - r, cy],
    ["C", cx - r, cy - c, cx - c, cy - r, cx, cy - r],
    ["C", cx + c, cy - r, cx + r, cy - c, cx + r, cy],
    ["Z"],
  ];
};
const roundRectCmds = (x: number, y: number, w: number, h: number, r: number): Cmd[] => [
  ["M", x + r, y],
  ["L", x + w - r, y],
  ["Q", x + w, y, x + w, y + r],
  ["L", x + w, y + h - r],
  ["Q", x + w, y + h, x + w - r, y + h],
  ["L", x + r, y + h],
  ["Q", x, y + h, x, y + h - r],
  ["L", x, y + r],
  ["Q", x, y, x + r, y],
  ["Z"],
];
const pathOf = (cmds: Cmd[], map: Map2) =>
  cmds
    .map((c) => {
      if (c[0] === "Z") return "Z";
      const pts: string[] = [];
      for (let i = 1; i < c.length; i += 2) {
        const [x, y] = map(c[i] as number, c[i + 1] as number);
        pts.push(`${f3(x)} ${f3(y)}`);
      }
      return `${c[0]}${pts.join(" ")}`;
    })
    .join("");
/** A circle as a path (world px). */
export const circlePath = (cx: number, cy: number, r: number) => pathOf(circleCmds(cx, cy, r), (x, y) => [x, y]);

// ===========================================================================
// THE MUSE MARK — Muse's brush-"M" (public/cheekypint2/muse/muse_app_icon_reference.png), redrawn as ONE
// round-capped stroked path in the icon's 1024 box: three peaks stepping down to the right, the tops turned
// round, the bottoms sharp Vs, the down-strokes near vertical. Ink on amber; never blue.
// ===========================================================================
const MARK_PTS: P[] = [
  [155, 471],
  [304, 278],
  [266, 730],
  [514, 316],
  [497, 730],
  [715, 398],
  [721, 733],
  [874, 552],
];
export const MARK_STROKE = 96;
/** How far along each stroke a top's turn starts (1024 units): the tops are round, the bottoms sharp. */
const MARK_TOP_CUT = 50;
export const MUSE_MARK_D = (() => {
  const toward = (a: P, b: P, d: number): P => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [a[0] + ((b[0] - a[0]) * d) / L, a[1] + ((b[1] - a[1]) * d) / L];
  };
  const q = (p: P) => `${f3(p[0])} ${f3(p[1])}`;
  let d = `M${q(MARK_PTS[0])}`;
  for (let i = 1; i < MARK_PTS.length; i++) {
    const p = MARK_PTS[i];
    const isTop = i % 2 === 1 && i < MARK_PTS.length - 1;
    if (isTop) {
      d += `L${q(toward(p, MARK_PTS[i - 1], MARK_TOP_CUT))}Q${q(p)} ${q(toward(p, MARK_PTS[i + 1], MARK_TOP_CUT))}`;
    } else d += `L${q(p)}`;
  }
  return d;
})();
/** The mark's ink box in its 1024 units [x, y, w, h], its fill (ink / box) and centroid offset. */
export const MARK_BOX = [107, 242, 815, 539] as const;
const MARK_FILL = 0.5;
/**
 * MuseMark — the mark fitted into a square of `size` whose top-left is (x, y), by the family's optical rule
 * (CREST_FILL with the CREST_MAX clamp: it is a wide mark, so it lands 0.84 of the tile wide). `color`
 * defaults to ink. Use it alone only where the agent has no tile.
 */
export const MuseMark: React.FC<{ x?: number; y?: number; size: number; color?: string }> = ({ x = 0, y = 0, size, color = KNOCK }) => {
  const [bx, by, bw, bh] = MARK_BOX;
  const fit = opticalFit(bw, bh, MARK_FILL, 0, size);
  const ox = x + fit.cx - (bx + bw / 2) * fit.sc;
  const oy = y + fit.cy - (by + bh / 2) * fit.sc;
  return (
    <path
      d={MUSE_MARK_D}
      transform={`translate(${fx(ox)} ${fx(oy)}) scale(${fx(fit.sc)})`}
      fill="none"
      stroke={color}
      strokeWidth={MARK_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

// ===========================================================================
// GLYPHS — Lucide grammar (24-unit box, ink inside 2..22, round caps and joins), ONE stroke weight
// (GLYPH_STROKE) and ONE optical size (GLYPH_FILL). Paths are Lucide's (ISC) or drawn here to the same
// grammar and simplified for the heavy stroke. Elements: a string = a stroked path; { c } = a stroked
// circle; `fill` = a solid dot; `tf` = a transform in glyph units.
// ===========================================================================
type GlyphEl = string | { d: string; tf?: string } | { c: [number, number, number]; fill?: boolean; tf?: string };
type GlyphDef = { els: GlyphEl[]; scale?: number; dx?: number; dy?: number };
export const GLYPH_NAMES = ["tea", "tshirt", "sneaker", "headphones", "book", "lamp", "guitar", "watch", "mug", "backpack", "camera", "gift", "parcel", "bag", "music", "play", "pin"] as const;
export type GlyphName = (typeof GLYPH_NAMES)[number];
const GUITAR_TF = "rotate(45 12 12)";
const GLYPHS: Record<GlyphName, GlyphDef> = {
  // a wide teacup on its saucer, two wisps of steam
  tea: {
    els: ["M4 10.5h13v1.5a6.5 6.5 0 0 1-13 0Z", "M17 11.4h1.3a2.6 2.6 0 0 1 0 5.2h-2.4", "M3.5 21.6h14", "M8 2.6c-1.3 1.3 1.3 2.6 0 4", "M13 2.6c-1.3 1.3 1.3 2.6 0 4"],
    dx: 0.6,
  },
  // Lucide "shirt"
  tshirt: {
    els: [
      "M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z",
    ],
  },
  // a trainer in profile, toe to the right: the upper, two laces, the sole as its own line
  sneaker: {
    els: [
      "M2.8 16.4V7.6c0-.6.6-.9 1.1-.6 1.2.8 2.4 1.2 3.7 1.2 1.2 0 2-.8 2.5-2l.5-1.2 6.5 6.3c.5.5 1.1.8 1.8.9 1.6.3 2.8 1.5 2.8 3.2v1Z",
      "M2.4 20.6h19.4",
      "M12.5 8.2l-2 2.1",
      "M15.3 10.9l-2 2.1",
    ],
    dy: -0.6,
  },
  // Lucide "headphones"
  headphones: { els: ["M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"] },
  // Lucide "book-open"
  book: { els: ["M12 7v14", "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"] },
  // a table lamp: shade, stem, foot
  lamp: { els: ["M8.4 2.2h7.2l4 9.6H4.4Z", "M12 11.8v9.6", "M7 21.6h10"] },
  // an acoustic guitar on the diagonal: waisted body, sound hole, neck, head
  guitar: {
    els: [
      { d: "M8.835 13.5A5.5 5.5 0 1 0 15.165 13.5A3.8 3.8 0 1 0 8.835 13.5Z", tf: GUITAR_TF },
      { d: "M12 7.6V0.6", tf: GUITAR_TF },
      { d: "M10.7 -1.9h2.6v2.6h-2.6Z", tf: GUITAR_TF },
      { c: [12, 15.9, 1.25], fill: true, tf: GUITAR_TF },
      { d: "M10.5 19.9h3", tf: GUITAR_TF },
    ],
  },
  // Lucide "watch"
  watch: {
    els: [
      { c: [12, 12, 6] },
      "M12 9.4V12l1.7 1.1",
      "m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05",
      "m7.88 16.36.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05",
    ],
  },
  // a tall mug: straight sides, a round handle
  mug: { els: ["M5 4.6h11v13.3a2.6 2.6 0 0 1-2.6 2.6H7.6A2.6 2.6 0 0 1 5 17.9Z", "M16 8.6h1.6a3.2 3.2 0 0 1 0 6.4H16"], dx: 0.6 },
  // Lucide "backpack", its lower strap dropped for the heavy stroke
  backpack: {
    els: [
      "M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z",
      "M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2",
      "M8.4 22v-5.4a2 2 0 0 1 2-2h3.2a2 2 0 0 1 2 2V22",
      "M8.6 10.4h6.8",
    ],
  },
  // Lucide "camera"
  camera: { els: ["M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z", { c: [12, 13, 3.1] }] },
  // Lucide "gift": box, lid, ribbon and bow
  gift: {
    els: [
      "M4 8h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z",
      "M12 8v13",
      "M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7",
      "M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",
    ],
  },
  // Lucide "package": the shipping box with its tape line
  parcel: {
    els: [
      "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
      "M12 22V12",
      "M3.3 7 12 12l8.7-5",
      "m7.5 4.27 9 5.15",
    ],
  },
  // Lucide "shopping-bag"
  bag: { els: ["M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z", "M3 6h18", "M16 10a4 4 0 0 1-8 0"] },
  // services (cut 7): Lucide "music", "play", "map-pin"
  music: { els: ["M9 18V5l12-2v13", { c: [6, 18, 3] }, { c: [18, 16, 3] }] },
  play: { els: ["M6.6 3.6 20 12 6.6 20.4Z"], dx: -0.4 },
  pin: { els: ["M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0", { c: [12, 10, 3] }] },
};
/**
 * GlyphMark — a glyph in a square of `size` whose top-left is (x, y), stroked at the set's one weight.
 * `color` defaults to ink (on a tile); pass COLOR.inkCream for a glyph standing on the ground.
 */
export const GlyphMark: React.FC<{ glyph: GlyphName; x?: number; y?: number; size: number; color?: string }> = ({ glyph, x = 0, y = 0, size, color = KNOCK }) => {
  const g = GLYPHS[glyph];
  const sc = ((size * GLYPH_FILL) / 20) * (g.scale ?? 1);
  const sw = f3((GLYPH_STROKE * size) / TILE / sc);
  return (
    <g
      transform={`translate(${fx(x + size / 2 - (12 - (g.dx ?? 0)) * sc)} ${fx(y + size / 2 - (12 - (g.dy ?? 0)) * sc)}) scale(${fx(sc)})`}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {g.els.map((e, i) =>
        typeof e === "string" ? (
          <path key={i} d={e} />
        ) : "c" in e ? (
          <circle key={i} cx={e.c[0]} cy={e.c[1]} r={e.c[2]} transform={e.tf} fill={e.fill ? color : "none"} stroke={e.fill ? "none" : color} />
        ) : (
          <path key={i} d={e.d} transform={e.tf} />
        ),
      )}
    </g>
  );
};

// ===========================================================================
// THE PERSON BUST (icebergShared / mercJobShared's geometry: public/person.png as a vector, ink spans
// 41..470 of a 512 box) + same-family variants: the same head and shoulders, a different outline.
// ===========================================================================
const BUST_UNITS = 429;
const BUST_HEAD: Cmd[] = circleCmds(255.5, 143, 102);
const BUST_BODY: Cmd[] = [
  ["M", 41, 458],
  ["C", 41, 352, 126, 266, 232, 266],
  ["L", 279, 266],
  ["C", 385, 266, 470, 352, 470, 458],
  ["L", 470, 462],
  ["Q", 470, 470, 462, 470],
  ["L", 49, 470],
  ["Q", 41, 470, 41, 462],
  ["Z"],
];
export const PERSON_VARIANTS = ["plain", "long", "cap", "bun", "curly", "child"] as const;
export type PersonVariant = (typeof PERSON_VARIANTS)[number];
const mapCmds = (cmds: Cmd[], m: Map2): Cmd[] =>
  cmds.map((c) => {
    if (c[0] === "Z") return c;
    const out: (string | number)[] = [c[0]];
    for (let i = 1; i < c.length; i += 2) out.push(...m(c[i] as number, c[i + 1] as number));
    return out as unknown as Cmd;
  });
const VARIANT_EXTRA: Record<PersonVariant, Cmd[][]> = {
  plain: [],
  // long hair: a bell from the crown out to the shoulders
  long: [
    [
      ["M", 255.5, 30],
      ["C", 160, 30, 132, 100, 128, 180],
      ["C", 125, 246, 110, 288, 84, 318],
      ["Q", 78, 330, 92, 330],
      ["L", 419, 330],
      ["Q", 433, 330, 427, 318],
      ["C", 401, 288, 386, 246, 383, 180],
      ["C", 379, 100, 351, 30, 255.5, 30],
      ["Z"],
    ],
  ],
  // a cap: a deeper crown and a peak out to the right
  cap: [roundRectCmds(250, 92, 196, 38, 19), [["M", 150, 124], ["C", 150, 60, 200, 28, 255.5, 28], ["C", 311, 28, 361, 60, 361, 124], ["Z"]]],
  // a bun on the crown
  bun: [circleCmds(255.5, 30, 50)],
  // curls: a scalloped crown
  curly: [-180, -144, -108, -72, -36, 0, 36, 216].map((deg) => circleCmds(255.5 + 82 * Math.cos((deg * Math.PI) / 180), 143 + 82 * Math.sin((deg * Math.PI) / 180), 42)),
  child: [],
};
const bustCmds = (variant: PersonVariant): Cmd[][] => {
  if (variant === "child") {
    // a child: a bigger head on narrower, lower shoulders
    return [circleCmds(255.5, 172, 112), mapCmds(BUST_BODY, (u, v) => [255.5 + (u - 255.5) * 0.8, 470 - (470 - v) * 0.8])];
  }
  return [BUST_HEAD, BUST_BODY, ...VARIANT_EXTRA[variant]];
};
/** A bust `h` tall (the PLAIN bust's ink box: every variant shares its scale and stands on the same line)
 *  with that box centred on (cx, cy), as path strings (fill them all one colour). */
export const bustPaths = (cx: number, cy: number, h: number, variant: PersonVariant = "plain") =>
  bustCmds(variant).map((c) => pathOf(c, (u, v) => [cx + ((u - 255.5) * h) / BUST_UNITS, cy + ((v - 255.5) * h) / BUST_UNITS]));
/** The plain bust as ONE path (head + shoulders), `h` tall and wide, bottom-centred on (cx, bottom). */
export const bigBustPath = (cx: number, bottom: number, h: number) => bustPaths(cx, bottom - h / 2, h, "plain").join("");
/** The bust's share of a tile (the optical rule: CREST_FILL for a mark of fill ~0.53). */
const BUST_FIT = opticalFit(1, 1, 0.53, 0, 1).sc;
const BustMark: React.FC<{ x: number; y: number; size: number; variant: PersonVariant; color?: string }> = ({ x, y, size, variant, color = KNOCK }) => {
  const h = BUST_FIT * size;
  // the plain box centred a hair low (the head is the lighter half), every variant on the same line
  return (
    <g fill={color}>
      {bustPaths(x + size / 2, y + size / 2 + 0.012 * size, h, variant).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
};

// --- the bust in vertical strips (cut 7) ---------------------------------------------------------------
const bez = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const a = (1 - t) ** 3;
  const b = 3 * (1 - t) ** 2 * t;
  const c = 3 * (1 - t) * t * t;
  const d = t ** 3;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
};
/** The plain bust's two convex parts as polygons, in unit coords (x 0..1 across its width, y 0 = its top, 1 = its bottom). */
const BUST_POLYS: P[][] = (() => {
  const head: P[] = [];
  for (let i = 0; i < 96; i++) head.push([255.5 + 102 * Math.cos((i / 96) * 2 * Math.PI), 143 + 102 * Math.sin((i / 96) * 2 * Math.PI)]);
  const body: P[] = [];
  for (let i = 0; i <= 40; i++) body.push(bez([41, 458], [41, 352], [126, 266], [232, 266], i / 40));
  for (let i = 0; i <= 40; i++) body.push(bez([279, 266], [385, 266], [470, 352], [470, 458], i / 40));
  body.push([470, 464], [468, 468], [464, 470], [47, 470], [43, 468], [41, 464]);
  return [head, body].map((poly) => poly.map(([u, v]) => [(u - 41) / BUST_UNITS, (v - 41) / BUST_UNITS] as P));
})();
/** Clip a convex polygon to the vertical band x0 <= x <= x1 (Sutherland-Hodgman). */
const clipBand = (poly: P[], x0: number, x1: number): P[] => {
  const cut = (pts: P[], edge: number, keepRight: boolean): P[] => {
    const out: P[] = [];
    const inside = (p: P) => (keepRight ? p[0] >= edge : p[0] <= edge);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const ia = inside(a);
      const ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) {
        const t = (edge - a[0]) / (b[0] - a[0]);
        out.push([edge, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  };
  return cut(cut(poly, x0, true), x1, false);
};
/**
 * bustStrip — strip i of n (equal vertical strips, 0 = the left one) of a plain bust `h` tall and wide whose
 * WHOLE figure is bottom-centred on (cx, bottom); `dx` slides this strip sideways. Returns its path (exact
 * geometry: cut edges are straight), its world box and `top` (the y of its highest ink: a glass column must
 * clear it).
 */
export const bustStrip = (cx: number, bottom: number, h: number, i: number, n: number, dx = 0) => {
  const u0 = i / n;
  const u1 = (i + 1) / n;
  const X = (u: number) => cx + dx + (u - 0.5) * h;
  const Y = (v: number) => bottom - (1 - v) * h;
  let top = 1;
  const d = BUST_POLYS.map((poly) => {
    const c = clipBand(poly, u0, u1);
    if (c.length < 3) return "";
    for (const p of c) top = Math.min(top, p[1]);
    return `M${c.map(([u, v]) => `${f3(X(u))} ${f3(Y(v))}`).join("L")}Z`;
  }).join("");
  return { d, x0: X(u0), x1: X(u1), cx: X((u0 + u1) / 2), w: h / n, top: Y(top), bottom };
};

// ===========================================================================
// THE TILE BODY (no shadow): the card, its lit / hot top edge (stopping at the slot), its mark in ink
// ===========================================================================
export type Face = { kind: "agent" } | { kind: "person"; variant?: PersonVariant } | { kind: "product"; glyph: GlyphName } | { kind: "none" };
const HotEdge: React.FC<{ x: number; y: number; w: number; k: number; r: number; id: string }> = ({ x, y, w, k, r, id }) => {
  const fall = EDGE.HOT_FALL / k;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={rectPath(x, y, w, fall, r, true, false)} fill={`url(#${id})`} />
      <path d={`M${f3(x + r)} ${f3(y + EDGE.HOT / k / 2)}H${f3(x + w - r)}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
    </g>
  );
};
/** The slot's visible height (world px): the stout slot line, never thinner than 2 world px x s (it must read on a phone). */
const slotH = (k: number, s: number) => Math.max(EDGE.SLOT / k, 2 * s);
const TileBody: React.FC<{ x: number; top: number; T: number; k: number; face: Face; dim: number; band?: [number, number]; slotW: number; uid: string }> = ({
  x,
  top,
  T,
  k,
  face,
  dim,
  band,
  slotW,
  uid,
}) => {
  const s = T / TILE;
  const r = RADIUS * s;
  const x0 = x - T / 2;
  const agent = face.kind === "agent";
  const d = rectPath(x0, top, T, T, r);
  const lip = slotW > 0 ? slotW / 2 + EDGE.SLOT_LIP / k : 0;
  const ey = top + EDGE.CREAM / k / 2;
  const edge = lerp(ALPHA.edge, ALPHA.edgeBoard, dim);
  const sh = slotH(k, s);
  return (
    <g>
      <defs>
        {agent ? (
          <AmberGradient id={`${uid}a`} y0={band ? band[0] : top - T} y1={band ? band[1] : top + 2 * T} />
        ) : (
          <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(top)} x2="0" y2={f3(top + T)}>
            <stop offset="0" stopColor={toneTop(dim)} />
            <stop offset="1" stopColor={toneFoot(dim)} />
          </linearGradient>
        )}
      </defs>
      {agent ? (
        <>
          <g style={{ filter: bloomFilter(k) }}>
            <path d={d} fill={`url(#${uid}a)`} />
          </g>
          <HotEdge x={x0} y={top} w={T} k={k} r={r} id={`${uid}h`} />
        </>
      ) : (
        <>
          <path d={d} fill={`url(#${uid}c)`} />
          <path
            d={lip > 0 ? `M${f3(x0 + r)} ${f3(ey)}H${f3(x - lip)}M${f3(x + lip)} ${f3(ey)}H${f3(x0 + T - r)}` : `M${f3(x0 + r)} ${f3(ey)}H${f3(x0 + T - r)}`}
            stroke={COLOR.edge}
            strokeOpacity={f3(edge)}
            strokeWidth={f3(EDGE.CREAM / k)}
          />
        </>
      )}
      {face.kind === "agent" ? <MuseMark x={x0} y={top} size={T} /> : null}
      {face.kind === "person" ? <BustMark x={x0} y={top} size={T} variant={face.variant ?? "plain"} /> : null}
      {face.kind === "product" ? <GlyphMark glyph={face.glyph} x={x0} y={top} size={T} /> : null}
      {slotW > 0 ? <rect x={f3(x - lip)} y={f3(top - sh * 0.25)} width={f3(2 * lip)} height={f3(sh)} rx={f3(Math.min(sh / 2, 1.2 * s))} fill={KNOCK} fillOpacity={agent ? 0.8 : ALPHA.slot} /> : null}
    </g>
  );
};

// ===========================================================================
// PIECES — things that rise out of a slot, stand on a tile, or travel on their own
// ===========================================================================
/** A piece's drawing for a frame: its silhouette parts (for the ONE shadow) and its body. (cx, bottom) =
 *  its bottom-centre in world px; s = its scale (size / TILE); dim = its tone. */
export type PieceDef = {
  name: string;
  /** width and height at s = 1 (world px) */
  w: number;
  h: number;
  render: (o: { cx: number; bottom: number; s: number; k: number; dim: number; uid: string }) => { sil: SilItem[]; body: React.ReactNode };
};
const CardGradient: React.FC<{ id: string; y0: number; y1: number; dim: number }> = ({ id, y0, y1, dim }) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
    <stop offset="0" stopColor={toneTop(dim)} />
    <stop offset="1" stopColor={toneFoot(dim)} />
  </linearGradient>
);
const LitEdge: React.FC<{ x0: number; x1: number; y: number; k: number; dim: number }> = ({ x0, x1, y, k, dim }) => (
  <path d={`M${f3(x0)} ${f3(y + EDGE.CREAM / k / 2)}H${f3(x1)}`} stroke={COLOR.edge} strokeOpacity={f3(lerp(ALPHA.edge, ALPHA.edgeBoard, dim))} strokeWidth={f3(EDGE.CREAM / k)} />
);

/** The payment card: a cream card with its stripe, chip and number line in ink. 72 x 46. */
export const CARD: PieceDef = {
  name: "card",
  w: 72,
  h: 46,
  render: ({ cx, bottom, s, k, dim, uid }) => {
    const w = 72 * s;
    const h = 46 * s;
    const x = cx - w / 2;
    const y = bottom - h;
    const d = rectPath(x, y, w, h, 5 * s);
    return {
      sil: [{ d }],
      body: (
        <g>
          <defs>
            <CardGradient id={`${uid}g`} y0={y} y1={bottom} dim={dim} />
          </defs>
          <path d={d} fill={`url(#${uid}g)`} />
          <rect x={f3(x)} y={f3(y + 8 * s)} width={f3(w)} height={f3(9.5 * s)} fill={KNOCK} />
          <rect x={f3(x + 9 * s)} y={f3(y + 25 * s)} width={f3(15 * s)} height={f3(12 * s)} rx={f3(2.5 * s)} fill={KNOCK} />
          <rect x={f3(x + 32 * s)} y={f3(y + 28 * s)} width={f3(31 * s)} height={f3(6 * s)} rx={f3(3 * s)} fill={KNOCK} />
          <LitEdge x0={x + 5 * s} x1={x + w - 5 * s} y={y} k={k} dim={dim} />
        </g>
      ),
    };
  },
};
/** The shopping bag: a cream bag with one cord handle, its fold in ink. 58 x 80. */
export const BAG: PieceDef = {
  name: "bag",
  w: 58,
  h: 80,
  render: ({ cx, bottom, s, k, dim, uid }) => {
    const w = 58 * s;
    const hb = 58 * s; // the body
    const x = cx - w / 2;
    const y = bottom - hb;
    const d = rectPath(x, y, w, hb, 3.5 * s);
    const hw = 6 * s; // the handle's cord
    const hr = 13 * s;
    const handle = `M${f3(cx - hr)} ${f3(y + 2 * s)}V${f3(y - 6 * s)}A${f3(hr)} ${f3(hr)} 0 0 1 ${f3(cx + hr)} ${f3(y - 6 * s)}V${f3(y + 2 * s)}`;
    return {
      sil: [{ d }, { d: handle, stroke: hw }],
      body: (
        <g>
          <defs>
            <CardGradient id={`${uid}g`} y0={y - 19 * s} y1={bottom} dim={dim} />
          </defs>
          <path d={handle} fill="none" stroke={toneTop(dim)} strokeWidth={f3(hw)} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill={`url(#${uid}g)`} />
          {/* the handle's two eyelets and the fold line: the bag's only ink */}
          <circle cx={f3(cx - hr)} cy={f3(y + 8.5 * s)} r={f3(3.4 * s)} fill={KNOCK} />
          <circle cx={f3(cx + hr)} cy={f3(y + 8.5 * s)} r={f3(3.4 * s)} fill={KNOCK} />
          <LitEdge x0={x + 3.5 * s} x1={x + w - 3.5 * s} y={y} k={k} dim={dim} />
        </g>
      ),
    };
  },
};
/** The gift box: body, a wider lid, the ribbon in ink and a two-loop bow. 66 x 76. */
export const GIFT: PieceDef = {
  name: "gift",
  w: 66,
  h: 76,
  render: ({ cx, bottom, s, k, dim, uid }) => {
    const bw = 56 * s;
    const bh = 40 * s;
    const lw = 66 * s;
    const lh = 15 * s;
    const yb = bottom - bh;
    const yl = yb - lh;
    const body = rectPath(cx - bw / 2, yb - 2 * s, bw, bh + 2 * s, 3 * s, false, true);
    const lid = rectPath(cx - lw / 2, yl, lw, lh, 3 * s);
    const bowW = 6 * s;
    const loop = (sg: number) =>
      `M${f3(cx)} ${f3(yl + 1 * s)}C${f3(cx + sg * 4 * s)} ${f3(yl - 15 * s)} ${f3(cx + sg * 24 * s)} ${f3(yl - 22 * s)} ${f3(cx + sg * 24 * s)} ${f3(yl - 9 * s)}C${f3(cx + sg * 24 * s)} ${f3(
        yl - 1 * s,
      )} ${f3(cx + sg * 10 * s)} ${f3(yl + 1 * s)} ${f3(cx)} ${f3(yl + 1 * s)}`;
    const rib = 10 * s;
    return {
      sil: [{ d: body }, { d: lid }, { d: loop(-1), stroke: bowW }, { d: loop(1), stroke: bowW }],
      body: (
        <g>
          <defs>
            <CardGradient id={`${uid}g`} y0={yl - 18 * s} y1={bottom} dim={dim} />
          </defs>
          <path d={loop(-1)} fill="none" stroke={toneTop(dim)} strokeWidth={f3(bowW)} strokeLinecap="round" strokeLinejoin="round" />
          <path d={loop(1)} fill="none" stroke={toneTop(dim)} strokeWidth={f3(bowW)} strokeLinecap="round" strokeLinejoin="round" />
          <path d={body} fill={`url(#${uid}g)`} />
          {/* the lid's own shade on the body, then the lid */}
          <rect x={f3(cx - bw / 2)} y={f3(yb)} width={f3(bw)} height={f3(2.5 * s)} fill={KNOCK} fillOpacity={0.22} />
          <path d={lid} fill={`url(#${uid}g)`} />
          <rect x={f3(cx - rib / 2)} y={f3(yl)} width={f3(rib)} height={f3(lh + bh)} fill={KNOCK} />
          <LitEdge x0={cx - lw / 2 + 3 * s} x1={cx - rib / 2} y={yl} k={k} dim={dim} />
          <LitEdge x0={cx + rib / 2} x1={cx + lw / 2 - 3 * s} y={yl} k={k} dim={dim} />
        </g>
      ),
    };
  },
};
/** The parcel: a shipping box, its tape down from the top edge and an address label in ink. 68 x 54. */
export const PARCEL: PieceDef = {
  name: "parcel",
  w: 68,
  h: 54,
  render: ({ cx, bottom, s, k, dim, uid }) => {
    const w = 68 * s;
    const h = 54 * s;
    const x = cx - w / 2;
    const y = bottom - h;
    const d = rectPath(x, y, w, h, 3 * s);
    const tape = 11 * s;
    return {
      sil: [{ d }],
      body: (
        <g>
          <defs>
            <CardGradient id={`${uid}g`} y0={y} y1={bottom} dim={dim} />
          </defs>
          <path d={d} fill={`url(#${uid}g)`} />
          <path d={rectPath(cx - tape / 2, y, tape, 21 * s, 2 * s, false, true)} fill={KNOCK} />
          <rect x={f3(x + 8 * s)} y={f3(bottom - 21 * s)} width={f3(19 * s)} height={f3(13 * s)} rx={f3(2 * s)} fill={KNOCK} />
          <LitEdge x0={x + 3 * s} x1={cx - tape / 2} y={y} k={k} dim={dim} />
          <LitEdge x0={cx + tape / 2} x1={x + w - 3 * s} y={y} k={k} dim={dim} />
        </g>
      ),
    };
  },
};
/** A small tile as a piece (a product, a gift tile, a parcel tile rising out of a slot or standing in it):
 *  `size` world px at s = 1 (default 72 = the slot). */
export const tilePiece = (face: Face, size = SLOT_W): PieceDef => ({
  name: `tile:${face.kind}`,
  w: size,
  h: size,
  render: ({ cx, bottom, s, k, dim, uid }) => {
    const T = size * s;
    return {
      sil: [{ d: rectPath(cx - T / 2, bottom - T, T, T, (RADIUS * T) / TILE) }],
      body: <TileBody x={cx} top={bottom - T} T={T} k={k} face={face} dim={dim} slotW={0} uid={`${uid}t`} />,
    };
  },
});
export const productPiece = (glyph: GlyphName, size = SLOT_W) => tilePiece({ kind: "product", glyph }, size);
export const PIECES = { card: CARD, bag: BAG, gift: GIFT, parcel: PARCEL } as const;

/**
 * Piece — a piece on its own (travelling, or standing on the floor): its body and its ONE shadow.
 * (x, bottom) = its bottom-centre; `size` = the tile it belongs to (scale = size / TILE); `lift` 0..1 eases
 * the shadow toward the next elevation and raises the body LIFT_DY (pass travel().lift); `flip` = scaleX
 * about its centre (-1..1: a turn about its vertical axis).
 */
export const Piece: React.FC<{
  def: PieceDef;
  x: number;
  bottom: number;
  k: number;
  size?: number;
  dim?: number;
  elevation?: Elevation;
  lift?: number;
  shadow?: number;
  flip?: number;
}> = ({ def, x, bottom, k, size = TILE, dim = 0, elevation = "rest", lift = 0, shadow = 1, flip = 1 }) => {
  const uid = uidOf(useId());
  const s = size / TILE;
  const dy = LIFT_DY * s * smoothstep(lift);
  const r = def.render({ cx: x, bottom: bottom - dy, s, k, dim: clamp01(dim), uid });
  const tf = Math.abs(flip - 1) > 1e-6 ? `translate(${fx(x)} 0) scale(${fx(flip)} 1) translate(${fx(-x)} 0)` : undefined;
  return (
    <g>
      <UnionShadow
        sil={r.sil.map((q) => ({ ...q, tf }))}
        s={s}
        elevation={elevation}
        lift={lift}
        contact={elevation === "rest" ? { x, y: bottom, w: def.w * s * Math.abs(flip) } : null}
        strength={shadow}
      />
      <g transform={tf}>{r.body}</g>
    </g>
  );
};
export type PieceProps = Omit<React.ComponentProps<typeof Piece>, "def">;
export const PaymentCard: React.FC<PieceProps> = (p) => <Piece def={CARD} {...p} />;
export const ShoppingBag: React.FC<PieceProps> = (p) => <Piece def={BAG} {...p} />;
export const GiftBox: React.FC<PieceProps> = (p) => <Piece def={GIFT} {...p} />;
export const Parcel: React.FC<PieceProps> = (p) => <Piece def={PARCEL} {...p} />;

// ===========================================================================
// SLOTTED — a tile, and a piece rising out of the slot in its top edge: ONE object, ONE shadow
// ===========================================================================
export type SlottedProps = {
  /** the tile's centre x and its bottom edge (world px) */
  x: number;
  floor: number;
  k: number;
  /** the tile's size (default TILE); the piece scales with it */
  size?: number;
  face?: Face;
  /** 0 = cream (lit) .. 1 = board (context); or role "hi" / "lo" */
  dim?: number;
  role?: Role;
  /** the frame's amber band (amberBandM(cam)): the agent's gradient */
  band?: [number, number];
  elevation?: Elevation;
  /** 0..1 toward the next elevation; the whole object rises LIFT_DY with it */
  lift?: number;
  /** the shadow's strength (0 = none: e.g. a tile still under an occluder) */
  shadow?: number;
  /** the piece in the slot, and how far it is out: 0 = wholly inside the tile (hidden) .. 1 = standing on the
   *  tile's top edge. Past 1 it has left: draw a `Piece` instead. */
  piece?: PieceDef | null;
  out?: number;
  pieceDim?: number;
  /** scaleX of the piece about its centre (-1..1): a turn about its vertical axis (cut 5's flip) */
  pieceFlip?: number;
  /** show the empty slot (true = SLOT_W wide, or a width in world px at s = 1); the agent's is on by default */
  slot?: boolean | number;
  children?: React.ReactNode;
};
export const Slotted: React.FC<SlottedProps> = (p) => {
  const uid = uidOf(useId());
  const T = p.size ?? TILE;
  const s = T / TILE;
  const k = p.k;
  const face = p.face ?? { kind: "none" };
  const dim = clamp01(p.dim ?? (p.role === "lo" ? 1 : 0));
  const lift = clamp01(p.lift ?? 0);
  const dy = LIFT_DY * s * smoothstep(lift);
  const floor = p.floor - dy;
  const top = floor - T;
  const elevation = p.elevation ?? "rest";
  const out = clamp01(p.out ?? 0);
  const piece = p.piece && out > 0.0005 ? p.piece : null;
  const pr = piece ? piece.render({ cx: p.x, bottom: top + piece.h * s * (1 - out), s, k, dim: clamp01(p.pieceDim ?? 0), uid: `${uid}p` }) : null;
  const slotOpt = p.slot ?? face.kind === "agent";
  const slotW = p.piece ? p.piece.w * s : slotOpt === true ? SLOT_W * s : typeof slotOpt === "number" ? slotOpt * s : 0;
  const flip = p.pieceFlip ?? 1;
  const tf = Math.abs(flip - 1) > 1e-6 ? `translate(${fx(p.x)} 0) scale(${fx(flip)} 1) translate(${fx(-p.x)} 0)` : undefined;
  const clip = { x: p.x - 4000, y: top - 8000, w: 8000, h: 8000 }; // everything above the tile's top edge
  const sil: SilItem[] = [{ d: rectPath(p.x - T / 2, top, T, T, RADIUS * s) }];
  if (pr) for (const q of pr.sil) sil.push({ ...q, clip, tf });
  const vis = piece ? piece.h * s * out : 0;
  const ao = Math.min(vis, EDGE.FOOT_AO / k);
  return (
    <g>
      <defs>
        <clipPath id={`${uid}cl`}>
          <rect x={f3(clip.x)} y={f3(clip.y)} width={f3(clip.w)} height={f3(clip.h)} />
        </clipPath>
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
      </defs>
      <UnionShadow sil={sil} s={s} elevation={elevation} lift={lift} contact={elevation === "rest" ? { x: p.x, y: p.floor, w: T } : null} strength={p.shadow ?? 1} />
      {pr ? (
        <g clipPath={`url(#${uid}cl)`}>
          <g transform={tf}>{pr.body}</g>
          {ao > 0.01 && piece ? <rect x={f3(p.x - (piece.w * s * Math.abs(flip)) / 2)} y={f3(top - ao)} width={f3(piece.w * s * Math.abs(flip))} height={f3(ao)} fill={`url(#${uid}ao)`} /> : null}
        </g>
      ) : null}
      <TileBody x={p.x} top={top} T={T} k={k} face={face} dim={dim} band={p.band} slotW={pr || slotOpt ? slotW : 0} uid={`${uid}t`} />
      {p.children}
    </g>
  );
};
type TileProps = Omit<SlottedProps, "face">;
/** AgentTile — Muse: the amber tile (band gradient, the fixed bloom, the hot top edge), the Muse mark in ink,
 *  a working slot in its top edge. Pass `band={amberBandM(cam)}`. */
export const AgentTile: React.FC<TileProps> = (p) => <Slotted {...p} face={{ kind: "agent" }} />;
/** PersonTile — a person: a cream (or board) tile, the bust in ink. `variant` = who; `size` = how big
 *  (the protagonist one size up, a child smaller). */
export const PersonTile: React.FC<TileProps & { variant?: PersonVariant }> = ({ variant = "plain", ...p }) => <Slotted {...p} face={{ kind: "person", variant }} />;
/** ProductTile — a product (or a service, cut 7): one heavy glyph in ink. Cream = chosen, board = context. */
export const ProductTile: React.FC<TileProps & { glyph: GlyphName }> = ({ glyph, ...p }) => <Slotted {...p} face={{ kind: "product", glyph }} />;
/** A tile's world rect (for a LightSweep across it, or a label under it). */
export const tileRect = (x: number, floor: number, size = TILE) => ({ x: x - size / 2, y: floor - size, w: size, h: size });

// ===========================================================================
// THE BIG BUST (cut 7): the whole person, its strips, and a strip in its glass silo on a service tile
// ===========================================================================
/** The whole bust in cream, `h` tall and wide, bottom-centred on (cx, bottom), with its one shadow. */
export const BigBust: React.FC<{ cx: number; bottom: number; h: number; k: number; dim?: number; elevation?: Elevation; lift?: number; shadow?: number }> = ({
  cx,
  bottom,
  h,
  dim = 0,
  elevation = "rest",
  lift = 0,
  shadow = 1,
}) => {
  const uid = uidOf(useId());
  const d = bigBustPath(cx, bottom, h);
  return (
    <g>
      <defs>
        <CardGradient id={`${uid}g`} y0={bottom - h} y1={bottom} dim={clamp01(dim)} />
      </defs>
      <UnionShadow sil={[{ d }]} s={Math.max(1, h / (2 * TILE))} elevation={elevation} lift={lift} strength={shadow} />
      <path d={d} fill={`url(#${uid}g)`} />
    </g>
  );
};
/**
 * GlassColumn — the stout glass (the one transparent material): a faint cream tint and a cream hairline up
 * its sides and over its top, open at its base, standing on `baseY` (a tile's top edge: it rises out of the
 * slot as `h` grows). On its own it casts a faint shadow; inside a BustSilo it is part of that object's.
 */
export const GLASS = { hairline: 2, streak: 0.1 } as const;
export const GlassColumn: React.FC<{ x: number; baseY: number; w: number; h: number; k: number; role?: Role; shadow?: number; part?: "all" | "back" | "front" }> = ({
  x,
  baseY,
  w,
  h,
  k,
  role = "hi",
  shadow = 1,
  part = "all",
}) => {
  if (h <= 0.05) return null;
  const r = Math.min(RADIUS * 2, w / 2, h);
  const x0 = x - w / 2;
  const y0 = baseY - h;
  const hair = Math.max(STROKE.HAIRLINE, GLASS.hairline) / k;
  const hw = hair / 2;
  const d = rectPath(x0, y0, w, h, r, true, false);
  // one soft streak of light down its left side (the key light): what makes the tint read as glass on a phone
  const sx = x0 + w * 0.13;
  const sw = Math.max(w * 0.09, 3 / k);
  return (
    <g>
      {part === "all" && shadow > 0 ? <UnionShadow sil={[{ d, a: 0.3 }]} s={Math.max(1, w / TILE)} strength={shadow} /> : null}
      {part !== "front" ? <path d={d} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} /> : null}
      {part !== "back" ? (
        <path
          d={`M${f3(x0 + hw)} ${f3(baseY)}V${f3(y0 + hw + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x0 + hw + r)} ${f3(y0 + hw)}H${f3(x0 + w - hw - r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x0 + w - hw)} ${f3(
            y0 + hw + r,
          )}V${f3(baseY)}`}
          fill="none"
          stroke={COLOR.glass}
          strokeOpacity={role === "hi" ? ALPHA.glassHi : ALPHA.glassLo}
          strokeWidth={f3(hair)}
        />
      ) : null}
      {part !== "back" && h > r + 6 / k ? (
        <rect x={f3(sx)} y={f3(y0 + r + 2 / k)} width={f3(sw)} height={f3(Math.max(0, h - r - 4 / k))} rx={f3(sw / 2)} fill={COLOR.glass} fillOpacity={GLASS.streak} />
      ) : null}
    </g>
  );
};
/**
 * BustSilo — one of cut 7's four: a service tile (board, a service glyph), strip i of n of the big bust
 * standing on its top edge, and a glass column risen `glass` world px out of the tile's slot around it.
 * ONE object, ONE shadow. `x` = the tile's centre (the strip is centred on it); `size` = the tile (make it
 * the strip's width, bustH / n, so the four tuck into one base when they close); `bustH` = the whole bust's
 * height (= its width). When the four have closed, draw ONE `BigBust` over the four tiles instead.
 */
export const BustSilo: React.FC<{
  x: number;
  floor: number;
  k: number;
  size: number;
  glyph: GlyphName;
  i: number;
  n?: number;
  bustH: number;
  /** the glass column's height above the tile's top edge (0 = none) and its width (default = the tile) */
  glass?: number;
  glassW?: number;
  glassRole?: Role;
  tileDim?: number;
  stripDim?: number;
  elevation?: Elevation;
  lift?: number;
  shadow?: number;
}> = ({ x, floor, k, size, glyph, i, n = 4, bustH, glass = 0, glassW, glassRole = "hi", tileDim = 1, stripDim = 0, elevation = "rest", lift = 0, shadow = 1 }) => {
  const uid = uidOf(useId());
  const s = size / TILE;
  const dy = LIFT_DY * s * smoothstep(lift);
  const top = floor - dy - size;
  // the whole bust's centre such that strip i is centred on x
  const cx = x - ((i + 0.5) / n - 0.5) * bustH;
  const strip = bustStrip(cx, top, bustH, i, n);
  const gw = glassW ?? size;
  const gd = glass > 0.05 ? rectPath(x - gw / 2, top - glass, gw, glass, Math.min(RADIUS * 2, gw / 2, glass), true, false) : null;
  const sil: SilItem[] = [{ d: rectPath(x - size / 2, top, size, size, RADIUS * s) }, { d: strip.d }];
  if (gd) sil.push({ d: gd, a: 0.3 });
  return (
    <g>
      <defs>
        <CardGradient id={`${uid}g`} y0={top - bustH} y1={top} dim={clamp01(stripDim)} />
      </defs>
      <UnionShadow sil={sil} s={Math.max(1, s)} elevation={elevation} lift={lift} contact={elevation === "rest" ? { x, y: floor, w: size } : null} strength={shadow} />
      <GlassColumn x={x} baseY={top} w={gw} h={glass} k={k} part="back" />
      <path d={strip.d} fill={`url(#${uid}g)`} />
      <TileBody x={x} top={top} T={size} k={k} face={{ kind: "product", glyph }} dim={clamp01(tileDim)} slotW={gd ? gw : 0} uid={`${uid}t`} />
      <GlassColumn x={x} baseY={top} w={gw} h={glass} k={k} role={glassRole} part="front" />
    </g>
  );
};

/**
 * ServiceBase — cut 7's four service tiles tucked into ONE base: one board card `glyphs.length` x `size` wide
 * (its glyphs where the tiles' were), one shadow, one lit edge. Swap the four BustSilo tiles for it on the
 * frame they meet (same pixels inside; the seams and the inner shadows go).
 */
export const ServiceBase: React.FC<{ x: number; floor: number; k: number; size: number; glyphs: readonly GlyphName[]; dim?: number; elevation?: Elevation; lift?: number }> = ({
  x,
  floor,
  k,
  size,
  glyphs,
  dim = 1,
  elevation = "rest",
  lift = 0,
}) => {
  const uid = uidOf(useId());
  const s = size / TILE;
  const w = size * glyphs.length;
  const top = floor - LIFT_DY * s * smoothstep(lift) - size;
  const d = rectPath(x - w / 2, top, w, size, RADIUS * s);
  const dm = clamp01(dim);
  return (
    <g>
      <defs>
        <CardGradient id={`${uid}g`} y0={top} y1={top + size} dim={dm} />
      </defs>
      <UnionShadow sil={[{ d }]} s={Math.max(1, s)} elevation={elevation} lift={lift} contact={elevation === "rest" ? { x, y: floor, w } : null} />
      <path d={d} fill={`url(#${uid}g)`} />
      <LitEdge x0={x - w / 2 + RADIUS * s} x1={x + w / 2 - RADIUS * s} y={top} k={k} dim={dm} />
      {glyphs.map((g, i) => (
        <GlyphMark key={i} glyph={g} x={x - w / 2 + i * size} y={top} size={size} />
      ))}
    </g>
  );
};

// ===========================================================================
// THE CURSOR and THE BROWSER CARD (cut 3)
// ===========================================================================
const CURSOR_D = "M0 0V16.6L4.5 12.6L7.4 19.4L10.2 18.2L7.3 11.5H13.2Z";
/**
 * CursorArrow — the pointer: a cream arrow with a fine ink keyline, floating one elevation up (its shadow
 * falls on whatever is under it). (x, y) = its TIP (world px); `size` = its height. `press` 0..1 pushes it
 * down onto the surface (the shadow tightens to rest): a click, with no ripple.
 */
export const CursorArrow: React.FC<{ x: number; y: number; k: number; size?: number; press?: number; shadow?: number }> = ({ x, y, k, size = 44, press = 0, shadow = 1 }) => {
  const sc = size / 19.4;
  const pr = clamp01(press);
  const tfm = `translate(${fx(x)} ${fx(y)}) scale(${fx(sc)})`;
  return (
    <g>
      <UnionShadow sil={[{ d: CURSOR_D, tf: tfm }, { d: CURSOR_D, tf: tfm, stroke: 1.6 * sc }]} s={size / TILE + 0.4} elevation="rest" lift={1 - pr} strength={shadow} />
      <path d={CURSOR_D} transform={tfm} fill={COLOR.cream} stroke={KNOCK} strokeWidth={f3(1.6 + 3 / k / sc)} strokeLinejoin="round" />
      <path d={CURSOR_D} transform={tfm} fill={COLOR.cream} stroke={COLOR.cream} strokeWidth={1.6} strokeLinejoin="round" />
    </g>
  );
};
/** A browser card's default size (world px). */
export const BROWSER = { w: 184, h: 136 } as const;
/**
 * BrowserCard — a window: a board-tone card with a title bar (three dots, a URL pill), a product thumbnail
 * block and three text bars, all in ink. No brands, no text. (cx, cy) = its centre; `rot` degrees (a fanned
 * pile); `dim` 1 = board (default), 0 = cream; `press` 0..1 = pushed down by a click (it sinks 2 px and its
 * shadow tightens); `lift` while it travels. Later cards are drawn later: they lie on the pile.
 */
export const BrowserCard: React.FC<{
  cx: number;
  cy: number;
  k: number;
  w?: number;
  h?: number;
  rot?: number;
  dim?: number;
  elevation?: Elevation;
  lift?: number;
  press?: number;
  shadow?: number;
  /** scale about its centre (entering the agent's slot: by perspective, never by fading) */
  scale?: number;
}> = ({ cx, cy, k, w = BROWSER.w, h = BROWSER.h, rot = 0, dim = 1, elevation = "rest", lift = 0, press = 0, shadow = 1, scale = 1 }) => {
  const uid = uidOf(useId());
  const s = w / BROWSER.w;
  const x = -w / 2;
  const y = -h / 2;
  const d = rectPath(x, y, w, h, 5 * s);
  const dm = clamp01(dim);
  const pr = clamp01(press);
  const tfm = `translate(${fx(cx)} ${fx(cy + pr * 1.5 * s)}) rotate(${fx(rot)}) scale(${fx(scale)})`;
  const bar = 24 * s;
  const ink = KNOCK;
  return (
    <g>
      <UnionShadow sil={[{ d, tf: tfm }]} s={1.2 * s * scale} elevation={elevation} lift={lift} strength={shadow * (1 - 0.45 * pr)} />
      <g transform={tfm}>
        <defs>
          <CardGradient id={`${uid}g`} y0={y} y1={y + h} dim={dm} />
        </defs>
        <path d={d} fill={`url(#${uid}g)`} />
        {/* title bar: three dots, the URL pill, the bar's rule */}
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={f3(x + (12 + i * 11.5) * s)} cy={f3(y + bar / 2)} r={f3(3.6 * s)} fill={ink} />
        ))}
        <rect x={f3(x + 50 * s)} y={f3(y + 6.5 * s)} width={f3(w - 62 * s)} height={f3(11 * s)} rx={f3(5.5 * s)} fill={ink} />
        <rect x={f3(x)} y={f3(y + bar)} width={f3(w)} height={f3(Math.max(1.5 / k, 1.2 * s))} fill={ink} fillOpacity={ALPHA.slot} />
        {/* the product thumbnail and three text bars */}
        <rect x={f3(x + 12 * s)} y={f3(y + bar + 12 * s)} width={f3(70 * s)} height={f3(h - bar - 24 * s)} rx={f3(4 * s)} fill={ink} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={f3(x + 94 * s)} y={f3(y + bar + (16 + i * 25) * s)} width={f3((i === 2 ? 48 : 78) * s)} height={f3(12 * s)} rx={f3(6 * s)} fill={ink} />
        ))}
        <LitEdge x0={x + 5 * s} x1={x + w - 5 * s} y={y} k={k * scale} dim={dm} />
      </g>
    </g>
  );
};

// ===========================================================================
// THE LEDGE, THE WEEK RAIL and THE DEADLINE POST (cuts 2 and 4)
// ===========================================================================
/** A ledge's thickness (world px). */
export const LEDGE_H = 7;
/**
 * Ledge — a thin card strip things stand on (cut 2's shelves in board, cut 4's rail in cream): `y` = its TOP
 * edge (= the floor of what stands on it), from x0 to x1; one resting shadow; the lit top edge.
 * `slots` = [x, width] slot lines cut in its top edge (where a post or a piece rises out of it).
 */
export const Ledge: React.FC<{ x0: number; x1: number; y: number; k: number; dim?: number; h?: number; slots?: [number, number][] }> = ({ x0, x1, y, k, dim = 0, h = LEDGE_H, slots = [] }) => {
  const uid = uidOf(useId());
  const d = rectPath(x0, y, x1 - x0, h, Math.min(RADIUS, h / 2));
  const dm = clamp01(dim);
  const sh = slotH(k, 1);
  return (
    <g>
      <defs>
        <CardGradient id={`${uid}g`} y0={y} y1={y + h} dim={dm} />
      </defs>
      <UnionShadow sil={[{ d }]} s={0.6} />
      <path d={d} fill={`url(#${uid}g)`} />
      <LitEdge x0={x0 + 2} x1={x1 - 2} y={y} k={k} dim={dm} />
      {slots.map(([sx, sw], i) => (
        <rect key={i} x={f3(sx - sw / 2 - EDGE.SLOT_LIP / k)} y={f3(y - sh * 0.25)} width={f3(sw + (2 * EDGE.SLOT_LIP) / k)} height={f3(sh)} rx={f3(Math.min(sh / 2, 1.2))} fill={KNOCK} fillOpacity={0.8} />
      ))}
    </g>
  );
};
export const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI"] as const;
/** The x of day i's station on a rail from x0 to x1 (five stations, half a pitch in from each end). */
export const dayX = (x0: number, x1: number, i: number, n: number = WEEK_DAYS.length) => x0 + ((i + 0.5) * (x1 - x0)) / n;
/**
 * WeekRail — a delivery week: a cream Ledge from x0 to x1 (its top edge at `y`: parcels stand on it), a
 * station tick under the rail at each day and the day's name in Label caps directly under it (LABEL px, SCREEN;
 * the label's bottom is y + (LEDGE_H + 12/k + (16 + px x 0.718) / k) world: keep it above CAPTION_Y0).
 * `amber[i]` 0..1 turns day i's label and tick amber (by tone, ease it with tone()); `slots` as Ledge.
 */
export const WeekRail: React.FC<{
  x0: number;
  x1: number;
  y: number;
  k: number;
  days?: readonly string[];
  amber?: number[];
  px?: number;
  dim?: number;
  slots?: [number, number][];
}> = ({ x0, x1, y, k, days = WEEK_DAYS, amber = [], px = TYPE.LABEL, dim = 0, slots }) => {
  const fs = px / k;
  const tick = 12 / k;
  const tw = 4 / k;
  return (
    <g>
      <Ledge x0={x0} x1={x1} y={y} k={k} dim={dim} slots={slots} />
      {days.map((dname, i) => {
        const x = dayX(x0, x1, i, days.length);
        const a = clamp01(amber[i] ?? 0);
        const col = mixHex(COLOR.inkCream, COLOR.amberTop, a);
        return (
          <g key={dname}>
            <rect x={f3(x - tw / 2)} y={f3(y + LEDGE_H)} width={f3(tw)} height={f3(tick)} fill={col} />
            <text
              x={f3(x + (TRACK.label * fs) / 2)}
              y={f3(y + LEDGE_H + tick + (16 + px * METRIC.cap) / k)}
              fontFamily={FONT_LABEL}
              fontWeight={500}
              fontSize={f3(fs)}
              letterSpacing={`${TRACK.label}em`}
              textAnchor="middle"
              fill={col}
              style={{ fontFeatureSettings: '"case" 1, "lnum" 1', filter: a > 0.02 ? bloomFilter(k) : undefined }}
            >
              {dname.toUpperCase()}
            </text>
          </g>
        );
      })}
    </g>
  );
};
/** The deadline post's full size (world px): its bar and its head. */
export const POST = { w: 12, headW: 44, headH: 24, H: 110 } as const;
/**
 * DeadlinePost — the deadline: an amber post (a bar with a head) rising out of a slot in the rail at `x`.
 * `baseY` = the rail's top edge; `rise` 0..1 = how far it is out (0 hidden in the rail, 1 fully up: `H` tall
 * from baseY to the head's top); amber band gradient, the fixed bloom, the hot edge on the head, one shadow.
 * Give the rail a slot for it: `slots={[[x, POST.headW]]}`.
 */
export const DeadlinePost: React.FC<{ x: number; baseY: number; k: number; rise?: number; H?: number; band?: [number, number]; shadow?: number }> = ({
  x,
  baseY,
  k,
  rise = 1,
  H = POST.H,
  band,
  shadow = 1,
}) => {
  const uid = uidOf(useId());
  const u = clamp01(rise);
  if (u <= 0.0005) return null;
  const top = baseY - H * u;
  const head = rectPath(x - POST.headW / 2, top, POST.headW, POST.headH, RADIUS);
  const bar = rectPath(x - POST.w / 2, top + POST.headH - 2, POST.w, H - POST.headH + 2, 0, false, false);
  const clip = { x: x - 4000, y: baseY - 8000, w: 8000, h: 8000 };
  return (
    <g>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band ? band[0] : baseY - 2 * H} y1={band ? band[1] : baseY + H} />
        <clipPath id={`${uid}cl`}>
          <rect x={f3(clip.x)} y={f3(clip.y)} width={f3(clip.w)} height={f3(clip.h)} />
        </clipPath>
      </defs>
      <UnionShadow sil={[{ d: head, clip }, { d: bar, clip }]} s={0.8} strength={shadow} />
      <g clipPath={`url(#${uid}cl)`}>
        <g style={{ filter: bloomFilter(k) }}>
          <path d={bar} fill={`url(#${uid}a)`} />
          <path d={head} fill={`url(#${uid}a)`} />
        </g>
        <HotEdge x={x - POST.headW / 2} y={top} w={POST.headW} k={k} r={RADIUS} id={`${uid}h`} />
      </g>
    </g>
  );
};

// ===========================================================================
// THE AMBER THREAD (cut 6): a path that draws from its source with a touching tip; beads at constant speed
// ===========================================================================
export type Thread = { pts: P[]; cum: number[]; len: number; at: (d: number) => P; path: (d0: number, d1: number) => string };
/**
 * makeThread — a smooth thread through control points (Catmull-Rom, sampled every ~`step` world px), measured
 * by arc length. `at(d)` = the point d world px from the source (so the frame its tip touches a tile is
 * known: cause before effect); `path(d0, d1)` = the stretch between two distances.
 */
export const makeThread = (ctrl: P[], step = 3): Thread => {
  const pts: P[] = [];
  const C = [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]];
  for (let i = 1; i < C.length - 2; i++) {
    const [p0, p1, p2, p3] = [C[i - 1], C[i], C[i + 1], C[i + 2]];
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      pts.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  pts.push(ctrl[ctrl.length - 1]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  const at = (d: number): P => {
    const q = Math.max(0, Math.min(len, d));
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (cum[m] <= q) lo = m;
      else hi = m;
    }
    const t = cum[hi] > cum[lo] ? (q - cum[lo]) / (cum[hi] - cum[lo]) : 0;
    return [lerp(pts[lo][0], pts[hi][0], t), lerp(pts[lo][1], pts[hi][1], t)];
  };
  const path = (d0: number, d1: number) => {
    const a = Math.max(0, Math.min(len, d0));
    const b = Math.max(0, Math.min(len, d1));
    if (b - a < 0.01) return "";
    const out: P[] = [at(a)];
    for (let i = 0; i < pts.length; i++) if (cum[i] > a && cum[i] < b) out.push(pts[i]);
    out.push(at(b));
    return `M${out.map(([x, y]) => `${f3(x)} ${f3(y)}`).join("L")}`;
  };
  return { pts, cum, len, at, path };
};
/**
 * beadDistances — beads on a thread at CONSTANT speed (world px / frame), `spacing` apart, as distances from
 * the source. `inward` (default): they run from the far end INTO the source (what the agent knows, coming
 * back), entering at the far end from f0 on. Draw the thread UNDER the tiles at both ends, so a bead comes
 * out from under one tile and goes in under the other (nothing appears from nothing).
 */
export const beadDistances = (thread: Thread, f: number, o: { f0?: number; speed?: number; spacing?: number; inward?: boolean; until?: number } = {}) => {
  const speed = o.speed ?? 6;
  const spacing = o.spacing ?? 70;
  const run = (f - (o.f0 ?? 0)) * speed; // how far the first bead has run
  if (run <= 0) return [];
  const out: number[] = [];
  const last = o.until === undefined ? Infinity : (o.until - (o.f0 ?? 0)) * speed; // beads stop being released after `until`
  for (let i = 0; i * spacing <= Math.min(run, last); i++) {
    const d = run - i * spacing; // this bead's run from its end
    if (d > thread.len) continue;
    out.push(o.inward === false ? d : thread.len - d);
  }
  return out;
};
/**
 * AmberThread — the agent's reach: an amber thread lying on the ground from its source (d = 0), drawn out to
 * `head` world px (or `draw` 0..1 of its length) with a round tip that leads it (the tip TOUCHES what it
 * lights: read its point with thread.at(head)); `tail` trims its source end (a thread being reeled away).
 * `beads` = distances (beadDistances) of the hot beads running along it. Width in world px (it is a thing in
 * the world; never below 4 screen px). The band gradient, the fixed bloom, a resting shadow.
 */
export const AmberThread: React.FC<{
  thread: Thread;
  k: number;
  draw?: number;
  head?: number;
  tail?: number;
  width?: number;
  tip?: boolean;
  beads?: number[];
  band?: [number, number];
}> = ({ thread, k, draw = 1, head, tail = 0, width = 5, tip = true, beads = [], band }) => {
  const uid = uidOf(useId());
  const hd = head ?? clamp01(draw) * thread.len;
  if (hd - tail < 0.05) return null;
  const w = Math.max(width, 4 / k);
  const d = thread.path(tail, hd);
  const [tx, ty] = thread.at(hd);
  const ys = thread.pts.map((p) => p[1]);
  const shadowL = ELEVATION.rest.key;
  const inRange = beads.filter((b) => b >= tail && b <= hd);
  const br = w * 1.35;
  return (
    <g>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band ? band[0] : Math.min(...ys) - 200} y1={band ? band[1] : Math.max(...ys) + 200} />
      </defs>
      <g opacity={f3(shadowL.a)} transform={`translate(${fx(shadowL.dx * 0.6)} ${fx(shadowL.dy * 0.6)})`} style={{ filter: `blur(${f3(shadowL.blur * 0.6)}px)` }}>
        <path d={d} fill="none" stroke={COLOR.shadow} strokeWidth={f3(w)} strokeLinecap="round" strokeLinejoin="round" />
        {inRange.map((b, i) => {
          const [bx, by] = thread.at(b);
          return <circle key={i} cx={f3(bx)} cy={f3(by)} r={f3(br)} fill={COLOR.shadow} />;
        })}
      </g>
      <g style={{ filter: bloomFilter(k) }}>
        <path d={d} fill="none" stroke={`url(#${uid}a)`} strokeWidth={f3(w)} strokeLinecap="round" strokeLinejoin="round" />
        {tip && hd < thread.len - 0.01 ? <circle cx={f3(tx)} cy={f3(ty)} r={f3(w * 1.1)} fill={COLOR.amberTop} /> : null}
      </g>
      {inRange.map((b, i) => {
        const [bx, by] = thread.at(b);
        return (
          <g key={i}>
            <circle cx={f3(bx)} cy={f3(by)} r={f3(br)} fill={COLOR.amberTop} />
            <circle cx={f3(bx)} cy={f3(by)} r={f3(br * 0.62)} fill={COLOR.amberHot} />
          </g>
        );
      })}
    </g>
  );
};

// ===========================================================================
// A TURN ABOUT THE VERTICAL AXIS (cut 5): the scaleX of each face of a card turning by `u` 0..1
// ===========================================================================
/** A card turning once about its vertical axis: u 0 = the front flat, 1 = the back flat. Returns which face
 *  shows and its scaleX (cos of the turn; exactly edge-on at u = 0.5), plus `lift` (it lifts while it turns). */
export const flipAt = (u: number) => {
  const t = smoothstep(u);
  const c = Math.cos(Math.PI * t);
  return { face: (c >= 0 ? "front" : "back") as "front" | "back", scaleX: Math.max(0.02, Math.abs(c)), lift: Math.sin(Math.PI * clamp01(u)) };
};
