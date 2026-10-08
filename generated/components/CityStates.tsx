// ---------------------------------------------------------------------------
// CityStates: the cut BEFORE OneFellSwoopV2 in the clip "Sheppard: centralized
// empires fell fast" (Dwarkesh with Si Sheppard). Dwarkesh map style; the Maya
// world of mayaShared (same projection, same baked map). 1080x1920, 24 fps,
// opaque.
//
// LINE (sequence 39.081-44.336 s): "...even the Maya in Mesoamerica, whose
// city-states jealously asserted and defended their autonomy against each
// other, (meant that the Spanish couldn't take out the Maya in one fell swoop)."
// DURATION = round((44.336 - 39.081) s x 23.976) = 126 frames.
//
// CHECK LINE (what the viewer can say after this cut): "The Maya were never one
// state: the same land was split into many small states, each walled off from
// its neighbours."
//
// THREE ELEMENT TYPES ONLY: the map, the orange land, the walls (+ one label,
// over open water, never on the land). ORANGE = Maya land / each Maya state.
//
// THE MOTION (one continuous push-in, k 3.15 -> 3.63, never resting), word -> frame
//   A  "even the Maya in Mesoamerica" (Maya f7): the Yucatan peninsula, large
//      and centred, ONE unbroken orange hatch; MAYA stands in the Gulf, legible
//      at f0 (its slide settles by f4). A soft highlight crosses the hatch.
//   B  "whose city-states" (f34 / f39-54): the one country SPLITS. Seams of bare
//      land open across the orange in one wave from the north-west (f24) to the
//      south-east (done ~f51), each opening to 34 px, until the land is 17 cells.
//   C  "jealously asserted (f70) and defended (f86) their autonomy (f98)": each
//      cell WALLS ITSELF IN. A solid orange wall draws round every cell from
//      its north-west point, both ways round, 14 frames a cell, the cells in a
//      second wave (f57 -> f97).
//      TEETH grow on the walls only where they face a neighbour across a seam
//      (f100 -> f112), the two sides half a pitch apart: a zip that does not close.
//      "against (f107) each other (f115)": the states SHOVE. In a travelling
//      order, a cell leans 6 px at one neighbour across their seam and the
//      neighbour leans back 4 frames later (a sine bump, 14 frames each); the
//      walls and teeth move with their cells, the seam narrows and reopens,
//      nothing touches. It goes on through the last frame.
//
// SCHEMATIC, NOT SURVEYED: the cells are the Voronoi regions of the capitals of
// the Postclassic Yucatan provinces (after Roys 1957) plus Acalan and the Itza,
// relaxed so none is a sliver; the land's south and west limit is a drawn
// convention. See cityStatesGeo.ts.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, ACCENT_DEEP, DARK, FRAME_H, FRAME_W, INK, INK_FULL, MapPage, SEA, WorldSvg, camFor, clamp01, fellSC, hash, labelSlide, screenOf, smoothstep, swayCam, type Cam, type P2 } from "./mayaShared";
import { CELLS_D, FINAL, GAP, K0, REGION_BOX, REGION_D, SEAMS, SITES, TEETH, cellsAt, dOf, teethD } from "./cityStatesGeo";

export const FPS = 24;
export const DURATION = 126; // round(5.255 s x 23.976)

