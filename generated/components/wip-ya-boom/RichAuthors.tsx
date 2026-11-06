// ---------------------------------------------------------------------------
// RichAuthors (wip-ya-boom, cut 21). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx) with the clip's materials (./yaShared.tsx).
// Opaque 1080x1920, 24 fps, 217 frames.
//
// CHECK LINE: "three YA authors got enormously rich: Rowling a billion, Meyer 100 million copies of four books, Collins $55
// million in a single year".
//
// THE LINE: "J.K. Rowling became the first billionaire author. Stephenie Meyer sold over 100 million copies of just four
// books. In just one year, Suzanne Collins made an estimated 55 million."
// WORD -> FRAME: J -1 · K 2 · Rowling 7 · became 13 · the 19 · first 23 · billionaire 28 · author 38 · Stephenie 53 · Meyer 59 ·
// sold 68 · over 73 · 100 82 · million 90 · copies 99 · of 109 · just 115 · four 118 · books 124 · In 136 · just 138 · one 142 ·
// year 146 · Suzanne 152 · Collins 159 · made 169 · an 176 · estimated 180 · 55 188 · million 198 · (But 216)
// DURATION: the slot 21.500 -> 30.542 s = 9.0417 s x 24 = 217 frames (f0..f216).
//
// THE MOTION: one scrapbook page and one camera that travels steadily down it, a little slower over each marker beat and a
// little quicker between the blocks, settling into a creep on the last block. Each author is pasted as the camera arrives:
// Rowling's photocopy cut-out slapped down and taped, "$1B" in red felt-tip beside her with a quick underline; Meyer's cut-out,
// "100M" with a small mono "copies", then the four Twilight covers dealt in a crooked overlapping row under her; Collins'
// cut-out with the Hunger Games cover beside her, "$55M" under the cover and a mono "2012-13". The end holds on Collins' block,
// the bottom of Meyer's covers still in view above.
// Contact frames: Rowling 6, lowered onto the page from f-4 (label rises 7); Meyer 52 (label 53); Twilight 100, New Moon 106, Eclipse 112, Breaking Dawn 118;
// Collins 149, sliding in from the right from f131 (label 150); The Hunger Games 154. Felt-tip: "$1B" 24-33, underline 34-40; "100M" 80-90, "copies" rises 94;
// "$55M" 184-194, "2012-13" rises 196.
// SPOT INK: red = the editor's felt-tip, the money and the count. No indigo, no real colour.
//
// SOURCES (facts verified by the director, animation_source/notes/COMMON.md): Rowling the first billionaire author (Forbes
// billionaires list 2004); Meyer's Twilight saga, four books (Twilight 2005, New Moon 2006, Eclipse 2007, Breaking Dawn 2008),
// over 100 million copies; Collins est. $55 million, Forbes top-earning authors June 2012 - June 2013. Photos and covers:
// animation_source/assets_raw/ + SOURCES.txt, baked by scripts/clips/wip-ya-boom/bake-RichAuthors.py.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, PaperGround, WipCam, WipFilmLife, WipPlane } from "../kits/works-in-progress/wipShared";
import { MarkerPath, MarkerText, MonoLabel, THEME, TapeSpec, XeroxCutOut, slapDown } from "./yaShared";

export const FPS = 24;
export const DURATION = 217;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// -- the camera: one descent, integrated from a smooth speed curve (world px per frame) ------------------------------------
// About 7-9.5 px a frame through Rowling's block, 6.5-9.5 over Meyer's "100M" and covers, up to 16.5 between Meyer's covers
// and Collins (f128), then easing into a creep of 0.5-0.7 px a frame on Collins' block.
const SPEED_KEYS: [number, number][] = [
  [-10, 8.0],
  [29, 7.0],
  [52, 9.5],
  [85, 6.5],
  [106, 9.5],
  [128, 16.5],
  [150, 3.0],
  [168, 0.7],
  [216, 0.5],
];
const speedAt = (f: number) => {
  if (f <= SPEED_KEYS[0][0]) return SPEED_KEYS[0][1];
  for (let i = 1; i < SPEED_KEYS.length; i++) {
    const [b, vb] = SPEED_KEYS[i];
    if (f <= b) {
      const [a, va] = SPEED_KEYS[i - 1];
      const u = (f - a) / (b - a);
      return va + (vb - va) * u * u * (3 - 2 * u);
    }
  }
  return SPEED_KEYS[SPEED_KEYS.length - 1][1];
};
// the travel at every whole frame from f0 (8 sub-steps per frame), so travel(0) = 0
const TRAVEL: number[] = (() => {
  const out: number[] = [0];
  let y = 0;
  for (let f = 0; f < DURATION + 1; f++) {
    for (let i = 0; i < 8; i++) y += speedAt(f + (i + 0.5) / 8) / 8;
    out.push(y);
  }
  return out;
})();
const travelAt = (f: number) => {
  const c = Math.max(0, Math.min(DURATION, f));
  const lo = Math.floor(c);
  const hi = Math.min(TRAVEL.length - 1, lo + 1);
  return TRAVEL[lo] + (TRAVEL[hi] - TRAVEL[lo]) * (c - lo);
};
const TOTAL = TRAVEL[DURATION];
// the paper sheet is centred on the middle of the descent, so its slack covers both ends
const camAt = (f: number): WipCam => ({ x: 540, y: 960 + travelAt(f), k: 1, x0: 540, y0: 960 + TOTAL / 2 });

