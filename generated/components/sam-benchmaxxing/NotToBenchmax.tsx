// ---------------------------------------------------------------------------
// NotToBenchmax (sam-benchmaxxing, cut 26). Cheeky Pint style carried into the air like the Scott Kirby clips
// (styles/cheeky-pint.md; COMMON.md). The clip's world: benchShared's BenchStage (AirStage over the airfield) and
// OpenAITile, imported read-only.
// Opaque 1080x1920, 23.976 fps, 50 frames. RENDER WITH --gl=angle (AirStage is three.js).
//
// CHECK LINE: "OpenAI's logo, alone and spotless, catches a glittering shine right as Sam says 'benchmax' — the
// squeaky-clean look of someone who says they don't do it."
//
// THE LINE: "But we endeavor not to benchmax."
// WORD -> FRAME: But -1 · we 2 · endeavor 8 · not 19 · to 26 · bench 30 · max 35 · (John 41; cut back at 50)
// (notes/word_frames.txt, CUT 26; ±2 f).
// DURATION: the slot 26.068 -> 28.153 s = 2.085 s x 24000/1001 = 50 frames (f0..f49).
//
// THE MOTION: the OpenAI tile alone in the warm sky high over the airfield, a little above frame centre. f0-16 it
// rises into place (already moving at f0; ~65 px up the screen, the horizon sinking ~200 px) and turns a few degrees to face us while the camera eases in and up with
// it (the horizon sinks away below); f16-29 it holds, settling with a faint drift. On "bench" (f30) one diagonal
// shine sweeps the face top-left -> bottom-right (f30-38: hot white core, amber edges; it lifts the ink blossom);
// on "max" (f33-44) glitter: five four-point star glints at the corners and rim, staggered in the sweep's
// direction, each growing and shrinking over 7-10 f, with two tiny secondary sparkles; f44-49 one last small glint
// fades at the top-right corner over the still tile, the camera creeping, sky, motes and grain alive.
// AMBER = the shine (the sweep's edges, the glints' halos). Cream = the tile. No text.
//
// SOURCES: the OpenAI blossom (2025 symbol) as macintoshShared draws it (its header: Commons "File:OpenAI logo 2025
// (symbol).svg"). No figures.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, rectPath } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow } from "../kits/cheeky-pint/museShared";
import { BenchStage, EYE, F0, GROUND_SPEC, OpenAITile, benchCam, benchCamOf, tileRadius, type Look } from "./benchShared";
import { Glitter, ShineSweep, sweepAt, type GlintSpec } from "./sparkleShine";

export const FPS = 24000 / 1001;
export const DURATION = 50;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ---------------------------------------------------------------------------
// THE PLAN (chart px of benchShared's plane; screen = 540 + (x - look.x) k, 960 + (y - look.y) k)
// ---------------------------------------------------------------------------
export const BEAT = { we: 2, endeavor: 8, not: 19, to: 26, bench: 30, max: 35, john: 41 } as const;
/** the tile: centre x, its resting centre y, its size (chart px; at rest it sits at screen y ~776, ~540 px wide) */
export const TILE = { x: 540, y: 466, size: 530, rise: 190 } as const;
/** the arrival: rise and turn on one ease-out, already moving at f0 (starts at f-6), in place by ~f16 */
export const ARRIVE = { f0: -4, f1: 20, rotY: -17, rotX: -6, rotZ: 1.8 } as const;
/** the shine sweep on "bench" */
export const SWEEP = { f0: BEAT.bench - 1, frames: 9 } as const;
/** the glitter on "max": corners and rim, staggered in the sweep's direction (TL first, BR later), and the last glint */
export const GLINTS: readonly GlintSpec[] = [
  // the hero: top-left corner, born on "max"'s run-in, the biggest
  { u: -0.93, v: -0.93, at: 33, life: 11, r: 118, rot: 0, spin: 16 },
  { u: -0.5, v: -1.08, at: 34, life: 8, r: 24, rot: 20, cross: false, tone: "cream" },
  { u: 1.06, v: -0.38, at: 35, life: 10, r: 75, rot: 8, spin: -14, tone: "cream" },
  { u: 0.88, v: 0.8, at: 37, life: 11, r: 68, rot: -6, spin: 18 },
  { u: -1.06, v: 0.38, at: 39, life: 10, r: 68, rot: 12, tone: "cream" },
  { u: 1.06, v: 0.42, at: 41, life: 8, r: 22, rot: 30, cross: false },
  // the last glint: top-right corner, still clearly there as it fades through f44-49
  { u: 0.93, v: -0.93, at: 42, life: 13, r: 84, rot: 4, spin: 10 },
];

// ---------------------------------------------------------------------------
// THE WORLD — benchShared's chart plane (Z = 330 m, GROUND 1600, eye 50 m: the horizon 350 k px above the ground
// line), the same airfield as cuts 1 and 5. The camera looks high above the apron (look y ~650 at rest), so the
// horizon sits low in frame (~y 1560 at rest, ~1380 at f0) and the tile stands alone in the open dusk sky, whose
// darker band behind it makes the cream face and the glints read.
// ---------------------------------------------------------------------------
// THE CAMERA — opens wider and lower (the tile below its rest place), eases in and up with the rising tile, a
// step ahead of it (one damped glide, f-16..16), then creeps in to the last frame.
// ---------------------------------------------------------------------------
const CAM = benchCam(
  { x: 540, y: 785, k: 0.9 },
  [
    { f0: -16, f1: 16, dy: -135, k: 1.0 },
    { f0: 16, f1: 80, k: 1.045 },
  ],
  DURATION,
);

