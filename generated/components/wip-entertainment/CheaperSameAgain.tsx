// ---------------------------------------------------------------------------
// CheaperSameAgain (wip-entertainment, cut 34). Works in Progress style, the clip's messy variant (styles/works-in-progress.md;
// kit generated/components/kits/works-in-progress/wipShared.tsx; clip module ./messyShared.tsx; notes/COMMON.md).
// Opaque 1080x1920, 24 fps, 194 frames. Spans the two adjacent selected clips (jump cut in the edit at f103): one graphic.
//
// CHECK LINE: "As making films gets cheaper, studios just churn out copies of the same thing": with no sound, a fat stack
// of $100 bills beside a taped-on Despicable Me poster cuts thinner and thinner until a thin few are left, then photocopies
// of the poster cut in one after another, each rougher and numbered in red marker, until the copies bury the page.
//
// THE LINE: "Now as AI-generated content drives the cost of producing entertainment down even further, production
// companies are gonna double down even harder on what's already been done before."
// WORD -> FRAME (Whisper, often 0.2-0.4 s early: beats land ~4 frames later): Now -1 · as 3 · AI 8 · generated 15 ·
// content 25 · drives 33 · the 43 · cost 50 · of 54 · producing 58 · entertainment 63 · down 73 · even 81 · further 89 ·
// production 102 · companies 106 · are 116 · gonna 121 · double 124 · down 131 · even 134 · harder 145 · on 157 ·
// what's 164 · already 169 · been 174 · done 180 · before 183.
// DURATION: the slot 34.958 -> 43.042 s = 8.083 s x 24 = 194 frames (f0..f193).
//
// THE MOTION (revision 2, hard cuts: notes/REVISION_hardcut.md; the approved settled frame unchanged): nothing moves; every
// change is a hard cut on its word, and the frame lives through the paper grain only. Fixed camera at the approved settled
// framing (the old creep's last frame). f0: the poster (b&w, hand-cut, two pieces of tape, there with it) top left of
// centre, the fat stack of bills lying over its lower corner. The stack cuts to a thinner state at f37, 54, 67, 77, 93
// (drives / cost / entertainment / down / further: states 2, 4, 5, 7, 8 of the 8 baked), ending as the thin few; at f77 the
// red down-arrow is there, whole, just above the stack's right end, pointing down at it (buried by the copies later).
// From "production" the photocopies cut in one per word, each already at rest at its approved spot with its red number on
// it: f106, 110, 120, 128, 135, 138, 142, 149, 156, 161, 168, 173, 178, 184, 187 (copies 2..16; 15 copies, matching the
// approved heap), each a copy of the copy before (harder contrast, toner speckle, fog, skewed on its sheet). The heap
// covers the page above the caption bands and the money is a sliver under it. Hold f187-f193.
// No draw-on, write-on, boil, deal, slide, settle wobble or lift shadow.
// SPOT INK: red = the author's marker only (the down-arrow; the sequel numbers). No other colour.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt; raw copies in assets-src/wip-entertainment/35/; baked by
// scripts/clips/wip-entertainment/bake-35.py into public/wip-entertainment/cs_*):
// 35/money_stack_100_bills_whitebg.jpg -> https://commons.wikimedia.org/wiki/File:Money_-_Flickr_-_AMagill.jpg — CC BY 2.0 —
//   Andrew Magill from Boulder, USA (matte: Apple Vision fg; hand-cut by bake-roughcut.py; thinned in 8 states)
// 35/minions1_DespicableMe_2010.jpg -> https://image.tmdb.org/t/p/original/b1BT309QWjtFUlJPLmXmrcHOWEL.jpg
//   (https://www.themoviedb.org/movie/20352) — © Universal / Illumination; fair use (graded through a red-heavy channel mix
//   so the orange title stays light on the blue sky; the photocopies are generations of that print)
// No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";
import { MarkerStroke, MessyFilmLife, MessyPaper, RoughCutPrint, Scrawl, Tape, contactShadow, handArrow } from "./messyShared";

