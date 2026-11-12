// ---------------------------------------------------------------------------
// BottleneckedWeights (rsi-derpy-interns, cut 50). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 184 frames.
//
// CHECK LINE: "at the end of a session the AI's notes would have to go into its own weights to be kept, but the only
// way in is a narrow, dashed (not-yet-invented) bottleneck, so they pile up and fall away."
//
// THE LINE: "Previously, I thought that we were bottlenecked by some crazy breakthroughs that would allow models to
// update their own weights at the end of every session."
// WORD -> FRAME: Previously -2 · I 7 · thought 14 · that 19 · we 23 · were 27 · bottlenecked 34 · by 52 · some 56 ·
//   crazy 65 · breakthroughs 76 · that 94 · would 96 · allow 99 · models 104 · to 116 · update 124 · their 133 ·
//   own 138 · weights 143 · at 150 · the 161 · end 164 · of 169 · every 170 · session 174 (word_tables.md).
// DURATION: the slot 50.550 -> 58.225 s = 7.675 s x 23.976 = 184 frames (f0..f183).
//
// THE MOTION: cut 6's world, one session seen close. The orange intern stands in a white session door (DAY 1 on its
// sign) holding three orange note cards; beside its head floats its own BRAIN (its weights), a white drawn brain tied
// to the head by two thought dots (rev Nov 12: the user found the earlier WEIGHTS network panel under the floor
// confusing and picked "its own head"). On "bottlenecked" a white funnel draws head-led from in front of the cards
// (its mouth three cards tall); where it gets narrower than a card its walls turn DASHED (the breakthrough that would
// open it does not exist yet) and the dashed neck runs on, bends UP and hooks back left into the brain by
// "breakthroughs" (f74): the notes' only way back into its own head. Its dashes march. On "that would allow models to update
// their own weights" the cards lift off the stack one after another and slide into the funnel's mouth: the first
// jams where the dashes begin, the next two pile up behind it. Nothing gets through: the brain stays white and
// still. The camera pushes in on the jam. On "at the end of every session" the door swings shut behind the intern,
// its arms drop, and the jammed cards drain to ACCENT_DEEP, slide back out of the mouth, tumble and fall behind the
// floor (cut 6's drop) by f173. Resolved, alive f174-183: the intern empty-handed, the door shut, the dashed neck marching,
// the brain untouched.
// CAUSE -> EFFECT: card A's right corners touch the solid walls' ends (where the dashes begin) on f110 and it stops
//   there; B stops against the pile on f123, C on f136, and on each contact the card in front jolts. The door's leaf
//   swings f144-155 and meets the frame on f155; the arms drop from f155; the jam is let go on f155.6-156.2, springs
//   back, slides down the lower wall, pivots on the lip and falls behind the floor (all three gone by f173).
// FALL: the jam is held in by the AI's press while the session lasts; let go, it obeys cut 6's gravity (FALL_G) and
//   drain (FALL_DRAIN), on a wall that slopes down to the mouth, so the notes come back OUT and drop, never down the neck.
// Orange = the AI and its notes; white = the door, the calendar floor, the funnel, the brain, the sign.
//
// SOURCES: none (no figures).
// THE WORLD is `sessionWorld.tsx` (cut 6's, imported read-only; see notes/SESSION_READY.md).
// ---------------------------------------------------------------------------
import { DERPY_SHIFT_Y } from "./screenShift";
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_STIFF,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  hash,
  iconShadow,
  smoothstep,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK, INK_HI, MARCH_PX_PER_F, worldPx } from "../kits/dwarkesh/alignShared";
import {
  CARD_H,
  CARD_W,
  CalendarRule,
  CarrierFigure,
  type CardPlace,
  DOOR_H,
  DOOR_W,
  DoorSignText,
  FALL_DRAIN,
  FALL_G,
  NoteCard,
  SESSION_K,
  SESSION_RULE_Y,
  SESSION_SW,
  SessionDoor,
  type StackCard,
  carrierPose,
  carryArms,
  stackLayout,
} from "./sessionWorld";

