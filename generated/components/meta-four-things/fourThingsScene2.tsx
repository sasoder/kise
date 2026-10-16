import React, { useId } from "react";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  ElevationShadow,
  FONT_NUM,
  GEO,
  Label,
  LightSweep,
  METRIC,
  SPACE,
  TRACK,
  TYPE,
  amberBandFor,
  bloomFilter,
  clamp01,
  easeOutCubic,
  lerp,
  numeralWidth,
  rectPath,
  smoothstep,
  type Silhouette,
} from "../kits/cheeky-pint/stoutShared";
import { BAY_CY, FLOOR, bayX, personHead, personPath, restToRest, type SceneCam, type ScenePool, type SceneProps } from "./fourThingsShared";

// ===========================================================================
// fourThingsScene2 — scene 2 of the META4 set ("Four things Mark did", Cheeky Pint S4E03), clip
// FourThings2 (sequence frames 550-831, 281 f, 23.976 fps). Brief: out/meta4/BRIEF.md; world and
// shell: fourThingsShared.tsx / fourThingsClip.tsx (out/meta4/SHARED_READY.md).
//
// THE LINE: "Thing two is you were willing to pay ungodly amounts of money for effectively talent.
// Like you're paying a lot of money to bring Alex and some other people, but, you know, a lot of
// money for Alex in particular."
// CHECK LINE: the viewer can say "Meta paid enormous sums for people, and one person's price dwarfs
// the rest: $14.3B, the Scale AI deal that brought Alex."
//
// ONE SENTENCE OF MOTION: money lifts five people a little, and then one of them, Alex, keeps
// rising until his column dwarfs the row and its price can be read: $14.3B, the Scale AI investment.
// (No percentage on screen: the fact check found the 49% is not stated by Meta or Scale.)
// Amber = Mark's move = the money. The people are cream.
//
// ONSETS (local f): thing 3 · two is 12 · you 31 · were willing 41 · to pay 49 · ungodly 61 ·
// amounts 77 · of money 82 · for 92 · effectively 105 · talent 117 · like 129 · you're paying 143 ·
// a lot 150 · of money 153 · to bring 159-165 · Alex 176 · and some other people 184-196 · but 204 ·
// you know 207 · a lot 224 · of money 239 · for 246 · Alex 252 · in particular 265-270 · end 281.
//
// FRAME TABLE (see T below)
//   f 0-30    the shell's camera travels in from bay 1 (this scene's camera is calm there); the five
//             people stand on their tiles
//   f 10-144  the slots open and the amber money bars rise out of them and lift the people, a wave
//             that converges on Alex (starts 16 / 28 / 40+40 / 52, 92 f each, soft landings; Alex's runs
//             straight into his climb);
//             the camera creeps in on the row
//   f 134-252 Alex's column keeps rising (32 -> 656 world px, rest to rest with a long landing); the
//             camera tilts up and eases back with it (f 136-257)
//   f 148-160 ALEX WANG blurs in over his head (he has left the pack)
//   f 164-176 the price blurs in beside the column, centred on the part of it that stands above the
//             others, and counts with the column (one money scale: 656 px = $14.3B); it lands on
//             whole digits at f 236 and holds sharp
//   f 228-240 SCALE AI INVESTMENT under the numeral; f 234-246 the Scale wordmark over it
//   f 248-260 the one light sweep, up the finished column as the count lands
//   f 257-    settled: the camera is constant (clip 3 leaves from it); the stage's sway, grain and
//             light keep it alive
// ===========================================================================

// --- the cast (WORLD px) ---------------------------------------------------------------------------
const T = GEO.TILE; // 96: the tiles
const BW = 80; // a money bar: a plinth a little wider than the person on it
const BUST = 76; // a person (>= 110 screen px at every rest of this scene)
const PITCH = GEO.PITCH; // 128
const X0 = bayX(2);
const TILE_TOP = FLOOR - T;
const ALEX = 3; // second from the right: the price stands on his left, the row under it
const xOf = (i: number) => X0 + (i - 2) * PITCH;
/** What the others' bars reach (modest, unlabelled: their pay is not public; about 4-5 % of Alex's
 *  column) and Alex's first rise: he is one of the row until the line singles him out. */
