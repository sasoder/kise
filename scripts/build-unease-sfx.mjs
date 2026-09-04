// Two synthesised elements for LongRunGoalsUnverified that no one-shot library
// covers: the swell into the failed check, and the bed that holds under the
// unresolved ending. ffmpeg expression sources only — no samples, no network.
//
//   bun scripts/build-unease-sfx.mjs

import {execFileSync} from 'node:child_process';

const render = (out, expr, dur, post, gain) => {
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-filter_complex',
      `aevalsrc='${expr}':d=${dur}:s=48000,${post},` +
        `volume=${gain},alimiter=limit=0.9:level=disabled[out]`,
      '-map',
      '[out]',
      '-c:a',
      'pcm_s24le',
      '-ar',
      '48000',
      out,
    ],
    {stdio: ['ignore', 'ignore', 'inherit']},
  );
  console.log(`${out}  ${dur}s`);
};

// Rising band-limited noise that stops dead. Placed so its peak lands on the
// frame the third checkmark gives up — the cut is the point, not the swell.
render(
  'public/stall-swell.wav',
  `(random(0)*2-1)*pow(t/0.34,2.0)`,
  0.34,
  'highpass=f=320,lowpass=f=3200',
  0.75,
);

// Two near-tones a few Hz apart beat against each other at ~3.3Hz: unsettled
// without being a horror drone. The second tone stays well under the first so
// the beat is a slow breathing hum, not a pulse. Releases on the last frame.
render(
  'public/unease-bed.wav',
  `(sin(2*PI*t*55)+0.55*sin(2*PI*t*58.3)+0.3*sin(2*PI*t*110.6))*` +
    `min(1,t/0.55)*min(1,(2.4-t)/0.8)`,
  2.4,
  'lowpass=f=250',
  0.42,
);
