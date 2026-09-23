import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import {
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  camMove,
  clamp,
  clamp01,
  smoothstep,
} from "./fieldShared";
import { OPENAI } from "./brandGlyphs";

const { fontFamily } = loadFont("normal", {
  weights: ["800", "900"],
  subsets: ["latin"],
});

// ---------------------------------------------------------------------------
// `anna - chatgpt knows my cottage cheese` — THE WORLD both cuts stand in.
//
//   cut 1  FeedEverything   (9.05 s)   "I feed everything I eat into ChatGPT to
//                                        calculate my calories"
//   cut 2  WhereDoesThatGo  (21.20 s)  "it knows how much cottage cheese I had at
//                                        like 10 a.m. on a Wednesday. Is that
//                                        good? Where does that go?"
//
// Core memory podcast graphic standard (reference `PeakForSolar.tsx`): 1080x1920,
// 24 fps, OPAQUE, dimmed + blurred squared paper at parallax 0.15, white ink on a
// +4/+4 world-px hard black shadow drawn as an SVG copy, Barlow 800/900 caps.
// Everything that decides how the clip LOOKS lives here; a cut decides what
// happens in it and where its camera goes. Cut 2 imports this file and never
// edits it — changes that affect cut 2 are logged in the scratchpad's
// SHARED_CHANGES.md.
//
// THE ARTEFACT IS LITERAL: one ChatGPT chat, drawn in the paper/ink material, as
// a single centred WINDOW that is the same object at the same size in both cuts.
//   HEADER      the OpenAI mark (white, filled, 108 world px box) + "CHATGPT"
//               (Barlow 900, 68), the lockup centred on x 540. Fixed to the
//               window, never to the scroll.
//   LOG         exchanges stacked bottom-up above the input bar. A new exchange
//               enters at the bottom and pushes the stack up by exactly its own
//               height; anything pushed above `CLIP_Y` (36 px under the header)
//               is CLIPPED there — it slides under the header and thins away,
//               its shadow clipped with it. No alpha, no pop. The clip line
//               sits 6 px under the slot boundary so nothing of a scrolled-out
//               exchange (its numeral's shadow) survives under the header.
//   USER PILL   white rounded rect (r 28), RIGHT-aligned to the column's right
//               edge, BLACK Barlow 800 60 px caps, padding 32 h / 22 v, on the
//               hard shadow.
//   AI REPLY    LEFT-aligned to the column's left edge: one line of 3-4 white
//               word-bars (28 tall, pill ends) and under it the answer in white
//               Barlow 900 70 px on the hard shadow. The whole reply is WRITTEN
//               behind a white caret on ONE clock at a steady `REPLY_V` world
//               px/frame along the writing path: the bars grow continuously
//               behind the caret, then each character of the answer appears
//               whole once the written end has passed it. The caret glides at
//               that one speed (never faster than the cap), grows in over 3 f
//               before the clock starts and thins away over 4 f when the
//               answer is whole.
//   INPUT BAR   white capsule, full column width x 120, on the hard shadow; a
//               BLACK caret (never blinks); a black send button r 38 at its
//               right end with a white Lucide `arrow-up` on the piece's one
//               stroke weight (6 world px). Typed text is black Barlow 800 60,
//               typed 1 character per frame (or on a per-character schedule),
//               RIGHT-aligned against the caret — see DEVIATIONS.
//   SEND        the typed line lifts out of the input bar inside its own pill
//               and rises into the log's bottom slot on ONE smoothstep over
//               `SEND_F` frames; the log scrolls up by exactly that exchange's
//               height on the SAME clock (the pill's y and the scroll are one
//               number). The pill's x follows on a clock delayed by 15 % so it
//               clears the send button before it drifts right. While the pill
//               is inside the input bar its shadow is drawn UNDER the bar's
//               white and its body is clipped to OUTSIDE the bar's capsule, so
//               the pill emerges from the bar's top edge with the typed line
//               riding in it, and never covers the caret or the button. The arrow
//               nudges up 6 px and back with the send; nothing else on the
//               button moves.
//
// THE COLOURS, raw hex, no filter, no blend, no gradient, no glow, no fade:
//   ink #FFFFFF · shadow/type-on-white #000000 · paper base #C0C0C0
//   chain orange #FFB765 · purple #BC37FF · blue #0046FF — exported for cut 2,
//   where they have ONE job: the copy of her data that leaves. Never in cut 1.
//
// ---------------------------------------------------------------------------
// VERIFIED DATA — USDA FoodData Central, SR Legacy. These labels and numbers
// and nothing else; no interpolations.
//   entry                  reply      source
//   TOAST                  81 KCAL    FDC 172688 whole-wheat bread, 252 kcal/100 g,
//                                     1 slice 32 g = 80.6
//   APPLE                  95 KCAL    FDC 171688, 52 kcal/100 g, medium 182 g = 94.6
//   2 EGGS                 143 KCAL   FDC 171287, 143 kcal/100 g, large egg 50 g
//   BLACK COFFEE           2 KCAL     FDC 171890, 1 kcal/100 g, 1 cup 237 g = 2.4
//   BANANA                 105 KCAL   FDC 173944, 89 kcal/100 g, medium 118 g = 105.0
//   1 CUP COTTAGE CHEESE   183 KCAL   FDC 172182 cottage cheese 2%, 81 kcal/100 g,
//                                     1 cup 226 g = 183.1
// Log order over the clip: TOAST, APPLE (history when cut 1 opens), then 2 EGGS,
// BLACK COFFEE, BANANA (sent in cut 1), then 1 CUP COTTAGE CHEESE (sent in cut 2).
//
// ---------------------------------------------------------------------------
// THE GEOMETRY, world px. World = screen at the resting camera (k 1, cx 540,
// cy 960), so every number below is also where it sits in the resolved frame.
//   column         x 120 .. 960 (840), centred on 540
//   window         y 239 .. 1427 ink (+4 shadow -> 1431), 1188 tall, its
//                  ink+shadow centre ON 835 — the caption-safe content centre
//   header mark    y 239 .. 347, lockup x 328.5 .. 751.5
//   LOG_TOP        377    (mark bottom + 30): the top slot boundary
//   CLIP_Y         383    (LOG_TOP + 6): where the log is clipped — a scrolled-
//                         out exchange's numeral shadow reaches LOG_TOP + 4.8
//   log            377 .. 1238.3 = three regular exchanges of 287.1 exactly
//   input bar      y 1307 .. 1427, x 120 .. 960, r 60; send button (900, 1367)
//   ONE EXCHANGE   gap 68.7 | pill 86 | [stamp row 48] | 28 | bars 28 | 26 |
//                  numeral ink 50.4. The gap above a pill equals the gap between
//                  the last numeral and the input bar (68.7), solved from the
//                  1188 window. A STAMPED exchange (cut 2) is 48 taller; since
//                  48 < 68.7, the oldest visible pill still clears LOG_TOP by
//                  20.7 (CLIP_Y by 14.7) when a stamped exchange is the newest.
//   Barlow metrics were measured off the shipped v13 webfont (the exact files
//   `@remotion/google-fonts` loads) with canvas `measureText`, kerning on; the
//   pair model below reproduces whole-string widths exactly (checked:
//   "1 CUP COTTAGE CHEESE" 10536/1000 em at 800, "143 KCAL" 4220/1000 at 900).
//   Cap height 0.700 em; digits 0.708 up / 0.012 down.
//
// ---------------------------------------------------------------------------
// API — for cut 2 (and anyone else). All pure; no hooks anywhere in this file.
//
//   Constants   FPS, WHITE, BLACK, ORANGE, PURPLE, BLUE, PAPER_BASE, SHADOW (4),
//               STROKE (6), FONT (Barlow family), ENTRY_SIZE/WEIGHT,
//               NUM_SIZE/WEIGHT, HDR_SIZE, STAMP_SIZE (44), CAP, COL_L/COL_R,
//               PILL_H/PILL_R/PILL_PAD_H/PILL_PAD_V, BAR_H, EX_GAP, EXH,
//               STAMP_ROW_H, LOG_TOP, CLIP_Y, LOG_BOTTOM, SEND_F, REPLY_V,
//               REPLY_LAG.
//   Rects       WINDOW, HEADER, INPUT_BAR, SEND_BUTTON — world rects {x0,y0,x1,y1}
//               (ink; add SHADOW on the right/bottom for the shadow's extent).
//   Text        widthOf(text, weight, size) — the advance width, kerned.
//               pillWidth(entry).
//   Data        FOOD.{toast,apple,eggs,coffee,banana,cheese}: {entry, reply,
//               bars, source}.
//   Camera      K_OPEN, CX_OPEN, C_OPEN, CY_OPEN (cut 1's opening framing, tight
//               on the input bar, header just off the top);
//               K_REST, CX_REST, C_REST, CY_REST (the whole window on 835);
//               runCamera2 (PeakForSolar's damped tracker with an x channel);
//               CFE_CAM_F/K/CY/CX (cut 1's keys) and CFE_RESOLVED {k, cx, cy}
//               (cut 1's camera at its last frame, without sway);
//               worldToScreen(x, y, cam).
//   Log         makeLog(specs: ExchangeSpec[]) -> Log. An ExchangeSpec is a
//               FOOD row plus optional timings in the CUT'S OWN frames:
//                 typeAt   number = first character, then 1 char/frame; or an
//                          array = the frame each character appears
//                 sendAt   the frame the send starts
//                 sendF    that send's duration in frames (default SEND_F);
//                          added after SHARED_READY, see SHARED_CHANGES.md
//                 replyAt  the frame the reply clock starts
//                          (default sendAt + REPLY_LAG)
//                 replyRate world px/frame (default REPLY_V)
//                 replyStop world px of writing path, or "bars" (the end of the
//                          word-bars): the clock never passes it and the caret
//                          stays — a reply can be mid-writing at a cut's end
//                 stamp    true = reserve a STAMP ROW (STAMP_ROW_H) under the pill;
//                          the row is part of the exchange height so the scroll
//                          accounts for it. Cut 2 draws the stamp text itself.
//               An exchange with no sendAt is HISTORY: sent and fully answered
//               before f0. `CUT2_HISTORY` is cut 1's five exchanges as history —
//               cut 2's f0 log is `makeLog([...CUT2_HISTORY, cheeseSpec])` and it
//               matches cut 1's last frame exactly (TOAST and APPLE scrolled away
//               above CLIP_Y, 2 EGGS / BLACK COFFEE / BANANA in the three slots).
//               Log getters (world coords, any frame):
//                 top(i, f)        exchange i's top edge
//                 geom(i, f)       {top, pillY0, pillY1, stampY0, stampY1,
//                                  stampBaseline (for a STAMP_SIZE stamp,
//                                  right-aligned at COL_R), barsY, numBaseline,
//                                  bottom}
//                 pillRect(i, f)   the pill's rect wherever it is (input bar,
//                                  in flight, landed)
//                 sendU(i, f)      0..1 linear send progress
//                 sendE(i, f)      the eased scroll/rise clock
//                 reply(i, f)      the reply's writing state
//                 typing(f)        {i, text} being typed in the input bar
//   Drawing     <World>       paper + camera + the world <svg>; children are SVG.
//               <LogWindow>   the whole window as an SVG <g> for frame f. Slots:
//                 underPill(i, rect)  drawn BETWEEN exchange i's pill shadow and
//                                     its white, inside the log clip (the
//                                     place for colour copies that "peek from
//                                     behind" a pill, PeakForSolar-crown style)
//                 overExchange(i, g)  drawn after exchange i, inside the log clip
//                                     and moving with it (the place for a stamp)
//               <Pill x1 y0 entry …>  a pill + its text at any world position
//                                     (right edge x1, top y0); `fill`,
//                                     `textFill`, `shadow`, `text` let a cut
//                                     draw a white copy or a flat colour
//                                     silhouette of the same shape.
//               <ShadowedText>, <PaperGround>.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief (world design), and why.
//   * TYPED TEXT IS RIGHT-ALIGNED against a fixed black caret beside the send
//     button, not left-aligned like the phone app. The brief's SEND is a pill
//     that "lifts out and rises" in ~8-10 f under a 45 px/frame cap. From a
//     left-aligned field the pill has to cross ~350-510 px sideways as well as
//     rise ~300 (BLACK COFFEE / BANANA), which is 17-22 f at the cap. Typed
//     against the button, every entry leaves from under its own slot and the
//     sideways drift is 116 px: the send is a rise, as the brief describes it.
//   * K_OPEN IS 1.12, NOT ~1.6. The column is 840 wide; at k 1.6 the frame
//     shows 675 world px, so the right-aligned pill slot (x 960) and the
//     left-aligned reply (x 120, written from f15) cannot both be in frame, and
//     any k above 1.132 puts the column outside screen x 60-1020. 1.12 is the
//     tightest camera that keeps the whole column inside the band (sway
//     included). The header is still off the top of frame at f0 and enters on
//     the camera's rise.
//   * TYPE IS 60 / 70 / 68 (entry / answer / CHATGPT), mark 108, rather than
//     ~56 / ~64 / ~64 / ~104: K_REST is 1.0 (the band is width-bound at 1.13
//     and the open needs headroom above it for the pull-back), so these are the
//     brief's sizes as they would read at its implied ~1.1 rest.
//   * SEND_F IS 13, not ~8-10: the first send runs at k 1.12 and 312 world px of
//     travel on a smoothstep peaks at 1.5x its mean speed; 13 f keeps it under
//     45 screen px/frame.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const FONT = fontFamily;

