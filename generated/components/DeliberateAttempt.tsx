import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Bead,
  DOT_R,
  FeatherWipe,
  INK,
  INK_HI,
  INK_LO,
  INK_W,
  MARCH_W,
  InkDiffuse,
  InkPath,
  Label,
  RED,
  RED_HI,
  Seal,
  Stage,
  WetLine,
  camFromTrack,
  clamp01,
  cumLen,
  easeInOutCubic,
  enterU,
  evenEase,
  glideTargetAt,
  lerp,
  mixHex,
  paperShadow,
  runFollower,
  smoothstep,
  subPathD,
  sz,
  type Cam,
  type Glide,
  type Pt,
} from "./chinatalkShared";

// ---------------------------------------------------------------------------
// DeliberateAttempt -- Logan Wright, "The biggest credit boom in history"
// (ChinaTalk), V2 cut 3 of 5, delivered as 18_DeliberateAttempt.mov.
//
// LINE: "There's a few aspects of that. First, there was a deliberate attempt to
// provide this sort of credit expansion, to provide counter-cyclical policy
// support in the response to the global financial crisis."
//
// IN = 444 (edit-timeline frame of "There's"). Local f = start_f - 444. The last
// word "crisis" ends at 684 -> 240 + 16 f tail = 256 f. 24 fps, 1080x1920, opaque.
//
// IDEA: the textbook counter-cycle, drawn live on one time axis. DASHED ink = the
// economy as expected without help (it plunges: the crisis). RED = credit, written
// deliberately in the opposite phase (its mirror, with a red glow wash down to the
// level). SOLID ink = what actually happened, the sum: a small dip, then level.
// World: the level hairline is y 0, the chart runs x -410..410; the dashed bottoms
// out at p 0.60 (x 82, y +380).
//
// PASS 2 (director): a tight camera that travels with the tips (k 2.2, tips at
// screen x ~575-680), bigger opening seals (~240 px), heavier lines (final
// framing: red ~10, solid ~7, dashed ~6 screen px, dash 22 / gap 14), CREDIT in
// ink. The end picture is unchanged.
//
// GESTURES (gesture -> word -> local frames):
// 1. three ink seal outlines (150 world, ~240 px) write in, a centred row filling
//    the column -> "there's a few aspects" (-4..23; the first is already writing at
//    f0); camera creeps in (k 1.55 -> 1.62).
// 2. seal 1 soaks red (outline ink -> red, red fill soaks down) -> "first" (26..40);
//    seals 2 and 3 diffuse like ink (37..54); seal 1 slides left and shrinks into
//    the red line's start marker (36..58), pulling the level hairline out behind it
//    while the hairline's right end writes across (36..80); the camera pushes in on
//    seal 1 as it goes (20..70, look x -437, k -> 2.2).
// 3. the dashed ink tip and the red tip set off together from seal 1 -> "there was
//    a deliberate attempt" (56..; the dashed bends down from ~72, the red rises as
//    its mirror). Both ride one even track (p 0 -> 1, 56..256). The camera travels
//    with them at k 2.2 (50..178, look x -437 -> 0), tips at screen x ~575-680.
// 4. the dashed plunges, the red climbs as its mirror, the red glow wash filling
//    down to the level -> "provide this sort of credit expansion" (86..129); CREDIT
//    (ink 0.90) lands in the elbow of the red line on "credit" (enters 101, lands 113).
// 5. the solid ink tip writes from seal 1 (just off-frame left) along the level,
//    enters and catches the other two with matched speed, then rides their sum ->
//    "counter-cyclical policy support" (137..185); the dashed bottoms out (~175) and
//    turns, the red eases back, the solid is back on the level by "support".
// 6. ONE long pull-back (112..238: k 2.2 -> 1.45 as the curves spread, kept so both
//    tips stay above the caption band, then -> 1.03 and look (0, 70) on "in the
//    response to the global financial crisis", C1 through one overlap at 166..176)
//    reveals the whole chart; an ink seal ticks onto the dashed trough (207..219) +
//    "2008" -> "financial" (lands 217); "CRISIS" under it -> "crisis" (lands 226).
//    Tail: one RED_HI highlight travels the red line seal -> tip (220..256); the
//    three tips keep settling to the right end (never static).
// MEASURED (half-res preview): camera max |dv| 2.43 screen px/f^2 (f69), max 27.7
// screen px/f; tips max 21.9 (dashed/red), 22.7 (solid catch-up), highlight 32;
// tip span during the follow y 202..1342; lowest subject ink y 1370 (dashed tip,
// f150), final frame 370..1314.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const IN = 444;
export const DURATION = 256;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the chart -----------------------------------------------------------------
const X0 = -410;
const W = 820;
/** dashed depth at the trough (world px below the level) */
const A = 380;
/** the solid's small dip */
const B = 60;
const P_FALL0 = 0.03;
const P_TROUGH = 0.6;
/** how much of the plunge the dashed has recovered by the right end */
const RECOVER = 0.38;
const N = 420;
// line weights (world px at K_REF, through the size law): at the final framing
// (k 1.03, x1.07) red ~10, solid ink ~7, dashed ~6 screen px, dash 22 / gap 14.
const RED_W = 9.35;
const SOLID_W = 6.54;
const DASHED_W = 5.6;
const DASH_ON = 20.6;
const DASH_OFF = 13.1;
const inkBeadR = (w: number) => (DOT_R / 4.5) * (w / 2);

