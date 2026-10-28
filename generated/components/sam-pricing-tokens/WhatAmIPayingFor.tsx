// ---------------------------------------------------------------------------
// WhatAmIPayingFor (sam-pricing-tokens, cut 17). Cheeky Pint style (stout) (styles/cheeky-pint.md) with the clip's
// real-photo objects (pricingShared). Opaque 1080x1920, 23.976 fps, 130 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "Customers hated getting one total with nothing on it: they couldn't see what they were paying for."
//
// THE LINE (Sam Altman): "But the customer response on that is so negative. They're like, I need to know what I'm
// paying for, somehow."
// WORD -> FRAME (Whisper, may run 2-6 f early): the f4 · customer f10 · response f22 · on f29 · that f34 · is f37 ·
// so f41 · negative f49 · they're f67 · like f76 · I f78 · need f82 · to f89 · know f93 · what f96 · I'm f99 ·
// paying f103 · for f106 · somehow f110 · (next sentence on camera from f120).
// DURATION: the slot 17.184 -> 22.606 s (sequence frames 412 -> 542) = 5.422 s x 23.976 = 130 frames (f0..f129).
//
// THE MOTION: f0 is cut 11's last frame (a world match: the price tag standing in the OpenAI tile's slot, the tile
// toned 0.7, CUT11_END_CAM). The camera eases a little down and in (f0-42) while two customers lean in from the
// left and right frame edges (V2, the user's note: no tall bodies; each torso runs out through its own side edge),
// big and close, in profile, their faces flanking the tag: the cream one (left, the lit subject) and a board-toned
// one (right). On "negative" (f41-49) both
// sour as one change: a deep downturned mouth, brows angled down hard, heads tipped back 7 deg and the whole bust
// leaning back 3.5 deg together (this cut's FaceOverlay over CustomerBust). On "I need" (f80) the tile prints a long
// thermal receipt UP out of the slot IN FRONT of the tag (f80-103): its torn top first, blank "?" rows, the printed
// rule and TOTAL, and the amber $3.40 last, clearing the slot on "paying" (f103); the tag drops back into the slot
// behind the rising paper (f81-91), so only one $3.40 is ever on screen. On "know" (f93-106) the cream customer leans
// in and squints at the rows (one gesture). The camera follows the paper up and in (f78-118), then creeps on in
// through the hold to f129 with the paper's damped sway (set going by the print's stop) and a blink each.
// CAUSE: the tile is the till: the receipt comes out of its slot and the tag goes back in (slot joint: everything in
// the slot is clipped at the slot's mouth and drawn under the tile's face).
// AMBER = the number the customer is shown or charged (COMMON): the tag's price, then the receipt's total, the same
// sticker recipe (PriceSticker). Cream = the subject (the receipt paper, the lit customer); board = context.
//
// SOURCES: no figures ($3.40 is the clip's illustrative price, pricingShared PRICE). The tag and the tile:
// pricingShared PriceTag / OpenAISlotTile. The receipt: a real thermal till receipt, Wikimedia Commons
// "File:Tankquittung_HIT-Tankstelle_Rheinbach_mit_Abschnitt_Technische_Sicherheitseinrichtung,_2020.jpg" (public
// domain; images/cutout_sources/SOURCES.md item 2), baked by scripts/clips/sam-pricing-tokens/bake-receipt.py
// (receiptData.ts): its paper with every printed line removed, and its own printed dotted rule and word TOTAL kept as
// real thermal print. The "?" rows are drawn.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_LABEL, StoutStage, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack } from "../kits/cheeky-pint/museShared";
import {
  BUST,
  CROWD,
  CUT11_END_CAM,
  CUT11_WORLD,
  CustomerBust,
  OpenAISlotTile,
  PRICE,
  PhotoCutOut,
  PriceSticker,
  PriceTag,
  SHADOW_S,
  TAG,
  TAG_ART,
  TILE,
  UnionShadow,
  blinkAt,
  bustSil,
  priceTagSil,
  slotClip,
  swingAt,
  type BustSpec,
  type Cam,
  type ShadowPart,
  type SilItem,
} from "./pricingShared";
import { RECEIPT_PAPER, RECEIPT_RULE, RECEIPT_TOTAL } from "./receiptData";

