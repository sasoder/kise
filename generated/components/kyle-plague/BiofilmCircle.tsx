import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";

/**
 * BiofilmCircle — a transparent 1080x1920 overlay (30000/1001 fps, 55 frames) that circles the plague mass in
 * the editor's microscope photo of a blocked flea.
 *
 * Check line: "that dark plug in the flea's gut is the biofilm he means."
 * Spoken line: "It forms this biofilm in the gut of the flea" ("biofilm" at 14.00 s; the marker clip runs
 * 14.147-15.782 s = 49 frames, so frame 0 of this overlay is 14.147 s and the word has just been said).
 *
 * Motion: one quick pen circle in house orange, started at the upper left, travelling clockwise once at an eased
 * speed (about 13 % drawn on frame 0, closed by frame 12) and overshooting its own start by 12 % of the loop so the
 * ends cross. Then it only lives: a faint highlight travels once round every 40 frames and the ring breathes by
 * under 1 px. The line's wobble is seeded and fixed, it never boils.
 *
 * Geometry: the ring is the editor's hand-traced outline of the mass (frame pixels, photo at 34.8875 % centred on
 * 593.9, 960), its convex hull pushed out by AIR px and smoothed. No facts or figures are shown.
 */

export const FPS = 30000 / 1001;
export const DURATION = 55;

export const schema = z.object({
  air: z.number(),
  core: z.number(),
  casing: z.number(),
});
export type BiofilmCircleProps = z.infer<typeof schema>;
export const defaultProps: BiofilmCircleProps = schema.parse({ air: 20, core: 7, casing: 1.5 });

const ORANGE = "#FFB000";
const DARK = "#17120D";
const LIGHT = "#FFE3A0";

type Pt = [number, number];
const OUTLINE: Pt[] = [
  [609, 845],
  [629, 911],
  [678, 934],
  [735, 952],
  [744, 954],
  [698, 834],
  [644, 768],
  [601, 757],
  [552, 764],
  [540, 765],
];

const M = 240; // samples round the loop
const OVERSHOOT = 0.12;
const TOTAL = 1 + OVERSHOOT;
const DRAW_LEAD = 3.5; // frames of drawing that happened before the cut
const DRAW_FRAMES = 15;
const DRAW_END = DRAW_FRAMES - DRAW_LEAD;
const LAP = 40;

const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** The closed centre line: the outline's offset curve (support point + air along each normal direction, which is
 *  the convex hull grown by `air`), resampled evenly by length and softened into an organic oval. Index 0 is the
 *  upper left and the order is clockwise on screen. */
