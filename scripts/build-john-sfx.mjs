// SFX stems for the three John Charles Beren cuts — CatchUpInSomeAreas (125f),
// NoExplosiveGrowth (120f) and SeaOfCode (146f). Synthesised, no samples, no
// network, no third-party code.
//
//   bun scripts/build-john-sfx.mjs
//
// Structure follows scripts/build-ajeya-sfx.mjs: a small Stem DSP class that
// renders straight to 48 kHz / 24-bit / stereo `pcm_s24le`, with every cue
// placed from the same beat frames and the same timing formulas the components
// use. The growth-speed curve of cut 1, the ghost launch of cut 2 and the drain
// ease of cut 3 are regenerated here from the components' own constants, so the
// density of the bed and the level of the drain track what is actually moving
// on screen instead of sitting on an even grid.
//
// Palette — everything is rounded, nothing is a transient:
//   grain   a hann-windowed sine (plus a touch of band noise): one dot / one
//           character of code arriving. Never a click.
//   band    time-varying resonant bandpass on noise: the read-wave, the ghost
//           launch, the drain. Centre frequency and Q are keyframed, so a
//           single object can open, rise and narrow.
//   air     wide, very quiet high noise: the camera moving, never on its own.
//   tap     a short rounded body: a key, the lock.
//   thump   low weight under a landing.
//
// Spectral rule for this set: sustained energy lives below ~300 Hz and above
// ~4 kHz so the 300 Hz - 3 kHz band stays clear for the voice-over. Only brief
// taps and the moving sweeps cross it, and never for more than a few frames.
// Stems peak at -16 dBFS, which is stem level and comfortably inside the
// -6 dBFS ceiling.
//
// ONE DEVIATION FROM THE OLDER SFX SCRIPTS, and it is deliberate. MEMORY's
// house rule names ffmpeg `aevalsrc` expression synthesis; the ajeya script
// (the newest approved one) already moved to this in-process engine, and these
// three cuts need what `aevalsrc` cannot express: a bandpass whose centre
// frequency AND bandwidth are keyframed, a stereo width that closes to mono
// over sixty frames, and grain densities driven by a component's own speed
// curve. Everything is still synthesised from first principles in this file —
// no samples, no network, no library. ffmpeg is used only to verify the
// output (ffprobe, volumedetect, astats, showspectrumpic).

import { mkdirSync, writeFileSync } from "node:fs";

const SR = 48000;
const FPS = 24;
const OUT_DIR = "out/sfx";
mkdirSync(OUT_DIR, { recursive: true });

const f2s = (f) => f / FPS;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, u) => a + (b - a) * u;
const smoothstep = (x) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const sat = (x, d = 1.6) => Math.tanh(x * d) / Math.tanh(d);
const fract = (n) => n - Math.floor(n);
const hash = (i, k) => fract(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);

// ---------------------------------------------------------------------------
// The engine.
// ---------------------------------------------------------------------------
class Stem {
  constructor(name, frames) {
    this.name = name;
    this.frames = frames;
    this.n = Math.round((frames / FPS) * SR);
    this.L = new Float64Array(this.n);
    this.R = new Float64Array(this.n);
    this.seed = 2463534242;
    this.cues = [];
  }

  /** Deterministic white noise in [-1, 1]. */
  rnd() {
    let x = this.seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x >>> 0 || 1;
    return (this.seed / 4294967296) * 2 - 1;
  }

  /** Registers a line in the printed cue table. */
  cue(frame, name) {
    this.cues.push({ frame, name });
  }

  add(i, l, r) {
    if (i < 0 || i >= this.n) return;
    this.L[i] += l;
    this.R[i] += r;
  }

  addPan(i, v, pan = 0) {
    // equal-ish power, clamped so a hard pan never exceeds unity on one side
    const p = Math.max(-1, Math.min(1, pan));
    this.add(i, v * Math.min(1, 1 - p), v * Math.min(1, 1 + p));
  }

