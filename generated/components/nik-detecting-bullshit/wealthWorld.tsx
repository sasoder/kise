import React, { useId } from "react";
import {
  ALPHA,
  COLOR,
  EDGE,
  ElevationShadow,
  FONT_LABEL,
  FONT_NUM,
  METRIC,
  SPACE,
  TRACK,
  bloomFilter,
  clamp01,
  easeOutCubic,
  labelWidth,
  lerp,
  mixHex,
  numeralWidth,
  rectPath,
  snapLen,
} from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack, type Cam, type Glide, type PoolKey } from "../kits/cheeky-pint/museShared";
import { REVOLUT_R_BOX, REVOLUT_R_D } from "../nik-trend-friend/revolutMark";

// ===========================================================================
// wealthWorld REV 2 — the shared growth world of "nik - my job is detecting bullshit" (Cheeky Pint S4E06,
// Nik Storonsky), cuts B `GrewSixtyToEighty` (32.407-36.662 s) and C `NewTeamThreeHundred` (46.004-51.426
// s). Stout board, palette B1, every colour / edge / shadow / bloom a stoutShared token. API + B's end
// state: animation_source/notes/WEALTH_READY.md (rev 2). Brief: animation_source/notes/brief_BC_rev2.md.
//
// REV 2 (the user: the pegs on top of the tile look stuck on, two shadow systems, B and C don't go
// together): ONE CENTRED, SYMMETRIC composition. The tile is centred on x 540 and every camera stays on
// x 540; the three slots are symmetric about the tile's centre (last year LEFT, this year CENTRE, C's
// RIGHT). The team lives INSIDE the tile's face: a recessed window (a darker inset, like a little display)
// holding three picture-book busts (big round head, shoulders, flat fills, two dot eyes, a blush; no
// outlines, no shadows), next to the R + "WEALTH & TRADING" print; the face row is centred on the tile.
// One shadow system: the tile's (+ its contact) and each bar's; nothing else casts one.
//
//   THE PRODUCT TILE  one wide cream card = Revolut's Wealth & Trading product: the face row = the team
//                     window + the real R (revolutMark, Commons "Revolut_logo.svg", public-domain text logo)
//                     stamped in ink + "WEALTH & TRADING" in ink Kräftig caps.
//   THE BARS          rise out of their slots (slot joint). Cream up to `cream`, AMBER above (band
//                     gradient from amberBandFor, fixed bloom, 2 px hot top edge): the amber is the growth.
//                     An empty slot is a dark open pocket in the top edge; it closes to the 2 px joint line
//                     as a bar fills it.
//   THE TEAM          FaceTeam: busts by window place (0 1 2), each with `drop` 0 (seated) .. 1 (wholly
//                     below the window's bottom edge, masked by the window). C's swap: the old (kraft)
//                     busts drop out, the new (cream) busts rise in (drop 1 -> 0), in the same places.
//   THE LABELS        GrowthLabel: Dreiviertelfett at a SCREEN size (counter-scaled: the same px at any k),
//                     amber with the bloom, `dim` 0..1 to the lo tone (glow off) at the same size.
//   THE CLOCK         S = cut B's frame (0..B_LAST_S = 101). Cut C opens on B's last frame: C's S =
//                     B_LAST_S + its own frame (the 9.342 s of speaker between is NOT on the clock).
//   THE CAMERA        makeWealthCam(extraGlides, fEnd): B's glides + C's appends (f0 >= B_LAST_S); the
//                     house glides + damped follower (museShared makeClockCam: look = the frame's middle).
//                     Identical through S = B_LAST_S whatever C appends. B's glides have no dx: x stays 540.
//                     The light pool: makeWealthPool(extraKeys, fEnd), same rule.
// ===========================================================================

export const FPS = 24000 / 1001;
/** Cut B: 32.407 -> 36.662 s = 4.255 s x 23.976 = 102 frames (S 0..101). */
export const B_DURATION = 102;
export const B_LAST_S = B_DURATION - 1; // 101
/** Cut C's slot starts 46.004 s, 9.342 s after B's (36.662): not on the clock (C's S = B_LAST_S + f). */
export const C_GAP_S = 46.004 - 36.662;

// --- geometry (WORLD px) ------------------------------------------------------------------------------
/** The frame's (and the tile's) centre line. Every camera stays on it. */
export const CENTRE_X = 540;
/** The product tile: centre x, top edge, width, height. It stands on FLOOR. */
export const TILE = { X: CENTRE_X, TOP: 1200, W: 414, H: 56 } as const;
export const TILE_X0 = TILE.X - TILE.W / 2; // 333
export const TILE_X1 = TILE.X + TILE.W / 2; // 747
export const FLOOR = TILE.TOP + TILE.H; // 1256
/** Every bar's width (120 screen px at REST_K; ~94 at C's suggested end). */
export const BAR_W = 60;
/** One unit of growth = last year's bar (world px; 110 screen px at REST_K). B: last 1.0, this 1.7; C: 6.8. */
export const BAR_UNIT = 55;
/** The k all data heights are snapped at (snapLen): B's resting framing. */
export const REST_K = 2.0;
/** Slot pitch: the slots sit symmetric about the tile's centre, spread wide so that in C the old label
 *  (centred over the centre bar, LABEL_PX wide) clears the tall right bar at C's pulled-back zoom. */
