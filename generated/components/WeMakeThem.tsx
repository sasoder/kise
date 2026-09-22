import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_BASE,
  BG_DIM,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { camKnots3, runCam3 } from "./alignShared";
import {
  ACCENT,
  ACCENT_DEEP,
  ARROW_BASE,
  CUT_OFFSETS,
  FPS,
  GUIDE_DRAW_V,
  GUIDE_G0,
  INK,
  MARK,
  MARK_R,
  PACKET_V,
  PEOPLE,
  PEOPLE_Y,
  SPEED_CAP_SCREEN,
  World,
  arrowOf,
  bounds,
  copyGeom,
  nodesAt,
  sched,
  stateAt,
} from "./degradationShared";

export { FPS };

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Alignment_Degradation`, cut 1 of five: `WeMakeThem`.
// Line (SRT 0:04.440 -> 0:07.019):
//   "we make them, we make them, we think what we think is aligned,"
//
// THE CLIP'S ONE IDEA: **Alignment is passed on, generation to generation,
// like a copy of a copy. Each generation is made by the one before it and
// inherits its idea of "aligned" — with a little error. Left alone the errors
// compound and the lineage curls away from what the humans wanted; corrected
// every generation, it straightens onto the humans' line.**
//
// This cut is the FIRST LINK of that chain, and it is the whole grammar of the
// clip in one build: five people, an arrow that is what they think aligned is,
// a generation made along it, and the same arrow copied up to the generation so
// that the next one can be made the same way.
//
// VOCABULARY — `degradationShared`'s, and nothing is invented here. The world
// is ONE 790-frame timeline; this cut is a window onto G0-77 with a camera on
// it. Nothing below keys anything to a cut frame: the picture is `stateAt(G)`.
//
// DURATION. 2.579 s of speech x 24 = 61.9 -> 62 frames, plus the set's 16-frame
// tail: DURATION = 62 + 16 = 78. CUT_OFFSET 0, so G = frame.
//
// Word -> frame (24 fps from the cut's in-point):
//   we 0 · make 4 · them 18 · we 24 · make 30 · them 35 · we 42 · think 43 ·
//   what 46 · we 49 · think 51 · is 53 · aligned 56 · (speech ends 62)
//
// SOUND-OFF READING TEST — one sentence:
//   "five people send a white arrow straight up, threads and packets stream up
//    it, an orange mark appears where the arrow points, a dashed line carries
//    that same direction off the top of the frame, and then the arrow itself is
//    copied up onto the new mark."
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous motion. The words are where it LANDS; every gesture
// below is the world's own schedule, not a decoration.
//
//  1. f0-14    "we" (0)           THE HUMANS' ARROW draws head-led straight up
//              "make" (4)         out of the group: WHAT THEY THINK ALIGNED IS.
//                                 It is the only thing in the world besides the
//                                 five people, and it is already drawing on the
//                                 first frame.
//
//  2. f6-16    "make" (4)         FIVE BUILD THREADS rise from the five heads
//                                 toward the empty spot the arrow points at.
//                                 Head-led, one per person, never in unison.
//
//  3. f10-36   "them" (18)        THE BUILD. White packets stream up the arrow
//              "we make them"     and up the five threads and GENERATION 1 is
//              (24/30/35)         revealed by a circular mask growing from its
//                                 centre as they land. The doubled phrase is
//                                 ONE build with TWO PACKET SURGES (f10 and
//                                 f26) — not two builds — and the mark is
//                                 complete on the second "them" (f35).
//
//  4. f8-48    "we think" (42/43) THE ONE GLIDE. k 1.47 -> 1.375 and the camera
//              (camera)           rises 148 world px, warp 0.8, landing at f48
//                                 — 8 frames before "aligned". The people sink
//                                 down the frame and the empty field above the
//                                 mark opens, because something is coming.
//
//  5. f36-78   "think" (43)       THE GUIDE. The humans' direction extended to
//                                 infinity: a dashed line drawing head-led up
//                                 from the base THROUGH the mark and off the
//                                 top of the frame, marching from its first
//                                 frame. ON THE GUIDE = ALIGNED, and everything
//                                 the rest of the clip does is measured off it.
//
//  6. f40-54   "what we think is" THE COPY. The humans' arrow DUPLICATES: the
//              (46/49/51/53)      copy slides 220 px up its own direction,
//                                 turning by 0.5 deg on the way — invisible, BY
//                                 DESIGN, because gen 1 is 99.2% aligned — and
//                                 lands as gen 1's OWN arrow, pointing at empty
//                                 space. "aligned" (56) lands two frames after
//                                 it settles, on a generation holding its own
//                                 idea of up.
//
//  7. f56-78   (tail)             The threads fade to nothing over f56-76; the
//                                 first idle ACCENT packets appear on gen 1's
//                                 new arrow; the dashes march; the camera is
//                                 still creeping upward on the last frame. THE
//                                 CUT DOES NOT RESOLVE — gen 1's arrow points
//                                 at nothing yet.
//
// AMBIENT ONLY: each mark's and each person's own <= 3 px drift on its own two
// periods; the guide's dashes; idle packets on every standing arrow; the grid's
// parallax and -0.3 px/frame drift; the camera's `sway` and its never-zero
// creep. No springs, flashes, ripples, glows, labels or text.
//
// ---------------------------------------------------------------------------
// THE CAMERA — one keyed track, authored as a SUM of eased segments (so there
// is no junction for the move to stop at), Gaussian-rounded, then through the
// set's damper `runCam3`, with 40 frames of pre-roll so nothing starts from a
// standing start.
//
//   the pre-roll   f-40 -> 8   content y -16, k 1.478 -> 1.470. The camera is
//                              already creeping at f0.
//   THE GLIDE      f8 -> 40    content y -> C_LAND, k -> K_LAND, warp 0.8. It
//                              is authored to finish at f40 because the damper
//                              lags: measured, the damped shot is 96% of the
//                              way there at f48 and settles into the creep.
//   the creep      f42 -> 190  content y -60, k -0.02, of which the cut sees
//                              only the first quarter: still moving at f77.
//
// MEASURED at the landing (f48, k 1.3758): the mark is 121.1 screen px across,
// the people's nominal centre sits at screen y 1254, gen 1 at 851, its arrow's
// tip at 628, and the lowest bright ink — the outer person's foot — at 1357,
// rising to 1379 by the last frame as the creep runs on. From f48 to the end
// the ink stays inside screen x 111..966; the opening frame is wider on purpose
// and runs to 84..996.
//
// (The cut brief asked for 1250 / 830 / 640 at k 1.25. The zoom was tightened to
// 1.375 on the director's note that the landing read as a small pyramid in the
// lower half. The people-to-gen-1 distance is FIXED by the world at 293.5 world
// px — 49.6 to the top of the highest head's ink, 30 of air, 220 of arrow — so
// no zoom puts the people and gen 1 the brief's 420 screen px apart AND keeps
// the row inside the caption-safe band; 1.375 is where the row's outer ink
// lands on x 114.4 with the camera's 3 px of lateral sway spent.)
// ---------------------------------------------------------------------------

export const CUT_OFFSET = CUT_OFFSETS.WeMakeThem;
export const DURATION = 78;

const WORLD_W = 1080;
const WORLD_H = 1920;
const LAST = DURATION - 1;
const PRE = 40;
const FIRST = -PRE;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  beats: z.object({
    we: z.number(),
    make: z.number(),
    them: z.number(),
    we2: z.number(),
    make2: z.number(),
    them2: z.number(),
    weThink: z.number(),
    think: z.number(),
    what: z.number(),
    we3: z.number(),
    think2: z.number(),
    is: z.number(),
    aligned: z.number(),
    end: z.number(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  beats: {
    we: 0,
    make: 4,
    them: 18,
    we2: 24,
    make2: 30,
    them2: 35,
    weThink: 42,
    think: 43,
    what: 46,
    we3: 49,
    think2: 51,
    is: 53,
    aligned: 56,
    end: 62,
  },
});

// ---------------------------------------------------------------------------
// THE CAMERA.
// ---------------------------------------------------------------------------
const seg = (f: number, f0: number, f1: number, warp = 1) => camEase((f - f0) / (f1 - f0), warp);

const CX = 540; // the whole picture stands on the world's x axis in this cut

// THE ZOOM. Tightened from 1.35 -> 1.25 on the director's note that the landing
// read as "a small pyramid in the lower half". 1.375 is not 1.40 and the 25 px
// is the PEOPLE ROW: it is the widest object in the clip at 619.12 world px of
// ink, so it spans 540 +/- 309.56 * k on screen and the caption-safe left edge
// (110, with the camera's own 3 px of lateral sway spent) is reached at
// k = 1.3794. 1.375 lands the row at screen x 114.4..965.6 — 4 px of margin on
// the house band — and puts 123 screen px across the mark. Anything past that
// and the outer two people start leaving the safe band at the LANDING, which is
// the frame the line rests on.
const K_OPEN = 1.47;
const K_LAND = 1.375;
/** The world y that sits on screen y 835 at the open and at the landing. The
 *  landing is solved for the LOWEST BRIGHT INK — the outer person's foot — at
 *  screen y 1362, which leaves the creep that follows it room to run for the
 *  rest of the cut and still finish inside 1380. */
const C_OPEN = PEOPLE_Y - (1080 - 835) / K_OPEN;
const INK_FOOT = bounds(0).y1;
const C_LAND = INK_FOOT - (1362 - 835) / K_LAND;

const GLIDE_F0 = 8;
const GLIDE_F1 = 40;
const CREEP_F0 = 42;
const CREEP_F1 = 190;

const contentYOf = (f: number) =>
  C_OPEN +
  16 * (1 - seg(f, FIRST, GLIDE_F0, 1.3)) -
  (C_OPEN - C_LAND) * seg(f, GLIDE_F0, GLIDE_F1, 0.8) -
  60 * seg(f, CREEP_F0, CREEP_F1, 0.9);

const kOf = (f: number) =>
  K_OPEN +
  0.008 * (1 - seg(f, FIRST, GLIDE_F0, 1.3)) -
  (K_OPEN - K_LAND) * seg(f, GLIDE_F0, GLIDE_F1, 0.8) -
  0.02 * seg(f, CREEP_F0, CREEP_F1, 0.9);

/** The Gaussian the set runs before the damper: no lag of its own, it only
 *  rounds curvature so the damper is handed a C2 target. */
const CAM_SMOOTH = 5;
const CAM = (() => {
  const hold = (fn: (f: number) => number) => (f: number) =>
    fn(Math.max(FIRST, Math.min(CREEP_F1, f)));
  const gauss = (src: (f: number) => number, f: number) => {
    const w = Math.ceil(3 * CAM_SMOOTH);
    let num = 0;
    let den = 0;
    for (let d = -w; d <= w; d++) {
      const g = Math.exp(-(d * d) / (2 * CAM_SMOOTH * CAM_SMOOTH));
      num += g * src(f + d);
      den += g;
    }
    return num / den;
  };
  const y = hold(contentYOf);
  const kk = hold(kOf);
  const knots = [];
  for (let f = FIRST; f <= LAST + 2; f++) {
    knots.push({ f: f - FIRST, k: gauss(kk, f), x: CX, y: gauss(y, f) });
  }
  return camKnots3(knots, LAST + 2 - FIRST);
})();

const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCam3(f - FIRST, CAM.CX, CAM.CY, CAM.K);
    const d = sway(f);
    out.push({ cx: c.cx + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
const clampF = (f: number) => Math.max(0, Math.min(DURATION + 2, Math.round(f)));
const camAt = (f: number) => CAM_AT_F[clampF(f)];
const kAt = (f: number) => camAt(f).k;
/** Where a world point sits on screen at frame `f`. */
const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return { x: WORLD_W / 2 + (wx - c.cx) * c.k, y: WORLD_H / 2 + (wy - c.cy) * c.k };
};

// ---------------------------------------------------------------------------
// THE PROOFS.
// ---------------------------------------------------------------------------

/** 1. The cut is where the clip says it is, and lasts what the speech says. */
(() => {
  if (CUT_OFFSET !== 0 || DURATION !== Math.round(2.579 * 24) + 16) {
    throw new Error("WeMakeThem: the cut's offset or duration is not the clip's.");
  }
})();

/** 2. THE GLIDE LANDS BEFORE "aligned". 96% of the whole move must be spent by
 *  f48, which is 8 frames ahead of the word. */
export const LANDING = (() => {
  const f = 48;
  const k0 = kAt(0);
  const kEnd = kAt(LAST);
  const done = (k0 - kAt(f)) / (k0 - kEnd);
  if (done < 0.92) {
    throw new Error(`WeMakeThem: the glide is only ${(done * 100).toFixed(0)}% spent at f48.`);
  }
  const p = screenAt(f, PEOPLE[2].x, PEOPLE_Y);
  const g1 = screenAt(f, nodesAt(f)[1].x, nodesAt(f)[1].y);
  const a = arrowOf(1, f);
  const tip = screenAt(f, a.x1, a.y1);
  return {
    f,
    k: Number(kAt(f).toFixed(4)),
    markScreenPx: Number((MARK * kAt(f)).toFixed(1)),
    peopleScreenY: Number(p.y.toFixed(0)),
    gen1ScreenY: Number(g1.y.toFixed(0)),
    gen1TipScreenY: Number(tip.y.toFixed(0)),
    glideSpent: Number((done * 100).toFixed(1)),
  };
})();

(() => {
  if (LANDING.markScreenPx < 100) {
    throw new Error(`WeMakeThem: the mark is only ${LANDING.markScreenPx} screen px at f48.`);
  }
})();

/** 3. THE CAMERA IS SMOOTH AND NEVER PARKED. Screen velocity of a fixed world
 *  point (gen 1's centre), its acceleration, and the floor on its speed. */
export const CAM_STATS = (() => {
  const P = nodesAt(0)[1];
  const v: number[] = [];
  for (let f = 1; f <= LAST; f++) {
    const a = screenAt(f - 1, P.x, P.y);
    const b = screenAt(f, P.x, P.y);
    v.push(Math.hypot(b.x - a.x, b.y - a.y));
  }
  let maxDv = 0;
  let maxDvF = 0;
  for (let i = 1; i < v.length; i++) {
    const d = Math.abs(v[i] - v[i - 1]);
    if (d > maxDv) {
      maxDv = d;
      maxDvF = i + 1;
    }
  }
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  return {
    maxDv: Number(maxDv.toFixed(3)),
    maxDvF,
    maxV: Number(Math.max(...v).toFixed(3)),
    minV: Number(Math.min(...v).toFixed(3)),
    meanV: Number(mean.toFixed(3)),
  };
})();

(() => {
  if (CAM_STATS.maxDv > 2.5) {
    throw new Error(`WeMakeThem: the camera's |dv| peaks at ${CAM_STATS.maxDv} px/f^2.`);
  }
  if (CAM_STATS.minV <= 0.01) {
    throw new Error("WeMakeThem: the camera comes to a dead stop.");
  }
})();

