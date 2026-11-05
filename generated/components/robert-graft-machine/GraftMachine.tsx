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
// THE MOTION (director's layout, rev 2): one centred column over the full height. Moses and his label at the top,
// his machine (the row of four slots) under the label, the stage below the caption bands. Each beneficiary pops in
// at the stage centre (as the original pops them in), what Moses hands out (bonds, coins, the policy) leaves from
// behind his torso and drops the full height to the stage, and when it has its cut the beneficiary shrinks and
// rises into its slot. No camera move; grain alive throughout, a faint breathe on the full row at the end.
//   f0-12 fade up from dark; the vault pops in f3-10 ("banks" f8).
//   bonds leave Moses f21/26/31 and land f35/40/45 on a stack at the vault's left ("buy his bonds").
//   scissors in from the lower left f46-55, close f55-57: CONTACT f57 (blades shut on the cut line); the stack's
//   top-left corners fall away as one piece from f58 and leave the frame bottom ("steep discount" f48-64).
//   door swings open f64-72, bonds slide in behind the open door f71-85, door shuts f84-92 ("without competitive
//   bidding"). The vault shrinks and rises into slot 1 f92-106.
//   the worker pops in f102-108 ("unions" f107); four small workers pop in beside him f117/120/123/126 ("more
//   jobs"); f134-150 the group shrinks as one unit (spacing kept) and rises; the small ones fade out on the way
//   (t 0.4-0.75, while still below the row) so the single worker lands in slot 2.
//   the scales pop in f154-160 ("lawyers"); coins drop f164/168/172 -> land on the right pan f177/181/185: each
//   landing is the contact frame and the pan's first dip is the next frame (tilt = landed count, sprung); the
//   scales rise into slot 3 f193-207 with their coins.
//   the hat pops in f207-213 ("bosses"); coins drop f215/219/223 -> into the crown f228/232/236 ("paid" f230);
//   the policy leaves Moses f240, arrives over the hat f253 and slides down into the band f253-260, where it is
//   gone (clipped at the band's top edge); the plain hat rises into slot 4 f262-274 (matches the original column).
//   f274-285 settled: Moses, label, the full row breathing faintly, grain alive.
//
// FRAMING: Moses 0.67 x 4K (547 x 631, y 44-675; wider would push the label into the row), label cap 57, y 705-839;
// row baseline y 1055, icons 175-180 tall, equal 50 px gaps, x 102-978 (>= 100 px from the edges); stage y 1480-1840
// centred on x ~540. Drops and rising icons cross y 1080-1460 only while moving. Collision checks: label box and
// filled slots (per frame, scripts in the builder's scratchpad).
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
  GLOW_ID,
  GlowDefs,
  GraftGrain,
  GraftGround,
  MOSES_H,
  MosesBust,
  MosesLabel,
  PAN_TOP,
  Policy,
  Scales,
  Scissors,
  TopHat,
  VaultBody,
  VaultDoor,
  Worker,
  scalesHanger,
  SCALES_BASE,
} from "./graftShared";

export const FPS = 24;
export const DURATION = 286;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- layout -------------------------------------------------------------------------------------------------
const MX = 540;
const S_M = 0.67;
const MOSES_TOP = 44;
const MOSES_BOTTOM = MOSES_TOP + MOSES_H * S_M; // 675
const S_LABEL = 0.68; // cap height 57
const LABEL_TOP = MOSES_BOTTOM + 30;
const ROW_BASE = 1055;
// equal 50 px gaps: vault 175 | worker 105 | scales 244 | hat 202 -> x 102..978
const SLOT = {
  vault: { x: 189.5, s: 0.2073 },
  worker: { x: 379.5, s: 0.214 },
  scales: { x: 604, s: 0.193 },
  hat: { x: 877, s: 0.486 },
};
const FLOOR = 1840; // the stage's bottom; icons 352-360 tall -> tops >= 1480
const STAGE = {
  vault: { x: 600, s: 0.4265 }, // 360 square
  worker: { x: 540, s: 0.43 }, // 361 tall
  scales: { x: 540, s: 0.4 }, // 505 x 352
  hat: { x: 540, s: 1.0 }, // 415 x 360
};
const H = { vault: 844, worker: 840, scales: 881, hat: 360 }; // 4K heights, for popping about the centre
const SMALL_DX = [-170, 170, -320, 320]; // world px from the big worker at stage scale, in pop order
const SMALL_S = 0.2;
const SMALL_POP = [117, 120, 123, 126];
// what Moses hands out starts hidden behind his torso (left side for the bonds, right side for coins and policy)
const FROM_L: [number, number] = [385, 560];
const FROM_R: [number, number] = [700, 560];
const COIN_S = 0.52; // world coin r ~26 px

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
// stage -> slot: shrinks first (ease-out on scale) while it rises (ease-in-out on position)
const rise = (f: number, a: number, b: number, x0: number, s0: number, x1: number, s1: number) => {
  const t = prog(f, a, b, inOut);
  const ts = prog(f, a, b, out3);
  return { x: lerp(x0, x1, t), y: lerp(FLOOR, ROW_BASE, t), s: lerp(s0, s1, ts), t, raw: clamp01((f - a) / (b - a)) };
};
// the faint breathe of the finished row (ramps in from f274, so it starts from rest)
const breathe = (f: number) => 1 + 0.012 * prog(f, 274, 280, inOut) * Math.sin(((f - 274) * 2 * Math.PI) / 30);

