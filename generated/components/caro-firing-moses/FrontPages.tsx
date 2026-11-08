// ---------------------------------------------------------------------------
// FrontPages (caro-firing-moses, cut 93.667), rev 1. NEW graphic in the show's silhouette pictogram look (the hydra;
// COMMON.md look 1; ground, bloom and the Mayor's hand from firingShared.tsx, the Moses bust from
// robert-graft-machine/graftShared.tsx, the slip, the six newspapers and the camera from newsShared.tsx).
// Opaque 1080x1920, 24 fps, 134 frames (seq 93.667 -> 99.250).
//
// CHECK LINE: "every paper in town (the Times, the Herald Tribune, the Daily News ...) runs the same story the next
// morning: Moses quits."
//
// THE LINE: "The mayor knew that if Moses resigned, the next morning, all the front pages would tell the same story
// about..."
// WORD -> FRAME: mayor 1 · knew 8 · that 14 · if 25 · Moses 31 · resigned 40 · the 56 · next 60 · morning 67 ·
// all 79 · the 84 · front 89 · pages 93 · would 101 · tell 109 · the 114 · same 117 · story 122 · about 128 ·
// (how 136, after the end).
// DURATION: the user's new out-point 00:01:39:06 = 99.250 s; 99.250 - 93.667 = 5.583 s x 24 = 134 frames (f0..f133).
//
// THE MOTION: f0 as in v1: the stamped resignation slip (Forfeit's artwork, ACCEPTED) in the Mayor's hand, centre,
// 650 px wide on screen. "resigned": the hand lets go and slides out up-left (f42-56) while the camera begins to
// ease back. "the next morning, all the front pages": six DIFFERENT New York dailies of 1962 slap down one after
// another (land f58, 66, 74, 82, 90, 98; each drops from 1.16x and settles), in two staggered columns, three rows,
// each row covering only the lower part of the row above, so every nameplate, headline and picture stays in view:
// The New York Times "MOSES QUITS ALL POSTS", the Herald Tribune "CITY LOSES MOSES", the Journal-American "MOSES
// RESIGNS", the Daily News "MOSES QUITS", the Daily Mirror "MOSES OUT!", the New York Post "MASTER BUILDER QUITS";
// the same glowing Moses picture on every page. The camera pulls back and pans down with the landings, then on
// "the same story" (f106-128) eases back to the whole spread, six nameplates, one story, and drifts to f133.
// No fades.
//
// SOURCES: the six papers are the real New York dailies of 1962 (Moses's resignation threat, 1962), nameplates set
// in our own type (no logo lifts). Headline wordings are ours.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, spring, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FIRING_GLOW, FiringGlowDefs, FiringGround, MayorHand } from "./firingShared";
import {
  CamKey,
  Newspaper,
  PaperKind,
  Pt,
  RetoneDefs,
  SLIP_IMPRINT_S,
  Slip,
  camAt,
  camTransform,
  lerp,
  prog,
} from "./newsShared";

export const FPS = 24;
export const DURATION = 134;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const GRAIN_G0 = 2000;

// ---- the papers (world px; the whole spread is ~870 x 1370, shown at 0.92 at the end) ---------------------------
const PAPERS: { kind: PaperKind; x: number; y: number; rot: number; land: number }[] = [
  { kind: "times", x: 300, y: 600, rot: -2, land: 58 },
  { kind: "herald", x: 728, y: 632, rot: 2.2, land: 66 },
  { kind: "journal", x: 298, y: 1002, rot: 1.6, land: 74 },
  { kind: "news", x: 732, y: 960, rot: -2.2, land: 82 },
  { kind: "mirror", x: 300, y: 1322, rot: -1.4, land: 90 },
  { kind: "post", x: 728, y: 1348, rot: 1.8, land: 98 },
];
const DROP = 5; // frames from 1.16x to landing

