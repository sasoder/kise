// PORTRAIT ADAPTATION: 1080x1920; original 101-frame source retained for the current 38-frame trim.
// Nine ships in a vertical depth field over Fuji and the running train; same photos and timing.
// ---------------------------------------------------------------------------
// NewNormalFleetPortrait (mikkel-trailer, cut 02). Core Memory podcast style, the ARCHIVE COLLAGE at 16:9 (the Pushp / Airbound
// trailer look, on ./mikkelShared over ../neal-stephenson-trailer/nealShared; the same family as cut 12,
// EighteenHundredCloser). Opaque 2048x1080, 23.976 fps, 101 frames; finals --scale 2 (4096x2160).
//
// CHECK LINE: with the sound off, the viewer sees a sky full of Sceye airships going about their day over an ordinary
// horizon, as unremarkable as traffic: an establishing shot of a world where these are normal.
//
// THE LINE: "(I want to make this) as normal as seeing cars in the street or ships in the port or trains in the tracks."
// WORD -> FRAME (Whisper onsets + ~4 f): as 3 · normal 8 · as 17 · seeing 23 · cars 30 · in 44 · the 49 · street 51 ·
//   or 58 · ships 60 · in 65 · the 69 · port 70 · or 75 · trains 77 · in 83 · the 86 · tracks 88 · speech ends ~95.
// DURATION: the slot 1.960 -> 6.173 s = 4.213 s x 23.976 = 101 frames (f0..f100). Hard cut in and out.
//
// THE MOTION (rev 2): one living establishing shot, no beats. The squared paper is the sky; along the bottom an ordinary
// horizon in prints cut from one photo, each on its hard shadow: Mt Fuji (far, d 2.4) and, in front of it (d 1.7), the
// Shinkansen running left through its own band at train speed (about 26 % of the frame width over the slot; the nose
// starts in frame at x 120 and slides out left, the long strip repeats car 3 so no tail ever shows) over a still viaduct.
// Eleven Sceye airships from six real photos (side-on from below, three-quarter from below, true profile, straight from
// below, nose-up, backlit), mirrored and scaled, on a depth ladder like traffic thinning into the distance: two big crisp
// near ones (the hero, 27 % of the frame wide, crossing the top right to centre leftward, 20 % of the frame width over
// the slot; a second low left heading right, 16 %), three in the middle (10-11 %, one climbing nose-up) and six small far
// ones (4-5 %), high up and low over the horizon (one slipping out from behind the mountain's right flank), faded toward
// the paper tone by aerial haze. Each is under way at f0 on its own heading at its own constant speed (both directions),
// with a slow bob of a pixel or two. The camera is one constant drift over the whole slot (pan right 1.6 px/f, crane up
// 0.4 px/f, push 0.03 %/f), so the planes slide past each other: paper 0.15, mountain, train, airships by depth. Nothing
// sits on the snow summit. Spacing and caption bands checked per frame by scripts/clips/mikkel-trailer/check-fleet.ts.
// CHAIN = Sceye's advantage (mikkelShared legend). Not used here: nothing in this line is an advantage, it is the
// ordinary world.
//
// SOURCES (photos only, no figures): airships: cut 12's sceye_airship.png (IEEE Spectrum lead photo, SoftBank);
// fleet_threequarter (Sceye, "Sceye-August-Flight"), fleet_profile (Sceye, "HAPS-over-rural-country"), fleet_glow
// (StratoCat, flight of 2026-08-09), fleet_below (Sceye press, "Sceye-HAPS-4"), fleet_noseup (Sceye press, "Sceye-HAPS"),
// keyed by scripts/clips/mikkel-trailer/bake-fleet.py. Horizon: "Series N700A and Mt. Fuji", MaedaAkihiko, Wikimedia
// Commons, CC BY-SA 4.0 (the clip's still 05.2b), cut by scripts/clips/mikkel-trailer/bake-horizon.py.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CutOut, SHADOW, Silhouette, clamp } from "../neal-stephenson-trailer/nealShared";
import { CaptionBands, H, MIKKEL_FILTER, type MikkelCam, MikkelFilmLife, MikkelPaper, MikkelPlane, W } from "./mikkelPortraitShared";

