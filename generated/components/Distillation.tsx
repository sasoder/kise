import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
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
import { DARK_TRAFFIC_OPACITY, Trail, arriveEase } from "./levelUp";

export const FPS = 24;

// ---------------------------------------------------------------------------
// John Charles Beren, clip `JohnCharlesBeren_Experience`, cut `Distillation`:
// "This is basically what distillation is, like: they take out the models, they
//  get some of their, like, deployment data, they get some fraction of that by,
//  like, pinging the model, and then they train their next generation of models
//  on it,"
// (Context: the Chinese labs train on other labs' models' outputs.)
//
// DURATION. The composition starts at SRT 49.679 s, so every beat is
//   frame = round((t - 49.679) * 24)
//     this f0 · is f2 · basically f6 · what f9 · distillation f19 · is f27 ·
//     like f28 · they f32 · take f36 · out f39 · the f39 · models f41 ·
//     they f58 · get f60 · some f67 · of f71 · their f73 · like f76 ·
//     deployment f80 · data f88 · they f96 · get f98 · some f101 ·
//     fraction f104 · of f111 · that f114 · by f117 · like f121 ·
//     pinging f124 · the f130 · model f133 · and f148 · then f149 ·
//     they f152 · train f155 · their f159 · next f163 · generation f167 ·
//     of f173 · models f178 · on f181 · it f185 · next word "and" f190
// Speech therefore runs f0..190 and the set's 16-frame tail holds the resolved
// state: DURATION = 190 + 16 = 206.
export const DURATION = 206;

// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "a person pings a big model wrapped in its data; a thin fraction of that
//    data comes down the wire into an empty ring; the ring's contents collapse
//    into a new model."
//
// VOCABULARY, fixed, and the same meanings as the clip's other cuts:
//   the model        = ONE large solid orange dot at 2 x DOT_R, on the column
//                      axis at the top. ACCENT.
//   deployment data  = a feathered blob of 140 solid small orange dots
//                      (ACCENT_DEEP at rest) milling around the model, with a
//                      clear ~24 world px ring of daylight around the core, so
//                      the model is never buried by its own data.
//   the person       = person.png, white, filled, iconShadow, a 118 screen px
//                      box at the resolved camera — the set's human glyph.
//   the wire         = one thin white VERTICAL line on the column axis, at the
//                      set's one stroke weight.
//   a ping           = a WHITE packet (ink, not orange) travelling UP the wire.
//   the next model   = an empty WHITE ring (R 84 world) at the bottom that
//                      fills with the fraction and collapses to a new core dot.
// No text, no arrows, no flags, no icons. Orange means "the model and its data"
// and nothing else; white means ink, the person, and the ping.
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous motion, words are inflections, nothing starts from
// rest. Every gesture in the piece is on this list and nothing else happens.
//
//  1. f0-f19   "this is basically what" THE MODEL AND ITS DATA. Opens at k 1.90
//              on the big model inside its milling blob. The mill, the
//              micro-drift, the breath, the crowd's dark traffic and the grid's
//              parallax all run from frame 0, and the camera is already creeping
//              down the axis (k 1.90 -> 1.83, c 460 -> 480 over f0-26). The wire
//              does not exist yet.
//  2. f20-f60  "distillation is, like: they take out the models"
//              (distillation f19 · take f36 · models f41)
//              THE PERSON AND THE WIRE. A white wire draws HEAD-LED from the
//              ring's top straight UP the axis to the underside of the blob,
//              f20-f54 — it opens ON "distillation", which is the thing it is,
//              and lands four frames before "they get" (f58). See DEVIATIONS for
//              the 34-frame draw. Under it the camera's first glide (f26-f86,
//              k 1.83 -> 1.20, c 480 -> 800) brings the ring and the person up
//              into frame from below by ~f44 — the person is already standing
//              there and the ring already empty and white; neither is ever
//              spawned, the camera finds them. The person WAKES on "take"
//              (f34-f42, the set's 4 screen px lift).
//  3. f58-f92  "they get some of their, like, deployment data"
//              (get f60 · their f73 · deployment f80 · data f88)
//              THE BLOB LEANS. The data nearest the wire's top drifts 10-14
//              world px toward it, weighted by proximity on a smoothstep and
//              hashed per dot, over f58-f92; the blob's underside bulges toward
//              the wire end while the mill goes on. NOTHING LEAVES YET. The
//              camera's glide runs out into its held breath at k ~1.19 (drift
//              only, f86-f104, c 800 -> 808).
//  4. f82-f148 "they get some fraction of that by, like, pinging the model"
//              (get f98 · fraction f104 · by f117 · pinging f124 · model f133)
//              THE PINGS AND THE FRACTION. From f82 the person sends pings:
//              white packets leave the person's HEAD, join the wire at its foot
//              and run UP it — six 2.6 frames apart from f82, then two more at
//              f100.5 and f106 so that "pinging" (f124) still has a white head
//              climbing the wire. Each of the first six pings that
//              reaches the blob knocks FIVE dots loose from the blob's
//              underside; they fall DOWN the wire on individual hashed flights
//              (arriveEase tail 0.06, lateral bow, head speed capped at 42
//              screen px/f — measured peak 41.96) and seat into a feathered disc
//              INSIDE the ring, deep -> ripe as they seat. Departures run
//              f102-f117, landings f122-f141, so the ring is visibly FULL from
//              f141 to f148. THE FRACTION IS VISIBLY A FRACTION: the blob loses
//              30 of its 140 and the mill closes the gaps behind them. The
//              ring's stroke converts white -> ACCENT_DEEP on its 8th seated dot
//              (f126) and -> ACCENT six frames later. Camera: one slow creep in
//              toward the ring, k 1.19 -> 1.30 over f104-f144 with c easing to
//              935, so the eye is on the fraction arriving.
//  5. f148-f185 "and then they train their next generation of models on it"
//              (train f155 · next f163 · generation f167 · models f178)
//              THE COLLAPSE. The seated dots pull inward from f148, leading
//              "train" by seven — each on its own hashed arriveEase over 10
//              frames, the OUTER ones first on a nine-frame wave — dissolving as
//              they go and merging at the ring's centre into ONE new core dot
//              that grows BY AREA with each dot it swallows
//              (r = CORE_R * sqrt(n / 30)). It reaches 2 x DOT_R — the same size
//              as the model up top — at f166.5, half a frame before
//              "generation", and holds. The ring stays as its halo, ripe. The
//              person's wake lift settles back f168-f186. The camera's release:
//              one eased pull-back f150-f188 to the resolved k with c on the
//              content centre, so on "models on it" the whole column reads at
//              once — the model in its thinner blob, the wire, the person, the
//              new model in its ring.
//  6. f185-f206 THE TAIL. The blob mills, the new core breathes, the dark
//              traffic on the wire and in the crowds thins to 60% on "models"
//              (f178), and the camera keeps its decaying drift. Nothing else.
//
// ---------------------------------------------------------------------------
// LIVENESS — mechanisms, not gestures. None is on a word and none ever stops,
// so no 12-frame window of the piece holds a still frame:
//   * micro-drift on every dot, +-3 world px on two hashed sines, seated and in
//     flight; back-rung dots ride 1.45x of it. f0 -> last frame.
//   * `breath` on every dot and on both cores.
//   * the mill in the blob, from f0 to the last frame: a hop to a vacant
//     neighbouring seat on arriveEase. Every seat a departing fraction dot
//     vacates becomes a hop target, which is how the blob closes its gaps.
//   * dark traffic between seated neighbours at 0.12, no heads, thinning to
//     60% in the tail.
//   * the grid's parallax and its own -0.3 px/frame drift.
//   * the camera never parks: three glides and three decaying drifts, no frame
//     under 0.15 screen px/f.
//
// THE DEPTH LADDER. DOTS ARE SOLID (the orange Dwarkesh rule): every dot in the
// blob, in flight and seated in the ring is drawn at OP_UNREAD_DOT = 1.0 and
// carries its state in TONE (deep -> ripe) and its depth in SIZE, never alpha.
// The one surviving alpha rung on a dot is the BACK of the blob at OP_MID 0.78.
//   INK, by role:
//   FG  1.00  the person, both cores, the wire's head, the ping packets
//   MID 0.78  the containers: the wire, the ring
//   BG  0.55  unused in this cut — there is no third rung of ink here
//
// ---------------------------------------------------------------------------
// CAMERA — one keyed track, `camMove` at a key per frame through the shared
// damper, cx fixed at 540 (the column axis is the composition) and cy taken off
// the eased k so the content centre never sags.
//
//   f0-26    k 1.900 -> 1.830  c  460 ->  480  warp 0.70  the opening creep on
//                                                         the model in its blob
//   f26-86   k 1.830 -> 1.200  c  480 ->  800  warp 0.95  GLIDE 1: the ring and
//                                                         the person rise into
//                                                         frame from below
//   f86-104  k 1.200 -> 1.190  c  800 ->  808  warp 0.50  the held breath: the
//                                                         glide's own direction,
//                                                         decaying
//   f104-144 k 1.190 -> 1.300  c  808 ->  935  warp 0.85  GLIDE 2: the creep in
//                                                         on the ring filling
//   f144-150 k 1.300 -> 1.302  c  935 ->  937  warp 0.50  decaying drift
//   f150-188 k 1.302 -> solved c  937 -> 804.7 warp 0.85  GLIDE 3: the release
//   f188-254 k  -> -0.030      c  -> -6        warp 0.50  a drift still running
//                                                         when the piece ends
//
// The resting k is SOLVED so the damped camera reads exactly K_REST_TARGET on
// the last frame, and every weight in the piece is its screen number over it.
// MEASURED on the rendered track, as the screen-space velocity of each ink
// landmark (the metric the set's |dv| ceiling of 2.2 screen px/f^2 is written
// against): blob top max|v| 14.34 max|dv| 1.437 (f155); the model 12.07 / 1.231;
// the ring 21.09 / 1.300 (f34); the ring's foot 22.35 / 1.367; the person's head
// 19.44 / 1.211. Every landmark is inside the ceiling and no glide is shorter
// than 38 frames.
//
// STROKE ARITHMETIC, all at the resolved k:
//   K_REST         = 0.900 (solved; K_END 0.91225 feeds the damper)
//   wire = ring    = SCREEN_OUTLINE 6.0 / K_REST  = 6.667 world px  (6.00 screen)
//   person box     = SCREEN_PERSON 118 / K_REST   = 131.11 world px (118.0 screen)
//   dot DIAMETER   = SCREEN_DOT 14 / K_REST       = 15.55 world px  (14.0 screen)
//   core radius    = 2 x DOT_R                    = 15.55 world     (28.0 screen)
//   dark traffic   = SCREEN_TRAFFIC 3.0 / K_REST  = 3.333 world px  (3.00 screen)
//   ring R 84 world                                                 (75.6 screen)
//
// THE CAPTION BAND. The ink runs from the blob's top (460 - 158 = 302) to the
// ring's outer edge (1220 + 84 + 3.33 = 1307.3); its centre, 804.7, is the
// camera's resting c and lands on screen y 835 (CAM_LIFT). Half the span is
// 502.7 world = 452.4 screen px at K_REST, so on the last frame the ink measures
// screen y 389.2 to 1291.0 — 89 px of clearance above the band's 300 and 79
// below its 1370, with the camera's own +-5 px sway already in the number. The
// person's head lands at 1116.1 and his feet at 1215.4.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//   * THE RING IS R 84 WORLD, NOT 64, and the fraction seats in a disc of
//     radius 66 rather than 46. 30 dots of radius 8.235 have an area of 6392
//     world px^2; a disc of radius 46 has 6648, i.e. a packing fraction of 0.96,
//     which is not a crowd, it is a solid plug (and physically unreachable). R 84
//     with a seating disc of 66 gives 13,685 px^2, a packing fraction of 0.47,
//     and leaves 6.4 world px of daylight between the outermost dot and the
//     inside of the stroke, so no dot ever sits on the ring's ink. At K_REST the
//     ring is 71 screen px in radius — the same read as the station rings in
//     cut 1, which are R 64 at k 1.02.
//   * THE COLUMN'S SEPARATION IS 900 WORLD PX, NOT 940, AND THE BLOB'S RADIUS
//     158, NOT 170. The caption band is the constraint: the content centre is
//     pinned to screen 835, which leaves exactly 535 px above and below inside
//     300..1370. At the briefed 940 / 170 the ink's half-span is 588.8 world, so
//     even at k 0.84 it fills 494.6 of those 535 px and the required 40 px of
//     clearance is gone before the camera's sway is counted. 900 / 158 puts the
//     half-span at 572.7 and the resolved k at 0.850, inside the briefed
//     0.85-0.90, with 48 px of clearance top and bottom.
//   * THE WIRE DRAWS OVER f20-f54, NOT f36-f52. It is 514.7 world px from the
//     ring's top to the blob's underside, and it is drawn while the camera is
//     making its biggest move, so the head's SCREEN speed is its own speed plus
//     the camera's. Measured on the solved track: an f36-f52 draw peaks at 59
//     screen px/f, f28-f54 at 51.3, f22-f54 at 43.6 and f20-f54 at 41.6 — the
//     first window inside the set's 45 ceiling with margin. Starting at f20 puts
//     the wire's first frame on "distillation" (f19), which is what the wire
//     IS, and it still lands at f54, four frames before "they get" (f58). The
//     person's wake stays on "take" (f34-f42).
//   * THE PINGS LAUNCH f82-f106, NOT f100-f148, AND THE LAST TWO KNOCK NOTHING.
//     This is the same ceiling seen end to end. A ping's path is 686 world px
//     (the person's head to the wire's foot, then the length of the wire) and
//     the 42 screen px/f cap at k ~1.2 makes that a 20-frame climb; a knocked
//     dot's fall is another ~20; the collapse needs 10 frames plus a nine-frame
//     wave and has to be finished on "generation" (f167). Working backwards:
//     the collapse starts f148, so the ring must be full by f148, so the last
//     landing is ~f141, the last knock ~f117 and the last KNOCKING launch ~f95.
//     Six launches 2.6 frames apart from f82 do that (arrivals f102-f115,
//     landings f122-f141), and they leave "pinging" (f124) with nothing white on
//     the wire — so two more pings go at f100.5 and f106, arriving f121 and
//     f126. They knock nothing: the stream they asked for is already pouring
//     down the wire, so they are taken into the blob's underside over five
//     frames instead. Between f82 and f148 the wire therefore always carries
//     something — white heads climbing f82-f131, orange falling f102-f141, the
//     ring filling under both.
//   * EACH PING KNOCKS FIVE DOTS LOOSE, NOT ONE OR TWO. Thirty dots is the
//     briefed fraction (30 of 140) and six pings is what the window above
//     allows; 1-2 per ping would put 9 dots in the ring and the ring would not
//     read as filled. The five leave on a 0-3.2 frame hashed stagger, so a knock
//     is a small burst off the underside rather than five dots in a row.
//   * THE WIRE'S DARK TRAFFIC STARTS AT f138, NOT AT THE WIRE'S LANDING. Dark
//     traffic in this set is accent at 0.12, and accent moving down the wire
//     says "data is coming down it". Before f102 nothing has left the model, so
//     running it from the wire's landing would contradict gesture 3's "nothing
//     leaves yet"; and between f102 and f138 the wire is carrying the fraction
//     itself at full opacity, which is the same statement said louder. So it
//     starts once the fraction is through, and thins to 60% on "models" (f178)
//     with the traffic in the crowds.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: data that has landed in the new model
  accentDeep: z.string(), // deep: data at rest around the model it came from
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  personSrc: z.string(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotOpacity: z.number(),
  beats: z.object({
    this: z.number(),
    distillation: z.number(),
    take: z.number(),
    models: z.number(),
    get1: z.number(),
    deployment: z.number(),
    data: z.number(),
    fraction: z.number(),
    pinging: z.number(),
    train: z.number(),
    generation: z.number(),
    modelsOnIt: z.number(),
    end: z.number(), // next word "and"; tail to 206
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
  personSrc: "person.png",
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    this: 0,
    distillation: 19,
    take: 36,
    models: 41,
    get1: 58,
    deployment: 80,
    data: 88,
    fraction: 104,
    pinging: 124,
    train: 155,
    generation: 167,
    modelsOnIt: 178,
    end: 190,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const CX = 540;

// --- the depth ladder ------------------------------------------------------
const OP_FG = 1.0;
const OP_MID = 0.78;
const BG_R_SCALE = 0.8;
const BG_DRIFT = 1.45;
const BACK_FRACTION = 0.4; // the outer 40% of the blob goes on the back rung
const DEPTH_JITTER = 0.34;
const R_SPREAD = 0.18; // +-18% hashed per-dot radius

// ---------------------------------------------------------------------------
// THE LAYOUT, in world px. One centred column on x = 540: the model and its
// data at the top, the empty ring at the bottom, the person standing beside the
// ring with his feet on its centre line.
// ---------------------------------------------------------------------------
const MODEL = { x: CX, y: 460 };
const SEPARATION = 760; // model centre -> ring centre (see DEVIATIONS)
const RING = { x: CX, y: MODEL.y + SEPARATION }; // (540, 1360)
const RING_R = 84;

const BLOB_R1 = 158; // the data's outer radius

// ---------------------------------------------------------------------------
// THE CAMERA. fieldShared's camMove verbatim — one key per frame on an eased
// curve, cy taken off the eased k, the set's CAM_LIFT of 125 — then the shared
// damper. cx is fixed: the column IS the composition.
// ---------------------------------------------------------------------------
const K_REST_TARGET = 0.9;
const LAST = DURATION - 1;

type Seg = { f0: number; f1: number; k0: number; k1: number; c0: number; c1: number; warp: number };

// The content centre: the midpoint of the ink the piece resolves on. Restated
// here as a literal because the ink's extent depends on STROKE, which depends
// on K_REST, which depends on this. The real extent is measured off the solved
// weights in STATS.band and must agree with it.
const CONTENT_C = 804.7;

const segsFor = (kEnd: number): Seg[] => [
  { f0: 0, f1: 26, k0: 1.9, k1: 1.83, c0: 460, c1: 480, warp: 0.7 },
  { f0: 26, f1: 86, k0: 1.83, k1: 1.2, c0: 480, c1: 800, warp: 0.95 },
  { f0: 86, f1: 104, k0: 1.2, k1: 1.19, c0: 800, c1: 808, warp: 0.5 },
  { f0: 104, f1: 144, k0: 1.19, k1: 1.3, c0: 808, c1: 935, warp: 0.85 },
  { f0: 144, f1: 150, k0: 1.3, k1: 1.302, c0: 935, c1: 937, warp: 0.5 },
  { f0: 150, f1: 188, k0: 1.302, k1: kEnd, c0: 937, c1: CONTENT_C, warp: 0.85 },
  {
    f0: 188,
    f1: DURATION + 48,
    k0: kEnd,
    k1: kEnd - 0.03,
    c0: CONTENT_C,
    c1: CONTENT_C - 6,
    warp: 0.5,
  },
];

const trackOf = (segs: Seg[]) => {
  const F: number[] = [0];
  const K: number[] = [segs[0].k0];
  const CY: number[] = [segs[0].c0 + CAM_LIFT / segs[0].k0];
  for (const s of segs) {
    const m = camMove(s);
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
const K_END = (() => {
  const a = 0.78;
  const b = 0.95;
  const fa = kAtLast(a);
  const fb = kAtLast(b);
  return a + ((K_REST_TARGET - fa) * (b - a)) / (fb - fa);
})();
/** The zoom every weight in the piece is written against. */
const K_REST = kAtLast(K_END);

const CAM = trackOf(segsFor(K_END));

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
// THE WEIGHTS, in SCREEN px at the resting zoom. One outline weight for the
// wire and the ring; the clip's measured harmony spec for the glyph and dot.
// ---------------------------------------------------------------------------
const SCREEN_OUTLINE = 6.0;
const SCREEN_TRAFFIC = 3.0; // 0.5 x the outline
const SCREEN_PERSON = 118.0; // person.png box
const SCREEN_DOT = 14.0; // front-rung dot DIAMETER

const STROKE = SCREEN_OUTLINE / K_REST;
const DARK_TRAFFIC_STROKE = SCREEN_TRAFFIC / K_REST;
const GLYPH = SCREEN_PERSON / K_REST;
const DOT_R = SCREEN_DOT / 2 / K_REST;
const CORE_R = 2 * DOT_R;

// The person's ink inside its box (measured off person.png once, in cut 2 of
// this clip). He stands LEFT of the ring with his feet on its centre line.
const PERSON_INK_TOP = 40 / 512;
const PERSON_FOOT = 471 / 512;
const PERSON_X = CX - 170;
const PERSON_BOX_TOP = RING.y - GLYPH * PERSON_FOOT;
const PERSON = { x: PERSON_X, y: PERSON_BOX_TOP + GLYPH / 2 };
const HEAD_TOP_Y = PERSON_BOX_TOP + GLYPH * PERSON_INK_TOP;
const FOOT_Y = RING.y;

// ---------------------------------------------------------------------------
// THE WIRE. One vertical ink line on the column axis, from the top of the ring
// to the underside of the blob. Head-led, drawn upward.
// ---------------------------------------------------------------------------
const WIRE_FOOT = { x: CX, y: RING.y - RING_R - STROKE / 2 };
const WIRE_TOP = { x: CX, y: MODEL.y + BLOB_R1 };
const WIRE_LEN = WIRE_FOOT.y - WIRE_TOP.y;
const WIRE_F0 = 20;
const WIRE_F1 = 54;
const WIRE_TAIL = 0.06; // arriveEase tail; see DEVIATIONS for the cruise speed

// The person's wake: the set's 4 screen px lift, before he acts, settling back
// once the new model is his.
const WAKE_F0 = 34;
const WAKE_F1 = 42;
const SETTLE_F0 = 168;
const SETTLE_F1 = 186;

// ---------------------------------------------------------------------------
// THE BLOB — the model's deployment data. A feathered ring of seats around the
// core with a clear 24 world px of daylight inside it.
// ---------------------------------------------------------------------------
const BLOB_R0 = CORE_R + 24;
const BLOB_STEP = 2.45 * DOT_R;
const N_BLOB = 140;

type Seat = { x: number; y: number; r: number; depth: number };

const BLOB_SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  const cols = Math.ceil((2 * BLOB_R1) / BLOB_STEP) + 2;
  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x = MODEL.x - BLOB_R1 + c * BLOB_STEP + (hash(i, 11) - 0.5) * BLOB_STEP * 0.9;
      const y = MODEL.y - BLOB_R1 + r * BLOB_STEP + (hash(i, 12) - 0.5) * BLOB_STEP * 0.9;
      const dx = x - MODEL.x;
      const dy = y - MODEL.y;
      const rho = Math.hypot(dx, dy);
      const wob = wobble(Math.atan2(dy, dx) * WOBBLE_R, 2.3) * 5;
      const inside = Math.min((BLOB_R1 + wob - rho) / 16, (rho - BLOB_R0) / 10);
      const f = feather(inside, 1);
      if (f <= 0 || hash(i, 71) >= f) continue;
      out.push({
        x,
        y,
        r:
          (0.85 + 0.35 * hash(i, 13)) *
          (0.72 + 0.28 * f) *
          (1 + (hash(i, 27) - 0.5) * 2 * R_SPREAD),
        depth: clamp01(
          (rho - BLOB_R0) / (BLOB_R1 - BLOB_R0) + (hash(i, 23) - 0.5) * DEPTH_JITTER,
        ),
      });
    }
  }
  return out;
})();

/** Which blob seats are occupied: blue-noise vacancies, so the mill always has
 *  somewhere to hop and every gap is a hole with dots all round it. */
const BLOB_USED: number[] = (() => {
  const seats = BLOB_SEATS;
  const n = Math.min(N_BLOB, seats.length);
  const want = seats.length - n;
  const empty = new Uint8Array(seats.length);
  const order = seats.map((_, i) => i).sort((a, b) => hash(b, 77) - hash(a, 77));
  const near = (a: number, b: number) =>
    Math.hypot(seats[a].x - seats[b].x, seats[a].y - seats[b].y) < BLOB_STEP * 1.6;
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
})();

// Each occupied seat's rung is its percentile among the seats actually used, so
// BACK_FRACTION means the outer 40% whatever the blob's shape.
(() => {
  const idx = BLOB_USED.slice().sort((a, b) => BLOB_SEATS[a].depth - BLOB_SEATS[b].depth);
  idx.forEach((i, r) => {
    BLOB_SEATS[i].depth = r / Math.max(1, BLOB_USED.length - 1);
  });
})();

// ---------------------------------------------------------------------------
// THE LEAN. The data nearest the wire's top drifts toward it: weighted by
// proximity on a smoothstep, hashed 10-14 world px, over f58-f92. The mill runs
// straight through it; nothing leaves.
// ---------------------------------------------------------------------------
const LEAN_F0 = 58;
const LEAN_F1 = 92;
const LEAN_REACH = 165;
const leanWeight = (x: number, y: number) =>
  smoothstep(clamp01((LEAN_REACH - Math.hypot(x - WIRE_TOP.x, y - WIRE_TOP.y)) / LEAN_REACH));

// ---------------------------------------------------------------------------
// THE PINGS. White packets, from the person's head to the wire's foot and then
// up the wire. Eight launches from f82; the speed is the set's
// 45 screen px/frame ceiling, converted per frame off the camera.
// ---------------------------------------------------------------------------
// Eight launches. The first SIX each knock five dots loose; the last two are
// answered by the stream that is already running, so they dissolve into the
// blob's underside instead — they exist so that "pinging" (f124) still has a
// white head climbing the wire while the fraction pours down it.
const PING_F0 = 82;
const PING_PERIOD = 2.6;
const N_KNOCK_PING = 6;
const PING_BORN = [
  PING_F0,
  PING_F0 + PING_PERIOD,
  PING_F0 + 2 * PING_PERIOD,
  PING_F0 + 3 * PING_PERIOD,
  PING_F0 + 4 * PING_PERIOD,
  PING_F0 + 5 * PING_PERIOD,
  100.5,
  106,
];
const N_PING = PING_BORN.length;
const PING_DISSOLVE = 5; // frames a late ping takes to be taken in by the blob
const PING_LEAD = { x: PERSON.x, y: HEAD_TOP_Y };
const PING_LEG_A = Math.hypot(WIRE_FOOT.x - PING_LEAD.x, WIRE_FOOT.y - PING_LEAD.y);
const PING_LEN = PING_LEG_A + WIRE_LEN;
const PING_SPEED = 40; // nominal; the screen-speed cap below is what binds
const PING_R = 9; // world; 3x the wire's half-width, so a ping is a head, not a bump

/** One shared cumulative-distance table for the ping's climb, so no head in the
 *  stream is ever over the ceiling however tight the camera is. */
const PING_CAP = 42; // screen px/frame; the set's ceiling is 45
const PING_RAD: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= DURATION + 120; f++) {
    out.push(out[f - 1] + Math.min(PING_SPEED, PING_CAP / kAt(Math.min(f, DURATION))));
  }
  return out;
})();
const pingRadAt = (f: number) =>
  PING_RAD[Math.max(0, Math.min(PING_RAD.length - 1, Math.round(f)))];

