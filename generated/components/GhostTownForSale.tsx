import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLACK,
  CROWN_STEP,
  ChainEcho,
  FRAME_W,
  INK,
  OP_FULL,
  OP_LOW,
  OP_MID,
  PaperGround,
  SHADOW,
  SHADOW_OFF,
  World,
  camMove169,
  clamp,
  runCamera2,
  sway,
  textRise,
  type,
} from "./cerroShared";
import { LISTING_PHOTO_DATA_URL } from "./ghostTownAssets";

export const FPS = 24;
// Trailer SRT 12.888 -> 17.309 s ("A friend of mine ... under a million").
// round((17.309 - 12.888) * 24) = 106 frames of speech + a 16 frame tail = 122.
export const DURATION = 122;

// ---------------------------------------------------------------------------
// GHOST TOWN FOR SALE — cut 3 of the Cerro Gordo trailer (Core Memory, Ashlee
// Vance x Brent Underwood). 1920 x 1080, 24 fps, opaque.
// "A friend of mine sent me this listing that said you know buy your own ghost
//  town for under a million"
// Trailer SRT 12.888 -> 17.309 s; f0 = 12.888 s.
//
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
// v2, on the director's review: a 3-column results GRID instead of a phone
// column; the hero type at ~100 / ~80 screen px; the listing carries the same
// grey word-bars as every other card until "ghost town"; the price is a badge
// STRADDLING the card's bottom edge, rising in the open with no clip.
//
// THE IDEA (the director's): a property-site results page scrolling up, and it
// stops on the one listing that isn't like the others. Every listing is a white
// card with an image slot and grey word-bars (two lengths in the title row, one
// in the price row). Every ordinary slot is flat grey (#B4B4B4) — an image that
// never loaded. Only the Cerro Gordo card has a real photograph (the June 2018
// Bishop Real Estate listing photo, public/cerro/listing-2018.jpg, untinted and
// unfiltered, cover-cropped into the 16:10 window, inlined as base64 in
// ghostTownAssets.ts). Then its words arrive. No icons, logos or UI chrome.
//
// THE CARD, world px (card-local y): 1000 x 716, radius 26, white on its +4/+4
// hard shadow. Photo window 776 x 485 (16:10), inset 34 from the top and
// centred, radius 12. Title GHOST TOWN FOR SALE Barlow 900 at 84, black, cap top
// 553, baseline 611.8 — 10.70 em = 899 px = 90 % of the card. The price badge:
// UNDER $1 MILLION Barlow 900 at 68, black, in a white pill 96 tall, hugging the
// text with 46 px a side (a measured Barlow-Black advance table, so `priceText:
// "$925,000"` resizes it), centred ON the card's bottom edge (y 716): half on
// the card, half on the paper. Its crown rests 12 / 24 / 36 above the pill
// top, clearing the title baseline by 20. Grid: 3 columns on a 1077 pitch
// (77 gutter), rows on a 793 pitch. The listing sits in the CENTRE column; the
// block (card top -> badge shadow bottom, 768 world) is centred on world y 520,
// which the camera puts on screen y 508.
//
// THE GESTURES — one continuous motion: the scroll decelerates INTO the push,
// the push settles under the title, the title replaces its bars, the badge
// lands across the edge.
//   f0-16   "A friend of mine": the results page is already scrolling up at a
//           constant 106 world px/f = 55 screen px/f (k 0.52). A row every 7.5
//           frames; the listing's photo enters from the frame bottom ~f12.
//   f16-38  "sent me this listing / that said": friction, v = V (1 - u)^2 over
//           22 frames, so the listing arrives in the centre column with zero
//           velocity and zero deceleration — no overshoot.
//   f35-66  "you know": the camera pushes in, one eased move, k 0.52 -> 1.185
//           (keys f35-57, visible from f38, landed f63). The card ends 849
//           screen px tall, the card + badge block 910 (84 %).
//           Every other card dims 1.0 -> 0.55 -> 0.3, driven by the damped k.
//   f67-79  "buy your own ghost town": the listing's two grey title bars shrink
//           to 0.6 and fade out over 8 frames (f67-75) while GHOST TOWN FOR SALE
//           slides up 24 screen px and fades in over 12 (shared textRise),
//           landing ON "ghost town" f79.
//   f85-101 "for under a million" — THE PAYOFF, the cut's one chain echo (shared
//           ChainEcho, colorsLead, no clip anywhere): orange f85, purple f87,
//           blue f89, the white badge with its text and hard shadow f91, each
//           rising 30 world px on EASE_LAND. The bands open to at most 25.8 px
//           and settle to 12; the badge is 96 % home on "million" f101. The
//           listing's grey price bar fades out f85-93.
//   f101-121 hold: the camera creeps k 1.185 -> 1.205. Nothing new.
//
// THE CAMERA — the house damped tracker (shared runCamera2), cx fixed at 960,
// cy = 520 + 32/k off the eased k (camMove169 with lift 32: the block centre on
// screen y 508, so the badge's shadow bottom sits at y 968-971, above the
// ~110 px of YouTube chrome), sway on top.
//   OPEN   f0-35   k 0.52, cy 581.54 — held; the page is the motion.
//   PUSH   f35-57  k 0.52 -> 1.185, warp 1.
//   CREEP  f57-122 k 1.185 -> 1.205, warp 1.
//   damped:  f     k        cy       %k/f   block on screen (top..bottom)
//            0     0.5200   581.54   0.00
//            38    0.5256   580.90   0.70   listing centred (centre y 508.0)
//            41    0.5570   577.74   2.58   "you know"
//            48    0.7659   562.94   5.08   fastest
//            55    1.0412   551.25   3.32   108..907
//            60    1.1517   547.88   1.17    66..950
//            63    1.1749   547.25   0.46   landed, 3 frames before "buy"
//            66    1.1833   547.03   0.16    54..962
//            79    1.1888   546.92   0.03    51..965   title 100 px, price 81
//            101   1.1983   546.70   0.04    48..968
//            121   1.2045   546.57   0.01    45..971
//   Fastest screen motion: the scroll at 55 px/f; during the push the side
//   columns' inner edges move at most 24 px/f while in frame. Paper bgScale
//   tops at 1.061.
//
// NOTES for the director
//   * THE ECHO ORDER. With the house colorsLead order and no clip, the colours
//     exist before the core, so f85-90 shows a whole orange, then purple, then
//     blue pill straddling the edge before the white badge lands on them at
//     f91. The bands never exceed 25.8 px once the core is there. The note's
//     other wording — "the crown rises behind it, stepping up from behind the
//     pill's top edge" — is what `echoOrder: "coreLeads"` does: the badge
//     rises at f85 and blue / purple / orange step up out from behind its top
//     edge (f87 / f89 / f91), opening 0 -> 12 px, never wider; landed ~f101.
//     Default is the note's frames; flip the prop to see the other.
//   * At rest the 0.3 neighbours show at both sides (x < 270, x > 1650) and the
//     next row's top at the frame bottom (from y ~1000) — the page continuing.
// ---------------------------------------------------------------------------

