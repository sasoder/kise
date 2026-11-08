// ---------------------------------------------------------------------------
// FiveFranchises (wip-entertainment, cut 22). Works in Progress style, the clip's messy variant (styles/works-in-progress.md;
// kit generated/components/kits/works-in-progress/wipShared.tsx; clip module ./messyShared.tsx; notes/COMMON.md).
// Opaque 1080x1920, 24 fps, 102 frames.
//
// CHECK LINE: "The five biggest films of 2025 were all sequels or remakes." With no sound: five real 2025 posters cut onto
// the page one by one, then from under every one of them the older poster (or the game's cover) it was built on is there.
//
// THE LINE: "All five of the highest-grossing films of 2025 came from existing franchises."
// WORD -> FRAME (Whisper, often 0.2-0.4 s early): All -1 · five 3 · of 10 · the 15 · highest 16 · grossing 23 · films 29 ·
// of 38 · 2025 43 · came 52 · from 66 · existing 71 · franchises 78 · (next line 100)
// DURATION: the slot 22.792 -> 27.042 s = 4.25 s x 24 = 102 frames (f0..f101).
//
// THE MOTION (rev 2, hard cuts: notes/REVISION_hardcut.md, the stripped-down variant): no animation, only things
// happening. A still camera on the approved settled framing; every change is a hard cut on its word. Ne Zha 2 is already
// on the page at f0; Zootopia 2 cuts in on f7, Avatar: Fire and Ash (with its tape) on f14, Lilo & Stitch (with its tape)
// on f20, A Minecraft Movie on f27 (five / highest-grossing / films). On f75 ("existing") all five originals are there at
// once, out from under their posters at an angle (about 40 % showing, titles clear), lying over the earlier posters and
// under the later ones as if the new posters had been pasted over them. On f82 ("franchises") all five red years are
// there at once, written on the prints. Held to f101; the frame lives on the paper grain only.
// Cuts: f0, 7, 14, 20, 27, 75, 82. Nothing deals, slides, wobbles, presses, writes on or boils.
// SPOT INK: red = the author's felt-tip only: the five years, on an ink plane (multiplies into the prints), cut in whole.
//
// SOURCES: the ranking, notes/top5_2025.md (Box Office Mojo 2025 worldwide, cross-checked on The Numbers; same five, same
// order): 1 Ne Zha 2 (sequel to Ne Zha, 2019), 2 Zootopia 2 (Zootopia, 2016), 3 Avatar: Fire and Ash (Avatar, 2009),
// 4 Lilo & Stitch (the 2002 animated film), 5 A Minecraft Movie (the game, Mojang; full release 2011). No figures on screen.
// Posters (animation_source/assets_raw/SOURCES.txt), official one-sheets used for commentary (fair use), via TMDB:
// 22/rank1_NeZha2.jpg -> https://image.tmdb.org/t/p/original/fcs5AdCKliQaQgXsPS9kDejamIJ.jpg — © Beijing Enlight / Chengdu Coco Cartoon
// 22/rank1_orig_NeZha_2019.jpg -> https://image.tmdb.org/t/p/original/phM9bb6s9c60LA8qwsdk7U1N2cS.jpg — © Beijing Enlight
// 22/rank2_Zootopia2.jpg -> https://image.tmdb.org/t/p/original/oJ7g2CifqpStmoYQyaLQgEU32qO.jpg — © Disney
// 22/rank2_orig_Zootopia_2016.jpg -> https://image.tmdb.org/t/p/original/ysjmqe0fTDSHLqEUxggshnE1QVk.jpg — © Disney
// 22/rank3_AvatarFireAndAsh.jpg -> https://image.tmdb.org/t/p/original/bRBeSHfGHwkEpImlhxPmOcUsaeg.jpg — © 20th Century Studios
// 22/rank3_orig_Avatar_2009.jpg -> https://image.tmdb.org/t/p/original/gKY6q7SjCkAU6FqvqWybDYgUKIF.jpg — © 20th Century Studios
// 22/rank4_LiloAndStitch.jpg -> https://image.tmdb.org/t/p/original/c32TsWLES7kL1uy6fF03V67AIYX.jpg — © Disney
// 22/rank4_orig_LiloAndStitch_2002.jpg -> https://image.tmdb.org/t/p/original/cFuLvQJPoZpuruAtN3rVnMmLIH8.jpg — © Disney
// 22/rank5_AMinecraftMovie.jpg -> https://image.tmdb.org/t/p/original/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg — © Warner Bros. / Legendary
// 22/rank5_orig_Minecraft_game_2011.jpg -> Microsoft Store box art (https://www.xbox.com/en-US/games/store/minecraft/9MVXMVT8ZKWC)
//   — © Mojang / Microsoft (the current cover, Steve and Alex; not the 2011 launch cover)
// Baked by scripts/clips/wip-entertainment/bake-22.py (2:3 window, the clip's photo grade) into public/wip-entertainment/ff_*.jpg.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";
import { MessyFilmLife, MessyPaper, PRINT_WHITE, RoughCutPrint, Scrawl, Tape, contactShadow, handCutRect } from "./messyShared";

