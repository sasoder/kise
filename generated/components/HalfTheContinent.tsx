// ---------------------------------------------------------------------------
// HalfTheContinent (plague clip: Dwarkesh Patel with Kyle Harper, "Why the
// plague is so deadly to humans"). Sequence 58.325 s - 65.966 s. THE map cut.
// (The user trims the clip to start about f96: f96-234 is what is seen.)
//
// CHECK LINE: "A disease of marmots on the Central Asian steppe is what came
// west and killed half of Europe: seen from where it starts, nobody would
// guess it."
//
// SPOKEN (29.97 fps, f = round((t - 58.325) * 29.97)):
//   "you would never be like, I think that every now and then a rodent disease
//    from Central Asia is going to wipe out half of the continent."
//   you f0 · would f5 · never f9 · be f21 · like f27 · I f36 · think f39 ·
//   that f47 · every f55 · now f65 · and f72 · then f78 · a f86 · rodent f116 ·
//   disease f126 · from f136 · Central f143 · Asia f152 · is f162 ·
//   going to f168 · wipe f174 · out f184 · half f190 · of f197 · the f202 ·
//   continent f205 · speech ends f229.   DURATION = 229 + 6 = 235.
//
// THE MOTION: ONE pull-back, one eased move in the log of the scale (a slow
// drift plus a single broad swell, f92-207). It opens on the umber
// page with Muetzel's three bobak marmots printed on it as a book vignette;
// orange germs crawl out from behind the standing one's back on "rodent", walk
// off over its head and gather into ONE orange dot beside it. The page turns
// out to be the paper of Ortelius's world map of 1570: its engraving comes up
// out of the page around the marmots (they stay, small, as the engraved animal
// of that region: Tartaria / Turchestan, north-east of "Taskent"). From the
// dot an orange route is inked west through Tartaria, north of "Mar de Bachu",
// to the north shore of the Black Sea; from there an orange hand-colour wash
// spreads west over Europe, laid as engraved hatching whose lines are as wide
// as the gaps between them: half of Europe's surface is orange, half is still
// the map. The pull-back ends on Ortelius's world; the hold keeps receding a
// little while a shimmer travels the hatch.
//
// EVERYTHING IS ORTELIUS OR MUETZEL EXCEPT THE ORANGE. No added lettering: the
// names in view ("Tartaria", "Turchestan", "Taskent", "Samarchand", "Mar de
// Bachu", "EVROPA") are the map's own. The map is drawn from its ink mask as
// cream line on the kit page, so the page's mottle shows between the lines and
// the wash lies UNDER the ink (lettering and coasts stay readable).
//
// FACTS SHOWN, AND THEIR SOURCES
//   - The map: Abraham Ortelius, Typus Orbis Terrarum, Antwerp 1570 (Library of
//     Congress 2017585794, uncoloured, public domain).
//   - The vignette: Gustav Muetzel, bobak marmots on the Central Asian steppe,
//     Brehms Tierleben (kit MarmotVignette). The reservoir of Yersinia pestis
//     in Central Asia is marmots and other burrowing rodents.
//   - The dot: the Chuy valley / Tian Shan near Lake Issyk-Kul, where the
//     earliest Black Death burials are dated 1338-39 (Spyrou et al. 2022,
//     Nature 606). On this map: north-east of "Taskent" (placed by eye; a 1570
//     map has no Issyk-Kul).
//   - The route west to Caffa on the Black Sea (1346-47) is schematic, not a
//     dated spread map (no sea routes).
//   - HALF: the Black Death (1346-53) is estimated to have killed 30-60% of
//     Europe's population, often cited as about half (e.g. Benedictow 2004).
//     The hatch (line = gap) is the speaker's "half of the continent", NOT a
//     regional mortality map. Europe's outline is traced on this map by hand
//     (HalfTheContinentOrtelius.ts; islands other than Britain, Ireland,
//     Sicily, Corsica and Sardinia are left out).
// ---------------------------------------------------------------------------
import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  DARK,
  FRAME_H,
  FRAME_W,
  Germs,
  InkStroke,
  MARMOT,
  MarmotVignetteImg,
  Page,
  clamp01,
  hash,
  inkPath,
  roughen,
  smoothstep,
} from "./plagueShared";
import { CLOSE, EUROPE, ORIGIN, ROUTE, SHEET_H, SHEET_W, type Pt } from "./HalfTheContinentOrtelius";