// -- the card, world px (card-local: y from the card's top edge) -------------
export const CARD_W = 1000;
export const CARD_R = 26;
const CAP = 0.7; // Barlow cap height per em
export const PHOTO_PAD = 34;
export const PHOTO_H = 485;
export const PHOTO_W = 776; // 16:10
export const PHOTO_R = 12;
export const TITLE_SIZE = 84;
export const TITLE_CAP_TOP = PHOTO_PAD + PHOTO_H + PHOTO_PAD; // 553
export const TITLE_BASE = TITLE_CAP_TOP + CAP * TITLE_SIZE; // 611.8
export const PRICE_SIZE = 68;
export const PILL_H = 96;
export const PILL_PAD_X = 46;
export const CROWN = 3 * CROWN_STEP; // 36
export const CARD_H = 716; // the pill's centre line
export const PILL_TOP = CARD_H - PILL_H / 2; // 668; crown top 632, 20 under the title baseline
export const PRICE_BASE = CARD_H + (CAP * PRICE_SIZE) / 2; // 739.8
export const BLOCK_H = CARD_H + PILL_H / 2 + SHADOW_OFF; // 768: card top -> badge shadow bottom

// word-bars (grey), centred on the card's axis
export const TITLE_BAR_H = 48;
export const PRICE_BAR_H = 40;
export const PRICE_BAR_CY = (TITLE_BASE + CARD_H) / 2 - 2; // 662