export const FPS = 24;
export const DURATION = 102;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// -- the camera: still, on the approved settled framing (rev 1's last frame: its creep's end, kept exactly) ----------------
const FOCUS = 588;
const K0 = 0.955;
const CAM = runWipCamera(
  [
    { f: -24, x: 540, y: FOCUS + (960 - FOCUS) / K0, k: K0 },
    { f: DURATION + 20, x: 540, y: 960, k: 1, ease: "linear" },
  ],
  DURATION,
)(DURATION - 1);
// The layout is in the screen px of that framing (screen -> world).
const wx = (sx: number) => CAM.x + (sx - 540) / CAM.k;
const wy = (sy: number) => CAM.y + (sy - 960) / CAM.k;
const ws = (s: number) => s / CAM.k;

// -- the prints ---------------------------------------------------------------------------------------------------
// The collage was solved by a small search over every poster and original pose: all five poster titles wholly clear, each
// original 38-43 % visible with its title clear and a light patch for its year, each still 40-60 % under its own poster,
// everything inside x 90-990, y 110-1070. 330 px posters could not do that without burying Ne Zha 2 under the rest (25 %
// visible); 300 px is the largest width that keeps every poster about half visible.
const PW = 300; // a poster's photo window (screen px); 2:3
const ASPECT = 2 / 3;
const ORIG_K = 0.9; // the originals a touch smaller: older, smaller prints
const YEAR_SIZE = 64; // screen px: about 16 px tall on a 270 px wide phone frame
const ORIGINALS_AT = 75; // "existing"
const YEARS_AT = 82; // "franchises"

type Film = {
  key: string;
  poster: string;
  orig: string;
  x: number; // poster centre, screen px
  y: number;
  rot: number;
  at: number; // the poster's cut
  peek: { x: number; y: number; rot: number }; // the original's centre relative to the poster's (screen px), absolute rotation
  year: string;
  yearAt: [number, number]; // where the year starts on the original (u at its left end, v at its middle)
};

// Rank order = cut order. Paint order: each original directly under its own poster (o1 p1 o2 p2 ...).
const FILMS: Film[] = [
  { key: "nezha", poster: "ff_nezha2", orig: "ff_nezha_2019", x: 490, y: 834, rot: 1.6, at: 0, peek: { x: -225, y: -15, rot: 6.2 }, year: "2019", yearAt: [0.2, 0.55] },
  { key: "zootopia", poster: "ff_zootopia2", orig: "ff_zootopia_2016", x: 604, y: 357, rot: -3.4, at: 7, peek: { x: 186, y: 8, rot: 11 }, year: "2016", yearAt: [0.37, 0.28] },
  { key: "avatar", poster: "ff_avatar3", orig: "ff_avatar_2009", x: 812, y: 654, rot: -1.8, at: 14, peek: { x: -2, y: 187, rot: -5.8 }, year: "2009", yearAt: [0.22, 0.735] },
  { key: "lilo", poster: "ff_lilo2025", orig: "ff_lilo_2002", x: 269, y: 539, rot: -3.3, at: 20, peek: { x: 2, y: -210, rot: 2.6 }, year: "2002", yearAt: [0.1, 0.41] },
  { key: "minecraft", poster: "ff_minecraft_movie", orig: "ff_minecraft_2011", x: 520, y: 634, rot: -3.8, at: 27, peek: { x: -37, y: -163, rot: 4.8 }, year: "2011", yearAt: [0.36, 0.265] },
];

// Tape: there in the same frame as the print it holds, on outer edges nothing later covers.
const TAPES = [
  { on: "avatar", x: 958, y: 560, w: 104, rot: 96 },
  { on: "lilo", x: 124, y: 470, w: 112, rot: 82 },
];
const filmAt = (key: string) => FILMS.find((f) => f.key === key)?.at ?? 0;

