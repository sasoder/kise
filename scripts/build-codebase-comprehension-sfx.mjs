// Builds a standalone SFX bed for the CodebaseComprehensionFold composition.
// Everything is synthesised with ffmpeg expression sources — no sample library,
// no network — so the cues stay editable and frame-accurate.
//
//   bun scripts/build-codebase-comprehension-sfx.mjs
//
// The block layout, the wavefront equation and the fold stagger below are
// regenerated from the same constants and the same hash as
// generated/components/CodebaseComprehensionFold.tsx. Keep them in sync: the
// ignition ticks are placed by solving the wave equation for each bar, so they
// land on the exact frame that bar lights up rather than on an even grid.

import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';

const FPS = 30;
const DURATION_IN_FRAMES = 120;
const OUT = 'out/codebase-comprehension-sfx.wav';
const SECONDS = DURATION_IN_FRAMES / FPS;

// Same beats the component animates from.
const SWEEP = 31;
const FOLD = 53;
const WIRE = 74;
const RESOLVE = 89;
const FOLD_SPAN = WIRE - FOLD;

// Same block geometry.
const BLOCK_W = 700;
const LINE_H = 44;
const GROUP_GAP = 26;
const BAR_H = 13;
const INDENT = 46;
const GROUPS = [3, 2, 4, 2, 3, 2];

const NODES = [
  {x: -34, y: -336},
  {x: -318, y: -148},
  {x: 302, y: -84},
  {x: -146, y: 118},
  {x: 231, y: 206},
  {x: 28, y: 396},
];

const EDGES = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [2, 4],
  [3, 4],
  [3, 5],
  [4, 5],
  [0, 3],
  [1, 4],
];

const fract = (n) => n - Math.floor(n);
const hash = (i, k) => fract(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);

// Rebuild the bars exactly as the component lays them out.
const BARS = (() => {
  const raw = [];
  let y = 0;
  let i = 0;
  GROUPS.forEach((lines, g) => {
    for (let l = 0; l < lines; l++) {
      const last = l === lines - 1;
      const level = l === 0 ? 0 : last && lines > 2 ? 1 : hash(i, 1) > 0.72 ? 2 : 1;
      const x = level * INDENT;
      const room = BLOCK_W - x;
      const w = room * (level === 0 ? 0.55 + hash(i, 2) * 0.3 : 0.3 + hash(i, 3) * 0.48);
      raw.push({x, y, w, group: g});
      y += LINE_H;
      i++;
    }
    y += GROUP_GAP;
  });
  const blockH = raw[raw.length - 1].y + BAR_H;
  return raw.map((b) => {
    const cx = b.x - BLOCK_W / 2 + b.w / 2;
    const cy = b.y - blockH / 2 + BAR_H / 2;
    return {cx, cy, group: b.group, dist: Math.hypot(cx, cy)};
  });
})();

const MAX_DIST = Math.max(...BARS.map((b) => b.dist));
const WAVE_A = MAX_DIST * 1.12;

// The component eases the wave with Easing.out(quad): r = A*(1-(1-p)^2).
// Inverting it gives the frame on which the front reaches a given radius, so
// the ticks inherit the deceleration instead of being spread evenly.
const frameAtRadius = (r) =>
  SWEEP + (FOLD - SWEEP) * (1 - Math.sqrt(Math.max(0, 1 - Math.min(r / WAVE_A, 1))));

// Same distance ordering the fold uses.
const GROUP_RANK = (() => {
  const meanDist = GROUPS.map((_, g) => {
    const gb = BARS.filter((b) => b.group === g);
    return gb.reduce((s, b) => s + b.dist, 0) / gb.length;
  });
  const rank = new Array(GROUPS.length).fill(0);
  meanDist
    .map((d, g) => ({d, g}))
    .sort((a, b) => a.d - b.d)
    .forEach((o, idx) => {
      rank[o.g] = idx;
    });
  return rank;
})();

const foldStart = (g) => FOLD + (GROUP_RANK[g] / (GROUPS.length - 1)) * FOLD_SPAN * 0.45;
// The node pops when its group's fold progress passes 0.62.
const nodeFrame = (g) => foldStart(g) + 0.62 * FOLD_SPAN * 0.8;