// --- colour ----------------------------------------------------------------
export const WHITE = "#FFFFFF";
export const BLACK = "#000000";
export const ORANGE = "#FFB765";
export const PURPLE = "#BC37FF";
export const BLUE = "#0046FF";
export const PAPER_BASE = "#C0C0C0";

/** The hard shadow: +4/+4 WORLD px, zero blur, an SVG copy. */
export const SHADOW = 4;
/** The piece's one stroke weight, world px (the send arrow). */
export const STROKE = 6;

// --- paper -------------------------------------------------------------------
export const PAPER_SRC = "paper-supaclean-still.png";
export const PARALLAX = 0.15;
export const PAPER_DIM = 0.88;
export const PAPER_BLUR = 3;
export const PAPER_DRIFT = 0.3; // px/frame, upward
/** PeakForSolar's local oversize: the paper is 0.7985 of source at k 1 and
 *  never passes 1.0x of source below k 1.8. */
export const BG_OVERSIZE = 1.6;

// --- type ------------------------------------------------------------------
export const CAP = 0.7;
export const DIGIT_ASC = 0.708;
export const DIGIT_DESC = 0.012;
export const ENTRY_SIZE = 60;
export const ENTRY_WEIGHT = 800;
export const NUM_SIZE = 70;
export const NUM_WEIGHT = 900;
export const HDR_SIZE = 68;
export const HDR_WEIGHT = 900;
/** The stamp cut 2 draws in a reserved row (Barlow 800). */
export const STAMP_SIZE = 44;
export const STAMP_WEIGHT = 800;

