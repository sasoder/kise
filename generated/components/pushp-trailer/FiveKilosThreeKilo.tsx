// ---------------------------------------------------------------------------
// FiveKilosThreeKilo (pushp-trailer, cut 30). Core memory podcast style (styles/core-memory.md), real-photo variant
// of the clip's common brief: Airbound's own photographs as the world, the show's ink on top. No squared paper.
// Opaque 1920x1080, 23.976 fps, 120 frames.
//
// CHECK LINE: "the aircraft lifts more than it weighs: its load is a stack of five kilos, itself a stack of three."
//
// THE LINE: "What we've managed to do is we're lifting five kilos of payload with a three kilo aircraft."
// WORD -> FRAME: we've 2 · managed 11 · do 21 · is 27 · we're 34 · lifting 40 · five 47 · kilos 55 · of 62 ·
//   payload 68 · with 73 · a 85 · three 91 · kilo 97 · aircraft 102 · speech ends ~119
// DURATION: the slot 30.948 -> 35.953 s = 5.005 s x 23.976 = 120 frames (f0..f119).
//
// THE MOTION: One rising tilt with a pull-back. It opens tight on the white box, the fields already sinking under it
// (the plate moves from f0). Five weights slide out from behind the box and stack on its left, landed f66. The camera
// eases into its tilt and pull-back from f42, peaks near f88 and lands by f112: the aircraft comes down into frame on its tether, three identical
// weights slide out from behind it to its right, landed f100.
// Everything rides one rig: the aircraft banks continuously from its own small horizontal velocity, and bobs.
// Contact: each weight starts fully hidden behind its occluder (box / fuselage); nothing appears from nothing.
//
// SOURCES: photographs are Airbound's own: fields_clean_healed.jpg (aerial, aircraft painted out, lens ghost healed), aircraft_package_clean.png
// (scripts/clips/pushp-trailer/bake-package-clean.py, from the prepared aircraft_package.png). 5 kg on 3 kg is the
// speaker's own figure (episode ~12:48); kept off screen beyond the "1 KG" print.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Inked,
  SHADOW,
  clamp,
  fontFamily,
  runCamera2,
} from "../kits/core-memory/cerroShared";

export const FPS = 24000 / 1001;
export const DURATION = 120;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const W = 1920;
const H = 1080;

// -- the rig, in the cut-out's own px (scale 1 = real proportions) ------------------------------------------------
const IMG_W = 1920;
const IMG_H = 1280;
const BOX = { x: 890, y: 1010 };
const CG = { x: 950, y: 480 }; // the bank pivots here

// The weights: one silhouette, world scale. Body plus ring = one tier pitch.
const WT_W = 128; // bottom width
const WT_TOP = 94; // top width
const WT_BODY = 54;
const WT_RING = 16;
const PITCH = WT_BODY + WT_RING;
const FIVE_X = 728; // centre, left of the box
const FIVE_BOTTOM = 1130;
// Right of the aircraft, above the low wing tip, in shot on "three"; the rotor tip and wing set how close it can sit.
const THREE_X = 1392;
const THREE_BOTTOM = 702;

const smoother = (t: number) => {
  const u = Math.max(0, Math.min(1, t));
  return u * u * u * (u * (u * 6 - 15) + 10);
};

// -- the camera: k plus where the box sits on screen; one key per frame through the damped runCamera2 -------------
const K0 = 2.2;
const K_END = 1.04;
const ANCHOR0 = { x: 1215, y: 490 };
const ANCHOR1 = { x: 850, y: 850 };
const MAIN_START = 42;
const MAIN_END = 112;
// The one main move: a very gentle start, a lower peak (~f88), one long deceleration.
const mainAt = (f: number) => smoother(Math.pow(Math.max(0, Math.min(1, (f - MAIN_START) / (MAIN_END - MAIN_START))), 1.65));
const camKeys = (f: number) => {
  const main = mainAt(f);
  const creep = Math.min(1, f / 90);
  const zoom = 0.2 * (1 - (1 - creep) * (1 - creep)) + 0.8 * main; // the slow pull from f0, then the main one
  const k = K0 * Math.pow(K_END / K0, zoom) * (1 - 0.012 * smoother((f - 100) / 20));
  const sx = ANCHOR0.x + (ANCHOR1.x - ANCHOR0.x) * main;
  const sy = ANCHOR0.y + (ANCHOR1.y - ANCHOR0.y) * main;
  return { cx: BOX.x - (sx - W / 2) / k, cy: BOX.y - (sy - H / 2) / k, k };
};
const CAM_F: number[] = [];
const CAM_CX: number[] = [];
const CAM_CY: number[] = [];
const CAM_K: number[] = [];
for (let f = -12; f <= DURATION; f++) {
  const c = camKeys(Math.max(0, f));
  CAM_F.push(f + 12);
  CAM_CX.push(c.cx);
  CAM_CY.push(c.cy);
  CAM_K.push(c.k);
}
const cameraAt = (frame: number) => runCamera2(frame + 12, CAM_F, CAM_CY, CAM_CX, CAM_K);

