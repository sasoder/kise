// ===================================================================================================================
// benchShared — THE WORLD of sam-benchmaxxing (Cheeky Pint S4E07, Sam Altman, "better than other labs at not
// benchmaxxing"). Owner: the cut-1 builder (BenchmaxxedTower). Cuts 1, 3 and 5 stand in this world; cuts 2 and 4
// borrow its pieces. Import READ-ONLY. A later change keeps every old name, adds the new one and is logged in
// generated/components/sam-benchmaxxing/SHARED_CHANGES.md.
//
// THE LOOK: Cheeky Pint stout values carried into the AIR, as the Scott Kirby clips (scott-radar-map/
// MinusSixtyToPlusSixty + npsColumnsParts/Plan, scott-aircraft-order/aircraftShared, scott-free-wifi/wifiSky): the
// airfield apron in AirStage under a warm golden-hour sky deepening to espresso, cream card objects under one key
// light from the upper left, AMBER = THE SCORE (a benchmark column's fill, OpenAI's shine, the sealed cards'
// numerals) and nothing else glows, board/umber glass fills for the other labs, Söhne, grain, nothing black.
// RENDER EVERY CUT THAT USES BenchStage WITH --gl=angle (AirStage is WebGL).
//
// THE CHART PLANE (npsColumnsPlan's mapping, copied): every 2D piece lives on the vertical plane Z = ZC (330 m) at the
// apron, drawn in CHART PX: a look {x, y, k} puts world point (look.x, look.y) on the frame's middle (540, 960) at zoom
// k (screen = 540 + (x - look.x) k, 960 + (y - look.y) k). The apron's ground line (where tiles, columns and cards
// stand) is GROUND. A plane of constant Z projects flat, so the 2D look maps exactly onto a side AirCam (benchCamOf):
// 3D jets, the ground and the sky line up with the 2D chart under any look. 1 m on the plane = S0 = 7 chart px.
//
// API (all geometry in chart px; `k` = the look's zoom, so hairlines stay screen px)
//   GROUND, F0, ZC, EYE, S0, FOG, GROUND_SPEC, benchCamOf(look) -> AirCam, toScreenB(look, x, y), Look
//   benchCam(startLook, glides, frames) -> { at(f), rest, track }   museShared makeClockCam (house damped glides)
//   <BenchStage look S rest? world? under? html?>{chart-px SVG children}</BenchStage>
//                     AirStage + the apron + the chart overlay (an <svg> whose <g> carries the look transform).
//                     world = 3D (<BenchJet>), under = screen-px SVG between the sky and the 3D (<BenchContrail>),
//                     html = screen-px DOM above the chart overlay.
//   ROW, rowX(i), EVEN_RUNGS, LAB_MARK_OF, OPENAI_SLOT, glassH(rungs), capY(rungs)   the 5-tile chart row
//   TOWER_CAM_START, TOWER_CAM_GLIDES, TOWER_CAM, EVEN_LOOK (= cut 1's camera at f20), EVEN_F   cut 1's camera
//   REV 1: LIFT_CAM, LIFT_EVEN_LOOK, liftAt(f), liftLook, liftScreenTf(f)   cut 1's camera lifted clear of the Shorts overlay
//   <Slot> <SlotLip>  a slot in the apron (or a tile's top edge) and its lit front lip (draw the lip after the piece)
//   <BenchColumn x base w? rungs fill k band? headroom? slot? open? cap? shadow?>  glass column with rungs rising out of
//                     a slot at `base`: fill "amber" (the score: band gradient, fixed bloom, hot top edge) | "board"
//                     (umber glass fill, dim rungs) | "empty" (faint dashed glass outline, no fill, no rungs).
//                     cap(topY) draws content riding the glass top (a tile whose floor is topY).
//   <LabTile x floor size k mark dim?>  an anonymous lab: board tile + one fictional ink mark (LAB_MARKS ids)
//   REV 1: <LabTile ... logo?>  a real lab mark instead (LAB_LOGOS: claude | gemini | grok | deepseek; LAB_LOGO_OF by slot)
//   <OpenAITile x floor size k lean? pivotX? bob? glow?>  macintoshShared's ChatGPTMark (cream tile, ink blossom),
//                     tipped `lean` deg about (x + pivotX, floor), raised `bob` px, a soft amber underlight `glow` 0..1
//   <ThingCard id x floor w k flip? rise? slot? band?>  a tall cream card (0.72 aspect) in a slot on the apron: back =
//                     board with a big amber numeral ("science" 1, "nice" 2), front = cream with a heavy Lucide glyph
//                     over a two-line ink label; flip 0 back .. 1 front about its vertical axis (edge mid-turn)
//   <BenchTile id x floor w k dim?>  a cream tile naming a real benchmark ("swe" SWE-bench + code, "aime" AIME + sigma)
//   <BenchGlyph name x y size color?>  flask | smile | code | sigma at museShared's GLYPH_STROKE weight
//   <ContactShadow x y w k lift?>  the one soft shadow where an object stands on the apron
//   JetSpec, CUT1_JET, benchJetPose(spec, f), <BenchJet spec f/> (3D, in `world`), <BenchContrail look spec f/>
//                     (2D, in `under`): a distant plain-paint 787-10 crossing at constant speed with its contrail
// ===================================================================================================================
import React, { useId } from "react";
import { ALPHA, COLOR, EDGE, FILL_REF, FONT_LABEL, FONT_NUM, STROKE, bloomFilter, clamp01, mixHex, rectPath } from "../kits/cheeky-pint/stoutShared";
import { GLYPH_STROKE, makeClockCam } from "../kits/cheeky-pint/museShared";
import type { Glide } from "../kits/dwarkesh/outgrowShared";
import { AirStage, B787, JET_DIMS, airProject, fogAmount, jetPoint, type AirCam, type GroundSpec } from "../scott-aircraft-order/aircraftShared";
import { ChatGPTMark } from "../sam-macintosh-moment/macintoshShared";

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `bn${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ss = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

// ===================================================================================================================
// THE CHART PLANE <-> AirCam (npsColumnsPlan.ts, copied)
// ===================================================================================================================
export type Look = { x: number; y: number; k: number };
/** the apron's ground line on the chart plane (chart px): tiles, columns and cards stand here */
export const GROUND = 1600;
export const F0 = 2310;
export const ZC = 330;
/** the eye height (m): the horizon sits S0 * EYE * k = 350 k px above the ground line (the golden glow behind the
 *  row, as the Scott frames; npsColumnsPlan used 18 m with its zero line at mid-frame) */
export const EYE = 50;
export const S0 = F0 / ZC;
export const FOG = fogAmount(ZC);
/** concrete from the camera to the far apron, desert beyond */
export const GROUND_SPEC: GroundSpec = { aprons: [[-1600, -40, 1600, 760]], joints: 7.5 };
export const benchCamOf = (c: Look): AirCam => ({
  mode: "side" as const,
  x: (c.x - 540) / S0,
  y: EYE,
  z: 0,
  f: F0 * c.k,
  horizon: 960 + c.k * (GROUND - c.y - S0 * EYE),
});
export const toScreenB = (c: Look, x: number, y: number) => ({ x: 540 + (x - c.x) * c.k, y: 960 + (y - c.y) * c.k });
/** museShared's makeClockCam: glides { f0, f1, dx?, dy?, k?, warp? } on the cut's clock, the house damped follower */
export const benchCam = (start: Look, glides: Glide[], frames: number) => makeClockCam({ ...start }, glides.map((g) => ({ ...g })), frames);

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
export const BenchStage: React.FC<{
  look: Look;
  S: number;
  rest?: Look;
  world?: React.ReactNode;
  under?: React.ReactNode;
  html?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ look, S, rest, world, under, html, children }) => {
  const tf = `translate(540 960) scale(${look.k}) translate(${-look.x} ${-look.y})`;
  return (
    <AirStage
      cam={benchCamOf(look)}
      S={S}
      rest={benchCamOf(rest ?? look)}
      ground={GROUND_SPEC}
      world={world}
      under={under}
      overlay={
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            <g transform={tf}>{children}</g>
          </svg>
          {html ? <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, overflow: "hidden" }}>{html}</div> : null}
        </>
      }
    />
  );
};

// ===================================================================================================================
// THE CHART ROW (cuts 1 and 5): five tiles in one row on the apron edge, OpenAI in slot 3 of 5 (index 2)
// ===================================================================================================================
/** tile = the lab tile (square), col = the glass column's width, pitch = tile + gap; rung = one rung of the glass;
 *  headroom = glass above the fill. Centred on x 540: tiles at 108, 324, 540, 756, 972 (chart px). */
export const ROW = { n: 5, tile: 192, col: 140, gap: 24, pitch: 216, rung: 72, headroom: 16 } as const;
export const rowX = (i: number) => 540 + (i - 2) * ROW.pitch;
export const OPENAI_SLOT = 2;
/** the fair, even chart (cut 1 settled by f20; cut 5 opens on it): fill height in rungs per slot */
export const EVEN_RUNGS = [1.9, 2.15, 2.05, 1.95, 2.1] as const;
/** the anonymous marks of the four other labs, by slot (OpenAI's slot has none) */
export const LAB_MARK_OF = ["ring", "triangle", null, "diamond", "squareIn"] as const;
/** glass height for a fill of `rungs` (the headroom eases in over the first rungs, Scott's rule) */
export const glassH = (rungs: number, rung: number = ROW.rung, headroom: number = ROW.headroom) => {
  const fh = Math.max(0, rungs * rung);
  return fh + headroom * Math.min(1, fh / (headroom * 4));
};
/** the glass top (chart px) of a column of `rungs` standing on `base` = the floor of a tile riding its cap */
export const capY = (rungs: number, base: number = GROUND) => base - glassH(rungs);

// ===================================================================================================================
// CUT 1's CAMERA (exported so cut 5 can open on cut 1's even chart: EVEN_LOOK = the look at EVEN_F)
// ===================================================================================================================
export const TOWER_CAM_START: Look = { x: 540, y: 772, k: 1.11 };
export const TOWER_CAM_GLIDES: Glide[] = [
  // the opening creep: easing back a touch while the columns settle (the apron line in shot at y ~1860)
  { f0: -30, f1: 30, dy: -6, k: 1.075 },
  // "OpenAI": one eased crane up + pull back with the cap
  { f0: 22, f1: 54, dy: -122, k: 0.97 },
  // the living hold
  { f0: 52, f1: 120, dy: -6, k: 0.985 },
];
export const TOWER_CAM = benchCam(TOWER_CAM_START, TOWER_CAM_GLIDES, 69);
export const EVEN_F = 20;
export const EVEN_LOOK: Look = TOWER_CAM.at(EVEN_F);

// ===================================================================================================================
// REV 1 (2026-10-29, the YouTube Shorts bottom overlay): cuts 1 and 35 lifted so every tile face's bottom edge sits at
// or above y 1500. LIFT_CAM = cut 1's camera (TOWER_CAM) with its whole picture moved by one screen similarity per frame,
// p' = (540, 960) + s (p - (540, 960)) - (0, L): L eases 340 -> 235 px over f0-20 (the camera tilts up with the rising
// columns, which start low in their slots), then L -> 172 and s -> 0.9 through the crane (f22-56: it pulls back a touch
// more, so the tower's tile stays near the top while the stubs clear the overlay). Same motion story, lifted framing.
// LIFT_EVEN_LOOK (= LIFT_CAM.at(EVEN_F)) is the even chart cut 35 opens on. Screen-px layers (cut 1's cloud) take
// liftScreenTf(f) so they move with the picture.
// ===================================================================================================================
export const LIFT = { L0: 340, Leven: 235, Lend: 172, sEnd: 0.9, a0: -6, a1: 22, c0: 22, c1: 56 } as const;
const liftN = (f: number) => ss((f - LIFT.a0) / (LIFT.a1 - LIFT.a0));
/** the lift L (screen px, up) and the scale s about the frame middle at cut 1's frame f */
export const liftAt = (f: number) => {
  const e1 = (liftN(f) - liftN(0)) / (liftN(EVEN_F) - liftN(0));
  const e2 = ss((f - LIFT.c0) / (LIFT.c1 - LIFT.c0));
  return { L: LIFT.L0 - (LIFT.L0 - LIFT.Leven) * e1 - (LIFT.Leven - LIFT.Lend) * e2, s: 1 - (1 - LIFT.sEnd) * e2 };
};
/** a look with its picture lifted by L and scaled by s (see above) */
export const liftLook = (c: Look, L: number, s: number): Look => ({ x: c.x, y: c.y + L / (c.k * s), k: c.k * s });
/** the same move as an SVG transform for a SCREEN-px layer */
export const liftScreenTf = (f: number) => {
  const { L, s } = liftAt(f);
  return `translate(0 ${f3(-L)}) translate(540 960) scale(${f3(s)}) translate(-540 -960)`;
};
const liftCamAt = (f: number) => {
  const { L, s } = liftAt(f);
  return liftLook(TOWER_CAM.at(f), L, s);
};
export const LIFT_CAM = { at: liftCamAt, rest: liftCamAt(0) };
export const LIFT_EVEN_LOOK: Look = LIFT_CAM.at(EVEN_F);

// ===================================================================================================================
// SLOT, LIP, CONTACT SHADOW (npsColumnsParts, copied and adapted)
// ===================================================================================================================
/** A slot (what a column or card comes out of): a dark recess `w` wide on `top`, its far lip catching the key light.
 *  `open` 0..1 widens it from a closed seam to the full mouth. Draw it BEFORE the piece. */
export const Slot: React.FC<{ x: number; top: number; w: number; k: number; open?: number }> = ({ x, top, w, k, open = 1 }) => {
  const uid = uidOf(useId());
  const lip = (2 * EDGE.SLOT_LIP) / k;
  const o = clamp01(open);
  const ww = (w + lip) * (0.86 + 0.14 * o);
  const h = 2 + 5 * o;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.inkDark} stopOpacity={0.12} />
          <stop offset="1" stopColor={COLOR.inkDark} stopOpacity={ALPHA.slot} />
        </linearGradient>
      </defs>
      <path d={rectPath(x - ww / 2, top - h, ww, h, Math.min(2, h / 2), true, false)} fill={`url(#${uid}r)`} />
      <rect x={f3(x - ww / 2 + 2)} y={f3(top - h - 1 / k)} width={f3(Math.max(0, ww - 4))} height={f3(1.2 / k)} fill={COLOR.edge} opacity={0.35} />
    </g>
  );
};
/** The slot's lit front lip, drawn AFTER the piece so it comes out from behind it. */
export const SlotLip: React.FC<{ x: number; top: number; w: number; k: number }> = ({ x, top, w, k }) => {
  const lip = (2 * EDGE.SLOT_LIP) / k;
  return <rect x={f3(x - (w + lip) / 2)} y={f3(top)} width={f3(w + lip)} height={f3(EDGE.CREAM / k)} fill={COLOR.edge} opacity={ALPHA.edge} />;
};
/** The one shadow of an object standing on the apron: soft, behind-right of its foot (the key light is upper left,
 *  a little in front). `lift` 0..1 spreads and fades it. */
