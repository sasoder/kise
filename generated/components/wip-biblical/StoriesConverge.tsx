// ---------------------------------------------------------------------------
// StoriesConverge (wip-biblical, cut 60). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 121 frames.
//
// CHECK LINE: "With AI each writer's story got fancier, but the stories all came out looking alike." With no sound: five
// different typed pages each get a red flourish of their own, then slide together and turn into one identical pile.
//
// THE LINE: "(A 2024 study in Science Advances shows that) AI made individual writers more creative, but made their overall
// stories more similar to one another."
// WORD -> FRAME: AI -5 · made 3 · individual 10 · writers 22 · more 32 · creative 38 · but 50 · made 59 · their 63 ·
// overall 67 · stories 77 · more 88 · similar 95 · to 105 · one 111 · another 113 · (cut to speaker f121)
// DURATION: the slot 60.875 -> 65.917 s = 5.042 s x 24 = 121 frames (f0..f120).
//
// THE MOTION: five blank typescript sheets lie dealt across the top band in a shallow zigzag, each typed in its own shape
// (a poem, dense prose, dialogue, a list, short ragged lines; word blocks in deep-green ink). A fine red thread runs in
// from the left edge and touches each sheet in turn on an even rhythm; where its tip touches, that sheet's own red flourish
// spreads out from the point (a margin vine, a drawn initial, an illustration box, a starred title, an ornamental rule). On
// "but" the sheets slide together toward the centre along the thread while the camera pushes in; as they travel, every
// sheet's word blocks reflow to one layout and every flourish crossfades to one ornament, and they settle as one neatly
// fanned pile of identical pages by "one another". Its job done, the thread is drawn back out the way it came (f82-f106:
// its free end runs back through the pile and out at the upper-left edge), so the settled frame is the pile alone, every
// page carrying the same red ornament. A slow creep holds to the cut.
// Contact frames: the thread's tip touches the sheets at f8, f15, f22, f29, f36; each flourish starts to spread on that
// frame. Slide f48-f108 (one paper ease); the reflow f50-f82; the flourish crossfade f56-f78; the thread withdraws
// f82-f106, last seen leaving the upper-left edge. The slip slides up f0-f12.
// SPOT INK: red = the AI thread and what it leaves on the pages (the clip's red: the bond that makes many one). No indigo.
// The only type is the slip naming the study.
// SHIFT (Nov 12, user): everything prints BIBLICAL_SHIFT_Y = 100 px lower via <ShiftDown>; the screen px above are before it.
//
// SOURCES: Doshi, A. R. & Hauser, O. P. (2024), "Generative AI enhances individual creativity but reduces the collective
// diversity of novel content", Science Advances 10(28), eadn5290, 12 July 2024, doi 10.1126/sciadv.adn5290 (CC BY 4.0;
// verified in animation_source/notes/ASSETS_PROGRESS.md from PubMed 38996021 / PMC11244532 / the PDF). No figures on screen.
// Sheets: three typed University of Illinois thesis pages, Internet Archive, PD (US, pre-1931): Weld 1907, Gregg 1912,
// Ross 1917, p15 each (assets_raw/study/), the typing lifted off by scripts/clips/wip-biblical/bake-stories-60.py ->
// public/wip-biblical/sc_page_1..5.png; the word blocks and flourishes are drawn here.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CaptionBandsDebug,
  CutOut,
  InkPrint,
  MONO,
  PaperGround,
  RED,
  SERIF,
  SERIF_WEIGHT,
  STOCK,
  THEMES,
  WipCam,
  WipFilmLife,
  WipPlane,
  runWipCamera,
  slide,
  textRise,
} from "../kits/works-in-progress/wipShared";
import { ShiftDown } from "./biblicalShift";

export const FPS = 24;
export const DURATION = 121;
export const schema = z.object({ bands: z.boolean(), mask: z.boolean() });
export const defaultProps = schema.parse({ bands: false, mask: false });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INK = THEMES.mint.ink;

