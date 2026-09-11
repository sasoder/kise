import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
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
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  AXIS,
  BLOB_B,
  CLAUDE,
  COL_PITCH,
  COL_ROWS,
  FLIGHT_EXTRA,
  Glyph,
  K_REST,
  MARK_SIZE,
  MODELS,
  type Seat,
  flightEase,
  makeSeats,
  readoutStyle,
} from "./claudeDistilledShared";

export const FPS = 24;
// John / Charles / Beren, clip `JohnCharlesBeren_Claude_Distilled`, cut 3:
// "So I think that kind of diversity has definitely been cut down by RL a lot."
//
// Timed off a WORD-LEVEL pass on the audio, not off the SRT cue. The cue for
// "been cut" ran 28.100 -> 29.820 and the piece was built as if both words fell
// on 28.100; the speaker in fact draws "cut" right out and holds it:
//
//   in-point 25.900, frames = round((t - 25.900) * 24)
//     so 25.900 f0 · I 26.150 f6 · think 26.230 f8 · that 26.400 f12 ·
//     kind 26.740 f20 · of 26.900 f24 · diversity 26.980 f26 · has 27.400 f36 ·
//     definitely 27.760 f45 · been 28.100 f53 · CUT 28.720 f68 (held to 29.820)
//     · down 29.820 f94 · by 30.040 f99 · RL 30.220 f104 · a 30.600 f113 ·
//     lot 30.860 f119, ending 30.900 f120 · the next sentence starts f124.
//
// So the line draws ON "cut" (f68) rather than a second early on "been", and
// the sink runs from "cut" to one frame before "lot".
//   DURATION = 120 + 48 = 168 — speech to the end of "lot", plus a 48 frame
//   tail on the resolved state so the editor can trim to the next sentence
//   (f124) or let it breathe.
export const DURATION = 168;

