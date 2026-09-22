import React from "react";
import { Img, staticFile } from "remotion";
import { clamp01, hash, iconShadow, smoothstep } from "./fieldShared";
import { INK_HI, LABEL_RISE_PX } from "./alignShared";
import {
  COL_X0,
  COL_X1,
  HUMANS_ANCHOR,
  PERSON_BOX,
  WORD_H,
  lineTop,
  type DimWindow,
} from "./incidentShared";

// ---------------------------------------------------------------------------
// incidentHumans — THE HUMANS of film A (`Noam_Airgapping`), owned by builder
// A2 and reused by A3 (cut 5, where they become the monitors).
//
// Three white `person.png` glyphs standing at `HUMANS_ANCHOR` (above APR,
// centred on the column), 118 screen px tall at the world's K_REST
// (`PERSON_BOX` from incidentShared). They are DOM (`<Img>`, never an SVG
// <image>, which races frame capture), so a cut passes `<Humans .../>` to
// `IncidentWorld`'s `overDom` — which also puts them OVER the dim veil: the
// humans are the subject of "in the dark", they stay white while their world
// goes dark around them.
//
// Timing, global G (film A clock):
//   HUMANS_IN     G461 / 464 / 467: each glyph slides up LABEL_RISE_PX (screen)
//                 while fading in over HUMANS_IN_F = 12 frames — the text
//                 entrance, staggered 3 f. All three stand by G479. (Cut 3's
//                 camera cannot reach the top of the page from A1's rack close-up
//                 before ~G466 inside the 45 px/f cap, so they rise as they come
//                 into frame, just after "humans" G461.) Not drawn before G461.
//   dimAt(G)      0 before G468, eased to 1 by G492 (before "dark" G497),
//                 held, then eased back to 0 over G600-640 (the unshown gap
//                 after cut 3), so 0 from G640 on — every later cut is lit.
//   HUMANS_WINDOW the world rect the dim does not apply to: the first two APR
//                 lines just below the humans ("that is all they can see").
//
// POSITIONS NEVER CHANGE after HUMANS_READY.md is written.
// ---------------------------------------------------------------------------

/** person.png's ink is 0.84 of its box (bbox 40..472 of 512). */
export const PERSON_INK = 0.84;
export { PERSON_BOX };

/** The three glyphs' CENTRES, world px: a loose shallow arc, never a row. */
export const HUMANS: { x: number; y: number; seed: number }[] = [-1, 0, 1].map((j, i) => ({
  x: HUMANS_ANCHOR.x + j * HUMANS_ANCHOR.spacing,
  y: HUMANS_ANCHOR.y + (j === 0 ? 0 : 9) + (hash(i + 3, 17) - 0.5) * 8,
  seed: i,
}));

/** The group's INK extents (world px), for anything that must sit under them. */
export const HUMANS_INK = {
  x0: Math.min(...HUMANS.map((h) => h.x)) - (PERSON_BOX * PERSON_INK) / 2,
  x1: Math.max(...HUMANS.map((h) => h.x)) + (PERSON_BOX * PERSON_INK) / 2,
  y0: Math.min(...HUMANS.map((h) => h.y)) - (PERSON_BOX * PERSON_INK) / 2,
  y1: Math.max(...HUMANS.map((h) => h.y)) + (PERSON_BOX * PERSON_INK) / 2,
};

// --- the entrance -----------------------------------------------------------
export const HUMANS_IN = [461, 464, 467];
export const HUMANS_IN_F = 12;
/** 0..1: glyph i's entrance at G (eased). */
export const humanIn = (i: number, G: number) => smoothstep(clamp01((G - HUMANS_IN[i]) / HUMANS_IN_F));
/** The G by which all three stand. */
export const HUMANS_LANDED = Math.max(...HUMANS_IN) + HUMANS_IN_F; // 479

// --- the dark ----------------------------------------------------------------
export const DIM_IN: [number, number] = [468, 492];
export const DIM_OUT: [number, number] = [600, 640];
/** The world's `dim` prop over the whole film: 0 before the dark, 1 in it, 0 again from G640. */
export const dimAt = (G: number) =>
  smoothstep(clamp01((G - DIM_IN[0]) / (DIM_IN[1] - DIM_IN[0]))) *
  (1 - smoothstep(clamp01((G - DIM_OUT[0]) / (DIM_OUT[1] - DIM_OUT[0]))));

/** What the humans can see: the first two APR lines, just below them. */
export const HUMANS_WINDOW: DimWindow = {
  x0: COL_X0 - 26,
  y0: lineTop(0) - 30,
  x1: COL_X1 + 26,
  y1: lineTop(1) + WORD_H + 30,
  feather: 44,
};

// --- life ---------------------------------------------------------------------
/** Each glyph's own <= 2.2 px drift on its own two periods: never still, never unison. */
export const humanDrift = (G: number, seed: number) => ({
  dx: 2.2 * Math.sin(G / (17 + 5 * hash(seed + 40, 3)) + (seed + 40) * 2.1),
  dy: 2.2 * Math.sin(G / (23 + 6 * hash(seed + 40, 9)) + (seed + 40) * 3.7),
});

/** THE HUMANS at G. World-space DOM: pass as (part of) `IncidentWorld`'s `overDom`.
 *  `k` is the live camera zoom (for the shadow and the screen-px rise). */
export const Humans: React.FC<{ G: number; k: number; opacity?: number }> = ({ G, k, opacity = INK_HI }) => (
  <>
    {HUMANS.map((h, i) => {
      const t = humanIn(i, G);
      if (t <= 0) return null;
      const d = humanDrift(G, h.seed);
      const rise = (LABEL_RISE_PX / Math.max(k, 1e-3)) * (1 - t);
      return (
        <Img
          key={`hum${i}`}
          src={staticFile("person.png")}
          style={{
            position: "absolute",
            left: h.x - PERSON_BOX / 2 + d.dx,
            top: h.y - PERSON_BOX / 2 + d.dy + rise,
            width: PERSON_BOX,
            height: PERSON_BOX,
            opacity: opacity * t,
            filter: `brightness(0) invert(1) ${iconShadow(k)}`,
          }}
        />
      );
    })}
  </>
);
