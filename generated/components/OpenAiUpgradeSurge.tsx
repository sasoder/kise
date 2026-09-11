import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

/**
 * OpenAI mark, upgraded.
 *
 * One event, built from two things only: the mark's own ink, and one band of
 * light travelling outward inside it. Nothing is drawn outside the ink — no
 * glow, no rim, no halo, no particles.
 *
 * The ink is white, so the upgrade cannot be read as "white light added to
 * white ink" — that is invisible. Instead the mark *rests below full white*:
 * the thin before-state is drawn at `restOpacity` (0.82), so at f0 it reads as
 * a clean white logo with a little headroom left above it. The band brings
 * every piece of ink it crosses up to full white, and the heavier after-state
 * it reveals is also full white. So behind the band the ink is both brighter
 * and thicker, and the difference between the first frame and the last is a
 * real step up in luminance rather than only a change of weight.
 *
 * The svg is `overflow: visible` (attribute and style, and the wrapping div
 * does not clip either). The mark's path touches its own 0 0 24 24 viewBox on
 * every side — the bottom point sits at y=24 exactly — so the after-state's
 * extra stroke (weightGain/2 outward) and the settle's scale were being cut
 * off flush by the svg's box. Letting it overflow keeps the mark at its
 * designed size and simply stops the clipping.
 *
 * Timeline (24fps, 168 frames):
 *   f0-20   rest    thin mark, perfectly still. Nothing moves.
 *   f20-40  charge  band sits on the ring of ink around the centre hexagon
 *                   (radius 2.9 -> 3.7) and comes up 0 -> 0.75 opacity with
 *                   Easing.in(Easing.quad). Light gathers in the core.
 *   f40-64  surge   band radius 3.7 -> 15.5, Easing.out(Easing.quad). The
 *                   leading edge crosses from the hexagon ring to the arm
 *                   tips (radius 12.2) in 11 frames, reaching them at f51.31;
 *                   the band's bright 0.45 midpoint clears the tips at f53.70
 *                   and its full 2.5 tail clears them at f57.75. The light
 *                   therefore travels all the way off the mark instead of
 *                   dimming in place. The thick-ink reveal rides 1.1 units
 *                   behind the leading edge (ending at 14.4, well past the
 *                   tips), so the mark is heavier only where the light has
 *                   already been.
 *   f58-63  fade    band opacity -> 0. By f58 the tail has essentially left
 *                   the ink, so the fade is only a safety, not the thing that
 *                   removes the light. The light leaves; the weight stays.
 *   f58-70  settle  whole svg 1 -> 1.02 -> 1, Easing.inOut(Easing.quad), peak
 *                   at f63. The only whole-mark motion in the piece.
 *   f66-82  load    ambient load fades in and then runs to the end: four soft
 *                   slivers of light lapping the mark's outer rim, evenly
 *                   spaced, clockwise, one lap per 144 frames. They are drawn
 *                   behind the ink, so each reads as an aura sliding along the
 *                   rim rather than a shape laid on top of it. The gesture:
 *                   after the upgrade, load runs round the knot — the mark is
 *                   not just heavier, it is live and carrying traffic.
 *   f70-168 hold    the heavier mark, still, with the load running. The last
 *                   frame is the after-state with the pulses mid-travel, so
 *                   the hold can be cut anywhere.
 */

export const FPS = 24;
export const DURATION = 168;

// The OpenAI mark from the Simple Icons set (`public/si-openai.svg`): one
// compound path in a 24x24 viewBox, centred on (12,12). Pasted rather than
// fetched so the reveal mask and the light mask can share the exact shape.
const D =
  'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z';

