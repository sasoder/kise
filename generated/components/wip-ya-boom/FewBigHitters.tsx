// ---------------------------------------------------------------------------
// FewBigHitters (wip-ya-boom, cut 51). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx) with the clip's materials (./yaShared.tsx).
// Opaque 1080x1920, 24 fps, 144 frames.
//
// CHECK LINE: "the bestseller chart is now filled by the same few authors, and all the big publishers are crowding round
// them". With no sound: a photocopied "Bestsellers" list fills with real covers by only four authors (Colleen Hoover and
// Rebecca Yarros three times each), the four authors' photocopied portraits under it get one red ring, and the logos of the
// Big Five publishers slide in from every side and press round them.
//
// THE LINE: "Today's book charts are dominated by a dwindling number of big hitting authors that all of the publishing houses
// are competing for."
// WORD -> FRAME: book 6 · charts 10 · dominated 21 · dwindling 38 · number 51 · big 64 · hitting 70 · authors 76 · all 90 ·
// publishing 103 · houses 112 · competing 126 · for 132 (table_51_FewBigHitters.txt; f0 = 51.750 s)
// DURATION: the slot 51.750 -> 57.750 s = 6 s x 24 = 144 frames (f0..f143).
//
// THE MOTION: one page. It opens close (k 1.36) on the list, its eight ruled slots empty, the four authors already pasted
// under it; the eight covers are slapped into the slots one every 6 frames, from above and the sides (contacts f2 8 14 20 26
// 32 38 44; each skids SKID_DUR 6 frames after contact, the skid being the first reaction), all down by "number" f51. On
// "big hitting authors" the red felt-tip rings the four faces in one loop (f60-f74, done before "authors" f76). The camera
// creeps back from f0 (k 1.36 -> 1.25 by f70), then pulls back to k 1.0 by ~f120 about the fixed centre (540, 962), while
// the five publishers' logos, printed on scissored copy-paper slips, slide in as one wave from the frame edges (starts
// f94-f102, 24 frames each, in sight from ~f98, all settled by f126 "competing") and press in: two over the list's top
// edge, three pushed up under the authors' bodies; f126-f143 they keep creeping inward a hair (still competing) under the camera's creep.
// Framing: the camera only zooms about (540, 962), so everything above screen y 1080 at k 1.36 stays above it: the list and
// the four faces (chins at world y <= 1046) are clear of the caption bands on every frame; the portraits' torsos cross the
// bands; the bottom logos' wordmarks land below y 1460.
// SPOT INK: red = the editor's felt-tip marking "the same few" (the ring round the four authors). No real colour: the logos
// are printed in one black ink.
//
// The list is a header and eight ruled slots only: no rank numbers, no section, no claim about a real chart.
// SOURCES (animation_source/assets_raw/SOURCES.txt): front covers (publisher art) of It Ends with Us, It Starts with Us,
// Verity (Colleen Hoover), Fourth Wing, Iron Flame, Onyx Storm (Rebecca Yarros), A Court of Thorns and Roses 2020 (Sarah J.
// Maas), The Housemaid (Freida McFadden); portraits: Hachette press photos of Hoover and McFadden, Maas's official site,
// Yarros at a 2024 signing; logos: the publishers' own marks (PRH, Hachette Book Group official SVGs; HarperCollins,
// Macmillan, Simon & Schuster from Wikipedia/Commons). The list is generic: no newspaper, no week, no rank claim about a real
// chart. Baked by scripts/clips/wip-ya-boom/bake-FewBigHitters.py into public/wip-ya-boom/fbh_*.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, MONO, PaperGround, WipCam, WipFilmLife, WipPlane, paperEase, runWipCamera } from "../kits/works-in-progress/wipShared";
import { COPY_WHITE, MarkerPath, Slap, THEME, TONER_BLACK, Tape, TapeSpec, XeroxCutOut, pasteShadow, scissorPath, slapDown } from "./yaShared";

export const FPS = 24;
export const DURATION = 144;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// -- camera: one zoom about a fixed centre --------------------------------------------------------------------------
const CX = 540;
const CY = 962;
const K0 = 1.36;
const camAt: (f: number) => WipCam = runWipCamera(
  [
    { f: -12, x: CX, y: CY, k: K0, ease: "linear" },
    { f: 70, x: CX, y: CY, k: 1.25, ease: "linear" },
    { f: 112, x: CX, y: CY, k: 1.0, ease: "linear" },
    { f: 200, x: CX, y: CY, k: 0.975, ease: "linear" },
  ],
  DURATION,
);

