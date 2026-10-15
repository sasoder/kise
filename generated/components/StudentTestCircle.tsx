import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";

/**
 * StudentTestCircle — a transparent 1080x1920 overlay (24000/1001 fps, 64 frames) that circles the curved words
 * "Student 't' test" along the bottom of the Gosset plaque at the Guinness Storehouse (Will, "Guinness invented the
 * t-test", Cheeky Pint S4E02). House orange-marker style, same pen as BiofilmCircle.tsx.
 *
 * Check line: "those little words on the plaque are the 'Student' in Student's t-test".
 * Spoken (frames from this overlay's start = the plaque's first frame): "that's why it's called the" f0-12,
 * "students'" f12-19, "t-test" f21-30, "still to this day" f30+. The plaque cuts away at f48; the overlay runs 16
 * frames past it as handle.
 *
 * Motion: one quick pen circle in house orange #FFB000 (dark casing, light core glint), started at the upper left,
 * travelling clockwise once at an eased speed (pen down at f10, closed with its overshoot at f22, as he says
 * "t-test") and overshooting its own start by 12 % of the loop so the ends cross. Then it only lives: one faint
 * highlight travels round slowly and the ring breathes by under 1 px. The wobble is seeded and fixed, it never boils.
 *
 * Geometry: the photo (1500x2000) sits at Scale 96 %, centred, so frame_px = image_px * 0.96 + (-180, 0). The text
 * runs on a circle (fitted to its baseline: centre 532, 924, radius 545 frame px). OUTLINE is the convex hull of the
 * measured glyph pixels taken in that circle's (arc length, radius) space, so the hull is a straight band there and
 * a banana (smile) here. The ring is that hull grown by `air` px in arc space (plus END_AIR at the two ends),
 * resampled, softened and mapped back: its centre line keeps 22-43 px from the nearest glyph pixel (most of it
 * 25-30). Glyphs span x 296-807, y 1372-1468; the ring's centre line sits about x 269-833, y 1350-1497, clear of
 * "Chief Brewer" (y ~1080-1160). No facts or figures are shown.
 */

export const FPS = 24000 / 1001;
export const DURATION = 64;

export const schema = z.object({
  air: z.number(),
  core: z.number(),
  casing: z.number(),
});
export type StudentTestCircleProps = z.infer<typeof schema>;
export const defaultProps: StudentTestCircleProps = schema.parse({ air: 25, core: 7, casing: 1.5 });

const ORANGE = "#FFB000";
const DARK = "#17120D";
const LIGHT = "#FFE3A0";

type Pt = [number, number];

// The circle the lettering runs on (frame px).
const CX = 532;
const CY = 924;
const R0 = 545;

// Convex hull (in arc space) of the measured glyph pixels of "Student 't' test", frame px.
const OUTLINE: Pt[] = [
  [298, 1411],
  [315, 1378],
  [321, 1374],
  [331, 1373],
  [603, 1412],
  [650, 1406],
  [695, 1400],
  [762, 1384],
  [786, 1380],
  [803, 1393],
  [804, 1397],
  [801, 1408],
  [742, 1435],
  [351, 1437],
  [314, 1421],
];

const M = 300; // samples round the loop
const OVERSHOOT = 0.12;
const TOTAL = 1 + OVERSHOOT;
const DRAW_START = 9; // pen touches down just after f9
const DRAW_FRAMES = 13; // closed (with overshoot) at f22
const DRAW_END = DRAW_START + DRAW_FRAMES;
const LAP = 40;
const BREATHE_PX = 0.8;
const END_AIR = 12; // extra air along the lettering at the two ends, where the softening pulls the loop in
const SMOOTH_PASSES = 30;

const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

// (x, y) frame px <-> (s, d): s = arc length along the lettering circle (left to right), d = radial offset (down/out).
const toArc = ([x, y]: Pt): Pt => {
  const th = Math.atan2(y - CY, x - CX);
  return [(Math.PI / 2 - th) * R0, Math.hypot(x - CX, y - CY) - R0];
};
const toFrame = ([s, d]: Pt): Pt => {
  const th = Math.PI / 2 - s / R0;
  const r = R0 + d;
  return [CX + r * Math.cos(th), CY + r * Math.sin(th)];
};

/** The closed centre line: the outline's offset curve in arc space (support point + air along each direction, the
 *  hull grown by `air`), resampled evenly by length, softened, then mapped back to the frame. Index 0 is the upper
 *  left and the order is clockwise on screen. */
const buildLoop = (air: number): Pt[] => {
  const arc = OUTLINE.map(toArc);
  const raw: Pt[] = [];
  const steps = 720;
  for (let i = 0; i < steps; i++) {
    const phi = (-135 * Math.PI) / 180 + (i / steps) * Math.PI * 2;
    const dx = Math.cos(phi);
    const dy = Math.sin(phi);
    let best = arc[0];
    let bestDot = -Infinity;
    for (const p of arc) {
      const d = p[0] * dx + p[1] * dy;
      if (d > bestDot) {
        bestDot = d;
        best = p;
      }
    }
    raw.push([best[0] + dx * (air + END_AIR * Math.abs(dx)), best[1] + dy * air]);
  }
  // even resample by arc length (the support points jump across hull edges, so this fills them in)
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
  for (let pass = 0; pass < SMOOTH_PASSES; pass++) {
    even = even.map((p, i) => {
      const a = even[(i + M - 1) % M];
      const b = even[(i + 1) % M];
      return [p[0] * 0.5 + (a[0] + b[0]) * 0.25, p[1] * 0.5 + (a[1] + b[1]) * 0.25] as Pt;
    });
  }
  return even.map(toFrame);
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

const StudentTestCircle: React.FC<StudentTestCircleProps> = ({ air, core, casing }) => {
  const frame = useCurrentFrame();
  const pts = React.useMemo(() => buildStroke(air), [air]);
  const n = pts.length - 1;

  const t = Math.min(1, Math.max(0, (frame - DRAW_START) / DRAW_FRAMES));
  const drawn = ((1 - Math.cos(Math.PI * t)) / 2) * n; // in segments

  const { centre, reach } = React.useMemo(() => {
    let x = 0;
    let y = 0;
    for (const p of pts) {
      x += p[0];
      y += p[1];
    }
    const c: Pt = [x / pts.length, y / pts.length];
    let r = 1;
    for (const p of pts) r = Math.max(r, Math.hypot(p[0] - c[0], p[1] - c[1]));
    return { centre: c, reach: r };
  }, [pts]);
  // under 1 px at the far ends of the banana
  const breathe = 1 + (BREATHE_PX / reach) * smooth((frame - DRAW_END) / 12) * Math.sin(((frame - DRAW_END) / 34) * Math.PI * 2);

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
        <g transform={`translate(${centre[0]} ${centre[1]}) scale(${breathe.toFixed(6)}) translate(${-centre[0]} ${-centre[1]})`}>
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

export default StudentTestCircle;