/** 4. NOTHING BREAKS THE SPEED CAP. The movers in this cut are the packets, the
 *  guide's draw head and the arrow copy's tip. */
export const SPEED = (() => {
  let copyMax = 0;
  let copyMaxF = 0;
  const w = sched(1).copy;
  for (let f = w[0] + 1; f <= w[1]; f++) {
    const a = copyGeom(1, f - 1).g;
    const b = copyGeom(1, f).g;
    const k = kAt(f);
    const s = Math.hypot(b.x1 - a.x1, b.y1 - a.y1) * k;
    if (s > copyMax) {
      copyMax = s;
      copyMaxF = f;
    }
  }
  let kMax = 0;
  for (let f = 0; f <= LAST; f++) kMax = Math.max(kMax, kAt(f));
  // The guide's head only exists from GUIDE_G0 on, by which frame the glide has
  // already spent most of its zoom — measuring it against the OPENING k would
  // fail the cap on a head that is never drawn at that zoom.
  let kMaxGuide = 0;
  for (let f = GUIDE_G0; f <= LAST; f++) kMaxGuide = Math.max(kMaxGuide, kAt(f));
  const packet = PACKET_V * kMax;
  const guide = GUIDE_DRAW_V * kMaxGuide;
  const worst = Math.max(copyMax, packet, guide);
  if (worst > SPEED_CAP_SCREEN) {
    throw new Error(`WeMakeThem: something moves at ${worst.toFixed(1)} screen px/f.`);
  }
  return {
    copyTipMax: Number(copyMax.toFixed(2)),
    copyTipMaxF: copyMaxF,
    packetMax: Number(packet.toFixed(2)),
    guideHeadMax: Number(guide.toFixed(2)),
  };
})();