// Advance widths and pair kerning, units per 1000 em, measured off the shipped
// Barlow v13 latin webfonts (weights 800 and 900). See the header.
const ADV_800: Record<string, number> = {
  "0": 571, "1": 355, "2": 568, "3": 548, "4": 624, "5": 547, "6": 545, "7": 504, "8": 549,
  "9": 534, "A": 694, "B": 617, "C": 609, "D": 618, "E": 577, "F": 557, "G": 612, "H": 619,
  "I": 265, "J": 585, "K": 631, "L": 573, "M": 714, "N": 662, "O": 621, "P": 598, "Q": 600,
  "R": 614, "S": 599, "T": 590, "U": 623, "V": 634, "W": 902, "X": 646, "Y": 635, "Z": 559,
  " ": 200, ":": 373, "\u00b7": 244, ".": 267, ",": 265, "'": 181, "-": 414, "?": 543, "%": 816,
};
const KERN_800: Record<string, number> = {
  "11": 9, "21": -3, "23": -17, "31": -1, "41": -97, "47": -87, "51": -5, "61": -3, "71": 9,
  "81": -5, "91": -20, "AC": -25, "AG": -25, "AJ": -5, "AO": -25, "AQ": -25, "AS": -47,
  "AT": -93, "AU": -17, "AV": -9, "AW": -9, "AY": -94, "AZ": 4, "A'": -110, "A-": -19, "BA": -43,
  "BT": -24, "BV": -28, "BW": -28, "BX": -35, "BY": -49, "B.": -3, "B,": -3, "CA": -21, "CJ": 4,
  "CT": -8, "CV": -17, "CW": -17, "CY": -33, "C.": -1, "C,": -1, "C-": -2, "DA": -43, "DT": -24,
  "DV": -28, "DW": -28, "DX": -35, "DY": -49, "D.": -3, "D,": -3, "EV": 3, "EW": 3, "FA": -88,
  "FC": -1, "FG": -1, "FJ": -72, "FO": -1, "FQ": -1, "F:": -17, "F.": -102, "F,": -102,
  "F-": -64, "GA": -21, "GJ": 4, "GT": -8, "GV": -17, "GW": -17, "GY": -33, "G.": -1, "G,": -1,
  "G-": -2, "HA": 1, "IH": -1, "JA": -23, "JC": -3, "JG": -3, "JO": -3, "JQ": -3, "J.": -3,
  "J,": -3, "KA": 5, "KC": -35, "KG": -35, "KJ": -28, "KO": -35, "KQ": -35, "KS": -26, "KX": 3,
  "K-": -43, "LA": 8, "LC": -10, "LG": -10, "LO": -10, "LQ": -10, "LT": -80, "LV": -46,
  "LW": -46, "LY": -62, "L'": -121, "NB": -3, "ND": -3, "NE": -3, "NF": -3, "NN": -3, "NP": -3,
  "OA": -21, "OJ": 4, "OT": -8, "OV": -17, "OW": -17, "OY": -33, "O.": -1, "O,": -1, "O-": -2,
  "PA": -68, "PJ": -35, "PV": -23, "PW": -23, "PX": -43, "PY": -43, "P.": -7, "P,": -7,
  "P-": -33, "QA": -33, "QJ": 4, "QT": -17, "QV": -43, "QW": -43, "QX": -43, "QY": -56, "Q.": -1,
  "Q,": -1, "Q-": -2, "RA": 7, "RT": -2, "RV": -26, "RW": -26, "RX": 3, "RY": -35, "R-": -9,
  "SJ": 1, "ST": -4, "SV": -25, "SW": -25, "SX": -45, "SY": -34, "S.": -3, "S,": -3, "TA": -67,
  "TC": -20, "TG": -20, "TJ": -61, "TO": -20, "TQ": -20, "TS": -7, "T.": -87, "T,": -87,
  "T-": -89, "UA": -23, "UC": -3, "UG": -3, "UO": -3, "UQ": -3, "U.": -3, "U,": -3, "VA": -104,
  "VB": -3, "VC": -37, "VD": -3, "VE": -3, "VF": -3, "VG": -37, "VJ": -61, "VK": -5, "VN": -3,
  "VO": -37, "VP": -3, "VQ": -37, "VS": -26, "V:": -55, "V.": -60, "V,": -60, "V-": -66,
  "WA": -104, "WB": -3, "WC": -37, "WD": -3, "WE": -3, "WF": -3, "WG": -37, "WJ": -61, "WK": -5,
  "WN": -3, "WO": -37, "WP": -3, "WQ": -37, "WS": -26, "W:": -55, "W.": -60, "W,": -60,
  "W-": -66, "XB": -1, "XC": -35, "XD": -1, "XE": -1, "XF": -1, "XG": -35, "XJ": -17, "XN": -1,
  "XO": -35, "XP": -1, "XQ": -35, "XS": -29, "X:": -9, "X-": -39, "YA": -140, "YB": -3,
  "YC": -38, "YD": -3, "YE": -3, "YF": -3, "YG": -38, "YJ": -82, "YN": -3, "YO": -38, "YP": -3,
  "YQ": -38, "YS": -35, "Y:": -82, "Y.": -97, "Y,": -97, "Y-": -85, "01": -5, "4'": -43,
  "7.": -73, "7,": -73, ".T": -87, ".V": -43, ".W": -43, ".Y": -87, ".0": -23, ".-": -4,
  ",T": -87, ",V": -43, ",W": -43, ",Y": -87, ",0": -23, ",-": -4, "'A": -100, "'J": -77,
  "'4": -26, "'-": -50, "-T": -10, "-7": -95, "-.": -18, "-,": -18, "-'": -35, "--": -179,
};
const ADV_900: Record<string, number> = {
  "0": 573, "1": 356, "2": 576, "3": 556, "4": 641, "5": 555, "6": 552, "7": 511, "8": 556,
  "9": 537, "A": 714, "B": 615, "C": 609, "D": 618, "E": 570, "F": 554, "G": 611, "H": 611,
  "I": 266, "J": 587, "K": 636, "L": 574, "M": 714, "N": 658, "O": 621, "P": 600, "Q": 605,
  "R": 615, "S": 602, "T": 595, "U": 617, "V": 645, "W": 937, "X": 659, "Y": 651, "Z": 562,
  " ": 200, ":": 381, "\u00b7": 252, ".": 264, ",": 265, "'": 193, "-": 419, "?": 562, "%": 809,
};
const KERN_900: Record<string, number> = {
  "11": 10, "23": -20, "41": -98, "47": -100, "71": 10, "91": -20, "AC": -28, "AG": -28,
  "AJ": -10, "AO": -28, "AQ": -28, "AS": -50, "AT": -100, "AU": -20, "AY": -99, "A'": -119,
  "A-": -20, "BA": -48, "BT": -28, "BV": -30, "BW": -30, "BX": -40, "BY": -57, "CA": -26,
  "CT": -8, "CV": -20, "CW": -20, "CY": -38, "C-": -2, "DA": -48, "DT": -28, "DV": -30,
  "DW": -30, "DX": -40, "DY": -57, "FA": -97, "FJ": -80, "F:": -20, "F.": -110, "F,": -110,
  "F-": -70, "GA": -26, "GT": -8, "GV": -20, "GW": -20, "GY": -38, "G-": -2, "JA": -27,
  "KC": -40, "KG": -40, "KJ": -32, "KO": -40, "KQ": -40, "KS": -30, "K-": -50, "LC": -11,
  "LG": -11, "LO": -11, "LQ": -11, "LT": -77, "LV": -50, "LW": -50, "LY": -72, "L'": -140,
  "OA": -26, "OT": -8, "OV": -20, "OW": -20, "OY": -38, "O-": -2, "PA": -78, "PJ": -40,
  "PV": -27, "PW": -27, "PX": -49, "PY": -49, "P-": -37, "QA": -38, "QT": -20, "QV": -50,
  "QW": -50, "QX": -50, "QY": -60, "Q-": -2, "RT": -2, "RV": -30, "RW": -30, "RY": -40,
  "R-": -10, "SV": -29, "SW": -29, "SX": -50, "SY": -39, "TA": -70, "TC": -14, "TG": -14,
  "TJ": -70, "TO": -14, "TQ": -14, "TS": -8, "T.": -100, "T,": -100, "T-": -94, "UA": -27,
  "VA": -106, "VC": -40, "VG": -40, "VJ": -70, "VO": -40, "VQ": -40, "VS": -30, "V:": -57,
  "V.": -60, "V,": -60, "V-": -70, "WA": -106, "WC": -40, "WG": -40, "WJ": -70, "WO": -40,
  "WQ": -40, "WS": -30, "W:": -57, "W.": -60, "W,": -60, "W-": -70, "XC": -40, "XG": -40,
  "XJ": -20, "XO": -40, "XQ": -40, "XS": -30, "X:": -10, "X-": -44, "YA": -154, "YC": -41,
  "YG": -41, "YJ": -95, "YO": -41, "YQ": -41, "YS": -40, "Y:": -90, "Y.": -100, "Y,": -100,
  "Y-": -90, "4'": -50, "7.": -80, "7,": -80, ".T": -100, ".V": -50, ".W": -50, ".Y": -100,
  ".0": -20, ",T": -100, ",V": -50, ",W": -50, ",Y": -100, ",0": -20, "'A": -109, "'J": -89,
  "'4": -30, "'-": -50, "-7": -110, "-.": -20, "-,": -20, "-'": -40, "--": -197,
};

