import React, { useId } from "react";
import {
  ALPHA,
  COLOR,
  EDGE,
  ElevationShadow,
  FONT_NUM,
  FigureMark,
  GEO,
  METRIC,
  SPACE,
  STROKE,
  TILE_TOP,
  TRACK,
  TYPE,
  AmberGradient,
  bloomFilter,
  camFor,
  clamp01,
  easeOutCubic,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
  type Elevation,
  type Figure,
  type Tone,
} from "../kits/cheeky-pint/stoutShared";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import type { SportName } from "../kits/cheeky-pint/wolffShared";

// ===========================================================================
// worthShared — the shared world of "toto - mercedes is worth 12 billion" (Cheeky Pint S4E01,
// Toto Wolff), the STOUT BOARD, palette B1. Builder A. Used by every cut of the clip:
//   1_SecondOnlyToTheCowboys (builder B), 11_CrazyUplift (builder C),
//   29_PricedLikeTheLakers and 49_WorthMoreThanAYearAgo (builder A).
// Sister of the approved "Mercedes F1 financials" stout set (toto-mercedes-financials/*Stout.tsx):
// the same tiles, Pillar, glass, amber, Numeral and camera rig, imported from the kit.
//
// WHAT IS HERE
//   scales   PROFIT (world px per $1B of profit: the bars of cut 1) and VALUE (world px per $1B of
//            value: the glass columns of cuts 11, 29, 49). Two separate scales; never both on one frame.
//   data     DATA: every real figure of the clip, with its source (COMMON.md "Data").
//   cast     FIG: the tile figures (Mercedes F1 lockup, Cowboys and Lakers crests, NFL / NBA league
//            glyphs) and ANON_SPORTS / anonFigure for the anonymous field.
//   world    X_MERC, FLOOR, TILE_TOP, PITCH, PITCH_PAIR; camera rest REST29 (cut 29 and its kin).
//   frame    KEEP (the 9:16 keep-in box), DY (StoutStage dy), screen helpers, keepInMiss().
//   objects  ValueColumn (tile + glass + amber / cream / board fill + rungs: one object, one shadow,
//            the glass rising out of a slot in the tile's top edge) and MoneyOdometer ("$10B" ->
//            "$12B": rolls digit columns on proportional advances, so "$9B" -> "$10B" opens a new
//            column instead of rolling the "$").
//
// DATA (COMMON.md; out/wolff/briefs/data.md):
//   Mercedes profit $300M (Toto, as in the financials clip; filed 2025 operating profit GBP 166.7M ~ $220M).
//   Dallas Cowboys operating income $629M, value $13B (Forbes 2025 NFL list / Sportico): the most profitable team.
//   LA Lakers sold at a $10B valuation (Mark Walter, June 2025; Forbes value $10.0B).
//   Mercedes a year earlier: $6B (George Kurtz deal, Nov 2025: GBP 4.57B / $5.97B; CNBC 20 Nov 2025).
//   Mercedes today: "10, 12 billion" (Toto, this clip).
// ===========================================================================

// --- scales (WORLD px per $1B) ------------------------------------------------------------------
/** Profit bars (cut 1): the Cowboys' $629M = 377 world px, Mercedes' $300M = 180. At the house k 1.5625
 *  (tiles 150 px on screen) the Cowboys tower + tile is 740 screen px: it fills the keep-in box's height. */
export const PROFIT = 600;
/** Valuation columns (cuts 11, 29, 49): $12B = 150 world px, $10B = 125, $6B = 75. At cut 29's rest
 *  (k 2.4) a $12B column + its tile + a HERO numeral fill the keep-in box's height exactly. */
export const VALUE = 12.5;
/** A rung on a value fill every $2B (25 world px): $6B (a year ago) and $10B (the Lakers) are rungs. */
export const VALUE_RUNG_B = 2;
export const VALUE_RUNG = VALUE_RUNG_B * VALUE;
export const profitH = (billions: number) => billions * PROFIT;
export const valueH = (billions: number) => billions * VALUE;

// --- data ($B) --------------------------------------------------------------------------------------
export const DATA = {
  MERC_PROFIT: 0.3, // Toto's $300M
  COWBOYS_PROFIT: 0.629, // Forbes 2025 operating income
  COWBOYS_VALUE: 13, // Forbes 2025 / Sportico
  LAKERS_VALUE: 10, // Mark Walter sale, June 2025
  MERC_VALUE_LO: 10, // "10,"
  MERC_VALUE_HI: 12, // "12 billion"
  MERC_VALUE_YEAR_AGO: 6, // Kurtz deal, Nov 2025 ($5.97B)
} as const;