export const FPS = 24000 / 1001;
export const DURATION = 184;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const LAST = DURATION - 1;
const RULE_Y = SESSION_RULE_Y;
const SW = SESSION_SW;
const DASH_ON = worldPx(24, SESSION_K);
const DASH_OFF = worldPx(16, SESSION_K);
const MARCH = worldPx(MARCH_PX_PER_F, SESSION_K);

// --- the set (world px) ------------------------------------------------------------
type Pt = { x: number; y: number };
const HX = 300; // the intern's hip
const DX = HX - 25; // the session door's centre (the intern stands in it, a little right of centre)

// the funnel lies on its side in front of the cards: mouth at X_M (half-height H_M), straight walls narrowing to the
// right. Where the gap gets smaller than a card (X_S) the walls turn dashed; they narrow on to the neck (X_N, half
// H_N), run right, bend up, rise, and bend left into the brain's right side.
const AXIS_Y = 722;
const X_M = HX + 230;
const H_M = 130;
const H_N = 20;
const H_S = CARD_H / 2 + SW / 2; // a card's corners touch the walls' inside edges here
const X_S = X_M + 180;
const SLOPE = (H_M - H_S) / (X_S - X_M);
const X_N = X_S + (H_S - H_N) / SLOPE;
const halfH = (x: number) => H_M - SLOPE * (x - X_M);
const TUBE_RUN = 30; // the neck runs this far right before it bends
const BEND_R = 60; // the neck's centreline bend radius
const X_E = X_N + TUBE_RUN + BEND_R; // the vertical neck's centre x

// the brain (the AI's own weights): a drawn, iconic side-view brain (rev Nov 12: the first, lumpy outline read as
// "a bit sloppy"; the user wants it cleaner, NOT more realistic): a smooth bean with three gentle lobes on top, the
// front to the right (the neck enters there), a few deliberate folds, a small cerebellum and stem at the back-bottom,
// a faint fill so it reads as one object. Up and right of the intern's head (310, 532), outside the door's right post
// (x 385), above the funnel's mouth (top y 592). Local coords (centre 0,0), offset to (BR_CX, BR_CY).
const BR_CX = 602;
const BR_CY = 408;
const ENTRY_Y = BR_CY + 16; // the neck enters the brain's front here
const Y2 = ENTRY_Y + BEND_R; // the second bend's centre y
type Seg = [number, number, number, number, number, number];
const BRAIN_START: [number, number] = [96, 44];
const BRAIN_SEGS: Seg[] = [
  [120, 30, 126, -12, 108, -38],
  [96, -62, 70, -76, 44, -74],
  [30, -84, 0, -88, -18, -80],
  [-38, -86, -74, -80, -94, -60],
  [-122, -36, -122, 14, -100, 30],
  [-84, 42, -58, 40, -40, 36],
  [-20, 34, 0, 40, 18, 50],
  [40, 62, 80, 62, 96, 44],
];
const BRAIN_D = `M${BRAIN_START.join(" ")} ${BRAIN_SEGS.map((c) => `C${c.join(" ")}`).join(" ")} Z`;
const BRAIN_FOLDS = [
  "M100 18 C72 6 38 8 10 26", // the side fissure over the temporal lobe
  "M8 -84 C-2 -68 14 -56 6 -40 C0 -28 -8 -22 -4 -12",
  "M72 -66 C60 -54 74 -42 66 -30 C62 -24 60 -20 62 -14",
  "M-52 -80 C-60 -64 -44 -54 -52 -40 C-56 -32 -60 -28 -58 -20",
  "M-106 -12 C-88 -18 -80 2 -92 20",
  "M74 50 C58 38 40 38 28 44",
];
const BRAIN_BACK = "M-30 40 C-26 64 -46 80 -68 78 C-92 76 -106 58 -98 34"; // the cerebellum
const BRAIN_BACK_FOLDS = ["M-50 50 C-64 57 -78 57 -90 50", "M-48 63 C-58 68 -70 68 -80 63"];
const BRAIN_STEM = "M-20 44 C-18 64 -22 80 -32 98 M2 48 C2 66 -4 84 -12 100";
/** the brain outline's x at its front (right side) at world height y */
const brainRightX = (y: number) => {
  let best = { x: BR_CX, d: 1e9 };
  let p0 = BRAIN_START;
  for (const c of BRAIN_SEGS) {
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const u = 1 - t;
      const x = u * u * u * p0[0] + 3 * u * u * t * c[0] + 3 * u * t * t * c[2] + t * t * t * c[4];
      const yy = u * u * u * p0[1] + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * c[5];
      const d = Math.abs(BR_CY + yy - y);
      if (x > 60 && d < best.d) best = { x: BR_CX + x, d };
    }
    p0 = [c[4], c[5]];
  }
  return best.x;
};
// the thought dots, from the head's upper right to the brain's lower left
const DOTS = [
  { x: 414, y: 494, r: 8 },
  { x: 458, y: 470, r: 12.5 },
];

