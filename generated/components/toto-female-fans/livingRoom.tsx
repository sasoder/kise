// ---------------------------------------------------------------------------
// livingRoom — the cosy picture-book living room of NetflixFactor (toto-female-fans, cut 1). Cheeky Pint stout,
// picture-book world (styles/cheeky-pint.md): warm evening, walls in board tones, cream card sofa, a floor lamp, a
// plant, a TV on a low sideboard playing the race (the trackWorld circuit of toto-champion-eight at TV scale, a cream
// card F1 racing through it, the Netflix "N" stamped in the screen's top-left corner as the show's bug), and a
// picture-book family of three on the sofa seen from behind three-quarter (cabinCast grammar: big round heads, dot
// eye, blush, flat matte card fills, no outlines). Nothing black. AMBER = F1's fans: the screen's light on the
// family's faces and on the room (one glow, bloomFilter, never a pulse).
//
// UNITS + CAMERA. World METRES: x right, y UP (0 = the floor), z depth (0 = the back wall, the camera at z < 0 looking
// toward +z). A level pinhole camera `RoomCam` {x, z, eye, F, hor}: a point (x, y, z) lands on screen at
//   X = 540 + (x - cam.x) * F / (z - cam.z),   Y = cam.hor + (cam.eye - y) * F / (z - cam.z)
// (`hor` = the screen row of the horizon, the 9:16 dy shift already in it). Every object is a flat card at its own
// depth (`Card` maps card-local metres (x, -y) to the screen), so a dolly back gives true parallax: the sofa and the
// family (near) shrink far faster than the TV (far) and rise in from the bottom edge.
//
// EXPORTS: RoomCam, kAt, project, ROOM (the layout), RoomBack (wall, floor, rug, lamp, plant, sideboard, TV body +
// the amber spill on the wall), TvShow (the race in the screen rect, HTML), TvGlass (sheen + the Netflix bug),
// RoomFront (sofa + family + the amber on them), NetflixN (the mark), screenRect.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { COLOR, GRAIN, GROUND, VIGNETTE, bloomFilter, clamp01, mixHex } from "../kits/cheeky-pint/stoutShared";
import { M as TRACK_M } from "../toto-champion-eight/champShared";
import { LANES, OnLane, TrackStage, laneK, type TrackCam } from "../toto-champion-eight/trackWorld";
import { SKIN, HAIR, CLOTH } from "../scott-free-wifi/cabinCast";

