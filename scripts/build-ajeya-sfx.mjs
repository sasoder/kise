// SFX stems for the four "fable enhanced" Ajeya graphics. Synthesised, no
// samples, no network. Every cue is placed from the same beat frames and the
// same timing formulas the components use.
//
//   bun scripts/build-ajeya-sfx.mjs
//
// Palette — no noise beds, no drones. Everything is a designed transient:
//   bloop  a resonant filter struck and swept down: the wet drop. Accent/AI.
//   knock  a wooden body with a pitch dip: dry, rounded. Ink/human.
//   chime  a bell that rings out: the resolve.
//   sub    a short low weight under the big hits.
//   climb  a run of bloops rising or falling: replaces every swell.
// A short, damped reverb ties them together. Stems peak at -16 dBFS.

import {mkdirSync, writeFileSync} from 'node:fs';

const SR = 48000;
const FPS = 24;
const OUT_DIR = 'out/sfx';
mkdirSync(OUT_DIR, {recursive: true});

const fract = (n) => n - Math.floor(n);
const hash = (i, k) => fract(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);
const f2s = (f) => f / FPS;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const sat = (x, d = 1.7) => Math.tanh(x * d) / Math.tanh(d);

class Stem {
  constructor(seconds) {
    this.n = Math.ceil(seconds * SR);
    this.L = new Float64Array(this.n);
    this.R = new Float64Array(this.n);
    this.seed = 7;
  }
  rnd() {
    let x = this.seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x >>> 0 || 1;
    return (this.seed / 4294967296) * 2 - 1;
  }
  add(i, v, pan = 0) {
    if (i < 0 || i >= this.n) return;
    this.L[i] += v * Math.min(1, 1 - pan);
    this.R[i] += v * Math.min(1, 1 + pan);
  }

