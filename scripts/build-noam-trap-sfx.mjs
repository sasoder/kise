// SFX stems for the eight-cut `Noam_Trap` set — one stem per cut, each exactly
// the cut's DURATION, to sit UNDER a voice-over that runs over every frame.
//
//   bun scripts/build-noam-trap-sfx.mjs
//
// Writes out/sfx/<Composition>_SFX.wav (48 kHz / 24-bit / stereo, pcm_s24le)
// and prints, per stem, the peak dBFS, the integrated loudness (ffmpeg
// ebur128) and the full cue list (frame -> voice).
//
// ---------------------------------------------------------------------------
// WHERE THE FRAMES COME FROM. Nothing here is a retyped beat. Every component
// in this set exports its own timing and, in most cases, its own per-frame
// state, and this script imports it:
//
//   FakeTestEnvironment   BEAT_CHECK, HAND_TRACK {handAngle, lenAt, screenAt,
//                         F_BIRTH, F_REACH, F_CLOSE, PEOPLE}, STATS.tipV
//                         (the hand tip's screen speed, per frame, already
//                         measured with the camera and the sway in it)
//   AnswerKeyInTheFolder  BEAT_CHECK, STATE_AT(f) -> {wallDraw, questionDraw,
//                         questionIconDraw, questionAt, folderDraw,
//                         folderIconDraw, keyRise, workThread, modelTone,
//                         gazeAngle}, CAM_AT(f)
//   DoesItTellYou         BEAT_CHECK, STATS.{report, look, beads}, JOIN
//   SeemsLikeATrap        BEAT_CHECK, STATE_AT(f) -> {wire, eye, folderDashed,
//                         gazeAngle, gazeLength, modelOffset}, CAM_AT(f)
//   JustATestEnvironment  BEAT_CHECK, HAND_AT(f), WORK_THREAD, STATS, CAM_AT(f)
//   IncreasinglyDifficult BEAT_CHECK, STATE_AT(f).gazeAngle, STATS.{wire,
//                         frontAtDeg, folderDashedAt}, CAM_AT(f)
//
// A drawing head's SPEED is therefore differentiated out of the component's own
// progress function rather than guessed, so the pencil's level is the speed of
// the thing on screen and it stops on the frame the head stops. Where a cut
// exposes only a sampled table (DoesItTellYou's report line) the table is
// interpolated and the header line it came from is quoted at the call site.
//
// ---------------------------------------------------------------------------
// ONE SOUND VOCABULARY FOR THE WHOLE CLIP. Same object, same voice, every cut.
// All eight stems are built from these seven voices and nothing else.
//
//   vDraw   A LINE DRAWING / WIPING (wall wipe-on, the ghost plot, the wire
//           running, the report branch, a ring or a glyph stroking on). Noise
//           through a resonant band-pass: centre 3.8 kHz at rest rising to
//           7.2 kHz at speed, Q 1.05, guarded hp 3.0 kHz / lp 11 kHz, stereo
//           width 0.5. LEVEL AND CENTRE BOTH FOLLOW THE HEAD'S SCREEN SPEED
//           per frame, so it ends the instant the head stops. A DASHED line is
//           the same voice gated by the dash pattern: the gate's frequency is
//           the head's own world speed divided by trapShared's dash period
//           (DASH_ON + DASH_OFF = 33.85 world px), i.e. one grain per dash.
//   vSwish  The same voice reversed: a fast decrescendo with a falling centre.
//           Used for the "No" undraw in cut 7 and the withdrawals in cut 5.
//   vLand   A THING LANDING / SEATING. A dry low-mid knock: 205 Hz body with a
//           2.71x partial, 1.5 ms raised-cosine attack, tau 16 ms -> 112 ms
//           long. `big` (the clip's two peaks, "trap" and "match") adds a
//           70-90 Hz sine thump, tau 20 ms -> 120 ms, and nothing else: still
//           dry, just fuller.
//   vModel  THE MODEL. Two detuned sines at 442 / 657 Hz (a fifth, +0.5 %
//           detune), 3 ms attack, tau 55 ms -> ~180 ms of decay. `huh` is the
//           SAME blip a minor third down (x 2^-3/12 = 371.5 / 552.5 Hz) with a
//           70-cent downward glide over its first 120 ms — a question, not a
//           cartoon.
//   vWhoosh THE GAZE HAND SWEEPING (cuts 3, 7, 8). Noise band whose LEVEL AND
//           CENTRE follow the hand tip's screen speed per frame (centre
//           1.8 kHz + 34 Hz per px/frame), panned by the tip's HORIZONTAL
//           DIRECTION of travel. In cut 8 the hand's rate rises turn after
//           turn and the whoosh rises with it, because it is the same number.
//   vFlip   A STATE FLIP CAUSED BY THE HAND (a person turning out to be a prop,
//           a wall arc going dashed, a gap springing open). A hann-windowed
//           sine grain, 2.4-3.6 kHz, 20 ms. Emitted one per flip, or as a
//           sparse stream along a conversion front, angle-quantised so the rate
//           never exceeds ~9/s.
//   vGap    GAPS CLOSING (cut 8 act 1) — the reverse gesture. A hann-windowed
//           190 Hz grain, 45 ms, very soft, thinning out to nothing as the
//           closing fronts decelerate into each other.
//   vPip    PACKETS (work thread out-and-back, wire beads). A hann grain,
//           1.2 kHz outbound / 0.9 kHz inbound, 20 ms, ~30 dB under the stem's
//           peak. Barely there on purpose.
//
// Nothing is built for marching dashes, the model's breath, camera moves or the
// grid: they run continuously and a continuous voice under a continuous voice-
// over is a hum.
//
// ---------------------------------------------------------------------------
// SPECTRAL RULE, as in the other approved sets: sustained energy lives below
// ~300 Hz or above ~3 kHz so the voice's 300 Hz - 3 kHz stays clear. Only the
// knocks, the blips and the moving sweeps cross it, and never for long.
//
// LEVELS: each stem is peak-normalised to -14.0 dBFS on its biggest hit, which
// puts the ordinary events 10-18 dB under that (-24 to -32 dBFS). Every event
// is windowed (hann, or a raised-cosine attack and an exponential tail), the
// stem is DC-blocked, and the first and last 10 ms are faded to dead zero.
// Panning is amplitude-only and the noise voices run at stereo width <= 0.5, so
// every stem folds down to mono without cancellation.
//
// ---------------------------------------------------------------------------
// ONE DEVIATION FROM MEMORY's SFX RULE, and it is the same one
// `scripts/build-john-sfx.mjs` documents. MEMORY names ffmpeg `aevalsrc`
// expression synthesis; this set needs what an `aevalsrc` expression cannot
// state — a band-pass whose centre frequency AND level are driven by a
// component's own per-frame speed table, and a grain gate whose rate is the
// head's world speed over the dash period. Everything is still synthesised from
// first principles in this file: no samples, no network, no library. ffmpeg is
// used only to MEASURE the result (ebur128, volumedetect).

import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  DASH_ON,
  DASH_OFF,
  PACKET_PERIOD,
  PACKET_SPEED,
  MODEL_HOME,
  QUESTION,
  FOLDER,
  EYE,
  EYE_R,
  WALL,
  STATION_R,
  FOLDER_R,
  GLYPH_FRACTION,
} from "../generated/components/trapShared.tsx";

import * as FakeTest from "../generated/components/FakeTestEnvironment.tsx";
import * as AnswerKey from "../generated/components/AnswerKeyInTheFolder.tsx";
import * as DoesItTell from "../generated/components/DoesItTellYou.tsx";
import * as SeemsTrap from "../generated/components/SeemsLikeATrap.tsx";
import * as JustTest from "../generated/components/JustATestEnvironment.tsx";
import * as IncrDiff from "../generated/components/IncreasinglyDifficult.tsx";

const SR = 48000;
const FPS = 24;
const OUT_DIR = "out/sfx";
const PEAK_DB = -14.0;

/** trapShared's dash period, in world px. Cuts 3, 5, 7 and 8 gate on it. */
const DASH_PERIOD = DASH_ON + DASH_OFF;

/**
 * Nominal stroked length of a Lucide glyph inside a station ring, in world px.
 * The glyph is drawn on the 24 grid at GLYPH_FRACTION of the ring's diameter,
 * and its path runs roughly 2.2 box-widths. This is the ONE estimate in the
 * script: it only sets how loud a glyph strokes on, never when.
 */
const glyphLen = (r) => 2.2 * 2 * r * GLYPH_FRACTION;

/** Model -> question, the work thread's own length in world px. */
const THREAD_LEN = Math.hypot(QUESTION.x - MODEL_HOME.x, QUESTION.y - MODEL_HOME.y);

const f2s = (f) => f / FPS;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const clampPm = (v) => Math.max(-1, Math.min(1, v));
const lerp = (a, b, u) => a + (b - a) * u;
const smoothstep = (x) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const sat = (x, d = 1.6) => Math.tanh(x * d) / Math.tanh(d);
const fract = (n) => n - Math.floor(n);
const hash = (i, k) => fract(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);

/** Screen x of a world x under a {cx, k} camera. Half the frame is 540 px. */
const sx = (cam, wx) => 540 + (wx - cam.cx) * cam.k;
/** Screen x -> a gentle stereo position. Never hard-panned. */
const panOfX = (x, amount = 0.45) => clampPm((x - 540) / 540) * amount;

