// ---------------------------------------------------------------------------
// officeRoom — THE OFFICE of "nik - managers won't fire underperformers" (Cheeky Pint S4E06), cut 14
// BiasedAgainstExiting: the desks under the warm office light. Side view, picture-book card objects in the stout
// material, lit by one key light from above and slightly left. Wall, floor and skirting tones come from
// officeTokens.ts (never restated here); the golden-hour windows use droneSeaShared's SKY; grain and vignette are
// stoutShared's. Nothing black; the ONLY amber is the EXIT sign (fixed bloom, never a pulse).
//
//   OfficeCam    { x, y, k }: the camera on the FLOOR PLANE (where the desks, chairs and people stand): world px,
//                y down, screen = 540 + (wx - x) k, 960 + (wy - y) k.
//   The wall is a second plane behind it, scaled by WALL_F (parallax: it slides slower on a pan). Wall items are
//   laid out in "wide px" (where they sit on screen in the resolved wide, camera {540, 960, 1}) through wallPt().
//   OfficeStage  the frame: wall (windows, light patch, door + EXIT sign, skirting), floor, `children` (the
//                floor-plane world, inside the camera transform), then vignette + grain.
//   Desk, Monitor, Keyboard, OfficeChair, FloorShadow  furniture in floor-plane world px (OfficeChair hip-local).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { AmberGradient, COLOR, EDGE, FONT_LABEL, GRAIN, GROUND, METRIC, TRACK, VIGNETTE, amberBandFor, bloomFilter, labelWidth, mixHex } from "../kits/cheeky-pint/stoutShared";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { OFFICE } from "./officeTokens";

