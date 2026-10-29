// ---------------------------------------------------------------------------
// TwoThingsToCareAbout (sam-benchmaxxing, cut 9), REV 1 (user notes 2026-10-29, notes/REV1_9_TwoThings.md). Cheeky
// Pint style carried into the air like the Scott Kirby clips (styles/cheeky-pint.md; the clip's world benchShared.tsx:
// BenchStage = aircraftShared AirStage + the apron). Opaque 1080x1920, 23.976 fps, 184 frames. Render with --gl=angle
// (AirStage and the objects' layer are WebGL).
//
// CHECK LINE: "two sealed things pop up side by side on 'two things'; the camera zooms into the first and it opens to a
// 3D glass flask, scientific discovery; then pans to the second and it opens to a friendly 3D smiley, nice to work with."
//
// THE LINE: "Maybe there are two things we should really care about models being good at. One is scientific
// discovery and doing things that people cannot do. And the other is being nice to work with," (cut back to Sam on
// "enjoyable to work with").
// WORD -> FRAME: Maybe -1 · there 3 · are 6 · two 8 · things 14 · we 23 · should 27 · really 30 · care 34 · about 38 ·
// models 43 · being 51 · good 55 · at 60 · One 66 · is 70 · scientific 73 · discovery 88 · and 103 · doing 109 ·
// things 113 · that 119 · people 122 · cannot 127 · do 135 · And 144 · the 147 · other 149 · is 153 · being 156 ·
// nice 164 · to 171 · work 175 · with 178 (notes/word_frames.txt, CUT 9; ±2 f).
// DURATION: slot 9.259 -> 16.934 s = 7.675 s x 24000/1001 = 184 frames (f0..f183; sequence frames 222-406).
//
// THE MOTION (one camera that keeps developing): the apron's two slots part (f0-7) under a slow push while the
// camera holds the pair's place centred; on "two things" the two sealed cards POP up out of them side by side (card 1
// f2-20, card 2 f5-23, ~half up by "two" f8, a ~4% hop clear of the slot and back), backs to us (board, big amber "1" and "2"). A living
// hold on the centred pair (slow push, a soft key light catching their edges f22-52). On "One is" the camera zooms
// into card 1 (f60-82, centred, ~826 px wide); it turns on "scientific" (flip f70-81) and a 3D glass flask of amber
// liquid rises out of the slot across its face with a pop (f80-92): flask + "SCIENTIFIC / DISCOVERY" read by
// "discovery" (f88); the flask turns slowly on its turntable, bubbles rising, through the hold (slow creep right).
// On "And the other" the camera pans right to card 2 (f136-160, centred); it turns on "being" (flip f152-162) and a
// chunky caramel-clay 3D smiley (ink face, cream sheen, contact pool) pops out of its slot (f161-173), squashes and settles, bobs, sways, and winks on "work with"
// (f173-182). Living end on card 2; card 1 only as a plain strip of its front at the left edge (no letters).
// Cause before effect: each apron slot parts before its card's first pixel shows; each object's slot is on the
// revealed face before the object's first pixel shows above it (the object is clipped at the slot line).
// AMBER = the score: the numerals on the sealed backs and the flask's liquid. Cream = the revealed fronts; caramel
// clay (board family) = the smiley; board = the sealed backs; glass = the flask.
// Geometry, curves and the camera: twoThingsPlan.ts. The cards: twoThingsCard.tsx (a copy of benchShared ThingCard:
// no flat glyph, a slot across the front; benchShared is untouched). The 3D objects: twoThings3d.tsx (@remotion/three,
// a WebGL layer in BenchStage's html slot, above the chart, so they stand in front of the cards).
// Bands: the ground line sits at y ~1074-1078 while the cards pop (numerals stay above y 1080); on the holds the
// objects span ~y 375-815 and the labels ~y 868-1060.
//
// SOURCES: none (no figures, no real marks).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BenchStage, GROUND, benchCam, thingH, toScreenB } from "./benchShared";
import { EdgeLight, OBJ_SLOT_Y, ObjectShadow, ThingCardOpen } from "./twoThingsCard";
import { ThingObjects } from "./twoThings3d";
import {
  C1,
  C2,
  CAM_GLIDES,
  CAM_START,
  CARD_W,
  FLASK_H,
  OBJ_POP,
  SMILEY_D,
  SMILEY_HOVER,
  edgeLightOf,
  flipOf,
  objPopOf,
  riseOf,
  slotOpenOf,
  winkOf,
} from "./twoThingsPlan";