export const FPS = 24;
export const DURATION = 194;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// -- the camera: FIXED at the approved settled framing (the end of the v1 creep: k 0.955 -> 1 about screen y 600) --------
const FOCUS = 600;
const K0 = 0.955;
const camAt = runWipCamera(
  [
    { f: -24, x: 540, y: FOCUS + (960 - FOCUS) / K0, k: K0 },
    { f: DURATION + 20, x: 540, y: 960, k: 1, ease: "linear" },
  ],
  DURATION,
);
// The approved last frame's camera, used for every frame; the layout is in its screen px (screen -> world).
const SETTLED = camAt(DURATION - 1);
const wx = (sx: number) => SETTLED.x + (sx - 540) / SETTLED.k;
const wy = (sy: number) => SETTLED.y + (sy - 960) / SETTLED.k;
const ws = (s: number) => s / SETTLED.k;

// -- the poster ---------------------------------------------------------------------------------------------------------
const POSTER = { x: 440, y: 432, w: 480, rot: -2.4 }; // settled screen px; 2:3 photo window
const POSTER_ASPECT = 2 / 3;
const TAPES = [
  { x: 214, y: 98, w: 136, rot: -38, seed: "cs-tape-a" },
  { x: 668, y: 80, w: 124, rot: 31, seed: "cs-tape-b" },
];

// -- the stack of bills -------------------------------------------------------------------------------------------------
// cs_stack_<k>.png: the stack thinned k steps of 8 (bake-35.py). The PNG is 916 x 651; RoughCutPrint w 619.6 world px.
const STACK = { x: 600, y: 828, w: 700, aspect: 916 / 651, rot: -2 };
// hard cuts: [frame, state]
const STACK_CUTS: [number, number][] = [
  [37, 2],
  [54, 4],
  [67, 5],
  [77, 7],
  [93, 8],
];
const stackState = (frame: number) => STACK_CUTS.reduce((k, [f, s]) => (frame >= f ? s : k), 0);

const ARROW_AT = 77; // with the "down" step
const ARROW = handArrow({ x: 872, y: 612 }, { x: 880, y: 772 }, "cs-down", 36); // above the stack's right end, pointing down at it

// -- the photocopies ------------------------------------------------------------------------------------------------
// cs_copy_<n>.jpg: a sheet of copy paper (805 x 1155) with generation n of the poster on it (its 700 x 1050 print window at
// the centre, skewed and shifted a little). Copied at 100 %: the window is the poster's size, so the sheet is a bit bigger.
const SHEET_W = POSTER.w * (805 / 700);
const SHEET_ASPECT = 805 / 1155;
const SHEET_H = SHEET_W / SHEET_ASPECT;
type Copy = { n: number; x: number; y: number; rot: number; at: number; side: "l" | "r" };
// settled screen px (the approved heap); at = the hard cut that puts it there, number and all
const COPIES: Copy[] = [
  { n: 2, x: 590, y: 560, rot: 3.5, at: 106, side: "r" },
  { n: 3, x: 420, y: 545, rot: -4.5, at: 110, side: "l" },
  { n: 4, x: 610, y: 500, rot: 5, at: 120, side: "r" },
  { n: 5, x: 440, y: 630, rot: -3, at: 128, side: "l" },
  { n: 6, x: 580, y: 575, rot: -5.5, at: 135, side: "r" },
  { n: 7, x: 410, y: 490, rot: 6, at: 138, side: "l" },
  { n: 8, x: 660, y: 480, rot: -4, at: 142, side: "r" },
  { n: 9, x: 430, y: 655, rot: 4, at: 149, side: "l" },
  { n: 10, x: 640, y: 540, rot: -6, at: 156, side: "r" },
  { n: 11, x: 405, y: 600, rot: 5, at: 161, side: "l" },
  { n: 12, x: 540, y: 600, rot: 2, at: 168, side: "r" },
  { n: 13, x: 670, y: 470, rot: -5, at: 173, side: "r" },
  { n: 14, x: 410, y: 520, rot: 5, at: 178, side: "l" },
  { n: 15, x: 660, y: 560, rot: 3.5, at: 184, side: "r" },
  { n: 16, x: 470, y: 610, rot: -2.5, at: 187, side: "r" },
];
// the red sequel number: on the moon, right or left of Gru's head (share of the sheet), so a few stay readable in the heap
const NUM = { r: 0.66, l: 0.07, y: 0.15, size: 0.24 };
// numbers are frozen as they were on the approved last frame (no boil, every letter complete)
const NUM_FRAME = DURATION - 1;

