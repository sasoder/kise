import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLACK,
  CaptionStripDebug,
  FPS as SET_FPS,
  INK,
  PAPER_BASE,
  SHADOW,
  SHADOW_OFF,
  TallPaper,
  WorldTall,
  camEase,
  clamp,
  runCamera2,
  type,
  worldTransformTall,
} from "../kits/core-memory/deathCountShared";

// ---------------------------------------------------------------------------
// "HARVARD REPORT" — cut 2 of the CM_EARLY_JS trailer (Core Memory podcast,
// Andrew Kiguel). 1080 x 1920, 24000/1001 fps, 77 frames, opaque, the core
// memory graphic standard (deathCountShared / cerroShared).
//
// CHECK LINE: "This is a real, dated document: a Harvard Business Review
// report from April 2025, and it contains a ranked list."
//
// THE PICTURE: one printed report lying on the squared paper: a white sheet
// (tilted 3 degrees, hard shadow) with a masthead (a flat shield mark and
// HARVARD / BUSINESS / REVIEW in black Barlow caps), a heavy rule, a headline
// made of two heavy black bars, the date line APRIL 2025, and a ranked list:
// six rows, a numeral 1-6 and a bar each, row 1 the longest. Nothing on the
// sheet is coloured (the purple mark belongs to the next cut).
// Fact: Harvard Business Review, "How People Are Really Using Gen AI in
// 2025", Marc Zao-Sanders, 9 April 2025 (the top 100 uses of generative AI).
//
// THE WORDS (local frame; f0 = sequence 26.652 s):
//   Harvard ~0 · came 4 · out 12 · with 20 · a 25 · report 28-40 · about 43 ·
//   nine 53 · months 60 · ago 66 · END 77
//
// THE MOTION (one move; the words are its inflections):
//   f0      the sheet is already sliding up from below (its top edge at
//           screen y ~800, three quarters of it in frame, the masthead in
//           view), turned -8 deg                                — "Harvard"
//   f0-26   it slides up onto the true middle on a cubic ease-out (60 screen
//           px per frame at f0, 0 at f26) while its turn swings to -3 deg
//           with one soft overshoot (-2.7 deg near f21); masthead clear of
//           the caption strip from f5                           — "came out with a"
//   f26-    it lies there: masthead, headline and date line above the
//           caption strip, the list below it; the camera's creep carries on
//                                                              — "report"
//   f34-    the camera's push grows into a tilt down the page  — "about"
//   f50-60  a hand-drawn ink underline strokes in under APRIL 2025, left to
//           right                                              — "nine months"
//   f60-76  the camera is still pushing in on the list; on f76 row 1 sits
//           just above the caption strip, rows large, still moving — "ago"
//
// THE CAMERA — keyed per frame, damped by runCamera2, pre-rolled 40 frames so
// it is already moving on f0. One creep (k grows 0.11 % per frame from before
// f0 to the end) carrying one move (f34 -> f92 on the smoothstep, so it is
// still running on the last frame): k x 1.6, the centre travelling down the
// sheet's own (tilted) axis from the sheet's middle to row 1. No sway: the
// camera never rests in this cut, and the next cut opens on its last frame.
//
// THE DAMPED NUMBERS: see the report table (bun scripts print `layoutAt`).
// ---------------------------------------------------------------------------

export const FPS = SET_FPS;
export const DURATION = 77;

export const schema = z.object({
  debugCaptions: z.boolean(),
  masthead: z.tuple([z.string(), z.string(), z.string()]),
  dateLine: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  debugCaptions: false,
  masthead: ["HARVARD", "BUSINESS", "REVIEW"],
  dateLine: "APRIL 2025",
});

// -- the sheet, world px (unrotated; it is then turned about SHEET_C) -----------
export const SHEET = { x: 0, y: -20, w: 1080, h: 1960 } as const;
export const SHEET_C = { x: SHEET.x + SHEET.w / 2, y: SHEET.y + SHEET.h / 2 } as const; // (540, 960)
export const TILT_REST = -3; // degrees, SVG sense (negative = anticlockwise)

const MARGIN = 80; // masthead / headline / date line inset
// masthead: the shield, then three lines of Barlow 900
const SHIELD = { x: 80, y: 86, w: 170, h: 214 } as const;
const MAST = { x: 284, size: 136, baselines: [165, 281, 397] } as const;
const RULE = { y: 446, h: 14 } as const;
// headline: two heavy bars
const HEAD = [
  { y: 512, w: 920 },
  { y: 628, w: 610 },
] as const;
const HEAD_H = 82;
// date line
const DATE = { x: 164, baseline: 912, size: 124 } as const;
const UNDER_Y = 952;
const UNDER_W = 13;
// a quiet rule in the caption strip, between the header and the list
const LIST_RULE = { y: 1214, h: 6 } as const;

