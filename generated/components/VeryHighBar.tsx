import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BG_DIM } from "./fieldShared";
import {
  AirgapFrame,
  CAM_TARGET_BASE,
  camOf,
  dampTrack,
  glideTarget,
  type Glide,
} from "./airgapShared";

// ---------------------------------------------------------------------------
// Noam_Airgapping, film B, cut 6 — `58_VeryHighBar`, in 0:58.559 (G0 = 0).
// "you have to have a very, very, very high bar. You could even go as far as to
//  say, like, 'well, we should, like, air-gap the computers,'"
// SRT span 58.559 -> 64.659 s. DURATION = round(6.100 * 24) = 146 speech + 16
// tail = 162. Global G = frame (G0 0).
// Words (G): have-a 8 · very 23 · very 34 · very 40 · high 44 · bar 50 · you 58 ·
// could 61 · even 67 · go-as 71 · far-as 77 · to-say 82 · like 85 · well 91 ·
// we 100 · should 103 · like 108 · air 113 · gap 120 · the 124 · computers 133.
//
// GESTURES (world in airgapShared; every one with its word):
//  1. f0 on    the pair joined by a white cable with a mated coupler in the
//              middle; orange packets run both ways (the AI's traffic) — alive
//              from the first frame.
//  2. f6-51    "have a very, very, very high bar": the white bar fades in rising
//              above the pair (f6-16) and rises as ONE continuous motion with
//              three kicks landing on each "very" (f24, f35, f41) and a big rise
//              over "high bar" ending ~f51 at world y -435 (835 px above the
//              start). The dashed height guide rides it from the pair's top.
//  3. f12-58   camera: a gentle lean back under the kicks (f12-42) so each kick
//              reads as a rise in frame, overlapped by the catch (f30-56, k 1.06
//              -> 0.75): the big rise nearly escapes the top (bar crest y 71 at
//              f50), the camera catches it with the pair small at the bottom —
//              the "oh". Held breath ~f56-62.
//  4. f60-102  "You could even go as far as to say, like": the camera glides back
//              down and in to the computers (k 0.75 -> 1.06); the bar leaves the
//              top of frame; the guide retracts up into the bar f64-94.
//  5. f82-109  the packet stream stops (last launch f82, the wire is empty by
//              f107) — "well, we should".
//  6. f101-107 "should": the coupler pops apart (each plug 14 px, ease-out).
//  7. f106-121 "like, air": each cable half reels back into its own computer.
//  8. f108-131 "gap the computers": the towers slide apart, gap 200 -> 330; the
//              camera eases out with them (k 1.06 -> 0.957, onto the label, f104-134).
//  9. f114-125 the AIR GAP dimension marker (ticks off the inner walls, dashed
//              span, dashes marching) with its label sliding up, landing f125.
// 10. f138-161 tail: the long slow tilt down to the chip axis begins (carried into the extra and cut 7); pins tick with compute.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const G0 = 0;
export const DURATION = 162; // 146 + 16
export const SPEECH_END = 146;

export const GLIDES: Glide[] = [
  { a: 12, b: 42, dk: -0.07, dy: -110 }, // a gentle lean back under the three kicks
  { a: 30, b: 56, dk: -0.24, dy: -232, warp: 0.8 }, // catching the big rise
  { a: 60, b: 102, dk: 0.31, dy: 342, warp: 0.85 }, // back down to the computers
  { a: 104, b: 134, dk: -0.103, dy: -42 }, // out with the slide, onto the AIR GAP label
  { a: 138, b: 330, dk: 0.01, dy: 80 }, // one long slow tilt down to the chip axis (into the extra and cut 7)
];

export const TARGET = glideTarget(CAM_TARGET_BASE, GLIDES);
export const TABLE = dampTrack(TARGET, G0, G0 + DURATION + 2);
export const CAM = camOf(TABLE, G0);
/** the grid's rest point for the whole film */
export const REST = { cx: TABLE[0].cx, cy: TABLE[0].cy };

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

const VeryHighBar: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const G = G0 + frame;
  return <AirgapFrame G={G} cam={CAM(G)} rest={REST} {...p} />;
};

export default VeryHighBar;
