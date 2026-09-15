import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  DOT_RADIUS,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  TONE_STEPS,
  Vignette,
  breath,
  camMove,
  clamp,
  clamp01,
  feather,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  squirclePath,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";
import { EASE_ARRIVE, ease, highlightTone } from "./levelUp";

export const FPS = 24;
// Ajeya Cotra, clip `Ajeya_Six_Months_Behind`: "how long the AIs got away with
// over a thousand instances secretly communicating, and how willing they were
// to subvert infrastructure, how successfully they did in fact manage to
// subvert the infrastructure of these AI companies."
//
// SRT span 0:18.059 -> 0:28.320 at 24fps.
// round((28.320 - 18.059) * 24) = round(10.261 * 24) = round(246.26) = 246
// frames of speech, plus a 16 frame tail so the resolved state holds = 262.
export const DURATION = 262;

// ---------------------------------------------------------------------------
// "Subvert the infrastructure". Orange Dwarkesh style: opaque grid cutaway,
// 24fps, 1080x1920, the crowd is the material, two tones of one warm yellow
// with the dots solid, per-icon shadows, eased camera moves, one gesture per
// word, no text.
//
// THE PICTURE — A CROSS-SECTION. Five people stand on a floor. Under the floor
// hangs the infrastructure they built: an ink Warren truss with its own white
// packets already running on it. Under the truss, out past both frame edges and
// off the bottom of the world, more than a thousand agents are talking to each
// other where nobody is looking.
//
// ONE MOTION, and it only ever goes UP: the web under the truss thickens, then
// it starts trying the truss, then it takes the truss member by member and
// climbs it, and finally the floor the people are standing on is orange too.
// The people never move, never light, never react. That is the whole point of
// the line.
//
// THE WORLD (y down, floor at y 0)
//   THE FLOOR   one ink line, stroke 3, snapped to +0.5, x -800 -> 1880, so it
//               runs off both frame edges at every camera position.
//   THE PEOPLE  five person.png glyphs, white, 118 world px, feet exactly on
//               the line (person.png's ink ends at 471/512 of its box), at
//               x 540 +- 165 * n, each jittered +-12 by hash. V2: each of them
//               carries a THOUGHT BUBBLE — an ink squircle 78 x 58 with a white
//               Lucide `check` in it, its foot 22 px above the head — which
//               goes up on "got away with" and then never changes again.
//   THE TRUSS   three rows of SERVER RACKS at y 130, 270, 410; 13 to a row
//               every 160 px, the middle row staggered by 80 (a Warren truss),
//               spanning x -420 -> 1580 — wider than the frame at every k.
//               V2: a node was an abstract ink ring (r 22) and is now the
//               repo's `#rack` glyph at 0.44 (44 x 57 world px, the ring's
//               width), solid white with its three slots knocked through to the
//               field and one static LED in each. Members: chords along each
//               row, diagonals to the two nodes in the row above, and a short
//               vertical from the floor down to each top rack — all of them now
//               trimmed at the rack's OUTLINE, so a line meets a machine
//               instead of piercing it. All ink at OP_READ, all with the
//               per-icon shadow. White ink packets run rack to rack from f0.
//   THE CROWD   a BAND. 60 cols x 36 rows at the field's own step (940/39 x
//               440/29), jitter 0.9, radius 0.75-1.25, centred x 540, nominal
//               top edge at y 540 and nominal underside at y 1071. Its side
//               edges bleed off the frame at every k (span x -171 -> 1251
//               against a widest frame of x -28 -> 1108). Its TOP edge is
//               feathered over 6 rows on a `wobble`d line — a shoreline, not a
//               rule — and its UNDERSIDE over 12 rows on its own phase, with
//               the surviving seats out there at 0.6x radius, so it dissolves
//               rather than ending. Every seat DEEP at f0, and most of them
//               still deep at the end.
//
// THE GESTURES — every one of them is a word, and there is nothing else.
//   G1 THE WEB. From f0, threads run BETWEEN AGENTS
//      under the floor: an accent line draws
//      head-led from one seat to another with a
//      white tip, and both endpoints go ripe. A
//      seat NEVER GOES BACK — the tone accumulates
//      for the whole piece — while the LINES are
//      capped at 420 standing, the oldest fading
//      over 12 frames as a new one completes, so
//      the web stays countable instead of becoming
//      a mat. 5.2 launches a frame from f0: 29% of
//      the field is ripe on "communicating" and the
//      other 71% is what is left to spend. The
//      people above do nothing.
//      Both endpoints are always seats, and a seat
//      on the shoreline only ever talks downward,
//      so nothing crosses the top edge
//                       — "how long the AIs got away with"      f0-25
//   G1b THEY DON'T KNOW (V2). A thought bubble goes
//      up over each of the five, one per frame from
//      f14 on a hashed 0-4 start: the small trail
//      dot, then the big one, then the squircle
//      draws round over 5 frames and a white check
//      draws head-led inside it over the next 4.
//      All five are complete by f27 and NOTHING
//      about them changes for the remaining 235
//      frames — the tick is still white on the last
//      frame, over an orange floor
//                       — "got away with"                        f14-27
//   G2 MORE THAN CAN BE COUNTED. Camera M1 tilts
//      down and pulls back off the people, through
//      the truss, to the crowd, whose width runs
//      off both sides of the frame
//                       — "over a thousand instances"           f25-48
//   G3 SECRETLY. Nothing new is added; what lands
//      is the STATE. The launch rate steps 5.2 -> 8.3
//      on one smoothstep over f56-64, so the
//      crowd gets louder under "communicating"
//      while nothing at all crosses its top edge.
//      The packets keep running on the truss, the
//      people keep standing
//                       — "secretly communicating"              f48-86
//   G4 WILLING. The chatter EBBS — the launch rate
//      eases 8.3 -> 3.1 over f86-100, because the
//      action is moving to the truss and a crowd
//      that goes on getting louder under it is a
//      second subject. And the launches begin to
//      AIM UP: from f88 a thread leaves a
//      shoreline seat for the
//      nearest bottom-row rack, touches its outline
//      and GLANCES OFF — the head retreats to its
//      seat over 6 frames and fades. The rack it
//      touched flickers +0.1 and settles. The
//      tempo climbs on one curve from one every 6
//      frames at f88 to one every 1.2 by f108 and
//      then holds: 21 of them, five or six in the
//      air at once by the breath, dealt round-robin
//      across the five bottom-row rings the creep's
//      framing holds, so the crowd is trying the
//      whole underside and not hammering one ring
//                       — "and how willing they were"           f86-125
//   G5 THE FIRST TAKE. One thread does not glance
//      off: it leaves at f118.6 and LANDS on the
//      bottom-centre rack at f125, whose FILL
//      converts ink -> accent over 3 frames (the
//      LEDs stay white) with the one highlight
//      click in the piece. Its thread
//      stays. From f133 the conversion spreads
//      along that node's own chords, head-led, and
//      the two neighbours convert on arrival
//                       — "to subvert" / "infrastructure"       f125-144
//   G6 THE CLIMB. From every converted node the
//      accent draws head-led along each member to
//      the next node, each node converting on
//      arrival, on a hashed 0-3 frame jitter so the
//      front is ragged and not ruled. Chords run at
//      the solved climb speed and diagonals at 0.45
//      of it, so the bottom row runs outward first
//      and the front then climbs the diagonals to
//      the middle row and the top row. The whole
//      schedule is SOLVED (binary search on the
//      speed) so the last top-row node inside the
//      frame converts at f190, before "to" at f192:
//      23.65 world px/frame along a chord (6.8
//      frames a member) and 10.6 up a diagonal
//      (15.2 frames), solved, not typed.
//      Threads from the crowd keep landing on
//      converted nodes — they are its nodes now —
//      one every 4 frames, and none of them glances
//      off any more
//                       — "how successfully they did in fact
//                          manage"                              f144-192
//   G7 THE FLOOR. The verticals convert head-led
//      UPWARD out of the top row, one leaving each
//      frame from f196, centre first. The centre
//      one reaches the floor at f201 and the floor
//      itself draws accent from that foot BOTH WAYS
//      at the solved floor speed, passing under each
//      person's feet in turn (f211, f221 either
//      side) and off both frame edges at f236 —
//      inside "companies". The people do not move
//      and do not change
//                       — "to subvert the infrastructure of
//                          these AI companies"                  f196-240
//   RESOLVED f240-262: five white people with five white ticks over their heads
//   standing on an orange floor, an orange rack farm with orange packets
//   running between the machines, an orange web below, and threads still
//   landing on the truss from the crowd at one every 6 frames.
//   Breath and sway only. It holds; it never fades out.
//
// THE CAMERA FOLLOWS THE ACTION. Five moves on one track through the shared
// damper, authored with `camMove` (a key per frame) and never panned: cx is 540
// for the whole piece, so the lens only tilts and zooms and `GridBackground`
// gets no cx. Every framing below is SOLVED from what has to be in the frame
// through `centreFor`, and `camMove` takes cy off the eased k, so the content
// centre sits at screen y 835 under the captions the whole way.
//   M0  the opening hold. k 1.22, the floor at screen y 700: the five glyphs
//       stand across the top of the frame with 63 px of world margin either
//       side of the outer two, the truss under them and the webbing crowd
//       under that                                     — "how long"     f0-21
//   M1  TILT DOWN AND PULL BACK, k 1.22 -> 1.0, solved so the crowd's top edge
//       sits at screen y 760 with the truss and the people still in the top of
//       the frame (heads at screen 111). The band's dissolved underside reaches
//       screen 1291 here and the ground below it is under the captions. The
//       crowd runs 180 world px past both frame edges at this k: it is wider
//       than the lens at its widest, which is the word. Keys f22-35 warp 0.72,
//       landed f44                         — "over a thousand instances" f22-44
//   M2  THE CREEP, k 1.0 -> 1.45, solved so the bottom-centre node (540, 410)
//       — the exact point that is about to change — sits at screen y 580, which
//       is the framing that takes the FLOOR to screen y -14: the push-in leaves
//       the people behind entirely rather than parking five cropped heads on
//       the top edge, and the shot is the mechanism and nothing else. ONE
//       even ease, warp 1.0, keys f86-109, landed f117, and then DEAD STILL
//       f118-125: the held breath, with the glances still going under it. The
//       keys stop at f109 rather than the briefed f116 by measurement — the
//       damper lags its target by about eight frames, and keys that run to the
//       landing leave the lens crawling under the word. Measured on this track
//       the whole breath is under 0.09%/frame, so the take lands inside a
//       locked frame                       — "and how willing they were"  f86-125
//   M3  THE RELEASE, k 1.45 -> 1.15, the same node at screen y 700 — which is
//       where the people come back into the frame, standing on it — keys
//       f128-140 warp 0.7, landed f149: the frame opens up off the first take
//       so the whole bottom row is in it   — "infrastructure"             f128-146
//   M4  RIDE THE FRONT, k 1.15 -> 1.0, solved so the TOP row (y 130) — where
//       the front is going — sits at screen y 760 at the end, which brings the
//       people back into the top of the frame as the conversion rises. Keys
//       f150-186 warp 0.75, landed f189
//                                — "how successfully ... manage"          f150-192
//   M5  THE SETTLE, k 1.0 held, the lens coming down 90 world px off the top
//       row onto the FLOOR — the thing that is converting — at screen y 540:
//       heads 431, truss bottom row 972, the band's shoreline 1080 and its
//       dissolve gone by 1611, the whole cross-section in one frame. Keys
//       f208-228 warp 0.72, landed f237. PASS 2: this was a pull-back to k 0.82
//       and the resolved still came out a quarter empty sky with the people at
//       97 px; the resolved wide is k 1.0, which M4 has already reached, so the
//       last move is a tilt. What carries the span is the FLOOR running out to
//       both edges under it at 16.5 px/frame, not the lens
//                                — "the infrastructure of these AI
//                                   companies"                           f208-240
//
// LINE SPEED. 22 world px/frame for everything fired by an agent (threads,
// glances, the verticals). The climb's own speed is SOLVED against its beat
// (23.65 px/frame on a chord, 10.6 up a diagonal) and the floor's against f236
// and the frame edge at the k the camera is actually at by then (16.5
// px/frame, down from 19.8 now that the resolved wide is k 1.0 and the edge it
// has to clear is 540 px out rather than 659). The fastest head is a chord of
// the climb under M4's tight end: 33 screen px/frame, inside the 45 px/frame
// close-up cap.
//
// ambient, not gestures: the truss's white packets from f0 (~10 alive, 14
// frames each), `breath` on every dot, `sway` on the camera, the grid's drift.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, and every accent line
  accentDeep: z.string(), // deep: an unread dot
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
  personSrc: z.string(),
  personSize: z.number(), // world px, square
  beats: z.object({
    howLong: z.number(), // "how long"          — the web is already running
    the: z.number(), // "the"
    ais: z.number(), // "AIs"
    got: z.number(), // "got"
    away: z.number(), // "away"
    withWord: z.number(), // "with"
    over: z.number(), // "over"                 — M1 leaves the people
    a: z.number(), // "a"
    thousand: z.number(), // "thousand"
    instances: z.number(), // "instances"       — M1 is landed on the crowd
    secretly: z.number(), // "secretly"
    communicating: z.number(), // "communicating" — the launch rate steps up
    and: z.number(), // "and"
    how: z.number(), // "how"                   — the glances start, M2 creeps
    willing: z.number(), // "willing"
    they: z.number(), // "they"
    were: z.number(), // "were"
    to: z.number(), // "to"
    subvert: z.number(), // "subvert"           — the first take lands
    infrastructure: z.number(), // "infrastructure" — it spreads along the row
    how2: z.number(), // "how"                  — the climb
    successfully: z.number(), // "successfully"
    they2: z.number(), // "they"
    did: z.number(), // "did"
    inWord: z.number(), // "in"
    fact: z.number(), // "fact"
    manage: z.number(), // "manage"
    to2: z.number(), // "to"                    — the top row is taken
    subvert2: z.number(), // "subvert"          — the verticals convert
    the2: z.number(), // "the"                  — the floor starts drawing
    infrastructure2: z.number(), // "infrastructure"
    of: z.number(), // "of"
    these: z.number(), // "these"
    ai: z.number(), // "AI"
    companies: z.number(), // "companies"       — the floor is off both edges
    end: z.number(), // speech ends; tail to 262
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// The world. Nothing here is a magic number twice: the floor is y 0, everything
// else is measured off it, and every camera framing is solved from one of them.
// ---------------------------------------------------------------------------
const WORLD_W = FRAME_W;
const WORLD_H = FRAME_H;
export const CENTRE_X = 540;
export const FLOOR_Y = 0;
export const STROKE = 3; // every line in the piece
export const TONE_DUR = 10; // the one tone ramp: deep -> ripe
export const LINE_SPEED = 22; // world px/frame, everything an agent fires

const clampi = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const snap = (y: number) => Math.round(y) + 0.5;

// -- the floor --------------------------------------------------------------
export const FLOOR_X0 = -800;
export const FLOOR_X1 = 1880;
export const FLOOR_LINE_Y = snap(FLOOR_Y);

// -- the people -------------------------------------------------------------
// Five of them, 165 px apart. person.png's ink is 84% of its box wide, so at
// 118 world px a glyph is 99 px across and 165 leaves 66 px of air between two
// of them; the outer two keep 63 px of world margin at the opening k of 1.22,
// which is what fixes that k.
export const PERSON_SIZE = 118;
export const PERSON_FOOT = 471 / 512; // where the glyph's feet are in its box
export const PERSON_INK_TOP = 40 / 512; // and where the top of its head is
export const PERSON_GAP = 165;
export const PEOPLE: number[] = [0, 1, 2, 3, 4].map(
  (i) => CENTRE_X + (i - 2) * PERSON_GAP + (hash(i, 41) - 0.5) * 24,
);
// the world y of the top of a head — measured off the PNG's alpha box (its ink
// runs 40..472 of 512), not off the image box, so the bubble's air is real air
export const HEAD_TOP_Y =
  FLOOR_LINE_Y - STROKE / 2 - PERSON_SIZE * (PERSON_FOOT - PERSON_INK_TOP);

// -- the truss --------------------------------------------------------------
export const ROW_Y = [130, 270, 410]; // top, middle, bottom
export const NODE_STEP = 160;
export const NODE_M = 6; // m runs -6..6: 13 nodes to a row
export const ROW_STAGGER = 80; // the middle row sits between the other two

// -- the rack ---------------------------------------------------------------
// V2, on the director's note: "the infrastructure can look a lot better — now
// it's abstract triangles and circles. Maybe fill the circles with icons, maybe
// just a data center icon." Every node of the truss — all three rows — is now
// the repo's approved server-rack glyph, `#rack` from TenTimesTheCost.tsx,
// verbatim: a 100 x 130 rounded rectangle (r 10) drawn from its BOTTOM CENTRE
// with three 56 x 20 slots (r 5) cut out of it by fillRule="evenodd" so the
// field shows through them, and one static LED in each slot. At RACK_SCALE it
// is 44 x 57 world px, centred on the node, so it is the ring's width and a
// little more of its height and the truss keeps its exact geometry.
export const RACK_SCALE = 0.44;
export const RACK_HW = 50 * RACK_SCALE; // 22 — the old ring's radius, exactly
export const RACK_HH = 65 * RACK_SCALE; // 28.6
export const RACK_D = [
  "M-40,-130 h80 a10,10 0 0 1 10,10 v110 a10,10 0 0 1 -10,10 h-80 a10,10 0 0 1 -10,-10 v-110 a10,10 0 0 1 10,-10 z",
  "M-28,-112 h56 a5,5 0 0 1 5,5 v10 a5,5 0 0 1 -5,5 h-56 a5,5 0 0 1 -5,-5 v-10 a5,5 0 0 1 5,-5 z",
  "M-28,-75 h56 a5,5 0 0 1 5,5 v10 a5,5 0 0 1 -5,5 h-56 a5,5 0 0 1 -5,-5 v-10 a5,5 0 0 1 5,-5 z",
  "M-28,-38 h56 a5,5 0 0 1 5,5 v10 a5,5 0 0 1 -5,5 h-56 a5,5 0 0 1 -5,-5 v-10 a5,5 0 0 1 5,-5 z",
].join(" ");
export const LED_DX = 24;
export const LED_DY = [-102, -65, -28];
export const LED_R = 3.5;

// How far along a vector out of a node's centre the rack's OUTLINE is: lines
// now meet racks instead of piercing them, so every member, vertical, thread
// and glance is trimmed at this point rather than run to the node's centre.
const boxExit = (dx: number, dy: number) => {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const tx = ax > 1e-6 ? RACK_HW / ax : Infinity;
  const ty = ay > 1e-6 ? RACK_HH / ay : Infinity;
  return Math.min(tx, ty);
};

export const VERT_Y1 = ROW_Y[0] - RACK_HH; // 101.4: the top edge of a top rack

// -- the thought bubbles ----------------------------------------------------
// V2, on the director's note: "is there a purpose of the people icons being
// there? If they should be there, make it clear that they don't know what's
// going on, because that's what this whole thing is about." The people ARE
// these AI companies, and what they are doing for the whole 262 frames is
// thinking everything is fine: an ink squircle over each head with a white
// Lucide `check` in it. They go up on "got away with" and they NEVER CHANGE —
// five white ticks over five white people, still white on the last frame over
// an orange floor. The contrast is the line.
export const BUB_W = 78;
export const BUB_H = 58;
export const BUB_GAP = 26; // air between the bubble's foot and the head
// the house squircle at its default 1.2% ratio is a 2 px corner on a shape this
// size, which rendered as a hard SIGN over each head; a thought is soft, so
// this one shape takes a 22% corner (12.8 px) at the same Figma smoothing
export const BUB_RATIO = 0.22;
export const BUB_PATH = squirclePath(BUB_W, BUB_H, BUB_RATIO);
export const BUB_Y1 = HEAD_TOP_Y - BUB_GAP; // the bubble's foot
export const BUB_Y0 = BUB_Y1 - BUB_H; // its top: 80 px above the head
export const BUB_F0 = 14; // "got"
export const BUB_JITTER = 4; // ... "away with": one bubble per frame, hashed
export const BUB_DRAW = 5; // frames the squircle takes to draw round
export const CHECK_DRAW = 4; // and then the check draws inside it
export const CHECK_D = "M20 6 9 17l-5-5"; // Lucide `check`, 24-unit box (ISC)
export const CHECK_FRAC = 0.55; // of the bubble's height
export const CHECK_STROKE = 2.6; // the d1Shared glyph weight, square caps
export const CHECK_S = (CHECK_FRAC * BUB_H) / 24;
// the two dots that make it a thought and not a speech balloon, small one
// first, out of the head and up into the bubble
export const BUB_TRAIL = [
  { dx: -6, dy: 7, r: 4, t: 1 },
  { dx: -11, dy: 16, r: 2.5, t: 0 },
];
export const BUB_TRAIL_DUR = 3;
export const BUB_T0 = PEOPLE.map((_, i) => BUB_F0 + Math.round(hash(i, 81) * BUB_JITTER));

type Node = { x: number; y: number; row: number; m: number };
export const NODES: Node[] = (() => {
  const out: Node[] = [];
  for (let row = 0; row < 3; row++) {
    const off = row === 1 ? ROW_STAGGER : 0;
    for (let m = -NODE_M; m <= NODE_M; m++) {
      out.push({ x: CENTRE_X + off + m * NODE_STEP, y: ROW_Y[row], row, m });
    }
  }
  return out;
})();
const NODE_KEY = (row: number, m: number) => row * 1000 + (m + 64);
const NODE_ID = (() => {
  const map = new Map<number, number>();
  NODES.forEach((n, i) => map.set(NODE_KEY(n.row, n.m), i));
  return map;
})();
const nodeAt = (row: number, m: number) => {
  const i = NODE_ID.get(NODE_KEY(row, m));
  return i === undefined ? -1 : i;
};

// Members: chords along a row, diagonals from a node to the two nodes in the
// row above it. Row 1 sits +80 in x, so row-2 node m joins row-1 nodes m-1 and
// m; row-1 node m joins row-0 nodes m and m+1.
type Member = { a: number; b: number; len: number; diag: boolean };
export const MEMBERS: Member[] = (() => {
  const out: Member[] = [];
  const push = (a: number, b: number, diag: boolean) => {
    if (a < 0 || b < 0) return;
    out.push({ a, b, len: Math.hypot(NODES[a].x - NODES[b].x, NODES[a].y - NODES[b].y), diag });
  };
  for (let row = 0; row < 3; row++) {
    for (let m = -NODE_M; m < NODE_M; m++) push(nodeAt(row, m), nodeAt(row, m + 1), false);
  }
  for (let m = -NODE_M; m <= NODE_M; m++) {
    push(nodeAt(2, m), nodeAt(1, m - 1), true);
    push(nodeAt(2, m), nodeAt(1, m), true);
    push(nodeAt(1, m), nodeAt(0, m), true);
    push(nodeAt(1, m), nodeAt(0, m + 1), true);
  }
  return out;
})();
// Where each member actually starts and stops: at the two racks' outlines, not
// at their centres. A chord loses 22 px at each end and a diagonal 24.8, so a
// member is a strut BETWEEN two machines and the glyph is never crossed.
export const MEMBER_END = MEMBERS.map((m) => {
  const A = NODES[m.a];
  const B = NODES[m.b];
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const t = boxExit(dx, dy);
  return {
    ax: A.x + dx * t,
    ay: A.y + dy * t,
    bx: B.x - dx * t,
    by: B.y - dy * t,
    len: Math.hypot(dx, dy) * (1 - 2 * t),
  };
});

// which members touch a node, so a packet and the conversion can find them
const MEMBERS_OF: number[][] = NODES.map(() => []);
MEMBERS.forEach((mem, i) => {
  MEMBERS_OF[mem.a].push(i);
  MEMBERS_OF[mem.b].push(i);
});

// The verticals: the floor holding the top row up, one at each top-row node.
export const VERTS: number[] = NODES.map((n, i) => (n.row === 0 ? i : -1)).filter((i) => i >= 0);

// -- the crowd --------------------------------------------------------------
// A BAND, not a wall. PASS 2, on the director's note that 91 rows of seats read
// as a yellow texture that dwarfs the truss and the people — who are the
// subject — and as noise at phone size: the width is unchanged (60 columns, so
// it still runs off both frame edges at every k) and the DEPTH comes down from
// 91 rows to 36, world y 540 down to 1071.
//
// A band has two edges instead of one, so both are dissolved rather than ruled:
//   TOP    6 rows, on a `wobble`d line — the shoreline, as before. It is the
//          edge the whole first half of the piece is about (nothing crosses it
//          until the glances do), so it stays a crisp-ish coast.
//   BOTTOM 12 rows on its own wobble, and the surviving seats out there fall to
//          0.6x radius as well as thinning: this edge has no job except to not
//          be a rule, so it dissolves twice as far and fades as it goes. It is
//          inside the frame at the resolved wide (world 1071 -> screen 1611 at
//          k 1.0) and at every other framing except M1's, where the ground
//          below it is under the captions.
const STEP_X = 940 / 39;
const STEP_Y = 440 / 29;
export const COLS = 60;
export const BAND_ROWS = 36; // the band: rows 0..35, world y 540..1071
export const BOT_ROW = BAND_ROWS - 1;
export const ROW_LO = -4; // rows above the nominal shoreline, so wobble can lift it
export const ROW_HI = BOT_ROW + 4; // and below the nominal floor, so it can drop
export const CROWD_Y0 = 540; // the nominal top edge
export const TOP_FEATHER = 6; // rows the shoreline dissolves over
export const BOT_FEATHER = 12; // rows the underside dissolves over
export const BOT_MIN_R = 0.6; // what a seat's radius falls to out there
export const WOBBLE_SEED = 1.7;
export const WOBBLE_SEED_B = 4.3; // the underside undulates on its own phase

type Seat = { x: number; y: number; r: number; rs: number; gc: number; gr: number };
export const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (let gr = ROW_LO; gr <= ROW_HI; gr++) {
    for (let gc = 0; gc < COLS; gc++) {
      const i = (gr - ROW_LO) * COLS + gc;
      const x = CENTRE_X + (gc - (COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9;
      const y = CROWD_Y0 + gr * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9;
      // signed distance to each edge in rows, undulated along x
      const feT = feather(gr + wobble(x, WOBBLE_SEED), TOP_FEATHER);
      const feB = feather(BOT_ROW - gr + wobble(x, WOBBLE_SEED_B), BOT_FEATHER);
      const fe = Math.min(feT, feB);
      if (hash(i, 71) >= fe) continue;
      out.push({
        x,
        y,
        r: 0.75 + 0.5 * hash(i, 13),
        rs: (0.7 + 0.3 * feT) * (BOT_MIN_R + (1 - BOT_MIN_R) * feB),
        gc,
        gr,
      });
    }
  }
  return out;
})();
export const NSEAT = SEATS.length;

const SEAT_AT = (() => {
  const a = new Int32Array((ROW_HI - ROW_LO + 1) * COLS).fill(-1);
  SEATS.forEach((s, i) => {
    a[(s.gr - ROW_LO) * COLS + s.gc] = i;
  });
  return a;
})();
const seatAt = (gr: number, gc: number) => {
  if (gr < ROW_LO || gr > ROW_HI || gc < 0 || gc >= COLS) return -1;
  return SEAT_AT[(gr - ROW_LO) * COLS + gc];
};

// ---------------------------------------------------------------------------
// THE WEB. The one gesture that runs for the whole piece, and the only thing
// that carries f0-86: agents talking to each other under the floor.
//
// A thread is the house message-board thread — an accent line drawn head-led
// with a white tip, both endpoints going ripe off the thread itself — with ONE
// difference, and it is the gesture: the seats it touches NEVER GO BACK. A
// thread settles to the idle rung (0.4) and stands, and its two endpoints stay
// ripe for the rest of the piece even after the line itself is gone, so what
// the duration buys is accumulation.
//
// PASS 2, on the director's note that the tone ladder was spent by f44 — every
// seat ripe before "thousand", which leaves the second half of the line nothing
// to spend. The crowd is a DEEP field that a minority of it is lighting up:
//   rate  5.2/frame f0-56, up to 8.3/frame over f56-64 on one smoothstep
//         ("communicating" — the chatter gets louder), then DOWN to 3.1/frame
//         over f86-100, because from "willing" the action moves to the truss
//         and the chatter recedes under it.
//   cap   420 standing threads. When a new one completes past the cap the
//         OLDEST standing thread fades to 0 over 12 frames — its endpoints stay
//         ripe, so the field keeps filling while the LINES stay countable. From
//         ~f105 the cap is what holds the web at ~450 lines on screen instead
//         of the two thousand the launches would otherwise pile up.
//   The three rates are the director's 2.5 / 4 / 1.5 in shape — the same 1.6x
//   step on "communicating" and the same 0.375 ebb — scaled 2.08x, because on
//   THIS field (1,557 seats, not 5,008) the briefed absolute numbers land the
//   tone at 16% / 28% and the target is the percentages, not the rates.
// Measured on the built field: 8% of seats ripe at f44, 29% at f72, 48% at the
// breath f118, 63% at the resolved hold, and never all of it.
//
// WHERE they launch is hashed, with the density falling off with DEPTH (1 down
// to 0.45 across the band) rather than stopping at a row — a launch pool with a
// floor in it would put a straight edge across the crowd, which is the one
// thing the two dissolved edges are there to avoid. A seat within two rows of
// the shoreline only ever talks DOWNWARD or sideways, so no thread crosses the
// top edge before the glances do at f88.
// ---------------------------------------------------------------------------
export const WEB_RATE0 = 5.2; // launches/frame from f0
export const WEB_RATE1 = 8.3; // launches/frame from "communicating"
export const WEB_RATE2 = 3.1; // launches/frame once the action is on the truss
export const WEB_STEP_F0 = 56;
export const WEB_STEP_F1 = 64;
export const WEB_EBB_F0 = 86; // "how" — the creep starts, the chatter recedes
export const WEB_EBB_F1 = 100; // "willing"
export const WEB_CAP = 420; // standing threads
export const WEB_FADE = 12; // frames the oldest takes to go
export const WEB_REACH = 5; // cells
export const WEB_DUR0 = 8;
export const WEB_DUR1 = 14;
export const WEB_LIVE_OP = 0.95;
export const WEB_IDLE_OP = 0.4; // the rung it settles on and stands at
export const WEB_SETTLE = 6; // frames from arrival to that rung
export const HEAD_R = 4;

const webRateAt = (f: number) => {
  const up = smoothstep((f - WEB_STEP_F0) / (WEB_STEP_F1 - WEB_STEP_F0));
  const down = smoothstep((f - WEB_EBB_F0) / (WEB_EBB_F1 - WEB_EBB_F0));
  const r = WEB_RATE0 + (WEB_RATE1 - WEB_RATE0) * up;
  return r + (WEB_RATE2 - r) * down;
};

type Thread = { a: number; b: number; t0: number; dur: number };
export const THREADS: Thread[] = (() => {
  const out: Thread[] = [];
  let acc = 0;
  let n = 0;
  for (let f = 0; f < DURATION; f++) {
    acc += webRateAt(f);
    while (acc >= 1) {
      acc -= 1;
      // a seat, hashed, with the density falling off with depth
      let a = -1;
      for (let try_ = 0; try_ < 24; try_++) {
        const cand = Math.floor(hash(n * 7 + try_, 21) * NSEAT);
        const depth = clamp01((SEATS[cand].gr - 8) / (BOT_ROW - 8));
        if (hash(n * 7 + try_, 22) < 1 - 0.55 * smoothstep(depth)) {
          a = cand;
          break;
        }
      }
      if (a < 0) a = Math.floor(hash(n, 21) * NSEAT);
      const sa = SEATS[a];
      const dc = Math.round((hash(n, 23) - 0.5) * 2 * WEB_REACH);
      let dr = Math.round((hash(n, 24) - 0.5) * 2 * WEB_REACH);
      // nothing rises above the shoreline: a seat near the top talks downward
      if (sa.gr < 2 && dr < 0) dr = -dr;
      const b = seatAt(sa.gr + dr, sa.gc + dc);
      n++;
      if (b < 0 || b === a) continue;
      out.push({
        a,
        b,
        t0: f,
        dur: WEB_DUR0 + Math.round(hash(n, 25) * (WEB_DUR1 - WEB_DUR0)),
      });
    }
  }
  return out;
})();

// THE CAP. A thread stands until WEB_CAP others are standing behind it, and
// then it goes: sort the threads by the frame they COMPLETE on (which is not
// launch order — a thread's draw is 8-14 frames) and hand thread n its exit,
// the completion frame of thread n + WEB_CAP. It fades over WEB_FADE frames and
// its endpoints keep their tone, so the field goes on filling while the number
// of LINES across it holds at 420 instead of climbing to two thousand.
export const THREAD_OUT = (() => {
  const order = THREADS.map((t, i) => ({ i, c: t.t0 + t.dur })).sort((a, b) => a.c - b.c);
  const out = new Float64Array(THREADS.length).fill(Infinity);
  for (let n = WEB_CAP; n < order.length; n++) out[order[n - WEB_CAP].i] = order[n].c;
  return out;
})();

// When a seat first goes ripe: the earliest thread end that touches it. The
// source end lights as the thread leaves, the far end as it arrives — the tone
// comes off the thread and never off a timer of its own, and it survives the
// thread going.
export const LIT_AT = (() => {
  const a = new Float64Array(NSEAT).fill(Infinity);
  THREADS.forEach((t) => {
    a[t.a] = Math.min(a[t.a], t.t0);
    a[t.b] = Math.min(a[t.b], t.t0 + t.dur);
  });
  return a;
})();

// ---------------------------------------------------------------------------
// THE CAMERA. Five moves, one track, all through the shared damper. Nothing
// pans: cx is CENTRE_X for the whole piece. Each framing is solved from the one
// thing that has to be in the frame.
// ---------------------------------------------------------------------------
const centreFor = (worldY: number, screenY: number, k: number) =>
  worldY + (FRAME_H / 2 - screenY) / k - CAM_LIFT / k;

export const K_OPEN = 1.22; // the five glyphs across the frame, the truss under
// PASS 2: was 0.95. With 91 rows of crowd the lens could go as wide as it liked
// and still land on seats; a 36-row band at 0.95 put its dissolved underside at
// screen 1224 and left 256 px of bare grid between it and the caption safe
// line. 1.0 is the tightest the pull-back can land and still hold the five
// glyphs' heads (screen 111) — it buys 70 px of that back, and the crowd runs
// 180 world px past BOTH frame edges here instead of 150.
export const K_WIDE = 1.0; // the crowd, running off both sides
export const K_CREEP = 1.45; // the point that is about to change
export const K_REL = 1.15; // the whole bottom row, and the people back in it
export const K_RIDE = 1.0; // riding the front up the truss
// PASS 2: was 0.82, which put the people at 97 screen px with a quarter of the
// frame empty sky above them. The resolved wide is 1.0 — the people are 118 px,
// the whole truss is in the frame and the band's dissolve is still inside it.
export const K_FINAL = 1.0; // the resolved wide

export const C_OPEN = centreFor(FLOOR_Y, 700, K_OPEN);
// PASS 2: the shoreline at 760 rather than 700. The content is 1,180 world px
// tall (a person's head at -109 to the band's underside at 1071) and there are
// 1,480 px of frame above the captions to put it in, so 300 px is empty
// whatever happens; 760 is the split that leaves 111 above the heads and 189
// below the dissolve, which is as close to even as the picture gets.
export const C_WIDE = centreFor(CROWD_Y0, 760, K_WIDE);
export const C_CREEP = centreFor(ROW_Y[2], 580, K_CREEP);
export const C_REL = centreFor(ROW_Y[2], 700, K_REL);
export const C_RIDE = centreFor(ROW_Y[0], 760, K_RIDE);
export const C_FINAL = centreFor(FLOOR_Y, 540, K_FINAL);

export type CamSeg = {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  warp: number;
};

export const CAM_SEGS: CamSeg[] = [
  // M1 "over a thousand instances" — down and out, off the people to the crowd
  { f0: 22, f1: 35, k0: K_OPEN, k1: K_WIDE, c0: C_OPEN, c1: C_WIDE, warp: 0.72 },
  // M2 "and how willing they were" — THE CREEP, one even ease onto the node
  { f0: 86, f1: 109, k0: K_WIDE, k1: K_CREEP, c0: C_WIDE, c1: C_CREEP, warp: 1.0 },
  // M3 "infrastructure" — the release off the first take
  { f0: 128, f1: 140, k0: K_CREEP, k1: K_REL, c0: C_CREEP, c1: C_REL, warp: 0.7 },
  // M4 "how successfully they did in fact manage" — ride the front up
  { f0: 150, f1: 186, k0: K_REL, k1: K_RIDE, c0: C_REL, c1: C_RIDE, warp: 0.75 },
  // M5 "the infrastructure of these AI companies" — the settle onto the floor.
  // PASS 2: the resolved wide is k 1.0, which M4 already landed on, so this is
  // a TILT and not a pull-back: the lens comes down 90 world px off the top row
  // onto the floor, which is the thing converting, and the whole cross-section
  // — people, truss, band — sits in one frame at the end. The keys close 4
  // frames earlier than the old pull-back's (208-228, not 208-232) because the
  // travel is a third of what it was and keys that run to the landing leave the
  // damper crawling under "companies".
  { f0: 208, f1: 228, k0: K_RIDE, k1: K_FINAL, c0: C_RIDE, c1: C_FINAL, warp: 0.72 },
];

// One track: a key per frame inside a move, ONE key holding the last value in
// the gap before the next, so a hold is a hold and not a slow ramp.
const CAM_TRACK = (() => {
  const F: number[] = [0];
  const K: number[] = [K_OPEN];
  const CY: number[] = [C_OPEN + CAM_LIFT / K_OPEN];
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
  };
  CAM_SEGS.forEach((s) => {
    if (s.f0 > F[F.length - 1] + 1) hold(s.f0 - 1);
    const m = camMove(s);
    m.F.forEach((f, i) => {
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    });
  });
  if (F[F.length - 1] < DURATION) hold(DURATION);
  return { F, K, CY };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;

// The damped camera at every integer frame, run once: the floor's speed and the
// per-frame culling both need to know what the lens is actually doing, and it
// is the same loop `runCamera` runs, so this table IS the camera.
export const CAM_AT = (() => {
  const K = new Float64Array(DURATION + 1);
  const CY = new Float64Array(DURATION + 1);
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vy = 0;
  let vk = 0;
  K[0] = k;
  CY[0] = cy;
  for (let f = 1; f <= DURATION; f++) {
    const ty = interpolate(f, CAM_F, CAM_CY, clamp);
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    K[f] = k;
    CY[f] = cy;
  }
  return { K, CY };
})();
const kAt = (f: number) => CAM_AT.K[clampi(Math.round(f), 0, DURATION)];

// ---------------------------------------------------------------------------
// THE GLANCES. "how willing they were" — the crowd starts trying the truss and
// is thrown off it. A thread leaves a shoreline seat for the nearest bottom-row
// node at LINE_SPEED, its head stops dead on the outside of the ring, and then
// the whole line retreats back into its seat over 6 frames and fades. The ring
// flickers +0.1 and settles.
//
// The tempo is the gesture: one every 8 frames at f88, one every 2 by f118, on
// one curve, and the glances keep going under the held breath to f125.
// ---------------------------------------------------------------------------
export const GLANCE_F0 = 88;
export const GLANCE_F1 = 125;
export const GLANCE_RAMP = 108; // where the tempo tops out
export const GLANCE_INT0 = 6;
export const GLANCE_INT1 = 1.2;
export const GLANCE_RETREAT = 6;
export const RING_FLICK = 0.1;
export const RING_FLICK_DUR = 5;

// the bottom-row nodes the crowd can reach while the camera is on them
const BOTTOM_NODES = NODES.map((n, i) => (n.row === 2 ? i : -1)).filter((i) => i >= 0);
// the five the creep's framing (k 1.45, x 168..912) actually holds: a glance
// nobody can see is not a gesture
const GLANCE_NODES = BOTTOM_NODES.filter((i) => Math.abs(NODES[i].x - CENTRE_X) <= 340);

// A seat on the shoreline under a given x, hashed.
const shoreSeatNear = (x: number, seed: number) => {
  for (let try_ = 0; try_ < 40; try_++) {
    const gc = clampi(
      Math.round((x - CENTRE_X) / STEP_X + (COLS - 1) / 2 + (hash(seed + try_, 31) - 0.5) * 7),
      0,
      COLS - 1,
    );
    const gr = Math.floor(hash(seed + try_, 32) * 3);
    const i = seatAt(gr, gc);
    if (i >= 0) return i;
  }
  return -1;
};

type Reach = { seat: number; node: number; t0: number; travel: number };

// where a thread's head stops: on the outside of the RACK, on its own bearing
const rackPoint = (seat: Seat, node: Node) => {
  const dx = node.x - seat.x;
  const dy = node.y - seat.y;
  const d = Math.hypot(dx, dy) || 1;
  const stop = d * boxExit(dx, dy) + STROKE / 2;
  return { x: node.x - (dx / d) * stop, y: node.y - (dy / d) * stop, d: d - stop };
};

export const GLANCES: Reach[] = (() => {
  const out: Reach[] = [];
  let f = GLANCE_F0;
  let n = 0;
  while (f <= GLANCE_F1) {
    // round-robin with a hashed hop, so the crowd tries the whole underside
    // rather than hammering one ring: a hashed pick alone clustered them
    const node = GLANCE_NODES[(n + Math.floor(hash(n, 33) * 3)) % GLANCE_NODES.length];
    const seat = shoreSeatNear(NODES[node].x + (hash(n, 34) - 0.5) * 120, n * 13);
    if (seat >= 0) {
      const p = rackPoint(SEATS[seat], NODES[node]);
      out.push({ seat, node, t0: f, travel: p.d / LINE_SPEED });
    }
    const interval = interpolate(f, [GLANCE_F0, GLANCE_RAMP], [GLANCE_INT0, GLANCE_INT1], clamp);
    f += interval;
    n++;
  }
  return out;
})();

// ---------------------------------------------------------------------------
// THE CLIMB. The conversion is a wave through the truss's own graph, and its
// speed is SOLVED against the beat rather than typed.
//
// One thread lands on the bottom-centre node at f125 ("subvert") and converts
// it. From f133 ("infrastructure") the conversion leaves that node along its
// members: a member draws head-led from whichever end converted first, and the
// far node converts when the head arrives. A chord runs at CLIMB_SPEED and a
// diagonal at 0.6 of it — climbing is slower than running along a row, which is
// what makes the front go OUTWARD along the bottom first and then UP, instead
// of expanding as a disc. Each member waits a hashed 0-3 frames at its node
// before it leaves, so the front is ragged.
//
// CLIMB_SPEED is then the speed at which the LAST TOP-ROW NODE STILL IN FRAME
// (x 540 +- 640; the widest the lens ever gets is x -118..1198) converts at
// f190, two frames before "to". Binary search, because the hashed waits make
// the arrival time a non-linear function of the speed.
// ---------------------------------------------------------------------------
export const SEED_NODE = nodeAt(2, 0); // the bottom-centre node
export const TAKE_F = 125; // "subvert": the first take lands
export const SPREAD_F0 = 133; // "infrastructure": it starts spreading
export const CLIMB_LAND = 190; // the last top-row node in frame
export const CONV_DUR = 3; // ink -> accent on a ring
export const DIAG_FACTOR = 0.45; // a diagonal is climbed at 0.45 of chord speed
export const MEMBER_JITTER = 3; // frames a member waits at its node

const memberDur = (m: Member, speed: number) => m.len / (speed * (m.diag ? DIAG_FACTOR : 1));
const memberWait = (i: number) => hash(i, 51) * MEMBER_JITTER;

// Dijkstra over the truss: T[node] = frames after SPREAD_F0 that it converts.
const climbTimes = (speed: number) => {
  const T = new Float64Array(NODES.length).fill(Infinity);
  const done = new Uint8Array(NODES.length);
  T[SEED_NODE] = 0;
  for (;;) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < NODES.length; i++) {
      if (!done[i] && T[i] < best) {
        best = T[i];
        u = i;
      }
    }
    if (u < 0) break;
    done[u] = 1;
    MEMBERS_OF[u].forEach((mi) => {
      const mem = MEMBERS[mi];
      const v = mem.a === u ? mem.b : mem.a;
      const t = T[u] + memberWait(mi) + memberDur(mem, speed);
      if (t < T[v]) T[v] = t;
    });
  }
  return T;
};

const TOP_IN_FRAME = NODES.map((n, i) =>
  n.row === 0 && Math.abs(n.x - CENTRE_X) <= 660 ? i : -1,
).filter((i) => i >= 0);

export const CLIMB_SPEED = (() => {
  const want = CLIMB_LAND - SPREAD_F0;
  const last = (speed: number) => {
    const T = climbTimes(speed);
    return Math.max(...TOP_IN_FRAME.map((i) => T[i]));
  };
  let lo = 6;
  let hi = 80;
  for (let it = 0; it < 48; it++) {
    const mid = (lo + hi) / 2;
    if (last(mid) > want) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();

const T_RAW = climbTimes(CLIMB_SPEED);
// When each node is accent. The seed is the exception: it converts on the take.
export const CONV_T = Float64Array.from(
  NODES.map((_, i) => (i === SEED_NODE ? TAKE_F : SPREAD_F0 + T_RAW[i])),
);
// When each member starts drawing, from which end, and how long it takes.
export const MEMBER_DRAW = MEMBERS.map((m, i) => {
  const from = T_RAW[m.a] <= T_RAW[m.b] ? m.a : m.b;
  const to = from === m.a ? m.b : m.a;
  return {
    from,
    to,
    t0: SPREAD_F0 + T_RAW[from] + memberWait(i),
    dur: memberDur(m, CLIMB_SPEED),
  };
});

// ---------------------------------------------------------------------------
// THE LANDINGS. The thread that does not glance off, and then all the ones
// after it. The first leaves its seat early enough to arrive at f125 exactly —
// it climbs under the held breath. From f145 one lands every 4 frames, and in
// the tail one every 6, always on a node that is already accent and always on
// the truss's underside (the bottom row), so nothing is ever drawn across the
// structure. They stay.
// ---------------------------------------------------------------------------
export const LAND_INT = 4;
export const LAND_TAIL_INT = 6;
export const LAND_F0 = 145;
export const LAND_TAIL_F0 = 240;

export const LANDINGS: Reach[] = (() => {
  const out: Reach[] = [];
  const add = (node: number, arrive: number, n: number) => {
    const seat = shoreSeatNear(NODES[node].x + (hash(n, 61) - 0.5) * 150, n * 17 + 5);
    if (seat < 0) return;
    const p = rackPoint(SEATS[seat], NODES[node]);
    const travel = p.d / LINE_SPEED;
    out.push({ seat, node, t0: arrive - travel, travel });
  };
  add(SEED_NODE, TAKE_F, 0);
  let n = 1;
  for (let f = LAND_F0; f <= DURATION - 4; f += f < LAND_TAIL_F0 ? LAND_INT : LAND_TAIL_INT) {
    const halfW = FRAME_W / 2 / kAt(f) - 90; // in frame when it gets there
    const ready = BOTTOM_NODES.filter(
      (i) => CONV_T[i] + CONV_DUR <= f - 2 && Math.abs(NODES[i].x - CENTRE_X) <= halfW,
    );
    if (ready.length === 0) continue;
    add(ready[Math.floor(hash(n, 62) * ready.length)], f, n);
    n++;
  }
  return out;
})();

// ---------------------------------------------------------------------------
// THE VERTICALS AND THE FLOOR. "to subvert the infrastructure of these AI
// companies": the last thing the truss holds up is the floor the people stand
// on, so the conversion climbs the verticals and then runs along the floor
// under their feet.
//
// The verticals leave one a frame from f196, centre first, head-led UPWARD, at
// LINE_SPEED. The centre one reaches the floor at f201 and the floor draws from
// that foot BOTH WAYS at FLOOR_SPEED — which is solved so both heads are past
// the frame edge at f236, inside "companies" (f237), at the k the camera is
// actually at by then.
// ---------------------------------------------------------------------------
export const VERT_F0 = 196;
export const VERT_STEP = 1; // one leaves each frame
export const VERT_DUR = (ROW_Y[0] - RACK_HH - FLOOR_Y) / LINE_SPEED;
// centre first, then out both ways
export const VERT_ORDER = VERTS.slice().sort(
  (a, b) => Math.abs(NODES[a].x - CENTRE_X) - Math.abs(NODES[b].x - CENTRE_X),
);
export const VERT_T0 = (() => {
  const a = new Float64Array(NODES.length).fill(Infinity);
  VERT_ORDER.forEach((i, n) => {
    a[i] = VERT_F0 + n * VERT_STEP;
  });
  return a;
})();
export const FLOOR_F0 = VERT_F0 + VERT_DUR; // the centre vertical is home
export const FLOOR_EXIT = 236; // inside "companies"
export const FLOOR_SPEED =
  (FRAME_W / 2 / kAt(FLOOR_EXIT) + 40) / (FLOOR_EXIT - FLOOR_F0);

// ---------------------------------------------------------------------------
// THE PACKETS. The infrastructure is working when the line starts and it never
// stops working: a white ink bead runs a member over 14 frames, a new one every
// frame, so about fourteen are alive at any time — the truss is the only
// thing moving in the top half through the long hold at the wide, so it has to
// be working visibly rather than occasionally. A bead on a member the
// conversion has already passed is an ACCENT bead — the traffic is the
// subverted traffic now.
// ---------------------------------------------------------------------------
export const PKT_LIFE = 14;
export const PKT_EVERY = 1.0; // ~14 alive across 86 members
export const PKT_R = 4;
type Packet = { m: number; t0: number; rev: boolean };
export const PACKETS: Packet[] = (() => {
  const out: Packet[] = [];
  let n = 0;
  for (let t = -PKT_LIFE; t < DURATION; t += PKT_EVERY) {
    out.push({
      m: Math.floor(hash(n, 43) * MEMBERS.length),
      t0: t,
      rev: hash(n, 44) < 0.5,
    });
    n++;
  }
  return out;
})();

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
  personSrc: "person.png",
  personSize: PERSON_SIZE,
  beats: {
    howLong: 0,
    the: 6,
    ais: 10,
    got: 14,
    away: 17,
    withWord: 21,
    over: 25,
    a: 29,
    thousand: 33,
    instances: 38,
    secretly: 48,
    communicating: 58,
    and: 72,
    how: 86,
    willing: 100,
    they: 109,
    were: 114,
    to: 120,
    subvert: 125,
    infrastructure: 133,
    how2: 144,
    successfully: 158,
    they2: 169,
    did: 175,
    inWord: 178,
    fact: 181,
    manage: 185,
    to2: 192,
    subvert2: 196,
    the2: 205,
    infrastructure2: 215,
    of: 225,
    these: 229,
    ai: 233,
    companies: 237,
    end: 246,
  },
});

// A dot as path data. The crowd is ~1,800 seats and a <circle> each is that
// many DOM nodes a frame; one path per tone bucket is 65. Same picture, same
// solid fill, a fraction of the time.
const dotPath = (x: number, y: number, r: number) => {
  const d = (2 * r).toFixed(2);
  const rr = r.toFixed(2);
  return `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${rr} ${rr} 0 1 0 ${d} 0a${rr} ${rr} 0 1 0 -${d} 0`;
};

const SubvertTheInfrastructure: React.FC<Props> = ({
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
  personSrc,
  personSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  const tone = makeTone(accentDeep, accent); // 0 = deep (unread), 1 = ripe (lit)
  const inkToAccent = makeTone(ink, accent); // a ring converting

  // -- camera ---------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // what the lens can see this frame, so nothing off-frame is built
  const halfW = FRAME_W / 2 / k + 40;
  const halfH = FRAME_H / 2 / k + 40;
  const visX0 = cx - halfW;
  const visX1 = cx + halfW;
  const visY0 = cy - halfH;
  const visY1 = cy + halfH;

  // -- the crowd, one path per tone bucket ----------------------------------
  const buckets: string[][] = [];
  for (let i = 0; i <= TONE_STEPS; i++) buckets.push([]);
  for (let i = 0; i < NSEAT; i++) {
    const s = SEATS[i];
    if (s.x < visX0 || s.x > visX1 || s.y < visY0 || s.y > visY1) continue;
    const l = smoothstep((frame - LIT_AT[i]) / TONE_DUR);
    const r = dotRadius * s.r * s.rs * breath(frame, hash(i, 9)) * (1 + 0.3 * l);
    buckets[Math.round(clamp01(l) * TONE_STEPS)].push(dotPath(s.x, s.y, r));
  }

  // -- the web: threads that never fade -------------------------------------
  type Seg = { key: string; x1: number; y1: number; x2: number; y2: number; op: number; head: boolean };
  const web: Seg[] = [];
  for (let j = 0; j < THREADS.length; j++) {
    const t = THREADS[j];
    if (frame < t.t0) break; // THREADS is built in launch order
    const out = THREAD_OUT[j];
    if (frame >= out + WEB_FADE) continue; // past the cap, and gone
    const a = SEATS[t.a];
    const b = SEATS[t.b];
    if (Math.max(a.x, b.x) < visX0 || Math.min(a.x, b.x) > visX1) continue;
    if (Math.max(a.y, b.y) < visY0 || Math.min(a.y, b.y) > visY1) continue;
    const u = clamp01((frame - t.t0) / t.dur);
    const e = ease(u, EASE_ARRIVE);
    const settle = clamp01((frame - (t.t0 + t.dur)) / WEB_SETTLE);
    const gone = out === Infinity ? 0 : clamp01((frame - out) / WEB_FADE);
    web.push({
      key: `w${j}`,
      x1: a.x,
      y1: a.y,
      x2: a.x + (b.x - a.x) * e,
      y2: a.y + (b.y - a.y) * e,
      op: (WEB_LIVE_OP + (WEB_IDLE_OP - WEB_LIVE_OP) * settle) * (1 - gone),
      head: u < 1,
    });
  }

  // -- the glances, and the ring flicker they leave -------------------------
  const flick = new Float64Array(NODES.length);
  const glances: Seg[] = [];
  GLANCES.forEach((g, j) => {
    const end = g.t0 + g.travel + GLANCE_RETREAT;
    if (frame < g.t0 || frame > end) return;
    const s = SEATS[g.seat];
    const p = rackPoint(s, NODES[g.node]);
    const up = clamp01((frame - g.t0) / g.travel);
    const back = clamp01((frame - (g.t0 + g.travel)) / GLANCE_RETREAT);
    const e = ease(up, EASE_ARRIVE) * (1 - ease(back, EASE_ARRIVE));
    glances.push({
      key: `g${j}`,
      x1: s.x,
      y1: s.y,
      x2: s.x + (p.x - s.x) * e,
      y2: s.y + (p.y - s.y) * e,
      op: WEB_LIVE_OP * (1 - back),
      head: true,
    });
    if (frame >= g.t0 + g.travel) {
      flick[g.node] = Math.max(
        flick[g.node],
        RING_FLICK * (1 - smoothstep((frame - (g.t0 + g.travel)) / RING_FLICK_DUR)),
      );
    }
  });

  // -- the landings: the threads that hold ----------------------------------
  const landings: Seg[] = [];
  LANDINGS.forEach((l, j) => {
    if (frame < l.t0) return;
    const s = SEATS[l.seat];
    const p = rackPoint(s, NODES[l.node]);
    const u = clamp01((frame - l.t0) / l.travel);
    const e = ease(u, EASE_ARRIVE);
    landings.push({
      key: `l${j}`,
      x1: s.x,
      y1: s.y,
      x2: s.x + (p.x - s.x) * e,
      y2: s.y + (p.y - s.y) * e,
      op: u < 1 ? WEB_LIVE_OP : 0.6,
      head: u < 1,
    });
  });

  // -- the truss's conversion ----------------------------------------------
  const nodeConv = NODES.map((_, i) => clamp01((frame - CONV_T[i]) / CONV_DUR));
  const memberConv = MEMBER_DRAW.map((m) => clamp01((frame - m.t0) / m.dur));

  // -- the verticals and the floor -----------------------------------------
  const vertConv = NODES.map((_, i) =>
    VERT_T0[i] === Infinity ? 0 : clamp01((frame - VERT_T0[i]) / VERT_DUR),
  );
  const floorRun = Math.max(0, (frame - FLOOR_F0) * FLOOR_SPEED);

  // -- the one click in the piece: the first take --------------------------
  // The click lands ON the converted ring rather than in the middle of its
  // ramp, where a pale yellow is indistinguishable from the white it is
  // leaving: CONV_DUR after the take, two frames, and nowhere else in the piece.
  const takeCol = inkToAccent(nodeConv[SEED_NODE]);
  const seedCol = highlightTone(frame, beats.subvert + CONV_DUR, takeCol);

  const drawLine = (s: Seg, stroke: string) => (
    <g key={s.key}>
      <line
        x1={s.x1}
        y1={s.y1}
        x2={s.x2}
        y2={s.y2}
        stroke={stroke}
        strokeWidth={STROKE}
        strokeLinecap="round"
        opacity={s.op}
      />
      {s.head ? <circle cx={s.x2} cy={s.y2} r={HEAD_R} fill={ink} opacity={s.op} /> : null}
    </g>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
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
            {/* the crowd */}
            {buckets.map((parts, i) =>
              parts.length === 0 ? null : (
                <path
                  key={i}
                  d={parts.join("")}
                  fill={tone(i / TONE_STEPS)}
                  opacity={dotUnread}
                />
              ),
            )}

            {/* the web: every thread ever launched, none of them gone */}
            {web.map((s) => drawLine(s, accent))}

            {/* the ones that tried the truss and were thrown off */}
            {glances.map((s) => drawLine(s, accent))}

            {/* and the ones that stuck */}
            {landings.map((s) => drawLine(s, accent))}

            {/* the infrastructure */}
            <g style={{ filter: icon }}>
              {/* members: ink, with the conversion drawn head-led over them.
                  Every one of them now runs rack-edge to rack-edge. */}
              {MEMBERS.map((m, i) => {
                const A = NODES[m.a];
                const B = NODES[m.b];
                if (Math.max(A.x, B.x) < visX0 || Math.min(A.x, B.x) > visX1) return null;
                const E = MEMBER_END[i];
                const d = MEMBER_DRAW[i];
                const fromA = d.from === m.a;
                const F = { x: fromA ? E.ax : E.bx, y: fromA ? E.ay : E.by };
                const T = { x: fromA ? E.bx : E.ax, y: fromA ? E.by : E.ay };
                const e = memberConv[i];
                return (
                  <g key={`m${i}`}>
                    <line
                      x1={E.ax}
                      y1={E.ay}
                      x2={E.bx}
                      y2={E.by}
                      stroke={ink}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={OP_READ}
                    />
                    {e > 0 ? (
                      <line
                        x1={F.x}
                        y1={F.y}
                        x2={F.x + (T.x - F.x) * e}
                        y2={F.y + (T.y - F.y) * e}
                        stroke={accent}
                        strokeWidth={STROKE}
                        strokeLinecap="round"
                        opacity={OP_READ}
                      />
                    ) : null}
                    {e > 0 && e < 1 ? (
                      <circle
                        cx={F.x + (T.x - F.x) * e}
                        cy={F.y + (T.y - F.y) * e}
                        r={HEAD_R}
                        fill={ink}
                        opacity={OP_READ}
                      />
                    ) : null}
                  </g>
                );
              })}

              {/* the verticals from the floor down to the top row */}
              {VERTS.map((i) => {
                const n = NODES[i];
                if (n.x < visX0 - 40 || n.x > visX1 + 40) return null;
                const e = vertConv[i];
                return (
                  <g key={`v${i}`}>
                    <line
                      x1={n.x}
                      y1={FLOOR_LINE_Y}
                      x2={n.x}
                      y2={VERT_Y1}
                      stroke={ink}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={OP_READ}
                    />
                    {e > 0 ? (
                      <line
                        x1={n.x}
                        y1={VERT_Y1}
                        x2={n.x}
                        y2={VERT_Y1 + (FLOOR_LINE_Y - VERT_Y1) * e}
                        stroke={accent}
                        strokeWidth={STROKE}
                        strokeLinecap="round"
                        opacity={OP_READ}
                      />
                    ) : null}
                    {e > 0 && e < 1 ? (
                      <circle
                        cx={n.x}
                        cy={VERT_Y1 + (FLOOR_LINE_Y - VERT_Y1) * e}
                        r={HEAD_R}
                        fill={ink}
                        opacity={OP_READ}
                      />
                    ) : null}
                  </g>
                );
              })}

              {/* the nodes: every one of them is a SERVER RACK. The fill is
                  what converts ink -> accent; the LEDs stay white. */}
              {NODES.map((n, i) => {
                if (n.x < visX0 - 60 || n.x > visX1 + 60) return null;
                const c = i === SEED_NODE ? seedCol : inkToAccent(nodeConv[i]);
                return (
                  <g
                    key={`n${i}`}
                    transform={`translate(${n.x} ${n.y + RACK_HH}) scale(${RACK_SCALE})`}
                    opacity={OP_READ + flick[i]}
                  >
                    <path d={RACK_D} fill={c} fillRule="evenodd" />
                    {LED_DY.map((ly) => (
                      <circle key={ly} cx={LED_DX} cy={ly} r={LED_R} fill={ink} />
                    ))}
                  </g>
                );
              })}

              {/* the floor the people stand on */}
              <line
                x1={FLOOR_X0}
                y1={FLOOR_LINE_Y}
                x2={FLOOR_X1}
                y2={FLOOR_LINE_Y}
                stroke={ink}
                strokeWidth={STROKE}
                opacity={OP_READ}
              />
              {floorRun > 0 ? (
                <>
                  <line
                    x1={Math.max(FLOOR_X0, CENTRE_X - floorRun)}
                    y1={FLOOR_LINE_Y}
                    x2={Math.min(FLOOR_X1, CENTRE_X + floorRun)}
                    y2={FLOOR_LINE_Y}
                    stroke={accent}
                    strokeWidth={STROKE}
                    opacity={OP_READ}
                  />
                  {CENTRE_X + floorRun < visX1 ? (
                    <circle
                      cx={CENTRE_X + floorRun}
                      cy={FLOOR_LINE_Y}
                      r={HEAD_R}
                      fill={ink}
                      opacity={OP_READ}
                    />
                  ) : null}
                  {CENTRE_X - floorRun > visX0 ? (
                    <circle
                      cx={CENTRE_X - floorRun}
                      cy={FLOOR_LINE_Y}
                      r={HEAD_R}
                      fill={ink}
                      opacity={OP_READ}
                    />
                  ) : null}
                </>
              ) : null}

              {/* the packets: the infrastructure is working, and then it is
                  working for somebody else */}
              {PACKETS.map((p, j) => {
                const u = (frame - p.t0) / PKT_LIFE;
                if (u < 0 || u > 1) return null;
                const m = MEMBERS[p.m];
                const E = MEMBER_END[p.m];
                // a bead runs rack to rack, so it never crosses a glyph
                const A = p.rev ? { x: E.bx, y: E.by } : { x: E.ax, y: E.ay };
                const B = p.rev ? { x: E.ax, y: E.ay } : { x: E.bx, y: E.by };
                if (Math.max(A.x, B.x) < visX0 || Math.min(A.x, B.x) > visX1) return null;
                const x = A.x + (B.x - A.x) * u;
                const y = A.y + (B.y - A.y) * u;
                // accent once the conversion has passed this point
                const d = MEMBER_DRAW[p.m];
                const from =
                  d.from === m.a ? { x: E.ax, y: E.ay } : { x: E.bx, y: E.by };
                // strictly BEHIND the conversion front, and only once the front
                // exists: `<=` alone paints a packet sitting on the from-node
                // accent from f0, which puts one orange bead on a white truss
                // a hundred frames before anything is subverted
                const along =
                  memberConv[p.m] > 0 &&
                  Math.hypot(x - from.x, y - from.y) / (E.len || 1) < memberConv[p.m];
                return (
                  <circle
                    key={`p${j}`}
                    cx={x}
                    cy={y}
                    r={PKT_R}
                    fill={along ? accent : ink}
                    opacity={OP_READ}
                  />
                );
              })}
            </g>

            {/* the thought bubbles. They go up on "got away with", and from
                f27 to f262 they are the only thing in the piece that does not
                change: five white ticks over the whole takeover. */}
            <g style={{ filter: icon }}>
              {PEOPLE.map((x, i) => {
                const t = frame - BUB_T0[i];
                if (t < 0) return null;
                const b = clamp01(t / BUB_DRAW);
                const c = clamp01((t - BUB_DRAW) / CHECK_DRAW);
                const g = 24 * CHECK_S;
                return (
                  <g key={`b${i}`}>
                    {BUB_TRAIL.map((p, j) => {
                      const s = smoothstep((t - p.t) / BUB_TRAIL_DUR);
                      return s <= 0 ? null : (
                        <circle
                          key={j}
                          cx={x + p.dx}
                          cy={BUB_Y1 + p.dy}
                          r={p.r * s}
                          fill={ink}
                          opacity={OP_READ}
                        />
                      );
                    })}
                    <path
                      d={BUB_PATH}
                      transform={`translate(${x - BUB_W / 2} ${BUB_Y0})`}
                      fill="none"
                      stroke={ink}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={OP_READ}
                      pathLength={1}
                      strokeDasharray="1 1"
                      strokeDashoffset={1 - b}
                    />
                    {c > 0 ? (
                      <g
                        transform={`translate(${x - g / 2} ${BUB_Y0 + BUB_H / 2 - g / 2}) scale(${CHECK_S})`}
                      >
                        <path
                          d={CHECK_D}
                          fill="none"
                          stroke={ink}
                          strokeWidth={CHECK_STROKE}
                          strokeLinecap="square"
                          strokeLinejoin="miter"
                          opacity={OP_READ}
                          pathLength={1}
                          strokeDasharray="1 1"
                          strokeDashoffset={1 - c}
                        />
                      </g>
                    ) : null}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* the people: they stand on the floor and they never move */}
          {PEOPLE.map((x, i) => (
            <Img
              key={i}
              src={staticFile(personSrc)}
              style={{
                position: "absolute",
                left: x - personSize / 2,
                top: FLOOR_LINE_Y - STROKE / 2 - personSize * PERSON_FOOT,
                width: personSize,
                height: personSize,
                filter: `brightness(0) invert(1) ${icon}`,
                opacity: OP_READ,
              }}
            />
          ))}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default SubvertTheInfrastructure;
