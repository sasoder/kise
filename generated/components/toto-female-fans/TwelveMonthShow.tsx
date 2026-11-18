// ---------------------------------------------------------------------------
// TwelveMonthShow (toto-female-fans, cut 10). Cheeky Pint style, the picture-book world (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 140 frames. World: paddockWorld.tsx (THE ONE SHOW: one motorhome wall, its flip calendar,
// the two bosses, one camera op, one season tree), on trackWorld's stage (sky, grain, vignette).
//
// CHECK LINE: "F1's off-track drama runs all year round, and the cameras film every bit of it."
//
// THE LINE: "...younger drivers. The | politics outside of the sport. You know, that is basically a 12-month live
// reality show. | But..."
// WORD -> FRAME: politics 2 · outside 12 · of 23 · the 34 · sport 36 · You 51 · know 54 · that 58 · is 61 ·
// basically 65 · a 73 · 12 78 · month 84 · live 92 · reality 109 · show 120 (ends ~130) · But 137.
// DURATION: the slot 10.400 -> 16.000 s = 5.60 s x 25 = 140 frames (f0..f139).
//
// THE MOTION (revision 1: "a bit overwhelming ... make it more easy to understand"). ONE place, one slow push-in from f0
// (x1.16 by f139, eased out, still creeping at the end). A team motorhome wall; on it a big flip calendar (cream pages,
// the month in ink, Kräftig caps); under it two team bosses in headsets arguing; on the left ONE TV camera op filming
// them, its tally amber; on the right ONE tree carrying the seasons. The calendar turns JAN -> FEB -> ... -> DEC, every
// change a page turning over the top (it lifts off the pad, foreshortens, flips over the binding showing its back and
// drops behind the board): slow at first (pages turn f14, f36, f56: FEB, MAR, APR), then faster and faster from
// "12 month" (f75 MAY ... f110 DEC, the last turns ~5 frames apart). The season is driven by the pages turned (cause:
// the calendar): buds then blossom (FEB-APR), leaves (APR-MAY), a pale summer sun rising over the roof (MAY-AUG),
// autumn colour (AUG-SEP), the leaves coming off and fluttering down (SEP-NOV), bare. Snow begins to fall from f97 (the
// flakes enter from above the frame), and settles on the roof (f104+), the calendar's board, the branches, the bosses'
// heads and shoulders (f120+) and the floor (f124+). DEC holds in the snow; on "show" the page turns once more to JAN
// (f126-f136: the show never stops), settled and alive to f139 (snow falling, the argument, the camera rolling).
// The bosses change pose every few months (one eased blend each, 7-10 frames): A jabs / B arms folded (f0); B jabs
// back / A folds (f30); B turns away, a card turn, arms folded, and steps off / A pleads (f60); B turns back, both jab (f86); A throws
// up his hands, spread wide / B folds (f102); A jabs / B folds again (f118), as at the start.
// AMBER = F1's fans, the audience: only the camera's tally light glows. No numbers; the months are the only text.
//
// SOURCES: the calendar's day grids follow 2026 (Mon-first weeks). No figures, no logos (team-neutral).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { clamp01, lerp, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { TrackStage, type TrackCam } from "../toto-champion-eight/trackWorld";
import { M } from "../toto-champion-eight/champShared";
import { OneShowScene, SHOW, SnowFlurry, bossAt, pageTheta, paddockCam, type BossKey, type ShowSnow } from "./paddockWorld";

export const FPS = 25;
export const DURATION = 140;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ss = (a: number, b: number, f: number) => smoothstep((f - a) / (b - a));

