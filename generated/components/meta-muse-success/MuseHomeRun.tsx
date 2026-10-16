import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  ElevationShadow,
  GEO,
  Label,
  LightSweep,
  METRIC,
  Numeral,
  Rule,
  SPACE,
  STROKE,
  StoutStage,
  TYPE,
  amberBandFor,
  bloomFilter,
  camFor,
  clamp01,
  lerp,
  opticalFit,
  rectPath,
  smoothstep,
  type Silhouette,
} from "../kits/cheeky-pint/stoutShared";

// ---------------------------------------------------------------------------
// MuseHomeRun — Cheeky Pint S4 (stout system, stoutShared.tsx, palette B1).
// 1080x1920, 23.976 fps (24000/1001, the Premiere sequence), opaque.
//
// CHECK LINE (what the viewer can say after this cut): "Muse passed 5 million
// US downloads in its first 22 days, more than double what ChatGPT did in its
// own first 22 days."
//
// THE LINE (Mark Zuckerberg): "[there's] always the case where you (f7-42) get a
// home run, (f42-56) which in this case it was, (f60-93) and it's just like
// (f97-112) extremely well received (f112-135) right off the bat. (f135-154)"
//
// ONE SENTENCE OF MOTION: two lines draw left to right on ONE day clock from the
// Muse tile at launch day — close together for a week, then the amber Muse line
// kinks up at day 9-10 and leaves ChatGPT's own first 22 days behind, its tile
// riding the head and "x.xM" counting beside it in clean steps (from f62) — while the camera follows the
// head and eases out until the whole chart is in frame; the count lands on 5.1M
// as the line ends (f106), one light sweep runs up the line, and the names,
// ChatGPT's 2.3M and the caption are in by ~f106. f118-179 is a living hold (camera creep, pool drift, sway, grain).
//
// DURATION: the slot is 6.799 s x 23.976 = 163 frames, + a 16-frame tail = 179.
//
// DATA: cumulative US downloads by day since launch, Sensor Tower estimates as
// published by 9to5Mac on 2026-09-30; the points below were traced off that
// chart by the director (millions) and are joined by a monotone cubic. Muse
// 5.12M and ChatGPT 2.27M at day 22 (the chart's own end labels: 5.1mn, 2.3mn).
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 179;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the data ----------------------------------------------------------------------------------
const MUSE: [number, number][] = [
  [1, 0.02], [4, 0.4], [7, 0.87], [9, 1.22], [10, 1.52], [11, 1.83], [13, 2.47], [14, 2.75], [16, 3.3], [19, 4.27], [20, 4.55], [22, 5.12],
];
const CHATGPT: [number, number][] = [
  [1, 0.1], [3, 0.42], [4, 0.55], [5, 0.65], [7, 0.83], [9, 1.0], [10, 1.09], [11, 1.25], [12, 1.36], [13, 1.45], [14, 1.57], [16, 1.75],
  [18, 1.94], [19, 2.02], [22, 2.27],
];
const DAY_0 = 1;
const DAY_1 = 22;
const MUSE_END = 5.12;

/** A monotone cubic (Fritsch-Carlson) through the traced points: smooth, never overshoots. */
const monotone = (pts: [number, number][]) => {
  const n = pts.length;
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(pts[i + 1][0] - pts[i][0]);
    d.push((pts[i + 1][1] - pts[i][1]) / h[i]);
  }
  const m: number[] = [d[0]];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    const xx = Math.max(pts[0][0], Math.min(pts[n - 1][0], x));
    let i = 0;
    while (i < n - 2 && xx > pts[i + 1][0]) i++;
    const t = (xx - pts[i][0]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * pts[i][1] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * pts[i + 1][1] + (t3 - t2) * h[i] * m[i + 1]
    );
  };
};
const museAt = monotone(MUSE);
const chatAt = monotone(CHATGPT);