// --- the cast ------------------------------------------------------------------------------------
export const FIG = {
  MERC: { kind: "mercedesF1" } as Figure, // the Mercedes-AMG PETRONAS F1 lockup (the user's, Oct 19)
  COWBOYS: { kind: "crest", id: "COWBOYS" } as Figure,
  LAKERS: { kind: "crest", id: "LAKERS" } as Figure,
  NFL: { kind: "sport", sport: "FOOTBALL" } as Figure,
  NBA: { kind: "sport", sport: "BASKETBALL" } as Figure,
} as const;
/** The anonymous field (cut 1): no two neighbours alike when walked in order. */
export const ANON_SPORTS: SportName[] = ["SOCCER", "BASEBALL", "HOCKEY", "BASKETBALL", "FOOTBALL", "SOCCER", "HOCKEY", "BASEBALL"];
export const anonFigure = (i: number): Figure => ({ kind: "sport", sport: ANON_SPORTS[((i % ANON_SPORTS.length) + ANON_SPORTS.length) % ANON_SPORTS.length] });

// --- the world ------------------------------------------------------------------------------------
export const X_MERC = GEO.X_NOW; // 544: Mercedes' tile centre in every cut
export const FLOOR = GEO.FLOOR; // 1296: where tiles stand
export { TILE_TOP }; // 1200: where bars and columns leave the tile
export const PITCH = GEO.PITCH; // 128: a row of tiles (cut 1's skyline)
/** Cut 29's pair: the Lakers stand one wide gap right of Mercedes, so the two numerals ("$12B" HERO over
 *  Mercedes, "$10B" SECONDARY over the Lakers) never meet. */
export const PITCH_PAIR = 224;
export const X_LAKERS = X_MERC + PITCH_PAIR;

// --- the frame -------------------------------------------------------------------------------------
/** The 9:16 keep-in box (CRAFT.md), BEFORE StoutStage's dy shift. */
export const KEEP = { x0: 65, x1: 1015, y0: 290, y1: 1070 } as const;
/** StoutStage dy (the user's standing "move it down slightly" on 9:16 Cheeky Pint). */
export const DY = 190;
export const sxOf = (c: Cam, wx: number) => 540 + (wx - c.x) * c.k;
export const syOf = (c: Cam, wy: number) => 960 + (wy - c.y) * c.k;
/** World point under screen point (sx, sy) for camera c (type is laid out in SCREEN px, drawn in world). */
export const wAt = (c: Cam, sx: number, sy: number) => ({ x: c.x + (sx - 540) / c.k, y: c.y + (sy - 960) / c.k });
/** How far a screen box sticks out of KEEP (0 = inside), for load-time / probe checks. */
export const keepInMiss = (b: { x0: number; x1: number; y0: number; y1: number }) =>
  Math.max(0, KEEP.x0 - b.x0, b.x1 - KEEP.x1, KEEP.y0 - b.y0, b.y1 - KEEP.y1);

// --- camera rests ------------------------------------------------------------------------------------
/** A camera of zoom k that puts world (wx, FLOOR) at screen (sx, floorY) (pre-dy). */
export const restCam = (wx: number, sx: number, floorY: number, k: number): Cam => camFor(wx, FLOOR, sx, floorY, k);
/** Cut 29's resolved frame: Mercedes + Lakers, k 2.4 (tiles 230 px), the pair's centre a hair right of the
 *  middle (x 548) so "$12B" clears the left margin, the floor at y 1062 so the HERO numeral's "$" top sits at
 *  ~y 296 (pre-dy). Cut 49 starts from Mercedes' half of it. */
export const REST29 = (() => {
  const k = 2.4;
  const floorY = 1062;
  const cam = restCam((X_MERC + X_LAKERS) / 2, 548, floorY, k);
  return { k, floorY, cam } as const;
})();

// --- the TALL value scale (director's note, Nov 18: "the columns are stubby") ---------------------------
/** Value columns ~1.7x taller against the tiles: $12B = 252 world px (2.6 tiles), $10B = 210, $6B = 126 (half of
 *  $12B). A rung every $2B = 42. Cuts 29 and 49 use it; VALUE (12.5) stays for anyone already on it. */