export const ContactShadow: React.FC<{ x: number; y: number; w: number; k: number; lift?: number; strength?: number }> = ({ x, y, w, k, lift = 0, strength = 1 }) => {
  const u = clamp01(lift);
  return (
    <ellipse
      cx={f3(x + w * 0.05 + 10 * u)}
      cy={f3(y - 1)}
      rx={f3(w * (0.6 + 0.12 * u))}
      ry={f3(5 + 4 * u)}
      fill={COLOR.shadow}
      opacity={f3((0.5 - 0.22 * u) * strength)}
      style={{ filter: `blur(${f3((3 + 6 * u) / Math.max(0.4, k))}px)` }}
    />
  );
};

// ===================================================================================================================
// THE COLUMN
// ===================================================================================================================
const RADIUS = 8;
/** the other labs' glass fill: board drained toward umber (npsColumnsParts' downside tones, lifted to board) */
export const BOARD_FILL = {
  top: mixHex(COLOR.board, "#7A5638", 0.42),
  foot: mixHex(COLOR.boardFoot, "#5E4029", 0.5),
  edge: mixHex("#5E4029", COLOR.inkDark, 0.35),
  rung: mixHex("#5E4029", COLOR.inkDark, 0.4),
} as const;
const glassPath = (x0: number, w: number, openY: number, endY: number, r: number, hw: number) => {
  const xl = x0 + hw;
  const xr = x0 + w - hw;
  const e = endY + hw;
  return `M${f3(xl)} ${f3(openY)}V${f3(e + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(xl + r)} ${f3(e)}H${f3(xr - r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(xr)} ${f3(e + r)}V${f3(openY)}`;
};
/** the hot top edge of an amber body (SCREEN px: 2 px line + a 12 px falloff), with an optional slow glint */
const HotEdge: React.FC<{ x: number; y: number; w: number; k: number; id: string; glint?: number }> = ({ x, y, w, k, id, glint }) => {
  const fall = EDGE.HOT_FALL / k;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
        {glint !== undefined ? (
          <radialGradient id={`${id}g`}>
            <stop offset="0" stopColor="#FFF6DC" stopOpacity="0.9" />
            <stop offset="1" stopColor="#FFF6DC" stopOpacity="0" />
          </radialGradient>
        ) : null}
      </defs>
      <rect x={f3(x)} y={f3(y)} width={f3(w)} height={f3(fall)} fill={`url(#${id})`} />
      <path d={`M${f3(x)} ${f3(y + EDGE.HOT / k / 2)}H${f3(x + w)}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
      {glint !== undefined ? <ellipse cx={f3(x + w * glint)} cy={f3(y + 1 / k)} rx={f3(w * 0.22)} ry={f3(4 / k)} fill={`url(#${id}g)`} /> : null}
    </g>
  );
};

export type ColumnFill = "amber" | "board" | "empty";
/**
 * BenchColumn — a glass column rising out of a slot at `base` (the apron's ground line, or a tile's top edge): glass
 * `glassH(rungs)` tall, the fill `rungs * rung` inside it, rungs every `rung` from the base, a soft streak of the key
 * light down the glass's left side, the foot occlusion and the slot line at the joint. Hidden behind the lip until
 * the glass clears it. `cap(topY)` draws what rides the glass top (topY = the glass top = the cap tile's floor).
 * `band` = amberBandFor(look) for an amber fill. `glint` 0..1 runs a slow light along the amber's hot edge.
 */
export const BenchColumn: React.FC<{
  x: number;
  base: number;
  w?: number;
  rungs: number;
  fill: ColumnFill;
  k: number;
  band?: [number, number];
  rung?: number;
  headroom?: number;
  slot?: boolean;
  open?: number;
  cap?: (topY: number) => React.ReactNode;
  shadow?: number;
  glint?: number;
}> = ({ x, base, w = ROW.col, rungs, fill, k, band = [base - 1200, base], rung = ROW.rung, headroom = ROW.headroom, slot = true, open = 1, cap, shadow = 1, glint }) => {
  const uid = uidOf(useId());
  const h = glassH(rungs, rung, headroom);
  const x0 = x - w / 2;
  const top = base - h;
  const fh = fill === "empty" ? 0 : Math.max(0, rungs * rung);
  const fy = base - fh;
  const r = Math.min(RADIUS, w / 2, h);
  const hair = Math.max(STROKE.HAIRLINE, 2) / k;
  const show = h > 3 / k;
  const rungYs: number[] = [];
  if (fill !== "empty") for (let i = 1; i * rung < fh; i++) if (base - i * rung > fy + (EDGE.HOT + 4) / k) rungYs.push(base - i * rung);
  const sx = x0 + w * 0.13;
  const sw = Math.max(w * 0.09, 3 / k);
  return (
    <g>
      {slot ? <Slot x={x} top={base} w={w} k={k} open={open} /> : null}
      {show ? (
        <g>
          <defs>
            <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(band[0])} x2="0" y2={f3(band[1])}>
              <stop offset="0" stopColor={COLOR.amberTop} />
              <stop offset="1" stopColor={COLOR.amberFoot} />
            </linearGradient>
            <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(base - 260)} x2="0" y2={f3(base)}>
              <stop offset="0" stopColor={BOARD_FILL.top} />
              <stop offset="1" stopColor={BOARD_FILL.foot} />
            </linearGradient>
            <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
              <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
            </linearGradient>
            {/* form: lit from the upper left, the right third turns away from the key light */}
            <linearGradient id={`${uid}fs`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={fill === "amber" ? COLOR.amberHot : COLOR.cream} stopOpacity={fill === "amber" ? 0.16 : 0.1} />
              <stop offset="0.3" stopColor={COLOR.cream} stopOpacity="0" />
              <stop offset="0.62" stopColor={COLOR.shadow} stopOpacity="0" />
              <stop offset="1" stopColor={fill === "amber" ? mixHex(COLOR.amberFoot, COLOR.inkDark, 0.3) : COLOR.shadow} stopOpacity={fill === "amber" ? 0.5 : 0.28} />
            </linearGradient>
          </defs>
          {shadow > 0 ? <ContactShadow x={x} y={base} w={w} k={k} strength={shadow} /> : null}
          {fill === "empty" ? (
            <path
              d={glassPath(x0, w, base, top, r, hair / 2)}
              fill="none"
              stroke={COLOR.glass}
              strokeOpacity={0.8}
              strokeWidth={f3(hair * 1.25)}
              strokeDasharray={`${f3(10 / k)} ${f3(8 / k)}`}
            />
          ) : (
            <>
              <path d={rectPath(x0, top, w, h, r, true, false)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} />
              {fh > 0.05 ? (
                <g style={fill === "amber" ? { filter: bloomFilter(k) } : undefined}>
                  <path d={rectPath(x0, fy, w, fh, 0, false, false)} fill={`url(#${uid}${fill === "amber" ? "a" : "b"})`} />
                  <path d={rectPath(x0, fy, w, fh, 0, false, false)} fill={`url(#${uid}fs)`} />
                </g>
              ) : null}
              {rungYs.length ? (
                <g stroke={fill === "amber" ? COLOR.rung : BOARD_FILL.rung} strokeWidth={f3(STROKE.HAIRLINE / k)}>
                  {rungYs.map((y) => (
                    <line key={y} x1={f3(x0)} x2={f3(x0 + w)} y1={f3(y)} y2={f3(y)} />
                  ))}
                </g>
              ) : null}
              {fh > 0.05 && fill === "amber" ? <HotEdge x={x0} y={fy} w={w} k={k} id={`${uid}h`} glint={glint} /> : null}
              {fh > 0.05 && fill === "board" ? <rect x={f3(x0)} y={f3(fy)} width={f3(w)} height={f3(2 / k)} fill={BOARD_FILL.edge} /> : null}
              <rect x={f3(x0)} y={f3(base - Math.min(h, EDGE.FOOT_AO / k))} width={f3(w)} height={f3(Math.min(h, EDGE.FOOT_AO / k))} fill={`url(#${uid}ao)`} />
              {h > r + 6 / k ? <rect x={f3(sx)} y={f3(top + r + 2 / k)} width={f3(sw)} height={f3(Math.max(0, h - r - 4 / k))} rx={f3(sw / 2)} fill={COLOR.glass} fillOpacity={0.12} /> : null}
              <path d={glassPath(x0, w, base, top, r, hair / 2)} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={f3(hair)} />
            </>
          )}
        </g>
      ) : null}
      {slot ? <SlotLip x={x} top={base} w={w} k={k} /> : null}
      {cap ? cap(show ? top : base) : null}
    </g>
  );
};

