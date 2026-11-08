// ---------------------------------------------------------------------------
// FewBigHitters (wip-ya-boom, cut 51). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx) with the clip's materials (./yaShared.tsx).
// Opaque 1080x1920, 24 fps, 144 frames.
//
// REV 3 (Nov 8, "bring back all the colors"): rev 2's cuts, framing and layout unchanged; every cover and portrait in its
// own colour (baked with bake-photo.py --colour, XeroxCutOut `colour`: no photocopy grade, the scissored margin, tape and
// shadow stay), the publisher logos in their real brand colours on their paper slips; the red ring stays.
// BEAT MAP (rev 2, hard cuts; each cut lands about 4 frames after the word's Whisper onset):
//   f0   the Bestsellers list (header, eight empty ruled slots) and the four authors' portraits under it, already pasted
//   f14  covers 1-4 cut in, with their tape: It Ends with Us, Fourth Wing, Verity, Onyx Storm ("charts" f10)
//   f25  covers 5-6 cut in: The Housemaid, It Starts with Us ("dominated" f21)
//   f42  covers 7-8 cut in: Iron Flame, A Court of Thorns and Roses ("dwindling" f38)
//   f68  the red felt-tip ring round the four faces cuts in whole ("big" f64, "big hitting authors")
//   f107 the Big Five slips all cut in at once, pressed in ("publishing" f103, "publishing houses")
//   f107-f143 held; only the paper grain lives
//
// CHECK LINE: "the bestseller chart is now filled by the same few authors, and all the big publishers are crowding round
// them". With no sound: a printed "Bestsellers" list fills with real covers by only four authors (Colleen Hoover and
// Rebecca Yarros three times each), the four authors' cut-out portraits under it get one red ring, and the logos of the
// Big Five publishers are suddenly pressed in all round them.
//
// THE LINE: "Today's book charts are dominated by a dwindling number of big hitting authors that all of the publishing houses
// are competing for."
// WORD -> FRAME: book 6 · charts 10 · dominated 21 · dwindling 38 · number 51 · big 64 · hitting 70 · authors 76 · all 90 ·
// publishing 103 · houses 112 · competing 126 · for 132 (table_51_FewBigHitters.txt; f0 = 51.750 s)
// DURATION: the slot 51.750 -> 57.750 s = 6 s x 24 = 144 frames (f0..f143).
//
// THE MOTION (rev 2, "still a bit over the top, it can be more stripped down"): no motion. One still framing of the
// page (k 1.0 about (540, 962): the approved settled frame) holds everything at a readable size; every change of state is a
// hard cut on its word (beat map above). Nothing slides, slaps or draws on; the ring is complete on its frame; the slips
// arrive pressed in place (two over the list's top edge, three tucked under the authors' bodies). The frame lives through
// the paper grain only.
// Framing: the list and the four faces (face-box bottoms at y 1044) sit above y 1080; the portraits' torsos and the bottom
// slips' blank paper cross the bands; the bottom slips' printed marks start below y 1460 (about y 1470).
// SPOT INK: red = the editor's felt-tip marking "the same few" (the ring round the four authors). Real colour: the covers,
// the portraits and the publishers' own logo colours (rev 3).
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
import { CaptionBandsDebug, MONO, PaperGround, WipCam, WipFilmLife, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";
import { COPY_WHITE, MarkerPath, THEME, TONER_BLACK, Tape, TapeSpec, XeroxCutOut, pasteShadow, scissorPath } from "./yaShared";

export const FPS = 24;
export const DURATION = 144;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// -- camera: one still framing ---------------------------------------------------------------------------------------
const CX = 540;
const CY = 962;
const CAM: WipCam = runWipCamera([{ f: -12, x: CX, y: CY, k: 1 }], DURATION)(0);

// -- the list page ----------------------------------------------------------------------------------------------------
const PAGE = { x: 216, y: 270, w: 648, h: 592, rotate: -0.8 };
const COVER_W = 136;
const COVER_H = 208;
const COLS = [0, 1, 2, 3].map((i) => CX + (i - 1.5) * 156);
const ROW_TOP = [364, 614]; // top of each slot row (the slot box starts 26 px lower)
const SLOT_Y = ROW_TOP.map((t) => t + 28 + COVER_H / 2); // cover centres

type Cover = { name: string; src: string; aspect: number; rotate: number; tape?: TapeSpec[]; gamma?: number };
// slot order = landing order (1..8). Hoover 1 3 6, Yarros 2 4 7, McFadden 5, Maas 8.
const COVERS: Cover[] = [
  { name: "itendswithus", src: "wip-ya-boom/fbh_itendswithus.png", aspect: 579 / 900, rotate: -2.4, tape: [{ at: "t", along: 0.5, len: 70, width: 26 }] },
  { name: "fourthwing", src: "wip-ya-boom/fbh_fourthwing.png", aspect: 589 / 900, rotate: 1.8 },
  { name: "verity", src: "wip-ya-boom/fbh_verity.png", aspect: 602 / 900, rotate: -1.2, gamma: 0.85 },
  { name: "onyxstorm", src: "wip-ya-boom/fbh_onyxstorm.png", aspect: 600 / 900, rotate: 2.9, gamma: 0.9, tape: [{ at: "tr", len: 74, width: 26 }] },
  { name: "housemaid", src: "wip-ya-boom/fbh_housemaid.png", aspect: 591 / 900, rotate: 2.2 },
  { name: "itstartswithus", src: "wip-ya-boom/fbh_itstartswithus.png", aspect: 580 / 900, rotate: -2.8 },
  { name: "ironflame", src: "wip-ya-boom/fbh_ironflame.png", aspect: 600 / 900, rotate: 1.4, tape: [{ at: "b", along: 0.45, len: 70, width: 26 }] },
  { name: "acotar", src: "wip-ya-boom/fbh_acotar.png", aspect: 600 / 900, rotate: -2.0 },
];
// the frame each cover cuts in on: row 1 on "charts", 5-6 on "dominated", 7-8 on "dwindling"
const COVER_CUT = [14, 14, 14, 14, 25, 25, 42, 42];

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
const CHIN = 1044; // the face boxes' bottom, above the first band (y 1080)
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
const RING_CUT = 68;

// -- the Big Five, one cut -------------------------------------------------------------------------------------------
type Logo = { name: string; src: string; aspect: number; w: number; x: number; y: number; rotate: number };
const LOGO_CUT = 107;
// Pressed in round the list and the authors: two slips over the list's top edge (clear of the header) and three tucked under
// the portraits' lower edge (bodies only); their printed marks start below y 1460 (mark top at 0.52 / 0.61 / 0.62 of the
// slip's height, baked: mark tops ~y 1470-1478 with the tilt).
const TOP_LOGOS: Logo[] = [
  { name: "harpercollins", src: "wip-ya-boom/fbh_logo_harpercollins.svg", aspect: 3.7328, w: 380, x: 330, y: 252, rotate: -3.5 },
  { name: "simonschuster", src: "wip-ya-boom/fbh_logo_simonschuster.svg", aspect: 5.0186, w: 390, x: 752, y: 286, rotate: 3 },
];
const BOTTOM_LOGOS: Logo[] = [
  { name: "prh", src: "wip-ya-boom/fbh_logo_prh.svg", aspect: 1.1405, w: 270, x: 232, y: 1474, rotate: -4.5 },
  { name: "hachette", src: "wip-ya-boom/fbh_logo_hachette.svg", aspect: 1.3461, w: 270, x: 848, y: 1457, rotate: 4 },
  { name: "macmillan", src: "wip-ya-boom/fbh_logo_macmillan.svg", aspect: 1.534, w: 300, x: 540, y: 1460, rotate: 1.5 },
];
const FewBigHitters: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = CAM;
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
          {frame >= LOGO_CUT &&
            BOTTOM_LOGOS.map((l) => (
            <XeroxCutOut
              colour
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
              seed={`fbh-${l.name}`}
            />
          ))}
        </WipPlane>
        <WipPlane cam={cam}>
          {PEOPLE.map((p) => {
            const bx = personBox(p);
            return <XeroxCutOut colour key={p.name} src={p.src} kind="person" x={bx.x} y={bx.y} w={bx.w} aspect={p.aspect} rotate={p.rotate} flipX={p.flipX} gamma={p.gamma} seed={`fbh-${p.name}`} />;
          })}
        </WipPlane>
        <WipPlane cam={cam}>
          {COVERS.map((c, i) =>
            frame < COVER_CUT[i] ? null : (
            <XeroxCutOut
              colour
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
              seed={`fbh-${c.name}`}
            />
          ))}
        </WipPlane>
        <WipPlane cam={cam} ink>
          <MarkerPath shape={{ kind: "ring", cx: 530, cy: 974, rx: 400, ry: 110, tilt: -2, turns: 1.12 }} frame={frame} start={RING_CUT} progress={frame >= RING_CUT ? 1 : 0} seed="fbh-ring" theme={THEME} />
        </WipPlane>
        <WipPlane cam={cam}>
          {frame >= LOGO_CUT &&
            TOP_LOGOS.map((l) => (
            <XeroxCutOut
              colour
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