// ---------------------------------------------------------------------------
// "Claudeified". Cut 1's world, later in the same clip: the same three open
// weight marks, the same 64-dot blob of mixed-tone outputs under each one, the
// same narrow three-wide column they comb into — all of it out of
// `claudeDistilledShared.tsx`, which cuts 1 and 2 are built from too. What is
// new is WHERE the change comes from. RL is not a label here, it is a line: one
// white rule across the field, fixed in the world, named `RL` at its left end.
// The three models descend through it in ONE continuous motion, and everything
// that crosses it is changed BY it —
//   * an output dot that crosses combs into its column seat and ramps
//     ripe -> deep;
//   * a mark that crosses is the Claude mark below the line and its own glyph
//     above it. Both are drawn at the same centre and the same em, clipped at
//     the line's own y, so the whale / the globe / the wave shrinks away from
//     the bottom while the Claude asterisk grows from the bottom. No occluder,
//     no morph, no flash: a wipe at a line.
// The camera tilts down with the descent, so the line reads as sweeping UP
// through them — "cut down".
//
// Every gesture is one word. Nothing else happens.
//   the three marks at rest, no outputs yet          — "so I think"       f0
//   the three output blobs spray out from under
//     their marks, cut 1's arrival: dots leave the
//     mark's bottom edge on individual shallow arcs,
//     top-of-blob seats first, arrivals f17 -> f37,
//     each already in its own tone; then they sit
//     and breathe                                    — "that kind of
//                                                       diversity"        f12-38
//   the RL line draws head-led across the frame,
//     left to right, one ease, 8 frames, landing on
//     the frame the descent starts                   — "cut"              f66-74
//   THE ONE BIG MOTION: the whole group — three
//     marks and their 3 x 64 dots — descends dy
//     0 -> 560 on one smoothstep over 44 frames. Its
//     consequences are not separate gestures: a dot
//     combs to its column seat on a 14-frame
//     smoothstep from the frame ITS OWN world y
//     crosses 1040.5, so the blob's base meets the
//     line at f92.9 and the combing starts on "down"
//     (f94) and sweeps up the blob to f102; the
//     marks' centres cross at f107.5 and are through
//     at f112.0, so they turn into Claude across
//     "RL ... a" — all three together, one flip, not
//     three; the last dot seats f116.2 and the fall
//     lands f118, one frame before "lot"             — "cut ... down"     f74-118
//   the readout `RL` rises 10px and fades in at the
//     line's left end                                — "by" -> "RL"       f98-106
//   the ONE camera move: a tilt, no zoom. Content
//     centre 664 -> 1160 at k 1.35 (`K_REST`), warp
//     0.72, keyed f74-110 so the damper is under
//     1 world px a frame from f116 and 0.4 at f118   — "cut ... down"     f74-118
//   hold resolved, never fades                       — "a lot" / tail     f118-168
//
// ambient: `sway` on the camera and `breath` on every seated dot. Nothing else
// moves. No threads, no packets, no rings, no flashes — cut 1 owns the siphon;
// this cut owns the line.
//
// --- v3 pass ---------------------------------------------------------------
// ONE change, and cut 1 takes exactly the same one: the blob spray's flights
// are no longer front-loaded. The curve a dot flies on was an ease-out cubic,
// which over the shortest flights spends most of the distance on the first
// frame; the spray peaked at 70.9 screen px/frame at this cut's k 1.35 with the
// dot fully opaque, and 151 of 192 dots were over the house's 45 px/frame.
//
// The flight is now `flightEase` — a smoothstep, shared with cut 1 in
// `claudeDistilledShared.tsx` — plus `FLIGHT_EXTRA`, the same two frames added
// to every flight. Measured on the drawn frames:
//   peak while >= 50% opaque   70.9 -> 39.4 screen px/frame
//   dots over 45 px/frame      151 of 192 -> 0 of 192
// The smoothstep alone took it to 55.9, still over the cap, which is what the
// two frames are for.
//
// Every `t0` is untouched, so the histogram of START frames is exactly what it
// was; only the landings move, all by the same two frames (arrivals f15 -> f35
// become f17 -> f37, still inside "that kind of diversity" and eight frames
// clear of "definitely" at f45). The arc, the seat field, the arrival rank, the
// tone mix, the line, the descent, the comb and the camera are untouched. The
// arrival fade is a fifth of a dot's own flight, as it always was, so it grows
// with it — 0.6-2.4 frames becomes 1.0-2.8.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: half the blob
  accentDeep: z.string(), // deep: the other half, and every dot after the line
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
  readout: z.string(),
  // the words, in frames, from the word-level pass. `cut` and `by` are the two
  // the piece actually keys off; the rest are the ruler they were read against.
  beats: z.object({
    so: z.number(), // "so"
    that: z.number(), // "that kind of"
    diversity: z.number(), // "diversity"
    has: z.number(), // "has"
    definitely: z.number(), // "definitely"
    been: z.number(), // "been"
    cut: z.number(), // "cut", held to f94
    down: z.number(), // "down"
    by: z.number(), // "by"
    rl: z.number(), // "RL"
    a: z.number(), // "a"
    lot: z.number(), // "lot"
    end: z.number(), // speech ends; tail to 168
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
  readout: "RL",
  beats: {
    so: 0,
    that: 12,
    diversity: 26,
    has: 36,
    definitely: 45,
    been: 53,
    cut: 68,
    down: 94,
    by: 99,
    rl: 104,
    a: 113,
    lot: 119,
    end: 120,
  },
});

const WORLD_W = 1080;
const WORLD_H = 2200;

// ---------------------------------------------------------------------------
// Layout, in world px. The clip's material at the clip's sizes — `MODELS`,
// `MARK_SIZE`, the blob and the column all come from
// `claudeDistilledShared.tsx` — lifted 280px off cut 1's row so the whole group
// has 560px of room to fall through the line without leaving the frame.
//
//   marks        104px (`MARK_SIZE`), y 560, x 300 / 540 / 780 (`MODELS`)
//   blobs        the shared superellipse (n 2.4), 230 x 180, centred on
//                (x_mark, mark_y + 170) = (x, 730), so it spans y 640..820 and
//                x +/- 115 and the three leave a ~10px gap
//   columns      three wide at x + {-13, 0, +13}, 14px pitch (`COL_PITCH`), top
//                row 640, 22 rows (`COL_ROWS`) to 934 — the shared column, hung
//                off the blob's own top
//   the line     y 1040, world x -40 -> 1120, fixed; it never moves
//   the readout  `RL`, Söhne Kräftig 42 world px (56 screen px at k 1.35),
//                baseline y 1022, left-aligned at world x 190 — the left end of
//                the line AS FRAMED: at k 1.35 the frame only reaches world
//                x 140, so the brief's x 60 would be off the left edge
//
// After the descent the marks sit at y 1120 and the columns hang from 1200 to
// 1494 under them, with the line and its readout above.
// ---------------------------------------------------------------------------
const MARK_Y = 560;
const MARK_BOTTOM = MARK_Y + MARK_SIZE / 2; // 612

const BLOB_CY = MARK_Y + 170; // 730
const BLOB_TOP = BLOB_CY - BLOB_B; // 640
const BLOB_BOTTOM = BLOB_CY + BLOB_B; // 820
const COL_TOP = BLOB_TOP; // 640: the column hangs from the blob's own top

