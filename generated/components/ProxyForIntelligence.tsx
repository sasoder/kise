import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_LIFT, camEase, clamp, clamp01, sway } from "./fieldShared";
import {
  BLACK,
  BLUE,
  CAP,
  FONT,
  ORANGE,
  PURPLE,
  SHADOW,
  STROKE,
  ShadowedText,
  WHITE,
  World,
  runCamera2,
  widthOf,
} from "./cottageShared";

export const FPS = 24;
// Clip "anna - elon has amazing syntax". Composition f0 = 19.75 s on the edit
// timeline; frame = round((t - 19.75) * 24). Speech ends on "et cetera" at
// 26.02 s -> f150; plus a 22-frame tail the editor can trim = 172.
export const DURATION = 172;

// ---------------------------------------------------------------------------
// PROXY FOR INTELLIGENCE — "the sentence grows a tree".
//
// THE LINE (Anna, a linguist): "Like his use of the English language is just
// superb. Obviously it's a proxy for high intelligence and analytical skills,
// et cetera, et cetera."
//
// Core memory podcast graphic standard (reference `PeakForSolar.tsx`), in the
// world of this speaker's previous clip (`cottageShared.tsx`, imported, never
// edited): 1080x1920, 24 fps, OPAQUE, dimmed + blurred squared paper at
// parallax 0.15 with the -0.3 px/f drift, white #FFFFFF ink on a +4/+4 world-px
// hard #000000 shadow drawn as an SVG copy, Barlow 800/900 caps, ONE stroke
// weight (STROKE, 6 world px) for every line and both icons.
//
// TIMING — word onsets from a word-level whisper pass on the edit audio,
// frame = round((t - 19.75) * 24):
//   Like 19.80 -> 1 · his 20.04 -> 7 · use 20.20 -> 11 · of 20.50 -> 18 ·
//   the 20.72 -> 23 · English 20.80 -> 25 · language 20.98-21.36 -> 30-39 ·
//   is 21.36 -> 39 · just 21.80 -> 49 · superb 21.96-22.38 -> 53-63 ·
//   Obviously 22.56 -> 67 · it's a 22.80 -> 73 · proxy 23.04 -> 79 ·
//   for 23.42 -> 88 · high 23.62 -> 93 · intelligence 23.80-24.18 -> 97-106 ·
//   and 24.18 -> 106 · analytical 24.60 -> 116 · skills 24.90-25.22 -> 124-132 ·
//   et cetera 25.38-25.70 -> 135-143 · et cetera 25.74-26.02 -> 144-150 ·
//   (next line "So" 26.24 -> 156)
//   Speech ends f150; DURATION = 150 + 22 = 172.
//
// THE CONCEPT. His use of English = one REAL Elon Musk post, "The most
// entertaining outcome is the most likely" (X, 12 May 2023; also Jan 2022 and
// Jul 2024 — https://x.com/elonmusk/status/1656914397141278720). A linguist's
// syntax tree grows up out of it; its root node S is her verdict ("superb");
// from S a stem keeps growing — the syntax is a PROXY — and splits into what it
// stands for: a brain (HIGH INTELLIGENCE), a magnifying glass (ANALYTICAL
// SKILLS) and a centre stub ending in three dots (et cetera). One continuous
// upward growth; read top to bottom it is an hourglass: words -> S -> stem ->
// two fruits.
//
// THE CHAIN'S ONE JOB: the chain colours mark ANNA'S VERDICT — the S node,
// "superb", and nothing else. Raw hex #FFB765 / #BC37FF / #0046FF, no bloom, no
// blend, no fade: a colour layer exists or it does not.
//
// GEOMETRY, world px (= screen px at k 1), everything centred on x 540. Barlow
// widths are cottageShared's kerned `widthOf`.
//   LEAVES   Barlow 900 caps 64, pitch 78, each block centre-aligned.
//            NP "THE MOST / ENTERTAINING / OUTCOME" (429.1 wide), VP "IS / THE
//            MOST / LIKELY" (288.5); the pair centred on 540 with a 90 gutter:
//            x 136.2..943.8, block centres 350.7 / 799.5. First cap top y 1040,
//            last baseline 1240.8, ink + shadow bottom 1245.6.
//   TAGS     NP / VP, Barlow 800 caps 44, baseline 970 (cap top 939.2), centred
//            on each block.
//   LINES    every line end stops VIS_GAP = 12 px of paper short of the ink it
//            points at (end point GAP = 15 from it; round caps). Leaf line =
//            block top (1025) up to the tag (985), [the tag], tag top (924.2) on
//            to the S centre — NP arrives at 35.3 deg, VP at 27.3 deg.
//   S        (review pass 2: bigger, it read small on a phone) white disc
//            r 50 at (540, 790) on the hard shadow, black Barlow 900 "S" 60 on
//            the cap centre. The CROWN at rest: blue / purple / orange discs of
//            the same radius in the same column, 14 / 28 / 42 above the core —
//            three crescents over the white. Crown top 698. The NP / VP lines
//            run to the S centre and are covered by the white disc only (checked:
//            no line pixel lies under a colour disc outside the white).
//   STEM     x 540 from 714 (16 px up inside the orange disc, hidden — the
//            orange's top edge at the stem's side is 698.1) to the junction at
//            y 610: 88 px visible above the crown.
//   FRUITS   Lucide `brain` centre (320, 390) and `search` centre (760, 415.3),
//            190 world px boxes (7.917 px / Lucide unit, stroke-width 0.758
//            units = 6 world px). Each branch aims straight at its icon's
//            OPTICAL bottom-centre — the brain: the bottom of the centre seam
//            (x 12, on the lobes' lowest-ink level y 22; the bottom lobes are
//            circles r 4 at (8, 18) and (16, 18), tangent at the seam); the
//            magnifier: the lens bottom directly under the lens centre (11, 19),
//            not the handle — and stops where its round cap keeps 12 px of paper
//            from the nearest ink. The magnifier's y is solved so the two ends
//            sit level: brain end (342.6, 486.3), lens end (732.4, 486.3);
//            branches at 32.1 / 32.7 deg. That lands the lens bottom 1.6 px
//            under the brain's lobe bottoms (25.3 px lower than the brain).
//   LABELS   Barlow 900 caps 54 (see DEVIATIONS), pitch 62, centred on each
//            icon, level: HIGH / INTELLIGENCE, ANALYTICAL / SKILLS; last baseline
//            269 = 26 above the BRAIN's box; cap top 169.2.
//   ETC      stub x 540 from the junction up to 490; three white dots r 10 on
//            the shadow at y 465, x 510 / 540 / 570.
//   The block spans y 169.2..1245.6; centre 707.4 (C_REST).
//
// THE GESTURES — one per word, nothing else. Text never pops: every text
// element (and each dot) slides up 24 world px while fading in, ease-out cubic.
//   1. f2-38   "his use of the English language" — the eight words WRITE ON in
//              reading order on one clock: word i starts f2 + 4i (THE 2, MOST
//              6, ENTERTAINING 10, OUTCOME 14 | IS 18, THE 22, MOST 26, LIKELY
//              30), each 8 f.
//   2. f36-52  "is just" — the tree grows UP out of the blocks: one head per
//              block runs block top -> through its tag -> the S point on one
//              eased clock (bezier .33,0,.25,1), both arriving f52 (visually
//              met by ~f49). Each tag slides up + fades over 10 f from the
//              frame its head reaches it (NP and VP both f39).
//   3. f51-79  "superb" — the S node enters as the core-memory stack at the
//              convergence point: orange disc f51, purple f53, blue f55, the
//              white core + its shadow f57, each popping in 56 px low and rising
//              into place on Easing.bezier(0.16, 1, 0.3, 1) over 22 f; the colours
//              land as the crown (blue 14 / purple 28 / orange 42 above the
//              core). The black S rides the core and inks in over f57-65 (it is
//              text, so it does not pop). The cut's only colour.
//   4. f77-92  "proxy for" — the stem draws up from behind the crown (its
//              hidden start is inside the orange disc, so it emerges from the
//              crown's top) to the junction.
//   5. f92-112 "high intelligence" — the left branch draws f92-99; on its
//              arrival the brain GROWS OUT OF IT: a bottom-up WIPE, a clip rect
//              whose top edge rises from the icon's lowest ink to its highest
//              over 10 f on bezier(0.16, 1, 0.3, 1), f99-109; the shadow copy is
//              clipped by the same rect offset +4/+4, so it rises in step. No
//              fade, no slide. HIGH / INTELLIGENCE slides up + fades f100-112.
//   6. f114-134 "analytical skills" — the right branch draws f114-121; the
//              magnifier wipes up the same way f121-131 (from the handle's end,
//              its lowest ink, through the lens); ANALYTICAL / SKILLS slides up +
//              fades f122-134.
//   7. f134-156 "et cetera, et cetera" — the centre stub grows f134-142; the
//              three dots slide up + fade left to right at f138, f143, f148
//              (8 f each).
//   f156-171   the resolved hourglass holds on the camera's creep.
//
// THE CAMERA — three long glides summed on ONE per-frame track, plus a constant
// creep (k -0.0009 / frame, content centre -0.1 world px / frame) that carries
// every hold; each glide's delta is solved so the track lands exactly on its
// target at its last key. cy = centre + CAM_LIFT / k puts the content centre on
// screen y 835. cx 540 throughout. Damped by cottageShared's runCamera2 (the
// house CAM_STIFF / CAM_DAMP tracker); fieldShared's sway on top.
//   OPEN  f0        k 1.17, the leaves (1040..1245.6, centre 1142.8) on 835
//   G1    f28-58    k -> 1.12, centre -> 971.8 (crown top + blocks), warp 0.9
//   G2    f70-104   k -> 1.06, centre -> 760 (junction, fruits and blocks),
//                   warp 0.9 — the main move, rising with the stem
//   G3    f108-146  k -> 1.00, centre -> 707.4 (the whole hourglass), warp 1.0
//   tail            the creep carries on: k 0.981 at f171
//   THE DAMPED NUMBERS (no sway):
//     f     k        cx       cy        content centre (cy - 125/k)
//     0     1.1700   540.00   1249.62   1142.78
//     53    1.1278   540.00   1117.37   1006.54   "superb"
//     97    1.0743   540.00    924.64    808.29   "intelligence"
//     124   1.0405   540.00    867.00    746.86   "skills"
//     150   1.0005   540.00    832.96    708.02   speech ends
//     171   0.9813   540.00    832.69    705.30   last frame
//   Measured every frame: k never rises and the content centre never moves
//   down (one direction all the way: out and up). Fastest screen motion 10.65
//   px/f (the label top, f89, G2's middle); max |dv| 0.87 px/f^2 (f77). Holds
//   are never dead: 0.4 px/f through the open, 0.3 px/f between G1 and G2.
//   CAPTION BAND: the lowest ink on screen after f10 (sway included) is the
//   leaves' shadow at 1368.1 — nothing below screen y 1400 on any frame. Top:
//   HIGH / INTELLIGENCE is at screen y >= 175 from its first frame.
//   Sideways: leaves x 67.4..1016.7 at the tightest (f0-10, sway included).
//
// SOURCES
//   Post: Elon Musk on X, "The most entertaining outcome is the most likely",
//   https://x.com/elonmusk/status/1656914397141278720 (12 May 2023).
//   Icons: Lucide `brain` and `search`, lucide-static v1.48.0 (ISC), paths
//   inlined verbatim from unpkg.
//
// DEVIATIONS from the brief, and why.
//   * OPEN k IS 1.17, NOT 1.30. The NP/VP pair is 807.6 world px wide at the
//     brief's 64 px type and 90 gutter; at k 1.30 it would sit 15 px from the
//     left edge and 10 px from the right. 1.17 is the tightest camera that
//     keeps the pair inside screen x ~60..1020 with sway. The ladder keeps its
//     shape one step lower: G1 lands 1.12 (brief 1.18), G2 1.06, rest 1.00,
//     tail 0.98.
//   * S AT y 790 (brief ~860), JUNCTION 610 (720), ICONS ~390 (520). With S at
//     860 the tag -> S lines run at 22 deg (NP) and 16 deg (VP) and read as a
//     flat roof; at 790 they are 35 / 27 deg. The stem then needs room above
//     the crown to read as a stem, so the upper half moves up with it. The
//     block is 1076 tall (brief ~915) and still resolves inside the band.
//     (Accepted at review.)
//   * G2 KEEPS THE BLOCKS IN FRAME. Any k-1.06 framing that lets them leave the
//     bottom puts them in screen y 1400..1920 on the way out — the caption
//     band. G2 lands centre 760 so the leaves stay above 1400.
//   * LABELS 54 px, NOT 48. At 48 they read 12 px tall on a 270-wide phone
//     frame; 54 keeps a 90 px gap between INTELLIGENCE and ANALYTICAL.
//   * THE BLACK S INKS IN (8 f) on the rising core instead of popping with it:
//     it is text.
//   * BRANCH STOP (review pass 2 said "12 px short of the optical
//     bottom-centre"). Measured from the anchor point alone, the lens cap came
//     6.2 px from the lens's own curve and the brain cap 9.0 px from the lobe
//     beside the seam. The aim is the optical bottom-centre as asked; the stop
//     is where the cap keeps 12 px of paper from the NEAREST ink (so >= 12 px
//     from the anchor too: 23.7 brain, 20.4 lens). The magnifier's y is then
//     solved so the ends are level (0.00 px apart).
// ---------------------------------------------------------------------------