export const SLOT_PITCH = 152;
/** Slot centres along the tile's top edge: [last year (left), this year (centre), cut C's (right)]. */
export const SLOT_X = [TILE.X - SLOT_PITCH, TILE.X, TILE.X + SLOT_PITCH] as const;

/** The bars' heights in units, and in world px (snapped at REST_K). `cream` = the cream part's height;
 *  above it the bar is amber (the growth). */
export const UNITS = { last: 1.0, now: 1.7, next: 6.8 } as const;
export const BAR_H = {
  last: snapLen(UNITS.last * BAR_UNIT, REST_K), // 55 (110 px)
  now: snapLen(UNITS.now * BAR_UNIT, REST_K), // 93.5 (187 px)
  next: snapLen(UNITS.next * BAR_UNIT, REST_K), // 374 (C: +300 %)
} as const;
export const BAR_CREAM = {
  last: BAR_H.last, // all cream
  now: BAR_H.last, // cream up to last year's height, the +0.7 above it amber
  next: BAR_H.now, // C: cream up to this year's 1.7, the 5.1 above it amber
} as const;

// --- the tile's face row (WORLD px; printed on the card, so it scales with the world) -------------------
/** The team window + R + name, one row centred on the tile.
 *  WIN: the recessed window (w x h, corner r); BUST: head diameter, shoulders w x h, the head's overlap
 *  into the shoulders, the bust pitch; R_H: the R's height; GAP_WR: window -> R; GAP_RT: R -> name; FS:
 *  the name's size. */
/*  REV 3 (the user, Nov 17: "make the text look more harmonious next to the Revolut logo, now it's not aligned
 *  super well and the size is maybe wrong"): the bare R was 1.67x the caps' height, hung below the baseline
 *  and was lighter than the caps; shrunk to cap height it read as a letter of the name. Now the logo is an
 *  app-icon badge (ink rounded square, the cream R centred in it, R = BADGE_R x its height), the name's
 *  caps centred on the badge's middle, one row: window | badge | name, the gaps in proportion.
 *  BADGE: the badge's side, R_H: the R inside it, GAP_WR: window -> badge, GAP_RT: badge -> name. */
const FACE_BADGE = 28;
export const FACE = {
  WIN: { w: 100, h: 42, r: 3 },
  BUST: { head: 22, shW: 28, shH: 12, overlap: 3.5, pitch: 32 },
  BADGE: FACE_BADGE,
  BADGE_R: 7,
  R_H: 0.56 * FACE_BADGE,
  GAP_WR: 14,
  GAP_RT: 9,
  FS: 20,
  TEXT: "Wealth & Trading",
} as const;
/** REV 3: the whole scene sits this many SCREEN px lower in B and C (StoutStage dy; the user's usual "move
 *  it down slightly"). Same in both cuts, so the B -> C join stays exact. The checks below and in B / C are
 *  the composition before this shift: the face row now lands in caption band 1, the user's choice. */
export const SHIFT_Y = 190;
/** The face row's layout (world px): the window rect, its three bust x's (left .. right), the R box, the
 *  name's baseline start. `bustBase` = the shoulders' bottom = the window's bottom edge. */
export const faceLayout = () => {
  const rw = (FACE.R_H * REVOLUT_R_BOX.w) / REVOLUT_R_BOX.h;
  const tw = labelWidth(FACE.TEXT, FACE.FS) - TRACK.label * FACE.FS; // the advance minus the trailing track
  const total = FACE.WIN.w + FACE.GAP_WR + FACE.BADGE + FACE.GAP_RT + tw;
  const cy = TILE.TOP + TILE.H / 2;
  const x0 = TILE.X - total / 2;
  const win = { x: x0, y: cy - FACE.WIN.h / 2, w: FACE.WIN.w, h: FACE.WIN.h };
  const wcx = win.x + win.w / 2;
  const busts = [-1, 0, 1].map((i) => wcx + i * FACE.BUST.pitch);
  const bx = win.x + win.w + FACE.GAP_WR;
  return {
    total,
    win,
    busts,
    bustBase: win.y + win.h,
    badge: { x: bx, y: cy - FACE.BADGE / 2, s: FACE.BADGE },
    r: { x: bx + (FACE.BADGE - rw) / 2, y: cy - FACE.R_H / 2, w: rw, h: FACE.R_H },
    text: { x: bx + FACE.BADGE + FACE.GAP_RT, y: cy + (METRIC.cap * FACE.FS) / 2, w: tw },
  };
};
/** A bust's whole height (shoulders + head - overlap), world px. A bust at drop 1 is this far down + 1. */
export const BUST_H = FACE.BUST.shH + FACE.BUST.head - FACE.BUST.overlap;

