// ---------------------------------------------------------------------------
// HundredthOfTheCost (sam-navier-stokes, cut 1), Rev 3. Cheeky Pint style (stout) (styles/cheeky-pint.md), in the
// "air" look of the Scott clips: the clip's shared world vortexSky.tsx (wifiSky's cruise sky: the golden cumulus deck,
// the warm haze, the sky deepening to espresso), so cuts 1, 10 and 19 are one world. Opaque 1080x1920, 23.976 fps,
// 96 frames. RENDER WITH --gl=angle.
//
// CHECK LINE: "A year on, the same Navier–Stokes proof could be redone for a hundredth of what it first cost."
//
// THE LINE: "[I bet we could redo Navier-]Stokes at 1/100th of the cost a year from when it was done."
// WORD -> FRAME (from the composition start): (Navier -10) · Stokes 8 · at 16 · 1 29 · 100th 37 · of 51 · the 54 ·
//   cost 56 · a 65 · year 72 · from 79 · when 82 · it 85 · was 86 · done 89 · (next line "So" 96).
// DURATION: the slot 1.334667 -> 5.338667 s = 4.004 s x 23.976 = 96 frames (f0..f95).
//
// REV 3 (the user on Rev 2b: "looks a lot better now, but I might have made a mistake when I told you to integrate the
// picture ... it's still not very smooth and compelling ... it can ease in and ease out more ... the end is cut off
// kind of ... ignore what I said about having to integrate the picture, but it would still be nice to have that kind of
// shape with its right colors"): the newsprint page and the photo cut-out are dropped (their files are kept); the
// hero is the clip's own 3D Navier–Stokes vortex (NS_VORTEX: the same object, seed and shape as cuts 10 and 19), with
// no amber fill (the cost here is the cash); the cost is the cash the user liked, as giant 3D bundles in the same sky.
//
// THE LAYOUT (Rev 3b/3c): the cash stands BESIDE the vortex at about the same depth, at sky scale, one giant object
// family with it: the mound rises out of the deck tops just right of the vortex's foot (its rows span Z 0..3440, the
// vortex stands at Z 2550), and the bundles are so big that the one left standing is ~280 px wide in the end shot.
// THE MOTION (Rev 3c): ONE move in ONE direction, one ease-in and one ease-out, no return (aircraftShared airTrack,
// smoothstep glides under its damped follower). Every key is monotone: the camera trucks right, rises (y 6300 -> 7100,
// the heaps 1400-2500, the deck plane at 3700) and pans left (yaw 0 -> -8.2), an arc round onto the pair, while the
// lens widens (the pull-back) and then, from ~f34, slowly closes again (the push in). f0: near rest (~7 px/f), the
// vortex centred and big, the cash out of frame right. The speed is a single hump (peak ~51 px/f ~f17) easing out to
// ~7-8 px/f by ~f40, where it lands on the two-shot: the vortex whole on the left, the mound whole on the right. The
// 99 drain in that shot during the move's slow tail, which becomes a push in toward the pair (vortex + one bundle),
// slowing ~7 -> 4 px/f to f95, never stopping. f95: the vortex whole and large (~55% of the frame height), the bundle
// beside its foot (~280 px wide, between the caption bands), the date beside the crown.
// THE CASH (hundredthCash.tsx, three.js in the world: the vortex's light, fog and cloud): 100 bundles (hundredthMoney's
// cream-sage notes, ONE amber bank strap each) in a stepped mound of 2 columns x 5 rows: the column nearer the vortex
// 12 / 10 / 9 / 7 / 5 and the far column 16 / 14 / 11 / 9 / 7 bundles from the back row to the front.
// "1/100th of the cost" (f37 -> f56): a wave runs from the mound's front-right stack to its back-left; stack by stack
// the bundles sink DOWN into the cloud, each stack whole (the deck's heaps swallow it by height and its cloud tone,
// never opacity; once its top is under the highest heap beneath it, it is gone, so no stray corner lingers in a dip),
// the last of the 99 gone by "cost" (f56). The stack nearest the vortex's foot (second row, near column) sinks to ONE
// bundle, which settles on the cloud where nothing in front hides it from the end camera (f43 -> f56), its strap lit hot
// amber with a warm glow from f47, landing on "cost".
// THE DATE: a CostTick-style tick beside the vortex's crown, inside the final composition (cut 10's ~$10M tick family:
// Söhne, cream, the soft brown shade and halo, a cream rule from the vortex's silhouette), so the camera never drags it
// in from an edge: SEPT 2026 makes its own stout entrance (slide up + fade + blur, f47 -> f59), and on "a year" its
// last digit rolls 6 -> 7 on a feathered drum (f62 -> f71, landed before "year" f72).
// Cause before effect: the wave front is the cause; a stack's first sinking frame is start_i = WAVE.f0 + WAVE.span x
// its share of the distance from the wave's source.
// AMBER = the cost (the bank straps). The vortex = the proof itself, in the picture's colours (vortexSky's real look,
// CUT10_LOOK), no fill.
//
// SOURCES: the vortex is vortexSky's NS_VORTEX (redrawn after the user's reference assets-src/sam-navier-stokes/
// user_vortex.png). The dates: OpenAI published the Navier–Stokes result on Sept 8 2026 (COMMON.md facts); "a year
// from when it was done" -> SEPT 2027. No dollar figures, numbers or arrows on screen besides the date.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_LABEL, FONT_NUM, TNUM_ADV, TRACK, clamp01, easeOutCubic, labelWidth, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { airCamAt, airProject, airTrack, type SideCam, type V3 } from "../scott-aircraft-order/aircraftShared";
import { CUT10_LOOK, NS_VORTEX, VORTEX_AIR, Vortex, VortexStage, deckTopAt, vortexAxis, vortexReach } from "./vortexSky";
import { CashStack, type Bundle } from "./hundredthCash";