// All geometry in the mark's own 24-unit space.
const CX = 12;
const CY = 12;
// Measured off the rendered mark: there is no ink at all inside r = 2.55 — the
// centre hexagon is a hole — the ring around it inks r 2.6-3.9, and the outer
// tips end at r 12.2. So the charge lives on that ring rather than at radius 0,
// where it would have nothing to light up.
const CORE_R0 = 2.9; // charge starts just inside the hexagon ring
const CORE_R1 = 3.7; // and ends just outside it
// Where the leading edge ends at f64. Solved, not guessed: with
// Easing.out(Easing.quad) over f40-64, radius(f) = 3.7 + (EXIT_R - 3.7)*(1-(1-t)^2)
// for t = (f-40)/24, so the frame at which a given radius r clears the arm tips
// (12.2) is f = 40 + 24*(1 - sqrt(1 - (r - 3.7)/(EXIT_R - 3.7))).
// EXIT_R must clear the band's *whole* 2.5 tail past the tips, not just its
// leading edge: at 13.4 the tail was still lying across the outer lobes while
// the opacity fade took it down in place, which read as grey shading rather
// than as light leaving. At 15.5 over a 24-frame window the edge reaches the
// tips at f51.31, the bright 0.45 midpoint clears them at f53.70 and the full
// tail clears them at f57.75 — so the light is gone from the ink before the
// fade starts. The reveal still trails by REVEAL_LAG (1.1) and ends at 14.4,
// comfortably past 12.2, so the arm tips take the weight.
const EXIT_R = 15.5;
const BAND_TAIL = 2.5; // band width: long soft tail behind a crisp leading edge
const BAND_EDGE = 0.35; // how soft the leading edge is, in units
const REVEAL_SOFT = 0.15; // soft edge on the heavier-ink reveal
// How far behind the band's leading edge the heavier ink arrives. Trailing the
// band by its full tail (2.5) put the new weight in ink the light had already
// left, so it read as a soft shadow creeping round the lobes; at 1.1 the ink
// thickens under the bright part of the band, where the light hides the seam.
const REVEAL_LAG = 1.1;

