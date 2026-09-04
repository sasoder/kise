// Builds a standalone SFX bed that lines up with the ElectricityDownstream
// composition. Everything is synthesised with ffmpeg expression sources — no
// sample library, no network — so the cues stay editable and frame-accurate.
//
//   bun scripts/build-electricity-sfx.mjs
//
// Cue frames mirror generated/components/ElectricityDownstream.tsx. Keep them
// in sync — the hairline routing below is regenerated from the same hash so the
// tick flurry hits on exactly the frames the lines draw.

import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';

const FPS = 30;
const DURATION_IN_FRAMES = 200;
const OUT = 'out/electricity-downstream-sfx.wav';
const SECONDS = DURATION_IN_FRAMES / FPS;

// Same beats the component animates from.
const F_SOURCE_IN = 4;
const F_LINE_START = 34;
const F_FIELD_IN = 55;
const F_SPLIT = 69;
const F_RETICLE_IN = 96;
const F_ALL_ON = 162;
const BAR_COUNT = 5;

// Same field geometry, so ticks can be panned to where the line actually lands.
const COLS = 8;
const ROWS = 6;
const CELL_W = 70;
const COL_PITCH = 112;
const FIELD_X0 = 113;
const SPLIT_X = 540;
const cellCX = (c) => FIELD_X0 + c * COL_PITCH + CELL_W / 2;

const fract = (n) => n - Math.floor(n);
const hash = (i, k) => fract(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);

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

/* 1. The source stack settling — five warm blocks, pitch descending so the
   stack reads as gaining weight rather than piling up. */
[262, 247, 233, 220, 208].forEach((f, i) => {
  cue({
    frame: F_SOURCE_IN + i * 3,
    expr: thock(f),
    dur: 0.6,
    gain: 0.3,
    pan: (i - 2) * 0.12,
  });
});

/* 2. The trunk line: one clean, steady, entirely controlled tone. It runs from
   the moment the line leaves the source to the end of the piece. */
cue({
  frame: F_LINE_START,
  expr: `sin(2*PI*t*55)+0.35*sin(2*PI*t*110)+0.12*sin(2*PI*t*165)`,
  dur: SECONDS - F_LINE_START / FPS,
  gain: 0.14,
  post: `lowpass=f=420,afade=t=in:st=0:d=0.7,afade=t=out:st=${(
    SECONDS -
    F_LINE_START / FPS -
    0.8
  ).toFixed(3)}:d=0.8`,
});

/* 3. The field arriving — quiet paper ticks, every fourth dwelling only, spread
   across the stereo field so it lands as texture, not as a count. */
for (let j = 0; j < 12; j++) {
  const k = j * 4;
  cue({
    frame: F_FIELD_IN + k * 0.45,
    expr: air(20 + j, 55),
    dur: 0.18,
    gain: 0.055,
    pan: ((k % COLS) - 3.5) / 3.5,
    post: 'highpass=f=700,lowpass=f=3200',
  });
}

/* 4. The split. The single line gives: a low soft break plus a short spread of
   air. This is the only moment in the piece with any impact to it. */
cue({frame: F_SPLIT, expr: thock(94), dur: 1.1, gain: 0.42});
cue({
  frame: F_SPLIT - 1,
  expr: air(4, 6),
  dur: 0.6,
  gain: 0.15,
  post: 'highpass=f=700,lowpass=f=5200',
});

/* 5. Past the split the tone is no longer one thing: a detuned pair beats
   slowly against the trunk for the rest of the piece. */
cue({
  frame: F_SPLIT,
  expr: `sin(2*PI*t*55.7)+0.8*sin(2*PI*t*54.9)`,
  dur: SECONDS - F_SPLIT / FPS,
  gain: 0.062,
  post: `lowpass=f=380,afade=t=in:st=0:d=1.1,afade=t=out:st=${(
    SECONDS -
    F_SPLIT / FPS -
    0.8
  ).toFixed(3)}:d=0.8`,
});

/* 6. One tick per hairline, on the exact frame that line starts drawing and
   panned to where it lands. Deliberately too many to count. */
const targets = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (hash(r * COLS + c, 5) > 0.6) targets.push({c, r});
  }
}
targets.sort((a, b) => Math.abs(cellCX(b.c) - SPLIT_X) - Math.abs(cellCX(a.c) - SPLIT_X));

targets.forEach(({c}, i) => {
  cue({
    frame: F_SPLIT + i * 0.8,
    expr: tick(Math.round(880 * Math.pow(2, hash(i, 13) * 0.9))),
    dur: 0.14,
    gain: 0.13,
    pan: (cellCX(c) - SPLIT_X) / 540,
  });
});

/* The ten runs that leave the page get a longer, softer tail each. */
for (let i = 0; i < 10; i++) {
  cue({
    frame: F_SPLIT + 6 + i * 2,
    expr: air(40 + i, 9),
    dur: 0.4,
    gain: 0.065,
    pan: i % 2 === 0 ? 0.85 : -0.85,
    post: 'highpass=f=1200,lowpass=f=6000',
  });
}

/* 7. The reticle hunting. Three identical seek blips — it tries the same thing
   three times — then a short falling tone as it slides off right, unresolved. */
[F_RETICLE_IN, 108, 120].forEach((f, i) => {
  cue({frame: f, expr: tick(1180), dur: 0.16, gain: 0.13, pan: [-0.3, 0.35, -0.1][i]});
  cue({frame: f + 2, expr: tick(1570), dur: 0.13, gain: 0.09, pan: [-0.3, 0.35, -0.1][i]});
});
cue({
  frame: 130,
  expr: `sin(2*PI*t*620*(1-0.34*(1-exp(-t*5))))*exp(-t*4.2)`,
  dur: 0.95,
  gain: 0.15,
  pan: 0.7,
});

/* 8. Everything on at once. Warm and matter-of-fact — a fifth and an octave,
   not a chime. The point is scale, not triumph. */
cue({
  frame: F_ALL_ON - 2,
  expr: air(9, 6),
  dur: 0.6,
  gain: 0.1,
  post: 'lowpass=f=4000',
});
cue({
  frame: F_ALL_ON,
  expr: `sin(2*PI*t*46*(1+0.5*exp(-t*12)))*exp(-t*4.6)`,
  dur: 1.7,
  gain: 0.58,
});
cue({
  frame: F_ALL_ON + 1,
  expr: `(sin(2*PI*t*196)+0.55*sin(2*PI*t*294)+0.28*sin(2*PI*t*392))*exp(-t*3.2)`,
  dur: 1.5,
  gain: 0.15,
});

// Delivered as a stem, so it leaves room to sit under the VO rather than
// arriving at final level. Lands around -23 LUFS integrated.
const MASTER = 0.48;

const mixInputs = parts.map((_, i) => `[s${i}]`).join('');
const graph = [
  ...parts,
  `${mixInputs}amix=inputs=${parts.length}:normalize=0[mix]`,
  `[mix]apad,volume=${MASTER},alimiter=limit=0.85:level=disabled[out]`,
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
