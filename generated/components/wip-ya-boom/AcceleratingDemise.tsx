// ---------------------------------------------------------------------------
// AcceleratingDemise (wip-ya-boom, cut 68, the clip's last shot). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx) with the clip's materials (./yaShared.tsx).
// Opaque 1080x1920, 24 fps, 111 frames.
//
// CHECK LINE: "publishers keep piling on more of the same few hits to prop the industry up, and that is exactly what knocks it
// over". With the sound off: a tall, leaning tower of photocopied book spines (REBECCA YARROS, HOOVER, SARAH J. MAAS at the top)
// gets one more copy of the same book from a hand, then two more dealt on, faster; every copy tips it further,
// until it goes over and the books slide apart across the page.
//
// THE LINE: "In the attempt to save their industry, publishers may just be accelerating its demise."
// WORD -> FRAME: In -2 · the 2 · attempt 4 · to 8 · save 13 · their 19 · industry 22 · publishers 34 · may 42 · just 52 ·
// be 58 · accelerating 63 · its 77 · demise 87
// DURATION: the slot 68.708 -> 73.333 s = 4.625 s x 24 = 111 frames (f0..f110). It ends the video.
//
// THE MOTION: one tower, one fall. The tower (11 spines, ~1100 px) stands on the page already leaning 2.5 deg about its
// bottom right corner (the pivot, where the base spine's contact shadow sits on the page the whole time); the lower spines
// are strips of cover art with no lettering (they pass through the caption bands), the top ones carry the names. A b&w
// cut-out hand comes down from the top left, the back of the hand up and its fingers over the top of another REBECCA YARROS
// copy, the forearm running out of the frame; it sets the copy on top (contact f12, before "save"), lets go and lifts away
// up its forearm (f15-f25); the lean gets worse, not better. Two more copies are dealt onto the top from off frame, faster
// (contacts f33 "publishers", f45); each contact tips the whole tower further (one rigid block about the pivot; an 8-frame
// critically damped kick: 2.5 -> 5 -> 7.5 -> 10 deg). The last one pushes it past balance: from f45 the lean grows on its
// own, slowly and then faster (an inverted pendulum, e^(0.1 f)): 13 deg on "accelerating" (f63), 24 on "its" (f77). At f84
// (39 deg) the block lets go: every spine flies on with the speed it had, comes down on its lower corner, falls flat about it
// and slides (no bounce). The heap is designed: two columns of spines, art strips in the lower three rows, the named copies
// piled three high on top, the last copy highest; each flight is bent toward its rest by a smooth correction that is
// zero-speed at both ends. Landings f87-f90 ("demise" f87), slides settle by ~f100; the base spine falls back flat where it
// stood.
// Camera: keyed on where the pivot sits on screen. Until the heap has landed the pivot stays put at (560, 1240), slightly
// below centre, and the camera only pulls back about it (k 0.84 at f0 -> 0.74 at the last deal -> 0.56 as it goes over),
// so the base stays on the page while the top swings out (the far spines leave the frame right for a few frames). From
// ~f88 a push in on the heap: at f110 k 0.92, the heap fills the width (cut by both edges), its named rows at y ~670-1070,
// the art rows through the first caption band, the page line at ~1300.
// Contact frames (first reaction = the tilt kick, on the contact frame): hand copy f12, dealt copies f33, f45.
// SPOT INK: none. No text: the spines are the artefacts.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt): spines cut from the publishers' front covers (Fourth Wing, Iron Flame,
// Onyx Storm, It Ends with Us, It Starts with Us, Verity, The Housemaid, A Court of Thorns and Roses 2020): bands with the
// author's name, or bands of cover art with no lettering for the lower tower (they pass through the caption bands). Hand:
// assets_raw/photos/hand_ReachingBookOnShelf_colour.jpg, a traced scissor-cut polygon round one hand, turned upside down. Baked by
// scripts/clips/wip-ya-boom/bake-AcceleratingDemise.py into public/wip-ya-boom/ad_*.png.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, PaperGround, WipCam, WipFilmLife, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";
import { SLAP_REST, Slap, THEME, XeroxCutOut, slapDown } from "./yaShared";

export const FPS = 24;
export const DURATION = 111;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const D2R = Math.PI / 180;

