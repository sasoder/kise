import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
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
  SQUIRCLE_MIN,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
  TONE_STEPS,
  Vignette,
  breath,
  camMove,
  clamp,
  clamp01,
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  runCamera,
  squirclePath,
  sway,
  worldTransform,
} from "./fieldShared";
// Cut 1. The world's geometry: the box, the seat grid, the tiles, the internet
// ring and its wifi glyph, the gate, the mark.
import {
  BOX_PATH,
  BOX_X0,
  BOX_Y0,
  CAM_CY,
  CENTRE_X,
  GATE_DASH,
  GATE_GAP,
  GATE_X0,
  GATE_X1,
  LINE_TIP_Y,
  MARK,
  NSEAT,
  RING,
  SEATS,
  STROKE,
  TILES,
  TILE_HALF,
  TILE_PATH,
  TONE_DUR,
  WIFI,
  WORLD_H,
  WORLD_W,
  smooth,
} from "./ImpossibleTasks";
// Cut 2. The farm, the neighbours, the pump, the batched draw helpers.
import {
  FARM_COLS,
  NEIGHBOURS,
  OUR,
  PITCH_X,
  PUMP_CAP,
  PUMP_PULL,
  REACHES,
  THREAD_OP_STEPS,
  type Th,
  WAVE2,
  dotPaths,
  idleFor,
  onScreen,
  pumpAt,
  threadPaths,
} from "./TryToHackOut";
// Cut 3. The rail, the pipes, the hub with its parcel glyph, the polyline
// model, the frozen scars.
import {
  BEAD_R,
  HEAD_R,
  HUB,
  OUR_AGENT,
  OUR_TILES,
  type P,
  PIPE_BOT_Y,
  PIPE_TOP_Y,
  RAIL_Y,
  RING_R,
  RING_STROKE,
  SCARS,
} from "./TalkThroughArtifactory";
// Cut 4. The crack, the exploit route's own points, the six ringed agents, the
// bead radius on the internet ring's rim, the accent value a converted line has.
import {
  CRACK_MID,
  CRACK_SPLIT,
  EXPLOIT_PTS,
  NODES6,
  OUR_AGENT_2,
  RINGED_IN,
  RING_BEAD_R,
} from "./ReachTheOutsideInternet";
// Cut 5. The crack's settled half-angle.
import { CRACK_HALF } from "./MessageBoardAndGateway";
// Cut 6. The close-up head floor, and the rim beads its arrivals left on the
// internet ring — the history this piece opens with and never touches.
import {
  BEAD_CAP,
  BEAD_FLOOR,
  DURATION as SL_DURATION,
  HEAD_MIN_W,
  PACKETS as SL_PACKETS,
  beadPt,
} from "./SignalOnTheLine";
// Cut 7 — THE WORLD THIS PIECE CONTINUES FROM. Its converted plumbing, the
// per-line conversion geometry (reused here for the reverse), its clocks, and
// the calm pass's screen-speed cap. Nothing in that file was edited.
import {
  DURATION as FA_DURATION,
  LINE_STROKES,
  OFFSET as FA_OFFSET,
  PARCEL_STROKES,
  PKG_LAND,
  PKG_V,
  type Stroke,
  TH_CLOCK as FA_TH_CLOCK,
  arcStroke,
  polyStroke,
} from "./FullAdminAccess";

export const FPS = 24;
// Dwarkesh clip `impossible-tasks`, cut 8: "OpenAI noticed this crash, and it
// also figured out that the agents had built this exploit. So OpenAI patched the
// relevant vulnerability, and as a result inadvertently wiped the agents'
// message board in the process."
//
// SRT span 1:05.519 -> 1:17.560 at 24fps.
// round((77.560 - 65.519) * 24) = round(12.041 * 24) = round(288.98) = 289
// frames of speech, plus a 16 frame tail so the resolved state holds = 305.
export const DURATION = 305;

