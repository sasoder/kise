// ---------------------------------------------------------------------------
// TwentyMinuteWalk (wip-victorians, cut 32). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 186 frames.
//
// CHECK LINE: "The men who ran the empire went to one school and lived a walk apart." With no sound: portrait stamps huddle,
// get one Eton postmark, then land on a Victorian map of London inside a small red ring.
//
// THE LINE: "there was a high level of social integration. All of these elites went to the same schools and lived within a 20
// minute walking distance of one another in Mayfair and Belgravia"
// WORD -> FRAME: there 1 · was 4 · a 6 · high 9 · level 16 · of 24 · social 28 · integration 34 · All 52 · of 55 · these 59 ·
// elites 62 · went 69 · to 73 · the 76 · same 77 · schools 83 · and 92 · lived 98 · within 102 · a 106 · 20 110 · minute 116 ·
// walking 122 · distance 128 · of 138 · one 143 · another 145 · in 151 · Mayfair 156 · and 164 · Belgravia 168 · which 182
// DURATION: the slot 32.750 -> 40.500 s = 7.75 s x 24 = 186 frames (f0..f185).
//
// THE MOTION: one page, one camera: a slow steady push on five loose stamps as they slide into a block (3 over 2), then one pull-back
// from f98. The red Eton postmark prints across the block at full strength and drains into the paper (f90-108) as the map's ink spreads
// out from under the block, so the deal and the settled frame show clean faces. The stamps then deal off one by one onto their owners'
// addresses, the red ring draws round from its moving tip, and the two district names print in.
// Contact frames: postmark f78 (first ink f78). Stamps lift f104, f109, f114, f119, f124 and touch f120, f125, f130, f135, f140, each
// flat 5 frames later. Ring tip f110 -> f138. Mayfair rises f151-163 (word f156), Belgravia f163-175 (word f168).
// SPOT INK: red = the empire's own (Eton, the ring). Indigo = the printed labels.
//
// THE SUM: the ring's diameter = 20 minutes at a brisk 3.3 mph walk = 1.1 statute miles. The sheet is 6 in to the mile; on the crop its
// own printed scale bar reads 0 ft at x 2884 and 5000 ft at x 6206, so 664.4 crop px per 1000 ft, 3508 crop px per mile, 3859 crop px
// for the ring. Its centre is the smallest circle round the five addresses and Belgrave Square's whole garden (r 1902 crop px), so it
// holds all of them with 27 crop px to spare. Longest pair: Gladstone's house to the garden's west corner, 3804 crop px, 1.08 miles, 19.7 minutes.
// STAMPS: each footprint covers its owner's true address point, usually at the stamp's corner. Derby's, Gladstone's and Balfour's houses
// are 234-480 crop px apart (50-100 px settled, under a 150 px stamp) and lie close to the ring's north-east edge (Gladstone 27, Derby
// 46 crop px in), so those stamps overlap slightly and Gladstone's and Derby's outer corners lie over the line. All five addresses are inside it.
//
// SOURCES: animation_source/assets_raw/SOURCES.txt. Map: Stanford's Library Map of London, sheet 10, 1877 edition (NOT 1862: same
// plates, revised), David Rumsey via Internet Archive; bake scripts/clips/wip-victorians/bake-walk.py. Portraits, public domain, Commons,
// scripts/clips/wip-victorians/bake-walk-men.py (bake-photo.py with a person matte): Gladstone 1892 (S. A. Walker), Salisbury (Elliott & Fry), Balfour (Bain, LOC), Rosebery (Elliott &
// Fry), Derby (W. & D. Downey). Eton: all five on the Windsor Local History Group's list. Addresses, Survey of London + Historic England
// (SOURCES.txt FACTS): Gladstone 11 Carlton House Terrace 1856-75; Salisbury 20 Arlington Street; Balfour 4 Carlton Gardens 1874-97,
// 1908-29; Rosebery 38 Berkeley Square; Derby 23 (now 33) St James's Square 1854-69, printed on this very sheet as "Ld Derby London Ho."
// The five did not all live there at once. Points on the sheet read by eye from the street names; no addresses on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CaptionBandsDebug,
  INDIGO,
  InkPrint,
  PaperGround,
  Postmark,
  PrintPhoto,
  RED,
  SERIF,
  SERIF_WEIGHT,
  Stamp,
  THEMES,
  WipFilmLife,
  WipPlane,
  inkOn,
  inkPress,
  runWipCamera,
  slide,
  stampPress,
  textRise,
} from "../kits/works-in-progress/wipShared";