// -- the spines -------------------------------------------------------------------------------------------------------
type Spine = { src: string; aspect: number };
const sp = (name: string, aspect: number): Spine => ({ src: `wip-ya-boom/ad_${name}.png`, aspect });
const S = {
  fwYarros: sp("fw_yarros", 6.1644),
  ifYarros: sp("if_yarros", 6.0403),
  osYarros: sp("os_yarros", 6.0403),
  iewuHoover: sp("iewu_hoover", 4.4776),
  iswuHoover: sp("iswu_hoover", 4.4118),
  verityHoover: sp("verity_hoover", 5.8065),
  hmMcfadden: sp("hm_mcfadden", 7.6923),
  acotarMaas: sp("acotar_maas", 7.8261),
  fwArt: sp("fw_art", 6.1644),
  fwArt2: sp("fw_art2", 6.1644),
  ifArt: sp("if_art", 5.9603),
  ifArt2: sp("if_art2", 7.8261),
  osArt: sp("os_art", 6.2937),
  verityArt: sp("verity_art", 6.1644),
  hmArt: sp("hm_art", 6.1644),
  hmEye: sp("hm_eye", 6.1644),
};
const BORDER = 7; // the scissor margin of a spine strip
const PITCH_GAP = 3; // between one spine's edge and the next (the paper margins overlap)

// -- the tower, bottom to top. dx: the spine's centre from the base spine's centre (a tower drifts as it is stacked) ------
type Book = { key: string; s: Spine; w: number; dx: number; rot: number };
const TOWER: Book[] = [
  { key: "t0", s: S.ifArt, w: 640, dx: 0, rot: 0 },
  { key: "t1", s: S.osArt, w: 600, dx: 6, rot: -0.6 },
  { key: "t2", s: S.hmEye, w: 590, dx: -4, rot: 0.8 },
  { key: "t3", s: S.verityArt, w: 600, dx: 14, rot: -0.4 },
  { key: "t4", s: S.fwArt, w: 580, dx: 8, rot: 1.0 },
  { key: "t5", s: S.ifArt2, w: 610, dx: 22, rot: -0.9 },
  { key: "t6", s: S.hmArt, w: 590, dx: 18, rot: 0.5 },
  { key: "t7", s: S.osYarros, w: 590, dx: 30, rot: -1.1 },
  { key: "t8", s: S.acotarMaas, w: 600, dx: 26, rot: 0.9 },
  { key: "t9", s: S.verityHoover, w: 590, dx: 40, rot: -0.5 },
  { key: "t10", s: S.fwYarros, w: 600, dx: 36, rot: 1.2 },
];
// the copies piled on: one from the hand, then dealt, faster each time
type Add = Book & { contact: number; kick: number; from?: { x: number; y: number }; spin?: number };
const ADDS: Add[] = [
  { key: "a0", s: S.fwYarros, w: 600, dx: 52, rot: -0.8, contact: 12, kick: 2.5 },
  { key: "a1", s: S.iewuHoover, w: 580, dx: 66, rot: 1.4, contact: 33, kick: 2.5, from: { x: -1100, y: -420 }, spin: -14 },
  { key: "a2", s: S.fwYarros, w: 600, dx: 84, rot: -1.6, contact: 45, kick: 2.5, from: { x: -1050, y: -520 }, spin: -12 },
];
const ALL: Book[] = [...TOWER, ...ADDS];

// -- local geometry: origin at the pivot (the base spine's bottom right corner), y down, the tower in -y -------------------
const FLOOR_Y = 1500; // world
const PIVOT_X = 790; // world
const hOf = (b: Book) => b.w / b.s.aspect;
const LOCAL: { cx: number; cy: number }[] = (() => {
  const out: { cx: number; cy: number }[] = [];
  const baseCx = -ALL[0].w / 2;
  let top = 0;
  for (const b of ALL) {
    const h = hOf(b);
    out.push({ cx: baseCx + b.dx, cy: top - h / 2 });
    top -= h + PITCH_GAP;
  }
  return out;
})();