/** The point a ping has reached, `d` world px along its path, or null past the
 *  end. Leg A is the lead off the head; leg B is the climb up the wire. */
const pingPoint = (d: number) => {
  if (d < 0) return null;
  if (d <= PING_LEG_A) {
    const t = d / PING_LEG_A;
    // a shallow bow, so the lead is a lift onto the wire and not a ruled line
    const bow = Math.sin(Math.PI * t) * -10;
    return {
      x: PING_LEAD.x + (WIRE_FOOT.x - PING_LEAD.x) * t,
      y: PING_LEAD.y + (WIRE_FOOT.y - PING_LEAD.y) * t + bow,
    };
  }
  const u = (d - PING_LEG_A) / WIRE_LEN;
  if (u > 1) return null;
  return { x: WIRE_FOOT.x, y: WIRE_FOOT.y - WIRE_LEN * u };
};

type Ping = { born: number; arrive: number };
const PINGS: Ping[] = (() => {
  const out: Ping[] = [];
  for (let n = 0; n < N_PING; n++) {
    const born = PING_BORN[n];
    // the frame it reaches the blob, off the shared table
    let arrive = born + 1;
    for (let f = Math.floor(born) + 1; f <= DURATION + 60; f++) {
      if (pingRadAt(f) - pingRadAt(born) >= PING_LEN) {
        arrive = f;
        break;
      }
      arrive = f;
    }
    out.push({ born, arrive });
  }
  return out;
})();

