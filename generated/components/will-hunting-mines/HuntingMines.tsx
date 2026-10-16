import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  DepthGroup,
  InFog,
  LockBracket,
  NavalMine,
  OCEAN,
  OceanStage,
  SCENE_A,
  UlyssesVehicle,
  bloomFilter,
  camFor,
  clamp01,
  easeOutCubic,
  fogAt,
  lerp,
  makeClockCam,
  makeView,
  mineGeometry,
  project,
  smoothstep,
  unproject,
  useOcean,
  vehicleGeometry,
  type Cam,
  type Fan,
} from "../kits/cheeky-pint/oceanShared";

/**
 * HuntingMines — Cheeky Pint S4E02 (Will O'Brien, Ulysses), cut A.
 * Line: "We were doing mine countermeasures, finding mines and hunting mines before it was cool,"
 *
 * CHECK LINE: the viewer can say "Ulysses' small drone sweeps murky water with sonar and pinpoints a
 * sea mine for the Navy."
 *
 * THE MOTION (one continuous move): the Mako swims in from frame left at f0 (constant speed, nose
 * leading) and is whole in frame by f12, a free-swimming drone, its wide amber sonar fan sweeping the
 * murk ahead and below. A moored mine hangs as a dim shape in the fog ahead. As the vehicle closes, the
 * fan's volume reaches the mine (~f22) and lights it progressively, the side facing the fan first;
 * the amber brackets close on it from off-frame (f37). The camera drifts with the vehicle and pushes in
 * until the mine is the hero at the centre, while the vehicle slows to a hover at a clear stand-off
 * above and behind, its fan reaching across the gap. Then a living hold: the vehicle drifts on
 * station, the beam sweeps slowly back and forth across the mine, the chain sways, the camera creeps.
 *
 * FRAME TABLE (23.976 fps; the edit cuts back to the speaker at f80; DURATION 96 = 80 + 16 tail)
 *   f0      vehicle entering from the left (tail off-frame), fan sweeping; mine dim, right of centre
 *   f0-12   the vehicle swims fully into frame (tail ring, fins, both masts, shield all visible)
 *   f0-62   camera glide from wide (k 1.9) toward the mine (k 2.7), one eased move
 *   f22-40  the fan's volume covers the mine: lit side (top-left, facing the fan) clears first, the
 *           amber rim grows with the coverage; "finding" f29 is mid-reveal; far side stays darker
 *   f37-49  "mines": LockBracket corners slide in from just off-frame, ease out, full opacity, no label
 *   f20-56  vehicle eases from cruise to a hover (velocity-continuous) at the stand-off
 *   f35-60  the fan re-aims onto the mine and reaches across the gap to just past it
 *   f56-96  living hold: vehicle drifts on station, beam sweeps across the mine (40 f period),
 *           soft sonar wavefronts travel out through the fan, chain sways, camera creeps
 */
export const FPS = 24000 / 1001;
export const DURATION = 96;
export const schema = z.object({ t0: z.number().int().min(0).default(0) });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// ---- the world -------------------------------------------------------------------------------
const HOR = 930;
const MINE = { x: 0, y: 0, d: 120 };
const MG0 = mineGeometry(MINE);
/** the vehicle swims 2 m behind the mine's plane (part of its stand-off) */
const VEH_Z = -240;
const VEH_L = 240;
/** the mine's mooring sways a little in the current (rad, + = top right) */
const swayAt = (f: number) => 0.022 * Math.sin(f / 23 + 0.7) + 0.008 * Math.sin(f / 9.5 + 2.1);
/** extra murk on the unlit sphere (cleared where the sonar covers it) */
const MURK = 0.8;
/** constant extra murk on the sinker (the fan never reaches it: its colour never changes) */
const MURK_BED = 0.35;
const FOG_MINE = fogAt(SCENE_A, SCENE_A.focusM);

// ---- the camera (its own keyed track through the house damped follower) ------------------------
const K0 = 1.9;
const K_END = 2.7;
const CAM0: Cam = camFor(MG0.centre.x, MG0.centre.y, 760, 1010, K0);
const CAM_END: Cam = camFor(MG0.centre.x, MG0.centre.y, 560, 870, K_END);
const CLOCK = makeClockCam(
  CAM0,
  [
    // one eased move from the wide opening to the mine (a touch under way at f0)
    { f0: -8, f1: 62, dx: CAM_END.x - CAM0.x, dy: CAM_END.y - CAM0.y, k: K_END, warp: 1.15 },
    // the living hold: a slow creep
    { f0: 54, f1: 140, k: K_END * 1.03, dx: 6, dy: -4 },
  ],
  DURATION + 4,
);
const camAt = (f: number) => CLOCK.at(f);
const viewAt = (f: number) => makeView({ frame: f, cam: camAt(f), scene: SCENE_A, horizon: HOR });

