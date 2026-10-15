import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_STIFF,
  DepthGroup,
  InFog,
  LockBracket,
  MAKO,
  NavalMine,
  OCEAN,
  OceanStage,
  SCENE_A,
  UlyssesVehicle,
  bloomFilter,
  clamp01,
  easeOutCubic,
  hash01,
  lerp,
  makeView,
  mineGeometry,
  project,
  smoothClosed,
  smoothstep,
  unproject,
  useOcean,
  vehicleGeometry,
  type Cam,
  type Fan,
  type MineProps,
} from "./oceanShared";

/**
 * HuntingMinesV2 — Cheeky Pint S4E02 (Will O'Brien, Ulysses), cut A, cold-review round 2.
 * Line: "We were doing mine countermeasures, finding mines and hunting mines before it was cool,"
 *
 * CHECK LINE: the viewer can say "Ulysses' small drone sweeps murky water with sonar, finds a sea mine,
 * then works through a whole minefield, one mine after another."
 *
 * THE MOTION (one continuous move): the Mako cruises in from the left (spinning prop, bubble wake),
 * its wide amber fan raking the seabed and its rocks as it searches. Mine 1 is hidden in the murk until
 * the fan's forward edge reaches it (~f28): it comes up lit near side first, THEN its bracket closes
 * (shut on "mines", f37). A ping (f46) rolls out through the murk; as its edge reaches mines 2 and 3
 * each gets an amber rim and comes out of the dark. The Mako glides on nose-first at its constant
 * cruise; its fan swings onto mine 2 (bracket shut ~f63), then onto mine 3 (~f70); the camera tracks
 * it at a moderate width (1.3x the lock framing). Then it slows to a drift over mine 3, fan sweeping.
 *
 * FRAME TABLE (23.976 fps; the edit cuts back to the speaker at f80; DURATION 96 = 80 + 16 tail)
 *   f0-8    Mako enters (tail just off-frame at f0), ~45% of the frame wide; fan rakes the seabed rocks
 *   f28-34  the fan's forward edge reaches mine 1: near side lit first, the murk lifts
 *   f32-37  mine 1's bracket closes from 1.5x (5 f), shut ON "mines" f37
 *   f40-58  camera eases out to 1.3x wider and starts tracking the Mako
 *   f46     the ping ("hunting" f48): the front reaches mine 2 (~f49) and mine 3 (~f52): amber rim, out of the dark
 *   f52-58  the fan swings to mine 2; its bracket closes f58-63
 *   f63-69  the fan swings to mine 3; its bracket closes f66-71 ("cool" f70)
 *   f72-96  the Mako slows to a drift over mine 3, fan sweeping across it; chains sway; camera drifts
 */
export const FPS = 24000 / 1001;
export const DURATION = 96;
export const schema = z.object({ t0: z.number().int().min(0).default(0) });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// ---- the world -------------------------------------------------------------------------------
const VEH_Z = -240;
const VEH_L = 240;
const S_VEH = (SCENE_A.focusM * SCENE_A.pxPerM) / (SCENE_A.focusM * SCENE_A.pxPerM - VEH_Z);
/** the eye's height over the seabed (world px): the horizon follows from it (the pull-back tilts down) */
const EYE_H = 156;
/** the murk: extra fog on unlit mines (colour) + the veil toward what is really behind (visibility) */
const MURK = 0.72;
const HIDE = 0.4; // an unlit mine is a dark shape in the murk, not gone
const SINKER_OPACITY = 0.26;
/** a found contact stays painted after the light moves on */
const CONTACT = 0.62;

// ---- the vehicle: a constant cruise, pitching a little toward each next mine; then a drift ---------
const V_SPEED = 5.6; // world px / frame (its depth plane)
const F_SLOW0 = 70;
const F_SLOW1 = 88;
const DRIFT = 0.3;
const Y0_V = -640; // 5.3 m over the seabed
/** nose-down pitch toward the next contact (rad) */
const PITCH_KEYS: [number, number][] = [
  [-40, 0], [14, 0], [27, 0.075], [40, 0.02], [49, 0.07], [57, 0.02], [59, 0.06], [67, 0.015], [84, 0], [140, 0],
];
const pitchAt = (f: number) => {
  for (let i = 1; i < PITCH_KEYS.length; i++) {
    const [f1, v1] = PITCH_KEYS[i];
    const [f0, v0] = PITCH_KEYS[i - 1];
    if (f <= f1) return lerp(v0, v1, smoothstep((f - f0) / (f1 - f0)));
  }
  return 0;
};
const speedAt = (f: number) => (f <= F_SLOW0 ? V_SPEED : lerp(V_SPEED, V_SPEED * DRIFT, clamp01((f - F_SLOW0) / (F_SLOW1 - F_SLOW0))));
/** integrated path (it travels the way it points), sub-stepped, from f -40 */
const PATH: { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = [];
  let x = 0;
  let y = Y0_V;
  const SUB = 4;
  for (let f = -40; f <= DURATION + 8; f++) {
    out.push({ x, y });
    for (let k = 0; k < SUB; k++) {
      const t = f + k / SUB;
      const v = speedAt(t) / SUB;
      x += v * Math.cos(pitchAt(t));
      y += v * Math.sin(pitchAt(t));
    }
  }
  const o = out[40];
  return out.map((p) => ({ x: p.x - o.x, y: p.y - o.y + Y0_V }));
})();
const pathAt = (f: number) => {
  const s = f + 40;
  const a = Math.max(0, Math.min(PATH.length - 2, Math.floor(s)));
  const t = clamp01(s - a);
  return { x: lerp(PATH[a].x, PATH[a + 1].x, t), y: lerp(PATH[a].y, PATH[a + 1].y, t) };
};
const vehicleAt = (f: number) => {
  const p = pathAt(f);
  return {
    x: p.x,
    y: p.y + 1.4 * Math.sin(f / 13) + 0.5 * Math.sin(f / 6.7),
    L: VEH_L,
    facing: 1 as const,
    tilt: pitchAt(f) + 0.008 * Math.sin(f / 15),
    frame: f,
  };
};
const vLocal = (vp: ReturnType<typeof vehicleAt>, lx: number, ly: number) => {
  const c = Math.cos(vp.tilt);
  const s = Math.sin(vp.tilt);
  return { x: vp.x + lx * c - ly * s, y: vp.y + lx * s + ly * c };
};
const emitterAt = (f: number) => vehicleGeometry(vehicleAt(f)).emitter;

