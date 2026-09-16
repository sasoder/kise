import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camEase,
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
import {
  DARK_TRAFFIC_OPACITY,
  Packet,
  arriveEase,
  holdDriftK,
  packetsOn,
} from "./levelUp";

export const FPS = 24;

// ---------------------------------------------------------------------------
// John Charles Beren, clip `OptimizingTheObjective` — the cut after
// StillDecideWhatWeWantV2: "...actually, like achieving or optimizing the
// objective you've defined."
//
// The composition starts at SRT 35.799 s, so every beat below is
//   frame = round((t - 35.799) * 24)
//     actually  f0     like       f15    achieving f33    or        f49
//     optimizing f55   the        f66    objective f72    you've    f80
//     defined   f85    next word "I"     f98
// Speech therefore runs f0..98 and a 16 frame tail holds the resolved state:
//   DURATION = 98 + 16 = 114.
export const DURATION = 114;

// ---------------------------------------------------------------------------
// THE CLIP'S RULE, unchanged across the three cuts: people draw the shape, the
// orange dots fill it. Cut 2 showed the person SETTING the goal (a Lucide flag
// in a thought bubble). This cut is the other half of alignment: the dots
// ACHIEVING the goal the person defined.
//
// Vocabulary, Orange Dwarkesh on the grid, identical to the approved cuts:
//   a person      = person.png, ink white, iconShadow, 120 world px
//   the AIs       = orange dots, solid, ACCENT_DEEP at rest, ACCENT lit
//   the objective = the Lucide `flag`, outline, planted — the same glyph the
//                   person drew inside the bubble in cut 2, now standing in the
//                   world at full size
//   ink lines     = the ground under the pole, and the person's claim on the
//                   pole. One stroke weight for every stroke in the piece.
// No text, no numbers. It has to read with the sound off.
//
// SOUND-OFF READING TEST: "the crowd races to the flag the person planted."
//
// ---------------------------------------------------------------------------
// GESTURES — one per word, and every one of them LEADS its word: a gesture is
// already moving when the word lands, and the next one starts before the last
// has settled. Nothing else is in the piece.
//
//   1. f0   "actually"    the standing scene: the person at the left, the
//                         planted flag with its ground line, the crowd milling
//                         below-left, off the ground. Alive from frame 0 — the camera's opening
//                         glide, the mill, micro-drift, dark traffic, glyph
//                         sway, and the cloth breathing 1 px at its tip.
//   2. f10  "like"        ANTICIPATION, five frames early. Dots drift up to
//           (f15)         12 px toward the pole foot over f10-31 (hashed
//                         starts, weighted by how near the flag a dot already
//                         is), so the crowd's boundary bulges toward it.
//   3. f26  "achieving"   LAUNCH, seven frames early, so the word lands with
//           (f33)         dots already in the air. Wide individual arcs, hashed
//                         launches on a rate that ramps down from ~4/frame,
//                         arriveEase, never in unison; each dot seats on the
//                         MOUND standing on the ground line at the pole foot
//                         and goes deep -> ripe as it lands. Half the crowd is
//                         away by f46.
//   4. f44  "optimizing"  THE STREAM TIGHTENS, continuously, not on a frame.
//           (f55)         Every flight carries one number, `mix` = smoothstep
//                         over f44-58 of its own launch time: at 0 it is a wide
//                         arc at 23 world px/frame, at 1 a near-straight lane
//                         through one common waist at 26, with a third of the
//                         bow. So the spray becomes a lane across "or
//                         optimizing" instead of switching. Airborne by f74;
//                         93% of the mound is seated by f91 and the last three
//                         dots land at f101, inside the pull-back (see
//                         DEVIATIONS), and the mound is ripe and dense.
//   5. f66  "the          THE FLAG WAVES ONCE, six frames early: a single
//           objective"    ripple leaves the pole at f66 and its crest is at the
//           (f72)         free end of the cloth ON the word (f72), running off
//                         the tip by f78. Then it settles into its breathe.
//                         Nothing else changes.
//   6. f73  "you've       The person lifts 4 px (wake f73-81) and a thin ink
//           defined"      line draws head-led from his shoulder to the pole at
//           (f80/f85)     mid-height f78-88 — mid-stroke on "defined" — screen
//                         -space head, midground opacity. The line stays: the
//                         flag is his. The camera's pull-back starts WITH the
//                         line, at f86, not after it.
//   7. f92  tail          the cluster milling, dark traffic thinning to 60%,
//           -> f114       one packet running person -> pole every 12 f, the
//                         cloth breathing, and the camera still opening.
//
// If it is not in that list it is not on a word, and nothing else was added.
//
// ---------------------------------------------------------------------------
// LIVENESS — the V3 mechanisms, all of them, none of them on a word:
//   * micro-drift: every dot wanders +-3 world px on two hashed sines, seated,
//     milling, in flight, at every zoom, through the tail. Back dots ride 1.45x
//     of it (~1.4 px more).
//   * the mill: hops to vacant neighbouring seats, in the source crowd from f0
//     (1.3/frame) and in the foot cluster from the first landing (1.5/frame),
//     on one shared occupancy map, through every hold and the whole tail.
//   * dark traffic: idleThreads(130) = 20 accent threads between neighbouring
//     dots at 0.12, no heads; never on a dot that has not landed; thinning to
//     60% across the tail.
//   * hold drift: after every camera landing and through the tail the camera
//     keeps moving ~1 screen px/frame in the direction of its last move
//     (straight ramps, holdDriftK for the zoom). Exactly ONE dead-still stretch
//     in the piece: the held breath, f66-73.
//   * glyph sway: the person sways +-1.5 screen px on hashed sines, and lifts
//     4 screen px over f80-88 before he claims the pole.
//   * the cloth breathes: the free end of the flag rises and falls ~1 world px
//     on a slow sine, from frame 0 and through the tail.
//   * arriveEase on every flight and every mill hop; screen-space head on the
//     person -> pole line; packets on it once it has landed.
//
// ---------------------------------------------------------------------------
// THE DEPTH LADDER, by role (three rungs, opacity and size only — TONE still
// carries state, deep at rest / ripe achieved, and nothing about the story is
// in these numbers):
//   FG  1.00  the flag, the person, the cores of both crowds, every line head
//             and packet.
//   MID 0.78  the containers and claims: the ground line under the pole, the
//             person -> pole line.
//   BG  0.55  the outer ~40% of every crowd and cluster, by hashed distance,
//             at 0.80x radius and 1.45x micro-drift.
// Every dot also carries a +-18% hashed radius spread. A dot's rung follows it
// from the crowd to the cluster: it is computed at both ends and crossfaded
// across its flight.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, and why. Every one of them was measured, not
// guessed; the measurements are in bounds.txt, energy.txt and the audit.
//   * FLIGHT DURATIONS. The brief asks 14-20 f in phase A and 10-13 f in phase
//     B. The crowd centre is 340 world px from the pole foot; at k 1.28 a 12 f
//     flight puts the head at 66 screen px/frame, 47% over the set's 45 px cap,
//     and at 24 fps that strobes. Flights are SPEED-authored instead — 23 world
//     px/frame at mix 0, 26 at mix 1 — and then lengthened one frame at a time
//     until the head's PEAK screen speed (the Bezier's own, which is not
//     uniform, times the camera's k on that frame) is under 43. That lands them
//     at 9-23 f, still the briefed 21% tightening, and the measured fastest
//     head in the piece is 42.9 screen px/frame.
//   * THE CROWD'S PLACE, SIZE AND COUNT. Brief: ~110 dots at centre (330,
//     1180), half-extents 220 x 90. Built as 130 dots at (370, 1115), 118 x 52
//     on a 12 x 9 lattice. Two reasons. (a) The camera pans right to the pole
//     foot and pushes to k 1.28 (1.367 after the drift); at the briefed extents
//     the crowd's left edge crosses the 40 px side margin from f52 on and its
//     foot crosses screen y 1290 at the push. (b) At 110 dots over the briefed
//     extents the blob reads as scattered specks rather than one body. The
//     picture is the briefed one.
//   * THE DRAIN ORDER. Launch order is weighted so the FAR side and the FOOT
//     of the crowd go first (key = 0.55*hash - 0.27*distance to the pole -
//     0.18*lowness): the blob contracts up and toward the flag as it empties,
//     which is what keeps its left edge off the frame's side and its foot out
//     of the caption band while the camera pans right and pushes in. Hashed
//     hard enough that it reads as a crowd surging, not as a wipe.
//   * NO UNISON, at this density. 130 dots leave over 48 frames, so the mean
//     gap between consecutive launches is 0.37 f and a blanket "every pair at
//     least 2 f apart" is arithmetically impossible. The rule is enforced where
//     it is visible — between dots that are actually side by side. Launches:
//     every pair of dots within 18 world px of each other in the crowd is at
//     least 2.06 f apart (a greedy permutation of WHICH dot holds which slot in
//     the schedule, so the rate curve is untouched). Landings: every pair of
//     dots on cluster seats within 14 world px is at least 2.04 f apart (each
//     colliding landing is pushed LATER in 1.1 f steps, never earlier, so the
//     speed cap still holds). No two dots share an exact launch or landing
//     time anywhere in the piece.
//   * THE TAIL MILL runs at 1.5 hops/frame in the cluster and 1.3 in the crowd,
//     not the briefed 1 hop / 5 f. At 0.2/frame the tail blocks fall under the
//     V3 calibration floor and the piece reads parked; see energy.txt.
//   * THE MID-CUT FRAMING. The centre of mass is inside screen y 960 +- 60 on
//     the opening frame (933) and the last frame (927), as asked, and it is the
//     BAND that decides both: at k 1.251 the crowd's foot is 263 screen px
//     below the camera and a centre of 960 would put it at 1305, so 933 is the
//     highest the opening can sit. Between f80 and f95 the centre rides up to
//     757 — the source crowd is gone, the camera is at its tightest on the flag
//     foot, and the resolved group's own centre is at world y 761. The
//     pull-back brings it back, and nothing ever leaves the band (measured on
//     every rendered frame: y 458-1282, x 53-948; tightest margins bottom 8 px
//     at f55, left 13 px at f57).
//   * THE SCALE. x1.18 on every zoom key, as asked, and it fits: at x1.18 the
//     tightest frame (f55) has 8 px of bottom margin left. It is the SOURCE
//     CROWD that sets that ceiling — it is the lowest thing in the piece and it
//     is on screen until f74 — so the multiplier could not go higher without
//     moving a crowd that is approved.
//   * THE FLIGHTS GOT LONGER, and the last landings with them: f90.5 -> f101.
//     Two compounding reasons, both of them consequences of things that were
//     asked for. The mound stands ON the ground line instead of hanging below
//     it, so a seat is ~130 world px further from the crowd than it was (paths
//     +25%); and every flight is capped at 43 screen px/frame for its head,
//     which at k 1.51 instead of 1.28 costs another 18%. Nine of the 130 dots
//     land after f91 and three after f98. The read — "the crowd races to the
//     flag" — is 93% resolved on "defined" and the stragglers keep the tail
//     from parking; energy2.txt's floor is 0.635 against V3's 0.327.
//   * THE GROUND LINE is 344 world px wide (x 468..812), not 160. The crowd now
//     STANDS on it and it has to be under all of it: the drawn mound is x
//     487..796. It changes no bound — the cloth already reaches x 866.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a dot that has reached the flag
  accentDeep: z.string(), // deep: a dot at rest in the crowd
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotOpacity: z.number(),
  personSrc: z.string(),
  beats: z.object({
    actually: z.number(),
    like: z.number(),
    achieving: z.number(),
    or: z.number(),
    optimizing: z.number(),
    the: z.number(),
    objective: z.number(),
    youve: z.number(),
    defined: z.number(),
    end: z.number(), // next word "I"; tail to 114
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
  dotOpacity: OP_UNREAD_DOT,
  personSrc: "person.png",
  beats: {
    actually: 0,
    like: 15,
    achieving: 33,
    or: 49,
    optimizing: 55,
    the: 66,
    objective: 72,
    youve: 80,
    defined: 85,
    end: 98,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const CX = 540;

// The director's note from cut 2: the focus belongs in the MIDDLE of the frame.
// The set's CAM_LIFT of 125 puts a content centre at screen y 835; this piece
// uses 0, so a content centre lands at screen y 960.
const LIFT = 0;

// TWO weights, and only two. The flag is an OUTLINE glyph and carries the
// glyph weight; the ground and the claim are ink LINES and carry the line
// weight. Both are set against the filled person glyph rather than against
// Lucide's nominal 2-at-24 (which at a 280 px box would be 23 world px): at
// these values the pole and the person's silhouette edge read as one pen.
const GLYPH_STROKE = 6.0; // the flag: pole and cloth
const STROKE = 4.5; // the ground line and the person -> pole line

// --- the depth ladder ------------------------------------------------------
const OP_FG = 1.0;
const OP_MID = 0.78;
const OP_BG = 0.55;
const BG_R_SCALE = 0.8;
const BG_DRIFT = 1.45;
const DEPTH_CUT = 0.6; // percentile of the seat's distance at which a dot goes to the back rung
const DEPTH_JITTER = 0.34; // hashed, so the band is feathered and not a drawn ring
const R_SPREAD = 0.18; // +-18% hashed per-dot radius

// ---------------------------------------------------------------------------
// THE FLAG. Lucide `flag`, ISC, inlined verbatim as a 24-unit icon — the same
// glyph the person drew inside the thought bubble in cut 2, now planted in the
// world. Its ink box on the 24 grid is x 4..20, y 2..22, and it is the POLE
// FOOT, grid (4, 22), that is planted: FLAG_FOOT is that point in the world.
// ---------------------------------------------------------------------------
// Lucide `flag`:
//   <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
//   <line x1="4" x2="4" y1="22" y2="15"/>
const FLAG_FOOT = { x: 640, y: 900 };
const FLAG_BOX = 280; // world px, ink box height (grid y 2..22 = 20 units)
const FLAG_S = FLAG_BOX / 20; // 14 world px per grid unit
const fg2w = (gx: number, gy: number) => ({
  x: FLAG_FOOT.x + (gx - 4) * FLAG_S,
  y: FLAG_FOOT.y + (gy - 22) * FLAG_S,
});
const POLE_TOP = fg2w(4, 15); // (640, 812.5) — where the cloth hangs

// The cloth, resolved out of the shorthand once at module scope and walked into
// points, so the ripple can be applied per point without asking the DOM for
// `getPointAtLength`. Eight cubics: the two `s` runs, the `V` and the closing
// `z` written as degenerate ones.
const CLOTH_CUBICS: number[][] = [
  [4, 15, 4, 15, 5, 14, 8, 14],
  [8, 14, 11, 14, 13, 16, 16, 16],
  [16, 16, 19, 16, 20, 15, 20, 15],
  [20, 15, 20, 15, 20, 3, 20, 3], // V3
  [20, 3, 20, 3, 19, 4, 16, 4],
  [16, 4, 13, 4, 11, 2, 8, 2],
  [8, 2, 5, 2, 4, 3, 4, 3],
  [4, 3, 4, 3, 4, 15, 4, 15], // z
];
const CLOTH_PTS: { x: number; y: number }[] = (() => {
  const pts: { x: number; y: number }[] = [{ x: CLOTH_CUBICS[0][0], y: CLOTH_CUBICS[0][1] }];
  for (const c of CLOTH_CUBICS) {
    for (let i = 1; i <= 16; i++) {
      const t = i / 16;
      const u = 1 - t;
      pts.push({
        x: u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6],
        y: u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7],
      });
    }
  }
  return pts;
})();

// The wave and the breathe, both in GRID units so they ride the glyph's scale.
// `u` is 0 at the pole and 1 at the free end, and both are multiplied by it, so
// the cloth stays attached where it is nailed to the pole.
// The ripple LEADS the word: it leaves the pole at f66 and its crest is at the
// free end of the cloth on "objective" (f72), then runs off the tip by f78.
const WAVE_F0 = 66;
const WAVE_SPEED = 1 / 6; // normalised cloth lengths per frame: crest at u 0.8 on f72
const WAVE_F1 = 79;
const WAVE_AMP = 9 / FLAG_S; // realised peak ~6.4 world px after the u taper
const WAVE_LEN = 0.5; // one wavelength across the cloth
const WAVE_WIN = 0.3; // the travelling window's half-width
const BREATHE_AMP = 1.1 / FLAG_S; // ~1 world px at the tip

const clothOffset = (gx: number, frame: number) => {
  const u = clamp01((gx - 4) / 16);
  let dy = BREATHE_AMP * u * u * Math.sin(frame * 0.071);
  if (frame > WAVE_F0 && frame < WAVE_F1) {
    const c = -0.2 + (frame - WAVE_F0) * WAVE_SPEED; // from the pole out past the tip
    const d = (u - c) / WAVE_WIN;
    dy += WAVE_AMP * u * Math.exp(-d * d) * Math.sin((2 * Math.PI * (u - c)) / WAVE_LEN);
  }
  return dy;
};

const clothPath = (frame: number) => {
  let d = "";
  for (let i = 0; i < CLOTH_PTS.length; i++) {
    const p = CLOTH_PTS[i];
    const w = fg2w(p.x, p.y + clothOffset(p.x, frame));
    d += `${i === 0 ? "M" : "L"}${w.x.toFixed(2)} ${w.y.toFixed(2)}`;
  }
  return `${d}Z`;
};

// The ground under the pole, so the flag is PLANTED and not floating. It runs
// the width of the mound plus a margin: the crowd STANDS on this line, so the
// line has to be under all of it. See MOUND_RX below.
const GROUND = { y: FLAG_FOOT.y, x0: 640 - 172, x1: 640 + 172 };

// ---------------------------------------------------------------------------
// THE PERSON. One glyph, left of the flag, feet level with the pole foot.
// ---------------------------------------------------------------------------
const GLYPH = 120;
const PERSON_X = 400;
const PERSON_INK_TOP = 40 / 512;
const PERSON_FOOT = 471 / 512;
const PERSON_Y = FLAG_FOOT.y - GLYPH * PERSON_FOOT + GLYPH / 2; // feet on the ground line
const HEAD_TOP_Y = PERSON_Y - GLYPH / 2 + GLYPH * PERSON_INK_TOP;
// Where his claim on the pole leaves him: the upper right of the body box.
const SHOULDER = { x: PERSON_X + 50, y: PERSON_Y + 8 };
// The claim LEADS too: it starts on "you've" and is mid-stroke on "defined".
const CLAIM_F0 = 78;
const CLAIM_F1 = 88;
const WAKE_F0 = 73; // the person wakes before he acts
const WAKE_F1 = 81;
const PACKET_F0 = 92;

// ---------------------------------------------------------------------------
// THE CROWD. A feathered, wobbling superellipse blob below and left of the
// flag — never a box. The lattice is hashed off its cell and the boundary
// undulates, so the edge dissolves instead of ending on a rule.
// ---------------------------------------------------------------------------
const CROWD = { x: 370, y: 1115, rx: 118, ry: 52 };
const CROWD_STEP_X = 12;
const CROWD_STEP_Y = 9;
const CROWD_N = 2.4; // superellipse exponent
const CROWD_FEATHER = 0.12; // in normalised radius

type Seat = { x: number; y: number; r: number; depth: number };

const SRC_SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  const cols = Math.ceil((2 * CROWD.rx) / CROWD_STEP_X) + 2;
  const rows = Math.ceil((2 * CROWD.ry) / CROWD_STEP_Y) + 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x =
        CROWD.x - CROWD.rx - CROWD_STEP_X / 2 + c * CROWD_STEP_X + (hash(i, 11) - 0.5) * CROWD_STEP_X * 0.9;
      const y =
        CROWD.y - CROWD.ry - CROWD_STEP_Y / 2 + r * CROWD_STEP_Y + (hash(i, 12) - 0.5) * CROWD_STEP_Y * 0.9;
      const nx = Math.abs(x - CROWD.x) / CROWD.rx;
      const ny = Math.abs(y - CROWD.y) / CROWD.ry;
      const rho = Math.pow(Math.pow(nx, CROWD_N) + Math.pow(ny, CROWD_N), 1 / CROWD_N);
      const edge = 1 + wobble(Math.atan2(y - CROWD.y, x - CROWD.x) * 100, 2.3) * 0.045;
      const f = feather((edge - rho) / CROWD_FEATHER, 1);
      if (hash(i, 71) >= f) continue;
      out.push({
        x,
        y,
        r: (0.85 + 0.35 * hash(i, 13)) * (0.72 + 0.28 * f) * (1 + (hash(i, 27) - 0.5) * 2 * R_SPREAD),
        depth: clamp01(rho / edge + (hash(i, 23) - 0.5) * DEPTH_JITTER),
      });
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// THE MOUND AT THE FOOT. The crowd gathers AT the flag: the seats are a low
// mound STANDING ON the ground line around the pole foot, not a half-disc
// hanging below it — that read as roots.
//
// A feathered half-ellipse ABOVE the ground line (y <= GROUND.y), ~344 world
// px wide, denser near the pole, hashed off its own lattice and with an
// undulating rim, so it dissolves into the field instead of ending on a curve.
// Two hard constraints, both of them about the flag the crowd is gathered at:
//   * a clear band either side of the POLE, so no dot ever touches the stroke:
//     |dx| >= POLE_CLEAR, which is the pole's 3 px half-stroke plus the 14 px
//     band plus a dot's own radius.
//   * a CEILING, so no dot ever sits over the CLOTH. The cloth is nailed to the
//     pole at world y 802 and its lowest bottom edge is world y 816, so the
//     ceiling is 812 on the open left flank the crowd arrives from and 830
//     under the cloth itself. That is what caps the crest: see DEVIATIONS.
// ---------------------------------------------------------------------------
const MOUND_RX = 185; // half-width of the seat field
const MOUND_RY = 104; // and its nominal crest, before the ceiling trims it
const MOUND_STEP_X = 11.5;
const MOUND_STEP_Y = 9.8;
const MOUND_N = 2.0; // a dome, not a box
const MOUND_FEATHER = 0.24; // in normalised radius
const MOUND_DENSITY = 0.2; // how much thinner the rim is than the pole foot
const MOUND_RIM = 0.18; // the seat field runs this far past the nominal rim, so
// every seat the mill hops into is OUTSIDE the mound the 130 dots stand on.
// The DRAWN mound is those 130 seats: 309 world px across (x 487..796), 75 at
// the crest, and tapering — 75 / 75 / 67 / 50 / 22 world px tall at 30 / 60 /
// 90 / 120 / 150 px either side of the pole.
const POLE_CLEAR = 20; // world px either side of the pole's centreline
const CEIL_OPEN = 842; // the left flank: under the claim line, which runs shoulder -> pole top
const CEIL_CLOTH = 830; // under the cloth: clear of its lowest bottom edge

const moundCeil = (x: number) => (x <= FLAG_FOOT.x ? CEIL_OPEN : CEIL_CLOTH);

const DST_SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  const spanX = MOUND_RX * (1 + MOUND_RIM);
  const cols = Math.ceil((2 * spanX) / MOUND_STEP_X) + 2;
  const rows = Math.ceil((MOUND_RY * (1 + MOUND_RIM)) / MOUND_STEP_Y) + 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = 9001 + r * cols + c;
      const x =
        FLAG_FOOT.x - spanX - MOUND_STEP_X / 2 + c * MOUND_STEP_X + (hash(i, 11) - 0.5) * MOUND_STEP_X * 0.9;
      // r = 0 is the row standing ON the ground line; the mound grows UPWARD.
      const y = FLAG_FOOT.y - r * MOUND_STEP_Y - (hash(i, 12) - 0.5) * MOUND_STEP_Y * 0.9;
      const dx = x - FLAG_FOOT.x;
      if (Math.abs(dx) < POLE_CLEAR) continue; // the pole keeps its clear band
      if (y > FLAG_FOOT.y) continue; // nothing below the ground line
      if (y < moundCeil(x)) continue; // nothing over the cloth
      const nx = Math.abs(dx) / MOUND_RX;
      const ny = (FLAG_FOOT.y - y) / MOUND_RY;
      const rho = Math.pow(Math.pow(nx, MOUND_N) + Math.pow(ny, MOUND_N), 1 / MOUND_N);
      const edge = 1 + MOUND_RIM + wobble(Math.atan2(FLAG_FOOT.y - y, dx) * 100, 4.1) * 0.05;
      // Feathered rim, and thinner the further from the pole: a crowd gathered
      // AT something is densest where the something is.
      const f = feather((edge - rho) / MOUND_FEATHER, 1);
      if (hash(i, 71) >= f * (1 - MOUND_DENSITY * clamp01(rho))) continue;
      out.push({
        x,
        y,
        r: (0.85 + 0.35 * hash(i, 13)) * (0.72 + 0.28 * f) * (1 + (hash(i, 27) - 0.5) * 2 * R_SPREAD),
        depth: clamp01(rho / edge + (hash(i, 23) - 0.5) * DEPTH_JITTER),
      });
    }
  }
  // Inner RING first, shuffled INSIDE each ring: the mound still grows outward
  // from the pole, but two dots that leave the crowd one after the other land
  // on opposite sides of it rather than side by side — which is what keeps
  // neighbouring seats from filling in unison. The rule is the half-disc's; the
  // ring is measured in the MOUND's own normalised radius rather than in raw
  // px, for the same reason the depth ladder is a percentile: a ring of raw
  // distance inside a shape three times wider than it is tall fills a disc, and
  // the 130 occupied seats then come out as a flat-topped slab with the rim
  // left empty. In rho the occupied set is the mound scaled down, which is a
  // mound.
  const band = (p: Seat) =>
    Math.floor(
      Math.pow(
        Math.pow(Math.abs(p.x - FLAG_FOOT.x) / MOUND_RX, MOUND_N) +
          Math.pow((FLAG_FOOT.y - p.y) / MOUND_RY, MOUND_N),
        1 / MOUND_N,
      ) * 10,
    );
  return out.sort((a, b) => band(a) - band(b) + (hash(a.x, 5) - hash(b.x, 5)) * 0.9);
})();

