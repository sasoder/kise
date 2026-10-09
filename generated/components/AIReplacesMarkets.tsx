import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BEAD_RATIO,
  Bead,
  DASH,
  DASH_LINE,
  ENTER_F,
  FONT_SANS,
  FONT_SERIF,
  FeatherWipe,
  GAP,
  INK_HI,
  INK_LO,
  InkPath,
  MARCH,
  RED,
  RED_HI,
  RISE_PX,
  RedGroup,
  SEAM,
  UNIT_PX,
  Unit,
  VALUE_PX,
  VStage,
  V_INK,
  V_PAPER,
  WetLine,
  clamp01,
  easeOutCubic,
  inkDiffuse,
  lineW,
  mixHex,
  pointAtLen,
  redW,
  smoothstep,
  cumLen,
  subPathD,
  vz,
  worldBlur,
} from "./chinatalkVintage";
import type { Pt } from "./chinatalkVintage";
import {
  CHIP,
  CHIP_CUM,
  CHIP_LEN,
  CHIP_PTS,
  CHIP_T0,
  CHIP_T1,
  DURATION,
  FPS,
  GEOM_PROBLEMS,
  HL_T0,
  HL_V,
  LABEL_DIE_T,
  LABEL_DIFF_F,
  LAND_T,
  LINKS,
  N,
  PLAYERS,
  RING_DRAW_R,
  SOLID_F,
  SPOKES,
  SPOKE_T0,
  TAIL_HL_T,
  TAIL_HL_V,
  TRADES,
  TRAIN_UNITS,
  V_SPOKE,
  V_TRAIN,
  WASH_T0,
  WASH_T1,
  camAt,
  chipLenAt,
  chipTimeAt,
  linkBleed,
  radiusOf,
  spokeLenAt,
  spokePoint,
  stockAt,
} from "./aiReplacesMarketsGeom";
import type { Link } from "./aiReplacesMarketsGeom";

// ---------------------------------------------------------------------------
// AIReplacesMarkets — Logan Wright, "Brezhnev chose decay" (ChinaTalk), cut D.
// ChinaTalk slightly-vintage kit (chinatalkVintage), 1080x1920, 24 fps, opaque.
//
// CHECK LINE: China's bet is the Soviet bet again: take the market's tangled
// web of trades away and put one AI in the middle that hands every player
// exactly what it should have.
//
// LINE: "They think AI is the way we can get out of relying on markets. We
// don't need to rely on markets anymore because AI will tell us how to
// allocate resources more appropriately."
// IN = edit frame 770 (32.083 s). The line ends at local f173; slot = 179 f;
// composition = 179 + 12-frame living tail = 191 f.
// Local words: AI 8-17 · out 43-50 · markets 65-74 · anymore 101-107 ·
// AI 116-122 · allocate 137-144 · resources 144-156 · appropriately 163-173.
//
// RED = resources (and the AI is written in red ink). The market is ink.
// Dashed ring = what a player should have; it is written solid when the disc
// meets it.
//
// MOTION (one continuous rewiring; geometry and clocks in aiReplacesMarketsGeom):
// f0 a web of ink links between ten players is already trading red units, the
// discs swelling and shrinking as units slide in and out under their rims. A red
// bead tip is already writing the chip round the middle (f-3 to 18, letters in by f19): each chord soaks away
// from the place the tip crosses it. The chip's pins keep going as spokes at one
// constant speed and touch the players one after another round the ring
// (f40-68); each rim link bleeds from the player a spoke has just touched, and
// MARKETS goes with the last (f68-82). The camera then pushes in while a wash
// rises in the chip (f80-111), one highlight runs out along every spoke (f114),
// and trains of units run in from the discs that are too big, under the chip,
// and out to the ones that are too small, until every disc sits on its ring and
// the ring is written solid (the five that were short land round the circle
// f156-169). Tail: the same soft highlight runs out along the spokes again (f168, f184), a slight drift.
// ---------------------------------------------------------------------------

export { DURATION, FPS };
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

if (GEOM_PROBLEMS.length) throw new Error(`AIReplacesMarkets geometry: ${GEOM_PROBLEMS.join("; ")}`);

