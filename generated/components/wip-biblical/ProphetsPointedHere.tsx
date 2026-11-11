// ---------------------------------------------------------------------------
// ProphetsPointedHere (wip-biblical, cut 86). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 117 frames.
//
// CHECK LINE: "Prophets across the centuries were all pointing at the same event, the singularity." With no sound: one red
// point, then a row of Doré prophets along the century rule, every one of them looking and pointing up at it.
//
// THE LINE: "If so, the singularity could be the event that the, the great prophets have predicted for centuries."
// WORD -> FRAME: If 0 · so 2 · the 12 · singularity 16 · could 35 · be 39 · the 43 · event 47 · that 52 · the 60 · the 67 ·
// great 69 · prophets 71 · have 81 · predicted 86 · for 91 · centuries 97 · (next sentence "We" 112; cut to speaker at f117)
// (Whisper onsets, may run 2-6 frames early)
// DURATION: the slot 86.417 -> 91.292 s = 4.875 s x 24 = 117 frames (f0..f116).
//
// THE MOTION: one camera pull-back and descent about the red point. f0: close (k 2.6) on the point alone near the top of the
// band, a slow creep back through "the singularity"; from f20 the camera eases back and down, zooming about the point
// (it holds screen y ~144-150 throughout), so the century rule and the ground strip come up under it; settled k 1 by
// about f60, then a slow creep in to the cut. As the view opens, five Doré prophets are slid up from behind the ground
// strip, left to right every 5 frames (22-frame slides on paper's ease, landing f51, 56, 61, 66, 71 = "great prophets"),
// each standing on his own century tick. f79-95 ("have predicted for centuries"): from Ezekiel's and Jeremiah's raised
// fingertips and John's upturned eyes a fine dotted red line draws up to the point, all three arriving together on f95.
// Daniel and Amos (heads bowed) stand at the ends with no line: a line up from a bowed head is unmotivated, and the two
// long outer diagonals made a roof/tent over the row (director, review 1). Settled, living frame to f116.
// Settled frame (screen px): point (540, 147), 27 px across; row x 89-982, heads y 360-400, feet on the rule y 742,
// strip edge y 772; lines from Ezekiel's fingertip (518, 345), John's eyes (527, 414) and Jeremiah's hand (590, 348),
// each starting just clear of his own outline: a narrow convergence of three.
// Contact frames: none. The prints slide paper on paper; each line's tip reaches the dot's edge on f95 and stops there.
// SPOT INK: red = the singularity point and the three lines that join the up-looking prophets to it (the clip's bond). Indigo = the
// printed century rule (cut 0's).
//
// SOURCES: the prophets are cut 0's prints (prophetShared.tsx; Gustave Doré, La Sainte Bible, Tours: Mame, 1866, t. 2, BnF
// copy via Internet Archive bnf-bpt6k10443187, public domain): Daniel (p0076, head bowed: an end of the row, no line;
// his scroll carries lettering, never mirrored), Ezekiel prophesying (p0064, pointing up), Saint John on Patmos (p0654,
// gazing up), Jeremiah (p0040, arm flung up; mirrored, no lettering), Amos (p0124, head bowed: the other end,
// mirrored, no line). Isaiah and Baruch were not used: both look down (kneeling, reclining), no better than
// Daniel and Amos. Eye points measured on the baked PNGs here; the hands are prophetShared's landmarks.
// The rule: 28 indigo century ticks (Amos, c. 760 BC, to today is about 28 centuries); no dates on screen, and the row
// is not in date order (the ticks only say "centuries apart").
// The ground strip: the kit's own paper scan (wip-anthropic/paper_mint.jpg) as a second sheet, hand-cut top edge.
// ---------------------------------------------------------------------------
import React from "react";
import { Img, random, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CaptionBandsDebug,
  InkPrint,
  PAPER_D,
  PAPER_H,
  PAPER_W,
  PaperGround,
  RED,
  WipFilmLife,
  WipPlane,
  depthScale,
  depthTransform,
  paperEase,
  runWipCamera,
  slide,
  type WipCam,
} from "../kits/works-in-progress/wipShared";
import { InkLines } from "./globeShared";
import { CenturyRule, PROPHETS, ProphetCutOut, centuryTickX, type Facing } from "./prophetShared";