// --- the leaves: one real post ----------------------------------------------
export const NP_LINES = ["THE MOST", "ENTERTAINING", "OUTCOME"];
export const VP_LINES = ["IS", "THE MOST", "LIKELY"];
export const LEAF_SIZE = 64;
export const LEAF_WEIGHT = 900;
export const LEAF_PITCH = 78;
export const LEAF_TOP = 1040; // the first line's cap top
export const GUTTER = 90;
export const TEXT_RISE = 24; // world px

const blockW = (lines: string[]) => Math.max(...lines.map((l) => widthOf(l, LEAF_WEIGHT, LEAF_SIZE)));
export const NP_W = blockW(NP_LINES);
export const VP_W = blockW(VP_LINES);
export const PAIR_W = NP_W + GUTTER + VP_W;
export const PAIR_X0 = 540 - PAIR_W / 2;
export const NP_CX = PAIR_X0 + NP_W / 2;
export const VP_CX = PAIR_X0 + NP_W + GUTTER + VP_W / 2;
export const leafBaseline = (row: number) => LEAF_TOP + CAP * LEAF_SIZE + row * LEAF_PITCH;
export const LEAF_BOTTOM = leafBaseline(2) + 0.012 * LEAF_SIZE; // round-letter overshoot

export type Word = { text: string; x: number; y: number; start: number };
const WORD_F0 = 2;
const WORD_STEP = 4;
export const WORD_IN = 8;
export const WORDS: Word[] = (() => {
  const out: Word[] = [];
  const place = (lines: string[], cx: number) => {
    lines.forEach((line, row) => {
      const x0 = cx - widthOf(line, LEAF_WEIGHT, LEAF_SIZE) / 2;
      let at = 0;
      for (const w of line.split(" ")) {
        out.push({
          text: w,
          x: x0 + (at > 0 ? widthOf(line.slice(0, at), LEAF_WEIGHT, LEAF_SIZE) : 0),
          y: leafBaseline(row),
          start: WORD_F0 + WORD_STEP * out.length,
        });
        at += w.length + 1;
      }
    });
  };
  place(NP_LINES, NP_CX);
  place(VP_LINES, VP_CX);
  return out;
})();

