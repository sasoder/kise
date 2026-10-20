// ---------------------------------------------------------------------------
// howTheUniverseWorksOrreryV4: the orrery of kyle-london cut 10 V4, in orbitWorld's machine units (SUN =
// (540, 960), the orbit radius EARTH_R0, the plane squash ORRERY_TILT0, the same Sun, Earth, Moon, arm, pillar
// and drum drawings as orbitWorld's V2 orrery, copied here, not imported, because this one stands on a shorter
// pillar and stand: its orbit plane sits below the scientist's waist). Drawn in two layers so the scientist's
// crank arm goes between them: <OrreryBack> (stand, drum, the ring's far half, the far-side Earth, pillar, Sun)
// and <OrreryFront> (the ring's near half, the near-side Earth on its arm). Draw inside a WorldSvg under the
// orrery camera (orreryCamOf).
// ---------------------------------------------------------------------------
import React from "react";
import { ACCENT, ACCENT_DEEP, DARK, EARTH_R0, INK, N_TEETH, ORRERY_TILT0, SPOKE_INK, SUN, type P2 } from "./orbitWorld";
import { ARM_DROP, DRUM_BOT_Y, DRUM_RX, DRUM_TOP_Y, ORR_FOOT } from "./howTheUniverseWorksPlanV4";

const PED_FILL = "#2B231A"; // orbitWorld's dark umber plane
const PED_FACE = "#352B20"; // its lit top face
const fx = (v: number) => v.toFixed(3);
const at = (c: P2, r: number, a: number) => `${fx(c[0] + r * Math.cos(a))} ${fx(c[1] + r * Math.sin(a))}`;
const PITCH_A = (2 * Math.PI) / N_TEETH;
const onPlane = (r: number, a: number): P2 => [SUN[0] + r * Math.cos(a), SUN[1] + r * ORRERY_TILT0 * Math.sin(a)];

/** orbitWorld's toothed outline (the Sun with its rays) */
const gearD = (c: P2, phase: number, rIn: number, rOut: number, hwIn: number, hwOut: number) => {
  const wIn = Math.min(hwIn / rIn, PITCH_A * 0.49);
  const wOut = Math.min(hwOut / rOut, wIn);
  let d = "";
  for (let k = 0; k < N_TEETH; k++) {
    const a = phase + k * PITCH_A;
    d += k === 0 ? `M${at(c, rIn, a - wIn)}` : `A${fx(rIn)} ${fx(rIn)} 0 0 1 ${at(c, rIn, a - wIn)}`;
    d += `L${at(c, rOut, a - wOut)}A${fx(rOut)} ${fx(rOut)} 0 0 1 ${at(c, rOut, a + wOut)}L${at(c, rIn, a + wIn)}`;
  }
  d += `A${fx(rIn)} ${fx(rIn)} 0 0 1 ${at(c, rIn, phase - wIn)}Z`;
  return d;
};
/** orbitWorld's engraved shading: lines lower-left -> upper-right on the lower right of a body, clipped */
const Hatch: React.FC<{ c: P2; r: number; clip: string; opacity: number; color?: string; n?: number }> = ({ c, r, clip, opacity, color = ACCENT_DEEP, n = 9 }) => {
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const t = 0.18 + (i / (n - 1)) * 0.95;
    const ox = c[0] + (t * r) / Math.SQRT2;
    const oy = c[1] + (t * r) / Math.SQRT2;
    const L = r * 1.3;
    lines.push(<line key={i} x1={ox - L / Math.SQRT2} y1={oy + L / Math.SQRT2} x2={ox + L / Math.SQRT2} y2={oy - L / Math.SQRT2} stroke={color} strokeWidth={0.9 + 1.9 * (i / (n - 1))} />);
  }
  return (
    <g clipPath={`url(#${clip})`} opacity={opacity}>
      {lines}
    </g>
  );
};

const EARTH_BALL_R = 26;
const SUN_BALL_R = 50;
const SUN_RAY_R = 86;
const MOON_R = 46;
const FOOT_RX = 130;
const line = { fill: PED_FILL, stroke: SPOKE_INK, strokeWidth: 3.2, strokeLinejoin: "round" as const };

/** the ring: the path the Earth's arm sweeps, a thin engraved band in the orbit plane (cream context) */
const ringD = (a0: number, a1: number) => {
  const n = 120;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const p = onPlane(EARTH_R0, a0 + ((a1 - a0) * i) / n);
    pts.push(`${fx(p[0])},${fx(p[1])}`);
  }
  return `M${pts.join("L")}`;
};
const RING_FAR = ringD(Math.PI, 2 * Math.PI);
const RING_NEAR = ringD(0, Math.PI);
const Ring: React.FC<{ d: string }> = ({ d }) => (
  <g fill="none" strokeLinecap="round">
    <path d={d} stroke={DARK} strokeOpacity={0.75} strokeWidth={10} />
    <path d={d} stroke={INK} strokeOpacity={0.55} strokeWidth={4} />
  </g>
);

