// SFX stems for the three cuts of `JohnCharlesBeren_Claude_Distilled` —
// LowerAfterRL, SameCharacterNames and ClaudeifiedByRL. Synthesised, no
// samples, no network, no third-party code.
//
//   bun scripts/build-claude-distilled-sfx.mjs
//
// The engine below is `scripts/build-john-sfx.mjs`'s, copied verbatim: a small
// Stem DSP class that renders straight to 48 kHz / 24-bit / stereo `pcm_s24le`,
// with every cue placed from the same beat frames and the same timing formulas
// the components use. What is new is the geometry section: the three components
// share one seat generator (a feathered superellipse blob rejection-sampled off
// `fieldShared`'s `hash`, `wobble` and `feather`, ranked into a three-wide
// column), and this script regenerates it exactly — the same hash, the same
// rejection order, the same minimum separation — so a blob-arrival shower is
// the component's own arrival histogram and a comb grain lands on the frame
// that dot's own world y crosses the RL line, not on an even grid.
//
// Palette — everything is rounded, nothing is a transient:
//   grain   a hann-windowed sine (plus a touch of band noise): one dot / one
//           packet / one bar arriving. Never a click.
//   band    time-varying resonant bandpass on noise: a thread being drawn, the
//           fold, the RL line, the descent. Centre frequency and Q are
//           keyframed, so a single object can open, fall and narrow.
//   air     wide, very quiet high noise: the camera moving, never on its own.
//   tap     a short rounded body: a mark seating, the line's head landing.
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
// moved to this in-process engine, the john script kept it, and these three
// cuts need what `aevalsrc` cannot express: a bandpass whose centre frequency
// AND bandwidth are keyframed (the fold), a stereo width driven per cue, and
// grain densities driven by a component's own arrival and crossing histograms.
// Everything is still synthesised from first principles in this file — no
// samples, no network, no library. ffmpeg is used only to verify the output
// (ffprobe, volumedetect, astats, showspectrumpic).

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
// The components' own geometry, regenerated.
//
// All three cuts draw their outputs with one seat generator (cut 1's, copied
// into cut 3 with a different blob y): 64 seats per model rejection-sampled
// out of a superellipse's bounding box, kept only if `hash(i, 71 + m)` falls
// under the feathered edge density and if the seat is at least MIN_SEP from
// every seat already taken — including the seats of the models sampled before
// it, which is why the three blobs have to be generated in the same order the
// component generates them or the arrival histogram is a different histogram.
//
// `hash`, `wobble`, `feather` and `smoothstep` here are `fieldShared`'s, to the
// digit. The engine's own `hash` above is the same function, so the seats come
// out identical to the ones the renderer draws.
// ---------------------------------------------------------------------------
const wobble = (along, seed) =>
  1.2 * Math.sin(along * 0.05 + seed) + 0.7 * Math.sin(along * 0.13 + seed * 2.1);
const WOBBLE_R = 100;
const feather = (insideSteps, width) => clamp01(smoothstep(insideSteps / width));

const SEAT_STEP = 11;
const BLOB_FEATHER = 3;
const MIN_SEP = 16;
const EDGE_WOBBLE = 1.8;
const BLOB_N = 64;
const BLOB_A = 115;
const BLOB_B = 90;
const BLOB_POW = 2.4;
const COL_DX = 13;
const COL_WIDE = 3;
const COL_PITCH = 14;

// v3 pass: the spray's flights are a smoothstep (`flightEase`) plus two frames
// (`FLIGHT_EXTRA`), added to `dur` and never to `t0`. A dot therefore LEAVES on
// exactly the frame it always left on and LANDS two frames later — and it is
// the landing an arrival grain is on, so both arrival histograms move by two.
const FLIGHT_EXTRA = 2;

/**
 * The seat field of one cut. `xs` are the three model axes, `blobCy` the blob
 * centre, `colTop` the column's top row and `markBottom` the y a dot leaves
 * from. Returns, per seat: its blob seat (fx, fy), its depth v, its column seat
 * (cx, cy), which model it belongs to, and the hash index the component used —
 * everything an arrival time or a crossing frame is computed from.
 */
