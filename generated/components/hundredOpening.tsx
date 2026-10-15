// ---------------------------------------------------------------------------
// hundredOpening: the drawing of HundredAgainstHundredThousand, shared so a
// cut that plays BEFORE it can end on exactly its f0 picture (f0 is a join
// frame). HundredAgainstHundredThousand itself draws through HundredLayers,
// so the two can never drift apart.
//
//   openingCam(f)            the camera with the house sway, on THIS cut's
//                            timeline: valid from F_PRE (-100) to LAST; the
//                            pre-roll f-91..-1 continues the opening creep
//                            (a 3.5 % creep in at k ~1.94..2.0, the plaza
//                            drifting left onto (540, 815) on f0)
//   <HundredLayers cam frame crowdOpacity? armyMax? roadOpacity? label168F0? show168? />
//                            every layer of the cut at `frame` (this cut's
//                            timeline, F_PRE..LAST): the causeway, the plain's
//                            80,000, the square's 6,000, the plaza plan, the
//                            168, the numerals. No page: put it inside
//                            incaShared's <PlanPage cam vignette={0.55}>
//   <HundredOpeningLayers cam frame label168F0? show168? />
//                            the same, for the preceding cut's frames (its
//                            frame F maps to f = F - its duration, so its
//                            last frame is f-1 and ours begins at f0).
//                            label168F0: the frame (this timeline) on which
//                            "168" starts its house slide-up; by default it
//                            is already standing (as on our f0). show168
//                            false leaves the label to the caller.
// A full preceding frame:
//   const cam = openingCam(f);
//   <PlanPage cam={cam} vignette={0.55}><HundredOpeningLayers cam={cam} frame={f} /></PlanPage>
// The looks and positions are in hundredMotion.ts: LOOK, NUMERAL, op168,
// plazaManAt / plazaFrame, footAt / FOOT, riderAt / RIDERS, armyFrame, camAt.
// ---------------------------------------------------------------------------
import React from "react";
import { CanvasDots, CrowdDots, INK, NumeralLabel, PlazaPlan, ROAD_TO_CAMP, RouteLine, WorldSvg, swayCam, type Cam, type DotLayer } from "./incaShared";
import { DEAD_OP, DEAD_R_SCALE, deadLook } from "./hundredShared";
import { ARMY_DIVISION_LAYERS, F_PRE, FOOT, LAST, LOOK, NUMERAL, RIDERS, armyFrame, bucketQ, camAt, footAt, op0, op168, plazaFrame, riderAt, type DotSplit } from "./hundredMotion";

/** the camera with the house sway, on this cut's timeline (F_PRE..LAST) */
export const openingCam = (f: number): Cam => swayCam(camAt(f), f);

/** a DotSplit as CanvasDots layers: the dead first (under), then the dying, then the living */
const layersOf = (sp: DotSplit, r: number, op: number, casing: number, layerOp: (L: number) => number = () => op): DotLayer[] => [
  { xy: sp.dead, r: r * DEAD_R_SCALE, color: INK, opacity: DEAD_OP },
  ...sp.dying.map((xy, b) => {
    const l = deadLook(bucketQ(b), r, op, casing);
    return { xy, r: l.r, color: INK, opacity: l.op, casing: l.casing > 0.05 ? l.casing : undefined };
  }),
  ...sp.living.map((xy, L) => ({ xy, r, color: INK, opacity: layerOp(L), casing: casing > 0 ? casing : undefined })),
];

export type LayersProps = {
  cam: Cam;
  frame: number;
  crowdOpacity?: number;
  armyMax?: number;
  roadOpacity?: number;
  /** the frame "168" starts its slide-up (default: already standing) */
  label168F0?: number;
  show168?: boolean;
};
export const HundredLayers: React.FC<LayersProps> = ({
  cam,
  frame,
  crowdOpacity = LOOK.crowdOpacity,
  armyMax = LOOK.armyMax,
  roadOpacity = LOOK.roadOpacity,
  label168F0 = -1000,
  show168 = true,
}) => {
  const fi = Math.min(LAST, Math.max(F_PRE, Math.round(frame)));
  const k = cam.k;
  const army = armyFrame(fi, k);
  const plaza = plazaFrame(fi);
  const aDiv = LOOK.armyAlpha(k, armyMax);
  const aField = LOOK.fieldAlpha(k);
  const layers = [
    ...layersOf(army, LOOK.armyR(k), aDiv, 0, (L) => (ARMY_DIVISION_LAYERS.includes(L) ? aDiv : aField)),
    ...layersOf(plaza, LOOK.crowdR(k), crowdOpacity, LOOK.crowdCasing),
  ];
  const orange = [...FOOT.map((_, i) => footAt(i, fi)), ...RIDERS.map((r) => riderAt(r, fi))].map(([x, y]) => ({ x, y, t: 1 }));
  const s168 = NUMERAL.size168(k);
  const s0 = NUMERAL.size0(k);
  const [ax, ay] = NUMERAL.anchor;
  return (
    <>
      <WorldSvg cam={cam}>
        <RouteLine route={ROAD_TO_CAMP} cam={cam} width={LOOK.roadWidth} casing={LOOK.roadCasing} opacity={roadOpacity} />
      </WorldSvg>
      <CanvasDots cam={cam} layers={layers} />
      <WorldSvg cam={cam}>
        <PlazaPlan cam={cam} />
        <CrowdDots dots={orange} cam={cam} radius={LOOK.orangeR(k) / k} casing={LOOK.orangeCasing} />
      </WorldSvg>
      {show168 && fi < 40 ? (
        <NumeralLabel text="168" x={ax} y={ay} cam={cam} frame={fi} f0={label168F0} size={s168} dy={NUMERAL.dy(s168)} frames={NUMERAL.frames} fade={NUMERAL.fade} opacity={op168(fi)} />
      ) : null}
      {fi >= NUMERAL.zeroF0 ? (
        <NumeralLabel text="0" x={ax} y={ay} cam={cam} frame={fi} f0={NUMERAL.zeroF0} size={s0} dy={NUMERAL.dy(s0)} frames={NUMERAL.frames} fade={NUMERAL.fade} opacity={op0(fi)} />
      ) : null}
    </>
  );
};

/** the cut's layers for the preceding cut's frames (this timeline, f <= 0) */
export const HundredOpeningLayers: React.FC<{ cam: Cam; frame: number; label168F0?: number; show168?: boolean }> = ({ cam, frame, label168F0, show168 }) => (
  <HundredLayers cam={cam} frame={Math.min(0, frame)} label168F0={label168F0} show168={show168} />
);