export const schema = z.object({
  vignette: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------
export const T = {
  label: -10, // the label's slide starts before the cut: legible at f0, settled by f4
  split: [24, 46] as [number, number], // seam starts, by sweep position
  seamF: 9, // frames: a seam opens
  walls: [57, 82] as [number, number], // wall starts, by sweep position
  wallF: 14, // frames: a wall closes
  wallsDone: 99,
  teeth: [100, 106] as [number, number],
  toothF: 6,
  shove: 103, // the first exchange
  shoveEvery: 4,
  shoveF: 14,
  answer: 4,
};
const K_A = 3.15;
const K_B = 3.63;
const LEAN = 6 / K0;

// ---------------------------------------------------------------------------
// Camera: the land's middle at the frame's true centre, one exponential push
// ---------------------------------------------------------------------------
const FOCUS: P2 = [(REGION_BOX.x0 + REGION_BOX.x1) / 2 - 2, (REGION_BOX.y0 + REGION_BOX.y1) / 2 - 4];
export const cameraAt = (f: number): Cam => camFor(FOCUS, K_A * Math.pow(K_B / K_A, f / (DURATION - 1)), 540, 960);

// ---------------------------------------------------------------------------
// The clocks
// ---------------------------------------------------------------------------
// a seam opens fast out of its hairline and eases into its full width
const seamGap = (f: number, s: number) => {
  const t = clamp01((f - (T.split[0] + (T.split[1] - T.split[0]) * s)) / T.seamF);
  return GAP * (1 - (1 - t) * (1 - t));
};
const WALL_T0 = FINAL.map((c, i) => T.walls[0] + (T.walls[1] - T.walls[0]) * c.s + 3 * (hash(i, 7) - 0.5));
const SPLIT_END = T.split[1] + T.seamF;
const TEETH_BY = FINAL.map((_, i) => SEAMS.map((__, q) => TEETH.filter((t) => t.cell === i && t.seam === q)));

// THE SHOVES: seams in sweep order, no cell twice; cell a leans at b, b answers
const EXCHANGES = (() => {
  const used = new Set<number>();
  const out: { a: number; b: number; n: P2; t0: number }[] = [];
  const order = SEAMS.map((s, q) => ({ s, q })).sort((x, y) => x.s.s - y.s.s);
  for (const { s } of order) {
    if (used.has(s.i) || used.has(s.j)) continue;
    used.add(s.i);
    used.add(s.j);
    const pa = SITES[s.i].p;
    const pb = SITES[s.j].p;
    const l = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
    out.push({ a: s.i, b: s.j, n: [(pb[0] - pa[0]) / l, (pb[1] - pa[1]) / l], t0: T.shove + T.shoveEvery * out.length });
  }
  return out;
})();
const bump = (t: number) => (t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t) ** 2);
const leanAt = (f: number): P2[] => {
  const v: P2[] = FINAL.map(() => [0, 0]);
  for (const e of EXCHANGES) {
    const wa = LEAN * bump((f - e.t0) / T.shoveF);
    const wb = LEAN * bump((f - e.t0 - T.answer) / T.shoveF);
    v[e.a] = [v[e.a][0] + e.n[0] * wa, v[e.a][1] + e.n[1] * wa];
    v[e.b] = [v[e.b][0] - e.n[0] * wb, v[e.b][1] - e.n[1] * wb];
  }
  return v;
};

const HATCH_P = 11 / K0;
const HATCH_W = 2.5 / K0;
const WALL = 4.6 / K0;
const CASE = 2.2 / K0;
// the label: over the open Gulf, north-west of the north coast
const LABEL_AT: P2 = [FOCUS[0] + (350 - 540) / K0, FOCUS[1] + (340 - 960) / K0];

const CityStates: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(cameraAt(frame), frame);

  // --- the cells of this frame
  const shoving = frame >= T.shove;
  const lean = shoving ? leanAt(frame) : null;
  const rings = shoving && lean ? cellsAt(() => GAP, lean).map((c) => dOf(c.ring)) : null;
  const landD =
    frame < T.split[0]
      ? REGION_D
      : rings
        ? rings.join("")
        : frame >= SPLIT_END
          ? CELLS_D
          : cellsAt((q) => seamGap(frame, SEAMS[q].s))
              .map((c) => dOf(c.ring))
              .join("");

  // --- A: a soft highlight crossing the one country (gone before the split is done)
  const bandOp = 0.42 * (1 - smoothstep((frame - 22) / 14));
  const bandX = REGION_BOX.x0 - 60 + (REGION_BOX.x1 - REGION_BOX.x0 + 150) * ((frame + 14) / 54);

  const sl = labelSlide(frame, T.label, 14, 8);
  const [lx, ly] = screenOf(LABEL_AT, cam);
  const SIZE = 84;
  const SPACING = 0.34;

  return (
    <AbsoluteFill style={{ backgroundColor: "#1B2226" }}>
      <MapPage cam={cam} vignette={vignette}>
        <WorldSvg cam={cam}>
          <defs>
            <pattern id="csHatch" patternUnits="userSpaceOnUse" width={HATCH_P} height={HATCH_P} patternTransform="rotate(45)">
              <line x1={0} y1={-1} x2={0} y2={HATCH_P + 1} stroke={ACCENT} strokeWidth={HATCH_W} />
              <line x1={HATCH_P} y1={-1} x2={HATCH_P} y2={HATCH_P + 1} stroke={ACCENT} strokeWidth={HATCH_W} />
            </pattern>
            <linearGradient id="csBand" gradientUnits="userSpaceOnUse" x1={bandX - 46} y1={0} x2={bandX + 46} y2={0} gradientTransform={`rotate(33 ${bandX.toFixed(2)} ${((REGION_BOX.y0 + REGION_BOX.y1) / 2).toFixed(2)})`}>
              <stop offset={0} stopColor="#000" />
              <stop offset={0.5} stopColor="#fff" />
              <stop offset={1} stopColor="#000" />
            </linearGradient>
            <mask id="csBandMask" maskUnits="userSpaceOnUse" x={REGION_BOX.x0 - 300} y={REGION_BOX.y0 - 300} width={900} height={1000}>
              <rect x={REGION_BOX.x0 - 300} y={REGION_BOX.y0 - 300} width={900} height={1000} fill="url(#csBand)" />
            </mask>
            {FINAL.map((c, i) => (
              <clipPath key={i} id={`csCell${i}`}>
                <path d={rings ? rings[i] : c.d} />
              </clipPath>
            ))}
          </defs>

          {/* THE ORANGE LAND */}
          <path d={landD} fill={ACCENT_DEEP} fillOpacity={0.3} />
          <path d={landD} fill="url(#csHatch)" opacity={0.86} />
          {bandOp > 0.004 ? <path d={landD} fill="url(#csHatch)" opacity={bandOp} mask="url(#csBandMask)" /> : null}

          {/* THE WALLS: each drawn inside its own cell's edge, both ways round */}
          {FINAL.map((c, i) => {
            const p = clamp01((frame - WALL_T0[i]) / T.wallF);
            if (p <= 0) return null;
            if (rings)
              return (
                <g key={`w${i}`} clipPath={`url(#csCell${i})`} fill="none" strokeLinejoin="round">
                  <path d={rings[i]} stroke={DARK} strokeOpacity={0.62} strokeWidth={2 * (WALL + CASE)} />
                  <path d={rings[i]} stroke={ACCENT} strokeWidth={2 * WALL} />
                </g>
              );
            const e = 0.25 * p + 0.75 * smoothstep(p);
            return (
              <g key={`w${i}`} clipPath={`url(#csCell${i})`} fill="none" strokeLinejoin="round" strokeLinecap="butt">
                {c.halves.map((h, q) => (
                  <path key={`c${q}`} d={h.d} stroke={DARK} strokeOpacity={0.62} strokeWidth={2 * (WALL + CASE)} strokeDasharray={`${h.len.toFixed(3)} ${(h.len + 4).toFixed(3)}`} strokeDashoffset={(h.len * (1 - e)).toFixed(3)} />
                ))}
                {c.halves.map((h, q) => (
                  <path key={`o${q}`} d={h.d} stroke={ACCENT} strokeWidth={2 * WALL} strokeDasharray={`${h.len.toFixed(3)} ${(h.len + 4).toFixed(3)}`} strokeDashoffset={(h.len * (1 - e)).toFixed(3)} />
                ))}
              </g>
            );
          })}

          {/* THE TEETH: only where a wall faces a neighbour; they ride with their cell */}
          {frame >= T.teeth[0]
            ? FINAL.map((_, i) =>
                SEAMS.map((s, q) => {
                  const tt = TEETH_BY[i][q];
                  if (!tt.length) return null;
                  const g = smoothstep((frame - (T.teeth[0] + (T.teeth[1] - T.teeth[0]) * s.s)) / T.toothF);
                  return g > 0.01 ? <path key={`t${i}-${q}`} d={teethD(tt, g, lean ? lean[i][0] : 0, lean ? lean[i][1] : 0)} fill={ACCENT} /> : null;
                }),
              )
            : null}
        </WorldSvg>

        {/* THE ONE LABEL, over the Gulf */}
        {sl.op > 0.002 ? (
          <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
            <text
              x={lx + (SIZE * SPACING) / 2}
              y={ly + sl.dy}
              textAnchor="middle"
              opacity={sl.op * INK_FULL}
              fill={INK}
              stroke={SEA}
              strokeOpacity={0.7}
              strokeWidth={SIZE * 0.11}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ fontFamily: fellSC, fontSize: SIZE, letterSpacing: SIZE * SPACING }}
            >
              MAYA
            </text>
          </svg>
        ) : null}
      </MapPage>
    </AbsoluteFill>
  );
};

export default CityStates;