const Photocopy: React.FC<{ c: Copy }> = ({ c }) => {
  const w = ws(SHEET_W);
  const h = ws(SHEET_H);
  return (
    <div style={{ position: "absolute", left: wx(c.x) - w / 2, top: wy(c.y) - h / 2, width: w, height: h, filter: contactShadow(0, 1.1) }}>
      <div style={{ position: "absolute", inset: 0, transform: `rotate(${c.rot}deg)` }}>
        <Img src={staticFile(`wip-entertainment/cs_copy_${c.n}.jpg`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "none" }} />
        <div style={{ position: "absolute", inset: 0, mixBlendMode: "multiply" }}>
          <Scrawl
            text={String(c.n)}
            x={w * NUM[c.side]}
            y={h * NUM.y}
            size={w * NUM.size}
            frame={NUM_FRAME}
            start={NUM_FRAME - 200}
            boil={0}
            rotate={-6 + ((c.n * 37) % 9) - 4}
            seed={`cs-num-${c.n}`}
          />
        </div>
      </div>
    </div>
  );
};

const CheaperSameAgain: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = SETTLED;
  const k = stackState(frame);
  return (
    <>
      <MessyFilmLife frame={frame}>
        <MessyPaper cam={cam} />
        <WipPlane cam={cam}>
          {/* the original: a b&w print of the 2010 poster, cut out by hand and taped on */}
          <RoughCutPrint
            src="wip-entertainment/cs_poster.jpg"
            rect
            x={wx(POSTER.x)}
            y={wy(POSTER.y)}
            w={ws(POSTER.w)}
            aspect={POSTER_ASPECT}
            rotate={POSTER.rot}
            border={[6, 18]}
            grain={0.07}
            seed="cs-poster"
          />
          {TAPES.map((t) => (
            <Tape key={t.seed} x={wx(t.x)} y={wy(t.y)} w={ws(t.w)} h={ws(46)} rotate={t.rot} seed={t.seed} />
          ))}
          {/* the stack as it is now */}
          <RoughCutPrint
            src={`wip-entertainment/cs_stack_${k}.png`}
            x={wx(STACK.x)}
            y={wy(STACK.y)}
            w={ws(STACK.w)}
            aspect={STACK.aspect}
            rotate={STACK.rot}
            grain={0.08}
            seed="cs-stack"
          />
        </WipPlane>
        {/* the author's down-arrow, cut in whole with the "down" step */}
        <WipPlane cam={cam} ink>
          {frame >= ARROW_AT
            ? ARROW.map((pts, i) => (
                <MarkerStroke
                  key={i}
                  points={pts.map((p) => ({ x: wx(p.x), y: wy(p.y) }))}
                  progress={1}
                  frame={ARROW_AT}
                  boil={0}
                  width={ws(14)}
                  seed={`cs-arrow${i}`}
                />
              ))
            : null}
        </WipPlane>
        {/* the copies, cut in on top of everything */}
        <WipPlane cam={cam}>{COPIES.map((c) => (frame >= c.at ? <Photocopy key={c.n} c={c} /> : null))}</WipPlane>
      </MessyFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default CheaperSameAgain;
