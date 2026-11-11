// ---------------------------------------------------------------------------
// SquadThenDips (wip-taylor-swift, cut 59). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 107 frames.
//
// CHECK LINE: "She gathers a famous friend group around herself, and then she drops out of it, leaving a gap." With no
// sound: Taylor alone on the page; her famous friends slide up round her into a group photo; then she alone sinks out of
// the middle of it and the group stands there with a Taylor-sized hole.
//
// THE LINE: "And she's repeatedly used her fame to build, like, the cloutiest friend groups, and then dips."
// WORD -> FRAME: And 0 · she's 2 · repeatedly 8 · used 16 · her 23 · fame 27 · to 33 · build 37 · like 43 · the 48 ·
// cloutiest 51 · friend 62 · groups 67 · and 77 · then 90 · dips 93 · (cut back at 105)
// DURATION: the slot 59.5447 -> 63.9199 s = 105 frames at 24, + 2 frames of tail handle = 107 (f0..f106).
//
// THE MOTION: one gesture each way, the friends up and Taylor down. Taylor (b&w cut-out, thigh-up) stands big and
// front-centre from f0, the camera a little closer on her. On "to build … the cloutiest friend groups" five friends slide up
// from below the page AROUND her in a horseshoe, never over her: Gigi and Cara first beside her shoulders (a little lower,
// tucked behind her print's edges), then Selena and Karlie lower at the sides, Lena lowest at the left (rises start f22-f36,
// land f52-f66), while the camera eases back (k 1.27 -> 1.00, settled about f80, then a faint creep; her crown stays at
// y ~185). On "then dips" Taylor alone sinks straight down out of the bottom of the frame the way they came (f85 -> gone
// f100; on "dips" f93 her head is halfway down the column, her crown passes y 760 about f95). What is left is an empty column of mint paper in the
// middle of the group, from her crown height down past y 760, the friends' heads and shoulders outlining where she stood.
// The group holds, living (grain, the creep), to the end. No ghost, no label, no text.
// LAYOUT (screen px on the settled frame): Taylor's print x ~378-758, crown y ~185, chin y 384. Gigi (face x 262) and Cara
// (850) chins y 440; Selena (158) and Karlie (930) chins ~590; Lena (272) chin 735. Every face sits above y 760. Print
// order: the friends first, Taylor on top; their inner edges reach at most ~30-60 px behind her print's edges.
// Contact frames: none; everything is a slid print (paper over paper). No ink in this cut.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt), all Wikimedia Commons; mattes by Apple Vision, graded by
// scripts/clips/wip-taylor-swift/bake-squad-59.py (bake-photo.py) into public/wip-taylor-swift/sq_<name>.png:
// Taylor Swift: taylor/taylor_2019_Lover_thighup.jpg, "Taylor Swift 2 - 2019 by Glenn Francis", Glenn Francis (Toglenn),
//   iHeartRadio Music Awards 2019-03-14, CC BY-SA 4.0.
// Karlie Kloss: squad/karlie_kloss_2013_street_fulllength_a.jpg, "Karlie Kloss (8470966863)", bethany w. from houston,
//   2013-02-12, CC BY 2.0.
// Selena Gomez: squad/selena_gomez_2024_TIFF_fulllength_a.jpg, "Selena Gomez at the 2024 Toronto International Film
//   Festival", Frank Sun, 2024-09-09, CC BY-SA 4.0.
// Gigi Hadid: squad/gigi_hadid_2015_kneeup_b.jpg, "Gigi Hadid (19719451974)", Eva Rinaldi from Sydney Australia,
//   2015-08-06, CC BY-SA 2.0.
// Cara Delevingne: squad/cara_delevingne_2014_waistup_c.jpg, "Cara Delevingne September 2014", US Embassy London,
//   2014-09-16, public domain.
// Lena Dunham: squad/lena_dunham_2016_kneeup_a.jpg, "Lena Dunham (25109471712)", Greg2600, 2016-02-20, CC BY-SA 2.0
//   (the man beside her and the man behind her cut away; mirrored).
// The friends are members of Taylor's 2015 "squad" as reported in the press at the time.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, CutOut, PaperGround, WipFilmLife, WipPlane, runWipCamera, slide } from "../kits/works-in-progress/wipShared";

export const FPS = 24;
export const DURATION = 107;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// One camera: close on Taylor (her crown near the top of the frame) and already easing back from f0; on "build" it eases
// back to the whole group, then a faint creep keeps the held group alive. The follower lags its keys by ~8-10 frames.
const camAt = runWipCamera(
  [
    { f: -24, x: 540, y: 791, k: 1.27 },
    { f: 24, x: 540, y: 816, k: 1.22, ease: "linear" },
    { f: 70, x: 540, y: 960, k: 1.0 },
    { f: DURATION + 40, x: 540, y: 950, k: 1.016, ease: "linear" },
  ],
  DURATION,
);
// The settled frame the layout is solved on (screen px -> world px).
const SETTLED = camAt(82);
const worldX = (sx: number) => SETTLED.x + (sx - 540) / SETTLED.k;
const worldY = (sy: number) => SETTLED.y + (sy - 960) / SETTLED.k;