// ---- the vehicle's travel: constant cruise, then a velocity-continuous ease into a hover ---------
const FA = 20; // cruise ends
const FB = 56; // hover reached
const V_END_SX = 300; // hull centre on screen at the hover (under CAM_END)
const V_END_SY = 226;
const V_START_SX = 92; // hull centre on screen at f0 (tail off-frame, nose in)
const V_END = unproject(makeView({ frame: 0, cam: CAM_END, scene: SCENE_A, horizon: HOR }), V_END_SX, V_END_SY, VEH_Z);
// a level run (it travels the way it points)
const V_START = { x: unproject(viewAt(0), V_START_SX, 400, VEH_Z).x, y: V_END.y };
const TRAVEL = V_END.x - V_START.x;
const SPEED = TRAVEL / (FA + (FB - FA) / 2); // world px / frame while cruising
const distAt = (f: number) => {
  if (f <= FA) return SPEED * f;
  if (f >= FB) return TRAVEL;
  const tau = (f - FA) / (FB - FA);
  return SPEED * FA + SPEED * (FB - FA) * (tau - (tau * tau) / 2);
};
const HOVER_TILT = 0.05; // the nose dips a little as it brakes and holds
const vehicleAt = (f: number) => {
  const hover = smoothstep((f - FA) / (FB - FA));
  const hold = smoothstep((f - FB + 12) / 30);
  // holding station: a slow drift + a small bob (it never leaves the frame)
  const drift = hold * 5 * Math.sin((f - FB) / 19);
  const bob = hover * (1.8 * Math.sin((f - FA) / 13) + 0.6 * Math.sin(f / 6.7));
  return {
    x: V_START.x + distAt(f) + drift,
    y: V_START.y + bob,
    L: VEH_L,
    facing: 1 as const,
    tilt: HOVER_TILT * hover + hold * 0.012 * Math.sin(f / 15),
    frame: f,
  };
};

// ---- the fan ---------------------------------------------------------------------------------
// WIDE, forward-and-down into the murk while cruising; after the lock it re-aims onto the mine and
// reaches across the stand-off to just past it.
const SPREAD = 1.5; // cruise (~86 deg)
const SPREAD_LOCK = 1.3;
const CRUISE_DOWN = 0.9; // rad below the heading (~52 deg: ahead and below)
const RANGE_LOCK = 1.62; // x the distance to the mine, once locked
const F_REACH = 22; // the fan's volume arrives at the mine's near side
const F_FIND = 29; // the beam passes over the mine
const F_LOCK = 37;
const BRACKET_F = 12;
const SCAN_PERIOD = 30;
const HOLD_PERIOD = 40;
/** a mine-plane point seen in the vehicle's depth plane (frame f) */
const toVehPlane = (f: number, x: number, y: number) => {
  const v = viewAt(f);
  const s = project(v, x, y, 0);
  return unproject(v, s.x, s.y, VEH_Z);
};
const mineAt = (f: number) => mineGeometry({ ...MINE, sway: swayAt(f) });
/** the mine's near side (facing the emitter, top-left) in the vehicle plane */
const nearSide = (f: number) => {
  const g = mineAt(f);
  return toVehPlane(f, g.centre.x - 0.7 * g.R, g.centre.y - 0.7 * g.R);
};
/** the cruise reach: the fan's visible volume arrives at the mine's near side at F_REACH */
const RANGE = (() => {
  const e = vehicleGeometry(vehicleAt(F_REACH)).emitter;
  const n = nearSide(F_REACH);
  return Math.hypot(n.x - e.x, n.y - e.y) / 0.95;
})();
/** the sonar tracks its contact as soon as it has one: re-aim + reach from ~f25 */
const aimAt = (f: number) => smoothstep((f - 25) / 20);
const BEAM_PHASE = (() => {
  const vg = vehicleGeometry(vehicleAt(F_FIND));
  const C = mineAt(F_FIND).centre;
  const m = toVehPlane(F_FIND, C.x, C.y);
  const off = Math.atan2(m.y - vg.emitter.y, m.x - vg.emitter.x) - (vg.heading + CRUISE_DOWN);
  return Math.asin(Math.max(-0.95, Math.min(0.95, off / (SPREAD * 0.8) / 0.45)));
})();
const fanAt = (f: number): Fan & { sweep: number } => {
  const vg = vehicleGeometry(vehicleAt(f));
  const C = mineAt(f).centre;
  const m = toVehPlane(f, C.x, C.y);
  const toMine = Math.atan2(m.y - vg.emitter.y, m.x - vg.emitter.x);
  const dist = Math.hypot(m.y - vg.emitter.y, m.x - vg.emitter.x);
  const a = aimAt(f);
  const angle = lerp(vg.heading + CRUISE_DOWN, toMine, a);
  const spread = lerp(SPREAD, SPREAD_LOCK, a);
  // the scan: the bright beam sweeps the fan; after the lock it keeps sweeping, slowly, across the mine
  const scan = 0.5 + 0.45 * Math.sin((2 * Math.PI * (f - F_FIND)) / SCAN_PERIOD + BEAM_PHASE);
  const across = 0.5 + (toMine - angle) / (spread * 0.8) + 0.24 * Math.sin((2 * Math.PI * (f - 46)) / HOLD_PERIOD);
  return { x: vg.emitter.x, y: vg.emitter.y, angle, spread, range: lerp(RANGE, dist * RANGE_LOCK, a), sweep: lerp(scan, across, a) };
};
/** how much of the fan's VISIBLE volume covers a point (vehicle-plane coords): matches the drawn fan */
const fanCover = (fan: Fan, x: number, y: number) => {
  const dx = x - fan.x;
  const dy = y - fan.y;
  const r = Math.hypot(dx, dy);
  let da = Math.atan2(dy, dx) - fan.angle;
  da = Math.atan2(Math.sin(da), Math.cos(da));
  const ang = 1 - smoothstep((Math.abs(da) - fan.spread * 0.38) / (fan.spread * 0.16));
  const rng = 1 - smoothstep((r - fan.range * 0.6) / (fan.range * 0.35));
  return clamp01(ang * rng);
};

