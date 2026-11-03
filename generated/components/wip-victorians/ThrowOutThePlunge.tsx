// ---------------------------------------------------------------------------
// ThrowOutThePlunge (wip-victorians, cut 0), rev 2. Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 97 frames.
//
// CHECK LINE: "Forget cold plunges: the world's biggest empire was run by these men." With no sound: a modern ice tub is
// shoved off the page and three Victorian statesmen rise into its place.
//
// THE LINE: "Throw out your cold plunge. The most successful empire in the world was run by men"
// WORD -> FRAME: Throw 0 · out 5 · your 10 · cold 13 · plunge 18 · The 28 · most 34 · successful 37 · empire 47 · in 57 ·
// the 66 · world 69 · was 75 · run 82 · by 88 · men 94
// DURATION: the slot 0.000 -> 4.042 s = 4.042 s x 24 = 97 frames (f0..f96). The edit cuts to real pictures of them after f96.
//
// THE MOTION: two objects, one gesture. The tub lies across the middle of the page, already drifting right at f0; on "out"
// it is shoved off the right edge with a small tilt (full speed, about 54 px a frame, by f11), its last sliver gone on f23.
// While it is still half on the page, Gladstone's crown comes up at the bottom left (first visible about f13), and the three
// statesmen slide up from below into the space it leaves, left to right in the tub's own direction (Gladstone, Salisbury,
// Balfour), one slow speed (52 frames each) and a stagger of 9, landing f60, f69, f78 through "The most successful empire
// in the world". The camera creeps in from f0 to the end on one continuous track (k 1.00 -> about 1.07), so the settled
// frame f78-f96 stays alive.
// Contact frames: nothing touches anything. The tub is slid (paper on paper); the men are slid prints. No ink in this cut.
// THE TUB'S EDGE: the photo crops the tub at its right side, so that end starts past the frame and leaves first: never seen.
// THE MEN: pasted prints with a paper border all round and a hand-cut bottom where each photo ends (they end at the chest,
// so the prints end at about y 1230-1330 rather than bleeding off the frame). Salisbury lies under his neighbours.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt): objects/IceBathTub_geograph.jpg, Alan Hughes, geograph via Commons,
// CC BY-SA 2.0 (retouched: a dead weed cloned off the rim; the ice's highlights and contrast lifted, tones only).
// men/Gladstone_1892_cropped.jpg, Samuel Alexander Walker, PD. men/Salisbury_ElliottFry.jpg, Elliott & Fry, PD.
// men/Balfour_GWS01.jpg, PD. Mattes: Apple Vision; bake-photo.py; scripts/clips/wip-victorians/bake-plunge-0.py.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, CutOut, PaperGround, WipFilmLife, WipPlane, runWipCamera, slide } from "../kits/works-in-progress/wipShared";

export const FPS = 24;
export const DURATION = 97;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// One camera: a slow creep in that is already running at f0, a little quicker while the men rise, slower again on the
// settled frame. Linear keys only, so it never stops; the follower lags its keys by about 8-10 frames.
const camAt = runWipCamera(
  [
    { f: -24, x: 540, y: 960, k: 1 },
    { f: 26, x: 540, y: 956, k: 1.016, ease: "linear" },
    { f: 80, x: 540, y: 946, k: 1.058, ease: "linear" },
    { f: DURATION + 24, x: 540, y: 943, k: 1.075, ease: "linear" },
  ],
  DURATION,
);
// The settled frame the men's layout is solved on (screen px -> world px).
const SETTLED = camAt(88);
const worldX = (sx: number) => SETTLED.x + (sx - 540) / SETTLED.k;
const worldY = (sy: number) => SETTLED.y + (sy - 960) / SETTLED.k;

