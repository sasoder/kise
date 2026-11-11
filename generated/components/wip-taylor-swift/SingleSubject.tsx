// ---------------------------------------------------------------------------
// SingleSubject (wip-taylor-swift, cut 3). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 105 frames.
//
// CHECK LINE: "History's great minds each fixed on one single thing (Newton and his apple, Einstein and his blackboard,
// Darwin and his barnacle), and the camera narrows from the many to one man and his one subject." With no sound: three
// famous faces, each with his one thing, then only Darwin and a barnacle, ringed in red.
//
// THE LINE: "History is full of geniuses with near-pathological focus on a single subject."
// WORD -> FRAME: History 0 · is 6 · full 14 · of 22 · geniuses 28 · with 41 · near 45 · pathological 52 · focus 64 ·
// on 76 · a 82 · single 84 · subject 88 · (cut back to the speaker at f103)
// DURATION: the slot 3.8335 -> 8.1254 s = 103 frames at 24 + 2 frames of tail handle = 105 frames (f0..f104).
//
// THE MOTION: one continuous push. Three b&w busts slide up from below the page into a pyramid in the top of the frame
// (Newton left, Einstein raised in the middle in front of his blackboard, Darwin right). The rise is quick through the lower
// frame, where the presenter stands, and slow in the visible top band: Newton is already finishing his at f0 (whole head in
// the band), landed f12; Einstein and Darwin come up from behind her, faces in the band by ~f10, landed f26 and f28. Each has his
// one real thing at his eyeline: Newton's apple, Einstein's blackboard behind his head, Darwin's barnacle (on his left, the way
// he is turned). From about f40 the camera pushes in on Darwin and his barnacle (k 1 -> 1.51 on his plane, settled by about
// f84). Newton, his apple, Einstein and the board lie on a nearer layer of the page (d 0.5), so the same push carries them off
// the left and top edges faster than Darwin grows (Newton gone about f56, the apple f62, the board's last corner f71). By
// "single subject" (f84-88) Darwin's face fills the upper frame (crown ~y 215, eyes ~y 404) with the barnacle beside him at
// eye level; a red ink ring is drawn round the barnacle f74-f83, closed on "single". Then a slow creep to the end.
// THE PRESENTER (COMMON.md): she is keyed over the middle and bottom of the frame, so every beat lives in y ~110-760; the
// busts' bodies run down behind her. `presenter` (preview only) darkens her area.
// Contact frames: nothing presses. The ring's pen tip starts f74 and closes f83.
// SPOT INK: red = where the focus lands (the ring round the barnacle). No indigo in this cut.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt, group geniuses/): Newton: Godfrey Kneller 1689 (newton_kneller1689_c.jpg,
// Commons, PD). Einstein: Orren Jack Turner 1947 (einstein_turner1947_c.jpg, Commons, PD: copyright not renewed). Darwin:
// Maull & Polyblank 1855, the barnacle years (darwin_maullpolyblank1855_b.jpg, Commons, PD). Apple: Amada44, Apple-003.jpg
// (apple_red_b.jpg, Commons, PD). Blackboard: Einstein's 1931 Oxford blackboard, History of Science Museum, photo decltype
// (blackboard_einsteinOxford1931_a.jpg, Commons, CC BY-SA 3.0: needs credit). Barnacle: Balanus, fig. 1c of Plate V of
// Darwin's own "A Monograph on the Sub-class Cirripedia" 1851-54 (barnacle_darwinMonographPlateV_c.jpg, Commons, PD).
// Bakes: Apple Vision fg mattes; Einstein's hair keyed by scripts/clips/wip-taylor-swift/ss-hair-key.py (--lo 0.16 --hi 0.3
// --below 0.46 --protect 0.25,0.45,0.06); busts and the board's frame hand-cut by ss-cut-mask.py; all graded by
// scripts/clips/wip-anthropic/bake-photo.py (apple pre-blurred sigma 5 to calm its mottling; Darwin denoised, mid 0.46, then
// a highlight shoulder, ffmpeg curves '0/0 0.45/0.4 0.8/0.78 1/0.93', so his face is not blown out).
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CaptionBandsDebug,
  CutOut,
  InkPrint,
  PaperGround,
  RED,
  WipFilmLife,
  WipPlane,
  paperEase,
  runWipCamera,
} from "../kits/works-in-progress/wipShared";

export const FPS = 24;
export const DURATION = 105;
export const schema = z.object({ bands: z.boolean(), presenter: z.boolean() });
export const defaultProps = schema.parse({ bands: false, presenter: false });

