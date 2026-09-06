import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";

export const FPS = 24;
// Dwarkesh, "all of this happened while humans remained more or less in the
// dark about the scope of the conspiracy." SRT 13.000s -> 17.899s.
// round(4.899 * 24) = 118 frames, plus a 16 frame tail so the last pull-back
// settles before the hold. Trim the tail if a graphic lands on the next line.
export const DURATION = 134;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  humanSrc: z.string(),
  humanSize: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  lineWidth: z.number(),
  threadWidth: z.number(),
  tipRadius: z.number(),
  inkContext: z.number(),
  inkMark: z.number(),
  liveOpacity: z.number(),
  readOpacity: z.number(),
  darkLevel: z.number(),
  revealLevel: z.number(),
  threadBase: z.number(),
  threadDensity: z.number(),
  driftScale: z.number(),
  beats: z.object({
    rule: z.number(), // the boundary humans stand on draws
    arrive: z.number(), // "happened while" — the human rises out of it
    bracket: z.number(), // the box they looked through is drawn
    scanStart: z.number(), // the sweep that reads the ones inside it
    scanEnd: z.number(),
    more: z.number(), // "more" — first pull-back, and the dark starts falling
    dark: z.number(), // "the dark" — everything unlooked-at is gone
    scope: z.number(), // "scope of the" — the long pull, and the wave out
    conspiracy: z.number(), // "conspiracy" — every thread posts at once
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
  humanSrc: "person.png",
  humanSize: 100,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  // Two stroke weights and two ink values, and nothing else. Structure that is
  // only context sits at 0.45; a mark a human actively made sits at 0.85; the
  // tip on the end of anything being drawn is full white. Before this there
  // were four different ink values doing three different jobs.
  lineWidth: 5,
  threadWidth: 3,
  tipRadius: 7,
  inkContext: 0.45,
  inkMark: 0.85,
  liveOpacity: 0.72,
  readOpacity: 0.95,
  darkLevel: 0.16,
  revealLevel: 0.8,
  threadBase: 0.42,
  threadDensity: 0.5,
  driftScale: 1,
  beats: {
    rule: 6,
    arrive: 12,
    bracket: 30,
    scanStart: 38,
    scanEnd: 52,
    more: 48,
    dark: 70,
    scope: 84,
    conspiracy: 101,
  },
});

type P = { x: number; y: number };

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const WORLD_W = 1080;
const WORLD_H = 3400;
const BG_OVERSIZE = 1.8;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// The field
//
// One crowd, off an infinite jittered lattice, cut to an ellipse with a ragged
// edge so it has neither straight sides nor a lattice to read. Every agent is a
// pure function of its cell, which is what lets the camera travel five stops
// through it without anything popping, and lets only the visible cells ever be
// built.
// ---------------------------------------------------------------------------
const STEP = 88;
const DOT_R = 10;
const DOT_R_MAX = DOT_R * 1.25;
const BLOB = { cx: 540, cy: 1980, w: 2200, h: 2100 };
const I_MIN = Math.floor((BLOB.cx - BLOB.w / 2) / STEP) - 1;
const I_MAX = Math.ceil((BLOB.cx + BLOB.w / 2) / STEP) + 1;
const J_MIN = Math.floor((BLOB.cy - BLOB.h / 2) / STEP) - 1;
const J_MAX = Math.ceil((BLOB.cy + BLOB.h / 2) / STEP) + 1;

const RULE_Y = 900;
const RULE_HALF = 1500;
const BOX = { x0: 392, x1: 688, y0: 1042, y1: 1258 };
const BOX_C = { x: (BOX.x0 + BOX.x1) / 2, y: (BOX.y0 + BOX.y1) / 2 };
const HUMAN_FOOT = RULE_Y + 8;
const RISE_HEADROOM = 34; // room above the glyph so its overshoot never clips

