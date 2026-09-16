import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp,
  clamp01,
  feather,
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";
import { DARK_TRAFFIC_OPACITY, Packet, WAKE_LEAD, arriveEase } from "./levelUp";

export const FPS = 24;

// Ajeya Cotra, clip `StillDecideWhatWeWant`: "Even if the AIs can do all the
// technical work, we'll have to still do a lot of that, and decide what we
// actually want."
//
// The composition starts at SRT 19.80 s, so every beat below is
// frame = round((t - 19.80) * 24). The next word after this line ("alignment")
// lands at f133, so the speech runs 0..133 and a 16 frame tail holds the
// resolved state: DURATION = 133 + 16 = 149.
export const DURATION = 149;

// ---------------------------------------------------------------------------
// "People draw the shape, the orange dots fill it." This cut is the same world
// a few seconds after `HowAssistantsShouldBehaveV3` — the same five person
// glyphs, the same orange crowd, the same ink outline, the same camera, the
// same liveness — and it says the second half of the rule: the dots can do ALL
// the filling, fast, but a shape only exists once a person has drawn it.
//
// Vocabulary, fixed for the whole clip and not restated per cut:
//   people            = person.png glyphs, white, 72 world px, countable
//   assistants        = orange dots, solid, ACCENT_DEEP at rest, ACCENT seated
//   a human decision  = a white ink outline that comes from one person
//
// THE PICTURE. A row of four decision slots under the five people, each with a
// thin ink provenance line up to the person who made it. Slot 1 is full (it is
// where V3 ended). Slots 2 and 3 stand empty. Slot 4 is empty SPACE — there is
// no outline there at all — and that is the whole argument of the cut.
//
// Every gesture is one word. Nothing else happens.
//   the standing scene: three outlines, one of them
//     full, the loose crowd milling below, the
//     camera already creeping                       — "even if"        f0-14
//   the crowd does the work: ~2-4 launches a frame,
//     hashed, ramping down, every dot on its own arc
//     to its own seat; slot 2 fills first, slot 3
//     overlaps it; a dot goes deep -> ripe as it
//     lands; both slots FULL at f44, the last few
//     landing on the word                           — "the AIs can do
//                                                      all the technical
//                                                      work"           f12-44
//   camera: the pull-back that rides the fill,
//     k 1.0 -> 0.94, landing f40, ahead of "work"    — (rides the fill) f14-40
//   the wait: the ~17 dots the slots did not take
//     drift right as a loose cluster and gather at
//     the foot of the empty space where slot 4 is
//     not, and mill there. They cannot enter: there
//     is no outline.                                — "we'll have to
//                                                      still do a lot"  f52-84
//   camera: one long even creep right and slightly
//     in toward that empty space, landing on "that",
//     then DEAD STILL, the held breath               — (rides the wait) f54-91
//                                                       held breath     f91-98
//   a person draws: the stroke leaves glyph 5
//     head-led, reaches the empty space, and draws
//     the fourth outline clockwise, closing two
//     frames before the word                        — "decide what we
//                                                      actually"        f100-120
//   the flood: the waiting dots rise into the new
//     outline on their own arcs, deep -> ripe as
//     they seat, front seats first; one packet laps
//     the closed outline once                       — "want"            f122-141
//   tail: the last dots seating, the mill and the
//     micro-drift running, the dark traffic thinning,
//     and a slow pull-back on the row of four        —                  f133-149
//
// ---------------------------------------------------------------------------
// LIVENESS. Every mechanism of the V3 pass is on, copied not reinvented.
//   1. THE CROWD IS NEVER STILL                                    f0-149
//      * micro-drift: every dot wanders +-3 world px on two hashed
//        sines (periods ~26 and ~41 f), at rest, seated, waiting,
//        in every hold and through the tail.
//      * the mill in the loose crowd (f0 -> each dot's departure):
//        one launch a frame, each an exchange of two neighbouring
//        dots passing on opposite 14 f arcs. The blob is saturated,
//        so a mill there is a swap, not a hop.
//      * the mill inside a slot: one hop every 5 f per slot to a
//        vacant neighbouring seat (a full slot is 36 dots in 45
//        seats, so there is always somewhere to go). Slot 1 mills
//        from f0, slots 2 and 3 from the frame they fill, slot 4
//        from the frame the flood lands. It never stops.
//      * the wait cluster mills at double that rate (one hop every
//        2 f) — it is what the eye is on through the held breath.
//   2. DARK TRAFFIC                                                f0-149
//      Idle accent threads between neighbouring dots at 0.12, no
//      heads, at the house rate idleThreads(N), thinning to half
//      across the tail.
//   3. THE DRAWING DISTURBS THE CROWD                              f100-120
//      A dot within 70 world px of the pen head is pushed up to 25 px
//      away and drifts back over 20 f. The line is physical.
//   4. THE STROKE HAS A HEAD                                       f100-120
//      Screen-space, 4.5 px at any k, exactly V3's; and one white
//      packet with its trail laps the closed outline in 24 f from
//      "want".
//   5. THE CAMERA NEVER PARKS                                      f0-149
//      Seven moves through one damped runCamera, each landing ahead
//      of its word, with a straight-ramp hold drift of ~1 screen
//      px/frame continuing the last move after every landing — and
//      exactly one dead-still stretch, the held breath f91-98.
//   6. THE PEOPLE ARE ALIVE                                        f0-149
//      Each glyph sways +-1.5 screen px on its own hashed sines, and
//      glyph 5 lifts 3 screen px over the WAKE_LEAD frames before it
//      starts to draw, settling as the stroke leaves.
//   7. ARRIVE EASE
//      Mill swaps, mill hops, the drift to the wait and the flood all
//      decelerate over the last 15% of their travel instead of
//      stopping dead.
//
// Deviations from the brief, and why:
//   * The fill launches at ~4.6 falling to ~2.2 a frame, not "~2 a frame".
//     72 seats have to be filled between f12 and f44 with an 11-15 frame
//     flight, which is 21 frames of launches: 2 a frame fills 42 of them. The
//     RAMP DOWN and the hashing are what the note is about and both are kept —
//     no two dots ever leave on the same sub-frame phase.
//   * A full slot is 36 dots in 45 seats, not 36 seats. A mill needs a vacancy
//     to hop into; the nine spares are chosen as blue noise (never two
//     adjacent) so they read as the crowd's own gaps, not as holes.
//   * Slot 4 ends on 17 dots, not 18: the crowd generator puts 89 dots in the
//     blob and 72 of them are what slots 2 and 3 hold. The leftover is whatever
//     the two slots did not take, which is the point of the beat, so it is not
//     rounded to a number.
//   * The flood's last dots seat at f141, not f138. The brief's own tail ("the
//     last dots seating") is where they land, and 17 arcs launched from f122 at
//     the set's 45 screen px/frame ceiling cannot all be down by f138.
//   * The outline is drawn in the 12 frames the brief asks for, which is ~60
//     screen px/frame average on a 672 px perimeter — over the set's head cap,
//     exactly as V3's approved outline draw was (~60). It keeps the 12 frames
//     because it has to close before "want". A streak behind the head was
//     tried and removed: at this speed it draws a visible chord across the
//     corner the pen is turning, which reads as a stray line, not a smear.
//   * The camera pans sideways as well as tilting, which V3 did not. The row of
//     four is 840 world px wide, so "creep toward slot 4" can only be a pan.
//     Every key is bounds-checked against the row at k 1.15, where it is 966
//     screen px and has only ~25 screen px of slack: the pan is capped there.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a seated dot
  accentDeep: z.string(), // deep: a dot that has not been placed
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotUnread: z.number(), // the dot body's opacity; the state ladder is colour
  beats: z.object({
    even: z.number(), // "even"
    theAIs: z.number(), // "the AIs"
    all: z.number(), // "all"
    technical: z.number(), // "technical"
    work: z.number(), // "work"
    weWill: z.number(), // "we'll"
    still: z.number(), // "still"
    aLot: z.number(), // "a lot"
    that: z.number(), // "that"
    decide: z.number(), // "decide"
    actually: z.number(), // "actually"
    want: z.number(), // "want"
    end: z.number(), // next word "alignment"; tail to 149
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotRadius: DOT_RADIUS,
  dotUnread: OP_UNREAD_DOT,
  beats: {
    even: 0,
    theAIs: 12,
    all: 29,
    technical: 34,
    work: 42,
    weWill: 52,
    still: 73,
    aLot: 84,
    that: 91,
    decide: 100,
    actually: 116,
    want: 122,
    end: 133,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;

const CX = 540;
const CONTENT_C = 771; // the camera's content centre at rest; screen y 835 at k 1

// ---------------------------------------------------------------------------
// The people. The same countable row of five as V3, same size and spacing.
// ---------------------------------------------------------------------------
const PEOPLE_N = 5;
const PEOPLE_STEP = 110;
const PEOPLE_Y = 470;
const GLYPH = 72;
const PEOPLE: { x: number; y: number }[] = Array.from({ length: PEOPLE_N }, (_, i) => ({
  x: CX + (i - (PEOPLE_N - 1) / 2) * PEOPLE_STEP,
  y: PEOPLE_Y,
}));
const DRAWER = 4; // glyph 5 draws the fourth outline

// ---------------------------------------------------------------------------
// The row of four decision slots, on the column axis under the people. Each is
// the same rounded rectangle V3's outline was, at the scale a row of four fits:
// 180 x 190 world px, gap 40, so the row spans world x 120..960 — 840 world px
// centred on the column axis, which at the camera's resting k of 1.15 is 966
// screen px, ~90% of the frame. The whole picture is hung off that row: the
// people sit at y 470, the row's centre line at y 800 (its bottom edge 895),
// and the loose crowd below it at y 990 with its lowest dot at ~1061, clear of
// the 1250 the captions leave.
// ---------------------------------------------------------------------------
const SLOT_N = 4;
const SLOT_W = 180;
const SLOT_H = 190;
const SLOT_GAP = 40;
const SLOT_CY = 800;
const SLOT_RATIO = 0.22; // corner radius as a fraction of the shorter side, as V3
const SLOT_CXS = Array.from(
  { length: SLOT_N },
  (_, i) => CX + (i - (SLOT_N - 1) / 2) * (SLOT_W + SLOT_GAP),
);
// which person each slot's provenance line goes up to: slot 1 -> glyph 2, ...
const SLOT_GLYPH = [1, 2, 3, 4];

const cornerR = (w: number, h: number) => SLOT_RATIO * Math.min(w, h);

type Seg =
  | { kind: "line"; len: number; x0: number; y0: number; x1: number; y1: number }
  | { kind: "arc"; len: number; cx: number; cy: number; r: number; a0: number; a1: number };

// The outline as segments, clockwise from top-centre, so both its `d` and any
// point along it come from one description. Head-led drawing needs the second.
const shapeSegs = (cx: number, cy: number, w: number, h: number): Seg[] => {
  const r = cornerR(w, h);
  const L = cx - w / 2;
  const R = cx + w / 2;
  const T = cy - h / 2;
  const B = cy + h / 2;
  const q = (Math.PI * r) / 2;
  return [
    { kind: "line", len: w / 2 - r, x0: cx, y0: T, x1: R - r, y1: T },
    { kind: "arc", len: q, cx: R - r, cy: T + r, r, a0: -Math.PI / 2, a1: 0 },
    { kind: "line", len: h - 2 * r, x0: R, y0: T + r, x1: R, y1: B - r },
    { kind: "arc", len: q, cx: R - r, cy: B - r, r, a0: 0, a1: Math.PI / 2 },
    { kind: "line", len: w - 2 * r, x0: R - r, y0: B, x1: L + r, y1: B },
    { kind: "arc", len: q, cx: L + r, cy: B - r, r, a0: Math.PI / 2, a1: Math.PI },
    { kind: "line", len: h - 2 * r, x0: L, y0: B - r, x1: L, y1: T + r },
    { kind: "arc", len: q, cx: L + r, cy: T + r, r, a0: Math.PI, a1: (3 * Math.PI) / 2 },
    { kind: "line", len: w / 2 - r, x0: L + r, y0: T, x1: cx, y1: T },
  ];
};

const shapePath = (cx: number, cy: number, w: number, h: number) => {
  const r = cornerR(w, h);
  const L = cx - w / 2;
  const R = cx + w / 2;
  const T = cy - h / 2;
  const B = cy + h / 2;
  const n = (v: number) => Number(v.toFixed(2));
  return [
    `M${n(cx)} ${n(T)}`,
    `L${n(R - r)} ${n(T)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(R)} ${n(T + r)}`,
    `L${n(R)} ${n(B - r)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(R - r)} ${n(B)}`,
    `L${n(L + r)} ${n(B)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(L)} ${n(B - r)}`,
    `L${n(L)} ${n(T + r)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(L + r)} ${n(T)}`,
    "Z",
  ].join(" ");
};

const shapeLength = (segs: Seg[]) => segs.reduce((a, s) => a + s.len, 0);

const pointAt = (segs: Seg[], t: number) => {
  let d = clamp01(t) * shapeLength(segs);
  for (const s of segs) {
    if (d > s.len) {
      d -= s.len;
      continue;
    }
    const u = s.len <= 0 ? 0 : d / s.len;
    if (s.kind === "line") {
      return { x: s.x0 + (s.x1 - s.x0) * u, y: s.y0 + (s.y1 - s.y0) * u };
    }
    const a = s.a0 + (s.a1 - s.a0) * u;
    return { x: s.cx + s.r * Math.cos(a), y: s.cy + s.r * Math.sin(a) };
  }
  const last = segs[segs.length - 1] as Extract<Seg, { kind: "line" }>;
  return { x: last.x1, y: last.y1 };
};

// Is a point inside a rounded rectangle, inset by `m`?
const insideShape = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  m: number,
) => {
  const hw = w / 2 - m;
  const hh = h / 2 - m;
  const rr = Math.max(0, cornerR(w, h) - m);
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);
  if (dx > hw || dy > hh) return false;
  if (dx <= hw - rr || dy <= hh - rr) return true;
  return Math.hypot(dx - (hw - rr), dy - (hh - rr)) <= rr;
};

const SEGS4 = shapeSegs(SLOT_CXS[3], SLOT_CY, SLOT_W, SLOT_H);
const PERIM4 = shapeLength(SEGS4);

// ---------------------------------------------------------------------------
// The seats inside a slot: a tight hashed lattice, inset so a dot never sits on
// the stroke. 45 seats; a full slot holds 36 of them, and the nine spares are
// what the mill hops into.
// ---------------------------------------------------------------------------
// Re-fitted to the narrower slot: 22.2 / 21 is the pair that still puts a 7 x 7
// lattice inside 180 x 190 and loses exactly the four corners to the rounded
// boundary, so a slot is still 45 seats holding 36 dots with nine blue-noise
// spares for the mill — the same crowd, the same gaps, in a narrower box.
const SEAT_STEP = 22.2;
const SEAT_MARGIN = 21;
const SEAT_JITTER = 0.4;
const SLOT_FILL = 36;

type Pt = { x: number; y: number };

const slotSeats = (cx: number, cy: number): Pt[] => {
  const out: Pt[] = [];
  const nu = Math.floor((SLOT_W - 2 * SEAT_MARGIN) / SEAT_STEP) + 1;
  const nv = Math.floor((SLOT_H - 2 * SEAT_MARGIN) / SEAT_STEP) + 1;
  const x0 = cx - ((nu - 1) * SEAT_STEP) / 2;
  const y0 = cy - ((nv - 1) * SEAT_STEP) / 2;
  for (let b = 0; b < nv; b++) {
    for (let a = 0; a < nu; a++) {
      const i = b * nu + a;
      const x = x0 + a * SEAT_STEP + (hash(i, 21) - 0.5) * SEAT_STEP * SEAT_JITTER;
      const y = y0 + b * SEAT_STEP + (hash(i, 22) - 0.5) * SEAT_STEP * SEAT_JITTER;
      if (!insideShape(x, y, cx, cy, SLOT_W, SLOT_H, SEAT_MARGIN)) continue;
      out.push({ x, y });
    }
  }
  return out;
};

const SLOT_SEATS: Pt[][] = SLOT_CXS.map((cx) => slotSeats(cx, SLOT_CY));

if (SLOT_SEATS.some((s) => s.length < SLOT_FILL + 6)) {
  throw new Error(
    `StillDecideWhatWeWant: a slot has ${Math.min(...SLOT_SEATS.map((s) => s.length))} seats, ` +
      `which leaves no vacancy for the mill`,
  );
}

// Blue-noise vacancies inside a full slot: the highest-hashed seat that has no
// empty neighbour yet, over and over, so every gap is a single hole with dots
// all around it rather than a patch of missing crowd.
const fullOccupancy = (seats: Pt[], slot: number): number[] => {
  const empty = new Uint8Array(seats.length);
  const want = seats.length - SLOT_FILL;
  const order = seats.map((_, i) => i).sort((a, b) => hash(b + slot * 97, 77) - hash(a + slot * 97, 77));
  const near = (a: number, b: number) =>
    Math.hypot(seats[a].x - seats[b].x, seats[a].y - seats[b].y) < 1.45 * SEAT_STEP;
  let dropped = 0;
  for (let pass = 0; pass < 2 && dropped < want; pass++) {
    for (const i of order) {
      if (dropped >= want) break;
      if (empty[i]) continue;
      if (pass === 0 && order.some((j) => empty[j] && near(i, j))) continue;
      empty[i] = 1;
      dropped++;
    }
  }
  return seats.map((_, i) => i).filter((i) => !empty[i]);
};

// Bottom seats first, with a hashed tiebreak: a slot fills the way a vessel
// does, and slot 4 ends part-full on its FRONT seats.
const byFront = (seats: Pt[], idx: number[]) =>
  [...idx].sort((a, b) => seats[b].y - seats[a].y + (hash(a, 33) - hash(b, 33)) * 9);

const SLOT_OCC: number[][] = SLOT_SEATS.map((s, i) => byFront(s, fullOccupancy(s, i)));

// ---------------------------------------------------------------------------
// The loose crowd: an organic blob, wide and shallow so it stays clear of the
// captions, feathered and undulating at its edge. Never a box.
// ---------------------------------------------------------------------------
const CROWD_CX = 540;
const CROWD_CY = 990;
const CROWD_RX = 230;
const CROWD_RY = 75;
// The blob's lattice comes in with its half-extents so the crowd keeps roughly
// the screen spacing it had: 23.5 world px at k 1.15 is 27 screen px, against
// 28 at k 1.04 before. It puts 84 dots in the blob, so slots 2 and 3 take 72 of
// them and 12 are left over to wait.
const BLOB_STEP = 23.5;
const BLOB_FEATHER = 1.6;

type Dot = { x0: number; y0: number; r: number; seed: number };

const CROWD: Dot[] = (() => {
  const out: Dot[] = [];
  const nx = Math.ceil((2 * CROWD_RX + 2 * BLOB_STEP) / BLOB_STEP);
  const ny = Math.ceil((2 * CROWD_RY + 2 * BLOB_STEP) / BLOB_STEP);
  for (let r = 0; r < ny; r++) {
    for (let c = 0; c < nx; c++) {
      const i = r * nx + c;
      const x = CROWD_CX - CROWD_RX - BLOB_STEP + c * BLOB_STEP + (hash(i, 11) - 0.5) * BLOB_STEP * 0.9;
      const y = CROWD_CY - CROWD_RY - BLOB_STEP + r * BLOB_STEP + (hash(i, 12) - 0.5) * BLOB_STEP * 0.9;
      const dx = (x - CROWD_CX) / CROWD_RX;
      const dy = (y - CROWD_CY) / CROWD_RY;
      const d = Math.hypot(dx, dy);
      const rEff = 1 + wobble(Math.atan2(dy, dx) * 100, 2.3) * 0.5 * (BLOB_STEP / CROWD_RX);
      const f = feather(((rEff - d) * CROWD_RX) / BLOB_STEP, BLOB_FEATHER);
      if (hash(i, 71) >= f) continue;
      out.push({ x0: x, y0: y, r: (0.75 + 0.5 * hash(i, 13)) * (0.7 + 0.3 * f), seed: i });
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// The wait cluster: where the dots the slots did not take gather, at the foot
// of the empty space slot 4 is not in yet. Same feathered blob language, small.
// ---------------------------------------------------------------------------
const WAIT_CX = SLOT_CXS[3];
const WAIT_CY = 950;
const WAIT_RX = 75;
const WAIT_RY = 45;
const WAIT_STEP = 18;

const WAIT_SEATS: Pt[] = (() => {
  const out: Pt[] = [];
  const nx = Math.ceil((2 * WAIT_RX + 2 * WAIT_STEP) / WAIT_STEP);
  const ny = Math.ceil((2 * WAIT_RY + 2 * WAIT_STEP) / WAIT_STEP);
  for (let r = 0; r < ny; r++) {
    for (let c = 0; c < nx; c++) {
      const i = r * nx + c;
      const x = WAIT_CX - WAIT_RX - WAIT_STEP + c * WAIT_STEP + (hash(i, 41) - 0.5) * WAIT_STEP * 0.8;
      const y = WAIT_CY - WAIT_RY - WAIT_STEP + r * WAIT_STEP + (hash(i, 42) - 0.5) * WAIT_STEP * 0.8;
      const dx = (x - WAIT_CX) / WAIT_RX;
      const dy = (y - WAIT_CY) / WAIT_RY;
      const d = Math.hypot(dx, dy);
      const rEff = 1 + wobble(Math.atan2(dy, dx) * 100, 3.1) * 0.5 * (WAIT_STEP / WAIT_RX);
      const f = feather(((rEff - d) * WAIT_RX) / WAIT_STEP, 1.2);
      if (hash(i, 73) >= f) continue;
      out.push({ x, y });
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// The cast. Dots 0..35 are the residents of slot 1 — the resolved state the
// previous cut ended on. The rest are the loose crowd.
// ---------------------------------------------------------------------------
const RESIDENT_N = SLOT_FILL;
const CROWD_N = CROWD.length;
const N = RESIDENT_N + CROWD_N;
const isCrowd = (i: number) => i >= RESIDENT_N;
const crowdIdx = (i: number) => i - RESIDENT_N;

// A resident's rest radius comes off the same hash family, so slot 1's crowd is
// made of the same material as the loose one.
const DOT_R: number[] = Array.from({ length: N }, (_, i) =>
  isCrowd(i) ? CROWD[crowdIdx(i)].r : 0.75 + 0.5 * hash(i, 13),
);

// ---------------------------------------------------------------------------
// Who fills slots 2 and 3. Greedy over every (dot, seat) pair by distance, so
// the assignment is the short one everywhere it can be. Whatever the two slots
// do not take is the wait — which is why the leftover is the crowd's right-hand
// side, the side nearest the empty space, and the drift is motivated.
// ---------------------------------------------------------------------------
const FILL_SLOTS = [1, 2];

const FILL: { slot: number; seat: number }[] = (() => {
  const out: { slot: number; seat: number }[] = Array.from({ length: CROWD_N }, () => ({
    slot: -1,
    seat: -1,
  }));
  const pairs: { d: number; i: number; slot: number; seat: number }[] = [];
  for (let i = 0; i < CROWD_N; i++) {
    for (const s of FILL_SLOTS) {
      for (const seat of SLOT_OCC[s]) {
        const p = SLOT_SEATS[s][seat];
        pairs.push({ d: Math.hypot(CROWD[i].x0 - p.x, CROWD[i].y0 - p.y), i, slot: s, seat });
      }
    }
  }
  pairs.sort((a, b) => a.d - b.d);
  const takenDot = new Uint8Array(CROWD_N);
  const takenSeat = SLOT_SEATS.map((s) => new Uint8Array(s.length));
  let done = 0;
  const want = FILL_SLOTS.length * SLOT_FILL;
  for (const p of pairs) {
    if (done === want) break;
    if (takenDot[p.i] || takenSeat[p.slot][p.seat]) continue;
    takenDot[p.i] = 1;
    takenSeat[p.slot][p.seat] = 1;
    out[p.i] = { slot: p.slot, seat: p.seat };
    done++;
  }
  return out;
})();

const WAITERS: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < CROWD_N; i++) if (FILL[i].slot < 0) out.push(RESIDENT_N + i);
  // left to right, so the cluster keeps the crowd's own order as it moves
  return out.sort((a, b) => CROWD[crowdIdx(a)].x0 - CROWD[crowdIdx(b)].x0);
})();

const WAIT_N = WAITERS.length;
if (WAIT_N < 10 || WAIT_N > 26 || WAIT_N > WAIT_SEATS.length || WAIT_N > SLOT_SEATS[3].length) {
  throw new Error(
    `StillDecideWhatWeWant: ${WAIT_N} waiters is outside the beat's range ` +
      `(${WAIT_SEATS.length} wait seats, ${SLOT_SEATS[3].length} slot-4 seats)`,
  );
}

// ---------------------------------------------------------------------------
// The three schedules: the fill, the drift to the wait, and the flood.
// ---------------------------------------------------------------------------
const SPEED_CAP_SCREEN = 45;
const K_MAX = 1.15; // this cut never pushes past its opening k
const SPEED_MAX = SPEED_CAP_SCREEN / K_MAX; // world px/frame

const FILL_F0 = 12; // "the AIs"
const FILL_WIN: Record<number, [number, number]> = { 1: [27, 39], 2: [32, 44] };

type Move = { t0: number; dur: number; arc: number; to: Pt };

const FILL_MOVE: (Move | null)[] = Array.from({ length: N }, () => null);
(() => {
  for (const s of FILL_SLOTS) {
    const order = SLOT_OCC[s]; // already front-first
    const [a0, a1] = FILL_WIN[s];
    order.forEach((seat, rank) => {
      const i = FILL.findIndex((f) => f.slot === s && f.seat === seat);
      if (i < 0) return;
      const dot = RESIDENT_N + i;
      const arrive = a0 + ((a1 - a0) * rank) / Math.max(1, order.length - 1);
      const to = SLOT_SEATS[s][seat];
      const dist = Math.hypot(CROWD[i].x0 - to.x, CROWD[i].y0 - to.y);
      const want = Math.max(11 + Math.floor(hash(dot, 42) * 5), Math.ceil(dist / SPEED_MAX));
      const t0 = Math.max(FILL_F0, arrive - want);
      FILL_MOVE[dot] = {
        t0,
        dur: arrive - t0,
        arc: (hash(dot, 32) - 0.5) * Math.min(46, dist * 0.3),
        to,
      };
    });
  }
})();

const DRIFT_F0 = 52; // "we'll"
const WAIT_SEAT_OF: Record<number, number> = {};
const DRIFT_MOVE: (Move | null)[] = Array.from({ length: N }, () => null);
(() => {
  // the cluster keeps its shape: left-to-right in the crowd becomes
  // left-to-right at the foot of the empty space
  // the innermost seats, so the cluster is a blob with its own feathered edge
  // rather than one side of the seat field
  const seats = [...WAIT_SEATS.keys()]
    .sort(
      (a, b) =>
        Math.hypot((WAIT_SEATS[a].x - WAIT_CX) / WAIT_RX, (WAIT_SEATS[a].y - WAIT_CY) / WAIT_RY) -
        Math.hypot((WAIT_SEATS[b].x - WAIT_CX) / WAIT_RX, (WAIT_SEATS[b].y - WAIT_CY) / WAIT_RY),
    )
    .slice(0, WAIT_N)
    .sort((a, b) => WAIT_SEATS[a].x - WAIT_SEATS[b].x);
  WAITERS.forEach((dot, rank) => {
    const seat = seats[rank];
    WAIT_SEAT_OF[dot] = seat;
    const to = WAIT_SEATS[seat];
    const from = CROWD[crowdIdx(dot)];
    const t0 = DRIFT_F0 + hash(dot, 51) * 6;
    const dist = Math.hypot(from.x0 - to.x, from.y0 - to.y);
    const dur = Math.max(20 + hash(dot, 52) * 6, dist / SPEED_MAX);
    DRIFT_MOVE[dot] = { t0, dur, arc: (hash(dot, 53) - 0.5) * 34, to };
  });
})();

const DRIFT_DONE = Math.max(
  ...WAITERS.map((d) => (DRIFT_MOVE[d] as Move).t0 + (DRIFT_MOVE[d] as Move).dur),
);

const FLOOD_F0 = 122; // "want"
const FLOOD_SEAT_OF: Record<number, number> = {};
const FLOOD_MOVE: (Move | null)[] = Array.from({ length: N }, () => null);
(() => {
  // the front seats of slot 4 first: it is the newest decision and the dots are
  // still arriving when the cut ends
  const seats = byFront(SLOT_SEATS[3], SLOT_OCC[3]).slice(0, WAIT_N);
  // the dot nearest each seat goes to it, so no two arcs cross the outline
  const order = [...WAITERS].sort(
    (a, b) => WAIT_SEATS[WAIT_SEAT_OF[a]].x - WAIT_SEATS[WAIT_SEAT_OF[b]].x,
  );
  seats.forEach((seat, rank) => {
    const dot = order[rank];
    FLOOD_SEAT_OF[dot] = seat;
    const to = SLOT_SEATS[3][seat];
    const t0 = FLOOD_F0 + (rank / Math.max(1, seats.length - 1)) * 5;
    const from = WAIT_SEATS[WAIT_SEAT_OF[dot]];
    const dist = Math.hypot(from.x - to.x, from.y - to.y);
    const dur = Math.max(11 + hash(dot, 62) * 4, dist / SPEED_MAX);
    FLOOD_MOVE[dot] = { t0, dur, arc: (hash(dot, 63) - 0.5) * 30, to };
  });
})();

const FLOOD_DONE = Math.max(
  ...WAITERS.map((d) => (FLOOD_MOVE[d] as Move).t0 + (FLOOD_MOVE[d] as Move).dur),
);

// ---------------------------------------------------------------------------
// LIVENESS 1a — the mill in the loose crowd. The blob has no vacant seat in it,
// so two neighbouring dots exchange places instead, passing on opposite arcs.
// One launch a frame, each 14 frames long. A dot stops taking part once its own
// departure is within reach.
// ---------------------------------------------------------------------------
const MILL_DUR = 14;
const MILL_RATE = 1.2;
const MILL_REACH = BLOB_STEP * 1.6;

type Swap = { t0: number; fx: number; fy: number; tx: number; ty: number; bow: number };

const LEAVE: number[] = Array.from({ length: N }, (_, i) => {
  if (!isCrowd(i)) return -1;
  const f = FILL_MOVE[i];
  if (f) return f.t0;
  return (DRIFT_MOVE[i] as Move).t0;
});

const MILLS: Swap[][] = Array.from({ length: N }, () => []);
(() => {
  const px = CROWD.map((d) => d.x0);
  const py = CROWD.map((d) => d.y0);
  const busy = new Float64Array(CROWD_N).fill(-1);
  const NB0: number[][] = CROWD.map((d) => {
    const out: number[] = [];
    for (let j = 0; j < CROWD_N; j++) {
      if (CROWD[j] === d) continue;
      if (Math.hypot(CROWD[j].x0 - d.x0, CROWD[j].y0 - d.y0) <= MILL_REACH) out.push(j);
    }
    return out;
  });
  const last = Math.max(...LEAVE);
  let acc = 0;
  let id = 0;
  for (let f = 0; f <= last; f++) {
    acc += MILL_RATE;
    while (acc >= 1) {
      acc -= 1;
      const j = id++;
      const free = (c: number) => busy[c] <= f && LEAVE[RESIDENT_N + c] > f + MILL_DUR + 1;
      const start = Math.floor(hash(j, 91) * CROWD_N);
      let a = -1;
      for (let n = 0; n < CROWD_N; n++) {
        const c = (start + n) % CROWD_N;
        if (!free(c)) continue;
        a = c;
        break;
      }
      if (a < 0) break;
      const cands = NB0[a].filter(free);
      if (cands.length === 0) continue;
      const b = cands[Math.floor(hash(j, 92) * cands.length) % cands.length];
      // the two partners swing around each other, never through each other
      const bow = (hash(j, 93) > 0.5 ? 1 : -1) * (7 + 7 * hash(j, 94));
      MILLS[RESIDENT_N + a].push({ t0: f, fx: px[a], fy: py[a], tx: px[b], ty: py[b], bow });
      MILLS[RESIDENT_N + b].push({ t0: f, fx: px[b], fy: py[b], tx: px[a], ty: py[a], bow: -bow });
      const sx = px[a];
      const sy = py[a];
      px[a] = px[b];
      py[a] = py[b];
      px[b] = sx;
      py[b] = sy;
      busy[a] = f + MILL_DUR;
      busy[b] = f + MILL_DUR;
    }
  }
})();

/** Where dot i is standing in the loose crowd at frame f, mill included.
 *  `u` is -1 when it is not mid-swap. Pure. */
const millPos = (i: number, f: number) => {
  let x = CROWD[crowdIdx(i)].x0;
  let y = CROWD[crowdIdx(i)].y0;
  for (const m of MILLS[i]) {
    if (f >= m.t0 + MILL_DUR) {
      x = m.tx;
      y = m.ty;
      continue;
    }
    if (f < m.t0) break;
    const u = clamp01((f - m.t0) / MILL_DUR);
    const e = arriveEase(u);
    const dx = m.tx - m.fx;
    const dy = m.ty - m.fy;
    const L = Math.hypot(dx, dy) || 1;
    const bow = Math.sin(Math.PI * e) * m.bow;
    return { x: m.fx + dx * e + (-dy / L) * bow, y: m.fy + dy * e + (dx / L) * bow, u };
  }
  return { x, y, u: -1 };
};

// ---------------------------------------------------------------------------
// LIVENESS 1b — the mill inside a seat group. Every group of seats a dot can be
// standing in (the four slots and the wait cluster) runs the same one-hop-to-a-
// vacant-neighbour mill on its own occupancy map, from the frame it is complete
// to the frame its dots leave it. It never stops.
// ---------------------------------------------------------------------------
const GRP_SLOT = [0, 1, 2, 3]; // group index === slot index for the four slots
const GRP_WAIT = 4;
const HOP_DUR = 14;

type Grp = { seats: Pt[]; f0: number; f1: number; rate: number };

const GROUPS: Grp[] = [
  { seats: SLOT_SEATS[0], f0: 0, f1: DURATION, rate: 0.3 },
  { seats: SLOT_SEATS[1], f0: FILL_WIN[1][1] + 1, f1: DURATION, rate: 0.3 },
  { seats: SLOT_SEATS[2], f0: FILL_WIN[2][1] + 1, f1: DURATION, rate: 0.3 },
  { seats: SLOT_SEATS[3], f0: Math.ceil(FLOOD_DONE) + 1, f1: DURATION, rate: 0.3 },
  // the wait cluster is what the eye is on through the held breath, so it mills
  // at double the rate — and it stops early enough that no hop is still in the
  // air when the flood launches at f122
  { seats: WAIT_SEATS, f0: Math.ceil(DRIFT_DONE) + 1, f1: FLOOD_F0 - HOP_DUR - 2, rate: 0.6 },
];

type Hop = { grp: number; from: number; to: number; t0: number; dur: number };

/** The seat a dot is standing on when it ENTERS a group, and the frame it does. */
const ENTRY: { grp: number; seat: number; f: number }[][] = Array.from({ length: N }, () => []);
for (let i = 0; i < RESIDENT_N; i++) ENTRY[i].push({ grp: 0, seat: SLOT_OCC[0][i], f: 0 });
for (let c = 0; c < CROWD_N; c++) {
  const dot = RESIDENT_N + c;
  const f = FILL[c];
  if (f.slot >= 0) {
    const m = FILL_MOVE[dot] as Move;
    ENTRY[dot].push({ grp: GRP_SLOT[f.slot], seat: f.seat, f: m.t0 + m.dur });
  }
}
for (const dot of WAITERS) {
  const d = DRIFT_MOVE[dot] as Move;
  ENTRY[dot].push({ grp: GRP_WAIT, seat: WAIT_SEAT_OF[dot], f: d.t0 + d.dur });
  const fl = FLOOD_MOVE[dot] as Move;
  ENTRY[dot].push({ grp: GRP_SLOT[3], seat: FLOOD_SEAT_OF[dot], f: fl.t0 + fl.dur });
}

/** The frame a dot LEAVES a group it entered (Infinity if it never does). */
const EXIT_F = (dot: number, grp: number) =>
  grp === GRP_WAIT ? (FLOOD_MOVE[dot] as Move).t0 : Infinity;

const HOPS: Hop[][] = Array.from({ length: N }, () => []);
(() => {
  const NB: number[][][] = GROUPS.map((g) =>
    g.seats.map((s, a) =>
      g.seats
        .map((t, b) => ({ b, d: Math.hypot(s.x - t.x, s.y - t.y) }))
        .filter((t) => t.b !== a && t.d <= (g === GROUPS[GRP_WAIT] ? WAIT_STEP : SEAT_STEP) * 1.45)
        .map((t) => t.b),
    ),
  );
  const occ: Int32Array[] = GROUPS.map((g) => new Int32Array(g.seats.length).fill(-1));
  const seatNow = new Int32Array(N).fill(-1);
  const grpNow = new Int32Array(N).fill(-1);
  const busy = new Float64Array(N).fill(-1);
  const acc = GROUPS.map(() => 0);
  const hopId = { n: 0 };

  for (let f = 0; f <= DURATION; f++) {
    // arrivals and departures first, so a group's occupancy is right this frame
    for (let i = 0; i < N; i++) {
      if (grpNow[i] >= 0 && f >= EXIT_F(i, grpNow[i])) {
        occ[grpNow[i]][seatNow[i]] = -1;
        grpNow[i] = -1;
        seatNow[i] = -1;
      }
      for (const e of ENTRY[i]) {
        if (Math.ceil(e.f) !== f) continue;
        grpNow[i] = e.grp;
        seatNow[i] = e.seat;
        occ[e.grp][e.seat] = i;
      }
    }

    GROUPS.forEach((g, gi) => {
      if (f < g.f0 || f > g.f1) return;
      acc[gi] += g.rate;
      while (acc[gi] >= 1) {
        acc[gi] -= 1;
        const j = hopId.n++;
        const seats = g.seats;
        const start = Math.floor(hash(j, 51) * seats.length);
        let picked = -1;
        for (let n = 0; n < seats.length; n++) {
          const s = (start + n) % seats.length;
          const dot = occ[gi][s];
          if (dot < 0 || busy[dot] > f) continue;
          if (f + HOP_DUR >= EXIT_F(dot, gi)) continue;
          const vac = NB[gi][s].filter((t) => occ[gi][t] < 0);
          if (vac.length === 0) continue;
          const to = vac[Math.floor(hash(j, 52) * vac.length) % vac.length];
          occ[gi][s] = -1;
          occ[gi][to] = dot;
          seatNow[dot] = to;
          busy[dot] = f + HOP_DUR;
          HOPS[dot].push({ grp: gi, from: s, to, t0: f, dur: HOP_DUR });
          picked = dot;
          break;
        }
        if (picked < 0) break;
      }
    });
  }
})();

/** Where dot i is inside group `grp`, having entered it on `seat`. */
const groupPos = (i: number, grp: number, seat: number, f: number) => {
  const seats = GROUPS[grp].seats;
  let cur = seat;
  let live: Hop | null = null;
  for (const h of HOPS[i]) {
    if (h.grp !== grp) continue;
    if (f >= h.t0 + h.dur) cur = h.to;
    else if (f >= h.t0) {
      live = h;
      break;
    } else break;
  }
  if (!live) return { x: seats[cur].x, y: seats[cur].y, moving: 0 };
  const u = clamp01((f - live.t0) / live.dur);
  const e = arriveEase(u);
  const A = seats[live.from];
  const B = seats[live.to];
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const L = Math.hypot(dx, dy) || 1;
  const bow = Math.sin(Math.PI * e) * (hash(i, 61) - 0.5) * 8;
  return {
    x: A.x + dx * e + (-dy / L) * bow,
    y: A.y + dy * e + (dx / L) * bow,
    moving: clamp01(Math.min(u, 1 - u) / 0.2),
  };
};

// ---------------------------------------------------------------------------
// The camera. Seven moves through one damped runCamera, each a warped
// smoothstep keyed per frame, with a straight-ramp hold drift continuing the
// last move after every landing so nothing is parked — and exactly one dead
// still stretch, the held breath as the picture waits for a person to act.
// `cy` comes off the eased k, so framing and zoom settle together; `cx` is the
// sideways half, on its own key track, because the row of four is 840 world px
// wide and "creep toward slot 4" can only be a pan.
//
// SCALE PASS. Every key below is the same move it was, scaled to the bigger
// picture: the whole zoom track is multiplied by 1.15 / 1.04 so a landing frame
// keeps its landing and its relative weight, and the content-centre track comes
// down a flat 64 world px because the layout itself moved up by that much
// (people 500 -> 470, the row 830 -> 800, the crowd 1075 -> 990). The pan is the
// one thing that could NOT be scaled: the row is 966 screen px at k 1.15, so a
// 48 world px creep would carry its left edge to screen x 2. It is bounded to
// ~22 world px, which is the ~25 screen px the row has to give, and stays a
// creep rather than a stall at ~0.65 screen px/frame across f54-91.
//
//   f0-14     c 764 -> 771                 the standing scene, already creeping
//   f14-40    k 1.150 -> 1.073, c -> 786   the pull-back riding the fill,
//                                          landing two frames before "work"
//   f40-54    c -> 802                     hold drift, ~1.2 screen px/frame
//   f54-91    cx 540 -> 562, k -> 1.095,
//             c -> 808                     the long even creep (warp 1.0) to
//                                          the empty space, landing on "that"
//   f91-98    DEAD STILL                   the held breath
//   f98-120   cx -> 564, k -> 1.081,
//             c -> 820                     the loose pen-follow, settling as
//                                          the outline closes
//   f120-133  c -> 832, cx -> 565          hold drift under the flood
//   f133-149  k -> 1.056, cx -> 554,
//             c -> 822                     the tail pull-back on the four
//
// Bounds. Measured on the white ink and orange dots of every one of the 149
// rendered frames, not argued from the keys: screen x 54..979 and screen y
// 410..1175, against the 20..1060 and 1250 the captions and the frame allow.
// The lowest pixel is the loose crowd's bottom edge at f0; the leftmost is slot
// 1's outline at f5, where the camera is still at its resting k.
const K_REST = 1.15;
const K_FILLED = 1.0726;
const K_CREEP = 1.0947;
const K_PEN = 1.0814;
const K_TAIL = 1.056;

const CAM_SEGS = [
  camMove({ f0: 0, f1: 14, k0: K_REST, k1: K_REST, c0: 764, c1: CONTENT_C, warp: 1 }),
  camMove({ f0: 14, f1: 40, k0: K_REST, k1: K_FILLED, c0: CONTENT_C, c1: 786, warp: 0.75 }),
  camMove({ f0: 40, f1: 54, k0: K_FILLED, k1: K_FILLED, c0: 786, c1: 802, warp: 1 }),
  camMove({ f0: 54, f1: 91, k0: K_FILLED, k1: K_CREEP, c0: 802, c1: 808, warp: 1 }),
  camMove({ f0: 98, f1: 120, k0: K_CREEP, k1: K_PEN, c0: 808, c1: 820, warp: 0.85 }),
  camMove({ f0: 120, f1: 133, k0: K_PEN, k1: K_PEN, c0: 820, c1: 832, warp: 1 }),
  camMove({ f0: 133, f1: DURATION, k0: K_PEN, k1: K_TAIL, c0: 832, c1: 822, warp: 0.8 }),
];

// the sideways half of the camera, on the same key-per-frame track
const CAM_CX_F = [0, 54, 91, 98, 120, 133, DURATION];
const CAM_CX_V = [CX, CX, 561.7, 561.7, 564.4, 565.3, 553.6];

const CAM = (() => {
  const F = [0];
  const K = [K_REST];
  const CY = [764 + CAM_LIFT / K_REST];
  for (const m of CAM_SEGS) {
    for (let i = 0; i < m.F.length; i++) {
      if (m.F[i] <= F[F.length - 1]) continue;
      F.push(m.F[i]);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    }
  }
  return { F, K, CY };
})();

const OPEN_DUR = 12; // the loose crowd settles the last of its spread in

// LIVENESS 3 — the pen pushes the crowd aside.
const PUSH_R = 70;
const PUSH_AMT = 25;
const PUSH_BACK = 20;

// The draw. The stroke leaves glyph 5 head-led and reaches the top-centre of
// the space where slot 4 will be, then draws the outline clockwise.
const STEM_F0 = 100; // "decide"
const STEM_F1 = 108; // "what"
const RING_F1 = 120; // two frames before "want"
const STEM_X0 = PEOPLE[DRAWER].x;
const STEM_Y0 = PEOPLE_Y + GLYPH / 2 - 4;
const STEM_X1 = SLOT_CXS[3];
const STEM_Y1 = SLOT_CY - SLOT_H / 2;

// LIVENESS 4 — one packet laps the closed outline as the flood starts.
const LAP_DUR = 24;

// LIVENESS 2 — dark traffic between neighbouring dots, at the house rate.
const TRAFFIC_N = idleThreads(N);
const TRAFFIC_REACH = 62; // with the crowd: 62 world px at k 1.15 is the 75 screen px it was

// LIVENESS 1 — the micro-drift. Two hashed sines per axis, +-3 world px in
// total and never two dots in phase.
const micro = (i: number, f: number) => ({
  dx: 1.8 * Math.sin(f * 0.2417 + hash(i, 17) * 6.283) + 1.2 * Math.sin(f * 0.1533 + hash(i, 19) * 6.283),
  dy: 1.7 * Math.sin(f * 0.2094 + hash(i, 18) * 6.283) + 1.3 * Math.sin(f * 0.1396 + hash(i, 20) * 6.283),
});

const StillDecideWhatWeWant: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  dotRadius,
  dotUnread,
  beats,
}) => {
  const frame = useCurrentFrame();
  const tone = makeTone(accentDeep, accent);

  // -- the pen ---------------------------------------------------------------
  const stemAt = (f: number) =>
    interpolate(f, [beats.decide, STEM_F1], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ringAt = (f: number) => arriveEase(clamp01((f - STEM_F1) / (RING_F1 - STEM_F1)), 0.2);
  const stem = stemAt(frame);
  const ringDraw = frame < STEM_F1 ? 0 : ringAt(frame);
  const penAt = (f: number) => {
    if (f < beats.decide) return null;
    if (f < STEM_F1) {
      const s = stemAt(f);
      return { x: STEM_X0 + (STEM_X1 - STEM_X0) * s, y: STEM_Y0 + (STEM_Y1 - STEM_Y0) * s };
    }
    if (f > RING_F1) return null;
    return pointAt(SEGS4, ringAt(f));
  };
  const head = penAt(frame);

  // -- the pen's wake --------------------------------------------------------
  const penTrack: { x: number; y: number; lag: number }[] = [];
  for (let lag = 0; lag <= PUSH_BACK; lag++) {
    const p = penAt(frame - lag);
    if (p) penTrack.push({ x: p.x, y: p.y, lag });
  }
  const penPush = (x: number, y: number) => {
    let best = 0;
    let bx = 0;
    let by = 0;
    for (const p of penTrack) {
      const dx = x - p.x;
      const dy = y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > PUSH_R) continue;
      const amp = PUSH_AMT * smoothstep(1 - d / PUSH_R) * (1 - smoothstep(p.lag / PUSH_BACK));
      if (amp <= best) continue;
      best = amp;
      bx = (dx / d) * amp;
      by = (dy / d) * amp;
    }
    return { x: bx, y: by };
  };

  // -- the crowd -------------------------------------------------------------
  // The scene is already standing at f0 — nothing fades up out of nothing.
  const settleAt = (f: number) => 1 - smoothstep(f / OPEN_DUR);
  const looseAt = (i: number, f: number) => {
    const m = millPos(i, f);
    const s = 1 + settleAt(f) * 0.035;
    return {
      x: CROWD_CX + (m.x - CROWD_CX) * s,
      y: CROWD_CY + (m.y - CROWD_CY) * s,
      u: m.u,
    };
  };

  /** One arc: out of where the dot is standing, into a seat. */
  const arc = (from: Pt, m: Move, f: number) => {
    const lin = clamp01((f - m.t0) / m.dur);
    const e = arriveEase(lin);
    const dx = m.to.x - from.x;
    const dy = m.to.y - from.y;
    const L = Math.hypot(dx, dy) || 1;
    const bow = Math.sin(Math.PI * e) * m.arc;
    return {
      x: from.x + dx * e + (-dy / L) * bow,
      y: from.y + dy * e + (dx / L) * bow,
      t: smoothstep(lin / 0.8),
      moving: clamp01(Math.min(lin, 1 - lin) / 0.16),
    };
  };

  const dots = Array.from({ length: N }, (_, i) => {
    let x = 0;
    let y = 0;
    let t = 0;
    let moving = 0;

    if (!isCrowd(i)) {
      const p = groupPos(i, 0, SLOT_OCC[0][i], frame);
      x = p.x;
      y = p.y;
      moving = p.moving;
      t = 1;
    } else {
      const fm = FILL_MOVE[i];
      if (fm) {
        if (frame < fm.t0) {
          const r = looseAt(i, frame);
          x = r.x;
          y = r.y;
          if (r.u >= 0) {
            moving = clamp01(Math.min(r.u, 1 - r.u) / 0.2) * 0.55;
            t = 0.15 * Math.sin(Math.PI * r.u);
          }
        } else if (frame < fm.t0 + fm.dur) {
          const r = looseAt(i, fm.t0);
          const a = arc(r, fm, frame);
          x = a.x;
          y = a.y;
          t = a.t;
          moving = a.moving;
        } else {
          const e = ENTRY[i][0];
          const p = groupPos(i, e.grp, e.seat, frame);
          x = p.x;
          y = p.y;
          moving = p.moving;
          t = 1;
        }
      } else {
        const dm = DRIFT_MOVE[i] as Move;
        const fl = FLOOD_MOVE[i] as Move;
        if (frame < dm.t0) {
          const r = looseAt(i, frame);
          x = r.x;
          y = r.y;
          if (r.u >= 0) {
            moving = clamp01(Math.min(r.u, 1 - r.u) / 0.2) * 0.55;
            t = 0.15 * Math.sin(Math.PI * r.u);
          }
        } else if (frame < dm.t0 + dm.dur) {
          const r = looseAt(i, dm.t0);
          const a = arc(r, dm, frame);
          x = a.x;
          y = a.y;
          // the wait is not a seat: a drifting dot stays deep
          moving = a.moving;
        } else if (frame < fl.t0) {
          const p = groupPos(i, GRP_WAIT, WAIT_SEAT_OF[i], frame);
          x = p.x;
          y = p.y;
          moving = p.moving;
        } else if (frame < fl.t0 + fl.dur) {
          const p = groupPos(i, GRP_WAIT, WAIT_SEAT_OF[i], fl.t0);
          const a = arc(p, fl, frame);
          x = a.x;
          y = a.y;
          t = a.t;
          moving = a.moving;
        } else {
          const p = groupPos(i, GRP_SLOT[3], FLOOD_SEAT_OF[i], frame);
          x = p.x;
          y = p.y;
          moving = p.moving;
          t = 1;
        }
      }
    }

    // the pen is physical: a dot near it is shoved out of the way
    const push = penPush(x, y);
    const md = micro(i, frame);
    return {
      x: x + push.x + md.dx,
      y: y + push.y + md.dy,
      t,
      moving,
      r: DOT_R[i],
    };
  });

  // -- dark traffic ----------------------------------------------------------
  // Idle accent threads between neighbouring dots, no heads, at 0.12. A thread
  // only ever joins two dots that are near each other right now, so it runs
  // across the loose crowd, inside a slot, and in the wait cluster without
  // being told which is which. Thinning to half across the tail.
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number };
  const trafficN = Math.round(TRAFFIC_N * interpolate(frame, [beats.end, DURATION], [1, 0.5], clamp));
  const traffic: Th[] = [];
  for (let j = 0; j < trafficN; j++) {
    const period = 40 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * N);
    const A = dots[a];
    let b = -1;
    for (let n = 0; n < 12; n++) {
      const cnd = Math.floor(hash(seed + n * 17, 8) * N);
      if (cnd === a) continue;
      if (Math.hypot(dots[cnd].x - A.x, dots[cnd].y - A.y) <= TRAFFIC_REACH) {
        b = cnd;
        break;
      }
    }
    if (b < 0) continue;
    const B = dots[b];
    const dn = arriveEase(clamp01(phase / 0.35));
    const fade = interpolate(phase, [0.6, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    traffic.push({
      key: `d${j}`,
      x1: A.x,
      y1: A.y,
      x2: A.x + (B.x - A.x) * dn,
      y2: A.y + (B.y - A.y) * dn,
      op: DARK_TRAFFIC_OPACITY * fade,
    });
  }

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = interpolate(frame, CAM_CX_F, CAM_CX_V, clamp) + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // the packet that laps the closed outline once, from "want"
  const lapAt = (f: number) => {
    if (f < beats.want || f > beats.want + LAP_DUR) return null;
    return pointAt(SEGS4, (f - beats.want) / LAP_DUR);
  };

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM.CY[0]}
        cx={cx}
        cxRest={CX}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* dark traffic: the crowd is unlooked-at, not dead. No heads. */}
            {traffic.map((t) => (
              <line
                key={t.key}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={accent}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={t.op}
              />
            ))}

            {/* the decisions: the four outlines, each with the thin ink
                provenance line up to the person who drew it. Slots 1-3 are
                standing when the cut opens; slot 4 is drawn on "decide". */}
            <g style={{ filter: icon }}>
              {SLOT_CXS.map((sx, s) => {
                const prov = s < 3 ? 1 : stem;
                if (prov <= 0) return null;
                const p = PEOPLE[SLOT_GLYPH[s]];
                const live = s === 3 && ringDraw < 1;
                return (
                  <line
                    key={`p${s}`}
                    x1={p.x}
                    y1={STEM_Y0}
                    x2={p.x + (sx - p.x) * prov}
                    y2={STEM_Y0 + (STEM_Y1 - STEM_Y0) * prov}
                    stroke={ink}
                    strokeWidth={3}
                    strokeLinecap="round"
                    opacity={live ? OP_READ : OP_UNREAD}
                  />
                );
              })}
              {SLOT_CXS.map((sx, s) => {
                const drawn = s < 3 ? 1 : ringDraw;
                if (drawn <= 0) return null;
                return (
                  <path
                    key={`s${s}`}
                    d={shapePath(sx, SLOT_CY, SLOT_W, SLOT_H)}
                    fill="none"
                    stroke={ink}
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeDasharray={PERIM4}
                    strokeDashoffset={PERIM4 * (1 - drawn)}
                    opacity={OP_READ}
                  />
                );
              })}
            </g>

            {/* the assistants */}
            {dots.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={dotRadius * d.r * breath(frame, hash(i, 9)) * (1 + 0.22 * d.moving)}
                fill={tone(d.t)}
                opacity={dotUnread}
              />
            ))}

            {/* the drawing head, in screen px so it is the same size at any k,
                with the set's motion streak behind it */}
            {head ? (
              <g style={{ filter: icon }}>
                <circle cx={head.x} cy={head.y} r={4.5 / k} fill={ink} />
              </g>
            ) : null}

            {/* one lap of the closed outline, on "want" */}
            <Packet frame={frame} k={k} at={lapAt} opacity={0.9} />
          </svg>

          {/* the people. Pure white, with the small shadow that makes a glyph
              read as a thing lying on the field. Each one sways on its own
              hashed sines; the one that draws lifts before it acts. */}
          {PEOPLE.map((p, i) => {
            const sx = (1.5 / k) * Math.sin(frame * 0.083 + hash(i, 81) * 6.283);
            const sy = (1.2 / k) * Math.sin(frame * 0.061 + hash(i, 82) * 6.283);
            const lift =
              i !== DRAWER || frame < STEM_F0 - WAKE_LEAD || frame >= STEM_F0 + 6
                ? 0
                : frame < STEM_F0
                  ? 3 * smoothstep((frame - (STEM_F0 - WAKE_LEAD)) / WAKE_LEAD)
                  : 3 * (1 - smoothstep((frame - STEM_F0) / 6));
            return (
              <Img
                key={i}
                src={staticFile("person.png")}
                style={{
                  position: "absolute",
                  left: p.x - GLYPH / 2 + sx,
                  top: p.y - GLYPH / 2 + sy - lift / k,
                  width: GLYPH,
                  height: GLYPH,
                  filter: `brightness(0) invert(1) ${icon}`,
                  opacity: OP_READ,
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default StillDecideWhatWeWant;