export const VALUE_PX_PER_B_TALL = 21;
export const VALUE_TALL_RUNG = VALUE_RUNG_B * VALUE_PX_PER_B_TALL;
export const valueHTall = (billions: number) => billions * VALUE_PX_PER_B_TALL;
/** The pair on the tall scale: wider still, so "$12B" (HERO) and "$10B" (SECONDARY) keep ~46 px apart at k 1.71. */
export const PITCH_PAIR_TALL = 240;
/** The tile on the tall scale (director's review 2: "the Lakers wordmark is a few px tall"): 15 % larger than
 *  GEO.TILE, so the crests and the F1 lockup read on a phone. Pass ValueColumn `tile={TILE_TALL}`. */
export const TILE_TALL = 110;
export const X_LAKERS_TALL = X_MERC + PITCH_PAIR_TALL;
/** Cut 29's resolved frame on the tall scale: k 1.71 (tiles 164 px), the pair centred, the floor at y 1066 (pre-dy):
 *  a $12B column + its tile + HERO "$12B" span the keep-in height ("$" top ~y 292). With 96-px tiles. */
export const REST29_TALL = (() => {
  const k = 1.71;
  const floorY = 1066;
  const cam = restCam((X_MERC + X_LAKERS_TALL) / 2, 540, floorY, k);
  return { k, floorY, cam } as const;
})();

/** REST29_TALL with TILE_TALL tiles: k 1.655 (tiles 182 px on screen). */
export const REST29_TALL_T = (() => {
  const k = 1.655;
  const floorY = 1066;
  const cam = restCam((X_MERC + X_LAKERS_TALL) / 2, 540, floorY, k);
  return { k, floorY, cam } as const;
})();

