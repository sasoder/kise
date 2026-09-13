import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp,
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  runCamera,
  squirclePath,
  sway,
  worldTransform,
} from "./fieldShared";
// THE WORLD. Every constant and every piece of geometry this piece stands on is
// IMPORTED from cut 1 — the box, its stroke, the seat grid, the mark, the gate,
// the camera's key track, the line speed, the tone duration. Nothing is
// re-derived and no value is restated, so this cut and cut 1 cannot drift.
//
// The INTERNET RING and its wifi glyph are cut 1's too, and they are NOT drawn
// here: nothing in this line is about the internet, and in cut 1 the ring only
// exists while it is being spoken about. The world at rest in this piece is the
// box, the crowd, the dashed gate and the mark — and with the ring gone the
// mark's drop on "who's boss" has clear air the whole way down.
import {
  BOX_H,
  BOX_PATH,
  BOX_W,
  BOX_X0,
  BOX_Y0,
  BOX_Y1,
  CAM,
  CENTRE_X,
  COLS,
  CONTENT_FINAL,
  GATE_DASH,
  GATE_GAP,
  GATE_X0,
  GATE_X1,
  IN_Y0,
  IN_Y1,
  K_FINAL,
  LINE_SPEED,
  LINE_TIP_Y,
  MARK,
  NSEAT,
  ROWS,
  SEATS,
  SEAT_AT,
  STROKE,
  TONE_DUR,
  WALL_INNER,
  WORLD_H,
  WORLD_W,
  clamp01,
  clampi,
  smooth,
} from "./ImpossibleTasks";

export const FPS = 24;
// Dwarkesh clip `Ajeya_DC_Way`. Ajeya Cotra, quoting the instinct people in DC
// reach for about the OpenAI / Hugging Face sandbox attack:
//
//   "Why don't you punish the model for doing these bad things? Like, why don't
//    you, like, bring it under heel and, like, you know, show it who's boss?"
//
// SRT span 0:04.059 -> 0:09.640 at 24fps.
// DURATION = round((9.640 - 4.059) * 24) = round(5.581 * 24) = round(133.944)
// = 134 frames of speech, plus a 48 frame tail so the resolved state holds and
// the editor can cut out of it wherever it wants = 182.
export const DURATION = 182;

