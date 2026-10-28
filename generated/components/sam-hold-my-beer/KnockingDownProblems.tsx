// ---------------------------------------------------------------------------
// KnockingDownProblems (sam-hold-my-beer, cut 20). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 94 frames. Palette B1 (the stoutShared default).
// The Slack world is slackShared.tsx (cut 6's window, imported, never restated).
//
// CHECK LINE: "In that channel, people posted their hardest problems from every field, and the model solved them one
// after another while everyone watched."
//
// THE LINE: "The model was just knocking down one after the other, many different fields. It was incredible to watch."
// WORD -> FRAME: model 1 · was 5 · just 8 · knocking 11 · down 18 · one 23 · after 30 · the 35 · other 39 · many 44 ·
// different 48 · fields 55 · It 64 · was 66 · incredible 68 · to 76 · watch 82 · (next line "And" 92).
// DURATION: the slot 20.020 -> 23.940583 s = 3.920583 s x 23.976 = 94 frames (f0..f93).
//
// THE MOTION: the Slack window lies on the board, framed so the # astra-hold-my-beer pane fills the frame (top bar
// and header pinned at the top, the composer at the bottom; the left edge sits just inside the pane, so no sliver
// of sidebar shows at the frame edge). The feed scrolls up continuously, Slack-like (posts come out from under the composer and leave
// under the header): each post is a person's hardest problem with a card naming its FIELD. One after another the
// model knocks them down: amber runs down the card's left rule, then astra's amber "Solved" pill grows out of the
// rule's foot. On "It was incredible to watch" the scroll eases to a creep and the watchers' reaction chips deal
// out of the latest solves, their counts rolling up (odometer) to the last frame, while the model knocks down one
// more (Algorithms, f80) and the feed keeps running down to the composer (the next problem, open, under it). The camera drifts in from f0 and
// pushes in a little more (k 2.64 -> ~2.9) over the slowing scroll, so the last solve and its reactions end large.
//
// HITS (contact = amber starts down the rule; first reaction = the pill starts growing; landed = pill full):
//   P1 Number theory      contact f2   first reaction f6   landed f11 (knocking)
//   P2 Protein structure  contact f11  first reaction f15  landed f20 (down)
//   P3 Fluid dynamics     contact f20  first reaction f24  landed f29 (after)
//   P4 Quantum chemistry  contact f28  first reaction f32  landed f37 (other)
//   P5 Topology           contact f36  first reaction f40  landed f45 (many)
//   P6 Astrophysics       contact f44  first reaction f48  landed f53 (fields 55)
//   P7 Algorithms         contact f71  first reaction f75  landed f80 (the model keeps going while people react)
// REACTIONS (chip slides out from behind the pill / the chip before it; first frame -> settled):
//   P6 🤯 f60->f67 · P6 🍺 (mine) f65->f72 · P6 👀 f71->f78 · P7 🔥 f83->f90 · P7 🤯 f87->f94; counts roll to f93.
//   (Topology has scrolled under the header by then, so the second pile goes on the newest solve, Algorithms.)
//
// AMBER = the model (astra): its channel pill, its solve pills, the rules it turns. Everything else is Slack's colour.
// SOURCES: none (no real figures). People are generic first names; problems are shown by field only.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, bloomFilter, clamp01, easeOutCubic, lerp, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam } from "../kits/cheeky-pint/museShared";
import {
  ASTRA_CHANNEL,
  ASTRA_INDEX,
  AVATAR_COLORS,
  BODY_LH,
  ChannelHeader,
  Composer,
  LATO,
  MAIN,
  MessageRow,
  PEOPLE,
  REACTION_H,
  SLACK,
  SlackSidebar,
  SlackWindow,
  WIN,
  reactionW,
  type AvatarSpec,
  type MessageSpec,
} from "./slackShared";