  // The drop. A state-variable filter with high resonance is struck with a
  // click and its cutoff is swept from above the note down onto it; the ring
  // is the body, the sweep is the "bloop", and a little saturation rounds it.
  bloop({t, f, gain, pan = 0, sweep = 2.3, q = 9, tau = 0.09, up = false}) {
    const s0 = Math.floor(t * SR);
    const N = Math.floor((tau * 6 + 0.02) * SR);
    let low = 0, band = 0;
    const qq = 1 / q;
    for (let k = 0; k < N; k++) {
      const u = k / N;
      const tt = k / SR;
      const glide = Math.exp(-tt / 0.028);
      const fc = up ? f * (sweep - (sweep - 1) * (1 - glide)) ** -1 * sweep : f * (1 + (sweep - 1) * glide);
      const ff = 2 * Math.sin((Math.PI * Math.min(fc, 12000)) / SR);
      const excite = (k === 0 ? 1 : 0) + (tt < 0.0025 ? this.rnd() * 0.35 : 0);
      low += ff * band;
      const high = excite - low - qq * band;
      band += ff * high;
      const env = Math.exp(-tt / tau) * (1 - u * u);
      this.add(s0 + k, sat(low * 0.9) * env * gain, pan);
    }
  }
  // A wooden body: three inharmonic partials, the top ones dying fast, a
  // pitch dip on the fundamental, a click on the front.
  knock({t, f, gain, pan = 0, tau = 0.16}) {
    const s0 = Math.floor(t * SR);
    const N = Math.floor(tau * 7 * SR);
    const parts = [
      {r: 1, a: 1, tau},
      {r: 2.76, a: 0.42, tau: tau * 0.38},
      {r: 5.4, a: 0.18, tau: tau * 0.16},
    ];
    const ph = parts.map(() => 0);
    for (let k = 0; k < N; k++) {
      const tt = k / SR;
      const dip = 1 + 0.16 * Math.exp(-tt / 0.012);
      let v = 0;
      parts.forEach((p, j) => {
        ph[j] += (2 * Math.PI * f * p.r * dip) / SR;
        v += Math.sin(ph[j]) * p.a * Math.exp(-tt / p.tau);
      });
      if (tt < 0.0018) v += this.rnd() * 0.5 * (1 - tt / 0.0018);
      this.add(s0 + k, sat(v * 0.8) * gain * Math.min(1, k / 12), pan);
    }
  }
  // The resolve: a low, dull bloom — fundamental and a quiet octave, nothing
  // above it, soft attack, a rounded pitch dip on the front. No bell.
  chime({t, f, gain, pan = 0, tau = 1.3}) {
    const s0 = Math.floor(t * SR);
    const N = Math.min(this.n - s0, Math.floor(tau * 5 * SR));
    const parts = [
      {r: 1, a: 1, tau},
      {r: 2.0, a: 0.28, tau: tau * 0.5},
    ];
    const ph = parts.map((p) => hash(p.r * 10, 3) * 6.28);
    for (let k = 0; k < N; k++) {
      const tt = k / SR;
      const dip = 1 + 0.09 * Math.exp(-tt / 0.05);
      let v = 0;
      parts.forEach((p, j) => {
        ph[j] += (2 * Math.PI * f * p.r * dip) / SR;
        v += Math.sin(ph[j]) * p.a * Math.exp(-tt / p.tau);
      });
      this.add(s0 + k, sat(v * 0.6, 1.3) * gain * Math.min(1, k / (0.03 * SR)), pan);
    }
  }
  // Low weight.
  sub({t, f = 60, gain, tau = 0.2}) {
    const s0 = Math.floor(t * SR);
    const N = Math.floor(tau * 6 * SR);
    let ph = 0;
    for (let k = 0; k < N; k++) {
      const tt = k / SR;
      ph += (2 * Math.PI * f * (1 + 0.5 * Math.exp(-tt / 0.03))) / SR;
      this.add(s0 + k, sat(Math.sin(ph), 1.4) * Math.exp(-tt / tau) * gain * Math.min(1, k / (0.006 * SR)));
    }
  }
  // A run of bloops, pitch moving from f0 to f1, spacing tightening (accel>1)
  // or opening (accel<1) across the run.
  climb({t, dur, f0, f1, n, gain, accel = 1, pan = 0, spread = 0, tau = 0.08}) {
    for (let i = 0; i < n; i++) {
      const u = n > 1 ? i / (n - 1) : 0;
      const pos = Math.pow(u, accel);
      this.bloop({
        t: t + dur * pos,
        f: f0 * Math.pow(f1 / f0, u),
        gain: gain * (0.75 + 0.25 * u),
        pan: pan + (i % 2 ? spread : -spread),
        tau,
      });
    }
  }

