import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { INK, INK_HI, Label, PAPER, RED, RED_DEEP, Stage, mixHex, paperShadow } from "./chinatalkShared";
import { FRAME_H, FRAME_W, breath, makeTone } from "./fieldShared";
import {
  DOT_R,
  DURATION,
  FPS,
  LABEL_MIN_PX,
  LABEL_TEXT,
  NSEAT,
  REST_CAM,
  RING_R,
  SEATS,
  SLOTS,
  THREAD_OP,
  camAt,
  headR,
  labelGeom,
  readAt,
  ringW,
  threadW,
  threadsAt,
} from "./finiteJobsGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// FiniteJobs — Jordan Schneider, "Hu Jintao's 25 million jobs" (ChinaTalk),
// graphic 48 take 3. Delivered under the existing name 48_BigSwathsNoJob.mov.
//
// CHECK LINE: "The jobs are a small, countable block that is already full; the
// crowd reaching for them goes on further than you can see."
//
// THE LINE (edit timeline, 24 fps; IN = 48.667 s = edit frame 1168; local frame
// = start_f - 1168; DURATION = 144 = the slot exactly, cut back on f144):
//   "(when) you have (7, 11) big (20) swaths (29) of the economy (42-56) that
//   can't (56, 62) get a job (68-83) in general (83-95) or a job (95-110) that
//   they think (111-127) befits (127-139) (all the hard work ...)"
//
// THE LANGUAGE is the client's Orange Dwarkesh agent-crowd language, drawn in
// ChinaTalk materials. Mechanics are imported from fieldShared (hash, breath,
// makeTone, camMove / runCamera, sway through the Stage, DOT_RADIUS), materials
// from chinatalkShared (Stage, Label, paperShadow, tokens, the size law). The
// world (seats, clearing, wave, camera, thread schedule) is finiteJobsGeom.ts.
//   ground    the rice-paper Stage (grain, warm vignette); no grid, no dim
//   dots      solid, no stroke; makeTone(RED_DEEP, RED): deep at rest, vermilion
//             once the read-wave has passed; ONE group-level warm paper shadow
//             under the crowd
//   ink       INK at the 0.90 rung where Dwarkesh uses white: the ring slots,
//             the dot of a taken slot, thread heads, the label
//   threads   RED at the Dwarkesh live-thread opacity (0.95), a small INK head
//             at the tip
//   type      the kit's Label, word class, floored at 40 screen px on the wide
// SIZES, and where they leave the Dwarkesh numbers (checked at 270 px):
//   pitch     the Dwarkesh pitch 940/39 x 440/29, jitter 0.9, radius 0.75-1.25
//   dot       radius 6.8, not 5.5. At the Dwarkesh size the field covers 26 %
//             of the paper and read thin and pink at 270 px; scaling radius AND
//             pitch up together (x1.3) keeps that 26 % and still read thin, so
//             only the radius grew, to DepartmentOfWarOpen's 6.8 (40 % cover):
//             a red mass on the wide, distinct dots in the close shot. No stroke.
//   spacing   the dots are INDIVIDUALS: one relaxation at module load parts any
//             two that overlap until they just touch (centres >= 1.03 x the sum
//             of their radii), and nothing else moves, so the scatter stays a
//             crowd and never a lattice. No pair overlaps at rest; at the top
//             of their breath the worst pair overlaps 5 % of the smaller
//             radius; cover stays 40 %. The Dwarkesh lit swell (x1.35 on a dot
//             with its thread out) is given only as far as each dot has room.
//   rings     radius 14 (the Dwarkesh ring), pitch 3 radii, stroke the kit's
//             INK_W (3.5, also the Dwarkesh ring weight)
//   threads   0.6 x the kit's DATA_W = 5.4 (Dwarkesh: 3): a vermilion line over
//             a lit vermilion crowd only reads where it crosses paper. Head =
//             the kit's INK_BEAD_R. Strokes and heads go through the size law.
// DEPARTURES from the Dwarkesh thread, so the two outcomes can be told apart:
//   * a head is never without its line: it grows out of the line once the line
//     shows past its dot, and stays on the tip for the thread's whole life;
//   * an ACCEPTED thread's head lands INSIDE a free ring, its dot rides the
//     thread in, pure red, and once it is seated the ink grows from that head
//     over it (6 frames, a crisp disc: every frame is paper, red, ink, or ink
//     over red with a hard edge);
//   * a REJECTED thread's head stops AT the rim of a taken ring, holds there
//     about 5 frames, then the thread RETRACTS along its own line back into
//     its dot at the speed it came. It never fades in place: that is the "no".
// No idle crowd-to-crowd traffic: here every thread is an application.
//
// THE PICTURE: three element types and one label. The field (young people), the
// jobs (5 x 3 ring slots: an empty slot a ring, a taken one a ring with an ink
// dot), threads (applications), and JOBS.
//
// THE MOTION, one continuous development:
//   1. The cut opens inside the crowd, close on the block (it fills half the
//      frame width), already moving: eight slots are taken, the crowd around
//      the clearing is lit, and one thread every 2.5 frames draws from a lit
//      rim dot into a free ring; that dot rides its own thread in and is inked
//      once seated. At f0 every slot is empty, taken, or has a dot visibly on
//      its way in; the last dot is seated on f21 and the block is full on f27.
//   2. From f28 every thread stops at the rim of the full block, holds, and
//      retracts into its dot, which stays where it was, lit. The read-wave
//      spreads out from the clearing at one steady pace (13.6 world px a frame)
//      that outruns the camera: its front is past every frame edge by f60. A
//      thread can only start from a lit dot, so the threads come from farther
//      and farther out, and their count and tempo climb on one curve, capped
//      so the block stays legible on a phone (never more than 12 threads
//      alive, reached f84-98; the cap on heads waiting at the rim is 5 and 4
//      is the most that happens). Live threads fan out: no two leave on one
//      bearing, and none dead opposite another.
//   3. The pull-back (one camMove, eased in log zoom so its speed is at the cut:
//      k 2.71 at f0, 1.28 at f62, 1.00 at f120) settles around f120 with the
//      block 196 px wide at screen y 800 and lit crowd to all four edges. The
//      hold is the lit field breathing, a slow residual drift (k 0.985 at f143)
//      and three long threads on clear diagonals from three sides: at the cut
//      one is retracting, one is holding at the rim, one is arriving. Nothing
//      runs up or down the centre line.
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const tone = makeTone(RED_DEEP, RED);
const toHex = (rgb: string) =>
  `#${(rgb.match(/\d+/g) ?? []).map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`;
