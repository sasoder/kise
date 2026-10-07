import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  FRAME_H,
  FRAME_W,
  camEase,
  clamp,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Clip "TBPN 03 narrated". The sequence runs 3.000 s -> 7.458 s:
// round(4.458 * 24) = 107 frames, frame = (t - 3.000) * 24. The cut back to
// the speaker is at 107.
export const DURATION = 107;

// ---------------------------------------------------------------------------
// "RESEARCHERS TRADED". Core memory podcast graphic standard; the sibling of
// `PeakForSolar` (same paper, same hard shadow, same damped camera).
//
// CHECK LINE: "AI researchers move between the big labs the way players are
// traded between teams."
//
// THE PICTURE IS A TRANSFER WINDOW. Three team crests — the real OpenAI, Meta
// and Anthropic marks knocked out in black from a solid white shield —
// each with its roster: a short row of identical trading cards (white, hard
// shadow, a head-and-shoulders glyph in the shadow's own black). The teams sit
// on a triangle around the middle of the frame, rosters toward the middle and
// crests outward, so every trade travels through the centre. There is no type:
// the logos identify the teams.
//
// ONE JOB: people changing teams. One continuous motion: a card leaves a
// roster, arcs through the middle, slots into another roster while the rosters
// close up / make room. Something is always travelling.
//
//   word          frame   what the motion is doing
//   TBPN            0     board is there; O->A card already lifting (left f-8)
//   covers         11     O->A mid-flight; OpenAI's row closing up
//   tech           23     O->A has landed (f22); A->M (left f14) travelling
//   like a         29
//   soap           40     A->M lands f40; M->O (left f34) dips through the middle
//   opera,         45     camera starts easing in (keys f48-62)
//   AI             58     M->O lands f58
//   researchers    64     THE SWAP: an OpenAI card and a Meta card left at f60
//   are            76     ...and pass each other in the middle of the frame
//   traded         83     both land in the other's gap at f89; the chain
//                         copies collapse under them by f94
//   (tail)      96-107    camera is back on the board (keys f85-97); an
//                         Anthropic card is just lifting out for the next trade
//
// THE ROSTERS are a continuous layout, not keyed slots: every card that is
// ever on a team is a STINT with a presence weight w(f) in 0..1 (eased 0->1
// over the 14 frames before it lands = the row makes room; eased 1->0 over 14
// frames after it leaves = the row closes up). A card's x is the centre of its
// own weighted interval in the row, so overlapping arrivals and departures on
// one team blend without a step. The swap is the exception: the two gaps stay
// open and each card lands in the other's gap — that is what makes it read as
// a straight swap.
//
// THE CHAIN (orange #FFB765 / purple #BC37FF / blue #0046FF) has ONE job in
// this cut: it is the trail of the two swapped cards. Each colour is a copy of
// the card on the same path, 1.5 / 3 / 4.5 frames behind (2 put six colour
// blocks in one pile where the lanes pass) (blue nearest, orange
// last), stacked shadow / orange / purple / blue / white. They come out from
// under the card as it leaves and collapse under it as it lands. No other
// element is coloured.
//
// THE CAMERA — `fieldShared.runCamera` (house damper), cx fixed on 540, keys
// one per frame through `camEase`:
//   OPEN   f0      k 1.00, cy 976 (the whole board, 125..1807, sides 60..1020)
//   CREEP  f0-48   k 1.00 -> 1.025
//   IN     f48-62  k 1.025 -> 1.046, cy 976 -> 967 (v3: capped so every card
//                  and crest keeps >= 30 screen px to the frame edge)
//   HOLD   f62-85  k 1.046 -> 1.052 (the held breath under the swap)
//   OUT    f85-97  k 1.052 -> 1.02, cy 967 -> 976, then a creep to the cut
//   Damped values at the beats are printed in the build report.
// ---------------------------------------------------------------------------

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const PAPER_BASE = "#C0C0C0";
const BG_OVERSIZE_RT = 1.6;

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
});

