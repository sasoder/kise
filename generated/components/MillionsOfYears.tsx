import { AbsoluteFill, useCurrentFrame } from "remotion";
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
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  WOBBLE_R,
  breath,
  camMove,
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
import { DARK_TRAFFIC_OPACITY, arriveEase, packetsOn } from "./levelUp";
import { CLAUDE } from "./brandGlyphs";

export const FPS = 24;

// ---------------------------------------------------------------------------
// John Charles Beren, clip `JohnCharlesBeren_Experience`, cut `MillionsOfYears`:
// "a model will get to, through all its instances, get to experience millions
//  of years of deployment across all kinds of economically relevant work in the
//  economy."
//
// DURATION. The composition starts at SRT 7.280 s, so every beat is
//   frame = round((t - 7.280) * 24)
//     a f0 · model f1 · will f11 · get f15 · to f18 · through f28 · all f34 ·
//     its f42 · instances f45 · will f61 · get f62 · to f64 · experience f67 ·
//     millions f77 · of f88 · years f94 · of f101 · deployment f116 ·
//     across f130 · all f138 · kinds f145 · of f154 · economically f158 ·
//     relevant f167 · work f174 · in f184 · the f188 · economy f191 ·
//     next word "and" f204
// Speech therefore runs f0..204 and the set's 16-frame tail holds the resolved
// state: DURATION = 204 + 16 = 220.
export const DURATION = 220;

// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "one dot pours out endlessly into six kinds of work and the ring around
//    them is the economy; the work flows back to the dot."
//
// VOCABULARY, fixed:
//   the model      = THE CLAUDE MARK, filled ACCENT, on the column axis: the
//                    brandGlyphs 24-unit box drawn as inline <path>, 72 world
//                    px across (73 screen px at the resolved k 1.02, 403 at the
//                    opening 5.6), with iconShadow and the breath the core dot
//                    always had. It never moves off the axis, it is in the
//                    picture from f0, and it is the top of the z-order: no
//                    lane, dot, packet or thread is ever drawn across it.
//   its instances  = solid orange dots at DOT_RADIUS, ACCENT_DEEP at rest and
//                    ACCENT once they have reached work.
//   work           = six Lucide OUTLINE icons in station rings (R 64 world),
//                    white ink: code, stethoscope, banknote, wrench, scale,
//                    factory. Only a ring's STROKE ever converts; the icon
//                    inside it stays white.
//   lanes, economy = white ink lines at the set's one stroke weight.
// No text, no numbers, no person glyph, no other prop. Orange means "the model
// and its instances" and nothing else.
//
// ---------------------------------------------------------------------------
// GESTURES — the word each one lands on and the frames it runs over. Every
// gesture leads its word and overlaps its neighbour; nothing starts from a dead
// stop and nothing in the piece is outside this list.
//
//  1. f0    "a model"          THE CORE. The orange Claude mark at world (540, 960),
//                              screen y 835 at every camera (CAM_LIFT). Alive
//                              from frame 0: breath, micro-drift, grid parallax
//                              and the camera's opening creep already running.
//  2. f10-61 "will get to"      THE SPAWN. 100 instances leave the core on
//           "all its instances" individual hashed arcs (arriveEase, tangential
//           (f34/f42/f45)      bow, no two in unison) and seat into a feathered
//                              blob r 52..148 around it — a clear ring of the
//                              mark's half-box + 16 is left around it so the
//                              model is never buried by its own instances.
//                              The first dots are out at f10 — on "a model WILL
//                              GET TO", eighteen frames before "through", and
//                              early enough that no 12-frame window of the piece
//                              holds a still frame. From f45 the core releases a
//                              free dot
//                              every ~2 frames and NEVER stops again.
//  3. f61-116 "get to          THE POUR. From f61 the blob opens into SIX radial
//           experience" (f67)  lanes (0/60/120/180/240/300 deg — the hex set
//           "millions of       rotated so no lane is vertical, which keeps the
//            years" (f77/f94)  top and bottom stations inside the caption band).
//                              Each blob dot rejoins its nearest lane and pours
//                              outward INTO THE WORK — never past it. Thin white
//                              lane lines draw head-led from the core outward
//                              f64-104. On "millions" (f77) the emission ramps to
//                              2.4 dots/frame and holds there to f218, so a lane
//                              carries a dot every ~26 world px and the pour never
//                              reads as stopping.
//                              THE POUR ENDS AT THE WORK: a dot on a lane is
//                              ABSORBED when it reaches the outer edge of its
//                              station's annulus (the annulus circle, so the
//                              arriving front curves with the crowd), takes a
//                              vacant annulus seat if one exists — none ever does
//                              here, see DEVIATIONS — and otherwise DISSOLVES:
//                              radius to 0 over 6 frames while it decelerates
//                              into the edge on arriveEase, no flash, no ripple.
//                              The rule is world-space and runs from f0, so
//                              before a station enters frame its absorption point
//                              is off-frame too and nothing visible changes.
//                              Nothing orange exists outside the annuli.
//  4. f67-174 "deployment      THE STATIONS. Six station rings with their Lucide
//           across all kinds   icons sit at the lane ends. They are never spawned:
//           of economically    they are out of frame at f0 and the camera finds
//           relevant work"     them as it pulls back — the four diagonal ones
//           (f116..f174)       cross the top and bottom edges from ~f60, the two
//                              on the horizontal lanes from ~f111, just before
//                              "deployment". Dots that will seat depart from f67
//                              ("experience"), run the lane, wrap around the ring
//                              at the annulus' outer radius and step into their
//                              seat; they go deep -> ripe as they seat. Every
//                              OTHER dot on the lane is absorbed at that same
//                              outer edge (gesture 3), so the annulus is where
//                              the pour visibly ends. Each
//                              ring's stroke converts white -> ACCENT_DEEP when
//                              its 8th dot lands and -> ACCENT six frames later.
//                              The rings light in arrival order (shortest lane
//                              first) over f128..f173, so "work" (f174) lands as
//                              the last ring finishes turning ripe.
//  5. f180-197 "in the         THE RING. One white circle R 457 closes around all
//           economy" (f191)    six stations, drawn head-led as six arcs (one per
//                              station, see DEVIATIONS), ~77% closed on
//                              "economy" and shut at f197.
//  6. f191-220                 THE TAIL. Packets run BACK along every lane from
//                              station to core — experience returning — ripe,
//                              one per lane every 10 f on hashed phases. The pour
//                              continues outward on the same lanes at full rate
//                              and goes on being absorbed at the annuli, so the
//                              lanes stay full to the last frame while nothing
//                              orange ever crosses the economy ring. The annuli
//                              mill, dark traffic thins to 60%, and the camera
//                              keeps a decaying drift.
//
// ---------------------------------------------------------------------------
// LIVENESS — mechanisms, not gestures. None is on a word and none ever stops:
//   * micro-drift on every dot, +-3 world px on two hashed sines, seated, in
//     flight and through the tail; back-rung dots ride 1.45x of it.
//   * the mill in each station annulus, from that annulus' first landing to the
//     last frame: a hop to a vacant neighbouring seat on arriveEase.
//   * the emission, which never stops after f45.
//   * dark traffic between seated neighbours at 0.12, no heads.
//   * the grid's parallax and its own -0.3 px/frame drift.
//   * the camera never parks: three long glides and three decaying drifts.
//
// THE DEPTH LADDER. DOTS ARE SOLID: every instance, in flight, in a lane, in the
// blob or seated at the front of an annulus, is drawn at OP_UNREAD_DOT = 1.0,
// and its depth is carried by TONE (deep vs ripe) and by size, never by alpha —
// the orange Dwarkesh rule, "transparency on the dots was the root of washed out
// every time". The one surviving rung on a dot is the BACK of a SEATED annulus
// at OP_MID 0.78, reached on the seating ramp. The back rungs of the pour and of
// the blob keep only their 0.8x radius and 1.45x micro-drift.
//   INK, unchanged:
//   FG  1.00  the core, a lit station's ring and icon, lane and ring heads
//   MID 0.78  the containers: lane lines, station rings, the economy ring
//
// ---------------------------------------------------------------------------
// CAMERA — one keyed track, damped through runCamera, c constant at 960 because
// the whole composition is radially symmetric about the core, so the ink centre
// is the core at every frame and cy = 960 + 125/k puts it on screen y 835.
//
//   f0-56    k 5.600 -> 5.300  warp 0.70  the opening creep: the stations are
//                                         still outside the frame
//   f56-130  k 5.300 -> 1.300  warp 0.95  ONE long glide out, following the pour;
//                                         the stations come into frame on it
//   f130-156 k 1.300 -> 1.288  warp 0.45  the glide's own direction, decaying
//   f156-188 k 1.288 -> solved warp 0.85  the last widen, to admit the economy
//                                         ring; lands 3 f before it starts to draw
//   f188-268 k       -> -0.035 warp 0.50  a drift that is still running when the
//                                         piece ends, so no frame is ever static
//
// The opening k is 5.60 and not less because of the BOTTOM diagonal stations:
// the content centre sits on screen y 835 (CAM_LIFT), so there are 1085 px of
// frame below it and only 835 above, and the shortest bottom station, 0.866 *
// 335 from the core, needs k * (0.866 * 335 - 67 - 5) > 1085 — the 5 is the
// camera's own sway — i.e. k > 4.97, to be outside the bottom edge. The glide
// from 5.30 carries them in at f66-72; the top pair clear at 3.9 and enter at
// f84-88; the two on the horizontal lanes need only k > 2.05 and come in at
// f112-115, just before "deployment".
//
// The resting k is SOLVED so the damped camera reads exactly 1.02 on the last
// frame, and every weight in the piece is the screen number divided by it.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//   * THE OPENING k IS 4.75, NOT 2.4, AND THE STATIONS ENTER f60-111 RATHER
//     THAN f110-116. The two are one constraint. A station on a diagonal lane
//     sits 0.866 * R from the core; for its ring ink to be outside the frame the
//     camera needs 960 / k < 0.866 * R - 67. The resolved picture fixes R: the
//     economy ring has to fit the caption band (content centre screen 835,
//     nothing above 300 or below 1370, side margins >= 60), which caps its
//     screen radius at 480 and so, at the spec's dot and stroke sizes (k ~ 1),
//     its world radius at ~457 and the stations at ~337. That makes the
//     threshold k = 4.44. So the stations are out of frame at f0 only if the
//     camera opens above 4.44, and they necessarily enter as soon as it drops
//     below it — there is no camera that holds them out to f110 and still
//     reaches 1.02 by f188 without a lurch. They are still never spawned: they
//     are there from f0 and the camera finds them, four of them while the lane
//     lines are drawing and two just before "deployment".
//   * THE ECONOMY RING IS DRAWN AS SIX SIMULTANEOUS HEADS, one per station,
//     each sweeping the 60 degrees to the next. A single head cannot do it: the
//     circumference is 2 * pi * 457 = 2871 world px, and the set's 45 screen
//     px/frame ceiling at k 1.02 is 44 world px/frame, so one head needs 65
//     frames and the gesture is 17. Six heads make each arc 478 px at 28.2
//     world px/frame (36.6 at the arriveEase cruise, 37 screen px/f), inside the
//     ceiling — and the ring then reads as the six kinds of work joining up,
//     which is what the line says. It is ~77% closed on "economy" (f191) rather
//     than 60% and shut at f197.
//   * THE LANE LENGTHS DIFFER BY +-10 WORLD PX, NOT +-40, and the arrival
//     stagger is carried by the fill schedule rather than by the lengths. +-40
//     is +-5 frames at the seating speed, which cannot spread six rings over 45
//     frames; and at +-40 the annuli reach 439..515 world px, so no single
//     circle passes outside all of them. The causal story is kept: the stations
//     are ranked by lane length and the SHORTEST lane fills first.
//   * 26 DOTS SEAT PER STATION (156 in all) rather than one annulus of the
//     blob's size: a ring of R 64 with an annulus 76..114 holds about 100 seats
//     at the spec's dot, and 26 is the density that reads as a crowd against the
//     ring without burying it, with the rest of the seats left vacant for the
//     mill.
//   * THE FREE EMISSION HOLDS AT 2.4/FRAME, NOT ~1. At 1/frame split six ways a
//     lane carries one dot every 78 world px, which renders as loose dust rather
//     than a pour: measured on the first cut of this piece, the tail frames read
//     as an empty diagram with specks around it. 2.4 puts a dot every ~26 px of
//     lane, which is a stream. The emission is also thicker still between f61 and
//     f126, because the blob's 100 dots and the 156 seaters are leaving the core
//     in that window on top of it — that IS "millions": the pour is heaviest
//     while "millions of years of deployment" is being said.
//   * AN ABSORBED DOT NEVER FINDS A VACANT SEAT, SO THE POUR RESOLVES ENTIRELY
//     INTO THE DISSOLVE. An annulus holds ~90 seats; 26 are the station's own
//     seaters and the other ~64 are blue-noise vacancies that exist so the mill
//     always has somewhere to hop. The free stream delivers ~68 dots per lane
//     between f66 and f219; letting them take those vacancies would fill every
//     annulus solid by "work", bury the ring the crowd is supposed to be
//     standing around, and stop the mill dead. So `vacantSeatFor` is -1 by
//     construction and every lane arrival dissolves into the annulus edge. The
//     seat branch is written into the rule because it is what the mechanism
//     means — the work takes the instance in — and the dissolve is that same
//     take-in when the work is already staffed.
//   * THE MARK REPLACES THE CORE DOT WITHOUT RE-TIMING ANYTHING. The three
//     radii the picture needs around a 72 px mark — the blob's clear ring at
//     half-box + 16 = 52, the lanes' inner end at half-box + 10 = 46, and the
//     emergence at the half-box itself, 36 — are all applied where they are
//     DRAWN and not in the flight tables, because every table here is keyed on
//     a hashed index and any change to one deals a different world:
//       - the blob's seat grid, its feather knee (BLOB_R0 42) and its selection
//         hash are untouched; the clear ring is a radial push on the seats that
//         fell inside 52, so the same hundred dots leave on the same frames
//         down the same lanes and only those few sit further out.
//       - CORE_EDGE stays 12, so a dot's path is the path it always had; the
//         emergence is a gate on its DRAWN RADIUS by distance from the centre,
//         0 inside 36 and 1 by 58. A dot therefore appears out of the mark's
//         edge rather than out of its centre, and nothing past 58 px moves.
//       - the return packets still parametrise on LANE_R0 34 (a shorter run
//         would re-time every packet along all 231 px of lane) and are gated to
//         nothing by LANE_IN 46, where they are already at 28% opacity.
//     Measured against the frames before the change, the whole difference in
//     this cut and in HiveMind lies inside 76 world px of the centre.
//   * EVERY FLIGHT'S RADIAL SPEED IS CAPPED AGAINST THE CAMERA, not authored
//     flat: the free stream moves at min(13, 42 / k) world px/frame off one
//     shared cumulative-distance table, and a seater's flight is lengthened a
//     frame at a time until its peak screen head speed is inside 42. At the
//     opening zoom of 4.75 a flat 13 would be 62 screen px/frame.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: an instance that has reached work
  accentDeep: z.string(), // deep: an instance at rest, and a ring being taken
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
  dotOpacity: z.number(),
  beats: z.object({
    a: z.number(),
    through: z.number(),
    instances: z.number(),
    experience: z.number(),
    millions: z.number(),
    years: z.number(),
    deployment: z.number(),
    work: z.number(),
    economy: z.number(),
    end: z.number(), // next word "and"; tail to 220
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
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    a: 0,
    through: 28,
    instances: 45,
    experience: 67,
    millions: 77,
    years: 94,
    deployment: 116,
    work: 174,
    economy: 191,
    end: 204,
  },
});