// ---- the camera: follows the Mako SLOWER than it swims (it crosses the frame), damped -------------
const K_OPEN = 2.55;
const K_LOCK = 2.62;
const K_FIELD = 2.02;
const K_WIDE = 1.74;
const kAt = (f: number) => {
  let k = lerp(K_OPEN, K_LOCK, smoothstep((f - 10) / 28));
  k = Math.exp(lerp(Math.log(k), Math.log(K_FIELD), smoothstep((f - 40) / 16)));
  k = Math.exp(lerp(Math.log(k), Math.log(K_WIDE), smoothstep((f - 62) / 18)));
  return k * (1 - 0.025 * smoothstep((f - 80) / 40));
};
/** the emitter's screen column: it drifts right across the frame (the Mako outruns the camera) */
const EMIT_SX = (f: number) => lerp(lerp(520, 600, smoothstep((f - 14) / 30)), 640, smoothstep((f - 44) / 52));
const HULL_SY = (f: number) => lerp(lerp(545, 560, smoothstep((f - 44) / 14)), 650, smoothstep((f - 62) / 18));
/** the camera (and the horizon) that put a vehicle-plane point at (sx, sy) with zoom k */
const camForVeh = (x: number, y: number, sx: number, sy: number, k: number): Cam => {
  const c = sy - S_VEH * k * y + k * EYE_H * (1 - S_VEH);
  return { x: x - (sx - 540) / (S_VEH * k), y: (960 - c) / k, k };
};
const horFor = (cam: Cam) => 960 - cam.y * cam.k - cam.k * EYE_H;
const camTarget = (f: number): Cam => {
  const k = kAt(f);
  const vp = vehicleAt(Math.max(0, f));
  const track = camForVeh(emitterAt(Math.max(0, f)).x, vp.y, EMIT_SX(f), HULL_SY(f), k);
  // the opening: the camera all but still while the Mako swims in (hull at x 200 at f0)
  const v0 = vehicleAt(0);
  const still = camForVeh(v0.x + 1.2 * Math.max(0, f), v0.y, 200, HULL_SY(f), k);
  const w = smoothstep((f - 10) / 22);
  return { x: lerp(still.x, track.x, w), y: track.y, k };
};
const CAM_PRE = 40;
const CAM_TRACK: Cam[] = (() => {
  const out: Cam[] = [];
  let c = camTarget(-CAM_PRE);
  let v = { x: 0, y: 0, k: 0 };
  for (let f = -CAM_PRE; f <= DURATION + 4; f++) {
    const t = camTarget(f);
    v = { x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP, y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP, k: v.k + (t.k - c.k) * CAM_STIFF - v.k * CAM_DAMP };
    c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    out.push({ ...c });
  }
  return out;
})();
const camAt = (f: number): Cam => {
  const s = f + CAM_PRE;
  const a = Math.max(0, Math.min(CAM_TRACK.length - 2, Math.floor(s)));
  const t = clamp01(s - a);
  const A = CAM_TRACK[a];
  const B = CAM_TRACK[a + 1];
  return { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), k: lerp(A.k, B.k, t) };
};
const horAt = (f: number) => horFor(camAt(f));
const CAM_REST = camAt(0);
const viewAt = (f: number) => makeView({ frame: f, cam: camAt(f), scene: SCENE_A, horizon: horAt(f) });

