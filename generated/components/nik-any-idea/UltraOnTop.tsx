// ---------------------------------------------------------------------------
// UltraOnTop (nik-any-idea, cut 21). Cheeky Pint style, the stout board (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 120 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "Revolut added a new top plan, Ultra, above Metal."
//
// THE LINE (Nik Storonsky): "(idea) was okay, right? Ultra is effectively Ultra bank account where"
// WORD -> FRAME: was 6 · okay 11 · right 15 · Ultra 34 · is 47 · effectively 52 · Ultra 63 · bank 82 ·
// account 109 · where 119.
// DURATION: the slot 21.813 -> 26.818 s = 5.005 s x 23.976 = 120 frames (f0..f119).
//
// THE MOTION (rev 3: the cards look like the real Revolut cards, portrait, the wordmark down the right edge; rev 4:
// each plan's name printed ON its card, lower left, no legend): Revolut's plan ladder, four portrait cards fanned as a
// rising stair (Standard at the bottom, Plus, Premium, Metal on top), each lower card's name reading in the strip it
// shows. The camera eases back and right (k 1.9 -> 1.56, f0-26) as the deck makes room (it nudges down and opens its
// steps, f10-26) and the platinum ULTRA card swings out sideways from behind Metal (f8-34, one continuous arc: out to
// the right, clear of Metal's right edge at f21 where it passes in front, then back and up onto the top step),
// touching down ON "Ultra" (f34); its amber edge glow comes up with the landing (f31-37). Then ONE push-in on the
// Ultra card (f22-106, "effectively Ultra ... bank account") to k ~2.27, with a slow 3D tilt lifting it off the deck;
// the lower plans dim but stay readable (f34-52 to ~40 %), then sink (cards f58-76, their printed names a little
// sooner, gone by f68) while the tuck (f34-100) closes their steps to thin edges under Metal; METAL (dim 0.4) still
// reads in its strip under Ultra at the end. The one click: the light sweep across Ultra's platinum on "bank"
// (f81-93). f104-119 the push, the tilt and the sheen creep on.
// FRAMING: every frame's content inside x ~85-1060 and above y 1060 (the stack's lower edge peaks ~1057).
// AMBER = what makes an idea work / gets backed: here the Ultra card's edge glow. Cream/board = the plans.
//
// SOURCES: Revolut's personal plans, bottom to top Standard, Plus, Premium, Metal, Ultra (revolut.com plans
// pages; Ultra launched 16 June 2023 as the new top tier, its card platinum-plated). No prices on screen (Nik's
// "50 euros" is approximate; Revolut lists EUR 55-70 by country). Card look read off Revolut's official card photos
// in the clip's images/ folder (16.8a/b/d, 20.2d, 23.2b). The wordmark: ./revolutWordmark.ts, Wikimedia Commons
// https://commons.wikimedia.org/wiki/File:Revolut_logo.svg (public-domain text logo). Card proportions: ISO/IEC
// 7810 ID-1 (54 x 85.6 mm, r 3.18 mm).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ElevationShadow, StoutStage, clamp01, lerp, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam } from "../kits/cheeky-pint/museShared";
import { CARD, PLANS, PlanCard, ULTRA_B_END, UltraCard, cardH, cardSilhouette, type PlanId, type Tilt } from "./ultraCards";

/** The user asked for everything 190 px lower (Nov 13): the whole picture shifts down in screen px (StoutStage dy). */
const SHIFT_Y = 190;

export const FPS = 24000 / 1001;
export const DURATION = 120;
export const schema = z.object({
  /** Measurement only: the five cards flat (the ultraCards probe). */
  probe: z.boolean().default(false),
});
export const defaultProps = schema.parse({});

// --- the world (rev 3: portrait cards, W 200 x H 317) -------------------------------------------------------
const W = CARD.W;
const H = cardH(W);
const CX = 540;
const DX = 20; // the stair's step to the right
const Y0 = 1100; // Standard's centre at f0
const STEP0 = 48; // the deck's step at f0 (each lower card shows a strip)
const STEP1 = 54; // the opened step
const NUDGE = 14; // the deck nudges down as it makes room
const DECK: PlanId[] = ["standard", "plus", "premium", "metal"];
const ROOM = { f0: 10, f1: 26 } as const; // the deck makes room
const roomE = (f: number) => smoothstep((f - ROOM.f0) / (ROOM.f1 - ROOM.f0));
/** The stair before it tucks in (Premium at the centre; Ultra, i 4, one step right of Metal). */
const baseX = (i: number) => CX + (i - 2) * DX;
const baseY = (i: number, f: number) => {
  const e = roomE(f);
  return Y0 + NUDGE * e - i * lerp(STEP0, STEP1, e);
};
// Under the push-in the old plans tuck in beneath Ultra as they recede (f34-100): the stair straightens
// (DX -> TUCK_DX, about Ultra's x) and the three lower plans close up to thin edges under Metal.
const TUCK = { f0: 34, f1: 100 } as const;
const TUCK_DX = 6;
const TUCK_STEP = 12;
const tuckE = (f: number) => smoothstep((f - TUCK.f0) / (TUCK.f1 - TUCK.f0));
const dxAt = (f: number) => lerp(DX, TUCK_DX, tuckE(f));
const xOf = (i: number, f = 0) => baseX(4) - (4 - i) * dxAt(f);
const yOf = (i: number, f: number) => baseY(i, f) - (i < 3 ? (3 - i) * (STEP1 - TUCK_STEP) * tuckE(f) : 0);
const Y_METAL_END = yOf(3, 999);
const ULTRA_X = xOf(4);
const ULTRA_Y = Y_METAL_END - STEP1; // the top step

