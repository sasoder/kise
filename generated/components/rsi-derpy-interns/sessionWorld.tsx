import React from "react";
import { clamp01, hash, iconShadow, smoothstep, squirclePath } from "../kits/dwarkesh/fieldShared";
import { FONT_LABEL, INK, INK_HI, LABEL_IN, LABEL_TRACKING, LABEL_WEIGHT, Label, worldPx } from "../kits/dwarkesh/alignShared";
import {
  EYE_TONE,
  FACE_UNITS,
  FIGURE_TONE,
  FIGURE_TONE_FAR,
  FIGURE_TONE_TIE,
  type Feet,
  type Foot,
  type FigurePose,
  GROUND_Y,
  HEAD_MARK,
  RULE_Y,
  eyePath,
  figureHeight,
  figurePose,
  strideFor,
} from "../rsi-another-jump/timelineWorld";
import { HUMAN_FAR } from "../rsi-another-jump/jumpWorld";

// ---------------------------------------------------------------------------
// sessionWorld — the shared world of rsi-derpy-interns (cut 6 FirstDayEveryDay
// builds it; cuts 50 and 61 return to it). Every length is WORLD px; the world
// rests at SESSION_K (0.9), so 1 world px is 0.9 screen px there.
//
// THE CALENDAR: one white horizontal rule at RULE_Y (timelineWorld's, so the
//   intern's feet stand on GROUND_Y unchanged). Time runs right. Its scale is a
//   `Calendar` (monotone x(T) through knots, T in days, DAY 1 = T 1), so a cut
//   can compress time to the right. Ticks hang below the rule: small day ticks
//   while days are wide enough, longer week ticks, longest month ticks. Coarse
//   labels (WEEK n, MONTH n) sit just under the rule, centred on their span.
//
// THE SESSION DOOR: a white squircle door frame (the style's one stroke weight)
//   standing on the rule, with a small white sign plate hung above its lintel on
//   two short hangers. The plate is blank until the AI passes under it; then
//   DAY 1 slides up into it from behind its bottom edge (`DoorSignText`).
//
// THE NOTES: a note card is a small flat squircle (orange = the AI's, white = a
//   person's) with a thin edge in its own darker shade and three short lines in
//   a darker shade still (no white text). A STACK is shingled: the newest card
//   sits at the front, bottom, resting on the carrier's forearm; each older card
//   shows its top strip (CARD_PITCH) above it. A new card rises out of the arms
//   (clipped at the forearm, so it comes out from behind them) and pushes the
//   stack up by one pitch. The AI's cards are dropped at a door: they stay in
//   world space, drain ACCENT -> ACCENT_DEEP, tumble and fall behind the rule
//   (`FallingCards`, clipped at the rule's centre line, drawn under the rule).
//
// THE WALKERS: `CarrierFigure` is the series intern (timelineWorld's figurePose
//   at age 1: OpenAI-mark head, eyes, collar, tie, lanyard + badge) or a white
//   person (jumpWorld's HumanFigure look: round head, far limbs HUMAN_FAR), with
//   both arms in a CARRY pose (upper arm a little forward, forearm level) and no
//   coffee cup: the stack is what it carries. `carry` 0..1 blends from a natural
//   arm swing into the carry pose. `makeWalkPath` is makeWalk for any speed
//   profile: the gait is tied to POSITION (planted feet never slip), the stride
//   lengthens with speed, and the walk ends on a mid-stance with the far foot
//   swinging, so the figure stops standing with no slip.
// ---------------------------------------------------------------------------

/** The resting zoom the strokes and labels are sized for. */
export const SESSION_K = 0.9;
/** The style's one stroke weight (6.5 screen px at SESSION_K): rule, ticks, doors, sign plates. */
export const SESSION_SW = worldPx(6.5, SESSION_K);
export const SESSION_RULE_Y = RULE_Y;
export const SESSION_GROUND_Y = GROUND_Y;