  /**
   * A grain: a hann-windowed sine with an optional band-noise component.
   * Windowed at both ends, so there is no attack transient at all — this is
   * the piece's only repeating element and it has to stay soft at any density.
   */
  grain({ t, f, dur = 0.03, gain = 0.1, pan = 0, noise = 0, partial = 0 }) {
    const s0 = Math.round(t * SR);
    const N = Math.max(8, Math.round(dur * SR));
    let ph = hash(f, 3) * 6.283;
    let ph2 = hash(f, 7) * 6.283;
    // one-pole highpassed noise so the noisy part sits above the voice band
    let hp = 0;
    let prev = 0;
    const a = Math.exp((-2 * Math.PI * 4200) / SR);
    for (let k = 0; k < N; k++) {
      const u = k / N;
      const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * u);
      ph += (2 * Math.PI * f) / SR;
      ph2 += (2 * Math.PI * f * 2.01) / SR;
      let v = Math.sin(ph) + partial * Math.sin(ph2);
      if (noise > 0) {
        const x = this.rnd();
        hp = a * (hp + x - prev);
        prev = x;
        v += hp * noise;
      }
      this.addPan(s0 + k, v * w * gain, pan);
    }
  }

  /**
   * Band-limited noise through a time-varying resonant bandpass, rendered
   * straight to stereo with a keyframed width. `stages` cascades the filter
   * for steeper skirts, which is what keeps the drain's low body out of the
   * voice band.
   *
   *   f0/f1    centre frequency, start -> end (exponential)
   *   q0/q1    resonance, start -> end (exponential); higher = narrower
   *   width0/1 stereo width, 1 = fully decorrelated, 0 = mono
   *   env(u)   amplitude envelope, 0..1
   *   shape(u) time warp applied to f, q and width (not to env)
   *   hp/lp    fixed brick-ish guard rails (3 cascaded one-poles, ~18 dB/oct).
   *            The SVF's own skirts are only 6 dB/oct per stage, which is not
   *            enough to keep a 5 kHz band out of the voice range; these are.
   */
  band({
    t,
    dur,
    f0,
    f1,
    q0 = 3,
    q1 = 3,
    gain = 0.1,
    env = (u) => Math.sin(Math.PI * u),
    width0 = 1,
    width1 = 1,
    shape = (u) => u,
    stages = 1,
    pan = 0,
    hp = 0,
    lp = 0,
  }) {
    const s0 = Math.round(t * SR);
    const N = Math.max(16, Math.round(dur * SR));
    const st = [];
    for (let c = 0; c < 2; c++) {
      st.push([]);
      for (let s = 0; s < stages; s++) st[c].push({ low: 0, band: 0 });
    }
    const GUARD = 3;
    const ahp = hp ? Math.exp((-2 * Math.PI * hp) / SR) : 0;
    const alp = lp ? 1 - Math.exp((-2 * Math.PI * lp) / SR) : 0;
    const hpS = [[], []];
    const lpS = [[], []];
    for (let c = 0; c < 2; c++) {
      for (let s = 0; s < GUARD; s++) {
        hpS[c].push({ x: 0, y: 0 });
        lpS[c].push(0);
      }
    }
    const guard = (c, x) => {
      let v = x;
      if (hp) {
        for (let s = 0; s < GUARD; s++) {
          const z = hpS[c][s];
          z.y = ahp * (z.y + v - z.x);
          z.x = v;
          v = z.y;
        }
      }
      if (lp) {
        for (let s = 0; s < GUARD; s++) {
          lpS[c][s] += alp * (v - lpS[c][s]);
          v = lpS[c][s];
        }
      }
      return v;
    };
    for (let k = 0; k < N; k++) {
      const u = k / N;
      const w = clamp01(shape(u));
      const fc = Math.min(13000, f0 * Math.pow(f1 / f0, w));
      const q = q0 * Math.pow(q1 / q0, w);
      const ff = 2 * Math.sin((Math.PI * fc) / SR);
      const qq = 1 / q;
      const width = lerp(width0, width1, w);
      const e = env(u) * gain;
      // keep the perceived level roughly flat as Q moves
      const norm = Math.pow(q, -0.62) * Math.pow(stages, -0.35) * 1.9;
      const out = [0, 0];
      for (let c = 0; c < 2; c++) {
        let x = this.rnd();
        for (let s = 0; s < stages; s++) {
          const z = st[c][s];
          z.low += ff * z.band;
          const high = x - z.low - qq * z.band;
          z.band += ff * high;
          x = z.band;
        }
        // Saturate BEFORE the guard rails, never after: tanh on a resonant
        // band centred at 250 Hz throws harmonics at 500 / 750 / 1000 Hz, and
        // those land in the voice band. Filtering after the non-linearity is
        // the only thing that removes them.
        out[c] = guard(c, sat(x * norm, 1.2));
      }
      const mid = (out[0] + out[1]) * 0.5;
      const l = mid + (out[0] - mid) * width;
      const r = mid + (out[1] - mid) * width;
      const p = Math.max(-1, Math.min(1, pan));
      this.add(s0 + k, l * e * Math.min(1, 1 - p), r * e * Math.min(1, 1 + p));
    }
  }

  /** A rounded body with a pitch dip: a key, or the lock landing. */
  tap({ t, f, gain = 0.1, pan = 0, tau = 0.035, bright = 0.35 }) {
    const s0 = Math.round(t * SR);
    const N = Math.round(tau * 7 * SR);
    let ph = 0;
    let ph2 = 0;
    for (let k = 0; k < N; k++) {
      const tt = k / SR;
      const dip = 1 + 0.14 * Math.exp(-tt / 0.006);
      ph += (2 * Math.PI * f * dip) / SR;
      ph2 += (2 * Math.PI * f * 2.71 * dip) / SR;
      const v =
        Math.sin(ph) * Math.exp(-tt / tau) +
        bright * Math.sin(ph2) * Math.exp(-tt / (tau * 0.3));
      // 1.5 ms raised-cosine attack: no edge, no click
      const atk = tt < 0.0015 ? 0.5 - 0.5 * Math.cos((Math.PI * tt) / 0.0015) : 1;
      this.addPan(s0 + k, sat(v * 0.8) * atk * gain, pan);
    }
  }

  /** Low weight under a landing. */
  thump({ t, f = 52, gain = 0.2, tau = 0.22 }) {
    const s0 = Math.round(t * SR);
    const N = Math.round(tau * 6 * SR);
    let ph = 0;
    for (let k = 0; k < N; k++) {
      const tt = k / SR;
      ph += (2 * Math.PI * f * (1 + 0.42 * Math.exp(-tt / 0.03))) / SR;
      const atk = tt < 0.006 ? 0.5 - 0.5 * Math.cos((Math.PI * tt) / 0.006) : 1;
      this.addPan(s0 + k, sat(Math.sin(ph), 1.3) * Math.exp(-tt / tau) * atk * gain, 0);
    }
  }

  /** A sustained tone, for the growth lift and the sea's hum. Sub-300 Hz. */
  tone({ t, dur, f0, f1 = f0, gain = 0.06, env = (u) => Math.sin(Math.PI * u), partial = 0.3, shape = (u) => u }) {
    const s0 = Math.round(t * SR);
    const N = Math.round(dur * SR);
    let ph = 0;
    let ph2 = 0;
    for (let k = 0; k < N; k++) {
      const u = k / N;
      const f = f0 * Math.pow(f1 / f0, clamp01(shape(u)));
      ph += (2 * Math.PI * f) / SR;
      ph2 += (2 * Math.PI * f * 1.5) / SR;
      const v = Math.sin(ph) + partial * Math.sin(ph2);
      this.addPan(s0 + k, v * env(u) * gain, 0);
    }
  }

  /**
   * Camera air: wide, high, barely there. Always under something else, and
   * guarded at 4.2 kHz so a whole second of it never touches the voice band.
   */
  air({ t, dur, gain = 0.05, f0 = 5200, f1 = 8000, width = 1, peak = 0.45 }) {
    this.band({
      t,
      dur,
      f0,
      f1,
      q0: 1.3,
      q1: 1.3,
      gain,
      width0: width,
      width1: width,
      env: (u) =>
        u < peak
          ? smoothstep(u / peak)
          : smoothstep(1 - (u - peak) / (1 - peak)),
      stages: 2,
      hp: 4200,
    });
  }

  /** DC block, gentle top smoothing, peak normalise, fades. */
  master(peakDb = -16, fadeFrames = 3) {
    // one-pole high-pass at 22 Hz: kills any DC the summed envelopes leave
    const rc = Math.exp((-2 * Math.PI * 22) / SR);
    let xl = 0, yl = 0, xr = 0, yr = 0;
    // one-pole low-pass at 14 kHz: takes the edge off the grains
    const a = 1 - Math.exp((-2 * Math.PI * 14000) / SR);
    let ll = 0, lr = 0;
    for (let k = 0; k < this.n; k++) {
      const il = this.L[k], ir = this.R[k];
      yl = rc * (yl + il - xl); xl = il;
      yr = rc * (yr + ir - xr); xr = ir;
      ll += a * (yl - ll);
      lr += a * (yr - lr);
      this.L[k] = ll;
      this.R[k] = lr;
    }
    // fades: silence at both ends
    const fn = Math.round(f2s(fadeFrames) * SR);
    for (let k = 0; k < fn; k++) {
      const w = 0.5 - 0.5 * Math.cos((Math.PI * k) / fn);
      this.L[k] *= w;
      this.R[k] *= w;
      const j = this.n - 1 - k;
      this.L[j] *= w;
      this.R[j] *= w;
    }
    // remove any residual DC exactly, then normalise
    let dl = 0, dr = 0;
    for (let k = 0; k < this.n; k++) { dl += this.L[k]; dr += this.R[k]; }
    dl /= this.n; dr /= this.n;
    let peak = 0;
    for (let k = 0; k < this.n; k++) {
      this.L[k] -= dl;
      this.R[k] -= dr;
      peak = Math.max(peak, Math.abs(this.L[k]), Math.abs(this.R[k]));
    }
    const g = Math.pow(10, peakDb / 20) / Math.max(peak, 1e-9);
    for (let k = 0; k < this.n; k++) {
      this.L[k] *= g;
      this.R[k] *= g;
    }
    // re-apply the fades so the very first and last samples are dead zero
    for (let k = 0; k < fn; k++) {
      const w = 0.5 - 0.5 * Math.cos((Math.PI * k) / fn);
      this.L[k] *= w;
      this.R[k] *= w;
      const j = this.n - 1 - k;
      this.L[j] *= w;
      this.R[j] *= w;
    }
    this.peakDb = 20 * Math.log10(Math.max(...[peak * g, 1e-9]));
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
    h.write("RIFF", 0);
    h.writeUInt32LE(36 + data.length, 4);
    h.write("WAVE", 8);
    h.write("fmt ", 12);
    h.writeUInt32LE(16, 16);
    h.writeUInt16LE(1, 20);
    h.writeUInt16LE(2, 22);
    h.writeUInt32LE(SR, 24);
    h.writeUInt32LE(SR * 6, 28);
    h.writeUInt16LE(6, 32);
    h.writeUInt16LE(24, 34);
    h.write("data", 36);
    h.writeUInt32LE(data.length, 40);
    writeFileSync(path, Buffer.concat([h, data]));
  }

  report(path) {
    console.log(`\n${this.name}  ${this.frames}f  ${(this.frames / FPS).toFixed(4)}s  peak ${this.peakDb.toFixed(2)} dBFS`);
    console.log(`  ${path}`);
    console.log("  frame   sec     cue");
    this.cues
      .slice()
      .sort((a, b) => a.frame - b.frame)
      .forEach(({ frame, name }) => {
        console.log(
          `  ${String(frame).padStart(5)}  ${f2s(frame).toFixed(3).padStart(6)}  ${name}`,
        );
      });
  }
}