// -- timing ----------------------------------------------------------------------------------------------------------------
const TOUCH = [8, 15, 22, 29, 36]; // the thread's tip on sheet 1..5
const HEAD_IN = -2; // the tip at the thread's start (off the left edge)
const HEAD_OUT = 43; // the tip off the right edge
const RETRACT_IN = 82; // the thread is pulled back out the way it came, at one even pull (sine in-out, not paper's
const RETRACT_DUR = 24; // ease: ~2200 screen px of thread leave, so the peak speed must stay low)
const SLIDE_IN = 48;
const SLIDE_DUR = 60;
// The reflow is done while the sheets are still apart (about half way), so five identical pages are seen gathering.
const MORPH_IN = 50;
const MORPH_DUR = 32;
const SWAP_IN = 56;
const SWAP_DUR = 22;

// -- the sheets ------------------------------------------------------------------------------------------------------------
const PW = 218;
const PH = 298; // the baked sheet's aspect, 0.7315
type Sheet = { id: number; x: number; y: number; r: number; ex: number; ey: number; er: number };
// Start: a shallow zigzag across the top band under the slip (world px = screen px at f0), y 250-730. End: one pile at
// STACK, fanned, just under the slip.
const STACK_X = 540;
const STACK_Y = 404;
const SHEETS: Sheet[] = [
  { id: 1, x: 205, y: 399, r: -4.5, ex: STACK_X - 9, ey: STACK_Y + 4, er: -3.6 },
  { id: 2, x: 372, y: 573, r: 3, ex: STACK_X - 4, ey: STACK_Y - 3, er: -1.5 },
  { id: 3, x: 540, y: 399, r: -1.8, ex: STACK_X + 1, ey: STACK_Y + 2, er: 1.5 },
  { id: 4, x: 708, y: 573, r: 3.6, ex: STACK_X + 4, ey: STACK_Y, er: 0.4 },
  { id: 5, x: 875, y: 399, r: -2.6, ex: STACK_X + 10, ey: STACK_Y - 2, er: 3.4 },
];
const Z_ORDER = [1, 5, 3, 2, 4]; // bottom to top: the lower row lies over the upper row's corners, and stays on top
const sheetAt = (s: Sheet, frame: number) => {
  const t = slide(frame, SLIDE_IN, SLIDE_DUR);
  return { x: s.x + (s.ex - s.x) * t, y: s.y + (s.ey - s.y) * t, r: s.r + (s.er - s.r) * t, t };
};
/** A sheet-local point (top-left origin) in world px. */
const toWorld = (p: { x: number; y: number; r: number }, lx: number, ly: number) => {
  const a = (p.r * Math.PI) / 180;
  const dx = lx - PW / 2;
  const dy = ly - PH / 2;
  return { x: p.x + dx * Math.cos(a) - dy * Math.sin(a), y: p.y + dx * Math.sin(a) + dy * Math.cos(a) };
};

// -- the typing: 16 line slots per sheet, each a row of word blocks ------------------------------------------------------
type Word = { x: number; w: number };
type Line = { y: number; h: number; words: Word[] };
const K = 14; // word blocks per slot, padded with zero-width blocks
const L = 26;
const R = 192;
const fill = (x0: number, x1: number, seed: string, big = false): Word[] => {
  const out: Word[] = [];
  const gap = big ? 7 : 4;
  let x = x0;
  let k = 0;
  while (x < x1 - 0.5) {
    let w = big ? 22 + random(`${seed}-${k}`) * 26 : 8 + random(`${seed}-${k}`) ** 1.4 * 24;
    if (x1 - (x + w + gap) < (big ? 18 : 8)) w = x1 - x; // the line ends on a whole word
    out.push({ x, w: Math.min(w, x1 - x) });
    x += w + gap;
    k++;
  }
  return out;
};
const line = (x0: number, x1: number, y: number, seed: string, h = 5): Line => ({ y, h, words: fill(x0, x1, seed) });
const centred = (cx: number, w: number, y: number, seed: string, h = 5) => line(cx - w / 2, cx + w / 2, y, seed, h);
const rnd = (seed: string, a: number, b: number) => a + random(seed) * (b - a);