// ===========================================================================
// ValueColumn — a team's VALUE: its tile, and a glass column rising out of a slot in the tile's top edge,
// filled from the slot up with amber (Mercedes), cream (the team the line names) or board (context), with
// a rung every `rung` on the fill. ONE object: one union shadow at its elevation, the lit edge, the slot
// joint. Built from the kit's Pillar parts (same geometry tokens, glass tint + hairline, AmberGradient,
// bloomFilter, hot edge, rung colour, slot line, foot occlusion); Pillar itself has no cream fill and no
// glass straight out of the tile, hence this object.
// ===========================================================================
export type FillTone = "amber" | "cream" | "board";
export type ValueColumnProps = {
  x: number;
  /** tile size, world (default GEO.TILE 96; the tall-scale cuts use TILE_TALL) */
  tile?: number;
  k: number;
  figure: Figure;
  /** where the tile stands (its bottom), world; default FLOOR */
  floor?: number;
  /** the glass's height above the tile's top edge, world (0 = no glass) */
  glass?: number;
  /** the fill's height above the tile's top edge, world (clamped to the glass when there is one) */
  fill?: number;
  fillTone?: FillTone;
  /** rung spacing on the fill, world (default VALUE_RUNG); 0 = none */
  rung?: number;
  /** the glass hairline: 0 = lo (air) .. 1 = hi (backed), eased by tone */
  glassHi?: number;
  /** the tile's and a cream fill's tone: 0 = cream (lit) .. 1 = board (context) */
  dim?: number;
  elevation?: Elevation;
  /** 0..1 toward the next elevation: grows the shadow and raises the body 6 world px (museShared LIFT_DY) */
  lift?: number;
  /** the house entrance 0..1 (slide up 24 SCREEN px + fade, the whole object) */
  enter?: number;
  /** the amber band (amberBandFor(cam)): every amber body in a frame samples one gradient */
  amberBand?: [number, number];
};
const LIFT_DY = 6;
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `wv${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

export const ValueColumn: React.FC<ValueColumnProps> = (p) => {
  const uid = uidOf(useId());
  const k = p.k;
  const T = p.tile ?? GEO.TILE;
  const Wb = GEO.BAR;
  const r = GEO.RADIUS;
  const dim = clamp01(p.dim ?? 0);
  const lift = clamp01(p.lift ?? 0);
  const en = p.enter === undefined ? 1 : easeOutCubic(p.enter);
  const floor = (p.floor ?? FLOOR) - LIFT_DY * smoothstep(lift);
  const tileTop = floor - T;
  const glass = Math.max(0, p.glass ?? 0);
  const fill = Math.max(0, Math.min(glass > 0 ? glass : Infinity, p.fill ?? 0));
  const tone: FillTone = p.fillTone ?? "amber";
  const rung = p.rung ?? VALUE_RUNG;
  const x0 = p.x - Wb / 2;
  const band = p.amberBand ?? [tileTop - Math.max(glass, fill), floor];
  const fillFull = glass > 0 && fill >= glass - 0.5;
  if (en <= 0.001) return null;

  // the one silhouette: tile + glass (faint: it is transparent) + fill
  const tileD = rectPath(p.x - T / 2, tileTop, T, T, r);
  const sil = [{ d: tileD }];
  if (glass > 0.05) sil.push({ d: rectPath(x0, tileTop - glass, Wb, glass + r, r, true, false), a: 0.3 } as { d: string; a: number });
  if (fill > 0.05) sil.push({ d: rectPath(x0, tileTop - fill, Wb, fill + r, fillFull ? r : 0, true, false) });

  const creamTopC = mixHex(COLOR.cream, COLOR.board, dim);
  const creamFootC = mixHex(COLOR.creamFoot, COLOR.boardFoot, dim);
  const fillDim = tone === "board" ? 1 : dim;
  const loEdge = lerp(ALPHA.edge, ALPHA.edgeBoard, dim);
  const slotW = Wb + (2 * EDGE.SLOT_LIP) / k;
  const slotH = EDGE.SLOT / k;
  const hw = STROKE.HAIRLINE / k / 2;
  const rungs: number[] = [];
  if (fill > 0.05 && rung > 0.5) {
    const n = Math.floor(fill / rung + 1e-6);
    for (let i = 1; i <= n; i++) {
      const y = tileTop - i * rung;
      if (y > tileTop - fill + (EDGE.HOT + 2) / k) rungs.push(y);
    }
  }
  const rungColor = tone === "amber" ? COLOR.rung : mixHex(mixHex(COLOR.creamFoot, COLOR.boardFoot, fillDim), COLOR.inkDark, 0.22);
  const fillTop = tileTop - fill;
  return (
    <g opacity={en < 1 ? f3(en) : undefined} transform={en < 1 ? `translate(0 ${f3(((1 - en) * 24) / k)})` : undefined}>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(tileTop - fill)} x2="0" y2={f3(floor)}>
          <stop offset="0" stopColor={creamTopC} />
          <stop offset="1" stopColor={creamFootC} />
        </linearGradient>
        <linearGradient id={`${uid}t`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(tileTop)} x2="0" y2={f3(floor)}>
          <stop offset="0" stopColor={creamTopC} />
          <stop offset="1" stopColor={creamFootC} />
        </linearGradient>
        <linearGradient id={`${uid}f`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(fillTop)} x2="0" y2={f3(tileTop)}>
          <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, fillDim)} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, fillDim)} />
        </linearGradient>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={p.x - T / 2} y={tileTop} width={T} height={T}>
          <rect x={p.x - T / 2} y={tileTop} width={T} height={T} fill="#fff" />
          <g transform={`translate(${f3(p.x - T / 2)} ${f3(tileTop)})`}>
            <FigureMark figure={p.figure} size={T} />
          </g>
        </mask>
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 1. the one shadow */}
      <ElevationShadow silhouette={sil} elevation={p.elevation ?? "rest"} lift={lift} contact={(p.elevation ?? "rest") === "rest" ? { x: p.x, y: p.floor ?? FLOOR, w: T } : null} />

      {/* 2. the glass body (behind the fill) */}
      {glass > 0.05 ? <path d={rectPath(x0, tileTop - glass, Wb, glass, r, true, false)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} /> : null}

      {/* 3. the tile, its figure knocked out */}
      <path d={tileD} fill={`url(#${uid}t)`} mask={`url(#${uid}k)`} />

      {/* 4. the fill */}
      {fill > 0.05 ? (
        tone === "amber" ? (
          <>
            <g style={{ filter: bloomFilter(k) }}>
              <path d={rectPath(x0, fillTop, Wb, fill, r, fillFull || glass <= 0.05, false)} fill={`url(#${uid}a)`} />
            </g>
            <path d={rectPath(x0, fillTop, Wb, Math.min(fill, EDGE.HOT_FALL / k), fillFull ? r : 0, true, false)} fill={`url(#${uid}h)`} />
            <path d={`M${f3(x0 + (fillFull ? r : 0))} ${f3(fillTop + EDGE.HOT / k / 2)}H${f3(x0 + Wb - (fillFull ? r : 0))}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
          </>
        ) : (
          <>
            <path d={rectPath(x0, fillTop, Wb, fill, r, fillFull || glass <= 0.05, false)} fill={`url(#${uid}f)`} />
            <path d={`M${f3(x0 + r)} ${f3(fillTop + EDGE.CREAM / k / 2)}H${f3(x0 + Wb - r)}`} stroke={COLOR.edge} strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, fillDim)} strokeWidth={f3(EDGE.CREAM / k)} />
          </>
        )
      ) : null}
      {rungs.length ? (
        <g stroke={rungColor} strokeWidth={f3(STROKE.HAIRLINE / k)}>
          {rungs.map((y) => (
            <line key={y} x1={f3(x0)} x2={f3(x0 + Wb)} y1={f3(y)} y2={f3(y)} />
          ))}
        </g>
      ) : null}

      {/* 5. the tile's lit top edge, broken by the slot */}
      {(() => {
        const y = tileTop + EDGE.CREAM / k / 2;
        const sw = f3(EDGE.CREAM / k);
        const tx0 = p.x - T / 2 + r;
        const tx1 = p.x + T / 2 - r;
        if (glass <= 0.05 && fill <= 0.05) return <path d={`M${f3(tx0)} ${f3(y)}H${f3(tx1)}`} stroke={COLOR.edge} strokeOpacity={loEdge} strokeWidth={sw} />;
        return (
          <path d={`M${f3(tx0)} ${f3(y)}H${f3(p.x - slotW / 2)}M${f3(p.x + slotW / 2)} ${f3(y)}H${f3(tx1)}`} stroke={COLOR.edge} strokeOpacity={loEdge} strokeWidth={sw} />
        );
      })()}

      {/* 6. the joint: the foot occlusion on the fill and the slot line */}
      {glass > 0.05 || fill > 0.05 ? (
        <>
          {fill > 0.05 ? (
            <rect x={f3(x0)} y={f3(tileTop - Math.min(fill, EDGE.FOOT_AO / k))} width={f3(Wb)} height={f3(Math.min(fill, EDGE.FOOT_AO / k))} fill={`url(#${uid}ao)`} />
          ) : null}
          <rect x={f3(p.x - slotW / 2)} y={f3(tileTop - slotH / 2)} width={f3(slotW)} height={f3(slotH)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
        </>
      ) : null}

      {/* 7. the glass hairline: sides and top, open at its base */}
      {glass > 0.05 ? (
        <path
          d={`M${f3(x0 + hw)} ${f3(tileTop)}V${f3(tileTop - glass + hw + r)}A${r} ${r} 0 0 1 ${f3(x0 + hw + r)} ${f3(tileTop - glass + hw)}H${f3(x0 + Wb - hw - r)}A${r} ${r} 0 0 1 ${f3(
            x0 + Wb - hw,
          )} ${f3(tileTop - glass + hw + r)}V${f3(tileTop)}`}
          fill="none"
          stroke={COLOR.glass}
          strokeOpacity={f3(lerp(ALPHA.glassLo, ALPHA.glassHi, smoothstep(p.glassHi ?? 0)))}
          strokeWidth={f3(STROKE.HAIRLINE / k)}
        />
      ) : null}
    </g>
  );
};
/** The world top of a ValueColumn (its glass or fill, whichever is taller) at rest. */
export const columnTop = (glass: number, fill = 0, floor = FLOOR) => floor - GEO.TILE - Math.max(glass, fill);

