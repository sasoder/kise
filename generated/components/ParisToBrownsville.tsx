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
  sway,
  worldTransform,
} from "./fieldShared";
// The baked map: Natural Earth land on a north-up Mercator centred on 45 W.
// Written by `scripts/build-atlantic-map.mjs`; nothing here re-derives it.
import { BROWNSVILLE, LAND_D, PARIS, ROUTE_D, ROUTE_PTS } from "./atlanticMapData";
import { BRONZE_DATA_URL } from "./bronzeData";

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
// the house camera (`camMove` / `camEase` / `sway` / `worldTransform`) and the
// per-icon shadow from `fieldShared`, and nothing else. It is
// not the Dwarkesh grid style and it does not touch it: no dark grid, no
// vignette, no accent, no crowd.
//
// THE MATERIAL IS PAPER. The ground is `public/paper-supaclean-still.png`, real
// squared paper, moving with the camera on exactly the transform
// `GridBackground` uses (parallax 0.15 in BOTH axes now that the camera tracks
// sideways, scale 1 + (k-1)*0.3, the same -0.3 px/frame drift).
// `GridBackground` itself could not be used: its `dim` prop is a `brightness()`
// multiplier baked together with a blur it applies to the whole box, so
// `PaperGround` below is its transform maths carrying this cut's own filter.
// v2 KNOCKS THE PAPER BACK: `brightness(0.88) blur(2.5px)` on the image only,
// so the sheet sits behind the picture instead of competing with it. The rules
// are still legible as squares, the paper still reads as paper, and NOTHING
// else in the frame is touched — the land stays pure #FFFFFF and pops a little
// harder for it, and the pins, route, plane, type and ingots are all unfiltered.
// The blur lives on the `<Img>` inside the oversized box, whose nearest edge is
// 340 px outside the frame at the worst frame of the cut, so the blur's own
// soft edge is never in shot.
// Everything laid on that paper is a paper cut-out: the land is white with no
// stroke, the pins are solid discs, the plane is an ink silhouette, the ingots
// are flat orange trapezoids, and every one of them carries the house
// `iconShadow(k)` so it reads as a piece of paper lying on the sheet.
//
// THE COLOURS are the CORE MEMORY logo chain, raw — no filters, no blend modes —
// and each has exactly one job:
//   purple #BC37FF   the two city pins, and nothing else
//   blue   #0046FF   the route ink, and nothing else
//   (v3: the ingots are the user's bronze.png bars; nothing in the cut is orange any more)
//   ink    #1A1A1A   all type, and the plane
//   white  #FFFFFF   the land
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
//   6. THE BRONZE PILE. Bronze arrives as flat orange
//      paper cut-outs, ONE INGOT AT A TIME, every three
//      frames from f79, and it is STILL ARRIVING when the
//      graphic ends: ingot i lands at f79 + 3i, i = 0..22,
//      so the last one starts on f145 and is one frame
//      into its own drop on the final frame. 23 ingots,
//      stacked bottom-up in a brick bond centred on world
//      x 540 with the base line on y 1170 — rows of 6, 5,
//      6, 5 and then the first of a sixth row, the 5-rows
//      offset by half an ingot and half a gap (53 px).
//      Each one is not rendered before its own frame, then
//      drops 46 px onto the pile over 7 frames on
//      Easing.bezier(0.16, 1, 0.3, 1) with opacity 0 -> 1
//      over the first 3. No bounce, no squash, no scale;
//      the shadow rides down with it
//                                      — "million dollars"      f79-146
//      ("worth of" f97 and "bronze" f108 carry no gesture
//       of their own: the pile is arriving straight
//       through both of them, which is what the words say)
//   7. NOTHING HOLDS AT THE END, and that is the point of
//      this pass. The route, the pins, the labels and the
//      parked plane have all been still since f58, the
//      sway and the paper's drift run under them, and the
//      pile is still growing past the last frame — the one
//      place in this set where "hold to the end" is
//      deliberately broken, on the user's own note
//                                           — the tail          f131-146
//
// Word onsets, frames from the composition's start, round((t - 14.660) * 24):
//   f0 earlier | f7 this month | f21 they flew | f26 from Paris to |
//   f43 Brownsville | f58 Texas with one | f79 million dollars | f97 worth of |
//   f108 bronze | f131 end of "bronze" | f146 last frame
// "worth of" f97 and "bronze" f108 carry no gesture of their own: the pile is
// arriving straight through both of them, which is what the words are
// describing.
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
//   REST, k 0.86 / cx 540 / cy 1000.35 / c 855 — the whole composition, with
//   air all round it. v2 pulled this back from k 1.00 on the user's note that
//   the type wanted more padding; at 0.86 the 1080 x 1920 canvas itself is
//   inset 75 px at the sides and the whole picture breathes.
//     the route's apex (539.9)      -> 564.0
//     the Paris pin (594)           -> 610.5
//     PARIS baseline (680)          -> 684.5
//     the Brownsville pin (823)     -> 807.5
//     BROWNSVILLE, TX baseline (920)-> 890.9
//     the pile's top ingot (956)    -> 921.9   (only from f145)
//     the pile's fourth row (1000)  -> 959.7
//     the pile's base line (1170)   -> 1105.9, clear of the caption band
//     the content centre (855)      -> 835.0
//     BROWNSVILLE, TX left edge, world x 40   -> screen x 110.0
//     the pile, world x 227 .. 853            -> screen x 270.8 .. 809.2
//     the Paris pin, world x 930              -> screen x 875.4
//     in frame: world x -90.9 .. 1177.8, y -120.9 .. 2121.6 — the whole canvas
//     and then some, which is why the land is baked out to [-250,-250] ..
//     [1330,2170]: the visible box clears that clip by 159 px left, 152 right,
//     129 top and 48 bottom at the worst frame of the cut, sway included, so
//     the pull-back never finds a blank edge.
//
// THE CAMERA — ONE move, and it is "they flew". Keys f21 -> f34, warp 0.72,
// k 2.20 -> 0.86, cx 930 -> 540, content centre 594 -> 855. The route is
// diagonal now, so the move tracks sideways as well as out; `runCamera2` is
// `runCamera` with an x track added on the same CAM_STIFF / CAM_DAMP, so all
// three channels lag by the same amount and the framing never shears.
//     f21  k 2.2000 / cx 930.0 / c 594.0   the move breaks here, on the word
//     f34  k 1.1393 / cx 621.3 / c 807.8   the keys end
//     f38  k 0.9362 / cx 562.2 / c 843.4   2.5%/frame and closing
//     f42  k 0.8731 / cx 543.8 / c 852.9   0.64%/frame: settled
//     f46  k 0.8600 / cx 540.0 / c 854.9   0.10%/frame: still, and it holds
//     f50  k 0.8589 / cx 539.7 / c 855.1   the damper's whole overshoot, 0.13%
//                                          of the move — invisible, and back
//                                          on 0.8600 by f60 to the last frame
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
//     (The v1 deviation about the readout's baseline is gone with the readout:
//     v2 replaced it and the tag with the bronze pile, below.)
//
// v2 (user, 2026-09-10) — three changes, and nothing else.
//   1. THE PAPER IS DIMMED AND BLURRED. `brightness(0.88) blur(2.5px)` on the
//      `<Img>` in `PaperGround`, screen px, and on nothing else. 0.88 was kept
//      over the 0.9 fallback: at half res the squares still read as squares and
//      the sheet still reads as paper rather than fog, and the extra two points
//      are what puts the white land clearly in front of it. 2.5 px likewise —
//      the blue rules survive it; they read as ruled paper seen slightly out of
//      focus, which is the point.
//   2. THE REST CAMERA PULLED BACK, k 1.00 -> 0.86. The user asked for padding
//      round the type, and 0.86 is the value that gives it without shrinking the
//      picture into the middle of the frame: BROWNSVILLE, TX, left-anchored on
//      world x 40, now starts at screen x 110 instead of hard on 40, and the
//      canvas's own edges are inset 75 px. The close-up stays k 2.20 and the one
//      move stays f21 -> f34 warp 0.72; re-run, the damper is 0.64%/frame at
//      f42 and still from f46, so the move still lands before "Brownsville".
//      The baked clip window did NOT need enlarging (see the REST table).
//   3. THE READOUT AND THE TAG ARE GONE, replaced by the bronze pile — gesture
//      6 above. With them went the chain entrance, the numeral, the squircle,
//      the `readout`/`tagText` props and the `squirclePath` import; the `tag`
//      prop is now `bronze`, the orange the ingots are cut from. There is no
//      counter, no "$1M", no glow: the money is the pile, and the pile is
//      still arriving when the graphic stops.
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
  paperSrc: z.string(),
  parallax: z.number(),
  // v2: the paper is knocked back so the picture sits in front of it. Screen px.
  paperDim: z.number(),
  paperBlur: z.number(),
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
  parisLabel: z.string(),
  brownsvilleLabel: z.string(),
  beats: z.object({
    earlier: z.number(), // "earlier"          — the Paris pin lands
    thisMonth: z.number(), // "this month"     — nothing; the shot holds
    theyFlew: z.number(), // "they flew"       — the flight, and the one camera move
    fromParisTo: z.number(), // "from Paris to" — PARIS slides up
    brownsville: z.number(), // "Brownsville"  — the pin lands, the label slides up
    texasWithOne: z.number(), // "Texas with one" — touchdown
    millionDollars: z.number(), // "million dollars" — the bronze pile starts
    worthOf: z.number(), // "worth of"        — the pile is still arriving
    bronzeWord: z.number(), // "bronze"       — and still arriving through this
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
const TRACKING = 0.04; // em

// Below the pin, like Brownsville: the route leaves Paris north-west, and a
// label above the pin sat right in the plane's climb path (v2 review).
const PARIS_LABEL_BL = 680; // 66 px under the pin's bottom edge
// BROWNSVILLE, TX is ~560 px wide and its pin is at x 150, so centring it would
// run its left edge off the canvas. The brief's fallback: anchor the left edge
// at x 40 instead.
const BV_LABEL_X = 40;
const BV_LABEL_BL = 920; // clear of the parked plane's tail at ~855

// ---------------------------------------------------------------------------
// THE BRONZE PILE. One ingot, one slot table, one cadence — the money is a
// quantity of paper cut-outs and nothing else in this cut is orange.
//
// THE INGOT is a trapezoid seen side-on, wider at the base than at the top, 96
// across the bottom, 78 across the top, 38 tall, corners taken off at 4 px with
// a quadratic each so nothing on it is a hard point. It is drawn about its own
// bottom centre, so a slot is just where its base sits. Flat #FFB765, no
// stroke, no highlight, no engraving, no gradient — the house `iconShadow(k)`
// is the only thing that lifts it off the paper.
//
// THE PILE is a brick bond: rows of 6, 5, 6, 5, 6 stacked bottom-up on a base
// line of y 1170 (where the v1 tag's bottom edge was), the odd rows centred on
// world x 540 and the even rows inset half an ingot and half a gap — 53 px —
// so every ingot straddles the joint below it. Horizontal gap 10, vertical 6,
// so a 6-row is 626 px wide and the rows sit on a 44 px pitch. 23 ingots fill
// four rows and put one more on top of them: x 227 .. 853, y 956 .. 1170.
// That clears BROWNSVILLE, TX (baseline 920, descenders to ~932) by 24 px and
// the parked plane (x 118 .. 182) by 45 px, so the base line did not need the
// brief's 40 px of slack.
//
// THE CADENCE is one ingot every three frames from f79 — ingot i lands at
// f79 + 3i — so the 23rd starts on f145 and the pile is STILL GROWING on the
// last frame. That is the one deliberate break of the hold-to-the-end rule in
// this set, and it is the whole note this pass was asked for.
// ---------------------------------------------------------------------------
// v3 (user, 2026-09-10): the ingot is the user's own artwork, `public/bronze.png`
// — a 256x256 PNG with alpha of a bronze bar seen in isometric, the bar itself
// occupying x 28..233, y 57..208 of the canvas. It is drawn as an SVG <image>
// at INGOT_IMG world px square, positioned so the bar's alpha bottom sits on
// the slot's base line and its alpha centre on the slot's x. The rows sit on a
// pitch shorter than the bar (the top face of a bar is what the row above
// rests on), and later ingots draw over earlier ones, so a higher row covers
// the top faces of the row beneath it the way a real stack does.
export const INGOT_IMG = 130; // world px, the PNG's square canvas
// The bitmap is inlined (bronzeData.ts): an SVG <image> that fetches a file
// races the frame capture and dropped whole rows on scattered frames (v3).
const INGOT_ALPHA = { x0: 28, x1: 233, y0: 57, y1: 208, size: 256 };
export const INGOT_W = (INGOT_IMG * (INGOT_ALPHA.x1 - INGOT_ALPHA.x0)) / INGOT_ALPHA.size; // 104
export const INGOT_H = (INGOT_IMG * (INGOT_ALPHA.y1 - INGOT_ALPHA.y0)) / INGOT_ALPHA.size; // 77
const INGOT_BOTTOM = (INGOT_IMG * INGOT_ALPHA.y1) / INGOT_ALPHA.size; // alpha bottom, from the image top
const INGOT_CX = (INGOT_IMG * (INGOT_ALPHA.x0 + INGOT_ALPHA.x1)) / 2 / INGOT_ALPHA.size; // alpha centre
export const INGOT_GAP_X = 8;
// The bar's side face is 58/256 of the canvas tall (alpha y 116..177 at its
// left end), so a 30 px row pitch puts each bar exactly on top of the one
// below it — straight columns, no brick offset: isometric bars only stack
// convincingly along their own vertical.
export const ROW_PITCH = 30; // world px between row base lines
export const PILE_X = FRAME_W / 2;
export const PILE_BASE = 1200;
export const PILE_ROWS = [6, 6, 6, 6]; // 23 fills 3 rows + 5, six stacks of four (the last, three)
export const PILE_COUNT = 23;
export const PILE_STEP = 3; // frames between two ingots
export const INGOT_DROP = 46; // world px it falls from
export const INGOT_FRAMES = 7; // frames the drop takes
export const INGOT_FADE = 3; // frames the opacity takes

/** Where each ingot's base sits, in fill order: bottom row first, left to right. */
export const INGOT_SLOTS: { x: number; y: number }[] = [];
for (let r = 0; r < PILE_ROWS.length && INGOT_SLOTS.length < PILE_COUNT; r++) {
  const n = PILE_ROWS[r];
  const rowW = n * INGOT_W + (n - 1) * INGOT_GAP_X;
  const y = PILE_BASE - r * ROW_PITCH;
  for (let j = 0; j < n && INGOT_SLOTS.length < PILE_COUNT; j++) {
    INGOT_SLOTS.push({
      x: PILE_X - rowW / 2 + INGOT_W / 2 + j * (INGOT_W + INGOT_GAP_X),
      y,
    });
  }
}
export const PILE_TOP = Math.min(...INGOT_SLOTS.map((p) => p.y)) - INGOT_H; // 1033

// The content block, and therefore the camera's rest: the route's apex down to
// the pile's base line.
export const CONTENT_TOP = Math.min(...ROUTE_PTS.map((p) => p.y)); // 539.9
export const CONTENT_BOT = PILE_BASE; // 1170
export const CONTENT_C = Math.round((CONTENT_TOP + CONTENT_BOT) / 2); // 855

// ---------------------------------------------------------------------------
// The camera. ONE move, on "they flew": out of the Paris close-up to the whole
// canvas, and then a hold to the last frame. See the head of the file for the
// damped numbers and for why the keys end at f34 rather than the briefed f38.
// ---------------------------------------------------------------------------
export const K_TIGHT = 2.2;
export const K_WIDE = 0.86; // v2: pulled back from 1.0 for padding round the type
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

// -- the pile ---------------------------------------------------------------
export const PILE_F0 = 79; // "million dollars"

const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

export const defaultProps: Props = schema.parse({
  ink: INK,
  land: PAPER_WHITE,
  pin: PURPLE,
  route: BLUE,
  bronze: ORANGE,
  paperSrc: "paper-supaclean-still.png",
  parallax: 0.15,
  paperDim: 0.88,
  paperBlur: 2.5,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  flyingShadowY: 7,
  flyingShadowBlur: 11,
  pinRadius: 20,
  routeWidth: 7,
  planeLength: 64,
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
    bronzeWord: 108,
    end: 131,
  },
});

// ---------------------------------------------------------------------------
// THE GROUND. `GridBackground`'s transform maths exactly — parallax off the
// camera's own rest in both axes, the same slow drift, the same 1 + (k-1)*0.3
// scale, the same 1.8x oversize with objectFit cover — carrying v2's
// `brightness(0.88) blur(2.5px)`, in screen px, on the image and on nothing
// else. The filter is INSIDE the oversized box, so the blur's own soft edge is
// hundreds of pixels outside the frame at every frame of the cut.
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
  dim: number;
  blur: number;
}> = ({ src, frame, cy, cyRest, cx, cxRest, k, parallax, dim, blur }) => {
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
          filter: `brightness(${dim}) blur(${blur}px)`,
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
  paperSrc,
  parallax,
  paperDim,
  paperBlur,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  flyingShadowY,
  flyingShadowBlur,
  pinRadius,
  routeWidth,
  planeLength,
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

  const label = {
    fontFamily,
    fontWeight: 800,
    fontSize: LABEL_SIZE,
    letterSpacing: LABEL_SIZE * TRACKING,
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
        dim={paperDim}
        blur={paperBlur}
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

            {/* THE BRONZE PILE. One ingot every three frames from "million
                dollars" to past the last frame: each one is simply not there
                until its own frame, then drops 46 px onto its slot with its
                shadow riding down with it. Later ingots draw over earlier
                ones, so one that is still falling passes in front of the row
                it is about to land on. */}
            {INGOT_SLOTS.map((slot, i) => {
              const f0 = beats.millionDollars + i * PILE_STEP;
              if (frame < f0) return null;
              const dy = interpolate(frame, [f0, f0 + INGOT_FRAMES], [-INGOT_DROP, 0], {
                easing: EASE_LAND,
                ...clamp,
              });
              const op = interpolate(frame, [f0, f0 + INGOT_FADE], [0, 1], clamp);
              return (
                <g key={`ingot-${i}`} style={{ filter: icon }} opacity={op}>
                  <image
                    href={BRONZE_DATA_URL}
                    width={INGOT_IMG}
                    height={INGOT_IMG}
                    x={(slot.x - INGOT_CX).toFixed(2)}
                    y={(slot.y + dy - INGOT_BOTTOM).toFixed(2)}
                  />
                </g>
              );
            })}
          </>,
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ParisToBrownsville;
