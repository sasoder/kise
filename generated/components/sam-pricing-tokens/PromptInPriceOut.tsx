// ---------------------------------------------------------------------------
// PromptInPriceOut (sam-pricing-tokens, cut 11). Cheeky Pint style (stout) (styles/cheeky-pint.md), the clip's shared
// world ./pricingShared (owned by this cut). Opaque 1080x1920, 23.976 fps, 71 frames. Palette B1.
//
// CHECK LINE: "You'd hand OpenAI a prompt and just get a price back: no tokens, no breakdown."
//
// THE LINE (Sam Altman): "(and) you're just gonna like give it a prompt, and we're gonna give you a price back."
// WORD -> FRAME (composition frames, Whisper onsets): you're 3 · just 9 · gonna 13 · like 17 · give 21 · it 26 · a 28 ·
//   PROMPT 30 · and 35 · we're 43 · gonna 50 · give 51 · you 54 · a 56 · PRICE 58 · BACK 62 · (on camera from f70).
// DURATION: the slot 11.470 -> 14.431 s (sequence frames 275 -> 346) = 2.961 s x 23.976 = 71 frames (f0..f70).
//
// THE MOTION: one continuous move, prompt in, bare price out. The shot opens close on the prompt: a cream two-row
// composer card (ink word-bars, a blinking caret after the last bar, the round send arrow; ~510 px wide at f0) hovering,
// tilted, over the OpenAI tile whose top edge and slot show at the bottom of the frame. The camera follows the card down
// (easing out from k 1.6 to ~1.0 so the tile takes it whole) as it levels and drops into the slot, fully in on "prompt"
// (f30). The tile takes the card with a soft settle (5 px, f28-44) while the light pool crosses the tile left to right
// (f30-46, the machine at work); from f36 the real price tag rises out of the same slot (slot joint, one object with the
// tile, one shadow), whole by f56: the amber $3.40 sticker is out by ~f47 and still by "price" (f58) / "back" (f62).
// It stands in the slot and sways to rest on its foot (a damped pendulum that never quite stops); no twine (the punched
// hole says "tag"). The camera rises and pushes in with it to CUT11_END_CAM (k 1.12): the tag is the subject at the
// end, the tile toned down below.
//   contacts: card's foot reaches the slot mouth f19 (level and centred: x 380-700 inside the slot's 368-712), card
//   fully in f30; tile press f28-44; tag's top at the slot mouth f36 (first visible f37); sticker fully out ~f47; tag
//   at rest f56; its sway (foot pivot) f53-70, never still.
// FRAMING: f0 the card at screen y ~700-910 (clear of the bands), the tile's top edge at ~1470 below the lower band;
//   f36-44 the tile whole at k ~1.0 (mark centre ~990, its lower edge dips into the upper band); f70 (CUT11_END_CAM) the
//   tag at screen y ~525-1140 (numerals ~75 px cap), the tile toned 0.7 toward board below it (in the caption bands:
//   context only).
// AMBER = the number the customer is shown or charged (here the price on the tag), nothing else; cream = the
// subject, board = context.
//
// SOURCES: the OpenAI blossom = macintoshShared Glyph "chatgpt" (Commons "OpenAI logo 2025 (symbol).svg"). The tag:
// the image agent's photo images/cutout_sources/pricetag_four_hanging_tags_blank_alt_unsplash.jpg (Unsplash; the kraft
// tag 2nd from left), baked by scripts/clips/sam-pricing-tokens/bake-tag.py into pricingData.ts. $3.40 is
// illustrative (COMMON), not a real OpenAI price.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, clamp01, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack, restToRest, type Glide } from "../kits/cheeky-pint/museShared";
import {
  CARD2,
  CUT11_END_CAM,
  CUT11_WORLD,
  OpenAISlotTile,
  PriceTag,
  PromptCard,
  TAG,
  TILE,
  caretAt,
  priceTagSil,
  promptCardSil,
  slotClip,
  slotGeom,
  StoutShadow,
  swingAt,
  type PriceTagProps,
} from "./pricingShared";

export const FPS = 24000 / 1001;
export const DURATION = 71;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the world -----------------------------------------------------------------------------------------------
const G = slotGeom(CUT11_WORLD.x, CUT11_WORLD.floor, TILE.size); // tile top 1126
const CLIP = slotClip(G.x, G.floor, TILE.size);

// --- the card: the two-row composer, already hovering close at f0, drops straight into the slot ----------------
const CARD_DROP = {
  /** centre at f0 (a little right of the slot, tilted) */
  x0: 575,
  y0: 705,
  /** centre when fully inside: its top 4 px under the slot mouth */
  y1: G.top + CARD2.h / 2 + 4,
  /** the drift already under way at f0 (Hermite start slope, in path units per drop) */
  v0: 0.35,
} as const;
const CARD_IN = 30; // fully in on "prompt"
const cardAt = (f: number) => {
  // a slow drift at f0, the drop, a soft seat at f30 (velocity -> 0 as it lands)
  const u = clamp01(f / CARD_IN);
  const t = 3 * u * u - 2 * u * u * u + CARD_DROP.v0 * (u * u * u - 2 * u * u + u);
  return {
    // level and centred over the slot before its foot reaches the mouth (t 0.72)
    x: G.x + (CARD_DROP.x0 - G.x) * (1 - smoothstep(t / 0.68)),
    y: CARD_DROP.y0 + (CARD_DROP.y1 - CARD_DROP.y0) * t,
    angle: -4 * (1 - smoothstep(t / 0.68)),
    lift: 1 - 0.7 * smoothstep((t - 0.62) / 0.38),
    // the caret blinks (on at f0, off f12-21, on again as it goes in)
    caret: caretAt(f, 22, 0.55),
    t,
  };
};