// ===========================================================================
// CUT 1 — CatchUpInSomeAreas, 125 frames.
//
// Geometry regenerated from the component: the creep/lobe speed curve is the
// same `rise()` the columns grow on, so the bed's grain density IS the growth
// rate. Cues: wave f34-66, camera f38-64, lobe f66-88, lock f88, shorts f96.
// ===========================================================================
{
  const S = new Stem("CatchUpInSomeAreas", 125);
  const GROW_F0 = 66; // beats.ofCatch (72) - GROW_LEAD (6)
  const LOCK_L = 22; // beats.some (88) - GROW_F0
  const SHORT_L = 30; // LOCK_L + SHORT_TAIL (8)
  const CREEP_SHARE = 0.28;
  const TAIL_SHARE = 0.16;
  const creep = CREEP_SHARE / GROW_F0;
  const lockPeak = (1 - CREEP_SHARE - 0.5 * LOCK_L * creep) / (0.5 * LOCK_L);
  const shortTail = TAIL_SHARE / (125 - 1 - (GROW_F0 + SHORT_L));
  const shortPeak =
    (1 - CREEP_SHARE - TAIL_SHARE - SHORT_L * (creep + 0.5 * (shortTail - creep))) /
    (0.5 * SHORT_L);
  // the component's own v(u) = creep + (tail-creep)*S(u) + peak*sin^2(pi u)
  const speed = (f, L, tail, peak) => {
    if (f < GROW_F0) return creep;
    const u = (f - GROW_F0) / L;
    if (u > 1) return tail;
    return creep + (tail - creep) * smoothstep(u) + peak * Math.sin(Math.PI * u) ** 2;
  };
  // three lockers, three shorts; a locked column stops growing at f88
  const growthRate = (f) =>
    0.5 * (f >= 88 ? 0 : speed(f, LOCK_L, 0, lockPeak)) +
    0.5 * speed(f, SHORT_L, shortTail, shortPeak);

  const COL_PAN = [-0.78, -0.47, -0.16, 0.16, 0.47, 0.78]; // the six column axes

  // -- the creep bed, f0-f124 -----------------------------------------------
  // One grain per row arriving. Density follows growthRate exactly, so the bed
  // is sparse under the setup, dense through the lobe and sparse again after.
  S.cue(0, "creep bed in (density = growth rate)");
  {
    let f = 0;
    let i = 0;
    while (f < 124) {
      const rate = 2.1 + 205 * growthRate(f); // grains per second
      f += FPS / rate / (0.72 + 0.56 * hash(i, 1));
      if (f >= 124) break;
      const c = Math.floor(hash(i, 2) * 6);
      const hi = hash(i, 3) > 0.3;
      S.grain({
        t: f2s(f),
        f: hi ? 4600 * Math.pow(2, hash(i, 4) * 1.05) : 104 * Math.pow(2, hash(i, 5) * 0.8),
        dur: hi ? 0.016 + 0.012 * hash(i, 6) : 0.05 + 0.03 * hash(i, 7),
        gain: (hi ? 0.045 : 0.08) * (0.6 + 0.4 * hash(i, 8)),
        pan: COL_PAN[c] * 0.85,
        noise: hi ? 0.5 : 0,
      });
      i++;
    }
  }

  // -- the read-wave, f34-f66 ------------------------------------------------
  // One front rising from under the floor. Centre frequency climbs from under
  // the stacks to above them and keeps going, so it is gone off the top of the
  // spectrum as it is gone off the top of the world. It crosses the voice band
  // in about 8 frames, in motion, and never sits there.
  S.cue(34, "read-wave rises from below the floor");
  S.cue(54, "wave clears the tallest stack top");
  S.band({
    t: f2s(34),
    dur: f2s(32),
    f0: 78,
    f1: 7400,
    q0: 3.2,
    q1: 5.0,
    gain: 0.40,
    width0: 0.5,
    width1: 1,
    stages: 3,
    shape: (u) => Math.pow(u, 0.82),
    env: (u) => smoothstep(u / 0.18) * (u < 0.6 ? 1 : 1 - smoothstep((u - 0.6) / 0.4)),
  });
  // the body under it: a sine glide that stops at the top of the stacks
  S.tone({
    t: f2s(34),
    dur: f2s(24),
    f0: 46,
    f1: 205,
    gain: 0.055,
    partial: 0.22,
    shape: (u) => Math.pow(u, 0.8),
    env: (u) => smoothstep(u / 0.2) * (1 - smoothstep(Math.max(0, u - 0.6) / 0.4)),
  });

  // -- the pull-back, f40-f64 ------------------------------------------------
  S.cue(40, "camera pull-back air (k 1.10 -> 0.95)");
  S.air({ t: f2s(40), dur: f2s(24), gain: 0.05, f0: 5000, f1: 8200, peak: 0.42 });

  // -- the acceleration lobe, f66-f88 ---------------------------------------
  // The bed thickens on its own; this is the lift under it. Stays sub-300 Hz.
  S.cue(66, "growth lobe: rising tone under the bed");
  S.tone({
    t: f2s(66),
    dur: f2s(23),
    f0: 62,
    f1: 172,
    gain: 0.075,
    partial: 0.34,
    shape: (u) => smoothstep(u * 0.94),
    env: (u) => smoothstep(u / 0.3) * (u < 0.82 ? 1 : 1 - smoothstep((u - 0.82) / 0.18)),
  });
  // A thin high shimmer that rises with it, so the lobe has two ends. It
  // crescendos all the way into the lock and is cut off by it — the lock is
  // the peak of the piece, not a second event after a wash.
  S.band({
    t: f2s(66),
    dur: f2s(22.5),
    f0: 4600,
    f1: 9400,
    q0: 3.2,
    q1: 6.5,
    gain: 0.26,
    width0: 1,
    width1: 0.45,
    stages: 2,
    hp: 4200,
    env: (u) => smoothstep(u / 0.4) * Math.pow(0.18 + 0.82 * u, 1.35) * (1 - smoothstep(Math.max(0, u - 0.94) / 0.06)),
  });

  // -- the LOCK, f88 ---------------------------------------------------------
  // The beat of the piece. One rounded tap with weight under it, and a second
  // much quieter tap a frame later so three columns read as landing together.
  S.cue(88, "LOCK: three columns land flush (tap + thump)");
  S.tap({ t: f2s(88), f: 268, gain: 0.5, tau: 0.052, bright: 0.3, pan: -0.2 });
  S.tap({ t: f2s(88), f: 402, gain: 0.22, tau: 0.03, bright: 0.22, pan: 0.42 });
  S.thump({ t: f2s(88), f: 54, gain: 0.42, tau: 0.26 });
  S.cue(89, "LOCK echo: the third column settles");
  S.tap({ t: f2s(89), f: 320, gain: 0.13, tau: 0.036, bright: 0.18, pan: 0.15 });

  // -- the shorts easing out, f96 -------------------------------------------
  // Kept, but much softer than the lock and with no top end: the short columns
  // do not stop, they come off the lobe. A settle, not a landing.
  S.cue(96, "short columns ease off the lobe (soft settle)");
  S.tap({ t: f2s(96), f: 146, gain: 0.1, tau: 0.06, bright: 0.06, pan: 0.28 });
  S.thump({ t: f2s(96), f: 46, gain: 0.075, tau: 0.2 });

  S.master(-16, 3);
  const path = `${OUT_DIR}/CatchUpInSomeAreas-sfx.wav`;
  S.write(path);
  S.report(path);
}

