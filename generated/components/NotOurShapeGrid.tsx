import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 24;
// Ajeya "anthropomorphization" cut, 0:00.000 -> 0:07.639. round(7.639 * 24).
export const DURATION = 183;

const CX = 540;
// Captions run along the bottom: the whole crowd lives between y 400 and 1290.
const CY = 835;

const N = 560;
const LINKS = 74;
// Links alive before the count, so the field is already a network at frame 0.
const LINKS_OPEN = 13;

// Deterministic scatter — organic, but identical every frame.
const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// --- The shape it has on its own: many-centred, no head, no middle ---------
const R_IN = 176;
const R_OUT = 452;
const own = Array.from({length: N}, (_, i) => {
  const a = hash(i, 1) * Math.PI * 2;
  const r = Math.sqrt(R_IN * R_IN + (R_OUT * R_OUT - R_IN * R_IN) * hash(i, 2));
  return {
    x: CX + r * Math.cos(a),
    y: CY + r * Math.sin(a) * 0.88,
    a: Math.atan2(r * Math.sin(a) * 0.88, r * Math.cos(a)),
  };
});

// --- The shape we put it in: head and shoulders, the same glyph the human is
// drawn with everywhere else in this edit ------------------------------------
// Bigger, with a real neck gap: the head has to separate from the shoulders
// or the whole thing reads as one bell-shaped mass.
const HEAD = {x: CX, y: 648, r: 132};
const BODY = {x: CX, y: 1274, rx: 252, ry: 474, top: 816, bottom: 1274};
const inHuman = (x: number, y: number) => {
  const dh = (x - HEAD.x) ** 2 + (y - HEAD.y) ** 2 <= HEAD.r ** 2;
  const db =
    y >= BODY.top &&
    y <= BODY.bottom &&
    ((x - BODY.x) / BODY.rx) ** 2 + ((y - BODY.y) / BODY.ry) ** 2 <= 1;
  return dh || db;
};
const humanPts = (() => {
  const pts: {x: number; y: number; a: number}[] = [];
  let i = 0;
  let k = 0;
  while (pts.length < N && k < N * 40) {
    const x = CX - 320 + hash(k, 3) * 640;
    const y = 500 + hash(k, 4) * 800;
    k += 1;
    if (!inHuman(x, y)) {
      continue;
    }
    pts.push({x, y, a: Math.atan2(y - 980, x - CX)});
    i += 1;
  }
  return pts;
})();

// Pair the two configurations by angle so the morph reads as one body being
// pressed into a shape, not as a swarm shuffling.
const orderOwn = own.map((p, i) => i).sort((p, q) => own[p].a - own[q].a);
const orderHuman = humanPts.map((p, i) => i).sort((p, q) => humanPts[p].a - humanPts[q].a);
const target = new Array<{x: number; y: number}>(N);
orderOwn.forEach((oi, rank) => {
  target[oi] = humanPts[orderHuman[rank % humanPts.length]];
});

// Threads between agents — the field is a network before anything happens to
// it, and the count on "a lot of ways" is more of them, not a new device.
const links = (() => {
  const out: {a: number; b: number}[] = [];
  let k = 0;
  while (out.length < LINKS && k < LINKS * 400) {
    const a = Math.floor(hash(k, 5) * N);
    const b = Math.floor(hash(k, 6) * N);
    k += 1;
    if (a === b) {
      continue;
    }
    const d = Math.hypot(own[a].x - own[b].x, own[a].y - own[b].y);
    if (d < 170 || d > 560) {
      continue;
    }
    const da = Math.hypot(own[a].x - CX, own[a].y - CY);
    const db2 = Math.hypot(own[b].x - CX, own[b].y - CY);
    out.push(da <= db2 ? {a, b} : {a: b, b: a});
  }
  return out;
})();

// Our own drives: three threads that leave the human and come back to it.
// Same material as the field's threads — the difference is the topology, which
// is the whole point of the line.
// Once it is out of our shape it settles smaller — close enough to look at.
const SHRINK = 0.76;