// ---------------------------------------------------------------------------
// THE FRACTION. Thirty of the blob's 140 dots — the ones on its UNDERSIDE,
// nearest the wire's top — are knocked loose, five per ping, and fall down the
// wire into the ring. The blob keeps the other 110 and the mill closes behind.
// ---------------------------------------------------------------------------
const N_FRACTION = 30;
const KNOCK_PER_PING = N_FRACTION / N_KNOCK_PING; // 5
const KNOCK_STAGGER = 2.5; // frames, hashed, inside one knock

/** The fraction, in departure order: nearest the wire's top leaves first. */
const FRACTION_SEATS: number[] = BLOB_USED.slice()
  .sort(
    (a, b) =>
      Math.hypot(BLOB_SEATS[a].x - WIRE_TOP.x, BLOB_SEATS[a].y - WIRE_TOP.y) -
      Math.hypot(BLOB_SEATS[b].x - WIRE_TOP.x, BLOB_SEATS[b].y - WIRE_TOP.y),
  )
  .slice(0, N_FRACTION);

// ---------------------------------------------------------------------------
// THE RING'S DISC. A feathered disc of seats inside the ring, filled from the
// TOP — the side the fraction arrives on — wrapping round and down.
// ---------------------------------------------------------------------------
const DISC_R = 66;
const DISC_STEP = 2.15 * DOT_R;

