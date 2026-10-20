// ---------------------------------------------------------------------------
// LondonToNewYork (zach-shore-trailer, cut 8). Core memory podcast style (styles/core-memory.md).
// Opaque 2048x1080, 23.976 fps, 90 frames.
// The graphic standard: flat white glyphs on their hard black shadow on squared paper. Chain echo once, at the
// payoff in the style; this cut carries NO chain (see below). Core Memory edits carry burned-in captions: no label for what the speaker says (the two map
// labels LONDON / NEW YORK are the exception decided for this clip).
//
// CHECK LINE: "on this jet, London to New York is a short hop — it's already landed while a normal airliner has
// barely left the British coast."
//
// THE LINE: "You would get London to New York in about 90 minutes."
// WORD -> FRAME (local, from the slot start; whisper may run ~3 f early):
//   You -2 · would 2 · get 7 · London 13 · to 27 · New 35 · York 38 · in 44 · about 47 · 90 51 · minutes 60 ·
//   speech ends ~77 · cut back to the speaker at f90.
// DURATION: the slot 8.675333 -> 12.429083 s = sequence frames 208 -> 298 = 90 frames (f0..f89) at 24000/1001.
//
// THE MOTION (final, V2): a north-up Mercator map of the North Atlantic, the land white at OP_MID over the paper
// on its FULL black hard shadow (masked out from under the land, so coastlines stay crisp): the land recedes by the
// style's dim so the full-white jet always separates from it (measured at f89: jet 255 vs land under it ~230). The camera opens on London at k 1.3, Britain and the Channel coast around it: the
// uncrewed jet (top view) centred on the London pin (the pin drawn over it) and the dimmed airliner in TANDEM directly
// behind it, east of London (over Belgium), both on the route line's start. One move pulls back and pans west
// (keys f0-42, damped, landed ~f50) to the resolved framing (whole route in frame; NY pin in from ~f30). On "London"
// (f13) both depart: the jet's tip draws the route as a BLACK printed line (no shadow) at constant speed, decelerates
// and stops with its nose on the New York pin on f58, coming in from the ocean side (ENE -> WSW), its body resting
// over the New England coast by its hard shadow. The airliner flies one constant speed, easing off the line into a
// parallel lane just south of it (f13-34, wing tip clear of the line): 20 % of the route when the jet stops (its
// speed is set by that, from its tandem start 197 world px behind London, so it runs ~10.4 world px/f and reaches
// ~44 % at f89). f58-89: a slow creep toward New York (k 1.00 -> 1.05), the airliner still moving.
// THE ROUTE is STYLISED: one clean arc (a cubic Bezier, no inflection) bowing north far less than the true great
//   circle, on the sea south of Newfoundland and Nova Scotia (build-atlantic-map.mjs; GC_PTS is exported, not drawn).
// SIZE: both aircraft stylised at 185 world px long (= screen px at the resolved k 1.0). The airliner's body is at
//   OP_LOW (secondary: ~216 over the ~199 sea at f89, against the jet's 255), its hard shadow full black but masked
//   out from under its own body.
// NO CHAIN in this cut (director, pass 4): no trail, no crown. The payoff is the jet parked at New York while the
//   airliner is a fifth of the way across. The clip's chain (the jet's speed, zachShared legend) is cut C's.
//
// BEATS (local f)
//   f0      London pin planted, jet on it, airliner in tandem behind it; camera k 1.3, already easing back
//   f13     "London": both depart (jet: 4 f to cruise, ~36 world px/f); LONDON slides up above-right of the pin
//           (clear of the airliner passing along the line below it)
//   f35     "New": NEW YORK slides up below-right of the pin (on the sea), landed f47
//   f46-58  constant deceleration; speed 0 on f58 with the nose on the pin (before "minutes" f60)
//   f58     arrival; airliner at 20 % of the route (1.5 h of a ~7.5 h scheduled flight)
//   f58-89  creep; the airliner keeps crawling (no hold)
// LABELS: black print (Barlow 800, 40 world px, no shadow), as in the Cerro opening. Caption bands (y 607-703,
//   765-821) are clear of the pins, aircraft and labels on every camera state (checked f0..f89).
//
// SOURCES: land = Natural Earth 1:50m (node_modules/world-atlas land-50m.json) via
//   scripts/clips/zach-shore-trailer/build-atlantic-map.mjs -> atlanticMapData.ts. London 51.5072 N 0.1276 W, New York
//   40.7128 N 74.006 W; great circle 5570 km. Airliner ratio: ~7.5 h scheduled London -> New York (brief) vs 90 min
//   (the speaker) -> 20 %. No figure is typeset.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLACK,
  INK,
  OP_LOW,
  OP_MID,
  PaperGround,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  camEase,
  runCamera2,
  sway,
  textRise,
  type,
} from "../kits/core-memory/cerroShared";
import { AIRLINER_TOP, JET_LEN, JET_TOP_D, glyphAt } from "./zachShared";
import { LAND_PATH, LONDON_XY, NEW_YORK_XY, ROUTE_CUM, ROUTE_LEN, ROUTE_PTS } from "./atlanticMapData";