// ---- the minefield: each mine placed by where it should sit on screen at a frame ------------------
type MineSpec = { x: number; z: number; tether: number; spin: number; ph: number; amp: number; per: number };
const placeMine = (f: number, sx: number, sy: number, z: number, rest: Omit<MineSpec, "x" | "z" | "tether">): MineSpec => {
  const c = unproject(viewAt(f), sx, sy, z);
  return { ...rest, x: c.x, z, tether: Math.max(60, -c.y - 0.55 * 60 - 60) };
};
const F_FIND = 29;
const EF = project(viewAt(F_FIND), emitterAt(F_FIND).x, emitterAt(F_FIND).y, VEH_Z);
const MINE1_ANG = 1.0; // below the horizontal from the emitter, at "finding"
const MINE1_DIST = 330; // screen px
const MINES: MineSpec[] = [
  placeMine(F_FIND, EF.x + MINE1_DIST * Math.cos(MINE1_ANG), Math.min(872, EF.y + MINE1_DIST * Math.sin(MINE1_ANG)), 0, { spin: 0.94, ph: 0.7, amp: 0.022, per: 23 }),
  placeMine(58, EMIT_SX(58) + 120, 945, -330, { spin: 1.3, ph: 4.2, amp: 0.03, per: 27 }),
  placeMine(66, EMIT_SX(66) + 330, 815, -620, { spin: 0.4, ph: 1.9, amp: 0.026, per: 25 }),
];
/** the rest of the field: never reached by the light, dark shapes in the dim sea (placed in the wide frame) */
const DARK: MineSpec[] = [
  placeMine(86, 985, 990, -760, { spin: 0.2, ph: 2.5, amp: 0.02, per: 29 }),
  placeMine(86, 105, 700, -1150, { spin: 1.1, ph: 0.3, amp: 0.024, per: 31 }),
  placeMine(86, 960, 735, -1600, { spin: 0.7, ph: 5.1, amp: 0.02, per: 26 }),
];
const mineProps = (i: number, f: number, set: MineSpec[] = MINES): MineProps => {
  const m = set[i];
  return { x: m.x, y: 0, d: 120, tether: m.tether, spin: m.spin, sway: m.amp * Math.sin(f / m.per + m.ph) + 0.006 * Math.sin(f / 9.5 + i) };
};
const mineGeo = (i: number, f: number) => mineGeometry(mineProps(i, f));

// ---- projections into the vehicle's plane ------------------------------------------------------
const toVehPlane = (f: number, x: number, y: number, z = 0) => {
  const v = viewAt(f);
  const s = project(v, x, y, z);
  return unproject(v, s.x, s.y, VEH_Z);
};
const mineInVeh = (i: number, f: number) => {
  const g = mineGeo(i, f);
  return toVehPlane(f, g.centre.x, g.centre.y, MINES[i].z);
};

// ---- the fan: a short search raking the bed, a forward sweep that finds mine 1, then 2, then 3 -----
const SPREAD_TRACK = 1.2;
const SPREAD_SEARCH = 0.85;
const BRACKET_F = 5;
const F_LOCK = [37, 58, 66]; // bracket shut
const SWING = [
  { f0: 21, d: 14 }, // the forward sweep onto mine 1 (its edge crosses the mine on "finding")
  { f0: 50, d: 6 }, // onto mine 2
  { f0: 58, d: 6 }, // onto mine 3
];
const swingAt = (k: number, f: number) => smoothstep((f - SWING[k].f0) / SWING[k].d);
/** the search: the fan rakes the seabed below, swinging fore and aft */
const SEARCH_DOWN = (f: number) => 1.7 - 0.22 * smoothstep((f - 9) / 14) + 0.2 * Math.sin(f / 3.6 + 0.3);
const RANGE_SEARCH = (() => -emitterAt(0).y * 1.04)();
const SCAN_PERIOD = 30;
const HOLD_PERIOD = 36;
const fanAt = (f: number): Fan & { sweep: number } => {
  const vg = vehicleGeometry(vehicleAt(f));
  let angle = vg.heading + SEARCH_DOWN(f);
  let spread = SPREAD_SEARCH;
  let range = RANGE_SEARCH;
  let tracked = 0;
  for (let k = 0; k < 3; k++) {
    const w = swingAt(k, f);
    if (w <= 0) continue;
    const m = mineInVeh(k, f);
    const to = Math.atan2(m.y - vg.emitter.y, m.x - vg.emitter.x);
    let d = to - angle;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    angle = angle + d * w;
    spread = lerp(spread, SPREAD_TRACK, w);
    range = lerp(range, Math.hypot(m.x - vg.emitter.x, m.y - vg.emitter.y) * 1.6, smoothstep(w * 2.2));
    tracked = Math.max(tracked, w);
  }
  const scan = 0.5 + 0.12 * Math.sin((2 * Math.PI * f) / SCAN_PERIOD + 0.6);
  const across = 0.5 + 0.26 * Math.sin((2 * Math.PI * f) / HOLD_PERIOD);
  return { x: vg.emitter.x, y: vg.emitter.y, angle, spread, range, sweep: lerp(scan, across, tracked) };
};
/** how much of the fan's VISIBLE volume covers a point (vehicle-plane coords): matches the drawn fan */
const fanCover = (fan: Fan, x: number, y: number) => {
  const dx = x - fan.x;
  const dy = y - fan.y;
  const r = Math.hypot(dx, dy);
  let da = Math.atan2(dy, dx) - fan.angle;
  da = Math.atan2(Math.sin(da), Math.cos(da));
  const ang = 1 - smoothstep((Math.abs(da) - fan.spread * 0.36) / (fan.spread * 0.2));
  const rng = 1 - smoothstep((r - fan.range * 0.6) / (fan.range * 0.35));
  return clamp01(ang * rng);
};

