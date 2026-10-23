// ---------------------------------------------------------------------------
// noSustainedProgressPlan — the camera, the never-built stair's lines and drawing schedule, Euclid's turn and the
// world options of cut D NoSustainedProgress (kyle-greek-math, cut 38). No drawing here (numbers only), so the audit
// scripts can import it. The world: ./greekStairWorld (read-only; contract <notes>/STAIR_READY.md).
//
// THE JOIN: D opens on C's last frame exactly. Everything starts from greekStairWorld's C_END (imported, never copied;
// asserted at module load): the camera C_END.cam (with C's velocity at f228), the world clock t = C_END.t + f, the
// rest camera C_END.rest, C's end options C_END.opts, Euclid's pose euclidPose(228).
// ---------------------------------------------------------------------------
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import * as GF from "./greekFolk";
import {
  C_END,
  EUCLID,
  EUCLID_HEAD_H,
  EUCLID_YAW,
  GENERATIONS,
  HALF_W,
  NEVER_BUILT,
  N_STEPS,
  OFFER,
  OFFER_YAW,
  RISE,
  TREAD,
  U,
  cameraC,
  euclidPose,
  genPose,
  tabletAt,
  type Line3,
  type StairCam,
  type V3,
  type WorldOpts,
} from "./greekStairWorld";

export const D_DURATION = 188;

// ---- the join (asserted at module load: C may still be tuned until the director signs it off) ----------------------
if (C_END.f !== 228 || C_END.t !== 228) throw new Error("NoSustainedProgress: C_END is no longer C's f228");
if (Math.abs(cameraC(C_END.f).Zc - C_END.cam.Zc) > 1e-9) throw new Error("NoSustainedProgress: C_END moved");
{
  const a = euclidPose(C_END.t);
  const b = GF.POSES.holdScroll(1, EUCLID_YAW);
  if (a.yaw !== b.yaw) throw new Error("NoSustainedProgress: Euclid's end pose moved");
}

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** smootherstep (C2 at both ends) */
const smoother = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * t * (t * (6 * t - 15) + 10);
};

// =====================================================================================================================
// THE CAMERA: one crane up the stair to Euclid and over his landing (one velocity lobe), decelerating into a creep
// =====================================================================================================================
/** the channels of a camera (as cut C keys them): ln Euclid px (F*312/Dz), ln F, eye height E, Euclid's head-top row
 *  headY, eye X */
export const chansOf = (c: StairCam) => {
  const Dz = EUCLID.Z - c.Zc;
  return [Math.log((c.F * 312) / Dz), Math.log(c.F), c.E, c.hy - (c.F * (EUCLID_HEAD_H - c.E)) / Dz, c.X];
};
export const camOfChans = (s: number[]): StairCam => {
  const [lpx, lF, E, headY, X] = s;
  const F = Math.exp(lF);
  const Dz = (F * 312) / Math.exp(lpx);
  return { X, E, Zc: EUCLID.Z - Dz, F, hy: headY + (F * (EUCLID_HEAD_H - E)) / Dz };
};
/** the resolved framing (f ~150): the eye 15 m up, 6.5 m in front of Euclid (over the stair's foot), F 1032 (a wide
 *  lens, so the lone columns stand in the haze either side): Euclid ~290-300 px in the lower middle (head y ~830, feet
 *  ~1100 at the top of the caption band), the landing's tread round him and its back edge, the never-built stair rising
 *  from that edge out of the top of the frame; Eudoxus's face and tablet and EUCLID carved in the riser in the gap
 *  between the caption bands (y ~1270-1350); Theaetetus and the rest below the frame */
export const D_END = { E: 15 * U, Dz: 6.5 * U, F: 1032, headY: 838, X: 0 };
const END_CH = (() => {
  const Zc = EUCLID.Z - D_END.Dz;
  const hy = D_END.headY + (D_END.F * (EUCLID_HEAD_H - D_END.E)) / D_END.Dz;
  return chansOf({ X: D_END.X, E: D_END.E, Zc, F: D_END.F, hy });
})();
/** the move: one lobe v ~ u^A (1-u)^B over [0, T] frames (under way from f0, peak ~f35, ~70 % done by f53 when the
 *  tips start, ~99 % by f122); under its tail a creep eases in: a slow lens zoom (CREEP.z per frame, ln) about the
 *  screen row CREEP.y, so the picture keeps growing toward Euclid while the row of Eudoxus's face, his tablet and the
 *  carved EUCLID (in the gap between the caption bands) holds still */