// --- the tile's settle ---------------------------------------------------------------------------------------------
const pressAt = (f: number) => 5 * smoothstep((f - 28) / 5) * (1 - smoothstep((f - 33) / 11));
const tileDimAt = (f: number) => 0.7 * smoothstep((f - 48) / 16);

// --- the tag: rises out of the slot (from f36, while the light crosses the tile), stands in it, sways ----------------
const RISE = { f0: 36, f1: 56 } as const;
const tagAt = (f: number): PriceTagProps => {
  const r = restToRest((f - RISE.f0) / (RISE.f1 - RISE.f0), 2.4);
  const press = pressAt(f);
  return {
    x: G.x,
    y: G.top + press + TAG.h * (1 - r),
    anchor: "foot",
    angle: swingAt(f, { f0: 53, amp: 1.6, period: 36, tau: 24, live: 0.22, livePeriod: 70 }),
    k: 1,
    string: "none",
    clip: { ...CLIP, h: CLIP.h + press },
  };
};

// --- the camera: close on the card, down with it into the slot (easing out to see the tile take it), then up and in
// on the tag to CUT11_END_CAM ----------------------------------------------------------------------------------------
const K0 = 1.6; // the card ~510 px wide at f0
const LOOK0 = { x: 540, y: 800 };
const FOLLOW: Glide = { f0: -6, f1: 40, k: 1.0, dy: 540 };
const GLIDES: Glide[] = [FOLLOW, { f0: 30, f1: 84, k: 1.16716, dy: -511.81 }];
const CAM = makeClockCam({ ...LOOK0, k: K0 }, GLIDES, DURATION);
// the light: on the card, down with it, then across the tile left to right (the machine at work, f30-44), up to the tag
const POOL = makePoolTrack({ x: CARD_DROP.x0, y: CARD_DROP.y0 }, [
  { f0: 0, f1: 22, x: 545, y: 1060 },
  { f0: 20, f1: 30, x: 360, y: 1240 },
  { f0: 30, f1: 42, x: 730, y: 1240 },
  { f0: 44, f1: 62, x: 540, y: 880 },
], DURATION);

/** A world region (above or below a y line), for splitting the card's one shadow at the tile's top edge. */
const Region: React.FC<{ id: string; above: boolean; y: number; children: React.ReactNode }> = ({ id, above, y, children }) => (
  <g>
    <defs>
      <clipPath id={id}>
        <rect x={-4000} y={above ? y - 8000 : y} width={9000} height={8000} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id})`}>{children}</g>
  </g>
);

const PromptInPriceOut: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const card = cardAt(S);
  const press = pressAt(S);
  const tag = { ...tagAt(S), k };
  const tagShown = S > RISE.f0;
  const cardShown = card.t < 1;
  const top = G.top + press;
  const cardClip = { ...CLIP, h: CLIP.h + press };
  const cardSil = { ...promptCardSil(card.x, card.y, CARD2.w, CARD2.h), tf: card.angle ? `rotate(${card.angle} ${card.x} ${card.y})` : undefined, clip: cardClip };
  // the card is in front of the tile's face: its one shadow falls on the board above the tile's top edge and on the
  // tile's face below it (split at the edge so it never darkens the card itself)
  const cardShadow = cardShown ? <StoutShadow parts={[cardSil]} elevation="rest" lift={card.lift} /> : null;
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={POOL(S)}>
      <OpenAISlotTile
        x={G.x}
        floor={G.floor}
        k={k}
        press={press}
        dim={tileDimAt(S)}
        extraSil={tagShown ? priceTagSil(tag) : []}
        occupant={tagShown ? TAG.w * smoothstep((S - RISE.f0) / 3) : 0}
      >
        {cardShown ? (
          <>
            <Region id="cardShadowBoard" above y={top}>
              {cardShadow}
            </Region>
            <PromptCard x={card.x} y={card.y} k={k} rows={2} caret={card.caret} angle={card.angle} lift={card.lift} clip={cardClip} shadow={false} />
          </>
        ) : null}
        {tagShown ? <PriceTag {...tag} shadow={false} /> : null}
      </OpenAISlotTile>
      {cardShown ? (
        <Region id="cardShadowTile" above={false} y={top}>
          {cardShadow}
        </Region>
      ) : null}
    </StoutStage>
  );
};

// world-match contract with cut 17 (pricingShared CUT11_*): assert at module load
{
  const c = CAM.at(DURATION - 1);
  if (Math.abs(c.k - CUT11_END_CAM.k) > 0.01 || Math.abs(c.y - CUT11_END_CAM.y) > 2 || Math.abs(c.x - CUT11_END_CAM.x) > 0.5) {
    throw new Error(`PromptInPriceOut: the resolved camera ${JSON.stringify(c)} drifted from CUT11_END_CAM`);
  }
}

export default PromptInPriceOut;