// ===================================================================================================================
// TILES
// ===================================================================================================================
/** the tile corner radius: macintoshShared's MarkTile (size * 0.16), so every tile in the clip is one material */
export const tileRadius = (size: number) => size * 0.16;
/** the anonymous labs' fictional ink marks, in a 100-unit box centred on (0, 0); never a real lab's logo */
export const LAB_MARKS = {
  ring: { d: "M35 0A35 35 0 1 0 -35 0A35 35 0 1 0 35 0ZM20 0A20 20 0 1 1 -20 0A20 20 0 1 1 20 0Z", round: 0 },
  triangle: { d: "M0 -33L37 30H-37Z", round: 9 },
  diamond: { d: "M0 -37L37 0L0 37L-37 0Z", round: 7 },
  squareIn: { d: "M-32 -32H32V32H-32ZM-21 -21V21H21V-21ZM-10 -10H10V10H-10Z", round: 0 },
  hex: { d: "M36 0L18 31.2H-18L-36 0L-18 -31.2H18Z", round: 5 },
  bars: { d: "M-33 -30H33V-15H-33ZM-33 -7.5H33V7.5H-33ZM-33 15H33V30H-33Z", round: 0 },
} as const;
export type LabMark = keyof typeof LAB_MARKS;
/** REV 1: the REAL marks of the four other labs (cuts 1 and 35), inlined unchanged from the prepared single-colour SVGs
 *  in public/sam-benchmaxxing/ (sources and licences: LOGOS.md there). box = the measured ink box in the file's units
 *  [x, y, w, h], fill = inked share of that box, cy = centroid offset (fraction of h), both measured with resvg; drawn
 *  at a uniform scale, nonzero fill, as the files are. */