export type P2 = [number, number];
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const f6 = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `lr${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const LIGHT_TINT = "#FFF4E2";
/** the bloom on the screen-light washes: bloomFilter's radii scaled down (x this factor on k) so it stays a soft glow */
const LIGHT_BLOOM_K = 2.2;
const topOf = (c: string, t = 0.14) => mixHex(c, LIGHT_TINT, t);
const footOf = (c: string, t = 0.16) => mixHex(c, COLOR.shadow, t);

// ---------------------------------------------------------------------------
// CAMERA
// ---------------------------------------------------------------------------
export type RoomCam = { x: number; z: number; eye: number; F: number; hor: number };
export const kAt = (c: RoomCam, z: number) => c.F / (z - c.z);
export const project = (c: RoomCam, x: number, y: number, z: number): P2 => {
  const k = kAt(c, z);
  return [540 + (x - c.x) * k, c.hor + (c.eye - y) * k];
};
/** a <g> whose local coords are metres at depth z (x right, -y up: write a height h as -h) */
export const Card: React.FC<{ c: RoomCam; z: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({ c, z, children, style }) => {
  const k = kAt(c, z);
  return (
    <g transform={`matrix(${f6(k)} 0 0 ${f6(k)} ${f6(540 - c.x * k)} ${f6(c.hor + c.eye * k)})`} style={style}>
      {children}
    </g>
  );
};

// ---------------------------------------------------------------------------
// LAYOUT (metres)
// ---------------------------------------------------------------------------
export const ROOM = {
  wallH: 3.6,
  /** the TV: screen 1.40 x 0.7875 (16:9), its centre, bezel, the glass plane's depth */
  tv: { w: 1.4, h: 0.7875, cx: 0, cy: 1.2, z: -0.16, bezel: 0.034 },
  /** the low sideboard under it: front face depth, back depth, height, half-width */
  board: { zf: -0.5, zb: -0.06, h: 0.7, hw: 0.95 },
  lamp: { x: -1.42, z: -0.32, h: 1.62, shadeW: 0.4, shadeH: 0.3 },
  plant: { x: 1.52, z: -0.4 },
  /** the rug between the sofa and the sideboard (an ellipse on the floor) */
  rug: { cx: 0, cz: -1.55, rx: 1.2, rz: 0.75 },
  /** the sofa: its back panel (the face toward the camera) at zb, the seat front at zf */
  sofa: { zb: -2.95, zf: -2.05, hw: 0.96, backH: 0.8, armH: 0.64, armW: 0.15 },
} as const;
const TV = ROOM.tv;
/** the screen's rect on screen (px): [x0, y0, w, h] */
export const screenRect = (c: RoomCam) => {
  const a = project(c, TV.cx - TV.w / 2, TV.cy + TV.h / 2, TV.z);
  const b = project(c, TV.cx + TV.w / 2, TV.cy - TV.h / 2, TV.z);
  return { x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] };
};

// ---------------------------------------------------------------------------
// TONES (evening; board tones on the walls, nothing black, no amber except the screen's light)
// ---------------------------------------------------------------------------
export const ROOM_COLOR = {
  wallTop: mixHex(COLOR.board, COLOR.ground, 0.62),
  wall: mixHex(COLOR.board, COLOR.ground, 0.38),
  wallFoot: mixHex(COLOR.boardFoot, COLOR.ground, 0.3),
  skirting: mixHex(COLOR.creamFoot, COLOR.board, 0.55),
  floorFar: "#8A6648",
  floorNear: "#6E4E37",
  plank: "#5E412D",
  rug: mixHex(CLOTH.oat, COLOR.board, 0.25),
  rugBorder: mixHex(CLOTH.terracotta, COLOR.board, 0.3),
  wood: "#86634A",
  woodTop: "#A07C5F",
  woodDark: "#6B4D39",
  bezel: "#3A2A20",
  bezelLit: "#5A4535",
  lampPole: "#6B5444",
  shade: COLOR.cream,
  pot: CLOTH.terracotta,
  leaf: ["#7D8250", "#949A6A", "#6C7744", "#879252"],
  sofa: COLOR.cream,
  sofaMid: mixHex(COLOR.creamFoot, COLOR.board, 0.62),
  sofaFoot: mixHex(COLOR.board, COLOR.ground, 0.25),
} as const;

// ---------------------------------------------------------------------------
// THE BACK OF THE ROOM: wall, floor, rug, lamp, plant, sideboard, TV body (all behind the screen's picture)
// ---------------------------------------------------------------------------
export const RoomBack: React.FC<{ c: RoomCam; amber: number; S: number }> = ({ c, amber, S }) => {
  const uid = uidOf(useId());
  const zNear = c.z + 0.35;
  // floor: the plane y = 0 from the wall to just in front of the camera
  const fl = [project(c, -6, 0, 0), project(c, 6, 0, 0), project(c, 6, 0, Math.max(zNear, -12)), project(c, -6, 0, Math.max(zNear, -12))];
  const quad = (pts: P2[]) => `M${pts.map((p) => `${f3(p[0])} ${f3(p[1])}`).join("L")}Z`;
  const planks: React.ReactNode[] = [];
  for (let i = -30; i <= 30; i++) {
    const x = i * 0.19;
    const a = project(c, x, 0, 0);
    const b = project(c, x, 0, Math.max(zNear, -12));
    planks.push(<path key={i} d={`M${f3(a[0])} ${f3(a[1])}L${f3(b[0])} ${f3(b[1])}`} stroke={ROOM_COLOR.plank} strokeWidth={f3(Math.max(0.8, 0.008 * kAt(c, -1)))} opacity={0.35} />);
  }
  // the rug: an ellipse on the floor, sampled
  const rugPts = (rx: number, rz: number) =>
    Array.from({ length: 64 }, (_, i) => {
      const t = (i / 64) * Math.PI * 2;
      return project(c, ROOM.rug.cx + rx * Math.cos(t), 0, Math.min(-0.05, Math.max(zNear, ROOM.rug.cz + rz * Math.sin(t))));
    });
  const B = ROOM.board;
  const kb = kAt(c, B.zf);
  // the amber spill (the screen's light): on the wall round the TV, on the sideboard top, on the floor in front
  const [tcx, tcy] = project(c, TV.cx, TV.cy, 0);
  const kw = kAt(c, 0);
  const floorSpot = project(c, 0, 0, -1.3);
  const kfs = kAt(c, -1.3);
  const lampTop = project(c, ROOM.lamp.x, ROOM.lamp.h, 0);
  const sbBack = project(c, TV.cx, B.h, B.zb);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id={`${uid}wall`} gradientUnits="userSpaceOnUse" x1="0" y1={-2.9} x2="0" y2={0}>
          <stop offset="0" stopColor={ROOM_COLOR.wallTop} />
          <stop offset="0.55" stopColor={ROOM_COLOR.wall} />
          <stop offset="1" stopColor={ROOM_COLOR.wallFoot} />
        </linearGradient>
        <linearGradient id={`${uid}floor`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(fl[0][1])} x2="0" y2={f3(Math.min(2400, fl[2][1]))}>
          <stop offset="0" stopColor={ROOM_COLOR.floorFar} />
          <stop offset="1" stopColor={ROOM_COLOR.floorNear} />
        </linearGradient>
        <radialGradient id={`${uid}lamp`} gradientUnits="userSpaceOnUse" cx={f3(lampTop[0])} cy={f3(lampTop[1])} r={f3(1.5 * kw)}>
          <stop offset="0" stopColor="#FFE9C6" stopOpacity="0.5" />
          <stop offset="0.4" stopColor="#FBD9A8" stopOpacity="0.16" />
          <stop offset="1" stopColor="#FBD9A8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}spill`} gradientUnits="userSpaceOnUse" cx={f3(tcx)} cy={f3(tcy)} r={f3(1.75 * kw)}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(0.66 * amber)} />
          <stop offset="0.45" stopColor={COLOR.amberFoot} stopOpacity={f3(0.27 * amber)} />
          <stop offset="1" stopColor={COLOR.amberFoot} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}fspill`} gradientUnits="userSpaceOnUse" cx={f3(floorSpot[0])} cy={f3(floorSpot[1])} r={f3(1.6 * kfs)} gradientTransform={`translate(${f3(floorSpot[0])} ${f3(floorSpot[1])}) scale(1 0.32) translate(${f3(-floorSpot[0])} ${f3(-floorSpot[1])})`}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(0.5 * amber)} />
          <stop offset="0.5" stopColor={COLOR.amberFoot} stopOpacity={f3(0.2 * amber)} />
          <stop offset="1" stopColor={COLOR.amberFoot} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}stop`} gradientUnits="userSpaceOnUse" cx={f3(sbBack[0])} cy={f3(sbBack[1])} r={f3(1.05 * kAt(c, B.zb))} gradientTransform={`translate(${f3(sbBack[0])} ${f3(sbBack[1])}) scale(1 0.42) translate(${f3(-sbBack[0])} ${f3(-sbBack[1])})`}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(0.62 * amber)} />
          <stop offset="0.5" stopColor={COLOR.amberFoot} stopOpacity={f3(0.26 * amber)} />
          <stop offset="1" stopColor={COLOR.amberFoot} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}sbf`} gradientUnits="userSpaceOnUse" x1="0" y1={-B.h} x2="0" y2={0}>
          <stop offset="0" stopColor={topOf(ROOM_COLOR.wood, 0.08)} />
          <stop offset="1" stopColor={footOf(ROOM_COLOR.wood, 0.2)} />
        </linearGradient>
      </defs>
      {/* the wall */}
      <Card c={c} z={0}>
        <rect x={-8} y={-ROOM.wallH - 4} width={16} height={ROOM.wallH + 4} fill={`url(#${uid}wall)`} />
        <rect x={-8} y={-0.12} width={16} height={0.12} fill={ROOM_COLOR.skirting} />
        <rect x={-8} y={-0.125} width={16} height={0.012} fill={topOf(ROOM_COLOR.skirting, 0.3)} />
      </Card>
      {/* the lamp's warm cream light on the wall (light, not an object) */}
      <rect x={-60} y={-60} width={1200} height={2040} fill={`url(#${uid}lamp)`} style={{ mixBlendMode: "screen" }} />
      {/* the floor */}
      <path d={quad(fl)} fill={`url(#${uid}floor)`} />
      {planks}
      {/* the rug */}
      <path d={quad(rugPts(ROOM.rug.rx, ROOM.rug.rz))} fill={ROOM_COLOR.rugBorder} />
      <path d={quad(rugPts(ROOM.rug.rx - 0.09, ROOM.rug.rz - 0.07))} fill={ROOM_COLOR.rug} />
      {/* the screen's amber light pooling on the floor in front of the TV */}
      <rect x={-60} y={-60} width={1200} height={2040} fill={`url(#${uid}fspill)`} style={{ mixBlendMode: "screen" }} />
      {/* the plant (behind the sideboard's end) */}
      <Plant c={c} S={S} />
      {/* the floor lamp */}
      <Lamp c={c} />
      {/* the amber spill on the wall round the TV */}
      <rect x={-60} y={-60} width={1200} height={2040} fill={`url(#${uid}spill)`} style={{ mixBlendMode: "screen" }} />
      {/* the sideboard: its top surface (seen from above), its front face with two doors, two short legs */}
      <path d={quad([project(c, -B.hw, B.h, B.zb), project(c, B.hw, B.h, B.zb), project(c, B.hw, B.h, B.zf), project(c, -B.hw, B.h, B.zf)])} fill={ROOM_COLOR.woodTop} />
      {/* the screen's light on the sideboard top: brightest under the screen at the back, falling off toward the front */}
      {amber > 0.002 ? (
        <path
          d={quad([project(c, -B.hw, B.h, B.zb), project(c, B.hw, B.h, B.zb), project(c, B.hw, B.h, B.zf), project(c, -B.hw, B.h, B.zf)])}
          fill={`url(#${uid}stop)`}
          style={{ mixBlendMode: "screen" }}
        />
      ) : null}
      <Card c={c} z={B.zf}>
        {/* contact shadow on the floor */}
        <ellipse cx={0} cy={0} rx={B.hw + 0.12} ry={0.03} fill={COLOR.shadow} opacity={0.35} style={{ filter: `blur(${f3(6 / kb)}px)` }} />
        <rect x={-B.hw + 0.06} y={-0.1} width={0.05} height={0.1} fill={ROOM_COLOR.woodDark} />
        <rect x={B.hw - 0.11} y={-0.1} width={0.05} height={0.1} fill={ROOM_COLOR.woodDark} />
        <rect x={-B.hw} y={-B.h} width={B.hw * 2} height={B.h - 0.09} rx={0.025} fill={`url(#${uid}sbf)`} />
        <rect x={-B.hw} y={-B.h} width={B.hw * 2} height={0.018} fill={topOf(ROOM_COLOR.woodTop, 0.2)} />
        {[-1, 1].map((s) => (
          <g key={s}>
            <rect x={s < 0 ? -B.hw + 0.06 : 0.03} y={-B.h + 0.07} width={B.hw - 0.09} height={B.h - 0.25} rx={0.02} fill={mixHex(ROOM_COLOR.wood, COLOR.shadow, 0.1)} />
            <rect x={s < 0 ? -B.hw + 0.075 : 0.045} y={-B.h + 0.085} width={B.hw - 0.12} height={B.h - 0.28} rx={0.015} fill={ROOM_COLOR.wood} />
            <circle cx={s * 0.09} cy={-B.h / 2 - 0.02} r={0.018} fill={ROOM_COLOR.woodTop} />
          </g>
        ))}
      </Card>
      {/* the TV: its foot on the sideboard, the bezel (the screen's picture is drawn over the hole by TvShow) */}
      <Card c={c} z={TV.z + 0.04}>
        <path d={`M-0.17 ${-B.h}L-0.12 ${-B.h - 0.035}L0.12 ${-B.h - 0.035}L0.17 ${-B.h}Z`} fill={ROOM_COLOR.bezel} />
        <rect x={-0.04} y={-(TV.cy - TV.h / 2) + 0.01} width={0.08} height={TV.cy - TV.h / 2 - B.h - 0.03} fill={ROOM_COLOR.bezel} />
      </Card>
      <Card c={c} z={TV.z}>
        <rect
          x={TV.cx - TV.w / 2 - TV.bezel}
          y={-(TV.cy + TV.h / 2 + TV.bezel)}
          width={TV.w + 2 * TV.bezel}
          height={TV.h + 2 * TV.bezel}
          rx={0.02}
          fill={ROOM_COLOR.bezel}
        />
        <rect x={TV.cx - TV.w / 2 - TV.bezel + 0.01} y={-(TV.cy + TV.h / 2 + TV.bezel)} width={TV.w + 2 * TV.bezel - 0.02} height={0.008} fill={ROOM_COLOR.bezelLit} />
      </Card>
    </svg>
  );
};