// -- the grid ----------------------------------------------------------------
export const GUTTER = 77; // 40 screen px at K_OPEN
export const COL_PITCH = CARD_W + GUTTER; // 1077
export const ROW_PITCH = CARD_H + GUTTER; // 793
export const CONTENT_C = 520; // the block's centre at rest, world y
export const CARD_X = FRAME_W / 2 - CARD_W / 2; // 460, the centre column
export const CARD_REST_TOP = CONTENT_C - BLOCK_H / 2; // 136
export const ROW_FROM = -6;
export const ROW_TO = 2;
const SLOT_GREY = "#B4B4B4";

// Barlow 900 advance widths per em (measured off Barlow-Black.ttf), so the
// price pill hugs whatever `priceText` is.
const ADV: Record<string, number> = {
  " ": 0.2, $: 0.58, ",": 0.265, ".": 0.264, "-": 0.419, "'": 0.193,
  "0": 0.573, "1": 0.356, "2": 0.576, "3": 0.556, "4": 0.641, "5": 0.555, "6": 0.552, "7": 0.511, "8": 0.556, "9": 0.537,
  A: 0.714, B: 0.615, C: 0.609, D: 0.618, E: 0.57, F: 0.554, G: 0.611, H: 0.611, I: 0.266, J: 0.587, K: 0.636, L: 0.574, M: 0.714,
  N: 0.658, O: 0.621, P: 0.6, Q: 0.605, R: 0.615, S: 0.602, T: 0.595, U: 0.617, V: 0.645, W: 0.937, X: 0.659, Y: 0.651, Z: 0.562,
};
export const textWidth = (s: string, size: number) =>
  s
    .toUpperCase()
    .split("")
    .reduce((w, c) => w + (ADV[c] ?? 0.6), 0) * size;

// -- the scroll --------------------------------------------------------------
// The page moves (the camera does not): every card sits at its rest + S(f).
// f0-16 constant speed V; f16-38 friction, v = V (1 - u)^2, so it arrives with
// zero velocity AND zero deceleration — no overshoot, nothing to bounce off.
export const SCROLL_V = 106; // world px / frame = 55 screen px at K_OPEN
export const DECEL_F0 = 16; // "sent me this listing"
export const DECEL_F1 = 38; // centred
const DECEL_D = DECEL_F1 - DECEL_F0;
export const SCROLL_TOTAL = SCROLL_V * DECEL_F0 + (SCROLL_V * DECEL_D) / 3;
export const scrollAt = (f: number) => {
  if (f <= DECEL_F0) return SCROLL_TOTAL - SCROLL_V * f;
  if (f >= DECEL_F1) return 0;
  const u = (f - DECEL_F0) / DECEL_D;
  return ((SCROLL_V * DECEL_D) / 3) * Math.pow(1 - u, 3);
};

// -- the camera --------------------------------------------------------------
export const CAM_LIFT = 32; // block centre on screen y 540 - 32 = 508
export const K_OPEN = 0.52; // cards 520 screen px wide, the grid 1640 of 1920
export const K_PUSH = 1.185; // block 768 * 1.185 = 910 screen px; title 100, price 81
export const K_CREEP = 1.205;
export const PUSH_F0 = 35;
export const PUSH_F1 = 57;
export const CREEP_F1 = DURATION;

const PUSH = camMove169({
  f0: PUSH_F0,
  f1: PUSH_F1,
  k0: K_OPEN,
  k1: K_PUSH,
  c0: CONTENT_C,
  c1: CONTENT_C,
  x0: FRAME_W / 2,
  x1: FRAME_W / 2,
  warp: 1,
  lift: CAM_LIFT,
});
const CREEP = camMove169({
  f0: PUSH_F1,
  f1: CREEP_F1,
  k0: K_PUSH,
  k1: K_CREEP,
  c0: CONTENT_C,
  c1: CONTENT_C,
  x0: FRAME_W / 2,
  x1: FRAME_W / 2,
  warp: 1,
  lift: CAM_LIFT,
});
const OPEN_CY = CONTENT_C + CAM_LIFT / K_OPEN;
export const GT_CAM_F = [0, ...PUSH.F, ...CREEP.F.slice(1)];
export const GT_CAM_K = [K_OPEN, ...PUSH.K, ...CREEP.K.slice(1)];
export const GT_CAM_CY = [OPEN_CY, ...PUSH.CY, ...CREEP.CY.slice(1)];
export const GT_CAM_CX = [FRAME_W / 2, ...PUSH.CX, ...CREEP.CX.slice(1)];

