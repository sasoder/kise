# benchShared — changes after BENCH_READY

- 2026-10-29 (cut-1 builder): values only, no names changed. `TOWER_CAM_GLIDES` retuned (crane/pull-back glide now
  f22-54 to k 0.97, hold creep to k 0.985), so `EVEN_LOOK` (= `TOWER_CAM.at(20)`) is now ≈ {x 540, y 793, k 1.37} —
  still read it live. `CUT1_JET` now x0 78, alt 322 m, speed 8.4 m/f (passes behind the tower f55-63, fully out by
  the cut). `BenchContrail` gained air-fixed puffs. `probe_f0.png` re-rendered with the final camera.
- 2026-10-29: `EVEN_RUNGS[1]` 3.15 -> 3.1 (slot 2 tile top cleared the 1460 band edge by only 5 px at the end frame; now ~8 px).
- 2026-10-29 (director review of cut 1, values only, no names changed): the even chart is now framed whole.
  `EVEN_RUNGS` -> [1.9, 2.15, 2.05, 1.95, 2.1] (shorter, so the apron line, slots and bars fit under the tiles);
  `TOWER_CAM_START` -> {540, 772, 1.11}, first glide -> {f-30..30, dy -6, k 1.075}, crane glide dy -122, so
  `EVEN_LOOK` (= `TOWER_CAM.at(20)`) is now ≈ {x 540, y 767, k 1.08}: apron line at screen y ~1860, tiles ~207 px,
  tile tops ≥ 1467. Cut 1 rises its columns f-10..f18. `CUT1_JET` -> {x0 68, z 806, alt 244, speed 11.86}: ~190 px
  long in cut 1's end frame, y ~1000, enters f45, behind the tower f58-68. probe_f0.png re-rendered.
- 2026-10-29 (director, cut 1 rev 2; no shared code changed): cut 1 no longer renders the jet or its contrail
  (9/11-adjacent risk). `CUT1_JET`, `BenchJet`, `BenchContrail` stay exported, unchanged. Cut 1's cloud layer is local
  to BenchmaxxedTower.tsx (`CLOUD`, `cloudY`), not in benchShared.