/** the floor lamp: a weighted base, a slim pole, a cream drum shade lit from inside */
const Lamp: React.FC<{ c: RoomCam }> = ({ c }) => {
  const L = ROOM.lamp;
  const k = kAt(c, L.z);
  return (
    <Card c={c} z={L.z}>
      <ellipse cx={L.x + 0.04} cy={0} rx={0.26} ry={0.03} fill={COLOR.shadow} opacity={0.35} style={{ filter: `blur(${f3(5 / k)}px)` }} />
      <rect x={L.x - 0.15} y={-0.045} width={0.3} height={0.045} rx={0.02} fill={ROOM_COLOR.lampPole} />
      <rect x={L.x - 0.015} y={-L.h + L.shadeH * 0.5} width={0.03} height={L.h - L.shadeH * 0.5} fill={ROOM_COLOR.lampPole} />
      <rect x={L.x - 0.015} y={-L.h + L.shadeH * 0.5} width={0.01} height={L.h - L.shadeH * 0.5} fill={topOf(ROOM_COLOR.lampPole, 0.25)} />
      {/* the drum shade: a gentle trapezoid, brighter at its foot where the bulb shows through */}
      <defs>
        <linearGradient id="lrShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.creamFoot, 0.6)} />
          <stop offset="1" stopColor="#FFF6E6" />
        </linearGradient>
      </defs>
      <path
        d={`M${f3(L.x - L.shadeW * 0.4)} ${f3(-L.h)}L${f3(L.x + L.shadeW * 0.4)} ${f3(-L.h)}L${f3(L.x + L.shadeW * 0.5)} ${f3(-L.h + L.shadeH)}L${f3(L.x - L.shadeW * 0.5)} ${f3(-L.h + L.shadeH)}Z`}
        fill="url(#lrShade)"
      />
      <rect x={L.x - L.shadeW * 0.5} y={-L.h + L.shadeH - 0.012} width={L.shadeW} height={0.012} fill="#FFF8EC" />
    </Card>
  );
};

/** the plant: a terracotta pot, broad sage leaves on short stems, swaying a touch */
const Plant: React.FC<{ c: RoomCam; S: number }> = ({ c, S }) => {
  const P0 = ROOM.plant;
  const k = kAt(c, P0.z);
  const leaves = [
    { a: -38, l: 0.46, w: 0.15, h: 0.62, t: 0 },
    { a: 30, l: 0.5, w: 0.16, h: 0.66, t: 1 },
    { a: -12, l: 0.56, w: 0.17, h: 0.86, t: 2 },
    { a: 14, l: 0.5, w: 0.15, h: 0.94, t: 3 },
    { a: -55, l: 0.4, w: 0.13, h: 0.5, t: 1 },
    { a: 52, l: 0.42, w: 0.14, h: 0.52, t: 0 },
    { a: 2, l: 0.46, w: 0.15, h: 1.02, t: 1 },
  ];
  return (
    <Card c={c} z={P0.z}>
      <ellipse cx={P0.x + 0.04} cy={0} rx={0.24} ry={0.03} fill={COLOR.shadow} opacity={0.35} style={{ filter: `blur(${f3(5 / k)}px)` }} />
      {leaves.map((q, i) => {
        const sway = 1.6 * Math.sin(S * 0.07 + i * 1.3);
        const base: P2 = [P0.x, -0.42];
        const ang = (q.a + sway) * (Math.PI / 180);
        const tip: P2 = [base[0] + Math.sin(ang) * q.l, base[1] - q.h + 0.42 - Math.cos(ang) * 0.05];
        const mid: P2 = [(base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2];
        const dx = tip[0] - base[0];
        const dy = tip[1] - base[1];
        const len = Math.hypot(dx, dy);
        const nx = -dy / len;
        const ny = dx / len;
        const leafBase: P2 = [base[0] + dx * 0.45, base[1] + dy * 0.45];
        const col = ROOM_COLOR.leaf[q.t];
        return (
          <g key={i}>
            <path d={`M${f3(base[0])} ${f3(base[1])}L${f3(leafBase[0])} ${f3(leafBase[1])}`} stroke={mixHex(col, COLOR.shadow, 0.2)} strokeWidth={0.018} strokeLinecap="round" />
            <path
              d={`M${f3(leafBase[0])} ${f3(leafBase[1])}Q${f3(mid[0] + dx * 0.25 + nx * q.w)} ${f3(mid[1] + dy * 0.25 + ny * q.w)} ${f3(tip[0])} ${f3(tip[1])}Q${f3(mid[0] + dx * 0.25 - nx * q.w)} ${f3(mid[1] + dy * 0.25 - ny * q.w)} ${f3(leafBase[0])} ${f3(leafBase[1])}Z`}
              fill={col}
            />
            <path
              d={`M${f3(leafBase[0])} ${f3(leafBase[1])}Q${f3(mid[0] + dx * 0.25 + nx * q.w * 0.6)} ${f3(mid[1] + dy * 0.25 + ny * q.w * 0.6)} ${f3(tip[0])} ${f3(tip[1])}Q${f3(mid[0] + dx * 0.25)} ${f3(mid[1] + dy * 0.25)} ${f3(leafBase[0])} ${f3(leafBase[1])}Z`}
              fill={topOf(col, 0.16)}
            />
          </g>
        );
      })}
      {/* the pot */}
      <path d={`M${f3(P0.x - 0.19)} -0.44L${f3(P0.x + 0.19)} -0.44L${f3(P0.x + 0.15)} 0L${f3(P0.x - 0.15)} 0Z`} fill={ROOM_COLOR.pot} />
      <rect x={P0.x - 0.2} y={-0.46} width={0.4} height={0.07} rx={0.015} fill={topOf(ROOM_COLOR.pot, 0.12)} />
      <path d={`M${f3(P0.x + 0.05)} -0.39L${f3(P0.x + 0.19)} -0.39L${f3(P0.x + 0.15)} 0L${f3(P0.x + 0.03)} 0Z`} fill={footOf(ROOM_COLOR.pot, 0.12)} opacity={0.6} />
    </Card>
  );
};

// ---------------------------------------------------------------------------
// THE SHOW ON THE TV: the trackWorld circuit (toto-champion-eight) at TV scale, a cream card F1 racing through it
// ---------------------------------------------------------------------------
/** the show's own camera window inside its 1080 x 1920 TrackStage: the 16:9 band we crop to the screen */
export const SHOW = {
  /** the crop's top row in the TrackStage frame; the crop is 1080 x 607.5 */
  cropTop: 690,
  /** the circuit camera: scale on the racing lane, distance, eye height (trackWorld world px) */
  k: 0.3,
  D: 9 * TRACK_M,
  eye: 2.0 * TRACK_M,
  /** the ground line of the racing lane, in the crop (px from its top) */
  ground: 440,
  /** the car's speed and the camera's (world px / frame): the car gains on the camera, so it races across the screen */
  vCar: 150,
  vCam: 138,
} as const;
export const showCam = (S: number): { cam: TrackCam; carX: number } => {
  const carX = SHOW.vCar * S;
  const camX = SHOW.vCam * S + 120 + 0.5 * TRACK_M;
  return {
    cam: { x: camX, k: SHOW.k, D: SHOW.D, eye: SHOW.eye, groundY: SHOW.cropTop + SHOW.ground, dx: 0, dy: 0 },
    carX,
  };
};

export const TvShow: React.FC<{ c: RoomCam; S: number }> = ({ c, S }) => {
  const r = screenRect(c);
  const s = r.w / 1080;
  const { cam, carX } = showCam(S);
  const k = laneK(cam, LANES.subject);
  const cls = uidOf(useId());
  return (
    <div className={cls} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, overflow: "hidden", borderRadius: 2 }}>
      {/* one grain layer: TrackStage draws its own vignette + grain as the two <div>s after its <svg> (trackWorld,
          not ours to edit); inside the screen they would be a second, finer grain, so they are switched off here and
          the room's RoomFinish grain covers the screen like everything else. `!important`: AbsoluteFill sets an inline
          display. Checked: the screen's sky with the room grain off went from high-pass 2.19 to 0.82 (no second grain). */}
      <style>{`.${cls} > * > * > :not(svg) { display: none !important; } .${cls} g[filter$="ma)"] { display: none !important; }`}</style>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: `scale(${f6(s)}) translateY(${f6(-SHOW.cropTop)}px)` }}>
        <TrackStage S={S + 40} cam={cam} v={SHOW.vCam} seed={3}>
          <OnLane cam={cam} z={LANES.subject}>
            <CreamF1 x={carX} k={k} S={S} />
          </OnLane>
        </TrackStage>
      </div>
    </div>
  );
};