// ---------------------------------------------------------------------------
// "Patched and wiped". Orange Dwarkesh style: opaque grid cutaway, 24fps, the
// crowd is the material, one camera move per act, one gesture per word.
//
// THE SHOT. Cut 7 ended at 1:00.200 with the whole package manager turned
// accent — the agents' own board. The sentence between ("messaging at such a
// voluminous pace that they crashed the package manager") has no graphic, so
// this piece opens 5.319 s later, at 1:05.519, ON THE CRASHED STATE. Nothing is
// re-drawn to get there; the world simply is what the crash left.
//
// CONTINUITY. Everything periodic evaluates at `frame + OFFSET` =
// `frame + 967 + 158 + 128` = `frame + 1253` — cut 7's own offset, its 158
// frames, and the 128 frames of the un-illustrated sentence (5.319 s * 24 =
// 127.7) — so `sway`, `breath`, the idle-thread schedule and the grid's drift
// all carry their phase across the gap. The pump and the reach geometry run on
// cut 2's clock, `frame + 1085`, because they are cut 2's gesture still going.
//
// THE CRASHED STATE, precisely:
//   * The converted plumbing — rail left and right, both of our column's pipes,
//     the hub's ring, the parcel glyph, and the exploit route out of the crack —
//     is still ACCENT and still exactly cut 7's geometry, but DEAD: drawn at
//     OP_DEAD 0.28 instead of the ROUTE_OP 0.95 a live converted stroke carries.
//     0.28 is the ladder's "wiped / unlooked-at" rung (OP_DARK 0.16) brightened
//     until it survives this field. MEASURED on the 1080x1920 render at f0, on
//     the rail's own core pixel against the field 14 px above and below it:
//     the line reads (156, 130, 73) against a field of (112, 112, 112), which
//     is 1.345:1 — and the arithmetic agrees, #FFB000 at 0.28 over that field
//     is (152, 130, 81) and 1.332:1. For scale on the same field: OP_DARK 0.16
//     is 1.173:1, which is a smudge; a LIVE converted line at ROUTE_OP 0.95 is
//     2.587:1; white ink is 4.910:1. So a dead line makes about a quarter of
//     the step a live one does and an eighth of ink's — present, unmistakably
//     not carrying anything, and the wipe's ink is a 3.6x jump out of it.
//     One caveat, checked and dismissed: at the k 0.45 rest the dead rail is a
//     0.674-device-px stroke in the HALF-SCALE preview and it falls under the
//     8-bit floor there, so the preview loses it from about f198. At full
//     resolution the same frames carry it at (142, 125, 89) — measured on f200
//     and f240. Judge the crashed plumbing on the full-res stills.
//   * NO PACKETS ANYWHERE, for all 305 frames. No hub click, no agent click.
//     A crashed package manager carries no traffic, and nothing puts traffic
//     back on it: what comes back at the end is clean pipe, not a working board.
//   * The crack is still open, 20 deg to 60 deg.
//   * The internet ring and its wifi stay at FULL ink with cut 6's rim beads —
//     the 21 arrivals that had landed by cut 6's last frame — at their
//     persisted BEAD_FLOOR 0.6. The internet is not OpenAI's board and nothing
//     here touches it: after the route is erased its right edge is bare, and
//     the beads stay, because they are history.
//   * The dashed gate stays dashed. The sandboxes, crowds, tiles, reaches
//     (pumping softly), scars and the six ringed agents are as before, ink at
//     their usual rungs, idle threads still running inside every box.
//
// Everything OpenAI does in this piece is INK. Accent appears only as the dead
// residue being looked at, cut off, and finally drained away.
//
// DIRECTOR'S PASS 2. Four notes, and what each one changed:
//   1. "The look-box is a centred square." The 170 x 140 rectangle offset up
//      and left of the ring read as a box that had missed what it was looking
//      at. It is now 180 x 180 centred on the hub — see LOOK.
//   2. "The pull-back moves to 'figured out': zoom all the way out to show the
//      exploit." The pull-back was move 2 at f172, long after the trace had
//      already run off the top of a close-up frame. It is now keys f38 -> f52,
//      settled by f60, so the WHOLE route is in view before the trace starts
//      and the trace's arrival on the internet ring IS "exploit". The old
//      camera beat on "and as a result" is deleted; that beat is now a hold.
//   3. "On 'patched', the whole ring and parcel turn white." The hub used to
//      wait for the wipe. Now the seal lands at f149 and the entire hub
//      converts to ink f150 -> f166, from the seal inward.
//   4. "Then everything else turns white — the wipe as built." Unchanged,
//      minus the parcel and ring stages the hub no longer needs: the drain is
//      the four lines, straight out of the hub at f230.
//
// THE GESTURES — one per word, nothing else.
//   1. THE PUSH-IN. Move 1, and nothing else happens
//                                      — "OpenAI noticed"        f0-16
//   2. LOOKED AT. An ink look-box (solid, stroke 3, OP_READ,
//      iconShadow, corners via `squirclePath`) draws head-led,
//      one continuous stroke from the top-left corner
//      clockwise, around the dead hub AND its crack: a SQUARE
//      CENTRED ON THE HUB, world (540 +/- 90, 760 +/- 90) =
//      (450, 670) to (630, 850). Closes at f28 with the
//      4-frame click on close. It stays
//                                      — "this crash"            f17-32
//   3. THE PULL-BACK. Move 2, all the way out to the wide, and
//      nothing else happens. It is the shot the exploit needs:
//      by the time the trace leaves the crack the mark, the
//      internet ring, our box, the whole route, the rail to
//      both edges and row 1 are all in frame at once
//                                      — "figured out"           f38-52
//   4. TRACED. An ink line (stroke 3, OP_READ, head-led with
//      the field's white tip) traces the exploit route ON TOP
//      of the dead accent route, from the crack's midpoint at
//      f49, at V_TRACE = 34.183 world px/frame — the route's
//      own 1,982.632 px over the 58 frames from "out that" to
//      "exploit", so the tip lands on the internet ring's
//      right edge exactly on the word. The ring takes the
//      4-frame click. The trace is on screen for the whole of
//      its run: it turns the corner at (1040, 640) at f63.1,
//      turns again at (1040, -400) at f93.5, and every one of
//      those points is inside the k 0.45 frame. OpenAI
//      following the wire the agents laid
//                                      — "figured out that the
//                                         agents had built this
//                                         exploit"               f49-107
//   5. SEALED, TURNED, SEVERED.
//      f142-149: the crack SEALS. The two arc ends grow toward
//        each other in ink, head-led from 20 deg and from
//        60 deg, meeting at the gap's midpoint 40 deg at f149
//        with a 4-frame click on the ring
//                                      — "patched the"           f142-149
//      f150-166: THE WHOLE HUB TURNS WHITE. Ring and parcel
//        convert from dead accent to ink, head-led, on cut 7's
//        conversion geometry with the stroke order reversed —
//        the ring first, out of the seal's two feet both ways
//        round to the split (f150-158), then the parcel from
//        the hexagon inward: hexagon (f158-162), strap
//        (f162-164), the three inner edges vertex-to-centre
//        (f164-166). White tip on every front. By f166 the hub
//        is exactly cut 3's package manager, whole and white,
//        inside the look-box
//                                      — "patched the ...
//                                         relevant"              f150-166
//      f159-192: the exploit route is ERASED from the crack
//        outward. The ink trace and the dead accent route
//        beneath it un-draw together behind one ink tip, at
//        V_ERASE 60 world px/frame — 27.0 screen px/frame at
//        the k 0.45 rest, inside the calm cap. 1,982.632 px at
//        60 lands the tip on the internet ring at f192.044, so
//        the last frame carrying any route is f192 (a 2.6 px
//        stub) and f193 is clean. The whole erase happens in
//        full view, which is the point of the new camera. The
//        internet ring keeps its beads — that is history — but
//        its right edge is bare
//                                      — "relevant
//                                         vulnerability"         f159-192
//   6. NO CAMERA on "and as a result". The pull-back has
//      already happened; this beat is a hold
//                                      — "and as a result"       f180-215
//   7. THE LOOK ENDS. The look-box fades out over 8 frames.
//      OpenAI is done looking; it did not notice what comes
//      next                            — "inadvertently"         f216-224
//   8. THE WIPE. The dead accent DRAINS OUT OF THE PLUMBING
//      FROM THE HUB OUTWARD along the four lines at once — the
//      rail both ways and our column's two pipes — at 45 world
//      px/frame from f230. The hub is already ink, so there is
//      no parcel or ring stage left to play. Each front
//      carries a white tip. What is revealed behind it is
//      CLEAN INK PLUMBING at OP_READ: rail, pipes, ring with
//      the sealed crack, parcel — exactly cut 3's package
//      manager, fresh. Every ringed agent's ring fades out
//      over 8 frames from f262: the agents that had the board
//      are just agents again
//                                      — "wiped the agents'
//                                         message board in the"  f230-270
//   9. HELD: fresh white plumbing, no traffic anywhere, no
//      rings on the agents, OpenAI's box gone, the internet
//      ring lit with its old beads. Never fades out
//                                      — "process" + tail        f276-305
//
// ambient: idle thread traffic in every visible box at the shared rate,
// `breath` on every dot, our seventeen reaches and every neighbour's still
// pumping, `sway` on the camera. Not gestures; that is what this field is.
//
// THE TWO FRAMINGS. For a content centre c and a lateral track cx,
// `cy = c + CAM_LIFT / k` puts c at screen y 960 - 125 = 835:
//   screen(y) = (y - c) * k + 835      screen(x) = (x - cx) * k + 540
//
//   OPEN, k 0.60 / c 180 / cx 540 — the whole column, the crash in the middle
//   of it. Measured, not estimated:
//     the OpenAI mark's top (-614)  -> 358.6
//     the internet ring (-400) r 40 -> 487.0, 48 px across
//     our box (-290 .. 410)         -> 553.0 .. 973.0
//     the hub (540, 760) r 40       -> (540, 1183.0), 48 px across
//     row 1's top walls (1110)      -> 1393.0   (row 1 sits under the captions)
//     in frame: world x -360 .. 1440, world y -1211.7 .. 1988.3
//
//   MOVE 1's REST, k 1.00 / c 760 / cx 540 — the close-up of the crash. Settled
//   by f22 and held to f38, which covers the look-box's whole draw, its click
//   and its first ten frames of hold.
//     the hub (540, 760) r 40       -> (540, 835.0), 80 px across
//     the crack (565.7, 729.4)      -> (565.7, 804.4), inside the look-box
//     THE LOOK-BOX (450..630, 670..850) -> screen 450..630 x 745..925: 180 px
//       square, dead centre of the frame's width, the ring dead centre of it
//     our box's bottom wall (410)   -> 485.0
//     row 1's top walls (1110)      -> 1185.0
//     the rail (760)                -> 835.0, straight across the frame
//     in frame: world x 0 .. 1080, world y -75 .. 1845
//
//   MOVE 2's REST, k 0.45 / c 180 / cx 540 — the reach of the exploit, and
//   later of the wipe. Everything from f60 to the last frame plays here.
//     the OpenAI mark's top (-614)  -> 477.7
//     the internet ring (-400)      -> 574.0
//     our box (-290 .. 410)         -> 623.5 .. 938.5
//     the hub (540, 760)            -> 1096.0
//     the look-box                  -> 1055.5 .. 1136.5, 81 px square
//     row 1's top walls (1110)      -> 1253.5
//     THE WHOLE EXPLOIT ROUTE: the crack (565.7, 729.4) -> screen (551.6,
//       1082.2), the first corner (1040, 640) -> (765.0, 1042.0), the second
//       (1040, -400) -> (765.0, 574.0), the internet ring's right edge
//       (580, -400) -> (558.0, 574.0). All four inside the frame, so the trace
//       and the erase both run end to end in view
//     in frame: world x -660 .. 1740, world y -1675.6 .. 2591.1
//     The rail runs to both edges. The neighbours' own pipes are at world
//     x -860 and 1940 (PITCH_X is 1400), so they fall 200 px OUTSIDE this
//     frame; the boxes either side do come in at the edges (world x -660..-410
//     and 1490..1740) and the rail crosses both.
//
// THE CAMERA — two moves, both in the first 52 frames, each eased per frame by
// `camMove` and damped by `runCamera`, with a true hold between and one long
// hold from f60 to the last frame. `sway` throughout.
//   MOVE 1, "OpenAI noticed this crash": warp 0.72, k 0.60 -> 1.00, content
//     centre 180 -> 760, cx 540 throughout. KEYS f0 -> f10: at f2->f14 the
//     damper is still 3.7% short of k 1.00 at "this crash" f17 and closing at
//     1.1% a frame, above the 1%/frame that reads as movement, so the box would
//     have drawn while the shot was still arriving. Reported k: f14 0.9648,
//     f17 0.9894, f22 0.9997, f26 1.0004. Peak zoom rate 4.0%/frame.
//   MOVE 2, "figured out": keys f38 -> f52, warp 0.72, k 1.00 -> 0.45, content
//     centre 760 -> 180, cx 540 throughout. Reported k / content centre:
//       f38  1.0000 / 760.02   the hold before it; the move breaks at f39
//       f44  0.8799 / 635.64   peak zoom rate, -4.6%/frame at f47
//       f49  0.6599 / 410.07   the trace leaves the crack, camera still opening
//       f52  0.5517 / 296.17   keys end; the damper is 22.6% out and closing
//       f60  0.4546 / 185.21   1.0% short, closing 0.68%/frame — under the
//                              readable floor, so this is where it settles
//       f67  0.4496 / 179.42   dead still, seven frames before "the agents"
//     It runs UNDER the trace on purpose: the tip is on the diagonal out of the
//     crack while the frame opens, so the shot widens to meet the route rather
//     than waiting for it. From f67 to the last frame the camera holds.
//   Content-centre sag under the damper is under 1.5 px at both rests, because
//   `camMove` takes cy off its own eased k.
//
// THE HUB'S CONVERSION, PER STROKE. One front per stroke, ink at OP_READ
// behind it and dead accent ahead of it — complementary spans of one path, so
// nothing is drawn twice and there is no crossfade anywhere.
//   the ring, f150 -> f158. Two arcs, seeded at the seal's own two feet (60 deg
//     and 20 deg) and run the long way round to the split at 220 deg. 160 deg
//     each = 111.701 px, so they meet at the split together and neither ever
//     enters the crack, which the seal has already filled with ink
//                                                    13.963 px/frame
//   the hexagon, f158 -> f162. Cut 7's own three two-edge runs, untouched:
//     51.108, 51.554 and 51.554 px on one velocity, so two land on f162 and the
//     third 0.03 of a frame early                    12.888 px/frame
//   the strap, f162 -> f164, 25.554 px               12.777 px/frame
//   the three inner edges, f164 -> f166, REVERSED from cut 7's: each runs from
//     its outline vertex INWARD to the parcel's centre, 25.554, 25.554 and
//     26.000 px, so the middle of the parcel is the last thing to go white
//                                                    13.000 px/frame
//
// THE DRAIN, PER LINE. One front per stroke, each un-drawing from the hub
// outward on exactly cut 7's geometry, each carrying a white tip while it runs,
// each leaving ink at OP_READ behind it. All four start together at f230 at
// DRAIN_V 45 world px/frame — 20.25 screen px/frame at k 0.45, inside the cap:
//   pipe up     (540, 720) -> y  410    310 px  f230.0 -> f236.9, and it
//                                               STOPS in our box's floor
//   pipe down   (540, 800) -> y 1110    310 px  f230.0 -> f236.9, and it
//                                               STOPS in row 1's ceiling
//   rail left   (500, 760) -> x -2260  2760 px  f230.0; past the k 0.45 left
//                                               frame edge (x -660) at f255.8,
//                                               and off the end of the world at
//                                               f291.3
//   rail right  (580, 760) -> x  3340  2760 px  f230.0; past the k 0.45 right
//                                               frame edge (x 1740) at f255.8,
//                                               same end at f291.3
//   the hub: NOT drained. It turned white on "patched", f150 -> f166.
//   the exploit route: NOT drained. It was erased at f159-192 and there is
//     nothing left of it to drain.
//   So the frame is clean of accent at f255.8, six frames before "board in the"
//   f262 and twenty before "process" f276.
//   THE WALLS STAY INK throughout, as they did in cut 7. What drains is the
//   package manager.
//
// HEAD SPEEDS, every one of them, against the calm pass's V_CAP_SCREEN 45
// screen px/frame at the tightest k the head is ever seen at:
//   the look-box's drawing tip   65.455 world px/f  @ k 1.00  = 65.5 screen
//     — over the cap, under cut 7's one exemption: it is the end of a line
//       being DRAWN, and the stroke it has laid down is still on screen behind
//       it, so consecutive frames overlap however fast the tip goes. It is
//       faster than the old 56.364 only because the square is a longer
//       perimeter (720 vs 620) drawn in the same eleven frames.
//   the exploit trace's tip      34.183 world px/f  @ k 0.45  = 15.4 screen  OK
//     — its first three frames are at k 0.66 .. 0.55, where it is 22.6 down to
//       18.9 screen px/frame. Still well inside the cap.
//   the seal's two tips           1.995 world px/f  @ k 0.45  =  0.9 screen  OK
//   the hub conversion's tips    13.963 / 12.888 / 12.777 / 13.000 world px/f
//                                @ k 0.45 = 6.3 / 5.8 / 5.8 / 5.9 screen   OK
//   the erase's tip              60.000 world px/f  @ k 0.45  = 27.0 screen  OK
//     — the briefed cap, and it now fits: at the wide the whole route is in
//       frame, so the erase no longer has to beat a camera move to stay honest.
//       It finishes at f192.04 rather than the old f175, twenty-four frames
//       clear of the look-box's fade at f216.
//   the line drain's tips        45.000 world px/f  @ k 0.45  = 20.3 screen  OK
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: every accent line, live or dead
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
  idleThreadCount: z.number(), // our box; each neighbour scales off its own count
  deadOpacity: z.number(), // the crashed plumbing's accent
  markSrc: z.string(), // the OpenAI mark, tinted white
  markSize: z.number(), // world px, square
  beats: z.object({
    openaiNoticed: z.number(), // "OpenAI noticed"   — the push-in
    thisCrash: z.number(), // "this crash"          — the look-box draws
    andItAlso: z.number(), // "and it also"         — nothing; the box holds
    figured: z.number(), // "figured"               — the pull-back to the wide
    outThat: z.number(), // "out that"              — the trace leaves the crack
    theAgents: z.number(), // "the agents"          — camera settled; it runs
    hadBuiltThis: z.number(), // "had built this"   — still running
    exploit: z.number(), // "exploit"               — the tip lands on the ring
    soOpenai: z.number(), // "so OpenAI"            — the patch is coming
    patchedThe: z.number(), // "patched the"        — the crack seals, then the
    //                                                whole hub turns white
    relevant: z.number(), // "relevant"             — the erase starts
    vulnerability: z.number(), // "vulnerability"   — the route is going
    andAsAResult: z.number(), // "and as a result"  — a hold; no camera
    inadvertently: z.number(), // "inadvertently"   — the look ends
    wipedThe: z.number(), // "wiped the"            — the drain runs the lines
    agentsMessage: z.number(), // "agents' message" — the rail is draining
    boardInThe: z.number(), // "board in the"       — the rings go
    process: z.number(), // "process"               — held
    end: z.number(), // speech ends; tail to 305
  }),
});

