// ---------------------------------------------------------------------------
// TryUsStayForTech (scott-free-wifi, cut 13). Cheeky Pint "at sea" look carried into the air: the clip's own cruise
// sky (wifiSky CruiseStage, read-only: aircraftShared's AirStage with the cumulus deck far below; espresso dusk above,
// golden haze toward a LOW horizon, sun upper left, grain, vignette, grade). The cabin is a 2D card cutaway on its own
// layered pinhole camera (cabinParts: hull, cabin, bins, far wall) in the stage's overlay.
// Opaque 1080x1920, 23.976 fps, 100 frames. RENDER WITH --gl=angle (the stage is WebGL).
//
// CHECK LINE: a viewer with the sound off can say "the Starlink Wi-Fi gets people onto a United plane, but it's the
// screens and tech at every seat that keep them there."
//
// THE LINE: "because of Starlink. They're going to try us for Starlink, and they're going to stay with all the other
// technology"
// WORD -> FRAME: because f2 · of f8 · Starlink f14 · they're f22 · going f26 · to f28 · try f30 · us f35 · for f39 ·
// Starlink f42 · and f50 · they're f55 · going f58 · to f59 · stay f62 · with f66 · all f69 · the f76 · other f79 ·
// technology f82 · (the f92, next line) (notes/word_frames.txt; "not" is 5 frames before f0).
// DURATION: the slot 13.722 -> 17.893 s = sequence frames 329 -> 429 = 100 frames (f0..f99).
//
// THE MOTION: one continuous glide through a cutaway United jet in flight, nose left, its near wall cut open from the
// crown to the floor. f0: close on the crown, the Starlink radome against the dusk with the link landing on it (the
// clip's link look: a soft cream cone, narrow above and radome-wide where it lands, a bright thin core, small cream
// data packets travelling down it, a soft cream pool on the crown); the intact skin with windows and a door to the
// left, the cutaway's edge to the right, no passengers yet; the camera already craning down and aft (the sky's
// horizon rides down with the crane, then rests at y ~1720: under the belly only golden haze and a far fogged deck).
// The signal enters the radome and runs aft inside the crown's cut face as a cream thread (from f12, one constant
// speed, small packets flowing along it the whole cut, so Starlink stays in the top band); where its head passes a
// row, a thin cream drop runs down to that passenger's phone or laptop, which lights on contact and throws a soft cream
// pool over the face and hands (rows 0-3 at f24 / f29 / f40 / f48: "try us for Starlink"). "And they're going to stay": from the bulkhead an amber thread runs
// aft along the floor (United's own system, one constant speed) and climbs each seat's shell to the screen on its back,
// which wakes amber with United's globe on contact (row r at f51.5 + 5r); two frames later its passenger settles
// (puts the phone down or shuts the laptop, leans back, smiles, headphones on with the far hand) and the cream device
// light drains (a laptop's screen dims within 7 frames of the amber, before its lid shuts). The cabin is lit: cream
// bins and ceiling, a warm board wall, golden pools from the windows over seats and faces (never over the screens),
// mid-board seats, deep brown only in the footwell. The camera tracks aft with the wave and pushes in (k 1.25: heads
// ~150 px at y ~770, the floor at ~1350) to a settled living frame: two rows of relaxed passengers in the amber glow,
// the camera still creeping, the golden light drifting across the far windows.
// CONTACT / REACTION: drop tip reaches device = device starts lighting (cream(r)); amber thread reaches the screen =
// screen starts waking (A(r)); first passenger reaction A(r) + 2 (cabinPlan.poseAt).
// AMBER = UNITED'S OWN TECHNOLOGY (the seatback screens and the thread that wakes them); cream light = Starlink.
//
// SOURCES: United's globe = airlineMarks.ts (Simple Icons united.svg, CC0; the tail crop, as on the clip's fins).
// Starlink's aircraft terminal is a low flat radome on the crown (COMMON.md Facts). No numbers, no text.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  airCamAt,
  airTrack,
  type AirGlide,
  type SideCam,
} from "../scott-aircraft-order/aircraftShared";
import { CRUISE, CruiseStage } from "./wifiSky";
import { Passenger } from "./cabinCast";
import {
  Armrest,
  Bins,
  Bulkhead,
  CABIN,
  CrownStrand,
  DropBeam,
  FarWall,
  Hull,
  LAYER,
  LinkBeam,
  Radome,
  SEAT,
  ScreenTile,
  screenTilePath,
  WindowLight,
  SeatBody,
  layerScale,
  layerTf,
  openingPath,
  reLayer,
  type LayerCam,
} from "./cabinParts";
import { CAST, PITCH, poseAt } from "./cabinPlan";

