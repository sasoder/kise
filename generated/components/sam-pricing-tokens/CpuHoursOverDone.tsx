// ---------------------------------------------------------------------------
// CpuHoursOverDone (sam-pricing-tokens, cut 43). Cheeky Pint style (stout) (styles/cheeky-pint.md) with the clip's
// real-photo blend (pricingShared: PhotoCutOut, StoutShadow). Opaque 1080x1920, 23.976 fps, 83 frames, palette B1.
//
// CHECK LINE: "People pick paying by the metered CPU hour over a flat 'job done' price, even when 'done' is cheaper."
//
// THE LINE (Sam Altman): "(people would rather) pay for CPU hours rather than just getting their thing done, even if
// (it was less expensive)." The bracketed words fall outside the slot; "less expensive" is said on camera after the
// cut, so "cheaper" (the shorter bar) reads before the end.
// WORD -> FRAME (Whisper, may run 2-6 f early): (pay f-5) · for f11 · CPU f17 · hours f24 · rather f34 · than f42 ·
// just f48 · getting f52 · their f59 · thing f66 · done f71 · even f79 · if f85 (after the end).
// DURATION: the slot 43.627 -> 47.089 s = sequence frames 1046 -> 1129 = 83 frames at 24000/1001 (f0..f82).
//
// THE MOTION: two ways to be charged on one board. LEFT, the subject: a real CPU lying straight on the board (no tile:
// the photo is the object, one shadow from its own alpha), its bill an amber bar rising out from BEHIND the chip's top
// edge (the chip is the occluder), and an amber hour meter riding the bar's top ("1,20x HRS"), already counting on f0;
// the bar's height IS the metered hours (derived from the meter's value), so it rises through "CPU hours" (f0-30,
// landing soft) and keeps creeping with every tick. On "rather than" the camera eases right and out while a drawn
// cream card with one heavy ink check ("thing done") slides in from the right edge, lifted, and settles (f26-50); its
// own amber bill rises out of the card's slot, SHORTER (a flat price: it rises once and stops), landing f68 before
// "done" (f71). The choice: the done side drains to board tone (f70-81, tone not opacity), the light pool settles
// back on the CPU, the camera creeps toward it, and the meter keeps ticking to the last frame.
// Contact / first reaction: the done card touches down f50 (its shadow tightens to rest); its bar leaves the slot f53.
// THE METER is a wheel odometer (one wheel per digit): the ones wheel turns with the hours (each hour's tick rolls in
// the last 0.6 of its interval, eased; between ticks it rests whole); each higher wheel turns while the wheel to its
// right finishes its cycle, spread over the digits that wheel passes in 2.5 frames (at the slow ticks that is the real
// one-digit carry; in the fast count the tens wheel spins and a hundreds carry is a 2-3 frame blurred roll, never a
// half-row frozen on one frame); each wheel's vertical blur is in proportion to its own speed. The digits are seen through a feathered
// line (the house drum turn: an opaque core over the glyphs, 0.25 em ramps) and stand 1.22 em apart on the wheel, so
// at rest the next digit is wholly hidden and two rows never sit in the line.
// AMBER = the number the customer is charged (both bills and the meter's digits); cream = the subject, board = context.
//
// SOURCES: the CPU photo is an AMD Ryzen 5 9600X, heat-spreader side, top-down (CC0, Fritzchens Fritz, Wikimedia
// Commons, images/cutout_sources/SOURCES.md item 3), cut out and its branding painted out by
// scripts/clips/sam-pricing-tokens/bake-cpu.py (cpuData.ts). The hour values on the meter are ILLUSTRATIVE ticking
// digits (no real job: a plausible count of ~1,20x -> ~1,78x hours), the bar heights are illustrative ("done" about
// half of the metered bill); no prices are shown. Check mark: Lucide "check" (ISC), inlined.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  FONT_NUM,
  GEO,
  Label,
  StoutStage,
  TNUM_ADV,
  TRACK,
  amberBandFor,
  bloomFilter,
  clamp01,
  labelWidth,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
} from "../kits/cheeky-pint/stoutShared";
import { GLYPH_STROKE, LIFT_DY, makeClockCam, makePoolTrack, restToRest, travel } from "../kits/cheeky-pint/museShared";
import { PhotoCutOut, SHADOW_S, StoutShadow, photoCutOutSil, type ShadowPart } from "./pricingShared";
import { CPU_PHOTO } from "./cpuData";

