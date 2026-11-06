// ---------------------------------------------------------------------------
// FiveFranchises (wip-entertainment, cut 22). Works in Progress style, the clip's messy variant (styles/works-in-progress.md;
// kit generated/components/kits/works-in-progress/wipShared.tsx; clip module ./messyShared.tsx; notes/COMMON.md).
// Opaque 1080x1920, 24 fps, 102 frames.
//
// CHECK LINE: "The five biggest films of 2025 were all sequels or remakes." With no sound: five real 2025 posters are
// dealt onto the page, then from under every one of them slides the older poster (or the game's cover) it was built on.
//
// THE LINE: "All five of the highest-grossing films of 2025 came from existing franchises."
// WORD -> FRAME (Whisper, often 0.2-0.4 s early): All -1 · five 3 · of 10 · the 15 · highest 16 · grossing 23 · films 29 ·
// of 38 · 2025 43 · came 52 · from 66 · existing 71 · franchises 78 · (next line 100)
// DURATION: the slot 22.792 -> 27.042 s = 4.25 s x 24 = 102 frames (f0..f101).
//
// THE MOTION: one page, one slow creep in (k 0.955 -> ~1.0 about the collage's middle, y 588). The five posters, b&w
// hand-cut prints, are dealt by hand on twos in rank order from the page's edges, each landing with a small settle
// wobble, into a loose overlapping pile that fills the page above the caption bands (#1 is already landing on f0). From
// "came from" the five originals are pulled out from under them in a ripple (3 frames apart, on twos), each to about 40 %
// showing at an angle with its own title clear, lying over the earlier posters and under the later ones, as if the new
// posters had been pasted over them. On "franchises" the author's red marker writes each original's year on the print
// itself in the same ripple. Settled from f94: grain, the creep and the marker's boil.
// Contact frames (dealIn `landed`): Ne Zha 2 f4, Zootopia 2 f14, Avatar: Fire and Ash f24, Lilo & Stitch f34, A Minecraft
// Movie f44. Tape pressed flat: Avatar's f30, Lilo's f40. Originals pulled from f56, 59, 62, 65, 68 (first sliver out on f58,
// 60, 64, 66, 70), at rest on f68, 72, 74, 78, 80, settle wobble done by f86. Years written f78-82, 81-85, 84-88, 87-91,
// 90-94 (2019, 2016, 2009, 2002, 2011).
// SPOT INK: red = the author's felt-tip only: the five years, on an ink plane (multiplies into the prints).
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
import { CaptionBandsDebug, WipPlane, paperEase, runWipCamera } from "../kits/works-in-progress/wipShared";
import { MessyFilmLife, MessyPaper, RoughCutPrint, Scrawl, Tape, dealIn, onTwos, stickOn } from "./messyShared";

export const FPS = 24;
export const DURATION = 102;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// -- the camera: one slow creep in about the collage's middle (screen y FOCUS), already running at f0 ------------------
const FOCUS = 588;
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

// -- the prints ---------------------------------------------------------------------------------------------------
// The collage was solved by a small search (scratch layout.py) over every poster and original rest pose: all five poster
// titles wholly clear, each original 38-43 % visible with its title clear and a light patch for its year, each still
// 40-60 % under its own poster, everything inside x 90-990, y 110-1070. 330 px posters could not do that without
// burying Ne Zha 2 under the rest (25 % visible); 300 px is the largest width that keeps every poster about half visible.
const PW = 300; // a poster's photo window on the settled frame (screen px); 2:3
const ASPECT = 2 / 3;
const ORIG_K = 0.9; // the originals a touch smaller (older, smaller prints), so each lies wholly under its poster at first
const DEAL_DUR = 10;
const SLIDE_DUR = 12;
const YEAR_SIZE = 64; // screen px: about 16 px tall on a 270 px wide phone frame

type Film = {
  key: string;
  poster: string;
  orig: string;
  x: number; // poster centre, settled screen px
  y: number;
  rot: number;
  from: { x: number; y: number }; // where the hand deals it from (settled screen px offset: off frame)
  fromRot: number;
  deal: number; // the deal's first frame
  peek: { x: number; y: number; rot: number }; // the original's rest, relative to the poster centre (screen px), absolute rotation
  slide: number; // the original's first pull
  year: string;
  yearAt: [number, number]; // where the year starts on the original (u at its left end, v at its middle)
  yearStart: number;
};

// Rank order = deal order. Paint order: each original directly under its own poster (o1 p1 o2 p2 ...), so an original
// pulled out lies over the earlier posters and under the later ones, as a pile of paper would.
const FILMS: Film[] = [
  {
    key: "nezha",
    poster: "ff_nezha2",
    orig: "ff_nezha_2019",
    x: 490,
    y: 834,
    rot: 1.6,
    from: { x: -820, y: 180 },
    fromRot: -14,
    deal: -6,
    peek: { x: -225, y: -15, rot: 6.2 },
    slide: 56,
    year: "2019",
    yearAt: [0.2, 0.55],
    yearStart: 78,
  },
  {
    key: "zootopia",
    poster: "ff_zootopia2",
    orig: "ff_zootopia_2016",
    x: 604,
    y: 357,
    rot: -3.4,
    from: { x: 80, y: -800 },
    fromRot: 10,
    deal: 4,
    peek: { x: 186, y: 8, rot: 11 },
    slide: 59,
    year: "2016",
    yearAt: [0.37, 0.28],
    yearStart: 81,
  },
  {
    key: "avatar",
    poster: "ff_avatar3",
    orig: "ff_avatar_2009",
    x: 812,
    y: 654,
    rot: -1.8,
    from: { x: 760, y: 150 },
    fromRot: 13,
    deal: 14,
    peek: { x: -2, y: 187, rot: -5.8 },
    slide: 62,
    year: "2009",
    yearAt: [0.22, 0.735],
    yearStart: 84,
  },
  {
    key: "lilo",
    poster: "ff_lilo2025",
    orig: "ff_lilo_2002",
    x: 269,
    y: 539,
    rot: -3.3,
    from: { x: -740, y: -100 },
    fromRot: -12,
    deal: 24,
    peek: { x: 2, y: -210, rot: 2.6 },
    slide: 65,
    year: "2002",
    yearAt: [0.1, 0.41],
    yearStart: 87,
  },
  {
    key: "minecraft",
    poster: "ff_minecraft_movie",
    orig: "ff_minecraft_2011",
    x: 520,
    y: 634,
    rot: -3.8,
    from: { x: 780, y: 280 },
    fromRot: 12,
    deal: 34,
    peek: { x: -37, y: -163, rot: 4.8 },
    slide: 68,
    year: "2011",
    yearAt: [0.36, 0.265],
    yearStart: 90,
  },
];