export type Props = z.infer<typeof schema>;

// The join. Cut 7 ran 158 frames from 0:54.280 and ended at 1:00.200; this cut
// opens at 1:05.519, so 5.319 s = 127.7 -> 128 frames of un-illustrated speech
// sit between them and the periodic clock simply keeps counting through it.
export const CUT7_LEN = FA_DURATION; // 158
export const GAP = 128; // 1:05.519 - 1:00.200 = 5.319 s at 24fps
export const OFFSET = FA_OFFSET + CUT7_LEN + GAP; // 967 + 158 + 128 = 1253
export const TH_CLOCK = FA_TH_CLOCK + CUT7_LEN + GAP; // 799 + 158 + 128 = 1085

// The crashed plumbing's accent. OP_DARK 0.16 is the ladder's wiped rung; over
// this field at this hue it needs the lift to stay a line rather than a smudge.
export const OP_DEAD = 0.28;

// ---------------------------------------------------------------------------
// The camera. Four moves, one per act, with true holds between. Director pass 3
// added the return to the hub on "so OpenAI patched" (a slow plain ease in/out,
// warp 1, over 22 frames) and the pull-back on "and as a result" that takes the
// piece back out for the wipe.
// ---------------------------------------------------------------------------
export const K_OPEN = 0.6;
export const K_CLOSE = 1.0;
export const K_WIDE = 0.45;
export const C_WIDE = 180; // content centre for both wide framings
export const C_HUB = RAIL_Y; // 760: the rail is the content centre in close-up
export const CAM_WARP = 0.72;
export const M1_F0 = 0;
export const M1_F1 = 10;
export const M2_F0 = 38;
export const M2_F1 = 52;
export const K_PATCH = 0.9; // the return: hub centred, ring 72 px, the square 162 px
export const M3_F0 = 116; // "so OpenAI patched" — on screen from ~f117, settled ~f146, before the seal
export const M3_F1 = 138;
export const M4_F0 = 172; // "and as a result" — back out for the wipe, settled well before "inadvertently"
export const M4_F1 = 186;