export const WORLD_W = 1080;
export const WORLD_H = 1920;
export const CX = 540;
export const CORE = { x: CX, y: 960 };

// --- the depth ladder ------------------------------------------------------
export const OP_FG = 1.0;
export const OP_MID = 0.78;
// OP_BG (0.55) is gone from the dots: a dot is solid wherever it is, and the
// only alpha rung left on one is OP_MID on the back of a seated annulus. The
// ink keeps its ladder.
const BG_R_SCALE = 0.8;
const BG_DRIFT = 1.45;
const BACK_FRACTION = 0.4; // the outer 40% of an annulus goes on the back rung
const DEPTH_JITTER = 0.34; // hashed, so the band is feathered and not a ring
const R_SPREAD = 0.18; // +-18% hashed per-dot radius
const POUR_BACK = 0.35; // and the back 35% of the pour

// ---------------------------------------------------------------------------
// THE CAMERA. fieldShared's camMove verbatim — one key per frame on an eased
// curve, cy taken off the eased k, the set's CAM_LIFT of 125 — then the shared
// damper. c is constant: the composition is radially symmetric about the core,
// so the ink centre IS the core at every frame.
// ---------------------------------------------------------------------------
const K_REST_TARGET = 1.02;
const LAST = DURATION - 1;
export const C_FIXED = CORE.y;

type Seg = { f0: number; f1: number; k0: number; k1: number; warp: number };

const segsFor = (kEnd: number): Seg[] => [
  { f0: 0, f1: 56, k0: 5.6, k1: 5.3, warp: 0.7 },
  { f0: 56, f1: 130, k0: 5.3, k1: 1.3, warp: 0.95 },
  { f0: 130, f1: 156, k0: 1.3, k1: 1.288, warp: 0.45 },
  { f0: 156, f1: 188, k0: 1.288, k1: kEnd, warp: 0.85 },
  { f0: 188, f1: DURATION + 48, k0: kEnd, k1: kEnd - 0.035, warp: 0.5 },
];

const trackOf = (segs: Seg[]) => {
  const F: number[] = [0];
  const K: number[] = [segs[0].k0];
  const CY: number[] = [C_FIXED + CAM_LIFT / segs[0].k0];
  for (const s of segs) {
    const m = camMove({ ...s, c0: C_FIXED, c1: C_FIXED });
    for (let i = 0; i < m.F.length; i++) {
      if (m.F[i] <= F[F.length - 1]) continue;
      F.push(m.F[i]);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    }
  }
  return { F, K, CY };
};

const kAtLast = (kEnd: number) => {
  const t = trackOf(segsFor(kEnd));
  return runCamera(LAST, t.F, t.CY, t.K).k;
};
export const K_END = (() => {
  const a = 0.95;
  const b = 1.1;
  const fa = kAtLast(a);
  const fb = kAtLast(b);
  return a + ((K_REST_TARGET - fa) * (b - a)) / (fb - fa);
})();
/** The zoom every weight in the piece is written against. */
export const K_REST = kAtLast(K_END);

export const CAM = trackOf(segsFor(K_END));