// --- The rim: where the ambient load runs after the upgrade -----------------
//
// The ink along the mark's outer rim is continuous all the way round (six lobe
// arcs joined at six cusps), so it is the one closed path the load can lap.
// Measured off the rendered after-state rather than guessed: the f95 still was
// rendered at --scale 2 (2160px; markSize 720 doubled to 1440px for the 24-unit
// box, so 60px per unit with (12,12) at the canvas centre), then for each whole
// degree a ray was cast from (12,12) outward and the OUTERMOST run of
// alpha > 128 along it was taken. The midpoint of that run is the rim
// centreline at that angle; the run's length is the ink width across the rim
// there. Median width 1.99 units (1.88 at the thinnest lobe apex, wider only
// where a ray grazes a cusp). All 360 points sample alpha 255 on that still —
// every one sits well inside the ink.
const RIM: [number, number][] = [
  [22.688, 12.000], [22.757, 12.188], [22.818, 12.378], [22.870, 12.570], [22.921, 12.764],
  [22.960, 12.959], [22.991, 13.155], [23.015, 13.352], [23.031, 13.550], [23.041, 13.749],
  [23.038, 13.946], [23.033, 14.145], [23.023, 14.343], [22.998, 14.539], [22.972, 14.736],
  [22.935, 14.930], [22.892, 15.123], [22.842, 15.315], [22.785, 15.504], [22.720, 15.691],
  [22.648, 15.876], [22.571, 16.058], [22.485, 16.236], [22.390, 16.410], [22.293, 16.583],
  [22.186, 16.750], [22.076, 16.914], [21.959, 17.074], [21.834, 17.229], [21.705, 17.379],
  [21.571, 17.526], [21.429, 17.665], [21.284, 17.802], [21.131, 17.930], [20.974, 18.053],
  [20.813, 18.171], [20.646, 18.282], [20.472, 18.384], [19.345, 17.738], [19.255, 17.875],
  [19.161, 18.009], [19.066, 18.142], [18.972, 18.277], [18.873, 18.409], [18.774, 18.541],
  [18.672, 18.672], [18.570, 18.804], [18.465, 18.933], [18.358, 19.061], [18.315, 19.264],
  [18.262, 19.462], [18.201, 19.658], [18.134, 19.851], [18.058, 20.040], [17.975, 20.223],
  [17.884, 20.403], [17.789, 20.582], [17.686, 20.755], [17.575, 20.922], [17.462, 21.090],
  [17.337, 21.245], [17.212, 21.402], [17.077, 21.549], [16.938, 21.692], [16.793, 21.827],
  [16.644, 21.960], [16.490, 22.085], [16.332, 22.206], [16.170, 22.321], [16.003, 22.427],
  [15.831, 22.526], [15.656, 22.619], [15.480, 22.709], [15.298, 22.788], [15.115, 22.864],
  [14.928, 22.929], [14.740, 22.991], [14.550, 23.045], [14.357, 23.088], [14.163, 23.127],
  [13.967, 23.157], [13.771, 23.179], [13.573, 23.196], [13.376, 23.203], [13.178, 23.203],
  [12.980, 23.197], [12.782, 23.183], [12.585, 23.164], [12.389, 23.135], [12.194, 23.096],
  [12.000, 23.052], [11.808, 23.003], [11.618, 22.941], [11.430, 22.875], [11.245, 22.801],
  [11.062, 22.721], [10.882, 22.635], [10.706, 22.540], [10.533, 22.437], [10.538, 21.229],
  [10.375, 21.216], [10.212, 21.201], [10.048, 21.182], [9.884, 21.165], [9.720, 21.143],
  [9.556, 21.122], [9.391, 21.100], [9.226, 21.075], [9.061, 21.045], [8.866, 21.101],
  [8.667, 21.156], [8.468, 21.202], [8.267, 21.239], [8.066, 21.268], [7.863, 21.291],
  [7.661, 21.305], [7.461, 21.306], [7.258, 21.307], [7.059, 21.293], [6.859, 21.275],
  [6.659, 21.250], [6.463, 21.215], [6.267, 21.175], [6.074, 21.126], [5.881, 21.071],
  [5.693, 21.007], [5.506, 20.938], [5.322, 20.861], [5.143, 20.776], [4.965, 20.688],
  [4.793, 20.589], [4.623, 20.486], [4.460, 20.374], [4.298, 20.260], [4.140, 20.139],
  [3.992, 20.008], [3.845, 19.876], [3.702, 19.738], [3.568, 19.592], [3.437, 19.444],
  [3.313, 19.289], [3.196, 19.130], [3.082, 18.967], [2.977, 18.799], [2.877, 18.628],
  [2.784, 18.453], [2.697, 18.275], [2.616, 18.094], [2.542, 17.910], [2.477, 17.722],
  [2.418, 17.532], [2.366, 17.340], [2.321, 17.147], [2.286, 16.949], [2.257, 16.752],
  [2.236, 16.553], [2.221, 16.354], [2.216, 16.153], [2.218, 15.952], [3.271, 15.351],
  [3.200, 15.203], [3.130, 15.054], [3.062, 14.904], [2.997, 14.753], [2.932, 14.600],
  [2.872, 14.446], [2.806, 14.292], [2.748, 14.136], [2.687, 13.979], [2.546, 13.838],
  [2.398, 13.693], [2.257, 13.543], [2.124, 13.388], [2.000, 13.228], [1.881, 13.064],
  [1.766, 12.895], [1.663, 12.723], [1.562, 12.547], [1.471, 12.368], [1.385, 12.185],
  [1.308, 12.000], [1.235, 11.812], [1.175, 11.622], [1.123, 11.430], [1.075, 11.236],
  [1.034, 11.041], [1.000, 10.844], [0.977, 10.646], [0.961, 10.448], [0.948, 10.250],
  [0.948, 10.051], [0.953, 9.853], [0.965, 9.655], [0.988, 9.458], [1.015, 9.261],
  [1.051, 9.066], [1.092, 8.872], [1.144, 8.681], [1.200, 8.491], [1.262, 8.303],
  [1.335, 8.118], [1.412, 7.936], [1.500, 7.758], [1.595, 7.583], [1.698, 7.413],
  [1.802, 7.245], [1.911, 7.079], [2.028, 6.919], [2.153, 6.764], [2.283, 6.614],
  [2.418, 6.468], [2.560, 6.328], [2.707, 6.193], [2.858, 6.063], [3.017, 5.941],
  [3.179, 5.823], [3.345, 5.712], [3.518, 5.608], [3.691, 5.509], [4.722, 6.107],
  [4.815, 5.971], [4.910, 5.837], [5.008, 5.705], [5.106, 5.571], [5.205, 5.438],
  [5.308, 5.308], [5.409, 5.175], [5.514, 5.045], [5.621, 4.915], [5.672, 4.720],
  [5.725, 4.521], [5.785, 4.326], [5.852, 4.131], [5.929, 3.944], [6.011, 3.756],
  [6.102, 3.576], [6.199, 3.401], [6.304, 3.229], [6.414, 3.060], [6.530, 2.896],
  [6.652, 2.737], [6.781, 2.585], [6.914, 2.435], [7.053, 2.292], [7.197, 2.153],
  [7.348, 2.023], [7.502, 1.898], [7.660, 1.777], [7.823, 1.662], [7.992, 1.558],
  [8.162, 1.456], [8.337, 1.363], [8.515, 1.275], [8.696, 1.194], [8.881, 1.122],
  [9.067, 1.055], [9.256, 0.993], [9.447, 0.941], [9.640, 0.898], [9.834, 0.859],
  [10.030, 0.827], [10.227, 0.806], [10.425, 0.793], [10.623, 0.784], [10.821, 0.787],
  [11.019, 0.791], [11.217, 0.804], [11.415, 0.828], [11.611, 0.857], [11.806, 0.897],
  [12.000, 0.940], [12.192, 0.991], [12.382, 1.050], [12.570, 1.117], [12.756, 1.193],
  [12.938, 1.274], [13.118, 1.361], [13.294, 1.460], [13.301, 2.745], [13.464, 2.759],
  [13.628, 2.769], [13.791, 2.785], [13.955, 2.803], [14.119, 2.821], [14.284, 2.841],
  [14.448, 2.862], [14.614, 2.884], [14.779, 2.909], [14.945, 2.937], [15.142, 2.876],
  [15.340, 2.824], [15.540, 2.777], [15.741, 2.742], [15.942, 2.712], [16.145, 2.691],
  [16.347, 2.678], [16.548, 2.675], [16.749, 2.680], [16.950, 2.690], [17.150, 2.709],
  [17.349, 2.735], [17.546, 2.769], [17.742, 2.811], [17.935, 2.860], [18.128, 2.915],
  [18.315, 2.981], [18.504, 3.049], [18.684, 3.130], [18.865, 3.214], [19.041, 3.306],
  [19.213, 3.404], [19.382, 3.508], [19.546, 3.619], [19.707, 3.736], [19.861, 3.860],
  [20.012, 3.988], [20.159, 4.121], [20.301, 4.259], [20.435, 4.405], [20.564, 4.555],
  [20.688, 4.710], [20.808, 4.868], [20.918, 5.033], [21.021, 5.202], [21.122, 5.373],
  [21.214, 5.548], [21.301, 5.727], [21.381, 5.908], [21.454, 6.093], [21.520, 6.280],
  [21.579, 6.470], [21.630, 6.662], [21.674, 6.856], [21.710, 7.052], [21.739, 7.250],
  [21.760, 7.449], [21.771, 7.650], [21.776, 7.850], [21.770, 8.053], [20.727, 8.650],
  [20.798, 8.798], [20.866, 8.947], [20.932, 9.098], [21.001, 9.248], [21.064, 9.401],
  [21.128, 9.554], [21.192, 9.708], [21.250, 9.864], [21.309, 10.021], [21.458, 10.162],
  [21.606, 10.306], [21.747, 10.456], [21.882, 10.611], [22.004, 10.772], [22.123, 10.936],
  [22.234, 11.105], [22.341, 11.277], [22.434, 11.453], [22.525, 11.633], [22.611, 11.815],
];