type DiscSeat = Seat & { phi: number; rho: number };

const DISC: DiscSeat[] = (() => {
  const out: DiscSeat[] = [];
  const cols = Math.ceil((2 * DISC_R) / DISC_STEP) + 2;
  const inAng = -Math.PI / 2; // the fraction comes down from above
  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c + 4409;
      const x = RING.x - DISC_R + c * DISC_STEP + (hash(i, 11) - 0.5) * DISC_STEP * 0.9;
      const y = RING.y - DISC_R + r * DISC_STEP + (hash(i, 12) - 0.5) * DISC_STEP * 0.9;
      const dx = x - RING.x;
      const dy = y - RING.y;
      const rho = Math.hypot(dx, dy);
      const th = Math.atan2(dy, dx);
      const wob = wobble(th * WOBBLE_R, 5.7) * 3;
      const f = feather((DISC_R + wob - rho) / 10, 1);
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
        depth: clamp01(rho / DISC_R),
        phi,
        rho,
      });
    }
  }
  // Fill order: from the side the dots arrive on, wrapping round, hashed hard
  // enough that the boundary between filled and not is never a drawn line.
  return out.sort(
    (a, b) => Math.abs(a.phi) - 0.6 * hash(a.x, 5) - (Math.abs(b.phi) - 0.6 * hash(b.x, 5)),
  );
})();

// ---------------------------------------------------------------------------
// THE FALL. Each knocked dot leaves its blob seat, joins the wire just under the
// blob, runs DOWN it on a hashed lateral bow and steps into its disc seat. The
// flight is stretched a frame at a time until its peak SCREEN head speed is
// inside the set's ceiling.
// ---------------------------------------------------------------------------
const FALL_SPEED = 34; // world px/frame, nominal
const FALL_TAIL = 0.06; // arriveEase tail; keeps the cruise at 1.12x the mean
const FALL_JIT = 16; // world px of lateral bow on the wire leg
const SEAT_TONE = 6; // frames a dot takes to go deep -> ripe as it seats
const HEAD_CAP = 42; // screen px/frame; the set's ceiling is 45

type Faller = {
  seat: number; // blob seat it leaves
  disc: number; // index into DISC
  depart: number;
  land: number;
  j: number;
  back: boolean;
};

const FALL_STATS = { stretched: 0, peakHead: 0 };

/** A faller's path, as a 3-point polyline: the blob seat, the wire's top, and
 *  the disc seat, with the lateral bow riding the middle leg. */
const fallPointAt = (seat: number, disc: number, j: number, u: number) => {
  const S = BLOB_SEATS[seat];
  const D = DISC[disc];
  const P1 = { x: WIRE_TOP.x + j, y: WIRE_TOP.y + 6 };
  const legA = Math.hypot(P1.x - S.x, P1.y - S.y);
  const legB = Math.hypot(D.x - P1.x, D.y - P1.y);
  const len = legA + legB;
  const d = u * len;
  if (d <= legA) {
    const t = d / Math.max(1e-6, legA);
    return { x: S.x + (P1.x - S.x) * t, y: S.y + (P1.y - S.y) * t, len };
  }
  const t = (d - legA) / Math.max(1e-6, legB);
  const bow = j * 0.9 * Math.sin(Math.PI * t);
  return { x: P1.x + (D.x - P1.x) * t + bow, y: P1.y + (D.y - P1.y) * t, len };
};

const FALLERS: Faller[] = (() => {
  const out: Faller[] = [];
  FRACTION_SEATS.forEach((seat, n) => {
    const ping = PINGS[Math.min(N_KNOCK_PING - 1, Math.floor(n / KNOCK_PER_PING))];
    const depart = ping.arrive + hash(seat, 121) * KNOCK_STAGGER;
    const j = (hash(seat, 122) - 0.5) * 2 * FALL_JIT;
    const disc = n;
    const len = fallPointAt(seat, disc, j, 1).len;
    let flight = Math.max(8, len / FALL_SPEED);
    const peak = (fl: number) => {
      let mx = 0;
      for (let f = Math.ceil(depart) + 1; f <= depart + fl; f++) {
        const a = fallPointAt(seat, disc, j, arriveEase(clamp01((f - 1 - depart) / fl), FALL_TAIL));
        const b = fallPointAt(seat, disc, j, arriveEase(clamp01((f - depart) / fl), FALL_TAIL));
        const pa = screenAt(f - 1, a.x, a.y);
        const pb = screenAt(f, b.x, b.y);
        mx = Math.max(mx, Math.hypot(pb[0] - pa[0], pb[1] - pa[1]));
      }
      return mx;
    };
    let guard = 0;
    while (peak(flight) > HEAD_CAP && guard < 60) {
      flight += 1;
      guard++;
    }
    if (guard > 0) FALL_STATS.stretched++;
    FALL_STATS.peakHead = Math.max(FALL_STATS.peakHead, peak(flight));
    out.push({
      seat,
      disc,
      depart,
      land: depart + flight,
      j,
      back: BLOB_SEATS[seat].depth > 1 - BACK_FRACTION,
    });
  });
  return out;
})();

const LAND_SORTED = FALLERS.map((p) => p.land).sort((a, b) => a - b);

// The ring converts on its 8th seated dot, and turns ripe six frames later.
const DEEP_AFTER = 8;
const DEEP_DUR = 8;
const RIPE_LAG = 6;
const RIPE_DUR = 6;
const RING_DEEP_AT = LAND_SORTED[Math.min(DEEP_AFTER - 1, LAND_SORTED.length - 1)];

// ---------------------------------------------------------------------------
// THE COLLAPSE. Every seated dot pulls in to the ring's centre on its own hashed
// arriveEase, the OUTER ones first, and the new core grows BY AREA with each one
// it swallows. A dot that is still falling when the collapse starts gets its
// three frames in the ring first and then follows the rest in.
// ---------------------------------------------------------------------------
const COLLAPSE_F0 = 148;
const COLLAPSE_SPREAD = 9.0; // frames between the outermost and the innermost
const COLLAPSE_DUR = 10;

