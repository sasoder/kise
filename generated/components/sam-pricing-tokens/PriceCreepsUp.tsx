// ---------------------------------------------------------------------------
// PriceCreepsUp (sam-pricing-tokens, cut 35). Cheeky Pint style (stout) (styles/cheeky-pint.md) with the clip's
// real photographed objects (pricingShared). Opaque 1080x1920, 23.976 fps, 156 frames. Palette B1.
//
// CHECK LINE: "With just a price and no unit, people fear the bill will quietly creep up month after month."
//
// THE LINE: "So I think you are right that people don't just want us to, like, give them a price, because they
//   feel like over the long term they're gonna get screwed somehow," (continues on camera from f148)
// WORD -> FRAME (Whisper, may run 2-6 f early): I 2 · think 12 · you 17 · are 19 · right 22 · that 30 · people 37 ·
//   don't 42 · just 51 · want 54 · us 57 · to 60 · like 63 · give 65 · them 73 · a 76 · price 79 · because 84 ·
//   they 90 · feel 95 · like 104 · over 110 · the 114 · long 118 · term 122 · they're 126 · gonna 129 · get 132 ·
//   screwed 135 · somehow 141.
// DURATION: the slot 35.410 -> 41.917 s = 6.507 s x 24000/1001 = 156 frames (sequence frames 849 -> 1005).
//
// THE MOTION: one row of real calendar pages (one month each) lies along the board, the clip's price tag ($3.40)
//   resting on January under its month. The camera opens close on the tag, already pulling back and drifting
//   right; from "price" (f72) the bills rise as amber bars out of a dark slot cut in each page's top edge, each a
//   little taller than the last: Jan-Mar together on one front-loaded curve (21 f), then each later month as its
//   page enters from the right edge (RISE is derived from the camera), so every bar has finished before it reaches
//   screen x ~720 and the visible bars form a rising staircase in every frame (STAIR_PROOF checks it at load),
//   while the camera travels right along the row at constant speed through "over the long term". On "screwed"
//   May's bar climbs far above the others
//   (2x January) and the camera eases to a stop, tilting up after it so the row settles low (labels just above
//   the caption band, the staircase and May's tower filling y ~260-985); it lands by f145 and the frame holds
//   alive (creep, sway, grain).
// AMBER = the number charged (the tag's sticker, the monthly bills); pages and tag = real paper, graded cream.
// CAUSE -> EFFECT: each bar rises out of its own page's slot (the month is its cause); first contact = its foot at
//   the slot on the rise's first frame.
//
// SOURCES: no data. The bars are the customer's fear, not a series: unlabelled, an invented shape (+7.5 % a month,
//   then 2x), no labels on them. $3.40 = the clip's illustrative price (COMMON.md); the tag = pricingShared's
//   PriceTag (its real photo, TAG_ART), TAG.h scaled uniformly by TAG_SCALE to this world's pages. The calendar page: the image
//   agent's item 8 (images/cutout_sources/SOURCES.md), calendar_month_page_Jan_frontal_unsplash.jpg, Behnam Norouzi,
//   Unsplash License (https://unsplash.com/photos/a-calendar-with-the-word-jan-on-it-0eqpHCP1M-U); cut out and
//   cleaned (month, year, hanger slot painted out) by scripts/clips/sam-pricing-tokens/bake-calendar.py ->
//   priceCreepsUpData.ts (+ public/sam-pricing-tokens/calendar_page_clean.png). Its day grid is kept: the
//   calendar's own print, tiny at the travelling camera.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ALPHA,
  COLOR,
  EDGE,
  FONT_LABEL,
  TRACK,
  StoutStage,
  amberBandFor,
  bloomFilter,
  clamp01,
  lerp,
  rectPath,
  smoothstep,
  snapLen,
} from "../kits/cheeky-pint/stoutShared";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { PriceTag, StoutShadow, TAG, TAG_ART, photoCutOutSil, PhotoCutOut, stickerBox, type ShadowPart } from "./pricingShared";
import { CALENDAR_PAGE } from "./priceCreepsUpData";