// --- the chart in the world (world px = screen px at the settled camera) ------------------------
const X0 = 100; // day 1
const X1 = 968; // day 22: the chart is 868 wide (the tile at the head keeps 64 px from the frame edge)
const BASE = 1340; // zero downloads: the day axis, under the caption strip (y 1080-1250)
const PX_PER_M = 205; // 5.12M -> 1050 px tall: the Muse line ends at y 290
const dayX = (d: number) => X0 + ((d - DAY_0) / (DAY_1 - DAY_0)) * (X1 - X0);
const valY = (v: number) => BASE - v * PX_PER_M;
const W_MUSE = 14; // ribbon widths, world px
const W_CHAT = 10;
const TILE = GEO.TILE;

// --- the clock ---------------------------------------------------------------------------------
const T0 = 2; // the lines start drawing
const T1 = 106; // day 22: both lines end, the count lands
/** The day clock (frame -> day), a monotone cubic: under way at once (the heads clear the tile by f6), a steady week,
 *  the day 9-10 take-off in f45-50 ("home run"), a little faster up the climb, eased onto day 22. */
const CLOCK: [number, number][] = [
  [T0, 1], [4, 1.45], [8, 2.4], [20, 4.9], [30, 6.6], [44, 8.9], [52, 10.4], [80, 17.2], [98, 21.2], [103, 21.78], [T1, 22],
];
const clockAt = monotone(CLOCK);
/** The day the heads have reached at frame f (one clock for both lines). */
const dayAt = (f: number) => (f <= T0 ? DAY_0 : f >= T1 ? DAY_1 : clockAt(f));
const headAt = (f: number) => {
  const d = dayAt(f);
  return { d, x: dayX(d), y: valY(museAt(d)) };
};
/** The count in tenths of a million (an odometer step = 0.1M); 51 exactly on landing. */
const countAt = (f: number) => (f >= T1 ? 51 : (51 * museAt(dayAt(f))) / MUSE_END);
const COUNT_IN = 62; // the count blurs in beside the head
/** Söhne Dreiviertelfett advances (em) of the count's glyphs (stoutShared's table). */
const ADV: Record<string, number> = { "0": 0.646, "1": 0.409, "2": 0.584, "3": 0.586, "4": 0.619, "5": 0.586, "6": 0.603, "7": 0.57, "8": 0.609, "9": 0.603, ".": 0.254, M: 0.868 };
const TRACK_NUM = -0.015;
/**
 * The count while it runs: "u.tM" STEPPED cleanly (whole digits on every frame, no half-rolled or
 * blurred glyphs), each glyph centred in its own slot, right edge at `right`. A digit's slot eases from
 * its own advance to the next digit's as the value approaches the step, so the spacing never jumps and
 * the string lands exactly on the proportional "5.1M".
 */
const countSlots = (v: number, right: number, fs: number) => {
  const n = Math.min(50, Math.floor(v));
  const t = n % 10;
  const u = Math.floor(n / 10);
  const fracT = clamp01(v - n);
  const wT = lerp(ADV[`${t}`], ADV[`${(t + 1) % 10}`], fracT);
  const wU = lerp(ADV[`${u}`], ADV[`${u + 1}`], t === 9 ? fracT : 0);
  const glyphs = [
    { key: "M", ch: "M", w: ADV.M },
    { key: "t", ch: `${t}`, w: wT },
    { key: "dot", ch: ".", w: ADV["."] },
    { key: "u", ch: `${u}`, w: wU },
  ];
  let x = right;
  return glyphs.map((g) => {
    const cx = x - (g.w * fs) / 2;
    x -= (g.w + TRACK_NUM) * fs;
    return { key: g.key, ch: g.ch, x: cx };
  });
};