export const FPS = 24;
export const DURATION = 186;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// -- the page: the block, and under it the ring's centre ------------------------------------------------
const BX = 540;
const BY = 800;
const SW = 190;
const SH = 236;
const STAMP_BORDER = 10.5;
const WIN_W = SW - 2 * STAMP_BORDER;
const WIN_H = SH - 2 * STAMP_BORDER;

// -- the map, in the Stanford crop's own px (O), mapped to world px so the ring's centre lies under the block ---------
const KF = 150 / 190; // the settled zoom: a stamp is 150 px wide on the settled frame
const RING_O = 1.1 * 3508; // 20 minutes at 3.3 mph, in crop px
const SCREEN_PER_O = 810 / RING_O; // the ring is 810 px across when settled
const WORLD_PER_O = SCREEN_PER_O / KF;
const RING_OX = 4203;
const RING_OY = 2533;
const wx = (ox: number) => BX + (ox - RING_OX) * WORLD_PER_O;
const wy = (oy: number) => BY + (oy - RING_OY) * WORLD_PER_O;
const MAP_OX0 = 2058; // bake-walk.py BOX
const MAP_OY0 = 461;
const MAP_OX1 = 6346;
const MAP_OY1 = 4606;
const MAP_X = wx(MAP_OX0);
const MAP_Y = wy(MAP_OY0);
const MAP_W = (MAP_OX1 - MAP_OX0) * WORLD_PER_O;
const MAP_H = (MAP_OY1 - MAP_OY0) * WORLD_PER_O;
const RING_R = (RING_O / 2) * WORLD_PER_O;

// The camera, keyed early for the tracker's lag. Settled: the map at x 90..990, y 190..1060.
const END_CX = 540 - (90 + (RING_OX - MAP_OX0) * SCREEN_PER_O - 540) / KF;
const END_CY = BY - (190 + (RING_OY - MAP_OY0) * SCREEN_PER_O - 960) / KF;
// A steady push from before f0 to f92 (the zoom runs in log space, so one rate), the block about 640 px wide at its peak, then the pull-back.
const K_START = 0.93;
const K_BLOCK = 1.15;
const camAt = runWipCamera(
  [
    { f: -30, x: BX, y: BY + 160 / K_START, k: K_START },
    { f: 92, x: BX, y: BY + 200 / K_BLOCK, k: K_BLOCK, ease: "linear" },
    { f: 146, x: END_CX, y: END_CY, k: KF * 1.012 },
    { f: DURATION, x: END_CX, y: END_CY, k: KF, ease: "linear" },
  ],
  DURATION,
);

// -- the map's ink spreads from under the block. The edge starts as a slightly wobbling circle and squares up as it grows (a superellipse,
// exponent 2 -> 40), so it meets the print's straight edges square on and never shows a diagonal across the map's corner ----------------
const REVEAL_START = 88;
const REVEAL_DUR = 30;
const REVEAL_R0 = 235; // still under the block's stamps
const REVEAL_R1 = 660; // past the print's edges, its corners included (half-width 570, half-height 551)
const revealClip = (frame: number) => {
  const t = slide(frame, REVEAL_START, REVEAL_DUR);
  const a = REVEAL_R0 + (REVEAL_R1 - REVEAL_R0) * t;
  const p = 2 + 38 * t ** 1.5;
  const pts: string[] = [];
  const cx = BX - MAP_X;
  const cy = BY - MAP_Y;
  for (let i = 0; i < 360; i++) {
    const th = (i / 360) * Math.PI * 2;
    const c = Math.cos(th);
    const n = Math.sin(th);
    const r = a / (Math.abs(c) ** p + Math.abs(n) ** p) ** (1 / p);
    const w = 1 + (1 - t) * (0.018 * Math.sin(5 * th + 1.3) + 0.012 * Math.sin(11 * th + 0.4) + 0.008 * Math.sin(23 * th + 2.1));
    pts.push(`${(cx + c * r * w).toFixed(2)}px ${(cy + n * r * w).toFixed(2)}px`);
  }
  return `polygon(${pts.join(",")})`;
};