export const FPS = 24000 / 1001;
export const DURATION = 184;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const CAM = benchCam({ ...CAM_START }, CAM_GLIDES.map((g) => ({ ...g })), DURATION);
const CARD_H = thingH(CARD_W);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
/** the flask's widest radius is 0.415 of its height */
const FLASK_W = FLASK_H * 0.83;

const TwoThingsToCareAbout: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const look = CAM.at(f);
  const k = look.k;
  const sc = (x: number, y: number) => toScreenB(look, x, y);

  const cards = [
    { id: "science" as const, x: C1, i: 0 as const },
    { id: "nice" as const, x: C2, i: 1 as const },
  ].map((c) => {
    const rise = riseOf(c.i, f);
    const y0 = GROUND - CARD_H * Math.max(0, rise);
    return { ...c, rise, y0, slotY: y0 + OBJ_SLOT_Y * CARD_H, flip: flipOf(c.i, f), open: slotOpenOf(c.i, f) };
  });

  // --- the flask (card 1): rises out of its slot (base below the slot line until out), overshoots and settles
  const p1 = objPopOf(0, f);
  const fBaseW = cards[0].slotY + (1 - p1) * FLASK_H;
  const fx = sc(C1, 0).x;
  const flask = {
    show: p1 > 0.001 && fx > -500 && fx < 1580,
    x: fx,
    base: sc(C1, fBaseW).y,
    height: FLASK_H * k,
    clip: sc(C1, cards[0].slotY).y,
    turn: 0.35 + (f - OBJ_POP[0].f0) * 0.03,
  };

  // --- the smiley (card 2): rises out, squash-and-settle on landing, then a gentle bob and sway, one wink
  const p2 = objPopOf(1, f);
  const t2 = f - OBJ_POP[1].f0;
  const landed = Math.max(0, t2 - 8);
  const squash = t2 <= 0 ? 0 : t2 < 8 ? -0.07 * ss(t2 / 6) : 0.15 * Math.exp(-landed / 4.5) * Math.cos(landed * 0.62);
  const bob = 7 * Math.sin(Math.max(0, t2 - 12) * 0.13) * ss((t2 - 10) / 10);
  const sHover = SMILEY_HOVER * clamp01(p2) + bob;
  const sBaseW = cards[1].slotY + (1 - p2) * SMILEY_D * 0.94 - sHover;
  const sx = sc(C2, 0).x;
  const smiley = {
    show: p2 > 0.001 && sx > -500 && sx < 1580,
    x: sx,
    base: sc(C2, sBaseW).y,
    diameter: SMILEY_D * k,
    clip: sc(C2, cards[1].slotY).y,
    squash,
    sway: 0.2 * Math.sin(Math.max(0, t2) * 0.075) * ss(t2 / 12),
    wink: winkOf(f),
  };

  return (
    <BenchStage look={look} S={f} rest={CAM.rest} html={<ThingObjects f={f} flask={flask} smiley={smiley} />}>
      {cards.map((c) => (
        <g key={c.id}>
          <ThingCardOpen id={c.id} x={c.x} floor={GROUND} w={CARD_W} k={k} flip={c.flip} rise={c.rise} slotOpen={c.open} />
          <EdgeLight x={c.x} floor={GROUND} w={CARD_W} rise={c.rise} a={edgeLightOf(c.i, f)} k={k} />
        </g>
      ))}
      <ObjectShadow
        shape="flask"
        x={C1}
        slotY={cards[0].slotY}
        objH={FLASK_H}
        objW={FLASK_W}
        lift={Math.max(0, p1 - 1) * FLASK_H}
        out={Math.min(1, p1)}
        k={k}
        card={{ x: C1, y0: cards[0].y0, w: CARD_W, h: CARD_H }}
      />
      <ObjectShadow
        shape="round"
        x={C2}
        slotY={cards[1].slotY}
        objH={SMILEY_D * 0.94 * (1 - squash)}
        objW={SMILEY_D / Math.sqrt(Math.max(0.3, 1 - squash))}
        lift={Math.max(0, sHover)}
        out={Math.min(1, p2)}
        k={k}
        card={{ x: C2, y0: cards[1].y0, w: CARD_W, h: CARD_H }}
        strength={1.3}
      />
    </BenchStage>
  );
};

export default TwoThingsToCareAbout;
