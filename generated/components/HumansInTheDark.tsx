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
import {
  BG_OVERSIZE,
  CLEAR,
  GROUNDS,
  GROUND_HALF,
  LID_DROP,
  POP,
  SLOTS,
  SLOT_OF,
  SOC_H,
  SOC_W,
  SURFACE_HALF,
  SURFACE_Y,
  THREADS,
  WORLD_H,
  WORLD_W,
  ashRest,
  clamp,
  hash,
  type P,
} from "./societiesWorld";

export const FPS = 24;
// Dwarkesh, "all of this happened while humans remained more or less in the
// dark about the scope of the conspiracy." SRT 13.000s -> 17.899s.
// round(4.899 * 24) = 118 frames, plus a 10 frame tail. The next line starts
// immediately, so trim the tail if a graphic lands on it.
export const DURATION = 128;

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
  dotRadius: z.number(),
  lineWidth: z.number(),
  threadWidth: z.number(),
  ashOpacity: z.number(),
  litOpacity: z.number(),
  ghostOpacity: z.number(),
  darkLevel: z.number(),
  revealLevel: z.number(),
  revealRuins: z.number(),
  corridorWide: z.number(),
  corridorNarrow: z.number(),
  ambient: z.number(),
  beats: z.object({
    allOfThis: z.number(), // "all of this" — the stack reads bottom to top
    arrive: z.number(), // "happened while" — the human comes down
    humans: z.number(), // "humans remained" — lands, the surface rings
    gap: z.number(), // the surface parts under their feet
    more: z.number(), // "more" — the corridor at its widest
    orLess: z.number(), // "or less in" — and then narrower
    dark: z.number(), // "the dark" — the fall is complete
    about: z.number(), // "about the"
    scope: z.number(), // "scope of the" — the wave runs to the far corners
    conspiracy: z.number(), // "conspiracy" — three threads stitch three floors
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
  humanSize: 132,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  dotRadius: 8,
  lineWidth: 5,
  threadWidth: 3,
  // The ladder inherited from the first cut, so the two match in a row.
  ashOpacity: 0.38,
  litOpacity: 0.95,
  ghostOpacity: 0.16,
  // What the human's ignorance leaves of the structure, and what the truth
  // comes back to for us afterwards. Both measured against the grid's own
  // value: below 0.15 the mass stops being sensed at all, and 0.68 sits far
  // enough under the corridor that the two never read as the same state.
  darkLevel: 0.17,
  // The truth comes back for us, but not to the value the human's own sliver
  // sits at — 0.62 keeps a clear two-to-one gap between what happened and what
  // they knew. The ruins are already the faintest thing in the piece and get
  // their own floor, or the reveal buries them twice over.
  revealLevel: 0.62,
  revealRuins: 0.95,
  corridorWide: 95,
  corridorNarrow: 65,
  ambient: 0.38,
  beats: {
    allOfThis: 0,
    arrive: 12,
    humans: 28,
    gap: 42,
    more: 48,
    orLess: 57,
    dark: 68,
    about: 76,
    scope: 86,
    conspiracy: 101,
  },
});

// ---------------------------------------------------------------------------
// Where the last cut left everything
//
// This shot opens on the resolved frame of ThreeSecretSocieties, so nothing
// here is placed by eye: the population is read straight out of the shared
// world in its final arrangement. Six left as ash on the first floor, six more
// on the second, twenty-two standing in the third society.
// ---------------------------------------------------------------------------
type Resolved = { i: number; p: P; tier: number; ash: boolean };
const RESOLVED: Resolved[] = [];
for (let i = 0; i < POP; i++) {
  if (!SLOT_OF[0].has(i)) RESOLVED.push({ i, p: ashRest(i, 0), tier: 0, ash: true });
  else if (!SLOT_OF[1].has(i)) RESOLVED.push({ i, p: ashRest(i, 1), tier: 1, ash: true });
  else RESOLVED.push({ i, p: SLOTS[2][SLOT_OF[1].get(i) as number], tier: 2, ash: false });
}