// -- the rise: the plate sinks from f0 and never stops; parallax comes with the camera's own scale -------------------
const PLATE_W = 3276;
const PLATE_H = 1840;
const PLATE_PARALLAX = 0.4;
const PLATE_X_SRC = 1640; // source x held at the frame's centre at rest (the lake and the blocks)
const plateAt = (frame: number, cx: number, k: number) => {
  const s = 1 + (k - 1) * PLATE_PARALLAX * 0.5;
  const main = mainAt(frame + 2);
  // the source y at the frame's centre, in source px: from low over the fields to the horizon near the frame's middle
  const steady = frame / DURATION;
  const srcY = 1290 - (340 * steady + 260 * main);
  const srcX = PLATE_X_SRC + (cx - 990) * PLATE_PARALLAX;
  return { s, x: W / 2 - srcX * s, y: H / 2 - srcY * s };
};

// -- hover: small sway and bob; the bank is continuous and comes from the horizontal velocity ------------------------
const DRIFT_X = (f: number) => 11 * Math.sin((f + 18) / 21);
const rigAt = (frame: number) => {
  const vx = DRIFT_X(frame + 0.5) - DRIFT_X(frame - 0.5);
  return {
    dx: DRIFT_X(frame),
    dy: 3.2 * Math.sin(frame / 13),
    roll: vx * 1.25, // degrees: moving right banks right
  };
};

// -- the weights -----------------------------------------------------------------------------------------------------
const EASE_SLIDE = Easing.bezier(0.3, 0, 0.12, 1);
const slide = (frame: number, start: number, travel: number) =>
  interpolate(frame, [start, start + travel], [0, 1], { easing: EASE_SLIDE, ...clamp });

/** The body and ring at centre (x, y of the body's bottom). */
const WeightShape: React.FC<{ x: number; bottom: number; fill: string }> = ({ x, bottom, fill }) => {
  const b = WT_W / 2;
  const t = WT_TOP / 2;
  const y0 = bottom - WT_BODY;
  const r = 7;
  return (
    <path
      fillRule="evenodd"
      fill={fill}
      d={[
        `M ${x - b + r} ${bottom} L ${x + b - r} ${bottom} Q ${x + b} ${bottom} ${x + b - 2} ${bottom - r}`,
        `L ${x + t + 1} ${y0 + r} Q ${x + t} ${y0} ${x + t - r} ${y0}`,
        // the ring: a chunky arch standing on the body's top, its hole open to whatever is behind
        `L ${x + 24} ${y0} C ${x + 24} ${y0 - WT_RING - 5} ${x - 24} ${y0 - WT_RING - 5} ${x - 24} ${y0}`,
        `L ${x - t + r} ${y0} Q ${x - t} ${y0} ${x - t - 1} ${y0 + r}`,
        `L ${x - b + 2} ${bottom - r} Q ${x - b} ${bottom} ${x - b + r} ${bottom} Z`,
        `M ${x - 11} ${y0} C ${x - 11} ${y0 - 9} ${x + 11} ${y0 - 9} ${x + 11} ${y0} Z`,
      ].join(" ")}
    />
  );
};

const Weight: React.FC<{ x: number; bottom: number }> = ({ x, bottom }) => (
  <g>
    <Inked render={(fill) => <WeightShape x={x} bottom={bottom} fill={fill} />} />
    <text
      x={x}
      y={bottom - 16}
      textAnchor="middle"
      fill={SHADOW}
      style={{ fontFamily, fontWeight: 900, fontSize: 30, letterSpacing: "0.01em" }}
    >
      1 KG
    </text>
  </g>
);

