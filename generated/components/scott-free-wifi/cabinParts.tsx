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
export const CABIN = {
  /** the crown: its top (the skin), the skin's underside, the cut face's lower edge (the cabin's ceiling line) */
  crownTop: -830,
  skinB: -814,
  crownB: -770,
  /** the floor's cut face and the belly below it */
  floorT: -6,
  floorB: 40,
  bellyLine: 74,
  bellyB: 138,
  /** the cutaway's forward edge (hull layer) and its corner radius */
  xOpen: -490,
  openR: 56,
  /** the Starlink radome on the crown: centre x, length, height */
  XR: -640,
  radomeLen: 560,
  radomeH: 60,
  /** the bulkhead (where the seat ahead of row 0 would stand); the galley is forward of it */
  XB: -430,
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
export const layerScale = (k: number, Z: number) =>
  (k * LAYER.D) / (LAYER.D + Z);
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
  skin: "#F2E9DA",
  skinFoot: "#E3D6C1",
  belly: "#8E8B83",
  bellyFoot: "#7D7A73",
  cut: "#A08066",
  cutDeep: "#8A6B53",
  cutEdge: "#D9C6AA",
  window: "#4A3629",
} as const;

const roundedOpen = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
) =>
  `M${f3(x1)} ${f3(y0)}L${f3(x0 + r)} ${f3(y0)}Q${f3(x0)} ${f3(y0)} ${f3(x0)} ${f3(y0 + r)}L${f3(x0)} ${f3(y1 - r)}Q${f3(x0)} ${f3(y1)} ${f3(x0 + r)} ${f3(y1)}L${f3(x1)} ${f3(y1)}Z`;

/** the cutaway's opening (hull layer), grown by `pad` under the cut face: the interior layers are clipped to it */
export const openingPath = (pad = 12) =>
  roundedOpen(
    CABIN.xOpen - pad,
    CABIN.crownB - pad,
    CABIN.xMax + 100,
    CABIN.floorT + pad,
    CABIN.openR + pad,
  );

/** THE HULL (hull layer): the fuselage seen side-on, its near wall cut away from the crown to the floor aft of
 *  xOpen; the cut face shows as a board band round the opening; the crown's cream skin on top, United's warm-slate
 *  belly below, a row of windows on the intact skin forward of the cut. */