export const FPS = 24000 / 1001;
export const DURATION = 130;
export const schema = z.object({ rows: z.enum(["q", "dash"]) });
export const defaultProps = schema.parse({ rows: "q" });

const D2R = Math.PI / 180;
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ---------------------------------------------------------------------------
// THE WORLD (world px = cut 11's: the tile centred at x 540, its floor at 1526, its top / slot mouth at 1126)
// ---------------------------------------------------------------------------
export const TILE_X = CUT11_WORLD.x;
export const TILE_FLOOR = CUT11_WORLD.floor;
export const SLOT_Y = TILE_FLOOR - TILE.size; // 1126: the tag's foot in cut 11, the receipt's exit
export const TILE_DIM = 0.7; // cut 11's end tone of the tile
export const TAG_H = TAG.h * TAG_ART.footV; // the standing tag's height above the slot
/** the receipt: width (inside the 344-px slot), the torn top's teeth, and how far it is out of the slot at rest */
export const RECEIPT = { w: 326, tooth: 11, teeth: 15 };
const ROW_N = 5;
const ROW_PITCH = 70;
/** the blank items' "?": >= ~60 px tall on screen at rest (its height ~0.72 em; k ~1.3) */
const Q_SIZE = 68;
/** the print, as distances below the paper's top edge (tips at 0) */
const P = (() => {
  const row0 = 92; // first row's baseline
  const lastRow = row0 + (ROW_N - 1) * ROW_PITCH;
  const rule = lastRow + 32;
  const wordH = 46; // the scan's TOTAL (its crop has ~6 px of margin each way: cap ~34 world, ~44 px at rest)
  const wordFloor = rule + 22 + wordH;
  const stickerTop = wordFloor + 16;
  const stickerH = 128;
  const stickerBot = stickerTop + stickerH;
  return { row0, rule, wordH, wordFloor, stickerTop, stickerH, stickerBot, out: stickerBot + 26 };
})();
/** how far the paper stands out of the slot when the print stops (the amber total just clear of the mouth) */
export const RECEIPT_OUT = P.out;
/** the total's sticker: the tag's PriceSticker recipe, sized to the paper */
const TOTAL_W = 0.92 * RECEIPT.w;

type Person = { x: number; y: number; r: number; spec: BustSpec; facing: -1 | 1; main?: boolean; dim: number; base: number; out: number; f0: number; back: number };
/**
 * V2 (the user's note on v1: "their bodies are unnaturally long"): the two customers LEAN IN from the left and right
 * frame edges, `base` deg off upright toward the receipt about a pivot PIVOT head radii down their body, so each
 * torso runs out through its own side edge about one head-height below the shoulder (no tall column down to the
 * frame's foot); the head is turned back up against the lean (Bust's tilt) so the face looks level at the paper.
 * (x, y) = the head centre at rest (before the gestures). They slide in along the frame from outside their own edge
 * (`out` world px, from `f0`): the face leads (the leaned body trails down and out behind it), and the heads stay at
 * their own height the whole way, above the caption bands on every frame.
 */
const BODY_LEN = 1000;
export const PEOPLE: Person[] = [
  { x: 734, y: 930, r: 82, spec: CROWD[2], facing: -1, dim: 0.35, base: 76, out: 420, f0: 0, back: 1.3 },
  { x: 340, y: 948, r: 94, spec: CROWD[3], facing: 1, dim: 0, main: true, base: 76, out: 400, f0: 3, back: 1.1 },
];
const WALK_F = 34;
/** Bust's bob (head units) that lowers each head onto its shoulders, over the collar: the neck stays hidden */
const NECK_SINK = -24;