const REST = camAt(0);
/** the wash that wakes the chip: red soaked into the paper */
const WASH = mixHex(V_PAPER, RED, 0.2);
/** the chip's letters fill it: twice the kit's value size, in world px (they share the camera) */
const AI_PX = 2 * VALUE_PX;
const AI_T0 = 7;
const DRAW_CUM = SPOKES.map((sp) => cumLen(sp.drawPts));
/** the soft wet end of a link that is soaking away: a small blur (screen px), never wider than the line */
const SOAK_BLUR = 3.5;
/** MARKETS names the opening state and has to read on a phone: capitals 64 px tall (the kit's word face and
 *  tracking, hand-set like the chip's letters; world px, so it shares the camera) */
const WORD_CAP = 0.669;
const WORD_TRACK = 0.12;
const MARKETS_PX = 64 / WORD_CAP;
const MARKETS_Y = 122;

// --- a web link: ink at the low rung; soaks away along its length from where red ink touched it:
// the line itself goes first, a short soft wet end follows, so on any frame it is a line that is half gone ----
const WebLink: React.FC<{ l: Link; i: number; S: number; k: number }> = ({ l, i, S, k }) => {
  if (S >= l.tGone) return null;
  const w = lineW(k);
  const common = { x1: l.A.x, y1: l.A.y, x2: l.B.x, y2: l.B.y, strokeLinecap: "round" as const };
  if (S <= l.tDie) return <line {...common} stroke={V_INK} strokeOpacity={INK_LO} strokeWidth={w.toFixed(3)} />;
  const M = Math.max(8, Math.ceil(l.len / 28));
  const crisp: React.ReactNode[] = [];
  const halo: React.ReactNode[] = [];
  for (let m = 0; m <= M; m++) {
    const u = linkBleed(l, (l.len * m) / M, S);
    const c = 1 - smoothstep(u / 0.55);
    const h = 0.8 * smoothstep(u / 0.3) * (1 - smoothstep((u - 0.3) / 0.7));
    const off = (m / M).toFixed(4);
    crisp.push(<stop key={m} offset={off} stopColor={V_INK} stopOpacity={(INK_LO * c).toFixed(4)} />);
    halo.push(<stop key={m} offset={off} stopColor={V_INK} stopOpacity={(INK_LO * h).toFixed(4)} />);
  }
  const grad = { gradientUnits: "userSpaceOnUse" as const, x1: l.A.x, y1: l.A.y, x2: l.B.x, y2: l.B.y };
  return (
    <g>
      <defs>
        <linearGradient id={`lk${i}-c`} {...grad}>
          {crisp}
        </linearGradient>
        <linearGradient id={`lk${i}-h`} {...grad}>
          {halo}
        </linearGradient>
      </defs>
      <line {...common} stroke={`url(#lk${i}-h)`} strokeWidth={w.toFixed(3)} style={{ filter: worldBlur(SOAK_BLUR, k) }} />
      <line {...common} stroke={`url(#lk${i}-c)`} strokeWidth={w.toFixed(3)} />
    </g>
  );
};

// --- a highlight running out along a spoke (head at arc length sHead of its path) ---
const Glint: React.FC<{ id: string; i: number; sHead: number; len: number; k: number; strength?: number }> = ({ id, i, sHead, len, k, strength = 1 }) => {
  const sp = SPOKES[i];
  const s1 = Math.min(sp.len, sHead);
  const s0 = Math.max(0, sHead - len);
  if (s1 - s0 < 2) return null;
  const a = spokePoint(i, s0);
  const b = spokePoint(i, s1);
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
          <stop offset={0} stopColor={RED_HI} stopOpacity={0} />
          <stop offset={0.45} stopColor={RED_HI} stopOpacity={strength} />
          <stop offset={0.82} stopColor={RED_HI} stopOpacity={strength} />
          <stop offset={1} stopColor={RED_HI} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={subPathD(sp.pts, sp.cum, s0, s1)} fill="none" stroke={`url(#${id})`} strokeWidth={redW(k).toFixed(3)} strokeLinecap="butt" strokeLinejoin="round" />
    </g>
  );
};