export const Hull: React.FC = () => {
  const uid = uidOf(useId());
  const C = CABIN;
  const T = 40; // the cut face's width
  const outer = `M${C.xMin} ${C.crownTop}L${C.xMax} ${C.crownTop}L${C.xMax} ${C.bellyB}L${C.xMin} ${C.bellyB}Z`;
  const hole = roundedOpen(C.xOpen, C.crownB, C.xMax + 100, C.floorT, C.openR);
  const cutOuter = roundedOpen(
    C.xOpen - T,
    C.skinB,
    C.xMax + 100,
    C.floorB,
    C.openR + T,
  );
  const DOOR = { x: C.xOpen - 470, w: 124, y0: -600, y1: -24 };
  const wins: number[] = [];
  for (let x = C.xOpen - 110; x > C.xMin; x -= 150)
    if (Math.abs(x - DOOR.x) > DOOR.w / 2 + 40) wins.push(x);
  return (
    <g>
      <defs>
        {/* the tube under the key light: a bright band just under the crown, darkening toward the belly */}
        <linearGradient
          id={`${uid}s`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={C.crownTop}
          x2="0"
          y2={C.bellyLine}
        >
          <stop offset="0" stopColor="#EFE5D3" />
          <stop offset="0.1" stopColor="#F8F2E7" />
          <stop offset="0.55" stopColor="#EADFCB" />
          <stop offset="1" stopColor="#D2C3AA" />
        </linearGradient>
        <linearGradient
          id={`${uid}b`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={C.bellyLine}
          x2="0"
          y2={C.bellyB}
        >
          <stop offset="0" stopColor={HULL_COL.belly} />
          <stop offset="1" stopColor={HULL_COL.bellyFoot} />
        </linearGradient>
        <clipPath id={`${uid}h`}>
          <path d={outer + hole} clipRule="evenodd" />
        </clipPath>
      </defs>
      <path d={outer + hole} fillRule="evenodd" fill={`url(#${uid}s)`} />
      <g clipPath={`url(#${uid}h)`}>
        <rect
          x={C.xMin}
          y={C.bellyLine}
          width={C.xMax - C.xMin}
          height={C.bellyB - C.bellyLine + 10}
          fill={`url(#${uid}b)`}
        />
        {/* the cut face round the opening */}
        <path d={cutOuter + hole} fillRule="evenodd" fill={HULL_COL.cut} />
        <path
          d={
            roundedOpen(
              C.xOpen - T * 0.45,
              C.skinB + 12,
              C.xMax + 100,
              C.floorB - 12,
              C.openR + T * 0.45,
            ) + hole
          }
          fillRule="evenodd"
          fill={HULL_COL.cutDeep}
        />
        {/* the crown's lit top edge and the skin line over the cut */}
        <rect
          x={C.xMin}
          y={C.crownTop}
          width={C.xMax - C.xMin}
          height={3}
          fill="#FFFAF1"
        />
        <rect
          x={C.xOpen - T}
          y={C.skinB - 1}
          width={C.xMax - C.xOpen + T}
          height={2.5}
          fill={HULL_COL.cutEdge}
        />
        {/* the windows on the intact skin, and the forward door */}
        {wins.map((x) => (
          <g key={x}>
            <rect
              x={x - 23}
              y={CABIN.winY - 36}
              width={46}
              height={72}
              rx={21}
              fill={HULL_COL.window}
            />
            <rect
              x={x - 14}
              y={CABIN.winY - 27}
              width={8}
              height={26}
              rx={4}
              fill="#7A6455"
            />
          </g>
        ))}
        {/* skin panel seams: a lap joint over the window belt and faint frames */}
        <rect
          x={C.xMin}
          y={CABIN.winY - 78}
          width={C.xOpen - C.xMin}
          height={1.6}
          fill="#DCCFB8"
        />
        <rect
          x={C.xMin}
          y={CABIN.winY + 70}
          width={C.xOpen - C.xMin}
          height={1.6}
          fill="#DCCFB8"
        />
        <rect
          x={DOOR.x - DOOR.w / 2}
          y={DOOR.y0}
          width={DOOR.w}
          height={DOOR.y1 - DOOR.y0}
          rx={26}
          fill="none"
          stroke="#C9B89D"
          strokeWidth={3}
        />
        <rect
          x={DOOR.x - 20}
          y={CABIN.winY - 30}
          width={40}
          height={60}
          rx={18}
          fill={HULL_COL.window}
        />
        {/* the belly line: a thin warm rule where the cream meets United's slate */}
        <rect
          x={C.xMin}
          y={C.bellyLine - 3}
          width={C.xMax - C.xMin}
          height={3}
          fill="#BFAE93"
        />
      </g>
      {/* the floor's lit edge where the cabin floor meets the cut */}
      <rect
        x={C.xOpen + C.openR}
        y={C.floorT}
        width={C.xMax - C.xOpen}
        height={3}
        fill={HULL_COL.cutEdge}
      />
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
  const first = Math.ceil((x0 - 300) / 430);
  for (let i = first; i * 430 + 170 < x1 + 300; i++) wins.push(i * 430 + 170);
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
  const first = Math.max(0, Math.floor((x0 - CABIN.XB) / 430) - 1);
  for (let i = first; CABIN.XB + 60 + i * 430 < x1 + 500; i++)
    doors.push(CABIN.XB + 60 + i * 430);
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
            width={418}
            height={140}
            rx={14}
            fill="#F2E9DA"
          />
          <rect
            x={x + 6}
            y={-768}
            width={418}
            height={4}
            rx={2}
            fill="#FFFBF2"
          />
          <rect
            x={x + 180}
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
        <circle key={`l${x}`} cx={x + 240} cy={-601} r={5} fill="#FFF6E6" />
      ))}
    </g>
  );
};

/** THE BULKHEAD (mid layer): the partition ahead of row 0, seen edge-on; row 0's screen is mounted on its aft face */
export const Bulkhead: React.FC = () => {
  const x = CABIN.XB;
  const rx = x + SEAT.rearX(-326) + 2;
  return (
    <g>
      <rect
        x={x + 12}
        y={-820}
        width={rx - x - 12}
        height={826}
        fill="#EADDC8"
      />
      <rect x={rx - 14} y={-820} width={14} height={826} fill="#CDB89A" />
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
  const first = Math.ceil((x0 - 600) / 430);
  for (let i = first; i * 430 + 170 < x1 + 600; i++) wins.push(i * 430 + 170);
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