// -- the lean: kicks on contact (critically damped, no overshoot), then the fall past balance -----------------------------
const LEAN0 = 2.5;
const KICK_TAU = 2.2;
const kickAt = (t: number) => (t <= 0 ? 0 : 1 - (1 + t / KICK_TAU) * Math.exp(-t / KICK_TAU));
const LAST = ADDS[ADDS.length - 1].contact;
const FALL_L = 0.1; // per frame: an inverted pendulum's growth rate for a tower this tall
const FALL_A = 0.6; // deg
const fallAt = (t: number) => (t <= 0 ? 0 : FALL_A * (Math.cosh(FALL_L * t) - 1 + Math.sinh(FALL_L * t)));
const leanAt = (f: number) => LEAN0 + ADDS.reduce((s, a) => s + a.kick * kickAt(f - a.contact), 0) + fallAt(f - LAST);
const BREAK_F = 84; // the block lets go: every spine flies on

const rigidPose = (i: number, f: number): { x: number; y: number; rot: number } => {
  const th = leanAt(f) * D2R;
  const { cx, cy } = LOCAL[i];
  return {
    x: PIVOT_X + cx * Math.cos(th) - cy * Math.sin(th),
    y: FLOOR_Y + cx * Math.sin(th) + cy * Math.cos(th),
    rot: ALL[i].rot + leanAt(f),
  };
};

// -- the fall: each spine flies on from the break, lands on its lowest corner, slaps flat and slides -----------------------
const GRAV = 20; // world px / frame^2: about 1 g for a tower this size
const SPIN_KEEP = 0.45; // in the air a loose spine keeps a little of the block's spin
const FLOP_DUR = 4; // frames from corner contact to flat
const FLOP_BASE = 7;
type Pose = { x: number; y: number; rot: number };
const corners = (p: Pose, w: number, h: number) => {
  const c = Math.cos(p.rot * D2R);
  const s = Math.sin(p.rot * D2R);
  return [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ].map(([u, v]) => ({ x: p.x + u * c - v * s, y: p.y + u * s + v * c }));
};
// flight from the break: the speed each spine had in the block (a little jostled as the block comes apart) and part of its
// spin, then gravity (closed form)
const jit = (i: number, k: string) => random(`ad-fly-${ALL[i].key}-${k}`) - 0.5;
const ballistic = (i: number, f: number): Pose => {
  const p0 = rigidPose(i, BREAK_F);
  const p1 = rigidPose(i, BREAK_F + 0.25);
  const lev = i / (ALL.length - 1); // the higher, the looser
  const vx = (p1.x - p0.x) / 0.25 + jit(i, "vx") * 8 * lev;
  const vy = (p1.y - p0.y) / 0.25 + jit(i, "vy") * 6 * lev;
  const om = ((leanAt(BREAK_F + 0.25) - leanAt(BREAK_F)) / 0.25) * (SPIN_KEEP + jit(i, "om") * 0.5);
  const t = f - BREAK_F;
  return { x: p0.x + vx * t, y: p0.y + vy * t + 0.5 * GRAV * t * t, rot: p0.rot + om * t };
};
const lowCorner = (q: Pose, b: Book) => {
  const cs = corners(q, b.w + BORDER, hOf(b) + BORDER);
  return cs.reduce((m, c) => (c.y > m.y ? c : m), cs[0]);
};