/** dashed depth fraction (0 = level, 1 = trough), C1 at the trough */
const gDash = (p: number) =>
  p < P_TROUGH ? smoothstep((p - P_FALL0) / (P_TROUGH - P_FALL0)) : 1 - RECOVER * smoothstep((p - P_TROUGH) / (1 - P_TROUGH));
/** the solid's dip: a soft bump 0.05..0.62 */
const hDip = (p: number) => (p <= 0.05 || p >= 0.62 ? 0 : Math.pow(Math.sin((Math.PI * (p - 0.05)) / 0.57), 2));
const xAt = (p: number) => X0 + W * p;
const yDash = (p: number) => A * gDash(p);
const ySolid = (p: number) => B * hDip(p);
/** credit = what happened minus what was expected: the mirror of the dashed */
const yRed = (p: number) => ySolid(p) - yDash(p);

const sample = (fy: (p: number) => number): Pt[] => Array.from({ length: N + 1 }, (_, i) => ({ x: xAt(i / N), y: fy(i / N) }));
const DASH_PTS = sample(yDash);
const RED_PTS = sample(yRed);
const SOLID_PTS = sample(ySolid);
const DASH_CUM = cumLen(DASH_PTS);
const RED_CUM = cumLen(RED_PTS);
const SOLID_CUM = cumLen(SOLID_PTS);
const lenAtP = (cum: number[], p: number) => {
  const t = clamp01(p) * N;
  const i = Math.min(N - 1, Math.floor(t));
  return cum[i] + (cum[i + 1] - cum[i]) * (t - i);
};
const pAtLen = (cum: number[], s: number) => {
  if (s <= 0) return 0;
  if (s >= cum[N]) return 1;
  let lo = 0;
  let hi = N;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (cum[m] <= s) lo = m;
    else hi = m;
  }
  return (lo + (s - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo])) / N;
};

const P_TROUGH_PT: Pt = { x: xAt(P_TROUGH), y: yDash(P_TROUGH) };

// --- the tips ---------------------------------------------------------------------
const TIP_F0 = 56;
const TIP_F1 = 256;
/** dashed + red tips: one even ride, eased at both ends */
const pDR = (S: number) => (S <= TIP_F0 ? 0 : evenEase((S - TIP_F0) / (TIP_F1 - TIP_F0), 0.1));
const SOLID_F0 = 137;
const SOLID_CATCH = 48;
/** the solid tip starts at seal 1 and catches the other two with matched speed */
const pSolid = (S: number) => (S <= SOLID_F0 ? 0 : pDR(S) * smoothstep((S - SOLID_F0) / SOLID_CATCH));
/** the frame at which a monotone tip reached p (bisection) */
const frameAtP = (fp: (S: number) => number, p: number, f0: number) => {
  let lo = f0;
  let hi = TIP_F1;
  if (fp(hi) < p) return hi;
  for (let it = 0; it < 28; it++) {
    const m = (lo + hi) / 2;
    if (fp(m) < p) lo = m;
    else hi = m;
  }
  return hi;
};