/** the 0.90 rung as an opaque colour, so overlaps never double up */
const INK90 = toHex(mixHex(PAPER, INK, INK_HI));
/** screen px of slack around the frame before a dot is culled (sway + shadow) */
const CULL = 60;
/** The kit's paper shadow at a fraction of its own strength (its alpha is read
 *  off the kit's string, not restated): a seated dot settles flat as it inks. */
const liftShadow = (k: number, lift: number) =>
  lift >= 0.999 ? paperShadow(k) : paperShadow(k).replace(/([\d.]+)\)\)$/, (_, a) => `${(Number(a) * lift).toFixed(4)}))`);

const FiniteJobs: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const k = cam.k;
  const { lit, gone, ink, lines, heads, travellers } = threadsAt(frame, k);

  // the field: only what the camera can see
  const hw = (FRAME_W / 2 + CULL) / k;
  const hh = (FRAME_H / 2 + CULL) / k;
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < NSEAT; i++) {
    if (gone[i]) continue;
    const s = SEATS[i];
    if (Math.abs(s.x - cam.x) > hw || Math.abs(s.y - cam.y) > hh) continue;
    const l = lit[i];
    const read = readAt(s.dRel, frame);
    const r = DOT_R * s.r * breath(frame, s.b) * (1 + s.swell * l);
    dots.push(
      <circle key={i} cx={s.x.toFixed(2)} cy={s.y.toFixed(2)} r={r.toFixed(2)} fill={tone(read + (1 - read) * l)} />,
    );
  }

  const tw = threadW(k).toFixed(3);
  const hr = headR(k);
  const rw = ringW(k).toFixed(3);
  const label = labelGeom(k);

  return (
    <Stage S={frame} cam={cam} rest={REST_CAM}>
      {/* the crowd and its threads: red, on one warm paper shadow */}
      <g style={{ filter: paperShadow(k) }}>
        {dots}
        {lines.map((t) => (
          <line
            key={t.key}
            x1={t.x1.toFixed(2)}
            y1={t.y1.toFixed(2)}
            x2={t.x2.toFixed(2)}
            y2={t.y2.toFixed(2)}
            stroke={RED}
            strokeWidth={tw}
            strokeLinecap="round"
            opacity={THREAD_OP}
          />
        ))}
      </g>

      {/* thread heads: ink, flat; a head grows out of its line, never ahead of it */}
      {heads.map((h) =>
        h.s > 0.02 ? <circle key={h.key} cx={h.x.toFixed(2)} cy={h.y.toFixed(2)} r={(hr * h.s).toFixed(3)} fill={INK90} /> : null,
      )}

      {/* a dot on its way into a ring: pure red until the ink has covered it */}
      {travellers.map((t) => (
        <circle
          key={t.key}
          cx={t.x.toFixed(2)}
          cy={t.y.toFixed(2)}
          r={t.r.toFixed(2)}
          fill={RED}
          style={t.lift > 0.01 ? { filter: liftShadow(k, t.lift) } : undefined}
        />
      ))}

      {/* the jobs: ink, flat. A slot's ink is the landed head, then grows over the seated dot. */}
      {SLOTS.map((s, i) => (
        <g key={i}>
          {ink[i] > 0 ? <circle cx={s.x} cy={s.y} r={ink[i].toFixed(3)} fill={INK90} /> : null}
          <circle cx={s.x} cy={s.y} r={RING_R} fill="none" stroke={INK90} strokeWidth={rw} />
        </g>
      ))}

      <Label text={LABEL_TEXT} x={0} y={label.y} k={k} size="word" rung={INK_HI} minPx={LABEL_MIN_PX} />
    </Stage>
  );
};

export default FiniteJobs;