// --- B's beats (cut-B frames = S) ---------------------------------------------------------------------
// think f7 · two f10 · or f16 · three f19 · years f21 · ago f27 · it f32 · grew f40 · up f45 · 60 % f50 ·
// or f62 · 80 % f66 · year f75 · on f81 · year f83 · (speech ends ~f86) · and f88 · slot ends f102.
export const B_T = {
  RISE1: [-4, 26], // last year's bar, rest to rest, already emerging on f0 (two or three years ago)
  RISE2: [32, 66], // this year's bar, ONE rise: cream to 1.0 (~f47), amber on to 1.7, lands on "80" (f66)
  LABEL_IN: 56, // "+60–80%" blurs in + slides up 24 px over 12 f: in f56-68 (60 f50 .. 80 f66)
} as const;
/** ONE decelerating curve from rest to rest: p(t) = 1 - (1-t)^b (1 + b t), velocity ∝ t (1-t)^(b-1). */
export const RISE_SHAPE = 3;
export const riseCurve = (t: number, b: number = RISE_SHAPE) => {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, b) * (1 + b * u);
};
const winT = (S: number, [a, b]: readonly [number, number] | readonly number[]) => (S - a) / (b - a);
/** B's bar heights at story time S (world px): last year's, this year's. Constant after B's landing. */
export const bBars = (S: number) => ({
  last: BAR_H.last * riseCurve(winT(S, B_T.RISE1)),
  now: BAR_H.now * riseCurve(winT(S, B_T.RISE2)),
});
/** The lifted share of a rising bar's shadow: up to LIFT_PEAK mid-rise, rest (0) on landing. */
export const LIFT_PEAK = 0.5;
export const riseLift = (S: number, win: readonly number[]) => {
  const t = winT(S, win);
  return t <= 0 || t >= 1 ? 0 : LIFT_PEAK * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 2);
};

// --- the labels: SCREEN-sized, so "+60–80%" and C's "+300%" are the same size on screen at any k ---------
/** 80 SCREEN px, between the LABEL (30) and SECONDARY (136) tokens: at SECONDARY "+60–80%" is ~600 px
 *  wide and in C (centred over the centre bar, the brief's rule) it would run into the 4x bar beside it. */
export const LABEL_PX = 80;
export const B_LABEL = { text: "+60–80%", px: LABEL_PX } as const;
/** B's label baseline (world y) under camera k: SPACE.CLEAR screen px above this year's bar top
 *  (+ `dy` screen px lower: C may tuck it toward its bar). */
export const bLabelY = (k: number, dy = 0) => TILE.TOP - BAR_H.now - (SPACE.CLEAR - dy) / k;

// --- camera (museShared makeClockCam: look = world point on the frame's middle) ------------------------
/** The look and k before the pre-roll (the opening creep is already moving on f0). x stays CENTRE_X. */
export const B_CAM_START = { x: CENTRE_X, y: 1331, k: 1.85 } as const;
export const B_CAM_GLIDES: Glide[] = [
  { f0: -12, f1: 74, dy: -42, k: 1.95, warp: 1 }, // already drifting in on f0 (tile top y ~790), tilting up with the bars (two or three years ago .. 80 %): the tile ends at top y ~858
  { f0: 40, f1: 170, dy: 1.6, k: 2.03, warp: 1 }, // the creep: carries on through B's hold and past its end (into C, unless C's glides take over)
];
export const makeWealthCam = (extra: Glide[] = [], fEnd: number = B_LAST_S) => makeClockCam(B_CAM_START, [...B_CAM_GLIDES, ...extra], Math.max(fEnd, B_LAST_S));
export const B_CAM = makeWealthCam();
/** B's last frame's camera (S = 101), at full precision. C's f0 renders this. */
export const B_END_CAM: Cam = B_CAM.at(B_LAST_S);
/** The ground's parallax origin (StoutStage `rest`) for B and C. */
export const WEALTH_REST: Cam = B_CAM.rest;
/** A SUGGESTION for C's end: 0.78 x B's end zoom (the brief's floor is 0.75), x 540, the tile's foot at y
 *  1058. The 6.8-unit bar's top then sits at y ~400 with room for "+300%" above it (top >= ~300), and the
 *  dimmed "+60–80%" centred over the centre bar clears the tall bar by >= 12 px. C owns its camera. */
export const C_END_K = 0.78 * B_END_CAM.k;
export const C_TALL_CAM: Cam = { x: CENTRE_X, y: FLOOR - (1058 - 960) / C_END_K, k: C_END_K };

