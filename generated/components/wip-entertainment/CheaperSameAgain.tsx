// ---------------------------------------------------------------------------
// CheaperSameAgain (wip-entertainment, cut 35). Works in Progress style, the clip's messy variant (styles/works-in-progress.md;
// kit generated/components/kits/works-in-progress/wipShared.tsx; clip module ./messyShared.tsx; notes/COMMON.md).
// Opaque 1080x1920, 24 fps, 194 frames. Spans the two adjacent selected clips (jump cut in the edit at f103): one graphic.
//
// CHECK LINE: "As making films gets cheaper, studios just churn out copies of the same thing": with no sound, a fat stack
// of $100 bills beside a taped-on Despicable Me poster is pulled away a wad at a time until a thin few are left, then the
// poster is photocopied again and again, each copy rougher and numbered in red marker, until the copies bury the page.
//
// THE LINE: "Now as AI-generated content drives the cost of producing entertainment down even further, production
// companies are gonna double down even harder on what's already been done before."
// WORD -> FRAME (Whisper, often 0.2-0.4 s early: beats land ~4 frames later): Now -1 · as 3 · AI 8 · generated 15 ·
// content 25 · drives 33 · the 43 · cost 50 · of 54 · producing 58 · entertainment 63 · down 73 · even 81 · further 89 ·
// production 102 · companies 106 · are 116 · gonna 121 · double 124 · down 131 · even 134 · harder 145 · on 157 ·
// what's 164 · already 169 · been 174 · done 180 · before 183.
// DURATION: the slot 34.958 -> 43.042 s = 8.083 s x 24 = 194 frames (f0..f193).
//
// THE MOTION: one continuous motion, money goes out and copies come in, under one slow creep in (k 0.955 -> ~0.99 about
// screen y 600). f0: the poster (b&w, hand-cut, two pieces of tape) top left of centre, the fat stack of bills lying over
// its lower corner. From "AI" the stack is thinned in eight pulls: each time the top bill and the few under it slide off
// together as one wad along the bills' long axis, out of frame (alternately left and right, on twos), and the stack under
// them is a little lower; on "down" the red marker draws a down-arrow just above its right end, pointing down at it (buried by the copies later). From "production" photocopies of the
// poster are dealt onto it by hand, on twos, faster and faster (landing every 10 frames, then every 4-5 on "double down
// even harder"), each a copy of the copy before (harder contrast, toner speckle, fog, skewed on its sheet) and each
// numbered 2, 3, 4 ... 16 in red marker on the moon as it lands, until the heap covers the page above the caption bands
// and the money is a sliver under it. Settled, living frame from f187 (grain, the numbers' boil, the creep).
// Contact frames: wads first move f6, 16, 26, 36, 46, 56, 66, 75 (the stack drops on that frame, the wad covering the
// change), each gone by +12. Arrow shaft f74-f83, barbs f83-f90. Copies land (dealIn `landed`) f108, 118, 126, 133, 139,
// 144, 148, 152, 156, 160, 164, 168, 172, 176, 180; each number written from its copy's landing frame.
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
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";
import {
  MarkerStroke,
  MessyFilmLife,
  MessyPaper,
  RoughCutPrint,
  Scrawl,
  Tape,
  contactShadow,
  dealIn,
  drawT,
  handArrow,
  onTwos,
} from "./messyShared";

export const FPS = 24;
export const DURATION = 194;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// -- the camera: one slow creep in about the page's middle (screen y FOCUS), already running at f0 ----------------------
const FOCUS = 600;
const K0 = 0.955;
const camAt = runWipCamera(
  [
    { f: -24, x: 540, y: FOCUS + (960 - FOCUS) / K0, k: K0 },
    { f: DURATION + 20, x: 540, y: 960, k: 1, ease: "linear" },
  ],
  DURATION,
);
// The layout is solved in the screen px of the last frame (screen -> world).
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
// cs_stack_<k>.png: the stack after k pulls (0..8); cs_chunk_<k>.png: the wad that slides off in pull k (state k-1 above
// the new seam). Same canvas, so they sit on one another exactly. The PNG is 916 x 651; RoughCutPrint w 619.6 world px.
const STACK = { x: 600, y: 828, w: 700, aspect: 916 / 651, rot: -2 };
const AXIS = ((13.5 + STACK.rot) * Math.PI) / 180; // the bills' long axis on screen (measured on the cut: ~13.5 deg)
const PULL_DUR = 12;
const PULLS = [6, 16, 26, 36, 46, 56, 66, 75]; // pull k+1 starts here
const PULL_DIST = 1150; // along the axis: far enough that the whole wad and its shadow leave the frame