export const FPS = 24000 / 1001;
export const DURATION = 101;
export const schema = z.object({ bands: z.boolean().default(false) });
export const defaultProps = schema.parse({});

// -- tracks: coarse keys, linearly interpolated, box-smoothed per frame at module load (deterministic) ----------------
const PRE = 40;
const POST = 40;
const track = (keys: [number, number][], win: number) => {
  const F = keys.map((k) => k[0]);
  const V = keys.map((k) => k[1]);
  const raw: number[] = [];
  for (let f = -PRE - win; f <= DURATION + POST + win; f++) raw.push(interpolate(f, F, V, clamp));
  const out: number[] = [];
  for (let f = -PRE; f <= DURATION + POST; f++) {
    let s = 0;
    for (let i = -win; i <= win; i++) s += raw[f + PRE + win + i];
    out.push(s / (2 * win + 1));
  }
  return (f: number) => {
    const c = Math.max(-PRE, Math.min(DURATION + POST, f)) + PRE;
    const a = Math.floor(c);
    const b = Math.min(a + 1, out.length - 1);
    return out[a] + (out[b] - out[a]) * (c - a);
  };
};

// -- the camera: one constant drift, already moving at f0 (keys run past both ends) -------------------------------------
const PAN = 0.7; // px per frame at the focus plane, rightward
const CRANE = 0.3; // px per frame, up
const PUSH = 0.0003; // k per frame
const CAM_X = track(
  [
    [-PRE, W / 2 - PAN * PRE],
    [DURATION + POST, W / 2 + PAN * (DURATION + POST)],
  ],
  1,
);
const CAM_Y = track(
  [
    [-PRE, H / 2 + CRANE * PRE],
    [DURATION + POST, H / 2 - CRANE * (DURATION + POST)],
  ],
  1,
);
const CAM_K = track(
  [
    [-PRE, 1 - PUSH * PRE],
    [DURATION + POST, 1 + PUSH * (DURATION + POST)],
  ],
  1,
);
/** World px on every plane equal screen px at f0 (the rest camera is the f0 camera). */
export const camAt = (f: number): MikkelCam => ({ x: CAM_X(f), y: CAM_Y(f), k: CAM_K(f), x0: CAM_X(0), y0: CAM_Y(0) });

// -- the horizon prints (bake-horizon.py) ---------------------------------------------------------------------------------
/** The mountain: cut along its skyline, its ends scissor-cut down to its straight bottom (hidden behind the train). */
const FUJI = { src: "mikkel-trailer/horizon_fuji.png", w: 3691, h: 770, peakX: 1648 - 94, d: 2.4, s: 0.6 };
/**
 * The Shinkansen line, levelled (bake-horizon.py): the train strip (roof and nose down to its foot behind the railing;
 * nose at strip x 227, the photo's car 3 repeated twice past the photo's edge, so no tail ever shows) slides left
 * behind the static viaduct print (railing, embankment, field). Both on one plane, same scale; tops in levelled src y.
 */
const LINE = { d: 1.7, s: 0.62 };
const TRAIN = { src: "mikkel-trailer/horizon_train_strip.png", w: 5996, h: 162, top: 1741, noseX: 227 };
const VIADUCT = { src: "mikkel-trailer/horizon_viaduct.png", w: 3840, h: 470, top: 1890 };
const ROOF = 1743.3; // the levelled roof line, src y
const FUJI_PEAK_X = 550; // screen x of the summit at f0
const FUJI_BOTTOM_Y = 1610; // screen y of the mountain print's straight bottom at f0 (below the train roof all through)
const ROOF_Y = 1550; // screen y of the train's roof at f0
const NOSE_X0 = 160; // screen x of the nose tip at f0 (left of the mountain print's end, so its bottom never shows)
/** Plane px per frame, leftward (the way the nose points). With the pan the train crosses ~26 % of the frame. */
export const TRAIN_V = 3.4;
const VIADUCT_LEFT = -150; // screen x of the viaduct print's left edge at f0 (it covers the frame all through)
const PRINT_SHADOW = 5;

const Print: React.FC<{ src: string; x: number; y: number; w: number; h: number; filter?: string }> = ({ src, x, y, w, h, filter = MIKKEL_FILTER }) => (
  <>
    <Silhouette src={src} aspect={w / h} x={x} y={y} w={w} anchor="top-left" colour={SHADOW} dx={PRINT_SHADOW} dy={PRINT_SHADOW} />
    <CutOut src={src} aspect={w / h} x={x} y={y} w={w} anchor="top-left" filter={filter} />
  </>
);

