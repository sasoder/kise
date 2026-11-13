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
// THE MOTION: Revolut's plan ladder, four real bank cards fanned as a rising stair (Standard at the bottom,
// Plus, Premium, Metal on top), the camera already gliding up it toward Metal while easing back (k 1.9 -> 1.65,
// f0-30: in 9:16 the height binds at Ultra's apex). The deck makes room (it nudges down and opens its steps,
// f12-28) while the platinum ULTRA card rises out from behind Metal, clears it (lifted, f25) and arcs over onto the
// top step, in front, touching down ON "Ultra" (f34); its amber edge glow comes up with the landing (f31-37). Then ONE
// push-in on the Ultra card (f24-106, "effectively Ultra ... bank account") to ~860 px wide at screen y ~700,
// with a slow 3D tilt lifting it off the deck; the old plans dim but stay readable (f34-62, ~40 %), sink (f62-82) before
// the tuck (f44-100) closes over their names, Metal's name still reading under Ultra above the caption band. The one click: the light sweep
// across its platinum on "bank" (f81-93). f104-119 the push, the tilt and the sheen creep on.
//   Ultra cause chain: hidden exactly behind Metal f0-12 (no sliver) -> rises f10-25 -> its bottom edge 8 px
//   clear of Metal's top edge at f24-25, only then it moves over and passes in front -> touches down f34.
// CAPTION BANDS: Standard's name stays above y 1080 through f30 (~1000-1060); from f34 the lower names sink by
// tone as the push carries them down; at rest only Metal's name (y ~1030) and plain card edges remain below Ultra.
// AMBER = what makes an idea work / gets backed: here the Ultra card's edge glow. Cream/board = the plans.
//
// SOURCES: Revolut's personal plans, bottom to top Standard, Plus, Premium, Metal, Ultra (revolut.com plans
// pages; Ultra launched 16 June 2023 as the new top tier, its card platinum-plated). No prices on screen (Nik's
// "50 euros" is approximate; Revolut lists EUR 55-70 by country). The "R" mark: nik-trend-friend/revolutMark.ts
// (Wikimedia Commons, Revolut_logo.svg, public-domain text logo). Card proportions: ISO/IEC 7810 ID-1.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ElevationShadow, StoutStage, clamp01, lerp, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam } from "../kits/cheeky-pint/museShared";
import { CARD, PLANS, PlanCard, UltraCard, cardH, cardSilhouette, type PlanId, type Tilt } from "./ultraCards";

export const FPS = 24000 / 1001;
export const DURATION = 120;
export const schema = z.object({
  /** Measurement only: the five cards flat in a column (the ultraCards probe). */
  probe: z.boolean().default(false),
});
export const defaultProps = schema.parse({});

// --- the world -------------------------------------------------------------------------------------------
const W = CARD.W;
const H = cardH(W);
const CX = 540;
const DX = 22; // the stair's step to the right
const Y0 = 1100; // Standard's centre at f0
const STEP0 = 54; // the deck's step at f0 (each lower card shows its name strip)
const STEP1 = 58; // the opened step
const NUDGE = 20; // the deck nudges down as it makes room
const DECK: PlanId[] = ["standard", "plus", "premium", "metal"];
const ROOM = { f0: 12, f1: 28 } as const; // the deck makes room
const roomE = (f: number) => smoothstep((f - ROOM.f0) / (ROOM.f1 - ROOM.f0));
/** The stair before it tucks in (Premium at the centre; Ultra, i 4, one step right of Metal). */
const baseX = (i: number) => CX + (i - 2) * DX;
const baseY = (i: number, f: number) => {
  const e = roomE(f);
  return Y0 + NUDGE * e - i * lerp(STEP0, STEP1, e);
};
// Under the push-in the old plans tuck in beneath Ultra as they recede (f44-100): the stair straightens
// (DX -> TUCK_DX, about Ultra's x) and the three lower plans close up to thin edges under Metal.
const TUCK = { f0: 44, f1: 100 } as const;
const TUCK_DX = 6;
const TUCK_STEP = 30;
const tuckE = (f: number) => smoothstep((f - TUCK.f0) / (TUCK.f1 - TUCK.f0));
const xOf = (i: number, f = 0) => baseX(4) - (4 - i) * lerp(DX, TUCK_DX, tuckE(f));
const yOf = (i: number, f: number) => baseY(i, f) - (i < 3 ? (3 - i) * (STEP1 - TUCK_STEP) * tuckE(f) : 0);
const Y_METAL_END = yOf(3, 999);
const ULTRA_X = xOf(4);
const ULTRA_Y = Y_METAL_END - STEP1; // the top step

