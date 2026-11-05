// ---------------------------------------------------------------------------
// GraftMachine (robert-graft-machine, cut 47). The show's own Moses pictogram, re-staged 9:16 (not a kise style
// file: the look is the original 16:9 graphic in Robert_Graft_machine_media.mov, src 51.9-63.8; parts in
// graftShared.tsx). Opaque 1080x1920, 24 fps, 286 frames.
//
// CHECK LINE: "Each powerful group — the banks, the unions, the lawyers, the party bosses — got its own cut from
// Moses, and one by one they are collected into his machine."
//
// THE LINE: "The banks got to buy his bonds at a steep discount without competitive bidding. The unions got more
// jobs. Politically connected lawyers got legal fees. And party bosses got paid to broker insurance policies…"
// WORD -> FRAME: The 1 · banks 8 · got 17 · to 22 · buy 25 · his 29 · bonds 33 · at 41 · a 46 · steep 48 ·
// discount 54 · without 64 · competitive 75 · bidding 84 · The 97 · unions 107 · got 115 · more 121 · jobs 125 ·
// Politically 139 · connected 155 · lawyers 160 · got 169 · legal 178 · fees 184 · And 193 · party 205 ·
// bosses 213 · got 220 · paid 230 · to 239 · broker 245 · insurance 251 · policies 258 · (to 273 · bridges 283).
// DURATION: the slot 47.9583 -> 59.875 s = 11.9167 s x 24 = 286 frames (f0..f285).
//
// THE MOTION (rev 1, the user's notes of Nov 5: no fades, one compact central column, introductions near the
// middle). Moses, his label, the row of four and the stage sit in one tight column (layout constants in
// graftShared.tsx, shared with CallUpAnyone). Each beneficiary pops in on the stage right under the row, what Moses
// hands out (bonds, coins, the policy) leaves from behind his torso and drops a short way to the stage, and when it
// has its cut the beneficiary shrinks and moves a short way up into its slot. No camera move, no opacity anywhere;
// grain alive throughout, a faint breathe on the full row at the end.
//   f0 fully drawn (ground, grain, Moses and label); Moses + label pop 0.9 -> 1 over f0-6.
//   the vault pops in from f5 ("banks" f8).
//   bonds leave Moses f21/26/31 and land f35/40/45 on a stack at the vault's left ("buy his bonds").
//   scissors pop in beside the stack, open and already in snipping position, f46-52 (0.6 -> 1), close f55-57:
//   CONTACT f57 (blades shut on the cut line); the stack's top-left corners drop 65 px down-left as one piece f57-64,
//   clear of the stack, and shrink to nothing on the spot f63-69; the scissors pop out in place f59-64 ("steep discount").
//   door swings open f64-72, bonds slide into the opening (shrinking into it) f71-85, the door shuts over them
//   f84-92 ("without competitive bidding"). The vault shrinks and moves up into slot 1 f92-106.
//   the worker pops in from f102 ("unions" f107); four small workers slide out from behind him f117-129 ("more
//   jobs"), slide back behind him f133-141 (hidden by him, nothing vanishes), and he moves up into slot 2 f140-153.
//   the scales pop in from f154 ("lawyers" f160); coins drop f164/168/172 -> land on the right pan f177/181/185:
//   each landing is the contact frame and the pan's first dip is the next frame; the scales move into slot 3
//   f193-207 with their coins.
//   the hat pops in from f207 ("bosses" f213); coins drop f215/219/223 into the crown (behind it) f228/232/236
//   ("paid" f230); the policy leaves Moses f240, arrives over the crown f253 and slides down into the band
//   f253-260, hidden by it; the hat moves into slot 4 f262-274.
//   f274-285 settled: Moses, label, the full row breathing faintly (drawn by graftShared's GraftRowFinal, the frame
//   CallUpAnyone opens on), grain alive.
//
// FRAMING (graftShared layout): Moses 424 x 490 at y 222-712, label caps y 734-829, row baseline y 955 (icons
// ~105 px, x ~239-841), stage floor y 1160 (icons 180-200 px, tops >= 970). Everything inside x 100-920, y 220-1520
// on every frame. The stage's lower part sits in caption band
// 1 (no text there). Collision checks per frame: scripts in the builder's scratchpad.
//
// SOURCES: none (no figures). Artwork traced/measured from notes/reference/picto_src52.6-61.6.png.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, spring, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BOND_CORNER,
  BOND_CUT_A,
  BOND_CUT_B,
  Bond,
  Coin,
  G_BREATHE_F0,
  G_COIN_PAN_S,
  G_COIN_S,
  G_H,
  G_PAN_COIN_POS,
  G_ROW_BASE,
  G_SCALE_COIN_LAND,
  G_SLOTS,
  G_STAGE,
  G_STAGE_FLOOR,
  GLOW_ID,
  GlowDefs,
  GraftGrain,
  GraftGround,
  GraftMosesFinal,
  GraftRowFinal,
  Policy,
  Scales,
  Scissors,
  TopHat,
  VaultBody,
  VaultDoor,
  Worker,
  gmTilt,
  scalesHanger,
  SCALES_BASE,
} from "./graftShared";