// -- the fleet ----------------------------------------------------------------------------------------------------------------
type Piece = {
  src: string;
  w: number;
  h: number;
  /** where the nose points in the PNG, degrees clockwise on screen (0 = right, 180 = left, -90 = up) */
  axis: number;
  /** an exposure lift before the clip grade (the dusk photo), so every hull reads as the same bright chrome family */
  lift?: string;
};
export const PIECES = {
  side: { src: "mikkel-trailer/sceye_airship.png", w: 2016, h: 795, axis: 180 }, // cut 12's: side-on from below, nose left
  threeq: { src: "mikkel-trailer/fleet_threequarter.png", w: 961, h: 400, axis: 194 }, // three-quarter from below, nose up-left
  profile: { src: "mikkel-trailer/fleet_profile.png", w: 631, h: 292, axis: -6 }, // true profile, nose right
  glow: { src: "mikkel-trailer/fleet_glow.png", w: 548, h: 341, axis: 149 }, // backlit, diagonal, nose down-left
  below: { src: "mikkel-trailer/fleet_below.png", w: 596, h: 1218, axis: -90, lift: "brightness(1.75)" }, // straight from below at dusk, nose up
  noseup: { src: "mikkel-trailer/fleet_noseup.png", w: 580, h: 2048, axis: -90 }, // nose-up hover
} satisfies Record<string, Piece>;
type PieceName = keyof typeof PIECES;

/**
 * One airship on its depth plane. (x, y) = its centre at f0 in plane px (= screen px at f0); `len` = the PNG's width in
 * plane px; `rot` turns the photo (kept small for the perspective views, so the light stays as shot); `flip` mirrors it.
 * It travels the way its nose points, flattened toward level (a perspective tilt is a pose, not a climb), except a
 * `climb`er, which rises along its nose. `speed` plane px per frame, constant; a slow bob of a pixel or two.
 */
export type Ship = { piece: PieceName; d: number; x: number; y: number; len: number; rot?: number; speed: number; flip?: boolean; climb?: boolean; haze?: number; phase: number };

// A depth ladder, traffic thinning into the distance. Screen px at f0; `speed` in plane px per frame. On screen (with the
// pan, PAN / d): near ~3.4-4.2 px/f (17-21 % of the frame over the cut), middle ~2 px/f (8-12 %), far ~1 px/f (>= 4 %),
// both directions. Near ones clear of the caption bands (607-703, 765-821); nothing parks on the summit (1100, 438).
// Far ones (d > 2.4 sits behind the mountain) carry aerial `haze` toward the paper tone.
export const FLEET: Ship[] = [
 {piece:"profile",d:3.2,x:940,y:1340,len:100,speed:.7,haze:.4,phase:.3},
 {piece:"glow",d:3.4,x:840,y:180,len:95,rot:37,speed:.4,haze:.45,phase:1.1},
 {piece:"side",d:3,x:140,y:660,len:110,speed:.6,flip:true,haze:.4,phase:2},
 {piece:"threeq",d:2.8,x:430,y:1180,len:100,speed:.7,flip:true,haze:.35,phase:4.6},
 {piece:"threeq",d:1.2,x:350,y:270,len:250,speed:.7,phase:.8},
 {piece:"noseup",d:1.4,x:950,y:820,len:75,rot:6,speed:1.3,climb:true,phase:2.4},
 {piece:"profile",d:1.3,x:690,y:980,len:245,speed:1.2,phase:4.1},
 {piece:"side",d:.65,x:740,y:550,len:650,speed:1.1,phase:5},
 {piece:"threeq",d:.8,x:250,y:910,len:430,speed:1.7,flip:true,phase:5.8},
];

/** The paper's tone on screen (sampled from a render), for the far ones' aerial haze. */
const PAPER_TONE = "#BDBBBE";

const shipOffset = (d: number) => (d < 1 ? 7 : d < 2 ? 5 : 3);

const shipFilter = (p: Piece, haze: number) => [p.lift, MIKKEL_FILTER, haze > 0 ? `contrast(${1 - 0.4 * haze})` : null].filter(Boolean).join(" ");

