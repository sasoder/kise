import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CORNER,
  DASH_LINE,
  DashedPath,
  ICONS,
  INK_HI,
  INK_LO,
  Icon,
  InkPath,
  LINE,
  RED_HI,
  RedBar,
  SEAL_R,
  Slot,
  VStage,
  V_INK,
  V_PAPER,
  barCross,
  clamp01,
  lineW,
  runVCamera,
  smoothstep,
  wpx,
} from "./chinatalkVintage";
import type { Pt } from "./chinatalkVintage";

// ---------------------------------------------------------------------------
// TechnologyAllocates — cut C of Logan Wright, "Brezhnev chose decay"
// (ChinaTalk, slightly vintage). Delivered as 24_TechnologyAllocates.mov.
//
// CHECK LINE: the Soviet bet was that one central computer could deal the whole
// economy's resources out to every sector, each filled exactly to its planned
// mark.
//
// LINE: "So we're going to be able to use technology to allocate resources
// effectively." (the Soviet planners speaking, 1960s)
// IN = edit frame 597 (24.875 s). Slot 84 f + 12 f living tail = 96 f at 24 fps.
// Local words: technology 26-38 · allocate 43-51 · resources 51-66 ·
// effectively 66-79.
//
// RED = resources (the economy's stock being handed out). Nothing else is red.
//
// MOTION (one continuous deal): a 1960s mainframe stands in the middle, a
// three-bay console (a tape unit with two turning reels, a tall stock tank full
// of red, a lamp panel); six slots radiate from behind it to six sectors. On
// frame 0 all six rays are already pressing out from behind the cabinet; each
// travels at its own constant speed while the tank drains by exactly what has
// been dealt, and the camera pulls back from the machine to the whole sunburst
// (k 1.35 -> 1.0 by ~f48). The plan gives each sector a different share: the
// fronts land clockwise on their dashed plan marks at f64, 66, 68, 70, 72, 74,
// at 92 / 74 / 86 / 68 / 80 / 62 % of their slots, each stops dead, its mark is
// written solid and its sector icon steps to the high rung (done by f84). The
// tank does not run dry: it reaches its reserve (two units of nine) as the last
// ray lands; then reels and lamps idle, one soft highlight runs out along the
// rays and the camera drifts in (k -> 1.02).
//
// The six shares are illustrative (no figures are shown).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const SLOT_F = 84;
export const TAIL_F = 12;
export const DURATION = SLOT_F + TAIL_F;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the machine: a three-bay console (world px = screen px at the wide framing, k = 1)
const CX = 540;
const BODY = { x0: 330, x1: 750, y0: 640, y1: 1064 };
/** the lowest ink of the machine (the outline's underside) */
export const MACHINE_BOTTOM = BODY.y1 + 3;
/** the low plinth is the band under this seam */
const PLINTH_Y = 1034;
/** the two seams between the bays */
const SEAM_L = 466;
const SEAM_R = 634;
/** LEFT BAY, the tape unit: two reels stacked, the tape running between them through the read head */
const REEL_X = 394;
const REEL_R = 46;
const REEL_UP_Y = 710;
const REEL_DN_Y = 964;
/** the wound tape: a thin pack on the upper reel, a thick one on the lower */
const PACK_IN = 15;
const PACK_UP = 27;
const PACK_DN = 39;
const HUB_R = 5;
const TICK_R = 13;
const HEAD = { w: 30, h: 24 };
/** the reels turn at one tape speed: degrees per frame at this pack radius */
const TAPE_REF_R = 33;
/** CENTRE BAY, the stock: a tall tank with a gauge down its right wall */
const WIN = { x0: 482, x1: 598, y0: 664, y1: 1010 };
const STOCK_LAYERS = 9;
const STOCK_SEAM = (WIN.y1 - WIN.y0) / STOCK_LAYERS;
/** the tank never runs dry: this much is left when the last ray has landed (two seamed units) */
const RESERVE = 2 / STOCK_LAYERS;
/** the glass of an empty tank or slot: an ink tint, so it is not bare paper */
const GLASS = 0.07;
const GAUGE_TICKS = 5;
const GAUGE_LEN = 16;
/** RIGHT BAY, the console: a lamp grid and three toggle switches */
const LAMP_COLS = 4;
const LAMP_ROWS = 7;
const LAMP_X0 = 659;
const LAMP_DX = 22;
const LAMP_Y0 = 676;
const LAMP_DY = 34;
const LAMP_R = 7;
const TOGGLES = [
  { x: 664, lean: -7 },
  { x: 692, lean: 7 },
  { x: 720, lean: -7 },
];
const TOGGLE_Y = 980;
const TOGGLE_LEN = 24;
/** the vent slats in the plinth */
const VENTS = [664, 678, 692, 706, 720];