// ===========================================================================
// MoneyOdometer — "$<n>B" as an odometer on PROPORTIONAL advances: each digit column rolls between its
// old and new figure (smoothstep of the fractional part, as the kit's Numeral), and a column that is
// born (9 -> 10) opens from zero width while its "1" rolls in, so the "$" never rolls and the string
// stays centred. Landed (whole value, no blur) it is exactly the kit Numeral's static text. Söhne
// Dreiviertelfett, the house entrance (slide up 24 + fade + blur 6 -> 0). (x, y) world, y = baseline.
// ===========================================================================
const ADV: Record<string, number> = {
  "0": 0.646, "1": 0.409, "2": 0.584, "3": 0.586, "4": 0.619, "5": 0.586, "6": 0.603, "7": 0.57, "8": 0.609,
  "9": 0.603, $: 0.61, B: 0.649, M: 0.868,
};
const toneColor = (t: Tone) => (t === "cream" ? COLOR.inkCream : t === "creamLo" ? COLOR.inkCreamLo : t === "dark" ? COLOR.inkDark : COLOR.amberTop);
/** Roll blur (SCREEN px sigma) for a value moving dv per frame at size px: a 180-degree shutter on the
 *  rolling digit's own speed (stoutActB's counterBlur rule), capped at a tenth of the line. */
