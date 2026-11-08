// ---------------------------------------------------------------------------
// Hydra (caro-firing-moses, cut 15.125; revision 1 of the hydra). The three delivered hydra cuts (HydraDozenHeads,
// TwelvePosts, HydraHands — kept as they are) played back to back on ONE timeline under one continuous camera, with
// two small additions: the eyes count off on "12" and flare together on "same time", and the snipped-at head
// flinches from the blades. Look unchanged (firingShared.tsx). Opaque 1080x1920, 24 fps, 366 frames.
//
// CHECK LINE: "Moses was one body with a dozen heads; each head is a separate post — three of them named; the heads
// hang from two different people, the Mayor and the Governor, so no single pair of scissors can cut them all."
//
// THE LINE: "...Moses was a hydra with a dozen heads. He held 12 different government posts at the same time. City
// construction coordinator, chairman of the state council of parks, chairman of the state power authority, and so
// on. Some of these positions were appointed by the mayor, some of them by the governor, and so no single person
// could cut off the head simultaneously."
// WORD -> FRAME (from 15.125): hydra -9 · with -1 · a 9 · dozen 12 · heads 19 · He 27 · held 29 · 12 35 ·
// different 43 · government 50 · posts 57 · at 67 · the 77 · same 80 · time 85 · City 93 · construction 95 ·
// coordinator 102 · chairman 123 · of 133 · the 138 · state 139 · council 143 · of 149 · parks 153 · chairman 164 ·
// of 171 · the 176 · state 177 · power 181 · authority 189 · and 202 · so 213 · on 215 · Some 222 · of 226 ·
// these 229 · positions 231 · were 237 · appointed 246 · by 251 · the 256 · mayor 258 · some 265 · of 274 · them 277 ·
// by 279 · the 282 · governor 285 · and 291 · so 300 · no 303 · single 310 · person 316 · could 325 · cut 331 ·
// off 335 · the 339 · head 341 · simultaneously 345 · (And 366).
// DURATION: the slot 15.125 -> 30.375 s = 15.25 s x 24 = 366 frames (f0..f365).
//
// THE ACTS (frames of this cut): HydraDozenHeads f0-62 (its f0-62), TwelvePosts f63-221 (its f0-158), HydraHands
// f222-365 (its f0-143): every word lands on the same frame as in the three V1 cuts. The world clock G = f, f-1, f-2
// in the three acts (the old joins repeat one world frame; under the moving camera and the per-frame grain that
// reads as nothing).
//
// THE CAMERA (hydraCamera.ts, one monotone-cubic track per channel, never parked): close on the body as the first
// necks rise (k 1.34), easing back so the fan is whole by "heads" (f24, k 1.02); a slow drift left to right across the
// fan with the count-off ripple (f34-60); a touch back for the flare (f82); push toward the left head on "City"
// (f100, k 1.1) as its title lands; glide right to the parks head on "chairman" (f130) and on down to the power head on
// the second "chairman" (f178); ease back out to the whole hydra on "and so on" (f216, k 1.0); open out on "Some of
// these positions" (f238, k 0.95); toward the Mayor's hand as it lands (f258), across to the Governor's (f285); a
// slow push in toward the necks through "no single person" (f312, k 1.04) and tighter on the snip (f333, k 1.07: as
// tight as the two hand labels, each over its own hand, allow inside the safe area); pull
// back to the whole hydra with both hands on "simultaneously" (f358, k 1.0) and a slow drift to f365. The camera
// window is kept so every label and both fingertips sit inside x 100-920, y 220-1520 on every frame (checked per
// frame in the builder's scratch: scripts/bounds.ts).
//
// THE ADDITIONS: on "12" (f35-63) the twelve eyes flash one after another, left to right, 2 f apart: each eye swells
// to 3x in 2 f and eases back over 4 f, its head dips 4 deg forward as it counts, and the eye is a light source: white
// light with an exponential falloff I(r) = exp(-r/50) (world px, no edge: it reaches 0 at r 300) spills onto its own
// neck, the neighbouring heads and the grey ground (visible to ~200 px). White at alpha I composited normally is
// exactly a screen blend, so the ground brightens additively and overlapping lights add up like light. The light is
// laid twice: full under the hydra (the ground) and at 35% over it (the black silhouettes pick up a faint light,
// brighter on the side facing the eye). On "at the same time" all twelve light together once (up f78-81, held to f83,
// settled by f91), each at half a count's light, overlapping into one glow over the fan, with the heads' existing unison dip.
// Rev 2 (user): the earlier disc halo read as "a circle lit around each head"; replaced by this falloff. The snip: the scissors (re-placed so their rings stay in frame at the tight framing)
// jam on the necks on "cut" (CONTACT f335); on f336 the head whose neck the blades close on recoils away from them
// (the head rears back 18 deg and its upper neck gives 3 deg about the fork, out in 3 f) and settles back over 11 f — one
// reaction, no damage; V1's six-head jerk is dropped for it.
//
// LAYOUT CHANGES against V1 (only so the camera can move with every label inside the safe area): mirrored as in V1,
// "the Mayor" from x 128 (baseline 392) over the Mayor's hand on the left, "the Governor" right-aligned ending x 884
// (baseline 466) over the Governor's hand on the right (on screen it ends at x <= 910 on every frame); the scissors
// rest at (650, 850).
// SOURCES: the three titles are Caro's (The Power Broker), as spoken; no figures.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  FIRING_GLOW,
  FiringGlowDefs,
  FiringGround,
  HeadState,
  Hydra as HydraFan,
  TP_G0,
  HH_G0,
} from "./firingShared";
import { PostLabels, tpHeads } from "./TwelvePosts";
import { HANDS_SNIP, HandsLayout, handsAct } from "./HydraHands";
import { camTransform } from "./hydraCamera";
import { eyeWorld, neckPose } from "./firingShared";