const RIM_RX = 20; // the mouth's rim, an upright ellipse (the funnel is a cone seen a little from the open end)

// --- the timeline ------------------------------------------------------------------
const WALL_F0 = 34; // "bottlenecked": the solid walls draw from the mouth ...
const WALL_F1 = 52; // ... to where the dashes begin
const NECK_F1 = 74; // the dashed neck lands on the brain ("breakthroughs" 76)
const LIFT_F = [95, 108, 121]; // the cards lift off the stack (top / back card first)
const FLIGHT = 15;
const CONTACT_F = LIFT_F.map((f) => f + FLIGHT); // 110, 123, 136 (settled before "weights" 143)
const DOOR_F0 = 144; // just before "at" 150: the leaf swings in from the hinge ...
const DOOR_SHUT = 155; // ... and meets the frame (before "the" 161 / "end" 164)
const ARMS_F1 = DOOR_SHUT + 10;
const RELEASE_F = [DOOR_SHUT + 1.2, DOOR_SHUT + 0.9, DOOR_SHUT + 0.6]; // A, B, C: the nearest the mouth goes first

// --- the intern and its stack ----------------------------------------------------------
const STACK_TIMES = [-60, -50, -40]; // all three cards in from f0
const carryAt = (f: number) => 1 - smoothstep((f - DOOR_SHUT) / (ARMS_F1 - DOOR_SHUT));
const internAt = (f: number) => {
  const pose = carrierPose("ai", HX, undefined, 0, f + 31);
  const carry = carryAt(f);
  const { anchor } = carryArms(pose, 0, carry);
  return { pose, carry, anchor };
};
/** where each card sits in the hands at frame f */
const handPlaces = (f: number) => stackLayout({ anchor: internAt(f).anchor, times: STACK_TIMES, frame: f });

// the queue: A wedged with its right edge at X_S, B and C stacked behind it, each PITCH further out
const PITCH = 42;
const QUEUE: CardPlace[] = [
  { cx: X_S - CARD_W / 2, by: AXIS_Y + CARD_H / 2, rot: 0 },
  { cx: X_S - CARD_W / 2 - PITCH, by: AXIS_Y + CARD_H / 2 - 4, rot: -0.045 },
  { cx: X_S - CARD_W / 2 - 2 * PITCH, by: AXIS_Y + CARD_H / 2 + 5, rot: 0.05 },
];
if (QUEUE[2].cx - CARD_W / 2 < X_M + 2) throw new Error("BottleneckedWeights: card C sticks out of the mouth");

const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};
/** card j's flight: a cubic from its place in the hands (at its lift frame) up and forward, then level into the
 *  mouth and along the axis to its queue place; arc-length parametrised. */
