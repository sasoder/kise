// ---------------------------------------------------------------------------
// FactionsUnite (Sarah Paine, "How the Depression pushed Japan to Pearl
// Harbor", cut D). Dwarkesh map style on the kit's ASIA world (pearlShared /
// pearlAsiaMapData, imported read-only). Opaque 1080x1920, 24 fps.
//
// CHECK LINE: "China's feuding armies stopped fighting each other and turned,
// together, to face Japan."
//
// THE LINE (local frames, 24 fps): And 0 · the 8 · many 21 · bickering 25 ·
//   factions 37 · of 48 · China 57 · stopped 65 · fighting 73 · each 82 ·
//   other 88 · because 95 · they 100 · understood 103 · that 114 · Japan 118 ·
//   poses 124 · existential 139 · threat 151 (cut back to the speaker at 167).
// DURATION: the slot is 00:00:58:14 - 00:01:05:13 = frames 1406-1573 = 167
//   frames, + 12 frames of living tail = 179.
//
// THE ONE MOTION (crowd language: marks/dots = armies; cream = China,
// orange = Japan):
//   Japan's occupied east (OCCUPIED_1938 to the stalled 1938-39 front, with
//   Manchukuo and the 1931 empire) is solid orange hatch from frame 0. Across
//   free China stand seven separate cream armies, each in its own mark (same
//   cream, same stroke weight): the Ma clique diamonds (NW, alone), Shanxi
//   squares pressed against the Communist crosses (N), Sichuan triangles
//   pressed against Yunnan's times-marks (W/SW), the Nationalist rings (the
//   biggest, centre-east) pressed against Guangxi's dashes (S). Each pressed
//   pair meets on a short contact line and shoves: one side surges in among
//   the other's front rows, the other pushes back, ~1 s a push, alternating
//   ("bickering factions", f0-60; CHINA lands on its word, f57, in the open
//   middle). On "stopped fighting each other" the shoving dies (f60-74) and
//   the pairs let go and step apart, gaps opening on every contact line
//   (f60-86), all before anyone turns. Then the armies move off toward the
//   orange (f88-94, the farthest first, "because they understood"): each
//   draws out into a stream at constant march speed, keeping its spacing,
//   bending round the CHINA label and never entering the orange; as each
//   mark reaches the front it contracts into the one shared filled dot, so
//   the differences dissolve into ONE continuous cream band of even depth
//   (5 rows) along the whole front, Mongolian border to Hangzhou bay, facing
//   the orange (every army home f144-148). JAPAN (orange) lands on the
//   occupied north on its word, f118. The camera pushes in slowly through
//   the opening, then makes one gentle move east with the streams (k 2.86 ->
//   2.56) to frame the whole band with margin; the last ~20 frames hold it,
//   the band shuffling faintly. No battle is shown.
//
// FACTS: the factions and their 1936-37 seats are the kit's (approximate).
// The Nationalists' (Nanjing-Wuhan) and Shanxi's (Taiyuan) seats were
// occupied by 1938-39, so they stand in free China next to them (west of
// Wuhan; just west of the Yellow River). The pressed pairs are plausible
// rivals, not one dated clash each: Shanxi vs the Communists (fighting in
// 1939), the Nationalists vs Guangxi (the 1929-30 war, the 1936 Liangguang
// incident), Sichuan vs Yunnan (the warlord wars of the 1910s-20s); each
// partner is pulled toward the other along the line between their seats.
// Crowd sizes are not strengths: only the Nationalists are the biggest. The
// marks identify factions, nothing more. Which faction ends on which stretch
// of the band is chosen so streams do not cross. The front is the kit's
// FRONT_1938 (approximate, see PEARL_KIT_READY.md). The band stands for the
// Second United Front (after the Xi'an Incident, Dec 1936, and full war, 1937).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, Hatch, INK, Label, MapPage, SHADOW, WorldSvg, runCamera } from "./pearlShared";
import { JAPAN_1931, MANCHUKUO, OCCUPIED_1938 } from "./pearlAsiaMapData";
import { CAM_KEYS, CHINA_AT, CHINA_IN, CROWD_MARKS, DOT_R, DURATION, FPS, JAPAN_AT, JAPAN_IN, N, crowdOf, dotsAt, morphAt, type Mark } from "./factionsUniteMotion";

export { DURATION, FPS };

