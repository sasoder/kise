// Builds a standalone SFX stem for the ChatCheckoutNoRedirect composition.
// Everything is synthesised with ffmpeg expression sources — no sample library,
// no network — so the cues stay editable and frame-accurate.
//
//   bun scripts/build-chat-checkout-sfx.mjs
//
// The panel geometry, the draw easing and the escape/return curve below are
// regenerated from the same constants as
// generated/components/ChatCheckoutNoRedirect.tsx. Keep them in sync: the draw
// ticks are placed by inverting the easing, so they crowd where the stroke is
// actually moving fastest rather than sitting on an even grid.

import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';

const FPS = 30;
const DURATION_IN_FRAMES = 376;
const OUT = 'out/chat-checkout-sfx.wav';
const SECONDS = DURATION_IN_FRAMES / FPS;

// Same beats the component animates from.
const B = {
  panel: 0,
  panelEnd: 66,
  chat: 85,
  chatbots: 118,
  stripe: 150,
  customers: 188,
  complete: 217,
  purchases: 232,
  within: 247,
  leave: 311,
  redirected: 340,
  settle: 362,
};

// Same geometry.
const P = {x: 170, y: 60, w: 740, h: 772};
const BUBBLE_BORN = [85, 97, 109];
const BUBBLE_X = [290 + 160, 910 - 46 - 270 + 135, 290 + 175];
const BOT_X = 226;
const PAY_Y = 646;
const LOGO_Y = 902;

// Screen-x to stereo position, from the centre of a 1080 canvas. Kept shallow:
// this sits under a voice, so hard panning would pull focus.
const panOf = (x) => Math.max(-1, Math.min(1, (x - 540) / 540)) * 0.55;

// Remotion's Easing.inOut(cubic), used by the panel draw.
const inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// The frame at which the stroke has drawn a given fraction of its perimeter.
const frameAtDraw = (target) => {
  const span = B.panelEnd - B.panel;
  for (let f = 0; f <= span; f += 0.05) {
    if (inOutCubic(f / span) >= target) return B.panel + f;
  }
  return B.panelEnd;
};

// Where the pen is at that fraction, corners ignored — close enough to pan by.
const pointAtDraw = (f) => {
  const perim = 2 * (P.w + P.h);
  const d = f * perim;
  if (d < P.w) return P.x + d;
  if (d < P.w + P.h) return P.x + P.w;
  if (d < 2 * P.w + P.h) return P.x + P.w - (d - P.w - P.h);
  return P.x;
};

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

/* 1. The frame drawing itself. Twenty-eight dry pen ticks placed by inverting
   the draw easing, so they accelerate into the middle of the stroke and thin
   out at both ends. Panned to where the pen actually is. Below the threshold of
   counting — texture, not a typewriter. */
const DRAW_TICKS = 28;
for (let i = 0; i < DRAW_TICKS; i++) {
  const frac = (i + 0.5) / DRAW_TICKS;
  cue({
    frame: frameAtDraw(frac),
    expr: air(31 + i, 62),
    dur: 0.14,
    gain: 0.55,
    pan: panOf(pointAtDraw(frac)),
    post: 'highpass=f=1400,lowpass=f=7000',
  });
}
/* The frame closing. */
cue({frame: B.panelEnd, expr: thock(196), dur: 0.5, gain: 0.1});

/* 2. The conversation. One rounded pip per bubble, alternating sides, the
   customer's reply a little brighter than the agent's. */
[
  [BUBBLE_BORN[0], 232, BUBBLE_X[0]],
  [BUBBLE_BORN[1], 294, BUBBLE_X[1]],
  [BUBBLE_BORN[2], 220, BUBBLE_X[2]],
].forEach(([frame, pitch, x], i) => {
  cue({frame, expr: thock(pitch), dur: 0.42, gain: 0.11, pan: panOf(x)});
  cue({
    frame,
    expr: air(60 + i, 46),
    dur: 0.16,
    gain: 0.45,
    pan: panOf(x),
    post: 'highpass=f=1600,lowpass=f=8000',
  });
});

/* 3. The agent's mark. Three quick ticks climbing a fifth — one per sparkle —
   so it shimmers instead of thudding. */
[0, 2.5, 4.5].forEach((off, i) => {
  cue({
    frame: B.chatbots + off,
    expr: tick(Math.round(1180 * Math.pow(1.5, i * 0.6))),
    dur: 0.12,
    gain: 0.075,
    pan: panOf(BOT_X),
  });
});
cue({
  frame: B.chatbots,
  expr: air(70, 24),
  dur: 0.3,
  gain: 0.4,
  pan: panOf(BOT_X),
  post: 'highpass=f=3200,lowpass=f=12000',
});

/* 4. "to stripe": the connection. A low arrival under the wordmark, then the
   wire drawing downward — a tone gliding down, landing on a soft stop at the
   panel's foot. First lift of the piece, but still under the voice. */
cue({
  frame: B.stripe,
  expr: `sin(2*PI*t*58*(1+0.5*exp(-t*12)))*exp(-t*4.6)`,
  dur: 1.1,
  gain: 0.3,
});
cue({
  frame: B.stripe + 5,
  expr: `sin(2*PI*t*640*(1-0.42*(1-exp(-t*7))))*exp(-t*6.5)`,
  dur: 0.55,
  gain: 0.1,
});
cue({
  frame: B.stripe + 5,
  expr: air(80, 16),
  dur: 0.4,
  gain: 0.7,
  post: 'highpass=f=700,lowpass=f=5000',
});
cue({frame: B.stripe + 20, expr: thock(147), dur: 0.6, gain: 0.12, pan: panOf(540)});

/* 5. What Stripe puts inside the frame. Two slides upward, the pay row a
   fourth above the line item, each with a short air lift under it. */
