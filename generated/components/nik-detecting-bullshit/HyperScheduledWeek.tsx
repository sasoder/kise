// ---------------------------------------------------------------------------
// HyperScheduledWeek (nik-detecting-bullshit, cut 5). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 165 frames. Palette B1 (the stoutShared default).
// The user's note at 00:00:05:07: "i think this can use a nice graphic that shows what hes saying in a
// satisfying nice visual way". Composed in the keep-in box, then shifted down StoutStage dy SHIFT_Y (190) like
// the clip's other cuts.
//
// CHECK LINE: "His whole week, Monday to Friday, is packed solid with short 15- and 30-minute meetings:
// business reviews, product reviews, one-on-ones."
//
// THE LINE (sequence 5.297-12.179 s, Nik): "(Monday) to Friday, it's hyper scheduled. 15 or 30 minutes slot.
// So usually it's like business reviews, product reviews, one on ones."
// WORD -> FRAME: Monday f-8 · to f6 · Friday f10 · it's f15 · hyper f22 · scheduled f28 · 15 f42 · or f68 ·
// 30 f73 · minutes f77 · slot f83 · so f91 · usually f96 · it's f102 · like f105 · business f108 · reviews f114 ·
// product f122 · reviews f129 · one f138 · on f151 · ones f154 (ends ~f160) · slot end f165 (John from ~f163).
// DURATION: the slot 5.297 -> 12.179 s = 6.882 s x 23.976 = 165 frames (f0..f164); in = sequence frame 127.
//
// THE MOTION: a week planner on the board: a cream header strip (MON TUE WED THU FRI) over five lanes with
// hour rules. Cream meeting blocks (15 min = one quarter-hour slot, 30 min = two) slide down out of the
// header's slot and fall to rest on the one below, a steady cascade in reading order (MON first, FRI last),
// until every column is packed (last landing ~f24). The camera opens close on MON and eases back so FRI's
// header is in on "Friday" (f10) and the packed week reads whole through ~f25; from the packed week, one eased
// push into WED (the other columns tone toward board) settles by ~f60 on ONE close framing: WED's header and
// its five labelled blocks, held with a very slow push (+3.4 % f60-f150) and a slight ease back from f150.
// The prints land on their words: "15 MIN" on "15" (f42; readable by f50), "30 MIN" on the twice-as-tall
// block on "30" (f73), then BUSINESS REVIEW + bar chart (f108), PRODUCT REVIEW + phone (f122), ONE-ON-ONE +
// two busts (f138), each name on one line under its glyph (REV 2).
// REV 1 (director): no drift down the column; blocks resized (U 28, G 5, 24 slots) so the labelled column fits
// the keep-in box at k ~2.4 with ~28 px caps; the push starts as soon as the week is packed.
// AMBER: none in this cut (amber = growth / the KPI met, in this clip). Cream = the meetings; board = context.
//
// SOURCES: none (no figures; the week's layout is illustrative, the meeting kinds are the speaker's words).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { METRIC, StoutStage, labelWidth, lerp, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { camCheck, makePoolTrack, type Cam } from "../kits/cheeky-pint/museShared";
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import { camEase } from "../kits/dwarkesh/outgrowShared";
import { SHIFT_Y } from "./kpiWorld";
import {
  BLOCKS,
  BlockBody,
  BlockPrint,
  BlockShadows,
  COLUMNS,
  COL_BOT,
  COL_W,
  ColumnGradient,
  DAYS,
  G,
  HEAD,
  HEAD_BOT,
  HEAD_X0,
  HEAD_X1,
  PACKED_AT,
  PRINT,
  WED,
  WeekBed,
  WeekHeader,
  blockTopAt,
  colX,
  printBox,
} from "./weekWorld";

export const FPS = 24000 / 1001;
export const DURATION = 165;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the words the prints land on (cut frames); each print enters over ENTER_F and has landed on its word ---
const PRINT_ON = [42, 73, 108, 122, 138] as const;
const ENTER_F = 10;
/** The other four columns tone toward board as the push into WED starts (dim, by tone, never opacity). */
const DIM = 0.4;
const DIM_IN = [34, 50] as const;