export const LAB_LOGOS = {
  // Claude spark (Anthropic), Commons File:Claude_AI_symbol.svg, CC0
  claude: { box: [0, 0, 99.9, 100.07], fill: 0.398, cy: -0.017, d: "m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" },
  // Google Gemini spark 2025, Commons File:Google_Gemini_icon_2025.svg, PD-textlogo
  gemini: { box: [0, 0, 64.9, 64.9], fill: 0.353, cy: -0.001, d: "M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" },
  // Grok 2025 slashed ring, Commons File:Grok-icon.svg, CC0
  grok: { box: [69.22, 75.88, 373.56, 358.38], fill: 0.238, cy: -0.007, d: "M213.235 306.019l178.976-180.002v.169l51.695-51.763c-.924 1.32-1.86 2.605-2.785 3.89-39.281 54.164-58.46 80.649-43.07 146.922l-.09-.101c10.61 45.11-.744 95.137-37.398 131.836-46.216 46.306-120.167 56.611-181.063 14.928l42.462-19.675c38.863 15.278 81.392 8.57 111.947-22.03 30.566-30.6 37.432-75.159 22.065-112.252-2.92-7.025-11.67-8.795-17.792-4.263l-124.947 92.341zm-25.786 22.437l-.033.034L68.094 435.217c7.565-10.429 16.957-20.294 26.327-30.149 26.428-27.803 52.653-55.359 36.654-94.302-21.422-52.112-8.952-113.177 30.724-152.898 41.243-41.254 101.98-51.661 152.706-30.758 11.23 4.172 21.016 10.114 28.638 15.639l-42.359 19.584c-39.44-16.563-84.629-5.299-112.207 22.313-37.298 37.308-44.84 102.003-1.128 143.81z" },
  // DeepSeek whale (eye = its hole), Commons File:Deepseek-logo-icon.svg, CC0
  deepseek: { box: [67.33, 115.72, 377.88, 278.12], fill: 0.502, cy: -0.031, d: "M440.898 139.167c-4.001-1.961-5.723 1.776-8.062 3.673-.801.612-1.479 1.407-2.154 2.141-5.848 6.246-12.681 10.349-21.607 9.859-13.048-.734-24.192 3.368-34.04 13.348-2.093-12.307-9.048-19.658-19.635-24.37-5.54-2.449-11.141-4.9-15.02-10.227-2.708-3.795-3.447-8.021-4.801-12.185-.861-2.509-1.725-5.082-4.618-5.512-3.139-.49-4.372 2.142-5.601 4.349-4.925 9.002-6.833 18.921-6.647 28.962.432 22.597 9.972 40.597 28.932 53.397 2.154 1.47 2.707 2.939 2.032 5.082-1.293 4.41-2.832 8.695-4.186 13.105-.862 2.817-2.157 3.429-5.172 2.205-10.402-4.346-19.391-10.778-27.332-18.553-13.481-13.044-25.668-27.434-40.873-38.702a177.614 177.614 0 00-10.834-7.409c-15.512-15.063 2.032-27.434 6.094-28.902 4.247-1.532 1.478-6.797-12.251-6.736-13.727.061-26.285 4.653-42.288 10.777-2.34.92-4.801 1.593-7.326 2.142-14.527-2.756-29.608-3.368-45.367-1.593-29.671 3.305-53.368 17.329-70.788 41.272-20.928 28.785-25.854 61.482-19.821 95.59 6.34 35.943 24.683 65.704 52.876 88.974 29.239 24.123 62.911 35.943 101.32 33.677 23.329-1.346 49.307-4.468 78.607-29.27 7.387 3.673 15.142 5.144 28.008 6.246 9.911.92 19.452-.49 26.839-2.019 11.573-2.449 10.773-13.166 6.586-15.124-33.915-15.797-26.47-9.368-33.24-14.573 17.235-20.39 43.213-41.577 53.369-110.222.8-5.448.121-8.877 0-13.287-.061-2.692.553-3.734 3.632-4.041 8.494-.981 16.742-3.305 24.314-7.471 21.975-12.002 30.84-31.719 32.933-55.355.307-3.612-.061-7.348-3.879-9.245v-.003zM249.4 351.89c-32.872-25.838-48.814-34.352-55.4-33.984-6.155.368-5.048 7.41-3.694 12.002 1.415 4.532 3.264 7.654 5.848 11.634 1.785 2.634 3.017 6.551-1.784 9.493-10.587 6.55-28.993-2.205-29.856-2.635-21.421-12.614-39.334-29.269-51.954-52.047-12.187-21.924-19.267-45.435-20.435-70.542-.308-6.061 1.478-8.207 7.509-9.307 7.94-1.471 16.127-1.778 24.068-.615 33.547 4.9 62.108 19.902 86.054 43.66 13.666 13.531 24.007 29.699 34.658 45.496 11.326 16.778 23.514 32.761 39.026 45.865 5.479 4.592 9.848 8.083 14.035 10.656-12.62 1.407-33.673 1.714-48.075-9.676zm15.899-102.519c.521-2.111 2.421-3.658 4.722-3.658a4.74 4.74 0 011.661.305c.678.246 1.293.614 1.786 1.163.861.859 1.354 2.083 1.354 3.368 0 2.695-2.154 4.837-4.862 4.837a4.748 4.748 0 01-4.738-4.034 5.01 5.01 0 01.077-1.981zm47.208 26.915c-2.606.996-5.2 1.778-7.707 1.88-4.679.244-9.787-1.654-12.556-3.981-4.308-3.612-7.386-5.631-8.679-11.941-.554-2.695-.247-6.858.246-9.246 1.108-5.144-.124-8.451-3.754-11.451-2.954-2.449-6.711-3.122-10.834-3.122-1.539 0-2.954-.673-4.001-1.224-1.724-.856-3.139-3-1.785-5.634.432-.856 2.525-2.939 3.018-3.305 5.6-3.185 12.065-2.144 18.034.244 5.54 2.266 9.727 6.429 15.759 12.307 6.155 7.102 7.263 9.063 10.773 14.39 2.771 4.163 5.294 8.451 7.018 13.348.877 2.561.071 4.74-2.341 6.277-.981.625-2.109 1.044-3.191 1.458z" },
} as const;
export type LabLogo = keyof typeof LAB_LOGOS;
/** REV 1 slot order, left to right: Claude, Gemini, (OpenAI), Grok, DeepSeek */
export const LAB_LOGO_OF = ["claude", "gemini", null, "grok", "deepseek"] as const;
/** the logos' optical size = the fictional marks' (their box's geometric mean = LOGO_K x tile x (FILL_REF / fill)^0.25,
 *  opticalFit's rule at the size the ring / triangle / diamond / square-in marks had on the board tiles) */