// ---- the sonar's light on the mine: per height on the sphere, monotone (once covered, it stays) --
const BANDS = [-1.3, -1.0, -0.7, -0.4, -0.1, 0.2, 0.5, 0.8, 1.0]; // y offsets on the sphere (x R)
const COVER: number[][] = (() => {
  const out: number[][] = [];
  const mx = BANDS.map(() => 0);
  for (let f = 0; f <= DURATION + 2; f++) {
    const fan = fanAt(f);
    const g = mineAt(f);
    BANDS.forEach((u, i) => {
      // the sphere's emitter-facing limb at this height
      const hw = Math.sqrt(Math.max(0, 1 - Math.min(1, u * u))) * g.R;
      const p = toVehPlane(f, g.centre.x - 0.55 * hw, g.centre.y + u * g.R);
      mx[i] = Math.max(mx[i], fanCover(fan, p.x, p.y));
    });
    out.push([...mx]);
  }
  return out;
})();
const coverAt = (f: number) => COVER[Math.max(0, Math.min(COVER.length - 1, Math.round(f)))];
const litAt = (f: number) => {
  const c = coverAt(f);
  return c.reduce((s, v) => s + v, 0) / c.length;
};

/** numbers for the build log (bun scripts) */
export const DEBUG = { CAM0, CAM_END, V_START, V_END, SPEED, RANGE, camAt, vehicleAt, fanAt, litAt, coverAt, viewAt, VEH_Z };

// ---- a soft sonar fan (no range arcs): volume + sweeping beam + soft wavefronts + emitter core ----
const WAVE_PERIOD = 22; // frames between wavefronts
const WAVE_TRAVEL = 30; // frames for a wavefront to cross the fan
const SoftSonarFan: React.FC<Fan & { sweep: number; frame: number }> = ({ x, y, angle, spread, range, sweep, frame }) => {
  const o = useOcean();
  const uid = `hm${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const R = range;
  const px = 1 / o.a;
  const wedge = (a0: number, a1: number, r: number) =>
    `M${x} ${y}L${x + r * Math.cos(a0)} ${y + r * Math.sin(a0)}A${r} ${r} 0 0 1 ${x + r * Math.cos(a1)} ${y + r * Math.sin(a1)}Z`;
  const beamA = angle + (sweep - 0.5) * spread * 0.8;
  // wavefronts: travel out at constant speed, soft wide bands, shaded by distance (no pulse)
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
      {/* the volume: three nested wedges = a soft angular falloff, blurred */}
      <g style={{ filter: `blur(${14 * px}px)` }}>
        {[1, 0.78, 0.55].map((m, i) => (
          <path key={i} d={wedge(angle - (spread * m) / 2, angle + (spread * m) / 2, R)} fill={`url(#${uid}g)`} opacity={0.55} />
        ))}
      </g>
      {/* soft wavefronts travelling out through the volume (the sonar's pings, low-key) */}
      <g clipPath={`url(#${uid}c)`}>
        <g style={{ filter: `blur(${16 * px}px)` }}>{waves}</g>
      </g>
      {/* the beam that sweeps the fan */}
      <g style={{ filter: `blur(${6 * px}px) ${bloomFilter(o.a)}` }}>
        <path d={wedge(beamA - spread * 0.05, beamA + spread * 0.05, R * 0.96)} fill={`url(#${uid}h)`} opacity={0.75} />
      </g>
      {/* the emitter's hot core */}
      <circle cx={x} cy={y} r={7 * px} fill={OCEAN.amberHot} style={{ filter: bloomFilter(o.a) }} />
    </g>
  );
};

