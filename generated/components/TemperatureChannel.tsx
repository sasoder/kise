import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BG_DIM } from "./fieldShared";
import { AirgapFrame, assertJoin, camOf, dampTrack, glideTarget, type Glide } from "./airgapShared";
import * as CX from "./NotSufficient";

// ---------------------------------------------------------------------------
// Noam_Airgapping, film B, cut 7 — `66_TemperatureChannel`, in 1:06.079
// (G0 = 180).
// "You know, like, there are studies, and this is mostly academic, but where you
//  can have two computers next to each other that are air-gapped, and they're
//  still able to communicate with each other because they have temperature
//  sensors, and they're able to… like, one of them is able to run their CPU
//  really hot, and then the other one can actually, like, detect the temperature
//  change, and then they can… that actually gives them a mechanism to
//  communicate."
// SRT span 66.079 -> 81.299 s. DURATION = round(15.220 * 24) = 365 speech + 16
// tail = 381 (G180-560).
// Words (G): studies 205 · academic 235 · two 271 · computers 279 · next 292 ·
// air 319 · gapped 324 · still 338 · communicate 348 · other 360 · because 364 ·
// temperature 378 · sensors 384 · one-of 412 · run 422 · cpu 435 · really 443 ·
// hot 448 · other 460 · detect 478 · temperature 490 · change 496 · and-then
// 505 · mechanism 532 · communicate 540.
//
// GESTURES (world in airgapShared; every one with its word):
//  1. f0-150   "there are studies … two computers next to each other": one
//              long slow tilt down onto the chip axis at the wide framing (the
//              glide started at G138, no hold); the shimmer withdraws by G206;
//              the pins tick with compute on both chips (the AI is running).
//  2. f132-142 "air-gapped": the AIR GAP marker brightens INK_LO -> INK_HI.
//  3. f142-174 "still able to communicate with each other": the camera leans
//              into the gap (k 0.967 -> 1.118): the windows' outer edges leave
//              frame, both chips and the gap stay in — nothing crosses. It holds
//              there, creeping down, through the heat event.
//  4. f186-199 "temperature sensors": a thermometer slides up in each window
//              against the inner wall (G366-379).
//  5. f224-268 "run their CPU really hot": left core deep -> ripe, pins lit,
//              mercury peaks on "hot"; heat wavefronts leave through its wall.
//  6. f268-316 "detect the temperature change": the arcs cross and are absorbed
//              into the right stem; its mercury rises where they hit.
//  7. f270-381 "and then they can … a mechanism to communicate": the left chip
//              pulses long/short per bit; each group lays its bit in the gap on
//              the axis where the cable ran (dash, dot, dash, dash, dot, done
//              G532); from G530 packets run along the new heat cable into the
//              right tower and the right core lights ripe (~G551). The camera
//              pulls back to the wide framing, both towers whole (G494-534),
//              and creeps; arcs keep running through the tail.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const G0 = 180;
export const DURATION = 381; // 365 + 16
export const SPEECH_END = 546;

export const GLIDES: Glide[] = [
  { a: 322, b: 354, dk: 0.151, dy: 30 }, // lean into the gap: window edges leave frame
  { a: 348, b: 500, dy: 20 }, // held breath through the heat event, creeping
  { a: 494, b: 534, dk: -0.161, dy: -85, warp: 0.85 }, // the whole bridge, at the wide framing
  { a: 530, b: 620, dk: 0.012 }, // tail creep
];
export const TARGET = glideTarget(CX.TARGET(G0), GLIDES, CX.TARGET);
export const TABLE = dampTrack(TARGET, G0, G0 + DURATION + 2, CX.TABLE[G0 - CX.G0]);
export const CAM = camOf(TABLE, G0);
export const REST = CX.REST;

assertJoin("TemperatureChannel", CX.CAM(CX.SPEECH_END), CAM(G0));

export const schema = z.object({
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
});

const TemperatureChannel: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const G = G0 + frame;
  return <AirgapFrame G={G} cam={CAM(G)} rest={REST} {...p} />;
};

export default TemperatureChannel;