const seatField = ({ xs, blobCy, colTop, markBottom }) => {
  const blobTop = blobCy - BLOB_B;
  const out = [];
  for (let m = 0; m < xs.length; m++) {
    const cxm = xs[m];
    const mine = [];
    for (let i = 0; mine.length < BLOB_N && i < 60000; i++) {
      const dx = (2 * hash(i, 20 + m * 3) - 1) * BLOB_A;
      const dy = (2 * hash(i, 21 + m * 3) - 1) * BLOB_B;
      const x = cxm + dx;
      const y = blobCy + dy;
      const r = Math.pow(
        Math.pow(Math.abs(dx) / BLOB_A, BLOB_POW) + Math.pow(Math.abs(dy) / BLOB_B, BLOB_POW),
        1 / BLOB_POW,
      );
      const d = Math.hypot(dx, dy);
      const toEdge = r < 1e-6 ? BLOB_B : d * (1 / r - 1);
      const inSteps =
        (toEdge + wobble(Math.atan2(dy, dx) * WOBBLE_R, 0.9 + m) * EDGE_WOBBLE) / SEAT_STEP;
      if (hash(i, 71 + m) >= feather(inSteps, BLOB_FEATHER)) continue;
      let clash = false;
      for (const s of out) {
        if (Math.hypot(s.fx - x, s.fy - y) < MIN_SEP) {
          clash = true;
          break;
        }
      }
      if (!clash) {
        for (const s of mine) {
          if (Math.hypot(s.x - x, s.y - y) < MIN_SEP) {
            clash = true;
            break;
          }
        }
      }
      if (clash) continue;
      mine.push({ x, y, v: (y - blobTop) / (2 * BLOB_B), i });
    }
    const rank = mine.map((_, n) => n).sort((a, b) => mine[a].y - mine[b].y);
    for (let r = 0; r < rank.length; r += COL_WIDE) {
      const row = rank.slice(r, r + COL_WIDE).sort((a, b) => mine[a].x - mine[b].x);
      row.forEach((n, j) => {
        rank[r + j] = n;
      });
    }
    rank.forEach((n, r) => {
      const s = mine[n];
      const row = Math.floor(r / COL_WIDE);
      const i = s.i;
      const sx = cxm + (hash(i, 30 + m) - 0.5) * 70;
      out.push({
        m,
        i,
        fx: s.x,
        fy: s.y,
        v: s.v,
        cx:
          cxm +
          ((r % COL_WIDE) - (Math.min(COL_WIDE, rank.length - row * COL_WIDE) - 1) / 2) * COL_DX,
        cy: colTop + row * COL_PITCH,
        ripe: hash(i, 33 + m) < 0.5 ? 1 : 0,
        sx,
        sy: markBottom,
      });
    });
  }
  if (out.length !== BLOB_N * xs.length) {
    throw new Error(`seatField: ${out.length} seats, expected ${BLOB_N * xs.length}`);
  }
  return out;
};

// The three model axes, and the pan each one owns. Every cue that belongs to a
// model — a thread, a packet, a blob, a block, a comb dot — is panned here and
// nowhere else, so the three stay in the same three places all the way through
// the clip.
const XS = [300, 540, 780];
const PAN = [-0.45, 0, 0.45];

