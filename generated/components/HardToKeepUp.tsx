import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  FRAME_H,
  FRAME_W,
  camEase,
  clamp,
  clamp01,
  hash,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// TBPN 03 narrated, sequence 25.750 s -> 30.083 s. round(4.333 * 24) = 104.
export const DURATION = 104;

// ---------------------------------------------------------------------------
// "HARD TO KEEP UP". Core memory podcast graphic standard (ref PeakForSolar):
// squared paper knocked back, white flat ink on a hard black shadow, the chain
// colours once, on the payoff.
//
// CHECK LINE: "Tech news arrives faster than one reader can get through it, so
// the unread pile only grows."
//
// ONE JOB: arrival rate versus reading rate. No clock, no words, no numbers.
//
// THE PICTURE. A news feed: white rounded cards whose "text" is two or three
// dark bars and a square thumbnail; a few carry a real lab logo as the
// thumbnail (dark on the white card) so it reads as AI / tech news. ONE reader:
// a chunky white frame around the card it is on. It reads at a STEADY pace, one
// card every 14 frames: the card's ink goes pale left to right as the frame
// sits on it (the sweep IS the reading), a check is drawn on it, the frame
// steps down one card. A READ card = pale ink + a dark check. Nothing else.
//
// ONE DIRECTION, never changed: every card enters from BELOW the frame and
// slides up its own lane until it stops under the card before it.
//
// THE MOTION, one curve. Arrivals follow a single smooth accelerating rate
// r(f) = softmin(r0 * e^(b f), rMax): one per 12 frames at f0, one per ~6 at
// "breakneck" (f17), ~3 per 5 frames at "Silicon Valley" (f52), ~2 per frame
// by "hard". Where a card goes is the overflow rule and nothing else: the
// centre column while it still has room above the bottom of the frame, else
// the columns either side (top down), else the next pair out. So the feed is
// one column until "of innovation", then spills, and by "hard" it is a wall.
//
// THE CHAIN, once: from "it's" (f64) orange / purple / blue rise out from
// behind the reader's frame as a crown (2-frame stagger, 22 frames,
// bezier(0.16, 1, 0.3, 1)), so the eye finds the one small reader in the
// flood. They are on nothing else.
//
// THE CAMERA: one long eased pull-back, k 1.00 -> 0.40 keyed f0-84 in log k
// through the house damper, then a creep to the last frame. The camera is
// pinned to the reader's own steady descent (one row per 14 frames), so the
// reader stays on the centre line at screen y ~880, above the caption strip,
// and the column scrolls up past it for the whole cut.
//
// DEVIATIONS, on purpose:
//   * The hard shadow is 4 world px at k 1 and grows as k^-0.8 (8.3 world px
//     at rest) so it is still ~3.3 SCREEN px on the wall; a fixed 4 world px
//     would be 1.6 px there and the cards would stop reading as cards.
//   * The reader's frame and the crown step are likewise held near-constant
//     on SCREEN, so the reader stays findable at 270 px wide.
// ---------------------------------------------------------------------------

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const PAPER_BASE = "#C0C0C0";
const BG_OVERSIZE_HKU = 1.8;

