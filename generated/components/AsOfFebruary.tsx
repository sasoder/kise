import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  FRAME_H,
  FRAME_W,
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
  camEase,
  camMove,
  clamp,
  clamp01,
  feather,
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  runCamera,
  smoothstep,
  squirclePath,
  sway,
  wobble,
  worldTransform,
  WOBBLE_R,
} from "./fieldShared";
import { EASE_ARRIVE, Trail, softFront } from "./levelUp";
import { CLAUDE } from "./brandGlyphs";
import { LABEL_FADE, LABEL_OP, makeLabel } from "./explainerShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// CUT 1 of the Dwarkesh clip `Ajeya_Six_Months_Behind`. Ajeya Cotra:
//
//   "the best available model as of this recording finished training and was
//    being used internally as of February."
//
// (The sentence after it, which this cut does NOT cover but which its resolved
// frame has to set up: "So Fable was being used internally at Anthropic as of
// February. We are six months behind the frontier already." — so the last
// thing the frame may say is SIX EMPTY MONTHS between the model and now.)
//
// SRT span 0:01.320 -> 0:06.679. round(5.359 * 24) = round(128.6) = 129 speech
// frames, plus the house 16-frame tail so the resolved state holds = 145.
//
// WORD ONSETS, frames from f0 (the table the whole piece is cut to):
//   f0   the          f64  and
//   f3   best         f73  was
//   f10  available    f77  being
//   f17  model        f84  used
//   f24  as           f92  internally
//   f31  of           f102 as
//   f33  this         f112 of
//   f35  recording    f114 february
//   f44  finished     f129 speech ends
//   f55  training     f145 last frame, held
//
// ---------------------------------------------------------------------------
// THE PICTURE. One motion: a model ASSEMBLES, its training COMPLETES, it is
// ENCLOSED with the people using it, and then the whole thing is PUSHED BACK
// IN TIME along a timeline, leaving six empty months between it and "now".
//
// THE WORLD (y down; world units = screen px at k 1):
//   THE MODEL    the Claude mark (inline `brandGlyphs.CLAUDE`, white, 108 world
//                px on the shared 24-unit em box, `iconShadow`) at (690, -120)
//                standing over a FLEET BLOB of 76 seats centred (690, 76) —
//                `RogueInstancesInterfere`'s superellipse (n 2.4) inscribed in
//                a 9 x 11 lattice at the field's own step, wobbled and
//                feathered, so the fleet is a rounded blob and never a box.
//                The two of them are one column, 333 world px tall.
//   THE COMPANY  an ink squircle 640 x 440 centred (540, 0) — x 220..860,
//                y -220..220. The mark and the blob stand in its right half,
//                the three people down its left.
//   THE PEOPLE   three `person.png` glyphs, white, 118 world px — the size every
//                other cut in this clip uses — on a shallow DESCENDING DIAGONAL,
//                (310, feet 35), (402, 105), (497, 178), each nudged by its own
//                hash, so that every thread out of them passes clear above the
//                heads of the ones to its right.
//   THE TIMELINE an ink rule at y 380.5 (snapped, odd stroke) running far past
//                both frame edges; THE PLAYHEAD = "now" is the vertical ink
//                line at x 540 hanging 240 from the rule down to y 620 with a
//                solid r 8 dot where it meets it; six month TICKS, 30 tall,
//                every 100 world px to the LEFT of the playhead (440, 340, 240,
//                140, 40, -60). V2: each tick carries its MONTH'S NAME 34 world
//                px under its foot (baseline y 429.5) and the playhead carries
//                NOW 34 under its own foot (y 654) — see the V2 block below.
//
// ---------------------------------------------------------------------------
// THE GESTURES. Every one of them is one word, and there is nothing else in
// the piece.
//
//   G1 ASSEMBLE   — "the best available model"        f-6..20
//        76 seats converge on the blob from beyond the frame's edges, each on
//        its OWN shallow hashed arc, with ONE speed (20 world px/frame) for all
//        of them, so a longer arc simply takes longer and the stagger is
//        carried by the launch frames. Landings are hashed across f13-20 and a
//        launch is the difference — which for the longest arcs is up to six
//        frames before f0, off-frame and invisible. Each fades up over its first
//        three tenths and lands on EASE_ARRIVE, DEEP tone; `Trail` smears any
//        head fast enough to need it (the worst measures 80 screen px/frame,
//        at f2, decaying to nothing by the seat). The last seat is home at f20,
//        one frame before "model" is spent. The mark is already there. No box,
//        no timeline, no people yet.
//   G2 NOW        — "as of this recording"            f24..42
//        The now-dot opens at x 540 on the rule's line (f24-27), the TIMELINE
//        draws head-led out of it BOTH ways past the frame edges (f24-36, to
//        +-610), and the PLAYHEAD draws head-led DOWN from the dot to y 620
//        (f30-40) and clicks ink-bright on f40. Between f36 and f48 the rule
//        goes on out to +-1700 — off-frame at every k this piece reaches — so
//        nothing new ever draws at the left during the slide.
//   G3 FINISHED   — "finished training"               f44..58
//        The blob goes DEEP -> RIPE as ONE wave out of its own centre, the
//        front softened over three seat-rings (`softFront`) and solved so the
//        OUTERMOST seat is fully ripe exactly on "training" at f55 — the front
//        has to cross the farthest seat's distance PLUS the width of its own
//        soft edge. The mark clicks ink-bright at f56.
//   G4 INSIDE     — "and was being used internally"   f64..92
//        The BOX draws head-led from the bottom-centre BOTH ways, f64-84,
//        closing at the top-centre with a click on "used" f84. The THREE PEOPLE
//        descend into it through that still-open top seam on individual arcs —
//        one speed again (32 world px/frame), launches f65, f68, f69, landings
//        f76, f80, f83 — each fading up over its first third. Every one of them
//        is inside before the wall that would have been in its way exists: the
//        last of the three crosses the box's top line at f70.8, when the two
//        heads are both still on the BOTTOM run, six frames from the corners.
//        As each lands an ACCENT THREAD draws head-led from its chest to a seat
//        AT ITS OWN HEIGHT in the blob, at one speed (24 world px/frame). The
//        three are 287, 243 and 214 px long and land at f88.0, f90.1 and f91.9
//        — staggered, the last of them on "internally" f92 — and they STAY.
//        From f92 ACCENT PACKETS run person -> blob and back along all three,
//        three or four alive at a time, for the rest of the piece: that is
//        "being used".
//   G5 BACK TO FEBRUARY — "as of February"            f102..126
//        THE SLIDE. The whole assembly — box, people, blob, mark, threads,
//        packets — travels 600 world px LEFT along the timeline (six ticks) on
//        one trapezoid-velocity profile, f102-126: smoothstep ramps over the
//        first and last 22% and a long even middle. Peak speed is 1.28x the
//        average instead of the 3x an in-out cubic gives, and — the reason it
//        is built this way — the six ticks it passes come up EVENLY. Under
//        EASE_MOVE four of the six landed inside five frames.
//        The playhead does not move. Each tick draws head-led over 3 frames as
//        the box's centre reaches it, two frames of anticipation: f105.8,
//        f108.9, f112.0, f115.1, f118.2, f124.0 — read back out of the slide's
//        own table by inversion, never off a parallel timer.
//   V2 THE MONTHS WRITTEN OUT — the only change in V2, and it adds no gesture
//        and moves no frame. The timeline's seven positions are NAMED, in Söhne
//        Kräftig off `explainerShared` (`makeLabel`, LABEL_OP, LABEL_FADE) at
//        LABEL_SIZE x 1.20 world px, uppercase, hanging 34 world px under the
//        FOOT of the mark each one names:
//          NOW   x 540, under the playhead's foot, f40   — on the playhead's click
//          JUL   x 440, under its tick, f105.8           — as its tick draws
//          JUN   x 340, f108.9   MAY x 240, f112.0
//          APR   x 140, f115.1   MAR x  40, f118.2
//          FEB   x -60, f126                             — with the box that lands on it
//        Every one fades up over LABEL_FADE and none of them ever leaves. They
//        are on the TIMELINE, not on the assembly, so they do not travel with
//        the box: the box slides left THROUGH a row of months that is being
//        written as it goes, and what was a count of six anonymous ticks reads
//        as FEB ... NOW without the viewer counting anything.
//   RESOLVED      — f126..145
//        The box at February with its three people using the lit model, six
//        ticks of empty month between it and the playhead at "now". Packets
//        keep running, the crowd keeps breathing, the camera is still opening
//        out under the tail. The gap is the hook for the next sentence and
//        nothing is put into it.
//
// ---------------------------------------------------------------------------
// THE CAMERA. THREE moves, an opening hold and a held breath, all through ONE
// damped track (`camMove` keys per frame; `runCamera` for cy and k, and a second
// pass of the same damper over the cx track, so a pan can never lead or lag the
// zoom it belongs to). It is MONOTONE: every move opens out and travels left, so
// the whole cut is one continuous widening and the lens never doubles back on
// itself. Every number below is MEASURED through the damper, not read off the
// key windows.
//
//   M0 HOLD      k 1.70  cx 690  content y -7                    f0-20
//        Tight on the blob region: the mark's top lands at screen y 552 and the
//        blob's bottom at 1130, so the assembly happens dead centre under the
//        caption band and the dots arrive from outside all four edges.
//   M1 OUT+LEFT  k 1.70 -> 1.371, cx 690 -> 620, c -7 -> 240
//        keys f21-31, warp 0.72, landed f42     — "as of this recording" f24-42
//        Opens to take in the rule and the playhead. Peak 2.1% of zoom and 7.0
//        world px of pan a frame — a move, not a drift. At the landing the
//        mark's top is at screen y 268 and the playhead's foot at 1357, the
//        block centred on 836.
//   M2 OUT+LEFT  k 1.371 -> 1.049, cx 620 -> 520, c 240 -> 217
//        keys f52-84, warp 0.72, landed f92  — "used" f84, "internally" f92
//        ONE move where there were two. It was a pull-back over the box's draw
//        (keys f52-62) and then a creep onto the sealed box (keys f73-85), and
//        between their two landings the damped zoom came down to 0.4%/frame,
//        held that for three frames and set off again — same direction, same
//        kind of move, so the pair read as one move that hesitated in the
//        middle rather than as two beats. Merged, the damper sees a single
//        deceleration lobe: 1.14%/frame at its peak (f68, the middle of the box
//        drawing itself), never a second acceleration, and by f88 it is inside
//        0.15%/frame with the box shut and the threads still landing. It takes
//        the whole construction of the box in one breath, opens the empty
//        timeline to the LEFT of the box into frame, and settles on the sealed
//        box as the three threads land on "internally".
//   M3 THE HELD BREATH                                            f92-101
//        TEN FRAMES DEAD STILL, and they are not a gap in the track but the
//        thing the slide is released out of: measured across them the zoom
//        moves 0.06% in total, the pan 0.1 world px in total, and the box's
//        centre sits at screen y 607.0 +- 0.1. Nothing in the frame is still —
//        the packets run, the crowd breathes — but the LENS is, so when the
//        slide goes on f102 it is the only thing that moves.
//   M4 FOLLOW    k 1.049 -> 0.930, cx 520 -> 112, c 217
//        keys f102-130, warp 0.6                          — "february" f114
//        Released on the slide's own first frame and follows it out and left.
//        Its cx does NOT ride an ease of its own: it rides the SLIDE's profile,
//        read CAM_LEAD frames ahead of itself (see `xSlide`). Its keys run past
//        the end of the slide on purpose, so the frame is still opening at f134
//        and only settles at f140 — the last thing the piece does is a move,
//        not a park.
//        SOLVED at the resolved zoom and checked at every frame of the slide:
//        the box (now x -420..220) keeps 80 screen px of margin on the left and
//        NOW 98 px of frame to its right, and across the whole move the box
//        never comes inside 54.5 px of the left edge (f124) nor NOW inside 97.3
//        of the right (f132).
//
// THE FRAME'S BALANCE. Every content centre above is the MIDPOINT OF THE BLOCK
// THAT IS ACTUALLY ON SCREEN, and `CAM_LIFT / k` puts that midpoint on screen y
// 835 at every k — measured, the block's centre is 834-836 at every beat of the
// piece. At the resolved wide (k 0.930) the block runs screen y 429..1241: the
// box's centre at 633, the rule at 987, the playhead's foot at 1210, NOW's
// baseline at 1241, and 239 px of clear frame under it before the captions. The
// lowest ink the piece ever puts on screen is the now-dot at 1452 on the single
// frame it opens, f24, with the camera still at k 1.67 and pulling back; from
// f30 on nothing is below 1300. Nothing is ever inside the bottom 440 px.
//
// ambient, not gestures: idle thread traffic inside the blob from f20 at the
// shared rate (180 per 1,200 agents = 11 threads), `breath` on every dot,
// `sway` on the camera, the grid's own drift and parallax.
// ---------------------------------------------------------------------------