// --- the cream card F1 (side profile facing right). Its outline is champShared's F1Outline geometry (toto-champion-eight,
// Mercedes W15/W16 proportions, metres, x from the cockpit, y up), copied here because champShared exports only the
// amber line drawing: here the car is a filled cream card with dark tyres and a terracotta helmet. ----------------------
const F1_FWD =
  "M0 0.6 L0.3 0.61 C0.42 0.615 0.5 0.63 0.56 0.64 C0.9 0.64 1.4 0.6 1.9 0.535 C2.35 0.48 2.72 0.36 2.98 0.265 C3.03 0.245 3.05 0.22 3.03 0.2 " +
  "L3.04 0.125 C3.1 0.118 3.17 0.105 3.195 0.085 C3.215 0.06 3.2 0.035 3.15 0.035 L2.7 0.04 C2.65 0.045 2.63 0.08 2.64 0.11 C2.65 0.135 2.68 0.14 2.72 0.138 L2.96 0.128 " +
  "L2.95 0.19 C2.7 0.26 2.4 0.32 2.05 0.37 C1.75 0.38 1.5 0.33 1.36 0.24 C1.3 0.2 1.27 0.13 1.26 0.09 C1.25 0.05 1.22 0.03 1.16 0.03 L0 0.03";
const F1_BACK =
  "M0 0.6 L-0.2 0.6 C-0.26 0.6 -0.28 0.64 -0.29 0.7 C-0.31 0.82 -0.33 0.925 -0.41 0.948 C-0.47 0.962 -0.57 0.958 -0.67 0.932 " +
  "C-0.95 0.85 -1.2 0.7 -1.45 0.58 C-1.65 0.5 -1.85 0.46 -1.98 0.45 " +
  "C-2.0 0.5 -2.0 0.58 -1.99 0.64 C-1.95 0.65 -1.93 0.67 -1.93 0.71 C-1.94 0.81 -2.01 0.905 -2.12 0.925 L-2.36 0.93 C-2.4 0.93 -2.41 0.91 -2.41 0.88 " +
  "L-2.41 0.665 C-2.41 0.64 -2.39 0.632 -2.35 0.632 L-2.09 0.636 " +
  "C-2.09 0.57 -2.08 0.5 -2.06 0.462 L-2.22 0.455 C-2.26 0.452 -2.26 0.413 -2.22 0.41 L-2.04 0.405 C-2.01 0.38 -2.01 0.34 -2.03 0.315 " +
  "L-2.12 0.305 C-2.16 0.3 -2.17 0.27 -2.14 0.255 C-1.95 0.17 -1.78 0.08 -1.55 0.045 L-1.0 0.03 L0 0.03";
const F1_HALO = "M0.56 0.64 C0.53 0.74 0.47 0.84 0.36 0.872 C0.2 0.905 -0.05 0.905 -0.2 0.87 C-0.27 0.85 -0.3 0.8 -0.295 0.72";
const F1_LINES = [
  "M0.24 0.59 C0.24 0.5 0.27 0.38 0.31 0.31",
  "M0.24 0.59 C-0.1 0.56 -0.6 0.45 -1.06 0.34",
  "M0.31 0.31 C0.1 0.22 -0.3 0.15 -0.75 0.12",
  "M1.25 0.095 L-1.07 0.095",
  "M-0.3 0.83 C-0.33 0.88 -0.37 0.905 -0.44 0.91",
  "M3.13 0.1 C3.0 0.105 2.86 0.1 2.72 0.1",
  "M-1.99 0.86 C-2.12 0.79 -2.26 0.75 -2.41 0.75",
];
const F1_AXLES = [2.15, -1.45];
const F1_TYRE_R = 0.36;
const mapPath = (d: string, T: (x: number, y: number) => P2) => {
  const tokens = d.match(/[MLCQZ]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let out = "";
  let nums: number[] = [];
  const flush = () => {
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const p = T(nums[i], nums[i + 1]);
      out += `${i ? " " : ""}${f3(p[0])} ${f3(p[1])}`;
    }
    nums = [];
  };
  for (const t of tokens) {
    if (/[MLCQZ]/.test(t)) {
      flush();
      out += t;
    } else nums.push(parseFloat(t));
  }
  flush();
  return out;
};
const F1_BODY = mapPath(F1_FWD + " L-0.02 0.03 L-0.02 0.6 Z", (x, y) => [x * TRACK_M, -y * TRACK_M]);
const F1_BODY_B = mapPath(F1_BACK + " L0.02 0.03 L0.02 0.6 Z", (x, y) => [x * TRACK_M, -y * TRACK_M]);
const F1_HALO_W = mapPath(F1_HALO, (x, y) => [x * TRACK_M, -y * TRACK_M]);
const F1_LINES_W = F1_LINES.map((d) => mapPath(d, (x, y) => [x * TRACK_M, -y * TRACK_M]));