const tables = (weight: number) =>
  weight >= 900 ? { adv: ADV_900, kern: KERN_900 } : { adv: ADV_800, kern: KERN_800 };

/** The kerned advance width of `text` in world px. Throws on a character the
 *  tables do not carry, so a cut finds out at render time, not by eye. */
export const widthOf = (text: string, weight: number, size: number) => {
  const { adv, kern } = tables(weight);
  let u = 0;
  for (let i = 0; i < text.length; i++) {
    const a = adv[text[i]];
    if (a === undefined) {
      throw new Error(`cottageShared.widthOf: no metric for "${text[i]}" in "${text}"`);
    }
    u += a;
    if (i > 0) {
      const k = kern[text[i - 1] + text[i]];
      if (k !== undefined) u += k;
    }
  }
  return (u * size) / 1000;
};

// --- the column ----------------------------------------------------------------
export const COL_L = 120;
export const COL_R = 960;
export const COL_W = COL_R - COL_L;
export const COL_CX = (COL_L + COL_R) / 2; // 540

// --- the header ------------------------------------------------------------------
export const MARK = 108;
export const MARK_GAP = 28;
export const HDR_PAD = 30; // mark bottom -> LOG_TOP (the slot boundary)

// --- one exchange ------------------------------------------------------------------
export const PILL_PAD_H = 32;
export const PILL_PAD_V = 22;
export const PILL_H = CAP * ENTRY_SIZE + 2 * PILL_PAD_V; // 86
export const PILL_R = 28;
export const GAP_PB = 28; // pill (or stamp row) -> bars
export const BAR_H = 28;
export const BAR_GAP = 20;
export const GAP_BN = 26; // bars -> numeral cap top
export const NUM_INK = (DIGIT_ASC + DIGIT_DESC) * NUM_SIZE; // 50.4
export const STAMP_ROW_H = 48;
/** row top -> the stamp's cap top, for a STAMP_SIZE stamp */
export const STAMP_GAP = 14;
const EX_CONTENT = PILL_H + GAP_PB + BAR_H + GAP_BN + NUM_INK; // 218.4

// --- the input bar ---------------------------------------------------------------
export const IB_H = 120;
export const IB_R = IB_H / 2;
export const BTN_R = 38;
/** The typed line's right edge; the caret sits CARET_GAP_IB right of it. */
export const IB_TEXT_R = 812;
export const IB_CARET_GAP = 10;
export const IB_CARET_W = 6;
export const IB_CARET_H = 60;
export const ARROW_BOX = 46; // the Lucide 24-unit box, drawn this big
export const ARROW_NUDGE = 6;

// --- the window: solved ---------------------------------------------------------
export const WIN_H = 1188;
/** The window's ink+shadow centre — the caption-safe content centre. */
export const WIN_CENTRE = 835;
/** The gap above every pill, and between the last numeral and the input bar,
 *  solved so three regular exchanges fill the log exactly. */
export const EX_GAP = (WIN_H - MARK - HDR_PAD - IB_H - 3 * EX_CONTENT) / 4; // 68.7
/** A regular exchange's height. A stamped one is EXH + STAMP_ROW_H. */
export const EXH = EX_GAP + EX_CONTENT; // 287.1
export const WIN_TOP = WIN_CENTRE - (WIN_H + SHADOW) / 2; // 239
export const WIN_BOTTOM = WIN_TOP + WIN_H; // 1427
export const MARK_Y0 = WIN_TOP;
export const MARK_Y1 = WIN_TOP + MARK; // 347
export const HDR_CY = WIN_TOP + MARK / 2; // 293
/** The slot boundary: the top of the oldest of the three visible exchanges. */
export const LOG_TOP = MARK_Y1 + HDR_PAD; // 377
/** The log's clip line. It sits SHADOW + 2 BELOW the slot boundary, so an
 *  exchange that has scrolled out of the three slots is gone entirely — its
 *  numeral's descent and hard shadow reach 4.8 px past its own bottom edge and
 *  would otherwise show as a sliver under the header. */
export const CLIP_Y = LOG_TOP + SHADOW + 2; // 383
export const LOG_BOTTOM = LOG_TOP + 3 * EXH; // 1238.3
export const IB_Y0 = LOG_BOTTOM + EX_GAP; // 1307
export const IB_Y1 = IB_Y0 + IB_H; // 1427
export const IB_CY = IB_Y0 + IB_H / 2; // 1367
export const BTN_CX = COL_R - IB_R; // 900
export const IB_BASELINE = IB_CY + (CAP * ENTRY_SIZE) / 2;
if (Math.abs(IB_Y1 - WIN_BOTTOM) > 1e-6) {
  throw new Error(`cottageShared: the window does not close (${IB_Y1} vs ${WIN_BOTTOM})`);
}