export const FPS = 24000 / 1001;
export const DURATION = 100;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => {
  const c = c01(t);
  return c * c * (3 - 2 * c);
};

// ---------------------------------------------------------------------------
// ROWS
// ---------------------------------------------------------------------------
export const ROWS = CAST.length;
/** the seat back of row r (its front edge at floor level); row 0's "seat ahead" is the bulkhead at CABIN.XB */
export const XS = (r: number) => r * PITCH;
const HIP = (r: number): [number, number] => [XS(r) + SEAT.hip[0], SEAT.hip[1]];

// ---------------------------------------------------------------------------
// THE CREAM SIGNAL — into the radome, aft along the crown's cut face at one speed; a drop runs to each device
// ---------------------------------------------------------------------------
export const STRAND = { f0: 12, v: 54, x0: CABIN.XR + 20, drop: 4 } as const;
export const strandHead = (f: number) =>
  STRAND.x0 + STRAND.v * Math.max(0, f - STRAND.f0);
/** where row r's device is (world), in its resting "trying" pose */
const deviceAt = (r: number): [number, number] => {
  const p = poseAt(r, 0, 1e6, 1e6);
  const [hx, hy] = HIP(r);
  if (p.laptop) {
    const th = (p.laptop.lid * Math.PI) / 180;
    const L = p.laptop.len * 0.86;
    return [
      hx + p.laptop.hinge[0] + Math.cos(th) * L * 0.55 + 6,
      hy + p.laptop.hinge[1] - 8 - Math.sin(th) * L,
    ];
  }
  const at = p.phone?.at ?? p.hand;
  return [hx + at[0] + 4, hy + at[1] - 40];
};
const DEVICE = CAST.map((_, r) => deviceAt(r));
/** the frame the drop starts (the strand's head passes the device's x) and the frame the device lights */
export const DROP_F = DEVICE.map(
  ([x]) => STRAND.f0 + (x - STRAND.x0) / STRAND.v,
);
export const CREAM_F = DROP_F.map((f) => f + STRAND.drop);

// ---------------------------------------------------------------------------
// THE AMBER WAVE — from the bulkhead aft along the floor at one speed, up each seat's shell to its screen
// ---------------------------------------------------------------------------
export const WAVE = { f0: 48, v: 86, x0: CABIN.XB + 40, rise: 3 } as const;
export const waveHead = (f: number) =>
  WAVE.x0 + WAVE.v * Math.max(0, f - WAVE.f0);
/** the shell x (world) of the seat carrying row r's screen (row 0: the bulkhead) */
const shellX = (r: number) =>
  (r === 0 ? CABIN.XB : XS(r - 1)) + SEAT.rearX(-150);
export const AMBER_F = CAST.map(
  (_, r) => WAVE.f0 + (shellX(r) - WAVE.x0) / WAVE.v + WAVE.rise,
);

// ---------------------------------------------------------------------------
// CAMERA — the cabin layer's centre and zoom on the house damped follower (aircraftShared airTrack: x, y, f=k in log)
// ---------------------------------------------------------------------------
const PRE = 24;
const START: SideCam = { mode: "side", x: -650, y: -860, z: 0, f: 1.3 };
const GLIDES: AirGlide[] = [
  { f0: -6, f1: 40, to: { x: 290, f: 1.1 }, warp: 1.35 },
  // the crane down runs ahead of the pan: the first rows' faces are above the caption bands before their devices light
  { f0: -2, f1: 26, to: { y: -352 }, warp: 1.15 },
  { f0: 34, f1: 102, to: { x: 1822, y: -314, f: 1.25 } },
];
const TRACK = airTrack(
  START,
  GLIDES.map((g) => ({ ...g, f0: g.f0 + PRE, f1: g.f1 + PRE })),
  DURATION + PRE,
);
export const camAt = (f: number): LayerCam => {
  const c = airCamAt(TRACK, f + PRE) as SideCam;
  return { x: c.x, y: c.y, k: c.f };
};
/** the sky: the clip's cruise sky (wifiSky CruiseStage: AirStage side mode + the cumulus deck far below, drifting
 *  aft in the jet-fixed frame). The horizon sits LOW (y ~1720 in the rows): under the belly the air glows golden and
 *  the deck, kilometres below, is only a far fogged band at the bottom edge (seen close it read as sand) */
