// ---------------------------------------------------------------------------
// cabinParts — the cutaway United cabin of TryUsStayForTech (scott-free-wifi, cut 13): seats with their seatback
// screens (dark glass .. United's amber with its globe), armrests, the radome on the crown and the cream Starlink link
// pouring into it. Stout card materials lit by the one key light (upper left); amber is the only glow, cream is
// Starlink's light. World px at the cabin layer, y down, the cabin floor at y 0, the nose to the LEFT.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { COLOR, mixHex } from "../kits/cheeky-pint/stoutShared";
import { MARKS } from "../scott-aircraft-order/airlineMarks";

type P2 = [number, number];
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const uidOf = (raw: string) => `cp${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// ---------------------------------------------------------------------------
// MATERIALS
// ---------------------------------------------------------------------------
export const CAB = {
  fabric: "#9C7A5C",
  fabricFoot: "#86664B",
  shell: "#B5967A",
  shellHi: "#CDB497",
  frame: "#5A402F",
  cover: "#E3D4BC",
  glassOff: "#3E2D22",
  glassOffHi: "#5A4434",
  bezel: "#4B382B",
} as const;

// ---------------------------------------------------------------------------
// THE SEAT (seat-local: origin = the seat back's front edge at floor level; the passenger's hip is at (-18, -192))
// ---------------------------------------------------------------------------
export const SEAT = {
  hip: [-18, -192] as P2,
  /** the seat back's rear edge: x at height y (it leans back to the right) */
  rearX: (y: number) => 82 + (y + 160) * -0.1676,
  slope: 0.1676,
  /** the screen: bottom-left corner on the rear edge, width, height (a tile mounted on the seat back's shell) */
  screen: { y0: -326, w: 128, h: 90 },
  tray: { y: -290, x0: 92, x1: 262 },
} as const;
const SEAT_BACK_D =
  "M14 -150L74 -500C78 -520 96 -530 118 -530C138 -530 150 -520 146 -500L84 -150Z";
const CUSHION_D =
  "M-236 -168C-236 -194 -224 -202 -204 -202L10 -202C24 -202 30 -192 30 -178L30 -152C30 -144 24 -140 16 -140L-226 -140C-232 -140 -236 -146 -236 -152Z";
const BASE_D =
  "M-196 -140L-176 -140L-160 0L-180 0Z M-24 -140L-4 -140L-16 0L-36 0Z M-200 -134L10 -134L10 -116L-200 -116Z";
const ARMREST_D =
  "M-164 -300C-172 -300 -176 -294 -176 -288C-176 -282 -172 -276 -164 -276L22 -276C30 -276 34 -282 34 -288C34 -294 30 -300 22 -300Z M-8 -280L12 -280L14 -196L-6 -196Z";
const SHELL_D =
  "M84 -150L146 -500C150 -520 138 -530 118 -530L126 -528C140 -524 146 -514 144 -500L82 -150Z";

/** the seat body (back, cushion, base, headrest cover): drawn BEHIND its passenger */
export const SeatBody: React.FC<{ x: number }> = ({ x }) => {
  const uid = uidOf(useId());
  return (
    <g transform={`translate(${f3(x)} 0)`}>
      <defs>
        <linearGradient
          id={`${uid}f`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="-530"
          x2="0"
          y2="-140"
        >
          <stop offset="0" stopColor={mixHex(CAB.fabric, "#FFF0DC", 0.08)} />
          <stop offset="1" stopColor={CAB.fabricFoot} />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <path d={SEAT_BACK_D} />
        </clipPath>
      </defs>
      <path d={BASE_D} fill={CAB.frame} />
      <path d={SEAT_BACK_D} fill={`url(#${uid}f)`} />
      {/* the rear shell: a lighter plastic edge down the back (the screen's mount) */}
      <g clipPath={`url(#${uid}c)`}>
        <path
          d={`M${f3(SEAT.rearX(-150) - 16)} -150L${f3(SEAT.rearX(-540) - 16)} -540L200 -540L200 -150Z`}
          fill={CAB.shell}
        />
        {/* the headrest cover over the top */}
        <path d="M0 -452L200 -470L200 -560L0 -560Z" fill={CAB.cover} />
        <path
          d="M0 -452L200 -470L200 -462L0 -444Z"
          fill={mixHex(CAB.cover, COLOR.shadow, 0.18)}
        />
      </g>
      <path d={CUSHION_D} fill={`url(#${uid}f)`} />
      <path
        d="M-226 -200L16 -200"
        stroke={mixHex(CAB.fabric, "#FFF0DC", 0.18)}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path d={SHELL_D} fill="none" />
    </g>
  );
};

/** the armrest on the near side: drawn OVER its passenger's body, under the near arm */
export const Armrest: React.FC<{ x: number }> = ({ x }) => (
  <g transform={`translate(${f3(x)} 0)`}>
    <path d={ARMREST_D} fill={CAB.shell} />
    <path
      d="M-170 -297L28 -297"
      stroke={CAB.shellHi}
      strokeWidth={3}
      strokeLinecap="round"
    />
  </g>
);

