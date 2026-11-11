// ---------------------------------------------------------------------------
// TraitsOverlap (wip-taylor-swift, cut 14). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 124 frames.
//
// CHECK LINE: "Taylor Swift's well-documented public life and the autism spectrum are two circles that overlap, and the
// overlap is marked." With no sound: a pile of press photos of her is ringed in indigo, a second ring labelled "Autism
// spectrum" slides in and overlaps it, and the overlap is red.
//
// THE LINE: "Many of Taylor Swift's public, well-documented traits overlap with those of people on the autism spectrum."
// WORD -> FRAME: Many 1 · of 6 · Taylor 8 · Swift's 14 · public 25 · well 36 · documented 44 · traits 54 · overlap 61 ·
// with 74 · those 83 · of 87 · people 90 · on 94 · the 99 · autism 101 · spectrum 108 · (cut back at 122)
// DURATION: the slot 14.7091 -> 19.7927 s = 122 frames at 24, + 2 frames of tail handle = 124 (f0..f123).
//
// LAYOUT (COMMON.md, Nov 11, and the director's review): the presenter is keyed over the middle and bottom of the frame, so
// the Venn fills the top band. Settled on screen: rings r ~270, centres ~360 apart, x ~90-990, y ~180-720; the label above
// the right ring at y ~122; prints ~170-215 px; the pile and the red lens wholly above y ~720. Ring 1's bottom dips to about
// y 790 while it is drawn (f36-45, camera still close).
//
// THE MOTION: one camera that opens close on the first press print of her (k ~2.2) and pulls back to the settled diagram
// (k ~1.12, so the Venn fills the top band, x ~90-990), one deceleration lobe from f0 to rest about f102, then a creep in
// anchored on the diagram. On "Taylor Swift's public" three more prints are dealt in from the left edge onto a
// loose pile; on "well documented" an indigo ring is drawn round the pile by its own moving end; on "overlap" a second, empty
// ring slides in from beyond the right edge and overlaps it by about a third, and the lens they share prints red as it forms
// (the red is the intersection, so it grows with the overlap and darkens the street print under it). "Autism spectrum" slides
// up above the right ring on "autism". Settled, living hold from f112.
// Contact frames: prints land 14, 24, 33 (each first in frame about 8 frames before); the ring's end runs f35-f52; ring 2
// starts f56, first in frame f62, touches ring 1 f71 (first red f71), settles f94; label f100-f112.
// SPOT INK: red = the overlap only (where the focus lands). Indigo = the two rings and the label.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt; Commons; cropped and graded b&w with bake-photo.py):
// taylor/press_2010_ACMs_interview.jpg (File:Taylor_Swift_2009.jpg, Keith Hinkle, CC BY 2.0), 2010 ACM Awards carpet.
// taylor/taylor_2024_GoldenGlobes_headshoulders.png (File:Taylor_Swift_at_the_2024_Golden_Globes_(2).png, iHeartRadioCA, CC BY 3.0).
// taylor/press_2013_TIFF_crowd.jpg (File:One_Chance_01_(9766545385).jpg, GabboT, CC BY-SA 2.0), TIFF 2013.
// taylor/taylor_2012_Letterman_street_fulllength.jpg (File:Swift_outside_Letterman_studio_2.jpg, Scott Mecum, CC BY 2.0).
// No figures on screen; nothing beyond the speaker's line is claimed.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CaptionBandsDebug,
  CutOut,
  INDIGO,
  InkPrint,
  MONO,
  PaperGround,
  RED,
  WipCam,
  WipFilmLife,
  WipPlane,
  inkOn,
  paperEase,
  runWipCamera,
  slide,
  textRise,
} from "../kits/works-in-progress/wipShared";

export const FPS = 24;
export const DURATION = 124;
export const schema = z.object({ bands: z.boolean(), presenter: z.boolean() });
export const defaultProps = schema.parse({ bands: false, presenter: false });

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// -- the diagram, world px (world = screen on the settled camera) --------------------------------------------------------
// The settled camera is END_K, about the diagram's centre (540, 450): on screen the rings are r ~270, centres ~360 apart,
// spanning x ~90-990 and y ~180-720.
const R = 240; // ring radius, to the stroke's centre line
const RING_W = 9; // ring weight
const CY = 450; // both centres
const LX = 380; // the left ring (her)
const RX_END = 700; // the right ring, settled
const LABEL_X = 680; // "Autism spectrum", centred over the right ring, a little in from the frame's right edge
const LABEL_Y = 158; // its centre line: screen y ~123, clear above the ring's top
const LABEL_SIZE = 48;

