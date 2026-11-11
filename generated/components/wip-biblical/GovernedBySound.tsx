// ---------------------------------------------------------------------------
// GovernedBySound (wip-biblical, cut 16). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx). The tribe itself lives in ./tribeShared.tsx.
// Opaque 1080x1920, 24 fps, 88 frames.
//
// CHECK LINE: "A tribe's whole world was the circle one voice could reach." With no sound: a storyteller in the middle,
// red rings of his voice spreading over a ring of listeners and stopping at its edge; outside it, nothing.
//
// THE LINE: "Tribal man was governed by sound. His world was defined by what he could hear."
// WORD -> FRAME: Tribal 0 · man 7 · was 10 · governed 14 · by 20 · sound 24 · His 35 · world 39 · was 47 · defined 53 ·
// by 60 · what 66 · he 70 · could 73 · hear 76. Cut to speaker at f88.
// DURATION: the slot 16.042 -> 19.708 s = 3.667 s x 24 = 88 frames (f0..f87).
//
// THE MOTION: one camera pull-back. Close on the old storyteller in profile at f0 (k 3.7, his head and mouth large, mouth at
// screen (610, 400)), his voice already printing out of his mouth as thin red ink rings that widen at one constant speed
// (3.65 ground px a frame, one every 20 frames, 3-4 alive) and settle onto the page as perspective ellipses round him. On
// "governed by sound" the camera eases back (fastest ~f30) and the rings wash over the six listeners seated round him, each
// print taking a faint red tint as a ring passes under it. The first ring reaches the rim on "was" (f48) and stays printed
// there, the edge of his world: beyond it, bare paper. Every later ring thins into the rim and ends there. Settled by ~f56
// (k 1.61: rim x ~80-1000, tribe y ~140-690, back heads ~120-140 px), then a slow creep in (k 1.63 at f87) while a ring
// still leaves him every 20 frames.
// Contact frames: the first ring passes the listeners' feet f31-f34 (first tint, derived from the ring in
// tribeShared.listenerTint); the first ring meets the rim on f48 and stops; the next ones end there on f68 and f88.
// SPOT INK: red = the voice that binds the tribe (rings and rim). No indigo, no text.
// CAMERA: one zoom track on the kit's damped follower (keys f-24 k 3.8, f6 x0.95, f50 k 1.6, f118 k 1.664); the framing is
// derived from the zoom (his mouth at (610, 400) close, the ground's centre at (540, 540) wide), one curve.
// REV 2 (director review 1): settle much closer (was k 0.99, a small scene in a big band) and open nearer (was k 5.4,
// soft postcard, mostly hat and beard); the tribe was re-seated with per-child heights in tribeShared (SHARED_CHANGES.md).
//
// SOURCES: all people from one real photograph, "En Bretagne. Vieux conteur breton, auditoire attentif" (postcard no. 294,
// E.L.D., 1910s, public domain), animation_source/assets_raw/tribe/Postcard1910s_VieuxConteurBreton_AuditoireAttentif.jpg:
// the storyteller and six of his child listeners, hand-cut (scripts/clips/wip-biblical/bake-tribe.py; polygons + Apple
// Vision matte + bake-photo grade). Each print's height is set per seat (tribeShared SEATS) so every face reads at
// phone size.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, PaperGround, WipCam, WipFilmLife, runWipCamera } from "../kits/works-in-progress/wipShared";
import { STORYTELLER, TRIBE_CX, TRIBE_CY, TribeLayers } from "./tribeShared";

export const FPS = 24;
export const DURATION = 88;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// -- the camera: one zoom track (the kit's damped follower), and the framing derived from the zoom ---------------------
/** Opening zoom: his head and mouth large, the postcard at about 1.5 screen px per scan px (rev 2: was 5.4 on
 * a 280 px storyteller, 2.7 screen px per scan px). */
export const K_OPEN = 3.8;
/** The wide the pull-back settles into (rev 2: was 0.99): the rim spans about x 90-990, the tribe y ~140-690. */
const K_WIDE = 1.6;
const zoomAt = runWipCamera(
  [
    { f: -24, x: 0, y: 0, k: K_OPEN },
    { f: 6, x: 0, y: 0, k: K_OPEN * 0.95, ease: "linear" },
    { f: 50, x: 0, y: 0, k: K_WIDE },
    { f: DURATION + 30, x: 0, y: 0, k: K_WIDE * 1.04, ease: "linear" },
  ],
  DURATION,
);
// What the frame holds: his mouth at screen (610, 400) close up (room on his left for the voice), the ground's centre at
// screen (540, 540) wide. The world anchor and its screen point slide between the two with the zoom (log space), so the
// pull-back is one curve.
const MOUTH = STORYTELLER.mouth;
const FACE_SCREEN = { x: 610, y: 400 };
const WIDE_SCREEN = { x: 540, y: 540 };
export const camAt = (frame: number): WipCam => {
  const { k } = zoomAt(frame);
  const u0 = (Math.log(K_OPEN) - Math.log(k)) / (Math.log(K_OPEN) - Math.log(K_WIDE));
  const u = Math.min(1, Math.max(0, u0));
  const e = u * u * (3 - 2 * u);
  const ax = MOUTH.x + (TRIBE_CX - MOUTH.x) * e;
  const ay = MOUTH.y + (TRIBE_CY - MOUTH.y) * e;
  const sx = FACE_SCREEN.x + (WIDE_SCREEN.x - FACE_SCREEN.x) * e;
  const sy = FACE_SCREEN.y + (WIDE_SCREEN.y - FACE_SCREEN.y) * e;
  return { k, x: ax - (sx - 540) / k, y: ay - (sy - 960) / k, x0: 540, y0: 960 };
};
/** The last frame's camera: cut 23 opens on it (rev 2). */
export const GBS_LAST_FRAME = DURATION - 1;
export const GBS_LAST_CAM = camAt(GBS_LAST_FRAME);
/** Rev 1's last camera (k 0.99 wide, the old tribe geometry), kept for reference: do not build on it. */
export const GBS_LAST_CAM_REV1 = { k: 1.012123757741113, x: 539.9184781236678, y: 953.4234409761434, x0: 540, y0: 960 } as const;

const GovernedBySound: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        <TribeLayers cam={cam} frame={frame} />
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default GovernedBySound;