// -- the list page ----------------------------------------------------------------------------------------------------
const PAGE = { x: 216, y: 270, w: 648, h: 592, rotate: -0.8 };
const COVER_W = 136;
const COVER_H = 208;
const COLS = [0, 1, 2, 3].map((i) => CX + (i - 1.5) * 156);
const ROW_TOP = [364, 614]; // top of each slot row (the slot box starts 26 px lower)
const SLOT_Y = ROW_TOP.map((t) => t + 28 + COVER_H / 2); // cover centres

type Cover = { name: string; src: string; aspect: number; rotate: number; from: { x: number; y: number }; spin: number; tape?: TapeSpec[]; gamma?: number };
// slot order = landing order (1..8). Hoover 1 3 6, Yarros 2 4 7, McFadden 5, Maas 8.
const COVERS: Cover[] = [
  { name: "itendswithus", src: "wip-ya-boom/fbh_itendswithus.png", aspect: 579 / 900, rotate: -2.4, from: { x: -760, y: -620 }, spin: -10, tape: [{ at: "t", along: 0.5, len: 70, width: 26 }] },
  { name: "fourthwing", src: "wip-ya-boom/fbh_fourthwing.png", aspect: 589 / 900, rotate: 1.8, from: { x: -120, y: -1000 }, spin: 7 },
  { name: "verity", src: "wip-ya-boom/fbh_verity.png", aspect: 602 / 900, rotate: -1.2, from: { x: 220, y: -1000 }, spin: -8, gamma: 0.85 },
  { name: "onyxstorm", src: "wip-ya-boom/fbh_onyxstorm.png", aspect: 600 / 900, rotate: 2.9, from: { x: 820, y: -560 }, spin: 11, gamma: 0.9, tape: [{ at: "tr", len: 74, width: 26 }] },
  { name: "housemaid", src: "wip-ya-boom/fbh_housemaid.png", aspect: 591 / 900, rotate: 2.2, from: { x: -900, y: -60 }, spin: 9 },
  { name: "itstartswithus", src: "wip-ya-boom/fbh_itstartswithus.png", aspect: 580 / 900, rotate: -2.8, from: { x: -900, y: -380 }, spin: -9 },
  { name: "ironflame", src: "wip-ya-boom/fbh_ironflame.png", aspect: 600 / 900, rotate: 1.4, from: { x: 900, y: -380 }, spin: 8, tape: [{ at: "b", along: 0.45, len: 70, width: 26 }] },
  { name: "acotar", src: "wip-ya-boom/fbh_acotar.png", aspect: 600 / 900, rotate: -2.0, from: { x: 900, y: -60 }, spin: -10 },
];
const FIRST_CONTACT = 2;
const DEAL_EVERY = 6;
const contactOf = (i: number) => FIRST_CONTACT + i * DEAL_EVERY;

const ListPage: React.FC = () => {
  const b = 16;
  const pad = b * 2.4;
  return (
    <div style={{ position: "absolute", left: PAGE.x, top: PAGE.y, width: PAGE.w, height: PAGE.h, filter: pasteShadow(0, 0, 0.9) }}>
      <div style={{ position: "absolute", inset: 0, transform: `rotate(${PAGE.rotate}deg)` }}>
        <svg width={PAGE.w + 2 * pad} height={PAGE.h + 2 * pad} viewBox={`${-pad} ${-pad} ${PAGE.w + 2 * pad} ${PAGE.h + 2 * pad}`} style={{ position: "absolute", left: -pad, top: -pad }}>
          <path d={scissorPath(PAGE.w, PAGE.h, b, "fbh-page")} fill={COPY_WHITE} />
          {/* printed: the header rule and the ruled slots (thin toner lines, a little uneven) */}
          <rect x={22} y={102} width={PAGE.w - 44} height={4.5} fill={TONER_BLACK} opacity={0.9} />
          {ROW_TOP.map((t, r) =>
            COLS.map((cx, c) => {
              const x = cx - PAGE.x - COVER_W / 2 - 6;
              const y = t - PAGE.y + 26;
              return <rect key={`${r}-${c}`} x={x} y={y} width={COVER_W + 12} height={COVER_H + 8} fill="none" stroke={TONER_BLACK} strokeWidth={1.6} opacity={0.55} />;
            }),
          )}
          <rect x={22} y={ROW_TOP[1] - PAGE.y - 8} width={PAGE.w - 44} height={1.8} fill={TONER_BLACK} opacity={0.7} />
        </svg>
        <div style={{ position: "absolute", left: 24, top: 46, fontFamily: MONO, fontWeight: 400, fontSize: 44, letterSpacing: -0.5, color: TONER_BLACK, opacity: 0.92 }}>Bestsellers</div>
      </div>
    </div>
  );
};