// --- the calendar ---------------------------------------------------------------
export const DAY_TICK = 16;
export const WEEK_TICK = 26;
export const MONTH_TICK = 36;
/** a coarse label's text-box top, below the rule's centre line */
export const CAL_LABEL_DY = 22;
export const CAL_LABEL_SIZE = worldPx(44, SESSION_K);
/** day ticks are drawn only where a day is at least this wide (world px) */
export const DAY_TICK_MIN = 70;

export type Calendar = { xOf: (T: number) => number; knots: [number, number][] };
/** x(T) through (T, x) knots, monotone cubic (Fritsch-Carlson), linear outside. */
export const makeCalendar = (knots: [number, number][]): Calendar => {
  const T = knots.map((q) => q[0]);
  const X = knots.map((q) => q[1]);
  const n = T.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((X[i + 1] - X[i]) / (T[i + 1] - T[i]));
  const m: number[] = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  const xOf = (t: number) => {
    if (t <= T[0]) return X[0] + (t - T[0]) * d[0];
    if (t >= T[n - 1]) return X[n - 1] + (t - T[n - 1]) * d[n - 2];
    let i = 0;
    while (i < n - 2 && T[i + 1] < t) i++;
    const h = T[i + 1] - T[i];
    const u = (t - T[i]) / h;
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
    const h10 = u ** 3 - 2 * u ** 2 + u;
    const h01 = -2 * u ** 3 + 3 * u ** 2;
    const h11 = u ** 3 - u ** 2;
    return h00 * X[i] + h10 * h * m[i] + h01 * X[i + 1] + h11 * h * m[i + 1];
  };
  return { xOf, knots };
};
/** WEEK n spans days 7(n-1)+1 .. 7n+1; MONTH n spans 30(n-1)+1 .. 30n+1. */
export const weekStartT = (n: number) => 7 * (n - 1) + 1;
export const weekCenterT = (n: number) => 7 * n - 2.5;
export const monthStartT = (n: number) => 30 * (n - 1) + 1;
export const monthCenterT = (n: number) => 30 * n - 14;

export type Tick = { x: number; len: number };
/** Day ticks while a day is >= DAY_TICK_MIN wide (from T dayFrom), week ticks at
 *  the starts of weeks 2..weeksTo, month ticks at the starts of months 2..monthsTo. */
export const calendarTicks = (
  cal: Calendar,
  { dayFrom = 1, dayTo = 60, weeksTo = 4, monthsTo = 4 }: { dayFrom?: number; dayTo?: number; weeksTo?: number; monthsTo?: number } = {},
): Tick[] => {
  const out: Tick[] = [];
  const coarse = new Set<number>();
  for (let n = 2; n <= weeksTo; n++) coarse.add(weekStartT(n));
  for (let n = 2; n <= monthsTo; n++) coarse.add(monthStartT(n));
  for (let t = dayFrom; t <= dayTo; t++) {
    if (coarse.has(t)) continue;
    if (cal.xOf(t + 1) - cal.xOf(t) < DAY_TICK_MIN && cal.xOf(t) - cal.xOf(t - 1) < DAY_TICK_MIN) continue;
    out.push({ x: cal.xOf(t), len: DAY_TICK });
  }
  for (let n = 2; n <= weeksTo; n++) out.push({ x: cal.xOf(weekStartT(n)), len: WEEK_TICK });
  for (let n = 2; n <= monthsTo; n++) out.push({ x: cal.xOf(monthStartT(n)), len: MONTH_TICK });
  return out;
};

/** The calendar rule from x0 to x1 and its ticks. SVG, world px. */
export const CalendarRule: React.FC<{ k: number; x0: number; x1: number; ticks: Tick[]; opacity?: number }> = ({
  k,
  x0,
  x1,
  ticks,
  opacity = INK_HI,
}) => {
  const y = RULE_Y;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <line x1={x0} y1={y} x2={x1} y2={y} stroke={INK} strokeWidth={SESSION_SW} strokeLinecap="round" />
      {ticks.map((t, i) => (
        <line key={i} x1={t.x} y1={y} x2={t.x} y2={y + t.len} stroke={INK} strokeWidth={SESSION_SW} strokeLinecap="round" />
      ))}
    </g>
  );
};

