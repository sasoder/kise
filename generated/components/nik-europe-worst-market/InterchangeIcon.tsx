// ---------------------------------------------------------------------------
// InterchangeIcon (nik-europe-worst-market, cut 20 RateIcons: the loop master). Cheeky Pint style (styles/cheeky-pint.md),
// icon loop (styles/icon-loops.md: Output + Motion; the Plain-look PNG rules do not apply, the glyph is drawn).
// Transparent 1080x1080, 23.976 fps, 96 frames (one seamless loop, RATE_LOOP).
//
// CHECK LINE: "That one is the fee, the %, on a card payment."
// THE LINE (John Collison): "[...in Europe] where both interchange rates and lending rates are regulated?"
//
// THE PICTURE: one cream card tile (the kit's material, its one rest shadow with the contact ellipse, grain), in ink a
// payment card (outline, the stripe, a solid chip) whose lower-right corner carries the shared % mark, cut out of the
// card by a gap of the tile (rateShared). Optional ink label INTERCHANGE inside the tile.
// THE LOOP (lf 0..95): the card taps forward once (f6-f12 ease-out: it turns 4 deg about its left edge and nudges
// down-right, its corner pressing into the %), and lands back by ~f31. Contact f12, first reaction f12: the % ticks up
// 0.75 units and turns -7 deg (3 f in, 16 f settle). Idle life, one whole cycle per loop each: the card floats
// +-0.3 units, the % breathes +-2.5 % (volume-preserving: x up, y down). Every envelope is 0 at lf 0 and 95, so the
// wrap 95 -> 0 is seamless.
// Props: liveliness (0..2, every amplitude), iconSize (tile px), label.
//
// SOURCES: none (no figures). Card and % are Lucide grammar ("credit-card", "percent", ISC), redrawn for the stroke.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { RATE_LOOP, RateTile, WithPercent, breath, f3, fx, glyphFrame, glyphTransform, mod, percentTick, pulseAt, squareCentre, type Enter } from "./rateShared";

export const FPS = 24000 / 1001;
export const DURATION = RATE_LOOP;
export const schema = z.object({
  liveliness: z.number().min(0).max(2).default(1),
  iconSize: z.number().min(200).max(760).default(576),
  label: z.boolean().default(true),
});
export const defaultProps = schema.parse({});

// the card, glyph units
const CARD = { x: 0.8, y: 3.9, w: 19.4, h: 12.4, r: 2.4, stripe: 8.3 } as const;
const CHIP = { x: 3.9, y: 10.85, w: 4.4, h: 3, r: 0.85 } as const;
/** Loop frames of the tap: start, ease-out to the contact, a 1 f hold, the landing back. */
export const TAP = { f0: 6, up: 6, hold: 1, down: 18 } as const;
export const TAP_CONTACT = TAP.f0 + TAP.up; // 12

/** The interchange glyph tile. `lf` = loop frame (any integer; taken mod RATE_LOOP). */
export const InterchangeTile: React.FC<{
  size: number;
  cx: number;
  cy: number;
  lf: number;
  liveliness?: number;
  label?: boolean;
  enter?: Enter;
}> = ({ size, cx, cy, lf: lfRaw, liveliness = 1, label = true, enter }) => {
  const lf = mod(lfRaw, RATE_LOOP);
  const L = liveliness;
  const g = glyphFrame(label);
  const p = pulseAt(lf, TAP.f0, TAP.up, TAP.hold, TAP.down) * L;
  const float = 0.3 * L * breath(lf, 1, 0.25);
  const pivot = { x: CARD.x, y: CARD.y + CARD.h / 2 };
  const cardTf = `translate(${fx(0.55 * p)} ${fx(0.45 * p + float)}) rotate(${f3(4 * p)} ${fx(pivot.x)} ${fx(pivot.y)})`;
  const pose = percentTick(lf, TAP_CONTACT, L);
  return (
    <RateTile size={size} cx={cx} cy={cy} lf={lf} label={label ? "Interchange" : null} enter={enter}>
      <g transform={glyphTransform(g)}>
        <WithPercent sw={g.sw} pose={pose}>
          <g transform={cardTf}>
            <g fill="none" stroke={COLOR.inkDark} strokeWidth={f3(g.sw)} strokeLinecap="round" strokeLinejoin="round">
              <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={CARD.r} />
              <path d={`M${f3(CARD.x)} ${f3(CARD.stripe)}H${f3(CARD.x + CARD.w)}`} />
            </g>
            <rect x={CHIP.x} y={CHIP.y} width={CHIP.w} height={CHIP.h} rx={CHIP.r} fill={COLOR.inkDark} />
          </g>
        </WithPercent>
      </g>
    </RateTile>
  );
};

const InterchangeIcon: React.FC<z.infer<typeof schema>> = ({ liveliness, iconSize, label }) => {
  const frame = useCurrentFrame();
  const c = squareCentre(iconSize);
  return (
    <AbsoluteFill>
      <InterchangeTile size={iconSize} cx={c.cx} cy={c.cy} lf={frame} liveliness={liveliness} label={label} />
    </AbsoluteFill>
  );
};

export default InterchangeIcon;