// public/magnifying-glass.png: the lens centre sits at 207/512 of the artwork
// and its clear opening is 145/512, so the magnified region is derived from
// the asset rather than guessed.
const GLASS_C = 207 / 512;
const GLASS_HOLE = 145 / 512;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  dotMin: z.number().min(2).max(20),
  dotMax: z.number().min(2).max(28),
  linkWidth: z.number().min(1).max(10),
  glass: z.string(),
  glassSize: z.number().min(200).max(900),
  grid: z.string(),
  gridBlur: z.number().min(0).max(40),
  gridBrightness: z.number().min(0).max(1),
  gridBase: z.string(),
  // Where the camera starts, and how far it ends up pushed into the glass.
  baseZoom: z.number().min(0.5).max(2),
  endZoom: z.number().min(1).max(4),
  humanGlyph: z.string(),
  humanSize: z.number().min(60).max(320),
  // Beat frames from the SRT at 24fps, relative to 00:00:00.000:
  //   12 "actually avoid" · 44 "anthropomorphizing" · 68 "these ais"
  //   82 "because" · 96 "lot of ways in" · 113 "motivations are"
  //   129 "different" · 135 "from ours" · 147 "that are worth"
  //   161 "understanding"
  beats: z.object({
    avoid: z.number().int(),
    anthro: z.number().int(),
    theseAis: z.number().int(),
    because: z.number().int(),
    ways: z.number().int(),
    motivations: z.number().int(),
    different: z.number().int(),
    fromOurs: z.number().int(),
    worth: z.number().int(),
    understanding: z.number().int(),
  }),
});

export type NotOurShapeGridProps = z.infer<typeof schema>;

export const defaultProps: NotOurShapeGridProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.22)',
  dotMin: 6,
  dotMax: 15,
  linkWidth: 4,
  glass: 'magnifying-glass.png',
  glassSize: 340,
  grid: 'grid-background.jpg',
  gridBlur: 13,
  gridBrightness: 0.32,
  gridBase: '#232323',
  baseZoom: 1.12,
  endZoom: 1.9,
  humanGlyph: 'person.png',
  humanSize: 150,
  beats: {
    avoid: 12,
    anthro: 44,
    theseAis: 68,
    because: 82,
    ways: 96,
    motivations: 113,
    different: 129,
    fromOurs: 135,
    worth: 147,
    understanding: 161,
  },
});