// ===========================================================================
// CUT 1 — LowerAfterRL. "The siphon."
//
// Read from `generated/components/LowerAfterRL.tsx`: DURATION, `beats`, the
// three `drawDur`s, PKT_START / PKT_PERIOD / PKT_LIFE, the seat field's
// BLOB_CY / COL_TOP / MARK_BOTTOM and its t0 / dur formulas, SQUEEZE_F0 /
// SQUEEZE_F1, and the camera keys. Nothing here is timed on its own clock.
// ===========================================================================
{
  const DUR = 163;
  const B = {
    claude: 0,
    likeAll: 9,
    openWeight: 21,
    modelsRight: 32,
    diversity: 49,
    ofTheir: 59,
    outputs: 66,
    aLotLower: 85,
    after: 97,
    rl: 105,
    end: 115, // "RL" ends 8.040; the tail runs to 163
  };
  const DRAW_DUR = [8, 6, 10]; // per model, in MODELS order
  const MARK_LAND = 6; // frames a mark takes to land once its head arrives
  const PKT_START = 40;
  const PKT_PERIOD = 6;
  const PKT_LIFE = 14;
  const BLOB_CY = 1010;
  const COL_TOP = 920;
  const MARK_BOTTOM = 892;
  const SQUEEZE_F0 = 84;
  const SQUEEZE_F1 = 100;
  const CAM_AUDIBLE = [10, 24]; // the damped move leaves f10 and lands f24

  const S = new Stem("LowerAfterRL", DUR);

  // -- the Claude mark lands -------------------------------------------------
  // Weight first, then a small rounded body on top of it. The mark arrives on
  // one ease-out over 8 frames, so the thump is long and the tap is short.
  S.cue(B.claude, "Claude mark lands (thump + small tap)");
  S.thump({ t: f2s(B.claude), f: 48, gain: 0.42, tau: 0.3 });
  S.tap({ t: f2s(B.claude + 0.5), f: 236, gain: 0.17, tau: 0.055, bright: 0.22 });

  // -- the pull-back ---------------------------------------------------------
  S.cue(CAM_AUDIBLE[0], "camera pull-back air (k 1.8 -> 1.35)");
  S.air({
    t: f2s(CAM_AUDIBLE[0]),
    dur: f2s(CAM_AUDIBLE[1] - CAM_AUDIBLE[0] + 6),
    gain: 0.05,
    f0: 5000,
    f1: 8200,
    peak: 0.4,
  });

  // -- the three threads draw, and the marks seat ---------------------------
  // One thin falling band per thread — a wire being drawn DOWN, so the centre
  // frequency falls — running from the draw's first frame to the frame its own
  // mark is fully landed, which is where its tap is. The three have different
  // draw lengths (8 / 6 / 10) in the component, so they neither start together
  // nor end together here either.
  const seatFrame = DRAW_DUR.map((d) => B.openWeight + d + MARK_LAND);
  for (let m = 0; m < 3; m++) {
    const t0 = B.openWeight;
    const len = DRAW_DUR[m] + MARK_LAND;
    S.cue(t0, `thread ${m + 1} draws (${DRAW_DUR[m]}f)`);
    S.band({
      t: f2s(t0),
      dur: f2s(len),
      f0: 2500 * Math.pow(1.06, m),
      f1: 560,
      q0: 4.0,
      q1: 7.0,
      gain: 0.1,
      pan: PAN[m] * 0.95,
      width0: 0.55,
      width1: 0.25,
      stages: 3,
      shape: (u) => 1 - Math.pow(1 - u, 2.2),
      env: (u) =>
        smoothstep(u / 0.18) * (1 - smoothstep(Math.max(0, u - 0.35) / 0.65)),
    });
    S.cue(seatFrame[m], `mark ${m + 1} seats`);
    S.tap({
      t: f2s(seatFrame[m]),
      f: 196 * Math.pow(1.13, m),
      gain: 0.14,
      tau: 0.042,
      bright: 0.16,
      pan: PAN[m] * 0.9,
    });
  }

  // -- the siphon bed --------------------------------------------------------
  // One grain per packet ARRIVING at its mark. The component launches a bead at
  // PKT_START + t*2 + n*PKT_PERIOD and it takes PKT_LIFE - 1 frames to run the
  // wire, so an arrival is the launch plus 13 — three interleaved streams six
  // frames apart, offset 0 / 2 / 4, which is a soft high tick roughly every two
  // frames for the rest of the piece. Very quiet: this is the floor everything
  // else sits on, and it runs to the last frame.
  const pktArrivals = [];
  for (let t = 0; t < 3; t++) {
    for (let n = 0; ; n++) {
      const launch = PKT_START + t * 2 + n * PKT_PERIOD;
      const arrive = launch + (PKT_LIFE - 1);
      if (arrive >= DUR) break;
      pktArrivals.push({ f: arrive, t });
    }
  }
  S.cue(pktArrivals[0].f, `siphon bed: ${pktArrivals.length} packet arrivals, period ${PKT_PERIOD} x 3`);
  pktArrivals.forEach(({ f, t }, n) => {
    S.grain({
      t: f2s(f),
      f: 4600 * Math.pow(2, hash(n, 51) * 0.5),
      dur: 0.018 + 0.008 * hash(n, 52),
      gain: 0.03 * (0.7 + 0.3 * hash(n, 53)),
      pan: PAN[t] * 0.85,
      noise: 0.45,
    });
  });

  // -- the outputs arrive ----------------------------------------------------
  // The component's own arrival histogram: a seat leaves the mark's bottom edge
  // at t0 = diversity + 8v and flies for dur = 3 + 8v + hash + FLIGHT_EXTRA, so
  // the shower is dense in the middle and thin at both ends, exactly as the
  // blobs fill. The component's own measurement of the same formula is a last
  // arrival at f68.7.
  const seats = seatField({ xs: XS, blobCy: BLOB_CY, colTop: COL_TOP, markBottom: MARK_BOTTOM });
  const arrivals = seats.map((s) => ({
    f: B.diversity + 8 * s.v + (3 + 8 * s.v + (hash(s.i, 34 + s.m) - 0.5) * 1.4 + FLIGHT_EXTRA),
    m: s.m,
    v: s.v,
    i: s.i,
  }));
  const aMin = Math.min(...arrivals.map((a) => a.f));
  const aMax = Math.max(...arrivals.map((a) => a.f));
  S.cue(Math.round(aMin), `blob arrivals begin (${seats.length} dots, f${aMin.toFixed(1)}-${aMax.toFixed(1)})`);
  S.cue(Math.round(aMax), "last output seats");
  arrivals.forEach((a, n) => {
    S.grain({
      t: f2s(a.f),
      // low family, 100-160 Hz, a shade lower for the deeper seats
      f: 100 * Math.pow(2, hash(n, 61) * 0.68 - a.v * 0.12),
      dur: 0.04 + 0.03 * hash(n, 62),
      gain: 0.017 * (0.6 + 0.4 * hash(n, 63)),
      pan: PAN[a.m] * (0.75 + 0.25 * hash(n, 64)),
    });
  });

  // -- THE FOLD --------------------------------------------------------------
  // One band for all 192 dots: its bandwidth NARROWS as the blobs narrow into
  // the column (q 1.7 -> 8) and its centre falls a little as every ripe dot
  // ramps to deep (300 -> 132 Hz). Guarded at 420 Hz so sixty-odd frames of it
  // never touch the voice band, and the stereo width closes with the spread.
  S.cue(SQUEEZE_F0, "THE FOLD: the spread narrows, ripe -> deep");
  S.band({
    t: f2s(SQUEEZE_F0 - 1),
    dur: f2s(SQUEEZE_F1 - SQUEEZE_F0 + 4),
    f0: 300,
    f1: 132,
    q0: 1.7,
    q1: 8,
    gain: 0.5,
    width0: 1,
    width1: 0.12,
    stages: 3,
    lp: 420,
    shape: (u) => smoothstep(u),
    env: (u) => smoothstep(u / 0.22) * (1 - smoothstep(Math.max(0, u - 0.62) / 0.38)),
  });
  S.cue(SQUEEZE_F1, "column settles (soft thump)");
  S.thump({ t: f2s(SQUEEZE_F1), f: 46, gain: 0.24, tau: 0.24 });

  // -- the readout -----------------------------------------------------------
  // The label rises and fades in. A short lift and nothing else: the line is
  // being said over it.
  S.cue(B.after + 2, "readout: label lifts in (air)");
  S.air({ t: f2s(B.after + 2), dur: f2s(B.rl + 2 - (B.after + 2)), gain: 0.034, f0: 4600, f1: 7600, peak: 0.5, width: 0.6 });

  S.master(-16, 3);
  const path = `${OUT_DIR}/LowerAfterRL-sfx.wav`;
  S.write(path);
  S.report(path);
}