/** A coarse calendar label (WEEK n / MONTH n) under the rule; slides up from f0. DOM. */
export const CalendarLabel: React.FC<{ k: number; x: number; text: string; f0: number; frame: number }> = ({
  k,
  x,
  text,
  f0,
  frame,
}) => <Label k={k} x={x} y={RULE_Y + CAL_LABEL_DY} text={text} f0={f0} frame={frame} size={CAL_LABEL_SIZE} />;

// --- the session door --------------------------------------------------------------
export const DOOR_W = 220;
/** from the rule's centre line to the lintel's centre line */
export const DOOR_H = 640;
export const SIGN_W = 190;
export const SIGN_H = 84;
/** the gap between the lintel and the sign plate (bridged by two hangers) */
export const SIGN_GAP = 20;
export const SIGN_TEXT = "DAY 1";
export const SIGN_TEXT_SIZE = worldPx(47, SESSION_K);
/** the sign plate's top-left corner for a door at x */
export const signBox = (x: number) => ({
  x: x - SIGN_W / 2,
  y: RULE_Y - DOOR_H - SIGN_GAP - SIGN_H,
  w: SIGN_W,
  h: SIGN_H,
});

/** A session door at x (its centre at the standard width): frame + hangers + the (blank) sign plate. SVG.
 *  `w` (default DOOR_W) stretches the frame to the right: the left jamb stays at x - DOOR_W / 2 and the sign
 *  stays centred on x (a session that lasts longer). */
export const SessionDoor: React.FC<{ k: number; x: number; opacity?: number; w?: number }> = ({
  k,
  x,
  opacity = INK_HI,
  w = DOOR_W,
}) => {
  const s = signBox(x);
  const hy0 = RULE_Y - DOOR_H;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity} fill="none" stroke={INK} strokeWidth={SESSION_SW}>
      <path d={squirclePath(w, DOOR_H)} transform={`translate(${(x - DOOR_W / 2).toFixed(3)} ${hy0.toFixed(3)})`} />
      {[-0.3, 0.3].map((u) => (
        <line key={u} x1={x + u * SIGN_W} y1={hy0} x2={x + u * SIGN_W} y2={s.y + s.h} strokeLinecap="round" />
      ))}
      <path d={squirclePath(s.w, s.h)} transform={`translate(${s.x.toFixed(3)} ${s.y.toFixed(3)})`} />
    </g>
  );
};

/** DAY 1 inside a door's sign plate, sliding up from behind the plate's bottom
 *  edge while fading in (`inT` 0..1, or from `f0` over LABEL_IN frames). DOM. */
export const DoorSignText: React.FC<{ k: number; x: number; inT?: number; f0?: number; frame?: number; text?: string }> = ({
  k,
  x,
  inT,
  f0 = 0,
  frame = 0,
  text = SIGN_TEXT,
}) => {
  const t = inT === undefined ? smoothstep((frame - f0) / LABEL_IN) : clamp01(inT);
  if (t <= 0) return null;
  const s = signBox(x);
  const pad = SESSION_SW / 2;
  const h = s.h - 2 * pad;
  return (
    <div
      style={{
        position: "absolute",
        left: s.x + pad,
        top: s.y + pad,
        width: s.w - 2 * pad,
        height: h,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: (1 - t) * h * 0.75,
          width: "100%",
          height: h,
          lineHeight: `${h}px`,
          textAlign: "center",
          fontFamily: FONT_LABEL,
          fontWeight: LABEL_WEIGHT,
          fontSize: SIGN_TEXT_SIZE,
          letterSpacing: LABEL_TRACKING,
          textTransform: "uppercase",
          color: INK,
          opacity: t,
          whiteSpace: "nowrap",
          filter: iconShadow(k),
        }}
      >
        {text}
      </div>
    </div>
  );
};