const NotOurShapeGrid: React.FC<NotOurShapeGridProps> = ({
  ink,
  accent,
  shadow,
  dotMin,
  dotMax,
  linkWidth,
  glass,
  glassSize,
  grid,
  gridBlur,
  gridBrightness,
  gridBase,
  baseZoom,
  endZoom,
  humanGlyph,
  humanSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();

  // The press into our shape: begins on "actually avoid", complete on the word
  // itself, and it keeps closing after that — conformity deepens.
  const press = interpolate(frame, [beats.avoid + 8, beats.anthro + 1], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const settle = interpolate(frame, [beats.anthro, beats.theseAis], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const strain = interpolate(frame, [beats.theseAis, beats.because], [0, 1], {
    easing: Easing.in(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // "a lot of ways": more threads, staggered — more of what is already there.
  const countIn = (j: number) =>
    j < LINKS_OPEN
      ? interpolate(frame, [0, 14], [0, 1], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : interpolate(
          frame,
          [beats.ways + (j - LINKS_OPEN) * 0.85, beats.ways + (j - LINKS_OPEN) * 0.85 + 13],
          [0, 1],
          {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        );

  // "different from ours": the human takes the void at the centre of their
  // field. One of us; a connected many of them, all around.
  const us = interpolate(frame, [beats.different, beats.different + 11], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // The field recedes while the human comes up, so the ink can exist on it.
  const recede = interpolate(
    frame,
    [beats.different, beats.fromOurs + 6, beats.worth + 6],
    [0, 1, 0.45],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // "worth understanding": the glass comes in from the lower right, settles
  // over the field, and stays. What is under it is magnified; the rest of the
  // field resolves because we are now looking at it.
  const glassIn = interpolate(frame, [beats.worth, beats.worth + 15], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const glassFade = interpolate(frame, [beats.worth, beats.worth + 7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const resolve = interpolate(frame, [beats.worth + 4, beats.understanding + 15], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Where it settles, plus a slow idle so it is never a frozen sticker.
  const LENS = {x: 690, y: 676};
  const lens = {
    x: LENS.x + (1 - glassIn) * 268 + 2.5 * Math.sin(frame / 31),
    y: LENS.y + (1 - glassIn) * 256 + 2.2 * Math.cos(frame / 26),
  };
  const hole = glassSize * GLASS_HOLE;

  // Camera. Authored as its own keyed track with fixed targets — the glass has
  // settled by the time the push starts, so the camera never chases anything.
  // A slow creep runs underneath the whole first section so the grid keeps
  // parallaxing during the holds.
  const k = interpolate(frame, [0, beats.worth + 5, 178], [baseZoom, baseZoom + 0.07, endZoom], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Not the lens dead-on: biased back toward the field so the push does not
  // leave a quarter of the frame as empty grid.
  const camX = interpolate(frame, [beats.worth + 5, 178], [CX, LENS.x - 50], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const camY = interpolate(frame, [beats.worth + 5, 178], [CY, LENS.y + 64], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tx = CX - camX * k;
  const ty = CY - camY * k;

  const ballK = interpolate(frame, [beats.because, beats.because + 26], [1, SHRINK], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const dots = own.map((p0, i) => {
    const p = {x: CX + (p0.x - CX) * ballK, y: CY + (p0.y - CY) * ballK};
    const t = target[i];
    // Each agent keeps drifting on its own small orbit, in every phase.
    const dr = 4 + hash(i, 7) * 6;
    const ph = hash(i, 8) * Math.PI * 2;
    const sp = 0.018 + hash(i, 9) * 0.02;
    const drift = {x: dr * Math.cos(frame * sp + ph), y: dr * Math.sin(frame * sp * 1.3 + ph)};
    // Pushing at the outline it has been put inside.
    const out = strain * (16 + hash(i, 11) * 38) * (0.5 + 0.5 * Math.sin(frame * 0.5 + ph));
    const nx = t.x - CX;
    const ny = t.y - 980;
    const nl = Math.max(Math.hypot(nx, ny), 1);
    // Coming back out is per-agent: its own delay, its own spring. A crowd
    // released in lockstep along straight lines reads as a machine.
    const delay = hash(i, 13) * 13;
    const burst =
      frame < beats.because + delay
        ? 0
        : spring({
            frame: frame - beats.because - delay,
            fps,
            config: {damping: 12 + hash(i, 14) * 7, stiffness: 74 + hash(i, 15) * 46},
          });
    const held = clamp01(press * (1 - burst));
    const hx = t.x + (nx / nl) * out * held;
    const hy = t.y + (ny / nl) * out * held;
    let x = p.x + (hx - p.x) * held;
    let y = p.y + (hy - p.y) * held;
    // ...and it takes a curved way home, so the field unfolds instead of
    // snapping. Zero at both ends of the move, so nothing jumps.
    if (frame >= beats.because) {
      const bow = (hash(i, 16) - 0.5) * 210 * Math.sin(Math.PI * held);
      const dx = hx - p.x;
      const dy = hy - p.y;
      const dl = Math.max(Math.hypot(dx, dy), 1);
      x += (-dy / dl) * bow;
      y += (dx / dl) * bow;
    }
    const r =
      (dotMin + (dotMax - dotMin) * hash(i, 12)) * (1 - 0.45 * settle * (1 - burst)) +
      3.2 * settle * (1 - burst);
    // Held in our shape the field stops milling, which is what makes the
    // silhouette read as a silhouette rather than a cloud.
    const still = 1 - 0.62 * held;
    let px = x + drift.x * still;
    let py = y + drift.y * still;
    let rr = r;
    let k = 0;
    // Under the glass, things are bigger and pushed apart — the field is not
    // annotated, it is actually magnified.
    if (glassFade > 0) {
      const dx = px - lens.x;
      const dy = py - lens.y;
      const d = Math.hypot(dx, dy);
      if (d < hole) {
        k = (1 - (d / hole) ** 2) * glassFade;
        px += dx * 0.4 * k;
        py += dy * 0.4 * k;
        rr *= 1 + 0.62 * k;
      }
    }
    return {x: px, y: py, r: rr, u: clamp01(0.58 * resolve + 0.62 * k), held};
  });

  return (
    <AbsoluteFill style={{backgroundColor: gridBase}}>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Img
          src={staticFile(grid)}
          style={{
            position: 'absolute',
            left: '-40%',
            top: '-40%',
            width: '180%',
            height: '180%',
            objectFit: 'cover',
            filter: `blur(${gridBlur}px) brightness(${gridBrightness})`,
            // Its own plane: 0.15 of the camera's move, 0.3 of its zoom, plus a
            // slow drift so it is never dead during a hold.
            transform: `translate(${(tx * 0.15 + frame * 0.1).toFixed(2)}px, ${(
              ty * 0.15 +
              frame * 0.06
            ).toFixed(2)}px) scale(${(1 + (k - 1) * 0.3).toFixed(4)})`,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${k.toFixed(4)})`,
          transformOrigin: '0 0',
        }}
      >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 9px ${shadow})`}}>
          {links.map((l, j) => {
            const enter = countIn(j);
            if (enter <= 0) {
              return null;
            }
            const a = dots[l.a];
            const b = dots[l.b];
            // Threads cannot survive the shape being imposed on them.
            const alive = enter * (1 - 0.88 * a.held);
            const u = Math.min(a.u, b.u);
            const ex = a.x + (b.x - a.x) * enter;
            const ey = a.y + (b.y - a.y) * enter;
            // Theirs run outward, agent to agent: a charge leaves the inner end
            // and never comes back.
            const t = (((frame / 30 + hash(j, 17)) % 1) + 1) % 1;
            return (
              <g key={`l${j}`}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={ex}
                  y2={ey}
                  stroke={accent}
                  strokeWidth={linkWidth + 2 * u}
                  strokeLinecap="round"
                  opacity={alive * (0.42 - 0.1 * recede + 0.5 * u)}
                />
                <circle
                  cx={a.x + (ex - a.x) * t}
                  cy={a.y + (ey - a.y) * t}
                  r={5}
                  fill={accent}
                  opacity={alive * Math.sin(Math.PI * t) * (0.5 + 0.4 * u)}
                />
              </g>
            );
          })}

          {dots.map((d, i) => (
            <circle
              key={`d${i}`}
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill={accent}
              opacity={0.62 - 0.13 * recede + 0.38 * d.u}
            />
          ))}

        </g>
      </svg>

      <Img
        src={staticFile(glass)}
        style={{
          position: 'absolute',
          left: lens.x - glassSize * GLASS_C,
          top: lens.y - glassSize * GLASS_C,
          width: glassSize,
          height: glassSize,
          filter: `brightness(0) invert(1) drop-shadow(0 2px 9px ${shadow})`,
          opacity: 0.95 * glassFade,
        }}
      />

      <Img
        src={staticFile(humanGlyph)}
        style={{
          position: 'absolute',
          left: CX - humanSize / 2,
          top: CY - humanSize / 2,
          width: humanSize,
          height: humanSize,
          filter: `brightness(0) invert(1) drop-shadow(0 2px 9px ${shadow})`,
          opacity: 0.95 * us,
          transform: `scale(${0.82 + 0.18 * us})`,
          transformOrigin: 'center center',
        }}
      />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default NotOurShapeGrid;