export const DURATION = 145;

export const WORLD_W = FRAME_W;
export const WORLD_H = 1400;

export const STROKE = 3; // the one stroke weight in this piece
export const CENTRE_X = 540;

// ---------------------------------------------------------------------------
// THE WORLD'S SCALE IS SOLVED BACKWARDS FROM THE RESOLVED FRAME, and that is
// the one thing in this piece that could not be taken off the brief as written.
//
// The resolved frame has to hold the slid box's left edge and the playhead's
// own label at once, with margins (50 screen px on the left, 90 on the right).
// That fixes the zoom:  1080/k >= (NOW's right - boxLeft) + 140/k.  With the
// brief's 150 px month and its 700 px box that is 1,250 world px and k <= 0.72
// — and 0.72 is a ceiling, not a value, because at the ceiling the legal camera
// is a single point and a damped camera cannot sit on a point. Built at the
// brief's numbers and measured, the resolved frame came out at k 0.62: the box
// 434 screen px wide, the dots 3.4 px across, and 71% of a 1080 x 1920 frame
// empty. On a phone at 270 px wide that is a 108 px box.
//
// V3, THE HARMONY PASS. This cut was delivered at k 0.78 with 110 px people,
// and cut by cut against the other four it was the odd one out twice over: the
// smallest picture of the set (the rest resolve at k 1.00-1.05) and the only one
// whose people were not 118. Two world numbers came in to fix both at once —
// THE MONTH from 120 to 100 and THE BOX from 700 to 640 wide — which takes what
// the frame has to hold from 1,190 world px down to 968.8 and lets the zoom go
// from 0.78 to 0.93. The people then go to 118 and are still 40.7 px inside the
// left wall and 34.3 clear of the fleet, because their step came down from 110
// to 92 (see PEOPLE_X — the step is solved against the glyph's ink profile, not
// its box). Nothing about what the cut DOES changed: same beats, same gestures,
// same 145 frames, same slide of exactly six months.
//
// The rest of the scale:
//   * THE BOX is 440 tall. Its right-hand column (mark, gap, blob) is 338 px
//     and its left-hand one (the diagonal of people) 243; 520 left sixty px of
//     dead air inside it that no gesture ever used.
//   * THE TIMELINE HANGS LOWER — 160 below the box instead of 80 — because the
//     9:16 frame is 1,920 px tall and the composition was only using 29% of it.
//     THE PLAYHEAD DROPS 240, not the brief's 300 and not the 480 this piece
//     first shipped with: see PLAY_Y1. The content block is 874 world px and at
//     the resolved zoom it runs screen y 429..1241, centred on 835, with 239 px
//     of clear frame between its foot and the caption band.
// Everything else — the blob, the mark, the six ticks, the slide being exactly
// six months — is the brief's.
// ---------------------------------------------------------------------------

// -- the company -------------------------------------------------------------
export const BOX_W = 640;
export const BOX_H = 440;
export const BOX_CY = 0;
export const BOX_X0 = CENTRE_X - BOX_W / 2; // 220
export const BOX_X1 = CENTRE_X + BOX_W / 2; // 860
export const BOX_Y0 = BOX_CY - BOX_H / 2; // -220
export const BOX_Y1 = BOX_CY + BOX_H / 2; // 220
export const BOX_PATH = squirclePath(BOX_W, BOX_H);

// -- the model ---------------------------------------------------------------
// The right-hand column of the box: the mark over the fleet it stands for,
// 59 world px apart, the pair spanning y -174..164, and the box's height is
// that column plus 46 of margin at the top and 56 at the bottom — nothing else
// decides it. Across, the fleet's own seats run x 588..793 and their discs
// 581..800, so the narrowed box (x 220..860) still leaves the blob 60 world px
// clear of its right wall, and the mark — 108 wide, x 636..744 — is inside that.
export const BLOB = { x: 690, y: 76 };
export const MARK = { x: 690, y: -120 };
export const MARK_SIZE = 108;

