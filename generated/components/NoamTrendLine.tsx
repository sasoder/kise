import { loadFont } from "@remotion/google-fonts/RobotoCondensed";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
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
  iconShadow,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { arriveEase } from "./levelUp";

// The house type. Roboto Condensed 700, uppercase, 0.11em tracking with a
// compensating negative margin -- the Dwarkesh type rule, loaded at module
// scope so a font failure surfaces before any frame renders.
const roboto = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_10x_Math`. ONE master graphic for the whole clip: a
// log-scale trend line revealed step by step. Up = how long a task takes a
// human mathematician, one decade per 140 world px. Across = 2022..2028, one
// year per 115 world px. 10x a year is therefore a straight diagonal.
//
// FRAME DERIVATION. Every number in this file is a GLOBAL clip frame,
//   F = round(seconds * 24)
// read off `Noam_10x_Math_c2_p0.5.srt` (word level). The nine cuts are windows
// on ONE timeline: the component renders world state at `startFrame +
// useCurrentFrame()`, so every cut's frame 0 is pixel-identical to the same
// global frame of the full composition by construction.
//
//   ImoGold          113..192    "i mean when we got imo gold in 2025"
//   FiveSeconds      192..343    "the models when they figured out gsm8k ..."
//   OneMinute        343..493    "and then the next year ... MATH ... a minute"
//   TenMinutes       493..725    "and then you get to AIME ... 10 minutes ..."
//   TenXEveryYear    725..874    "and so every year ... 10x increase ..."
//   HundredMinutes   874..1053   "very sensible that a year later imo gold ..."
//   MillenniumPrize  1053..1251  "just projecting outwards ... millennium prize"
//   FifteenHours     1251..1500  "trend line of like 10x every year ... 15 hours"
//   FasterThanExpected 1500..1700 "... 2026 ... 2027 ... 2028 ... faster than i expected"
//
// Last word "expected" ends at 70.180 s -> F 1684; + the set's 16-frame tail
// = 1700. Full = 113..1700 = 1587 frames.
//
// ---------------------------------------------------------------------------
// COLOUR, STRICT. ORANGE is only ever "what the models can do": the points,
// the solid line, the packets on it, the year ticks they have reached, the x10
// tags, the dashed projection, and finally the flag. WHITE ink at two levels
// (1.0 and 0.6) is everything human: the person glyph, the time numerals, the
// benchmark names, the axis, the Millennium level, the flag before it is
// reached. Orange marks are SOLID -- the one dim is a switch to ACCENT_DEEP,
// never alpha, and the only thing that ever takes it is the abandoned dashed
// projection at the very end.
//
// THE WHITE LADDER IS DRIVEN BY THE HEAD, and the current subject is always
// FULL white. A landing's human card enters at 1.0 and stays 1.0 for as long as
// the line's head is on that landing; it steps to 0.6 over the 12 frames the
// line takes to LEAVE it for the next one. Cut 5's white tick brings the whole
// column back to 1.0 bottom-to-top and it stays there for the rest of the
// piece. Benchmark names and sub-lines are 0.6 throughout, so at any moment the
// brightest thing in the frame is the landing being talked about.
//
// ---------------------------------------------------------------------------
// GESTURES -- the word each lands on and the frames it runs. Gestures LEAD
// their word and overlap their neighbour; the whole clip is one motion.
// Nothing in the piece is outside this list.
//
// CUT 1  ImoGold 113-192  "when we got IMO(131) gold(137) in 2025(143)"
//  1. f113-146 open        Camera opens k 2.20 just left of P3, dark field,
//                          grid only, and creeps HARD: k -> 2.42 with 60 world
//                          px of tilt, which is what makes f131-146 move.
//  2. f120-131 "IMO"       P3 lands: the orange point scales in with one tiny
//                          settle, nothing else.
//  3. f128-140 "gold"      "IMO GOLD" rises in at 0.6 white, right-below it.
//  4. f143    "2025"       The year HARD-TICKS in orange above the point --
//                          the axis is 500 px below the frame in this cut, so
//                          the year stands by its point until f744.
//  5. f146-200 ->          THE LONG GLIDE: one continuous move down-left along
//                          the invisible diagonal, onto P0, continuing the
//                          creep's own direction. It crosses the cut boundary;
//                          cut 2 opens mid-glide.
//
// CUT 2  FiveSeconds 192-343  "models(192) figured out(210) GSM8K(220) ...
//                              human(247) ... five(273) seconds(280) ...
//                              grade school math(318)"
//  6. f194-230 "models"    The year axis draws OUTWARD from P0, both ways,
//                          from the cut's first frame, while the camera is
//                          still arriving on it -- so the cut never opens on
//                          bare grid. Its right TIP never stops after that:
//                          see LIVENESS.
//  7. f202-220 "figured    P0 lands at f214; "GSM8K" rises in behind it and
//              out GSM8K"  lands at 220.
//  8. f206     -           "2022" hard-ticks orange under the axis.
//  9. f232-250 "human"     The person glyph rises in, left of the point, 0.6.
// 10. f263     "five"      "5 SEC" HARD-TICKS under the person. (Lands 10 f
//                          before the word, the set's rule.)
// 11. f302-318 "grade      "GRADE SCHOOL MATH" rises in under the name.
//              school math"
// 12. f200-336 hold        A creep that never stops, in three lobes so it has
//                          no slow middle: k 2.20 -> 2.46, 77 world px of pan
//                          and 90 of tilt. This is the longest hold in the
//                          piece and the frame holds one card, so the camera
//                          has to carry all of it.
//
// CUT 3  OneMinute 343-493  "the next(354) year ... MATH(383) ... expert(435)
//                            ... a minute(477)"
// 13. f336-383 "next year" THE LINE GROWS out of P0 up the diagonal; the
//                          camera glides with the head; "2023" hard-ticks
//                          orange as the head passes x 385 (f384).
// 14. f376-391 "MATH"      P1 lands under the arriving head; "MATH" rises in.
// 15. f424-440 "expert     P1's person rises in at 0.6.
//              human"
// 16. f477     "a minute"  "1 MIN" hard-ticks.
// 17. f386-490 hold        A slow pull-back, k 2.15 -> 1.98, making room for
//                          the human side. Packets now run the line and never
//                          stop again.
//
// CUT 4  TenMinutes 493-725  "AIME(512) ... qualifier(548) USA(562) ...
//                             human(609) good mathematician(639) ... 10(664)
//                             minutes(672) ... able(696) a year later(714)"
// 18. f490-520 "get to"    The line grows P1 -> P2 and the camera glides with
//                          it, ending with P2 dead centre at k 1.79.
// 19. f505-520 "AIME"      P2 lands, "AIME" rises in.
// 20. f520-566 "qualifier" THE PULL-BACK that admits the sub-line, k 1.79 ->
//                          1.40 -- the biggest move in the cut, and on its
//                          word. See DEVIATIONS: 1.40 is the widest the piece
//                          can hold once "USA OLYMPIAD QUALIFIER" exists.
// 21. f542-558 "USA"       "USA OLYMPIAD QUALIFIER" rises in.
// 22. f624-640 "good       P2's person rises in at 0.6.
//              mathematician"
// 23. f664     "10"        "10 MIN" hard-ticks.
// 24. f700-714 "a year     A BRIGHTER PACKET runs the P1->P2 segment and
//              later"      "2024" hard-ticks orange as it lands.
// 25. f672-752 ->          THE PULL-BACK starts early, on "10 minutes", so cut
//                          4 is already moving into cut 5.
//
// CUT 5  TenXEveryYear 725-874  "every year(728) ... 10x(754) increase(763)
//                                ... task(795) ... length(825) ... human(849)"
// 26. f672-752 "every      Pull-back to k 1.14: the three points are visibly
//              year"       one straight line and the lone IMO point stands on
//                          its extension with a gap of dark field between.
// 27. f744-766 -           "2025" leaves its point and takes its place on the
//                          axis, straight down at x 615.
// 28. f738-776 "10x /      A packet runs up the line from P0; as it crosses
//              increase"   each riser an orange "X10" tag pops beside that
//                          segment (P0-P1 f754, P1-P2 f770).
// 29. f800-849 "length ... A white tick runs up the human side; each person +
//              human"      numeral it reaches steps 0.6 -> 1.0, bottom to top,
//                          and they stay lit. P2 is still the head's landing at
//                          this point, so it is already 1.0 and the tick passes
//                          it as its destination rather than lighting it.
//
// CUT 6  HundredMinutes 874-1053  "very sensible(879) a year later(904) imo
//                                  gold(919) ... a hundred(956) minutes(960)
//                                  ... how long it takes(977) ... imo(1026)"
// 30. f856-928 "a year     THE PUSH to k 1.40 on P3: cx is pinned between
//              later"      "5 SEC" and the sub-line, so the move is the zoom
//                          and 76 world px of TILT up onto the new landing.
// 31. f885-919 "imo gold"  The line grows P2 -> P3 and MEETS the point that has
//                          been standing since cut 1; one small settle on
//                          contact; the third "X10" tag pops at mid-riser
//                          (f902).
// 32. f929-945 -           P3's person rises in, at 1.0 now.
// 33. f956     "a hundred" "100 MIN" hard-ticks.
// 34. f928-1060 hold       Creep and drift; packets keep running.
//
// CUT 7  MillenniumPrize 1053-1251  "projecting(1059) outwards(1069) ... how
//                                    long(1092) ... a person(1121) ... to
//                                    solve(1168) ... a Millennium(1188)
//                                    Prize(1194) problem(1198) ... i don't
//                                    have a good sense(1215-1249)"
// 35. f1059-1085 "projecting" A short orange dashed stub leaves P3 up the
//               "outwards"    extension and marches; the camera goes with it.
// 36. f1060-1112 -          The glide up-right through dark field.
// 37. f1092-1112 "how long" THE LEVEL: the dashed white Millennium line draws
//                           head-led left to right and marches from then on.
// 38. f1112-1180 -          The camera widens and finds the whole level.
// 39. f1114-1130 "a person" A person glyph stands on the level at its left.
// 40. f1168      "to solve" "?" hard-ticks under it.
// 41. f1176-1188 "Millennium The white flag rises onto the level at x 960 and
//               Prize"       "MILLENNIUM PRIZE" reads above its left end.
// 42. f1210-1290 "i don't   The level breathes +-18 world px, slow, and settles.
//               have a good
//               sense"
// 43. f1240-1296 -          The return toward P3 begins late in the cut.
//
// CUT 8  FifteenHours 1251-1500  "trend line(1278) 10x(1293) every year(1301)
//                                 ... from imo gold(1326) ... hour and a
//                                 half(1361) to next year(1379) 15(1402)
//                                 hours(1407) ... not be enough(1444) to
//                                 solve(1463) a Millennium(1481)"
// 44. f1240-1296 "trend line" Camera back near P3 at k 1.35 with the three X10
//                             tags in view.
// 45. f1356-1366 "hour and    P3's numeral gives one small pulse.
//                a half"
// 46. f1376-1400 "to next     The dashed orange segment P3 -> P4 draws on from
//                year"        the cut-7 stub; the fourth "X10" tag pops (f1392)
//                             and "2026" hard-ticks WHITE 0.6 on the axis
//                             (f1396) -- the models are not there.
// 47. f1386-1400 "15"         P4 is a HOLLOW orange ring; its person rises in.
// 48. f1402      "hours"      "15 H" hard-ticks.
// 49. f1404-1444 "should not  THE PULL-BACK to the full wide shot: the level is
//                be enough"   far above.
// 50. f1448-1463 "to solve"   A white measuring bracket grows from P4 straight
//                             up to the level line. No text.
//
// CUT 9  FasterThanExpected 1500-1700  "2026(1548) probably not(1571) in
//                                       2027(1577) maybe(1589) in 2028(1601)
//                                       so it did(1622) ... faster(1659) than i
//                                       expected(1677)"
// 51. f1548-1562 "2026"       The bracket retracts and "2026" gives one small
//                             negative shake.
// 52. f1556-1577 "in 2027"    The dashes continue P4 -> P5; "2027" hard-ticks
//                             white as they land.
// 53. f1580-1601 "in 2028"    P5 -> P6, where the hollow ring touches the
//                             level; "2028" hard-ticks; the flag nods, white.
// 54. f1622-1655 "so it did   THE SOLID orange line leaves P3 steeply and hits
//                happen"      the level line at x = X4 (2026).
// 55. f1652-1670 "a lot       On contact the flag slides to that spot and turns
//                faster"      ORANGE at f1660, "2026" turns orange, and the
//                             abandoned dashed projection and its rings drop to
//                             ACCENT_DEEP. On the SAME frame the "?" under the
//                             Millennium person hard-ticks AWAY -- the question
//                             is answered. The person stays white.
// 56. f1624-1676 "than i      ONE GENTLE DRIFT HOME to k 1.02 / cx 553, which
//                expected"    is the framing that holds the WHOLE chart with
//                             ~68 screen px outside the outermost ink on each
//                             side and the hit and its orange flag in the upper
//                             third. The move lands 16 frames after the flag
//                             turns and the damper's approach carries the last
//                             24 frames; nothing is ever cropped.
//
// ---------------------------------------------------------------------------
// LIVENESS -- mechanisms, not gestures, none on a word and none ever stops:
//   * THE AXIS'S LIVING TIP: from f194 the head extends rightward and never
//     stops, on one monotone cubic through the frame each year is reached, so
//     it is always creeping (0.04-1.4 world px/frame between the keys) and it
//     arrives on a year just as that year ticks -- "and then the next year"
//     (354) is the tip reaching 2023. It runs for the whole piece;
//   * orange packets up the solid line from the frame it has length (f~345) to
//     the last frame, speed capped at 45 screen px/frame;
//   * marching dashes on every dashed line from the frame it finishes drawing;
//   * the camera, which is never parked: every hold is the damper's decaying
//     approach plus `sway`;
//   * the grid's parallax and its own -0.3 px/frame drift;
//   * a 1.5% breath on every orange point.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//
//  * THE POINTS SIT 40 WORLD PX HIGHER: Y_i = 1215 - 140 i, not 1255 - 140 i.
//    X_i, the 115/140 step and the axis at y 1300 are the brief's. At 1255 the
//    landing's label block (name cap top Y+14, 32 px, sub cap top Y+51, 24 px,
//    block bottom Y+66) ends at 1321 for P0 -- through the axis line and into
//    the year row at 1312. 1215 puts it at 1281, 19 px clear of the axis, and
//    everything else in the world moves with it (the Millennium level is still
//    Y_6, now 375). Nothing else in the brief's geometry changed.
//
//  * THE SIZE LAW IS k^0.75, NOT k^0.45, and the human card is anchored in
//    SCREEN px. At 0.45 the close-ups read as the wide shot cropped: at k 2.2
//    the numeral was 63 px (17% of the frame width), the person 116 and the
//    point a 16 px speck, and because the card hung at a FIXED -130 world px
//    the gap from the numeral to its point grew with the zoom -- 148 screen px
//    at k 2.2 against 53 at k 1, so the tightest shot was also the loosest. At
//    0.75 the k = 1 wide shot is untouched and k 2.2 gives an 80 px numeral, a
//    140 px person and a 20 px point radius. The card's anchor is now
//    CARD_GAP + (POINT_R + NUM_HALF[i]) k^0.75 screen px off its own point, so
//    every numeral ends exactly 40 screen px from its point at every zoom and a
//    wide numeral ("100 MIN") hangs further out than a narrow one ("15 H").
//    Sub-lines go to base 26 with everything else unchanged.
//
//  * SO THE RESTING ZOOMS COME DOWN IN THE SECOND HALF. Under k^0.75 two
//    labels run the frame: P0's card, which reaches 40 + (11 + 131.3) k^0.75
//    screen px left of its point, and "USA OLYMPIAD QUALIFIER", 359 k^0.75 wide
//    and starting 30 world px right of P2. From f558, when the sub-line exists,
//    holding both inside 1080 needs 375 k + 500 k^0.75 <= 1040, i.e. k <= 1.42
//    -- and the human column's numerals OVERLAP in x at any k below ~3.8
//    (115 k < 2 NUM_HALF k^0.75), so there is no cx that puts one card wholly
//    out and the next wholly in. Cuts 4, 6 and 8 therefore rest at 1.40, 1.40
//    and 1.33 rather than 1.66, 1.45 and 1.35, with cx pinned in a ~20 px
//    window around 486, and the piece opens out as the chart fills up. The
//    tight shots move to cuts 1-3, which hold one or two cards and now rest at
//    2.42 and 2.46 -- deeper than the old 2.30/2.36 -- because the same law
//    makes the type carry them. Every resting frame was then walked: nothing is
//    cut by a frame edge while the camera is at rest, tightest margin 12.6 px.
//
//  * THE CAPTION BAND STILL CAPS THE TILT. "Nothing below screen y 1350" plus a
//    chart that is a CONTINUOUS diagonal of ink from the head down to the year
//    row means the band can never be straddled: the bottom-most ink is the year
//    row, at world 1312 + 30 x 0.711 k^0.75 / k, so every frame needs
//    835 + (1333 - c) k <= 1350. At cut 6's k 1.40 that is c >= 965, which is
//    slack; the binding vertical constraint is at the OTHER end, in cut 8,
//    where the Millennium person's "?" hangs below the level and c has to be
//    1075 (not 975, not 1055) for the whole group to clear the top edge while
//    the camera is down on P3/P4.
//
//  * P4'S CARD HANGS TO THE RIGHT OF ITS POINT, at CARD_DY +55 instead of -32.
//    On the left it is run straight through by cut 9's steep line, which passes
//    x 653 at P4's own height and converges on P4's x at the level. P4 is also
//    the one landing with no benchmark name, so the right-below side -- where
//    every other landing's name sits -- is free. At +55 the card clears the
//    dashed P4 -> P5 riser (53 world px at its nearest), the bracket that grows
//    straight up from P4, the fourth X10 tag and "IMO GOLD". It is in that
//    position from its first frame and never moves.
//
//  * A LANDING'S NAME AND SUB-LINE ARE LEFT-ALIGNED AT X_i + 30 rather than
//    hung under the point. Centring the block put "USA OLYMPIAD QUALIFIER"
//    (13.8 em) across the trend line itself at x 418..465; left-aligning it
//    starts it clear of the point's own ink and the line never touches a label
//    at any frame -- the audit walks the whole polyline against every text box
//    and it is clean. At base 26 the sub is what sets cut 4's and cut 6's
//    resting zoom, above.
//
//  * "2025" TAKES ITS PLACE ON THE AXIS IN CUT 5, not cut 6. The move wants to
//    be seen from the wide, and cut 5's pull-back is the frame where the whole
//    axis first exists. It travels straight DOWN at x 615 over f744-766 (26.5
//    world px/frame, 30 screen px/frame at k 1.14), which crosses the AIME
//    sub-line's band in under a frame and nothing else. The axis tip is keyed
//    to arrive at 615 + 48 on the same frame it lands, so it is never sitting
//    on bare axis.
//
//  * CUT 7'S CAMERA WIDENS TO k 1.00 to find the level. The level line's label
//    sits at world y 255 and the year row at 1333; 1078 world px has to fit in
//    screen 60..1350, so k <= 1.197 at the moment "Millennium Prize" reads.
//
//  * THE PIECE ENDS AT k 1.02, NOT 1.17. The old push toward the hit sliced
//    "5 SEC" to a stray "C" and left the chart hanging off the left edge on the
//    last frame. With the tip keyed to world 1016 and P0's card reaching world
//    89, the whole chart is 927 world px wide, so an uncropped last shot with
//    >= 60 screen px of air on each side needs k <= 1.035; at 1.02 / cx 553 the
//    margins measure 70 and 65, the year row lands at 1249 (clear of the
//    caption band) and the hit sits at screen (724, 272). The final move is a
//    drift that LANDS, at f1676, rather than a push that is still running.
// ---------------------------------------------------------------------------

