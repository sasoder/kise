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
// SRT 1.399s -> 8.839s. round(7.440 * 24) = 179 frames, plus a 16 frame tail
// so the last opening arc can settle before the piece holds resolved.
export const DURATION = 195;

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
    ground1: 2,
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
    x: 540 + (hash(i, 41) - 0.5) * 680,
    y: GROUNDS[0] - 18 - hash(i, 43) * 168,
  });
}

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
// Same model as `DarkAboutTheScope`, so the two cuts move in one hand: a shot is
// an anchor (the world point that sits in the caption-safe band) and a zoom, one
// damped progress walks the shot list, zoom is interpolated in log space so a
// constant rate there is a constant rate on screen, and the centre is not
// authored at all — for any two framings there is exactly one world point that
// lands on the same pixel in both, so that point is held still and only the
// scale changes. Every transition is a pure zoom with no pan in it.
//
// This is cut for short form, so it is never parked: a slow monotonic push runs
// under everything, and every "hold" below is short. The shots alternate tight
// and wide on purpose — sit on the society that is alive, snap out when its
// wipe lands, ride back in on the next one — which keeps something opening or
// closing on screen at all times.
//
// Pushing in this far used to cost the count, and no longer does: the floors are
// 380 apart and a spent one keeps its doubled rule, its ash and the ghost of its
// web, so the working frame (the live society centred, the spent floor below it,
// the empty floor above) says where we came from, where we are, and where this
// is going, all at once.
// ---------------------------------------------------------------------------
type Shot = { anchor: number; k: number };
const SHOTS: Shot[] = [
  { anchor: 2470, k: 1.18 }, // the loose crowd, before any of it is organised
  { anchor: 1915, k: 0.86 }, // three floors
  { anchor: 2457, k: 1.1 }, // arriving on the first society
  { anchor: 2457, k: 1.24 }, // and still closing on it while it lives
  { anchor: 2450, k: 0.98 }, // the wipe lands
  { anchor: 2083, k: 1.3 }, // the second society, the first one spent below it
  { anchor: 2060, k: 1.02 }, // the wipe lands again, faster
  { anchor: 1709, k: 1.24 }, // the third
  { anchor: 1915, k: 0.91 }, // all of it
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

// Shots 2 and 3 share an anchor and differ only in zoom, which makes that
// transition a pure push straight into the first society — 30 frames of slow
// closing across its whole life. Measured on the render, the version without it
// had a 15 frame stretch where the picture barely changed, right in the middle
// of the beat that has to sell what a society is.
//
// Every shot gets a hold, including the ones the camera only passes through.
// Without one, progress crosses an integer at full speed and the camera slams
// straight from zooming out into zooming in — the shot list alternates tight and
// wide, so every boundary is a reversal, and a reversal at speed is a kink in
// the velocity even when the position is continuous.
const CAM_F = [0, 5, 24, 36, 50, 60, 90, 96, 106, 114, 126, 138, 150, 156, 168, 174, 188, DURATION];
const CAM_P = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
const CAM_CREEP = 0.00045;

// Critically damped. At zeta 0.78 the progress overshot each hold and settled
// back through it, so `Math.floor(p)` ran 2 -> 1 -> 2 and the camera crossed the
// same shot boundary three times.
const CAM_STIFF = 0.16;
const CAM_DAMP = 0.8;

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

  // The pivot solve is only exact when the zoom really is the authored one, so
  // the base framing is computed without the creep. Folding the creep into `k`
  // before this line detunes both ends of every segment, and since neighbouring
  // segments have different pivots they then disagree about where the centre is
  // at the shot they share — a step of up to 136px in a single frame.
  const kBase = Math.exp(
    Math.log(SHOTS[i].k) + (Math.log(SHOTS[i + 1].k) - Math.log(SHOTS[i].k)) * t,
  );
  const pv = PIVOTS[i];
  const cyBase = pv
    ? pv.w - (pv.sy - 960) / kBase
    : SHOT_CY[i] + (SHOT_CY[i + 1] - SHOT_CY[i]) * t;

  // The creep is then its own zoom, about the anchor the shot already puts in
  // the caption-safe band. That point stays pinned, so this cannot move the
  // centre discontinuously no matter where in the shot list it is applied.
  const k = kBase * (1 + CAM_CREEP * upto);
  return { cy: cyBase - 125 / kBase + 125 / k, k };
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
  const bgY = -(cy - SHOT_CY[0]) * k * parallax - frame * 0.25;
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
      x: PRE[i].x + (540 - PRE[i].x) * draw,
      y: PRE[i].y + (GROUNDS[0] - 130 - PRE[i].y) * draw,
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

    // Nothing on this canvas is ever completely still. A settled society sways;
    // ash on a floor sways a third as much, because it is dead.
    const sway = 0.35 + 0.65 * lit;
    const breath = 1 + 0.05 * Math.sin(frame * 0.11 + hash(i, 6) * 6.28);
    dots.push({
      x: pos.x + 6 * sway * Math.sin(frame * 0.055 + hash(i, 3) * 6.28),
      y: pos.y + 5 * sway * Math.cos(frame * 0.047 + hash(i, 4) * 6.28),
      r: dotRadius * (0.75 + 0.5 * hash(i, 7)) * breath * (1 + 0.22 * pop),
      opacity: ashOpacity + (litOpacity - ashOpacity) * lit,
      lit,
      stage,
    });
  }

  // When a dot finishes arriving in generation `g` — the same expressions the
  // dot loop uses to move it, so a thread can never start before its own ends.
  const settledAt = (g: number, id: number) =>
    g === 0
      ? beats.gather + hash(id, 53) * 10 + 16
      : g === 1
        ? beats.launch1 + hash(id, 59) * 8 + 14
        : beats.launch2 + hash(id, 61) * 9 + 15;

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
  // The mark is the place, not an actor: it bows out rather than being sliced
  // in half by the top edge whenever the camera pushes past it.
  const markIn = interpolate(
    (MARK.y - MARK.size / 2 - cy) * k + 960,
    [40, 130],
    [0, 1],
    clamp,
  );

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
                const idA = dotInSlot(g, t.a);
                const idB = dotInSlot(g, t.b);
                const gate = Math.min(litOf(g, t.a), litOf(g, t.b));
                // A live web hangs off the dots themselves so it sways with
                // them; a ruin stays pinned to the slots its society stood in.
                const live = gate > 0.02;
                const a = live ? dots[idA] : SLOTS[g][t.a];
                const b = live ? dots[idB] : SLOTS[g][t.b];
                // What a wiped society leaves on its floor is not only dots but
                // the shape it had. The web stays as a ruin at the unknown
                // level, so a dead floor still reads as somewhere a society was.
                const wiped = g === 0 ? beats.bar1Land : beats.bar2Land;
                const ruin =
                  g === 2 ? 0 : interpolate(frame, [wiped, wiped + 12], [0, 0.16], clamp);
                if (gate < 0.02 && ruin < 0.005) return null;
                const start = Math.max(settledAt(g, idA), settledAt(g, idB)) + 1 + t.k * 4;
                const p = interpolate(frame, [start, start + 6], [0, 1], {
                  ...clamp,
                  easing: Easing.out(Easing.quad),
                });
                if (p <= 0) return null;
                const hx = a.x + (b.x - a.x) * p;
                const hy = a.y + (b.y - a.y) * p;
                const done = interpolate(frame, [start + 6, start + 10], [1, 0], clamp);
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