// ---- bonds ----------------------------------------------------------------------------------------------------
const BOND_S = 0.5;
const BOND_LAND = [
  { x: 326, y: 1738, rot: -5 },
  { x: 336, y: 1729, rot: 4 },
  { x: 332, y: 1721, rot: 1 },
];
const BOND_T0 = [21, 26, 31];
const BOND_DUR = 14;
const BOND_IN0 = [75, 73, 71]; // into the vault (top bond first)
const BOND_IN_DUR = 10;
const VAULT_CY = FLOOR - 422 * STAGE.vault.s; // the vault opening's centre
const SNIP_F = 57;

const topBond = BOND_LAND[2];
const cardToWorld = (lx: number, ly: number): [number, number] => {
  const [rx, ry] = rotV(lx * BOND_S, ly * BOND_S, topBond.rot);
  return [topBond.x + rx, topBond.y + ry];
};
// scissors: axis along the cut line, blades toward the top edge, pivot just outside the card's left edge
const CUT_DIR = Math.atan2(BOND_CUT_A[1] - BOND_CUT_B[1], BOND_CUT_A[0] - BOND_CUT_B[0]);
const SCISSOR_ROT = (CUT_DIR * 180) / Math.PI + 180 + topBond.rot;
const PIVOT_LOCAL: [number, number] = [BOND_CUT_B[0] - 20 * Math.cos(CUT_DIR), BOND_CUT_B[1] - 20 * Math.sin(CUT_DIR)];
const PIVOT = cardToWorld(PIVOT_LOCAL[0], PIVOT_LOCAL[1]);
const HANDLE_DIR = rotV(1, 0, SCISSOR_ROT);
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

// ---- coins & tilt -----------------------------------------------------------------------------------------------
const SCALE_COIN_T0 = [164, 168, 172];
const SCALE_COIN_DUR = 13;
const SCALE_COIN_POS: [number, number][] = [
  [-66, PAN_TOP - 66],
  [66, PAN_TOP - 66],
  [0, PAN_TOP - 66 - 114],
];
const COIN_PAN_S = COIN_S / STAGE.scales.s; // the same coin size on the pan
const TILT_STEP = 3.2;
const HAT_COIN_T0 = [215, 219, 223];
const HAT_COIN_DUR = 13;