// --- the light pool (museShared makePoolTrack: eased keys + the pool's damped follower) -----------------
export const B_POOL_START = { x: CENTRE_X, y: TILE.TOP - 10, strength: 1.5 } as const;
export const B_POOL_KEYS: PoolKey[] = [
  { f0: 0, f1: 24, x: (SLOT_X[0] + CENTRE_X) / 2, y: TILE.TOP - 40 }, // toward last year's bar
  { f0: 34, f1: 66, x: CENTRE_X, y: TILE.TOP - 70 }, // up onto this year's bar as it grows
  { f0: 66, f1: 120, x: CENTRE_X - 20, y: TILE.TOP - 60 }, // settles over the two
];
export const makeWealthPool = (extra: PoolKey[] = [], fEnd: number = B_LAST_S) => makePoolTrack(B_POOL_START, [...B_POOL_KEYS, ...extra], Math.max(fEnd, B_LAST_S));
export const B_POOL = makeWealthPool();

// ===========================================================================
// THE TEAM (busts in the face window)
// ===========================================================================
export type BustTone = "kraft" | "cream";
export type BustHair = "crop" | "bun" | "fringe";
/** A bust: its window place (0 left, 1 middle, 2 right), its tone, its hair, `drop` 0 (seated) .. 1
 *  (wholly below the window's bottom edge). */
export type BustSpec = { place: 0 | 1 | 2; tone: BustTone; hair?: BustHair; drop?: number; key?: string };
/** B's team: three kraft busts (anyone, board tone), seated. C drops them out and raises its own. */
export const TEAM_OLD: BustSpec[] = [
  { place: 0, tone: "kraft", hair: "crop", key: "old0" },
  { place: 1, tone: "kraft", hair: "bun", key: "old1" },
  { place: 2, tone: "kraft", hair: "fringe", key: "old2" },
];
/** A suggestion for C's new team (cream = whoever the line is about). */
export const TEAM_NEW: BustSpec[] = [
  { place: 0, tone: "cream", hair: "fringe", key: "new0" },
  { place: 1, tone: "cream", hair: "crop", key: "new1" },
  { place: 2, tone: "cream", hair: "bun", key: "new2" },
];
/** The offset (world px, down) of a bust at `drop`. */
export const bustDropY = (drop: number) => clamp01(drop) * (BUST_H + 1);

// ===========================================================================
// DRAWN PIECES
// ===========================================================================
const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `ww${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

/** The window's ground: a dark recess (the board's ground mixed toward board). */
export const WIN_FILL = mixHex(COLOR.ground, COLOR.board, 0.22);
const toneOf = (t: BustTone) => (t === "cream" ? COLOR.cream : COLOR.board);
const BLUSH = "#E39A82";

/** One picture-book bust, shoulders' bottom centred on (x, base): flat fills, no outline, no shadow. */
export const Bust: React.FC<{ x: number; base: number; tone: BustTone; hair?: BustHair }> = ({ x, base, tone, hair = "crop" }) => {
  const uid = uidOf(useId());
  const B = FACE.BUST;
  const fill = toneOf(tone);
  const hairC = mixHex(fill, COLOR.inkDark, tone === "cream" ? 0.42 : 0.5);
  const r = B.head / 2;
  const shTop = base - B.shH;
  const hy = shTop - r + B.overlap; // head centre
  const shR = Math.min(B.shH * 0.9, B.shW / 2);
  const eye = B.head * 0.055;
  const eyeDx = B.head * 0.17;
  const eyeY = hy + B.head * 0.06;
  // hair: a cap clipped to the head (crop: level; fringe: swept low on one side), a bun on top
  const capY = hy - r * 0.28;
  const cap =
    hair === "fringe"
      ? `M${f2(x - r - 1)} ${f2(hy + r * 0.05)}L${f2(x + r + 1)} ${f2(hy - r * 0.42)}L${f2(x + r + 1)} ${f2(hy - r - 1)}L${f2(x - r - 1)} ${f2(hy - r - 1)}Z`
      : `M${f2(x - r - 1)} ${f2(capY)}H${f2(x + r + 1)}V${f2(hy - r - 1)}H${f2(x - r - 1)}Z`;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}h`}>
          <circle cx={f2(x)} cy={f2(hy)} r={f2(r)} />
        </clipPath>
      </defs>
      <path d={rectPath(x - B.shW / 2, shTop, B.shW, B.shH + 1, shR, true, false)} fill={fill} />
      {hair === "bun" ? <circle cx={f2(x)} cy={f2(hy - r * 0.98)} r={f2(r * 0.36)} fill={hairC} /> : null}
      <circle cx={f2(x)} cy={f2(hy)} r={f2(r)} fill={fill} />
      <path d={cap} fill={hairC} clipPath={`url(#${uid}h)`} />
      <g fill={COLOR.inkDark}>
        <circle cx={f2(x - eyeDx)} cy={f2(eyeY)} r={f2(eye)} />
        <circle cx={f2(x + eyeDx)} cy={f2(eyeY)} r={f2(eye)} />
      </g>
      <g fill={BLUSH} fillOpacity={tone === "cream" ? 0.45 : 0.3}>
        <ellipse cx={f2(x - B.head * 0.28)} cy={f2(eyeY + B.head * 0.15)} rx={f2(B.head * 0.085)} ry={f2(B.head * 0.05)} />
        <ellipse cx={f2(x + B.head * 0.28)} cy={f2(eyeY + B.head * 0.15)} rx={f2(B.head * 0.085)} ry={f2(B.head * 0.05)} />
      </g>
    </g>
  );
};

