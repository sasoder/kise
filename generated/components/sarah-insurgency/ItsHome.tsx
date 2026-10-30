// ---------------------------------------------------------------------------
// ItsHome (sarah-insurgency, cut 91). The clip's one-off "Dwarkesh 3D map" look (COMMON.md): the insurgency-atlantic
// vintage map laid as the floor in the misty 3D air (the clip kit ./insurgencyShared, its header is the API).
// Opaque 1080x1920, 24 fps, 83 frames. RENDER WITH --gl=angle (the ground is WebGL2).
//
// CHECK LINE: "for people who live where the war is fought, it is their own home at stake, and that stake towers over
// everything."
//
// THE LINE: "If you live in theater, it's home. It's existential."
// WORD -> FRAME (f0 = 91.250 s): If -1 · you 2 · LIVE 4 · in 11 · THEATER 14 · it's 27 · HOME 37 · it's 47 ·
//   EXISTENTIAL 56 (speaker after, "Value of the object tends to be very high", from f79)
// DURATION: the slot 91.250 -> 94.708 s = 3.458 s x 24 = 83 frames (f0..f82).
//
// THE MOTION: one continuous camera. f0-40 low and oblique on a small colonial farmhouse (the kit's Farmhouse, a
// wargame model) standing on the old map in the Hudson valley, ploughed field parcels and the Hudson round it, the
// camera looking east toward the Atlantic (a haze band near the horizon); a gentle push in (house ~26 % -> ~34 % of
// the frame's width). f27-37 "it's HOME": its window warms (the hearth: orange only there) and from f31 a thin
// chimney smoke drifts off to the right (the cause: the lit hearth), born in the chimney's mouth. f43-70 "it's
// EXISTENTIAL": an orange classical column RISES out of the map right behind the house, to its left: the map tears
// open at f44 (CAUSE; the tear 1.12 x the square abacus' half-diagonal), the square abacus breaks the surface on f45
// (FIRST REACTION), the fluted column comes up (its top over the ridge by ~f48, most of its height by f56
// "existential"), fully up ~f63, the tear widens for the stepped square plinth and closes round it by f70
// (RisingColumn in ./itsHomeWorld: the kit's ValueColumn, restyled classical in the kit for this cut and cut 96, has
// no rise of its own, so the Pawn's tear pattern, riseState, is carried to it there; at rise 1 it is the plain kit
// ValueColumn, its square parts facing COLUMN_FACE = the house's face). The camera pulls back and tilts up with it
// (f38-68, one lobe, peak ~f53), so its top stays high in the frame (highest y ~60 at f58) and it ends towering ~4x
// over the house (top y ~195 at f82). f70-82 settled and living: the house at the column's foot, smoke, motes,
// a slow creep; the ocean haze ahead. No text.
// THE GROUND near the lens: field geometry is clipped at a near eye depth (itsHomeWorld nearZ) - huge projected
// paths break the stage's multiply blend (a beige veil); see WORLD_READY Changes.
// Orange = home (the window's hearth glow and the value column); cream only as the map's inks. No people.
//
// END STATE for cut 96 FurtherAwayLower: ./itsHomeState (HOUSE, COLUMN, KEYS / camAt, END_KEY / END_CAM at f82).
// CAPTION BANDS: the house foot stays above y 1080 on every frame (~y 970 -> ~1050), the column's foot above it;
// only the open map lies in the bands.
//
// SOURCES: the farm is placed on the west bank of the Hudson near Kingston / Hurley, NY (41.93 N, 74.02 W), projected
// on the insurgency-atlantic map (insAtlanticMapData.project); the Hudson is the map's hand-traced course
// (RIVER_HUDSON, APPROXIMATE). The camera's yaw 79 is the map's straight line from the farm to London. The field
// parcels are illustrative (an estate-map texture, no data). No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { Farmhouse, HorizonHaze, InsurgencyStage, MapGround3D, WorldLayer, insWorld, sortFarToNear, type InsWorld, type P2 } from "./insurgencyShared";
import { COLUMN, COLUMN_FACE, HEARTH, HOUSE, HUDSON, RISE, YAW, camAt, offsetFrom } from "./itsHomeState";
import { ChimneySmoke, FarmFields, RisingColumn, River, chimneyTop, type Field } from "./itsHomeWorld";

