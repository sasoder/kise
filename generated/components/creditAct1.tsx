import React from "react";
import {
  DATA_W,
  DOT_R,
  FeatherWipe,
  HatchFill,
  INK,
  INK_HI,
  INK_LO,
  INK_W,
  InkDiffuse,
  InkPath,
  Label,
  Odometer,
  PAPER,
  RED,
  RED_WET,
  WASH_FILL,
  WASH_HATCH,
  WetLine,
  Bead,
  INK_BEAD_R,
  WET_DRY_F,
  clamp01,
  cumLen,
  easeInOutCubic,
  easeOutCubic,
  enterFrom,
  enterU,
  labelPx,
  labelCapH,
  mixHex,
  paperShadow,
  pointAtLen,
  polyD,
  rungAt,
  smoothstep,
  subPathD,
  sz,
} from "./chinatalkShared";
import type { Cam, Pt } from "./chinatalkShared";
import {
  A1,
  E_LEFT_X,
  E_Y,
  YEAR_LABEL_W,
  GDP_C,
  GDP_R,
  PX_PER_T,
  TOWER_RISE1,
  TOWER_W,
  WEDGE_HALF,
  WEDGE_PHI,
  WEDGE_SEP,
  YEAR_FRACS,
  X,
  camAct1,
  eLeftXAt,
  eLeftYearAt,
  eY,
  towerTopY,
  towerX0,
  undulation,
  xScaleAt,
} from "./creditGeom";

// ---------------------------------------------------------------------------
// creditAct1 — Act 1's gestures (builder A), S 0-479, over the standing world
// (creditWorld draws E, the booms, the tower, the 2008 tick, the flag).
//
// LINES: "After the global financial crisis, China saw the largest single
// country credit expansion that the world has seen in at least the last
// century, possibly many centuries. China added a third of global GDP to its
// bank assets in just eight years, and we've never seen anything remotely like
// this. There's a few aspects of that" (S 0-479).
//
// Gestures here (gesture -> the word it serves -> S frames):
//   (A2/A3) a time ruler writes itself leftward along E
//     from 2008, a wet-ink head dropping a tick per
//     year (longer per decade / half-century / century)
//     and running OUT past the frame's left edge ....... "the WORLD has SEEN" head S 134-160 (off screen ~S 160)
//   the year label, pinned at screen x 112 under E,
//     lands "1987" (the year at that point) at word
//     size (58 px, INK_HI) as the head passes it ...... "SEEN" starts S 150, lands S 162
//   it rolls 1987 -> 1920 with rescale 1; the year
//     ticks crowd and thin out; older ticks and the
//     1920s stub slide in from beyond the left edge .... "the last CENTURY" S 172-201
//   it rolls 1920 -> 1700 with rescale 2; the decade
//     ticks crowd and thin out, the half-centuries and
//     centuries are left; the four stubs slide in ...... "possibly many CENTURIES" S 197-232 (reads 1700 to S 240)
//   it diffuses as time re-expands ..................... "CHINA" S 240-260
//   the ruler diffuses like ink as time re-expands ..... "CHINA added" S 242-282
//   the world economy: a ring written in wet ink,
//     ink wash + hatch soaking down ..................... "China ADDED" ring S 238-256, wash S 254-270
//   two radii write, the 120-degree third separates ... "a THIRD" radii S 251-258, slide S 258-276
//   "1/3" lands on the third ........................... "THIRD" lands S 264
//   "GLOBAL GDP" lands under the ring .................. "GLOBAL" lands S 267
//   the third travels up beside the tower's top,
//     turning red ...................................... "GDP to its" S 273-300 (red S 281-297)
//   it tips like a ladle and pours: a red stream, wet
//     bead head, falls into the tower's upper wall
//     under the flag; the third drains into it ........ "its BANK" tip S 289-305, stream S 297-321
//   (creditWorld: the wet surge runs down the tower) ... "bank ASSETS" S 310-338
//   "BANK ASSETS" lands beside the tower ............... "ASSETS" lands S 326
//   eight ruler ticks fire up the tower's right edge,
//     each laying a seam: eight stacked years ......... "in just eight YEARS" S 335-363 (4 f apart)
//   "8 YEARS" lands beside the ruler ................... "YEARS" lands S 363
//   ring, 1/3, GLOBAL GDP, ruler, seams, 8 YEARS
//     diffuse like ink as the tower grows on ........... "never SEEN anything" S 382-404
// The seams sit at the real annual increments of China's bank assets 2009-16
// (creditGeom YEAR_FRACS), so the eight layers are honest, not a ruler's even marks.
// ---------------------------------------------------------------------------

