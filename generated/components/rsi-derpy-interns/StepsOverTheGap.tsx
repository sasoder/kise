// ---------------------------------------------------------------------------
// StepsOverTheGap (rsi-derpy-interns, cut 37). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 180 frames.
//
// CHECK LINE: "there is a missing piece in the AI's road (continual learning), but it strides over the gap and still
// reaches the top AI researchers by 2028, taking over their work."
//
// THE LINE: "Here's why I don't think that the current lack of continual learning in these models will stop full
// automation of the best AI researchers by 2028."
// WORD -> FRAME: Here's 0 · why 6 · I 9 · don't 13 · think 18 · that 25 · the 31 · current 33 · lack 42 · of 49 ·
//   continual 54 · learning 63 · in 67 · these 72 · models 75 · will 82 · stop 89 · full 98 · automation 106 · of 115 ·
//   the 126 · best 129 · AI 135 · researchers 141 · by 150 · 2028 162 (the brief's table, slot-relative).
// DURATION: the slot 37.746 -> 45.254 s = 7.508 s x 23.976 = 180 frames (f0..f179).
//
// THE MOTION: the series timeline (white rule, year tick and label, rsi-another-jump's look) runs 2026 -> 2028 with
// one HOLE in it just past 2026, where 2027 would be: the rule is cut square and starts again 230 world px later (1.3 x
// a stride). The orange intern (age 1, cut 15's figure, imported) is already walking at f0 with its feet at 2026, at
// one constant speed (4.0 world px/f, ~16-frame steps). The camera is close (k 1.12 -> 1.15, a slow creep right): 2026
// on the left, the hole ahead in shot from f0, the intern crossing the frame toward it; the researchers are kept fully
// off the right edge. On "the current lack" (f31-40) a dim (INK_LO), marching DASHED line draws head-led across the
// hole (dashed = not real yet), and on "continual" a white CONTINUAL LEARNING (44 px at rest, centred on the hole)
// slides up under it (f44, settled f54). On "will stop" it strides over: one long step (286 world px, 4.3 x a normal
// step; the hip dips as the legs spread, never rises: no jump), the front foot swinging over the hole and planting past
// it at f79, both feet planted either side of the hole f79-89, the back foot swinging over f90-122; then it closes up
// and stops at f143. The dashes stay behind it. From f88 the camera eases back (k 1.15 -> 0.90, settled ~f155), which
// reveals three white researchers at 2028 (HumanFigure's build, facing it, arms clear) from the right, and frames the
// whole road. One orange thread per researcher leaves the intern's OpenAI-mark head (constant speed, a white tip while
// drawing) and lands on the researcher's head, nearest first, each only once its researcher is fully in frame; from
// that frame its tone runs white -> ACCENT over 12 frames (a tone wave, not a pop); each thread holds 10 frames and
// fades. 2028's tick drops and its label slides up f146-156, before "2028" (f162). f156-179: settled and alive
// (breath, marching dashes, sway, grid drift, a slow push-in creep). No fade.
// CAUSE -> EFFECT: the front foot plants past the hole at f79; nothing else changes before it. Thread lands -> the
//   researcher starts to turn, same frame: f117, f129, f141 (each done 12 frames later; the last at f153).
// FRAMING (measured on the preview): white text never lower than y 1068 on any frame (caption band from 1080); rule at
// screen y 980 while close, 1000 at rest. Resolved (f179, k 0.902): intern and researchers ~443 px tall, the 2026
// label ~55 px in from the left edge, the last researcher's back ~62 px from the right; the intern ~549 px tall at f0.
// SOURCES: the years only (the essay, Nov 2026: "full automation of the best AI researchers by 2028"). No other
// figure on screen.
//
// THE WORLD is rsi-another-jump's `timelineWorld.tsx` (the intern: AiFigure, figurePose; the rule's look) and
// `jumpWorld.tsx` (HumanFigure's build), imported read-only, plus this cut's `gapShared.tsx` (a footfall walk with
// one long step; the researcher figure with a white -> orange tone).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_STIFF,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  iconShadow,
  smoothstep,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK, INK_HI, INK_LO, Label, MARCH_PX_PER_F, STROKE_PX, THREAD_PX, worldPx } from "../kits/dwarkesh/alignShared";