const M1 = camMove({
  f0: OFFSET + M1_F0,
  f1: OFFSET + M1_F1,
  k0: K_OPEN,
  k1: K_CLOSE,
  c0: C_WIDE,
  c1: C_HUB,
  warp: CAM_WARP,
});
const M2 = camMove({
  f0: OFFSET + M2_F0,
  f1: OFFSET + M2_F1,
  k0: K_CLOSE,
  k1: K_WIDE,
  c0: C_HUB,
  c1: C_WIDE,
  warp: CAM_WARP,
});
const M3 = camMove({
  f0: OFFSET + M3_F0,
  f1: OFFSET + M3_F1,
  k0: K_WIDE,
  k1: K_PATCH,
  c0: C_WIDE,
  c1: C_HUB,
  warp: 1, // plain smoothstep: ease in, ease out, no early speed
});
const M4 = camMove({
  f0: OFFSET + M4_F0,
  f1: OFFSET + M4_F1,
  k0: K_PATCH,
  k1: K_WIDE,
  c0: C_HUB,
  c1: C_WIDE,
  warp: CAM_WARP,
});
// Move 1 opens ON frame 0, so its own first key IS the opening rest and there
// is no separate leading key to add — `runCamera` clamps everything before it.
export const PW_CAM_F = [...M1.F, ...M2.F, ...M3.F, ...M4.F, OFFSET + DURATION];
export const PW_CAM_K = [...M1.K, ...M2.K, ...M3.K, ...M4.K, K_WIDE];
export const PW_CAM_CY = [...M1.CY, ...M2.CY, ...M3.CY, ...M4.CY, C_WIDE + CAM_LIFT / K_WIDE];

// ---------------------------------------------------------------------------
// A SPAN OF A STROKE. Everything drawn twice in this piece — the dead accent
// and the ink under it, the traced route and the accent under that — is one
// path shown between two arclengths, so the two halves are cut out of the same
// geometry and cannot drift. `strokeDashoffset = -a` starts the dash pattern at
// arclength `a`; a gap of `len + 1` guarantees the pattern never repeats.
// ---------------------------------------------------------------------------
type SpanProps = {
  d: string;
  a: number;
  b: number;
  len: number;
  stroke: string;
  opacity: number;
  cap: "butt" | "round";
  width?: number;
  pathLength?: number;
};
const Span: React.FC<SpanProps> = ({ d, a, b, len, stroke, opacity, cap, width, pathLength }) => {
  if (b - a <= 0.001) return null;
  const whole = a <= 0.001 && b >= len - 0.001;
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={width ?? STROKE}
      strokeLinecap={cap}
      strokeLinejoin="round"
      opacity={opacity}
      pathLength={pathLength}
      strokeDasharray={whole ? undefined : `${(b - a).toFixed(3)} ${(len + 1).toFixed(3)}`}
      strokeDashoffset={whole ? undefined : -a}
    />
  );
};

// ---------------------------------------------------------------------------
// THE HUB TURNS WHITE. Director's pass 2: on "patched", the WHOLE hub — ring
// and parcel — converts from dead accent to ink, so the sentence's own verb is
// the picture. It is cut 7's conversion geometry with the colours the other way
// round AND the stroke order reversed: cut 7 built the parcel out of its centre
// and then took the ring, so the patch takes the ring first and works INWARD to
// the parcel's centre. OpenAI comes at it from the outside.
//
//   0,1  the ring, from the seal's two feet (20 deg and 60 deg) both ways
//        round to the split at 220 deg. 160 deg each, so the two fronts meet
//        there together, and neither ever enters the crack — the sealed arc is
//        already ink, drawn by SEAL_STROKES                     f150 -> f158
//   2-4  the hexagon: cut 7's own three two-edge runs, untouched  f158 -> f162
//   5    the strap: cut 7's own stroke, untouched                 f162 -> f164
//   6-8  the three inner edges, REVERSED — vertex to centre, so the last thing
//        to go white is the middle of the parcel                  f164 -> f166
//
// Every front is ink at OP_READ behind it, dead accent ahead of it, and carries
// the field's white tip while it runs. By f166 the hub is exactly cut 3's
// package manager: whole, white, inside the look-box.
// ---------------------------------------------------------------------------
export const HUB_INK_F0 = 150; // "patched the", one frame after the seal clicks
export const HUB_RING_F1 = 158;
export const HUB_HEX_F1 = 162;
export const HUB_STRAP_F1 = 164;
export const HUB_INK_F1 = 166;