/** The team window: the recess (dark fill, the top wall's shade inside it), the busts masked by the
 *  window (a bust at `drop` slides down out of its bottom edge), the window's lit front lip. */
export const FaceTeam: React.FC<{ team: BustSpec[]; k: number }> = ({ team, k }) => {
  const uid = uidOf(useId());
  const L = faceLayout();
  const w = L.win;
  const shade = Math.min(w.h * 0.3, 7);
  return (
    <g>
      <defs>
        <clipPath id={`${uid}w`}>
          <path d={rectPath(w.x, w.y, w.w, w.h, FACE.WIN.r)} />
        </clipPath>
        <linearGradient id={`${uid}s`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(w.y)} x2="0" y2={f2(w.y + shade)}>
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0.55" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={rectPath(w.x, w.y, w.w, w.h, FACE.WIN.r)} fill={WIN_FILL} />
      <g clipPath={`url(#${uid}w)`}>
        {team.map((b, i) => {
          const dy = bustDropY(b.drop ?? 0);
          if (dy >= BUST_H + 0.99) return null;
          return <Bust key={b.key ?? i} x={L.busts[b.place]} base={L.bustBase + dy} tone={b.tone} hair={b.hair} />;
        })}
        {/* the top wall's shade falls into the recess, over the busts' heads */}
        <rect x={f2(w.x)} y={f2(w.y)} width={f2(w.w)} height={f2(shade)} fill={`url(#${uid}s)`} />
      </g>
      {/* the lit front lip (the cream's edge below the window, facing up into the light) */}
      <path d={`M${f2(w.x + FACE.WIN.r)} ${f2(w.y + w.h + EDGE.CREAM / k / 2)}H${f2(w.x + w.w - FACE.WIN.r)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(EDGE.CREAM / k)} />
    </g>
  );
};

/** A bar in a slot: centre x, total height h above the tile top, cream up to `cream`, amber above. */
export type BarSpec = { x: number; h: number; cream: number; lift?: number; key?: string; dim?: number };

/** The slot opening's width (world): the bar + a lip each side (SCREEN px). */
export const slotWidth = (k: number) => BAR_W + (2 * EDGE.SLOT_LIP) / k;
/** An open (empty) slot's pocket depth (SCREEN px). */
export const POCKET_PX = 7;

/** The hot top edge of an amber body (stoutShared's recipe: 2 px line + 12 px falloff, SCREEN px). */
const HotEdge: React.FC<{ x: number; y: number; w: number; h: number; k: number; on: number }> = ({ x, y, w, h, k, on }) => {
  const uid = uidOf(useId());
  const r = 4;
  const fall = Math.max(0.01, Math.min(EDGE.HOT_FALL / k, h));
  if (on <= 0.002) return null;
  return (
    <g opacity={on < 1 ? f2(on) : undefined}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={rectPath(x, y, w, fall, r, true, false)} fill={`url(#${uid})`} />
      <path d={`M${f2(x + r)} ${f2(y + EDGE.HOT / k / 2)}H${f2(x + w - r)}`} stroke={COLOR.amberHot} strokeWidth={f2(EDGE.HOT / k)} />
    </g>
  );
};

/** One bar's body: cream from the tile top up to `cream`, amber above (one bloom pass), its top edge
 *  (cream lit edge, or the hot edge once the amber is a few screen px tall: they cross over, no pop),
 *  the foot occlusion over the slot. `dim` 0..1 takes its amber to board by tone (bloom and hot edge
 *  fade with it): C's old growth slice going to context. Its shadow is BarShadow. */
export const SlotBar: React.FC<{ bar: BarSpec; k: number; band: [number, number] }> = ({ bar, k, band }) => {
  const uid = uidOf(useId());
  const h = bar.h;
  if (h * k <= 0.05) return null;
  const r = 4;
  const dim = clamp01(bar.dim ?? 0);
  const x0 = bar.x - BAR_W / 2;
  const top = TILE.TOP - h;
  const amberH = Math.max(0, h - bar.cream);
  const creamH = h - amberH;
  const amberOn = clamp01((amberH * k) / 6) * (1 - dim); // the edge crossover over the first 6 screen px of amber
  const ao = Math.min(h, EDGE.FOOT_AO / k);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(top)} x2="0" y2={f2(FLOOR)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(band[0])} x2="0" y2={f2(band[1])}>
          <stop offset="0" stopColor={mixHex(COLOR.amberTop, COLOR.board, dim)} />
          <stop offset="1" stopColor={mixHex(COLOR.amberFoot, COLOR.boardFoot, dim)} />
        </linearGradient>
        <linearGradient id={`${uid}o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
      </defs>
      {/* cream: rounded top while it is the top, square under the amber */}
      {amberH > 0 ? (
        <path d={rectPath(x0, TILE.TOP - creamH, BAR_W, creamH, 0, false, false)} fill={`url(#${uid}c)`} />
      ) : (
        <path d={rectPath(x0, top, BAR_W, h, r, true, false)} fill={`url(#${uid}c)`} />
      )}
      {amberH > 0 ? (
        <>
          {dim > 0.001 ? <path d={rectPath(x0, top, BAR_W, amberH, r, true, false)} fill={`url(#${uid}a)`} /> : null}
          {dim < 0.999 ? (
            <g style={{ filter: bloomFilter(k) }} opacity={dim > 0.001 ? f2(1 - dim) : undefined}>
              <path d={rectPath(x0, top, BAR_W, amberH, r, true, false)} fill={`url(#${uid}a)`} />
            </g>
          ) : null}
        </>
      ) : null}
      {/* the top edge: the cream's (or board's) lit edge fades as the hot edge comes up (amberOn) */}
      {amberOn < 1 ? (
        <path
          d={`M${f2(x0 + r)} ${f2(top + EDGE.CREAM / k / 2)}H${f2(x0 + BAR_W - r)}`}
          stroke={COLOR.edge}
          strokeOpacity={f2(lerp(ALPHA.edge, amberH > 0 ? ALPHA.edgeBoard : ALPHA.edge, dim) * (1 - amberOn))}
          strokeWidth={f2(EDGE.CREAM / k)}
        />
      ) : null}
      {amberH > 0 ? <HotEdge x={x0} y={top} w={BAR_W} h={amberH} k={k} on={amberOn} /> : null}
      <rect x={f2(x0)} y={f2(TILE.TOP - ao)} width={f2(BAR_W)} height={f2(ao)} fill={`url(#${uid}o)`} />
    </g>
  );
};