// -- the people --------------------------------------------------------------
// person.png is a 512 box whose glyph runs x 41..470, y 41..471, so the ink is
// 0.840 of the drawn box across and 0.842 down and the feet sit at 0.922 of the
// drawn height — that is what puts them ON the floor and not through it.
//
// 118, THE SET'S SIZE. This cut shipped at 110 and was the only one of the five
// that did; side by side with cut 3 its people were visibly the smaller ones, on
// top of a resolved wide that was itself the widest of the set, so the same
// person read two sizes in one edit. 118 is the value every other cut states,
// and the three of them still stand apart inside the box — see PEOPLE_X, where
// the step is solved against the glyph's real ink and not against its box.
export const PERSON_SIZE = 118;
export const PERSON_FOOT = 471 / 512;
// NOT A ROW. Three people standing level in a line to the left of the blob
// cannot each have a thread into it: the leftmost one's thread has to cross the
// other two, and drawn behind a 0.9-opacity glyph it shows through the body as
// a scratch. Rendered and looked at, that is exactly what it did.
//
// So they stand on a shallow DESCENDING DIAGONAL instead — 92 world px apart
// across and 70 down, each nudged by its own hash so the diagonal is not ruled
// either. Every thread then leaves its own person at a different height and
// passes clear ABOVE the heads of the ones to its right, checked against the
// glyph's real ink box. It also puts people down the whole left side of the box
// instead of in a strip along its floor, which is what that half of the box is
// for.
//
// THE STEP IS 92, NOT 110, AND IT IS SOLVED AGAINST THE GLYPH'S PROFILE. At 118
// the ink is 99 world px across at the shoulders — but the shoulders are only
// the bottom third of it; measured band by band off person.png, the top 30% of
// the ink (the head) is at most 0.40 of the box, 47 px. A person is 70 lower
// than the one to its left, so the 29 px where the two overlap in y is that
// one's SHOULDER against this one's HEAD: 49.6 + 23.6 = 73.2 px is what they
// actually need, and 92 leaves 19-22 px of air there.
// The left wall moved in with the box (220, not 190), so the base moved out to
// 310: the leftmost ink then starts at 260.6, 40.6 px inside the wall, and the
// rightmost ends at 546.7 — 34 px clear of the fleet's leftmost disc at 581,
// with only a shoulder's 7 px across the box's own midline.
export const PEOPLE_X = [0, 1, 2].map((i) => 310 + i * 92 + (hash(i, 42) - 0.5) * 8);
export const PEOPLE_FOOT_Y = [0, 1, 2].map((i) => 40 + i * 70 + (hash(i, 41) - 0.5) * 16);

// -- the timeline ------------------------------------------------------------
// Snapped to Math.round(y) + 0.5 against the odd stroke, or an ink rule
// antialiases anywhere between 4% and 13% and the whole field shimmers.
export const TL_Y = Math.round(BOX_Y1 + 160) + 0.5; // 380.5
export const PLAY_X = CENTRE_X;
// THE PLAYHEAD DROPS 240, NOT 480. At 480 the "now" line was the tallest thing
// in the piece: it hung 480 world px under a 440 px box, so the content block
// was 1,120 world px of which more than two fifths was one empty vertical line,
// and centring that block on screen y 835 pushed the box — the thing the cut is
// actually about — up to screen y 590 with the line's foot sitting on the lip of
// the caption band. At 240 the block is 880, the box centre comes back down to
// 695 and the rule to 991, and the playhead still reads as a line that hangs
// rather than a tick, because it is eight times the tick's own 30.
export const PLAY_Y1 = TL_Y + 240 - 0.5; // 620
export const PLAY_DOT_R = 8;
// THE MONTH IS 100 WORLD PX. Six of them plus the box is what the resolved wide
// has to hold at once, so the pitch is the one number that decides how big
// everything else can be on screen: at 120 the frame had to carry 1,190 world px
// and the whole picture resolved at k 0.78 — the smallest, sparsest of the five
// cuts in the edit. At 100 it carries 970 and resolves at K_FINAL below, which
// is the set's own zoom. Six ticks are still six months; they are simply not
// asked to be a third of the frame's width.
export const TICK_STEP = 100;
export const TICK_N = 6;
export const TICK_H = 30;
export const TICKS = Array.from({ length: TICK_N }, (_, i) => PLAY_X - TICK_STEP * (i + 1));
export const SLIDE_DX = -TICK_STEP * TICK_N; // -600: six months to the left

// -- V2: THE MONTHS, WRITTEN OUT ---------------------------------------------
// The one change in V2. The timeline had six anonymous ticks and a playhead, so
// "six months" was a count the viewer had to make; now every position on it is
// named. SEVEN LABELLED POSITIONS, SIX INTERVALS: the six ticks are the six
// month positions and the LAST of them (TICKS[5], x -60) is the one the box
// lands on, so that one is FEB and no tick had to be added —
// checked on the resolved frame, where the box's centre and the leftmost tick
// are the same x.
// Left to right: FEB MAR APR MAY JUN JUL, then the playhead = NOW. TICKS runs
// right to left, so MONTH_NAMES does too.
//
// SIZE. `LABEL_SIZE` x 1.20 in world px — 1.30 until the month came in to 100.
// Measured off Söhne Kräftig's own advance widths at LABEL_SIZE with
// LABEL_TRACK, the widest of these seven is NOW at 78.9 world px and the widest
// MONTH pair is MAR (73.7) against APR (67.0) and APR against MAY (73.5). At
// 1.30 those neighbours would sit 8.5 px apart at a 100 px pitch; at 1.20 they
// keep 15.6 px of set width and 18.5 of actual ink, since the trailing letter-
// space of each is blank. The labels are nonetheless BIGGER on screen than they
// were — 1.20 x 30 at the new k against 1.30 x 30 at 0.78 — which is the point:
// the frame came in, so the type did not have to grow to be read.
export const MONTH_LABEL_SCALE = 1.2;
//
// WHERE. A label hangs 34 world px under THE FOOT OF THE MARK IT NAMES, not 34
// under the rule: the tick hangs 15 below the rule, so a baseline at TL_Y + 34
// puts the cap line 5 px INSIDE the tick and the tick draws a stroke down
// through the middle letter. Off the tick's foot the cap line clears it by 9.
// The same rule puts NOW 34 under the PLAYHEAD'S foot (y 654) rather than in the
// month row: the playhead is a line hanging 240 px down from x 540, and a NOW
// centred in the row at x 540 would have that line drawn vertically through the
// middle of its O. Off the foot it clears the line by the same 9 px the months
// clear their ticks, and it reads as the label of the thing that hangs.
export const MONTH_LABEL_DY = 34; // baseline, from the foot of the mark it names
export const MONTH_LABEL_Y = TL_Y + TICK_H / 2 + MONTH_LABEL_DY; // 429.5
export const NOW_LABEL_Y = PLAY_Y1 + MONTH_LABEL_DY; // 654
export const MONTH_NAMES = ["JUL", "JUN", "MAY", "APR", "MAR", "FEB"]; // TICKS order

// ---------------------------------------------------------------------------
// THE FLEET BLOB. `RogueInstancesInterfere`'s construction, unchanged: the
// 10 x 9 lattice at the field's own step is only where a seat may STAND; the
// fleet's outline is a superellipse inscribed in that box, undulated by
// `wobble` along its perimeter and feathered across its outer 1.5 steps, so
// density falls off toward the edge and the dots that survive out there are
// smaller. 90 cells laid out, 75 alive.
// ---------------------------------------------------------------------------
const STEP_X = 940 / 39;
const STEP_Y = 440 / 29;
// 9 x 11, not `RogueInstancesInterfere`'s 10 x 9. The field's step is 24.1 x
// 15.2, so a 10 x 9 lattice is 241 x 137 world px — nearly twice as wide as it
// is tall — and the superellipse cut through it reads as a crescent rather than
// as a body of instances standing under a mark. That is fine for that piece,
// where two small fleets sit side by side; here the blob is the hero of the
// first twenty frames and it has to read as one rounded thing. 9 x 11 is
// 217 x 167, the roundest lattice at this step that still holds ~75 seats.
const F_COLS = 9;
const F_ROWS = 11;
const SE_N = 2.4;
const BLOB_AX = ((F_COLS - 1) / 2 + 0.5) * STEP_X;
const BLOB_AY = ((F_ROWS - 1) / 2 + 0.5) * STEP_Y;
const BLOB_FEATHER = 1.5;
const BLOB_SEED = 2.208;