// ---------------------------------------------------------------------------
// The motion system
//
// Every agent in the field is always moving, on its own slow ellipse with its
// own period and phase taken off the same hash. This is the only reason the
// piece has life during the three camera holds — and because all of it comes
// out of one set of constants, the crowd reads as one substance rather than as
// a lot of separately animated dots. Threads inherit it for free: they hang
// between two drifting endpoints, so the whole web moves without a single line
// being animated directly.
// ---------------------------------------------------------------------------
const driftAmp = (s: number) => 7 + 9 * hash(s, 9);
const driftRate = (s: number) => 0.016 + 0.014 * hash(s, 10);
const driftOf = (s: number, frame: number, scale: number): P => {
  const a = driftAmp(s) * scale;
  const w = driftRate(s);
  const ph = hash(s, 11) * TAU;
  return {
    x: a * Math.sin(frame * w + ph),
    y: a * 0.68 * Math.cos(frame * w * 0.83 + ph * 1.7),
  };
};

// How far an agent can ever get from where it rests. Used to keep the box
// honest: no dot may ever straddle its edge, at any frame.
const envelopeOf = (s: number) => {
  const a = driftAmp(s);
  return { x: DOT_R_MAX + a + 9, y: DOT_R_MAX + a * 0.68 + 9 };
};

const rawAgent = (i: number, j: number) => {
  const s = i * 73 + j * 31;
  return {
    s,
    x: i * STEP + (hash(s, 1) - 0.5) * STEP,
    y: j * STEP + (hash(s, 2) - 0.5) * STEP,
    rr: 0.75 + 0.5 * hash(s, 3),
  };
};

// The box is a statement about a specific set of agents, so no agent is allowed
// to sit half in it. Whichever side of the edge an agent's rest position falls
// on, it is settled far enough onto that side that its whole drift envelope
// stays there. A handful of dots move up to ~40px from where the lattice put
// them, which is invisible in a jittered crowd, and is the difference between a
// box that means something and a box with a dot lying across its edge.
const settle = <T extends { s: number; x: number; y: number }>(p: T): T => {
  const e = envelopeOf(p.s);
  const inside = p.x > BOX.x0 && p.x < BOX.x1 && p.y > BOX.y0 && p.y < BOX.y1;
  if (inside) {
    return {
      ...p,
      x: Math.min(Math.max(p.x, BOX.x0 + e.x), BOX.x1 - e.x),
      y: Math.min(Math.max(p.y, BOX.y0 + e.y), BOX.y1 - e.y),
    };
  }
  const ox = Math.min(p.x + e.x - BOX.x0, BOX.x1 - (p.x - e.x));
  const oy = Math.min(p.y + e.y - BOX.y0, BOX.y1 - (p.y - e.y));
  if (ox <= 0 || oy <= 0) return p;
  const nudge = 3 + 7 * hash(p.s, 12);
  if (ox < oy) {
    return { ...p, x: p.x < BOX_C.x ? BOX.x0 - e.x - nudge : BOX.x1 + e.x + nudge };
  }
  return { ...p, y: p.y < BOX_C.y ? BOX.y0 - e.y - nudge : BOX.y1 + e.y + nudge };
};

const agentAt = (i: number, j: number) => settle(rawAgent(i, j));

const inField = (p: { x: number; y: number; s: number }) => {
  if (p.y < 960) return false; // never above the boundary the humans stand on
  const dx = (p.x - BLOB.cx) / (BLOB.w / 2);
  const dy = (p.y - BLOB.cy) / (BLOB.h / 2);
  return dx * dx + dy * dy <= 1 + (hash(p.s, 4) - 0.5) * 0.34;
};

const inBox = (p: P) => p.x > BOX.x0 && p.x < BOX.x1 && p.y > BOX.y0 && p.y < BOX.y1;

// ---------------------------------------------------------------------------
// Camera
//
// A shot is an anchor (the world point that sits in the caption-safe band) and
// a zoom. One damped progress walks the shot list, zoom is interpolated in log
// space so a constant rate there is a constant rate on screen, and the centre
// is not authored at all — for any two framings there is exactly one world
// point that lands on the same pixel in both, so that point is held still and
// only the scale changes. Every transition is a pure zoom with no pan in it.
//
// On top of that, a slow monotonic push that never stops. It is 0.045% a frame
// — far too small to read as a move, and the reason none of the three holds is
// ever a frozen frame.
// ---------------------------------------------------------------------------
type Shot = { anchor: number; k: number };
const SHOTS: Shot[] = [
  { anchor: 1020, k: 2.0 }, // the group, the human, and the box they drew
  { anchor: 1150, k: 1.05 }, // and how much of it nobody looked at
  { anchor: 1910, k: 0.4 }, // all of it
];
const SHOT_CY = SHOTS.map((s) => s.anchor + 125 / s.k);

