// ---------------------------------------------------------------------------
// DriveOutOfAustin (robert-johnson-ranch, cut 6). Dwarkesh 3D style (styles/dwarkesh-3d.md), mood day, a real
// heightfield of the Hill Country west of Austin as the ground. Opaque 1080x1920, 23.976 fps, 322 frames.
// RENDER WITH --gl=angle (the ground is WebGL2).
//
// CHECK LINE: the woman Caro went to see lived 44 miles out of Austin, the last 22 on a dirt road through empty
// hills, with not one other house on the way.
//
// THE LINE: "You drive out of Austin 22 miles, and you look on your left, you'll find a cattle guard. You turn, and
// there's a dirt road there. You turn left on the dirt road and 22 miles to the farm."
// WORD -> FRAME (from the cut start; heard ~5 f later): drive 4 · out 9 · AUSTIN 23 · 22 45 · MILES 58 · look 87 ·
//   LEFT 102 · find 119 · CATTLE 130 · GUARD 138 · TURN 155 · DIRT 180 · ROAD 187 · there 194 · TURN 213 · LEFT 219 ·
//   dirt 237 · road 243 · 22 261 · MILES 273 · to 287 · FARM 303 (cut ends 322).
// DURATION: the slot 6.089 -> 19.520 s = 13.431 s x 23.976 = 322 frames (sequence frames 146-468).
//
// THE MOTION: one continuous follow-and-rise (driveCamera.ts: log-space keys, the house damped follow). f0-30 the
// camera opens on Austin (pale low blocks, the Colorado) near the frame centre while a slate 1970s sedan drives off
// west; AUSTIN fades in on its heard word (f27, full f32) over the city's west side and drains f40-46. f30-110 leg 1, the real US 290 to
// Dripping Springs, the cream-grey road drawn ahead of the car at constant speed; the camera lifts, the blacklands turn
// into the dissected Hill Country in one slow rise (D 5 -> 15.5 km); 22 MI fades in at the end of the finished leg on
// "22" (f50, full f55), drains f100-110. f110-185 the camera eases down toward the turn (D 1.75 km at f135-140) and
// leans toward the cattle guard on the car's left (steel pipes over a dark pit, two timber posts, barbed wire off both
// ways; the pipes ~130-155 px across f135-160). The car slows, turns left on
// TURN (f155-170) and crosses the guard (contact: front wheels on the pipes f183-185, rear f189-191, a small rattle).
// The pale caliche track draws on "there's a dirt road there" (f172-198) to the bend; the second left turn f213-219,
// then the track draws ahead of the car through the hills (f216-262) and the camera cranes up and back in log space
// (D 7 km -> 52 km) while the car keeps its size (symbolic scale: car length ~ D^0.85, shrinking to a third of the
// house f256-302), dust behind it. The farm stays in the air until the whole set is inside the frame, then comes out
// of it f265-271 (a cream Hill Country farmhouse whose gabled roof is the one orange thing, porch, chimney, a live oak,
// a windmill with a turning wheel); the second 22 MI fades in above it on "22" (f265, full f270); the car reaches the
// house on FARM (f300-304),
// stops, its dust settles; a slow creep to the end.
//
// GEOGRAPHY: leg 1 is the real US 290 (smoothed waypoints, downtown Austin -> Oak Hill -> Dripping Springs; the
// junction at 22 road-miles). LEGS 2-3 ARE ILLUSTRATIVE (Caro names no destination): a short track south from the
// highway, a left turn east-south-east, then a ranch road that follows valley floors of the DEM (least-cost path) south
// and south-west into the empty hills, cut at exactly 22 road-miles; the farm stands at its end.
// SOURCES: elevation AWS Terrain Tiles (Terrarium, z11, assets-src/robert-johnson-ranch/dem-z11); water Natural Earth
// 10m (hillcountry-water.geojson); places: Austin downtown -97.7431, 30.2672; Oak Hill -97.8605, 30.2335; Dripping
// Springs -98.0867, 30.1902. Bake: assets-src/robert-johnson-ranch/bake_drive.py -> public/robert-johnson-ranch/drive/
// and driveRouteData.ts. Relief exaggerated (x1.6 trend, x5 local).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, makeAirView, rgbHex, type AirScene } from "../kits/dwarkesh-3d/dwarkesh3d";
import { DURATION, FPS, TRAVEL, camAt, horizonY, roadWidths, hwyTip, dirtTip, toScreen } from "./driveCamera";
import { DriveGround, heightOf, useDriveHeights, type GroundLook } from "./driveGround";
import { Car, City, Clip, Dust, FARM_SCALE, Farm, Guard, Plate, carState, farmPoint, ridgeY, type Look } from "./driveProps";
import { PLACE } from "./driveRouteData";