// ---------------------------------------------------------------------------
// TIMING (frames from f0)
// ---------------------------------------------------------------------------
export const SOUR0 = 41; // "so negative": one change f41-49, landed on "negative"
export const SOUR_F = 8;
export const PRINT0 = 80; // the receipt's torn top shows above the slot, IN FRONT of the tag
export const PRINT1 = 103; // "paying": the total clears the slot, the print stops
export const SINK0 = 81; // the tag goes back into the slot behind the rising paper (10 f)
export const SINK1 = 91;
export const LEAN0 = 93; // "know": the cream customer leans in and squints at the "?" rows (one gesture, to f106)
export const LEAN_F = 13;
/** the hold's blinks (one each, apart) */
const HOLD_BLINK = [112, 119];

/** the tag's sink: a quick pull in (eases in), out of sight behind the paper */
export const sinkAt = (f: number) => {
  const u = clamp01((f - SINK0) / (SINK1 - SINK0));
  return lerp(smoothstep(u), u * u * u, 0.4);
};
/** the print: feeds fast and stops soft (a till), no overshoot */
const printEase = (u: number) => {
  const c = clamp01(u);
  return lerp(smoothstep(c), 1 - Math.pow(1 - c, 2.4), 0.6);
};
/** how far the paper's top (tips) stands above the slot mouth (world px) */
export const outAt = (f: number) => RECEIPT_OUT * printEase((f - PRINT0) / (PRINT1 - PRINT0));
/** the paper's sway about the slot mouth (deg): a damped bend set going by the print's stop, then alive */
export const swayAt = (f: number) => swingAt(f, { f0: PRINT1 - 2, amp: 0.9, period: 44, tau: 30, live: 0.22, livePeriod: 67, phase: 0 });

// ---------------------------------------------------------------------------
// THE PEOPLE — the rise in, the souring (one change), the lean in and squint to read
// ---------------------------------------------------------------------------
/** the lean-in: in from the side, already moving, a long settle, no overshoot */
export const walkAt = (i: number, f: number) => {
  const u = clamp01((f - PEOPLE[i].f0) / WALK_F);
  return lerp(smoothstep(u), 1 - Math.pow(1 - u, 2), 0.6);
};
export const sourAt = (i: number, f: number) => smoothstep((f - SOUR0 - [0, 1][i]) / SOUR_F);
const tri = (f: number, at: number) => Math.max(0, 1 - Math.abs(f - at) / 1.5);
export const poseAt = (i: number, f: number) => {
  const p = PEOPLE[i];
  const sour = sourAt(i, f);
  const lean = p.main ? smoothstep((f - LEAN0) / LEAN_F) : 0;
  const w = walkAt(i, f);
  const idle = 1.1 * Math.sin((f + i * 17) / 12.5);
  // they arrive leaning a little further in, easing back to their lean as they settle
  const walkLean = 3 * (1 - smoothstep(w));
  return {
    // CustomerBust's own sour stays 0: the stronger frown, brow and head droop are this cut's (FaceOverlay, tilt)
    sour: 0,
    frown: sour,
    squint: lean,
    // faces up at the paper. NOTE Bust's tilt sign: it rotates the head by -tilt about the neck, so a NEGATIVE tilt
    // lifts the face (measured on the render). On "negative" the heads tip back 7 deg; reading, the face dips in 4.
    // The body's lean is countered at the neck (0.9 of it) so the face stays near level.
    tilt: -0.9 * (p.base + walkLean) - (p.main ? 9 : 7) - 0.8 * Math.sin((f + i * 11) / 15) - 7 * sour + (p.main ? 4 : 0) * lean,
    // the head sits down ON the shoulder line (Bust's bob lowers it over the collar): no neck shows
    bob: NECK_SINK + idle + 2 * lean,
    smile: 0.3,
    // the squint narrows the eye (Bust's blink, part way), a blink still closes it
    blink: Math.max(blinkAt(i + 2, f), tri(f, HOLD_BLINK[i]), 0.5 * lean),
    dim: p.dim,
    /** the whole bust leans (deg about a pivot low on the body): toward the tag as they rise, back 3.5 deg from the paper on
     *  "negative" with the head, the cream customer then 5 deg in toward it to read */
    lean: p.facing * (p.base + walkLean - 3.5 * sour + (p.main ? 5 * lean : 0)),
  };
};
/** a bust's drawing place (CustomerBust's x, y: its head centre before the lean) on its slide in from the side; the
 *  lean then turns it about the pivot PIVOT r below that point (leanTf) */