type P2 = [number, number];
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `or${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const LIGHT = "#FFF4E2";
const topOf = (c: string, a = 0.12) => mixHex(c, LIGHT, a);
const footOf = (c: string, a = 0.14) => mixHex(c, COLOR.shadow, a);

// --- camera -----------------------------------------------------------------------------------------------------
export type OfficeCam = { x: number; y: number; k: number };
/** the wall's scale relative to the floor plane (it sits behind: smaller, slower) */
export const WALL_F = 0.8;
export const toScreen = (c: OfficeCam, wx: number, wy: number, f = 1): P2 => [540 + (wx - c.x) * c.k * f, 960 + (wy - c.y) * c.k * f];
export const planeTf = (c: OfficeCam, f = 1) => {
  const k = c.k * f;
  return `matrix(${f3(k)} 0 0 ${f3(k)} ${f3(540 - c.x * k)} ${f3(960 - c.y * k)})`;
};
/** a wall point given where it sits on screen in the resolved wide (camera 540, 960, k 1) -> wall coords */
export const wallPt = (sx: number, sy: number): P2 => [540 + (sx - 540) / WALL_F, 960 + (sy - 960) / WALL_F];
/** the wall-plane camera for stoutShared helpers (amberBandFor) */
export const wallCam = (c: OfficeCam) => ({ x: c.x, y: c.y, k: c.k * WALL_F });

// --- the room's layout (wide px) ---------------------------------------------------------------------------------
export const ROOM = {
  /** the wall meets the skirting / the floor (wide px) */
  skirtTop: 1262,
  floorTop: 1292,
  /** the floor line under the desks, chairs and people (floor plane, world px) */
  floorY: 1400,
  /** golden windows along the top of the wall (wide px) */
  windows: [
    { x0: 214, x1: 414, y0: 160, y1: 372 },
    { x0: 464, x1: 664, y0: 160, y1: 372 },
  ],
  /** the door at the right edge and its EXIT sign above it (wide px) */
  door: { x0: 893, x1: 1032, y0: 546, y1: 1292 },
  sign: { cx: 962, y0: 440, h: 74, w: 154, px: 54 },
} as const;

// --- the stage ---------------------------------------------------------------------------------------------------
export const OfficeStage: React.FC<{ S: number; cam: OfficeCam; children?: React.ReactNode }> = ({ S, cam, children }) => {
  const uid = uidOf(useId());
  const kw = cam.k * WALL_F;
  const [, wSkirt] = wallPt(0, ROOM.skirtTop);
  const [, wFloor] = wallPt(0, ROOM.floorTop);
  const floorScreenY = toScreen(cam, 0, wFloor, WALL_F)[1];
  // the wall spans the whole frame at any zoom: world x range on the wall plane
  const wx0 = cam.x - 600 / kw;
  const wx1 = cam.x + 600 / kw;
  const wy0 = cam.y - 1000 / kw;
  // the light patch: a soft window-light pool drifting slowly right across the wall
  const [lpx, lpy] = wallPt(300 + S * 0.7, 1010);
  return (
    <AbsoluteFill style={{ backgroundColor: OFFICE.wallTop, overflow: "hidden" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id={`${uid}wall`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(wallPt(0, 0)[1])} x2="0" y2={f3(wSkirt)}>
            <stop offset="0" stopColor={OFFICE.wallTop} />
            <stop offset="0.55" stopColor={mixHex(OFFICE.wallTop, OFFICE.wallFoot, 0.4)} />
            <stop offset="1" stopColor={OFFICE.wallFoot} />
          </linearGradient>
          <linearGradient id={`${uid}floor`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(floorScreenY)} x2="0" y2={f3(floorScreenY + 700 * cam.k)}>
            <stop offset="0" stopColor={mixHex(OFFICE.floor, COLOR.shadow, 0.12)} />
            <stop offset="0.25" stopColor={OFFICE.floor} />
            <stop offset="1" stopColor={mixHex(OFFICE.floor, LIGHT, 0.06)} />
          </linearGradient>
          <radialGradient id={`${uid}lp`}>
            <stop offset="0" stopColor={OFFICE.lightPatch} stopOpacity={OFFICE.lightPatchOpacity} />
            <stop offset="0.55" stopColor={OFFICE.lightPatch} stopOpacity={OFFICE.lightPatchOpacity * 0.55} />
            <stop offset="1" stopColor={OFFICE.lightPatch} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* THE WALL PLANE */}
        <g transform={planeTf(cam, WALL_F)}>
          <rect x={f3(wx0)} y={f3(wy0)} width={f3(wx1 - wx0)} height={f3(wSkirt - wy0)} fill={`url(#${uid}wall)`} />
          <ellipse cx={f3(lpx)} cy={f3(lpy)} rx={f3(360 / WALL_F)} ry={f3(300 / WALL_F)} fill={`url(#${uid}lp)`} style={{ mixBlendMode: "screen" }} />
          {ROOM.windows.map((w, i) => (
            <OfficeWindow key={i} w={w} S={S} i={i} />
          ))}
          <Door />
          <rect x={f3(wx0)} y={f3(wSkirt)} width={f3(wx1 - wx0)} height={f3(wFloor - wSkirt)} fill={OFFICE.skirting} />
          <rect x={f3(wx0)} y={f3(wSkirt)} width={f3(wx1 - wx0)} height={f3(3 / WALL_F)} fill={topOf(OFFICE.skirting, 0.3)} />
          <ExitSign cam={cam} />
        </g>
        {/* THE FLOOR (from the wall's foot down past the frame) */}
        <rect x={-20} y={f3(floorScreenY)} width={1120} height={f3(Math.max(0, 1940 - floorScreenY))} fill={`url(#${uid}floor)`} />
        {/* THE FLOOR-PLANE WORLD: the windows' light falling across the floor first (two soft pane shapes, drifting) */}
        <g transform={planeTf(cam)}>
          <FloorLight S={S} />
          {children}
        </g>
      </svg>
      <AbsoluteFill style={{ background: VIGNETTE }} />
      <OfficeGrain S={S} />
    </AbsoluteFill>
  );
};

/** the window light on the floor (floor plane): two soft, sheared pane shapes thrown down-right from the windows,
 *  drifting slowly right with the sun (as the wall's light patch) */