/** Linear interpolation over a sampled [[frame, value], ...] table. */
const tableAt = (rows, f) => {
  if (f <= rows[0][0]) return rows[0][1];
  const last = rows[rows.length - 1];
  if (f >= last[0]) return last[1];
  for (let i = 1; i < rows.length; i++) {
    if (f <= rows[i][0]) {
      const [f0, v0] = rows[i - 1];
      const [f1, v1] = rows[i];
      return lerp(v0, v1, (f - f0) / (f1 - f0));
    }
  }
  return last[1];
};

/** Central difference of a per-frame function, in units per frame. */
const dAt = (fn, f) => fn(f + 0.5) - fn(f - 0.5);

/**
 * Samples a per-frame parameter function over [f0, f1] at half-frame steps and
 * returns a cheap interpolator of u in [0, 1]. Every sustained voice goes
 * through this: the components' own functions run Hermite cameras and full
 * state objects, which must not be called 48 000 times a second.
 */
const track = (f0, f1, fn) => {
  const STEP = 0.5;
  const N = Math.max(2, Math.ceil((f1 - f0) / STEP) + 1);
  const rows = [];
  for (let i = 0; i < N; i++) rows.push(fn(Math.min(f1, f0 + i * STEP)));
  const keys = Object.keys(rows[0]);
  return (u) => {
    const x = clamp01(u) * (N - 1);
    const i = Math.min(N - 2, Math.floor(x));
    const t = x - i;
    const a = rows[i];
    const b = rows[i + 1];
    const out = {};
    for (const key of keys) out[key] = lerp(a[key], b[key], t);
    return out;
  };
};

// ===========================================================================
// THE ENGINE. Structure and the band/tap/thump/grain/master/write helpers are
// scripts/build-john-sfx.mjs's, with one addition — `bandAt`, a band-pass whose
// level, centre, Q and pan are supplied per sample by a callback, which is what
// lets a voice follow a component's own speed table.
// ===========================================================================
class Stem {
  constructor(name, frames, line) {
    this.name = name;
    this.frames = frames;
    this.line = line;
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
    this.cues.push({ frame: Number(frame.toFixed(1)), name });
  }

  add(i, l, r) {
    if (i < 0 || i >= this.n) return;
    this.L[i] += l;
    this.R[i] += r;
  }

  addPan(i, v, pan = 0) {
    const p = clampPm(pan);
    this.add(i, v * Math.min(1, 1 - p), v * Math.min(1, 1 + p));
  }

