// ---------------------------------------------------------------------------
// starlinkShared (kofman-starlink): the parts both Starlink cuts share.
// Owner: builder A (StarlinkLinksDrones). After SHARED_READY.md, only ADD
// exports; log any change in SHARED_CHANGES.md beside this file.
//
// - DRONE_D: Phosphor "drone" (fill weight, 256 box, MIT), from
//   assets-src/kofman-starlink/phosphor_drone_fill.svg, verbatim. Draw it with
//   the kit's `Pictogram d={DRONE_D}`.
// - UGV_D: a small tracked ground robot drawn for this clip in the same Phosphor
//   weight (16-unit bands, 8-unit paper gaps, 256 box): a track loop with its
//   road wheels knocked out, a low flat hull with a sloped nose (it faces right),
//   and a short sensor mast at the rear. No turret, no gun. nonzero winding.
// - UplinkPulse: the Starlink "alive" signal: a red dot that keeps sending out a
//   thin RED_HI ring; each ring leaves the dot's edge, spreads, thins and bleeds
//   away like ink on wet paper (it never pops).
// ---------------------------------------------------------------------------
import React from "react";
import { RED, RED_HI, clamp01, easeOutCubic, lerp, mixHex, smoothstep, vz, worldBlur } from "../kits/chinatalk/chinatalkVintage";

/** Phosphor "drone", fill weight (MIT), 256 box. */
export const DRONE_D =
  "M189.66,77.66,160,107.31v41.38l29.66,29.65a8,8,0,0,1-11.32,11.32L148.69,160H107.31L77.66,189.66a8,8,0,0,1-11.32-11.32L96,148.69V107.31L66.34,77.66A8,8,0,0,1,77.66,66.34L107.31,96h41.38l29.65-29.66a8,8,0,0,1,11.32,11.32Zm-46.28-6.12a8,8,0,0,0,10.21-4.87,28,28,0,1,1,35.74,35.74A8,8,0,0,0,192,118a7.86,7.86,0,0,0,2.67-.46,44,44,0,1,0-56.16-56.16A8,8,0,0,0,143.38,71.54Zm51.29,67a8,8,0,0,0-5.34,15.08,28,28,0,1,1-35.74,35.74,8,8,0,0,0-15.08,5.34,44,44,0,1,0,56.16-56.16Zm-82,46a8,8,0,0,0-10.21,4.87,28,28,0,1,1-35.74-35.74,8,8,0,0,0-5.34-15.08,44,44,0,1,0,56.16,56.16A8,8,0,0,0,112.62,184.46Zm-51.29-67A7.86,7.86,0,0,0,64,118a8,8,0,0,0,2.67-15.54,28,28,0,1,1,35.74-35.74,8,8,0,1,0,15.08-5.34,44,44,0,1,0-56.16,56.16Z";

// --- UGV_D geometry (256 box). Exported so a cut can find contact points. ----
/** the track loop: a stadium, its two end-wheel centres and radius */
export const UGV_TRACK = { x0: 20, x1: 236, y0: 152, y1: 216 };
const TR = (UGV_TRACK.y1 - UGV_TRACK.y0) / 2;
const TCY = (UGV_TRACK.y0 + UGV_TRACK.y1) / 2;
const TL = UGV_TRACK.x0 + TR;
const TRX = UGV_TRACK.x1 - TR;
/** road wheels knocked out of the track (x centres; all on the track's axis) */
const WHEELS = [
  { x: TL, r: 16 },
  { x: 99, r: 13 },
  { x: 157, r: 13 },
  { x: TRX, r: 16 },
];
/** the hull: low and flat, an 8-unit paper gap above the track, a sloped nose on the right */
export const UGV_HULL = { x0: 28, x1: 232, y0: 106, y1: 144, nose: 34 };
/** the sensor mast at the rear and its head */
export const UGV_MAST = { x: 66, w: 16, y0: 66, head: { x0: 46, x1: 98, y0: 42, y1: 70 } };