/** the Earth on its orange arm (from the collar under the Sun, below the plane) and stalk, with the Moon */
const EarthOnArm: React.FC<{ angle: number; id: string }> = ({ angle, id }) => {
  const p = onPlane(EARTH_R0, angle);
  const rootY = SUN[1] + ARM_DROP;
  const armEnd: P2 = [p[0], p[1] + ARM_DROP];
  const ma = angle * 2.6 + 1.1;
  const q: P2 = [p[0] + MOON_R * Math.cos(ma), p[1] + MOON_R * ORRERY_TILT0 * Math.sin(ma)];
  const moonBehind = Math.sin(ma) < 0;
  const moon = (
    <g>
      <path d={`M${fx(p[0])} ${fx(p[1])}L${fx(q[0])} ${fx(q[1])}`} stroke={DARK} strokeWidth={9} strokeLinecap="round" />
      <path d={`M${fx(p[0])} ${fx(p[1])}L${fx(q[0])} ${fx(q[1])}`} stroke={ACCENT} strokeWidth={4} strokeLinecap="round" />
      <circle cx={q[0]} cy={q[1]} r={9} fill={INK} stroke={DARK} strokeWidth={3} paintOrder="stroke" />
    </g>
  );
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <circle cx={p[0]} cy={p[1]} r={EARTH_BALL_R} />
        </clipPath>
      </defs>
      <path d={`M${fx(SUN[0])} ${fx(rootY)}L${fx(armEnd[0])} ${fx(armEnd[1])}`} stroke={DARK} strokeWidth={19.8} strokeLinecap="round" />
      <path d={`M${fx(SUN[0])} ${fx(rootY)}L${fx(armEnd[0])} ${fx(armEnd[1])}`} stroke={ACCENT} strokeWidth={13} strokeLinecap="round" />
      <path d={`M${fx(armEnd[0])} ${fx(armEnd[1])}L${fx(p[0])} ${fx(p[1])}`} stroke={DARK} strokeWidth={14.8} strokeLinecap="round" />
      <path d={`M${fx(armEnd[0])} ${fx(armEnd[1])}L${fx(p[0])} ${fx(p[1])}`} stroke={ACCENT} strokeWidth={8} strokeLinecap="round" />
      <ellipse cx={SUN[0]} cy={rootY} rx={22} ry={8} fill={ACCENT} stroke={DARK} strokeWidth={3.4} paintOrder="stroke" />
      {moonBehind ? moon : null}
      <circle cx={p[0]} cy={p[1]} r={EARTH_BALL_R} fill={ACCENT} stroke={DARK} strokeWidth={3.4} paintOrder="stroke" />
      <Hatch c={p} r={EARTH_BALL_R} clip={id} opacity={0.8} n={6} />
      {moonBehind ? null : moon}
    </g>
  );
};

/** the stand: a turned baluster from under the drum to a round foot (dark umber planes in the context cream line) */
const Stand: React.FC = () => {
  const cx = SUN[0];
  const top = DRUM_BOT_Y + 50;
  const footBot = ORR_FOOT - FOOT_RX * ORRERY_TILT0; // the front of the foot's bottom edge on ORR_FOOT
  const footTop = footBot - 40;
  const half = (u: number) => 30 + 26 * u + 8 * Math.sin(Math.PI * u);
  const N = 12;
  const L: string[] = [];
  const R: string[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const y = top + (footTop - top) * u;
    L.push(`${fx(cx - half(u))} ${fx(y)}`);
    R.unshift(`${fx(cx + half(u))} ${fx(y)}`);
  }
  return (
    <g>
      {/* the round foot: a low turned plinth whose front edge stands on the floor line */}
      <path d={`M${cx - FOOT_RX} ${fx(footTop)}L${cx - FOOT_RX} ${fx(footBot)}A${FOOT_RX} ${fx(FOOT_RX * ORRERY_TILT0)} 0 0 0 ${cx + FOOT_RX} ${fx(footBot)}L${cx + FOOT_RX} ${fx(footTop)}Z`} {...line} />
      <ellipse cx={cx} cy={footTop} rx={FOOT_RX} ry={FOOT_RX * ORRERY_TILT0} fill={PED_FACE} stroke={SPOKE_INK} strokeWidth={3.2} />
      <path d={`M${L.join("L")}L${R.join("L")}Z`} {...line} />
      {[0.05, 0.5, 0.95].map((u, i) => {
        const y = top + (footTop - top) * u;
        return <ellipse key={i} cx={cx} cy={y} rx={half(u) + 12} ry={(half(u) + 12) * ORRERY_TILT0} {...line} />;
      })}
    </g>
  );
};