// -- the heap: where each spine comes to rest (centre, tilt) and how far it slides on after it lands ------------------------
// Designed as one tall, messy heap two spines wide, the art strips in the lower rows, the named copies piled on top; the
// layers rise in paint order (a later spine never lies under an earlier one). Each spine's flight is bent toward its own rest
// (a smooth correction that starts at zero speed at the break and ends at zero speed at the landing, so the landing keeps the
// flight's own speed for the slide).
type Rest = { x: number; y: number; rot: number; slide: number };
// per spine: the layer it ends on (0 = the page), its tilt there, where its bottom right corner comes to rest (world x) and
// how far it slides to get there after it lands
type Spec = { layer: number; rot: number; x: number; slide: number };
const LAYER_H = 90;
const SPEC: Record<string, Spec> = {
  // the base stays where it stood and falls back flat
  t0: { layer: 0, rot: 0, x: PIVOT_X, slide: 0 },
  // the left column: art strips below (they lie in the first caption band at the end), named copies on top
  t1: { layer: 0, rot: 0.6, x: 1200, slide: 40 },
  t2: { layer: 1, rot: 2.5, x: 1240, slide: 30 },
  t3: { layer: 2, rot: -2, x: 1180, slide: 30 },
  // the right column's art strips
  t4: { layer: 0, rot: 0.4, x: 1790, slide: 60 },
  t5: { layer: 1, rot: -1.5, x: 1820, slide: 40 },
  t6: { layer: 2, rot: 3, x: 1780, slide: 40 },
  // the named copies: left, right, left ...
  t7: { layer: 3, rot: 2.5, x: 1210, slide: 30 },
  t8: { layer: 4, rot: -3, x: 1170, slide: 20 },
  t9: { layer: 5, rot: 3.5, x: 1230, slide: 30 },
  t10: { layer: 3, rot: -2, x: 1800, slide: 40 },
  a0: { layer: 4, rot: 3, x: 1770, slide: 40 },
  a1: { layer: 5, rot: -2.5, x: 1830, slide: 40 },
  // the last copy lands highest, on the right column, and slides on furthest
  a2: { layer: 6.5, rot: -1.5, x: 1800, slide: 110 },
};
type Landing = { f: number; corner: { x: number; y: number }; rot0: number; vx: number; slideDur: number; delta: Pose };
const centreFromCorner = (b: Book, cx: number, cy: number, rot: number): Pose => {
  const w = b.w + BORDER;
  const h = hOf(b) + BORDER;
  const c = Math.cos(rot * D2R);
  const s = Math.sin(rot * D2R);
  return { x: cx + (-w / 2) * c - (-h / 2) * s, y: cy + (-w / 2) * s + (-h / 2) * c, rot };
};
const SIM_DT = 0.125;
const MIN_FLIGHT = 3; // frames, for the lowest spine; the top one gets 3 more
const SLIDE_V_MIN = 15; // px / frame: a landing slide starts at least this fast
const restOf = (i: number): Rest => {
  const b = ALL[i];
  const sp = SPEC[b.key];
  return { ...centreFromCorner(b, sp.x, FLOOR_Y - sp.layer * LAYER_H, sp.rot), slide: sp.slide };
};
const restCorner = (b: Book, r: Rest) => {
  const w = b.w + BORDER;
  const h = hOf(b) + BORDER;
  const c = Math.cos(r.rot * D2R);
  const s = Math.sin(r.rot * D2R);
  return { x: r.x + (w / 2) * c - (h / 2) * s, y: r.y + (w / 2) * s + (h / 2) * c };
};
const LANDINGS: Landing[] = ALL.map((b, i) => {
  const r = restOf(i);
  const rc = restCorner(b, r);
  // the landing: when the free flight's lowest corner reaches the level of its rest corner, and never sooner than a few
  // frames after the break (the low spines are already near their level: they are shoved out, not dropped)
  let f = BREAK_F;
  if (i > 0) {
    while (lowCorner(ballistic(i, f), b).y < rc.y) f += SIM_DT;
    f = Math.max(f, BREAK_F + MIN_FLIGHT + 3 * (i / (ALL.length - 1)));
  }
  const q = ballistic(i, f);
  const vx = i === 0 ? 0 : (ballistic(i, f + 0.01).x - q.x) / 0.01;
  const rot0 = i === 0 ? q.rot : Math.min(q.rot, 68);
  const corner = { x: rc.x - r.slide, y: rc.y };
  const land = centreFromCorner(b, corner.x, corner.y, rot0);
  return {
    f,
    corner,
    rot0,
    vx,
    slideDur: r.slide > 0 ? (2 * r.slide) / Math.max(vx, SLIDE_V_MIN) : 0,
    delta: { x: land.x - q.x, y: land.y - q.y, rot: rot0 - q.rot },
  };
});

