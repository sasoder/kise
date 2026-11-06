// ---------------------------------------------------------------------------
// SpendHalf (wip-entertainment, cut 13). Works in Progress style, the clip's messy variant (styles/works-in-progress.md;
// kit generated/components/kits/works-in-progress/wipShared.tsx; clip module ./messyShared.tsx; notes/COMMON.md).
// Opaque 1080x1920, 24 fps, 164 frames.
//
// CHECK LINE: "We spend about half what we spent on movies and music in 2000": with no sound, a real pile of CDs and
// cinema tickets has its top torn off along a red marker line, leaving half the pile beside a dashed ghost of the old one.
//
// THE LINE: "Thanks to streaming, piracy, and the pandemic, we now spend about half as much on movies and recorded music
// than we did around Y2K." (Whisper wrote "privacy"; it is piracy.)
// WORD -> FRAME (Whisper, from the composition start; it runs ~4 frames early): Thanks -2 · to 4 · streaming 9 · piracy 24 ·
// and 35 · the 40 · pandemic 42 · we 53 · now 58 · spend 63 · about 71 · half 76 · as 87 · much 92 · on 98 · movies 105 ·
// and 112 · recorded 116 · music 123 · than 131 · we 136 · did 139 · around 142 · Y2K 147 · (next line 162)
// DURATION: the slot 13.333 -> 20.167 s = 6.833 s x 24 = 164 frames (f0..f163).
//
// THE MOTION: one continuous motion, a pile cut in half. A tall messy pile of b&w cut-out CD cases, a DVD case and cinema
// tickets stands on the page with "2000" scrawled beside its top (written f2-f12). The red marker draws a cut line across
// the pile at 55 % of its height in three pushes, one per cause: streaming (stroke f5-f13), piracy (f20-f28), pandemic
// (f37-f46). From "now" the top tears away along the top of that line, from the left (it turns about the line's right end
// while the tear's front runs left to right, on twos, f56-f76), and on "half" it is pulled up and out of frame, gathering
// speed (f76-f96; its last sliver leaves on f88). It leaves a ragged torn edge with a thin white paper core. The marker
// traces a faint dashed ghost of where the top stood (f88-f110), the half pile relaxes a hair, and a marker "½" is written
// beside its new top on "recorded music" (f114-f123). Settled, living frame from f124 (grain, boil, the camera's creep in,
// k 1.00 -> 1.05 over the whole cut). Payoff frame: the dashed ghost + "2000" over the half pile + "½".
// Contact frames: nothing presses or lands. The tear's first opening frame f56 (the line is complete at f46); the top's
// first upward pull f76, gone f88; the half pile's settle f76-f84.
// THE TEAR: the pile is drawn once whole until f56, then as two clipped copies sharing one ragged edge (raggedLine) just
// over the marker line; under each copy's photos a white silhouette of the same prints shows a thin core band, opening
// only behind the tear's front. The marker line stays with the half that stays (the paper tore along its top edge).
// The half that goes is drawn over the ink plane: it is lifted off the page and passes over "2000" on its way out.
// LAYOUT (director, rev 2): ~1.3x larger; base spans screen x ~187-905, the part above the line stays left of ~735 so
// "½" fits beside the line's right end; "2000" sits above-left of the old top; lowest print edge (cut border included) y <= ~1072 at the closest camera.
// SPOT INK: red = the author's marker (the cut line, the ghost, "2000" and "½"). No other colour.
// NO OTHER YEAR (blind review): the Universal ticket lies across the Empire ticket's 1966 date strip, and the Ratatouille
// ticket's 2007 date line sits under the prints above it.
//
// FACT (proportion only; nothing numeric on screen): US spending on box office tickets plus recorded music per person,
// inflation-adjusted: 2000 ~ $140, 2024 ~ $77 (domestic box office ~$7.5 B in 2000, ~$8.6 B in 2024; RIAA retail value
// $14.3 B in 2000, $17.7 B in 2024; CPI x1.82; population 282 M -> 340 M), so today's pile is ~55 % of the 2000 pile.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt; raw copies in assets-src/wip-entertainment/13/; baked by
// scripts/clips/wip-entertainment/bake-spend-half.py into public/wip-entertainment/sh_*.png):
// 13/cd_jewelcase_empty_back.jpg -> https://commons.wikimedia.org/wiki/File:CD_Jewel_Case_(Back).jpg — CC0 — DiscoA340
// 13/cd_jewelcase_empty_front.jpg -> https://commons.wikimedia.org/wiki/File:CD_Jewel_Case_(Front).jpg — CC0 — DiscoA340
// 13/cd_jewelcase_TDK_shrinkwrap_c2000.jpg -> https://commons.wikimedia.org/wiki/File:TDK_CD-R_white_jewel_case_in_shrinkwrap,_around_2000.jpg — CC0 — Retired electrician
// 13/dvd_case_black.jpg -> https://commons.wikimedia.org/wiki/File:DVD_Jewel_Box.jpg — CC0 — Gnnwikifikator
// 13/cinema_ticket_Beverley_Paris_entree.jpg -> https://commons.wikimedia.org/wiki/File:Ticket_d%27entr%C3%A9e_Cinema_BEVERLEY.jpg — CC BY-SA 4.0 — Tarbou75
// 13/cinema_ticket_Universal_Madrid.jpg -> https://commons.wikimedia.org/wiki/File:Entrada_del_Universal_Cinema_(Madrid).jpg — CC0 — WikiPokos
// 13/ticket_admit_one.jpg -> https://commons.wikimedia.org/wiki/File:MMF_Industries_Ticket.jpg — CC BY-SA 4.0 — DestinationFearFan
// 13/ticket_roll_with_stub.jpg -> https://commons.wikimedia.org/wiki/File:Roll_of_tickets_(AM_1999.77.6-1).jpg — CC BY 4.0 — Caxton (the two loose stubs only)
// 13/cinema_ticket_Ratatouille_2007.jpg -> https://commons.wikimedia.org/wiki/File:Ratatouille_movie_ticket_from_2007.jpg — CC BY-SA 2.0 — Christian Harrison
// 13/cinema_ticket_Empire_London_1966.jpg -> https://commons.wikimedia.org/wiki/File:Movie_ticket_London_1966.JPG — CC BY-SA 4.0 — Wald1siedel
// Mattes (Beverley, Admit One): Apple Vision fg (scripts/clips/neal-stephenson-trailer/neal-matte.swift).
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";
import {
  MarkerStroke,
  MessyFilmLife,
  MessyPaper,
  Pt,
  RoughCutPrint,
  Scrawl,
  drawT,
  handLine,
  onTwos,
  raggedLine,
  vnoise,
} from "./messyShared";