export const FPS = 24000 / 1001;
export const DURATION = 156;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ===========================================================================
// THE WORLD (world px = screen px at k 1)
// ===========================================================================
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"] as const;
export const FLOOR = 1040; // the pages' lower edge
export const X_JAN = 540;
export const PAGE_W = 250;
export const PAGE_H = PAGE_W / CALENDAR_PAGE.aspect;
export const PITCH = 264; // 14 px gaps
export const pageX = (i: number) => X_JAN + i * PITCH;
/** the paper's top edge (world y): where each bar's slot is */
export const PAGE_TOP = FLOOR - PAGE_H * (1 - CALENDAR_PAGE.topV);
/** the month's baseline (world y), printed on the page */
export const LABEL_Y = FLOOR - PAGE_H + CALENDAR_PAGE.label.baseV * PAGE_H;
export const BAR_W = 126; // ~0.5 of a page
const K_TRAVEL = 1.15; // pages ~288 px on screen while travelling
const K_END = 1.0; // ~250 px at the resolve (a little pull-back with May's rise: its growth outpaces it)
/** The bills (world px = screen px at the resting k 1.0): +7.5 % a month, then May at 2x January, so the
 *  staircase and May's tower fill y ~260-985 at the resolve. Snapped once at the end k. */
export const BILL_H = [362, 389, 418, 450, 725].map((h) => snapLen(h, K_END));
/** May's rise [start, land]: top speed on "screwed" (f135), lands f145 (it rises in view: it is the tallest). */
export const MAY_RISE: [number, number] = [125, 145];
/** A month's bill (Jan-Apr) starts rising when its page's centre reaches the frame's right edge (RISE_X), at the
 *  earliest on "price" (PRICE_F), and rises over RISE_F frames: so at "price" Jan, Feb and Mar (all in view) rise
 *  together on one curve (always a staircase), and Apr rises as it comes in at the right; every bar has finished
 *  before its page reaches x ~720 (STAIR_PROOF). */
const PRICE_F = 72;
const RISE_X = 1080;
const RISE_F = 21;
/** The rise: velocity ∝ (1 - t)^1.4, eased in over its first 20 % (a short soft start, so the bar is past its
 *  small "sticker" shape within a few frames), then one long deceleration to rest. Tabulated, normalised. */
const RISE_TAB = (() => {
  const n = 2000;
  const tab = [0];
  let acc = 0;
  for (let j = 1; j <= n; j++) {
    const t = (j - 0.5) / n;
    acc += Math.pow(1 - t, 1.4) * smoothstep(t / 0.2);
    tab.push(acc);
  }
  return tab.map((v) => v / acc);
})();
const riseBill = (t: number) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const j = t * (RISE_TAB.length - 1);
  const a = Math.floor(j);
  return lerp(RISE_TAB[a], RISE_TAB[a + 1], j - a);
};
/** May: rest to rest, velocity ∝ t (1 - t): top speed half-way. */
const riseMay = (t: number) => {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 2) * (1 + 2 * x);
};
// RISE (frames) is solved from the camera, below it (billH is only called after that).
export const billH = (i: number, f: number) => {
  const [a, b] = RISE[i];
  return BILL_H[i] * (i === 4 ? riseMay((f - a) / (b - a)) : riseBill((f - a) / (b - a)));
};

// The tag (pricingShared's real photo, its own aspect, TAG.h scaled uniformly to this world's pages) rests on
// January's page just under the month, a little turned.
export const TAG_SCALE = 0.34;
export const TAG_H = TAG.h * TAG_SCALE;
export const TAG_W = TAG_H * TAG_ART.aspect;
const TAG_TOP = LABEL_Y + 16;
export const TAG_POSE = { x: X_JAN + 50, y: TAG_TOP + TAG_H, angle: -6 };
/** the sticker's lower edge (world y, upright; the 6 deg turn adds < 2 px) */
const STICKER_FOOT = TAG_TOP + stickerBox(TAG_W, TAG_H).y + stickerBox(TAG_W, TAG_H).h;

// ===========================================================================
// THE CAMERA — one keyed track (centre x, y, k), solved here:
//   k: 2.3 (close on the tag) -> 1.15 by ~f88 (the row revealed, pages ~288 px) -> 1.0 by f150, moving on f0.
//   x: a slow drift on the close-up, then up to a constant travel speed from ~f96 to f118, eased to a creep by
//      f146 (constant-speed travel through "over the long term"; ~15.5 px/f at its top).
//   y: by the floor's screen height. Open with the tag at the frame's middle; through the pull-back the tag's
//      sticker stays just above the caption band (its foot <= y 1072) until the tag has left the frame (~f112);
//      then the row settles DOWN (the camera tilting up with May's rise, f112-148) until the month labels sit just
//      above the band (baseline y 1068) and the pages' blank lower part runs into it.
// ===========================================================================
const K0 = 2.3;
const zoomP = (f: number) => smoothstep((f + 16) / 104);
export const camK = (f: number) =>
  Math.exp(Math.log(K0) * (1 - zoomP(f)) + Math.log(K_TRAVEL) * zoomP(f) + Math.log(K_END / K_TRAVEL) * smoothstep((f - 100) / 50));
