import { useMemo } from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { z } from "zod";
import laMapJson from "../../public/hadrian05/la_map.json";
import { FRAME_H, FRAME_W, Vignette, clamp, smoothstep } from "./fieldShared";

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
// THE MAP (v3, on the user's note "a bit more realistic, not hyper realistic").
// The LAND is real aerial imagery: four nested USGS mosaics (z11..z14) stacked
// as levels of detail, each placed by its exact lon/lat bounds, the inset ones
// feathered at their edges and only drawn once they are no longer heavily
// minified. It is graded down (less saturated, darker) so the white ink stays
// the brightest thing. The OCEAN is drawn: one flat deep blue polygon laid OVER
// the imagery (everything that is not inside the OSM coastline), which is what
// hides the imagery's black / striped offshore tiles, with a soft lighter band
// hugging the coast. Everything is in Web Mercator, scaled to km at El
// Segundo's latitude, so the OSM vectors and the imagery register. Freeways
// stay as thin pale lines at part opacity; local roads and runway bars are
// gone because the imagery shows the real ones. The only core-memory things in
// the frame are the pin, the town outline and the EL SEGUNDO label: white ink
// on a hard black +4/+4 screen-px shadow drawn as a translated copy, raw hex,
// no glow, no blend mode.
//
// Map data (c) OpenStreetMap contributors.
// Imagery: USGS The National Map (public domain).
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

// -- projection: Web Mercator, in km at El Segundo's latitude, origin at the
// town's land centroid. x is linear in lon, y in ln(tan(pi/4 + lat/2)), which
// is exactly how the imagery mosaics are laid out.
const LON0 = -118.402;
const LAT0 = 33.9165;
const RAD = Math.PI / 180;
const KM_PER_RAD = (111.32 / RAD) * Math.cos(LAT0 * RAD);
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2));
const MERC0 = mercY(LAT0);
type P = { x: number; y: number };
const proj = ([lon, lat]: LonLat): P => ({ x: (lon - LON0) * RAD * KM_PER_RAD, y: -(mercY(lat) - MERC0) * KM_PER_RAD });
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
// The ocean is everything that is not land: a big box with the land punched out
// of it (evenodd), so the harbour islands punch back in as land.
const OCEAN_PATH = `${line(
  ([[-119.8, 35.6], [-117.0, 35.6], [-117.0, 32.4], [-119.8, 32.4]] as LonLat[]).map(proj),
)}Z${LAND_PATH}`;

