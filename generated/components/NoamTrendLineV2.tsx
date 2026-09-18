import { loadFont } from "@remotion/google-fonts/RobotoCondensed";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
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
// NOAM BROWN, clip `Noam_10x_Math` -- V2.
//
// V1 (`NoamTrendLine.tsx`) is delivered and untouched. The director's note on
// it is the whole brief for this file:
//
//   "I like it, good start. But it feels cluttered. Space everything out a lot
//    more on the timeline, make it more of a horizontal scene, and utilise the
//    camera much more: when you're just following things it can be with the
//    camera; only when we want to show the scale, when he's talking about
//    10x-ing, and towards the end, zoom out more. Make it more appealing to the
//    eye. Also some of the text just pops in from one frame to another: be much
//    more consistent in how text is introduced. I really like it when it slides
//    up as it's fading in; make that the standard."
//
// V2 ROUND 2 -- the director's note on the first V2 preview, which is the brief
// for everything marked "v2r2" below:
//
//   "The follow shots work. The pulled-back shots do not: at k 0.47 the chart is
//    a small shallow diagonal in one corner of a 9:16 frame, numerals sit at the
//    30 px floor, years are specks, the top third and the whole lower half are
//    empty, and the piece ENDS on its smallest, weakest frame. These are the
//    payoff shots; they must be the most satisfying frames in the piece."
//
// Six things changed in that round and nothing else did: the slope went 230 ->
// 360 per year so the chart fills a portrait frame; the scale shot, the "not
// enough" shot and the ending were re-framed and re-solved around it; the ending
// stopped opening and started PUSHING into the hit; the cold open got tighter;
// and the camera was re-timed for the longer diagonals. The follow shots are
// untouched by construction -- every one of them runs at k >= 1.05, where the
// presence gate is bit-for-bit the one they were built with.
//
// Four things change from V1 and nothing else does.
//
//  1. THE WORLD IS FOUR TIMES WIDER AND STEEPER. P_i = (600 + 520 i,
//     2600 - 360 i), i = 0..6 -- 3120 world px across and 2160 up against V1's
//     690 x 230. No shot holds all of it. The bottom year axis and its living
//     tip are GONE: a year now belongs to its own landing and sits in its
//     column.
//     v2r2: the Y step was 230. At 230/520 the diagonal is 24 degrees, so a shot
//     framing four landings is 1560 x 690 world px -- a letterbox inside a
//     1080 x 1920 frame, which is why the wide shots were small and the frame
//     was empty above and below them. At 360/520 it is 35 degrees, 1560 x 1080,
//     and the same shot fills 92% of the width and 57% of the caption-safe band.
//  2. ONE COLUMN GRAMMAR, CENTRED, EVERYWHERE. Every landing is the same
//     centred stack on its point's x -- person / numeral / gap / POINT / gap /
//     year / name / sub -- so the piece reads the same way seven times instead
//     of seven arrangements. Phone-first: one column, nothing beside it.
//  3. ONE ENTRANCE. Everything that is not a line enters by sliding UP 24
//     screen px while fading 0 -> 1 over 12 frames on an ease-out cubic, landing
//     on its word; it leaves by the reverse over 10. There is not one hard tick
//     left in the piece -- years, "x10", "?", sub-lines and the cold open's
//     "2025" all arrive the same way. Colour changes ease over 8 frames, the
//     human ladder over 12, points and rings scale in from 0 over 8.
//  4. THE CAMERA CARRIES IT. Follow framing is k ~1.22 with the current
//     landing's POINT at screen (540, 800) and nothing else in the frame; the
//     camera GLIDES the 632 world px to the next landing, breathing out to
//     k ~0.74-1.05 mid-travel; and it only ever leaves that framing four times
//     -- the cold open (cut 1, k 1.50 -> 1.30), the scale shot (cut 5, k 0.565),
//     the "not enough" shot (cut 8, k 1.15 with a tilt that puts P4 and the
//     level in one frame) and the ending (cut 9, out to k 0.60 and then back
//     IN to 0.70, still moving on the last frame).
//     v2r2: the three wide framings are all re-solved. The scale shot was 0.47,
//     the "not enough" shot 1.00 and the ending 0.48 -> 0.375.
//
// FRAME DERIVATION. Every number in this file is a GLOBAL clip frame,
//   F = round(seconds * 24)
// read off `Noam_10x_Math_c2_p0.5.srt` (word level). The nine cuts are windows
// on ONE timeline: the component renders world state at `startFrame +
// useCurrentFrame()`, so every cut's frame 0 is pixel-identical to the same
// global frame of the full composition by construction. The cut ranges are
// V1's, unchanged, and so are the word landings.
//
//   ImoGoldV2          113..192
//   FiveSecondsV2      192..343
//   OneMinuteV2        343..493
//   TenMinutesV2       493..725
//   TenXEveryYearV2    725..874
//   HundredMinutesV2   874..1053
//   MillenniumPrizeV2  1053..1251
//   FifteenHoursV2     1251..1500
//   FasterThanExpectedV2 1500..1700
//
// ---------------------------------------------------------------------------
// COLOUR, STRICT, unchanged from V1. ORANGE is only ever "what the models can
// do": the points, the solid line, the packets on it, the years they have
// reached, the x10 tags, the dashed projection, and finally the flag. WHITE ink
// at two levels (1.0 and 0.6) is everything human: the person glyphs, the time
// numerals, the benchmark names and sub-lines, the Millennium level, the
// bracket, the flag before it is reached, and a year that is still only
// projected. The one orange dim is a switch to ACCENT_DEEP, never alpha, and
// the only thing that takes it is the abandoned dashed projection at the end.
//
// THE WHITE LADDER IS DRIVEN BY THE HEAD. A landing's human card is 1.0 while
// the line's head stands on it and eases to 0.6 over the 12 frames the head
// takes to leave. Cut 5's white tick eases the whole column back to 1.0 bottom
// to top and it stays there.
//
// ---------------------------------------------------------------------------
// GESTURES -- the word each lands on and the frames it runs. Gestures LEAD
// their word and overlap their neighbour. Nothing in the piece is outside this
// list; every entrance in it is the same 12-frame slide-up.
//
// CUT 1  ImoGold 113-192  "when we got IMO(131) gold(137) in 2025(143)"
//  1. f102-143  open       One landing alone in a dark field: P3's point is
//                          already scaling in when the piece starts (f102-124,
//                          so frame 0 is a point and not bare grid), "IMO GOLD"
//                          slides up onto 131 and "2025" slides up ORANGE onto
//                          143. No person, no numeral -- the human side of this
//                          landing does not exist yet, and the empty column
//                          above the point is the hole the rest of the piece
//                          fills. v2r2: the camera OPENS TIGHT, k 1.50 easing to
//                          1.30 by 143, so the lone point is 22 screen px across
//                          and "IMO GOLD" is 268 px wide -- at 1.14 the frame was
//                          a speck in an empty field. The glide leaves from 1.30.
//  2. f143-219  THE LONG   ONE continuous glide down-left across the whole
//               GLIDE      world to P0, 1572 world px across and 1082 down --
//                          1908 px of travel: it breathes out to k 0.74 to cross
//                          (peak 28 screen px/frame) and closes back to 1.22 as
//                          it lands. It crosses the cut boundary; cut 2 opens
//                          mid-glide, with P0 already in frame.
//
// CUT 2  FiveSeconds 192-343  "models(192) figured out(210) GSM8K(220) ...
//                              human(247) ... five(273) seconds(280) ...
//                              grade school math(318)"
//  3. f180-198 -           P0's POINT scales in as the glide brings it across
//                          the left edge -- the landing arriving, ahead of its
//                          own words.
//  4. f220     "GSM8K"     "GSM8K" slides up under it.
//  5. f228     -           "2022" slides up, orange.
//  6. f250     "human"     P0's person slides up.
//  7. f263     "five"      "5 SEC" slides up under it -- 3 frames behind the
//                          person's landing, the column's stagger.
//  8. f318     "grade      "GRADE SCHOOL MATH" slides up under "GSM8K".
//              school math"
//  9. f216-350 hold        A creep in two lobes, k 1.22 -> 1.38, which is the
//                          only other motion in the longest hold in the piece.
//
// CUT 3  OneMinute 343-493  "the next(354) year ... MATH(383) ... expert(435)
//                            ... a minute(477)"
//  9. f345-383 "next year" THE LINE GROWS out of P0 up the diagonal and the
//                          camera glides with the head, breathing out to k 1.00
//                          mid-travel. P0's card eases to 0.6 as the head goes.
// 11. f385/392 "MATH"      P1's point + "MATH", then "2023" orange.
// 12. f440     "expert     P1's person slides up.
//              human"
// 13. f477     "a minute"  "1 MIN".
// 14. f404-495 hold        A decaying creep, k 1.22 -> 1.27.
//
// CUT 4  TenMinutes 493-725  "AIME(512) ... qualifier(548) USA(562) ...
//                             human(609) good mathematician(639) ... 10(664)
//                             minutes(672) ... able(696) a year later(714)"
// 15. f495-512 "get to"    The line grows P1 -> P2, camera gliding with it.
// 16. f515     "AIME"      P2's point + "AIME".
// 17. f560     "qualifier" "USA OLYMPIAD QUALIFIER" slides up.
//              "USA"
// 18. f612     "human"     P2's person slides up. On "human" and not on "good
//                          mathematician" (639): every other landing puts its
//                          person on the word "human", and it halves the one
//                          stretch in the piece where the top of a column is a
//                          hole. The camera's tilt is keyed to it -- see
//                          DEVIATIONS.
// 19. f664     "10"        "10 MIN".
// 20. f692-714 "a year     A BRIGHTER PACKET runs the P1 -> P2 riser and "2024"
//              later"      slides up orange as it lands.
// 21. f700-756 ->          THE PULL-BACK starts early, on "10 minutes", so cut
//                          4 is already moving into cut 5.
//
// CUT 5  TenXEveryYear 725-874  "every year(728) ... 10x(754) increase(763)
//                                ... task(795) ... length(825) ... human(849)"
// 22. f700-752 "every      THE SCALE SHOT: k 1.31 -> 0.565, landing on f752,
//              year"       framing P0..P3 with 99 px of air each side on the
//                          diagonal and 40 px on the outermost label. Names and
//                          sub-lines leave as k falls through 0.93; the lone IMO
//                          point stands dead on the line's extension.
//                          v2r2: it was 0.47 and it landed at 758. The chart now
//                          spans 881 x 626 screen px instead of 733 x 324, its
//                          centre of mass sits on screen y 800, the numerals are
//                          47 px (floor 40), the persons 85 (floor 70) and the
//                          years and tags 30 (floor 30). At 270 px wide every
//                          one of them still reads.
// 23. f748-766 "10x /      A packet runs up the line from P0; each riser's "X10"
//              increase"   slides up as the packet crosses its midpoint (754,
//                          765).
// 24. f800-849 "length ... A white tick runs up the human side; each card it
//              human"      reaches eases 0.6 -> 1.0 over 12 frames, bottom to
//                          top, and they stay lit.
//
// CUT 6  HundredMinutes 874-1053  "very sensible(879) a year later(904) imo
//                                  gold(919) ... a hundred(956) minutes(960)"
// 25. f858-952 "a year     THE PUSH BACK IN, riding the head: k 0.47 -> 1.22,
//              later"      cx 1382 -> 2160, the camera arriving on P3 with it.
// 26. f885-919 "imo gold"  The line grows P2 -> P3 and MEETS the point that has
//                          been standing since f128; one small settle on
//                          contact; the third "X10" slides up at mid-riser
//                          (f902).
// 27. f945/956 -           P3's person, then "100 MIN" -- the landing's human
//                          side, three quarters of the clip after its point.
// 28. f952-1060 hold       A decaying creep, k 1.22 -> 1.27.
//
// CUT 7  MillenniumPrize 1053-1251  "projecting(1059) outwards(1069) ... how
//                                    long(1092) ... a person(1121) ... to
//                                    solve(1168) ... a Millennium(1188)
//                                    Prize(1194) ... i don't have a good
//                                    sense(1215-1249)"
// 29. f1059-1150 "projecting" THE LEAD RUN: a 900 world px length of marching
//                "outwards"   orange dash leaves P3 up the extension and TRAVELS,
//                             keyed to the camera so it holds the same place in
//                             the frame -- tail just left of centre, head three
//                             quarters across -- for the whole crossing. From
//                             1130 its tail closes on its head, and it is gone on
//                             the frame P6's ring scales in. It is not the
//                             projection; the real dashes draw on 1376.
//                             v2r2: 560 px at k 0.82 was 41% of the frame's
//                             width and the middle third of the cut was a short
//                             dash in a bare grid. 900 at 0.86 reaches from the
//                             lower-left quadrant to the upper-right one.
// 30. f1062-1184 ->         THE TRAVEL up-right along the extension, 1861 world
//                           px, k down to 0.86 to cross and back to 1.22 to
//                           land on P6 at f1184.
// 31. f1118-1130 "how long" THE LEVEL: the white dashed Millennium line slides
//                           up into place across the whole world. It is 4100
//                           world px long -- see DEVIATIONS.
// 32. f1150     -           P6's hollow ring scales in ON the level.
// 33. f1160     "a person"  P6's person slides up.
// 34. f1168     "to solve"  "?" slides up under it, in the numeral's slot.
// 35. f1188     "a          "MILLENNIUM PRIZE" slides up in the name's slot.
//               Millennium"
// 36. f1176-1190 -          The white outline flag scales up on the level 130
//                           world px right of P6.
// 37. f1215-1249 "i don't   The "?" bobs, +-6 screen px, and settles.
//                have a
//                good sense"
// 38. f1220-1316 ->         The return to P3 begins inside cut 7 and lands in
//                           cut 8, one continuous move.
//
// CUT 8  FifteenHours 1251-1500  "trend line(1278) 10x(1293) every year(1301)
//                                 ... from imo gold(1326) ... hour and a
//                                 half(1361) to next year(1379) 15(1402)
//                                 hours(1407) ... not be enough(1444) to
//                                 solve(1463)"
// 39. f1316-1382 "trend line" Back on P3 at k 1.22 with the three X10 tags in
//                             view, creeping.
// 40. f1361      "hour and   "100 MIN" gives one small pulse.
//                a half"
// 41. f1379-1400 "to next    The dashed orange segment P3 -> P4 draws on from
//                year"       the cut-7 stub; the camera follows the dash head;
//                            the fourth "X10" slides up (f1392).
// 42. f1398-1408 "15 hours"  P4's hollow ring scales in, its person slides up
//                            (1399), "15 H" (1402), "2026" WHITE (1408) -- the
//                            models are not there.
// 43. f1424-1454 "should not THE TILT: k 1.10 -> 1.15 and 134 world px of tilt
//                be enough"  up, so P4 and the level 720 world px above it are
//                            in one frame -- the level at screen 126, P4 at 954,
//                            "2026"'s foot at 1117 and the P3 -> P4 tag at 1310.
//                            v2r2: it was k 1.00 over a 460 px gap. The gap is
//                            720 world px now, and 1.15 is the largest zoom that
//                            still holds the whole thing inside the band.
// 44. f1448-1463 "to solve"  A white bracket grows from P4's height straight up
//                            to the level: 828 screen px, by a distance the
//                            biggest single measure in the piece. No text.
//
// CUT 9  FasterThanExpected 1500-1700  "2026(1548) probably not(1571) in
//                                       2027(1577) maybe(1589) in 2028(1601)
//                                       so it did(1622) ... faster(1659) than i
//                                       expected(1677)"
// 45. f1534-1548 "2026"      The bracket retracts and "2026" gives one small
//                            negative shake.
// 46. f1556-1581 "in 2027"   The dashes continue P4 -> P5, the camera following
//                            the head; P5's ring, then "2027" white.
// 47. f1580-1605 "in 2028"   P5 -> P6, where the dash reaches the ring standing
//                            on the level; "2028" white; the flag nods.
// 48. f1620-1630 "so it did  P3's human card steps aside with the standard exit.
//                happen"     Its column is centred on its own point, so the
//                            steep line climbs out of P3 straight through
//                            "100 MIN"; the point and "2025" stay.
// 49. f1622-1657 "so it did  THE SOLID orange line leaves P3 steeply for the
//                happen"     level at x = X_4, and on the same frames the FLAG
//                            SLIDES LEFT along the level from beside P6 to meet
//                            it there.
// 50. f1655-1668 "a lot      They meet: the flag eases WHITE -> ORANGE over 8
//                faster"     frames, "2026" eases white -> orange with it, the
//                            "?" leaves with the standard exit, and the
//                            abandoned dashed projection and its rings ease to
//                            ACCENT_DEEP.
// 51. f1616-1640 ->          THE PULL-BACK to P3..P6 with the level and the
//                            flag's whole slide path, k 0.715 -> 0.60, landing
//                            on f1640: 72 px of air each side on the P3..P6
//                            diagonal, 33 on the outermost label, the chart's
//                            centre of mass on screen y 803.
// 52. f1644-1700 "than i     AND THEN IT PUSHES IN. k 0.60 -> 0.70 with the
//                expected"   camera drifting toward X_4, so the orange flag and
//                            the hit walk up and in -- screen (377, 540) at the
//                            landing to (452, 425) at f1700 -- while the type
//                            grows: numerals 49 -> 52 px, the steep line's
//                            clearance off "15 H" 61 -> 70. It reaches 0.650 at
//                            f1700 and is still moving, so the piece ends on the
//                            biggest reading of its payoff, not the smallest.
//                            v2r2: this was one endless opening, k 0.48 -> 0.375,
//                            and the last frame was the faintest in the piece.
//                            Everything left in the last 40 frames is fully
//                            inside the frame -- P3's "2025" and its X10, P4's
//                            "15 H" column, the dimmed 2027, the orange flag --
//                            except the Millennium column, which steps aside at
//                            1648 (see DEVIATIONS) because the push necessarily
//                            carries P6 off the right edge.
//
// ---------------------------------------------------------------------------
// LIVENESS -- mechanisms, not gestures, none on a word and none ever stops:
//   * orange packets up the solid line from the frame it has length (f~346) to
//     the last frame, speed capped at 45 screen px/frame;
//   * marching dashes on every dashed line from the frame it exists;
//   * the camera, which is never parked: every hold is the damper's decaying
//     approach plus `sway`;
//   * the grid's parallax and its own -0.3 px/frame drift;
//   * a 1.5% breath on every orange point.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//
//  * A COLUMN'S PRESENCE IS A SMOOTH FUNCTION OF WHERE THE CAMERA IS. The brief
//    says a resting frame holds "one landing plus line running off both sides;
//    nothing else", and at the follow zoom the neighbour's POINT is indeed out
//    (520 x 1.22 = 634 screen px against a 540 px half-frame) -- but its
//    NUMERAL is not: "100 MIN" is 155 k^0.75 screen px half-wide, so 172 px of
//    it would hang back into the frame and be sliced by the edge on every
//    resting frame. So a column fades on d = |X_i - cx| k / 540: full inside
//    d 0.68, gone by d 1.15. At rest a neighbour sits at d 1.175 and is
//    ABSENT; in the wide shots everything meant to be read sits inside 0.68;
//    and in between a departing landing fades as it slides off the lower left,
//    which is the behaviour the brief describes. The band is 0.47 wide = 254
//    screen px, and no camera move in the piece shifts a landing more than
//    ~27 screen px in a frame, so the fade's own step never exceeds 0.19 --
//    inside the opacity-continuity rule. Names and sub-lines carry a second
//    gate on k itself (out by 0.75, in by 0.93), which is what takes them off
//    in the pull-backs and brings them back, and a third: the same x-band
//    shifted 0.32 inward, so the deep end of a departing column leaves before
//    the shallow end. At 360/520 a landing the camera has climbed away from is
//    360 world px BELOW it as well as 520 beside it, and the sub-line of a
//    departing column was reaching screen y 1360 -- inside the caption band --
//    while still half on the left edge at 50%.
//    v2r2: the band itself now OPENS WITH THE CAMERA. At k >= 0.95 it is
//    0.60 / 0.99 and at k <= 0.60 it is 0.88 / 1.22, crossed on a smoothstep in
//    k so the gate is C1 in the camera. The wide end is what lets a pulled-back
//    shot hold everything in it at full strength: a column 792 world px off
//    centre at k 0.60 sits at d 0.88 and is FULL, where the old fixed band
//    read it at 46% and forced the wide shots down to k 0.47. The follow end
//    closes to 0.99, not 1.15, for the caption band: solved for the crossing, a
//    column's year passes screen y 1350 when the camera has covered 89% of a
//    riser, i.e. at d 0.99, so the column is gone on the frame its tail would
//    enter the band. Neither end changes a follow shot -- the neighbour is at
//    d 1.175 and absent either way -- and the band never narrows below 0.34
//    (184 screen px).
//
//  * THE SCALE SHOT IS 0.565, AND 0.565 IS WHAT THE MARGINS ALLOW. Framing
//    P0..P3 is 1560 world px of diagonal plus "5 SEC"'s half (107.5 k^0.75) on
//    the left and "2025"'s (52.8 k^0.75, floored at 30) on the right. The
//    brief's rule is 70 px of air each side of the DIAGONAL, which is
//    k <= (1080 - 140)/1560 = 0.6026; the whole extent including those two
//    labels is 1560 k + 1.4925 num + 1.32 year, and at 0.6026 that leaves only
//    16 px of label margin. 0.565 is the reading that keeps 99 px on the
//    diagonal and 40 on the labels, with the numeral at 47 px and the person at
//    85, both clear of their floors. The old 0.47 came from a gate that
//    required both ends inside d 0.68; that gate now opens with the camera (see
//    below), so the framing is set by the frame's edges instead.
//
//  * CUT 8'S WIDE SHOT IS k 1.15, NOT 1.00 -- and it is a PUSH, not a pull-back.
//    P4 to the level is 720 world px now. The shot has to hold the level, P4's
//    whole column and the bracket beside it inside 70 px at the top and the
//    1350 caption line at the bottom: 720 k + 118 k^0.75 + 0.711 * 40 k^0.75
//    plus the P3 -> P4 tag's own drop below the riser. That binds at k 1.15,
//    where the level sits at screen 126, P4 at 954, "2026"'s foot at 1117 and
//    the tag at 1310. P3 falls out of the gate on its own at that zoom
//    (d 1.36), so the camera can centre the column and the bracket rather than
//    being pushed off them. The bracket is 828 screen px.
//
//  * THE BRACKET STANDS 150 WORLD PX RIGHT OF P4, not straight up through it.
//    P4's column is centred on P4's own x and runs 325 k^0.75 screen px ABOVE
//    the point, so a bracket drawn on X_4 would be drawn straight through
//    "15 H" and the person glyph. 150 world px clears the numeral's widest
//    corner (81 world px at the shot's k) by 69 px and still reads as the
//    measure from that landing up to the level. The P4 -> P5 dashes do not
//    exist until f1552, four frames after the bracket has retracted, so the
//    two never share a frame.
//
//  * CUT 4 LANDS LOW AND TILTS UP. P2's point lands at 515 and its person does
//    not arrive until 612, so for ~100 frames the top half of its column is a
//    hole and the frame is a line with two grey labels under it. The landing is
//    framed at screen 815 instead of 800 and eased up to 793 as the person
//    comes in, so the longest hold in the second act is a move that is MAKING
//    ROOM for the human side rather than a creep over an empty frame. c is
//    monotone through it, so the camera never doubles back.
//    v2r2: it was 867. At 360/520 the landing the camera is leaving sits 360
//    world px lower than before, and framing this one 67 px down put the
//    DEPARTING P1's year at screen 1356 -- inside the caption band at 49%
//    opacity. 15 px buys the same intent and keeps the band clean.
//
//  * THE RETURN FROM P6 BREATHES OUT TO k 0.56, deeper than anything except
//    cut 5 and the ending. The two landings are 1892 world px apart and at the
//    travelling zoom the half-frame is 587, so 40 frames of the crossing held
//    nothing but the dashed level. At 0.56 the half-frame is 964 and the two
//    landings OVERLAP: at the midpoint each sits 946 world px off centre, d
//    0.98 against the wide gate's 1.22, so both hold 83% of their ink, one at
//    each edge with the level running between them.
//
//  * THE ENDING'S MILLENNIUM COLUMN STEPS ASIDE AT 1648. The ending pushes IN
//    toward the hit at X_4, and X_4 is 1040 world px left of P6: at the landing
//    zoom P6's "2028" has 40 px of margin on the right edge, and by k 0.66 its
//    box straddles that edge. Keeping it in caps the push at 0.635, which is not
//    a push. So it leaves -- with the standard 10-frame exit, on the frame the
//    flag arrives at 2026 and the "?" is answered, 14 frames before its box
//    would first be cut, and 46 world px INSIDE the frame when it goes. Its ring
//    stays: it is the dimmed projection's far end and it slides off clean. The
//    P2 -> P3 tag goes the same way at 1596, while the camera is out at P6 and
//    it is 390 screen px off frame; it is the one label in the piece that would
//    end up both off the left edge and under the caption line.
//
//  * THE X10 TAGS HANG UNDER THE LINE, not above it. Above the line is where
//    every landing's person and numeral live, and it is also the wedge cut 9's
//    steep line sweeps through: at the closing zoom the P3 -> P4 tag was run
//    through by that line and landed on top of "100 MIN". Under the line the
//    wedge is empty for the whole piece -- the audit walks every drawn line
//    against every text box across all 1587 frames and it is clean. The offset
//    is 135 SCREEN px at k 1 on the k^0.75 law rather than a world constant, so
//    the tag keeps its distance from the line as the type grows in the wide
//    shots (128 world px at the follow zoom, 154 at the closing one).
//
//  * THE ENTRANCE'S FADE IS A SMOOTHSTEP WHILE ITS SLIDE IS THE BRIEF'S
//    EASE-OUT CUBIC. An ease-out cubic over 12 frames reaches 0.23 on its first
//    frame -- which is precisely the one-frame pop the note was about, and it
//    fails the brief's own 0.2 continuity rule. The 24 px slide keeps the cubic
//    (it leaves fast and decelerates into place, which is what the note liked);
//    the fade takes a smoothstep over the same 12 frames and never steps more
//    than 0.125. Measured over the whole piece the largest opacity step of any
//    label, from any cause, is 0.193.
//
//  * THE MILLENNIUM LEVEL FADES IN RATHER THAN DRAWING HEAD-LED. In V1 it was
//    830 world px long and a head could draw it. Here it spans the world --
//    4600 world px -- and a head-led draw would run at 100 screen px/frame,
//    more than twice the set's speed cap. It takes the piece's own standard
//    entrance instead: slide up 24 px, fade over 12, landing on "how long"
//    (1130). The solid line, the dashed projection and the steep line all still
//    draw head-led; none of them is longer than 1199 world px.
//    v2r2: every head-led draw got more frames, because a riser is 632 world px
//    long now and not 568.6. The solid line's second riser runs 487-515 instead
//    of 488-514, the P3 -> P4 dashes 1376-1400 instead of 1379-1400 and the
//    P4 -> P5 dashes 1552-1577 instead of 1556-1577. Every LANDING frame is
//    unchanged; the heads only leave earlier, which is the direction gestures
//    are allowed to move in this set. The worst head measures 42 screen px per
//    frame against the 45 cap.
//
//  * X10 TAGS ON FOUR RISERS, NOT SIX. The tags are the gesture list's: 754,
//    765, 902 and 1392. Risers P4 -> P5 and P5 -> P6 get none -- cut 9's
//    gesture list does not introduce them, and the final wide shot reads
//    cleaner with the law stated on the four risers the line has actually
//    walked.
//
//  * THE COLUMN'S GAPS ARE IN SCREEN PX, NOT WORLD PX, AND THE SLOPE SETS THEM.
//    Type is on the k^0.75 law, so a world gap would close as the camera pushes
//    in and open as it pulls back; GAP_UP 150 and GAP_DOWN 118 screen px at
//    k = 1, both x k^0.75, give 143 and 112 world px at the follow zoom and the
//    gap reads the same at every zoom.
//    150 and not the brief's ~110 because the SLOPE decides it, not taste. A
//    label is centred on its point, so the line rises 0.6923 x its half-width
//    by the time it reaches the far corner. "100 MIN" is 155 k^0.75 half-wide,
//    which is 107 k^0.75 of rise -- a 110 px gap would leave 3 px. At 150 the
//    clearance is 50 screen px at the follow zoom and never falls below 28
//    anywhere in the piece; the year clears by 53-110 and the sub-line, whose
//    "USA OLYMPIAD QUALIFIER" is 240 px half-wide, by 55-108. The audit walks
//    every drawn line against every text box across all 1587 frames and it is
//    clean.
//    The same arithmetic governs cut 9's steep line against P4's column, which
//    is the tightest pair in the piece: the line leaves P3 for (X_4, LEVEL_Y)
//    at slope 2.077 and passes the top-left corner of "15 H"'s person. That
//    clearance is 60.2 screen px at k 0.60 and grows with k, which is the real
//    floor under the ending's landing zoom -- 61.1 px measured at its worst
//    frame, f1649, against the brief's 60.
// ---------------------------------------------------------------------------