export const FPS = 30000 / 1001;
export const DURATION = 235;

const SHIMMER = "#FFE3A6";

export const schema = z.object({
  mapHalfSrc: z.string(),
  mapCloseSrc: z.string(),
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  mapHalfSrc: "plague/halfcontinent_ortelius_half.png",
  mapCloseSrc: "plague/halfcontinent_ortelius_close.png",
  vignette: 0.34,
});

// ---------------------------------------------------------------------------
// THE CAMERA: one analytic track, no keys, no corners.
//   vw  the vignette's width on screen. ln vw is a slow drift (eased down for
//       the hold) plus ONE broad swell (eased up f92-130, level, eased down
//       f172-207).
//   m   the map's scale (screen px per sheet px), tied to vw: m ~ vw^(1/MAP_P).
//       The marmots shrink a little faster than the sheet, so they open large
//       and end as a small map illustration while the sheet is never enlarged
//       past 1.6x (and by then it is still faint).
//   q   where the origin dot sits on screen.
// ---------------------------------------------------------------------------
const VW_0 = 1720;
const VW_END = 92;
const M_END = 0.55; // the frame ends on about x 50-81 % of the sheet, inside its engraved border top and bottom
const MAP_P = Math.log(1250 / VW_END) / Math.log(1.6 / M_END); // m = 1.6 when vw = 1250 (the first faint lines)
const DRIFT = 0.0011; // ln vw per frame through the move ...
const DRIFT_HOLD = 0.22; // ... easing down to this share of it in the hold (fine engraving shimmers if it moves faster)
// the swell's speed: eased up over f92-130, level to f172, eased down to f207
// (a broad, low peak: the fine engraving is on screen through the fastest part)
const SWELL_DONE = (() => {
  const rate = (f: number) => smoothstep((f - 92) / (130 - 92)) * (1 - smoothstep((f - 172) / (207 - 172)));
  const done = [0];
  for (let f = 0; f < DURATION; f++) done.push(done[f] + rate(f + 0.5));
  const total = done[DURATION];
  return done.map((v) => v / total);
})();
const tableAt = (tab: number[], f: number) => {
  const c = Math.max(0, Math.min(DURATION - 1, f));
  const i = Math.floor(c);
  return tab[i] + (tab[i + 1] - tab[i]) * (c - i);
};
// what is left of the drift after frame f (a table, so the easing-down has no corner)
const DRIFT_LEFT = (() => {
  const rate = (f: number) => DRIFT * (1 - (1 - DRIFT_HOLD) * smoothstep((f - 184) / (214 - 184)));
  const left = new Array<number>(DURATION + 1).fill(0);
  for (let f = DURATION - 1; f >= 0; f--) left[f] = left[f + 1] + rate(f + 0.5);
  return left;
})();
const SWELL_L = Math.log(VW_0 / VW_END) - DRIFT_LEFT[0];
export const vwAt = (f: number) => VW_END * Math.exp(tableAt(DRIFT_LEFT, f) + SWELL_L * (1 - tableAt(SWELL_DONE, f)));
export const mapScaleAt = (f: number) => M_END * Math.pow(vwAt(f) / VW_END, 1 / MAP_P);
/** the dot, as a fraction of the vignette box: on the bare page left of the standing marmot's nose */
const DOT_F: Pt = [0.2, 0.1];
// what the frame centre looks at inside the vignette (box fractions): from the
// standing marmot's chest, drifting to its shoulder and back
const FOCUS_0: Pt = [0.5, 0.22];
const FOCUS_1: Pt = [0.6, 0.26];
// THE FINAL FRAMING: the frame's top edge sits just inside the sheet's engraved
// border (sheet y 350), so no margin shows; Europe's centre lands near y 625
const VIEW_C: Pt = [4100, 2096];
const Q_END: Pt = [FRAME_W / 2 + (ORIGIN[0] - VIEW_C[0]) * M_END, FRAME_H / 2 + (ORIGIN[1] - VIEW_C[1]) * M_END];
const dotScreen = (f: number) => {
  const vw = vwAt(f);
  const t = clamp01(f / 128);
  const e = 1 - (1 - t) * (1 - t);
  const fx = FOCUS_0[0] + (FOCUS_1[0] - FOCUS_0[0]) * e - DOT_F[0];
  const fy = FOCUS_0[1] + (FOCUS_1[1] - FOCUS_0[1]) * e - DOT_F[1];
  const g = smoothstep((f - 122) / (206 - 122));
  return {
    x: FRAME_W / 2 - fx * vw + (Q_END[0] - FRAME_W / 2) * g,
    y: FRAME_H / 2 - (fy * vw) / MARMOT.aspect + (Q_END[1] - FRAME_H / 2) * g,
  };
};