// -- the five men -----------------------------------------------------------------------------------------------------
// f0 a loose row of x 90..990, zigzag, so 190 px stamps fit; the block is 3 over 2, perforations touching, at (BX, BY).
// lift -> contact in the deal; `at` the stamp's settled centre (crop px); `addr` the true point its footprint covers.
type Man = {
  name: string;
  x0: number;
  y0: number;
  r0: number;
  sx: number;
  sy: number;
  at: [number, number];
  addr: [number, number];
  rEnd: number;
  lift: number;
  img: { w: number; left: number; top: number; aspect: number };
};
const CONTACT_AFTER = 16;
const MEN: Man[] = [
  { name: "rosebery", x0: 185, y0: 672, r0: -2.2, sx: BX - SW, sy: BY - SH / 2, at: [4040, 1130], addr: [3700, 700], rEnd: 0.6, lift: 124, img: { w: 169, left: 0, top: -5, aspect: 0.7444 } },
  { name: "balfour", x0: 362, y0: 930, r0: 1.8, sx: BX - SW / 2, sy: BY + SH / 2, at: [5357, 2224], addr: [5700, 1790], rEnd: -0.5, lift: 114, img: { w: 189, left: -15.7, top: -2, aspect: 0.8681 } },
  { name: "salisbury", x0: 540, y0: 668, r0: 1.4, sx: BX, sy: BY - SH / 2, at: [4688, 1380], addr: [4570, 1530], rEnd: 1, lift: 119, img: { w: 189, left: -19, top: -12, aspect: 0.7167 } },
  { name: "gladstone", x0: 717, y0: 934, r0: -1.6, sx: BX + SW / 2, sy: BY + SH / 2, at: [5857, 2150], addr: [5925, 1725], rEnd: 0.8, lift: 104, img: { w: 196, left: -9, top: -8, aspect: 0.8167 } },
  { name: "derby", x0: 895, y0: 676, r0: 2.4, sx: BX + SW, sy: BY - SH / 2, at: [5302, 1564], addr: [5637, 1312], rEnd: -0.8, lift: 109, img: { w: 216, left: -23.5, top: -5, aspect: 0.7653 } },
];
// Paint order: stamps still in the block lowest, then by lift: a stamp in flight passes over the block, and a later one lands on top.
const paintOrder = (frame: number) => [...MEN].sort((a, b) => (frame >= a.lift ? a.lift : 0) - (frame >= b.lift ? b.lift : 0));

const MEET_START = 22;
const MEET_DUR = 24; // settled at f46, in "integration"
const POSTMARK_CONTACT = 78;
const POSTMARK_SIZE = 480;
const DRAIN_START = 90;
const DRAIN_DUR = 18;

const StampFace: React.FC<{ m: Man; frame: number }> = ({ m, frame }) => (
  <>
    <div style={{ position: "absolute", left: STAMP_BORDER, top: STAMP_BORDER, width: WIN_W, height: WIN_H, overflow: "hidden", backgroundColor: "#DDD9CC" }}>
      <div style={{ position: "absolute", left: m.img.left, top: m.img.top, width: m.img.w, height: m.img.w / m.img.aspect }}>
        <PrintPhoto src={`wip-victorians/tw_${m.name}.png`} seed={m.name} />
      </div>
    </div>
    {/* the mark printed across the whole block; it drains into the paper before the deal. The multiply sits on the wrapper because opacity makes a group */}
    {frame < DRAIN_START + DRAIN_DUR ? (
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 1 - slide(frame, DRAIN_START, DRAIN_DUR) }}>
        <Postmark x={SW / 2 + BX - m.sx} y={SH / 2 + BY - m.sy} size={POSTMARK_SIZE} ink={RED} theme="offwhite" seed="eton-college" rotate={-7} shape="single" top="ETON COLLEGE" wear={0.3} press={inkPress(frame, POSTMARK_CONTACT)} />
      </div>
    ) : null}
  </>
);

const manPose = (m: Man, frame: number) => {
  const meet = slide(frame, MEET_START, MEET_DUR);
  const contact = m.lift + CONTACT_AFTER;
  const deal = slide(frame, m.lift, CONTACT_AFTER);
  const bx = m.x0 + (m.sx - m.x0) * meet;
  const by = m.y0 + (m.sy - m.y0) * meet;
  const x = bx + (wx(m.at[0]) - bx) * deal;
  const y = by + (wy(m.at[1]) - by) * deal;
  const rotate = (m.r0 + (0 - m.r0) * meet) + (m.rEnd * deal);
  const up = frame <= m.lift ? 1 : frame < contact - 7 ? interpolate(frame, [m.lift, m.lift + 6], [1, 0.42], clamp) : Math.max(0.42, stampPress(frame, contact));
  return { x, y, rotate, press: up };
};