// --- Ultra's path: out from behind Metal to the right, clear, and back onto the top step -------------------
// One eased parameter s (f8 -> f34, rest to rest): x swings out XOUT and back (a sine), y rises one step with a
// small extra lift. Its left edge clears Metal's right edge for s 0.45-0.55: it passes in front at f21 (s 0.5),
// never overlapping. Settled on "Ultra" (f34). No stop on the way: x and y never both rest before f34.
const ARC = { f0: 8, f1: 34 } as const;
const XOUT = 200;
const LIFT_SCALE = 0.04; // lifted toward the camera mid-swing
const F_FRONT = 21;
const ultraAt = (f: number) => {
  const s = smoothstep((f - ARC.f0) / (ARC.f1 - ARC.f0));
  const arc = Math.sin(Math.PI * s);
  const x = lerp(xOf(3), ULTRA_X, s) + XOUT * arc;
  const y = lerp(yOf(3, f), ULTRA_Y, s) - 24 * arc;
  return { x, y, lift: arc, front: f >= F_FRONT };
};
// assert the pass in front is clean (the left edge clear of Metal's right edge on the switch frame)
{
  const u = ultraAt(F_FRONT);
  const gap = u.x - (W * (1 + LIFT_SCALE * u.lift)) / 2 - (xOf(3) + W / 2);
  if (gap < 2) throw new Error(`UltraOnTop: Ultra not clear of Metal at f${F_FRONT} (gap ${gap})`);
}
const GLOW = { f0: 31, f1: 37 } as const; // half on at the touch-down (f34)
// The lower three HOLD dimly readable (dim 0.6: ~40 % of their value) through the collapse, and sink the rest of the
// way (f58-76) before the tuck closes their steps; Metal 0.4 (its name still reads under Ultra to the end).
const dimAt = (p: PlanId, f: number) =>
  p === "metal" ? 0.4 * smoothstep((f - 34) / 30) : 0.6 * smoothstep((f - 34) / 18) + 0.4 * smoothstep((f - 58) / 18);
// The printed names of the lower three sink a little sooner than their cards (gone by f68), before the tuck narrows
// each visible strip below the name's cap height (~f67); the hold at ~40 % (f52-58) is the same.
const nameDimAt = (p: PlanId, f: number) => (p === "metal" ? dimAt(p, f) : 0.6 * smoothstep((f - 34) / 18) + 0.4 * smoothstep((f - 58) / 10));
const SWEEP = { f0: 81, f1: 93 } as const; // enters the card on "bank" (f82), across in 12 f
/** The slow 3D tilt (radians): from flat on the deck, a turn that lifts it off and keeps creeping. */
const tiltAt = (f: number): Tilt => {
  const e = smoothstep((f - 40) / 72);
  const c = Math.max(0, f - 40) / 80; // the living creep under it
  return { rx: 0.15 * e + 0.012 * c, ry: -0.24 * e - 0.02 * c, rz: -0.03 * e };
};
const tiltLift = (f: number) => smoothstep((f - 40) / 40) * 0.6;

// --- the camera (look = the frame's centre) ---------------------------------------------------------------
// f0: the 4-card stair at k 1.9, Standard's lower edge at y ~1050. f21: eased back to k 1.56 and right so
// Ultra's swing out (right edge ~world 874) stays in frame, everything above y 1060. Then ONE
// push-in on Ultra to k ~2.27: Ultra + the tucked stack span y ~120-1057, Ultra centred ~y 490, the hero.
const K0 = 1.9;
const K_A = 1.56;
const K_END = 2.26;
const STACK_BOTTOM0 = Y0 + H / 2; // Standard's lower edge at f0
// rev 4: the whole camera shifted CAM_DX world px right (a constant: the motion is unchanged) so the stack is centred
// at f0 and the end Ultra card sits at screen x ~540 (the legend that used to fill the left is gone).
const CAM_DX = 40;
const LOOK0 = { x: 468 + CAM_DX, y: STACK_BOTTOM0 - (1050 - 960) / K0 };
const LOOK_A = { x: 564 + CAM_DX, y: STACK_BOTTOM0 + NUDGE - (1050 - 960) / K_A };
const ULTRA_TOP_END = ULTRA_Y - (H / 2) * Math.cos(0.162);
const LOOK_END = { x: 540 + CAM_DX, y: ULTRA_TOP_END + (960 - 140) / K_END };
const CAM = makeClockCam(
  { ...LOOK0, k: K0 },
  [
    { f0: -16, f1: 26, dx: LOOK_A.x - LOOK0.x, dy: LOOK_A.y - LOOK0.y, k: K_A }, // eases back and right as Ultra swings out
    { f0: 22, f1: 106, dx: LOOK_END.x - LOOK_A.x, dy: LOOK_END.y - LOOK_A.y, k: K_END, warp: 1.15 }, // the push-in on Ultra (warp: k grows a touch later, so the stack bottom stays above y 1060)
    { f0: 96, f1: 170, dy: -3, k: K_END * 1.03 }, // the creep carrying on to the last frame
  ],
  DURATION,
);

