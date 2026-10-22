// ---------------------------------------------------------------------------
// TwoHundredWideBodies (scott-aircraft-order, cut 25). Cheeky Pint style, the "at sea" look carried into the air
// (styles/cheeky-pint.md § Realistic ocean variant; the clip's world aircraftShared.tsx). Opaque 1080x1920, 23.976 fps,
// 81 frames. Render with --gl=angle.
//
// CHECK LINE: with the sound off, a viewer says "a big block of 200 large jets — and then an even bigger field of
// smaller jets around it: the order was enormous."
//
// THE LINE: "200 wide bodies. And then we did another several hundred narrow bodies."
// WORD -> FRAME: 200 f11-18 · wide f18 · bodies f26-35 · And f39 · then f39 · we f42 · did f44 · another f48 ·
//   several f55 · hundred f63 · narrow f69 · bodies f75-81 (notes/word_frames.txt, S3).
// DURATION: the slot 25.901 -> 29.279 s = 3.378 s x 23.976 = 81 frames (f0..f80).
//
// THE MOTION: the order counted from straight above (the world's plan camera, sun shadows to the lower right), on a dark
// warm asphalt apron with cream lane lines (concrete context beyond its lower edge). United 787-9s taxi up from the
// bottom edge in rows of ten at one constant speed and park top row first, a stop running down the convoy about one row
// a frame (first row parked f10, just before "200"; the twentieth f31): a brick-pattern block of exactly 200. From f36
// the narrowbodies roll up from the bottom edge too, every jet nose up, as rows abreast on one 44 m column grid: first
// 4 columns each side of the block (737 MAX), then a wide block under it past a cross lane (737 MAX rows, then A321neo
// rows), each block's top row parking first, the last rows easing in f70-76: exactly 430 (300 737 MAX + 130 A321neo).
// The camera runs ONE decelerating pull-back the whole cut, sinking with the convoy (k 2.7 -> ~1.35 at f35 -> a creep to
// ~0.9; the 787's span 162 -> 54 px, the 737's 32 px at the end), the block's bottom edge reaching y 1080 at f80.
// AMBER = United: a cut-local amber crown stripe (mid-fuselage to tail, twoHundredParts.tsx) on every jet, so the
// 200-block reads as an amber-tipped mass and the narrowbodies as cream with small amber tips. Cream = the airframes.
// No text, no numerals. Directions: the brief had the 787s enter from the top; they enter from the bottom so the camera
// opens on the top of the block and sinks monotonically toward the whole field (director: keep).
// SOURCES (COMMON.md "Director's fact decisions", from FACTS.md): 200 widebodies = 787s (100 firm + 100 options, as the
// speaker counts them); 430 narrowbodies = firm orders 2021-23: 200 737 MAX + 70 A321neo (2021), 100 737 MAX (2022),
// 60 A321neo (2023) -> 300 737 MAX + 130 A321neo. Jet geometry: aircraftModels.ts (real proportions).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, JetField, TaxiLine, type GroundSpec } from "./aircraftShared";
import { AmberCrowns, AsphaltApron } from "./twoHundredParts";
import { DURATION as PLAN_DURATION, FIELD_BOTTOM, FPS as PLAN_FPS, camAt, nbItems, wbItems } from "./twoHundredPlan";

export const FPS = PLAN_FPS;
export const DURATION = PLAN_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** the world's concrete under everything (context beyond the asphalt) */
const GROUND: GroundSpec = { aprons: [[-3000, -4000, 3000, 4000]], joints: 7.5 };
/** the parking apron: dark warm asphalt under the whole field, ending a little below the field's bottom row */
const APRON: [number, number, number, number][] = [[-640, FIELD_BOTTOM - 46, 640, 3000]];
const REST = camAt(0);
/** cream lane centrelines: between the 787 block and the side blocks, and the cross lane over the low block */
const CROSS_Z = -571;
const LANES: [number, number][][] = [
  [
    [-376, 3000],
    [-376, CROSS_Z],
  ],
  [
    [376, 3000],
    [376, CROSS_Z],
  ],
  [
    [-640, CROSS_Z],
    [640, CROSS_Z],
  ],
];

const TwoHundredWideBodies: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const wb = wbItems(f);
  const nb = nbItems(f);
  const b737 = nb.filter((p) => p.type === "B737MAX");
  const a321 = nb.filter((p) => p.type === "A321");
  return (
    <AirStage
      cam={cam}
      S={f}
      rest={REST}
      ground={GROUND}
      world={
        <>
          <AsphaltApron rects={APRON} />
          {LANES.map((pts, i) => (
            <TaxiLine key={i} pts={pts} width={1.6} />
          ))}
          <JetField type="B787_9" airline="united" items={wb} detail="hi" />
          <JetField type="B737MAX" airline="united" items={b737} detail="hi" />
          <JetField type="A321" airline="united" items={a321} detail="hi" />
          <AmberCrowns type="B787_9" items={wb} />
          <AmberCrowns type="B737MAX" items={b737} />
          <AmberCrowns type="A321" items={a321} />
        </>
      }
    />
  );
};

export default TwoHundredWideBodies;
