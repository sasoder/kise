import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  DARK,
  EMPIRE_BORDER_D,
  EMPIRE_BOX,
  EMPIRE_D,
  INK,
  INK_FULL,
  MapLabel,
  MapPage,
  REALM_BORDER_D,
  REALM_BOX,
  REALM_D,
  Territory,
  TownDot,
  WorldSvg,
  smoothstep,
  swayCam,
  type Cam,
  type Halo,
  type P2,
} from "./americasShared";
import { Ruler } from "./hierShared";
import { AZTEC, DURATION, FPS, INCA, PULSE_AZTEC, PULSE_INCA, T, cameraAt, frontD, linkDraw, pulsesAt, type MapTree, type PulseSpec } from "./hierV2Motion";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// HierarchicalNatureV2 (G1 of 3, the MAP take). Dwarkesh Patel with Si
// Sheppard, clip "Centralized empires fell fast". Dwarkesh map style: a real
// map (americasShared: north-up Mercator, Natural Earth land, no modern
// borders). Opaque 1080x1920, 24 fps. V1 (HierarchicalNature, the page cut)
// is untouched.
//
// THE LINE (sequence 19.311-24.316 s; f = round((t - 19.311) * 24)):
//   "The vulnerability of the Aztec, the Inca, was that hierarchical nature of
//    their society. (And...)"
//   AZTEC f31 · INCA f49 · HIERARCHICAL f70 · NATURE f81 · SOCIETY f92-101 ·
//   end f120. DURATION = round(5.005 * 24) = 120 frames, no tail.
//
// THE PICTURE: the hierarchy drawn ON the map. Each empire = its territory in
// cream hatch + a tree of cream links running from its provincial towns into
// its ONE capital, where the orange Ruler (hierShared's figure, the one G2
// opens on) stands with his feet on the capital point. CLIP RULE: orange = THE
// ONE AT THE TOP; nothing else is orange. Cream at INK_FULL / INK_CONTEXT.
//
// GESTURES (the only ones):
//   0. f0-f66    ONE camera move, already under way at f0: from the close on
//                Mesoamerica (the Aztec territory 475 px wide on (540, 800),
//                hatched at INK_CONTEXT with its province dots) it pulls back
//                and glides south-east into the wide that holds both empires
//                (Tenochtitlan (270, 440), Cuzco (786, 1076)), landing f67;
//                then only a 3 % creep (never at rest) + the house hand drift.
//   1. "Aztec" f31   AZTEC slides up from f23 just above its territory and
//                travels with the land; the hatch rises to the full rung
//                f23-f31.
//   2. "Inca" f49    the realm has entered from below; its hatch rises and
//                INCA slides up f41-f49 over the Pacific beside it.
//   3. "hierarchical nature of their society" f66-f91: in both empires at
//                once the links draw INWARD from the outermost towns to the
//                capital: one front per empire (a path distance from the
//                capital shrinking to 0, eased, never stopping), each link
//                drawing along its own length, trunks merging; a town's dot
//                rises to the full rung as the line leaves it; the hatch
//                recedes to 0.3 along each drawn link.
//   4. "society" f92  where every line meets, the orange Ruler inks in on
//                each capital f88-f97 (fade + 10 px rise).
//   5. f97-f119  hand-off: short INK_FULL dashes travel inward along the
//                links to each Ruler, each chain on its own clock; ends
//                mid-flow.
// Nothing else: no ships, no roads beyond the links, no other labels, no dates.
//
// SOURCES / WHAT IS SCHEMATIC
//   Land: Natural Earth 10m (world-atlas). No borders: none of today's existed.
//   Aztec empire 1519: scripts/cortes-geo.json (the georeferenced Commons
//     "Aztec Empire 1519 map-fr.svg"), without the Soconusco exclave, as
//     OneFellSwoop. Its tree: OneFellSwoop's Codex Mendoza province heads and
//     parents (mayaMapData), thinned to the 12 heads that stand >= 15 px apart
//     at this scale (the outermost kept first; a dropped head's children hang
//     from its nearest kept ancestor).
//   Tawantinsuyu 1532: scripts/inca-geo.json (after the Commons "Inca
//     Expansion.svg"). Capital Cuzco. Its tree: the administrative chain along
//     the royal roads of the four suyus (the director's list of towns; three
//     nearer than 14 px to their parent merged: Ollantaytambo, Paucartambo,
//     Chucuito). Santiago/Mapocho is the road's southern end, not an Inca
//     foundation by that name.
//   BOTH TREES ARE SCHEMATIC (tributary provinces / the chain along the road
//   system), drawn as straight gentle links: not roads, not a count of places,
//   not a documented chain of command.
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const LINK_PX = 3; // screen px
const CASING_PX = 2.6;
const RULER_PX = 86;
const RISE = 10;
/** marks are sized for the wide and grow as k^0.5 into the close */
const sizeAt = (px: number, k: number) => px * Math.pow(k, 0.5);

// the names: world anchors (they travel with the land) + a screen offset
const LABEL_AZTEC: P2 = [(EMPIRE_BOX.x0 + EMPIRE_BOX.x1) / 2, EMPIRE_BOX.y0];
const LABEL_INCA: P2 = [488, 944];