export const FPS = 24;
export const DURATION = 286;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- layout (graftShared) ---------------------------------------------------------------------------------------
const FLOOR = G_STAGE_FLOOR;
const ROW_BASE = G_ROW_BASE;
const SLOT = G_SLOTS;
const STAGE = G_STAGE;
const H = G_H;
// the small workers: world px from the lead's x when out (inner pair, outer pair), and their scale
const SMALL_DX = [-100, 100, -172, 172];
const SMALL_S = STAGE.worker.s * 0.47;
// what Moses hands out starts hidden behind his torso (left side for the bonds, right side for coins and policy)
const FROM_L: [number, number] = [440, 650];
const FROM_R: [number, number] = [640, 650];
const COIN_S = G_COIN_S; // world coin r ~13.5 px

// ---- helpers ------------------------------------------------------------------------------------------------
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const prog = (f: number, a: number, b: number, ease: (t: number) => number = (t) => t) =>
  ease(clamp01((f - a) / (b - a)));
const inOut = Easing.inOut(Easing.cubic);
const out3 = Easing.out(Easing.cubic);
const in2 = Easing.in(Easing.quad);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const cubic = (
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};
const rotV = (x: number, y: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};
// the pop-in (scale about the icon's centre, a small overshoot), as the original pops its beneficiaries in
const pop = (f: number, f0: number) =>
  f < f0 ? 0 : spring({ frame: f - f0, fps: FPS, config: { damping: 11, stiffness: 190, mass: 0.6 } });
// a stage icon (bottom-centre anchor) popping in about its centre
const popped = (f: number, f0: number, x: number, s: number, h4k: number) => {
  const p = pop(f, f0);
  const hh = h4k * s;
  return { x, y: FLOOR - hh / 2 + (hh * p) / 2, s: s * p };
};
// stage -> slot: shrinks first (ease-out on scale) while it moves up (ease-in-out on position); exact slot at the end
const rise = (f: number, a: number, b: number, x0: number, s0: number, x1: number, s1: number) => {
  const raw = clamp01((f - a) / (b - a));
  if (raw >= 1) return { x: x1, y: ROW_BASE, s: s1 };
  const t = inOut(raw);
  return { x: lerp(x0, x1, t), y: lerp(FLOOR, ROW_BASE, t), s: lerp(s0, s1, out3(raw)) };
};

// ---- bonds ----------------------------------------------------------------------------------------------------
const BOND_S = 0.3; // 126 x 82
const BOND_LAND = [
  { x: 418, y: 1083, rot: -5 },
  { x: 424, y: 1078, rot: 4 },
  { x: 421, y: 1073, rot: 1 },
];
const BOND_T0 = [21, 26, 31];
const BOND_DUR = 14;
const BOND_IN0 = [75, 73, 71]; // into the vault (top bond first)
const BOND_IN_DUR = 10;
const VAULT_CY = FLOOR - 422 * STAGE.vault.s; // the vault opening's centre
const SNIP_F = 57;
const SCISSOR_S = 0.4;

