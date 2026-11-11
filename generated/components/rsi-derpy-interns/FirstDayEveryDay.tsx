// ---------------------------------------------------------------------------
// FirstDayEveryDay (rsi-derpy-interns, cut 6). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 245 frames.
//
// CHECK LINE: "the AI and a person walk through the same days; at every new door the AI's notes fall away and the
// sign says DAY 1 again, while the person's pile of know-how grows over weeks and months."
//
// THE LINE: "Every new session is their first day on the job. They can only retain a couple hours worth of
// information, so they don't accumulate the kind of feedback and know-how that arrives over the course of weeks or
// months."
// WORD -> FRAME: Every 0 · new 4 · session 10 · is 16 · their 28 · first 32 · day 40 · on 46 · the 51 · job 52 ·
//   They 59 · can 62 · only 64 · retain 69 · a 80 · couple 86 · hours 92 · worth 98 · of 106 · information 108 ·
//   so 121 · they 127 · don't 130 · accumulate 135 · the 144 · kind 150 · of 153 · feedback 156 · and 163 ·
//   know-how 172 · that 182 · arrives 195 · over 201 · the 207 · course 209 · of 214 · weeks 217 · or 225 ·
//   months 232 (word_tables.md, composition frames).
// DURATION: the slot 6.673 -> 16.892 s = 10.219 s x 23.976 = 245 frames (f0..f244).
//
// THE MOTION: one continuous walk to the right along a white calendar rule. The orange intern (the series' AI:
// OpenAI-mark head, eyes, badge, tie) steps through the first white session door at the open (k 1.22) and DAY 1
// slides up into the door's sign as it passes under (f21 -> f31). In the first session it gathers three orange note
// cards, each rising out of its arms (f60 / f73 / f86), and stops at three, while the camera eases back (k 1.22 ->
// 0.90 by ~f110) to reveal a white colleague walking 460 world px behind it, carrying a white stack of the same
// cards. From f128 on, at EVERY door the intern's cards stay behind in the doorway, drain to ACCENT_DEEP, tumble
// and fall behind the rule, and the sign over that door reads DAY 1 again; then it gathers 2-3 fresh cards. The
// person keeps every card (the same in-session cards plus one at each door it passes) so its stack grows into a
// tower. The calendar compresses to the right (day ticks -> week ticks -> month ticks), the walk speeds up on one
// smooth ramp (11 -> ~33 world px/frame, doors every 45 -> 14 frames), and the coarse labels slide up as the pair
// reaches them: WEEK 1, WEEK 2, WEEK 3 (on "weeks"), MONTH 2, MONTH 3 (on "months"). The pair slows and stops
// (f240) on one shared time: a single MONTH 3 centred between them, MONTH 2 already passed off the left edge; the
// person under a white tower between two doors, the intern just through the last door (DAY 1 above it) with two
// fresh orange cards; the next door ahead waits blank. Breath, tower sway and grid drift keep it alive to f244.
// CAUSE -> EFFECT: a card drop starts on the frame the intern's stack reaches the door's centre (hip = door - 100),
// the same frame DAY 1 starts sliding up in that door's sign; the person's door card starts rising on the frame its
// own stack reaches a door's centre. Exact frames: see `SCHED` (printed in the hand-off).
// Orange = the AI and what it learned; white = people, the calendar, the doors, labels.
//
// SOURCES: none (no figures; the calendar words are generic).
// THE WORLD is `sessionWorld.tsx` (shared with cuts 50 and 61; see notes/SESSION_READY.md).
// ---------------------------------------------------------------------------
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
  smoothstep,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import {
  CalendarLabel,
  CalendarRule,
  CarrierFigure,
  type CardKind,
  type Release,
  FallingCards,
  SESSION_RULE_Y,
  SessionDoor,
  DoorSignText,
  type StackCard,
  calendarTicks,
  carrierPose,
  carryArms,
  integrateSpeed,
  makeCalendar,
  makeWalkPath,
  monthCenterT,
  stackLayout,
  weekCenterT,
  CARD_INS,
  SESSION_DOORS,
  SESSION_END,
  SESSION_LAYOUT,
} from "./sessionWorld";

export const FPS = 24000 / 1001;
export const DURATION = 245;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const LAST = DURATION - 1;

