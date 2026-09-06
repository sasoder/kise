import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
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
  dotInSlot,
  hash,
  type P,
} from "./societiesWorld";

export const FPS = 24;
// Dwarkesh, "[at] OpenAI, three consecutive secret AI societies got started,
// then got wiped out, only to re-emerge from their predecessor's ashes."
// SRT 1.399s -> 8.839s. round(7.440 * 24) = 179 frames, plus a 12 frame tail
// so the third society holds resolved after the pull-back settles.
export const DURATION = 191;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  markSrc: z.string(),
  markOpacity: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  dotRadius: z.number(),
  lineWidth: z.number(),
  threadWidth: z.number(),
  ashOpacity: z.number(),
  litOpacity: z.number(),
  groundFloor: z.number(),
  ambient: z.number(),
  beats: z.object({
    ground1: z.number(), // "three"
    ground2: z.number(),
    ground3: z.number(), // "consecutive"
    surface: z.number(), // "secret ai" — the lid closes over them
    camIn: z.number(),
    gather: z.number(), // "societies got" — the first society lifts off the floor
    started: z.number(), // "started" — threads at full
    bar1In: z.number(), // "then got"
    bar1Hit: z.number(),
    bar1Land: z.number(), // "wiped out" lands mid-sweep
    launch1: z.number(), // "only to re" — the ash lifts off ground one
    arrive1: z.number(), // "emerge"
    bar2In: z.number(),
    bar2Hit: z.number(), // "from their" — the same wipe, compressed
    bar2Land: z.number(),
    camOut: z.number(), // "predecessor's" — pull back to reveal all three
    launch2: z.number(),
    arrive2: z.number(), // "ashes"
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#48D9FF",
  backgroundBase: "#232323",
  backgroundSrc: "grid-background.jpg",
  // The grid's lines are darker than its field. Dim it, never invert it.
  backgroundBlur: 13,
  backgroundDim: 0.32,
  parallax: 0.15,
  markSrc: "openai-chatgpt-logo.png",
  markOpacity: 0.42,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  dotRadius: 8,
  // Two weights, and only two: structural ink (floors, the surface, the wipe)
  // and the threads the agents make between themselves.
  lineWidth: 5,
  threadWidth: 3,
  ashOpacity: 0.38,
  litOpacity: 0.95,
  groundFloor: 0.47,
  ambient: 0.38,
  beats: {
    ground1: 4,
    ground2: 12,
    ground3: 20,
    surface: 30,
    camIn: 34,
    gather: 46,
    started: 73,
    bar1In: 82,
    bar1Hit: 87,
    bar1Land: 99,
    launch1: 106,
    arrive1: 128,
    bar2In: 132,
    bar2Hit: 137,
    bar2Land: 144,
    camOut: 150,
    launch2: 150,
    arrive2: 165,
  },
});

const MARK = { x: 540, y: 1290, size: 118 };

// Where the population lies before any of it organises: loose on the first
// floor, so the first society rises off the ground exactly the way the second
// and third ones will.
const PRE: P[] = [];
for (let i = 0; i < POP; i++) {
  PRE.push({
    x: 540 + (hash(i, 41) - 0.5) * 760,
    y: GROUNDS[0] - 18 - hash(i, 43) * 168,
  });
}

const THREAD_WINDOW = [
  { from: 54, span: 16 },
  { from: 120, span: 8 },
  { from: 158, span: 12 },
];

// ---------------------------------------------------------------------------
// The wipe
//
// An ink rule that drops out of the surface, flattens a society onto its own
// floor and then keeps going — coming to rest just under the floor it killed
// and staying there for the rest of the piece. That is what makes the count
// readable in a single frame at the end: a spent floor is a doubled rule with
// ash and the ghost of a web on it, a live floor is a single rule with a
// society standing on it. It also has to park *below* the floor rather than on
// top of the ash, or the survivors would have to climb out from under it.
//
// A dot's death is read off the bar's position, never off a parallel timer, so
// the two cannot drift: the sweep is linear between hit and land, which makes
// the crossing frame for any given dot exact rather than searched for.
// ---------------------------------------------------------------------------
const barSpan = (gen: number) => ({
  top: GROUNDS[gen] - CLEAR - SOC_H[gen] - 30,
  ground: GROUNDS[gen],
});

const killFrame = (i: number, gen: number, hit: number, land: number) => {
  const slot = gen === 0 ? i : (SLOT_OF[gen - 1].get(i) as number);
  const { top, ground } = barSpan(gen);
  return hit + ((SLOTS[gen][slot].y - top) / (ground - top)) * (land - hit);
};

