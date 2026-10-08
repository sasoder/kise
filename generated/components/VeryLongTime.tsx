// ---------------------------------------------------------------------------
// VeryLongTime: a quick map cut of the clip "Sheppard: centralized empires fell
// fast" (Dwarkesh with Si Sheppard). Dwarkesh map style. 1080x1920, 24 fps,
// opaque. It follows a still of Geronimo (1887 photograph).
//
// LINE (sequence 3.045-5.672 s): "(...other native forces who) resist European
// powers for a very long time."
// DURATION = round(2.627 s x 24) = 63 frames (the edit fixes it).
// CHECK LINE: "Geronimo's people, the Apache, held their country against
// outside powers for nearly three centuries - until 1886."
//
// CLIP RULE: ORANGE = the Apache country, the thing that holds. The pressure on
// it and the year are neutral cream.
//
// ONE CONTINUOUS MOTION (words: resist f2, European f14, powers f29, very f47,
// long f51, time f56):
//   f0      established: the Southwest and northern Mexico, the Apacheria in
//           orange hatch with a dashed orange edge at the frame's true centre,
//           APACHE inside it (it identifies), the YEAR above it: a clean 1600
//           for two frames, then it starts to turn.
//   f0-63   PRESSURE, to the last frame: cream fronts (three arcs each: 5 px
//           lead, 3 and 2 px behind) advance on the country and break on its
//           edge at f8, f16, f24, f31, f39, f46, f53, f60, from the south (New
//           Spain) first, then also the north-east and south-east, the last two
//           from the south-west and the north-east. Each flattens against the
//           dashed border and fades over 8 f; the edge gives 12 px there and
//           eases back. The orange never gives. A slow push-in (5 %).
//   f2-48   the count runs (fastest ~f27: real numerals streaming, lightly
//           blurred) and settles on 1886 by f48, before "long" f51.
//   f48-63  resolved and alive: 1886 holds while two more fronts break on the
//           unmoved country; a faint highlight travels the hatch.
//
// FACTS
//   Geronimo surrendered at Skeleton Canyon, Arizona Territory, on 4 September
//   1886 (firm). The count starts at the ROUND year 1600: APPROXIMATE - Spanish-
//   Apache hostilities date from the first years of the New Mexico colony
//   (founded 1598). The orange blob is a SCHEMATIC, approximate historical
//   range of the Apache peoples (south-eastern Arizona, most of New Mexico, far
//   west Texas, northern Sonora and Chihuahua), not a surveyed boundary, and it
//   is held constant: the picture does not show the range changing. The fronts'
//   directions are gestures (New Spain / Mexico from the south, later Comanche
//   and United States pressure from the east and north), not campaigns.
//   Land: Natural Earth 10m; no borders, no rivers.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  APACHERIA,
  APACHERIA_C,
  DARK,
  INK,
  INK_CONTEXT,
  INK_FULL,
  MapLabel,
  MapPage,
  OrangeCountry,
  WorldSvg,
  YearOdometer,
  clamp01,
  smoothstep,
  swayCam,
  type Cam,
  type P2,
} from "./apacheShared";

export const FPS = 24;
export const DURATION = 63; // round(2.627 s x 24)

export const schema = z.object({ vignette: z.number().min(0).max(1) });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---------------------------------------------------------------------------
// The count: a clean 1600 for two frames, then it eases in, runs (peak ~f27)
// and settles on 1886 by f48. Its speed profile is integrated into a table.
// ---------------------------------------------------------------------------
const Y0 = 1600;
const Y1 = 1886;
const COUNT_START = 2;
const COUNT_END = 48;
const speedShape = (t: number) => {
  if (t <= 0 || t >= 1) return 0;
  const PEAK = 0.5;
  if (t < PEAK) return smoothstep(t / PEAK);
  return Math.pow((1 - t) / (1 - PEAK), 1.7);
};
const SUB = 16;
const N_SUB = (COUNT_END - COUNT_START) * SUB;
const SHAPE_SUM = (() => {
  let acc = 0;
  for (let i = 0; i < N_SUB; i++) acc += speedShape((i + 0.5) / N_SUB) / SUB;
  return acc;
})();
/** years per frame at frame f */
const speedAt = (f: number) => ((Y1 - Y0) * speedShape((f - COUNT_START) / (COUNT_END - COUNT_START))) / SHAPE_SUM;
const integrate = (speed: (f: number) => number) => {
  const out = [0];
  for (let i = 0; i < N_SUB; i++) out.push(out[i] + speed(COUNT_START + (i + 0.5) / SUB) / SUB);
  return out;
};
const lookup = (table: number[], f: number) => {
  if (f <= COUNT_START) return 0;
  if (f >= COUNT_END) return table[N_SUB];
  const p = (f - COUNT_START) * SUB;
  const i = Math.floor(p);
  return table[i] + (table[i + 1] - table[i]) * (p - i);
};
const YEAR_TABLE = integrate(speedAt);
export const yearAt = (f: number) => Y0 + lookup(YEAR_TABLE, f);

