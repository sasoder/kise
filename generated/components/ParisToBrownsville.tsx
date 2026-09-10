import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { z } from "zod";
import {
  BG_OVERSIZE,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  camEase,
  camMove,
  clamp,
  iconShadow,
  smoothstep,
  squirclePath,
  sway,
  worldTransform,
} from "./fieldShared";
// The baked map: Natural Earth land on a north-up Mercator centred on 45 W.
// Written by `scripts/build-atlantic-map.mjs`; nothing here re-derives it.
import { BROWNSVILLE, LAND_D, PARIS, ROUTE_D, ROUTE_PTS } from "./atlanticMapData";

const { fontFamily } = loadFont("normal", {
  weights: ["800", "900"],
  subsets: ["latin"],
});

export const FPS = 24;
// Atelier Missor clip "1- Atelier Missor", SRT cues 24-32: "Earlier this month
// they flew from Paris to Brownsville, Texas with one million dollars worth of
// bronze".
//
// SRT span 00:00:14,660 -> 00:00:20,120 at 24fps.
// round((20.120 - 14.660) * 24) = round(5.460 * 24) = round(131.04) = 131
// frames of speech, plus a 16 frame tail so the resolved state holds = 147.
export const DURATION = 147;

// ---------------------------------------------------------------------------
// "Paris to Brownsville". A ONE-OFF look, built for this clip only: it borrows
// the house camera (`camMove` / `camEase` / `sway` / `worldTransform`), the
// per-icon shadow and the squircle from `fieldShared`, and nothing else. It is
// not the Dwarkesh grid style and it does not touch it: no dark grid, no
// vignette, no accent, no crowd.
//
// THE MATERIAL IS PAPER. The ground is `public/paper-supaclean-still.png`, real
// squared paper, undimmed and unfiltered, moving with the camera on exactly the
// transform `GridBackground` uses (parallax 0.15 in BOTH axes now that the
// camera tracks sideways, scale 1 + (k-1)*0.3, the same -0.3 px/frame drift).
// `GridBackground` itself could not be used: its `dim` prop is a `brightness()`
// multiplier, so the briefed `dim={0}` would render the paper black.
// `PaperGround` below is its transform maths with no filter at all.
// Everything laid on that paper is a paper cut-out: the land is white with no
// stroke, the pins are solid discs, the plane is an ink silhouette, the tag is a
// solid orange squircle, and every one of them carries the house `iconShadow(k)`
// so it reads as a piece of paper lying on the sheet.
//
// THE COLOURS are the CORE MEMORY logo chain, raw — no filters, no blend modes —
// and each has exactly one job:
//   purple #BC37FF   the two city pins, and nothing else
//   blue   #0046FF   the route ink, and nothing else
//   orange #FFB765   the bronze tag, and nothing else
//   ink    #1A1A1A   all type, and the plane
//   white  #FFFFFF   the land
// The readout's entrance is the one place all three colours appear at once, and
// that is the chain entrance from `VastLogoChannelSplit` doing its job.
//
// THE MAP IS NORTH-UP AND FLAT — `geoMercator().rotate([45, 0])`, centre
// meridian 45 W, scale 447.58, fitted so Paris lands on (930, 594) and
// Brownsville on (150, 823), 780 px apart in x. Measured tilt of local north at
// both cities: 0.0 deg. Meridians are vertical lines, so France is France and
// Texas is Texas; Greenland, Newfoundland and Canada run across the top, Iberia
// and North Africa down the right, the Gulf, Florida, the Caribbean and Mexico
// down the left. The great circle bows up through Newfoundland to an apex at
// (689, 540) — 54 px above Paris — and then falls 283 px to Brownsville.
// Land is baked to a tenth of a pixel and clipped to the canvas plus 250 px, so
// no clip edge is ever inside a frame at either end of the camera move.
//
// THE GESTURES — one per word, nothing else.
//   1. THE PARIS PIN LANDS. A purple disc, r 20, scale
//      1.35 -> 1 over 8 frames, its shadow with it. The
//      plane is already parked on it, nose on the route's
//      starting tangent, 64 px long so the purple shows
//      around it. The map is already there
//                                      — "earlier"              f0-8
//      ("this month" f7 has no gesture: the shot is the gesture)
//   2. THE FLIGHT. The plane lifts and travels the route
//      f21 -> f58 on a smoothstep profile — slow off the
//      pin, fastest mid-route, slow onto Brownsville. It
//      does not scale and it does not bounce; the ONLY
//      airborne signal is its shadow, whose offset grows
//      from the parked 2 px / 3 px screen to 7 px / 11 px
//      over the first ten frames and shrinks back over the
//      last ten. The BLUE ROUTE INK draws behind it off
//      the same arclength, so the tip is under the plane
//      on every frame, and the plane's heading is the
//      route's own tangent sampled +-3 points
//                                      — "they flew"            f21-58
//      THE CAMERA moves here and nowhere else (below)
//   3. PARIS. The label slides up into place below the
//      pin (above sat in the plane's climb path): travel 40 px, 14 frames, Easing.bezier(0.16,
//      1, 0.3, 1), opacity 0 -> 1 over the first 6
//                                      — "from Paris to"        f26-40
//   4. THE BROWNSVILLE PIN LANDS, exactly as Paris did
//      (1.35 -> 1 over 8 frames), and BROWNSVILLE, TX
//      slides up below it the way PARIS slid up below.
//      The plane is still in the air; that is correct
//                                      — "Brownsville"          f43-57
//   5. TOUCHDOWN. The plane reaches the pin, its shadow is
//      back to parked, the route ink is complete and its
//      tip meets the disc. From here the plane sits still
//                                      — "Texas with one"       f58
//   6. THE READOUT. $1,000,000 enters on the CORE MEMORY
//      chain: a hard ink shadow copy at the back, then
//      orange, purple and blue each sliding up 130 px,
//      staggered 2 frames, then the ink core last. Travel
//      22 frames, Easing.bezier(0.16, 1, 0.3, 1). Nothing
//      fades — a layer is simply not rendered before its
//      own start frame — and they all land on the same
//      spot, so what is left is the ink numeral and its
//      shadow. Orange starts f79, core starts f85 and
//      lands f107
//                                      — "million dollars"      f79-107
//   7. THE TAG. An orange squircle carrying OF BRONZE in
//      ink slides up 60 px below the readout over 14
//      frames on the same easing, opacity 0 -> 1 over the
//      first 6                         — "bronze"               f108-122
//   8. HELD to f146: white land on squared paper, the
//      purple Paris pin under PARIS, the blue route
//      arcing down to the plane parked on the purple
//      Brownsville pin, BROWNSVILLE, TX, $1,000,000, the
//      orange OF BRONZE tag. Nothing moves but the sway
//      and the paper's own drift            — tail             f131-146
//
// Word onsets, frames from the composition's start, round((t - 14.660) * 24):
//   f0 earlier | f7 this month | f21 they flew | f26 from Paris to |
//   f43 Brownsville | f58 Texas with one | f79 million dollars | f97 worth of |
//   f108 bronze | f131 end of "bronze" | f146 last frame
// "worth of" f97 carries no gesture of its own: the readout is still landing
// through it, which is what the words are describing.
//
// THE TWO FRAMINGS. For a content centre c, `cy = c + CAM_LIFT / k` puts c at
// screen y 960 - 125 = 835, under the captions; `cx` does the same sideways
// with no lift, so a world x of cx lands on screen 540.
//   screen(y) = (y - cy) * k + 960      screen(x) = (x - cx) * k + 540
//
//   OPEN, k 2.20 / cx 930 / c 594 — a close-up on the Paris pin.
//     the Paris pin (930, 594)     -> (540, 835), 88 px across
//     the plane, 64 world px       -> 141 px long, parked on it
//     in frame: world x 684.5 .. 1175.5, y 214.5 .. 1087.1 — Western Europe
//     from Iceland down to the Sahara, with the eastern Atlantic to its left
//
//   REST, k 1.00 / cx 540 / c 852 — the whole column. World px are screen px.
//     the route's apex (539.9)     -> 523
//     the Paris pin (594)          -> 577
//     PARIS baseline (680)         -> 663
//     the Brownsville pin (823)    -> 806
//     BROWNSVILLE, TX baseline     -> 903
//     $1,000,000 baseline (1050)   -> 1033
//     the tag (1080 .. 1164)       -> 1085 .. 1169, clear of the caption band
//     the content centre (830)     -> 835
//     in frame: the whole 1080 x 1920 canvas
//
// THE CAMERA — ONE move, and it is "they flew". Keys f21 -> f34, warp 0.72,
// k 2.20 -> 1.00, cx 930 -> 540, content centre 594 -> 830. The route is
// diagonal now, so the move tracks sideways as well as out; `runCamera2` is
// `runCamera` with an x track added on the same CAM_STIFF / CAM_DAMP, so all
// three channels lag by the same amount and the framing never shears.
//     f21  k 2.2000 / cx 930.0 / c 594.0   the move breaks here, on the word
//     f38  k 1.0683 / cx 568.0 / c 815.7   1.6%/frame and closing
//     f42  k 1.0117 / cx 544.7 / c 827.4   under 1%/frame: settled
//     f46  k 1.0000 / cx 540.1 / c 829.6   dead still, and it holds to f146
//   The briefed keys were f21 -> f38, which leaves the damper 2.8% out and
//   still moving on "Brownsville" f43 — the one thing the brief asked the move
//   NOT to do. Ending the keys four frames earlier is what actually settles it
//   before the word. One deceleration lobe, one settle lobe, nothing else.
//
// DEVIATIONS from the second-pass brief, and why.
//   * THE PROJECTION IS MERCATOR, NOT CONIC CONFORMAL. A conic fans its
//     meridians, so north is only up on the centre meridian: measured on
//     `geoConicConformal().parallels([30, 55]).rotate([45, 0])`, Europe leans
//     32.3 deg and Texas 35.8 deg the other way — the very fault this pass
//     exists to fix. Killing the fan means n -> 0, which IS a cylindrical
//     projection. Mercator is the conformal one, so coastlines keep their
//     shape. Tilt at both cities: 0.0 deg.
//   * BROWNSVILLE IS AT (150, 823), NOT (150, 1160). No north-up projection can
//     put it at 1160: the two cities are 99.85 deg of longitude apart and only
//     22.95 deg of latitude apart, so once 99.85 deg of longitude is fitted
//     across 780 px, the latitude difference is what it is — 229 px on
//     Mercator, which stretches high latitudes and is therefore already the
//     STEEPEST north-up option (equirectangular gives 179, conic 30/55 gives
//     174). (150, 1160) needs 520 px, a 2.3x vertical stretch that would make
//     squares of the sea and sausages of the coastlines. What the brief was
//     really after is in the picture: Paris top right, Brownsville bottom left,
//     the arc bowing up through Newfoundland, apex on y 540 to the pixel.
//   * THE CLOSE-UP SHOWS EUROPE, NOT FRANCE. Fitting 99.85 deg of longitude
//     across 780 px is 7.8 px per degree, so France is 95 world px tall; at
//     k 2.2 that is 209 screen px in a 1920 px frame. The close-up reads as
//     Western Europe with a pin on Paris. Showing the Channel and the Alps as
//     the subject would need k ~ 8, which is not this cut's camera.
//   * THE READOUT'S BASELINE IS 1050, NOT ~1000. The stack below the
//     Brownsville pin (label, numeral, tag) has to clear the parked plane and
//     the label, and 1050 is where it lands; it puts the content centre on 830,
//     which is the 835 the framing wants. At 1050 the numeral sits in the
//     equatorial Atlantic with Central America under its left end — land is
//     white and the type is ink, so contrast is if anything better there than
//     on the paper, and no coastline crosses a counter.
//
// THE ONE MOVING HEAD, against the 45 screen px/frame cap: see the printed
// measurement in the report — the takeoff easing keeps the plane under it while
// the camera is still tight, because the tightest frames are also the slowest.
// ---------------------------------------------------------------------------