// -- the badge's rise ----------------------------------------------------------
// 30 world px on EASE_LAND with the house 2 f stagger: EASE_LAND covers 46 % in
// its first 2 frames, so a band opens to at most 12 + 0.46 * 30 = 25.8 px
// before closing to 12. No clip: everything rises in the open.
export const ECHO_RISE = 30;
export const BAR_OUT_FRAMES = 8;

export const schema = z.object({
  titleText: z.string(),
  priceText: z.string(),
  beats: z.object({
    friend: z.number(), // "A friend of mine"      — the page is already scrolling
    sent: z.number(), // "sent me this listing"    — friction starts
    thatSaid: z.number(), // "that said"
    youKnow: z.number(), // "you know"             — the push-in
    buy: z.number(), // "buy your own"
    ghostTown: z.number(), // "ghost town"         — the title lands
    for: z.number(), // "for"
    under: z.number(), // "under"                  — the crown rises
    million: z.number(), // "million"              — the badge has landed
    end: z.number(), // speech ends; tail to DURATION
  }),
  titleF0: z.number(), // the title bars go and the words slide up
  echoF0: z.number(), // the badge's echo starts
  // "colorsLead" = the director's house order (orange f85 ... core f91);
  // "coreLeads" = the badge first (f85) and the colours step up from behind
  // its top edge (blue f87, purple f89, orange f91). See NOTES.
  echoOrder: z.enum(["colorsLead", "coreLeads"]),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  titleText: "GHOST TOWN FOR SALE",
  priceText: "UNDER $1 MILLION",
  beats: {
    friend: 0,
    sent: 16,
    thatSaid: 32,
    youKnow: 41,
    buy: 66,
    ghostTown: 79,
    for: 90,
    under: 94,
    million: 101,
    end: 106,
  },
  titleF0: 67, // 12 frame slide-up lands ON "ghost town" f79
  echoF0: 85, // orange f85, purple f87, blue f89, core f91; landed by f101
  echoOrder: "colorsLead",
});