// ===========================================================================
// CUT 2 — NoExplosiveGrowth, 120 frames.
//
// Camera keyed f8-24 (visible f11-30). Ghost launch on beats.explosive (32),
// GHOST_DUR 24 so it draws f32-56 with the six heads crossing the frame edge
// f37-f42. Group dissolve f82 -> knee f91 -> out f96.
// ===========================================================================
{
  const S = new Stem("NoExplosiveGrowth", 120);
  const COL_PAN = [-0.78, -0.47, -0.16, 0.16, 0.47, 0.78];

  // -- the creep bed, f0-f119 ------------------------------------------------
  // Half cut 1's tail rate and flat: only the three short columns are alive.
  S.cue(0, "creep bed in (three short columns only)");
  {
    let f = 0;
    let i = 0;
    while (f < 119) {
      f += FPS / 5.6 / (0.7 + 0.6 * hash(i, 11));
      if (f >= 119) break;
      const c = [1, 3, 5][Math.floor(hash(i, 12) * 3)];
      const hi = hash(i, 13) > 0.32;
      S.grain({
        t: f2s(f),
        f: hi ? 4700 * Math.pow(2, hash(i, 14) * 1.0) : 100 * Math.pow(2, hash(i, 15) * 0.8),
        dur: hi ? 0.017 + 0.011 * hash(i, 16) : 0.05 + 0.03 * hash(i, 17),
        gain: (hi ? 0.062 : 0.105) * (0.6 + 0.4 * hash(i, 18)),
        pan: COL_PAN[c] * 0.85,
        noise: hi ? 0.5 : 0,
      });
      i++;
    }
  }

  // -- the pull-back, f8-f30 -------------------------------------------------
  S.cue(8, "camera pull-back air (k 0.95 -> 0.80)");
  S.air({ t: f2s(8), dur: f2s(22), gain: 0.05, f0: 4900, f1: 8000, peak: 0.44 });

  // -- the ghost launch, f32-f50 --------------------------------------------
  // Six dashed plans leaving upward on one shared ease. Six thin layers, one
  // per column, staggered under a frame so they read as one launch; each rises
  // in centre frequency on the component's own Easing.out(cubic) and fades to
  // nothing as its head crosses the frame edge (f37 for the tallest column,
  // f42 for the shortest). No impact — nothing lands.
  S.cue(32, "six ghost stacks launch upward");
  S.cue(37, "first head leaves the frame");
  S.cue(42, "last head leaves the frame");
  const HEAD_OUT = [37, 42, 38, 41, 37, 43]; // tallest column first, per REST/LOCK tops
  for (let c = 0; c < 6; c++) {
    const start = 32 + c * 0.35;
    const dur = HEAD_OUT[c] + 6 - start; // the trail outlives the head a little
    S.band({
      t: f2s(start),
      dur: f2s(dur),
      f0: 430 * Math.pow(1.11, c),
      f1: 9200 * Math.pow(1.04, c),
      q0: 3.4,
      q1: 6.5,
      gain: 0.165,
      pan: COL_PAN[c] * 0.7,
      width0: 0.4,
      width1: 0.95,
      stages: 3,
      // the component's Easing.out(cubic) on the draw
      shape: (u) => 1 - Math.pow(1 - u, 3),
      env: (u) => smoothstep(u / 0.16) * (1 - smoothstep(Math.max(0, u - 0.4) / 0.6)),
    });
    // a thin tone with it, so six layers read as several things and not one
    S.tone({
      t: f2s(start),
      dur: f2s(dur * 0.72),
      f0: 88 * Math.pow(1.09, c),
      f1: 290 * Math.pow(1.05, c),
      gain: 0.028,
      partial: 0.18,
      shape: (u) => 1 - Math.pow(1 - u, 3),
      env: (u) => smoothstep(u / 0.2) * (1 - smoothstep(Math.max(0, u - 0.3) / 0.7)),
    });
  }

  // -- the hold, f56-f82 -----------------------------------------------------
  S.cue(56, "hold — bed only, the plan is read");

  // -- the dissolve, f82-f96 -------------------------------------------------
  // A descending exhale that goes out with them. Starts high and wide, falls
  // and narrows, and most of its level is gone before it reaches the voice
  // band. Nothing lands: the plan simply is not there any more.
  S.cue(82, "ghosts dissolve: descending exhale");
  S.cue(96, "ghosts out");
  S.band({
    t: f2s(82),
    dur: f2s(15),
    f0: 8400,
    f1: 1450,
    q0: 2.8,
    q1: 4.2,
    gain: 0.1,
    width0: 1,
    width1: 0.3,
    stages: 3,
    shape: (u) => smoothstep(u),
    env: (u) => smoothstep(u / 0.14) * Math.pow(1 - smoothstep(Math.max(0, u - 0.08) / 0.92), 1.7),
  });
  S.tone({
    t: f2s(82),
    dur: f2s(14),
    f0: 190,
    f1: 68,
    gain: 0.05,
    partial: 0.2,
    shape: (u) => smoothstep(u),
    env: (u) => smoothstep(u / 0.2) * (1 - smoothstep(Math.max(0, u - 0.15) / 0.85)),
  });

  S.master(-16, 3);
  const path = `${OUT_DIR}/NoExplosiveGrowth-sfx.wav`;
  S.write(path);
  S.report(path);
}

