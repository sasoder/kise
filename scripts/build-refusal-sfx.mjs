// The one sound for ClaudeRefusesSafetyResearch that no library one-shot
// covers: the excuse sagging under its own weight. ffmpeg expression source
// only — no samples, no network.
//
//   bun scripts/build-refusal-sfx.mjs

import {execFileSync} from 'node:child_process';

const DUR = 1.1;

// A tone gliding 240Hz -> 68Hz. Quadratic phase, so the pitch falls at a
// constant rate: the sound of air going out of something, not a cartoon slide.
const expr =
  `(sin(2*PI*(240*t - 78*t*t)) + 0.3*sin(2*PI*(480*t - 156*t*t)))*` +
  `(1-exp(-t*45))*exp(-t*2.4)`;

execFileSync(
  'ffmpeg',
  [
    '-y',
    '-filter_complex',
    `aevalsrc='${expr}':d=${DUR}:s=48000,lowpass=f=1800,` +
      `volume=0.5,alimiter=limit=0.9:level=disabled[out]`,
    '-map',
    '[out]',
    '-c:a',
    'pcm_s24le',
    '-ar',
    '48000',
    'public/excuse-sag.wav',
  ],
  {stdio: ['ignore', 'ignore', 'inherit']},
);

console.log(`public/excuse-sag.wav  ${DUR}s`);
