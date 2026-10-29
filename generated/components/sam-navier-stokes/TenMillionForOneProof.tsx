// ---------------------------------------------------------------------------
// TenMillionForOneProof (sam-navier-stokes, cut 10). Cheeky Pint style (stout) (styles/cheeky-pint.md), in the
// "air" look of the Scott clips: the world is vortexSky.tsx (wifiSky's cruise sky + the Navier-Stokes vortex).
// Opaque 1080x1920, 23.976 fps, 110 frames. RENDER WITH --gl=angle.
//
// CHECK LINE: "That one proof, Navier–Stokes, burned through about $10 million of compute, maybe a bit more."
//
// THE LINE: "[John:] How much did all the math cost? [Sam:] Order 10 million for like Navier-Stokes, I think.
//            [John:] Okay. [Sam:] Maybe a little more."
// WORD -> FRAME: How -2 · much 1 · did 5 · all 7 · the 9 · math 10 · cost 13 · Order 22 · 10 26 · million 31 ·
//   for 37 · like 44 · Navier 50 · Stokes 74 · I 81 · think 84 · Okay 88 · Maybe 96 · a 99 · little 101 · more 103
//   (next line "But" 108)
// DURATION: the slot 10.343667 -> 14.931583 s = 4.588 s x 23.976 = 110 frames (f0..f109).
//
// THE MOTION: one vortex of lit cream streamline tubes (the proof), a spindle widest at the waist, stands out of the
// golden deck, turning steadily. From f0 the camera is close on its foot, already rising; on "cost" (f13) an amber
// front leaves the deck and climbs the tubes (cause: the money running up the streamlines) while the camera rises and
// eases back until the whole vortex is in shot (~f32), then creeps in. On "million" the ~$10M tick slides in (landed
// f31): a rule touching the vortex at 78 % of its height, and a thin cream level ring drawn round the vortex from it
// (f21 -> f33); NAVIER–STOKES lands under the rule on "Navier" (f50). The front climbs straight on past the ring and
// settles just above it by f80 (its final level, a cream crown above). REV 1 (user: "that kind of light flare effect
// that goes through the entire thing ... like it glistens"): on "Maybe a little more" (f96 -> f106) one shine sweeps the
// whole vortex base to crown, every tube catching a hot-white glint with soft amber edges, crossing the tick on "more"
// (f103); f107-f109 settled, the flow turning, the camera creeping (f109 = cut 19's f0, byte-identical).
// AMBER = compute money spent on the math; cream = the math / the proof (the flow).
//
// SOURCES: "~$10M" is Sam Altman's own on-show estimate ("order 10 million for like Navier-Stokes"), so on screen with
// a tilde as the speaker's figure; OpenAI published no dollar cost (COMMON.md facts, verified Oct 28 against coverage
// of OpenAI's Sept 8, 2026 post "On the Navier–Stokes Millennium Prize Problem"). The vortex is redrawn after the
// user's reference picture assets-src/sam-navier-stokes/user_vortex.png.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { airProject } from "../scott-aircraft-order/aircraftShared";
import { Glint, glintLife } from "../sam-benchmaxxing/sparkleShine";
import {
  CUT10_FILL_PARTS,
  CUT10_LOOK,
  CUT10_RING_DRAW,
  CUT10_SUB_ENTER,
  CUT10_TICK_ENTER,
  CostRing,
  CostTick,
  NS_TICK,
  NS_VORTEX,
  Vortex,
  VortexStage,
  cut10Cam,
  cut10Fill,
  cut10Shine,
  vortexAxis,
  vortexReach,
} from "./vortexSky";

export const FPS = 24000 / 1001;
export const DURATION = 110;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// rev 1: six tiny four-point glints ride the shine (sparkleShine's Glint), staggered across the width on the near
// face, each born where the band will be at its peak (~4-5 f lives); the last is gone by f106. k = across the width
// (-1 left .. 1 right, as a share of the reach); ring = on the level ring's edge instead of the near face.
const GLINTS = [
  { at: 97.0, life: 5, k: -0.35, r: 22, rot: 6, tone: "cream" as const },
  { at: 98.4, life: 5, k: 0.45, r: 26, rot: -8, tone: "cream" as const },
  { at: 99.6, life: 5, k: -0.62, r: 30, rot: 10, tone: "cream" as const },
  { at: 100.8, life: 4.5, k: 0.22, r: 24, rot: -4, tone: "cream" as const },
  {
    at: 101.6,
    life: 4.4,
    k: -1,
    r: 26,
    rot: 4,
    tone: "hot" as const,
    ring: true,
  },
  { at: 102.4, life: 3.6, k: 0.38, r: 20, rot: -10, tone: "hot" as const },
];
const glintAt = (g: (typeof GLINTS)[number]) => {
  const h = g.ring ? NS_TICK.h : (cut10Shine(g.at + 0.38 * g.life) ?? 0.5);
  const ax = vortexAxis(NS_VORTEX, h);
  const R = vortexReach(NS_VORTEX, h);
  if (g.ring) return [ax[0] + g.k * R, ax[1], ax[2]] as const;
  // on the near face (the camera looks along +Z)
  return [
    ax[0] + g.k * 0.55 * R,
    ax[1],
    ax[2] - Math.sqrt(1 - g.k * g.k) * 0.55 * R,
  ] as const;
};
const ShineGlints: React.FC<{ f: number }> = ({ f }) => {
  // nothing at all outside the glints' lives (f109 stays cut 19's f0, byte for byte)
  if (GLINTS.every((g) => glintLife(f, g.at, g.life) <= 0)) return null;
  const cam = cut10Cam(f);
  return (
    <svg
      width={1080}
      height={1920}
      viewBox="0 0 1080 1920"
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {GLINTS.map((g, i) => {
        const life01 = glintLife(f, g.at, g.life);
        if (life01 <= 0) return null;
        const w = glintAt(g);
        const p = airProject(cam, [w[0], w[1], w[2]]);
        return (
          <Glint
            key={i}
            x={p.x}
            y={p.y}
            r={g.r}
            life01={life01}
            t01={(f - g.at) / g.life}
            rot={g.rot}
            tone={g.tone}
            cross={g.r >= 26}
          />
        );
      })}
    </svg>
  );
};

const TenMillionForOneProof: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f;
  const cam = cut10Cam(f);
  return (
    <VortexStage
      cam={cam}
      S={S}
      rest={cut10Cam(0)}
      world={
        <>
          <Vortex
            at={NS_VORTEX.at}
            height={NS_VORTEX.height}
            seed={NS_VORTEX.seed}
            fill={cut10Fill(f)}
            shine={cut10Shine(f)}
            look={CUT10_LOOK}
            fillParts={CUT10_FILL_PARTS}
          />
          <CostRing v={NS_VORTEX} h={NS_TICK.h} draw={CUT10_RING_DRAW(f)} />
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
            enter={CUT10_TICK_ENTER(f)}
            subEnter={CUT10_SUB_ENTER(f)}
          />
          <ShineGlints f={f} />
        </>
      }
    />
  );
};

export default TenMillionForOneProof;