const buildLoop = (air: number): Pt[] => {
  const raw: Pt[] = [];
  const steps = 720;
  for (let i = 0; i < steps; i++) {
    const phi = (-135 * Math.PI) / 180 + (i / steps) * Math.PI * 2;
    const dx = Math.cos(phi);
    const dy = Math.sin(phi);
    let best = OUTLINE[0];
    let bestDot = -Infinity;
    for (const p of OUTLINE) {
      const d = p[0] * dx + p[1] * dy;
      if (d > bestDot) {
        bestDot = d;
        best = p;
      }
    }
    raw.push([best[0] + dx * air, best[1] + dy * air]);
  }
  // even resample by arc length
  const cum: number[] = [0];
  for (let i = 0; i < steps; i++) {
    const a = raw[i];
    const b = raw[(i + 1) % steps];
    cum.push(cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const len = cum[steps];
  let even: Pt[] = [];
  let j = 0;
  for (let i = 0; i < M; i++) {
    const target = (i / M) * len;
    while (cum[j + 1] < target) j++;
    const a = raw[j];
    const b = raw[(j + 1) % steps];
    const seg = cum[j + 1] - cum[j];
    const t = seg > 0 ? (target - cum[j]) / seg : 0;
    even.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  for (let pass = 0; pass < 90; pass++) {
    even = even.map((p, i) => {
      const a = even[(i + M - 1) % M];
      const b = even[(i + 1) % M];
      return [p[0] * 0.5 + (a[0] + b[0]) * 0.25, p[1] * 0.5 + (a[1] + b[1]) * 0.25] as Pt;
    });
  }
  return even;
};

/** The pen stroke: the loop plus the overshoot, pushed off the centre line so the start sits a little outside
 *  and the tail flicks further out across it, with a fixed low wobble. */
const buildStroke = (air: number): Pt[] => {
  const loop = buildLoop(air);
  const n = Math.round(M * TOTAL);
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / M;
    const k = i % M;
    const prev = loop[(k + M - 1) % M];
    const next = loop[(k + 1) % M];
    const tx = next[0] - prev[0];
    const ty = next[1] - prev[1];
    const tl = Math.hypot(tx, ty) || 1;
    const nx = ty / tl;
    const ny = -tx / tl;
    const startOut = 7 * (1 - smooth(s / 0.26));
    const tailOut = 13 * smooth((s - 0.93) / (TOTAL - 0.93));
    const wobble = 1.5 * Math.sin(2 * Math.PI * 3 * s + 1.3) + 0.8 * Math.sin(2 * Math.PI * 7 * s + 4.1) + 0.4 * Math.sin(2 * Math.PI * 13 * s + 0.6);
    const off = startOut + tailOut + wobble;
    pts.push([loop[k][0] + nx * off, loop[k][1] + ny * off]);
  }
  return pts;
};

const widthAt = (s: number) => 0.4 + 0.6 * smooth(s / 0.07) * (0.25 + 0.75 * smooth((TOTAL - s) / 0.09));

const BiofilmCircle: React.FC<BiofilmCircleProps> = ({ air, core, casing }) => {
  const frame = useCurrentFrame();
  const pts = React.useMemo(() => buildStroke(air), [air]);
  const n = pts.length - 1;

  const t = Math.min(1, (frame + DRAW_LEAD) / DRAW_FRAMES);
  const drawn = ((1 - Math.cos(Math.PI * t)) / 2) * n; // in segments

  const centre = React.useMemo(() => {
    let x = 0;
    let y = 0;
    for (const p of pts) {
      x += p[0];
      y += p[1];
    }
    return [x / pts.length, y / pts.length];
  }, [pts]);
  const breathe = 1 + 0.004 * smooth((frame - DRAW_END) / 12) * Math.sin(((frame - DRAW_END) / 34) * Math.PI * 2);

  const segs: { x1: number; y1: number; x2: number; y2: number; w: number; i: number }[] = [];
  for (let i = 0; i < n && i < drawn; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const f = Math.min(1, drawn - i);
    segs.push({ x1: a[0], y1: a[1], x2: a[0] + (b[0] - a[0]) * f, y2: a[1] + (b[1] - a[1]) * f, w: widthAt((i + 0.5) / M), i });
  }
  const split = Math.round(M * 0.9);
  const body = segs.filter((s) => s.i < split);
  const tail = segs.filter((s) => s.i >= split);
  // The tail's casing takes butt ends (all but the pen tip) so it does not notch the body where the two layers join.
  const layer = (list: typeof segs, key: string, buttCasing = false) => (
    <g key={key} strokeLinecap="round">
      {list.map((s, j) => (
        <line
          key={`d${s.i}`}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={DARK}
          strokeWidth={core * s.w + casing * 2}
          strokeLinecap={buttCasing && j < list.length - 1 ? "butt" : "round"}
        />
      ))}
      {list.map((s) => (
        <line key={`o${s.i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={ORANGE} strokeWidth={core * s.w} />
      ))}
    </g>
  );

  // the travelling highlight: picks up where the pen began once the ring has closed
  const hf = frame - DRAW_END;
  const hOn = smooth(hf / 8);
  const hPos = (((hf / LAP) % 1) + 1) % 1;
  const glints = [0.085, 0.065, 0.045, 0.028, 0.014].map((half) => {
    const from = Math.round((hPos - half) * M);
    const to = Math.round((hPos + half) * M);
    const d: string[] = [];
    for (let i = from; i <= to; i++) {
      const k = ((i % M) + M) % M;
      // skip the first samples so the glint rides the settled loop, not the offset start of the stroke
      const p = k < M * 0.12 ? pts[k + M] : pts[k];
      d.push(`${d.length === 0 || k === Math.ceil(M * 0.12) || k === 0 ? "M" : "L"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`);
    }
    return d.join(" ");
  });

  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g transform={`translate(${centre[0]} ${centre[1]}) scale(${breathe.toFixed(5)}) translate(${-centre[0]} ${-centre[1]})`}>
          {layer(body, "body")}
          {layer(tail, "tail", true)}
          {hOn > 0 ? (
            <g fill="none" stroke={LIGHT} strokeWidth={core * 0.42} strokeLinecap="round" strokeLinejoin="round" opacity={hOn}>
              {glints.map((d, i) => (
                <path key={i} d={d} opacity={0.14} />
              ))}
            </g>
          ) : null}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default BiofilmCircle;