const f = (n: number) => +n.toFixed(2);
const circleCCW = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)},${f(cy)}A${r},${r},0,1,0,${f(cx + r)},${f(cy)}A${r},${r},0,1,0,${f(cx - r)},${f(cy)}Z`;
const ugvPath = () => {
  const { y0, y1 } = UGV_TRACK;
  // track: clockwise stadium, wheels counter-clockwise (holes under nonzero)
  const track = `M${TL},${y0}H${TRX}A${TR},${TR},0,0,1,${TRX},${y1}H${TL}A${TR},${TR},0,0,1,${TL},${y0}Z`;
  const holes = WHEELS.map((w) => circleCCW(w.x, TCY, w.r)).join("");
  // hull: clockwise, rounded corners (r 8), the nose slopes down to the right
  const h = UGV_HULL;
  const r = 8;
  const hull =
    `M${h.x0 + r},${h.y0}H${h.x1 - h.nose}L${h.x1},${h.y0 + h.nose * 0.62}V${h.y1 - r}` +
    `A${r},${r},0,0,1,${h.x1 - r},${h.y1}H${h.x0 + r}A${r},${r},0,0,1,${h.x0},${h.y1 - r}V${h.y0 + r}A${r},${r},0,0,1,${h.x0 + r},${h.y0}Z`;
  // mast (joins the hull) and its sensor head, with a round lens knocked out facing forward
  const m = UGV_MAST;
  const hd = m.head;
  const hr = 8;
  const mast = `M${m.x - m.w / 2},${hd.y1 - 2}H${m.x + m.w / 2}V${h.y0 + 2}H${m.x - m.w / 2}Z`;
  const head =
    `M${hd.x0 + hr},${hd.y0}H${hd.x1 - hr}A${hr},${hr},0,0,1,${hd.x1},${hd.y0 + hr}V${hd.y1 - hr}A${hr},${hr},0,0,1,${hd.x1 - hr},${hd.y1}` +
    `H${hd.x0 + hr}A${hr},${hr},0,0,1,${hd.x0},${hd.y1 - hr}V${hd.y0 + hr}A${hr},${hr},0,0,1,${hd.x0 + hr},${hd.y0}Z`;
  const lens = circleCCW(hd.x1 - 15, (hd.y0 + hd.y1) / 2, 6);
  return track + holes + hull + mast + head + lens;
};
/** a small tracked ground robot (UGV), solid, 256 box, faces right; nonzero winding */
export const UGV_D = ugvPath();

// --- UplinkPulse --------------------------------------------------------------
/** frames between two rings */
export const PULSE_PERIOD = 40;
/** a ring lives this many periods (so the next one has left before it is gone) */
const PULSE_LIFE = 1.5;
/** the ring's final radius as a multiple of the dot's radius */
const PULSE_REACH = 6;
/** the dot's radius, SCREEN px at k = 1 */
export const PULSE_DOT_PX = 10;

/** the twinkle (cut B's terminal flash): RED_HI soaks into the dot over FLASH_IN frames as a ring leaves, then eases
 *  back over FLASH_OUT; the dot swells by up to FLASH_SWELL x its radius with it */
export const FLASH_IN = 4;
export const FLASH_OUT = 20;
export const FLASH_SWELL = 1.1;
/** the twinkle's strength (0..1) `age` frames after a ring was born */
export const uplinkFlash = (age: number) => (age < 0 ? 0 : smoothstep(age / FLASH_IN) * (1 - smoothstep((age - FLASH_IN) / FLASH_OUT)));

/**
 * The Starlink "alive" signal at world (x, y): a red dot (unless `dot={false}`)
 * and a thin RED_HI ring that leaves the dot's edge every `period` frames,
 * spreads to `reach` x the dot's radius, thins, blurs and fades away.
 * - `r`: the dot's radius in SCREEN px at k = 1 (the size law applies: it shows
 *   as r * k^0.75). Default PULSE_DOT_PX.
 * - `phase`: frame offset of the ring train (stagger many pulses with a hash).
 * - `start`: no ring is born before this frame (default: rings at every period,
 *   so the pulse is already running on frame 0). The first ring leaves at `start`.
 * - `on` (0..1): fades the whole pulse's rings in (e.g. while its dot grows).
 * Added (SHARED_CHANGES.md; every default keeps the old look):
 * - `twinkle`: as each ring leaves, the dot swells and soaks to RED_HI over FLASH_IN f and eases back over FLASH_OUT f
 *   (cut B's terminal flash; uplinkFlash).
 * - `ringFrom` (default 1): the ring's base radius as a multiple of the dot's (cut B uses 2: it leaves at 2x the dot's
 *   radius and spreads to `reach` x that); its weight scales with it.
 * - `grow` (0..1, default 1): the dot grows in place from its centre (easeOutCubic), like a Seal.
 * - `rings` (default true): false draws no rings, only the dot (and its twinkle when `twinkle`).
 * Draw it inside a RedGroup only if you want the dot's paper shadow; the rings
 * themselves are highlights and want none.
 */
export const UplinkPulse: React.FC<{
  x: number;
  y: number;
  k: number;
  S: number;
  period?: number;
  phase?: number;
  r?: number;
  reach?: number;
  start?: number;
  dot?: boolean;
  on?: number;
  color?: string;
  twinkle?: boolean;
  ringFrom?: number;
  grow?: number;
  rings?: boolean;
}> = ({
  x,
  y,
  k,
  S,
  period = PULSE_PERIOD,
  phase = 0,
  r = PULSE_DOT_PX,
  reach = PULSE_REACH,
  start,
  dot = true,
  on = 1,
  color = RED,
  twinkle = false,
  ringFrom = 1,
  grow: dotGrow = 1,
  rings: ringsOn = true,
}) => {
  const r0 = r * vz(k);
  const ring0 = r0 * ringFrom;
  const life = PULSE_LIFE * period;
  const rings: React.ReactNode[] = [];
  // births b = base + n * period (n >= 0 when a start is given), each alive for b <= S < b + life
  const base = (start ?? 0) + phase;
  const nHi = Math.floor((S - base) / period);
  let fl = 0;
  for (let n = nHi; n > nHi - Math.ceil(PULSE_LIFE) - 1; n--) {
    if (start !== undefined && n < 0) continue;
    const b = base + n * period;
    if (b > S) continue;
    if (twinkle) fl = Math.max(fl, uplinkFlash(S - b) * clamp01(on));
    const u = (S - b) / life;
    if (u >= 1 || !ringsOn) continue;
    const grow = easeOutCubic(u);
    const rad = ring0 * (1 + (reach - 1) * grow);
    // thins as it spreads; leaves the dot's edge at full strength, bleeds away
    const sw = ring0 * lerp(0.48, 0.2, grow);
    const op = 0.85 * (1 - smoothstep(u)) * clamp01(on);
    if (op < 0.004) continue;
    rings.push(
      <circle
        key={n}
        cx={x.toFixed(3)}
        cy={y.toFixed(3)}
        r={rad.toFixed(3)}
        fill="none"
        stroke={RED_HI}
        strokeWidth={sw.toFixed(3)}
        opacity={op.toFixed(4)}
        style={{ filter: worldBlur(1.6 * grow, k) }}
      />,
    );
  }
  const g = easeOutCubic(clamp01(dotGrow));
  const dr = r0 * g * (1 + FLASH_SWELL * fl);
  return (
    <g>
      {rings}
      {dot && dr > 0.01 ? <circle cx={x.toFixed(3)} cy={y.toFixed(3)} r={dr.toFixed(3)} fill={fl > 0.004 ? mixHex(color, RED_HI, fl) : color} /> : null}
    </g>
  );
};