  reverb(wet = 0.2, decay = 0.62) {
    const combs = [0.0297, 0.0371, 0.0411, 0.0437].map((d) => ({d: Math.floor(d * SR)}));
    const aps = [0.005, 0.0017].map((d) => ({d: Math.floor(d * SR)}));
    const pre = Math.floor(0.006 * SR);
    const process = (src) => {
      const out = new Float64Array(this.n);
      const cb = combs.map((c) => ({...c, buf: new Float64Array(c.d), i: 0, lp: 0}));
      const ab = aps.map((a) => ({...a, buf: new Float64Array(a.d), i: 0}));
      const preBuf = new Float64Array(pre);
      let pi = 0;
      const damp = 1 - Math.exp((-2 * Math.PI * 2800) / SR);
      for (let k = 0; k < this.n; k++) {
        const x = preBuf[pi];
        preBuf[pi] = src[k];
        pi = (pi + 1) % pre;
        let acc = 0;
        for (const c of cb) {
          const y = c.buf[c.i];
          c.lp += damp * (y - c.lp);
          c.buf[c.i] = x + c.lp * decay;
          c.i = (c.i + 1) % c.d;
          acc += y;
        }
        acc /= cb.length;
        for (const a of ab) {
          const y = a.buf[a.i];
          const v = acc + y * 0.5;
          a.buf[a.i] = v;
          a.i = (a.i + 1) % a.d;
          acc = y - v * 0.5;
        }
        out[k] = acc;
      }
      return out;
    };
    const wl = process(this.L);
    const wr = process(this.R);
    for (let k = 0; k < this.n; k++) {
      this.L[k] = this.L[k] * (1 - wet * 0.4) + wl[k] * wet;
      this.R[k] = this.R[k] * (1 - wet * 0.4) + wr[k] * wet;
    }
  }
  master(peakDb = -16) {
    const a = 1 - Math.exp((-2 * Math.PI * 12000) / SR);
    let l = 0, r = 0, peak = 0;
    for (let k = 0; k < this.n; k++) {
      l += a * (this.L[k] - l);
      r += a * (this.R[k] - r);
      this.L[k] = l;
      this.R[k] = r;
      peak = Math.max(peak, Math.abs(l), Math.abs(r));
    }
    const g = Math.pow(10, peakDb / 20) / Math.max(peak, 1e-9);
    for (let k = 0; k < this.n; k++) {
      this.L[k] *= g;
      this.R[k] *= g;
    }
  }
  write(path) {
    const data = Buffer.alloc(this.n * 6);
    let o = 0;
    const put = (v) => {
      const i = Math.round(Math.max(-1, Math.min(1, v)) * 8388607);
      data[o++] = i & 0xff;
      data[o++] = (i >> 8) & 0xff;
      data[o++] = (i >> 16) & 0xff;
    };
    for (let k = 0; k < this.n; k++) {
      put(this.L[k]);
      put(this.R[k]);
    }
    const h = Buffer.alloc(44);
    h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
    h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
    h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 6, 28); h.writeUInt16LE(6, 32); h.writeUInt16LE(24, 34);
    h.write('data', 36); h.writeUInt32LE(data.length, 40);
    writeFileSync(path, Buffer.concat([h, data]));
  }
}

// Sonic grammar mirrors the colour grammar: accent/AI things are wet bloops,
// ink/human things are dry wooden knocks, resolves are chimes.

// ============================================================ 1 ==========
// NotOurShapeGrid — 183f. 12 avoid · 44 anthro · 68 these ais · 82 because ·
// 96 ways · 129 different · 147 worth · 161 understanding.
{
  const S = new Stem(183 / FPS);
  // the field gathering into our shape: drops falling in pitch and closing
  // in on each other, landing on a wooden knock (our shape) with weight
  S.climb({t: f2s(16), dur: f2s(26), f0: 720, f1: 360, n: 7, gain: 0.12, accel: 0.62, spread: 0.3});
  S.knock({t: f2s(44), f: 118, gain: 0.34, tau: 0.22});
  S.sub({t: f2s(44), f: 62, gain: 0.3});
  // strain: three tense rising drops
  [68, 74, 80].forEach((fr, i) => S.bloop({t: f2s(fr), f: 520 * Math.pow(1.19, i), gain: 0.12, tau: 0.07}));
  // release: an upward pop and a low bloom
  S.bloop({t: f2s(82), f: 640, gain: 0.3, up: true, sweep: 2.6, tau: 0.13});
  S.sub({t: f2s(83), f: 55, gain: 0.26, tau: 0.3});
  // threads counting in: drops that count up
  for (let j = 0; j < 9; j++) {
    S.bloop({t: f2s(96 + j * 3.4), f: 520 * Math.pow(1.05, j), gain: 0.11, pan: (hash(j, 2) - 0.5) * 0.7, tau: 0.07});
  }
  // the human takes the centre: wood
  S.knock({t: f2s(129), f: 150, gain: 0.2, tau: 0.2});
  // the glass: a glass chime as it comes in, a knock as it settles
  S.bloop({t: f2s(147), f: 520, gain: 0.14, tau: 0.11, sweep: 1.8});
  S.knock({t: f2s(158), f: 240, gain: 0.14, tau: 0.09});
  // understanding: a run that climbs with the camera and rings out
  S.climb({t: f2s(150), dur: f2s(24), f0: 420, f1: 760, n: 7, gain: 0.1, accel: 1.4, spread: 0.35});
  S.chime({t: f2s(176), f: 165, gain: 0.18, tau: 1.3});
  S.sub({t: f2s(176), f: 55, gain: 0.16, tau: 0.35});
  S.reverb(0.2, 0.62);
  S.master(-16);
  S.write(`${OUT_DIR}/NotOurShapeGrid.wav`);
}