// --- the sunburst ----------------------------------------------------------------
/** every slot's centreline passes through this point, hidden behind the cabinet */
const O: Pt = { x: CX, y: 858 };
/** the four diagonals stand this far off the vertical */
const FAN_DEG = 32;
const SLOT_W = 64;
/** a plan mark overhangs its slot this far on each side, and is this much heavier than the kit's line */
const MARK_OVER = 36;
const MARK_BOLD = 1.5;
const ICON = 100;
const ICON_GAP = 18;
/** the units a ray is counted into travel with its front */
const RAY_SEAM = 40;
/** where a ray's bar starts, world px from O (hidden behind the cabinet) */
const HIDE = 70;
/** every ray is already this far out of the cabinet on frame 0 */
const OUT_0 = 30;
/** the wet front dries over this many frames once a ray has landed */
const DRY_F = 18;
/** a plan mark is written solid over this many frames, starting on the landing frame */
const SOLID_F = 3;
/** a sector icon steps to the high rung over this many frames from the landing frame */
const ICON_F = 10;

/** lucide `truck` (ISC), its two circles converted to paths */
const TRUCK = [
  "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",
  "M15 18H9",
  "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",
  "M15 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0z",
  "M5 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0z",
] as const;

type RaySpec = { key: string; deg: number; endR: number; fill: number; land: number; icon: readonly string[] };
/** deg = clockwise from straight up; endR = the slot's far end, world px from O;
 *  fill = the planned share, as the fraction of the slot's visible length the
 *  red stops at; land = the frame the front stops on the mark (clockwise). */
const RAY_SPECS: RaySpec[] = [
  { key: "up", deg: 0, endR: 655, fill: 0.92, land: 64, icon: ICONS.factory },
  { key: "ur", deg: FAN_DEG, endR: 669.1, fill: 0.74, land: 66, icon: ICONS.rocket },
  { key: "dr", deg: 180 - FAN_DEG, endR: 603.7, fill: 0.86, land: 68, icon: ICONS.building2 },
  { key: "dn", deg: 180, endR: 740, fill: 0.68, land: 70, icon: TRUCK },
  { key: "dl", deg: 180 + FAN_DEG, endR: 673.7, fill: 0.8, land: 72, icon: ICONS.wheat },
  { key: "ul", deg: 360 - FAN_DEG, endR: 609.1, fill: 0.62, land: 74, icon: ICONS.zap },
];
const along = (u: Pt, r: number): Pt => ({ x: O.x + u.x * r, y: O.y + u.y * r });
export const RAYS = RAY_SPECS.map((s) => {
  const a = (s.deg * Math.PI) / 180;
  const u: Pt = { x: Math.sin(a), y: -Math.cos(a) };
  // where the centreline leaves the cabinet: its top edge or its bottom edge
  const exitR = u.y < 0 ? (O.y - BODY.y0) / -u.y : (BODY.y1 - O.y) / u.y;
  /** the planned visible length: cabinet edge -> plan mark */
  const reach = s.fill * (s.endR - exitR);
  const markR = exitR + reach;
  return {
    ...s,
    u,
    exitR,
    markR,
    reach,
    /** its own constant speed, world px per frame: OUT_0 out on frame 0, on the mark on `land` */
    speed: (reach - OUT_0) / s.land,
    slotFrom: along(u, HIDE),
    slotTo: along(u, s.endR),
    mark: barCross(along(u, HIDE), along(u, s.endR), SLOT_W, markR - HIDE, MARK_OVER),
    iconAt: along(u, s.endR + ICON_GAP + ICON / 2),
  };
});
export type Ray = (typeof RAYS)[number];
/** the front's distance from O at frame f */
const frontR = (r: Ray, f: number) => Math.min(r.markR, r.exitR + OUT_0 + f * r.speed);
/** how much of a ray is out of the machine at frame f */
export const visLen = (r: Ray, f: number) => Math.max(0, frontR(r, f) - r.exitR);
const TOTAL = RAYS.reduce((s, r) => s + r.reach, 0);
export const dealtAt = (f: number) => RAYS.reduce((s, r) => s + visLen(r, f), 0);
const DEALT_0 = dealtAt(0);
/** the stock left in the tank: 1 (full, frame 0) -> RESERVE (the last ray has landed), following the total dealt */
export const stockAt = (f: number) => RESERVE + (1 - RESERVE) * clamp01(1 - (dealtAt(f) - DEALT_0) / (TOTAL - DEALT_0));
export const LAST_LAND = Math.max(...RAYS.map((r) => r.land));