const N = Math.min(130, SRC_SEATS.length - 22, DST_SEATS.length - 24);

// The depth ladder's split has to be a fraction of the CROWD, not a fraction of
// a radius: the crowd is a superellipse and the cluster a filled half-disc, so
// the same raw distance threshold puts 61% of one and 32% of the other on the
// back rung. Each seat's `depth` is replaced by its percentile among the seats
// that are actually occupied, so DEPTH_CUT 0.6 means "the outer 40%" in both.
const rankDepths = (seats: Seat[], upto: number) => {
  const idx = seats
    .slice(0, upto)
    .map((_, i) => i)
    .sort((a, b) => seats[a].depth - seats[b].depth);
  idx.forEach((i, r) => {
    seats[i].depth = r / Math.max(1, upto - 1);
  });
};
rankDepths(SRC_SEATS, SRC_SEATS.length);
rankDepths(DST_SEATS, N);

// The camera's resolved zoom per frame. The flights below are speed-capped in
// SCREEN px, and the camera is the only thing that knows how big a world px is.
// ---------------------------------------------------------------------------
// THE CAMERA. fieldShared's `camMove`, with CAM_LIFT swapped for this piece's
// LIFT of 0, and with a third axis (cx) through the same eased key-per-frame
// track and the same damper — the subject travels sideways here, from the crowd
// to the pole foot.
//
// FIVE SEGMENTS, and only five. Two long glides, one pull-back, and the two
// decaying drifts that carry a glide's velocity through its hold — a drift runs
// at warp 0.4, which puts its speed at the START, so it continues the move it
// follows and decays instead of setting off again from a stop. There is no
// dead-still frame in the piece: the held breath before "objective" is the
// natural bottom of the long glide's own ease, f62-70, where a fixed world
// point is still moving 0.7-1.2 screen px/frame.
//
//   f0-24     k 1.251 -> 1.333  x 540 -> 566  cy 914 -> 940  one glide toward
//                                                            the pole foot,
//                                                            under the lean
//   f24-68    k -> 1.510        x -> 600      cy -> 951      ONE glide: riding
//                                                            the stream and
//                                                            pushing in are a
//                                                            single motion,
//                                                            bottoming out
//                                                            f62-70 ahead of
//                                                            "objective"
//   f68-86    k -> 1.614        x -> 640      cy -> 918      decaying drift,
//                                                            onto the flag foot
//   f86-110   k -> 1.298        x -> 612      cy -> 786      the pull-back, and
//                                                            the recentre onto
//                                                            the resolved group;
//                                                            it starts inside
//                                                            the claim's draw
//   f110-114  k -> 1.281        x -> 610      cy -> 784      decaying drift
//
// Measured on four fixed world probe points: velocity never falls below 0.31
// screen px/frame, |dv| never exceeds 2.486 px/frame^2 after the first four
// frames, and the peak is 15.6 px/frame inside the pull-back.
// ---------------------------------------------------------------------------
const camMoveLift = ({
  f0,
  f1,
  k0,
  k1,
  c0,
  c1,
  x0,
  x1,
  warp = 1,
}: {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  x0: number;
  x1: number;
  warp?: number;
}) => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CXs: number[] = [];
  const span = f1 - f0;
  for (let i = 0; i <= span; i++) {
    const g = camEase(i / span, warp);
    const k = k0 + (k1 - k0) * g;
    F.push(f0 + i);
    K.push(k);
    CY.push(c0 + (c1 - c0) * g + LIFT / k);
    CXs.push(x0 + (x1 - x0) * g);
  }
  return { F, K, CY, CXs };
};