// ---------------------------------------------------------------------------
// THE SEATBACK SCREEN — a tile on the seat back's shell, facing the passenger behind, sheared to the shell's lean.
// `on` 0 = dark glass .. 1 = United's amber with its globe (the tail crop: the field amber, the globe stamped in ink).
// The amber is the stout band (top -> foot), a 2 px hot top edge, the fixed bloom (never a pulse).
// ---------------------------------------------------------------------------
const UNITED = MARKS.united;
/** the screen tile's outline (cabin layer), grown by `pad`: lets the window light leave the amber untouched */
export const screenTilePath = (x: number, pad = 4) => {
  const { y0, w, h } = SEAT.screen;
  const s = SEAT.slope;
  const bx = x + SEAT.rearX(y0) + 2;
  const P = (u: number, v: number) =>
    `${f3(bx + u + s * (h - v))} ${f3(y0 - h + v)}`;
  return `M${P(-pad, -pad)}L${P(w + pad, -pad)}L${P(w + pad, h + pad)}L${P(-pad, h + pad)}Z`;
};
export const ScreenTile: React.FC<{ x: number; on: number; k: number }> = ({
  x,
  on,
  k,
}) => {
  const uid = uidOf(useId());
  const { y0, w, h } = SEAT.screen;
  const s = SEAT.slope;
  const bx = SEAT.rearX(y0) + 2;
  // tile-local (u right, v down, 0..w x 0..h) -> seat-local; the left edge follows the shell's lean
  const tf = `matrix(1 0 ${f3(-s)} 1 ${f3(x + bx + s * h)} ${f3(y0 - h)})`;
  const o = c01(on);
  const inset = 7;
  const gw = w - 2 * inset;
  const gh = h - 2 * inset;
  // the globe crop: a square of side gh*0.98, centred
  const side = gh * 0.98;
  const gx = inset + (gw - side) / 2;
  const gy = inset + (gh - side) / 2;
  const bloom = [
    { blur: 7, a: 0.36 },
    { blur: 24, a: 0.2 },
    { blur: 60, a: 0.06 },
  ]
    .map(
      (l) =>
        `drop-shadow(0 0 ${f3(l.blur / k)}px rgba(255,170,30,${f3(l.a * o)}))`,
    )
    .join(" ");
  return (
    <g transform={tf}>
      <defs>
        <linearGradient
          id={`${uid}a`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={inset}
          x2="0"
          y2={inset + gh}
        >
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberFoot} />
        </linearGradient>
        <linearGradient
          id={`${uid}o`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={inset}
          x2={gw}
          y2={inset + gh}
        >
          <stop offset="0" stopColor={CAB.glassOffHi} />
          <stop offset="0.45" stopColor={CAB.glassOff} />
          <stop offset="1" stopColor={CAB.glassOff} />
        </linearGradient>
        <linearGradient
          id={`${uid}b`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={f3(((inset - gy) * 24) / side)}
          x2="0"
          y2={f3(((inset + gh - gy) * 24) / side)}
        >
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberFoot} />
        </linearGradient>
        <clipPath id={`${uid}g`}>
          <rect x={inset} y={inset} width={gw} height={gh} rx={4} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={w} height={h} rx={9} fill={CAB.bezel} />
      <rect
        x={inset}
        y={inset}
        width={gw}
        height={gh}
        rx={4}
        fill={`url(#${uid}o)`}
      />
      {o > 0.002 ? (
        <g style={{ filter: bloom }} opacity={o}>
          <g clipPath={`url(#${uid}g)`}>
            <rect
              x={inset}
              y={inset}
              width={gw}
              height={gh}
              fill={`url(#${uid}a)`}
            />
            <g
              transform={`translate(${f3(gx)} ${f3(gy)}) scale(${f3(side / 24)})`}
            >
              <rect
                x={0.02}
                y={0.25}
                width={23.6}
                height={23.73}
                fill={COLOR.inkDark}
              />
              {UNITED.paths.map((p, i) => (
                <path
                  key={i}
                  d={p.d}
                  transform={`matrix(${p.m.join(" ")})`}
                  fill={`url(#${uid}b)`}
                />
              ))}
            </g>
            {/* the hot top edge */}
            <rect
              x={inset}
              y={inset}
              width={gw}
              height={2}
              fill={COLOR.amberHot}
            />
          </g>
        </g>
      ) : null}
    </g>
  );
};

// ===================================================================================================================
// THE CABIN WORLD — layers at depth (a paper theatre under one pinhole: nearer layers slide faster on a pan)
// ===================================================================================================================
/** the row pitch (cabin px between seat backs); row r's seat back stands at r * ROW_PITCH */
export const ROW_PITCH = 390;
export const CABIN = {
  /** the crown: its top (the skin), the skin's underside, the cut face's lower edge (the cabin's ceiling line) */
  crownTop: -830,
  skinB: -814,
  crownB: -770,
  /** the floor's cut face and the belly below it */
  floorT: -6,
  floorB: 40,
  bellyLine: 110,
  bellyB: 240,
  /** the cutaway: forward edge, aft edge (hull layer), corner radius; rows 0..8 sit inside it */
  xOpen: -450,
  xOpenEnd: 8 * ROW_PITCH + 300,
  openR: 56,
  /** the jet: nose tip, tail cone tip (hull layer, nose LEFT) */
  xNose: -4400,
  xTail: 7300,
  /** the near wing's root (x) */
  xWing: 600,
  /** the Starlink radome on the crown: centre x, length, height */
  XR: -640,
  radomeLen: 560,
  radomeH: 60,
  /** the satellite the link comes from (hull layer, drawn high over the crown: an honest cheat, as in wifiSky) */
  satY: -830 - 7400,
  /** the bulkhead (where the seat ahead of row 0 would stand); the galley is forward of it */
  XB: -ROW_PITCH,
  xMin: -4000,
  xMax: 8000,
  /** far-wall windows: centre height, size */
  winY: -488,
  winW: 80,
  winH: 128,
} as const;
/** layer depths (px) and the camera's distance to the cabin layer: s(Z) = k * D / (D + Z) */
export const LAYER = {
  hull: -380,
  mid: 0,
  bins: 90,
  far: 260,
  D: 5200,
} as const;
export const layerScale = (k: number, Z: number) => (k * LAYER.D) / (LAYER.D + Z);
export type LayerCam = { x: number; y: number; k: number };
/** the SVG transform of a layer at depth Z under the camera (its world px -> screen px) */
export const layerTf = (c: LayerCam, Z: number) => {
  const s = layerScale(c.k, Z);
  return `translate(${f3(540 - s * c.x)} ${f3(960 - s * c.y)}) scale(${f3(s)})`;
};
/** a point of layer Za seen at the same screen spot on layer Zb (world px) */
export const reLayer = (c: LayerCam, p: P2, Za: number, Zb: number): P2 => {
  const r = layerScale(c.k, Za) / layerScale(c.k, Zb);
  return [c.x + (p[0] - c.x) * r, c.y + (p[1] - c.y) * r];
};

const HULL_COL = {
  belly: "#8E8B83",
  bellyFoot: "#7D7A73",
  cut: "#A08066",
  cutDeep: "#8A6B53",
  cutEdge: "#D9C6AA",
  window: "#4A3629",
  wing: "#E4D8C3",
  wingFoot: "#B9A78C",
  nacelle: "#E8DECB",
  nacelleFoot: "#C2B39A",
} as const;

const roundRect = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${f3(x0 + r)} ${f3(y0)}L${f3(x1 - r)} ${f3(y0)}Q${f3(x1)} ${f3(y0)} ${f3(x1)} ${f3(y0 + r)}L${f3(x1)} ${f3(y1 - r)}Q${f3(x1)} ${f3(y1)} ${f3(x1 - r)} ${f3(y1)}` +
  `L${f3(x0 + r)} ${f3(y1)}Q${f3(x0)} ${f3(y1)} ${f3(x0)} ${f3(y1 - r)}L${f3(x0)} ${f3(y0 + r)}Q${f3(x0)} ${f3(y0)} ${f3(x0 + r)} ${f3(y0)}Z`;

/** the cutaway's opening (hull layer), grown by `pad` under the cut face: the interior layers are clipped to it */
export const openingPath = (pad = 12) =>
  roundRect(CABIN.xOpen - pad, CABIN.crownB - pad, CABIN.xOpenEnd + pad, CABIN.floorT + pad, CABIN.openR + pad);

/** the fuselage outline (hull layer): a rounded nose on the left, the tail cone sweeping up on the right */
const fuselageD = () => {
  const C = CABIN;
  const N = C.xNose;
  const T = C.xTail;
  return (
    `M${N + 1000} ${C.crownTop}L${T - 1900} ${C.crownTop}C${T - 1100} ${C.crownTop} ${T - 300} -720 ${T} -650L${T} -560` +
    `C${T - 500} -470 ${T - 1800} ${C.bellyB} ${T - 3200} ${C.bellyB}L${N + 1000} ${C.bellyB}` +
    `C${N + 300} ${C.bellyB} ${N} 20 ${N} -250C${N} -560 ${N + 380} ${C.crownTop} ${N + 1000} ${C.crownTop}Z`
  );
};
/** the amber fin (United): root along the crown at the tail, swept back */
const finD = () => {
  const T = CABIN.xTail;
  const top = CABIN.crownTop - 2150;
  return `M${T - 3000} ${CABIN.crownTop + 2}L${T - 1350} ${top}L${T - 520} ${top}L${T - 200} -690L${T - 900} ${CABIN.crownTop + 2}Z`;
};
const UNITED_MARK = MARKS.united;

/** THE JET (hull layer): United's airliner seen side-on, nose LEFT: cream fuselage, warm-slate belly, windows and
 *  doors, the cockpit glazing, the amber fin with United's globe (the tail crop, as on the clip's fins), the near wing
 *  and its engine, the tailplane; its near wall cut away from the crown to the floor over rows 0-8. The cut face shows
 *  as a board band all round the opening. `k` = the hull layer's screen scale (for the fin's bloom). */
export const Hull: React.FC<{ k?: number }> = ({ k = 1 }) => {
  const uid = uidOf(useId());
  const C = CABIN;
  const T = 40; // the cut face's width
  const fus = fuselageD();
  const hole = roundRect(C.xOpen, C.crownB, C.xOpenEnd, C.floorT, C.openR);
  const cutOuter = roundRect(C.xOpen - T, C.skinB, C.xOpenEnd + T, C.floorB, C.openR + T);
  const cutMid = roundRect(C.xOpen - T * 0.45, C.skinB + 12, C.xOpenEnd + T * 0.45, C.floorB - 12, C.openR + T * 0.45);
  const DOORS = [C.xNose + 1350, C.xOpenEnd + 700, C.xTail - 3500];
  const DW = 124;
  const wins: number[] = [];
  for (let x = C.xNose + 1150; x < C.xTail - 3300; x += 150) {
    if (x > C.xOpen - 90 && x < C.xOpenEnd + 90) continue;
    if (DOORS.some((d) => Math.abs(x - d) < DW / 2 + 40)) continue;
    wins.push(x);
  }
  // the fin and its globe: the tail crop square, its lower-right corner on the fin's root trailing edge
  const finTop = C.crownTop - 2150;
  const finH = -690 - finTop;
  const side = finH * 1.18;
  const gx1 = C.xTail - 200;
  const gy1 = -690;
  const toU = (y: number) => ((y - (gy1 - side)) * 24) / side;
  const W0 = C.xWing;
  const nac = { x0: W0 + 60, x1: W0 + 1420, cy: 470, h: 400 };
  const bloom = [
    { blur: 7, a: 0.36 },
    { blur: 24, a: 0.2 },
    { blur: 60, a: 0.06 },
  ]
    .map((l) => `drop-shadow(0 0 ${f3(l.blur / k)}px rgba(255,170,30,${l.a}))`)
    .join(" ");
  return (
    <g>
      <defs>
        {/* the tube under the key light: a bright band just under the crown, darkening toward the belly */}
        <linearGradient id={`${uid}s`} gradientUnits="userSpaceOnUse" x1="0" y1={C.crownTop} x2="0" y2={C.bellyLine}>
          <stop offset="0" stopColor="#EFE5D3" />
          <stop offset="0.1" stopColor="#F8F2E7" />
          <stop offset="0.55" stopColor="#EADFCB" />
          <stop offset="1" stopColor="#D2C3AA" />
        </linearGradient>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={C.bellyLine} x2="0" y2={C.bellyB}>
          <stop offset="0" stopColor={HULL_COL.belly} />
          <stop offset="1" stopColor={HULL_COL.bellyFoot} />
        </linearGradient>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={finTop} x2="0" y2={C.crownTop}>
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberFoot} />
        </linearGradient>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(toU(finTop))} x2="0" y2={f3(toU(C.crownTop))}>
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberFoot} />
        </linearGradient>
        <linearGradient id={`${uid}w`} gradientUnits="userSpaceOnUse" x1="0" y1="-40" x2="0" y2="250">
          <stop offset="0" stopColor={HULL_COL.wing} />
          <stop offset="1" stopColor={HULL_COL.wingFoot} />
        </linearGradient>
        <linearGradient id={`${uid}n`} gradientUnits="userSpaceOnUse" x1="0" y1={nac.cy - nac.h / 2} x2="0" y2={nac.cy + nac.h / 2}>
          <stop offset="0" stopColor={HULL_COL.nacelle} />
          <stop offset="1" stopColor={HULL_COL.nacelleFoot} />
        </linearGradient>
        <clipPath id={`${uid}h`}>
          <path d={fus + hole} clipRule="evenodd" />
        </clipPath>
        <clipPath id={`${uid}f`}>
          <path d={finD()} />
        </clipPath>
      </defs>
      {/* the fin, behind the fuselage's crown */}
      <g style={{ filter: bloom }}>
        <path d={finD()} fill={`url(#${uid}a)`} />
        <g clipPath={`url(#${uid}f)`}>
          <g transform={`translate(${f3(gx1 - side)} ${f3(gy1 - side)}) scale(${f3(side / 24)})`}>
            <rect x={0.02} y={0.25} width={23.6} height={23.73} fill={COLOR.inkDark} />
            {UNITED_MARK.paths.map((pp, i) => (
              <path key={i} d={pp.d} transform={`matrix(${pp.m.join(" ")})`} fill={`url(#${uid}g)`} />
            ))}
          </g>
        </g>
        <path d={`M${C.xTail - 3000} ${C.crownTop}L${C.xTail - 1350} ${finTop}L${C.xTail - 520} ${finTop}`} stroke={COLOR.amberHot} strokeWidth={14} fill="none" strokeLinejoin="round" />
      </g>
      <path d={fus + hole} fillRule="evenodd" fill={`url(#${uid}s)`} />
      <g clipPath={`url(#${uid}h)`}>
        <rect x={C.xMin - 2000} y={C.bellyLine} width={C.xMax - C.xMin + 4000} height={C.bellyB - C.bellyLine + 400} fill={`url(#${uid}b)`} />
        {/* the cut face round the opening */}
        <path d={cutOuter + hole} fillRule="evenodd" fill={HULL_COL.cut} />
        <path d={cutMid + hole} fillRule="evenodd" fill={HULL_COL.cutDeep} />
        {/* the crown's lit top edge */}
        <rect x={C.xMin - 2000} y={C.crownTop} width={C.xMax - C.xMin + 4000} height={3} fill="#FFFAF1" />
        {/* the windows on the intact skin, the doors, the cockpit glazing */}
        {wins.map((x) => (
          <g key={x}>
            <rect x={x - 23} y={CABIN.winY - 36} width={46} height={72} rx={21} fill={HULL_COL.window} />
            <rect x={x - 14} y={CABIN.winY - 27} width={8} height={26} rx={4} fill="#7A6455" />
          </g>
        ))}
        {DOORS.map((d) => (
          <g key={`d${d}`}>
            <rect x={d - DW / 2} y={-600} width={DW} height={576} rx={26} fill="none" stroke="#C9B89D" strokeWidth={3} />
            <rect x={d - 20} y={CABIN.winY - 30} width={40} height={60} rx={18} fill={HULL_COL.window} />
          </g>
        ))}
        <path
          d={`M${C.xNose + 360} -470L${C.xNose + 600} -520L${C.xNose + 820} -520L${C.xNose + 830} -440L${C.xNose + 330} -420Z`}
          fill={HULL_COL.window}
        />
        {/* the belly line: a thin warm rule where the cream meets United's slate */}
        <rect x={C.xMin - 2000} y={C.bellyLine - 3} width={C.xMax - C.xMin + 4000} height={3} fill="#BFAE93" />
      </g>
      {/* the floor's lit edge where the cabin floor meets the cut */}
      <rect x={C.xOpen + C.openR} y={C.floorT} width={C.xOpenEnd - C.xOpen - 2 * C.openR} height={3} fill={HULL_COL.cutEdge} />
      {/* the tailplane (near side) */}
      <path
        d={`M${C.xTail - 2350} -470L${C.xTail - 700} -800L${C.xTail - 420} -790L${C.xTail - 1500} -430Z`}
        fill={`url(#${uid}w)`}
      />
      {/* the near wing: a slim swept sliver below the floor, the raked tip turning up; its engine hung under it */}
      <path
        d={`M${W0} 175L${W0 + 3700} 30C${W0 + 3800} 26 ${W0 + 3870} 0 ${W0 + 3900} -60L${W0 + 3930} -50C${W0 + 3900} 30 ${W0 + 3850} 60 ${W0 + 3760} 66L${W0 + 1700} 240L${W0} 262Z`}
        fill={`url(#${uid}w)`}
      />
      <path d={`M${W0 + 520} 200L${W0 + 980} 190L${W0 + 1060} ${nac.cy - nac.h / 2 + 20}L${W0 + 440} ${nac.cy - nac.h / 2 + 20}Z`} fill={HULL_COL.wingFoot} />
      <path
        d={`M${nac.x0 + 160} ${nac.cy - nac.h / 2}L${nac.x1 - 260} ${nac.cy - nac.h / 2 + 30}C${nac.x1 - 80} ${nac.cy - nac.h / 2 + 50} ${nac.x1} ${nac.cy - 40} ${nac.x1} ${nac.cy}` +
          `C${nac.x1} ${nac.cy + 40} ${nac.x1 - 80} ${nac.cy + nac.h / 2 - 50} ${nac.x1 - 260} ${nac.cy + nac.h / 2 - 30}L${nac.x0 + 160} ${nac.cy + nac.h / 2}` +
          `C${nac.x0 + 40} ${nac.cy + nac.h / 2} ${nac.x0} ${nac.cy + 100} ${nac.x0} ${nac.cy}C${nac.x0} ${nac.cy - 100} ${nac.x0 + 40} ${nac.cy - nac.h / 2} ${nac.x0 + 160} ${nac.cy - nac.h / 2}Z`}
        fill={`url(#${uid}n)`}
      />
      <ellipse cx={nac.x0 + 40} cy={nac.cy} rx={50} ry={nac.h / 2 - 22} fill="#8C7A66" />
      <path d={`M${nac.x0 + 160} ${nac.cy - nac.h / 2 + 8}L${nac.x1 - 260} ${nac.cy - nac.h / 2 + 36}`} stroke="#FBF6EC" strokeWidth={8} strokeLinecap="round" />
    </g>
  );
};