// -- the list: THE SPEC SHARED WITH THE NEXT CUT ----------------------------------
export const LIST = {
  /** row r (0-5): the row's centre line is rowY0 + r * pitch */
  rowY0: 1372,
  pitch: 96,
  /** numerals: Barlow 900, black, textAnchor middle on numX, baseline = row centre + numDrop */
  numX: 196,
  numSize: 80,
  numDrop: 28,
  /** bars: black, height 34, radius 6, from barX0, length = barMax * LENGTHS[r] */
  barX0: 256,
  barMax: 664,
  barH: 34,
  barR: 6,
  lengths: [1.0, 0.86, 0.74, 0.66, 0.55, 0.47],
} as const;

// -- the drop -------------------------------------------------------------------------
const DROP = { from: 800, land: 26 } as const; // world px below its place at f0; frame it lands
const SLIDE = Easing.out(Easing.cubic);
/** the sheet's offset below its place, world px (pre-f0 it carries on along the curve) */
export const dropAt = (f: number) => (f >= DROP.land ? 0 : DROP.from * (1 - SLIDE(Math.max(0, f) / DROP.land)));
/** the sheet's turn, degrees: -8 at f0, swinging to -3 with one soft overshoot */
export const tiltAt = (f: number) => TILT_REST - 5 * Math.exp(-f / 7) * Math.cos(f / 9);

// -- the underline ---------------------------------------------------------------------
const UNDER = { start: 50, frames: 10 } as const;
const STROKE_EASE = Easing.bezier(0.3, 0, 0.3, 1);
const UNDER_D = `M${DATE.x + 4} ${UNDER_Y + 4} C 310 ${UNDER_Y - 9}, 500 ${UNDER_Y + 13}, 640 ${UNDER_Y} S 800 ${UNDER_Y + 6}, 858 ${UNDER_Y - 8}`;

// -- the camera -------------------------------------------------------------------------
const PRE = 40;
const LAG = 4.2; // runCamera2 trails a smooth target by CAM_DAMP / CAM_STIFF - 1 frames
export const CAM = {
  k0: 0.776, // desired k on f0
  creep: 0.0011, // per frame, geometric, the whole cut
  move: [30, 88], // the push + tilt down the page (smoothstep; still running at the end)
  kMul: 1.68,
  cy0: SHEET_C.y,
  cy1: 1395,
} as const;
const SIN_T = Math.sin((-TILT_REST * Math.PI) / 180);
const desired = (f: number) => {
  const g = camEase((f - CAM.move[0]) / (CAM.move[1] - CAM.move[0]), 1);
  const k = CAM.k0 * Math.exp(CAM.creep * f) * Math.pow(CAM.kMul, g);
  const cy = CAM.cy0 + (CAM.cy1 - CAM.cy0) * g;
  // down the sheet's own axis: a point under the sheet's middle sits to the right
  const cx = SHEET_C.x + (cy - SHEET_C.y) * SIN_T;
  return { k, cx, cy };
};
const CAM_F: number[] = [];
const CAM_K: number[] = [];
const CAM_CY: number[] = [];
const CAM_CX: number[] = [];
for (let g = 0; g <= DURATION + PRE; g++) {
  const key = desired(g - PRE + LAG);
  CAM_F.push(g);
  CAM_K.push(key.k);
  CAM_CY.push(key.cy);
  CAM_CX.push(key.cx);
}
/** the damped camera at a local frame */
export const cameraAt = (frame: number) => runCamera2(frame + PRE, CAM_F, CAM_CY, CAM_CX, CAM_K);
const CX_REST = 550;
const CY_REST = 1150; // the middle of the camera's travel

/** where things are on screen, for the report table and the reviews */
export const layoutAt = (frame: number) => {
  const cam = cameraAt(frame);
  const t = worldTransformTall(cam.cx, cam.cy, cam.k);
  const a = (tiltAt(frame) * Math.PI) / 180;
  const drop = dropAt(frame);
  /** a sheet point (unrotated world px) -> screen */
  const pt = (x: number, y: number) => {
    const dx = x - SHEET_C.x;
    const dy = y - SHEET_C.y;
    const wx = SHEET_C.x + dx * Math.cos(a) - dy * Math.sin(a);
    const wy = SHEET_C.y + dx * Math.sin(a) + dy * Math.cos(a) + drop;
    return { x: t.tx + wx * cam.k, y: t.ty + wy * cam.k };
  };
  return { cam, tilt: tiltAt(frame), drop, pt };
};