export const FPS = 24000 / 1001;
export const DURATION = 83;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string, p: string) => `${p}${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// ===========================================================================
// THE WORLD (world px = screen px at the resolved camera, look (540, 960), k ~1.0)
// ===========================================================================
const FLOOR = 1050; // the CPU's foot and the card's floor (above the first caption band at every camera state)
const BAR_W = 180; // both bills are the same width: only their heights compare
const BAR_R = 6;
/** LEFT: the CPU, lying straight on the board (centre x, foot FLOOR, square), a touch turned. */
const CPU = { x: 350, h: 470, rotate: -2 } as const;
const CPU_TOP = FLOOR - CPU.h; // 580: the bill rises from behind this edge
const CPU_CY = FLOOR - CPU.h / 2;
/** How far the bar's foot reaches under the chip (hidden: the chip covers it). */
const BAR_TUCK = 70;
/** The bill's visible foot runs this far past the chip's top edge line, under its anti-aliased rim (world px). */
const EDGE_TUCK = 2;
/** The CPU's grade: pricingShared's GRADE, a little less chroma (the teal substrate would jump out of the warm stout palette). */
const CPU_GRADE = { saturate: 0.68 } as const;
/** RIGHT: the "done" card with one heavy check. */
const DONE_T = { x: 815, w: 300, h: 300 } as const; // top 750
const DONE_BAR = 150; // its bill: about half the metered one
const SLOT = { lip: 9, h: 8 } as const; // the slot is BAR_W + 2 lip wide; its slit height

// --- the meter: hours (illustrative) and the bill derived from them ----------------------------------------------
/** The rise of the count through "CPU hours": rest to rest with a long soft landing, already moving on f0. */
const RISE = { f0: -6, f1: 31, p: 2.5 } as const;
const H0 = 1144; // the meter at the rise's start: f0 reads 1,20x just after a hundreds carry, the count lands mid-hundred (1,77x), so no carry rolls near the landing
const H_RISE = 622; // hours counted during the rise
const H_LIVE = 1 / 7; // the metered tick that never stops: one hour every 7 frames
export const hoursAt = (f: number) => H0 + 0.37 + H_RISE * restToRest((f - RISE.f0) / (RISE.f1 - RISE.f0), RISE.p) + H_LIVE * (f - RISE.f0);
/** The bill: the metered hours above H_BASE, at PX_PER_HR (the bar ~250 px above the chip when the rise lands). */
const BAR_LAND = 250;
const H_BASE = H0 - 70;
const PX_PER_HR = BAR_LAND / (H0 + H_RISE + 5 * H_LIVE - H_BASE);
const cpuBarAt = (f: number) => (hoursAt(f) - H_BASE) * PX_PER_HR;

/** The ones wheel's tick: each hour rolls in the last TICK_ROLL of its interval, eased (rests whole between ticks). */
const TICK_ROLL = 0.6;
/** A carry's span: CARRY_F frames of the count (so in the fast count a higher wheel's turn is a 2-3 frame blurred
 *  roll, never a half-row caught on one frame), at least the one digit of the wheel to its right (the real carry). */
const CARRY_F = 2.5;
/** The wheels' positions (in digits) [thousands, hundreds, tens, ones]: the ones wheel follows the ticking hours;
 *  each higher wheel turns while the wheel to its right finishes its cycle, over the last W of its digits (W = the
 *  digits that wheel passes in CARRY_F frames, between 1 (a real odometer's carry) and 10 (it just spins)), eased. */
export const wheelsAt = (f: number): number[] => {
  const v = hoursAt(f);
  const n = Math.floor(v);
  const ones = n + smoothstep(clamp01((v - n - (1 - TICK_ROLL)) / TICK_ROLL));
  const rate = Math.max(0, hoursAt(f + 0.5) - hoursAt(f - 0.5)); // hours per frame
  const up = (p: number, digitsPerHour: number) => {
    const W = Math.max(1, Math.min(10, CARRY_F * rate * digitsPerHour));
    const q = Math.floor(p / 10);
    const x = clamp01((p - 10 * q - (10 - W)) / W);
    // eased as a real carry (W 1); at constant speed when the wheel simply spins (W 10): no sharp rests mid-spin
    return q + lerp(smoothstep(x), x, (W - 1) / 9);
  };
  const tens = up(ones, 1);
  const hundreds = up(tens, 0.1);
  const thousands = up(hundreds, 0.01);
  return [thousands, hundreds, tens, ones];
};
const METER_PX = 160; // cap 115 px on screen
const HRS_PX = 64;
const HRS_GAP = 24;
const WHEEL = { pitch: 1.22, core: [0.838, 0.122], feather: 0.25 } as const; // em: the house drum turn's line
/** A wheel's roll blur (SCREEN px): in proportion to its own speed (stoutShared's 9 px per HERO digit-step per frame,
 *  i.e. ~0.05 x the screen speed), capped high enough that a spinning wheel smears (no sharp half-rows). */
const BLUR = { perPx: 0.05, cap: 32 } as const;
const wheelBlur = (f: number, i: number) => Math.min(BLUR.cap, BLUR.perPx * METER_PX * WHEEL.pitch * Math.abs(wheelsAt(f + 0.5)[i] - wheelsAt(f - 0.5)[i]));
/** The meter's baseline above the bill's top (SCREEN px): clear of the line's lower feather and the comma's tail. */
const METER_CLEAR = 48;
// the line "1,234 HRS" (SCREEN px) on tabular advances, centred on the CPU
const ADV_D = TNUM_ADV + TRACK.numeral;
const ADV_C = 0.254 + TRACK.numeral;
const NUM_W = (4 * ADV_D + ADV_C - TRACK.numeral) * METER_PX;
const LINE_W = NUM_W + HRS_GAP + labelWidth("HRS", HRS_PX);

// --- the done side's timing ------------------------------------------------------------------------------------------
const SLIDE = { f0: 26, f1: 50, from: DONE_T.x + 420 } as const; // slides in from beyond the right edge, lifted
const DONE_RISE = { f0: 53, f1: 68 } as const; // its bill leaves the slot and lands before "done" (f71)
const DIM = { f0: 70, f: 11 } as const; // the done side drains to board tone

// --- the camera: on the CPU side, already creeping; eases right and out on "rather than"; creeps back toward the CPU --
const CAM = makeClockCam(
  { x: 398, y: 963, k: 1.13 },
  [
    { f0: -24, f1: 34, dx: 8, k: 1.14 }, // the opening creep, moving on f0 (pay for CPU hours)
    { f0: 24, f1: 62, dx: 136, dy: -3, k: 1.0 }, // eases right and out: both sides in shot (rather than just getting)
    { f0: 58, f1: 112, dx: -14, k: 1.03 }, // creeps toward the CPU side (their thing done ... even)
  ],
  DURATION,
);
// --- the light pool: on the CPU, widens to the pair during the reveal, settles back on the CPU on the choice ---------
const POOL = makePoolTrack(
  { x: 350, y: 720 },
  [
    { f0: 30, f1: 58, x: 560, y: 780 },
    { f0: 66, f1: 84, x: 366, y: 700 },
  ],
  DURATION,
);

// ===========================================================================
// PIECES
// ===========================================================================
/** The hot top edge of an amber body (SCREEN px: a 2 px line + a 12 px falloff), stoutShared's recipe. */
const HotEdge: React.FC<{ x: number; y: number; w: number; k: number; on: number }> = ({ x, y, w, k, on }) => {
  const uid = uidOf(useId(), "ho");
  if (on <= 0.002) return null;
  const fall = EDGE.HOT_FALL / k;
  return (
    <g>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={f3(ALPHA.hotFall * on)} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={rectPath(x, y, w, fall, BAR_R, true, false)} fill={`url(#${uid})`} />
      <path d={`M${f3(x + BAR_R)} ${f3(y + EDGE.HOT / k / 2)}H${f3(x + w - BAR_R)}`} stroke={COLOR.amberHot} strokeOpacity={f3(on)} strokeWidth={f3(EDGE.HOT / k)} />
    </g>
  );
};