const PIVOTS = SHOTS.slice(0, -1).map((_, i) => {
  const ka = SHOTS[i].k;
  const kb = SHOTS[i + 1].k;
  const ca = SHOT_CY[i];
  const cb = SHOT_CY[i + 1];
  if (Math.abs(ka - kb) < 1e-6) return null;
  const w = (ca * ka - cb * kb) / (ka - kb);
  return { w, sy: (w - ca) * ka + 960 };
});

const CAM_F = [0, 46, 64, 84, 100, 112, DURATION];
const CAM_P = [0, 0, 1, 1, 1.45, 2, 2];
const CAM_CREEP = 0.00045;

const CAM_STIFF = 0.13;
const CAM_DAMP = 0.56;

const camera = (upto: number) => {
  let p = CAM_P[0];
  let v = 0;
  for (let f = 1; f <= upto; f++) {
    const tp = interpolate(f, CAM_F, CAM_P, clamp);
    v += (tp - p) * CAM_STIFF - v * CAM_DAMP;
    p += v;
  }
  const i = Math.max(0, Math.min(SHOTS.length - 2, Math.floor(p)));
  const t = Math.max(0, Math.min(1, p - i));
  const k =
    Math.exp(Math.log(SHOTS[i].k) + (Math.log(SHOTS[i + 1].k) - Math.log(SHOTS[i].k)) * t) *
    (1 + CAM_CREEP * upto);
  const pv = PIVOTS[i];
  const cy = pv ? pv.w - (pv.sy - 960) / k : SHOT_CY[i] + (SHOT_CY[i + 1] - SHOT_CY[i]) * t;
  return { cy, k };
};

// A thread is a post: it draws from one agent to another with a white head on
// the tip, holds, then fades. Cross-fading them in and out was cheaper and read
// as blinking rather than as traffic.
const DRAW_END = 0.12;
const HOLD_END = 0.34;
const FADE_END = 0.46;
const THREAD_RATE = 0.013;

