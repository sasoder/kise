import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  DOT_RADIUS,
  GridBackground,
  OP_DARK,
  OP_READ,
  OP_UNREAD,
  Vignette,
  breath,
  clamp,
  hash,
  idleThreads,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Dwarkesh: "All of this happened while humans remained more or less in the
// dark about the scope of the conspiracy."
// SRT 13.000s -> 17.899s. round((17.899 - 13.000) * 24) = 118 frames of speech,
// plus a 16 frame tail so the resolved state holds = 134.
export const DURATION = 134;

// Every gesture in this piece is one of these, and each one is a word:
//   the crowd runs hot, then cools   — "all of this happened while"
//   the human fades in above it      — "humans"
//   the box draws around one patch   — "humans remained"
//   the field splits: outside to the
//   dark 0.16, inside up to read 1.0 — "more or less in the dark"
//   the camera pulls back            — "about the scope of the conspiracy"
// Nothing else moves except the crowd's own breathing and its threads, which
// keep posting in the dark for the whole tail.

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
  threads: z.number(), // the busy rate, at the top of the line
  threadsIdle: z.number(), // the shared idle rate it settles to once the dark has fallen
  beats: z.object({
    allOfThis: z.number(), // "all of this"
    happenedWhile: z.number(), // "happened while"
    humansRemained: z.number(), // "humans remained"
    more: z.number(), // "more"
    orLessIn: z.number(), // "or less in"
    theDark: z.number(), // "the dark"
    aboutThe: z.number(), // "about the"
    scopeOfThe: z.number(), // "scope of the"
    conspiracy: z.number(), // "conspiracy"
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
  dotRadius: DOT_RADIUS,
  // 2,400 agents, so idle is 360. This line opens on "all of this happened",
  // so it runs 1.6x idle and eases down to it as the dark falls.
  threads: Math.round(1.6 * idleThreads(2400)),
  threadsIdle: idleThreads(2400),
  beats: {
    allOfThis: 0,
    happenedWhile: 12,
    humansRemained: 28,
    more: 48,
    orLessIn: 57,
    theDark: 68,
    aboutThe: 76,
    scopeOfThe: 86,
    conspiracy: 101,
  },
});

const WORLD_W = 1080;
const WORLD_H = 2200;
// The crowd is wider than the frame, so the drawing surface is too.
const SVG_X0 = -420;
const SVG_W = 1920;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// ---------------------------------------------------------------------------
// The conspiracy is the crowd: 2,400 agents at exactly the density of the
// crowd in ScopeOfTheReport (same step, same jitter, same radius spread), so
// the two cuts read as the same field seen from two distances. The human
// stands above its top edge; the box goes around one small patch of it,
// directly under the human's feet — about a twentieth of the field.
// ---------------------------------------------------------------------------
const COLS = 60;
const ROWS = 40;
const N = COLS * ROWS;
const STEP_X = 940 / 39; // ScopeOfTheReport's step, kept exactly
const STEP_Y = 440 / 29;
const CROWD = {
  cx: 540,
  top: 1440,
  w: (COLS - 1) * STEP_X, // 1422
  h: (ROWS - 1) * STEP_Y, // 592
};

// What the humans can see: 250 x 170 of a 1422 x 592 field, 5% of it.
const BOX = { x0: 415, x1: 665, y0: 1470, y1: 1640 };
// The human, standing above the crowd's top edge with the box under it.
const HUMAN = { x: 540, y: 1210, size: 120 };

// No dot may straddle the box's stroke: any dot inside the band around the
// perimeter is pushed off it, to whichever side it was already on.
const CLEAR = 11;
const clearOfBox = (x: number, y: number) => {
  const insideX = x > BOX.x0 && x < BOX.x1;
  const insideY = y > BOX.y0 && y < BOX.y1;
  // distance to each edge line, signed so positive means "inside that edge"
  const dL = x - BOX.x0;
  const dR = BOX.x1 - x;
  const dT = y - BOX.y0;
  const dB = BOX.y1 - y;
  const inside = insideX && insideY;
  // the nearest edge, measured only where the band actually is
  const cands: { d: number; apply: () => { x: number; y: number } }[] = [];
  if (insideY || Math.abs(dT) < CLEAR || Math.abs(dB) < CLEAR) {
    cands.push({ d: Math.abs(dL), apply: () => ({ x: BOX.x0 + (dL >= 0 ? CLEAR : -CLEAR), y }) });
    cands.push({ d: Math.abs(dR), apply: () => ({ x: BOX.x1 - (dR >= 0 ? CLEAR : -CLEAR), y }) });
  }
  if (insideX || Math.abs(dL) < CLEAR || Math.abs(dR) < CLEAR) {
    cands.push({ d: Math.abs(dT), apply: () => ({ x, y: BOX.y0 + (dT >= 0 ? CLEAR : -CLEAR) }) });
    cands.push({ d: Math.abs(dB), apply: () => ({ x, y: BOX.y1 - (dB >= 0 ? CLEAR : -CLEAR) }) });
  }
  let best: { d: number; apply: () => { x: number; y: number } } | null = null;
  for (const c of cands) if (!best || c.d < best.d) best = c;
  if (best && best.d < CLEAR) {
    const p = best.apply();
    return { x: p.x, y: p.y, inside };
  }
  return { x, y, inside };
};