// The one layout every sheet ends in: a title, the ornament under it, three justified paragraphs.
const COMMON: Line[] = [
  centred(109, 86, 30, "c-0", 7),
  ...Array.from({ length: 15 }, (_, i) => {
    const y = 66 + i * 13.4;
    const first = i % 5 === 0;
    const last = i % 5 === 4;
    return line(first ? L + 14 : L, last ? R - 46 - i * 2 : R, y, `c-${i + 1}`);
  }),
];
const empty = (slot: number): Line => ({ y: COMMON[slot].y, h: 5, words: [] });

// 1: a poem, centred short lines in stanzas (the vine takes the left margin)
const POEM: Line[] = [
  centred(114, 62, 30, "p1-0", 7),
  ...Array.from({ length: 15 }, (_, i) => {
    const stanza = Math.floor(i / 4);
    const y = 56 + i * 12.5 + stanza * 12;
    return centred(114, rnd(`p1-w-${i}`, 52, 108), y, `p1-${i + 1}`);
  }),
];
// 2: dense prose with a drawn initial three lines deep
const PROSE: Line[] = Array.from({ length: 16 }, (_, i) => {
  const y = 30 + i * 14;
  if (i < 3) return line(70, R, y, `p2-${i}`);
  if (i === 8) return line(L, 132, y, `p2-${i}`);
  if (i === 9) return line(L + 14, R, y, `p2-${i}`);
  if (i === 15) return line(L, 104, y, `p2-${i}`);
  return line(L, R, y, `p2-${i}`);
});
// 3: dialogue: short speaker tags at the margin, every speech deeply indented, round an illustration box (y 92-168)
const DIALOGUE_SPEC: [number, number, number, number][] = [
  [L, 58, 30, 6],
  [76, 188, 44, 5],
  [76, 150, 58, 5],
  [L, 50, 72, 6],
  [76, 176, 184, 5],
  [L, 62, 198, 6],
  [76, 190, 212, 5],
  [76, 130, 226, 5],
  [L, 54, 240, 6],
  [76, 170, 254, 5],
  [76, 120, 268, 5],
];
const DIALOGUE: Line[] = Array.from({ length: 16 }, (_, i) =>
  i < DIALOGUE_SPEC.length ? line(DIALOGUE_SPEC[i][0], DIALOGUE_SPEC[i][1], DIALOGUE_SPEC[i][2], `p3-${i}`, DIALOGUE_SPEC[i][3]) : empty(i),
);
// 4: two columns under a starred title
const TWO_COL: Line[] = [
  centred(109, 74, 30, "p4-0", 7),
  ...Array.from({ length: 15 }, (_, i) => {
    const y = 56 + i * 14.4;
    const lEnd = i === 6 ? 70 : 102;
    const rEnd = i === 14 ? 150 : i === 7 ? 164 : R;
    return { y, h: 5, words: [...fill(L, lEnd, `p4-l-${i}`), ...fill(116, rEnd, `p4-r-${i}`)] };
  }),
];
// 5: a large two-line heading, the ornamental rule under it (y 88), then ragged body text
const HEADING: Line[] = [
  { y: 38, h: 13, words: fill(52, 166, "p5-h0", true) },
  { y: 62, h: 13, words: fill(70, 148, "p5-h1", true) },
  ...Array.from({ length: 14 }, (_, i) => line(L, R - rnd(`p5-w-${i}`, 0, 52), 110 + i * 12.6, `p5-${i}`)),
];
const LAYOUTS = [POEM, PROSE, DIALOGUE, TWO_COL, HEADING];

