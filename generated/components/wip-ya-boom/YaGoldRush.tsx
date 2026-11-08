// ---------------------------------------------------------------------------
// YaGoldRush (wip-ya-boom, cut 0). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx) with the clip's materials (./yaShared.tsx).
// Opaque 1080x1920, 24 fps, 54 frames.
//
// BEAT MAP (rev 2, hard cuts; each cut lands about 4 frames after the word's Whisper onset):
//   f0   The Fault in Our Stars, already pasted at the top of the heap ("What" f0)
//   f7   The Hunger Games (left) and Divergent (right, taped) cut in, partly on it ("happened" f3)
//   f27  Harry Potter and the Deathly Hallows (centre) and Percy Jackson (right, taped) cut in on the upper row's bottoms ("YA" f23)
//   f36  Twilight cuts in, lowest and on top (taped), and the heap is whole ("gold" f32, "gold rush")
//   f36-f53 held; only the paper grain and the film life move
//
// CHECK LINE: "This is about the giant YA book franchises of the 2000s, all at once." With no sound: the real covers of The
// Fault in Our Stars, The Hunger Games, Divergent, Harry Potter, Percy Jackson and Twilight are suddenly there on the page,
// in three hard cuts, as one crooked, overlapping heap.
//
// THE LINE: "What happened to the YA gold rush?"
// WORD -> FRAME: What 0 · happened 3 · to 15 · the 21 · YA 23 · gold 32 · rush 40
// DURATION: the slot 0.000 -> 2.250 s = 2.25 s x 24 = 54 frames (f0..f53).
//
// REV 2 (user, Nov 7: "still a bit over the top, it can be more stripped down"; REVISION_hardcut.md): no slap-downs, no
// camera. A cover is on the page or it is not; its tape is there in the same frame. One still framing (world = screen).
// The heap is now centred on the frame's middle (bbox y 170..1766, centre ~968) instead of high at ~700. Because the
// camera no longer tilts, the heap was laid out again for the still frame: the same six covers, the same 420 px width and
// look, crooked 4-10 deg, each new cover 19-55 % on the ones before. The upper row is Fault in Our Stars, Hunger Games and
// Divergent. The lower row, Harry Potter and Percy Jackson, lies on their bottoms, so their author lines end hidden.
// Twilight lies lowest, on top.
// Bands (checked on every held state, f0 / f7 / f27 / f36):
//   - Every title (Harry Potter with "and the Deathly Hallows") is wholly visible in the end frame, inside x 60..1020.
//   - No title, author line or tagline sits in y 1080-1250 or 1360-1460 in any state. The art does: the mockingjay
//     ring, Harry, Percy's sea and Twilight's hands.
//   - Twilight's small title sits in the gap between the bands (y ~1262-1310). Harry Potter's faint J. K. ROWLING line
//     also sits in that gap, under Twilight from f36.
//   - Twilight is the scissored copy, cut short above its author line (0.86 of its height). Percy is now cut the same way
//     (0.85), which drops its "One / The Lightning Thief" line from the lower band.
// REV 3 (user, Nov 8: "bring back all the colors"; REVISION_colour.md): rev 2 exactly (cuts, framing, layout, crops,
// tape), the six covers re-baked in their own colours (bake-YaGoldRush.py --colour) and shown with XeroxCutOut `colour`:
// no photocopy grade, the copy-paper margin, tape and shadow stay. In colour Harry Potter's J. K. ROWLING line reads
// clearly; it is still in the gap between the bands (f27-f35), under Twilight from f36.
// SPOT INK: none (no marker in this cut: nothing to mark yet). No text: the covers are the artefacts.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt): the publishers' US first-edition front covers, from
// animation_source/assets_raw/covers/: cover_HarryPotterDeathlyHallows.jpg, cover_TheHungerGames.jpg, cover_Twilight.jpg,
// cover_PercyJacksonLightningThief.jpg, cover_Divergent.jpg, cover_TheFaultInOurStars.jpg. Baked by
// scripts/clips/wip-ya-boom/bake-YaGoldRush.py (kit grade, no matte) into public/wip-ya-boom/ya0_*.png.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, PaperGround, WipCam, WipFilmLife, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";
import { THEME, TapeSpec, XeroxCutOut } from "./yaShared";