export const FPS = 24;
export const DURATION = 366;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// the acts on this timeline
export const ACT2 = 63;
export const ACT3 = 222;
if (TP_G0 !== 62 || HH_G0 !== 220) throw new Error("Hydra: the V1 world clock changed");
const worldG = (h: number) => (h < ACT2 ? h : h < ACT3 ? TP_G0 + (h - ACT2) : HH_G0 + (h - ACT3));

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const out3 = Easing.out(Easing.cubic);
const inOut = Easing.inOut(Easing.cubic);

// ---- the count-off and the flare ------------------------------------------------------------------------------
// a flash: up in `up` frames, down over `down` (eased), 0 outside
const flash = (h: number, at: number, up: number, hold: number, down: number) => {
  const t = h - at;
  if (t <= 0) return 0;
  if (t < up) return out3(t / up);
  if (t < up + hold) return 1;
  return 1 - inOut(clamp01((t - up - hold) / down));
};
export const COUNT_F = 35;
export const COUNT_STEP = 2;
const countAt = (i: number, h: number) => flash(h, COUNT_F + i * COUNT_STEP, 2, 0, 4);
export const FLARE_F = 78;
const flareAt = (h: number) => flash(h, FLARE_F, 3, 2, 8);
const COUNT_NOD = 4; // deg, the head dips forward as it counts

// ---- the hands act, re-placed for the moving camera ------------------------------------------------------------
const HANDS_HYDRA: HandsLayout = {
  mayorLabel: { x: 128, y: 392, anchor: "start" },
  govLabel: { x: 884, y: 466, anchor: "end" },
  scRest: [650, 850],
  jamJerks: false,
};
export const SNIPPED_HEAD = 6;
const FLINCH_F = ACT3 + HANDS_SNIP[1] + 1; // the frame after contact
const flinch = (h: number) => {
  const t = h - FLINCH_F;
  if (t < 0) return 0;
  if (t < 3) return out3(t / 3);
  return 1 - inOut(clamp01((t - 3) / 11));
};