// --- the note cards -------------------------------------------------------------------
export const CARD_W = 92;
export const CARD_H = 64;
/** each older card shows this much of its top above the next */
export const CARD_PITCH = 24;
/** frames for a new card to rise out of the arms */
export const CARD_INS = 7;
export const CARD_EDGE_W = 2.6;
export const CARD_LINE_W = 4.6;
const CARD_LINES = [
  { y: 13, len: 0.78 },
  { y: 27, len: 0.55 },
  { y: 41, len: 0.66 },
];
const shadeHex = (hex: string, f: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * f));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};
/** The AI's card along deep (0) .. lit (1): fill, edge, lines. */
export const AI_CARD = { fill: FIGURE_TONE, edge: FIGURE_TONE_FAR, line: FIGURE_TONE_TIE };
/** A person's card. */
export const HUMAN_CARD = { fill: INK, edge: HUMAN_FAR, line: shadeHex("#FFFFFF", 0.72) };
export type CardKind = "ai" | "human";
export const cardColors = (kind: CardKind, lit = 1) =>
  kind === "ai"
    ? { fill: AI_CARD.fill(lit), edge: AI_CARD.edge(lit), line: AI_CARD.line(lit) }
    : { fill: HUMAN_CARD.fill, edge: HUMAN_CARD.edge, line: HUMAN_CARD.line };

