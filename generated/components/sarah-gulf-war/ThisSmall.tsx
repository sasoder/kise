// ---------------------------------------------------------------------------
// ThisSmall (sarah-gulf-war, cut 107). Dwarkesh 3D style (styles/dwarkesh-3d.md) as a FLAT 2D chart in the air, in the
// clip's death-toll chart family (gulfChart.tsx, shared with cuts 6 and 90). Opaque 1080x1920, 24 fps, 84 frames.
// It OPENS ON CUT 90's LAST FRAME EXACTLY (IraqisLost.tsx, f253): the chart is cut 90's own <IraqisChart> at its last
// frame, its camera continues from there, and the join is proved by a still-vs-still difference image.
//
// CHECK LINE: "Next to Iraq's tens of thousands, the coalition's dead are a sliver you can barely see."
//
// THE LINE: "where the death rate for one side is this small." (before it, closing cut 90: "Okay, coalition forces, 392
// total deaths.", then on the speaker: "Of those, most of them are Americans. It's 258. I don't know of any wars that have
// a million belligerents"; the speaker's figures do not match the sources, so "<400" stays the only coalition number)
// WORD -> FRAME (Whisper, ~5-9 f early): where -8 · the 3 · death 13 · rate 35 · for 41 · one 52 · side 56 · is 64 ·
// this 68 · small 71 (slot ends 84).
// DURATION: the slot 107.291667 -> 110.791667 s (00:01:47:07 - 00:01:50:19) = 3.5 s x 24 = 84 frames (f0..f83).
//
// THE MOTION: cut 90 has already revealed all three bars, "<400" and the sliver, so nothing rises here. One continuous
// camera move: cut 90 arrives still pushing in slightly, that speed eases through zero (~f10), then one slow eased
// pull-back (peaking over "death rate ... one side", landing on "this small", real ~f75, still creeping at f83) opens
// space above and at the sides of the whole chart. All three bars, their numbers and labels and the title stay fully in
// frame on every frame, so the difference in casualties is always readable, and the sliver gets SMALLER on screen as he
// says it. On "this small" its glow swells gently (f60-80, the same orange, the same gradient, no flash), the one point
// of light; to f83 it is alive (creep, sway, motes). Orange = the coalition's dead (the family's rule). No new elements.
//
// CAMERA: three channels, ln k, cx and yb (the baseline's screen y before CHART_DROP), each = its join speed fading out
// over the lobe's window + one beta-shaped velocity lobe, integrated and normalised to land at f83: ln k 1.09 -> K_LAND,
// cx -> CX_LAND (the ink's centre, so the margins come out even), yb just coasts out on its join speed (no lobe: the
// baseline holds its screen height, a hair up, never sinking). At f0 every value AND slope equals cut 90's last frame
// (slopes measured from its camAt), so the join has no velocity step. cy = BASE - (yb - 960) / k; sway and air run on
// f + AIR_FRAME_OFFSET against cut 90's REST, the chart under chartCamOf.
//
// FRAMING: world ink runs x 71 ("20,000-35,000") to 980 ("Coalition"); the name row stays above y 1250; nothing readable
// in y 1360-1460.
//
// SOURCES (COMMON.md, gulfChart FIG): Iraqi military deaths 20,000-35,000 (Wikipedia, "Gulf War", casualty estimates;
// PDA 20,000-26,000); Iraqi civilians ~3,000 (Iraqi govt 2,300; PDA 3,664); coalition deaths 292-379 by source ->
// on screen "<400", drawn at FIG.coalitionUnder = 400 x PX_PER = 8 px.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { WorldSvg, swayCam, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { ChartStage, chartAirOf, grow } from "./gulfChart";
import { AIR_FRAME_OFFSET, BAR_W, BASE, IraqisChart, K_FIN, LAST_FRAME, REST, SLOTS, camAt as camAt90, chartCamOf } from "./IraqisLost";

export const FPS = 24;
export const DURATION = 84;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** cut 90's uid: its <IraqisChart> defines the glow gradient the swell reuses */
const UID = "il";