const SKY_CAM: SideCam = { mode: "side", x: 0, y: CRUISE - 7, z: 0, f: 1500, horizon: 1720 };
/** the crane down tilts the view a little: at the crown the horizon sits low (the radome against the deeper dusk),
 *  then rises to its rest as the camera comes down into the rows (derived from the cabin camera's height) */
const skyCamAt = (S: number): SideCam => ({ ...SKY_CAM, horizon: 1720 + Math.max(0, -camAt(S).y - 314) * 0.5 });

// ---------------------------------------------------------------------------
// THE CABIN (screen px overlay; pure: AirStage mounts it twice)
// ---------------------------------------------------------------------------
const Cabin: React.FC<{ S: number }> = ({ S }) => {
  const clipId = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const cam = camAt(S);
  const sMid = layerScale(cam.k, LAYER.mid);
  const sHull = layerScale(cam.k, LAYER.hull);
  const sFar = layerScale(cam.k, LAYER.far);
  const view = (s: number) => [cam.x - 560 / s, cam.x + 560 / s] as const;
  const [mx0, mx1] = view(sMid);
  const [fx0, fx1] = view(sFar);
  const visibleRows = CAST.map((_, r) => r).filter(
    (r) => XS(r) + 300 > mx0 - 200 && XS(r) - 600 < mx1 + 200,
  );
  const head = strandHead(S);
  const wave = waveHead(S);
  // the ceiling, as the drops see it: the hull's crown cut face, re-layered onto the cabin layer
  const dropTop = reLayer(
    cam,
    [cam.x, (CABIN.skinB + CABIN.crownB) / 2],
    LAYER.hull,
    LAYER.mid,
  )[1];
  const linkTop = cam.y - 960 / sHull - 80;
  const poses = CAST.map((_, r) => poseAt(r, S, CREAM_F[r], AMBER_F[r]));
  const screenOn = CAST.map((_, r) => smooth((S - AMBER_F[r]) / 6));
  // the amber floor thread and the risers it has reached
  const floorY = -4;
  const risers = CAST.map((_, r) => {
    const x = shellX(r);
    const t = c01((S - (AMBER_F[r] - WAVE.rise)) / WAVE.rise);
    return { x, t, base: r === 0 ? CABIN.XB : XS(r - 1) };
  });
  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <defs>
        <clipPath id={`cabinOpen${clipId}`}>
          <path d={openingPath(14)} transform={layerTf(cam, LAYER.hull)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#cabinOpen${clipId})`}>
        {/* far wall + galley */}
        <g transform={layerTf(cam, LAYER.far)}>
          <FarWall S={S} x0={fx0} x1={fx1} />
        </g>
        {/* overhead bins */}
        <g transform={layerTf(cam, LAYER.bins)}>
          <Bins
            x0={view(layerScale(cam.k, LAYER.bins))[0]}
            x1={view(layerScale(cam.k, LAYER.bins))[1]}
          />
        </g>
        {/* the cabin: floor, bulkhead, seats, screens, the two threads, passengers */}
        <g transform={layerTf(cam, LAYER.mid)}>
          <rect
            x={mx0 - 200}
            y={-2}
            width={mx1 - mx0 + 400}
            height={200}
            fill="#4E3628"
          />
          <rect
            x={mx0 - 200}
            y={-2}
            width={mx1 - mx0 + 400}
            height={4}
            fill="#6E5241"
          />
          <Bulkhead />
          {visibleRows.map((r) => (
            <SeatBody key={`s${r}`} x={XS(r)} />
          ))}
          {/* the amber thread along the floor and up each reached seat's shell */}
          {wave > WAVE.x0 ? (
            <g
              style={{
                filter:
                  "drop-shadow(0 0 4px rgba(255,170,30,0.5)) drop-shadow(0 0 14px rgba(255,150,0,0.25))",
              }}
            >
              <path
                d={`M${WAVE.x0} ${floorY}L${Math.min(wave, mx1 + 300)} ${floorY}`}
                stroke="#FFB000"
                strokeWidth={4}
                strokeLinecap="round"
              />
              {risers.map((q, r) => {
                if (q.t <= 0) return null;
                const yTop = SEAT.screen.y0;
                const xTop = q.base + SEAT.rearX(yTop) + 2;
                const xBot = q.x;
                const yMid = -150;
                // floor -> under the shell (vertical), then up the shell's edge to the screen
                const L1 = yMid - floorY;
                const L2 = Math.hypot(xTop - xBot, yTop - yMid);
                const run = q.t * (Math.abs(L1) + L2);
                const p1 = Math.min(run, Math.abs(L1));
                const p2 = Math.max(0, run - Math.abs(L1)) / L2;
                const d =
                  `M${xBot} ${floorY}L${xBot} ${floorY - p1}` +
                  (p2 > 0
                    ? `L${xBot + (xTop - xBot) * p2} ${yMid + (yTop - yMid) * p2}`
                    : "");
                const settle = 1 - 0.6 * smooth((S - AMBER_F[r] - 2) / 12);
                return (
                  <path
                    key={r}
                    d={d}
                    stroke="#FFB000"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity={settle}
                  />
                );
              })}
            </g>
          ) : null}
          {/* the screens: row 0's on the bulkhead, row r's on seat r-1 */}
          {visibleRows.map((r) => (
            <ScreenTile
              key={`t${r}`}
              x={r === 0 ? CABIN.XB : XS(r - 1)}
              on={screenOn[r]}
              k={sMid}
            />
          ))}
          {/* the cream drops */}
          {visibleRows.map((r) => {
            const p = poses[r];
            const tip = (S - DROP_F[r]) / STRAND.drop;
            const keep = p.keep ?? 1;
            const a = keep * (tip < 1 ? 1 : 0.55 + 0.45 * (1 - smooth((S - CREAM_F[r]) / 6)));
            return (
              <DropBeam
                key={`d${r}`}
                x={DEVICE[r][0]}
                top={dropTop}
                bottom={DEVICE[r][1]}
                tip={tip}
                a={a}
              />
            );
          })}
          {visibleRows.map((r) => {
            const [hx, hy] = HIP(r);
            return (
              <Passenger
                key={`p${r}`}
                x={hx}
                y={hy}
                spec={CAST[r]}
                pose={poses[r]}
                between={<Armrest x={XS(r)} />}
              />
            );
          })}
        </g>
        {/* golden light through the far windows, over the seats and the faces (not over the screens: the amber
            stays the brightest, purest thing in the cabin) */}
        <mask id={`cabinLit${clipId}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
          <rect x={0} y={0} width={1080} height={1920} fill="#FFFFFF" />
          <g transform={layerTf(cam, LAYER.mid)}>
            {visibleRows.map((r) => (
              <path key={r} d={screenTilePath(r === 0 ? CABIN.XB : XS(r - 1), 6)} fill="#000000" />
            ))}
          </g>
        </mask>
        <g mask={`url(#cabinLit${clipId})`}>
          <g transform={layerTf(cam, LAYER.far)}>
            <WindowLight S={S} x0={fx0} x1={fx1} />
          </g>
        </g>
      </g>
      {/* the hull, the radome, the link, the signal in the crown */}
      <g transform={layerTf(cam, LAYER.hull)}>
        <Hull />
        <CrownStrand head={head} S={S} />
        <LinkBeam S={S} top={linkTop} />
        <Radome glow={0.45} />
      </g>
    </svg>
  );
};

const TryUsStayForTech: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  return (
    <CruiseStage cam={skyCamAt(S)} S={S} rest={SKY_CAM} overlay={<Cabin S={S} />} />
  );
};

export default TryUsStayForTech;