import {
  AiFigure,
  RULE_Y,
  TICK_LEN,
  TICK_DRAW,
  YEAR_LABEL_DY,
  figurePose,
  proportions,
} from "../rsi-another-jump/timelineWorld";
import { Plant, ResearcherFigure, makeStepWalk, researcherHead } from "./gapShared";

export const FPS = 24000 / 1001;
export const DURATION = 180;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// --- the resting zooms ----------------------------------------------------------------
const SW = worldPx(STROKE_PX, 0.93); // the rule and its ticks: ~6.5 px through the cut
const THREAD = worldPx(THREAD_PX, 0.93);

// --- the walk -------------------------------------------------------------------------
const AGE = 1; // the intern, grown up
const PR = proportions(AGE);
/** world px per frame: one constant speed from f0, a short stop at the end */
const V = 4.0;
const STEP = 66; // a step (one footfall to the next) ~16.5 frames at V
const HIP0 = 0; // the hip at f0
/** the frame the hip is over the middle of the gap: the long step's straddle */
const F_MID = 84;
const GAP_W = 230; // the hole in the rule, world px: 1.3 x a stride (two steps of the walk at its natural length)
const TOE = 30; // a planted foot reaches this far in front of its ankle (figurePose: footL * 0.72)
const HEEL = 12; // and this far behind it
const MARGIN = 7; // a planted foot keeps this much rule between it and the hole
const MID_X = HIP0 + V * F_MID;
// the back foot plants just before the hole, the front foot just after it; the hip passes their midpoint at F_MID
const L_LONG = GAP_W + TOE + HEEL + 2 * MARGIN; // 286: the long step, 4 x a normal one
const P_BACK = MID_X - L_LONG / 2;
export const G0 = P_BACK + TOE + MARGIN; // the hole's near edge
export const G1 = G0 + GAP_W;
const P_FRONT = P_BACK + L_LONG;
/** both feet planted, either side of the hole, while the hip is within STRADDLE of the middle */
const STRADDLE = 22;
/** the swing over the hole lifts a little higher than a normal step */
const GAP_LIFT = 1.5;
const DBL = 26; // the regular steps next to the long one keep both feet down this much longer (hip px)
/** the stop: the back foot's next footfall, the hip a little past it, the front foot closing up */
const P_LAST = P_FRONT + STEP * 0.8;
const HIP_S = P_LAST + 12;
const T_STOP = 14; // frames of the stop's ease-out
const D_STOP = (V * T_STOP) / 2;
const F_DEC = F_MID + (HIP_S - D_STOP - MID_X) / V; // the stop's ease starts here
export const F_STOP = F_DEC + T_STOP;
export const hipAt = (f: number) => {
  if (f <= F_DEC) return HIP0 + V * f;
  const u = clamp01((f - F_DEC) / T_STOP);
  // integral of (1 - smoothstep): eases from V to 0 over T_STOP
  const ramp = u - (u * u * u - (u * u * u * u) / 2);
  return HIP0 + V * F_DEC + V * T_STOP * ramp;
};
export const gaitAt = (f: number) => (f <= F_DEC ? 1 : 1 - smoothstep((f - F_DEC) / T_STOP));
// the footfalls: regular steps (each foot down while the hip is within STEP / 2 of it) up to the hole, the long
// step, then the back foot's last footfall and the front foot closing up under the hip
const PLANTS: { side: "near" | "far"; p: Plant }[] = [];
{
  const n = 8; // regular footfalls before the back foot's
  for (let i = n; i >= 1; i--) {
    const side = i % 2 === 1 ? "near" : "far"; // the one right before the back (far) foot is near
    const x = P_BACK - i * STEP;
    PLANTS.push({ side, p: { x, land: STEP / 2, lift: STEP / 2 + (i === 1 ? DBL : 0) } });
  }
  PLANTS.push({ side: "far", p: { x: P_BACK, land: STEP / 2, lift: L_LONG / 2 + STRADDLE } });
  PLANTS.push({ side: "near", p: { x: P_FRONT, land: L_LONG / 2 + STRADDLE, lift: STEP / 2, liftK: GAP_LIFT } });
  PLANTS.push({ side: "far", p: { x: P_LAST, land: STEP / 2 + DBL, lift: 1e5, liftK: GAP_LIFT } });
  PLANTS.push({ side: "near", p: { x: HIP_S + 6, land: 6, lift: 1e5 } });
}
const WALK = makeStepWalk({
  near: PLANTS.filter((q) => q.side === "near").map((q) => q.p),
  far: PLANTS.filter((q) => q.side === "far").map((q) => q.p),
  liftH: 0.06 * PR.H,
});
/** figurePose pulls a standing figure's far foot back by footL * 0.42 * (1 - gait); give it that back so a planted
 *  foot never slides as the intern stops */
