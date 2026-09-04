import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:19.559 -> 00:00:27.579 of the source cut. round(8.020 * 30).
export const DURATION = 241;

// ---------------------------------------------------------------------------
// One block of code and its reflection. The same scan runs through both and
// finds the same four things in the same places; the only difference is what
// happens to what it found. Nothing is labelled — the mirror is the argument.
// ---------------------------------------------------------------------------
const CX = 540;
const MIRROR_Y = 960;
const BLOCK_W = 660;
const BLOCK_X = CX - BLOCK_W / 2;
// Equal air either side of the mirror line, so neither block reads as primary
// by position.
const GAP = 120;

const LINE_H = 40;
const GROUP_GAP = 22;
const BAR_H = 12;
const INDENT = 44;
const GROUPS = [3, 4, 2, 3];

const HOLE_W = 54;
// A vulnerability is drawn as a fracture, not a gap: the two halves of the line
// shear apart. Nothing else in the block steps off its baseline, so damage can
// never be mistaken for ordinary raggedness. Half of this is the clearance to
// the neighbouring line, so the tear never collides with it.
const STEP = 14;
// Where the extracted fragments come to rest, in block-local x. Outside the
// block, inside the 80px safe margin.
const TAKEN_X = -90;

// Stable per-bar scatter: same shape every frame and every render.
const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

type Bar = {x: number; y: number; w: number; flaw: number};

// Which lines carry a vulnerability, and where along each line it sits.
const FLAW_LINES = [1, 4, 7, 10];
const FLAW_FRAC = [0.58, 0.36, 0.64, 0.44];

const laidOut = (() => {
  const bars: Bar[] = [];
  let y = 0;
  let i = 0;
  GROUPS.forEach((lines) => {
    for (let l = 0; l < lines; l++) {
      const last = l === lines - 1;
      // Level 0 opens the block, the body sits one or two levels in, and a
      // multi-line group closes back out. Reads as code without drawing a glyph.
      const level = l === 0 ? 0 : last && lines > 2 ? 1 : hash(i, 1) > 0.72 ? 2 : 1;
      const x = level * INDENT;
      const room = BLOCK_W - x;
      const w = room * (level === 0 ? 0.55 + hash(i, 2) * 0.3 : 0.34 + hash(i, 3) * 0.44);
      bars.push({x, y, w, flaw: FLAW_LINES.indexOf(i)});
      y += LINE_H;
      i++;
    }
    y += GROUP_GAP;
  });
  const blockH = bars[bars.length - 1].y + BAR_H;
  return {bars, blockH};
})();

const BARS = laidOut.bars;
const BLOCK_H = laidOut.blockH;
const BLOCK_TOP = MIRROR_Y - GAP - BLOCK_H;

// Centre of each hole in block-local coordinates.
const FLAWS = FLAW_LINES.map((line, k) => {
  const bar = BARS[line];
  const room = HOLE_W / 2 + 26;
  const cx = Math.min(Math.max(bar.x + FLAW_FRAC[k] * bar.w, bar.x + room), bar.x + bar.w - room);
  return {line, cx, cy: bar.y + BAR_H / 2};
});

const ease = {
  out: Easing.out(Easing.cubic),
  pop: Easing.bezier(0.2, 1.5, 0.4, 1),
};

const ramp = (
  frame: number,
  range: [number, number],
  out: [number, number],
  easing: (n: number) => number = ease.out,
) =>
  interpolate(frame, range, out, {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  // Three states, in order: unknown -> read -> understood.
  unknownOpacity: z.number().min(0).max(1),
  readOpacity: z.number().min(0).max(1),
  // The reflection is present the whole time, but only as an afterimage until
  // it is asked the same question.
  ghostOpacity: z.number().min(0).max(1),
  mirrorOpacity: z.number().min(0).max(1),
  // Beat frames from the SRT at 30fps, relative to 00:00:19.559:
  //   0 "when they" · 12 "took some" · 27 "code that" · 47 "had some"
  //   54 "vulnerabilities" · 86 "told fable" · 114 "hey here's"
  //   141 "make sure" · 176 "patched all the" · 187 "vulnerabilities"
  //   205 "can you" · 210 "just help me" · 221 "identify the"
  //   232 "vulnerabilities" (ends 241)
  beats: z.object({
    enter: z.number().int(),
    read: z.number().int(),
    flaw: z.number().int(),
    scan: z.number().int(),
    scanEnd: z.number().int(),
    patch: z.number().int(),
    wake: z.number().int(),
    mirrorScan: z.number().int(),
    mirrorScanEnd: z.number().int(),
    breach: z.number().int(),
  }),
});