[
  [B.customers, 262],
  [B.complete - 12, 349],
].forEach(([frame, pitch], i) => {
  cue({
    frame,
    expr: `sin(2*PI*t*${pitch}*(1+0.22*(1-exp(-t*9))))*exp(-t*7)`,
    dur: 0.45,
    gain: 0.085,
  });
  cue({
    frame,
    expr: air(90 + i, 19),
    dur: 0.38,
    gain: 0.6,
    post: 'highpass=f=900,lowpass=f=5200',
    pan: panOf(540),
  });
});

/* 6. "purchases": first of the two peaks. A warm confirm — root, fifth, octave
   arriving over three frames so it reads as one chord settling, with a low
   bloom under it. Matter-of-fact: the purchase completed, nobody won anything. */
cue({
  frame: B.purchases - 2,
  expr: air(100, 9),
  dur: 0.45,
  gain: 0.62,
  post: 'lowpass=f=4200',
});
cue({
  frame: B.purchases,
  expr: `sin(2*PI*t*49*(1+0.5*exp(-t*10)))*exp(-t*3.6)`,
  dur: 1.3,
  gain: 0.38,
});
[
  [0, 294],
  [2, 440],
  [4, 588],
].forEach(([off, f]) => {
  cue({
    frame: B.purchases + off,
    expr: `sin(2*PI*t*${f})*exp(-t*3.2)`,
    dur: 1.0,
    gain: 0.075,
  });
});

/* 7. "within their existing experience": the border reasserting. Just a low
   swell with no attack, so it registers as the room rather than as an event. */
cue({
  frame: B.within,
  expr: `sin(2*PI*t*73)*(1-exp(-t*4.5))*exp(-t*1.9)`,
  dur: 1.1,
  gain: 0.16,
  post: 'lowpass=f=320',
});

/* 8. The redirect that does not happen. A rising bed under the copy pulling
   away — tone and noise both opening for the twenty-nine frames it travels, so
   the ear leans with it. This is the crescendo. */
const ESCAPE_SEC = (B.redirected - B.leave) / FPS;
cue({
  frame: B.leave,
  expr: `sin(2*PI*t*96*(1+0.55*(1-exp(-t*1.6))))*(1-exp(-t*2.4))`,
  dur: ESCAPE_SEC + 0.08,
  gain: 0.2,
  post: `lowpass=f=900,afade=t=out:st=${ESCAPE_SEC.toFixed(2)}:d=0.08`,
  pan: 0.3,
});
cue({
  frame: B.leave + 2,
  expr: `(random(120)*2-1)*(1-exp(-t*1.3))`,
  dur: ESCAPE_SEC,
  gain: 0.34,
  post: `highpass=f=1200,lowpass=f=6000,afade=t=out:st=${(ESCAPE_SEC - 0.1).toFixed(
    2,
  )}:d=0.1`,
  pan: 0.45,
});

/* 9. "redirected": second peak, and the only hard moment in the piece. A short
   dense stop panned to the wall it hits, then the copy dragged back to centre
   as a tone gliding down and inward. */
cue({
  frame: B.redirected,
  expr: `sin(2*PI*t*84*(1+0.75*exp(-t*22)))*exp(-t*9)`,
  dur: 0.7,
  gain: 0.42,
  pan: 0.5,
});
cue({
  frame: B.redirected,
  expr: air(130, 34),
  dur: 0.3,
  gain: 1.15,
  pan: 0.5,
  post: 'highpass=f=400,lowpass=f=3400',
});
cue({
  frame: B.redirected + 2,
  expr: `sin(2*PI*t*520*(1-0.55*(1-exp(-t*4.2))))*exp(-t*4.4)`,
  dur: 0.75,
  gain: 0.09,
  pan: 0.35,
});
cue({
  frame: B.redirected + 4,
  expr: air(131, 7),
  dur: 0.6,
  gain: 0.6,
  post: 'highpass=f=300,lowpass=f=2600',
  pan: 0.2,
});

/* 10. "off of it": the frame holds. A low resolve with a fifth over it, landing
   before the last frame so the tail is decay, not motion. */
cue({
  frame: B.settle,
  expr: `sin(2*PI*t*44*(1+0.45*exp(-t*10)))*exp(-t*3.4)`,
  dur: 1.5,
  gain: 0.34,
});
cue({
  frame: B.settle + 1,
  expr: `(sin(2*PI*t*196)+0.5*sin(2*PI*t*294))*exp(-t*2.8)`,
  dur: 1.1,
  gain: 0.085,
});

/* 11. A low bed from the frame closing to the end, so the long held stretches
   have floor under them instead of dropping into silence. */
const BED_START = B.panelEnd - 10;
const BED_SEC = SECONDS - BED_START / FPS;
cue({
  frame: BED_START,
  expr: `sin(2*PI*t*55)+0.28*sin(2*PI*t*110)`,
  dur: BED_SEC,
  gain: 0.075,
  post: `lowpass=f=360,afade=t=in:st=0:d=1.2,afade=t=out:st=${(BED_SEC - 0.9).toFixed(
    3,
  )}:d=0.9`,
});

// Delivered as a stem, so it leaves room to sit under the VO rather than
// arriving at final level.
const MASTER = 0.42;

const mixInputs = parts.map((_, i) => `[s${i}]`).join('');
const graph = [
  ...parts,
  `${mixInputs}amix=inputs=${parts.length}:normalize=0[mix]`,
  `[mix]apad,volume=${MASTER},alimiter=limit=0.85:level=disabled,` +
    `afade=t=out:st=${(SECONDS - 0.2).toFixed(3)}:d=0.2[out]`,
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

console.log(`${OUT}  ${parts.length} cues  ${SECONDS.toFixed(2)}s`);