const V0 = 0.4;
const V = 13.4;
const CREEP = 0.35;
const vel = (f: number) => (f < 118 ? V0 + (V - V0) * smoothstep((f - 58) / 38) : CREEP + (V - CREEP) * (1 - smoothstep((f - 118) / 28)));
const FS_OPEN = 930 + (FLOOR - (TAG_TOP + TAG_H / 2)) * camK(0); // the tag's centre at y 930 on f0
const FS_MID = 1072 + (FLOOR - STICKER_FOOT) * K_TRAVEL; // the sticker's foot at y 1072 while travelling
const FS_END = 1068 + (FLOOR - LABEL_Y) * K_END; // the labels' baseline at y 1068 at the resolve
const floorScreen = (f: number) => lerp(FS_OPEN, FS_MID, zoomP(f)) + (FS_END - FS_MID) * smoothstep((f - 112) / 36);
export const CAM_TRACK: Cam[] = (() => {
  const out: Cam[] = [];
  let x = TAG_POSE.x - 10;
  const xs: number[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    xs.push(x);
    x += vel(f + 0.5);
  }
  for (let f = 0; f <= DURATION + 2; f++) {
    const k = camK(f);
    out.push({ x: xs[f], y: FLOOR - (floorScreen(f) - 960) / k, k });
  }
  return out;
})();
export const camAt = (f: number): Cam => {
  const a = Math.max(0, Math.min(CAM_TRACK.length - 2, Math.floor(f)));
  const t = clamp01(f - a);
  const A = CAM_TRACK[a];
  const B = CAM_TRACK[a + 1];
  return { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), k: Math.exp(lerp(Math.log(A.k), Math.log(B.k), t)) };
};
const CAM_REST = CAM_TRACK[0];
const screenX = (wx: number, f: number) => {
  const c = CAM_TRACK[Math.max(0, Math.min(CAM_TRACK.length - 1, f))];
  return 540 + (wx - c.x) * c.k;
};
export const RISE: [number, number][] = [
  ...[0, 1, 2, 3].map((i): [number, number] => {
    let f0 = PRICE_F;
    while (f0 < DURATION && screenX(pageX(i), f0) > RISE_X) f0++;
    return [f0, f0 + RISE_F];
  }),
  MAY_RISE,
];
/** Staircase proof, at module load: on every frame the bars in view (height > 0) rise strictly left to right,
 *  except a bar still at the right edge (its page's centre at x >= 720). Any failing frame throws. */
export const STAIR_PROOF = (() => {
  const fails: number[] = [];
  let minFinishX = Infinity;
  for (let f = 0; f < DURATION; f++) {
    const k = CAM_TRACK[f].k;
    const vis = BILL_H.map((_, i) => ({ x: screenX(pageX(i), f), h: billH(i, f) }))
      .filter((v) => v.h > 0.5 && v.x + (BAR_W / 2) * k > 0 && v.x - (BAR_W / 2) * k < 1080);
    for (let j = 1; j < vis.length; j++) if (vis[j].h <= vis[j - 1].h && vis[j].x < 720) fails.push(f);
  }
  for (let i = 0; i < 4; i++) minFinishX = Math.min(minFinishX, i === 0 ? Infinity : screenX(pageX(i), RISE[i][1]));
  if (fails.length) throw new Error(`PriceCreepsUp staircase fails on frames ${[...new Set(fails)].join(", ")}`);
  return { fails: 0, minFinishX };
})();
/** Caption-band proof, at module load: the tag's sticker is above y 1080 on every frame it is on screen, and every
 *  visible month label's baseline is at or above y 1072. */
export const BAND_PROOF = (() => {
  let worstSticker = -Infinity;
  let worstLabel = -Infinity;
  for (let f = 0; f < DURATION; f++) {
    const c = CAM_TRACK[f];
    const sy = (y: number) => 960 + (y - c.y) * c.k;
    const sx = (x: number) => 540 + (x - c.x) * c.k;
    if (sx(TAG_POSE.x + TAG_W / 2) > 0) worstSticker = Math.max(worstSticker, sy(STICKER_FOOT));
    worstLabel = Math.max(worstLabel, sy(LABEL_Y));
  }
  if (worstSticker > 1080 || worstLabel > 1072) throw new Error(`PriceCreepsUp caption bands: sticker ${worstSticker}, label ${worstLabel}`);
  return { worstSticker, worstLabel };
})();