// ===========================================================================
// CUT 2 — SameCharacterNames. "The name comes down the wire."
//
// Read from `generated/components/SameCharacterNames.tsx`: DURATION, `beats`,
// PKT_PERIOD / PKT_LIFE / PKT_N0, WRITE_STAGGER / WRITE_DUR / BLOCK_OFFSET and
// the seven BAR_W lines, CONV_DUR / PKT_RUN and the three `nameEvents`, and the
// camera keys.
// ===========================================================================
{
  const DUR = 155;
  const B = {
    reusing: 0,
    certainThemes: 17,
    andTheyre: 47,
    usingTheSame: 63,
    character: 77,
    names: 86,
    all: 94,
    theTime: 99, // "the"; "time" is f102, and the third landing sits at 101
    end: 107, // "time" ends 19.920; the tail runs to 155
  };
  const PKT_PERIOD = 6;
  const PKT_LIFE = 14;
  const PKT_N0 = -3;
  const WRITE_STAGGER = 3.5;
  const WRITE_DUR = 6;
  const BLOCK_OFFSET = [0, 1, 2];
  const LINES = 7;
  const CONV_DUR = 6;
  const PKT_RUN = 17;
  const CAM_AUDIBLE = [56, 80]; // keyed f56-76, settled by f80

  const S = new Stem("SameCharacterNames", DUR);

  // -- the siphon bed, already running --------------------------------------
  // Cut 1's siphon, mid-flight at f0: the component starts its packet counter
  // at PKT_N0 so every wire already has beads on it. Same grain, same pans,
  // same period — the two cuts are seconds apart in one edit and the bed has to
  // be the same bed.
  const pktArrivals = [];
  for (let t = 0; t < 3; t++) {
    for (let n = PKT_N0; ; n++) {
      const arrive = t * 2 + n * PKT_PERIOD + (PKT_LIFE - 1);
      if (arrive >= DUR) break;
      if (arrive < 0) continue;
      pktArrivals.push({ f: arrive, t });
    }
  }
  S.cue(0, `siphon bed already running (${pktArrivals.length} packet arrivals)`);
  pktArrivals.forEach(({ f, t }, n) => {
    S.grain({
      t: f2s(f),
      f: 4600 * Math.pow(2, hash(n, 51) * 0.5),
      dur: 0.018 + 0.008 * hash(n, 52),
      gain: 0.03 * (0.7 + 0.3 * hash(n, 53)),
      pan: PAN[t] * 0.85,
      noise: 0.45,
    });
  });

  // -- the blocks write ------------------------------------------------------
  // 21 bars: seven lines x three blocks, a line every 3.5 frames and the blocks
  // offset 0 / 1 / 2 so they are never in unison. One soft grain on the frame a
  // bar starts growing, panned by block, the pitch stepping down a little each
  // line so the block reads as writing downward.
  const writes = [];
  for (let m = 0; m < 3; m++) {
    for (let l = 0; l < LINES; l++) {
      writes.push({ f: B.certainThemes + l * WRITE_STAGGER + BLOCK_OFFSET[m], m, l });
    }
  }
  const wMin = Math.min(...writes.map((w) => w.f));
  const wMax = Math.max(...writes.map((w) => w.f)) + WRITE_DUR;
  S.cue(Math.round(wMin), `blocks write: ${writes.length} bars, f${wMin}-${wMax}`);
  writes.forEach((w, n) => {
    S.grain({
      t: f2s(w.f),
      f: 5200 * Math.pow(0.96, w.l),
      dur: 0.02 + 0.006 * hash(n, 71),
      gain: 0.05 * (0.8 + 0.2 * hash(n, 72)),
      pan: PAN[w.m] * 0.85,
      noise: 0.35,
    });
    // a touch of body under it, so twenty-one ticks are not twenty-one clicks
    S.grain({
      t: f2s(w.f),
      f: 150 * Math.pow(0.97, w.l),
      dur: 0.034,
      gain: 0.022,
      pan: PAN[w.m] * 0.6,
    });
  });
  S.cue(Math.round(wMax), "blocks written: three identical silhouettes");

  // -- the camera push / tilt ------------------------------------------------
  S.cue(CAM_AUDIBLE[0], "camera push-in + tilt air (k 1.35 -> 1.41)");
  S.air({
    t: f2s(CAM_AUDIBLE[0]),
    dur: f2s(CAM_AUDIBLE[1] - CAM_AUDIBLE[0] + 4),
    gain: 0.042,
    f0: 4800,
    f1: 7800,
    peak: 0.45,
  });

  // -- the name beads --------------------------------------------------------
  // Three beads leave Claude together on each round — the launch is the landing
  // counted back PKT_RUN frames — and ride down the wire and through their mark
  // into the block. One rounded tap as they leave, and, on the FIRST round only,
  // a thin descending band riding with them, three pans a fraction of a frame
  // apart.
  //
  // Only the first round gets the band, and that is measured rather than
  // preferred. Three bands of 17 frames each is fifty frames of 2.3 kHz -> 500 Hz
  // sweep, which is fifty frames INSIDE the voice band: it took this stem's
  // 300 Hz - 3 kHz mean to -35.5 dB, louder than the approved john stem's -34.4
  // only because the sweeps never stopped. The gesture the brief names is the
  // first round — the name coming down the wire for the first time — so rounds
  // two and three keep the launch tap (the beads do leave, and the ear should
  // hear them go) and drop the sweep.
  // The three landings run TOP TO BOTTOM — line 1 on f80 (`You're`), line 3 on
  // "all" (f94, `absolutely`), line 5 at f101 (`right!`, across "the time") — so
  // the phrase assembles in speech order. The launches are those minus PKT_RUN:
  // f63, f77, f84.
  const WORDS = ["You\u2019re", "absolutely", "right!"];
  const nameEvents = [
    { line: 0, land: B.names - CONV_DUR },
    { line: 2, land: B.all },
    { line: 4, land: B.theTime + 2 },
  ];
  nameEvents.forEach((ev, e) => {
    const launch = ev.land - PKT_RUN;
    S.cue(launch, `three name beads leave Claude (round ${e + 1}, land f${ev.land})`);
    S.tap({
      t: f2s(launch),
      f: 244,
      gain: e === 0 ? 0.115 : 0.08,
      tau: 0.04,
      bright: 0.18,
    });
    if (e === 0) {
      for (let m = 0; m < 3; m++) {
        S.band({
          t: f2s(launch + m * 0.4),
          dur: f2s(PKT_RUN),
          f0: 2300 * Math.pow(1.05, m),
          f1: 480,
          q0: 4.2,
          q1: 7.5,
          // 0.035, not the 0.06 it was built at: measured frame by frame, the
          // sweep was the loudest thing in the stem (f66-71 at the -16 dBFS
          // peak) and the ink it leads into was 4 dB under it. The payoff has to
          // be the peak of the piece, so the sweep sits below it.
          gain: 0.035,
          pan: PAN[m] * 0.95,
          width0: 0.5,
          width1: 0.2,
          stages: 3,
          shape: (u) => u,
          env: (u) => smoothstep(u / 0.2) * (1 - smoothstep(Math.max(0, u - 0.45) / 0.55)),
        });
      }
    }
    // -- the ink ------------------------------------------------------------
    // The payoff: the bar collapses and the name wipes in, all three blocks
    // together. Three bright grains a frame apart — brighter than a bar tick,
    // and still a windowed grain, so there is nothing to click.
    S.cue(ev.land, `"${WORDS[e]}" wipes in on line ${ev.line + 1} (f${ev.land}-${ev.land + CONV_DUR})`);
    for (let m = 0; m < 3; m++) {
      S.grain({
        t: f2s(ev.land + m),
        f: 6300 * Math.pow(1.03, m),
        dur: 0.03,
        gain: 0.105,
        pan: PAN[m] * 0.9,
        noise: 0.3,
        partial: 0.18,
      });
      S.grain({
        t: f2s(ev.land + m),
        f: 172,
        dur: 0.05,
        gain: 0.03,
        pan: PAN[m] * 0.6,
      });
    }
  });

  S.master(-16, 3);
  const path = `${OUT_DIR}/SameCharacterNames-sfx.wav`;
  S.write(path);
  S.report(path);
}