const CAM_AT_F: { cy: number; k: number }[] = (() => {
  const out: { cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION; f++) {
    const c = runCamera(f, CAM.F, CAM.CY, CAM.K);
    out.push({ cy: c.cy + sway(f).dy, k: c.k });
  }
  return out;
})();
const kAt = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION, Math.round(f)))].k;
const screenAt = (f: number, wx: number, wy: number) => {
  const c = CAM_AT_F[Math.max(0, Math.min(DURATION, Math.round(f)))];
  return [CX + (wx - (CX + sway(f).dx)) * c.k, 960 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------
// THE WEIGHTS, in SCREEN px at the resting zoom. One weight for every outline:
// the station rings, the six icons, the lane lines and the economy ring.
// ---------------------------------------------------------------------------
const SCREEN_OUTLINE = 6.0;
const SCREEN_TRAFFIC = 3.0; // 0.5x the outline
export const STROKE = SCREEN_OUTLINE / K_REST;
const DARK_TRAFFIC_STROKE = SCREEN_TRAFFIC / K_REST;
export const DOT_R = DOT_RADIUS;
/** The radius the core dot had before the mark replaced it. Kept because the
 *  blob, the emergence and the lane inner ends are all written against the
 *  MARK's half-box now, and this is the number they used to be written against. */
export const CORE_R = 2 * DOT_RADIUS;

// ---------------------------------------------------------------------------
// THE MODEL IS THE CLAUDE MARK. The core dot is gone: the thing at the centre
// of the world is the Claude sunburst, filled ACCENT, on `brandGlyphs`' 24-unit
// em box drawn as inline <path> (never an <image>, which races frame capture).
// It breathes on the same `breath(frame, 0.31)` the dot did, as a scale about
// its own centre, and it is in the picture from frame 0.
//
//   MARK_BOX 72 world px  ->  73.4 screen px at the resolved k 1.02
//                             403   screen px at the opening k 5.6
// The mark is the top of the z-order, with the icons: nothing — no lane, no
// thread, no dot, no packet — is ever drawn over it, and the three radii below
// keep the picture clear of it as well.
// ---------------------------------------------------------------------------
export const MARK_BOX = 72;
export const MARK_EDGE = MARK_BOX / 2; // 36
/** The blob's clear ring: the mark's half-box + 16 world px of daylight. */
export const BLOB_CLEAR = MARK_EDGE + 16; // 52
/** The lane lines' inner end, and where a return packet stops: half-box + 10. */
export const LANE_IN = MARK_EDGE + 10; // 46
/** An instance EMERGES FROM THE MARK'S EDGE: its drawn radius is 0 inside the
 *  mark's half-box and full 22 world px outside it. The flight tables are
 *  untouched (see DEVIATIONS) — a dot's path still begins at CORE_EDGE — so
 *  this is the whole of "out of the edge, not out of the centre" and it changes
 *  nothing beyond 58 world px of the centre. */
const EMERGE_SPAN = 22;
const emerge = (rho: number) => smoothstep(clamp01((rho - MARK_EDGE) / EMERGE_SPAN));
/** A return packet ENDS AT THE LANE'S INNER END: it is gone by LANE_IN and full
 *  10 world px outside it. The packet run's own parametrisation still targets
 *  LANE_R0 (see DEVIATIONS) — shortening the run would re-time every packet
 *  along the whole 231 px of lane — so the ending is drawn, not re-timed. */
export const laneGate = (x: number, y: number) =>
  smoothstep(clamp01((Math.hypot(x - CORE.x, y - CORE.y) - LANE_IN) / 10));

// ---------------------------------------------------------------------------
// THE SIX LANES. The hexagonal directions rotated so none is vertical: a lane
// straight up or straight down would put its station outside the caption band
// long before the economy ring fits the frame.
// ---------------------------------------------------------------------------
export const NL = 6;
export const LANE_ANG = Array.from({ length: NL }, (_, s) => (s * Math.PI) / 3);
export const LANE_D = LANE_ANG.map((a) => ({ x: Math.cos(a), y: Math.sin(a) }));
export const LANE_P = LANE_ANG.map((a) => ({ x: -Math.sin(a), y: Math.cos(a) }));

// Arrival order: hashed, and the station radii are then dealt SHORTEST FIRST so
// the rings light in genuine arrival order (see DEVIATIONS for the +-10).
export const LANE_RANK: number[] = (() => {
  const idx = Array.from({ length: NL }, (_, s) => s);
  idx.sort((a, b) => hash(a, 63) - hash(b, 63));
  const rank = new Array<number>(NL);
  idx.forEach((s, r) => {
    rank[s] = r;
  });
  return rank;
})();
const R_ST_BASE = 337;
export const R_ST = LANE_RANK.map((r) => R_ST_BASE + (r - (NL - 1) / 2) * 4);

const stationAt = (s: number) => ({
  x: CORE.x + LANE_D[s].x * R_ST[s],
  y: CORE.y + LANE_D[s].y * R_ST[s],
});
export const STATION = Array.from({ length: NL }, (_, s) => stationAt(s));

export const STATION_R = 64;
const GLYPH_FRACTION = 0.6; // the icon's box inside the ring, cut 2's rule
const RING_OUTER = STATION_R + STROKE / 2;

// The economy ring: a circle through the outside of the annuli.
export const ECON_R = 457;

// ---------------------------------------------------------------------------
// THE NOUNS. lucide-static (ISC), inlined verbatim — the same 24 grid, the same
// commands and order, fill none, round caps, round joins. Six kinds of work a
// viewer with no sound can still name: software, health, money, trades, law,
// industry.
// ---------------------------------------------------------------------------
const ICON_CODE = `<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>`;
const ICON_STETHOSCOPE =
  `<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>`;
const ICON_BANKNOTE =
  `<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>`;
const ICON_WRENCH =
  `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`;
const ICON_SCALE =
  `<path d="M12 3v18"/><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M7 21h10"/>`;
const ICON_FACTORY =
  `<path d="M12 16h.01"/><path d="M16 16h.01"/><path d="M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 11.5v-2a.5.5 0 0 0-.769-.422L9.77 11.922A.5.5 0 0 1 9 11.5V3a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M8 16h.01"/>`;
const ICONS = [
  ICON_CODE,
  ICON_STETHOSCOPE,
  ICON_BANKNOTE,
  ICON_WRENCH,
  ICON_SCALE,
  ICON_FACTORY,
];

// ---------------------------------------------------------------------------
// THE BLOB. A feathered ring of seats around the core with a clear ring inside
// it, so the model is never buried by its own instances. The ring is now the
// MARK's: no seat sits closer to the centre than BLOB_CLEAR = half-box + 16.
// BLOB_R0 stays 42 because it is the FEATHER's inner knee and the seat grid's
// identity — the selection hashes on a seat's grid index, so moving the knee
// would deal a different hundred dots and re-time the whole pour. The clear
// ring is applied as a radial push on the seat itself: the ~handful of seats
// that fell inside 52 are pushed out to it and everything else is untouched.
// ---------------------------------------------------------------------------
const BLOB_R0 = 42;
const BLOB_R1 = 148;
const BLOB_STEP = 2.45 * DOT_R;
const N_BLOB = 100;

type Seat = { x: number; y: number; r: number; depth: number };

const BLOB_SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  const cols = Math.ceil((2 * BLOB_R1) / BLOB_STEP) + 2;
  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x =
        CORE.x - BLOB_R1 + c * BLOB_STEP + (hash(i, 11) - 0.5) * BLOB_STEP * 0.9;
      const y =
        CORE.y - BLOB_R1 + r * BLOB_STEP + (hash(i, 12) - 0.5) * BLOB_STEP * 0.9;
      const dx = x - CORE.x;
      const dy = y - CORE.y;
      const rho = Math.hypot(dx, dy);
      const wob = wobble(Math.atan2(dy, dx) * WOBBLE_R, 2.3) * 5;
      const inside = Math.min((BLOB_R1 + wob - rho) / 16, (rho - BLOB_R0) / 10);
      const f = feather(inside, 1);
      if (f <= 0 || hash(i, 71) >= f) continue;
      // the clear ring around the mark
      const push = rho > 1e-6 && rho < BLOB_CLEAR ? BLOB_CLEAR / rho : 1;
      out.push({
        x: CORE.x + dx * push,
        y: CORE.y + dy * push,
        r:
          (0.85 + 0.35 * hash(i, 13)) *
          (0.72 + 0.28 * f) *
          (1 + (hash(i, 27) - 0.5) * 2 * R_SPREAD),
        depth: clamp01((rho - BLOB_R0) / (BLOB_R1 - BLOB_R0)),
      });
    }
  }
  return out;
})();

const BLOB_USED: number[] = BLOB_SEATS.map((_, i) => i)
  .sort((a, b) => hash(a, 81) - hash(b, 81))
  .slice(0, Math.min(N_BLOB, BLOB_SEATS.length));

// ---------------------------------------------------------------------------
// THE STATION ANNULI. A feathered ring band around each station, r 76..114 from
// its centre — clear of the ring's own ink (outer edge 67) at every seat, so no
// dot ever sits on a stroke.
// ---------------------------------------------------------------------------
export const ANN_R0 = 76;
export const ANN_R1 = 114;
const ANN_APPROACH = 124; // the radius a dot wraps around the ring at
export const ANN_STEP = 2.3 * DOT_R;
const SEATS_PER = 26;

type AnnSeat = Seat & { phi: number; rho: number };