// --- camera (look = the world point on the frame's middle) ---------------------------------------------------
/** The look that puts world (wx, wy) at screen (sx, sy) at scale k. */
const lookFor = (wx: number, wy: number, sx: number, sy: number, k: number) => ({ x: wx - (sx - 540) / k, y: wy - (sy - 960) / k, k });
const L0 = lookFor(colX(0) - COL_W / 2, HEAD.TOP, 130, 340, 1.6); // close on MON's header
const L1 = lookFor(540, (HEAD.TOP + COL_BOT) / 2, 528, 680, 0.97); // the whole week
/** REV 1: ONE settled close framing: WED's header + its five labelled blocks, centred on the keep-in box's middle. */
const CLOSE_Y0 = HEAD.TOP;
const CLOSE_Y1 = WED[4].top + WED[4].h;
const CLOSE_CY = (CLOSE_Y0 + CLOSE_Y1) / 2;
export const K_CLOSE = 2.38;
export const K_CREEP = 2.41; // a very slow push while it prints (+1.3 % over the settle)
export const K_END = 2.12; // the slight ease back from f150
const L2 = lookFor(540, CLOSE_CY, 540, 680, K_CLOSE); // WED: header, 15 MIN, 30 MIN and the three named blocks
const L3 = lookFor(540, CLOSE_CY, 540, 680, K_CREEP);
const L4 = lookFor(540, CLOSE_CY, 540, 680, K_END);
/**
 * The camera: each move is a ZOOM ABOUT ITS FIXED POINT (the one world point that sits on the same screen spot
 * in the move's start and end framing), so a push reads as a push into that spot, not a pan plus a zoom.
 * Moves are composed in order on overlapping eased windows (camEase, so they superpose C1: no hold-move-hold),
 * then run through the house damped follower (CAM_STIFF / CAM_DAMP), sampled continuously on the cut's clock.
 */
const PUSH = [22, 58] as const;
const PUSH_WARP = 0.9;
type Look = { x: number; y: number; k: number };
type Move = { a: Look; b: Look; f0: number; f1: number; warp?: number };
const zoomStep = (c: Look, m: Move, s: number): Look => {
  const r = Math.pow(m.b.k / m.a.k, s);
  if (Math.abs(m.b.k - m.a.k) < 1e-6) return { x: c.x + (m.b.x - m.a.x) * s, y: c.y + (m.b.y - m.a.y) * s, k: c.k };
  const px = (m.b.x * m.b.k - m.a.x * m.a.k) / (m.b.k - m.a.k);
  const py = (m.b.y * m.b.k - m.a.y * m.a.k) / (m.b.k - m.a.k);
  return { x: px - (px - c.x) / r, y: py - (py - c.y) / r, k: c.k * r };
};
const makeZoomCam = (start: Look, moves: Move[], F_END: number, PRE = 60) => {
  const target = (f: number) => moves.reduce((c, m) => zoomStep(c, m, camEase((f - m.f0) / (m.f1 - m.f0), m.warp ?? 1)), start);
  const out: Look[] = [];
  let c = target(-PRE);
  let v = { x: 0, y: 0, k: 0 };
  for (let f = -PRE; f <= F_END + 2; f++) {
    const t = target(f);
    v = { x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP, y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP, k: v.k + (t.k - c.k) * CAM_STIFF - v.k * CAM_DAMP };
    c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    if (f >= 0) out.push({ ...c });
  }
  const at = (f: number): Cam => {
    const i = Math.max(0, Math.min(out.length - 2, Math.floor(f)));
    const u = Math.max(0, Math.min(1, f - i));
    return { x: lerp(out[i].x, out[i + 1].x, u), y: lerp(out[i].y, out[i + 1].y, u), k: lerp(out[i].k, out[i + 1].k, u) };
  };
  return { at, rest: out[0] };
};
export const CAM = makeZoomCam(
  L0,
  [
    { a: L0, b: L1, f0: -36, f1: 20 }, // ease back from MON to the whole week
    { a: L1, b: L2, f0: PUSH[0], f1: PUSH[1], warp: PUSH_WARP }, // one push into WED, from the packed week
    { a: L2, b: L3, f0: 58, f1: 156 }, // a very slow push while the names print
    { a: L3, b: L4, f0: 148, f1: 188 }, // a slight ease back
  ],
  DURATION,
);
const POOL = makePoolTrack(
  { x: colX(0) + 40, y: 470 },
  [
    { f0: -16, f1: 26, x: 540, y: 640 },
    { f0: 30, f1: 76, x: 540, y: CLOSE_CY - 40 },
  ],
  DURATION,
);

