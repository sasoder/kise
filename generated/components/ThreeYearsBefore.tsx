import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { fell } from "./incaShared";
import { ACCENT, ACCENT_DEEP, DARK, FRAME_H, FRAME_W, INK, INK_FULL, MapStack, PaperTop, SEA, camTransform, fellSC, screenOf, viewRect } from "./cortesShared";
import { DURATION, FPS, TEXCOCO, VOYAGE, cameraAt, columnsAt, shipS, wayAt, yearAt } from "./threeYearsMotion";
import { Carrack1519, SHIP_BOX } from "./threeYearsShip";

// ---------------------------------------------------------------------------
// ThreeYearsBefore (cut 1 of Si Sheppard "Texcoco"; file 1_ThreeYearsBefore).
// Dwarkesh map style on the Cortés world (cortesShared: north-up Lambert
// conic, the baked Gulf map). Opaque 1080x1920, 23.976 fps, 52 frames.
//
// CHECK LINE: "The fight over Texcoco started in 1516, and Cortés's ships only
// reached the Mexican coast three years later, in 1519."
//
// THE LINE (frames from the cut's first frame; "In 1516," is spoken just
// before it): three 0 · years 3 · before 6 · Cortés 13 · arrived 24 · in 33 ·
// Mesoamerica 35-50 · back to the speaker at 52.
//
// THE MOTION, one: frame 0 is a whole picture: Texcoco marked in orange on the
// east shore of its lake, a large cream 1516 in the upper third, and
// an engraved carrack already off Yucatán's north-west corner on a dashed wake that
// runs back off-frame towards Cuba. The ship sails her real route round the
// peninsula and down the Bay of Campeche to San Juan de Ulúa while the year's
// last wheel rolls 1516 -> 1517 -> 1518 -> 1519 with the voyage; the camera
// drifts west with her and pushes in (k 1.53 -> 1.72, tight on the western Gulf). She is at anchor and the
// year is 1519 by f36 ("arrived in Mesoamerica"); the last frames hold alive:
// she rocks, the wake creeps, the push carries on. The one label, CORTÉS,
// slides up over the ship for its word (in by f13).
//
// ORANGE = Texcoco (the clip's rule: Texcoco's own). Everything else is cream.
// The voyage is compressed symbolically: the three years are the wheel, the
// ship's passage itself took two months of 1519. The ship is far larger than
// map scale (a chess piece on the board).
// ---------------------------------------------------------------------------

export { DURATION, FPS };