const MODEST = [28, 36, 24, 32, 30];
/** Alex's column: 656 world px = $14.3B (the only figure on screen). */
const COLUMN = 656;
const PRICE_TENTHS = 143;

// --- the frame table ---------------------------------------------------------------------------------
const T_ = {
  rise: [16, 28, 40, 52, 40], // each first rise's start: a wave that ends on Alex
  riseDur: 92,
  slotLead: 6, // a slot opens this long before its bar leaves it
  climb: [134, 252] as [number, number], // Alex's column
  camCreep: [20, 134] as [number, number],
  camClimb: [136, 257] as [number, number],
  name: 148,
  price: 164,
  label: 228,
  logo: 234,
  sweep: [248, 260] as [number, number],
} as const;
const ENTER_F = 12;
/** The two labels (SCREEN px): bigger than TYPE.LABEL, for a phone (director's note). */
const LABEL_PX = 40;
/** The count lands here, on whole digits, while the column finishes its long landing. */
const COUNT_END = 236;

/** The bars' heights at t (world px). */
const barsAt = (t: number) =>
  MODEST.map((h, i) => {
    const first = h * restToRest((t - T_.rise[i]) / T_.riseDur, 3);
    if (i !== ALEX) return first;
    const e = restToRest((t - T_.climb[0]) / (T_.climb[1] - T_.climb[0]), 3);
    return e >= 1 ? COLUMN : first + (COLUMN - h) * e;
  });

/** The price in tenths of a billion: it counts with the column (one money scale: COLUMN px = $14.3B)
 *  but on its own ease, so it arrives on whole digits at COUNT_END and holds sharp from there. */
const countAt = (t: number) => {
  const v0 = (PRICE_TENTHS * MODEST[ALEX]) / COLUMN;
  if (t >= COUNT_END) return PRICE_TENTHS;
  return v0 + (PRICE_TENTHS - v0) * smoothstep((t - T_.climb[0]) / (COUNT_END - T_.climb[0]));
};

// --- the camera -------------------------------------------------------------------------------------
// Three rests, as absolute world cameras: the row as the travel arrives (K0), the row a little closer
// (K1), and the finished column (K2: Alex at screen x 765, the floor at screen y 1680).
const keyCam = (k: number, floorY: number, wx: number, sx: number) => ({ x: wx - (sx - 540) / k, y: FLOOR - (floorY - 960) / k, k });
const K0 = keyCam(1.5, 1070, X0, 540);
const K1 = keyCam(1.56, 1085, X0, 540);
const K2 = keyCam(1.45, 1680, xOf(ALEX), 765);
const creepE = (t: number) => smoothstep((t - T_.camCreep[0]) / (T_.camCreep[1] - T_.camCreep[0]));
const climbE = (t: number) => restToRest((t - T_.camClimb[0]) / (T_.camClimb[1] - T_.camClimb[0]), 3);
/** The camera scene 2 wants, relative to its bay centre: C1, and constant from f 257 on. */
export const sceneCam2 = (t: number): SceneCam => {
  const a = creepE(t);
  const b = climbE(t);
  return {
    dx: K0.x + (K1.x - K0.x) * a + (K2.x - K1.x) * b - X0,
    dy: K0.y + (K1.y - K0.y) * a + (K2.y - K1.y) * b - BAY_CY,
    k: Math.exp(Math.log(K0.k) + Math.log(K1.k / K0.k) * a + Math.log(K2.k / K1.k) * b),
  };
};
/** The light follows Alex: from the row to the middle of his column. */
export const scenePool2 = (t: number): ScenePool => {
  const b = climbE(t);
  return { dx: lerp(48, xOf(ALEX) - X0 - 40, b), dy: lerp(FLOOR - 190 - BAY_CY, K2.y - 40 - BAY_CY, b) };
};