export const FPS = 24000 / 1001;
export const DURATION = 96;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f2 = (v: number) => (Math.round(v * 100) / 100).toString();

// ===================================================================================================================
// THE CAMERA: one long eased move (aircraftShared's damped follower over long smoothstep glides)
// ===================================================================================================================
const AX = NS_VORTEX.at;
/** f0: the vortex centred and big, the cash (all but a corner) out of frame right */
const CAM0: SideCam = { mode: "side", x: AX[0] - 60, y: 6300, z: -6200, f: 2600, horizon: 960, pitch: 4.2, yaw: 0 };
/** where the move's truck, rise and pan land (~f46): the vortex whole on the left, the mound whole on the right */
const CAM_PAIR = { x: 76, y: 7100, horizon: 675, pitch: 9, yaw: -8.22 } as const;
/** the lens: wide for the two-shot (~f38), then a slow push in toward the pair (the vortex and the one bundle) */
const LENS = { wide: 946, push: 1800 } as const;
const PRE = 40;
const at = (f: number) => PRE + f;
const TRACK_ = airTrack(
  CAM0,
  [
    // ONE move. The camera trucks right, rises and pans left round onto the pair (an arc, f-4 -> f46), while the lens
    // widens (the pull-back, f-4 -> f38): eased in from near rest on f0, fastest ~f18-22, easing out by ~f40 ...
    { f0: at(-4), f1: at(47), to: { ...CAM_PAIR }, warp: 0.97 },
    { f0: at(-4), f1: at(37), to: { f: LENS.wide } },
    // ... and its tail, from ~f33: the lens pushes in slowly toward the pair (front-loaded: warp < 1), so the shot
    // keeps drifting in to f95 and past it, slowing (~6 -> 4 px/f), never stopping. The camera never moves back.
    { f0: at(34), f1: at(131), to: { f: LENS.push }, warp: 0.57 },
  ],
  PRE + 120,
);
export const camAt = (f: number) => airCamAt(TRACK_, f + PRE) as SideCam;

// ===================================================================================================================
// THE CASH
// ===================================================================================================================
/** a giant bundle (m): the note face 150 : 64, 36 / 390 of its width thick */
export const BUNDLE: Bundle = { w: 1500, d: 640, t: 138, strap: 0.2 };
const COLS = 2;
const ROWS = 5;
/** bundles per stack, [column][row]: row 0 the back to row 4 the front; the column nearer the vortex a step lower */
const STACK_N = [
  [12, 10, 9, 7, 5],
  [16, 14, 11, 9, 7],
];
const GX = 60;
const GZ = 60;
/** the mound's front-left corner (X, Z) */
const MOUND = { x0: -580, zFront: 0 } as const;
const SURV = { row: 1, col: 0 } as const;
/** how far below the deck's lowest point under a stack its foot sits (m) */
const FOOT_SINK = 60;
const SINK = 8;
const WAVE = { f0: 37, span: 10 } as const;
const SURV_SINK = { f0: 43, f1: 56 } as const;