/** A bar's one shadow (its own silhouette; rest, or lifted by `bar.lift` while it rises). */
export const BarShadow: React.FC<{ bar: BarSpec }> = ({ bar }) =>
  bar.h <= 0.02 ? null : (
    <ElevationShadow silhouette={[{ d: rectPath(bar.x - BAR_W / 2, TILE.TOP - bar.h, BAR_W, bar.h + 4, 4, true, false) }]} elevation="rest" lift={bar.lift ?? 0} />
  );

/** A slot in the tile's top edge: an open dark pocket while empty, closing to the stout joint line as a
 *  bar fills it (over its first 6 screen px). `fill` = the bar's height in it (world px). */
export const Slot: React.FC<{ x: number; k: number; fill: number }> = ({ x, k, fill }) => {
  const w = slotWidth(k);
  const u = clamp01((fill * k) / 6);
  const hOpen = POCKET_PX / k;
  const hJoint = EDGE.SLOT / k;
  const h = lerp(hOpen, hJoint, u);
  const y0 = lerp(TILE.TOP, TILE.TOP - hJoint / 2, u);
  return (
    <rect
      x={f2(x - w / 2)}
      y={f2(y0)}
      width={f2(w)}
      height={f2(h)}
      rx={f2(lerp(Math.min(h / 2, 2 / k), 0, u))}
      fill={COLOR.inkDark}
      fillOpacity={f2(lerp(0.9, ALPHA.slot, u))}
    />
  );
};

/** The product tile: one cream card on its one shadow (+ contact), the face row (the team window with
 *  `team` in it, the R stamp, the name in ink), the lit top edge (broken at every slot), the slots. */