const FLIGHTS = [0, 1, 2].map((j) => {
  const s = handPlaces(LIFT_F[j]).find((c) => c.j === j)!;
  const q = QUEUE[j];
  const p0 = { x: s.cx, y: s.by };
  const p1 = { x: s.cx + 30, y: s.by - 95 };
  const p2 = { x: X_M - 55, y: q.by };
  const p3 = { x: q.cx, y: q.by };
  const N = 240;
  const pts: Pt[] = [];
  const len: number[] = [0];
  for (let i = 0; i <= N; i++) {
    pts.push(bez(p0, p1, p2, p3, i / N));
    if (i) len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const total = len[N];
  const at = (d: number): Pt => {
    const dd = Math.max(0, Math.min(total, d));
    let i = 1;
    while (i < N && len[i] < dd) i++;
    const u = (dd - len[i - 1]) / Math.max(1e-9, len[i] - len[i - 1]);
    return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u };
  };
  return { s, q, total, at };
});
/** distance along the flight 0..1 at time t 0..1: speeds up over the first half, then cruises into the contact */
const ACC = 0.5;
const flightU = (t: number) => {
  const c = clamp01(t);
  return c < ACC ? (c * c) / (2 * ACC * (1 - ACC / 2)) : (c - ACC / 2) / (1 - ACC / 2);
};
/** a jolt on contact: 0 -> peak -> 0 over n frames */
const jolt = (f: number, f0: number, n = 7) => {
  const s = (f - f0) / n;
  return s <= 0 || s >= 1 ? 0 : Math.sin(Math.PI * s) * (1 - s);
};

/** a held / flying / queued card at frame f (before its release) */
const cardAt = (j: number, f: number): CardPlace => {
  if (f < LIFT_F[j]) return handPlaces(f).find((c) => c.j === j)!;
  const fl = FLIGHTS[j];
  const t = (f - LIFT_F[j]) / FLIGHT;
  if (t < 1) {
    const p = fl.at(fl.total * flightU(t));
    const rot = fl.s.rot + (fl.q.rot - fl.s.rot) * smoothstep(t) - 0.09 * Math.sin(Math.PI * clamp01(t * 1.15));
    return { cx: p.x, by: p.y, rot };
  }
  // in the queue: a small recoil on its own contact, and a jolt when the next card hits it
  const q = fl.q;
  const rec = -4 * jolt(f, CONTACT_F[j], 6);
  const hit = j + 1 < 3 ? jolt(f, CONTACT_F[j + 1], 7) : 0;
  return { cx: q.cx + rec + 1.5 * hit, by: q.by - 1.5 * hit, rot: q.rot + 0.03 * hit + 0.02 * jolt(f, CONTACT_F[j], 6) };
};

// --- the release: drop onto the lower wall, slide back out of the mouth, tip over the lip, tumble and fall ---
const ALPHA = Math.atan(SLOPE);
const lowerWallY = (x: number) => AXIS_Y + halfH(x) - SW / 2; // the wall stroke's inside edge
const SPRING_VX = [-21, -17.5, -15]; // the press that held the jam in lets go: it springs back out of the mouth
const AIR_DRAG = 0.55; // per frame, once over the lip (they drop near the mouth, not onto the intern)
const LIP_TIP = 4; // the card tips over the lip as its centre passes it ...
const TIP_VR = -0.32; // ... pivoting on the lip (rad / frame), easing into cut 6's slower tumble
type Fall = { place: CardPlace; lit: number; gone: boolean };
const FALLS: Fall[][] = [0, 1, 2].map((j) => {
  const R = RELEASE_F[j];
  const q = cardAt(j, Math.floor(R));
  let x = q.cx;
  let y = q.by;
  let vx = SPRING_VX[j];
  let vy = 0;
  let rot = q.rot;
  let vr = 0;
  let free = false;
  const spin = -(0.035 + 0.03 * hash(j + 3, 41)); // rad / frame once over the lip (cut 6 tumbles backwards)
  const out: Fall[] = [];
  const dt = 0.05;
  let t = R;
  for (let f = 0; f <= LAST; f++) {
    while (t < f - 1e-9) {
      if (!free) {
        vy += FALL_G * dt;
        x += vx * dt;
        y += vy * dt;
        // neither bottom corner may go through the lower wall (a level card first meets it with its right corner)
        const c = (CARD_W / 2) * Math.cos(rot);
        const sn = (CARD_W / 2) * Math.sin(rot);
        const yMax = Math.min(lowerWallY(x + c) - sn, lowerWallY(x - c) + sn);
        if (y >= yMax) {
          // on the wall: keep only the speed along it
          y = yMax;
          const dx = -Math.cos(ALPHA);
          const dy = Math.sin(ALPHA);
          const vd = Math.max(0, vx * dx + vy * dy);
          vx = vd * dx;
          vy = vd * dy;
          rot += (-ALPHA - rot) * (1 - Math.pow(0.6, dt));
        }
        if (x < X_M - LIP_TIP) {
          free = true;
          vr = TIP_VR;
        }
      } else {
        vy += FALL_G * dt;
        vx *= Math.pow(1 - AIR_DRAG, dt);
        x += vx * dt;
        y += vy * dt;
        vr += (spin - vr) * Math.min(1, dt * 0.25);
        rot += vr * dt;
        // pivoting on the lip: the right bottom corner stays on the wall while it is still over it
        const c = (CARD_W / 2) * Math.cos(rot);
        const sn = (CARD_W / 2) * Math.sin(rot);
        if (x + c > X_M && y > lowerWallY(x + c) - sn) {
          y = lowerWallY(x + c) - sn;
        }
      }
      t += dt;
    }
    const lit = 1 - smoothstep((f - R) / FALL_DRAIN);
    out.push({ place: { cx: x, by: y, rot }, lit, gone: y - CARD_H * 1.3 > RULE_Y });
  }
  return out;
});
const released = (j: number, f: number) => f >= RELEASE_F[j];
/** frames a lifting card stays in the stack's layer */
const Z_SWITCH = 6;