export const FPS = 24;
export const DURATION = 164;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// -- the camera: one slow creep in from f0 to the end --------------------------------------------------------------
const camAt = runWipCamera(
  [
    { f: -24, x: 540, y: 958, k: 1 },
    { f: DURATION + 12, x: 540, y: 952, k: 1.05, ease: "linear" },
  ],
  DURATION,
);

// -- the pile (world px; the rest camera shows world = screen) -------------------------------------------------------
// Laid out for the settled camera (k 1.05 about (540, 952)): the base spans screen x ~180-905, the part above the cut line
// stays left of screen x ~735 so "½" fits beside the line's right end, and the lowest pixel stays above the band.
const BASE_Y = 1055; // the pile stands here: screen y <= ~1070 at the closest camera
const TOP_Y = 226;
const CUT_Y = BASE_Y - 0.55 * (BASE_Y - TOP_Y); // 599: 55 % of the pile's height from its base
const PILE_X = 460; // the cut line's middle

type Item = { src: string; aspect: number; w: number; x: number; y: number; rot: number; rect?: boolean; flip?: boolean };
const P = (name: string) => `wip-entertainment/sh_${name}.png`;
// Paint order bottom to top: the pile is built from the base up, each piece lying on the ones below (world px).
// rect: a cropped flat thing with its border cut at render time (w = the photo window); otherwise a baked hand-cut matte.
const PILE: Item[] = [
  // the base: a DVD case and an empty jewel case
  { src: P("dvd"), aspect: 0.7211, w: 305, x: 360, y: 816, rot: -2, rect: true },
  { src: P("jewel_front"), aspect: 1.2081, w: 410, x: 655, y: 855, rot: 2, rect: true },
  // across the cut line: the TDK CD-R and the Megaplex ticket
  { src: P("tdk"), aspect: 1.1568, w: 390, x: 400, y: 560, rot: -4, rect: true },
  { src: P("ratatouille"), aspect: 1.1889, w: 340, x: 548, y: 530, rot: 5, rect: true }, // its date line tucked under the prints above,
  // on the base: the Empire ticket, the Admit One stub in front
  { src: P("empire"), aspect: 1.3493, w: 377, x: 600, y: 765, rot: 5, rect: true },
  // laid across the Empire ticket's date strip: no year but 2000 is legible in the pile
  { src: P("universal"), aspect: 2.3684, w: 340, x: 601, y: 753, rot: 2, rect: true },
  { src: P("admit"), aspect: 1.7902, w: 409, x: 470, y: 930, rot: -3 },
  // the top: two Admit One stubs, a third jewel case, the Beverley ticket
  { src: P("stubs"), aspect: 0.2756, w: 101, x: 280, y: 400, rot: -9, rect: true },
  { src: P("jewel_front"), aspect: 1.2081, w: 390, x: 440, y: 400, rot: -3, rect: true, flip: true },
  { src: P("beverley"), aspect: 0.795, w: 260, x: 580, y: 400, rot: 7 },
];