const HUB_C: P = { x: HUB.x, y: HUB.y };
export const HUB_INK_STROKES: Stroke[] = [
  // the ring, out of the seal's feet, both ways round to the split
  arcStroke("ki0", CRACK_MID + CRACK_HALF, CRACK_SPLIT, () => 0), // 60 -> 220
  arcStroke("ki1", CRACK_MID - CRACK_HALF, CRACK_SPLIT - 360, () => 0), // 20 -> -140
  // cut 7's hexagon runs and strap, exactly as it drew them
  ...PARCEL_STROKES.slice(3, 7),
  // cut 7's three inner edges, reversed: vertex -> centre
  ...PKG_LAND.map((vi, i) => polyStroke(`ke${i}`, [PKG_V[vi], HUB_C], () => 0, "round")),
];
export const HUB_RING_N = 2;
export const HUB_HEX_N = 3;
const maxLen = (a: Stroke[]) => Math.max(...a.map((s) => s.len));
export const V_HUB_RING = maxLen(HUB_INK_STROKES.slice(0, 2)) / (HUB_RING_F1 - HUB_INK_F0);
export const V_HUB_HEX = maxLen(HUB_INK_STROKES.slice(2, 5)) / (HUB_HEX_F1 - HUB_RING_F1);
export const V_HUB_STRAP = HUB_INK_STROKES[5].len / (HUB_STRAP_F1 - HUB_HEX_F1);
export const V_HUB_EDGE = maxLen(HUB_INK_STROKES.slice(6)) / (HUB_INK_F1 - HUB_STRAP_F1);

export const hubInkFront = (i: number, f: number): number => {
  if (i < 2) return (f - HUB_INK_F0) * V_HUB_RING;
  if (i < 5) return (f - HUB_RING_F1) * V_HUB_HEX;
  if (i === 5) return (f - HUB_HEX_F1) * V_HUB_STRAP;
  return (f - HUB_STRAP_F1) * V_HUB_EDGE;
};

// ---------------------------------------------------------------------------
// THE DRAIN. The hub is already ink by f166, so the wipe has only the four
// lines left to take: cut 7's LINE_STROKES — the rail both ways and our
// column's two pipes — each oriented FROM the ring outward, so one front per
// line leaves the hub at f230 and runs off the world. Ink is dashed ON from the
// hub to the front, the dead accent is dashed OFF over exactly the same span,
// and the front carries a white tip while it runs. Cut 7's parcel and ring
// stages of the drain are gone with them: the hub turned white on "patched".
// ---------------------------------------------------------------------------
export const DRAIN_LINE_F0 = 230; // "wiped the"
export const DRAIN_V = 45; // world px/frame, 20.25 screen px/frame at k 0.45

export const drainFront = (f: number): number => (f - DRAIN_LINE_F0) * DRAIN_V;

// ---------------------------------------------------------------------------
// THE LOOK-BOX. "What was looked at": solid, stroke 3, head-led draw, click on
// close — the ScopeOfTheReport box, in this world's corner treatment. It is
// drawn as ONE continuous stroke starting at the top-left corner and running
// clockwise, which `squirclePath` does not start at: its own origin is on the
// top edge, `p` in from the top-right corner. So the reveal is offset by that
// much and wraps around the closed path, which takes two elements — the part
// before the path's end and the part after it.
// ---------------------------------------------------------------------------
// DIRECTOR'S PASS 2: a SQUARE, CENTRED ON THE HUB. It was a 170 x 140 rectangle
// offset up and left of the ring, which read as a box that had missed. 180 x 180
// about (540, 760) puts the ring dead centre with 50 px of air on every side,
// and the crack — whose furthest stroke is r ~ 44 at the upper right — sits
// inside it with ~46 px to spare.
export const LOOK_HALF = 90;
export const LOOK = {
  x0: HUB.x - LOOK_HALF, // 450
  y0: HUB.y - LOOK_HALF, // 670
  w: 2 * LOOK_HALF, // 180
  h: 2 * LOOK_HALF, // 180
};
export const LOOK_PERIM = 2 * (LOOK.w + LOOK.h); // 720
export const LOOK_PATH = squirclePath(LOOK.w, LOOK.h);
// `squirclePath`'s corner reach, so the path's own start point is known.
const LOOK_R = Math.min(
  Math.min(LOOK.w, LOOK.h) / 2,
  Math.max(SQUIRCLE_RATIO * Math.min(LOOK.w, LOOK.h), SQUIRCLE_MIN),
);
const LOOK_P = Math.min(Math.min(LOOK.w, LOOK.h) / 2, (1 + SQUIRCLE_SMOOTH) * LOOK_R);
// where the top-left corner sits in the path's own arclength, with the path
// normalised to LOOK_PERIM by `pathLength`
export const LOOK_START = LOOK_PERIM - LOOK.w + LOOK_P;
export const LOOK_F0 = 17; // "this crash"
export const LOOK_F1 = 28; // closed
export const LOOK_CLICK = 4;
export const LOOK_FADE_F0 = 216; // "inadvertently"
export const LOOK_FADE = 8;
export const V_LOOK = LOOK_PERIM / (LOOK_F1 - LOOK_F0); // 65.455 world px/frame

// The perimeter walked clockwise from the top-left corner, for the white tip.
// The corner radius is 2 world px on a 180 x 180 box, so the square's own
// perimeter locates the tip to within a pixel of the squircle's.
export const lookPt = (d: number): P => {
  let s = d;
  if (s <= LOOK.w) return { x: LOOK.x0 + s, y: LOOK.y0 };
  s -= LOOK.w;
  if (s <= LOOK.h) return { x: LOOK.x0 + LOOK.w, y: LOOK.y0 + s };
  s -= LOOK.h;
  if (s <= LOOK.w) return { x: LOOK.x0 + LOOK.w - s, y: LOOK.y0 + LOOK.h };
  s -= LOOK.w;
  return { x: LOOK.x0, y: LOOK.y0 + LOOK.h - s };
};

// ---------------------------------------------------------------------------
// THE EXPLOIT ROUTE, as one polyline: cut 4's own points, so the trace, the
// erase and the dead accent are all read off the same geometry cut 5 drew.
// ---------------------------------------------------------------------------
export const EXPLOIT_STROKE: Stroke = polyStroke("ex", EXPLOIT_PTS, () => 0, "round");
export const TRACE_F0 = 49; // "out that": the tip leaves the crack's midpoint
// DIRECTOR'S PASS 2: the camera is already at the wide by f60, so the trace runs
// the WHOLE route in full view and its arrival is the word. The speed is solved
// from the route's own length so the tip lands on the internet ring's right edge
// exactly on "exploit" f107, rather than being a round number that runs off the
// top of the frame and finishes out of shot.
export const TRACE_F1 = 107; // "exploit": the tip reaches the internet ring
export const V_TRACE = EXPLOIT_STROKE.len / (TRACE_F1 - TRACE_F0); // 34.183
export const TRACE_CLICK = 4; // the ring's own 4-frame click on arrival
export const ERASE_F0 = 159; // "relevant"
export const V_ERASE = 60; // world px/frame, 27.0 screen px/frame at k 0.45
// where it actually lands: 1982.632 / 60 = 33.044 frames
export const ERASE_F1 = ERASE_F0 + EXPLOIT_STROKE.len / V_ERASE; // 192.044