const HDR_TEXT_W = widthOf("CHATGPT", HDR_WEIGHT, HDR_SIZE);
const LOCKUP_W = MARK + MARK_GAP + HDR_TEXT_W;
export const LOCKUP_X0 = COL_CX - LOCKUP_W / 2;
export const HDR_TEXT_X = LOCKUP_X0 + MARK + MARK_GAP;
export const HDR_BASELINE = HDR_CY + (CAP * HDR_SIZE) / 2;

export type Rect = { x0: number; y0: number; x1: number; y1: number };
export const WINDOW: Rect = { x0: COL_L, y0: WIN_TOP, x1: COL_R, y1: WIN_BOTTOM };
export const HEADER: Rect = {
  x0: LOCKUP_X0,
  y0: MARK_Y0,
  x1: LOCKUP_X0 + LOCKUP_W,
  y1: MARK_Y1,
};
export const INPUT_BAR: Rect = { x0: COL_L, y0: IB_Y0, x1: COL_R, y1: IB_Y1 };
export const SEND_BUTTON: Rect = {
  x0: BTN_CX - BTN_R,
  y0: IB_CY - BTN_R,
  x1: BTN_CX + BTN_R,
  y1: IB_CY + BTN_R,
};

// --- the data ---------------------------------------------------------------------
export type Food = { entry: string; reply: string; bars: number[]; source: string };
export const FOOD = {
  toast: {
    entry: "TOAST",
    reply: "81 KCAL",
    bars: [110, 64, 140],
    source: "FDC 172688 whole-wheat bread, 252 kcal/100 g, 1 slice 32 g = 80.6",
  },
  apple: {
    entry: "APPLE",
    reply: "95 KCAL",
    bars: [86, 150, 58, 100],
    source: "FDC 171688, 52 kcal/100 g, medium 182 g = 94.6",
  },
  eggs: {
    entry: "2 EGGS",
    reply: "143 KCAL",
    bars: [94, 132, 70],
    source: "FDC 171287, 143 kcal/100 g, large egg 50 g",
  },
  coffee: {
    entry: "BLACK COFFEE",
    reply: "2 KCAL",
    bars: [124, 56, 98],
    source: "FDC 171890, 1 kcal/100 g, 1 cup 237 g = 2.4",
  },
  banana: {
    entry: "BANANA",
    reply: "105 KCAL",
    bars: [58, 98, 70],
    source: "FDC 173944, 89 kcal/100 g, medium 118 g = 105.0",
  },
  cheese: {
    entry: "1 CUP COTTAGE CHEESE",
    reply: "183 KCAL",
    bars: [104, 70, 146, 88],
    source: "FDC 172182 cottage cheese 2%, 81 kcal/100 g, 1 cup 226 g = 183.1",
  },
} satisfies Record<string, Food>;

export const pillWidth = (entry: string) =>
  widthOf(entry, ENTRY_WEIGHT, ENTRY_SIZE) + 2 * PILL_PAD_H;

// ---------------------------------------------------------------------------
// THE CAMERA — PeakForSolar's pattern: keys authored as eased per-frame curves
// (`camMove`), cy taken from an eased CONTENT CENTRE plus CAM_LIFT / k so the
// centre sits on screen y 835, then the house damper with an x channel.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.12;
export const K_REST = 1.0;
export const CX_OPEN = COL_CX;
export const CX_REST = COL_CX;
/** At the open the frame's top edge is this far (world px) below the header's
 *  shadow, so the lockup is wholly off-frame and enters on the rise. */
export const OPEN_CLEAR = 24;
/** The frame top in world y is c - 835 / k for a content centre c; solve c. */
export const C_OPEN = MARK_Y1 + SHADOW + OPEN_CLEAR + (FRAME_H / 2 - CAM_LIFT) / K_OPEN;
export const C_REST = WIN_CENTRE;
export const CY_OPEN = C_OPEN + CAM_LIFT / K_OPEN;
export const CY_REST = C_REST + CAM_LIFT / K_REST;

/** PeakForSolar's `runCamera2`: the house tracker (CAM_STIFF / CAM_DAMP) with an
 *  x channel. */
export const runCamera2 = (upto: number, F: number[], CY: number[], CX: number[], K: number[]) => {
  let cy = CY[0];
  let cx = CX[0];
  let k = K[0];
  let vy = 0;
  let vx = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, F, CY, clamp);
    const tx = interpolate(f, F, CX, clamp);
    const tk = interpolate(f, F, K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, cx, k };
};

export type Cam = { cx: number; cy: number; k: number };
export const worldToScreen = (x: number, y: number, cam: Cam) => ({
  x: FRAME_W / 2 + (x - cam.cx) * cam.k,
  y: FRAME_H / 2 + (y - cam.cy) * cam.k,
});

// -- cut 1's camera: ONE glide back and up, then a creep that carries the hold --
export const CFE_DURATION = 121;
export const CFE_GLIDE_F0 = 8;
export const CFE_GLIDE_F1 = 40;
export const CFE_GLIDE_WARP = 0.85;
export const CFE_CREEP_F0 = 84;
export const CFE_CREEP_F1 = 136; // past the end: still creeping on the last frame
export const CFE_CREEP_DK = 0.02;
const CFE_GLIDE = camMove({
  f0: CFE_GLIDE_F0,
  f1: CFE_GLIDE_F1,
  k0: K_OPEN,
  k1: K_REST,
  c0: C_OPEN,
  c1: C_REST,
  warp: CFE_GLIDE_WARP,
});
const CFE_CREEP = camMove({
  f0: CFE_CREEP_F0,
  f1: CFE_CREEP_F1,
  k0: K_REST,
  k1: K_REST + CFE_CREEP_DK,
  c0: C_REST,
  c1: C_REST,
  warp: 1,
});
export const CFE_CAM_F = [0, ...CFE_GLIDE.F, ...CFE_CREEP.F];
export const CFE_CAM_K = [K_OPEN, ...CFE_GLIDE.K, ...CFE_CREEP.K];
export const CFE_CAM_CY = [CY_OPEN, ...CFE_GLIDE.CY, ...CFE_CREEP.CY];
export const CFE_CAM_CX = CFE_CAM_F.map(() => COL_CX);
export const cfeCamera = (f: number) => runCamera2(f, CFE_CAM_F, CFE_CAM_CY, CFE_CAM_CX, CFE_CAM_K);
/** Cut 1's camera on its last frame (no sway). */
export const CFE_RESOLVED: Cam = cfeCamera(CFE_DURATION - 1);

// ---------------------------------------------------------------------------
// THE LOG.
// ---------------------------------------------------------------------------
export const SEND_F = 13;
/** The pill's sideways drift starts this fraction into the send, so it clears
 *  the send button before it moves toward the column edge. */
export const SEND_X_DELAY = 0.15;
export const REPLY_V = 40; // world px/frame along the writing path
export const REPLY_LAG = 8; // sendAt -> replyAt
export const AI_CARET_W = 14;
export const AI_CARET_H = 58;
export const AI_CARET_LEAD = 10; // the caret's left edge, right of the written end
export const CARET_IN = 3;
export const CARET_OUT = 4;
/** Where a pill sits at the moment of its send: around the typed line. */
export const IB_PILL_X1 = IB_TEXT_R + PILL_PAD_H; // 844
export const IB_PILL_Y0 = IB_CY - PILL_H / 2; // 1324