// --- the camera --------------------------------------------------------------------------------
// It follows the Muse head (a 12-frame running mean of it, so it trails rather than tracks) and eases
// out: the head's place in the frame travels from lower-left-of-centre (close on the origin, k 2.1) to
// its settled place (k 1: the world is the screen), then a slow creep keeps the hold alive.
const CAM_LAG = 12;
const K_OPEN = 2.1;
const OPEN_AT = { x: 340, y: 1130 };
const HOLD_K = 0.014;
const camAt = (f: number): Cam => {
  let hx = 0;
  let hy = 0;
  for (let i = 0; i < CAM_LAG; i++) {
    const h = headAt(Math.max(0, f - i));
    hx += h.x / CAM_LAG;
    hy += h.y / CAM_LAG;
  }
  const p = smoothstep((f - 4) / (110 - 4));
  const creep = 1 + HOLD_K * Math.pow(clamp01((f - 96) / (DURATION - 96)), 1.6);
  const k = Math.exp(lerp(Math.log(K_OPEN), 0, p)) * creep;
  const end = headAt(T1);
  const c = camFor(hx, hy, lerp(OPEN_AT.x, end.x, p), lerp(OPEN_AT.y, end.y, p), k / creep);
  // the creep pushes in about a point between the two line ends (the gap), not the frame corner
  const ax = 600;
  const ay = 700;
  return { x: ax + (c.x - ax) / creep, y: ay + (c.y - ay) / creep, k };
};
const CAM_REST = camAt(0);

// --- geometry helpers --------------------------------------------------------------------------
const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
/** A ribbon (a filled path, round caps) along a series from day 1 to day d: its outline, its upper edge. */
const ribbon = (at: (d: number) => number, d1: number, w: number) => {
  if (d1 - DAY_0 < 0.02) return null;
  const ds: number[] = [];
  for (let d = DAY_0; d < d1 - 1e-6; d += 0.125) ds.push(d);
  ds.push(d1);
  const r = w / 2;
  const up: string[] = [];
  const dn: string[] = [];
  ds.forEach((d) => {
    const e = 0.02;
    const a = Math.max(DAY_0, d - e);
    const b = Math.min(DAY_1, d + e);
    const tx = dayX(b) - dayX(a);
    const ty = valY(at(b)) - valY(at(a));
    const l = Math.hypot(tx, ty) || 1;
    const nx = ty / l; // the upper normal (screen y runs down)
    const ny = -tx / l;
    const x = dayX(d);
    const y = valY(at(d));
    up.push(`${n2(x + nx * r)} ${n2(y + ny * r)}`);
    dn.push(`${n2(x - nx * r)} ${n2(y - ny * r)}`);
  });
  const last = ds.length - 1;
  const outline =
    `M${up.join("L")}A${n2(r)} ${n2(r)} 0 0 1 ${dn[last]}L${dn.slice(0, last).reverse().join("L")}A${n2(r)} ${n2(r)} 0 0 1 ${up[0]}Z`;
  return { outline, upper: `M${up.join("L")}` };
};

// --- the Muse mark -----------------------------------------------------------------------------
// The app's scribble "M", redrawn as ONE brush stroke (round caps and joins) off the icon
// (public/cheekypint2/muse/muse_icon_9to5mac_crop.png, 760 px units): in from the left, up to the
// first peak, three down-strokes and an up-flick out to the right. Knocked out of a cream tile to the
// ground, sized by the family's optical rule (opticalFit).
const MUSE_M =
  "M126 322C162 282 204 222 230 192C250 170 264 186 256 224C244 300 206 400 203 462C202 494 224 498 240 472" +
  "C284 400 344 272 378 224C396 198 414 210 408 246C394 322 368 410 368 468C368 498 392 502 408 476" +
  "C444 412 490 322 520 282C540 256 558 268 552 302C542 362 518 430 520 478C521 508 546 510 562 488" +
  "C590 446 618 408 640 386";