// The cut line's x extent: past the pile's widest point at CUT_Y on both sides (the marker runs onto the page).
const LINE_X0 = 178;
const LINE_X1 = 752;
// The marker line's centre: a hand's line, very slightly falling to the right
const lineY = (x: number) => CUT_Y + (x - PILE_X) * 0.012;

// The three pushes of the pen, one per cause; each starts a little behind where the last ended.
const THIRD = (LINE_X1 - LINE_X0) / 3;
const STROKES: { a: Pt; b: Pt; start: number; end: number; seed: string }[] = [
  { a: { x: LINE_X0, y: lineY(LINE_X0) - 2 }, b: { x: LINE_X0 + THIRD + 8, y: lineY(LINE_X0 + THIRD) + 3 }, start: 5, end: 13, seed: "cut-a" },
  { a: { x: LINE_X0 + THIRD - 10, y: lineY(LINE_X0 + THIRD) - 1 }, b: { x: LINE_X0 + 2 * THIRD + 6, y: lineY(LINE_X0 + 2 * THIRD) + 2 }, start: 20, end: 28, seed: "cut-b" },
  { a: { x: LINE_X0 + 2 * THIRD - 8, y: lineY(LINE_X0 + 2 * THIRD) + 1 }, b: { x: LINE_X1, y: lineY(LINE_X1) - 3 }, start: 37, end: 46, seed: "cut-c" },
];

// -- the tear -----------------------------------------------------------------------------------------------------
// The torn edge runs along the top of the marker line (torn where it was marked; the red stays on the half that stays).
// The white paper core shows in a thin ragged band under the edge on the half that stays, and above it on the half that goes.
const TEAR_UP = 18; // the edge's distance above the line's centre: the white core then ends at the stroke's top edge
const TEAR = raggedLine(-400, 1500, (x) => lineY(x) - TEAR_UP, "tear", { amp: 4, step: 5 });
// The core band's own ragged width (px) at each of TEAR's points; it only opens behind the tear's front, which runs from the
// line's left end to its right as the top starts to go (so no white line appears all at once).
const CORE_W = TEAR.map((p, i) => 0.6 + 0.4 * random(`core-${i}`) + 0.25 * vnoise("core-slow", p.x / 40));
const coreEdge = (front: number, dir: 1 | -1, width: number) =>
  TEAR.map((p, i) => ({ x: p.x, y: p.y + dir * width * CORE_W[i] * Math.min(1, Math.max(0, (front - p.x) / 60)) }));
const polyCss = (pts: Pt[]) => `polygon(${pts.map((p) => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(", ")})`;
const below = (edge: Pt[]) => polyCss([...edge, { x: 1500, y: 4000 }, { x: -400, y: 4000 }]);
const above = (edge: Pt[]) => polyCss([{ x: -400, y: -4000 }, { x: 1500, y: -4000 }, ...edge.slice().reverse()]);
const CLIP_LO = below(TEAR);
const CLIP_HI = above(TEAR);

// The top half's travel, on twos: it turns about the line's right end (the tear runs from the left), then is pulled up.
const PIVOT = { x: LINE_X1 - 30, y: lineY(LINE_X1 - 30) - TEAR_UP };
const TEAR_START = 56;
const PULL_START = 76;
const PULL_END = 96;
const topPose = (frame: number) => {
  const f = onTwos(frame);
  // the tear runs from the left at a steady hand's pace, then the top is pulled away, gathering speed
  const peel = interpolate(f, [TEAR_START, PULL_START], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.7, 1) });
  const pull = interpolate(f, [PULL_START, PULL_END], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return {
    rot: 6.5 * peel + 4 * pull,
    dx: 70 * pull,
    dy: -10 * peel - 1250 * pull,
    lift: Math.min(1, 0.35 * peel + pull),
    torn: f >= TEAR_START,
  };
};
// The half that stays relaxes a hair once the top lets go, on twos.
const lowPose = (frame: number) => {
  const f = onTwos(frame) - PULL_START;
  if (f < 0) return { dy: 0, rot: 0 };
  const s = Math.exp(-f / 4) * Math.cos(f * 0.9);
  return { dy: 3 * (1 - Math.exp(-f / 3)) - 2 * s, rot: -0.25 * s };
};