const DRIFT_DIST = 300; // screen px: where a fixed point in this piece sits

// SCALE PASS, on the director's note that the picture was small in the frame —
// the resolved graphic spanned about a third of the frame height. Every camera
// zoom key is multiplied by this and nothing else about the camera's SHAPE
// changes: the same five segments, the same frames, the same warps, the same
// C1 joins. The centres are re-solved underneath it (see CAM_SEGS), because a
// bigger k needs the picture placed differently inside the band, not because
// the move changed.
const SCALE = 1.18;

const K_OPEN = 1.06 * SCALE; // 1.251
const K_LEAN = 1.13 * SCALE; // 1.333
const K_PUSH = 1.28 * SCALE; // 1.510

const K_DRIFT = holdDriftK(K_PUSH, 18, DRIFT_DIST, 1); // 1.614
const K_REST = 1.32 * SCALE; // 1.558: the pull-back stops closer so the resolved picture fills the band
const K_TAIL = holdDriftK(K_REST, 4, DRIFT_DIST, -1);

// Five segments, and only five: two long glides, the pull-back, and the two
// decaying drifts that carry the glides' velocity through the holds. A drift
// runs at warp 0.4, which puts its speed at the start — it CONTINUES the move
// it follows and decays, instead of starting again from a stop. There is no
// dead-still stretch anywhere: the held breath before "objective" is the
// natural bottom of the long glide's own ease, f62-70.
// The centres, RE-SOLVED for the scaled zoom. Same five segments, same frames,
// same warps; the numbers are where the picture now has to sit so that every
// drawn pixel stays inside screen x 40..1040, y 60..1290 at k 1.25..1.61, and
// so the two ends and the tightest stretch are framed as asked. They were
// solved against the world-space bounding box of EVERY rendered frame — the
// content is camera-independent, so the box is measured once and the camera is
// fitted to it — and then checked back through the damper.
//   C0 914  the opening. The crowd's foot is at world y 1168 and at k 1.251
//           that is 263 screen px below the camera's centre, so the lowest cy
//           that keeps it off the caption band is 907. 914 leaves the sway its
//           5 px and puts the content's centre at screen y 933.
//   C1 940  under the lean
//   C2 951  the bottom of the long glide. The crowd is still on the field and
//           at k 1.50 its foot is 9.6 px off the band: this is a floor, not a
//           preference.
//   C3 918  the tightest stretch. The camera is centred on the FLAG FOOT —
//           screen (545, 938) at k 1.614 — which is what the crowd has just
//           gathered at.
//   C4 786  the pull-back's landing. The resolved picture is world y 617..907
//           and 786 puts its centre at screen y 928.
//   C5 784  the tail's decaying drift
// The split of the recentre between C2->C3 (f68-86, warp 0.4) and C3->C4
// (f86-110, warp 0.65) is what the 2.5 px/frame^2 acceleration ceiling buys:
// all of it in the pull-back peaks at 2.82, all of it in the drift at 2.76, and
// this 33 / 132 split peaks at 2.486. It is what keeps the two ends' centre of
// mass at screen y 933 and 928 rather than 960: 960 at the tail costs 2.64.
const C0 = 914;
const C1 = 940;
const C2 = 951;
const C3 = 918;
const C4 = 828;
const C5 = 826;
const X0 = CX;
const X1 = 566;
const X2 = 600;
const X3 = 640; // the flag foot, centred through the tightest stretch
const X4 = 612;
const X5 = 610;