const HyperScheduledWeek: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const dimOther = DIM * smoothstep((S - DIM_IN[0]) / (DIM_IN[1] - DIM_IN[0]));
  const dims = DAYS.map((_, c) => (c === 2 ? 0 : dimOther));
  return (
    <StoutStage dy={SHIFT_Y} S={S} cam={cam} rest={CAM.rest} pool={POOL(S)}>
      <defs>
        {dims.map((d, c) => (
          <ColumnGradient key={c} id={`hswCol${c}`} dim={d} />
        ))}
        <clipPath id="hswLanes">
          <rect x={HEAD_X0 - 60} y={HEAD_BOT} width={HEAD_X1 - HEAD_X0 + 120} height={COL_BOT - HEAD_BOT + 120} />
        </clipPath>
      </defs>
      <WeekBed k={k} />
      <g clipPath="url(#hswLanes)">
        {COLUMNS.map((col, c) => (
          <BlockShadows key={c} blocks={col} S={S} />
        ))}
        {COLUMNS.map((col, c) =>
          col.map((b) => (
            <BlockBody key={b.key} b={b} S={S} k={k} grad={`hswCol${c}`} dim={dims[c]}>
              {b.kind ? <BlockPrint b={b} enter={(S - (PRINT_ON[b.i] - ENTER_F)) / ENTER_F} k={k} /> : null}
            </BlockBody>
          )),
        )}
      </g>
      <WeekHeader k={k} />
    </StoutStage>
  );
};

export default HyperScheduledWeek;

