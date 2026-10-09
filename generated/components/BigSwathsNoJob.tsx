import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { FeatherWipe, INK_HI, INK_LO, InkDiffuse, RED, RED_DEEP, Stage, hash01, paperShadow, smoothstep } from "./chinatalkShared";
import {
  BODY_HALF,
  CHEST_Y,
  COLS,
  DURATION,
  FIG_H,
  FPS,
  GHOST_DIFF_F,
  REST_CAM,
  ROWS,
  SLUMP,
  SOAK_F,
  TASSEL_DEG,
  TASSEL_PERIOD,
  camAt,
  colX,
  fateOf,
  redStart,
  remaining,
  rowY,
  seatF,
} from "./bigSwathsGeom";
import { Body, Briefcase, BriefcaseDashed, Cap, FACE_TOP, Parcel, SOAK_FEATHER, Tile, TileSpread, inkAt } from "./bigSwathsGlyphs";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// BigSwathsNoJob -- Jordan Schneider, "Hu Jintao's 25 million jobs" (ChinaTalk),
// graphic B, delivered as 48_BigSwathsNoJob.mov. ChinaTalk style, 1080x1920,
// 24 fps, opaque, no text.
//
// CHECK LINE (what the viewer can say after this cut): "Out of a whole class of
// graduates only a few get the job they expected; a big swath gets no job at
// all, and another swath ends up delivering parcels."
//
// LINE: "(the social malaise that ends up being generated when) you have big
// swaths of the economy that can't get a job in general or a job that they
// think befits (all the hard work that they've gone through ...)".
// IN = edit frame 1168 (48.667 s); the edit cuts back to the speaker at 1312,
// so DURATION = 1312 - 1168 = 144 f (the slot exactly). Local word frames
// (out/jordan-hu/words.tsv): you 7 · have 11 · big 20 · swaths 29 · of the
// economy 42-56 · that 56 · can't 62 · get a job 68-83 · in general 83-95 ·
// or 95 · a 102 · job 106 · that they think 111-127 · befits 127-139.
//
// RED = young people without the job (the clip's one accent); RED_DEEP = its
// lesser state (a job, but a parcel job); ink carries the rest.
//
// MOTION: a class of 40 graduates stands in ranks (5 x 8), every one waiting
// (ink 0.42) with the dashed outline of a briefcase on the chest. Ten solid
// briefcases, each on an ink tile, come down over the top edge as ONE block
// (two rows, a row pitch apart, already falling at f0) and seat on rows 1-2
// together; the ink spreads out of each tile through body and head. Nothing
// comes for rows 3-6: their outlines diffuse away while red soaks down the
// ranks, row after row, and each head sinks into its shoulders. Ten parcels on
// deep-red tiles come up over the bottom edge as one block and seat on rows
// 7-8 together, deep red spreading out of each tile. The camera makes one
// move: close on the top ranks, down the class ahead of the cascade while
// pulling back, to the whole class as three bands (ink / red / deep red) with
// the red swath on the true middle, then a slow residual push.
//
// CLOCKS (local frames; centre column, + 1 f per column step outward for the
// arrivals, + 2 f for the red): the briefcase block seats f10-12 (rows 1 and 2
// on the same frame; the tile covers the dashed outline and its ink spreads
// from the next frame, 14 f, all ink by f26); red starts row 3 f30, row 4 f44,
// row 5 f58, row 6 f72 (14 f per figure, the outline diffusing over the kit's
// EXIT_F from the same frame); the parcel block crosses the bottom edge from
// f95 and seats f108-110 (deep red spreading from the next frame, 14 f, all
// deep red by f124).
//
// Geometry, clocks and the camera are in bigSwathsGeom.ts; the drawings (and
// the sizes derived from kit tokens: the set's line weight, the dash pattern,
// the tile, the soak's wet edge) in bigSwathsGlyphs.tsx. No text. The slump is
// the head (with its cap) sinking 8 px into the shoulders, so the grid stays
// exact. Travelling tiles sit flat (no shadow); the kit's warm shadow belongs
// to the red bodies on the paper.
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const SOAK_BOX = { x0: -BODY_HALF - 2, y0: FACE_TOP - 4, x1: BODY_HALF + 2, y1: FIG_H + 2 };
/** an item is drawn once it is within this of its seat (well off-frame before) */
const DRAW_WITHIN = 1400;