// ---------------------------------------------------------------------------
// Camera
//
// All three floors are in frame from the moment they are drawn until the last
// frame. An earlier cut pushed in on each society in turn, and the count stopped
// reading: for a hundred frames you could only ever see one floor, so "three"
// had to be carried by memory rather than by anything on screen. Now the camera
// only leans in as the first society gathers and eases back out for the resolve,
// and the two floors still waiting above are visible the whole way up. A damped
// follow rounds the corners off the coarse key track; the drift across the long
// hold keeps the frame from going dead while the action climbs.
// ---------------------------------------------------------------------------
const CAM_F = [0, 34, 48, 150, 164, DURATION];
const CAM_CY = [2110, 2110, 2150, 2130, 2060, 2060];
const CAM_K = [0.88, 0.88, 0.97, 0.97, 0.91, 0.91];

const CAM_STIFF = 0.13;
const CAM_DAMP = 0.56; // zeta ~0.78, settles in ~14 frames

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

// A shallow arc with its own lateral bias, so a group travelling together never
// moves as one straight rank. The bow follows the direction of travel: a rise
// arches over, a descent sags under, which is what makes the two read as
// different kinds of move rather than the same lerp twice.
const arcAt = (from: P, to: P, i: number, t: number): P => {
  const bow = (hash(i, 63) - 0.5) * 210;
  const lift = (60 + hash(i, 65) * 90) * (from.y >= to.y ? 1 : -1);
  const mx = (from.x + to.x) / 2 + bow;
  const my = (from.y + to.y) / 2 - lift;
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * mx + t * t * to.x,
    y: u * u * from.y + 2 * u * t * my + t * t * to.y,
  };
};