const dir = (a: number): Pt => ({ x: Math.cos(a), y: Math.sin(a) });
const add = (a: Pt, b: Pt, s = 1): Pt => ({ x: a.x + b.x * s, y: a.y + b.y * s });

/** An arc (world polyline) of the circle centre c radius r from angle a0 sweeping `sweep` radians. */
const arcPts = (c: Pt, r: number, a0: number, sweep: number, n = 72): Pt[] => {
  const out: Pt[] = [];
  const steps = Math.max(2, Math.ceil((n * Math.abs(sweep)) / (2 * Math.PI)));
  for (let i = 0; i <= steps; i++) out.push(add(c, dir(a0 + (sweep * i) / steps), r));
  return out;
};
/** A closed sector polygon (apex c). */
const sectorPts = (c: Pt, r: number, a0: number, sweep: number): Pt[] => [c, ...arcPts(c, r, a0, sweep)];

/** Inverse of easeInOutCubic (bisection), for the ring's per-arc draw time. */
const invEase = (y: number) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 26; i++) {
    const m = (lo + hi) / 2;
    if (easeInOutCubic(m) < y) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

// --- the third: geometry over S -------------------------------------------------
const PHI = WEDGE_PHI;
const A_START = PHI + WEDGE_HALF; // the sweep starts on the wedge's lower edge, clockwise
/** The third's front (its arc's midpoint) at home, before it separates. */
const FRONT0 = add(GDP_C, dir(PHI), GDP_R);
/** The pour lip: left of the tower's top, below the flag's level and clear of it. */
const LIP: Pt = { x: -75, y: -2465 };
/** The front's heading once the third has tipped to pour (down-right). */
const POUR_DIR = (35 * Math.PI) / 180;
/** The third at S: its front (world), tip rotation (deg), red-ness, scale. */
const wedgeAt = (S: number) => {
  const sep = WEDGE_SEP * easeInOutCubic((S - A1.sep0) / (A1.sep1 - A1.sep0));
  const sepFront = add(FRONT0, dir(PHI), sep);
  const sepEnd = add(FRONT0, dir(PHI), WEDGE_SEP);
  const tv = easeInOutCubic((S - A1.travel0) / (A1.travel1 - A1.travel0));
  const front = { x: sepFront.x + (LIP.x - sepEnd.x) * tv, y: sepFront.y + (LIP.y - sepEnd.y) * tv };
  const rot = ((POUR_DIR - PHI) * 180) / Math.PI * easeInOutCubic((S - A1.tip0) / (A1.tip1 - A1.tip0));
  const red = smoothstep((S - A1.red0) / (A1.red1 - A1.red0));
  const drained = smoothstep((S - A1.drain0) / (A1.drain1 - A1.drain0));
  return { front, rot, red, drained, scale: Math.sqrt(Math.max(0, 1 - drained)) };
};

// --- the stream: the lip -> into the tower's upper left wall, under the flag (a falling arc) ---
const STREAM_PTS: Pt[] = (() => {
  const top = E_Y - TOWER_RISE1.T * PX_PER_T;
  const T: Pt = { x: towerX0(300) + 6, y: top + 74 };
  const c1 = add(LIP, dir(POUR_DIR - 0.3), 80);
  const c2: Pt = { x: T.x - 70, y: T.y - 46 };
  const pts: Pt[] = [];
  for (let i = 0; i <= 80; i++) {
    const u = i / 80;
    const a = (1 - u) * (1 - u) * (1 - u);
    const b = 3 * u * (1 - u) * (1 - u);
    const c = 3 * u * u * (1 - u);
    const d = u * u * u;
    pts.push({ x: a * LIP.x + b * c1.x + c * c2.x + d * T.x, y: a * LIP.y + b * c1.y + c * c2.y + d * T.y });
  }
  return pts;
})();
const STREAM_CUM = cumLen(STREAM_PTS);
const STREAM_L = STREAM_CUM[STREAM_CUM.length - 1];
const pourPos = (S: number, s0: number, s1: number) => STREAM_L * Math.pow(clamp01((S - s0) / (s1 - s0)), 1.4);
/** S at which the head passed arc s (inverse of pourPos for the head). */
const headPassS = (s: number) => A1.head0 + (A1.head1 - A1.head0) * Math.pow(clamp01(s / STREAM_L), 1 / 1.4);

const Stream: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const head = pourPos(S, A1.head0, A1.head1);
  const tail = pourPos(S, A1.tail0, A1.tail1);
  if (head <= 0.5 || tail >= STREAM_L - 0.5) return null;
  const w = DATA_W * sz(k);
  const wet: React.ReactNode[] = [];
  const step = 10;
  for (let s0 = Math.max(tail, head - 90); s0 < head - 0.05; s0 += step) {
    const s1 = Math.min(head, s0 + step);
    const age = S - headPassS((s0 + s1) / 2);
    const wv = 1 - smoothstep(age / 18);
    if (wv < 0.02) continue;
    wet.push(
      <path
        key={s0.toFixed(1)}
        d={subPathD(STREAM_PTS, STREAM_CUM, s0, s1)}
        fill="none"
        stroke={mixHex(RED, RED_WET, wv)}
        strokeWidth={(w * (1 + 0.15 * wv)).toFixed(3)}
        strokeLinecap={s1 >= head - 0.05 ? "round" : "butt"}
      />,
    );
  }
  const hp = pointAtLen(STREAM_PTS, STREAM_CUM, head);
  // the head slips into the tower: the bead fades over its last ~40 world px
  const beadOp = 1 - smoothstep((head - (STREAM_L - 40)) / 40);
  return (
    <g style={{ filter: paperShadow(k) }}>
      <path d={subPathD(STREAM_PTS, STREAM_CUM, tail, head)} fill="none" stroke={RED} strokeWidth={w.toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
      {wet}
      <Bead id="a1-stream" x={hp.x} y={hp.y} r={DOT_R * sz(k)} color={RED} opacity={beadOp} />
    </g>
  );
};

// --- A2: the time ruler along E ------------------------------------------------------
// Short ink ticks (INK_LO) hanging under E, one per year, longer per decade,
// half-century and century. A wet-ink head writes them leftward from 2008 to E's
// left end; each tick is drawn (wet, INK_HI, +15 %) as the head passes and dries
// to INK_LO. A tier fades as its ticks crowd (spacing < ~1.8x its length, gone
// at 1x), so on the rescales the years, then the decades, thin out and the
// half-centuries and centuries are left: the eye sees the axis zoom out.
/** tick lengths at K_REF (world, through the size law): century, half, decade, year */
const TIER_YRS = [100, 50, 10, 1];
const TIER_LEN = [67, 50, 39, 22];
const tierOf = (y: number) => (y % 100 === 0 ? 0 : y % 50 === 0 ? 1 : y % 10 === 0 ? 2 : 3);
const RULER_FROM = 2008;
/** A3: the head runs OUT past the frame's left edge (~1983 at the era scale)
 *  and stops off screen at RULER_TO; older ticks are history already written. */
const RULER_TO = 1972;
/** the head eases up to RULER_V (years / frame; ~30 screen px/f at k 0.36) over
 *  RULER_TA frames, then keeps that speed until it is off screen: it never
 *  decelerates in frame. */
const RULER_V = 1.1;
const RULER_TA = 6;
const rulerDist = (t: number) => (t <= 0 ? 0 : t < RULER_TA ? (RULER_V * t * t) / (2 * RULER_TA) : RULER_V * (t - RULER_TA / 2));
const RULER_HEAD1 = A1.rulerHead0 + (RULER_FROM - RULER_TO) / RULER_V + RULER_TA / 2;
const headYearAt = (S: number) => Math.max(RULER_TO, RULER_FROM - rulerDist(S - A1.rulerHead0));
/** S at which the head passed a year (inverse of headYearAt). */
const rulerPassS = (year: number) => {
  const d = RULER_FROM - year;
  if (d <= 0) return A1.rulerHead0;
  if (year < RULER_TO) return A1.rulerHead0;
  const dA = (RULER_V * RULER_TA) / 2;
  return A1.rulerHead0 + (d < dA ? Math.sqrt((2 * RULER_TA * d) / RULER_V) : d / RULER_V + RULER_TA / 2);
};
const crowdAt = (tier: number, S: number, k: number) => {
  const spacing = TIER_YRS[tier] * xScaleAt(S) * k;
  const len = TIER_LEN[tier] * sz(k) * k;
  return smoothstep((spacing / len - 1) / 0.8);
};
/** the crowding a tier reached at the end of "many centuries" (it does not
 *  come back as time re-expands: the ruler is leaving) */
const CROWD_FREEZE_S = 234;
const CROWD_MIN = TIER_YRS.map((_, t) => crowdAt(t, CROWD_FREEZE_S, camAct1(CROWD_FREEZE_S).k));
const TICK_DRAW_F = 5;

const TimeRuler: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  if (S < A1.rulerHead0 || S > A1.rulerOut1 + 1) return null;
  const s = sz(k);
  const w = INK_W * s;
  const crowd = TIER_YRS.map((_, t) => {
    const c = crowdAt(t, S, k);
    return S > CROWD_FREEZE_S ? Math.min(c, CROWD_MIN[t]) : c;
  });
  const yLeft = Math.max(1500, Math.ceil(eLeftYearAt(S)));
  const eLeft = eLeftXAt(S);
  const ticks: React.ReactNode[] = [];
  for (let y = RULER_FROM - 1; y >= yLeft; y--) {
    const t = tierOf(y);
    if (crowd[t] <= 0.002) continue;
    const x = X(y, S);
    const onE = smoothstep((x - eLeft - 24) / 110);
    if (onE <= 0.002) continue;
    const pass = rulerPassS(y);
    const age = S - pass;
    if (age <= 0) continue;
    const draw = easeOutCubic(age / TICK_DRAW_F);
    const wet = y >= RULER_TO ? 1 - smoothstep(age / WET_DRY_F) : 0;
    const op = (INK_LO + (INK_HI - INK_LO) * wet) * onE * crowd[t];
    if (op <= 0.002) continue;
    const y0 = eY(y, S);
    const len = TIER_LEN[t] * s * draw;
    ticks.push(
      <path
        key={y}
        d={`M${x.toFixed(2)} ${y0.toFixed(2)}L${x.toFixed(2)} ${(y0 + len).toFixed(2)}`}
        stroke={INK}
        strokeOpacity={op.toFixed(4)}
        strokeWidth={(w * (1 + 0.15 * wet)).toFixed(3)}
        strokeLinecap="round"
      />,
    );
  }
  // the wet-ink head (E's own bead material) riding E leftward
  const hy = headYearAt(S);
  const headOp = smoothstep((S - A1.rulerHead0) / 3) * (1 - smoothstep((S - RULER_HEAD1) / 4));
  return (
    <InkDiffuse u={clamp01((S - A1.rulerOut0) / (A1.rulerOut1 - A1.rulerOut0))} k={k} cx={E_LEFT_X / 2} cy={E_Y}>
      <g fill="none">{ticks}</g>
      {headOp > 0.002 ? <Bead id="a1-ruler-head" x={X(hy, S)} y={eY(hy, S)} r={INK_BEAD_R * s} color={INK} opacity={headOp * INK_HI} /> : null}
    </InkDiffuse>
  );
};
/** The year label lands at this screen font size (the size of a word being
 *  read, not the wide-shot floor) so it reads on a phone. A3: it stands at the
 *  world point YEAR_LABEL_W, which the bars-shot camera holds at screen x
 *  YEAR_LABEL_SX (112) for its whole life on screen (creditGeom PIN), so it is
 *  pinned there and reads the year AT that screen point: 1987 -> 1920 -> 1700. */