// ---------------------------------------------------------------------------
// GEOMETRY, world px.
// ---------------------------------------------------------------------------
export const CARD_W = 120;
export const CARD_H = 165;
export const CARD_R = 15;
export const PITCH = 134;

type TeamId = "O" | "M" | "A";
const TEAMS: Record<TeamId, { cx: number; crestY: number; rosterY: number }> = {
  O: { cx: 254, crestY: 290, rosterY: 600 },
  M: { cx: 826, crestY: 290, rosterY: 600 },
  A: { cx: 540, crestY: 1622, rosterY: 1345 },
};

// The real marks, 24 x 24 viewBoxes, from public/logos/*.svg — inlined, because
// an SVG <image> through staticFile flashes.
const LOGO_OPENAI =
  "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z";
const LOGO_META =
  "M6.897 4c1.915 0 3.516.932 5.43 3.376l.282-.373c.19-.246.383-.484.58-.71l.313-.35C14.588 4.788 15.792 4 17.225 4c1.273 0 2.469.557 3.491 1.516l.218.213c1.73 1.765 2.917 4.71 3.053 8.026l.011.392.002.25c0 1.501-.28 2.759-.818 3.7l-.14.23-.108.153c-.301.42-.664.758-1.086 1.009l-.265.142-.087.04a3.493 3.493 0 01-.302.118 4.117 4.117 0 01-1.33.208c-.524 0-.996-.067-1.438-.215-.614-.204-1.163-.56-1.726-1.116l-.227-.235c-.753-.812-1.534-1.976-2.493-3.586l-1.43-2.41-.544-.895-1.766 3.13-.343.592C7.597 19.156 6.227 20 4.356 20c-1.21 0-2.205-.42-2.936-1.182l-.168-.184c-.484-.573-.837-1.311-1.043-2.189l-.067-.32a8.69 8.69 0 01-.136-1.288L0 14.468c.002-.745.06-1.49.174-2.23l.1-.573c.298-1.53.828-2.958 1.536-4.157l.209-.34c1.177-1.83 2.789-3.053 4.615-3.16L6.897 4zm-.033 2.615l-.201.01c-.83.083-1.606.673-2.252 1.577l-.138.199-.01.018c-.67 1.017-1.185 2.378-1.456 3.845l-.004.022a12.591 12.591 0 00-.207 2.254l.002.188c.004.18.017.36.04.54l.043.291c.092.503.257.908.486 1.208l.117.137c.303.323.698.492 1.17.492 1.1 0 1.796-.676 3.696-3.641l2.175-3.4.454-.701-.139-.198C9.11 7.3 8.084 6.616 6.864 6.616zm10.196-.552l-.176.007c-.635.048-1.223.359-1.82.933l-.196.198c-.439.462-.887 1.064-1.367 1.807l.266.398c.18.274.362.56.55.858l.293.475 1.396 2.335.695 1.114c.583.926 1.03 1.6 1.408 2.082l.213.262c.282.326.529.54.777.673l.102.05c.227.1.457.138.718.138.176.002.35-.023.518-.073.338-.104.61-.32.813-.637l.095-.163.077-.162c.194-.459.29-1.06.29-1.785l-.006-.449c-.08-2.871-.938-5.372-2.2-6.798l-.176-.189c-.67-.683-1.444-1.074-2.27-1.074z";
const LOGO_ANTHROPIC =
  "M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z";

const LOGOS: Record<TeamId, { d: string; size: number; evenodd?: boolean }> = {
  O: { d: LOGO_OPENAI, size: 190 },
  M: { d: LOGO_META, size: 216, evenodd: true },
  A: { d: LOGO_ANTHROPIC, size: 184 },
};

// The shield, centred on its own origin: 302 wide, -165..185 tall. v2: a SOLID
// white body with the mark knocked out in black, the cards' own logic.
const SHIELD_D = "M-151 -165 L151 -165 L151 28 C151 112 78 156 0 185 C-78 156 -151 112 -151 28 Z";
const LOGO_DY = -20; // the mark sits in the shield's wide part

// ---------------------------------------------------------------------------
// STINTS AND FLIGHTS.
// ---------------------------------------------------------------------------
const ROOM = 14; // frames a row takes to make room / close up
const NEVER = 9999;

