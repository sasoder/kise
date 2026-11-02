// ---------------------------------------------------------------------------
// DirtyDogs (wip-victorians, cut 17). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 65 frames.
//
// CHECK LINE: "These dogs ran a quarter of the planet."
//
// THE LINE: "how do these dirty dogs run a quarter of the planet?"
// WORD -> FRAME: how 0 · do 6 · these 9 · dirty 12 · dogs 20 · run 27 · a 35 · quarter 39 · of 44 · the 47 · planet 50
// DURATION: the slot 17.750 -> 20.458 s = 2.708 s x 24 = 65 frames (f0..f64).
//
// THE MOTION: opens on the exact last frame of FourOrFiveHours (same watch, same paper, same grain sequence), and one
// camera tilt runs down the page from f0: the watch is off the top by about f17, and the dog in his hat is in shot by f20,
// on "dogs". He stands on an ink-printed globe that turns at one even speed all cut. From "run" one meridian wave
// runs with the turn from the right limb to the left, and each piece of the empire goes from indigo to red as it passes:
// Australia, India, East Africa, Nigeria, Britain on "planet" (f50). The dog never moves; the globe keeps turning to the end.
// Contact frames: none, nothing lands. First red f27-28 at the right limb; last red, Ireland, f50.
// SPOT INK: red = the empire; indigo = the printed base layer (all other land, the globe's ring, and a very pale wash for the ocean). No text.
//
// SOURCES: land: world-atlas countries-110m (Natural Earth), modern borders as a stand-in for the empire c. 1913, which
// covered about a quarter of the world's land; no number on screen. Added to the brief's list so they do not show as
// holes: S. Sudan (then part of Sudan), Lesotho and eSwatini (then British). Canada and New Zealand are red in the data, off
// the visible face. Bulldog: assets_raw/objects/Bulldog_modern2_CC0.jpg, OtisGD, CC0 (commons File:English_Bulldog_Ouside.jpg),
// a modern dog: no Victorian photograph of a true British bulldog was found. Top hat: assets_raw/objects/TopHat_MET_CP160.jpg,
// the Met, CC0 (commons File:Evening_top_hat_MET_CP160_CP1.jpg). Mattes: Apple Vision; grade: bake-photo.py.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
// @ts-expect-error untyped module
import { geoArea, geoOrthographic, geoPath } from "d3-geo";
// @ts-expect-error untyped module
import { merge } from "topojson-client";
import countries110 from "world-atlas/countries-110m.json";
import { PocketWatch, WATCH_D, WATCH_X, WATCH_Y } from "./watchShared";
import { CaptionBandsDebug, CutOut, INDIGO, InkPrint, PaperGround, RED, WipFilmLife, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";

export const FPS = 24;
export const DURATION = 65;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// -- the camera: one tilt down the page ---------------------------------------------------
/** How far down the page the settled frame is: world y = settled screen y + TILT. */
const TILT = 1740; // the hat and its shadow stay below the frame at f0, so the join is exact
const camAt = runWipCamera(
  [
    { f: -1, x: 540, y: 960, k: 1 },
    { f: 0, x: 540, y: 960, k: 1 },
    // an even run, then a long settle: the speed has one lobe, peaking near 100 px a frame
    { f: 17, x: 540, y: 960 + 1700, k: 1, ease: "linear" },
    { f: 34, x: 540, y: 960 + TILT, k: 1, ease: "linear" },
    { f: DURATION, x: 540, y: 960 + TILT + 26, k: 1, ease: "linear" },
  ],
  DURATION,
);
// The join: cut 13's last frame is f96 at exactly this camera, this watch.
const JOIN_FRAME = 96;
const start = camAt(0);
if (start.x !== 540 || start.y !== 960 || start.k !== 1 || start.x0 !== 540 || start.y0 !== 960) throw new Error("DirtyDogs: the camera has left the join at f0");
if (WATCH_X !== 540 || WATCH_Y !== 720 || WATCH_D !== 720) throw new Error("DirtyDogs: the watch no longer matches the join");
const PAPER_DEPTH = 1.95; // the sheet is farther back than the kit's default so this long tilt stays on it

// -- the globe ---------------------------------------------------------------------------
const R = 410;
const GLOBE_X = 540;
const GLOBE_Y = 1290 + TILT;
const PAD = 8;
const BOX = 2 * (R + PAD);

/** Modern borders as a stand-in for c. 1913. S. Sudan (then part of Sudan), Lesotho and eSwatini fill what would be holes. */
const EMPIRE = new Set([
  "Canada", "India", "Pakistan", "Bangladesh", "Myanmar", "Australia", "New Zealand", "South Africa", "Lesotho", "eSwatini",
  "Egypt", "Sudan", "S. Sudan", "Nigeria", "Ghana", "Kenya", "Uganda", "Tanzania", "Zimbabwe", "Zambia", "Malawi", "Botswana",
  "Malaysia", "Sri Lanka", "Ireland", "United Kingdom",
]);
type Geom = { properties: { name: string } };
const topo = countries110 as unknown as { objects: { countries: { geometries: Geom[] } } };
const geoms = topo.objects.countries.geometries;
const EMPIRE_LAND = merge(topo, geoms.filter((g) => EMPIRE.has(g.properties.name)));
const OTHER_LAND = merge(topo, geoms.filter((g) => !EMPIRE.has(g.properties.name)));
const missing = [...EMPIRE].filter((n) => !geoms.some((g) => g.properties.name === n));
if (missing.length > 0) throw new Error(`DirtyDogs: not in countries-110m: ${missing.join(", ")}`);

// The turn: one even speed for the whole cut, the surface travelling right to left, from Africa to India and Australia.
const LON_START = 22;
const LON_END = 72;
const LAT = 9;
const ROLL = -11;
const lonAt = (frame: number) => LON_START + ((LON_END - LON_START) * frame) / (DURATION - 1);

// The wave: a meridian running from past the right limb to past the left, with the turn, f27 "run" to f50 "planet".
const WAVE_START = 27;
const WAVE_END = 50;
const WAVE_EASE = Easing.bezier(0.3, 0.2, 0.7, 0.8); // close to even: the sweep has to read across the disc, and it lands on Britain on "planet"
const waveLon = (frame: number) => {
  const t = interpolate(frame, [WAVE_START, WAVE_END], [0, 1], { ...clamp, easing: WAVE_EASE });
  const from = lonAt(WAVE_START) + 85; // on the right limb as "run" starts
  const to = lonAt(WAVE_END) - 78; // just past Ireland
  return from + t * (to - from);
};
const FAR_EAST = 215; // the lune's far edge, always behind the globe

/** The printed lune, from the wave's front east to FAR_EAST, its front slightly uneven like a hand-pulled edge. */
const printedLune = (front: number) => {
  const ring: [number, number][] = [];
  for (let lat = -89; lat <= 89; lat += 2) ring.push([front + 3.2 * Math.sin(lat * 0.11 + 0.6) + 1.6 * Math.sin(lat * 0.29), lat]);
  for (let lon = front + 8; lon < FAR_EAST; lon += 8) ring.push([lon, 89]);
  for (let lat = 89; lat >= -89; lat -= 2) ring.push([FAR_EAST, lat]);
  for (let lon = FAR_EAST - 8; lon > front; lon -= 8) ring.push([lon, -89]);
  ring.push(ring[0]);
  const poly = { type: "Polygon", coordinates: [ring] };
  const want = ((FAR_EAST - front) * Math.PI) / 90;
  if (Math.abs(geoArea(poly) - want) < 2) return poly;
  return { type: "Polygon", coordinates: [[...ring].reverse()] };
};

// The ocean: a very pale indigo wash, knocked out where the land prints, so indigo and red keep their own colour.
const OCEAN = "#BECBE0";

const Globe: React.FC<{ frame: number }> = ({ frame }) => {
  const projection = geoOrthographic()
    .scale(R)
    .translate([R + PAD, R + PAD])
    .rotate([-lonAt(frame), -LAT, ROLL])
    .clipAngle(90)
    .precision(0.25);
  const path = geoPath(projection);
  const printed: string = frame < WAVE_START ? "" : path(printedLune(waveLon(frame))) ?? "";
  const box = `M0 0H${BOX}V${BOX}H0Z`;
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <clipPath id="dd-printed">
            <path d={printed} />
          </clipPath>
          <clipPath id="dd-unprinted">
            <path d={`${box} ${printed}`} clipRule="evenodd" />
          </clipPath>
        </defs>
      </svg>
      <InkPrint x={GLOBE_X - R - PAD} y={GLOBE_Y - R - PAD} w={BOX} h={BOX} ink={OCEAN} seed="globe-ocean" rough={1.2} wear={0.22} misregister={0}>
        <svg width={BOX} height={BOX} viewBox={`0 0 ${BOX} ${BOX}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={`${path({ type: "Sphere" })} ${path(OTHER_LAND)} ${path(EMPIRE_LAND)}`} fill="currentColor" fillRule="evenodd" />
        </svg>
      </InkPrint>
      <InkPrint x={GLOBE_X - R - PAD} y={GLOBE_Y - R - PAD} w={BOX} h={BOX} ink={INDIGO} seed="globe-indigo" rough={1.2} wear={0.22} misregister={1.2}>
        <svg width={BOX} height={BOX} viewBox={`0 0 ${BOX} ${BOX}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <circle cx={R + PAD} cy={R + PAD} r={R} fill="none" stroke="currentColor" strokeWidth={5} />
          <path d={path(OTHER_LAND)} fill="currentColor" />
          <g clipPath="url(#dd-unprinted)">
            <path d={path(EMPIRE_LAND)} fill="currentColor" />
          </g>
        </svg>
      </InkPrint>
      {frame >= WAVE_START ? (
        <InkPrint x={GLOBE_X - R - PAD} y={GLOBE_Y - R - PAD} w={BOX} h={BOX} ink={RED} seed="globe-red" rough={1.2} wear={0.22} misregister={1.2}>
          <svg width={BOX} height={BOX} viewBox={`0 0 ${BOX} ${BOX}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <g clipPath="url(#dd-printed)">
              <path d={path(EMPIRE_LAND)} fill="currentColor" />
            </g>
          </svg>
        </InkPrint>
      ) : null}
    </>
  );
};

// -- the dog and his hat: pasted on, tilted so all three feet rest on the globe's curve, never moving -------------------
const DOG = { src: "wip-victorians/dd_bulldog.png", aspect: 0.775, w: 480, x: 540, y: 792 + TILT, rotate: 12 };
const HAT = { src: "wip-victorians/dd_tophat.png", aspect: 1.1139, w: 270, x: 532, y: 406 + TILT, rotate: 5 };

const DirtyDogs: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <>
      <WipFilmLife frame={JOIN_FRAME + frame}>
        <PaperGround cam={cam} d={PAPER_DEPTH} />
        <PocketWatch frame={JOIN_FRAME + frame} cam={cam} />
        <WipPlane cam={cam} ink>
          <Globe frame={frame} />
        </WipPlane>
        <WipPlane cam={cam}>
          <CutOut src={DOG.src} x={DOG.x} y={DOG.y} w={DOG.w} aspect={DOG.aspect} rotate={DOG.rotate} border={7} seed="dog" />
          <CutOut src={HAT.src} x={HAT.x} y={HAT.y} w={HAT.w} aspect={HAT.aspect} rotate={HAT.rotate} border={6} seed="hat" />
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default DirtyDogs;