// --- the seals -----------------------------------------------------------------
const SEAL_SIDE = 150;
const SEAL_GAP = 206;
const SEAL_MARK = 34;
const SEAL_WRITE_F = 14;
const SEAL_WRITE: number[] = [-4, 4, 9];
const SOAK_F0 = 26;
const SOAK_F = 14;
const SLIDE_F0 = 36;
const SLIDE_F1 = 58;
const DIFFUSE_F0 = 37;
const DIFFUSE_F = 17;
const HAIR_F0 = 36;
const HAIR_F1 = 80;
const HAIR_X1 = X0 + W + 24;

// --- the labels ------------------------------------------------------------------
const CREDIT_S = 109;
const CREDIT_AT: Pt = { x: -240, y: -150 };
const TICK_F0 = 207;
const YEAR_S = 217;
const CRISIS_S = 226;
const WORD_MIN = 44;
const VALUE_MIN = 62;

// --- the highlight ---------------------------------------------------------------
const HI_F0 = 220;
const HI_F1 = 262;
const HI_HALF = 70;

// --- the camera ------------------------------------------------------------------
const START: Cam = { x: 0, y: 0, k: 1.55 };
const GLIDES: Glide[] = [
  { f0: -10, f1: 34, k: 1.62 },
  { f0: 20, f1: 70, dx: -437, k: 2.2 },
  { f0: 50, f1: 178, dx: 437, dy: 50, even: 0.15 },
  { f0: 112, f1: 176, k: 1.45 },
  { f0: 166, f1: 238, dy: 20, k: 1.03 },
];
const TRACK = runFollower((f) => glideTargetAt(START, GLIDES, f), 0, DURATION + 2);
export const camAt = camFromTrack(TRACK.cams, 0);
const REST = TRACK.cams[0];

// --- helpers ----------------------------------------------------------------------
/** A rounded-square outline written clockwise from its top-left corner. */
const outlineD = (cx: number, cy: number, side: number, r: number) => {
  const h = side / 2;
  const x0 = cx - h;
  const y0 = cy - h;
  const x1 = cx + h;
  const y1 = cy + h;
  return (
    `M${(x0 + r).toFixed(2)} ${y0.toFixed(2)}H${(x1 - r).toFixed(2)}Q${x1.toFixed(2)} ${y0.toFixed(2)} ${x1.toFixed(2)} ${(y0 + r).toFixed(2)}` +
    `V${(y1 - r).toFixed(2)}Q${x1.toFixed(2)} ${y1.toFixed(2)} ${(x1 - r).toFixed(2)} ${y1.toFixed(2)}` +
    `H${(x0 + r).toFixed(2)}Q${x0.toFixed(2)} ${y1.toFixed(2)} ${x0.toFixed(2)} ${(y1 - r).toFixed(2)}` +
    `V${(y0 + r).toFixed(2)}Q${x0.toFixed(2)} ${y0.toFixed(2)} ${(x0 + r).toFixed(2)} ${y0.toFixed(2)}`
  );
};

/** A big seal square: ink outline written in (`draw`), soaking red (`soak`). */
const SealSquare: React.FC<{ id: string; cx: number; cy: number; side: number; k: number; draw: number; soak: number }> = ({
  id,
  cx,
  cy,
  side,
  k,
  draw,
  soak,
}) => {
  if (draw <= 0.001) return null;
  const r = Math.min(side * 0.08, 6);
  const d = outlineD(cx, cy, side, r);
  const w = INK_W * 1.6 * sz(k);
  const s = smoothstep(soak);
  const stroke = s > 0 ? mixHex(INK, RED, s) : INK;
  const op = lerp(INK_HI, 1, s);
  const box = { x0: cx - side / 2 - w, y0: cy - side / 2 - w, x1: cx + side / 2 + w, y1: cy + side / 2 + w };
  return (
    <g style={s > 0.02 ? { filter: paperShadow(k) } : undefined}>
      {soak > 0 ? (
        <FeatherWipe id={`${id}-soak`} box={box} u={easeInOutCubic(soak)} feather={side * 0.5} dir="down">
          <path d={d + "Z"} fill={RED} />
        </FeatherWipe>
      ) : null}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeOpacity={op.toFixed(4)}
        strokeWidth={w.toFixed(3)}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={draw >= 1 ? undefined : `${clamp01(draw).toFixed(4)} 2`}
      />
    </g>
  );
};