export const FPS = 24000 / 1001;
export const DURATION = 90;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const W = 2048;
const H = 1080;

// -- glyph sizes (world px): stylised, ~185 SCREEN px long at the resolved k 1.0, the same length for both ------
const JET_SCALE = 185 / JET_LEN;
const AIR_SCALE = 185 / JET_LEN;

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
const AIR_OFF1 = 98;
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

// -- pins and labels (world px) -------------------------------------------------------
const PIN_R = 15;
const PIN_D = 33; // tip to head centre
const PIN_HOLE = 5.5;
const PIN_TAN = { x: PIN_R * Math.sin(Math.PI / 3), y: -PIN_D + PIN_R * Math.cos(Math.PI / 3) };
const pinD = (x: number, y: number) =>
  `M${x} ${y} L${x + PIN_TAN.x} ${y + PIN_TAN.y} A${PIN_R} ${PIN_R} 0 1 0 ${x - PIN_TAN.x} ${y + PIN_TAN.y} Z`;
const LAND_OP = OP_MID; // the style's dim rung (0.55), the director's ~0.6
const LABEL_SIZE = 40;
const LON_LABEL = { x: LONDON_XY.x + 18, y: LONDON_XY.y - 98, anchor: "start" as const }; // above-right: clear of the airliner passing along the line
const NY_LABEL = { x: NEW_YORK_XY.x + 16, y: NEW_YORK_XY.y + 50, anchor: "start" as const };

// -- the camera: one pull-back + pan f0-48, then a creep toward New York ------------
const K0 = 1.3;
const K1 = 1.0;
const K2 = 1.05;
const C0 = { x: 700, y: 0 };
const C1 = { x: 0, y: 198 };
const C2 = { x: -55, y: 200 };
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

const LondonToNewYork: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = runCamera2(frame, CAM_F, CAM_CY, CAM_CX, CAM_K);
  const s = sway(frame);
  const transform = `translate(${W / 2 - cx * k + s.dx}px, ${H / 2 - cy * k + s.dy}px) scale(${k})`;

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
      <PaperGround frame={frame} cx={cx} cy={cy} cxRest={CAM_CX[0]} cyRest={CAM_CY[0]} k={k} />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform }}>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {/* THE LAND, receded (director, final revision): white at LAND_OP over the paper so the white jet always
              separates from it, on its hard shadow at FULL black, masked out from under the land itself so the
              coastlines stay crisp and the dimmed land never shows its own shadow through it */}
          <defs>
            <mask id="l2ny-land-shadow" maskUnits="userSpaceOnUse" x={-3000} y={-3000} width={6000} height={6000}>
              <rect x={-3000} y={-3000} width={6000} height={6000} fill="#FFFFFF" />
              <path d={LAND_PATH} fill="#000000" />
            </mask>
          </defs>
          <g mask="url(#l2ny-land-shadow)">
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
            <mask id="l2ny-air-shadow" maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={8000} height={8000}>
              <rect x={-4000} y={-4000} width={8000} height={8000} fill="#FFFFFF" />
              {glyphAt(AIRLINER_TOP, airPlace, "#000000")}
            </mask>
          </defs>
          <g mask="url(#l2ny-air-shadow)">{glyphAt(AIRLINER_TOP, airPlace, SHADOW, { dx: SHADOW_OFF, dy: SHADOW_OFF })}</g>
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

export default LondonToNewYork;