export const WealthTile: React.FC<{ k: number; slotFill: number[]; team: BustSpec[] }> = ({ k, slotFill, team }) => {
  const uid = uidOf(useId());
  const r = 4;
  const L = faceLayout();
  const sw = slotWidth(k);
  const y = TILE.TOP + EDGE.CREAM / k / 2;
  // the lit edge, in segments between the slot openings
  let d = `M${f2(TILE_X0 + r)} ${f2(y)}`;
  for (const x of SLOT_X) d += `H${f2(x - sw / 2)}M${f2(x + sw / 2)} ${f2(y)}`;
  d += `H${f2(TILE_X1 - r)}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(TILE.TOP)} x2="0" y2={f2(FLOOR)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <ElevationShadow
        silhouette={[{ d: rectPath(TILE_X0, TILE.TOP, TILE.W, TILE.H, r) }]}
        elevation="rest"
        contact={{ x: TILE.X, y: FLOOR, w: (TILE.W + 16) / 1.16 }}
      />
      <path d={rectPath(TILE_X0, TILE.TOP, TILE.W, TILE.H, r)} fill={`url(#${uid}c)`} />
      <FaceTeam team={team} k={k} />
      {/* the Revolut badge (ink rounded square, the cream R in it) and the product's name in ink Kräftig caps */}
      <path d={rectPath(L.badge.x, L.badge.y, L.badge.s, L.badge.s, FACE.BADGE_R)} fill={COLOR.inkDark} />
      <path
        d={REVOLUT_R_D}
        transform={`translate(${fx(L.r.x)} ${fx(L.r.y)}) scale(${fx(L.r.h / REVOLUT_R_BOX.h)})`}
        fill={COLOR.cream}
        fillRule="evenodd"
      />
      <text
        x={f2(L.text.x)}
        y={f2(L.text.y)}
        fontFamily={FONT_LABEL}
        fontWeight={500}
        fontSize={f2(FACE.FS)}
        letterSpacing={`${TRACK.label}em`}
        fill={COLOR.inkDark}
        style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
      >
        {FACE.TEXT.toUpperCase()}
      </text>
      <path d={d} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(EDGE.CREAM / k)} />
      {SLOT_X.map((x, i) => (
        <Slot key={i} x={x} k={k} fill={slotFill[i] ?? 0} />
      ))}
    </g>
  );
};

/** The whole board object at one moment: bar shadows, the tile (+ its face row with `team`, slots filled
 *  by `bars`), the bars. */
export const WealthBoard: React.FC<{ k: number; band: [number, number]; bars: BarSpec[]; team: BustSpec[] }> = ({ k, band, bars, team }) => {
  const slotFill = SLOT_X.map((x) => bars.filter((b) => Math.abs(b.x - x) < 1).reduce((a, b) => Math.max(a, b.h), 0));
  return (
    <g>
      {bars.map((b, i) => (
        <BarShadow key={b.key ?? i} bar={b} />
      ))}
      <WealthTile k={k} slotFill={slotFill} team={team} />
      {bars.map((b, i) => (
        <SlotBar key={b.key ?? i} bar={b} k={k} band={band} />
      ))}
    </g>
  );
};

/** B's bars at story time S (with their rise lifts), as WealthBoard takes them. At S >= 66 = B_END.bars. */
export const bBarSpecs = (S: number): BarSpec[] => {
  const h = bBars(S);
  return [
    { key: "last", x: SLOT_X[0], h: h.last, cream: BAR_CREAM.last, lift: riseLift(S, B_T.RISE1) },
    { key: "now", x: SLOT_X[1], h: h.now, cream: BAR_CREAM.now, lift: riseLift(S, B_T.RISE2) },
  ];
};

/**
 * GrowthLabel — a growth figure in Dreiviertelfett at a SCREEN size (`px`, default LABEL_PX: the same size
 * on screen at any k), centred on world x, baseline world y. Amber with the fixed bloom; `dim` 0..1 takes it
 * to the lo tone by tone (the bloom fades with it), same size. The stout entrance (`enter` 0..1 over 12 f:
 * slide up 24 px + fade + blur 6 -> 0) and its reverse (`exit`).
 */
export const GrowthLabel: React.FC<{ x: number; y: number; k: number; text: string; px?: number; enter?: number; exit?: number; dim?: number; anchor?: "start" | "middle" | "end" }> = ({
  x,
  y,
  k,
  text,
  px = LABEL_PX,
  enter = 1,
  exit = 0,
  dim = 0,
  anchor = "middle",
}) => {
  const a = easeOutCubic(enter);
  const e = easeOutCubic(exit);
  const opacity = a * (1 - e);
  if (opacity <= 0.002) return null;
  const lift = (1 - a) * 24 + e * 24;
  const blur = 6 * (1 - a) + 6 * e;
  const d = clamp01(dim);
  const fs = px / k;
  const comp = anchor === "middle" ? (TRACK.numeral * fs) / 2 : anchor === "end" ? TRACK.numeral * fs : 0;
  const t = (
    <text
      x={f2(x + comp)}
      y={f2(y + lift / k)}
      fontFamily={FONT_NUM}
      fontWeight={700}
      fontSize={f2(fs)}
      letterSpacing={`${TRACK.numeral}em`}
      textAnchor={anchor}
      fill={mixHex(COLOR.amberTop, COLOR.inkCreamLo, d)}
      style={{ fontFeatureSettings: '"lnum" 1' }}
    >
      {text}
    </text>
  );
  return (
    <g opacity={f2(opacity)} style={{ filter: blur > 0.05 ? `blur(${f2(blur / k)}px)` : undefined }}>
      {d < 0.999 ? (
        <g style={{ filter: bloomFilter(k) }} opacity={d > 0.001 ? f2(1 - d) : undefined}>
          {t}
        </g>
      ) : null}
      {d > 0.001 ? t : null}
    </g>
  );
};
/** "+60–80%" over this year's bar (B's label): GrowthLabel at bLabelY(k, dy). */
export const BLabel: React.FC<{ k: number; enter?: number; exit?: number; dim?: number; dy?: number }> = ({ k, enter = 1, exit = 0, dim = 0, dy = 0 }) => (
  <GrowthLabel x={SLOT_X[1]} y={bLabelY(k, dy)} k={k} text={B_LABEL.text} px={B_LABEL.px} enter={enter} exit={exit} dim={dim} />
);