// Tape: stuck on by hand just after its print lands, on outer edges nothing later covers.
const TAPES = [
  { on: "avatar", x: 958, y: 560, w: 104, rot: 96, start: 26, from: { x: 700, y: -300 } },
  { on: "lilo", x: 124, y: 470, w: 112, rot: 82, start: 36, from: { x: -700, y: 300 } },
];

const posterPose = (f: Film, frame: number) => {
  const d = dealIn(frame, { start: f.deal, dur: DEAL_DUR, from: { x: ws(f.from.x), y: ws(f.from.y) }, rot: f.fromRot, wobble: 1.3 });
  return { x: wx(f.x) + d.dx, y: wy(f.y) + d.dy, rot: f.rot + d.rot, lift: d.lift };
};

// The original is PULLED out from under its poster (not dealt): it starts slowly from rest, so its first pose shows only a
// sliver past the poster's edge, speeds up, and eases to a stop with a small settle wobble, on twos.
const pullOut = (frame: number, start: number, dur: number) => {
  const f = onTwos(frame);
  const t = paperEase(Math.min(1, Math.max(0, (f - start) / dur)));
  const after = f - (start + dur);
  const wob = after >= 0 && after <= 6 ? Math.exp(-after / 2.4) * Math.cos(after * 1.35) : 0;
  return { t, wob, out: f > start };
};

const origPose = (f: Film, frame: number) => {
  // from exactly under its poster (its centre and angle) to its rest
  const { t, wob, out } = pullOut(frame, f.slide, SLIDE_DUR);
  return {
    sx: f.x + f.peek.x * t, // settled screen px
    sy: f.y + f.peek.y * t,
    rot: f.rot + (f.peek.rot - f.rot) * t + 0.9 * wob,
    lift: 0.12 * Math.sin(Math.PI * t),
    out,
  };
};

// A point of the original (u, v) in world px, on its pose of this frame: the year is written ON the print and moves with it.
const onOrig = (f: Film, frame: number, u: number, v: number) => {
  const p = origPose(f, frame);
  const w = PW * ORIG_K;
  const h = w / ASPECT;
  const a = (p.rot * Math.PI) / 180;
  const lx = (u - 0.5) * w;
  const ly = (v - 0.5) * h;
  return { x: wx(p.sx + lx * Math.cos(a) - ly * Math.sin(a)), y: wy(p.sy + lx * Math.sin(a) + ly * Math.cos(a)), rot: p.rot };
};

const FiveFranchises: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <>
      <MessyFilmLife frame={frame}>
        <MessyPaper cam={cam} />
        <WipPlane cam={cam}>
          {FILMS.map((f) => {
            const o = origPose(f, frame);
            const dealt = onTwos(frame) >= f.deal;
            const p = posterPose(f, frame);
            return (
              <React.Fragment key={f.key}>
                {o.out ? (
                  <RoughCutPrint
                    src={`wip-entertainment/${f.orig}.jpg`}
                    rect
                    x={wx(o.sx)}
                    y={wy(o.sy)}
                    w={ws(PW * ORIG_K)}
                    aspect={ASPECT}
                    rotate={o.rot}
                    lift={o.lift}
                    border={[5, 16]}
                    grain={0.07}
                    seed={`o-${f.key}`}
                  />
                ) : null}
                {dealt ? (
                  <RoughCutPrint
                    src={`wip-entertainment/${f.poster}.jpg`}
                    rect
                    x={p.x}
                    y={p.y}
                    w={ws(PW)}
                    aspect={ASPECT}
                    rotate={p.rot}
                    lift={p.lift}
                    border={[6, 18]}
                    grain={0.07}
                    seed={`p-${f.key}`}
                  />
                ) : null}
              </React.Fragment>
            );
          })}
          {TAPES.map((t) => (
            <Tape
              key={t.on}
              x={wx(t.x)}
              y={wy(t.y)}
              w={ws(t.w)}
              h={ws(46)}
              rotate={t.rot}
              press={stickOn(frame, t.start, 4)}
              from={t.from}
              seed={`tape-${t.on}`}
            />
          ))}
        </WipPlane>
        {/* the author's red marker: each original's year, written on the print */}
        <WipPlane cam={cam} ink>
          {FILMS.map((f) => {
            const at = onOrig(f, frame, f.yearAt[0], f.yearAt[1]);
            return (
              <Scrawl
                key={f.key}
                text={f.year}
                x={at.x}
                y={at.y}
                size={ws(YEAR_SIZE)}
                frame={frame}
                start={f.yearStart}
                perLetter={1}
                rotate={at.rot - 4}
                seed={`year-${f.key}`}
              />
            );
          })}
        </WipPlane>
      </MessyFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default FiveFranchises;