const M_STROKE = 62;
const M_BOX = { x: 95, y: 150, w: 576, h: 382, fill: 0.52, cy: 0 };
const MuseMark: React.FC<{ size: number }> = ({ size }) => {
  const fit = opticalFit(M_BOX.w, M_BOX.h, M_BOX.fill, M_BOX.cy, size);
  const ox = fit.cx - (M_BOX.x + M_BOX.w / 2) * fit.sc;
  const oy = fit.cy - (M_BOX.y + M_BOX.h / 2) * fit.sc;
  return (
    <g transform={`translate(${ox.toFixed(4)} ${oy.toFixed(4)}) scale(${fit.sc.toFixed(6)})`}>
      <path d={MUSE_M} fill="none" stroke="#000" strokeWidth={M_STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

const TICKS = [1, 4, 7, 10, 13, 16, 19, 22];
const NAME_PX = 44; // the two line names (read at phone width)
const enterAt = (f: number, a: number, len = 12) => clamp01((f - a) / len);

const MuseHomeRun: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const k = cam.k;
  const head = headAt(frame);
  const band = amberBandFor(cam);

  const muse = ribbon(museAt, head.d, W_MUSE);
  const chat = ribbon(chatAt, head.d, W_CHAT);
  const tileX = head.x - TILE / 2;
  const tileY = head.y - TILE / 2;
  const tileD = rectPath(tileX, tileY, TILE, TILE, GEO.RADIUS);
  // anything that travels lifts one level and settles on landing
  const lift = smoothstep((frame - T0) / 10) * (1 - smoothstep((frame - (T1 - 8)) / 12));

  const sil: Silhouette = [{ d: tileD }];
  if (muse) sil.push({ d: muse.outline });
  if (chat) sil.push({ d: chat.outline });

  // the count rides the head: its right edge a clearance left of the tile, its top level with the tile's
  const count = countAt(frame);
  const numX = head.x - TILE / 2 - 72 / k;
  const numY = head.y - TILE / 2 + (TYPE.SECONDARY * METRIC.fig) / k;
  const museLabelY = numY + (SPACE.LOCKUP + NAME_PX * METRIC.cap) / k;

  // ChatGPT's end: the lockup above its line's end
  const chatEnd = { x: X1, y: valY(chatAt(DAY_1)) };
  const chatLabelY = chatEnd.y - 40 / k;
  const chatNumY = chatLabelY - (NAME_PX * METRIC.cap + SPACE.LOCKUP) / k;

  const tickLen = 10 / k;
  const axisLabelY = BASE + (10 + SPACE.AXIS + TYPE.LABEL * METRIC.cap) / k;
  const poolDrift = { x: 40 * Math.sin(frame / 37), y: 30 * Math.sin(frame / 29 + 1) };
  const sweepT = (frame - T1) / 12;

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.ground }}>
      <StoutStage S={frame} cam={cam} rest={CAM_REST} pool={{ x: cam.x + poolDrift.x - 60 / k, y: cam.y + poolDrift.y - 160 / k }}>
        <defs>
          <AmberGradient id="mhrAmber" y0={band[0]} y1={band[1]} />
          <linearGradient id="mhrBoard" gradientUnits="userSpaceOnUse" x1="0" y1={valY(2.4)} x2="0" y2={BASE}>
            <stop offset="0" stopColor={COLOR.board} />
            <stop offset="1" stopColor={COLOR.boardFoot} />
          </linearGradient>
          <linearGradient id="mhrCream" gradientUnits="userSpaceOnUse" x1="0" y1={tileY} x2="0" y2={tileY + TILE}>
            <stop offset="0" stopColor={COLOR.cream} />
            <stop offset="1" stopColor={COLOR.creamFoot} />
          </linearGradient>
          {/* the tile, its mark knocked out */}
          <mask id="mhrKnock" maskUnits="userSpaceOnUse" x={tileX} y={tileY} width={TILE} height={TILE}>
            <rect x={tileX} y={tileY} width={TILE} height={TILE} fill="#fff" />
            <g transform={`translate(${tileX.toFixed(4)} ${tileY.toFixed(4)})`}>
              <MuseMark size={TILE} />
            </g>
          </mask>
          {/* the lines stop at the tile's edge: they come out of it, and never show through its mark */}
          <mask id="mhrOut" maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={6000} height={6000}>
            <rect x={-2000} y={-2000} width={6000} height={6000} fill="#fff" />
            <path d={tileD} fill="#000" />
          </mask>
          {muse ? (
            <clipPath id="mhrLine">
              <path d={muse.outline} />
            </clipPath>
          ) : null}
        </defs>

        {/* the day axis (never showing through the tile's mark) */}
        <g mask="url(#mhrOut)">
          <Rule x0={X0} x1={X1} y={BASE} k={k} />
          <g stroke={COLOR.rule} strokeWidth={STROKE.RULE / k}>
            {TICKS.map((d) => (
              <line key={d} x1={dayX(d)} x2={dayX(d)} y1={BASE} y2={BASE + tickLen} />
            ))}
          </g>
        </g>

        {/* ONE shadow: the two lines and the tile are one built chart under one light */}
        <ElevationShadow silhouette={sil} elevation="rest" lift={lift * 0.6} />

        {/* ChatGPT's own first 22 days: context, the board tone */}
        {chat ? (
          <g mask="url(#mhrOut)">
            <path d={chat.outline} fill="url(#mhrBoard)" />
          </g>
        ) : null}

        {/* Muse: amber, the one glow */}
        {muse ? (
          <>
            <g style={{ filter: bloomFilter(k) }}>
              <g mask="url(#mhrOut)">
                <path d={muse.outline} fill="url(#mhrAmber)" />
              </g>
            </g>
            <g mask="url(#mhrOut)">
              <path d={muse.upper} fill="none" stroke={COLOR.amberHot} strokeWidth={EDGE.HOT / k} strokeLinecap="round" strokeLinejoin="round" />
              <g clipPath="url(#mhrLine)">
                <LightSweep x={X0 - 20} y={valY(MUSE_END) - 20} w={X1 - X0 + 40} h={BASE - valY(MUSE_END) + 40} k={k} t={sweepT} on="amber" r={0} />
              </g>
            </g>
          </>
        ) : null}

        {/* the Muse tile rides the head */}
        <path d={tileD} fill="url(#mhrCream)" mask="url(#mhrKnock)" />
        <path
          d={`M${n2(tileX + GEO.RADIUS)} ${n2(tileY + EDGE.CREAM / k / 2)}H${n2(tileX + TILE - GEO.RADIUS)}`}
          stroke={COLOR.edge}
          strokeOpacity={ALPHA.edge}
          strokeWidth={EDGE.CREAM / k}
        />

        {/* the count: rolls with the line, lands on 5.1M as it ends */}
        {frame >= T1 ? (
          <Numeral x={numX} y={numY} k={k} px={TYPE.SECONDARY} text="5.1M" tone="amber" anchor="end" glow />
        ) : frame >= COUNT_IN ? (
          countSlots(count, numX, TYPE.SECONDARY / k).map((c) => (
            <Numeral key={c.key} x={c.x} y={numY} k={k} px={TYPE.SECONDARY} text={c.ch} tone="amber" anchor="middle" enter={enterAt(frame, COUNT_IN)} glow />
          ))
        ) : null}
        <Label x={numX} y={museLabelY} k={k} px={NAME_PX} text="Muse" tone="cream" anchor="end" enter={enterAt(frame, COUNT_IN + 2)} />

        {/* ChatGPT's end */}
        <Numeral x={chatEnd.x} y={chatNumY} k={k} px={TYPE.TAG} text="2.3M" tone="creamLo" anchor="end" enter={enterAt(frame, 90)} />
        <Label x={chatEnd.x} y={chatLabelY} k={k} px={NAME_PX} text="ChatGPT" tone="creamLo" anchor="end" enter={enterAt(frame, 92)} />

        {/* the axis and what the chart is */}
        <Label x={dayX(1)} y={axisLabelY} k={k} text="Day 1" tone="creamLo" anchor="middle" enter={enterAt(frame, 94)} />
        <Label x={dayX(22)} y={axisLabelY} k={k} text="Day 22" tone="creamLo" anchor="middle" enter={enterAt(frame, 102)} />
        <Label x={540} y={1490} k={k} px={36} text="US downloads · first 22 days" tone="creamLo" anchor="middle" enter={enterAt(frame, 90)} />
        <Label x={540} y={1538} k={k} px={28} text="Sensor Tower est." tone="creamLo" anchor="middle" enter={enterAt(frame, 94)} />
      </StoutStage>
    </AbsoluteFill>
  );
};

export default MuseHomeRun;