// --- the node tags ------------------------------------------------------------
export const TAG_SIZE = 44;
export const TAG_WEIGHT = 800;
export const TAG_BASE = LEAF_TOP - 70;
export const TAG_TOP = TAG_BASE - CAP * TAG_SIZE;
export const VIS_GAP = 12; // paper between a line's round cap and the ink it points at
export const GAP = VIS_GAP + STROKE / 2; // a line's end point to that ink
export const TAG_IN = 10;

// --- S ------------------------------------------------------------------------
export const S_X = 540;
export const S_Y = 790;
export const S_R = 50;
export const S_SIZE = 60;
export const CROWN = { blue: 14, purple: 28, orange: 42 };
export const CROWN_TOP = S_Y - CROWN.orange - S_R;
export const S_RISE = 56;
export const S_TRAVEL = 22;
export const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
export const S_AT = { orange: 51, purple: 53, blue: 55, core: 57 };
export const S_INK_IN = 8; // the black S inks in on the rising core

// --- the stem, the fruits -------------------------------------------------------
export const JUNCTION_Y = 610;
export const STEM_Y0 = CROWN_TOP + 16; // hidden behind the crown
export const ICON_BOX = 190;
export const ICON_U = ICON_BOX / 24;
export const ICON_DX = 220;
export const BRAIN_Y = 390;
export const BRAIN_CX = 540 - ICON_DX;
export const LENS_CX = 540 + ICON_DX;
export const SEARCH_LENS = { cx: 11, cy: 11, r: 8 };
export const LABEL_SIZE = 54; // brief 48; see DEVIATIONS
export const LABEL_WEIGHT = 900;
export const LABEL_PITCH = 62;
export const LABEL_GAP = 26; // last baseline above the icon box
export const LABEL_BASE2 = BRAIN_Y - ICON_BOX / 2 - LABEL_GAP;
export const LABEL_BASE1 = LABEL_BASE2 - LABEL_PITCH;
export const LABEL_TOP = LABEL_BASE1 - CAP * LABEL_SIZE;
export const LABEL_IN = 12;
export const LEFT_LABEL = ["HIGH", "INTELLIGENCE"];
export const RIGHT_LABEL = ["ANALYTICAL", "SKILLS"];