// --- the machine's own life: reels and lamps on smooth speed curves ---------------
const bump = (f: number, a: number, p: number, b: number) => smoothstep((f - a) / (p - a)) * (1 - smoothstep((f - p) / (b - p)));
/** busiest on "technology" (26-38), idling once the deal is done */
const busy = (f: number) => bump(f, 14, 32, 52);
const idle = (f: number) => smoothstep((f - 56) / 24);
const tapeSpeed = (f: number) => 6 + 7 * busy(f) - 3.4 * idle(f); // degrees per frame at TAPE_REF_R
const lampSpeed = (f: number) => 0.2 + 0.26 * busy(f) - 0.1 * idle(f); // lamp rows per frame
const integrate = (speed: (f: number) => number) => {
  const acc: number[] = [0];
  for (let f = 0; f <= DURATION + 1; f++) acc.push(acc[f] + speed(f));
  return (S: number) => {
    const t = Math.max(0, Math.min(DURATION, S));
    const i = Math.floor(t);
    return acc[i] + (acc[i + 1] - acc[i]) * (t - i);
  };
};
const tapeAngleAt = integrate(tapeSpeed);
const lampPhaseAt = integrate(lampSpeed);
/** the chase is a soft slanted band running down the grid, one band per LAMP_PERIOD rows */
const LAMP_PERIOD = 9.5;
const LAMP_SLANT = 0.6;
const LAMP_SOFT = 0.95;

// --- the highlight of the settled frame ---------------------------------------------
/** one soft band that leaves the machine as the last ray lands and runs out along all six */
const HL_START = LAST_LAND;
const HL_SPEED = 18;
const HL_HALF = 110;
/** it starts wholly behind the cabinet: its leading edge on the nearest cabinet edge */
const HL_R0 = Math.min(...RAYS.map((r) => r.exitR)) - HL_HALF;

// --- the camera: one slow pull-back from the machine to the sunburst, then a drift in
/** the look that keeps the machine's foot just above the caption strip at zoom k */
const lookY = (k: number) => MACHINE_BOTTOM - 105 / k;
export const camAt = runVCamera(
  [
    { f: -30, x: CX, y: lookY(1.5), k: 1.5 },
    { f: 46, x: CX, y: lookY(1.0), k: 1.0 },
    { f: 112, x: CX, y: lookY(1.034), k: 1.034, ease: "linear" },
  ],
  DURATION + 1,
);
const REST = camAt(0);

// ---------------------------------------------------------------------------
/** The glass of an empty slot: the same ink tint as the stock tank, under the red. */
const SlotGlass: React.FC<{ r: Ray }> = ({ r }) => {
  const len = Math.hypot(r.slotTo.x - r.slotFrom.x, r.slotTo.y - r.slotFrom.y);
  const deg = (Math.atan2(r.slotTo.y - r.slotFrom.y, r.slotTo.x - r.slotFrom.x) * 180) / Math.PI;
  return (
    <rect
      transform={`translate(${r.slotFrom.x.toFixed(3)} ${r.slotFrom.y.toFixed(3)}) rotate(${deg.toFixed(4)})`}
      x={0}
      y={-SLOT_W / 2}
      width={len.toFixed(3)}
      height={SLOT_W}
      rx={SLOT_W / 2}
      fill={V_INK}
      opacity={GLASS}
    />
  );
};

