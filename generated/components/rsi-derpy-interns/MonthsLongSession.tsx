// ---------------------------------------------------------------------------
// MonthsLongSession (rsi-derpy-interns, cut 61). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 169 frames.
//
// CHECK LINE: "stretch one session across months and the same AI never gets reset: its orange pile of notes grows
// as tall as the person's."
//
// THE LINE: "And so you'll have sessions that are effectively many months long, and this will allow a single
// instance to learn effectively on the job."
// WORD -> FRAME: And -3 · so 2 · you'll 5 · have 8 · sessions 10 · that 19 · are 22 · effectively 24 · many 30 ·
//   months 39 · long 48 · and 61 · this 72 · will 81 · allow 83 · a 90 · single 95 · instance 102 · to 111 ·
//   learn 127 · effectively 135 · on 146 · the 156 · job 159 (slot ends 169) (word_tables.md, composition frames).
// DURATION: the slot 61.186 -> 68.235 s = 7.049 s x 23.976 = 169 frames (f0..f168).
//
// THE MOTION: it opens on cut 6's resolved picture (SESSION_END: the person under its white tower, the intern just
// through door 6 with two orange cards, DAY 1 on door 6's sign, MONTH 3 centred between them, door 7 blank ahead).
// On "sessions" door 6 STRETCHES: its right jamb slides along the calendar rule (f4 -> f40), the one white squircle
// frame growing into a long session that ends past MONTH 5, its DAY 1 sign staying at the left; door 7 (the next
// reset) is carried ahead of the jamb at its old spacing and leaves frame right. MONTH 4 and MONTH 5 slide up under
// the rule as the jamb passes them (the second lands before "months"). The camera pulls back and pans right with
// the stretch to read the long session end to end (k 0.91 -> ~0.5, ~f48), then pushes back in on the pair as they
// stroll (one constant-speed walk, f8 -> f150) to its far end. From f52 the intern's stack grows steadily, one
// orange card rising out of its arms every ~5.7 frames and none ever dropped (no door inside the session), until
// at f150 it holds 19 cards like the person's white tower: two equal towers, MONTH 5 centred between them, the far
// jamb just ahead. Breath, tower sway, grid drift and a slow creep keep it alive to f168.
// READABLE IN THE WIDE: the calendar labels and the DAY 1 sign (text and plate) are counter-scaled with the camera to
// at least 36 screen px through the wide and ease back to cut 6's world size as it pushes in (`readScale`; exactly 1
// at f0 and from ~f110 on).
// CAUSE -> EFFECT: a calendar label starts sliding up on the frame the stretching jamb is LABEL_LEAD past its centre
// (`SCHED.LABEL_F`); door 7 moves only while the jamb moves (rigid offset). Exact frames: `SCHED`.
// Orange = the AI and what it learned; white = people, the calendar, the doors, labels.
//
// SOURCES: none (no figures; the calendar words are generic).
// THE WORLD is `sessionWorld.tsx` (cut 6's; see notes/SESSION_READY.md). Nothing in it is changed.
// ---------------------------------------------------------------------------
import { DERPY_SHIFT_Y } from "./screenShift";
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
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
  clamp,
  iconShadow,
  smoothstep,
  squirclePath,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { FONT_LABEL, INK, INK_HI, LABEL_TRACKING, LABEL_WEIGHT, Label } from "../kits/dwarkesh/alignShared";
import {
  CAL_LABEL_DY,
  CAL_LABEL_SIZE,
  DOOR_H,
  SESSION_SW,
  SIGN_GAP,
  SIGN_H,
  SIGN_TEXT,
  SIGN_TEXT_SIZE,
  SIGN_W,
  CalendarRule,
  CarrierFigure,
  type CardKind,
  DOOR_W,
  DoorSignText,
  SESSION_DOORS,
  SESSION_END,
  SESSION_LAYOUT,
  SESSION_RULE_Y,
  SessionDoor,
  type StackCard,
  type WalkPath,
  calendarTicks,
  carrierPose,
  carryArms,
  integrateSpeed,
  makeCalendar,
  makeWalkPath,
  monthCenterT,
  stackLayout,
  weekCenterT,
} from "./sessionWorld";