// One ink width for the whole rim: the per-angle measurement balloons where a
// ray grazes a cusp, and the load should keep one size all the way round.
const RIM_W = 1.99;

// Arc-length table, so a pulse moves at constant speed along the polyline
// instead of at constant angle (the rim's radius swings 9.3 -> 11.4).
const RIM_N = RIM.length;
const {RIM_CUM, RIM_LEN} = (() => {
  const cum = [0];
  for (let i = 0; i < RIM_N; i += 1) {
    const p = RIM[i];
    const q = RIM[(i + 1) % RIM_N];
    cum.push(cum[i] + Math.hypot(q[0] - p[0], q[1] - p[1]));
  }
  return {RIM_CUM: cum, RIM_LEN: cum[RIM_N]};
})();

// Tangent at each vertex, from its two neighbours, so the ellipse's long axis
// stays along the rim across the cusps instead of snapping.
const RIM_TAN: [number, number][] = RIM.map((_, i) => {
  const a = RIM[(i - 1 + RIM_N) % RIM_N];
  const b = RIM[(i + 1) % RIM_N];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const m = Math.hypot(dx, dy) || 1;
  return [dx / m, dy / m];
});

// t in 0..1 -> a point on the rim and the screen angle of travel there.
// Increasing t runs clockwise on screen (the points are ordered by increasing
// angle, and y points down).
const rimAt = (t: number) => {
  const s = (((t % 1) + 1) % 1) * RIM_LEN;
  let lo = 0;
  let hi = RIM_N - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (RIM_CUM[mid] <= s) lo = mid;
    else hi = mid - 1;
  }
  const p = RIM[lo];
  const q = RIM[(lo + 1) % RIM_N];
  const seg = RIM_CUM[lo + 1] - RIM_CUM[lo];
  const f = seg > 0 ? (s - RIM_CUM[lo]) / seg : 0;
  const t0 = RIM_TAN[lo];
  const t1 = RIM_TAN[(lo + 1) % RIM_N];
  return {
    x: p[0] + (q[0] - p[0]) * f,
    y: p[1] + (q[1] - p[1]) * f,
    angle:
      (Math.atan2(
        t0[1] + (t1[1] - t0[1]) * f,
        t0[0] + (t1[0] - t0[0]) * f,
      ) *
        180) /
      Math.PI,
  };
};