// The aerial mosaics, bottom to top. Bounds are exact tile edges (sat_meta.json).
const SAT = [
  { src: "hadrian05/sat_z11.jpg", west: -119.00390625, east: -117.94921875, north: 34.59704151614416, south: 33.137551192346145, w: 1536, h: 2560 },
  { src: "hadrian05/sat_z12.jpg", west: -118.65234375, east: -118.125, north: 34.23451236236985, south: 33.504759069226075, w: 1536, h: 2560 },
  { src: "hadrian05/sat_z13.jpg", west: -118.564453125, east: -118.2568359375, north: 34.089061315849946, south: 33.68778175843937, w: 1792, h: 2816 },
  { src: "hadrian05/sat_z14.jpg", west: -118.4765625, east: -118.32275390625, north: 34.016241889667015, south: 33.779147331286474, w: 1792, h: 3328 },
].map((m) => ({ ...m, a: proj([m.west, m.north]), b: proj([m.east, m.south]) }));
const FEATHER = 6; // % of an inset level's edge that fades out
const MASK_X = `linear-gradient(to right, transparent, #000 ${FEATHER}%, #000 ${100 - FEATHER}%, transparent)`;
const MASK_Y = `linear-gradient(to bottom, transparent, #000 ${FEATHER}%, #000 ${100 - FEATHER}%, transparent)`;

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
  oceanShallow: z.string(),
  landBase: z.string(), // behind the imagery, never meant to show
  imageryFilter: z.string(),
  vignette: z.number(),
  freeway: z.string(),
  freewayOpacity: z.number(),
  mapLabel: z.string(),
  mapLabelOpacity: z.number(),
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
  ocean: "#35627C",
  oceanShallow: "#6C9DB3",
  landBase: "#5B5E52",
  imageryFilter: "saturate(0.8) brightness(0.85) contrast(1.05)",
  vignette: 0.22,
  freeway: "#F1EAD6",
  freewayOpacity: 0.65,
  mapLabel: "#F2EEE4",
  mapLabelOpacity: 0.85,
  ink: WHITE,
  shadow: BLACK,
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  shadowOffset: 4,
  townTint: 0.27,
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
  const mapT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${s.toFixed(5)})`;
  // the shallow band's width in SCREEN px: ~1.6 km of sea, between 40 and 220 px
  const shallowW = Math.min(220, Math.max(40, 2 * 1.6 * s));

  const pinD = useMemo(() => pinPath(p.pinHeight), [p.pinHeight]);
  const foot = toScreen(p.pinLonLat as LonLat);
  const footW = proj(p.pinLonLat as LonLat);

  const slide = (f0: number, frames: number, distance: number) =>
    (1 - interpolate(frame, [f0, f0 + frames], [0, 1], { easing: EASE_LAND, ...clamp })) * distance;

  // -- road weights, in SCREEN px, growing with the zoom ----------------------
  const zoom = interpolate(Math.log(s), [Math.log(15), Math.log(90)], [0, 1], clamp);
  const fwW = 3.2 + 3.8 * zoom;

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
  const mapLabel = (key: string, text: string, ll: LonLat, size: number, tracking = 0.14, weight: 700 | 800 = 700, opacity = p.mapLabelOpacity) => {
    const q = toScreen(ll);
    if (q.x < -400 || q.x > FRAME_W + 400 || q.y < -100 || q.y > FRAME_H + 100) return null;
    const style = { fontFamily, fontWeight: weight, fontSize: size, letterSpacing: `${tracking}em` };
    const x = q.x + (tracking * size) / 2;
    return (
      <g key={key} opacity={opacity}>
        <text x={x + 2} y={q.y + 2} textAnchor="middle" fill={p.shadow} style={style}>
          {text}
        </text>
        <text x={x} y={q.y} textAnchor="middle" fill={p.mapLabel} style={style}>
          {text}
        </text>
      </g>
    );
  };

  const labelBaseline = foot.y - p.pinHeight - 3 * CROWN_STEP - 16;
  const labelDy = slide(p.beats.label, 16, 48);

  return (
    <AbsoluteFill style={{ backgroundColor: p.landBase }}>
      {/* THE LAND: aerial imagery, levels of detail, graded as one. */}
      <AbsoluteFill style={{ filter: p.imageryFilter, overflow: "hidden" }}>
        {SAT.map((m, i) => {
          const sx = ((m.b.x - m.a.x) * s) / m.w;
          const sy = ((m.b.y - m.a.y) * s) / m.h;
          // an inset level comes in only once it is no longer heavily minified
          const opacity = i < 2 ? 1 : interpolate(sx, [0.4, 0.55], [0, 1], clamp);
          if (opacity <= 0) return null;
          const inset = i > 0;
          return (
            <div
              key={m.src}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: m.w,
                height: m.h,
                transformOrigin: "0 0",
                transform: `translate(${(tx + m.a.x * s).toFixed(3)}px, ${(ty + m.a.y * s).toFixed(3)}px) scale(${sx.toFixed(6)}, ${sy.toFixed(6)})`,
                opacity,
                maskImage: inset ? MASK_X : undefined,
                WebkitMaskImage: inset ? MASK_X : undefined,
              }}
            >
              <Img
                src={staticFile(m.src)}
                style={{
                  display: "block",
                  width: m.w,
                  height: m.h,
                  maskImage: inset ? MASK_Y : undefined,
                  WebkitMaskImage: inset ? MASK_Y : undefined,
                }}
              />
            </div>
          );
        })}
      </AbsoluteFill>

      {/* THE OCEAN, drawn over the imagery, and the freeways. */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="ltla-ocean">
            <path d={OCEAN_PATH} clipRule="evenodd" transform={mapT} />
          </clipPath>
          <filter id="ltla-soft-a" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={(shallowW * 0.3).toFixed(2)} />
          </filter>
          <filter id="ltla-soft-b" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={(shallowW * 0.09).toFixed(2)} />
          </filter>
        </defs>
        <path d={OCEAN_PATH} fillRule="evenodd" fill={p.ocean} transform={mapT} />
        {/* shallow water: the coast stroked wide and blurred, kept to the sea */}
        <g clipPath="url(#ltla-ocean)">
          <g filter="url(#ltla-soft-a)" opacity={0.5}>
            <path d={LAND_PATH} fill="none" stroke={p.oceanShallow} strokeWidth={px(shallowW)} strokeLinejoin="round" transform={mapT} />
          </g>
          <g filter="url(#ltla-soft-b)" opacity={0.55}>
            <path d={LAND_PATH} fill="none" stroke={p.oceanShallow} strokeWidth={px(shallowW * 0.28)} strokeLinejoin="round" transform={mapT} />
          </g>
        </g>
        <path
          d={MOTORWAY_PATH}
          fill="none"
          stroke={p.freeway}
          strokeOpacity={p.freewayOpacity}
          strokeWidth={px(fwW)}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={mapT}
        />
      </svg>

      {p.vignette > 0 ? <Vignette strength={p.vignette} /> : null}

      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="ltla-town">
            <path d={TOWN_PATH} />
          </clipPath>
        </defs>

        <g transform={mapT}>
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

        {/* THE MAP'S OWN LABELS: light, quiet, screen-sized. */}
        {mapLabel("la", "LOS ANGELES", [-118.2437, 34.062], 44, 0.2)}
        {mapLabel("po", "PACIFIC OCEAN", [-118.62, 33.8], 38, 0.24, 700, 0.6)}
        {mapLabel("sm", "SANTA MONICA", [-118.5, 34.05], 26)}
        {mapLabel("lb", "LONG BEACH", [-118.13, 33.826], 26)}
        {s > 48 ? mapLabel("lax", "LAX", [-118.4075, 33.9418], 42, 0.1, 800) : null}

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