/** THE SATELLITE (hull layer, high over the crown): a Starlink V2 Mini side-on in card style — a flat cream bus with
 *  its phased-array tiles underneath, two long solar wings of warm dark-brown cells in a cream frame */
export const Satellite: React.FC<{ x?: number; y?: number }> = ({ x = CABIN.XR + 20, y = CABIN.satY }) => {
  // the solar wings turned to face the sun (and us): two long panels of warm dark-brown cells in a cream frame
  const wing = (dir: -1 | 1) => {
    const x0 = dir < 0 ? x - 190 - 1150 : x + 190;
    const H = 380;
    const cells: React.ReactNode[] = [];
    for (let i = 1; i < 8; i++) cells.push(<rect key={`v${i}`} x={x0 + (i * 1150) / 8 - 3} y={y - H / 2} width={6} height={H} fill="#6A4A32" />);
    for (let j = 1; j < 3; j++) cells.push(<rect key={`h${j}`} x={x0} y={y - H / 2 + (j * H) / 3 - 3} width={1150} height={6} fill="#6A4A32" />);
    return (
      <g key={dir}>
        <rect x={dir < 0 ? x - 190 : x + 130} y={y - 12} width={60} height={24} fill="#CDBA9C" />
        <rect x={x0 - 12} y={y - H / 2 - 12} width={1174} height={H + 24} rx={8} fill="#E8DCC6" />
        <rect x={x0} y={y - H / 2} width={1150} height={H} fill="#3F2819" />
        {cells}
        <rect x={x0} y={y - H / 2} width={1150} height={10} fill="#8A6A4E" />
      </g>
    );
  };
  return (
    <g transform={`translate(${f3(x)} ${f3(y)}) scale(1.6) translate(${f3(-x)} ${f3(-y)})`}>
      {wing(-1)}
      {wing(1)}
      <rect x={x - 130} y={y - 60} width={260} height={110} rx={10} fill={COLOR.cream} />
      <rect x={x - 130} y={y - 60} width={260} height={8} rx={4} fill="#FFFFFF" />
      <rect x={x - 110} y={y + 50} width={220} height={22} rx={4} fill="#B6A386" />
    </g>
  );
};

