import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { z } from "zod";
import laMapJson from "../../public/hadrian05/la_map.json";
import { FRAME_H, FRAME_W, clamp, smoothstep } from "./fieldShared";

const { fontFamily } = loadFont("normal", {
  weights: ["700", "800", "900"],
  subsets: ["latin"],
});

// ---------------------------------------------------------------------------
// "LITTLE TOWN IN L.A." — Hadrian 05.
//
// CHECK LINE (what the viewer can say after this cut): "The town she means is
// El Segundo, a small patch on the coast of Los Angeles right under LAX."
//
// DURATION. The slot is sequence 00:00:00.000 - 00:00:03.583 at 24.000 fps:
// round(3.583 * 24) = 86 frames. No tail; the edit cuts to the speaker at 86.
// Spoken: "This little town in L.A. might be our last chance to compete with
// China." Word onsets: This 0, little 6, town 11, in 17, L.A. 22, might 28,
// last 40, chance 48, compete 60, China 72.
//
// THE MOTION, in three sentences. One continuous push-in on an ordinary flat
// map of the Los Angeles basin, already travelling at frame 0, from a frame
// 70 km wide down to ~10.5 km with El Segundo in the middle; it travels through
// the whole cut and settles around f68 into a slow creep. On "little town" a
// small white map pin falls onto the town behind its orange / purple / blue
// chain echo, so the eye has a target for the rest of the move. Once the town
// is large enough to read (f30-46) its real boundary draws on in white, and
// EL SEGUNDO slides up above the pin (f40-56) while the camera is still easing.
//
// THE CAMERA is analytic, not the house damper: frame 0 has to be moving
// already, and a damper starts from rest. ln(scale) rides one smoothstep that
// began 8 frames before the cut (so f0 is already travelling, ~1.2% zoom per
// frame, peaking ~3.6% around f30) and lands at f68, plus a linear creep of
// ~0.17% per frame that runs the whole cut. The focal point's SCREEN position
// rides the same curve, so the pan and the zoom are one move.
//
// THE MAP is real OSM geometry in a local equirectangular projection (km,
// cos 33.95 deg on longitude), north up. The only core-memory things in the
// frame are the pin, the town outline and the EL SEGUNDO label: white ink on
// a hard black +4/+4 screen-px shadow drawn as a translated copy, raw hex, no
// glow, no blend mode, no opacity fade on anything.
//
// Map data (c) OpenStreetMap contributors.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 86;

type LonLat = [number, number];
type LaMap = {
  coast: { closed: boolean; pts: LonLat[] }[];
  motorways: Record<string, LonLat[][]>;
  elSegundo: LonLat[];
  laxRunways: LonLat[][];
  localRoads: { name: string; pts: LonLat[] }[];
  places: Record<string, LonLat>;
};
const laMap = laMapJson as unknown as LaMap;

// -- projection: lon/lat -> km, origin at El Segundo's land centroid ---------
const LON0 = -118.402;
const LAT0 = 33.9165;
const KM_LON = 111.32 * Math.cos((33.95 * Math.PI) / 180);
const KM_LAT = 110.92;
type P = { x: number; y: number };
const proj = ([lon, lat]: LonLat): P => ({ x: (lon - LON0) * KM_LON, y: -(lat - LAT0) * KM_LAT });
const n3 = (v: number) => v.toFixed(3);
const line = (pts: P[]) => pts.map((p, i) => `${i ? "L" : "M"}${n3(p.x)} ${n3(p.y)}`).join("");

// -- the map's static paths, built once --------------------------------------
const MAIN_COAST = laMap.coast[0].pts;
const LAND_PATH = [
  `${line(
    [...MAIN_COAST, [-117.4, 33.59] as LonLat, [-117.4, 35.2] as LonLat, [-119.4, 35.2] as LonLat, [-119.4, 34.066] as LonLat].map(proj),
  )}Z`,
  ...laMap.coast.slice(1).map((c) => `${line(c.pts.map(proj))}Z`),
].join("");
const MOTORWAY_PATH = Object.values(laMap.motorways)
  .flat()
  .map((pl) => line(pl.map(proj)))
  .join("");
const LOCAL_PATH = laMap.localRoads.map((r) => line(r.pts.map(proj))).join("");
const RUNWAY_PATH = laMap.laxRunways.map((r) => line(r.map(proj))).join("");