const topBond = BOND_LAND[2];
const cardToWorld = (lx: number, ly: number): [number, number] => {
  const [rx, ry] = rotV(lx * BOND_S, ly * BOND_S, topBond.rot);
  return [topBond.x + rx, topBond.y + ry];
};
// scissors: axis along the cut line, blades toward the top edge, pivot just outside the card's left edge
const CUT_DIR = Math.atan2(BOND_CUT_A[1] - BOND_CUT_B[1], BOND_CUT_A[0] - BOND_CUT_B[0]);
const SCISSOR_ROT = (CUT_DIR * 180) / Math.PI + 180 + topBond.rot;
const PIVOT_LOCAL: [number, number] = [BOND_CUT_B[0] - 24 * Math.cos(CUT_DIR), BOND_CUT_B[1] - 24 * Math.sin(CUT_DIR)];
const PIVOT = cardToWorld(PIVOT_LOCAL[0], PIVOT_LOCAL[1]);
// the cut runs through the whole stack along the top bond's cut line: that line in each card's own units
const CUT_A_W = cardToWorld(BOND_CUT_A[0], BOND_CUT_A[1]);
const CUT_B_W = cardToWorld(BOND_CUT_B[0], BOND_CUT_B[1]);
const toCard = (L: { x: number; y: number; rot: number }, w: [number, number]): [number, number] => {
  const [lx, ly] = rotV(w[0] - L.x, w[1] - L.y, -L.rot);
  return [lx / BOND_S, ly / BOND_S];
};
const BOND_CUTS = BOND_LAND.map((L) => ({ a: toCard(L, CUT_A_W), b: toCard(L, CUT_B_W) }));
const CORNER_G_W = cardToWorld(
  (BOND_CUT_A[0] + BOND_CUT_B[0] + BOND_CORNER[0]) / 3,
  (BOND_CUT_A[1] + BOND_CUT_B[1] + BOND_CORNER[1]) / 3,
);

// ---- coins ------------------------------------------------------------------------------------------------------
const SCALE_COIN_DUR = 13;
const SCALE_COIN_T0 = G_SCALE_COIN_LAND.map((lf) => lf - SCALE_COIN_DUR);
const HAT_COIN_T0 = [215, 219, 223];
const HAT_COIN_DUR = 13;