/** THE RADOME (hull layer): Starlink's low flat fairing on the crown, cream card lit from the upper left */
export const Radome: React.FC<{ glow?: number }> = ({ glow = 0 }) => {
  const uid = uidOf(useId());
  const { XR, radomeLen: L, radomeH: h, crownTop: y } = CABIN;
  const x0 = XR - L / 2;
  const x1 = XR + L / 2;
  const d = `M${f3(x0)} ${y}C${f3(x0 + 70)} ${y} ${f3(x0 + 110)} ${f3(y - h)} ${f3(x0 + 190)} ${f3(y - h)}L${f3(x1 - 110)} ${f3(y - h)}C${f3(x1 - 40)} ${f3(y - h)} ${f3(x1 - 14)} ${f3(y - h * 0.5)} ${f3(x1)} ${y}Z`;
  return (
    <g>
      <defs>
        <linearGradient
          id={`${uid}r`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={f3(y - h)}
          x2="0"
          y2={y}
        >
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor="#FFF8EA" stopOpacity={f3(0.85 * glow)} />
          <stop offset="0.5" stopColor="#FFF8EA" stopOpacity={f3(0.3 * glow)} />
          <stop offset="1" stopColor="#FFF8EA" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d={`M${f3(x0 - 10)} ${y}L${f3(x1 + 10)} ${y}L${f3(x1 + 4)} ${y + 5}L${f3(x0 - 4)} ${y + 5}Z`}
        fill={mixHex(COLOR.creamFoot, COLOR.shadow, 0.22)}
        opacity={0.5}
      />
      <path d={d} fill={`url(#${uid}r)`} />
      <path
        d={`M${f3(x0 + 196)} ${f3(y - h + 2.5)}L${f3(x1 - 116)} ${f3(y - h + 2.5)}`}
        stroke="#FFFFFF"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.8}
      />
      {glow > 0.002 ? (
        <ellipse
          cx={XR + 20}
          cy={y - h}
          rx={130}
          ry={60}
          fill={`url(#${uid}g)`}
        />
      ) : null}
    </g>
  );
};