// El Segundo's boundary runs out to sea. Cut it at the coastline so the town is
// its LAND: the two points where the ring crosses the coast, the ring between
// them, and the beach back again.
const cross = (a: LonLat, b: LonLat, p: LonLat, q: LonLat) => {
  const d1 = [b[0] - a[0], b[1] - a[1]];
  const d2 = [q[0] - p[0], q[1] - p[1]];
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  if (den === 0) return null;
  const t = ((p[0] - a[0]) * d2[1] - (p[1] - a[1]) * d2[0]) / den;
  const u = ((p[0] - a[0]) * d1[1] - (p[1] - a[1]) * d1[0]) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { t, pt: [a[0] + d1[0] * t, a[1] + d1[1] * t] as LonLat };
};
const TOWN_PATH = (() => {
  const ring = laMap.elSegundo;
  const hits: { i: number; j: number; pt: LonLat }[] = [];
  for (let i = 0; i < ring.length - 1; i++) {
    for (let j = 0; j < MAIN_COAST.length - 1; j++) {
      const h = cross(ring[i], ring[i + 1], MAIN_COAST[j], MAIN_COAST[j + 1]);
      if (h) hits.push({ i, j, pt: h.pt });
    }
  }
  if (hits.length !== 2) {
    throw new Error(`LittleTownInLA: expected 2 coast crossings, got ${hits.length}`);
  }
  const [a, b] = hits; // a: north end of the beach, b: south end
  const beach: LonLat[] = [];
  for (let j = b.j; j > a.j; j--) beach.push(MAIN_COAST[j]);
  // Starts on the coast at the north (LAX) end and runs east, south, back west
  // to the sea and up the beach, so the draw-on closes where it began.
  return `${line([a.pt, ...ring.slice(a.i + 1, b.i + 1), b.pt, ...beach].map(proj))}Z`;
})();

// -- colours -----------------------------------------------------------------
const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";

