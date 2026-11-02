// ---------------------------------------------------------------------------
// ThrowOutThePlunge (wip-victorians, cut 0). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 97 frames.
//
// CHECK LINE: "Forget cold plunges: the world's biggest empire was run by these men." With no sound: a modern ice tub is
// shoved out and three Victorian statesmen take over under the empire's stamp.
//
// THE LINE: "Throw out your cold plunge. The most successful empire in the world was run by men"
// WORD -> FRAME: Throw 0 · out 5 · your 10 · cold 13 · plunge 18 · The 28 · most 34 · successful 37 · empire 47 · in 57 ·
// the 66 · world 69 · was 75 · run 82 · by 88 · men 94
// DURATION: the slot 0.000 -> 4.042 s = 4.042 s x 24 = 97 frames (f0..f96).
//
// THE MOTION: the page is cleared and re-set. The tub is already moving at f0 and goes off the right edge on one paper move
// with a small tilt, gone by f22. As it clears, the Penny Black slides down from above, settling by f30, and the camera pushes in
// so it sits large (about 690 px wide). One red postmark presses across its corner on "empire", at that scale. From about f62 the
// camera eases back and up on one move, so the stamp ends top-centre as three men slide up from below into the space, in a small
// stagger, one speed, outer two first and the middle one behind them, landing f84, f87, f90, ahead of "men" (f94). One camera, no hold.
// Contact frames: the postmark touches at f46, first ink f46, full at f49. Nothing else touches: the rest slides.
// SPOT INK: red = the empire and its mark. No indigo. The Penny Black stays in its real near-black.
// THE TUB'S EDGE: the photo crops the tub at its right side, so that edge starts past the frame and leaves first: it is never seen.
// THE MEN: pasted prints with a paper border all round, ending in a hand-cut bottom edge where each photo naturally ends.
// THE STAMP: a real Penny Black had no perforations, so it is the real scan as a straight-edged print, not the kit's Stamp.
// Large, it stays above the caption band: at this width it is taller than the 180 px below y 900 allow, so it centres about y 670.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt): objects/PennyBlack_single_BD_from_MET_2002.236.1.jpg, unused block of
// four, issued May 6 1840, Met 2002.236.1, CC0. objects/IceBathTub_geograph.jpg, Alan Hughes, geograph via Commons, CC BY-SA 2.0
// (retouched: a dead weed cloned off the rim; the ice's highlights and contrast lifted, tones only). men/Gladstone_1892_cropped.jpg, Samuel Alexander Walker, PD.
// men/Salisbury_ElliottFry.jpg, Elliott & Fry, PD. men/Balfour_GWS01.jpg, PD. Mattes: Apple Vision; bake-photo.py;
// scripts/clips/wip-victorians/bake-plunge-0.py.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, CutOut, PaperGround, Postmark, RED, WipFilmLife, WipPlane, inkPress, runWipCamera, slide } from "../kits/works-in-progress/wipShared";

export const FPS = 24;
export const DURATION = 97;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// One camera: a creep on the tub, the push in on the stamp once the tub clears, a creep through "empire", then back and up as the
// men rise. The follower lags its keys by about 8-10 frames. At the stamp the frame's left padding is about 150 px.
const CLOSE_X = 574;
const CLOSE_Y = 652;
const camAt = runWipCamera(
  [
    { f: -24, x: 540, y: 960, k: 1 },
    { f: 10, x: 540, y: 955, k: 1.012, ease: "linear" },
    { f: 36, x: CLOSE_X, y: CLOSE_Y, k: 1.35 },
    { f: 58, x: CLOSE_X, y: CLOSE_Y, k: 1.38, ease: "linear" },
    { f: 84, x: 540, y: 960, k: 1.04 },
    { f: DURATION + 6, x: 540, y: 960, k: 1.05, ease: "linear" },
  ],
  DURATION,
);

// -- the tub: one shove off the right edge ----------------------------------------------------------
const TUB = "wip-victorians/pl_tub.png";
const TUB_ASPECT = 1.3333;
const TUB_W = 1120;
const TUB_Y = 680; // the tub sits low in its photo: this keeps its front rim above y 1000
const TUB_START = -4;
const TUB_END = 22; // gone
const TUB_X_FROM = 530; // its left end at about x 120 on f0
const TUB_TRAVEL = 1120;
// A shove: it gathers speed and never slows on screen, so it peaks at about 75 px a frame, as it leaves.
const shove = (frame: number) => Math.min(1, Math.max(0, (frame - TUB_START) / (TUB_END - TUB_START))) ** 1.8;