/** THE LINK (hull layer): the clip's Starlink link look — a soft cream CONE of light, narrow above and widening to about
 *  the radome's width where it lands, a brighter thin core, small bright cream data packets travelling down it at one
 *  speed, and a soft cream pool on the crown where it lands */
export const LinkBeam: React.FC<{ S: number; top: number; x?: number }> = ({
  S,
  top,
  x = CABIN.XR + 20,
}) => {
  const uid = uidOf(useId());
  const bot = CABIN.crownTop - CABIN.radomeH + 2;
  const len = bot - top;
  const wTop = 10;
  const wBot = CABIN.radomeLen * 0.36;
  const halfAt = (y: number) =>
    wTop / 2 + ((wBot - wTop) / 2) * ((y - top) / len);
  const SP = 150;
  const V = 21;
  const packets: number[] = [];
  const off = (((S * V) % SP) + SP) % SP;
  for (let y = top + off - SP; y < bot; y += SP) if (y > top) packets.push(y);
  const cone = `M${f3(x - wTop / 2)} ${f3(top)}L${f3(x + wTop / 2)} ${f3(top)}L${f3(x + wBot / 2)} ${f3(bot)}L${f3(x - wBot / 2)} ${f3(bot)}Z`;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}x`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFF3DC" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFF6E6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFF3DC" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id={`${uid}y`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={f3(top)}
          x2="0"
          y2={f3(bot)}
        >
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
        </linearGradient>
        <mask
          id={`${uid}m`}
          maskUnits="userSpaceOnUse"
          x={x - wBot}
          y={top}
          width={wBot * 2}
          height={len}
        >
          <rect
            x={x - wBot}
            y={top}
            width={wBot * 2}
            height={len}
            fill={`url(#${uid}y)`}
          />
        </mask>
        <radialGradient id={`${uid}p`}>
          <stop offset="0" stopColor="#FFF8EA" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="#FFF4DF" stopOpacity="0.3" />
          <stop offset="1" stopColor="#FFF4DF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g mask={`url(#${uid}m)`}>
        <path d={cone} fill={`url(#${uid}x)`} style={{ filter: "blur(6px)" }} />
        <path d={cone} fill={`url(#${uid}x)`} opacity={0.6} />
      </g>
      <rect
        x={x - 6}
        y={top}
        width={12}
        height={len}
        fill="#FFF3DC"
        opacity={0.35}
        style={{ filter: "blur(4px)" }}
      />
      <rect
        x={x - 2}
        y={top}
        width={4}
        height={len}
        fill="#FFF8EC"
        opacity={0.95}
      />
      {packets.map((y) => {
        const hw = Math.min(halfAt(y) * 0.5, 9);
        return (
          <ellipse
            key={y}
            cx={x}
            cy={y}
            rx={f3(Math.max(3.5, hw * 0.8))}
            ry={11}
            fill="#FFFFFF"
            opacity={0.95}
            style={{ filter: "blur(1.5px)" }}
          />
        );
      })}
      {/* the pool where it lands, on the radome and the crown */}
      <ellipse
        cx={x}
        cy={bot + 4}
        rx={wBot * 0.85}
        ry={46}
        fill={`url(#${uid}p)`}
      />
    </g>
  );
};