// -- the camera: a world point held at a screen point --------------------------------------------------------------------
const hold = (f: number, wx: number, wy: number, sx: number, sy: number, k: number, ease?: "linear") => ({
  f,
  x: wx - (sx - 540) / k,
  y: wy - (sy - 960) / k,
  k,
  ease,
});
// One pull-back from close on the first print (k ~2.1 at f0) to the settled diagram (END_K), sampled from a smooth speed
// profile so it never hesitates: fastest at the start and easing all the way to rest at f100 (one deceleration lobe), so it
// is already wide enough for the ring by f35; then a creep in, anchored on the diagram's centre. The world point held on
// screen travels from the first print to the pile's centre (held high, so the ring clears the presenter's head) by f30, and
// on to the diagram's centre as ring 2 comes in (f50-95). Keys every 4 frames, linear; the kit's follower smooths them.
const ss = (u: number) => {
  const t = clamp01(u);
  return t * t * (3 - 2 * t);
};
const OPEN_K = 2.3;
const END_K = 1.12;
const PULL_FROM = -8;
const PULL_TO = 100;
const pullSpeed = (f: number) => clamp01(1 - (f - PULL_FROM) / (PULL_TO - PULL_FROM)) ** 1.15;
const PULL_CUM: number[] = [0];
for (let f = PULL_FROM; f < PULL_TO; f++) PULL_CUM.push(PULL_CUM[PULL_CUM.length - 1] + (pullSpeed(f) + pullSpeed(f + 1)) / 2);
const pullAt = (f: number) => PULL_CUM[Math.max(0, Math.min(PULL_CUM.length - 1, f - PULL_FROM))] / PULL_CUM[PULL_CUM.length - 1];
const A_X = 318; // the first print's centre
const A_Y = 386;
const camKey = (f: number) => {
  const p = pullAt(f);
  const a = ss((f - PULL_FROM) / 38);
  const b = ss((f - 50) / 45);
  return hold(f, A_X + (LX - A_X) * a + (540 - LX) * b, A_Y + (CY - A_Y) * a, 540, 440 - 10 * a + 20 * b, OPEN_K ** (1 - p) * END_K ** p, "linear");
};
const camAt: (f: number) => WipCam = runWipCamera(
  [
    ...Array.from({ length: (PULL_TO - PULL_FROM) / 4 + 1 }, (_, i) => camKey(PULL_FROM + i * 4)),
    hold(DURATION + 30, 540, CY, 540, 450, END_K * 1.04, "linear"),
  ],
  DURATION,
);

// -- the prints: b&w press photos of her in public, dealt in from the left onto a loose pile in the left ring --------------
// src under public/, aspect w/h, (x, y) the settled centre, w world px, rot the settled tilt, land = contact frame.
type Print = { src: string; aspect: number; x: number; y: number; w: number; rot: number; gamma?: number; land: number; from: { dx: number; dy: number; rot: number } };
const DEAL = 12; // frames in flight
const PHOTOS: Print[] = [
  // 2010 ACM Awards carpet, interviewed, a camera and a mic at her face: on the page at f0
  { src: "wip-taylor-swift/to_interview2010.png", aspect: 0.9025, x: A_X, y: A_Y, w: 180, rot: -6, land: -1, from: { dx: 0, dy: 0, rot: 0 } },
  // 2024 Golden Globes carpet
  { src: "wip-taylor-swift/to_globes2024.png", aspect: 0.9425, x: 455, y: 366, w: 150, rot: 5, land: 14, from: { dx: -640, dy: -190, rot: -22 } },
  // 2013 TIFF premiere, in a crowd
  { src: "wip-taylor-swift/to_tiff2013.png", aspect: 1.0899, x: 320, y: 530, w: 190, rot: -2, land: 24, from: { dx: -660, dy: 150, rot: -18 } },
  // 2012, outside the Letterman studio, NYC: on top; its right side (the SUV) reaches into the lens
  { src: "wip-taylor-swift/to_street2012.png", aspect: 0.9062, x: 448, y: 514, w: 176, rot: 7, gamma: 1.1, land: 33, from: { dx: -720, dy: -40, rot: -20 } },
];

const PrintOnPage: React.FC<{ p: Print; frame: number; i: number }> = ({ p, frame, i }) => {
  if (p.land >= 0 && frame < p.land - DEAL) return null;
  const t = p.land < 0 ? 1 : slide(frame, p.land - DEAL, DEAL);
  const u = 1 - t;
  return (
    <CutOut
      src={p.src}
      x={p.x + p.from.dx * u}
      y={p.y + p.from.dy * u}
      w={p.w}
      aspect={p.aspect}
      rotate={p.rot + p.from.rot * u}
      border={7}
      lift={0.7 * u}
      gamma={p.gamma ?? 1}
      seed={`to-print-${i}`}
    />
  );
};

// -- ring 1: drawn round the pile by its own moving end, on "well documented" ----------------------------------------------
const DRAW_START = 35;
const DRAW_DUR = 17;
const DRAW_FROM = (-125 * Math.PI) / 180; // the upper left, clockwise
const PAD = 30;
const BOX = 2 * (R + PAD);

const arcPath = (sweep: number) => {
  const c = R + PAD;
  const pt = (a: number) => `${(c + R * Math.cos(a)).toFixed(2)} ${(c + R * Math.sin(a)).toFixed(2)}`;
  if (sweep >= Math.PI * 2 - 1e-3) {
    return `M${pt(DRAW_FROM)} A${R} ${R} 0 1 1 ${pt(DRAW_FROM + Math.PI)} A${R} ${R} 0 1 1 ${pt(DRAW_FROM)} Z`;
  }
  const end = DRAW_FROM + sweep;
  return `M${pt(DRAW_FROM)} A${R} ${R} 0 ${sweep > Math.PI ? 1 : 0} 1 ${pt(end)}`;
};