type Stint = {
  id: string;
  team: TeamId;
  // frame the card lands (-NEVER: there from the start) and how the row
  // receives it: "room" opens a gap ahead of it, "swap" takes an open gap.
  land: number;
  landMode: "room" | "swap";
  // frame the card lifts out (NEVER: stays) and how the row answers:
  // "close" closes up behind it, "swap" keeps the gap until `gapUntil`.
  lift: number;
  liftMode: "close" | "swap";
  gapUntil: number;
};

const stay = (id: string, team: TeamId, over: Partial<Stint> = {}): Stint => ({
  id,
  team,
  land: -NEVER,
  landMode: "room",
  lift: NEVER,
  liftMode: "close",
  gapUntil: NEVER,
  ...over,
});

// the trades
export const T1 = { start: -8, end: 22 }; // OpenAI -> Anthropic
export const T2 = { start: 14, end: 40 }; // Anthropic -> Meta
export const T3 = { start: 34, end: 58 }; // Meta -> OpenAI
export const SWAP = { start: 60, end: 89 }; // OpenAI <-> Meta
export const T5 = { start: 96, end: 132 }; // Anthropic -> Meta (only lifts)
export const CHAIN_STAGGER = 1.5;

// Each team's row, in row order (left to right).
const ROSTERS: Record<TeamId, Stint[]> = {
  O: [
    stay("o1", "O"),
    stay("o2", "O", { lift: SWAP.start, liftMode: "swap", gapUntil: SWAP.end }),
    stay("swO", "O", { land: SWAP.end, landMode: "swap" }),
    stay("o3", "O", { lift: T1.start }),
    stay("x3", "O", { land: T3.end }),
  ],
  M: [
    stay("x2", "M", { land: T2.end, lift: SWAP.start, liftMode: "swap", gapUntil: SWAP.end }),
    stay("swM", "M", { land: SWAP.end, landMode: "swap" }),
    stay("m1", "M", { lift: T3.start }),
    stay("m2", "M"),
    stay("x5", "M", { land: T5.end }),
  ],
  A: [
    stay("x1", "A", { land: T1.end }),
    stay("a1", "A"),
    stay("a2", "A", { lift: T2.start }),
    stay("a3", "A", { lift: T5.start }),
  ],
};

const weight = (s: Stint, f: number) => {
  let w = 1;
  if (s.land > -NEVER) {
    w = s.landMode === "swap" ? (f >= s.land ? 1 : 0) : smoothstep((f - (s.land - ROOM)) / ROOM);
  }
  if (s.lift < NEVER) {
    w *= s.liftMode === "swap" ? (f < s.gapUntil ? 1 : 0) : 1 - smoothstep((f - (s.lift + 2)) / ROOM);
  }
  return w;
};

const slotPos = (team: TeamId, id: string, f: number) => {
  const row = ROSTERS[team];
  let n = 0;
  let before = 0;
  let mine = 0;
  let seen = false;
  for (const s of row) {
    const w = weight(s, f);
    if (s.id === id) {
      seen = true;
      mine = w;
    } else if (!seen) {
      before += w;
    }
    n += w;
  }
  const t = TEAMS[team];
  return { x: t.cx - (n * PITCH) / 2 + (before + mine / 2) * PITCH, y: t.rosterY };
};

type Flight = {
  key: string;
  from: [TeamId, string];
  to: [TeamId, string];
  start: number;
  end: number;
  // the control point's offset from the chord's midpoint (the curve's own
  // middle sits at half of it)
  bow: [number, number];
  lift: number; // extra scale at mid-flight
  tilt: number; // degrees at mid-flight
  chain: boolean;
};