export const FPS = 24000 / 1001;
export const DURATION = 169;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const LAST = DURATION - 1;
/** cut 6's last frame: the clocks (sway, breath, tower sway, grid drift) carry on from it */
const W0 = 244;

// --- the world (world px) -------------------------------------------------------------
const { V0, GAP } = SESSION_LAYOUT;
const DOOR5 = SESSION_DOORS[4];
const DOOR6 = SESSION_DOORS[5];
const DOOR7 = SESSION_DOORS[6];
const JAMB_L = DOOR6 - DOOR_W / 2; // the long session's left jamb never moves
const JAMB_R0 = DOOR6 + DOOR_W / 2; // door 6's right jamb at f0

// --- the calendar ---------------------------------------------------------------------
// Cut 6's knots up to month 4's start (so f0 is cut 6's f244: MONTH 3 at 3817 centred between the pair, month
// ticks at 3440 and 4320); from there months are MONTH_W wide, wide enough that at the payoff the label under the
// pair (MONTH 5) is the only one in frame.
const MONTH_W = 700;
const PAIR_START = SESSION_END.aiX - GAP / 2; // 3817
const CAL = makeCalendar([
  [1, SESSION_LAYOUT.D1],
  [2, SESSION_LAYOUT.D2],
  [3, SESSION_LAYOUT.D2 + SESSION_LAYOUT.LD],
  [weekCenterT(1), 2480],
  [8, 2600],
  [weekCenterT(2), 2720],
  [15, 2840],
  [weekCenterT(3), 2960],
  [31, 3080],
  [monthCenterT(2), 3180],
  [61, 3440],
  [monthCenterT(3), PAIR_START],
  [91, 4320],
  [121, 4320 + MONTH_W],
  [151, 4320 + 2 * MONTH_W],
  [181, 4320 + 3 * MONTH_W],
  [211, 4320 + 4 * MONTH_W],
]);
if (Math.abs(CAL.xOf(monthCenterT(3)) - 3817) > 1e-6 || Math.abs(CAL.xOf(61) - 3440) > 1e-6) {
  throw new Error("MonthsLongSession: the calendar no longer starts on cut 6's f244");
}
const TICKS = calendarTicks(CAL, { dayFrom: 1, dayTo: 30, weeksTo: 3, monthsTo: 7 }).filter((t) => t.x >= SESSION_LAYOUT.D1 - 1);
const RULE_X0 = SESSION_LAYOUT.D1 - 1600;
const RULE_X1 = 4320 + 5 * MONTH_W;

// --- the walk: one stroll from cut 6's stop to the far end of the long session --------------
// The pair ends with its midpoint on MONTH 5's centre (one shared time under them, as cut 6 ended on MONTH 3).
const PAIR_END = CAL.xOf(monthCenterT(5));
const DIST = PAIR_END - PAIR_START;
const FW0 = 8; // sets off (just before "sessions")
const FW1 = 150; // stands
const RAMP = 16; // frames to reach / leave the stroll speed
const V_WALK = DIST / (FW1 - FW0 - RAMP); // smoothstep ramps each lose RAMP / 2
const vAt = (f: number) => {
  if (f <= FW0 || f >= FW1) return 0;
  if (f < FW0 + RAMP) return V_WALK * smoothstep((f - FW0) / RAMP);
  if (f > FW1 - RAMP) return V_WALK * (1 - smoothstep((f - (FW1 - RAMP)) / RAMP));
  return V_WALK;
};
const xAi = integrateSpeed(vAt, 0, LAST + 1, SESSION_END.aiX);
const xHu = (f: number) => xAi(f) - GAP;
const AI_END = SESSION_END.aiX + DIST;