export const FPS = 24000 / 1001;
export const DURATION = 94;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ===========================================================================
// FRAMING — world px = Slack px of cut 6's window. k 2.64: body type 15 -> ~40 screen px.
// The left frame edge stays on world x 206 (just inside the pane: no sliver of sidebar at the edge) through the push.
// ===========================================================================
const K0 = 2.64;
const K1 = 2.67; // the opening drift
const K2 = 2.76; // the push in on the latest solves (body ~41 px); the widest pile (pill + 3 chips) still fits
const LEFT = 206;
const lookX = (k: number) => LEFT + 540 / k;
const CAM = makeClockCam(
  { x: lookX(K0), y: 330, k: K0 },
  [
    { f0: -24, f1: 40, k: K1, dx: lookX(K1) - lookX(K0), dy: 2 },
    { f0: 34, f1: 100, k: K2, dx: lookX(K2) - lookX(K1), dy: -8 },
  ],
  DURATION,
);

// the feed's window inside the pane: under the header (38 + 50) to just above the composer (596)
const FEED_Y0 = WIN.topBar + MAIN.headerH;
const FEED_Y1 = 590;
const TEXT_X = MAIN.x0 + MAIN.nameX; // 268: name, body, card and pill all start here

// ===========================================================================
// THE SCROLL — one velocity profile (world px / frame): ramps up from before f0, gently accelerates through the
// hits, eases from f42 to f68 onto a slower run (V_TAIL) that carries the feed down to the composer and Algorithms
// into its solve, then settles to a creep from f72 to f88. Integrated once at module load (trapezoid).
// ===========================================================================
const V_TAIL = 5;
const V_CREEP = 0.75;
const vAt = (f: number) => {
  const up = smoothstep((f + 14) / 30);
  const dn = smoothstep((f - 42) / 26);
  const vm = 13.5 + 3 * smoothstep((f - 8) / 40);
  const tail = V_CREEP + (V_TAIL - V_CREEP) * (1 - smoothstep((f - 72) / 16));
  return vm * up * (1 - dn) + tail * dn;
};
const SCROLL: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= DURATION + 2; f++) out.push(out[f - 1] + 0.5 * (vAt(f - 1) + vAt(f)));
  return out;
})();
const scrollAt = (f: number) => {
  const a = Math.max(0, Math.min(SCROLL.length - 2, Math.floor(f)));
  return lerp(SCROLL[a], SCROLL[a + 1], clamp01(f - a));
};

// ===========================================================================
// FIELD GLYPHS — Lucide geometry (24 box), inlined, one stroke weight (Lato Bold's stem at the card's size)
// ===========================================================================
const ring = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const FIELD_GLYPH = {
  sigma: ["M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2"],
  dna: [
    "m10 16 1.5 1.5",
    "m14 8-1.5-1.5",
    "M15 2c-1.798 1.998-2.518 3.995-2.807 5.993",
    "m16.5 10.5 1 1",
    "m17 6-2.84-2.84",
    "M2 15c6.667-6 13.333 0 20-6",
    "m20 9 .891.891",
    "M3.109 14.109 4 15",
    "m6.5 12.5 1 1",
    "m7 18 2.84 2.84",
    "M9 22c1.798-1.998 2.518-3.995 2.807-5.993",
  ],
  waves: [
    "M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
    "M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
    "M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
  ],
  // a molecule: the aromatic ring (hexagon + inner ring), the chemist's mark
  molecule: ["M12 2.5L20.23 7.25V16.75L12 21.5L3.77 16.75V7.25Z", ring(12, 12, 4.4)],
  infinity: ["M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"],
  orbit: ["M20.341 6.484A10 10 0 0 1 10.266 21.85", "M3.659 17.516A10 10 0 0 1 13.74 2.152", ring(12, 12, 3), ring(19, 5, 2), ring(5, 19, 2)],
  // Lucide "network": a root node branching to two leaves (a graph / tree)
  network: [rectPath(16, 16, 6, 6, 1), rectPath(2, 16, 6, 6, 1), rectPath(9, 2, 6, 6, 1), "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3", "M12 12V8"],
  zap: ["M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"],
  // a crystal lattice: a 3 x 3 grid of atoms joined by bonds
  lattice: [
    ...[4, 12, 20].flatMap((y) => [4, 12, 20].map((x) => ring(x, y, 2.1))),
    ...[4, 12, 20].flatMap((y) => [`M6.1 ${y}H9.9`, `M14.1 ${y}H17.9`]),
    ...[4, 12, 20].flatMap((x) => [`M${x} 6.1V9.9`, `M${x} 14.1V17.9`]),
  ],
} as const;
type FieldGlyphName = keyof typeof FIELD_GLYPH;
const FieldGlyph: React.FC<{ name: FieldGlyphName; cx: number; cy: number; size: number; color: string; weight: number }> = ({ name, cx, cy, size, color, weight }) => (
  <g transform={`translate(${f3(cx - size / 2)} ${f3(cy - size / 2)}) scale(${f3(size / 24)})`} fill="none" stroke={color} strokeWidth={(weight * 24) / size} strokeLinecap="round" strokeLinejoin="round">
    {FIELD_GLYPH[name].map((d, i) => (
      <path key={i} d={d} />
    ))}
  </g>
);

