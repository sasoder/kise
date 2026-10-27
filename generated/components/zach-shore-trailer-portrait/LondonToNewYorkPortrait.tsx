// LondonToNewYorkPortrait | Zach Shore trailer | opaque1080x1920 | 90 frames at24000/1001.
// CHECK LINE: the fast uncrewed jet is already in New York while the airliner has barely left Britain.
// SPOKEN LINE: "You would get London to New York in about90 minutes."
// WORD -> FRAME retained from the accepted wide: London13, New35, York38, in44, about47,90=51,minutes60.
// DURATION: final native slot7.8411667–11.5949167 =90 frames. No timeline/caption timing is regenerated here.
// MOTION: the portrait camera begins near London and opens west fromf0; both aircraft depart onf13.
// The jet lands nose-on atNew York onf58 while the airliner is20% across; both places remain visible throughf89.
// Portrait-specific layout: full-height natural land map on TallPaper, camera1.06->.60 with a late .625creep;
// 250-world-px aircraft become150screenpx at payoff, city labels86worldpx (~52screenpx), Londonabove-left,
// NewYorkbelow-right. Important marks stay above the1080–1250 and1360–1460 caption bands. No chain, per accepted cut.
// SOURCES/DEPENDENCIES: portrait-extended Natural Earth1:50m land via LondonPortraitMapData.ts;
// accepted wide city/route data via atlanticMapData.ts (identical projection/origin),
// actual London51.5072N/0.1276W and NewYork40.7128N/74.006W. Route arc is stylised, not a precise great circle.
// Airliner comparison retained from the approved wide:1.5h/7.5h=20%; no numeric claim is newly typeset.
// Shared aircraft geometry is imported read-only from zachShared.tsx; portrait ground/type/palette from deathCountShared.
// This is a recomposed world/camera/typography, not a scaled or cropped2048x1080 composition.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLACK,
  INK,
  OP_LOW,
  OP_MID,
  TallPaper,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  camEase,
  runCamera2,
  sway,
  textRise,
  type,
} from "../kits/core-memory/deathCountShared";
import { AIRLINER_TOP, JET_LEN, JET_TOP_D, glyphAt } from "../zach-shore-trailer/zachShared";
import { LONDON_XY, NEW_YORK_XY, ROUTE_CUM, ROUTE_LEN, ROUTE_PTS } from "../zach-shore-trailer/atlanticMapData";

import { LAND_PATH } from "./LondonPortraitMapData";

export const FPS = 24000 / 1001;
export const DURATION = 90;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const W = 1080;
const H = 1920;
const FOCUS_Y = 890;

// -- glyph sizes (world px): stylised, 150 SCREEN px long at the resolved k 0.60, the same length for both ------
const JET_SCALE = 250 / JET_LEN;
const AIR_SCALE = 250 / JET_LEN;

// -- beats --------------------------------------------------------------------
const F_DEPART = 13; // "London"
const F_LON_LABEL = 13;
const F_NY_LABEL = 35; // "New"
const F_ARRIVE = 58; // lands just before "minutes" f60
const ACCEL = 4; // frames from rest to cruise
const DECEL = 12; // frames of constant deceleration into the pin

// Both aircraft sit centred on London at f0 (the pin drawn over the jet), and the jet stops with its nose ON the
// New York pin, so the pin and the whole jet read: the jet's centre travels 0 .. ROUTE_LEN - HALF.
const HALF = (JET_LEN * JET_SCALE) / 2; // half the jet's world length
const J0 = 0;
const JET_TRAVEL = ROUTE_LEN - HALF - J0;
// the jet's speed profile: TRAVEL = v (ACCEL/2 + cruise + DECEL/2)
const FLIGHT = F_ARRIVE - F_DEPART; // 45
const CRUISE = FLIGHT - ACCEL - DECEL;
export const JET_V = JET_TRAVEL / (ACCEL / 2 + CRUISE + DECEL / 2); // world px / frame at cruise
const jetS = (f: number) => {
  const t = f - F_DEPART;
  if (t <= 0) return J0;
  if (t < ACCEL) return J0 + (JET_V * t * t) / (2 * ACCEL);
  if (t < ACCEL + CRUISE) return J0 + JET_V * (ACCEL / 2 + (t - ACCEL));
  if (t < FLIGHT) {
    const u = FLIGHT - t; // frames left
    return J0 + JET_TRAVEL - (JET_V * u * u) / (2 * DECEL);
  }
  return J0 + JET_TRAVEL;
};