// Lucide `brain` and `search` (lucide-static v1.48.0, ISC), inlined verbatim.
export const BRAIN: string[] = [
  "M12 18V5",
  "M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4",
  "M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5",
  "M17.997 5.125a4 4 0 0 1 2.526 5.77",
  "M18 18a4 4 0 0 0 2-7.464",
  "M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517",
  "M6 18a4 4 0 0 1-2-7.464",
  "M6.003 5.125a4 4 0 0 0-2.526 5.77",
];
export const SEARCH_HANDLE = "m21 21-4.34-4.34";
// OPTICAL BOTTOM-CENTRES, on the ink's lower edge (+ STROKE / 2):
//   brain: the bottom of the centre seam — x 12, on the level of the two
//          bottom lobes' lowest ink (y 22; the lobes are circles r 4 centred
//          (8, 18) and (16, 18), tangent at the seam (12, 18)).
//   lens:  the bottom of the lens circle, directly under its centre (11, 19).
// Each branch aims straight at its anchor and stops where its round cap keeps
// VIS_GAP of paper from the nearest ink (the lobe beside the seam, the lens's
// own curve), which is also >= VIS_GAP short of the anchor itself.
export const BRAIN_ANCHOR = { x: BRAIN_CX, y: BRAIN_Y + (22 - 12) * ICON_U + STROKE / 2 };
export const BRAIN_LOBES = [
  { x: BRAIN_CX - 4 * ICON_U, y: BRAIN_Y + 6 * ICON_U, r: 4 * ICON_U },
  { x: BRAIN_CX + 4 * ICON_U, y: BRAIN_Y + 6 * ICON_U, r: 4 * ICON_U },
];
const lensAnchor = (lensY: number) => ({
  x: LENS_CX + (SEARCH_LENS.cx - 12) * ICON_U,
  y: lensY + (SEARCH_LENS.cy + SEARCH_LENS.r - 12) * ICON_U + STROKE / 2,
});
const lensCircle = (lensY: number) => ({
  x: LENS_CX + (SEARCH_LENS.cx - 12) * ICON_U,
  y: lensY + (SEARCH_LENS.cy - 12) * ICON_U,
  r: SEARCH_LENS.r * ICON_U,
});
// Each icon's ink extent in world y (stroke included), for its wipe.
export const BRAIN_INK = {
  top: BRAIN_Y + (2 - 12) * ICON_U - STROKE / 2,
  bottom: BRAIN_Y + (22 - 12) * ICON_U + STROKE / 2,
};
const lensInk = (lensY: number) => ({
  top: lensY + (SEARCH_LENS.cy - SEARCH_LENS.r - 12) * ICON_U - STROKE / 2,
  bottom: lensY + (21 - 12) * ICON_U + STROKE / 2, // the handle's round end
});

