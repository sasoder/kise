// ---------------------------------------------------------------------------
// TwoThingsToCareAbout (sam-benchmaxxing, cut 9), REV 2 (user notes 2026-10-29, notes/REV1_9_TwoThings.md +
// REV2_9_TwoThings.md). Cheeky Pint style carried into the air like the Scott Kirby clips (styles/cheeky-pint.md; the
// clip's world benchShared.tsx: BenchStage = aircraftShared AirStage + the apron). Opaque 1080x1920, 23.976 fps, 184
// frames. Render with --gl=angle (AirStage and the objects' layers are WebGL).
//
// CHECK LINE: "two sealed things pop up side by side on 'two things'; the camera zooms into the first and it opens to a
// 3D glass flask, scientific discovery; then pans to the second and it opens to the OpenAI blossom with a cute face,
// nice to work with."
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
// f2-20, card 2 f5-23, ~half up by "two" f8, a ~4% hop clear of the slot and back), backs to us (board, big amber
// "1" and "2"). A living hold on the centred pair (slow push, a soft key light catching their edges f22-52). On "One
// is" the camera zooms into card 1 (f60-82, centred, ~826 px wide); it turns on "scientific" (flip f70-81) and a 3D
// glass flask of amber liquid ARRIVES fully formed (f80-89): it pops forward out of the card face toward camera from
// half size and a little depth behind the card plane, one springy overshoot and a small settling lean, its soft
// shadow landing on the card; flask + "SCIENTIFIC / DISCOVERY" read by "discovery" (f88); the flask turns slowly on
// its turntable, bubbles rising, through the hold (slow creep right). On "And the other" the camera pans right to
// card 2 (f136-160, centred); it turns on "being" (flip f152-162) and the OpenAI buddy (openaiBuddy3d.tsx: the real
// blossom extruded in warm dark clay, a cute face on the knot) arrives the same way (f161-170) with a settling turn to
// face us, stretches as it comes and squash-settles, bobs, sways, and winks on "work with" (f173-182). Living end on
// card 2; card 1 only as a plain strip of its front at the left edge (no letters).
// Cause before effect: each apron slot parts before its card's first pixel shows; each object arrives only once its
// card's front faces us. Nothing is ever cropped (no slot, no rule on the fronts).
// AMBER = the score: the numerals on the sealed backs and the flask's liquid. Cream = the revealed fronts; warm dark
// ink/board clay = the buddy; board = the sealed backs; glass = the flask.
// Geometry, curves and the camera: twoThingsPlan.ts. The cards: twoThingsCard.tsx (a copy of benchShared ThingCard:
// no flat glyph, no slot, no rule; benchShared is untouched). The 3D objects: twoThings3d.tsx (the flask) and
// openaiBuddy3d.tsx (the buddy, shared with cut 18), @remotion/three WebGL layers in BenchStage's html slot, above
// the chart, so they stand in front of the cards.
// Bands: the ground line sits at y ~1074-1078 while the cards pop (numerals stay above y 1080); on the holds the
// objects span ~y 280-830 and the labels ~y 871-1060.
//
// SOURCES: the OpenAI blossom, public/sam-benchmaxxing/openai_mark.svg (Commons File:OpenAI logo 2025 (symbol).svg,
// PD-textlogo; LOGOS.md).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BenchStage, GROUND, benchCam, thingH, toScreenB } from "./benchShared";
import { EdgeLight, ObjectShadow, ThingCardOpen } from "./twoThingsCard";
import { ThingObjects } from "./twoThings3d";
import { BUDDY_ASPECT, OpenAIBuddyLayer } from "./openaiBuddy3d";
import { BUDDY_CY, BUDDY_H, C1, C2, CAM_GLIDES, CAM_START, CARD_W, FLASK_FOOT, FLASK_H, OBJ_POP, arrivalOf, edgeLightOf, flipOf, riseOf, slotOpenOf, winkOf } from "./twoThingsPlan";

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
    return { ...c, rise, y0, flip: flipOf(c.i, f), open: slotOpenOf(c.i, f) };
  });
  const onScreen = (x: number) => x > -500 && x < 1580;

  // --- the flask (card 1): arrives fully formed, popping forward out of the card face (scaled about its middle),
  // with a small settling lean; then turns slowly on its turntable
  const a1 = arrivalOf(0, f);
  const fFoot = cards[0].y0 + FLASK_FOOT * CARD_H; // its resting foot, chart px
  const fMid = fFoot - FLASK_H / 2;
  const fH = FLASK_H * a1.scale;
  const fx = sc(C1, 0).x;
  const flask = {
    show: a1.show && onScreen(fx),
    x: fx,
    base: sc(C1, fMid + fH / 2).y,
    height: fH * k,
    turn: 0.35 + (f - OBJ_POP[0].f0) * 0.03,
    z: a1.z,
    lean: 0.16 * a1.turn,
    opacity: a1.alpha,
  };

  // --- the OpenAI buddy (card 2): arrives the same way with a settling turn to face us; a stretch as it comes, a
  // squash-and-settle as it lands, then a gentle bob and sway, one wink on "work with"
  const a2 = arrivalOf(1, f);
  const t2 = a2.t;
  const landed = Math.max(0, t2 - 6);
  const squash = t2 <= 0 ? 0 : t2 < 6 ? -0.06 * ss(t2 / 4) : 0.12 * Math.exp(-landed / 4) * Math.cos(landed * 0.7);
  const bob = 7 * Math.sin(Math.max(0, t2 - 10) * 0.13) * ss((t2 - 8) / 10);
  const bH = BUDDY_H * a2.scale;
  const bCy = cards[1].y0 + BUDDY_CY * CARD_H - bob;
  const bx = sc(C2, 0).x;
  const buddyShow = a2.show && onScreen(bx);

  return (
    <BenchStage
      look={look}
      S={f}
      rest={CAM.rest}
      html={
        <>
          <ThingObjects f={f} flask={flask} />
          {buddyShow ? (
            <OpenAIBuddyLayer
              x={bx}
              cy={sc(C2, bCy).y}
              height={bH * k}
              z={a2.z}
              rotY={0.55 * a2.turn}
              opacity={a2.alpha}
              tone="dark"
              pose={{ squash, sway: 0.14 * Math.sin(Math.max(0, t2 - 6) * 0.075) * ss((t2 - 6) / 12), tilt: 0, wink: winkOf(f), blink: 0, glance: { x: 0, y: 0 } }}
            />
          ) : null}
        </>
      }
    >
      {cards.map((c) => (
        <g key={c.id}>
          <ThingCardOpen id={c.id} x={c.x} floor={GROUND} w={CARD_W} k={k} flip={c.flip} rise={c.rise} slotOpen={c.open} />
          <EdgeLight x={c.x} floor={GROUND} w={CARD_W} rise={c.rise} a={edgeLightOf(c.i, f)} k={k} />
        </g>
      ))}
      <ObjectShadow
        shape="flask"
        x={C1}
        slotY={fMid + fH / 2}
        objH={fH}
        objW={fH * 0.83}
        lift={0}
        out={1}
        k={k}
        card={{ x: C1, y0: cards[0].y0, w: CARD_W, h: CARD_H }}
        strength={a1.shadow}
      />
      <ObjectShadow
        shape="round"
        x={C2}
        slotY={bCy + (bH * (1 - squash)) / 2}
        objH={bH * (1 - squash)}
        objW={(bH * BUDDY_ASPECT) / Math.sqrt(Math.max(0.3, 1 - squash))}
        lift={0}
        out={1}
        k={k}
        card={{ x: C2, y0: cards[1].y0, w: CARD_W, h: CARD_H }}
        strength={1.2 * a2.shadow}
      />
    </BenchStage>
  );
};

export default TwoThingsToCareAbout;
