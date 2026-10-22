// ---------------------------------------------------------------------------
// DenverPopUpStorms (scott-weather-fired, cut 2 "2_DenverPopUpStorms"). Cheeky Pint style, the realistic "at sea"
// variant carried into the air (styles/cheeky-pint.md § Realistic ocean variant; the shared world denverWorld.tsx).
// Opaque 1080x1920, 23.976 fps.
//
// CHECK LINE: "it's summer at Denver's airport and thunderstorms keep popping up all around it"
//
// THE LINE: "Denver in the summer. In Denver, there's a lot of pop-up thunderstorms"
// WORD -> FRAME: Denver 3 · in 9 · the 18 · summer 20 · In 29 · Denver 29 · there's 37 · a 39 · lot 41 · of 43 ·
//                pop 45 · -up 50 · thunderstorms 53
// DURATION: slot 2.252-4.963 s = sequence frames 54-119 -> 65 frames at 24000/1001.
//
// THE MOTION: we open already in the golden air low over the plains south of DEN (the airfield ahead, the terminal's
// white peaks catching the low sun, the Front Range soft on the left horizon) and push in with a slight descent toward
// DEN_CAM_ESTABLISH, one continuous damped move (denverWorld CUT1_CAM, pre-rolled so f0 is already moving). From f0
// the small cumulus around the field are swelling; four cells billow into cumulonimbus at the west, north-west,
// north-east and south-east of the field, staggered so the strongest burst lands on "pop-up" (f45-53: NE, in full view
// right of the field, grows fastest at f53) and NE is still boiling at the last frame. No lightning (cut 2's strike).
// AMBER = the weather's reach (the strike, the closed ring, the FAA's forecast area): none in this cut; the cut's
// touch is the warm low sun on the terminal peaks. Cream = the subject (storm tops, the peaks), the plains context.
// TEXT: "DENVER" in world space just above the terminal peaks on its word (slide-up, landed by f3), ~60 px caps.
//
// JOINT: cut 2 opens on this cut's last frame (f64): camera DEN_CAM_ESTABLISH, storms POPUP_END, story clock S = 64
// (S = this cut's frame), all exported by denverWorld and asserted below.
//
// SOURCES: DEN layout per denverAirfield.ts (LAYOUT_SOURCE); no figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { flickerAt } from "./denverStorms";
import { AirStage, CUT1, DEN_CAM_ESTABLISH, POPUP_END, TERMINAL_SCALE, WorldLabel, cut1CamAt, makeView, popupCellsAt, smooth, terminalCentreY } from "./denverWorld";

export const FPS = 24000 / 1001;
export const DURATION = 65;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// the joint with cut 2 (LightningThreeMiles): its f0 = this cut's last frame
if (CUT1.duration !== DURATION || CUT1.last !== DURATION - 1) throw new Error("DenverPopUpStorms: CUT1 constants disagree with DURATION");
{
  const c = cut1CamAt(CUT1.last);
  const keys = Object.keys(c) as (keyof typeof c)[];
  if (keys.some((k) => Math.abs(c[k] - DEN_CAM_ESTABLISH[k]) > 1e-9)) throw new Error("DenverPopUpStorms: last frame camera != DEN_CAM_ESTABLISH");
  const cells = popupCellsAt(CUT1.last);
  if (cells.some((s, i) => Math.abs(s.growth - POPUP_END[i].growth) > 1e-9 || s.id !== POPUP_END[i].id)) throw new Error("DenverPopUpStorms: last frame cells != POPUP_END");
}

/** "DENVER": a world label standing just above the terminal's peaks (z in miles), landed by the word (f3); ~60 px cap
 *  height so it reads on a phone. */
const LABEL_AT = { x: 0, y: terminalCentreY(TERMINAL_SCALE), z: 1.0 } as const;
const LABEL_PX = 84;
/** in-cloud flicker events (start frames) per cell id */
export const FLICKERS: Record<string, number[]> = { NW: [53, 61], W: [57] }; // all over by f64 (cut 2 joins on POPUP_END, no flicker)
/** the "DENVER" label as it stands at this cut's last frame (cut 2's join imports it): world point, z, size, entered */
export const DENVER_LABEL = { x: LABEL_AT.x, y: LABEL_AT.y, z: LABEL_AT.z, px: LABEL_PX, text: "Denver", enterAtLast: 1 } as const;

const DenverPopUpStorms: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f; // story clock = this cut's frame
  const v = makeView(cut1CamAt(S));
  // in-cloud lightning around "thunderstorms" (f53): three short events, spaced, in two cells (no strike: cut 2's)
  const cells = popupCellsAt(S).map((c) => (FLICKERS[c.id] ? { ...c, flicker: flickerAt(S, FLICKERS[c.id]) } : c));
  const enter = smooth(-6, 3, f);
  return <AirStage S={S} v={v} cells={cells} over={<WorldLabel v={v} x={LABEL_AT.x} y={LABEL_AT.y} z={LABEL_AT.z} text="Denver" enter={enter} px={LABEL_PX} halo={1} />} />;
};
export default DenverPopUpStorms;