const Shield: React.FC = () => {
  const { x, y, w, h } = SHIELD;
  const d = `M${x} ${y} H${x + w} V${y + h * 0.56} C${x + w} ${y + h * 0.82}, ${x + w * 0.72} ${y + h * 0.94}, ${x + w / 2} ${y + h} C${x + w * 0.28} ${y + h * 0.94}, ${x} ${y + h * 0.82}, ${x} ${y + h * 0.56} Z`;
  const bw = 46;
  const bh = 34;
  return (
    <g>
      <path d={d} fill={BLACK} />
      <rect x={x + w / 2 - bw - 9} y={y + 34} width={bw} height={bh} fill={INK} />
      <rect x={x + w / 2 + 9} y={y + 34} width={bw} height={bh} fill={INK} />
      <rect x={x + w / 2 - bw / 2} y={y + 34 + bh + 22} width={bw} height={bh} fill={INK} />
    </g>
  );
};

const HarvardReport: React.FC<Props> = ({ debugCaptions, masthead, dateLine }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const drop = dropAt(frame);
  const tilt = tiltAt(frame);
  const under = interpolate(frame, [UNDER.start, UNDER.start + UNDER.frames], [0, 1], {
    easing: STROKE_EASE,
    ...clamp,
  });
  const turned = `translate(0 ${drop.toFixed(3)}) rotate(${tilt.toFixed(4)} ${SHEET_C.x} ${SHEET_C.y})`;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <TallPaper frame={frame} cx={cam.cx} cy={cam.cy} k={cam.k} cxRest={CX_REST} cyRest={CY_REST} />
      <WorldTall cx={cam.cx} cy={cam.cy} k={cam.k} id="hr-world">
        {/* the hard shadow: the sheet's own silhouette at +4/+4 */}
        <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
          <g transform={turned}>
            <rect x={SHEET.x} y={SHEET.y} width={SHEET.w} height={SHEET.h} fill={SHADOW} />
          </g>
        </g>
        <g transform={turned}>
          <rect x={SHEET.x} y={SHEET.y} width={SHEET.w} height={SHEET.h} fill={INK} />

          {/* masthead */}
          <Shield />
          {masthead.map((line, i) => (
            <text key={i} x={MAST.x} y={MAST.baselines[i]} fill={BLACK} style={type(MAST.size, 900)}>
              {line}
            </text>
          ))}
          <rect x={MARGIN} y={RULE.y} width={SHEET.w - 2 * MARGIN} height={RULE.h} fill={BLACK} />

          {/* headline: text as bars */}
          {HEAD.map((b, i) => (
            <rect key={i} x={MARGIN} y={b.y} width={b.w} height={HEAD_H} rx={8} fill={BLACK} />
          ))}

          {/* date line + the pen's underline */}
          <text x={DATE.x} y={DATE.baseline} fill={BLACK} style={type(DATE.size, 900)}>
            {dateLine}
          </text>
          {under > 0 ? (
            <path
              d={UNDER_D}
              fill="none"
              stroke={BLACK}
              strokeWidth={UNDER_W}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={`${under} 1`}
            />
          ) : null}

          <rect x={LIST.numX - 36} y={LIST_RULE.y} width={LIST.barX0 + LIST.barMax - (LIST.numX - 36)} height={LIST_RULE.h} fill={BLACK} />

          {/* the ranked list */}
          {LIST.lengths.map((len, r) => {
            const y = LIST.rowY0 + r * LIST.pitch;
            return (
              <g key={r}>
                <text x={LIST.numX} y={y + LIST.numDrop} textAnchor="middle" fill={BLACK} style={type(LIST.numSize, 900)}>
                  {r + 1}
                </text>
                <rect
                  x={LIST.barX0}
                  y={y - LIST.barH / 2}
                  width={LIST.barMax * len}
                  height={LIST.barH}
                  rx={LIST.barR}
                  fill={BLACK}
                />
              </g>
            );
          })}
        </g>
      </WorldTall>
      <CaptionStripDebug on={debugCaptions} />
    </AbsoluteFill>
  );
};

export default HarvardReport;