const makeAnnulus = (s: number): AnnSeat[] => {
  const out: AnnSeat[] = [];
  const st = STATION[s];
  const cols = Math.ceil((2 * ANN_R1) / ANN_STEP) + 2;
  // the direction a dot arrives from: back down the lane, toward the core
  const inAng = Math.atan2(-LANE_D[s].y, -LANE_D[s].x);
  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c + s * 977 + 5171;
      const x = st.x - ANN_R1 + c * ANN_STEP + (hash(i, 11) - 0.5) * ANN_STEP * 0.9;
      const y = st.y - ANN_R1 + r * ANN_STEP + (hash(i, 12) - 0.5) * ANN_STEP * 0.9;
      const dx = x - st.x;
      const dy = y - st.y;
      const rho = Math.hypot(dx, dy);
      const th = Math.atan2(dy, dx);
      const wob = wobble(th * WOBBLE_R, 4.1 + s) * 4;
      const inside = Math.min((ANN_R1 + wob - rho) / 12, (rho - ANN_R0) / 8);
      const f = feather(inside, 1);
      if (f <= 0 || hash(i, 71) >= f) continue;
      let phi = th - inAng;
      while (phi > Math.PI) phi -= 2 * Math.PI;
      while (phi < -Math.PI) phi += 2 * Math.PI;
      out.push({
        x,
        y,
        r:
          (0.85 + 0.35 * hash(i, 13)) *
          (0.72 + 0.28 * f) *
          (1 + (hash(i, 27) - 0.5) * 2 * R_SPREAD),
        depth: clamp01(
          (rho - ANN_R0) / (ANN_R1 - ANN_R0) + (hash(i, 23) - 0.5) * DEPTH_JITTER,
        ),
        phi,
        rho,
      });
    }
  }
  // Fill order: from the side the dots arrive on, wrapping round, hashed hard
  // enough that the boundary between filled and not is never a drawn line.
  return out.sort(
    (a, b) => Math.abs(a.phi) - 0.55 * hash(a.x, 5) - (Math.abs(b.phi) - 0.55 * hash(b.x, 5)),
  );
};

export const ANN: AnnSeat[][] = Array.from({ length: NL }, (_, s) => makeAnnulus(s));

// Which annulus seats are occupied: blue-noise vacancies, as in cut 3, so every
// gap is a single hole with dots all round it and the mill always has somewhere
// to hop instead of a bald patch on one side.
export const ANN_USED: number[][] = ANN.map((seats, s) => {
  const n = Math.min(SEATS_PER, seats.length);
  const want = seats.length - n;
  const empty = new Uint8Array(seats.length);
  const order = seats.map((_, i) => i).sort((a, b) => hash(b + s * 31, 77) - hash(a + s * 31, 77));
  const near = (a: number, b: number) =>
    Math.hypot(seats[a].x - seats[b].x, seats[a].y - seats[b].y) < ANN_STEP * 1.6;
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
  // still in fill order
  return seats.map((_, i) => i).filter((i) => !empty[i]);
});

// Each seat's rung is its percentile among the seats actually occupied, so
// BACK_FRACTION means the outer 40% in every annulus whatever its shape.
ANN.forEach((seats, s) => {
  const which = ANN_USED[s];
  const idx = which.slice().sort((a, b) => seats[a].depth - seats[b].depth);
  idx.forEach((i, r) => {
    seats[i].depth = r / Math.max(1, which.length - 1);
  });
});

// ---------------------------------------------------------------------------
// THE SEATING SCHEDULE. Landings are AUTHORED — the fill window of station s
// starts at A_s in lane-length order and runs SEAT_W frames — and the departure
// is solved back from it through the path length, so the rings light in arrival
// order and the last one finishes turning ripe on "work".
// ---------------------------------------------------------------------------
const SEAT_A0 = 120; // the shortest lane's first landing
const SEAT_A_STEP = 6.5; // per rank
const SEAT_W = 26; // frames a station takes to fill
const SEAT_SPEED = 8; // world px/frame along the path
const SEAT_JIT = 34; // world px of hashed lateral bow in the lane run, so the
// seaters read as a stream in the lane and not as a train of touching dots
const DEEP_AFTER = 8; // dots: the ring starts converting on the 8th landing
const DEEP_DUR = 8;
const RIPE_LAG = 6;
const RIPE_DUR = 6;
export const SEAT_TONE = 6; // frames a dot takes to go deep -> ripe as it seats
const HEAD_CAP = 42; // screen px/frame; the set's ceiling is 45

const landingOf = (s: number, j: number) =>
  SEAT_A0 +
  SEAT_A_STEP * LANE_RANK[s] +
  SEAT_W * Math.pow(j / Math.max(1, SEATS_PER - 1), 0.9);

// ---------------------------------------------------------------------------
// THE POUR'S RADIAL SPEED. One shared cumulative-distance table: a free dot
// moves min(FREE_SPEED, HEAD_CAP / k) world px per frame, so no head in the
// stream is ever over the ceiling however tight the camera is.
// ---------------------------------------------------------------------------
const FREE_SPEED = 10.5;
const RAD: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= DURATION + 200; f++) {
    const k = kAt(Math.min(f, DURATION));
    out.push(out[f - 1] + Math.min(FREE_SPEED, HEAD_CAP / k));
  }
  return out;
})();
const radAt = (f: number) => RAD[Math.max(0, Math.min(RAD.length - 1, Math.round(f)))];
export const CORE_EDGE = 12;

// The lateral fan: a free dot leaves the core on the lane axis and opens out to
// a hashed offset, so the pour is a stream with width rather than a drawn line.
const FAN_MAX = 34;
const FAN_R = 300;

// ---------------------------------------------------------------------------
// THE ABSORPTION. The pour ENDS AT THE WORK: a dot travelling outward on a lane
// is taken in when it reaches the outer edge of its station's annulus and never
// exists beyond it. This is a world-space rule and it holds from frame 0 — the
// stations are in the world before the camera finds them, so at the opening zoom
// the absorption point is off-frame too and nothing visible changes.
//
// The edge is the annulus CIRCLE, not a radius on the lane axis: a dot carrying
// a lateral fan offset l meets it at r = R_ST - sqrt(ANN_R1^2 - l^2), so the
// front of the stream curves with the crowd it arrives at instead of reading as
// a flat wall across the lane. Solved by two fixed-point steps because l itself
// depends on r.
//
// On arrival a dot either SEATS in a vacant annulus seat or DISSOLVES — radius
// to 0 over ABSORB_DUR frames while it decelerates into the edge on arriveEase,
// no flash and no ripple. In this cut the seat branch never fires: every seat an
// annulus has is already spoken for (26 seaters per station, and the blue-noise
// vacancies are the mill's headroom, occupied and vacated continuously from the
// first landing to the last frame), so `vacantSeatFor` returns -1 at every
// frame and the pour resolves entirely into the dissolve. See DEVIATIONS.
// ---------------------------------------------------------------------------
const ABSORB_DUR = 6;

const absorbRadius = (s: number, fan: number) => {
  let r = R_ST[s] - ANN_R1;
  for (let i = 0; i < 2; i++) {
    const l = fan * smoothstep(clamp01((r - CORE_EDGE) / FAN_R));
    r = R_ST[s] - Math.sqrt(Math.max(1, ANN_R1 * ANN_R1 - l * l));
  }
  return r;
};

/** The frame a dot reaches `rAbs`, solved off the shared cumulative table so it
 *  is exact whatever the camera did to the speed cap on the way out. */
const absorbFrame = (
  rOf: (f: number) => number,
  f0: number,
  rAbs: number,
  upto: number = DURATION + 60,
) => {
  for (let f = Math.floor(f0) + 1; f <= upto; f++) {
    if (rOf(f) >= rAbs) {
      const a = rOf(f - 1);
      const b = rOf(f);
      return f - 1 + (rAbs - a) / Math.max(1e-6, b - a);
    }
  }
  return Infinity;
};

/** A vacant seat in station `s`'s annulus, or -1. Every seat in ANN_USED is
 *  allocated to a seater and every seat outside it is the mill's; there is no
 *  frame at which a lane arrival can take one without either doubling the crowd
 *  or stopping the mill, so this is -1 by construction. */
const vacantSeatFor = (_s: number, _frame: number) => -1;

// ---------------------------------------------------------------------------
// THE PARTICLES. Three populations, one vocabulary: every one of them is an
// instance leaving the core.
//   BLOB    born f18-58, seats in the blob, rejoins its lane f61-126 and pours
//   SEATER  leaves the core on the schedule above and lands in an annulus
//   FREE    the endless stream: 0.5/frame from f45, 1/frame from f77 to f218
// ---------------------------------------------------------------------------
const SPAWN_F0 = 10;
const SPAWN_F1 = 58;
const SPAWN_SPEED = 5.6;
const OPEN_F0 = 61; // the blob opens into the lanes
const OPEN_F1 = 126;
const EMIT_F0 = 45;
export const EMIT_F1 = 218;
const EMIT_RAMP = 77; // "millions"
const EMIT_SLOW = 0.5;
const EMIT_FAST = 2.4;

type Blob = {
  seat: number;
  born: number;
  arrive: number;
  bow: number;
  lane: number;
  depart: number;
  fan: number;
  back: boolean;
  // the absorption: where the lane run ends, when it gets there, and the radius
  // the dissolve starts from
  rAbs: number;
  fAbs: number;
  rIn: number;
};