export const START = 113;
export const END = 1700;
export const FULL_DURATION = END - START; // 1587

export const CUTS = {
  ImoGold: [113, 192],
  FiveSeconds: [192, 343],
  OneMinute: [343, 493],
  TenMinutes: [493, 725],
  TenXEveryYear: [725, 874],
  HundredMinutes: [874, 1053],
  MillenniumPrize: [1053, 1251],
  FifteenHours: [1251, 1500],
  FasterThanExpected: [1500, 1700],
} as const;

export const schema = z.object({
  startFrame: z.number(),
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
  personSrc: z.string(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  startFrame: START,
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
  personSrc: "person.png",
});

// ---------------------------------------------------------------------------
// THE WORLD. One decade up is 140 px, one year across is 115, so 10x a year is
// a straight diagonal of slope -140/115.
// ---------------------------------------------------------------------------
export const FRAME_W = 1080;
export const FRAME_H = 1920;

export const NX = (i: number) => 270 + 115 * i;
export const NY = (i: number) => 1215 - 140 * i;
export const P = Array.from({ length: 7 }, (_, i) => ({ x: NX(i), y: NY(i) }));

export const LEVEL_Y = NY(6); // 375 -- the Millennium Prize level
export const LEVEL_X0 = 180;
export const LEVEL_X1 = 1010;
/** Where the person stands ON the level. Not its far left end: the camera is
 *  still up-right on the line's extension when the person has to read, at
 *  f1121, and at x 200 it enters 30 px off the frame's left edge. 480 is the
 *  left half of the level, in frame at every frame of cut 7. */
export const LEVEL_PERSON_X = 480;
/** And the label's left edge. Far enough in that it survives cut 9's push
 *  toward the hit -- at x 96 the push clipped it to "NNIUM PRIZE". */
export const LEVEL_LABEL_X = 250;
export const AXIS_Y = 1300;
export const AXIS_LEFT = 150;
export const YEAR_CAP = 1312; // the year numerals' cap top, under the axis

/** Unit vector up the trend line, and its right-hand perpendicular. */
const LEN = Math.hypot(115, 140);
const DIRX = 115 / LEN;
const DIRY = -140 / LEN;
const PERPX = -DIRY; // 0.7734
const PERPY = DIRX; // 0.6354

// -- the human side ---------------------------------------------------------
// A landing's HUMAN CARD is the person glyph with its time numeral under it.
// The card is anchored in SCREEN px off its own point, not in world px, so the
// gap from the numeral's near edge to the point reads the same at every zoom
// (CARD_GAP) instead of opening up as the camera pushes in. Everything inside
// the card -- glyph, numeral, the rise between them -- is on the k^0.75 law.
const PERSON_BOX = 78; // SCREEN px at k 1, x k^0.75
const PERSON_FOOT = 471 / 512; // person.png's feet inside its own box
const PERSON_INK = 0.84;
const CARD_GAP = 40; // screen px, numeral edge -> point ink, at EVERY zoom
const CARD_RISE = 8; // screen px at k 1, foot -> the numeral's cap top
/** Which side of its point a card hangs on. P4 is the only one on the right:
 *  it is the one landing with no benchmark name, so that side is free, and on
 *  the left it is run straight through by the steep line of cut 9. */
const CARD_SIDE = [-1, -1, -1, -1, 1];
/** The foot's vertical offset from the point, screen px at k 1. P4 sits lower
 *  so its glyph clears the dashed P4 -> P5 riser leaving the same point. */
const CARD_DY = [-32, -32, -32, -32, 55];

// -- the label system -------------------------------------------------------
// One type family, one tracking, one cap-top anchor. Sizes are SCREEN px at
// k 1 and every one of them is multiplied by k^TYPE_K so the labels follow the
// camera softly instead of riding it. TYPE_K is 0.75 and not 0.45: at 0.45 a
// close-up at k 2.2 grew the numeral only to 63 px -- 17% of the frame width --
// and the point to a 16 px speck, so the tightest shots in the piece read as
// the widest ones cropped. 0.75 puts the numeral at 80 px and the person at
// 140 px at k 2.2 while leaving every k = 1 wide-shot size exactly as it was.
const TYPE_K = 0.75;
const GLYPH_K = 0.75;
const NUM_SIZE = 44;
const NAME_SIZE = 32;
const SUB_SIZE = 26;
const YEAR_SIZE = 30;
const TAG_SIZE = 34;
const TRACK = 0.11; // em
const ASC = 1900 / 2048;
const DESC = 500 / 2048;
const CAP = 1456 / 2048;
/** Distance from an inline box's top to the CAP top, at line-height 1. */
const CAP_TOP = (1 - (ASC + DESC)) / 2 + ASC - CAP; // 0.13086 of the size
const CAP_H = CAP; // cap height as a fraction of the size

/** Roboto Condensed 700 advances, deliberately a hair generous, so the layout
 *  and the audit measure a label with the same ruler. */
const ADV = (ch: string) =>
  ch === " " ? 0.25 : (ch >= "0" && ch <= "9") || ch === "?" ? 0.55 : 0.545;
export const emWidth = (s: string) =>
  [...s].reduce((a, c) => a + ADV(c), 0) + s.length * TRACK;

const NAME_DX = 30;
const NAME_DY = 14; // name cap top, below the point
const SUB_DY = 51; // sub cap top
const TAG_PERP = 56; // the X10 tag's offset from its segment, world px
const LABEL_RISE = 16; // screen px a rising label travels

const WHITE_FULL = 1.0;
const WHITE_SOFT = 0.6;

// -- ink weights, in SCREEN px at k 1, all on the type's own k^0.45 law ------
const LINE_W = 4.5;
const GLYPH_W = 6.0;
const POINT_R = 11;
const PACKET_R = 6.2;
const DASH_ON = 15;
const DASH_OFF = 12;
const MARCH_PX = 0.9; // screen px a dash advances per frame

// ---------------------------------------------------------------------------
// THE CAMERA. One keyed track over the whole global timeline: `camEase` per
// frame inside every segment (never a straight line between two keys, which is
// a corner in the damper's target), cy taken off the EASED k so the framing
// and the zoom settle together, then fieldShared's damper on all three axes.
// Between segments the target holds and the damper coasts in -- that is what a
// "hold" is here, a decaying drift that continues the last velocity.
//
//   c   = the world y that lands on screen 835 (CAM_LIFT), the caption-safe
//         content centre
//   cx  = the world x that lands on screen 540
//
// Every resting k obeys cy >= 1333 - 390/k once the year row exists -- see
// DEVIATIONS -- and the audit walks all 1587 frames to prove it.
// ---------------------------------------------------------------------------
type Seg = {
  f0: number;
  f1: number;
  k0: number;
  k1: number;
  x0: number;
  x1: number;
  c0: number;
  c1: number;
  warp: number;
};

// THE SIZE LAW SETS THE RESTING ZOOMS. Under k^0.75 every label is wider at
// every close-up than it was under k^0.45, and two of them run the frame: P0's
// "5 SEC" card on the left (CARD_GAP + (POINT_R + 2 x NUM_HALF[0]) k^0.75 out
// from its point) and "USA OLYMPIAD QUALIFIER" on the right (359 k^0.75 wide).
// From the frame the sub-line exists, holding both inside 1080 needs
//   375 k + 500 k^0.75 <= 1040,  i.e.  k <= 1.42,
// so cuts 4, 6 and 8 rest at 1.40-1.35 rather than 1.66-1.45 and the piece
// opens out as the chart fills up. The tight shots are cuts 1-3, where only
// one or two cards exist -- and those now rest at 2.36-2.46, deeper than
// before, because the same law makes the type carry them.
export const CAM_SEGS: Seg[] = [
  // cut 1 -- a creep with travel in it (k 2.20 -> 2.36 plus 20 world px of pan
  // is ~2 screen px/frame, where 2.20 -> 2.30 read as a parked camera for 40
  // frames), then the one long glide down onto P0, off the mark at f146.
  { f0: 113, f1: 146, k0: 2.2, k1: 2.42, x0: 566, x1: 562, c0: 796, c1: 855, warp: 1.5 },
  { f0: 146, f1: 200, k0: 2.42, k1: 2.2, x0: 562, x1: 258, c0: 855, c1: 1150, warp: 1.15 },
  // cut 2 -- ONE creep through the whole hold, and a strong one: k 2.20 -> 2.46
  // with 72 world px of pan is what carries f208-336, where the only other
  // motion is the axis tip and three entrances. cx 330 at 2.46 is the middle of
  // the window that holds "5 SEC" inside the left edge and "GRADE SCHOOL MATH"
  // inside the right one (304..900).
  { f0: 200, f1: 252, k0: 2.2, k1: 2.29, x0: 258, x1: 282, c0: 1150, c1: 1180, warp: 0.5 },
  { f0: 252, f1: 296, k0: 2.29, k1: 2.38, x0: 282, x1: 309, c0: 1180, c1: 1211, warp: 0.6 },
  { f0: 296, f1: 336, k0: 2.38, k1: 2.46, x0: 309, x1: 335, c0: 1211, c1: 1240, warp: 0.6 },
  // cut 3 -- the glide with the growing head, then a pull-back for the human.
  // cx drifts LEFT while the head travels right: 310 is the window where
  // "5 SEC" is fully in AND both "2025" (still standing by P3) and cut 1's
  // "IMO GOLD" are fully out past the right edge.
  { f0: 336, f1: 386, k0: 2.46, k1: 2.15, x0: 335, x1: 310, c0: 1240, c1: 1140, warp: 0.9 },
  { f0: 386, f1: 490, k0: 2.15, k1: 1.98, x0: 310, x1: 300, c0: 1140, c1: 1150, warp: 0.5 },
  // cut 4 -- the glide to P2, then THE PULL-BACK THAT ADMITS THE SUB-LINE, on
  // its word. "USA OLYMPIAD QUALIFIER" is 359 k^0.75 screen px wide and P0's
  // card hangs 40 + (11 + 131) k^0.75 out the other way, so from f558 the two
  // of them alone need 375 k + 500 k^0.75 <= 1040: k <= 1.42. Cut 4 therefore
  // rests at 1.36 rather than 1.66, and the cut's move is the opening, not a
  // push. The two lobes land on "AIME" and on "qualifier / USA".
  { f0: 490, f1: 520, k0: 1.98, k1: 1.79, x0: 300, x1: 500, c0: 1150, c1: 1100, warp: 0.9 },
  { f0: 520, f1: 566, k0: 1.79, k1: 1.4, x0: 500, x1: 486, c0: 1100, c1: 1098, warp: 0.95 },
  { f0: 566, f1: 606, k0: 1.4, k1: 1.388, x0: 486, x1: 487, c0: 1098, c1: 1086, warp: 1.1 },
  { f0: 606, f1: 672, k0: 1.388, k1: 1.36, x0: 487, x1: 491, c0: 1086, c1: 1064, warp: 0.45 },
  // cut 5 -- THE PULL-BACK, started early on "10 minutes" so cut 4 is already
  // moving into cut 5, then a slow open through the tags and the tick
  { f0: 672, f1: 752, k0: 1.36, k1: 1.14, x0: 491, x1: 478, c0: 1064, c1: 1005, warp: 0.72 },
  { f0: 752, f1: 856, k0: 1.14, k1: 1.1, x0: 478, x1: 480, c0: 1005, c1: 1002, warp: 0.5 },
  // cut 6 -- the push onto P3. The pan is nearly nil because cx is pinned by
  // "5 SEC" on one side and the sub-line on the other; the move is the zoom
  // and the TILT UP off the year row onto the new landing -- 82 world px of c,
  // 111 screen px, which is what carries the cut.
  { f0: 856, f1: 928, k0: 1.1, k1: 1.36, x0: 480, x1: 486, c0: 1002, c1: 1078, warp: 0.8 },
  { f0: 928, f1: 1000, k0: 1.36, k1: 1.365, x0: 486, x1: 485, c0: 1078, c1: 1080, warp: 0.5 },
  // the tail of cut 6 already leans up-right, so cut 7's glide continues it
  { f0: 1000, f1: 1060, k0: 1.365, k1: 1.34, x0: 485, x1: 495, c0: 1080, c1: 1068, warp: 0.5 },
  // cut 7 -- up the extension, then widen and find the level, then the return
  { f0: 1060, f1: 1112, k0: 1.34, k1: 1.2, x0: 495, x1: 690, c0: 1068, c1: 985, warp: 0.85 },
  { f0: 1112, f1: 1180, k0: 1.2, k1: 1.0, x0: 690, x1: 545, c0: 985, c1: 890, warp: 0.8 },
  { f0: 1180, f1: 1240, k0: 1.0, k1: 1.02, x0: 545, x1: 551, c0: 890, c1: 893, warp: 0.5 },
  { f0: 1240, f1: 1296, k0: 1.02, k1: 1.33, x0: 551, x1: 486, c0: 893, c1: 1075, warp: 0.8 },
  // cut 8 -- the creep through the projection, then out to the wide shot. c is
  // 1075 and not 975 so the level, the person on it and the "?" hanging under
  // them are fully OFF the top edge while the camera is down on P3/P4: at 975
  // the person's head was sliced, at 1055 the "?" still was. The pull-back at
  // f1404 is what brings the level back -- which is the beat. cx 486 is the
  // middle of the window (469..504) that holds "5 SEC" in on the left and P4's
  // card, which hangs to the RIGHT of its point, in on the other.
  { f0: 1296, f1: 1404, k0: 1.33, k1: 1.32, x0: 486, x1: 488, c0: 1075, c1: 1076, warp: 0.5 },
  { f0: 1404, f1: 1444, k0: 1.32, k1: 1.0, x0: 488, x1: 548, c0: 1076, c1: 900, warp: 0.72 },
  // cut 9 -- one long wide drift, then ONE GENTLE DRIFT HOME. The old push to
  // k 1.17 / cx 710 sliced "5 SEC" to a stray "C" on the last frame and left
  // the chart hanging off the left edge; the piece ends on the whole chart
  // instead. k 1.02 / cx 553 / c 922 is the framing where the outermost ink --
  // "5 SEC"'s left edge and the axis tip at world 1016 -- sits ~70 screen px
  // inside each edge, the year row lands at 1254 (clear of the caption band),
  // and the hit and its orange flag read in the frame's upper third. The move
  // lands at f1676, sixteen frames after the flag turns, and the damper's
  // approach carries the last 24 frames without ever cropping.
  { f0: 1444, f1: 1536, k0: 1.0, k1: 0.99, x0: 548, x1: 550, c0: 900, c1: 906, warp: 0.55 },
  { f0: 1536, f1: 1624, k0: 0.99, k1: 0.975, x0: 550, x1: 551, c0: 906, c1: 912, warp: 0.55 },
  { f0: 1624, f1: 1676, k0: 0.975, k1: 1.02, x0: 551, x1: 553, c0: 912, c1: 922, warp: 0.6 },
];

const CAM_N = END + 60;

/** The camera's TARGET at every integer frame: one key per frame on the eased
 *  curve, cy off the eased k. */
const TARGET = (() => {
  const K = new Float64Array(CAM_N + 1);
  const CX = new Float64Array(CAM_N + 1);
  const CY = new Float64Array(CAM_N + 1);
  let si = 0;
  for (let f = 0; f <= CAM_N; f++) {
    while (si < CAM_SEGS.length - 1 && f > CAM_SEGS[si].f1) si++;
    const s = CAM_SEGS[si];
    const u = f <= s.f0 ? 0 : f >= s.f1 ? 1 : camEase((f - s.f0) / (s.f1 - s.f0), s.warp);
    const k = s.k0 + (s.k1 - s.k0) * u;
    const c = s.c0 + (s.c1 - s.c0) * u;
    K[f] = k;
    CX[f] = s.x0 + (s.x1 - s.x0) * u;
    CY[f] = c + CAM_LIFT / k;
  }
  return { K, CX, CY };
})();

export type Cam = { k: number; cx: number; cy: number };

/** The damped camera at every frame, one forward pass. */
const CAM: Cam[] = (() => {
  const out: Cam[] = [];
  let k = TARGET.K[0];
  let cx = TARGET.CX[0];
  let cy = TARGET.CY[0];
  let vk = 0;
  let vx = 0;
  let vy = 0;
  out.push({ k, cx, cy });
  for (let f = 1; f <= CAM_N; f++) {
    vk += (TARGET.K[f] - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vx += (TARGET.CX[f] - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (TARGET.CY[f] - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    out.push({ k, cx, cy });
  }
  return out;
})();

export const camAt = (f: number): Cam => CAM[Math.max(0, Math.min(CAM_N, Math.round(f)))];

/** The camera with the set's hand on it. */
export const camHand = (f: number) => {
  const c = camAt(f);
  const s = sway(f);
  return { k: c.k, cx: c.cx + s.dx, cy: c.cy + s.dy };
};

export const screenAt = (f: number, wx: number, wy: number): [number, number] => {
  const c = camHand(f);
  return [FRAME_W / 2 + (wx - c.cx) * c.k, FRAME_H / 2 + (wy - c.cy) * c.k];
};

const CAM_REST = camAt(START);

// ---------------------------------------------------------------------------
// THE SCHEDULE. Every reveal is a pure function of the global frame.
// ---------------------------------------------------------------------------
const ramp = (g: number, f0: number, f1: number) =>
  f1 <= f0 ? (g >= f1 ? 1 : 0) : smoothstep(clamp01((g - f0) / (f1 - f0)));
/** A head-led draw: cruise, then decelerate into the landing. */
const draw = (g: number, f0: number, f1: number) => arriveEase(clamp01((g - f0) / (f1 - f0)));
/** A label that rises into place and lands ON `land`. 20 frames, not 16: the
 *  entrance is the only motion in some of the holds and it wants to be seen. */
const enter = (g: number, land: number, dur = 20) => ramp(g, land - dur, land);
/** A numeral: no fade, no crossfade, one hard tick. */
const tick = (g: number, f: number) => (g >= f ? 1 : 0);
/** One small settle: 0 -> a bump -> 0. */
const settle = (g: number, f0: number, dur: number) => {
  const u = clamp01((g - f0) / dur);
  if (u <= 0 || u >= 1) return 0;
  return Math.sin(Math.PI * u) * (1 - u);
};

// -- the solid line's head, as a continuous index along P0..P3 ---------------
const HEAD_SEGS = [
  { f0: 336, f1: 383, i: 0 },
  { f0: 490, f1: 512, i: 1 },
  { f0: 885, f1: 919, i: 2 },
];
export const headU = (g: number) => {
  let u = 0;
  for (const s of HEAD_SEGS) {
    if (g <= s.f0) break;
    u = s.i + draw(g, s.f0, s.f1);
  }
  return u;
};
/** Arc length of the solid line at a frame, world px. */
const lineLen = (g: number) => headU(g) * LEN;
const lineAt = (u: number) => {
  const i = Math.min(2, Math.floor(u));
  const t = clamp01(u - i);
  return { x: P[i].x + (P[i + 1].x - P[i].x) * t, y: P[i].y + (P[i + 1].y - P[i].y) * t };
};

// -- the dashed projection --------------------------------------------------
const STUB_U = 100 / LEN; // how far the cut-7 stub reaches, as a fraction
const projA = (g: number) =>
  g < 1376
    ? STUB_U * draw(g, 1059, 1085)
    : STUB_U + (1 - STUB_U) * draw(g, 1376, 1400);
const projB = (g: number) => draw(g, 1556, 1577);
const projC = (g: number) => draw(g, 1580, 1601);

// -- the steep line, cut 9 --------------------------------------------------
const HIT = { x: NX(4), y: LEVEL_Y };
const steepU = (g: number) => draw(g, 1622, 1655);

// -- the axis's reveal ------------------------------------------------------
// The first key starts at 194 and not 205: cut 2 opens at 192 and P0 did not
// land until 220, so as a standalone the cut began on 13 frames of bare grid.
// The axis now draws outward from P0 as the camera is still arriving on it.
// THE AXIS HAS A LIVING TIP. From the frame it exists the head never stops
// extending rightward: one monotone cubic (Fritsch-Carlson, so it cannot
// overshoot and cannot stall) through the frame each year is reached, at
// year_x + 48 -- far enough past the tick that the numeral is never hanging
// off the end, close enough that the tip is visibly arriving ON the year as
// that year lands. Between the keys it creeps at 0.2-0.8 world px/frame, which
// is the only thing moving through some of the holds, and it runs for the
// whole piece wherever the head is in frame.
const AXIS_TIP_KEYS: [number, number][] = [
  [194, 270],
  [230, 318],
  [384, 433], // "and then the next year" -- 2023 at 385
  [714, 548], // "a year later" -- 2024 at 500
  [766, 663], // 2025 takes its place on the axis, at 615
  [1396, 778], // 2026 ticks white at 730
  [1577, 893], // 2027 at 845
  [1601, 1008], // 2028 at 960
  [1740, 1018],
];
/** A monotone cubic Hermite through (x, y) keys: C1, never overshoots, and
 *  never has a zero-velocity knot, so the tip always keeps moving. */
const monoSpline = (keys: [number, number][]) => {
  const n = keys.length;
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(keys[i + 1][0] - keys[i][0]);
    d.push((keys[i + 1][1] - keys[i][1]) / h[i]);
  }
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  return (x: number) => {
    if (x <= keys[0][0]) return keys[0][1];
    if (x >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0;
    while (i < n - 2 && x > keys[i + 1][0]) i++;
    const t = (x - keys[i][0]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      keys[i][1] * (2 * t3 - 3 * t2 + 1) +
      h[i] * m[i] * (t3 - 2 * t2 + t) +
      keys[i + 1][1] * (-2 * t3 + 3 * t2) +
      h[i] * m[i + 1] * (t3 - t2)
    );
  };
};
const axisRight = monoSpline(AXIS_TIP_KEYS);
const axisLeft = (g: number) => 270 + (AXIS_LEFT - 270) * draw(g, 194, 230);

// -- the level line's breath, cut 7 -----------------------------------------
const levelY = (g: number) => {
  if (g < 1206 || g > 1300) return LEVEL_Y;
  const env = Math.min(ramp(g, 1206, 1224), 1 - ramp(g, 1256, 1296));
  return LEVEL_Y + 18 * env * Math.sin((2 * Math.PI * (g - 1210)) / 40);
};

// -- the landings' own beats ------------------------------------------------
const POINT_IN = [214, 383, 512, 131, 1400, 1577, 1601];
const NAME_TXT = ["GSM8K", "MATH", "AIME", "IMO GOLD"];
const NAME_IN = [220, 391, 520, 140];
const SUB_TXT: (string | null)[] = ["GRADE SCHOOL MATH", null, "USA OLYMPIAD QUALIFIER", null];
const SUB_IN = [318, 0, 558, 0];
const PERSON_IN = [250, 440, 640, 945, 1400];
const NUM_TXT = ["5 SEC", "1 MIN", "10 MIN", "100 MIN", "15 H"];
const NUM_IN = [263, 477, 664, 956, 1402];

// -- the human card's geometry ----------------------------------------------
/** Half the numeral's width in SCREEN px at k 1. The card is placed off this,
 *  so a wide numeral ("100 MIN") hangs further out than a narrow one ("15 H")
 *  and every numeral ends the same CARD_GAP from its point. */
const NUM_HALF = NUM_TXT.map((t) => (emWidth(t) * NUM_SIZE) / 2);
/** The card's anchor -- the person's foot -- as a SCREEN offset from its own
 *  point. The near edge of the numeral lands CARD_GAP + the point's own radius
 *  away at every zoom, which is the whole reason this is not a world offset. */
export const cardOffset = (i: number, kp: number) => ({
  dx: CARD_SIDE[i] * (CARD_GAP + (POINT_R + NUM_HALF[i]) * kp),
  dy: CARD_DY[i] * kp,
});

// -- the ladder on the human side -------------------------------------------
// THE CURRENT SUBJECT IS FULL WHITE. A landing's card is 1.0 for as long as it
// is the head's landing; it steps down to 0.6 as the line LEAVES it for the
// next one, so the dim is the mechanism's, not a schedule's. Cut 5's white
// tick brings the whole column back to 1.0 bottom-to-top and it stays there.
// Benchmark names and sub-lines are 0.6 throughout.
const HEAD_LEAVE = [336, 490, 885]; // the frame the line leaves landing i
// -- the human tick, cut 5 --------------------------------------------------
const TICK_F0 = 800;
const TICK_F1 = 849;
/** The frames the tick draws level with each card, from its own geometry. */
const HUMAN_LIT_F = [813.6, 830.6, 849];
const humanLevel = (g: number, i: number) => {
  if (i >= 3) return WHITE_FULL; // P3 and P4 land as the current subject
  // P2 is still the head's landing when the tick arrives, so it never dims.
  const gone = i === 2 ? 0 : ramp(g, HEAD_LEAVE[i], HEAD_LEAVE[i] + 12);
  const relit = ramp(g, HUMAN_LIT_F[i] - 5, HUMAN_LIT_F[i] + 4);
  return WHITE_FULL - (WHITE_FULL - WHITE_SOFT) * gone * (1 - relit);
};
/** The tick's path, in world px, read off the cards it is lighting so the two
 *  cannot drift however the camera is zoomed. */
const tickPos = (g: number, k: number, kp: number) => {
  const u = clamp01((g - TICK_F0) / (TICK_F1 - TICK_F0));
  const a = cardOffset(0, kp);
  const b = cardOffset(2, kp);
  const ax = NX(0) + a.dx / k;
  const ay = NY(0) + (a.dy + 130 * kp) / k;
  const bx = NX(2) + b.dx / k;
  const by = NY(2) + b.dy / k;
  return { x: ax + (bx - ax) * u, y: ay + (by - ay) * u, u };
};

// -- the years --------------------------------------------------------------
const YEAR_TXT = ["2022", "2023", "2024", "2025", "2026", "2027", "2028"];
const YEAR_IN = [206, 384, 714, 143, 1396, 1577, 1601];
/** 2025 leaves its point and takes its place on the axis. */
const YEAR25_HOME = { x: NX(3), y: NY(3) - 65 };
const YEAR25_TRAVEL: [number, number] = [744, 766];

// -- the X10 tags -----------------------------------------------------------
const TAG_IN = [754, 770, 902, 1392];
const tagPos = (i: number) => ({
  x: (P[i].x + P[i + 1].x) / 2 + PERPX * TAG_PERP,
  y: (P[i].y + P[i + 1].y) / 2 + PERPY * TAG_PERP,
});

// -- the flag ---------------------------------------------------------------
const FLAG_HOME = NX(6);
const flagX = (g: number) => FLAG_HOME + (HIT.x - FLAG_HOME) * ramp(g, 1652, 1670);
const flagNod = (g: number) => 9 * settle(g, 1601, 22);
/** The frame the steep line has the level: the flag turns ORANGE and the
 *  "?" under the Millennium person hard-ticks away, on the same frame, off the
 *  same constant. The person stays white. */
const Q_OUT = 1660;
// lucide `flag`, verbatim: the pennant and the pole, foot at (4, 22) of 24.
const FLAG_PATHS = [
  "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",
  "M4 22v-7",
];

// -- the bracket, cut 8 -----------------------------------------------------
const bracketU = (g: number) => draw(g, 1448, 1463) * (1 - draw(g, 1548, 1562));

// -- the packets ------------------------------------------------------------
const PACKET_SPEED = 9; // world px/frame, capped against the camera
const PACKET_F0 = 344;
const STEEP_F0 = 1626;
const TAG_PACKET = { born: 738, speed: 11.3 };
const BRIGHT_PACKET = { born: 700, speed: 13 };

/** When a packet leaves P0. The rate is the camera's: one every ~10 frames in
 *  a close-up (k >= 2), where the stream would otherwise strobe, and one every
 *  6 out wide, where 10 renders as loose specks rather than a pour. It is
 *  accumulated frame by frame and only ever APPENDS, so the schedule of any
 *  earlier frame is a prefix of a later one and nothing ever pops. */
const launchesFrom = (f0: number): number[] => {
  const out: number[] = [];
  let acc = 0;
  for (let f = f0; f <= CAM_N; f++) {
    acc += camAt(f).k >= 2 ? 1 / 10 : 1 / 6;
    while (acc >= 1) {
      acc -= 1;
      out.push(f);
    }
  }
  return out;
};

/** Cumulative world distance a packet has covered by frame f, shared so no head
 *  is ever over 45 screen px/frame however tight the camera is. */
const RAD = (() => {
  const out = new Float64Array(CAM_N + 1);
  for (let f = 1; f <= CAM_N; f++) {
    out[f] = out[f - 1] + Math.min(PACKET_SPEED, 45 / camAt(f).k);
  }
  return out;
})();
const radAt = (f: number) => RAD[Math.max(0, Math.min(CAM_N, Math.round(f)))];

const SOLID_LAUNCH = launchesFrom(PACKET_F0);
const STEEP_LAUNCH = launchesFrom(STEEP_F0);

type Pk = { x: number; y: number; r: number; bright: number };

const packetsAt = (g: number): Pk[] => {
  const out: Pk[] = [];
  const L = lineLen(g);
  if (L > 6) {
    for (const born of SOLID_LAUNCH) {
      if (born > g) break;
      const s = radAt(g) - radAt(born);
      if (s <= 0 || s > L) continue;
      const p = lineAt(s / LEN);
      out.push({ x: p.x, y: p.y, r: 1, bright: 0 });
    }
    // the tag packet: one run up the line that pops the first two X10 tags
    const st = (g - TAG_PACKET.born) * TAG_PACKET.speed;
    if (st > 0 && st < 2 * LEN + 70) {
      const u = Math.min(2, st / LEN);
      const p = lineAt(u);
      out.push({ x: p.x, y: p.y, r: 1 - clamp01((st - 2 * LEN) / 70), bright: 1 });
    }
    // "a year later": one brighter packet on the P1 -> P2 segment
    const sb = (g - BRIGHT_PACKET.born) * BRIGHT_PACKET.speed;
    if (sb > 0 && sb < LEN + 60) {
      const u = 1 + Math.min(1, sb / LEN);
      const p = lineAt(u);
      out.push({ x: p.x, y: p.y, r: 1 - clamp01((sb - LEN) / 60), bright: 1 });
    }
  }
  // the steep segment, cut 9
  const su = steepU(g);
  if (su > 0.02) {
    const sl = Math.hypot(HIT.x - P[3].x, HIT.y - P[3].y) * su;
    for (const born of STEEP_LAUNCH) {
      if (born > g) break;
      const s = radAt(g) - radAt(born);
      if (s <= 0 || s > sl) continue;
      const t = s / Math.hypot(HIT.x - P[3].x, HIT.y - P[3].y);
      out.push({
        x: P[3].x + (HIT.x - P[3].x) * t,
        y: P[3].y + (HIT.y - P[3].y) * t,
        r: 1,
        bright: 0,
      });
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE TYPE. One component for every label in the piece: cap-top anchored,
// tracked, uppercase, sized base x k^0.45, and never crossfaded.
// ---------------------------------------------------------------------------
const Label: React.FC<{
  text: string;
  sx: number;
  capY: number;
  size: number;
  colour: string;
  opacity: number;
  align: "left" | "centre";
  rise?: number;
  shadow: string;
  scale?: number;
}> = ({ text, sx, capY, size, colour, opacity, align, rise = 0, shadow, scale = 1 }) => {
  if (opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: sx,
        top: capY - CAP_TOP * size,
        transform:
          `translateX(${align === "centre" ? "-50%" : "0"}) translateY(${rise.toFixed(2)}px)` +
          (scale === 1 ? "" : ` scale(${scale.toFixed(4)})`),
        transformOrigin: align === "centre" ? "50% 50%" : "0% 50%",
        whiteSpace: "nowrap",
        fontFamily: roboto.fontFamily,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        color: colour,
        opacity,
        filter: shadow,
      }}
    >
      <span style={{ letterSpacing: `${TRACK}em`, marginRight: `${-TRACK}em` }}>{text}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------

const NoamTrendLine: React.FC<Props> = ({
  startFrame,
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
  personSrc,
}) => {
  const g = startFrame + useCurrentFrame();

  const cam = camAt(g);
  const drift = sway(g);
  const k = cam.k;
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const { tx, ty } = worldTransform(cx, cy, k);

  const kp = Math.pow(k, TYPE_K);
  const kq = Math.pow(k, GLYPH_K);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);
  const iconS = iconShadow(1, iconShadowY, iconShadowBlur, iconShadowOpacity);

  /** world -> screen, for the layer that scales softly instead of riding k. */
  const S = (wx: number, wy: number): [number, number] => [
    FRAME_W / 2 + (wx - cx) * k,
    FRAME_H / 2 + (wy - cy) * k,
  ];
  /** A world length that should read as `px` SCREEN px, expressed in the world
   *  SVG's own units (it lives under scale(k)). */
  const w = (px: number) => (px * kp) / k;
  const stroke = w(LINE_W);
  const pointR = w(POINT_R);
  const breathe = 1 + 0.015 * Math.sin(g * 0.083);

  // -- state -----------------------------------------------------------------
  const hu = headU(g);
  const ly = levelY(g);
  const aL = axisLeft(g);
  const aR = axisRight(g);
  const axisOn = ramp(g, 194, 202);
  const levelOn = draw(g, 1092, 1112);
  const pa = projA(g);
  const pb = projB(g);
  const pc = projC(g);
  const su = steepU(g);
  const brU = bracketU(g);
  const abandon = ramp(g, 1658, 1672); // the projection lets go
  const projCol = abandon > 0 ? (abandon >= 1 ? accentDeep : accent) : accent;
  const tickP = tickPos(g, k, kp);
  const tickAlive = g >= TICK_F0 && g <= TICK_F1 + 2 ? 1 - clamp01((g - 844) / 7) : 0;

  const dash = `${w(DASH_ON)} ${w(DASH_OFF)}`;
  const march = (f0: number) => (g <= f0 ? 0 : -w((g - f0) * MARCH_PX));

  // -- the solid trend line, as a polyline -----------------------------------
  const solid: { x: number; y: number }[] = [];
  if (g >= 336) {
    const n = Math.floor(hu);
    for (let i = 0; i <= n; i++) solid.push(P[i]);
    if (hu > n) solid.push(lineAt(hu));
  }
  const solidD = solid.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

  const packets = packetsAt(g);

  // -- the projection's three dashed segments --------------------------------
  const projSegs: { a: { x: number; y: number }; b: { x: number; y: number }; u: number; f0: number }[] =
    [
      { a: P[3], b: P[4], u: pa, f0: 1400 },
      { a: P[4], b: P[5], u: pb, f0: 1577 },
      { a: P[5], b: P[6], u: pc, f0: 1601 },
    ];

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={g}
        cy={cy}
        cyRest={CAM_REST.cy}
        cx={cx}
        cxRest={CAM_REST.cx}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        {/* ---- the world, under the camera ---------------------------------- */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the year axis */}
            {axisOn > 0 ? (
              <g style={{ filter: icon }}>
                <line
                  x1={aL}
                  y1={AXIS_Y}
                  x2={aR}
                  y2={AXIS_Y}
                  stroke={ink}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  opacity={WHITE_SOFT}
                />
              </g>
            ) : null}

            {/* the Millennium level: dashed, and marching once it is drawn */}
            {levelOn > 0 ? (
              <g style={{ filter: icon }}>
                <line
                  x1={LEVEL_X0}
                  y1={ly}
                  x2={LEVEL_X0 + (LEVEL_X1 - LEVEL_X0) * levelOn}
                  y2={ly}
                  stroke={ink}
                  strokeWidth={stroke}
                  strokeLinecap="butt"
                  strokeDasharray={dash}
                  strokeDashoffset={march(1112)}
                  opacity={WHITE_SOFT}
                />
              </g>
            ) : null}

            {/* the measuring bracket: P4 straight up to the level */}
            {brU > 0.001 ? (
              <g style={{ filter: icon }} opacity={WHITE_FULL}>
                <line
                  x1={HIT.x}
                  y1={P[4].y}
                  x2={HIT.x}
                  y2={P[4].y + (ly - P[4].y) * brU}
                  stroke={ink}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                />
                {/* one cap, at the top. A cap at the foot as well drew a cross
                    through P4's hollow ring. */}
                {brU > 0.97 ? (
                  <line
                    x1={HIT.x - w(16)}
                    y1={ly}
                    x2={HIT.x + w(16)}
                    y2={ly}
                    stroke={ink}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                  />
                ) : null}
              </g>
            ) : null}

            {/* the dashed projection */}
            <g style={{ filter: icon }}>
              {projSegs.map((s, i) =>
                s.u > 0.001 ? (
                  <line
                    key={`pj${i}`}
                    x1={s.a.x}
                    y1={s.a.y}
                    x2={s.a.x + (s.b.x - s.a.x) * s.u}
                    y2={s.a.y + (s.b.y - s.a.y) * s.u}
                    stroke={projCol}
                    strokeWidth={stroke}
                    strokeLinecap="butt"
                    strokeDasharray={dash}
                    strokeDashoffset={march(s.f0)}
                  />
                ) : null,
              )}
            </g>

            {/* the solid line, and the steep one that beats it */}
            <g style={{ filter: icon }}>
              {solid.length > 1 ? (
                <path
                  d={solidD}
                  fill="none"
                  stroke={accent}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {su > 0.001 ? (
                <line
                  x1={P[3].x}
                  y1={P[3].y}
                  x2={P[3].x + (HIT.x - P[3].x) * su}
                  y2={P[3].y + (HIT.y - P[3].y) * su}
                  stroke={accent}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                />
              ) : null}
            </g>

            {/* the packets: the pour of what the models can already do */}
            <g style={{ filter: icon }}>
              {packets.map((p, i) => (
                <circle
                  key={`pk${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={w(PACKET_R) * p.r * (p.bright ? 1.35 : 1)}
                  fill={accent}
                />
              ))}
            </g>

            {/* the points. P0..P3 are solid orange; P4..P6 are hollow rings,
                projected and not achieved. */}
            <g style={{ filter: icon }}>
              {P.map((p, i) => {
                const inF = POINT_IN[i];
                if (g < inF - 12) return null;
                const e = ramp(g, inF - 12, inF);
                const bump = i === 3 ? 1 + 0.09 * settle(g, 919, 14) : 1;
                const r = pointR * (0.2 + 0.8 * e) * breathe * bump;
                if (i < 4) {
                  return <circle key={`p${i}`} cx={p.x} cy={p.y} r={r} fill={accent} />;
                }
                return (
                  <circle
                    key={`p${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={r}
                    fill="none"
                    stroke={projCol}
                    strokeWidth={stroke}
                  />
                );
              })}
            </g>

            {/* the white tick running up the human side */}
            {tickAlive > 0.001 ? (
              <g style={{ filter: icon }}>
                <circle cx={tickP.x} cy={tickP.y} r={w(7) * tickAlive} fill={ink} />
              </g>
            ) : null}
          </svg>
        </div>

        {/* ---- the soft layer: type and glyphs, base x k^0.45 -------------- */}
        {P.map((p, i) => {
          if (i > 4) return null;
          const lit = humanLevel(g, i);
          const e = enter(g, PERSON_IN[i]);
          if (e <= 0.001) return null;
          const box = PERSON_BOX * kq;
          const off = cardOffset(i, kp);
          const [sx, sy] = S(p.x, p.y);
          const fx = sx + off.dx;
          const fy = sy + off.dy;
          const pulse = i === 3 ? 1 + 0.08 * settle(g, 1356, 16) : 1;
          const numCap = fy + box * (1 - PERSON_FOOT) + CARD_RISE * kp;
          return (
            <div key={`h${i}`}>
              <Img
                src={staticFile(personSrc)}
                style={{
                  position: "absolute",
                  left: fx - box / 2,
                  top: fy - box * PERSON_FOOT,
                  width: box,
                  height: box,
                  objectFit: "contain",
                  filter: `brightness(0) invert(1) ${iconS}`,
                  opacity: lit * e,
                  transform: `translateY(${((1 - e) * LABEL_RISE).toFixed(2)}px)`,
                }}
              />
              <Label
                text={NUM_TXT[i]}
                sx={fx}
                capY={numCap}
                size={NUM_SIZE * kp}
                colour={ink}
                opacity={lit * tick(g, NUM_IN[i])}
                align="centre"
                shadow={iconS}
                scale={pulse}
              />
            </div>
          );
        })}

        {/* the benchmark names and their one optional sub-line */}
        {NAME_TXT.map((t, i) => {
          const e = enter(g, NAME_IN[i]);
          if (e <= 0.001) return null;
          const [nx, ny] = S(P[i].x + NAME_DX, P[i].y + NAME_DY);
          const sub = SUB_TXT[i];
          const se = sub ? enter(g, SUB_IN[i]) : 0;
          const [, sy] = S(P[i].x, P[i].y + SUB_DY);
          return (
            <div key={`n${i}`}>
              <Label
                text={t}
                sx={nx}
                capY={ny}
                size={NAME_SIZE * kp}
                colour={ink}
                opacity={WHITE_SOFT * e}
                align="left"
                rise={(1 - e) * LABEL_RISE}
                shadow={iconS}
              />
              {sub && se > 0.001 ? (
                <Label
                  text={sub}
                  sx={nx}
                  capY={sy}
                  size={SUB_SIZE * kp}
                  colour={ink}
                  opacity={WHITE_SOFT * se}
                  align="left"
                  rise={(1 - se) * LABEL_RISE}
                  shadow={iconS}
                />
              ) : null}
            </div>
          );
        })}

        {/* the years. Orange is a year the models have reached. */}
        {YEAR_TXT.map((t, i) => {
          const on = tick(g, YEAR_IN[i]);
          if (!on) return null;
          let wx = NX(i);
          let wy = YEAR_CAP;
          let col = accent;
          let op = WHITE_FULL;
          if (i === 3) {
            const u = ramp(g, YEAR25_TRAVEL[0], YEAR25_TRAVEL[1]);
            wx = YEAR25_HOME.x + (NX(3) - YEAR25_HOME.x) * u;
            wy = YEAR25_HOME.y + (YEAR_CAP - YEAR25_HOME.y) * u;
          } else if (i === 4) {
            const turn = ramp(g, 1658, 1666);
            col = turn > 0.5 ? accent : ink;
            op = turn > 0.5 ? WHITE_FULL : WHITE_SOFT;
          } else if (i > 4) {
            col = ink;
            op = WHITE_SOFT;
          }
          const [yx, yy] = S(wx, wy);
          const shake = i === 4 ? 7 * settle(g, 1548, 16) * Math.sin((g - 1548) * 1.1) : 0;
          return (
            <Label
              key={`y${i}`}
              text={t}
              sx={yx + shake}
              capY={yy}
              size={YEAR_SIZE * kp}
              colour={col}
              opacity={op}
              align="centre"
              shadow={iconS}
            />
          );
        })}

        {/* the X10 tags: the law, stated once per riser */}
        {TAG_IN.map((f, i) => {
          const e = ramp(g, f - 6, f);
          if (e <= 0.001) return null;
          const t = tagPos(i);
          const [gx, gy] = S(t.x, t.y);
          const col = i === 3 && abandon >= 0.5 ? accentDeep : accent;
          return (
            <Label
              key={`t${i}`}
              text="X10"
              sx={gx}
              capY={gy - (TAG_SIZE * kp * CAP_H) / 2}
              size={TAG_SIZE * kp}
              colour={col}
              opacity={1}
              align="centre"
              shadow={iconS}
              scale={0.7 + 0.3 * e}
            />
          );
        })}

        {/* the Millennium level's label, its person, and its unknown time */}
        {(() => {
          const e = enter(g, 1186);
          const pe = enter(g, 1130);
          const box = PERSON_BOX * kq;
          const [lx, lyy] = S(LEVEL_LABEL_X, ly - 120);
          const [px, py] = S(LEVEL_PERSON_X, ly);
          const fe = enter(g, 1188, 14);
          const fbox = PERSON_BOX * kq;
          const [fx, fy] = S(flagX(g), ly);
          const nod = flagNod(g);
          const flagCol = tick(g, Q_OUT) ? accent : ink;
          return (
            <div>
              {e > 0.001 ? (
                <Label
                  text="MILLENNIUM PRIZE"
                  sx={lx}
                  capY={lyy}
                  size={NAME_SIZE * kp}
                  colour={ink}
                  opacity={WHITE_SOFT * e}
                  align="left"
                  rise={(1 - e) * LABEL_RISE}
                  shadow={iconS}
                />
              ) : null}
              {pe > 0.001 ? (
                <Img
                  src={staticFile(personSrc)}
                  style={{
                    position: "absolute",
                    left: px - box / 2,
                    top: py - box * PERSON_FOOT,
                    width: box,
                    height: box,
                    objectFit: "contain",
                    filter: `brightness(0) invert(1) ${iconS}`,
                    opacity: WHITE_FULL * pe,
                    transform: `translateY(${((1 - pe) * LABEL_RISE).toFixed(2)}px)`,
                  }}
                />
              ) : null}
              {/* The question is answered the frame the flag turns orange:
                  the "?" hard-ticks AWAY. The person stays white. */}
              <Label
                text="?"
                sx={px}
                capY={py + box * (1 - PERSON_FOOT) + CARD_RISE * kp}
                size={NUM_SIZE * kp}
                colour={ink}
                opacity={tick(g, 1168) * (1 - tick(g, Q_OUT))}
                align="centre"
                shadow={iconS}
              />
              {fe > 0.001 ? (
                <div
                  style={{
                    position: "absolute",
                    left: fx - (fbox * 4) / 24,
                    top: fy - (fbox * 22) / 24,
                    width: fbox,
                    height: fbox,
                    opacity: fe,
                    transformOrigin: `${((fbox * 4) / 24).toFixed(2)}px ${((fbox * 22) / 24).toFixed(2)}px`,
                    transform: `translateY(${((1 - fe) * LABEL_RISE).toFixed(2)}px) rotate(${nod.toFixed(2)}deg)`,
                    filter: iconS,
                  }}
                >
                  <svg width={fbox} height={fbox} viewBox="0 0 24 24" style={{ overflow: "visible" }}>
                    {FLAG_PATHS.map((d, i) => (
                      <path
                        key={`f${i}`}
                        d={d}
                        fill="none"
                        stroke={flagCol}
                        strokeWidth={(GLYPH_W * kp * 24) / fbox}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                  </svg>
                </div>
              ) : null}
            </div>
          );
        })()}
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default NoamTrendLine;

// ---------------------------------------------------------------------------
// Handles for the audit: the camera, the layout, and the reveal schedule, so
// the checks run on the same arithmetic the frames do.
// ---------------------------------------------------------------------------
export const AUDIT = {
  P,
  LEVEL_Y,
  AXIS_Y,
  YEAR_CAP,
  LEN,
  camAt,
  camHand,
  screenAt,
  headU,
  levelY,
  axisLeft,
  axisRight,
  packetsAt,
  tagPos,
  cardOffset,
  emWidth,
  humanLevel,
  CARD_GAP,
  CARD_RISE,
  CARD_SIDE,
  CARD_DY,
  NUM_HALF,
  POINT_R,
  PERSON_BOX,
  PERSON_FOOT,
  PERSON_INK,
  TYPE_K,
  GLYPH_K,
  NUM_SIZE,
  NAME_SIZE,
  SUB_SIZE,
  YEAR_SIZE,
  TAG_SIZE,
  TRACK,
  CAP_TOP,
  CAP_H,
  NAME_DX,
  NAME_DY,
  SUB_DY,
  NAME_TXT,
  NAME_IN,
  SUB_TXT,
  SUB_IN,
  PERSON_IN,
  NUM_TXT,
  NUM_IN,
  YEAR_TXT,
  YEAR_IN,
  TAG_IN,
  POINT_IN,
  YEAR25_HOME,
  YEAR25_TRAVEL,
  LEVEL_X0,
  LEVEL_X1,
  LEVEL_PERSON_X,
  LEVEL_LABEL_X,
  FLAG_HOME,
  flagX,
  Q_OUT,
  HEAD_LEAVE,
  AXIS_TIP_KEYS,
  CAM_SEGS,
};