const CAM_SEGS = [
  camMoveLift({ f0: 0, f1: 24, k0: K_OPEN, k1: K_LEAN, c0: C0, c1: C1, x0: X0, x1: X1, warp: 0.6 }),
  camMoveLift({ f0: 24, f1: 68, k0: K_LEAN, k1: K_PUSH, c0: C1, c1: C2, x0: X1, x1: X2, warp: 0.62 }),
  camMoveLift({ f0: 68, f1: 86, k0: K_PUSH, k1: K_DRIFT, c0: C2, c1: C3, x0: X2, x1: X3, warp: 0.4 }),
  camMoveLift({ f0: 86, f1: 110, k0: K_DRIFT, k1: K_REST, c0: C3, c1: C4, x0: X3, x1: X4, warp: 0.65 }),
  camMoveLift({ f0: 110, f1: DURATION, k0: K_REST, k1: K_TAIL, c0: C4, c1: C5, x0: X4, x1: X5, warp: 0.4 }),
];


const CAM = (() => {
  const F = [0];
  const K = [K_OPEN];
  const CY = [C0 + LIFT / K_OPEN];
  const CXs = [X0];
  for (const m of CAM_SEGS) {
    for (let i = 0; i < m.F.length; i++) {
      if (m.F[i] <= F[F.length - 1]) continue;
      F.push(m.F[i]);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
      CXs.push(m.CXs[i]);
    }
  }
  return { F, K, CY, CX: CXs };
})();