/** makeWalkPath ends on a standing mid-stance (phase 0.25); scale the stride so the whole walk is a whole number
 *  of cycles and it STARTS on that same standing pose too (cut 6's last frame). */
const standingWalk = (xAt: (f: number) => number, baseScale: number): WalkPath => {
  const probe = makeWalkPath({ xAt, vAt, f0: 0, f1: LAST, vWalk: V0, strideScale: baseScale });
  const cycles = probe.phase(LAST) - probe.phase(0);
  const n = Math.max(1, Math.round(cycles));
  const walk = makeWalkPath({ xAt, vAt, f0: 0, f1: LAST, vWalk: V0, strideScale: (baseScale * cycles) / n });
  const p0 = walk.phase(0) - 0.25;
  if (Math.abs(p0 - Math.round(p0)) > 1e-3) throw new Error(`MonthsLongSession: walk does not start standing (${p0})`);
  return walk;
};
const WALK_AI = standingWalk(xAi, 1);
const WALK_HU = standingWalk(xHu, 0.965);

// --- the long session's right jamb (door 6 stretching) and door 7 carried ahead -------------
const FS0 = 4;
const FS1 = 44;
/** the jamb ends this far past the intern's stop: its stack (front edge hip + 148) stays clear */
const JAMB_PAST = 210;
const JAMB_R1 = AI_END + JAMB_PAST;
const jambR = (f: number) => JAMB_R0 + (JAMB_R1 - JAMB_R0) * smoothstep((f - FS0) / (FS1 - FS0));
/** door 7 recedes ahead of the jamb, a little faster than it, so the next reset leaves frame right */
const DOOR7_RUN = 1.5;
const door7X = (f: number) => DOOR7 + DOOR7_RUN * (jambR(f) - JAMB_R0);
/** the frame the jamb reaches x */
const jambReach = (x: number) => {
  let lo = FS0;
  let hi = FS1;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (jambR(m) < x) lo = m;
    else hi = m;
  }
  return hi;
};

// --- labels ------------------------------------------------------------------------------
// MONTH 2 and MONTH 3 are in from cut 6; MONTH 4 and MONTH 5 slide up as the stretching jamb passes them.
const LABEL_LEAD = 0;
const LABELS = [
  { text: "MONTH 2", T: monthCenterT(2), f0: -100 },
  { text: "MONTH 3", T: monthCenterT(3), f0: -100 },
  { text: "MONTH 4", T: monthCenterT(4), f0: NaN },
  { text: "MONTH 5", T: monthCenterT(5), f0: NaN },
].map((l) => {
  const x = CAL.xOf(l.T);
  return { ...l, x, f0: Number.isNaN(l.f0) ? jambReach(x + LABEL_LEAD) : l.f0 };
});

// --- the cards ---------------------------------------------------------------------------
// The intern holds cut 6's two session-6 cards (j 0, 1) and gathers 17 more, evenly, f52 -> f143 (each rises over
// CARD_INS 7 frames, so the last is in by f150): 19, the person's count. Nothing is dropped. The person keeps its
// 19 cards (cut 6's HU_TIMES, all settled).
const AI_CARDS = 19;
const HU_CARDS = SESSION_END.humanCards;
const NEW_F0 = 52;
const NEW_F1 = 143;
const AI_TIMES = [
  -30,
  -26,
  ...Array.from({ length: AI_CARDS - SESSION_END.aiCards }, (_, i) =>
    Math.round(NEW_F0 + (i * (NEW_F1 - NEW_F0)) / (AI_CARDS - SESSION_END.aiCards - 1)),
  ),
];
const HU_TIMES = Array.from({ length: HU_CARDS }, (_, i) => -120 + 3 * i);