// --- B's END state (S = 101), for C ----------------------------------------------------------------------
export const B_END = {
  S: B_LAST_S,
  cam: B_END_CAM,
  pool: B_POOL(B_LAST_S),
  bars: bBarSpecs(B_LAST_S),
  team: TEAM_OLD,
  label: { text: B_LABEL.text, px: B_LABEL.px, x: SLOT_X[1], y: bLabelY(B_END_CAM.k) },
} as const;

// --- small screen helpers ------------------------------------------------------------------------------------
export const SX = (c: Cam, wx: number) => 540 + (wx - c.x) * c.k;
export const SY = (c: Cam, wy: number) => 960 + (wy - c.y) * c.k;
/** The keep-in box (CRAFT.md / COMMON.md, 9:16): everything that matters inside it on every frame. */
export const KEEP_IN = { x0: 65, x1: 1015, y0: 290, y1: 1070 } as const;
/** The lowest a tile face may end (the caption band starts at 1080). */
export const FACE_MAX_Y = 1060;
/** A growth label's screen box (approx: Söhne advances; the top is the figures' height). */
export const growthLabelBox = (c: Cam, x: number, y: number, text: string, px: number = LABEL_PX, anchor: "start" | "middle" | "end" = "middle") => {
  const w = numeralWidth(text, px);
  const sx = SX(c, x);
  const x0 = anchor === "middle" ? sx - w / 2 : anchor === "end" ? sx - w : sx;
  return { x0, x1: x0 + w, y0: SY(c, y) - px * METRIC.fig, y1: SY(c, y) };
};
/** B's label's screen box. */
export const labelBox = (c: Cam, y: number = bLabelY(c.k)) => growthLabelBox(c, SLOT_X[1], y, B_LABEL.text, B_LABEL.px);

// --- load-time checks (the world's layout; C's suggestion fits) -------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`wealthWorld: ${m}`);
  };
  if (Math.abs(BAR_CREAM.now - BAR_H.last) > 1e-9) fail("this year's cream must end at last year's height");
  if (SLOT_X[0] - BAR_W / 2 < TILE_X0 + 24 || SLOT_X[2] + BAR_W / 2 > TILE_X1 - 24) fail("the slots run off the tile");
  if (Math.abs(SLOT_X[0] + SLOT_X[2] - 2 * TILE.X) > 1e-9) fail("the slots are not symmetric");
  const L = faceLayout();
  if (L.total > TILE.W - 40) fail("the face row runs off the tile");
  if (L.win.y < TILE.TOP + 5 || L.win.y + L.win.h > FLOOR - 5) fail("the window runs off the face");
  if (L.badge.s > FACE.WIN.h || L.badge.s < 2 * METRIC.cap * FACE.FS * 0.9) fail("the badge is out of proportion with the window / the caps");
  if (Math.abs(L.win.x - TILE_X0 - (TILE_X1 - L.text.x - L.text.w)) > 0.5) fail("the face row is off the tile's centre");
  if (L.bustBase - BUST_H < L.win.y + 4) fail("the busts' heads touch the window's top");
  if (L.busts[2] + FACE.BUST.shW / 2 > L.win.x + L.win.w - 2 || L.busts[0] - FACE.BUST.shW / 2 < L.win.x + 2) fail("the busts run out of the window");
  // B's end: the busts' heads >= 34 px on screen
  if (FACE.BUST.head * B_END_CAM.k < 34) fail(`the busts' heads are ${(FACE.BUST.head * B_END_CAM.k).toFixed(1)} px at B's end`);
  // C's suggested end: the tall bar + tile inside the keep-in box, the tile >= 55 % of the frame's width
  const c = C_TALL_CAM;
  if (SY(c, FLOOR) > FACE_MAX_Y) fail("C_TALL_CAM: the tile face ends in the caption band");
  if (SY(c, TILE.TOP - BAR_H.next) - LABEL_PX * METRIC.fig - SPACE.CLEAR < 300) fail(`C_TALL_CAM: no room for a label over the tall bar (bar top ${SY(c, TILE.TOP - BAR_H.next).toFixed(0)})`);
  if (TILE.W * c.k < 0.55 * 1080) fail("C_TALL_CAM: the tile is under 55 % of the frame's width");
  const ob = labelBox(c, bLabelY(c.k));
  if (SX(c, SLOT_X[2] - BAR_W / 2) - ob.x1 < 12) fail(`C_TALL_CAM: the old label runs into the tall bar (${(SX(c, SLOT_X[2] - BAR_W / 2) - ob.x1).toFixed(1)} px)`);
}