/**
 * AmberBill — a bill bar (world): x = centre, `foot` = where it disappears (a slot mouth or the occluder's edge),
 * `top` its top edge; the body runs on to `bodyFoot` (hidden under its occluder). Band gradient, the fixed bloom
 * (fading only with `dim`), 2 px hot top edge, the foot occlusion where it meets its source. `dim` tones the amber
 * 0.7 toward the board.
 */
const AmberBill: React.FC<{ x: number; top: number; foot: number; bodyFoot?: number; k: number; band: [number, number]; dim?: number }> = ({ x, top, foot, bodyFoot, k, band, dim = 0 }) => {
  const uid = uidOf(useId(), "ab");
  const h = foot - top;
  if (h <= 0.2) return null;
  const dm = clamp01(dim);
  const bx = x - BAR_W / 2;
  const bf = bodyFoot ?? foot;
  const d = rectPath(bx, top, BAR_W, bf - top, BAR_R, true, false);
  const ao = Math.min(h, EDGE.FOOT_AO / k);
  return (
    <g>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <linearGradient id={`${uid}d`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(band[0])} x2="0" y2={f3(band[1])}>
          <stop offset="0" stopColor={COLOR.board} />
          <stop offset="1" stopColor={COLOR.boardFoot} />
        </linearGradient>
        <linearGradient id={`${uid}o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
      </defs>
      {dm < 0.999 ? (
        <g style={{ filter: bloomFilter(k) }} opacity={f3(1 - dm)}>
          <path d={d} fill={`url(#${uid}a)`} />
        </g>
      ) : null}
      <path d={d} fill={`url(#${uid}a)`} />
      {dm > 0.001 ? <path d={d} fill={`url(#${uid}d)`} opacity={f3(0.7 * dm)} /> : null}
      <HotEdge x={bx} y={top} w={BAR_W} k={k} on={1 - dm} />
      <rect x={f3(bx)} y={f3(foot - ao)} width={f3(BAR_W)} height={f3(ao)} fill={`url(#${uid}o)`} />
    </g>
  );
};