// a tall stack sways with the stride and leans with the change of speed (cut 6's rule)
const leanAt = (walk: WalkPath, f: number, nCards: number) => {
  const a = vAt(f) - vAt(f - 1);
  const gait = walk.gaitW(f);
  const tall = Math.min(1, nCards / 12);
  return tall * (0.012 * Math.sin(2 * Math.PI * 2 * walk.phase(f)) * gait - 0.006 * a + 0.004 * Math.sin((f + W0) * 0.09));
};

type WalkerState = {
  pose: ReturnType<typeof carrierPose>;
  gait: number;
  anchor: { x: number; y: number };
  stack: StackCard[];
};
const walkerAt = (kind: CardKind, f: number): WalkerState => {
  const walk = kind === "ai" ? WALK_AI : WALK_HU;
  const gait = walk.gaitW(f);
  const pose = carrierPose(kind, walk.hipX(f), walk.feet(f), gait, f + W0);
  const { anchor } = carryArms(pose, gait, 1);
  const times = kind === "ai" ? AI_TIMES : HU_TIMES;
  const n = times.filter((t) => t <= f).length;
  const stack = stackLayout({ anchor, times, frame: f, lean: leanAt(walk, f, n), seed: kind === "ai" ? 0 : 5 });
  return { pose, gait, anchor, stack };
};

// --- the camera ----------------------------------------------------------------------------
// One keyed track (k, cx, and the rule's screen y) through camEase, then the kit damper: from cut 6's f244 camera
// it pulls back and pans right with the stretch until the long session reads end to end (left jamb to right jamb,
// ~f48), then pushes back in on the pair's stop (pair midpoint centred, MONTH 5 under it), with a slow creep to the
// end. The rule's screen y is lifted at the wide so the labels clear the caption band (glyphs end ~rule + 74k).
const K0 = SESSION_END.cam.k;
// wider on the left: the counter-scaled MONTH 3 (centred 50 world left of the jamb) must fit whole in the wide
const WIDE_L = JAMB_L - 150;
const WIDE_R = JAMB_R1 + 50;
const K_WIDE = 1080 / (WIDE_R - WIDE_L);
const K_PAY = 0.95;
const RY_WIDE = 1032;
const RY_PAY = 1004;
const F_WIDE = 38; // the wide key (the damper lands it ~f46)
/** the far jamb's screen x: at the wide, and at the payoff (pair midpoint centred) */
const XJ_WIDE = 540 + (JAMB_R1 - (WIDE_L + WIDE_R) / 2) * K_WIDE;
const XJ_PAY = 540 + (JAMB_R1 - PAIR_END) * K_PAY;
/** during the push-in the person's hip stays at least this far in from the left edge */
const HU_MARGIN = 150;
const softMin = (a: number, b: number, s = 60) => -Math.log(Math.exp(-a * s) + Math.exp(-b * s)) / s;
const CAM_F: number[] = [];
const CAM_K: number[] = [];
const CAM_CX: number[] = [];
const CAM_RY: number[] = [];
for (let f = 0; f <= LAST; f++) {
  let k: number;
  let cx: number;
  let ry: number;
  if (f <= F_WIDE) {
    // the pull-back: cut 6's f244 camera -> the long session end to end
    // the zoom leads the pan a little (warp < 1), so the person behind and the running jamb ahead both stay in
    const u = camEase(f / F_WIDE, 1);
    k = K0 + (K_WIDE - K0) * camEase(f / F_WIDE, 0.8);
    cx = SESSION_END.cam.cx + ((WIDE_L + WIDE_R) / 2 - SESSION_END.cam.cx) * u;
    ry = SESSION_END.cam.ry + (RY_WIDE - SESSION_END.cam.ry) * u;
  } else {
    // the push-in: the far jamb holds its place near the right edge while k rises as fast as the person (walking
    // in from the left) allows, up to the payoff zoom and then a slow creep
    const fit = (XJ_PAY - HU_MARGIN) / (JAMB_R1 - xHu(f));
    const kPay = K_PAY + 0.012 * camEase((f - 146) / (LAST - 146), 1);
    k = Math.max(K_WIDE, softMin(kPay, fit));
    const u = Math.min(1, (k - K_WIDE) / (K_PAY - K_WIDE));
    cx = JAMB_R1 - (XJ_WIDE + (XJ_PAY - XJ_WIDE) * u - 540) / k;
    ry = RY_WIDE + (RY_PAY - RY_WIDE) * u;
  }
  CAM_F.push(f);
  CAM_K.push(k);
  CAM_CX.push(cx);
  CAM_RY.push(ry);
}
const CAM_TABLE: { k: number; cx: number; ry: number }[] = (() => {
  const out = [];
  let k = CAM_K[0];
  let cx = CAM_CX[0];
  let ry = CAM_RY[0];
  let vk = 0;
  let vx = 0;
  let vy = 0;
  out.push({ k, cx, ry });
  for (let f = 1; f <= LAST; f++) {
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    const tx = interpolate(f, CAM_F, CAM_CX, clamp);
    const ty = interpolate(f, CAM_F, CAM_RY, clamp);
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (ty - ry) * CAM_STIFF - vy * CAM_DAMP;
    ry += vy;
    out.push({ k, cx, ry });
  }
  return out;
})();
const camAt = (f: number) => {
  const c = CAM_TABLE[Math.max(0, Math.min(LAST, Math.round(f)))];
  return { ...c, cy: SESSION_RULE_Y - (c.ry - 960) / c.k };
};
// f0 is cut 6's resolved camera
{
  const c = camAt(0);
  const e = SESSION_END.cam;
  if (Math.abs(c.k - e.k) > 1e-6 || Math.abs(c.cx - e.cx) > 1e-6 || Math.abs(c.cy - e.cy) > 0.01) {
    throw new Error(`MonthsLongSession: f0 camera ${JSON.stringify(c)} is not SESSION_END.cam`);
  }
}
// the grid: rest in the middle of this cut's travel so the parallax stays inside the 1.8x oversize
const CX_REST = (SESSION_END.cam.cx + PAIR_END) / 2;
const CY_REST = SESSION_END.cam.cy;