const ThreeSecretSocieties: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  markSrc,
  markOpacity,
  shadowY,
  shadowBlur,
  shadowOpacity,
  dotRadius,
  lineWidth,
  threadWidth,
  ashOpacity,
  litOpacity,
  groundFloor,
  ambient,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { cy, k } = camera(frame);
  const tx = 540 - 540 * k;
  const ty = 960 - cy * k;

  // The grid sits on its own plane at a fraction of the camera, so the move
  // reads as travel through a space rather than a layer sliding about.
  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.25;
  const bgScale = 1 + (k - 1) * 0.3;

  const bars = [
    { in: beats.bar1In, hit: beats.bar1Hit, land: beats.bar1Land },
    { in: beats.bar2In, hit: beats.bar2Hit, land: beats.bar2Land },
  ];

  const barState = (gen: number) => {
    const b = bars[gen];
    const { top, ground } = barSpan(gen);
    if (frame < b.in) return null;
    let y: number;
    if (frame <= b.hit) {
      y = interpolate(frame, [b.in, b.hit], [top - 250, top], {
        ...clamp,
        easing: Easing.in(Easing.quad),
      });
    } else if (frame <= b.land) {
      y = interpolate(frame, [b.hit, b.land], [top, ground], clamp);
    } else {
      y = interpolate(frame, [b.land, b.land + 6], [ground, ground + LID_DROP], {
        ...clamp,
        easing: Easing.out(Easing.quad),
      });
    }
    return {
      y,
      opacity:
        interpolate(frame, [b.in, b.in + 4], [0, 1], clamp) *
        interpolate(frame, [b.land, b.land + 10], [1, 0.5], clamp),
      // The tether back to the surface lets go once the rule has landed.
      stem: interpolate(frame, [b.land - 4, b.land + 8], [0.2, 0], clamp),
    };
  };

  // -- the population --------------------------------------------------------
  type Dot = { x: number; y: number; r: number; opacity: number; lit: number; stage: number };
  const dots: Dot[] = [];
  for (let i = 0; i < POP; i++) {
    const drift = {
      x: 6 * Math.sin(frame * 0.055 + hash(i, 3) * 6.28),
      y: 5 * Math.cos(frame * 0.047 + hash(i, 4) * 6.28),
    };

    // Generation 0: lift off the floor into formation.
    const rise0 = beats.gather + hash(i, 53) * 10;
    const t0 = interpolate(frame, [rise0, rise0 + 16], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    const kill0 = killFrame(i, 0, beats.bar1Hit, beats.bar1Land);
    const fall0 = interpolate(frame, [kill0, kill0 + 12], [0, 1], {
      ...clamp,
      easing: Easing.in(Easing.quad),
    });

    const launch1 = beats.launch1 + hash(i, 59) * 8;
    const t1 = interpolate(frame, [launch1, launch1 + 14], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });
    const launch2 = beats.launch2 + hash(i, 61) * 9;
    const t2 = interpolate(frame, [launch2, launch2 + 15], [0, 1], {
      ...clamp,
      easing: Easing.inOut(Easing.cubic),
    });
    // The last stretch of a rise is the ignition, so a dot lights up because it
    // arrived, not because a clock said so.
    const landed = (t: number) => interpolate(t, [0.8, 1], [0, 1], clamp);

    // Walk the dot forward through its own history. `stage` is which society it
    // currently belongs to — the threads of a dead generation must not come
    // back when the same dot lights up two floors higher.
    const draw = interpolate(frame, [0, beats.gather], [0, 0.13], {
      ...clamp,
      easing: Easing.inOut(Easing.quad),
    });
    let pos: P = {
      x: PRE[i].x + (540 - PRE[i].x) * draw + drift.x,
      y: PRE[i].y + (GROUNDS[0] - 130 - PRE[i].y) * draw + drift.y,
    };
    let lit = 0;
    let stage = 0;

    const slot0 = SLOTS[0][i];
    if (t0 > 0) pos = arcAt(pos, slot0, i, t0);
    lit = landed(t0);

    if (fall0 > 0) {
      const rest = ashRest(i, 0);
      pos = { x: slot0.x + (rest.x - slot0.x) * fall0, y: slot0.y + (rest.y - slot0.y) * fall0 };
      lit = 1 - interpolate(frame, [kill0, kill0 + 3], [0, 1], clamp);

      if (SLOT_OF[0].has(i) && t1 > 0) {
        stage = 1;
        const dest = SLOTS[1][SLOT_OF[0].get(i) as number];
        pos = arcAt(rest, dest, i, t1);
        lit = landed(t1);

        const kill1 = killFrame(i, 1, beats.bar2Hit, beats.bar2Land);
        const fall1 = interpolate(frame, [kill1, kill1 + 8], [0, 1], {
          ...clamp,
          easing: Easing.in(Easing.quad),
        });
        if (fall1 > 0) {
          const rest1 = ashRest(i, 1);
          pos = { x: dest.x + (rest1.x - dest.x) * fall1, y: dest.y + (rest1.y - dest.y) * fall1 };
          lit = 1 - interpolate(frame, [kill1, kill1 + 3], [0, 1], clamp);

          if (SLOT_OF[1].has(i) && t2 > 0) {
            stage = 2;
            const dest2 = SLOTS[2][SLOT_OF[1].get(i) as number];
            pos = arcAt(rest1, dest2, i, t2);
            lit = landed(t2);
          }
        }
      }
    }

    // Ignition: the click-bright the sleek pass asks for, kept small because
    // twenty-eight of them land inside ten frames.
    const ignite = (at: number) =>
      interpolate(frame, [at, at + 2, at + 6], [0, 1, 0], clamp);
    const pop =
      ignite(rise0 + 16) +
      (SLOT_OF[0].has(i) ? ignite(launch1 + 14) : 0) +
      (SLOT_OF[1].has(i) ? ignite(launch2 + 15) : 0);

    const breath = 1 + 0.05 * Math.sin(frame * 0.11 + hash(i, 6) * 6.28);
    dots.push({
      x: pos.x,
      y: pos.y,
      r: dotRadius * (0.75 + 0.5 * hash(i, 7)) * breath * (1 + 0.22 * pop),
      opacity: ashOpacity + (litOpacity - ashOpacity) * lit,
      lit,
      stage,
    });
  }

  const litOf = (g: number, slot: number) => {
    const d = dots[dotInSlot(g, slot)];
    return d.stage === g ? d.lit : 0;
  };

  // -- floors ---------------------------------------------------------------
  // A floor draws out from its own centre, recedes when the surface closes over
  // it, and lifts back only while a society is actually standing on it.
  const groundBeats = [beats.ground1, beats.ground2, beats.ground3];
  const grounds = GROUNDS.map((y, g) => {
    const draw = interpolate(frame, [groundBeats[g], groundBeats[g] + 9], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    const closed = interpolate(frame, [beats.surface, beats.surface + 14], [0, 1], clamp);
    const occupied =
      SLOTS[g].reduce((acc, _, s) => acc + litOf(g, s), 0) / SLOTS[g].length;
    const base = 0.9 - (0.9 - groundFloor) * closed;
    return {
      y,
      half: GROUND_HALF * draw,
      opacity: draw * Math.max(base, groundFloor + (0.9 - groundFloor) * occupied),
    };
  });

  const surfaceDraw = interpolate(frame, [beats.surface, beats.surface + 12], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const markIn = 1;

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
            src={staticFile(markSrc)}
            style={{
              position: "absolute",
              left: MARK.x - MARK.size / 2,
              top: MARK.y - MARK.size / 2,
              width: MARK.size,
              height: MARK.size,
              filter: "brightness(0) invert(1)",
              opacity: markOpacity * markIn,
            }}
          />

          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <line
              x1={540 - SURFACE_HALF * surfaceDraw}
              y1={SURFACE_Y}
              x2={540 + SURFACE_HALF * surfaceDraw}
              y2={SURFACE_Y}
              stroke={ink}
              strokeWidth={lineWidth}
              strokeLinecap="round"
              opacity={0.34 * surfaceDraw}
            />
            {surfaceDraw > 0.02 && surfaceDraw < 0.99 ? (
              <>
                <circle cx={540 - SURFACE_HALF * surfaceDraw} cy={SURFACE_Y} r={5} fill={ink} />
                <circle cx={540 + SURFACE_HALF * surfaceDraw} cy={SURFACE_Y} r={5} fill={ink} />
              </>
            ) : null}

            {grounds.map((g, i) => (
              <g key={`floor${i}`}>
                <line
                  x1={540 - g.half}
                  y1={g.y}
                  x2={540 + g.half}
                  y2={g.y}
                  stroke={ink}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  opacity={g.opacity}
                />
                {g.half > 4 && g.half < GROUND_HALF - 4 ? (
                  <>
                    <circle cx={540 - g.half} cy={g.y} r={5} fill={ink} />
                    <circle cx={540 + g.half} cy={g.y} r={5} fill={ink} />
                  </>
                ) : null}
              </g>
            ))}

            {THREADS.map((list, g) =>
              list.map((t, ti) => {
                const a = SLOTS[g][t.a];
                const b = SLOTS[g][t.b];
                const gate = Math.min(litOf(g, t.a), litOf(g, t.b));
                // What a wiped society leaves on its floor is not only dots but
                // the shape it had. The web stays as a ruin at the unknown
                // level, so a dead floor still reads as somewhere a society was.
                const wiped = g === 0 ? beats.bar1Land : beats.bar2Land;
                const ruin =
                  g === 2 ? 0 : interpolate(frame, [wiped, wiped + 12], [0, 0.16], clamp);
                if (gate < 0.02 && ruin < 0.005) return null;
                const w = THREAD_WINDOW[g];
                const start = w.from + t.k * w.span;
                const p = interpolate(frame, [start, start + 7], [0, 1], {
                  ...clamp,
                  easing: Easing.out(Easing.quad),
                });
                if (p <= 0) return null;
                const hx = a.x + (b.x - a.x) * p;
                const hy = a.y + (b.y - a.y) * p;
                const done = interpolate(frame, [start + 7, start + 11], [1, 0], clamp);
                // One ambient layer: packets running the finished threads,
                // capped so a hold is never still and never busy.
                const carries = ti % 5 === 0 && p >= 1;
                const u = (frame * 0.018 + t.k) % 1;
                return (
                  <g key={`t${g}-${ti}`}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={hx}
                      y2={hy}
                      stroke={accent}
                      strokeWidth={threadWidth}
                      strokeLinecap="round"
                      opacity={Math.max(gate * (0.34 + 0.26 * done), ruin * p)}
                    />
                    {p < 1 ? <circle cx={hx} cy={hy} r={4} fill={ink} opacity={gate} /> : null}
                    {carries ? (
                      <circle
                        cx={a.x + (b.x - a.x) * u}
                        cy={a.y + (b.y - a.y) * u}
                        r={3.5}
                        fill={ink}
                        opacity={gate * ambient}
                      />
                    ) : null}
                  </g>
                );
              }),
            )}

            {dots.map((d, i) => (
              <circle key={`d${i}`} cx={d.x} cy={d.y} r={d.r} fill={accent} opacity={d.opacity} />
            ))}

            {[0, 1].map((g) => {
              const b = barState(g);
              if (!b) return null;
              const half = SOC_W[g] / 2 + 30;
              return (
                <g key={`bar${g}`} opacity={b.opacity}>
                  <line
                    x1={540}
                    y1={Math.max(SURFACE_Y, b.y - 380)}
                    x2={540}
                    y2={b.y}
                    stroke={ink}
                    strokeWidth={1.5}
                    opacity={b.stem}
                  />
                  <line
                    x1={540 - half}
                    y1={b.y}
                    x2={540 + half}
                    y2={b.y}
                    stroke={ink}
                    strokeWidth={lineWidth}
                    strokeLinecap="round"
                  />
                  <circle cx={540 - half} cy={b.y} r={6} fill={ink} />
                  <circle cx={540 + half} cy={b.y} r={6} fill={ink} />
                </g>
              );
            })}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ThreeSecretSocieties;