const K_AT: number[] = (() => {
  const out: number[] = [];
  for (let f = 0; f <= DURATION; f++) out.push(runCamera(f, CAM.F, CAM.CY, CAM.K).k);
  return out;
})();

// ---------------------------------------------------------------------------
// THE LAUNCH SCHEDULE. Two phases on one crowd.
//   phase A, f33-55  "achieving"  — a wide spray, rate ramping down
//   phase B, f55-78  "optimizing" — one narrow lane, 21% faster
// Both are SPEED-authored, so a flight's frame count falls out of its distance
// and no head ever crosses the set's 45 screen px/frame cap (see SPEED_* and
// the audit). The order is weighted so the far side of the crowd goes first —
// the blob contracts toward the flag as it drains.
// ---------------------------------------------------------------------------
const A_F0 = 26; // launches begin seven frames before "achieving"
const B_F1 = 74; // the last dot leaves
const LANE_F0 = 44; // the lane starts closing four frames before "or"
const LANE_F1 = 58; // and is fully closed three frames after "optimizing"
const SPEED_A = 23; // world px/frame, nominal
const SPEED_B = 26; // 21% faster, and a much shorter path
const BOW_A = [70, 130]; // wide individual arcs
const BOW_B = 1 / 3; // the arc collapses to a third of its height
const LANE = { x: 505, y: 1002 }; // the waist every phase-B flight passes through
const SEAT_DUR = 6; // deep -> ripe as it seats
const MIN_NEIGHBOUR_GAP = 2.0; // frames, between dots that share a neighbourhood
const HEAD_CAP_SCREEN = 43; // the set's ceiling is 45; 43 leaves the mill and the drift their share
// A dot's IMMEDIATE neighbours — 1.5 lattice steps, about nine dots. The
// no-unison rule is enforced on these: at this density a 2-frame exclusion over
// a wider radius is arithmetically impossible (a 46 px disc holds ~60 dots and a
// +-2 frame window holds ~22 of the 130, so every dot would have ten neighbours
// it could not avoid). STATS reports the achieved minimum at both radii.
const NEIGHBOUR_R = 18; // world px

type Dot = {
  src: number;
  dst: number;
  launch: number;
  land: number;
  b: boolean; // phase B: the lane
  bow: number;
  cx: number; // the control point of its flight
  cy: number;
  lean: number; // 0..1: how much of the 12 px anticipation it takes
  leanAt: number; // the frame its lean starts
};

