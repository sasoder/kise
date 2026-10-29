// ---------------------------------------------------------------------------
// SmallPotatoes (sarah-gulf-war, cut 69). Dwarkesh 3D style (styles/dwarkesh-3d.md) as a FLAT 2D isotype ledger in
// the teal air (the user, after cut 26: "more of a 2d graphic vibe ... mostly graphs and stuff").
// Opaque 1080x1920, 24 fps, 87 frames. The world is the clip's shared burdenWorld.tsx (cuts 69, 74, 80), owned here.
//
// CHECK LINE: "The coalition sent 200,000 troops and America 700,000, but troops were the cheap part of the deal."
//
// THE LINE: "Okay, the United States has 700,000, small potatoes. Here (are the big potatoes)." (before it, on the
// speaker: "A, they sent over 200,000 troops.")
// WORD -> FRAME (Whisper, ~5-9 f early): Okay -2 · the 7 · United 9 · States 11 · has 22 · 700,000 28 · small 64 ·
// potatoes 69 · Here 85 (the slot ends at 87).
// DURATION: the slot 69.416667 -> 73.041667 s (00:01:09:10 - 00:01:13:01) = 3.625 s x 24 = 87 frames (f0..f86).
//
// THE MOTION (rev 2): one isotype soldier (burdenWorld: a stocky 1991 desert infantryman, olive PASGT helmet, M16
// across the chest) = 25,000 troops. f0: the allies' small block (2 x 4 = 8 icons, ~125 px tall) stands left of
// centre on its plate "Allies 200,000+", the camera already drifting right and out. From f3 the US block (7 x 4 = 28
// icons, the same four ranks, so it reads 3.5x as wide) marches in from beyond the right frame edge (its front cut by
// the edge) as one rigid block at a constant 12.8 world px/f (~14 px/f on screen), legs scissoring in step (2 of 20 baked gait phases a
// frame), and halts in one cosine step over f27-34, landing exactly on the standing pose; its plate "U.S. 700,000",
// centred under the block and riding with it, slides up while the block decelerates (f24, readable by ~f32). A slow
// drift out. On "small potatoes" (f58-80) the camera pulls back in one smootherstep lobe (k ~0.98 -> 0.64) about the
// plates' bottom line, which stays at screen y 1062: both blocks gather low onto that line and read small under the
// open air above them (where cut 74's money lands), the troops draining a little toward the dim tone, still
// readable (icons 70 px, names 44 px, numbers 64 px at f86). f80-86: the drift out keeps going as a visible creep
// (d ln k -0.005/f, the block tops sinking ~2 px/f) while the icons breathe out of phase and the motes sink.
// No money in this cut. Orange (the accent) is reserved for the allies' cash in cuts 74 and 80; nothing here is orange.
//
// CAMERA (burdenWorld camAt): k 1.12 -> 0.97 and a truck right (cx -176 -> 0) easing out of a moving start over f0-40
// as the US arrives, a drift out under everything (-0.0008/f, ramping over f62-80 to -0.005/f), the pull-back as one
// smootherstep lobe in ln k over f58-80 (peak speed ~f69), sized so k = 0.625 at f86. The kit's sway on top.
// FRAMING: f0 the allies' block centred at x 430, helmets y ~265, its plate ending at y 1062. f40 the ledger spans
// x ~24-1034 (the allies' plate is far wider than its two columns), helmets y ~348, soles ~839, plates under them
// ending by 1062. f86 it spans x ~335-863 (with the plates), helmets y 617, soles 923, plates by 1062; open air above.
// The vertical is solved from the zoom (burdenWorld camAt), so nothing readable enters y 1080-1250 or 1360-1460 on
// any frame.
//
// SOURCES: US troops in theater 1990-91 694,550 (CRS RL32492, Table 8: 584,342 active + 110,208 recalled) ->
// "700,000"; non-US coalition troops well over 200,000 (UK 53,462, Saudi Arabia 60,000, Egypt 40,000, France 18,000,
// Syria 14,500 ...) -> "200,000+" (COMMON.md, verified for the clip).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, WorldSvg, swayCam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { ALLIES, BurdenDefs, BurdenPlate, CUT69_LEN, PLATE_TOP, REST_CAM, TroopCanvas, US, burdenAirOf, camAt, drainAt, enterText, troopOptsAt, useBurdenSprites } from "./burdenWorld";

export const FPS = 24;
export const DURATION = CUT69_LEN;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** the US plate slides up as the block lands */
const US_PLATE_F = 24; // rev 2: up while the block decelerates, readable by ~f32

const SmallPotatoes: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const get = useBurdenSprites();
  const cam = swayCam(camAt(frame), frame);
  const { v } = burdenAirOf(cam, REST_CAM, frame);
  const o = troopOptsAt(frame, v);
  const us = enterText(frame, US_PLATE_F);
  const dim = 0.25 * drainAt(frame);
  return (
    <AirStage v={v} bloom={0.22}>
      <TroopCanvas cam={cam} wf={frame} get={get} o={o} />
      <WorldSvg cam={cam}>
        <BurdenDefs uid="sp" />
        <BurdenPlate uid="sp" x={ALLIES.cx} y={PLATE_TOP} name="Allies" num="200,000+" o={1} lift={0} dim={dim} />
        <BurdenPlate uid="sp" x={US.cx + o.usOff} y={PLATE_TOP} name="U.S." num="700,000" o={us.o} lift={us.lift} dim={dim} />
      </WorldSvg>
    </AirStage>
  );
};

export default SmallPotatoes;