export const FPS = 24;
export const DURATION = 117;
export const schema = z.object({ bands: z.boolean(), mask: z.boolean(), lines: z.enum(["solid", "dotted", "none"]) });
export const defaultProps = schema.parse({ bands: false, mask: false, lines: "dotted" });

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// -- the camera -------------------------------------------------------------------------------------------------------
// Layout below is in SETTLED screen px: the camera reaches k 1 centred on world (540, 960), where world px = screen px on
// the d = 1 planes (the prophets, the rule, the red lines). It opens pushed in 3x on the red point near the top of the band,
// creeping back; from "could be the event" it eases back and down (the point stays near the top while the rule and the row
// come up under it), lands about f80, then creeps in to the cut.
const K_OPEN = 2.6;
const K_CREEP = K_OPEN * 0.95;
/** a d = 1 camera key that holds world (wx, wy) at screen (sx, sy) at zoom k */
const key = (f: number, wx: number, wy: number, sx: number, sy: number, k: number, ease?: "inout" | "linear") => ({
  f,
  x: wx - (sx - 540) / k,
  y: wy - (sy - 960) / k,
  k,
  ease,
});
// The pull-back zooms about the point (world (540, 150) held at screen (540, 150)): a key every 4 frames on one eased
// log-zoom curve from K_CREEP (f20) to 1 (f72), so the point holds its place instead of bowing up and back.
const PULL_F0 = 16;
const PULL_F1 = 56;
const pullKeys = Array.from({ length: (PULL_F1 - PULL_F0) / 4 }, (_, j) => {
  const f = PULL_F0 + 4 * (j + 1);
  const u = (f - PULL_F0) / (PULL_F1 - PULL_F0);
  const e = u * u * (3 - 2 * u);
  return key(f, 540, 150, 540, 150, K_CREEP * (1 / K_CREEP) ** e, "linear");
});
const camAt = runWipCamera(
  [
    key(-24, 540, 150, 540, 150, K_OPEN),
    key(PULL_F0, 540, 150, 540, 150, K_CREEP, "linear"),
    ...pullKeys,
    key(DURATION + 30, 540, 445, 540, 445, 1.045, "linear"),
  ],
  DURATION,
);

// -- the singularity point --------------------------------------------------------------------------------------------
// A solid red-ink dot, rough ink edge, multiplied into the paper; no glow, no pulse. It is printed in the sheet itself
// (the paper's own depth, PAPER_D), so it shrinks less than the row as the camera pulls back: 48 px on f0, ~26 settled.
const POINT_D = PAPER_D;
const DOT_R = 24; // local radius: the dot's screen radius on f0
const DOT_PAD = 10;
/**
 * The singularity point: a red-ink dot of radius DOT_R (scaled by `scale`) centred on (x, y) in its parent's px. Put it on
 * an `ink` WipPlane. It scales as one piece, so its ink edge never boils under a zoom.
 */
export const SingularityPoint: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => {
  const s = DOT_R * 2 + DOT_PAD * 2;
  return (
    <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, transformOrigin: "50% 50%", transform: `scale(${scale})` }}>
      <InkPrint x={0} y={0} w={s} h={s} ink={RED} seed="singularity" rough={2} wear={0.12} misregister={1.1}>
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={s / 2} cy={s / 2} r={DOT_R} fill="currentColor" />
        </svg>
      </InkPrint>
    </div>
  );
};

// The point's place on its plane: the inverse of screen (540, 150) on f0's camera.
const CAM0 = camAt(0);
const T0 = depthTransform(CAM0, POINT_D);
const POINT = { x: (540 - T0.tx) / T0.k, y: (150 - T0.ty) / T0.k };
/** world scale of the dot so it is exactly DOT_R on screen on f0 */
const DOT_SCALE = 1 / T0.k;
/**
 * For cut 73, which ends on this point: its screen centre, radius and look on this cut's f0. Render `<SingularityPoint>`
 * on an ink plane so that it lands at (x, y) on screen with `scale` = 1 / (that plane's screen scale).
 */
export const SINGULARITY_POINT = {
  x: 540,
  y: 150,
  r: DOT_R,
  ink: RED,
  look: "solid red ink dot, InkPrint rough 2 wear 0.12 misregister 1.1 seed 'singularity', multiply, no glow",
} as const;

const pointOnScreen = (cam: WipCam) => {
  const t = depthTransform(cam, POINT_D);
  return { ...t.toScreen(POINT.x, POINT.y), r: DOT_R * DOT_SCALE * t.k };
};

// -- the century rule (cut 0's look: weight and ticks at its settled screen size) --------------------------------------
const RULE_X0 = 106;
const RULE_X1 = 990;
const RULE_Y = 742;
const RULE_N = 28;
const tickX = (i: number) => centuryTickX(RULE_X0, RULE_X1, i, RULE_N);