const DOTS: Dot[] = (() => {
  // which seats the crowd actually occupies: hashed, so the vacancies the mill
  // hops into are scattered through the blob rather than ringed around its edge
  const order = SRC_SEATS.map((_, i) => i).sort((a, b) => hash(a, 81) - hash(b, 81));
  const taken = order.slice(0, N);

  const dist = (i: number) => Math.hypot(SRC_SEATS[i].x - FLAG_FOOT.x, SRC_SEATS[i].y - FLAG_FOOT.y);
  const dMin = Math.min(...taken.map(dist));
  const dMax = Math.max(...taken.map(dist));
  const norm = (i: number) => (dist(i) - dMin) / Math.max(1, dMax - dMin);

  // The far side and the BOTTOM of the blob go first, hashed hard enough that
  // it reads as a surge and not a wipe. Both biases exist for framing: the blob
  // contracts up and toward the flag as it drains, which is what keeps its left
  // edge off the frame's side and its foot out of the caption band while the
  // camera pans right and pushes in.
  const yMin = Math.min(...taken.map((i) => SRC_SEATS[i].y));
  const yMax = Math.max(...taken.map((i) => SRC_SEATS[i].y));
  const low = (i: number) => (SRC_SEATS[i].y - yMin) / Math.max(1, yMax - yMin);
  const key = (i: number) => 0.55 * hash(i, 3) - 0.27 * norm(i) - 0.18 * low(i);
  const seq = taken.slice().sort((a, b) => key(a) - key(b));

  // One schedule, not two: the rate ramps down across the whole pour, and the
  // lane closes continuously on top of it.
  const half = Math.floor(N / 2);
  const times: number[] = seq.map((_, i) =>
    A_F0 + (B_F1 - A_F0) * Math.pow(i / Math.max(1, N - 1), 1.25),
  );

  // NO UNISON. Two dots that share a neighbourhood in the crowd must not leave
  // within MIN_NEIGHBOUR_GAP frames of each other. `times` is fixed to the
  // schedule index, so the repair permutes WHICH dot holds which index: the
  // rate curve and the phase counts are untouched. Greedy, deterministic, and
  // it never moves a dot across the phase boundary. The achieved minimum is
  // reported by STATS.minNeighbourGap.
  const half2 = half;
  const seatNb: number[][] = taken.map((a) =>
    taken.filter((b) => b !== a && Math.hypot(SRC_SEATS[a].x - SRC_SEATS[b].x, SRC_SEATS[a].y - SRC_SEATS[b].y) <= NEIGHBOUR_R),
  );
  const nbOf = new Map<number, number[]>();
  taken.forEach((a, i) => nbOf.set(a, seatNb[i]));
  const at = new Map<number, number>(); // seat -> schedule index
  const reindex = () => {
    at.clear();
    seq.forEach((seat, i) => at.set(seat, i));
  };
  reindex();
  const bad = (i: number) =>
    (nbOf.get(seq[i]) ?? []).some((nbSeat) => {
      const j = at.get(nbSeat);
      return j !== undefined && j !== i && Math.abs(times[j] - times[i]) < MIN_NEIGHBOUR_GAP;
    });
  const wouldBad = (i: number, seat: number) =>
    (nbOf.get(seat) ?? []).some((nbSeat) => {
      const j = at.get(nbSeat);
      return j !== undefined && j !== i && Math.abs(times[j] - times[i]) < MIN_NEIGHBOUR_GAP;
    });
  for (let sweep = 0; sweep < 400; sweep++) {
    let fixed = 0;
    for (let i = 0; i < N; i++) {
      if (!bad(i)) continue;
      const lo = i < half2 ? 0 : half2;
      const hi = i < half2 ? half2 : N;
      for (let t = 1; t < hi - lo; t++) {
        const q = lo + ((i - lo + t * 37) % (hi - lo));
        if (q === i) continue;
        const a = seq[i];
        const b = seq[q];
        if (wouldBad(i, b) || wouldBad(q, a)) continue;
        seq[i] = b;
        seq[q] = a;
        at.set(b, i);
        at.set(a, q);
        fixed++;
        break;
      }
    }
    if (fixed === 0) break;
  }

  const list = seq.map((s, i) => {
    // The lane closes CONTINUOUSLY: `mix` is 0 for a dot that leaves before
    // LANE_F0 and 1 for one that leaves after LANE_F1, and everything about the
    // flight — where its control point sits, how high it bows, how fast it goes
    // — is that one number. There is no switch on a frame.
    const mix = smoothstep((times[i] - LANE_F0) / (LANE_F1 - LANE_F0));
    const b = mix > 0.5;
    const S = SRC_SEATS[s];
    const D = DST_SEATS[i];
    const dx = D.x - S.x;
    const dy = D.y - S.y;
    const L = Math.hypot(dx, dy) || 1;
    const bow =
      (hash(s, 35) - 0.5) * 2 * (BOW_A[0] + hash(s, 36) * (BOW_A[1] - BOW_A[0])) * (1 - (1 - BOW_B) * mix);
    const arcC = { x: (S.x + D.x) / 2 + (-dy / L) * bow, y: (S.y + D.y) / 2 + (dx / L) * bow };
    const laneC = { x: LANE.x + (hash(s, 37) - 0.5) * 36, y: LANE.y + (hash(s, 38) - 0.5) * 24 };
    const c = { x: arcC.x + (laneC.x - arcC.x) * mix, y: arcC.y + (laneC.y - arcC.y) * mix };
    // path length of the quadratic, coarsely, so the flight is speed-authored
    let len = 0;
    let px = S.x;
    let py = S.y;
    for (let t = 1; t <= 12; t++) {
      const u = t / 12;
      const v = 1 - u;
      const qx = v * v * S.x + 2 * v * u * c.x + u * u * D.x;
      const qy = v * v * S.y + 2 * v * u * c.y + u * u * D.y;
      len += Math.hypot(qx - px, qy - py);
      px = qx;
      py = qy;
    }
    // Speed-authored, then SCREEN-speed capped. The nominal duration comes out
    // of the path length, and is then lengthened one frame at a time until the
    // head's peak screen speed — the Bezier's own speed, which is not uniform,
    // times the camera's k on that frame — is inside the set's 45 px/frame
    // ceiling. A 12-segment average is not enough on its own: a wide arc's
    // fastest frame runs ~1.6x its mean.
    const head = (u: number) => {
      const e = arriveEase(u);
      const v = 1 - e;
      return [v * v * S.x + 2 * v * e * c.x + e * e * D.x, v * v * S.y + 2 * v * e * c.y + e * e * D.y];
    };
    const peak = (fl: number) => {
      let mx = 0;
      for (let f = Math.ceil(times[i]); f <= times[i] + fl; f++) {
        const p0 = head((f - 1 - times[i]) / fl);
        const p1 = head((f - times[i]) / fl);
        const kk = K_AT[Math.max(0, Math.min(DURATION, Math.round(f)))];
        mx = Math.max(mx, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * kk);
      }
      return mx;
    };
    // A hashed +-1.2 frame on the duration, so two dots that leave together do
    // not land together either: landings scatter independently of launches.
    let flight = Math.max(9, len / (SPEED_A + (SPEED_B - SPEED_A) * mix) + (hash(s, 39) - 0.5) * 3.2);
    while (flight < 46 && peak(flight) > HEAD_CAP_SCREEN) flight += 1;
    return {
      src: s,
      dst: i,
      launch: times[i],
      land: times[i] + flight,
      b,
      bow,
      cx: c.x,
      cy: c.y,
      lean: clamp01(1 - norm(s) * 0.85),
      leanAt: 10 + hash(s, 44) * 7,
    };
  });

  // NO UNISON, the other end. Two dots on neighbouring SEATS must not settle on
  // the same frame either. Landings are pushed later (never earlier, so the
  // speed cap above still holds) in 1.1 frame steps until every pair of seats
  // within 14 world px is at least 2 frames apart. Sixteen passes is more than
  // it ever needs; STATS.minLandGap14 reports what it achieved.
  for (let pass = 0; pass < 16; pass++) {
    let fixed = 0;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const A = DST_SEATS[list[i].dst];
        const B = DST_SEATS[list[j].dst];
        if (Math.hypot(A.x - B.x, A.y - B.y) > 14) continue;
        if (Math.abs(list[i].land - list[j].land) >= 2) continue;
        const later = list[i].land >= list[j].land ? i : j;
        list[later].land += 1.1;
        fixed++;
      }
    }
    if (fixed === 0) break;
  }
  return list;
})();

// The anticipation: up to 12 world px toward the pole foot over f15-30, hashed
// starts, weighted by how near the flag a dot already is.
const LEAN_PX = 12;
const LEAN_DUR = 14;

// ---------------------------------------------------------------------------
// THE MILL. One simulation over the whole piece, over BOTH seat systems: the
// source crowd from f0 until the last dot leaves it, and the cluster at the
// foot from the first landing to the last frame. A dot only hops to a VACANT
// neighbouring seat, and it never starts a hop it would still be inside when it
// launches, so a launch always comes off a definite seat.
// ---------------------------------------------------------------------------
const MILL_DUR = 11;
const MILL_RATE_SRC = 1.3;
const MILL_RATE_DST = 1.5;
const HOP_REACH_SRC = 34;
const HOP_REACH_DST = 17;

type Hop = { from: number; to: number; t0: number; dst: boolean };

const neighbours = (seats: Seat[], reach: number) =>
  seats.map((a, i) =>
    seats
      .map((b, j) => ({ b, j }))
      .filter(({ b, j }) => j !== i && Math.hypot(b.x - a.x, b.y - a.y) <= reach)
      .map(({ j }) => j),
  );
const NB_SRC = neighbours(SRC_SEATS, HOP_REACH_SRC);
const NB_DST = neighbours(DST_SEATS, HOP_REACH_DST);

