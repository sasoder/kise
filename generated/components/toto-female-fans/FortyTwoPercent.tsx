// ---------------------------------------------------------------------------
// FortyTwoPercent (toto-female-fans, cut 55). Cheeky Pint style, the picture-book world (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 65 frames. World: fansWorld.tsx, the same grandstand, screen, bank and seeds as cut 44
// BiggerThanTheStands (every fan has arrived: the crowd clock is past the end of cut 44). Revision 2.
//
// CHECK LINE: "Almost half of F1's fans in the stands are women: 42%."
//
// THE LINE: "And | we have 42% female fans, | which is an awesome..."
// WORD -> FRAME (from the composition start, notes/brief_A_fans.md): we 1 · have 21 · 42 25 · % 33 · female 39 ·
// fans 48 (ends ~58) · which 62.
// DURATION: the slot 55.400 -> 58.000 s = 2.60 s x 25 = 65 frames (f0..f64).
//
// THE MOTION: back on the grandstand, framed tight: its 50 seated fans (5 tiers x 10, each ~105-130 px tall, faces,
// hair and scarves readable), the big screen above the roof still showing the race, the packed bank at both sides,
// every scarf amber; a slow push-in across the cut (k 1.16 -> 1.22). On "42" the screen switches from the race to
// lit cream (f19-26) and "42%" rolls up on it as two odometer drums (f25-36): the tens drum turns blank -> 1 -> 4 and
// lands f33, the units drum turns blank -> 0 -> ... -> 2 (13 steps on a keyed decelerating curve, mid-turn on f32-f34 so no frame shows a whole 41, an ease-out with a light vertical blur only while it
// turns; each drum shows through a one-digit window) and lands f35; the "%" slides up with them. On "female fans" one wave runs left to right through the crowd
// (each fan starts f39 + 7 * (its x across the stand), 12 frames each, done by f58): the 21 women of the 50 (42 %:
// 4, 4, 5, 4, 4 a tier, spread through the stand, every hair - bob, bun, pony, curly, short with a clip and earrings -
// and every skin tone) reach down beside their seats and lift an AMBER FLAG, which unfurls over their heads and waves;
// every man's scarf turns from amber to board (the scarf only: no figure dims). Amber ends on exactly the women. The
// bank's fans in shot follow the same rule. The one LightSweep crosses the "42%" on "fans" (f48-58). It ends settled
// and alive: the flags waving, the push, the sway.
// CAUSE: a flag comes up in a woman's hand from behind the row in front (her arm reaches down first); a scarf's
// colour turns as the wave reaches its wearer. AMBER = F1's fans; here only the women keep it.
//
// SOURCES: 42 % female fans: F1 / Motorsport Network 2025 Global F1 Fan Survey (100,000+ respondents in 186
// countries; women are 42 % of F1's fans), as given in the brief. The stand's split: SEAT_WOMEN in fansWorld.tsx
// (exactly 21 of 50), seeded and spread, not sorted.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_NUM, LightSweep, TYPE, clamp01, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { FansStage, SCREEN, type FanCam } from "./fansWorld";

export const FPS = 25;
export const DURATION = 65;
export const schema = z.object({});
export const defaultProps = schema.parse({});

export const BEAT = {
  litFrom: 19,
  litTo: 26,
  rollFrom: 25, // "42" f25
  tensTo: 33,
  unitsTo: 35, // = rollFrom + UNITS_KEYS.length - 1
  waveFrom: 39, // "female" f39
  waveSpread: 7,
  waveF: 12,
  sweepFrom: 48, // "fans" f48
  sweepTo: 58,
} as const;

// --- the camera: a slow push-in on the stand and its screen ------------------------------------------------------
const K0 = 1.16;
const K1 = 1.22;
/** the world height held at screen y 900: between the stand's tiers and the screen */
const AIM_H = 405;
export const camAt = (f: number): FanCam => {
  const u = f / (DURATION - 1);
  const k = Math.exp(Math.log(K0) + (Math.log(K1) - Math.log(K0)) * (0.35 * u + 0.65 * smoothstep(u)));
  return { x: 4 - 0.1 * f, k, gy: 900 + AIM_H * k, dx: 0.7 * Math.sin(f / 12.1), dy: 0.5 * Math.sin(f / 9.7) };
};

export const litAt = (f: number) => smoothstep((f - BEAT.litFrom) / (BEAT.litTo - BEAT.litFrom));
/** a drum's position (steps, -1 = blank): an ease-out that keeps turning into its landing (never parks on N-1) */
const drum = (f: number, from: number, to: number, f0: number, f1: number, ex: number) => {
  const p = clamp01((f - f0) / (f1 - f0));
  return from + (to - from) * (1 - Math.pow(1 - p, ex));
};
/** tens: blank (0) -> 4; units: blank (-1) -> 0 .. 9 -> 0 -> 1 -> 2 (13 steps). The exponents are set so the units are
 *  the tens mid-turn on f32 */
export const tensAt = (f: number) => drum(f, 0, 4, BEAT.rollFrom, BEAT.tensTo, 1.6);
/** the units drum, keyed per frame from f25: decelerating, and mid-turn on every frame of its last two steps
 *  (f32 0->1 half, f33 1->2 half, f34 the 2 nearly in), so no frame ever shows a whole "41" */
