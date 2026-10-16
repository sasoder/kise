import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_STIFF } from "../kits/core-memory/cerroShared";
import {
  BLACK,
  CaptionStripDebug,
  ChainEcho,
  EASE_LAND,
  FPS as SET_FPS,
  Figure,
  INK,
  ORANGE,
  PAPER_BASE,
  PURPLE,
  SHADOW,
  SHADOW_OFF,
  TallPaper,
  WorldTall,
  clamp,
  sway,
  textRise,
  type,
  worldTransformTall,
} from "../kits/core-memory/deathCountShared";
import {
  DURATION as HR_DURATION,
  LIST,
  SHEET,
  SHEET_C,
  TILT_REST,
  cameraAt as hrCameraAt,
} from "./HarvardReport";

// ---------------------------------------------------------------------------
// "NUMBER ONE: COMPANIONSHIP" — cut 3 of the CM_EARLY_JS trailer (Core Memory,
// Andrew Kiguel). 1080 x 1920, 24000/1001 fps, 123 frames, opaque, the core
// memory graphic standard (deathCountShared / cerroShared).
//
// CHECK LINE: "Of all the things people use AI for, the top-ranked one is not
// work at all: it is a person and an AI keeping each other company."
//
// THE PICTURE: THE SAME SHEET as the previous cut (HarvardReport: its SHEET,
// SHEET_C, TILT_REST and LIST are imported, its print is copied), seen close
// on the ranked list, APRIL 2025 already underlined above it. Row 1 lifts off
// the sheet as its own white slab on a hard shadow and its "1" fills with
// PURPLE (the ranking mark). The slab then GROWS, steadily, its black bar
// thickening, while rows 2-6 below it answer once in a quick cascade (several,
// real, not the point). The thick bar OPENS from its centre line into a window
// cut through the page: in it, on the squared paper, a WHITE person and an
// ORANGE one (the AI) stand up side by side and a link is drawn between them.
// The bar was the text; under the window it is finally printed: THERAPY /
// COMPANIONSHIP. The chain crown rises from behind the slab's top edge.
//
// THE WORDS (local frame; f0 = sequence 29.863 s):
//   And -2 · the 5 · number 15 · one 22 · use 29 · case 34 · for 39 · AI 43 ·
//   not 53 · that 58 · there 63 · aren't 66 · several 69-77 · but 78 · the 81 ·
//   number 83 · one 88 · was 93 · companionship 97-115 · END 123
//
// THE MOTION (one move; the words are its inflections):
//   f0        the next frame of HarvardReport's push: same sheet, same camera
//             state AND velocity (see THE CAMERA), which brakes into this cut
//   f2-20     row 1 lifts: its slab slides 6/9 px up-left off the sheet, its
//             hard shadow opens to 14 px, it turns 1 deg toward level — "the number"
//   f13-22    purple rises through the "1" from its foot        — "number one"
//   f22-90    ONE eased growth: the slab grows (upward, off the rows below),
//             its bar thickens from 34 to 192 and, from f40, HOLLOWS from its
//             centre line into a thick frame with the squared paper inside (an
//             empty picture frame by f78); the "1" grows with it, while
//             the camera drifts down the page and eases back a touch (k 1.36
//             -> 1.27)                              — "use case for AI ... but the number one"
//   f56-77    rows 2-6 cascade top to bottom (starts f56/59/62/65/68, 9 frames
//             each): each bar slides out 70 px and back, its numeral bumps — "not that there aren't several"
//   f92-104   the bar opens from its centre line into the window; the slab
//             grows down for the label                           — "was"
//   f95-104   the white person stands up out of the lower lip; f98-107 the
//             orange one; f102-106 the link is drawn white -> orange
//   f96-      the chain crown rises from behind the slab's top edge (22-frame
//             layers, 2 apart): the cut's one echo
//   f97-109   THERAPY / COMPANIONSHIP slides up under the window — "companionship"
//   f107-122  hold: the pair sways, the slab hovers, the camera creeps in
//
// THE CAMERA — the house damper (CAM_STIFF / CAM_DAMP, as runCamera2), but
// started from HarvardReport's own state: position = its cameraAt(77) (the
// frame after its last), velocity = cameraAt(77) - cameraAt(76). The target
// starts where that cut's target was (position + 5.2 x velocity, the damper's
// steady lag) and relaxes (e^(-f/5)) onto this cut's track: a settle on row 1,
// one smoothstep f20-90 to the final framing, then a creep. Damped numbers:
// see the table printed by `layoutAt` in the builder's report.
// ---------------------------------------------------------------------------