// Screen-x to stereo position. Half the frame is 540px.
const panOf = (x) => Math.max(-1, Math.min(1, x / 540));

const parts = [];

/** Registers one synthesised source at a given frame. */
const cue = ({frame, expr, dur, gain, pan = 0, post = ''}) => {
  const ms = Math.max(0, Math.round((frame / FPS) * 1000));
  const l = (gain * (1 - Math.max(0, pan) * 0.35)).toFixed(4);
  const r = (gain * (1 + Math.min(0, pan) * 0.35)).toFixed(4);
  const label = `s${parts.length}`;
  parts.push(
    `aevalsrc='${expr}':d=${dur}:s=48000${post ? ',' + post : ''},` +
      `pan=stereo|c0=${l}*c0|c1=${r}*c0,adelay=${ms}|${ms}[${label}]`,
  );
  return label;
};

// A soft rounded "thock": a pitch-dropping fundamental plus an octave-down body.
const thock = (f) =>
  `(sin(2*PI*t*${f}*(1+0.35*exp(-t*26)))+0.55*sin(2*PI*t*${(f / 2).toFixed(1)}))*exp(-t*15)`;

// A light tick: same shape, much shorter and higher.
const tick = (f) => `sin(2*PI*t*${f}*(1+0.45*exp(-t*70)))*exp(-t*42)`;

// Noise burst with a fast swell and an exponential tail.
const air = (seed, decay) => `(random(${seed})*2-1)*exp(-t*${decay})*(1-exp(-t*30))`;

/* 1. The block building. One dry paper click per line, on the frame that line
   arrives. Deliberately below the threshold of counting — it is texture that
   says "material is being laid down", not a typewriter. */
BARS.forEach((b, i) => {
  cue({
    frame: i * 1.1,
    expr: air(11 + i, 55),
    dur: 0.16,
    gain: 0.25,
    pan: panOf(b.cx) * 0.8,
    post: 'highpass=f=1100,lowpass=f=6200',
  });
});

/* 2. The wavefront leaving, on "how fast". A sub thump at the seed plus three
   noise layers opening from dark to bright, which reads as a front widening
   outward rather than a whoosh passing by. */
cue({
  frame: SWEEP,
  expr: `sin(2*PI*t*52*(1+0.6*exp(-t*14)))*exp(-t*5.5)`,
  dur: 1.2,
  gain: 0.5,
});
cue({
  frame: SWEEP,
  expr: air(101, 14),
  dur: 0.5,
  gain: 0.34,
  post: 'highpass=f=260,lowpass=f=1400',
});
cue({
  frame: SWEEP + 1,
  expr: air(102, 11),
  dur: 0.55,
  gain: 0.24,
  post: 'highpass=f=800,lowpass=f=3600',
});
cue({
  frame: SWEEP + 3,
  expr: air(103, 8),
  dur: 0.6,
  gain: 0.17,
  post: 'highpass=f=2000,lowpass=f=9000',
});

/* 3. One ignition tick per line, placed by solving the wave equation for that
   line's distance. They crowd at the start and thin out after, so the ear hears
   the front decelerating even though nothing is drawn to a beat. Pitch rises
   with distance, so the flurry opens outward. */
BARS.slice()
  .sort((a, b) => a.dist - b.dist)
  .forEach((b, i) => {
    cue({
      frame: frameAtRadius(b.dist),
      expr: tick(Math.round(760 * Math.pow(2, (b.dist / MAX_DIST) * 1.1))),
      dur: 0.13,
      gain: 0.085,
      pan: panOf(b.cx),
    });
  });

/* 4. The fold. Each group gets a short inward gather — noise and a falling tone
   collapsing — then a rounded pip on the frame its node lands. Pitches descend
   by fold order, so six landings read as one settling motion. */