export const LOGO_K = 0.44;
/** where a logo lands on a tile of `size` centred on (x, cy): its transform */
export const labLogoTf = (logo: LabLogo, x: number, cy: number, size: number) => {
  const m = LAB_LOGOS[logo];
  const [bx, by, bw, bh] = m.box;
  const gm = LOGO_K * size * Math.pow(FILL_REF / m.fill, 0.25);
  const sc = gm / Math.sqrt(bw * bh);
  const ox = x - (bx + bw / 2) * sc;
  const oy = cy - 0.5 * m.cy * gm - (by + bh / 2) * sc;
  return `translate(${f3(ox)} ${f3(oy)}) scale(${f3(sc)})`;
};
/** the tile's top-lit card body + its lit top edge (MarkTile's recipe), cream at dim 0, board at dim 1 */
const TileBody: React.FC<{ x: number; y0: number; w: number; h: number; r: number; k: number; dim: number }> = ({ x, y0, w, h, r, k, dim }) => {
  const uid = uidOf(useId());
  const topC = mixHex(COLOR.cream, COLOR.board, dim);
  const footC = mixHex(COLOR.creamFoot, COLOR.boardFoot, dim);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + h)}>
          <stop offset="0" stopColor={topC} />
          <stop offset="1" stopColor={footC} />
        </linearGradient>
      </defs>
      <path d={rectPath(x - w / 2, y0, w, h, r)} fill={`url(#${uid}g)`} />
      <path d={`M${f3(x - w / 2 + r)} ${f3(y0 + EDGE.CREAM / k / 2)}H${f3(x + w / 2 - r)}`} stroke={COLOR.edge} strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dim)} strokeWidth={f3(EDGE.CREAM / k)} />
    </g>
  );
};
/** LabTile — another lab: a board tile with one ink mark: a fictional `mark` (LAB_MARKS), or (REV 1) a real `logo`
 *  (LAB_LOGOS), which wins when given; `dim` 0 = board (default), lower values lift it toward cream. No shadow of its
 *  own (it rides a column, which owns the object's one shadow). */