export type ExchangeSpec = {
  food: Food;
  stamp?: boolean;
  typeAt?: number | number[];
  sendAt?: number;
  /** this exchange's send duration, frames (default SEND_F) */
  sendF?: number;
  replyAt?: number;
  replyRate?: number;
  replyStop?: number | "bars";
};

export type ReplyState = {
  /** writing-path length written, world px */
  L: number;
  /** each bar's drawn width */
  barW: number[];
  /** characters of the answer shown */
  chars: number;
  /** the caret, or null; `h` is its drawn height (grows in, thins out) */
  caret: { x: number; cy: number; h: number } | null;
};

export type ExGeom = {
  top: number;
  pillY0: number;
  pillY1: number;
  stampY0: number;
  stampY1: number;
  stampBaseline: number;
  barsY: number;
  numBaseline: number;
  bottom: number;
};

export type Log = {
  specs: ExchangeSpec[];
  heights: number[];
  sendU: (i: number, f: number) => number;
  sendE: (i: number, f: number) => number;
  top: (i: number, f: number) => number;
  geom: (i: number, f: number) => ExGeom;
  pillRect: (i: number, f: number) => Rect;
  landed: (i: number, f: number) => boolean;
  inFlight: (i: number, f: number) => boolean;
  reply: (i: number, f: number) => ReplyState;
  typing: (f: number) => { i: number; text: string } | null;
};

const barStarts = (bars: number[]) => {
  const s: number[] = [];
  let x = 0;
  for (let j = 0; j < bars.length; j++) {
    s.push(x);
    x += bars[j] + BAR_GAP;
  }
  return { starts: s, len: x - BAR_GAP };
};
export const barsLength = (food: Food) => barStarts(food.bars).len;
export const replyLength = (food: Food) =>
  barsLength(food) + widthOf(food.reply, NUM_WEIGHT, NUM_SIZE);

const charFrames = (spec: ExchangeSpec): number[] => {
  const n = spec.food.entry.length;
  if (spec.typeAt === undefined) return [];
  if (Array.isArray(spec.typeAt)) {
    if (spec.typeAt.length !== n) {
      throw new Error(`cottageShared: typeAt for "${spec.food.entry}" needs ${n} frames`);
    }
    return spec.typeAt;
  }
  const t0 = spec.typeAt;
  const out: number[] = [];
  for (let c = 0; c < n; c++) out.push(t0 + c);
  return out;
};

export const makeLog = (specs: ExchangeSpec[]): Log => {
  const heights = specs.map((s) => EXH + (s.stamp ? STAMP_ROW_H : 0));
  const CHAR_F = specs.map(charFrames);
  const BARS = specs.map((s) => barStarts(s.food.bars));
  // the answer's per-character right edges (kerned), and their midpoints
  const NUM_EDGES = specs.map((s) => {
    const edges: number[] = [];
    for (let c = 1; c <= s.food.reply.length; c++) {
      edges.push(widthOf(s.food.reply.slice(0, c), NUM_WEIGHT, NUM_SIZE));
    }
    return edges;
  });

  const sendU = (i: number, f: number) => {
    const s = specs[i].sendAt;
    if (s === undefined) return 1;
    return clamp01((f - s) / (specs[i].sendF ?? SEND_F));
  };
  const sendE = (i: number, f: number) => smoothstep(sendU(i, f));
  const sendX = (i: number, f: number) =>
    smoothstep((sendU(i, f) - SEND_X_DELAY) / (1 - SEND_X_DELAY));

  // Bottom-anchored: exchange i's top is LOG_BOTTOM minus everything from i
  // down that has been (partly) sent. A sending exchange pushes the whole stack
  // up by its own height on its own eased clock.
  const top = (i: number, f: number) => {
    let t = LOG_BOTTOM;
    for (let j = i; j < specs.length; j++) t -= heights[j] * sendE(j, f);
    return t;
  };

  const geom = (i: number, f: number): ExGeom => {
    const t = top(i, f);
    const pillY0 = t + EX_GAP;
    const pillY1 = pillY0 + PILL_H;
    const stampY0 = pillY1;
    const stampY1 = pillY1 + (specs[i].stamp ? STAMP_ROW_H : 0);
    const barsY = stampY1 + GAP_PB;
    const numCapTop = barsY + BAR_H + GAP_BN;
    const numBaseline = numCapTop + DIGIT_ASC * NUM_SIZE;
    return {
      top: t,
      pillY0,
      pillY1,
      stampY0,
      stampY1,
      stampBaseline: stampY0 + STAMP_GAP + CAP * STAMP_SIZE,
      barsY,
      numBaseline,
      bottom: t + heights[i],
    };
  };

  const landed = (i: number, f: number) => sendU(i, f) >= 1;
  const inFlight = (i: number, f: number) => {
    const s = specs[i].sendAt;
    return s !== undefined && f >= s && sendU(i, f) < 1;
  };

  const pillRect = (i: number, f: number): Rect => {
    const w = pillWidth(specs[i].food.entry);
    const s = specs[i].sendAt;
    if (s !== undefined && f < s) {
      return { x0: IB_PILL_X1 - w, y0: IB_PILL_Y0, x1: IB_PILL_X1, y1: IB_PILL_Y0 + PILL_H };
    }
    if (landed(i, f)) {
      const y0 = geom(i, f).pillY0;
      return { x0: COL_R - w, y0, x1: COL_R, y1: y0 + PILL_H };
    }
    // in flight: the rise and the scroll are one clock; the drift is delayed
    const e = sendE(i, f);
    const ex = sendX(i, f);
    const yLanded = LOG_BOTTOM - heights[i] + EX_GAP;
    const y0 = IB_PILL_Y0 + (yLanded - IB_PILL_Y0) * e;
    const x1 = IB_PILL_X1 + (COL_R - IB_PILL_X1) * ex;
    return { x0: x1 - w, y0, x1, y1: y0 + PILL_H };
  };

  const reply = (i: number, f: number): ReplyState => {
    const spec = specs[i];
    const bars = spec.food.bars;
    const B = BARS[i];
    const edges = NUM_EDGES[i];
    const total = B.len + edges[edges.length - 1];
    const stop =
      spec.replyStop === undefined
        ? total
        : spec.replyStop === "bars"
          ? B.len
          : Math.min(total, spec.replyStop);
    const g = geom(i, f);
    const barCy = g.barsY + BAR_H / 2;
    const numCy = g.numBaseline - (CAP * NUM_SIZE) / 2;

    if (spec.sendAt === undefined) {
      // history: fully answered long before f0
      return { L: total, barW: bars.slice(), chars: spec.food.reply.length, caret: null };
    }
    const rate = spec.replyRate ?? REPLY_V;
    const r0 = spec.replyAt ?? spec.sendAt + REPLY_LAG;
    // ONE clock: the written end runs along the path at `rate`, through the
    // bars (which grow continuously behind it) and on along the answer's line,
    // where a character appears whole once the written end has passed its
    // right edge. The caret rides AI_CARET_LEAD ahead of the written end, so it
    // glides at one steady speed and never sits on a glyph.
    const L = Math.min(stop, Math.max(0, (f - r0) * rate));
    const barW = bars.map((w, j) => Math.max(0, Math.min(w, L - B.starts[j])));
    const numL = L - B.len;
    let chars = 0;
    for (let c = 0; c < edges.length; c++) {
      if (numL >= edges[c] - 1e-6) chars = c + 1;
    }

    // the caret: grows in before the clock, thins out once the answer is whole
    const fDone = r0 + total / rate;
    const grow = clamp01((f - (r0 - CARET_IN)) / CARET_IN);
    const thin = stop < total ? 0 : clamp01((f - fDone) / CARET_OUT);
    const h = AI_CARET_H * grow * (1 - thin);
    let caret: ReplyState["caret"] = null;
    if (h >= 0.5) {
      caret =
        numL <= 0
          ? { x: COL_L + L + AI_CARET_LEAD, cy: barCy, h }
          : { x: COL_L + numL + AI_CARET_LEAD, cy: numCy, h };
    }
    return { L, barW, chars, caret };
  };

  const typing = (f: number) => {
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i];
      const cf = CHAR_F[i];
      if (s.sendAt === undefined || cf.length === 0) continue;
      if (f >= s.sendAt || f < cf[0]) continue;
      let n = 0;
      for (let c = 0; c < cf.length; c++) if (f >= cf[c]) n = c + 1;
      return { i, text: s.food.entry.slice(0, n) };
    }
    return null;
  };

  return {
    specs,
    heights,
    sendU,
    sendE,
    top,
    geom,
    pillRect,
    landed,
    inFlight,
    reply,
    typing,
  };
};