// --- the world layout (world px) -----------------------------------------------------
// SESSION_LAYOUT (sessionWorld): door 1 at D1, door 2 at D2, then every LD; stroll V0; a door acts when the hip is
// TRIG before its centre (the stack at the centre); the person walks GAP = LD behind; both stop END_OFF past a door.
const { D1, D2, LD, V0, TRIG, GAP } = SESSION_LAYOUT;
const X_F0 = D1 - TRIG - 21 * V0; // the intern's hip at f0: door 1 acts at f21
const F_DOOR2 = 128; // the first drop, on "they" / "don't" ... "accumulate" 135
if (Math.abs(X_F0 + F_DOOR2 * V0 + TRIG - D2) > 1e-9) throw new Error("FirstDayEveryDay: D2 no longer matches the walk");
const DOORS = SESSION_DOORS; // doors 1..8
const X_END = SESSION_END.aiX; // the intern stops just through door 6

// --- the speed profile: one smooth ramp up, then the stop ------------------------------
const FA = 156;
const FB = 214;
const FC = 221;
const FS = 240;
const vShape = (f: number, vmax: number) => {
  if (f <= FA) return V0;
  if (f <= FB) return V0 + (vmax - V0) * smoothstep((f - FA) / (FB - FA));
  if (f <= FC) return vmax;
  if (f <= FS) return vmax * (1 - smoothstep((f - FC) / (FS - FC)));
  return 0;
};
// solve vmax so the intern stops exactly on X_END
const VMAX = (() => {
  let lo = V0;
  let hi = 80;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    const x = integrateSpeed((f) => vShape(f, m), 0, FS + 1, X_F0)(FS + 1);
    if (x < X_END) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
})();
const vAt = (f: number) => vShape(f, VMAX);
const xAi = integrateSpeed(vAt, 0, LAST + 1, X_F0);
const xHu = (f: number) => xAi(f) - GAP;

const WALK_AI = makeWalkPath({ xAt: xAi, vAt, f0: 0, f1: LAST, vWalk: V0 });
const WALK_HU = makeWalkPath({ xAt: xHu, vAt, f0: 0, f1: LAST, vWalk: V0, strideScale: 0.965 });

/** the (fractional) frame a hip path reaches x */
const reach = (xAt: (f: number) => number, x: number) => {
  if (xAt(0) >= x) return 0;
  if (xAt(LAST) < x) return Infinity;
  let lo = 0;
  let hi = LAST;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (xAt(m) < x) lo = m;
    else hi = m;
  }
  return hi;
};

// --- door events ---------------------------------------------------------------------
/** frame each door acts for the intern (DAY 1 + its cards drop) */
const AI_DOOR_F = DOORS.map((d) => reach(xAi, d - TRIG));
/** frame each door acts for the person (one more card) */
const HU_DOOR_F = DOORS.map((d) => reach(xHu, d - TRIG));

// --- the cards -----------------------------------------------------------------------
// The intern's sessions: session 1 is f21 -> door 2; then one per door. It gathers three cards in a long
// session and two in a short one, then stops gathering ("only a couple hours"); the arms lift into the carry
// pose f42 -> f58, before the first card.
const S1_TIMES = [60, 73, 86];
type Session = { start: number; end: number; times: number[] };
const SESSIONS: Session[] = (() => {
  const out: Session[] = [{ start: 0, end: AI_DOOR_F[1], times: S1_TIMES }];
  for (let j = 1; j < DOORS.length; j++) {
    const a = AI_DOOR_F[j];
    if (!Number.isFinite(a)) break;
    const b = j + 1 < DOORS.length && Number.isFinite(AI_DOOR_F[j + 1]) ? AI_DOOR_F[j + 1] : Infinity;
    const len = Number.isFinite(b) ? b - a : 24;
    const n = len >= 30 ? 3 : 2;
    // the first fresh card waits until the dropped ones have slid behind the body
    const off = Math.min(10, Math.max(3, 0.3 * len));
    const step = Math.min(10, Math.max(4, (len - off - CARD_INS - 2) / n));
    const times = Array.from({ length: n }, (_, i) => Math.ceil(a + off + i * step));
    out.push({ start: a, end: b, times });
  }
  return out;
})();
const sessionAt = (f: number) => {
  for (let i = SESSIONS.length - 1; i >= 0; i--) if (f >= SESSIONS[i].start) return SESSIONS[i];
  return SESSIONS[0];
};
/** the person: the same in-session cards, plus one at each door it passes; never dropped */
const HU_TIMES: number[] = (() => {
  const raw = [...SESSIONS.flatMap((s) => s.times), ...HU_DOOR_F.filter((f) => Number.isFinite(f) && f > 30).map((f) => Math.ceil(f))]
    .filter((f) => f < LAST - 3)
    .sort((a, b) => a - b);
  const out: number[] = [];
  for (const f of raw) out.push(out.length && f - out[out.length - 1] < 3 ? out[out.length - 1] + 3 : f);
  return out;
})();
const CARRY = (f: number) => smoothstep((f - 42) / 16);