// ===========================================================================
// CUT 3 — ClaudeifiedByRL. "The RL line."
//
// Read from `generated/components/ClaudeifiedByRL.tsx`: DURATION, `beats`, the
// seat field's BLOB_CY / COL_TOP / MARK_BOTTOM and its t0 / dur formulas,
// LINE_Y, DESC_F0 / DESC_F1 / DESC_DY and `crossFrame` (which is `dropAt`
// inverted — the same `invSmooth` the component uses, so a comb grain lands on
// the frame that dot's own world y reaches the line), MARK_Y / MARK_SIZE, and
// the camera keys.
// ===========================================================================
{
  const DUR = 168;
  const B = {
    so: 0,
    that: 12,
    diversity: 26,
    has: 36,
    definitely: 45,
    been: 53,
    cut: 68, // held to f94 — the line draws on it, and the descent starts at +6
    down: 94,
    by: 99,
    rl: 104,
    a: 113,
    lot: 119,
    end: 120, // speech ends; the tail runs to 168
  };
  const BLOB_CY = 730;
  const COL_TOP = 640;
  const MARK_Y = 560;
  const MARK_SIZE = 104;
  const MARK_BOTTOM = MARK_Y + MARK_SIZE / 2;
  const LINE_Y = 1040.5;
  const DESC_F0 = 74;
  const DESC_F1 = 118;
  const DESC_DY = 560;
  const LINE_DRAW = [B.cut - 2, B.cut + 6]; // f66-74, landing where the fall starts
  const CAM_AUDIBLE = [74, 116]; // keyed f74-110; the damper is under 1 px/frame at f116

  const S = new Stem("ClaudeifiedByRL", DUR);

  // the component's own descent, and its inverse
  const invSmooth = (u) => 0.5 - Math.sin(Math.asin(1 - 2 * clamp01(u)) / 3);
  const dropAt = (f) => DESC_DY * smoothstep((f - DESC_F0) / (DESC_F1 - DESC_F0));
  const crossFrame = (y0) =>
    DESC_F0 + (DESC_F1 - DESC_F0) * invSmooth((LINE_Y - y0) / DESC_DY);

  // -- the spray -------------------------------------------------------------
  // Cut 1's arrival mechanism on cut 3's clock: t0 = that + 9v + m*1.5,
  // dur = 3 + 9v + hash + FLIGHT_EXTRA. Top-of-blob seats first, the three blobs
  // offset a frame and a half so they never spray together. The component's own
  // measurement of the same formula is a last arrival at f36.5.
  const seats = seatField({ xs: XS, blobCy: BLOB_CY, colTop: COL_TOP, markBottom: MARK_BOTTOM });
  const arrivals = seats.map((s) => ({
    f:
      B.that +
      9 * s.v +
      s.m * 1.5 +
      (3 + 9 * s.v + (hash(s.i, 34 + s.m) - 0.5) * 1.4 + FLIGHT_EXTRA),
    m: s.m,
    v: s.v,
  }));
  const aMin = Math.min(...arrivals.map((a) => a.f));
  const aMax = Math.max(...arrivals.map((a) => a.f));
  S.cue(Math.round(aMin), `the spray begins (${seats.length} dots, f${aMin.toFixed(1)}-${aMax.toFixed(1)})`);
  S.cue(Math.round(aMax), "last output seats");
  arrivals.forEach((a, n) => {
    S.grain({
      t: f2s(a.f),
      f: 104 * Math.pow(2, hash(n, 61) * 0.66 - a.v * 0.1),
      dur: 0.04 + 0.03 * hash(n, 62),
      gain: 0.018 * (0.6 + 0.4 * hash(n, 63)),
      pan: PAN[a.m] * (0.75 + 0.25 * hash(n, 64)),
    });
  });

  // -- the RL line draws -----------------------------------------------------
  // Left to right with the head. `band` takes one fixed pan, so the sweep is
  // written as overlapping one-frame hops whose hann envelopes sum to unity —
  // a single continuous band that travels -0.8 -> +0.8 and rises as it goes,
  // ending in a small tap where the head stops.
  const [LD0, LD1] = LINE_DRAW;
  S.cue(LD0, "RL line draws left -> right (rising band, pan -0.8 -> +0.8)");
  {
    const HOPS = (LD1 - LD0) * 2;
    for (let h = 0; h < HOPS; h++) {
      const u0 = h / HOPS;
      const u1 = (h + 1) / HOPS;
      const uc = (u0 + u1) / 2;
      S.band({
        t: f2s(LD0 + u0 * (LD1 - LD0) - 0.5 * (LD1 - LD0) / HOPS),
        dur: f2s((2 * (LD1 - LD0)) / HOPS),
        f0: 1500 * Math.pow(5.2, u0),
        f1: 1500 * Math.pow(5.2, u1),
        q0: 4.5,
        q1: 4.5,
        gain: 0.14,
        pan: -0.8 + 1.6 * uc,
        width0: 0.35,
        width1: 0.35,
        stages: 3,
        env: (u) => 0.5 - 0.5 * Math.cos(2 * Math.PI * u),
      });
    }
  }
  S.cue(LD1, "line head lands (tap)");
  S.tap({ t: f2s(LD1), f: 262, gain: 0.15, tau: 0.038, bright: 0.2, pan: 0.55 });

  // -- THE DESCENT -----------------------------------------------------------
  // The one big motion: the whole group falls DESC_DY on one smoothstep. A slow
  // low band whose centre falls on exactly that curve (`shape` is the
  // component's own smoothstep, so the pitch is the group's dy), guarded at
  // 300 Hz so a forty-frame sustain never enters the voice band.
  S.cue(DESC_F0, "THE DESCENT: the group falls through the line (band falls with dy)");
  S.band({
    t: f2s(DESC_F0),
    dur: f2s(DESC_F1 - DESC_F0 + 6),
    f0: 196,
    f1: 58,
    q0: 2.0,
    q1: 5.0,
    gain: 0.46,
    width0: 0.9,
    width1: 0.25,
    stages: 3,
    lp: 300,
    shape: (u) => smoothstep((u * (DESC_F1 - DESC_F0 + 6)) / (DESC_F1 - DESC_F0)),
    env: (u) => smoothstep(u / 0.16) * (1 - smoothstep(Math.max(0, u - 0.72) / 0.28)),
  });
  S.cue(CAM_AUDIBLE[0], "camera tilt air (content centre 664 -> 1160, k held)");
  S.air({
    t: f2s(CAM_AUDIBLE[0]),
    dur: f2s(CAM_AUDIBLE[1] - CAM_AUDIBLE[0]),
    gain: 0.035,
    f0: 4400,
    f1: 7600,
    peak: 0.42,
  });

  // -- the comb --------------------------------------------------------------
  // One low grain per dot on the frame its own world y crosses the line. The
  // blob's bottom crosses first and its top last, so the density IS the crossing
  // histogram: a sweep UP the blob, not a cue. The tone lowers through the pass
  // — every dot that has been through is deep.
  const combs = seats.map((s) => ({ f: crossFrame(s.fy), m: s.m }));
  const cMin = Math.min(...combs.map((c) => c.f));
  const cMax = Math.max(...combs.map((c) => c.f));
  S.cue(Math.round(cMin), `the comb: first dots cross (f${cMin.toFixed(1)}-${cMax.toFixed(1)})`);
  combs.forEach((c, n) => {
    const u = clamp01((c.f - cMin) / Math.max(1e-6, cMax - cMin));
    S.grain({
      t: f2s(c.f),
      f: (152 - 56 * u) * Math.pow(2, hash(n, 81) * 0.34),
      dur: 0.042 + 0.028 * hash(n, 82),
      gain: 0.021 * (0.6 + 0.4 * hash(n, 83)),
      pan: PAN[c.m] * (0.7 + 0.3 * hash(n, 84)),
    });
  });
  S.cue(Math.round(cMax), "the comb clears the top of the blobs");

  // -- the flip --------------------------------------------------------------
  // The three marks cross the line together and are Claude on the other side.
  // One brighter tap on the centre-crossing frame, three pans a frame apart —
  // one flip, not three — and low weight when the last of the mark is through.
  const flipF = crossFrame(MARK_Y);
  const throughF = crossFrame(MARK_Y - MARK_SIZE / 2);
  S.cue(Math.round(flipF), `the flip: three marks cross the line (f${flipF.toFixed(1)})`);
  for (let m = 0; m < 3; m++) {
    S.tap({
      t: f2s(flipF + (m - 1)),
      f: 320 * Math.pow(1.06, m),
      gain: 0.2 - 0.03 * Math.abs(m - 1),
      tau: 0.036,
      bright: 0.26,
      pan: PAN[m] * 0.9,
    });
  }
  S.cue(Math.round(throughF), `marks fully through (f${throughF.toFixed(1)}, thump)`);
  S.thump({ t: f2s(throughF), f: 50, gain: 0.3, tau: 0.26 });

  // -- the readout -----------------------------------------------------------
  S.cue(B.by - 1, "readout: RL lifts in (air)");
  S.air({ t: f2s(B.by - 1), dur: f2s(8), gain: 0.032, f0: 4600, f1: 7400, peak: 0.5, width: 0.6 });

  // -- the landing -----------------------------------------------------------
  // The descent stops. A soft settle and nothing after it: no loop, no hum, the
  // bed is silence. tau 0.22 rather than the john close's 0.34 because this cut
  // holds for fifty frames after its landing: a 0.34 s settle is still 17 dB up
  // a second later, which over that hold is a hum.
  S.cue(DESC_F1, "landing: the descent settles");
  S.thump({ t: f2s(DESC_F1), f: 44, gain: 0.26, tau: 0.22 });
  S.tap({ t: f2s(DESC_F1 + 0.5), f: 128, gain: 0.075, tau: 0.08, bright: 0.04 });

  S.master(-16, 3);
  const path = `${OUT_DIR}/ClaudeifiedByRL-sfx.wav`;
  S.write(path);
  S.report(path);
}

console.log("");