// -- the stamp ---------------------------------------------------------------------------------------
const PENNY = "wip-victorians/pl_penny.png";
const PENNY_ASPECT = 0.8586;
const PENNY_W = 500;
const PENNY_H = PENNY_W / PENNY_ASPECT;
const PENNY_X = 540;
const PENNY_Y = 440;
const PENNY_START = 6;
const PENNY_DUR = 24; // settled on f30
const PENNY_FROM = PENNY_Y + PENNY_H / 2 + 60; // fully above the frame, shadow included

// -- the postmark, across the lower right corner of the stamp --------------------------------------------------------
const MARK_CONTACT = 46;
const MARK_X = 795;
const MARK_Y = 618;
const MARK_SIZE = 250; // it has to stay in frame at the close-up's scale, as well as at the end
const MARK_ROTATE = 97; // runs the lettering down the stamp's right side on bare paper, clear of its black and of Balfour's head

// -- the men: heads one size, chins in one line above the caption band ------------------------------------
const HEAD = 265;
const CHIN_Y = 1050;
const MEN_START = 62;
const MEN_STAGGER = 3;
const MEN_DUR = 22; // land f84, f87, f90
const BORDER = 8; // the paper border round each print
// Sizes are the baked PNG's px: faceX the face's centre, chinY the chin's height with the crown at 0.
const MEN = [
  // drawn first and up last, so the neighbours' prints lie over his
  { name: "salisbury", W: 858, H: 1042, faceX: 400, chinY: 628, cx: 540, order: 2 },
  { name: "gladstone", W: 1037, H: 1243, faceX: 478, chinY: 633, cx: 245, order: 0 },
  { name: "balfour", W: 975, H: 1301, faceX: 455, chinY: 744, cx: 835, order: 1 },
];

const ThrowOutThePlunge: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const out = shove(frame);
  const pennyIn = slide(frame, PENNY_START, PENNY_DUR);
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        <WipPlane cam={cam}>
          <CutOut
            src={PENNY}
            x={PENNY_X}
            y={PENNY_Y - (1 - pennyIn) * PENNY_FROM}
            w={PENNY_W}
            aspect={PENNY_ASPECT}
            lift={(1 - pennyIn) * 0.5}
            seed="penny"
          />
        </WipPlane>
        <WipPlane cam={cam} ink>
          <Postmark
            x={MARK_X}
            y={MARK_Y}
            size={MARK_SIZE}
            ink={RED}
            seed="empire-1840"
            rotate={MARK_ROTATE}
            top="BRITISH EMPIRE"
            stars={3}
            wear={0.18}
            press={inkPress(frame, MARK_CONTACT)}
          />
        </WipPlane>
        {out < 1 ? (
          <WipPlane cam={cam}>
            <CutOut
              src={TUB}
              x={TUB_X_FROM + out * TUB_TRAVEL}
              y={TUB_Y + out * 26}
              w={TUB_W}
              aspect={TUB_ASPECT}
              rotate={-1.5 + out * 6.5}
              lift={0.25 + out * 0.25}
              seed="tub"
            />
          </WipPlane>
        ) : null}
        <WipPlane cam={cam}>
          {MEN.map((m) => {
            const s = HEAD / m.chinY;
            const w = m.W * s;
            const h = m.H * s;
            const up = slide(frame, MEN_START + m.order * MEN_STAGGER, MEN_DUR);
            const crown = CHIN_Y - HEAD;
            const from = 1920 - crown + 60; // fully below the frame at the start
            return (
              <CutOut
                key={m.name}
                src={`wip-victorians/pl_${m.name}.png`}
                x={m.cx + (m.W / 2 - m.faceX) * s}
                y={crown + h / 2 + (1 - up) * from}
                w={w}
                aspect={m.W / m.H}
                border={BORDER}
                lift={(1 - up) * 0.5}
                seed={m.name}
              />
            );
          })}
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default ThrowOutThePlunge;