const CROWD_POS = Array.from({ length: N }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  const x = CROWD.cx + (c - (COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9;
  const y = CROWD.top + r * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9;
  const p = clearOfBox(x, y);
  return { x: p.x, y: p.y, r: 0.75 + 0.5 * hash(i, 13), inside: p.inside };
});

const INSIDE = CROWD_POS.map((p) => p.inside);
// each agent goes dark on its own frame, so the field dims as a field
const DARK_STAGGER = Array.from({ length: N }, (_, i) => hash(i, 40) * 8);

// The perimeter of the box, so the drawing line can carry a white head.
const rectPt = (t: number) => {
  const w = BOX.x1 - BOX.x0;
  const h = BOX.y1 - BOX.y0;
  let d = clamp01(t) * 2 * (w + h);
  if (d <= w) return { x: BOX.x0 + d, y: BOX.y0 };
  d -= w;
  if (d <= h) return { x: BOX.x1, y: BOX.y0 + d };
  d -= h;
  if (d <= w) return { x: BOX.x1 - d, y: BOX.y1 };
  d -= w;
  return { x: BOX.x0, y: BOX.y1 - d };
};

// Camera: one move. It opens inside the crowd — the human at the top, the
// patch that will be boxed under it, the field running past both edges — and
// pulls back once, on "about the scope of the conspiracy", to put the whole
// 2,400 in the frame with the lit box small inside it. The key ends at 92 and
// the damped follower lands it around 100, five frames after "scope of the"
// and just as "conspiracy" is said. Nothing after that but sway.
const CAM_F = [0, 74, 92, DURATION];
// The opening key sits high enough that the human is near the top of the
// frame and the crowd fills everything under it: no empty band above.
const CAM_CY = [1600, 1600, 1780, 1780];
// This is the one cut that does not resolve at k = 1.0: the pull-back IS the
// gesture, so it ends wider than the other two. The damping is the shared one.
const CAM_K = [1.8, 1.8, 0.66, 0.66];

const InTheDarkAboutTheScope: React.FC<Props> = ({
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
  threads,
  threadsIdle,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the human -------------------------------------------------------------
  // Present from the first frame — being there is not a gesture — and it
  // never moves.
  const humanIn = interpolate(frame, [0, 12], [0, 1], clamp);

  // -- the box ---------------------------------------------------------------
  // Draws through "humans remained" and closes two frames before "more".
  const boxDraw = interpolate(frame, [beats.humansRemained, beats.more - 2], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const boxClick = interpolate(
    frame,
    [beats.more - 4, beats.more - 2, beats.more + 4],
    [0, 1, 0],
    { ...clamp, easing: Easing.inOut(Easing.quad) },
  );

  // -- the dark --------------------------------------------------------------
  // "more or less in the dark": everything outside the box eases to 0.16 —
  // not to nothing, because it is more or less — and everything inside it
  // eases up to the read state.
  const darkGlobal = interpolate(frame, [beats.more, beats.theDark + 4], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const read = interpolate(frame, [beats.more, beats.more + 16], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  // -- threads ---------------------------------------------------------------
  // The traffic starts well above idle — all of this is happening — and eases
  // back to the normal rate as the dark falls. It never stops.
  const active = interpolate(frame, [beats.more, beats.theDark + 6], [threads, threadsIdle], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  const lit = new Float32Array(N);
  const threadEls: {
    key: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    op: number;
    drawn: number;
  }[] = [];
  const reach = 5;
  for (let j = 0; j < threads; j++) {
    const alive = clamp01((active - j) / 14);
    if (alive <= 0.02) continue;
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * N);
    const ac = a % COLS;
    const ar = Math.floor(a / COLS);
    const bc = Math.max(0, Math.min(COLS - 1, ac + Math.round((hash(seed, 7) - 0.5) * 2 * reach)));
    const br = Math.max(0, Math.min(ROWS - 1, ar + Math.round((hash(seed, 8) - 0.5) * 2 * reach)));
    const b = br * COLS + bc;
    if (b === a) continue;
    // nothing posts across the box's edge, so no thread ever crosses the stroke
    if (INSIDE[a] !== INSIDE[b]) continue;
    const A = CROWD_POS[a];
    const B = CROWD_POS[b];
    const drawn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    const boxed = INSIDE[a];
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], drawn * fade);
    const level = boxed
      ? 0.5 + 0.35 * read
      : 0.5 * (1 - darkGlobal) + 0.15 * darkGlobal;
    threadEls.push({
      key: j,
      x1: A.x,
      y1: A.y,
      x2: A.x + (B.x - A.x) * drawn,
      y2: A.y + (B.y - A.y) * drawn,
      op: level * fade * alive,
      drawn,
    });
  }

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = 540 + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  const head = rectPt(boxDraw);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
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
          <svg
            width={SVG_W}
            height={WORLD_H}
            viewBox={`${SVG_X0} 0 ${SVG_W} ${WORLD_H}`}
            style={{ position: "absolute", left: SVG_X0, top: 0, overflow: "visible" }}
          >
            {/* threads */}
            {threadEls.map((t) => (
              <g key={t.key}>
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={accent}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={t.op}
                />
                {t.drawn < 1 ? <circle cx={t.x2} cy={t.y2} r={4} fill={ink} opacity={t.op} /> : null}
              </g>
            ))}

            {/* agents */}
            {CROWD_POS.map((p, i) => {
              const l = lit[i];
              const bre = breath(frame, hash(i, 9));
              const boxed = INSIDE[i];
              const dk = boxed
                ? 0
                : clamp01(
                    interpolate(
                      frame,
                      [beats.more + DARK_STAGGER[i], beats.more + DARK_STAGGER[i] + 16],
                      [0, 1],
                      { ...clamp, easing: Easing.inOut(Easing.cubic) },
                    ),
                  );
              // The shared ladder (fieldShared): unread 0.45, read 0.9 (+0.1
              // with a thread on it), dark 0.16. The crowd starts unread on the
              // shared lit form; the box is what is read; the rest of the
              // conspiracy goes dark, and stays just alive enough to see it
              // carrying on.
              const unread = OP_UNREAD + (OP_READ + 0.1 - OP_UNREAD) * l;
              const op = boxed
                ? Math.min(1, unread * (1 - read) + read * (OP_READ + 0.1 * l))
                : (1 - dk) * unread + dk * (OP_DARK + 0.1 * l);
              const r = dotRadius * p.r * bre * (1 + 0.35 * l * (1 - 0.5 * dk));
              return <circle key={i} cx={p.x} cy={p.y} r={r} fill={accent} opacity={op} />;
            })}

            {/* the scope: what the humans could see of it */}
            {boxDraw > 0 && frame < beats.more ? (
              <g>
                <path
                  d={`M ${BOX.x0} ${BOX.y0} H ${BOX.x1} V ${BOX.y1} H ${BOX.x0} Z`}
                  fill="none"
                  stroke={ink}
                  strokeWidth={3 + 1.5 * boxClick}
                  strokeLinecap="round"
                  pathLength={1000}
                  strokeDasharray={1000}
                  strokeDashoffset={1000 * (1 - boxDraw)}
                  opacity={Math.min(1, 0.55 + 0.45 * boxClick)}
                />
                {boxDraw < 1 ? <circle cx={head.x} cy={head.y} r={5.5} fill={ink} /> : null}
              </g>
            ) : null}
            {frame >= beats.more ? (
              <rect
                x={BOX.x0}
                y={BOX.y0}
                width={BOX.x1 - BOX.x0}
                height={BOX.y1 - BOX.y0}
                fill="none"
                stroke={ink}
                strokeWidth={3}
                strokeLinejoin="round"
                opacity={0.85}
              />
            ) : null}
          </svg>

          {/* the human, above it all, not moving */}
          <Img
            src={staticFile("person.png")}
            style={{
              position: "absolute",
              left: HUMAN.x - HUMAN.size / 2,
              top: HUMAN.y - HUMAN.size / 2,
              width: HUMAN.size,
              height: HUMAN.size,
              filter: "brightness(0) invert(1)",
              opacity: humanIn,
            }}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default InTheDarkAboutTheScope;