// --- et cetera ---------------------------------------------------------------------
export const STUB_LEN = 120;
export const STUB_TOP = JUNCTION_Y - STUB_LEN;
export const DOT_R = 10;
export const DOT_PITCH = 30;
export const DOT_Y = STUB_TOP - GAP - DOT_R;
export const DOT_AT = [138, 143, 148];
export const DOT_IN = 8;

// --- the lines: one clock each, the head drawn with a round cap -----------------
type Pt = { x: number; y: number };
const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const toward = (a: Pt, b: Pt, d: number): Pt => {
  const L = dist(a, b);
  return { x: a.x + ((b.x - a.x) * d) / L, y: a.y + ((b.y - a.y) * d) / L };
};
const EASE_DRAW = Easing.bezier(0.33, 0, 0.25, 1);

// a leaf block's line: block top -> (the tag) -> S
const leafPath = (cx: number) => {
  const a0 = { x: cx, y: LEAF_TOP - GAP };
  const a1 = { x: cx, y: TAG_BASE + GAP };
  const b0 = { x: cx, y: TAG_TOP - GAP };
  const b1 = { x: S_X, y: S_Y };
  return { a0, a1, b0, b1, lenA: dist(a0, a1), gap: dist(a1, b0), lenB: dist(b0, b1) };
};
export const NP_PATH = leafPath(NP_CX);
export const VP_PATH = leafPath(VP_CX);
export const TREE_F0 = 36;
export const TREE_F1 = 52;
const treeHead = (f: number, p: typeof NP_PATH) =>
  interpolate(f, [TREE_F0, TREE_F1], [0, 1], { easing: EASE_DRAW, ...clamp }) * (p.lenA + p.gap + p.lenB);
// a tag starts its entrance on the first frame its line's head reaches it
const tagStart = (p: typeof NP_PATH) => {
  for (let f = TREE_F0; f <= TREE_F1; f++) if (treeHead(f, p) >= p.lenA) return f;
  return TREE_F1;
};
export const NP_TAG_F = tagStart(NP_PATH);
export const VP_TAG_F = tagStart(VP_PATH);