// --- load-time checks: every half frame, every camera state (house sway: +-3 x, +-5 y; pre-shift box) ---------
const SX = (c: Cam, wx: number) => 540 + (wx - c.x) * c.k;
const SY = (c: Cam, wy: number) => 960 + (wy - c.y) * c.k;
export const CHECKS = (() => {
  const fail = (m: string) => {
    throw new Error(`HyperScheduledWeek: ${m}`);
  };
  const report: string[] = [];
  // the cascade: packed before "scheduled" ends; nothing overlaps in a column on any sub-frame
  if (PACKED_AT > PUSH[0] + 4) fail(`the week is packed only by f${PACKED_AT.toFixed(1)}`);
  for (let S = -50; S < DURATION; S += 0.25) {
    for (const col of COLUMNS) {
      for (let i = 0; i + 1 < col.length; i++) {
        const a = col[i];
        const b = col[i + 1];
        if (S <= a.t0) continue; // a (above) leaves the slot after b (below)
        const gap = blockTopAt(b, S) - (blockTopAt(a, S) + a.h);
        if (gap < G - 1e-3) fail(`S${S}: ${a.key} / ${b.key} gap ${gap.toFixed(2)}`);
      }
    }
  }
  if (BLOCKS.some((b) => b.top < HEAD_BOT)) fail("a block rests under the header");
  // "Friday" f10: FRI's header name in frame
  {
    const c = CAM.at(10);
    const half = labelWidth("FRI", HEAD.FS) / 2;
    const r = SX(c, colX(4) + half) + 3;
    report.push(`f10 FRI name right edge x ${r.toFixed(0)}`);
    if (r > 1015) fail(`f10: FRI's name runs to x ${r.toFixed(0)}`);
  }
  // f0: MON's header name readable at once
  {
    const c = CAM.at(0);
    const l = SX(c, colX(0) - labelWidth("MON", HEAD.FS) / 2) - 3;
    report.push(`f0 k ${c.k.toFixed(3)}, MON name left x ${l.toFixed(0)}, header top y ${SY(c, HEAD.TOP).toFixed(0)}`);
    if (l < 65 || SY(c, HEAD.TOP) - 5 < 290) fail("f0: MON's header is not in the box");
  }
  // f22 to the push: the whole packed week inside the box (the bottom-right lanes clear of the button column)
  for (let S = 22; S <= PUSH[0] + 3; S += 0.5) {
    const c = CAM.at(S);
    const x0 = SX(c, HEAD_X0) - 3;
    const x1 = SX(c, HEAD_X1) + 3;
    const xr = SX(c, colX(4) + COL_W / 2) + 3;
    const y0 = SY(c, HEAD.TOP) - 5;
    const y1 = SY(c, COL_BOT) + 5;
    if (x0 < 65 || x1 > 1015 || xr > 962 || y0 < 290 || y1 > 1070) fail(`S${S}: the week spans x ${x0.toFixed(0)}-${x1.toFixed(0)}, y ${y0.toFixed(0)}-${y1.toFixed(0)}`);
    if (S === 24) report.push(`f28 k ${c.k.toFixed(3)} week x ${x0.toFixed(0)}-${x1.toFixed(0)} y ${y0.toFixed(0)}-${y1.toFixed(0)}`);
  }
  // REV 1: from f60 to the end, WED's header (strip top + name) and all five labelled blocks inside the box
  for (let S = 60; S < DURATION; S += 0.5) {
    const c = CAM.at(S);
    const x0 = SX(c, colX(2) - COL_W / 2) - 3;
    const x1 = SX(c, colX(2) + COL_W / 2) + 3;
    const y0 = SY(c, CLOSE_Y0) - 5;
    const y1 = SY(c, CLOSE_Y1) + 5;
    if (x0 < 65 || x1 > 1015 || y0 < 290 || y1 > 1070) fail(`S${S}: WED's labelled column spans x ${x0.toFixed(0)}-${x1.toFixed(0)}, y ${y0.toFixed(0)}-${y1.toFixed(0)}`);
    // the neighbours' names: shown whole, or cut by more than half (no "UE" left in the box)
    for (const i of [1, 3]) {
      const hw = (labelWidth(DAYS[i], HEAD.FS) * c.k) / 2;
      const cx = SX(c, colX(i));
      const vis = (Math.min(cx + hw, 1080) - Math.max(cx - hw, 0)) / (2 * hw);
      if (vis < 0.999 && vis > 0.5) fail(`S${S}: ${DAYS[i]}'s name shows ${(vis * 100).toFixed(0)} %`);
    }
  }
  // the prints: each inside the box from its word to the end; 15 MIN readable by f50
  WED.slice(0, 5).forEach((b, i) => {
    const [x0, y0, x1, y1] = printBox(b);
    for (let S = Math.min(PRINT_ON[i], 50); S < DURATION; S += 0.5) {
      const c = CAM.at(S);
      const ok = SX(c, x0) - 3 >= 65 && SX(c, x1) + 3 <= 1015 && SY(c, y0) - 5 >= 290 && SY(c, y1) + 5 <= 1070;
      if (!ok) fail(`print ${i} is outside the box at S${S}`);
    }
    report.push(`print ${i}: cap ${(METRIC.cap * (i < 2 ? PRINT.FS : PRINT.NAME_FS) * CAM.at(PRINT_ON[i]).k).toFixed(1)} px on its word f${PRINT_ON[i]}`);
  });
  {
    const cap50 = METRIC.cap * PRINT.FS * CAM.at(50).k;
    report.push(`f50: 15 MIN cap ${cap50.toFixed(1)} px; f73 k ${CAM.at(73).k.toFixed(3)} (settled ${K_CLOSE})`);
    if (cap50 < 22) fail(`f50: 15 MIN's cap is ${cap50.toFixed(1)} px`);
    const creep = CAM.at(150).k / CAM.at(60).k - 1;
    report.push(`f60->f150 push ${(creep * 100).toFixed(1)} %; f164 k ${CAM.at(DURATION - 1).k.toFixed(3)}`);
    if (creep > 0.04 || creep < 0) fail(`f60->f150 the camera moves ${(creep * 100).toFixed(1)} %`);
  }
  const cc = camCheck(CAM.at, 0, DURATION - 1);
  const ccClose = camCheck(CAM.at, 40, DURATION - 1);
  if (ccClose.maxA > 2.5) fail(`the push / hold handover accelerates ${ccClose.maxA.toFixed(2)} px/f^2 at f${ccClose.atA}`);
  report.push(`camera maxV ${cc.maxV.toFixed(1)} px/f at f${cc.atV}, maxA ${cc.maxA.toFixed(2)} at f${cc.atA}, minV ${cc.minV.toFixed(2)}`);
  report.push(`packed at f${PACKED_AT.toFixed(1)}`);
  return report;
})();
