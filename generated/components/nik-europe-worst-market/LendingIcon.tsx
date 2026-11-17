// ---------------------------------------------------------------------------
// LendingIcon (nik-europe-worst-market, cut 20 RateIcons: the loop master). Cheeky Pint style (styles/cheeky-pint.md),
// icon loop (styles/icon-loops.md: Output + Motion; the Plain-look PNG rules do not apply, the glyph is drawn).
// Transparent 1080x1080, 23.976 fps, 96 frames (one seamless loop, RATE_LOOP).
//
// CHECK LINE: "That one is the interest, the %, on a loan."
// THE LINE (John Collison): "[...in Europe] where both interchange rates and lending rates are regulated?"
//
// THE PICTURE: InterchangeIcon's twin: the same cream tile, stroke, shadow and grain; in ink a bank (Lucide "landmark",
// three columns under the pediment, on its base) with the SAME % mark, same size and place as the card's, a badge over
// the right end of the base only, cut out of it by a gap of the tile (rateShared); the columns keep clear of it. The bank + % + LENDING reads "the rate a bank lends at". Optional ink label LENDING in the tile.
// A coin-stack alternative (glyph "coins": four solid coins edge-on, staggered) is kept as a prop; on the first
// stills it read as a stacked-bars / menu glyph, and the outlined coin stack read as a bold letter "B" next to the %.
// THE LOOP (lf 0..95): the pediment (or the top coin) lifts off (f4-f16, ease in-out, up 1.3 units, tipping -3 deg),
// hovers, and drops back flat (f24-f30, Easing.in quad: it accelerates down). Contact f30, first reaction f30: the %
// ticks up 0.75 units and turns -7 deg (the shared percentTick: 3 f in, 16 f settle); idle, the % breathes +-2.5 %
// (volume-preserving, one whole cycle per loop). Every envelope is 0 at lf 0
// and 95, so the wrap 95 -> 0 is seamless.
// Props: liveliness (0..2, every amplitude), iconSize (tile px), label.
//
// SOURCES: none (no figures). Bank and % in Lucide grammar ("landmark", "percent", ISC), redrawn for the stroke.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { RATE_LOOP, RateTile, WithPercent, breath, f3, fx, glyphFrame, glyphTransform, mod, percentTick, smoothstep, squareCentre, type Enter } from "./rateShared";

export const FPS = 24000 / 1001;
export const DURATION = RATE_LOOP;
export const schema = z.object({
  liveliness: z.number().min(0).max(2).default(1),
  iconSize: z.number().min(200).max(760).default(576),
  label: z.boolean().default(true),
  glyph: z.enum(["bank", "coins"]).default("bank"),
});
export const defaultProps = schema.parse({});

// the bank (default), glyph units: Lucide "landmark" narrowed to three columns (pitch 4) under the pediment, on its
// base. The % sits exactly where InterchangeIcon's does (rateShared PCT) and, like the card's corner, overlaps only the
// right end of the base. Clearance, computed over the whole tick (lift, -7 deg turn) and breath at liveliness 1: the
// nearest column ink stays 2.67 glyph units (>= one GLYPH_STROKE, 2.54) from the % ink, so its knock-out gap never
// cuts a column. Vertical budget: >= 1.4 units of cream between roof, columns and base.
const BANK = {
  apex: { x: 5.6, y: 2.6 },
  roof: "M5.6 2.6 11.4 7H-0.2Z",
  columns: [1.6, 5.6, 9.6],
  colTop: 10.94,
  colFoot: 14.06,
  base: "M-0.2 18H13.4",
} as const;
// the alternative (glyph "coins"): four solid coins edge-on, staggered, bottom first; the top one lifts and settles
const COIN = { w: 15, h: 3.7, gap: 1, cx: 8.3, base: 22.65 } as const;
const STAGGER = [0, 0.9, -0.3, 0.55] as const;
/** Loop frames of the top coin: lift start, lifted, drop start, contact. */
export const COIN_T = { lift: 4, up: 16, drop: 24, land: 30 } as const;

/** The top coin's lift 0..1: ease in-out up, hover, ease-in (accelerating) drop to the contact frame. */
const coinLift = (lf: number) => {
  if (lf <= COIN_T.lift || lf >= COIN_T.land) return 0;
  if (lf < COIN_T.up) return smoothstep((lf - COIN_T.lift) / (COIN_T.up - COIN_T.lift));
  if (lf < COIN_T.drop) return 1;
  const t = (lf - COIN_T.drop) / (COIN_T.land - COIN_T.drop);
  return 1 - t * t;
};

/** The lending glyph tile. `lf` = loop frame (any integer; taken mod RATE_LOOP). */
export const LendingTile: React.FC<{
  size: number;
  cx: number;
  cy: number;
  lf: number;
  liveliness?: number;
  label?: boolean;
  enter?: Enter;
  glyph?: "bank" | "coins";
}> = ({ size, cx, cy, lf: lfRaw, liveliness = 1, label = true, enter, glyph = "bank" }) => {
  const lf = mod(lfRaw, RATE_LOOP);
  const L = liveliness;
  const g = glyphFrame(label);
  const up = coinLift(lf);
  const hover = up * 0.12 * breath(lf, 4);
  const pose = percentTick(lf, COIN_T.land, L);
  /** The lifting part's pose about its own pivot: up (units) and tipped back, flat again on landing. */
  const amp = glyph === "bank" ? { up: 1.3, rot: -3 } : { up: 2.4, rot: -6 };
  const liftTf = (px: number, py: number) => `translate(0 ${fx(-(amp.up * up + hover) * L)}) rotate(${f3(amp.rot * up * L)} ${fx(px)} ${fx(py)})`;
  return (
    <RateTile size={size} cx={cx} cy={cy} lf={lf} label={label ? "Lending" : null} enter={enter}>
      <g transform={glyphTransform(g)}>
        <WithPercent sw={g.sw} pose={pose}>
          {glyph === "bank" ? (
            <g fill="none" stroke={COLOR.inkDark} strokeWidth={f3(g.sw)} strokeLinecap="round" strokeLinejoin="round">
              <path d={BANK.roof} transform={liftTf(BANK.apex.x, BANK.apex.y)} />
              {BANK.columns.map((x) => (
                <path key={x} d={`M${x} ${BANK.colTop}V${BANK.colFoot}`} />
              ))}
              <path d={BANK.base} />
            </g>
          ) : (
            <g fill={COLOR.inkDark}>
              {STAGGER.map((dx, i) => {
                const x = COIN.cx + dx - COIN.w / 2;
                const y = COIN.base - (i + 1) * COIN.h - i * COIN.gap;
                const top = i === STAGGER.length - 1;
                return <rect key={i} x={f3(x)} y={f3(y)} width={COIN.w} height={COIN.h} rx={COIN.h / 2} transform={top ? liftTf(x + COIN.w / 2, y + COIN.h / 2) : undefined} />;
              })}
            </g>
          )}
        </WithPercent>
      </g>
    </RateTile>
  );
};

const LendingIcon: React.FC<z.infer<typeof schema>> = ({ liveliness, iconSize, label, glyph }) => {
  const frame = useCurrentFrame();
  const c = squareCentre(iconSize);
  return (
    <AbsoluteFill>
      <LendingTile size={iconSize} cx={c.cx} cy={c.cy} lf={frame} liveliness={liveliness} label={label} glyph={glyph} />
    </AbsoluteFill>
  );
};

export default LendingIcon;
