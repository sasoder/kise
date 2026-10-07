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
  hash,
  sway,
  worldTransform,
} from "./fieldShared";

const { fontFamily } = loadFont("normal", {
  weights: ["800", "900"],
  subsets: ["latin"],
});

export const FPS = 24;
// TBPN 03 narrated, sequence 21.375 s -> 25.750 s. round(4.375 * 24) = 105.
export const DURATION = 105;

// ---------------------------------------------------------------------------
// "OPENAI BOUGHT THE SHOW". Core memory podcast graphic standard; the sibling
// of `PeakForSolar` (same paper, same hard shadow, same damped camera).
//
// CHECK LINE: "OpenAI paid more than $100 million and the show now sits inside
// OpenAI."
//
// THE PICTURE: a purchase is two things moving in opposite directions. The
// real OpenAI mark sits high, a chunky TV carrying the TBPN mark sits low.
// Money runs DOWN from the logo into a stack beside the TV; then the TV runs
// UP the way the money came and docks in the middle of the logo, and the chain
// colours rise behind the combined mark. One job: the sale.
//
// VERIFIED: OpenAI announced the acquisition of TBPN on 2 April 2026; the FT
// reported "low hundreds of millions". The narrator says "over $100 million",
// so the ONLY number on screen is `$100M+`. No date, no other figure.
//
// THE WORDS (frame = (t - 21.375) * 24):
//   OpenAI 1 | bought 12 | this tech 19 | show 28 | for over 34 | $100 46 |
//   million 64 | earlier 71 | this year 86-100 | hard cut at 105
//
// THE MOTION, one line from first frame to last:
//   f-8..10  the logo finishes its slide down into place (f0 is a picture:
//            both parties on the paper).
//   f10..62  banknotes leave the logo and land in a stack right of the TV.
//            Twelve notes, launch gaps shrinking (10 + 38 * (i/11)^0.8), 14 frames
//            of flight each; the last lands at f62.
//   f46..62  `$100M+` slides up 70 px under the TV-and-stack row, still by 62.
//   f64..88  the TV travels up to the logo's centre, scaling 1 -> 0.66.
//   f82..    the chain: orange f82, purple f84, blue f86 rise out from behind
//            the white mark to a crown of three stripes (36 / 24 / 12 px) on
//            Easing.bezier(0.16, 1, 0.3, 1) over 22 frames.
//   f90..105 settled; the camera creeps in.
//
// THE CAMERA (cx is 540 throughout; no CAM_LIFT, the focus is the true
// middle). Keys, then the house damper:
//   f0       k 1.00  cy 960
//   f10-40   cy 960 -> 1150           follows the money down a little
//   f62-84   k 1.00 -> 1.60, cy 1150 -> 600   follows the TV up, eases in
//   f86-105  k 1.60 -> 1.65           the creep
// The damped values at the beats are in the builder's hand-off note.
//
// INK: white flat shapes on a hard black copy at +4/+4 world px, zero blur.
// Black is otherwise used for two things only: the TV's screen and the `$` on
// a note (both are the shadow colour used as a cut-out, so the marks read at
// phone size). Chain colours appear once, on the payoff.
// ---------------------------------------------------------------------------

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const PAPER_BASE = "#C0C0C0";
const BG_OVERSIZE_LOCAL = 1.6;

// The real marks. OpenAI: public/logos/openai.svg (24 x 24 viewBox).
// TBPN wordmark: public/tbpn/tbpn-logo.svg (viewBox 4 0 1396 283).
const OPENAI_D =
  "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z";