// A spent floor is a doubled rule; the live one is a single rule lifted because
// something is standing on it. Both values come from the first cut.
const FLOORS = [
  { y: GROUNDS[0], opacity: 0.47, lid: SOC_W[0] / 2 + 30 },
  { y: GROUNDS[1], opacity: 0.47, lid: SOC_W[1] / 2 + 30 },
  { y: GROUNDS[2], opacity: 0.9, lid: 0 },
];

const HUMAN_FOOT = SURFACE_Y + 14;

// The wave that says "scope" starts inside the sliver the human can see and
// runs out to the far corners of what actually happened. Its centre is the
// middle of the third society, which is the only thing they have any sight of.
const WAVE = { x: 540, y: GROUNDS[2] - CLEAR - SOC_H[2] / 2 };

// ---------------------------------------------------------------------------
// Three threads that stitch the three floors into one thing
//
// "The scope of the conspiracy" is not three incidents, it is one that spans
// all three. Each stitch runs from a vertex of the first society's ruin, up
// through a vertex of the second's, into a live agent in the third — crossing
// two floors on the way, which is exactly what the conspiracy did.
// ---------------------------------------------------------------------------
const nearestSlot = (g: number, tx: number) => {
  let best = 0;
  let bd = Infinity;
  SLOTS[g].forEach((p, s) => {
    const d = Math.abs(p.x - tx);
    if (d < bd) {
      bd = d;
      best = s;
    }
  });
  return best;
};
const STITCH: P[][] = [-215, 5, 225].map((dx) => [
  SLOTS[0][nearestSlot(0, 540 + dx)],
  SLOTS[1][nearestSlot(1, 540 + dx)],
  SLOTS[2][nearestSlot(2, 540 + dx)],
]);

const lerpP = (a: P, b: P, t: number): P => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

// ---------------------------------------------------------------------------
// Camera
//
// Almost none. The previous cut's problem was a camera that hid the count, and
// this shot's whole job is a comparison between one sliver and everything else,
// so the frame holds still and lets the wave do the travelling. One small lean
// to make room as the human arrives, then a creep so a five second hold is
// never actually frozen.
// ---------------------------------------------------------------------------
const CAM_F = [0, 14, 30, DURATION];
const CAM_CY = [2060, 2060, 2100, 2078];
const CAM_K = [0.91, 0.91, 0.91, 0.945];

const CAM_STIFF = 0.13;
const CAM_DAMP = 0.56;

const camera = (upto: number) => {
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vcy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const tcy = interpolate(f, CAM_F, CAM_CY, clamp);
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    vcy += (tcy - cy) * CAM_STIFF - vcy * CAM_DAMP;
    cy += vcy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, k };
};

