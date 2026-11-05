// ---------------------------------------------------------------------------
// HeBuiltTheMap (robert-power-drug, cut 9). Style: the sister clip's map and pictogram (Robert_Graft_machine
// notes/COMMON.md: the show's own monochrome graphic, not a kise style file). Opaque 1080x1920, 24 fps, 288 frames.
//
// CHECK LINE: "Moses's works are everywhere: bridge after bridge, an expressway, a beach, Lincoln Center, Shea, two
// dams far upstate, and then a swarm of parks and pools, until the map of New York is covered with what he built."
//
// THE LINE: "He built the Triborough and Verrazano Bridges, the Cross Bronx Expressway, Jones Beach, Lincoln Center,
// Shea Stadium, two giant power dams upstate, in addition to hundreds of parks and pools."
// WORD -> FRAME: He -1 · built 1 · the 6 · Triborough 8 · and 21 · Verrazano 26 · Bridges 35 · the 51 · Cross 58 ·
// Bronx 66 · Expressway 72 · Jones 93 · Beach 105 · Lincoln 120 · Center 128 · Shea 144 · Stadium 152 · two 171 ·
// giant 177 · power 189 · dams 195 · upstate 205 · in 215 · addition 222 · to 228 · hundreds 235 · of 252 ·
// parks 262 · and 271 · pools 276 (next word "Caro" at 288 = the cut back to the speaker).
// DURATION: the slot 9.2083 -> 21.2083 s = 12 s x 24 = 288 frames (f0..f287).
//
// THE MOTION: the sister clip's NYC plate (New Jersey receded, as the original after its dim), a hard cut from the
// speaker at full brightness on f0, close on Manhattan / the Bronx / Queens, and one continuous camera rides each project as it is
// named, the land filling the frame: each enters on its real spot as a PAPER CUT-OUT (black card, white details, a
// die-cut white paper border with a hand-cut wobble, paper grain, a tight drop shadow down-right; a calm 6-frame entrance,
// scale 0.9 -> 1 and opacity 0 -> 1 on a cubic ease-out, no overshoot, no spin, essentially in ON the noun) with a
// white Frank Ruhl label that rises ~8 px as it fades in and fades after ~1 s, while the cut-outs stay (newest on top): Triborough (f8,
// Randall's Island), Verrazano (f26, the Narrows; the camera eases south), in on the Bronx as the Cross Bronx strip
// unrolls from a paper roll along the plate's own Cross Bronx line (f57-79), out and east to the Jones Beach water
// tower (f93) and an umbrella (f102) on the barrier island, a hold while JONES BEACH reads, then out and west as the
// Met's five arches land on the Upper West Side (f120) and in on the Shea bowl in Flushing (f144). The camera tilts
// north into the dark ground where two white dam cards ease in from the top edge (NIAGARA lands f171, ST. LAWRENCE
// f186), each with a dashed arrow pointing up off toward its real place; then back down onto the covered city while
// the dams are lifted away north off the top edge (f196-228, their labels fading), settling a little west and south so
// Lincoln Center sits whole at the left; 44 parks and pools (round trees; lap pools and kidney pools, black water in a
// white deck, as water is black on this map) enter over the boroughs and western Long Island, none in a caption band,
// from "hundreds" (f233), densest on "parks" (f258-262), the last landing by "pools" (f276). f276-287: settled hold,
// grain alive, a faint creep. The end frame crops Staten Island / the Verrazano (lower left, under the bands) and
// Jones Beach (off right), as directed.
// Cause before effect: a pop has no contact; the paper roll touches the strip's end on every frame it lays it.
//
// SOURCES: the map plate, grain and New Jersey mask are the sister clip's (public/robert-graft-machine/highways/,
// read-only; traced from the show's own graphic). Spots read off that plate's geography (heBuiltMapLayout.ts). The
// dams are the Niagara Power Project (Lewiston) and the St. Lawrence-FDR Power Project (Massena), both Moses's Power
// Authority; they are ~300 miles north / north-west, so they are not placed on the plate, only pointed at. No
// figures on screen. Fonts: labels Frank Ruhl Libre 800 caps (graftShared LABEL_FONT, as "ROBERT MOSES").
// ---------------------------------------------------------------------------
import React from "react";
import {
  AbsoluteFill,
  Img,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import {
  INK,
  LABEL_FONT,
  LABEL_WHITE,
  WHITE,
} from "../robert-graft-machine/graftShared";
import { HW } from "../robert-graft-machine/highwaysData";
import {
  ARROW_LEN,
  DAMS,
  DAM_DROP,
  DAM_DROP_DIST,
  DAM_LIFT,
  DAM_SC,
  FOCUS_Y,
  HEROES,
  LABELS,
  PARK_KIND_SC,
  PARK_SC,
  PITCH,
  ROLL_POP,
  STRIP,
  STRIP_HALF,
  STRIP_RUN,
  camera,
  clamp01,
  damLift,
  easeOut,
  labelState,
  popState,
} from "./heBuiltMapLayout";
import {
  Bridge,
  Cutout,
  Dam,
  JonesTower,
  KidneyPool,
  MetOpera,
  PaperDefs,
  Pool,
  RIM_LIGHT,
  RIM_W,
  SHADOW,
  SheaBowl,
  TRIBOROUGH,
  Tree,
  Umbrella,
  VERRAZANO,
} from "./heBuiltMapParts";
import { PARKS } from "./heBuiltMapParks";

export const FPS = 24;
export const DURATION = 288;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const DIR = "robert-graft-machine/highways";
const OCEAN = "#181818";
const CAP_RATIO = 0.69; // Frank Ruhl Libre cap height / font size
const n = (v: number) => Math.round(v * 1000) / 1000;

// ---- the Cross Bronx strip: a Catmull-Rom path through the plate's centreline, sampled by arc length
const STRIP_PTS: [number, number][] = (() => {
  const P = STRIP;
  const out: [number, number][] = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)];
    const p1 = P[i];
    const p2 = P[i + 1];
    const p3 = P[Math.min(P.length - 1, i + 2)];
    for (let j = 0; j < 12; j++) {
      const t = j / 12;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) =>
        0.5 *
        (2 * b +
          (-a + cc) * t +
          (2 * a - 5 * b + 4 * cc - d) * t2 +
          (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(P[P.length - 1]);
  return out;
})();
const STRIP_CUM: number[] = (() => {
  const c = [0];
  for (let i = 1; i < STRIP_PTS.length; i++)
    c.push(
      c[i - 1] +
        Math.hypot(
          STRIP_PTS[i][0] - STRIP_PTS[i - 1][0],
          STRIP_PTS[i][1] - STRIP_PTS[i - 1][1],
        ),
    );
  return c;
})();
const STRIP_L = STRIP_CUM[STRIP_CUM.length - 1];
const stripAt = (d: number) => {
  let i = 1;
  while (i < STRIP_PTS.length - 1 && STRIP_CUM[i] < d) i++;
  const seg = STRIP_CUM[i] - STRIP_CUM[i - 1] || 1;
  const t = clamp01((d - STRIP_CUM[i - 1]) / seg);
  const a = STRIP_PTS[i - 1];
  const b = STRIP_PTS[i];
  return {
    x: a[0] + (b[0] - a[0]) * t,
    y: a[1] + (b[1] - a[1]) * t,
    tx: (b[0] - a[0]) / seg,
    ty: (b[1] - a[1]) / seg,
  };
};
const stripPath = (len: number) => {
  const pts: string[] = [];
  for (let i = 0; i < STRIP_PTS.length && STRIP_CUM[i] < len; i++)
    pts.push(`${n(STRIP_PTS[i][0])} ${n(STRIP_PTS[i][1])}`);
  const e = stripAt(len);
  pts.push(`${n(e.x)} ${n(e.y)}`);
  return "M" + pts.join(" L");
};
const stripDashes = (len: number) => {
  const parts: string[] = [];
  for (let d = 26; d + 22 < len; d += 46) {
    const a = stripAt(d);
    const b = stripAt(d + 22);
    parts.push(`M${n(a.x)} ${n(a.y)} L${n(b.x)} ${n(b.y)}`);
  }
  return parts.join(" ");
};
const stripProgress = (f: number) => {
  const t = clamp01((f - STRIP_RUN[0]) / (STRIP_RUN[1] - STRIP_RUN[0]));
  // eased: quick off the roll, slowing into the Bruckner end
  return 1 - Math.pow(1 - t, 1.8);
};

// ---- labels (two lines like "ROBERT / MOSES"): white caps, black cut edge, the faint bloom from the layer filter
const MapLabel: React.FC<{
  x: number;
  y: number;
  cap: number;
  lines: string[];
  o: number;
  dy: number;
}> = ({ x, y, cap, lines, o, dy }) => {
  if (o <= 0.001) return null;
  const fs = cap / CAP_RATIO;
  return (
    <g
      opacity={n(o)}
      fontFamily={LABEL_FONT}
      fontWeight={800}
      fontSize={n(fs)}
      fill={LABEL_WHITE}
      stroke={INK}
      strokeWidth={n(fs * 0.13)}
      strokeLinejoin="round"
      paintOrder="stroke"
      textAnchor="middle"
    >
      {lines.map((t, i) => (
        <text key={i} x={n(x)} y={n(y + dy + cap + i * cap * PITCH)}>
          {t}
        </text>
      ))}
    </g>
  );
};

// a dashed arrow, drawn by its moving tip: dashes up to `len`, the head at the tip
const Arrow: React.FC<{ x: number; y: number; rot: number; len: number }> = ({
  x,
  y,
  rot,
  len,
}) => {
  if (len <= 1) return null;
  const dashes: string[] = [];
  for (let d = 0; d < len - 30; d += 34)
    dashes.push(`M0 ${n(-d)} L0 ${n(-Math.min(d + 20, len - 30))}`);
  return (
    <g transform={`translate(${n(x)} ${n(y)}) rotate(${n(rot)})`}>
      <path
        d={dashes.join(" ")}
        stroke={WHITE}
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M-19 ${n(-len + 30)} L0 ${n(-len)} L19 ${n(-len + 30)} Z`}
        fill={WHITE}
        stroke={WHITE}
        strokeWidth={4}
        strokeLinejoin="round"
      />
    </g>
  );
};

const heroPart = (id: string) => {
  switch (id) {
    case "tri":
      return <Bridge b={TRIBOROUGH} />;
    case "ver":
      return <Bridge b={VERRAZANO} />;
    case "jones":
      return <JonesTower />;
    case "umb":
      return <Umbrella />;
    case "lin":
      return <MetOpera />;
    default:
      return <SheaBowl />;
  }
};
const TREE = <Tree />;
const POOL = <Pool />;
const KIDNEY = <KidneyPool />;
const DAM_PARTS: Record<string, React.ReactNode> = {
  nia: <Dam w={480} h={165} gates={6} block="right" />,
  stl: <Dam w={580} h={128} gates={10} block="left" />,
};

const HeBuiltTheMap: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = camera(frame);
  const tx = 540 - cx * k;
  const ty = FOCUS_Y - cy * k;
  // world rect on screen (+ margin) for the filter regions
  const vx = cx - 540 / k - 200;
  const vy = cy - FOCUS_Y / k - 200;
  const vw = 1080 / k + 400;
  const vh = 1920 / k + 400;

  const gx = Math.floor(random(`gx${frame}`) * 110);
  const gy = Math.floor(random(`gy${frame}`) * 110);

  // strip
  const sp = stripProgress(frame);
  const sLen = STRIP_L * sp;
  const roll = popState(frame, ROLL_POP);
  const rollR = roll.on ? 40 * (1 - clamp01((sp - 0.82) / 0.18)) * roll.s : 0;
  const tip = stripAt(Math.max(0.01, sLen));
  const rollSpin = (sLen / 40) * (180 / Math.PI) * 0.15; // a subtle turn as it unrolls, not a full roll
  const stripShadow = SHADOW;

  return (
    <AbsoluteFill style={{ backgroundColor: OCEAN, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
        }}
      >
        <Img
          src={staticFile(`${DIR}/plate.jpg`)}
          style={{
            position: "absolute",
            left: HW.X0,
            top: -HW.PADTOP,
            width: HW.plateW / HW.PS,
            height: HW.plateH / HW.PS,
          }}
        />
        <Img
          src={staticFile(`${DIR}/nj_mask.png`)}
          style={{
            position: "absolute",
            left: HW.X0,
            top: -HW.PADTOP,
            width: HW.plateW / HW.PS,
            height: HW.plateH / HW.PS,
            opacity: 0.373,
          }}
        />
      </div>

      <svg
        width={1080}
        height={1920}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <defs>
          <PaperDefs />
          <filter
            id="lblFx"
            filterUnits="userSpaceOnUse"
            x={n(vx)}
            y={n(vy)}
            width={n(vw)}
            height={n(vh)}
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceAlpha" stdDeviation={6} result="b" />
            <feOffset in="b" dx={6} dy={8} result="o" />
            <feComponentTransfer in="o" result="sh">
              <feFuncA type="linear" slope={0.45} />
            </feComponentTransfer>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.12 0.12 0.12 0 -0.22"
              result="lum"
            />
            <feGaussianBlur in="lum" stdDeviation={6} result="g1" />
            <feGaussianBlur in="lum" stdDeviation={22} result="g2" />
            <feMerge>
              <feMergeNode in="sh" />
              <feMergeNode in="g2" />
              <feMergeNode in="g1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform={`translate(${tx} ${ty}) scale(${k})`}>
          <g>
            {/* Cross Bronx: the paper strip laid flat (tight shadow), its lane dashes, the roll at its tip */}
            {sLen > 1 ? (
              <g>
                <path
                  d={stripPath(sLen)}
                  transform={`translate(${n(stripShadow.dx)} ${n(stripShadow.dy)})`}
                  opacity={n(stripShadow.o)}
                  filter={`url(#${stripShadow.id})`}
                  fill="none"
                  stroke="#000"
                  strokeWidth={STRIP_HALF * 2 + RIM_W * 2 + 4}
                  strokeLinejoin="round"
                />
                <g filter="url(#pEdge)">
                  <path
                    d={stripPath(sLen)}
                    fill="none"
                    stroke={RIM_LIGHT}
                    strokeWidth={STRIP_HALF * 2 + RIM_W * 2}
                    strokeLinejoin="round"
                  />
                </g>
                <g filter="url(#pGrainL)">
                  <path
                    d={stripPath(sLen)}
                    fill="none"
                    stroke={INK}
                    strokeWidth={STRIP_HALF * 2}
                    strokeLinejoin="round"
                  />
                  <path
                    d={stripDashes(sLen)}
                    fill="none"
                    stroke={WHITE}
                    strokeWidth={6}
                  />
                </g>
              </g>
            ) : null}
            {rollR > 0.5 ? (
              <g
                transform={`translate(${n(tip.x)} ${n(tip.y)}) rotate(${n(rollSpin)})`}
                opacity={n(roll.o)}
              >
                <Cutout
                  sil={(c, g) => (
                    <circle
                      r={n(rollR)}
                      fill={c}
                      stroke={g > 0 ? c : "none"}
                      strokeWidth={g * 2}
                    />
                  )}
                  detail={
                    <path
                      d={`M0 0 m${n(-rollR * 0.25)} 0 a${n(rollR * 0.25)} ${n(rollR * 0.25)} 0 1 1 ${n(rollR * 0.5)} 0 a${n(rollR * 0.5)} ${n(rollR * 0.5)} 0 1 1 ${n(-rollR * 1.1)} ${n(rollR * 0.1)}`}
                      stroke={WHITE}
                      strokeWidth={n(Math.max(2, rollR * 0.12))}
                      fill="none"
                    />
                  }
                />
              </g>
            ) : null}

            {/* heroes, newest on top */}
            {HEROES.map((h) => {
              const p = popState(frame, h.pop);
              if (!p.on) return null;
              return (
                <g
                  key={h.id}
                  transform={`translate(${h.x} ${h.y}) scale(${n(p.s * h.sc)})`}
                  opacity={n(p.o)}
                >
                  {heroPart(h.id)}
                </g>
              );
            })}

            {/* parks and pools */}
            {PARKS.map((pk, i) => {
              const p = popState(frame, pk.f);
              if (!p.on) return null;
              // each keeps its small resting tilt (it does not turn while it enters)
              return (
                <g
                  key={i}
                  transform={`translate(${pk.x} ${pk.y}) rotate(${n(pk.rot * 0.4)}) scale(${n(p.s * pk.s * PARK_SC * PARK_KIND_SC[pk.kind])})`}
                  opacity={n(p.o)}
                >
                  {pk.kind === 0 ? TREE : pk.kind === 1 ? POOL : KIDNEY}
                </g>
              );
            })}

            {/* the dams, dropped in from the top edge, and their arrows */}
            {DAMS.map((d) => {
              const t = (frame - (d.land - DAM_DROP)) / DAM_DROP;
              if (t <= 0) return null;
              // in from the top edge on the same plain ease-out as every entrance (no bounce, no drop shadow)
              const off = -DAM_DROP_DIST * (1 - easeOut(t));
              const len = ARROW_LEN * easeOut((frame - (d.land + 2)) / 14);
              if (frame >= DAM_LIFT[1]) return null;
              return (
                <g key={d.id} transform={`translate(0 ${n(damLift(frame))})`}>
                  <Arrow
                    x={d.x}
                    y={d.y - d.h * DAM_SC - 50}
                    rot={d.arrowRot}
                    len={len}
                  />
                  <g
                    transform={`translate(${d.x} ${n(d.y + off)}) scale(${DAM_SC})`}
                  >
                    {DAM_PARTS[d.id]}
                  </g>
                </g>
              );
            })}
          </g>

          <g filter="url(#lblFx)">
            {LABELS.map((l) => {
              const s = labelState(frame, l.word, l.stay, l.hold);
              if (l.stay && frame >= DAM_LIFT[1]) return null;
              const lift = l.stay ? damLift(frame) : 0;
              return (
                <MapLabel
                  key={l.id}
                  x={l.x}
                  y={l.y + lift}
                  cap={l.cap}
                  lines={l.lines}
                  o={s.o}
                  dy={s.dy}
                />
              );
            })}
          </g>
        </g>
      </svg>

      {/* grain, screen space, fresh every frame (the sister clip's) */}
      <Img
        src={staticFile(`${DIR}/grain.jpg`)}
        style={{
          position: "absolute",
          left: -gx,
          top: -gy,
          width: 1200,
          height: 2040,
          mixBlendMode: "overlay",
          opacity: 0.32,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 85% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.32) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export default HeBuiltTheMap;