const COLLAPSE: { start: number; merge: number }[] = (() => {
  const order = FALLERS.map((p, i) => i).sort((a, b) => DISC[b].rho - DISC[a].rho); // outer first
  const rank = new Array<number>(FALLERS.length);
  order.forEach((i, r) => {
    rank[i] = r / Math.max(1, FALLERS.length - 1);
  });
  return FALLERS.map((p, i) => {
    const start =
      Math.max(COLLAPSE_F0, p.land + 3) +
      rank[i] * COLLAPSE_SPREAD +
      (hash(i, 131) - 0.5) * 1.6;
    return { start, merge: start + COLLAPSE_DUR };
  });
})();
const MERGE_SORTED = COLLAPSE.map((c) => c.merge).sort((a, b) => a - b);
const newCoreR = (frame: number) => {
  let n = 0;
  for (const m of MERGE_SORTED) {
    if (frame >= m) n++;
    else break;
  }
  return CORE_R * Math.sqrt(n / N_FRACTION);
};

// ---------------------------------------------------------------------------
// THE MILL. In the blob from f0 to the last frame, and in the ring's disc from
// its first landing until each dot's own collapse. A hop to a vacant
// neighbouring seat on arriveEase; one occupancy map, so two dots never share a
// seat. A departing fraction dot VACATES its seat, which is how the blob visibly
// closes its gaps.
// ---------------------------------------------------------------------------
const MILL_DUR = 11;
const MILL_RATE = 1.6; // hops per frame

type Hop = { from: number; to: number; t0: number };

const BLOB_DOTS: { seat: number; fraction: number }[] = BLOB_USED.map((seat) => ({
  seat,
  fraction: FALLERS.findIndex((p) => p.seat === seat),
}));

const BLOB_MILL: Hop[][] = BLOB_DOTS.map(() => []);
(() => {
  const seats = BLOB_SEATS;
  // Neighbours are drawn from EVERY seat, not only the occupied ones: the
  // blue-noise vacancies are exactly what the mill hops into, and a neighbour
  // list built from BLOB_USED alone would have no vacancy in it at all.
  const nbOf = new Map<number, number[]>();
  seats.forEach((a, i) => {
    nbOf.set(
      i,
      seats
        .map((b, j) => ({ b, j }))
        .filter(
          ({ b, j }) =>
            j !== i && Math.hypot(b.x - a.x, b.y - a.y) <= BLOB_STEP * 1.5,
        )
        .map(({ j }) => j),
    );
  });
  const occ = new Map<number, number>();
  const seatOf = new Map<number, number>();
  BLOB_DOTS.forEach((d, i) => {
    occ.set(d.seat, i);
    seatOf.set(i, d.seat);
  });
  const busy = new Map<number, number>();
  const gone = new Set<number>();
  let acc = 0;
  let id = 1301;
  for (let f = 0; f <= DURATION; f++) {
    // departures vacate their seat
    BLOB_DOTS.forEach((d, i) => {
      if (d.fraction < 0 || gone.has(i)) return;
      if (f >= FALLERS[d.fraction].depart) {
        gone.add(i);
        occ.delete(seatOf.get(i) as number);
      }
    });
    acc += MILL_RATE;
    while (acc >= 1) {
      acc -= 1;
      const jj = id++;
      const start = Math.floor(hash(jj, 51) * BLOB_DOTS.length);
      let pick = -1;
      let free: number[] = [];
      for (let t = 0; t < BLOB_DOTS.length; t++) {
        const c = (start + t) % BLOB_DOTS.length;
        if (gone.has(c)) continue;
        // a dot that is about to leave stays put, so its exit is its own gesture
        if (BLOB_DOTS[c].fraction >= 0 && f > FALLERS[BLOB_DOTS[c].fraction].depart - MILL_DUR - 2)
          continue;
        if ((busy.get(c) ?? -1) > f) continue;
        const cand = (nbOf.get(seatOf.get(c) as number) as number[]).filter((q) => !occ.has(q));
        if (cand.length === 0) continue;
        pick = c;
        free = cand;
        break;
      }
      if (pick < 0) break;
      const from = seatOf.get(pick) as number;
      const to = free[Math.floor(hash(jj, 52) * free.length) % free.length];
      occ.delete(from);
      occ.set(to, pick);
      seatOf.set(pick, to);
      busy.set(pick, f + MILL_DUR);
      BLOB_MILL[pick].push({ from, to, t0: f });
    }
  }
})();

// ---------------------------------------------------------------------------
// Dark traffic between seated neighbours.
// ---------------------------------------------------------------------------
const TRAFFIC_N = idleThreads(N_BLOB + N_FRACTION);
const TRAFFIC_REACH = 46;

// Dark traffic ON THE WIRE: once the fraction is through, short accent segments
// keep sliding DOWN it — the line is taken, not dead — thinning to 60% in the
// tail with the rest of the traffic.
const WIRE_TRAFFIC_F0 = 138;
const WIRE_TRAFFIC_N = 5;
const WIRE_TRAFFIC_LEN = 38;
const WIRE_TRAFFIC_PERIOD = 34;

// THE MICRO-DRIFT. Two hashed sines per axis, +-3 world px, never in unison.
const micro = (i: number, f: number) => ({
  dx:
    1.8 * Math.sin(f * 0.2417 + hash(i, 17) * 6.283) +
    1.2 * Math.sin(f * 0.1533 + hash(i, 19) * 6.283),
  dy:
    1.7 * Math.sin(f * 0.2094 + hash(i, 18) * 6.283) +
    1.3 * Math.sin(f * 0.1396 + hash(i, 20) * 6.283),
});

type Live = {
  key: string;
  x: number;
  y: number;
  r: number;
  op: number;
  tone: number;
  back: boolean;
  seated: boolean;
};

// ---------------------------------------------------------------------------