/** Lucide "check" (ISC): M20 6 9 17l-5-5, in its 24-unit box. */
const CHECK_D = "M20 6 9 17l-5-5";

/**
 * DoneCard — the drawn cream card (cream -> creamFoot, its lit top edge stopping at the slot) with a SLOT across its
 * top edge, the check on its face, and its bill rising out of the slot. Card + bar are ONE object with ONE shadow.
 * `dim` tones card, check and bill toward the board.
 */
const DoneCard: React.FC<{ x: number; floor: number; w: number; h: number; k: number; bar: number; band: [number, number]; dim?: number; lift?: number }> = ({
  x,
  floor,
  w,
  h,
  k,
  bar,
  band,
  dim = 0,
  lift = 0,
}) => {
  const uid = uidOf(useId(), "dc");
  const dm = clamp01(dim);
  const lt = clamp01(lift);
  const dy = -lt * LIFT_DY * SHADOW_S;
  const top = floor - h;
  const r = 0.07 * w;
  const tileD = rectPath(x - w / 2, top, w, h, r);
  const bx = x - BAR_W / 2;
  const parts: ShadowPart[] = [{ d: tileD }];
  if (bar > 0.2) parts.push({ d: rectPath(bx, top - bar, BAR_W, bar + BAR_R, BAR_R, true, false) });
  const slotW = BAR_W + 2 * SLOT.lip;
  const s0 = x - slotW / 2;
  const s1 = x + slotW / 2;
  const edgeY = top + EDGE.CREAM / k / 2;
  const sw = f3(EDGE.CREAM / k);
  const edgeA = lerp(ALPHA.edge, ALPHA.edgeBoard, dm);
  // the check: GlyphMark's rule (a 20-unit ink box fills 0.68 of the card; stroke GLYPH_STROKE per 96 px of card)
  const sc = (w * 0.68) / 20;
  const swCheck = (GLYPH_STROKE * w) / GEO.TILE / sc;
  const cy = top + 0.55 * h;
  return (
    <g>
      <StoutShadow parts={parts} s={SHADOW_S} elevation="rest" lift={lt} contact={lt < 0.001 ? { x, y: floor, w } : null} />
      <g transform={dy ? `translate(0 ${fx(dy)})` : undefined}>
        <defs>
          <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(top)} x2="0" y2={f3(floor)}>
            <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, dm)} />
            <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, dm)} />
          </linearGradient>
        </defs>
        <AmberBill x={x} top={top - bar} foot={top} k={k} band={band} dim={dm} />
        <path d={tileD} fill={`url(#${uid}c)`} />
        <path d={`M${f3(x - w / 2 + r)} ${f3(edgeY)}H${f3(s0)}M${f3(s1)} ${f3(edgeY)}H${f3(x + w / 2 - r)}`} stroke={COLOR.edge} strokeOpacity={f3(edgeA)} strokeWidth={sw} />
        {/* the slot: a dark slit across the top edge, its lower lip catching a little light */}
        <path d={rectPath(s0, top, slotW, SLOT.h, SLOT.h / 2)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot + 0.2} />
        <path d={`M${f3(s0 + SLOT.h)} ${f3(top + SLOT.h + EDGE.CREAM / k / 2)}H${f3(s1 - SLOT.h)}`} stroke={COLOR.edge} strokeOpacity={f3(edgeA * 0.5)} strokeWidth={sw} />
        <path
          d={CHECK_D}
          transform={`translate(${fx(x - 12 * sc)} ${fx(cy - 11.5 * sc)}) scale(${fx(sc)})`}
          fill="none"
          stroke={mixHex(COLOR.inkDark, COLOR.boardFoot, 0.55 * dm)}
          strokeWidth={f3(swCheck)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
};