const Ring: React.FC<{ cx: number; sweep: number; seed: string }> = ({ cx, sweep, seed }) => {
  if (sweep <= 0.002) return null;
  return (
    <InkPrint x={cx - R - PAD} y={CY - R - PAD} w={BOX} h={BOX} ink={INDIGO} seed={seed} rough={1.3} wear={0.1} misregister={0.9}>
      <svg width={BOX} height={BOX} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={arcPath(sweep)} fill="none" stroke="currentColor" strokeWidth={RING_W} strokeLinecap="round" />
      </svg>
    </InkPrint>
  );
};

// -- ring 2: slides in from beyond the right edge on "overlap" ------------------------------------------------------------
const SLIDE_START = 56;
const SLIDE_DUR = 38;
const R2_FROM = (() => {
  // fully past the right edge of the frame on the camera of its first frame, ink and wobble included
  const c = camAt(SLIDE_START);
  return c.x + 540 / c.k + R + RING_W + 24;
})();
const ring2X = (f: number) => R2_FROM + (RX_END - R2_FROM) * paperEase(clamp01((f - SLIDE_START) / SLIDE_DUR));

// -- the lens: the two rings' shared area, inset to their inner edges, printed red ----------------------------------------
const LENS_BOX = { x: LX + R - 2 * R - 20, y: CY - R - 20, w: 2 * R + 40, h: 2 * R + 40 };
const lensPath = (rx: number) => {
  const r = R - RING_W / 2 - 1;
  const d = rx - LX;
  if (d >= 2 * r - 0.5) return null;
  const a = d / 2;
  const h = Math.sqrt(r * r - a * a);
  const ox = LENS_BOX.x;
  const oy = LENS_BOX.y;
  const px = LX + a - ox;
  const top = CY - h - oy;
  const bot = CY + h - oy;
  return `M${px.toFixed(2)} ${top.toFixed(2)} A${r} ${r} 0 0 1 ${px.toFixed(2)} ${bot.toFixed(2)} A${r} ${r} 0 0 1 ${px.toFixed(2)} ${top.toFixed(2)} Z`;
};

const LABEL = "Autism spectrum";
const LENS_TINT = "#E3364F";

const TraitsOverlap: React.FC<z.infer<typeof schema>> = ({ bands, presenter }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const sweep = Math.PI * 2 * paperEase(clamp01((frame - DRAW_START) / DRAW_DUR));
  const rx = ring2X(frame);
  const lens = lensPath(rx);
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        <WipPlane cam={cam}>
          {PHOTOS.map((p, i) => (
            <PrintOnPage key={p.src} p={p} frame={frame} i={i} />
          ))}
        </WipPlane>
        <WipPlane cam={cam} ink>
          {lens ? (
            // a flat pale coat first, so the rough coat's dry patches show red, not bare paper
            <svg width={LENS_BOX.w} height={LENS_BOX.h} style={{ position: "absolute", left: LENS_BOX.x, top: LENS_BOX.y, mixBlendMode: "multiply" }}>
              <path d={lens} fill={inkOn(LENS_TINT)} />
            </svg>
          ) : null}
          {lens ? (
            <InkPrint x={LENS_BOX.x} y={LENS_BOX.y} w={LENS_BOX.w} h={LENS_BOX.h} ink={RED} seed="to-lens" rough={1.4} wear={0.06} misregister={1.1}>
              <svg width={LENS_BOX.w} height={LENS_BOX.h} style={{ position: "absolute", left: 0, top: 0 }}>
                <path d={lens} fill="currentColor" />
              </svg>
            </InkPrint>
          ) : null}
          <Ring cx={LX} sweep={sweep} seed="to-ring-her" />
          {frame >= SLIDE_START ? <Ring cx={rx} sweep={Math.PI * 2} seed="to-ring-autism-b" /> : null}
          <div
            style={{
              position: "absolute",
              left: LABEL_X - 300,
              width: 600,
              top: LABEL_Y - LABEL_SIZE * 0.7,
              textAlign: "center",
              fontFamily: MONO,
              fontWeight: 300,
              fontSize: LABEL_SIZE,
              lineHeight: `${LABEL_SIZE * 1.4}px`,
              color: inkOn(INDIGO),
              ...textRise(frame, 100, 12, 18),
            }}
          >
            {LABEL}
          </div>
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
      {presenter ? (
        // preview aid only: the presenter's area (COMMON.md), darkened
        <>
          <div style={{ position: "absolute", left: 300, top: 780, width: 500, height: 320, background: "rgba(0,0,0,0.55)" }} />
          <div style={{ position: "absolute", left: 100, top: 1100, width: 900, height: 820, background: "rgba(0,0,0,0.55)" }} />
        </>
      ) : null}
    </>
  );
};

export default TraitsOverlap;