const Distillation: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  personSrc,
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
  const toDeep = makeTone(ink, accentDeep);
  const toRipe = makeTone(accentDeep, accent);

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const leanT = smoothstep(clamp01((frame - LEAN_F0) / (LEAN_F1 - LEAN_F0)));

  const live: Live[] = [];

  // -- the data: the mill, the lean, the fall, the seat, the collapse ---------
  BLOB_DOTS.forEach((d, i) => {
    const fall = d.fraction >= 0 ? FALLERS[d.fraction] : null;
    const md = micro(i, frame);
    const back = BLOB_SEATS[d.seat].depth > 1 - BACK_FRACTION;
    const dm = back ? BG_DRIFT : 1;
    const baseR =
      DOT_R * BLOB_SEATS[d.seat].r * (back ? BG_R_SCALE : 1) * breath(frame, hash(i, 9));

    // --- still in the blob: mill + lean
    if (!fall || frame < fall.depart) {
      let cur = d.seat;
      let liveHop: Hop | null = null;
      for (const h of BLOB_MILL[i]) {
        if (frame >= h.t0 + MILL_DUR) cur = h.to;
        else if (frame >= h.t0) {
          liveHop = h;
          break;
        } else break;
      }
      let x: number;
      let y: number;
      if (liveHop) {
        const u = arriveEase(clamp01((frame - liveHop.t0) / MILL_DUR));
        const A = BLOB_SEATS[liveHop.from];
        const B = BLOB_SEATS[liveHop.to];
        const ddx = B.x - A.x;
        const ddy = B.y - A.y;
        const L = Math.hypot(ddx, ddy) || 1;
        const bow = Math.sin(Math.PI * u) * (hash(i, 61) - 0.5) * 6;
        x = A.x + ddx * u + (-ddy / L) * bow;
        y = A.y + ddy * u + (ddx / L) * bow;
      } else {
        x = BLOB_SEATS[cur].x;
        y = BLOB_SEATS[cur].y;
      }
      const w = leanWeight(x, y);
      const amt = (10 + 4 * hash(i, 141)) * w * leanT;
      const lx = WIRE_TOP.x - x;
      const ly = WIRE_TOP.y - y;
      const LL = Math.hypot(lx, ly) || 1;
      live.push({
        key: `d${i}`,
        x: x + (lx / LL) * amt + md.dx * dm,
        y: y + (ly / LL) * amt + md.dy * dm,
        r: baseR,
        op: back ? OP_MID : OP_FG,
        tone: 0,
        back,
        seated: true,
      });
      return;
    }

    // --- the fall, the seat, the collapse
    const col = COLLAPSE[d.fraction];
    if (frame >= col.merge) return; // swallowed by the new core
    let x: number;
    let y: number;
    let tone = 0;
    let seated = false;
    let r = baseR;
    if (frame < fall.land) {
      const u = arriveEase(clamp01((frame - fall.depart) / (fall.land - fall.depart)), FALL_TAIL);
      const p = fallPointAt(fall.seat, fall.disc, fall.j, u);
      x = p.x;
      y = p.y;
    } else if (frame < col.start) {
      const S = DISC[fall.disc];
      x = S.x;
      y = S.y;
      tone = clamp01((frame - fall.land) / SEAT_TONE);
      seated = true;
    } else {
      const S = DISC[fall.disc];
      const u = arriveEase(clamp01((frame - col.start) / COLLAPSE_DUR));
      x = S.x + (RING.x - S.x) * u;
      y = S.y + (RING.y - S.y) * u;
      tone = 1;
      r = baseR * (1 - 0.8 * u * u); // it dissolves into the core it is feeding
    }
    live.push({
      key: `d${i}`,
      x: x + md.dx * (frame < fall.land ? 1 : 0.6),
      y: y + md.dy * (frame < fall.land ? 1 : 0.6),
      r,
      op: OP_FG,
      tone,
      back: false,
      seated,
    });
  });

  // -- dark traffic, between seated neighbours -------------------------------
  const seatedDots = live.filter((d) => d.seated);
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number };
  const traffic: Th[] = [];
  if (seatedDots.length > 1) {
    const n = seatedDots.length;
    const count = Math.round(TRAFFIC_N * (frame < beats.modelsOnIt ? 1 : 0.6));
    for (let j = 0; j < count; j++) {
      const period = 40 - 12 * hash(j, 4);
      const local = frame + hash(j, 5) * period;
      const cycle = Math.floor(local / period);
      const phase = (local - cycle * period) / period;
      const seed = j * 131 + cycle * 7;
      const A = seatedDots[Math.floor(hash(seed, 6) * n) % n];
      let B: Live | null = null;
      for (let t = 0; t < 12; t++) {
        const C = seatedDots[Math.floor(hash(seed + t * 17, 8) * n) % n];
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

  // -- dark traffic on the wire ---------------------------------------------
  const wireTraffic: { key: string; y1: number; y2: number; op: number }[] = [];
  if (frame >= WIRE_TRAFFIC_F0) {
    const n = Math.round(WIRE_TRAFFIC_N * (frame < beats.modelsOnIt ? 1 : 0.6));
    for (let j = 0; j < n; j++) {
      const period = WIRE_TRAFFIC_PERIOD - 9 * hash(j, 44);
      const local = frame - WIRE_TRAFFIC_F0 + hash(j, 45) * period;
      const u = (local % period) / period;
      const y = WIRE_TOP.y + (WIRE_LEN + WIRE_TRAFFIC_LEN) * u - WIRE_TRAFFIC_LEN;
      const fade = smoothstep(clamp01(u / 0.12)) * (1 - smoothstep(clamp01((u - 0.82) / 0.18)));
      if (fade <= 0.03) continue;
      wireTraffic.push({
        key: `wt${j}`,
        y1: Math.max(WIRE_TOP.y, y),
        y2: Math.min(WIRE_FOOT.y, y + WIRE_TRAFFIC_LEN),
        op: DARK_TRAFFIC_OPACITY * fade,
      });
    }
  }

  // -- the wire --------------------------------------------------------------
  const wireU = arriveEase(clamp01((frame - WIRE_F0) / (WIRE_F1 - WIRE_F0)), WIRE_TAIL);
  const wireHeadY = WIRE_FOOT.y - WIRE_LEN * wireU;

  // -- the pings -------------------------------------------------------------
  const pingAt = (p: Ping) => (f: number) => {
    if (f < p.born) return null;
    // a ping that has reached the blob holds at its end while it dissolves
    const d = Math.min(pingRadAt(f) - pingRadAt(p.born), PING_LEN);
    return pingPoint(d);
  };
  const pingLive = PINGS.map((p, n) => ({ p, n, at: pingAt(p) })).filter(
    ({ p }) => frame >= p.born && frame < p.arrive + PING_DISSOLVE,
  );

  // -- the ring --------------------------------------------------------------
  const deepT = clamp01((frame - RING_DEEP_AT) / DEEP_DUR);
  const ripeT = clamp01((frame - (RING_DEEP_AT + RIPE_LAG)) / RIPE_DUR);
  const ringColour =
    frame >= RING_DEEP_AT + RIPE_LAG ? toRipe(smoothstep(ripeT)) : toDeep(smoothstep(deepT));
  const newR = newCoreR(frame);

  // -- the person ------------------------------------------------------------
  const swayX = (1.5 / k) * Math.sin(frame * 0.083 + 0.9);
  const swayY = (1.2 / k) * Math.sin(frame * 0.061 + 2.4);
  const lift =
    4 *
    smoothstep(clamp01((frame - WAKE_F0) / (WAKE_F1 - WAKE_F0))) *
    (1 - smoothstep(clamp01((frame - SETTLE_F0) / (SETTLE_F1 - SETTLE_F0))));

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
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* THE WIRE: head-led up the axis, from the ring to the data. One
                rung back from the things it joins. */}
            {wireU > 0 ? (
              <g style={{ filter: icon }}>
                <line
                  x1={WIRE_FOOT.x}
                  y1={WIRE_FOOT.y}
                  x2={WIRE_FOOT.x}
                  y2={wireHeadY}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={OP_MID}
                />
                {wireU < 1 ? (
                  <circle cx={WIRE_FOOT.x} cy={wireHeadY} r={4.5 / k} fill={ink} opacity={OP_FG} />
                ) : null}
              </g>
            ) : null}

            {/* THE RING: the next generation of models, empty and white until
                the fraction lands in it. */}
            <g style={{ filter: icon }}>
              <circle
                cx={RING.x}
                cy={RING.y}
                r={RING_R}
                fill="none"
                stroke={ringColour}
                strokeWidth={STROKE}
                opacity={OP_MID + (OP_FG - OP_MID) * smoothstep(deepT)}
              />
            </g>

            {/* dark traffic on the wire: the line is taken, not dead. */}
            {wireTraffic.map((t) => (
              <line
                key={t.key}
                x1={WIRE_FOOT.x}
                y1={t.y1}
                x2={WIRE_FOOT.x}
                y2={t.y2}
                stroke={accent}
                strokeWidth={DARK_TRAFFIC_STROKE}
                strokeLinecap="round"
                opacity={t.op}
              />
            ))}

            {/* dark traffic in the crowds: taken, not dead. No heads. */}
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

            {/* the data, on the depth ladder: the back of the blob first and
                dimmer, then the front over the top. Tone means state. */}
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

            {/* THE MODEL. One dot on the axis, from the first frame to the last.
                Everything the fraction is made of came out of it. */}
            <circle
              cx={MODEL.x}
              cy={MODEL.y}
              r={CORE_R * breath(frame, 0.31)}
              fill={accent}
              opacity={dotOpacity * OP_FG}
              style={{ filter: icon }}
            />

            {/* THE NEXT GENERATION. It grows by area as the ring's contents
                merge into it, and holds at the size of the model above. */}
            {newR > 0.5 ? (
              <circle
                cx={RING.x}
                cy={RING.y}
                r={newR * breath(frame, 0.77)}
                fill={accent}
                opacity={dotOpacity * OP_FG}
                style={{ filter: icon }}
              />
            ) : null}

            {/* THE PINGS: white, and they go UP. */}
            <g style={{ filter: icon }}>
              {pingLive.map(({ p, n, at }) => {
                const q = at(frame) as { x: number; y: number };
                const shrink =
                  frame <= p.arrive ? 1 : 1 - smoothstep(clamp01((frame - p.arrive) / PING_DISSOLVE));
                return (
                  <g key={`pg${n}`}>
                    <Trail frame={frame} k={k} at={at} r={PING_R * shrink} fill={ink} opacity={OP_FG} />
                    <circle cx={q.x} cy={q.y} r={PING_R * shrink} fill={ink} opacity={OP_FG} />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* the person: white, filled, with the small shadow that makes a glyph
              read as a thing standing on the field. Sways, and lifts before he
              acts. */}
          <Img
            src={staticFile(personSrc)}
            style={{
              position: "absolute",
              left: PERSON.x - GLYPH / 2 + swayX,
              top: PERSON_BOX_TOP + swayY - lift / k,
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

export default Distillation;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  distillation: defaultProps.beats.distillation,
  take: defaultProps.beats.take,
  get1: defaultProps.beats.get1,
  data: defaultProps.beats.data,
  fraction: defaultProps.beats.fraction,
  pinging: defaultProps.beats.pinging,
  train: defaultProps.beats.train,
  generation: defaultProps.beats.generation,
  end: defaultProps.beats.end,
};

export const CAM_AT = (f: number) => runCamera(f, CAM.F, CAM.CY, CAM.K);

const INK_TOP = MODEL.y - BLOB_R1;
const INK_BOTTOM = RING.y + RING_R + STROKE / 2;

export const STATS = {
  kStart: Number(CAM.K[0].toFixed(4)),
  kRest: Number(K_REST.toFixed(5)),
  kEnd: Number(K_END.toFixed(5)),
  strokeWorld: Number(STROKE.toFixed(3)),
  strokeScreen: Number((STROKE * K_REST).toFixed(2)),
  glyphWorld: Number(GLYPH.toFixed(2)),
  glyphScreen: Number((GLYPH * K_REST).toFixed(2)),
  dotScreen: Number((2 * DOT_R * K_REST).toFixed(2)),
  coreScreen: Number((2 * CORE_R * K_REST).toFixed(2)),
  ringScreenR: Number((RING_R * K_REST).toFixed(1)),
  blobSeats: BLOB_SEATS.length,
  blobUsed: BLOB_USED.length,
  discSeats: DISC.length,
  fallers: FALLERS.length,
  millHops: BLOB_MILL.reduce((a, h) => a + h.length, 0),
  traffic: TRAFFIC_N,
  wire: {
    len: Number(WIRE_LEN.toFixed(1)),
    frames: WIRE_F1 - WIRE_F0,
    cruiseWorld: Number(((WIRE_LEN / (WIRE_F1 - WIRE_F0)) * (1 + 2 * WIRE_TAIL)).toFixed(2)),
    // the real thing: the fastest the head ever moves across the SCREEN
    headScreenMax: Number(
      (() => {
        let mx = 0;
        for (let f = WIRE_F0 + 1; f <= WIRE_F1; f++) {
          const a =
            WIRE_FOOT.y -
            WIRE_LEN * arriveEase(clamp01((f - 1 - WIRE_F0) / (WIRE_F1 - WIRE_F0)), WIRE_TAIL);
          const b =
            WIRE_FOOT.y -
            WIRE_LEN * arriveEase(clamp01((f - WIRE_F0) / (WIRE_F1 - WIRE_F0)), WIRE_TAIL);
          mx = Math.max(mx, Math.abs(screenAt(f, CX, b)[1] - screenAt(f - 1, CX, a)[1]));
        }
        return mx;
      })().toFixed(2),
    ),
  },
  pings: PINGS.map((p) => [Number(p.born.toFixed(1)), Number(p.arrive.toFixed(1))]),
  pingLen: Number(PING_LEN.toFixed(1)),
  depart: [
    Number(Math.min(...FALLERS.map((p) => p.depart)).toFixed(1)),
    Number(Math.max(...FALLERS.map((p) => p.depart)).toFixed(1)),
  ],
  land: [Number(LAND_SORTED[0].toFixed(1)), Number(LAND_SORTED[LAND_SORTED.length - 1].toFixed(1))],
  ringDeepAt: Number(RING_DEEP_AT.toFixed(1)),
  ringRipeDone: Number((RING_DEEP_AT + RIPE_LAG + RIPE_DUR).toFixed(1)),
  collapse: [
    Number(Math.min(...COLLAPSE.map((c) => c.start)).toFixed(1)),
    Number(Math.max(...COLLAPSE.map((c) => c.merge)).toFixed(1)),
  ],
  coreFullAt: Number(MERGE_SORTED[MERGE_SORTED.length - 1].toFixed(1)),
  fallStretched: FALL_STATS.stretched,
  fallPeakHead: Number(FALL_STATS.peakHead.toFixed(2)),
  band: {
    inkTop: Number(INK_TOP.toFixed(1)),
    inkBottom: Number(INK_BOTTOM.toFixed(1)),
    centre: Number(((INK_TOP + INK_BOTTOM) / 2).toFixed(2)),
    screenTop: Number(screenAt(LAST, CX, INK_TOP)[1].toFixed(1)),
    screenBottom: Number(screenAt(LAST, CX, INK_BOTTOM)[1].toFixed(1)),
    personHeadScreen: Number(screenAt(LAST, PERSON.x, HEAD_TOP_Y)[1].toFixed(1)),
    personFootScreen: Number(screenAt(LAST, PERSON.x, FOOT_Y)[1].toFixed(1)),
  },
};

export const WORLD_INK = {
  model: { ...MODEL, r: CORE_R },
  blob: { r0: BLOB_R0, r1: BLOB_R1 },
  ring: { ...RING, r: RING_R },
  person: { x: PERSON.x, y: PERSON.y, box: GLYPH, head: HEAD_TOP_Y, foot: FOOT_Y },
  wire: { x: CX, y0: WIRE_FOOT.y, y1: WIRE_TOP.y },
};