const DarkAboutTheScope: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  humanSrc,
  humanSize,
  shadowY,
  shadowBlur,
  shadowOpacity,
  lineWidth,
  threadWidth,
  tipRadius,
  inkContext,
  inkMark,
  liveOpacity,
  readOpacity,
  darkLevel,
  revealLevel,
  threadBase,
  threadDensity,
  driftScale,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { cy, k } = camera(frame);
  const tx = 540 - 540 * k;
  const ty = 960 - cy * k;
  const bgY = -(cy - SHOT_CY[0]) * k * parallax - frame * 0.25;
  const bgScale = 1 + (k - 1) * 0.3;

  // Eased at both ends rather than cut on and off. The read state is taken from
  // the bar's position, not from a clock, so shaping its travel costs nothing.
  const scanY = interpolate(frame, [beats.scanStart, beats.scanEnd], [BOX.y0 - 24, BOX.y1 + 24], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  const scanFade = interpolate(
    frame,
    [beats.scanStart - 3, beats.scanStart, beats.scanEnd, beats.scanEnd + 7],
    [0, 1, 1, 0],
    clamp,
  );

  const dkT = interpolate(frame, [beats.more + 4, beats.dark], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const waveR = interpolate(frame, [beats.scope, beats.scope + 34], [0, 2400], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  const surge = interpolate(frame, [beats.conspiracy, beats.conspiracy + 12], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  const vis = (x: number, y: number) => {
    const rv = interpolate(waveR - Math.hypot(x - BOX_C.x, y - BOX_C.y), [0, 170], [0, 1], clamp);
    let v = 1 + (darkLevel - 1) * dkT;
    v += (revealLevel - v) * rv;
    return v;
  };

  const halfW = 540 / k;
  const halfH = 960 / k;
  const i0 = Math.max(I_MIN, Math.floor((540 - halfW) / STEP) - 1);
  const i1 = Math.min(I_MAX, Math.ceil((540 + halfW) / STEP) + 1);
  const j0 = Math.max(J_MIN, Math.floor((cy - halfH) / STEP) - 1);
  const j1 = Math.min(J_MAX, Math.ceil((cy + halfH) / STEP) + 1);

  type Agent = { s: number; x: number; y: number; r: number; op: number };
  const agents: Agent[] = [];
  const posts: { key: string; a: P; b: P; op: number; head: P | null }[] = [];

  const liveAt = (i: number, j: number) => {
    const p = agentAt(i, j);
    if (!inField(p)) return null;
    const d = driftOf(p.s, frame, driftScale);
    return { ...p, lx: p.x + d.x, ly: p.y + d.y };
  };

  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const p = liveAt(i, j);
      if (!p) continue;

      const sampled = inBox(p);
      const read = sampled ? interpolate(scanY - p.y, [0, 5], [0, 1], clamp) : 0;
      const flash = sampled ? interpolate(scanY - p.y, [0, 5, 34], [0, 1, 0], clamp) : 0;
      const base = liveOpacity + (readOpacity - liveOpacity) * read;
      // Radius breathes on the agent's own drift clock, so size and position
      // are one movement rather than two.
      const breath = 1 + 0.07 * Math.sin(frame * driftRate(p.s) * 1.6 + hash(p.s, 6) * TAU);

      agents.push({
        s: p.s,
        x: p.lx,
        y: p.ly,
        r: DOT_R * p.rr * breath * (1 + 0.3 * flash),
        op: base * (sampled ? 1 : vis(p.lx, p.ly)),
      });

      // Edges run right and down off each cell, so every post is owned once.
      for (const [di, dj, kk] of [
        [1, 0, 7],
        [0, 1, 8],
      ] as const) {
        if (hash(p.s, kk) > threadDensity) continue;
        const q = liveAt(i + di, j + dj);
        if (!q) continue;
        const cyc = (frame * THREAD_RATE + hash(p.s, kk + 4)) % 1;
        // A thread resting between posts is skipped — unless the last beat is
        // calling every one of them up at once, which is the whole point of it.
        if (cyc >= FADE_END && surge < 0.02) continue;
        const drawn = cyc < DRAW_END ? cyc / DRAW_END : 1;
        const fade =
          cyc < HOLD_END
            ? 1
            : cyc < FADE_END
              ? 1 - (cyc - HOLD_END) / (FADE_END - HOLD_END)
              : 0;
        const both = inBox(p) && inBox(q);
        const level = both ? 1 : vis((p.lx + q.lx) / 2, (p.ly + q.ly) / 2);
        const op = threadBase * Math.max(fade, surge * 0.85) * level;
        if (op < 0.008) continue;
        const head: P = {
          x: p.lx + (q.lx - p.lx) * drawn,
          y: p.ly + (q.ly - p.ly) * drawn,
        };
        posts.push({
          key: `${i}_${j}_${kk}`,
          a: { x: p.lx, y: p.ly },
          b: head,
          op,
          head: drawn < 1 ? head : null,
        });
      }
    }
  }

  const ruleDraw = interpolate(frame, [beats.rule, beats.rule + 14], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const rise = interpolate(frame, [beats.arrive, beats.arrive + 17], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.2)),
  });

  const brDraw = interpolate(frame, [beats.bracket, beats.bracket + 14], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const brSide = (BOX.x1 - BOX.x0) / 2;
  const brDown = BOX.y1 - BOX.y0;
  const brHalf = brSide * 2 + brDown;
  // Where each of the two drawing heads has got to, so the box gets the same
  // white tip every other drawn line in the piece has.
  const brHead = (dir: -1 | 1): P => {
    const d = brDraw * brHalf;
    if (d <= brSide) return { x: BOX_C.x + dir * d, y: BOX.y0 };
    if (d <= brSide + brDown) return { x: BOX_C.x + dir * brSide, y: BOX.y0 + (d - brSide) };
    return { x: BOX_C.x + dir * (brHalf - d), y: BOX.y1 };
  };
  const tether = interpolate(frame, [beats.bracket + 2, beats.bracket + 12], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
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

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
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
          <div
            style={{
              position: "absolute",
              left: 540 - humanSize / 2,
              top: HUMAN_FOOT - humanSize - RISE_HEADROOM,
              width: humanSize,
              height: humanSize + RISE_HEADROOM,
              overflow: "hidden",
            }}
          >
            <Img
              src={staticFile(humanSrc)}
              style={{
                position: "absolute",
                left: 0,
                top: RISE_HEADROOM + humanSize * (1 - rise),
                width: humanSize,
                height: humanSize,
                filter: "brightness(0) invert(1)",
              }}
            />
          </div>

          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <line
              x1={540 - RULE_HALF * ruleDraw}
              y1={RULE_Y}
              x2={540 + RULE_HALF * ruleDraw}
              y2={RULE_Y}
              stroke={ink}
              strokeWidth={lineWidth}
              strokeLinecap="round"
              opacity={inkContext * ruleDraw}
            />
            {ruleDraw > 0.02 && ruleDraw < 0.995
              ? [-1, 1].map((d) => (
                  <circle
                    key={`rt${d}`}
                    cx={540 + d * RULE_HALF * ruleDraw}
                    cy={RULE_Y}
                    r={tipRadius}
                    fill={ink}
                  />
                ))
              : null}

            {posts.map((t) => (
              <line
                key={t.key}
                x1={t.a.x}
                y1={t.a.y}
                x2={t.b.x}
                y2={t.b.y}
                stroke={accent}
                strokeWidth={threadWidth}
                strokeLinecap="round"
                opacity={t.op}
              />
            ))}
            {posts.map((t) =>
              t.head ? (
                <circle
                  key={`h${t.key}`}
                  cx={t.head.x}
                  cy={t.head.y}
                  r={tipRadius * 0.55}
                  fill={ink}
                  opacity={t.op / threadBase}
                />
              ) : null,
            )}

            {agents.map((a) => (
              <circle key={a.s} cx={a.x} cy={a.y} r={a.r} fill={accent} opacity={a.op} />
            ))}

            {tether > 0 ? (
              <line
                x1={540}
                y1={RULE_Y}
                x2={540}
                y2={RULE_Y + (BOX.y0 - RULE_Y) * tether}
                stroke={ink}
                strokeWidth={lineWidth}
                strokeLinecap="round"
                opacity={inkContext}
              />
            ) : null}

            {brDraw > 0 ? (
              <>
                {([-1, 1] as const).map((dir) => (
                  <path
                    key={`br${dir}`}
                    d={`M ${BOX_C.x} ${BOX.y0} L ${dir === -1 ? BOX.x0 : BOX.x1} ${BOX.y0} L ${dir === -1 ? BOX.x0 : BOX.x1} ${BOX.y1} L ${BOX_C.x} ${BOX.y1}`}
                    fill="none"
                    stroke={ink}
                    strokeWidth={lineWidth}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={`${(brDraw * brHalf).toFixed(1)} ${brHalf.toFixed(1)}`}
                    opacity={inkMark}
                  />
                ))}
                {brDraw < 0.995
                  ? ([-1, 1] as const).map((dir) => {
                      const h = brHead(dir);
                      return <circle key={`bt${dir}`} cx={h.x} cy={h.y} r={tipRadius} fill={ink} />;
                    })
                  : null}
              </>
            ) : null}

            {scanFade > 0.01 ? (
              <g opacity={scanFade}>
                <line
                  x1={BOX.x0 + 12}
                  y1={scanY}
                  x2={BOX.x1 - 12}
                  y2={scanY}
                  stroke={ink}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  opacity={inkMark}
                />
                <circle cx={BOX.x0 + 12} cy={scanY} r={tipRadius} fill={ink} />
                <circle cx={BOX.x1 - 12} cy={scanY} r={tipRadius} fill={ink} />
              </g>
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default DarkAboutTheScope;