const blobInside = (dx: number, dy: number) => {
  const L = Math.hypot(dx, dy);
  if (L < 1e-6) return 99;
  const g = Math.pow(Math.abs(dx) / BLOB_AX, SE_N) + Math.pow(Math.abs(dy) / BLOB_AY, SE_N);
  const t = Math.pow(g, 1 / SE_N); // 1 exactly on the boundary
  const stepAlong = L / Math.hypot(dx / STEP_X, dy / STEP_Y);
  return (L / t - L) / stepAlong + wobble(Math.atan2(dy, dx) * WOBBLE_R, BLOB_SEED) + BLOB_FEATHER / 2;
};

export type Seat = { x: number; y: number; r: number; rs: number; gc: number; gr: number; d: number };
export const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (let gr = 0; gr < F_ROWS; gr++) {
    for (let gc = 0; gc < F_COLS; gc++) {
      const i = gr * F_COLS + gc;
      const x = BLOB.x + (gc - (F_COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9;
      const y = BLOB.y + (gr - (F_ROWS - 1) / 2) * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9;
      const ins = blobInside(x - BLOB.x, y - BLOB.y);
      const fe = feather(ins, BLOB_FEATHER);
      if (hash(i, 71) >= fe) continue;
      out.push({
        x,
        y,
        r: 0.75 + 0.5 * hash(i, 13),
        rs: 0.7 + 0.3 * fe,
        gc,
        gr,
        d: Math.hypot(x - BLOB.x, y - BLOB.y),
      });
    }
  }
  return out;
})();
export const NSEAT = SEATS.length;
const SEAT_AT = new Int32Array(F_ROWS * F_COLS).fill(-1);
SEATS.forEach((s, i) => {
  SEAT_AT[s.gr * F_COLS + s.gc] = i;
});

// ---------------------------------------------------------------------------
// G5 THE SLIDE. A trapezoid velocity profile with smoothstep ramps: the box
// accelerates over the first 22% of the move, holds one speed through the
// middle, and eases out over the last 22%. Peak speed is 1.28x the average
// rather than the 3x an in-out cubic would give, and — the reason it is built
// this way rather than taken off `EASE_MOVE` — the six ticks it passes come up
// EVENLY. Under an in-out cubic four of the six land inside five frames.
//
// The profile is integrated once into a table and normalised, and the tick
// frames are read back out of that same table by inversion, so a tick's draw is
// derived from where the box actually is and the two can never drift.
// ---------------------------------------------------------------------------
export const SLIDE_F0 = 102;
export const SLIDE_F1 = 126;
export const SLIDE_RAMP = 0.22;
export const TICK_DRAW = 3; // frames, head-led
export const TICK_LEAD = 2; // frames of anticipation, never late

const SLIDE_N = 480;
const rampTable = (ramp: number) => {
  const v = (t: number) =>
    t < ramp ? smoothstep(t / ramp) : t > 1 - ramp ? smoothstep((1 - t) / ramp) : 1;
  const a = new Float64Array(SLIDE_N + 1);
  for (let n = 1; n <= SLIDE_N; n++) a[n] = a[n - 1] + v((n - 0.5) / SLIDE_N);
  const total = a[SLIDE_N];
  for (let n = 0; n <= SLIDE_N; n++) a[n] /= total;
  return a;
};
const readTable = (a: Float64Array, t: number) => {
  const x = clamp01(t) * SLIDE_N;
  const n = Math.min(SLIDE_N - 1, Math.floor(x));
  return a[n] + (a[n + 1] - a[n]) * (x - n);
};
const SLIDE_TABLE = rampTable(SLIDE_RAMP);

export const slideP = (f: number) =>
  readTable(SLIDE_TABLE, (f - SLIDE_F0) / (SLIDE_F1 - SLIDE_F0));
export const slideX = (f: number) => SLIDE_DX * slideP(f);


/** The frame at which the slide has covered a share p of its travel. */
const slideFrameAt = (p: number) => {
  let n = 0;
  while (n < SLIDE_N && SLIDE_TABLE[n + 1] < p) n++;
  const lo = SLIDE_TABLE[n];
  const hi = SLIDE_TABLE[n + 1];
  const t = hi > lo ? (p - lo) / (hi - lo) : 0;
  return SLIDE_F0 + ((n + t) / SLIDE_N) * (SLIDE_F1 - SLIDE_F0);
};

// Each tick draws as the box's CENTRE reaches it, two frames early.
export const TICK_F0 = TICKS.map((x) => slideFrameAt((CENTRE_X - x) / -SLIDE_DX) - TICK_LEAD);

// V2: a month's name appears WITH ITS TICK — the same frame the tick's head
// leaves the rule, fading up over LABEL_FADE — so the row is written out in the
// order the box counts back through it: JUL f105.8, JUN f108.9, MAY f112.0,
// APR f115.1, MAR f118.2. The exception is FEB, which does not come up with its
// tick at f124 but with the BOX at f126: FEB is not a month the box passes, it
// is the month the box STOPS in, and it has to be named by the arrival and not
// two frames before it.
export const MONTH_LABEL_F0 = TICK_F0.map((f, i) => (i === TICK_N - 1 ? SLIDE_F1 : f));

// ---------------------------------------------------------------------------
// THE CAMERA TRACK. Authored as consecutive `camMove` segments (a key per
// frame), the gaps between them one held key, and the whole thing put through
// the shared damper. cx rides the SAME eased profile and the SAME damper — a
// second `runCamera` pass over the cx track — so a pan can never lead or lag
// the zoom it belongs to.
//
// CONTENT CENTRES are solved, not typed, and every one of them is the MIDPOINT
// OF THE CONTENT BLOCK THAT IS IN FRAME AT THAT MOMENT — top of the highest ink
// to the foot of the lowest. `CAM_LIFT / k` is what drops such a centre onto
// screen y 835 under the captions, and `camMove` already takes cy off the eased
// k, so a move's endpoints are content centres in world y and the block stays
// centred THROUGH the move, not only at its ends.
//   C_OPEN   -7  the mark's top (-174) to the blob's bottom (159): the lockup
//                sits screen 501..1031 at k 1.70.
//   C_NOW   240  the mark's top (-174) to NOW's baseline (654) — the block the
//                piece is showing from the moment the playhead is down.
//   C_WIDE  217  the box's top (-220) to NOW's baseline (654), the block every
//                frame from the box's close onward.
// The foot of both blocks is NOW'S BASELINE and not the playhead's foot: the
// label is the lowest ink in the frame from f40 to the end, and framing on the
// line above it left the whole block sitting 16-24 px low, its centre at screen
// 851-859 instead of 835. That is small and it was wrong in the same direction
// everywhere, which is exactly the kind of thing this pass is for.
// ---------------------------------------------------------------------------
// THE ZOOM LADDER HANGS OFF K_FINAL, and K_OPEN is the one rung that does not.
//
// K_FINAL is solved against the frame (see CX_FINAL below) and came in from 0.78
// to 0.93 on this pass. The two rungs above it are the same MULTIPLES of it the
// cut always had (1.474, 1.128), so they travel with it and M2 and M4 keep the
// zoom travel — and so the damped rate — they were tuned to: 23% and 11.4%. Had
// K_NOW and K_CREEP stayed where they were, M2 would have had 8.8% of travel
// over 32 frames, 0.28%/frame, which is not a move but a drift.
//
// K_OPEN STAYS AT 1.70, typed. The opening is the only framing in the piece that
// has nothing to do with the box's width or the month's pitch — it is tight on
// the blob and the mark, and neither of those changed — and the whole arrival
// solve is written against it (ARRIVE_* below reads the opening frame's real
// rect). Carried up with the rest of the ladder it would have been 2.03, which
// puts the rule's first frame at screen y 1566, inside the caption band. It also
// means M1 travels 19.4% rather than 32%: measured through the damper that is a
// 2.2%/frame peak, still twice the floor a move has to clear.
export const K_FINAL = 0.93;
export const K_CREEP = K_FINAL * (0.88 / 0.78); // 1.049
export const K_NOW = K_FINAL * (1.15 / 0.78); // 1.371
export const K_OPEN = 1.7;

export const C_OPEN = (MARK.y - MARK_SIZE / 2 + (BLOB.y + BLOB_AY)) / 2; // -7
export const C_NOW = (MARK.y - MARK_SIZE / 2 + NOW_LABEL_Y) / 2; // 240
export const C_WIDE = (BOX_Y0 + NOW_LABEL_Y) / 2; // 217

export const CX_OPEN = BLOB.x; // 690
export const CX_NOW = 620;
export const CX_CREEP = 520;