const poseAt = (i: number, f: number): Pose => {
  if (f <= BREAK_F) return rigidPose(i, f);
  const L = LANDINGS[i];
  const b = ALL[i];
  if (f < L.f) {
    const q = ballistic(i, f);
    const u = (f - BREAK_F) / (L.f - BREAK_F);
    const e = u * u * (3 - 2 * u);
    return { x: q.x + L.delta.x * e, y: q.y + L.delta.y * e, rot: q.rot + L.delta.rot * e };
  }
  const r = restOf(i);
  const t = f - L.f;
  // the corner slides on from the landing speed to rest (constant deceleration); the spine falls flat about it, accelerating
  const us = L.slideDur > 0 ? Math.min(1, t / L.slideDur) : 1;
  const cx = L.corner.x + r.slide * (1 - (1 - us) * (1 - us));
  // the base spine falls back flat from the full lean (its far end was lifted off the page): slower
  const u = Math.min(1, t / (i === 0 ? FLOP_BASE : FLOP_DUR));
  const rot = L.rot0 + (r.rot - L.rot0) * u * u;
  return centreFromCorner(b, cx, L.corner.y, rot);
};

// -- the hand: lowers the first copy from above (fingers over its top, the forearm running up and out of the frame top left),
// sets it on top, lets go and lifts away the way it came -------------------------------------------------------------------
const HAND_SRC = "wip-ya-boom/ad_hand_down.png";
const HAND_ASPECT = 0.5773; // 635 x 1100 px, the photo upside down: wrist at the top, fingers hanging down
const HAND_PX = { w: 635, h: 1100 };
const HAND_TIPS = { x: 250, y: 985 }; // the fingers' middle, just above the nails: it rests on the spine's top half
const HAND_W = 440; // world px: four fingers span about two fifths of the spine
const HAND_TILT = -24; // deg: the forearm leans up and to the left
const HAND_ARM = { x: -Math.sin(-HAND_TILT * D2R), y: -Math.cos(HAND_TILT * D2R) }; // up the forearm
const A0 = TOWER.length; // index of the hand's copy in ALL
const HAND_IN = -6; // its first frame, the copy still above the frame
const HAND_OUT = 15; // lets go and lifts away
const carryOffset = (f: number) => {
  const u = Math.min(1, Math.max(0, (f - HAND_IN) / (ADDS[0].contact - HAND_IN)));
  const e = (1 - u) ** 1.7; // decelerates into a gentle set-down
  // down the forearm's line, the last stretch straight down
  return { x: HAND_ARM.x * 700 * e * e, y: HAND_ARM.y * 700 * e - 40 * e * (1 - e) * 4 };
};
const handPose = (f: number) => {
  const b = ADDS[0];
  const r = rigidPose(A0, Math.min(f, b.contact));
  const o = f < b.contact ? carryOffset(f) : { x: 0, y: 0 };
  const sc = HAND_W / HAND_PX.w;
  // the finger point sits on the spine's top half, a little left of its centre
  const gx = -60;
  const gy = -hOf(b) * 0.12;
  const c = Math.cos(r.rot * D2R);
  const s = Math.sin(r.rot * D2R);
  const tx = r.x + o.x + gx * c - gy * s;
  const ty = r.y + o.y + gx * s + gy * c;
  const rot = r.rot + HAND_TILT;
  const ox = (HAND_PX.w / 2 - HAND_TIPS.x) * sc;
  const oy = (HAND_PX.h / 2 - HAND_TIPS.y) * sc;
  const hc = Math.cos(rot * D2R);
  const hs = Math.sin(rot * D2R);
  let x = tx + ox * hc - oy * hs;
  let y = ty + ox * hs + oy * hc;
  if (f > HAND_OUT) {
    // lets go: lifts away up the forearm, accelerating
    const t = (f - HAND_OUT) / 10;
    const e = t <= 1 ? t * t : 2 * t - 1;
    x += HAND_ARM.x * 900 * e;
    y += HAND_ARM.y * 900 * e;
  }
  return { x, y, rot, w: HAND_W };
};

