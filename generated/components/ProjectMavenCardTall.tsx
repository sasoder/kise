import React, { useEffect, useState } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import { z } from "zod";
import { loadFont as loadSourceSans3 } from "@remotion/google-fonts/SourceSans3";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import { squirclePath } from "./fieldShared";
import { FONT_SANS, FONT_SERIF, INK, INK_HI, INK_LO, Stage, camFromLook, camJerkAt, toScreen } from "./chinatalkShared";
import type { Cam, Pt } from "./chinatalkShared";
import { Bracket, DataFrame, MWetLine, TargetSeal, clamp01, easeOutCubic, evenEase, huntPath, lerp, smoothstep, textBlurPx, worldBlur } from "./mavenShared";

// ---------------------------------------------------------------------------
// ProjectMavenCardTall -- Bharat, "Project Maven's data problem" (ChinaTalk),
// cut N, the NEWS CARD re-authored for the 9:16 short. 1080x1920, 24 fps,
// opaque, 115 f, private entry. (The 16:9 ProjectMavenCard.tsx is untouched;
// clocks, hunt logic and state logic are copied from it.)
//
// LINE: "One of the most famous ones was Project Maven, started in 2016."
// IN = 126 (sequence frame), DURATION = 115 (exact slot, no tail).
// Local word frames: of 1 · most 5 · famous 9 · ones 16 · was 23 · Project 34 ·
// Maven 48 (to 67) · started 67 · in 74 · 2016 81 (to 102) · end 115.
//
// THE CARD (portrait, the format the client's cards normally have): one white
// sheet 900 x 1105 at (90..990, 240..1345) on the portrait rice-paper Stage.
// TOP 46 %: masthead row (ink dash, DOD NEWS, grey Jul 21, 2017) and the
// verbatim headline "Project Maven to Deploy Computer Algorithms to War Zone by
// Year's End" in Source Serif 4 Bold, 4 lines, real <text> (the speaker's
// "2016" is NOT on screen). BOTTOM 54 %: the PICTURE, edge to edge inside the
// card: one big mavenShared DataFrame (a drone video frame) plus this frame's
// own terrain (road, field, blocks), ONE solid RED TargetSeal on the road and
// the Bracket (the model's eye) hunting across it. Red = the relevant target,
// nothing else. Element types: sheet, type, ink underline, drone frame,
// seal + bracket.
//
// GESTURES (gesture -> word -> local frames) -- as approved in 16:9
// 1. The card lands (f0-12): already ~70 % in on frame 0; rises the last 46 px
//    while un-blurring (2.4 px -> 0) to full opacity (0.78 -> 1). Type blurs in
//    a few frames behind: masthead (lands f4), headline lines 4 f apart
//    (landing f7, 11, 15, 19).
// 2. The whole cut: ONE even push-in, k 1.00 -> 1.06 (linear in ln k), paper in
//    parallax; the feed drifts sideways 0.55 px/f inside the picture; the
//    Bracket hunts along one smooth path. -> "one of the most famous ones".
// 3. "Project Maven" (34 -> 67): an INK underline written in wet ink with its
//    bead, f27 -> f58 (tip under "Project" on f34); dries over 18 f and stays.
// 4. "started in 2016" (67 -> 102): from f60 the wander blends into ONE eased
//    glide onto the seal (lands f84) while the Bracket locks (f72-84); then it
//    rides the target as the feed keeps drifting.
// 5. To f115: the push and the drift continue; nothing leaves, no fade.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 115;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the article (verified; verbatim) ---------------------------------------------
const OUTLET = "DOD NEWS";
const DATE = "Jul 21, 2017";
const HEAD_LINES = ["Project Maven to", "Deploy Computer", "Algorithms to War", "Zone by Year’s End"];
const UNDERLINED = "Project Maven";