// K_FINAL and CX_FINAL are SOLVED, not chosen, and they are solved against the
// WHOLE slide rather than against its last frame. What has to be in frame is
// the slid box's left edge (BOX_X0 + SLIDE_DX - STROKE/2 = -381.5) keeping >= 50
// screen px, and on the right the playhead's own label — NOW's right edge at
// 540 + 47.3 = 587.3, which is further right than the playhead itself — keeping
// >= 90 screen px. So the frame has to hold 968.8 world px plus both margins:
//     1080/k >= 968.8 + 140/k   ->   k <= 0.970,
// and a ceiling is not a value: at the ceiling the legal cx is a single point
// and a damped camera cannot sit on a point. At k 0.93 the interval is
// [103.5, 145.3] — 42 px wide, enough for the damper and for `sway`'s +-3.
//
// 112 is NOT that interval's middle, and the reason is that the interval is
// checked at EVERY frame of the slide and not only at the end. The box travels
// left at up to 27 world px a frame and the damped pan is behind it through the
// back half of the move, so the tightest frame of the whole piece is f124 — two
// frames before the box lands — and not f144. Measured frame by frame across
// f102-145: the box's left edge never comes inside 54.5 screen px (f124) and
// NOW's right edge never inside 97.3 (f132); on the resolved frame itself they
// are 80 and 98. At the interval's middle f124 would have been 43.8.
export const CX_FINAL = 112;

export const CAM_LEAD = 4; // frames: the damper's lag, put back into a followed pan

export type CamSeg = {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  c0: number;
  c1: number;
  x0: number;
  x1: number;
  warp: number;
  // A pan may be taken off the SLIDE'S OWN PROFILE instead of an ease of its
  // own, which is what M4 does. A camera following a moving thing has to move
  // the way that thing moves: keyed on the zoom's curve, the pan was ahead of
  // the box for the first six frames of the slide (the slide's velocity ramps
  // in and the camera's does not), so the box drifted 26 screen px to the RIGHT
  // before it started travelling left, and the whole gesture read as a lurch
  // backwards before it went anywhere. On the slide's own profile the two share
  // one velocity shape and the box only ever moves one way on screen.
  xSlide?: boolean;
};

export const CAM_SEGS: CamSeg[] = [
  // M1 "as of this recording" — out and left, the rule and the playhead arrive
  {
    f0: 21,
    f1: 31,
    k0: K_OPEN,
    k1: K_NOW,
    c0: C_OPEN,
    c1: C_NOW,
    x0: CX_OPEN,
    x1: CX_NOW,
    warp: 0.72,
  },
  // M2 "and was being used ... internally" — ONE move, not two. It used to be a
  // pull-back over the box's draw (f52-62) and then a creep onto the sealed box
  // (f73-85), both opening out and both travelling left, with a three-frame
  // dwell between them. Two moves the same way with a dwell in the middle do not
  // read as two beats — measured, the damped zoom came off its first landing at
  // 0.4%/frame, sat there for three frames and then went again, which is a stall
  // and then a restart, exactly the hesitation the house rule is about. Merged
  // it is one deceleration lobe: the zoom takes the box's whole construction,
  // opens the empty timeline to the LEFT of the box into frame, and settles on
  // the sealed box as the three threads land on "internally".
  {
    f0: 52,
    f1: 84,
    k0: K_NOW,
    k1: K_CREEP,
    c0: C_NOW,
    c1: C_WIDE,
    x0: CX_NOW,
    x1: CX_CREEP,
    warp: 0.72,
  },
  // M3 is not a segment: it is the HELD BREATH the gap leaves, f92-101, dead
  // still on the sealed box before the slide takes it.
  // M4 "as of February" — released with the slide and following it out and left
  {
    f0: 102,
    f1: 130,
    k0: K_CREEP,
    k1: K_FINAL,
    c0: C_WIDE,
    c1: C_WIDE,
    x0: CX_CREEP,
    x1: CX_FINAL,
    warp: 0.6,
    xSlide: true,
  },
];