const pad = (ws: Word[], at: number): Word[] => [...ws, ...Array.from({ length: K - ws.length }, () => ({ x: at, w: 0 }))].slice(0, K);
const lineEnd = (ln: Line) => (ln.words.length ? ln.words[ln.words.length - 1].x + ln.words[ln.words.length - 1].w : L);
/** Sheet i's typing at reflow m (0 its own .. 1 the common layout): every block slides and resizes to its twin. */
const typingAt = (i: number, m: number) =>
  LAYOUTS[i].map((a, s) => {
    const b = COMMON[s];
    const wa = pad(a.words, lineEnd(a));
    const wb = pad(b.words, lineEnd(b));
    return {
      y: a.y + (b.y - a.y) * m,
      h: a.h + (b.h - a.h) * m,
      words: wa.map((u, k) => ({ x: u.x + (wb[k].x - u.x) * m, w: u.w + (wb[k].w - u.w) * m })),
    };
  });

const Typing: React.FC<{ lines: Line[]; seed: string }> = ({ lines, seed }) => (
  <InkPrint x={0} y={0} w={PW} h={PH} ink={INK} theme="offwhite" seed={seed} rough={0.5} wear={0.12} misregister={0.4} tile={0.35}>
    <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{ position: "absolute", left: 0, top: 0 }}>
      {lines.flatMap((ln, s) =>
        ln.words
          .filter((wd) => wd.w > 0.3)
          .map((wd, k) => <rect key={`${s}-${k}`} x={wd.x} y={ln.y - ln.h / 2} width={wd.w} height={ln.h} rx={Math.min(1.6, wd.w / 2)} fill="currentColor" />),
      )}
    </svg>
  </InkPrint>
);

// -- the flourishes, red ink, sheet-local; `at` is where the thread touches and the ink spreads from ----------------------
const STROKE = 2.1;
const leaf = (x: number, y: number, a: number) => (
  <path key={`${x}-${y}`} d="M0 0 Q5.5 -3.4 11 0 Q5.5 3.4 0 0 Z" transform={`translate(${x} ${y}) rotate(${a})`} fill="currentColor" />
);
const starPath = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const q = i % 2 ? r * 0.42 : r;
    pts.push(`${(cx + Math.cos(a) * q).toFixed(2)} ${(cy + Math.sin(a) * q).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
};
type Flourish = { at: [number, number]; reach: number; art: React.ReactNode };
const FLOURISHES: Flourish[] = [
  // 1: a vine down the left margin
  {
    at: [24, 48],
    reach: 232,
    art: (
      <g>
        <path d="M24 48 C14 74 32 98 22 124 C13 148 30 172 21 198 C13 222 28 246 20 268" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
        <path d="M24 48 C26 40 36 40 35 47 C34 52 28 51 29 47" fill="none" stroke="currentColor" strokeWidth={STROKE * 0.85} strokeLinecap="round" />
        {[leaf(21, 68, -152), leaf(26, 92, -28), leaf(19, 120, -150), leaf(25, 146, -24), leaf(18, 174, -152), leaf(24, 198, -26), leaf(17, 226, -150), leaf(22, 250, -28)]}
      </g>
    ),
  },
  // 2: a drawn initial, three lines deep
  {
    at: [45, 43],
    reach: 40,
    art: (
      <g>
        <rect x={26} y={24} width={38} height={38} fill="none" stroke="currentColor" strokeWidth={STROKE} />
        <rect x={29.5} y={27.5} width={31} height={31} fill="none" stroke="currentColor" strokeWidth={0.8} />
        <text x={45} y={55.5} textAnchor="middle" fontFamily={SERIF} fontWeight={SERIF_WEIGHT} fontSize={33} fill="currentColor">
          T
        </text>
      </g>
    ),
  },
  // 3: an illustration box between the exchanges: hills, a sun, a bird
  {
    at: [34, 92],
    reach: 165,
    art: (
      <g fill="none" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round">
        <rect x={34} y={92} width={150} height={76} />
        <path d="M36 160 Q78 116 122 160" />
        <path d="M96 166 Q138 124 182 160" />
        <circle cx={150} cy={113} r={7} fill="currentColor" stroke="none" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return <path key={i} d={`M${150 + Math.cos(a) * 10.5} ${113 + Math.sin(a) * 10.5}L${150 + Math.cos(a) * 14.5} ${113 + Math.sin(a) * 14.5}`} strokeWidth={1.3} />;
        })}
        <path d="M62 114 q4.5 -5 9 0 q4.5 -5 9 0" strokeWidth={1.3} />
      </g>
    ),
  },
  // 4: a starred title
  {
    at: [58, 30],
    reach: 112,
    art: (
      <g>
        <path d={starPath(58, 30, 7.5)} fill="currentColor" />
        <path d={starPath(160, 30, 7.5)} fill="currentColor" />
        <path d="M74 41.5 H144" stroke="currentColor" strokeWidth={1.3} />
      </g>
    ),
  },
  // 5: an ornamental rule under the heading
  {
    at: [109, 88],
    reach: 78,
    art: (
      <g stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round">
        <path d="M42 88 H98 M120 88 H176" fill="none" />
        <path d="M109 80.5 L116 88 L109 95.5 L102 88 Z" fill="currentColor" stroke="none" />
        <circle cx={38} cy={88} r={2.4} fill="currentColor" stroke="none" />
        <circle cx={180} cy={88} r={2.4} fill="currentColor" stroke="none" />
      </g>
    ),
  },
];
// The one ornament every sheet ends with, under the title.
const COMMON_AT: [number, number] = [109, 48];
const COMMON_ART = (
  <g stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round">
    <path d="M68 48 H97 M121 48 H150" fill="none" />
    <path d={starPath(109, 47, 8)} fill="currentColor" stroke="none" />
  </g>
);

/** Red ink on the sheet. `spread` 0..1 opens a disc from `at` (the ink taking from where the thread touched). */
const RedInk: React.FC<{ art: React.ReactNode; seed: string; at: [number, number]; reach: number; spread: number; opacity: number }> = ({
  art,
  seed,
  at,
  reach,
  spread,
  opacity,
}) => {
  if (spread <= 0 || opacity <= 0) return null;
  const clip = `sc-spread-${seed}`;
  return (
    // the wrapper carries the multiply (and any crossfade), so the ink still prints into the sheet at part opacity
    <div style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "multiply" }}>
      <InkPrint x={0} y={0} w={PW} h={PH} ink={RED} theme="offwhite" seed={seed} rough={0.6} wear={0.1} misregister={0.5} tile={0.6}>
        <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <clipPath id={clip}>
              <circle cx={at[0]} cy={at[1]} r={Math.max(0.01, spread * reach)} />
            </clipPath>
          </defs>
          <g clipPath={spread < 1 ? `url(#${clip})` : undefined}>{art}</g>
        </svg>
      </InkPrint>
    </div>
  );
};