// ---- the ping ------------------------------------------------------------------------------------
const PINGS = [{ f0: 46, strength: 1 }];
/** the front's speed: it reaches mine 3 at ~f51 */
const WAVE_V = (() => {
  const e = emitterAt(51);
  const m = mineInVeh(2, 51);
  return Math.hypot(m.x - e.x, m.y - e.y) / (51 - PINGS[0].f0);
})();
const waveR = (p: (typeof PINGS)[number], f: number) => WAVE_V * (f - p.f0);
const WAVE_MAX = (() => {
  const e = emitterAt(51);
  return Math.max(...MINES.map((_, i) => {
    const m = mineInVeh(i, 51);
    return Math.hypot(m.x - e.x, m.y - e.y);
  })) * 1.3;
})();
const ONSET: number[][] = PINGS.map((p) =>
  MINES.map((_, i) => {
    for (let f = p.f0; f <= DURATION + 40; f += 0.25) {
      const ff = Math.min(f, DURATION);
      const e = emitterAt(ff);
      const m = mineInVeh(i, ff);
      if (waveR(p, f) >= Math.hypot(m.x - e.x, m.y - e.y)) return f;
    }
    return 1e9;
  }),
);
/** the ping's light on a mine: an amber rim as the front reaches it, settling to a held glow */
const pingLit = (i: number, f: number) => {
  let v = 0;
  PINGS.forEach((p, k) => {
    const o = ONSET[k][i];
    if (f < o - 1) return;
    const up = smoothstep((f - o + 1) / 3);
    v = Math.max(v, up * p.strength * (0.4 + 0.6 * Math.exp(-Math.max(0, f - o - 2) / 10)));
  });
  return v;
};

