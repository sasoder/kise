# lymanShared.tsx changes after LYMAN_READY.md

## 2026-11-05: two-colour map (REVISION_1105, user request; owner cut 0)
- CHANGED `MAP_HATCH`: wash 0.10 -> 0.18, hatch lines 0.35 -> 0.45. Russian-held ground now reads as solid grey territory.
- CHANGED `LymanMap`: it now draws the Ukrainian blue by default, under the held wash. New props `ukraine` (default true) and `ukraineRung` (default 1).
- ADDED `UA_BLUE` = "#3F6A8C" and `UA_WASH` = 0.33 (raised from 0.28 at the director's colour review): a flat print blue for Ukrainian-held ground, with no gradient and no hatch.
- ADDED `UkraineWash {id, held, k, rung?}`: the blue over everything in view that is not inside `held`. Several paths count as their union, so the edges they share inside the held ground leave no seam.
- ADDED `SIDE_LABELS`: UKRAINE at world (360, 420) and RUSSIAN-HELD at world (960, 700).
  - Both are clear of the caption bands at FRAMING_SECTOR and at STALEMATE_END_CAM.
  - UKRAINE is also clear at FRAMING_SALIENT / _OPEN and along cut 0's whole camera path.
- ADDED `SALIENT_RUSSIAN_LABEL` at world (450, 760), on the salient itself. The grey strip at FRAMING_SALIENT is too narrow for RUSSIAN-HELD. Cut 0 uses it on the 15 Aug state and bleeds it away as the red takes the ground.
- ADDED `SideLabel {which, k, at?, appear?, diffuse?, rung?}`: a kit "word" label at INK_HI.
- ADDED `RetakenPatch {id, k, fill?, edge?}` and `PATCH_EDGE_PX` (LINE / 2). This is the memory thread:
  - `fill` 1 = cut 0's flat red; 0 = the blue shows through underneath.
  - `edge` = a fine RED_DEEP outline at rest.
  - Use it with `held={HELD_20261015}`, inside LymanMap's children, under the fronts.