export const rollBlurOf = (v: number, dv: number, px: number) => {
  const frac = v - Math.floor(v);
  const speed = px * 6 * frac * (1 - frac) * Math.abs(dv);
  return Math.min(px / 10, 0.15 * speed);
};
/** The drum: one pitch (em) between the outgoing and the incoming string (as cut 1's "$900M" -> "$1B"). */
export const DRUM_PITCH = 1.22;
/** The feathered drum window, applied to the ROLLING glyphs only (static characters are never masked): opaque
 *  over a figure's own extent (cap 0.729 em above the baseline, a hair either side), a soft 0.25 em edge above and
 *  a short 0.12 em one below, so a rolling digit fades out before it reaches whatever stands under the numeral
 *  (a column top sits SPACE.CLEAR = 0.13 em of HERO below). World px; yy = the baseline. */
const DrumMask: React.FC<{ id: string; x: number; w: number; yy: number; fs: number }> = ({ id, x, w, yy, fs }) => {
  const top = 0.25 * fs;
  const bot = 0.12 * fs;
  const y0 = yy - (METRIC.fig + 0.04) * fs - top;
  const y1 = yy + 0.0 * fs + bot;
  const h = y1 - y0;
  return (
    <>
      <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset={f3(top / h)} stopColor="#fff" stopOpacity="1" />
        <stop offset={f3(1 - bot / h)} stopColor="#fff" stopOpacity="1" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <mask id={id} maskUnits="userSpaceOnUse" x={f3(x)} y={f3(y0)} width={f3(w)} height={f3(h)}>
        <rect x={f3(x)} y={f3(y0)} width={f3(w)} height={f3(h)} fill={`url(#${id}g)`} />
      </mask>
    </>
  );
};
/** Roll blur for a `linear` MoneyOdometer: the digit moves px x dv per frame. */
export const rollBlurLinear = (dv: number, px: number) => Math.min(px / 10, 0.15 * px * Math.abs(dv));
export const MoneyOdometer: React.FC<{
  x: number;
  y: number;
  k: number;
  px: number;
  value: number;
  prefix?: string;
  suffix?: string;
  rollBlur?: number;
  tone?: Tone;
  glow?: boolean;
  enter?: number;
  exit?: number;
  /** a tone override (any #rrggbb), e.g. an eased cream -> creamLo */
  color?: string;
  /** true: each step rolls linearly with the value (no dwell on whole values mid-count: N-1 never holds);
   *  drive `value` with an eased curve instead. Default false (the kit Numeral's smoothstep per step). */
  linear?: boolean;
  /** true: the drum window is feathered (soft 0.25 em edges outside the glyphs' extent) and the drum pitch is
   *  1.22 em, so no rolling digit ever shows a hard cut edge. Default false (the hard window, as before). */
  feather?: boolean;
}> = ({ x, y, k, px, value, prefix = "$", suffix = "B", rollBlur = 0, tone = "cream", glow = false, enter = 1, exit = 0, color, linear = false, feather = false }) => {
  const uid = uidOf(useId());
  const a = easeOutCubic(enter);
  const e = 1 - Math.pow(1 - clamp01(exit), 3);
  const opacity = a * (1 - e);
  if (opacity <= 0.002) return null;
  const lift = (1 - a) * 24 + e * 24;
  const blur = 6 * (1 - a) + 6 * e;
  const fs = px / k;
  const yy = y + lift / k;
  const ink = color ?? toneColor(tone);
  const v = Math.max(0, value);
  const lo = Math.floor(v + 1e-9);
  const frac = clamp01(v - lo);
  const roll = linear ? frac : smoothstep(frac);
  const rolling = frac > 1e-6;
  const A = `${lo}`;
  const B = `${lo + 1}`;
  const n = Math.max(A.length, rolling ? B.length : A.length);
  const a2 = A.padStart(n, " ");
  const b2 = (rolling ? B : A).padStart(n, " ");
  const tr = TRACK.numeral * fs;
  const advOf = (c: string) => (c === " " ? 0 : (ADV[c] ?? 0.6) * fs + tr);
  const cols = [...a2].map((c, i) => ({ from: c, to: b2[i], w: lerp(advOf(c), advOf(b2[i]), rolling ? roll : 0) }));
  const pre = [...prefix].map((c) => advOf(c));
  const suf = [...suffix].map((c) => advOf(c));
  const total = pre.reduce((s, w) => s + w, 0) + cols.reduce((s, c) => s + c.w, 0) + suf.reduce((s, w) => s + w, 0) - tr;
  let cx = x - total / 2;
  const nodes: React.ReactNode[] = [];
  const rollNodes: React.ReactNode[] = [];
  const put = (key: string, c: string, w: number, dy = 0, filt?: string, roll = false) => {
    if (c !== " ") {
      (roll && feather ? rollNodes : nodes).push(
        <text key={key} x={f3(cx + (w - tr) / 2)} y={f3(yy + dy)} textAnchor="middle" filter={filt}>
          {c}
        </text>,
      );
    }
  };
  [...prefix].forEach((c, i) => {
    put(`p${i}`, c, pre[i]);
    cx += pre[i];
  });
  const lineH = feather ? DRUM_PITCH * fs : fs;
  const blurId = `${uid}vb`;
  const filt = rollBlur > 0.05 ? `url(#${blurId})` : undefined;
  cols.forEach((c, i) => {
    if (!rolling || c.from === c.to) put(`d${i}`, c.from, c.w);
    else {
      put(`d${i}a`, c.from, c.w, -roll * lineH, filt, true);
      put(`d${i}b`, c.to, c.w, (1 - roll) * lineH, filt, true);
    }
    cx += c.w;
  });
  [...suffix].forEach((c, i) => {
    put(`s${i}`, c, suf[i]);
    cx += suf[i];
  });
  const filters: string[] = [];
  if (blur > 0.05) filters.push(`blur(${f3(blur / k)}px)`);
  if (glow) filters.push(bloomFilter(k));
  return (
    <g opacity={f3(opacity)} style={{ filter: filters.length ? filters.join(" ") : undefined }}>
      <defs>
        {feather ? (
          <DrumMask id={`${uid}m`} x={x - total / 2 - fs} w={total + 2 * fs} yy={yy} fs={fs} />
        ) : (
          <clipPath id={`${uid}clip`}>
            <rect x={f3(x - total / 2 - fs)} y={f3(yy - fs * 0.9)} width={f3(total + 2 * fs)} height={f3(fs * 1.06)} />
          </clipPath>
        )}
        {rollBlur > 0.05 ? (
          <filter id={blurId} x="-5%" y="-30%" width="110%" height="160%">
            <feGaussianBlur stdDeviation={`0 ${f3(rollBlur / k)}`} />
          </filter>
        ) : null}
      </defs>
      <g
        clipPath={feather ? undefined : `url(#${uid}clip)`}
        fontFamily={FONT_NUM}
        fontWeight={700}
        fontSize={f3(fs)}
        fill={ink}
        style={{ fontFeatureSettings: '"lnum" 1' }}
      >
        {nodes}
        {rollNodes.length ? <g mask={`url(#${uid}m)`}>{rollNodes}</g> : null}
      </g>
    </g>
  );
};
/**
 * MoneyDrum — ONE drum turn between two whole values ("$10B" -> "$12B": no intermediate value): the characters
 * that differ roll up and out / up and in, one DRUM_PITCH apart so they never overlap, at full opacity inside the
 * feathered window (the only fades); the characters both strings share stay still. `t` 0..1 is the turn's progress (pass it eased); `rollBlur` SCREEN px sigma,
 * proportional to its speed. Each string is centred on x on MoneyOdometer's proportional advances, so t = 0 / 1
 * draw exactly what a landed MoneyOdometer draws. The house entrance as MoneyOdometer.
 */