/** THE SIGNAL IN THE CEILING (hull layer): a cream thread from the radome down into the crown's cut face and aft
 *  along it; its bright head is the wavefront every drop starts from. `head` = the front's x (world). */
export const CrownStrand: React.FC<{
  head: number;
  drain?: number;
  S?: number;
}> = ({ head, drain = 0, S = 0 }) => {
  const uid = uidOf(useId());
  const x0 = CABIN.XR + 20;
  const y = (CABIN.skinB + CABIN.crownB) / 2 + 4;
  if (head <= x0) return null;
  const d = `M${f3(x0)} ${f3(CABIN.crownTop - 2)}Q${f3(x0)} ${f3(y)} ${f3(Math.min(head, x0 + 40))} ${f3(y)}L${f3(head)} ${f3(y)}`;
  const a = 1 - 0.55 * c01(drain);
  return (
    <g opacity={a}>
      <path
        d={d}
        stroke="#FFF3DC"
        strokeWidth={22}
        fill="none"
        opacity={0.35}
        style={{ filter: "blur(6px)" }}
      />
      <path
        d={d}
        stroke="#FFF9EE"
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
      />
      {/* the signal flowing aft along the thread: soft bright pulses at one speed, behind its head */}
      <defs>
        <clipPath id={`${uid}c`}>
          <rect
            x={x0 + 30}
            y={y - 8}
            width={Math.max(0, head - x0 - 50)}
            height={16}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        {(() => {
          const SP = 160;
          const out: React.ReactNode[] = [];
          const off = (((S * 14) % SP) + SP) % SP;
          for (let x = x0 + off - SP; x < head + 110; x += SP) {
            out.push(
              <ellipse
                key={x}
                cx={x - 14}
                cy={y}
                rx={16}
                ry={5}
                fill="#FFFFFF"
                opacity={0.95}
              />,
            );
          }
          return out;
        })()}
      </g>
      <ellipse
        cx={head}
        cy={y}
        rx={36}
        ry={14}
        fill="#FFF8EA"
        opacity={0.75}
        style={{ filter: "blur(6px)" }}
      />
      <circle cx={head} cy={y} r={5} fill="#FFFFFF" />
    </g>
  );
};