// --- small helpers ---------------------------------------------------------------------------------
const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `s2${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
/** The house entrance of type: slide up 24 SCREEN px + fade + blur 6 -> 0, over ENTER_F. */
const enterAt = (t: number, f0: number) => {
  const a = easeOutCubic(clamp01((t - f0) / ENTER_F));
  return { p: clamp01((t - f0) / ENTER_F), lift: (1 - a) * 24, opacity: a, blur: 6 * (1 - a) };
};

// ===========================================================================
// A PERSON ON THEIR MONEY — tile + amber bar (out of the tile's slot) + the bust standing on it:
// ONE object, one union shadow.
// ===========================================================================
const PersonPillar: React.FC<{ x: number; bar: number; slot: number; k: number; band: [number, number] }> = ({ x, bar, slot, k, band }) => {
  const uid = uidOf(useId());
  const r = GEO.RADIUS;
  const h = Math.max(0, bar);
  const top = TILE_TOP - h; // where the person stands
  const tx = x - T / 2;
  const bx = x - BW / 2;
  const bust = personPath(x, top, BUST);
  const head = personHead(x, top, BUST);
  const sil: Silhouette = [{ d: rectPath(tx, TILE_TOP, T, T, r) }, { d: bust }];
  if (h > 0.05) sil.push({ d: rectPath(bx, top, BW, h + r, r, true, false) });
  const slotW = (BW + (2 * EDGE.SLOT_LIP) / k) * slot;
  const slotH = EDGE.SLOT / k;
  const edgeY = TILE_TOP + EDGE.CREAM / k / 2;
  const edgeW = f2(EDGE.CREAM / k);
  const ao = EDGE.FOOT_AO / k;
  const fall = EDGE.HOT_FALL / k;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}t`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(TILE_TOP)} x2="0" y2={f2(FLOOR)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <linearGradient id={`${uid}p`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(top - BUST)} x2="0" y2={f2(top)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
        <linearGradient id={`${uid}hf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${uid}b`}>
          <path d={bust} />
        </clipPath>
        <clipPath id={`${uid}h`}>
          <circle cx={f2(head.x)} cy={f2(head.y)} r={f2(head.r)} />
        </clipPath>
      </defs>

      {/* 1. the one shadow */}
      <ElevationShadow silhouette={sil} elevation="rest" contact={{ x, y: FLOOR, w: T }} />

      {/* 2. the tile, its lit edge (it stops at the slot) */}
      <path d={rectPath(tx, TILE_TOP, T, T, r)} fill={`url(#${uid}t)`} />
      <path
        d={
          slot > 0.001
            ? `M${f2(tx + r)} ${f2(edgeY)}H${f2(x - slotW / 2)}M${f2(x + slotW / 2)} ${f2(edgeY)}H${f2(tx + T - r)}`
            : `M${f2(tx + r)} ${f2(edgeY)}H${f2(tx + T - r)}`
        }
        stroke={COLOR.edge}
        strokeOpacity={ALPHA.edge}
        strokeWidth={edgeW}
      />

      {/* 3. the money: amber out of the slot, its bloom, its hot top edge */}
      {h > 0.05 ? (
        <>
          <g style={{ filter: bloomFilter(k) }}>
            <path d={rectPath(bx, top, BW, h, r, true, false)} fill={`url(#${uid}a)`} />
          </g>
          <path d={rectPath(bx, top, BW, Math.min(fall, h), r, true, false)} fill={`url(#${uid}hf)`} />
          <path d={`M${f2(bx + r)} ${f2(top + EDGE.HOT / k / 2)}H${f2(bx + BW - r)}`} stroke={COLOR.amberHot} strokeWidth={f2(EDGE.HOT / k)} />
          <rect x={f2(bx)} y={f2(TILE_TOP - Math.min(h, ao))} width={f2(BW)} height={f2(Math.min(h, ao))} fill={`url(#${uid}ao)`} />
        </>
      ) : null}
      {slot > 0.001 ? <rect x={f2(x - slotW / 2)} y={f2(TILE_TOP - slotH / 2)} width={f2(slotW)} height={f2(slotH)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} /> : null}

      {/* 4. the person, standing on it: cream, a short occlusion at the foot, the lit edge on the head */}
      <path d={bust} fill={`url(#${uid}p)`} />
      <g clipPath={`url(#${uid}b)`}>
        <rect x={f2(x - BUST / 2)} y={f2(top - ao)} width={f2(BUST)} height={f2(ao)} fill={`url(#${uid}ao)`} />
      </g>
      <g clipPath={`url(#${uid}h)`}>
        <path
          d={`M${f2(head.x - head.r * 0.8)} ${f2(head.y - head.r * 0.6)}A${f2(head.r - EDGE.CREAM / k / 2)} ${f2(head.r - EDGE.CREAM / k / 2)} 0 0 1 ${f2(head.x + head.r * 0.8)} ${f2(head.y - head.r * 0.6)}`}
          fill="none"
          stroke={COLOR.edge}
          strokeOpacity={ALPHA.edge}
          strokeWidth={edgeW}
        />
      </g>
    </g>
  );
};

