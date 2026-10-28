// ---------------------------------------------------------------------------
// CantImagineLifeWithout (sam-macintosh-moment, cut 16). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 98 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "people talk about Codex and ChatGPT as things they love and can't do without".
//
// THE LINE (Sam Altman): "…In a way that when people talk about coding agents or even ChatGPT, they do say."
// (the "say" = "I cannot imagine my life without this thing", said just before.)
// WORD -> FRAME: In f0 · way f4 · when f12 · people f15 · talk f20 · about f25 · coding f31 · agents f39 · or f46 ·
// even f55 · ChatGPT f61 · they f77 · do f81 · say f84 · (word ends ~f90).
// DURATION: the slot 16.225 -> 20.312 s = 4.087 s x 23.976 = 98 frames (f0..f97). Hard cut back to the speaker.
//
// THE MOTION: a row of five picture-book people (macintoshShared busts, the cabinCast look) chatting on the stout
// board. Each cream speech bubble grows out of its tail's tip just above its speaker's head (from 38 % of its size,
// fading up over 4 f: never a speck) and lifts into place (weighty, floating, then settling to lifted), one after
// another left to right; nothing passes a face; every tail ends just above its own speaker's head. A talking
// bob runs on each speaker while their bubble rises. On "coding agents" the Codex mark slides up into the two left
// bubbles with the name "CODEX" under it (landed f27 / f29), on "even ChatGPT" the blossom and "CHATGPT" into the
// three right ones, which are already
// waiting (landed f60-62.5, visibly from ~f57). On "they do say" each mark eases left and an amber heart comes in beside it, in
// one wave left to right (landed f78-84), and the people smile. The camera drifts left -> right along the row from
// f0 (a little close on the Codex people) and eases out to a settled frame holding all five and every bubble, then
// creeps (k 1.11 -> 1.04, heads ~y 760-955, bubbles ~y 265-745); living hold: idle head bobs, blinks, bubbles' float drift, grain.
// TEXT: only the product names (FONT_LABEL caps, inkDark, ~32 px on screen): at 270 px the Codex mark alone read as
// an unknown blob (review 2). The heart is ~80-90 % of the mark's height.
// HEART vs AMBER FILL: the heart (beside the mark, inside the cream bubble) — "Codex ❤" reads instantly as "loved"
// at 270 px; a bubble filled amber read only as "highlighted".
// AMBER = what makes an AI product indispensable (COMMON.md): here the love for Codex / ChatGPT. Nothing else glows.
// CAUSE: each bubble's mark enters after the bubble has risen (its speaker is still mid-bob); hearts are the same
// "typed into the message" entrance as the marks.
//
// SOURCES: Codex = the 2025-26 Codex app icon (lobehub icons codex.svg, mark (c) OpenAI); ChatGPT = the OpenAI
// blossom (Commons "File:OpenAI logo 2025 (symbol).svg"; chatgpt.com uses it as the "ChatGPT blossom logo").
// Both from images/logos/LOGOS_READY.md, inlined in macintoshShared.tsx. No figures; text = the two product names.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, clamp01, lerp, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam } from "../kits/cheeky-pint/museShared";
import { Bust, CROWD, CrowdShadow, SpeechBubble, blinkAt, type MarkId } from "./macintoshShared";

export const FPS = 24000 / 1001;
export const DURATION = 98;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// THE WORLD (world px; the settled frame is ~k 1.04 centred on x 540)
// ---------------------------------------------------------------------------
const HEAD_R = 80;
/** facing pairs stand wider apart than back-to-back neighbours (noses never meet): 0 > < 1   2 > < 3   4 > */
const XS = [135, 375, 540, 780, 945];
const FACING: (-1 | 1)[] = [1, -1, 1, -1, 1];
/** the five speakers: x, head-centre y (a little height variation), CROWD[i] (person 4 turned to face right) */
export const PEOPLE = [0, 1, 2, 3, 4].map((i) => ({
  x: XS[i],
  y: [978, 964, 982, 968, 976][i],
  r: HEAD_R,
  spec: CROWD[i],
  facing: FACING[i],
}));
/** the lowest readable thing (the lowest chin) — kept above the caption band on every camera */
const CHIN_Y = Math.max(...PEOPLE.map((p) => p.y + p.r));
const BW = 256;
const BH = 200;
const UPPER_Y = 498;
const LOWER_Y = 712;
/** the mark's tile (optical rule: Codex ~92, the blossom ~106 world px), the heart (~83 tall: 80-90 % of the mark),
 *  the product name (FONT_LABEL caps, ~32 px on screen at the rest k ~1.04) */
const MARK_TILE = 140;
const HEART_W = 96;
const NAME_PX = 31;
const NAME: Record<MarkId, string> = { codex: "Codex", chatgpt: "ChatGPT", dots: "dots" };
type BubbleSpec = { x: number; y: number; tip: [number, number]; root: number; mark: MarkId; rise0: number; mark0: number; heart0: number };
/** bubble i belongs to person i; upper tier 0 / 2 / 4, lower tier 1 / 3 (a honeycomb). Each bubble GROWS out of its
 *  tail's tip (above its speaker's head) and lifts into place: scaled about the tip, so the body rises out of the
 *  point. An upper bubble's tip sits in the middle of the gap between the lower bubbles, so while it is still small
 *  it passes up through the gap and never crosses a neighbour, a face or the crowd. */