// The line. Snapped to a half pixel with an odd stroke width so it does not
// shimmer, and run 40px past both frame edges: at k 1.0 the frame is exactly
// 1080 world px wide and `sway` drifts the camera +/-3px sideways, so a line
// drawn from 0 to 1080 would show a few px of bare field at one end or the
// other. The clip that splits every mark is this same y, so the wipe and the
// rule are one number.
const LINE_Y = 1040.5;
const LINE_X0 = -40;
const LINE_X1 = WORLD_W + 40;
const READOUT_X = 190;
const READOUT_BASELINE = 1022;
const READOUT_SIZE = 42; // world px; 56.7 screen px at k 1.35, the brief's size

// ---------------------------------------------------------------------------
// The descent: one smoothstep, warp 1, no spring, no overshoot.
//
// It starts on the frame the line finishes drawing — "cut", f68 + the 6 frame
// draw = f74 — and lands f118, one frame before "lot". 44 frames for 560px,
// where the first build had 56: the peak is 19.1 world px a frame at f96, which
// is 25.8 screen px at k 1.35, well under the 45 px/frame cap.
//
// Everything else in the cut falls out of those two numbers rather than being
// timed beside them. Measured off this curve:
//   f92.9  the blob's base reaches the line, so the combing starts on "down"
//   f102.5 the blob's top reaches it — the comb is a 10 frame sweep UP the blob
//   f107.5 the marks' centres cross (dy 480), on "RL"
//   f112.0 the marks are fully through (dy 532), on "a"
//   f116.2 the last dot seats in its column
//   f118   the fall lands
const DESC_F0 = 74;
const DESC_F1 = 118;
const DESC_DY = 560;
// How long a dot takes to glide from its blob seat to its column seat, and on
// what curve. The brief asked for an 8-frame ease-out and the first build made
// it a 12-frame smoothstep: an ease-out front-loads a third of a ~180px fold
// into its first frame, which is 82 screen px at k 1.35, and a smoothstep has
// no such step at its start.
//
// 12 frames was measured against the 56-frame descent. On the 44-frame descent
// the comb rides a faster group and the two speeds ADD: the fastest dot then
// peaks at 35.0 world px a frame (47.2 screen px at k 1.35), just over the cap
// the brief sets for itself. 14 frames brings that to 32.3 (43.6 screen px),
// under the cap, and still seats the last dot at f116.2 — inside the fall,
// which lands f118. Nothing else moves: the hand-off from riding the group to
// gliding stays a 1.4x speed step at worst, well inside the 2x the audit allows.
const COMB_DUR = 14;

// The camera's content centre, before and after. `CAM_LIFT` puts whatever world
// y is named here at screen 835 whatever the zoom, so these two numbers are the
// framing.
//   f0-74   the opening block is the three marks (508..612) and their blobs
//           (640..820): centre 664. At k 1.35 the frame reaches world x 140..940
//           and the blobs span 185..895, so the side margins are 61 screen px.
//   f110-   the resolved block is the readout (from 992), the line (1040.5), the
//           marks (1068..1172) and the columns (1200..1494): centre 1243.
//
// It does NOT resolve on 1243, and that is a deliberate trade. The relative
// motion — the group through the line — is 560 world px whatever the camera
// does; the camera only decides how that is split between the group going down
// and the line coming up. Keyed to the block centre the camera would travel 579
// against the group's 560, the group would be pinned on screen and the piece
// would read as a rising line with a static subject. Keyed to 1160 the camera
// travels 496: the line still sweeps 670 screen px UP through the group — which
// is what the gesture is for — and the group still descends 86 screen px, so it
// is visibly falling and not merely being tracked. The cost is that the
// resolved block centre sits at screen 947 rather than 835, with the column
// bottom at 1286 and the readout top at 592 — the whole block inside the frame
// and clear of the caption band from ~1450.
const CONTENT_0 = 664;
const CONTENT_1 = 1160;

// smoothstep's inverse, so a dot can be asked the exact frame its own world y
// crosses the line rather than being told by a parallel timer.
const invSmooth = (u: number) => 0.5 - Math.sin(Math.asin(1 - 2 * clamp01(u)) / 3);