// ===========================================================================
// THE PRICE — an odometer in tenths of a billion, set on PROPORTIONAL advances (each cell's width
// eases between its two digits), so nothing shifts on the frame it lands. x = its RIGHT edge.
// ===========================================================================
const priceText = (n: number) => `$${Math.floor(n / 10)}.${n % 10}B`;
const Price: React.FC<{ x: number; y: number; k: number; px: number; value: number; rollBlur: number; opacity: number; lift: number; blur: number }> = ({
  x,
  y,
  k,
  px,
  value,
  rollBlur,
  opacity,
  lift,
  blur,
}) => {
  const uid = uidOf(useId());
  if (opacity <= 0.002) return null;
  const fs = px / k;
  const v = Math.max(0, Math.min(PRICE_TENTHS, value));
  const lo = Math.min(PRICE_TENTHS, Math.floor(v + 1e-9));
  const frac = lo >= PRICE_TENTHS ? 0 : clamp01(v - lo);
  const a = priceText(lo).padStart(6, " ");
  const b = (frac > 0 ? priceText(lo + 1) : priceText(lo)).padStart(6, " ");
  const roll = smoothstep(frac);
  const adv = (c: string) => (c === " " ? 0 : numeralWidth(c, fs));
  const track = TRACK.numeral * fs;
  const yy = y + lift / k;
  const lineH = fs;
  // lay the cells out from the right edge
  let right = x;
  const cells: { c: string; d: string; cx: number }[] = [];
  for (let i = a.length - 1; i >= 0; i--) {
    const w = lerp(adv(a[i]), adv(b[i]), roll);
    const here = lerp(a[i] === " " ? 0 : 1, b[i] === " " ? 0 : 1, roll);
    cells.unshift({ c: a[i], d: b[i], cx: right - w / 2 });
    right -= w + track * here;
  }
  const left = right;
  return (
    <g opacity={f2(opacity)} style={{ filter: blur > 0.05 ? `blur(${f2(blur / k)}px)` : undefined }}>
      <defs>
        <clipPath id={`${uid}c`}>
          <rect x={f2(left - fs)} y={f2(yy - fs * 0.9)} width={f2(x - left + 2 * fs)} height={f2(fs * 1.06)} />
        </clipPath>
        {rollBlur > 0.05 ? (
          <filter id={`${uid}v`} x="-5%" y="-30%" width="110%" height="160%">
            <feGaussianBlur stdDeviation={`0 ${f2(rollBlur / k)}`} />
          </filter>
        ) : null}
      </defs>
      <g clipPath={`url(#${uid}c)`} fontFamily={FONT_NUM} fontWeight={700} fontSize={f2(fs)} fill={COLOR.inkCream} textAnchor="middle" style={{ fontFeatureSettings: '"lnum" 1' }}>
        {cells.map((q, i) => {
          if (q.c === q.d) {
            return q.c === " " ? null : (
              <text key={i} x={f2(q.cx)} y={f2(yy)}>
                {q.c}
              </text>
            );
          }
          const off = roll * lineH;
          return (
            <g key={i} filter={rollBlur > 0.05 ? `url(#${uid}v)` : undefined}>
              {q.c !== " " ? (
                <text x={f2(q.cx)} y={f2(yy - off)}>
                  {q.c}
                </text>
              ) : null}
              {q.d !== " " ? (
                <text x={f2(q.cx)} y={f2(yy + lineH - off)}>
                  {q.d}
                </text>
              ) : null}
            </g>
          );
        })}
      </g>
    </g>
  );
};