// -- the prints, in their baked px: the face's x, the crown, eyes and chin ---------------------------------------------------
type Print = { src: string; W: number; H: number; faceX: number; crown: number; eyes: number; chin: number };
const NEWTON: Print = { src: "wip-taylor-swift/ss_newton.png", W: 1335, H: 1400, faceX: 734, crown: 67, eyes: 516, chin: 890 };
const EINSTEIN: Print = { src: "wip-taylor-swift/ss_einstein.png", W: 1379, H: 1400, faceX: 827, crown: 42, eyes: 732, chin: 1188 };
const DARWIN: Print = { src: "wip-taylor-swift/ss_darwin.png", W: 1167, H: 1190, faceX: 418, crown: 89, eyes: 337, chin: 535 };
const APPLE = { src: "wip-taylor-swift/ss_apple.png", aspect: 673 / 700 };
const BARNACLE = { src: "wip-taylor-swift/ss_barnacle.png", aspect: 785 / 900 };
const BOARD = { src: "wip-taylor-swift/ss_board.png", aspect: 1400 / 1028 };

// -- the wide (world px = screen px at the opening key) -----------------------------------------------------------------------
// Scales put eyes-to-chin at about 100 px on all three, so the heads read as one set (hair/wig 285, 283; Darwin's bald head 197).
const S_N = 0.267;
const S_E = 0.219;
const S_D = 0.505;
// Each print's centre from where its face goes.
const place = (p: Print, s: number, faceX: number, eyesY: number) => ({
  x: faceX + (p.W / 2 - p.faceX) * s,
  y: eyesY + (p.H / 2 - p.eyes) * s,
  w: p.W * s,
  aspect: p.W / p.H,
});
// Einstein stands in front of his blackboard: the board is centred behind his head, its chalk showing either side of his hair.
const E_CROWN = 165;
const BOARD_AT = { x: 540, y: 110 + 338 / 2, w: 460 };
const N_AT = place(NEWTON, S_N, 240 + (NEWTON.faceX - 667) * S_N, 500); // the wig centred at x 240: its left edge at ~97
const E_AT = place(EINSTEIN, S_E, 540 + (EINSTEIN.faceX - 711) * S_E, E_CROWN + (EINSTEIN.eyes - EINSTEIN.crown) * S_E); // hair centred
const D_FACE = { x: 870, eyes: 500 };
const D_AT = place(DARWIN, S_D, D_FACE.x, D_FACE.eyes);
const APPLE_AT = { x: 404, y: 524, w: 112 };
// The barnacle: at Darwin's eyeline on his left (he is turned that way), placed so the final frame holds it at x ~330.
const BARN_AT = { x: 630, y: 498, w: 200 };

// -- the camera: a near-still wide, then one push onto Darwin and his barnacle ------------------------------------------------
// Final: Darwin's crown at screen y ~215, eyes ~404, face x ~720; the barnacle centred at x ~330 (k 1.51 on the focus plane).
const K_END = 1.51;
const END_X = D_FACE.x - (720 - 540) / K_END;
const END_Y = D_FACE.eyes - (404 - 960) / K_END;
const camAt = runWipCamera(
  [
    { f: -24, x: 540, y: 960, k: 1 },
    { f: 34, x: 546, y: 955, k: 1.02, ease: "linear" },
    { f: 80, x: END_X, y: END_Y, k: K_END },
    { f: DURATION + 30, x: END_X + 6, y: END_Y - 4, k: K_END * 1.045, ease: "linear" },
  ],
  DURATION,
);
// Newton, his apple, Einstein and his board lie on a nearer layer: the push carries them out of frame faster than Darwin grows.
const NEAR_D = 0.5;

// -- the entrances: slid up from below the page, one ease, a few frames apart -------------------------------------------------
// The presenter covers the middle and bottom of the frame, so the rise is front-loaded: quick through the lower frame (behind
// her), slow once the faces are in the visible top band. Newton is already finishing his rise at f0 (crown ~y 505, the whole
// head in the top band), landed f12; Einstein's face clears her head by ~f10, landed f26; Darwin's rises beside her head on
// the right from ~f9, landed f28. One ease for all three.
const riseEase = Easing.bezier(0.3, 0.45, 0.2, 1);
const RISES = {
  newton: { start: -18, dur: 30 },
  einstein: { start: 1, dur: 25 },
  darwin: { start: 3, dur: 25 },
};
// From below the frame: the print's top 30 px under the bottom edge at the opening camera.
const riseY = (frame: number, r: { start: number; dur: number }, y: number, h: number, above = 0) => {
  const from = 1920 + 30 + h / 2 + above;
  const u = riseEase(Math.min(1, Math.max(0, (frame - r.start) / r.dur)));
  return { y: from + (y - from) * u, lift: (1 - u) * 0.5 };
};