const BLOBS: Blob[] = (() => {
  const order = BLOB_USED.slice().sort((a, b) => hash(a, 91) - hash(b, 91));
  return order.map((seat, i) => {
    const S = BLOB_SEATS[seat];
    const dist = Math.hypot(S.x - CORE.x, S.y - CORE.y) - CORE_EDGE;
    const born =
      SPAWN_F0 + (SPAWN_F1 - SPAWN_F0) * Math.pow(i / Math.max(1, order.length - 1), 0.92);
    const ang = Math.atan2(S.y - CORE.y, S.x - CORE.x);
    let lane = 0;
    let best = 9;
    for (let s = 0; s < NL; s++) {
      let d = Math.abs(ang - LANE_ANG[s]);
      while (d > Math.PI) d = Math.abs(d - 2 * Math.PI);
      if (d < best) {
        best = d;
        lane = s;
      }
    }
    const depart =
      OPEN_F0 +
      (OPEN_F1 - OPEN_F0) * Math.pow(hash(seat, 95), 0.85) +
      (hash(seat, 96) - 0.5) * 2;
    const fan = (hash(seat, 97) - 0.5) * 2 * FAN_MAX;
    const r0 = Math.hypot(S.x - CORE.x, S.y - CORE.y);
    const rOf = (f: number) => r0 + (radAt(f) - radAt(depart));
    const rAbs = absorbRadius(lane, fan);
    const fAbs = absorbFrame(rOf, depart, rAbs);
    return {
      seat,
      born,
      arrive: born + Math.max(6, dist / SPAWN_SPEED + (hash(seat, 39) - 0.5) * 3),
      bow: (hash(seat, 61) - 0.5) * 44,
      lane,
      depart,
      fan,
      back: hash(seat, 98) < POUR_BACK,
      rAbs,
      fAbs,
      rIn: rOf(fAbs - ABSORB_DUR),
    };
  });
})();

type Seater = {
  lane: number;
  seat: number; // index into ANN[lane]
  depart: number;
  land: number;
  // path: lane run -> wrap at ANN_APPROACH -> step in
  la: number;
  lb: number;
  lc: number;
  phi: number;
  jit: number;
  back: boolean;
};

const SEATER_STATS = { stretched: 0, peakHead: 0 };

export const SEATERS: Seater[] = (() => {
  const out: Seater[] = [];
  for (let s = 0; s < NL; s++) {
    const st = STATION[s];
    const inAng = Math.atan2(-LANE_D[s].y, -LANE_D[s].x);
    ANN_USED[s].forEach((seatIdx, j) => {
      const A = ANN[s][seatIdx];
      const la = R_ST[s] - ANN_APPROACH - CORE_EDGE;
      const lb = ANN_APPROACH * Math.abs(A.phi);
      const lc = ANN_APPROACH - A.rho;
      const land = landingOf(s, j);
      const jit = (hash(seatIdx + s * 313, 107) - 0.5) * 2 * SEAT_JIT;
      const len = la + lb + lc;
      let flight = len / SEAT_SPEED;
      const pointAt = (u: number) => {
        const d = arriveEase(u) * len;
        if (d <= la) {
          const r = CORE_EDGE + d;
          const l = jit * Math.sin(Math.PI * clamp01(d / la));
          return [
            CORE.x + LANE_D[s].x * r + LANE_P[s].x * l,
            CORE.y + LANE_D[s].y * r + LANE_P[s].y * l,
          ];
        }
        if (d <= la + lb) {
          const t = (d - la) / Math.max(1e-6, lb);
          const th = inAng + A.phi * t;
          return [st.x + Math.cos(th) * ANN_APPROACH, st.y + Math.sin(th) * ANN_APPROACH];
        }
        const t = (d - la - lb) / Math.max(1e-6, lc);
        const th = inAng + A.phi;
        const rr = ANN_APPROACH + (A.rho - ANN_APPROACH) * t;
        return [st.x + Math.cos(th) * rr, st.y + Math.sin(th) * rr];
      };
      const peak = (fl: number) => {
        let mx = 0;
        const d0 = land - fl;
        for (let f = Math.ceil(d0) + 1; f <= land; f++) {
          const a = pointAt(clamp01((f - 1 - d0) / fl));
          const b = pointAt(clamp01((f - d0) / fl));
          const pa = screenAt(f - 1, a[0], a[1]);
          const pb = screenAt(f, b[0], b[1]);
          mx = Math.max(mx, Math.hypot(pb[0] - pa[0], pb[1] - pa[1]));
        }
        return mx;
      };
      let guard = 0;
      while (peak(flight) > HEAD_CAP && guard < 60) {
        flight += 1;
        guard++;
      }
      if (guard > 0) SEATER_STATS.stretched++;
      SEATER_STATS.peakHead = Math.max(SEATER_STATS.peakHead, peak(flight));
      out.push({
        lane: s,
        seat: seatIdx,
        depart: land - flight,
        land,
        la,
        lb,
        lc,
        phi: A.phi,
        jit,
        back: A.depth > 1 - BACK_FRACTION,
      });
    });
  }
  return out;
})();

type Free = {
  lane: number;
  born: number;
  fan: number;
  sf: number;
  back: boolean;
  rAbs: number;
  fAbs: number;
  rIn: number;
};

/** The free stream, emitted frame by frame from EMIT_F0 to `emitF1`. Written as
 *  a function of its END frame only, and the loop only ever APPENDS, so a
 *  longer call is a strict superset of a shorter one with an identical prefix:
 *  `buildFrees(218)` is this cut's stream and the next cut of the clip carries
 *  the same pour on by calling it with a later end. Nothing about this cut
 *  changes. */
export const buildFrees = (emitF1: number): Free[] => {
  const out: Free[] = [];
  let acc = 0;
  let i = 0;
  for (let f = EMIT_F0; f <= emitF1; f++) {
    acc += f < EMIT_RAMP ? EMIT_SLOW : EMIT_FAST;
    while (acc >= 1) {
      acc -= 1;
      // the lane order is hashed, never round-robin: a cycling emitter reads as
      // a rotating sprinkler
      const lane = Math.floor(hash(i, 101) * NL) % NL;
      const born = f + hash(i, 102) * 0.9;
      const fan = (hash(i, 103) - 0.5) * 2 * FAN_MAX;
      // <= 1 always, so the shared RAD cap still bounds every head; it only
      // breaks the lockstep that a single speed gives a whole lane
      const sf = 0.84 + 0.16 * hash(i, 105);
      const rOf = (ff: number) => CORE_EDGE + sf * (radAt(ff) - radAt(born));
      const rAbs = absorbRadius(lane, fan);
      // The search window has to outlast the LAST dot emitted, or a dot born
      // near the end of a long emission never finds its edge and piles up on
      // it. Every dot of THIS cut resolves by ~f239, well inside either bound,
      // so widening it changes nothing here.
      const fAbs = absorbFrame(rOf, born, rAbs, Math.max(DURATION + 60, emitF1 + 80));
      out.push({
        lane,
        born,
        fan,
        sf,
        back: hash(i, 104) < POUR_BACK,
        rAbs,
        fAbs,
        rIn: rOf(fAbs - ABSORB_DUR),
      });
      i++;
    }
  }
  return out;
};

const FREES: Free[] = buildFrees(EMIT_F1);

// ---------------------------------------------------------------------------
// THE MILL, per annulus: from that annulus' first landing to the last frame, a
// seated dot hops to a vacant neighbouring seat on arriveEase. One occupancy
// map per station, so two dots never share a seat.
// ---------------------------------------------------------------------------
const MILL_DUR = 11;
const MILL_RATE = 0.34; // hops per frame per station

export type Hop = { from: number; to: number; t0: number };

/** The mill, simulated frame by frame from 0 to `upto`. Like `buildFrees` it
 *  only APPENDS — a hop generated on frame f carries t0 = f — so a longer call
 *  is the same simulation run further and the prefix is identical. */
export const buildMill = (upto: number): Hop[][] => {
  const MILL: Hop[][] = SEATERS.map(() => []);
  const bySeat = new Map<string, number>();
  SEATERS.forEach((p, i) => bySeat.set(`${p.lane}:${p.seat}`, i));
  for (let s = 0; s < NL; s++) {
    const seats = ANN[s];
    const nb = seats.map((a, i) =>
      seats
        .map((b, j) => ({ b, j }))
        .filter(({ b, j }) => j !== i && Math.hypot(b.x - a.x, b.y - a.y) <= ANN_STEP * 1.5)
        .map(({ j }) => j),
    );
    const occ = new Int32Array(seats.length).fill(-1);
    const mine = SEATERS.map((p, i) => (p.lane === s ? i : -1)).filter((i) => i >= 0);
    const seatOf = new Map<number, number>();
    mine.forEach((i) => seatOf.set(i, SEATERS[i].seat));
    const busy = new Map<number, number>();
    let acc = 0;
    let id = s * 7919;
    for (let f = 0; f <= upto; f++) {
      mine.forEach((i) => {
        if (f >= SEATERS[i].land && f - 1 < SEATERS[i].land) {
          occ[seatOf.get(i) as number] = i;
        }
      });
      acc += MILL_RATE;
      while (acc >= 1) {
        acc -= 1;
        const jj = id++;
        const start = Math.floor(hash(jj, 51) * mine.length);
        let pick = -1;
        let free: number[] = [];
        for (let t = 0; t < mine.length; t++) {
          const c = mine[(start + t) % mine.length];
          if (f < SEATERS[c].land + 2) continue;
          if ((busy.get(c) ?? -1) > f) continue;
          const cand = nb[seatOf.get(c) as number].filter((q) => occ[q] < 0);
          if (cand.length === 0) continue;
          pick = c;
          free = cand;
          break;
        }
        if (pick < 0) break;
        const from = seatOf.get(pick) as number;
        const to = free[Math.floor(hash(jj, 52) * free.length) % free.length];
        occ[from] = -1;
        occ[to] = pick;
        seatOf.set(pick, to);
        busy.set(pick, f + MILL_DUR);
        MILL[pick].push({ from, to, t0: f });
      }
    }
  }
  return MILL;
};