export const placeAt = (i: number, f: number) => {
  const p = PEOPLE[i];
  const w = walkAt(i, f);
  const a = p.facing * p.base * D2R;
  // the pivot, fixed in the body: the rest head centre plus the leaned body axis down to the pivot
  const px = p.x - Math.sin(a) * PIVOT * p.r - p.facing * p.out * (1 - w);
  const py = p.y + Math.cos(a) * PIVOT * p.r;
  return { x: px, y: py - PIVOT * p.r };
};
const PIVOT = 4; // the lean pivot, head radii below the head centre (about the chest)
const leanTf = (x: number, y: number, r: number, deg: number) => `rotate(${f3(deg)} ${f3(x)} ${f3(y + PIVOT * r)})`;
/** a bust's head centre after its rise, tilt about the neck, bob and lean (for the checks) */
export const headAt = (i: number, f: number) => {
  const p = PEOPLE[i];
  const pose = poseAt(i, f);
  const at = placeAt(i, f);
  const t = -pose.tilt * D2R;
  const [nx, ny] = BUST.neck;
  const lx = nx + Math.cos(t) * -nx - Math.sin(t) * -ny;
  const ly = ny + Math.sin(t) * -nx + Math.cos(t) * -ny - pose.bob;
  const hx = at.x - p.facing * lx * (p.r / 60);
  const hy = at.y + ly * (p.r / 60);
  const a = pose.lean * D2R;
  const px = at.x;
  const py = at.y + PIVOT * p.r;
  return { x: px + Math.cos(a) * (hx - px) - Math.sin(a) * (hy - py), y: py + Math.sin(a) * (hx - px) + Math.cos(a) * (hy - py), r: p.r, lean: pose.lean, tilt: pose.tilt };
};

/**
 * The bodies at full tone. CustomerBust's torso fades to the ground over BODY_FADE head units below the shoulders
 * (a fixed gradient in the shared drawing, no prop); the director wants these two close bodies to run off the
 * frame at full tone. This lays the same torso outline (macintoshShared torsoD, the same numbers) over it from the
 * point where the shared gradient reaches its foot tone (0.3 of the fade = 99 units below the shoulder line), in that
 * foot tone, and redraws the arm creases there. Above that line the shared drawing shows unchanged.
 */