// The pulse itself, in the compute-cloud's proportions: about 1.5x the trace
// width across it and 4x along it (there, rx 12.5 / ry 34 against a 17px
// trace). Half-width across the rim 0.73*w, half-length along it 2.0*w.
const PULSE_ACROSS = RIM_W * 0.73;
const PULSE_ALONG = RIM_W * 2.0;

const clamp = {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;

export const schema = z.object({
  ink: z.string(),
  surge: z.string(),
  markSize: z.number().min(120).max(1080),
  weightGain: z.number().min(0).max(2),
  // How bright the mark sits before the light reaches it. The only thing this
  // touches is the thin before-state path; the revealed heavier path and the
  // band are always full opacity, so the light always has somewhere to go.
  restOpacity: z.number().min(0).max(1),
  // How many soft slivers of light lap the outer rim once the upgrade has
  // landed, and how many frames one full lap takes.
  pulseCount: z.number().int().min(0).max(8),
  lapFrames: z.number().min(1),
  liveliness: z.number().min(0).max(2),
  backdrop: z.string(),
});

export type OpenAiUpgradeSurgeProps = z.infer<typeof schema>;

export const defaultProps: OpenAiUpgradeSurgeProps = schema.parse({
  ink: '#FFFFFF',
  surge: '#FFFFFF',
  markSize: 720,
  // Extra stroke on the filled compound path, so the ink dilates evenly on both
  // sides. The mark's own ring is about 2 units thick, so 0.32 is roughly +15%.
  weightGain: 0.32,
  // Judged on #141414: at 0.72 and 0.78 the resting mark reads silver-grey
  // rather than white, which is wrong for a white logo; at 0.86 the band's
  // step up to full white is too small to read as light arriving. 0.82 is the
  // brightest rest that still leaves a visible lift.
  restOpacity: 0.82,
  // Four pulses evenly spaced on a 144-frame lap: a pulse passes any given
  // point of the rim every 36 frames — a steady load, not a strobe.
  pulseCount: 4,
  lapFrames: 144,
  liveliness: 1,
  backdrop: 'transparent',
});

const OpenAiUpgradeSurge: React.FC<OpenAiUpgradeSurgeProps> = ({
  ink,
  surge,
  markSize,
  weightGain,
  restOpacity,
  pulseCount,
  lapFrames,
  liveliness,
  backdrop,
}) => {
  const frame = useCurrentFrame();

  // One radius drives everything: the light's leading edge. The charge eases
  // in (gathering), the release eases out (thrown, then decelerating).
  const bandOuter =
    frame < 40
      ? interpolate(frame, [20, 40], [CORE_R0, CORE_R1], {
          easing: Easing.in(Easing.quad),
          ...clamp,
        })
      : interpolate(frame, [40, 64], [CORE_R1, EXIT_R], {
          easing: Easing.out(Easing.quad),
          ...clamp,
        });

  const rise = interpolate(frame, [20, 40], [0, 0.75], {
    easing: Easing.in(Easing.quad),
    ...clamp,
  });
  const peak = interpolate(frame, [40, 48], [0.75, 0.9], clamp);
  const fade = interpolate(frame, [58, 63], [1, 0], clamp);
  const bandOpacity =
    Math.min(1, (frame < 40 ? rise : peak) * liveliness) * fade;

  // Gradient stops are placed in absolute units and converted, so the band
  // keeps its real width and edge softness at every radius.
  const gr = Math.max(bandOuter, 0.01);
  const sTail = Math.max(0, (gr - BAND_TAIL) / gr);
  const sMid = Math.max(sTail, (gr - BAND_TAIL * 0.45) / gr);
  const sEdge = Math.max(sMid, (gr - BAND_EDGE) / gr);

  // The heavier ink is revealed behind the band's trailing edge.
  const revealR = Math.max(0, bandOuter - REVEAL_LAG);
  const revealFrac = revealR / (revealR + REVEAL_SOFT);
  const revealOpacity = interpolate(revealR, [0, 0.4], [0, 1], clamp);

  // The settle: the mark takes the weight, once. Nothing else moves.
  const settle =
    frame < 63
      ? interpolate(frame, [58, 63], [0, 1], {
          easing: Easing.inOut(Easing.quad),
          ...clamp,
        })
      : interpolate(frame, [63, 70], [1, 0], {
          easing: Easing.inOut(Easing.quad),
          ...clamp,
        });
  const scale = 1 + settle * 0.02 * liveliness;

  // Ambient load. Once the settle is finishing the knot is live: soft slivers
  // of light lap the outer rim, evenly spaced, clockwise, to the last frame.
  // The gate opens over f66-82 so the load arrives out of the settle rather
  // than switching on; before f66 there are no pulses at all.
  const loadGate = interpolate(frame, [66, 82], [0, 1], clamp);
  const pulses =
    loadGate <= 0
      ? []
      : Array.from({length: pulseCount}, (_, k) => {
          const phase = (frame - 66) / lapFrames + k / pulseCount;
          const p = rimAt(phase);
          return {key: k, ...p};
        });
  const pulseOpacity = 0.22 * liveliness * loadGate;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: backdrop,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/*
        Neither the div nor the svg may clip: the mark's path runs right up to
        the edges of its own viewBox, and both the dilated after-state and the
        settle's scale push past it.
      */}
      <div
        style={{
          width: markSize,
          height: markSize,
          scale: `${scale}`,
          overflow: 'visible',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="100%"
          height="100%"
          overflow="visible"
          style={{overflow: 'visible'}}
        >
          <defs>
            {/* Soft-edged disc that follows the band's trailing edge. */}
            <radialGradient
              id="upgrade-reveal"
              gradientUnits="userSpaceOnUse"
              cx={CX}
              cy={CY}
              r={revealR + REVEAL_SOFT}
            >
              <stop offset={0} stopColor="#ffffff" />
              <stop offset={revealFrac} stopColor="#ffffff" />
              <stop offset={1} stopColor="#000000" />
            </radialGradient>
            <mask
              id="upgrade-reveal-mask"
              maskUnits="userSpaceOnUse"
              x={-2}
              y={-2}
              width={28}
              height={28}
            >
              <rect
                x={-2}
                y={-2}
                width={28}
                height={28}
                fill="url(#upgrade-reveal)"
                opacity={revealOpacity}
              />
            </mask>

            {/* The band itself: crisp leading edge, long tail inward. */}
            <radialGradient
              id="upgrade-band"
              gradientUnits="userSpaceOnUse"
              cx={CX}
              cy={CY}
              r={gr}
            >
              <stop offset={sTail} stopColor={surge} stopOpacity={0} />
              <stop offset={sMid} stopColor={surge} stopOpacity={0.45} />
              <stop offset={sEdge} stopColor={surge} stopOpacity={1} />
              <stop offset={1} stopColor={surge} stopOpacity={0} />
            </radialGradient>
            {/*
              The light lives in the *thin* mark, not the dilated one. Masking
              it with the dilated shape put light in the ring of ink the reveal
              had not reached yet, so it showed up as a bright outline sitting
              on bare backdrop — a halo. Clipped to the thin mark, the light is
              always over ink.
            */}
            <mask
              id="upgrade-ink-mask"
              maskUnits="userSpaceOnUse"
              x={-2}
              y={-2}
              width={28}
              height={28}
            >
              <path d={D} fill="#ffffff" />
            </mask>
          </defs>

          {/*
            0. The ambient load, drawn first so it sits BEHIND every piece of
            ink. Each pulse only shows where its soft aura extends past the
            rim's edges — it never lies on top of the mark.
          */}
          <g fill={ink} opacity={pulseOpacity}>
            {pulses.map((p) => (
              <ellipse
                key={`load-${p.key}`}
                cx={p.x}
                cy={p.y}
                rx={PULSE_ALONG}
                ry={PULSE_ACROSS}
                transform={`rotate(${p.angle} ${p.x} ${p.y})`}
              />
            ))}
          </g>

          {/*
            1. Before state: the thin mark, always present, resting a little
            below full white so the light has headroom to lift it.
          */}
          <path d={D} fill={ink} fillOpacity={restOpacity} />

          {/* 2. After state: the same mark dilated, revealed at full white as the band passes. */}
          <g mask="url(#upgrade-reveal-mask)">
            <path
              d={D}
              fill={ink}
              stroke={ink}
              strokeWidth={weightGain}
              strokeLinejoin="round"
            />
          </g>

          {/* 3. The light, travelling through the ink like a tube. */}
          <g mask="url(#upgrade-ink-mask)" opacity={bandOpacity}>
            <circle cx={CX} cy={CY} r={20} fill="url(#upgrade-band)" />
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export default OpenAiUpgradeSurge;