// ---- the join: cut 90's end (asserted, so a change there fails loudly here) ----------------------------------------
const C90 = camAt90(LAST_FRAME);
if (SLOTS.coal !== 875 || BASE !== 996 || BAR_W.coal !== 140 || AIR_FRAME_OFFSET !== LAST_FRAME || Math.abs(C90.k - K_FIN) > 1e-9) {
  throw new Error("ThisSmall: cut 90 (IraqisLost) changed; re-check the join");
}
/** the baseline's screen y before CHART_DROP, from a camera */
const ybOf = (c: Cam) => 960 + (BASE - c.cy) * c.k;
const EPS = 0.001;
const CP = camAt90(LAST_FRAME - EPS);
/** cut 90's speeds on its last frame */
const V_LNK = (Math.log(C90.k) - Math.log(CP.k)) / EPS;
const V_CX = (C90.cx - CP.cx) / EPS;
const V_YB = (ybOf(C90) - ybOf(CP)) / EPS;

// ---- camera -------------------------------------------------------------------------------------------------------
const F_END = DURATION - 1;
/** a window past the last frame, so the move is still creeping at f83 */
const WIN = 100;
/** the integral of a join speed of 1 fading out as (1 - f / WIN)^2 */
const fade = (f: number) => (WIN / 3) * (1 - Math.pow(1 - f / WIN, 3));
/** a velocity lobe x^a (1-x)^b on f0..WIN, integrated (midpoint rule) and normalised to 1 at F_END */
const lobe = (a: number, b: number) => {
  const raw = (f: number) => {
    if (f <= 0) return 0;
    const n = 600;
    const h = f / n;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const x = ((i + 0.5) * h) / WIN;
      s += Math.pow(x, a) * Math.pow(1 - x, b) * h;
    }
    return s;
  };
  const norm = raw(F_END);
  return (f: number) => raw(f) / norm;
};
const P = lobe(2, 3); // peaks ~f40 ("rate"), landing on "this small"
/** a channel from x0 to x1 at f83, starting at speed v0 */
const channel = (x0: number, x1: number, v0: number, f: number) => x0 + v0 * fade(f) + (x1 - x0 - v0 * fade(F_END)) * P(f);
export const K_LAND = 0.96;
/** the ink's centre, world x 71 to 980 = 525.5, less the sway's +3 at the landing: margins land even at ~(1080 - 909 * K_LAND) / 2 */
export const CX_LAND = 523;
const LNK0 = Math.log(C90.k);
const YB0 = ybOf(C90);
export const camAt = (f: number): Cam => {
  const k = Math.exp(channel(LNK0, Math.log(K_LAND), V_LNK, f));
  const yb = YB0 + V_YB * fade(f);
  return { k, cx: channel(C90.cx, CX_LAND, V_CX, f), cy: BASE - (yb - 960) / k };
};
{
  const c = camAt(0);
  if (Math.abs(c.k - C90.k) > 1e-12 || Math.abs(c.cx - C90.cx) > 1e-12 || Math.abs(c.cy - C90.cy) > 1e-9) {
    throw new Error("ThisSmall: f0 camera differs from cut 90's last camera");
  }
}

// ---- the glow's swell ---------------------------------------------------------------------------------------------
const SWELL = [60, 20] as const; // lands f80 ("this small", real ~f75-78)

const ThisSmall: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const fa = frame + AIR_FRAME_OFFSET; // the sway, the motes and the grain carry on from cut 90
  const cam = swayCam(camAt(frame), fa);
  const A = chartAirOf(cam, REST, fa);
  const s = grow(frame, SWELL[0], SWELL[1]);
  return (
    <ChartStage A={A}>
      <WorldSvg cam={chartCamOf(cam)}>
        <IraqisChart frame={LAST_FRAME} />
        {/* the sliver's glow swelling: the bar's own halo gradient, opening a little wider and taller */}
        {s > 0 ? <ellipse cx={SLOTS.coal} cy={BASE - 4} rx={BAR_W.coal * 0.85 * (1 + 0.14 * s)} ry={38 * (1 + 0.3 * s)} fill={`url(#${UID}-glow)`} opacity={0.5 * s} /> : null}
      </WorldSvg>
    </ChartStage>
  );
};

export default ThisSmall;