const SPLIT = PR.footL * 0.42;
export const feetAt = (f: number) => {
  const ft = WALK(hipAt(f), gaitAt(f));
  return { near: ft.near, far: { x: ft.far.x + SPLIT * (1 - gaitAt(f)), lift: ft.far.lift } };
};

// --- the road ---------------------------------------------------------------------------
/** 2026 sits just ahead of the intern at f0: it walks on from 2026 */
export const X26 = HIP0 - 20;
const RULE_L = X26 - 900; // runs off the left of every frame
const RULE_R = X26 + 3000; // and off the right
const RY = Math.round(RULE_Y) + 0.5;
/** the dashes across the hole: drawn head-led on "the current lack", then marching */
const DASH_F0 = 31;
const DASH_F1 = 40;
const DASH_ON = 22;
const DASH_OFF = 15;
const DASH_INSET = 16; // clear rule at each end of the hole, so it reads as a hole with a dashed line over it
const LEARN_F0 = 44; // CONTINUAL LEARNING slides up, settled by "continual" (f54)
const Y28_F0 = 146; // 2028's tick drops and its label slides up, settled by f156 ("2028" f162)

// --- the researchers ------------------------------------------------------------------------
const R_GAP = 162; // the intern's hip to the nearest researcher's
const R_STEP = 118; // arms clear of each other
export const RESEARCHERS = [0, 1, 2].map((i) => HIP_S + R_GAP + i * R_STEP);
/** a researcher's extent from its hip (facing left: the front edge is its near foot / arm, the back its heel) */
const R_FRONT = 55;
const R_BACK = 48;
/** 2028 stands under the middle researcher */
export const X28 = RESEARCHERS[1];
/** a thread leaves the intern's head and lands on each researcher's head in turn, nearest first; the researcher's
 *  tone turns white -> orange from the frame it lands (cause -> effect, same frame) */
const LAND = [117, 129, 141];
const THREAD_V = 30; // world px per frame along the thread, every thread
const TONE_F = 12;
const THREAD_HOLD = 10;
const THREAD_FADE = 10;

// --- the camera ------------------------------------------------------------------------------
// One key track (k, cx, the rule's SCREEN y; cy is solved from k so the rule holds its screen height) through the
// kit's damper. Walk (f0-92): close (k 1.12 -> 1.15, a slow creep right), 2026 on the left and the hole ahead in
// shot, the intern crossing the frame toward it; the group's front edge is kept just off the right edge (R_OFF).
// Payoff (f92-150): ease back to K_PAY, which reveals the group from the right and frames the whole road.
const K_A = 1.12;
const K_B = 1.15;
const R_OFF = 14; // screen px between the right edge and the nearest researcher's front while the camera is close
const CX_A = RESEARCHERS[0] - R_FRONT - (540 + R_OFF) / K_A;
const CX_B = RESEARCHERS[0] - R_FRONT - (540 + R_OFF) / K_B;
const RY_TRACK = 980;
const RY_PAY = 1000;
/** the payoff: 2026's label (half-width 52 screen px) 60 px in from the left, the last researcher's back 60 px in
 *  from the right; k solved from the world between them */