const SheetView: React.FC<{ s: Sheet; frame: number }> = ({ s, frame }) => {
  const i = s.id - 1;
  const p = sheetAt(s, frame);
  const m = slide(frame, MORPH_IN, MORPH_DUR);
  const swap = slide(frame, SWAP_IN, SWAP_DUR);
  const f = FLOURISHES[i];
  const spreadDur = 8 + f.reach / 22;
  const spread = interpolate(frame, [TOUCH[i], TOUCH[i] + spreadDur], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  return (
    <div style={{ position: "absolute", left: p.x - PW / 2, top: p.y - PH / 2, width: PW, height: PH, transform: `rotate(${p.r}deg)` }}>
      <CutOut src={`wip-biblical/sc_page_${s.id}.png`} x={PW / 2} y={PH / 2} w={PW} aspect={PW / PH} lift={0.18 * Math.sin(Math.PI * p.t)} grain={0.04} seed={`sc-page-${s.id}`} />
      <Typing lines={typingAt(i, m)} seed={`sc-type-${s.id}`} />
      <RedInk art={f.art} seed={`sc-own-${s.id}`} at={f.at} reach={f.reach} spread={spread} opacity={1 - swap} />
      <RedInk art={COMMON_ART} seed={`sc-common-${s.id}`} at={COMMON_AT} reach={60} spread={1} opacity={swap} />
    </div>
  );
};

// -- the thread: a smooth line through each sheet's touch point, drawn by its tip, then carried by the sheets ------------
// It comes in from the upper left and leaves to the upper right, low enough that its arms pass under the slip.
const THREAD_IN = { x: -90, y: 270 };
const THREAD_OUT = { x: 1170, y: 262 };
type P = { x: number; y: number };
/** Centripetal Catmull-Rom through pts (no loops where points bunch up), `n` samples per span. */
const spline = (pts: P[], n = 22): P[][] => {
  const ext = [
    { x: 2 * pts[0].x - pts[1].x, y: 2 * pts[0].y - pts[1].y },
    ...pts,
    { x: 2 * pts[pts.length - 1].x - pts[pts.length - 2].x, y: 2 * pts[pts.length - 1].y - pts[pts.length - 2].y },
  ];
  const spans: P[][] = [];
  const td = (a: P, b: P) => Math.max(1e-3, Math.hypot(b.x - a.x, b.y - a.y) ** 0.5);
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const t1 = td(p0, p1);
    const t2 = t1 + td(p1, p2);
    const t3 = t2 + td(p2, p3);
    const span: P[] = [];
    for (let k = 0; k <= n; k++) {
      const t = t1 + ((t2 - t1) * k) / n;
      const lerp = (a: P, b: P, ta: number, tb: number) => ({
        x: ((tb - t) / (tb - ta)) * a.x + ((t - ta) / (tb - ta)) * b.x,
        y: ((tb - t) / (tb - ta)) * a.y + ((t - ta) / (tb - ta)) * b.y,
      });
      const a1 = lerp(p0, p1, 0, t1);
      const a2 = lerp(p1, p2, t1, t2);
      const a3 = lerp(p2, p3, t2, t3);
      const b1 = lerp(a1, a2, 0, t2);
      const b2 = lerp(a2, a3, t1, t3);
      span.push(lerp(b1, b2, t1, t2));
    }
    spans.push(span);
  }
  return spans;
};
/** The first `u` of a polyline by length (0..1). */
const partOf = (pts: P[], u: number): P[] => {
  if (u >= 1) return pts;
  const seg = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const total = seg.reduce((a, b) => a + b, 0);
  let left = u * total;
  const out: P[] = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    if (left >= seg[i]) {
      out.push(pts[i + 1]);
      left -= seg[i];
    } else {
      const t = seg[i] > 0 ? left / seg[i] : 0;
      out.push({ x: pts[i].x + (pts[i + 1].x - pts[i].x) * t, y: pts[i].y + (pts[i + 1].y - pts[i].y) * t });
      break;
    }
  }
  return out;
};
const HEAD_KEYS = [HEAD_IN, ...TOUCH, HEAD_OUT];
// As the pile closes, the five touch points line up along the top sheet's ornament rule (left to right, 9 px apart), so
// the thread runs straight through the ornament instead of kinking between the fanned sheets.
const TOP_SHEET = SHEETS[Z_ORDER[Z_ORDER.length - 1] - 1];
const threadAnchors = (frame: number): P[] => {
  const m = slide(frame, MORPH_IN, MORPH_DUR);
  const top = sheetAt(TOP_SHEET, frame);
  const q = interpolate(top.t, [0.45, 1], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  return SHEETS.map((s, i) => {
    const p = sheetAt(s, frame);
    const [ax, ay] = FLOURISHES[i].at;
    const own = toWorld(p, ax + (COMMON_AT[0] - ax) * m, ay + (COMMON_AT[1] - ay) * m);
    const lined = toWorld(top, COMMON_AT[0] + (i - 2) * 9, COMMON_AT[1]);
    return { x: own.x + (lined.x - own.x) * q, y: own.y + (lined.y - own.y) * q };
  });
};
const Thread: React.FC<{ frame: number; cam: WipCam }> = ({ frame, cam }) => {
  if (frame <= HEAD_IN) return null;
  // the tip runs span by span, reaching each touch point on its frame, at an even pace within each span
  const head = interpolate(frame, HEAD_KEYS, HEAD_KEYS.map((_, i) => i), clamp);
  const spans = spline([THREAD_IN, ...threadAnchors(frame), THREAD_OUT]);
  const pts: P[] = [];
  spans.forEach((sp, i) => {
    if (head <= i) return;
    const part = partOf(sp, head - i);
    pts.push(...(pts.length ? part.slice(1) : part));
  });
  // drawn back out: by length, and over the part in shot only (most of each arm lies off frame by now), so the end that
  // is seen runs back at one even pull from the right edge, through the pile, and out at the upper-left edge
  const pull = interpolate(frame, [RETRACT_IN, RETRACT_IN + RETRACT_DUR], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  if (pull >= 1) return null;
  let shown = pts;
  if (pull > 0) {
    const half = 540 / cam.k + 12;
    const seen = (q: P) => Math.abs(q.x - cam.x) < half;
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = cum[cum.length - 1];
    const first = pts.findIndex(seen);
    let last = pts.length - 1;
    while (last > 0 && !seen(pts[last])) last--;
    const u0 = first < 0 ? 0 : cum[Math.max(0, first - 1)] / total;
    const u1 = cum[Math.min(pts.length - 1, last + 1)] / total;
    shown = partOf(pts, u1 + (u0 - u1) * pull);
  }
  if (shown.length < 2) return null;
  const d = `M${shown.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("L")}`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(0 1.5px 1.2px rgba(14,31,26,0.32))" }}>
      <path d={d} fill="none" stroke={RED} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// -- the slip naming the study -----------------------------------------------------------------------------------------------
// In world space just above where the pile settles; the push-in is framed so its top sits ~90 px from the frame's top
// on the settled frame (mono 36 px: cap height ~25 px at f0, ~38 px settled).
const SLIP_X = 540;
const SLIP_TOP = 176;
const SLIP_W = 540;
const SLIP_H = 58;
const SLIP_Y = SLIP_TOP + SLIP_H / 2;
const Slip: React.FC<{ frame: number }> = ({ frame }) => (
  <div
    style={{
      position: "absolute",
      left: SLIP_X - SLIP_W / 2,
      top: SLIP_Y - SLIP_H / 2,
      width: SLIP_W,
      height: SLIP_H,
      ...textRise(frame, 0, 12, 22),
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: STOCK,
        transform: "rotate(-0.8deg)",
        filter: "drop-shadow(0 1.5px 1.5px rgba(14,31,26,0.3)) drop-shadow(0 6px 9px rgba(14,31,26,0.16))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: MONO,
        fontWeight: 400,
        fontSize: 36,
        letterSpacing: 0.4,
        whiteSpace: "nowrap",
        color: INK,
      }}
    >
      Science Advances · 2024
    </div>
  </div>
);

// -- the camera: a slow creep while the thread works, then one push in onto the pile as the sheets gather -----------------
// Settled (k ~1.53): the slip's top at screen y ~90, the pile under it at about y 215-690, about 335 x 460 px.
const K_END = 1.5;
/** The camera y that puts the slip's top at screen y 90 at zoom k. */
const camYFor = (k: number) => SLIP_TOP + (960 - 90) / k;
const camAt = runWipCamera(
  [
    { f: -24, x: 540, y: 960, k: 1 },
    { f: 40, x: 540, y: 952, k: 1.025, ease: "linear" },
    { f: 100, x: 540, y: camYFor(K_END), k: K_END },
    { f: DURATION + 40, x: 540, y: camYFor(1.56), k: 1.56, ease: "linear" },
  ],
  DURATION,
);

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

const StoriesConverge: React.FC<z.infer<typeof schema>> = ({ bands, mask }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const byId = (id: number) => SHEETS[id - 1];
  return (
    <>
      <WipFilmLife frame={frame}>
        <ShiftDown>
          <PaperGround cam={cam} />
          <WipPlane cam={cam}>
            <Slip frame={frame} />
            {Z_ORDER.map((id) => (
              <SheetView key={id} s={byId(id)} frame={frame} />
            ))}
            <Thread frame={frame} cam={cam} />
          </WipPlane>
        </ShiftDown>
      </WipFilmLife>
      <SpeakerMask on={mask} />
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default StoriesConverge;