// --- the calendar: each page's turn [start frame, frames] (page j turns month j over to month j + 1) ----------------------
export const FLIPS: [number, number][] = [
  [14, 14], // JAN -> FEB ("outside")
  [36, 13], // -> MAR ("sport")
  [56, 12], // -> APR ("that is")
  [75, 10], // -> MAY ("12 month": faster and faster)
  [83, 9],
  [89.5, 8],
  [95, 7],
  [99.5, 6.5],
  [103.5, 6],
  [107, 5.5],
  [110.5, 6], // -> DEC (lands f116.5)
  [126, 10], // DEC -> JAN again (on "show")
];
export const turnsAt = (f: number) => FLIPS.map(([a, d]) => clamp01((f - a) / d));
/** calendar time (0 = JAN .. 12 = the next JAN): the pages turned so far, each counted as it passes over */
export const calAt = (f: number) => turnsAt(f).reduce((acc, p) => acc + smoothstep(pageTheta(p) / 180), 0);

// --- the snow: flakes from f97; settling on each surface once the flakes reach it -------------------------------------
const SNOW_START = 97;
export const snowAt = (f: number): ShowSnow => ({
  roof: ss(104, 120, f),
  cal: ss(106, 120, f),
  tree: ss(108, 124, f),
  people: ss(120, 136, f),
  ground: ss(124, 140, f),
});

// --- the camera: one slow push-in on the calendar and the bosses, from f0, eased out (still creeping at the end) ------------
const ZP = -19 * M;
const DS = 8 * M;
const EYE = 1.6 * M;
const KS0 = 0.66;
/** the people's ground line at f0 (screen, after the clip's 190 px shift) and the push's fixed point */
const GY0 = 1235;
const FY = 700;
const PUSH = 1.14;
const pushE = (f: number) => {
  const u = clamp01(f / (DURATION - 1));
  return 0.85 * (1 - Math.pow(1 - u, 1.8)) + 0.15 * u;
};
export const camAt = (f: number): TrackCam => {
  const e = pushE(f);
  const r = Math.exp(Math.log(PUSH) * e);
  return paddockCam({ x: lerp(0, -30, e), ks: KS0 * r, Ds: DS, eye: EYE, gy: FY + (GY0 - FY) * r, lane: ZP });
};

// --- the argument ------------------------------------------------------------------------------------------------------
const KEYS_A: BossKey[] = [
  { f: 0, pose: "jab", face: 1 },
  { f: 30, pose: "fold", face: 1, dur: 10 },
  { f: 60, pose: "plead", face: 1, dur: 10 },
  { f: 86, pose: "jab", face: 1, dur: 8 },
  { f: 102, pose: "handsUp", face: 1, dur: 7 },
  { f: 118, pose: "jab", face: 1, dur: 8 },
];
const KEYS_B: BossKey[] = [
  { f: 0, pose: "fold", face: -1 },
  { f: 31, pose: "jabHigh", face: -1, dur: 10 },
  { f: 60, pose: "fold", face: 1, dur: 10 },
  { f: 86, pose: "jabHigh", face: -1, dur: 9 },
  { f: 102, pose: "fold", face: -1, dur: 7 },
];

/** B steps off to his right as he turns away (f60-70) and stays there when he turns back: hands never touch a face */
const stepB = (f: number) => 90 * ss(60, 71, f);

const TwelveMonthShow: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const s = calAt(S);
  const snow = snowAt(S);
  const sun = ss(4.3, 5.3, s) * (1 - ss(7.6, 8.6, s));
  return (
    <TrackStage S={S} cam={cam} v={0}>
      <OneShowScene
        cam={cam}
        z={ZP}
        S={S}
        s={s}
        sAt={calAt}
        first={0}
        turns={turnsAt(S)}
        snow={snow}
        sun={sun}
        bossA={bossAt(KEYS_A, S, 5, snow.people)}
        bossB={bossAt(KEYS_B, S, 6, snow.people)}
        stepB={stepB(S)}
        opAim={-2 + 1.2 * Math.sin(S * 0.06)}
        mid={<SnowFlurry cam={cam} z={ZP + 0.8 * M} S={S} start={SNOW_START} rate={1.4} v={40} r={12} seed={3} />}
      />
      <SnowFlurry cam={cam} z={ZP - 1.4 * M} S={S} start={SNOW_START + 2} rate={1.1} v={48} r={15} seed={17} />
    </TrackStage>
  );
};

export default TwelveMonthShow;
export { SHOW };