// the airliner: constant speed from "London", 20 % of the route when the jet lands
export const AIRLINER_FRACTION_AT_ARRIVAL = 1.5 / 7.5;
// TANDEM START: the airliner sits directly behind the jet ON the route line's start, east of London (its centre
// AIR_S0 world px back along the line's backward extension: the two bodies AIR_GAP apart), and flies at one
// constant speed that puts it at 20 % of the route when the jet stops.
const AIR_GAP = 12;
const AIR_S0 = -(2 * ((JET_LEN * AIR_SCALE) / 2) + AIR_GAP);
const AIR_V = (AIRLINER_FRACTION_AT_ARRIVAL * ROUTE_LEN - AIR_S0) / FLIGHT;
const airS = (f: number) => AIR_S0 + Math.max(0, f - F_DEPART) * AIR_V;
// it starts ON the line (AIR_OFF0 0) and eases into a parallel lane AIR_OFF1 world px to the LEFT of the route
// (south of it; its wing tip just clear of the drawn line) over AIR_MERGE
const AIR_OFF0 = 0;
const AIR_OFF1 = 150;
const AIR_MERGE = { f0: F_DEPART, f1: 34 };

// -- the route ------------------------------------------------------------------
const routeAt = (s: number) => {
  if (s < 0) {
    // behind London: the line's start extended straight back (where the airliner waits in tandem)
    const a = ROUTE_PTS[0];
    const b = ROUTE_PTS[1];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { x: a[0] + ((b[0] - a[0]) / l) * s, y: a[1] + ((b[1] - a[1]) / l) * s, i: 0 };
  }
  const c = Math.max(0, Math.min(ROUTE_LEN, s));
  let i = 0;
  while (i < ROUTE_CUM.length - 2 && ROUTE_CUM[i + 1] < c) i++;
  const seg = ROUTE_CUM[i + 1] - ROUTE_CUM[i];
  const u = seg > 0 ? (c - ROUTE_CUM[i]) / seg : 0;
  const a = ROUTE_PTS[i];
  const b = ROUTE_PTS[i + 1];
  return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, i };
};
const headingAt = (s: number) => {
  const a = routeAt(s - 6);
  const b = routeAt(s + 6);
  const tx = b.x - a.x;
  const ty = b.y - a.y;
  const l = Math.hypot(tx, ty) || 1;
  return { tx: tx / l, ty: ty / l, deg: (Math.atan2(ty, tx) * 180) / Math.PI };
};
/** the drawn route from London to arc length s */
const routeD = (s: number) => {
  if (s <= 0.5) return null;
  const end = routeAt(s);
  const pts: string[] = [];
  for (let j = 0; j <= end.i; j++) pts.push(`${ROUTE_PTS[j][0]} ${ROUTE_PTS[j][1]}`);
  pts.push(`${end.x.toFixed(2)} ${end.y.toFixed(2)}`);
  return `M${pts.join(" L")}`;
};

const airPos = (f: number) => {
  const sa = airS(f);
  const p = routeAt(sa);
  const h = headingAt(Math.max(6, sa));
  const u = Math.max(0, Math.min(1, (f - AIR_MERGE.f0) / (AIR_MERGE.f1 - AIR_MERGE.f0)));
  const off = AIR_OFF0 + (AIR_OFF1 - AIR_OFF0) * u * u * (3 - 2 * u);
  return { x: p.x + h.ty * off, y: p.y - h.tx * off };
};

// -- pins and portrait labels (world px) -------------------------------------------------------
const PIN_R = 15;
const PIN_D = 33; // tip to head centre
const PIN_HOLE = 5.5;
const PIN_TAN = { x: PIN_R * Math.sin(Math.PI / 3), y: -PIN_D + PIN_R * Math.cos(Math.PI / 3) };
const pinD = (x: number, y: number) =>
  `M${x} ${y} L${x + PIN_TAN.x} ${y + PIN_TAN.y} A${PIN_R} ${PIN_R} 0 1 0 ${x - PIN_TAN.x} ${y + PIN_TAN.y} Z`;
const LAND_OP = OP_MID; // the style's dim rung (0.55), the director's ~0.6
const LABEL_SIZE = 86;
const LON_LABEL = { x: LONDON_XY.x - 22, y: LONDON_XY.y - 155, anchor: "end" as const }; // above-left of London, independently placed for the portrait width
const NY_LABEL = { x: NEW_YORK_XY.x + 20, y: NEW_YORK_XY.y + 112, anchor: "start" as const };