// ===========================================================================
// THE FIELD CARD — a Slack attachment: a 4 px left rule, the field's glyph and its name (Lato 700).
// `fill` 0..1 runs the model's amber down the rule (open grey -> done amber).
// ===========================================================================
const CARD = { dy: 55, h: 36, rule: 4, glyph: 22, glyphX: 15, textX: 46, word: 18, weight: 2.3 } as const;
const FieldCard: React.FC<{ y: number; field: string; glyph: FieldGlyphName; fill: number }> = ({ y, field, glyph, fill }) => {
  const x = TEXT_X;
  const cy = y + CARD.h / 2;
  const fh = CARD.h * smoothstep(fill);
  return (
    <g>
      <path d={rectPath(x, y, CARD.rule, CARD.h, 2)} fill={SLACK.cardLine} />
      {fh > 0.01 ? <path d={rectPath(x, y, CARD.rule, Math.max(fh, 2.01), 2)} fill={SLACK.amberTop} /> : null}
      <FieldGlyph name={glyph} cx={x + CARD.glyphX + CARD.glyph / 2} cy={cy} size={CARD.glyph} color={SLACK.ink} weight={CARD.weight} />
      <text x={x + CARD.textX} y={cy + 6.4} fontFamily={LATO} fontWeight={700} fontSize={CARD.word} fill={SLACK.ink}>
        {field}
      </text>
    </g>
  );
};

// ===========================================================================
// THE SOLVE — astra's amber pill under the card: the model's spark, "Solved", a check. It grows sideways out of
// the rule's foot (as cut 6's channel pill grows out of the click); its content is revealed by the pill itself.
// ===========================================================================
// Lato Black 20.5: cap height 14.7 world = 39 screen px at k 2.64 (the director's >= 38)
const PILL = { dy: CARD.dy + CARD.h + 5, h: 36, w: 118, r: 8, spark: 10, text: 20.5, sparkX: 22, textX: 40 } as const;
const sparkD = (cx: number, cy: number, r: number) => {
  const w = r * 0.26;
  return `M${f3(cx)} ${f3(cy - r)}Q${f3(cx + w)} ${f3(cy - w)} ${f3(cx + r)} ${f3(cy)}Q${f3(cx + w)} ${f3(cy + w)} ${f3(cx)} ${f3(cy + r)}Q${f3(cx - w)} ${f3(cy + w)} ${f3(cx - r)} ${f3(cy)}Q${f3(cx - w)} ${f3(cy - w)} ${f3(cx)} ${f3(cy - r)}Z`;
};
const SolvePill: React.FC<{ y: number; grow: number; k: number; id: string }> = ({ y, grow, k, id }) => {
  if (grow <= 0.001) return null;
  const x = TEXT_X;
  const w = lerp(CARD.rule, PILL.w, easeOutCubic(grow));
  const d = rectPath(x, y, w, PILL.h, Math.min(PILL.r, w / 2));
  const cy = y + PILL.h / 2;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1={0} y1={y} x2={0} y2={y + PILL.h}>
          <stop offset="0" stopColor={SLACK.amberTop} />
          <stop offset="1" stopColor={SLACK.amberFoot} />
        </linearGradient>
        <clipPath id={`${id}c`}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={`url(#${id}g)`} style={{ filter: bloomFilter(k) }} />
      <g clipPath={`url(#${id}c)`}>
        {/* the hot top edge: 2 screen px */}
        <rect x={x + PILL.r} y={y + 0.8 / k} width={Math.max(0, w - 2 * PILL.r)} height={2 / k} fill={SLACK.amberHot} opacity={0.8} />
        <path d={sparkD(x + PILL.sparkX, cy, PILL.spark)} fill={SLACK.onAmber} />
        <text x={x + PILL.textX} y={f3(cy + (0.7165 * PILL.text) / 2)} fontFamily={LATO} fontWeight={900} fontSize={PILL.text} fill={SLACK.onAmber}>
          Solved
        </text>
      </g>
    </g>
  );
};