// --- type -------------------------------------------------------------------------
const SERIF = loadSourceSerif4("normal", { weights: ["700"], subsets: ["latin"] });
const SANS = loadSourceSans3("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const MAST_PX = 36;
const DATE_PX = 34;
const HEAD_MAX_PX = 80;
const HEAD_LH = 1.1;
const SERIF_CAP = 0.667;
const SANS_CAP = 0.669;

// --- the card (WORLD px; the world is the screen at k 1 with look (540, 835)) -----
const CARD = { x0: 90, y0: 240, w: 900, h: 1105 };
const PAD = 60;
const TEXT_X = CARD.x0 + PAD;
const TEXT_MAX_W = CARD.w - 2 * PAD;
const DASH_W = 40;
const DASH_H = 7;
const MAST_GAP = 48; // masthead caps bottom -> headline caps top
/** the picture: the bottom 54 % of the sheet, edge to edge */
const SPLIT_Y = CARD.y0 + 507;
const PANEL = { x0: CARD.x0, y0: SPLIT_Y, x1: CARD.x0 + CARD.w, y1: CARD.y0 + CARD.h };
const PCX = (PANEL.x0 + PANEL.x1) / 2;
const PCY = (PANEL.y0 + PANEL.y1) / 2;

// --- clocks -----------------------------------------------------------------------
const CARD_LAND_F = 12;
const CARD_RISE = 46;
const CARD_BLUR = 8; // the whole entrance; frame 0 is already 70 % through it
const MAST_S = -8;
const LINE_S = [-5, -1, 3, 7];
const TEXT_F = 12;
const UL_S0 = 27;
const UL_S1 = 58;
const UL_DRY_F = 18;
const FIND_S0 = 60;
const FIND_S1 = 84;
const LOCK_S0 = 72;
const LOCK_S1 = 84;

// --- the camera: one even push ------------------------------------------------------
const LOOK0 = { x: 540, y: 835, k: 1.0 };
const LOOK1 = { x: 540, y: 842, k: 1.06 };
const camAt = (S: number): Cam => {
  const u = S / (DURATION - 1);
  const k = Math.exp(lerp(Math.log(LOOK0.k), Math.log(LOOK1.k), u));
  return camFromLook(lerp(LOOK0.x, LOOK1.x, u), lerp(LOOK0.y, LOOK1.y, u), k);
};
const REST_CAM = camAt(DURATION - 1);

// --- the picture: a drone frame ------------------------------------------------------
const FRAME_W = 1040; // 4:3 -> 780 high: covers the 900 x 598 panel with slack for the drift
const FRAME_SEED = 4217;
const DRIFT_V = 0.55; // world px / frame, to the left
const driftX = (S: number) => 26 - DRIFT_V * S;
/** the road's centre line, frame coordinates (frame centre = 0, 0) */
const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const m = 1 - t;
  return {
    x: m * m * m * p0.x + 3 * m * m * t * p1.x + 3 * m * t * t * p2.x + t * t * t * p3.x,
    y: m * m * m * p0.y + 3 * m * m * t * p1.y + 3 * m * t * t * p2.y + t * t * t * p3.y,
  };
};
const ROAD_P: [Pt, Pt, Pt, Pt] = [
  { x: -560, y: 262 },
  { x: -250, y: 190 },
  { x: -60, y: -40 },
  { x: 560, y: -160 },
];
const ROAD_HALF = 11;
const roadSide = (sign: number) => {
  const pts: string[] = [];
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = bez(...ROAD_P, Math.max(0, t - 0.01));
    const b = bez(...ROAD_P, Math.min(1, t + 0.01));
    const p = bez(...ROAD_P, t);
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = (-(b.y - a.y) / d) * ROAD_HALF * sign;
    const ny = ((b.x - a.x) / d) * ROAD_HALF * sign;
    pts.push(`${i ? "L" : "M"}${(p.x + nx).toFixed(2)} ${(p.y + ny).toFixed(2)}`);
  }
  return pts.join("");
};
const ROAD_D = roadSide(1) + roadSide(-1);
/** the target sits ON the road */
const SEAL_T = 0.6;
const SEAL_AT = bez(...ROAD_P, SEAL_T);
const SEAL_SIDE = 70;
/** a field boundary (lower right) with one dividing furrow, and block outlines by the road */
const FIELD_D = "M70 70L352 26L404 262L104 318Z";
const FURROWS_D = Array.from({ length: 9 }, (_, i) => {
  const t = (i + 1) / 10;
  return `M${(70 + 282 * t).toFixed(1)} ${(70 - 44 * t).toFixed(1)}L${(104 + 300 * t).toFixed(1)} ${(318 - 56 * t).toFixed(1)}`;
}).join("");
const rotRect = (cx: number, cy: number, w: number, h: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return (
    [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ]
      .map(([x, y], i) => `${i ? "L" : "M"}${(cx + x * c - y * s).toFixed(2)} ${(cy + x * s + y * c).toFixed(2)}`)
      .join("") + "Z"
  );
};
const BLOCKS_D = [
  rotRect(-250, -122, 86, 54, -14),
  rotRect(-138, -168, 62, 46, -14),
  rotRect(-222, -214, 50, 40, -14),
  rotRect(-52, -224, 74, 44, -10),
  rotRect(-316, 54, 58, 44, -30),
].join("");