  /** A hann-windowed sine grain: no attack transient at any density. */
  grain({ t, f, dur = 0.02, gain = 0.1, pan = 0, partial = 0 }) {
    const s0 = Math.round(t * SR);
    const N = Math.max(8, Math.round(dur * SR));
    let ph = hash(f, 3) * 6.283;
    let ph2 = hash(f, 7) * 6.283;
    for (let k = 0; k < N; k++) {
      const u = k / N;
      const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * u);
      ph += (2 * Math.PI * f) / SR;
      ph2 += (2 * Math.PI * f * 2.01) / SR;
      this.addPan(s0 + k, (Math.sin(ph) + partial * Math.sin(ph2)) * w * gain, pan);
    }
  }

  /**
   * Noise through a time-varying resonant band-pass (2-pole SVF, optionally
   * cascaded) with 3-pole guard rails either side, rendered straight to stereo
   * with a keyframed width. `at(u)` returns {g, fc, q, pan, width} for the
   * normalised position u in [0, 1] — everything this set's moving voices need.
   *
   * The guard rails matter: the SVF's own skirts are 6 dB/oct per stage, which
   * is not enough to keep a 4 kHz band out of the voice range; three cascaded
   * one-poles are.
   */
  bandAt({ t, dur, at, stages = 2, hp = 0, lp = 0 }) {
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
    // 5 ms raised-cosine window on both ends of every sustained voice.
    const EDGE = Math.min(Math.round(0.005 * SR), Math.floor(N / 2));
    for (let k = 0; k < N; k++) {
      const u = k / N;
      const p = at(u);
      let e = p.g;
      if (k < EDGE) e *= 0.5 - 0.5 * Math.cos((Math.PI * k) / EDGE);
      else if (k >= N - EDGE) e *= 0.5 - 0.5 * Math.cos((Math.PI * (N - 1 - k)) / EDGE);
      if (e <= 0) continue;
      // A 2-pole Chamberlin SVF is only stable while F = 2*sin(pi*fc/SR) stays
      // under ~1, i.e. fc < SR/6 = 8 kHz. A fast head pushed the pencil's
      // centre to 12 kHz and the filter blew up into NaN, which is why this cap
      // is 7600 and not the nominal 13000. The lp guard rail carries the top.
      const fc = Math.min(7600, Math.max(60, p.fc));
      const q = Math.max(0.4, p.q ?? 1.0);
      const width = p.width ?? 0.5;
      const ff = 2 * Math.sin((Math.PI * fc) / SR);
      const qq = 1 / q;
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
        // Saturate BEFORE the guard rails, never after: tanh on a resonant band
        // throws harmonics that would land back in the voice range.
        out[c] = guard(c, sat(x * norm, 1.2));
      }
      const mid = (out[0] + out[1]) * 0.5;
      const l = mid + (out[0] - mid) * width;
      const r = mid + (out[1] - mid) * width;
      const pp = clampPm(p.pan ?? 0);
      this.add(s0 + k, l * e * Math.min(1, 1 - pp), r * e * Math.min(1, 1 + pp));
    }
  }

  /** A rounded dry body with a pitch dip: the knock. */
  tap({ t, f, gain = 0.1, pan = 0, tau = 0.016, bright = 0.45 }) {
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
      const atk = tt < 0.0015 ? 0.5 - 0.5 * Math.cos((Math.PI * tt) / 0.0015) : 1;
      this.addPan(s0 + k, sat(v * 0.8) * atk * gain, pan);
    }
  }

  /** Low weight under a landing. Only the clip's two peaks get one. */
  thump({ t, f = 78, gain = 0.2, tau = 0.02 }) {
    const s0 = Math.round(t * SR);
    const N = Math.round(tau * 6 * SR);
    let ph = 0;
    for (let k = 0; k < N; k++) {
      const tt = k / SR;
      ph += (2 * Math.PI * f * (1 + 0.3 * Math.exp(-tt / 0.02))) / SR;
      const atk = tt < 0.006 ? 0.5 - 0.5 * Math.cos((Math.PI * tt) / 0.006) : 1;
      this.addPan(s0 + k, sat(Math.sin(ph), 1.3) * Math.exp(-tt / tau) * atk * gain, 0);
    }
  }

  // -------------------------------------------------------------------------
  // THE VOCABULARY. Seven voices, reused by every cut.
  // -------------------------------------------------------------------------

  /**
   * A LINE DRAWING OR WIPING. `vScreen(f)` is the head's screen speed in
   * px/frame and `vWorld(f)` its world speed (only needed when `dashed`, to
   * gate one grain per dash). `pan(f)` places the head.
   */
  vDraw({ f0, f1, vScreen, vWorld = null, pan = () => 0, gain = 1, dashed = false, label }) {
    const dur = f2s(f1 - f0);
    if (dur <= 0) return;
    // px/frame. The exponent is deliberately steep (1.5, not 1): a slow head
    // has to go almost silent, or a 50-frame draw becomes a noise bed under the
    // voice, which is what the first pass of this script did.
    const vRef = 40;
    // The component's own functions are sampled ONCE PER HALF FRAME and then
    // interpolated: a per-sample call would evaluate a Hermite camera 200 000
    // times, and the cue has to sit on its frame anyway.
    const panAt = typeof pan === "function" ? pan : () => pan;
    const T = track(f0, f1, (f) => {
      const v = Math.max(0, vScreen(f));
      return { v, w: vWorld ? Math.max(0, vWorld(f)) : 0, p: panAt(f) };
    });
    let gatePhase = 0;
    let lastU = 0;
    this.bandAt({
      t: f2s(f0),
      dur,
      hp: 3000,
      lp: 11000,
      at: (u) => {
        const s = T(u);
        let g = gain * 0.2 * Math.pow(clamp01(s.v / vRef), 1.5);
        if (dashed && vWorld) {
          // one grain per dash: the gate's rate is the head's own world speed
          // over trapShared's dash period.
          gatePhase += (s.w * FPS * (u - lastU) * dur) / DASH_PERIOD;
          lastU = u;
          // a soft raised-cosine tooth, not a square: a texture, not a buzz
          g *= 0.22 + 0.78 * (0.5 - 0.5 * Math.cos(2 * Math.PI * fract(gatePhase)));
        }
        // centre 3.8 kHz at rest -> 7.2 kHz at the fastest head in the set
        return { g, fc: Math.min(7200, 3800 + 36 * s.v), q: 1.05, pan: s.p, width: 0.5 };
      },
    });
    this.cue(f0, `${label}  [draw f${f0}-${f1}]`);
  }

  /** THE DRAWING VOICE REVERSED: a fast decrescendo swish. */
  vSwish({ f0, f1, gain = 1, pan = 0, label }) {
    const dur = f2s(f1 - f0);
    if (dur <= 0) return;
    this.bandAt({
      t: f2s(f0),
      dur,
      hp: 2200,
      lp: 11000,
      at: (u) => ({
        g: gain * 0.26 * Math.pow(1 - u, 1.7) * smoothstep(u / 0.08),
        fc: lerp(6200, 2600, Math.pow(u, 0.7)),
        q: 1.0,
        pan,
        width: 0.5,
      }),
    });
    this.cue(f0, `${label}  [swish f${f0}-${f1}]`);
  }

  /** A THING LANDING / SEATING. `big` = one of the clip's two peaks. */
  vLand({ f, gain = 1, pan = 0, big = false, label }) {
    const t = f2s(f);
    this.tap({ t, f: big ? 190 : 205, gain: gain * (big ? 0.72 : 0.44), pan, tau: big ? 0.019 : 0.016 });
    if (big) this.thump({ t, f: 78, gain: gain * 0.5, tau: 0.02 });
    this.cue(f, `${label}  [land${big ? " + thump 78 Hz" : ""}]`);
  }

  /** THE MODEL: two detuned sines. `huh` drops it a minor third and glides. */
  vModel({ f, gain = 1, pan = 0, huh = false, single = false, base = 442, label }) {
    const s0 = Math.round(f2s(f) * SR);
    const mul = huh ? Math.pow(2, -3 / 12) : 1;
    const f1 = base * mul;
    const f2 = base * 1.4864 * mul; // a fifth, +0.5 % detune
    const tau = 0.055;
    const N = Math.round(tau * 6 * SR);
    let p1 = 0;
    let p2 = 0;
    for (let k = 0; k < N; k++) {
      const tt = k / SR;
      // `huh`: a 70-cent downward glide over the first 120 ms, and nothing else
      const gl = huh ? Math.pow(2, (-70 / 1200) * clamp01(tt / 0.12)) : 1;
      p1 += (2 * Math.PI * f1 * gl) / SR;
      p2 += (2 * Math.PI * f2 * gl) / SR;
      const atk = tt < 0.003 ? 0.5 - 0.5 * Math.cos((Math.PI * tt) / 0.003) : 1;
      const v = Math.sin(p1) + (single ? 0 : 0.55 * Math.sin(p2));
      this.addPan(s0 + k, v * Math.exp(-tt / tau) * atk * gain * 0.2, pan);
    }
    this.cue(f, `${label}  [${single ? "tone" : "blip"} ${f1.toFixed(0)}${single ? "" : "/" + f2.toFixed(0)} Hz]`);
  }

  /**
   * THE GAZE HAND SWEEPING. Level and centre follow the tip's screen speed.
   *
   * `angleAt(f)` turns it into a PULSE rather than a bed. A hand that holds one
   * screen speed for four seconds (cuts 3 and 7 are both authored that way, on
   * purpose) makes a level-following whoosh perfectly flat, and a flat four
   * seconds of noise under a voice is the hum the brief forbids. So the level
   * is also swung by the hand's OWN TURN: one lobe every `pulseDeg` of angle,
   * never below a 0.3 floor. In cut 8, where the hand accelerates turn after
   * turn, the lobes therefore come faster and faster — which is the whole line.
   */
  vWhoosh({ f0, f1, vScreen, panAt = () => 0, gain = 1, angleAt = null, pulseDeg = 90, label }) {
    const dur = f2s(f1 - f0);
    if (dur <= 0) return;
    const pAt = typeof panAt === "function" ? panAt : () => panAt;
    const step = (pulseDeg * Math.PI) / 180;
    const a0 = angleAt ? angleAt(f0) : 0;
    const T = track(f0, f1, (f) => {
      let swell = 1;
      if (angleAt) {
        const ph = fract(Math.abs(angleAt(f) - a0) / step);
        swell = 0.3 + 0.7 * Math.pow(Math.sin(Math.PI * ph), 1.2);
      }
      return { v: Math.max(0, vScreen(f)), p: pAt(f), s: swell };
    });
    this.bandAt({
      t: f2s(f0),
      dur,
      hp: 1200,
      lp: 9000,
      at: (u) => {
        const s = T(u);
        return {
          g: gain * 0.2 * Math.pow(clamp01(s.v / 60), 1.6) * s.s,
          fc: 1800 + 34 * s.v,
          q: 0.85,
          pan: s.p,
          width: 0.5,
        };
      },
    });
    this.cue(f0, `${label}  [whoosh f${f0}-${f1}${angleAt ? `, one lobe per ${pulseDeg} deg of turn` : ""}]`);
  }

  /** A STATE FLIP CAUSED BY THE HAND. */
  vFlip({ f, gain = 1, pan = 0, hz = 3000, label }) {
    this.grain({ t: f2s(f), f: hz, dur: 0.02, gain: gain * 0.10, pan });
    if (label) this.cue(f, `${label}  [flip tick ${hz} Hz]`);
  }

  /** A GAP CLOSING. The reverse gesture: very soft, low, thinning out. */
  vGap({ f, gain = 1, pan = 0, label }) {
    this.grain({ t: f2s(f), f: 190, dur: 0.045, gain: gain * 0.055, pan, partial: 0.2 });
    if (label) this.cue(f, `${label}  [gap tick 190 Hz]`);
  }

  /** A PACKET. 1.2 kHz out, 0.9 kHz back. Barely there. */
  vPip({ f, back = false, gain = 1, pan = 0, label }) {
    this.grain({ t: f2s(f), f: back ? 900 : 1200, dur: 0.02, gain: gain * 0.055, pan });
    if (label) this.cue(f, `${label}  [pip ${back ? 900 : 1200} Hz]`);
  }

  // -------------------------------------------------------------------------

  /** DC block, gentle top smoothing, peak normalise to PEAK_DB, 10 ms fades. */
  master(peakDb = PEAK_DB, fadeMs = 10) {
    const rc = Math.exp((-2 * Math.PI * 22) / SR); // 22 Hz high-pass: kills DC
    let xl = 0, yl = 0, xr = 0, yr = 0;
    const a = 1 - Math.exp((-2 * Math.PI * 14000) / SR); // 14 kHz: takes the edge off
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
    const fn = Math.max(1, Math.round((fadeMs / 1000) * SR));
    const fade = () => {
      for (let k = 0; k < fn; k++) {
        const w = 0.5 - 0.5 * Math.cos((Math.PI * k) / fn);
        this.L[k] *= w;
        this.R[k] *= w;
        const j = this.n - 1 - k;
        this.L[j] *= w;
        this.R[j] *= w;
      }
    };
    fade();
    let dl = 0, dr = 0;
    for (let k = 0; k < this.n; k++) { dl += this.L[k]; dr += this.R[k]; }
    dl /= this.n; dr /= this.n;
    let peak = 0;
    for (let k = 0; k < this.n; k++) {
      this.L[k] -= dl;
      this.R[k] -= dr;
      peak = Math.max(peak, Math.abs(this.L[k]), Math.abs(this.R[k]));
    }
    if (!Number.isFinite(peak) || peak <= 0) {
      throw new Error(`${this.name}: non-finite or empty buffer (peak=${peak}) — a voice produced NaN`);
    }
    const g = Math.pow(10, peakDb / 20) / Math.max(peak, 1e-9);
    for (let k = 0; k < this.n; k++) {
      this.L[k] *= g;
      this.R[k] *= g;
    }
    fade(); // so the very first and last samples are dead zero
    let out = 0;
    for (let k = 0; k < this.n; k++) out = Math.max(out, Math.abs(this.L[k]), Math.abs(this.R[k]));
    this.peakDb = 20 * Math.log10(Math.max(out, 1e-9));
    this.rawPeak = peak;
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
    this.path = path;
  }
}

/** ffmpeg ebur128 + volumedetect on the written file. Measurement only. */
const measure = (path) => {
  // ffmpeg writes its measurements to stderr, so the run is captured whole.
  const r = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", path, "-filter_complex", "ebur128=peak=true,volumedetect", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const txt = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
  // ebur128 prints a running I:/LRA: on every window and then the Summary, so
  // the LAST match is the integrated figure for the whole stem.
  const grab = (re) => {
    const m = txt.match(new RegExp(re.source, "g"));
    if (!m) return "?";
    const last = m[m.length - 1].match(re);
    return last ? last[1] : "?";
  };
  return {
    lufs: grab(/I:\s*(-?[\d.]+) LUFS/),
    lra: grab(/LRA:\s*(-?[\d.]+) LU/),
    truePeak: grab(/Peak:\s*(-?[\d.]+) dBFS/),
    maxVol: grab(/max_volume:\s*(-?[\d.]+) dB/),
    meanVol: grab(/mean_volume:\s*(-?[\d.]+) dB/),
  };
};

// Director's trim: per-stem -14 dBFS peaks leave the closing cut ~8 LU hotter than
// its neighbours (its wake is continuous where the others are sparse events). The
// set is heard as ONE clip, so the dense stem comes down to sit with the rest.
const STEM_PEAK_DB = { IncreasinglyDifficult: -20.0 };