const FloorLight: React.FC<{ S: number }> = ({ S }) => {
  const dx = S * 0.7;
  const y0 = ROOM.floorY - 30;
  const y1 = ROOM.floorY + 330;
  const pane = (x: number, w: number, key: string) => (
    <path
      key={key}
      d={`M${f3(x + dx)} ${f3(y0)}L${f3(x + w + dx)} ${f3(y0)}L${f3(x + w + 150 + dx)} ${f3(y1)}L${f3(x + 150 + dx)} ${f3(y1)}Z`}
      fill={OFFICE.lightPatch}
      opacity={OFFICE.lightPatchOpacity * 1.3}
      style={{ filter: "blur(22px)", mixBlendMode: "screen" }}
    />
  );
  return <g>{[pane(250, 190, "a"), pane(480, 190, "b")]}</g>;
};

/** a golden-hour window: a cream frame, the SKY gradient, a mullion, a slow sheen drifting across the panes */
const OfficeWindow: React.FC<{ w: { x0: number; x1: number; y0: number; y1: number }; S: number; i: number }> = ({ w, S, i }) => {
  const uid = uidOf(useId());
  const [x0, y0] = wallPt(w.x0, w.y0);
  const [x1, y1] = wallPt(w.x1, w.y1);
  const fr = 14 / WALL_F;
  const sheen = ((S * 1.4 + i * 170) % 520) - 140;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}s`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
          <stop offset="0" stopColor={SKY.mid} />
          <stop offset="0.45" stopColor={SKY.low} />
          <stop offset="0.8" stopColor={SKY.glow} />
          <stop offset="1" stopColor={SKY.haze} />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <rect x={f3(x0)} y={f3(y0)} width={f3(x1 - x0)} height={f3(y1 - y0)} />
        </clipPath>
      </defs>
      {/* the frame's one shadow on the wall (key light upper left) */}
      <rect x={f3(x0 - fr + 5)} y={f3(y0 - fr + 8)} width={f3(x1 - x0 + 2 * fr)} height={f3(y1 - y0 + 2 * fr)} rx={6} fill={COLOR.shadow} opacity={0.16} style={{ filter: "blur(6px)" }} />
      <rect x={f3(x0 - fr)} y={f3(y0 - fr)} width={f3(x1 - x0 + 2 * fr)} height={f3(y1 - y0 + 2 * fr)} rx={6} fill={mixHex(COLOR.cream, COLOR.creamFoot, 0.5)} />
      <rect x={f3(x0)} y={f3(y0)} width={f3(x1 - x0)} height={f3(y1 - y0)} fill={`url(#${uid}s)`} />
      <g clipPath={`url(#${uid}c)`}>
        {/* a far, soft cloud bank low in the glow */}
        <ellipse cx={f3(x0 + (x1 - x0) * (0.3 + 0.4 * hash(i + 3)) + S * 0.25)} cy={f3(y1 - (y1 - y0) * 0.28)} rx={f3((x1 - x0) * 0.5)} ry={f3((y1 - y0) * 0.07)} fill={SKY.cloudLo} opacity={0.6} style={{ filter: "blur(5px)" }} />
        <g transform={`translate(${f3(x0 + sheen / WALL_F)} ${f3(y0)}) skewX(-20)`}>
          <rect x={0} y={0} width={f3(60 / WALL_F)} height={f3(y1 - y0)} fill={LIGHT} opacity={0.14} />
        </g>
      </g>
      {/* mullion and transom */}
      <rect x={f3((x0 + x1) / 2 - fr / 2)} y={f3(y0)} width={f3(fr)} height={f3(y1 - y0)} fill={mixHex(COLOR.cream, COLOR.creamFoot, 0.5)} />
      <rect x={f3(x0)} y={f3(y0 + (y1 - y0) * 0.36 - fr / 2)} width={f3(x1 - x0)} height={f3(fr)} fill={mixHex(COLOR.cream, COLOR.creamFoot, 0.5)} />
      {/* the sill */}
      <rect x={f3(x0 - fr * 1.6)} y={f3(y1 + fr * 0.6)} width={f3(x1 - x0 + fr * 3.2)} height={f3(fr * 0.9)} rx={3} fill={COLOR.cream} />
    </g>
  );
};