// ---- the light on each mine: per height band (softened across bands: no hard edge) --------------
const BANDS = [-1.3, -1.0, -0.7, -0.4, -0.1, 0.2, 0.5, 0.8, 1.0];
const BAND_COVER: number[][][] = MINES.map((_, i) => {
  const out: number[][] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const fan = fanAt(f);
    const g = mineGeo(i, f);
    const raw = BANDS.map((u) => {
      const hw = Math.sqrt(Math.max(0, 1 - Math.min(1, u * u))) * g.R;
      // the band's light: its fan-facing limb, its middle and its far limb
      const pts = [-0.6, 0, 0.6].map((t) => toVehPlane(f, g.centre.x + t * hw, g.centre.y + u * g.R, MINES[i].z));
      const c = pts.map((p) => fanCover(fan, p.x, p.y));
      return 0.45 * c[0] + 0.35 * c[1] + 0.2 * c[2];
    });
    // soften across neighbouring bands (light has no hard edge on a sphere)
    out.push(raw.map((v, j) => 0.25 * raw[Math.max(0, j - 1)] + 0.5 * v + 0.25 * raw[Math.min(raw.length - 1, j + 1)]));
  }
  return out;
});
const FOUND: number[] = MINES.map((_, i) => {
  for (let f = 0; f <= DURATION; f++) {
    const c = BAND_COVER[i][f];
    if (Math.max(...c) > 0.25 || pingLit(i, f) > 0.25) return f;
  }
  return 1e9;
});
const bandsAt = (i: number, f: number) => {
  const c = BAND_COVER[i][Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
  const ping = pingLit(i, f);
  const hold = CONTACT * smoothstep((f - FOUND[i] - 4) / 10);
  return c.map((v) => Math.max(v, ping, hold));
};
const fanLitAt = (i: number, f: number) => {
  const c = BAND_COVER[i][Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
  return c.reduce((s, v) => s + v, 0) / c.length;
};
const bracketT = (i: number, f: number) => clamp01((f - (F_LOCK[i] - BRACKET_F)) / BRACKET_F);
/** the sea dims behind the lit things as the camera pulls back */
const dimAt = (f: number) => 0.34 * smoothstep((f - 60) / 22);

/** numbers for the build log (bun scripts) */
export const DEBUG = { RANGE_SEARCH, WAVE_V, ONSET, FOUND, camAt, horAt, vehicleAt, fanAt, viewAt, mineGeo, bandsAt, fanLitAt, VEH_Z, MINES, DARK, BRACKET_F };

// ---- seabed rocks: the relief the fan rakes as it searches ---------------------------------------
type Rock = { x: number; z: number; w: number; h: number; seed: number };
/** placed by screen x at f14 (where the search fan rakes) and depth z; they sit on the seabed */
const ROCK_SPEC: { sx: number; z: number; w: number; h: number }[] = [
  { sx: 110, z: -180, w: 96, h: 40 },
  { sx: 260, z: -900, w: 150, h: 46 },
  { sx: 380, z: -330, w: 40, h: 18 },
  { sx: 470, z: -120, w: 130, h: 52 },
  { sx: 640, z: -520, w: 70, h: 30 },
  { sx: 780, z: -230, w: 54, h: 26 },
  { sx: 900, z: -760, w: 110, h: 40 },
  { sx: 1050, z: -150, w: 86, h: 36 },
  { sx: 1240, z: -480, w: 64, h: 28 },
  { sx: 1400, z: -1100, w: 160, h: 50 },
  { sx: 1600, z: -300, w: 90, h: 36 },
];
const ROCKS: Rock[] = ROCK_SPEC.map((r, i) => ({ x: unproject(viewAt(14), r.sx, 1800, r.z).x, z: r.z, w: r.w, h: r.h, seed: i + 1 }));
const rockPath = (r: Rock) => {
  const pts = Array.from({ length: 11 }, (_, i) => {
    const t = (i / 11) * Math.PI; // the top half of a lumpy, leaning boulder, flat on the bed
    const j = 0.6 + 0.55 * hash01(r.seed * 13 + i) + 0.25 * Math.sin(t * 2 + r.seed);
    return { x: r.x - Math.cos(t) * r.w * 0.5 * (0.9 + 0.2 * hash01(r.seed + i * 3)), y: -Math.sin(t) * r.h * j };
  });
  return smoothClosed([...pts, { x: r.x + r.w * 0.5, y: 2 }, { x: r.x - r.w * 0.5, y: 2 }], 0.8);
};
const RockAt: React.FC<{ r: Rock; f: number; fan: Fan }> = ({ r, f, fan }) => {
  const uid = `hmR${r.seed}`;
  const p = toVehPlane(f, r.x, -r.h * 0.6, r.z);
  const lit = fanCover(fan, p.x, p.y);
  const d = rockPath(r);
  return (
    <DepthGroup z={r.z}>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#6E665A" />
          <stop offset="0.45" stopColor="#4A4339" />
          <stop offset="1" stopColor="#2F2924" />
        </linearGradient>
        <radialGradient id={`${uid}a`} cx="0.35" cy="0.1" r="0.8">
          <stop offset="0" stopColor={OCEAN.amberTop} stopOpacity="0.85" />
          <stop offset="0.5" stopColor={OCEAN.amberFoot} stopOpacity="0.3" />
          <stop offset="1" stopColor={OCEAN.amberFoot} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={r.x} cy={1} rx={r.w * 0.62} ry={r.h * 0.18} fill={OCEAN.shadow} opacity={0.45} style={{ filter: `blur(${r.h * 0.12}px)` }} />
      <InFog>
        <path d={d} fill={`url(#${uid}g)`} />
      </InFog>
      {lit > 0.01 ? <path d={d} fill={`url(#${uid}a)`} opacity={0.6 * lit} style={{ mixBlendMode: "screen" }} /> : null}
    </DepthGroup>
  );
};
/** the fan's footprint on the seabed: where its axis and its beam meet the bed (an amber pool) */
const Footprint: React.FC<{ fan: Fan & { sweep: number } }> = ({ fan }) => {
  const pools: React.ReactNode[] = [];
  const hit = (a: number) => {
    const s = Math.sin(a);
    if (s < 0.15) return null;
    const t = -fan.y / s;
    if (t > fan.range * 0.98) return null;
    return { x: fan.x + t * Math.cos(a), t };
  };
  const axis = hit(fan.angle);
  const beam = hit(fan.angle + (fan.sweep - 0.5) * fan.spread * 0.8);
  if (axis) {
    const rx = axis.t * Math.tan(fan.spread * 0.38);
    pools.push(<ellipse key="a" cx={axis.x} cy={0} rx={rx} ry={rx * 0.12} fill={OCEAN.amberFoot} opacity={0.28 * (1 - axis.t / fan.range)} style={{ filter: `blur(${rx * 0.25}px)` }} />);
  }
  if (beam) {
    const rx = beam.t * 0.1;
    pools.push(<ellipse key="b" cx={beam.x} cy={0} rx={rx} ry={rx * 0.16} fill={OCEAN.amberTop} opacity={0.55 * (1 - beam.t / fan.range)} style={{ filter: `blur(${rx * 0.3}px)` }} />);
  }
  return <g style={{ mixBlendMode: "screen" }}>{pools}</g>;
};

// ---- the Mako's propeller (inside the shroud) and its bubble wake --------------------------------
const PROP_RATE = 0.95;
const Propeller: React.FC<{ f: number }> = ({ f }) => {
  const vp = vehicleAt(f);
  const L = vp.L;
  const r = (L * MAKO.D) / 2;
  const R = r * 1.18 * 0.9;
  const cx = -L / 2 + L * 0.004;
  const rx = R * 0.58;
  const tf = `translate(${vp.x} ${vp.y}) rotate(${(vp.tilt * 180) / Math.PI})`;
  const blades: React.ReactNode[] = [];
  const SUB = 6;
  for (let b = 0; b < 3; b++) {
    for (let s = 0; s < SUB; s++) {
      const th = PROP_RATE * f + (b * 2 * Math.PI) / 3 - (s / SUB) * PROP_RATE * 0.9;
      const tip = { x: cx - rx * Math.cos(th), y: R * Math.sin(th) };
      const w = 0.22 * R;
      const nx = -Math.sin(th);
      const ny = Math.cos(th) * 0.35;
      const nl = Math.hypot(nx, ny) || 1;
      const px = (nx / nl) * w * 0.5;
      const py = (ny / nl) * w * 0.5 + w * 0.15;
      blades.push(
        <path
          key={`${b}-${s}`}
          d={`M${cx} ${-w * 0.3}L${tip.x + px} ${tip.y + py}L${tip.x - px} ${tip.y - py}L${cx} ${w * 0.3}Z`}
          fill={Math.cos(th) > 0 ? "#B5AC9C" : OCEAN.hullHi}
          opacity={s === 0 ? 0.95 : 0.45 * (1 - s / SUB)}
        />,
      );
    }
  }
  return (
    <g transform={tf}>
      <ellipse cx={cx} cy={0} rx={rx} ry={R} fill={OCEAN.hullDeep} />
      <ellipse cx={cx} cy={0} rx={rx * 0.92} ry={R * 0.92} fill={OCEAN.hullHi} opacity={0.3} />
      {blades}
      <ellipse cx={cx - rx * 0.15} cy={0} rx={rx * 0.38} ry={R * 0.24} fill={OCEAN.hullMid} />
      <ellipse cx={cx - rx * 0.25} cy={-R * 0.06} rx={rx * 0.16} ry={R * 0.1} fill={OCEAN.hullHi} opacity={0.7} />
      <ellipse cx={cx} cy={0} rx={rx} ry={R} fill="none" stroke={OCEAN.cream} strokeOpacity={0.5} strokeWidth={R * 0.07} />
    </g>
  );
};
/** the amber Ulysses shield, drawn larger over the hull's own so "ours" reads at phone size */
const Shield: React.FC<{ f: number }> = ({ f }) => {
  const o = useOcean();
  const vp = vehicleAt(f);
  const L = vp.L;
  const D = L * MAKO.D;
  const lx = L * MAKO.logo;
  const lh = D * 0.84;
  const lw = lh * 0.82;
  const shield = `M${lx - lw / 2} ${-lh / 2}H${lx + lw / 2}V${lh * 0.02}Q${lx + lw / 2} ${lh * 0.36} ${lx} ${lh / 2}Q${lx - lw / 2} ${lh * 0.36} ${lx - lw / 2} ${lh * 0.02}Z`;
  const fin = `M${lx - lw * 0.05} ${lh * 0.22}L${lx + lw * 0.04} ${-lh * 0.28}L${lx + lw * 0.2} ${lh * 0.22}Z`;
  return (
    <g transform={`translate(${vp.x} ${vp.y}) rotate(${(vp.tilt * 180) / Math.PI})`}>
      <g style={{ filter: bloomFilter(o.a * 2) }}>
        <path d={shield} fill={OCEAN.amberTop} />
      </g>
      <path d={fin} fill={OCEAN.hullDeep} opacity={0.8} />
    </g>
  );
};
const WAKE_LIFE = 34;
const Wake: React.FC<{ f: number }> = ({ f }) => {
  const o = useOcean();
  const px = 1 / o.a;
  const dots: React.ReactNode[] = [];
  for (let e = Math.floor(f) - WAKE_LIFE; e <= f; e++) {
    for (let j = 0; j < 3; j++) {
      const age = f - e;
      if (age < 0) continue;
      const h = e * 3.17 + j * 11.3 + 500;
      const vp = vehicleAt(e);
      const r = (vp.L * MAKO.D) / 2;
      const src = vLocal(vp, -vp.L / 2 - vp.L * 0.01, (hash01(h) - 0.5) * r * 1.4);
      const jet = 70 + 60 * hash01(h + 1.1);
      const push = jet * (1 - Math.exp(-age / 9));
      const spreadY = (hash01(h + 4.9) - 0.5) * 0.9 * age;
      const back = vLocal({ ...vp, x: 0, y: 0 }, -push, 0);
      const x = src.x + back.x + 0.35 * age + 3 * Math.sin(age / 5 + h);
      const y = src.y + back.y + spreadY - (0.3 + 0.35 * hash01(h + 2.3)) * age;
      const life = 1 - age / WAKE_LIFE;
      const rad = (0.9 + 1.8 * hash01(h + 3.7)) * px * (0.6 + 0.6 * life) * Math.min(1, 0.4 + age / 4);
      dots.push(<circle key={`${e}-${j}`} cx={x} cy={y} r={rad} fill={OCEAN.cream} opacity={0.5 * life} />);
    }
  }
  return <g>{dots}</g>;
};

// ---- a soft sonar fan (no range arcs): volume + sweeping beam + soft wavefronts + emitter core ----
const WAVE_PERIOD = 22;
const WAVE_TRAVEL = 30;
const SoftSonarFan: React.FC<Fan & { sweep: number; frame: number }> = ({ x, y, angle, spread, range, sweep, frame }) => {
  const o = useOcean();
  const uid = `hm${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const R = range;
  const px = 1 / o.a;
  const wedge = (a0: number, a1: number, r: number) =>
    `M${x} ${y}L${x + r * Math.cos(a0)} ${y + r * Math.sin(a0)}A${r} ${r} 0 0 1 ${x + r * Math.cos(a1)} ${y + r * Math.sin(a1)}Z`;
  const beamA = angle + (sweep - 0.5) * spread * 0.8;
  const waves: React.ReactNode[] = [];
  for (let k = -2; k <= 2; k++) {
    const t0 = Math.floor(frame / WAVE_PERIOD) * WAVE_PERIOD + k * WAVE_PERIOD;
    const u = (frame - t0) / WAVE_TRAVEL;
    if (u <= 0 || u >= 1) continue;
    const r = R * u;
    const a = 0.085 * smoothstep(u / 0.2) * (1 - smoothstep((u - 0.55) / 0.45));
    const span = spread * 0.44;
    waves.push(
      <path
        key={k}
        d={`M${x + r * Math.cos(angle - span)} ${y + r * Math.sin(angle - span)}A${r} ${r} 0 0 1 ${x + r * Math.cos(angle + span)} ${y + r * Math.sin(angle + span)}`}
        fill="none"
        stroke={OCEAN.amberTop}
        strokeOpacity={a}
        strokeWidth={R * 0.09}
        strokeLinecap="round"
      />,
    );
  }
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={R}>
          <stop offset="0" stopColor={OCEAN.amberTop} stopOpacity="0.6" />
          <stop offset="0.25" stopColor={OCEAN.amberTop} stopOpacity="0.34" />
          <stop offset="0.7" stopColor={OCEAN.amberFoot} stopOpacity="0.17" />
          <stop offset="1" stopColor={OCEAN.amberFoot} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}h`} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={R}>
          <stop offset="0" stopColor={OCEAN.amberHot} stopOpacity="0.85" />
          <stop offset="0.4" stopColor={OCEAN.amberTop} stopOpacity="0.4" />
          <stop offset="1" stopColor={OCEAN.amberTop} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}c`}>
          <path d={wedge(angle - spread * 0.5, angle + spread * 0.5, R)} />
        </clipPath>
      </defs>
      <g style={{ filter: `blur(${14 * px}px)` }}>
        {[1, 0.78, 0.55].map((m, i) => (
          <path key={i} d={wedge(angle - (spread * m) / 2, angle + (spread * m) / 2, R)} fill={`url(#${uid}g)`} opacity={0.55} />
        ))}
      </g>
      <g clipPath={`url(#${uid}c)`}>
        <g style={{ filter: `blur(${16 * px}px)` }}>{waves}</g>
      </g>
      <g style={{ filter: `blur(${6 * px}px) ${bloomFilter(o.a)}` }}>
        <path d={wedge(beamA - spread * 0.05, beamA + spread * 0.05, R * 0.96)} fill={`url(#${uid}h)`} opacity={0.75} />
      </g>
      <circle cx={x} cy={y} r={7 * px} fill={OCEAN.amberHot} style={{ filter: bloomFilter(o.a) }} />
    </g>
  );
};

