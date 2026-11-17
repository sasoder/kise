// ---------------------------------------------------------------------------
// TwelveHoursAhead (paul-twelve-hours, cut 46, S6). Paul world, look C "Graphite air" (paulWorld / paulWorldSets), on
// the Dwarkesh 3D style's craft (styles/dwarkesh-3d.md). Opaque 1080x1920, 23.976 fps, 63 frames.
// Continues the race ruler of S5 (MonthsAhead, read-only): opens pixel for pixel on S5's last frame (raceState.ts).
//
// CHECK LINE: "the real lead is practically nothing."
//
// THE LINE: "In reality, we're 12 hours ahead of China, right? Because if"
// WORD -> FRAME (Whisper, cut f0 = 46.505 s; true onsets ~5-9 f later): we're -4 · 12 2 · hours 6 · ahead 15 · of 27 ·
// China, 31 · right? 41 · Because 49 · if 57
// DURATION: the slot 46.505 -> 49.132 s = 2.627 s x 23.976 = 63 frames (f0..f62).
//
// THE MOTION: S5's end (China at 6, "6 / MONTHS?", ghost rings at 8 and 12) with S5's creep still running. On
// "12 hours" (true ~f8-12) ONE eased lobe: China's token rushes forward along its lane to just behind the US token
// (f8-28) while the camera swings round from S5's side view to a low front view and pushes onto the two tokens
// (f0-28, leading China, so China's far flag passes behind the US pole while the US flag is edge-on, f12-15); they end
// side by side with a sliver of ruler between them. The bracket's far end rides China's puck and shrinks to a tiny
// span; the plate rides the bracket's middle, its stem growing out of the bracket to lift it over the US token's puck
// (derived from China's month), and flips "6 / MONTHS?" -> "12 / HOURS" (f9-22, the S5 flip).
// The US flag turns in the gust about its pole (f4-24) to fly left, so the two flags fly apart. Living drift and
// waving flags to f62. The ghost rings stay where they were, far back on China's lane.
// Orange = the American labs' algorithmic secrets (the US token's stack); dashed = not real (the old guesses).
// CAUSE -> EFFECT: the bracket's far end = China's month every frame; the plate's seat = the bracket's middle; the stem
// grows as the gap closes (lift from China's month), so the plate is up before China's pole reaches it.
//
// DEPTH: metres, the ruler along -z (month m at z = -m * 0.5). Camera: S5's raceTrack(107 + f) blended (one lobe,
// f0-28) into the end orbit {target [0, 0.4, -0.1], dist 14, yaw 0, pitch 11, fov 26}; living(o, 107 + f). End: both
// flags ~300 px wide, the plate caps ~51 px; fog near 22 / far 54 (RACE.spec). China ends at month 0.6 (its pole 0.3 m
// behind the US pole: the plate stands between the two poles in depth, in front of China's, behind the US's).
//
// SOURCES: none (the speaker's own figure; "12 HOURS" is his words, no other figures on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { C, D2R, PaulStage, clamp01, ease01, lobe, living, mix, orbitCam, type Orbit, type V3, type WorldSpec } from "./paulWorld";
import { RULER, makeFlagToken, makeGapBracket, makeGhostRing, makeOrangeStack, makeRuler, monthZ, yawTo } from "./paulWorldSets";
import { RACE, makeFlipPlate, raceTrack } from "./raceState";

export const FPS = 24000 / 1001;
export const DURATION = 63;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const E = RACE.end;
/** S5's last frame: this cut's f0 is that frame (camera, living drift, waves, air all continue on F0 + f) */
const F0 = E.frame;
// the join: S5's track at its last frame is the end orbit it exports (assert at module load)
{
  const a = raceTrack(F0);
  const b = E.cam;
  const d = Math.abs(a.dist - b.dist) + Math.abs(a.yaw - b.yaw) + Math.abs(a.pitch - b.pitch) + Math.abs(a.fov - b.fov) + a.target.reduce((s, v, i) => s + Math.abs(v - b.target[i]), 0);
  if (d > 1e-9 || E.cn.month !== 6 || E.ghosts[0] !== 8 || E.ghosts[1] !== 12) throw new Error("TwelveHoursAhead: S5 end state changed; re-check the join");
}

// ---- the beats (cut frames) -----------------------------------------------------------------------------------------
const RUSH = [8, 28] as const; // China 6 -> CN_END ("12 hours" true ~f8-15)
const CN_END = 0.6;
const CAM = [0, 28] as const; // the swing and push (one lobe; leads China so China's token is already to the right when it rushes in)
const FLIP = [9, 22] as const; // "6 MONTHS?" -> "12 HOURS" (done before China's pole comes near the plate)
const SWING = [4, 24] as const; // the US flag turns about its pole to fly left (edge-on at f14, when its pole crosses China's flag)
const END_CAM: Orbit = { target: [0, 0.4, -0.1], dist: 14, yaw: 0, pitch: 11, fov: 26 };
/** the plate's seat along the gap (S5: 0.41 of it) eases to its middle */
const FRAC_END = 0.5;
/** the stem's growth: from 0 while the gap is wide to LIFT once China is within CN_LIFT[1] months */
const LIFT = 0.34;
const CN_LIFT = [4.8, 2.6] as const;

