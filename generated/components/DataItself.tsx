import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { Bracket, DataFrame, MLabel, MStage, TILE_W, clamp01, enterU, smoothstep, tileSeed } from "./mavenShared";
import {
  COLS,
  DATA_LABEL_Y,
  DATA_WORD_F,
  DURATION,
  END_CAM,
  FPS,
  HERO,
  ROWS,
  bracketAt,
  bracketSize,
  camAt,
  pieceStrokePx,
  tileReveal,
  tileRung,
  tileX,
  tileY,
} from "./dataItselfGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// DataItself -- Bharat, "Project Maven's data problem" (ChinaTalk), cut A of 5.
// 1920x1080, 24 fps, opaque. IN = 241 (sequence frame), DURATION = 113 (exact
// slot, hard cut in and out).
//
// LINE: "I would say that one of the first things that we struggled with was
// with data itself."
// Local word frames: would 0 · say 4 · that 9 · one 16 · first 26 · things 33 ·
// that 39 · we 46 · struggled 53 · with 64 · was 70 · with 81 · data 93 ·
// itself 101 · end 113.
//
// ONE MOTION: the lens lets go of one frame and it turns out to be one of very
// many, and the model's eye keeps looking. Three element types: the data frame
// (a 4:3 tile with terrain hairlines), the Bracket (the model's eye, with the
// dashed RED expected-target square = the accent: the target it is looking for
// and never finds), one label.
//
// GESTURES (gesture -> word -> local frames)
// 1. Open (f0): close on ONE data frame (620 px wide, centred), drawn, its
//    last edge still being written in wet ink with a bead (done f8). The
//    Bracket is inside it, hunting (a smooth wander, dashes marching). No target.
// 2. "one of the first things" -> the pull-back (camera target f0-88, crest
//    early, slowing in; k 4.77 -> 1.1), then a decaying drift out to the last
//    frame (k -> 1.07). The grid's bottom edge holds screen y ~706 the whole
//    way (the hero is the bottom-centre tile), so nothing ever dips toward the
//    captions. Neighbouring frames write themselves in (outline in wet ink,
//    wash + terrain soaking in, 17 f each) in a wave that runs outward from the
//    hero and starts each tile <= 5 f before the frame edge reaches it:
//    f5 the three neighbours ... f56 the far corners. 9 x 4, every tile seeded
//    differently, none with a target.
// 3. "struggled" (53) -> the Bracket leaves the first frame (hop 1 f44-56, right),
//    hunts, finds nothing, moves on (hop 2 f65-77, up; hop 3 f87-100, up-left).
//    One continuous path: the wander never stops under the hops. A searched
//    frame drops to INK_LO as the Bracket leaves it (f47, f68, f90).
// 4. "data" (93) -> DATA blurs in above the grid, centred, landing f93. The
//    Bracket is hunting in its fourth frame at the end; the camera still drifts.
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** the hero's outline is 72 % written on frame 0 and closes at f8 */
const heroDraw = (S: number) => 0.72 + 0.28 * smoothstep((S + 6) / 14);

const DataItself: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const sp = pieceStrokePx(k);
  const bs = bracketSize(k);
  const bp = bracketAt(S, k);
  const hd = heroDraw(S);
  const heroWet = 1 - smoothstep((S - 6) / 12);

  const tiles: React.ReactNode[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const hero = col === HERO.col && row === HERO.row;
      const rung = tileRung(col, row, S);
      if (hero && heroWet > 0.01) {
        // inside already there; the last edge is still being written (DataFrame draws 1 - (1 - reveal / 0.7)^2)
        tiles.push(
          <DataFrame key="hero" x={tileX(col)} y={tileY(row)} w={TILE_W} k={k} seed={tileSeed(col, row)} strokePx={sp} rung={rung} soak={1} reveal={hd >= 1 ? 1 : 0.7 * (1 - Math.sqrt(1 - hd))} wet={heroWet} />,
        );
        continue;
      }
      const rv = tileReveal(col, row, S);
      if (rv <= 0) continue;
      tiles.push(
        <DataFrame key={`${col}-${row}`} x={tileX(col)} y={tileY(row)} w={TILE_W} k={k} seed={tileSeed(col, row)} rung={rung} reveal={clamp01(rv)} strokePx={sp} />,
      );
    }
  }

  return (
    <MStage S={S} cam={cam} rest={END_CAM}>
      {tiles}
      <Bracket x={bp.x} y={bp.y} size={bs} k={k} S={S} strokePx={sp} />
      <MLabel text="data" x={0} y={DATA_LABEL_Y} k={k} appear={enterU(S, DATA_WORD_F)} />
    </MStage>
  );
};

export default DataItself;