// The germs, in vignette units (box width = 1000): the point E on the standing
// marmot's back they come over, their inward heading, the frame they set off
// (from GERM_BACK behind the contour, GERM_V units a frame), and the frame
// they leave the fur for the dot.
const VIG_W = 1366; // the vignette PNG's own width: laid out once at that size, then scaled by transform
const VU = 1000;
const VH = VU / MARMOT.aspect;
const GERM_V = 3.7;
const GERM_BACK = 30;
const GERM_R = 9.5;
const GERM_FLY = 15;
const GERMS: { ex: number; ey: number; dx: number; dy: number; f0: number }[] = [
  { ex: 682, ey: 160, dx: -0.8, dy: 0.6, f0: 92 },
  { ex: 744, ey: 222, dx: -0.9, dy: 0.44, f0: 94 },
  { ex: 712, ey: 189, dx: -0.62, dy: 0.78, f0: 96 },
  { ex: 784, ey: 265, dx: -0.92, dy: 0.39, f0: 98 },
  { ex: 664, ey: 142, dx: -0.5, dy: 0.87, f0: 100 },
  { ex: 814, ey: 298, dx: -0.85, dy: 0.53, f0: 102 },
  { ex: 760, ey: 239, dx: -0.75, dy: 0.66, f0: 104 },
];
const flyAt = (i: number) => 118 + 1.5 * i;
// the kit's coarse silhouette, its back edge (points 3-7) eased out onto the engraved contour
const SIL = MARMOT.silhouette.map(([x, y], i): Pt => (i >= 3 && i <= 7 ? [x + 0.022, y - 0.016] : [x, y]));
const SIL_D = `M${SIL.map(([x, y]) => `${(x * VU).toFixed(1)},${(y * VH).toFixed(1)}`).join("L")}Z`;

const T = {
  mapIn: [112, 140] as const, // the engraving's ink rises out of the page (tied to the scale at these frames)
  route: [144, 176] as const, // the route is inked west, steady on screen; the Black Sea on f176
  wash: [176, 204] as const, // the hand-colour spreads over Europe ("wipe out half of the continent")
  dab: 10, // frames one brush dab takes to bloom
  shimmer: [206, 240] as const,
};

const MAP_IN_VW = [vwAt(T.mapIn[0]), vwAt(T.mapIn[1])] as const;

// ---------------------------------------------------------------------------
// THE ROUTE (sheet px): a hand-inked line with a little life, cut by arclength
// ---------------------------------------------------------------------------
const ROUTE_PTS = roughen(ROUTE, 7, 13);
const ROUTE_CUM = ROUTE_PTS.reduce<number[]>((acc, p, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + Math.hypot(p[0] - ROUTE_PTS[i - 1][0], p[1] - ROUTE_PTS[i - 1][1]));
  return acc;
}, []);
const ROUTE_LEN = ROUTE_CUM[ROUTE_CUM.length - 1];
// steady ON SCREEN while the sheet is still shrinking: sheet px per frame ~ 1 / m
const ROUTE_W = (() => {
  const w = [0];
  for (let f = T.route[0] + 1; f <= T.route[1]; f++) w.push(w[w.length - 1] + 1 / mapScaleAt(f - 0.5));
  return w;
})();
const routeLenAt = (f: number) => {
  if (f <= T.route[0]) return 0;
  if (f >= T.route[1]) return ROUTE_LEN;
  return (ROUTE_LEN * ROUTE_W[f - T.route[0]]) / ROUTE_W[ROUTE_W.length - 1];
};
const routeUpTo = (len: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < ROUTE_PTS.length; i++) {
    if (ROUTE_CUM[i] <= len) out.push(ROUTE_PTS[i]);
    else {
      const a = ROUTE_PTS[i - 1];
      const b = ROUTE_PTS[i];
      const u = (len - ROUTE_CUM[i - 1]) / (ROUTE_CUM[i] - ROUTE_CUM[i - 1]);
      out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
      break;
    }
  }
  return out;
};
const ROUTE_END = ROUTE[ROUTE.length - 1];