/** The red glow wash between the red line and the level (y 0): RED 0.15 at the
 *  line -> 0.04 within WASH_DEPTH -> 0 at the level. Per-column rects with shared
 *  objectBoundingBox gradients (copied from chinaGrowthShared's RedWash), clipped
 *  to the region, feathered in over the first WASH_START px and behind the tip. */
const WASH_COL = 5;
const WASH_LEAD = 110;
const WASH_START = 90;
const WASH_DEPTH = 160;
const WASH_TOP = 0.15;
const WASH_FLOOR = 0.04;
const CreditWash: React.FC<{ p: number; settled: boolean }> = ({ p, settled }) => {
  if (p < 0.02) return null;
  const n = Math.max(2, Math.ceil(p * N));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const q = (p * i) / n;
    pts.push({ x: xAt(q), y: yRed(q) });
  }
  const x0 = pts[0].x;
  const x1 = pts[pts.length - 1].x;
  const poly = [...pts, { x: x1, y: 0 }, { x: x0, y: 0 }].map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join("") + "Z";
  const cols: React.ReactNode[] = [];
  for (let x = x0; x < x1; x += WASH_COL) {
    const xe = Math.min(x1, x + WASH_COL);
    const pa = (x - X0) / W;
    const pb = (xe - X0) / W;
    const top = Math.min(yRed(pa), yRed(pb), yRed((pa + pb) / 2)) - 3;
    if (top >= -0.5) continue;
    const xm = (x + xe) / 2;
    const fe = smoothstep((xm - x0) / WASH_START) * (settled ? 1 : smoothstep((x1 - xm) / WASH_LEAD));
    if (fe <= 0.002) continue;
    const op = fe < 1 ? fe.toFixed(4) : undefined;
    const tailY = top + WASH_DEPTH;
    cols.push(
      <rect key={`g${x.toFixed(1)}`} x={x.toFixed(3)} y={top.toFixed(3)} width={(xe - x).toFixed(3)} height={WASH_DEPTH} fill="url(#da-wash-glow)" opacity={op} shapeRendering="crispEdges" />,
    );
    if (tailY < -0.5) {
      cols.push(
        <rect key={`t${x.toFixed(1)}`} x={x.toFixed(3)} y={tailY.toFixed(3)} width={(xe - x).toFixed(3)} height={(-tailY).toFixed(3)} fill="url(#da-wash-tail)" opacity={op} shapeRendering="crispEdges" />,
      );
    }
  }
  const glow = [0, 0.15, 0.35, 0.6, 1].map((t) => ({ t, o: WASH_FLOOR + (WASH_TOP - WASH_FLOOR) * (1 - t) * (1 - t) }));
  const tail = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ t, o: WASH_FLOOR * (1 - Math.pow(t, 2.2)) }));
  return (
    <g>
      <defs>
        <linearGradient id="da-wash-glow" x1={0} y1={0} x2={0} y2={1}>
          {glow.map((g) => (
            <stop key={g.t} offset={g.t} stopColor={RED} stopOpacity={g.o.toFixed(4)} />
          ))}
        </linearGradient>
        <linearGradient id="da-wash-tail" x1={0} y1={0} x2={0} y2={1}>
          {tail.map((g) => (
            <stop key={g.t} offset={g.t} stopColor={RED} stopOpacity={g.o.toFixed(4)} />
          ))}
        </linearGradient>
        <clipPath id="da-wash-clip">
          <path d={poly} />
        </clipPath>
      </defs>
      <g clipPath="url(#da-wash-clip)">{cols}</g>
    </g>
  );
};

