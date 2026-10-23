// ---------------------------------------------------------------------------
// RomansHadThePeople (kyle-greek-math, cut 74). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 74 frames. The world: ./athensRomeWorld.tsx (+ ./athensRomePlan.ts), built with cut E
// (AthensNotMassive), read-only here. The camera: ./romansHadThePeoplePlan.ts.
//
// CHECK LINE: "the Romans had vastly more people than Athens (a crowd to the horizon) but none of the Greeks' orange
// science."
//
// THE LINE: "[And] then the Romans had the people but not the science. [Yeah.]"
// (between E and F the speaker is on camera, 66.1-73.4 s: "...the Greeks had the science but not the people...")
// WORD -> FRAME (from the composition start; Whisper onsets, ~0.2 s early): then the 3..15 · ROMANS 15..21 · had the
// 21..30 · PEOPLE 30..37 · but 37..43 · NOT 43..49 · the SCIENCE 49..61 · Yeah 73
// DURATION: the slot 74.074 -> 76.543 s: 2294 - 2220 = 74 frames (f0..f73) at 29.97.
//
// THE MOTION: one move on one bell, f0-54, then a creep. f0 is cut E's last frame exactly (E_END: the camera with its
// sway and the life frame; assertJoinE at module load; the still-vs-still difference is zero). From there the camera
// trucks right 35 m, rises 13.6 m (21.6 -> 35.2 m), pulls back 23 m and widens the lens (F 1100 -> 700 px, a few frames
// ahead of the rest) while the horizon row comes down (370 -> 606): Athens slides to the left and shrinks, and the vast
// Roman crowd's edge sweeps in from the right edge at f16 ("Romans": its front corner and its far rows together); by
// f30 ("people") the grey Roman sea fills the right half back to the Colosseum in the haze; the move decelerates onto a
// slow drift right (~1 px/frame) by ~f50 and the comparison holds, living, through "but not the science" (f37-61) to
// f73: small Athens at the left (its rock, the Parthenon, its 223 people with the eight scholars' orange glints), the
// empty plain and the track between, the Roman crowd to the horizon on the right/centre with no orange anywhere.
// Peak screen speed 18 px/frame (the Athenian crowd's middle, f9); one acceleration and one deceleration lobe. Life:
// E's seed-stable crowd sway and head turns, motes, shafts and grain on the life frame E_END.life + f. As the camera
// rises the near plain sinks into the dense low air (LowAirDeepen: from y 1120 to 0.8 at the bottom edge by ~f45, the
// grain laid again over it; exactly 0 at f0, so the join is exact), so the near tufts fade and the eye stays on the band.
// No text. Orange = Greek mathematical knowledge: only the Athenian scholars' small tablets.
//
// DEPTH: the world's (athensRomePlan.ts): a pinhole Cam3, no pitch; fog by depth behind Z -4200 (ATHENS_SCENE);
// the camera: ./romansHadThePeoplePlan.ts (F_LAND, F_MOVE, F_CREEP). Front figures of both crowds end ~22-23 px.
//
// SOURCES: none new; no figure on screen. The two crowds are tokens (223 Athenians; ~5,000 of the world's 16,109
// Romans in frame), not to scale. Athens' population and the Parthenon / Colosseum: see AthensNotMassive.tsx.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AthensRomeScene, E_END, assertJoinE, athensAirOf, athensSpriteReqs, swayCam3, type Cam3 } from "./athensRomeWorld";
import { hash01 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { moveProgress, pathF } from "./romansHadThePeoplePlan";

export const FPS = 30000 / 1001;
export const DURATION = 74;
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
  /** probe only: a camera path-pose as JSON ({x,h,z,F,hy}); "" = the cut's camera */
  probe: z.string().default(""),
});
export const defaultProps = schema.parse({});

/** F's camera: its path plus E's hand-held sway on the life frame (E_END.life + f) */
export const cameraF = (f: number): Cam3 => swayCam3(pathF(f), E_END.life + f);
// F opens on E's last frame exactly (camera with the sway, and the life frame)
assertJoinE(cameraF(0), E_END.life);

/** every crowd sprite the cut's camera path shows, baked once per render tab */
const REQS = athensSpriteReqs(Array.from({ length: DURATION }, (_, f) => ({ cam: cameraF(f), life: E_END.life + f })));
const PROBE_REQS = new Map<string, ReturnType<typeof athensSpriteReqs>>();

/** the near plain sinks into the dense low air as the camera rises (over the world's own LowAirSink), so the near tufts
 *  fade into the dark air and the eye stays on the comparison band (y ~620-1060): the air at the frame's foot, starting
 *  softly at y 1120 and reaching SINK.max at the bottom edge, growing with the move from exactly 0 at f0 (so f0 is E's
 *  last frame; full by ~f45). The layer sits above the stage's grain, so the stage's own grain (pandemicAir's AirStage:
 *  the same image, the same per-two-frames offsets, overlay at 0.3) is laid again over it through the same profile,
 *  and the grain stays visible in the dark air. */
export const SINK = {
  max: 0.8,
  /** (screen y, share of max) */
  stops: [
    [1120, 0],
    [1250, 0.12],
    [1400, 0.35],
    [1550, 0.58],
    [1700, 0.78],
    [1820, 0.92],
    [1920, 1],
  ] as [number, number][],
};
const GRAIN = { src: "cheekypint2/grain.png", w: 1296, h: 2304, opacity: 0.3 };
const LowAirDeepen: React.FC<{ cam: Cam3; life: number; amount: number }> = ({ cam, life, amount }) => {
  if (amount <= 0.001) return null;
  const [r, g, b] = athensAirOf(cam, life).v.airAtScreen(1920).map(Math.round);
  const a = SINK.max * amount;
  const grad = (rgb: string) => `linear-gradient(to bottom, ${SINK.stops.map(([y, k]) => `rgba(${rgb},${(k * a).toFixed(4)}) ${y}px`).join(", ")})`;
  const g2 = Math.floor(life / 2);
  const grx = (hash01(g2 + 1) * 2 - 1) * 96;
  const gry = (hash01(g2 + 7) * 2 - 1) * 96;
  return (
    <>
      <AbsoluteFill style={{ background: grad(`${r},${g},${b}`) }} />
      <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: GRAIN.opacity, WebkitMaskImage: grad("0,0,0"), maskImage: grad("0,0,0") }}>
        <Img src={staticFile(GRAIN.src)} style={{ position: "absolute", left: (1080 - GRAIN.w) / 2 + grx, top: (1920 - GRAIN.h) / 2 + gry, width: GRAIN.w, height: GRAIN.h }} />
      </AbsoluteFill>
    </>
  );
};

const RomansHadThePeople: React.FC<z.infer<typeof schema>> = ({ camFrame, probe }) => {
  const frame = useCurrentFrame();
  const life = E_END.life + frame;
  if (probe) {
    const cam = swayCam3(JSON.parse(probe) as Cam3, life);
    const reqs = PROBE_REQS.get(probe) ?? athensSpriteReqs([{ cam, life }]);
    PROBE_REQS.set(probe, reqs);
    return <AthensRomeScene cam={cam} life={life} reqs={reqs} />;
  }
  const cf = camFrame >= 0 ? camFrame : frame;
  const cam = cameraF(cf);
  return (
    <AbsoluteFill>
      <AthensRomeScene cam={cam} life={life} reqs={REQS} />
      <LowAirDeepen cam={cam} life={life} amount={moveProgress(cf)} />
    </AbsoluteFill>
  );
};

export default RomansHadThePeople;