// --- the bracket's hunt -----------------------------------------------------------------
const BRACKET_SIZE = 204;
const HUNT_SEED = 33; // scanned: the seal never sits inside the hunting bracket (min centre distance 165 px before f60)
const HUNT_RATE = 0.6;
const HUNT_RX = 316;
const HUNT_RY = 168;
const HUNT_OFF = 270;
const huntAt = (S: number, seed = HUNT_SEED, off = HUNT_OFF): Pt => {
  const h = huntPath(seed, off + S * HUNT_RATE);
  return { x: PCX + h.x * HUNT_RX, y: PCY + h.y * HUNT_RY };
};
const sealWorld = (S: number): Pt => ({ x: PCX + driftX(S) + SEAL_AT.x, y: PCY + SEAL_AT.y });
const bracketAt = (S: number): Pt => {
  const e = smoothstep((S - FIND_S0) / (FIND_S1 - FIND_S0));
  const h = huntAt(S);
  const t = sealWorld(S);
  return { x: lerp(h.x, t.x, e), y: lerp(h.y, t.y, e) };
};

// --- measuring the real type (canvas, the loaded webfonts) ------------------------------------
type Metrics = { headPx: number; ulW: number; lineW: number[] };
const measure = (): Metrics => {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("ProjectMavenCardTall: no 2d context to measure the headline");
  const REF = 200;
  ctx.font = `700 ${REF}px ${FONT_SERIF}`;
  const per = (t: string) => ctx.measureText(t).width / REF;
  const widest = Math.max(...HEAD_LINES.map(per));
  const headPx = Math.min(HEAD_MAX_PX, Math.floor((TEXT_MAX_W / widest) * 2) / 2);
  return { headPx, ulW: per(UNDERLINED) * headPx, lineW: HEAD_LINES.map((l) => per(l) * headPx) };
};

/** A row of type doing the house entrance: slides up 24 screen px, fades, blurs in. */
const Row: React.FC<{ a: number; k: number; children: React.ReactNode }> = ({ a, k, children }) => {
  const op = smoothstep(a);
  if (op <= 0.002) return null;
  const lift = ((1 - easeOutCubic(a)) * 24) / k;
  return (
    <g opacity={op.toFixed(4)} transform={`translate(0 ${lift.toFixed(3)})`} style={{ filter: worldBlur(textBlurPx(a, 0), k) }}>
      {children}
    </g>
  );
};

/** The numbers the report quotes (also used by the layout). */
export const cardLayout = (m: Metrics) => {
  const mastCap = SANS_CAP * MAST_PX;
  const capH = SERIF_CAP * m.headPx;
  const lh = HEAD_LH * m.headPx;
  const blockH = mastCap + MAST_GAP + capH + 3 * lh + 0.2 * m.headPx;
  const top = CARD.y0 + (SPLIT_Y - CARD.y0 - blockH) / 2 + 3;
  const mastBase = top + mastCap;
  const base1 = mastBase + MAST_GAP + capH;
  return { mastCap, mastBase, base1, lh, ulY: base1 + 0.185 * m.headPx };
};

