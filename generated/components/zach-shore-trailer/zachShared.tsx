import React from "react";
import { CHAIN, CROWN_STEP, INK, SHADOW, SHADOW_OFF, STROKE } from "../kits/core-memory/cerroShared";

// ---------------------------------------------------------------------------
// ZACH SHORE TRAILER — the shared world (owner: builder A).
//
// Core Memory podcast, Zach Shore (Hermeus). Opaque 16:9 cuts at 2048 x 1080,
// 23.976 fps, in the core memory graphic standard on the 16:9 kit
// `../kits/core-memory/cerroShared.tsx` (paper, ink, hard shadow, crown,
// camera). This file only adds the clip's own glyphs. Every cut draws the SAME
// aircraft from here, so the jet in one cut is the jet in the next.
//
// LEGEND
//   * THE JET: Hermeus' uncrewed fast jet (Quarterhorse family), redrawn as a
//     flat white glyph: a long chined nose with NO canopy (uncrewed is the
//     point), a cropped-delta wing set aft, twin canted vertical tails, one
//     engine nozzle. One airframe, two views with the same proportions:
//     `view="top"` (planform) and `view="side"` (profile). Solid = the real
//     aircraft; `hollow` = a white STROKE outline on its shadow outline,
//     nothing inside: the aircraft that is NOT there (an empty flight line).
//   * THE AIRLINER: `AIRLINER_TOP` / `<Airliner />`, a generic twin-engine
//     swept-wing airliner planform at the same weight (cut A only, dimmed).
//   * THE CHAIN ECHO means ONE thing in this clip: THE UNCREWED FAST JET'S
//     SPEED. The crown trails behind the jet when it moves fast (`JetEcho`),
//     only on this jet glyph, only at a cut's payoff. Nothing else gets it.
//
// GEOMETRY. Path coordinates are WORLD px at scale 1, the aircraft's centre
// at (0, 0), NOSE POINTING +x (east / right), +y down. `JET_LEN` = 120 is
// nose tip to nozzle. Side view: +y is down (belly), the tail fin up (-y).
// Top view: symmetric about y = 0.
//
// PLACEMENT. `<Jet x y angle scale />`: rotate by `angle` DEGREES (SVG sense:
// clockwise on screen; 180 = nose west, -90 = nose north, a side-view jet
// pitching nose-down is +angle), then scale, then move to (x, y) in world px.
// The hard shadow is the same shape at +SHADOW_OFF/+SHADOW_OFF WORLD px (not
// rotated with the aircraft), zero blur. The hollow outline is STROKE world
// px wide whatever the scale.
// ---------------------------------------------------------------------------

export const JET_LEN = 120; // world px, nose tip to nozzle, at scale 1
export const JET_SPAN = 62; // world px, wing tip to wing tip (top view)
export const JET_SIDE_H = 43; // world px, fin tip to intake bottom (side view)

// -- the jet, top view (planform), nose +x --------------------------------------
// Half outline (y >= 0) from the nose tip aft, mirrored for the other side.
//   chined forebody widening to the fuselage (half-width 8.3) at x 0, the
//   cropped-delta leading edge to the tip (-36, 31), a 9 px tip chord, the
//   trailing edge in to (-47, 11.5), where the canted fin's outer edge carries
//   on aft (it shows past the wing's trailing edge), the fin's trailing edge,
//   and the nozzle stub on the centre line.
const JET_TOP_HALF: ReadonlyArray<readonly [number, number]> = [
  [60, 0],
  [50, 2.4],
  [38, 4.7],
  [24, 6.7],
  [10, 7.9],
  [0, 8.3],
  [-36, 31],
  [-45, 31],
  [-47, 11.5],
  [-54, 20.5],
  [-59, 20.5],
  [-57.5, 8],
  [-61, 5.6],
];
const mirrorPath = (half: ReadonlyArray<readonly [number, number]>) => {
  const pts = [...half, ...[...half].reverse().map(([x, y]) => [x, -y] as const)];
  // drop the duplicated nose point; close at the nozzle on the centre line
  return `M${pts.map(([x, y]) => `${x} ${y}`).join(" L")} Z`;
};
export const JET_TOP_D = mirrorPath(JET_TOP_HALF);
/** The SAME planform simplified for the chain echo's copies: body + wing, no fins (the fin tabs made the trailing
 *  copies jagged, a coloured puff). The trailing edge runs straight in to the nozzle. Top view only. */