const FLIGHTS: Flight[] = [
  // v2: one early trade per leg, round the triangle — O->A, A->M, M->O.
  { key: "t1", from: ["O", "o3"], to: ["A", "x1"], ...T1, bow: [210, 0], lift: 0.3, tilt: 5, chain: false },
  { key: "t2", from: ["A", "a2"], to: ["M", "x2"], ...T2, bow: [-200, 0], lift: 0.3, tilt: -5, chain: false },
  { key: "t3", from: ["M", "m1"], to: ["O", "x3"], ...T3, bow: [0, 560], lift: 0.3, tilt: -5, chain: false },
  // THE SWAP: two lanes of one lens, upper mid y 800, lower mid y 1070.
  { key: "swA", from: ["M", "x2"], to: ["O", "swO"], ...SWAP, bow: [0, 400], lift: 0.3, tilt: 6, chain: true },
  { key: "swB", from: ["O", "o2"], to: ["M", "swM"], ...SWAP, bow: [0, 940], lift: 0.3, tilt: 6, chain: true },
  { key: "t5", from: ["A", "a3"], to: ["M", "x5"], ...T5, bow: [-190, 0], lift: 0.3, tilt: -5, chain: false },
];

const FLY_EASE = Easing.bezier(0.45, 0, 0.25, 1);

const flightAt = (fl: Flight, f: number) => {
  const p0 = slotPos(fl.from[0], fl.from[1], fl.start);
  const p1 = slotPos(fl.to[0], fl.to[1], fl.end);
  const u = interpolate(f, [fl.start, fl.end], [0, 1], { easing: FLY_EASE, ...clamp });
  const cxp = (p0.x + p1.x) / 2 + fl.bow[0];
  const cyp = (p0.y + p1.y) / 2 + fl.bow[1];
  const a = (1 - u) * (1 - u);
  const b = 2 * u * (1 - u);
  const c = u * u;
  const hump = Math.sin(Math.PI * u);
  return {
    x: a * p0.x + b * cxp + c * p1.x,
    y: a * p0.y + b * cyp + c * p1.y,
    s: 1 + fl.lift * hump,
    r: fl.tilt * Math.sin(2 * Math.PI * u) * 0.5 + fl.tilt * 0.5 * hump,
  };
};

// ---------------------------------------------------------------------------
// THE CAMERA. One key per frame, so the damper's target IS the eased curve.
// ---------------------------------------------------------------------------
export const CY_WIDE = 976;
export const CY_TIGHT = 967;
const CAM_SEGS = [
  { f0: 0, f1: 48, k0: 1.0, k1: 1.025, c0: CY_WIDE, c1: CY_WIDE, warp: 0 },
  { f0: 48, f1: 62, k0: 1.025, k1: 1.046, c0: CY_WIDE, c1: CY_TIGHT, warp: 0.8 },
  { f0: 62, f1: 85, k0: 1.046, k1: 1.052, c0: CY_TIGHT, c1: CY_TIGHT, warp: 0 },
  { f0: 85, f1: 97, k0: 1.052, k1: 1.02, c0: CY_TIGHT, c1: CY_WIDE, warp: 0.7 },
  { f0: 97, f1: DURATION, k0: 1.02, k1: 1.026, c0: CY_WIDE, c1: CY_WIDE, warp: 0 },
];
export const RT_CAM_F: number[] = [];
export const RT_CAM_K: number[] = [];
export const RT_CAM_CY: number[] = [];
for (const s of CAM_SEGS) {
  for (let f = s.f0 + (RT_CAM_F.length ? 1 : 0); f <= s.f1; f++) {
    const u = (f - s.f0) / (s.f1 - s.f0);
    const g = s.warp === 0 ? u : camEase(u, s.warp); // warp 0 = a linear creep
    RT_CAM_F.push(f);
    RT_CAM_K.push(s.k0 + (s.k1 - s.k0) * g);
    RT_CAM_CY.push(s.c0 + (s.c1 - s.c0) * g);
  }
}

// ---------------------------------------------------------------------------
// THE GROUND — PeakForSolar's PaperGround, unchanged.
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
          width: FRAME_H * BG_OVERSIZE_RT,
          height: FRAME_W * BG_OVERSIZE_RT,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