export const MoneyDrum: React.FC<{
  x: number;
  y: number;
  k: number;
  px: number;
  from: string;
  to: string;
  t: number;
  rollBlur?: number;
  tone?: Tone;
  glow?: boolean;
  enter?: number;
  color?: string;
}> = ({ x, y, k, px, from, to, t, rollBlur = 0, tone = "cream", glow = false, enter = 1, color }) => {
  const uid = uidOf(useId());
  const a = easeOutCubic(enter);
  if (a <= 0.002) return null;
  const fs = px / k;
  const yy = y + ((1 - a) * 24) / k;
  const tr = TRACK.numeral * fs;
  const u = clamp01(t);
  const pitch = DRUM_PITCH * fs;
  const filt = rollBlur > 0.05 && u > 0 && u < 1 ? `url(#${uid}vb)` : undefined;
  // the two strings laid out on proportional advances; a character that is the same in both (same index from the
  // right) stays put while its column's width eases; only the differing characters turn on the drum
  const n = Math.max(from.length, to.length);
  const A = from.padStart(n, " ");
  const B = to.padStart(n, " ");
  const advOf = (c: string) => (c === " " ? 0 : (ADV[c] ?? 0.6) * fs + tr);
  const widths = [...A].map((c, i) => lerp(advOf(c), advOf(B[i]), u));
  const total = widths.reduce((q, w) => q + w, 0) - tr;
  let cx = x - total / 2;
  const still: React.ReactNode[] = [];
  const rolling: React.ReactNode[] = [];
  [...A].forEach((c, i) => {
    const xc = cx + (widths[i] - tr) / 2;
    cx += widths[i];
    if (c === B[i]) {
      if (c !== " ") still.push(<text key={`s${i}`} x={f3(xc)} y={f3(yy)} textAnchor="middle">{c}</text>);
      return;
    }
    if (u < 1 && c !== " ") rolling.push(<text key={`a${i}`} x={f3(xc)} y={f3(yy - u * pitch)} textAnchor="middle" filter={filt}>{c}</text>);
    if (u > 0 && B[i] !== " ") rolling.push(<text key={`b${i}`} x={f3(xc)} y={f3(yy + (1 - u) * pitch)} textAnchor="middle" filter={filt}>{B[i]}</text>);
  });
  const wMax = Math.max(moneyWidth(from, px), moneyWidth(to, px)) / k;
  const filters: string[] = [];
  const blur = 6 * (1 - a);
  if (blur > 0.05) filters.push(`blur(${f3(blur / k)}px)`);
  if (glow) filters.push(bloomFilter(k));
  return (
    <g opacity={f3(a)} style={{ filter: filters.length ? filters.join(" ") : undefined }}>
      <defs>
        <DrumMask id={`${uid}m`} x={x - wMax / 2 - fs} w={wMax + 2 * fs} yy={yy} fs={fs} />
        {filt ? (
          <filter id={`${uid}vb`} x="-5%" y="-30%" width="110%" height="160%">
            <feGaussianBlur stdDeviation={`0 ${f3(rollBlur / k)}`} />
          </filter>
        ) : null}
      </defs>
      <g fontFamily={FONT_NUM} fontWeight={700} fontSize={f3(fs)} fill={color ?? toneColor(tone)} style={{ fontFeatureSettings: '"lnum" 1' }}>
        {still}
        {rolling.length ? <g mask={`url(#${uid}m)`}>{rolling}</g> : null}
      </g>
    </g>
  );
};
/** Screen width of a landed "$<n>B" at px (MoneyOdometer's own advances). */
export const moneyWidth = (text: string, px: number) => [...text].reduce((s, c) => s + (ADV[c] ?? 0.6) * px, 0) + TRACK.numeral * px * Math.max(0, text.length - 1);
/** A numeral standing on a column: its baseline SPACE.CLEAR above the column top; returns the screen box. */
export const numeralBoxOn = (c: Cam, wx: number, topWorld: number, text: string, px: number) => {
  const base = syOf(c, topWorld) - SPACE.CLEAR;
  const w = moneyWidth(text, px);
  const sx = sxOf(c, wx);
  return { base, x0: sx - w / 2, x1: sx + w / 2, y0: base - px * METRIC.dollarTop, y1: base + px * METRIC.dollarDesc };
};
export { TYPE };