type StackSpec = { i: number; row: number; col: number; x: number; z: number; n: number; base: number; crest: number; start: number; survivor: boolean };
const stackXZ = (row: number, col: number) => ({ x: MOUND.x0 + col * (BUNDLE.w + GX), z: MOUND.zFront + (ROWS - 1 - row) * (BUNDLE.d + GZ) });
const deckMin = (x: number, z: number) => {
  let m = Infinity;
  for (const S of [0, 48, 96]) for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5], [0.5, 0], [0, 0.5], [1, 0.5], [0.5, 1]]) m = Math.min(m, deckTopAt([x + u * BUNDLE.w, z + v * BUNDLE.d], S, VORTEX_AIR));
  return m;
};
/** the deck's highest point under a stack (m): a sinking stack goes on down past it, so it leaves no stray top behind */
const deckMax = (x: number, z: number) => {
  let m = -Infinity;
  for (const S of [0, 48, 96]) for (let u = 0; u <= 1.001; u += 0.25) for (let v = 0; v <= 1.001; v += 0.25) m = Math.max(m, deckTopAt([x + u * BUNDLE.w, z + v * BUNDLE.d], S, VORTEX_AIR));
  return m;
};
const SRC = stackXZ(ROWS - 1, COLS - 1);
const STACKS: StackSpec[] = (() => {
  const raw: Omit<StackSpec, "start">[] = [];
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++) {
      const { x, z } = stackXZ(row, col);
      raw.push({ i: raw.length, row, col, x, z, n: STACK_N[col][row], base: deckMin(x, z) - FOOT_SINK, crest: deckMax(x, z), survivor: row === SURV.row && col === SURV.col });
    }
  const dist = (s: { x: number; z: number }) => Math.hypot(s.x - SRC.x, s.z - SRC.z);
  const far = Math.max(...raw.filter((s) => !s.survivor).map(dist));
  return raw.map((s) => ({ ...s, start: s.survivor ? SURV_SINK.f0 : WAVE.f0 + (WAVE.span * dist(s)) / far }));
})();
const SURV_SPEC = STACKS.find((s) => s.survivor) as StackSpec;
/** the one that stays ends with its top bundle standing whole on the cloud, its foot clear of every heap between it and
 *  the end camera (the deck's heights along the sight lines from its near edge, at the end frames) */
const clearance = (cam: SideCam, p: V3, S: number) => {
  let m = Infinity;
  for (let i = 1; i <= 120; i++) {
    const t = i / 120;
    const q: V3 = [p[0] + (cam.x - p[0]) * t, p[1] + (cam.y - p[1]) * t, p[2] + (cam.z - p[2]) * t];
    if (q[1] > 3700) break;
    m = Math.min(m, q[1] - deckTopAt([q[0], q[2]], S, VORTEX_AIR));
  }
  return m;
};
const SURV_REST = (() => {
  let need = -Infinity;
  for (const f of [60, 78, 95])
    for (const u of [0.08, 0.5, 0.92]) {
      let y = 1200;
      while (y < 4000 && clearance(camAt(f), [SURV_SPEC.x + u * BUNDLE.w, y, SURV_SPEC.z], f) < 200) y += 5;
      need = Math.max(need, y);
    }
  return need - (SURV_SPEC.n - 1) * BUNDLE.t;
})();
const sinkOf = (s: StackSpec, f: number) => {
  if (s.survivor) {
    const u = clamp01((f - SURV_SINK.f0) / (SURV_SINK.f1 - SURV_SINK.f0));
    // a slow start, a long soft landing
    return s.base + (SURV_REST - s.base) * smoothstep(Math.pow(u, 0.8));
  }
  const u = clamp01((f - s.start) / SINK);
  // down into the heap, gathering pace (it is out of sight before it would slow)
  // the whole stack goes down as one, gathering pace, until its top is well under the deck's highest point beneath it
  // (so no corner is left showing through a dip between the heaps); then it is culled, out of sight
  // (it starts with some way on, so a short stack whose top sits at the cloud's surface is not left lingering there)
  return s.base - (s.n * BUNDLE.t + (s.crest - s.base) + 250) * (u * (0.3 + 0.7 * u));
};
/** the one that stays: its strap lights up as it settles */
const litAt = (f: number) => smoothstep(clamp01((f - 47) / 12));
if (STACKS.length !== COLS * ROWS || STACKS.reduce((a, s) => a + s.n, 0) !== 100) throw new Error("HundredthOfTheCost: the mound must hold 100 bundles");
if (Math.max(...STACKS.filter((s) => !s.survivor).map((s) => s.start + SINK)) > 56.01) throw new Error("HundredthOfTheCost: the 99 must be gone by f56");