export const START = 113;
export const END = 1700;
export const FULL_DURATION = END - START; // 1587

export const CUTS = {
  ImoGoldV2: [113, 192],
  FiveSecondsV2: [192, 343],
  OneMinuteV2: [343, 493],
  TenMinutesV2: [493, 725],
  TenXEveryYearV2: [725, 874],
  HundredMinutesV2: [874, 1053],
  MillenniumPrizeV2: [1053, 1251],
  FifteenHoursV2: [1251, 1500],
  FasterThanExpectedV2: [1500, 1700],
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

export const FRAME_W = 1080;
export const FRAME_H = 1920;

// ---------------------------------------------------------------------------
// THE WORLD. A shallow diagonal, 520 world px per year across and 230 up, so
// 10x a year is a straight line and the whole chart is 3120 px wide. Nothing
// holds all of it.
// ---------------------------------------------------------------------------
export const NX = (i: number) => 600 + 520 * i;
export const NY = (i: number) => 2600 - 360 * i;
export const P = Array.from({ length: 7 }, (_, i) => ({ x: NX(i), y: NY(i) }));

export const LEVEL_Y = NY(6); // 440 -- the Millennium Prize level
export const LEVEL_X0 = 200;
export const LEVEL_X1 = 4800;
/** The flag stands on the level, 130 world px right of P6. */
export const FLAG_HOME = NX(6) + 130;
/** Where the steep line hits the level: straight above P4, 2026. */
export const HIT = { x: NX(4), y: LEVEL_Y };
/** The bracket stands beside P4's column, not through it -- see DEVIATIONS. */
export const BRACKET_DX = 150;

const SEG_LEN = Math.hypot(520, 360); // 632.45
const DIRX = 520 / SEG_LEN;
const DIRY = -360 / SEG_LEN;
/** The line's screen slope, |dy/dx|. Every clearance in the column is solved
 *  against it: a label centred on its point has to sit further off the point
 *  than the line rises across the label's own half-width. */
const SLOPE = 360 / 520; // 0.6923
/** Perpendicular off the line, for the X10 tags. It points DOWN-RIGHT, into the
 *  empty wedge under the line, and not up: above the line is where every
 *  landing's person and numeral live, and it is also the wedge cut 9's steep
 *  line sweeps through -- at the closing zoom an X10 sitting above the
 *  P3 -> P4 riser is run through by that line and lands on top of "100 MIN".
 *  Under the line the tags are clear of everything for the whole piece. */
const PERPX = -DIRY; // 0.4045
const PERPY = DIRX; // 0.9146
/** SCREEN px at k 1 -- carried on the type's own k^0.75 law, so the tag keeps
 *  its distance from the line as the type grows in the wide shots. 135 and not
 *  110: at 110 the P1 -> P2 tag clipped the bottom of "USA OLYMPIAD QUALIFIER"
 *  for 14 frames of cut 6's push. */
const TAG_PERP = 135;

// ---------------------------------------------------------------------------
// THE TYPE AND THE COLUMN. One family, one tracking, one cap-top anchor. Sizes
// are SCREEN px at k = 1 and every one of them rides k^0.75, with the brief's
// floors so a wide shot never loses a numeral.
// ---------------------------------------------------------------------------
const TYPE_K = 0.75;
const NUM_SIZE = 72;
const NUM_MIN = 40;
const YEAR_SIZE = 40;
const YEAR_MIN = 30;
const NAME_SIZE = 40;
const SUB_SIZE = 30;
const TAG_SIZE = 40;
const TAG_MIN = 30;
const PERSON_H = 130; // the glyph's box height, screen px at k 1
const PERSON_MIN = 70;
const PERSON_FOOT = 471 / 512; // person.png's feet inside its own box
const PERSON_INK = 0.84; // how much of the box is ink, across
const TRACK = 0.11; // em

const ASC = 1900 / 2048;
const DESC = 500 / 2048;
const CAP = 1456 / 2048;
/** Distance from an inline box's top to the CAP top, at line-height 1. */
const CAP_TOP = (1 - (ASC + DESC)) / 2 + ASC - CAP; // 0.13086 of the size
const CAP_H = CAP;

/** Roboto Condensed 700 advances, deliberately a hair generous, so the layout
 *  and the audit measure a label with the same ruler. */
const ADV = (ch: string) =>
  ch === " " ? 0.25 : (ch >= "0" && ch <= "9") || ch === "?" ? 0.55 : 0.545;
export const emWidth = (s: string) =>
  [...s].reduce((a, c) => a + ADV(c), 0) + s.length * TRACK;

// The column, top to bottom, as SCREEN px at k = 1 measured off the point.
const GAP_UP = 150; // point -> the numeral's cap BOTTOM
const CARD_RISE = 16; // the numeral's cap top -> the person's foot
const GAP_DOWN = 118; // point -> the year's cap TOP
const NAME_GAP = 24; // the year's cap bottom -> the name's cap top
const SUB_GAP = 16; // the name's cap bottom -> the sub's cap top

// -- ink weights, SCREEN px at k 1, all on the same k^0.75 law --------------
const LINE_W = 6;
const GLYPH_W = 6;
const POINT_R = 16;
const PACKET_R = 8;
const DASH_ON = 22;
const DASH_OFF = 17;
const MARCH_PX = 0.9; // screen px a dash advances per frame

const WHITE_FULL = 1.0;
const WHITE_SOFT = 0.6;

// ---------------------------------------------------------------------------
// THE ENTRANCE STANDARD. One shape for everything that is not a line: slide up
// RISE screen px while fading 0 -> 1 over ENTER_F frames on an ease-out cubic,
// fully arrived on its word. Exits are the reverse over EXIT_F.
// ---------------------------------------------------------------------------
const ENTER_F = 12;
const EXIT_F = 10;
const RISE = 24;
const easeOutCubic = (u: number) => 1 - Math.pow(1 - clamp01(u), 3);
/** The raw progress of an entrance that arrives ON `land`. */
const uEnter = (g: number, land: number) => clamp01((g - (land - ENTER_F)) / ENTER_F);
/** The raw progress of an exit that starts at `f`. */
const uExit = (g: number, f: number) => 1 - clamp01((g - f) / EXIT_F);
/** THE TWO CURVES OF ONE ENTRANCE. The brief asks for an ease-out cubic, and
 *  that is what the 24 px SLIDE takes -- it leaves fast and decelerates into
 *  place. The FADE takes a smoothstep instead: an ease-out cubic reaches 0.23
 *  on its first frame, which is exactly the one-frame pop the note was about,
 *  where a smoothstep over the same 12 frames never steps more than 0.125.
 *  Several gates multiply (entrance x camera x zoom) and each one contributes
 *  to both curves, so a label that is entering while its column slides off the
 *  edge still has one continuous opacity and one continuous slide. */
const presence = (...us: number[]) => {
  let o = 1;
  let r = 1;
  for (const u of us) {
    const c = clamp01(u);
    o *= smoothstep(c);
    r *= easeOutCubic(c);
  }
  return { o, rise: (1 - r) * RISE };
};
/** An eased step, for the colour and ladder changes. */
const ramp = (g: number, f0: number, f1: number) =>
  f1 <= f0 ? (g >= f1 ? 1 : 0) : smoothstep(clamp01((g - f0) / (f1 - f0)));
/** A head-led draw: cruise, then decelerate into the landing. */
const draw = (g: number, f0: number, f1: number) => arriveEase(clamp01((g - f0) / (f1 - f0)));
/** One small settle: 0 -> a bump -> 0. */
const settle = (g: number, f0: number, dur: number) => {
  const u = clamp01((g - f0) / dur);
  if (u <= 0 || u >= 1) return 0;
  return Math.sin(Math.PI * u) * (1 - u);
};

const hexToRgb = (h: string): [number, number, number] => {
  const s = h.replace("#", "");
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** An eased colour change: 8 frames, never a swap. */
export const mixHex = (a: string, b: string, t: number) => {
  const u = clamp01(t);
  if (u <= 0) return a;
  if (u >= 1) return b;
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${Math.round(A[0] + (B[0] - A[0]) * u)},${Math.round(
    A[1] + (B[1] - A[1]) * u,
  )},${Math.round(A[2] + (B[2] - A[2]) * u)})`;
};

// ---------------------------------------------------------------------------
// THE CAMERA. One keyed track over the whole global timeline: `camEase` per
// frame inside every segment, cy taken off the EASED k so framing and zoom
// settle together, then fieldShared's damper on all three axes. Between
// segments the target holds and the damper coasts in -- that is what a "hold"
// is here, a decaying drift that continues the last velocity.
//
//   c   = the world y that lands on screen 800, where a landing's POINT sits
//   cx  = the world x that lands on screen 540
// ---------------------------------------------------------------------------
export const CAM_LIFT = 160; // 960 - 800

/** THE CAMERA IS TWO INDEPENDENT TRACKS. V1 keyed zoom and framing on the same
 *  segments, which is fine when every move is short. Here the piece has four
 *  travels over 1500 world px, and each of them wants ONE continuous position
 *  ease with a zoom that breathes out in the middle and closes at the end --
 *  three keys on one track. Splitting such a move into three joint segments
 *  puts a stall in the position target at each join (camEase has zero slope at
 *  both ends), and the damper turns every stall into acceleration: measured at
 *  4.17 screen px/frame^2 across the opening glide, against the set's 2.5
 *  ceiling. With the tracks separate the glide is one 88-frame smoothstep --
 *  peak 29 world px/frame, |dv| 1.3 -- and the zoom does what it likes under
 *  it. `cy` is still taken off the EASED k so framing and zoom settle together.
 */
type KSeg = { f0: number; f1: number; k0: number; k1: number; warp: number };
type PSeg = {
  f0: number;
  f1: number;
  x0: number;
  x1: number;
  c0: number;
  c1: number;
  warp: number;
};

/** The follow zoom. 1.22 and not 1.15: at 1.15 the neighbouring landing sits
 *  at d = 1.107, inside the fade, and still carries 4% of its ink into a
 *  resting frame. */
export const K_FOLLOW = 1.22;

export const K_SEGS: KSeg[] = [
  // THE COLD OPEN IS TIGHT. One point and two labels in an empty field read as
  // nothing at 1.14; at 1.50 the point is 21.7 screen px across and "IMO GOLD"
  // is 134 px half-wide, so the lone landing has weight, and the creep out to
  // 1.30 by f143 is the frame starting to breathe before the glide leaves.
  { f0: 113, f1: 143, k0: 1.5, k1: 1.3, warp: 1.4 }, // cut 1, the creep
  // 0.74 and not 0.86: the glide is 1572 world px across now and at the old
  // crossing zoom the departing "2025" left the right edge at f172 while P0 did
  // not cross the left one until f190 -- eighteen frames of bare grid in the
  // middle of the opening move. At 0.74 the half-frame is 730 world px and the
  // two overlap to within four frames.
  { f0: 143, f1: 176, k0: 1.3, k1: 0.74, warp: 0.9 }, // breathe out to cross
  { f0: 176, f1: 190, k0: 0.74, k1: 0.74, warp: 1.0 },
  { f0: 190, f1: 222, k0: 0.74, k1: K_FOLLOW, warp: 1.0 }, // close in onto P0
  { f0: 224, f1: 288, k0: K_FOLLOW, k1: 1.28, warp: 0.55 }, // cut 2's hold, two lobes
  { f0: 288, f1: 350, k0: 1.28, k1: 1.38, warp: 0.55 },
  { f0: 350, f1: 372, k0: 1.38, k1: 1.05, warp: 0.9 }, // cut 3, out with the head
  { f0: 372, f1: 392, k0: 1.05, k1: 1.05, warp: 1.0 },
  { f0: 392, f1: 414, k0: 1.05, k1: K_FOLLOW, warp: 1.0 },
  { f0: 414, f1: 458, k0: K_FOLLOW, k1: 1.26, warp: 0.55 },
  { f0: 458, f1: 501, k0: 1.26, k1: 1.31, warp: 0.55 },
  { f0: 501, f1: 520, k0: 1.31, k1: 1.05, warp: 0.9 }, // cut 4, out with the head
  { f0: 520, f1: 536, k0: 1.05, k1: 1.05, warp: 1.0 },
  { f0: 536, f1: 554, k0: 1.05, k1: K_FOLLOW, warp: 1.0 },
  { f0: 554, f1: 608, k0: K_FOLLOW, k1: 1.25, warp: 0.55 },
  { f0: 608, f1: 660, k0: 1.25, k1: 1.285, warp: 0.55 },
  { f0: 660, f1: 700, k0: 1.285, k1: 1.31, warp: 0.55 },
  { f0: 700, f1: 752, k0: 1.31, k1: 0.565, warp: 0.72 }, // CUT 5, THE SCALE SHOT
  { f0: 752, f1: 806, k0: 0.565, k1: 0.557, warp: 0.55 },
  { f0: 806, f1: 862, k0: 0.557, k1: 0.548, warp: 0.55 },
  { f0: 862, f1: 956, k0: 0.548, k1: K_FOLLOW, warp: 0.85 }, // cut 6, back in on P3
  { f0: 956, f1: 1006, k0: K_FOLLOW, k1: 1.25, warp: 0.55 },
  { f0: 1006, f1: 1062, k0: 1.25, k1: 1.3, warp: 0.55 },
  { f0: 1062, f1: 1100, k0: 1.3, k1: 0.86, warp: 0.85 }, // cut 7, out along the line
  { f0: 1100, f1: 1148, k0: 0.86, k1: 0.86, warp: 1.0 },
  { f0: 1148, f1: 1184, k0: 0.86, k1: K_FOLLOW, warp: 1.0 }, // land on P6
  { f0: 1184, f1: 1222, k0: K_FOLLOW, k1: 1.28, warp: 0.55 },
  // THE RETURN BREATHES ALL THE WAY OUT TO 0.56. P6 and P3 are now 1892 world
  // px apart, and at the travelling zoom the crossing would spend 40 frames on
  // a bare grid with one dashed level in it. At 0.56 the half-frame is 964 and
  // the two landings OVERLAP -- at the midpoint each sits 946 world px off
  // centre, d 0.98 against the wide gate's 1.22, so both hold 83% of their ink,
  // one in each corner with the level running between them. The move becomes a
  // pull-back-and-push-in arc instead of a pan through nothing.
  { f0: 1222, f1: 1258, k0: 1.28, k1: 0.56, warp: 0.85 }, // the return
  { f0: 1258, f1: 1294, k0: 0.56, k1: 0.56, warp: 1.0 },
  { f0: 1294, f1: 1326, k0: 0.56, k1: K_FOLLOW, warp: 1.0 },
  { f0: 1326, f1: 1384, k0: K_FOLLOW, k1: 1.28, warp: 0.55 }, // cut 8's creep
  { f0: 1384, f1: 1406, k0: 1.28, k1: 1.02, warp: 0.9 }, // out with the dash head
  { f0: 1406, f1: 1424, k0: 1.02, k1: 1.1, warp: 1.0 },
  { f0: 1424, f1: 1454, k0: 1.1, k1: 1.15, warp: 0.75 }, // THE TILT: P4 and the level
  { f0: 1454, f1: 1500, k0: 1.15, k1: 1.165, warp: 0.55 },
  { f0: 1500, f1: 1544, k0: 1.165, k1: 1.18, warp: 0.55 },
  { f0: 1544, f1: 1604, k0: 1.18, k1: 0.72, warp: 0.9 }, // cut 9, out with the dashes
  { f0: 1604, f1: 1618, k0: 0.72, k1: 0.71, warp: 0.9 },
  { f0: 1618, f1: 1638, k0: 0.71, k1: 0.6, warp: 0.9 }, // the pull-back to P3..P6
  // THE ENDING PUSHES IN, IT DOES NOT KEEP OPENING. V3 ended on its smallest,
  // faintest frame. Here the piece lands the wide shot on "so it did happen"
  // and then closes on the hit -- k 0.60 -> 0.70 with the camera drifting
  // toward X_4, so the orange flag walks up toward the middle of the frame
  // while the type grows. The segment is 118 frames long and reaches 0.678 at
  // f1700, so the last frame is still moving, on the biggest reading of the
  // payoff rather than the smallest.
  { f0: 1648, f1: 1766, k0: 0.6, k1: 0.7, warp: 0.75 }, // THE PUSH INTO THE HIT
];

// The position track's hold lobes are deliberately OFFSET from the zoom
// track's. Both curves have zero slope at a segment end, so when a zoom lobe
// and a position lobe end on the same frame the camera's target stands still
// for a few frames and the damper coasts to a stop -- measured as three
// 11-to-19-frame stretches under 0.12 screen px/frame. Staggered, one track is
// always mid-lobe while the other turns over.
export const P_SEGS: PSeg[] = [
  { f0: 113, f1: 143, x0: 2150, x1: 2172, c0: 1530, c1: 1518, warp: 1.4 },
  // THE LONG GLIDE: 1572 world px across and 1082 down -- 1908 px of travel --
  // as ONE 76-frame move. Both ends are set by what is on screen rather than by
  // the words: P0 crosses the left edge at f184 and is a visible point by f190,
  // so cut 2 -- which starts at 192 -- never opens on bare grid, and the
  // departing "2025" is still in frame as the move starts. At the crossing zoom
  // of 0.80 the peak is 30 screen px/frame, inside the set's 45 cap.
  { f0: 143, f1: 219, x0: 2172, x1: 600, c0: 1518, c1: 2600, warp: 1.0 },
  { f0: 219, f1: 300, x0: 600, x1: 618, c0: 2600, c1: 2592, warp: 0.55 },
  { f0: 300, f1: 352, x0: 618, x1: 634, c0: 2592, c1: 2584, warp: 0.55 },
  { f0: 352, f1: 414, x0: 634, x1: 1120, c0: 2584, c1: 2240, warp: 1.0 },
  { f0: 414, f1: 470, x0: 1120, x1: 1134, c0: 2240, c1: 2232, warp: 0.55 },
  { f0: 470, f1: 501, x0: 1134, x1: 1148, c0: 2232, c1: 2226, warp: 0.55 },
  // Cut 4 lands LOW and tilts up. P2's landing is at 515 and its person does
  // not arrive until 612, so for ~100 frames the top half of the column is a
  // hole; framing the point at screen 867 and easing it to 795 as the person
  // comes in makes the hold a move that is MAKING ROOM for the human side
  // rather than a creep over an empty frame. c is monotone through it.
  { f0: 501, f1: 554, x0: 1148, x1: 1640, c0: 2226, c1: 1868, warp: 1.0 },
  { f0: 554, f1: 590, x0: 1640, x1: 1648, c0: 1868, c1: 1878, warp: 0.55 },
  { f0: 590, f1: 622, x0: 1648, x1: 1658, c0: 1878, c1: 1888, warp: 0.55 },
  { f0: 622, f1: 700, x0: 1658, x1: 1676, c0: 1888, c1: 1894, warp: 0.55 },
  // THE SCALE SHOT's framing: cx 1353 puts "5 SEC"'s left corner and "2025"'s
  // right corner an equal 32 px off the edges, and c 2132 puts the whole
  // chart's ink -- P2's person top at 430 down to "2022"'s foot at 1171 --
  // centred on screen y 800.
  { f0: 700, f1: 752, x0: 1676, x1: 1353, c0: 1894, c1: 2132, warp: 0.72 },
  { f0: 752, f1: 782, x0: 1353, x1: 1364, c0: 2132, c1: 2129, warp: 0.55 },
  { f0: 782, f1: 828, x0: 1364, x1: 1382, c0: 2129, c1: 2122, warp: 0.55 },
  { f0: 828, f1: 862, x0: 1382, x1: 1400, c0: 2122, c1: 2116, warp: 0.55 },
  { f0: 862, f1: 956, x0: 1400, x1: 2160, c0: 2116, c1: 1520, warp: 0.85 },
  { f0: 956, f1: 1028, x0: 2160, x1: 2178, c0: 1520, c1: 1512, warp: 0.55 },
  { f0: 1028, f1: 1062, x0: 2178, x1: 2194, c0: 1512, c1: 1505, warp: 0.55 },
  { f0: 1062, f1: 1184, x0: 2194, x1: 3720, c0: 1505, c1: 440, warp: 1.0 },
  { f0: 1184, f1: 1222, x0: 3720, x1: 3736, c0: 440, c1: 433, warp: 0.55 },
  { f0: 1222, f1: 1326, x0: 3736, x1: 2160, c0: 433, c1: 1520, warp: 1.0 },
  { f0: 1326, f1: 1384, x0: 2160, x1: 2178, c0: 1520, c1: 1512, warp: 0.55 },
  { f0: 1384, f1: 1424, x0: 2178, x1: 2680, c0: 1512, c1: 1160, warp: 1.0 },
  // THE TILT, re-solved: P4 to the level is 720 world px now, so at k 1.15 the
  // bracket is an 828 px vertical -- by a distance the biggest single measure
  // in the piece. c 1004 puts the level at screen 152 and P4 at 980, with
  // "2026"'s foot at 1143 and the P3 -> P4 tag at 1310, all inside the band.
  { f0: 1424, f1: 1454, x0: 2680, x1: 2724, c0: 1160, c1: 1026, warp: 0.75 },
  { f0: 1454, f1: 1526, x0: 2724, x1: 2740, c0: 1026, c1: 1032, warp: 0.55 },
  { f0: 1526, f1: 1560, x0: 2740, x1: 2756, c0: 1032, c1: 1038, warp: 0.55 },
  { f0: 1560, f1: 1596, x0: 2756, x1: 3300, c0: 1038, c1: 824, warp: 1.0 },
  { f0: 1596, f1: 1616, x0: 3300, x1: 3310, c0: 824, c1: 820, warp: 0.55 },
  { f0: 1616, f1: 1636, x0: 3310, x1: 2938, c0: 820, c1: 873, warp: 0.95 },
  { f0: 1644, f1: 1762, x0: 2938, x1: 2620, c0: 873, c1: 960, warp: 0.75 },
];

const CAM_N = END + 80;

/** The camera's TARGET at every integer frame: one key per frame on the eased
 *  curve, cy off the eased k. */
const TARGET = (() => {
  const K = new Float64Array(CAM_N + 1);
  const CX = new Float64Array(CAM_N + 1);
  const CY = new Float64Array(CAM_N + 1);
  let ki = 0;
  let pi = 0;
  for (let f = 0; f <= CAM_N; f++) {
    while (ki < K_SEGS.length - 1 && f > K_SEGS[ki].f1) ki++;
    while (pi < P_SEGS.length - 1 && f > P_SEGS[pi].f1) pi++;
    const ks = K_SEGS[ki];
    const ps = P_SEGS[pi];
    const uk = f <= ks.f0 ? 0 : f >= ks.f1 ? 1 : camEase((f - ks.f0) / (ks.f1 - ks.f0), ks.warp);
    const up = f <= ps.f0 ? 0 : f >= ps.f1 ? 1 : camEase((f - ps.f0) / (ps.f1 - ps.f0), ps.warp);
    const k = ks.k0 + (ks.k1 - ks.k0) * uk;
    const c = ps.c0 + (ps.c1 - ps.c0) * up;
    K[f] = k;
    CX[f] = ps.x0 + (ps.x1 - ps.x0) * up;
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

const CAM_REST = camAt(START);

// ---------------------------------------------------------------------------
// PRESENCE. A column belongs to the frame the camera is in -- see DEVIATIONS.
// `vis` is the smooth gate on where a world x sits across the frame; `nameGate`
// is the second gate, on k, that takes the names and sub-lines off in the wide
// shots and brings them back.
// ---------------------------------------------------------------------------
// THE FOLLOW BAND CLOSES AT 0.99, NOT 1.15. A neighbour at rest sits at d 1.175
// and is absent either way, but the 360/520 slope means a landing the camera
// has climbed away from is 360 world px BELOW it as well as 520 beside it: on
// the follow zoom that puts its year's foot at screen y 1406, inside the
// caption band. Solved for the crossing -- a column's year passes 1350 when the
// camera has covered 89% of a riser, i.e. at d 0.99 -- the column is gone on the
// frame its tail would enter the band, and the piece is clean at 1350 again.
// The band stays 0.39 wide (211 screen px) so a column crossing it at the
// travelling speed still steps under 0.2 in opacity.
export const FADE_D0 = 0.6;
export const FADE_D1 = 0.99;
/** THE GATE OPENS WITH THE CAMERA. A fixed d 0.68 / 1.15 is the right band for
 *  a FOLLOW shot: the neighbouring landing sits at d 1.175 and is absent, and
 *  the current one is alone. But it is also what made V3's wide shots tiny --
 *  framing P0..P3 with both ends inside d 0.68 forces 780 k <= 367, k <= 0.47,
 *  which is a small shallow diagonal in a corner of a 9:16 frame. A pulled-back
 *  shot is MEANT to hold everything in it, so the band slides out with k: at
 *  k <= 0.60 it is 0.88 / 1.22 (a column 792 world px off centre at k 0.60 sits
 *  at d 0.88 and is FULL), at k >= 0.95 it is the follow band unchanged, and
 *  the crossing is a smoothstep in k so the gate is C1 in the camera. The
 *  follow shots the director liked are pixel-identical: every one of them runs
 *  at k >= 1.05.
 *  The band never narrows below 0.34 (184 screen px), so the opacity-continuity
 *  rule holds at both ends. */
export const FADE_D0_WIDE = 0.88;
export const FADE_D1_WIDE = 1.22;
export const GATE_K0 = 0.6;
export const GATE_K1 = 0.95;
export const fadeBand = (k: number) => {
  const s = smoothstep(clamp01((k - GATE_K0) / (GATE_K1 - GATE_K0)));
  return {
    d0: FADE_D0_WIDE + (FADE_D0 - FADE_D0_WIDE) * s,
    d1: FADE_D1_WIDE + (FADE_D1 - FADE_D1_WIDE) * s,
  };
};
/** Raw 0..1: how far inside the frame a column's own x is. */
export const uVis = (g: number, wx: number) => {
  const c = camAt(g);
  const b = fadeBand(c.k);
  const d = (Math.abs(wx - c.cx) * c.k) / (FRAME_W / 2);
  return clamp01((b.d1 - d) / (b.d1 - b.d0));
};
export const vis = (g: number, wx: number) => smoothstep(uVis(g, wx));
/** THE DEEP END OF A COLUMN LEAVES FIRST. The name and the sub-line sit under
 *  the year, 300-400 screen px below their point, and the slope is 360/520
 *  now: a landing the camera has left trails that far BELOW the frame's centre
 *  as well as beside it, and the sub of a departing column was reaching screen
 *  y 1360 -- into the caption band -- while it was still half on the left edge
 *  at 50%. The same band, shifted 0.32 inward, takes them off first: the year
 *  and the point are the last of a column to go, which is also the order they
 *  arrived in. */
export const DEEP_SHIFT = 0.32;
export const uVisDeep = (g: number, wx: number) => {
  const c = camAt(g);
  const b = fadeBand(c.k);
  const d = (Math.abs(wx - c.cx) * c.k) / (FRAME_W / 2);
  return clamp01((b.d1 - DEEP_SHIFT - d) / (b.d1 - b.d0));
};
export const NAME_K0 = 0.75;
export const NAME_K1 = 0.93;
/** Raw 0..1: names and sub-lines are out of the pulled-back framings. */
export const uNameGate = (g: number) => clamp01((camAt(g).k - NAME_K0) / (NAME_K1 - NAME_K0));
export const nameGate = (g: number) => smoothstep(uNameGate(g));

// ---------------------------------------------------------------------------
// THE SCHEDULE. Every reveal is a pure function of the global frame.
// ---------------------------------------------------------------------------
const POINT_IN = [198, 385, 515, 124, 1398, 1577, 1150];
/** How long a point takes to scale in. Two of them are long on purpose. P3's
 *  runs from f102 -- before the piece starts -- so frame 0 opens on a point
 *  that is already settling rather than on bare grid. P0's runs from f180, so
 *  it is a readable point from the frame it crosses the left edge during the
 *  opening glide, which is what stops cut 2 opening on an empty frame: it is
 *  the landing ARRIVING, and its name, year, person and numeral still assemble
 *  on their own words afterwards. */
const POINT_DUR = [18, 8, 8, 22, 8, 8, 8];
const NAME_TXT: (string | null)[] = ["GSM8K", "MATH", "AIME", "IMO GOLD", null, null, "MILLENNIUM PRIZE"];
const NAME_IN = [220, 385, 515, 131, 0, 0, 1188];
const SUB_TXT: (string | null)[] = ["GRADE SCHOOL MATH", null, "USA OLYMPIAD QUALIFIER", null, null, null, null];
const SUB_IN = [318, 0, 560, 0, 0, 0, 0];
const PERSON_IN = [250, 440, 612, 945, 1399, 0, 1160];
const NUM_TXT: (string | null)[] = ["5 SEC", "1 MIN", "10 MIN", "100 MIN", "15 H", null, "?"];
const NUM_IN = [263, 477, 664, 956, 1402, 0, 1168];
const YEAR_TXT = ["2022", "2023", "2024", "2025", "2026", "2027", "2028"];
const YEAR_IN = [228, 392, 714, 143, 1408, 1581, 1601];
/** A year the models have REACHED is orange; 2026-2028 are white while they
 *  are only projected, and 2026 turns orange when the steep line lands. */
const YEAR_REACHED = [true, true, true, true, false, false, false];
const HAS_PERSON = [true, true, true, true, true, false, true];
const IS_RING = [false, false, false, false, true, true, true];
/** The frame a landing's human card steps aside, 0 for never. Only P3 does:
 *  cut 9's steep line climbs out of P3 straight through its own column. */
const CARD_OUT = [0, 0, 0, 1620, 0, 0, 0];
/** The frame a WHOLE column steps aside with the standard exit, 0 for never.
 *  Only P6 does, at 1648. The ending pushes IN toward the hit at X_4, and
 *  X_4 is 1040 world px left of P6: at k 0.60 the Millennium column has 40 px
 *  of margin on the right edge and by k 0.66 its box straddles that edge. The
 *  brief's rule is that a label in the last frames is fully inside or fully
 *  gone, so it leaves -- on the frame the flag arrives at 2026, which is also
 *  the beat where the question stops being the Millennium landing's. Its ring
 *  stays: it is the dimmed projection's far end and it slides off clean. */
const COL_OUT = [0, 0, 0, 0, 0, 0, 1648];

/** The frame the line's head leaves landing i for the next one. */
const HEAD_LEAVE = [345, 487, 885];
/** The tick's path in cut 5, and the frames it draws level with each card. */
const TICK_F0 = 800;
const TICK_F1 = 849;
const HUMAN_LIT_F = [812, 830, 849];
const humanLevel = (g: number, i: number) => {
  if (i >= 3) return WHITE_FULL; // P3 and P4 land as the current subject
  const gone = ramp(g, HEAD_LEAVE[i], HEAD_LEAVE[i] + 12);
  const relit = ramp(g, HUMAN_LIT_F[i] - 6, HUMAN_LIT_F[i] + 6);
  return WHITE_FULL - (WHITE_FULL - WHITE_SOFT) * gone * (1 - relit);
};

// -- the solid line's head, as a continuous index along P0..P3 --------------
const HEAD_SEGS = [
  { f0: 345, f1: 383, i: 0 },
  { f0: 487, f1: 515, i: 1 },
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
const lineAt = (u: number) => {
  const i = Math.min(2, Math.floor(u));
  const t = clamp01(u - i);
  return { x: P[i].x + (P[i + 1].x - P[i].x) * t, y: P[i].y + (P[i + 1].y - P[i].y) * t };
};

// -- the dashed projection --------------------------------------------------
// The risers are 632 world px long now, not 568.6, so a 21-frame draw would run
// the head at 47 screen px/frame. Each of these gets the frames it needs
// instead: the head still LANDS on its word and only leaves earlier.
export const projA = (g: number) => draw(g, 1376, 1400);

// -- THE LEAD RUN, cut 7 ----------------------------------------------------
// "just projecting outwards" is a 1706 world px camera move up the line's
// extension with nothing in the world between P3 and P6, and a stub of dashes
// parked at P3 is left behind in eight frames -- measured as 60 frames of the
// travel with a bare grid and one dashed level in it. The brief's own words
// are "LED BY a short run of marching orange dashes", so the run travels: a
// 560 world px length of marching dash whose head leaves P3 on "projecting"
// (1059) and arrives at P6 on 1150, staying ahead of the camera the whole way.
// From 1118 its tail closes on its head, so the run has vanished on the exact
// frame P6's ring scales in -- the dashes become the landing rather than
// fading out. It is not the projection: the real P3 -> P4 dashes draw from
// scratch on 1379.
// Its head is keyed to the CAMERA and not to the clock: a run on its own
// schedule drifted into the top-right corner and sat there, because the camera
// eases and the run did not. Head = where the camera centre is on the
// extension, plus a 320 world px lead that itself ramps in over the first 21
// frames so the run grows out of P3 rather than appearing 350 px up it. The
// run therefore holds the same place in the frame for the whole travel --
// tail just left of centre, head three quarters across -- and the camera is
// genuinely following it.
const EXT_LEN = 3 * SEG_LEN;
// 900, not 560: the extension is 1897 world px now and the travel takes 122
// frames, and a 560 px run at the crossing zoom was 41% of the frame width --
// a short dash floating in a bare grid for the middle third of the cut. At 900
// the run reaches from the lower-left quadrant to the upper-right one and the
// camera is visibly chasing something. Its tail closes on its head over
// 1130-1150 instead of 1118-1150, so it is at full length for the crossing and
// gone on the frame P6's ring scales in.
const LEAD_LEN = 900;
const LEAD_AHEAD = 320;
export const leadRun = (g: number) => {
  const head = Math.min(
    EXT_LEN,
    (camAt(g).cx - P[3].x) / DIRX + LEAD_AHEAD * ramp(g, 1059, 1080),
  );
  const len = LEAD_LEN * (1 - clamp01((g - 1130) / 20));
  const tail = Math.max(0, Math.min(head - len, EXT_LEN));
  return { s0: tail, s1: head };
};
export const extPoint = (s: number) => ({ x: P[3].x + DIRX * s, y: P[3].y + DIRY * s });
export const projB = (g: number) => draw(g, 1552, 1577);
export const projC = (g: number) => draw(g, 1580, 1601);
export const steepU = (g: number) => draw(g, 1622, 1657);
export const levelIn = (g: number) => smoothstep(uEnter(g, 1130));
export const bracketU = (g: number) => draw(g, 1448, 1463) * (1 - draw(g, 1534, 1548));

// -- the X10 tags -----------------------------------------------------------
const TAG_IN = [754, 765, 902, 1392];
/** The frame a tag steps aside, 0 for never. Only the P2 -> P3 one does. The
 *  ending frames P3..P6 and then pushes toward X_4, and that tag hangs 172
 *  world px right of P2 and 123 BELOW its riser: it is the one label in the
 *  piece that ends up both off the left edge and under the caption line. It
 *  leaves at 1596, while the camera is out at P6 and it is 390 screen px off
 *  frame, so the exit itself is never seen. */
const TAG_OUT = [0, 0, 1596, 0];
export const tagPos = (i: number, kp = 1, k = 1) => {
  const off = (TAG_PERP * kp) / k;
  return {
    x: (P[i].x + P[i + 1].x) / 2 + PERPX * off,
    y: (P[i].y + P[i + 1].y) / 2 + PERPY * off,
  };
};

// -- the flag ---------------------------------------------------------------
export const flagX = (g: number) => FLAG_HOME + (HIT.x - FLAG_HOME) * ramp(g, 1622, 1657);
const flagNod = (g: number) => 9 * settle(g, 1601, 22);
/** The frame the steep line has the level: the flag and "2026" ease orange and
 *  the "?" leaves, all off the same constant. */
export const HIT_F = 1657;
// lucide `flag`, verbatim: the pennant and the pole, foot at (4, 22) of 24.
const FLAG_PATHS = ["M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z", "M4 22v-7"];

// -- the packets ------------------------------------------------------------
const PACKET_SPEED = 12; // world px/frame, capped against the camera
const PACKET_F0 = 346;
const STEEP_F0 = 1626;
const TAG_PACKET = { born: 748, speed: 52 };
const BRIGHT_PACKET = { born: 692, speed: 26 };

/** When a packet leaves P0. Accumulated frame by frame and only ever APPENDED,
 *  so an earlier frame's schedule is a prefix of a later one's. */
const launchesFrom = (f0: number): number[] => {
  const out: number[] = [];
  let acc = 0;
  for (let f = f0; f <= CAM_N; f++) {
    acc += camAt(f).k >= 1 ? 1 / 9 : 1 / 6;
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

export const packetsAt = (g: number): Pk[] => {
  const out: Pk[] = [];
  const L = headU(g) * SEG_LEN;
  if (L > 6) {
    for (const born of SOLID_LAUNCH) {
      if (born > g) break;
      const s = radAt(g) - radAt(born);
      if (s <= 0 || s > L) continue;
      const p = lineAt(s / SEG_LEN);
      out.push({ x: p.x, y: p.y, r: 1, bright: 0 });
    }
    // the tag packet: one run up the line that pops the first two X10 tags
    const st = (g - TAG_PACKET.born) * TAG_PACKET.speed;
    if (st > 0 && st < 2 * SEG_LEN + 200) {
      const u = Math.min(2, st / SEG_LEN);
      const p = lineAt(u);
      out.push({ x: p.x, y: p.y, r: 1 - clamp01((st - 2 * SEG_LEN) / 200), bright: 1 });
    }
    // "a year later": one brighter packet on the P1 -> P2 riser
    const sb = (g - BRIGHT_PACKET.born) * BRIGHT_PACKET.speed;
    if (sb > 0 && sb < SEG_LEN + 160) {
      const u = 1 + Math.min(1, sb / SEG_LEN);
      const p = lineAt(u);
      out.push({ x: p.x, y: p.y, r: 1 - clamp01((sb - SEG_LEN) / 160), bright: 1 });
    }
  }
  const su = steepU(g);
  if (su > 0.02) {
    const full = Math.hypot(HIT.x - P[3].x, HIT.y - P[3].y);
    const sl = full * su;
    for (const born of STEEP_LAUNCH) {
      if (born > g) break;
      const s = radAt(g) - radAt(born);
      if (s <= 0 || s > sl) continue;
      const t = s / full;
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
// THE SCENE. One pure function of the global frame returns every glyph in the
// frame, already placed in screen px with its presence resolved, so the render
// and the audit read the same arithmetic.
// ---------------------------------------------------------------------------
export type TextGlyph = {
  kind: "text";
  id: string;
  sx: number;
  capY: number;
  size: number;
  colour: string;
  opacity: number;
  align: "centre";
  rise: number;
  scale: number;
  dx: number;
};
export type PersonGlyph = {
  kind: "person";
  id: string;
  fx: number;
  fy: number;
  box: number;
  opacity: number;
  rise: number;
};
export type FlagGlyph = {
  kind: "flag";
  id: string;
  fx: number;
  fy: number;
  box: number;
  colour: string;
  opacity: number;
  rise: number;
  nod: number;
  stroke: number;
};
export type Glyph = TextGlyph | PersonGlyph | FlagGlyph;

/** A glyph's screen box, the one ruler the audit and the layout share. */
export const glyphBox = (gl: Glyph) => {
  if (gl.kind === "text") {
    const w = emWidth(gl.id.includes(":") ? gl.id.split(":").slice(1).join(":") : gl.id) * gl.size;
    return {
      x0: gl.sx - w / 2 + gl.dx,
      x1: gl.sx + w / 2 + gl.dx,
      y0: gl.capY + gl.rise,
      y1: gl.capY + gl.rise + CAP_H * gl.size,
    };
  }
  if (gl.kind === "person") {
    const ink = gl.box * PERSON_INK;
    return {
      x0: gl.fx - ink / 2,
      x1: gl.fx + ink / 2,
      y0: gl.fy - gl.box * PERSON_FOOT + gl.rise,
      y1: gl.fy + gl.box * (1 - PERSON_FOOT) + gl.rise,
    };
  }
  return {
    x0: gl.fx - (gl.box * 4) / 24,
    x1: gl.fx + (gl.box * 16) / 24,
    y0: gl.fy - (gl.box * 19) / 24 + gl.rise,
    y1: gl.fy + gl.rise,
  };
};

export const sceneAt = (g: number, ink = "#FFFFFF", accent = ACCENT, accentDeep = ACCENT_DEEP) => {
  const c = camHand(g);
  const k = c.k;
  const kp = Math.pow(k, TYPE_K);
  const S = (wx: number, wy: number): [number, number] => [
    FRAME_W / 2 + (wx - c.cx) * k,
    FRAME_H / 2 + (wy - c.cy) * k,
  ];
  const numSize = Math.max(NUM_SIZE * kp, NUM_MIN);
  const yearSize = Math.max(YEAR_SIZE * kp, YEAR_MIN);
  const tagSize = Math.max(TAG_SIZE * kp, TAG_MIN);
  const nameSize = NAME_SIZE * kp;
  const subSize = SUB_SIZE * kp;
  const personBox = Math.max(PERSON_H * kp, PERSON_MIN);
  const ugate = uNameGate(g);
  const abandon = ramp(g, HIT_F + 1, HIT_F + 9);

  // the column, stacked off the actual sizes so a floored numeral never eats
  // into its own gap
  const numCapBottom = -GAP_UP * kp;
  const numCapTop = numCapBottom - numSize * CAP_H;
  const personFootDy = numCapTop - CARD_RISE * kp;
  const yearCapTop = GAP_DOWN * kp;
  const nameCapTop = yearCapTop + yearSize * CAP_H + NAME_GAP * kp;
  const subCapTop = nameCapTop + nameSize * CAP_H + SUB_GAP * kp;

  const out: Glyph[] = [];
  const text = (
    id: string,
    sx: number,
    capY: number,
    size: number,
    colour: string,
    p: { o: number; rise: number },
    level = 1,
    scale = 1,
    dx = 0,
  ) => {
    if (p.o <= 0.002) return;
    out.push({
      kind: "text",
      id,
      sx,
      capY,
      size,
      colour,
      opacity: p.o * level,
      align: "centre",
      rise: p.rise,
      scale,
      dx,
    });
  };

  for (let i = 0; i < 7; i++) {
    const uv = uVis(g, P[i].x);
    const uvd = uVisDeep(g, P[i].x);
    if (uv <= 0.001) continue;
    const [sx, sy] = S(P[i].x, P[i].y);
    const lit = humanLevel(g, i);
    // P3's human card steps aside as the steep line leaves the landing THROUGH
    // it: the column is centred on the point, so a line climbing out of P3 is
    // drawn straight up through "100 MIN".
    const uCol = COL_OUT[i] > 0 ? uExit(g, COL_OUT[i]) : 1;
    const uCard = (CARD_OUT[i] > 0 ? uExit(g, CARD_OUT[i]) : 1) * uCol;

    // person + numeral, above the point
    if (HAS_PERSON[i] && PERSON_IN[i] > 0) {
      const p = presence(uEnter(g, PERSON_IN[i]), uv, uCard);
      if (p.o > 0.002) {
        out.push({
          kind: "person",
          id: `person${i}`,
          fx: sx,
          fy: sy + personFootDy,
          box: personBox,
          opacity: p.o * lit,
          rise: p.rise,
        });
      }
    }
    const nt = NUM_TXT[i];
    if (nt) {
      // the "?" leaves on the frame the question is answered
      const p = presence(uEnter(g, NUM_IN[i]), uv, uCard, i === 6 ? uExit(g, HIT_F) : 1);
      const pulse = i === 3 ? 1 + 0.08 * settle(g, 1361, 16) : 1;
      const bob =
        i === 6
          ? 6 * Math.sin((g - 1215) / 5.2) * ramp(g, 1215, 1223) * (1 - ramp(g, 1241, 1255))
          : 0;
      text(`num${i}:${nt}`, sx, sy + numCapTop + bob, numSize, ink, p, lit, pulse);
    }

    // year, name, sub, below the point
    const yt = YEAR_TXT[i];
    const turn = i === 4 ? ramp(g, HIT_F, HIT_F + 8) : 0;
    const ycol = YEAR_REACHED[i] ? accent : mixHex(ink, accent, turn);
    const ylevel = YEAR_REACHED[i]
      ? WHITE_FULL
      : WHITE_SOFT + (WHITE_FULL - WHITE_SOFT) * turn;
    const shake = i === 4 ? 7 * settle(g, 1534, 18) * Math.sin((g - 1534) * 1.1) : 0;
    text(
      `year${i}:${yt}`,
      sx,
      sy + yearCapTop,
      yearSize,
      ycol,
      presence(uEnter(g, YEAR_IN[i]), uv, uCol),
      ylevel,
      1,
      shake,
    );

    const nm = NAME_TXT[i];
    if (nm) {
      text(
        `name${i}:${nm}`,
        sx,
        sy + nameCapTop,
        nameSize,
        ink,
        presence(uEnter(g, NAME_IN[i]), uvd, ugate, uCol),
        WHITE_SOFT,
      );
    }
    const sb = SUB_TXT[i];
    if (sb) {
      text(
        `sub${i}:${sb}`,
        sx,
        sy + subCapTop,
        subSize,
        ink,
        presence(uEnter(g, SUB_IN[i]), uvd, ugate, uCol),
        WHITE_SOFT,
      );
    }
  }

  // the X10 tags, on the risers the line has walked
  for (let i = 0; i < TAG_IN.length; i++) {
    const t = tagPos(i, kp, k);
    const p = presence(
      uEnter(g, TAG_IN[i]),
      uVis(g, t.x),
      TAG_OUT[i] > 0 ? uExit(g, TAG_OUT[i]) : 1,
    );
    const col = i === 3 ? mixHex(accent, accentDeep, abandon) : accent;
    const [gx, gy] = S(t.x, t.y);
    text(`tag${i}:X10`, gx, gy - (CAP_H * tagSize) / 2, tagSize, col, p);
  }

  // the flag on the level
  {
    const p = presence(uEnter(g, 1190), uVis(g, flagX(g)));
    if (p.o > 0.002) {
      const box = PERSON_H * kp;
      const [fx, fy] = S(flagX(g), LEVEL_Y);
      out.push({
        kind: "flag",
        id: "flag",
        fx,
        fy,
        box,
        colour: mixHex(ink, accent, ramp(g, HIT_F, HIT_F + 8)),
        opacity: p.o,
        rise: p.rise,
        nod: flagNod(g),
        stroke: (GLYPH_W * kp * 24) / box,
      });
    }
  }
  return { cam: c, k, kp, glyphs: out };
};

// ---------------------------------------------------------------------------

const Label: React.FC<{ gl: TextGlyph; shadow: string }> = ({ gl, shadow }) => {
  const txt = gl.id.includes(":") ? gl.id.split(":").slice(1).join(":") : gl.id;
  return (
    <div
      style={{
        position: "absolute",
        left: gl.sx + gl.dx,
        top: gl.capY - CAP_TOP * gl.size,
        transform:
          `translateX(-50%) translateY(${gl.rise.toFixed(2)}px)` +
          (gl.scale === 1 ? "" : ` scale(${gl.scale.toFixed(4)})`),
        transformOrigin: "50% 50%",
        whiteSpace: "nowrap",
        fontFamily: roboto.fontFamily,
        fontWeight: 700,
        fontSize: gl.size,
        lineHeight: 1,
        color: gl.colour,
        opacity: gl.opacity,
        filter: shadow,
      }}
    >
      <span style={{ letterSpacing: `${TRACK}em`, marginRight: `${-TRACK}em` }}>{txt}</span>
    </div>
  );
};

const NoamTrendLineV2: React.FC<Props> = ({
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

  const scene = sceneAt(g, ink, accent, accentDeep);
  const { k, kp } = scene;
  const cx = scene.cam.cx;
  const cy = scene.cam.cy;
  const { tx, ty } = worldTransform(cx, cy, k);

  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);
  const iconS = iconShadow(1, iconShadowY, iconShadowBlur, iconShadowOpacity);

  /** A world length that should read as `px` SCREEN px, expressed in the world
   *  SVG's own units (it lives under scale(k)). */
  const w = (px: number) => (px * kp) / k;
  const stroke = w(LINE_W);
  const pointR = w(POINT_R);
  const breathe = 1 + 0.015 * Math.sin(g * 0.083);

  const hu = headU(g);
  const pa = projA(g);
  const pb = projB(g);
  const pc = projC(g);
  const su = steepU(g);
  const brU = bracketU(g);
  const lvl = levelIn(g);
  const abandon = ramp(g, HIT_F + 1, HIT_F + 9);
  const projCol = mixHex(accent, accentDeep, abandon);

  const dash = `${w(DASH_ON)} ${w(DASH_OFF)}`;
  const march = (f0: number) => (g <= f0 ? 0 : -w((g - f0) * MARCH_PX));

  // the solid trend line, as a polyline
  const solid: { x: number; y: number }[] = [];
  if (g >= 345) {
    const n = Math.floor(hu);
    for (let i = 0; i <= n; i++) solid.push(P[i]);
    if (hu > n) solid.push(lineAt(hu));
  }
  const solidD = solid
    .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const packets = packetsAt(g);
  const projSegs = [
    { a: P[3], b: P[4], u: pa, f0: 1400 },
    { a: P[4], b: P[5], u: pb, f0: 1577 },
    { a: P[5], b: P[6], u: pc, f0: 1601 },
  ];

  // the white tick running up the human side, cut 5
  const tickU = clamp01((g - TICK_F0) / (TICK_F1 - TICK_F0));
  const tickAlive = g >= TICK_F0 && g <= TICK_F1 + 8 ? 1 - clamp01((g - TICK_F1) / 8) : 0;
  const tickA = { x: P[0].x, y: P[0].y - (GAP_UP * kp + 60 * kp) / k };
  const tickB = { x: P[2].x, y: P[2].y - (GAP_UP * kp + 60 * kp) / k };

  const bracketX = P[4].x + BRACKET_DX;

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
            {/* the Millennium level: dashed, and marching once it is in */}
            {lvl > 0.002 ? (
              <g style={{ filter: icon }} opacity={WHITE_SOFT * lvl}>
                <line
                  x1={LEVEL_X0}
                  y1={LEVEL_Y + ((1 - lvl) * RISE) / k}
                  x2={LEVEL_X1}
                  y2={LEVEL_Y + ((1 - lvl) * RISE) / k}
                  stroke={ink}
                  strokeWidth={stroke}
                  strokeLinecap="butt"
                  strokeDasharray={dash}
                  strokeDashoffset={march(1130)}
                />
              </g>
            ) : null}

            {/* the measuring bracket, beside P4's column */}
            {brU > 0.001 ? (
              <g style={{ filter: icon }}>
                <line
                  x1={bracketX}
                  y1={P[4].y}
                  x2={bracketX}
                  y2={P[4].y + (LEVEL_Y - P[4].y) * brU}
                  stroke={ink}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                />
                <line
                  x1={bracketX - w(20)}
                  y1={P[4].y}
                  x2={bracketX + w(20)}
                  y2={P[4].y}
                  stroke={ink}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                />
                {brU > 0.97 ? (
                  <line
                    x1={bracketX - w(20)}
                    y1={LEVEL_Y}
                    x2={bracketX + w(20)}
                    y2={LEVEL_Y}
                    stroke={ink}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                  />
                ) : null}
              </g>
            ) : null}

            {/* the lead run: the dashes that take the camera to the level */}
            {(() => {
              const r = leadRun(g);
              if (r.s1 - r.s0 < 6 || g < 1059) return null;
              const a = extPoint(r.s0);
              const b = extPoint(r.s1);
              return (
                <g style={{ filter: icon }}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={accent}
                    strokeWidth={stroke}
                    strokeLinecap="butt"
                    strokeDasharray={dash}
                    strokeDashoffset={march(1059)}
                  />
                </g>
              );
            })()}

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

            {/* the points. Reached landings are solid orange; projected ones
                are hollow rings. */}
            <g style={{ filter: icon }}>
              {P.map((p, i) => {
                const inF = POINT_IN[i];
                const dur = POINT_DUR[i];
                if (g < inF - dur) return null;
                const e = smoothstep(clamp01((g - (inF - dur)) / dur));
                const bump = i === 3 ? 1 + 0.09 * settle(g, 919, 14) : 1;
                const r = pointR * e * breathe * bump;
                if (!IS_RING[i]) {
                  return <circle key={`p${i}`} cx={p.x} cy={p.y} r={r} fill={accent} />;
                }
                return (
                  <circle
                    key={`p${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={r}
                    fill="none"
                    stroke={i === 6 ? projCol : projCol}
                    strokeWidth={stroke}
                  />
                );
              })}
            </g>

            {/* the white tick running up the human side, cut 5 */}
            {tickAlive > 0.001 ? (
              <g style={{ filter: icon }} opacity={tickAlive}>
                <circle
                  cx={tickA.x + (tickB.x - tickA.x) * tickU}
                  cy={tickA.y + (tickB.y - tickA.y) * tickU}
                  r={w(9)}
                  fill={ink}
                />
              </g>
            ) : null}
          </svg>
        </div>

        {/* the soft layer: type and glyphs, base x k^0.75 */}
        {scene.glyphs.map((gl) => {
          if (gl.kind === "text") return <Label key={gl.id} gl={gl} shadow={iconS} />;
          if (gl.kind === "person") {
            return (
              <Img
                key={gl.id}
                src={staticFile(personSrc)}
                style={{
                  position: "absolute",
                  left: gl.fx - gl.box / 2,
                  top: gl.fy - gl.box * PERSON_FOOT,
                  width: gl.box,
                  height: gl.box,
                  objectFit: "contain",
                  filter: `brightness(0) invert(1) ${iconS}`,
                  opacity: gl.opacity,
                  transform: `translateY(${gl.rise.toFixed(2)}px)`,
                }}
              />
            );
          }
          return (
            <div
              key={gl.id}
              style={{
                position: "absolute",
                left: gl.fx - (gl.box * 4) / 24,
                top: gl.fy - (gl.box * 22) / 24,
                width: gl.box,
                height: gl.box,
                opacity: gl.opacity,
                transformOrigin: `${((gl.box * 4) / 24).toFixed(2)}px ${((gl.box * 22) / 24).toFixed(2)}px`,
                transform: `translateY(${gl.rise.toFixed(2)}px) rotate(${gl.nod.toFixed(2)}deg)`,
                filter: iconS,
              }}
            >
              <svg width={gl.box} height={gl.box} viewBox="0 0 24 24" style={{ overflow: "visible" }}>
                {FLAG_PATHS.map((d, i) => (
                  <path
                    key={`f${i}`}
                    d={d}
                    fill="none"
                    stroke={gl.colour}
                    strokeWidth={gl.stroke}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
            </div>
          );
        })}
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default NoamTrendLineV2;

// ---------------------------------------------------------------------------
// Handles for the audit: the camera, the scene and the reveal schedule, so the
// checks run on the same arithmetic the frames do.
// ---------------------------------------------------------------------------
export const AUDIT = {
  P,
  LEVEL_Y,
  LEVEL_X0,
  LEVEL_X1,
  SEG_LEN,
  HIT,
  BRACKET_DX,
  FLAG_HOME,
  camAt,
  camHand,
  sceneAt,
  glyphBox,
  emWidth,
  headU,
  projA,
  leadRun,
  extPoint,
  projB,
  projC,
  steepU,
  bracketU,
  levelIn,
  packetsAt,
  tagPos,
  flagX,
  vis,
  nameGate,
  humanLevel,
  fadeBand,
  SLOPE,
  TYPE_K,
  NUM_SIZE,
  NUM_MIN,
  PERSON_MIN,
  YEAR_SIZE,
  YEAR_MIN,
  NAME_SIZE,
  SUB_SIZE,
  TAG_SIZE,
  PERSON_H,
  PERSON_INK,
  PERSON_FOOT,
  CAP_H,
  CAP_TOP,
  GAP_UP,
  GAP_DOWN,
  POINT_R,
  POINT_IN,
  POINT_DUR,
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
  HEAD_LEAVE,
  HIT_F,
  K_SEGS,
  P_SEGS,
  CAM_LIFT,
  K_FOLLOW,
  FADE_D0,
  FADE_D1,
};
