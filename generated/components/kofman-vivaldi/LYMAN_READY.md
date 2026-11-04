# lymanShared.tsx is ready (owner: cut 0, VivaldiTookBack)

Import from `./lymanShared`. World px of `lymanFrontData.ts`; draw inside the kit's `VStage`; pass the current `cam.k`.
Exports are final: from here on they are only added to, with each change logged in `SHARED_CHANGES.md`.

- `LymanMap {id, k, held, hatchK?, rung?, heldMask?, rivers?, fronts?, places?, dots?, placeAppear?, children?}`: the whole map, bottom to top: held wash (`held` = one path string or an array, drawn as their union), the Donets, `children` (your overlays), `fronts` (static ink FrontLines), place dots + "word" labels (`places` labelled, `dots` unlabelled).
- `HeldWash {id, d, k, hatchK?, rung?, mask?}`: the held-ground area alone. House hatch (wash 0.10, lines 0.35, 45 deg) clipped to the path(s), even-odd holes. `rung` multiplies the house values: 1 = house (the default), `INK_LO` dims it to context. `hatchK` fixes the hatch pitch so the hatch stays locked to the world through a push: pass your cut's middle zoom. `mask` takes a `url(#id)`.
- `FrontLine {id, points, k, draw?, len?, red?, rung?, ageAt?, bead?, diffuse?}`: a front polyline (`[x, y][]` like `MAINFRONTOCC_20261103`, or kit points). Ink LINE at `rung` (default INK_HI), drawn as one opaque colour so joined pieces never darken. `red` makes it the kit's red WetLine. Write-on uses `draw` (0..1) or `len` (world px) with `ageAt` for the wet stretch and `bead` (0..1) for the bead at the tip. `diffuse` (0..1) bleeds it away in place.
- `Rivers {k, rung?}`: the Donets as an ink hair at INK_LO. `RIVER_PTS` holds its points.
- `PlaceMarks {names, k, labels?, rung?, appear?, left?}`: ink dots with "word" labels on the right (or on the left for the names in `left`). `PLACE_DOT_PX` is 7 and `PLACE_GAP_PX` is 16 (screen px at k 1).
- `MAP_HATCH` and `HATCH_ANCHOR`: the hatch values and the world anchor of the hatch.
- `toPts(arr)`: turns `[x, y][]` into kit points. `parsePathD(d)`: splits a path string into its subpaths as point lists. `despike(pts)`: removes the vertices where a line doubles back on itself.
- `VIVALDI_OLD_EDGE` / `VIVALDI_NEW_EDGE`: the retaken patch's Ukrainian-side edge (the 15 Aug front) and its east edge (the 15 Oct front), both north to south. `FRONT_PIN_N` / `FRONT_PIN_S` are the two points where those edges meet.
- `FRONT_OCT_NORTH` / `FRONT_OCT_SOUTH`: `MAINFRONT_20261015` north and south of the salient. `FRONT_AUG_DRAWN`: the 15 Aug front as cut 0 draws it (Oct outside the salient, the old edge around it).
- `HELD_AUG_DRAWN`: `[HELD_20261015, RETAKEN_VIVALDI]`, the 15 Aug held ground that matches `FRONT_AUG_DRAWN`. It also includes two small Russian gains made between the dates (about 1 and 10 km2).
- `FRAMING_SALIENT` = (415, 810, k 1.10): cut 0's settled frame, with the patch at about 80 % of the frame width and its middle at screen y ~900.
- `FRAMING_SALIENT_OPEN` = (415, 830, k 0.83): cut 0's opening frame.
- `FRAMING_SECTOR` = (600, 1000, k 0.88): about 50 km of front, from world y ~ -90 to 2090, with the whole salient, Lyman and the Donets.

Probe stills (full size):
- `/private/tmp/claude-501/-Users-tom-Documents-tom-fant-CAPTIONSTOOL-kise/cdc1b1fb-4fe0-4920-93ba-8b308d705842/scratchpad/cut0/probe_sector.png`: FRAMING_SECTOR, HELD/MAINFRONT 3 Nov 2026, with Lyman labelled and three village dots.
- `/private/tmp/claude-501/-Users-tom-Documents-tom-fant-CAPTIONSTOOL-kise/cdc1b1fb-4fe0-4920-93ba-8b308d705842/scratchpad/cut0/probe_salient.png`: FRAMING_SALIENT, HELD_AUG_DRAWN + FRONT_AUG_DRAWN.

Notes:
- Camera-band check for the sector framing: at FRAMING_SECTOR the caption bands fall at world y ~1136–1330 and ~1455–1568. Lyman (y 1490) sits in the second band, so either move the camera or keep its label off that band.
- When you splice two front pieces, a near-reversal leaves a spur at the joint. Run the result through `despike`.