/** how far the group has fallen at frame f */
const dropAt = (f: number) => DESC_DY * smoothstep((f - DESC_F0) / (DESC_F1 - DESC_F0));
/** the frame at which world y `y0` (a group coordinate) reaches the line */
const crossFrame = (y0: number) =>
  DESC_F0 + (DESC_F1 - DESC_F0) * invSmooth((LINE_Y - y0) / DESC_DY);

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is a TILT: k never changes — it sits at `K_REST`
// 1.35, where cuts 1 and 2 resolve, so the three cuts are the same size in the
// edit. The group falls 560 and the camera follows it down 496, so the group
// still travels on screen — but the line, which is fixed in the world, rises
// 670 screen px through it. That is the whole trick of the cut: "cut down" is
// the models going down, and what you watch is the line coming up.
//
// `camMove` writes it as a warped smoothstep, one key per frame, and takes cy
// from the eased k (constant here) so the composition cannot sag against its
// own zoom; `runCamera` damps it. Warp 0.72 puts the speed early, so the camera
// is already travelling under the held "cut" and settling under "by RL".
//
// It is keyed f74-110, not f74-118, because the damper lags its target — cut 1
// re-keyed its own move for exactly this reason. The measured track: it peaks
// at 19.6 world px a frame (26.5 screen px) at f89, is one acceleration lobe
// and one deceleration lobe with no second bump, falls under 1 world px a frame
// at f116 and is at 0.43 on f118, where the fall lands — so the camera and the
// group come to rest together, a frame before "lot" (f119), and the last four
// frames of the settle are under half a screen pixel each.
// ---------------------------------------------------------------------------
const CAM = camMove({
  f0: 74,
  f1: 110,
  k0: K_REST,
  k1: K_REST,
  c0: CONTENT_0,
  c1: CONTENT_1,
  warp: 0.72,
});
const CAM_F = [0, ...CAM.F, DURATION];
const CAM_K = [K_REST, ...CAM.K, K_REST];
const CAM_CY = [CONTENT_0 + CAM_LIFT / K_REST, ...CAM.CY, CONTENT_1 + CAM_LIFT / K_REST];

// ---------------------------------------------------------------------------
// The outputs. `makeSeats` is the clip's own generator — the same 64 seats per
// model in the style's fleet shape, the same undulating feathered boundary, the
// same 16px minimum separation across all three blobs, the same hashed
// half-and-half mix of ripe and deep (the mixed tone IS the diversity), and the
// same three-wide 14px-pitch column, ranked by depth so the blob folds into it
// without crossing. Cut 3 passes its own offsets and nothing else.
//
// What this cut adds is per seat, and it is all timing: when the dot arrives in
// the blob, and the frame its own world y crosses the line — and therefore the
// frame it combs. A seat at the blob's bottom crosses at f92.9 and one at its
// top at f102.5, so the comb is one continuous sweep UP the blob rather than a
// cue — and because the column is 294 tall where the blob is 180, and is hung
// from the blob's own top, every seat's column y is at or below its blob y. A
// combing dot therefore only ever travels DOWN the frame, and nothing that has
// passed under the line ever comes back up through it.
// ---------------------------------------------------------------------------
type Timed = Seat & {
  t0: number; // the frame it leaves the mark's bottom edge
  dur: number; // how long its flight takes
  comb: number; // the frame its blob seat crosses the line
};

const SEATS: Timed[] = makeSeats({
  blobCy: BLOB_CY,
  colTop: COL_TOP,
  markBottom: MARK_BOTTOM,
}).map((s) => ({
  ...s,
  // the blob's top seats first: arrivals run 15 -> 35 with depth, and the three
  // blobs are offset 0 / 1.5 / 3 frames so they never spray together
  t0: 12 + 9 * s.v + s.m * 1.5,
  // v3: `FLIGHT_EXTRA` is on `dur` only — every dot leaves on exactly the frame
  // it always left on, and only the landing is two frames later.
  dur: 3 + 9 * s.v + (hash(s.i, 34 + s.m) - 0.5) * 1.4 + FLIGHT_EXTRA,
  comb: crossFrame(s.fy),
}));

// The thing the cut rests on, checked once rather than trusted: the outputs
// start ABOVE the line — the comb is the line reaching them, so a blob that
// already straddled it would have nothing to cross — and the column hangs below
// the blob, so no dot is ever pulled back up.
if (BLOB_BOTTOM >= LINE_Y || COL_TOP + (COL_ROWS - 1) * COL_PITCH <= BLOB_BOTTOM) {
  throw new Error("ClaudeifiedByRL: the column must hang below a blob that starts above the line");
}