/** the door (wall plane): a muted sage leaf in a cream casing, a push bar, a narrow vision panel */
export const DOOR_LEAF = "#8E946C";
const Door: React.FC = () => {
  const uid = uidOf(useId());
  const D = ROOM.door;
  const [x0, y0] = wallPt(D.x0, D.y0);
  const [x1, y1] = wallPt(D.x1, D.y1);
  const cas = 18 / WALL_F;
  const casing = mixHex(COLOR.cream, COLOR.creamFoot, 0.6);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}d`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
          <stop offset="0" stopColor={topOf(DOOR_LEAF, 0.16)} />
          <stop offset="1" stopColor={footOf(DOOR_LEAF, 0.16)} />
        </linearGradient>
      </defs>
      {/* the casing's one shadow */}
      <rect x={f3(x0 - cas + 5)} y={f3(y0 - cas + 8)} width={f3(x1 - x0 + 2 * cas)} height={f3(y1 - y0 + cas)} fill={COLOR.shadow} opacity={0.18} style={{ filter: "blur(6px)" }} />
      <rect x={f3(x0 - cas)} y={f3(y0 - cas)} width={f3(x1 - x0 + 2 * cas)} height={f3(y1 - y0 + cas)} rx={4} fill={casing} />
      <rect x={f3(x0)} y={f3(y0)} width={f3(x1 - x0)} height={f3(y1 - y0)} fill={`url(#${uid}d)`} />
      {/* the vision panel (the evening light beyond) */}
      <rect x={f3(x0 + (x1 - x0) * 0.2)} y={f3(y0 + 70 / WALL_F)} width={f3((x1 - x0) * 0.16)} height={f3(250 / WALL_F)} rx={5} fill={SKY.glow} />
      <rect x={f3(x0 + (x1 - x0) * 0.2)} y={f3(y0 + 70 / WALL_F)} width={f3((x1 - x0) * 0.16)} height={f3(250 / WALL_F)} rx={5} fill="none" stroke={casing} strokeWidth={6} />
      {/* the push bar */}
      <rect x={f3(x0 + 24 / WALL_F)} y={f3(y0 + 400 / WALL_F)} width={f3((x1 - x0) * 0.7)} height={f3(20 / WALL_F)} rx={f3(10 / WALL_F)} fill={casing} />
      <rect x={f3(x0 + 24 / WALL_F)} y={f3(y0 + 400 / WALL_F)} width={f3((x1 - x0) * 0.7)} height={f3(5 / WALL_F)} rx={3} fill={LIGHT} opacity={0.6} />
    </g>
  );
};