[330, 311, 294, 277, 262, 247].forEach((pitch, rank) => {
  const g = GROUP_RANK.indexOf(rank);
  const n = NODES[g];
  cue({
    frame: foldStart(g),
    expr: `sin(2*PI*t*520*(1-0.45*(1-exp(-t*6))))*exp(-t*5.2)`,
    dur: 0.5,
    gain: 0.09,
    pan: panOf(n.x),
  });
  cue({
    frame: foldStart(g) + 1,
    expr: air(210 + g, 13),
    dur: 0.45,
    gain: 0.16,
    pan: panOf(n.x),
    post: 'highpass=f=500,lowpass=f=4200',
  });
  cue({
    frame: nodeFrame(g),
    expr: thock(pitch),
    dur: 0.5,
    gain: 0.12,
    pan: panOf(n.x) * 0.9,
  });
});

/* 5. The wiring, on "understand". Ten bright ticks climbing in pitch, each
   panned to the middle of the edge it draws — fast enough to read as one
   gesture of things clicking into place. */
EDGES.forEach(([a, b], j) => {
  const midX = (NODES[a].x + NODES[b].x) / 2;
  cue({
    frame: WIRE + (j / EDGES.length) * (RESOLVE - WIRE) * 0.7,
    expr: tick(Math.round(880 * Math.pow(2, j * 0.052))),
    dur: 0.12,
    gain: 0.22,
    pan: panOf(midX),
  });
  cue({
    frame: WIRE + (j / EDGES.length) * (RESOLVE - WIRE) * 0.7,
    expr: air(300 + j, 40),
    dur: 0.14,
    gain: 0.13,
    pan: panOf(midX),
    post: 'highpass=f=2600,lowpass=f=11000',
  });
});

/* A quiet rising swell across the wiring, so the ten ticks read as one gesture
   arriving somewhere rather than as a flat run. */
cue({
  frame: WIRE - 1,
  expr: `sin(2*PI*t*130*(1+0.62*(1-exp(-t*2.6))))*(1-exp(-t*3.0))`,
  dur: 0.62,
  gain: 0.22,
  post: 'afade=t=out:st=0.5:d=0.12',
});

/* 6. The resolve, on "a new code base". Warm and matter-of-fact — a low bloom
   under a fifth and an octave. The point is that it holds together, not that
   anything was won. */
cue({
  frame: RESOLVE - 2,
  expr: air(9, 7),
  dur: 0.5,
  gain: 0.2,
  post: 'lowpass=f=4500',
});
cue({
  frame: RESOLVE,
  expr: `sin(2*PI*t*44*(1+0.55*exp(-t*11)))*exp(-t*3.8)`,
  dur: 1.4,
  gain: 0.55,
});
cue({
  frame: RESOLVE + 1,
  expr: `(sin(2*PI*t*220)+0.5*sin(2*PI*t*330)+0.25*sin(2*PI*t*440))*exp(-t*2.6)`,
  dur: 1.1,
  gain: 0.14,
});

/* 7. A low bed from just before the sweep to the end, so the hold has floor
   under it instead of dropping into silence. */
cue({
  frame: SWEEP - 15,
  expr: `sin(2*PI*t*58)+0.3*sin(2*PI*t*116)`,
  dur: SECONDS - (SWEEP - 15) / FPS,
  gain: 0.13,
  post: `lowpass=f=400,afade=t=in:st=0:d=0.75,afade=t=out:st=${(
    SECONDS -
    (SWEEP - 15) / FPS -
    0.7
  ).toFixed(3)}:d=0.7`,
});

// Delivered as a stem, so it leaves room to sit under the VO rather than
// arriving at final level.
const MASTER = 0.48;

const mixInputs = parts.map((_, i) => `[s${i}]`).join('');
const graph = [
  ...parts,
  `${mixInputs}amix=inputs=${parts.length}:normalize=0[mix]`,
  `[mix]apad,volume=${MASTER},alimiter=limit=0.85:level=disabled,` +
    `afade=t=out:st=${(SECONDS - 0.16).toFixed(3)}:d=0.16[out]`,
].join(';');

mkdirSync('out', {recursive: true});
execFileSync(
  'ffmpeg',
  [
    '-y',
    '-filter_complex',
    graph,
    '-map',
    '[out]',
    '-t',
    String(SECONDS),
    '-c:a',
    'pcm_s24le',
    '-ar',
    '48000',
    OUT,
  ],
  {stdio: ['ignore', 'ignore', 'inherit']},
);

console.log(`${OUT}  ${parts.length} cues  ${SECONDS}s`);