/** a cream card F1 car at ground point x (trackWorld world px, the cockpit above it), facing right, at lane scale k */
export const CreamF1: React.FC<{ x: number; k: number; S: number }> = ({ x, k, S }) => {
  const uid = uidOf(useId());
  const Mm = TRACK_M;
  const bob = 1.2 * Math.sin(S * 2.3) + 0.7 * Math.sin(S * 3.7 + 1);
  const R = F1_TYRE_R * Mm;
  const gap = 0.05 * Mm;
  return (
    <g transform={`translate(${f3(x)} 0)`}>
      <defs>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-0.96 * Mm)} x2="0" y2="0">
          <stop offset="0" stopColor={topOf(COLOR.cream, 0.3)} />
          <stop offset="0.55" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={-3 * Mm} y={-1.5 * Mm} width={6.5 * Mm} height={2 * Mm}>
          <rect x={-3 * Mm} y={-1.5 * Mm} width={6.5 * Mm} height={2 * Mm} fill="#fff" />
          {F1_AXLES.map((ax, i) => (
            <circle key={i} cx={f3(ax * Mm)} cy={f3(-R)} r={f3(R + gap)} fill="#000" />
          ))}
        </mask>
      </defs>
      {/* the car's shadow on the asphalt */}
      <ellipse cx={f3(0.3 * Mm)} cy={4} rx={f3(2.9 * Mm)} ry={f3(0.07 * Mm)} fill={COLOR.shadow} opacity={0.42} style={{ filter: `blur(${f3(5 / k)}px)` }} />
      <g transform={`translate(0 ${f3(bob)})`}>
        <g mask={`url(#${uid}m)`}>
          <path d={F1_BODY} fill={`url(#${uid}b)`} />
          <path d={F1_BODY_B} fill={`url(#${uid}b)`} />
          {F1_LINES_W.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={mixHex(COLOR.creamFoot, COLOR.board, 0.55)} strokeWidth={f3(0.022 * Mm)} strokeLinecap="round" />
          ))}
        </g>
        {/* the driver's helmet in the cockpit, a terracotta shell with the visor strip */}
        <circle cx={0} cy={f3(-0.67 * Mm)} r={f3(0.16 * Mm)} fill={CLOTH.terracotta} />
        <path d={`M${f3(0.02 * Mm)} ${f3(-0.7 * Mm)}L${f3(0.15 * Mm)} ${f3(-0.7 * Mm)}`} stroke={COLOR.inkDark} strokeWidth={f3(0.06 * Mm)} strokeLinecap="round" />
        <path d={F1_HALO_W} fill="none" stroke={mixHex(COLOR.board, COLOR.inkDark, 0.6)} strokeWidth={f3(0.075 * Mm)} strokeLinecap="round" />
        {/* tyres: dark rubber, a board wheel cover, a hub */}
        {F1_AXLES.map((ax, i) => (
          <g key={i}>
            <circle cx={f3(ax * Mm)} cy={f3(-R)} r={f3(R)} fill={COLOR.inkDark} />
            <circle cx={f3(ax * Mm)} cy={f3(-R)} r={f3(R * 0.86)} fill={mixHex(COLOR.inkDark, COLOR.board, 0.16)} />
            <circle cx={f3(ax * Mm)} cy={f3(-R)} r={f3(R * 0.62)} fill={mixHex(COLOR.board, COLOR.cream, 0.25)} />
            <circle cx={f3(ax * Mm)} cy={f3(-R)} r={f3(R * 0.16)} fill={COLOR.inkDark} />
          </g>
        ))}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE NETFLIX MARK: the real "N" ribbon (two stems and the diagonal band from top-left to bottom-right IN FRONT of
// them, the stems cut where the band crosses), one colour. Geometry: the Netflix N symbol as drawn in the Simple
// Icons set (24-unit box, the N 13.2 wide x 24 tall: stems 4.715 wide = 0.36 of the N's width, the curved stem ends of
// the ribbon). Local units: the N is drawn 13.204 x 24, origin at its top-left.
// ---------------------------------------------------------------------------
const N_PATHS = [
  // the diagonal band (in front)
  "M0 0V0.006C3.028 8.562 5.37 15.181 8.348 23.602C10.692 23.66 13.198 24 13.202 24C10.402 16.076 7.279 7.253 4.715 0Z",
  // the right stem (cut by the band)
  "M8.489 0V9.63L13.202 22.951C13.159 15.091 13.198 7.038 13.204 0.001Z",
  // the left stem (cut by the band)
  "M0 1.05V24C1.873 23.775 2.81 23.688 4.715 23.602V14.382Z",
];
export const N_BOX = { w: 13.204, h: 24 } as const;
export const NetflixN: React.FC<{ x: number; y: number; h: number; fill: string }> = ({ x, y, h, fill }) => {
  const s = h / N_BOX.h;
  return (
    <g transform={`translate(${f6(x)} ${f6(y)}) scale(${f6(s)})`}>
      {N_PATHS.map((d, i) => (
        <path key={i} d={d} fill={fill} />
      ))}
    </g>
  );
};

/** the screen glass over the picture: the Netflix bug in the top-left corner, a soft sheen, the inner edge shade */
export const TvGlass: React.FC<{ c: RoomCam }> = ({ c }) => {
  const uid = uidOf(useId());
  const r = screenRect(c);
  // the bug: the N ~9.8 % of the screen's width tall (90 px when the screen is 918 px wide), on a cream tile
  const nh = 0.098 * r.w;
  const nw = (nh * N_BOX.w) / N_BOX.h;
  const pad = 0.2 * nh;
  const tw = nw + 2 * pad * 1.25;
  const th = nh + 2 * pad;
  const tx = r.x + 0.03 * r.w;
  const ty = r.y + 0.045 * r.w;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id={`${uid}sh`} gradientUnits="userSpaceOnUse" x1={f3(r.x)} y1={f3(r.y)} x2={f3(r.x + r.w * 0.6)} y2={f3(r.y + r.h)}>
          <stop offset="0" stopColor="#FFF8EC" stopOpacity="0.1" />
          <stop offset="0.45" stopColor="#FFF8EC" stopOpacity="0.03" />
          <stop offset="0.46" stopColor="#FFF8EC" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={f3(r.x)} y={f3(r.y)} width={f3(r.w)} height={f3(r.h)} fill={`url(#${uid}sh)`} />
      <rect x={f3(r.x)} y={f3(r.y)} width={f3(r.w)} height={f3(r.h)} fill="none" stroke={COLOR.shadow} strokeOpacity={0.35} strokeWidth={f3(Math.max(1, r.w * 0.006))} />
      {/* the show's bug */}
      <rect x={f3(tx + r.w * 0.003)} y={f3(ty + r.w * 0.004)} width={f3(tw)} height={f3(th)} rx={f3(th * 0.12)} fill={COLOR.shadow} opacity={0.25} />
      <rect x={f3(tx)} y={f3(ty)} width={f3(tw)} height={f3(th)} rx={f3(th * 0.12)} fill={COLOR.cream} />
      <NetflixN x={tx + (tw - nw) / 2} y={ty + pad} h={nh} fill={COLOR.inkDark} />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// THE FRONT: the sofa (its back toward the camera) and the family on it, seen from behind three-quarter
// ---------------------------------------------------------------------------
export type HeadStyle = "crop" | "bob" | "pony";
export type Member = {
  /** where they sit (x) and the depth of their head / shoulders (they lean in, so this drifts forward) */
  x: number;
  z: number;
  /** shoulder line height (m) and the head's radius (m) */
  shoulder: number;
  R: number;
  /** torso half-width at the shoulders */
  hw: number;
  skin: string;
  hair: string;
  style: HeadStyle;
  top: string;
  /** head turn -1..1 (+: the face turned toward +x, so its cheek shows on the right) and tilt (deg) */
  turn: number;
  tilt: number;
  blink: number;
  /** the pointing arm (the near-side arm on the +x side): hand target in world metres, or null = at rest */
  point?: { hand: [number, number, number]; u: number } | null;
  ponySwing?: number;
};

const circleD = (cx: number, cy: number, r: number) =>
  `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx + r)} ${f3(cy)}Z`;

/** one family member from behind: torso, neck, head with hair covering the back, the cheek turned toward the screen */
const Viewer: React.FC<{ c: RoomCam; m: Member; amber: number }> = ({ c, m, amber }) => {
  const uid = uidOf(useId());
  const k = kAt(c, m.z);
  const R = m.R;
  const neckTop = m.shoulder + 0.05;
  const hc = neckTop + R * 0.86;
  const t = m.turn;
  const am = clamp01(amber);
  // torso: a bean with rounded shoulders, running down behind the sofa back
  const torso = `M${f3(m.x - m.hw)} ${f3(-0.25)}L${f3(m.x - m.hw)} ${f3(-m.shoulder + 0.1)}C${f3(m.x - m.hw)} ${f3(-m.shoulder - 0.01)} ${f3(m.x - m.hw + 0.08)} ${f3(-m.shoulder - 0.03)} ${f3(m.x - m.hw * 0.4)} ${f3(-m.shoulder - 0.03)}L${f3(m.x + m.hw * 0.4)} ${f3(-m.shoulder - 0.03)}C${f3(m.x + m.hw - 0.08)} ${f3(-m.shoulder - 0.03)} ${f3(m.x + m.hw)} ${f3(-m.shoulder - 0.01)} ${f3(m.x + m.hw)} ${f3(-m.shoulder + 0.1)}L${f3(m.x + m.hw)} -0.25Z`;
  const hx = m.x;
  const hy = -hc;
  // hair: the back of the head (shifted away from the face) + style extras, all in head-local coords
  const off = -t * 0.55 * R;
  const hairBack = circleD(off, -0.1 * R, 1.0 * R);
  const faceSide = t >= 0 ? 1 : -1;
  // the far ear peeks past the back of the head; the near (face-side) ear sits on the hairline
  const farEar = <ellipse cx={f3(-faceSide * 0.98 * R)} cy={f3(0.1 * R)} rx={f3(0.14 * R)} ry={f3(0.19 * R)} fill={mixHex(m.skin, COLOR.shadow, 0.12)} />;
  const nearEar = <ellipse cx={f3(off + faceSide * 0.98 * R)} cy={f3(0.12 * R)} rx={f3(0.13 * R)} ry={f3(0.19 * R)} fill={mixHex(m.skin, COLOR.shadow, 0.08)} />;
  const eye: P2 = [faceSide * 0.83 * R, 0.0 * R];
  const blinkK = 1 - 0.85 * clamp01(m.blink);
  const swing = m.ponySwing ?? 0;
  const bobD = `M${f3(off * 1.25 - 1.1 * R)} ${f3(0.75 * R)}L${f3(off * 1.25 - 1.1 * R)} ${f3(-0.1 * R)}A${f3(1.1 * R)} ${f3(1.1 * R)} 0 0 1 ${f3(off * 1.25 + 1.1 * R)} ${f3(-0.1 * R)}L${f3(off * 1.25 + 1.1 * R)} ${f3(0.75 * R)}Q${f3(off * 1.25)} ${f3(0.86 * R)} ${f3(off * 1.25 - 1.1 * R)} ${f3(0.75 * R)}Z`;
  // the light's side: toward the TV (the room's middle), so the left viewer is lit on the right, the right on the left
  const ls = Math.max(-1, Math.min(1, (TV.cx - m.x) / 0.5));
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}tp`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-m.shoulder - 0.03)} x2="0" y2="-0.3">
          <stop offset="0" stopColor={topOf(m.top, 0.1)} />
          <stop offset="1" stopColor={footOf(m.top, 0.22)} />
        </linearGradient>
        <linearGradient id={`${uid}hr`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-R)} x2="0" y2={f3(R)}>
          <stop offset="0" stopColor={topOf(m.hair, 0.12)} />
          <stop offset="1" stopColor={footOf(m.hair, 0.14)} />
        </linearGradient>
        <radialGradient id={`${uid}fa`} gradientUnits="userSpaceOnUse" cx={f3(faceSide * 2.0 * R)} cy={f3(-0.6 * R)} r={f3(3.0 * R)}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(0.24 * am)} />
          <stop offset="0.45" stopColor={COLOR.amberTop} stopOpacity={f3(0.1 * am)} />
          <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}hc`}>
          <path d={circleD(0, 0, R)} />
        </clipPath>
        {/* the light's clips: the head's silhouette with its hair (the bob is 1.1 R wide), the torso */}
        <clipPath id={`${uid}hl`}>
          <path d={circleD(0, 0, R)} />
          {m.style === "bob" ? <path d={bobD} /> : null}
        </clipPath>
        <clipPath id={`${uid}tc`}>
          <path d={torso} />
        </clipPath>
        <radialGradient id={`${uid}hlg`} gradientUnits="userSpaceOnUse" cx={f3(ls * 1.4 * R)} cy={f3(-1.6 * R)} r={f3(3.4 * R)}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(0.24 * am)} />
          <stop offset="0.5" stopColor={COLOR.amberTop} stopOpacity={f3(0.1 * am)} />
          <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
        </radialGradient>
        <radialGradient
          id={`${uid}tl`}
          gradientUnits="userSpaceOnUse"
          cx={f3(m.x + ls * m.hw * 0.75)}
          cy={f3(-m.shoulder - 0.05)}
          r={f3(0.5)}
          gradientTransform={`translate(${f3(m.x + ls * m.hw * 0.75)} ${f3(-m.shoulder - 0.05)}) scale(1 0.55) translate(${f3(-(m.x + ls * m.hw * 0.75))} ${f3(m.shoulder + 0.05)})`}
        >
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(0.18 * am)} />
          <stop offset="0.55" stopColor={COLOR.amberTop} stopOpacity={f3(0.06 * am)} />
          <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
        </radialGradient>
      </defs>
      <Card c={c} z={m.z}>
        {/* the torso */}
        <path d={torso} fill={`url(#${uid}tp)`} />
        {/* the back of the neck */}
        <rect x={f3(hx - 0.045)} y={f3(-neckTop - 0.06)} width={0.09} height={0.1} rx={0.03} fill={mixHex(m.skin, COLOR.shadow, 0.12)} />
        <path d={`M${f3(m.x - m.hw * 0.42)} ${f3(-m.shoulder - 0.025)}Q${f3(m.x)} ${f3(-m.shoulder + 0.02)} ${f3(m.x + m.hw * 0.42)} ${f3(-m.shoulder - 0.025)}`} stroke={footOf(m.top, 0.2)} strokeWidth={0.012} fill="none" opacity={0.6} />
        {/* the head */}
        <g transform={`translate(${f3(hx)} ${f3(hy)}) rotate(${f3(m.tilt)} 0 ${f3(R * 0.9)})`}>
          {m.style === "crop" ? farEar : null}
          <path d={circleD(0, 0, R)} fill={m.skin} />
          {/* the screen's light on the turned cheek */}
          <g clipPath={`url(#${uid}hc)`}>
            {am > 0.002 ? <rect x={-1.2 * R} y={-1.2 * R} width={2.4 * R} height={2.4 * R} fill={`url(#${uid}fa)`} /> : null}
          </g>
          {/* the eye just on the cheek's contour, and the blush */}
          {Math.abs(t) > 0.25 ? (
            <>
              <circle cx={f3(faceSide * 0.78 * R)} cy={f3(0.36 * R)} r={f3(0.14 * R)} fill="#D9846E" opacity={0.4} />
              <ellipse cx={f3(eye[0])} cy={f3(eye[1])} rx={f3(0.07 * R)} ry={f3(0.085 * R * blinkK)} fill={COLOR.inkDark} />
            </>
          ) : null}
          {/* hair over the back of the head */}
          {m.style === "crop" ? (
            <g clipPath={`url(#${uid}hc)`}>
              <path d={hairBack} fill={`url(#${uid}hr)`} />
            </g>
          ) : null}
          {m.style === "crop" ? nearEar : null}
          {m.style === "bob" ? (
            <path d={bobD} fill={`url(#${uid}hr)`} />
          ) : null}
          {m.style === "pony" ? (
            <>
              {/* two pigtails, one each side, swinging a little; hair parted down the middle of the back */}
              {[-1, 1].map((sd) => (
                <g key={sd} transform={`rotate(${f3(sd * 8 + swing)} ${f3(sd * 0.82 * R)} ${f3(-0.05 * R)})`}>
                  <path
                    d={`M${f3(sd * 0.78 * R)} ${f3(-0.2 * R)}C${f3(sd * 1.45 * R)} ${f3(-0.25 * R)} ${f3(sd * 1.62 * R)} ${f3(0.45 * R)} ${f3(sd * 1.42 * R)} ${f3(0.95 * R)}C${f3(sd * 1.3 * R)} ${f3(0.62 * R)} ${f3(sd * 1.0 * R)} ${f3(0.25 * R)} ${f3(sd * 0.8 * R)} ${f3(0.12 * R)}Z`}
                    fill={`url(#${uid}hr)`}
                  />
                  <ellipse cx={f3(sd * 0.92 * R)} cy={f3(-0.05 * R)} rx={f3(0.13 * R)} ry={f3(0.17 * R)} fill={CLOTH.sage} transform={`rotate(${f3(sd * 20)} ${f3(sd * 0.92 * R)} ${f3(-0.05 * R)})`} />
                </g>
              ))}
              <g clipPath={`url(#${uid}hc)`}>
                <path d={circleD(0, -0.06 * R, 1.0 * R)} fill={`url(#${uid}hr)`} />
                <path d={`M0 ${f3(-1.1 * R)}L0 ${f3(0.6 * R)}`} stroke={topOf(m.hair, 0.22)} strokeWidth={f3(0.05 * R)} />
              </g>
            </>
          ) : null}
        </g>
      </Card>
      {/* the screen's light: a soft amber wash on the screen-facing side of the head and the shoulders (gradient
          light, no strokes), one bloom over it. The light comes from the TV, ahead and toward the room's middle. */}
      {am > 0.002 ? (
        <Card c={c} z={m.z} style={{ filter: bloomFilter(k * LIGHT_BLOOM_K) }}>
          <g clipPath={`url(#${uid}tc)`} style={{ mixBlendMode: "screen" }}>
            <rect x={f3(m.x - m.hw - 0.05)} y={f3(-m.shoulder - 0.1)} width={f3(2 * m.hw + 0.1)} height={0.5} fill={`url(#${uid}tl)`} />
          </g>
          <g transform={`translate(${f3(hx)} ${f3(hy)}) rotate(${f3(m.tilt)} 0 ${f3(R * 0.9)})`}>
            <g clipPath={`url(#${uid}hl)`}>
              <rect x={f3(-1.3 * R)} y={f3(-1.3 * R)} width={f3(2.6 * R)} height={f3(2.6 * R)} fill={`url(#${uid}hlg)`} />
            </g>
          </g>
        </Card>
      ) : null}
    </g>
  );
};

