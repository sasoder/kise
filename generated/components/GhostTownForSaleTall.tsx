import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  BLACK,
  CROWN_STEP,
  ChainEcho,
  INK,
  OP_FULL,
  OP_LOW,
  OP_MID,
  PAPER_BASE,
  PAPER_BLUR,
  PAPER_DIM,
  PAPER_PARALLAX,
  PAPER_SRC,
  SHADOW,
  SHADOW_OFF,
  camMove169,
  clamp,
  runCamera2,
  sway,
  textRise,
  type,
} from "./cerroShared";
import { type Props, defaultProps, schema, textWidth } from "./GhostTownForSale";
import { LISTING_PHOTO_DATA_URL } from "./ghostTownAssets";

export { defaultProps, schema };
export const FPS = 24;
// The same audio as the 16:9 cut: trailer SRT 12.888 -> 17.309 s.
// round((17.309 - 12.888) * 24) = 106 frames of speech + a 16 frame tail = 122.
export const DURATION = 122;
export const TALL_W = 1080;
export const TALL_H = 1920;

// ---------------------------------------------------------------------------
// GHOST TOWN FOR SALE (TALL) — the 9:16 sibling of GhostTownForSale, cut 3 of
// the Cerro Gordo set. 1080 x 1920, 24 fps, opaque. The 16:9 file is untouched;
// this one imports its schema / defaultProps / textWidth and the shared ink,
// chain, type and camera maths from cerroShared.
//
// CHECK LINE: "Among ordinary listings there was one that was an entire ghost
// town, and it cost less than a million dollars."
//
// "A friend of mine sent me this listing that said you know buy your own ghost
//  town for under a million"
//   word                    trailer s   f
//   A friend of mine        12.888      0
//   sent me this listing    13.555     16
//   that said               14.223     32
//   you know                14.598     41
//   buy your own            15.641     66
//   ghost town              16.183     79
//   for                     16.642     90
//   under                   ~16.80     94
//   million                 ~17.10    101
//   speech end              17.309    106   (+16 tail = DURATION 122)
//
// REIMAGINED for the tall frame: a PHONE FEED. One column of listing cards,
// 900 px wide at the open with 84 px between them, running off the top and the
// bottom of the frame — someone scrolling a property app. Ordinary cards are a
// grey (#B4B4B4) image slot, two grey title word-bars whose lengths vary per
// card by hash, and a small darker (#8C8C8C) price-bar; the Cerro Gordo card
// has the real June 2018 listing photograph (untinted, cover-cropped to 16:10,
// inline base64) and, until its words arrive, the same bars as everyone else.
//
// v2, on the director's review: THE PRICE IS THE PUNCHLINE, so the badge is the
// biggest type (98 world = 104.5 screen px at rest, against the title's 81);
// and the ordinary cards got the varied bars + darker price-bar so the open
// reads as listings, not an unloaded page.
//
// THE CARD, world px (card-local y; world = screen at the open, k 1): 900 wide,
// radius 26. Photo 848 x 530 (16:10) inset 26. Title Barlow 900 at 76, black,
// cap top 578, baseline 631.2 — 10.70 em = 813 px = 90 % of the card. The price
// badge: Barlow 900 at 98 in a white pill 104 tall and 848 wide (94 % of the
// card: at >= 104 px the words alone are 88 % of it, so "~80 %" could not be
// met) centred ON the card's bottom edge (y 731.2); its crown rests 12 / 24 /
// 36 above the pill top, 12 under the title baseline. Card pitch 815.2.
//
// THE CAPTION STRIP. The camera pins the card's bottom edge (the badge's centre
// line) to screen y 1024 at every k, so at rest (k 1.067) the card's top is at
// y 244, the photo 272-837, the title's ink 861-917, the crown from 930, the
// badge 968-1080 and its hard shadow ends at 1083.7-1084.4. Nothing that must
// be read is in y 1085-1250; the next card starts at ~1114 on the 0.3 rung.
//
// THE GESTURES — the 16:9 cut's, one continuous motion:
//   f0-16   "A friend of mine": the feed is already scrolling up, constant
//           84 px/f (4.4 % of the frame height per frame; the 16:9 cut's 55 is
//           5.1 % of its own). The listing's photo enters from the bottom ~f4.
//   f16-38  "sent me this listing / that said": friction, v = V (1 - u)^2 over
//           22 frames; it arrives at rest with zero velocity and zero
//           deceleration — no overshoot.
//   f35-66  "you know": a gentle push, k 1.0 -> 1.067 (the card 900 -> 960 px
//           wide); the neighbours above and below dim 1.0 -> 0.55 -> 0.3,
//           driven by the damped k.
//   f67-79  "buy your own ghost town": the listing's two grey title bars shrink
//           to 0.6 and fade out over 8 frames while GHOST TOWN FOR SALE slides
//           up 24 screen px and fades in over 12, landing ON "ghost town" f79.
//   f85-101 "for under a million" — THE PAYOFF, the cut's one chain echo (house
//           order, colours lead, no clip): orange f85, purple f87, blue f89, the
//           white badge with its text and hard shadow f91, each rising 30 world
//           px on EASE_LAND (bands <= 25.8 px, 12 at rest). The listing's
//           price-bar fades out f85-93.
//   f101-121 hold: the camera creeps k 1.067 -> 1.078. Nothing new.
//
// THE CAMERA — the house damped tracker (shared runCamera2), cx fixed at 540;
// cy = 731.2 - 64/k (camMove169's maths with lift -64: the card's bottom edge
// on screen y 1024). Sway on top.
//   OPEN   f0-35   k 1.0000 — held; the feed is the motion.
//   PUSH   f35-57  k 1.0 -> 1.0667, warp 1.
//   CREEP  f57-122 k 1.0667 -> 1.078, warp 1.
//   damped:  f     k        card top  shadow bottom (screen y)   title / price px
//            0     1.0000   2252.8    (listing below the frame; enters ~f4)
//            16    1.0000   908.8
//            32    1.0000   305.3     1092.5   (still arriving)
//            38    1.0006   292.4     1080.0   listing at rest
//            41    1.0037   290.1     1080.2   "you know"
//            48    1.0247   274.8     1081.4   fastest, 0.38 %/f
//            55    1.0522   254.6     1082.9
//            66    1.0667   244.0     1083.7   "buy"
//            79    1.0688   242.5     1083.9   "ghost town"   81.2 / 104.7
//            101   1.0742   238.5     1084.2   "million"      81.6 / 105.3
//            121   1.0777   236.0     1084.4
// ---------------------------------------------------------------------------