export const LOBE = { T: 150, A: 1.5, B: 5 };
export const CREEP = { z: 0.00042, y: 1305, f0: 60, f1: 140 };
const LOBE_TAB = (() => {
  const N = 600;
  const acc = [0];
  for (let i = 1; i <= N; i++) {
    const u = (i - 0.5) / N;
    acc.push(acc[i - 1] + Math.pow(u, LOBE.A) * Math.pow(1 - u, LOBE.B));
  }
  return acc.map((v) => v / acc[N]);
})();
export const lobe = (f: number) => {
  const u = c01(f / LOBE.T) * (LOBE_TAB.length - 1);
  const i = Math.min(LOBE_TAB.length - 2, Math.floor(u));
  return lerp(LOBE_TAB[i], LOBE_TAB[i + 1], u - i);
};
/** C's own velocity at its last frame (central difference), carried into D's first frames and faded */
const C0 = chansOf(C_END.cam);
const CV = (() => {
  const a = chansOf(cameraC(C_END.f - 1));
  const b = chansOf(cameraC(C_END.f + 1));
  return a.map((v, i) => (b[i] - v) / 2);
})();
/** the creep's displacement (frames f: the integral of a velocity that eases in over CREEP.f0..f1) */
const creepInt = (f: number, v: number) => {
  // integral of v * smoothstep(f0, f1, x) dx from 0 to f
  const { f0, f1 } = CREEP;
  if (f <= f0) return 0;
  const w = f1 - f0;
  if (f >= f1) return v * (w / 2 + (f - f1));
  const t = (f - f0) / w;
  return v * w * (t * t * t - 0.5 * t * t * t * t);
};
/** the keyed track (before the damped follow) */
export const targetD = (f: number) => {
  const T = LOBE.T;
  const h = f < T ? f * Math.pow(1 - f / T, 3) : 0;
  const L = lobe(f);
  const v = C0.map((c0, i) => c0 + CV[i] * h + (END_CH[i] - c0) * L);
  // the lens creep: zoom by z about the row CREEP.y (Euclid's size and F grow by z, every row y -> y* + z (y - y*))
  const lz = creepInt(f, CREEP.z);
  v[0] += lz;
  v[1] += lz;
  v[3] = CREEP.y + (v[3] - CREEP.y) * Math.exp(lz);
  return v;
};
/** the kit's damped follow (CAM_STIFF / CAM_DAMP, LEAD 5), started on C's last state and velocity */
const LEAD = 5;
const D_PATH: number[][] = (() => {
  let s = C0.slice();
  let v = CV.slice();
  const out = [s.slice()];
  for (let f = 1; f <= D_DURATION + 40; f++) {
    const tg = targetD(f - 1 + LEAD);
    v = v.map((vi, i) => vi + (tg[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    out.push(s.slice());
  }
  return out;
})();
/** D's camera at frame f (fractional frames interpolate); f0 is C_END.cam exactly */
export const cameraD = (f: number): StairCam => {
  if (f <= 0) return C_END.cam;
  const i = Math.min(D_PATH.length - 2, Math.floor(f));
  const u = f - i;
  const s = D_PATH[i].map((v, k) => lerp(v, D_PATH[i + 1][k], u));
  return i === 0 && u === 0 ? C_END.cam : camOfChans(s);
};
export const chansD = (f: number) => (f <= 0 ? C0 : chansOf(cameraD(f)));

// =====================================================================================================================
// THE NEVER-BUILT STAIR: greekStairWorld's NEVER_BUILT (6 steps from the landing's back edge) continued in the same
// rhythm and taper to N_NB steps (the tip runs on out of the top of the frame), drawn by tips
// =====================================================================================================================
export const N_NB = 8;
const hwNB = (s: number) => HALF_W(N_STEPS + 2 + s);
/** a side profile (side -1 left, 1 right): up the riser, back along the tread, a step in at the next riser (taper);
 *  the corner index where each nosing starts (the riser's top) */
const profileNB = (side: -1 | 1) => {
  const z0 = NEVER_BUILT.z0;
  const h0 = NEVER_BUILT.h0;
  const pts: V3[] = [[side * hwNB(0), h0, z0]];
  const nosingAt: number[] = [];
  for (let s = 0; s < N_NB; s++) {
    if (s > 0) pts.push([side * hwNB(s), h0 + s * RISE, z0 + s * TREAD]);
    pts.push([side * hwNB(s), h0 + (s + 1) * RISE, z0 + s * TREAD]);
    nosingAt.push(pts.length - 1);
    pts.push([side * hwNB(s), h0 + (s + 1) * RISE, z0 + (s + 1) * TREAD]);
  }
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  return { line: { pts, len } as Line3, nosingAt };
};
export const NB_LEFT = profileNB(-1);
export const NB_RIGHT = profileNB(1);
/** the nosings: from each end in to the middle (two halves), step s at height h0 + (s+1) RISE, depth z0 + s TREAD */
export const NB_NOSINGS = Array.from({ length: N_NB }, (_, s) => {
  const H = NEVER_BUILT.h0 + (s + 1) * RISE;
  const Z = NEVER_BUILT.z0 + s * TREAD;
  return { s, H, Z, hw: hwNB(s), at: NB_LEFT.line.len[NB_LEFT.nosingAt[s]] };
});
/** the treads' back edges (where each tread meets the next riser; the solid steps show them as the tread's far side),
 *  drawn the same way as the tips pass the tread's back corner (the last tread has none: the run goes on off frame) */
export const NB_BACKS = Array.from({ length: N_NB - 1 }, (_, s) => {
  const H = NEVER_BUILT.h0 + (s + 1) * RISE;
  const Z = NEVER_BUILT.z0 + (s + 1) * TREAD;
  return { s, H, Z, hw: hwNB(s), at: NB_LEFT.line.len[NB_LEFT.nosingAt[s] + 1] };
});
// the first six steps are greekStairWorld's NEVER_BUILT exactly (asserted)
{
  const ref = NEVER_BUILT.lines;
  for (const [k, prof] of [[0, NB_LEFT], [1, NB_RIGHT]] as const) {
    ref[k].pts.forEach((p, i) => {
      const q = prof.line.pts[i];
      if (!q || Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) > 1e-9) throw new Error("NoSustainedProgress: the never-built stair no longer continues NEVER_BUILT");
    });
  }
  for (let s = 0; s < NEVER_BUILT.steps; s++) {
    const r = ref[2 + s].pts;
    const n = NB_NOSINGS[s];
    if (Math.abs(r[0][1] - n.H) + Math.abs(r[0][2] - n.Z) + Math.abs(r[1][0] - n.hw) > 1e-9) throw new Error("NoSustainedProgress: the never-built nosings moved");
  }
}

/** the tips' run: they leave the landing's back corners at TIP.f0, ease up to speed over TIP.ramp frames, then climb at
 *  a steady TIP.v (units per frame) along both side profiles together; each nosing is drawn from both ends in to the
 *  middle at TIP.nose x the tip speed as the tips pass its corner. First nosing ~f67 ("sustained"), the run steady
 *  through "continuous", the tips out of the top of the frame ~f146 ("progress and advance") */
export const TIP = { f0: 53, ramp: 8, v: 0.146 * U, nose: 1.6 };
export const tipS = (f: number) => {
  const x = f - TIP.f0;
  if (x <= 0) return 0;
  const R = TIP.ramp;
  // the integral of v * smoothstep(0, R, x)
  if (x >= R) return TIP.v * (x - R / 2);
  const t = x / R;
  return TIP.v * R * (t * t * t - 0.5 * t * t * t * t);
};
/** how far each half of nosing s is drawn (0..1) */
export const nosingProg = (s: number, f: number) => {
  const n = NB_NOSINGS[s];
  return c01(((tipS(f) - n.at) * TIP.nose) / n.hw);
};
export const backProg = (s: number, f: number) => {
  const n = NB_BACKS[s];
  return c01(((tipS(f) - n.at) * TIP.nose) / n.hw);
};
// =====================================================================================================================
// EUCLID TURNS TO LOOK OUT: the head leads, the body follows (one slow turn, no flip)
// =====================================================================================================================
/** from his three-quarter (EUCLID_YAW 0.35, facing the generations and us) round to his right until he faces the
 *  never-built stair (yaw PI = from behind): the head leads (f0-80), the body follows (f4-90), slow (the head's peak
 *  ~0.06 rad per frame, so the far eye, nose and beard crossfade over 3+ frames: the cast's pop audit is clean but
 *  one 0.34 opacity step of the far eye at f42); C's small head turn (-0.16) is carried in and released. Seen from
 *  behind, he looks up the stair that was never built; the Elements in his hands glow round him */
export const TURN = { body: 2.72, head: 2.86, nod: 0, h0: 0, h1: 80, b0: 4, b1: 90 };
export const euclidPoseD = (f: number, turn: { body: number; head: number; nod?: number } = TURN): GF.GPose => {
  const t = C_END.t + f;
  const yb = lerp(EUCLID_YAW, turn.body, smoother(TURN.b0, TURN.b1, f));
  const q = GF.POSES.holdScroll(1, yb);
  // the head yaw relative to the body: C's -0.16, then on round to TURN.head
  const headAbs = lerp(EUCLID_YAW - 0.16, turn.head, smoother(TURN.h0, TURN.h1, f));
  const nod = (turn.nod ?? 0) * smoother(TURN.h0, TURN.h1, f);
  const b = GF.idle({ ...q, pitch: q.pitch - 2 + 1.2 * Math.sin(t / 26) + nod, crouch: q.crouch + 0.8 * Math.sin(t / 26) }, t, 11, 1.2);
  return { ...GF.POSES.turnHead(b, headAbs), dz: q.dz };
};
{
  // f0 is C's pose exactly
  const a = JSON.stringify(euclidPose(C_END.t));
  const b = JSON.stringify(euclidPoseD(0));
  if (a !== b) throw new Error("NoSustainedProgress: Euclid's f0 pose differs from C's f228");
}

// =====================================================================================================================
// EUDOXUS LOWERS HIS TABLET as Euclid turns away (the offer up the stair ends; the director's tweak: the raised
// tablet's corner sat over the E of the carved EUCLID): from the world's raised offer (beside his face, toward the
// landing) down to his hips in front of him, slow and eased (LOWER.f0-f1), face tipped up toward him (tilt), his arms
// blending to hang (standAt) with the hands on its edges, his gaze staying up on the landing. The target ends just
// inside the arms' reach (h 1.01 m: lower and the elbows snap straight at full stretch; the cast's pop audit is clean).
// At rest the tablet and his hands sit below the lower caption band (y >= 1460 from f106), his face stays in the gap
// between the bands and EUCLID reads whole. f0..LOWER.f0 is the world's pose and tablet exactly (asserted; and the
// cut's own drawing of him equals the world's: a still at f61 drawn both ways is byte-identical)
// =====================================================================================================================
const EUDOXUS_I = GENERATIONS.findIndex((g) => g.id === "eudoxus");
export const EUDOXUS = GENERATIONS[EUDOXUS_I];
export const LOWER = { f0: 62, f1: 108, fwd: 0.2 * U, h: 1.01 * U, front: 0.25 * U, tilt: 0.6 };
export const lowerU = (f: number) => smoother(LOWER.f0, LOWER.f1, f);
export const eudoxusD = (f: number) => {
  const g = EUDOXUS;
  const t = C_END.t + f;
  const u = lowerU(f);
  const a = tabletAt(g);
  if (u <= 0) return { u, pose: genPose(g, t, EUDOXUS_I), tab: { ...a, tilt: 0 } };
  // down first (clear of his face), then in toward his front
  const b = { X: g.X + g.dir * LOWER.fwd, H: g.H + LOWER.h, Z: g.Z - LOWER.front, rot: 0 };
  const uIn = smoothstep(0.35, 1, u);
  // held low at his hips (the arms' reach), its face tipped up toward him (greekFolk's tablet tilt)
  const tab = { X: lerp(a.X, b.X, uIn), H: lerp(a.H, b.H, u), Z: lerp(a.Z, b.Z, u), rot: lerp(a.rot, b.rot, u), tilt: LOWER.tilt * uIn };
  const q0 = GF.POSES.offerUp(g.dir, OFFER[g.id].t, t / 95 + EUDOXUS_I * 0.21, OFFER_YAW);
  // the arms come down to hang in front of him (standAt's arms); his gaze stays up on the landing (on Euclid's back)
  const q = GF.lerpFig(q0, GF.POSES.standAt(OFFER_YAW), u);
  const pose = GF.idle({ ...q, pitch: q0.pitch - 6, brow: q0.brow }, t, 3 + EUDOXUS_I * 1.7);
  return { u, pose, tab };
};
{
  // at u = 0 the override is the world's own pose
  if (JSON.stringify(eudoxusD(0).pose) !== JSON.stringify(genPose(EUDOXUS, C_END.t, EUDOXUS_I))) throw new Error("NoSustainedProgress: Eudoxus's pose differs from the world's");
}

// =====================================================================================================================
// THE WORLD OPTIONS: C's end options; the fog sea keeps draining and thins away as the eye rises over it (its billows,
// camera-facing discs, read as blobs from above); Diophantus's column stays down (from here it stands right on
// Apollonius's head) and his aqueduct is hidden
// =====================================================================================================================
export const FOG_OUT = { f0: 0, f1: 46, sink: 1.6 * U };
export const optsD = (f: number, turn?: { body: number; head: number; nod?: number }): WorldOpts => {
  const k = smoothstep(FOG_OUT.f0, FOG_OUT.f1, f);
  return {
    ...C_END.opts,
    cloud: (C_END.opts.cloud ?? 0) * (1 - k),
    cloudSink: (C_END.opts.cloudSink ?? 0) + FOG_OUT.sink * k,
    rise: [1, 1, 1, 0],
    hide: ["aqueduct"],
    poseOf: (id) => (id === "euclid" ? euclidPoseD(f, turn) : undefined),
  };
};