// -- cut 1's exchanges, and the same five as history for cut 2 ------------------
export const CFE_SPECS: ExchangeSpec[] = [
  { food: FOOD.toast },
  { food: FOOD.apple },
  { food: FOOD.eggs, typeAt: 1, sendAt: 7 },
  { food: FOOD.coffee, typeAt: 26, sendAt: 38 },
  { food: FOOD.banana, typeAt: 58, sendAt: 64 },
];
/** Cut 1's resolved log as history: cut 2 appends its own exchange. */
export const CUT2_HISTORY: ExchangeSpec[] = CFE_SPECS.map((s) => ({ food: s.food }));

// ---------------------------------------------------------------------------
// DRAWING. Everything below is SVG for the world <svg> unless it says so.
// ---------------------------------------------------------------------------
const typeStyle = (size: number, weight: number) =>
  ({
    fontFamily: FONT,
    fontWeight: weight,
    fontSize: size,
    fontKerning: "normal",
  }) as const;

/** White (or any) type on its hard black copy. */
export const ShadowedText: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  weight: number;
  anchor?: "start" | "middle" | "end";
  fill?: string;
  shadow?: boolean;
}> = ({ text, x, y, size, weight, anchor = "start", fill = WHITE, shadow = true }) => (
  <g>
    {shadow ? (
      <text x={x + SHADOW} y={y + SHADOW} textAnchor={anchor} fill={BLACK} style={typeStyle(size, weight)}>
        {text}
      </text>
    ) : null}
    <text x={x} y={y} textAnchor={anchor} fill={fill} style={typeStyle(size, weight)}>
      {text}
    </text>
  </g>
);

/** A user pill + its black text, right edge `x1`, top `y0`. `fill` and
 *  `textFill` let a cut draw a copy; `text={false}` draws the bare silhouette;
 *  `shadow={false}` leaves the hard shadow off (e.g. for a colour copy);
 *  `body={false}` draws the text alone. */
export const Pill: React.FC<{
  entry: string;
  x1: number;
  y0: number;
  fill?: string;
  textFill?: string;
  shadow?: boolean;
  text?: boolean;
  body?: boolean;
}> = ({ entry, x1, y0, fill = WHITE, textFill = BLACK, shadow = true, text = true, body = true }) => {
  const w = pillWidth(entry);
  return (
    <g>
      {shadow ? (
        <rect x={x1 - w + SHADOW} y={y0 + SHADOW} width={w} height={PILL_H} rx={PILL_R} fill={BLACK} />
      ) : null}
      {body ? <rect x={x1 - w} y={y0} width={w} height={PILL_H} rx={PILL_R} fill={fill} /> : null}
      {text ? (
        <text
          x={x1 - PILL_PAD_H}
          y={y0 + PILL_PAD_V + CAP * ENTRY_SIZE}
          textAnchor="end"
          fill={textFill}
          style={typeStyle(ENTRY_SIZE, ENTRY_WEIGHT)}
        >
          {entry}
        </text>
      ) : null}
    </g>
  );
};