// ===========================================================================
// A WATCHER'S REACTION — Slack's chip (slackShared's geometry and colours) with a rolling count (an odometer).
// `p` = the count's drum position (an integer at rest). Two drums when the count reaches 10; digits right-aligned
// in the chip's final width so nothing shifts when the tens arrive.
// ===========================================================================
const DIGIT = { px: 12, adv: 7.1, lh: 15 } as const;
const Drum: React.FC<{ x: number; base: number; pos: number; color: string; blankZero?: boolean; blur: number }> = ({ x, base, pos, color, blankZero = false, blur }) => {
  const lo = Math.floor(pos);
  const t = pos - lo;
  const digit = (n: number) => {
    const d = ((n % 10) + 10) % 10;
    return blankZero && n <= 0 ? "" : String(d);
  };
  return (
    <g style={blur > 0.02 ? { filter: `blur(${f3(blur)}px)` } : undefined}>
      {[0, 1].map((j) => (
        <text
          key={j}
          x={x}
          y={f3(base + (j - t) * DIGIT.lh)}
          fontFamily={LATO}
          fontWeight={700}
          fontSize={DIGIT.px}
          fill={color}
          textAnchor="middle"
        >
          {digit(lo + j)}
        </text>
      ))}
    </g>
  );
};
/** The tens drum's position (0 below 10, rolling 0 -> 1 through the carry from 9 to 10). */
const tensOf = (p: number) => {
  const ones = ((p % 10) + 10) % 10;
  return Math.floor(p / 10) + Math.max(0, ones - 9);
};
/** The chip's width follows the count (Slack's chip hugs it): it widens with the tens drum through the carry. */
const chipW = (p: number) => lerp(reactionW(1), reactionW(10), clamp01(tensOf(p)));
/** The chips are drawn at CHIP_S x Slack's size (the director: read at 270 px); `x`, `y` = top-left in world px. */
const CHIP_S = 1.3;
const RollChip: React.FC<{ x: number; y: number; glyph: string; p: number; speed: number; mine?: boolean; id: string }> = ({ x: X, y: Y, glyph, p, speed, mine = false, id }) => {
  const x = 0;
  const y = 0;
  const w = chipW(p);
  const color = mine ? SLACK.reactionMineText : SLACK.meta;
  const ones = ((p % 10) + 10) % 10;
  const tens = tensOf(p);
  const two = tens > 0.001;
  const blur = Math.min(1.2, Math.max(0, speed - 0.25) * 0.5);
  const base = y + 16.5;
  const onesX = x + 29 + DIGIT.adv / 2 + DIGIT.adv * clamp01(tens); // the ones slide right as the tens roll in
  return (
    <g transform={`translate(${f3(X)} ${f3(Y)}) scale(${CHIP_S})`}>
      <defs>
        <clipPath id={`${id}c`}>
          <rect x={x} y={y + 3} width={w} height={REACTION_H - 6} />
        </clipPath>
      </defs>
      <path d={rectPath(x, y, w, REACTION_H, REACTION_H / 2)} fill={mine ? SLACK.reactionMineBg : SLACK.reactionBg} stroke={mine ? SLACK.reactionMineLine : SLACK.reactionLine} strokeWidth={1} />
      <text x={x + 9} y={y + 17} fontSize={14}>
        {glyph}
      </text>
      <g clipPath={`url(#${id}c)`}>
        <Drum x={onesX} base={base} pos={ones} color={color} blur={blur} />
        {two ? <Drum x={onesX - DIGIT.adv} base={base} pos={tens} color={color} blankZero blur={blur} /> : null}
      </g>
    </g>
  );
};