// ---- the scene -------------------------------------------------------------------------------
const World: React.FC<{ f: number }> = ({ f }) => {
  const o = useOcean();
  const vp = vehicleAt(f);
  const fan = fanAt(f);
  const cover = coverAt(f);
  const lit = litAt(f);
  const sway = swayAt(f);
  const mp = { ...MINE, sway };
  const mg = mineGeometry(mp);
  const R = mg.R;
  // the sonar's light on the mine comes from the emitter (seen on the mine's plane)
  const eS = project(o, fan.x, fan.y, VEH_Z);
  const litFrom = unproject(o, eS.x, eS.y, 0);
  const lockT = clamp01((f - F_LOCK) / BRACKET_F);
  // the split between the lit pass (sphere + upper chain) and the unlit pass (lower chain + sinker)
  const ySplit = mg.top.y - 0.55 * R;
  const ySph = mg.centre.y + R;
  // the lit pass's internal fog is lowered by `lit`; at the split it must match the unlit pass exactly
  const fogLitPass = FOG_MINE * (1 - 0.5 * lit);
  const murkSplit = clamp01(1 - ((1 - FOG_MINE) * (1 - MURK_BED)) / (1 - fogLitPass));
  const murkSphere = (y: number) => {
    const u = (y - mg.centre.y) / R;
    let c = cover[0];
    if (u >= BANDS[BANDS.length - 1]) c = cover[BANDS.length - 1];
    else if (u > BANDS[0]) {
      const i = BANDS.findIndex((b, j) => j > 0 && u <= b);
      const t = (u - BANDS[i - 1]) / (BANDS[i] - BANDS[i - 1]);
      c = lerp(cover[i - 1], cover[i], t);
    }
    return MURK * (1 - c);
  };
  const murkLit = (y: number) => (y <= ySph ? murkSphere(y) : lerp(murkSphere(ySph), murkSplit, smoothstep((y - ySph) / (ySplit - ySph))));
  const BIG = 4000;
  return (
    <>
      <DepthGroup z={VEH_Z}>
        <SoftSonarFan {...fan} frame={f} />
        <UlyssesVehicle {...vp} light={1} />
      </DepthGroup>
      <defs>
        <clipPath id="hmUpper">
          <rect x={-BIG} y={-BIG} width={2 * BIG} height={ySplit + BIG} />
        </clipPath>
        <clipPath id="hmLower">
          <rect x={-BIG} y={ySplit} width={2 * BIG} height={BIG} />
        </clipPath>
      </defs>
      {/* the sinker and lower chain: never lit, so never changes */}
      <g clipPath="url(#hmLower)">
        <InFog amount={MURK_BED}>
          <NavalMine {...mp} lit={0} />
        </InFog>
      </g>
      {/* the sphere and upper chain: cleared where the fan covers it, the near side first */}
      <g clipPath="url(#hmUpper)">
        <InFog amount={murkLit}>
          <NavalMine {...mp} lit={easeOutCubic(lit)} litFrom={litFrom} />
        </InFog>
      </g>
      <LockBracket x={mg.centre.x} y={mg.centre.y - 0.15 * R} w={2.6 * R} h={2.6 * R} t={lockT} />
    </>
  );
};

const HuntingMines: React.FC<Props> = ({ t0 }) => {
  const f = useCurrentFrame() + t0;
  const cam = camAt(f);
  return (
    <AbsoluteFill>
      <OceanStage frame={f + 200} cam={cam} scene={SCENE_A} horizon={HOR} rest={CLOCK.rest} sway>
        <World f={f} />
      </OceanStage>
    </AbsoluteFill>
  );
};
export default HuntingMines;