/** 5. CAPTION-SAFE. The bright ink (the people, the marks, the arrows — not the
 *  guide, which runs off the top by design) stays inside screen x 110..970 and
 *  y 200..1400 on every frame of the cut. */
export const INK_BOX = (() => {
  let worst = { f: 0, x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  for (let f = 0; f <= LAST; f++) {
    const b = bounds(f);
    const a = screenAt(f, b.x0, b.y0);
    const c = screenAt(f, b.x1, b.y1);
    if (a.x < worst.x0) worst = { ...worst, x0: a.x, f };
    worst.y0 = Math.min(worst.y0, a.y);
    worst.x1 = Math.max(worst.x1, c.x);
    worst.y1 = Math.max(worst.y1, c.y);
  }
  // TWO BANDS, because the cut opens tighter than it lands. From the LANDING on
  // — the frames the line rests on — the ink is inside the house band
  // x 110..970. Before it, the opening is the set's own "open inside the crowd,
  // and the first move reveals its edges": the people row nearly fills the
  // frame and is held to the field set's 70 px margin instead.
  const land = { x0: 1e9, x1: -1e9 };
  for (let f = 48; f <= LAST; f++) {
    const b = bounds(f);
    land.x0 = Math.min(land.x0, screenAt(f, b.x0, b.y0).x);
    land.x1 = Math.max(land.x1, screenAt(f, b.x1, b.y1).x);
  }
  if (land.x0 < 110 || land.x1 > 970) {
    throw new Error(
      `WeMakeThem: from the landing on the ink runs to screen x ${land.x0.toFixed(
        0,
      )}..${land.x1.toFixed(0)}.`,
    );
  }
  if (worst.x0 < 70 || worst.x1 > 1010 || worst.y1 > 1380) {
    throw new Error(
      `WeMakeThem: the ink runs to screen x ${worst.x0.toFixed(0)}..${worst.x1.toFixed(
        0,
      )}, y ..${worst.y1.toFixed(0)}.`,
    );
  }
  return {
    x0: Number(worst.x0.toFixed(0)),
    x1: Number(worst.x1.toFixed(0)),
    y0: Number(worst.y0.toFixed(0)),
    y1: Number(worst.y1.toFixed(0)),
    landX: [Number(land.x0.toFixed(0)), Number(land.x1.toFixed(0))] as const,
    lowestAt48: Number(screenAt(48, bounds(48).x1, bounds(48).y1).y.toFixed(0)),
  };
})();

/** 6. THE WORLD IS DOING WHAT THE SCHEDULE SAYS on this cut's beats. */
(() => {
  if (stateAt(defaultProps.beats.them2).gens[0].fill < 0.99) {
    throw new Error("WeMakeThem: gen 1 is not complete on the second 'them'.");
  }
  if (!stateAt(defaultProps.beats.aligned).gens[0].hasArrow) {
    throw new Error("WeMakeThem: gen 1 does not own its arrow by 'aligned'.");
  }
  if (stateAt(0).guide > 0) {
    throw new Error("WeMakeThem: the guide exists before the humans' arrow is drawn.");
  }
})();

// ---------------------------------------------------------------------------

const WeMakeThem: React.FC<Props> = ({
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
}) => {
  const frame = useCurrentFrame();
  const cam = runCam3(frame - FIRST, CAM.CX, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const G = CUT_OFFSET + frame;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM.CY[0]}
        cx={cx}
        cxRest={CAM.CX[0]}
        k={k}
        parallax={parallax}
      />

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
          <World G={G} k={k} />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default WeMakeThem;

export const CAM_AT = (f: number) => camAt(f);

// Referenced so the beats object is a contract and not decoration.
export const BEAT_CHECK = {
  them2: defaultProps.beats.them2,
  aligned: defaultProps.beats.aligned,
  end: defaultProps.beats.end,
};

export const STATS = {
  LANDING,
  CAM_STATS,
  SPEED,
  INK_BOX,
  arrowBaseY: Number(ARROW_BASE.y.toFixed(3)),
  markR: MARK_R,
  glide: { f0: GLIDE_F0, f1: GLIDE_F1, kOpen: K_OPEN, kLand: K_LAND, cOpen: C_OPEN, cLand: C_LAND },
  smoothstepCheck: smoothstep(clamp01(1)),
};
