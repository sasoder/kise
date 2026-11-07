// ---------------------------------------------------------------------------
// FrontPages (caro-firing-moses, cut 93.667). NEW graphic in the show's silhouette pictogram look (the hydra;
// COMMON.md look 1; ground, bloom and the Mayor's hand from firingShared.tsx, the Moses bust from
// robert-graft-machine/graftShared.tsx, the slip and the front page from newsShared.tsx).
// Opaque 1080x1920, 24 fps, 293 frames (ends at the sequence end).
//
// CHECK LINE: "the next morning every front page would carry the same story: Moses the hero, driven out by a petty
// politician."
//
// THE LINE: "The mayor knew that if Moses resigned, the next morning, all the front pages would tell the same story
// about how a man above politics was driven out by a craven politician because he refused to compromise the city's
// interests."
// WORD -> FRAME: mayor 1 · knew 8 · that 14 · if 25 · Moses 31 · resigned 40 · the 56 · next 60 · morning 67 ·
// all 79 · the 84 · front 89 · pages 93 · would 101 · tell 109 · the 114 · same 117 · story 122 · about 128 ·
// how 136 · a 140 · man 144 · above 152 · politics 161 · was 173 · driven 182 · out 188 · by 194 · a 199 ·
// craven 201 · politician 209 · because 216 · he 229 · refused 234 · to 239 · compromise 250 · the 259 ·
// city's 268 · interests 275.
// DURATION: the slot 93.667 -> 105.875 s = 12.208 s x 24 = 293 frames (f0..f292).
//
// THE MOTION: f0 is fully drawn: the stamped resignation slip (Forfeit's artwork, ACCEPTED) in the Mayor's hand,
// centre. "resigned": the hand lets go and slides out to the left (f42-56), the slip stays. "the next morning, all
// the front pages": six newspapers slap down on it one after another (land f60, 68, 76, 84, 92, 100; each drops
// from 1.16x with a small settle, fanned a few degrees), every one the SAME front page: an unreadable blackletter
// masthead, MOSES QUITS, the sub-head REFUSED TO COMPROMISE THE CITY, and a picture of Moses on a pedestal, his
// white glow behind him. "the same story": a slow push-in on the top paper's picture
// (f106-206) where the story plays: a small hunched man in a hat walks in from the left (f134-166, "a man above
// politics" = Moses up on his plinth, the little man below), raises his arm (f174-181) and shoves the plinth,
// CONTACT f182 (first reaction f183): he keeps shoving, and Moses on his plinth slides right until he is half out
// of the picture at its edge, f182-196 ("driven out"). "craven politician" (f201-213): the little man hunches lower,
// arm back at his side, a step back. "refused to
// compromise the city's interests": the camera eases back (f222-262) to the whole top paper, the headline readable,
// the stack fanned behind; a living hold (grain, a slow creep, the little man's breathing) to f292. No fades.
//
// SOURCES: none (no figures; no real newspaper names: the mastheads are abstract strokes).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, spring, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FIRING_GLOW, FiringGlowDefs, FiringGround, MayorHand } from "./firingShared";
import { MosesBust } from "../robert-graft-machine/graftShared";
import { FrontPage, INK, PIC, SLIP_IMPRINT_S, Politician, Pt, Slip, WHITE, clamp01, lerp, lift, n, prog } from "./newsShared";

export const FPS = 24;
export const DURATION = 293;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const GRAIN_G0 = 2000;

// ---- layout (world px) ----------------------------------------------------------------------------------------
// the slip sits where the papers land (650 px wide, centred on the page's upper half)
const SLIP_C: Pt = [528, 640];
const SLIP_S = 650 / 560;
const HAND_S = 0.6;
// the hand comes in from the upper left, turned 50 deg down, pinching the slip's top edge near its left corner
const HAND_ROT = 50;
const HAND_TIP0: Pt = [SLIP_C[0] - (560 * SLIP_S) / 2 + 92, SLIP_C[1] - (240 * SLIP_S) / 2 + 30];
const PAGE_S = 1.3; // 780 x 1040
const PAGE_C: Pt = [528, 745];
// the six papers: resting centre offset from PAGE_C, rotation, land frame (the last one is the top paper)
const PAPERS: { dx: number; dy: number; rot: number; land: number; seed: string }[] = [
  { dx: -4, dy: 26, rot: -3.5, land: 60, seed: "pa" },
  { dx: 4, dy: 20, rot: 3.2, land: 68, seed: "pb" },
  { dx: -3, dy: 34, rot: -2, land: 76, seed: "pc" },
  { dx: 4, dy: 14, rot: 3.5, land: 84, seed: "pd" },
  { dx: -2, dy: 22, rot: -1.5, land: 92, seed: "pe" },
  { dx: 0, dy: 0, rot: 0, land: 100, seed: "pf" },
];
const DROP = 5; // frames from 1.16x to landing