/** everything a reviewer needs, for the hand-off */
export const SCHED = {
  V_WALK,
  DIST,
  AI_END,
  PAIR_END,
  JAMB_R1,
  K_WIDE,
  LABELS,
  AI_TIMES,
  camAt,
  walkerAt,
  jambR,
  door7X,
  xAi,
  xHu,
  CAL,
};

// --- text that has to read in the wide ---------------------------------------------------------
// At the wide (k ~0.50) cut 6's world-sized calendar labels and DAY 1 come out ~24 screen px. They are what says
// "many months, one session", so they are counter-scaled with the camera to at least READ_PX screen px, and ease
// back to cut 6's world size as the camera pushes in (exactly 1 at any k where the world size already reads
// >= READ_PX / (1 - READ_EASE), so f0 and the resolved frames are unchanged). The DAY 1 plate grows with its text.
const READ_PX = 36;
const READ_EASE = 0.05;
/** the factor a world-sized text needs at zoom k: 1 while it reads, a C1 ramp up to READ_PX / (size * k) below */
const readScale = (worldSize: number, k: number) => {
  const x = READ_PX / (worldSize * k) - 1 + READ_EASE;
  if (x <= 0) return 1;
  if (x < 2 * READ_EASE) return 1 + (x * x) / (4 * READ_EASE);
  return 1 + x - READ_EASE;
};
/** door 6, stretched to width w, with its sign plate scaled s about its bottom centre (on the hangers). At s 1 it
 *  draws exactly what sessionWorld's SessionDoor draws. SVG. */