// a tall stack sways with the stride and leans with the change of speed
const leanAt = (walk: typeof WALK_AI, f: number, nCards: number) => {
  const a = vAt(f) - vAt(f - 1);
  const gait = walk.gaitW(f);
  const tall = Math.min(1, nCards / 12);
  return tall * (0.012 * Math.sin(2 * Math.PI * 2 * walk.phase(f)) * gait - 0.006 * a + 0.004 * Math.sin(f * 0.09));
};

type WalkerState = {
  pose: ReturnType<typeof carrierPose>;
  gait: number;
  carry: number;
  anchor: { x: number; y: number };
  stack: StackCard[];
};
const walkerAt = (kind: CardKind, f: number): WalkerState => {
  const walk = kind === "ai" ? WALK_AI : WALK_HU;
  const x = walk.hipX(f);
  const gait = walk.gaitW(f);
  const pose = carrierPose(kind, x, walk.feet(f), gait, f);
  const carry = CARRY(f);
  const { anchor } = carryArms(pose, gait, carry);
  let times: number[];
  if (kind === "ai") {
    const s = sessionAt(f);
    times = f >= s.end ? [] : s.times;
  } else {
    times = HU_TIMES;
  }
  const n = times.filter((t) => t <= f).length;
  const stack = stackLayout({ anchor, times, frame: f, lean: leanAt(walk, f, n), seed: kind === "ai" ? 0 : 5 });
  return { pose, gait, carry, anchor, stack };
};

/** the intern's drops: its stack as it was on the frame each door acts */
const RELEASES: Release[] = SESSIONS.filter((s) => Number.isFinite(s.end)).map((s) => {
  const fR = s.end;
  const prev = walkerAt("ai", fR - 1e-3);
  return { fR, cards: prev.stack.map((c) => ({ cx: c.cx, by: c.by, rot: c.rot })), vx: vAt(fR) };
});

// --- the calendar --------------------------------------------------------------------
// Day 1 is the long first session (door 1 -> door 2), days 2 and 3 are doors 2 and 3, then time compresses:
// days -> weeks -> months. Knots (day T, world x) chosen so the coarse labels land evenly (~250-460 apart) and
// MONTH 3 is centred under the pair (their midpoint, PAIR_END) at the stop, with MONTH 2 passed off frame left.
const LABEL_LEAD = GAP / 2; // a label slides up as the pair's midpoint reaches it
const PAIR_END = X_END - GAP / 2; // the midpoint between the two walkers at the stop
const CAL = makeCalendar([
  [1, D1],
  [2, D2],
  [3, D2 + LD],
  [weekCenterT(1), 2480],
  [8, 2600],
  [weekCenterT(2), 2720],
  [15, 2840],
  [weekCenterT(3), 2960],
  [31, 3080],
  [monthCenterT(2), 3180],
  [61, 3440],
  [monthCenterT(3), PAIR_END],
  [91, 4320],
  [121, 4900],
]);
// week ticks at the starts of weeks 2 and 3 (week 3 runs to the month-2 tick); month ticks at months 2, 3, 4
const TICKS = calendarTicks(CAL, { dayFrom: 1, dayTo: 30, weeksTo: 3, monthsTo: 4 }).filter((t) => t.x >= D1 - 1);
const LABELS = [
  { text: "WEEK 1", T: weekCenterT(1) },
  { text: "WEEK 2", T: weekCenterT(2) },
  { text: "WEEK 3", T: weekCenterT(3) },
  { text: "MONTH 2", T: monthCenterT(2) },
  { text: "MONTH 3", T: monthCenterT(3) },
].map((l) => {
  const x = CAL.xOf(l.T);
  // slides up as the pair passes over it (the midpoint between them reaches it), so it lands between them;
  // MONTH 3, under the pair's stop, lands on "months"
  return { ...l, x, f0: l.text === "MONTH 3" ? 222 : reach(xAi, x + LABEL_LEAD) };
});
const RULE_X0 = D1 - 1600;
const RULE_X1 = D2 + 3600;