// -- the camera: portrait pull-back + pan f0-48, then a creep toward New York ------------
const K0 = 1.06;
const K1 = 0.60;
const K2 = 0.625;
const C0 = { x: LONDON_XY.x, y: -42 };
const C1 = { x: 0, y: 125 };
const C2 = { x: -28, y: 125 };
const MOVE = { f0: 0, f1: 42, warp: 1.1 };
const CAM_F: number[] = [];
const CAM_CX: number[] = [];
const CAM_CY: number[] = [];
const CAM_K: number[] = [];
for (let f = 0; f <= DURATION + 2; f++) {
  let k: number;
  let x: number;
  let y: number;
  if (f <= MOVE.f1) {
    const e = camEase((f - MOVE.f0) / (MOVE.f1 - MOVE.f0), MOVE.warp);
    k = Math.exp(Math.log(K0) + (Math.log(K1) - Math.log(K0)) * e);
    x = C0.x + (C1.x - C0.x) * e;
    y = C0.y + (C1.y - C0.y) * e;
  } else {
    const e = (f - MOVE.f1) / (DURATION - MOVE.f1);
    k = K1 + (K2 - K1) * e;
    x = C1.x + (C2.x - C1.x) * e;
    y = C1.y + (C2.y - C1.y) * e;
  }
  CAM_F.push(f);
  CAM_CX.push(x);
  CAM_CY.push(y);
  CAM_K.push(k);
}

/** A map label in black print (Barlow 800, no shadow: black on the white land is print, as in the Cerro
 *  opening), sliding up 24 screen px while it fades in over 12 frames (the kit's textRise). */
const PrintLabel: React.FC<{
  frame: number;
  f0: number;
  k: number;
  text: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
}> = ({ frame, f0, k, text, x, y, anchor }) => {
  const r = textRise(frame, f0, k);
  if (r.opacity <= 0) return null;
  return (
    <text x={x} y={y + r.dy} textAnchor={anchor} fill={BLACK} opacity={r.opacity} style={type(LABEL_SIZE, 800)}>
      {text}
    </text>
  );
};

/** Analytical review metadata, exported for the director's render checks. All values are SCREEN px.
 * Circumscribed aircraft boxes are conservative; text boxes include the whole entrance rise. */
export const portraitGeometry = (frame: number) => {
  const cam = runCamera2(frame, CAM_F, CAM_CY, CAM_CX, CAM_K);
  const drift = sway(frame);
  const screen = (p: { x: number; y: number }) => ({
    x: W / 2 + (p.x - cam.cx) * cam.k + drift.dx,
    y: FOCUS_Y + (p.y - cam.cy) * cam.k + drift.dy,
  });
  const jet = screen(routeAt(jetS(frame)));
  const airliner = screen(airPos(frame));
  const radius = (JET_LEN * JET_SCALE / 2 + SHADOW_OFF + STROKE) * cam.k;
  const boxes = [
    { name: "jet", left: jet.x - radius, right: jet.x + radius, top: jet.y - radius, bottom: jet.y + radius },
    { name: "airliner", left: airliner.x - radius, right: airliner.x + radius, top: airliner.y - radius, bottom: airliner.y + radius },
    ...[LONDON_XY, NEW_YORK_XY].map((p, i) => {
      const q = screen(p);
      return { name: i ? "New York pin" : "London pin", left: q.x - PIN_R * cam.k, right: q.x + PIN_R * cam.k,
        top: q.y - (PIN_D + PIN_R) * cam.k, bottom: q.y };
    }),
  ];
  for (const [label, f0, text] of [[LON_LABEL, F_LON_LABEL, "LONDON"], [NY_LABEL, F_NY_LABEL, "NEW YORK"]] as const) {
    if (frame < f0) continue;
    const q = screen(label);
    const rise = textRise(frame, f0, cam.k);
    const width = text.length * LABEL_SIZE * .76 * cam.k;
    const left = label.anchor === "end" ? q.x - width : q.x;
    boxes.push({ name: text, left, right: left + width,
      top: q.y + rise.dy * cam.k - LABEL_SIZE * cam.k, bottom: q.y + rise.dy * cam.k + LABEL_SIZE * .25 * cam.k });
  }
  return { frame, camera: cam, jet, airliner, boxes };
};

export const PORTRAIT_SAFETY = Array.from({ length: DURATION }, (_, frame) => {
  const g = portraitGeometry(frame);
  const visible = g.boxes.filter((b) => b.right > 0 && b.left < W);
  for (const box of visible) {
    if (box.bottom >= 1080) throw new Error(`Portrait caption collision at frame${frame}: ${box.name} bottom${box.bottom}`);
  }
  return { frame, lowestImportantPixel: Math.max(...visible.map((b) => b.bottom)) };
});

