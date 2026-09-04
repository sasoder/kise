// Builds a standalone SFX bed that lines up with the SpaceFlags composition.
// Everything is synthesised with ffmpeg expression sources — no sample library,
// no network — so the cues stay editable and exactly frame-accurate.
//
//   bun scripts/build-sfx.mjs
//
// Cue frames mirror generated/components/SpaceFlags.tsx. Keep them in sync.

import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';

const FPS = 30;
const DURATION_IN_FRAMES = 348;
const OUT = 'out/space-flags-sfx.wav';

// Same constants the component animates from.
const SIXTEEN_AT = 3.339 * FPS; // 100.17
const TWELVE_AT = 7.32 * FPS; // 219.6
const TRIO_STAGGER = 7;
const GRID_STAGGER = 3.4;
const GRID_DELAY = 10;

const parts = [];

/** Registers one synthesised one-shot at a given frame. */
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

// A light UI tick: same shape, much shorter and higher.
const tick = (f) =>
  `sin(2*PI*t*${f}*(1+0.45*exp(-t*70)))*exp(-t*42)`;

// Noise burst with a fast swell and an exponential tail.
const air = (seed, decay) =>
  `(random(${seed})*2-1)*exp(-t*${decay})*(1-exp(-t*30))`;

/* 1. Trio pops — "Only three countries can send people into space." */
[300, 356, 424].forEach((f, i) => {
  cue({
    frame: i * TRIO_STAGGER,
    expr: thock(f),
    dur: 0.7,
    gain: 0.5,
    pan: [-0.7, 0, 0.7][i],
  });
});

/* 2. Whoosh as the trio shrinks and rises — leads the move by 4 frames.
   Two bands, the high one lagging, so it reads as rising rather than flat. */
cue({
  frame: SIXTEEN_AT - 4,
  expr: air(1, 5),
  dur: 0.8,
  gain: 0.42,
  post: 'lowpass=f=900',
});
cue({
  frame: SIXTEEN_AT - 1,
  expr: air(2, 6),
  dur: 0.8,
  gain: 0.31,
  post: 'highpass=f=1500,lowpass=f=6500',
});

/* 3. Sixteen ticks, one per flag, drifting up ~4 semitones across the run.
   Panned by grid column so the flurry has width instead of stacking centre. */
for (let j = 0; j < 16; j++) {
  const col = j % 4;
  cue({
    frame: SIXTEEN_AT + GRID_DELAY + j * GRID_STAGGER,
    expr: tick(Math.round(640 * Math.pow(2, (j / 15) * (4 / 12)))),
    dur: 0.2,
    gain: 0.27,
    pan: (col - 1.5) / 1.5,
  });
}

/* 4. The highlight — "but only 12 can do so on their own." */
cue({
  frame: TWELVE_AT,
  expr: `sin(2*PI*t*52*(1+0.6*exp(-t*14)))*exp(-t*7)`,
  dur: 1.4,
  gain: 0.62,
});
cue({
  frame: TWELVE_AT + 1,
  expr:
    `(sin(2*PI*t*784)+0.6*sin(2*PI*t*1176)+0.35*sin(2*PI*t*1568))*exp(-t*6)`,
  dur: 1.8,
  gain: 0.2,
});
cue({
  frame: TWELVE_AT - 2,
  expr: air(3, 7),
  dur: 0.7,
  gain: 0.21,
  post: 'highpass=f=900,lowpass=f=7000',
});

const mixInputs = parts.map((_, i) => `[s${i}]`).join('');
const graph = [
  ...parts,
  `${mixInputs}amix=inputs=${parts.length}:normalize=0[mix]`,
  `[mix]apad,alimiter=limit=0.85:level=disabled[out]`,
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
    String(DURATION_IN_FRAMES / FPS),
    '-c:a',
    'pcm_s24le',
    '-ar',
    '48000',
    OUT,
  ],
  {stdio: ['ignore', 'ignore', 'inherit']},
);

console.log(`${OUT}  ${parts.length} cues  ${DURATION_IN_FRAMES / FPS}s`);