// ---------------------------------------------------------------------------
// "Under heel", VERSION A — the lid stays pressed.
//
// Orange Dwarkesh style: opaque grid cutaway, 1080x1920, 24fps, two-tone warm
// yellow dots fully opaque, per-icon shadows, one eased camera move, one
// gesture per word. Same sandbox world as `ImpossibleTasks.tsx`: the 900 x 700
// ink box with the models inside it, the OpenAI mark above, the gate that was
// never built already dashed. No internet ring — see the import note.
//
// The DC instinct read as a physical act. Punish it: a bead drops from the mark
// onto the lid and the whole crowd goes dark under it. It did bad things: five
// agents light and press straight up at the lid. So bring it under heel: the
// lid comes DOWN a hundred and sixty pixels, the reaches are crushed out of
// existence and the crowd is squeezed into what room is left. Then show it
// who's boss: the mark drops out of the sky and sits on the lid it just closed.
// And it stays sat there.
//
// Every gesture is one word. Nothing else happens.
//   CAMERA M0: open at k 1.50 inside the box (crowd
//     bleeding off both sides, the mark above the
//     frame, content centre 140) and pull back to
//     k 0.95 / content centre -102 — cut 1's resolved
//     framing exactly, mark and whole box in frame,
//     content centre at screen y 835. Cut 1's own
//     segment, imported whole. Settled f22     — "why don't you"     keys f0-9
//   PUNISH: ONE ink bead (white, r 4) drops from the
//     bottom of the mark straight down at one speed
//     and stops dead on the lid's OUTSIDE face. No
//     flash. It fades over the 4 frames after it
//     lands                                        — "punish"             f7-16
//   ...and on contact the ENTIRE crowd goes ripe ->
//     deep in a wave from the top row down,
//     smoothstepped on the row, each dot taking
//     TONE_DUR for its own ramp. The bottom row is
//     dark on "model"                          — "punish the model"       f16-30
//   BAD THINGS: five agents, hashed across the box
//     (no two in a column, none within a row of each
//     other) go deep -> ripe over TONE_DUR at f33,
//     36, 39, 42 and 45, and each sends a reach
//     STRAIGHT UP at one speed, head-led, that stops
//     dead on the inside face of the lid. Nothing
//     happens on contact; the last is against the
//     lid on "things"        — "doing these bad things"                   f33-49
//   CAMERA M1: PUSH IN to k 1.30 with the lid's
//     inside face at screen y 640, so the top of the
//     box fills the frame and the five reaches rise
//     INTO the lens as they are drawn. warp 0.72,
//     99.3% landed by f54 — "these bad things"   keys f33-45 / landed f54
//   THE PUMP: from the frame its tip lands, every
//     reach pushes at the lid it failed to get
//     through — the TIP comes back off it by 36 world
//     px over 8 frames (ease in) and pushes out again
//     over 6 (ease out), rests 0-6, repeats. Starts
//     hashed over 12 — most of a cycle, solved rather
//     than copied — so the five are PERMANENTLY out of
//     phase: no two ever share one, and 3.3 of the 5
//     are moving on an average frame. The tip stays a
//     round cap and nothing happens on contact. It
//     runs THROUGH the press until each is erased
//                       — "like, why don't you, like"                    f50-93
//   ...and the five agents strain with their reaches:
//     `breath` at 1.5x from "like", on a remapped
//     frame so the phase is continuous. Every other
//     dot in the crowd is unchanged                — "like"               f60+
//   UNDER HEEL: the lid — top wall, gate and all —
//     comes DOWN 160 world px on an in-then-out
//     cubic, the side walls shortening with it so
//     the box stays one closed squircle and its
//     floor never moves. The five reaches shorten
//     from the top as it comes (their tips stay on
//     the lid's inside face) and erase completely
//     between f87 and f93. The crowd COMPACTS: the
//     seats re-space linearly between the new top
//     edge and the unchanged floor. The mark does
//     not move. Settled before "and"
//                                     — "bring it under heel"             f77-93
//   CAMERA M2: the lens goes down WITH the lid. k is
//     held at 1.30 and cy comes down by HALF the
//     lid's travel, on the lid's own in-then-out
//     cubic — so on screen the lid comes down 104 px
//     and the floor comes UP 104 and the press reads
//     as a press instead of a shape shrinking. Keyed
//     four frames early so the DAMPED cy tracks the
//     lid rather than chasing it: RMS 5.9 world px
//     against lidDrop/2 over f77-95
//                    — "bring it under heel"   keys f73-89 / with the lid
//   hold, but the pump is still running under it
//                                                   — "and, like, you know"
//                                                                         f93-112
//   CAMERA M3: PULL BACK to k 0.95 framing the
//     RESOLVED block — the seated mark's top edge down
//     to the box floor — on the caption line at screen
//     y 835, so the frame opens up under the mark's
//     drop and the mark lands INTO it. warp 0.7,
//     96.0% landed at f118 and 99.1% at f121 where
//     the mark seats, on a camera that has stopped
//                        — "show it who's boss"  keys f102-112 / landed f118
//   WHO'S BOSS: the OpenAI mark DROPS from its rest
//     height to sit on the lowered lid, its bottom
//     edge 14 world px above the lid's outside face,
//     eased out with a small back-overshoot of 8 px.
//     Settled on "boss". Nothing is in its way
//                                     — "show it who's boss"              f112-121
//   RESOLVE (version A): HOLD. Lid down, crowd
//     compacted, mark perched on the lid. It never
//     fades out — the editor controls the out       — tail                f122-182
//
// NOT drawn, and not a gesture: the internet ring and its wifi glyph. Removed
// with the whole occlusion mask the bead used to need for them.
//
// ambient: idle thread traffic across the crowd from f0 at the shared rate
// (180 threads per 1,200 agents), with both endpoints following their seats
// through the compaction; `breath` on every dot; `sway` on the camera; the
// grid's own drift. Not gestures; that is what this field is.
//
// DIRECTOR'S PASS 3, on "you could definitely be doing more, like using the
// camera to follow the animations ... they feel very rushed ... make something
// more engaging that guides the eye": the camera went from cut 1's ONE move to
// FOUR on one damped track, each landing ahead of its own word, and the 28
// frame hold on "like, why don't you, like" — which the first two passes left
// deliberately still — got the reaches PUMPING at the lid and the five agents
// breathing at 1.5x under them. Nothing was retimed and no new material was
// invented: every beat is where it was, the lens is what changed.
//
// ---------------------------------------------------------------------------
// FOUR THINGS ARE DERIVED RATHER THAN HAND-SET, and each is noted where it is
// computed. The lid's depth is a hand-set 160; everything downstream of it —
// the compaction factor, the reaches' tips, the mark's seat and its back
// constant — is solved from that one number, so a deeper press is one edit.
//
//   * THE CROWD OPENS RIPE. Cut 1 resolves with the crowd DEEP and five ripe
//     agents under their tiles, but the punishment here IS the darkening, so
//     there has to be something to darken. The rest state at f0 is therefore
//     the whole crowd at the ripe tone, and the wave at f16 takes it to deep.
//     Only the tone opens ripe: the 35% radius swell that cut 1 gives a lit dot
//     is driven by EVENTS only (a thread on the dot, one of the five agents
//     lighting), never by the rest tone, or the opening frame would be one
//     solid orange mass 35% denser than cut 1's field.
//   * REACH_SPEED. Cut 1's LINE_SPEED is 28 world px a frame, and the five
//     reaches here leave at f33/36/39/42/45 and must ALL be against the lid by
//     f49, so the last one has four frames. Ordering the launches by descending
//     reach length (cut 1's own trick) is most of it; the rest is solved, the
//     way cut 1 solves it, by raising the one shared speed to whatever the
//     hashed seats actually need. Floor is LINE_SPEED, so it can only ever go
//     up. It lands on 37.213 px a frame: the longest reach is 595.4 px from the
//     f33 slot and arrives at f49.00, and the other four arrive f46.88-48.46.
//     The five seats come out at grid columns 5 / 12 / 17 / 24 / 30 and rows
//     3 / 8 / 13 / 19 / 25 — no shared column, five rows apart at the closest.
//   * THE COMPACTION DOES NOT MAKE THE CROWD TOUCH. This field already overlaps
//     — it is 869 dots on a ~24 px step with 0.9 of a step of jitter, and at
//     the rest swell the closest pair is already 9.340 px INSIDE each other
//     (13.787 px at the full lit swell). The compaction is a uniform scale in y
//     about the floor — at the 160 px press, (664 - 160) / 664 = 0.759036 —
//     so every pairwise distance in y shrinks by that one factor and nothing
//     NEW collides: re-measured at 160, the worst overlap goes 9.340 -> 10.100
//     px at rest and 13.787 -> 14.547 at full swell, 0.76 px deeper either way.
//     There is nothing to clamp — a clamp that fixed this would have to fix cut
//     1 too. The row pitch goes 23.714 -> 18.000 (crowd height over ROWS - 1).
//     And the crowd cannot poke through the lid at ANY press depth, because the
//     scale maps IN_Y0 exactly onto IN_Y0 + drop: the crowd's ceiling rides the
//     lid down. Measured at 160, the highest dot edge sits at -119.7 (-118.0 at
//     the rest swell) against a lid inside face of -128.5 — 8.8 px of clearance
//     at the biggest a dot ever gets, the same clearance the 120 press had.
//   * THE MARK'S OVERSHOOT. The brief asks for `Easing.out(Easing.back(1.6))`
//     with an overshoot of 8 px or less, and those two cannot both be true on a
//     drop this long: out-back at 1.6 overshoots by 4·1.6³/(27·2.6²) = 8.97% of
//     the travel, which on the deeper press is 32.3 px. The back constant is
//     solved from the cap instead — 4s³/(27(s+1)²) · travel = 8 — which at the
//     160 press puts it at s = 0.7800 on a 360.50 px drop (the lid is 40 px
//     lower, so the mark falls 40 px further) and the overshoot at exactly 8
//     world px. It re-solves itself from LID_DROP. Same easing
//     family, same landing character, and the number the brief actually cares
//     about is honoured.
//
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, and every accent line
  accentDeep: z.string(), // deep: an unread dot
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotUnread: z.number(), // the dot body's opacity; the state ladder is colour
  idleThreadCount: z.number(),
  markSrc: z.string(), // the OpenAI mark, tinted white
  markSize: z.number(), // world px, square
  beats: z.object({
    why: z.number(), // "why"       — the pull-back starts
    dont: z.number(), // "don't"
    you: z.number(), // "you"
    punish: z.number(), // "punish"  — the bead leaves the mark
    the: z.number(), // "the"
    model: z.number(), // "model"    — the dark wave is running
    forW: z.number(), // "for"
    doing: z.number(), // "doing"    — the first agent lights and reaches
    these: z.number(), // "these"
    bad: z.number(), // "bad"        — the last agent lights and reaches
    things: z.number(), // "things"  — the last reach is against the lid
    like1: z.number(), // "like"
    why2: z.number(), // "why"
    dont2: z.number(), // "don't"
    you2: z.number(), // "you"
    like2: z.number(), // "like"
    bring: z.number(), // "bring"    — the lid starts down
    it: z.number(), // "it"
    under: z.number(), // "under"
    heel: z.number(), // "heel"      — the reaches erase
    and: z.number(), // "and"        — the lid is down and settled
    like3: z.number(), // "like"
    you3: z.number(), // "you"
    know: z.number(), // "know"
    show: z.number(), // "show"      — the mark drops
    it2: z.number(), // "it"
    whos: z.number(), // "who's"
    boss: z.number(), // "boss"      — the mark is seated
    end: z.number(), // speech ends; tail to 182
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE LID. The one thing in this world that moves: the top wall comes down 160
// world px and the box closes up around it. The floor (BOX_Y1) never moves, so
// the box's height is BOX_H - lidDrop and its top-left corner is BOX_Y0 +
// lidDrop; the squircle is rebuilt at that height every frame rather than
// scaled, so the corner radius stays proportional and the stroke stays STROKE.
// ---------------------------------------------------------------------------
// Every gesture's START is read off the `beats` prop — the frames are lifted
// from the SRT and nothing in this piece keeps its own parallel clock — so what
// is written down here is only how LONG each one takes.
// DIRECTOR'S PASS: 120 -> 160. Same 16 frames and the same in-then-out cubic,
// so the press is deeper and faster rather than longer — the heel goes further
// down on the same word.
export const LID_DROP = 160;
export const LID_DUR = 16; // "bring" -> settled two frames before "and"
export const lidDropAt = (f: number, f0: number) =>
  LID_DROP *
  interpolate(f, [f0, f0 + LID_DUR], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

// The crowd's own ceiling comes down with it: the seats re-space linearly
// between the new top edge and the unchanged floor. A uniform scale in y about
// IN_Y1, so the whole field — jitter, feathered edge and all — squeezes without
// re-hashing anything.
export const CROWD_H = IN_Y1 - IN_Y0;
export const compactAt = (drop: number) => (CROWD_H - drop) / CROWD_H;
export const compactY = (y: number, fct: number) => IN_Y1 - (IN_Y1 - y) * fct;

// ---------------------------------------------------------------------------
// THE PUNISHMENT. One ink bead falls out of the bottom of the mark at one
// speed, stops dead on the OUTSIDE face of the lid — bead bottom against wall,
// so it sits ON it and never crosses it — and fades. There is no flash: the
// answer to the bead is the crowd going dark, not a mark on the wall.
//
// It falls straight down the centre line with nothing in its way. The ring used
// to be — mark and ring are both centred on CENTRE_X — and the bead carried an
// occlusion mask for it. The ring is gone from this piece and so is the mask.
// ---------------------------------------------------------------------------
export const BEAD_R = 4;
export const BEAD_FALL = 9; // "punish" -> contact on the lid
export const BEAD_FADE = 4;
export const WALL_OUTER = BOX_Y0 - STROKE / 2; // -291.5, the lid's outside face
export const BEAD_Y1 = WALL_OUTER - BEAD_R;

// The dark wave. It starts on contact and reaches the bottom row DARK_SPAN
// frames later, on "model", and every dot takes cut 1's TONE_DUR for its own
// ramp, so the wave's FRONT runs over the DARK_SPAN - TONE_DUR before that.
export const DARK_SPAN = 14;
export const DARK_FRONT = DARK_SPAN - TONE_DUR; // 8

// ---------------------------------------------------------------------------
// THE FIVE BAD THINGS. Five agents spread across the box: five x anchors 140 px
// apart, five y anchors 135 px apart permuted onto them by hash so height is
// not a function of x, both jittered by at most +-12, then snapped to the
// nearest real seat. 140 px is roughly six grid columns and 135 px five grid
// rows, and the jitter plus the snap can move a target by at most ~24, so no
// two of the five can share a column or land within a row of each other — this
// is asserted below rather than assumed.
//
// A reach starts REACH_LIFT above its agent's dot centre, which clears the
// biggest a dot in this field ever gets (DOT_RADIUS x 1.25 x 1.05 x 1.35 =
// 9.7), so the agent stays visible under its own reach.
//
// BAD_SLOTS and BAD_DEADLINE are the one place this piece writes frames down
// rather than reading them off `beats`, and they are anchored on it: the ladder
// starts on "doing" and the deadline IS "things". They have to be module-level
// because the launch ORDER and REACH_SPEED are both solved from them, and that
// solve is what makes "one speed" and "all five on the lid by `things`" true at
// the same time. Retiming the line means retiming these two with it.
// ---------------------------------------------------------------------------
export const REACH_LIFT = 12;
export const BAD_X = [250, 390, 540, 690, 830];
export const BAD_Y = [320, 185, 50, -85, -220];
export const BAD_SLOTS = [33, 36, 39, 42, 45]; // "doing / these / bad"
export const BAD_DEADLINE = 49; // "things": every reach is against the lid

export type Bad = {
  seat: number; // index into SEATS
  x: number;
  y: number; // the agent's seat, at rest
  from: number; // the frame it lights and its reach leaves
  len: number; // the reach's length at rest, dot to lid
};

export const BADS: Bad[] = (() => {
  const perm = BAD_X.map((_, i) => i).sort((a, b) => hash(a, 32) - hash(b, 32));
  const wanted = BAD_X.map((ax, i) => ({
    x: ax + (hash(i, 30) - 0.5) * 24,
    y: BAD_Y[perm[i]] + (hash(i, 31) - 0.5) * 24,
  }));

  const seats = wanted.map((w) => {
    let best = 0;
    let bestD = Infinity;
    SEATS.forEach((s, i) => {
      const dd = Math.hypot(s.x - w.x, s.y - w.y);
      if (dd < bestD) {
        bestD = dd;
        best = i;
      }
    });
    return best;
  });

  // no two in a column, none within a row of each other
  for (let i = 0; i < seats.length; i++) {
    for (let j = i + 1; j < seats.length; j++) {
      const a = SEATS[seats[i]];
      const b = SEATS[seats[j]];
      if (a.gc === b.gc || Math.abs(a.gr - b.gr) < 1) {
        throw new Error(`UnderHeel: the five agents are not spread (${i} and ${j})`);
      }
    }
  }

  const raw = seats.map((si) => {
    const s = SEATS[si];
    return { seat: si, x: s.x, y: s.y, len: s.y - REACH_LIFT - LINE_TIP_Y };
  });

  // The launch order. All five run at one speed and all five have to be against
  // the lid on "things", so the longest reach leaves first and the shortest
  // last — the same rule cut 1 deals its tasks by, and a scattered order in x.
  const order = raw.map((_, i) => i).sort((a, b) => raw[b].len - raw[a].len);
  const out: Bad[] = [];
  order.forEach((i, slot) => {
    out[i] = { ...raw[i], from: BAD_SLOTS[slot] };
  });
  return out;
})();

// One speed for all five, so a longer reach visibly takes longer. Cut 1's
// LINE_SPEED is the floor; if the hashed seats put a long reach in a late slot
// it is raised just enough that the last tip is on the lid on "things", which
// is the beat the whole gesture is cut to.
export const REACH_SPEED = Math.max(
  LINE_SPEED,
  ...BADS.map((b) => b.len / Math.max(1, BAD_DEADLINE - b.from)),
);

// The reaches erase as the lid crushes them: the BASE rises to meet the tip, so
// the last thing on screen is the tip on the lid's inside face and then nothing.
// It starts on "heel" and finishes exactly when the lid stops, so the erase is
// not a duration of its own — it is the tail end of the lid's own move.

// ---------------------------------------------------------------------------
// THE PUMP. "Like, why don't you, like" is 28 frames with no word to hit, and
// the first pass held it still: five reaches standing dead against a lid for
// over a second. They are not done — they are straining, and the press is what
// stops them. So from the frame each reach ARRIVES it keeps pushing at the lid
// it already failed to get through, and it only stops when it is erased.
//
// This is `TryToHackOut.tsx`'s `pumpAt` mechanism, copied rather than imported
// so the two cuts cannot break each other mid-pass: only the WALL end moves —
// it comes back off the lid by PUMP_PULL along the reach's own direction (here
// straight down, these reaches are vertical) and then pushes out again — so no
// agent moves and no reach ever detaches from its dot. The tip stays a round
// cap and nothing happens on contact.
//
// PUMP_PULL is 36 rather than that cut's 56: these reaches are seen at k 1.30
// under the push-in, where 36 world px is 47 screen px of travel over 8 frames,
// the same screen amplitude a 56 px pull has at cut 2's k 0.95.
//
// The rest between cycles is hashed 0-6 frames per reach per cycle, and the
// START frames are hashed over PUMP_SPREAD. That window is 12 rather than cut
// 2's own, and it is the one number in this mechanism that had to be SOLVED
// rather than copied: cut 2 spreads dozens of reaches that arrive across sixty
// frames, and five that all land inside two frames of each other are a much
// harder case — with a short spread the five start together, and a rest hashed
// 0-6 on a 14-frame cycle is not enough to pull them apart before the press.
// Measured over f49-93 at a 7-frame spread: nine frames where not one of the
// five is moving, and pairs sitting at the SAME phase for 4 of them. A spread
// of 12 is most of one cycle, so the five are permanently out of phase: no two
// ever share a phase, an average of 3.3 of the 5 are moving on any frame, and
// the only frames where none is are f50-52, three frames right after the last
// tip lands — which is where the LANDINGS are the motion. The cost is that the
// last reach does not start pumping until f58; the sweep is in `pumpsearch2.ts`
// and the per-frame table in `pump.ts`.
//
// It never hardens — cut 2 hardens its pump on a strike, and there is no strike
// in this line.
// ---------------------------------------------------------------------------
export const PUMP_PULL = 36; // world px the lid end retreats at full pump
export const PUMP_CAP = 0.45; // ...but never more than this much of the reach
const PUMP_IN = 8; // shortens, ease in
const PUMP_OUT = 6; // pushes back, ease out
const PUMP_REST = 6; // ...then flat against the lid for 0-6 frames
const PUMP_SPREAD = 12; // the start frames are hashed across this window

export const pumpAt = (i: number, f: number, from: number) => {
  const start = from + Math.floor(hash(i * 101 + 1, 41) * PUMP_SPREAD);
  if (f < start) return 0;
  let t = start;
  for (let c = 0; c < 96; c++) {
    const rest = Math.round(hash(i * 101 + c * 5, 42) * PUMP_REST);
    const len = PUMP_IN + PUMP_OUT + rest;
    if (f < t + len) {
      const a = f - t;
      if (a < PUMP_IN) return Easing.cubic(a / PUMP_IN);
      if (a < PUMP_IN + PUMP_OUT) return 1 - Easing.out(Easing.cubic)((a - PUMP_IN) / PUMP_OUT);
      return 0; // rest, flat against the lid
    }
    t += len;
  }
  return 0;
};

// The frame each reach's tip first touches the lid, which is the frame its pump
// starts. Read off the one shared speed, not written down.
export const ARRIVE = BADS.map((b) => Math.ceil(b.from + b.len / REACH_SPEED));

// ...and the five agents themselves strain with their reaches: from "like"
// their `breath` runs at 1.5x. The rate is changed on a REMAPPED frame rather
// than a multiplied one so the phase is continuous — nothing snaps at f60 — and
// only these five dots see it.
export const STRAIN_RATE = 1.5;
export const IS_BAD = (() => {
  const a = new Uint8Array(NSEAT);
  BADS.forEach((b) => {
    a[b.seat] = 1;
  });
  return a;
})();

// ---------------------------------------------------------------------------
// WHO'S BOSS. The mark drops out of the sky and sits on the lid it just closed:
// its bottom edge 14 world px above the lid's outside face. Eased out with a
// back-overshoot solved to exactly MARK_OVERSHOOT world px — see the header for
// why the brief's back(1.6) cannot be used literally on a drop this long.
// ---------------------------------------------------------------------------
export const MARK_DUR = 9; // "show" -> settled, four frames before "boss"
export const MARK_SEAT = 14; // world px from the mark's bottom edge to the lid
export const MARK_OVERSHOOT = 8; // world px past the seat, at the bottom of the drop

// 4s^3 / (27 (s+1)^2) is the fraction of the travel that `Easing.out(back(s))`
// overshoots by. Solve it for MARK_OVERSHOOT / travel by bisection, once.
export const backFor = (frac: number) => {
  let lo = 0;
  let hi = 4;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if ((4 * m * m * m) / (27 * (m + 1) * (m + 1)) < frac) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

// ---------------------------------------------------------------------------
// THE CAMERA. FOUR moves, on ONE damped track — a single `runCamera` fed by
// consecutive `camMove` segments with flat holds between them, so there is no
// second camera and no cut. Director's pass: the first version had cut 1's one
// pull-back and then a locked lens for 160 frames, and the note was that the
// camera should FOLLOW the action — zoom into what is happening, frame the
// press, open up for the perch.
//
// cx is CENTRE_X throughout: everything in this world is on the centre line,
// so a pan would be motion with nothing to look at.
//
//   M0  the pull-back, cut 1's own segment imported whole (k 1.50 -> 0.95,
//       content centre 140 -> -102, warp 0.72, keys f0-9)   — "why don't you"
//   M1  PUSH IN to k 1.30 on the five reaches, so the box's top fills the
//       frame and they rise INTO the lens                   — "these bad things"
//   M2  the camera goes down WITH the lid: k held at 1.30, cy down by half the
//       lid's 160, on the lid's own in-then-out cubic, so the lid comes down
//       the screen AND the floor comes up it and the press reads as a press
//                                                           — "bring it under heel"
//   M3  PULL BACK to k 0.95 framing the resolved block — the seated mark's top
//       edge down to the box floor — on the caption line, opening the frame
//       under the mark's drop                               — "show it who's boss"
//
// EVERY LANDING IS SOLVED AGAINST THE DAMPER, NOT ASSERTED. `runCamera` damps
// the key track, so a move keyed f0-f1 is still moving well after f1: cut 1's
// own f0-9 keys are what put its pull-back ON SCREEN across f0-16 and settled
// at f22. The director's brief named the windows f33-50, f77-93 and f106-118
// and the landings f54, f93 and f118; those pairs are not simultaneously
// satisfiable through this damper, so the SHAPE, the easing and the landings
// are kept and the key windows are solved backwards from them (measured in
// `v3_cam.txt`, and the sweep that picked them is in `camsim2.ts`):
//
//   M1 keys f33-45 ("doing" -> "bad", not "doing" -> f50): 99.3% of the zoom is
//      done at f54 and dk is 0.0017 a frame — 0.5% of the move's own peak
//      speed. The briefed f33-50 lands only 96.6% by f54 and is still visibly
//      crawling into "like".
//   M2 keys f73-89, four frames AHEAD of "bring": the camera is not chasing the
//      lid, it is pre-compensated so the DAMPED cy tracks the lid's own eased
//      curve. RMS error against `lidDrop(f) / 2` over f77-95 is 5.9 world px
//      (7.6 screen) and 3.7 px at f93, against 21.5 / 13.9 for the briefed
//      f77-93. The camera has not started moving at f77 (0.9 px by then).
//   M3 keys f102-112, ten frames ahead of "show": 96.0% done at f118 (the brief
//      asks for >= 95%), 99.1% at f121 where the mark lands, and dk there is
//      0.0023 — the mark seats on a camera that has effectively stopped. The
//      briefed f106-118 is only 77% done at f118 and still moving at f122.
//
// Each move is one acceleration lobe and one deceleration lobe with no stall:
// dk peaks at f42 on M1 and f110 on M3 and decays monotonically either side,
// and the overshoot the damper leaves is 0.06% of k. See `v3_cam.txt`.
// ---------------------------------------------------------------------------
export const K_PUSH = 1.3; // the push-in zoom, M1 and M2
export const PUSH_LID_Y = 640; // ...which puts the lid's inside face here on screen
// A content centre c lands at screen y 835 (CAM_LIFT under the middle), so a
// world y lands at 835 + (y - c) * k: invert that for the lid's inside face.
export const CONTENT_PUSH = WALL_INNER + (960 - CAM_LIFT - PUSH_LID_Y) / K_PUSH;
export const CONTENT_PRESS = CONTENT_PUSH + LID_DROP / 2; // down half the lid's travel
export const PRESS_LEAD = 4; // M2's keys start this far ahead of "bring"
export const WIDE_LEAD = 10; // M3's keys start this far ahead of "show"
export const WIDE_DUR = 10;

// M2 is the one move that is NOT a `camMove`: it has to be the lid's move, so
// it carries the lid's easing instead of `camEase`. Everything else about it is
// `camMove` — a key every frame, and cy taken off the eased k — and with k held
// flat the two agree exactly anyway.
export const pressMove = (f0: number, f1: number, k: number, c0: number, c1: number) => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  for (let i = 0; i <= f1 - f0; i++) {
    const g = Easing.inOut(Easing.cubic)(i / (f1 - f0));
    F.push(f0 + i);
    K.push(k);
    CY.push(c0 + (c1 - c0) * g + CAM_LIFT / k);
  }
  return { F, K, CY };
};

// The resolved block M3 frames: the top edge of the mark once it is sat on the
// pressed lid, down to the box floor. Solved from LID_DROP and the mark's seat,
// so a different press re-frames its own ending.
export const markTopSeated = (markSize: number) =>
  BOX_Y0 + LID_DROP - STROKE / 2 - MARK_SEAT - markSize;

export const buildCamera = (beats: Props["beats"], markSize: number) => {
  const cWide = (markTopSeated(markSize) + BOX_Y1) / 2;
  const p0 = beats.bring - PRESS_LEAD;
  const w0 = beats.show - WIDE_LEAD;
  const segs = [
    CAM, // M0: cut 1's pull-back, imported whole
    camMove({
      f0: beats.doing,
      f1: beats.bad,
      k0: K_FINAL,
      k1: K_PUSH,
      c0: CONTENT_FINAL,
      c1: CONTENT_PUSH,
      warp: 0.72,
    }),
    pressMove(p0, p0 + LID_DUR, K_PUSH, CONTENT_PUSH, CONTENT_PRESS),
    camMove({
      f0: w0,
      f1: w0 + WIDE_DUR,
      k0: K_PUSH,
      k1: K_FINAL,
      c0: CONTENT_PRESS,
      c1: cWide,
      warp: 0.7,
    }),
  ];
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  segs.forEach((s) => {
    F.push(...s.F);
    K.push(...s.K);
    CY.push(...s.CY);
  });
  F.push(DURATION);
  K.push(K_FINAL);
  CY.push(cWide + CAM_LIFT / K_FINAL);
  // `runCamera` interpolates over F, so the four windows must not touch or
  // overlap — a retimed line that ran two of them together would otherwise
  // silently produce a garbage target rather than fail.
  for (let i = 1; i < F.length; i++) {
    if (F[i] <= F[i - 1]) {
      throw new Error(`UnderHeel: the camera's moves overlap at f${F[i]}`);
    }
  }
  return { F, K, CY };
};

// ---------------------------------------------------------------------------

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
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
  dotRadius: DOT_RADIUS,
  dotUnread: OP_UNREAD_DOT,
  idleThreadCount: idleThreads(NSEAT),
  markSrc: "openai-chatgpt-logo.png",
  markSize: 108,
  beats: {
    why: 0,
    dont: 2,
    you: 5,
    punish: 7,
    the: 14,
    model: 18,
    forW: 24,
    doing: 33,
    these: 40,
    bad: 45,
    things: 49,
    like1: 60,
    why2: 64,
    dont2: 65,
    you2: 69,
    like2: 71,
    bring: 77,
    it: 81,
    under: 84,
    heel: 87,
    and: 95,
    like3: 103,
    you3: 108,
    know: 110,
    show: 112,
    it2: 116,
    whos: 118,
    boss: 122,
    end: 134,
  },
});

const UnderHeel: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  dotRadius,
  dotUnread,
  idleThreadCount,
  markSrc,
  markSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = deep (punished), 1 = ripe (lit). Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);

  // Every gesture's frames, read off the beats lifted from the SRT. Nothing
  // here keeps a clock of its own: a start is a word, a span is a duration.
  const beadF0 = beats.punish; // "punish"
  const beadF1 = beadF0 + BEAD_FALL; // contact on the lid
  const darkF0 = beadF1; // the crowd answers the bead, not a timer
  const lidF0 = beats.bring; // "bring"
  const lidF1 = lidF0 + LID_DUR;
  const eraseF0 = beats.heel; // "heel"
  const markF0 = beats.show; // "show"
  const markF1 = markF0 + MARK_DUR;

  // -- the lid, and the crowd it is squeezing --------------------------------
  const lidDrop = lidDropAt(frame, lidF0);
  const lidY = BOX_Y0 + lidDrop; // the wall's centre line
  const lidOuter = lidY - STROKE / 2;
  const lidTipY = LINE_TIP_Y + lidDrop; // where a reach's round cap ends
  const fct = compactAt(lidDrop);
  const seatY = new Float32Array(NSEAT);
  for (let i = 0; i < NSEAT; i++) seatY[i] = compactY(SEATS[i].y, fct);

  // -- the crowd's tone ------------------------------------------------------
  // Rest is RIPE (see the header): the punishment is the darkening, so there
  // has to be something to darken. The wave runs from the top row down.
  const dark = new Float32Array(NSEAT);
  for (let i = 0; i < NSEAT; i++) {
    const start = darkF0 + smooth(SEATS[i].gr / (ROWS - 1)) * DARK_FRONT;
    dark[i] = smooth((frame - start) / TONE_DUR);
  }
  // ...and the five that did the bad things come back up out of it.
  const badTone = new Float32Array(NSEAT);
  BADS.forEach((b) => {
    badTone[b.seat] = smooth((frame - b.from) / TONE_DUR);
  });
  // The five are STRAINING from "like": their breath runs at 1.5x for the rest
  // of the piece. It is a remapped frame, not a scaled one, so the phase is
  // continuous across f60 and nothing snaps. Everyone else breathes as before.
  const strainF = frame <= beats.like1 ? frame : beats.like1 + (frame - beats.like1) * STRAIN_RATE;

  // -- idle traffic ----------------------------------------------------------
  // Cut 1's ambient, verbatim in behaviour, with both endpoints read off the
  // COMPACTED seat positions so the traffic rides the squeeze instead of
  // floating over it.
  const lit = new Float32Array(NSEAT);
  type Th = {
    key: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    op: number;
    head: number;
  };
  const threadEls: Th[] = [];

  const reach = 5;
  for (let j = 0; j < idleThreadCount; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * NSEAT);
    const sa = SEATS[a];
    const bc = clampi(sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * reach), 0, COLS - 1);
    const br = clampi(sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * reach), 0, ROWS - 1);
    const b = SEAT_AT[br * COLS + bc];
    if (b < 0 || b === a) continue;
    const sb = SEATS[b];
    const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], dn * fade);
    threadEls.push({
      key: `i${j}`,
      x1: sa.x,
      y1: seatY[a],
      x2: sa.x + (sb.x - sa.x) * dn,
      y2: seatY[a] + (seatY[b] - seatY[a]) * dn,
      op: 0.4 * fade,
      head: dn,
    });
  }

  // -- the punishing bead ----------------------------------------------------
  // One speed, straight down, dead stop on the lid's outside face. It leaves
  // the mark from wherever the mark is, which at f7-16 is its rest height.
  const beadY0 = MARK.y + markSize / 2;
  const beadOn = frame >= beadF0 && frame < beadF1 + BEAD_FADE;
  const beadY = interpolate(frame, [beadF0, beadF1], [beadY0, BEAD_Y1], clamp);
  const beadOp = interpolate(frame, [beadF1, beadF1 + BEAD_FADE], [1, 0], clamp);

  // -- the five reaches ------------------------------------------------------
  // Straight up at one speed, head-led, dead stop on the lid's inside face.
  // When the lid comes down the tip comes with it (the reach shortens from the
  // top), and from f87 the base rises to meet the tip and the reach is gone.
  // From the frame a tip lands it PUMPS — the tip comes back off the lid and
  // pushes out again, and keeps doing it into the press until the crush erases
  // it. The pump and the crush are combined rather than fought over: the pump
  // only ever moves the TIP, and the erase interpolates the base toward
  // whatever the tip currently is, so the crush always wins and the reach goes
  // to zero length on the lid's own last frame.
  const reaches = BADS.map((b, i) => {
    if (frame < b.from) return null;
    const erase = smooth((frame - eraseF0) / (lidF1 - eraseF0));
    if (erase >= 1) return null;
    const baseY = seatY[b.seat] - REACH_LIFT;
    const drawn = clamp01(((frame - b.from) * REACH_SPEED) / b.len);
    const pull = Math.min(PUMP_PULL, PUMP_CAP * b.len) * pumpAt(i, frame, ARRIVE[i]);
    const tipY = Math.max(lidTipY, baseY + (lidTipY - baseY) * drawn) + pull;
    return {
      key: i,
      x: b.x,
      y1: baseY + (tipY - baseY) * erase,
      y2: tipY,
      head: drawn,
    };
  });

  // -- the mark --------------------------------------------------------------
  // It sits at rest until "show", then drops onto the lid with a solved
  // back-overshoot. The lid is fully down by f93, so the seat it is aiming at
  // is a constant by the time the drop starts.
  const markRest = MARK.y;
  const markSeatY = lidOuter - MARK_SEAT - markSize / 2;
  const travel = markSeatY - markRest;
  const markY =
    frame <= markF0
      ? markRest
      : interpolate(frame, [markF0, markF1], [markRest, markSeatY], {
          ...clamp,
          easing: Easing.out(Easing.back(backFor(MARK_OVERSHOOT / Math.abs(travel)))),
        });

  // -- camera ----------------------------------------------------------------
  // Four moves on one damped track, built from the beats — see the header for
  // the windows and what each one is measured to land at.
  const camT = buildCamera(beats, markSize);
  const cam = runCamera(frame, camT.F, camT.CY, camT.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);
  const boxPath = lidDrop > 0 ? squirclePath(BOX_W, BOX_H - lidDrop) : BOX_PATH;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={camT.CY[0]}
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
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <defs>
              {/* the gate that was never built: cut 1 left it dashed, so the
                  wall's own segment is masked away from f0 and the dashed one
                  is drawn in its place. Both follow the lid down. */}
              <mask
                id="uh-gate"
                maskUnits="userSpaceOnUse"
                x={-400}
                y={-900}
                width={1900}
                height={1900}
              >
                <rect x={-400} y={-900} width={1900} height={1900} fill="#fff" />
                <rect x={GATE_X0} y={lidY - 6} width={GATE_X1 - GATE_X0} height={12} fill="#000" />
              </mask>
            </defs>

            {/* the crowd. Colour carries the state; the 35% swell is events
                only, never the rest tone. */}
            {SEATS.map((s, i) => {
              const event = Math.max(lit[i], badTone[i]);
              const l = Math.max(event, 1 - dark[i]);
              const bf = IS_BAD[i] ? strainF : frame;
              const r = dotRadius * s.r * s.rs * breath(bf, hash(i, 9)) * (1 + 0.35 * event);
              return <circle key={i} cx={s.x} cy={seatY[i]} r={r} fill={tone(l)} opacity={dotUnread} />;
            })}

            {/* idle traffic, head-led */}
            {threadEls.map((t) => (
              <g key={t.key}>
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={accent}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={t.op}
                />
                {t.head < 1 ? <circle cx={t.x2} cy={t.y2} r={4} fill={ink} opacity={t.op} /> : null}
              </g>
            ))}

            {/* the sandbox, rebuilt at the lid's height, with the gate masked
                out of its own wall */}
            <g style={{ filter: icon }}>
              <g mask="url(#uh-gate)">
                <path
                  d={boxPath}
                  transform={`translate(${BOX_X0} ${lidY})`}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE}
                  opacity={OP_READ}
                />
              </g>
              <line
                x1={GATE_X0}
                y1={lidY}
                x2={GATE_X1}
                y2={lidY}
                stroke={ink}
                strokeWidth={STROKE}
                strokeDasharray={`${GATE_DASH} ${GATE_GAP}`}
                opacity={OP_READ}
              />
            </g>

            {/* no internet ring and no wifi glyph: nothing in this line is
                about the internet, and cut 1 only draws them while it is. */}

            {/* the five reaches */}
            <g style={{ filter: icon }}>
              {reaches.map((l) =>
                l ? (
                  <g key={l.key}>
                    <line
                      x1={l.x}
                      y1={l.y1}
                      x2={l.x}
                      y2={l.y2}
                      stroke={ink}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={OP_READ}
                    />
                    {l.head < 1 ? <circle cx={l.x} cy={l.y2} r={4} fill={ink} /> : null}
                  </g>
                ) : null,
              )}
            </g>

            {/* the punishment, landing on the lid's outside face */}
            {beadOn ? (
              <circle
                cx={MARK.x}
                cy={beadY}
                r={BEAD_R}
                fill={ink}
                opacity={beadOp}
                style={{ filter: icon }}
              />
            ) : null}
          </svg>

          {/* the OpenAI mark, tinted white: at rest until "show", then sat on
              the lid for the rest of the piece */}
          <Img
            src={staticFile(markSrc)}
            style={{
              position: "absolute",
              left: MARK.x - markSize / 2,
              top: markY - markSize / 2,
              width: markSize,
              height: markSize,
              filter: `brightness(0) invert(1) ${icon}`,
            }}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default UnderHeel;