const UNITS_KEYS = [-1, 1.2, 3.3, 5.2, 6.8, 8.1, 9.3, 10.45, 11.5, 11.88, 12];
export const unitsAt = (f: number) => {
  const u = f - BEAT.rollFrom;
  if (u <= 0) return UNITS_KEYS[0];
  if (u >= UNITS_KEYS.length - 1) return UNITS_KEYS[UNITS_KEYS.length - 1];
  const i = Math.floor(u);
  return UNITS_KEYS[i] + (UNITS_KEYS[i + 1] - UNITS_KEYS[i]) * (u - i);
};
/** the payoff wave at world x (0..1): left to right across the stand */
export const waveAt = (f: number, x: number) => smoothstep((f - (BEAT.waveFrom + BEAT.waveSpread * clamp01((x + 520) / 1040))) / BEAT.waveF);

/** the odometer on the screen face (world px; the stand plane's scale kz) */
const Odometer: React.FC<{ f: number; kz: number }> = ({ f, kz }) => {
  const uid = `od${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const fs = TYPE.HERO / kz;
  const adv = 0.62 * fs;
  const pctW = 0.84 * fs;
  const total = 2 * adv + pctW;
  const x0 = -total / 2;
  const cy = (SCREEN.top + SCREEN.bottom) / 2;
  const base = cy + (0.729 * fs) / 2;
  const lineH = 1.0 * fs;
  const ink = COLOR.inkDark;
  const col = (P: number, dP: number, cx: number, key: string) => {
    const i = Math.floor(P);
    // the tens drum clicks from digit to digit (each step eased); the units turn on their keyed curve
    const fr = key === "t" ? smoothstep(P - i) : P - i;
    // the tens drum's 0 is blank (no leading zero)
    const glyph = (n: number) => (n < 0 || (key === "t" && n === 0) ? "" : `${((n % 10) + 10) % 10}`);
    const blurPx = Math.min(4, 0.01 * Math.abs(dP) * TYPE.HERO);
    // each drum shows through its own one-digit window: a turning drum shows at most the outgoing digit leaving
    // the top of the window and the next one entering from the bottom, never a stack of numbers
    const wTop = base - 0.729 * fs - 0.1 * fs;
    const wH = 0.729 * fs + 0.2 * fs;
    return (
      <g key={key}>
        <defs>
          <clipPath id={`${uid}w${key}`}>
            <rect x={cx - adv / 2} y={wTop} width={adv} height={wH} />
          </clipPath>
          {blurPx > 0.3 ? (
            <filter id={`${uid}b${key}`} x="-10%" y="-40%" width="120%" height="180%">
              <feGaussianBlur stdDeviation={`0 ${(blurPx / kz).toFixed(3)}`} />
            </filter>
          ) : null}
        </defs>
        <g clipPath={`url(#${uid}w${key})`}>
          <g filter={blurPx > 0.3 ? `url(#${uid}b${key})` : undefined}>
            {fr < 0.999 ? (
              <text x={cx} y={base - fr * lineH} textAnchor="middle">
                {glyph(i)}
              </text>
            ) : null}
            {fr > 0.001 ? (
              <text x={cx} y={base + (1 - fr) * lineH} textAnchor="middle">
                {glyph(i + 1)}
              </text>
            ) : null}
          </g>
        </g>
      </g>
    );
  };
  const T = tensAt(f);
  const U = unitsAt(f);
  const dT = tensAt(f + 0.5) - tensAt(f - 0.5);
  const dU = unitsAt(f + 0.5) - unitsAt(f - 0.5);
  // the "%" slides up with the first turn of the drums
  const pe = smoothstep((f - BEAT.rollFrom) / 5);
  const fx0 = SCREEN.x0 + SCREEN.border;
  const fy0 = SCREEN.top + SCREEN.border;
  const fw = SCREEN.x1 - SCREEN.x0 - 2 * SCREEN.border;
  const fh = SCREEN.bottom - SCREEN.top - 2 * SCREEN.border;
  if (f < BEAT.rollFrom - 0.5) return null;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}>
          <rect x={fx0} y={fy0} width={fw} height={fh} rx={3} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}c)`} fontFamily={FONT_NUM} fontWeight={700} fontSize={fs} fill={ink} style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}>
        {col(T, dT, x0 + adv / 2, "t")}
        {col(U, dU, x0 + 1.5 * adv, "u")}
        <text x={x0 + 2 * adv + pctW / 2} y={base + ((1 - pe) * 24) / kz} textAnchor="middle" opacity={pe}>
          %
        </text>
      </g>
    </g>
  );
};

const FortyTwoPercent: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const sweep = clamp01((S - BEAT.sweepFrom) / (BEAT.sweepTo - BEAT.sweepFrom));
  const SC = SCREEN;
  const faceX = SC.x0 + SC.border;
  const faceY = SC.top + SC.border;
  const faceW = SC.x1 - SC.x0 - 2 * SC.border;
  const faceH = SC.bottom - SC.top - 2 * SC.border;
  const overlay = (kz: number) => (
    <g>
      <Odometer f={S} kz={kz} />
      <LightSweep x={faceX} y={faceY} w={faceW} h={faceH} k={kz} t={sweep} on="amber" r={3} />
    </g>
  );
  return <FansStage S={S + 400} T={10000} cam={cam} screenLit={litAt(S)} screenOverlay={overlay} wave={(x) => waveAt(S, x)} fenceRow={false} />;
};

export default FortyTwoPercent;