const HOPS: Hop[][] = DOTS.map(() => []);
const LAUNCH_SEAT: number[] = DOTS.map((d) => d.src);
(() => {
  const srcOcc = new Int32Array(SRC_SEATS.length).fill(-1);
  const dstOcc = new Int32Array(DST_SEATS.length).fill(-1);
  const seatSrc = DOTS.map((d) => d.src);
  const seatDst = DOTS.map((d) => d.dst);
  DOTS.forEach((d, i) => {
    srcOcc[d.src] = i;
  });
  const busy = new Float64Array(N).fill(-1);
  let accS = 0;
  let accD = 0;
  let id = 0;
  for (let f = 0; f <= DURATION; f++) {
    DOTS.forEach((d, i) => {
      if (f >= d.launch && f - 1 < d.launch) {
        LAUNCH_SEAT[i] = seatSrc[i];
        srcOcc[seatSrc[i]] = -1;
      }
      if (f >= d.land && f - 1 < d.land) dstOcc[seatDst[i]] = i;
    });

    const run = (
      rate: number,
      acc: number,
      occ: Int32Array,
      nb: number[][],
      seatOf: number[],
      isDst: boolean,
    ) => {
      acc += rate;
      while (acc >= 1) {
        acc -= 1;
        const jj = id++;
        const start = Math.floor(hash(jj, 51) * N);
        let pick = -1;
        let free: number[] = [];
        for (let t = 0; t < N; t++) {
          const c = (start + t) % N;
          const inSrc = f < DOTS[c].launch;
          const inDst = f >= DOTS[c].land + 1;
          if (isDst ? !inDst : !inSrc) continue;
          if (busy[c] > f) continue;
          if (!isDst && DOTS[c].launch < f + MILL_DUR) continue;
          const cand = nb[seatOf[c]].filter((q) => occ[q] < 0);
          if (cand.length === 0) continue;
          pick = c;
          free = cand;
          break;
        }
        if (pick < 0) break;
        const from = seatOf[pick];
        const to = free[Math.floor(hash(jj, 52) * free.length) % free.length];
        occ[from] = -1;
        occ[to] = pick;
        seatOf[pick] = to;
        busy[pick] = f + MILL_DUR;
        HOPS[pick].push({ from, to, t0: f, dst: isDst });
      }
      return acc;
    };

    accS = run(MILL_RATE_SRC, accS, srcOcc, NB_SRC, seatSrc, false);
    accD = run(MILL_RATE_DST, accD, dstOcc, NB_DST, seatDst, true);
  }
})();

// ---------------------------------------------------------------------------
// DARK TRAFFIC. Idle accent threads between neighbouring dots at 0.12, no
// heads, at the house rate. A dot that has not landed carries none, and the
// traffic thins to 60% across the tail.
// ---------------------------------------------------------------------------
const TRAFFIC_N = idleThreads(N);
const TRAFFIC_REACH = 64;

// THE MICRO-DRIFT. Two hashed sines per axis, +-3 world px, never in unison.
const micro = (i: number, f: number) => ({
  dx:
    1.8 * Math.sin(f * 0.2417 + hash(i, 17) * 6.283) +
    1.2 * Math.sin(f * 0.1533 + hash(i, 19) * 6.283),
  dy:
    1.7 * Math.sin(f * 0.2094 + hash(i, 18) * 6.283) +
    1.3 * Math.sin(f * 0.1396 + hash(i, 20) * 6.283),
});

// ---------------------------------------------------------------------------