export const FPS = 24;
export const DURATION = 54;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// One still framing: world = screen (camera at the frame's centre, k 1). Its key sits before f0 so the paper is at rest.
const CAM: WipCam = runWipCamera([{ f: -12, x: 540, y: 960, k: 1 }], DURATION)(0);

type Cover = {
  name: string;
  src: string;
  aspect: number;
  x: number;
  y: number;
  rotate: number;
  at: number; // the frame it cuts in on
  crop?: number; // scissored copy cut short: the fraction of the cover's height kept, from the top
  tape?: TapeSpec[];
  gamma?: number;
};

const COVER_W = 420;
const CUT_HAPPENED = 7;
const CUT_YA = 27;
const CUT_GOLD = 36;
// Paint order = cut order: each cut lies on the ones before. Positions solved on the still frame for every held state.
const COVERS: Cover[] = [
  // upper row: each one's lower text stays above the first band while it is on top, and ends under the covers cut in later
  { name: "tfios", src: "wip-ya-boom/ya0_fault_in_our_stars.png", aspect: 1701 / 2547, x: 468.8, y: 495.3, rotate: 4.3, at: 0 },
  { name: "hg", src: "wip-ya-boom/ya0_hunger_games.png", aspect: 793 / 1200, x: 274.1, y: 825.1, rotate: -4, at: CUT_HAPPENED },
  {
    name: "divergent",
    src: "wip-ya-boom/ya0_divergent.png",
    aspect: 1594 / 2400,
    x: 812.5,
    y: 677.3,
    rotate: 10,
    at: CUT_HAPPENED,
    tape: [{ at: "t", along: 0.3, angle: 97 }],
  },
  // lower row, on the upper row's bottoms: titles at their tops, above the first band; Harry Potter's faint author line
  // (J. K. ROWLING) falls in the gap between the bands, and Percy is cut short above its bottom subtitle
  { name: "hp", src: "wip-ya-boom/ya0_hp_deathly_hallows.png", aspect: 1382 / 1984, x: 364.9, y: 1052.0, rotate: -4, at: CUT_YA },
  {
    name: "percy",
    src: "wip-ya-boom/ya0_percy_jackson.png",
    aspect: 1556 / 2288,
    crop: 0.85,
    x: 815.2,
    y: 1104.2,
    rotate: 4,
    at: CUT_YA,
    tape: [{ at: "r", along: 0.42, angle: 8 }],
  },
  // last, lowest and on top, on "gold rush": the scissored Twilight (cut short above its author line), its small title in the
  // gap between the bands (y ~1262-1310), the hands and apple below
  {
    name: "twilight",
    src: "wip-ya-boom/ya0_twilight.png",
    aspect: 1695 / 2560,
    crop: 0.86,
    x: 243.9,
    y: 1468.0,
    rotate: -8.9,
    at: CUT_GOLD,
    tape: [{ at: "t", along: 0.64, angle: 82 }],
    gamma: 0.9,
  },
];

const YaGoldRush: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = CAM;
  return (
    <>
      <WipFilmLife frame={frame} theme={THEME}>
        <PaperGround cam={cam} theme={THEME} />
        <WipPlane cam={cam}>
          {COVERS.filter((c) => frame >= c.at).map((c) => (
            <XeroxCutOut
              key={c.name}
              src={c.src}
              kind="cover"
              colour
              x={c.x}
              y={c.y}
              w={COVER_W}
              aspect={c.crop ? c.aspect / c.crop : c.aspect}
              position={c.crop ? "50% 0%" : undefined}
              rotate={c.rotate}
              tape={c.tape}
              gamma={c.gamma}
              seed={`ya0-${c.name}`}
            />
          ))}
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default YaGoldRush;