/** A capsule / rounded rect as a closed path (clockwise from the top-left). */
const capsulePath = (x0: number, y0: number, x1: number, y1: number) => {
  const r = Math.min((y1 - y0) / 2, (x1 - x0) / 2);
  return [
    `M${x0 + r} ${y0}`,
    `H${x1 - r}`,
    `A${r} ${r} 0 0 1 ${x1} ${y0 + r}`,
    `V${y1 - r}`,
    `A${r} ${r} 0 0 1 ${x1 - r} ${y1}`,
    `H${x0 + r}`,
    `A${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
    `V${y0 + r}`,
    `A${r} ${r} 0 0 1 ${x0 + r} ${y0}`,
    "Z",
  ].join(" ");
};

const PillShadow: React.FC<{ entry: string; x1: number; y0: number }> = ({ entry, x1, y0 }) => {
  const w = pillWidth(entry);
  return <rect x={x1 - w + SHADOW} y={y0 + SHADOW} width={w} height={PILL_H} rx={PILL_R} fill={BLACK} />;
};

/** The reply: bars, answer, caret — each white on its hard shadow. */
const Reply: React.FC<{ food: Food; g: ExGeom; st: ReplyState }> = ({ food, g, st }) => {
  const B = barStarts(food.bars);
  const bar = (j: number, off: number, fill: string) => {
    const w = st.barW[j];
    if (w < 0.5) return null;
    return (
      <rect
        key={`b${j}-${off}`}
        x={COL_L + B.starts[j] + off}
        y={g.barsY + off}
        width={w}
        height={BAR_H}
        rx={Math.min(BAR_H / 2, w / 2)}
        fill={fill}
      />
    );
  };
  const text = food.reply.slice(0, st.chars);
  const c = st.caret;
  return (
    <g>
      {food.bars.map((_, j) => bar(j, SHADOW, BLACK))}
      {food.bars.map((_, j) => bar(j, 0, WHITE))}
      {text.length > 0 ? (
        <ShadowedText text={text} x={COL_L} y={g.numBaseline} size={NUM_SIZE} weight={NUM_WEIGHT} />
      ) : null}
      {c ? (
        <g>
          <rect
            x={c.x + SHADOW}
            y={c.cy - c.h / 2 + SHADOW}
            width={AI_CARET_W}
            height={c.h}
            rx={Math.min(AI_CARET_W / 2, c.h / 2)}
            fill={BLACK}
          />
          <rect
            x={c.x}
            y={c.cy - c.h / 2}
            width={AI_CARET_W}
            height={c.h}
            rx={Math.min(AI_CARET_W / 2, c.h / 2)}
            fill={WHITE}
          />
        </g>
      ) : null}
    </g>
  );
};

/** The header lockup, fixed to the window. */
const Header: React.FC = () => {
  const s = MARK / 24;
  const mark = (off: number, fill: string) => (
    <g transform={`translate(${LOCKUP_X0 + off} ${MARK_Y0 + off}) scale(${s})`}>
      {OPENAI.paths.map((d, i) => (
        <path key={i} d={d} fill={fill} fillRule="evenodd" />
      ))}
    </g>
  );
  return (
    <g>
      {mark(SHADOW, BLACK)}
      {mark(0, WHITE)}
      <ShadowedText text="CHATGPT" x={HDR_TEXT_X} y={HDR_BASELINE} size={HDR_SIZE} weight={HDR_WEIGHT} />
    </g>
  );
};

/** The send button's arrow (Lucide `arrow-up`), nudged up by `dy`. */
const Arrow: React.FC<{ dy: number }> = ({ dy }) => {
  const s = ARROW_BOX / 24;
  return (
    <g
      transform={`translate(${BTN_CX - ARROW_BOX / 2} ${IB_CY - ARROW_BOX / 2 + dy}) scale(${s})`}
      fill="none"
      stroke={WHITE}
      strokeWidth={STROKE / s}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </g>
  );
};

/** THE WINDOW for frame `f`, as an SVG group in world coordinates. */
export const LogWindow: React.FC<{
  log: Log;
  frame: number;
  idPrefix: string;
  underPill?: (i: number, rect: Rect) => React.ReactNode;
  overExchange?: (i: number, g: ExGeom) => React.ReactNode;
}> = ({ log, frame, idPrefix, underPill, overExchange }) => {
  const clipId = `${idPrefix}-log-clip`;
  const outOfBarId = `${idPrefix}-out-of-bar`;
  const n = log.specs.length;
  const idx: number[] = [];
  for (let i = 0; i < n; i++) idx.push(i);

  // Only what can be on screen: a landed or in-flight exchange whose bottom is
  // still below the clip line (plus its reply, which is written in the slot).
  const shown = idx.filter((i) => {
    const s = log.specs[i];
    if (s.sendAt !== undefined && frame < s.sendAt) return false;
    return log.geom(i, frame).bottom + SHADOW > CLIP_Y;
  });
  const flying = shown.filter((i) => log.inFlight(i, frame));

  // the arrow nudges up with whichever send is running
  let nudge = 0;
  for (let q = 0; q < flying.length; q++) {
    const u = log.sendU(flying[q], frame);
    nudge = -ARROW_NUDGE * Math.pow(Math.sin(Math.PI * u), 2);
  }
  const typing = log.typing(frame);

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={-4000} y={CLIP_Y} width={9000} height={6000} />
        </clipPath>
        {/* everything OUTSIDE the input bar's capsule: a pill in flight has
            its white body only where it has left the bar, so it rises out of
            the bar and never covers the caret or the button */}
        <clipPath id={outOfBarId}>
          <path
            d={`M-4000 -4000 H6000 V8000 H-4000 Z ${capsulePath(COL_L, IB_Y0, COL_R, IB_Y1)}`}
            clipRule="evenodd"
          />
        </clipPath>
      </defs>

      {/* the input bar's shadow, at the very back */}
      <rect
        x={COL_L + SHADOW}
        y={IB_Y0 + SHADOW}
        width={COL_W}
        height={IB_H}
        rx={IB_R}
        fill={BLACK}
      />

      {/* THE LOG, clipped at the header's lower edge: landed pills, replies */}
      <g clipPath={`url(#${clipId})`}>
        {shown.map((i) => {
          const food = log.specs[i].food;
          const g = log.geom(i, frame);
          const land = log.landed(i, frame);
          const r = log.pillRect(i, frame);
          return (
            <g key={`ex${i}`}>
              {land ? <PillShadow entry={food.entry} x1={r.x1} y0={r.y0} /> : null}
              {land && underPill ? underPill(i, r) : null}
              {land ? <Pill entry={food.entry} x1={r.x1} y0={r.y0} shadow={false} /> : null}
              <Reply food={food} g={g} st={log.reply(i, frame)} />
              {overExchange ? overExchange(i, g) : null}
            </g>
          );
        })}
      </g>

      {/* a pill in flight: its shadow UNDER the input bar's white, so it
          emerges as the pill lifts out */}
      {flying.map((i) => {
        const r = log.pillRect(i, frame);
        return <PillShadow key={`fs${i}`} entry={log.specs[i].food.entry} x1={r.x1} y0={r.y0} />;
      })}

      {/* THE INPUT BAR */}
      <rect x={COL_L} y={IB_Y0} width={COL_W} height={IB_H} rx={IB_R} fill={WHITE} />
      <circle cx={BTN_CX} cy={IB_CY} r={BTN_R} fill={BLACK} />
      <Arrow dy={nudge} />
      {typing && typing.text.length > 0 ? (
        <text
          x={IB_TEXT_R}
          y={IB_BASELINE}
          textAnchor="end"
          fill={BLACK}
          style={typeStyle(ENTRY_SIZE, ENTRY_WEIGHT)}
        >
          {typing.text}
        </text>
      ) : null}
      <rect
        x={IB_TEXT_R + IB_CARET_GAP}
        y={IB_CY - IB_CARET_H / 2}
        width={IB_CARET_W}
        height={IB_CARET_H}
        rx={IB_CARET_W / 2}
        fill={BLACK}
      />

      {/* the pill in flight: its body where it has left the bar, its text
          everywhere (inside the bar it is the typed line, still riding) */}
      {flying.map((i) => {
        const r = log.pillRect(i, frame);
        const entry = log.specs[i].food.entry;
        return (
          <g key={`fp${i}`}>
            <g clipPath={`url(#${outOfBarId})`}>
              <Pill entry={entry} x1={r.x1} y0={r.y0} shadow={false} text={false} />
            </g>
            <Pill entry={entry} x1={r.x1} y0={r.y0} shadow={false} body={false} />
          </g>
        );
      })}

      {/* THE HEADER, fixed to the window */}
      <Header />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE GROUND — PeakForSolar's `PaperGround`, unchanged: parallax off the
// camera's opening rest in BOTH axes, -0.3 px/frame drift, 1 + (k - 1) * 0.3
// scale, objectFit cover, rotate(90deg) innermost, the dim + blur on the image
// only (SCREEN px), a local BG_OVERSIZE of 1.6.
// ---------------------------------------------------------------------------
export const PaperGround: React.FC<{
  frame: number;
  cy: number;
  cyRest: number;
  cx: number;
  cxRest: number;
  k: number;
}> = ({ frame, cy, cyRest, cx, cxRest, k }) => {
  const bgY = -(cy - cyRest) * k * PARALLAX - frame * PAPER_DRIFT;
  const bgX = -(cx - cxRest) * k * PARALLAX;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(PAPER_SRC)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE,
          height: FRAME_W * BG_OVERSIZE,
          objectFit: "cover",
          filter: `brightness(${PAPER_DIM}) blur(${PAPER_BLUR}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Paper + camera + the world <svg>. `cam` includes any sway; `rest` is the
 *  camera's opening position, which the paper's parallax is measured from.
 *  Children are SVG in world coordinates. */
export const World: React.FC<{
  frame: number;
  cam: Cam;
  rest: { cx: number; cy: number };
  children: React.ReactNode;
}> = ({ frame, cam, rest, children }) => {
  const tx = FRAME_W / 2 - cam.cx * cam.k;
  const ty = FRAME_H / 2 - cam.cy * cam.k;
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround frame={frame} cy={cam.cy} cyRest={rest.cy} cx={cam.cx} cxRest={rest.cx} k={cam.k} />
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${cam.k})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {children}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