// ===================================================================================================================
// THE DATE: SEPT 202[6 -> 7], a tick beside the vortex (cut 10's CostTick family)
// ===================================================================================================================
const DATE_H = 0.8;
const DATE = (() => {
  const ax = vortexAxis(NS_VORTEX, DATE_H);
  const r = vortexReach(NS_VORTEX, DATE_H);
  return { at: [ax[0] + r, ax[1], ax[2]] as V3, length: 2600, size: 500 };
})();
const ENTER = { f0: 47, f1: 59 } as const;
const ROLL_F = { f0: 62, f1: 71 } as const;
const rollAt = (f: number) => smoothstep(clamp01((f - ROLL_F.f0) / (ROLL_F.f1 - ROLL_F.f0)));
const HALO = `drop-shadow(0 0 6px rgba(34,21,11,0.7)) drop-shadow(0 0 18px rgba(34,21,11,0.45))`;

const DateTick: React.FC<{ f: number; cam: SideCam }> = ({ f, cam }) => {
  const uid = `dt${useId().replace(/[^A-Za-z0-9]/g, "")}`;
  const a = easeOutCubic(clamp01((f - ENTER.f0) / (ENTER.f1 - ENTER.f0)));
  if (a <= 0.002) return null;
  const p0 = airProject(cam, DATE.at);
  const p1 = airProject(cam, [DATE.at[0] + DATE.length, DATE.at[1], DATE.at[2]]);
  const fs = DATE.size * p0.s;
  const lift = (1 - a) * 24;
  const blurIn = 6 * (1 - a);
  const ruleW = Math.max(1.5, 0.011 * fs);
  const base = p0.y - 0.16 * fs;
  const x0 = p0.x + 0.06 * fs;
  const sept = labelWidth("SEPT", fs);
  const space = 0.3 * fs;
  const adv = TNUM_ADV * fs + TRACK.numeral * fs;
  const yx = x0 + sept + space;
  const digitX = (i: number) => yx + i * adv + (TNUM_ADV * fs) / 2;
  const r = rollAt(f);
  const lineH = fs;
  const speed = (rollAt(f + 0.5) - rollAt(f - 0.5)) * lineH;
  const blur = 0.32 * speed;
  // the drum's window: the resting digit's cap box + a feather above and below
  const F = 0.16 * fs;
  const top = base - 0.729 * fs - F;
  const bot = base + F;
  const fe = F / (bot - top);
  const numStyle: React.CSSProperties = { fontFeatureSettings: '"tnum" 1, "lnum" 1' };
  const sx = x0 + 1.9 * fs;
  const sy = base - 0.3 * fs;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <radialGradient id={`${uid}sh`}>
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0.56" />
          <stop offset="0.55" stopColor={COLOR.shadow} stopOpacity="0.34" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(top)} x2="0" y2={f2(bot)}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset={f2(fe)} stopColor="#fff" stopOpacity="1" />
          <stop offset={f2(1 - fe)} stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f2(digitX(3) - fs)} y={f2(top)} width={f2(2 * fs)} height={f2(bot - top)}>
          <rect x={f2(digitX(3) - fs)} y={f2(top)} width={f2(2 * fs)} height={f2(bot - top)} fill={`url(#${uid}g)`} />
        </mask>
        <filter id={`${uid}b`} x="-10%" y="-40%" width="120%" height="180%">
          <feGaussianBlur stdDeviation={`0 ${f2(blur)}`} />
        </filter>
      </defs>
      <ellipse cx={f2(sx)} cy={f2(sy)} rx={f2(2.9 * fs)} ry={f2(1.4 * fs)} fill={`url(#${uid}sh)`} opacity={f2(a)} />
      <g opacity={f2(a)} transform={`translate(0 ${f2(lift)})`} style={{ filter: `${blurIn > 0.05 ? `blur(${f2(blurIn)}px) ` : ""}${HALO}` }} fill={COLOR.inkCream}>
        <line x1={f2(p0.x)} y1={f2(p0.y)} x2={f2(p1.x)} y2={f2(p1.y)} stroke={COLOR.inkCream} strokeWidth={f2(ruleW)} />
        <text x={f2(x0)} y={f2(base)} fontFamily={FONT_LABEL} fontWeight={500} fontSize={f2(fs)} letterSpacing={`${TRACK.label}em`} style={{ fontFeatureSettings: '"case" 1' }}>
          SEPT
        </text>
        {["2", "0", "2"].map((d, i) => (
          <text key={i} x={f2(digitX(i))} y={f2(base)} textAnchor="middle" fontFamily={FONT_NUM} fontWeight={700} fontSize={f2(fs)} style={numStyle}>
            {d}
          </text>
        ))}
        <g mask={`url(#${uid}m)`}>
          <g filter={blur > 0.05 ? `url(#${uid}b)` : undefined} fontFamily={FONT_NUM} fontWeight={700} fontSize={f2(fs)} style={numStyle}>
            {r < 1 ? (
              <text x={f2(digitX(3))} y={f2(base - r * lineH)} textAnchor="middle">
                6
              </text>
            ) : null}
            {r > 0 ? (
              <text x={f2(digitX(3))} y={f2(base + (1 - r) * lineH)} textAnchor="middle">
                7
              </text>
            ) : null}
          </g>
        </g>
      </g>
    </svg>
  );
};

