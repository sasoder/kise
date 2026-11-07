// ---------------------------------------------------------------------------
// RichAuthors (wip-ya-boom, cut 21), rev 2: hard cuts. Works in Progress style, "Stripped-down variant"
// (styles/works-in-progress.md; kit generated/components/kits/works-in-progress/wipShared.tsx) with the clip's materials
// (./yaShared.tsx). Opaque 1080x1920, 24 fps, 217 frames.
//
// BEAT MAP (every change of state is a hard cut on its word, Whisper onset + ~4 frames; nothing moves in between):
//   f0   framing A on Rowling: her taped cut-out and "J.K. Rowling" already there ("J.")
//   f32  "$1B" and its underline, whole ("billionaire")
//   f57  cut to framing B, lower on the same page: Meyer's taped cut-out and "Stephenie Meyer" ("Stephenie")
//   f86  "100M" ("100")
//   f103 "copies" ("copies")
//   f122 the four Twilight covers, all at once ("four")
//   f140 cut to framing C, lower again: Collins' cut-out, "Suzanne Collins" and The Hunger Games ("In")
//   f150 "2012-13" ("year")
//   f192 "$55M" ("55")
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
// THE PICTURE: one scrapbook page seen in three still framings, one per author, each cut to on its sentence's first word.
// Rowling with "$1B" underlined beside her; Meyer with "100M copies" and the four Twilight covers in a crooked row under
// her; Collins with her name, "$55M", "2012-13" and The Hunger Games in a column beside her. Each framing keeps the block
// above in view at the top, so the three read as one page. Every paste lies flat with its tape on; every mark is complete
// on its frame. The frame lives through the paper grain and the film life only.
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
import { MarkerPath, MarkerText, MonoLabel, THEME, TapeSpec, XeroxCutOut } from "./yaShared";

export const FPS = 24;
export const DURATION = 217;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// -- the beats (hard cuts) ------------------------------------------------------------------------------------------------------
const AT = {
  rowling: 0,
  oneB: 32,
  meyer: 57,
  hundredM: 86,
  copies: 103,
  twilight: 122,
  collins: 140,
  year: 150,
  fiftyFive: 192,
};

// -- the page (world px) and the three still framings ---------------------------------------------------------------------------
// At k 1 a thing's screen y = its world y - the framing's offset. Everything hangs off BASE, Rowling's centre. On screen:
// A puts Rowling's centre at 1000; B puts Meyer's centre at 770, so the Twilight titles sit above the first caption band
// (Rowling and "$1B" stay in view at the top); C is rev 1's approved settled frame, Collins' centre at 954 with the bottom of
// Meyer's covers above. Faces, labels, figures and cover titles are all above y 1080 in their framing; torsos and the
// covers' lower halves run down through the bands.
const BASE = 1000;
const FRAMINGS: [number, number][] = [
  [AT.rowling, BASE - 1000], // A: Rowling
  [AT.meyer, BASE - 350], // B: Meyer, on "Stephenie" (Rowling's label just off the top)
  [AT.collins, BASE + 351], // C: Collins, on "In"
];
const offsetAt = (f: number) => FRAMINGS.reduce((o, [from, off]) => (f >= from ? off : o), FRAMINGS[0][1]);
// the paper sheet is centred between the first and last framing, so its slack covers both
const MID = (FRAMINGS[0][1] + FRAMINGS[FRAMINGS.length - 1][1]) / 2;
const camAt = (f: number): WipCam => ({ x: 540, y: 960 + offsetAt(f), k: 1, x0: 540, y0: 960 + MID });

const ROWLING = { src: "wip-ya-boom/ra_rowling.png", aspect: 934 / 1129 };
const MEYER = { src: "wip-ya-boom/ra_meyer.png", aspect: 1140 / 1400 };
const COLLINS = { src: "wip-ya-boom/ra_collins.png", aspect: 1122 / 1400 };
const PORTRAIT_H = 720;
// Rowling's and Meyer's names sit over their heads; Collins' heads her column beside her, since her head tucks under the
// bottoms of Meyer's covers
const LABEL_UP = PORTRAIT_H / 2 + 45;

// zigzag down the page: Rowling right with "$1B" left, Meyer left with "100M" right, Collins right with her name, "$55M" and
// her cover left
const R = { x: 730, y: BASE, rot: -3 };
const M = { x: 330, y: BASE + 420, rot: 2.5 };
const C = { x: 750, y: BASE + 1305, rot: 2 };