/** a cream drop (mid layer): from the ceiling down to a device; `tip` 0..1 how far it has run, `a` its strength */
export const DropBeam: React.FC<{
  x: number;
  top: number;
  bottom: number;
  tip: number;
  a: number;
}> = ({ x, top, bottom, tip, a }) => {
  if (tip <= 0 || a <= 0.002) return null;
  const y1 = top + (bottom - top) * c01(tip);
  return (
    <g opacity={c01(a)}>
      <rect
        x={x - 8}
        y={top}
        width={16}
        height={y1 - top}
        fill="#FFF3DC"
        opacity={0.28}
        style={{ filter: "blur(4px)" }}
      />
      <rect
        x={x - 1.6}
        y={top}
        width={3.2}
        height={y1 - top}
        fill="#FFF7E8"
        opacity={0.9}
      />
      {tip < 1 ? (
        <circle
          cx={x}
          cy={y1}
          r={6}
          fill="#FFFFFF"
          style={{ filter: "blur(1.5px)" }}
        />
      ) : null}
    </g>
  );
};

/** THE FAR WALL (far layer): the cabin's far side, board panels, a window per row glowing with the golden sky
 *  (a slow drift of light across the panes), and the galley cabinets forward of the bulkhead */
export const FarWall: React.FC<{ S: number; x0: number; x1: number }> = ({
  S,
  x0,
  x1,
}) => {
  const uid = uidOf(useId());
  const C = CABIN;
  const wins: number[] = [];
  const first = Math.ceil((x0 - 300) / ROW_PITCH);
  for (let i = first; i * ROW_PITCH + 170 < x1 + 300; i++) wins.push(i * ROW_PITCH + 170);
  const drift = S * 1.1;
  return (
    <g>
      <defs>
        <linearGradient
          id={`${uid}w`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={C.crownTop}
          x2="0"
          y2={0}
        >
          <stop offset="0" stopColor="#D6BD9C" />
          <stop offset="0.5" stopColor="#C4A683" />
          <stop offset="0.8" stopColor="#A6845F" />
          <stop offset="1" stopColor="#5C412F" />
        </linearGradient>
        <linearGradient
          id={`${uid}p`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={C.winY - C.winH / 2}
          x2="0"
          y2={C.winY + C.winH / 2}
        >
          <stop offset="0" stopColor="#E7C08A" />
          <stop offset="0.55" stopColor="#F3DEB6" />
          <stop offset="1" stopColor="#F6E6C6" />
        </linearGradient>
        <linearGradient
          id={`${uid}fw`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="-200"
          x2="0"
          y2="0"
        >
          <stop offset="0" stopColor="#5A3F2D" stopOpacity="0" />
          <stop offset="0.55" stopColor="#5A3F2D" stopOpacity="0.75" />
          <stop offset="1" stopColor="#4A3223" stopOpacity="1" />
        </linearGradient>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor="#FFE6B8" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFE9C4" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`${uid}s`}
          gradientUnits="userSpaceOnUse"
          x1="-60"
          y1="0"
          x2="60"
          y2="0"
        >
          <stop offset="0" stopColor="#FFF8EA" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFF8EA" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFF8EA" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect
        x={x0 - 400}
        y={C.crownTop - 60}
        width={x1 - x0 + 800}
        height={-C.crownTop + 160}
        fill={`url(#${uid}w)`}
      />
      {/* the dado: a darker band low on the wall */}
      {/* the footwell: deep brown low on the wall, under the seats */}
      <rect
        x={x0 - 400}
        y={-200}
        width={x1 - x0 + 800}
        height={220}
        fill={`url(#${uid}fw)`}
      />
      {wins.map((wx) => {
        const sweep = ((((wx * 0.37 + drift) % 520) + 520) % 520) - 200;
        return (
          <g key={wx}>
            <ellipse
              cx={wx}
              cy={C.winY}
              rx={150}
              ry={170}
              fill={`url(#${uid}g)`}
            />
            <rect
              x={wx - C.winW / 2 - 9}
              y={C.winY - C.winH / 2 - 9}
              width={C.winW + 18}
              height={C.winH + 18}
              rx={C.winW / 2 + 9}
              fill="#D8C6AC"
            />
            <clipPath id={`${uid}c${wx}`}>
              <rect
                x={wx - C.winW / 2}
                y={C.winY - C.winH / 2}
                width={C.winW}
                height={C.winH}
                rx={C.winW / 2}
              />
            </clipPath>
            <g clipPath={`url(#${uid}c${wx})`}>
              <rect
                x={wx - C.winW / 2}
                y={C.winY - C.winH / 2}
                width={C.winW}
                height={C.winH}
                fill={`url(#${uid}p)`}
              />
              {/* the cloud deck far below, seen through the pane */}
              <rect
                x={wx - C.winW / 2}
                y={C.winY + 22}
                width={C.winW}
                height={60}
                fill="#FBEFD6"
                opacity={0.7}
              />
              <g
                transform={`translate(${f3(wx - 60 + sweep * 0.5)} ${C.winY}) skewX(-18)`}
              >
                <rect
                  x={-60}
                  y={-80}
                  width={120}
                  height={160}
                  fill={`url(#${uid}s)`}
                />
              </g>
            </g>
          </g>
        );
      })}
      {/* THE GALLEY forward of the bulkhead: a plain cabinet wall */}
      <rect
        x={x0 - 400}
        y={C.crownTop - 60}
        width={Math.max(0, C.XB + 60 - (x0 - 400))}
        height={-C.crownTop + 160}
        fill="#D6C2A4"
      />
    </g>
  );
};

/** THE OVERHEAD BINS (bins layer): a row of bin doors above the seats, the reading-light strip under them */
export const Bins: React.FC<{ x0: number; x1: number }> = ({ x0, x1 }) => {
  const doors: number[] = [];
  const first = Math.max(0, Math.floor((x0 - CABIN.XB) / ROW_PITCH) - 1);
  for (let i = first; CABIN.XB + 60 + i * ROW_PITCH < x1 + 500; i++)
    doors.push(CABIN.XB + 60 + i * ROW_PITCH);
  return (
    <g>
      <rect
        x={CABIN.XB + 60}
        y={-800}
        width={Math.max(0, x1 + 600 - CABIN.XB)}
        height={190}
        fill="#E4D5BD"
      />
      {doors.map((x) => (
        <g key={x}>
          <rect
            x={x + 6}
            y={-768}
            width={ROW_PITCH - 12}
            height={140}
            rx={14}
            fill="#F2E9DA"
          />
          <rect
            x={x + 6}
            y={-768}
            width={ROW_PITCH - 12}
            height={4}
            rx={2}
            fill="#FFFBF2"
          />
          <rect
            x={x + ROW_PITCH / 2 - 35}
            y={-648}
            width={70}
            height={10}
            rx={5}
            fill="#C2AA8C"
          />
        </g>
      ))}
      {/* the service strip: reading lights (off) */}
      <rect
        x={CABIN.XB + 60}
        y={-612}
        width={Math.max(0, x1 + 600 - CABIN.XB)}
        height={22}
        fill="#D9C7AB"
      />
      {doors.map((x) => (
        <circle key={`l${x}`} cx={x + ROW_PITCH / 2 + 30} cy={-601} r={5} fill="#FFF6E6" />
      ))}
    </g>
  );
};

/** THE BULKHEAD (mid layer): a slim board partition ahead of row 0, seen edge-on (row 0's screen is mounted on its aft
 *  face); in the cabin's board tone so it never reads as a piece of the cream outer skin */
export const Bulkhead: React.FC = () => {
  const x = CABIN.XB;
  const rx = x + SEAT.rearX(-326) + 2;
  return (
    <g>
      <rect x={rx - 34} y={-820} width={34} height={826} fill="#A88A6B" />
      <rect x={rx - 8} y={-820} width={8} height={826} fill="#8E7258" />
    </g>
  );
};

/** GOLDEN WINDOW LIGHT (drawn over the seats and passengers, placed with the far wall's windows): a soft warm pool
 *  falling from each window down and toward us, slowly drifting (the low sun through the panes) */
export const WindowLight: React.FC<{ S: number; x0: number; x1: number }> = ({
  S,
  x0,
  x1,
}) => {
  const uid = uidOf(useId());
  const wins: number[] = [];
  const first = Math.ceil((x0 - 600) / ROW_PITCH);
  for (let i = first; i * ROW_PITCH + 170 < x1 + 600; i++) wins.push(i * ROW_PITCH + 170);
  const drift = 18 * Math.sin(S * 0.035);
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id={`${uid}l`}>
          <stop offset="0" stopColor="#FFDCA0" stopOpacity="0.26" />
          <stop offset="0.5" stopColor="#FFD596" stopOpacity="0.1" />
          <stop offset="1" stopColor="#FFD596" stopOpacity="0" />
        </radialGradient>
      </defs>
      {wins.map((wx) => (
        <ellipse
          key={wx}
          cx={wx + 30 + drift}
          cy={CABIN.winY + 150}
          rx={250}
          ry={300}
          fill={`url(#${uid}l)`}
        />
      ))}
    </g>
  );
};