// -- the people ---------------------------------------------------------------------------------------------------------
// Baked PNG px (public/wip-taylor-swift/sq_<name>.png): W x H, fcx = the face box's centre x, chin = the chin's y, F = the
// face box's size (Vision face landmarks). Screen targets on the settled frame: fx the face centre, cy the chin, face the
// face box's size on screen. start = the frame the rise begins.
type Person = {
  name: string;
  W: number;
  H: number;
  fcx: number;
  chin: number;
  F: number;
  fx: number;
  cy: number;
  face: number;
  start: number;
  flip?: boolean;
};
const RISE = 30; // frames: one speed for every friend
const SHOULDER = 112; // face size of the pair at her shoulders (a step behind her)
const SIDE = 116; // face size of the friends lower at the sides
// Taylor: big, front-centre, her print about 380 px wide (crown ~y 185). Nobody is drawn over her: every friend's print
// lies behind hers, and their inner edges tuck at most ~30 px behind her print's edges, so when she is gone they outline
// an empty column of paper where she stood.
const TAYLOR: Person = { name: "taylor", W: 926, H: 1600, fcx: 395, chin: 519, F: 310, fx: 540, cy: 384, face: 127.2, start: 0 };
// The horseshoe, in print order back to front. Gigi and Cara rise beside her shoulders, a little lower; Selena and Karlie
// lower at the sides, over the shoulder pair's lower edges (Karlie's coat covers Cara's short print's bottom); Lena lowest
// at the left, mirrored so the photo's cropped side faces out, over Selena.
const FRIENDS: Person[] = [
  { name: "gigi", W: 979, H: 1600, fcx: 513, chin: 406, F: 268, fx: 262, cy: 440, face: SHOULDER, start: 22 },
  { name: "cara", W: 900, H: 1600, fcx: 507.5, chin: 630, F: 369, fx: 850, cy: 440, face: SHOULDER, start: 25 },
  { name: "selena", W: 585, H: 1600, fcx: 253.5, chin: 319, F: 185, fx: 158, cy: 592, face: SIDE, start: 29 },
  { name: "karlie", W: 875, H: 1600, fcx: 452, chin: 349, F: 198, fx: 930, cy: 588, face: SIDE, start: 32 },
  { name: "lena", W: 604, H: 1600, fcx: 289, chin: 454, F: 254, fx: 272, cy: 735, face: SIDE, start: 36, flip: true },
];

// The settled print box of a person in world px.
const box = (p: Person) => {
  const s = p.face / SETTLED.k / p.F;
  const w = p.W * s;
  const h = p.H * s;
  const fcx = p.flip ? p.W - p.fcx : p.fcx;
  const left = worldX(p.fx) - fcx * s;
  const top = worldY(p.cy) - p.chin * s;
  return { w, h, x: left + w / 2, y: top + h / 2, top };
};
// Fully below the frame on a given frame's camera: the print's top 24 px under the bottom edge.
const belowFrameTop = (f: number) => {
  const c = camAt(f);
  return c.y + (1920 + 24 - 960) / c.k;
};

// A friend sliding up from below the page.
const Friend: React.FC<{ p: Person; frame: number }> = ({ p, frame }) => {
  const b = box(p);
  const up = slide(frame, p.start, RISE);
  if (up <= 0) return null;
  const top0 = belowFrameTop(p.start);
  const dy = (1 - up) * (top0 - b.top);
  return <CutOut src={`wip-taylor-swift/sq_${p.name}.png`} x={b.x} y={b.y + dy} w={b.w} aspect={p.W / p.H} border={7} lift={(1 - up) * 0.5} flipX={p.flip} seed={p.name} />;
};

// Taylor's dip: still from f0, then down and out of the bottom on "then dips", accelerating like a drop.
const DIP_START = 85;
const DIP_END = 100;
const dipAt = (frame: number) => interpolate(frame, [DIP_START, DIP_END], [0, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.9, 0.55) });

const SquadThenDips: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const tb = box(TAYLOR);
  const dip = dipAt(frame);
  const taylorDy = dip * (belowFrameTop(DIP_END) - tb.top);
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        <WipPlane cam={cam}>
          {FRIENDS.map((p) => (
            <Friend key={p.name} p={p} frame={frame} />
          ))}
          {frame < DIP_END ? (
            <CutOut src="wip-taylor-swift/sq_taylor.png" x={tb.x} y={tb.y + taylorDy} w={tb.w} aspect={TAYLOR.W / TAYLOR.H} border={7} lift={Math.min(1, dip * 3) * 0.45} seed="taylor" />
          ) : null}
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default SquadThenDips;