export const STEM = { a: { x: S_X, y: STEM_Y0 }, b: { x: S_X, y: JUNCTION_Y }, f0: 77, f1: 92 };
const junction = { x: S_X, y: JUNCTION_Y };
// The first point on anchor -> junction (at least GAP out) where a round cap
// keeps VIS_GAP of paper from every circle of ink listed.
const branchEnd = (anchor: Pt, inks: { x: number; y: number; r: number }[]) => {
  const L = dist(anchor, junction);
  for (let s = GAP; s < L; s += 0.05) {
    const e = toward(anchor, junction, s);
    if (inks.every((c) => dist(e, c) - c.r - STROKE >= VIS_GAP)) return e;
  }
  return toward(anchor, junction, GAP);
};
const BRAIN_END = branchEnd(BRAIN_ANCHOR, BRAIN_LOBES);
// THE MAGNIFIER'S Y: solved so the two branch ends sit level (the brain, and
// the labels with it, stay where they were). It lands the lens bottom a few
// px under the brain's lobe bottoms; searched from the lobe-bottom alignment.
export const LENS_Y = (() => {
  const base = BRAIN_Y + (22 - (SEARCH_LENS.cy + SEARCH_LENS.r)) * ICON_U;
  let best = base;
  let err = Infinity;
  for (let d = -30; d <= 30; d += 0.05) {
    const e = branchEnd(lensAnchor(base + d), [lensCircle(base + d)]);
    if (Math.abs(e.y - BRAIN_END.y) < err) {
      err = Math.abs(e.y - BRAIN_END.y);
      best = base + d;
    }
  }
  return best;
})();
export const LENS_ANCHOR = lensAnchor(LENS_Y);
export const LENS_INK = lensInk(LENS_Y);
export const BRANCH_L = { a: junction, b: BRAIN_END, f0: 92, f1: 99 };
export const BRANCH_R = { a: junction, b: branchEnd(LENS_ANCHOR, [lensCircle(LENS_Y)]), f0: 114, f1: 121 };
export const STUB = { a: junction, b: { x: S_X, y: STUB_TOP }, f0: 134, f1: 142 };

// THE FRUIT WIPE: each icon is revealed from its lowest ink upward by a clip
// rect whose top edge rises over WIPE_F frames on EASE_LAND, starting on the
// frame its branch arrives; the shadow copy is clipped by the same rect offset
// +SHADOW/+SHADOW, so it rises in step. No fade, no slide.
export const WIPE_F = 10;
export const BRAIN_WIPE_F0 = BRANCH_L.f1; // 99
export const LENS_WIPE_F0 = BRANCH_R.f1; // 121
export const LEFT_LABEL_F = 100;
export const RIGHT_LABEL_F = 122;

// ---------------------------------------------------------------------------
// THE CAMERA — three long glides summed on one per-frame track, plus a constant
// creep that carries every hold; cy = centre + CAM_LIFT / k so a content centre
// sits on screen y 835; damped by the house tracker with an x channel.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.17;
export const C_OPEN = (LEAF_TOP + LEAF_BOTTOM + SHADOW) / 2; // the leaves
export const K_G1 = 1.12;
export const C_G1 = (CROWN_TOP + LEAF_BOTTOM + SHADOW) / 2; // S + the blocks
export const K_G2 = 1.06;
export const C_G2 = 760;
export const K_REST = 1.0;
export const C_REST = (LABEL_TOP + LEAF_BOTTOM + SHADOW) / 2; // the whole hourglass
export const CREEP_K = -0.0009; // per frame
export const CREEP_C = -0.1; // world px per frame (a slow tilt up)
type Glide = { f0: number; f1: number; warp: number; k: number; c: number };
export const GLIDES: Glide[] = [
  { f0: 28, f1: 58, warp: 0.9, k: K_G1, c: C_G1 },
  { f0: 70, f1: 104, warp: 0.9, k: K_G2, c: C_G2 },
  { f0: 108, f1: 146, warp: 1.0, k: K_REST, c: C_REST },
];
const DELTAS = (() => {
  let pk = K_OPEN;
  let pc = C_OPEN;
  let pf = 0;
  return GLIDES.map((g) => {
    const d = { k: g.k - pk - CREEP_K * (g.f1 - pf), c: g.c - pc - CREEP_C * (g.f1 - pf) };
    pk = g.k;
    pc = g.c;
    pf = g.f1;
    return d;
  });
})();
export const CAM_TRACK = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CX: number[] = [];
  for (let f = 0; f <= DURATION + 24; f++) {
    let k = K_OPEN + CREEP_K * f;
    let c = C_OPEN + CREEP_C * f;
    GLIDES.forEach((g, i) => {
      const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp);
      k += DELTAS[i].k * e;
      c += DELTAS[i].c * e;
    });
    F.push(f);
    K.push(k);
    CY.push(c + CAM_LIFT / k);
    CX.push(540);
  }
  return { F, K, CY, CX };
})();
export const pfiCamera = (f: number) => runCamera2(f, CAM_TRACK.F, CAM_TRACK.CY, CAM_TRACK.CX, CAM_TRACK.K);
export const REST = { cx: CAM_TRACK.CX[0], cy: CAM_TRACK.CY[0] };