// ===========================================================================
// CUT 3 — SeaOfCode, 146 frames.
//
// Typing f0-19 (six rows ~3 frames apart) then one row at f26, f52, f78, f104,
// f130. The model's front f20-66. Camera 1 f22-50. THE DRAIN f74-134, level
// driven by the component's own ease s = 1 - smoothstep(u^1.3), which peaks at
// f112 on "times more". Camera 2 f104-134.
// ===========================================================================
{
  const S = new Stem("SeaOfCode", 146);

  // -- the person typing -----------------------------------------------------
  // One small cluster per row: three rounded keys about a frame apart. Quiet,
  // and identical at every row, because the rate never changes whatever the
  // sea does — that is the whole argument.
  const typeCluster = (f0, gain = 1) => {
    for (let j = 0; j < 3; j++) {
      const f = f0 + j * (0.9 + 0.5 * hash(f0 + j, 21));
      S.tap({
        t: f2s(f),
        f: 2050 * Math.pow(2, (hash(f0 + j, 22) - 0.5) * 0.42),
        gain: 0.052 * gain * (0.75 + 0.35 * hash(f0 + j, 23)),
        tau: 0.009,
        bright: 0.2,
        pan: (hash(f0 + j, 24) - 0.5) * 0.22,
      });
      S.grain({
        t: f2s(f),
        f: 168,
        dur: 0.026,
        gain: 0.045 * gain,
        pan: (hash(f0 + j, 25) - 0.5) * 0.2,
      });
    }
  };
  [0, 3, 6, 9, 12, 15].forEach((f, i) => {
    S.cue(f, `person types row ${i + 1}`);
    typeCluster(f);
  });
  [26, 52, 78, 104, 130].forEach((f, i) => {
    S.cue(f, `person types row ${i + 7}`);
    typeCluster(f, i >= 3 ? 1.25 : 1); // a touch up under the drain so it survives
  });

  // -- the model writing outward, f20-f66 -----------------------------------
  // A granular texture that swells from a point and widens in stereo. Density
  // follows the front's own 1-(1-u)^1.5 radius profile (fast early, slowing),
  // peaks f44-50 and settles into the hum.
  S.cue(20, "model's front: granular writing swells from a point");
  S.cue(44, "writing texture at its widest / densest");
  {
    const frontR = (f) => {
      const u = clamp01((f - 20) / 46);
      return 1 - Math.pow(1 - u, 1.5);
    };
    let f = 20;
    let i = 0;
    // density rises with the circumference being written: up fast to a peak
    // over f44-50, then down to a low even floor that is the hum's texture
    const dens = (f) =>
      f < 47
        ? 12 + 148 * smoothstep((f - 20) / 24)
        : 12 + 148 * (1 - 0.86 * smoothstep((f - 47) / 19));
    while (f < 70) {
      f += FPS / dens(f) / (0.6 + 0.8 * hash(i, 31));
      if (f >= 70) break;
      const rr = frontR(f);
      const width = clamp01(rr / 0.72); // narrow to wide
      const hi = hash(i, 32) > 0.34;
      // level swells with the density and settles with it: one arc, peak f47
      const swell = 0.34 + 0.66 * (f < 47 ? smoothstep((f - 20) / 25) : 1 - 0.7 * smoothstep((f - 47) / 19));
      S.grain({
        t: f2s(f),
        f: hi
          ? 4400 * Math.pow(2, hash(i, 33) * 1.15)
          : 118 * Math.pow(2, hash(i, 34) * 0.9),
        dur: hi ? 0.012 + 0.01 * hash(i, 35) : 0.035 + 0.025 * hash(i, 36),
        gain: (hi ? 0.038 : 0.055) * swell * (0.5 + 0.5 * hash(i, 37)),
        pan: (hash(i, 38) * 2 - 1) * width * 0.92,
        noise: hi ? 0.55 : 0,
      });
      i++;
    }
  }
  // the settled hum the hold sits on: low, even, and it is the thing the drain
  // later reverses
  S.cue(66, "sea settles into a low even hum");
  S.tone({
    t: f2s(58),
    dur: f2s(36),
    f0: 68,
    f1: 74,
    gain: 0.032,
    partial: 0.34,
    env: (u) => smoothstep(u / 0.3) * (u < 0.62 ? 1 : 1 - smoothstep((u - 0.62) / 0.38)),
  });

  // -- camera 1, f22-f50 -----------------------------------------------------
  S.cue(22, "camera pull-back air (k 1.8 -> 0.75)");
  S.air({ t: f2s(22), dur: f2s(28), gain: 0.042, f0: 3200, f1: 6800, peak: 0.4 });

  // -- THE DRAIN, f74-f134 ---------------------------------------------------
  // The main sound. The hum reverses into a suction: two bands, a body under
  // the voice and an air above it, both rising in centre frequency and
  // narrowing in Q as the sea contracts, stereo width closing from fully wide
  // to mono. Level is the component's own |ds/df|, so it peaks at f112 on
  // "times more" and decelerates monotonically into the close.
  const DR0 = 74;
  const DRL = 60; // f74 -> f134
  const sOf = (f) => 1 - smoothstep(Math.pow(clamp01((f - DR0) / DRL), 1.3));
  const dsdf = (f) => {
    const h = 0.25;
    return Math.abs(sOf(f + h) - sOf(f - h)) / (2 * h);
  };
  const DS_MAX = (() => {
    let m = 0;
    for (let f = DR0; f <= DR0 + DRL; f += 0.25) m = Math.max(m, dsdf(f));
    return m;
  })();
  const drainEnv = (u) => {
    const f = DR0 + u * DRL;
    // 0..1 following the contraction speed, with a soft lead-in so the drain
    // starts as a breath rather than switching on
    return Math.pow(dsdf(f) / DS_MAX, 0.72) * smoothstep(u / 0.1);
  };
  S.cue(74, "THE DRAIN begins — the hum reverses into suction");
  S.cue(112, "drain at peak speed (\"times more\")");
  // body: 96 Hz -> 250 Hz, narrowing, wide -> mono. Two stages so its skirts
  // stay out of the voice band for the whole sixty frames.
  S.band({
    t: f2s(DR0),
    dur: f2s(DRL + 2),
    f0: 96,
    f1: 252,
    q0: 1.9,
    q1: 7.5,
    gain: 0.62,
    width0: 1,
    width1: 0.04,
    stages: 3,
    lp: 420,
    shape: (u) => smoothstep(Math.pow(u, 0.9)),
    env: drainEnv,
  });
  // air: 3.9 kHz -> 10.5 kHz, narrowing hard, wide -> mono. This is the part
  // that reads as "being pulled in" rather than as a rumble.
  S.band({
    t: f2s(DR0),
    dur: f2s(DRL + 2),
    f0: 3900,
    f1: 10500,
    q0: 2.2,
    q1: 6.2,
    gain: 0.3,
    width0: 1,
    width1: 0.03,
    stages: 2,
    hp: 4000,
    shape: (u) => Math.pow(u, 1.15),
    env: (u) => drainEnv(u) * (0.58 + 0.42 * u),
  });
  // grains being pulled past: they thin and converge to the centre as the sea
  // gets smaller, which is exactly what the death-scale scheme does on screen
  {
    let f = DR0;
    let i = 0;
    while (f < 132) {
      const u = clamp01((f - DR0) / DRL);
      const dens = 9 + 58 * Math.pow(dsdf(f) / DS_MAX, 0.8);
      f += FPS / dens / (0.6 + 0.8 * hash(i, 41));
      if (f >= 132) break;
      const uu = clamp01((f - DR0) / DRL);
      const width = 1 - smoothstep(uu * 1.05);
      const hi = hash(i, 42) > 0.42;
      S.grain({
        t: f2s(f),
        f: hi
          ? 4600 * Math.pow(2, hash(i, 43) * 1.2 + uu * 0.7)
          : 120 * Math.pow(2, hash(i, 44) * 0.7 + uu * 0.6),
        dur: hi ? 0.011 + 0.008 * hash(i, 45) : 0.03 + 0.02 * hash(i, 46),
        gain: (hi ? 0.02 : 0.026) * (0.5 + 0.5 * hash(i, 47)),
        pan: (hash(i, 48) * 2 - 1) * width * 0.95,
        noise: hi ? 0.5 : 0,
      });
      i++;
    }
  }

  // -- camera 2, f104-f140 ---------------------------------------------------
  S.cue(104, "camera push-in air (k 0.75 -> 1.1)");
  S.air({ t: f2s(104), dur: f2s(34), gain: 0.03, f0: 4200, f1: 7200, peak: 0.5, width: 0.5 });

  // -- the close, f130-f134 --------------------------------------------------
  // The last bars go in. A soft low thump and one rounded body, no top end:
  // the sea arrives, it does not hit anything.
  S.cue(130, "last bars go in");
  S.thump({ t: f2s(130.5), f: 44, gain: 0.42, tau: 0.34 });
  S.tap({ t: f2s(131), f: 132, gain: 0.11, tau: 0.09, bright: 0.05 });
  S.cue(134, "closed — tail only");

  S.master(-16, 3);
  const path = `${OUT_DIR}/SeaOfCode-sfx.wav`;
  S.write(path);
  S.report(path);
}

console.log("");