export const schema = z.object({
  vignette: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const CLAMP = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// ---- sizes (screen px) -------------------------------------------------------
const SHIP_SIZE = 191; // px per 100 glyph units: ~196 px bowsprit to stern
const YEAR_SIZE = 380; // IM Fell English old-style figures: the short ones (1) ~173 px tall, the tall ones (6, 8) ~250 px
const YEAR_X = 540;
const YEAR_BASE = 545; // the figures' baseline
const CELL_W = 0.5 * YEAR_SIZE;
// the wheel's window = the figures' own line box: the top of the tall figures (6, 8) to the foot of the
// descending ones (5, 7, 9), feathered 6 px; the pitch is the window's height, so one figure leaves
// the top as the next enters the foot and nothing shows outside the line
const WIN_TOP = YEAR_BASE - 0.69 * YEAR_SIZE;
const WIN_H = 0.95 * YEAR_SIZE;
const PITCH = WIN_H;
const FEATHER = 6 / WIN_H;
const LABEL_SIZE = 50;
const LABEL_F0 = 5;

// ---- Texcoco: the one orange thing --------------------------------------------
const PATCH = { cx: TEXCOCO[0] + 11, cy: TEXCOCO[1] - 1, rx: 36, ry: 30 }; // world px: the Acolhua country east of the lake
const HATCH_GAP = 3.9;

const ThreeYearsBefore: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const { k } = cam;

  // the ship: her bow at the waterline rides the route
  const s = shipS(frame);
  const bowW = VOYAGE.pointAt(s);
  const [bx, by] = screenOf(bowW, cam);
  const way = wayAt(frame);
  const u = SHIP_SIZE / 100; // screen px per glyph unit

  // the wake: the route behind her, dashes creeping astern; it dies away under her hull
  const wakeD = VOYAGE.partialD(0, s);
  const v = viewRect(cam, 40);
  const maskC = { x: bowW[0] + (50 - 14 + 6) * (u / k), y: bowW[1] - 20 * (u / k) };
  const dash = 14 / k;
  const gap = 11 / k;
  const creep = (frame * 0.55) / k;

  // the label, for its word
  const lDy = interpolate(frame, [LABEL_F0, 13], [24, 0], { easing: Easing.bezier(0.16, 1, 0.3, 1), ...CLAMP });
  const lOp = interpolate(frame, [LABEL_F0, 11], [0, 1], CLAMP);
  const labelX = bx + ((SHIP_BOX.x0 + SHIP_BOX.x1) / 2) * u + 4;
  const labelY = by + SHIP_BOX.y0 * u - 26;

  // the year's last wheel: figure d stands at position d; the next one rolls up from below
  const wheel = columnsAt(frame)[0];
  const wheelDigit = Math.min(9, Math.floor(wheel + 1e-6));
  const wheelFrac = wheel - wheelDigit;
  const wheelSpeed = Math.abs(yearAt(frame + 0.5) - yearAt(frame - 0.5)) * PITCH; // px per frame
  const wheelBlur = Math.min(5, 0.1 * Math.max(0, wheelSpeed - 20));

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <pattern id="tyb-hatch" patternUnits="userSpaceOnUse" width={HATCH_GAP} height={HATCH_GAP} patternTransform="rotate(45)">
            <line x1={HATCH_GAP / 2} y1={-1} x2={HATCH_GAP / 2} y2={HATCH_GAP + 1} stroke={ACCENT} strokeWidth={1.3} />
          </pattern>
          <radialGradient id="tyb-soft">
            <stop offset="0" stopColor="#fff" stopOpacity={1} />
            <stop offset="0.62" stopColor="#fff" stopOpacity={0.95} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="tyb-hide">
            <stop offset="0" stopColor="#000" stopOpacity={1} />
            <stop offset="0.72" stopColor="#000" stopOpacity={1} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </radialGradient>
          <mask id="tyb-patch" maskUnits="userSpaceOnUse" x={PATCH.cx - PATCH.rx} y={PATCH.cy - PATCH.ry} width={2 * PATCH.rx} height={2 * PATCH.ry}>
            <ellipse cx={PATCH.cx} cy={PATCH.cy} rx={PATCH.rx} ry={PATCH.ry} fill="url(#tyb-soft)" />
          </mask>
          <mask id="tyb-wake" maskUnits="userSpaceOnUse" x={v.x0} y={v.y0} width={v.x1 - v.x0} height={v.y1 - v.y0}>
            <rect x={v.x0} y={v.y0} width={v.x1 - v.x0} height={v.y1 - v.y0} fill="#fff" />
            <ellipse cx={maskC.x} cy={maskC.y} rx={(74 * u) / k} ry={(50 * u) / k} fill="url(#tyb-hide)" />
          </mask>
        </defs>
        <g transform={camTransform(cam).svg}>
          {/* Texcoco: a soft orange hatch on its country, a ring and a dot on the town */}
          <g mask="url(#tyb-patch)">
            <rect x={PATCH.cx - PATCH.rx} y={PATCH.cy - PATCH.ry} width={2 * PATCH.rx} height={2 * PATCH.ry} fill={ACCENT_DEEP} fillOpacity={0.26} />
            <rect x={PATCH.cx - PATCH.rx} y={PATCH.cy - PATCH.ry} width={2 * PATCH.rx} height={2 * PATCH.ry} fill="url(#tyb-hatch)" opacity={0.9} />
          </g>
          <circle cx={TEXCOCO[0]} cy={TEXCOCO[1]} r={23 / k} fill={DARK} fillOpacity={0.42} stroke={DARK} strokeOpacity={0.6} strokeWidth={8 / k} />
          <circle cx={TEXCOCO[0]} cy={TEXCOCO[1]} r={23 / k} fill="none" stroke={ACCENT} strokeWidth={4.6 / k} />
          <circle cx={TEXCOCO[0]} cy={TEXCOCO[1]} r={10 / k} fill={ACCENT} stroke={DARK} strokeOpacity={0.75} strokeWidth={2 / k} />
          {/* the wake back to Cuba */}
          <g mask="url(#tyb-wake)" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={wakeD} stroke={DARK} strokeOpacity={0.5} strokeWidth={6.2 / k} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={creep} />
            <path d={wakeD} stroke={INK} strokeOpacity={0.86} strokeWidth={3.2 / k} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={creep} />
          </g>
        </g>
        <Carrack1519 x={bx} y={by} size={SHIP_SIZE} frame={frame} way={way} />
        {lOp > 0.002 ? (
          <text
            x={labelX + (LABEL_SIZE * 0.3) / 2}
            y={labelY + lDy}
            textAnchor="middle"
            opacity={lOp * INK_FULL}
            fill={INK}
            stroke={SEA}
            strokeOpacity={0.6}
            strokeWidth={LABEL_SIZE * 0.12}
            paintOrder="stroke"
            style={{ fontFamily: fellSC, fontSize: LABEL_SIZE, letterSpacing: LABEL_SIZE * 0.3 }}
          >
            CORTÉS
          </text>
        ) : null}
      </svg>
      {/* the year: 1 5 1 stand, the last wheel rolls */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="tyb-win" gradientUnits="userSpaceOnUse" x1={0} y1={WIN_TOP} x2={0} y2={WIN_TOP + WIN_H}>
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset={FEATHER} stopColor="#fff" stopOpacity={1} />
            <stop offset={1 - FEATHER} stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id="tyb-wheel" maskUnits="userSpaceOnUse" x={YEAR_X + CELL_W - 30} y={WIN_TOP} width={CELL_W + 60} height={WIN_H}>
            <rect x={YEAR_X + CELL_W - 30} y={WIN_TOP} width={CELL_W + 60} height={WIN_H} fill="url(#tyb-win)" />
          </mask>
          <filter id="tyb-blur" filterUnits="userSpaceOnUse" x={YEAR_X + CELL_W - 60} y={WIN_TOP - WIN_H} width={CELL_W + 120} height={3 * WIN_H}>
            <feGaussianBlur stdDeviation={`0 ${wheelBlur.toFixed(2)}`} />
          </filter>
        </defs>
        <g
          textAnchor="middle"
          fill={INK}
          fillOpacity={INK_FULL}
          stroke={SEA}
          strokeOpacity={0.62}
          strokeWidth={YEAR_SIZE * 0.045}
          strokeLinejoin="round"
          paintOrder="stroke"
          style={{ fontFamily: fell, fontSize: YEAR_SIZE }}
        >
          {["1", "5", "1"].map((d, i) => (
            <text key={i} x={YEAR_X + (i - 1.5) * CELL_W} y={YEAR_BASE}>
              {d}
            </text>
          ))}
          <g mask="url(#tyb-wheel)">
            <g filter={wheelBlur > 0.4 ? "url(#tyb-blur)" : undefined}>
              {[0, 1].map((j) => {
                const d = wheelDigit + j;
                const off = j - wheelFrac; // -1 (gone up) .. 0 (in place) .. 1 (still below)
                return d <= 9 && Math.abs(off) < 0.999 ? (
                  <text key={d} x={YEAR_X + 1.5 * CELL_W} y={YEAR_BASE + off * PITCH}>
                    {d}
                  </text>
                ) : null;
              })}
            </g>
          </g>
        </g>
      </svg>
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

export default ThreeYearsBefore;