// A card's silhouette, centred on its own origin.
const CardRect: React.FC<{ fill: string }> = ({ fill }) => (
  <rect x={-CARD_W / 2} y={-CARD_H / 2} width={CARD_W} height={CARD_H} rx={CARD_R} fill={fill} />
);
// The person on it: a head and a pair of shoulders, in the shadow's black.
const Person: React.FC<{ fill: string }> = ({ fill }) => (
  <g fill={fill}>
    <circle cx={0} cy={-25} r={21} />
    <path d="M-39 55 V45 A39 38 0 0 1 39 45 V55 Z" />
  </g>
);

type Pose = { x: number; y: number; s: number; r: number };
const place = (p: Pose, dx = 0) =>
  `translate(${(p.x + dx).toFixed(2)} ${(p.y + dx).toFixed(2)}) rotate(${p.r.toFixed(2)}) scale(${p.s.toFixed(4)})`;

const ResearchersTraded: React.FC<Props> = ({
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
}) => {
  const frame = useCurrentFrame();

  const cam = runCamera(frame, RT_CAM_F, RT_CAM_CY, RT_CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = FRAME_W / 2 + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  const card = (key: string, p: Pose) => (
    <g key={key}>
      <g transform={place(p, shadowOffset)}>
        <CardRect fill={shadow} />
      </g>
      <g transform={place(p)}>
        <CardRect fill={ink} />
        <Person fill={shadow} />
      </g>
    </g>
  );

  const teamIds: TeamId[] = ["O", "M", "A"];
  const flying = FLIGHTS.filter((fl) => frame >= fl.start && frame < fl.end + 3 * CHAIN_STAGGER);

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround
        src={paperSrc}
        frame={frame}
        cy={cy}
        cyRest={RT_CAM_CY[0]}
        cx={cx}
        cxRest={FRAME_W / 2}
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
            {/* THE CRESTS: the real mark in a shield, on the hard shadow. */}
            {teamIds.map((id) => {
              const t = TEAMS[id];
              const logo = LOGOS[id];
              const sc = logo.size / 24;
              const mark = (fill: string, off: number) => (
                <g
                  transform={`translate(${t.cx + off - logo.size / 2} ${t.crestY + LOGO_DY + off - logo.size / 2}) scale(${sc})`}
                >
                  <path d={logo.d} fill={fill} fillRule={logo.evenodd ? "evenodd" : "nonzero"} />
                </g>
              );
              const shield = (fill: string, off: number) => (
                <path d={SHIELD_D} transform={`translate(${t.cx + off} ${t.crestY + off})`} fill={fill} />
              );
              return (
                <g key={id}>
                  {shield(shadow, shadowOffset)}
                  {shield(ink, 0)}
                  {mark(shadow, 0)}
                </g>
              );
            })}

            {/* THE ROSTERS: every card that is on a team right now. */}
            {teamIds.map((id) =>
              ROSTERS[id].map((s) => {
                if (frame < s.land || frame >= s.lift) {
                  return null;
                }
                const p = slotPos(id, s.id, frame);
                return card(s.id, { ...p, s: 1, r: 0 });
              }),
            )}

            {/* THE TRADES, over everything. */}
            {flying.map((fl) => {
              const landed = frame >= fl.end;
              const core = flightAt(fl, frame);
              const copies = fl.chain
                ? [
                    { color: orange, lag: 3 * CHAIN_STAGGER },
                    { color: purple, lag: 2 * CHAIN_STAGGER },
                    { color: blue, lag: CHAIN_STAGGER },
                  ]
                : [];
              if (landed && !fl.chain) {
                return null;
              }
              return (
                <g key={fl.key}>
                  {landed ? null : (
                    <g transform={place(core, shadowOffset)}>
                      <CardRect fill={shadow} />
                    </g>
                  )}
                  {copies.map((c) =>
                    frame < fl.end + c.lag ? (
                      <g key={c.color} transform={place(flightAt(fl, frame - c.lag))}>
                        <CardRect fill={c.color} />
                      </g>
                    ) : null,
                  )}
                  {/* once it has landed the roster draws the card; redraw it
                      here so it stays above its own collapsing copies */}
                  <g transform={place(core)}>
                    <CardRect fill={ink} />
                    <Person fill={shadow} />
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ResearchersTraded;