export const schema = z.object({
  ocean: z.string(),
  land: z.string(),
  freeway: z.string(),
  freewayCasing: z.string(),
  localRoad: z.string(),
  runway: z.string(),
  landLabel: z.string(),
  oceanLabel: z.string(),
  ink: z.string(),
  shadow: z.string(),
  orange: z.string(),
  purple: z.string(),
  blue: z.string(),
  shadowOffset: z.number(), // SCREEN px
  townTint: z.number(),
  label: z.string(),
  labelSize: z.number(),
  pinHeight: z.number(),
  // where the pin stands, inside the town
  pinLonLat: z.tuple([z.number(), z.number()]),
  // the camera
  openWidthKm: z.number(),
  landWidthKm: z.number(),
  openCentre: z.tuple([z.number(), z.number()]),
  focusLonLat: z.tuple([z.number(), z.number()]),
  focusScreen: z.tuple([z.number(), z.number()]),
  landFrame: z.number(),
  creep: z.number(), // total zoom gained by the creep over the cut, e.g. 0.05
  beats: z.object({
    pin: z.number(),
    outline: z.number(),
    label: z.number(),
  }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ocean: "#6A91A8",
  land: "#B3AD9E",
  freeway: "#E6E0CF",
  freewayCasing: "#948E7F",
  localRoad: "#C6C0B1",
  runway: "#878275",
  landLabel: "#7B7667",
  oceanLabel: "#4B7087",
  ink: WHITE,
  shadow: BLACK,
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  shadowOffset: 4,
  townTint: 0.24,
  label: "EL SEGUNDO",
  labelSize: 74,
  pinHeight: 100,
  pinLonLat: [-118.402, 33.9085],
  openWidthKm: 70,
  landWidthKm: 12.15,
  openCentre: [-118.42, 33.87],
  focusLonLat: [LON0, LAT0],
  focusScreen: [540, 905],
  landFrame: 68,
  creep: 0.16,
  beats: { pin: 6, outline: 30, label: 40 },
});

// -- the camera --------------------------------------------------------------
const LEAD = 8; // the push began this many frames before the cut
export const cameraAt = (frame: number, p: Props) => {
  const span = p.landFrame + LEAD;
  const u0 = smoothstep(LEAD / span);
  const g = (smoothstep((frame + LEAD) / span) - u0) / (1 - u0); // 0 at f0, 1 at landFrame
  const s0 = FRAME_W / p.openWidthKm;
  const s1 = FRAME_W / p.landWidthKm;
  const s = Math.exp(Math.log(s0) + (Math.log(s1) - Math.log(s0)) * g + (Math.log(1 + p.creep) * frame) / DURATION);
  const F = proj(p.focusLonLat as LonLat);
  const C0 = proj(p.openCentre as LonLat);
  // the focal point's screen position at f0, from the opening centre
  const fx0 = FRAME_W / 2 + (F.x - C0.x) * s0;
  const fy0 = FRAME_H / 2 + (F.y - C0.y) * s0;
  const fx = fx0 + (p.focusScreen[0] - fx0) * g;
  const fy = fy0 + (p.focusScreen[1] - fy0) * g;
  // world -> screen: X = tx + x * s
  const tx = fx - F.x * s;
  const ty = fy - F.y * s;
  return { s, tx, ty, widthKm: FRAME_W / s, cx: (FRAME_W / 2 - tx) / s, cy: (FRAME_H / 2 - ty) / s };
};

const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const CHAIN_STAGGER = 2;
const PIN_TRAVEL = 12;
const PIN_FALL = 340;
const CROWN_STEP = 5;

// A map pin: a round head on a point, tip at (0, 0), `h` tall.
const pinPath = (h: number) => {
  const r = h * 0.33;
  const cy = -(h - r);
  // tangent points from the tip to the head
  const d = -cy;
  const a = Math.acos(r / d);
  const txp = r * Math.sin(a);
  const typ = cy + r * Math.cos(a);
  return `M0 0L${(-txp).toFixed(2)} ${typ.toFixed(2)}A${r.toFixed(2)} ${r.toFixed(2)} 0 1 1 ${txp.toFixed(2)} ${typ.toFixed(2)}Z`;
};

const LittleTownInLA: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame, p);
  const { s, tx, ty } = cam;
  const toScreen = (ll: LonLat) => {
    const w = proj(ll);
    return { x: tx + w.x * s, y: ty + w.y * s };
  };
  const px = (screenPx: number) => screenPx / s; // a screen length in world units

  const pinD = useMemo(() => pinPath(p.pinHeight), [p.pinHeight]);
  const foot = toScreen(p.pinLonLat as LonLat);
  const footW = proj(p.pinLonLat as LonLat);

  const slide = (f0: number, frames: number, distance: number) =>
    (1 - interpolate(frame, [f0, f0 + frames], [0, 1], { easing: EASE_LAND, ...clamp })) * distance;

  // -- road weights, in SCREEN px, growing with the zoom ----------------------
  const zoom = interpolate(Math.log(s), [Math.log(15), Math.log(90)], [0, 1], clamp);
  const fwW = 5.5 + 7.5 * zoom;
  const fwCase = fwW + 2.5 + 2 * zoom;
  const localW = interpolate(s, [30, 75], [0, 4.5], clamp);
  const runwayW = Math.max(1.5, 0.075 * s);

  // -- the town ---------------------------------------------------------------
  const outlineT = interpolate(frame, [p.beats.outline, p.beats.outline + 16], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp,
  });
  // the tint spreads out from the pin as a hard-edged disc, clipped to the town
  const tintR = interpolate(frame, [p.beats.outline + 2, p.beats.outline + 16], [0, 4.2], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const outlineW = 5;

  // -- the pin ----------------------------------------------------------------
  const coreStart = p.beats.pin + 3 * CHAIN_STAGGER;
  const chain = [
    { color: p.orange, start: p.beats.pin, rest: -3 * CROWN_STEP },
    { color: p.purple, start: p.beats.pin + CHAIN_STAGGER, rest: -2 * CROWN_STEP },
    { color: p.blue, start: p.beats.pin + 2 * CHAIN_STAGGER, rest: -CROWN_STEP },
  ];
  const coreDy = -slide(coreStart, PIN_TRAVEL, PIN_FALL);
  const headR = p.pinHeight * 0.33;
  const headCy = -(p.pinHeight - headR);

  // one ring off the pin's foot, just after the label starts: it widens and thins to nothing
  const ringT = interpolate(frame, [p.beats.label + 2, p.beats.label + 24], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });

  // -- type -------------------------------------------------------------------
  const mapLabel = (
    key: string,
    text: string,
    ll: LonLat,
    size: number,
    fill: string,
    tracking = 0.14,
    weight: 700 | 800 = 700,
  ) => {
    const q = toScreen(ll);
    if (q.x < -400 || q.x > FRAME_W + 400 || q.y < -100 || q.y > FRAME_H + 100) return null;
    return (
      <text
        key={key}
        x={q.x + (tracking * size) / 2}
        y={q.y}
        textAnchor="middle"
        fill={fill}
        style={{ fontFamily, fontWeight: weight, fontSize: size, letterSpacing: `${tracking}em` }}
      >
        {text}
      </text>
    );
  };

  const labelBaseline = foot.y - p.pinHeight - 3 * CROWN_STEP - 16;
  const labelDy = slide(p.beats.label, 16, 48);

  return (
    <AbsoluteFill style={{ backgroundColor: p.ocean }}>
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="ltla-town">
            <path d={TOWN_PATH} />
          </clipPath>
        </defs>

        {/* THE MAP, in km, under the camera. */}
        <g transform={`translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${s.toFixed(5)})`}>
          <path d={LAND_PATH} fill={p.land} />
          {localW > 0.3 ? (
            <path d={LOCAL_PATH} fill="none" stroke={p.localRoad} strokeWidth={px(localW)} strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
          <path d={RUNWAY_PATH} fill="none" stroke={p.runway} strokeWidth={px(runwayW)} strokeLinecap="butt" />
          <path d={MOTORWAY_PATH} fill="none" stroke={p.freewayCasing} strokeWidth={px(fwCase)} strokeLinecap="round" strokeLinejoin="round" />
          <path d={MOTORWAY_PATH} fill="none" stroke={p.freeway} strokeWidth={px(fwW)} strokeLinecap="round" strokeLinejoin="round" />

          {/* THE TOWN: a light tint spreading from the pin, then its outline. */}
          {tintR > 0 ? (
            <g clipPath="url(#ltla-town)">
              <circle cx={footW.x} cy={footW.y} r={tintR} fill={p.ink} fillOpacity={p.townTint} />
            </g>
          ) : null}
          {outlineT > 0 ? (
            <>
              <path
                d={TOWN_PATH}
                transform={`translate(${px(p.shadowOffset)} ${px(p.shadowOffset)})`}
                fill="none"
                stroke={p.shadow}
                strokeWidth={px(outlineW)}
                strokeLinejoin="round"
                strokeLinecap="butt"
                pathLength={1}
                strokeDasharray={`${outlineT} 1`}
              />
              <path
                d={TOWN_PATH}
                fill="none"
                stroke={p.ink}
                strokeWidth={px(outlineW)}
                strokeLinejoin="round"
                strokeLinecap="butt"
                pathLength={1}
                strokeDasharray={`${outlineT} 1`}
              />
            </>
          ) : null}
        </g>

        {/* THE MAP'S OWN LABELS: quiet, a darker tone of the ground, screen-sized. */}
        {mapLabel("la", "LOS ANGELES", [-118.2437, 34.062], 46, p.landLabel, 0.2)}
        {mapLabel("po", "PACIFIC OCEAN", [-118.62, 33.8], 40, p.oceanLabel, 0.24)}
        {mapLabel("sm", "SANTA MONICA", [-118.5, 34.05], 26, p.landLabel)}
        {mapLabel("lb", "LONG BEACH", [-118.13, 33.826], 26, p.landLabel)}
        {s > 48 ? mapLabel("lax", "LAX", [-118.4075, 33.9418], 44, p.landLabel, 0.1, 800) : null}

        {/* THE RING off the pin's foot, once. */}
        {ringT > 0 && ringT < 1 ? (
          <circle cx={foot.x} cy={foot.y} r={8 + 96 * ringT} fill="none" stroke={p.ink} strokeWidth={7 * (1 - ringT)} />
        ) : null}

        {/* EL SEGUNDO: slides up from behind the pin's head while it appears. */}
        {frame >= p.beats.label ? (
          <g style={{ fontFamily, fontWeight: 900, fontSize: p.labelSize }}>
            <text x={foot.x + p.shadowOffset} y={labelBaseline + labelDy + p.shadowOffset} textAnchor="middle" fill={p.shadow}>
              {p.label}
            </text>
            <text x={foot.x} y={labelBaseline + labelDy} textAnchor="middle" fill={p.ink}>
              {p.label}
            </text>
          </g>
        ) : null}
        {/* THE PIN: constant screen size, standing on the town. */}
        <g transform={`translate(${foot.x.toFixed(2)} ${foot.y.toFixed(2)})`}>
          {frame >= coreStart ? (
            <path d={pinD} transform={`translate(${p.shadowOffset} ${coreDy + p.shadowOffset})`} fill={p.shadow} />
          ) : null}
          {chain.map((c) =>
            frame >= c.start ? (
              <path
                key={c.color}
                d={pinD}
                transform={`translate(0 ${(c.rest - slide(c.start, PIN_TRAVEL, PIN_FALL)).toFixed(2)})`}
                fill={c.color}
              />
            ) : null,
          )}
          {frame >= coreStart ? (
            <g transform={`translate(0 ${coreDy.toFixed(2)})`}>
              <path d={pinD} fill={p.ink} />
              <circle cx={0} cy={headCy} r={headR * 0.4} fill={p.shadow} />
            </g>
          ) : null}
        </g>

      </svg>
    </AbsoluteFill>
  );
};

export default LittleTownInLA;