/** THE EXIT SIGN (wall plane): an amber box (the stout band, 2 px hot top edge, the kit's fixed bloom), EXIT in ink caps */
export const ExitSign: React.FC<{ cam: OfficeCam }> = ({ cam }) => {
  const uid = uidOf(useId());
  const G = ROOM.sign;
  const [x0, y0] = wallPt(G.cx - G.w / 2, G.y0);
  const [x1, y1] = wallPt(G.cx + G.w / 2, G.y0 + G.h);
  const kw = cam.k * WALL_F;
  const band = amberBandFor(wallCam(cam));
  const px = G.px / WALL_F;
  const tw = labelWidth("EXIT", px);
  const r = 7 / WALL_F;
  const d = `M${f3(x0 + r)} ${f3(y0)}H${f3(x1 - r)}Q${f3(x1)} ${f3(y0)} ${f3(x1)} ${f3(y0 + r)}V${f3(y1 - r)}Q${f3(x1)} ${f3(y1)} ${f3(x1 - r)} ${f3(y1)}H${f3(x0 + r)}Q${f3(x0)} ${f3(y1)} ${f3(x0)} ${f3(y1 - r)}V${f3(y0 + r)}Q${f3(x0)} ${f3(y0)} ${f3(x0 + r)} ${f3(y0)}Z`;
  const cx = (x0 + x1) / 2;
  const base = (y0 + y1) / 2 + (METRIC.cap * px) / 2;
  return (
    <g>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
      </defs>
      {/* two short brackets to the wall above it */}
      {[0.22, 0.78].map((t) => (
        <rect key={t} x={f3(x0 + (x1 - x0) * t - 5 / WALL_F)} y={f3(y0 - 22 / WALL_F)} width={f3(10 / WALL_F)} height={f3(24 / WALL_F)} fill={mixHex(OFFICE.skirting, LIGHT, 0.15)} />
      ))}
      {/* its one shadow on the wall */}
      <path d={d} fill={COLOR.shadow} opacity={0.3} transform={`translate(${f3(4 / WALL_F)} ${f3(8 / WALL_F)})`} style={{ filter: `blur(${f3(5 / WALL_F)}px)` }} />
      <path d={d} fill={`url(#${uid}a)`} style={{ filter: bloomFilter(kw) }} />
      <path d={`M${f3(x0 + r)} ${f3(y0 + EDGE.HOT / kw / 2)}H${f3(x1 - r)}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / kw)} />
      <text
        x={f3(cx - tw / 2)}
        y={f3(base)}
        fontFamily={FONT_LABEL}
        fontWeight={500}
        fontSize={f3(px)}
        letterSpacing={f3(TRACK.label * px)}
        fill={COLOR.inkDark}
      >
        EXIT
      </text>
    </g>
  );
};

// --- furniture (floor plane, world px) -------------------------------------------------------------------------------
export const WOOD = "#C9A983";
export const WOOD_EDGE = "#A9875F";
export const METAL = "#8C7A68";
/** office chairs: a muted, dark terracotta (never the manager's blue-grey suit) */
export const CHAIR = "#8C5B45";

/** a desk: top slab x0..x1 at `top` (its face toward us), two panel legs down to the floor, a modesty panel */
export const Desk: React.FC<{ x0: number; x1: number; top: number; floor: number }> = ({ x0, x1, top, floor }) => {
  const uid = uidOf(useId());
  const th = 30;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}l`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(top)} x2="0" y2={f3(floor)}>
          <stop offset="0" stopColor={mixHex(WOOD_EDGE, COLOR.shadow, 0.1)} />
          <stop offset="1" stopColor={mixHex(WOOD_EDGE, COLOR.shadow, 0.3)} />
        </linearGradient>
      </defs>
      {/* the modesty panel at the back */}
      <rect x={f3(x0 + 40)} y={f3(top + th)} width={f3(x1 - x0 - 80)} height={f3((floor - top) * 0.42)} fill={mixHex(WOOD_EDGE, OFFICE.wallFoot, 0.5)} />
      {/* panel legs */}
      <rect x={f3(x0 + 14)} y={f3(top + th - 2)} width={22} height={f3(floor - top - th + 2)} fill={`url(#${uid}l)`} />
      <rect x={f3(x1 - 36)} y={f3(top + th - 2)} width={22} height={f3(floor - top - th + 2)} fill={`url(#${uid}l)`} />
      {/* the top: lit surface edge, the face */}
      <rect x={f3(x0)} y={f3(top)} width={f3(x1 - x0)} height={th} rx={5} fill={WOOD} />
      <rect x={f3(x0)} y={f3(top + th * 0.42)} width={f3(x1 - x0)} height={f3(th * 0.58)} rx={4} fill={mixHex(WOOD, WOOD_EDGE, 0.55)} />
      <rect x={f3(x0 + 4)} y={f3(top)} width={f3(x1 - x0 - 8)} height={4} rx={2} fill={topOf(WOOD, 0.45)} />
    </g>
  );
};

/** a soft contact shadow on the floor (one per object group) */
export const FloorShadow: React.FC<{ x0: number; x1: number; y: number; a?: number }> = ({ x0, x1, y, a = 0.3 }) => (
  <ellipse cx={f3((x0 + x1) / 2 + 10)} cy={f3(y + 2)} rx={f3((x1 - x0) / 2)} ry={14} fill={COLOR.shadow} opacity={a} style={{ filter: "blur(9px)" }} />
);

/** a monitor in three-quarter view on its stand. `face` 1 = its screen turned to the right (we see the screen, with
 *  `line` drawn on it), -1 = turned to the left (we see its back) */