// -- the ghost: a dashed outline of where the top stood -------------------------------------------------------------
// The hull of the top half's prints above the line (their resting corners, border included), opened along the line.
const corners = (it: Item): Pt[] => {
  const h = it.w / it.aspect;
  const pad = it.rect ? 18 : 0;
  const a = (it.rot * Math.PI) / 180;
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]) => {
    const px = (sx * (it.w / 2 + pad)) as number;
    const py = (sy * (h / 2 + pad)) as number;
    return { x: it.x + px * Math.cos(a) - py * Math.sin(a), y: it.y + px * Math.sin(a) + py * Math.cos(a) };
  });
};
const hull = (pts: Pt[]) => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: Pt[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: Pt[] = [];
  for (const q of p.slice().reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
const GHOST: Pt[] = (() => {
  // each print's outline, clipped to the part above the line (a print wholly under it adds nothing)
  const pts = PILE.flatMap((it) => {
    const c = corners(it);
    const out: Pt[] = [];
    c.forEach((a, i) => {
      const b = c[(i + 1) % c.length];
      const ain = a.y <= lineY(a.x);
      const bin = b.y <= lineY(b.x);
      if (ain) out.push(a);
      if (ain !== bin) {
        const t = (lineY(a.x) - a.y) / (b.y - a.y);
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    });
    return out;
  });
  const hl = hull(pts);
  // keep the part above the line: walk the hull, clip to y <= line
  const clip: Pt[] = [];
  for (let i = 0; i < hl.length; i++) {
    const a = hl[i];
    const b = hl[(i + 1) % hl.length];
    const ain = a.y <= lineY(a.x);
    const bin = b.y <= lineY(b.x);
    if (ain) clip.push(a);
    if (ain !== bin) {
      const t = (lineY(a.x) - a.y) / (b.y - a.y);
      clip.push({ x: a.x + (b.x - a.x) * t, y: lineY(a.x + (b.x - a.x) * t) });
    }
  }
  // grow it a little (the hand draws round the thing, not on it) and open it at the line: start bottom left, end bottom right
  const cx = clip.reduce((s, p) => s + p.x, 0) / clip.length;
  const cy = clip.reduce((s, p) => s + p.y, 0) / clip.length;
  const grown = clip.map((p) => {
    const d = Math.hypot(p.x - cx, p.y - cy) || 1;
    return p.y >= lineY(p.x) - 1 ? { x: p.x + ((p.x - cx) / d) * 10, y: p.y - 6 } : { x: p.x + ((p.x - cx) / d) * 12, y: p.y + ((p.y - cy) / d) * 12 };
  });
  const onLine = grown.map((p, i) => ({ p, i })).filter(({ p }) => p.y >= lineY(p.x) - 8);
  const left = onLine.reduce((m, o) => (o.p.x < m.p.x ? o : m), onLine[0]);
  // order: from the bottom-left point, go round the top (the direction away from the bottom-right point)
  const n = grown.length;
  const out: Pt[] = [];
  const nxt = grown[(left.i + 1) % n];
  const dir = nxt.y < left.p.y - 8 ? 1 : -1;
  for (let k = 0; k < n; k++) {
    const p = grown[(left.i + dir * k + n * 2) % n];
    out.push(p);
    if (k > 0 && p.y >= lineY(p.x) - 8) break;
  }
  return out;
})();
const GHOST_START = 88;
const GHOST_END = 110;

// -- the words -------------------------------------------------------------------------------------------------
// beside the tops they name: the old pile's (the ghost's) and the half pile's; settled about 100 px inside the right edge
const YEAR = { x: 172, y: 140, start: 2 }; // above-left of the old top (the ghost's top-left corner)
const HALF = { x: 782, y: 548, start: 114 }; // just right of the cut line's right end: the new top is half

const Pile: React.FC<{ silhouette?: boolean }> = ({ silhouette = false }) => (
  <>
    {PILE.map((it, i) => (
      <RoughCutPrint
        key={i}
        src={it.src}
        rect={it.rect}
        flipX={it.flip}
        x={it.x}
        y={it.y}
        w={it.w}
        aspect={it.aspect}
        rotate={it.rot}
        shadow={silhouette ? 0 : 1}
        seed={`pile-${i}`}
      />
    ))}
  </>
);

const SpendHalf: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const top = topPose(frame);
  const low = lowPose(frame);
  // the tear's front: from the line's left end at TEAR_START to past its right end two thirds of the way through the peel
  const front = interpolate(onTwos(frame), [TEAR_START, TEAR_START + 14], [LINE_X0 - 60, LINE_X1 + 60], clamp);
  const clipLoPhoto = below(coreEdge(front, 1, 13.5)); // the photo of the half that stays ends a little under the edge
  const clipHiPhoto = above(coreEdge(front, -1, 12.5)); // the photo of the half that goes ends a little over it
  const topXf = `translate(${top.dx}px, ${top.dy}px) rotate(${top.rot}deg)`;
  const origin = `${PIVOT.x}px ${PIVOT.y}px`;
  const lowXf = `translate(0px, ${low.dy}px) rotate(${low.rot}deg)`;
  const lowOrigin = `${PILE_X}px ${BASE_Y}px`;
  const topGone = top.dy < -1200;
  const lines = STROKES.map((s) => ({ ...s, pts: handLine(s.a, s.b, s.seed, 0.004) }));
  // the marker line stays on the page and the half that stays (it settles with it)
  const markerLine = lines.map((s) => <MarkerStroke key={s.seed} points={s.pts} progress={drawT(frame, s.start, s.end)} frame={frame} seed={s.seed} />);
  return (
    <>
      <MessyFilmLife frame={frame}>
        <MessyPaper cam={cam} />
        {!top.torn ? (
          <WipPlane cam={cam}>
            <Pile />
          </WipPlane>
        ) : (
          <>
            {/* the half that stays: the white core under the torn edge, then the photos ending a little lower */}
            <WipPlane cam={cam}>
              <div style={{ position: "absolute", inset: 0, transform: lowXf, transformOrigin: lowOrigin }}>
                {/* the core: pure white, and (on an outer wrapper, so the clip does not cut it) a faint shadow round the torn
                    edge, so the white band reads against the off-white page */}
                <div style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 0 1.3px rgba(40,24,20,0.5)) drop-shadow(0 -1px 3px rgba(40,24,20,0.16))" }}>
                  <div style={{ position: "absolute", inset: 0, clipPath: CLIP_LO, filter: "brightness(0) invert(1)" }}>
                    <Pile silhouette />
                  </div>
                </div>
                <div style={{ position: "absolute", inset: 0, clipPath: clipLoPhoto }}>
                  <Pile />
                </div>
              </div>
            </WipPlane>
          </>
        )}
        <WipPlane cam={cam} ink>
          <div style={{ position: "absolute", inset: 0, transform: lowXf, transformOrigin: lowOrigin }}>{markerLine}</div>
          <MarkerStroke points={GHOST} progress={drawT(frame, GHOST_START, GHOST_END)} frame={frame} seed="ghost" dash={[20, 15]} width={10} opacity={0.68} />
          <Scrawl text="2000" x={YEAR.x} y={YEAR.y} size={88} frame={frame} start={YEAR.start} seed="y2000" rotate={-4} />
          <Scrawl text="½" x={HALF.x} y={HALF.y} size={178} frame={frame} start={HALF.start} perLetter={9} seed="half" rotate={-3} />
        </WipPlane>
        {/* the half that goes: above the ink, since it is lifted off the page (it passes over "2000" on its way out) */}
        {!top.torn || topGone ? null : (
          <WipPlane cam={cam}>
            <div style={{ position: "absolute", inset: 0, transform: topXf, transformOrigin: origin }}>
              <div style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 1.3px rgba(40,24,20,0.5)) drop-shadow(0 ${4 + 20 * top.lift}px ${6 + 16 * top.lift}px rgba(40,24,20,0.22))` }}>
                <div style={{ position: "absolute", inset: 0, clipPath: CLIP_HI, filter: "brightness(0) invert(1)" }}>
                  <Pile silhouette />
                </div>
              </div>
              <div style={{ position: "absolute", inset: 0, clipPath: clipHiPhoto }}>
                <Pile />
              </div>
            </div>
          </WipPlane>
        )}
      </MessyFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default SpendHalf;
