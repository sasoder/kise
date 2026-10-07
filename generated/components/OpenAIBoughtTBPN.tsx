import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  camEase,
  clamp,
  sway,
  worldTransform,
} from "./fieldShared";

const { fontFamily } = loadFont("normal", {
  weights: ["900"],
  subsets: ["latin"],
});

export const FPS = 24;
// The Premiere slot is 0.000-4.708 s. 4.708 s x 24 = 112.99 -> 113 frames
// exactly, no tail: the edit cuts back to the narrator on frame 113.
export const DURATION = 113;

// ---------------------------------------------------------------------------
// "OPENAI BOUGHT TBPN". Core memory podcast graphic standard; the sibling of
// `PeakForSolar` (same paper ground, same hard shadow, same damped camera).
//
// CHECK LINE — what the viewer can say after this cut:
//   "OpenAI paid more than $100 million and now owns TBPN."
//
// THE MOTION, one job: money flows from OpenAI to TBPN and a counter says how
// much. The cut opens tight on the TBPN wordmark with the OpenAI knot already
// sliding in from the top; the camera pulls back in the same breath so buyer
// and podcast share the frame, two streams of coins pour off the knot into the wordmark, and
// the price slides up between them and counts $0M -> $100M as they land. When
// the count hits 100 the chain colours rise from behind the wordmark as a
// crown (it is bought), a "+" joins the numeral, and coins keep trickling at a
// slower rate (the "over") under a barely perceptible creep until the cut.
//
// THE WORDS, frames at 24 fps from composition start. They guide one
// continuous motion; nothing is one gesture per word.
//   OpenAI    0-11     knot sliding down, camera already pulling back
//   bought    12-20    the first coins leave the knot (f10 on)
//   this      21
//   podcast   26-36    the first coin lands in the wordmark (f28)
//   for       36       the numeral is sliding up into place (f26-42)
//   over      42
//   100       50-68    the count runs; it reads $100M on f68
//   million   68-84    the chain crown rises (f66 / 68 / 70), "+" joins (f70)
//   dollars   84-101   settled; coins trickle
//   (cut)     113
//
// THE MATERIAL, as `PeakForSolar`: `public/paper-supaclean-still.png` turned
// 90 deg to cover portrait, `brightness(0.88) blur(3px)` on the image only,
// its own plane at parallax 0.15 with the -0.3 px/frame drift, root #C0C0C0.
//
// THE COLOURS, raw hex, no filter, blend, gradient, glow or opacity fade:
//   ink #FFFFFF, every white shape on a hard black copy at +4/+4 WORLD px
//   (an SVG copy of the shape, never a CSS drop-shadow).
//   orange #FFB765, purple #BC37FF, blue #0046FF: the stacked silhouette echo
//   that rises behind the TBPN wordmark when it is bought. The orange is also
//   the coins' gold (director's note: white coins read as bubbles).
//
// TYPE: Barlow 900, 170 px (190 left no lane for the coins beside "$100M+"). The only text is the price. Every character sits
// in its own fixed slot, so the count does not jitter.
//
// THE GEOMETRY, world px; at the rest camera (k 1, cx 540, cy 960) world =
// screen. Everything important ends above y 1050, clear of the caption strip
// (y 1080-1250).
//   knot      280 px, centre (540, 400)            y 260..540
//   numeral   baseline 766, ink 632..780; "$100M+" spans x 213..867
//   coins     r 38, GOLD (the chain orange, raw) with one black inner ring, two
//             streams from the knot to x 190 and 890
//   crown     orange top 835 at rest (3 x 16 px steps above the wordmark)
//   wordmark  760 x 154, x 160..920                y 883..1037 (+4 shadow)
//
// THE CAMERA — `PeakForSolar`'s `runCamera2` (house CAM_STIFF / CAM_DAMP), run
// from f-10 so the damper is already moving on frame 0.
//   PULL   f-10..28  k 1.34 -> 1.00, the wordmark's centre from screen y 930
//                    to its rest at 960. One move, eased (warp 0.85).
//   CREEP  f34..113  k 1.00 -> 1.035, pinned on the wordmark's bottom edge so
//                    nothing slides toward the caption strip.
//   The damped numbers are printed by the builder's report, not asserted here.
// ---------------------------------------------------------------------------

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const PAPER_BASE = "#C0C0C0";
const BG_OVERSIZE = 1.6;