export const schema = z.object({
  paperSrc: z.string(),
  parallax: z.number(),
  paperDim: z.number(),
  paperBlur: z.number(),
  ink: z.string(),
  shadow: z.string(),
  // the dark "text" on a card, and its pale read step
  text: z.string(),
  textRead: z.string(),
  orange: z.string(),
  purple: z.string(),
  blue: z.string(),
  // WORLD px at k = 1; see DEVIATIONS
  shadowOffset: z.number(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  paperSrc: "paper-supaclean-still.png",
  parallax: 0.15,
  paperDim: 0.88,
  paperBlur: 3,
  ink: WHITE,
  shadow: BLACK,
  text: "#111111",
  textRead: "#CDCDCD",
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  shadowOffset: 4,
});

// -- the logos (public/logos/*.svg, 24 x 24 viewBox, inlined) ----------------
const LOGOS: { d: string; evenodd: boolean }[] = [
  {
    // openai
    evenodd: false,
    d: "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z",
  },
  {
    // anthropic
    evenodd: false,
    d: "M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z",
  },
  {
    // meta
    evenodd: true,
    d: "M6.897 4c1.915 0 3.516.932 5.43 3.376l.282-.373c.19-.246.383-.484.58-.71l.313-.35C14.588 4.788 15.792 4 17.225 4c1.273 0 2.469.557 3.491 1.516l.218.213c1.73 1.765 2.917 4.71 3.053 8.026l.011.392.002.25c0 1.501-.28 2.759-.818 3.7l-.14.23-.108.153c-.301.42-.664.758-1.086 1.009l-.265.142-.087.04a3.493 3.493 0 01-.302.118 4.117 4.117 0 01-1.33.208c-.524 0-.996-.067-1.438-.215-.614-.204-1.163-.56-1.726-1.116l-.227-.235c-.753-.812-1.534-1.976-2.493-3.586l-1.43-2.41-.544-.895-1.766 3.13-.343.592C7.597 19.156 6.227 20 4.356 20c-1.21 0-2.205-.42-2.936-1.182l-.168-.184c-.484-.573-.837-1.311-1.043-2.189l-.067-.32a8.69 8.69 0 01-.136-1.288L0 14.468c.002-.745.06-1.49.174-2.23l.1-.573c.298-1.53.828-2.958 1.536-4.157l.209-.34c1.177-1.83 2.789-3.053 4.615-3.16L6.897 4zm-.033 2.615l-.201.01c-.83.083-1.606.673-2.252 1.577l-.138.199-.01.018c-.67 1.017-1.185 2.378-1.456 3.845l-.004.022a12.591 12.591 0 00-.207 2.254l.002.188c.004.18.017.36.04.54l.043.291c.092.503.257.908.486 1.208l.117.137c.303.323.698.492 1.17.492 1.1 0 1.796-.676 3.696-3.641l2.175-3.4.454-.701-.139-.198C9.11 7.3 8.084 6.616 6.864 6.616zm10.196-.552l-.176.007c-.635.048-1.223.359-1.82.933l-.196.198c-.439.462-.887 1.064-1.367 1.807l.266.398c.18.274.362.56.55.858l.293.475 1.396 2.335.695 1.114c.583.926 1.03 1.6 1.408 2.082l.213.262c.282.326.529.54.777.673l.102.05c.227.1.457.138.718.138.176.002.35-.023.518-.073.338-.104.61-.32.813-.637l.095-.163.077-.162c.194-.459.29-1.06.29-1.785l-.006-.449c-.08-2.871-.938-5.372-2.2-6.798l-.176-.189c-.67-.683-1.444-1.074-2.27-1.074z",
  },
  {
    // deepmind
    evenodd: true,
    d: "M5.988 1.622A8.539 8.539 0 003.45 8.446c.349 4.408 4.506 7.995 8.276 7.995 3.507 0 4.88-3.061 4.541-5.14a4.318 4.318 0 00-.95-2.073c.632.34 1.244.776 1.809 1.3 1.52 1.415 2.44 3.229 2.587 5.1C20.04 19.763 16.98 24 11.863 24c-1.695 0-3.48-.432-4.98-1.143C2.816 20.937 0 16.797 0 12.002 0 7.571 2.405 3.7 5.988 1.622zM12.136 0c1.696 0 3.481.432 4.98 1.143C21.186 3.063 24 7.203 24 11.998c0 4.431-2.405 8.303-5.988 10.38a8.539 8.539 0 002.538-6.824c-.349-4.408-4.506-7.995-8.276-7.995-3.507 0-4.88 3.061-4.541 5.14a4.3 4.3 0 00.953 2.073 8.723 8.723 0 01-1.81-1.3c-1.52-1.415-2.44-3.227-2.589-5.1C3.96 4.237 7.02 0 12.137 0z",
  },
  {
    // grok
    evenodd: true,
    d: "M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815",
  },
];

// -- the geometry, world px --------------------------------------------------
export const CARD_W = 600;
export const CARD_H = 230;
export const CARD_R = 28;
export const COL_PITCH = 640;
export const ROW_PITCH = 270;
export const ROW0_Y = 900; // centre of row 0
export const COL0_X = FRAME_W / 2;
const THUMB = 150;
const THUMB_X = 40;
const THUMB_Y = 40;
const BAR_X = 226;
const BAR_MAX = 334;

export const rowY = (r: number) => ROW0_Y + r * ROW_PITCH;
export const colX = (c: number) => COL0_X + c * COL_PITCH;

// -- the reader --------------------------------------------------------------
export const CYCLE = 14; // one card every 14 frames, the whole cut
export const PHASE = 4; // frame 0 is already mid-read
const SWEEP_C0 = 0.5;
const SWEEP_C1 = 8.5;
const CHECK_C0 = 7.5;
const CHECK_C1 = 10.5;
const STEP_C0 = 10;
const STEP_C1 = 14;
const stepEase = Easing.inOut(Easing.cubic);

export const reader = (f: number) => {
  const u = f + PHASE;
  const j = Math.floor(u / CYCLE);
  const c = u - j * CYCLE;
  return {
    j,
    sweep: clamp01((c - SWEEP_C0) / (SWEEP_C1 - SWEEP_C0)),
    check: clamp01((c - CHECK_C0) / (CHECK_C1 - CHECK_C0)),
    row: j + stepEase(clamp01((c - STEP_C0) / (STEP_C1 - STEP_C0))),
  };
};
// The reader's steady descent, which is what the camera rides: the stepped row
// averaged over a cycle.
export const readerLin = (f: number) => (f + PHASE) / CYCLE - 0.357;

// -- the camera --------------------------------------------------------------
export const K_OPEN = 1.0;
export const K_REST = 0.4;
export const K_END = 0.385;
export const PULL_F1 = 84;
export const PULL_WARP = 0.85;
export const READER_SCREEN_Y = 880;
const CAM_PAD = 40;

const keyK = (f: number) =>
  f <= PULL_F1
    ? K_OPEN * Math.pow(K_REST / K_OPEN, camEase(f / PULL_F1, PULL_WARP))
    : K_REST + ((K_END - K_REST) * (f - PULL_F1)) / (DURATION - PULL_F1);

const HKU_CAM_F: number[] = [];
const HKU_CAM_K: number[] = [];
for (let f = 0; f <= DURATION + CAM_PAD; f++) {
  HKU_CAM_F.push(f);
  HKU_CAM_K.push(keyK(f));
}
// The damped k for every frame, once. cy is not damped: it is the reader's own
// steady line plus the lift that puts the reader on READER_SCREEN_Y at that k.
export const CAM_K: number[] = HKU_CAM_F.map((f) => runCamera(f, HKU_CAM_F, HKU_CAM_K, HKU_CAM_K).k);
export const camAt = (f: number) => {
  const ff = Math.max(0, Math.min(DURATION + CAM_PAD, f));
  const i = Math.floor(ff);
  const k = i >= DURATION + CAM_PAD ? CAM_K[i] : CAM_K[i] + (CAM_K[i + 1] - CAM_K[i]) * (ff - i);
  const cy = rowY(readerLin(f)) + (FRAME_H / 2 - READER_SCREEN_Y) / k;
  return { k, cy, cx: COL0_X };
};
const visibleBottom = (f: number) => {
  const c = camAt(f);
  return c.cy + FRAME_H / 2 / c.k;
};

// -- the arrivals ------------------------------------------------------------
export const RATE_0 = 1 / 12; // cards per frame at f0
export const RATE_B = 0.039;
export const RATE_MAX = 2.1;
const rate = (f: number) => {
  const x = RATE_0 * Math.exp(RATE_B * f);
  return 1 / Math.cbrt(1 / (x * x * x) + 1 / (RATE_MAX * RATE_MAX * RATE_MAX));
};

type Card = {
  id: number;
  col: number;
  row: number;
  x: number;
  y: number;
  land: number; // the frame it stops; -Infinity for the cards that open the cut
  spawn: number;
  startY: number;
  logo: number; // -1 = a plain thumbnail
  bars: number[]; // widths
};

const makeBars = (id: number) => {
  const b = [BAR_MAX * (0.78 + 0.22 * hash(id, 3)), BAR_MAX * (0.55 + 0.4 * hash(id, 5))];
  if (hash(id, 7) > 0.35) b.push(BAR_MAX * (0.32 + 0.38 * hash(id, 9)));
  return b;
};
const pickLogo = (id: number, col: number, row: number) => {
  if (col === 0 && row === 1) return 0;
  if (col === 0 && row === 3) return 1;
  if (col === 0 && row === 5) return 2;
  if (col === 0 && (row === 0 || row === 2 || row === 4 || row < 0)) return -1;
  return hash(id, 11) < 0.3 ? Math.floor(hash(id, 13) * 5) % 5 : -1;
};

const landEase = Easing.out(Easing.cubic);

const buildCards = (): Card[] => {
  const cards: Card[] = [];
  let id = 0;
  const add = (col: number, row: number, land: number) => {
    const y = rowY(row);
    let spawn = -Infinity;
    let startY = y;
    if (Number.isFinite(land)) {
      startY = Math.max(visibleBottom(land), y) + CARD_H / 2 + 60;
      spawn = land - (9 + (startY - y) / 240);
    }
    cards.push({
      id,
      col,
      row,
      x: colX(col),
      y,
      land,
      spawn,
      startY,
      logo: pickLogo(id, col, row),
      bars: makeBars(id),
    });
    id++;
  };
  // What frame 0 already is: two read cards, the one being read, three unread.
  for (let r = -2; r <= 3; r++) add(0, r, -Infinity);

  // Each column's next free row. The side columns are brick-offset half a row.
  const next: Record<number, number> = { 0: 4, 1: -2.5, [-1]: -2.5, 2: -3, [-2]: -3 };
  const fits = (col: number, f: number) =>
    rowY(next[col]) - CARD_H / 2 < visibleBottom(f) - (col === 0 ? 0 : 60);
  const place = (f: number) => {
    if (fits(0, f)) return 0;
    for (const ring of [1, 2]) {
      const a = next[ring] <= next[-ring] ? ring : -ring;
      if (fits(a, f)) return a;
      if (fits(-a, f)) return -a;
    }
    return null; // the frame is full: this one lands somewhere off it
  };

  // Integrate the one rate curve; a card lands each time it crosses a whole.
  const DT = 0.05;
  let acc = 0.55;
  let n = 0;
  for (let t = 0; t <= DURATION + 8; t += DT) {
    acc += rate(t) * DT;
    while (acc >= n + 1) {
      n++;
      const col = place(t);
      if (col !== null) {
        add(col, next[col], t);
        next[col] += 1;
      }
    }
  }
  return cards;
};

export const CARDS = buildCards();

// -- the chain ---------------------------------------------------------------
export const CHAIN_F0 = 64; // "it's"
export const CHAIN_STAGGER = 2;
export const CHAIN_TRAVEL = 22;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

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
          width: FRAME_H * BG_OVERSIZE_HKU,
          height: FRAME_W * BG_OVERSIZE_HKU,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const CHECK_D = "M30 80 L62 112 L122 42";
const CHECK_LEN = 140;
const SWEEP_CLIP = "hku-unread-side";
const CROWN_CLIP = "hku-outside-frame";

const HardToKeepUp: React.FC<Props> = ({
  paperSrc,
  parallax,
  paperDim,
  paperBlur,
  ink,
  shadow,
  text,
  textRead,
  orange,
  purple,
  blue,
  shadowOffset,
}) => {
  const frame = useCurrentFrame();

  const cam = camAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const { tx, ty } = worldTransform(cx, cy, k);
  const cyRest = camAt(0).cy;

  // held near-constant on screen; see DEVIATIONS
  const so = shadowOffset * Math.pow(k, -0.8);
  const stroke = 20 * Math.pow(k, -0.7);
  const crownStep = 15 / Math.pow(k, 0.9);

  const rd = reader(frame);

  const top = cy - FRAME_H / 2 / k - CARD_H;
  const bottom = cy + FRAME_H / 2 / k + CARD_H;
  const left = cx - FRAME_W / 2 / k - CARD_W;
  const right = cx + FRAME_W / 2 / k + CARD_W;

  const content = (c: Card, fill: string) => (
    <>
      {c.logo < 0 ? (
        <rect x={THUMB_X} y={THUMB_Y} width={THUMB} height={THUMB} rx={16} fill={fill} />
      ) : (
        <path
          d={LOGOS[c.logo].d}
          fill={fill}
          fillRule={LOGOS[c.logo].evenodd ? "evenodd" : "nonzero"}
          transform={`translate(${THUMB_X} ${THUMB_Y}) scale(${THUMB / 24})`}
        />
      )}
      <rect x={BAR_X} y={46} width={c.bars[0]} height={38} rx={7} fill={fill} />
      <rect x={BAR_X} y={108} width={c.bars[1]} height={24} rx={7} fill={fill} />
      {c.bars.length > 2 ? (
        <rect x={BAR_X} y={154} width={c.bars[2]} height={24} rx={7} fill={fill} />
      ) : null}
    </>
  );

  const cardEls: React.ReactNode[] = [];
  for (const c of CARDS) {
    if (frame < c.spawn) continue;
    let y = c.y;
    if (frame < c.land) {
      const t = (frame - c.spawn) / (c.land - c.spawn);
      y = c.y + (c.startY - c.y) * (1 - landEase(t));
    }
    if (y < top || y > bottom || c.x < left || c.x > right) continue;

    // 0 unread, 1 read, 2 being read
    let state = 0;
    let check = 0;
    if (c.col === 0) {
      if (c.row < rd.j) {
        state = 1;
        check = 1;
      } else if (c.row === rd.j) {
        state = 2;
        check = rd.check;
      }
    }
    cardEls.push(
      <g key={c.id} transform={`translate(${(c.x - CARD_W / 2).toFixed(2)} ${(y - CARD_H / 2).toFixed(2)})`}>
        <rect x={so} y={so} width={CARD_W} height={CARD_H} rx={CARD_R} fill={shadow} />
        <rect width={CARD_W} height={CARD_H} rx={CARD_R} fill={ink} />
        {state === 0 ? content(c, text) : content(c, textRead)}
        {state === 2 ? <g clipPath={`url(#${SWEEP_CLIP})`}>{content(c, text)}</g> : null}
        {check > 0 ? (
          <path
            d={CHECK_D}
            transform={`translate(${THUMB_X} ${THUMB_Y})`}
            fill="none"
            stroke={text}
            strokeWidth={26}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={`${CHECK_LEN} ${CHECK_LEN}`}
            strokeDashoffset={CHECK_LEN * (1 - check)}
          />
        ) : null}
      </g>,
    );
  }

  // THE READER: a frame around its card, on the hard shadow, and from "it's"
  // the three chain colours rising out from behind it.
  const gap = 12;
  const m = gap + stroke;
  const bx = COL0_X - CARD_W / 2 - m;
  const by = rowY(rd.row) - CARD_H / 2 - m;
  const bw = CARD_W + 2 * m;
  const bh = CARD_H + 2 * m;
  const outer = rr(0, 0, bw, bh, CARD_R + m);
  const ring = `${outer} ${rr(stroke, stroke, bw - 2 * stroke, bh - 2 * stroke, CARD_R + gap)}`;
  const rise = (i: number) =>
    interpolate(
      frame,
      [CHAIN_F0 + i * CHAIN_STAGGER, CHAIN_F0 + i * CHAIN_STAGGER + CHAIN_TRAVEL],
      [0, 1],
      { easing: EASE_LAND, ...clamp },
    );
  const chain = [
    { color: orange, i: 0, steps: 3 },
    { color: purple, i: 1, steps: 2 },
    { color: blue, i: 2, steps: 1 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround
        src={paperSrc}
        frame={frame}
        cy={cy}
        cyRest={cyRest}
        cx={cx}
        cxRest={COL0_X}
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
              {/* the part of the card being read that the sweep has not reached */}
              <clipPath id={SWEEP_CLIP}>
                <rect x={rd.sweep * CARD_W} y={-10} width={CARD_W} height={CARD_H + 20} />
              </clipPath>
              {/* everything outside the reader frame's own silhouette */}
              <clipPath id={CROWN_CLIP}>
                <path clipRule="evenodd" d={`M-4000 -4000H4000V4000H-4000Z ${outer}`} />
              </clipPath>
            </defs>

            {cardEls}

            <g transform={`translate(${bx.toFixed(2)} ${by.toFixed(2)})`}>
              <path d={ring} fillRule="evenodd" fill={shadow} transform={`translate(${so} ${so})`} />
              {frame >= CHAIN_F0 ? (
                <g clipPath={`url(#${CROWN_CLIP})`}>
                  {chain.map((c) =>
                    frame >= CHAIN_F0 + c.i * CHAIN_STAGGER ? (
                      <path
                        key={c.color}
                        d={outer}
                        fill={c.color}
                        transform={`translate(0 ${(-rise(c.i) * c.steps * crownStep).toFixed(2)})`}
                      />
                    ) : null,
                  )}
                </g>
              ) : null}
              <path d={ring} fillRule="evenodd" fill={ink} />
            </g>
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default HardToKeepUp;