const CAM_TRACK = (() => {
  const F: number[] = [0];
  const K: number[] = [K_OPEN];
  const CY: number[] = [C_OPEN + CAM_LIFT / K_OPEN];
  const CX: number[] = [CX_OPEN];
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
    CX.push(CX[CX.length - 1]);
  };
  CAM_SEGS.forEach((s) => {
    if (s.f0 > F[F.length - 1] + 1) hold(s.f0 - 1);
    const m = camMove(s);
    const span = s.f1 - s.f0;
    m.F.forEach((f, i) => {
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
      // On the slide's own profile the pan is read CAM_LEAD frames ahead of
      // itself, which is the damper's own lag put back in: handed the profile
      // straight, the damped camera trails the box by about six frames and the
      // box overshoots to 11 screen px from the left edge before the lens
      // catches up. Leading it puts the box's travel inside its margins at
      // every frame of the slide (checked frame by frame).
      const gx = s.xSlide ? slideP(f + CAM_LEAD) : camEase(i / span, s.warp);
      CX.push(s.x0 + (s.x1 - s.x0) * gx);
    });
  });
  if (F[F.length - 1] < DURATION) hold(DURATION);
  return { F, K, CY, CX };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;
export const CAM_CX = CAM_TRACK.CX;

/** The damped camera at a frame: cy and k off one pass, cx off a second pass of
 *  the same damper over the same key frames, so all three settle together. */
export const cameraAt = (frame: number) => {
  const a = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const b = runCamera(frame, CAM_F, CAM_CX, CAM_K);
  return { cy: a.cy, k: a.k, cx: b.cy };
};

// The damped k at every integer frame, run once: the arrival solve needs to
// know what the lens is doing while a dot is in the air, because a world speed
// is only legible as a SCREEN speed.
export const K_AT: Float64Array = (() => {
  const a = new Float64Array(DURATION + 1);
  for (let f = 0; f <= DURATION; f++) a[f] = runCamera(f, CAM_F, CAM_CY, CAM_K).k;
  return a;
})();

// ---------------------------------------------------------------------------
// G1 THE ASSEMBLE. Every seat comes in from beyond the frame's edge at the
// opening framing, on its own shallow arc.
//
// The origin is the point where the seat's own ray leaves the OPENING FRAME
// (solved from K_OPEN 1.70, cx 690, cy = C_OPEN + CAM_LIFT/1.70 — the real
// rect, not a guess), pushed a hashed 30-110 px further out and capped at
// ORIGIN_MAX. The cap is what makes the piece possible: the frame is 635 x 1129
// world px at that zoom, so a ray straight up leaves it about 555 px away and a
// ray sideways only about 318, and without the cap the vertical arrivals would
// have to run at nearly twice the speed of the lateral ones to land on the same
// beat. With it every arc is 270-470 px and ONE speed serves all of them, which
// is also the house habit: one speed, and the START frames carry the stagger.
//
// A seat's duration is therefore its own length over that speed, its landing
// frame is hashed across f12-20, and its launch is the difference — which for
// the longest arcs is a few frames BEFORE f0. That is deliberate and it is
// invisible: at f0 those dots are still outside the frame. The alternative,
// clamping every launch to f0, forces the long arcs to run at 2x and they
// strobe.
// ---------------------------------------------------------------------------
export const ARRIVE_SPEED = 20; // world px/frame, the one speed for all of them
export const ARRIVE_ORIGIN_MAX = 470;
export const ARRIVE_LAND_0 = 13;
export const ARRIVE_LAND_1 = 20;
export const ARRIVE_LAUNCH_MIN = -6; // how far before f0 an arc may already be running
export const ARRIVE_FADE = 0.3; // the share of a flight it fades up over

const OPEN_CY = C_OPEN + CAM_LIFT / K_OPEN;
const OPEN_HALF_W = FRAME_W / 2 / K_OPEN;
const OPEN_HALF_H = FRAME_H / 2 / K_OPEN;

/** How far along the ray (dx, dy) from (x, y) the opening frame's edge is. */
const exitDistance = (x: number, y: number, dx: number, dy: number) => {
  const tx = dx > 0 ? (CX_OPEN + OPEN_HALF_W - x) / dx : (CX_OPEN - OPEN_HALF_W - x) / dx;
  const ty = dy > 0 ? (OPEN_CY + OPEN_HALF_H - y) / dy : (OPEN_CY - OPEN_HALF_H - y) / dy;
  return Math.min(Math.abs(tx), Math.abs(ty));
};

export type Arrival = {
  ox: number;
  oy: number;
  cxp: number; // the arc's control point
  cyp: number;
  launch: number;
  dur: number;
};

export const ARRIVALS: Arrival[] = SEATS.map((s, i) => {
  const th = hash(i, 51) * Math.PI * 2;
  const dx = Math.cos(th);
  const dy = Math.sin(th);
  const dist = Math.min(ARRIVE_ORIGIN_MAX, exitDistance(s.x, s.y, dx, dy) + 30 + hash(i, 52) * 80);
  const ox = s.x + dx * dist;
  const oy = s.y + dy * dist;
  const land = ARRIVE_LAND_0 + hash(i, 53) * (ARRIVE_LAND_1 - ARRIVE_LAND_0);
  // one speed for all of them, and then the only thing that is allowed to
  // shorten a flight is the floor on how early it may have launched
  const dur = Math.max(8, Math.min(dist / ARRIVE_SPEED, land - ARRIVE_LAUNCH_MIN));
  // the arc: the chord's midpoint pushed sideways, hashed either way, shallow
  const bulge = (hash(i, 54) - 0.5) * 0.34 * dist;
  return {
    ox,
    oy,
    cxp: (ox + s.x) / 2 - dy * bulge,
    cyp: (oy + s.y) / 2 + dx * bulge,
    launch: land - dur,
    dur,
  };
});

/** Where seat i is at a frame, and how far up its arrival fade has come. */
export const seatAt = (i: number, frame: number) => {
  const a = ARRIVALS[i];
  const s = SEATS[i];
  const u = clamp01((frame - a.launch) / a.dur);
  if (u >= 1) return { x: s.x, y: s.y, op: 1 };
  const t = EASE_ARRIVE(u);
  const m = 1 - t;
  return {
    x: m * m * a.ox + 2 * m * t * a.cxp + t * t * s.x,
    y: m * m * a.oy + 2 * m * t * a.cyp + t * t * s.y,
    op: clamp01(u / ARRIVE_FADE),
  };
};

// ---------------------------------------------------------------------------
// G2 THE TIMELINE. The rule draws head-led out of the now-dot both ways and
// then keeps going, off-frame, out to where the slide will need it: the whole
// point of the gesture is that by the time the box travels left the road is
// already there, so nothing new ever draws at the left edge under the slide.
// TL_VIS is how far it has to reach to be off both edges at M1's landed k 1.371
// (the frame runs world x 226..1014 there); TL_FULL is where it stops.
// ---------------------------------------------------------------------------
export const TL_F0 = 24;
export const TL_F1 = 36; // head-led, and off both frame edges by here
export const TL_FULL_F = 48; // off-frame the whole way, so this is unseen
export const TL_VIS = 610;
export const TL_FULL = 1700;
export const PLAY_F0 = 30;
export const PLAY_F1 = 40;
export const CLICK_DUR = 3;
// V2: NOW is written under the playhead's foot on the frame the playhead CLICKS
// — the label and the click are one event, the way a month and its tick are.
export const NOW_LABEL_F0 = PLAY_F1;

export const tlExtent = (f: number) =>
  f < TL_F1
    ? TL_VIS * EASE_ARRIVE(clamp01((f - TL_F0) / (TL_F1 - TL_F0)))
    : interpolate(f, [TL_F1, TL_FULL_F], [TL_VIS, TL_FULL], clamp);

// ---------------------------------------------------------------------------
// G3 THE WAVE. Deep -> ripe out of the blob's own centre, the front softened
// over three seat-rings by the shared `softFront` rather than snapping ring by
// ring. The front is solved so the OUTERMOST seat is fully ripe exactly on
// "training": it has to travel the farthest seat's distance plus the width of
// its own soft edge.
// ---------------------------------------------------------------------------
export const WAVE_F0 = 44;
export const WAVE_F1 = 55; // "training"
export const WAVE_WIDTH = 3 * STEP_Y;
export const WAVE_R = Math.max(...SEATS.map((s) => s.d)) + WAVE_WIDTH;
export const MARK_CLICK = 56;

// ---------------------------------------------------------------------------
// G4 THE BOX, THE PEOPLE AND THE THREADS.
//
// THE BOX is the shared squircle, drawn head-led by two heads leaving the
// bottom-centre in opposite directions and meeting at the top-centre. The
// outline is stroked with a dash window rather than redrawn per frame, and the
// white tip rides a plain rectangle parameterisation of the same outline — the
// corner rounding is 3 world px out of a 2,440 px perimeter, so the tip sits on
// the drawn line to well under a pixel.
//
// THE PEOPLE come down through that seam while it is still open, which is the
// whole reason the box is drawn from the bottom: at every launch and crossing
// the top run is still unbuilt, so nobody is ever walked through an ink wall
// and the box shuts BEHIND them on "used". One speed, 32 world px/frame, so
// the three launches carry the stagger; each fades up over its first fifth.
//
// THE THREADS are the only accent line in the piece. One speed for all three
// (the house 22 world px/frame), and because each starts when its own person
// lands, the three different lengths all arrive inside two frames of each
// other, on "internally".
// ---------------------------------------------------------------------------
export const BOX_F0 = 64;
export const BOX_F1 = 84; // "used"
export const BOX_RAMP = 0.25;
// The box's wipe rides the same shape: two heads sweeping 1,220 px each in
// twenty frames want an even speed, not an ease-out. On an out-cubic the first
// frame of the wipe measured 186 screen px/frame — the head jumped a fifth of
// the way round the box between two frames.
const BOX_TABLE = rampTable(BOX_RAMP);
export const boxP = (u: number) => readTable(BOX_TABLE, u);

export const BOX_PERIM = 2 * (BOX_W + BOX_H);
export const S_BOTTOM = (BOX_H + BOX_W / 2) / BOX_PERIM;

/** A point at normalised distance s clockwise from the box's top-right corner. */
export const boxPoint = (s: number) => {
  let d = ((s % 1) + 1) % 1;
  d *= BOX_PERIM;
  if (d < BOX_H) return { x: BOX_X1, y: BOX_Y0 + d };
  d -= BOX_H;
  if (d < BOX_W) return { x: BOX_X1 - d, y: BOX_Y1 };
  d -= BOX_W;
  if (d < BOX_H) return { x: BOX_X0, y: BOX_Y1 - d };
  d -= BOX_H;
  return { x: BOX_X0 + d, y: BOX_Y0 };
};

export const PERSON_SPEED = 32; // world px/frame, one speed for all three
export const PERSON_LAND = [76, 80, 83];
export const PERSON_ORIGIN_Y = -270;
export const PERSON_ORIGIN_X = [500, 520, 540];
export const PERSON_FADE = 0.35;

export type PersonFlight = {
  ox: number;
  oy: number;
  cxp: number;
  cyp: number;
  tx: number;
  ty: number; // the FOOT lands here
  launch: number;
  dur: number;
};

export const PEOPLE: PersonFlight[] = PEOPLE_X.map((x, i) => {
  const ox = PERSON_ORIGIN_X[i];
  const oy = PERSON_ORIGIN_Y;
  const ty = PEOPLE_FOOT_Y[i];
  const len = Math.hypot(x - ox, ty - oy);
  const dur = Math.round(len / PERSON_SPEED);
  // a shallow arc, leaning out to the left on the way down
  const bulge = (0.10 + 0.05 * hash(i, 55)) * len;
  return {
    ox,
    oy,
    cxp: (ox + x) / 2 - bulge,
    cyp: (oy + ty) / 2,
    tx: x,
    ty,
    launch: PERSON_LAND[i] - dur,
    dur,
  };
});

export const personAt = (i: number, frame: number) => {
  const p = PEOPLE[i];
  const u = clamp01((frame - p.launch) / p.dur);
  if (u >= 1) return { x: p.tx, y: p.ty, op: 1 };
  const t = EASE_ARRIVE(u);
  const m = 1 - t;
  return {
    x: m * m * p.ox + 2 * m * t * p.cxp + t * t * p.tx,
    y: m * m * p.oy + 2 * m * t * p.cyp + t * t * p.ty,
    op: clamp01(u / PERSON_FADE),
  };
};

// Where a thread attaches: mid-torso, which is also the blob's own centre line,
// so the three threads run level rather than up into the crowd.
export const CHEST_UP = PERSON_SIZE * 0.45;
// One speed for all three threads, solved so the LAST of them is home on
// "internally". The three are 287, 243 and 214 px long and each leaves when its
// own person lands (f76, f80, f83), so 24 px/frame — a hair over the house 22,
// which would put the last one at f92.7 — brings them in at f88.0, f90.1 and
// f91.9: staggered, and the last of them on the word.
export const THREAD_SPEED = 24;

// Each person's thread goes to the seat at ITS OWN HEIGHT, not to the seat
// nearest it. Nearest-seat was tried and it does not work here: the middle
// person's nearest seat is low in the blob, so its thread dives across the
// person below it and across that person's thread. Three level threads at three
// heights cross nothing — not the glyphs (measured against person.png's own
// per-band ink profile at 118, the tightest passes 13.9 world px over the head
// below it) and not each other — and they read as three separate connections
// instead of a fan.
//
// The cost is twice `how far off my height` plus a third of `how far off a good
// length`, so a thread is level first and about 200 px long second. It must
// still reach THREAD_MIN into the crowd, or the person nearest the blob gets a
// stub with no room for a packet on it, and no two may land within THREAD_SEP
// of each other.
export const THREAD_MIN = 120; // world px: a thread has to be a thread
export const THREAD_WANT = 200; // world px: the length it would like to be
export const THREAD_SEP = 55; // world px between two landed threads
export type Thread = { seat: number; x1: number; y1: number; x2: number; y2: number; len: number };
export const THREADS: Thread[] = (() => {
  const taken: number[] = [];
  return PEOPLE_X.map((x, i) => {
    const y = PEOPLE_FOOT_Y[i] - CHEST_UP;
    let best = -1;
    let bestC = Infinity;
    let bestD = 0;
    SEATS.forEach((s, j) => {
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < THREAD_MIN) return;
      const c = 2 * Math.abs(s.y - y) + Math.abs(d - THREAD_WANT) / 3;
      if (c >= bestC) return;
      if (taken.some((t) => Math.hypot(SEATS[t].x - s.x, SEATS[t].y - s.y) < THREAD_SEP)) return;
      bestC = c;
      bestD = d;
      best = j;
    });
    taken.push(best);
    return { seat: best, x1: x, y1: y, x2: SEATS[best].x, y2: SEATS[best].y, len: bestD };
  });
})();