// -- the page (world px; at k 1 a thing's screen y = its world y - travel) ------------------------------------------------------
// Everything hangs off BASE, Rowling's centre: screen y 1000 when she touches the page (f6). On screen, with this camera:
// Rowling's centre 1046 at f0, 1000 at f6; "$1B" 683 at f29; Meyer's centre 1064 at f52; "100M" 840 at f85; the covers'
// centre 1038 at f100 and 858 at f118; Collins' centre 1019 at f149, 954 at the end, her head over the covers' bottoms. Each lands
// as low as its face (or a cover's title) can sit above the first caption band. Faces, labels,
// figures and cover titles land above y 1080 and only ride up, so none ever crosses a caption band; torsos and the covers'
// lower halves run down through the bands.
const BASE = 1000 + travelAt(6);
const ROWLING = { src: "wip-ya-boom/ra_rowling.png", aspect: 934 / 1129 };
const MEYER = { src: "wip-ya-boom/ra_meyer.png", aspect: 1140 / 1400 };
const COLLINS = { src: "wip-ya-boom/ra_collins.png", aspect: 1122 / 1400 };
const PORTRAIT_H = 720;
// Rowling's and Meyer's names sit over their heads (under a head every label would land in a caption band and ride up through
// it); Collins' heads her column beside her, since her head tucks over the bottoms of Meyer's covers
const LABEL_UP = PORTRAIT_H / 2 + 45;

// zigzag down the page: Rowling right with "$1B" left, Meyer left with "100M" right, Collins right with her name, "$55M" and
// her cover left
const R = { x: 730, y: BASE, rot: -3, contact: 6 };
const M = { x: 330, y: BASE + 420, rot: 2.5, contact: 52 };
const C = { x: 750, y: BASE + 1305, rot: 2, contact: 149 };

const COVER_W = 240;
const COVER_ASPECT = 1695 / 2560;
const COVERS_Y = BASE + 768;
const TWILIGHT = [
  { src: "wip-ya-boom/ra_twilight.png", x: 165, y: COVERS_Y - 8, rot: -6, contact: 100, tape: ["tl"] as TapeSpec[] },
  { src: "wip-ya-boom/ra_newmoon.png", x: 385, y: COVERS_Y + 10, rot: 3, contact: 106, tape: [] as TapeSpec[] },
  { src: "wip-ya-boom/ra_eclipse.png", x: 605, y: COVERS_Y - 6, rot: -2.5, contact: 112, tape: [] as TapeSpec[] },
  { src: "wip-ya-boom/ra_breakingdawn.png", x: 825, y: COVERS_Y + 12, rot: 5, contact: 118, tape: ["tr"] as TapeSpec[] },
];
// Collins' column, left of her: her name, "$55M", "2012-13", then the cover (its title clear of the bands when it lands)
const HG_W = 290;
const HG = { src: "wip-ya-boom/ra_hungergames.png", x: 300, y: BASE + 1305 - 50 + HG_W / (793 / 1200) / 2, w: HG_W, aspect: 793 / 1200, rot: -3, contact: 154 };