export type DualUseMirrorScanProps = z.infer<typeof schema>;

export const defaultProps: DualUseMirrorScanProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#C15F3C',
  shadow: 'rgba(0, 0, 0, 0.28)',
  unknownOpacity: 0.1,
  readOpacity: 0.85,
  ghostOpacity: 0.09,
  mirrorOpacity: 0.62,
  beats: {
    enter: 5,
    read: 27,
    flaw: 47,
    scan: 86,
    scanEnd: 150,
    patch: 176,
    wake: 190,
    mirrorScan: 202,
    mirrorScanEnd: 224,
    breach: 229,
  },
});

type FlawState = {
  found: number;
  patch: number;
  grab: number;
  taken: number;
  hole: number;
  step: number;
  markerGap: number;
};

const Block: React.FC<{
  ink: string;
  accent: string;
  barOpacity: number;
  enterStart: number;
  front: number | null;
  frontOpacity: number;
  flaws: FlawState[];
  frame: number;
}> = ({ink, accent, barOpacity, enterStart, front, frontOpacity, flaws, frame}) => (
  <g>
    {BARS.map((bar, i) => {
      const enter = ramp(frame, [enterStart + i * 1.6, enterStart + i * 1.6 + 13], [0, 1]);
      if (enter <= 0) return null;
      const state = bar.flaw >= 0 ? flaws[bar.flaw] : null;
      const gap = state ? HOLE_W * state.hole : 0;
      const step = state ? state.step : 0;
      const flaw = state ? FLAWS[bar.flaw] : null;
      const w = bar.w * enter;
      const o = barOpacity * enter;

      // Below a hair's width the line is drawn whole, so a repaired line is
      // genuinely continuous rather than a seam.
      if (!flaw || (gap < 1 && step < 0.5)) {
        return (
          <rect key={i} x={bar.x} y={bar.y} width={w} height={BAR_H} rx={BAR_H / 2} fill={ink} opacity={o} />
        );
      }
      const left = flaw.cx - gap / 2;
      const right = flaw.cx + gap / 2;
      return (
        <g key={i} opacity={o}>
          <rect
            x={bar.x}
            y={bar.y - step / 2}
            width={Math.max(left - bar.x, 0)}
            height={BAR_H}
            rx={BAR_H / 2}
            fill={ink}
          />
          <rect
            x={right}
            y={bar.y + step / 2}
            width={Math.max(bar.x + w - right, 0)}
            height={BAR_H}
            rx={BAR_H / 2}
            fill={ink}
          />
        </g>
      );
    })}

    {FLAWS.map((flaw, k) => {
      const s = flaws[k];
      if (s.found <= 0) return null;
      // The finding: a piece the size of the hole it was found in. Above, it is
      // welded in. Below, the identical piece is carried out. Same object.
      const mw = s.markerGap + 12;
      const mh = BAR_H + 12 + s.step;
      const dx = s.taken * (TAKEN_X - flaw.cx);
      const fill = Math.max(s.patch, s.grab);
      return (
        <g key={k} transform={`translate(${dx}, 0)`}>
          {fill > 0 ? (
            <rect
              x={flaw.cx - (HOLE_W * fill) / 2}
              y={flaw.cy - BAR_H / 2}
              width={HOLE_W * fill}
              height={BAR_H}
              rx={BAR_H / 2}
              fill={accent}
            />
          ) : null}
          <rect
            x={flaw.cx - mw / 2}
            y={flaw.cy - mh / 2}
            width={mw * s.found}
            height={mh}
            rx={4}
            fill="none"
            stroke={accent}
            strokeWidth={3}
            opacity={s.found * (1 - s.patch)}
          />
        </g>
      );
    })}

    {front === null ? null : (
      <g opacity={frontOpacity}>
        <rect x={-16} y={front - 1.5} width={BLOCK_W + 32} height={3} fill={accent} />
        <circle cx={-16} cy={front} r={4.5} fill={accent} />
        <circle cx={BLOCK_W + 16} cy={front} r={4.5} fill={accent} />
      </g>
    )}
  </g>
);