/** China's month at cut frame f */
export const cnMonth = (f: number) => mix(E.cn.month, CN_END, ease01(RUSH[0], RUSH[1], f));
/** how far the plate's stem has grown out of the bracket (m), from China's month */
const liftOf = (cn: number) => LIFT * lobe(clamp01((CN_LIFT[0] - cn) / (CN_LIFT[0] - CN_LIFT[1])));

/** the camera at cut frame f (before living): S5's track continues (its creep) and blends into END_CAM in one lobe */
export const twelveTrack = (f: number): Orbit => {
  const o = raceTrack(F0 + f);
  const u = ease01(CAM[0], CAM[1], f);
  return {
    target: [mix(o.target[0], END_CAM.target[0], u), mix(o.target[1], END_CAM.target[1], u), mix(o.target[2], END_CAM.target[2], u)] as V3,
    dist: Math.exp(mix(Math.log(o.dist), Math.log(END_CAM.dist), u)),
    yaw: mix(o.yaw, END_CAM.yaw, u),
    pitch: mix(o.pitch, END_CAM.pitch, u),
    fov: mix(o.fov, END_CAM.fov, u),
  };
};

const SPEC: WorldSpec = {
  fog: RACE.spec.fog,
  light: RACE.spec.light,
  build: (w) => {
    // the same build order as S5 (same objects, same seeds), so f0 is S5's last frame
    makeRuler(w);
    const sUS = makeOrangeStack(w, { lane: RULER.LANE.us });
    const fUS = makeFlagToken(w, { kind: "us" });
    const fCN = makeFlagToken(w, { kind: "cn" });
    // the flags draw after the plate (renderOrder 2-3), so the plate in front of China's flag corner also hides it in
    // the true-colour pass (which tests against the depth written so far)
    [fUS.group, fCN.group].forEach((g) => g.traverse((o: { isMesh?: boolean; renderOrder: number }) => o.isMesh && (o.renderOrder = 4)));
    const g8 = makeGhostRing(w, { lane: RULER.LANE.cn });
    const g12 = makeGhostRing(w, { lane: RULER.LANE.cn });
    const br = makeGapBracket(w, { y: E.bracket.y });
    // S5's plate with one more label: the widest label is still "MONTHS?", so the plate is the same size
    const plate = makeFlipPlate(w, { labels: [...E.plate.labels, ["12", "HOURS"]], capH: E.plate.capH, stem: E.plate.stem, tilt: E.plate.tilt, minPx: E.plate.minPx });
    // the stem's growth below the plate's own stem: the same cream post, from the bracket rod up to the plate
    const post = w.K.box([0.05, 1, 0.05], w.K.clay(C.cream, { mottle: false }), [0, 0, 0], { r: 0.02 });
    return (gf, cam) => {
      const f = gf - F0;
      const cn = cnMonth(f);
      sUS.update({ month: E.us.month, cards: E.us.stackCards });
      const swing = -144 * ease01(SWING[0], SWING[1], f); // -18 -> -162: the mirror of S5's turn, flying left
      fUS.update({ month: E.us.month, y: sUS.topY(), yaw: yawTo(cam, [RULER.LANE.us, 1, monthZ(E.us.month)]) + E.us.flagYawOff + swing, wave: gf + E.us.waveOff });
      fCN.update({ month: cn, y: RULER.TOP, yaw: yawTo(cam, [RULER.LANE.cn, 1, monthZ(cn)]) + E.cn.flagYawOff, wave: gf + E.cn.waveOff });
      g8.update({ month: E.ghosts[0], show: 1 });
      g12.update({ month: E.ghosts[1], show: 1 });
      br.update({ from: E.us.month, to: cn, draw: 1, show: 1, label: "", dashed: false });
      const frac = mix(E.plate.frac, FRAC_END, ease01(RUSH[0], RUSH[1], f));
      const lift = liftOf(cn);
      const seat: V3 = [RULER.LANE_LINE, E.bracket.y + lift, monthZ(cn * frac)];
      const yaw = yawTo(cam, [RULER.LANE_LINE, E.bracket.y, seat[2]]);
      plate.update({ at: seat, cam, yaw, rise: 1, flip: E.plate.flip + ease01(FLIP[0], FLIP[1], f) });
      post.visible = lift > 0.002;
      post.scale.set(1, lift + 0.02, 1);
      post.position.set(seat[0], E.bracket.y + lift / 2 - 0.01, seat[2]);
      post.rotation.y = yaw * D2R;
    };
  },
};

const TwelveHoursAhead: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = orbitCam(living(twelveTrack(f), F0 + f));
  return <PaulStage spec={SPEC} cam={cam} frame={F0 + f} />;
};
export default TwelveHoursAhead;