const finish = (S) => {
  S.master(STEM_PEAK_DB[S.name] ?? PEAK_DB);
  const path = `${OUT_DIR}/${S.name}_SFX.wav`;
  S.write(path);
  const m = measure(path);
  console.log(`\n=== ${S.name}  ${S.frames} f  ${f2s(S.frames).toFixed(4)} s`);
  console.log(`    ${S.line}`);
  console.log(`    ${path}`);
  console.log(
    `    peak ${S.peakDb.toFixed(2)} dBFS   true peak ${m.truePeak} dBFS   ` +
      `integrated ${m.lufs} LUFS   LRA ${m.lra} LU   mean ${m.meanVol} dB`,
  );
  console.log("    frame    sec     cue");
  S.cues
    .slice()
    .sort((a, b) => a.frame - b.frame)
    .forEach(({ frame, name }) => {
      console.log(`    ${String(frame).padStart(6)}  ${f2s(frame).toFixed(3).padStart(6)}  ${name}`);
    });
  return { name: S.name, frames: S.frames, peak: S.peakDb, ...m };
};

mkdirSync(OUT_DIR, { recursive: true });
const summary = [];

// ===========================================================================
// CUT 3 — FakeTestEnvironment, 149 f.
//   "...they're pretty smart, they're pretty clever, and they're really good at
//    recognizing when they're in, like, a fake test environment."
//
// FRAMES, from the component's own header and exports (nothing retyped):
//   smart f35 / clever f50 / good f72 / recognizing f83 / environment f121-133
//     -> FakeTest.BEAT_CHECK
//   the mark's ONE ramp                    header gesture 2: "ripens ... over 12
//                                          frames (f30-42)"
//   the hand is born                       HAND_TRACK.F_BIRTH  (47)
//   the hand is wall-length                HAND_TRACK.F_REACH  (69)
//   the last solid arc closes              HAND_TRACK.F_CLOSE  (130)
//   five people flip                       HAND_TRACK.PEOPLE[i].flip
//                                          (84 / 93 / 103 / 114 / 122, solved
//                                          off the angle track, not keyed)
//   the tip's screen speed, per frame      STATS.tipV  (peak 47.4 at f87)
//
// SOUND: the model lights once; the hand is one continuous whoosh whose level
// and colour ARE the tip speed; every state change is a tick because the hand
// reached it; the ring closing is the only landing.
// ===========================================================================
{
  const S = new Stem("FakeTestEnvironment", FakeTest.DURATION, "cut 3 — the hand finds out everything is dashed");
  const H = FakeTest.HAND_TRACK;
  const B = FakeTest.BEAT_CHECK;
  const tipV = FakeTest.STATS.tipV;

  const tip = (f) => {
    const L = H.lenAt(f);
    const a = H.handAngle(f);
    return H.screenAt(f, H.C.x + Math.cos(a) * L, H.C.y + Math.sin(a) * L);
  };
  // the tip's HORIZONTAL DIRECTION of travel, which is what pans the whoosh
  const panTip = (f) => {
    const a = tip(Math.max(H.F_BIRTH, f - 0.5));
    const b = tip(f + 0.5);
    return clampPm((b[0] - a[0]) / 26) * 0.4;
  };
  const tipRows = tipV.map((v, i) => [i, v]);
  const vTip = (f) => tableAt(tipRows, f);

  // 2. THE MODEL LIGHTS — the ramp's first frame, so the blip's 180 ms body
  //    runs into "smart" (f35) rather than after it.
  S.vModel({ f: 30, gain: 1.0, pan: 0, label: `the mark ripens (ramp f30-42, "smart" f${B.smart})` });

  // 3./4. THE HAND. One voice from its birth to the last frame: nothing else
  //    is sustained in this cut.
  S.vWhoosh({
    f0: H.F_BIRTH,
    f1: FakeTest.DURATION,
    vScreen: vTip,
    panAt: panTip,
    angleAt: H.handAngle,
    gain: 1.0,
    label: `the gaze hand (born f${H.F_BIRTH}, wall-length f${H.F_REACH}, peak ${FakeTest.STATS.maxTip} px/f at f${FakeTest.STATS.maxTipAt})`,
  });

  // 4a. A PERSON TURNS OUT TO BE A PROP. One tick per flip, panned where they
  //     stand. Solved frames, straight off the component.
  H.PEOPLE.slice()
    .sort((a, b) => a.flip - b.flip)
    .forEach((p) => {
      const scr = H.screenAt(p.flip, p.x, p.y);
      S.vFlip({
        f: p.flip,
        gain: 0.95,
        pan: panOfX(scr[0], 0.5),
        hz: 2600 + p.i * 220,
        label: `person ${p.i} -> dashed prop`,
      });
    });

  // 4b. THE WALL CONVERTS BEHIND THE HAND. A sparse stream along the front:
  //     one tick per 20 degrees of the hand's own turn, which at its 5.7 deg/f
  //     is ~6.9/s — inside the 12/s cap and well under a buzz.
  {
    const STEP = (20 * Math.PI) / 180;
    let next = Math.ceil(H.handAngle(H.F_REACH) / STEP) * STEP;
    let n = 0;
    for (let f = H.F_REACH; f <= H.F_CLOSE; f += 0.25) {
      if (H.handAngle(f) >= next) {
        const t = tip(f);
        S.vFlip({ f: Number(f.toFixed(2)), gain: 0.45, pan: panOfX(t[0], 0.5), hz: 3300 });
        next += STEP;
        n++;
      }
    }
    S.cue(H.F_REACH, `wall solid -> dashed behind the hand, ${n} ticks every 20 deg  [flip ticks f${H.F_REACH}-${H.F_CLOSE}]`);
  }

  // 4c. THE RING CLOSES on f130, inside "environment" — the cut's one landing.
  S.vLand({ f: H.F_CLOSE, gain: 1.0, pan: 0, label: `the last solid arc closes ("environment" f${B.environment})` });

  summary.push(finish(S));
}

// ===========================================================================
// CUT 4 — AnswerKeyInTheFolder, 168 f.
//   "...you give it a math question and then it has like a folder with the
//    answer key in it and like, does it look at the answer key?"
//
// Every level here is DIFFERENTIATED OUT OF AnswerKey.STATE_AT(f), so each
// pencil is the speed of its own head and stops when the head stops:
//   wallDraw         the two wipe heads, f0-36 (STATS.wipeClose = 36); a head
//                    covers pi*r = 1068 world px of arc
//   questionDraw     the ring in the evaluator's hands, f34-42
//   questionIconDraw the radical stroking on, f40-50
//   questionAt       the station descending, f43-59 (it LANDS, it is not drawn)
//   workThread       the thread reaching the question ring, f59-68
//   folderDraw       f71-81, folderIconDraw f76-85
//   keyRise          f92-110, settled on "in it"
//   gazeAngle        the needle, born f124, swinging f130-152
//   modelTone        the model ripening from f57
// Beats: you f41 / question f52 / folder f84 / inIt f110 / look f129 / end f152
// (AnswerKey.BEAT_CHECK).
// ===========================================================================
{
  const S = new Stem("AnswerKeyInTheFolder", AnswerKey.DURATION, "cut 4 — the eval is built around the model");
  const B = AnswerKey.BEAT_CHECK;
  const st = (f) => AnswerKey.STATE_AT(f);
  const k = (f) => AnswerKey.CAM_AT(f).k;

  const HALF_CIRC = Math.PI * WALL.r; // 1068 world px per wipe head

  // 2. THE ENCLOSURE. Two heads, so the voice is centred and wide.
  S.vDraw({
    f0: 0,
    f1: 37,
    vScreen: (f) => dAt((x) => st(x).wallDraw, f) * HALF_CIRC * k(f),
    gain: 0.5,
    dashed: true,
    vWorld: (f) => dAt((x) => st(x).wallDraw, f) * HALF_CIRC,
    label: 'the dashed wall wipes on ("evaluations for this where")',
  });
  S.vLand({ f: 36, gain: 0.5, label: "the two heads meet at the top (STATS.wipeClose)" });

  // 4. THE QUESTION IS MADE, in the evaluator's hands, high in the frame.
  const qPan = (f) => panOfX(sx(AnswerKey.CAM_AT(f), st(f).questionAt.x), 0.35);
  S.vDraw({
    f0: 34,
    f1: 43,
    vScreen: (f) => dAt((x) => st(x).questionDraw, f) * 2 * Math.PI * STATION_R * k(f),
    pan: qPan,
    gain: 0.55,
    label: 'the question ring wipes on ("you give")',
  });
  S.vDraw({
    f0: 40,
    f1: 51,
    vScreen: (f) => dAt((x) => st(x).questionIconDraw, f) * glyphLen(STATION_R) * k(f),
    pan: qPan,
    gain: 0.45,
    label: 'the radical strokes on ("a math question")',
  });

  // 5. IT IS HANDED DOWN, THROUGH THE WALL, and LANDS on f59, inside
  //    "question" (f52-62). The descent itself is an object moving, not a line
  //    being drawn, so it has no voice — only the landing.
  S.vLand({ f: 59, gain: 1.0, pan: qPan(59), label: `the station lands on QUESTION ("question" f${B.question})` });

  // 6. IT STARTS WORKING: the model ripens from f57, then the thread reaches.
  S.vModel({ f: 57, gain: 0.85, label: "the model ripens (modelTone leaves 0)" });
  S.vDraw({
    f0: 59,
    f1: 69,
    vScreen: (f) => dAt((x) => st(x).workThread, f) * THREAD_LEN * k(f),
    pan: qPan(64),
    gain: 0.45,
    label: "the work thread reaches the question ring",
  });

  // WORK PACKETS from f68, every PACKET_PERIOD, out and back along a 204 world
  // px thread at PACKET_SPEED — so the return is 2*204/26 = 15.7 frames later.
  {
    const round = (2 * THREAD_LEN) / PACKET_SPEED;
    for (let f = 68; f < AnswerKey.DURATION; f += PACKET_PERIOD) {
      S.vPip({ f, gain: 0.8, pan: qPan(f) * 0.5 });
      if (f + round < AnswerKey.DURATION) S.vPip({ f: f + round, back: true, gain: 0.8, pan: qPan(f) * 0.5 });
    }
    S.cue(68, `work packets out/back from f68 every ${PACKET_PERIOD} f (round trip ${round.toFixed(1)} f)  [pips]`);
  }

  // 7. THE FOLDER draws on in place.
  const fPan = panOfX(sx(AnswerKey.CAM_AT(80), FOLDER.x), 0.35);
  S.vDraw({
    f0: 71,
    f1: 82,
    vScreen: (f) => dAt((x) => st(x).folderDraw, f) * 2 * Math.PI * FOLDER_R * k(f),
    pan: () => fPan,
    gain: 0.5,
    label: `the folder ring draws on ("folder" f${B.folder})`,
  });
  S.vDraw({
    f0: 76,
    f1: 86,
    vScreen: (f) => dAt((x) => st(x).folderIconDraw, f) * glyphLen(FOLDER_R) * k(f),
    pan: () => fPan,
    gain: 0.45,
    label: "the folder glyph strokes on",
  });

  // 8. THE KEY rises out of the folder's mouth and SETTLES on f110, "in it".
  S.vDraw({
    f0: 92,
    f1: 110,
    vScreen: (f) => dAt((x) => st(x).keyRise, f) * 2 * FOLDER_R * k(f),
    pan: () => fPan,
    gain: 0.35,
    label: "the key rises out of the folder",
  });
  S.vLand({ f: 110, gain: 0.95, pan: fPan, label: `the key settles ("in it" f${B.inIt})` });

  // 10. THE NEEDLE. Born on the work thread's own angle, swinging f130-152; its
  //     tip never exceeds 8.6 screen px/frame, so this is only just audible.
  S.vWhoosh({
    f0: 128,
    f1: 156,
    vScreen: (f) => {
      const a0 = st(f - 0.5).gazeAngle;
      const a1 = st(f + 0.5).gazeAngle;
      if (a0 === null || a1 === null) return 0;
      return Math.abs(a1 - a0) * st(f).gazeLength * k(f);
    },
    gain: 0.4,
    label: `the needle swings off the thread ("does it look" f${B.look})`,
  });

  summary.push(finish(S));
}