// -- the card, world px ---------------------------------------------------------
export const CARD_W = 900;
export const CARD_R = 26;
const CAP = 0.7;
export const PHOTO_PAD = 26;
export const PHOTO_W = CARD_W - 2 * PHOTO_PAD; // 848
export const PHOTO_H = 530; // 16:10
export const PHOTO_R = 12;
export const TITLE_SIZE = 76;
export const TITLE_CAP_TOP = PHOTO_PAD + PHOTO_H + 22; // 578
export const TITLE_BASE = TITLE_CAP_TOP + CAP * TITLE_SIZE; // 631.2
export const PRICE_SIZE = 98; // 104.5 screen px at rest: the punchline is the biggest type
export const PILL_H = 104;
export const PILL_PAD_X = 28;
export const CROWN = 3 * CROWN_STEP; // 36
export const CROWN_CLEAR = 12;
export const PILL_TOP = TITLE_BASE + CROWN_CLEAR + CROWN; // 679.2
export const CARD_H = PILL_TOP + PILL_H / 2; // 717.2: the pill's centre line
export const PRICE_BASE = CARD_H + (CAP * PRICE_SIZE) / 2;
export const TITLE_BAR_H = 44;
export const PRICE_BAR_H = 36;
export const PRICE_BAR_CY = (TITLE_BASE + CARD_H) / 2;
export const CARD_GAP = 84;
export const PITCH = CARD_H + CARD_GAP;
export const CARD_X = TALL_W / 2 - CARD_W / 2; // 90
export const CARD_REST_TOP = 0;
export const ROW_FROM = -5;
export const ROW_TO = 2;
const SLOT_GREY = "#B4B4B4";
const PRICE_GREY = "#8C8C8C"; // the small darker price-bar every listing carries

// -- the scroll: the approved profile, re-scaled to the tall frame ------------
export const SCROLL_V = 84; // px / frame
export const DECEL_F0 = 16;
export const DECEL_F1 = 38;
const DECEL_D = DECEL_F1 - DECEL_F0;
export const SCROLL_TOTAL = SCROLL_V * DECEL_F0 + (SCROLL_V * DECEL_D) / 3;
export const scrollAt = (f: number) => {
  if (f <= DECEL_F0) return SCROLL_TOTAL - SCROLL_V * f;
  if (f >= DECEL_F1) return 0;
  const u = (f - DECEL_F0) / DECEL_D;
  return ((SCROLL_V * DECEL_D) / 3) * Math.pow(1 - u, 3);
};