// --- the camera ----------------------------------------------------------------------
// k and the rule's screen y: keys through camEase, then the kit damper (CAM_STIFF / CAM_DAMP). cx tracks the walk
// analytically (the hip path is a smooth integral of a smooth speed, so it does not bob): cx = intern hip + an
// offset that eases from ahead of the intern (door 1 in shot) to the pair's midpoint, then to door 6 at the stop.
const K_OPEN = 1.22;
const K_REST = 0.9;
const K_END = 0.915;
const CAM_KEYS = [
  { f: 0, k: K_OPEN, ry: 1055 },
  { f: 40, k: 1.2, ry: 1054 },
  { f: 110, k: K_REST, ry: 1000 },
  { f: 196, k: K_REST, ry: 1000 },
  { f: LAST, k: K_END, ry: 1004 },
];
const CAM_F: number[] = [];
const CAM_K: number[] = [];
const CAM_RY: number[] = [];
for (let f = 0; f <= LAST; f++) {
  const i = Math.max(0, CAM_KEYS.findIndex((q, n) => n + 1 < CAM_KEYS.length && f <= CAM_KEYS[n + 1].f));
  const a = CAM_KEYS[i];
  const b = CAM_KEYS[i + 1] ?? a;
  const u = b.f > a.f ? camEase((f - a.f) / (b.f - a.f), 1) : 1;
  CAM_F.push(f);
  CAM_K.push(a.k + (b.k - a.k) * u);
  CAM_RY.push(a.ry + (b.ry - a.ry) * u);
}
const camKR = (upto: number) => {
  let k = CAM_K[0];
  let ry = CAM_RY[0];
  let vk = 0;
  let vy = 0;
  for (let f = 1; f <= upto; f++) {
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    const ty = interpolate(f, CAM_F, CAM_RY, clamp);
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vy += (ty - ry) * CAM_STIFF - vy * CAM_DAMP;
    ry += vy;
  }
  return { k, ry };
};
const OFF_OPEN = 150;
const OFF_PAIR = -GAP / 2;
const OFF_END = DOORS[5] - X_END;
const camOff = (f: number) =>
  f < 110
    ? OFF_OPEN + (OFF_PAIR - OFF_OPEN) * camEase((f - 30) / 80, 1)
    : OFF_PAIR + (OFF_END - OFF_PAIR) * camEase((f - 186) / (LAST - 186), 1);
const camAt = (f: number) => {
  const { k, ry } = camKR(f);
  const cx = xAi(f) + camOff(f);
  const cy = SESSION_RULE_Y - (ry - 960) / k;
  return { k, cx, cy, ry };
};
// the resolved camera that SESSION_READY.md / SESSION_END.cam publish for cuts 50 and 61
{
  const c = camAt(LAST);
  const e = SESSION_END.cam;
  if (Math.abs(c.k - e.k) > 1e-4 || Math.abs(c.cx - e.cx) > 0.01 || Math.abs(c.cy - e.cy) > 0.01 || Math.abs(c.ry - e.ry) > 0.01) {
    throw new Error(`FirstDayEveryDay: f244 camera ${JSON.stringify(c)} no longer matches SESSION_END.cam`);
  }
}
const CX_REST = (camAt(0).cx + DOORS[5]) / 2;
const CY_REST = camAt(0).cy;

/** everything a reviewer needs, for the hand-off */
export const SCHED = {
  VMAX,
  D1,
  D2,
  DOORS,
  X_F0,
  X_END,
  AI_DOOR_F,
  HU_DOOR_F,
  SESSIONS,
  HU_TIMES,
  LABELS,
  RELEASES: RELEASES.map((r) => ({ fR: r.fR, n: r.cards.length })),
  camAt,
  walkerAt,
  vAt,
};

const FirstDayEveryDay: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const s = sway(frame);
  const k = cam.k;
  const cx = cam.cx + s.dx;
  const cy = cam.cy + s.dy;
  const { tx, ty } = worldTransform(cx, cy, k);

  const ai = walkerAt("ai", frame);
  const hu = walkerAt("human", frame);

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
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
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {DOORS.map((d) => (
              <SessionDoor key={d} k={k} x={d} />
            ))}
            <FallingCards id="drop" k={k} frame={frame} releases={RELEASES} />
            <CalendarRule k={k} x0={RULE_X0} x1={RULE_X1} ticks={TICKS} />
            <CarrierFigure id="hu" k={k} kind="human" pose={hu.pose} gait={hu.gait} carry={hu.carry} stack={hu.stack} />
            <CarrierFigure id="ai" k={k} kind="ai" pose={ai.pose} gait={ai.gait} carry={ai.carry} stack={ai.stack} />
          </svg>
          {DOORS.map((d, j) => (
            <DoorSignText key={d} k={k} x={d} f0={AI_DOOR_F[j]} frame={frame} />
          ))}
          {LABELS.map((l) => (
            <CalendarLabel key={l.text} k={k} x={l.x} text={l.text} f0={l.f0} frame={frame} />
          ))}
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default FirstDayEveryDay;
