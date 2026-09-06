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
  ashOpacity: 0.3,
  litOpacity: 0.95,
  groundFloor: 0.42,
  ambient: 0.38,
  beats: {
    ground1: 2,
    ground2: 11,
    ground3: 17,
    surface: 28,
    camIn: 30,
    gather: 51,
    started: 73,
    bar1In: 87,
    bar1Hit: 92,
    bar1Land: 104,
    launch1: 110,
    arrive1: 128,
    bar2In: 129,
    bar2Hit: 134,
    bar2Land: 142,
    camOut: 146,
    launch2: 150,
    arrive2: 165,
  },
});

type P = { x: number; y: number };

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// The world
//
// Three floors stacked up a tall world, an ink surface above all of them, and
// the OpenAI mark above that. Everything happens under the surface: that is
// what "secret" buys, and it is also where the wipe comes from later, so the
// one line does both jobs.
// ---------------------------------------------------------------------------
const WORLD_W = 1080;
const WORLD_H = 3400;

const MARK = { x: 540, y: 1055, size: 118 };
const SURFACE_Y = 1220;
const SURFACE_HALF = 430;
const GROUNDS = [2600, 2150, 1700]; // first society lowest, third highest
const GROUND_HALF = 340;

// Each society is tighter and more heavily threaded than the one before it.
// The population shrinks — some of it stays on the floor as ash — so the
// organisation has to come from density, not from headcount.
const SOC_W = [620, 560, 500];
const SOC_H = [200, 186, 172];
const CLEAR = 58; // gap between the lowest crowd row and its own floor
const ROWS = 4;

// One population, conserved. Nothing new ever enters the frame — each society
// is built out of the previous one's dead, minus the ones left lying on the
// floor as ash. 34 -> 28 -> 22.
const POP = 34;
const LEFT_BEHIND = 6;
const COUNTS = [POP, POP - LEFT_BEHIND, POP - 2 * LEFT_BEHIND];

// A crowd, not a lattice: each dot is thrown off its cell by up to 90% of the
// step and its radius varied, so the population reads as organic.
const layout = (gen: number): P[] => {
  const count = COUNTS[gen];
  const cols = Math.ceil(count / ROWS);
  const sx = SOC_W[gen] / cols;
  const sy = SOC_H[gen] / ROWS;
  const top = GROUNDS[gen] - CLEAR - SOC_H[gen];
  const pts: P[] = [];
  for (let s = 0; s < count; s++) {
    pts.push({
      x:
        540 -
        SOC_W[gen] / 2 +
        ((s % cols) + 0.5) * sx +
        (hash(s, 11 + gen) - 0.5) * sx * 0.9,
      y: top + (Math.floor(s / cols) + 0.5) * sy + (hash(s, 23 + gen) - 0.5) * sy * 0.9,
    });
  }
  return pts;
};
const SLOTS = [layout(0), layout(1), layout(2)];

// Who dies where is drawn from a shuffled roll rather than an index range, so
// the ash left on a floor is scattered through the crowd's whole width instead
// of piling up in whichever corner held the lowest indices. Survivors are then
// shuffled again into their new slots, so the arcs cross on the way up rather
// than everyone rising in their own column.
const ROLL = Array.from({ length: POP }, (_, i) => i).sort(
  (a, b) => hash(a, 91) - hash(b, 91),
);
const survivors = (from: number) =>
  ROLL.slice(from).sort((a, b) => hash(a, 5 + from) - hash(b, 5 + from));
const TRAVEL = [survivors(LEFT_BEHIND), survivors(2 * LEFT_BEHIND)];
const SLOT_OF: Map<number, number>[] = TRAVEL.map((ids) => {
  const m = new Map<number, number>();
  ids.forEach((id, s) => m.set(id, s));
  return m;
});
// Which dot is standing in slot `s` of generation `g`.
const dotInSlot = (g: number, s: number) => (g === 0 ? s : TRAVEL[g - 1][s]);

// Where the population lies before any of it organises: loose on and around the
// first floor, so the first society rises off the ground exactly the way the
// second and third ones will.
const PRE: P[] = [];
for (let i = 0; i < POP; i++) {
  PRE.push({
    x: 540 + (hash(i, 41) - 0.5) * 800,
    y: GROUNDS[0] - 30 - hash(i, 43) * 360,
  });
}