/** The plan mark: the kit's PlanMark (dashed = planned; `solid` writes a solid
 *  line over it from its start), drawn MARK_BOLD heavier so the line the red
 *  stops on is the thing one sees. */
const BoldMark: React.FC<{ from: Pt; to: Pt; k: number; solid: number }> = ({ from, to, k, solid }) => {
  const pts = [from, to];
  const sd = clamp01(solid);
  return (
    <g>
      {sd < 0.999 ? <DashedPath points={pts} k={k} march={false} width={DASH_LINE * MARK_BOLD} /> : null}
      {sd > 0.0005 ? <InkPath points={pts} k={k} draw={sd} width={LINE * MARK_BOLD} /> : null}
    </g>
  );
};

const RayBar: React.FC<{ r: Ray; S: number; k: number }> = ({ r, S, k }) => {
  const front = frontR(r, S);
  if (front <= HIDE + 1) return null;
  // the seams are counted back from the front, so the units travel with it
  const slip = (front - HIDE) % RAY_SEAM;
  const from = along(r.u, HIDE + slip);
  const len = front - HIDE - slip;
  const wet = 1 - smoothstep((S - r.land) / DRY_F);
  const hlR = HL_R0 + (S - HL_START) * HL_SPEED;
  const lit = S >= HL_START && hlR + HL_HALF > r.exitR - 40 && hlR - HL_HALF < r.markR;
  const g0 = along(r.u, hlR - HL_HALF);
  const g1 = along(r.u, hlR + HL_HALF);
  const pad = SLOT_W;
  const bx0 = Math.min(r.slotFrom.x, r.slotTo.x) - pad;
  const by0 = Math.min(r.slotFrom.y, r.slotTo.y) - pad;
  const bw = Math.abs(r.slotTo.x - r.slotFrom.x) + 2 * pad;
  const bh = Math.abs(r.slotTo.y - r.slotFrom.y) + 2 * pad;
  return (
    <>
      <RedBar id={`ta-ray-${r.key}`} from={from} to={r.slotTo} width={SLOT_W} k={k} slot radius={SLOT_W / 2} len={len} seam={RAY_SEAM} wet={wet} />
      {lit ? (
        <>
          <defs>
            <linearGradient id={`ta-hlg-${r.key}`} gradientUnits="userSpaceOnUse" x1={g0.x.toFixed(2)} y1={g0.y.toFixed(2)} x2={g1.x.toFixed(2)} y2={g1.y.toFixed(2)}>
              <stop offset={0} stopColor="#FFFFFF" stopOpacity={0} />
              <stop offset={0.2} stopColor="#FFFFFF" stopOpacity={0.35} />
              <stop offset={0.4} stopColor="#FFFFFF" stopOpacity={1} />
              <stop offset={0.6} stopColor="#FFFFFF" stopOpacity={1} />
              <stop offset={0.8} stopColor="#FFFFFF" stopOpacity={0.35} />
              <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
            </linearGradient>
            <mask id={`ta-hlm-${r.key}`} maskUnits="userSpaceOnUse" x={bx0.toFixed(1)} y={by0.toFixed(1)} width={bw.toFixed(1)} height={bh.toFixed(1)}>
              <rect x={bx0.toFixed(1)} y={by0.toFixed(1)} width={bw.toFixed(1)} height={bh.toFixed(1)} fill={`url(#ta-hlg-${r.key})`} />
            </mask>
          </defs>
          <g mask={`url(#ta-hlm-${r.key})`}>
            <RedBar id={`ta-hl-${r.key}`} from={from} to={r.slotTo} width={SLOT_W} k={k} slot radius={SLOT_W / 2} len={len} seam={RAY_SEAM} color={RED_HI} shadow={false} />
          </g>
        </>
      ) : null}
    </>
  );
};

/** A tape reel: the flange ring, the wound tape (an ink annulus at the low
 *  rung, out to `pack`), the hub and one radial tick that shows it turning. */