// ---- the picture (page-local units; the picture box is PIC, its floor near the bottom) -------------------------
const FLOOR = PIC.y + PIC.h - 22;
const PED = { x: 40, w: 186, h: 112 }; // the plinth, centre x, on the floor
const BUST_S = 0.175; // graftShared Moses bust (816 x 942 at 4K) -> 143 x 165
const POL_S = 1.08; // ~160 tall: clearly smaller than Moses on his plinth (~277)
const POL_X0 = PIC.x - 70; // off the picture's left edge (clipped)
// he stops with his outstretched hand on the plinth's side (reach ~97 page units at his push lean)
const POL_STOP = -150;
const PUSH = 182;
const OUT = 196;
// Moses ends half out of the picture at its right edge (the box clips him): pushed out of the story
const MOSES_END = PIC.x + PIC.w + 4;

// The bust's tones remapped to the hydra's (graftShared ink 7 -> 15, white 247 -> 242).
const RETONE_ID = "fpRetone";
const RetoneDefs: React.FC = () => (
  <filter id={RETONE_ID} colorInterpolationFilters="sRGB">
    <feComponentTransfer>
      <feFuncR type="linear" slope={0.9459} intercept={0.0328} />
      <feFuncG type="linear" slope={0.9459} intercept={0.0328} />
      <feFuncB type="linear" slope={0.9459} intercept={0.0328} />
    </feComponentTransfer>
  </filter>
);

// Moses on his plinth with his glow; (x) = plinth centre on the floor
const MosesOnPlinth: React.FC<{ x: number; id: string }> = ({ x, id }) => {
  const top = FLOOR - PED.h;
  const headY = top - 942 * BUST_S + 62;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}glow`}>
          <stop offset="0%" stopColor={WHITE} stopOpacity={0.55} />
          <stop offset="45%" stopColor={WHITE} stopOpacity={0.22} />
          <stop offset="100%" stopColor={WHITE} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={n(x)} cy={n(headY)} r={128} fill={`url(#${id}glow)`} />
      <rect x={n(x - PED.w / 2)} y={n(top)} width={PED.w} height={PED.h} fill={INK} />
      <rect x={n(x - PED.w / 2 - 10)} y={n(top)} width={PED.w + 20} height={11} fill={INK} />
      <rect x={n(x - PED.w / 2 - 10)} y={n(FLOOR - 12)} width={PED.w + 20} height={12} fill={INK} />
      <rect x={n(x - PED.w / 2 + 14)} y={n(top + 24)} width={PED.w - 28} height={2.5} fill={lift(74)} />
      <g filter={`url(#${RETONE_ID})`}>
        <MosesBust x={x} y={top} s={BUST_S} />
      </g>
    </g>
  );
};

const Picture: React.FC<{ id: string; mosesX: number; pol?: { x: number; arm: number; lean: number; bob: number } }> = ({
  id,
  mosesX,
  pol,
}) => (
  <g>
    <rect x={PIC.x} y={FLOOR} width={PIC.w} height={PIC.y + PIC.h - FLOOR} fill={INK} />
    {pol && <Politician x={pol.x} y={FLOOR + pol.bob} s={POL_S} arm={pol.arm} lean={pol.lean} />}
    <MosesOnPlinth x={mosesX} id={id} />
  </g>
);

// ---- the camera: focus world point (fx, fy) shown at screen (540, sy), zoom k -------------------------------------
type Cam = { k: number; fx: number; fy: number; sy: number };
const PIC_CENTRE_W: Pt = [PAGE_C[0], PAGE_C[1] + (PIC.y + PIC.h / 2) * PAGE_S];
// wide: the page's centre shown at screen x 515 (the middle of the safe x 110-920)
const CAM_WIDE: Cam = { k: 1, fx: 553, fy: 760, sy: 760 };
// the push: the picture box centred on screen x 515, whole inside x 125-905 (k 1.2), the headline whole above it
const CAM_PIC_K = 1.2;
const CAM_PIC: Cam = { k: CAM_PIC_K, fx: PIC_CENTRE_W[0] + 25 / CAM_PIC_K, fy: PIC_CENTRE_W[1], sy: 720 };
const mixCam = (a: Cam, b: Cam, t: number): Cam => ({
  k: lerp(a.k, b.k, t),
  fx: lerp(a.fx, b.fx, t),
  fy: lerp(a.fy, b.fy, t),
  sy: lerp(a.sy, b.sy, t),
});
const camAt = (f: number): Cam => {
  const io = Easing.inOut(Easing.sin);
  if (f < 106) return CAM_WIDE;
  if (f < 222) {
    const c = mixCam(CAM_WIDE, CAM_PIC, io(clamp01((f - 106) / 100)));
    return { ...c, k: c.k + 0.015 * io(clamp01((f - 160) / 62)) }; // keeps creeping in after the push
  }
  const from = { ...CAM_PIC, k: CAM_PIC.k + 0.015 };
  const c = mixCam(from, CAM_WIDE, io(clamp01((f - 222) / 40)));
  return { ...c, k: c.k + 0.015 * io(clamp01((f - 250) / 42)) };
};