// -- the camera, keyed on where the pivot (the corner the tower turns on) sits on screen: while the tower leans and falls
// the pivot stays put at (PIV_X, PIV_Y) and the camera only pulls back about it; once the heap has landed it pushes in on it
type PivotKey = { f: number; px: number; py: number; k: number; ease?: "inout" | "linear" };
const PIV_X = 560;
const PIV_Y = 1240;
const HEAP_X = 1200; // world: the heap's middle
const PIVOT_KEYS: PivotKey[] = [
  { f: -20, px: PIV_X, py: PIV_Y, k: 0.86 },
  { f: 8, px: PIV_X, py: PIV_Y, k: 0.82 },
  { f: 40, px: PIV_X, py: PIV_Y, k: 0.74 },
  { f: 66, px: PIV_X, py: PIV_Y, k: 0.68 },
  { f: 80, px: PIV_X, py: PIV_Y, k: 0.56 },
  { f: 86, px: PIV_X, py: PIV_Y, k: 0.56 },
  // the push in on the heap: its centre (world x ~1200) mid-frame, the page line at the first caption band's foot
  { f: 102, px: 540 + (PIVOT_X - HEAP_X) * 0.92, py: 1300, k: 0.92 },
  { f: 150, px: 540 + (PIVOT_X - HEAP_X) * 0.94, py: 1304, k: 0.94, ease: "linear" },
];
const pivotTrack = runWipCamera(
  PIVOT_KEYS.map(({ f, px, py, k, ease }) => ({ f, x: px, y: py, k, ease })),
  DURATION,
);
const toWorldCam = (px: number, py: number, k: number) => ({ x: PIVOT_X - (px - 540) / k, y: FLOOR_Y - (py - 960) / k, k });
const REST_CAM = toWorldCam(PIVOT_KEYS[0].px, PIVOT_KEYS[0].py, PIVOT_KEYS[0].k);
const camAt = (f: number): WipCam => {
  const p = pivotTrack(f);
  return { ...toWorldCam(p.x, p.y, p.k), x0: REST_CAM.x, y0: REST_CAM.y };
};

// -- the base spine's contact shadow on the page: the dense core at the pivot never leaves; along the spine it thins as the
// far end lifts off the page and comes back when the base falls flat
const ContactShadow: React.FC<{ frame: number }> = ({ frame }) => {
  const b = ALL[0];
  const p = poseAt(0, frame);
  const w = b.w + BORDER;
  const h = hOf(b) + BORDER;
  const lift = Math.max(0, Math.sin(p.rot * D2R)) * w; // the far end's height above the page
  const along = Math.max(0, 1 - lift / 90);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - w,
          top: FLOOR_Y - 10,
          width: w,
          height: 22,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(20,22,20,0.4), rgba(20,22,20,0))",
          filter: "blur(4px)",
          opacity: along,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - 110 - h * 0.1,
          top: FLOOR_Y - 12,
          width: 170,
          height: 28,
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(20,22,20,0.6), rgba(20,22,20,0))",
          filter: "blur(3px)",
        }}
      />
    </>
  );
};

const AcceleratingDemise: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const hand = frame < HAND_OUT + 30 ? handPose(frame) : null;
  return (
    <>
      <WipFilmLife frame={frame} theme={THEME}>
        <PaperGround cam={cam} theme={THEME} />
        <WipPlane cam={cam}>
          <ContactShadow frame={frame} />
          {ALL.map((b, i) => {
            const add = i >= TOWER.length ? ADDS[i - TOWER.length] : null;
            let pose = poseAt(i, frame);
            let slap: Slap = SLAP_REST;
            let lift: number | undefined;
            if (add && frame < add.contact + 8) {
              if (add.from) {
                slap = slapDown(frame, add.contact, { from: add.from, spin: add.spin, skid: 10 });
                if (!slap.shown) return null;
              } else if (frame < add.contact) {
                const o = carryOffset(frame);
                pose = { ...pose, x: pose.x + o.x, y: pose.y + o.y };
                lift = 0.35 * Math.min(1, (add.contact - frame) / 6);
              }
            }
            return (
              <XeroxCutOut
                key={b.key}
                src={b.s.src}
                kind="cover"
                x={pose.x}
                y={pose.y}
                w={b.w}
                aspect={b.s.aspect}
                rotate={pose.rot}
                border={BORDER}
                slap={slap}
                lift={lift}
                seed={`ad-${b.key}`}
              />
            );
          })}
          {hand ? (
            <XeroxCutOut src={HAND_SRC} kind="person" x={hand.x} y={hand.y} w={hand.w} aspect={HAND_ASPECT} rotate={hand.rot} lift={0.3} seed="ad-hand" />
          ) : null}
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default AcceleratingDemise;