export const LabTile: React.FC<{ x: number; floor: number; size: number; k: number; mark?: LabMark; logo?: LabLogo; dim?: number; lean?: number; pivotX?: number }> = ({
  x,
  floor,
  size,
  k,
  mark = "ring",
  logo,
  dim = 1,
  lean = 0,
  pivotX = 0,
}) => {
  const m = LAB_MARKS[mark];
  const sc = (size * 0.5) / 76;
  const cy = floor - size / 2;
  return (
    <g transform={lean ? `rotate(${f3(lean)} ${f3(x + pivotX)} ${f3(floor)})` : undefined}>
      <TileBody x={x} y0={floor - size} w={size} h={size} r={tileRadius(size)} k={k} dim={dim} />
      {logo ? (
        <path transform={labLogoTf(logo, x, cy, size)} d={LAB_LOGOS[logo].d} fill={COLOR.inkDark} />
      ) : (
        <path
          transform={`translate(${f3(x)} ${f3(cy)}) scale(${f3(sc)})`}
          d={m.d}
          fill={COLOR.inkDark}
          fillRule="evenodd"
          stroke={m.round ? COLOR.inkDark : "none"}
          strokeWidth={m.round || undefined}
          strokeLinejoin="round"
        />
      )}
    </g>
  );
};
/**
 * OpenAITile — the OpenAI tile of this clip: macintoshShared's ChatGPTMark (cream tile, ink blossom, MarkTile's
 * material and radius), its own shadow off (the object it rides owns the shadow; pass `shadow` for a tile standing
 * alone on the apron). lean = deg (negative tips it left) about (x + pivotX, floor); bob = px up; glow 0..1 = a soft
 * amber underlight under its foot (the score shining up on it).
 */
export const OpenAITile: React.FC<{ x: number; floor: number; size: number; k: number; lean?: number; pivotX?: number; bob?: number; glow?: number; shadow?: number }> = ({
  x,
  floor,
  size,
  k,
  lean = 0,
  pivotX = 0,
  bob = 0,
  glow = 0,
  shadow = 0,
}) => {
  const uid = uidOf(useId());
  const fl = floor - bob;
  return (
    <g transform={lean ? `rotate(${f3(lean)} ${f3(x + pivotX)} ${f3(fl)})` : undefined}>
      {glow > 0.002 ? (
        <g>
          <defs>
            <radialGradient id={`${uid}gl`}>
              <stop offset="0" stopColor={COLOR.amberHot} stopOpacity="0.85" />
              <stop offset="0.45" stopColor={COLOR.amberTop} stopOpacity="0.45" />
              <stop offset="1" stopColor={COLOR.amberTop} stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx={f3(x)} cy={f3(fl - size * 0.08)} rx={f3(size * 0.72)} ry={f3(size * 0.3)} fill={`url(#${uid}gl)`} opacity={f3(clamp01(glow))} />
        </g>
      ) : null}
      <ChatGPTMark x={x} floor={fl} size={size} k={k} shadow={shadow} />
    </g>
  );
};

// ===================================================================================================================
// GLYPHS (Lucide geometry, inlined; museShared GlyphMark's stroke rule: GLYPH_STROKE per 96 px of glyph square)
// ===================================================================================================================
type GlyphEl = string | { c: [number, number, number] };
export const BENCH_GLYPHS: Record<"flask" | "smile" | "code" | "sigma", GlyphEl[]> = {
  // Lucide "flask-conical"
  flask: ["M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2", "M6.453 15h11.094", "M8.5 2h7"],
  // Lucide "smile"
  smile: [{ c: [12, 12, 10] }, "M8 14s1.5 2 4 2 4-2 4-2", "M9 9h.01", "M15 9h.01"],
  // Lucide "code"
  code: ["m16 18 6-6-6-6", "m8 6-6 6 6 6"],
  // Lucide "sigma"
  sigma: ["M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8l4.5 6a2 2 0 0 1 0 2.4l-4.5 6a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2"],
};
export type BenchGlyphName = keyof typeof BENCH_GLYPHS;
/** A glyph centred on (x, y) in a square of `size` (its 24-unit box fills GLYPH_FILL-ish of it), ink by default. */
export const BenchGlyph: React.FC<{ name: BenchGlyphName; x: number; y: number; size: number; color?: string }> = ({ name, x, y, size, color = COLOR.inkDark }) => {
  const sc = (size * 0.68) / 20;
  const sw = (GLYPH_STROKE * size) / 96 / sc;
  return (
    <g transform={`translate(${f3(x - 12 * sc)} ${f3(y - 12 * sc)}) scale(${f3(sc)})`} fill="none" stroke={color} strokeWidth={f3(sw)} strokeLinecap="round" strokeLinejoin="round">
      {BENCH_GLYPHS[name].map((e, i) => (typeof e === "string" ? <path key={i} d={e} /> : <circle key={i} cx={e.c[0]} cy={e.c[1]} r={e.c[2]} />))}
    </g>
  );
};

