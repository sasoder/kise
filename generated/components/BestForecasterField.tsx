import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

export const FPS = 24;
// Kalshi, "monitoring the situation" — 00:00:23,160 -> 00:00:34,100, plus the
// same 12-frame tail as the Cheeky Pint version. round(10.94 * 24) + 12 = 275.
export const DURATION = 275;

// ---------------------------------------------------------------------------
// The same line, in the Dwarkesh grid language.
//
// Cheeky Pint asked what each thing stands on. This asks where in the field
// the one who understands is. So there is no floor and nothing stands: there
// is a field of forecasters — ink dots in an organic crowd, because ink is the
// human — with two dense clusters in it, the institutions and the hedge funds,
// and one dot out at the edge on its own.
//
// "Over the last few years" is a scan reading the whole field top to bottom.
// "None of the institutions / hedge funds" rings each cluster and lets it go.
// "It's this guy" is a search bar that leaves the clusters and stops on the
// lone dot, which goes accent, because accent is comprehension. "Kansas" is
// the pull-back that shows the distance. "Never traded financial markets" is
// the trade web lighting up between the clusters and never reaching him.
// "Reads the news" is threads arriving to him from outside the field, each
// one brightening him from the thread, never from a timer.
// ---------------------------------------------------------------------------
const WORLD_W = 1080;
const WORLD_H = 2600;

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ez = (e: (t: number) => number, t: number) => e(clamp01(t));
const LAND = Easing.out(Easing.back(1.6));
const RISE = Easing.out(Easing.cubic);
const GLIDE = Easing.inOut(Easing.cubic);

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

type P = { x: number; y: number };

// -- the field ---------------------------------------------------------------
const COLS = 26;
const ROWS = 22;
const FIELD_CX = 540;
const FIELD_W = 880;
const FIELD_TOP = 1020;
const FIELD_H = 760;
const STEP_X = FIELD_W / (COLS - 1);
const STEP_Y = FIELD_H / (ROWS - 1);

// -- the clusters --------------------------------------------------------------
// Two dense regions inside the field. Institutions: broad. Hedge funds:
// tighter and taller. Each is a count of extra dots packed into an ellipse,
// so the mass is real, not a decoration.
const A = { x: 330, y: 1330, rx: 150, ry: 115, n: 120, ring: { rx: 182, ry: 146 } };
const B = { x: 640, y: 1470, rx: 105, ry: 140, n: 85, ring: { rx: 138, ry: 172 } };

// -- him -----------------------------------------------------------------------
const GUY: P = { x: 968, y: 1500 };
const GUY_CLEAR = 72; // nobody else within this of him
const GUY_R = 1.35;
const GUY_RING_R = 34;

type Dot = { x: number; y: number; r: number; cluster: 0 | 1 | 2 };

const inEllipse = (p: P, e: { x: number; y: number; rx: number; ry: number }) =>
  ((p.x - e.x) / e.rx) ** 2 + ((p.y - e.y) / e.ry) ** 2 <= 1;

