// ---------------------------------------------------------------------------
// YaGoldRush (wip-ya-boom, cut 0). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx) with the clip's materials (./yaShared.tsx).
// Opaque 1080x1920, 24 fps, 54 frames.
//
// CHECK LINE: "This is about the giant YA book franchises of the 2000s, all at once." With no sound: the real covers of Harry
// Potter, The Hunger Games, Twilight, Percy Jackson, The Fault in Our Stars and Divergent are slapped onto the page one after
// another into one crooked, overlapping heap.
//
// THE LINE: "What happened to the YA gold rush?"
// WORD -> FRAME: What 0 · happened 3 · to 15 · the 21 · YA 23 · gold 32 · rush 40
// DURATION: the slot 0.000 -> 2.250 s = 2.25 s x 24 = 54 frames (f0..f53).
//
// THE MOTION: one rush of books. It opens close on Harry Potter, already down (skidding its last px) and 64 % of the frame
// wide; the camera runs one continuous pull-back to the end while the other five are dealt in from off frame, each from its own
// side, every 6 frames, crooked (4-10 deg, alternating) and each landing 38-57 % on the ones before, so the heap grows faster
// than the camera opens. Every title stays clear of the later covers (the layout was solved for it). The camera tilts down with
// the growing heap (world y 480 -> 962, following the low covers as they land, settled by ~f42) while it pulls back (k 1.63 at
// f0 -> 1.0 by ~f46), so no title sits in a caption band once its cover is down (Divergent's crosses the band's top on its
// contact frame only); from f35 the heap is settled and the pull-back creeps out to the cut.
// Contact frames (slapDown: in the air SLAP_DUR 9 frames before, skid SKID_DUR 6 after; the skid is the first reaction, on the
// contact frame): Harry Potter -3 (skid ends f3, on "happened"), The Hunger Games 5, Twilight 11, Percy Jackson 17, The Fault in
// Our Stars 23 ("YA"), Divergent 29 (before "gold" 32), its 12 px skid ends f35.
// End frame (k 1.0): covers 420 px wide, the heap x -56..1104 (the outer two bleed), y 166..1230; every title is wholly visible,
// inside x 45..1035, and every visible title and author name is above y 1060. Twilight is a scissored copy cut short above its author line (crop 0.86 of the cover's height).
// Transient: Harry Potter's author line (bottom of the cover) sits in the first caption band f0-f5, until the next covers land on it.
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
import { THEME, TapeSpec, XeroxCutOut, slapDown } from "./yaShared";

export const FPS = 24;
export const DURATION = 54;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// One pull-back, two tracks through the kit's damped follower: the tilt down from Harry Potter to the heap's middle follows the
// low covers as they land (so their titles land above the caption bands), the zoom runs on to the end. Both start at the same key, so
// the rest camera (the paper's parallax anchor) is shared. World = screen at the end (camera ~(540, 962), k ~1.0).
const tiltAt = runWipCamera(
  [
    { f: -16, x: 532, y: 480, k: 1 },
    { f: 34, x: 540, y: 962, k: 1 },
    { f: 90, x: 540, y: 966, k: 1, ease: "linear" },
  ],
  DURATION,
);
const zoomAt = runWipCamera(
  [
    { f: -16, x: 532, y: 480, k: 1.72 },
    { f: 46, x: 532, y: 480, k: 1.0 },
    { f: 90, x: 532, y: 480, k: 0.975, ease: "linear" },
  ],
  DURATION,
);
const camAt = (f: number): WipCam => {
  const t = tiltAt(f);
  return { ...t, k: zoomAt(f).k };
};

type Cover = {
  name: string;
  src: string;
  aspect: number;
  x: number;
  y: number;
  rotate: number;
  contact: number;
  from: { x: number; y: number };
  spin: number;
  skid?: number;
  tape?: TapeSpec[];
  gamma?: number;
  position?: string;
};

const COVER_W = 420;
// Paint order = landing order: each lands on the ones before. Positions solved so every title stays uncovered and every visible
// title and author name ends above y 1060 (end frame).
const COVERS: Cover[] = [
  { name: "hp", src: "wip-ya-boom/ya0_hp_deathly_hallows.png", aspect: 1382 / 1984, x: 531.8, y: 482.6, rotate: -5.9, contact: -3, from: { x: 40, y: -1400 }, spin: -6 },
  { name: "hg", src: "wip-ya-boom/ya0_hunger_games.png", aspect: 793 / 1200, x: 348.0, y: 640.4, rotate: 4, contact: 5, from: { x: -1000, y: -160 }, spin: 12 },
  {
    name: "twilight",
    src: "wip-ya-boom/ya0_twilight.png",
    // cut short above the author line: 0.86 of the cover's height, from the top
    aspect: 1695 / 2560 / 0.86,
    position: "50% 0%",
    x: 166.1,
    y: 835.1,
    rotate: -4.2,
    contact: 11,
    from: { x: -900, y: 760 },
    spin: -12,
    tape: [{ at: "t", along: 0.64, angle: 82 }],
    gamma: 0.9,
  },
  { name: "percy", src: "wip-ya-boom/ya0_percy_jackson.png", aspect: 1556 / 2288, x: 778.6, y: 573.0, rotate: 5.7, contact: 17, from: { x: 1000, y: -420 }, spin: 14, tape: [{ at: "r", along: 0.42, angle: 8 }] },
  { name: "tfios", src: "wip-ya-boom/ya0_fault_in_our_stars.png", aspect: 1701 / 2547, x: 491.4, y: 893.6, rotate: -9.2, contact: 23, from: { x: -140, y: 1300 }, spin: -10 },
  {
    name: "divergent",
    src: "wip-ya-boom/ya0_divergent.png",
    aspect: 1594 / 2400,
    x: 846.4,
    y: 850.1,
    rotate: 9.6,
    contact: 29,
    from: { x: 1050, y: 240 },
    spin: 11,
    skid: 12,
    tape: [{ at: "b", along: 0.7, angle: 97 }],
  },
];

const YaGoldRush: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <>
      <WipFilmLife frame={frame} theme={THEME}>
        <PaperGround cam={cam} theme={THEME} />
        <WipPlane cam={cam}>
          {COVERS.map((c) => (
            <XeroxCutOut
              key={c.name}
              src={c.src}
              kind="cover"
              x={c.x}
              y={c.y}
              w={COVER_W}
              aspect={c.aspect}
              position={c.position}
              rotate={c.rotate}
              tape={c.tape}
              gamma={c.gamma}
              slap={slapDown(frame, c.contact, { from: c.from, spin: c.spin, skid: c.skid })}
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
