// ---------------------------------------------------------------------------
// TwoThingsToCareAbout (sam-benchmaxxing, cut 9). Cheeky Pint style, carried into the air like the Scott Kirby clips
// (styles/cheeky-pint.md; the clip's world benchShared.tsx: BenchStage = aircraftShared AirStage + the apron,
// ThingCard). Opaque 1080x1920, 23.976 fps, 184 frames. Render with --gl=angle (AirStage is WebGL).
//
// CHECK LINE: "Sam names two things models should be good at: first we see two sealed cards marked 1 and 2, then the
// camera pans right as they flip open — 'scientific discovery', then 'nice to work with'."
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
// THE MOTION: one rightward camera journey (the user: "first announce the 2 things but don't reveal them, and then
// pan to the right where they get revealed"; look x never decreases). Two tall ThingCards, backs to us (board, big
// amber "1" and "2"), come up out of their slots side by side, the pair off-centre RIGHT (card 1 centred at x ~576,
// card 2 just past the right edge, empty apron and sky to the left), ~60% up at f0 and settled by f11 (card 1 f-14..f10,
// card 2 f-13..f11): "two things", announced but sealed, numerals ~160 px at f0 and >= 170 px from f12, growing.
// A soft key light catches their edges (f20-52) while the camera drifts right and pushes in (from before f0 to f63), then accelerates
// right and in onto card 1 (f52-92, ~822 px wide), which turns on "scientific" (flip f70-86): flask +
// "SCIENTIFIC / DISCOVERY" readable at "discovery" (label cap 64.7 px at f88). A slow creep right on the hold
// (f84-134); on "And the other" the pan right to card 2 (f118-156), which turns on "being nice" (flip f152-168):
// smile + "NICE TO / WORK WITH" readable at "nice" (f164). Living end: a slow creep right, card 2 centred (~x 522);
// card 1 shows at the left edge only as a plain strip of its revealed front (~80 px, inside its label margin), so
// no letter fragments sit at the frame edge.
// Cause before effect: each card's slot is open before its first pixel shows above the lip; a flip has no outside
// cause (the card turns itself on its word), the amber numeral goes with the back.
// AMBER = the score: here only the numerals on the sealed backs (lifted a step toward amberHot with a soft cast shadow
// so they separate from the board in value, not only in hue; they go when a card turns); cream = the revealed
// fronts, board = the sealed backs.
// Geometry, curves and the camera: twoThingsPlan.ts. Cards: benchShared ThingCard (imported read-only).
// Band check (every frame, from the plan): numerals, glyphs and labels stay clear of y 1080-1250 and 1360-1460: the
// ground line sits at y ~1074-1100 while the cards rise (numerals emerge above the band) and at ~1290 on the holds
// (labels end at y ~1055).
//
// SOURCES: none (no figures). The flask and smile glyphs are Lucide geometry in benchShared.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, FONT_NUM, amberBandFor, bloomFilter, mixHex, rectPath } from "../kits/cheeky-pint/stoutShared";
import { BenchStage, GROUND, THING, THING_LAYOUT, ThingCard, benchCam } from "./benchShared";
import { C1, C2, CAM_GLIDES, CAM_START, CARD_H, CARD_W, edgeLightOf, flipOf, numeralLiftOf, riseOf } from "./twoThingsPlan";

export const FPS = 24000 / 1001;
export const DURATION = 184;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const CAM = benchCam({ ...CAM_START }, CAM_GLIDES.map((g) => ({ ...g })), DURATION);
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

/**
 * The soft key light catching a sealed card's edges (the light is above-left): its top edge brightens to the full
 * cream rim and a soft warm sheen gathers inside the left edge. Only on the back, before the card turns (`a` 0..1);
 * clipped to the card and to the ground (a rising card is still partly in its slot).
 */
const EdgeLight: React.FC<{ x: number; floor: number; rise: number; a: number; k: number }> = ({ x, floor, rise, a, k }) => {
  const uid = `el${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  if (a <= 0.002 || rise <= 0.002) return null;
  const w = CARD_W;
  const h = CARD_H;
  const r = THING_LAYOUT.radius * w;
  const y0 = floor - h * rise;
  const sheen = w * 0.16;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}>
          <rect x={f3(x - w / 2)} y={f3(y0)} width={f3(w)} height={f3(Math.max(0, floor - y0))} />
        </clipPath>
        <linearGradient id={`${uid}s`} gradientUnits="userSpaceOnUse" x1={f3(x - w / 2)} y1="0" x2={f3(x - w / 2 + sheen)} y2="0">
          <stop offset="0" stopColor={COLOR.cream} stopOpacity={0.3} />
          <stop offset="1" stopColor={COLOR.cream} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${uid}v`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + h)}>
          <stop offset="0" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.75" stopColor="#fff" stopOpacity={0.15} />
        </linearGradient>
        <mask id={`${uid}m`}>
          <rect x={f3(x - w / 2)} y={f3(y0)} width={f3(w)} height={f3(h)} fill={`url(#${uid}v)`} />
        </mask>
      </defs>
      <g clipPath={`url(#${uid}c)`} opacity={f3(a)}>
        <path d={rectPath(x - w / 2, y0, w, h, r)} fill={`url(#${uid}s)`} mask={`url(#${uid}m)`} />
        <path
          d={`M${f3(x - w / 2 + r)} ${f3(y0 + EDGE.CREAM / k / 2)}H${f3(x + w / 2 - r)}`}
          stroke={COLOR.edge}
          strokeOpacity={ALPHA.edge}
          strokeWidth={f3(EDGE.CREAM / k)}
        />
      </g>
    </g>
  );
};