export { DURATION, FPS };
export const schema = z.object({});
export const defaultProps = schema.parse({});

const to01 = (c: [number, number, number]) => c.map((q) => q / 255) as [number, number, number];

/** where the plates stand (world x, z; y = the land there + a lift) */
const AUSTIN_AT: [number, number] = [-2500, -500];
const PLATE1_AT: [number, number] = [-33000, 6900];
const PLATE2_AT = () => farmPoint(0.6, 0.8);

const DriveOutOfAustin: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const H0 = useDriveHeights();
  const cam = camAt(frame);
  const tr = TRAVEL[Math.min(TRAVEL.length - 1, frame)];
  const scene: AirScene = { look: "A", mood: "day", F: 1300, fogNear: 0, fogVis: 2.2 * cam.D, fogMax: 0.9, hLow: 0, hHigh: 2 * cam.D, moteUnit: 26000 };
  const v = makeAirView({ scene, frame, horizon: horizonY(cam), cam: { x: tr[0], y: tr[1], z: tr[2] }, rest: { x: 0, y: 0, z: 0 } });
  const near = v.airAt(cam.D * 1.5, 0);
  const far = v.airAt(1e9, 0);
  const rw = roadWidths(frame, cam.D);
  const look: GroundLook = { airNear: to01(near), airFar: to01(far), road: [rw.hwy, hwyTip(frame), rw.dirt, dirtTip(frame)] };
  const L: Look = { cam, airNear: rgbHex(near), airFar: rgbHex(far) };
  const hOf = (x: number, z: number) => (H0 ? heightOf(H0, x, z) : 0);
  const st = carState(frame);
  const carDepth = toScreen(cam, st.p.x, st.p.h, st.p.z).z;
  const farmE = PLACE.farm;
  const farmClip = ridgeY(cam, H0, farmE[0], farmE[1]) + 8;
  const p2 = PLATE2_AT();
  return (
    <AbsoluteFill style={{ backgroundColor: rgbHex(far) }}>
      <AirStage
        v={v}
        bloom={0.2}
        overlay={
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <Plate L={L} X={AUSTIN_AT[0]} Y={hOf(...AUSTIN_AT) + 60} Z={AUSTIN_AT[1]} text="AUSTIN" frame={frame} land={32} out={40} outDur={6} uid="pa" />
            <Plate L={L} X={PLATE1_AT[0]} Y={hOf(...PLATE1_AT) + 150} Z={PLATE1_AT[1]} text="22 MI" frame={frame} land={55} out={100} uid="p1" />
            <Plate L={L} X={p2.x} Y={hOf(p2.x, p2.z) + 0.75 * FARM_SCALE} Z={p2.z} text="22 MI" frame={frame} land={270} dy={-80} uid="p2" />
          </svg>
        }
      >
        <DriveGround cam={cam} look={look} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <City L={L} frame={frame} />
          <Clip id="farmclip" y={farmClip}>
            <Farm L={L} H0={H0} frame={frame} uid="fm" />
          </Clip>
          <Dust L={L} frame={frame} />
          <Guard L={L} H0={H0} frame={frame} uid="gd" carDepth={carDepth} carFront={<Car L={L} frame={frame} uid="car" />} />
        </svg>
      </AirStage>
    </AbsoluteFill>
  );
};

export default DriveOutOfAustin;