// The traffic on the three threads, and the only thing moving through the
// resolved tail besides the breath: a 15-frame period against an 18-frame life
// is 1.2 packets per thread, so three or four are alive at once and no thread
// is ever empty for long. A packet is an agent-sized disc (DOT_RADIUS) rather
// than the 4 px bead the structures in this set use, because at the resolved
// k 0.93 a 4 px bead is under four screen px and the gesture disappears.
export const PKT_F0 = 92; // "internally"
export const PKT_PERIOD = 15;
export const PKT_LIFE = 18;
export const PKT_OUT = 0.55; // the share of a life spent on the way out
export const PKT_R = DOT_RADIUS;


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
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotOpacity: z.number(),
  idleThreadCount: z.number(),
  markSize: z.number(),
  personSize: z.number(),
  trails: z.boolean(),
  beats: z.object({
    the: z.number(), // "the"        — the seats are already converging
    best: z.number(), // "best"
    available: z.number(), // "available"
    model: z.number(), // "model"     — the blob is whole
    as: z.number(), // "as"
    of: z.number(), // "of"
    this: z.number(), // "this"
    recording: z.number(), // "recording" — the playhead is down and clicks
    finished: z.number(), // "finished"  — the training wave leaves the centre
    training: z.number(), // "training"  — the last seat is ripe
    and: z.number(), // "and"        — the box starts drawing
    was: z.number(), // "was"
    being: z.number(), // "being"
    used: z.number(), // "used"       — the box shuts with a click
    internally: z.number(), // "internally" — the three threads are home
    asTwo: z.number(), // "as"        — THE SLIDE leaves
    ofTwo: z.number(), // "of"
    february: z.number(), // "february"
    end: z.number(), // speech ends; tail to 145
  }),
});

export type Props = z.infer<typeof schema>;

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
  dotOpacity: OP_UNREAD_DOT,
  idleThreadCount: idleThreads(NSEAT),
  markSize: MARK_SIZE,
  personSize: PERSON_SIZE,
  trails: true,
  beats: {
    the: 0,
    best: 3,
    available: 10,
    model: 17,
    as: 24,
    of: 31,
    this: 33,
    recording: 35,
    finished: 44,
    training: 55,
    and: 64,
    was: 73,
    being: 77,
    used: 84,
    internally: 92,
    asTwo: 102,
    ofTwo: 112,
    february: 114,
    end: 129,
  },
});

const clickAt = (frame: number, f0: number) =>
  clamp01(1 - Math.abs(frame - f0) / CLICK_DUR) * (frame >= f0 ? 1 : 0);