// ULTRA_B_END (ultraCards.tsx) must be this cut's last frame: cut 30 opens on it.
{
  const c = CAM.at(DURATION - 1);
  const u = ultraAt(DURATION - 1);
  const t = tiltAt(DURATION - 1);
  const E = ULTRA_B_END;
  const bad =
    Math.abs(c.x - E.cam.x) + Math.abs(c.y - E.cam.y) + Math.abs(c.k - E.cam.k) > 1e-6 ||
    Math.abs(u.x - E.card.x) + Math.abs(u.y - E.card.y) > 1e-6 ||
    Math.abs(t.rx - E.card.tilt.rx) + Math.abs(t.ry - E.card.tilt.ry) + Math.abs(t.rz - E.card.tilt.rz) > 1e-6 ||
    Math.abs(0.18 + 0.0045 * (DURATION - 1) - E.card.sheen) > 1e-6 ||
    Math.abs(Math.max(u.lift, tiltLift(DURATION - 1)) - E.card.lift) > 1e-6 ||
    Math.abs(W * (1 + LIFT_SCALE * u.lift) - E.card.w) > 1e-6;
  if (bad) throw new Error("UltraOnTop: ULTRA_B_END is out of date with the last frame");
}

const Probe: React.FC = () => {
  const cam = { x: 540, y: 960, k: 1.3 };
  const pos: [number, number][] = [
    [540 - 300 / 1.3 - 30, 960 - 260],
    [540, 960 - 260],
    [540 + 300 / 1.3 + 30, 960 - 260],
    [540 - 150, 960 + 230],
    [540 + 150, 960 + 230],
  ];
  return (
    <StoutStage S={0} cam={cam} sway={false} pool={{ x: 540, y: 960 }}>
      {PLANS.map((p, i) => (
        <g key={p}>
          <PlanCard plan={p} x={pos[i][0]} y={pos[i][1]} k={cam.k} glow={p === "ultra" ? 1 : 0} />
        </g>
      ))}
    </StoutStage>
  );
};

const UltraOnTop: React.FC<z.infer<typeof schema>> = ({ probe }) => {
  const S = useCurrentFrame();
  if (probe) return <Probe />;
  const cam = CAM.at(S);
  const k = cam.k;
  const u = ultraAt(S);
  const tilt = tiltAt(S);
  const glow = smoothstep((S - GLOW.f0) / (GLOW.f1 - GLOW.f0));
  const uw = W * (1 + LIFT_SCALE * u.lift);
  const deck = DECK.map((p, i) => ({ p, x: xOf(i, S), y: yOf(i, S) }));
  // the deck: one union shadow on the ground; each card lies on the one below (a tight contact occlusion)
  const deckShadow = deck.flatMap((c) => cardSilhouette(c.x, c.y, W));
  const ultra = (
    <UltraCard
      x={u.x}
      y={u.y}
      w={uw}
      k={k}
      tilt={tilt}
      glow={glow}
      elevation="rest"
      lift={Math.max(u.lift, tiltLift(S))}
      sheen={0.18 + 0.0045 * S}
      sweep={(S - SWEEP.f0) / (SWEEP.f1 - SWEEP.f0)}
    />
  );
  const pool = { x: lerp(baseX(2), u.x, clamp01(S / 40)), y: lerp(yOf(2, S), u.y, clamp01((S - 4) / 36)), strength: 1.3 };
  return (
    <StoutStage dy={SHIFT_Y} S={S} cam={cam} rest={CAM.rest} pool={pool}>
      {u.front ? null : ultra}
      <ElevationShadow silhouette={deckShadow} elevation="rest" />
      {deck.map((c, i) => (
        <PlanCard key={c.p} plan={c.p} x={c.x} y={c.y} k={k} shadow={i === 0 ? "none" : "contact"} dim={dimAt(c.p, S)} nameDim={nameDimAt(c.p, S)} sheen={0.12 + 0.006 * S} />
      ))}
      {u.front ? ultra : null}
    </StoutStage>
  );
};

export default UltraOnTop;