export const JET_TOP_ECHO_D = mirrorPath([
  ...JET_TOP_HALF.slice(0, 8), // nose ... wing tip (-45, 31)
  [-48, 9],
  [-61, 6],
]);

// -- the jet, side view (profile), nose +x, belly +y ------------------------------
//   the sharp chined nose rising into a smooth spine with NO canopy, the spine
//   tapering to the nozzle; the canted fins (seen as one) on the aft spine; the
//   belly with a chunky ventral intake under the wing root, back up to the
//   chine and out to the nose tip.
export const JET_SIDE_D = [
  "M60 2.5",
  "C46 -1.5 30 -7 12 -8.8", // nose top: the chine rising into the spine
  "L-24 -9", // spine, no canopy
  "L-45 -31", // fin leading edge
  "L-54.5 -31", // fin tip
  "L-56 -7.6", // fin trailing edge down to the tail
  "L-60 -5.4", // nozzle top
  "L-60 5.4", // nozzle exit
  "L-55 6.6",
  "L-24 8.6", // aft belly
  "L-16 12", // intake ramp
  "L18 12", // intake bottom
  "L22 6.2", // intake lip
  "C36 5.2 48 4.2 60 2.5", // the lower chine out to the nose tip
  "Z",
].join(" ");

// -- the airliner, top view, nose +x -----------------------------------------------
// A generic twin-engine swept-wing airliner (not a real type): round nose, a
// 30-degree swept wing, two underwing pods poking ahead of the leading edge,
// a swept tailplane. Same length as the jet at scale 1 (AIRLINER_LEN).
export const AIRLINER_LEN = 120;
const AIRLINER_HALF_BODY = [
  "M60 0",
  "C60 4.2 56.5 6.6 50 6.6",
  "L14 6.6", // wing root, leading edge
  "L-14 54", // leading edge to the tip
  "L-22 54", // tip chord
  "L-5 6.6", // trailing edge
  "L-38 6.6",
  "L-52 22", // tailplane leading edge
  "L-58 22",
  "L-52 4.6", // tailplane trailing edge
  "L-60 1.6", // tail cone
  "L-60 -1.6",
  "L-52 -4.6",
  "L-58 -22",
  "L-52 -22",
  "L-38 -6.6",
  "L-5 -6.6",
  "L-22 -54",
  "L-14 -54",
  "L14 -6.6",
  "L50 -6.6",
  "C56.5 -6.6 60 -4.2 60 0",
  "Z",
].join(" ");
// a pod: rounded front at x 15, cut square at x -1, 7.4 wide, centred on y
const pod = (y: number) =>
  `M15 ${y - 3.7} C17.5 ${y - 3.7} 17.5 ${y + 3.7} 15 ${y + 3.7} L-1 ${y + 3.7} L-1 ${y - 3.7} Z`;
export const AIRLINER_TOP = `${AIRLINER_HALF_BODY} ${pod(22)} ${pod(-22)}`;

// ---------------------------------------------------------------------------
// COMPONENTS (inside a world SVG)
// ---------------------------------------------------------------------------
export type JetView = "top" | "side";
export const jetPath = (view: JetView) => (view === "top" ? JET_TOP_D : JET_SIDE_D);
/** the silhouette the echo copies use: the simplified planform on a top view, the full profile on a side view */
export const jetEchoPath = (view: JetView) => (view === "top" ? JET_TOP_ECHO_D : JET_SIDE_D);

type Place = { x: number; y: number; angle?: number; scale?: number };
const placeT = ({ x, y, angle = 0, scale = 1 }: Place, dx = 0, dy = 0) =>
  `translate(${x + dx} ${y + dy}) rotate(${angle}) scale(${scale})`;

/** One glyph, solid or hollow, in one fill, at a placement (no shadow). The
 *  render function the chain echo and the shadow reuse. */