// -- the red ring round the barnacle: one pen stroke, drawn f74-f83 -------------------------------------------------------------
const RING_START = 74;
const RING_END = 83;
const RING_RX = 124;
const RING_RY = 142;
const RING_W = 9;
const ringPath = () => {
  // a hand-drawn loop: starts at the upper right, goes round once and overshoots a little, the radius breathing slightly
  const pts: string[] = [];
  const n = 120;
  const a0 = -0.9;
  const sweep = Math.PI * 2 + 0.55;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = a0 + sweep * t;
    const r = 1 + 0.035 * Math.sin(3 * a + 0.6) - 0.05 * t;
    pts.push(`${(Math.cos(a) * RING_RX * r).toFixed(2)} ${(Math.sin(a) * RING_RY * r).toFixed(2)}`);
  }
  return `M${pts.join("L")}`;
};
const RING_D = ringPath();
const RING_LEN = (() => {
  let len = 0;
  const n = 120;
  const a0 = -0.9;
  const sweep = Math.PI * 2 + 0.55;
  let prev: [number, number] | null = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = a0 + sweep * t;
    const r = 1 + 0.035 * Math.sin(3 * a + 0.6) - 0.05 * t;
    const p: [number, number] = [Math.cos(a) * RING_RX * r, Math.sin(a) * RING_RY * r];
    if (prev) len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  }
  return len;
})();

const Ring: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < RING_START) return null;
  const u = paperEase(Math.min(1, (frame - RING_START) / (RING_END - RING_START)));
  const box = 2 * (RING_RX + 30);
  const boxH = 2 * (RING_RY + 30);
  return (
    <InkPrint x={BARN_AT.x - box / 2} y={BARN_AT.y - boxH / 2} w={box} h={boxH} ink={RED} seed="ss-ring" rough={1.2} wear={0.25} misregister={1}>
      <svg width={box} height={boxH} viewBox={`${-box / 2} ${-boxH / 2} ${box} ${boxH}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path
          d={RING_D}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_W}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${RING_LEN} ${RING_LEN}`}
          strokeDashoffset={RING_LEN * (1 - u)}
        />
      </svg>
    </InkPrint>
  );
};

// Preview aid: the presenter's area (COMMON.md) darkened, to check the cut still reads with her keyed on top.
const PresenterDebug: React.FC<{ on: boolean }> = ({ on }) =>
  on ? (
    <>
      <div style={{ position: "absolute", left: 300, top: 780, width: 500, height: 320, background: "rgba(20,20,20,0.72)" }} />
      <div style={{ position: "absolute", left: 100, top: 1100, width: 900, height: 820, background: "rgba(20,20,20,0.72)" }} />
    </>
  ) : null;

const SingleSubject: React.FC<z.infer<typeof schema>> = ({ bands, presenter }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const n = riseY(frame, RISES.newton, N_AT.y, N_AT.w / N_AT.aspect);
  const e = riseY(frame, RISES.einstein, E_AT.y, E_AT.w / E_AT.aspect, 60); // his board stands ~50 px above his print
  const d = riseY(frame, RISES.darwin, D_AT.y, D_AT.w / D_AT.aspect);
  // the objects ride up with their men, a fixed offset from their print
  const nDy = n.y - N_AT.y;
  const dDy = d.y - D_AT.y;
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        <WipPlane cam={cam} d={NEAR_D}>
          <CutOut src={BOARD.src} x={BOARD_AT.x} y={BOARD_AT.y + e.y - E_AT.y} w={BOARD_AT.w} aspect={BOARD.aspect} border={5} lift={e.lift} seed="board" />
          <CutOut src={EINSTEIN.src} x={E_AT.x} y={e.y} w={E_AT.w} aspect={E_AT.aspect} border={7} lift={e.lift} seed="einstein" />
          <CutOut src={NEWTON.src} x={N_AT.x} y={n.y} w={N_AT.w} aspect={N_AT.aspect} border={7} lift={n.lift} seed="newton" />
          <CutOut src={APPLE.src} x={APPLE_AT.x} y={APPLE_AT.y + nDy} w={APPLE_AT.w} aspect={APPLE.aspect} border={6} lift={n.lift} seed="apple" />
        </WipPlane>
        <WipPlane cam={cam}>
          <CutOut src={DARWIN.src} x={D_AT.x} y={d.y} w={D_AT.w} aspect={D_AT.aspect} border={7} lift={d.lift} grain={0.08} seed="darwin" />
          <CutOut src={BARNACLE.src} x={BARN_AT.x} y={BARN_AT.y + dDy} w={BARN_AT.w} aspect={BARNACLE.aspect} border={6} lift={d.lift} seed="barnacle" />
        </WipPlane>
        <WipPlane cam={cam} ink>
          <Ring frame={frame} />
        </WipPlane>
      </WipFilmLife>
      <PresenterDebug on={presenter} />
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default SingleSubject;
