// ---------------------------------------------------------------------------
// RateIcons (nik-europe-worst-market, cut 20). Cheeky Pint style (stout) (styles/cheeky-pint.md), icon loops
// (styles/icon-loops.md). Transparent overlay 1080x1920, 23.976 fps, 76 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "There are two regulated rates: the % on a card payment (interchange) and the % on a loan (lending)."
//
// THE LINE (John Collison): "[...in Europe] where both interchange rates and lending rates are regulated? Like
// wouldn't that be a..."
// WORD -> FRAME (from the slot start, Whisper, may run 2-6 f early): interchange 4 · rates 12 · and 20 · lending 29 ·
// rates 49 · are 54 · regulated 58 (ends ~67).
// DURATION: the slot 20.917 -> 24.107 s = 3.190 s x 23.976 = 76 frames (f0..f75).
//
// THE MOTION: the two loop icons (InterchangeIcon, LendingIcon: the SAME components, imported) side by side as a
// centred pair in the keep-in box, 344 px tiles 104 px apart, card centres y 784 (tops y 612: fully over the editor's
// still, which starts at y 600; every pixel, shadows included, above y 1075). Interchange enters on "interchange"
// (f0-f10: the kit's entrance, slide up 28 px + scale from 0.96 + fade, ease-out, no bounce), lending on "lending"
// (f25-f35). Each then runs its own loop: the card taps and its % ticks (contact f20), the top coin lifts off the
// stack and drops back, its % ticks (contact f64, the end of "regulated"). Nothing exits; both loops live to f75.
// Over the editor's still (European Parliament vote) the tiles hold up on the kit's rest shadow.
// AMBER = what the bank keeps (this clip); not used here: this beat only names the two rates. Cream + ink only.
//
// SOURCES: none (no figures, no logos).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { InterchangeTile } from "./InterchangeIcon";
import { LendingTile } from "./LendingIcon";
import { tileEnter } from "./rateShared";

export const FPS = 24000 / 1001;
export const DURATION = 76;
export const schema = z.object({
  liveliness: z.number().min(0).max(2).default(1),
  label: z.boolean().default(true),
});
export const defaultProps = schema.parse({});

/** Layout (screen px): two 344 px tiles, 104 px apart, centred; card centres at y 784 (tile tops y 612, over the
 *  editor's photo, which starts at y 600). The tile size is what lets the kit's shadow tail (~0.33 x tile below the
 *  card) end above y 1075 on every frame. */
export const PAIR = { size: 344, gap: 104, cy: 784 } as const;
const DX = (PAIR.size + PAIR.gap) / 2;
/** Entrances: [start, landed] frames. */
export const IN_INTERCHANGE = [0, 10] as const;
export const IN_LENDING = [25, 35] as const;
/** Loop frame = frame + offset: puts each loop's event after its tile has landed (tap contact at f20, coin
 *  contact at f64). */
const LF_INTERCHANGE = -(20 - 12); // TAP_CONTACT 12 -> f20
const LF_LENDING = -(64 - 30); // COIN_T.land 30 -> f64

const RateIcons: React.FC<z.infer<typeof schema>> = ({ liveliness, label }) => {
  const f = useCurrentFrame();
  const enterAt = (w: readonly [number, number]) => tileEnter((f - w[0]) / (w[1] - w[0]));
  return (
    <AbsoluteFill>
      <InterchangeTile size={PAIR.size} cx={540 - DX} cy={PAIR.cy} lf={f + LF_INTERCHANGE} liveliness={liveliness} label={label} enter={enterAt(IN_INTERCHANGE)} />
      <LendingTile size={PAIR.size} cx={540 + DX} cy={PAIR.cy} lf={f + LF_LENDING} liveliness={liveliness} label={label} enter={enterAt(IN_LENDING)} />
    </AbsoluteFill>
  );
};

export default RateIcons;