// ===================================================================================================================
// THE ONE THAT STAYS: a warm glow round its lit strap (overlay, screen blend, pinned to the strap)
// ===================================================================================================================
const SurvivorGlow: React.FC<{ f: number; cam: SideCam }> = ({ f, cam }) => {
  const uid = `sg${useId().replace(/[^A-Za-z0-9]/g, "")}`;
  const lit = litAt(f);
  if (lit < 0.01) return null;
  const s = SURV_SPEC;
  const y = sinkOf(s, f) + (s.n - 0.5) * BUNDLE.t;
  const c = airProject(cam, [s.x + BUNDLE.w / 2, y, s.z]);
  const top = airProject(cam, [s.x + BUNDLE.w / 2, y + 0.5 * BUNDLE.t, s.z + BUNDLE.d / 2]);
  const r = 0.55 * BUNDLE.w * c.s;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor={COLOR.amberTop} stopOpacity="0.5" />
          <stop offset="0.35" stopColor={COLOR.amberTop} stopOpacity="0.22" />
          <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={f2(c.x)} cy={f2((c.y + top.y) / 2)} rx={f2(0.55 * r)} ry={f2(0.75 * r)} fill={`url(#${uid}g)`} opacity={f2(lit)} />
    </svg>
  );
};

// ===================================================================================================================
// THE FRAME
// ===================================================================================================================
export const PROBE = () => ({ STACKS, BUNDLE, SURV_REST, DATE, sinkOf, camAt });

const HundredthOfTheCost: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f;
  const cam = camAt(f);
  const lit = litAt(f);
  return (
    <VortexStage
      cam={cam}
      S={S}
      rest={camAt(0)}
      world={
        <>
          <Vortex at={NS_VORTEX.at} height={NS_VORTEX.height} seed={NS_VORTEX.seed} fill={0} look={CUT10_LOOK} />
          {STACKS.map((s) => {
            const y = sinkOf(s, f);
            // gone once its top is under the deck's highest point beneath it: past there only odd corners would show
            // through dips between the heaps, so the stack goes down whole
            if (!s.survivor && y + s.n * BUNDLE.t < s.crest - 20) return null;
            return <CashStack key={s.i} cam={cam} S={S} at={[s.x, y, s.z]} n={s.n} bundle={BUNDLE} glow={s.survivor ? lit : 0} />;
          })}
        </>
      }
      overlay={
        <>
          <SurvivorGlow f={f} cam={cam} />
          <DateTick f={f} cam={cam} />
        </>
      }
    />
  );
};

export default HundredthOfTheCost;