// ===================================================================================================================
// THE THING CARD (cuts 2 and 3)
// ===================================================================================================================
export const THING = {
  science: { glyph: "flask" as BenchGlyphName, lines: ["SCIENTIFIC", "DISCOVERY"], numeral: "1" },
  nice: { glyph: "smile" as BenchGlyphName, lines: ["NICE TO", "WORK WITH"], numeral: "2" },
} as const;
export type ThingId = keyof typeof THING;
/** card proportions and the face layout, as fractions of the card width w (h = w / aspect); y from the card top */
export const THING_LAYOUT = {
  aspect: 0.72,
  radius: 0.05,
  edge: 0.035,
  glyphSize: 0.42,
  glyphCy: 0.33, // x h
  labelPx: 0.112, // x w: cap height = 0.718 x labelPx x w
  line1: 0.69, // baseline, x h
  lineGap: 1.3, // x labelPx
  numeralPx: 0.62, // x w: cap height = 0.729 x numeralPx x w
  numeralCy: 0.5, // x h
} as const;
export const thingH = (w: number) => w / THING_LAYOUT.aspect;
const ThingFront: React.FC<{ id: ThingId; x: number; y0: number; w: number; h: number; k: number }> = ({ id, x, y0, w, h, k }) => {
  const L = THING_LAYOUT;
  const t = THING[id];
  const px = L.labelPx * w;
  return (
    <g>
      <TileBody x={x} y0={y0} w={w} h={h} r={L.radius * w} k={k} dim={0} />
      <BenchGlyph name={t.glyph} x={x} y={y0 + L.glyphCy * h} size={L.glyphSize * w} />
      {t.lines.map((s, i) => (
        <text
          key={i}
          x={f3(x)}
          y={f3(y0 + L.line1 * h + i * L.lineGap * px)}
          textAnchor="middle"
          fontFamily={FONT_LABEL}
          fontSize={f3(px)}
          letterSpacing="0.06em"
          fill={COLOR.inkDark}
        >
          {s}
        </text>
      ))}
    </g>
  );
};
const ThingBack: React.FC<{ id: ThingId; x: number; y0: number; w: number; h: number; k: number; band: [number, number] }> = ({ id, x, y0, w, h, k, band }) => {
  const uid = uidOf(useId());
  const L = THING_LAYOUT;
  const px = L.numeralPx * w;
  return (
    <g>
      <TileBody x={x} y0={y0} w={w} h={h} r={L.radius * w} k={k} dim={1} />
      <defs>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(band[0])} x2="0" y2={f3(band[1])}>
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberFoot} />
        </linearGradient>
      </defs>
      <text
        x={f3(x)}
        y={f3(y0 + L.numeralCy * h + 0.729 * px * 0.5)}
        textAnchor="middle"
        fontFamily={FONT_NUM}
        fontWeight={700}
        fontSize={f3(px)}
        fill={`url(#${uid}a)`}
        style={{ filter: bloomFilter(k), fontFeatureSettings: '"lnum" 1' }}
      >
        {THING[id].numeral}
      </text>
    </g>
  );
};
/**
 * ThingCard — a tall card standing in a slot on the apron (`floor`), w wide, h = w / 0.72. flip 0 = the back to us
 * (board, the big amber numeral) .. 1 = the front (cream, glyph + label). The turn is about its vertical axis: the
 * face narrows to edge-on at flip 0.5, the card's edge (its material, lit on the left) shows mid-turn, and the face
 * darkens as it turns away from the key light. rise 0..1 brings it up out of its slot (hidden below the floor;
 * slot=false for a card that is not in a slot). band = amberBandFor(look).
 */