/** the ping's wavefront: a soft amber shell expanding from the emitter, fading as it spreads */
const PingFront: React.FC<{ f: number }> = ({ f }) => {
  const o = useOcean();
  const px = 1 / o.a;
  const e = emitterAt(f);
  return (
    <g style={{ mixBlendMode: "screen" }}>
      {PINGS.map((p, k) => {
        const r = waveR(p, f);
        if (r <= 0 || r >= WAVE_MAX) return null;
        const u = r / WAVE_MAX;
        // it leaves the emitter (grows out of it), then thins out to nothing just past the farthest mine
        const a = p.strength * smoothstep(r / (WAVE_V * 1.2)) * (1 - smoothstep((u - 0.45) / 0.55));
        const w = 5 * px;
        return (
          <g key={k} style={{ filter: `blur(${1.6 * px}px) ${bloomFilter(o.a)}` }}>
            <circle cx={e.x} cy={e.y} r={r} fill="none" stroke={OCEAN.amberTop} strokeOpacity={0.8 * a} strokeWidth={w} />
            <circle cx={e.x} cy={e.y} r={Math.max(1, r - 16 * px)} fill="none" stroke={OCEAN.amberTop} strokeOpacity={0.38 * a} strokeWidth={w * 0.6} />
          </g>
        );
      })}
    </g>
  );
};