// ---- the opening (as v1 on screen): the slip lies under the Times; the camera starts at K0 on it -----------------
const K0 = 1.8;
const SLIP_W: Pt = [300, 520]; // world centre of the slip
const SLIP_SCREEN: Pt = [515, 640]; // where v1 showed it
const SLIP_S = 650 / 560 / K0; // 650 px wide on screen at K0
const HAND_S = 0.6 / K0;
const HAND_ROT = 50;
// v1's fingertip relative to the slip centre (screen px), scaled into the world
const HAND_TIP_REL: Pt = [-(560 * (650 / 560)) / 2 + 92, -(240 * (650 / 560)) / 2 + 30];
const HAND_TIP0: Pt = [SLIP_W[0] + HAND_TIP_REL[0] / K0, SLIP_W[1] + HAND_TIP_REL[1] / K0];

// ---- the camera: world (fx, fy) at screen (sx, sy), zoom k --------------------------------------------------------
const C = (f: number, fx: number, fy: number, sx: number, sy: number, k: number): CamKey => ({ f, fx, fy, sx, sy, k });
const CAM: CamKey[] = [
  C(0, SLIP_W[0], SLIP_W[1], SLIP_SCREEN[0], SLIP_SCREEN[1], K0),
  C(40, SLIP_W[0], SLIP_W[1] + 1, SLIP_SCREEN[0], SLIP_SCREEN[1], K0 + 0.02),
  C(58, 320, 590, 515, 760, 1.4),
  C(68, 514, 640, 515, 800, 1.16),
  C(78, 514, 760, 515, 860, 1.15),
  C(90, 514, 860, 515, 900, 1.13),
  C(102, 514, 930, 515, 950, 1.1),
  C(110, 514, 940, 514, 940, 1.08),
  C(128, 514, 934, 512, 880, 0.92),
  C(133, 514, 932, 512, 880, 0.926),
];

const FrontPages: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = frame;
  const cam = camAt(CAM, f);

  // ---- the hand: holds the slip with a slight living sway, lets go and slides out up-left on "resigned" ----
  const sway = (1.2 * Math.sin(f * 0.11)) / K0;
  const out = prog(f, 42, 56, Easing.in(Easing.cubic));
  const tip: Pt = [HAND_TIP0[0] - (520 * out) / K0, HAND_TIP0[1] - (360 * out) / K0 + sway];
  const slipRot = f < 42 ? 0.6 * Math.sin(f * 0.11) : 0.6 * Math.sin(42 * 0.11) * (1 - prog(f, 42, 50, Easing.out(Easing.quad)));
  const slipY = SLIP_W[1] + (f < 42 ? sway * 0.5 : sway * 0.5 * (1 - prog(f, 42, 50)));

  // ---- the papers ----
  const papers = PAPERS.map((p, i) => {
    const t0 = p.land - DROP;
    if (f < t0) return null;
    const drop = prog(f, t0, p.land, Easing.in(Easing.quad));
    const t = f - p.land;
    const s = f < p.land ? lerp(1.16, 1, drop) : 1 - 0.015 * Math.exp(-t / 2.5) * Math.sin(t * 1.4);
    const settle = f >= p.land ? spring({ frame: t, fps: FPS, config: { damping: 14, stiffness: 200, mass: 0.6 } }) : 0;
    const rot = f < p.land ? lerp(p.rot * 1.8, p.rot * 1.3, drop) : lerp(p.rot * 1.3, p.rot, settle);
    return { i, kind: p.kind, x: p.x, y: p.y - 20 * (1 - drop), s, rot };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <FiringGround G={GRAIN_G0 + frame} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <FiringGlowDefs />
        <defs>
          <RetoneDefs />
        </defs>
        <g filter={`url(#${FIRING_GLOW})`}>
          <g transform={camTransform(cam)}>
            <Slip id="slip" x={SLIP_W[0]} y={slipY} s={SLIP_S} rot={slipRot} inked imprintS={SLIP_IMPRINT_S} />
            {out < 1 && <MayorHand x={tip[0]} y={tip[1]} s={HAND_S} rot={HAND_ROT} />}
            {papers.map(
              (p) =>
                p && <Newspaper key={p.kind} id={`np${p.i}`} kind={p.kind} x={p.x} y={p.y} s={p.s} rot={p.rot} />,
            )}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default FrontPages;
