// ---------------------------------------------------------------------------
// YaDivisionsClosed (wip-ya-boom, cut 29). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx) with the clip's materials (./yaShared.tsx), in the clip's
// approved stripped-down look (hard cuts, still camera, full colour, no photocopy grade).
// Opaque 1080x1920, 24 fps, 90 frames.
//
// BEAT MAP (hard cuts; each lands about 4 frames after the word's Whisper onset):
//   f0   the Penguin Random House slip, already taped on the page ("Penguin" f2)
//   f16  the HarperCollins slip cuts in, with its tape ("HarperCollins" f12)
//   f37  the Hachette Book Group slip cuts in, with its tape ("Hachette" f33)
//   f51  a red rubber-stamp CLOSED cuts in whole on each of the three slips, all in the same frame ("closed" f47)
//   f51-f89 held; only the paper grain lives
//
// CHECK LINE: "Penguin, HarperCollins and Hachette: closed". With no sound: the three publishers' own logos on paper slips,
// one after another, then the same red CLOSED rubber stamp struck on every one of them.
//
// THE LINE: "Penguin, HarperCollins, and Hachette all closed their YA divisions."
// WORD -> FRAME: Penguin 2 · HarperCollins 12 · and 30 · Hachette 33 · all 42 · closed 47 · their 56 · YA 64 · divisions 70 ·
// (next line: What 89) (table_29_YaDivisionsClosed.txt; f0 = 29.583 s in the Nov 9 edit)
// DURATION: the slot 29.583 -> 33.333 s = 3.75 s x 24 = 90 frames (f0..f89).
//
// THE MOTION: none. One still framing of the page (k 1.0 about (540, 960)); every change of state is a hard cut on its word
// (beat map above): a slip and its tape are on the page or they are not, and each stamp is complete, ink already in the paper,
// on its frame (no press, no slam). The frame lives through the paper grain only.
// Framing: the three slips (860 wide) are a crooked column, each overlapping the next a little. Measured on the rendered f89:
// all logo and stamp ink inside x 141-961, y 349-1008 (above the caption bands y 1080-1250 / 1360-1460); the Hachette slip's
// blank paper ends at about y 1075.
// SPOT INK: red = the CLOSED rubber stamp (the user asked for "a 'closed' stamp or something"; the one new graphic thing).
// Real colour: the publishers' own logo colours (the clip's rev 3 look).
// No "YA" label: the optional f68 label was left out (the caption carries "YA"; the stamp is the one mark).
//
// SOURCES: the publishers' own marks: cut 51's slips, re-cut to this cut's margins by scripts/clips/wip-ya-boom/bake-YaDivisionsClosed.py
// (public/wip-ya-boom/ydc_logo_*.svg) from those baked for cut 51 (scripts/clips/wip-ya-boom/bake-FewBigHitters.py:
// Penguin Random House and Hachette Book Group official SVGs, HarperCollins from Wikipedia/Commons; SOURCES.txt in
// animation_source/assets_raw/). "Penguin" in the line = Penguin Random House, as in cut 51. No figures.
// Fact note (the director's): the closures were imprints closed or folded, more than whole "divisions"; the picture draws
// exactly what the line says.
// ---------------------------------------------------------------------------
import { loadFont as loadStampFont } from "@remotion/google-fonts/Anton";
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, InkPrint, PaperGround, RED, WipCam, WipFilmLife, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";
import { THEME, Tape, XeroxCutOut } from "./yaShared";

export const FPS = 24;
export const DURATION = 90;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const { fontFamily: STAMP_FONT } = loadStampFont("normal", { weights: ["400"], subsets: ["latin"] });

// -- camera: one still framing ---------------------------------------------------------------------------------------
const CAM: WipCam = runWipCamera([{ f: -12, x: 540, y: 960, k: 1 }], DURATION)(0);

// -- the three slips -------------------------------------------------------------------------------------------------
// ydc_logo_*.svg: cut 51's colour logo slips re-cut by scripts/clips/wip-ya-boom/bake-YaDivisionsClosed.py to an even
// margin round the mark plus blank paper on the right, where the stamp is struck (so the stamp's lettering lands on paper,
// not on the logo's black type, and the logo stays whole). Mark spans of the slip's width (the bake prints them):
// prh 0.045-0.686, harpercollins 0.058-0.681, hachette 0.050-0.684. The stamp overlaps each mark's last ~30-45 px.
type Slip = {
  name: string;
  src: string;
  aspect: number;
  w: number;
  x: number;
  y: number;
  rotate: number;
  cut: number;
  tape: { at: "tl" | "tr" | "bl" | "br"; angle: number }[];
  stamp: { dx: number; dy: number; rotate: number; w: number };
  stampSeed?: string; // picks the strike's wear pattern (one that keeps all six letters readable)
};
const SLIP_W = 860;
const SLIPS: Slip[] = [
  {
    name: "prh",
    src: "wip-ya-boom/ydc_logo_prh.svg",
    aspect: 2.8274,
    w: SLIP_W,
    x: 532,
    y: 472,
    rotate: 1.8,
    cut: 0,
    tape: [
      { at: "tl", angle: -40 },
      { at: "br", angle: -38 },
    ],
    stamp: { dx: 276, dy: 16, rotate: -10, w: 300 },
  },
  {
    name: "harpercollins",
    src: "wip-ya-boom/ydc_logo_harpercollins.svg",
    aspect: 4.7187,
    w: SLIP_W,
    x: 548,
    y: 727,
    rotate: -1.4,
    cut: 16,
    tape: [{ at: "tr", angle: 40 }],
    stamp: { dx: 262, dy: 2, rotate: 6, w: 290 },
  },
  {
    name: "hachette",
    src: "wip-ya-boom/ydc_logo_hachette.svg",
    aspect: 3.7849,
    w: SLIP_W,
    x: 532,
    y: 939,
    rotate: 1.2,
    cut: 37,
    tape: [{ at: "bl", angle: 38 }],
    stamp: { dx: 272, dy: -2, rotate: -4, w: 300 },
    stampSeed: "-b",
  },
];
const STAMP_CUT = 51;