// ===========================================================================
// THE LIGHT POOL — follows the newest bill (its middle), damped like the camera
// ===========================================================================
const poolTarget = (f: number) => {
  let i = 0;
  for (let j = 0; j < RISE.length; j++) if (f >= RISE[j][0] - 4) i = j;
  const y = f < RISE[0][0] - 4 ? FLOOR - PAGE_H * 0.5 : PAGE_TOP - billH(i, f) * 0.5;
  return { x: f < RISE[0][0] - 4 ? TAG_POSE.x : pageX(i), y };
};
export const POOL_TRACK = (() => {
  const out: { x: number; y: number }[] = [];
  let p = poolTarget(-30);
  let v = { x: 0, y: 0 };
  for (let f = -30; f <= DURATION + 2; f++) {
    const t = poolTarget(f);
    v = { x: v.x + (t.x - p.x) * 0.09 - v.x * 0.468, y: v.y + (t.y - p.y) * 0.09 - v.y * 0.468 };
    p = { x: p.x + v.x, y: p.y + v.y };
    if (f >= 0) out.push({ ...p });
  }
  return out;
})();

// ===========================================================================
// PIECES (stoutShared's recipes, rebuilt here where they are private there)
// ===========================================================================
/** The hot top edge of an amber body (stoutShared's HotEdge recipe: a 2 px amberHot line + a 12 px falloff). */
const HotEdge: React.FC<{ x: number; y: number; w: number; k: number; r: number }> = ({ x, y, w, k, r }) => {
  const id = `pc${useId().replace(/[^A-Za-z0-9_-]/g, "_")}h`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={rectPath(x, y, w, EDGE.HOT_FALL / k, r, true, false)} fill={`url(#${id})`} />
      <path d={`M${f3(x + r)} ${f3(y + EDGE.HOT / k / 2)}H${f3(x + w - r)}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
    </g>
  );
};

const R = 6; // the bars' corner radius (world)
const barRect = (i: number, h: number) => ({ x: pageX(i) - BAR_W / 2, y: PAGE_TOP - h, w: BAR_W, h });
const pageBox = (i: number) => ({ x: pageX(i) - PAGE_W / 2, y: FLOOR - PAGE_H, w: PAGE_W, h: PAGE_H });

/** The slot (world): a slit SLIT.h screen px tall, its top SLIT.inset px under the paper's top edge, SLIT.lip px
 *  wider than the bar each side (screen px, so it reads at every zoom). */
const SLIT = { h: 7, inset: 3, lip: 8 } as const;
const slitGeom = (x: number, k: number) => {
  const w = BAR_W + (2 * SLIT.lip) / k;
  return { x: x - w / 2, y: PAGE_TOP + SLIT.inset / k, w, h: SLIT.h / k };
};

/** One month: the page (real photo), its slot, the bill rising out of it, its month in ink; ONE shadow. */
const Month: React.FC<{ i: number; f: number; k: number; band: [number, number] }> = ({ i, f, k, band }) => {
  const uid = `pc${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const x = pageX(i);
  const h = i < BILL_H.length ? billH(i, f) : 0;
  const b = barRect(i, h);
  const box = pageBox(i);
  const sil: ShadowPart[] = [];
  const barD = (y0: number) => rectPath(b.x, y0, b.w, PAGE_TOP + 6 - y0 + 0.001, R, true, false);
  if (CALENDAR_PAGE.src) sil.push(...photoCutOutSil({ src: CALENDAR_PAGE.src, x, floor: FLOOR, h: PAGE_H, aspect: CALENDAR_PAGE.aspect }));
  else sil.push({ d: rectPath(box.x, box.y, box.w, box.h, 5) });
  // THE SLOT: a dark slit cut through the paper just under its top edge, a lip wider than the bar each side;
  // the bar stands in it (its foot at the slit's middle, the slit's lower half in front of it).
  const slit = slitGeom(x, k);
  const foot = slit.y + slit.h / 2;
  const ao = Math.min(h, EDGE.FOOT_AO / k);
  const lab = CALENDAR_PAGE.label;
  const fs = lab.capPx / 0.718;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(band[0])} x2="0" y2={f3(band[1])}>
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberFoot} />
        </linearGradient>
        <linearGradient id={`${uid}o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
        <linearGradient id={`${uid}p`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(box.y)} x2="0" y2={f3(FLOOR)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <StoutShadow parts={h > 0.05 ? [...sil, { d: barD(b.y) }] : sil} contact={{ x, y: FLOOR, w: PAGE_W }} />
      {/* the page */}
      {CALENDAR_PAGE.src ? (
        <PhotoCutOut src={CALENDAR_PAGE.src} x={x} floor={FLOOR} h={PAGE_H} aspect={CALENDAR_PAGE.aspect} k={k} shadow={false} />
      ) : (
        <g>
          <path d={rectPath(box.x, box.y, box.w, box.h, 5)} fill={`url(#${uid}p)`} />
          {/* placeholder day grid: hairlines in the paper's own shade */}
          <g stroke={COLOR.boardFoot} strokeOpacity={0.35} strokeWidth={f3(1.5 / k)}>
            {Array.from({ length: 6 }, (_, r) => (
              <line key={`r${r}`} x1={f3(box.x + 18)} x2={f3(box.x + box.w - 18)} y1={f3(box.y + box.h * 0.36 + r * box.h * 0.115)} y2={f3(box.y + box.h * 0.36 + r * box.h * 0.115)} />
            ))}
            {Array.from({ length: 8 }, (_, c) => (
              <line key={`c${c}`} y1={f3(box.y + box.h * 0.36)} y2={f3(box.y + box.h * 0.935)} x1={f3(box.x + 18 + (c * (box.w - 36)) / 7)} x2={f3(box.x + 18 + (c * (box.w - 36)) / 7)} />
            ))}
          </g>
        </g>
      )}
      {/* the slit (behind the bar) */}
      <path d={rectPath(slit.x, slit.y, slit.w, slit.h, slit.h / 2)} fill={COLOR.inkDark} fillOpacity={0.92} />
      {/* the bill: amber standing in the slit, its foot at the slit's middle */}
      {h > 0.05 ? (
        <>
          <g style={{ filter: bloomFilter(k) }}>
            <path d={rectPath(b.x, b.y, b.w, foot - b.y, R, true, false)} fill={`url(#${uid}a)`} />
          </g>
          <HotEdge x={b.x} y={b.y} w={b.w} k={k} r={R} />
          {/* its foot occlusion just above the slit */}
          <rect x={f3(b.x)} y={f3(foot - ao)} width={f3(b.w)} height={f3(ao)} fill={`url(#${uid}o)`} />
          {/* the slit's lower half, in front of the bar's foot */}
          <path d={rectPath(slit.x, foot, slit.w, slit.h / 2, Math.min(slit.h / 2, 2 / k), false, true)} fill={COLOR.inkDark} fillOpacity={0.92} />
        </>
      ) : null}
      {/* the month, printed in ink on the page */}
      <text
        x={f3(box.x + lab.x0 * PAGE_W)}
        y={f3(LABEL_Y)}
        fontFamily={FONT_LABEL}
        fontWeight={500}
        fontSize={f3(fs)}
        letterSpacing={`${TRACK.label}em`}
        textAnchor="start"
        fill={COLOR.inkDark}
        style={{ fontFeatureSettings: '"case" 1' }}
      >
        {MONTHS[i].toUpperCase()}
      </text>
    </g>
  );
};

// ===========================================================================
// THE CUT
// ===========================================================================
const PriceCreepsUp: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const band = amberBandFor(cam);
  // only the months the frame can see (+ a margin)
  const left = cam.x - 600 / k;
  const right = cam.x + 600 / k;
  const months = MONTHS.map((_, i) => i).filter((i) => pageX(i) + PAGE_W / 2 > left && pageX(i) - PAGE_W / 2 < right);
  const tagOn = TAG_POSE.x + TAG_W > left;
  return (
    <StoutStage S={f} cam={cam} rest={CAM_REST} pool={POOL_TRACK[Math.max(0, Math.min(POOL_TRACK.length - 1, Math.round(f)))]}>
      {months.map((i) => (
        <Month key={i} i={i} f={f} k={k} band={band} />
      ))}
      {tagOn ? (
        <PriceTag x={TAG_POSE.x} y={TAG_POSE.y} anchor="foot" angle={TAG_POSE.angle} k={k} h={TAG_H} />
      ) : null}
    </StoutStage>
  );
};

export default PriceCreepsUp;