// A point of the original (u, v) in world px: the year is written ON the print.
const onOrig = (f: Film, u: number, v: number) => {
  const w = PW * ORIG_K;
  const h = w / ASPECT;
  const a = (f.peek.rot * Math.PI) / 180;
  const lx = (u - 0.5) * w;
  const ly = (v - 0.5) * h;
  const cx = f.x + f.peek.x;
  const cy = f.y + f.peek.y;
  return { x: wx(cx + lx * Math.cos(a) - ly * Math.sin(a)), y: wy(cy + lx * Math.sin(a) + ly * Math.cos(a)) };
};

// The scrap under a year: a hand-cut slip round the Scrawl's box, turned with it about the word's left end.
const SCRAP_PAD = 10;
const SCRAP_BORDER: [number, number] = [3, 9];
const YearScrap: React.FC<{ f: Film }> = ({ f }) => {
  const at = onOrig(f, f.yearAt[0], f.yearAt[1]);
  const tw = ws(YEAR_SIZE * 2.55) + 2 * ws(SCRAP_PAD);
  const th = ws(YEAR_SIZE * 1.02);
  const b = ws(SCRAP_BORDER[1]) * 2;
  const cut = handCutRect(tw, th, `scrap-${f.key}`, [ws(SCRAP_BORDER[0]), ws(SCRAP_BORDER[1])]);
  const poly = `polygon(${cut.map((p) => `${(p.x + b).toFixed(1)}px ${(p.y + b).toFixed(1)}px`).join(", ")})`;
  const left = at.x - ws(SCRAP_PAD);
  return (
    <div style={{ position: "absolute", left: left - b, top: at.y - th / 2 - b, width: tw + 2 * b, height: th + 2 * b, filter: contactShadow(0, 0.7) }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: poly,
          backgroundColor: PRINT_WHITE,
          transformOrigin: `${b + ws(SCRAP_PAD)}px ${b + th / 2}px`,
          transform: `rotate(${f.peek.rot - 4}deg)`,
        }}
      />
    </div>
  );
};

const FiveFranchises: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <MessyFilmLife frame={frame}>
        <MessyPaper cam={CAM} />
        <WipPlane cam={CAM}>
          {FILMS.map((f) => (
            <React.Fragment key={f.key}>
              {frame >= ORIGINALS_AT ? (
                <RoughCutPrint
                  src={`wip-entertainment/${f.orig}.jpg`}
                  rect
                  x={wx(f.x + f.peek.x)}
                  y={wy(f.y + f.peek.y)}
                  w={ws(PW * ORIG_K)}
                  aspect={ASPECT}
                  rotate={f.peek.rot}
                  border={[5, 16]}
                  grain={0.07}
                  seed={`o-${f.key}`}
                />
              ) : null}
              {frame >= f.at ? (
                <RoughCutPrint
                  src={`wip-entertainment/${f.poster}.jpg`}
                  rect
                  x={wx(f.x)}
                  y={wy(f.y)}
                  w={ws(PW)}
                  aspect={ASPECT}
                  rotate={f.rot}
                  border={[6, 18]}
                  grain={0.07}
                  seed={`p-${f.key}`}
                />
              ) : null}
            </React.Fragment>
          ))}
          {TAPES.map((t) =>
            frame >= filmAt(t.on) ? (
              <Tape key={t.on} x={wx(t.x)} y={wy(t.y)} w={ws(t.w)} h={ws(46)} rotate={t.rot} press={1} seed={`tape-${t.on}`} />
            ) : null,
          )}
          {/* colour pass (Nov 8): each year on a scrap of white paper stuck on its original, there with the year, so the
              red reads on a red or busy poster */}
          {frame >= YEARS_AT ? FILMS.map((f) => <YearScrap key={f.key} f={f} />) : null}
        </WipPlane>
        {/* the author's red marker: each original's year, on the print, cut in whole and static */}
        <WipPlane cam={CAM} ink>
          {frame >= YEARS_AT
            ? FILMS.map((f) => {
                const at = onOrig(f, f.yearAt[0], f.yearAt[1]);
                return (
                  <Scrawl
                    key={f.key}
                    text={f.year}
                    x={at.x}
                    y={at.y}
                    size={ws(YEAR_SIZE)}
                    frame={YEARS_AT} // pinned: the felt edge's displacement re-jitters every 3 frames otherwise
                    start={YEARS_AT - 200}
                    perLetter={1}
                    boil={0}
                    rotate={f.peek.rot - 4}
                    seed={`year-${f.key}`}
                  />
                );
              })
            : null}
        </WipPlane>
      </MessyFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default FiveFranchises;