export const schema = z.object({
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

export const camAt = (f: number) => runCamera(CAM_KEYS, f);

// ---------------------------------------------------------------------------
// THE MARKS: each faction's own cream mark, all drawn as bold strokes of one
// weight (MARK_W) at one size (MARK_R), cream at 0.88: diamond, square, plus, triangle, ring,
// times, dash (the dash a touch heavier, it has the least ink). As a dot
// reaches the band (morph 0 -> 1) its mark contracts to its centre while its
// stroke thickens, and it ends as the band's one filled dot (radius DOT_R):
// the ink gathers in, nothing fades.
// ---------------------------------------------------------------------------
const MARK_R = DOT_R * 1.35;
const MARK_W = 0.45 * DOT_R;
/** the marks' cream is a touch under full (0.88), rising to full as they become the band's dots */
const MARK_OP = 0.88;
type Sub = { pts: [number, number][]; closed: boolean };
const poly = (pts: [number, number][], closed = true): Sub => ({ pts, closed });
const SHAPES: Record<Mark, { subs: Sub[]; w: number }> = {
  diamond: { subs: [poly([[0, -0.95], [0.95, 0], [0, 0.95], [-0.95, 0]])], w: 1 },
  square: { subs: [poly([[-0.7, -0.7], [0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]])], w: 1 },
  plus: { subs: [poly([[-0.9, 0], [0.9, 0]], false), poly([[0, -0.9], [0, 0.9]], false)], w: 1.15 },
  triangle: { subs: [poly([[0, -0.92], [0.86, 0.6], [-0.86, 0.6]])], w: 1 },
  ring: { subs: Array.from({ length: 1 }, () => poly(Array.from({ length: 20 }, (_, i) => [0.76 * Math.cos((i / 20) * 6.2832), 0.76 * Math.sin((i / 20) * 6.2832)] as [number, number]))), w: 1 },
  times: { subs: [poly([[-0.68, -0.68], [0.68, 0.68]], false), poly([[-0.68, 0.68], [0.68, -0.68]], false)], w: 1.15 },
  dash: { subs: [poly([[-0.92, 0], [0.92, 0]], false)], w: 1.7 },
};
/** the mark's path at (x, y), contracted by morph m (1 = a point) */
const markD = (mark: Mark, x: number, y: number, m: number) => {
  const sc = MARK_R * (1 - m);
  let d = "";
  for (const sub of SHAPES[mark].subs) {
    sub.pts.forEach(([u, v], i) => {
      d += `${i ? "L" : "M"}${(x + u * sc).toFixed(2)},${(y + v * sc).toFixed(2)}`;
    });
    if (sub.closed) d += "Z";
  }
  return d;
};
/** stroke width of the mark at morph m: its own weight -> the band dot's diameter */
const markW = (mark: Mark, m: number) => MARK_W * SHAPES[mark].w * (1 - m) + 2 * DOT_R * m;

const FactionsUnite: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const { xs, ys } = dotsAt(frame);
  const ms = morphAt(frame);
  const casing = 1.4 / cam.k;
  const under: React.ReactNode[] = [];
  const over: React.ReactNode[] = [];
  for (let k = 0; k < N; k++) {
    const m = ms[k];
    if (m > 0.985) {
      under.push(<circle key={k} cx={xs[k]} cy={ys[k]} r={DOT_R + casing / 2} fill={SHADOW} />);
      over.push(<circle key={k} cx={xs[k]} cy={ys[k]} r={DOT_R} fill={INK} />);
      continue;
    }
    const mark = CROWD_MARKS[crowdOf(k)];
    const d = markD(mark, xs[k], ys[k], m);
    const w = markW(mark, m);
    under.push(<path key={k} d={d} strokeWidth={w + casing} />);
    over.push(<path key={k} d={d} strokeWidth={w} strokeOpacity={MARK_OP + (1 - MARK_OP) * m} />);
  }
  return (
    <MapPage world="asia" cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <Hatch region={JAPAN_1931} cam={cam} id="fu-j31" />
        <Hatch region={MANCHUKUO} cam={cam} id="fu-mk" />
        <Hatch region={OCCUPIED_1938} cam={cam} id="fu-occ" />
        <g fill="none" stroke={SHADOW} strokeOpacity={0.6} strokeLinecap="round" strokeLinejoin="round">
          {under}
        </g>
        <g fill="none" stroke={INK} strokeLinecap="round" strokeLinejoin="round">
          {over}
        </g>
        <Label x={CHINA_AT[0]} y={CHINA_AT[1]} text="CHINA" appear={CHINA_IN} frame={frame} cam={cam} />
        <Label x={JAPAN_AT[0]} y={JAPAN_AT[1]} text="JAPAN" appear={JAPAN_IN} frame={frame} cam={cam} color={ACCENT} />
      </WorldSvg>
    </MapPage>
  );
};

export default FactionsUnite;