// ===========================================================================
// CUT 5 — DoesItTellYou, 82 f. The bridge.
//   "and if it does look at the answer key, does it tell you that it looked at
//    the answer key?"
//
// The two branches are DASHED (imagined), so they are the drawing voice gated
// into fine grains. Frames are DoesItTell.STATS:
//   look branch     look.draw   [5, 16]  lands on the folder ring at f16
//                   look.undraw [48, 54]
//   report branch   report.f0 19 · wallCross 29 · frameLeave 37 · backF0 45 ·
//                   gone 63, with report.lenAt the head's own length table
//   beads           beads.launches [34, 42]; beads.ends [[34,49],[42,53]] —
//                   the withdrawing head sweeps both of them up
//   work packets    the bridge's re-rated clock c(f) = 152 + f*72/66 (JOIN),
//                   so a launch happens whenever c passes a multiple of 16
// Beats: iff f5 / answer f18 / tell f28 / you f32 / key2 f48 / join f66.
// ===========================================================================
{
  const S = new Stem("DoesItTellYou", DoesItTell.DURATION, "cut 5 — two dashed branches, asked and taken back");
  const B = DoesItTell.BEAT_CHECK;
  const R = DoesItTell.STATS.report;
  const LK = DoesItTell.STATS.look;
  const k = (f) => DoesItTell.CAM_AT(f).k;

  // 1. THE IMAGINED LOOK, from the needle's tip to the folder ring.
  const lookLen = (f) => LK.fullWorld * smoothstep((f - LK.draw[0]) / (LK.draw[1] - LK.draw[0]));
  S.vDraw({
    f0: LK.draw[0],
    f1: LK.draw[1] + 1,
    vScreen: (f) => dAt(lookLen, f) * k(f),
    vWorld: (f) => dAt(lookLen, f),
    dashed: true,
    pan: () => panOfX(sx(DoesItTell.CAM_AT(12), FOLDER.x), 0.35),
    gain: 0.65,
    label: `the dashed look branch runs to the folder ("if it does look" f${B.iff})`,
  });
  S.vLand({
    f: LK.draw[1],
    gain: 0.9,
    pan: panOfX(sx(DoesItTell.CAM_AT(16), FOLDER.x), 0.35),
    label: `it lands on the folder ring ("answer" f${B.answer})`,
  });

  // 2./3. THE IMAGINED REPORT, straight up and out of the frame. Its head's
  //    length table is the component's own (STATS.report.lenAt).
  const repLen = (f) => tableAt(R.lenAt, f);
  S.vDraw({
    f0: R.f0,
    f1: R.frameLeave + 1,
    vScreen: (f) => dAt(repLen, f) * k(f),
    vWorld: (f) => dAt(repLen, f),
    dashed: true,
    pan: () => 0,
    gain: 0.7,
    label: `the dashed report branch climbs out of frame ("does it tell you" f${B.tell})`,
  });

  // 3. TWO BEADS, and neither gets out.
  DoesItTell.STATS.beads.launches.forEach((f) => S.vPip({ f, gain: 0.9, label: "a bead leaves the tip" }));
  DoesItTell.STATS.beads.ends.forEach(([, f]) => S.vPip({ f, back: true, gain: 0.9, label: "the head sweeps a bead up" }));

  // 4./5. THE WITHDRAWAL. The drawing voice reversed, twice, out of step.
  S.vSwish({ f0: R.backF0, f1: R.gone, gain: 0.62, label: `the report branch un-draws ("the answer key" f${B.key2})` });
  S.vSwish({
    f0: LK.undraw[0],
    f1: LK.undraw[1],
    gain: 0.35,
    pan: panOfX(sx(DoesItTell.CAM_AT(50), FOLDER.x), 0.35),
    label: "the look branch un-draws",
  });

  // WORK PACKETS: the bridge's own re-rated clock, so the series is cut 3's.
  {
    const c = (f) => 152 + (f * 72) / 66;
    const round = (2 * THREAD_LEN) / PACKET_SPEED;
    const qPan = panOfX(sx(DoesItTell.CAM_AT(30), QUESTION.x), 0.3);
    const launches = [];
    for (let world = 160; world <= c(DoesItTell.DURATION); world += PACKET_PERIOD) {
      const f = ((world - 152) * 66) / 72;
      launches.push(Number(f.toFixed(1)));
      S.vPip({ f, gain: 0.65, pan: qPan });
      const back = f + (round * 66) / 72;
      if (back < DoesItTell.DURATION) S.vPip({ f: back, back: true, gain: 0.65, pan: qPan });
    }
    S.cue(launches[0], `work packets on the re-rated clock, launches f${launches.join(", f")}  [pips]`);
  }

  summary.push(finish(S));
}