export const ThingCard: React.FC<{ id: ThingId; x: number; floor: number; w: number; k: number; flip?: number; rise?: number; slot?: boolean; band?: [number, number]; shadow?: number }> = ({
  id,
  x,
  floor,
  w,
  k,
  flip = 0,
  rise = 1,
  slot = true,
  band,
  shadow = 1,
}) => {
  const uid = uidOf(useId());
  const L = THING_LAYOUT;
  const h = thingH(w);
  const y0 = floor - h * clamp01(rise);
  const th = Math.PI * ss(flip);
  const c = Math.cos(th);
  const s = Math.abs(Math.sin(th));
  const faceW = Math.max(0.001, w * Math.abs(c));
  const e = L.edge * w * s;
  const left = x - (faceW + e) / 2;
  const firstHalf = c >= 0;
  // the face's centre and the edge strip: the edge leads on the side turning toward us
  const faceX = firstHalf ? left + faceW / 2 : left + e + faceW / 2;
  const edgeX = firstHalf ? left + faceW : left;
  const sx = faceW / w;
  const turnShade = (1 - Math.abs(c)) * 0.42;
  const bnd: [number, number] = band ?? [y0 - 600, y0 + h];
  const visible = rise > 0.002;
  return (
    <g>
      {slot ? <Slot x={x} top={floor} w={w * 0.9} k={k} /> : null}
      {visible ? (
        <g clipPath={slot ? `url(#${uid}c)` : undefined}>
          <defs>
            <clipPath id={`${uid}c`}>
              <rect x={f3(x - w)} y={f3(floor - h * 2)} width={f3(w * 2)} height={f3(h * 2)} />
            </clipPath>
          </defs>
          {shadow > 0 && rise > 0.98 ? <ContactShadow x={x} y={floor} w={Math.max(faceW + e, w * 0.08)} k={k} strength={shadow} /> : null}
          {e > 0.05 ? (
            <path
              d={rectPath(edgeX, y0, e, h, Math.min(e / 2, L.radius * w * 0.5))}
              fill={firstHalf ? mixHex(COLOR.boardFoot, COLOR.inkDark, 0.18) : mixHex(COLOR.creamFoot, COLOR.board, 0.25)}
            />
          ) : null}
          <g transform={`translate(${f3(faceX)} 0) scale(${f3(sx)} 1) translate(${f3(-x)} 0)`}>
            {firstHalf ? <ThingBack id={id} x={x} y0={y0} w={w} h={h} k={k} band={bnd} /> : <ThingFront id={id} x={x} y0={y0} w={w} h={h} k={k} />}
            {turnShade > 0.002 ? <path d={rectPath(x - w / 2, y0, w, h, L.radius * w)} fill={COLOR.shadow} opacity={f3(turnShade)} /> : null}
          </g>
        </g>
      ) : null}
      {slot ? <SlotLip x={x} top={floor} w={w * 0.9} k={k} /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE BENCHMARK TILE (cut 3)
// ===================================================================================================================
export const BENCH = {
  swe: { name: "SWE-bench", glyph: "code" as BenchGlyphName },
  aime: { name: "AIME", glyph: "sigma" as BenchGlyphName },
} as const;
export type BenchId = keyof typeof BENCH;
/** w wide, h = 0.82 w; the glyph in the upper part, the name (Söhne Kräftig, ink, as the benchmark writes it) below */
export const BENCH_TILE = { aspect: 0.82, glyphSize: 0.36, glyphCy: 0.34, namePx: 0.165, nameBase: 0.8 } as const;
export const BenchTile: React.FC<{ id: BenchId; x: number; floor: number; w: number; k: number; dim?: number; lean?: number }> = ({ id, x, floor, w, k, dim = 0, lean = 0 }) => {
  const B = BENCH_TILE;
  const h = w * B.aspect;
  const y0 = floor - h;
  const t = BENCH[id];
  return (
    <g transform={lean ? `rotate(${f3(lean)} ${f3(x)} ${f3(floor)})` : undefined}>
      <TileBody x={x} y0={y0} w={w} h={h} r={tileRadius(Math.min(w, h)) * 0.8} k={k} dim={dim} />
      <BenchGlyph name={t.glyph} x={x} y={y0 + B.glyphCy * h} size={B.glyphSize * w} />
      <text x={f3(x)} y={f3(y0 + B.nameBase * h)} textAnchor="middle" fontFamily={FONT_LABEL} fontSize={f3(B.namePx * w)} letterSpacing="0.02em" fill={COLOR.inkDark}>
        {t.name}
      </text>
    </g>
  );
};

// ===================================================================================================================
// THE DISTANT AIRLINER AND ITS CONTRAIL
// ===================================================================================================================
/** a jet flying at constant speed (m/frame) nose RIGHT (heading 90) or LEFT (-90), climbing gently; `x0` = its
 *  centre's world X at frame `f0`, `z` its depth (m), `alt` its height (m) at f0. */
export type JetSpec = { x0: number; f0: number; z: number; alt: number; speed: number; climb: number; pitch: number; facing: "right" | "left" };
/** cut 1's jet: 806 m behind the camera (~190 px long in cut 1's end frame), ~245 m up (y ~1000 there, under the
 *  OpenAI tile and above the caption band), 284 m/s; it enters f45, passes behind the tower f58-68; plain paint */
export const CUT1_JET: JetSpec = { x0: 68, f0: 69, z: 806, alt: 244, speed: 11.86, climb: 0.22, pitch: 2, facing: "right" };
export const benchJetPose = (j: JetSpec, f: number) => {
  const dir = j.facing === "right" ? 1 : -1;
  return { at: [j.x0 + dir * j.speed * (f - j.f0), j.z] as [number, number], alt: j.alt + j.climb * (f - j.f0), heading: dir * 90, pitch: j.pitch };
};
/** the jet in AirStage's `world` (WebGL): a B787-10 in plain paint (no amber fin), gear up */
export const BenchJet: React.FC<{ spec: JetSpec; f: number }> = ({ spec, f }) => {
  const p = benchJetPose(spec, f);
  return <B787 variant="10" airline="plain" at={p.at} alt={p.alt} heading={p.heading} pitch={p.pitch} shadow={0} />;
};
/** the exhaust (jet-local, m): ahead of the centre, below the wing, on the centreline (the two trails merge at range) */
const EXHAUST: [number, number, number] = [8.9, 2.5, 0];
const smoothFade = (u: number) => {
  const a = clamp01(u / 0.05);
  const b = clamp01((1 - u) / 0.4);
  return a * a * (3 - 2 * a) * (b * b * (3 - 2 * b));
};
/** The jet's contrail in AirStage's `under` layer (screen px, between the sky and the 3D: the jet covers its head,
 *  the chart covers what passes behind it): a soft cream trail drawn out behind the engines over `age` frames of the
 *  path, widening and thinning with age, a warm grey belly under a lit top. */
export const BenchContrail: React.FC<{ look: Look; spec: JetSpec; f: number; age?: number; lag?: number; opacity?: number }> = ({ look, spec, f, age = 70, lag = 2.5, opacity = 0.9 }) => {
  const uid = uidOf(useId());
  const cam = benchCamOf(look);
  const N = 48;
  const pts: { x: number; y: number; s: number; u: number; puff: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a = lag + (age - lag) * u;
    const p = benchJetPose(spec, f - a);
    const w = jetPoint("B787_10", p.at, p.heading, EXHAUST, p.alt, p.pitch);
    const q = airProject(cam, [w[0], w[1] - 0.05 * a, w[2]]);
    // puffs fixed in the air: keyed to the moment the vapour left the engine
    const t = f - a;
    const puff = 0.84 + 0.16 * Math.sin(t * 0.9 + 1.3) * Math.sin(t * 0.37 + 0.4);
    pts.push({ x: q.x, y: q.y, s: q.s, u, puff });
  }
  const seg = (layer: "belly" | "top") =>
    pts.slice(0, -1).map((p, i) => {
      const q = pts[i + 1];
      const hw = (pp: typeof p) => pp.s * (0.9 + 7 * Math.pow(pp.u, 0.7)) * (layer === "belly" ? 1.15 : 0.8);
      const dy = (pp: typeof p) => (layer === "belly" ? pp.s * (0.35 + 1.6 * pp.u) : 0);
      const a = opacity * smoothFade((p.u + q.u) / 2) * (1 - 0.55 * p.u) * (layer === "belly" ? 0.55 : 0.85) * p.puff;
      const d = `M${f3(p.x)} ${f3(p.y - hw(p) + dy(p))}L${f3(q.x)} ${f3(q.y - hw(q) + dy(q))}L${f3(q.x)} ${f3(q.y + hw(q) + dy(q))}L${f3(p.x)} ${f3(p.y + hw(p) + dy(p))}Z`;
      return <path key={i} d={d} fill={layer === "belly" ? "#C9B496" : "#F7EEDD"} fillOpacity={f3(a)} stroke={layer === "belly" ? "#C9B496" : "#F7EEDD"} strokeOpacity={f3(a)} strokeWidth={0.6} />;
    });
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <filter id={`${uid}b`} x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>
      <g filter={`url(#${uid}b)`}>
        {seg("belly")}
        {seg("top")}
      </g>
    </svg>
  );
};
/** the jet's drawn length in screen px under a look (for size checks) */
export const jetScreenLength = (look: Look, spec: JetSpec) => (JET_DIMS.B787_10.length * F0 * look.k) / spec.z;