/**
 * WheelMeter — the hour meter "d,ddd": one wheel per digit (positions from wheelsAt), amber with the fixed bloom,
 * tabular cells; each wheel shows its digit and the next one WHEEL.pitch em below, offset by its fractional position,
 * blurred vertically in proportion to its own speed; all seen through one feathered line. (x = left edge, y =
 * baseline, world; px = SCREEN size.)
 */
const WheelMeter: React.FC<{ x: number; y: number; k: number; px: number; wheels: number[]; blur: number[] }> = ({ x, y, k, px, wheels, blur }) => {
  const uid = uidOf(useId(), "wm");
  const fs = px / k;
  const pitch = WHEEL.pitch * fs;
  const [cu, cd] = WHEEL.core;
  const y0 = y - (cu + WHEEL.feather) * fs;
  const y1 = y - cu * fs;
  const y2 = y + cd * fs;
  const y3 = y + (cd + WHEEL.feather) * fs;
  const w = NUM_W / k;
  const mx = x - fs;
  const mw = w + 2 * fs;
  // cells: [thousands] [comma] [hundreds] [tens] [ones]
  const cellD = ADV_D * fs;
  const cellC = ADV_C * fs;
  const comp = (TRACK.numeral * fs) / 2;
  const centres = [x + cellD / 2 - comp, x + cellD + cellC / 2 - comp, x + cellD + cellC + cellD / 2 - comp, x + 2 * cellD + cellC + cellD / 2 - comp, x + 3 * cellD + cellC + cellD / 2 - comp];
  const wheelCells = [0, 2, 3, 4];
  return (
    <g style={{ filter: bloomFilter(k) }}>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y3)}>
          <stop offset="0" stopColor="#000" />
          <stop offset={f3((y1 - y0) / (y3 - y0))} stopColor="#fff" />
          <stop offset={f3((y2 - y0) / (y3 - y0))} stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(mx)} y={f3(y0)} width={f3(mw)} height={f3(y3 - y0)}>
          <rect x={f3(mx)} y={f3(y0)} width={f3(mw)} height={f3(y3 - y0)} fill={`url(#${uid}g)`} />
        </mask>
        {blur.map((b, i) =>
          b > 0.05 ? (
            <filter key={i} id={`${uid}b${i}`} x="-10%" y="-40%" width="120%" height="180%">
              <feGaussianBlur stdDeviation={`0 ${f3(b / k)}`} />
            </filter>
          ) : null,
        )}
      </defs>
      <g mask={`url(#${uid}m)`} fontFamily={FONT_NUM} fontWeight={700} fontSize={f3(fs)} fill={COLOR.amberTop} textAnchor="middle" style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}>
        <text x={f3(centres[1])} y={f3(y)}>
          ,
        </text>
        {wheels.map((p, i) => {
          const n = Math.floor(p);
          const t = p - n;
          const d = ((n % 10) + 10) % 10;
          const cx = centres[wheelCells[i]];
          return (
            <g key={i} filter={blur[i] > 0.05 ? `url(#${uid}b${i})` : undefined}>
              <text x={f3(cx)} y={f3(y - t * pitch)}>
                {d}
              </text>
              {t > 1e-4 ? (
                <text x={f3(cx)} y={f3(y + (1 - t) * pitch)}>
                  {(d + 1) % 10}
                </text>
              ) : null}
            </g>
          );
        })}
      </g>
    </g>
  );
};