export const FPS = SET_FPS;
export const DURATION = 123;

export const schema = z.object({
  debugCaptions: z.boolean(),
  /** the sheet's print, as in HarvardReport */
  masthead: z.tuple([z.string(), z.string(), z.string()]),
  dateLine: z.string(),
  /** the rank-1 label: the small line, then the word */
  labelTop: z.string(),
  labelMain: z.string(),
  /** the mark on the orange bust */
  aiMark: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = {
  debugCaptions: false,
  masthead: ["HARVARD", "BUSINESS", "REVIEW"],
  dateLine: "APRIL 2025",
  labelTop: "THERAPY /",
  labelMain: "COMPANIONSHIP",
  aiMark: "AI",
};

// -- the sheet's print: COPIED from HarvardReport (not exported there) ---------------
const MARGIN = 80;
const SHIELD = { x: 80, y: 86, w: 170, h: 214 } as const;
const MAST = { x: 284, size: 136, baselines: [165, 281, 397] } as const;
const RULE = { y: 446, h: 14 } as const;
const HEAD = [
  { y: 512, w: 920 },
  { y: 628, w: 610 },
] as const;
const HEAD_H = 82;
const DATE = { x: 164, baseline: 912, size: 124 } as const;
const UNDER_Y = 952;
const UNDER_W = 13;
const LIST_RULE = { y: 1214, h: 6 } as const;
const UNDER_D = `M${DATE.x + 4} ${UNDER_Y + 4} C 310 ${UNDER_Y - 9}, 500 ${UNDER_Y + 13}, 640 ${UNDER_Y} S 800 ${UNDER_Y + 6}, 858 ${UNDER_Y - 8}`;

const Shield: React.FC = () => {
  const { x, y, w, h } = SHIELD;
  const d = `M${x} ${y} H${x + w} V${y + h * 0.56} C${x + w} ${y + h * 0.82}, ${x + w * 0.72} ${y + h * 0.94}, ${x + w / 2} ${y + h} C${x + w * 0.28} ${y + h * 0.94}, ${x} ${y + h * 0.82}, ${x} ${y + h * 0.56} Z`;
  const bw = 46;
  const bh = 34;
  return (
    <g>
      <path d={d} fill={BLACK} />
      <rect
        x={x + w / 2 - bw - 9}
        y={y + 34}
        width={bw}
        height={bh}
        fill={INK}
      />
      <rect x={x + w / 2 + 9} y={y + 34} width={bw} height={bh} fill={INK} />
      <rect
        x={x + w / 2 - bw / 2}
        y={y + 34 + bh + 22}
        width={bw}
        height={bh}
        fill={INK}
      />
    </g>
  );
};

// -- row 1's slab, SHEET px (it lives in the sheet's turned frame) ---------------------
const CAP = 0.7; // Barlow's cap height per em
export const Y1 = LIST.rowY0; // row 1's centre line, 1372
const rowY = (r: number) => LIST.rowY0 + r * LIST.pitch;
export const SLAB = { x0: 155, x1: 930 };
const SLAB_CX = (SLAB.x0 + SLAB.x1) / 2;
/** lifted: slid up-left, a 14 px shadow, turned 1 deg toward level */
const LIFT = { dx: -6, dy: -9, shadow: 14, turn: 1 };
// the growth (f22-90): the bar thickens and its centre climbs, so its lower
// edge stays where row 1's was and rows 2-6 stay in view below the slab
const RISE = 85; // the bar's centre climbs this far
const HALF_GROWN = 96; // the bar's half height when grown
// the window (f92-104)
const FRAME_T = 20; // the frame the bar leaves around the opening
const WIN_HALF = 132; // the opening's half height
const HALF_OPEN = WIN_HALF + FRAME_T;
const WIN_C = Y1 - RISE; // 1287
const PAD_TOP = [46, 36]; // slab edge above the bar: at rest, grown
const PAD_BOTTOM = [46, 36];
const NUM_BIG = 180;
// the pair: they stand a little above the lower lip so the shoulders and the
// link between them read whole
export const BUST = 239;
const PAIR_GAP = 52; // between the two shoulders' ink at their base
const PAIR_CX = LIST.barX0 + LIST.barMax / 2; // 588
const BUST_L = PAIR_CX - PAIR_GAP / 2 - 0.88 * BUST;
const BUST_R = PAIR_CX + PAIR_GAP / 2 - 0.12 * BUST;
const STAND = 34; // their base above the lip
const LINK_H = 24;
const AI_SIZE = 76; // the mark on the orange bust's chest
const LINK_UP = 0.2 * BUST; // the link's centre line above their base
const LINK_HALF =
  PAIR_GAP / 2 + (0.38 - Math.sqrt(0.38 * 0.38 - 0.2 * 0.2)) * BUST + 8;
// the label, printed on the slab under the window
const TOP_SIZE = 54;
const MAIN_SIZE = 96;
const TOP_BASE = WIN_C + HALF_OPEN + 20 + CAP * TOP_SIZE;
export const MAIN_BASE = TOP_BASE + 14 + CAP * MAIN_SIZE; // 1578
const SLAB_BOTTOM_OPEN = MAIN_BASE + 26; // in the gap between rows 3 and 4

// -- timing ------------------------------------------------------------------------
export const T = {
  lift: [2, 20],
  purple: [13, 22],
  grow: [22, 90],
  cascade: [56, 59, 62, 65, 68], // 9 frames each: done by f77
  hollow: [40, 78],
  cover: [92, 97], // the slab's lower edge sweeps over rows 2-3
  open: [92, 104],
  white: [95, 104],
  orange: [98, 107],
  link: [102, 106],
  echo: 96,
  label: 97,
} as const;

// -- sheet <-> world ------------------------------------------------------------------
const RAD = Math.PI / 180;
const turnPt = (x: number, y: number, deg: number, ox: number, oy: number) => {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return {
    x: ox + (x - ox) * c - (y - oy) * s,
    y: oy + (x - ox) * s + (y - oy) * c,
  };
};
/** a sheet point -> world (the sheet is turned TILT_REST about SHEET_C) */
export const sheetToWorld = (x: number, y: number) =>
  turnPt(x, y, TILT_REST, SHEET_C.x, SHEET_C.y);
/** a slab point -> sheet (the slab's own turn is about row 1's middle, then the lift) */
const slabToSheet = (
  x: number,
  y: number,
  turn: number,
  lx: number,
  ly: number,
) => {
  const p = turnPt(x, y, turn, SLAB_CX, Y1);
  return { x: p.x + lx, y: p.y + ly };
};

// -- the camera ---------------------------------------------------------------------
type Cam = { k: number; cx: number; cy: number };
const HR_NEXT = hrCameraAt(HR_DURATION); // the frame after HarvardReport's last
const HR_LAST = hrCameraAt(HR_DURATION - 1);
const V0: Cam = {
  k: HR_NEXT.k - HR_LAST.k,
  cx: HR_NEXT.cx - HR_LAST.cx,
  cy: HR_NEXT.cy - HR_LAST.cy,
};
const STEADY_LAG = CAM_DAMP / CAM_STIFF; // target - position = 5.2 x velocity on a steady move
export const CAM = {
  /** the settle on the lifted row */
  settle: { k: 1.36, cx: 564, cy: 1400 },
  /** then k and cx ease so APRIL's "A" and the slab's shadow both keep a margin */
  ease: [14, 44],
  relax: 5, // frames (e-folding) of the hand-over from the previous cut's target
  move: [20, 90],
  kEnd: [1.268, 1.283], // from f44 to f90, at f122
  cxEnd: 557.5,
  /** the label's baseline (at the slab's middle) sits on this screen y */
  labelY: 1044,
} as const;
const lerp = (a: number, b: number, g: number) => a + (b - a) * g;
const smooth = (u: number) => {
  const t = Math.max(0, Math.min(1, u));
  return t * t * (3 - 2 * t);
};
const LABEL_W = (() => {
  const s = slabToSheet(SLAB_CX, MAIN_BASE, LIFT.turn, LIFT.dx, LIFT.dy);
  return sheetToWorld(s.x, s.y);
})();
const target = (f: number): Cam => {
  const { settle, move, kEnd } = CAM;
  const kE =
    f <= move[1]
      ? kEnd[0]
      : lerp(kEnd[0], kEnd[1], (f - move[1]) / (DURATION - 1 - move[1]));
  const end: Cam = {
    k: kE,
    cx: CAM.cxEnd,
    cy: LABEL_W.y - (CAM.labelY - 960) / kE,
  };
  const gy = smooth((f - move[0]) / (move[1] - move[0]));
  const gk = smooth((f - CAM.ease[0]) / (CAM.ease[1] - CAM.ease[0]));
  const h = Math.exp(-f / CAM.relax);
  const ch = (key: keyof Cam) =>
    lerp(settle[key], end[key], key === "cy" ? gy : gk) +
    (HR_NEXT[key] + STEADY_LAG * V0[key] - settle[key]) * h;
  return { k: ch("k"), cx: ch("cx"), cy: ch("cy") };
};
const CAM_TRACK: Cam[] = (() => {
  const out: Cam[] = [{ ...HR_NEXT }];
  const p = { ...HR_NEXT };
  const v = { ...V0 };
  for (let f = 1; f < DURATION; f++) {
    const t = target(f);
    (["k", "cx", "cy"] as const).forEach((key) => {
      v[key] += (t[key] - p[key]) * CAM_STIFF - v[key] * CAM_DAMP;
      p[key] += v[key];
    });
    out.push({ ...p });
  }
  return out;
})();
/** the damped camera at a local frame (no sway) */
export const cameraAt = (frame: number) =>
  CAM_TRACK[Math.max(0, Math.min(DURATION - 1, Math.round(frame)))];
// the ground carries on from the previous cut too (same rest point, same drift)
const CX_REST = 550;
const CY_REST = 1150;

/** where things are on screen, for the report table and the reviews */
export const layoutAt = (frame: number) => {
  const cam = cameraAt(frame);
  const t = worldTransformTall(cam.cx, cam.cy, cam.k);
  const pt = (x: number, y: number) => {
    const w = sheetToWorld(x, y);
    return { x: t.tx + w.x * cam.k, y: t.ty + w.y * cam.k };
  };
  return {
    cam,
    pt,
    rows: LIST.lengths.map((_, r) => pt(540, rowY(r)).y),
    labelBase: t.ty + LABEL_W.y * cam.k,
    numeralCap: CAP * LIST.numSize * cam.k,
  };
};

// -- drawing helpers -----------------------------------------------------------------
const n = (v: number) => v.toFixed(2);
type Box = { x0: number; y0: number; x1: number; y1: number };
const rectPath = (b: Box) =>
  `M${n(b.x0)} ${n(b.y0)} H${n(b.x1)} V${n(b.y1)} H${n(b.x0)} Z`;
const roundPath = (b: Box, r: number) =>
  `M${n(b.x0 + r)} ${n(b.y0)} H${n(b.x1 - r)} A${r} ${r} 0 0 1 ${n(b.x1)} ${n(b.y0 + r)} V${n(b.y1 - r)} A${r} ${r} 0 0 1 ${n(b.x1 - r)} ${n(b.y1)} H${n(b.x0 + r)} A${r} ${r} 0 0 1 ${n(b.x0)} ${n(b.y1 - r)} V${n(b.y0 + r)} A${r} ${r} 0 0 1 ${n(b.x0 + r)} ${n(b.y0)} Z`;
const grow = (b: Box, d: number): Box => ({
  x0: b.x0 - d,
  y0: b.y0 - d,
  x1: b.x1 + d,
  y1: b.y1 + d,
});
const shift = (b: Box, dx: number, dy: number): Box => ({
  x0: b.x0 + dx,
  y0: b.y0 + dy,
  x1: b.x1 + dx,
  y1: b.y1 + dy,
});

const NumberOneCompanionship: React.FC<Props> = ({
  debugCaptions,
  masthead,
  dateLine,
  labelTop,
  labelMain,
  aiMark,
}) => {
  const frame = useCurrentFrame();

  const cam = cameraAt(frame);
  const drift = sway(frame); // 0 on f0: the previous cut has none
  const k = cam.k;
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;

  // -- row 1 lifts ---------------------------------------------------------------------
  const lift = interpolate(frame, [T.lift[0], T.lift[1]], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp,
  });
  const hover = lift * 1.5 * Math.sin(frame / 8);
  const lx = LIFT.dx * lift - hover * 0.6;
  const ly = LIFT.dy * lift - hover;
  const slabShadow = LIFT.shadow * lift + hover;
  const turn = LIFT.turn * lift + 0.15 * lift * Math.sin(frame / 11);
  const slabFrame = `translate(${n(lx)} ${n(ly)}) rotate(${turn.toFixed(3)} ${SLAB_CX} ${Y1})`;
  // the hard shadow falls +x/+y on SCREEN: that direction, in the slab's turned frame
  const sh = turnPt(slabShadow, slabShadow, -(TILT_REST + turn), 0, 0);
  // the pair's shadow: 6 px, so the white bust holds against the pale paper
  const sh6 = turnPt(6, 6, -(TILT_REST + turn), 0, 0);

  // -- it grows, then the bar opens --------------------------------------------------------
  const g = interpolate(frame, [T.grow[0], T.grow[1]], [0, 1], {
    easing: Easing.inOut(Easing.sin),
    ...clamp,
  });
  const open = interpolate(frame, [T.open[0], T.open[1]], [0, 1], {
    easing: EASE_LAND,
    ...clamp,
  });
  const hollow = interpolate(frame, [T.hollow[0], T.hollow[1]], [0, 1], {
    easing: Easing.inOut(Easing.sin),
    ...clamp,
  });
  const cover = interpolate(frame, [T.cover[0], T.cover[1]], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const c = Y1 - RISE * g;
  const barHalf =
    lerp(LIST.barH / 2, HALF_GROWN, g) + (HALF_OPEN - HALF_GROWN) * open;
  const slab: Box = {
    x0: SLAB.x0,
    x1: SLAB.x1,
    y0: c - barHalf - lerp(PAD_TOP[0], PAD_TOP[1], g),
    y1: lerp(
      c + barHalf + lerp(PAD_BOTTOM[0], PAD_BOTTOM[1], g),
      SLAB_BOTTOM_OPEN,
      cover,
    ),
  };
  const bar: Box = {
    x0: LIST.barX0,
    x1: LIST.barX0 + LIST.barMax,
    y0: c - barHalf,
    y1: c + barHalf,
  };
  // the bar hollows from its centre line into a frame while it is still
  // growing: an empty picture frame, waiting for its picture
  const half = hollow * Math.max(0, barHalf - FRAME_T);
  const win: Box = {
    x0: bar.x0 + FRAME_T,
    x1: bar.x1 - FRAME_T,
    y0: c - half,
    y1: c + half,
  };
  const hole = half > 0.5 ? win : null;
  const under = hole ? grow(hole, 13) : null; // the layers below open a little wider
  const barPath = `${roundPath(bar, LIST.barR)}${hole ? ` ${rectPath(hole)}` : ""}`;
  // the same opening through the sheet, in SHEET px (a turned quad)
  const sheetBox = {
    x0: SHEET.x,
    y0: SHEET.y,
    x1: SHEET.x + SHEET.w,
    y1: SHEET.y + SHEET.h,
  };
  const underQuad = under
    ? [
        [under.x0, under.y0],
        [under.x1, under.y0],
        [under.x1, under.y1],
        [under.x0, under.y1],
      ]
        .map(([x, y], i) => {
          const p = slabToSheet(x, y, turn, lx, ly);
          return `${i === 0 ? "M" : "L"}${n(p.x)} ${n(p.y)}`;
        })
        .join(" ") + " Z"
    : "";
  const sheetPath = `${rectPath(sheetBox)} ${underQuad}`;
  const turned = `rotate(${TILT_REST} ${SHEET_C.x} ${SHEET_C.y})`;

  // -- the "1" --------------------------------------------------------------------------
  const purple = interpolate(frame, [T.purple[0], T.purple[1]], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp,
  });
  const numSize = lerp(LIST.numSize, NUM_BIG, g);
  const numX = lerp(LIST.numX, 202, g);
  const numBase = c + (CAP * numSize) / 2;
  const one = (fill: string) => (
    <text
      x={numX}
      y={numBase}
      textAnchor="middle"
      fill={fill}
      style={type(numSize, 900)}
    >
      1
    </text>
  );

  // -- the pair --------------------------------------------------------------------------
  const stand = (range: readonly [number, number]) =>
    interpolate(frame, [range[0], range[1]], [0, 1], {
      easing: EASE_LAND,
      ...clamp,
    });
  const tW = stand(T.white);
  const tO = stand(T.orange);
  const link = interpolate(frame, [T.link[0], T.link[1]], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const floor = win.y1 - STAND; // where they come to stand
  const bustY = (t: number) =>
    floor - 0.9 * BUST + (1 - t) * (0.84 * BUST + STAND);
  const lean = (phase: number) =>
    1.3 *
    Math.sin((frame - 100) / 8 + phase) *
    Math.min(1, Math.max(0, (frame - 100) / 8));
  const linkY = floor - LINK_UP;
  const linkX0 = PAIR_CX - LINK_HALF;
  const linkW = 2 * LINK_HALF * link;

  // -- the label ---------------------------------------------------------------------------
  const rise = textRise(frame, T.label, k);

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <TallPaper
        frame={frame + HR_DURATION}
        cx={cx}
        cy={cy}
        k={k}
        cxRest={CX_REST}
        cyRest={CY_REST}
      />
      <WorldTall cx={cx} cy={cy} k={k} id="noc-world">
        <defs>
          <clipPath id="noc-window" clipPathUnits="userSpaceOnUse">
            <rect
              x={win.x0}
              y={win.y0}
              width={win.x1 - win.x0}
              height={Math.max(0, win.y1 - win.y0)}
            />
          </clipPath>
          <clipPath id="noc-purple" clipPathUnits="userSpaceOnUse">
            <rect
              x={numX - 150}
              y={numBase - CAP * numSize * purple - 2 * purple}
              width={300}
              height={600}
            />
          </clipPath>
        </defs>

        {/* THE SHEET (HarvardReport's): its hard shadow, then the sheet */}
        <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
          <g transform={turned}>
            <path d={sheetPath} fill={SHADOW} fillRule="evenodd" />
          </g>
        </g>
        <g transform={turned}>
          <path d={sheetPath} fill={INK} fillRule="evenodd" />

          {/* masthead */}
          <Shield />
          {masthead.map((line, i) => (
            <text
              key={i}
              x={MAST.x}
              y={MAST.baselines[i]}
              fill={BLACK}
              style={type(MAST.size, 900)}
            >
              {line}
            </text>
          ))}
          <rect
            x={MARGIN}
            y={RULE.y}
            width={SHEET.w - 2 * MARGIN}
            height={RULE.h}
            fill={BLACK}
          />

          {/* headline: text as bars */}
          {HEAD.map((b, i) => (
            <rect
              key={i}
              x={MARGIN}
              y={b.y}
              width={b.w}
              height={HEAD_H}
              rx={8}
              fill={BLACK}
            />
          ))}

          {/* date line, the pen's underline already under it */}
          <text
            x={DATE.x}
            y={DATE.baseline}
            fill={BLACK}
            style={type(DATE.size, 900)}
          >
            {dateLine}
          </text>
          <path
            d={UNDER_D}
            fill="none"
            stroke={BLACK}
            strokeWidth={UNDER_W}
            strokeLinecap="round"
          />

          {/* the list's rule: under the grown slab by the time the window opens */}
          {g < 0.8 ? (
            <rect
              x={LIST.numX - 36}
              y={LIST_RULE.y}
              width={LIST.barX0 + LIST.barMax - (LIST.numX - 36)}
              height={LIST_RULE.h}
              fill={BLACK}
            />
          ) : null}

          {/* rows 2-6: several, real, unnamed. One quick cascade, top to bottom. */}
          {LIST.lengths.map((len, r) => {
            if (r === 0) return null;
            // rows 2-3 end up under the slab: each goes the moment the slab's
            // lower edge reaches it on its sweep (f92-97, never before), so no
            // part-covered row ever shows
            if (cover > 0 && slab.y1 + ly > rowY(r) - 36) return null;
            const t0 = T.cascade[r - 1];
            const u = interpolate(frame, [t0, t0 + 9], [0, 1], clamp);
            const bump = 0.5 * (1 - Math.cos(2 * Math.PI * u)); // eased out and back
            const y = rowY(r);
            return (
              <g key={r}>
                <text
                  x={LIST.numX}
                  y={y + LIST.numDrop - 12 * bump}
                  textAnchor="middle"
                  fill={BLACK}
                  style={type(LIST.numSize, 900)}
                >
                  {r + 1}
                </text>
                <rect
                  x={LIST.barX0 + 70 * bump}
                  y={y - LIST.barH / 2}
                  width={LIST.barMax * len}
                  height={LIST.barH}
                  rx={LIST.barR}
                  fill={BLACK}
                />
              </g>
            );
          })}

          {/* ROW 1's SLAB: shadow, the chain crown behind its top edge, the slab */}
          <g transform={slabFrame}>
            {slabShadow > 0.05 ? (
              <path
                d={`${rectPath(shift(slab, sh.x, sh.y))}${under ? ` ${rectPath(under)}` : ""}`}
                fill={SHADOW}
                fillRule="evenodd"
              />
            ) : null}
            <ChainEcho
              frame={frame}
              start={T.echo}
              core="none"
              from={{ dx: 0, dy: 36 }}
              render={(fill) => (
                <rect
                  x={slab.x0}
                  y={slab.y0}
                  width={slab.x1 - slab.x0}
                  height={40}
                  fill={fill}
                />
              )}
            />
            <path
              d={`${rectPath(slab)}${hole ? ` ${rectPath(hole)}` : ""}`}
              fill={INK}
              fillRule="evenodd"
            />

            {/* the bar: thickening, then opening into the window's frame */}
            <path d={barPath} fill={BLACK} fillRule="evenodd" />

            {/* the "1": black print, purple rising through it from its foot */}
            {purple < 1 ? one(BLACK) : null}
            {purple > 0 ? (
              <g clipPath={purple < 1 ? "url(#noc-purple)" : undefined}>
                {one(PURPLE)}
              </g>
            ) : null}

            {/* the answer, standing in the window on the squared paper */}
            {hole ? (
              <g clipPath="url(#noc-window)">
                {link > 0 ? (
                  <>
                    <rect
                      x={linkX0 + sh6.x}
                      y={linkY - LINK_H / 2 + sh6.y}
                      width={linkW}
                      height={LINK_H}
                      fill={SHADOW}
                    />
                    <rect
                      x={linkX0}
                      y={linkY - LINK_H / 2}
                      width={linkW}
                      height={LINK_H}
                      fill={INK}
                    />
                  </>
                ) : null}
                {tO > 0 ? (
                  <g
                    transform={`rotate(${n(lean(2.2))} ${n(BUST_R + BUST / 2)} ${n(floor)})`}
                  >
                    <Figure
                      x={BUST_R + sh6.x}
                      y={bustY(tO) + sh6.y}
                      size={BUST}
                      mode="solid"
                      ink={SHADOW}
                      shadow={false}
                    />
                    <Figure
                      x={BUST_R}
                      y={bustY(tO)}
                      size={BUST}
                      mode="solid"
                      ink={ORANGE}
                      shadow={false}
                    />
                    {/* which of the two is the AI */}
                    <text
                      x={BUST_R + BUST / 2}
                      y={bustY(tO) + 0.86 * BUST}
                      textAnchor="middle"
                      fill={BLACK}
                      style={type(AI_SIZE, 900)}
                    >
                      {aiMark}
                    </text>
                  </g>
                ) : null}
                {tW > 0 ? (
                  <g
                    transform={`rotate(${n(lean(0))} ${n(BUST_L + BUST / 2)} ${n(floor)})`}
                  >
                    <Figure
                      x={BUST_L + sh6.x}
                      y={bustY(tW) + sh6.y}
                      size={BUST}
                      mode="solid"
                      ink={SHADOW}
                      shadow={false}
                    />
                    <Figure
                      x={BUST_L}
                      y={bustY(tW)}
                      size={BUST}
                      mode="solid"
                      shadow={false}
                    />
                  </g>
                ) : null}
              </g>
            ) : null}

            {/* the bar was the text: here it is, printed on the slab */}
            {rise.opacity > 0 ? (
              <g opacity={rise.opacity}>
                <text
                  x={SLAB_CX}
                  y={TOP_BASE + rise.dy}
                  textAnchor="middle"
                  fill={BLACK}
                  style={type(TOP_SIZE, 800, 0.04)}
                >
                  {labelTop}
                </text>
                <text
                  x={SLAB_CX}
                  y={MAIN_BASE + rise.dy}
                  textAnchor="middle"
                  fill={BLACK}
                  style={type(MAIN_SIZE, 900)}
                >
                  {labelMain}
                </text>
              </g>
            ) : null}
          </g>
        </g>
      </WorldTall>
      <CaptionStripDebug on={debugCaptions} />
    </AbsoluteFill>
  );
};

export default NumberOneCompanionship;