// Ash lies in a loose band on the floor it died on, spread wider than the
// crowd was so a dead floor still reads as a floor with something on it.
const ashRest = (i: number, gen: number): P => ({
  x: SLOTS[gen][gen === 0 ? i : (SLOT_OF[gen - 1].get(i) as number)].x + (hash(i, 45) - 0.5) * 96,
  y: GROUNDS[gen] - 9 - hash(i, 47) * 16,
});

// Threads between near neighbours. The count climbs each generation — the
// crowd shrinks each time but binds itself harder: 16 -> 22 -> 28 threads.
const THREAD_COUNTS = [16, 22, 28];
type Thread = { a: number; b: number; k: number };
const threadsFor = (g: number): Thread[] => {
  const p = SLOTS[g];
  const cand: Thread[] = [];
  for (let a = 0; a < p.length; a++) {
    for (let b = a + 1; b < p.length; b++) {
      if (Math.hypot(p[a].x - p[b].x, p[a].y - p[b].y) < 155) {
        cand.push({ a, b, k: hash(a * 97 + b, 71 + g) });
      }
    }
  }
  cand.sort((x, y) => x.k - y.k);
  return cand.slice(0, THREAD_COUNTS[g]);
};
const THREADS = [threadsFor(0), threadsFor(1), threadsFor(2)];

const THREAD_WINDOW = [
  { from: 58, span: 16 },
  { from: 124, span: 8 },
  { from: 160, span: 12 },
];

// ---------------------------------------------------------------------------
// The wipe
//
// A full-width ink rule that drops out of the surface, flattens a society onto
// its own floor and lifts away again. A dot's death is read off the bar's
// position, never off a parallel timer, so the two cannot drift: the sweep is
// linear between hit and land, which makes the crossing frame for any given
// dot exact rather than searched for.
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
// Two moves, two holds. Wide on three empty floors, in for the first society,
// then one long pull-back that resolves on all three at once. The second
// society needs no move of its own: at k = 1.15 its floor is already in the
// upper third of the held frame, so the ash simply travels up the picture and
// the recurrence stays legible in one shot. A damped follow rounds the corners
// off the coarse key track below; the small drift across the long hold keeps
// the frame from going dead while the action climbs.
// ---------------------------------------------------------------------------
const CAM_F = [0, 30, 42, 146, 162, DURATION];
const CAM_CY = [1957, 1957, 2400, 2360, 1957, 1957];
const CAM_K = [0.82, 0.82, 1.15, 1.15, 0.82, 0.82];

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

const BG_OVERSIZE = 1.8;

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
    { in: beats.bar1In, hit: beats.bar1Hit, land: beats.bar1Land, out: beats.bar1Land + 2 },
    { in: beats.bar2In, hit: beats.bar2Hit, land: beats.bar2Land, out: beats.bar2Land + 2 },
  ];

  const barState = (gen: number) => {
    const b = bars[gen];
    const { top, ground } = barSpan(gen);
    const lift = b.out + 8;
    if (frame < b.in || frame > lift + 4) return null;
    let y: number;
    if (frame <= b.hit) {
      y = interpolate(frame, [b.in, b.hit], [top - 250, top], {
        ...clamp,
        easing: Easing.in(Easing.quad),
      });
    } else if (frame <= b.land) {
      y = interpolate(frame, [b.hit, b.land], [top, ground], clamp);
    } else {
      y = interpolate(frame, [b.out, lift], [ground, top - 250], {
        ...clamp,
        easing: Easing.in(Easing.quad),
      });
    }
    const opacity =
      interpolate(frame, [b.in, b.in + 4], [0, 1], clamp) *
      interpolate(frame, [lift - 6, lift + 4], [1, 0], clamp);
    return { y, opacity };
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
      y: PRE[i].y + (GROUNDS[0] - 160 - PRE[i].y) * draw + drift.y,
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
              opacity={0.55 * surfaceDraw}
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
                  g === 2 ? 0 : interpolate(frame, [wiped, wiped + 12], [0, 0.1], clamp);
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
              const half = SOC_W[g] / 2 + 52;
              return (
                <g key={`bar${g}`} opacity={b.opacity}>
                  <line
                    x1={540}
                    y1={Math.max(SURFACE_Y, b.y - 380)}
                    x2={540}
                    y2={b.y}
                    stroke={ink}
                    strokeWidth={1.5}
                    opacity={0.2}
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