const LBL26_HALF = 52;
const EDGE = 60;
export const K_PAY = (1080 - LBL26_HALF - 2 * EDGE) / (RESEARCHERS[2] + R_BACK - X26);
const PAY_CX = (X26 - (LBL26_HALF + EDGE) / K_PAY + RESEARCHERS[2] + R_BACK + EDGE / K_PAY) / 2;
const LABEL_SIZE = worldPx(48, K_PAY);
/** the gap's own label: 44 px, a little under the years, so the row never reads as one phrase */
const GAP_LABEL_SIZE = worldPx(44, K_PAY);
const PAY_F0 = 88;
const PAY_F1 = 150;
const cyFor = (k: number, ry: number) => RULE_Y - (ry - 960) / k;
const CAM_TRACK = (() => {
  const key = (f: number) => {
    const w = clamp01(f / PAY_F0);
    const kw = lerp(K_A, K_B, w);
    const cxw = lerp(CX_A, CX_B, w);
    const u = camEase((f - PAY_F0) / (PAY_F1 - PAY_F0), 0.9);
    const c = camEase((f - PAY_F1) / (DURATION - PAY_F1), 1);
    const k = Math.exp(lerp(Math.log(kw), Math.log(K_PAY), u)) * (1 + 0.004 * c);
    return { k, cx: lerp(cxw, PAY_CX, u) + 4 * c, ry: lerp(RY_TRACK, RY_PAY, u) };
  };
  const out: { k: number; cx: number; cy: number }[] = [];
  const k0 = key(0);
  let k = k0.k;
  let cx = k0.cx;
  let cy = cyFor(k0.k, k0.ry);
  let vk = (key(1).k - k0.k);
  let vx = key(1).cx - k0.cx; // already creeping
  let vy = 0;
  out.push({ k, cx, cy });
  for (let f = 1; f <= DURATION; f++) {
    const t = key(f);
    vk += (t.k - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vx += (t.cx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (cyFor(t.k, t.ry) - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    out.push({ k, cx, cy });
  }
  return out;
})();
export const camAt = (f: number) => CAM_TRACK[Math.max(0, Math.min(DURATION, Math.round(f)))];

// --- threads ---------------------------------------------------------------------------------
type Pt = { x: number; y: number };
const quad = (p0: Pt, p1: Pt, p2: Pt, t: number): Pt => ({
  x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
  y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y,
});
const arcPts = (p0: Pt, p2: Pt, n = 48) => {
  const d = p2.x - p0.x;
  const p1 = { x: (p0.x + p2.x) / 2, y: Math.min(p0.y, p2.y) - (40 + 0.32 * d) };
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push(quad(p0, p1, p2, i / n));
  const cum = [0];
  for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, len: cum[n] };
};
const upTo = (a: ReturnType<typeof arcPts>, d: number) => {
  const out: Pt[] = [a.pts[0]];
  let i = 1;
  while (i < a.pts.length && a.cum[i] <= d) out.push(a.pts[i++]);
  if (i < a.pts.length) {
    const w = (d - a.cum[i - 1]) / Math.max(1e-6, a.cum[i] - a.cum[i - 1]);
    out.push({ x: lerp(a.pts[i - 1].x, a.pts[i].x, w), y: lerp(a.pts[i - 1].y, a.pts[i].y, w) });
  }
  return out;
};
const pathOf = (pts: Pt[]) => `M${pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")}`;

const StepsOverTheGap: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const s = sway(frame);
  const k = cam.k;
  const cx = cam.cx + s.dx;
  const cy = cam.cy + s.dy;
  const { tx, ty } = worldTransform(cx, cy, k);
  const march = frame * MARCH_PX_PER_F;

  // the intern
  const hipX = hipAt(frame);
  const gait = gaitAt(frame);
  const feet = feetAt(frame);
  const pose = figurePose({ x: hipX, age: AGE, feet, gait, breathT: frame });
  const from = { x: pose.mark.x + pose.mark.size * 0.55, y: pose.mark.y + pose.mark.size * 0.06 };

  // the dashes across the hole, head-led
  const dash0 = G0 + DASH_INSET;
  const dash1 = G1 - DASH_INSET;
  const dashHead = lerp(dash0, dash1, smoothstep((frame - DASH_F0) / (DASH_F1 - DASH_F0)));

  // 2028
  const tick28 = clamp01((frame - Y28_F0) / TICK_DRAW);

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CAM_TRACK[0].cy}
        cx={cx}
        cxRest={CAM_TRACK[0].cx}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {/* the road: solid up to the hole and on from it, 2026's tick, 2028's tick on its word */}
            <g style={{ filter: iconShadow(k) }} stroke={INK} strokeWidth={SW} strokeLinecap="round" fill="none">
              {/* square ends at the hole: the rule is cut, not rounded off */}
              <line x1={RULE_L} y1={RY} x2={G0} y2={RY} strokeLinecap="butt" />
              <line x1={G1} y1={RY} x2={RULE_R} y2={RY} strokeLinecap="butt" />
              <line x1={X26} y1={RY} x2={X26} y2={RY + TICK_LEN} />
              {tick28 > 0 ? (
                <line x1={X28} y1={RY} x2={X28} y2={RY + TICK_LEN * (1 - (1 - tick28) * (1 - tick28))} />
              ) : null}
              {dashHead > dash0 + 0.5 ? (
                <>
                  <defs>
                    <clipPath id="gapClip">
                      <rect x={dash0} y={RY - 40} width={dash1 - dash0} height={80} />
                    </clipPath>
                  </defs>
                  <g clipPath="url(#gapClip)" opacity={INK_LO}>
                    <line
                      x1={dash0 - 200}
                      y1={RY}
                      x2={dashHead}
                      y2={RY}
                      strokeLinecap="butt"
                      strokeDasharray={`${DASH_ON} ${DASH_OFF}`}
                      strokeDashoffset={-(200 - DASH_OFF / 2) - march}
                    />
                  </g>
                </>
              ) : null}
            </g>
            {/* the researchers at 2028, facing the intern; each turns orange from the frame its thread lands */}
            {RESEARCHERS.map((x, i) => (
              <ResearcherFigure
                key={i}
                k={k}
                x={x}
                breathT={frame + i * 23}
                facing={-1}
                tone={smoothstep((frame - LAND[i]) / TONE_F)}
              />
            ))}
            {/* the threads: one from the intern's head to each researcher's head, nearest first */}
            <g style={{ filter: iconShadow(k) }}>
              {RESEARCHERS.map((x, i) => {
                const head = researcherHead(x, frame + i * 23, -1);
                const to = { x: head.x, y: head.y - head.r * 0.9 };
                const arc = arcPts(from, to);
                const start = LAND[i] - arc.len / THREAD_V;
                if (frame < start) return null;
                const d = Math.min(arc.len, (frame - start) * THREAD_V);
                const op = 1 - smoothstep((frame - LAND[i] - THREAD_HOLD) / THREAD_FADE);
                if (op <= 0) return null;
                const pts = upTo(arc, d);
                const tip = pts[pts.length - 1];
                return (
                  <g key={i} opacity={op}>
                    <path d={pathOf(pts)} fill="none" stroke={ACCENT} strokeWidth={THREAD} strokeLinecap="round" />
                    {d < arc.len ? <circle cx={tip.x} cy={tip.y} r={THREAD * 1.5} fill={INK} /> : null}
                  </g>
                );
              })}
            </g>
            <AiFigure id="ai" k={k} x={hipX} age={AGE} feet={feet} gait={gait} breathT={frame} />
          </svg>
          <Label k={k} x={X26} y={RULE_Y + YEAR_LABEL_DY} text="2026" inT={1} size={LABEL_SIZE} opacity={INK_HI} />
          <Label
            k={k}
            x={(G0 + G1) / 2}
            y={RULE_Y + YEAR_LABEL_DY}
            text="Continual learning"
            f0={LEARN_F0}
            frame={frame}
            size={GAP_LABEL_SIZE}
            opacity={INK_HI}
          />
          <Label k={k} x={X28} y={RULE_Y + YEAR_LABEL_DY} text="2028" f0={Y28_F0} frame={frame} size={LABEL_SIZE} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default StepsOverTheGap;