// -- the CLOSED rubber stamp -----------------------------------------------------------------------------------------
// Red ink in the paper (InkPrint on an ink plane: rough rubber edge, dry spots, a faint second strike), a double border,
// the word in a heavy condensed face. Each strike differs: rotation, the side that took less pressure (a gradient over
// the strike), its wear pattern (seed).
const STAMP_ASPECT = 2.75;
const ClosedStamp: React.FC<{ x: number; y: number; w: number; rotate: number; seed: string }> = ({ x, y, w, rotate, seed }) => {
  const h = w / STAMP_ASPECT;
  const u = w / 380;
  const ow = 9 * u; // outer border weight
  const iw = 3.2 * u; // inner rule
  const gap = 7 * u;
  const r = 12 * u;
  const fs = h * 0.62;
  const P = w * 0.25;
  // the light side: the strike rocked, one end inked heavier. The mask sits outside InkPrint (its ink-gain threshold would
  // re-solidify a partial alpha) on a box padded by P, so the turned strike's corners stay inside it.
  const ang = Math.floor(random(`${seed}-pa`) * 360);
  const lo = 0.68 + random(`${seed}-pl`) * 0.14;
  const fade = `linear-gradient(${ang}deg, rgba(0,0,0,${lo.toFixed(2)}) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,1) 100%)`;
  return (
    <div style={{ position: "absolute", left: x - w / 2 - P, top: y - h / 2 - P, width: w + 2 * P, height: h + 2 * P, maskImage: fade, WebkitMaskImage: fade }}>
      <InkPrint x={P} y={P} w={w} h={h} ink={RED} theme={THEME} seed={seed} rotate={rotate} wear={0.42} rough={2.2 * u} misregister={1.5 * u}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <rect x={ow / 2} y={ow / 2} width={w - ow} height={h - ow} rx={r} fill="none" stroke="currentColor" strokeWidth={ow} />
          <rect x={ow + gap} y={ow + gap} width={w - 2 * (ow + gap)} height={h - 2 * (ow + gap)} rx={r * 0.5} fill="none" stroke="currentColor" strokeWidth={iw} />
          <text
            x={w / 2}
            y={h / 2 + fs * 0.36}
            textAnchor="middle"
            fontFamily={STAMP_FONT}
            fontSize={fs}
            letterSpacing={fs * 0.06}
            fill="currentColor"
          >
            CLOSED
          </text>
        </svg>
      </InkPrint>
    </div>
  );
};

const rot = (dx: number, dy: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
};

const YaDivisionsClosed: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = CAM;
  return (
    <>
      <WipFilmLife frame={frame} theme={THEME}>
        <PaperGround cam={cam} theme={THEME} />
        {SLIPS.map((s) =>
          frame < s.cut ? null : (
            <WipPlane cam={cam} key={s.name}>
              <XeroxCutOut
                colour
                src={s.src}
                kind="cover"
                x={s.x}
                y={s.y}
                w={s.w}
                aspect={s.aspect}
                border={11}
                rotate={s.rotate}
                seed={`ydc-${s.name}`}
              />
              {s.tape.map((t, i) => {
                const h = s.w / s.aspect;
                const p = rot((t.at[1] === "l" ? -1 : 1) * (s.w / 2 - 14), (t.at[0] === "t" ? -1 : 1) * (h / 2 - 8), s.rotate);
                return <Tape key={i} x={s.x + p.x} y={s.y + p.y} len={118} width={36} angle={t.angle + s.rotate} seed={`ydc-${s.name}-tape${i}`} />;
              })}
            </WipPlane>
          ),
        )}
        <WipPlane cam={cam} ink>
          {frame >= STAMP_CUT &&
            SLIPS.map((s) => {
              const p = rot(s.stamp.dx, s.stamp.dy, s.rotate);
              return <ClosedStamp key={s.name} x={s.x + p.x} y={s.y + p.y} w={s.stamp.w} rotate={s.stamp.rotate} seed={`ydc-stamp-${s.name}${s.stampSeed ?? ""}`} />;
            })}
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default YaDivisionsClosed;