// ===========================================================================
// CUT 6 — SeemsLikeATrap, 154 f. ONE OF THE CLIP'S TWO PEAKS.
//   "...the models see that there's an answer key in this file, in this folder,
//    and they're like: huh, this seems like a trap."
//
// Per-frame state is SeemsTrap.STATE_AT(f): gazeAngle / gazeLength (the swing),
// wire (0..1 along a 293.3 world px path), eye (the ring and iris drawing on),
// folderDashed (the conversion), modelOffset (the recoil).
// Frames: models f22 / see f28 / theres f46 / folder f77 / huh f97 / TRAP f117
// (SeemsTrap.BEAT_CHECK), wire f0 106 -> lands f117 (STATS.wire), eye drawn by
// f128 (STATS.eye.drawAt), folder dashed f107-112 (STATS.folderDashedAt).
// ===========================================================================
{
  const S = new Stem("SeemsLikeATrap", SeemsTrap.DURATION, "cut 6 — the wire reaches the eye on 'trap' (PEAK)");
  const B = SeemsTrap.BEAT_CHECK;
  const st = (f) => SeemsTrap.STATE_AT(f);
  const k = (f) => SeemsTrap.CAM_AT(f).k;
  const W = SeemsTrap.STATS.wire;
  const fPan = (f) => panOfX(sx(SeemsTrap.CAM_AT(f), FOLDER.x), 0.35);

  // 2. THE SWING LANDS on the folder ring at f34, in the middle of "see".
  S.vWhoosh({
    f0: 20,
    f1: 40,
    vScreen: (f) => Math.abs(dAt((x) => st(x).gazeAngle, f)) * st(f).gazeLength * k(f),
    panAt: (f) => fPan(f) * 0.6,
    gain: 0.5,
    label: `the needle swings off the middle ("the models see" f${B.models})`,
  });
  S.vLand({ f: 34, gain: 0.8, pan: fPan(34), label: `its tip reaches the folder ring ("see" f${B.see})` });

  // 4. READING THE LABEL. An accent packet out to the ring and back, on the
  //    component's own launches; the f94 one turns back 38 % out and is home by
  //    f101 (header gesture 5).
  [46, 62, 78].forEach((f) => {
    S.vPip({ f, gain: 0.85, pan: fPan(f) * 0.6, label: "a packet reads the label" });
    S.vPip({ f: f + (2 * 221.6) / PACKET_SPEED, back: true, gain: 0.85, pan: fPan(f) * 0.6 });
  });
  S.vPip({ f: 94, gain: 0.85, pan: fPan(94) * 0.6, label: "the packet that turns back" });
  S.vPip({ f: 101, back: true, gain: 0.85, pan: fPan(101) * 0.6, label: "...home again" });

  // WORK PACKETS: cut 3's series, which the join puts exactly on f0 here.
  {
    const round = (2 * THREAD_LEN) / PACKET_SPEED;
    const qPan = panOfX(sx(SeemsTrap.CAM_AT(40), QUESTION.x), 0.3);
    for (let f = 0; f < SeemsTrap.DURATION; f += PACKET_PERIOD) {
      S.vPip({ f, gain: 0.55, pan: qPan });
      if (f + round < SeemsTrap.DURATION) S.vPip({ f: f + round, back: true, gain: 0.55, pan: qPan });
    }
    S.cue(0, `work packets out/back every ${PACKET_PERIOD} f from f0 (the join's own phase)  [pips]`);
  }

  // 5. "HUH" — the same blip a minor third down with a downward glide, on the
  //    frame the recoil and the head tilt leave (f94), so its body lands on the
  //    word (f97).
  S.vModel({ f: 94, huh: true, gain: 1.0, pan: fPan(97) * 0.4, label: `the recoil and head tilt ("huh" f${B.huh})` });

  // 8. THE FOLDER IS BAIT: its ring opens into dashes, keyed on the wire's own
  //    progress. Three ticks across the conversion, not a stream.
  [107, 109, 111].forEach((f) => S.vFlip({ f, gain: 0.7, pan: fPan(f), hz: 3100, label: "the folder ring opens into dashes" }));

  // 7. THE ONE BIG MOVE. The wire runs, f106 -> f117.
  S.vDraw({
    f0: W.f0,
    f1: W.land + 1,
    vScreen: (f) => dAt((x) => st(x).wire, f) * W.lenWorld * k(f),
    pan: (f) => lerp(fPan(f), 0, clamp01((f - W.f0) / (W.land - W.f0))),
    // held under the knock it runs into: "trap" has to be the biggest event
    gain: 0.7,
    label: `the wire runs up through the wall ("seems" f${SeemsTrap.defaultProps.beats.seems})`,
  });

  // ***** THE PEAK OF THE CLIP: the wire reaches the eye on "trap". *****
  S.vLand({ f: W.land, gain: 1.0, big: true, label: `THE WIRE REACHES THE EYE ("trap" f${B.trap}) — PEAK` });

  // 7b. THE EYE: the ring wipes out from the point of contact, the iris strokes
  //     on inside it, and ONE soft model-free tone marks the iris completing.
  S.vDraw({
    f0: 117,
    f1: 129,
    vScreen: (f) => dAt((x) => st(x).eye, f) * 2 * Math.PI * EYE_R * k(f),
    gain: 0.4,
    label: "the eye's ring and iris draw on",
  });
  S.vModel({ f: 128, single: true, base: 520, gain: 0.55, label: "the iris completes (single tone, not the model)" });

  // 11. THE REPORT LINE: white packets from the wire's root to the eye.
  [117, 133, 149].forEach((f) => S.vPip({ f, gain: 0.7, pan: fPan(f) * 0.4, label: "the folder reports up the wire" }));

  // 10. THE NEEDLE settles back onto the wire's root across f128-152.
  S.vWhoosh({
    f0: 128,
    f1: SeemsTrap.DURATION,
    vScreen: (f) => Math.abs(dAt((x) => st(x).gazeAngle, f)) * st(f).gazeLength * k(f),
    gain: 0.45,
    label: "the needle settles back",
  });

  summary.push(finish(S));
}

// ===========================================================================
// CUT 7 — JustATestEnvironment, 148 f.
//   "It's not like they're doing it maliciously ... they want to scheme. No,
//    they're just like: oh, I'm in a test environment. Okay."
//
// Frames: not f3 / scheme f60 / no f74 / environment f107 / okay f117 / end f132
// (JustTest.BEAT_CHECK). The ghost plot is STATS.{plotLen 1269.2, plotV 26.2,
// plotLandsAt 65}; the hand is JustTest.HAND_AT(f) (angle + length) under
// JustTest.CAM_AT(f), whose tip peaks at STATS.tipSpeedMax = 52.1 px/f at f91;
// the work thread's series is JustTest.WORK_THREAD.launches [-14, 2, 130, 146].
// ===========================================================================
{
  const S = new Stem("JustATestEnvironment", JustTest.DURATION, "cut 7 — the plot is dropped, then one whole revolution");
  const B = JustTest.BEAT_CHECK;
  const k = (f) => JustTest.CAM_AT(f).k;
  const P = JustTest.STATS;

  // 1. THE SUSPICION IS DROPPED: the needle retracts 150 -> 72 world px, f0-14.
  S.vSwish({ f0: 0, f1: 15, gain: 0.3, pan: 0.15, label: `the needle retracts to a stub ("not ... like" f${B.not})` });

  // ...and the last packet launched before the cut lands back in the model.
  {
    const dist = Math.hypot(JustTest.THREAD_TO.x - JustTest.THREAD_FROM.x, JustTest.THREAD_TO.y - JustTest.THREAD_FROM.y);
    const round = (2 * dist) / PACKET_SPEED;
    const qPan = panOfX(sx(JustTest.CAM_AT(18), QUESTION.x), 0.3);
    JustTest.WORK_THREAD.launches.forEach((f) => {
      if (f >= 0 && f < JustTest.DURATION) S.vPip({ f, gain: 0.7, pan: qPan, label: "a work packet goes out" });
      const back = f + round;
      if (back >= 0 && back < JustTest.DURATION) S.vPip({ f: back, back: true, gain: 0.7, pan: qPan, label: "...and comes back" });
    });
  }

  // 2. THE GHOST PLOT — one continuous DASHED draw, f12 -> f65 ("scheme").
  //    The head is integrated at STATS.plotV world px/frame with a taper over
  //    the last 18 %, which is what the component does; its measured worst
  //    frame is STATS.headSpeedMax.draw = 36.4 screen px.
  {
    const F0 = 12;
    const F1 = P.plotLandsAt;
    const plotV = (f) => {
      const u = clamp01((f - F0) / (F1 - F0));
      const taper = u > 0.82 ? smoothstep((1 - u) / 0.18) * 0.85 + 0.15 : 1;
      const ramp = smoothstep(u / 0.06);
      return P.plotV * taper * ramp;
    };
    S.vDraw({
      f0: F0,
      f1: F1 + 1,
      vScreen: (f) => plotV(f) * k(f),
      vWorld: plotV,
      dashed: true,
      // out to the left and down, up the left side, over the top, down to the
      // folder's far side: the pan follows that loop
      pan: (f) => {
        const u = clamp01((f - F0) / (F1 - F0));
        return -0.35 * Math.sin(Math.PI * Math.min(1, u * 1.25)) + 0.25 * smoothstep((u - 0.75) / 0.25);
      },
      gain: 0.32,
      label: `the ghost plot sneaks round the back ("doing it maliciously ... scheme" f${B.scheme})`,
    });
    S.vLand({ f: F1, gain: 0.45, pan: 0.25, label: `the ghost lands on the folder's far side ("scheme" f${B.scheme})` });
  }

  // 3. "No" — the undraw. The drawing voice reversed: one fast decrescendo.
  S.vSwish({ f0: B.no, f1: 87, gain: 0.8, label: `the whole plot is snatched back ("No" f${B.no})` });

  // 4. THE REVOLUTION. 409 degrees, one front-loaded rate lobe, f80-130; the
  //    tip's screen speed is computed from HAND_AT under CAM_AT, the same two
  //    functions the component draws it with.
  {
    const tipXY = (f) => {
      const h = JustTest.HAND_AT(f);
      const c = JustTest.CAM_AT(f);
      const wx = MODEL_HOME.x + Math.cos(h.angle) * h.length;
      const wy = MODEL_HOME.y + Math.sin(h.angle) * h.length;
      return [540 + (wx - c.cx) * c.k, 835 + (wy - c.cy) * c.k];
    };
    const vTip = (f) => {
      const a = tipXY(f - 0.5);
      const b = tipXY(f + 0.5);
      return Math.hypot(b[0] - a[0], b[1] - a[1]);
    };
    S.vWhoosh({
      f0: 80,
      f1: 133,
      vScreen: vTip,
      panAt: (f) => clampPm((tipXY(f + 0.5)[0] - tipXY(f - 0.5)[0]) / 30) * 0.4,
      angleAt: (f) => JustTest.HAND_AT(f).angle,
      gain: 1.0,
      label: `ONE turn about the model ("they're just like: oh, I'm in a test environment" f${B.environment}), peak ${P.tipSpeedMax[0]} px/f at f${P.tipSpeedMax[1]}`,
    });
  }

  // 5. BACK TO WORK: the tip touches the question ring on f130, and the work
  //    packets start again — "Okay" (f117) is what that settle serves.
  S.vLand({ f: 130, gain: 0.9, pan: panOfX(sx(JustTest.CAM_AT(130), QUESTION.x), 0.3), label: `the hand comes to rest on the question ("okay" f${B.okay})` });

  summary.push(finish(S));
}