// --- the funnel geometry ---------------------------------------------------------------------
/** points along a wall from the mouth: solid part [mouth -> X_S], dashed part [X_S -> neck -> up -> left -> brain] */
const wallPaths = (side: -1 | 1) => {
  // side -1 = upper wall (outer on the bend), +1 = lower wall (inner on the bend)
  const solid: Pt[] = [
    { x: X_M, y: AXIS_Y + side * H_M },
    { x: X_S, y: AXIS_Y + side * H_S },
  ];
  const dashed: Pt[] = [];
  dashed.push({ x: X_S, y: AXIS_Y + side * H_S });
  dashed.push({ x: X_N, y: AXIS_Y + side * H_N });
  dashed.push({ x: X_N + TUBE_RUN, y: AXIS_Y + side * H_N });
  // first bend, up: upper wall (-1) inner, lower wall (+1) outer
  const r = BEND_R + side * H_N;
  const cxB = X_N + TUBE_RUN;
  const cyB = AXIS_Y - BEND_R;
  const NB = 24;
  for (let i = 1; i <= NB; i++) {
    const a = Math.PI / 2 - (Math.PI / 2) * (i / NB);
    dashed.push({ x: cxB + r * Math.cos(a), y: cyB + r * Math.sin(a) });
  }
  // up the vertical neck, then the second bend, left: the upper wall stays inner (left), the lower wall outer (right)
  const c2x = X_E - BEND_R;
  dashed.push({ x: c2x + r, y: Y2 });
  for (let i = 1; i <= NB; i++) {
    const a = -(Math.PI / 2) * (i / NB);
    dashed.push({ x: c2x + r * Math.cos(a), y: Y2 + r * Math.sin(a) });
  }
  const wy = Y2 - r; // upper wall -> the pipe's lower side, lower wall -> its upper side
  dashed.push({ x: brainRightX(wy) + 2, y: wy });
  return { solid, dashed };
};
const polyLen = (pts: Pt[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);
/** the first `d` world px of a polyline */
const polyHead = (pts: Pt[], d: number): Pt[] => {
  const out: Pt[] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (acc + seg >= d) {
      const u = (d - acc) / Math.max(1e-9, seg);
      out.push({ x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * u, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * u });
      return out;
    }
    acc += seg;
    out.push(pts[i]);
  }
  return out;
};
const toD = (pts: Pt[]) => `M${pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")}`;
const WALLS = ([-1, 1] as const).map((side) => {
  const w = wallPaths(side);
  return { ...w, solidLen: polyLen(w.solid), dashedLen: polyLen(w.dashed) };
});