const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const INK = "#1A1A1A";
const PAPER_WHITE = "#FFFFFF";
// The paper's own field, behind the image, so a frame can never show through.
const PAPER_BASE = "#E9E9E9";

export const schema = z.object({
  ink: z.string(),
  land: z.string(),
  pin: z.string(), // purple: the two cities
  route: z.string(), // blue: the flown line
  tag: z.string(), // orange: the bronze
  paperSrc: z.string(),
  parallax: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  // the airborne shadow the plane swaps to while it is off the ground
  flyingShadowY: z.number(),
  flyingShadowBlur: z.number(),
  pinRadius: z.number(),
  routeWidth: z.number(),
  planeLength: z.number(),
  readout: z.string(),
  tagText: z.string(),
  parisLabel: z.string(),
  brownsvilleLabel: z.string(),
  beats: z.object({
    earlier: z.number(), // "earlier"          — the Paris pin lands
    thisMonth: z.number(), // "this month"     — nothing; the shot holds
    theyFlew: z.number(), // "they flew"       — the flight, and the one camera move
    fromParisTo: z.number(), // "from Paris to" — PARIS slides up
    brownsville: z.number(), // "Brownsville"  — the pin lands, the label slides up
    texasWithOne: z.number(), // "Texas with one" — touchdown
    millionDollars: z.number(), // "million dollars" — the chain entrance
    worthOf: z.number(), // "worth of"        — the readout is still landing
    bronze: z.number(), // "bronze"           — the orange tag
    end: z.number(), // speech ends; tail to 147
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE ROUTE, as one polyline. The drawn ink, the plane's position and the
// plane's heading are all read off THIS table, so the tip cannot drift out from
// under the plane: the ink is dashed to the same arclength the plane sits at.
// ---------------------------------------------------------------------------
const CUM: number[] = [0];
for (let i = 1; i < ROUTE_PTS.length; i++) {
  CUM.push(
    CUM[i - 1] + Math.hypot(ROUTE_PTS[i].x - ROUTE_PTS[i - 1].x, ROUTE_PTS[i].y - ROUTE_PTS[i - 1].y),
  );
}
export const ROUTE_TOTAL = CUM[CUM.length - 1];

export const routeAt = (s: number) => {
  const t = Math.max(0, Math.min(ROUTE_TOTAL, s));
  let lo = 0;
  let hi = CUM.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (CUM[mid] <= t) lo = mid;
    else hi = mid;
  }
  const span = CUM[hi] - CUM[lo] || 1;
  const u = (t - CUM[lo]) / span;
  return {
    x: ROUTE_PTS[lo].x + (ROUTE_PTS[hi].x - ROUTE_PTS[lo].x) * u,
    y: ROUTE_PTS[lo].y + (ROUTE_PTS[hi].y - ROUTE_PTS[lo].y) * u,
  };
};

// The heading, damped by sampling the path three samples either side of the
// plane rather than differencing two neighbouring points: at 5.5 px a sample
// that is a 33 px chord, which is long enough that the rounded coordinates in
// the baked table cannot make the nose twitch.
const TANGENT_SPAN = 3 * (ROUTE_TOTAL / (ROUTE_PTS.length - 1));
export const headingAt = (s: number) => {
  const a = routeAt(s - TANGENT_SPAN);
  const b = routeAt(s + TANGENT_SPAN);
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
};

// ---------------------------------------------------------------------------
// THE PLANE. A top-down airliner drawn as one closed silhouette about its own
// centre, nose at -y: 64 world px from nose to tail, 56 across the wings. No
// stroke — it is a piece of ink laid on the map, and its only moving part in
// the whole cut is the shadow underneath it.
//
// ONE pair of wings, swept 36 deg back off the middle of the fuselage, and ONE
// small swept tailplane at the rear. No canards, no second pair, no fin. The
// fuselage is 6.4 px across, so the r 20 purple disc it parks on shows all the
// way round it.
// ---------------------------------------------------------------------------
export const PLANE_PATH = [
  "M 0 -32",
  "C 1.9 -31.2 3.0 -26.5 3.2 -19",
  "L 3.2 -6 L 28 12 L 28 15.5 L 4.4 8.5",
  "L 4.0 19 L 11 26 L 11 28.5 L 2.6 25",
  "L 2.2 32 L -2.2 32",
  "L -2.6 25 L -11 28.5 L -11 26 L -4.0 19",
  "L -4.4 8.5 L -28 15.5 L -28 12 L -3.2 -6",
  "L -3.2 -19",
  "C -3.0 -26.5 -1.9 -31.2 0 -32",
  "Z",
].join(" ");
export const PLANE_AUTHORED = 64; // the length the path above is drawn at

// ---------------------------------------------------------------------------
// The type. Barlow, uppercase, one tracking value. The labels are 54, the
// readout 120, and every baseline below is world px on the 1080 x 1920 canvas.
// ---------------------------------------------------------------------------
const LABEL_SIZE = 54;
const READOUT_SIZE = 120;
const TRACKING = 0.04; // em
const CAP = 0.72; // Barlow's cap height, as a fraction of the size

// Below the pin, like Brownsville: the route leaves Paris north-west, and a
// label above the pin sat right in the plane's climb path (v2 review).
const PARIS_LABEL_BL = 680; // 66 px under the pin's bottom edge
// BROWNSVILLE, TX is ~560 px wide and its pin is at x 150, so centring it would
// run its left edge off the canvas. The brief's fallback: anchor the left edge
// at x 40 instead.
const BV_LABEL_X = 40;
const BV_LABEL_BL = 920; // clear of the parked plane's tail at ~855
const READOUT_BL = 1050;
const TAG_W = 380;
const TAG_H = 84;
const TAG_TOP = 1080;
const TAG_PATH = squirclePath(TAG_W, TAG_H);
const TAG_TEXT_BL = TAG_TOP + TAG_H / 2 + (LABEL_SIZE * CAP) / 2;

// The content block, and therefore the camera's rest: the route's apex down to
// the tag's bottom edge.
export const CONTENT_TOP = Math.min(...ROUTE_PTS.map((p) => p.y)); // 539.9
export const CONTENT_BOT = TAG_TOP + TAG_H; // 1164
export const CONTENT_C = Math.round((CONTENT_TOP + CONTENT_BOT) / 2); // 852

// ---------------------------------------------------------------------------
// The camera. ONE move, on "they flew": out of the Paris close-up to the whole
// canvas, and then a hold to the last frame. See the head of the file for the
// damped numbers and for why the keys end at f34 rather than the briefed f38.
// ---------------------------------------------------------------------------
export const K_TIGHT = 2.2;
export const K_WIDE = 1.0;
export const C_TIGHT = PARIS.y; // the Paris pin is the content centre in close-up
export const C_WIDE = CONTENT_C;
export const X_TIGHT = PARIS.x; // and its own column, so the pin is centred
export const X_WIDE = FRAME_W / 2;
export const CAM_F0 = 21; // "they flew"
export const CAM_F1 = 34;
export const CAM_WARP = 0.72;

const MOVE = camMove({
  f0: CAM_F0,
  f1: CAM_F1,
  k0: K_TIGHT,
  k1: K_WIDE,
  c0: C_TIGHT,
  c1: C_WIDE,
  warp: CAM_WARP,
});
// The lateral track, on the SAME eased curve `camMove` uses for k and cy, so
// the three channels are one move rather than three.
const MOVE_CX = MOVE.F.map((_, i) =>
  camEase(i / (CAM_F1 - CAM_F0), CAM_WARP) * (X_WIDE - X_TIGHT) + X_TIGHT,
);
export const PB_CAM_F = [0, ...MOVE.F, DURATION];
export const PB_CAM_K = [K_TIGHT, ...MOVE.K, K_WIDE];
export const PB_CAM_CY = [C_TIGHT + CAM_LIFT / K_TIGHT, ...MOVE.CY, C_WIDE + CAM_LIFT / K_WIDE];
export const PB_CAM_CX = [X_TIGHT, ...MOVE_CX, X_WIDE];

// `runCamera` damps CY and K only. This cut pans, so this is that same damper
// with an X channel on the same CAM_STIFF / CAM_DAMP — line for line the house
// tracker, plus `cx`. `fieldShared` is not touched.
export const runCamera2 = (upto: number, F: number[], CY: number[], CX: number[], K: number[]) => {
  let cy = CY[0];
  let cx = CX[0];
  let k = K[0];
  let vy = 0;
  let vx = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, F, CY, clamp);
    const tx = interpolate(f, F, CX, clamp);
    const tk = interpolate(f, F, K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, cx, k };
};

// -- the flight -------------------------------------------------------------
export const FLY_F0 = 21; // "they flew"
export const FLY_F1 = 58; // "Texas": the wheels are down
export const AIRBORNE_IN = 10; // frames the shadow takes to grow
export const AIRBORNE_OUT = 10; // frames it takes to come back
export const PIN_LAND = 8; // frames a pin takes to settle from 1.35
export const PIN_POP = 1.35;

// -- the labels -------------------------------------------------------------
export const PARIS_F0 = 26; // "from Paris to"
export const BV_F0 = 43; // "Brownsville"
export const LABEL_TRAVEL = 40;
export const LABEL_FRAMES = 14;
export const LABEL_FADE = 6;

// -- the readout, on the CORE MEMORY chain ----------------------------------
export const READ_F0 = 79; // "million dollars"
export const CHAIN_RISE = 130;
export const CHAIN_TRAVEL = 22;
export const CHAIN_STAGGER = 2;
export const CHAIN_COLORS = [ORANGE, PURPLE, BLUE];
export const CHAIN_CORE_DELAY = CHAIN_COLORS.length * CHAIN_STAGGER; // 6
export const CHAIN_SHADOW = 6; // the hard ink shadow copy's offset, world px
export const CHAIN_SHADOW_OP = 0.22;

// -- the tag ----------------------------------------------------------------
export const TAG_F0 = 108; // "bronze"
export const TAG_TRAVEL = 60;
export const TAG_FRAMES = 14;

const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

export const defaultProps: Props = schema.parse({
  ink: INK,
  land: PAPER_WHITE,
  pin: PURPLE,
  route: BLUE,
  tag: ORANGE,
  paperSrc: "paper-supaclean-still.png",
  parallax: 0.15,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  flyingShadowY: 7,
  flyingShadowBlur: 11,
  pinRadius: 20,
  routeWidth: 7,
  planeLength: 64,
  readout: "$1,000,000",
  tagText: "OF BRONZE",
  parisLabel: "PARIS",
  brownsvilleLabel: "BROWNSVILLE, TX",
  beats: {
    earlier: 0,
    thisMonth: 7,
    theyFlew: 21,
    fromParisTo: 26,
    brownsville: 43,
    texasWithOne: 58,
    millionDollars: 79,
    worthOf: 97,
    bronze: 108,
    end: 131,
  },
});

// ---------------------------------------------------------------------------
// THE GROUND. `GridBackground`'s transform maths exactly — parallax off the
// camera's own rest in both axes, the same slow drift, the same 1 + (k-1)*0.3
// scale, the same 1.8x oversize with objectFit cover — and no filter of any
// kind, because this paper is the picture rather than a backdrop to dim.
//
// THE IMAGE IS TURNED 90 deg. It is 3864 x 2164 landscape and the box is
// 1944 x 3456 portrait, so covering it unrotated meant scaling the source UP by
// 1.597 and the ruled squares came out 273 px across — four to a frame, more
// blackboard than notebook. Rotated (squares are square, so the turn is
// invisible) the same cover is 0.898 of the source: the 171 px squares of the
// original photograph land at 154 px, seven across the frame at k 1, which is
// the notebook the brief asked for. The element is laid out at the box's
// dimensions SWAPPED, 3456 x 1944, so `objectFit: cover` solves against the
// landscape source, and `rotate(90deg)` — innermost in the transform, about the
// element's own centre — turns the covered box up on end.
//
// The rotated element is 1944 x 3456 against a 1080 x 1920 frame, so there are
// 432 px of slack at the sides and 768 top and bottom before an edge could show;
// the largest offset this cut asks for is 59 px sideways and 90 px vertically,
// both at k 1.0 where the slack is smallest.
// ---------------------------------------------------------------------------
const PaperGround: React.FC<{
  src: string;
  frame: number;
  cy: number;
  cyRest: number;
  cx: number;
  cxRest: number;
  k: number;
  parallax: number;
}> = ({ src, frame, cy, cyRest, cx, cxRest, k, parallax }) => {
  const bgY = -(cy - cyRest) * k * parallax - frame * 0.3;
  const bgX = -(cx - cxRest) * k * parallax;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE,
          height: FRAME_W * BG_OVERSIZE,
          objectFit: "cover",
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const ParisToBrownsville: React.FC<Props> = ({
  ink,
  land,
  pin,
  route,
  tag,
  paperSrc,
  parallax,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  flyingShadowY,
  flyingShadowBlur,
  pinRadius,
  routeWidth,
  planeLength,
  readout,
  tagText,
  parisLabel,
  brownsvilleLabel,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the camera, first -----------------------------------------------------
  const cam = runCamera2(frame, PB_CAM_F, PB_CAM_CY, PB_CAM_CX, PB_CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the flight ------------------------------------------------------------
  // One eased arclength drives the plane, its heading and the ink behind it.
  const flown = smoothstep((frame - beats.theyFlew) / (FLY_F1 - FLY_F0)) * ROUTE_TOTAL;
  const plane = routeAt(flown);
  const heading = headingAt(flown);
  // The airborne signal, and the only one: the shadow drops further away as it
  // climbs and comes back in as it lands. Nothing scales, nothing bounces.
  const airborne =
    smoothstep((frame - FLY_F0) / AIRBORNE_IN) *
    (1 - smoothstep((frame - (FLY_F1 - AIRBORNE_OUT)) / AIRBORNE_OUT));
  const planeShadow = iconShadow(
    k,
    iconShadowY + (flyingShadowY - iconShadowY) * airborne,
    iconShadowBlur + (flyingShadowBlur - iconShadowBlur) * airborne,
    iconShadowOpacity,
  );
  const planeScale = planeLength / PLANE_AUTHORED;

  // -- the two pins ----------------------------------------------------------
  const pinR = (f0: number) =>
    pinRadius * (1 + (PIN_POP - 1) * (1 - smoothstep((frame - f0) / PIN_LAND)));
  const parisR = pinR(beats.earlier);
  const bvR = frame < beats.brownsville ? 0 : pinR(beats.brownsville);

  // -- a label that slides up into place -------------------------------------
  const slide = (f0: number, travel: number, frames: number) => ({
    dy: interpolate(frame, [f0, f0 + frames], [travel, 0], { easing: EASE_LAND, ...clamp }),
    op: interpolate(frame, [f0, f0 + LABEL_FADE], [0, 1], clamp),
  });
  const paris = slide(beats.fromParisTo, LABEL_TRAVEL, LABEL_FRAMES);
  const bville = slide(beats.brownsville, LABEL_TRAVEL, LABEL_FRAMES);
  const bronze = slide(beats.bronze, TAG_TRAVEL, TAG_FRAMES);

  // -- the readout's chain entrance ------------------------------------------
  // `VastLogoChannelSplit`'s mechanism, with `<text>` in place of a masked PNG:
  // every layer does the same slide, later than the one before it, and nothing
  // fades — a layer simply is not rendered until its own frame.
  const chainOffset = (delay: number) =>
    (1 -
      interpolate(
        frame,
        [beats.millionDollars + delay, beats.millionDollars + delay + CHAIN_TRAVEL],
        [0, 1],
        {
          easing: EASE_LAND,
          ...clamp,
        },
      )) *
    CHAIN_RISE;
  const chainStarted = (delay: number) => frame >= beats.millionDollars + delay;
  const coreOffset = chainOffset(CHAIN_CORE_DELAY);

  const label = {
    fontFamily,
    fontWeight: 800,
    fontSize: LABEL_SIZE,
    letterSpacing: LABEL_SIZE * TRACKING,
  } as const;
  const numeral = {
    fontFamily,
    fontWeight: 900,
    fontSize: READOUT_SIZE,
    letterSpacing: READOUT_SIZE * TRACKING,
  } as const;

  const world = (children: React.ReactNode) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: FRAME_W,
        height: FRAME_H,
        transformOrigin: "0 0",
        transform: `translate(${tx}px, ${ty}px) scale(${k})`,
      }}
    >
      <svg
        width={FRAME_W}
        height={FRAME_H}
        viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        {children}
      </svg>
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround
        src={paperSrc}
        frame={frame}
        cy={cy}
        cyRest={PB_CAM_CY[0]}
        cx={cx}
        cxRest={PB_CAM_CX[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill>
        {world(
          <>
            {/* THE LAND. One path, white, no stroke, filled evenodd so the
                projection's own holes stay holes, with the house per-icon
                shadow: paper cut-outs laid on the squared sheet. */}
            <g style={{ filter: icon }}>
              <path d={LAND_D} fill={land} fillRule="evenodd" />
            </g>

            {/* THE ROUTE. One stroke weight, dashed on to exactly the
                arclength the plane sits at, so its tip is under the plane on
                every frame of the flight and meets the disc at the end. */}
            {flown > 0.5 ? (
              <g style={{ filter: icon }}>
                <path
                  d={ROUTE_D}
                  pathLength={ROUTE_TOTAL}
                  fill="none"
                  stroke={route}
                  strokeWidth={routeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={
                    flown < ROUTE_TOTAL - 0.5
                      ? `${flown.toFixed(3)} ${(ROUTE_TOTAL + 1).toFixed(3)}`
                      : undefined
                  }
                />
              </g>
            ) : null}

            {/* THE TWO CITIES. Solid discs, no stroke, landing from 1.35. */}
            <g style={{ filter: icon }}>
              <circle cx={PARIS.x} cy={PARIS.y} r={parisR} fill={pin} />
            </g>
            {bvR > 0 ? (
              <g style={{ filter: icon }}>
                <circle cx={BROWNSVILLE.x} cy={BROWNSVILLE.y} r={bvR} fill={pin} />
              </g>
            ) : null}

            {/* THE PLANE. Ink, on the route's own tangent, carrying the one
                shadow in this cut that ever changes. */}
            <g style={{ filter: planeShadow }}>
              <path
                d={PLANE_PATH}
                fill={ink}
                transform={`translate(${plane.x.toFixed(2)} ${plane.y.toFixed(2)}) rotate(${heading.toFixed(2)}) scale(${planeScale})`}
              />
            </g>

            {/* PARIS, below its pin. */}
            {paris.op > 0 ? (
              <g style={{ filter: icon }} opacity={paris.op}>
                <text
                  x={PARIS.x}
                  y={PARIS_LABEL_BL + paris.dy}
                  textAnchor="middle"
                  fill={ink}
                  style={label}
                >
                  {parisLabel}
                </text>
              </g>
            ) : null}

            {/* BROWNSVILLE, TX, below its pin, left edge anchored on x 40. */}
            {bville.op > 0 ? (
              <g style={{ filter: icon }} opacity={bville.op}>
                <text
                  x={BV_LABEL_X}
                  y={BV_LABEL_BL + bville.dy}
                  textAnchor="start"
                  fill={ink}
                  style={label}
                >
                  {brownsvilleLabel}
                </text>
              </g>
            ) : null}

            {/* THE READOUT, on the chain. Back to front: the hard ink shadow
                copy riding with the core, then orange, purple, blue, then the
                ink core last on top of all of them. */}
            {chainStarted(CHAIN_CORE_DELAY) ? (
              <text
                x={FRAME_W / 2 + CHAIN_SHADOW}
                y={READOUT_BL + coreOffset + CHAIN_SHADOW}
                textAnchor="middle"
                fill={ink}
                opacity={CHAIN_SHADOW_OP}
                style={numeral}
              >
                {readout}
              </text>
            ) : null}
            {CHAIN_COLORS.map((color, i) =>
              chainStarted(i * CHAIN_STAGGER) ? (
                <text
                  key={color}
                  x={FRAME_W / 2}
                  y={READOUT_BL + chainOffset(i * CHAIN_STAGGER)}
                  textAnchor="middle"
                  fill={color}
                  style={numeral}
                >
                  {readout}
                </text>
              ) : null,
            )}
            {chainStarted(CHAIN_CORE_DELAY) ? (
              <text
                x={FRAME_W / 2}
                y={READOUT_BL + coreOffset}
                textAnchor="middle"
                fill={ink}
                style={numeral}
              >
                {readout}
              </text>
            ) : null}

            {/* THE TAG. An orange squircle with OF BRONZE in ink. */}
            {bronze.op > 0 ? (
              <g style={{ filter: icon }} opacity={bronze.op}>
                <path
                  d={TAG_PATH}
                  fill={tag}
                  transform={`translate(${FRAME_W / 2 - TAG_W / 2} ${TAG_TOP + bronze.dy})`}
                />
                <text
                  x={FRAME_W / 2}
                  y={TAG_TEXT_BL + bronze.dy}
                  textAnchor="middle"
                  fill={ink}
                  style={label}
                >
                  {tagText}
                </text>
              </g>
            ) : null}
          </>,
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ParisToBrownsville;