/** the drum (the gear box): a box with an elliptical bottom edge and its top face, a ring of ticks on the top */
const Drum: React.FC<{ id: string }> = ({ id }) => {
  const cx = SUN[0];
  const bx = DRUM_RX;
  const ry = DRUM_RX * ORRERY_TILT0;
  const bTop = DRUM_TOP_Y;
  const bBot = DRUM_BOT_Y;
  const boxD = `M${fx(cx - bx)} ${fx(bTop)}L${fx(cx + bx)} ${fx(bTop)}L${fx(cx + bx)} ${fx(bBot)}A${fx(bx)} ${fx(ry)} 0 0 1 ${fx(cx - bx)} ${fx(bBot)}Z`;
  const hatch: React.ReactNode[] = [];
  const w = 2 * bx;
  const h = bBot + ry - bTop;
  for (let t = w * 0.45, i = 0; t < w + h; t += 14, i++) {
    hatch.push(<line key={i} x1={cx - bx + t - h} y1={bBot + ry} x2={cx - bx + t} y2={bTop} stroke={SPOKE_INK} strokeWidth={1.2 + 0.6 * Math.min(1, (t - w * 0.45) / w)} />);
  }
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={boxD} />
        </clipPath>
      </defs>
      <path d={boxD} {...line} />
      <g clipPath={`url(#${id})`} opacity={0.35}>
        {hatch}
      </g>
      <ellipse cx={cx} cy={bTop} rx={bx} ry={ry} fill={PED_FACE} stroke={SPOKE_INK} strokeWidth={3.2} />
      <ellipse cx={cx} cy={bTop} rx={bx * 0.78} ry={ry * 0.78} fill="none" stroke={SPOKE_INK} strokeOpacity={0.55} strokeWidth={1.6} />
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * 2 * Math.PI;
        return (
          <path
            key={i}
            d={`M${fx(cx + bx * 0.78 * Math.cos(a))} ${fx(bTop + ry * 0.78 * Math.sin(a))}L${fx(cx + bx * 0.86 * Math.cos(a))} ${fx(bTop + ry * 0.86 * Math.sin(a))}`}
            stroke={SPOKE_INK}
            strokeOpacity={0.55}
            strokeWidth={1.4}
          />
        );
      })}
    </g>
  );
};

/** the pillar from the drum's top face up to the Sun, and the Sun: a cream ball with its rays (orbitWorld's) */
const PillarAndSun: React.FC<{ id: string }> = ({ id }) => {
  const sunD = gearD(SUN, 0, SUN_BALL_R, SUN_RAY_R, 2.2, 0.7);
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={sunD} />
        </clipPath>
      </defs>
      <path d={`M${fx(SUN[0] - 11)} ${fx(SUN[1])}L${fx(SUN[0] + 11)} ${fx(SUN[1])}L${fx(SUN[0] + 15)} ${fx(DRUM_TOP_Y)}L${fx(SUN[0] - 15)} ${fx(DRUM_TOP_Y)}Z`} {...line} />
      <ellipse cx={SUN[0]} cy={DRUM_TOP_Y - 6} rx={24} ry={7.5} {...line} strokeWidth={2.4} />
      {Array.from({ length: N_TEETH }, (_, k) => {
        const a = (k + 0.5) * PITCH_A;
        return <path key={`d${k}`} d={`M${at(SUN, SUN_BALL_R - 2, a)}L${at(SUN, 66, a)}`} stroke={DARK} strokeWidth={4.4} strokeLinecap="round" />;
      })}
      {Array.from({ length: N_TEETH }, (_, k) => {
        const a = (k + 0.5) * PITCH_A;
        return <path key={`c${k}`} d={`M${at(SUN, SUN_BALL_R - 2, a)}L${at(SUN, 66, a)}`} stroke={INK} strokeWidth={2} strokeLinecap="round" />;
      })}
      <path d={sunD} fill={INK} stroke={DARK} strokeWidth={2.6} strokeLinejoin="round" paintOrder="stroke" />
      <Hatch c={SUN} r={SUN_BALL_R} clip={id} opacity={0.55} color={DARK} n={7} />
      <circle cx={SUN[0]} cy={SUN[1]} r={SUN_BALL_R * 0.62} fill="none" stroke={DARK} strokeOpacity={0.45} strokeWidth={1.6} />
    </g>
  );
};

const nearSide = (angle: number) => Math.sin(angle) > 0;
/** behind the scientist's crank arm: the stand, the drum, the ring's far half, a far-side Earth, the pillar and Sun */
export const OrreryBack: React.FC<{ angle: number; idPrefix: string }> = ({ angle, idPrefix }) => (
  <g>
    <Stand />
    <Drum id={`${idPrefix}-drum`} />
    <Ring d={RING_FAR} />
    {nearSide(angle) ? null : <EarthOnArm angle={angle} id={`${idPrefix}-earth`} />}
    <PillarAndSun id={`${idPrefix}-sun`} />
  </g>
);
/** in front of it: the ring's near half and a near-side Earth on its arm */
export const OrreryFront: React.FC<{ angle: number; idPrefix: string }> = ({ angle, idPrefix }) => (
  <g>
    <Ring d={RING_NEAR} />
    {nearSide(angle) ? <EarthOnArm angle={angle} id={`${idPrefix}-earth`} /> : null}
  </g>
);