const RichAuthors: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const rw = PORTRAIT_H * ROWLING.aspect;
  const mw = PORTRAIT_H * MEYER.aspect;
  const cw = PORTRAIT_H * COLLINS.aspect;
  return (
    <>
      <WipFilmLife frame={frame} theme={THEME}>
        <PaperGround cam={cam} theme={THEME} />
        {/* the pastes, in the order they land: later ones cover earlier ones */}
        <WipPlane cam={cam}>
          <XeroxCutOut
            src={ROWLING.src}
            kind="person"
            x={R.x}
            y={R.y}
            w={rw}
            aspect={ROWLING.aspect}
            rotate={R.rot}
            gamma={1.9}
            contrast={0.5}
            tape={[{ at: "l", along: 0.84, len: 110 }, { at: "r", along: 0.8, len: 110 }]}
            slap={slapDown(frame, R.contact, { from: { x: 40, y: -80 }, dur: 10, spin: -4, drop: 0.12 })}
            seed="ra-rowling"
          />
          <XeroxCutOut
            src={MEYER.src}
            kind="person"
            x={M.x}
            y={M.y}
            w={mw}
            aspect={MEYER.aspect}
            rotate={M.rot}
            gamma={1.15}
            tape={[{ at: "l", along: 0.8, len: 110 }, { at: "r", along: 0.86, len: 110 }]}
            slap={slapDown(frame, M.contact, { from: { x: -900, y: -240 }, spin: -8 })}
            seed="ra-meyer"
          />
          {TWILIGHT.map((c, i) => (
            <XeroxCutOut
              key={c.src}
              src={c.src}
              kind="cover"
              x={c.x}
              y={c.y}
              w={COVER_W}
              aspect={COVER_ASPECT}
              rotate={c.rot}
              skew={i % 2 ? -0.8 : 0.6}
              tape={c.tape}
              slap={slapDown(frame, c.contact, { from: { x: 1000 - c.x + 300, y: 70 }, dur: 8, spin: 10 })}
              seed={`ra-tw${i}`}
            />
          ))}
          <XeroxCutOut
            src={COLLINS.src}
            kind="person"
            x={C.x}
            y={C.y}
            w={cw}
            aspect={COLLINS.aspect}
            rotate={C.rot}
            gamma={1.5}
            contrast={0.55}
            tape={[{ at: "r", along: 0.82, len: 110 }]}
            slap={slapDown(frame, C.contact, { from: { x: 940, y: -240 }, dur: 18, spin: 8 })}
            seed="ra-collins"
          />
          <XeroxCutOut
            src={HG.src}
            kind="cover"
            x={HG.x}
            y={HG.y}
            w={HG.w}
            aspect={HG.aspect}
            rotate={HG.rot}
            skew={-0.8}
            tape={["tr", "bl"]}
            slap={slapDown(frame, HG.contact, { from: { x: -820, y: -120 }, spin: -9 })}
            seed="ra-hg"
          />
        </WipPlane>
        {/* the name labels over the heads, with the pastes */}
        <WipPlane cam={cam}>
          <MonoLabel text="J.K. Rowling" x={R.x - 10} y={R.y - LABEL_UP} align="center" size={38} frame={frame} start={R.contact + 1} />
          <MonoLabel text="Stephenie Meyer" x={M.x - 70} y={M.y - LABEL_UP} align="center" size={38} frame={frame} start={M.contact + 1} />
          <MonoLabel text="copies" x={785} y={M.y + 110} align="center" size={42} frame={frame} start={94} />
          <MonoLabel text="Suzanne Collins" x={290} y={C.y - 326} align="center" size={38} frame={frame} start={C.contact + 1} />
          <MonoLabel text="2012-13" x={268} y={C.y - 100} align="center" size={40} frame={frame} start={196} />
        </WipPlane>
        {/* the red felt-tip */}
        <WipPlane cam={cam} ink>
          <MarkerText text="$1B" x={280} y={R.y - 150} size={250} frame={frame} start={24} dur={9} seed="ra-1b" />
          <MarkerPath shape={{ kind: "underline", x0: 112, y0: R.y - 58, x1: 446, y1: R.y - 68 }} frame={frame} start={34} dur={6} seed="ra-1b-u" />
          <MarkerText text="100M" x={785} y={M.y + 40} size={230} frame={frame} start={80} dur={10} seed="ra-100m" />
          <MarkerText text="$55M" x={290} y={C.y - 183} size={215} frame={frame} start={184} dur={10} seed="ra-55m" />
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default RichAuthors;