// -- the four authors -------------------------------------------------------------------------------------------------
// faceX / chinY / faceH: the face box's centre x, bottom (chin) and height as fractions of the baked PNG (Apple Vision face
// rectangles). Paint order and spacing are solved from each matte's reach at the face rows (in face heights: Hoover's hair
// reaches +0.55 right, Maas's +0.61, Yarros' -0.98 left, McFadden's -0.73 left), so no paste covers a face it lies on:
// McFadden at the bottom, then Yarros, Maas, Hoover on top, the faces 1.15 / 1.2 / 1.0 face heights apart.
type Person = { name: string; src: string; aspect: number; faceX: number; chinY: number; faceH: number; fx: number; rotate: number; flipX?: boolean; gamma?: number };
const FACE = 140; // the face box's height, world px
const CHIN = 1044; // the face boxes' bottom: k 1.36 puts world y 1044 at screen 1072, above the first band; the zoom only lifts it
const PEOPLE: Person[] = [
  { name: "mcfadden", src: "wip-ya-boom/fbh_mcfadden.png", aspect: 839 / 1200, faceX: 0.525, chinY: 0.419, faceH: 0.316, fx: 765, rotate: 2.4 },
  { name: "yarros", src: "wip-ya-boom/fbh_yarros.png", aspect: 686 / 1200, faceX: 0.683, chinY: 0.342, faceH: 0.285, fx: 625, rotate: -1.6 },
  { name: "maas", src: "wip-ya-boom/fbh_maas.png", aspect: 436 / 623, faceX: 0.493, chinY: 0.377, faceH: 0.265, fx: 457, rotate: 1.5 },
  { name: "hoover", src: "wip-ya-boom/fbh_hoover.png", aspect: 707 / 1200, faceX: 0.402, chinY: 0.423, faceH: 0.277, fx: 296, rotate: -2, gamma: 1.2 },
];
const personBox = (p: Person) => {
  const h = FACE / p.faceH;
  const w = h * p.aspect;
  return { w, h, x: p.fx + (0.5 - p.faceX) * w, y: CHIN + (0.5 - p.chinY) * h };
};

// -- the red ring: "the same few" -------------------------------------------------------------------------------------
const RING_START = 60;
const RING_DUR = 14;

// -- the Big Five, one wave -------------------------------------------------------------------------------------------
type Logo = { name: string; src: string; aspect: number; w: number; x: number; y: number; rotate: number; from: { x: number; y: number }; start: number };
const SLIDE_DUR = 24;
// A ring pressing in round the list and the authors: two slips over the list's top edge (clear of the header) and three
// pushed up from below, tucked under the portraits' lower edge (bodies only); their printed marks sit below y 1460 on every
// frame (mark top at 0.52 / 0.61 / 0.62 of the slip's height, baked: rest mark tops ~y 1478, creep and tilt keep them > 1466).
// Each slides in from its nearest frame edge.
const TOP_LOGOS: Logo[] = [
  { name: "harpercollins", src: "wip-ya-boom/fbh_logo_harpercollins.svg", aspect: 3.7328, w: 380, x: 330, y: 252, rotate: -3.5, from: { x: -440, y: -240 }, start: 94 },
  { name: "simonschuster", src: "wip-ya-boom/fbh_logo_simonschuster.svg", aspect: 5.0186, w: 390, x: 752, y: 286, rotate: 3, from: { x: 440, y: -240 }, start: 96 },
];
const BOTTOM_LOGOS: Logo[] = [
  { name: "prh", src: "wip-ya-boom/fbh_logo_prh.svg", aspect: 1.1405, w: 270, x: 232, y: 1474, rotate: -4.5, from: { x: -460, y: 170 }, start: 98 },
  { name: "hachette", src: "wip-ya-boom/fbh_logo_hachette.svg", aspect: 1.3461, w: 270, x: 848, y: 1457, rotate: 4, from: { x: 460, y: 170 }, start: 100 },
  { name: "macmillan", src: "wip-ya-boom/fbh_logo_macmillan.svg", aspect: 1.534, w: 300, x: 540, y: 1460, rotate: 1.5, from: { x: 0, y: 420 }, start: 102 },
];
// After the slide each slip keeps pressing inward, toward the authors, a hair a frame.
const PRESS_IN = 0.3;
const logoSlide = (frame: number, l: Logo): Slap => {
  if (frame < l.start) return { dx: l.from.x, dy: l.from.y, rotate: 0, scale: 1, lift: 0.4, press: 0, shown: false };
  const u = paperEase(Math.min(1, (frame - l.start) / SLIDE_DUR));
  const land = l.start + SLIDE_DUR;
  const d = Math.hypot(l.from.x, l.from.y);
  const creep = Math.max(0, frame - land) * PRESS_IN;
  const press = frame < land ? 0 : Math.sin(Math.min(1, (frame - land) / 5) * Math.PI) * 0.6;
  return {
    dx: l.from.x * (1 - u) - (l.from.x / Math.max(d, 1)) * creep,
    dy: l.from.y * (1 - u) - (l.from.y / Math.max(d, 1)) * creep,
    rotate: (1 - u) * (l.rotate > 0 ? -5 : 5),
    scale: 1,
    lift: 0.35 * (1 - u),
    press,
    shown: true,
  };
};