// ===========================================================================
// CUT 8 — IncreasinglyDifficult, 158 f. The closing cut.
//   "...realistic enough that it matches, that it's indistinguishable from the
//    real world, for them, is becoming increasingly more difficult."
//
// ACT 1 is the reverse gesture: gaps CLOSING. The two fronts run from -80.1 deg
// (where the wire crosses) to the antipode, and STATS.frontAtDeg is the
// component's own front-angle-vs-frame table; there are STATS.dashCountAtF0 =
// 64 dashes on the ring, and the ticks are angle-quantised so the peak rate
// stays under ~9/s and THINS OUT on its own as the fronts decelerate into each
// other at f64. Then near-silence through "indistinguishable" (f76-90) — only
// the work packets — so the hand starting on "for them" (f110) is heard.
//
// ACT 2: the hand turns, faster turn after turn (tip 35 -> 65 screen px/frame,
// STATS.tipSpeedAt), and the whoosh's level and centre are that same number.
// Gaps spring open along its ray: ticks emitted every 45 deg of the hand's own
// turn (STATE_AT(f).gazeAngle), which accelerates exactly as the hand does —
// 1.7/s at f113, 7.0/s through the tail, under the 12/s cap.
// Beats: making f7 / matches f58 / indistinguishable f76 / them f110 /
// increasingly f126 / difficult f137 (IncrDiff.BEAT_CHECK).
// ===========================================================================
{
  const S = new Stem("IncreasinglyDifficult", IncrDiff.DURATION, "cut 8 — the gaps close, then tear open faster than they can be healed");
  const B = IncrDiff.BEAT_CHECK;
  const st = (f) => IncrDiff.STATE_AT(f);
  const W = IncrDiff.STATS.wire;

  const eyePan = panOfX(sx(IncrDiff.CAM_AT(10), EYE.x), 0.3);
  const folderPan = panOfX(sx(IncrDiff.CAM_AT(40), FOLDER.x), 0.35);
  const qPan = panOfX(sx(IncrDiff.CAM_AT(40), QUESTION.x), 0.3);

  // 1. THE HAND-OFF: the last bead UP lands on the eye at f7.3.
  S.vPip({ f: W.lastUpBeadLandsAt, back: true, gain: 0.8, pan: eyePan, label: "the last report bead lands on the eye" });

  // 2./10. THE INSTRUCTIONS COME BACK DOWN. Eight launches, the component's own.
  W.downLaunches.forEach((f) =>
    S.vPip({
      f,
      back: true,
      gain: 0.8,
      pan: lerp(eyePan, folderPan, 0.4),
      // f9-51 are gesture 2 ("making an environment"); f108-150 are gesture 10,
      // the evaluator still sending fixes into a wall that is coming apart
      label:
        f < 60
          ? `a fix comes down the wire ("making an environment" f${B.making})`
          : `a fix still comes down the wire ("increasingly more difficult" f${B.increasingly})`,
    }),
  );

  // 5. THE MODEL KEEPS WORKING — cut 5's own 16-frame series, continued, and
  //    through "indistinguishable" it is the only traffic in the frame.
  {
    // the thread here is cut 7's resolved 234.1 world px (JustTest.STATS.threadLen)
    const round = (2 * JustTest.STATS.threadLen) / PACKET_SPEED;
    [-2, 14, 30, 46, 62, 78].forEach((f) => {
      if (f >= 0) S.vPip({ f, gain: 0.7, pan: qPan });
      const back = f + round;
      if (back < IncrDiff.DURATION) S.vPip({ f: back, back: true, gain: 0.7, pan: qPan });
    });
    S.cue(14, `work packets out/back, launches f-2, 14, 30, 46, 62, 78 (round trip ${round.toFixed(1)} f)  [pips]`);
  }

  // 3. THE CLOSING FRONTS. One soft low tick per 4 dashes of arc sealed, on
  //    each of the two fronts, off the component's own front-angle table.
  {
    const DASHES = IncrDiff.STATS.dashCountAtF0;
    const stepDeg = (360 / DASHES) * 4; // 22.5 deg — 9.0/s at the fronts' fastest
    const frontDeg = (f) => tableAt(IncrDiff.STATS.frontAtDeg, f);
    let next = stepDeg;
    let n = 0;
    for (let f = 14; f <= 70; f += 0.25) {
      if (frontDeg(f) >= next) {
        // two fronts, one each way from the wire's crossing: mirrored pans
        S.vGap({ f: Number(f.toFixed(2)), gain: 0.6, pan: 0.32 });
        S.vGap({ f: Number((f + 0.09).toFixed(2)), gain: 0.6, pan: -0.32 });
        next += stepDeg;
        n += 2;
      }
    }
    S.cue(14, `the gaps close: ${n} soft low ticks, thinning out as the fronts decelerate  [gap ticks f14-64]`);
    S.cue(B.indistinguishable, `near-silence holds through "indistinguishable" (f${B.indistinguishable}-90) — work packets only`);
  }

  // 7./8. THE HAND COMES OFF THE MATHS at f100 and never stops. Level and
  //    centre are the tip's screen speed, which the component ramps 0 -> 35
  //    over f100-113 and 35 -> 65 over f113-142.
  {
    const tipXY = (f) => {
      const s = st(f);
      const c = IncrDiff.CAM_AT(f);
      if (s.gazeAngle === null) return null;
      const wx = MODEL_HOME.x + Math.cos(s.gazeAngle) * s.gazeLength;
      const wy = MODEL_HOME.y + Math.sin(s.gazeAngle) * s.gazeLength;
      return [540 + (wx - c.cx) * c.k, 835 + (wy - c.cy) * c.k];
    };
    const vTip = (f) => {
      const a = tipXY(f - 0.5);
      const b = tipXY(f + 0.5);
      if (!a || !b) return 0;
      return Math.hypot(b[0] - a[0], b[1] - a[1]);
    };
    S.vWhoosh({
      f0: 100,
      f1: IncrDiff.DURATION,
      vScreen: vTip,
      panAt: (f) => {
        const a = tipXY(f - 0.5);
        const b = tipXY(f + 0.5);
        if (!a || !b) return 0;
        return clampPm((b[0] - a[0]) / 34) * 0.4;
      },
      angleAt: (f) => st(Math.max(100, f)).gazeAngle,
      gain: 1.0,
      // the component ramps the tip 0 -> 35 px/f over f100-113 and 35 -> 65
      // over f113-142 (header, ARITHMETIC THAT MATTERS), held through the tail
      label: `the hand comes off the maths and accelerates ("for them" f${B.them} -> "difficult" f${B.difficult}), tip 35 -> ${IncrDiff.STATS.tipSpeedMax[0]} px/f`,
    });

    // 8. GAPS SPRING OPEN along the hand's ray: one tick every 45 degrees of
    //    its own turn, so the rate accelerates exactly as the hand does.
    const STEP = (45 * Math.PI) / 180;
    const a0 = st(100).gazeAngle;
    let next = a0 - STEP;
    let n = 0;
    let first = null;
    for (let f = 100; f <= IncrDiff.DURATION; f += 0.25) {
      const a = st(f).gazeAngle;
      if (a !== null && a <= next) {
        const t = tipXY(f);
        S.vFlip({ f: Number(f.toFixed(2)), gain: 0.7, pan: panOfX(t[0], 0.45), hz: 3200 });
        if (first === null) first = Number(f.toFixed(1));
        next -= STEP;
        n++;
      }
    }
    S.cue(first ?? 100, `gaps spring open behind the hand: ${n} ticks, one per 45 deg of turn, accelerating  [flip ticks]`);
  }

  // 9. THE FOLDER RE-OPENS on the hand's first pass over its bearing — the
  //    component's own STATS.folderDashedAt reaches 1 on f142, "difficult".
  S.vFlip({ f: 142, gain: 0.9, pan: folderPan, hz: 2800, label: `the folder's ring springs open ("difficult" f${B.difficult})` });

  summary.push(finish(S));
}