/** Where the nose points on screen, degrees. */
const noseOf = (s: Ship) => {
  const a = PIECES[s.piece].axis;
  return (s.flip ? 180 - a : a) + (s.rot ?? 0);
};

export const shipAt = (s: Ship, f: number) => {
  const n = (noseOf(s) * Math.PI) / 180;
  const travel = s.climb ? n : Math.atan2(0.4 * Math.sin(n), Math.cos(n));
  const bob = 1.6 * Math.sin(f * 0.085 + s.phase);
  const pitch = 0.5 * Math.sin(f * 0.06 + s.phase * 1.7);
  return { x: s.x + Math.cos(travel) * s.speed * f, y: s.y + Math.sin(travel) * s.speed * f + bob, rot: (s.rot ?? 0) + pitch };
};

const ShipView: React.FC<{ s: Ship; frame: number }> = ({ s, frame }) => {
  const p = PIECES[s.piece];
  const { x, y, rot } = shipAt(s, frame);
  const w = s.len;
  const h = (w * p.h) / p.w;
  const off = shipOffset(s.d);
  const at = { src: p.src, aspect: p.w / p.h, x: 0, y: 0, w, anchor: "top-left" as const };
  const wrap = (dx: number, dy: number, node: React.ReactNode) => (
    <div style={{ position: "absolute", left: x - w / 2 + dx, top: y - h / 2 + dy, width: w, height: h, transform: `rotate(${rot}deg)${s.flip ? " scaleX(-1)" : ""}`, transformOrigin: "50% 50%" }}>{node}</div>
  );
  return (
    <>
      {wrap(off, off, <Silhouette {...at} colour={SHADOW} />)}
      {wrap(0, 0, <CutOut {...at} filter={shipFilter(p, s.haze ?? 0)} />)}
      {s.haze ? wrap(0, 0, <div style={{ position: "absolute", inset: 0, opacity: s.haze }}><Silhouette {...at} colour={PAPER_TONE} /></div>) : null}
    </>
  );
};

/** Ships on their own planes, back to front. */
const Ships: React.FC<{ frame: number; cam: MikkelCam; dMin: number; dMax: number }> = ({ frame, cam, dMin, dMax }) => (
  <>
    {FLEET.filter((s) => s.d >= dMin && s.d < dMax)
      .sort((a, b) => b.d - a.d)
      .map((s, i) => (
        <MikkelPlane key={`${s.piece}-${i}-${s.d}`} cam={cam} d={s.d}>
          <ShipView s={s} frame={frame} />
        </MikkelPlane>
      ))}
  </>
);

// -- the cut ------------------------------------------------------------------------------------------------------------------
const NewNormalFleetPortrait: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const fw = FUJI.w * FUJI.s;
  const fh = FUJI.h * FUJI.s;
  const ls = LINE.s;
  const trainLeft = NOSE_X0 - TRAIN.noseX * ls - TRAIN_V * frame;
  const trainTop = ROOF_Y - (ROOF - TRAIN.top) * ls;
  return (
    <AbsoluteFill>
      <MikkelFilmLife frame={frame} seed="m02">
        <MikkelPaper frame={frame} cam={cam} />
        <Ships frame={frame} cam={cam} dMin={FUJI.d} dMax={99} />
        <MikkelPlane cam={cam} d={FUJI.d}>
          <Print src={FUJI.src} x={FUJI_PEAK_X - FUJI.peakX * FUJI.s} y={FUJI_BOTTOM_Y - fh} w={fw} h={fh} />
        </MikkelPlane>
        <Ships frame={frame} cam={cam} dMin={LINE.d} dMax={FUJI.d} />
        <MikkelPlane cam={cam} d={LINE.d}>
          <Print src={TRAIN.src} x={trainLeft} y={trainTop} w={TRAIN.w * ls} h={TRAIN.h * ls} />
          <Print src={VIADUCT.src} x={VIADUCT_LEFT} y={trainTop + (VIADUCT.top - TRAIN.top) * ls} w={VIADUCT.w * ls} h={VIADUCT.h * ls} />
        </MikkelPlane>
        <Ships frame={frame} cam={cam} dMin={0} dMax={LINE.d} />
      </MikkelFilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default NewNormalFleetPortrait;