const MILL: Hop[][] = buildMill(DURATION);

// When each ring converts: the 8th landing in that annulus, measured off the
// landings so retiming the seating retimes the rings with it.
const RING_DEEP_AT = Array.from({ length: NL }, (_, s) => {
  const ts = SEATERS.filter((p) => p.lane === s)
    .map((p) => p.land)
    .sort((a, b) => a - b);
  return ts[Math.min(DEEP_AFTER - 1, ts.length - 1)];
});

// ---------------------------------------------------------------------------
// THE LANE LINES. Head-led from the core outward, ending just short of each
// ring. Drawn f64-104, so they lead "experience" and are done before the
// stations start filling.
// ---------------------------------------------------------------------------
const LANE_F0 = 64;
const LANE_F1 = 104;
export const LANE_R0 = 34;
export const laneR1 = (s: number) => R_ST[s] - RING_OUTER - 5;

// THE ECONOMY RING: six heads, one per station, each sweeping to the next.
const ECON_F0 = 180;
const ECON_F1 = 197;

// THE RETURN: packets back along every lane from station to core.
const BACK_F0 = 191;
export const BACK_PERIOD = 10;
export const BACK_SPEED = 16;

// Dark traffic between seated neighbours.
const TRAFFIC_N = idleThreads(SEATS_PER * NL);
const TRAFFIC_REACH = 46;

// THE MICRO-DRIFT. Two hashed sines per axis, +-3 world px, never in unison.
const micro = (i: number, f: number) => ({
  dx:
    1.8 * Math.sin(f * 0.2417 + hash(i, 17) * 6.283) +
    1.2 * Math.sin(f * 0.1533 + hash(i, 19) * 6.283),
  dy:
    1.7 * Math.sin(f * 0.2094 + hash(i, 18) * 6.283) +
    1.3 * Math.sin(f * 0.1396 + hash(i, 20) * 6.283),
});

export type Live = {
  key: string;
  x: number;
  y: number;
  r: number;
  op: number;
  tone: number;
  back: boolean;
  seated: boolean;
};

export type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number };

// ---------------------------------------------------------------------------
// THE WORLD, split out of the component so the NEXT cut of this clip can stand
// in it rather than rebuild it. `buildWorld(frame)` is the pure state of the
// pour, the annuli and the traffic at a world frame; `WorldSvg` draws it. This
// component is then the camera, the grid and those two, and nothing about what
// it renders has changed: with no options, `frees` is this cut's stream,
// `mill` this cut's simulation and `damp` absent, which is the arithmetic that
// was inline here before.
// ---------------------------------------------------------------------------

export type WorldOpts = {
  /** A longer emission from `buildFrees`; defaults to this cut's. */
  frees?: Free[];
  /** A longer simulation from `buildMill`; defaults to this cut's. */
  mill?: Hop[][];
  /** The frame the dark traffic thins on; defaults to this cut's "economy". */
  econBeat?: number;
  /** A multiplier on a SEATED instance's micro-drift, per seater and frame. A
   *  later cut uses it to still a dot that something has taken hold of. */
  damp?: (seater: number, frame: number) => number;
};

export type World = { live: Live[]; traffic: Th[] };

const outboundAt = (lane: number, r: number, fan: number) => {
  const t = smoothstep(clamp01((r - CORE_EDGE) / FAN_R));
  const l = fan * t;
  return {
    x: CORE.x + LANE_D[lane].x * r + LANE_P[lane].x * l,
    y: CORE.y + LANE_D[lane].y * r + LANE_P[lane].y * l,
  };
};

export const buildWorld = (frame: number, opts: WorldOpts = {}): World => {
  const frees = opts.frees ?? FREES;
  const mill = opts.mill ?? MILL;
  const econBeat = opts.econBeat ?? defaultProps.beats.economy;
  const damp = opts.damp;

  const live: Live[] = [];

  // the blob: spawn, sit, then rejoin the lane and pour
  BLOBS.forEach((b, i) => {
    if (frame < b.born) return;
    const S = BLOB_SEATS[b.seat];
    const md = micro(i, frame);
    const dm = b.back ? BG_DRIFT : 1;
    let x: number;
    let y: number;
    let shrink = 1;
    if (frame < b.arrive) {
      const u = arriveEase(clamp01((frame - b.born) / (b.arrive - b.born)));
      const dx = S.x - CORE.x;
      const dy = S.y - CORE.y;
      const L = Math.hypot(dx, dy) || 1;
      const bow = Math.sin(Math.PI * u) * b.bow;
      x = CORE.x + (dx / L) * CORE_EDGE + (dx - (dx / L) * CORE_EDGE) * u + (-dy / L) * bow;
      y = CORE.y + (dy / L) * CORE_EDGE + (dy - (dy / L) * CORE_EDGE) * u + (dx / L) * bow;
    } else if (frame < b.depart) {
      x = S.x;
      y = S.y;
    } else {
      // absorbed at the outer edge of its station's annulus: no dot on a lane
      // ever exists past the work it is pouring into
      if (frame >= b.fAbs) return;
      const r0 = Math.hypot(S.x - CORE.x, S.y - CORE.y);
      let r = r0 + (radAt(frame) - radAt(b.depart));
      const tAb = b.fAbs - frame;
      if (tAb < ABSORB_DUR) {
        const u = clamp01(1 - tAb / ABSORB_DUR);
        r = b.rIn + (b.rAbs - b.rIn) * arriveEase(u);
        shrink = 1 - u * u; // weighted late: the dot stays a dot until the edge
      }
      const p = outboundAt(b.lane, Math.min(r, b.rAbs), b.fan);
      x = p.x;
      y = p.y;
    }
    live.push({
      key: `b${i}`,
      x: x + md.dx * dm,
      y: y + md.dy * dm,
      r: DOT_R * S.r * (b.back ? BG_R_SCALE : 1) * breath(frame, hash(i, 9)) * shrink,
      op: OP_FG,
      tone: 0,
      back: b.back,
      seated: false,
    });
  });

  // the free stream: endless, and it never stops leaving the frame
  frees.forEach((p, i) => {
    if (frame < p.born) return;
    if (frame >= p.fAbs) return; // taken in at the annulus edge
    let r = CORE_EDGE + p.sf * (radAt(frame) - radAt(p.born));
    // the dissolve: decelerate into the edge on arriveEase, radius to 0 over
    // ABSORB_DUR frames. No flash, no ripple — the stream is simply taken in.
    let shrink = Math.min(1, (frame - p.born) / 2);
    const tAb = p.fAbs - frame;
    if (tAb < ABSORB_DUR) {
      const u = clamp01(1 - tAb / ABSORB_DUR);
      r = p.rIn + (p.rAbs - p.rIn) * arriveEase(u);
      shrink = Math.min(shrink, 1 - u * u);
    }
    const q = outboundAt(p.lane, Math.min(r, p.rAbs), p.fan);
    const md = micro(i + 4001, frame);
    const dm = p.back ? BG_DRIFT : 1;
    live.push({
      key: `f${i}`,
      x: q.x + md.dx * dm,
      y: q.y + md.dy * dm,
      r:
        DOT_R *
        (0.85 + 0.35 * hash(i, 13)) *
        (1 + (hash(i, 27) - 0.5) * 2 * R_SPREAD) *
        (p.back ? BG_R_SCALE : 1) *
        breath(frame, hash(i, 9)) *
        shrink,
      op: OP_FG,
      tone: 0,
      back: p.back,
      seated: false,
    });
  });

  // the seaters: the lane, the wrap, the seat, then the mill
  SEATERS.forEach((p, i) => {
    if (frame < p.depart) return;
    const seats = ANN[p.lane];
    const st = STATION[p.lane];
    const inAng = Math.atan2(-LANE_D[p.lane].y, -LANE_D[p.lane].x);
    const md = micro(i + 9001, frame);
    let dm = p.back ? BG_DRIFT : 1;
    // A later cut stills a seated dot that something has taken hold of. With no
    // `damp` this multiplies by nothing and the value is the one it always was.
    if (damp) dm *= damp(i, frame);
    let x: number;
    let y: number;
    let cur = p.seat;
    if (frame < p.land) {
      const len = p.la + p.lb + p.lc;
      const d = arriveEase(clamp01((frame - p.depart) / (p.land - p.depart))) * len;
      if (d <= p.la) {
        const r = CORE_EDGE + d;
        const l = p.jit * Math.sin(Math.PI * clamp01(d / p.la));
        x = CORE.x + LANE_D[p.lane].x * r + LANE_P[p.lane].x * l;
        y = CORE.y + LANE_D[p.lane].y * r + LANE_P[p.lane].y * l;
      } else if (d <= p.la + p.lb) {
        const t = (d - p.la) / Math.max(1e-6, p.lb);
        const th = inAng + p.phi * t;
        x = st.x + Math.cos(th) * ANN_APPROACH;
        y = st.y + Math.sin(th) * ANN_APPROACH;
      } else {
        const t = (d - p.la - p.lb) / Math.max(1e-6, p.lc);
        const th = inAng + p.phi;
        const rr = ANN_APPROACH + (seats[p.seat].rho - ANN_APPROACH) * t;
        x = st.x + Math.cos(th) * rr;
        y = st.y + Math.sin(th) * rr;
      }
    } else {
      let liveHop: Hop | null = null;
      for (const h of mill[i]) {
        if (frame >= h.t0 + MILL_DUR) cur = h.to;
        else if (frame >= h.t0) {
          liveHop = h;
          break;
        } else break;
      }
      if (liveHop) {
        const u = arriveEase(clamp01((frame - liveHop.t0) / MILL_DUR));
        const A = seats[liveHop.from];
        const B = seats[liveHop.to];
        const ddx = B.x - A.x;
        const ddy = B.y - A.y;
        const L = Math.hypot(ddx, ddy) || 1;
        const bow = Math.sin(Math.PI * u) * (hash(i, 61) - 0.5) * 6;
        x = A.x + ddx * u + (-ddy / L) * bow;
        y = A.y + ddy * u + (ddx / L) * bow;
      } else {
        x = seats[cur].x;
        y = seats[cur].y;
      }
    }
    live.push({
      key: `s${i}`,
      x: x + md.dx * dm,
      y: y + md.dy * dm,
      r:
        DOT_R *
        seats[p.seat].r *
        (p.back ? BG_R_SCALE : 1) *
        breath(frame, hash(i + 9001, 9)),
      // solid in flight and in the lane; the ONE surviving alpha rung is the
      // back of a SEATED annulus, and it is reached on the same ramp as the
      // seating tone so nothing steps at the landing
      op: p.back ? OP_FG + (OP_MID - OP_FG) * clamp01((frame - p.land) / SEAT_TONE) : OP_FG,
      tone: clamp01((frame - p.land) / SEAT_TONE),
      back: p.back,
      seated: frame >= p.land,
    });
  });

  // -- dark traffic, between seated neighbours -------------------------------
  const seated = live.filter((d) => d.seated);
  const traffic: Th[] = [];
  if (seated.length > 1) {
    const n = seated.length;
    const count = Math.round(TRAFFIC_N * (frame < econBeat ? 1 : 0.6));
    for (let j = 0; j < count; j++) {
      const period = 40 - 12 * hash(j, 4);
      const local = frame + hash(j, 5) * period;
      const cycle = Math.floor(local / period);
      const phase = (local - cycle * period) / period;
      const seed = j * 131 + cycle * 7;
      const A = seated[Math.floor(hash(seed, 6) * n) % n];
      let B: Live | null = null;
      for (let t = 0; t < 12; t++) {
        const C = seated[Math.floor(hash(seed + t * 17, 8) * n) % n];
        if (C === A) continue;
        if (Math.hypot(C.x - A.x, C.y - A.y) <= TRAFFIC_REACH) {
          B = C;
          break;
        }
      }
      if (!B) continue;
      const dn = arriveEase(clamp01(phase / 0.35));
      const fade = 1 - smoothstep(clamp01((phase - 0.6) / 0.4));
      if (fade <= 0.02) continue;
      traffic.push({
        key: `t${j}`,
        x1: A.x,
        y1: A.y,
        x2: A.x + (B.x - A.x) * dn,
        y2: A.y + (B.y - A.y) * dn,
        op: DARK_TRAFFIC_OPACITY * fade,
      });
    }
  }

  // -- the emergence ----------------------------------------------------------
  // Every instance comes OUT OF THE MARK'S EDGE. A dot's drawn radius is gated
  // on its distance from the centre: nothing exists inside the mark's half-box
  // and a dot is full size 22 world px outside it. It is applied here, once,
  // after all three populations, so the blob's arcs, the seaters' lane runs and
  // the free stream all emerge the same way.
  for (const d of live) {
    const e = emerge(Math.hypot(d.x - CORE.x, d.y - CORE.y));
    if (e < 1) d.r *= e;
  }

  return { live, traffic };
};

