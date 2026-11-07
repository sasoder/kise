// ---------------------------------------------------------------------------
// OldStoriesRemixed (wip-entertainment, cut 50). Works in Progress style, the clip's messy variant (notes/COMMON.md;
// kit generated/components/kits/works-in-progress/wipShared.tsx; the clip's ./messyShared.tsx).
// Opaque 1080x1920, 24 fps, 116 frames.
//
// CHECK LINE: "Homer, the Grimms and Shakespeare were all pasting over older stories." With no sound: three old things lie
// on the page (a Bronze Age warrior vase, the Grimms' storyteller, Holinshed's Chronicles) and each classic (Homer's bust,
// the 1812 Kinder- und Hausmärchen, the 1623 First Folio) is stuck down on top of one of them, the old one still showing.
//
// THE LINE: "Reworking old stories is how we got Homer's epics, Grimm's fairy tales, and Shakespeare's plays."
// WORD -> FRAME: Reworking 5 · old 14 · stories 18 · is 30 · how 37 · we 41 · got 46 · Homer's 49 · epics 58 · Grimm's 68 ·
// fairy 75 · tales 79 · and 89 · Shakespeare's 92 · plays 102 (Whisper, early: beats land ~3-4 frames after).
// DURATION: the slot 50.083 -> 54.917 s = 4.833 s x 24 = 116 frames (f0..f115).
//
// THE MOTION (rev 3, the stripped-down variant: hard cuts, no animation; styles/works-in-progress.md and the clip's
// notes/REVISION_hardcut.md): three rows down the page (y ~90-1070), one pair per row, zig-zagging left / right / left.
// f0: the three old prints already lie on the page, crooked (the Warrior Vase, Dorothea Viehmann, Holinshed's arch). On
// each name the classic HARD CUTS in over the right ~38 % of its source, in the same frame as its piece of tape and a
// small red marker arrow from the old print over the seam onto the new one: f53 Homer's bust ("Homer's" 49), f72 the
// 1812 Kinder- und Hausmärchen ("Grimm's" 68), f96 the First Folio ("Shakespeare's" 92). Hold to f115. The old thing's
// identifying part stays in view beside the new one (the vase's warriors, Viehmann's face, Holinshed's engraved arch and
// column). The camera is still, fixed at the approved rev-2 settled framing; the frame lives through the paper grain only.
// Contact frames: none (nothing moves; every change is a cut).
// SPOT INK: red = the author's marker only: one small arrow per pair, source -> classic over the seam, cut in whole with
// its classic and static (no draw-on, no boil). No text.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt; raw copies in assets-src/wip-entertainment/50/; bake
// scripts/clips/wip-entertainment/bake-50.py through bake-roughcut.py, Vision mattes for the vase and the bust):
// - os_vase: the Warrior Vase, Mycenae c. 1200 BC, National Archaeological Museum Athens. Photo Sharon Mollerus, CC BY 2.0,
//   https://commons.wikimedia.org/wiki/File:Warrior_Vase.jpg
// - os_homer: bust of Homer, British Museum (BM 1825). Commons "File:Bust Homer BM 1825 n2.jpg", CC BY 2.5.
// - os_viehmann: Dorothea Viehmann, etching by Ludwig Emil Grimm, PD. https://commons.wikimedia.org/wiki/File:Dorothea_Viehmann.JPG
// - os_khm1812: Kinder- und Haus-Märchen, vol. 1, Berlin 1812, title page. PD; scan Staatsbibliothek zu Berlin – PK (Yt 1067)
//   via Deutsches Textarchiv, https://www.deutschestextarchiv.de/book/view/grimm_maerchen01_1812?p=7
// - os_holinshed: Holinshed, The Chronicles of England, Scotland and Ireland, 1587, title page. PD.
//   https://commons.wikimedia.org/wiki/File:The_Chronicles_of_England,_Scotland_and_Ireland,_Holinshed,_1587_-_Title_page.jpg
// - os_folio1623: Mr. William Shakespeares Comedies, Histories, & Tragedies (First Folio), 1623, title page with the
//   Droeshout portrait. Miami U. Libraries, no restrictions.
//   https://commons.wikimedia.org/wiki/File:First_Folio-_Title_Page,_p._1_(22163127103).jpg
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";
import { MarkerStroke, MessyFilmLife, MessyPaper, RoughCutPrint, Tape, handArrow } from "./messyShared";

export const FPS = 24;
export const DURATION = 116;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// The camera is STILL (rev 3). It sits at the approved rev-2 settled framing: that cut's creep track evaluated at its last
// frame, kept so the layout below (solved in screen px on that frame) lands on exactly the same pixels.
const rev2CamAt = runWipCamera(
  [
    { f: -24, x: 540, y: 960, k: 1 },
    { f: DURATION + 12, x: 540, y: 948, k: 1.035, ease: "linear" },
  ],
  DURATION,
);
const SETTLED = rev2CamAt(DURATION - 1);
// The layout is solved in screen px on the settled frame (screen -> world).
const wx = (sx: number) => SETTLED.x + (sx - 540) / SETTLED.k;
const wy = (sy: number) => SETTLED.y + (sy - 960) / SETTLED.k;
const ws = (s: number) => s / SETTLED.k;