const COVER_W = 240;
const COVER_ASPECT = 1695 / 2560;
const COVERS_Y = BASE + 768;
const TWILIGHT = [
  { src: "wip-ya-boom/ra_twilight.png", x: 165, y: COVERS_Y - 8, rot: -6, tape: ["tl"] as TapeSpec[] },
  { src: "wip-ya-boom/ra_newmoon.png", x: 385, y: COVERS_Y + 10, rot: 3, tape: [] as TapeSpec[] },
  { src: "wip-ya-boom/ra_eclipse.png", x: 605, y: COVERS_Y - 6, rot: -2.5, tape: [] as TapeSpec[] },
  { src: "wip-ya-boom/ra_breakingdawn.png", x: 825, y: COVERS_Y + 12, rot: 5, tape: ["tr"] as TapeSpec[] },
];
// Collins' column, left of her: her name, "$55M", "2012-13", then the cover
const HG_W = 290;
const HG = { src: "wip-ya-boom/ra_hungergames.png", x: 300, y: BASE + 1305 - 50 + HG_W / (793 / 1200) / 2, w: HG_W, aspect: 793 / 1200, rot: -3 };

// a mono label that is simply there from its frame on (textRise long finished)
const Label: React.FC<{ text: string; x: number; y: number; size: number; frame: number; from: number }> = ({ text, x, y, size, frame, from }) =>
  frame >= from ? <MonoLabel text={text} x={x} y={y} align="center" size={size} frame={0} start={-100} /> : null;

const RichAuthors: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const on = (f: number) => frame >= f;
  const rw = PORTRAIT_H * ROWLING.aspect;
  const mw = PORTRAIT_H * MEYER.aspect;
  const cw = PORTRAIT_H * COLLINS.aspect;
  return (
    <>
      <WipFilmLife frame={frame} theme={THEME}>
        <PaperGround cam={cam} theme={THEME} />
        {/* the pastes, flat and taped, in paint order: later ones cover earlier ones */}
        <WipPlane cam={cam}>
          {on(AT.rowling) ? (
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
              seed="ra-rowling"
            />
          ) : null}
          {on(AT.meyer) ? (
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
              seed="ra-meyer"
            />
          ) : null}
          {on(AT.twilight)
            ? TWILIGHT.map((c, i) => (
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
                  seed={`ra-tw${i}`}
                />
              ))
            : null}
          {on(AT.collins) ? (
            <>
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
                seed="ra-hg"
              />
            </>
          ) : null}
        </WipPlane>
        {/* the mono labels */}
        <WipPlane cam={cam}>
          <Label text="J.K. Rowling" x={R.x - 10} y={R.y - LABEL_UP} size={38} frame={frame} from={AT.rowling} />
          <Label text="Stephenie Meyer" x={M.x - 70} y={M.y - LABEL_UP} size={38} frame={frame} from={AT.meyer} />
          <Label text="copies" x={785} y={M.y + 110} size={42} frame={frame} from={AT.copies} />
          <Label text="Suzanne Collins" x={290} y={C.y - 326} size={38} frame={frame} from={AT.collins} />
          <Label text="2012-13" x={268} y={C.y - 100} size={40} frame={frame} from={AT.year} />
        </WipPlane>
        {/* the red felt-tip, each mark complete on its frame */}
        <WipPlane cam={cam} ink>
          {on(AT.oneB) ? (
            <>
              <MarkerText text="$1B" x={280} y={R.y - 150} size={250} frame={frame} start={AT.oneB} progress={1} seed="ra-1b" />
              <MarkerPath shape={{ kind: "underline", x0: 112, y0: R.y - 58, x1: 446, y1: R.y - 68 }} frame={frame} start={AT.oneB} progress={1} seed="ra-1b-u" />
            </>
          ) : null}
          {on(AT.hundredM) ? <MarkerText text="100M" x={785} y={M.y + 40} size={230} frame={frame} start={AT.hundredM} progress={1} seed="ra-100m" /> : null}
          {on(AT.fiftyFive) ? <MarkerText text="$55M" x={290} y={C.y - 183} size={215} frame={frame} start={AT.fiftyFive} progress={1} seed="ra-55m" /> : null}
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default RichAuthors;