const TreeLayer: React.FC<{ tree: MapTree; cam: Cam; frame: number; spec: PulseSpec; seed: number; D: number }> = ({ tree, cam, frame, spec, seed, D }) => {
  const k = cam.k;
  const w = sizeAt(LINK_PX, k) / k;
  const amp = smoothstep((frame - T.pulses[0]) / (T.pulses[1] - T.pulses[0]));
  const pulses = amp > 0.003 ? pulsesAt(tree, spec, frame, seed) : null;
  const drawn = tree.links.map((l) => linkDraw(l, D));
  const dashOf = (l: (typeof tree.links)[number], p: number) => (p >= 0.999 ? undefined : `${(p * l.len).toFixed(2)} ${(l.len * 2 + 10).toFixed(2)}`);
  return (
    <g>
      <g fill="none" strokeLinecap="round">
        {tree.links.map((l, i) => (drawn[i] > 0.002 ? <path key={`c${i}`} d={l.d} stroke={DARK} strokeOpacity={0.58} strokeWidth={w + CASING_PX / k} strokeDasharray={dashOf(l, drawn[i])} /> : null))}
        {tree.links.map((l, i) => (drawn[i] > 0.002 ? <path key={`l${i}`} d={l.d} stroke={INK} strokeOpacity={INK_FULL} strokeWidth={w} strokeDasharray={dashOf(l, drawn[i])} /> : null))}
      </g>
      {pulses ? (
        <g fill="none" strokeLinecap="round" opacity={amp}>
          {tree.links.map((l, i) =>
            pulses[i].map(([a0, a1], j) => (
              <path key={`pc${i}-${j}`} d={l.d} stroke={DARK} strokeOpacity={0.7} strokeWidth={w * 1.7 + 2.6 / k} strokeDasharray={`${(a1 - a0).toFixed(2)} ${(l.len * 2 + 20).toFixed(2)}`} strokeDashoffset={-a0} />
            )),
          )}
          {tree.links.map((l, i) =>
            pulses[i].map(([a0, a1], j) => (
              <path key={`p${i}-${j}`} d={l.d} stroke="#FFF7E0" strokeOpacity={1} strokeWidth={w * 1.7} strokeDasharray={`${(a1 - a0).toFixed(2)} ${(l.len * 2 + 20).toFixed(2)}`} strokeDashoffset={-a0} />
            )),
          )}
        </g>
      ) : null}
      {tree.nodes.map((n, i) => (
        <TownDot key={`d${i}`} x={n.x} y={n.y} cam={cam} r={sizeAt(4.5, k)} level={smoothstep((tree.pd[i] - D) / 3)} />
      ))}
    </g>
  );
};

const halosOf = (tree: MapTree, D: number, width: number): Halo[] =>
  tree.links
    .map((l) => ({ l, p: linkDraw(l, D) }))
    .filter((q) => q.p > 0.002)
    .map(({ l, p }) => ({ d: l.d, width, dash: p >= 0.999 ? undefined : `${(p * l.len).toFixed(2)} ${(l.len * 2 + 10).toFixed(2)}` }));

const HierarchicalNatureV2: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(cameraAt(frame), frame);
  const k = cam.k;
  const dA = frontD(AZTEC, frame);
  const dI = frontD(INCA, frame);
  const ru = smoothstep((frame - T.ruler[0]) / (T.ruler[1] - T.ruler[0]));
  const labelPx = 46 * Math.pow(k, 0.42);

  return (
    <MapPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <Territory id="hv2-az" d={EMPIRE_D} borderD={EMPIRE_BORDER_D} box={EMPIRE_BOX} cam={cam} level={smoothstep((frame - T.aztec) / 8)} halos={halosOf(AZTEC, dA, sizeAt(8, k))} />
        <Territory id="hv2-in" d={REALM_D} borderD={REALM_BORDER_D} box={REALM_BOX} cam={cam} level={smoothstep((frame - T.inca) / 8)} halos={halosOf(INCA, dI, sizeAt(17, k))} />
        <TreeLayer tree={AZTEC} cam={cam} frame={frame} spec={PULSE_AZTEC} seed={11} D={dA} />
        <TreeLayer tree={INCA} cam={cam} frame={frame} spec={PULSE_INCA} seed={57} D={dI} />
        {[AZTEC, INCA].map((tr, i) => (
          <g key={i} transform={`translate(${tr.capital[0]} ${tr.capital[1]}) scale(${(1 / k).toFixed(6)})`}>
            <circle r={sizeAt(5.6, k) + 1.5} fill={DARK} fillOpacity={0.66} />
            <circle r={sizeAt(5.6, k)} fill={INK} fillOpacity={0.62 + 0.32 * ru} />
            {ru > 0.003 ? (
              <g opacity={ru} transform={`translate(0 ${(RISE * (1 - ru)).toFixed(2)})`}>
                <Ruler size={RULER_PX} />
              </g>
            ) : null}
          </g>
        ))}
      </WorldSvg>
      <MapLabel text="AZTEC" x={LABEL_AZTEC[0]} y={LABEL_AZTEC[1]} cam={cam} frame={frame} f0={T.aztec} size={labelPx} spacing={0.3} dy={-56} />
      <MapLabel text="INCA" x={LABEL_INCA[0]} y={LABEL_INCA[1]} cam={cam} frame={frame} f0={T.inca} size={labelPx} spacing={0.3} />
    </MapPage>
  );
};

export default HierarchicalNatureV2;