// ===========================================================================
// THE FEED — feed-local tops (world px at scroll 0). Times run through one weekend night.
// ===========================================================================
const PERSON = (color: string, variant: "plain" | "long" | "cap" | "bun" | "curly"): AvatarSpec => ({ kind: "person", color, variant });
const RAVI = PERSON(AVATAR_COLORS[5], "plain");
const NOOR = PERSON(AVATAR_COLORS[6], "long");
const JONAS = PERSON(AVATAR_COLORS[3], "curly");
type Rx = { glyph: string; f0: number; final: number; tau: number; mine?: boolean };
type Post = { m: MessageSpec; field?: string; glyph?: FieldGlyphName; land?: number; rx?: Rx[]; pitch: number };
const POSTS: Post[] = [
  { m: { name: "Maya", time: "12:04 AM", avatar: PEOPLE.Maya, body: ["throw your hardest problems at astra 🍺"] }, pitch: 70 },
  { m: { name: "Daniel", time: "12:13 AM", avatar: PEOPLE.Daniel, body: ["hardest problem from my PhD. go."] }, field: "Number theory", glyph: "sigma", land: 11, pitch: 143 },
  { m: { name: "Priya", time: "12:31 AM", avatar: PEOPLE.Priya, body: ["six years on this one"] }, field: "Protein structure", glyph: "dna", land: 20, pitch: 143 },
  { m: { name: "Leo", time: "1:02 AM", avatar: PEOPLE.Leo, body: ["no way it gets this"] }, field: "Fluid dynamics", glyph: "waves", land: 29, pitch: 143 },
  { m: { name: "Hannah", time: "1:20 AM", avatar: PEOPLE.Hannah, body: ["from my thesis 🙃"] }, field: "Quantum chemistry", glyph: "molecule", land: 37, pitch: 143 },
  {
    m: { name: "Ravi", time: "1:47 AM", avatar: RAVI, body: ["postdoc problem, still open for me"] },
    field: "Topology",
    glyph: "infinity",
    land: 45,
    pitch: 143,
  },
  {
    m: { name: "Noor", time: "2:09 AM", avatar: NOOR, body: ["ok try this"] },
    field: "Astrophysics",
    glyph: "orbit",
    land: 53,
    rx: [
      { glyph: "🤯", f0: 60, final: 24, tau: 14 },
      { glyph: "🍺", f0: 65, final: 13, tau: 15, mine: true },
      { glyph: "👀", f0: 71, final: 9, tau: 13 },
    ],
    pitch: 143,
  },
  { m: { name: "Jonas", time: "2:26 AM", avatar: JONAS, body: ["my advisor's favourite. good luck"] }, field: "Algorithms",
    glyph: "network",
    land: 80,
    rx: [
      { glyph: "🔥", f0: 83, final: 7, tau: 6 },
      { glyph: "🤯", f0: 87, final: 4, tau: 5 },
    ],
    pitch: 143,
  },
  { m: { name: "Priya", time: "2:31 AM", avatar: PEOPLE.Priya, body: ["ok one more"] }, field: "Condensed matter", glyph: "lattice", pitch: 143 },
  { m: { name: "Leo", time: "2:44 AM", avatar: PEOPLE.Leo, body: ["the one nobody in my lab could do.", "not even my advisor"] }, field: "Plasma physics", glyph: "zap", pitch: 143 },
];
// P0's top at scroll 0 (world y): leaves room above for the day divider and the end of an earlier message
const FEED_TOP = 166;
const TOPS: number[] = POSTS.reduce<number[]>((acc, p, i) => [...acc, i === 0 ? FEED_TOP : acc[i - 1] + POSTS[i - 1].pitch], []);
const EARLIER: MessageSpec = { name: "Leo", time: "11:57 PM", avatar: PEOPLE.Leo, greek: [300] };
const EARLIER_TOP = FEED_TOP - 46 - (8 + 20 + BODY_LH + 8);

// hit timing (frames before the landing)
const RULE_LEAD = 9; // amber starts down the rule
const PILL_LEAD = 5; // the pill starts growing out of the rule's foot
const CHIP_F = 7; // a chip's slide