const BigSwathsNoJob: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const inkHi = inkAt(INK_HI);
  const inkLo = inkAt(INK_LO);

  const greyBodies: React.ReactNode[] = [];
  const inkBodies: React.ReactNode[] = [];
  const redBodies: React.ReactNode[] = [];
  const caps: React.ReactNode[] = [];
  const ghosts: React.ReactNode[] = [];
  const items: React.ReactNode[] = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${r}-${c}`;
      const fate = fateOf(r);
      const x = colX(c);
      const y0 = rowY(r);
      let dy = 0;
      const at = (yy: number) => `translate(${x} ${yy.toFixed(3)})`;

      if (fate === "none") {
        // nothing comes: the outline diffuses, red soaks down, the head sinks
        const u = (S - redStart(r, c)) / SOAK_F;
        dy = SLUMP * smoothstep(u);
        if (u < 1) {
          greyBodies.push(
            <g key={key} transform={at(y0)}>
              <Body fill={inkLo} headDy={dy} />
            </g>,
          );
        }
        const gu = (S - redStart(r, c)) / GHOST_DIFF_F;
        if (gu < 1) {
          ghosts.push(
            <g key={key} transform={at(y0 + CHEST_Y)}>
              <InkDiffuse u={gu} k={k} cx={0} cy={0}>
                <BriefcaseDashed S={S} />
              </InkDiffuse>
            </g>,
          );
        }
        if (u > 0) {
          redBodies.push(
            <g key={key} transform={at(y0)}>
              <FeatherWipe id={`bsnj-red-${key}`} box={SOAK_BOX} u={u} feather={SOAK_FEATHER} dir="down">
                <Body fill={RED} headDy={dy} />
              </FeatherWipe>
            </g>,
          );
        }
      } else {
        // a briefcase arrives from above (rows 1-2) or a parcel from below (rows 7-8),
        // riding a tile in the colour it brings; seated, that colour spreads from the tile
        const job = fate === "job";
        const colour = job ? inkHi : RED_DEEP;
        const seat = seatF(r, c);
        const rem = remaining(seat - S);
        const u = (S - seat) / SOAK_F;
        if (u < 1) {
          greyBodies.push(
            <g key={key} transform={at(y0)}>
              <Body fill={inkLo} />
            </g>,
          );
        }
        if (u > 0) {
          (job ? inkBodies : redBodies).push(
            <g key={key} transform={at(y0)}>
              <TileSpread id={`bsnj-spread-${key}`} u={u}>
                <Body fill={colour} />
              </TileSpread>
            </g>,
          );
        }
        // the dashed outline waits until the tile covers it
        if (S < seat) {
          ghosts.push(
            <g key={key} transform={at(y0 + CHEST_Y)}>
              <BriefcaseDashed S={S} />
            </g>,
          );
        }
        if (rem < DRAW_WITHIN) {
          items.push(
            <g key={key} transform={at(y0 + CHEST_Y + (job ? -rem : rem))}>
              <Tile fill={colour} />
              {job ? <Briefcase detail={colour} /> : <Parcel detail={colour} />}
            </g>,
          );
        }
      }

      caps.push(
        <g key={key} transform={at(y0 + dy)}>
          <Cap deg={TASSEL_DEG * Math.sin(S / TASSEL_PERIOD + 2 * Math.PI * hash01(r * 7 + 1, c * 3 + 2))} />
        </g>,
      );
    }
  }

  return (
    <Stage S={S} cam={cam} rest={REST_CAM}>
      {greyBodies}
      {inkBodies}
      {/* red sits on the paper with the kit's warm shadow; ink sits flat */}
      <g style={{ filter: paperShadow(k) }}>{redBodies}</g>
      {caps}
      {ghosts}
      {/* the things that arrive travel in front of the figures */}
      {items}
    </Stage>
  );
};

export default BigSwathsNoJob;
