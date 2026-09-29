import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, DARK, INK, FrontHatch, KoreaPage, Parallel38, WorldSvg, dotScreen, smoothstep } from "./koreaShared";
import { DURATION, FPS, camAt, frontAtF, kpaDotsAt, rokDotsAt } from "./twosomeMotion";

// ---------------------------------------------------------------------------
// Twosome: Sarah Paine, "Both sides overreached in Korea", cut 1 (2_Twosome.mov).
//   "and he thinks if it's just a twosome that he can win that thing"
// "He" is Kim Il Sung. Dwarkesh map style on the shared 1950 Korea world
// (koreaShared.tsx). Opaque, 1080x1920, 24 fps, muted.
//
// IN-POINT 2.140 s = f0. Speech 3.699 s: DURATION = round(3.699 x 24) + 16 =
// 89 + 16 = 105 frames. Word onsets (frames from f0):
//   and he 0 · thinks 14 · if 24 · it's 32 · just a 36 · twosome 44 · that 60 ·
//   he can 62 · win 69 · that 73 · thing 79
//
// ORANGE = THE OVERREACH: here, Kim Il Sung's North and its army. Everything
// else is cream (the South's army, the 38th) or plain umber land (the
// neighbours). No labels at all: she names nobody inside this cut.
//
// THE GESTURES, each with its word (motion in twosomeMotion.ts):
//   1. "and he thinks" f0-20: open on the peninsula itself (k 2.30, its axis
//      near x 540, the 38th on y ~865), creeping in. The North is orange
//      hatch at 0.3 and strengthens to full by f20, so orange is defined
//      first. Its army (KPA, 135,000 / 3,000 = 45 orange dots) masses onto
//      the dashed 38th: its band's gap to the line closes 31 -> 5 world px
//      (f4-30).
//   2. "just a twosome" f26-58: the second party arrives. The ROK army
//      (98,000 / 3,000 = 33 cream dots), a band just south of the line, each
//      dot on its own staggered fade + a 16 px approach from the south over
//      land (starts f26-40, 12 f each), and the 38th brightens a rung
//      (INK_LO -> INK_HI, f30-50). On "twosome" (f44) the frame is the pair:
//      k 2.49, the 38th on y ~776, the peninsula across the width.
//   3. "he can win that thing" f57-104: the orange crosses the line and rolls
//      south through the REAL dated fronts (25 Jun -> 28 Jun Seoul -> 5 Jul
//      Osan -> 20 Jul Taejon -> 4 Aug Pusan Perimeter), one C1 morph
//      (frontThrough) on a monotone-cubic clock with a key per dated front,
//      each interval given frames in proportion to how far that front
//      travels: 28 Jun on "he can" (f63), 5 Jul on "win" (f69.5), 20 Jul
//      just after "thing" (f81), the south-west swept and the perimeter's
//      line reached ~f100, pressing into it to f104. The hatch fills behind
//      the front; its dashed edge fades in as it leaves the 38th (f55-63).
//      The 38th is swallowed wherever the hatch passes over it (geometry, not
//      a timer).
//   THE ARMIES (the Korea clip's one army look, after cut 4's reuniteMotion):
//      even blue-noise bands of constant depth hugging the front on their own
//      side, depth and spacing solved per frame from the land they stand on,
//      carried with the front, relaxed, then gaussian-smoothed in time. Orange
//      behind the front, cream ahead of it; as the front closes on the
//      perimeter the cream is drawn into the Pusan pocket and becomes an even
//      blue-noise fill of it (all 33 dots inside the perimeter). Dot = cut 4's
//      (dotScreen(k), dark rim 1.6 px at 0.6).
//   4. THE CAMERA, one authored C1 track (integrals of cosine-tapered
//      velocity bumps): creep-in f-12..62 (k 2.30 -> 2.50); one glide
//      south-east with the front f32-80 onto the pocket, k -> ~2.62, the
//      pocket's middle on (540, ~835), landed ~f76 (< 2.5 px/f; 3-5 f before
//      "thing"); a creep f58-150 (k x1.05, drifting south-east with the press)
//      still moving on f104 (1.4 px/f).
//
// LAST FRAME (f104): the North's orange hatch down to the Pusan Perimeter
// (FRONT_4AUG exactly), the 45 orange dots in a band on the perimeter's outer
// side, the 33 cream dots filling the pocket. Camera CAM_END: cx 654.36,
// cy 998.12, k 2.679.
// MEASURED (scratchpad twosomeCheck.ts): camera peak 25.0 px/f over the frame
// (y150-1150), |dv| 1.98 px/f^2; on-screen dots <= 40.6 px/f, |dv| <= 18.7
// px/f^2 (one straggler, f94; 30 dot-frames > 10 of ~7,000), spacing >= 1.18
// diameters, never at sea, never on the wrong side of the front; front edge
// <= 45.7 px/f vs the map, 41.7 on screen; lowest dot y 1090.
//
// SOURCES: fronts and strengths in korea1950Fronts.ts (Appleman, "South to
// the Naktong, North to the Yalu", CMH 1961: maps and ch. II: NKPA ~135,000,
// ROK Army ~98,000 on 25 Jun 1950).
// ---------------------------------------------------------------------------

export { DURATION, FPS };

export const schema = z.object({
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---------------------------------------------------------------------------
const Twosome: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const front = frontAtF(frame);
  const k = cam.k;

  // 1. the North's hatch strengthens; its edge appears as it leaves the 38th
  const hatchOp = 0.3 + 0.7 * smoothstep(frame / 20);
  const edgeOp = smoothstep((frame - 55) / 8);
  // 2. the 38th brightens a rung as the second party arrives
  const bright = smoothstep((frame - 30) / 20);

  // the armies (cut 4's dot: dotScreen(k) diameter, dark rim 1.6 px at 0.6)
  const r = dotScreen(k) / 2 / k;
  const dot = (d: { id: number; x: number; y: number; op: number }, fill: string) =>
    d.op > 0.002 ? (
      <circle
        key={d.id}
        cx={d.x}
        cy={d.y}
        r={r}
        fill={fill}
        fillOpacity={d.op}
        stroke={DARK}
        strokeOpacity={0.6 * d.op}
        strokeWidth={1.6 / k}
      />
    ) : null;

  return (
    <KoreaPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <FrontHatch front={front} side="north" cam={cam} opacity={hatchOp} edgeOpacity={edgeOp} id="north" />
        <Parallel38 cam={cam} swallowedBy={front} side="north" bright={bright} />
        <g>{rokDotsAt(frame, k).map((d) => dot(d, INK))}</g>
        <g>{kpaDotsAt(frame, k).map((d) => dot(d, ACCENT))}</g>
      </WorldSvg>
    </KoreaPage>
  );
};

export default Twosome;
