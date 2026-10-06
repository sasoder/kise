import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { Label, Stage, enterU } from "./chinatalkShared";
import { Bracket, DataFrame, TILE_W, clamp01, smoothstep, tileSeed } from "./mavenShared";
import {
  COLS,
  DATA_LABEL_Y,
  DATA_WORD_F,
  DURATION,
  END_CAM,
  FPS,
  HERO,
  ROWS,
  TITLE_PX,
  bracketAt,
  bracketSize,
  camAt,
  pieceStrokePx,
  tileReveal,
  tileRung,
  tileX,
  tileY,
} from "./dataItselfTallGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// DataItselfTall -- Bharat, "Project Maven's data problem" (ChinaTalk), cut A of
// 5, the 9:16 build. 1080x1920, 24 fps, opaque. IN = 241 (sequence frame),
// DURATION = 113 (exact slot, hard cut in and out).
//
// LINE: "I would say that one of the first things that we struggled with was
// with data itself."
// Local word frames: would 0 · say 4 · that 9 · one 16 · first 26 · things 33 ·
// that 39 · we 46 · struggled 53 · with 64 · was 70 · with 81 · data 93 ·
// itself 101 · end 113.
//
// ONE MOTION: the lens lets go of one frame and it turns out to be one of very
// many, and the model's eye keeps looking. Three element types: the data frame,
// the Bracket (the model's eye; its dashed RED expected-target square is the
// accent: the target it looks for and never finds), one label.
//
// GESTURES (gesture -> word -> local frames)
// 1. Open (f0): close on ONE data frame (860 px wide, centred on y 835), its
//    last edge still being written in wet ink (closes f8); the Bracket hunts
//    inside it, dashes marching. No target.
// 2. "one of the first things" -> one long pull-back (camera target f0-88,
//    crest early; k 6.6 -> 1.27), then a decaying drift out (k -> 1.24). The
//    hero is the bottom-centre tile, so the field grows UP and sideways and its
//    bottom edge settles at y ~1364, clear of the captions. Neighbours write
//    themselves in (wet outline, wash soaking in, 17 f each) in a wave from the
//    hero, each <= 5 f before the frame edge reaches it. 5 x 7, none with a target.
// 3. "struggled" (53) -> the Bracket hops right (f44-56), up (f65-77), up-left
//    (f87-100); the wander never stops under the hops. A searched frame drops
//    to INK_LO as the Bracket leaves it (f47, f68, f90).
// 4. "data" (93) -> DATA blurs in above the field, landing f93. Still hunting at
//    the end, camera still drifting.
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** the hero's outline is 72 % written on frame 0 and closes at f8 */
const heroDraw = (S: number) => 0.72 + 0.28 * smoothstep((S + 6) / 14);

const DataItselfTall: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const sp = pieceStrokePx(k);
  const bp = bracketAt(S, k);
  const hd = heroDraw(S);
  const heroWet = 1 - smoothstep((S - 6) / 12);

  const tiles: React.ReactNode[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const rung = tileRung(col, row, S);
      const seed = tileSeed(col, row);
      if (col === HERO.col && row === HERO.row && heroWet > 0.01) {
        tiles.push(
          <DataFrame key="hero" x={tileX(col)} y={tileY(row)} w={TILE_W} k={k} seed={seed} strokePx={sp} rung={rung} soak={1} reveal={hd >= 1 ? 1 : 0.7 * (1 - Math.sqrt(1 - hd))} wet={heroWet} />,
        );
        continue;
      }
      const rv = tileReveal(col, row, S);
      if (rv <= 0) continue;
      tiles.push(<DataFrame key={`${col}-${row}`} x={tileX(col)} y={tileY(row)} w={TILE_W} k={k} seed={seed} rung={rung} reveal={clamp01(rv)} strokePx={sp} />);
    }
  }

  return (
    <Stage S={S} cam={cam} rest={END_CAM}>
      {tiles}
      <Bracket x={bp.x} y={bp.y} size={bracketSize(k)} k={k} S={S} strokePx={sp} />
      <Label text="data" x={0} y={DATA_LABEL_Y} k={k} size="word" minPx={TITLE_PX} appear={enterU(S, DATA_WORD_F)} />
    </Stage>
  );
};

export default DataItselfTall;