export const glyphAt = (
  d: string,
  p: Place,
  fill: string,
  opts: { hollow?: boolean; dx?: number; dy?: number } = {},
) => {
  const s = p.scale ?? 1;
  return (
    <path
      d={d}
      transform={placeT(p, opts.dx ?? 0, opts.dy ?? 0)}
      fill={opts.hollow ? "none" : fill}
      stroke={opts.hollow ? fill : undefined}
      strokeWidth={opts.hollow ? STROKE / s : undefined}
      strokeLinejoin={opts.hollow ? "round" : undefined}
    />
  );
};

/**
 * THE JET. Solid white on its hard shadow by default.
 *   view    "top" (planform) | "side" (profile)
 *   x, y    the aircraft's centre, world px
 *   angle   degrees, clockwise on screen (0 = nose east, 180 = nose west)
 *   scale   1 = JET_LEN (120) world px long
 *   hollow  a white STROKE outline on its shadow outline, nothing inside
 *   shadow  false = no hard shadow (rare)
 *   ink     the front colour (default white); opacity: the ladder rung
 */
export const Jet: React.FC<
  Place & { view: JetView; hollow?: boolean; shadow?: boolean; ink?: string; opacity?: number }
> = ({ view, hollow = false, shadow = true, ink = INK, opacity = 1, ...p }) => {
  const d = jetPath(view);
  return (
    <g opacity={opacity === 1 ? undefined : opacity}>
      {shadow ? glyphAt(d, p, SHADOW, { hollow, dx: SHADOW_OFF, dy: SHADOW_OFF }) : null}
      {glyphAt(d, p, ink, { hollow })}
    </g>
  );
};

/** THE AIRLINER (top view), the same placement rules as `Jet`. */
export const Airliner: React.FC<Place & { hollow?: boolean; shadow?: boolean; ink?: string; opacity?: number }> = ({
  hollow = false,
  shadow = true,
  ink = INK,
  opacity = 1,
  ...p
}) => (
  <g opacity={opacity === 1 ? undefined : opacity}>
    {shadow ? glyphAt(AIRLINER_TOP, p, SHADOW, { hollow, dx: SHADOW_OFF, dy: SHADOW_OFF }) : null}
    {glyphAt(AIRLINER_TOP, p, ink, { hollow })}
  </g>
);

/**
 * THE CHAIN ECHO ON THE JET = its speed. The jet's own silhouette three times
 * BEHIND it along its tail direction: blue 1 x `step`, purple 2 x, orange 3 x
 * (world px), then the shadow and the white core on top — a crown trailing the
 * jet (top view: the copies are the simplified planform JET_TOP_ECHO_D, no fins). `step` is the caller's, derived from the jet's speed: 0 at rest (the
 * crown is closed up under the core: draw nothing), opening with speed to about
 * 26 at most (the house rule: a fast mover's trail stays a crown, never a
 * fixed-lag flag). Nothing fades: a copy exists or it does not.
 * Replaces `<Jet />` while it is drawn (it draws the core and its shadow).
 */
export const JetEcho: React.FC<
  Place & { view: JetView; step: number; ink?: string; maxStep?: number }
> = ({ view, step, ink = INK, maxStep = 26, ...p }) => {
  const d = jetPath(view);
  const de = jetEchoPath(view);
  const st = Math.max(0, Math.min(maxStep, step));
  const a = ((p.angle ?? 0) * Math.PI) / 180;
  // the tail direction, world px
  const bx = -Math.cos(a);
  const by = -Math.sin(a);
  return (
    <g>
      {glyphAt(d, p, SHADOW, { dx: SHADOW_OFF, dy: SHADOW_OFF })}
      {st > 0.25
        ? CHAIN.map((c, i) => {
            const n = 3 - i; // orange 3 steps back, purple 2, blue 1
            return <g key={c}>{glyphAt(de, p, c, { dx: bx * st * n, dy: by * st * n })}</g>;
          })
        : null}
      {glyphAt(d, p, ink)}
    </g>
  );
};

/** The resting crown step (for a jet that has stopped but keeps its crown). */
export const JET_CROWN_REST = CROWN_STEP;