const FrontPages: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = frame;
  const cam = camAt(f);

  // ---- the hand: holds the slip with a slight living sway, lets go and slides out left on "resigned" ----
  const sway = 1.2 * Math.sin(f * 0.11);
  const out = prog(f, 42, 56, Easing.in(Easing.cubic));
  const tip: Pt = [HAND_TIP0[0] - 520 * out, HAND_TIP0[1] - 360 * out + sway];
  const slipRot = f < 42 ? 0.6 * Math.sin(f * 0.11) : 0.6 * Math.sin(42 * 0.11) * (1 - prog(f, 42, 50, Easing.out(Easing.quad)));
  const slipY = SLIP_C[1] + (f < 42 ? sway * 0.5 : sway * 0.5 * (1 - prog(f, 42, 50)));

  // ---- the papers ----
  const papers = PAPERS.map((p, i) => {
    const t0 = p.land - DROP;
    if (f < t0) return null;
    const drop = prog(f, t0, p.land, Easing.in(Easing.quad));
    const t = f - p.land;
    // falls from 1.16x to the table, then a small bounce of the sheet
    const s = f < p.land ? lerp(1.16, 1, drop) : 1 - 0.02 * Math.exp(-t / 2.5) * Math.sin(t * 1.4);
    const settle = f >= p.land ? spring({ frame: t, fps: FPS, config: { damping: 12, stiffness: 200, mass: 0.6 } }) : 0;
    const rot = f < p.land ? lerp(p.rot * 1.6, p.rot * 1.24, drop) : lerp(p.rot * 1.24, p.rot, settle);
    return { i, x: PAGE_C[0] + p.dx, y: PAGE_C[1] + p.dy - 26 * (1 - drop), s: PAGE_S * s, rot, seed: p.seed };
  });

  // ---- the story on the top paper ----
  const walk = prog(f, 134, 166, Easing.out(Easing.quad));
  const pushArm = prog(f, 174, 181, Easing.out(Easing.cubic));
  const slide = prog(f, PUSH, OUT, Easing.inOut(Easing.quad));
  const follow = prog(f, PUSH, OUT, Easing.inOut(Easing.quad));
  const craven = prog(f, 201, 213, Easing.inOut(Easing.cubic));
  // while pushing he keeps his hand on the plinth: he moves exactly as far as it does, then backs off a little
  const polX = lerp(POL_X0, POL_STOP, walk) + (MOSES_END - PED.x) * follow - 16 * craven;
  const steps = f >= 134 && f < 166 ? Math.abs(Math.sin(((f - 134) * Math.PI) / 5)) * (1 - walk) : 0;
  const breathe = f >= 213 ? 0.8 * Math.sin((f - 213) * 0.16) : 0;
  const pol = {
    x: polX,
    arm: pushArm * (1 - craven),
    lean: 6 + 10 * pushArm * (1 - follow * 0.4) + 12 * craven + breathe,
    bob: -5 * steps,
  };
  const mosesX = lerp(PED.x, MOSES_END, slide);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <FiringGround G={GRAIN_G0 + frame} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <FiringGlowDefs />
        <defs>
          <RetoneDefs />
        </defs>
        <g filter={`url(#${FIRING_GLOW})`}>
          <g transform={`translate(540 ${n(cam.sy)}) scale(${n(cam.k)}) translate(${n(-cam.fx)} ${n(-cam.fy)})`}>
            <Slip id="slip" x={SLIP_C[0]} y={slipY} s={SLIP_S} rot={slipRot} inked imprintS={SLIP_IMPRINT_S} />
            {out < 1 && <MayorHand x={tip[0]} y={tip[1]} s={HAND_S} rot={HAND_ROT} />}
            {papers.map(
              (p) =>
                p && (
                  <FrontPage
                    key={p.seed}
                    id={`page${p.i}`}
                    seed={p.seed}
                    x={p.x}
                    y={p.y}
                    s={p.s}
                    rot={p.rot}
                    subhead
                    picture={
                      <Picture
                        id={`pic${p.i}`}
                        mosesX={p.i === PAPERS.length - 1 ? mosesX : PED.x}
                        pol={p.i === PAPERS.length - 1 && f >= 134 ? pol : undefined}
                      />
                    }
                  />
                ),
            )}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default FrontPages;