export const Monitor: React.FC<{ x: number; top: number; face: 1 | -1; w?: number; h?: number; line?: "flat" }> = ({ x, top, face, w = 104, h = 134, line }) => {
  const uid = uidOf(useId());
  const yb = top - 64; // the screen's bottom edge
  const skew = face * 6;
  const back = mixHex(METAL, COLOR.shadow, 0.12);
  const scr: P2[] = [
    [x - w / 2, yb - h + skew],
    [x + w / 2, yb - h - skew],
    [x + w / 2, yb - skew],
    [x - w / 2, yb + skew],
  ];
  const pts = (p: P2[]) => p.map((q, i) => `${i ? "L" : "M"}${f3(q[0])} ${f3(q[1])}`).join("") + "Z";
  const inset = (p: P2[], a: number): P2[] => [
    [p[0][0] + a, p[0][1] + a],
    [p[1][0] - a, p[1][1] + a],
    [p[2][0] - a, p[2][1] - a],
    [p[3][0] + a, p[3][1] - a],
  ];
  const s = inset(scr, 9);
  const sx0 = s[0][0];
  const sx1 = s[1][0];
  const yAt = (t: number, v: number) => {
    // a point on the screen face: t across (0..1), v down (0..1)
    const yt = s[0][1] + (s[1][1] - s[0][1]) * t;
    const yb2 = s[3][1] + (s[2][1] - s[3][1]) * t;
    return yt + (yb2 - yt) * v;
  };
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}s`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(yb - h)} x2="0" y2={f3(yb)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      {/* stand: neck + foot */}
      <rect x={f3(x - 9)} y={f3(yb - 10)} width={18} height={f3(top - yb + 10)} fill={back} />
      <rect x={f3(x - 40)} y={f3(top - 9)} width={80} height={10} rx={4} fill={METAL} />
      <path d={pts(scr)} fill={face === 1 ? mixHex(METAL, COLOR.shadow, 0.25) : back} />
      <path d={`M${f3(scr[0][0] + 4)} ${f3(scr[0][1] + 2)}L${f3(scr[1][0] - 4)} ${f3(scr[1][1] + 2)}`} stroke={topOf(METAL, 0.35)} strokeWidth={3} strokeLinecap="round" />
      {face === 1 ? (
        <g>
          <path d={pts(s)} fill={`url(#${uid}s)`} />
          {line === "flat" ? (
            <path
              d={`M${f3(sx0 + 8)} ${f3(yAt(0.06, 0.28))}Q${f3(sx0 + (sx1 - sx0) * 0.3)} ${f3(yAt(0.3, 0.3))} ${f3(sx0 + (sx1 - sx0) * 0.48)} ${f3(yAt(0.48, 0.66))}Q${f3(sx0 + (sx1 - sx0) * 0.55)} ${f3(yAt(0.55, 0.74))} ${f3(sx0 + (sx1 - sx0) * 0.66)} ${f3(yAt(0.66, 0.74))}L${f3(sx1 - 8)} ${f3(yAt(0.94, 0.74))}`}
              stroke={COLOR.inkDark}
              strokeWidth={4.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ) : null}
        </g>
      ) : null}
    </g>
  );
};

/** a laptop on the desk, for a user sitting to its LEFT: the base from x0 to the hinge at x1, the lid rising from the
 *  hinge and leaning back (away from her); its screen side (toward her) lit cream */