const FIELD: Dot[] = [];
for (let i = 0; i < COLS * ROWS; i++) {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  const p = {
    x: FIELD_CX + (c - (COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9,
    y: FIELD_TOP + r * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9,
  };
  if (Math.hypot(p.x - GUY.x, p.y - GUY.y) < GUY_CLEAR) continue;
  // The sparse field thins out a little where the clusters are, so the dense
  // set below reads as two masses rather than a haze on top of a haze.
  if ((inEllipse(p, A) || inEllipse(p, B)) && hash(i, 14) < 0.4) continue;
  FIELD.push({ ...p, r: 0.75 + 0.5 * hash(i, 13), cluster: 0 });
}
const packed = (e: { x: number; y: number; rx: number; ry: number; n: number }, seed: number, cluster: 1 | 2): Dot[] =>
  Array.from({ length: e.n }, (_, i) => {
    const a = hash(seed + i, 21) * Math.PI * 2;
    const d = Math.sqrt(hash(seed + i, 22));
    return { x: e.x + Math.cos(a) * d * e.rx, y: e.y + Math.sin(a) * d * e.ry, r: 0.8 + 0.4 * hash(seed + i, 23), cluster };
  });
const DOTS: Dot[] = [...FIELD, ...packed(A, 5000, 1), ...packed(B, 6000, 2)];
const CLUSTER_DOTS = DOTS.map((d, i) => i).filter((i) => DOTS[i].cluster > 0);

// -- ambient threads: the board, people pricing things at each other -----------
// Each thread joins two dots that sit near each other. They draw, hold and
// fade on staggered cycles for the whole piece, at the ambient ceiling.
const AMBIENT_N = 42;
const AMBIENT_CYCLE = 64;
const AMBIENT: { a: number; b: number; phase: number }[] = [];
{
  let tries = 0;
  while (AMBIENT.length < AMBIENT_N && tries < 4000) {
    tries++;
    const a = Math.floor(hash(tries, 31) * DOTS.length);
    const b = Math.floor(hash(tries, 32) * DOTS.length);
    if (a === b) continue;
    const d = Math.hypot(DOTS[a].x - DOTS[b].x, DOTS[a].y - DOTS[b].y);
    if (d < 40 || d > 120) continue;
    AMBIENT.push({ a, b, phase: Math.floor(hash(tries, 33) * AMBIENT_CYCLE) });
  }
}

// -- the trade web: threads inside and between the two clusters ----------------
const WEB_N = 44;
const WEB: { a: number; b: number; at: number }[] = [];
{
  let tries = 0;
  while (WEB.length < WEB_N && tries < 6000) {
    tries++;
    const a = CLUSTER_DOTS[Math.floor(hash(tries, 41) * CLUSTER_DOTS.length)];
    const b = CLUSTER_DOTS[Math.floor(hash(tries, 42) * CLUSTER_DOTS.length)];
    if (a === b) continue;
    const d = Math.hypot(DOTS[a].x - DOTS[b].x, DOTS[a].y - DOTS[b].y);
    if (d < 50 || d > 420) continue;
    WEB.push({ a, b, at: Math.floor(hash(tries, 43) * 26) });
  }
}

// -- the news: threads from outside the field to him -----------------------------
const NEWS: P[] = [
  { x: 1190, y: 1250 },
  { x: 1240, y: 1560 },
  { x: 1150, y: 1830 },
  { x: 1080, y: 1130 },
  { x: 1260, y: 1420 },
];
const NEWS_EVERY = 5;
const NEWS_DRAW = 8;

// The Kalshi wordmark is the venue the field lives in: above it, ink, the way
// the OpenAI mark is the origin in the agent scenes.
const MARK = staticFile("kalshi-wordmark.svg");
const MARK_RATIO = 226 / 772;
const MARK_W = 300;
const MARK_Y = 880;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  dotRadius: z.number(),
  ambientOpacity: z.number(),
  // Beat frames lifted from the SRT at 24fps, f0 = 00:00:23,160:
  //   0 "the best"  10 "inflation forecaster"  24 "on kalshi"
  //   36 "over the last few"  48 "years is"  72 "not none of the"
  //   94 "institutions"  105 "or the big"  127 "name hedge"  137 "funds"
  //   143 "it's this"  162 "guy who"  170 "lives in"  176 "kansas never"
  //   201 "traded"  206 "financial"  213 "markets before"  235 "just likes"
  //   246 "to read"  252 "the news"  263 end (+12 tail)
  beats: z.object({
    kalshi: z.number().int(),
    years: z.number().int(),
    none: z.number().int(),
    institutions: z.number().int(),
    or: z.number().int(),
    hedge: z.number().int(),
    guy: z.number().int(),
    kansas: z.number().int(),
    traded: z.number().int(),
    markets: z.number().int(),
    likes: z.number().int(),
    news: z.number().int(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#48D9FF",
  backgroundBase: "#232323",
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: 0.32,
  parallax: 0.15,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  dotRadius: 7,
  ambientOpacity: 0.4,
  beats: {
    kalshi: 24,
    years: 36,
    none: 72,
    institutions: 94,
    or: 105,
    hedge: 127,
    guy: 143,
    kansas: 176,
    traded: 201,
    markets: 213,
    likes: 235,
    news: 252,
  },
});

type Beats = Props["beats"];

// ---------------------------------------------------------------------------
// Camera — the Dwarkesh hand, leading each beat by about ten frames. Open on
// the whole field; push onto the two clusters for the reads; track onto him
// as the search stops; one pull-back from "Kansas" that holds to the cut.
// cy is a function of the zoom so the content centre sits at screen y 835.
// ---------------------------------------------------------------------------
const CONTENT_CY = 1330;
const camF = (b: Beats) => [0, b.none - 12, b.none, b.guy - 10, b.guy + 2, b.kansas - 8, b.kansas + 18, DURATION];
// Zooms are kept modest so the wordmark stays in shot on every hold instead
// of being cut off at the frame's top-left while the camera is on him.
const CAM_K = [1.05, 1.05, 1.25, 1.25, 1.3, 1.3, 0.92, 0.92];
const CAM_CX = [540, 540, 480, 480, 790, 790, 600, 600];
const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468;
const cyOf = (k: number) => CONTENT_CY + 125 / k;

const camera = (upto: number, F: number[]) => {
  let k = CAM_K[0];
  let cx = CAM_CX[0];
  let cy = cyOf(k);
  let vk = 0;
  let vx = 0;
  let vy = 0;
  for (let f = 1; f <= upto; f++) {
    const tk = interpolate(f, F, CAM_K, clamp);
    const tx = interpolate(f, F, CAM_CX, clamp);
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (cyOf(tk) - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
  }
  return { k, cx, cy };
};

const BG_OVERSIZE = 1.8;

const BestForecasterField: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  dotRadius,
  ambientOpacity,
  beats: b,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const F = React.useMemo(() => camF(b), [b]);
  const { k, cx, cy } = React.useMemo(() => camera(frame, F), [frame, F]);
  const tx = 540 - cx * k;
  const ty = 960 - cy * k;
  const bgY = -(cy - cyOf(CAM_K[0])) * k * parallax - frame * 0.25;
  const bgScale = 1 + (k - 1) * 0.3;

  // -- the scan: one pass down the field for the years ----------------------------
  const scanT = ez(GLIDE, (frame - b.years) / (b.none - b.years));
  const scanY = FIELD_TOP - 50 + (FIELD_H + 100) * scanT;
  const scanOn = frame >= b.years && frame < b.none;

  // -- the search: leaves the hedge funds and stops on him ----------------------
  const searchT = ez(GLIDE, (frame - b.guy) / 9);
  const searchX = B.x + (GUY.x - B.x) * searchT;
  const searchOn = frame >= b.guy && frame < b.guy + 9;
  const foundAt = b.guy + 9;
  const found = frame - foundAt;

  // -- rings ----------------------------------------------------------------------
  const ringIn = (at: number) => ez(LAND, (frame - at) / 10);
  const leaveA = ez(GLIDE, (frame - b.or) / 10);
  const leaveB = ez(GLIDE, (frame - b.guy) / 10);
  const ringA = ringIn(b.institutions - 4) * (1 - leaveA);
  const ringB = ringIn(b.hedge - 4) * (1 - leaveB);
  const ringG = ringIn(foundAt + 3);
  const readA = ez(RISE, (frame - (b.institutions - 6)) / 8) * (1 - leaveA);
  const readB = ez(RISE, (frame - (b.hedge - 6)) / 8) * (1 - leaveB);
  const recedeA = leaveA;
  const recedeB = leaveB;

  // -- the news, and how bright he is ------------------------------------------------
  const newsArrivals = NEWS.map((_, i) => b.likes + i * NEWS_EVERY + NEWS_DRAW);
  const lastNews = newsArrivals.reduce((acc, at) => (frame >= at && at > acc ? at : acc), -999);
  const newsClick = lastNews > 0 && frame - lastNews < 3;
  const guyLit = ez(RISE, (found + 2) / 6);
  const guyFlash = (found >= 0 && found < 4) || newsClick;
  const ringPulse = lastNews > 0 ? 1 + 0.16 * (1 - ez(RISE, (frame - lastNews) / 8)) : 1;

  // -- the mark ----------------------------------------------------------------------
  const markIn = spring({ frame: frame - b.kalshi, fps, config: { damping: 15, stiffness: 180, mass: 0.7 } });

  // -- dot state, derived from the visible things: the scan, the rings, the search ----
  const unknown = 0.2;
  const readFloor = 0.34; // what the scan leaves behind
  const dotState = (d: Dot) => {
    // The scan reads a dot as it passes, and the field stays a little brighter
    // behind it: read, not unknown.
    const passed = frame >= b.none || (scanOn && scanY > d.y);
    let o = passed ? readFloor : unknown;
    if (scanOn) o += 0.7 * Math.exp(-(((d.y - scanY) / 26) ** 2));
    if (searchOn) o += 0.6 * Math.exp(-(((d.x - searchX) / 30) ** 2));
    if (d.cluster === 1) o = Math.max(o, readFloor + (0.9 - readFloor) * readA) - 0.12 * recedeA;
    if (d.cluster === 2) o = Math.max(o, readFloor + (0.9 - readFloor) * readB) - 0.12 * recedeB;
    return clamp01(o);
  };

  // Open on the field already alive: no fade-in, the scan is the first move.
  const floorDim = 1;

  // Threads: a line drawing with a white head, then holding, then fading.
  const threadGeom = (p: P, q: P, t: number) => ({
    x2: p.x + (q.x - p.x) * t,
    y2: p.y + (q.y - p.y) * t,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: WORLD_W * BG_OVERSIZE,
            height: 1920 * BG_OVERSIZE,
            objectFit: "cover",
            transform: `translate(-50%, -50%) translateY(${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)})`,
            filter: `blur(${backgroundBlur}px) brightness(${backgroundDim})`,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {/* Ambient threads: the board, always running, under the ceiling. */}
            {AMBIENT.map((t, i) => {
              const c = (frame + t.phase) % AMBIENT_CYCLE;
              const drawn = ez(RISE, c / 10);
              const op = c < 10 ? drawn : c < 38 ? 1 : 1 - ez(GLIDE, (c - 38) / 12);
              if (op <= 0) return null;
              const p = DOTS[t.a];
              const q = DOTS[t.b];
              const g = threadGeom(p, q, drawn);
              return (
                <g key={`amb-${i}`} opacity={ambientOpacity * op * floorDim}>
                  <line x1={p.x} y1={p.y} x2={g.x2} y2={g.y2} stroke={accent} strokeWidth={2.5} strokeLinecap="round" />
                  {drawn < 1 ? <circle cx={g.x2} cy={g.y2} r={3.5} fill={ink} /> : null}
                </g>
              );
            })}

            {/* The trade web between the clusters, for "financial markets". */}
            {WEB.map((t, i) => {
              const age = frame - (b.traded + 2 + t.at);
              if (age < 0) return null;
              const drawn = ez(RISE, age / 6);
              const op = age < 6 ? drawn : age < 16 ? 1 : 1 - ez(GLIDE, (age - 16) / 12);
              if (op <= 0) return null;
              const p = DOTS[t.a];
              const q = DOTS[t.b];
              const g = threadGeom(p, q, drawn);
              return (
                <g key={`web-${i}`} opacity={0.75 * op}>
                  <line x1={p.x} y1={p.y} x2={g.x2} y2={g.y2} stroke={accent} strokeWidth={3} strokeLinecap="round" />
                  {drawn < 1 ? <circle cx={g.x2} cy={g.y2} r={4} fill={ink} /> : null}
                </g>
              );
            })}

            {/* The field. */}
            {DOTS.map((d, i) => (
              <circle key={`d-${i}`} cx={d.x} cy={d.y} r={dotRadius * d.r} fill={ink} opacity={dotState(d) * floorDim} />
            ))}

            {/* The scan. */}
            {scanOn ? (
              <rect x={FIELD_CX - FIELD_W / 2 - 50} y={scanY - 2.5} width={FIELD_W + 100} height={5} rx={2.5} fill={ink} opacity={0.85} />
            ) : null}
            {/* The search. */}
            {searchOn ? (
              <rect x={searchX - 2.5} y={FIELD_TOP - 50} width={5} height={FIELD_H + 100} rx={2.5} fill={ink} opacity={0.85 * (1 - 0.5 * searchT)} />
            ) : null}

            {/* Rings. */}
            {ringA > 0 ? (
              <ellipse cx={A.x} cy={A.y} rx={A.ring.rx * (1.3 - 0.3 * ringA)} ry={A.ring.ry * (1.3 - 0.3 * ringA)} fill="none" stroke={ink} strokeWidth={4} opacity={0.9 * clamp01(ringA * 1.5)} />
            ) : null}
            {ringB > 0 ? (
              <ellipse cx={B.x} cy={B.y} rx={B.ring.rx * (1.3 - 0.3 * ringB)} ry={B.ring.ry * (1.3 - 0.3 * ringB)} fill="none" stroke={ink} strokeWidth={4} opacity={0.9 * clamp01(ringB * 1.5)} />
            ) : null}

            {/* The news arriving. */}
            {NEWS.map((src, i) => {
              const t0 = b.likes + i * NEWS_EVERY;
              if (frame < t0) return null;
              const drawn = ez(RISE, (frame - t0) / NEWS_DRAW);
              const g = threadGeom(src, GUY, drawn);
              return (
                <g key={`news-${i}`} opacity={0.85}>
                  <line x1={src.x} y1={src.y} x2={g.x2} y2={g.y2} stroke={accent} strokeWidth={3.5} strokeLinecap="round" />
                  {drawn < 1 ? <circle cx={g.x2} cy={g.y2} r={5} fill={ink} /> : null}
                </g>
              );
            })}

            {/* Him. */}
            <circle
              cx={GUY.x}
              cy={GUY.y}
              r={dotRadius * GUY_R * (1 + 0.25 * guyLit)}
              fill={guyFlash ? ink : guyLit > 0 ? accent : ink}
              opacity={(readFloor + (1 - readFloor) * guyLit) * floorDim}
            />
            {ringG > 0 ? (
              <circle cx={GUY.x} cy={GUY.y} r={GUY_RING_R * (1.3 - 0.3 * ringG) * ringPulse} fill="none" stroke={accent} strokeWidth={4} opacity={clamp01(ringG * 1.5)} />
            ) : null}
          </svg>

          {/* The mark. */}
          <Img
            src={MARK}
            style={{
              position: "absolute",
              left: FIELD_CX - MARK_W / 2,
              top: MARK_Y - (MARK_W * MARK_RATIO) / 2,
              width: MARK_W,
              height: MARK_W * MARK_RATIO,
              transformOrigin: "50% 50%",
              transform: `scale(${markIn})`,
              opacity: clamp01((frame - b.kalshi) / 5),
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default BestForecasterField;