const LongDoor: React.FC<{ k: number; w: number; s: number }> = ({ k, w, s }) => {
  const hy0 = SESSION_RULE_Y - DOOR_H;
  const pw = SIGN_W * s;
  const ph = SIGN_H * s;
  const py = hy0 - SIGN_GAP - ph;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={INK_HI} fill="none" stroke={INK} strokeWidth={SESSION_SW}>
      <path d={squirclePath(w, DOOR_H)} transform={`translate(${JAMB_L.toFixed(3)} ${hy0.toFixed(3)})`} />
      {[-0.3, 0.3].map((u) => (
        <line key={u} x1={DOOR6 + u * pw} y1={hy0} x2={DOOR6 + u * pw} y2={py + ph} strokeLinecap="round" />
      ))}
      <path d={squirclePath(pw, ph)} transform={`translate(${(DOOR6 - pw / 2).toFixed(3)} ${py.toFixed(3)})`} />
    </g>
  );
};
/** DAY 1 in door 6's plate at scale s (sessionWorld's DoorSignText layout, fully in). DOM. */
const LongDoorSignText: React.FC<{ k: number; s: number }> = ({ k, s }) => {
  const pw = SIGN_W * s;
  const ph = SIGN_H * s;
  const pad = SESSION_SW / 2;
  const h = ph - 2 * pad;
  return (
    <div
      style={{
        position: "absolute",
        left: DOOR6 - pw / 2 + pad,
        top: SESSION_RULE_Y - DOOR_H - SIGN_GAP - ph + pad,
        width: pw - 2 * pad,
        height: h,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: h,
          lineHeight: `${h}px`,
          textAlign: "center",
          fontFamily: FONT_LABEL,
          fontWeight: LABEL_WEIGHT,
          fontSize: SIGN_TEXT_SIZE * s,
          letterSpacing: LABEL_TRACKING,
          textTransform: "uppercase",
          color: INK,
          whiteSpace: "nowrap",
          filter: iconShadow(k),
        }}
      >
        {SIGN_TEXT}
      </div>
    </div>
  );
};

const MonthsLongSession: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const s = sway(frame + W0);
  const k = cam.k;
  const cx = cam.cx + s.dx;
  const cy = cam.cy + s.dy;
  const { tx, ty } = worldTransform(cx, cy, k);

  const ai = walkerAt("ai", frame);
  const hu = walkerAt("human", frame);
  const jr = jambR(frame);
  const d7 = door7X(frame);
  const sLabel = readScale(CAL_LABEL_SIZE, k);
  const sSign = readScale(SIGN_TEXT_SIZE, k);

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame + W0}
        cy={cy}
        cyRest={CY_REST}
        cx={cx}
        cxRest={CX_REST}
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
            transform: `translate(${tx}px, ${ty + DERPY_SHIFT_Y}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <SessionDoor k={k} x={DOOR5} />
            <LongDoor k={k} w={jr - JAMB_L} s={sSign} />
            <SessionDoor k={k} x={d7} />
            <CalendarRule k={k} x0={RULE_X0} x1={RULE_X1} ticks={TICKS} />
          </svg>
          <DoorSignText k={k} x={DOOR5} inT={1} />
          <LongDoorSignText k={k} s={sSign} />
          {LABELS.map((l) => (
            <Label
              key={l.text}
              k={k}
              x={l.x}
              y={SESSION_RULE_Y + CAL_LABEL_DY}
              text={l.text}
              f0={l.f0}
              frame={frame}
              size={CAL_LABEL_SIZE * sLabel}
            />
          ))}
          {/* the walkers over the sign text, so a passing tower hides DAY 1 rather than DAY 1 printing on it */}
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <CarrierFigure id="hu" k={k} kind="human" pose={hu.pose} gait={hu.gait} carry={1} stack={hu.stack} />
            <CarrierFigure id="ai" k={k} kind="ai" pose={ai.pose} gait={ai.gait} carry={1} stack={ai.stack} />
          </svg>
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default MonthsLongSession;