// ---------------------------------------------------------------------------
// THE SEAL. The crack's two ends grow toward each other in ink and meet at the
// gap's midpoint. Each is an arc on the hub's own circle, so the sealed segment
// is exactly the arc the crack took out.
// ---------------------------------------------------------------------------
export const SEAL_F0 = 142; // "patched the"
export const SEAL_F1 = 149; // met at the midpoint; the hub goes white behind it
export const SEAL_CLICK = 4;
export const SEAL_STROKES: Stroke[] = [
  arcStroke("s0", CRACK_MID - CRACK_HALF, CRACK_MID, () => 0), // 20 -> 40
  arcStroke("s1", CRACK_MID + CRACK_HALF, CRACK_MID, () => 0), // 60 -> 40
];
export const V_SEAL = SEAL_STROKES[0].len / (SEAL_F1 - SEAL_F0); // 1.995 px/frame

// ---------------------------------------------------------------------------
// The six ringed agents' rings go out on "board": the agents that had the board
// are just agents again. Nothing else in any box changes.
// ---------------------------------------------------------------------------
export const RINGS_OUT_F0 = 262;
export const RINGS_OUT = 8;

// ---------------------------------------------------------------------------
// Cut 6's rim beads on the internet ring, frozen at their floor. They are the
// arrivals that happened, and this piece leaves them exactly where cut 6 left
// them: the internet is not OpenAI's board.
// ---------------------------------------------------------------------------
export const BEADS = SL_PACKETS.filter((p) => p.bead >= 0 && p.arrive <= SL_DURATION)
  .slice(-BEAD_CAP)
  .map((p) => {
    const pt = beadPt(p.bead);
    return { key: p.key, x: pt.x, y: pt.y };
  });

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
  deadOpacity: OP_DEAD,
  markSrc: "openai-chatgpt-logo.png",
  markSize: 108,
  beats: {
    openaiNoticed: 0,
    thisCrash: 17,
    andItAlso: 30,
    figured: 44,
    outThat: 49,
    theAgents: 67,
    hadBuiltThis: 82,
    exploit: 107,
    soOpenai: 122,
    patchedThe: 142,
    relevant: 159,
    vulnerability: 167,
    andAsAResult: 180,
    inadvertently: 216,
    wipedThe: 230,
    agentsMessage: 247,
    boardInThe: 262,
    process: 276,
    end: 289,
  },
});