// -- the camera --------------------------------------------------------------
export const ANCHOR_WORLD_Y = CARD_REST_TOP + CARD_H; // the card's bottom edge
export const ANCHOR_SCREEN_Y = 1024;
export const CAM_LIFT = TALL_H / 2 - ANCHOR_SCREEN_Y; // -64
export const K_OPEN = 1.0;
export const K_PUSH = 960 / CARD_W; // 1.0667
export const K_CREEP = 1.078;
export const PUSH_F0 = 35;
export const PUSH_F1 = 57;

const PUSH = camMove169({
  f0: PUSH_F0,
  f1: PUSH_F1,
  k0: K_OPEN,
  k1: K_PUSH,
  c0: ANCHOR_WORLD_Y,
  c1: ANCHOR_WORLD_Y,
  x0: TALL_W / 2,
  x1: TALL_W / 2,
  warp: 1,
  lift: CAM_LIFT,
});
const CREEP = camMove169({
  f0: PUSH_F1,
  f1: DURATION,
  k0: K_PUSH,
  k1: K_CREEP,
  c0: ANCHOR_WORLD_Y,
  c1: ANCHOR_WORLD_Y,
  x0: TALL_W / 2,
  x1: TALL_W / 2,
  warp: 1,
  lift: CAM_LIFT,
});
export const GTT_CAM_F = [0, ...PUSH.F, ...CREEP.F.slice(1)];
export const GTT_CAM_K = [K_OPEN, ...PUSH.K, ...CREEP.K.slice(1)];
export const GTT_CAM_CY = [ANCHOR_WORLD_Y + CAM_LIFT / K_OPEN, ...PUSH.CY, ...CREEP.CY.slice(1)];
export const GTT_CAM_CX = [TALL_W / 2, ...PUSH.CX, ...CREEP.CX.slice(1)];

export const ECHO_RISE = 30;
export const BAR_OUT_FRAMES = 8;
const EASE_OUT = Easing.out(Easing.cubic);