// --- a player's ring: dashed (what it should have), written solid when its disc lands. It is drawn one
// line-width outside the size of a disc that is exactly right, so that disc sits in it with a thin paper gap ---
const RING_DASHES = 10;
const ringPts = (c: Pt, a0: number): Pt[] => {
  const pts: Pt[] = [];
  for (let j = 0; j <= 64; j++) {
    const a = a0 + (j / 64) * Math.PI * 2;
    pts.push({ x: c.x + RING_DRAW_R * Math.cos(a), y: c.y + RING_DRAW_R * Math.sin(a) });
  }
  return pts;
};
/** the solid ring is written from where the spoke comes in */
const RING_PATHS = PLAYERS.map((c, i) => {
  const d = SPOKES[i].drawPts;
  const from = d[d.length - 2];
  return ringPts(c, Math.atan2(from.y - c.y, from.x - c.x));
});
const Ring: React.FC<{ i: number; S: number; k: number }> = ({ i, S, k }) => {
  const c = PLAYERS[i];
  const solid = clamp01((S - LAND_T[i]) / SOLID_F);
  const period = (2 * Math.PI * RING_DRAW_R) / RING_DASHES;
  const dash = (period * DASH) / (DASH + GAP);
  return (
    <g>
      {solid < 1 ? (
        <circle
          cx={c.x}
          cy={c.y}
          r={RING_DRAW_R}
          fill="none"
          stroke={V_INK}
          strokeOpacity={INK_HI}
          strokeWidth={(DASH_LINE * vz(k)).toFixed(3)}
          strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(3)} ${(period - dash).toFixed(3)}`}
          strokeDashoffset={(-MARCH * S).toFixed(3)}
        />
      ) : null}
      {solid > 0 ? <InkPath points={RING_PATHS[i]} k={k} draw={solid} rung={INK_HI} /> : null}
    </g>
  );
};

const AIReplacesMarkets: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const radii = PLAYERS.map((_, i) => radiusOf(stockAt(i, S)));

  // --- units in flight: the market's trades, then the chip's trains ---
  // (each unit sits in a fine paper seam, the kit's counted-units look, so it stays a unit on a red spoke)
  const units: React.ReactNode[] = [];
  const seams: React.ReactNode[] = [];
  TRADES.forEach((t, j) => {
    // (a frame of margin on both sides: there it is wholly under a disc)
    if (S < t.tIn - 1 || S > t.tOut + 1) return;
    const l = LINKS[t.link];
    const from = t.dir === 1 ? l.A : l.B;
    const to = t.dir === 1 ? l.B : l.A;
    const u = (t.v * (S - t.t0)) / l.len;
    const p = { x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u };
    seams.push(<Unit key={`m${j}`} x={p.x} y={p.y} k={k} size={UNIT_PX + 2 * SEAM} color={V_PAPER} />);
    units.push(<Unit key={`m${j}`} x={p.x} y={p.y} k={k} />);
  });
  TRAIN_UNITS.forEach((t, j) => {
    if (S < t.tIn - 1 || S > t.tOut + 1) return;
    const s = t.sA + t.dir * V_TRAIN * (S - t.tA);
    if (s < 0 || s > SPOKES[t.player].len) return;
    const p = spokePoint(t.player, s);
    seams.push(<Unit key={`t${j}`} x={p.x} y={p.y} k={k} size={UNIT_PX + 2 * SEAM} color={V_PAPER} />);
    units.push(<Unit key={`t${j}`} x={p.x} y={p.y} k={k} />);
  });

  // --- the chip ---
  const chipLen = chipLenAt(S);
  // the pen's bead: a drop that swells as the tip touches down and soaks back into the line when the stroke closes
  const chipBead = smoothstep((S - CHIP_T0) / 2) * (1 - smoothstep((S - CHIP_T1) / 3));
  const chipTip = pointAtLen(CHIP_PTS, CHIP_CUM, Math.min(chipLen, CHIP_LEN));
  const aiA = clamp01((S - AI_T0) / ENTER_F);
  const washU = smoothstep((S - WASH_T0) / (WASH_T1 - WASH_T0));
  // MARKETS goes like ink on wet paper with the last web link
  const marketsDif = inkDiffuse(clamp01((S - LABEL_DIE_T) / LABEL_DIFF_F));
  const box = { x0: CHIP.x - CHIP.half, y0: CHIP.y - CHIP.half, x1: CHIP.x + CHIP.half, y1: CHIP.y + CHIP.half };

  return (
    <VStage S={S} cam={cam} rest={REST}>
      {/* the market: a web of ink links */}
      {LINKS.map((l, i) => (
        <WebLink key={i} l={l} i={i} S={S} k={k} />
      ))}
      {marketsDif.opacity > 0.002 ? (
        <g opacity={(INK_HI * marketsDif.opacity).toFixed(4)} style={{ filter: worldBlur(marketsDif.blur, k) }}>
          <text
            x={540 + (WORD_TRACK / 2) * MARKETS_PX}
            y={MARKETS_Y + (WORD_CAP / 2) * MARKETS_PX}
            fontFamily={FONT_SANS}
            fontWeight={600}
            fontSize={MARKETS_PX.toFixed(3)}
            letterSpacing={`${WORD_TRACK}em`}
            textAnchor="middle"
            fill={V_INK}
            transform={`translate(540 ${MARKETS_Y}) scale(${(1 + marketsDif.spread).toFixed(4)}) translate(-540 ${-MARKETS_Y})`}
          >
            MARKETS
          </text>
        </g>
      ) : null}

      {/* the chip's pins, running out to every player */}
      <RedGroup k={k}>
        {SPOKES.map((sp, i) => {
          const len = spokeLenAt(i, S);
          if (len <= 0) return null;
          // the bead wells out of the chip's outline as a drop (line width -> full bead), then runs with the tip
          // and dives under the disc it reaches
          const inside = radii[i] - (sp.drawLen - len);
          const grow = smoothstep((S - SPOKE_T0[i]) / 3) * (1 - smoothstep((inside - 4) / 16));
          const tip = pointAtLen(sp.drawPts, DRAW_CUM[i], len);
          return (
            <g key={i}>
              <WetLine id={`sp${i}`} points={sp.drawPts} len={len} k={k} ageAt={(s) => S - (SPOKE_T0[i] + s / V_SPOKE)} shadow={false} />
              {len < sp.drawLen ? <Bead id={`spb${i}`} x={tip.x} y={tip.y} k={k} r={redW(k) * (0.5 + (BEAD_RATIO - 0.5) * grow)} bloom={grow > 0.5} /> : null}
            </g>
          );
        })}
      </RedGroup>

      {/* the instruction, and the same soft highlight running out again (twice) over the settled frame */}
      {S >= HL_T0
        ? SPOKES.map((sp, i) => <Glint key={`h${i}`} id={`hl${i}`} i={i} sHead={sp.sBase + HL_V * (S - HL_T0)} len={120} k={k} />)
        : null}
      {TAIL_HL_T.map((t0, n) =>
        S >= t0 ? SPOKES.map((sp, i) => <Glint key={`t${n}-${i}`} id={`th${n}-${i}`} i={i} sHead={sp.sBase + TAIL_HL_V * (S - t0)} len={240} k={k} />) : null,
      )}

      {seams}
      <RedGroup k={k}>{units}</RedGroup>

      {/* the chip: wash, outline written by a bead tip, the letters */}
      {washU > 0 ? (
        <FeatherWipe id="wash" box={box} u={washU} feather={70} dir="up">
          <rect x={box.x0} y={box.y0} width={2 * CHIP.half} height={2 * CHIP.half} rx={CHIP.r} fill={WASH} />
        </FeatherWipe>
      ) : null}
      {chipLen > 0 ? (
        <RedGroup k={k}>
          <WetLine id="chip" points={CHIP_PTS} len={Math.min(chipLen, CHIP_LEN)} k={k} ageAt={(s) => S - chipTimeAt(s)} shadow={false} />
          {chipBead > 0.01 ? (
            <Bead id="chipb" x={chipTip.x} y={chipTip.y} k={k} r={redW(k) * (0.5 + (BEAD_RATIO - 0.5) * chipBead)} bloom={chipBead > 0.5} />
          ) : null}
        </RedGroup>
      ) : null}
      {aiA > 0 ? (
        <g opacity={smoothstep(aiA).toFixed(4)} style={{ filter: worldBlur(6 * (1 - easeOutCubic(aiA)), k) }}>
          <text
            x={CHIP.x}
            y={(CHIP.y + 0.334 * AI_PX + ((1 - easeOutCubic(aiA)) * RISE_PX) / k).toFixed(3)}
            fontFamily={FONT_SERIF}
            fontWeight={700}
            fontSize={AI_PX}
            textAnchor="middle"
            fill={RED}
          >
            AI
          </text>
        </g>
      ) : null}

      {/* the players: a red disc (its stock) inside its ring */}
      <RedGroup k={k}>
        {PLAYERS.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={radii[i].toFixed(3)} fill={RED} />
        ))}
      </RedGroup>
      {Array.from({ length: N }, (_, i) => (
        <Ring key={i} i={i} S={S} k={k} />
      ))}
    </VStage>
  );
};

export default AIReplacesMarkets;