// -- the ring: an arc from its moving tip, clockwise from the top. Not a dash: the path itself grows ---------------------
const RING_START = 110;
const RING_END = 138;
const RING_W = 13;
const ringArc = (frame: number) => {
  const t = interpolate(frame, [RING_START, RING_END], [0, 1], clamp);
  if (t <= 0) return "";
  const c = RING_R + 30;
  const a1 = -Math.PI / 2 + Math.min(t, 0.9999) * Math.PI * 2;
  const x1 = c + Math.cos(a1) * RING_R;
  const y1 = c + Math.sin(a1) * RING_R;
  return `M${c} ${c - RING_R}A${RING_R} ${RING_R} 0 ${t > 0.5 ? 1 : 0} 1 ${x1} ${y1}${t >= 1 ? "Z" : ""}`;
};

// -- the two names, true places, in world px ------------------------------------------------------------------------------
const LABEL_SIZE = 58 / KF;
const LABELS = [
  { text: "Mayfair", x: wx(3400), y: wy(1770), start: 151 },
  { text: "Belgravia", x: wx(3135), y: wy(3330), start: 163 },
];
const PAPER = THEMES.mint.paper;
const HALO = [8, 16, 26].map((b) => `0 0 ${b / KF}px ${PAPER}`).join(", ");
/** One name: `halo` is the paper-coloured knock-back on the normal plane under it, otherwise the solid indigo on the ink plane. */
const Label: React.FC<{ l: (typeof LABELS)[number]; frame: number; halo?: boolean }> = ({ l, frame, halo = false }) =>
  frame >= l.start ? (
    <div
      style={{
        position: "absolute",
        left: l.x - 500,
        top: l.y - LABEL_SIZE * 0.6,
        width: 1000,
        textAlign: "center",
        fontFamily: SERIF,
        fontWeight: SERIF_WEIGHT,
        fontSize: LABEL_SIZE,
        lineHeight: 1.2,
        color: halo ? "transparent" : inkOn(INDIGO),
        textShadow: halo ? `${HALO}, ${HALO}` : undefined,
        ...textRise(frame, l.start, 12, 22),
      }}
    >
      {l.text}
    </div>
  ) : null;

const TwentyMinuteWalk: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const box = 2 * (RING_R + 30);
  const arc = ringArc(frame);
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} d={1.7} />
        <WipPlane cam={cam} ink>
          {frame >= REVEAL_START ? (
            <div style={{ position: "absolute", left: MAP_X, top: MAP_Y, width: MAP_W, height: MAP_H, clipPath: revealClip(frame) }}>
              <Img src={staticFile("wip-victorians/tw_map.jpg")} style={{ position: "absolute", inset: 0, width: MAP_W, height: MAP_H, maxWidth: "none" }} />
              <div style={{ position: "absolute", inset: 0, border: "5px solid #3B4A46", boxSizing: "border-box" }} />
            </div>
          ) : null}
          {arc ? (
            <InkPrint x={BX - box / 2} y={BY - box / 2} w={box} h={box} ink={RED} seed="ring" rough={1.3} wear={0.22} misregister={1.2}>
              <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                <path d={arc} fill="none" stroke="currentColor" strokeWidth={RING_W} strokeLinecap="round" />
              </svg>
            </InkPrint>
          ) : null}
        </WipPlane>
        <WipPlane cam={cam}>
          {LABELS.map((l) => (
            <Label key={l.text} l={l} frame={frame} halo />
          ))}
        </WipPlane>
        <WipPlane cam={cam} ink>
          {LABELS.map((l) => (
            <Label key={l.text} l={l} frame={frame} />
          ))}
        </WipPlane>
        <WipPlane cam={cam}>
          {paintOrder(frame).map((m) => {
            const p = manPose(m, frame);
            return (
              <Stamp key={m.name} x={p.x} y={p.y} w={SW} h={SH} rotate={p.rotate} press={p.press} border={0} seed={m.name} window="#EFE9DB">
                <Img src={staticFile("wip-anthropic/stamp_paper.jpg")} style={{ position: "absolute", left: -60, top: -60, width: 900, height: 900, maxWidth: "none" }} />
                <StampFace m={m} frame={frame} />
              </Stamp>
            );
          })}
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default TwentyMinuteWalk;