export const schema = z.object({
  sway: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ sway: true });

const EASE_TEXT = Easing.out(Easing.cubic);

const ProxyForIntelligence: React.FC<Props> = ({ sway: withSway }) => {
  const frame = useCurrentFrame();
  const cam = pfiCamera(frame);
  const d = withSway ? sway(frame) : { dx: 0, dy: 0 };

  const textIn = (f0: number, dur: number) => {
    const u = EASE_TEXT(clamp01((frame - f0) / dur));
    return { o: u, dy: (1 - u) * TEXT_RISE };
  };
  const drawT = (f0: number, f1: number) =>
    interpolate(frame, [f0, f1], [0, 1], { easing: EASE_DRAW, ...clamp });

  // -- the tree's lines, as segments [from, to] for this frame ---------------
  const segs: { a: Pt; b: Pt }[] = [];
  // a leaf line: ONE head runs block top -> through the tag -> S
  const leaf = (p: typeof NP_PATH) => {
    const head = treeHead(frame, p);
    if (head <= 0) return;
    segs.push({ a: p.a0, b: toward(p.a0, p.a1, Math.min(head, p.lenA)) });
    const hb = head - p.lenA - p.gap;
    if (hb > 0) segs.push({ a: p.b0, b: toward(p.b0, p.b1, Math.min(hb, p.lenB)) });
  };
  leaf(NP_PATH);
  leaf(VP_PATH);
  const straight = (s: { a: Pt; b: Pt; f0: number; f1: number }) => {
    const t = drawT(s.f0, s.f1);
    if (t <= 0) return;
    segs.push({ a: s.a, b: toward(s.a, s.b, t * dist(s.a, s.b)) });
  };
  straight(STEM);
  straight(BRANCH_L);
  straight(BRANCH_R);
  straight(STUB);

  const line = (s: { a: Pt; b: Pt }, off: number, color: string, key: string) => (
    <line
      key={key}
      x1={s.a.x + off}
      y1={s.a.y + off}
      x2={s.b.x + off}
      y2={s.b.y + off}
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
    />
  );

  // -- the S stack -------------------------------------------------------------
  const rise = (f0: number) => S_RISE * (1 - EASE_LAND(clamp01((frame - f0) / S_TRAVEL)));
  const chain = [
    { key: "orange", color: ORANGE, at: S_AT.orange, up: CROWN.orange },
    { key: "purple", color: PURPLE, at: S_AT.purple, up: CROWN.purple },
    { key: "blue", color: BLUE, at: S_AT.blue, up: CROWN.blue },
  ];
  const coreOn = frame >= S_AT.core;
  const coreY = S_Y + rise(S_AT.core);
  const sInk = clamp01((frame - S_AT.core) / S_INK_IN);

  // -- the icons -----------------------------------------------------------------
  const sw = STROKE / ICON_U;
  const iconStyle = { fill: "none", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  const brain = (off: number, color: string) => (
    <g
      transform={`translate(${BRAIN_CX - ICON_BOX / 2 + off} ${BRAIN_Y - ICON_BOX / 2 + off}) scale(${ICON_U})`}
      stroke={color}
      {...iconStyle}
    >
      {BRAIN.map((p) => (
        <path key={p} d={p} />
      ))}
    </g>
  );
  const lens = (off: number, color: string) => (
    <g
      transform={`translate(${LENS_CX - ICON_BOX / 2 + off} ${LENS_Y - ICON_BOX / 2 + off}) scale(${ICON_U})`}
      stroke={color}
      {...iconStyle}
    >
      <path d={SEARCH_HANDLE} />
      <circle cx={SEARCH_LENS.cx} cy={SEARCH_LENS.cy} r={SEARCH_LENS.r} />
    </g>
  );
  // One icon under its wipe: the white and its shadow copy, each clipped by
  // the same rising rect (the shadow's offset +SHADOW/+SHADOW). Whole once
  // the wipe lands, so the clip is dropped.
  const wiped = (
    id: string,
    f0: number,
    ink: { top: number; bottom: number },
    cx: number,
    draw: (off: number, color: string) => React.ReactNode,
  ) => {
    if (frame < f0) return null;
    const e = EASE_LAND(clamp01((frame - f0) / WIPE_F));
    if (e <= 0) return null;
    if (e >= 1) {
      return (
        <g key={id}>
          {draw(SHADOW, BLACK)}
          {draw(0, WHITE)}
        </g>
      );
    }
    const y = ink.bottom - e * (ink.bottom - ink.top + 2);
    const x0 = cx - ICON_BOX;
    const h = ink.bottom + 40 - y;
    return (
      <g key={id}>
        <defs>
          <clipPath id={`${id}-s`}>
            <rect x={x0 + SHADOW} y={y + SHADOW} width={2 * ICON_BOX} height={h} />
          </clipPath>
          <clipPath id={`${id}-w`}>
            <rect x={x0} y={y} width={2 * ICON_BOX} height={h} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-s)`}>{draw(SHADOW, BLACK)}</g>
        <g clipPath={`url(#${id}-w)`}>{draw(0, WHITE)}</g>
      </g>
    );
  };

  const label = (lines: string[], cx: number, f0: number, key: string) => {
    if (frame < f0) return null;
    const t = textIn(f0, LABEL_IN);
    return (
      <g key={key} opacity={t.o} transform={`translate(0 ${t.dy.toFixed(3)})`}>
        <ShadowedText text={lines[0]} x={cx} y={LABEL_BASE1} size={LABEL_SIZE} weight={LABEL_WEIGHT} anchor="middle" />
        <ShadowedText text={lines[1]} x={cx} y={LABEL_BASE2} size={LABEL_SIZE} weight={LABEL_WEIGHT} anchor="middle" />
      </g>
    );
  };

  const tag = (text: string, cx: number, f0: number) => {
    if (frame < f0) return null;
    const t = textIn(f0, TAG_IN);
    return (
      <g key={text} opacity={t.o} transform={`translate(0 ${t.dy.toFixed(3)})`}>
        <ShadowedText text={text} x={cx} y={TAG_BASE} size={TAG_SIZE} weight={TAG_WEIGHT} anchor="middle" />
      </g>
    );
  };

  return (
    <World
      frame={frame}
      cam={{ cx: cam.cx + d.dx, cy: cam.cy + d.dy, k: cam.k }}
      rest={REST}
    >
      {/* THE LINES — every shadow, then every white, so no line's shadow
          crosses another line's ink at a join */}
      {segs.map((s, i) => line(s, SHADOW, BLACK, `ls${i}`))}
      {segs.map((s, i) => line(s, 0, WHITE, `lw${i}`))}

      {/* THE LEAVES — the post, written word by word */}
      {WORDS.map((w, i) => {
        if (frame < w.start) return null;
        const t = textIn(w.start, WORD_IN);
        return (
          <g key={`w${i}`} opacity={t.o} transform={`translate(0 ${t.dy.toFixed(3)})`}>
            <ShadowedText text={w.text} x={w.x} y={w.y} size={LEAF_SIZE} weight={LEAF_WEIGHT} />
          </g>
        );
      })}

      {/* THE TAGS — enter as their line passes */}
      {tag("NP", NP_CX, NP_TAG_F)}
      {tag("VP", VP_CX, VP_TAG_F)}

      {/* THE FRUITS */}
      {wiped("pfi-brain", BRAIN_WIPE_F0, BRAIN_INK, BRAIN_CX, brain)}
      {wiped("pfi-lens", LENS_WIPE_F0, LENS_INK, LENS_CX, lens)}
      {label(LEFT_LABEL, BRAIN_CX, LEFT_LABEL_F, "ll")}
      {label(RIGHT_LABEL, LENS_CX, RIGHT_LABEL_F, "rl")}

      {/* ET CETERA */}
      {DOT_AT.map((f0, i) => {
        if (frame < f0) return null;
        const t = textIn(f0, DOT_IN);
        const x = S_X + (i - 1) * DOT_PITCH;
        return (
          <g key={`d${i}`} opacity={t.o} transform={`translate(0 ${t.dy.toFixed(3)})`}>
            <circle cx={x + SHADOW} cy={DOT_Y + SHADOW} r={DOT_R} fill={BLACK} />
            <circle cx={x} cy={DOT_Y} r={DOT_R} fill={WHITE} />
          </g>
        );
      })}

      {/* S — her verdict, the only colour in the cut */}
      {coreOn ? <circle cx={S_X + SHADOW} cy={coreY + SHADOW} r={S_R} fill={BLACK} /> : null}
      {chain.map((c) =>
        frame >= c.at ? <circle key={c.key} cx={S_X} cy={S_Y - c.up + rise(c.at)} r={S_R} fill={c.color} /> : null,
      )}
      {coreOn ? (
        <g>
          <circle cx={S_X} cy={coreY} r={S_R} fill={WHITE} />
          <text
            x={S_X}
            y={coreY + (CAP * S_SIZE) / 2}
            textAnchor="middle"
            fill={BLACK}
            opacity={sInk}
            style={{ fontFamily: FONT, fontWeight: 900, fontSize: S_SIZE }}
          >
            S
          </text>
        </g>
      ) : null}
    </World>
  );
};

export default ProxyForIntelligence;