// THE WHEELS. A wheel that ran at its true speed would be a smear (the units
// wheel peaks at ~11 digits a frame), so the two fast wheels are shown as real
// numerals streaming through the window at a CAPPED speed: wherever a wheel's
// true speed is under the cap it turns truly (the first frames and the settle:
// 1600 and 1886 are exact), above it the numerals stream at the cap. The cap is
// set so the capped travel differs from the true travel by whole turns (no
// jump anywhere). So in mid-run the last two digits are a count's blur, not a
// year to be read; the hundreds wheel is true (it turns 6 -> 7 -> 8 over the
// thirty-five years after 1700 and 1800).
const cappedWheel = (trueSpeed: (f: number) => number, capMax: number, endDigit: number) => {
  const travel = (cap: number) => integrate((f) => Math.min(trueSpeed(f), cap))[N_SUB];
  // the largest travel <= travel(capMax) that ends on endDigit having started on 0
  const top = travel(capMax);
  const target = endDigit + 10 * Math.floor((top - endDigit) / 10);
  let lo = 0;
  let hi = capMax;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (travel(mid) < target) lo = mid;
    else hi = mid;
  }
  const cap = hi;
  return { cap, table: integrate((f) => Math.min(trueSpeed(f), cap)) };
};
export const UNITS = cappedWheel(speedAt, 0.46, Y1 % 10);
export const TENS = cappedWheel((f) => speedAt(f) / 10, 0.4, Math.floor(Y1 / 10) % 10);
export const columnsAt = (f: number) => {
  const y = yearAt(f);
  const century = Math.floor(y / 100);
  const hundreds = century > 16 ? century - 1 + smoothstep((y - century * 100) / 35) : century;
  return [lookup(UNITS.table, f) % 10, lookup(TENS.table, f) % 10, hundreds % 10, 1];
};

// ---------------------------------------------------------------------------
// The camera: one slow push-in on the country
// ---------------------------------------------------------------------------
export const cameraAt = (f: number): Cam => ({ k: 1 + 0.05 * (f / DURATION), cx: 540, cy: 960 });

// ---------------------------------------------------------------------------
// The fronts: compass bearing they come FROM, the frame they meet the edge,
// speed (px / frame), length (px), bow. Each starts inside the frame (its
// whole arc >= ~60 px from every frame edge) and clear of the year.
// ---------------------------------------------------------------------------
type Front = { from: number; hit: number; v: number; len: number; bow: number };
export const FRONTS: Front[] = [
  { from: 182, hit: 8, v: 15, len: 500, bow: 0.12 },
  { from: 150, hit: 16, v: 13, len: 400, bow: 0.1 },
  { from: 64, hit: 24, v: 9, len: 380, bow: 0.07 },
  { from: 200, hit: 31, v: 13, len: 480, bow: 0.1 },
  { from: 128, hit: 39, v: 10, len: 400, bow: 0.08 },
  { from: 172, hit: 46, v: 13, len: 460, bow: 0.12 },
  { from: 218, hit: 53, v: 10, len: 400, bow: 0.08 },
  { from: 66, hit: 60, v: 9, len: 380, bow: 0.07 },
];
const LEAD_MAX = 20; // frames a front is on its way, at most
const FADE_IN = 4;
const BREAK_F = 8; // frames: the front flattens on the edge and fades
const GAP = 17; // px between a front's arcs
const FLEX_PX = 12;
const FLEX_F = 15;
const dirOf = (deg: number): P2 => [Math.sin((deg * Math.PI) / 180), -Math.cos((deg * Math.PI) / 180)];
const angOf = (p: P2) => Math.atan2(p[0] - APACHERIA_C[0], -(p[1] - APACHERIA_C[1]));
/** the edge's distance from the centroid along a bearing */
const edgeAt = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  let best = APACHERIA[0];
  let bd = Infinity;
  for (const p of APACHERIA) {
    let d = Math.abs(angOf(p) - a);
    if (d > Math.PI) d = 2 * Math.PI - d;
    if (d < bd) [bd, best] = [d, p];
  }
  return Math.hypot(best[0] - APACHERIA_C[0], best[1] - APACHERIA_C[1]);
};
export const EDGE = FRONTS.map((fr) => edgeAt(fr.from));
/** arc j of a front whose lead arc is at distance d from the centroid (world px) */
const arcPts = (fr: Front, d: number, j: number, gap: number, bowK: number): P2[] => {
  const dir = dirOf(fr.from);
  const perp: P2 = [-dir[1], dir[0]];
  const half = (fr.len / 2) * (1 - 0.16 * j);
  const out: P2[] = [];
  for (let q = -14; q <= 14; q++) {
    const u = q / 14;
    const along = d + j * gap + fr.bow * bowK * fr.len * u * u;
    out.push([APACHERIA_C[0] + dir[0] * along + perp[0] * u * half, APACHERIA_C[1] + dir[1] * along + perp[1] * u * half]);
  }
  return out;
};
// the frame (world px, the tightest camera) less a margin, and the year's box
const SAFE = { x0: 85, x1: 995, y0: 85, y1: 1835 };
const YEAR_BOX = { x0: 380, x1: 700, y0: 430, y1: 630 };
/** how many frames before its hit each front starts: as far out as its whole body stays in the safe frame */
export const LEADS = FRONTS.map((fr, i) => {
  let lead = 0;
  for (let n = 1; n <= LEAD_MAX; n++) {
    const d = EDGE[i] + fr.v * n;
    const ok = [0, 1, 2].every((j) =>
      arcPts(fr, d, j, GAP, 1).every(
        ([x, y]) => x > SAFE.x0 && x < SAFE.x1 && y > SAFE.y0 && y < SAFE.y1 && !(x > YEAR_BOX.x0 && x < YEAR_BOX.x1 && y > YEAR_BOX.y0 && y < YEAR_BOX.y1),
      ),
    );
    if (!ok) break;
    lead = n;
  }
  return lead;
});