const ProjectMavenCardTall: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const S = frame;
  const [m, setM] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("ProjectMavenCardTall: measure the headline"));
  useEffect(() => {
    let live = true;
    Promise.all([SERIF.waitUntilDone(), SANS.waitUntilDone(), document.fonts.ready])
      .then(() => {
        if (!live) return;
        setM(measure());
        continueRender(handle);
      });
    return () => {
      live = false;
    };
  }, [handle]);

  const cam = camAt(S);
  const k = cam.k;
  if (!m) return <Stage S={S} cam={cam} rest={REST_CAM}>{null}</Stage>;
  const L = cardLayout(m);

  // 1. the sheet lands
  const ce = easeOutCubic(clamp01(S / CARD_LAND_F));
  const cardLift = (CARD_RISE * (1 - ce)) / k;
  const cardBlur = CARD_BLUR * 0.3 * (1 - ce);
  const cardOp = 0.78 + 0.22 * ce;

  // 3. the underline
  const ulU = evenEase((S - UL_S0) / (UL_S1 - UL_S0), 0.3);
  const ulWet = S < UL_S1 ? 1 : 1 - smoothstep((S - UL_S1) / UL_DRY_F);
  const ulBead = smoothstep((S - UL_S0) / 2) * (1 - smoothstep((S - (UL_S1 - 2)) / 9));
  const ulX0 = TEXT_X + 2;
  const ulLen = (m.ulW - 4) * ulU;

  // 2 + 4. the feed, the seal, the eye
  const dx = driftX(S);
  const b = bracketAt(S);
  const lock = clamp01((S - LOCK_S0) / (LOCK_S1 - LOCK_S0));
  const seal = sealWorld(S);
  const hair = 2.5 / k;
  const sheet = squirclePath(CARD.w, CARD.h);

  return (
    <Stage S={S} cam={cam} rest={REST_CAM}>
      <g opacity={cardOp.toFixed(4)} transform={`translate(0 ${cardLift.toFixed(3)})`} style={{ filter: worldBlur(cardBlur, k) }}>
        <defs>
          <clipPath id="pmct-sheet">
            <path d={sheet} transform={`translate(${CARD.x0} ${CARD.y0})`} />
          </clipPath>
          <clipPath id="pmct-panel">
            <rect x={PANEL.x0 - 2} y={PANEL.y0} width={PANEL.x1 - PANEL.x0 + 4} height={PANEL.y1 - PANEL.y0 + 2} />
          </clipPath>
        </defs>

        {/* the sheet, lifted off the rice paper */}
        <path
          d={sheet}
          transform={`translate(${CARD.x0} ${CARD.y0})`}
          fill="#FFFFFF"
          fillOpacity={0.92}
          style={{ filter: `drop-shadow(0 ${(14 / k).toFixed(3)}px ${(34 / k).toFixed(3)}px rgba(70,35,15,0.14))` }}
        />

        {/* the picture: one drone video frame, the target on the road, the model's eye */}
        <g clipPath="url(#pmct-sheet)">
          <g clipPath="url(#pmct-panel)">
            <rect x={PANEL.x0} y={PANEL.y0} width={PANEL.x1 - PANEL.x0} height={PANEL.y1 - PANEL.y0} fill={INK} fillOpacity={0.035} />
            <g transform={`translate(${dx.toFixed(3)} 0)`}>
              <DataFrame x={PCX} y={PCY} w={FRAME_W} k={k} seed={FRAME_SEED} target="none" strokePx={6} />
              <g transform={`translate(${PCX} ${PCY})`} fill="none" stroke={INK} strokeLinecap="round" strokeLinejoin="round" strokeWidth={hair.toFixed(3)}>
                <path d={FIELD_D} strokeOpacity={0.3} />
                <path d={FURROWS_D} strokeOpacity={0.13} />
                <path d={ROAD_D} strokeOpacity={0.34} />
                <path d={BLOCKS_D} strokeOpacity={0.36} fill={INK} fillOpacity={0.05} />
              </g>
            </g>
            <TargetSeal x={seal.x} y={seal.y} side={SEAL_SIDE} k={k} />
            <Bracket x={b.x} y={b.y} size={BRACKET_SIZE} k={k} S={S} lock={lock} lockSide={SEAL_SIDE * 1.9} sealSide={SEAL_SIDE} strokePx={5} />
          </g>
        </g>
        {/* the hairline ink edge, and the picture's own edge */}
        <path d={`M${PANEL.x0} ${PANEL.y0}L${PANEL.x1} ${PANEL.y0}`} stroke={INK} strokeOpacity={0.1} strokeWidth={(1.5 / k).toFixed(3)} />
        <path d={sheet} transform={`translate(${CARD.x0} ${CARD.y0})`} fill="none" stroke={INK} strokeOpacity={0.1} strokeWidth={(1.5 / k).toFixed(3)} />

        {/* masthead row */}
        <Row a={clamp01((S - MAST_S) / TEXT_F)} k={k}>
          <rect x={TEXT_X} y={L.mastBase - L.mastCap / 2 - DASH_H / 2} width={DASH_W} height={DASH_H} rx={1} fill={INK} fillOpacity={INK_HI} />
          <text x={TEXT_X + DASH_W + 20} y={L.mastBase} fontFamily={FONT_SANS} fontSize={MAST_PX} fontWeight={700} letterSpacing="0.12em" fill={INK} fillOpacity={INK_HI}>
            {OUTLET}
            <tspan dx={18} fontSize={DATE_PX} fontWeight={400} letterSpacing="0" fillOpacity={INK_LO / INK_HI}>
              {DATE}
            </tspan>
          </text>
        </Row>

        {/* headline, real text, one line per row */}
        {HEAD_LINES.map((line, i) => (
          <Row key={line} a={clamp01((S - LINE_S[i]) / TEXT_F)} k={k}>
            <text x={TEXT_X} y={L.base1 + i * L.lh} fontFamily={FONT_SERIF} fontSize={m.headPx} fontWeight={700} fill={INK} fillOpacity={INK_HI} style={{ fontKerning: "normal" }}>
              {line}
            </text>
          </Row>
        ))}

        {/* "Project Maven": the ink underline */}
        <MWetLine
          points={[
            { x: ulX0, y: L.ulY },
            { x: ulX0 + m.ulW - 4, y: L.ulY },
          ]}
          k={k}
          strokePx={6}
          len={ulLen}
          rung={INK_HI}
          wet={ulWet}
          bead={ulBead}
        />
      </g>
    </Stage>
  );
};