// ---------------------------------------------------------------------------
// THE WORLD, drawn. Everything inside the camera's transform, in world
// coordinates, in the order it always had. `afterTraffic` and `afterDots` are
// two empty slots a later cut hangs its own layer in — with neither passed the
// tree is exactly what it was.
// ---------------------------------------------------------------------------
export const WorldSvg: React.FC<{
  frame: number;
  k: number;
  world: World;
  ink: string;
  accent: string;
  accentDeep: string;
  dotOpacity: number;
  icon: string;
  afterTraffic?: React.ReactNode;
  afterDots?: React.ReactNode;
}> = ({
  frame,
  k,
  world,
  ink,
  accent,
  accentDeep,
  dotOpacity,
  icon,
  afterTraffic,
  afterDots,
}) => {
  const { live, traffic } = world;
  const toDeep = makeTone(ink, accentDeep); // white -> the instances are on it
  const toRipe = makeTone(accentDeep, accent); // -> and it is theirs

  // -- the lane lines --------------------------------------------------------
  const laneU = arriveEase(clamp01((frame - LANE_F0) / (LANE_F1 - LANE_F0)));

  // -- the economy ring ------------------------------------------------------
  const econU = arriveEase(clamp01((frame - ECON_F0) / (ECON_F1 - ECON_F0)));
  const econArc = (s: number) => {
    const a0 = LANE_ANG[s];
    const span = (Math.PI / 3) * econU;
    const steps = 14;
    let d = "";
    for (let t = 0; t <= steps; t++) {
      const a = a0 + span * (t / steps);
      const px = CORE.x + Math.cos(a) * ECON_R;
      const py = CORE.y + Math.sin(a) * ECON_R;
      d += `${t === 0 ? "M" : "L"}${px.toFixed(2)} ${py.toFixed(2)}`;
    }
    return d;
  };

  const glyphBox = 2 * STATION_R * GLYPH_FRACTION;

  return (
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the lanes: the containers the pour runs in, head-led out of the
                core. One rung back from the things they join. */}
            {laneU > 0 ? (
              <g style={{ filter: icon }}>
                {LANE_D.map((d, s) => {
                  // The growing tip keeps its ORIGINAL parametrisation (off
                  // LANE_R0): the group carries iconShadow, and an SVG filter
                  // re-rasterises on a grid taken from its own bounding box, so
                  // moving the tip by a fraction of a pixel while the lane draws
                  // would resample the whole group and show up as a hairline
                  // difference along every lane. Only the INNER end moves.
                  const r1 = LANE_R0 + (laneR1(s) - LANE_R0) * laneU;
                  return (
                    <line
                      key={`l${s}`}
                      x1={CORE.x + d.x * LANE_IN}
                      y1={CORE.y + d.y * LANE_IN}
                      x2={CORE.x + d.x * Math.max(r1, LANE_IN)}
                      y2={CORE.y + d.y * Math.max(r1, LANE_IN)}
                      stroke={ink}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={OP_MID}
                    />
                  );
                })}
                {laneU < 1
                  ? LANE_D.map((d, s) => {
                      const r1 = LANE_R0 + (laneR1(s) - LANE_R0) * laneU;
                      return (
                        <circle
                          key={`lh${s}`}
                          cx={CORE.x + d.x * r1}
                          cy={CORE.y + d.y * r1}
                          r={4.5 / k}
                          fill={ink}
                          opacity={OP_FG}
                        />
                      );
                    })
                  : null}
              </g>
            ) : null}

            {/* dark traffic in the annuli: taken, not dead. No heads. */}
            {traffic.map((t) => (
              <line
                key={t.key}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={accent}
                strokeWidth={DARK_TRAFFIC_STROKE}
                strokeLinecap="round"
                opacity={t.op}
              />
            ))}

            {afterTraffic}

            {/* the instances, on the depth ladder: the back of the pour and of
                every annulus first and dimmer, then the front over the top.
                Tone means state; only opacity and size say how far back a dot
                is. They are drawn UNDER the rings, so the pour runs behind the
                work instead of over its ink. */}
            {[true, false].map((backPass) =>
              live.map((d) =>
                d.back !== backPass ? null : (
                  <circle
                    key={`${backPass ? "b" : "c"}${d.key}`}
                    cx={d.x}
                    cy={d.y}
                    r={d.r}
                    fill={toRipe(d.tone)}
                    opacity={dotOpacity * d.op}
                  />
                ),
              ),
            )}

            {afterDots}

            {/* the six kinds of work. The RING converts white -> deep as its
                8th instance lands and -> ripe six frames later; the icon inside
                it stays white, because the work is the work whoever does it. */}
            <g style={{ filter: icon }}>
              {STATION.map((st, s) => {
                const deepT = clamp01((frame - RING_DEEP_AT[s]) / DEEP_DUR);
                const ripeT = clamp01(
                  (frame - (RING_DEEP_AT[s] + RIPE_LAG + DEEP_DUR * 0)) / RIPE_DUR,
                );
                const col =
                  frame >= RING_DEEP_AT[s] + RIPE_LAG
                    ? toRipe(smoothstep(ripeT))
                    : toDeep(smoothstep(deepT));
                return (
                  <circle
                    key={`r${s}`}
                    cx={st.x}
                    cy={st.y}
                    r={STATION_R}
                    fill="none"
                    stroke={col}
                    strokeWidth={STROKE}
                    opacity={OP_MID + (OP_FG - OP_MID) * smoothstep(deepT)}
                  />
                );
              })}
            </g>

            <g style={{ filter: icon }}>
              {STATION.map((st, s) => (
                <g
                  key={`g${s}`}
                  transform={`translate(${(st.x - glyphBox / 2).toFixed(3)} ${(
                    st.y -
                    glyphBox / 2
                  ).toFixed(3)}) scale(${(glyphBox / 24).toFixed(5)})`}
                  fill="none"
                  stroke={ink}
                  strokeWidth={(STROKE * 24) / glyphBox}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={OP_FG}
                  dangerouslySetInnerHTML={{ __html: ICONS[s] }}
                />
              ))}
            </g>

            {/* the economy: one ring around all six kinds of work, drawn by the
                work itself — six heads, one per station, meeting in the gaps. */}
            {econU > 0 ? (
              <g style={{ filter: icon }}>
                {LANE_ANG.map((_a, s) => (
                  <path
                    key={`e${s}`}
                    d={econArc(s)}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    opacity={OP_MID}
                  />
                ))}
                {econU < 1
                  ? LANE_ANG.map((a0, s) => {
                      const a = a0 + (Math.PI / 3) * econU;
                      return (
                        <circle
                          key={`eh${s}`}
                          cx={CORE.x + Math.cos(a) * ECON_R}
                          cy={CORE.y + Math.sin(a) * ECON_R}
                          r={4.5 / k}
                          fill={ink}
                          opacity={OP_FG}
                        />
                      );
                    })
                  : null}
              </g>
            ) : null}

            {/* the return: experience running back down every lane to the model */}
            {frame >= BACK_F0
              ? LANE_D.map((d, s) => {
                  const from = {
                    x: CORE.x + d.x * laneR1(s),
                    y: CORE.y + d.y * laneR1(s),
                  };
                  const to = { x: CORE.x + d.x * LANE_R0, y: CORE.y + d.y * LANE_R0 };
                  const ps = packetsOn({
                    frame,
                    k,
                    from,
                    to,
                    period: BACK_PERIOD,
                    phase: BACK_F0,
                    speed: BACK_SPEED,
                    opacity: 1,
                    seed: s + 3,
                  });
                  return ps.map((p, n) => (
                    <circle
                      key={`p${s}-${n}`}
                      cx={p.x}
                      cy={p.y}
                      r={DOT_R * 0.8}
                      fill={accent}
                      opacity={
                        OP_FG *
                        laneGate(p.x, p.y) *
                        (1 - smoothstep(clamp01((p.u - 0.85) / 0.15)))
                      }
                    />
                  ));
                })
              : null}

            {/* THE MODEL. The Claude mark, orange, on the axis, from the first
                frame to the last. Everything else in the piece came out of it.
                Inline <path> on the brandGlyphs 24-unit box, scaled about its
                own centre by the breath the core dot always had, top of the
                z-order with the icons. */}
            <g
              transform={
                `translate(${CORE.x} ${CORE.y}) ` +
                `scale(${((MARK_BOX / 24) * breath(frame, 0.31)).toFixed(5)}) ` +
                `translate(-12 -12)`
              }
              style={{ filter: icon }}
              opacity={dotOpacity * OP_FG}
            >
              {CLAUDE.paths.map((d, i) => (
                <path key={`m${i}`} d={d} fill={accent} fillRule="evenodd" />
              ))}
            </g>
          </svg>
  );
};