const VeryLongTime: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(cameraAt(frame), frame);
  const k = cam.k;

  // the edge gives where a front breaks and comes back (one eased pulse each)
  const pulse = (fr: Front) => {
    const t = (frame - (fr.hit - 1)) / FLEX_F;
    if (t <= 0 || t >= 1) return 0;
    const sn = Math.sin(Math.PI * Math.pow(t, 0.7));
    return FLEX_PX * sn * sn;
  };
  const ring: P2[] = APACHERIA.map((p) => {
    const a = angOf(p);
    let push = 0;
    FRONTS.forEach((fr, i) => {
      const amp = pulse(fr);
      if (amp <= 0) return;
      let d = Math.abs(a - (fr.from * Math.PI) / 180);
      if (d > Math.PI) d = 2 * Math.PI - d;
      push += amp * Math.exp(-Math.pow(d / (0.55 * (fr.len / EDGE[i])), 2));
    });
    if (push < 0.01) return p;
    const r = Math.hypot(p[0] - APACHERIA_C[0], p[1] - APACHERIA_C[1]);
    return [p[0] - ((p[0] - APACHERIA_C[0]) / r) * push, p[1] - ((p[1] - APACHERIA_C[1]) / r) * push] as P2;
  });

  const fronts: React.ReactNode[] = [];
  FRONTS.forEach((fr, i) => {
    const t0 = fr.hit - LEADS[i];
    if (frame < t0 || frame > fr.hit + BREAK_F) return;
    const broke = clamp01((frame - fr.hit) / BREAK_F);
    // it runs in, meets the edge (4 px outside the dashes), rides the edge as it gives, flattens and fades
    const d = frame <= fr.hit ? EDGE[i] + 5 + fr.v * (fr.hit - frame) : EDGE[i] + 5 - pulse(fr);
    const near = smoothstep((frame - (fr.hit - 5)) / 7);
    const bowK = 1 - 0.85 * near;
    const gap = GAP * (1 - 0.55 * smoothstep(broke * 1.4));
    const op = smoothstep((frame - t0 + 0.5) / FADE_IN) * (1 - smoothstep(broke));
    if (op <= 0.01) return;
    [2, 1, 0].forEach((j) => {
      const dd = `M${arcPts(fr, d, j, gap, bowK)
        .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
        .join("L")}`;
      const w = [5, 3, 2][j];
      fronts.push(
        <g key={`fr${i}-${j}`} fill="none" strokeLinecap="round" opacity={op}>
          <path d={dd} stroke={DARK} strokeOpacity={0.55} strokeWidth={(w + 3) / k} />
          <path d={dd} stroke={INK} strokeOpacity={j === 0 ? INK_FULL : INK_CONTEXT} strokeWidth={w / k} />
        </g>,
      );
    });
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#1B2226" }}>
      <MapPage cam={cam} vignette={vignette}>
        <WorldSvg cam={cam}>
          <OrangeCountry ring={ring} cam={cam} highlight={clamp01((((frame + 18) % 72) + 72) % 72 / 72)} />
          {/* the fronts never enter the country: clipped to everything outside its edge */}
          <defs>
            <clipPath id="apOutside">
              <path clipRule="evenodd" d={`M-300,-300H1400V2300H-300Z M${ring.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}Z`} />
            </clipPath>
          </defs>
          <g clipPath="url(#apOutside)">{fronts}</g>
        </WorldSvg>
        <MapLabel text="APACHE" x={APACHERIA_C[0] + 14} y={APACHERIA_C[1] - 40} cam={cam} frame={frame} f0={-40} size={66} spacing={0.42} />
        <YearOdometer frame={frame} yearAt={yearAt} columnsAt={columnsAt} maxBlur={6} samples={1} x={540} top={452} size={130} />
      </MapPage>
    </AbsoluteFill>
  );
};

export default VeryLongTime;