export default ProjectMavenCardTall;

// --- measured numbers for the report (bun out/bharat-maven/Nt/scan.ts) -----------------------
export const cardNumbers = () => {
  const jerk = camJerkAt(camAt, 0, DURATION - 1);
  const corners = (S: number) => {
    const c = camAt(S);
    const lift = (CARD_RISE * (1 - easeOutCubic(clamp01(S / CARD_LAND_F)))) / c.k;
    return { tl: toScreen(c, CARD.x0, CARD.y0 + lift), br: toScreen(c, CARD.x0 + CARD.w, CARD.y0 + CARD.h + lift) };
  };
  let maxBottom = 0;
  for (let S = 0; S < DURATION; S++) maxBottom = Math.max(maxBottom, corners(S).br.y + 5 * Math.sin(S / 19));
  let maxBracketV = 0;
  let atV = 0;
  for (let S = 1; S < DURATION; S++) {
    const a = bracketAt(S - 1);
    const b = bracketAt(S);
    const v = Math.hypot(b.x - a.x, b.y - a.y) * camAt(S).k;
    if (v > maxBracketV) {
      maxBracketV = v;
      atV = S;
    }
  }
  return { jerk, f0: corners(0), f12: corners(12), last: corners(DURATION - 1), maxBottom, maxBracketV, atV, k1: camAt(DURATION - 1).k };
};
/** hunt-path scan: min centre distance to the seal before the find, distance at f60, coverage */
export const huntScan = (seed: number, off: number) => {
  let min = Infinity;
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let S = 0; S < FIND_S0 + 4; S++) {
    const h = huntAt(S, seed, off);
    const t = sealWorld(S);
    min = Math.min(min, Math.hypot(h.x - t.x, h.y - t.y));
    x0 = Math.min(x0, h.x);
    x1 = Math.max(x1, h.x);
    y0 = Math.min(y0, h.y);
    y1 = Math.max(y1, h.y);
  }
  const h = huntAt(FIND_S0, seed, off);
  const t = sealWorld(FIND_S0);
  return { min, d60: Math.hypot(h.x - t.x, h.y - t.y), cov: ((x1 - x0) * (y1 - y0)) / (4 * HUNT_RX * HUNT_RY) };
};