// ============================================================ 2 ==========
// QueenTitration — 152f. desc_i = 50 + 1.8i · queen_i = desc_i + 12 ·
// ant_i = queen_i + 18. 44 titrated · 63 queen · 125 in the ant · 139 colony.
{
  const S = new Stem(152 / FPS);
  const N = 36, SPACING = 1.8, FIRST = 50;
  const desc = (i) => FIRST + i * SPACING;
  const queen = (i) => desc(i) + 12;
  const ant = (i) => queen(i) + 18;
  // the pool sagging into the neck: a falling run
  S.climb({t: f2s(18), dur: f2s(28), f0: 620, f1: 330, n: 5, gain: 0.1, accel: 1.3});
  // metering: every second release is a tiny high drop at the mouth — a tap
  for (let i = 0; i < N; i += 2) S.bloop({t: f2s(desc(i)), f: 1100, gain: 0.035, tau: 0.03, q: 6});
  // the first pass through her, on the word: the signature drop, with weight
  S.bloop({t: f2s(queen(0)), f: 420, gain: 0.34, sweep: 2.6, tau: 0.13});
  S.sub({t: f2s(queen(0)), f: 62, gain: 0.26, tau: 0.3});
  // every fourth pass after that
  for (let i = 4; i < N; i += 4) S.bloop({t: f2s(queen(i)), f: 400 * (1 + (hash(i, 3) - 0.5) * 0.12), gain: 0.13, tau: 0.09});
  // ants receiving their share: softer, lower, where they sit
  for (let i = 1; i < N; i += 4) S.bloop({t: f2s(ant(i)), f: 300, gain: 0.09, pan: (hash(i, 8) - 0.5) * 0.9, tau: 0.08});
  // the colony closing up under her: a rising run, then the ring
  S.climb({t: f2s(121), dur: f2s(18), f0: 330, f1: 660, n: 5, gain: 0.09, accel: 1.3, spread: 0.3});
  S.chime({t: f2s(139), f: 147, gain: 0.17, tau: 1.2});
  S.sub({t: f2s(139), f: 58, gain: 0.18, tau: 0.3});
  S.reverb(0.2, 0.62);
  S.master(-16);
  S.write(`${OUT_DIR}/QueenTitration.wav`);
}

// ============================================================ 3 ==========
// FitnessNotIndividualGrid — 203f. 14 ais · 40 similar · 79 structure · 92
// unlike · 111 humans · 130 fitness · 158 inherited · 178 individually.
// Hand-offs: first charge on line h starts at 130 + 5h; steps land 4.06 +
// 6.5s after.
{
  const S = new Stem(203 / FPS);
  // knitting: drops counting up
  for (let j = 0; j < 8; j++) S.bloop({t: f2s(14 + j * 3.1), f: 520 * Math.pow(1.05, j), gain: 0.1, pan: (hash(j, 5) - 0.5) * 0.7, tau: 0.07});
  // levelling: a short rising run
  S.climb({t: f2s(40), dur: f2s(14), f0: 360, f1: 640, n: 4, gain: 0.09});
  // structure settles
  S.knock({t: f2s(79), f: 130, gain: 0.16, tau: 0.16});
  S.sub({t: f2s(79), f: 66, gain: 0.14});
  // the field drops: a falling run into a settle
  S.climb({t: f2s(92), dur: f2s(14), f0: 620, f1: 260, n: 4, gain: 0.1, accel: 0.8});
  S.knock({t: f2s(108), f: 110, gain: 0.18, tau: 0.2});
  S.sub({t: f2s(108), f: 58, gain: 0.18});
  // three humans land: wood, left / centre / right
  [110, 115, 120].forEach((fr, h) => S.knock({t: f2s(fr), f: 170, gain: 0.17, tau: 0.14, pan: (h - 1) * 0.5}));
  // hand-offs: wood stepping down, one per descendant, on each line
  for (let h = 0; h < 3; h++) {
    for (let s = 0; s < 4; s++) {
      S.knock({t: f2s(130 + h * 5 + 4.06 + 6.5 * s), f: 300 * Math.pow(0.84, s), gain: 0.1, tau: 0.09, pan: (h - 1) * 0.5});
    }
  }
  // not inherited individually: the gain crosses the field as a spreading run
  S.climb({t: f2s(162), dur: f2s(26), f0: 380, f1: 720, n: 9, gain: 0.1, accel: 0.8, spread: 0.6});
  S.chime({t: f2s(178), f: 165, gain: 0.18, tau: 1.3});
  S.sub({t: f2s(178), f: 55, gain: 0.2, tau: 0.35});
  S.reverb(0.2, 0.62);
  S.master(-16);
  S.write(`${OUT_DIR}/FitnessNotIndividualGrid.wav`);
}