/** the arrival's ease: velocity highest at the start (moving at f0), a long weighty settle */
const arrive = (f: number) => {
  const u = c01((f - ARRIVE.f0) / (ARRIVE.f1 - ARRIVE.f0));
  return 1 - Math.pow(1 - u, 2.2);
};
/** the faint living drift once in place (world px / deg): slow, sub-pixel-ish, never a bob that reads as a bounce */
const drift = (f: number) => {
  const w = c01((f - 10) / 14);
  return { dy: w * 3.2 * Math.sin(((f - 10) / 46) * Math.PI * 2), rz: w * 0.35 * Math.sin(((f - 4) / 58) * Math.PI * 2) };
};

/** the tile's pose at frame f: world centre y and its 3D turn */
export const tilePose = (f: number) => {
  const e = arrive(f);
  const d = drift(f);
  return {
    y: TILE.y + TILE.rise * (1 - e) + d.dy,
    rotY: ARRIVE.rotY * (1 - e),
    rotX: ARRIVE.rotX * (1 - e),
    rotZ: ARRIVE.rotZ * (1 - e) + d.rz,
    /** 0 = turned away (a touch darker), 1 = facing us and the key light */
    face: e,
  };
};

/** The tile in screen px, inside a CSS-3D turn about its own centre: benchShared's OpenAITile (the clip's one OpenAI
 *  tile: cream, ink blossom, radius 0.16 x size), with the float shadow of a card hanging in the air (museShared
 *  UnionShadow "float", the recipe MarkTile uses; OpenAITile's own shadow is the rest/contact one, wrong in the air). */
const TurnedTile: React.FC<{ cx: number; cy: number; size: number; k: number; rotX: number; rotY: number; rotZ: number; face: number; sweep: number }> = ({
  cx,
  cy,
  size,
  k,
  rotX,
  rotY,
  rotZ,
  face,
  sweep,
}) => {
  const x0 = cx - size / 2;
  const y0 = cy - size / 2;
  const r = tileRadius(size);
  const faceD = rectPath(x0, y0, size, size, r);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, perspective: "2600px", perspectiveOrigin: `${f3(cx)}px ${f3(cy)}px` }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          transformOrigin: `${f3(cx)}px ${f3(cy)}px`,
          transform: `rotateX(${f3(rotX)}deg) rotateY(${f3(rotY)}deg) rotateZ(${f3(rotZ)}deg)`,
        }}
      >
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <UnionShadow sil={[{ d: faceD }]} s={size / 96} elevation="float" />
          <OpenAITile x={cx} floor={cy + size / 2} size={size} k={k} shadow={0} />
          {/* turned away from the key light, the face sits a touch lower in tone; it lifts as it turns to us */}
          {face < 0.999 ? <path d={faceD} fill={COLOR.shadow} opacity={f3(0.1 * (1 - face))} /> : null}
          <ShineSweep clip={faceD} box={{ x: x0, y: y0, w: size, h: size }} progress={sweep} />
        </svg>
      </div>
    </div>
  );
};

/** The far edge of benchShared's apron (z = 760 m) meets the desert in a hard step that this cut's framing puts at
 *  ~80 % of the frame height in the opening frames. A cut-side softener (the world is not touched): a strip across
 *  that row whose backdrop is blurred, feathered top and bottom, so the step reads as a soft haze line. */
const APRON_FAR = GROUND_SPEC.aprons[0][3];
const ApronEdgeSoftener: React.FC<{ look: Look }> = ({ look }) => {
  const cam = benchCamOf(look);
  const hor = cam.mode === "side" ? (cam.horizon ?? 960) : 960;
  const edge = hor + (F0 * look.k * EYE) / APRON_FAR;
  const h = 130 * look.k;
  const mask = "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 38%, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)";
  return (
    <div
      style={{
        position: "absolute",
        left: -40,
        top: edge - h / 2,
        width: 1160,
        height: h,
        backdropFilter: `blur(${f3(14 * look.k)}px)`,
        WebkitBackdropFilter: `blur(${f3(14 * look.k)}px)`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
};

const NotToBenchmax: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const look = CAM.at(f);
  const k = look.k;
  const p = tilePose(f);
  const cx = 540 + (TILE.x - look.x) * k;
  const cy = 960 + (p.y - look.y) * k;
  const size = TILE.size * k;
  const sweep = sweepAt(f, SWEEP.f0, SWEEP.frames);
  return (
    <BenchStage
      look={look}
      S={f}
      rest={CAM.rest}
      html={
        <>
          <ApronEdgeSoftener look={look} />
          <TurnedTile cx={cx} cy={cy} size={size} k={k} rotX={p.rotX} rotY={p.rotY} rotZ={p.rotZ} face={p.face} sweep={sweep} />
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            <Glitter specs={GLINTS} f={f} cx={cx} cy={cy} half={size / 2} scale={k} />
          </svg>
        </>
      }
    />
  );
};

export default NotToBenchmax;