const FADE_TOP = BUST.shoulderY + 99;
const torsoD = (len: number) => {
  const y = BUST.shoulderY;
  const L = -BUST.frontX;
  const Rr = BUST.backX;
  const flare = 0.04 * (len - y - 54);
  return (
    `M${f3(L - flare)} ${len}C${f3(L - flare * 0.55)} ${f3(y + 54 + (len - y) * 0.35)} ${L} ${y + 120} ${L} ${y + 54}` +
    `C${L} ${y + 16} ${L + 22} ${y + 2} ${L + 50} ${y}` +
    `L-24 ${y}Q4 ${y + 26} 34 ${y}` +
    `L${Rr - 50} ${y}C${Rr - 20} ${y + 2} ${Rr} ${y + 16} ${Rr} ${y + 54}` +
    `C${Rr} ${y + 120} ${f3(Rr + flare * 0.55)} ${f3(y + 54 + (len - y) * 0.35)} ${f3(Rr + flare)} ${len}Z`
  );
};
const CREASES = [
  `M${-BUST.frontX + 30} ${BUST.shoulderY + 70}C${-BUST.frontX + 26} ${BUST.shoulderY + 110} ${-BUST.frontX + 24} ${BUST.shoulderY + 150} ${-BUST.frontX + 20} ${BUST.shoulderY + 200}`,
  `M${BUST.backX - 30} ${BUST.shoulderY + 70}C${BUST.backX - 26} ${BUST.shoulderY + 110} ${BUST.backX - 24} ${BUST.shoulderY + 150} ${BUST.backX - 20} ${BUST.shoulderY + 200}`,
];
const footOf = (c: string) => mixHex(c, COLOR.shadow, 0.14);
const DIM_TO = mixHex(COLOR.ground, COLOR.board, 0.22);
const BodyFill: React.FC<{ id: string; x: number; y: number; r: number; facing: -1 | 1; top: string; dim: number }> = ({ id, x, y, r, facing, top, dim }) => {
  const c = footOf(dim > 0.001 ? mixHex(top, DIM_TO, 0.85 * dim) : top);
  return (
    <g transform={`translate(${f3(x)} ${f3(y)}) scale(${f3((-facing * r) / 60)} ${f3(r / 60)})`}>
      <defs>
        <clipPath id={id}>
          <rect x={-400} y={FADE_TOP} width={800} height={BODY_LEN + 400} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <path d={torsoD(BODY_LEN)} fill={c} />
        {CREASES.map((d, j) => (
          <path key={j} d={d} stroke={footOf(c)} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.45} />
        ))}
      </g>
    </g>
  );
};

/**
 * The neck, tucked away. CustomerBust draws a fixed neck block (x -18..30, y 26..shoulderY+30 in its own head units)
 * that the head sits on; with these strong leans the head counter-tilts about the neck point and the block shows
 * under the jaw as a second jaw. This mask (in the bust's own frame) hides that block everywhere except where the
 * torso or the head (its circle, after the same bob and tilt as the bust) are drawn: no neck shows on any frame.
 */
const NECK_RECT = { x: -18, y: 26, w: 48, h: BUST.shoulderY + 4 };
const NeckMask: React.FC<{ id: string; x: number; y: number; r: number; facing: -1 | 1; tilt: number; bob: number }> = (q) => {
  const [nx, ny] = BUST.neck;
  return (
    <defs>
      <mask id={q.id} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={8000} height={8000}>
        <g transform={`translate(${f3(q.x)} ${f3(q.y)}) scale(${f3((-q.facing * q.r) / 60)} ${f3(q.r / 60)})`}>
          <rect x={-2000} y={-2000} width={4000} height={4000} fill="#fff" />
          <rect x={NECK_RECT.x - 1} y={NECK_RECT.y - 1} width={NECK_RECT.w + 2} height={NECK_RECT.h + 2} fill="#000" />
          <path d={torsoD(BODY_LEN)} fill="#fff" />
          <g transform={`translate(0 ${f3(-q.bob)}) rotate(${f3(-q.tilt)} ${nx} ${ny})`}>
            <circle cx={0} cy={0} r={60} fill="#fff" />
          </g>
        </g>
      </mask>
    </defs>
  );
};

/**
 * The face's change, drawn over CustomerBust (whose sour 0..1 tops out at a 6-unit mouth drop and a 0.6 brow: too
 * faint at phone size). In the bust's own head frame (head units, R 60, facing left, after its bob and tilt):
 * a skin patch (the bust's own skin gradient, clipped to the head) over Bust's mouth, then the mouth from Bust's
 * neutral curve to a wide, deep downturned arc with `frown`; a brow that is always there (a soft arch) and angles
 * down hard at its inner end with `frown` and tightens with `squint`.
 */