// ============================================================ 4 ==========
// TrainedAgainstEachOtherGrid — 122f. Pair p starts at 28 + p; a hit every
// half phase; phase(t) = r0 t + (r1 - r0) t² / 2span, then r1 per frame.
// 18 play games · 31 against · 89 really smart.
{
  const S = new Stem(122 / FPS);
  const r0 = 0.05, r1 = 0.17, span = 105 - 31;
  const phase = (t) => (t <= span ? r0 * t + ((r1 - r0) * t * t) / (2 * span) : r0 * span + ((r1 - r0) * span) / 2 + r1 * (t - span));
  const hitsOf = (p) => {
    const start = 28 + p;
    const out = [];
    for (let n = 1; n < 80; n++) {
      let lo = 0, hi = 200;
      for (let it = 0; it < 40; it++) {
        const mid = (lo + hi) / 2;
        if (phase(mid) * 2 < n) lo = mid; else hi = mid;
      }
      const t = start + (lo + hi) / 2;
      if (t > 122) break;
      out.push({frame: t, n});
    }
    return out;
  };
  // squaring up: short drops as pairs lock
  [0, 3, 6, 9, 12].forEach((p, j) => S.bloop({t: f2s(15 + p * 0.9), f: 560, gain: 0.09, pan: (hash(j, 6) - 0.5) * 0.8, tau: 0.06}));
  // one duel carried in full: two voices, left and right, accelerating and
  // thinning as they go so it never becomes a buzz
  hitsOf(0).forEach(({frame, n}) => {
    const prog = clamp01((frame - 28) / 94);
    const isB = n % 2 === 1;
    S.bloop({t: f2s(frame), f: isB ? 560 : 420, gain: 0.17 * (1 - 0.45 * prog), pan: isB ? 0.4 : -0.4, tau: 0.05 * (1 - 0.4 * prog), sweep: 2.0, q: 7});
  });
  // a second duel behind it
  hitsOf(7).forEach(({frame, n}) => {
    const prog = clamp01((frame - 35) / 87);
    S.bloop({t: f2s(frame), f: n % 2 ? 660 : 500, gain: 0.07 * (1 - 0.45 * prog), pan: n % 2 ? -0.2 : 0.25, tau: 0.045, sweep: 2.0, q: 7});
  });
  // getting smarter: a sparse low ladder under the play
  S.climb({t: f2s(34), dur: f2s(66), f0: 220, f1: 440, n: 6, gain: 0.06, tau: 0.12});
  // really smart: the ring, with weight
  S.chime({t: f2s(89), f: 165, gain: 0.18, tau: 1.2});
  S.sub({t: f2s(89), f: 55, gain: 0.2, tau: 0.35});
  S.reverb(0.2, 0.62);
  S.master(-16);
  S.write(`${OUT_DIR}/TrainedAgainstEachOtherGrid.wav`);
}

console.log('done');