/**
 * The sealed back's numeral, lifted for the announce: amber and the board sit at nearly the same luminance (measured
 * 1.04:1 on the render), so the numeral read by hue alone. This draws the SAME glyph as benchShared's ThingBack
 * (Söhne Dreiviertelfett, 0.62 w, centred at 0.5 h, lining figures) exactly over it, filled a step brighter (amberTop
 * warmed toward amberHot at the top, amberTop at the foot) with the fixed bloom, over one soft cast shadow down-right
 * (the key light is above-left), the radar-map CastNumeral recipe. Only on the back: it fades out before the turn
 * (`a`, over the first part of the turn, narrowing with the face as it goes), clipped at the ground like the rising card.
 */
const LiftedNumeral: React.FC<{ id: "science" | "nice"; x: number; floor: number; rise: number; flip: number; a: number; k: number }> = ({ id, x, floor, rise, flip, a, k }) => {
  const uid = `ln${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  if (a <= 0.002 || rise <= 0.002) return null;
  const L = THING_LAYOUT;
  const w = CARD_W;
  const h = CARD_H;
  const y0 = floor - h * rise;
  const px = L.numeralPx * w;
  const cap = 0.729 * px;
  const base = y0 + L.numeralCy * h + cap * 0.5;
  // narrow with the back's face exactly as ThingCard turns it (its flip geometry, mirrored here)
  const u = Math.max(0, Math.min(1, flip));
  const th = Math.PI * u * u * (3 - 2 * u);
  const c = Math.cos(th);
  if (c <= 0.001) return null;
  const faceW = w * c;
  const e = L.edge * w * Math.abs(Math.sin(th));
  const faceX = x - (faceW + e) / 2 + faceW / 2;
  const text = (fill: string, extra?: React.SVGProps<SVGTextElement>) => (
    <text x={f3(x)} y={f3(base)} textAnchor="middle" fontFamily={FONT_NUM} fontWeight={700} fontSize={f3(px)} fill={fill} style={{ fontFeatureSettings: '"lnum" 1' }} {...extra}>
      {THING[id].numeral}
    </text>
  );
  return (
    <g opacity={f3(a)}>
      <defs>
        <clipPath id={`${uid}c`}>
          <rect x={f3(x - w / 2)} y={f3(y0)} width={f3(w)} height={f3(Math.max(0, floor - y0))} />
        </clipPath>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(base - cap)} x2="0" y2={f3(base)}>
          <stop offset="0" stopColor={mixHex(COLOR.amberTop, COLOR.amberHot, 0.42)} />
          <stop offset="1" stopColor={COLOR.amberTop} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        <g transform={`translate(${f3(faceX)} 0) scale(${f3(faceW / w)} 1) translate(${f3(-x)} 0)`}>
        <g transform={`translate(${f3(5 / k)} ${f3(8 / k)})`} opacity={0.42} style={{ filter: `blur(${f3(7 / k)}px)` }}>
          {text(COLOR.shadow)}
        </g>
        {text(`url(#${uid}g)`, { style: { filter: bloomFilter(k), fontFeatureSettings: '"lnum" 1' } })}
        </g>
      </g>
    </g>
  );
};

const TwoThingsToCareAbout: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const look = CAM.at(f);
  const k = look.k;
  const band = amberBandFor(look);
  const cards = [
    { id: "science" as const, x: C1, i: 0 as const },
    { id: "nice" as const, x: C2, i: 1 as const },
  ];
  return (
    <BenchStage look={look} S={f} rest={CAM.rest}>
      {cards.map((c) => {
        const rise = riseOf(c.i, f);
        return (
          <g key={c.id}>
            <ThingCard id={c.id} x={c.x} floor={GROUND} w={CARD_W} k={k} flip={flipOf(c.i, f)} rise={rise} band={band} />
            <LiftedNumeral id={c.id} x={c.x} floor={GROUND} rise={rise} flip={flipOf(c.i, f)} a={numeralLiftOf(c.i, f)} k={k} />
            <EdgeLight x={c.x} floor={GROUND} rise={rise} a={edgeLightOf(c.i, f)} k={k} />
          </g>
        );
      })}
    </BenchStage>
  );
};

export default TwoThingsToCareAbout;