const LIGHT_TINT = "#FFF4E2";
const FaceOverlay: React.FC<{ id: string; x: number; y: number; r: number; facing: -1 | 1; spec: BustSpec; tilt: number; bob: number; dim: number; frown: number; squint: number; smile: number }> = (q) => {
  const tone = (c: string) => (q.dim > 0.001 ? mixHex(c, DIM_TO, 0.85 * q.dim) : c);
  const skin = tone(q.spec.skin);
  const ink = tone(COLOR.inkDark);
  const hair = tone(q.spec.hair);
  const [nx, ny] = BUST.neck;
  const u = clamp01(q.frown);
  const s = q.smile;
  const L = (a: number, b: number) => f3(lerp(a, b, u));
  // Bust's neutral mouth (sour 0) -> the deep arc (corners down, middle up; widened toward the cheek)
  const mouth = `M${L(-52.8, -52)} ${L(26.4 - 1, 31.5)}Q${L(-45, -42)} ${L(26.4 + 1 + 7 * s, 12.5)} ${L(-36, -28)} ${L(26.4 - 2 - 3 * s, 30.5)}`;
  const b = clamp01(q.squint);
  const g = q.spec.glasses ? -4 : 0;
  const brow = `M${f3(lerp(-18, -17, u))} ${f3(lerp(-21, -25, u) + g + 2 * b)}Q${f3(-30)} ${f3(lerp(-26, -23, u) + g + 2 * b)} ${f3(lerp(-42, -44, u))} ${f3(lerp(-21, -10, u) + g + 3 * b)}`;
  return (
    <g transform={`translate(${f3(q.x)} ${f3(q.y)}) scale(${f3((-q.facing * q.r) / 60)} ${f3(q.r / 60)})`}>
      <g transform={`translate(0 ${f3(-q.bob)}) rotate(${f3(-q.tilt)} ${nx} ${ny})`}>
        <defs>
          <linearGradient id={`${q.id}s`} gradientUnits="userSpaceOnUse" x1="0" y1="-60" x2="0" y2="60">
            <stop offset="0" stopColor={mixHex(skin, LIGHT_TINT, 0.12)} />
            <stop offset="1" stopColor={footOf(skin)} />
          </linearGradient>
          <clipPath id={`${q.id}c`}>
            <circle cx={0} cy={0} r={59.6} />
          </clipPath>
        </defs>
        {u > 0.001 ? (
          <g clipPath={`url(#${q.id}c)`}>
            <ellipse cx={-43} cy={27} rx={13} ry={7.6} fill={`url(#${q.id}s)`} />
          </g>
        ) : null}
        {u > 0.001 ? <path d={mouth} stroke={mixHex(ink, skin, 0.25)} strokeWidth={f3(lerp(3.4, 4.8, u))} strokeLinecap="round" fill="none" /> : null}
        <path d={brow} stroke={mixHex(ink, hair, 0.3)} strokeWidth={f3(lerp(3.8, 5, u))} strokeLinecap="round" fill="none" />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// CAMERA — cut 11's frame, eased a little down and in as the customers lean in (lands ~f42), a creep, then up and in with
// the paper (f78-118), and a slow creep in on the receipt through the hold (still moving at f129).
// ---------------------------------------------------------------------------
export const CAM0 = CUT11_END_CAM;
const CAM = makeClockCam(
  CAM0,
  [
    { f0: 0, f1: 42, dy: 1050 - CUT11_END_CAM.y, k: 1.18 },
    { f0: 34, f1: 84, dy: 2, k: 1.19 },
    { f0: 78, f1: 118, dy: -24, k: 1.28 },
    { f0: 106, f1: 190, dy: -14, k: 1.42 },
  ],
  DURATION,
  0,
);
export const camAt = (f: number): Cam => CAM.at(f);
const POOL = makePoolTrack(
  { x: TILE_X, y: 860 },
  [
    { f0: 0, f1: 42, x: TILE_X, y: 900 },
    { f0: 80, f1: 116, x: TILE_X, y: 820 },
  ],
  DURATION,
  0,
);

// ---------------------------------------------------------------------------
// THE RECEIPT (world: x about the slot's centre line, y down; the paper's top edge at SLOT_Y - out)
// ---------------------------------------------------------------------------
const zigTop = (x0: number, x1: number, y: number, tooth: number, n: number) => {
  const w = (x1 - x0) / n;
  let d = "";
  for (let i = 0; i < n; i++) d += `L${f3(x0 + (i + 0.5) * w)} ${f3(y + tooth)}L${f3(x0 + (i + 1) * w)} ${f3(y)}`;
  return d;
};
const PAPER_LEN = RECEIPT_OUT + 120; // what the paper runs down into the tile (hidden under the face)
/** the paper's outline: the torn top (tips at `top`), straight sides down into the slot */
const receiptD = (top: number) => {
  const x0 = TILE_X - RECEIPT.w / 2;
  const x1 = TILE_X + RECEIPT.w / 2;
  return `M${f3(x0)} ${f3(top)}${zigTop(x0, x1, top, RECEIPT.tooth, RECEIPT.teeth)}L${f3(x1)} ${f3(top + PAPER_LEN)}L${f3(x0)} ${f3(top + PAPER_LEN)}Z`;
};
const INK = mixHex(COLOR.inkDark, COLOR.cream, 0.12);
const ReceiptPrint: React.FC<{ top: number; k: number; rows: "q" | "dash" }> = ({ top, k, rows }) => {
  const x0 = TILE_X - RECEIPT.w / 2 + 24;
  const x1 = TILE_X + RECEIPT.w / 2 - 24;
  const ruleW = x1 - x0;
  const items = Array.from({ length: ROW_N }, (_, j) => top + P.row0 + j * ROW_PITCH);
  return (
    <g>
      {items.map((y, j) =>
        rows === "q" ? (
          <g key={j} fill={INK} fontFamily={FONT_LABEL} fontWeight={500} fontSize={Q_SIZE}>
            <text x={f3(x0)} y={f3(y)}>
              ?
            </text>
            <path d={`M${f3(x0 + 56)} ${f3(y - 8)}H${f3(x1 - 56)}`} stroke={INK} strokeWidth={3.5} strokeDasharray="3.5 9" strokeLinecap="round" opacity={0.5} />
            <text x={f3(x1)} y={f3(y)} textAnchor="end">
              ?
            </text>
          </g>
        ) : (
          <path key={j} d={`M${f3(x0)} ${f3(y - 12)}h${120 - (j % 3) * 22}M${f3(x1 - 64)} ${f3(y - 12)}H${f3(x1)}`} stroke={INK} strokeWidth={6} strokeDasharray="14 10" opacity={0.7} />
        ),
      )}
      <PhotoCutOut src={RECEIPT_RULE.src} x={(x0 + x1) / 2} y={top + P.rule} h={ruleW / RECEIPT_RULE.aspect} aspect={RECEIPT_RULE.aspect} k={k} shadow={false} />
      <PhotoCutOut src={RECEIPT_TOTAL.src} x={x0 + (P.wordH * RECEIPT_TOTAL.aspect) / 2} floor={top + P.wordFloor} h={P.wordH} aspect={RECEIPT_TOTAL.aspect} k={k} shadow={false} />
      <PriceSticker box={{ x: TILE_X - TOTAL_W / 2, y: top + P.stickerTop, w: TOTAL_W, h: P.stickerH, r: 0.07 * P.stickerH }} k={k} text={PRICE} />
    </g>
  );
};
/** the receipt: the real blank paper (the scan, print removed, in the clip's grade), clipped to its torn outline */
const Receipt: React.FC<{ top: number; k: number; rows: "q" | "dash" }> = ({ top, k, rows }) => {
  const d = receiptD(top);
  return (
    <g>
      <defs>
        <clipPath id="b17ro">
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath="url(#b17ro)">
        <PhotoCutOut src={RECEIPT_PAPER.src} x={TILE_X} y={top + (RECEIPT.w + 2) / RECEIPT_PAPER.aspect / 2} h={(RECEIPT.w + 2) / RECEIPT_PAPER.aspect} aspect={RECEIPT_PAPER.aspect} k={k} shadow={false} />
      </g>
      <ReceiptPrint top={top} k={k} rows={rows} />
    </g>
  );
};
const swayTf = (deg: number) => `rotate(${f3(deg)} ${f3(TILE_X)} ${f3(SLOT_Y)})`;

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
const WhatAmIPayingFor: React.FC<z.infer<typeof schema>> = ({ rows }) => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const rest = camAt(0);
  const k = cam.k;
  const out = outAt(S);
  const top = SLOT_Y - out;
  const sway = swayAt(S);
  const sink = sinkAt(S);
  const clip = slotClip(TILE_X, TILE_FLOOR);
  const tagIn = sink < 0.999;
  const tagProps = { x: TILE_X, y: SLOT_Y + sink * (TAG.h * TAG_ART.footV + 8), anchor: "foot" as const, k, clip };
  const paperIn = out > 0.5;
  const sil: ShadowPart[] = [
    ...(tagIn ? priceTagSil(tagProps) : []),
    ...(paperIn ? [{ d: receiptD(top), tf: swayTf(sway), clip } as SilItem] : []),
  ];
  const poses = PEOPLE.map((_, i) => poseAt(i, S));
  const places = PEOPLE.map((_, i) => placeAt(i, S));
  const crowdSil: SilItem[] = PEOPLE.flatMap((p, i) =>
    bustSil(places[i].x, places[i].y, p.r, p.facing, BODY_LEN).map((q) => ({ ...q, tf: `${leanTf(places[i].x, places[i].y, p.r, poses[i].lean)} ${q.tf ?? ""}` })),
  );
  const pool = POOL(S);
  return (
    <StoutStage S={S} cam={cam} rest={rest} pool={{ x: pool.x, y: pool.y, strength: 1.3 }}>
      {/* the customers' ONE shadow, on the board (under the till, so it never dirties the paper) */}
      <UnionShadow sil={crowdSil} s={SHADOW_S} />
      {/* the till: the tile, and what stands in its slot (ONE shadow; the pieces under the tile's face) */}
      <OpenAISlotTile x={TILE_X} floor={TILE_FLOOR} k={k} dim={TILE_DIM} extraSil={sil} occupant={tagIn ? TAG.w : paperIn ? RECEIPT.w : 0}>
        {tagIn ? <PriceTag {...tagProps} shadow={false} /> : null}
        {paperIn ? (
          <g>
            <defs>
              <clipPath id="b17slot">
                <rect x={clip.x} y={clip.y} width={clip.w} height={clip.h} />
              </clipPath>
            </defs>
            <g clipPath="url(#b17slot)">
              <g transform={swayTf(sway)}>
                <Receipt top={top} k={k} rows={rows} />
              </g>
            </g>
          </g>
        ) : null}
      </OpenAISlotTile>
      {/* the customers, nearer than the tile (their ONE shadow is drawn under the till: on the board only) */}
      {PEOPLE.map((p, i) => (
        <g key={i} transform={leanTf(places[i].x, places[i].y, p.r, poses[i].lean)}>
          <NeckMask id={`b17nm${i}`} x={places[i].x} y={places[i].y} r={p.r} facing={p.facing} tilt={poses[i].tilt} bob={poses[i].bob} />
          <g mask={`url(#b17nm${i})`}>
            <CustomerBust x={places[i].x} y={places[i].y} r={p.r} spec={p.spec} facing={p.facing} pose={poses[i]} bodyLen={BODY_LEN} />
          </g>
          <BodyFill id={`b17bf${i}`} x={places[i].x} y={places[i].y} r={p.r} facing={p.facing} top={p.spec.top} dim={p.dim} />
          <FaceOverlay id={`b17fo${i}`} x={places[i].x} y={places[i].y} r={p.r} facing={p.facing} spec={p.spec} tilt={poses[i].tilt} bob={poses[i].bob} dim={p.dim} frown={poses[i].frown} squint={poses[i].squint} smile={poses[i].smile} />
        </g>
      ))}
    </StoutStage>
  );
};

export default WhatAmIPayingFor;