const HumansInTheDark: React.FC<Props> = ({
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
  dotRadius,
  lineWidth,
  threadWidth,
  ashOpacity,
  litOpacity,
  ghostOpacity,
  darkLevel,
  revealLevel,
  revealRuins,
  corridorWide,
  corridorNarrow,
  ambient,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { cy, k } = camera(frame);
  const tx = 540 - 540 * k;
  const ty = 960 - cy * k;
  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.25;
  const bgScale = 1 + (k - 1) * 0.3;

  // "All of this": a brightness runs up the stack, naming the three floors in
  // order before anything new happens. No bar is drawn — a rising rule would
  // read as another wipe, and this one is benign.
  const riseFront = interpolate(frame, [0, 20], [GROUNDS[0] + 150, SURFACE_Y - 40], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const riseBoost = (y: number) =>
    interpolate(Math.abs(y - riseFront), [0, 130], [0.4, 0], clamp);

  // The human's ignorance falls from the surface down, reaching the deepest
  // floor last — the thing furthest from them is the last thing they lose.
  const darkFront = interpolate(
    frame,
    [beats.humans + 4, beats.dark],
    [SURFACE_Y - 40, GROUNDS[0] + 160],
    { ...clamp, easing: Easing.inOut(Easing.quad) },
  );
  const waveR = interpolate(frame, [beats.scope, beats.scope + 24], [0, 1150], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });

  // One visibility function for everything below the surface, so the ash, the
  // ruins, the live agents and the floors can never fall out of step.
  const vis = (x: number, y: number, revealTo = revealLevel) => {
    const dk = interpolate(darkFront - y, [0, 150], [0, 1], clamp);
    const rv = interpolate(waveR - Math.hypot(x - WAVE.x, y - WAVE.y), [0, 110], [0, 1], clamp);
    let v = 1 + (darkLevel - 1) * dk;
    v += (revealTo - v) * rv;
    return v * (1 + riseBoost(y));
  };

  // The corridor: a gap in the surface directly under the human's feet, and the
  // narrow shaft of what gets through it. It reaches the nearest floor and no
  // further, which is the whole claim — a sliver of the newest society, none of
  // the two underneath.
  const gapOpen = interpolate(frame, [beats.gap, beats.gap + 10], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const corridorHalf =
    gapOpen *
    interpolate(
      frame,
      [beats.more, beats.orLess, beats.orLess + 11],
      [corridorWide, corridorWide, corridorNarrow],
      { ...clamp, easing: Easing.inOut(Easing.quad) },
    );
  const corridorDraw = interpolate(frame, [beats.gap + 2, beats.gap + 16], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const corridorBottom = SURFACE_Y + (GROUNDS[2] - SURFACE_Y) * corridorDraw;
  const seen = (x: number, y: number) =>
    corridorHalf > 1 &&
    Math.abs(x - 540) <= corridorHalf &&
    y > SURFACE_Y &&
    y < GROUNDS[2] + 6;
  const level = (x: number, y: number) => (seen(x, y) ? 1 : vis(x, y));

  const land = spring({
    frame: frame - beats.arrive,
    fps,
    config: { damping: 13, stiffness: 118, mass: 0.9 },
  });
  const humanFoot = interpolate(land, [0, 1], [HUMAN_FOOT - 420, HUMAN_FOOT]);
  const humanIn = interpolate(frame, [beats.arrive, beats.arrive + 7], [0, 1], clamp);
  const humanBreath = 1 + 0.006 * Math.sin(frame * 0.09);
  // The surface rings once where they put their weight on it.
  const ring = interpolate(frame, [beats.humans, beats.humans + 16], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const surfaceLift = interpolate(frame, [beats.humans, beats.humans + 12], [0.34, 0.5], clamp);

  const stitchAt = (n: number) => {
    const pts = STITCH[n];
    const s1 = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    const s2 = Math.hypot(pts[2].x - pts[1].x, pts[2].y - pts[1].y);
    const start = beats.conspiracy - 2 + n * 5;
    const t = interpolate(frame, [start, start + 18], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });
    if (t <= 0) return null;
    const d = t * (s1 + s2);
    const head = d <= s1 ? lerpP(pts[0], pts[1], d / s1) : lerpP(pts[1], pts[2], (d - s1) / s2);
    const path =
      d <= s1
        ? `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${head.x.toFixed(1)} ${head.y.toFixed(1)}`
        : `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)} L ${head.x.toFixed(1)} ${head.y.toFixed(1)}`;
    return { path, head, done: t >= 1 };
  };

  const tickU = ((frame - beats.gap) * 0.017) % 1;
  const tickY = SURFACE_Y + (corridorBottom - SURFACE_Y) * tickU;

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
          <Img
            src={staticFile(humanSrc)}
            style={{
              position: "absolute",
              left: 540 - humanSize / 2,
              top: humanFoot - humanSize,
              width: humanSize,
              height: humanSize,
              filter: "brightness(0) invert(1)",
              opacity: humanIn,
              transform: `scale(${humanBreath})`,
              transformOrigin: "center bottom",
            }}
          />

          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the surface, parting under the human's feet */}
            {[-1, 1].map((side) => (
              <line
                key={`surf${side}`}
                x1={540 + side * corridorHalf}
                y1={SURFACE_Y}
                x2={540 + side * SURFACE_HALF}
                y2={SURFACE_Y}
                stroke={ink}
                strokeWidth={lineWidth}
                strokeLinecap="round"
                opacity={surfaceLift}
              />
            ))}
            {ring > 0 && ring < 1 ? (
              <line
                x1={540 - SURFACE_HALF * ring}
                y1={SURFACE_Y}
                x2={540 + SURFACE_HALF * ring}
                y2={SURFACE_Y}
                stroke={ink}
                strokeWidth={lineWidth}
                strokeLinecap="round"
                opacity={0.55 * (1 - ring)}
              />
            ) : null}

            {/* the floors, and the wipes still lying under the two spent ones */}
            {FLOORS.map((f, i) => (
              <g key={`floor${i}`}>
                <line
                  x1={540 - GROUND_HALF}
                  y1={f.y}
                  x2={540 + GROUND_HALF}
                  y2={f.y}
                  stroke={ink}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  opacity={f.opacity * vis(540, f.y)}
                />
                {f.lid > 0 ? (
                  <line
                    x1={540 - f.lid}
                    y1={f.y + LID_DROP}
                    x2={540 + f.lid}
                    y2={f.y + LID_DROP}
                    stroke={ink}
                    strokeWidth={lineWidth}
                    strokeLinecap="round"
                    opacity={0.5 * vis(540, f.y + LID_DROP)}
                  />
                ) : null}
              </g>
            ))}

            {/* the two ruins and the live web */}
            {THREADS.map((list, g) =>
              list.map((t, ti) => {
                const a = SLOTS[g][t.a];
                const b = SLOTS[g][t.b];
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2;
                const base = g === 2 ? 0.34 : ghostOpacity;
                const op =
                  base *
                  (seen(a.x, a.y) && seen(b.x, b.y)
                    ? 1
                    : vis(mx, my, g === 2 ? revealLevel : revealRuins));
                if (op < 0.004) return null;
                const carries = g === 2 && ti % 5 === 0;
                const u = (frame * 0.018 + t.k) % 1;
                return (
                  <g key={`t${g}-${ti}`}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={accent}
                      strokeWidth={threadWidth}
                      strokeLinecap="round"
                      opacity={op}
                    />
                    {carries ? (
                      <circle
                        cx={a.x + (b.x - a.x) * u}
                        cy={a.y + (b.y - a.y) * u}
                        r={3.5}
                        fill={ink}
                        opacity={ambient * (op / base)}
                      />
                    ) : null}
                  </g>
                );
              }),
            )}

            {/* the population, in the arrangement the last cut left it */}
            {RESOLVED.map((d) => {
              const breath = 1 + 0.05 * Math.sin(frame * 0.11 + hash(d.i, 6) * 6.28);
              return (
                <circle
                  key={`d${d.i}`}
                  cx={d.p.x}
                  cy={d.p.y}
                  r={dotRadius * (0.75 + 0.5 * hash(d.i, 7)) * breath}
                  fill={accent}
                  opacity={(d.ash ? ashOpacity : litOpacity) * level(d.p.x, d.p.y)}
                />
              );
            })}

            {/* one conspiracy, three floors */}
            {[0, 1, 2].map((n) => {
              const st = stitchAt(n);
              if (!st) return null;
              return (
                <g key={`stitch${n}`}>
                  <path
                    d={st.path}
                    fill="none"
                    stroke={accent}
                    strokeWidth={threadWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.55}
                  />
                  {!st.done ? (
                    <circle cx={st.head.x} cy={st.head.y} r={5} fill={ink} />
                  ) : null}
                </g>
              );
            })}

            {/* what gets through the gap */}
            {corridorDraw > 0.01
              ? [-1, 1].map((side) => (
                  <g key={`cor${side}`}>
                    <line
                      x1={540 + side * corridorHalf}
                      y1={SURFACE_Y}
                      x2={540 + side * corridorHalf}
                      y2={corridorBottom}
                      stroke={ink}
                      strokeWidth={lineWidth}
                      strokeLinecap="round"
                      opacity={0.5}
                    />
                    {corridorDraw < 1 ? (
                      <circle
                        cx={540 + side * corridorHalf}
                        cy={corridorBottom}
                        r={5}
                        fill={ink}
                      />
                    ) : null}
                    {corridorDraw >= 1 ? (
                      <circle
                        cx={540 + side * corridorHalf}
                        cy={tickY}
                        r={3.5}
                        fill={ink}
                        opacity={ambient}
                      />
                    ) : null}
                  </g>
                ))
              : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default HumansInTheDark;