// -- the ground strip: a second sheet of the same paper laid over the page just under the rule, its top edge hand-cut. The
// prophets are slid up from behind it (a short paper slide instead of a climb from the frame's bottom edge). Below y 772
// (settled) it lies behind the presenter; only its edge and its soft contact shadow show beside her.
const STRIP_Y = 772;
const STRIP_X0 = -900;
const STRIP_X1 = 1980;
const STRIP_BOTTOM = 2600;
const STRIP_EDGE = (() => {
  const pts: string[] = [];
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const x = STRIP_X0 + ((STRIP_X1 - STRIP_X0) * i) / n;
    const y = STRIP_Y + (random(`strip-${i}`) - 0.5) * 2.2 + Math.sin(i * 0.37) * 0.8;
    pts.push(`${(x - STRIP_X0).toFixed(1)}px ${(y - STRIP_Y + 8).toFixed(1)}px`);
  }
  return `polygon(${pts.join(", ")}, ${STRIP_X1 - STRIP_X0}px ${STRIP_BOTTOM - STRIP_Y}px, 0px ${STRIP_BOTTOM - STRIP_Y}px)`;
})();
const GroundStrip: React.FC = () => (
  <div style={{ position: "absolute", left: STRIP_X0, top: STRIP_Y - 8, width: STRIP_X1 - STRIP_X0, height: STRIP_BOTTOM - STRIP_Y + 8, filter: "drop-shadow(0px -1px 1.6px rgba(14,31,26,0.32)) drop-shadow(0px -3px 7px rgba(14,31,26,0.14))" }}>
    <div style={{ position: "absolute", inset: 0, clipPath: STRIP_EDGE, overflow: "hidden" }}>
      <Img
        src={staticFile("wip-anthropic/paper_mint.jpg")}
        style={{ position: "absolute", left: 0, top: -900, width: PAPER_W * 1.4, height: PAPER_H * 1.4, maxWidth: "none", transform: "scaleX(-1)" }}
      />
    </div>
  </div>
);

// -- the row ----------------------------------------------------------------------------------------------------------
// Five different Doré plates, left to right on an even rhythm, each standing on its own century tick. The two with bowed
// heads (Daniel, Amos) stand at the ends, turned in, with no line. Ezekiel and Jeremiah point up (their line leaves the
// raised fingertip), John gazes up (his eyes).
type Seat = {
  name: string;
  facing: Facing;
  /** print height, world px */
  h: number;
  /** where the body's mass should stand (settled x) and that point as an unmirrored PNG fraction */
  bodyX: number;
  body: number;
  /** which point of the print stands on a tick (unmirrored PNG fraction); default the prophet's feet */
  stand?: number;
  /** where his line leaves him (unmirrored PNG fraction) */
  aim: [number, number];
  /** whether he gets a red line: only the three who point or gaze up (a bowed head has nothing to send up) */
  line: boolean;
  /** the line starts this far (world px) from `aim` toward the point: just clear of his own outline */
  gap: number;
  /** landing frame of his slide */
  land: number;
};
const RISE = 22;
const SEATS: Seat[] = [
  { name: "daniel", facing: "right", h: 400, bodyX: 222, body: 0.56, aim: [0.69, 0.1], line: false, gap: 28, land: 51 },
  { name: "ezekiel", facing: "right", h: 430, bodyX: 368, body: 0.4, aim: PROPHETS.ezekiel.hand, line: true, gap: 12, land: 56 },
  { name: "john", facing: "left", h: 370, bodyX: 540, body: 0.56, stand: 0.42, aim: [0.551, 0.08], line: true, gap: 27, land: 61 },
  { name: "jeremiah", facing: "left", h: 430, bodyX: 712, body: 0.45, aim: PROPHETS.jeremiah.hand, line: true, gap: 12, land: 66 },
  { name: "amos", facing: "left", h: 400, bodyX: 878, body: 0.45, aim: [0.61, 0.11], line: false, gap: 31, land: 71 },
];