export const Laptop: React.FC<{ x0: number; x1: number; top: number; lid?: number }> = ({ x0, x1, top, lid = 104 }) => {
  const th = 11;
  const L = 112;
  const a = (lid * Math.PI) / 180;
  const d: P2 = [-Math.cos(a), -Math.sin(a)]; // from the hinge: up, leaning right for lid > 90
  const n: P2 = [d[1], -d[0]]; // toward the user (left)
  const h: P2 = [x1, top - 9];
  const tip: P2 = [h[0] + d[0] * L, h[1] + d[1] * L];
  const quad = [h, tip, [tip[0] - n[0] * th, tip[1] - n[1] * th], [h[0] - n[0] * th, h[1] - n[1] * th]] as P2[];
  return (
    <g>
      <rect x={f3(x0)} y={f3(top - 10)} width={f3(x1 - x0)} height={10} rx={3} fill={mixHex(METAL, COLOR.cream, 0.35)} />
      <rect x={f3(x0 + 3)} y={f3(top - 10)} width={f3(x1 - x0 - 6)} height={3} rx={1.5} fill={COLOR.cream} opacity={0.7} />
      <path d={quad.map((q, i) => `${i ? "L" : "M"}${f3(q[0])} ${f3(q[1])}`).join("") + "Z"} fill={mixHex(METAL, COLOR.shadow, 0.05)} />
      {/* the screen face (toward her), a lit cream edge */}
      <path d={`M${f3(h[0] + n[0] * 2 + d[0] * 8)} ${f3(h[1] + n[1] * 2 + d[1] * 8)}L${f3(tip[0] + n[0] * 2 - d[0] * 5)} ${f3(tip[1] + n[1] * 2 - d[1] * 5)}`} stroke={COLOR.cream} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

/** a keyboard: a low slab on the desk top */
export const Keyboard: React.FC<{ x0: number; x1: number; top: number }> = ({ x0, x1, top }) => (
  <g>
    <rect x={f3(x0)} y={f3(top - 12)} width={f3(x1 - x0)} height={12} rx={4} fill={mixHex(COLOR.cream, METAL, 0.45)} />
    <rect x={f3(x0 + 3)} y={f3(top - 12)} width={f3(x1 - x0 - 6)} height={3} rx={1.5} fill={COLOR.cream} />
  </g>
);

/** an office chair, hip-local (the sitter faces LEFT; the hip at 0,0 where the cushion meets the back), `floor` = the
 *  floor's y below the hip */
export const OfficeChair: React.FC<{ floor: number }> = ({ floor }) => {
  const uid = uidOf(useId());
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1="-230" x2="0" y2="30">
          <stop offset="0" stopColor={topOf(CHAIR, 0.14)} />
          <stop offset="1" stopColor={footOf(CHAIR, 0.12)} />
        </linearGradient>
      </defs>
      {/* the gas column and the five-star base (seen side on: a bar, three casters) */}
      <rect x={-60} y={24} width={18} height={f3(floor - 58)} fill={METAL} />
      <rect x={-150} y={f3(floor - 40)} width={200} height={14} rx={7} fill={mixHex(METAL, COLOR.shadow, 0.2)} />
      {[-142, -51, 40].map((cx) => (
        <circle key={cx} cx={cx} cy={f3(floor - 13)} r={13} fill={mixHex(CHAIR, COLOR.shadow, 0.3)} />
      ))}
      {/* the back on its post */}
      <rect x={16} y={-100} width={12} height={120} rx={5} fill={METAL} />
      <path d="M6 -176C6 -188 14 -194 26 -194L32 -194C42 -194 48 -186 46 -176L40 -104C38 -94 32 -90 24 -90L20 -90C12 -90 6 -96 6 -106Z" fill={`url(#${uid}c)`} />
      {/* the seat cushion */}
      <path d="M-172 4C-172 -6 -164 -10 -154 -10L22 -10C34 -10 40 -2 40 8L40 20C40 28 34 32 26 32L-160 32C-168 32 -172 26 -172 18Z" fill={`url(#${uid}c)`} />
      <path d="M-162 -8L28 -8" stroke={topOf(CHAIR, 0.3)} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

/** the kit's grain on twos (as trackWorld's) */
const OfficeGrain: React.FC<{ S: number }> = ({ S }) => {
  const g2 = GRAIN.onTwos ? Math.floor(S / 2) : S;
  const grx = (hash(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash(g2 + 7) * 2 - 1) * GRAIN.travel;
  return (
    <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
      <Img src={staticFile(GROUND.grain)} style={{ position: "absolute", left: (1080 - GROUND.W) / 2 + grx, top: (1920 - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }} />
    </AbsoluteFill>
  );
};
