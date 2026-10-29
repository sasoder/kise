// ---------------------------------------------------------------------------
// FifteenthFloor (robert-old-buildings, cut 26). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 106 frames.
// The shared world ./streetWorld.tsx (a pre-war Manhattan side street in the misty teal air, three.js inside the
// kit's AirStage; render with --gl=angle). This cut builds nothing of its own: it flies the camera.
//
// CHECK LINE: "he lives high up, on the 15th floor of an old Manhattan apartment house — that's his window."
//
// THE LINE: "(Like) my apartment is on the 15th floor of an apartment house."
// WORD -> FRAME: my 0 · apartment 6 · is 24 · on 32 · the 38 · 15th 42 · floor 58 · of 66 · an 76 · apartment 79 ·
// house 87 · (Across 103; cut back to the speaker at 106)
// DURATION: the slot 26.151 -> 30.572 s (sequence frames 627 -> 733) = 106 frames at 24000/1001.
//
// THE MOTION: ONE eased move, crane up AND push in diagonally. f0: a wide from low in the street, three-quarter on
// (~24-35° off the facade's normal), HIS building's left CORNER in frame: the whole 15 storeys (rusticated limestone
// base, brick shaft, stone quoins, the bracketed cornice) rise from the street to the cornice with sky above, the low
// brownstone next door and the far rows receding into the haze on the left; the entrance is out of frame right. The
// crane leads (up the corner, the air and the neighbours' roofs sinking past on the left), the push in lags it, so
// the path curves up, then in; his window (the first bay in from the corner, top floor) stays high in frame all the
// way. f42 ("15th"): his window row sits just under the cornice with air above it (window ~134 px, the parapet at
// y ~130). f42-60: the arrival, tilting from looking up to looking slightly down past his sill, settling by ~f60.
// f60-106: a living hold on his lit window (~377 -> 438 px wide, centre ~(710, 640), upper half), the corner's
// quoins and a slice of air at the left, the street far below felt past the corner; lamp warming f34-60 then
// flickering, curtain stirring, motes and shafts, a slow creep in. End = CUT26_END_CAM. Every channel is integrated
// from one velocity profile: no reversals, pops or stalls.
// Orange: none (the clip's orange = hand-carved stonework, which cut 32 reveals; the crown is hidden here). His lamp is
// warm cream.
//
// DEPTH: metres, three.js pinhole (streetWorld's StreetCam). Start {x 6, y 1.6, z 11.2, yaw -24, pitch 33, f 700}
// (eye 1.6 m, 11.2 m off his facade, across the street). End (= CUT26_END_CAM) {x 1.8, y 47.725, z 3.0, yaw -22,
// pitch -10, f 1200}: 3 m off the facade at his window's height, 0.75 m to its right. The window spans y ~250-1010,
// clear of the caption bands from ~f52. Fog by the eye's distance (near 4 m) plus the height veil and the low air.
//
// SOURCES: none (an illustrative pre-war Manhattan apartment house; no real address).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUT26_END_CAM, StreetStage, type StreetCam } from "./streetWorld";

export const FPS = 24000 / 1001;
export const DURATION = 106;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** a progress 0..1 integrated from a velocity profile (ease in over a, cruise, ease out from b to c; an optional
 *  late taper), sampled finely once */
const profile = (vel: (f: number) => number, F = DURATION - 1) => {
  const N = 4000;
  const cum = [0];
  let prev = vel(0);
  for (let i = 1; i <= N; i++) {
    const v = vel((F * i) / N);
    cum.push(cum[i - 1] + (prev + v) / 2);
    prev = v;
  }
  const tot = cum[N];
  return (f: number) => {
    const x = (Math.max(0, Math.min(F, f)) / F) * N;
    const i = Math.min(N - 1, Math.floor(x));
    return lerp(cum[i], cum[i + 1], x - i) / tot;
  };
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ONE eased move. The position: the crane (height) leads, the push in toward his window (distance, sideways, lens)
// lags it, so the path curves up, then in. The tilt eases down monotonically: barely while we climb (his window stays
// high in frame, just under the cornice, all the way up), then through the arrival from looking up to looking down
// past his sill; the pan is a slow monotonic 2°. A late creep on to CUT26_END_CAM. Every channel is integrated from
// one velocity profile (ease in, cruise, ease out), so nothing reverses, pops or stalls.
const sY = profile((f) => ss(0, 14, f) * (1 - ss(28, 61, f)));
const sZ = profile((f) => ss(8, 28, f) * (1 - ss(40, 64, f)));
const sP = profile((f) => (0.1 * ss(0, 14, f) + ss(35, 47, f)) * (1 - ss(47, 59, f)));
const sC = profile((f) => ss(46, 70, f) * (1 - 0.6 * ss(80, 108, f)));

/** f0: a wide from low in the street, three-quarter on, his building's left corner in frame */
const START: StreetCam = { x: 6, y: 1.6, z: 11.2, yaw: -24, pitch: 33, f: 700 };
/** where the main move lands (f ~60); the creep then carries it on to CUT26_END_CAM */
const ARRIVE: StreetCam = { x: CUT26_END_CAM.x + 0.12, y: CUT26_END_CAM.y - 0.05, z: CUT26_END_CAM.z + 0.35, yaw: CUT26_END_CAM.yaw - 0.6, pitch: CUT26_END_CAM.pitch + 0.5, f: CUT26_END_CAM.f * 0.965 };
const END = CUT26_END_CAM;

export const camAt = (f: number): StreetCam => {
  const y = sY(f);
  const zz = sZ(f);
  const p = sP(f);
  const c = sC(f);
  const mix = (k: "x" | "y" | "z" | "yaw" | "pitch", t: number) => lerp(START[k], ARRIVE[k], t) + (END[k] - ARRIVE[k]) * c;
  return {
    x: mix("x", zz),
    y: mix("y", y),
    z: mix("z", zz),
    yaw: mix("yaw", zz),
    pitch: mix("pitch", p),
    f: Math.exp(lerp(Math.log(START.f), Math.log(ARRIVE.f), zz) + (Math.log(END.f) - Math.log(ARRIVE.f)) * c),
  };
};
const REST = camAt(0);

const FifteenthFloor: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  // his lamp: dim at first, warming to a soft cream as the camera arrives (f36-60)
  const lamp = 0.14 + 0.86 * ss(34, 60, frame);
  return <StreetStage cam={cam} rest={REST} frame={frame} lamp={lamp} curtain={1} bloom={0} hide={["crown"]} />;
};

export default FifteenthFloor;