/** A dashed ink line ("dashed = expected") drawn head-first to arc `len`, dashes
 *  marching toward the head (copied from chinatalkShared's DashedPath, with this
 *  cut's heavier width and longer dash / gap). */
const Dashed: React.FC<{ points: Pt[]; cum: number[]; k: number; S: number; len: number; rung: number }> = ({ points, cum, k, S, len, rung }) => {
  if (len <= 0.05 || rung <= 0.002) return null;
  const s = sz(k);
  const P = (DASH_ON + DASH_OFF) * s;
  const D = DASH_ON * s;
  const phase = (MARCH_W * S) / (DASH_ON + DASH_OFF);
  const i0 = Math.floor(-phase - 1);
  const i1 = Math.ceil(len / P - phase + 1);
  const parts: string[] = [];
  for (let i = i0; i <= i1; i++) {
    const a = Math.max(0, (i + phase) * P);
    const b = Math.min(len, (i + phase) * P + D);
    if (b - a > 0.05) parts.push(subPathD(points, cum, a, b));
  }
  return (
    <path d={parts.join("")} opacity={rung.toFixed(4)} fill="none" stroke={INK} strokeWidth={(DASHED_W * s).toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
  );
};

/** One travelling highlight (RED_HI) along the drawn red line, centred at arc s. */
const Highlight: React.FC<{ s: number; L: number; k: number; amp: number }> = ({ s, L, k, amp }) => {
  if (amp <= 0.002) return null;
  const w = RED_W * sz(k);
  const segs: React.ReactNode[] = [];
  const step = 10;
  for (let a = s - HI_HALF; a < s + HI_HALF; a += step) {
    const a0 = Math.max(0, a);
    const a1 = Math.min(L, a + step + 0.6);
    if (a1 - a0 <= 0.3) continue;
    const mid = (a0 + a1) / 2;
    const o = amp * Math.pow(Math.cos(((mid - s) / HI_HALF) * (Math.PI / 2)), 2);
    if (o <= 0.01) continue;
    segs.push(
      <path key={a.toFixed(1)} d={subPathD(RED_PTS, RED_CUM, a0, a1)} fill="none" stroke={RED_HI} strokeOpacity={o.toFixed(4)} strokeWidth={w.toFixed(3)} strokeLinecap="butt" />,
    );
  }
  return <g>{segs}</g>;
};

const DeliberateAttempt: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;

  // -- the seals ---------------------------------------------------------------
  const soak = clamp01((S - SOAK_F0) / SOAK_F);
  const slide = easeInOutCubic((S - SLIDE_F0) / (SLIDE_F1 - SLIDE_F0));
  const seal1X = lerp(-SEAL_GAP, X0, slide);
  const seal1Side = lerp(SEAL_SIDE, SEAL_MARK * sz(k), slide);
  const diffuseU = clamp01((S - DIFFUSE_F0) / DIFFUSE_F);

  // -- the hairline (level / time axis) ---------------------------------------
  const hairR = lerp(-SEAL_GAP, HAIR_X1, smoothstep((S - HAIR_F0) / (HAIR_F1 - HAIR_F0)));
  const hairOn = S >= HAIR_F0;

  // -- the tips ------------------------------------------------------------------
  const pD = pDR(S);
  const pS = pSolid(S);
  const Ldash = lenAtP(DASH_CUM, pD);
  const Lred = lenAtP(RED_CUM, pD);
  const Lsolid = lenAtP(SOLID_CUM, pS);
  const ageRed = (s: number) => S - frameAtP(pDR, pAtLen(RED_CUM, s), TIP_F0);
  const ageSolid = (s: number) => S - frameAtP(pSolid, pAtLen(SOLID_CUM, s), SOLID_F0);
  const dashRung = INK_HI;
  const dashTip: Pt = { x: xAt(pD), y: yDash(pD) };
  const solidTip: Pt = { x: xAt(pS), y: ySolid(pS) };

  // -- the highlight ------------------------------------------------------------
  const hiU = (S - HI_F0) / (HI_F1 - HI_F0);
  const hiS = evenEase(hiU, 0.2) * Lred;
  const hiAmp = S < HI_F0 ? 0 : smoothstep(hiU / 0.12);

  return (
    <Stage S={S} cam={cam} rest={REST}>
      {/* the level: the economy's normal, and the time axis */}
      {hairOn ? (
        <InkPath
          points={[
            { x: seal1X, y: 0 },
            { x: hairR, y: 0 },
          ]}
          k={k}
          rung={INK_LO}
          width={INK_W * 0.62}
        />
      ) : null}

      {/* credit's wash, down to the level */}
      <CreditWash p={pD} settled={false} />

      {/* expected without help: the dashed plunge */}
      {pD > 0.0005 ? (
        <>
          <Dashed points={DASH_PTS} cum={DASH_CUM} k={k} S={S} len={Ldash} rung={dashRung} />
          <Bead id="da-dash-bead" x={dashTip.x} y={dashTip.y} r={inkBeadR(DASHED_W) * sz(k)} color={INK} opacity={dashRung / INK_HI} />
        </>
      ) : null}

      {/* credit: written in the opposite phase */}
      {pD > 0.0005 ? <WetLine id="da-red" points={RED_PTS} len={Lred} k={k} ageAt={ageRed} bead={1} width={RED_W} /> : null}
      <Highlight s={hiS} L={Lred} k={k} amp={hiAmp} />

      {/* what actually happened: the sum */}
      {pS > 0.0005 ? (
        <>
          <WetLine id="da-solid" points={SOLID_PTS} len={Lsolid} k={k} ageAt={ageSolid} ink width={SOLID_W} />
          <Bead id="da-solid-bead" x={solidTip.x} y={solidTip.y} r={inkBeadR(SOLID_W) * sz(k)} color={INK} />
        </>
      ) : null}

      {/* seals 2 and 3: written, then diffusing away */}
      {[1, 2].map((i) => (
        <InkDiffuse key={i} u={diffuseU} k={k} cx={(i - 1) * SEAL_GAP + 0} cy={0}>
          <SealSquare id={`da-seal${i}`} cx={(i - 1) * SEAL_GAP} cy={0} side={SEAL_SIDE} k={k} draw={(S - SEAL_WRITE[i]) / SEAL_WRITE_F} soak={0} />
        </InkDiffuse>
      ))}
      {/* seal 1: written, soaks red on "first", slides to the start of the red line */}
      <SealSquare id="da-seal0" cx={seal1X} cy={0} side={seal1Side} k={k} draw={(S - SEAL_WRITE[0]) / SEAL_WRITE_F} soak={soak} />

      {/* labels */}
      <Label text="credit" x={CREDIT_AT.x} y={CREDIT_AT.y} k={k} size="word" anchor="end" appear={enterU(S, CREDIT_S)} minPx={WORD_MIN} />
      <Seal x={P_TROUGH_PT.x} y={P_TROUGH_PT.y} k={k} r={DOT_R * 0.9} color={INK} opacity={INK_HI} grow={(S - TICK_F0) / 12} />
      <Label text="2008" x={P_TROUGH_PT.x} y={P_TROUGH_PT.y + 72} k={k} size="value" appear={enterU(S, YEAR_S)} minPx={VALUE_MIN} />
      <Label text="crisis" x={P_TROUGH_PT.x} y={P_TROUGH_PT.y + 140} k={k} size="word" appear={enterU(S, CRISIS_S)} minPx={WORD_MIN} />
    </Stage>
  );
};

export default DeliberateAttempt;

/** World positions of the three tips and the highlight at S (for the speed audit). */
export const tipsAt = (S: number) => {
  const pD = pDR(S);
  const pS = pSolid(S);
  const hiS = evenEase((S - HI_F0) / (HI_F1 - HI_F0), 0.2) * lenAtP(RED_CUM, pD);
  const hi = subPathD(RED_PTS, RED_CUM, hiS, hiS + 0.01).split("L")[1]?.split(" ").map(Number) ?? [0, 0];
  return {
    dash: { x: xAt(pD), y: yDash(pD) },
    red: { x: xAt(pD), y: yRed(pD) },
    solid: { x: xAt(pS), y: ySolid(pS) },
    hi: { x: hi[0], y: hi[1] },
  };
};