// ---- the light an eye casts --------------------------------------------------------------------------------------
const LIGHT_R = 300; // world px, where the falloff reaches 0
const LIGHT_R0 = 50; // world px, I(r) = exp(-r / r0)
const LIGHT_PEAK = 0.72; // alpha of the white light at the eye at a full glint
const LIGHT_ON_INK = 0.35; // the share laid over the silhouettes
const FLARE_LIGHT = 0.5; // in the unison flash each eye casts half a count's light: twelve overlap into one glow
const LIGHT_ID = "hydraEyeLight";
const LIGHT_STOPS = 64;
const tail = Math.exp(-LIGHT_R / LIGHT_R0);
const lightStops = Array.from({ length: LIGHT_STOPS + 1 }, (_, j) => {
  const t = j / LIGHT_STOPS;
  const I = (Math.exp((-t * LIGHT_R) / LIGHT_R0) - tail) / (1 - tail);
  return { offset: t, a: Math.max(0, I) };
});
const LightDefs: React.FC = () => (
  <defs>
    <radialGradient id={LIGHT_ID} cx="50%" cy="50%" r="50%">
      {lightStops.map((q) => (
        <stop key={q.offset} offset={q.offset.toFixed(5)} stopColor="#ffffff" stopOpacity={q.a.toFixed(5)} />
      ))}
    </radialGradient>
  </defs>
);
const EyeLights: React.FC<{ G: number; heads: HeadState[]; light: number[]; gain: number }> = ({ G, heads, light, gain }) => (
  <g>
    {heads.map((s, i) => {
      const g = clamp01(light[i] ?? 0);
      if (g <= 0.001 || s.grow <= 0.001) return null;
      const e = eyeWorld(neckPose(i, G, s.grow, s.nod ?? 0, s.bend ?? 0), 1 + 0.08 * clamp01(s.lit ?? 0));
      return (
        <circle
          key={i}
          cx={e.x.toFixed(2)}
          cy={e.y.toFixed(2)}
          r={LIGHT_R}
          fill={`url(#${LIGHT_ID})`}
          opacity={(gain * LIGHT_PEAK * g).toFixed(4)}
        />
      );
    })}
  </g>
);

const HydraCut: React.FC<z.infer<typeof schema>> = () => {
  const h = useCurrentFrame();
  const G = worldG(h);

  let heads: HeadState[];
  let layer: React.ReactNode = null;
  if (h < ACT3) {
    heads = tpHeads(G);
  } else {
    const fl = flinch(h);
    const base = tpHeads(G).map((s, i) => (i === SNIPPED_HEAD ? { ...s, bend: -3 * fl, nod: (s.nod ?? 0) - 18 * fl } : s));
    const act = handsAct(h - ACT3, HANDS_HYDRA, base);
    heads = act.heads;
    layer = act.layer;
  }
  const light: number[] = [];
  heads = heads.map((s, i) => {
    const c = countAt(i, h);
    light[i] = Math.max(c, FLARE_LIGHT * flareAt(h));
    return { ...s, glint: Math.max(c, flareAt(h)), nod: (s.nod ?? 0) + (i < 6 ? -1 : 1) * COUNT_NOD * c };
  });

  return (
    <AbsoluteFill>
      <FiringGround G={h} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <FiringGlowDefs />
        <LightDefs />
        <g transform={camTransform(h)}>
          <EyeLights G={G} heads={heads} light={light} gain={1} />
          <g filter={`url(#${FIRING_GLOW})`}>
            <HydraFan G={G} heads={heads} underTags={h >= ACT2 && h < ACT3 ? <PostLabels G={G} heads={heads} /> : null} />
            {layer}
          </g>
          <EyeLights G={G} heads={heads} light={light} gain={LIGHT_ON_INK} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default HydraCut;