// ---------------------------------------------------------------------------

const MillionsOfYears: React.FC<Props> = ({
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
  dotOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const world = buildWorld(frame, { econBeat: beats.economy });

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
          <WorldSvg
            frame={frame}
            k={k}
            world={world}
            ink={ink}
            accent={accent}
            accentDeep={accentDeep}
            dotOpacity={dotOpacity}
            icon={icon}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default MillionsOfYears;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  through: defaultProps.beats.through,
  experience: defaultProps.beats.experience,
  millions: defaultProps.beats.millions,
  deployment: defaultProps.beats.deployment,
  work: defaultProps.beats.work,
  economy: defaultProps.beats.economy,
  end: defaultProps.beats.end,
};
export const CAM_AT = (f: number) => runCamera(f, CAM.F, CAM.CY, CAM.K);
export const STATS = {
  kStart: Number(CAM.K[0].toFixed(4)),
  kRest: Number(K_REST.toFixed(5)),
  kEnd: Number(K_END.toFixed(5)),
  strokeWorld: Number(STROKE.toFixed(3)),
  strokeScreen: Number((STROKE * K_REST).toFixed(2)),
  dotR: DOT_R,
  dotScreen: Number((2 * DOT_R * K_REST).toFixed(2)),
  // the mark: its em box on screen at the resolved zoom and at the opening one
  markBox: MARK_BOX,
  markScreenRest: Number((MARK_BOX * K_REST).toFixed(1)),
  markScreenOpen: Number((MARK_BOX * CAM.K[0]).toFixed(1)),
  blobClear: BLOB_CLEAR,
  laneIn: LANE_IN,
  // how many blob seats the clear ring actually moved, and by how far
  blobPushed: (() => {
    const moved = BLOBS.filter((b) => {
      const S = BLOB_SEATS[b.seat];
      return Math.abs(Math.hypot(S.x - CORE.x, S.y - CORE.y) - BLOB_CLEAR) < 1e-6;
    }).length;
    return moved;
  })(),
  // the last frame any blob dot is alive: past it the blob cannot differ
  blobLast: Number(Math.max(...BLOBS.map((b) => (isFinite(b.fAbs) ? b.fAbs : 0))).toFixed(1)),
  stationR: R_ST.map((r) => Number(r.toFixed(1))),
  laneRank: LANE_RANK,
  econScreenR: Number((ECON_R * K_REST).toFixed(1)),
  blobSeats: BLOB_SEATS.length,
  blobs: BLOBS.length,
  annSeats: ANN.map((a) => a.length),
  seaters: SEATERS.length,
  frees: FREES.length,
  particles: BLOBS.length + SEATERS.length + FREES.length,
  seaterDepart: [
    Number(Math.min(...SEATERS.map((p) => p.depart)).toFixed(1)),
    Number(Math.max(...SEATERS.map((p) => p.depart)).toFixed(1)),
  ],
  seaterLand: [
    Number(Math.min(...SEATERS.map((p) => p.land)).toFixed(1)),
    Number(Math.max(...SEATERS.map((p) => p.land)).toFixed(1)),
  ],
  ringDeepAt: RING_DEEP_AT.map((f) => Number(f.toFixed(1))),
  ringRipeDone: RING_DEEP_AT.map((f) => Number((f + RIPE_LAG + RIPE_DUR).toFixed(1))),
  seaterStretched: SEATER_STATS.stretched,
  seaterPeakHead: Number(SEATER_STATS.peakHead.toFixed(2)),
  millHops: MILL.reduce((a, h) => a + h.length, 0),
  traffic: TRAFFIC_N,
  absorbR: R_ST.map((r) => Number((r - ANN_R1).toFixed(1))),
  absorbRMax: Number(Math.max(...FREES.map((p) => p.rAbs)).toFixed(1)),
  // the seat branch of the absorption: no annulus ever has a seat to give
  absorbSeatsFound: Array.from({ length: NL }, (_, s) =>
    Array.from({ length: DURATION + 1 }, (_, f) => vacantSeatFor(s, f)),
  )
    .flat()
    .filter((v) => v >= 0).length,
  freeLast: Number(Math.max(...FREES.map((p) => (isFinite(p.fAbs) ? p.fAbs : 0))).toFixed(1)),
  // THE POUR STILL NEVER STOPS: the largest gap, in world px, between two
  // consecutive dots on one lane over f116..f219 — measured on the free stream
  // and the departed blob dots, between the core edge and the absorption radius.
  laneGap: (() => {
    let worst = 0;
    const per: number[] = [];
    for (let f = 116; f <= 219; f++) {
      for (let s = 0; s < NL; s++) {
        const rs: number[] = [];
        for (const p of FREES) {
          if (p.lane !== s || f < p.born || f >= p.fAbs) continue;
          rs.push(Math.min(p.rAbs, CORE_EDGE + p.sf * (radAt(f) - radAt(p.born))));
        }
        for (const b of BLOBS) {
          if (b.lane !== s || f < b.depart || f >= b.fAbs) continue;
          const r0 = Math.hypot(
            BLOB_SEATS[b.seat].x - CORE.x,
            BLOB_SEATS[b.seat].y - CORE.y,
          );
          rs.push(Math.min(b.rAbs, r0 + (radAt(f) - radAt(b.depart))));
        }
        rs.sort((a, b) => a - b);
        let prev = CORE_EDGE;
        let here = 0;
        for (const r of rs) {
          here = Math.max(here, r - prev);
          prev = r;
        }
        here = Math.max(here, R_ST[s] - ANN_R1 - prev);
        per.push(here);
        worst = Math.max(worst, here);
      }
    }
    per.sort((a, b) => a - b);
    return {
      max: Number(worst.toFixed(1)),
      p95: Number(per[Math.floor(per.length * 0.95)].toFixed(1)),
      median: Number(per[Math.floor(per.length * 0.5)].toFixed(1)),
      mean: Number((per.reduce((a, b) => a + b, 0) / per.length).toFixed(1)),
      over30: per.filter((v) => v > 30).length / per.length,
    };
  })(),
};
export const WORLD_INK = {
  core: { ...CORE, r: MARK_EDGE, box: MARK_BOX },
  stations: STATION.map((s, i) => ({ ...s, r: STATION_R, lane: i })),
  econ: { ...CORE, r: ECON_R },
  blob: { r0: BLOB_R0, r1: BLOB_R1 },
};