const LondonToNewYorkPortrait: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = runCamera2(frame, CAM_F, CAM_CY, CAM_CX, CAM_K);
  const s = sway(frame);
  const transform = `translate(${W / 2 - cx * k + s.dx}px, ${FOCUS_Y - cy * k + s.dy}px) scale(${k})`;

  // the jet
  const sj = jetS(frame);
  const pj = routeAt(sj);
  const hj = headingAt(Math.max(6, Math.min(ROUTE_LEN - 6, sj)));
  const jetPlace = { x: pj.x, y: pj.y, angle: hj.deg, scale: JET_SCALE };
  const lineD = routeD(sj);

  // the airliner: beside the jet at London, merging onto the drawn route behind it; it points where it goes
  const a0 = airPos(frame - 0.5);
  const a1 = airPos(frame + 0.5);
  const pa = airPos(frame);
  const airDeg = frame > F_DEPART ? (Math.atan2(a1.y - a0.y, a1.x - a0.x) * 180) / Math.PI : headingAt(6).deg;
  const airPlace = { x: pa.x, y: pa.y, angle: airDeg, scale: AIR_SCALE };

  return (
    <AbsoluteFill>
      <TallPaper frame={frame} cx={cx} cy={cy} cxRest={(C0.x + C1.x) / 2} cyRest={(C0.y + C1.y) / 2} k={k} />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform }}>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {/* THE LAND, receded (director, final revision): white at LAND_OP over the paper so the white jet always
              separates from it, on its hard shadow at FULL black, masked out from under the land itself so the
              coastlines stay crisp and the dimmed land never shows its own shadow through it */}
          <defs>
            <mask id="l2nyp-land-shadow" maskUnits="userSpaceOnUse" x={-3000} y={-3000} width={6000} height={6000}>
              <rect x={-3000} y={-3000} width={6000} height={6000} fill="#FFFFFF" />
              <path d={LAND_PATH} fill="#000000" />
            </mask>
          </defs>
          <g mask="url(#l2nyp-land-shadow)">
            <path d={LAND_PATH} fill={SHADOW} transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`} />
          </g>
          <path d={LAND_PATH} fill={INK} opacity={LAND_OP} />

          {/* THE ROUTE, drawn by the jet's tip: a BLACK printed line (black on white is print; no shadow), so it
              reads over land and sea alike */}
          {lineD ? (
            <path d={lineD} fill="none" stroke={BLACK} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
          ) : null}

          {/* THE AIRLINER, dimmed: the comparison */}
          {/* its hard shadow at full black but only OUTSIDE its own body (so it reads on the white land at London
              without turning the dimmed body grey), its body at OP_LOW */}
          <defs>
            <mask id="l2nyp-air-shadow" maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={8000} height={8000}>
              <rect x={-4000} y={-4000} width={8000} height={8000} fill="#FFFFFF" />
              {glyphAt(AIRLINER_TOP, airPlace, "#000000")}
            </mask>
          </defs>
          <g mask="url(#l2nyp-air-shadow)">{glyphAt(AIRLINER_TOP, airPlace, SHADOW, { dx: SHADOW_OFF, dy: SHADOW_OFF })}</g>
          <g opacity={OP_LOW}>{glyphAt(AIRLINER_TOP, airPlace, INK)}</g>

          {/* THE JET on its hard shadow (no chain in this cut) */}
          {glyphAt(JET_TOP_D, jetPlace, SHADOW, { dx: SHADOW_OFF, dy: SHADOW_OFF })}
          {glyphAt(JET_TOP_D, jetPlace, INK)}

          {/* THE PINS: black map ink on the white land, white eye, no shadow, no crown; over the
              aircraft, so the planted pin always reads */}
          {[LONDON_XY, NEW_YORK_XY].map((p, i) => (
            <g key={i}>
              <path d={pinD(p.x, p.y)} fill={BLACK} />
              <circle cx={p.x} cy={p.y - PIN_D} r={PIN_HOLE} fill={INK} />
            </g>
          ))}

          {/* THE LABELS */}
          <PrintLabel frame={frame} f0={F_LON_LABEL} k={k} text="LONDON" {...LON_LABEL} />
          <PrintLabel frame={frame} f0={F_NY_LABEL} k={k} text="NEW YORK" {...NY_LABEL} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export default LondonToNewYorkPortrait;
