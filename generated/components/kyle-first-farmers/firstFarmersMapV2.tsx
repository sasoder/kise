// ---------------------------------------------------------------------------
// firstFarmersMapV2: the two layers OutcompeteEuropeV2 (cold-review pass) needs on top of firstFarmersMap.tsx, which
// stays as it is (cut 92 imports it). Everything else is imported from the original kit.
//   <FarmedLandV2 T cam id />  = FarmedLand on the V2 front model (neolithicFrontV2.ts: pocket clearings carry no
//                                front line, so a pocket reads as people on plain land, not a ringed hole)
//   <PopulationDotsV2 pop f cam d />  = PopulationDots with a per-dot size (a caught forager shrinks to farmer size as it
//                                turns orange)
//   <LabelSeat ... />          = the region label sliding up while fading in over `dur`; halo > 0 adds a soft dark
//                                blurred seat under it, halo 0 keeps only the style's thin dark stroke behind the letters
// ---------------------------------------------------------------------------
import React from "react";
import { ACCENT, ACCENT_DEEP, DARK, INK } from "./firstFarmersTokens";
import { CAP_RATIO, HatchPattern, LandMaskDef, clamp01, fellSC, mixColor, px, smoothstep, viewRect, type Cam } from "./firstFarmersMap";
import { frontPaths, type Population } from "./neolithicFrontV2";

export const FarmedLandV2: React.FC<{ T: number; cam: Cam; id: string; opacity?: number; hatch?: number; wash?: number; line?: number }> = ({ T, cam, id, opacity = 1, hatch = 0.45, wash = 0.3, line = 0.95 }) => {
  if (opacity <= 0.001) return null;
  const fp = frontPaths(T, cam);
  if (!fp.fill) return null;
  const vr = viewRect(cam, 30);
  return (
    <g opacity={opacity}>
      <defs>
        <HatchPattern id={`${id}-pat`} cam={cam} />
        <LandMaskDef id={`${id}-land`} />
        <clipPath id={`${id}-farm`}>
          <path d={fp.fill} clipRule="evenodd" />
        </clipPath>
      </defs>
      <g mask={`url(#${id}-land)`}>
        <g clipPath={`url(#${id}-farm)`}>
          <rect x={vr.x0} y={vr.y0} width={vr.x1 - vr.x0} height={vr.y1 - vr.y0} fill={ACCENT_DEEP} fillOpacity={wash} />
          <rect x={vr.x0} y={vr.y0} width={vr.x1 - vr.x0} height={vr.y1 - vr.y0} fill={`url(#${id}-pat)`} opacity={hatch} />
        </g>
        {line > 0 && fp.line ? (
          <>
            <path d={fp.line} fill="none" stroke={DARK} strokeOpacity={0.5 * line} strokeWidth={px(cam, 4.6)} strokeLinecap="round" strokeLinejoin="round" />
            <path d={fp.line} fill="none" stroke={ACCENT} strokeOpacity={line} strokeWidth={px(cam, 2.4)} strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}
      </g>
    </g>
  );
};

/** a region label (Fell SC caps, cream) on a soft dark halo; (x, y) = world baseline centre; slides up 20 screen px
 *  while fading in over `dur` frames from `appear`; the halo fades in with it */
export const LabelSeat: React.FC<{ x: number; y: number; text: string; appear: number; dur?: number; frame: number; cam: Cam; cap?: number; spacing?: number; halo?: number; stroke?: number; id: string }> = ({
  x,
  y,
  text,
  appear,
  dur = 9,
  frame,
  cam,
  cap = 46,
  spacing = 0.34,
  halo = 0.62,
  stroke = 0.1,
  id,
}) => {
  const u = clamp01((frame - appear) / dur);
  const e = 1 - Math.pow(1 - u, 3);
  const op = smoothstep((frame - appear) / (dur * 0.7));
  if (op <= 0.002) return null;
  const k = cam.k;
  const size = cap / CAP_RATIO;
  const dy = (20 * (1 - e)) / k;
  // the halo: an ellipse round the word's box (its width estimated from Fell SC's caps), blurred in world space
  const wordW = (text.length * 0.78 + (text.length - 1) * spacing) * size;
  const hw = (wordW / 2 + size * 0.55) / k;
  const hh = (cap * 1.25) / k;
  return (
    <g>
      <defs>
        <filter id={`${id}-blur`} x="-50%" y="-80%" width="200%" height="260%">
          <feGaussianBlur stdDeviation={(size * 0.32) / k} />
        </filter>
      </defs>
      {halo > 0 ? <ellipse cx={x} cy={y - (cap * 0.5) / k + dy} rx={hw} ry={hh} fill={DARK} opacity={halo * op} filter={`url(#${id}-blur)`} /> : null}
      <text
        x={x + (size * spacing) / 2 / k}
        y={y + dy}
        textAnchor="middle"
        opacity={op}
        fill={INK}
        stroke={DARK}
        strokeOpacity={halo > 0 ? 0.7 : 0.85}
        strokeWidth={(size * stroke) / k}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: fellSC, fontSize: size / k, letterSpacing: `${spacing}em`, textRendering: "geometricPrecision" }}
      >
        {text}
      </text>
    </g>
  );
};

/** the population's dots (cream foragers, orange farmers), d = a forager's screen diameter, each dot scaled by its s */
export const PopulationDotsV2: React.FC<{ pop: Population; f: number; cam: Cam; d: number; opacity?: number }> = ({ pop, f, cam, d, opacity = 1 }) => {
  const st = pop.at(f, cam);
  const r0 = d / 2 / cam.k;
  const ring = 1.5 / cam.k;
  const dot = (key: string, x: number, y: number, fill: string, s = 1) => <circle key={key} cx={x} cy={y} r={r0 * s} fill={fill} stroke={DARK} strokeOpacity={0.65} strokeWidth={ring} />;
  const col = (q: { tone: number; farmer: boolean }) => (q.farmer ? ACCENT : q.tone > 0 ? mixColor(INK, ACCENT, q.tone) : INK);
  return (
    <g opacity={opacity}>
      {st.under.map((q) => dot(`u${q.id}`, q.x, q.y, col(q), q.s))}
      {st.over.map((q) => dot(`o${q.id}`, q.x, q.y, col(q), q.s))}
    </g>
  );
};