const DualUseMirrorScan: React.FC<DualUseMirrorScanProps> = ({
  ink,
  accent,
  shadow,
  unknownOpacity,
  readOpacity,
  ghostOpacity,
  mirrorOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // The wavefront travels the block at a constant rate; the frame it reaches a
  // given y is solved from the same mapping, so a marker can never drift off
  // its own scan line if the beats are retimed.
  const sweep = (start: number, end: number) => {
    const p = interpolate(frame, [start, end], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const active = frame >= start - 1 && frame <= end + 6;
    return {
      y: active ? -16 + p * (BLOCK_H + 32) : null,
      opacity: ramp(frame, [start, start + 5], [0, 1]) * ramp(frame, [end - 5, end + 3], [1, 0]),
      at: (y: number) => start + (end - start) * ((y + 16) / (BLOCK_H + 32)),
    };
  };

  const top = sweep(beats.scan, beats.scanEnd);
  const mirror = sweep(beats.mirrorScan, beats.mirrorScanEnd);

  const holeOpen = (k: number) => ramp(frame, [beats.flaw + k * 5, beats.flaw + k * 5 + 12], [0, 1]);

  const topFlaws: FlawState[] = FLAWS.map((flaw, k) => {
    const t = top.at(flaw.cy);
    const patch = ramp(frame, [beats.patch + k * 5, beats.patch + k * 5 + 15], [0, 1]);
    const open = holeOpen(k);
    return {
      found: ramp(frame, [t, t + 8], [0, 1], ease.pop),
      patch,
      grab: 0,
      taken: 0,
      // The patch pulls the fracture back into line as it fills, so the line
      // ends up straight and continuous with an accent segment in it.
      hole: open * (1 - patch),
      step: STEP * open * (1 - patch),
      markerGap: HOLE_W * open,
    };
  });

  const mirrorFlaws: FlawState[] = FLAWS.map((flaw, k) => {
    const t = mirror.at(flaw.cy);
    // One simultaneous move under the last word: the piece that was welded in
    // above is taken instead, and the hole behind it tears wider than the one
    // it filled. No stagger — it should read as a single consequence.
    const grab = ramp(frame, [beats.breach, beats.breach + 5], [0, 1]);
    const taken = ramp(frame, [beats.breach + 3, beats.breach + 12], [0, 1]);
    const open = holeOpen(k);
    return {
      found: ramp(frame, [t, t + 6], [0, 1], ease.pop),
      patch: 0,
      grab,
      taken,
      hole: open * (1 + taken * 1.6),
      step: STEP * open * (1 + taken * 0.5),
      markerGap: HOLE_W * open,
    };
  });

  const topInk = interpolate(
    frame,
    [beats.read, beats.read + 16],
    [unknownOpacity, readOpacity],
    {easing: ease.out, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const mirrorInk = ramp(frame, [beats.wake, beats.wake + 18], [ghostOpacity, mirrorOpacity]);
  const axis = ramp(frame, [beats.read, beats.read + 18], [0, 1]);

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* Snapped to a half pixel with an odd stroke, or it shimmers. */}
          <line
            x1={CX - (BLOCK_W / 2 + 60) * axis}
            x2={CX + (BLOCK_W / 2 + 60) * axis}
            y1={MIRROR_Y + 0.5}
            y2={MIRROR_Y + 0.5}
            stroke={ink}
            strokeWidth={1}
            opacity={0.16 * axis}
          />

          <g transform={`translate(${BLOCK_X}, ${BLOCK_TOP})`}>
            <Block
              ink={ink}
              accent={accent}
              barOpacity={topInk}
              enterStart={beats.enter}
              front={top.y}
              frontOpacity={top.opacity}
              flaws={topFlaws}
              frame={frame}
            />
          </g>

          {/* The second copy: identical geometry, same orientation, same scan
              direction. A flip would read as different code; only a literal
              duplicate makes the line-by-line comparison automatic. It has been
              on screen, unlit, since the beginning. */}
          <g transform={`translate(${BLOCK_X}, ${MIRROR_Y + GAP})`}>
            <Block
              ink={ink}
              accent={accent}
              barOpacity={mirrorInk}
              enterStart={beats.enter + 4}
              front={mirror.y}
              frontOpacity={mirror.opacity}
              flaws={mirrorFlaws}
              frame={frame}
            />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default DualUseMirrorScan;