const GraftMachine: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = frame;
  const mosesPop = f < 6 ? 0.9 + 0.1 * Easing.out(Easing.back(1.7))(f / 6) : 1;

  // ---- vault ----
  const vault = f < 92 ? popped(f, 5, STAGE.vault.x, STAGE.vault.s, H.vault) : rise(f, 92, 106, STAGE.vault.x, STAGE.vault.s, SLOT.vault.x, SLOT.vault.s);
  const doorOpen = f < 84 ? prog(f, 64, 72, out3) : 1 - prog(f, 84, 92, inOut);

  const bonds = BOND_LAND.map((L, i) => {
    const t = prog(f, BOND_T0[i], BOND_T0[i] + BOND_DUR, Easing.inOut(Easing.sin));
    const [bx, by] = cubic(FROM_L, [215, 700], [290, 1000], [L.x, L.y], t);
    const sFly = lerp(0.12, BOND_S, prog(t, 0, 0.55, out3)); // small while it passes the label, full size by mid-drop
    const rot = lerp(-20, L.rot, t);
    const inT = prog(f, BOND_IN0[i], BOND_IN0[i] + BOND_IN_DUR, Easing.inOut(Easing.quad));
    const tx = STAGE.vault.x + (i - 1) * 6;
    const ty = VAULT_CY + (i - 1) * 4;
    return {
      x: lerp(bx, tx, inT),
      y: lerp(by, ty, inT),
      rot: lerp(rot, L.rot * 0.5, inT),
      s: lerp(sFly, 0.12, inT),
      started: f >= BOND_T0[i],
      inside: f >= BOND_IN0[i],
    };
  });
  // the bonds sit in the opening until the door has shut over them (f92), then they are simply behind it
  const bondsInsideOn = f < 92;

  // scissors: pop in already in snipping position right beside the stack (0.6 -> 1), snip, pop out in place (-> 0)
  const sOpen = f < 55 ? 1 : f < SNIP_F ? 1 - prog(f, 55, SNIP_F, in2) : 0.25 * prog(f, 58, 61);
  const sScale = f < 46 ? 0 : f < 59 ? 0.6 + 0.4 * pop(f, 46) : 1 - prog(f, 59, 64, in2);
  const scissorsOn = f >= 46 && sScale > 0.001;

  // the snipped corners drop a short way down-left, clear of the stack (65 px, tumbling a little), and shrink to
  // nothing on the spot
  const cDrop = prog(f, SNIP_F, 64, Easing.out(Easing.quad));
  const cDx = -35 * cDrop;
  const cDy = 55 * cDrop;
  const cRot = -30 * cDrop;
  const cScale = 1 - prog(f, 63, 69, in2);
  const cornerOn = f > SNIP_F && cScale > 0.001;

  // ---- workers: the lead pops in; the small ones slide out from behind him and back behind him; he moves up ----
  const worker =
    f < 140 ? popped(f, 102, STAGE.worker.x, STAGE.worker.s, H.worker) : rise(f, 140, 153, STAGE.worker.x, STAGE.worker.s, SLOT.worker.x, SLOT.worker.s);
  const smallOut = (i: number) => {
    const o = i < 2 ? prog(f, 117, 126, out3) : prog(f, 119, 129, out3);
    const back = prog(f, 133, 141, inOut);
    return o * (1 - back);
  };
  const smalls = SMALL_DX.map((dx, i) => ({ x: STAGE.worker.x + dx * smallOut(i), y: FLOOR, s: SMALL_S }));
  const smallsOn = f >= 117 && f < 141;

  // ---- scales ----
  const sc =
    f < 193 ? popped(f, 154, STAGE.scales.x, STAGE.scales.s, H.scales) : rise(f, 193, 207, STAGE.scales.x, STAGE.scales.s, SLOT.scales.x, SLOT.scales.s);
  const tilt = gmTilt(f);
  const rightPanToWorld = (px: number, py: number): [number, number] => {
    const [hx, hy] = scalesHanger(1, tilt);
    return [sc.x + (hx + px) * sc.s, sc.y + (hy + py - SCALES_BASE) * sc.s];
  };
  const panCoins = G_PAN_COIN_POS.map(([px, py], i) => ({ px, py, landed: f >= G_SCALE_COIN_LAND[i], i }));
  const flyingScaleCoins = SCALE_COIN_T0.map((t0, i) => {
    const lf = G_SCALE_COIN_LAND[i];
    if (f < t0 || f >= lf) return null;
    const t = prog(f, t0, lf, Easing.inOut(Easing.sin));
    const target = rightPanToWorld(G_PAN_COIN_POS[i][0], G_PAN_COIN_POS[i][1]);
    const [x, y] = cubic(FROM_R, [790, 720], [740, 960], target, t);
    return { x, y, i };
  });

  // ---- hat ----
  const hat = f < 262 ? popped(f, 207, STAGE.hat.x, STAGE.hat.s, H.hat) : rise(f, 262, 274, STAGE.hat.x, STAGE.hat.s, SLOT.hat.x, SLOT.hat.s);
  const hatCoins = HAT_COIN_T0.map((t0, i) => {
    if (f < t0 || f > t0 + HAT_COIN_DUR) return null;
    const t = prog(f, t0, t0 + HAT_COIN_DUR, Easing.in(Easing.sin));
    const end: [number, number] = [STAGE.hat.x + 16 + (i - 1) * 10, 1012 + (i === 1 ? 4 : 0)];
    // down the gap between the filled scales slot and the empty hat slot, into the crown from above
    const [x, y] = cubic(FROM_R, [805, 720], [716, 880], end, t);
    return { x, y, i };
  });
  // the policy: hat-local units (origin at the hat's centre); it flies down, then slides into the band and is gone
  const P_LOCAL_S = 0.55;
  const hatCy = FLOOR - 179 * STAGE.hat.s;
  const aboveLocal: [number, number] = [30, -40];
  const intoLocal: [number, number] = [30, 58 + 62];
  const aboveW: [number, number] = [STAGE.hat.x + aboveLocal[0] * STAGE.hat.s, hatCy + aboveLocal[1] * STAGE.hat.s];
  const polT = prog(f, 240, 253, Easing.inOut(Easing.sin));
  const polIn = prog(f, 253, 260, in2);
  const [pwx, pwy] = cubic(FROM_R, [815, 720], [740, 880], aboveW, polT);
  const policyLocal: [number, number] =
    f < 253
      ? [(pwx - STAGE.hat.x) / STAGE.hat.s, (pwy - hatCy) / STAGE.hat.s]
      : [lerp(aboveLocal[0], intoLocal[0], polIn), lerp(aboveLocal[1], intoLocal[1], polIn)];
  const policyRot = f < 253 ? lerp(-25, 6, polT) : 6;
  const policyOn = f >= 240 && f < 261;

  const settled = f >= G_BREATHE_F0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <GraftGround />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <GlowDefs />
        <g filter={`url(#${GLOW_ID})`}>
          {settled ? (
            <GraftRowFinal F={f} />
          ) : (
            <g>
              {/* the hat and what drops into it (coins pass behind the crown) */}
              {hatCoins.map((c) => c && <Coin key={`hc${c.i}`} x={c.x} y={c.y} s={COIN_S} />)}
              {f >= 207 && hat.s > 0.001 && (
                <TopHat
                  x={hat.x}
                  y={hat.y}
                  s={hat.s}
                  tuck={
                    policyOn ? (
                      <g>
                        <defs>
                          <clipPath id="policyIntoBand" clipPathUnits="userSpaceOnUse">
                            <rect x={-400} y={-2000} width={800} height={2058} />
                          </clipPath>
                        </defs>
                        <g clipPath="url(#policyIntoBand)">
                          <Policy x={policyLocal[0]} y={policyLocal[1]} s={P_LOCAL_S} rot={policyRot} />
                        </g>
                      </g>
                    ) : undefined
                  }
                />
              )}

              {/* scales */}
              {f >= 154 && sc.s > 0.001 && (
                <Scales
                  x={sc.x}
                  y={sc.y}
                  s={sc.s}
                  tilt={tilt}
                  rightPan={panCoins.map((c) =>
                    c.landed ? <Coin key={`pc${c.i}`} x={c.px} y={c.py} s={G_COIN_PAN_S} /> : null,
                  )}
                />
              )}

              {/* workers: the small ones behind the lead (outer pair behind the inner pair) */}
              {smallsOn &&
                [2, 3, 0, 1].map((i) => <Worker key={`sw${i}`} x={smalls[i].x} y={smalls[i].y} s={smalls[i].s} />)}
              {f >= 102 && worker.s > 0.001 && <Worker x={worker.x} y={worker.y} s={worker.s} />}

              {/* vault: body, the bonds that went inside, door, then the bonds still in front */}
              {vault.s > 0.001 && <VaultBody x={vault.x} y={vault.y} s={vault.s} />}
              {bondsInsideOn &&
                bonds.map(
                  (b, i) =>
                    b.inside && (
                      <Bond key={`bi${i}`} id={`bondIn${i}`} x={b.x} y={b.y} s={b.s} rot={b.rot} part="cut" cut={BOND_CUTS[i]} />
                    ),
                )}
              {vault.s > 0.001 && <VaultDoor x={vault.x} y={vault.y} s={vault.s} open={doorOpen} />}
              {bonds.map(
                (b, i) =>
                  b.started &&
                  !b.inside && (
                    <Bond
                      key={`bf${i}`}
                      id={`bondFront${i}`}
                      x={b.x}
                      y={b.y}
                      s={b.s}
                      rot={b.rot}
                      part={f > SNIP_F ? "cut" : "whole"}
                      cut={BOND_CUTS[i]}
                    />
                  ),
              )}
              {cornerOn && (
                <g
                  transform={`translate(${CORNER_G_W[0] + cDx} ${CORNER_G_W[1] + cDy}) rotate(${cRot}) scale(${cScale}) translate(${-CORNER_G_W[0]} ${-CORNER_G_W[1]})`}
                >
                  {BOND_LAND.map((L, i) => (
                    <Bond key={`bc${i}`} id={`bondCorner${i}`} x={L.x} y={L.y} s={BOND_S} rot={L.rot} part="corner" cut={BOND_CUTS[i]} />
                  ))}
                </g>
              )}
              {scissorsOn && <Scissors x={PIVOT[0]} y={PIVOT[1]} s={SCISSOR_S * sScale} rot={SCISSOR_ROT} open={sOpen} />}

              {/* coins on their way to the pan */}
              {flyingScaleCoins.map((c) => c && <Coin key={`fc${c.i}`} x={c.x} y={c.y} s={COIN_S} />)}
            </g>
          )}

          {/* Moses on top: everything he hands out starts hidden behind his torso */}
          <GraftMosesFinal pop={mosesPop} />
        </g>
      </svg>
      <GraftGrain frame={frame} />
    </AbsoluteFill>
  );
};

export default GraftMachine;