/** VisMask — the murk's veil toward what is really behind: visibility per local y, as a mask */
const VisMask: React.FC<{ id: string; y0: number; y1: number; vis: (y: number) => number; children?: React.ReactNode }> = ({ id, y0, y1, vis, children }) => {
  const N = 14;
  const BIG = 6000;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1="0" y1={y0} x2="0" y2={y1}>
          {Array.from({ length: N + 1 }, (_, i) => (
            <stop key={i} offset={i / N} stopColor="#fff" stopOpacity={clamp01(vis(lerp(y0, y1, i / N)))} />
          ))}
        </linearGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x={-BIG} y={-BIG} width={2 * BIG} height={2 * BIG}>
          <rect x={-BIG} y={-BIG} width={2 * BIG} height={2 * BIG} fill={`url(#${id}g)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}m)`}>{children}</g>
    </g>
  );
};

// ---- the scene -------------------------------------------------------------------------------
/** a moored mine in the murk: hidden until light reaches it (fan per band, or the ping's rim) */
const MineAt: React.FC<{ i: number; f: number }> = ({ i, f }) => {
  const o = useOcean();
  const mp = mineProps(i, f);
  const g = mineGeometry(mp);
  const R = g.R;
  const bands = bandsAt(i, f);
  const amber = Math.max(easeOutCubic(fanLitAt(i, f)), pingLit(i, f) * 0.9);
  const e = emitterAt(f);
  const eS = project(o, e.x, e.y, VEH_Z);
  const litFrom = unproject(o, eS.x, eS.y, MINES[i].z);
  const ySplit = g.top.y - 0.3 * R;
  const ySph = g.centre.y + R;
  const bandAt = (y: number) => {
    const u = (y - g.centre.y) / R;
    if (u <= BANDS[0]) return bands[0];
    if (u >= BANDS[BANDS.length - 1]) return bands[BANDS.length - 1];
    const k = BANDS.findIndex((b, j) => j > 0 && u <= b);
    return lerp(bands[k - 1], bands[k], (u - BANDS[k - 1]) / (BANDS[k] - BANDS[k - 1]));
  };
  const chainT = (y: number) => smoothstep((y - ySph) / (ySplit - ySph));
  const murk = (y: number) => (y <= ySph ? MURK * (1 - bandAt(y)) : lerp(MURK * (1 - bandAt(ySph)), 0.5, chainT(y)));
  // farther mines sink deeper into the murk until light reaches them
  const base = (1 - HIDE) * Math.exp(MINES[i].z / 380);
  const visB = (c: number) => base + (1 - base) * c;
  const vis = (y: number) => (y <= ySph ? visB(bandAt(y)) : lerp(visB(bandAt(ySph)), SINKER_OPACITY, chainT(y)));
  const BIG = 6000;
  const id = `hmM${i}`;
  return (
    <DepthGroup z={MINES[i].z}>
      <defs>
        <clipPath id={`${id}u`}>
          <rect x={-BIG} y={-BIG} width={2 * BIG} height={ySplit + BIG} />
        </clipPath>
        <clipPath id={`${id}l`}>
          <rect x={-BIG} y={ySplit} width={2 * BIG} height={BIG} />
        </clipPath>
      </defs>
      {/* the sinker: seen faintly through the murk against the sand; never lit, never changes */}
      <g clipPath={`url(#${id}l)`} opacity={SINKER_OPACITY}>
        <InFog amount={0.3}>
          <NavalMine {...mp} lit={0} />
        </InFog>
      </g>
      <g clipPath={`url(#${id}u)`}>
        <VisMask id={`${id}v`} y0={g.centre.y - 1.4 * R} y1={ySplit} vis={vis}>
          <InFog amount={murk}>
            <NavalMine {...mp} lit={amber} litFrom={litFrom} />
          </InFog>
        </VisMask>
      </g>
      <LockBracket x={g.centre.x} y={g.centre.y - 0.15 * R} w={2.6 * R} h={2.6 * R} t={bracketT(i, f)} from={1.5} />
    </DepthGroup>
  );
};