// ===========================================================================
// THE CUT
// ===========================================================================
const CpuHoursOverDone: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = CAM.at(f);
  const k = cam.k;
  const band = amberBandFor(cam);

  // LEFT: the metered CPU, its bill out from behind its top edge, the meter riding the bill's top
  const cpuBar = cpuBarAt(f);
  const barTop = CPU_TOP - cpuBar;
  const barBodyFoot = CPU_TOP + BAR_TUCK;
  const cpu = { src: CPU_PHOTO.src, x: CPU.x, y: CPU_CY, h: CPU.h, aspect: CPU_PHOTO.aspect, rotate: CPU.rotate, origin: { x: CPU.x, y: CPU_CY } };
  const cpuParts: ShadowPart[] = [...photoCutOutSil(cpu), { d: rectPath(CPU.x - BAR_W / 2, barTop, BAR_W, barBodyFoot - barTop, BAR_R, true, false) }];
  const meterY = barTop - METER_CLEAR / k;
  const lineX = CPU.x - LINE_W / 2 / k;
  const wheels = wheelsAt(f);
  const blur = wheels.map((_, i) => wheelBlur(f, i));

  // RIGHT: the done card
  const tr = travel({ x: SLIDE.from, y: FLOOR }, { x: DONE_T.x, y: FLOOR }, f, SLIDE.f0, SLIDE.f1, { p: 2.5, settleFrom: 0.72 });
  const doneBar = DONE_BAR * restToRest((f - DONE_RISE.f0) / (DONE_RISE.f1 - DONE_RISE.f0), 2.5);
  const dim = smoothstep((f - DIM.f0) / DIM.f);

  return (
    <StoutStage S={f} cam={cam} rest={CAM.rest} pool={POOL(f)}>
      {/* LEFT: chip + bill are one object with one shadow; the bill is drawn first, the chip lies over its foot */}
      <StoutShadow parts={cpuParts} s={SHADOW_S} elevation="rest" contact={{ x: CPU.x, y: FLOOR, w: CPU.h }} />
      {/* the bill is seen only ABOVE the chip's (turned) top edge: it never shows through the substrate's notch */}
      <defs>
        <clipPath id="cpuAboveEdge">
          <rect x={f3(CPU.x - 400)} y={f3(CPU_TOP - 3000)} width="800" height={f3(3000 + EDGE_TUCK)} transform={`rotate(${CPU.rotate} ${CPU.x} ${CPU_CY})`} />
        </clipPath>
      </defs>
      <g clipPath="url(#cpuAboveEdge)">
        <AmberBill x={CPU.x} top={barTop} foot={CPU_TOP} bodyFoot={barBodyFoot} k={k} band={band} />
      </g>
      <PhotoCutOut {...cpu} k={k} shadow={false} grade={CPU_GRADE} />

      {/* RIGHT: the done card slides in from the right edge, lifted, settles; its shorter bill rises out of its slot */}
      {f >= SLIDE.f0 ? <DoneCard x={tr.x} floor={FLOOR} w={DONE_T.w} h={DONE_T.h} k={k} bar={doneBar} band={band} dim={dim} lift={tr.lift} /> : null}

      {/* the hour meter: amber wheels, HRS beside them, riding the bill's top */}
      <WheelMeter x={lineX} y={meterY} k={k} px={METER_PX} wheels={wheels} blur={blur} />
      <Label x={lineX + (NUM_W + HRS_GAP) / k} y={meterY} k={k} px={HRS_PX} text="hrs" tone="cream" anchor="start" />
    </StoutStage>
  );
};

export default CpuHoursOverDone;