export const BUBBLE_SIZE = { w: 256, h: 200 };
export const BUBBLES: BubbleSpec[] = [
  { x: 181, y: UPPER_Y, root: 4, tip: [186, 846], mark: "codex", rise0: -17, mark0: 19, heart0: 69 },
  { x: 357, y: LOWER_Y, root: -20, tip: [330, 864], mark: "codex", rise0: -3, mark0: 21, heart0: 70.5 },
  { x: 540, y: UPPER_Y, root: 4, tip: [550, 842], mark: "chatgpt", rise0: 8, mark0: 52, heart0: 72 },
  { x: 723, y: LOWER_Y, root: -18, tip: [700, 864], mark: "chatgpt", rise0: 19, mark0: 53.5, heart0: 73.5 },
  { x: 899, y: UPPER_Y, root: 8, tip: [926, 846], mark: "chatgpt", rise0: 27, mark0: 54.5, heart0: 75 },
];
export const RISE_F = 24; // frames a bubble's grow-and-lift takes
const MARK_F = 8; // frames a mark's entrance takes (ChatGPT lands f60 / f61.5 / f62.5, visibly from ~f57)
const HEART_F = 9; // frames a heart's entrance takes

/** the rise: weighty — a soft start, a long damped settle, no overshoot */
const riseEase = (u: number) => {
  const c = clamp01(u);
  return lerp(smoothstep(c), 1 - Math.pow(1 - c, 3.2), 0.55);
};
/** a bubble starts at GROW_FROM of its size at its tail's tip (never a speck) and fades up over FADE_F frames */
const GROW_FROM = 0.38;
const FADE_F = 4;
const bubbleAt = (b: BubbleSpec, i: number, f: number) => {
  const u = (f - b.rise0) / RISE_F;
  // a slow float drift once it has settled (seeded phase), the living hold
  const drift = 2.2 * Math.sin((f + i * 23) / 13) * smoothstep((f - b.rise0 - RISE_F * 0.6) / 14);
  return {
    /** the grow about the tail's tip, GROW_FROM .. 1 */
    s: lerp(GROW_FROM, 1, riseEase(u)),
    opacity: smoothstep((f - b.rise0) / FADE_F),
    drift,
    // floating while it grows and lifts, settling to lifted as it lands
    lift: 1 - smoothstep((u - 0.55) / 0.45),
    markIn: (f - b.mark0) / MARK_F,
    heartIn: (f - b.heart0) / HEART_F,
    visible: u > 0,
  };
};

// ---------------------------------------------------------------------------
// THE PEOPLE — a talking bob while their bubble rises, idle life after, a smile when the heart lands
// ---------------------------------------------------------------------------
const poseAt = (i: number, f: number) => {
  const b = BUBBLES[i];
  const talk = smoothstep((f - b.rise0 + 6) / 6) * (1 - smoothstep((f - b.rise0 - RISE_F - 4) / 10));
  const talkBob = 3.4 * Math.sin(((f - b.rise0) / 4.2) * Math.PI) * talk;
  const idle = 1.4 * Math.sin((f + i * 17) / 11.5);
  const love = smoothstep((f - b.heart0 - 2) / 10);
  return {
    bob: Math.max(0, talkBob) + idle + 2.5 * love,
    tilt: 2.2 * talk * Math.sin(((f - b.rise0) / 8.4) * Math.PI) + 4 * love,
    smile: lerp(0.25 + 0.35 * talk, 1, love),
    content: i === 1 || i === 3 ? love : 0,
    blink: i === 1 || i === 3 ? (love > 0.05 ? 0 : blinkAt(i, f)) : blinkAt(i, f),
  };
};

// ---------------------------------------------------------------------------
// CAMERA — x and k on the house damped follower; y derived from k so the chins never reach the caption band
// ---------------------------------------------------------------------------
const XK = makeClockCam(
  { x: 430, y: 960, k: 1.12 },
  [
    // the drift along the row, easing out to the settled frame of all five
    { f0: -24, f1: 54, dx: 110, k: 1.04 },
    // the creep through the hold
    { f0: 54, f1: 150, dx: 4, k: 1.052 },
  ],
  DURATION,
);
const CHIN_SCREEN = 955; // where the lowest chin sits on screen (heads ~y 760-955, well above the band at 1080)
export const camAt = (f: number) => {
  const c = XK.at(f);
  return { x: c.x, y: CHIN_Y - (CHIN_SCREEN - 960) / c.k, k: c.k };
};

const CantImagineLifeWithout: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const bubbles = BUBBLES.map((b, i) => ({ b, s: bubbleAt(b, i, S) }));
  return (
    <StoutStage S={S} cam={cam} rest={camAt(0)} pool={{ x: cam.x, y: 760, strength: 1.25 }}>
      {/* the crowd: one shadow layer, then the busts left to right */}
      <CrowdShadow busts={PEOPLE} />
      {PEOPLE.map((p, i) => (
        <Bust key={i} x={p.x} y={p.y} r={p.r} spec={p.spec} facing={p.facing} pose={poseAt(i, S)} />
      ))}
      {/* the bubbles, each grown out of its tail's tip above its speaker (upper tier behind the lower tier) */}
      {[0, 2, 4, 1, 3].map((i) => {
        const { b, s } = bubbles[i];
        if (!s.visible) return null;
        const [tx, ty] = b.tip;
        return (
          <g key={i} opacity={s.opacity < 0.999 ? s.opacity : undefined} transform={`translate(${tx} ${ty + s.drift}) scale(${s.s}) translate(${-tx} ${-ty})`}>
            <SpeechBubble
              x={b.x}
              y={b.y}
              w={BW}
              h={BH}
              tail={{ root: b.root, tip: b.tip, width: b.y === UPPER_Y ? 58 : 46 }}
              k={k}
              mark={b.mark}
              markIn={s.markIn}
              heartIn={s.heartIn}
              label={NAME[b.mark]}
              labelPx={NAME_PX}
              markSize={MARK_TILE}
              heartW={HEART_W}
              elevation="lifted"
              lift={s.lift}
            />
          </g>
        );
      })}
    </StoutStage>
  );
};

export default CantImagineLifeWithout;