type Print = {
  key: string;
  src: string;
  aspect: number; // the baked PNG's
  sx: number; // centre, screen px on the settled frame
  sy: number;
  sw: number; // the PNG's full width, screen px on the settled frame
  rot: number;
  page?: boolean; // a printed page: lighter tone table and finer grain, so the paper stays paper
};

// THREE ROWS, one pair each, old on the left and new pasted over its right ~38 %, zig-zagging left / right / left down
// y ~90-1070 (rows overlap a little). Screen px on the settled frame; `sw` = the baked PNG's full width (border included).
// Kept clear of the classic: the vase's marching warriors (its left ~62 %), Viehmann's face (crop puts it at ~1/3 across),
// Holinshed's arch and left column.
// THE OLD THINGS: on the page from f0, crooked.
const SOURCES: Print[] = [
  { key: "vase", src: "wip-entertainment/os_vase.png", aspect: 1.226, sx: 315, sy: 270, sw: 430, rot: 2.2 },
  { key: "viehmann", src: "wip-entertainment/os_viehmann.png", aspect: 1.0034, sx: 545, sy: 605, sw: 330, rot: -2.8 },
  { key: "holinshed", src: "wip-entertainment/os_holinshed.png", aspect: 1.1555, sx: 280, sy: 895, sw: 360, rot: 3.0, page: true },
];

// THE CLASSICS: each hard cuts in over its source's right side on its name (`at`), with its tape and its arrow.
type Classic = Print & {
  at: number; // the hard cut: the word's Whisper onset + ~4 frames
  tape: { dx: number; dy: number; w: number; rot: number };
  arrow: { a: [number, number]; b: [number, number] }; // screen px on the settled frame: from the source, over the seam, onto the classic
};
const CLASSICS: Classic[] = [
  {
    key: "homer",
    src: "wip-entertainment/os_homer.png",
    aspect: 0.8635,
    sx: 527,
    sy: 274,
    sw: 320,
    rot: -2.4,
    at: 53,
    tape: { dx: 118, dy: -152, w: 124, rot: 36 },
    arrow: { a: [282, 410], b: [432, 430] },
  },
  {
    key: "khm",
    src: "wip-entertainment/os_khm1812.png",
    aspect: 1.1071,
    sx: 780,
    sy: 600,
    sw: 390,
    rot: 2.6,
    at: 72,
    page: true,
    tape: { dx: 138, dy: -160, w: 124, rot: 38 },
    arrow: { a: [500, 700], b: [640, 668] },
  },
  {
    key: "folio",
    src: "wip-entertainment/os_folio1623.png",
    aspect: 0.9849,
    sx: 488,
    sy: 892,
    sw: 330,
    rot: -2.2,
    at: 96,
    page: true,
    tape: { dx: -148, dy: -156, w: 124, rot: -36 },
    arrow: { a: [258, 1036], b: [408, 1026] },
  },
];
// THE RED MARKER (the author's hand): one arrow per pair from the source over the seam onto the classic, kept on the lower
// part of each seam, off the faces, the warriors and the titles; the tape sits on a top corner of each classic (Homer's and
// the 1812 page's far corner, the Folio's onto Holinshed's top) so the two never meet. Cut in whole, static: the stroke is
// rendered complete with no boil, and its felt edge is drawn at one fixed frame so its texture never re-jitters.
const ARROW_W = 10;
const ARROW_HEAD = 26;
const arrowStrokes = (c: Classic) =>
  handArrow({ x: wx(c.arrow.a[0]), y: wy(c.arrow.a[1]) }, { x: wx(c.arrow.b[0]), y: wy(c.arrow.b[1]) }, `${c.key}-arrow`, ws(ARROW_HEAD));

const PAGE_GAMMA = 0.72;
const PAGE_GRAIN = 0.06;

const PrintOnPage: React.FC<{ p: Print }> = ({ p }) => (
  <RoughCutPrint
    src={p.src}
    x={wx(p.sx)}
    y={wy(p.sy)}
    w={ws(p.sw)}
    aspect={p.aspect}
    rotate={p.rot}
    gamma={p.page ? PAGE_GAMMA : 1}
    grain={p.page ? PAGE_GRAIN : 0.12}
    seed={p.key}
  />
);

const OldStoriesRemixed: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = SETTLED;
  const on = CLASSICS.filter((c) => frame >= c.at);
  return (
    <>
      <MessyFilmLife frame={frame}>
        <MessyPaper cam={cam} />
        <WipPlane cam={cam}>
          {SOURCES.map((p) => (
            <PrintOnPage key={p.key} p={p} />
          ))}
          {on.map((c) => (
            <React.Fragment key={c.key}>
              <PrintOnPage p={c} />
              <Tape x={wx(c.sx + c.tape.dx)} y={wy(c.sy + c.tape.dy)} w={ws(c.tape.w)} h={ws(46)} rotate={c.tape.rot} seed={`${c.key}-tape`} />
            </React.Fragment>
          ))}
        </WipPlane>
        <WipPlane cam={cam} ink>
          {on.map((c) =>
            arrowStrokes(c).map((pts, i) => (
              <MarkerStroke key={`${c.key}-${i}`} points={pts} frame={c.at} progress={1} boil={0} width={ws(ARROW_W)} seed={`${c.key}-arrow-${i}`} />
            )),
          )}
        </WipPlane>
      </MessyFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default OldStoriesRemixed;