/** the pointing arm. One clean rise: the whole arm lives in ONE vertical plane through the shoulder, turned toward
 *  the screen (`az`, ~17 deg out from straight ahead), so seen from behind it lifts almost straight up beside her and
 *  the elbow can never flare out sideways. Its elevation eases from hanging (behind the sofa back) to the point; the
 *  elbow bend eases from soft to nearly straight, the elbow always under the shoulder-hand line. Each joint is
 *  projected at its own depth; the arm is drawn BEHIND her (it reaches away from the camera). */
export const ARM = { upper: 0.27, fore: 0.26, el0: -1.38, bend0: 0.5, bend1: 0.09 } as const;
export const armJoints = (m: Member) => {
  if (!m.point) return null;
  const u = clamp01(m.point.u);
  const e = u * u * u * (u * (6 * u - 15) + 10); // smootherstep: one eased rise, no overshoot
  const S3: [number, number, number] = [m.x + m.hw - 0.05, m.shoulder - 0.05, m.z + 0.02];
  const tgt = m.point.hand;
  const az = Math.atan2(tgt[0] - S3[0], tgt[2] - S3[2]);
  const elF = Math.atan2(tgt[1] - S3[1], Math.hypot(tgt[0] - S3[0], tgt[2] - S3[2]));
  const el = ARM.el0 + (elF - ARM.el0) * e;
  const b = ARM.bend0 + (ARM.bend1 - ARM.bend0) * e;
  const dir = (a: number): [number, number, number] => [Math.cos(a) * Math.sin(az), Math.sin(a), Math.cos(a) * Math.cos(az)];
  const du = dir(el - b);
  const df = dir(el + b);
  const E3: [number, number, number] = [S3[0] + ARM.upper * du[0], S3[1] + ARM.upper * du[1], S3[2] + ARM.upper * du[2]];
  const W3: [number, number, number] = [E3[0] + ARM.fore * df[0], E3[1] + ARM.fore * df[1], E3[2] + ARM.fore * df[2]];
  return { S3, E3, W3, e };
};
const PointingArm: React.FC<{ c: RoomCam; m: Member; amber: number }> = ({ c, m, amber }) => {
  const uid = uidOf(useId());
  const J = armJoints(m);
  if (!J || J.e <= 0.0005) return null;
  const sh = project(c, ...J.S3);
  const E = project(c, ...J.E3);
  const W = project(c, ...J.W3);
  const k = kAt(c, m.z);
  const kh = kAt(c, J.W3[2]);
  const sleeve = mixHex(m.top, COLOR.shadow, 0.06);
  const aw = 0.085 * k;
  const hr = 0.05 * kh;
  // the index finger points from the hand toward the screen's centre, uncurling as the arm rises
  const tvc = project(c, TV.cx, TV.cy, TV.z);
  const dx = tvc[0] - W[0];
  const dy = tvc[1] - W[1];
  const dl = Math.hypot(dx, dy) || 1;
  const fl = 0.055 * kh * J.e;
  const tip: P2 = [W[0] + (dx / dl) * (hr + fl), W[1] + (dy / dl) * (hr + fl)];
  const am = clamp01(amber);
  // the screen's light on the raised hand and forearm: a soft wash from the screen's side, no stroke
  const lx = W[0] + (dx / dl) * hr * 0.9;
  const ly = W[1] + (dy / dl) * hr * 0.9;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <radialGradient id={`${uid}hl`} gradientUnits="userSpaceOnUse" cx={f3(lx)} cy={f3(ly)} r={f3(hr * 2.6)}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(0.4 * am)} />
          <stop offset="0.5" stopColor={COLOR.amberTop} stopOpacity={f3(0.14 * am)} />
          <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}hc`}>
          <circle cx={f3(W[0])} cy={f3(W[1])} r={f3(hr)} />
        </clipPath>
      </defs>
      <path d={`M${f3(sh[0])} ${f3(sh[1])}L${f3(E[0])} ${f3(E[1])}L${f3(W[0])} ${f3(W[1])}`} stroke={sleeve} strokeWidth={f3(aw)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M${f3(W[0])} ${f3(W[1])}L${f3(tip[0])} ${f3(tip[1])}`} stroke={m.skin} strokeWidth={f3(hr * 0.85)} strokeLinecap="round" />
      <circle cx={f3(W[0])} cy={f3(W[1])} r={f3(hr)} fill={m.skin} />
      {am > 0.002 ? (
        <g style={{ filter: bloomFilter(LIGHT_BLOOM_K) }}>
          <g clipPath={`url(#${uid}hc)`}>
            <circle cx={f3(W[0])} cy={f3(W[1])} r={f3(hr * 2.6)} fill={`url(#${uid}hl)`} />
          </g>
        </g>
      ) : null}
    </svg>
  );
};