const PatchedAndWiped: React.FC<Props> = ({
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
  deadOpacity,
  markSrc,
  markSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  // The two clocks. F is the whole clip's, so the ambient and the hand on the
  // camera carry their phase across the un-illustrated sentence; F2 is cut 2's
  // own, for the gestures of cut 2 that are still running.
  const F = frame + OFFSET;
  const F2 = frame + TH_CLOCK;
  const tone = makeTone(accentDeep, accent);

  // -- camera, first: the cull needs it --------------------------------------
  const cam = runCamera(F, PW_CAM_F, PW_CAM_CY, PW_CAM_K);
  const drift = sway(F);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx; // no lateral move in this cut
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);
  // The close-up floor: a tip is never smaller than HEAD_MIN_W world px.
  const headW = Math.max(HEAD_R / k, HEAD_MIN_W);

  // -- the hub turns white ---------------------------------------------------
  // One front per stroke, ring first and then inward through the parcel. Behind
  // it is ink; ahead of it is what the crash left.
  const hubInk = HUB_INK_STROKES.map((s, i) =>
    Math.max(0, Math.min(s.len, frame < HUB_INK_F0 ? 0 : hubInkFront(i, frame))),
  );
  const hubInkTips = HUB_INK_STROKES.map((s, i) =>
    hubInk[i] > 0 && hubInk[i] < s.len ? { key: s.key, p: s.at(hubInk[i]) } : null,
  ).filter(Boolean) as { key: string; p: P }[];

  // -- the drain -------------------------------------------------------------
  // One front per line, out of the hub. Behind it is ink; ahead of it is what
  // the crash left.
  const drain = LINE_STROKES.map((s) =>
    Math.max(0, Math.min(s.len, frame < DRAIN_LINE_F0 ? 0 : drainFront(frame))),
  );
  const drainTips = LINE_STROKES.map((s, i) =>
    drain[i] > 0 && drain[i] < s.len ? { key: s.key, p: s.at(drain[i]) } : null,
  ).filter(Boolean) as { key: string; p: P }[];

  // -- the look-box ----------------------------------------------------------
  const lookDraw = clamp01((frame - LOOK_F0) / (LOOK_F1 - LOOK_F0));
  const lookLen = lookDraw * LOOK_PERIM;
  const lookClick = frame >= LOOK_F1 && frame < LOOK_F1 + LOOK_CLICK ? 1 : 0;
  const lookOp =
    frame < LOOK_F0
      ? 0
      : Math.min(1, OP_READ + (1 - OP_READ) * lookClick) *
        interpolate(frame, [LOOK_FADE_F0, LOOK_FADE_F0 + LOOK_FADE], [1, 0], clamp);
  // the reveal wraps the closed path, so it is drawn as two spans
  const lookA = Math.min(lookLen, LOOK_PERIM - LOOK_START);
  const lookB = lookLen - lookA;

  // -- the trace and the erase -----------------------------------------------
  const exLen = EXPLOIT_STROKE.len;
  const traceC = clamp01((frame - TRACE_F0) * (V_TRACE / exLen)) * exLen;
  const eraseC = clamp01((frame - ERASE_F0) * (V_ERASE / exLen)) * exLen;
  const traceTip = traceC > 0 && traceC < exLen ? EXPLOIT_STROKE.at(traceC) : null;
  const eraseTip = eraseC > 0 && eraseC < exLen ? EXPLOIT_STROKE.at(eraseC) : null;
  // The internet ring's own 4-frame click, on the frame the trace lands on it.
  // The ring is already at full ink, so the click has to come from somewhere
  // else: at the k 0.45 rest the ring is 36 screen px across and its rim is
  // packed with cut 6's 21 beads, which is most of what is actually visible of
  // it — a +1.5 px stroke bump alone was rendered and measured invisible under
  // them. So the beads go from their persisted BEAD_FLOOR 0.6 to full ink for
  // the four frames and the ring's stroke bumps with them. Nothing about the
  // beads changes: they are the same 21 arrivals in the same places, and they
  // drop straight back to 0.6.
  const traceClick = frame >= TRACE_F1 && frame < TRACE_F1 + TRACE_CLICK ? 1 : 0;
  const beadOp = BEAD_FLOOR + (1 - BEAD_FLOOR) * traceClick;

  // -- the seal --------------------------------------------------------------
  const sealC = Math.max(
    0,
    Math.min(SEAL_STROKES[0].len, (frame - SEAL_F0) * V_SEAL),
  );
  const sealClick = frame >= SEAL_F1 && frame < SEAL_F1 + SEAL_CLICK ? 1 : 0;
  const sealOp = Math.min(1, OP_READ + (1 - OP_READ) * sealClick);

  // -- the rings on the six agents -------------------------------------------
  const ringOp =
    OP_READ * interpolate(frame, [RINGS_OUT_F0, RINGS_OUT_F0 + RINGS_OUT], [1, 0], clamp);

  // -- our crowd's tone ------------------------------------------------------
  const seatTone = new Float32Array(NSEAT);
  TILES.forEach((t) => {
    seatTone[t.seat] = smooth((F - t.land) / TONE_DUR);
  });
  WAVE2.forEach((w) => {
    seatTone[w.seat] = Math.max(seatTone[w.seat], smooth((F2 - w.land) / TONE_DUR));
  });
  seatTone[OUR_AGENT.seat] = 1;
  seatTone[OUR_AGENT_2.seat] = 1;

  // -- ambient traffic -------------------------------------------------------
  const lit = new Float32Array(NSEAT);
  const threadEls: Th[] = [];
  idleFor(F, OUR, idleThreadCount, lit, threadEls);

  // -- the farm --------------------------------------------------------------
  const neighbours = NEIGHBOURS.filter((b) => onScreen(b, cx, cy, k)).map((b) => {
    const nlit = new Float32Array(b.n);
    b.tiles.forEach((t) => {
      nlit[t.seat] = 1; // its agents got their tasks long ago
    });
    const ringed = RINGED_IN.get(b.id);
    if (ringed !== undefined) nlit[ringed] = 1;
    const nThreads: Th[] = [];
    idleFor(F, b, b.idle, nlit, nThreads);
    // its reaches, still pumping on cut 2's SOFT cycle
    const nLines = b.tiles.map((t, i) => {
      const x1 = t.x;
      const y1 = t.y - TILE_HALF;
      const L = Math.max(1, y1 - LINE_TIP_Y);
      const p = pumpAt(b.id * 17 + i, F2, 0, Infinity) * Math.min(PUMP_PULL, PUMP_CAP * L);
      return { key: i, x1, y1, x2: x1, y2: LINE_TIP_Y + p };
    });
    return {
      b,
      dots: dotPaths(b, nlit, F, dotRadius),
      threads: threadPaths(nThreads),
      lines: nLines,
    };
  });

  // -- the seventeen reaches, converged and still pumping --------------------
  const lines = REACHES.map((rc) => {
    const x1 = rc.x;
    const y1 = rc.y - TILE_HALF;
    const conv = smooth((F2 - rc.convStart) / 12);
    const tipX = rc.tipStart + (rc.tipEnd - rc.tipStart) * conv;
    const dx = tipX - x1;
    const dy = LINE_TIP_Y - y1;
    const L = Math.hypot(dx, dy) || 1;
    const p =
      pumpAt(rc.pumpIdx, F2, rc.old ? 25 : rc.arrive, Infinity) *
      Math.min(PUMP_PULL, PUMP_CAP * L);
    return { key: rc.key, x1, y1, x2: tipX - (dx / L) * p, y2: LINE_TIP_Y - (dy / L) * p };
  });

  const wifiCx = RING.x;
  const wifiCy = RING.y + WIFI.dy;

  const drawThread = (t: Th) => (
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
  );

  // The two halves of a draining stroke: the ink the wipe leaves behind, and the
  // dead accent still ahead of the front. Complementary spans of one path, so
  // nothing is drawn twice and there is no crossfade anywhere.
  const takenInk = (s: Stroke, front: number) => (
    <Span
      key={`i${s.key}`}
      d={s.d}
      a={0}
      b={front}
      len={s.len}
      stroke={ink}
      opacity={OP_READ}
      cap={s.cap}
    />
  );
  const deadAccent = (s: Stroke, front: number) => (
    <Span
      key={`a${s.key}`}
      d={s.d}
      a={front}
      b={s.len}
      len={s.len}
      stroke={accent}
      opacity={deadOpacity}
      cap={s.cap}
    />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={F}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={parallax}
      />

      {/* THE FARM AND THE MANAGER. Its own copy of the one global shadow, for
          cut 2's reason: a CSS filter rasterises the whole sub-tree it is on,
          and the neighbours never overlap our box, so two identical filters
          over two disjoint trees are the same pixels as one over their union. */}
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
            {neighbours.map((nb) => (
              <g key={nb.b.id} transform={`translate(${nb.b.dx} ${nb.b.dy})`}>
                {/* its crowd, one path per tone bucket */}
                {nb.dots.map((d, bi) =>
                  d ? <path key={bi} d={d} fill={tone(bi / TONE_STEPS)} opacity={dotUnread} /> : null,
                )}
                {/* its idle traffic, one path per opacity bucket */}
                {nb.threads.lines.map((d, bi) =>
                  d ? (
                    <path
                      key={`l${bi}`}
                      d={d}
                      fill="none"
                      stroke={accent}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={bi / THREAD_OP_STEPS}
                    />
                  ) : null,
                )}
                {nb.threads.heads.map((d, bi) =>
                  d ? <path key={`t${bi}`} d={d} fill={ink} opacity={bi / THREAD_OP_STEPS} /> : null,
                )}
                {/* its own sandbox, its own tasks, its own reaches */}
                <g style={{ filter: icon }}>
                  <path
                    d={BOX_PATH}
                    transform={`translate(${BOX_X0} ${BOX_Y0})`}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE}
                    opacity={OP_READ}
                  />
                  {nb.lines.map((l) => (
                    <line
                      key={l.key}
                      x1={l.x1}
                      y1={l.y1}
                      x2={l.x2}
                      y2={l.y2}
                      stroke={ink}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={OP_READ}
                    />
                  ))}
                  {nb.b.tiles.map((t, i) => (
                    <path
                      key={i}
                      d={TILE_PATH}
                      transform={`translate(${t.x - TILE_HALF} ${t.y - TILE_HALF})`}
                      fill={ink}
                      opacity={OP_READ}
                    />
                  ))}
                </g>
              </g>
            ))}

            {/* THE PACKAGE MANAGER. The neighbours' pipes are plain ink and
                always were — the conversion ran along the rail past them, never
                into them, so the wipe has nothing to give back there. */}
            <g style={{ filter: icon }} stroke={ink} strokeWidth={STROKE} opacity={OP_READ}>
              {FARM_COLS.filter((i) => i !== 0).map((i) => {
                const px = CENTRE_X + i * PITCH_X;
                return (
                  <g key={i}>
                    <line x1={px} y1={PIPE_TOP_Y} x2={px} y2={RAIL_Y} />
                    <line x1={px} y1={PIPE_BOT_Y} x2={px} y2={RAIL_Y} />
                  </g>
                );
              })}
            </g>
            <g style={{ filter: icon }}>
              {LINE_STROKES.map((s, i) => takenInk(s, drain[i]))}
              {LINE_STROKES.map((s, i) => deadAccent(s, drain[i]))}
            </g>

            {/* THE HUB: the ring the crash left cracked and the parcel inside
                it, dead accent until "patched" takes the whole of it back to
                ink from the seal inward. The seal is its own ink arc: it is
                what OpenAI put there, not what turned. */}
            <g style={{ filter: icon }}>
              {HUB_INK_STROKES.map((s, i) => takenInk(s, hubInk[i]))}
              {HUB_INK_STROKES.map((s, i) => deadAccent(s, hubInk[i]))}
              {SEAL_STROKES.map((s) => (
                <Span
                  key={s.key}
                  d={s.d}
                  a={0}
                  b={sealC}
                  len={s.len}
                  stroke={ink}
                  opacity={sealOp}
                  cap="round"
                  width={STROKE + 1.5 * sealClick}
                />
              ))}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      {/* OUR SANDBOX. Cut 7's layer, its tree in cut 7's order. */}
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
            <defs>
              <mask id="pw-gate" maskUnits="userSpaceOnUse" x={-400} y={-900} width={1900} height={1900}>
                <rect x={-400} y={-900} width={1900} height={1900} fill="#fff" />
                <rect x={GATE_X0} y={BOX_Y0 - 6} width={GATE_X1 - GATE_X0} height={12} fill="#000" />
              </mask>
            </defs>

            {/* our crowd */}
            {SEATS.map((s, i) => {
              const l = Math.max(lit[i], seatTone[i]);
              const r = dotRadius * s.r * s.rs * breath(F, hash(i, 9)) * (1 + 0.35 * l);
              return <circle key={i} cx={s.x} cy={s.y} r={r} fill={tone(l)} opacity={dotUnread} />;
            })}

            {/* idle traffic, head-led */}
            {threadEls.map(drawThread)}

            {/* the sandbox, with the gate cut 1 left dashed. Untouched: the
                walls are still OpenAI's, before and after the wipe. */}
            <g style={{ filter: icon }}>
              <g mask="url(#pw-gate)">
                <path
                  d={BOX_PATH}
                  transform={`translate(${BOX_X0} ${BOX_Y0})`}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE}
                  opacity={OP_READ}
                />
              </g>
              <line
                x1={GATE_X0}
                y1={BOX_Y0}
                x2={GATE_X1}
                y2={BOX_Y0}
                stroke={ink}
                strokeWidth={STROKE}
                strokeDasharray={`${GATE_DASH} ${GATE_GAP}`}
                opacity={OP_READ}
              />
            </g>

            {/* the internet: an ink ring outside the box, at full ink since
                cut 4's contact. Nothing in this piece touches it. */}
            <g style={{ filter: icon }}>
              <circle
                cx={RING.x}
                cy={RING.y}
                r={RING.r}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE + 1.5 * traceClick}
                strokeLinecap="round"
              />
              <g fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round">
                {WIFI.radii.map((r) => (
                  <path
                    key={r}
                    d={`M ${wifiCx - r * Math.sin(WIFI.halfAngle)} ${wifiCy - r * Math.cos(WIFI.halfAngle)} A ${r} ${r} 0 0 1 ${wifiCx + r * Math.sin(WIFI.halfAngle)} ${wifiCy - r * Math.cos(WIFI.halfAngle)}`}
                  />
                ))}
                <circle cx={wifiCx} cy={wifiCy} r={WIFI.dot} fill={ink} stroke="none" />
              </g>
            </g>

            {/* the seventeen reaches, still pumping against the wall */}
            <g style={{ filter: icon }}>
              {lines.map((l) => (
                <line
                  key={l.key}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={OP_READ}
                />
              ))}
            </g>

            {/* the seventeen tasks */}
            {OUR_TILES.map((t, i) => (
              <g key={i} style={{ filter: icon }}>
                <path
                  d={TILE_PATH}
                  transform={`translate(${t.x - TILE_HALF} ${t.y - TILE_HALF})`}
                  fill={ink}
                  opacity={OP_READ}
                />
              </g>
            ))}

            {/* the scars: cut 2's strike, exactly as it left our walls */}
            {SCARS.map((b) => (
              <circle key={b.key} cx={b.x} cy={b.y} r={BEAD_R} fill={ink} opacity={OP_READ * b.op} />
            ))}
          </svg>

          {/* the OpenAI mark, tinted white, exactly where cut 1 left it. It has
              no gesture here: what OpenAI does in this piece is the ink. */}
          <Img
            src={staticFile(markSrc)}
            style={{
              position: "absolute",
              left: MARK.x - markSize / 2,
              top: MARK.y - markSize / 2,
              width: markSize,
              height: markSize,
              opacity: OP_READ,
              filter: `brightness(0) invert(1) ${icon}`,
            }}
          />
        </div>
      </AbsoluteFill>

      {/* THE LINE. Above everything, because it is the subject: the dead exploit
          route, the ink trace over it, the erase that takes both away, the
          look-box, the drain's white tips, the beads on the internet ring's rim
          and the six agent rings. */}
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
            <g style={{ filter: icon }}>
              {/* the exploit route the crash left: still accent, dead, and
                  erased from the crack outward once it is patched */}
              <Span
                d={EXPLOIT_STROKE.d}
                a={eraseC}
                b={exLen}
                len={exLen}
                stroke={accent}
                opacity={deadOpacity}
                cap="round"
              />
              {/* OpenAI tracing the wire the agents laid, on top of it */}
              <Span
                d={EXPLOIT_STROKE.d}
                a={eraseC}
                b={Math.max(eraseC, traceC)}
                len={exLen}
                stroke={ink}
                opacity={OP_READ}
                cap="round"
              />
              {traceTip ? <circle cx={traceTip.x} cy={traceTip.y} r={headW} fill={ink} /> : null}
              {eraseTip ? <circle cx={eraseTip.x} cy={eraseTip.y} r={headW} fill={ink} /> : null}

              {/* what was looked at: the dead hub and its crack */}
              {lookOp > 0 ? (
                <g transform={`translate(${LOOK.x0} ${LOOK.y0})`}>
                  <Span
                    d={LOOK_PATH}
                    a={LOOK_START}
                    b={LOOK_START + lookA}
                    len={LOOK_PERIM}
                    pathLength={LOOK_PERIM}
                    stroke={ink}
                    opacity={lookOp}
                    cap="round"
                    width={STROKE + 1.5 * lookClick}
                  />
                  {lookB > 0.001 ? (
                    <Span
                      d={LOOK_PATH}
                      a={0}
                      b={lookB}
                      len={LOOK_PERIM}
                      pathLength={LOOK_PERIM}
                      stroke={ink}
                      opacity={lookOp}
                      cap="round"
                      width={STROKE + 1.5 * lookClick}
                    />
                  ) : null}
                </g>
              ) : null}
              {lookDraw > 0 && lookDraw < 1 ? (
                <circle
                  cx={lookPt(lookLen).x}
                  cy={lookPt(lookLen).y}
                  r={headW}
                  fill={ink}
                  opacity={lookOp}
                />
              ) : null}

              {/* the seal's own two tips while it closes */}
              {sealC > 0 && sealC < SEAL_STROKES[0].len
                ? SEAL_STROKES.map((s) => {
                    const p = s.at(sealC);
                    return <circle key={`st${s.key}`} cx={p.x} cy={p.y} r={headW} fill={ink} />;
                  })
                : null}

              {/* the patch's own white tips, running the ring and then inward
                  through the parcel, and the drain's, running out along the
                  four lines — the field's tip, at exactly the radius a packet
                  head would have, so the wipe and the traffic that used to run
                  here read as one language */}
              {hubInkTips.map((t) => (
                <circle key={`h${t.key}`} cx={t.p.x} cy={t.p.y} r={headW} fill={ink} />
              ))}
              {drainTips.map((t) => (
                <circle key={`d${t.key}`} cx={t.p.x} cy={t.p.y} r={headW} fill={ink} />
              ))}

              {/* cut 6's arrivals, still on the internet ring's rim */}
              {BEADS.map((b) => (
                <circle
                  key={b.key}
                  cx={b.x}
                  cy={b.y}
                  r={(HEAD_R * RING_BEAD_R) / k}
                  fill={ink}
                  opacity={beadOp}
                />
              ))}

              {ringOp > 0
                ? NODES6.map((n) => (
                    <circle
                      key={n.key}
                      cx={n.x}
                      cy={n.y}
                      r={RING_R / k}
                      fill="none"
                      stroke={ink}
                      strokeWidth={RING_STROKE / k}
                      opacity={ringOp}
                    />
                  ))
                : null}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default PatchedAndWiped;