const TBPN_D =
  "M4 55.6707V0H338.091V55.6707H235.544V278.354H106.594V55.6707H4ZM607.127 0C621.001 0 633.762 2.78354 645.501 8.35061C657.241 13.9177 666.568 21.8508 673.482 32.1962C680.674 42.2634 684.293 54.1862 684.293 67.9647C684.293 79.6091 681.648 89.7226 676.312 98.166C671.254 106.656 664.851 113.429 657.148 118.439C649.446 123.496 641.836 126.929 634.365 128.785C650.606 133.285 664.34 141.775 675.523 154.254C686.984 166.734 692.692 182.507 692.692 201.574C692.692 217.997 688.562 232.054 680.303 243.745C672.043 255.157 661.371 263.74 648.332 269.585C635.525 275.431 622.069 278.354 607.963 278.354H356.977V0H607.174H607.127ZM474.837 111.341H539.984C547.177 111.341 552.791 109.254 556.782 105.125C561.051 100.95 563.185 95.4289 563.185 88.5164V78.5421C563.185 71.3513 561.051 65.7842 556.782 61.9337C552.791 57.7584 547.177 55.7171 539.984 55.7171H474.837V111.388V111.341ZM474.837 222.683H540.402C548.151 222.683 554.276 220.734 558.777 216.837C563.324 212.709 565.552 206.956 565.552 199.626V190.116C565.552 182.786 563.278 177.172 558.777 173.275C554.23 169.146 548.105 167.059 540.402 167.059H474.837V222.729V222.683ZM830.504 278.354V180.93H958.712C974.628 180.93 988.966 176.94 1001.73 169.007C1014.49 160.796 1024.56 149.801 1031.98 136.022C1039.4 122.244 1043.12 106.841 1043.12 89.9082C1043.12 72.975 1039.4 57.2944 1031.98 43.7943C1024.56 30.2941 1014.49 19.6703 1001.73 11.9692C989.012 4.03613 974.674 0.0463923 958.712 0.0463923H711.484V278.4H830.504V278.354ZM909.341 63.0935C914.12 67.7791 916.486 74.3668 916.486 82.903V95.7072C916.486 104.243 914.12 110.831 909.341 115.517C904.561 120.202 897.926 122.522 889.434 122.522H830.504V55.7171H889.434C897.926 55.7171 904.561 58.1759 909.341 63.1399V63.0935ZM1061.96 0V278.354H1140.93V107.352L1252.94 278.354H1396V0H1316.61V171.373L1205.01 0H1061.96Z";
const TBPN_VB_W = 1396;
const TBPN_VB_H = 283;

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
  shadowOffset: z.number(),
  numeral: z.string(),
  beats: z.object({
    bought: z.number(),
    hundred: z.number(),
    payoff: z.number(),
    chain: z.number(),
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
  numeral: "$100M+",
  beats: { bought: 10, hundred: 46, payoff: 64, chain: 82 },
});

// -- the geometry, world px ---------------------------------------------------
export const LOGO_SIZE = 480;
export const LOGO_C = { x: 540, y: 600 };
export const TILE_W = 400;
export const TILE_H = 270;
export const TILE_HOME = { x: 300, y: 1425 };
export const TILE_DOCK_SCALE = 0.66;
export const NOTE_W = 170;
export const NOTE_H = 74;
export const NOTE_STEP = 18;
export const NOTES = 12;
export const STACK_X = 770;
export const STACK_BASE = 1580; // bottom edge of the first note, level with the TV's feet
export const NOTE_FLIGHT = 14;
export const NUM_SIZE = 220; // Barlow cap height 0.7 em = 154 world px
export const NUM_BASELINE = 1806;
export const NUM_RISE = 70;
export const NUM_FRAMES = 16;
export const CROWN_STEP = 12;
export const CHAIN_FRAMES = 22;
export const CHAIN_STAGGER = 2;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_TRAVEL = Easing.bezier(0.5, 0, 0.15, 1);

// -- the camera ---------------------------------------------------------------
const seg = (f0: number, f1: number, k0: number, k1: number, c0: number, c1: number, warp = 1) => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  for (let i = 0; i <= f1 - f0; i++) {
    const g = camEase(i / (f1 - f0), warp);
    F.push(f0 + i);
    K.push(k0 + (k1 - k0) * g);
    CY.push(c0 + (c1 - c0) * g);
  }
  return { F, K, CY };
};
export const K_WIDE = 1.0;
export const K_IN = 1.6;
export const K_END = 1.65;
export const CY_OPEN = 960;
export const CY_LOW = 1150;
export const CY_MARK = 600;
const DOWN = seg(10, 40, K_WIDE, K_WIDE, CY_OPEN, CY_LOW);
const UP = seg(62, 84, K_WIDE, K_IN, CY_LOW, CY_MARK, 0.85);
const CREEP = seg(86, DURATION, K_IN, K_END, CY_MARK, CY_MARK);
export const OBS_CAM_F = [0, ...DOWN.F, ...UP.F, ...CREEP.F];
export const OBS_CAM_K = [K_WIDE, ...DOWN.K, ...UP.K, ...CREEP.K];
export const OBS_CAM_CY = [CY_OPEN, ...DOWN.CY, ...UP.CY, ...CREEP.CY];

export const runCam = (upto: number) => {
  let cy = OBS_CAM_CY[0];
  let k = OBS_CAM_K[0];
  let vy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, OBS_CAM_F, OBS_CAM_CY, clamp);
    const tk = interpolate(f, OBS_CAM_F, OBS_CAM_K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, k };
};

