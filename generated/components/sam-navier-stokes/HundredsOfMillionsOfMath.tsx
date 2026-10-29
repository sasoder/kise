// ---------------------------------------------------------------------------
// HundredsOfMillionsOfMath (sam-navier-stokes, cut 19). Cheeky Pint style (stout) (styles/cheeky-pint.md), in the
// "air" look of the Scott clips: the world is vortexSky.tsx (wifiSky's cruise sky + the Navier-Stokes vortex), shared
// with cut 10 (TenMillionForOneProof), which this cut continues pixel for pixel.
// Opaque 1080x1920, 23.976 fps, 110 frames. RENDER WITH --gl=angle.
//
// CHECK LINE: "After Navier–Stokes, each proof cost far less, but there were so many of them that together they add
//              up to hundreds of millions."
//
// THE LINE: "[Sam:] Like we spent way less than that on the average one of those. [John:] I see. But like hundreds of
//            millions of dollars of math."
// WORD -> FRAME: (Like -8) · we -4 · spent 5 · way 10 · less 22 · than 28 · that 31 · on 34 · the 36 · average 38 ·
//   one 43 · of 47 · those 49 · I 57 · see 59 · But 59 · like 62 · hundreds 64 · of 72 · millions 74 · of 77 ·
//   dollars 80 · of 85 · math 92 · (next "Yeah." 108)
// DURATION: the slot 19.853 -> 24.441 s = 4.588 s x 23.976 = 110 frames (f0..f109).
//
// THE MOTION: f0 is cut 10's last frame (the big Navier-Stokes vortex, amber just past its ~$10M ring and tick; S
// continues cut 10's story clock, the camera continues its creep; proven identical, still vs still). One damped camera
// move (hundredsPlan.ts) pulls back, trucks right, rises, turns right and tips down from looking up at the big one to
// looking out over the deck: the big one recedes and leaves frame left with its tick (gone ~f57). Smaller vortices of
// the same family (vortexSky detail "field": squat eddies, waist arms dominant, a blunt rounded crown, a skirt flaring
// into the deck; 0.27-0.58 of the big one's height) enter whole from the right edge, a staggered row first (the first
// body in ~f20, 3-4 readable beside the big one on "average", f38), then a field of ~230 of them to the horizon on
// "hundreds of millions" (f64-f92). Far ones sink into the haze by distance (vortexSky `haze`), their amber keeps its
// glow, so the far field reads as amber to the horizon; unfilled cream is lifted above the deck shadows (`lift`).
// Each small vortex's amber climbs to ~half its height (fill 0.40-0.44 of a body that tops out ~0.85, vs the big
// one's 84 %) over 12 f, starting 6 f before its body is in shot (its arms lead). The end (f98-f109): two near ones
// (~30-33 % of the frame) stand whole in the lower half, lower-left and right of centre; settled, living: spin, deck
// drift, a slow creep.
// AMBER = compute money spent on the math (the clip's decision); cream = the math / the proofs (the flows).
// Cause -> effect: a small vortex's amber starts as it comes into shot (fieldFill), never while it is unseen at f0.
//
// SOURCES: no figure on screen except cut 10's "~$10M" tick carried over (Sam Altman's own on-show estimate, see
// TenMillionForOneProof.tsx). "Hundreds of millions" is John's rough total: no number, no count (COMMON.md).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { type SideCam } from "../scott-aircraft-order/aircraftShared";
import { z } from "zod";
import { CUT10_END, CostRing, CostTick, NS_TICK, NS_VORTEX, Vortex, VortexStage, cut10Cam, vortexSpin } from "./vortexSky";
import { DUR19, FIELD, cam19, fieldFill, fieldVisible } from "./hundredsPlan";

export const FPS = 24000 / 1001;
export const DURATION = DUR19;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const REST = cut10Cam(0);

/** AERIAL PERSPECTIVE, per vortex (vortexSky's `haze`): a far one's cream tubes sink toward the haze with its ground
 *  distance from the camera, its amber keeps most of its glow, so the far field reads as amber points to the horizon.
 *  `LIFT` lifts the unfilled cream above the deck's shadows. Neither touches the big one (f0 is cut 10's f109). */
export const LIFT = 0.5;
/** the field's amber at the big one's brightness (vortexSky `glow`) */
export const GLOW = 1;
export const HAZE = { near: 12000, far: 36000, max: 0.78 } as const;
const hazeAt = (v: { at: readonly number[] }, cam: SideCam) => {
  const d = Math.hypot(v.at[0] - cam.x, v.at[2] - cam.z);
  const t = Math.max(0, Math.min(1, (d - HAZE.near) / (HAZE.far - HAZE.near)));
  return HAZE.max * t * t * (3 - 2 * t);
};

const HundredsOfMillionsOfMath: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = CUT10_END.S + f;
  const cam = cam19(f);
  return (
    <VortexStage
      cam={cam}
      S={S}
      rest={REST}
      world={
        <>
          {FIELD.map((v, i) =>
            fieldVisible(v, cam) ? (
              <Vortex
                key={i}
                at={v.at}
                height={v.height}
                seed={v.seed}
                spin={vortexSpin(v.seed, S) + v.phase}
                fill={fieldFill(v, f)}
                detail={v.detail}
                tube={v.tube}
                occlude={v.occlude}
                lift={LIFT}
                haze={hazeAt(v, cam)}
                glow={GLOW}
              />
            ) : null,
          )}
          <Vortex at={NS_VORTEX.at} height={NS_VORTEX.height} seed={NS_VORTEX.seed} fill={CUT10_END.fill} />
          <CostRing v={NS_VORTEX} h={NS_TICK.h} />
        </>
      }
      overlay={
        <>
        <CostTick
          at={NS_TICK.at}
          length={NS_TICK.length}
          text={NS_TICK.text}
          size={NS_TICK.size}
          sub={NS_TICK.sub}
          subSize={NS_TICK.subSize}
          inset={NS_TICK.inset}
          enter={1}
          subEnter={1}
        />
        </>
      }
    />
  );
};

export default HundredsOfMillionsOfMath;