/** the sofa from behind: the arms' tops (farther, they show above the back's ends), the back panel, the screen light on its top */
const SofaBack: React.FC<{ c: RoomCam; amber: number }> = ({ c, amber }) => {
  const uid = uidOf(useId());
  const Sf = ROOM.sofa;
  const k = kAt(c, Sf.zb);
  const quad = (pts: P2[]) => `M${pts.map((p) => `${f3(p[0])} ${f3(p[1])}`).join("L")}Z`;
  const am = clamp01(amber);
  void quad;
  const ax = Sf.hw - Sf.armW;
  const sil =
    `M${f3(-Sf.hw)} -0.06L${f3(-Sf.hw)} ${f3(-Sf.armH + 0.07)}Q${f3(-Sf.hw)} ${f3(-Sf.armH)} ${f3(-Sf.hw + 0.07)} ${f3(-Sf.armH)}L${f3(-ax)} ${f3(-Sf.armH)}` +
    `L${f3(-ax)} ${f3(-Sf.backH + 0.1)}Q${f3(-ax)} ${f3(-Sf.backH)} ${f3(-ax + 0.1)} ${f3(-Sf.backH)}L${f3(ax - 0.1)} ${f3(-Sf.backH)}Q${f3(ax)} ${f3(-Sf.backH)} ${f3(ax)} ${f3(-Sf.backH + 0.1)}` +
    `L${f3(ax)} ${f3(-Sf.armH)}L${f3(Sf.hw - 0.07)} ${f3(-Sf.armH)}Q${f3(Sf.hw)} ${f3(-Sf.armH)} ${f3(Sf.hw)} ${f3(-Sf.armH + 0.07)}L${f3(Sf.hw)} -0.06Z`;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <clipPath id={`${uid}c`}>
          <path d={sil} />
        </clipPath>
        {/* the screen's light on the sofa's top: strongest at the back's top, fading down the panel; weaker on the arms */}
        <linearGradient id={`${uid}l`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-Sf.backH)} x2="0" y2={f3(-Sf.backH + 0.2)}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(0.4 * am)} />
          <stop offset="0.35" stopColor={COLOR.amberTop} stopOpacity={f3(0.15 * am)} />
          <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}la`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-Sf.armH)} x2="0" y2={f3(-Sf.armH + 0.14)}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity={f3(0.26 * am)} />
          <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${uid}lx`} gradientUnits="userSpaceOnUse" cx="0" cy={f3(-Sf.backH)} r={f3(Sf.hw * 1.15)}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0.8" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.35" />
        </radialGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={-2} y={-2} width={4} height={2.2}>
          <rect x={-2} y={-2} width={4} height={2.2} fill={`url(#${uid}lx)`} />
        </mask>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-Sf.backH)} x2="0" y2={-0.05}>
          {/* the back panel faces away from the screen and the lamp: cream only along its lit top, falling into the
              room's shade below, so the sofa recedes and the TV and the family carry the frame */}
          <stop offset="0" stopColor={COLOR.creamFoot} />
          <stop offset="0.08" stopColor={ROOM_COLOR.sofaMid} />
          <stop offset="0.32" stopColor={ROOM_COLOR.sofaFoot} />
          <stop offset="1" stopColor={mixHex(ROOM_COLOR.sofaFoot, COLOR.ground, 0.3)} />
        </linearGradient>
      </defs>
      <Card c={c} z={Sf.zb}>
        <path d={sil} fill={`url(#${uid}b)`} />
        {/* the arms' inner seams (soft tuck lines) */}
        {[-1, 1].map((sd) => (
          <path key={sd} d={`M${f3(sd * ax)} ${f3(-Sf.armH + 0.02)}L${f3(sd * ax)} -0.12`} stroke={mixHex(COLOR.creamFoot, COLOR.board, 0.45)} strokeWidth={0.008} opacity={0.6} />
        ))}
        <rect x={-Sf.hw + 0.06} y={-0.06} width={0.05} height={0.06} fill={ROOM_COLOR.woodDark} />
        <rect x={Sf.hw - 0.11} y={-0.06} width={0.05} height={0.06} fill={ROOM_COLOR.woodDark} />
      </Card>
      {/* the screen's light on the sofa's top (gradient light, no strokes; brightest toward the middle, facing the TV) */}
      {am > 0.002 ? (
        <Card c={c} z={Sf.zb} style={{ filter: bloomFilter(k * LIGHT_BLOOM_K) }}>
          <g clipPath={`url(#${uid}c)`} mask={`url(#${uid}m)`}>
            <rect x={f3(-ax)} y={f3(-Sf.backH)} width={f3(2 * ax)} height={0.22} fill={`url(#${uid}l)`} />
            <rect x={f3(-Sf.hw)} y={f3(-Sf.armH)} width={f3(Sf.armW + 0.001)} height={0.16} fill={`url(#${uid}la)`} />
            <rect x={f3(ax - 0.001)} y={f3(-Sf.armH)} width={f3(Sf.armW + 0.001)} height={0.16} fill={`url(#${uid}la)`} />
          </g>
        </Card>
      ) : null}
    </svg>
  );
};

export const RoomFront: React.FC<{ c: RoomCam; family: Member[]; amber: number }> = ({ c, family, amber }) => {
  // far to near (the members sit at nearly one depth: draw the ones further away first)
  const order = family.slice().sort((a, b) => b.z - a.z);
  return (
    <>
      {order.map((m, i) => (
        <React.Fragment key={i}>
          <PointingArm c={c} m={m} amber={amber} />
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <Viewer c={c} m={m} amber={amber} />
          </svg>
        </React.Fragment>
      ))}
      <SofaBack c={c} amber={amber} />
    </>
  );
};

/** the kit's vignette and grain on twos (as StoutStage / TrackStage) */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const RoomFinish: React.FC<{ S: number }> = ({ S }) => {
  const g2 = GRAIN.onTwos ? Math.floor(S / 2) : S;
  const grx = (hash(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash(g2 + 7) * 2 - 1) * GRAIN.travel;
  return (
    <>
      <AbsoluteFill style={{ background: VIGNETTE }} />
      <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
        <Img src={staticFile(GROUND.grain)} style={{ position: "absolute", left: (1080 - GROUND.W) / 2 + grx, top: (1920 - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }} />
      </AbsoluteFill>
    </>
  );
};

export { SKIN, HAIR, CLOTH };