// -- the notes ----------------------------------------------------------------
export const noteLaunch = (i: number, first: number) =>
  Math.round(first + 38 * Math.pow(i / (NOTES - 1), 0.8));
const noteRest = (i: number) => ({
  x: STACK_X + (hash(i, 3) - 0.5) * 22,
  y: STACK_BASE - NOTE_H / 2 - i * NOTE_STEP,
  rot: (hash(i, 7) - 0.5) * 7,
});

const PaperGround: React.FC<{
  src: string;
  frame: number;
  cy: number;
  cyRest: number;
  k: number;
  parallax: number;
  dim: number;
  blur: number;
}> = ({ src, frame, cy, cyRest, k, parallax, dim, blur }) => {
  const bgY = -(cy - cyRest) * k * parallax - frame * 0.3;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE_LOCAL,
          height: FRAME_W * BG_OVERSIZE_LOCAL,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(0px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

// The TV, drawn about its own centre. `solid` is the silhouette pass (the hard
// shadow); otherwise the full drawing: white body, black screen, the TBPN mark.
const Tv: React.FC<{ solid?: string; ink: string; shadow: string }> = ({ solid, ink, shadow }) => {
  const body = solid ?? ink;
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const wordW = 292;
  const wordS = wordW / TBPN_VB_W;
  const wordH = TBPN_VB_H * wordS;
  const ey = -46; // emblem centre
  return (
    <g>
      {/* the antenna pair: the "on air" detail */}
      <g stroke={body} strokeWidth={14} strokeLinecap="round">
        <line x1={-18} y1={-hh + 4} x2={-92} y2={-hh - 78} />
        <line x1={18} y1={-hh + 4} x2={78} y2={-hh - 62} />
      </g>
      <circle cx={-92} cy={-hh - 78} r={15} fill={body} />
      <circle cx={78} cy={-hh - 62} r={15} fill={body} />
      {/* feet */}
      <rect x={-hw + 48} y={hh - 4} width={56} height={24} fill={body} />
      <rect x={hw - 104} y={hh - 4} width={56} height={24} fill={body} />
      {/* body */}
      <rect x={-hw} y={-hh} width={TILE_W} height={TILE_H} rx={22} fill={body} />
      {solid ? null : (
        <g>
          <rect x={-hw + 24} y={-hh + 24} width={TILE_W - 48} height={TILE_H - 48} rx={8} fill={shadow} />
          {/* the TBPN emblem: a ring with a T-shaped bar across it */}
          <circle cx={0} cy={ey} r={42} fill="none" stroke={ink} strokeWidth={15} />
          <rect x={-80} y={ey - 17} width={160} height={34} fill={shadow} />
          <rect x={-18} y={ey} width={36} height={64} fill={shadow} />
          <rect x={-74} y={ey - 11} width={148} height={22} fill={ink} />
          <rect x={-12} y={ey} width={24} height={58} fill={ink} />
          {/* the real wordmark */}
          <path
            d={TBPN_D}
            fill={ink}
            transform={`translate(${-wordW / 2} ${hh - 24 - 16 - wordH}) scale(${wordS}) translate(-4 0)`}
          />
        </g>
      )}
    </g>
  );
};

const OpenAIBoughtTheShow: React.FC<Props> = ({
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
  numeral,
  beats,
}) => {
  const frame = useCurrentFrame();

  const cam = runCam(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = FRAME_W / 2 + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const so = shadowOffset;

  // -- the logo: finishing its slide down at f0 ------------------------------
  const logoDy = interpolate(frame, [-8, 10], [-260, 0], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const logoS = LOGO_SIZE / 24;
  const logoT = (dx: number, dy: number) =>
    `translate(${LOGO_C.x - LOGO_SIZE / 2 + dx} ${LOGO_C.y - LOGO_SIZE / 2 + logoDy + dy}) scale(${logoS})`;

  // -- the chain: three copies rising out from behind the white mark ---------
  const chainUp = (i: number, extra: number) => {
    const f0 = beats.chain + i * CHAIN_STAGGER;
    if (frame < f0) return null;
    const t = interpolate(frame, [f0, f0 + CHAIN_FRAMES], [0, 1], { easing: EASE_LAND, ...clamp });
    return -extra * t;
  };
  const chain = [
    { color: orange, dy: chainUp(0, 3 * CROWN_STEP) },
    { color: purple, dy: chainUp(1, 2 * CROWN_STEP) },
    { color: blue, dy: chainUp(2, CROWN_STEP) },
  ];

  // -- the TV: home, then up the way the money came ---------------------------
  const tu = interpolate(frame, [beats.payoff, beats.payoff + 24], [0, 1], {
    easing: EASE_TRAVEL,
    ...clamp,
  });
  const tileX = TILE_HOME.x + (LOGO_C.x - TILE_HOME.x) * (1 - Math.pow(1 - tu, 2));
  const tileY = TILE_HOME.y + (LOGO_C.y + 8 - TILE_HOME.y) * tu;
  const tileS = 1 + (TILE_DOCK_SCALE - 1) * tu;

  // -- the notes ---------------------------------------------------------------
  const notes = Array.from({ length: NOTES }, (_, i) => {
    const f0 = noteLaunch(i, beats.bought);
    if (frame < f0) return null;
    const u = interpolate(frame, [f0, f0 + NOTE_FLIGHT], [0, 1], clamp);
    const rest = noteRest(i);
    const sx = LOGO_C.x;
    const syy = LOGO_C.y + 120;
    // leaves straight down, sweeps across to the stack, lands on it
    const gx = u * u * (3 - 2 * u);
    const gy = Math.pow(u, 1.35);
    const x = sx + (rest.x - sx) * gx;
    const y = syy + (rest.y - syy) * gy;
    const rot = rest.rot + (1 - u) * (i % 2 === 0 ? -24 : 20);
    const s = interpolate(u, [0, 0.28], [0.35, 1], clamp);
    return { i, x, y, rot, s, landed: u >= 1 };
  }).filter((n): n is NonNullable<typeof n> => n !== null);

  const note = (n: (typeof notes)[number]) => (
    <g key={n.i}>
      <g transform={`translate(${n.x + so} ${n.y + so}) rotate(${n.rot}) scale(${n.s})`}>
        <rect x={-NOTE_W / 2} y={-NOTE_H / 2} width={NOTE_W} height={NOTE_H} rx={8} fill={shadow} />
      </g>
      <g transform={`translate(${n.x} ${n.y}) rotate(${n.rot}) scale(${n.s})`}>
        <rect x={-NOTE_W / 2} y={-NOTE_H / 2} width={NOTE_W} height={NOTE_H} rx={8} fill={ink} />
        <circle cx={0} cy={0} r={25} fill={shadow} />
        <text
          x={0}
          y={15}
          textAnchor="middle"
          fill={ink}
          style={{ fontFamily, fontWeight: 900, fontSize: 42 }}
        >
          $
        </text>
        <rect x={-NOTE_W / 2 + 14} y={-7} width={22} height={14} fill={shadow} />
        <rect x={NOTE_W / 2 - 36} y={-7} width={22} height={14} fill={shadow} />
      </g>
    </g>
  );

  const numDy = interpolate(frame, [beats.hundred, beats.hundred + NUM_FRAMES], [NUM_RISE, 0], {
    easing: EASE_LAND,
    ...clamp,
  });
  const numStyle = { fontFamily, fontWeight: 900, fontSize: NUM_SIZE, textTransform: "uppercase" } as const;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround
        src={paperSrc}
        frame={frame}
        cy={cy}
        cyRest={CY_OPEN}
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
            {/* `$100M+`: the one number, under the TV and the stack */}
            {frame >= beats.hundred ? (
              <g>
                <text x={540 + so} y={NUM_BASELINE + numDy + so} textAnchor="middle" fill={shadow} style={numStyle}>
                  {numeral}
                </text>
                <text x={540} y={NUM_BASELINE + numDy} textAnchor="middle" fill={ink} style={numStyle}>
                  {numeral}
                </text>
              </g>
            ) : null}

            {/* the money: landed notes first (bottom to top), then the ones in flight */}
            {notes.filter((n) => n.landed).map(note)}
            {notes.filter((n) => !n.landed).map(note)}

            {/* OpenAI: shadow, orange, purple, blue, white core */}
            <path d={OPENAI_D} fill={shadow} transform={logoT(so, so)} />
            {chain.map((c) =>
              c.dy === null ? null : <path key={c.color} d={OPENAI_D} fill={c.color} transform={logoT(0, c.dy)} />,
            )}
            <path d={OPENAI_D} fill={ink} transform={logoT(0, 0)} />

            {/* the show */}
            <g transform={`translate(${tileX + so} ${tileY + so}) scale(${tileS})`}>
              <Tv solid={shadow} ink={ink} shadow={shadow} />
            </g>
            <g transform={`translate(${tileX} ${tileY}) scale(${tileS})`}>
              <Tv ink={ink} shadow={shadow} />
            </g>
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default OpenAIBoughtTheShow;