// -- the ground, portrait: PeakForSolar's PaperGround (the landscape paper
// turned 90 deg, 1.6 oversize, objectFit cover, never above 1.0x of source).
const BG_OVERSIZE = 1.6;
const PaperGroundTall: React.FC<{
  frame: number;
  cx: number;
  cy: number;
  cxRest: number;
  cyRest: number;
  k: number;
}> = ({ frame, cx, cy, cxRest, cyRest, k }) => {
  const bgY = -(cy - cyRest) * k * PAPER_PARALLAX - frame * 0.3;
  const bgX = -(cx - cxRest) * k * PAPER_PARALLAX;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: PAPER_BASE }}>
      <Img
        src={staticFile(PAPER_SRC)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: TALL_H * BG_OVERSIZE,
          height: TALL_W * BG_OVERSIZE,
          objectFit: "cover",
          filter: `brightness(${PAPER_DIM}) blur(${PAPER_BLUR}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const h01 = (i: number, s: number) => {
  const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const Bar: React.FC<{
  cx: number;
  cy: number;
  w: number;
  h: number;
  s?: number;
  opacity?: number;
  fill?: string;
}> = ({ cx, cy, w, h, s = 1, opacity = 1, fill = SLOT_GREY }) =>
  opacity <= 0 ? null : (
    <rect
      x={cx - (w * s) / 2}
      y={cy - (h * s) / 2}
      width={w * s}
      height={h * s}
      rx={(h * s) / 2}
      fill={fill}
      opacity={opacity === 1 ? undefined : opacity}
    />
  );

const CardBody: React.FC<{
  top: number;
  seed: number;
  titleBars?: { s: number; opacity: number };
  priceBar?: { opacity: number };
  children?: React.ReactNode;
}> = ({ top, seed, titleBars = { s: 1, opacity: 1 }, priceBar = { opacity: 1 }, children }) => {
  const cx = TALL_W / 2;
  const w1 = 220 + 270 * h01(seed, 1);
  const w2 = 110 + 190 * h01(seed, 2);
  const gap = 26;
  const left = cx - (w1 + gap + w2) / 2;
  const titleCy = top + TITLE_CAP_TOP + (CAP * TITLE_SIZE) / 2;
  const wp = 140 + 130 * h01(seed, 3);
  return (
    <>
      <rect x={CARD_X + SHADOW_OFF} y={top + SHADOW_OFF} width={CARD_W} height={CARD_H} rx={CARD_R} fill={SHADOW} />
      <rect x={CARD_X} y={top} width={CARD_W} height={CARD_H} rx={CARD_R} fill={INK} />
      {children}
      <Bar cx={left + w1 / 2} cy={titleCy} w={w1} h={TITLE_BAR_H} s={titleBars.s} opacity={titleBars.opacity} />
      <Bar
        cx={left + w1 + gap + w2 / 2}
        cy={titleCy}
        w={w2}
        h={TITLE_BAR_H}
        s={titleBars.s}
        opacity={titleBars.opacity}
      />
      <Bar cx={cx} cy={top + PRICE_BAR_CY} w={wp} h={PRICE_BAR_H} opacity={priceBar.opacity} fill={PRICE_GREY} />
    </>
  );
};

const GhostTownForSaleTall: React.FC<Props> = ({ titleText, priceText, titleF0, echoF0, echoOrder }) => {
  const frame = useCurrentFrame();

  const cam = runCamera2(frame, GTT_CAM_F, GTT_CAM_CY, GTT_CAM_CX, GTT_CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const tx = TALL_W / 2 - cx * k;
  const ty = TALL_H / 2 - cy * k;

  const S = scrollAt(frame);
  const topOf = (row: number) => CARD_REST_TOP + row * PITCH + S;
  const g = Math.max(0, Math.min(1, (k - K_OPEN) / (K_PUSH - K_OPEN)));
  const others = interpolate(g, [0, 0.5, 1], [OP_FULL, OP_MID, OP_LOW], clamp);

  const top = topOf(0);
  const cardCx = TALL_W / 2;
  const photoX = CARD_X + PHOTO_PAD;

  const tr = textRise(frame, titleF0, k);
  const barsOut = interpolate(frame, [titleF0, titleF0 + BAR_OUT_FRAMES], [0, 1], {
    easing: EASE_OUT,
    ...clamp,
  });
  const priceOut = interpolate(frame, [echoF0, echoF0 + BAR_OUT_FRAMES], [0, 1], {
    easing: EASE_OUT,
    ...clamp,
  });

  const pillW = textWidth(priceText, PRICE_SIZE) + 2 * PILL_PAD_X;
  const pillX = cardCx - pillW / 2;
  const pillY = top + PILL_TOP;
  const renderPill = (fill: string) => (
    <g>
      <rect x={pillX} y={pillY} width={pillW} height={PILL_H} rx={PILL_H / 2} fill={fill} />
      {fill === INK ? (
        <text x={cardCx} y={top + PRICE_BASE} textAnchor="middle" fill={BLACK} style={type(PRICE_SIZE, 900)}>
          {priceText}
        </text>
      ) : null}
    </g>
  );

  const rows = Array.from({ length: ROW_TO - ROW_FROM + 1 }, (_, n) => ROW_FROM + n).filter((r) => r !== 0);

  return (
    <AbsoluteFill>
      <PaperGroundTall frame={frame} cx={cx} cy={cy} cxRest={GTT_CAM_CX[0]} cyRest={GTT_CAM_CY[0]} k={k} />
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: TALL_W,
            height: TALL_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={TALL_W}
            height={TALL_H}
            viewBox={`0 0 ${TALL_W} ${TALL_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <defs>
              <clipPath id="gtt-photo-window">
                <rect x={photoX} y={top + PHOTO_PAD} width={PHOTO_W} height={PHOTO_H} rx={PHOTO_R} />
              </clipPath>
            </defs>

            {/* THE FEED: ordinary listings above and below */}
            <g opacity={others === 1 ? undefined : others}>
              {rows.map((row) => (
                <CardBody key={row} top={topOf(row)} seed={row + 20}>
                  <rect
                    x={photoX}
                    y={topOf(row) + PHOTO_PAD}
                    width={PHOTO_W}
                    height={PHOTO_H}
                    rx={PHOTO_R}
                    fill={SLOT_GREY}
                  />
                </CardBody>
              ))}
            </g>

            {/* THE LISTING */}
            <CardBody
              top={top}
              seed={0}
              titleBars={{ s: 1 - 0.4 * barsOut, opacity: 1 - barsOut }}
              priceBar={{ opacity: 1 - priceOut }}
            >
              <image
                href={LISTING_PHOTO_DATA_URL}
                x={photoX}
                y={top + PHOTO_PAD}
                width={PHOTO_W}
                height={PHOTO_H}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#gtt-photo-window)"
              />
            </CardBody>
            {tr.opacity > 0 ? (
              <text
                x={cardCx}
                y={top + TITLE_BASE + tr.dy}
                textAnchor="middle"
                fill={BLACK}
                opacity={tr.opacity}
                style={type(TITLE_SIZE, 900)}
              >
                {titleText}
              </text>
            ) : null}

            {/* THE BADGE, straddling the card's bottom edge, with its crown */}
            {frame >= echoF0 ? (
              <ChainEcho
                frame={frame}
                start={echoF0}
                render={renderPill}
                from={{ dx: 0, dy: ECHO_RISE }}
                order={echoOrder}
                core="travel"
              />
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default GhostTownForSaleTall;