// a count's drum position at frame f: rolls fast from 1 then slows (still ticking at f93); each step rolls over
// the last 45 % of its unit, so a slow count holds its digit between steps
const countAt = (r: Rx, f: number) => {
  const u = Math.max(0, f - r.f0);
  const v = 1 + (r.final - 1) * (1 - Math.exp(-u / r.tau)) * (1 / (1 - Math.exp(-(DURATION - 1 - r.f0) / r.tau)));
  const n = Math.floor(v);
  const fr = v - n;
  return n + smoothstep((fr - 0.55) / 0.45);
};

const DayDivider: React.FC<{ y: number; label: string }> = ({ y, label }) => {
  const w = 92;
  const x = TEXT_X + 150 - w / 2;
  return (
    <g>
      <rect x={MAIN.x0} y={y - 0.5} width={WIN.w - MAIN.x0} height={1} fill={SLACK.hairline} />
      <path d={rectPath(x, y - 12, w, 24, 12)} fill={SLACK.pane} stroke={SLACK.hairline} strokeWidth={1} />
      <text x={x + w / 2} y={y + 4.6} textAnchor="middle" fontFamily={LATO} fontWeight={700} fontSize={13} fill={SLACK.ink}>
        {label}
      </text>
    </g>
  );
};

const KnockingDownProblems: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const sc = scrollAt(S);
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={{ x: 420, y: 300, strength: 0.8 }}>
      <SlackWindow>
        <SlackSidebar k={k} rows={{ [ASTRA_INDEX]: { unread: true, amber: 1 } }} />
        <defs>
          <clipPath id="kdpFeed">
            <rect x={MAIN.x0} y={FEED_Y0} width={WIN.w - MAIN.x0} height={FEED_Y1 - FEED_Y0} />
          </clipPath>
        </defs>
        <g clipPath="url(#kdpFeed)">
          <g transform={`translate(0 ${f3(-sc)})`}>
            <MessageRow y={EARLIER_TOP} m={EARLIER} />
            <DayDivider y={FEED_TOP - 23} label="Sunday" />
            {POSTS.map((p, i) => {
              const top = TOPS[i];
              const extra = ((p.m.body ?? []).length - 1) * BODY_LH; // a two-line body moves its card and pill down
              const fill = p.land !== undefined ? clamp01((S - (p.land - RULE_LEAD)) / (RULE_LEAD - PILL_LEAD)) : 0;
              const grow = p.land !== undefined ? clamp01((S - (p.land - PILL_LEAD)) / PILL_LEAD) : 0;
              // chips: each slides right out from behind the element before it (the pill, then the chip before)
              let edge = TEXT_X + PILL.w;
              const chips = (p.rx ?? []).map((r, j) => {
                const w = CHIP_S * chipW(countAt(r, S));
                const x1 = edge + (j === 0 ? 8 : 6);
                const x0 = edge - w - 2;
                edge = x1 + w;
                const u = clamp01((S - r.f0) / CHIP_F);
                return { r, j, w, x: lerp(x0, x1, easeOutCubic(u)), on: S >= r.f0 };
              });
              return (
                <g key={i}>
                  <MessageRow y={top} m={p.m} />
                  {p.field && p.glyph ? <FieldCard y={top + extra + CARD.dy} field={p.field} glyph={p.glyph} fill={fill} /> : null}
                  {/* the chips under the pill, the later under the earlier */}
                  {[...chips].reverse().map((c) =>
                    c.on ? (
                      <RollChip
                        key={c.j}
                        id={`kdp${i}r${c.j}`}
                        x={c.x}
                        y={top + extra + PILL.dy + (PILL.h - CHIP_S * REACTION_H) / 2}
                        glyph={c.r.glyph}
                        p={countAt(c.r, S)}
                        speed={Math.abs(countAt(c.r, S + 0.5) - countAt(c.r, S - 0.5))}
                        mine={c.r.mine}
                      />
                    ) : null,
                  )}
                  <SolvePill y={top + extra + PILL.dy} grow={grow} k={k} id={`kdp${i}p`} />
                </g>
              );
            })}
          </g>
        </g>
        <ChannelHeader name={ASTRA_CHANNEL} members={48} />
        <Composer channel={ASTRA_CHANNEL} />
      </SlackWindow>
    </StoutStage>
  );
};

export default KnockingDownProblems;