const ClaudeifiedByRL: React.FC<Props> = ({
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
  readout,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = deep, 1 = ripe. Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);

  // -- the one big motion ----------------------------------------------------
  const dy = dropAt(frame);

  // -- the outputs -----------------------------------------------------------
  // A dot's position is its own arrival, then the group's fall, then its own
  // comb — and the comb starts on the frame ITS world y reaches the line, which
  // is derived from the fall, not timed alongside it.
  const dots = SEATS.map((s) => {
    if (frame < s.t0) return null;
    const lin = clamp01((frame - s.t0) / s.dur);
    const e = flightEase(lin);
    const dx = s.fx - s.sx;
    const dvy = s.fy - s.sy;
    const L = Math.hypot(dx, dvy) || 1;
    const bow = Math.sin(Math.PI * e) * s.arc;
    const ax = s.sx + dx * e + (-dvy / L) * bow;
    const ay = s.sy + dvy * e + (dx / L) * bow;
    const q = smoothstep((frame - s.comb) / COMB_DUR);
    return {
      x: ax + (s.cx - ax) * q,
      y: ay + (s.cy - ay) * q + dy,
      tone: s.ripe * (1 - q),
      fade: smoothstep(lin / 0.2),
      seated: lin >= 1,
      seed: s.seed,
    };
  });

  // -- the line --------------------------------------------------------------
  // 8 frames, head-led, landing on the frame the descent starts: "cut" is f68,
  // so the head leaves at f66 and the rule is whole at f74.
  const drawn = interpolate(frame, [beats.cut - 2, beats.cut + 6], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const headX = LINE_X0 + (LINE_X1 - LINE_X0) * drawn;

  // -- the readout -----------------------------------------------------------
  // 8 frames from just before "by" (f99) to just after "RL" (f104), so the word
  // and the name land together.
  const readIn = interpolate(frame, [beats.by - 1, beats.by + 7], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = AXIS + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the per-icon shadow ---------------------------------------------------
  // On every icon — the six glyph halves, the line, the readout. Screen px
  // divided by k, so it is the same shadow at every camera position. The dots
  // are the field, not icons, and get nothing.
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

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
            <defs>
              <clipPath id="cbr-above">
                <rect x={-400} y={-1200} width={WORLD_W + 800} height={LINE_Y + 1200} />
              </clipPath>
              <clipPath id="cbr-below">
                <rect x={-400} y={LINE_Y} width={WORLD_W + 800} height={WORLD_H} />
              </clipPath>
            </defs>

            {/* the outputs: the blobs, and then the columns they comb into */}
            {dots.map((d, i) =>
              d ? (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={dotRadius * (d.seated ? breath(frame, hash(d.seed, 9)) : 1)}
                  fill={tone(d.tone)}
                  opacity={d.fade}
                />
              ) : null,
            )}

            {/* the marks: each one its own glyph above the line and the Claude
                mark below it, same centre, same em, clipped at the line's y.
                The shadow is on the WRAPPER, not on either half: a filter on a
                clipped half would cast the cut edge's own shadow along the line
                and read as a smudge under it. On the wrapper the two halves
                composite first and only the outside of the union is shadowed. */}
            {MODELS.map((mod) => (
              <g key={mod.name} style={{ filter: icon }}>
                <g clipPath="url(#cbr-above)">
                  <Glyph glyph={mod.glyph} x={mod.x} y={MARK_Y + dy} size={MARK_SIZE} ink={ink} />
                </g>
                <g clipPath="url(#cbr-below)">
                  <Glyph glyph={CLAUDE} x={mod.x} y={MARK_Y + dy} size={MARK_SIZE} ink={ink} />
                </g>
              </g>
            ))}

            {/* RL: one line, fixed in the world, drawn head-led and then left
                alone. It goes over the marks, so the seam of every wipe is the
                rule itself. */}
            {drawn > 0 ? (
              <g style={{ filter: icon }}>
                <line
                  x1={LINE_X0}
                  y1={LINE_Y}
                  x2={headX}
                  y2={LINE_Y}
                  stroke={ink}
                  strokeWidth={3}
                  strokeLinecap="butt"
                  opacity={OP_READ}
                />
                {drawn < 1 ? (
                  <circle cx={headX} cy={LINE_Y} r={4} fill={ink} opacity={OP_READ} />
                ) : null}
              </g>
            ) : null}

            {readIn > 0 ? (
              <g style={{ filter: icon }} opacity={readIn}>
                <text
                  x={READOUT_X}
                  y={READOUT_BASELINE + 10 * (1 - readIn)}
                  fill={ink}
                  textAnchor="start"
                  style={readoutStyle(READOUT_SIZE)}
                >
                  {readout}
                </text>
              </g>
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default ClaudeifiedByRL;