const stackState = (frame: number) => PULLS.filter((p) => onTwos(frame) >= p).length;

// A wad pulled off by hand, on twos: it starts slowly (the fingers drag it), speeds up and leaves the frame.
const wadPose = (frame: number, k: number) => {
  const start = PULLS[k - 1];
  const f = onTwos(frame);
  if (f < start || f > start + PULL_DUR) return null;
  const t = interpolate(f, [start, start + PULL_DUR], [0, 1], { ...clamp, easing: Easing.bezier(0.55, 0, 0.75, 0.6) });
  const dir = k % 2 ? -1 : 1; // odd pulls go left (up along the axis), even ones right
  const d = PULL_DIST * t * dir;
  return {
    dx: Math.cos(AXIS) * d,
    dy: Math.sin(AXIS) * d - 10 * Math.sin(Math.PI * Math.min(1, t * 2.5)),
    rot: dir * 4 * t,
    lift: Math.min(1, t * 4) * 0.55,
  };
};

const ARROW = handArrow({ x: 872, y: 612 }, { x: 880, y: 772 }, "cs-down", 36); // above the stack's right end, pointing down at it

// -- the photocopies ------------------------------------------------------------------------------------------------
// cs_copy_<n>.jpg: a sheet of copy paper (805 x 1155) with generation n of the poster on it (its 700 x 1050 print window at
// the centre, skewed and shifted a little). Copied at 100 %: the window is the poster's size, so the sheet is a bit bigger.
const SHEET_W = POSTER.w * (805 / 700);
const SHEET_ASPECT = 805 / 1155;
const SHEET_H = SHEET_W / SHEET_ASPECT;
type Copy = { n: number; x: number; y: number; rot: number; from: { x: number; y: number }; fromRot: number; deal: number; dur: number; side: "l" | "r" };
// settled screen px; deal = the first frame of the deal; landed = deal + dur
const COPIES: Copy[] = [
  { n: 2, x: 590, y: 560, rot: 3.5, from: { x: 760, y: -700 }, fromRot: 14, deal: 96, dur: 12, side: "r" },
  { n: 3, x: 420, y: 545, rot: -4.5, from: { x: -820, y: -80 }, fromRot: -12, deal: 108, dur: 10, side: "l" },
  { n: 4, x: 610, y: 500, rot: 5, from: { x: 820, y: 60 }, fromRot: 13, deal: 118, dur: 8, side: "r" },
  { n: 5, x: 440, y: 630, rot: -3, from: { x: 120, y: -1150 }, fromRot: -8, deal: 125, dur: 8, side: "l" },
  { n: 6, x: 580, y: 575, rot: -5.5, from: { x: -840, y: 120 }, fromRot: -15, deal: 133, dur: 6, side: "r" },
  { n: 7, x: 410, y: 490, rot: 6, from: { x: 880, y: -300 }, fromRot: 15, deal: 138, dur: 6, side: "l" },
  { n: 8, x: 660, y: 480, rot: -4, from: { x: 780, y: -760 }, fromRot: -12, deal: 142, dur: 6, side: "r" },
  { n: 9, x: 430, y: 655, rot: 4, from: { x: -840, y: -60 }, fromRot: 12, deal: 147, dur: 5, side: "l" },
  { n: 10, x: 640, y: 540, rot: -6, from: { x: 820, y: 100 }, fromRot: -16, deal: 151, dur: 5, side: "r" },
  { n: 11, x: 405, y: 600, rot: 5, from: { x: -820, y: -200 }, fromRot: 13, deal: 155, dur: 5, side: "l" },
  { n: 12, x: 540, y: 600, rot: 2, from: { x: 200, y: -1200 }, fromRot: 10, deal: 159, dur: 5, side: "r" },
  { n: 13, x: 670, y: 470, rot: -5, from: { x: 840, y: -200 }, fromRot: -14, deal: 163, dur: 5, side: "r" },
  { n: 14, x: 410, y: 520, rot: 5, from: { x: -840, y: 60 }, fromRot: 14, deal: 167, dur: 5, side: "l" },
  { n: 15, x: 660, y: 560, rot: 3.5, from: { x: 600, y: -1050 }, fromRot: -10, deal: 172, dur: 4, side: "r" },
  { n: 16, x: 470, y: 610, rot: -2.5, from: { x: -780, y: -520 }, fromRot: 12, deal: 176, dur: 4, side: "r" },
];
// the red sequel number: on the moon, right or left of Gru's head (share of the sheet), so a few stay readable in the heap
const NUM = { r: 0.66, l: 0.07, y: 0.15, size: 0.24 };