// -- the tub: drifting at f0, shoved off the right edge on "out" ------------------------------------------
const TUB = "wip-victorians/pl_tub.png";
const TUB_ASPECT = 1.3333; // 1920 x 1440; the tub itself spans x 196-1917, y 249-1370 of the file
const TUB_W = 1000;
const TUB_S = TUB_W / 1920;
const TUB_LEFT0 = 250; // the tub's rounded end on f0 (world px)
const TUB_X0 = TUB_LEFT0 - 196 * TUB_S + TUB_W / 2; // the file's centre on f0
const TUB_Y = 860; // the file's centre: back rim at about y 615, front rim at about y 1063, foot at about y 1198
const DRIFT = 2.5; // px a frame before the shove
const SHOVE = 5; // "out"
const RAMP = 6; // frames from the drift to full speed
const CRUISE = 54; // px a frame once shoved
const tubDx = (frame: number) => {
  const t = frame - SHOVE;
  if (t <= 0) return frame * DRIFT;
  const rampDist = (u: number) => DRIFT * u + ((CRUISE - DRIFT) * u * u) / (2 * RAMP);
  if (t <= RAMP) return SHOVE * DRIFT + rampDist(t);
  return SHOVE * DRIFT + rampDist(RAMP) + (t - RAMP) * CRUISE;
};
// 0..1 over the shove, for the tilt and the lift
const shoveT = (frame: number) => Math.min(1, Math.max(0, (frame - SHOVE) / 19));

// -- the men: heads one size, chins in a near line above the caption band, prints overlapping -----------------------
const HEAD = 300; // screen px, crown to chin, on the settled frame
const BORDER = 8; // the paper border round each print
const RISE = 52; // frames: one slow speed for all three
// Sizes are the baked PNG's px: faceX the face's centre, chinY the chin's height with the crown at 0, visL/visR the print's
// visible left and right. Screen targets on the settled frame: fx the face's centre, cy the chin.
const MEN = [
  // drawn first, so the neighbours' prints lie over his shoulders
  { name: "salisbury", W: 858, H: 1042, faceX: 400, chinY: 628, fx: 540, cy: 1012, start: 17 },
  { name: "gladstone", W: 1037, H: 1243, faceX: 478, chinY: 633, fx: 90 + (478 - 146) * (HEAD / 633), cy: 1040, start: 8 },
  { name: "balfour", W: 975, H: 1301, faceX: 455, chinY: 744, fx: 990 - (844 - 455) * (HEAD / 744), cy: 1036, start: 26 },
];

const ThrowOutThePlunge: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const st = shoveT(frame);
  const tubX = TUB_X0 + tubDx(frame);
  const tubGone = tubX - TUB_W / 2 + 196 * TUB_S > cam.x + (540 + 140) / cam.k; // its rounded end and shadow are past the edge
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        <WipPlane cam={cam}>
          {MEN.map((m) => {
            const k = SETTLED.k;
            const s = HEAD / k / m.chinY;
            const w = m.W * s;
            const h = m.H * s;
            const crown = worldY(m.cy) - HEAD / k;
            // fully below the frame at the start (the crown 20 px under the bottom edge on the camera of that frame)
            const startCam = camAt(m.start);
            const crownStart = startCam.y + (1920 + 20 - 960) / startCam.k;
            const up = slide(frame, m.start, RISE);
            const y = crown + (1 - up) * (crownStart - crown);
            return (
              <CutOut
                key={m.name}
                src={`wip-victorians/pl_${m.name}.png`}
                x={worldX(m.fx) + (m.W / 2 - m.faceX) * s}
                y={y + h / 2}
                w={w}
                aspect={m.W / m.H}
                border={BORDER}
                lift={(1 - up) * 0.5}
                seed={m.name}
              />
            );
          })}
        </WipPlane>
        {tubGone ? null : (
          <WipPlane cam={cam}>
            <CutOut
              src={TUB}
              x={tubX}
              y={TUB_Y + st * 22}
              w={TUB_W}
              aspect={TUB_ASPECT}
              rotate={-1.2 + st * 5.5}
              lift={0.2 + st * 0.3}
              seed="tub"
            />
          </WipPlane>
        )}
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default ThrowOutThePlunge;