// Five: each starts wholly behind the box, rises first, then slides left onto the stack, so it clears the tiers below.
const FIVE_START = [36, 41, 46, 50, 54];
const FIVE_TRAVEL = 12;
const FIVE_FROM = { x: BOX.x - 3, y: 1058 };
const fivePos = (frame: number, i: number) => {
  const yEnd = FIVE_BOTTOM - i * PITCH;
  const u = (frame - FIVE_START[i]) / FIVE_TRAVEL;
  const x = interpolate(smoother((u - 0.18) / 0.82), [0, 1], [FIVE_FROM.x, FIVE_X]);
  const y = interpolate(smoother(u / 0.62), [0, 1], [FIVE_FROM.y, yEnd]);
  return { x, y };
};

// Three: wholly behind the fuselage, one start point, each sliding out to its own level, behind the wing and the mast.
const THREE_START = [82, 84, 86];
const THREE_TRAVEL = 14;
const THREE_FROM = { x: 1012, y: 560 };
const threePos = (frame: number, i: number) => {
  const t = slide(frame, THREE_START[i], THREE_TRAVEL);
  return {
    x: interpolate(t, [0, 1], [THREE_FROM.x, THREE_X]),
    y: interpolate(t, [0, 1], [THREE_FROM.y, THREE_BOTTOM - i * PITCH]),
  };
};

// -- the rotor discs: the photo's own soft blur, redrawn quiet -----------------------------------------------------
const Rotor: React.FC<{ x: number; y: number; rx: number; ry: number; tilt: number; frame: number; seed: number }> = ({
  x,
  y,
  rx,
  ry,
  tilt,
  frame,
  seed,
}) => (
  <g transform={`rotate(${tilt} ${x} ${y})`} filter="url(#fkRotorBlur)">
    <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#1b2026" opacity={0.2 + 0.035 * Math.sin(frame * 1.9 + seed)} />
    <ellipse cx={x} cy={y} rx={rx * 0.62} ry={ry * 0.55} fill="#1b2026" opacity={0.1 + 0.03 * Math.sin(frame * 2.7 + seed)} />
  </g>
);

const FiveKilosThreeKilo: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = cameraAt(frame);
  const plate = plateAt(frame, cx, k);
  const rig = rigAt(frame);
  const transform = `translate(${W / 2 - cx * k}px, ${H / 2 - cy * k}px) scale(${k})`;
  const rigTransform = `translate(${rig.dx}px, ${rig.dy}px) rotate(${rig.roll}deg)`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#5f6166", overflow: "hidden" }}>
      <Img
        src={staticFile("pushp-trailer/fields_clean_healed.jpg")}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PLATE_W,
          height: PLATE_H,
          maxWidth: "none",
          transformOrigin: "0 0",
          transform: `translate(${plate.x}px, ${plate.y}px) scale(${plate.s})`,
        }}
      />
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: IMG_W,
            height: IMG_H,
            transformOrigin: `${CG.x}px ${CG.y}px`,
            transform: rigTransform,
          }}
        >
          {/* Behind the photo: every weight comes out from behind its occluder. */}
          <svg width={IMG_W} height={IMG_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {THREE_START.map((s, i) => {
              if (frame < s) return null;
              const p = threePos(frame, i);
              return <Weight key={`t${i}`} x={p.x} bottom={p.y} />;
            })}
            {FIVE_START.map((s, i) => {
              if (frame < s) return null;
              const p = fivePos(frame, i);
              return <Weight key={`f${i}`} x={p.x} bottom={p.y} />;
            })}
          </svg>
          <Img
            src={staticFile("pushp-trailer/aircraft_package_clean.png")}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: IMG_W,
              height: IMG_H,
              maxWidth: "none",
              filter: "brightness(0.95) saturate(0.92) sepia(0.07)",
            }}
          />
          <svg width={IMG_W} height={IMG_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <defs>
              <filter id="fkRotorBlur" x="-30%" y="-120%" width="160%" height="340%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
            </defs>
            <Rotor x={717} y={308} rx={132} ry={25} tilt={9} frame={frame} seed={0.4} />
            <Rotor x={1180} y={530} rx={130} ry={25} tilt={9} frame={frame} seed={2.1} />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default FiveKilosThreeKilo;