const Reel: React.FC<{ y: number; pack: number; angle: number; k: number }> = ({ y, pack, angle, k }) => {
  const lw = lineW(k).toFixed(3);
  const a = (angle * Math.PI) / 180;
  return (
    <g fill="none" stroke={V_INK}>
      <circle cx={REEL_X} cy={y} r={(PACK_IN + pack) / 2} strokeWidth={pack - PACK_IN} strokeOpacity={INK_LO / INK_HI} />
      <circle cx={REEL_X} cy={y} r={REEL_R} strokeWidth={lw} />
      <path d={`M${REEL_X} ${y}L${(REEL_X + Math.cos(a) * TICK_R).toFixed(2)} ${(y + Math.sin(a) * TICK_R).toFixed(2)}`} strokeWidth={lw} strokeLinecap="round" />
      <circle cx={REEL_X} cy={y} r={HUB_R} fill={V_INK} stroke="none" />
    </g>
  );
};

// the tape: the outer tangent of the two packs on their right side, through the read head
const TAPE_NY = (PACK_UP - PACK_DN) / (REEL_DN_Y - REEL_UP_Y);
const TAPE_NX = Math.sqrt(1 - TAPE_NY * TAPE_NY);
const TAPE_A: Pt = { x: REEL_X + PACK_UP * TAPE_NX, y: REEL_UP_Y + PACK_UP * TAPE_NY };
const TAPE_B: Pt = { x: REEL_X + PACK_DN * TAPE_NX, y: REEL_DN_Y + PACK_DN * TAPE_NY };
const tapeXAt = (y: number) => TAPE_A.x + ((y - TAPE_A.y) / (TAPE_B.y - TAPE_A.y)) * (TAPE_B.x - TAPE_A.x);
const HEAD_Y = (REEL_UP_Y + REEL_DN_Y) / 2;
const HEAD_X = tapeXAt(HEAD_Y);