const GraftMachine: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = frame;
  const fadeUp = 1 - prog(f, 0, 12, Easing.out(Easing.quad));
  const br = breathe(f);

  // ---- vault ----
  const vRise = rise(f, 92, 106, STAGE.vault.x, STAGE.vault.s, SLOT.vault.x, SLOT.vault.s);
  const vault = f < 92 ? popped(f, 3, STAGE.vault.x, STAGE.vault.s, H.vault) : { ...vRise, s: vRise.s * br };
  const doorOpen = f < 84 ? prog(f, 64, 72, out3) : 1 - prog(f, 84, 92, inOut);

  const bonds = BOND_LAND.map((L, i) => {
    const t = prog(f, BOND_T0[i], BOND_T0[i] + BOND_DUR, Easing.inOut(Easing.sin));
    const [bx, by] = cubic(FROM_L, [60, 620], [250, 1420], [L.x, L.y], t);
    const sFly = lerp(0.3, BOND_S, prog(t, 0, 0.5, out3)); // small while it passes the label, full size by mid-drop
    const rot = lerp(-20, L.rot, t);
    const inT = prog(f, BOND_IN0[i], BOND_IN0[i] + BOND_IN_DUR, Easing.inOut(Easing.quad));
    const tx = STAGE.vault.x + (i - 1) * 10;
    const ty = VAULT_CY + (i - 1) * 6;
    return {
      x: lerp(bx, tx, inT),
      y: lerp(by, ty, inT),
      rot: lerp(rot, L.rot * 0.5, inT),
      s: lerp(sFly, 0.12, inT),
      op: 1 - prog(inT, 0.45, 1),
      started: f >= BOND_T0[i],
      inside: f >= BOND_IN0[i],
      gone: inT >= 1,
    };
  });

  // scissors
  const sIn = prog(f, 46, 55, out3);
  const sOut = prog(f, 60, 70, in2);
  const sD = f < 58 ? lerp(700, 0, sIn) : lerp(0, 740, sOut);
  const sOpen = f < 55 ? 1 : f < SNIP_F ? 1 - prog(f, 55, SNIP_F, in2) : 0.25 * prog(f, 58, 62);
  const scissorsOn = f >= 46 && f <= 70;
  const sx = PIVOT[0] + HANDLE_DIR[0] * sD;
  const sy = PIVOT[1] + HANDLE_DIR[1] * sD;

  // the snipped corners fall out of the frame bottom
  const ct = f - SNIP_F;
  const cDx = -2.2 * ct;
  const cDy = -2.5 * ct + 0.5 * 2.6 * ct * ct;
  const cRot = -7 * ct;
  const cornerOn = f > SNIP_F && CORNER_G_W[1] + cDy < 2050;

  // ---- workers: the group pops in, then shrinks as one unit and rises; the small ones fade on the way ----
  const wPop = popped(f, 102, STAGE.worker.x, STAGE.worker.s, H.worker);
  const wRise = rise(f, 134, 150, STAGE.worker.x, STAGE.worker.s, SLOT.worker.x, SLOT.worker.s);
  const worker = f < 134 ? wPop : { ...wRise, s: wRise.s * br };
  const groupK = f < 134 ? 1 : wRise.s / STAGE.worker.s; // the group's scale relative to the stage
  const smallsOp = f < 134 ? 1 : 1 - prog(wRise.raw, 0.4, 0.75, inOut);
  const smalls = SMALL_DX.map((dx, i) => {
    const p = pop(f, SMALL_POP[i]);
    const hh = 840 * SMALL_S;
    if (f < 134) return { x: STAGE.worker.x + dx, y: FLOOR - hh / 2 + (hh * p) / 2, s: SMALL_S * p };
    return { x: worker.x + dx * groupK, y: worker.y, s: SMALL_S * groupK };
  });
  const smallsOn = f >= 117 && smallsOp > 0.001;

  // ---- scales ----
  const scRise = rise(f, 193, 207, STAGE.scales.x, STAGE.scales.s, SLOT.scales.x, SLOT.scales.s);
  const sc = f < 193 ? popped(f, 154, STAGE.scales.x, STAGE.scales.s, H.scales) : { ...scRise, s: scRise.s * br };
  const landF = SCALE_COIN_T0.map((t0) => t0 + SCALE_COIN_DUR);
  const tilt = landF.reduce(
    (acc, lf) =>
      acc +
      TILT_STEP * (f > lf ? spring({ frame: f - lf, fps: FPS, config: { damping: 11, stiffness: 140, mass: 0.6 } }) : 0),
    0,
  );
  const rightPanToWorld = (px: number, py: number): [number, number] => {
    const [hx, hy] = scalesHanger(1, tilt);
    return [sc.x + (hx + px) * sc.s, sc.y + (hy + py - SCALES_BASE) * sc.s];
  };
  const panCoins = SCALE_COIN_POS.map(([px, py], i) => ({ px, py, landed: f >= landF[i], i }));
  const flyingScaleCoins = SCALE_COIN_T0.map((t0, i) => {
    if (f < t0 || f >= landF[i]) return null;
    const t = prog(f, t0, landF[i], Easing.inOut(Easing.sin));
    const target = rightPanToWorld(SCALE_COIN_POS[i][0], SCALE_COIN_POS[i][1]);
    const [x, y] = cubic(FROM_R, [940, 850], [860, 1320], target, t);
    return { x, y, i };
  });

  // ---- hat ----
  const hRise = rise(f, 262, 274, STAGE.hat.x, STAGE.hat.s, SLOT.hat.x, SLOT.hat.s);
  const hat = f < 262 ? popped(f, 207, STAGE.hat.x, STAGE.hat.s, H.hat) : { ...hRise, s: hRise.s * br };
  const crownTop = FLOOR - (179 + 176) * STAGE.hat.s;
  const hatCoins = HAT_COIN_T0.map((t0, i) => {
    if (f < t0 || f > t0 + HAT_COIN_DUR) return null;
    const t = prog(f, t0, t0 + HAT_COIN_DUR, Easing.in(Easing.sin));
    const end: [number, number] = [STAGE.hat.x + (i - 1) * 22, crownTop + 60];
    const [x, y] = cubic(FROM_R, [980, 800], [800, 1300], end, t); // stays right of the filled scales slot at row level
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
  const [pwx, pwy] = cubic(FROM_R, [1000, 780], [820, 1350], aboveW, polT); // through the empty hat slot, clear of the scales
  const policyLocal: [number, number] =
    f < 253
      ? [(pwx - STAGE.hat.x) / STAGE.hat.s, (pwy - hatCy) / STAGE.hat.s]
      : [lerp(aboveLocal[0], intoLocal[0], polIn), lerp(aboveLocal[1], intoLocal[1], polIn)];
  const policyRot = f < 253 ? lerp(-25, 6, polT) : 6;
  const policyOn = f >= 240 && f < 261;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <GraftGround />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <GlowDefs />
        <g filter={`url(#${GLOW_ID})`}>
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
                c.landed ? <Coin key={`pc${c.i}`} x={c.px} y={c.py} s={COIN_PAN_S} /> : null,
              )}
            />
          )}

          {/* workers: the small ones beside the big one, fading as the group rises */}
          {smallsOn && (
            <g opacity={smallsOp}>
              {smalls.map((w, i) => (w.s > 0.001 ? <Worker key={`sw${i}`} x={w.x} y={w.y} s={w.s} /> : null))}
            </g>
          )}
          {f >= 102 && worker.s > 0.001 && <Worker x={worker.x} y={worker.y} s={worker.s} />}

          {/* vault: body, the bonds that went inside, door, then the bonds still in front */}
          {vault.s > 0.001 && <VaultBody x={vault.x} y={vault.y} s={vault.s} />}
          {bonds.map(
            (b, i) =>
              b.inside &&
              !b.gone && (
                <g key={`bi${i}`} opacity={b.op}>
                  <Bond id={`bondIn${i}`} x={b.x} y={b.y} s={b.s} rot={b.rot} part="cut" cut={BOND_CUTS[i]} />
                </g>
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
              transform={`translate(${CORNER_G_W[0] + cDx} ${CORNER_G_W[1] + cDy}) rotate(${cRot}) translate(${-CORNER_G_W[0]} ${-CORNER_G_W[1]})`}
            >
              {BOND_LAND.map((L, i) => (
                <Bond key={`bc${i}`} id={`bondCorner${i}`} x={L.x} y={L.y} s={BOND_S} rot={L.rot} part="corner" cut={BOND_CUTS[i]} />
              ))}
            </g>
          )}
          {scissorsOn && <Scissors x={sx} y={sy} s={0.55} rot={SCISSOR_ROT} open={sOpen} />}

          {/* coins on their way to the pan */}
          {flyingScaleCoins.map((c) => c && <Coin key={`fc${c.i}`} x={c.x} y={c.y} s={COIN_S} />)}

          {/* Moses on top: everything he hands out starts hidden behind his torso */}
          <MosesBust x={MX} y={MOSES_BOTTOM} s={S_M} />
          <MosesLabel x={MX} y={LABEL_TOP} s={S_LABEL} />
        </g>
      </svg>
      <GraftGrain frame={frame} />
      {fadeUp > 0 && <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeUp }} />}
    </AbsoluteFill>
  );
};

export default GraftMachine;