/** A card placed by its bottom-centre (cx, by), rotated `rot` radians about its centre. */
export type CardPlace = { cx: number; by: number; rot: number };
export const NoteCard: React.FC<{ place: CardPlace; kind: CardKind; lit?: number }> = ({ place, kind, lit = 1 }) => {
  const c = cardColors(kind, lit);
  const x0 = place.cx - CARD_W / 2;
  const y0 = place.by - CARD_H;
  const deg = (place.rot * 180) / Math.PI;
  return (
    <g transform={`rotate(${deg.toFixed(3)} ${place.cx.toFixed(3)} ${(place.by - CARD_H / 2).toFixed(3)}) translate(${x0.toFixed(3)} ${y0.toFixed(3)})`}>
      <path d={squirclePath(CARD_W, CARD_H)} fill={c.fill} stroke={c.edge} strokeWidth={CARD_EDGE_W} />
      {CARD_LINES.map((l, i) => (
        <line
          key={i}
          x1={13}
          y1={l.y}
          x2={13 + l.len * (CARD_W - 26)}
          y2={l.y}
          stroke={c.line}
          strokeWidth={CARD_LINE_W}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
};

export type StackCard = CardPlace & { j: number; e: number };
/**
 * A shingled stack resting on `anchor` (its bottom-centre, on the forearm).
 * `times[j]` is the frame card j starts rising (ascending; later = newer =
 * front and bottom). `lean` world px of sideways drift per world px of height
 * (a tall stack's sway). Returns the cards that have started, back to front.
 */
export const stackLayout = ({
  anchor,
  times,
  frame,
  lean = 0,
  seed = 0,
  ins = CARD_INS,
}: {
  anchor: { x: number; y: number };
  times: number[];
  frame: number;
  lean?: number;
  seed?: number;
  ins?: number;
}): StackCard[] => {
  const e = times.map((t) => smoothstep((frame - t) / ins));
  const out: StackCard[] = [];
  let above = 0; // sum of e over newer cards
  const lifts: number[] = new Array(times.length).fill(0);
  for (let j = times.length - 1; j >= 0; j--) {
    lifts[j] = above;
    above += e[j];
  }
  for (let j = 0; j < times.length; j++) {
    if (frame < times[j]) continue;
    const by = anchor.y - CARD_PITCH * lifts[j] + (1 - e[j]) * (CARD_H + 4);
    const h = anchor.y - (by - CARD_H / 2);
    const jx = (hash(j + 1, 11 + seed) - 0.5) * 7;
    const rot = (hash(j + 1, 23 + seed) - 0.5) * 0.04;
    out.push({ cx: anchor.x + jx + lean * h, by, rot, j, e: e[j] });
  }
  return out;
};

/** The stack, clipped at the forearm line so a new card comes out from behind the arms. SVG. */
export const NoteStack: React.FC<{ id: string; cards: StackCard[]; anchor: { x: number; y: number }; kind: CardKind }> = ({
  id,
  cards,
  anchor,
  kind,
}) => {
  if (!cards.length) return null;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-slot`} clipPathUnits="userSpaceOnUse">
          <rect x={anchor.x - 4000} y={anchor.y - 8000} width={8000} height={8000} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-slot)`}>
        {cards.map((c) => (
          <NoteCard key={c.j} place={c} kind={kind} />
        ))}
      </g>
    </g>
  );
};

// --- dropped cards -----------------------------------------------------------------
export const FALL_G = 2.2; // world px / frame^2
export const FALL_DRAIN = 8; // frames to drain ACCENT -> ACCENT_DEEP
export const FALL_DRIFT_TAU = 4; // frames: the carried momentum dies off
/** Where a dropped card is `f - fR` frames after its release at `place`.
 *  `vx` = the carrier's speed at release (world px / frame). */
export const cardFall = (place: CardPlace, j: number, nCards: number, fR: number, f: number, vx: number) => {
  const t = Math.max(0, f - fR);
  const delay = 1.5 * (nCards - 1 - j); // the bottom (newest) card goes first
  const dt = Math.max(0, t - delay);
  const drift = 0.3 * vx * FALL_DRIFT_TAU * (1 - Math.exp(-t / FALL_DRIFT_TAU));
  const spin = -(0.35 + 0.35 * hash(j + 3, 41));
  return {
    place: {
      cx: place.cx + drift,
      by: place.by + 0.5 * FALL_G * dt * dt,
      rot: place.rot + spin * smoothstep(dt / 14),
    },
    lit: 1 - smoothstep(t / FALL_DRAIN),
    gone: place.by + 0.5 * FALL_G * dt * dt - CARD_H * 1.3 > RULE_Y,
  };
};
export type Release = { fR: number; cards: CardPlace[]; vx: number };
/** Every dropped card of the given releases, falling behind the rule (clipped at
 *  its centre line; draw this BEFORE the rule and the walkers). SVG. */
export const FallingCards: React.FC<{ id: string; k: number; frame: number; releases: Release[]; kind?: CardKind }> = ({
  id,
  k,
  frame,
  releases,
  kind = "ai",
}) => {
  const items: React.ReactNode[] = [];
  releases.forEach((r, ri) => {
    if (frame < r.fR) return;
    r.cards.forEach((c, j) => {
      const s = cardFall(c, j, r.cards.length, r.fR, frame, r.vx);
      if (s.gone) return;
      items.push(<NoteCard key={`${ri}-${j}`} place={s.place} kind={kind} lit={s.lit} />);
    });
  });
  if (!items.length) return null;
  return (
    <g style={{ filter: iconShadow(k) }}>
      <defs>
        <clipPath id={`${id}-floor`} clipPathUnits="userSpaceOnUse">
          <rect x={-1e5} y={-1e5} width={2e5} height={1e5 + RULE_Y} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-floor)`}>{items}</g>
    </g>
  );
};

// --- the carry pose -------------------------------------------------------------------
type P = { x: number; y: number };
const line = (pts: P[]) => `M${pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")}`;
const poly = (pts: P[]) => `${line(pts)} Z`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** upper arm and forearm angles (radians from straight down, + = forward) */
export const CARRY_UPPER = 0.3;
export const CARRY_FORE = Math.PI / 2;
/** the stack's anchor sits this fraction of CARD_W behind the near hand */
export const CARRY_ANCHOR_BACK = 0.2;

/**
 * Both arms for a pose. `carry` 0 = a natural walk (each arm swings against
 * its leg), 1 = the carry pose (forearms level in front, the far arm hidden
 * behind the near one). Returns the arms and the stack's anchor.
 */
export const carryArms = (g: FigurePose, gait: number, carry: number) => {
  const { p } = g;
  const c = smoothstep(carry);
  const upper = p.armL * 0.5;
  const fore = p.armL * 0.5;
  const S = strideFor(1);
  const farOff = (g.legs.find((q) => q.side === "far")!.ankle.x - g.legs.find((q) => q.side === "far")!.hip.x) / Math.max(1, S * 0.5);
  const swing = 0.5 * gait * Math.max(-1.2, Math.min(1.2, farOff));
  const arm = (sh: P, thN: number) => {
    const fN = thN + 0.25 + 0.35 * Math.max(0, thN);
    const tu = lerp(thN, CARRY_UPPER, c);
    const tf = lerp(fN, CARRY_FORE, c);
    const el = { x: sh.x + Math.sin(tu) * upper, y: sh.y + Math.cos(tu) * upper };
    const hd = { x: el.x + Math.sin(tf) * fore, y: el.y + Math.cos(tf) * fore };
    return [sh, el, hd];
  };
  const near = arm(g.nearArm[0], swing);
  const far = arm(g.farArm[0], -swing);
  const hand = near[2];
  const anchor = { x: hand.x - CARD_W * CARRY_ANCHOR_BACK, y: hand.y - p.armT * 0.42 };
  return { near, far, anchor };
};

/**
 * The intern (kind "ai") or a white person (kind "human") carrying a note stack.
 * `stack` is the held stack's cards (from `stackLayout` at the anchor that
 * `carryArms(pose)` returns; pass [] for none). Layer order: far arm, far leg,
 * body and head, near leg, (shirt + tie), the stack, the near arm, (lanyard +
 * badge). SVG, world px.
 */
export const CarrierFigure: React.FC<{
  id: string;
  k: number;
  kind: CardKind;
  pose: FigurePose;
  gait: number;
  carry: number;
  stack: StackCard[];
  wink?: number;
}> = ({ id, k, kind, pose: g, gait, carry, stack, wink = 0 }) => {
  const { p } = g;
  const arms = carryArms(g, gait, carry);
  const ai = kind === "ai";
  const t = 1;
  const nearC = ai ? FIGURE_TONE(t) : INK;
  const farC = ai ? FIGURE_TONE_FAR(t) : HUMAN_FAR;
  const limb = (pts: P[], w: number, color: string) => (
    <path d={line(pts)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );
  const legPts = (side: "near" | "far") => {
    const l = g.legs.find((q) => q.side === side)!;
    return [l.hip, l.knee, l.ankle];
  };
  const rectAt = (r: { x: number; y: number; w: number; h: number }, fill: string) => (
    <path d={squirclePath(r.w, r.h)} transform={`translate(${r.x.toFixed(2)} ${r.y.toFixed(2)})`} fill={fill} />
  );
  return (
    <g style={{ filter: iconShadow(k) }}>
      {limb(arms.far, p.armT, farC)}
      {limb(legPts("far"), p.legT, farC)}
      <ellipse cx={g.footFar.cx} cy={g.footFar.cy} rx={g.footFar.rx} ry={g.footFar.ry} fill={farC} />
      {limb(g.neck, p.neckW, nearC)}
      <path d={poly(g.torso)} fill={nearC} />
      {ai ? (
        <>
          <g transform={`translate(${g.mark.x.toFixed(3)} ${g.mark.y.toFixed(3)}) scale(${(g.mark.size / 24).toFixed(5)})`}>
            <circle cx={FACE_UNITS.x} cy={FACE_UNITS.y} r={FACE_UNITS.r} fill={nearC} />
            {HEAD_MARK.paths.map((d, i) => (
              <path key={i} d={d} fill={nearC} fillRule="evenodd" />
            ))}
          </g>
          <path d={eyePath(g.eyes.back.x, g.eyes.back.y, g.eyes.r, 0)} fill={EYE_TONE} />
          <path d={eyePath(g.eyes.front.x, g.eyes.front.y, g.eyes.r, wink)} fill={EYE_TONE} />
        </>
      ) : (
        <circle cx={g.head.x} cy={g.top + p.headD / 2} r={p.headD / 2} fill={INK} />
      )}
      {limb(legPts("near"), p.legT, nearC)}
      <ellipse cx={g.footNear.cx} cy={g.footNear.cy} rx={g.footNear.rx} ry={g.footNear.ry} fill={nearC} />
      {ai ? (
        <g>
          <path d={poly(g.collar)} fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth={p.H * 0.004} />
          <path d={poly(g.tie)} fill={FIGURE_TONE_TIE(t)} />
        </g>
      ) : null}
      <NoteStack id={`${id}-stack`} cards={stack} anchor={arms.anchor} kind={kind} />
      {limb(arms.near, p.armT, nearC)}
      {ai ? (
        <g>
          {g.lanyards.map((l, i) => (
            <path key={i} d={line(l)} fill="none" stroke={INK} strokeWidth={p.H * 0.009} strokeLinecap="round" />
          ))}
          {rectAt(g.badge, INK)}
          {rectAt(g.badgeSlot, farC)}
          {rectAt(g.badgePhoto, farC)}
        </g>
      ) : null}
    </g>
  );
};

/** The pose both walkers use: figurePose at age 1 (the intern's build); a
 *  person gets no badge, tie or drink. */
export const carrierPose = (kind: CardKind, x: number, feet: Feet | undefined, gait: number, breathT: number) =>
  figurePose({
    x,
    age: 1,
    feet,
    gait,
    breathT,
    identity: kind === "ai" ? undefined : { badge: 0, tie: 0, child: 0, bun: 1, drink: 1 },
  });

// --- the walk at any speed ---------------------------------------------------------------
export type WalkPath = {
  hipX: (f: number) => number;
  speed: (f: number) => number;
  gaitW: (f: number) => number;
  phase: (f: number) => number;
  feet: (f: number) => Feet;
};
/** Stride (one footfall to the next) at speed v: the intern's stroll at vWalk,
 *  lengthening up to `maxGrow` x as it hurries. */
export const strideAtSpeed = (v: number, vWalk: number, maxGrow = 1.25, scale = 1) =>
  strideFor(1) * scale * (1 + (maxGrow - 1) * clamp01((v - vWalk) / (2 * vWalk)));

/**
 * makeWalk for any speed profile. `xAt(f)` is the hip's x (smooth, monotone),
 * `vAt(f)` its speed (world px / frame). The phase is a function of position
 * (phi = phi0 + integral dx / 2S), so a planted foot never slips; S grows with
 * the speed at which that x was crossed. phi0 is solved so that the walk ENDS on
 * a mid-stance with the far foot swinging (feet together, nothing slips when
 * the gait goes to 0). `gaitW` = speed / vWalk, capped at 1.
 */
export const makeWalkPath = ({
  xAt,
  vAt,
  f0,
  f1,
  vWalk,
  strideScale = 1,
  liftFrac = 0.09,
}: {
  xAt: (f: number) => number;
  vAt: (f: number) => number;
  f0: number;
  f1: number;
  vWalk: number;
  strideScale?: number;
  liftFrac?: number;
}): WalkPath => {
  const dt = 0.05;
  const xs: number[] = [];
  const raw: number[] = [];
  const sAt: number[] = [];
  let acc = 0;
  for (let f = f0; f <= f1 + 1e-9; f += dt) {
    const x = xAt(f);
    const S = strideAtSpeed(vAt(f), vWalk, 1.25, strideScale);
    if (xs.length) acc += (x - xs[xs.length - 1]) / (2 * S);
    xs.push(x);
    raw.push(acc);
    sAt.push(S);
  }
  const N = xs.length - 1;
  // end on phi = 0.25 (mod 1): near foot planted under the hip, far foot mid-swing
  const phi0 = 0.25 - (acc % 1);
  const phis = raw.map((r) => phi0 + r);
  const phiOfX = (x: number) => {
    if (x <= xs[0]) return phis[0] + (x - xs[0]) / (2 * sAt[0]);
    if (x >= xs[N]) return phis[N] + (x - xs[N]) / (2 * sAt[N]);
    let lo = 0;
    let hi = N;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (xs[m] <= x) lo = m;
      else hi = m;
    }
    const span = xs[hi] - xs[lo];
    const u = span > 1e-9 ? (x - xs[lo]) / span : 0;
    return phis[lo] + (phis[hi] - phis[lo]) * u;
  };
  const Xof = (phi: number) => {
    if (phi <= phis[0]) return xs[0] + (phi - phis[0]) * 2 * sAt[0];
    if (phi >= phis[N]) return xs[N] + (phi - phis[N]) * 2 * sAt[N];
    let lo = 0;
    let hi = N;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (phis[m] <= phi) lo = m;
      else hi = m;
    }
    const span = phis[hi] - phis[lo];
    const u = span > 1e-12 ? (phi - phis[lo]) / span : 0;
    return xs[lo] + (xs[hi] - xs[lo]) * u;
  };
  const gaitW = (f: number) => clamp01(vAt(f) / vWalk);
  const phase = (f: number) => phiOfX(xAt(f));
  const H = figureHeight(1);
  const footAt = (psi: number, off: number, w: number, liftH: number): Foot => {
    const n = Math.floor(psi);
    const u = psi - n;
    if (u < 0.5) return { x: Xof(n + 0.25 - off), lift: 0 };
    const s = (u - 0.5) / 0.5;
    const e = 0.5 - 0.5 * Math.cos(Math.PI * s);
    return {
      x: Xof(n + 0.25 - off) + (Xof(n + 1.25 - off) - Xof(n + 0.25 - off)) * e,
      lift: Math.sin(Math.PI * s) * liftH * w,
    };
  };
  const feet = (f: number): Feet => {
    const phi = phase(f);
    const w = gaitW(f);
    const liftH = liftFrac * 0.6 * H;
    return { near: footAt(phi, 0, w, liftH), far: footAt(phi + 0.5, 0.5, w, liftH) };
  };
  return { hipX: xAt, speed: vAt, gaitW, phase, feet };
};

/** A speed profile integrated into a position table: `vAt(f)` world px/frame
 *  from f0 (x0) to f1; returns xAt with linear interpolation at 1/20 frame. */
export const integrateSpeed = (vAt: (f: number) => number, f0: number, f1: number, x0: number) => {
  const dt = 0.05;
  const xs: number[] = [x0];
  let x = x0;
  for (let f = f0; f < f1 - 1e-9; f += dt) {
    x += 0.5 * (vAt(f) + vAt(f + dt)) * dt;
    xs.push(x);
  }
  return (f: number) => {
    if (f <= f0) return x0 + (f - f0) * vAt(f0);
    const i = (f - f0) / dt;
    if (i >= xs.length - 1) return xs[xs.length - 1] + (f - (f0 + (xs.length - 1) * dt)) * vAt(f1);
    const lo = Math.floor(i);
    return xs[lo] + (xs[lo + 1] - xs[lo]) * (i - lo);
  };
};


// --- cut 6's walk set-up and resolved picture (FirstDayEveryDay), for cuts 50 and 61 ------------------------
/** The layout cut 6 walks: door 1 at D1, door 2 at D2, then a door every LD. The intern strolls at V0 world
 *  px/frame; a door acts (DAY 1, the AI's drop, the person's +1 card) when a walker's hip is TRIG before its
 *  centre. The person walks GAP (= LD) behind the intern, so it passes door j as the intern passes door j+1.
 *  Both stop END_OFF past a door (the intern past door 6, the person past door 5). */
export const SESSION_LAYOUT = {
  D1: 700,
  D2: 1877,
  LD: 500,
  V0: 11,
  TRIG: 100,
  GAP: 500,
  END_OFF: 190,
};
/** doors 1..8, world x of each centre */
export const SESSION_DOORS = [SESSION_LAYOUT.D1, ...Array.from({ length: 7 }, (_, i) => SESSION_LAYOUT.D2 + i * SESSION_LAYOUT.LD)];
/** cut 6's last frame (f244): where everything stands */
export const SESSION_END = {
  /** the intern's hip x (just through door 6 = SESSION_DOORS[5]) */
  aiX: SESSION_DOORS[5] + SESSION_LAYOUT.END_OFF,
  /** the person's hip x (just through door 5) */
  humanX: SESSION_DOORS[4] + SESSION_LAYOUT.END_OFF,
  /** both stacks rest on this world y (the forearm line) standing; anchor x = hip + anchorDX */
  anchorY: 673.69,
  anchorDX: 102.27,
  aiCards: 2,
  humanCards: 19,
  /** the person's tower top (world y), 496 above its anchor */
  humanTowerTop: 177.64,
  /** the camera before sway (fieldShared sway(244) = dx -2.778, dy +1.361); the rule is at screen y `ry` */
  cam: { k: 0.91452, cx: 3877.0, cy: 932.027, ry: 1003.872 },
};