// The real marks, inlined (never <image>: it flashes on the first frames).
// public/si-openai.svg, viewBox 0 0 24 24.
const OPENAI_PATH =
  "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z";
// public/tbpn/tbpn-logo.svg, viewBox 4 0 1396 283 (its gradient is ignored).
const TBPN_PATH =
  "M4 55.6707V0H338.091V55.6707H235.544V278.354H106.594V55.6707H4ZM607.127 0C621.001 0 633.762 2.78354 645.501 8.35061C657.241 13.9177 666.568 21.8508 673.482 32.1962C680.674 42.2634 684.293 54.1862 684.293 67.9647C684.293 79.6091 681.648 89.7226 676.312 98.166C671.254 106.656 664.851 113.429 657.148 118.439C649.446 123.496 641.836 126.929 634.365 128.785C650.606 133.285 664.34 141.775 675.523 154.254C686.984 166.734 692.692 182.507 692.692 201.574C692.692 217.997 688.562 232.054 680.303 243.745C672.043 255.157 661.371 263.74 648.332 269.585C635.525 275.431 622.069 278.354 607.963 278.354H356.977V0H607.174H607.127ZM474.837 111.341H539.984C547.177 111.341 552.791 109.254 556.782 105.125C561.051 100.95 563.185 95.4289 563.185 88.5164V78.5421C563.185 71.3513 561.051 65.7842 556.782 61.9337C552.791 57.7584 547.177 55.7171 539.984 55.7171H474.837V111.388V111.341ZM474.837 222.683H540.402C548.151 222.683 554.276 220.734 558.777 216.837C563.324 212.709 565.552 206.956 565.552 199.626V190.116C565.552 182.786 563.278 177.172 558.777 173.275C554.23 169.146 548.105 167.059 540.402 167.059H474.837V222.729V222.683ZM830.504 278.354V180.93H958.712C974.628 180.93 988.966 176.94 1001.73 169.007C1014.49 160.796 1024.56 149.801 1031.98 136.022C1039.4 122.244 1043.12 106.841 1043.12 89.9082C1043.12 72.975 1039.4 57.2944 1031.98 43.7943C1024.56 30.2941 1014.49 19.6703 1001.73 11.9692C989.012 4.03613 974.674 0.0463923 958.712 0.0463923H711.484V278.4H830.504V278.354ZM909.341 63.0935C914.12 67.7791 916.486 74.3668 916.486 82.903V95.7072C916.486 104.243 914.12 110.831 909.341 115.517C904.561 120.202 897.926 122.522 889.434 122.522H830.504V55.7171H889.434C897.926 55.7171 904.561 58.1759 909.341 63.1399V63.0935ZM1061.96 0V278.354H1140.93V107.352L1252.94 278.354H1396V0H1316.61V171.373L1205.01 0H1061.96Z";