const Machine: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const lw = lineW(k);
  const corner = wpx(CORNER, k);
  const small = wpx(SEAL_R, k);
  const winW = WIN.x1 - WIN.x0;
  const winH = WIN.y1 - WIN.y0;
  const winR = Math.max(0, corner - lw / 2);
  const level = WIN.y1 - stockAt(S) * winH;
  const tape = tapeAngleAt(S);
  const phase = lampPhaseAt(S);
  const second = busy(S);
  const lamps: React.ReactNode[] = [];
  for (let row = 0; row < LAMP_ROWS; row++) {
    for (let col = 0; col < LAMP_COLS; col++) {
      const s = row + LAMP_SLANT * col;
      const wave = (p: number) => {
        const d0 = (((s - p) % LAMP_PERIOD) + LAMP_PERIOD) % LAMP_PERIOD;
        const d = Math.min(d0, LAMP_PERIOD - d0);
        return Math.exp(-(d * d) / (2 * LAMP_SOFT * LAMP_SOFT));
      };
      const b = Math.max(wave(phase), second * wave(phase + LAMP_PERIOD / 2));
      lamps.push(
        <circle key={`${row}-${col}`} cx={LAMP_X0 + col * LAMP_DX} cy={LAMP_Y0 + row * LAMP_DY} r={LAMP_R} fill={V_INK} opacity={(INK_LO + (INK_HI - INK_LO) * b).toFixed(4)} />,
      );
    }
  }
  const headTop = HEAD_Y - HEAD.h / 2;
  const headBot = HEAD_Y + HEAD.h / 2;
  const strand =
    `M${TAPE_A.x.toFixed(2)} ${TAPE_A.y.toFixed(2)}L${tapeXAt(headTop).toFixed(2)} ${headTop.toFixed(2)}` +
    `M${tapeXAt(headBot).toFixed(2)} ${headBot.toFixed(2)}L${TAPE_B.x.toFixed(2)} ${TAPE_B.y.toFixed(2)}`;
  const seams = `M${BODY.x0} ${PLINTH_Y}H${BODY.x1}M${SEAM_L} ${BODY.y0}V${PLINTH_Y}M${SEAM_R} ${BODY.y0}V${PLINTH_Y}`;
  const vents = VENTS.map((x) => `M${x} ${PLINTH_Y + 11}V${BODY.y1 - 11}`).join("");
  const gauge = Array.from({ length: GAUGE_TICKS }, (_, i) => {
    const y = WIN.y0 + (winH * (i + 1)) / (GAUGE_TICKS + 1);
    return `M${WIN.x1 + lw / 2} ${y.toFixed(2)}h${GAUGE_LEN}`;
  }).join("");
  const toggles = TOGGLES.map((t) => `M${t.x} ${TOGGLE_Y}L${t.x + t.lean} ${TOGGLE_Y - TOGGLE_LEN}`).join("");
  return (
    <g>
      {/* the cabinet's face hides where the slots begin */}
      <rect x={BODY.x0} y={BODY.y0} width={BODY.x1 - BODY.x0} height={BODY.y1 - BODY.y0} rx={corner.toFixed(3)} fill={V_PAPER} />
      {/* the stock: a counted stack that sinks out of the tank as it is dealt */}
      <defs>
        <clipPath id="ta-window">
          <rect x={WIN.x0} y={WIN.y0} width={winW} height={winH} rx={winR.toFixed(3)} />
        </clipPath>
      </defs>
      <rect x={WIN.x0} y={WIN.y0} width={winW} height={winH} rx={winR.toFixed(3)} fill={V_INK} opacity={GLASS} />
      {level < WIN.y1 - 0.2 ? (
        <g clipPath="url(#ta-window)">
          <RedBar id="ta-stock" from={{ x: CX, y: level }} to={{ x: CX, y: WIN.y1 + 80 }} width={winW} k={k} slot radius={0} seam={STOCK_SEAM} />
        </g>
      ) : null}
      <g opacity={INK_HI} fill="none" stroke={V_INK} strokeWidth={lw.toFixed(3)} strokeLinecap="round" strokeLinejoin="round">
        <rect x={BODY.x0} y={BODY.y0} width={BODY.x1 - BODY.x0} height={BODY.y1 - BODY.y0} rx={corner.toFixed(3)} />
        <path d={seams} strokeLinecap="butt" />
        <path d={vents} />
        <path d={gauge} strokeLinecap="butt" />
        {/* the tape unit */}
        <Reel y={REEL_UP_Y} pack={PACK_UP} angle={20 + (tape * TAPE_REF_R) / PACK_UP} k={k} />
        <Reel y={REEL_DN_Y} pack={PACK_DN} angle={200 + (tape * TAPE_REF_R) / PACK_DN} k={k} />
        <path d={strand} strokeLinecap="butt" strokeOpacity={INK_LO / INK_HI} />
        <rect x={HEAD_X - HEAD.w / 2} y={headTop} width={HEAD.w} height={HEAD.h} rx={small.toFixed(3)} />
        {/* the console's switches */}
        <path d={toggles} />
        {TOGGLES.map((t) => (
          <circle key={t.x} cx={t.x} cy={TOGGLE_Y} r={6} fill={V_INK} stroke="none" />
        ))}
      </g>
      <Slot from={{ x: CX, y: WIN.y1 }} to={{ x: CX, y: WIN.y0 }} width={winW} k={k} />
      {lamps}
    </g>
  );
};

const TechnologyAllocates: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  return (
    <VStage S={S} cam={cam} rest={REST}>
      {RAYS.map((r) => (
        <SlotGlass key={r.key} r={r} />
      ))}
      {RAYS.map((r) => (
        <RayBar key={r.key} r={r} S={S} k={k} />
      ))}
      {RAYS.map((r) => (
        <Slot key={r.key} from={r.slotFrom} to={r.slotTo} width={SLOT_W} k={k} radius={SLOT_W / 2} rung={INK_LO} />
      ))}
      {RAYS.map((r) => (
        <BoldMark key={r.key} from={r.mark.from} to={r.mark.to} k={k} solid={clamp01((S - r.land + 1) / SOLID_F)} />
      ))}
      {RAYS.map((r) => (
        <Icon key={r.key} d={r.icon} x={r.iconAt.x} y={r.iconAt.y} size={ICON} k={k} rung={INK_LO + (INK_HI - INK_LO) * smoothstep((S - r.land) / ICON_F)} />
      ))}
      <Machine S={S} k={k} />
    </VStage>
  );
};

export default TechnologyAllocates;