const placed = SEATS.map((s) => {
  const a = PROPHETS[s.name];
  const w = s.h * a.aspect;
  const flip = s.facing !== a.facing;
  const fx = (f: number) => (flip ? 1 - f : f);
  // snap the standing point to the nearest century tick
  const want = s.bodyX + (fx(s.stand ?? a.feet[0]) - fx(s.body)) * w;
  const tick = Math.round(((want - RULE_X0) / (RULE_X1 - RULE_X0)) * RULE_N);
  const standX = tickX(tick);
  const left = standX - fx(s.stand ?? a.feet[0]) * w;
  const centreX = left + w / 2;
  const top = RULE_Y - a.feet[1] * s.h;
  const aim = { x: left + fx(s.aim[0]) * w, y: top + s.aim[1] * s.h };
  // the slide: up from behind the ground strip; on its first frame the print (paper border included) lies wholly behind it
  const start = s.land - RISE;
  const border = (7 * s.h) / 600;
  const footStart = STRIP_Y + 4 + border + a.feet[1] * s.h;
  return { ...s, a, w, flip, tick, left, top, centreX, aim, start, footStart };
});
/** print order: John lies under his neighbours, the ends on top */
const PRINT_ORDER = ["john", "ezekiel", "jeremiah", "daniel", "amos"].map((n) => placed.findIndex((p) => p.name === n));

// -- the red lines: from the three raised hands and upturned eyes up to the point, drawn together, arriving by "centuries" -----------------
const LINE_START = 79;
const LINE_END = 95;
const LINE_W = 3;
const LINE_END_GAP = 0; // how far short of the dot's edge the lines stop

const ProphetsPointedHere: React.FC<z.infer<typeof schema>> = ({ bands, mask, lines }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const pt = pointOnScreen(cam);
  const t1 = depthTransform(cam, 1);
  // the point in d = 1 world px, where the lines live
  const pw = { x: (pt.x - t1.tx) / t1.k, y: (pt.y - t1.ty) / t1.k, r: pt.r / t1.k };
  const draw = paperEase(clamp01((frame - LINE_START) / (LINE_END - LINE_START)));
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        <WipPlane cam={cam} ink>
          <CenturyRule x0={RULE_X0} x1={RULE_X1} y={RULE_Y} n={RULE_N} weight={4.2} tick={14} />
        </WipPlane>
        <WipPlane cam={cam} d={POINT_D} ink>
          <SingularityPoint x={POINT.x} y={POINT.y} scale={DOT_SCALE} />
        </WipPlane>
        <WipPlane cam={cam}>
          {PRINT_ORDER.map((i) => {
            const p = placed[i];
            if (frame < p.start) return null;
            const along = slide(frame, p.start, RISE);
            const foot = p.footStart + (RULE_Y - p.footStart) * along;
            return <ProphetCutOut key={p.name} name={p.name} x={p.centreX} footY={foot} height={p.h} facing={p.facing} lift={(1 - along) * 0.3} />;
          })}
          <GroundStrip />
        </WipPlane>
        {draw > 0 && lines !== "none" ? (
          <WipPlane cam={cam} ink>
            <InkLines x={0} y={0} w={1080} h={960} ink={RED} seed="prophet-lines" rough={0.8}>
              {placed.filter((p) => p.line).map((p) => {
                const dx = pw.x - p.aim.x;
                const dy = pw.y - p.aim.y;
                const len = Math.hypot(dx, dy);
                const ux = dx / len;
                const uy = dy / len;
                const s0 = p.gap;
                const s1 = len - pw.r + 0.5 - LINE_END_GAP;
                const s = s0 + (s1 - s0) * draw;
                return (
                  <line
                    key={p.name}
                    x1={p.aim.x + ux * s0}
                    y1={p.aim.y + uy * s0}
                    x2={p.aim.x + ux * s}
                    y2={p.aim.y + uy * s}
                    stroke="currentColor"
                    strokeWidth={LINE_W}
                    strokeLinecap={lines === "dotted" ? "round" : "butt"}
                    strokeDasharray={lines === "dotted" ? `0.01 ${LINE_W * 3.2}` : undefined}
                  />
                );
              })}
            </InkLines>
          </WipPlane>
        ) : null}
      </WipFilmLife>
      <SpeakerMask on={mask} />
      <CaptionBandsDebug on={bands} />
    </>
  );
};

// -- preview aid: the presenter's rough silhouette, keyed over the plate in the finished video ---------------------------
const SpeakerMask: React.FC<{ on: boolean }> = ({ on }) =>
  on ? (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <path
        d="M540 790 C690 790 780 900 780 1040 C780 1170 730 1250 680 1300 L1000 1390 L1000 1920 L115 1920 L115 1390 L400 1300 C350 1250 300 1170 300 1040 C300 900 390 790 540 790 Z"
        fill="rgba(70,70,70,0.86)"
      />
    </svg>
  ) : null;

// exported for the preview checks only
export const __debug = { camAt, placed, pointOnScreen, POINT, depthScale };

export default ProphetsPointedHere;