/** a mine of the rest of the field: never reached by the light, a dark shape in the dim sea */
const DarkMineAt: React.FC<{ i: number; f: number }> = ({ i, f }) => {
  const mp = mineProps(i, f, DARK);
  const g = mineGeometry(mp);
  const ySplit = g.top.y - 0.3 * g.R;
  const BIG = 6000;
  const id = `hmD${i}`;
  return (
    <DepthGroup z={DARK[i].z}>
      <defs>
        <clipPath id={`${id}u`}>
          <rect x={-BIG} y={-BIG} width={2 * BIG} height={ySplit + BIG} />
        </clipPath>
        <clipPath id={`${id}l`}>
          <rect x={-BIG} y={ySplit} width={2 * BIG} height={BIG} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}l)`} opacity={SINKER_OPACITY}>
        <InFog amount={0.3}>
          <NavalMine {...mp} lit={0} />
        </InFog>
      </g>
      <g clipPath={`url(#${id}u)`} opacity={1 - HIDE}>
        <InFog amount={MURK}>
          <NavalMine {...mp} lit={0} />
        </InFog>
      </g>
    </DepthGroup>
  );
};

const World: React.FC<{ f: number }> = ({ f }) => {
  const vp = vehicleAt(f);
  const fan = fanAt(f);
  const rocks = [...ROCKS].sort((a, b) => a.z - b.z);
  const dark = DARK.map((m, i) => ({ i, z: m.z })).sort((a, b) => a.z - b.z);
  const BIG = 20000;
  return (
    <>
      {rocks.map((r) => (
        <RockAt key={r.seed} r={r} f={f} fan={fan} />
      ))}
      {dark.map((d) => (
        <DarkMineAt key={d.i} i={d.i} f={f} />
      ))}
      {/* the sea dims behind the hunter and its contacts as the camera pulls back */}
      <rect x={-BIG} y={-BIG} width={2 * BIG} height={2 * BIG} fill={OCEAN.shadow} opacity={dimAt(f)} />
      <MineAt i={2} f={f} />
      <MineAt i={1} f={f} />
      <DepthGroup z={VEH_Z}>
        <Footprint fan={fan} />
        <PingFront f={f} />
        <Wake f={f} />
        <SoftSonarFan {...fan} frame={f} />
        <g style={{ filter: "brightness(1.45) sepia(0.18) saturate(1.1)" }}>
          <UlyssesVehicle {...vp} light={1} />
        </g>
        <Shield f={f} />
        <Propeller f={f} />
      </DepthGroup>
      <MineAt i={0} f={f} />
    </>
  );
};

const HuntingMinesV2: React.FC<Props> = ({ t0 }) => {
  const f = useCurrentFrame() + t0;
  const cam = camAt(f);
  return (
    <AbsoluteFill>
      <OceanStage frame={f + 200} cam={cam} scene={SCENE_A} horizon={horAt(f)} rest={CAM_REST} sway>
        <World f={f} />
      </OceanStage>
    </AbsoluteFill>
  );
};
export default HuntingMinesV2;