const AsOfFebruary: React.FC<Props> = ({
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
  dotOpacity,
  idleThreadCount,
  markSize,
  personSize,
  trails,
  beats,
}) => {
  const frame = useCurrentFrame();
  const tone = makeTone(accentDeep, accent);
  const label = makeLabel(ink);

  // -- camera ---------------------------------------------------------------
  const cam = cameraAt(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the slide ------------------------------------------------------------
  const sx = slideX(frame);

  // -- G1: where every seat is, and G3: how ripe it is ----------------------
  const pos = SEATS.map((_, i) => seatAt(i, frame));
  const front = interpolate(frame, [WAVE_F0, WAVE_F1], [0, WAVE_R], clamp);
  const seatTone = SEATS.map((s) => softFront(s.d, front, WAVE_WIDTH));

  // -- ambient: idle traffic inside the blob, from the frame it is whole ----
  const lit = new Float32Array(NSEAT);
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number; head: number };
  const threadEls: Th[] = [];
  const reach = 3;
  if (frame >= beats.model + 3) {
    for (let j = 0; j < idleThreadCount; j++) {
      const period = 44 - 12 * hash(j, 4);
      const local = frame + hash(j, 5) * period;
      const cycle = Math.floor(local / period);
      const phase = (local - cycle * period) / period;
      const seed = j * 131 + cycle * 7;
      const a = Math.floor(hash(seed, 6) * NSEAT);
      const sa = SEATS[a];
      const bc = Math.max(0, Math.min(F_COLS - 1, sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * reach)));
      const br = Math.max(0, Math.min(F_ROWS - 1, sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * reach)));
      const b = SEAT_AT[br * F_COLS + bc];
      if (b < 0 || b === a) continue;
      const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
      if (fade <= 0.02) continue;
      lit[a] = Math.max(lit[a], fade);
      lit[b] = Math.max(lit[b], dn * fade);
      threadEls.push({
        key: `i${j}`,
        x1: pos[a].x,
        y1: pos[a].y,
        x2: pos[a].x + (pos[b].x - pos[a].x) * dn,
        y2: pos[a].y + (pos[b].y - pos[a].y) * dn,
        op: 0.4 * fade,
        head: dn,
      });
    }
  }

  // -- G2: the rule, the now-dot and the playhead ---------------------------
  const tlE = tlExtent(frame);
  const tlOn = frame >= TL_F0;
  const dotR = PLAY_DOT_R * smoothstep(clamp01((frame - TL_F0) / 3));
  const playU = clamp01((frame - PLAY_F0) / (PLAY_F1 - PLAY_F0));
  const playY = TL_Y + (PLAY_Y1 - TL_Y) * EASE_ARRIVE(playU);
  const playClick = clickAt(frame, PLAY_F1);

  // -- G4: the box's two heads ----------------------------------------------
  const boxU = clamp01((frame - BOX_F0) / (BOX_F1 - BOX_F0));
  const boxDraw = boxP(boxU) * 0.5; // each head's share of the perimeter
  const boxClick = clickAt(frame, BOX_F1);
  const boxOp = OP_READ + (1 - OP_READ) * boxClick;
  const headF = boxPoint(S_BOTTOM + boxDraw);
  const headB = boxPoint(S_BOTTOM - boxDraw);

  // -- G4: the people, their threads and the packets ------------------------
  const people = PEOPLE_X.map((_, i) => personAt(i, frame));
  const threadDrawn = THREADS.map((t, i) => clamp01(((frame - PERSON_LAND[i]) * THREAD_SPEED) / t.len));
  THREADS.forEach((t, i) => {
    if (threadDrawn[i] >= 1) lit[t.seat] = Math.max(lit[t.seat], 1);
  });

  type Pkt = { key: string; x: number; y: number };
  const packets: Pkt[] = [];
  if (frame >= PKT_F0) {
    THREADS.forEach((t, i) => {
      for (let n = -1; n < 5; n++) {
        const born = PKT_F0 + PKT_PERIOD * n + hash(i, 61) * PKT_PERIOD;
        const age = frame - born;
        if (age < 0 || age > PKT_LIFE) continue;
        const u = age / PKT_LIFE;
        const p = u < PKT_OUT ? u / PKT_OUT : 1 - (u - PKT_OUT) / (1 - PKT_OUT);
        packets.push({
          key: `p${i}_${n}`,
          x: t.x1 + (t.x2 - t.x1) * p,
          y: t.y1 + (t.y2 - t.y1) * p,
        });
      }
    });
  }

  const markClick = clickAt(frame, MARK_CLICK);
  const markOp = OP_READ + (1 - OP_READ) * markClick;

  const bodyR = (i: number) => {
    const s = SEATS[i];
    const l = Math.max(seatTone[i], lit[i] * 0.6);
    return dotRadius * s.r * s.rs * breath(frame, hash(i, 9)) * (1 + 0.35 * l);
  };

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CAM_CX[0]}
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
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* THE TIMELINE — the rule, its month ticks and the playhead. It
                does not travel: the box does. */}
            {tlOn ? (
              <g style={{ filter: icon }}>
                <line
                  x1={PLAY_X - tlE}
                  y1={TL_Y}
                  x2={PLAY_X + tlE}
                  y2={TL_Y}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={OP_READ}
                />
                {frame < TL_F1
                  ? [-1, 1].map((s) => (
                      <circle key={s} cx={PLAY_X + s * tlE} cy={TL_Y} r={4} fill={ink} />
                    ))
                  : null}
                {TICKS.map((x, i) => {
                  const u = clamp01((frame - TICK_F0[i]) / TICK_DRAW);
                  if (u <= 0) return null;
                  const y0 = TL_Y - TICK_H / 2;
                  const y1 = y0 + TICK_H * EASE_ARRIVE(u);
                  return (
                    <g key={x}>
                      <line
                        x1={Math.round(x) + 0.5}
                        y1={y0}
                        x2={Math.round(x) + 0.5}
                        y2={y1}
                        stroke={ink}
                        strokeWidth={STROKE}
                        strokeLinecap="round"
                        opacity={OP_READ}
                      />
                      {u < 1 ? (
                        <circle cx={Math.round(x) + 0.5} cy={y1} r={3.5} fill={ink} />
                      ) : null}
                    </g>
                  );
                })}
                {/* V2: the months, written out. A name comes up with its own
                    tick (FEB with the box that stops on it), scaled about its
                    own anchor so `makeLabel`'s type is used unaltered. */}
                {MONTH_NAMES.map((name, i) => {
                  const op = LABEL_OP * clamp01((frame - MONTH_LABEL_F0[i]) / LABEL_FADE);
                  if (op <= 0) return null;
                  return (
                    <g
                      key={`m${name}`}
                      transform={`translate(${Math.round(TICKS[i]) + 0.5} ${MONTH_LABEL_Y}) scale(${MONTH_LABEL_SCALE})`}
                    >
                      {label(`l${name}`, 0, 0, name, op)}
                    </g>
                  );
                })}
                {frame >= NOW_LABEL_F0 ? (
                  <g
                    transform={`translate(${PLAY_X} ${NOW_LABEL_Y}) scale(${MONTH_LABEL_SCALE})`}
                  >
                    {label(
                      "lNOW",
                      0,
                      0,
                      "NOW",
                      LABEL_OP * clamp01((frame - NOW_LABEL_F0) / LABEL_FADE),
                    )}
                  </g>
                ) : null}
                {frame >= PLAY_F0 ? (
                  <line
                    x1={PLAY_X}
                    y1={TL_Y}
                    x2={PLAY_X}
                    y2={playY}
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    opacity={OP_READ + (1 - OP_READ) * playClick}
                  />
                ) : null}
                {playU > 0 && playU < 1 ? <circle cx={PLAY_X} cy={playY} r={4} fill={ink} /> : null}
                <circle
                  cx={PLAY_X}
                  cy={TL_Y}
                  r={dotR}
                  fill={ink}
                  opacity={OP_READ + (1 - OP_READ) * playClick}
                />
              </g>
            ) : null}

            {/* THE ASSEMBLY — everything that travels back in time together */}
            <g transform={`translate(${sx.toFixed(3)} 0)`}>
              {/* the company */}
              {boxU > 0 ? (
                <g style={{ filter: icon }}>
                  {boxU >= 1 ? (
                    <path
                      d={BOX_PATH}
                      transform={`translate(${BOX_X0} ${BOX_Y0})`}
                      fill="none"
                      stroke={ink}
                      strokeWidth={STROKE}
                      opacity={boxOp}
                    />
                  ) : (
                    <>
                      {[
                        { a: S_BOTTOM, len: boxDraw },
                        { a: Math.max(0, S_BOTTOM - boxDraw), len: Math.min(boxDraw, S_BOTTOM) },
                        {
                          a: 1 + S_BOTTOM - boxDraw,
                          len: Math.max(0, boxDraw - S_BOTTOM),
                        },
                      ]
                        .filter((d) => d.len > 0.0005)
                        .map((d) => (
                          <path
                            key={d.a}
                            d={BOX_PATH}
                            transform={`translate(${BOX_X0} ${BOX_Y0})`}
                            fill="none"
                            stroke={ink}
                            strokeWidth={STROKE}
                            strokeLinecap="round"
                            opacity={boxOp}
                            pathLength={1}
                            strokeDasharray={`${d.len} 2`}
                            strokeDashoffset={-d.a}
                          />
                        ))}
                      <circle cx={headF.x} cy={headF.y} r={4.5} fill={ink} />
                      <circle cx={headB.x} cy={headB.y} r={4.5} fill={ink} />
                    </>
                  )}
                </g>
              ) : null}

              {/* the fleet: idle traffic under the dots it belongs to */}
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

              {/* the instances, converging and then lighting */}
              {SEATS.map((s, i) => {
                const p = pos[i];
                if (p.op <= 0) return null;
                const l = Math.max(seatTone[i], lit[i] * 0.6);
                return (
                  <g key={i}>
                    <Trail
                      frame={frame}
                      k={k}
                      at={(f) => {
                        const q = seatAt(i, f);
                        return q.op <= 0 ? null : { x: q.x, y: q.y };
                      }}
                      r={bodyR(i)}
                      fill={tone(l)}
                      opacity={dotOpacity * p.op}
                      enabled={trails}
                    />
                    <circle cx={p.x} cy={p.y} r={bodyR(i)} fill={tone(l)} opacity={dotOpacity * p.op} />
                  </g>
                );
              })}

              {/* the threads: the people using the model */}
              <g style={{ filter: icon }}>
                {THREADS.map((t, i) => {
                  const dn = threadDrawn[i];
                  if (dn <= 0) return null;
                  const hx = t.x1 + (t.x2 - t.x1) * dn;
                  const hy = t.y1 + (t.y2 - t.y1) * dn;
                  return (
                    <g key={i}>
                      <line
                        x1={t.x1}
                        y1={t.y1}
                        x2={hx}
                        y2={hy}
                        stroke={accent}
                        strokeWidth={STROKE}
                        strokeLinecap="round"
                        opacity={0.95}
                      />
                      {dn < 1 ? <circle cx={hx} cy={hy} r={4} fill={ink} /> : null}
                    </g>
                  );
                })}
                {packets.map((p) => (
                  <circle key={p.key} cx={p.x} cy={p.y} r={PKT_R} fill={accent} opacity={0.95} />
                ))}
              </g>

              {/* the model's mark */}
              <g
                style={{ filter: icon }}
                opacity={markOp}
                transform={`translate(${MARK.x} ${MARK.y}) scale(${markSize / 24}) translate(-12 -12)`}
              >
                {CLAUDE.paths.map((d) => (
                  <path key={d.length} d={d} fill={ink} fillRule="evenodd" />
                ))}
              </g>
            </g>
          </svg>

          {/* the people, riding the slide with everything else */}
          {PEOPLE_X.map((_, i) => {
            const p = people[i];
            if (p.op <= 0) return null;
            return (
              <Img
                key={i}
                src={staticFile("person.png")}
                style={{
                  position: "absolute",
                  left: p.x + sx - personSize / 2,
                  top: p.y - personSize * PERSON_FOOT,
                  width: personSize,
                  height: personSize,
                  objectFit: "contain",
                  filter: `brightness(0) invert(1) ${icon}`,
                  opacity: OP_READ * p.op,
                }}
              />
            );
          })}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default AsOfFebruary;
