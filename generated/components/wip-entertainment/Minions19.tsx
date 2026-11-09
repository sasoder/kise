// ---------------------------------------------------------------------------
// Minions19 (wip-entertainment, cut 44). Works in Progress style, stripped-down messy variant
// (styles/works-in-progress.md "Stripped-down variant"; shared module ./messyShared.tsx).
// Opaque 1080x1920, 24 fps, 22 frames.
//
// CHECK LINE: "He's joking that the Minions sequels will never stop: Minions 19."
//
// THE LINE: "I don't know about you guys, but I'm low-key hyped for Minions 19."
// WORD -> FRAME (Whisper, cut start 44.792 s): Minions -1 · 19 8 · (next line "But" 21).
// DURATION: the slot 44.792 -> 45.708 s = 0.917 s x 24 = 22 frames (f0..f21), over the stacked Minions stills.
//
// THE MOTION: none. The real 2015 "Minions" poster is taped on the paper from f0 (colour, hand-cut border, two pieces of
// tape). On "19" (f12: Whisper 45.14 s + 4 frames) a big red felt-tip "19" cuts in whole in the white gap right under
// the title, so the poster reads "minions 19". Still camera; the frame lives through the paper grain only. It answers the
// red sequel numbers 2-16 on the photocopies of cut 34 (CheaperSameAgain), nine seconds earlier.
// SPOT INK: red = the author's felt-tip: the "19", static (no write-on, no boil).
//
// SOURCES: animation_source/assets_raw/SOURCES.txt
// 35/minions3_Minions_2015.jpg -> https://image.tmdb.org/t/p/original/dr02BdCNAUPVU07aOodwPYv6HCf.jpg
//   (https://www.themoviedb.org/movie/211672) — © Universal / Illumination; fair use. Baked in colour by
//   scripts/clips/wip-anthropic/bake-photo.py --colour --mid 0.95 --max 1050 into public/wip-entertainment/mn_minions2015.jpg.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";
import { MessyFilmLife, MessyPaper, RoughCutPrint, Scrawl, Tape } from "./messyShared";

export const FPS = 24;
export const DURATION = 22;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// A still camera at rest: world = screen.
const CAM = runWipCamera(
  [
    { f: -24, x: 540, y: 960, k: 1 },
    { f: DURATION + 24, x: 540, y: 960, k: 1, ease: "linear" },
  ],
  DURATION,
)(0);

// The poster: 2:3, its photo window 600 x 900, centred above the caption bands (y 1080-1250, 1360-1460).
const P = { x: 540, y: 572, w: 600, rot: -1.8 };
const PH = P.w * 1.5;
// "19" in the white gap between the title (v 0.08-0.17) and Kevin's hair (v 0.33), under "ons".
const NINETEEN_AT = 12; // "19"
const N = { x: 600, y: 398, size: 190, rot: -7 };

const Minions19: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const top = P.y - PH / 2;
  return (
    <>
      <MessyFilmLife frame={frame}>
        <MessyPaper cam={CAM} />
        <WipPlane cam={CAM}>
          <RoughCutPrint src="wip-entertainment/mn_minions2015.jpg" rect x={P.x} y={P.y} w={P.w} aspect={2 / 3} rotate={P.rot} border={[6, 20]} grain={0.06} seed="mn-poster" />
          <Tape x={P.x - P.w / 2 + 14} y={top + 18} w={130} h={48} rotate={-38} press={1} seed="mn-tape-l" />
          <Tape x={P.x + P.w / 2 - 14} y={top + 6} w={124} h={48} rotate={41} press={1} seed="mn-tape-r" />
        </WipPlane>
        {/* the author's red marker, cut in whole and static */}
        <WipPlane cam={CAM} ink>
          {frame >= NINETEEN_AT ? (
            <Scrawl
              text="19"
              x={N.x}
              y={N.y}
              size={N.size}
              frame={NINETEEN_AT} // pinned: the felt edge re-jitters every 3 frames otherwise
              start={NINETEEN_AT - 200}
              perLetter={1}
              boil={0}
              rotate={N.rot}
              seed="mn-19"
            />
          ) : null}
        </WipPlane>
      </MessyFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default Minions19;