/** half the mouth's rim: side -1 = the near (left) half, +1 = the far half; drawn from the top down as `t` 0..1 */
const rimArc = (side: -1 | 1, t: number) => {
  const N = 32;
  const pts: Pt[] = [];
  for (let i = 0; i <= N * clamp01(t); i++) {
    const a = -Math.PI / 2 + Math.PI * (i / N);
    pts.push({ x: X_M + side * RIM_RX * Math.cos(a), y: AXIS_Y + H_M * Math.sin(a) });
  }
  return pts.length < 2 ? "" : toD(pts);
};

// --- the door's leaf ---------------------------------------------------------------------------
const LEAF_GAP = 16;
const LEAF_FILL = 0.16; // a shut door reads as a panel, a shade lighter than the grid
const LEAF_X0 = DX - DOOR_W / 2 + LEAF_GAP; // the hinge
const LEAF_W = DOOR_W - 2 * LEAF_GAP;
const LEAF_TOP = RULE_Y - DOOR_H + LEAF_GAP;
const LEAF_BOT = RULE_Y - SW / 2 - 3;
/** the leaf's opening angle (0 shut, PI/2 edge-on): swings in from the hinge, speeding up, a small bounce on the stop */
const leafAngle = (f: number) => {
  if (f <= DOOR_F0) return Math.PI / 2;
  if (f < DOOR_SHUT) {
    const u = (f - DOOR_F0) / (DOOR_SHUT - DOOR_F0);
    return (Math.PI / 2) * (1 - u * u * (1.6 - 0.6 * u));
  }
  return 0.06 * jolt(f, DOOR_SHUT, 6);
};

// --- the camera ------------------------------------------------------------------------------
// One key track (k, cx, the rule's screen y `ry`) eased through camEase, then the kit damper (CAM_STIFF / CAM_DAMP).
// Open a little close on the intern and its brain, ease back to the whole set while the funnel draws, push in on the
// jam (f94-150), ease back a little at the door. The floor stays above the first caption band after the 190 px shift.
const CAM_KEYS = [
  { f: 0, k: 1.14, cx: 515, ry: 838 },
  { f: 66, k: 1.09, cx: 535, ry: 844 },
  { f: 94, k: 1.1, cx: 540, ry: 844 },
  { f: 152, k: 1.18, cx: 562, ry: 846 },
  { f: LAST, k: 1.12, cx: 545, ry: 842 },
];
const CAM = (() => {
  const K: number[] = [];
  const CX: number[] = [];
  const RY: number[] = [];
  for (let f = 0; f <= LAST; f++) {
    const i = Math.max(0, CAM_KEYS.findIndex((q, n) => n + 1 < CAM_KEYS.length && f <= CAM_KEYS[n + 1].f));
    const a = CAM_KEYS[i];
    const b = CAM_KEYS[i + 1] ?? a;
    const u = b.f > a.f ? camEase((f - a.f) / (b.f - a.f), 1) : 1;
    K.push(a.k + (b.k - a.k) * u);
    CX.push(a.cx + (b.cx - a.cx) * u);
    RY.push(a.ry + (b.ry - a.ry) * u);
  }
  const out: { k: number; cx: number; cy: number; ry: number }[] = [];
  let k = K[0];
  let cx = CX[0];
  let ry = RY[0];
  let vk = 0;
  let vx = 0;
  let vl = 0;
  for (let f = 0; f <= LAST; f++) {
    if (f > 0) {
      vk += (K[f] - k) * CAM_STIFF - vk * CAM_DAMP;
      k += vk;
      vx += (CX[f] - cx) * CAM_STIFF - vx * CAM_DAMP;
      cx += vx;
      vl += (RY[f] - ry) * CAM_STIFF - vl * CAM_DAMP;
      ry += vl;
    }
    out.push({ k, cx, ry, cy: RULE_Y - (ry - 960) / k });
  }
  return out;
})();
// after the user's 190 px shift: the floor stays above the first caption band (1080) and the DAY 1 sign, the brain and
// the neck stay in frame, on every frame (+ the sway's 5 px)
CAM.forEach((c, f) => {
  const scr = (x: number, y: number) => ({ x: 540 + (x - c.cx) * c.k, y: c.ry + (y - RULE_Y) * c.k + DERPY_SHIFT_Y });
  const floor = scr(0, RULE_Y).y + SW * c.k + 5;
  if (floor > 1078) throw new Error(`BottleneckedWeights: the floor reaches y ${floor.toFixed(1)} at f${f}`);
  const sign = scr(0, 236).y - 5;
  const right = scr(X_E + BEND_R + H_N + SW, 0).x + 5;
  const left = scr(165, 0).x - 5;
  if (sign < 60 || right > 1040 || left < 40) throw new Error(`BottleneckedWeights: the set leaves the frame at f${f}`);
});
const CX_REST = CAM[0].cx;
const CY_REST = CAM[0].cy;