// ---------------------------------------------------------------------------
// THE WASH over Europe (sheet px): the colourist's brush as soft dabs on a
// jittered grid, each blooming as the front (distance from the Black Sea end
// of the route) reaches it; laid as hatching, line = gap.
// ---------------------------------------------------------------------------
const EUROPE_D = EUROPE.map((poly) => `M${poly.map(([x, y]) => `${x},${y}`).join("L")}Z`).join("");
const EU_BOX = { x0: 3170, y0: 1170, x1: 4010, y1: 1820 };
const HATCH_PITCH = 26; // sheet px: a 13 px line, a 13 px gap (7 + 7 px on screen at the end)
const DAB_GRID = 70;
const DAB_R = 112;
const DABS = (() => {
  const out: { x: number; y: number; r: number; d: number }[] = [];
  let n = 0;
  for (let y = EU_BOX.y0; y <= EU_BOX.y1; y += DAB_GRID)
    for (let x = EU_BOX.x0; x <= EU_BOX.x1; x += DAB_GRID, n++) {
      const px = x + (hash(n, 21) - 0.5) * DAB_GRID * 0.5;
      const py = y + (hash(n, 22) - 0.5) * DAB_GRID * 0.5;
      out.push({ x: px, y: py, r: DAB_R * (0.85 + 0.35 * hash(n, 23)), d: Math.hypot(px - ROUTE_END[0], py - ROUTE_END[1]) + (hash(n, 24) - 0.5) * 60 });
    }
  const dMax = Math.max(...out.map((o) => o.d));
  const dMin = Math.min(...out.map((o) => o.d));
  return out.map((o) => ({ ...o, at: T.wash[0] + (T.wash[1] - T.dab - T.wash[0]) * ((o.d - dMin) / (dMax - dMin)) }));
})();

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------------------
const HalfTheContinent: React.FC<Props> = ({ mapHalfSrc, mapCloseSrc, vignette }) => {
  const frame = useCurrentFrame();
  const vw = vwAt(frame);
  const m = mapScaleAt(frame);
  const { x: qx, y: qy } = dotScreen(frame);

  // -- the vignette (printed on the page; the dot is at DOT_F of its box) --------------
  const vh = vw / MARMOT.aspect;
  const vx = qx - DOT_F[0] * vw;
  const vy = qy - DOT_F[1] * vh;
  const vk = vw / VU;

  // -- the germs, then the dot ----------------------------------------------------
  const germR = Math.max(GERM_R * vk, 5.5);
  const DOT_R = 11;
  const crawling: { x: number; y: number; seed: number }[] = [];
  const flying: { x: number; y: number; seed: number }[] = [];
  GERMS.forEach((g, i) => {
    if (frame < g.f0) return;
    const tFly = flyAt(i);
    const t = Math.min(frame, tFly) - g.f0;
    const wig = 3.5 * Math.sin(Math.min(frame, tFly) * 0.33 + i * 1.7);
    const ux = g.ex + g.dx * (t * GERM_V - GERM_BACK) - g.dy * wig;
    const uy = g.ey + g.dy * (t * GERM_V - GERM_BACK) + g.dx * wig;
    const px = vx + ux * vk;
    const py = vy + uy * vk;
    if (frame <= tFly) {
      crawling.push({ x: px, y: py, seed: i + 3 });
      return;
    }
    const u = smoothstep((frame - tFly) / GERM_FLY);
    if (u >= 1) return;
    // a shallow arc over the marmot's head to the dot
    const arc = Math.sin(Math.PI * u) * 46 * vk;
    flying.push({ x: lerp(px, qx, u), y: lerp(py, qy, u) - arc, seed: i + 3 });
  });
  const lastIn = flyAt(GERMS.length - 1) + GERM_FLY;
  const firstIn = flyAt(0) + GERM_FLY;
  const dotR = frame > firstIn - 1.5 ? DOT_R * Math.sqrt(clamp01((frame - firstIn + 1.5) / (lastIn - firstIn + 1.5))) : 0;

  // -- the map: sheet px -> screen is q + (p - ORIGIN) * m ---------------------------
  const mapOp = 1 - smoothstep(Math.log(vw / MAP_IN_VW[1]) / Math.log(MAP_IN_VW[0] / MAP_IN_VW[1]));
  const mapOn = mapOp > 0.004;
  const ox = qx - ORIGIN[0] * m;
  const oy = qy - ORIGIN[1] * m;
  // two levels of the same print: the full-size Asia box while close, the half-size sheet when wide
  const closeMix = smoothstep((m - 0.72) / (0.86 - 0.72));
  const toS = (p: Pt): Pt => [ox + p[0] * m, oy + p[1] * m];
  const sheetT = `translate(${ox.toFixed(3)} ${oy.toFixed(3)}) scale(${m.toFixed(6)})`;

  // -- the route ---------------------------------------------------------------------
  const routeLen = routeLenAt(frame);
  const routePts = routeLen > 0 ? routeUpTo(routeLen).map(toS) : [];
  const routeD = routePts.length > 1 ? inkPath(routePts) : "";
  const head = routePts.length > 1 ? routePts[routePts.length - 1] : null;

  // -- the wash ----------------------------------------------------------------------
  const washOn = frame >= T.wash[0];
  const shT = clamp01((frame - T.shimmer[0]) / (T.shimmer[1] - T.shimmer[0]));
  const shX = lerp(EU_BOX.x1 + 200, EU_BOX.x0 - 200, shT);

  const svgStyle: React.CSSProperties = { position: "absolute", left: 0, top: 0 };

  return (
    <Page vignette={vignette}>
      {/* ---------------- THE HAND-COLOUR, under the ink ---------------- */}
      {washOn && mapOn ? (
        <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={svgStyle}>
          <defs>
            <radialGradient id="hcDab">
              <stop offset="0%" stopColor="#fff" stopOpacity={1} />
              <stop offset="58%" stopColor="#fff" stopOpacity={1} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </radialGradient>
            <linearGradient id="hcSweep" gradientUnits="userSpaceOnUse" x1={shX - 130} y1={0} x2={shX + 130} y2={0}>
              <stop offset="0%" stopColor="#fff" stopOpacity={0} />
              <stop offset="50%" stopColor="#fff" stopOpacity={1} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </linearGradient>
            <pattern id="hcHatch" patternUnits="userSpaceOnUse" width={64} height={HATCH_PITCH} patternTransform="rotate(-42)">
              <rect x={-1} y={0} width={66} height={HATCH_PITCH / 2} fill={ACCENT} />
            </pattern>
            <pattern id="hcHatchHi" patternUnits="userSpaceOnUse" width={64} height={HATCH_PITCH} patternTransform="rotate(-42)">
              <rect x={-1} y={0} width={66} height={HATCH_PITCH / 2} fill={SHIMMER} />
            </pattern>
            {/* Europe as drawn on this map: a hard edge on the coasts (the soft edge is the brush front only) */}
            <clipPath id="hcEurope">
              <path d={EUROPE_D} />
            </clipPath>
            {/* the brush: dabs bloom as the front reaches them */}
            <mask id="hcBrush" maskUnits="userSpaceOnUse" x={EU_BOX.x0 - 200} y={EU_BOX.y0 - 200} width={EU_BOX.x1 - EU_BOX.x0 + 400} height={EU_BOX.y1 - EU_BOX.y0 + 400}>
              {DABS.map((d, i) => {
                const u = clamp01((frame - d.at) / T.dab);
                if (u <= 0) return null;
                const e = smoothstep(u);
                return <circle key={i} cx={d.x} cy={d.y} r={d.r * lerp(0.35, 1, e)} fill="url(#hcDab)" opacity={e} />;
              })}
            </mask>
            <mask id="hcSweepMask" maskUnits="userSpaceOnUse" x={EU_BOX.x0 - 400} y={EU_BOX.y0 - 40} width={EU_BOX.x1 - EU_BOX.x0 + 800} height={EU_BOX.y1 - EU_BOX.y0 + 80}>
              <rect x={shX - 130} y={EU_BOX.y0 - 40} width={260} height={EU_BOX.y1 - EU_BOX.y0 + 80} fill="url(#hcSweep)" />
            </mask>
          </defs>
          <g transform={sheetT} opacity={mapOp}>
            <g mask="url(#hcBrush)">
              <g clipPath="url(#hcEurope)">
                {/* the thin first coat, then the hatch: line = gap, half the surface */}
                <rect x={EU_BOX.x0 - 40} y={EU_BOX.y0 - 40} width={EU_BOX.x1 - EU_BOX.x0 + 80} height={EU_BOX.y1 - EU_BOX.y0 + 80} fill={ACCENT_DEEP} fillOpacity={0.05} />
                <rect x={EU_BOX.x0 - 40} y={EU_BOX.y0 - 40} width={EU_BOX.x1 - EU_BOX.x0 + 80} height={EU_BOX.y1 - EU_BOX.y0 + 80} fill="url(#hcHatch)" />
                {shT > 0 && shT < 1 ? (
                  <g mask="url(#hcSweepMask)" opacity={0.5}>
                    <rect x={EU_BOX.x0 - 40} y={EU_BOX.y0 - 40} width={EU_BOX.x1 - EU_BOX.x0 + 80} height={EU_BOX.y1 - EU_BOX.y0 + 80} fill="url(#hcHatchHi)" />
                  </g>
                ) : null}
              </g>
            </g>
          </g>
        </svg>
      ) : null}

      {/* ---------------- ORTELIUS 1570, cream line on the page ---------------- */}
      {/* placed by transform, not left/top/width: sub-pixel, so the slow hold does not step */}
      {mapOn && closeMix < 1 ? (
        <Img
          src={staticFile(mapHalfSrc)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: SHEET_W / 2,
            height: SHEET_H / 2,
            maxWidth: "none",
            transformOrigin: "0 0",
            transform: `translate(${ox.toFixed(3)}px, ${oy.toFixed(3)}px) scale(${(m * 2).toFixed(6)})`,
            opacity: mapOp * (1 - closeMix),
          }}
        />
      ) : null}
      {mapOn && closeMix > 0 ? (
        <Img
          src={staticFile(mapCloseSrc)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: CLOSE.x1 - CLOSE.x0,
            height: CLOSE.y1 - CLOSE.y0,
            maxWidth: "none",
            transformOrigin: "0 0",
            transform: `translate(${(ox + CLOSE.x0 * m).toFixed(3)}px, ${(oy + CLOSE.y0 * m).toFixed(3)}px) scale(${m.toFixed(6)})`,
            opacity: mapOp * closeMix,
          }}
        />
      ) : null}

      {/* ---------------- THE MARMOTS, the engraved animal of Tartaria ---------------- */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", transform: `translate(${vx.toFixed(3)}px, ${vy.toFixed(3)}px) scale(${(vw / VIG_W).toFixed(6)})` }}>
        <MarmotVignetteImg x={0} y={0} w={VIG_W} />
      </div>

      {/* ---------------- THE ROUTE, THE GERMS, THE DOT ---------------- */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={svgStyle}>
        <defs>
          <clipPath id="hcMarmot">
            <path d={SIL_D} transform={`translate(${vx.toFixed(2)} ${vy.toFixed(2)}) scale(${vk.toFixed(5)})`} />
          </clipPath>
        </defs>
        {routeD ? <InkStroke d={routeD} width={6} tone={1} /> : null}
        {head && frame < T.route[1] + 1 ? <circle cx={head[0]} cy={head[1]} r={6} fill={ACCENT} stroke={DARK} strokeOpacity={0.6} strokeWidth={1.6} /> : null}
        {dotR > 0.05 ? <circle cx={qx} cy={qy} r={dotR} fill={ACCENT} stroke={DARK} strokeOpacity={0.7} strokeWidth={Math.min(2, dotR * 0.3)} /> : null}
        {crawling.length ? (
          <g clipPath="url(#hcMarmot)">
            <Germs points={crawling} r={germR} />
          </g>
        ) : null}
        {flying.length ? <Germs points={flying} r={germR} /> : null}
      </svg>
    </Page>
  );
};

export default HalfTheContinent;