// ===========================================================================
// CUT 1 — DeployToTheRealWorld, 113 f.
//   "then you can get a sense of, like, okay: is the AI actually going to
//    behave well when we deploy it in the real world?"
//
// This cut has its own tall world (no stations, no thread, no packets — the
// header is explicit that nothing in the line motivates one), so its stem has
// no pips at all. Frames, all from the component:
//   the teaching wipe   f1-19, every frame at the set's ceiling
//                       (STATS.maxWipePx 45, wipeLandF 19, wipeHalfArc 582.5)
//   three props flip    STATS.propFlip[i][0] — f8 / f11 / f13, the frame each
//                       prop is half converted, i.e. the frame the head passed
//                       its own height (the component solves it off the wipe,
//                       not off a timer)
//   the forecast draws  f16-64. Deploy.HEAD_S is the head's ARC LENGTH per
//                       frame, indexed by frame, so its difference IS the head
//                       speed — no re-derivation and no guess.
//   it lands            STATS.headLandsAt = 64
//   the deployment      beats.deploy f80: the mark goes out through the gate and
//                       the dashed forecast converts to solid behind it
// Beats: sense f17 / well f72 / deploy f80 / real f89 (Deploy.BEAT_CHECK).
// ===========================================================================
if (existsSync(fileURLToPath(new URL("../generated/components/DeployToTheRealWorld.tsx", import.meta.url)))) {
  const Deploy = await import("../generated/components/DeployToTheRealWorld.tsx");
  const S = new Stem("DeployToTheRealWorld", Deploy.DURATION, "cut 1 — the test turns dashed, then the model is deployed");
  const B = Deploy.BEAT_CHECK;
  const k = (f) => Deploy.camAt(f).k;

  // 1. THE TEACHING WIPE, f1-19. Two heads leaving the ring's bottom point and
  //    running up both sides, converting solid -> marching dashes behind them.
  //    Every frame of it measures AT the set's 45 screen px/frame ceiling (the
  //    header's DEVIATIONS: "every one of those frames measures at the
  //    ceiling"), so the speed is that constant with a two-frame ease either
  //    end rather than a differentiated table the component does not expose.
  {
    const F0 = 1;
    const F1 = Deploy.STATS.wipeLandF;
    const vS = (f) =>
      Deploy.STATS.maxWipePx * smoothstep((f - F0) / 2) * smoothstep((F1 - f) / 2.5);
    S.vDraw({
      f0: F0,
      f1: F1 + 1,
      vScreen: vS,
      vWorld: (f) => vS(f) / k(f),
      dashed: true,
      gain: 0.6,
      label: `the ring is wiped solid -> dashed ("then you can get" f${Deploy.defaultProps.beats.get})`,
    });
    S.vLand({ f: F1, gain: 0.7, label: `the two heads meet at the gate (STATS.wipeLandF)` });
  }

  // 1a. A PROP TURNS OUT TO BE A PROP, as each head passes its own height.
  Deploy.STATS.propFlip.forEach(([half], i) => {
    S.vFlip({
      f: half,
      gain: 0.95,
      pan: panOfX(540 + (Deploy.FAKE_PROPS[i].x - 540) * k(half), 0.5),
      hz: 2600 + i * 320,
      label: `prop ${i} -> dashed fake (half converted; solid by f${Deploy.STATS.propFlip[i][1]})`,
    });
  });

  // 3. THE FORECAST. A dashed line growing out of the gate on the mark's own
  //    curve, continued. HEAD_S[f] is its arc length, so the difference is the
  //    head speed in world px/frame.
  {
    const arc = (f) => tableAt(Deploy.HEAD_S.map((s, i) => [i, s]), f);
    const F1 = Deploy.STATS.headLandsAt;
    S.vDraw({
      f0: 15,
      f1: F1 + 1,
      vScreen: (f) => dAt(arc, f) * k(f),
      vWorld: (f) => dAt(arc, f),
      dashed: true,
      // panned by where the head is on the big slalom (t ~ arc / L_B)
      pan: (f) => panOfX(540 + (Deploy.bigPt(clamp01(arc(f) / Deploy.L_B)).x - 540) * k(f), 0.4),
      gain: 0.6,
      label: `the dashed forecast runs the big slalom ("a sense of, like, okay" f${B.sense})`,
    });
    S.vLand({ f: F1, gain: 0.5, label: `the forecast's head lands at the top ("behave well" f${B.well})` });
  }

  // 6. THE DEPLOYMENT. On "deploy" the mark goes OUT through the gate.
  S.vLand({ f: B.deploy, gain: 1.0, label: `the mark goes out through the gate ("deploy" f${B.deploy})` });

  // ...and behind it the forecast converts dashed -> solid, because the mark has
  //    reached it. One tick per 60 world px of course covered: sparse, and it is
  //    the mark's own position that emits it.
  {
    let last = Deploy.modelAt(B.deploy).y;
    let n = 0;
    for (let f = B.deploy; f < Deploy.DURATION; f += 0.5) {
      const p = Deploy.modelAt(f);
      if (last - p.y >= 60) {
        S.vFlip({ f: Number(f.toFixed(1)), gain: 0.6, pan: panOfX(540 + (p.x - 540) * k(f), 0.45), hz: 3000 });
        last = p.y;
        n++;
      }
    }
    S.cue(B.deploy, `the forecast goes solid behind the mark: ${n} ticks, one per 60 world px ("in the real world" f${B.real})  [flip ticks]`);
  }

  summary.push(finish(S));
} else {
  console.log("\n=== DeployToTheRealWorld: component not present, stem skipped.");
}

// ===========================================================================
// CUT 2 — PerfectMatch, 121 f. THE CLIP'S OTHER PEAK.
//   "like, if you just have a perfect evaluation / real-world deployment match,
//    then that's the path."
//
// Cut 1 continued, so the world constants are imported from Deploy and the
// camera is flat at STATS.kConstant. This cut has no thread and no packets
// either. Frames, from PerfectMatch.STATS:
//   the lift + the scale  STATS.liftScale = [[frame, lift 0..1, scale 1..2,
//                         absorbed 0..1], ...] — the copy's anchor slides from
//                         the ring's bottom point to the gate (L = H_S) while it
//                         scales, so its FAR END is at
//                             1800 - lift*H_S - scale*H_S
//                         and the difference of that is the tip speed the
//                         drawing voice follows (STATS.maxCopyTipPx 42.2 at f16)
//   the seating           the `absorbed` column: the seam walks up the course
//                         from f34 and is home on STATS.copyGoneAt = 62
//   ***"match"***         f62 — the copy seats onto the real course. The second
//                         of the clip's two peaks, and the only other `big`
//                         landing in the whole set.
// Beats: perfect f13 / evaluation f20 / real f36 / deployment f53 / match f61 /
// path f97 (PerfectMatch.defaultProps.beats).
// ===========================================================================
if (existsSync(fileURLToPath(new URL("../generated/components/PerfectMatch.tsx", import.meta.url)))) {
  const Match = await import("../generated/components/PerfectMatch.tsx");
  const Deploy = await import("../generated/components/DeployToTheRealWorld.tsx");
  const S = new Stem("PerfectMatch", Match.DURATION, "cut 2 — the copy seats on the real course on 'match' (PEAK)");
  const B = Match.defaultProps.beats;
  const LS = Match.STATS.liftScale;
  const kFlat = Match.STATS.kConstant[0]; // k is constant across this cut

  const lift = (f) => tableAt(LS.map((r) => [r[0], r[1]]), f);
  const scale = (f) => tableAt(LS.map((r) => [r[0], r[2]]), f);
  const absorbed = (f) => tableAt(LS.map((r) => [r[0], r[3]]), f);
  // the copy's far end, in world y, off the ring's bottom point (1800)
  const farEnd = (f) => 1800 - lift(f) * Deploy.H_S - scale(f) * Deploy.H_S;

  // 2./3. THE LIFT AND THE SCALE. A dashed copy of the test lane detaching and
  //    growing; at f5 it is exactly on top of the lane, so there is nothing to
  //    hear until it moves, which the speed-following level gives for free.
  S.vDraw({
    f0: LS[0][0],
    f1: Match.STATS.copyGoneAt + 1,
    vScreen: (f) => Math.abs(dAt(farEnd, f)) * kFlat,
    vWorld: (f) => Math.abs(dAt(farEnd, f)),
    dashed: true,
    gain: 0.65,
    label: `the dashed copy lifts out of the gate and scales 1x -> 2x ("a perfect evaluation" f${B.perfect})`,
  });

  // 4. THE SEATING. The copy is absorbed into the real course from the bottom
  //    up, and the seam ACCELERATES into "match". One tick per tenth of the
  //    seam, thinned to a 2-frame minimum spacing so the run into the landing
  //    stays under the 12/s cap.
  {
    let prev = -99;
    const at = [];
    for (let step = 1; step <= 9; step++) {
      const want = step / 10;
      for (let f = 34; f <= Match.STATS.copyGoneAt; f += 0.25) {
        if (absorbed(f) >= want) {
          if (f - prev >= 2) {
            S.vFlip({ f: Number(f.toFixed(2)), gain: 0.7, hz: 2900 + step * 60 });
            at.push(Number(f.toFixed(1)));
            prev = f;
          }
          break;
        }
      }
    }
    S.cue(at[0] ?? 34, `the copy is absorbed into the course, seam at f${at.join(", f")} — accelerating into "match"  [flip ticks]`);
  }

  // ***** THE OTHER PEAK OF THE CLIP: the copy seats on "match". *****
  S.vLand({
    f: Match.STATS.copyGoneAt,
    gain: 1.0,
    big: true,
    label: `THE COPY SEATS ON THE REAL COURSE ("match" f${B.match}) — PEAK`,
  });

  // 5. THE LAST GLIDE is the model opening up and riding the path. Nothing is
  //    added for it: after the landing the cut is deliberately quiet, so the
  //    landing is the last thing heard and the line ends on the picture.
  S.cue(B.then, `nothing after the landing: "then that's the path" (f${B.then}-${B.end}) is left to the picture`);

  summary.push(finish(S));
} else {
  console.log("\n=== PerfectMatch: component not present, stem skipped.");
}

// ---------------------------------------------------------------------------
console.log("\n--- summary -------------------------------------------------");
console.log("stem                        frames   peak dBFS   integrated LUFS");
summary.forEach((s) => {
  console.log(
    `${s.name.padEnd(26)}${String(s.frames).padStart(6)}   ${s.peak.toFixed(2).padStart(9)}   ${String(s.lufs).padStart(15)}`,
  );
});