// --- Ultra's path: up from behind Metal, clear, then laid on the top step ---------------------------------
// rev 2 (blind review): no stop at the apex (the arc's sideways move runs through it) and the touch-down ON "Ultra":
// up f10-25, over the top f24-33, set down f25-34 (settled f34).
const UP = { f0: 10, f1: 25 } as const;
const DOWN = { f0: 25, f1: 34 } as const;
const OVER = { f0: 24, f1: 33 } as const; // the sideways move onto the top step (starts once it is clear of Metal's top)
const LIFT_SCALE = 0.04; // lifted toward the camera at the apex
const APEX = Y_METAL_END - H / 2 - (H * (1 + LIFT_SCALE)) / 2 - 8; // its bottom edge 8 px above Metal's top edge
const ultraAt = (f: number) => {
  const up = smoothstep((f - UP.f0) / (UP.f1 - UP.f0));
  const down = smoothstep((f - DOWN.f0) / (DOWN.f1 - DOWN.f0));
  const front = f >= DOWN.f0;
  const y = !front ? lerp(yOf(3, f), APEX, up) : lerp(APEX, ULTRA_Y, down);
  // lifted while it travels over, set down on landing
  const lift = smoothstep((f - (UP.f0 + 5)) / 9) * (1 - smoothstep((f - (DOWN.f0 + 1)) / (DOWN.f1 - DOWN.f0 - 1)));
  const x = lerp(xOf(3), ULTRA_X, smoothstep((f - OVER.f0) / (OVER.f1 - OVER.f0)));
  return { x, y, lift, front };
};
const GLOW = { f0: 31, f1: 37 } as const; // half on at the touch-down (f34)
// the lower plans recede as the push brings them toward the caption bands (names sunk by f64); Metal only half,
// its name still reading under Ultra to the end
// rev 2: the lower three HOLD dimly readable (dim 0.6: ink ~40 % of its contrast) through the collapse, and sink
// the rest of the way (f62-82) before the tuck closes over their names; Metal 0.4. The end state is unchanged.
const dimAt = (p: PlanId, f: number) =>
  p === "metal" ? 0.4 * smoothstep((f - 34) / 30) : 0.6 * smoothstep((f - 34) / 18) + 0.4 * smoothstep((f - 62) / 20);
const SWEEP = { f0: 81, f1: 93 } as const; // rev 2: enters the card on "bank" (f82), across in 12 f
/** The slow 3D tilt (radians): from flat on the deck, a turn that lifts it off and keeps creeping. */
const tiltAt = (f: number): Tilt => {
  const e = smoothstep((f - 40) / 72);
  const c = Math.max(0, f - 40) / 80; // the living creep under it
  return { rx: 0.15 * e + 0.012 * c, ry: -0.24 * e - 0.02 * c, rz: -0.03 * e };
};
const tiltLift = (f: number) => smoothstep((f - 40) / 40) * 0.6;

// --- the camera (look = the frame's centre) ---------------------------------------------------------------
// f0: the 4-card deck at k 1.9 (~68 % of the width), Standard's name above the caption band (~y 1000).
// To f26 it glides up toward Metal while easing back (k 1.65) so Ultra's apex (top edge ~y 130) and Standard's name both stay
// in clear frame: in 9:16 the height binds. Then ONE push-in on Ultra: ~860 px wide, centred ~y 700 by f106 so
// Metal's name still reads just under it, above the band; the creep carries on to the last frame.
const K0 = 1.9;
const K_APEX = 1.65;
const K_END = 860 / W;
const NAME_DY = H * (CARD.NAME_BASE - 0.5); // a card's centre to its name's baseline
const LOOK0 = { x: baseX(1.5), y: baseY(0, 0) + NAME_DY - (1000 - 960) / K0 };
const LOOK_APEX = { x: baseX(2.5), y: baseY(0, 99) + NAME_DY - (1058 - 960) / K_APEX };
const LOOK_END = { x: ULTRA_X, y: ULTRA_Y - (700 - 960) / K_END };
const CAM = makeClockCam(
  { ...LOOK0, k: K0 },
  [
    { f0: -16, f1: 30, dx: LOOK_APEX.x - LOOK0.x, dy: LOOK_APEX.y - LOOK0.y, k: K_APEX }, // eases back and up as Ultra rises
    { f0: 24, f1: 106, dx: LOOK_END.x - LOOK_APEX.x, dy: LOOK_END.y - LOOK_APEX.y, k: K_END }, // the push-in on Ultra
    { f0: 96, f1: 170, dy: -4, k: K_END * 1.03 }, // the creep carrying on to the last frame
  ],
  DURATION,
);

const Probe: React.FC = () => {
  const cam = { x: 540, y: 960, k: 1.55 };
  return (
    <StoutStage S={0} cam={cam} sway={false} pool={{ x: 540, y: 960 }}>
      {PLANS.map((p, i) => (
        <PlanCard key={p} plan={p} x={540} y={960 + (i - 2) * 236} k={cam.k} glow={p === "ultra" ? 1 : 0} />
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
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={pool}>
      {u.front ? null : ultra}
      <ElevationShadow silhouette={deckShadow} elevation="rest" />
      {deck.map((c, i) => (
        <PlanCard key={c.p} plan={c.p} x={c.x} y={c.y} k={k} shadow={i === 0 ? "none" : "contact"} dim={dimAt(c.p, S)} sheen={0.12 + 0.006 * S} />
      ))}
      {u.front ? ultra : null}
    </StoutStage>
  );
};

export default UltraOnTop;