const YEAR_PX = 58;
/** its caps' top sits this far under E (clear of the longest tick), screen px */
const YEAR_GAP_PX = 34;

// --- the ruler of eight years up the tower ---------------------------------------------
const H25 = TOWER_RISE1.T * PX_PER_T;
const tickS = (i: number) => A1.tick0 + i * A1.tickStep;
const TICK_F = 5;

// --- the layer -----------------------------------------------------------------------
export const Act1Layer: React.FC<{ S: number; cam: Cam }> = ({ S, cam }) => {
  const k = cam.k;
  const s = sz(k);
  const out: React.ReactNode[] = [];
  const dif = clamp01((S - A1.diffuse0) / (A1.diffuse1 - A1.diffuse0));
  if (dif >= 1 && S > A1.diffuse1) {
    return null;
  }

  // -- the time ruler along E (A2) --
  out.push(<TimeRuler key="ruler-time" S={S} k={k} />);

  // -- the year at the label's screen point (pinned at x 112, under E), at word size --
  if (S >= A1.yearIn && S < A1.yearOut + 24) {
    const LX = YEAR_LABEL_W;
    const yearAt = (s: number) => 2008 + LX / xScaleAt(s);
    const v = Math.round(yearAt(S) * 1e4) / 1e4;
    const speed = Math.abs(yearAt(S + 0.5) - yearAt(S - 0.5));
    const fsW = YEAR_PX / k;
    const m = fsW / labelPx("value", k);
    const yc = E_Y + undulation(LX) + YEAR_GAP_PX / k + (0.667 * fsW) / 2;
    out.push(
      <g key="year" transform={`translate(${LX} ${yc.toFixed(2)}) scale(${m.toFixed(4)}) translate(${-LX} ${(-yc).toFixed(2)})`}>
        <Odometer
          id="a1-year"
          value={v}
          digits={4}
          x={LX}
          y={yc}
          k={k}
          speed={speed}
          rung={INK_HI}
          appear={enterFrom(S, A1.yearIn)}
          diffuse={clamp01((S - A1.yearOut) / 20)}
        />
      </g>,
    );
  }

  // -- the world economy and its third --
  if (S >= A1.circle0) {
    const ringRung = rungAt(S, A1.circleRecede, INK_HI, INK_LO);
    const draw = easeInOutCubic((S - A1.circle0) / (A1.circle1 - A1.circle0));
    const ringAge = (frac: number) => S - (A1.circle0 + (A1.circle1 - A1.circle0) * invEase(frac));
    const fillU = clamp01((S - A1.fill0) / (A1.fill1 - A1.fill0));
    const radiiU = easeInOutCubic((S - A1.radii0) / (A1.radii1 - A1.radii0));
    const w = wedgeAt(S);
    const box = { x0: GDP_C.x - GDP_R, y0: GDP_C.y - GDP_R, x1: GDP_C.x + GDP_R, y1: GDP_C.y + GDP_R };
    const washK = ringRung / INK_HI;

    // the remainder (240 degrees): stays home
    const remSweep = 2 * Math.PI - 2 * WEDGE_HALF;
    const remArc = arcPts(GDP_C, GDP_R, A_START, remSweep, 96);
    const remFrac = 2 / 3; // of the full sweep
    const remDraw = Math.min(draw, remFrac) / remFrac;
    const remCum = cumLen(remArc);
    const remL = remCum[remCum.length - 1];
    const rem: React.ReactNode[] = [];
    rem.push(
      <FeatherWipe key="rem-fill" id="a1-remfill" box={box} u={fillU} feather={70} dir="down">
        <HatchFill
          id="a1-rem-hatch"
          region={sectorPts(GDP_C, GDP_R, A_START, remSweep)}
          k={k}
          color={INK}
          fill={WASH_FILL * washK}
          lineOpacity={WASH_HATCH * washK}
          anchor={GDP_C}
        />
      </FeatherWipe>,
    );
    rem.push(
      <WetLine
        key="rem-ring"
        id="a1-rem-ring"
        points={remArc}
        len={remL * remDraw}
        k={k}
        ink
        rung={ringRung}
        ageAt={(sv) => ringAge((sv / remL) * remFrac)}
        bead={draw < remFrac ? 1 : 0}
      />,
    );
    // the remainder's two radii (they stay as its cut edges)
    for (const a of [PHI - WEDGE_HALF, PHI + WEDGE_HALF]) {
      rem.push(<InkPath key={`rr${a.toFixed(3)}`} points={[GDP_C, add(GDP_C, dir(a), GDP_R)]} k={k} draw={radiiU} rung={ringRung} />);
    }
    out.push(
      <InkDiffuse key="rem" u={dif} k={k} cx={GDP_C.x} cy={GDP_C.y}>
        {rem}
      </InkDiffuse>,
    );

    // the third: wash + hatch (ink) -> red, its arc + edges; slides out, travels up to the
    // lip, tips to pour (rotating about its front) and drains through it into the stream
    if (w.scale > 0.002) {
      const wedgePoly = sectorPts(GDP_C, GDP_R, PHI - WEDGE_HALF, 2 * WEDGE_HALF);
      const arcW = arcPts(GDP_C, GDP_R, PHI - WEDGE_HALF, 2 * WEDGE_HALF, 72);
      const wDraw = clamp01((draw - remFrac) / (1 - remFrac));
      const wCum = cumLen(arcW);
      const wL = wCum[wCum.length - 1];
      const inkOp = 1 - w.red;
      const tf = `translate(${w.front.x.toFixed(2)} ${w.front.y.toFixed(2)}) rotate(${w.rot.toFixed(3)}) scale(${w.scale.toFixed(4)}) translate(${(-FRONT0.x).toFixed(2)} ${(-FRONT0.y).toFixed(2)})`;
      out.push(
        <g key="third">
          {inkOp > 0.002 ? (
            <g opacity={inkOp.toFixed(4)} transform={tf}>
              <FeatherWipe id="a1-wfill" box={box} u={fillU} feather={70} dir="down">
                <HatchFill
                  id="a1-w-hatch"
                  region={wedgePoly}
                  k={k}
                  color={INK}
                  fill={WASH_FILL}
                  lineOpacity={WASH_HATCH}
                  anchor={GDP_C}
                />
              </FeatherWipe>
              <WetLine
                id="a1-w-ring"
                points={arcW}
                len={wL * wDraw}
                k={k}
                ink
                rung={INK_HI}
                ageAt={(sv) => ringAge(remFrac + (sv / wL) * (1 - remFrac))}
                bead={draw > remFrac && draw < 0.999 ? 1 : 0}
              />
              {[PHI - WEDGE_HALF, PHI + WEDGE_HALF].map((a) => (
                <InkPath key={`wr${a.toFixed(3)}`} points={[GDP_C, add(GDP_C, dir(a), GDP_R)]} k={k} draw={radiiU} rung={INK_HI} />
              ))}
            </g>
          ) : null}
          {w.red > 0.002 ? (
            <g opacity={w.red.toFixed(4)} style={{ filter: paperShadow(k) }}>
              <path
                transform={tf}
                d={polyD(wedgePoly, true)}
                fill={mixHex(RED, RED_WET, 0.35 * (1 - smoothstep((S - A1.red1) / 12)) + 0.5 * smoothstep((S - A1.drain0) / 6))}
              />
            </g>
          ) : null}
        </g>,
      );
    }

    // the stream: the third liquefied, pouring into the tower's top
    out.push(<Stream key="stream" S={S} k={k} />);

    // labels: "1/3" in the third (it stays in the gap the third leaves), GLOBAL GDP under the ring
    const third = add(GDP_C, dir(PHI), 143 + WEDGE_SEP);
    out.push(
      <Label
        key="l13"
        text="1/3"
        x={third.x}
        y={third.y}
        k={k}
        size="value"
        rung={rungAt(S, A1.circleRecede, INK_HI, INK_LO)}
        appear={enterU(S, A1.third)}
        diffuse={dif}
      />,
    );
    const capW = labelCapH("word", k);
    out.push(
      <Label
        key="gdp"
        text="GLOBAL GDP"
        x={GDP_C.x}
        y={GDP_C.y + GDP_R + 26 * s + capW / 2}
        k={k}
        size="word"
        rung={rungAt(S, A1.circleRecede, INK_HI, INK_LO)}
        appear={enterU(S, A1.global)}
        diffuse={dif}
      />,
    );
  }

  // -- the ruler: eight ticks up the tower's right edge, eight seams across it --
  if (S >= A1.tick0) {
    const x0 = towerX0(S);
    const xr = x0 + TOWER_W;
    const seams: React.ReactNode[] = [];
    const ticks: React.ReactNode[] = [];
    YEAR_FRACS.forEach((f, i) => {
      const u = clamp01((S - tickS(i)) / TICK_F);
      if (u <= 0) return;
      const y = E_Y - f * H25;
      const e = 1 - Math.pow(1 - u, 3);
      ticks.push(<InkPath key={`t${i}`} points={[{ x: xr + 6 * s, y }, { x: xr + 40 * s, y }]} k={k} draw={e} rung={INK_HI} />);
      if (f < 0.999) {
        seams.push(
          <path
            key={`s${i}`}
            d={`M${x0.toFixed(2)} ${y.toFixed(2)}L${(x0 + TOWER_W * e).toFixed(2)} ${y.toFixed(2)}`}
            stroke={PAPER}
            strokeWidth={(INK_W * 1.8 * s).toFixed(3)}
            strokeLinecap="butt"
          />,
        );
      }
    });
    const d = (1 - smoothstep(dif)) ;
    if (d > 0.002) out.push(<g key="seams" opacity={d.toFixed(4)}>{seams}</g>);
    const yMid = E_Y - 0.5 * H25;
    out.push(
      <InkDiffuse key="ruler" u={dif} k={k} cx={xr + 23 * s} cy={yMid}>
        {ticks}
      </InkDiffuse>,
    );
    out.push(
      <Label
        key="8y"
        text="8 YEARS"
        x={xr + 58 * s}
        y={yMid}
        k={k}
        size="word"
        anchor="start"
        rung={INK_HI}
        appear={enterU(S, A1.years)}
        diffuse={dif}
      />,
    );
  }

  return <>{out}</>;
};

// --- what is still standing at S 479 --------------------------------------------------
export type Act1StandingDiffuse = { bankAssets?: number };
/** "BANK ASSETS" beside the tower (right side), INK_HI as it lands on "assets",
 *  INK_LO from "years". Builder B retires it with `diffuse.bankAssets` (0..1). */
export const BANK_ASSETS_Y = -2160;
export const Act1Standing: React.FC<{ S: number; cam: Cam; diffuse?: Act1StandingDiffuse }> = ({ S, cam, diffuse = {} }) => {
  const k = cam.k;
  const xr = towerX0(S) + TOWER_W;
  return (
    <Label
      text="BANK ASSETS"
      x={xr + 30 * sz(k)}
      y={BANK_ASSETS_Y}
      k={k}
      size="word"
      anchor="start"
      rung={rungAt(S, A1.years, INK_HI, INK_LO)}
      appear={enterU(S, A1.assets)}
      diffuse={diffuse.bankAssets ?? 0}
    />
  );
};

/** For clearance checks: the tower's top at S. */
export const act1TowerTop = towerTopY;