export const schema = z.object({
  paperSrc: z.string(),
  parallax: z.number(),
  paperDim: z.number(),
  paperBlur: z.number(),
  ink: z.string(),
  shadow: z.string(),
  orange: z.string(),
  purple: z.string(),
  blue: z.string(),
  // the hard shadow, in WORLD px
  shadowOffset: z.number(),
  // the verified price floor, in $M (FT: "low hundreds of millions")
  priceM: z.number().int(),
  beats: z.object({
    firstCoin: z.number(), // "bought"   — the first coin leaves the knot
    numeral: z.number(), // "for"        — the numeral starts sliding up
    hundred: z.number(), // "100"        — the count reads priceM
    crown: z.number(), // the chain rises behind the wordmark
    plus: z.number(), // "+" joins
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  paperSrc: "paper-supaclean-still.png",
  parallax: 0.15,
  paperDim: 0.88,
  paperBlur: 3,
  ink: WHITE,
  shadow: BLACK,
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  shadowOffset: 4,
  priceM: 100,
  beats: { firstCoin: 10, numeral: 26, hundred: 68, crown: 66, plus: 70 },
});

// ---------------------------------------------------------------------------
// THE GEOMETRY
// ---------------------------------------------------------------------------
const CX = FRAME_W / 2;

export const KNOT_SIZE = 280;
export const KNOT_Y = 400; // centre, at rest
const KNOT_Y_IN = 139; // where the slide starts (f-10); f0 is mid-slide
const KNOT_F0 = -10;
const KNOT_F1 = 30;

export const WM_W = 760;
const WM_S = WM_W / 1396;
export const WM_H = 283 * WM_S; // 154.07
export const WM_X = CX - WM_W / 2;
export const WM_CY = 960;
export const WM_TOP = WM_CY - WM_H / 2; // 882.97
export const WM_BOTTOM = WM_CY + WM_H / 2; // 1037.03

export const NUM_SIZE = 170;
export const NUM_BASELINE = 766;
const NUM_RISE = 60;
const NUM_TRAVEL = 16;
// Slot widths in em (Barlow 900). The hundreds slot only ever holds a "1".
const W_DOLLAR = 0.6;
const W_DIGIT = 0.615;
const W_ONE = 0.43;
const W_M = 0.82;
const W_PLUS = 0.56;

export const CROWN_STEP = 16;
const TRAVEL_FRAMES = 22;
const NUDGE = 7; // the wordmark dips this far under a landing coin, then recovers
const CHAIN_STAGGER = 2;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

// -- the coins ---------------------------------------------------------------
export const COIN_R = 38;
const COIN_RING_INSET = 9; // the coin face: one black inner ring, the same on every coin
const COIN_RING_W = 5;
const COIN_FALL = 18; // frames from the knot to the wordmark's top edge
const COIN_POW = 1.7; // it falls: slow out of the knot, fast into TBPN
// Two streams, one each side of the price, each a shallow "(" from the knot's
// shoulder down to the wordmark's outer letters: the T's left arm (x 160..342)
// and the N's right stem (874..920). A coin never passes behind the numeral,
// where a disc under a digit reads as a decimal point.
//   |dx|(s) = COIN_X0 + (COIN_LAND - COIN_X0) * s + bulge * 4 s (1 - s)
// with s the fraction of the fall. The stream's bulge just clears "$100M"
// (half-width 264); the trickle's is wider because the "+" has widened the
// price and a coin within ~60 px of "$" or "+" reads as punctuation.
const COIN_X0 = 110;
const COIN_LAND = 350;
const BULGE_STREAM = 115;
const BULGE_TRICKLE = 167;
const STREAM_END = 53; // the last stream coin leaves here and lands on "100"

type Coin = { emit: number; lane: number; bulge: number };
// After the stream, the "over": a slow trickle, authored by hand so that on the
// last frame the only coins are the two just out of the knot: none is at the
// numeral's height and none is touching the wordmark (the f91 coin is gone by
// f109).
const TRICKLE: Coin[] = [
  [57, 0],
  [63, 1],
  [70, 0],
  [77, 1],
  [84, 0],
  [91, 1],
  [105, 0],
  [109, 1],
].map(([emit, lane]) => ({ emit, lane, bulge: BULGE_TRICKLE }));
const buildCoins = (first: number): Coin[] => {
  const out: Coin[] = [];
  // Irregular gaps: a strictly periodic stream repeats its own picture every
  // period and strobes at 24 fps.
  const gaps = [1, 1, 2, 1, 1, 1, 2];
  let i = 0;
  for (let f = first; f < STREAM_END; f += gaps[i % gaps.length], i++) {
    out.push({ emit: f, lane: i % 2, bulge: BULGE_STREAM });
  }
  return [...out, ...TRICKLE];
};

const knotYAt = (f: number) => {
  const u = interpolate(f, [KNOT_F0, KNOT_F1], [0, 1], clamp);
  const g = u * u * (3 - 2 * u);
  return KNOT_Y_IN + (KNOT_Y - KNOT_Y_IN) * g;
};

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
export const K_OPEN = 1.34;
export const K_REST = 1.0;
export const K_END = 1.035;
const OPEN_LIFT = 30; // at open the wordmark's centre sits on screen y 930
const PULL_F0 = -10;
const PULL_F1 = 28;
const PULL_WARP = 0.85;
const CREEP_F0 = 34;
const CREEP_F1 = DURATION;

const buildCamera = () => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CXS: number[] = [];
  for (let f = PULL_F0; f <= PULL_F1; f++) {
    const g = camEase((f - PULL_F0) / (PULL_F1 - PULL_F0), PULL_WARP);
    const k = K_OPEN + (K_REST - K_OPEN) * g;
    F.push(f);
    K.push(k);
    CY.push(WM_CY + (OPEN_LIFT * (1 - g)) / k);
    CXS.push(CX);
  }
  for (let f = CREEP_F0; f <= CREEP_F1; f++) {
    const g = camEase((f - CREEP_F0) / (CREEP_F1 - CREEP_F0), 1);
    const k = K_REST + (K_END - K_REST) * g;
    F.push(f);
    K.push(k);
    // the wordmark's bottom edge stays where it is on screen
    CY.push(WM_BOTTOM - (WM_BOTTOM - WM_CY) / k);
    CXS.push(CX);
  }
  return { F, K, CY, CX: CXS };
};
export const CAM = buildCamera();

// `PeakForSolar`'s `runCamera2` (same tracker, same constants), started from
// the first key's frame so the camera is already in motion on frame 0.
export const runCamera2 = (upto: number, F: number[], CY: number[], CXK: number[], K: number[]) => {
  let cy = CY[0];
  let cx = CXK[0];
  let k = K[0];
  let vy = 0;
  let vx = 0;
  let vk = 0;
  for (let f = F[0] + 1; f <= upto; f++) {
    const ty = interpolate(f, F, CY, clamp);
    const tx = interpolate(f, F, CXK, clamp);
    const tk = interpolate(f, F, K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, cx, k };
};

// ---------------------------------------------------------------------------
// THE GROUND — `PeakForSolar`'s `PaperGround`, unchanged.
// ---------------------------------------------------------------------------
const PaperGround: React.FC<{
  src: string;
  frame: number;
  cy: number;
  cyRest: number;
  cx: number;
  cxRest: number;
  k: number;
  parallax: number;
  dim: number;
  blur: number;
}> = ({ src, frame, cy, cyRest, cx, cxRest, k, parallax, dim, blur }) => {
  const bgY = -(cy - cyRest) * k * parallax - frame * 0.3;
  const bgX = -(cx - cxRest) * k * parallax;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE,
          height: FRAME_W * BG_OVERSIZE,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const COIN_CLIP = "oab-coins-above-the-wordmark";

const OpenAIBoughtTBPN: React.FC<Props> = ({
  paperSrc,
  parallax,
  paperDim,
  paperBlur,
  ink,
  shadow,
  orange,
  purple,
  blue,
  shadowOffset,
  priceM,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the camera, first -----------------------------------------------------
  const cam = runCamera2(frame, CAM.F, CAM.CY, CAM.CX, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the buyer ---------------------------------------------------------------
  const knotY = knotYAt(frame);
  const knotS = KNOT_SIZE / 24;
  const knotAt = (off: number) =>
    `translate(${CX - KNOT_SIZE / 2 + off}, ${knotY - KNOT_SIZE / 2 + off}) scale(${knotS})`;

  // -- the money ---------------------------------------------------------------
  const coins = buildCoins(beats.firstCoin);
  let nudge = 0;
  const live: { x: number; y: number; r: number; key: number }[] = [];
  coins.forEach((c, i) => {
    const age = frame - c.emit;
    if (age < 0) {
      return;
    }
    if (age >= COIN_FALL) {
      // it has landed: the wordmark takes a small knock and recovers
      nudge += NUDGE * Math.exp(-(age - COIN_FALL) / 1.2);
      return;
    }
    const u = age / COIN_FALL;
    const y0 = knotYAt(c.emit);
    const y1 = WM_TOP + COIN_R;
    const g = Math.pow(u, COIN_POW);
    const dx = COIN_X0 + (COIN_LAND - COIN_X0) * g + c.bulge * 4 * g * (1 - g);
    live.push({
      key: i,
      x: CX + (c.lane === 0 ? -dx : dx),
      y: y0 + (y1 - y0) * g,
      r: COIN_R * Math.min(1, (age + 1) / 3),
    });
  });
  nudge = Math.min(nudge, NUDGE);

  // -- the price ---------------------------------------------------------------
  const count = Math.round(
    interpolate(frame, [beats.numeral + 2, beats.hundred], [0, priceM], {
      easing: Easing.out(Easing.quad),
      ...clamp,
    }),
  );
  const digits = String(count).split("");
  const numDy =
    (1 -
      interpolate(frame, [beats.numeral, beats.numeral + NUM_TRAVEL], [0, 1], {
        easing: EASE_LAND,
        ...clamp,
      })) *
    NUM_RISE;
  const plusT = interpolate(frame, [beats.plus, beats.plus + NUM_TRAVEL], [0, 1], {
    easing: EASE_LAND,
    ...clamp,
  });
  const slots: { ch: string; w: number; dy: number }[] = [
    { ch: "$", w: W_DOLLAR, dy: 0 },
    ...digits.map((d, i) => ({
      ch: d,
      w: digits.length === 3 && i === 0 ? W_ONE : W_DIGIT,
      dy: 0,
    })),
    { ch: "M", w: W_M, dy: 0 },
  ];
  const baseW = slots.reduce((s, c) => s + c.w, 0) * NUM_SIZE;
  const plusW = W_PLUS * NUM_SIZE;
  // the group re-centres as the "+" arrives, on the "+"'s own ease
  let penX = CX - (baseW + plusW * plusT) / 2;
  const placed = slots.map((s) => {
    const x = penX + (s.w * NUM_SIZE) / 2;
    penX += s.w * NUM_SIZE;
    return { ...s, x };
  });
  if (frame >= beats.plus) {
    placed.push({ ch: "+", w: W_PLUS, dy: (1 - plusT) * NUM_RISE, x: penX + plusW / 2 });
  }
  const textStyle = {
    fontFamily,
    fontWeight: 900,
    fontSize: NUM_SIZE,
    fontVariantNumeric: "tabular-nums",
  } as const;

  // -- the thing bought ----------------------------------------------------------
  const wmAt = (dx: number, dy: number) =>
    `translate(${WM_X + dx}, ${WM_TOP + nudge + dy}) scale(${WM_S}) translate(-4, 0)`;
  const chain = [
    { color: orange, start: beats.crown, lift: 3 * CROWN_STEP },
    { color: purple, start: beats.crown + CHAIN_STAGGER, lift: 2 * CROWN_STEP },
    { color: blue, start: beats.crown + 2 * CHAIN_STAGGER, lift: CROWN_STEP },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround
        src={paperSrc}
        frame={frame}
        cy={cy}
        cyRest={WM_CY}
        cx={cx}
        cxRest={CX}
        k={k}
        parallax={parallax}
        dim={paperDim}
        blur={paperBlur}
      />

      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <defs>
              {/* A coin ends at the wordmark's top edge: it drops INTO a letter. */}
              <clipPath id={COIN_CLIP}>
                <rect x={-2000} y={-4000} width={6000} height={4000 + WM_TOP + nudge + 8} />
              </clipPath>
            </defs>

            {/* THE COINS, behind everything they pass. */}
            <g clipPath={`url(#${COIN_CLIP})`}>
              {live.map((c) => (
                <g key={c.key}>
                  <circle cx={c.x + shadowOffset} cy={c.y + shadowOffset} r={c.r} fill={shadow} />
                  <circle cx={c.x} cy={c.y} r={c.r} fill={orange} />
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={Math.max(0, c.r - COIN_RING_INSET - COIN_RING_W / 2)}
                    fill="none"
                    stroke={shadow}
                    strokeWidth={COIN_RING_W}
                  />
                </g>
              ))}
            </g>

            {/* THE BUYER. */}
            <path d={OPENAI_PATH} transform={knotAt(shadowOffset)} fill={shadow} />
            <path d={OPENAI_PATH} transform={knotAt(0)} fill={ink} />

            {/* THE THING BOUGHT: shadow, then the chain, then the white core. */}
            <path d={TBPN_PATH} transform={wmAt(shadowOffset, shadowOffset)} fill={shadow} />
            {chain.map((c) => {
              if (frame < c.start) {
                return null;
              }
              const t = interpolate(frame, [c.start, c.start + TRAVEL_FRAMES], [0, 1], {
                easing: EASE_LAND,
                ...clamp,
              });
              return <path key={c.color} d={TBPN_PATH} transform={wmAt(0, -c.lift * t)} fill={c.color} />;
            })}
            <path d={TBPN_PATH} transform={wmAt(0, 0)} fill={ink} />

            {/* THE PRICE, the only text in the cut. */}
            {frame >= beats.numeral
              ? placed.map((s, i) => (
                  <g key={`${i}-${s.ch === "+" ? "plus" : "slot"}`}>
                    <text
                      x={s.x + shadowOffset}
                      y={NUM_BASELINE + numDy + s.dy + shadowOffset}
                      textAnchor="middle"
                      fill={shadow}
                      style={textStyle}
                    >
                      {s.ch}
                    </text>
                    <text
                      x={s.x}
                      y={NUM_BASELINE + numDy + s.dy}
                      textAnchor="middle"
                      fill={ink}
                      style={textStyle}
                    >
                      {s.ch}
                    </text>
                  </g>
                ))
              : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default OpenAIBoughtTBPN;