/** for the hand-off */
export const SCHED = { X_M, X_S, X_N, X_E, QUEUE, LIFT_F, CONTACT_F, DOOR_SHUT, RELEASE_F, CAM, FALLS };

const BottleneckedWeights: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = CAM[Math.max(0, Math.min(LAST, frame))];
  const s = sway(frame);
  const k = cam.k;
  const cx = cam.cx + s.dx;
  const cy = cam.cy + s.dy;
  const { tx, ty } = worldTransform(cx, cy, k);
  const march = frame * MARCH;

  // the intern and every card it still owns (held, flying, queued); z: queued cards behind the held stack,
  // a later arrival behind an earlier one
  const it = internAt(frame);
  // a lifting card stays in the stack's layer (behind the held cards in front of it) until it has risen clear of
  // them, then moves to the front layer (it overlaps nothing of the intern on that frame)
  const held: StackCard[] = handPlaces(frame).filter((c) => frame < LIFT_F[c.j]);
  const rising: StackCard[] = [0, 1, 2]
    .filter((j) => frame >= LIFT_F[j] && frame < LIFT_F[j] + Z_SWITCH)
    .map((j) => ({ ...cardAt(j, frame), j, e: 1 }));
  const stack = [...rising, ...held].sort((a, b) => a.j - b.j);
  const front = [2, 1, 0].filter((j) => frame >= LIFT_F[j] + Z_SWITCH && !released(j, frame));

  // the funnel walls: solid head f34-52, dashed head f52-74
  const solidT = smoothstep((frame - WALL_F0) / (WALL_F1 - WALL_F0));
  const dashT = clamp01((frame - WALL_F1) / (NECK_F1 - WALL_F1));
  const dashE = 1 - (1 - dashT) * (1 - dashT); // the neck's head eases out as it lands

  // the leaf
  const th = leafAngle(frame);
  const leafX1 = LEAF_X0 + LEAF_W * Math.cos(th);
  const shrink = 1 - 0.16 * Math.sin(th);
  const leafMid = (LEAF_TOP + LEAF_BOT) / 2;
  const fy0 = leafMid - ((leafMid - LEAF_TOP) * shrink);
  const fy1 = leafMid + ((LEAF_BOT - leafMid) * shrink);

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CY_REST}
        cx={cx}
        cxRest={CX_REST}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty + DERPY_SHIFT_Y}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <SessionDoor k={k} x={DX} />
            {/* the leaf, behind the intern */}
            {th < Math.PI / 2 - 1e-3 ? (
              <g style={{ filter: iconShadow(k) }} fill="none" stroke={INK} strokeWidth={SW} strokeLinejoin="round">
                <path
                  d={`M${LEAF_X0.toFixed(2)} ${LEAF_TOP.toFixed(2)} L${leafX1.toFixed(2)} ${fy0.toFixed(2)} L${leafX1.toFixed(2)} ${fy1.toFixed(2)} L${LEAF_X0.toFixed(2)} ${LEAF_BOT.toFixed(2)} Z`}
                  fill={INK}
                  fillOpacity={LEAF_FILL}
                  stroke="none"
                />
                <path
                  d={`M${LEAF_X0.toFixed(2)} ${LEAF_TOP.toFixed(2)} L${leafX1.toFixed(2)} ${fy0.toFixed(2)} L${leafX1.toFixed(2)} ${fy1.toFixed(2)} L${LEAF_X0.toFixed(2)} ${LEAF_BOT.toFixed(2)} Z`}
                />
                {th < 1.2 ? (
                  <circle cx={leafX1 - 26 * Math.cos(th)} cy={leafMid + 10} r={worldPx(6, SESSION_K)} fill={INK} stroke="none" />
                ) : null}
              </g>
            ) : null}
            {/* the released cards: drain, slide out, tumble and fall behind the floor */}
            <g style={{ filter: iconShadow(k) }}>
              <defs>
                <clipPath id="bw-floor" clipPathUnits="userSpaceOnUse">
                  <rect x={-1e5} y={-1e5} width={2e5} height={1e5 + RULE_Y} />
                </clipPath>
              </defs>
              <g clipPath="url(#bw-floor)">
                {[2, 1, 0].map((j) => {
                  if (!released(j, frame)) return null;
                  const st = FALLS[j][frame];
                  if (st.gone) return null;
                  return <NoteCard key={j} place={st.place} kind="ai" lit={st.lit} />;
                })}
              </g>
            </g>
            <CalendarRule k={k} x0={HX - 1400} x1={HX + 1800} ticks={[]} />
            {/* the AI's own brain (its weights), tied to its head by two thought dots; it breathes, nothing reaches it */}
            <g style={{ filter: iconShadow(k) }}>
              {DOTS.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y + 2 * Math.sin((frame + 9 * i) / 14)} r={d.r} fill={INK} />
              ))}
              <g
                transform={`translate(${BR_CX} ${BR_CY}) scale(${(1 + 0.012 * Math.sin(frame / 17)).toFixed(4)})`}
                fill="none"
                stroke={INK}
                strokeWidth={SW}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={BRAIN_STEM} />
                <path d={BRAIN_BACK} fill={INK} fillOpacity={0.12} />
                <path d={BRAIN_D} fill={INK} fillOpacity={0.12} />
                <g opacity={INK_HI} strokeWidth={SW * 0.8}>
                  {[...BRAIN_FOLDS, ...BRAIN_BACK_FOLDS].map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                </g>
              </g>
            </g>
            {/* the mouth's rim, far half (behind the cards) */}
            {solidT > 0 ? (
              <g style={{ filter: iconShadow(k) }}>
                <path d={rimArc(1, solidT)} fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round" />
              </g>
            ) : null}
            <CarrierFigure id="ai" k={k} kind="ai" pose={it.pose} gait={0} carry={it.carry} stack={stack} />
            {/* the cards on their way in, and the jam (a later arrival behind an earlier one) */}
            <g style={{ filter: iconShadow(k) }}>
              {front.map((j) => (
                <NoteCard key={j} place={cardAt(j, frame)} kind="ai" />
              ))}
            </g>
            {/* the mouth's rim, near half (in front of the cards) */}
            {solidT > 0 ? (
              <g style={{ filter: iconShadow(k) }}>
                <path d={rimArc(-1, solidT)} fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round" />
              </g>
            ) : null}
            {/* the funnel: solid walls, then the dashed neck */}
            <g style={{ filter: iconShadow(k) }} fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round">
              {WALLS.map((w, i) => (
                <g key={i}>
                  {solidT > 0 ? <path d={toD(polyHead(w.solid, w.solidLen * solidT))} /> : null}
                  {dashT > 0 ? (
                    <path
                      d={toD(polyHead(w.dashed, w.dashedLen * dashE))}
                      strokeDasharray={`${DASH_ON} ${DASH_OFF}`}
                      strokeDashoffset={-march}
                      strokeLinecap="butt"
                    />
                  ) : null}
                </g>
              ))}
            </g>
          </svg>
          <DoorSignText k={k} x={DX} inT={1} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default BottleneckedWeights;