const OptimizingTheObjective: React.FC<Props> = ({
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
  dotOpacity,
  personSrc,
  beats,
}) => {
  const frame = useCurrentFrame();
  const toRipe = makeTone(accentDeep, accent); // at rest -> it has reached the flag

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const camX = runCamera(frame, CAM.F, CAM.CX, CAM.K).cy;
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the dots --------------------------------------------------------------
  const seatPos = (seats: Seat[], i: number, dst: boolean) => {
    // where this dot's seat is right now — the mill moves it from seat to seat
    const hs = HOPS[i].filter((h) => h.dst === dst);
    let cur = dst ? DOTS[i].dst : DOTS[i].src;
    let live: Hop | null = null;
    for (const h of hs) {
      if (frame >= h.t0 + MILL_DUR) cur = h.to;
      else if (frame >= h.t0) {
        live = h;
        break;
      } else break;
    }
    if (live) {
      const u = clamp01((frame - live.t0) / MILL_DUR);
      const e = arriveEase(u);
      const A = seats[live.from];
      const B = seats[live.to];
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const L = Math.hypot(dx, dy) || 1;
      const bow = Math.sin(Math.PI * e) * (hash(i, 61) - 0.5) * 7;
      return {
        x: A.x + dx * e + (-dy / L) * bow,
        y: A.y + dy * e + (dx / L) * bow,
        seat: cur,
        moving: clamp01(Math.min(u, 1 - u) / 0.2),
      };
    }
    return { x: seats[cur].x, y: seats[cur].y, seat: cur, moving: 0 };
  };

  const dots = DOTS.map((d, i) => {
    const flying = frame >= d.launch && frame < d.land;
    const landed = frame >= d.land;

    const leanU = smoothstep((frame - d.leanAt) / LEAN_DUR);
    const leanAmt = LEAN_PX * d.lean * leanU;

    let x: number;
    let y: number;
    let moving = 0;
    let depthT: number;

    if (!flying && !landed) {
      const p = seatPos(SRC_SEATS, i, false);
      const ang = Math.atan2(FLAG_FOOT.y - p.y, FLAG_FOOT.x - p.x);
      x = p.x + Math.cos(ang) * leanAmt;
      y = p.y + Math.sin(ang) * leanAmt;
      moving = p.moving;
      depthT = 0;
    } else if (landed) {
      const p = seatPos(DST_SEATS, i, true);
      x = p.x;
      y = p.y;
      moving = p.moving;
      depthT = 1;
    } else {
      const S = SRC_SEATS[LAUNCH_SEAT[i]];
      const ang = Math.atan2(FLAG_FOOT.y - S.y, FLAG_FOOT.x - S.x);
      const sx = S.x + Math.cos(ang) * LEAN_PX * d.lean;
      const sy = S.y + Math.sin(ang) * LEAN_PX * d.lean;
      const D = DST_SEATS[d.dst];
      const u = arriveEase(clamp01((frame - d.launch) / (d.land - d.launch)));
      const v = 1 - u;
      x = v * v * sx + 2 * v * u * d.cx + u * u * D.x;
      y = v * v * sy + 2 * v * u * d.cy + u * u * D.y;
      moving = clamp01(Math.min(u, 1 - u) / 0.18);
      depthT = smoothstep(u);
    }

    // the depth ladder follows the dot from the crowd to the cluster
    const backA = SRC_SEATS[d.src].depth > DEPTH_CUT;
    const backB = DST_SEATS[d.dst].depth > DEPTH_CUT;
    const op = (backA ? OP_BG : OP_FG) + ((backB ? OP_BG : OP_FG) - (backA ? OP_BG : OP_FG)) * depthT;
    const rs =
      (backA ? BG_R_SCALE : 1) + ((backB ? BG_R_SCALE : 1) - (backA ? BG_R_SCALE : 1)) * depthT;
    const dm = (backA ? BG_DRIFT : 1) + ((backB ? BG_DRIFT : 1) - (backA ? BG_DRIFT : 1)) * depthT;
    const seatR = SRC_SEATS[d.src].r + (DST_SEATS[d.dst].r - SRC_SEATS[d.src].r) * depthT;

    const md = micro(i, frame);
    return {
      x: x + md.dx * dm,
      y: y + md.dy * dm,
      r: seatR * rs,
      op,
      back: (backA ? 1 : 0) + ((backB ? 1 : 0) - (backA ? 1 : 0)) * depthT > 0.5,
      moving,
      ripe: clamp01((frame - d.land) / SEAT_DUR),
      landed,
    };
  });

  // -- dark traffic ----------------------------------------------------------
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number };
  const traffic: Th[] = [];
  const trafficCount = Math.round(TRAFFIC_N * (frame < beats.end ? 1 : 0.6));
  for (let j = 0; j < trafficCount; j++) {
    const period = 40 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * N);
    const A = dots[a];
    if (!A) continue;
    let b = -1;
    for (let n = 0; n < 12; n++) {
      const cnd = Math.floor(hash(seed + n * 17, 8) * N);
      const C = dots[cnd];
      if (cnd === a || !C) continue;
      if (C.landed !== A.landed) continue;
      if (Math.hypot(C.x - A.x, C.y - A.y) <= TRAFFIC_REACH) {
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

  // -- the person's claim on the pole ---------------------------------------
  const claim = arriveEase(clamp01((frame - CLAIM_F0) / (CLAIM_F1 - CLAIM_F0)));
  const claimHead = {
    x: SHOULDER.x + (POLE_TOP.x - SHOULDER.x) * claim,
    y: SHOULDER.y + (POLE_TOP.y - SHOULDER.y) * claim,
  };
  const packetAt = (f: number) => {
    if (f < PACKET_F0) return null;
    const p = packetsOn({
      frame: f,
      k,
      from: SHOULDER,
      to: POLE_TOP,
      period: 12,
      phase: PACKET_F0,
      speed: 13,
      opacity: 1,
      seed: 3,
    });
    return p.length === 0 ? null : p[0];
  };

  // -- the person ------------------------------------------------------------
  const swayX = (1.5 / k) * Math.sin(frame * 0.083 + 0.9);
  const swayY = (1.2 / k) * Math.sin(frame * 0.061 + 2.4);
  const lift = 4 * smoothstep((frame - WAKE_F0) / (WAKE_F1 - WAKE_F0));

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
        cxRest={CAM.CX[0]}
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
            {/* dark traffic: the crowd is unlooked-at, not dead. No heads. */}
            {traffic.map((t) => (
              <line
                key={t.key}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={accent}
                strokeWidth={STROKE * 0.3}
                strokeLinecap="round"
                opacity={t.op}
              />
            ))}

            {/* the AIs, on the depth ladder: the back of the crowd first and
                dimmer, then its core over the top. Tone still means state —
                only opacity and size say how far back a dot is. */}
            {[true, false].map((backPass) =>
              dots.map((d, i) =>
                d.back !== backPass ? null : (
                  <circle
                    key={`${backPass ? "b" : "c"}${i}`}
                    cx={d.x}
                    cy={d.y}
                    r={dotRadius * d.r * breath(frame, hash(i, 9)) * (1 + 0.22 * d.moving)}
                    fill={toRipe(d.ripe)}
                    opacity={dotOpacity * d.op}
                  />
                ),
              ),
            )}

            {/* the ground the flag is planted in, and the person's claim on the
                pole: the containers, one rung back from the things themselves */}
            <g style={{ filter: icon }}>
              <line
                x1={GROUND.x0}
                y1={GROUND.y}
                x2={GROUND.x1}
                y2={GROUND.y}
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                opacity={OP_MID}
              />
              {claim > 0 ? (
                <line
                  x1={SHOULDER.x}
                  y1={SHOULDER.y}
                  x2={claimHead.x}
                  y2={claimHead.y}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={OP_MID}
                />
              ) : null}
              {claim > 0 && claim < 1 ? (
                <circle cx={claimHead.x} cy={claimHead.y} r={5.5 / k} fill={ink} opacity={OP_FG} />
              ) : null}
            </g>

            {/* the objective: Lucide `flag`, planted, waving once on the word */}
            <g
              style={{ filter: icon }}
              fill="none"
              stroke={ink}
              strokeWidth={GLYPH_STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={OP_FG}
            >
              <line x1={FLAG_FOOT.x} y1={FLAG_FOOT.y} x2={POLE_TOP.x} y2={POLE_TOP.y} />
              <path d={clothPath(frame)} />
            </g>

            {/* signal on the landed claim */}
            {claim >= 1 ? <Packet frame={frame} k={k} at={packetAt} opacity={0.6} /> : null}
          </svg>

          {/* the person: white, with the small shadow that makes a glyph read
              as a thing standing on the field. Sways, and lifts before he acts. */}
          <Img
            src={staticFile(personSrc)}
            style={{
              position: "absolute",
              left: PERSON_X - GLYPH / 2 + swayX,
              top: PERSON_Y - GLYPH / 2 + swayY - lift / k,
              width: GLYPH,
              height: GLYPH,
              filter: `brightness(0) invert(1) ${icon}`,
              opacity: OP_FG,
            }}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default OptimizingTheObjective;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  like: defaultProps.beats.like,
  achieving: defaultProps.beats.achieving,
  optimizing: defaultProps.beats.optimizing,
  objective: defaultProps.beats.objective,
  defined: defaultProps.beats.defined,
  end: defaultProps.beats.end,
};
export const CAM_AT = (f: number) => ({
  ...runCamera(f, CAM.F, CAM.CY, CAM.K),
  cx: runCamera(f, CAM.F, CAM.CX, CAM.K).cy,
});
export const STATS = {
  dots: N,
  srcSeats: SRC_SEATS.length,
  dstSeats: DST_SEATS.length,
  hops: HOPS.reduce((a, h) => a + h.length, 0),
  backSrc: DOTS.filter((d) => SRC_SEATS[d.src].depth > DEPTH_CUT).length,
  backDst: DOTS.filter((d) => DST_SEATS[d.dst].depth > DEPTH_CUT).length,
  phaseA: DOTS.filter((d) => !d.b).length,
  launchedBy55: DOTS.filter((d) => d.launch <= 55).length,
  airborneBy: Math.max(...DOTS.map((d) => d.launch)),
  seatedBy: Math.max(...DOTS.map((d) => d.land)),
  flightA: [
    Math.min(...DOTS.filter((d) => !d.b).map((d) => d.land - d.launch)),
    Math.max(...DOTS.filter((d) => !d.b).map((d) => d.land - d.launch)),
  ],
  flightB: [
    Math.min(...DOTS.filter((d) => d.b).map((d) => d.land - d.launch)),
    Math.max(...DOTS.filter((d) => d.b).map((d) => d.land - d.launch)),
  ],
  minGap18: (() => {
    let m = 1e9;
    for (let i = 0; i < DOTS.length; i++)
      for (let j = i + 1; j < DOTS.length; j++) {
        const A = SRC_SEATS[DOTS[i].src];
        const B = SRC_SEATS[DOTS[j].src];
        if (Math.hypot(A.x - B.x, A.y - B.y) > NEIGHBOUR_R) continue;
        m = Math.min(m, Math.abs(DOTS[i].launch - DOTS[j].launch));
      }
    return Number(m.toFixed(2));
  })(),
  minLandGap14: (() => {
    let m = 1e9;
    for (let i = 0; i < DOTS.length; i++)
      for (let j = i + 1; j < DOTS.length; j++) {
        const A = DST_SEATS[DOTS[i].dst];
        const B = DST_SEATS[DOTS[j].dst];
        if (Math.hypot(A.x - B.x, A.y - B.y) > 14) continue;
        m = Math.min(m, Math.abs(DOTS[i].land - DOTS[j].land));
      }
    return Number(m.toFixed(2));
  })(),
  stroke: STROKE,
  glyphStroke: GLYPH_STROKE,
  flagBox: FLAG_BOX,
  moundTop: Math.min(...DST_SEATS.slice(0, N).map((s2) => s2.y)),
  moundX: [Math.min(...DST_SEATS.slice(0, N).map((s2) => s2.x)), Math.max(...DST_SEATS.slice(0, N).map((s2) => s2.x))],
  moundPoleGap: Math.min(...DST_SEATS.slice(0, N).map((s2) => Math.abs(s2.x - FLAG_FOOT.x))),
};
export const DOTS_DEBUG = DOTS.map((d, i) => ({
  i,
  src: SRC_SEATS[d.src],
  dst: DST_SEATS[d.dst],
  launch: d.launch,
  land: d.land,
  b: d.b,
  cx: d.cx,
  cy: d.cy,
  lean: d.lean,
}));
export const WORLD_INK = {
  flag: { x0: FLAG_FOOT.x, x1: fg2w(20, 0).x, y0: fg2w(0, 2).y, y1: FLAG_FOOT.y },
  ground: GROUND,
  person: { x: PERSON_X, y: PERSON_Y, top: HEAD_TOP_Y },
  crowd: CROWD,
  mound: { x: FLAG_FOOT.x, y: FLAG_FOOT.y, rx: MOUND_RX, ry: MOUND_RY, poleClear: POLE_CLEAR },
};