const Photocopy: React.FC<{ c: Copy; frame: number }> = ({ c, frame }) => {
  const d = dealIn(frame, { start: c.deal, dur: c.dur, from: { x: ws(c.from.x), y: ws(c.from.y) }, rot: c.fromRot, wobble: 1.2, settle: 6 });
  const w = ws(SHEET_W);
  const h = ws(SHEET_H);
  const x = wx(c.x) + d.dx;
  const y = wy(c.y) + d.dy;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, filter: contactShadow(d.lift, 1.1) }}>
      <div style={{ position: "absolute", inset: 0, transform: `rotate(${c.rot + d.rot}deg)` }}>
        <Img src={staticFile(`wip-entertainment/cs_copy_${c.n}.jpg`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", maxWidth: "none" }} />
        <div style={{ position: "absolute", inset: 0, mixBlendMode: "multiply" }}>
          <Scrawl
            text={String(c.n)}
            x={w * NUM[c.side]}
            y={h * NUM.y}
            size={w * NUM.size}
            frame={frame}
            start={d.landed}
            perLetter={2}
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
  const cam = camAt(frame);
  const k = stackState(frame);
  const stackProps = { x: wx(STACK.x), y: wy(STACK.y), w: ws(STACK.w), aspect: STACK.aspect, rotate: STACK.rot, grain: 0.08, seed: "cs-stack" };
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
          {/* the stack as it is now, and the wad leaving it */}
          <RoughCutPrint src={`wip-entertainment/cs_stack_${k}.png`} {...stackProps} />
        </WipPlane>
        {/* the author's down-arrow beside the money, on "down" */}
        <WipPlane cam={cam} ink>
          {ARROW.map((pts, i) => (
            <MarkerStroke
              key={i}
              points={pts.map((p) => ({ x: wx(p.x), y: wy(p.y) }))}
              progress={i === 0 ? drawT(frame, 74, 83) : drawT(frame, 83 + (i - 1) * 3, 87 + (i - 1) * 3)}
              frame={frame}
              width={ws(14)}
              seed={`cs-arrow${i}`}
            />
          ))}
        </WipPlane>
        {/* the wads in flight: lifted off the stack, so they pass over the marker */}
        <WipPlane cam={cam}>
          {PULLS.map((_, i) => {
            const p = wadPose(frame, i + 1);
            return p ? (
              <RoughCutPrint
                key={i}
                src={`wip-entertainment/cs_chunk_${i + 1}.png`}
                {...stackProps}
                x={stackProps.x + ws(p.dx)}
                y={stackProps.y + ws(p.dy)}
                rotate={STACK.rot + p.rot}
                lift={p.lift}
              />
            ) : null;
          })}
        </WipPlane>
        {/* the copies, dealt on top of everything */}
        <WipPlane cam={cam}>
          {COPIES.map((c) => (onTwos(frame) >= c.deal ? <Photocopy key={c.n} c={c} frame={frame} /> : null))}
        </WipPlane>
      </MessyFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default CheaperSameAgain;