// ===========================================================================
// THE SCALE WORDMARK (public/cheekypint2/meta4/Scale_AI.svg, its one path inlined; box 2177 x 700),
// redrawn as cream ink on the ground, like type.
// ===========================================================================
const SCALE_W = 2177;
const SCALE_H = 700;
const SCALE_D =
  "M 1560 0.9 C 1552.1 3.5 1545.9 8 1541.5 14.4 C 1534.5 24.8 1535 -2.9 1535 350 C 1535 702.9 1534.5 675.2 1541.5 685.5 C 1545.2 691 1548 693.4 1555 697.1 C 1558.9 699.2 1560.9 699.5 1569.5 699.5 C 1579 699.5 1579.8 699.3 1585.8 696.1 C 1592.9 692.2 1596.8 688 1600.8 680 L 1603.5 674.5 1603.5 350 L 1603.5 25.5 1600.8 20 C 1596.8 11.9 1592.9 7.8 1585.8 4 C 1580.3 1 1578.5 0.6 1571 0.3 C 1566.3 0.2 1561.4 0.4 1560 0.9 M 174.8 226 C 80.2 232.2 16.1 278.5 6.2 347.9 C 3.5 367 6.5 389.3 14.4 407.9 C 23.9 430.3 42.8 450.1 67.5 463.5 C 94 477.8 125.2 486 195 497 C 271.7 509.1 300.8 517.7 316.3 532.8 C 325.3 541.5 329 550.6 329 564 C 329 578 324.5 588.5 314.1 599.3 C 299.3 614.7 276 624.6 243 629.6 C 229 631.8 193.5 632.1 178.5 630.1 C 135.2 624.7 93.2 609.7 56.8 586.8 C 46 580 41.3 578.6 31.3 579.2 C 21.5 579.8 15.1 582.9 8.7 590 C 2.8 596.5 0 604 -0 612.9 C -0 630.2 6.8 637.9 37.3 654.9 C 80.6 679.2 129.1 694.2 179.2 699 C 196.1 700.7 239.7 699.8 254 697.5 C 296.9 690.8 328.8 677.7 354.3 656.2 C 385 630.4 401.2 591.2 397.2 552.7 C 391.9 502.2 361.3 468.5 303.4 449.4 C 281.5 442.3 257.7 437.4 201.5 428.5 C 146.3 419.8 120 413.2 100.8 403.3 C 82.3 393.8 74 381 74 361.9 C 74 329.1 106.1 305.3 162.5 296.3 C 176.2 294.1 214.6 293.9 229 295.9 C 270.1 301.5 300.2 313.3 329.6 335.1 C 342.3 344.5 347.7 346.5 358.4 345.8 C 370.7 344.9 380.1 338.9 386.1 327.8 C 389.3 322 389.5 320.9 389.5 312.5 C 389.5 304.3 389.2 302.9 386.2 296.7 C 382.2 288.7 376.2 283.3 357.6 270.9 C 314.7 242.3 263.7 227.3 204 225.6 C 194.9 225.4 181.8 225.5 174.8 226 M 685 226 C 583 234.1 497.5 305.5 472.5 403.5 C 466.5 426.9 465.5 435.7 465.5 463.5 C 465.6 491.4 467 502.7 473.5 526.3 C 495.3 605.9 558.8 669.3 639.3 691.9 C 661.4 698.1 672.8 699.5 702 699.5 C 725.3 699.5 729.9 699.2 740.5 697.2 C 793.9 687.1 840.1 660.6 873.1 621.1 C 891.6 599 896.4 588.7 894.1 576.1 C 893.4 572.6 892 568 891 566 C 884.6 553.5 871.2 546 857.3 547.3 C 845.1 548.5 839 552.8 827.8 567.9 C 772.2 643.4 664.3 653.3 591 589.8 C 545 549.9 524.2 486.2 537.6 426.1 C 555.3 346.9 627.5 291.1 708 294.4 C 732.1 295.4 750 299.9 771.5 310.5 C 793.7 321.5 814.9 339.5 828.6 359 C 838.6 373.3 847 378.4 860.5 378.5 C 867.6 378.5 869.3 378.1 875.2 375.2 C 887.5 369.2 894.3 358.2 894.3 344.5 C 894.3 334.9 891.7 328.8 881.8 315.5 C 872.3 302.7 851.1 281.1 839.5 272.3 C 800.2 242.7 757.4 227.4 709 225.7 C 701.6 225.4 690.8 225.5 685 226 M 1187 225.6 C 1142.5 228.5 1103.4 241.6 1067.5 265.5 C 1015.9 299.8 978.9 354.7 966.6 415 C 963.1 432.2 962 444.1 962 463.2 C 962 517.1 979.1 566.4 1012.8 610 C 1021.3 620.9 1041.1 640.7 1052 649.2 C 1093.1 681 1139.6 698.2 1188.5 699.7 C 1204.4 700.2 1205.9 700.1 1211.4 698 C 1221.3 694.2 1230 684.5 1232.4 674.5 C 1233.8 668.9 1233.1 659.4 1231 653.7 C 1228.2 646.3 1221.6 639.1 1214.4 635.6 C 1209.3 633.1 1206.8 632.6 1195.5 631.9 C 1179.2 630.9 1174.8 630.3 1163.1 627.8 C 1142.3 623.4 1119.3 613.2 1101 600.2 C 1088.9 591.6 1070.4 573.2 1061.7 561 C 1053.7 549.7 1043.2 529.1 1039 516.3 C 1022.8 467.3 1029.7 414.2 1057.8 371 C 1090.2 321 1146.5 291.8 1205.5 294.3 C 1254 296.4 1297.6 320.1 1326.1 360 C 1337.4 375.8 1347.5 399.1 1351.4 418.1 C 1354.6 433.8 1355 448.8 1355 560.7 L 1355 672.9 1357.2 678.7 C 1360.1 686.6 1368.4 694.9 1376.3 697.8 C 1393.1 704.1 1411.6 697 1419.5 681.3 L 1422.5 675.5 1422.8 557 C 1423 476.2 1422.8 435 1422 427.5 C 1416.8 375.5 1394.3 328.1 1357.1 291 C 1316 250 1263.8 227.5 1205.5 225.7 C 1198.3 225.4 1190 225.4 1187 225.6 M 1936 226 C 1889.8 229.7 1847.5 245.7 1810.5 273.5 C 1761.7 310.2 1729.2 364.2 1718.9 425.5 C 1716.3 441.3 1715.3 468.8 1716.9 484.5 C 1723.7 551.7 1757.4 612.3 1809.6 651.6 C 1841.7 675.8 1876.4 690.7 1916 697.6 C 1928.8 699.8 1965.6 700.6 1980.3 699.1 C 2042.1 692.5 2096.6 666.2 2138.7 622.7 C 2154.3 606.5 2156.5 602.4 2156.5 589 C 2156.5 580.6 2156.2 578.9 2153.7 574.2 C 2150 567.2 2144 561.4 2137.1 558.2 C 2132.4 556 2130.1 555.5 2123 555.5 C 2110.1 555.5 2106.7 557.5 2088.5 575.6 C 2070.9 593.2 2059.9 601.3 2040.7 611 C 1988.2 637.4 1929 638.7 1879.5 614.6 C 1832.4 591.5 1799 548.5 1787.8 496.4 C 1785.8 486.8 1785.5 482.8 1785.5 463 C 1785.5 437.8 1786.5 430.9 1792.7 411.5 C 1804.2 375.6 1828.1 343.8 1859.4 322.8 C 1889.6 302.7 1925.2 292.6 1960.4 294.4 C 1983.8 295.5 2000.9 300 2022.5 310.5 C 2055.2 326.5 2082.4 355.3 2096.6 389 C 2099.6 396.3 2106 416.6 2106 419.2 C 2106 419.6 2057.3 420.1 1997.8 420.2 L 1889.5 420.5 1884.9 422.8 C 1877.5 426.4 1872.4 431.5 1868.8 438.8 C 1865.8 444.7 1865.5 446.4 1865.5 454 C 1865.5 461.1 1865.9 463.4 1868.1 468.1 C 1871.5 475.3 1877.7 481.5 1884.9 484.9 L 1890.5 487.5 2021.5 487.5 L 2152.5 487.5 2157.5 485 C 2164.9 481.4 2172.3 473.6 2174.8 466.7 C 2178.8 456.1 2177.5 426 2172 400.5 C 2167 377.5 2154.4 347.6 2141.3 327.5 C 2109.2 278.6 2058.8 243.4 2002.6 230.9 C 1982.1 226.3 1956 224.4 1936 226";

