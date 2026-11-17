// ---------------------------------------------------------------------------
// MonthsAhead (paul-twelve-hours, cut 41, S5). Paul world, look C "Graphite air" (paulWorld / paulWorldSets), on the
// Dwarkesh 3D style's craft (styles/dwarkesh-3d.md). Opaque 1080x1920, 23.976 fps, 108 frames.
// The MASTER of the race ruler: its camera keys and end state live in raceState.ts (S6 opens on it, S7 returns).
//
// CHECK LINE: "the debate is over how many months the US leads."
//
// THE LINE: "People often debate, are we eight months ahead of China or 12 months ahead of China or six months ahead
// of China?"
// WORD -> FRAME (Whisper, cut f0 = 41.083 s; true onsets ~5-9 f later): People -4 · often 2 · debate 8 · are 15 ·
// we 18 · eight 21 · months 32 · ahead 35 · of 39 · China 43 · or 48 · 12 58 · months 63 · ahead 68 · of 71 ·
// China 74 · or 80 · six 84 · months 87 · ahead 91 · of 94 · China? 97 · In 104
// DURATION: the slot 41.083 -> 45.587 s = 4.504 s x 23.976 = 108 frames (f0..f107).
//
// THE MOTION: open close on the US flag token on its orange stack (month 0), the camera already pulling back and
// swinging round to a side three-quarter of the ruler (f-12..40) while China's token glides in out of the far haze
// along its lane, landing at 8 on "eight" (f31). The gap bracket draws from the US to China (f27-40) and its plate
// slides up onto it ("8 / MONTHS?", legible f42). On "ahead of China" the frame widens to 0..12 (f36-60) so that on
// "12" China visibly slides back to 12 (f54-69): the bracket stretches with it, the plate flips over its long axis
// to "12 / MONTHS?" (f56-69) and a dashed ghost ring draws where it stood at 8. On "six" the camera pushes onto the
// 0..6 stretch (f74-100) as China slides forward to 6 (f80-95), the plate flips to "6 / MONTHS?" (f82-95) and a
// ghost ring draws at 12; then a slow creep on (still moving at f107: S6 continues it). Living drift throughout.
// Orange = the American labs' algorithmic secrets (the US token's stack); dashed = not real (where China might be).
// CAUSE -> EFFECT: the bracket's far end rides China's puck every frame (to = China's month); each ghost ring is
// drawn as China's puck slides off that spot (derived from China's month); the plate stands on the bracket at 0.41 of
// the gap and changes its label only by a flip, its hidden face swapping while it faces away.
//
// DEPTH: metres, the ruler along -z (month m at z = -m * 0.5); camera keys in raceState.ts: start dist 12.8 at yaw -42
// / pitch 14 on the US token, the 8-frame dist 20.6 yaw -58 pitch 20, the 12-frame dist 28.4, the 6-frame dist 16.4
// (creeping on toward 15.6). Fog near 22 / far 54. The plate is kept at >= 48.5 px caps (raceState makeFlipPlate);
// side view chosen so the plate stands between the two poles at 6 months.
//
// SOURCES: none (the speaker's own range of estimates; no figures beyond his words).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { PaulStage, ease01, living, mix, orbitCam, clamp01, type WorldSpec } from "./paulWorld";
import { RULER, makeFlagToken, makeGapBracket, makeGhostRing, makeOrangeStack, makeRuler, monthZ, yawTo } from "./paulWorldSets";
import { RACE, makeFlipPlate, raceTrack } from "./raceState";

export const FPS = 24000 / 1001;
export const DURATION = 108;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- the beats (cut frames) -----------------------------------------------------------------------------------------
const CN_IN = [0, 31] as const; // glides in from month 16 to 8 ("eight" true ~f27-30)
const CN_BACK = [54, 69] as const; // 8 -> 12 ("12" true ~f63-67)
const CN_FWD = [80, 95] as const; // 12 -> 6 ("six" true ~f89-93)
const BR_DRAW = [27, 40] as const;
const PLATE_RISE = [33, 46] as const;
const FLIP1 = [56, 69] as const;
const FLIP2 = [82, 95] as const;

/** China's month at frame f */
export const cnMonth = (f: number) => {
  let m = mix(16, 8, ease01(CN_IN[0], CN_IN[1], f));
  m += 4 * ease01(CN_BACK[0], CN_BACK[1], f);
  m -= 6 * ease01(CN_FWD[0], CN_FWD[1], f);
  return m;
};

const E = RACE.end;
const SPEC: WorldSpec = {
  fog: RACE.spec.fog,
  light: RACE.spec.light,
  build: (w) => {
    makeRuler(w);
    const sUS = makeOrangeStack(w, { lane: RULER.LANE.us });
    const fUS = makeFlagToken(w, { kind: "us" });
    const fCN = makeFlagToken(w, { kind: "cn" });
    const g8 = makeGhostRing(w, { lane: RULER.LANE.cn });
    const g12 = makeGhostRing(w, { lane: RULER.LANE.cn });
    const br = makeGapBracket(w, { y: E.bracket.y });
    const plate = makeFlipPlate(w, { labels: E.plate.labels, capH: E.plate.capH, stem: E.plate.stem, tilt: E.plate.tilt, minPx: E.plate.minPx });
    return (f, cam) => {
      const cn = cnMonth(f);
      sUS.update({ month: E.us.month, cards: E.us.stackCards });
      fUS.update({ month: E.us.month, y: sUS.topY(), yaw: yawTo(cam, [RULER.LANE.us, 1, monthZ(E.us.month)]) + E.us.flagYawOff, wave: f + E.us.waveOff });
      fCN.update({ month: cn, y: RULER.TOP, yaw: yawTo(cam, [RULER.LANE.cn, 1, monthZ(cn)]) + E.cn.flagYawOff, wave: f + E.cn.waveOff });
      // ghost rings: drawn as China's puck slides off the spot (a puck is 0.84 months across)
      const s8 = f < CN_BACK[0] ? 0 : f >= CN_FWD[0] ? 1 : clamp01((cn - 8.2) / 2.2);
      const s12 = f < CN_FWD[0] ? 0 : clamp01((11.8 - cn) / 2.2);
      g8.update({ month: 8, show: s8 });
      g12.update({ month: 12, show: s12 });
      // the bracket: from the US (month 0) to China's puck, drawn from the US end
      br.update({ from: 0, to: cn, draw: ease01(BR_DRAW[0], BR_DRAW[1], f), show: f >= BR_DRAW[0] ? 1 : 0, label: "", dashed: false });
      const mid: [number, number, number] = [RULER.LANE_LINE, E.bracket.y, monthZ(cn * E.plate.frac)];
      plate.update({
        at: mid,
        cam,
        yaw: yawTo(cam, mid),
        rise: ease01(PLATE_RISE[0], PLATE_RISE[1], f),
        flip: ease01(FLIP1[0], FLIP1[1], f) + ease01(FLIP2[0], FLIP2[1], f),
      });
    };
  },
};

const MonthsAhead: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = orbitCam(living(raceTrack(f), f));
  return <PaulStage spec={SPEC} cam={cam} frame={f} />;
};
export default MonthsAhead;