export const FPS = 24;
export const DURATION = 83;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const REST = camAt(0);
const H: P2 = [HOUSE.x, HOUSE.z];
/** a parcel from (ahead, right) offsets round the house */
const parcel = (q: [number, number][], furrow: number): Field => ({ q: q.map(([f, r]) => offsetFrom(H, f, r)) as Field["q"], furrow });
/** the ploughed parcels round the farm (illustrative), furrows parallel to each parcel's first edge */
const FIELDS: Field[] = [
  parcel(
    [
      [-5, -17],
      [-35, -15],
      [-35, -48],
      [-5, -46],
    ],
    1.8,
  ),
  parcel(
    [
      [-7, 17],
      [-31, 15],
      [-33, 36],
      [-8, 38],
    ],
    2.0,
  ),
  parcel(
    [
      [7, -52],
      [33, -50],
      [34, -12],
      [8, -14],
    ],
    1.9,
  ),
  parcel(
    [
      [-40, -50],
      [-40, -20],
      [-68, -18],
      [-70, -52],
    ],
    2.1,
  ),
  parcel(
    [
      [-38, 10],
      [-38, 34],
      [-62, 37],
      [-63, 9],
    ],
    1.9,
  ),
  // the near foreground (the settled wide's lower frame: a little soft foreground, not a flat empty floor)
  parcel(
    [
      [-74, -58],
      [-104, -56],
      [-106, -14],
      [-75, -16],
    ],
    2.2,
  ),
  parcel(
    [
      [-72, -6],
      [-72, 30],
      [-108, 33],
      [-110, -4],
    ],
    2.4,
  ),
  parcel(
    [
      [-116, -40],
      [-116, 6],
      [-160, 8],
      [-162, -43],
    ],
    2.6,
  ),
  parcel(
    [
      [-118, 16],
      [-160, 18],
      [-163, 52],
      [-120, 50],
    ],
    2.3,
  ),
];
const CHIMNEY = chimneyTop(HOUSE.x, HOUSE.z, HOUSE.size, HOUSE.face);

type Item = { at: P2; el: (A: InsWorld) => React.ReactNode };

const ItsHome: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const A = insWorld({ cam, rest: REST, frame });
  const warm = interpolate(frame, [HEARTH.f0, HEARTH.f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const rise = interpolate(frame, [RISE.f0, RISE.f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const items: Item[] = [
    { at: H, el: (A) => <Farmhouse A={A} x={HOUSE.x} z={HOUSE.z} size={HOUSE.size} face={HOUSE.face} warm={warm} uid="farm" /> },
    { at: [COLUMN.x, COLUMN.z], el: (A) => <RisingColumn A={A} x={COLUMN.x} z={COLUMN.z} r={COLUMN.r} height={COLUMN.height} rise={rise} uid="vc" face={COLUMN_FACE} /> },
  ];
  return (
    <InsurgencyStage A={A}>
      <MapGround3D world="atlantic" cam={cam} air={A.ground} fog={A.fog} />
      <HorizonHaze A={A} id="hz91" />
      <WorldLayer>
        <FarmFields A={A} fields={FIELDS} />
        <River A={A} pts={HUDSON} w={5} />
        {sortFarToNear(A, items, (it) => it.at).map((it, i) => (
          <React.Fragment key={i}>{it.el(A)}</React.Fragment>
        ))}
        <ChimneySmoke A={A} frame={frame} at={CHIMNEY} start={HEARTH.smoke0} windYaw={YAW + 100} scale={HOUSE.size * 0.09} uid="smoke" />
      </WorldLayer>
    </InsurgencyStage>
  );
};

export default ItsHome;