// ===========================================================================
// THE SCENE
// ===========================================================================
export const Scene2: React.FC<SceneProps> = ({ t, cam, k }) => {
  const band = amberBandFor(cam);
  const bars = barsAt(t);
  const hA = bars[ALEX];
  const xA = xOf(ALEX);

  // --- the price: beside the column, centred on the part of it that stands above the others
  const headTopA = TILE_TOP - hA - BUST;
  const headTopOthers = TILE_TOP - Math.max(bars[0], bars[1], bars[2]) - BUST;
  const capH = METRIC.fig * TYPE.HERO; // SCREEN px
  const midY = lerp(headTopA, headTopOthers, 0.47);
  const priceY = midY + capH / 2 / k; // baseline
  const priceX = xA - BW / 2 - 36 / k; // the lockup's right edge
  const value = countAt(t);
  const speed = Math.abs(countAt(t + 0.5) - countAt(t - 0.5)); // tenths per frame
  const pe = enterAt(t, T_.price);

  // --- the lockup around it (SCREEN px -> world)
  const labelY = priceY + (SPACE.LOCKUP + METRIC.cap * LABEL_PX) / k;
  const logoH = 56; // SCREEN px, the wordmark's box (its x-height = 38)
  const logoS = logoH / SCALE_H / k;
  const le = enterAt(t, T_.logo);
  const logoBottom = priceY - (capH + 28) / k + le.lift / k;

  const sweep = (t - T_.sweep[0]) / (T_.sweep[1] - T_.sweep[0]);
  return (
    <g>
      {bars.map((h, i) =>
        i === ALEX ? null : <PersonPillar key={i} x={xOf(i)} bar={h} slot={smoothstep((t - (T_.rise[i] - T_.slotLead)) / T_.slotLead)} k={k} band={band} />,
      )}
      <PersonPillar x={xA} bar={hA} slot={smoothstep((t - (T_.rise[ALEX] - T_.slotLead)) / T_.slotLead)} k={k} band={band} />
      <LightSweep x={xA - BW / 2} y={TILE_TOP - hA} w={BW} h={hA} k={k} t={sweep} on="amber" />

      <Label x={xA} y={headTopA - SPACE.CLEAR / k} k={k} text="ALEX WANG" px={LABEL_PX} tone="cream" enter={clamp01((t - T_.name) / ENTER_F)} />
      <Price x={priceX} y={priceY} k={k} px={TYPE.HERO} value={value} rollBlur={Math.min(14, 9 * speed)} opacity={pe.opacity} lift={pe.lift} blur={pe.blur} />
      <Label x={priceX} y={labelY} k={k} text="SCALE AI INVESTMENT" px={LABEL_PX} anchor="end" enter={clamp01((t - T_.label) / ENTER_F)} />
      {le.opacity > 0.002 ? (
        <g opacity={f2(le.opacity)} style={{ filter: le.blur > 0.05 ? `blur(${f2(le.blur / k)}px)` : undefined }}>
          <path
            d={SCALE_D}
            fill={COLOR.inkCream}
            fillRule="evenodd"
            transform={`translate(${(priceX - SCALE_W * logoS).toFixed(4)} ${(logoBottom - SCALE_H * logoS).toFixed(4)}) scale(${logoS.toFixed(6)})`}
          />
        </g>
      ) : null}
    </g>
  );
};