// A stable hash for the ordinary cards' bar lengths.
const h01 = (i: number, s: number) => {
  const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const EASE_OUT = Easing.out(Easing.cubic);

// A grey word-bar centred on (cx, cy); `s` shrinks it about its own centre.
const Bar: React.FC<{ cx: number; cy: number; w: number; h: number; s?: number; opacity?: number }> = ({
  cx,
  cy,
  w,
  h,
  s = 1,
  opacity = 1,
}) =>
  opacity <= 0 ? null : (
    <rect
      x={cx - (w * s) / 2}
      y={cy - (h * s) / 2}
      width={w * s}
      height={h * s}
      rx={(h * s) / 2}
      fill={SLOT_GREY}
      opacity={opacity === 1 ? undefined : opacity}
    />
  );

// The listing's furniture: the card on its hard shadow, the title row's two
// bars and the price row's bar. `fades` take the listing's bars out.
const CardBody: React.FC<{
  x: number;
  top: number;
  seed: number;
  titleBars?: { s: number; opacity: number };
  priceBar?: { opacity: number };
  children?: React.ReactNode;
}> = ({ x, top, seed, titleBars = { s: 1, opacity: 1 }, priceBar = { opacity: 1 }, children }) => {
  const cx = x + CARD_W / 2;
  const w1 = 340 + 140 * h01(seed, 1);
  const w2 = 170 + 120 * h01(seed, 2);
  const gap = 28;
  const left = cx - (w1 + gap + w2) / 2;
  const titleCy = top + TITLE_CAP_TOP + (CAP * TITLE_SIZE) / 2;
  const wp = 280 + 120 * h01(seed, 3);
  return (
    <>
      <rect x={x + SHADOW_OFF} y={top + SHADOW_OFF} width={CARD_W} height={CARD_H} rx={CARD_R} fill={SHADOW} />
      <rect x={x} y={top} width={CARD_W} height={CARD_H} rx={CARD_R} fill={INK} />
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
      <Bar cx={cx} cy={top + PRICE_BAR_CY} w={wp} h={PRICE_BAR_H} opacity={priceBar.opacity} />
    </>
  );
};

// An ordinary listing: an image that never loaded, and no words.
const OrdinaryCard: React.FC<{ seed: number; x: number; top: number }> = ({ seed, x, top }) => (
  <CardBody x={x} top={top} seed={seed}>
    <rect
      x={x + (CARD_W - PHOTO_W) / 2}
      y={top + PHOTO_PAD}
      width={PHOTO_W}
      height={PHOTO_H}
      rx={PHOTO_R}
      fill={SLOT_GREY}
    />
  </CardBody>
);

const GhostTownForSale: React.FC<Props> = ({ titleText, priceText, titleF0, echoF0, echoOrder }) => {
  const frame = useCurrentFrame();

  // -- the camera, first -----------------------------------------------------
  const cam = runCamera2(frame, GT_CAM_F, GT_CAM_CY, GT_CAM_CX, GT_CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;

  // -- the results page --------------------------------------------------------
  const S = scrollAt(frame);
  const topOf = (row: number) => CARD_REST_TOP + row * ROW_PITCH + S;
  // Every other listing leaves focus as the camera pushes: derived from the
  // damped k itself, so the dim can never run ahead of or behind the move.
  const g = Math.max(0, Math.min(1, (k - K_OPEN) / (K_PUSH - K_OPEN)));
  const others = interpolate(g, [0, 0.5, 1], [OP_FULL, OP_MID, OP_LOW], clamp);

  const top = topOf(0);
  const cardCx = FRAME_W / 2;

  // -- the title: the bars give way to the words, landing on "ghost town" -----
  const tr = textRise(frame, titleF0, k);
  const barsOut = interpolate(frame, [titleF0, titleF0 + BAR_OUT_FRAMES], [0, 1], {
    easing: EASE_OUT,
    ...clamp,
  });
  const priceOut = interpolate(frame, [echoF0, echoF0 + BAR_OUT_FRAMES], [0, 1], {
    easing: EASE_OUT,
    ...clamp,
  });

  // -- the badge -------------------------------------------------------------
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

  const rows = Array.from({ length: ROW_TO - ROW_FROM + 1 }, (_, n) => ROW_FROM + n);

  return (
    <AbsoluteFill>
      <PaperGround frame={frame} cx={cx} cy={cy} cxRest={GT_CAM_CX[0]} cyRest={GT_CAM_CY[0]} k={k} />
      <World cx={cx} cy={cy} k={k}>
        <defs>
          <clipPath id="gt-photo-window">
            <rect
              x={CARD_X + (CARD_W - PHOTO_W) / 2}
              y={top + PHOTO_PAD}
              width={PHOTO_W}
              height={PHOTO_H}
              rx={PHOTO_R}
            />
          </clipPath>
        </defs>

        {/* THE RESULTS PAGE: three columns of ordinary listings */}
        <g opacity={others === 1 ? undefined : others}>
          {rows.flatMap((row) =>
            [-1, 0, 1]
              .filter((col) => !(row === 0 && col === 0))
              .map((col) => (
                <OrdinaryCard
                  key={`${row}:${col}`}
                  seed={row * 3 + col + 20}
                  x={CARD_X + col * COL_PITCH}
                  top={topOf(row)}
                />
              )),
          )}
        </g>

        {/* THE LISTING: a card like the others, except for its photograph */}
        <CardBody
          x={CARD_X}
          top={top}
          seed={0}
          titleBars={{ s: 1 - 0.4 * barsOut, opacity: 1 - barsOut }}
          priceBar={{ opacity: 1 - priceOut }}
        >
          <image
            href={LISTING_PHOTO_DATA_URL}
            x={CARD_X + (CARD_W - PHOTO_W) / 2}
            y={top + PHOTO_PAD}
            width={PHOTO_W}
            height={PHOTO_H}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#gt-photo-window)"
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
      </World>
    </AbsoluteFill>
  );
};

export default GhostTownForSale;