const FewBigHitters: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <>
      <WipFilmLife frame={frame} theme={THEME}>
        <PaperGround cam={cam} theme={THEME} />
        <WipPlane cam={cam}>
          <ListPage />
          <Tape x={PAGE.x + 70} y={PAGE.y - 4} len={120} width={36} angle={-38} seed="fbh-page-tl" />
          <Tape x={PAGE.x + PAGE.w - 60} y={PAGE.y - 2} len={120} width={36} angle={40} seed="fbh-page-tr" />
        </WipPlane>
        <WipPlane cam={cam}>
          {BOTTOM_LOGOS.map((l) => (
            <XeroxCutOut
              key={l.name}
              src={l.src}
              kind="cover"
              x={l.x}
              y={l.y}
              w={l.w}
              aspect={l.aspect}
              border={10}
              rotate={l.rotate}
              contrast={0.45}
              speckle={0.4}
              edge={0.15}
              slap={logoSlide(frame, l)}
              seed={`fbh-${l.name}`}
            />
          ))}
        </WipPlane>
        <WipPlane cam={cam}>
          {PEOPLE.map((p) => {
            const bx = personBox(p);
            return <XeroxCutOut key={p.name} src={p.src} kind="person" x={bx.x} y={bx.y} w={bx.w} aspect={p.aspect} rotate={p.rotate} flipX={p.flipX} gamma={p.gamma} seed={`fbh-${p.name}`} />;
          })}
        </WipPlane>
        <WipPlane cam={cam}>
          {COVERS.map((c, i) => (
            <XeroxCutOut
              key={c.name}
              src={c.src}
              kind="cover"
              x={COLS[i % 4] + (random(`fbh-cx-${c.name}`) - 0.5) * 6}
              y={SLOT_Y[Math.floor(i / 4)] + (random(`fbh-cy-${c.name}`) - 0.5) * 6}
              w={COVER_W}
              aspect={COVER_W / COVER_H}
              border={8}
              rotate={c.rotate}
              tape={c.tape}
              gamma={c.gamma}
              slap={slapDown(frame, contactOf(i), { from: c.from, spin: c.spin, skid: 7 })}
              seed={`fbh-${c.name}`}
            />
          ))}
        </WipPlane>
        <WipPlane cam={cam} ink>
          <MarkerPath shape={{ kind: "ring", cx: 530, cy: 974, rx: 400, ry: 110, tilt: -2, turns: 1.12 }} frame={frame} start={RING_START} dur={RING_DUR} seed="fbh-ring" theme={THEME} />
        </WipPlane>
        <WipPlane cam={cam}>
          {TOP_LOGOS.map((l) => (
            <XeroxCutOut
              key={l.name}
              src={l.src}
              kind="cover"
              x={l.x}
              y={l.y}
              w={l.w}
              aspect={l.aspect}
              border={10}
              rotate={l.rotate}
              contrast={0.45}
              speckle={0.4}
              edge={0.15}
              slap={logoSlide(frame, l)}
              seed={`fbh-${l.name}`}
            />
          ))}
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default FewBigHitters;
