# sarah-insurgency: WORLD READY

Approved by the director. Every cut imports the world from `./insurgencyShared`. The header of `insurgencyShared.tsx` is the full API.

**Check line:** every cut reads as ONE world. That world is an old printed map laid as a floor inside the Dwarkesh 3D misty air, with wooden wargame pieces standing on it. It is vintage and tactile, with no people. Orange is the side fighting on its own ground; cream is the occupier or the intervener. No numbers appear on screen.

## Grade
- `GRADE = "A"` (the default): the 3D air, palette A, as it is. The map supplies the vintage.
- Grade A and grade B both carry the map style's paper mottle and screen grain over the whole frame at low strength. `InsurgencyStage paper` is 0.75 in A and 1 in B.
- `"B"` ("aged", warm sepia air) can still be selected through the `grade` prop of `insWorld`.

## Using it
- **Frame:** 1080x1920 at 24 fps.
- **Rendering:** every render uses `--gl=angle`, because the ground is WebGL2.
- **Camera:** `camTrack(KEYS)(frame)`, with KEYS as a module-level array. `VIEWS` holds tested cameras for `chinaPlain`, `thirteenStates`, `farm`, `atlanticEast` and `page`.
- **Frame order:** `<InsurgencyStage A>`, then `<MapGround3D cam air={A.ground} fog={A.fog} …/>`, then `<HorizonHaze A id/>`, then `<WorldLayer>`. Inside the WorldLayer, draw the lines, labels and patches first, then the pieces ordered with `sortFarToNear`.
- **Fog:** `fogFor(cam)` is the default. It blends to the denser `FOG_HORIZON` once the horizon enters the frame, so oblique views get no hard sea/land line. If a cut overrides the fog, it must pass the same fog to `insWorld` and to the ground.
- **Lock:** the WebGL ground and the SVG pieces share one projection. Measured drift between them was 0.9 px at most, across all five probe moves.
- **Speed:** about 62 ms per frame at full resolution with concurrency 4.

## Rules for cuts
- **Labels:** a cut labels only the places its line speaks. NORTH CHINA, THIRTEEN COLONIES, MASSACHUSETTS and ATLANTIC exist only in the probe. Labels lie on the ground (`GroundLabel`, IM Fell English SC). Pass a constant `yaw` so a label stays fixed to the map.
- **Caption bands:** keep labels and key pieces out of y 1080–1250 and 1360–1460. The probes are not composed around the bands.
  - In the `chinaPlain` view, the plain's railway towns fall near band 1.
  - In `thirteenStates`, the mid-Atlantic coast falls near band 1.
  - Re-key the target or pitch to fix this; do not move the map data.
- **Pawns:** pawns RISE out of a tear in the map (`Pawn rise`). Never fade them or scale them in.
- **Soft patches:** `SoftPatch` (the orange glow round pawns or base areas) is optional and subtle. Keep its amount at or below 0.6.

## Caveats on the data
- **The Atlantic coast up close:** the only local coastline data is Natural Earth 10m. It looks angular when the camera is close (D below about 300), for example Narragansett Bay and Massachusetts Bay. In close views, keep the coast at a distance. The `farm` view looks north-east from inland for this reason (cut 91).
- **Approximate data:**
  - The China rivers and lakes were hand-traced: the Yangtze, the Yellow River on its 1938–47 flood course, Dongting and Poyang.
  - The Hudson was hand-traced too.
  - Railways, cities and guerrilla base areas come from COMMON.md and are positioned approximately.
  - The 1939 occupied area is pearl's FRONT_1938 occupied mask plus the Canton pocket.
- **The 1783 state borders:** the 1783 subset available locally has no state lines. The borders are therefore modern us-states-10m outlines grouped by successor state, the same method the sugar map uses:
  - NH+VT
  - MA+ME
  - VA+WV+KY
  - NC+TN
  - MD+DC

  The other states stand alone. Western land claims are not shown. The lines are drawn dashed in cream.
- **The Greenland clip:** the Atlantic bake leaves one false-coast warning, where land is cut at 83N in north Greenland. It sits deep in the haze.

## Changes

**2026-10-30** (asked for by the cut builders). Every change adds something. Existing exports, props and defaults are the same, so running cuts keep working.
- **`Pawn` rise timing:** the tear now grows with the pawn. It is always slightly wider than the widest part of the pawn already above ground. The head breaks the surface about one frame after the tear starts (in a 15-frame rise), and the tear closes under the base at the end. Run `rise` from 1 to 0 for a sink: the tear opens round the foot, the pawn goes down, the head goes under, and then the tear closes. `riseState(u)` gains `holeR` (the hole radius in pawn heights).
- **`Block` landing dust:** the topple's puff is split. The specks behind the block are drawn before its faces and the specks in front after them.
- **`Block sink` (0..1), new:** the block sinks into the page. A tear opens round its footprint, with a pale lip and a soft umber shadow inside (not a black pit). The block goes down, clipped by the opening, then the tear closes, and at 1 nothing is left. `sinkState(u)` gives the schedule `{ tear, open, lip, down, closing }`. This is taken from the cut-1 design in `DontGiveUp.tsx`. Use it on its own; do not combine it with `topple`.
- **`stars1777` sticker (FlagKind), new:** the 1777 Flag Resolution flag. It has 13 stripes in orange and cream, and a dark umber canton with a circle of 13 cream stars. It reads at about 40 px. Use it for the American block next to the cream Union block, because `grandUnion`'s British canton reads as British there. `grandUnion` is unchanged.
- **Probe `InsurgencyPieceProbe`, new:** 120 frames on the page world, in `src/Root.InsurgencyWorldProbe.tsx`. Frames 0–19 are a pawn rise, 24–47 a pawn sink, and 48–119 a `stars1777` block that topples back, lands in its dust and then sinks.

## Files
- **Clip modules:** `insurgencyShared.tsx`, `insurgencyCamera.ts`, `insurgencyAir.tsx`, `insurgencyGround.tsx`, `insurgencyFlags.tsx`, `insurgencyPieces.tsx`, `insurgencyOverlays.tsx`.
- **Map data:** `insChinaMapData.ts`, `insChinaLevels*.ts`, `insAtlanticMapData.ts`, `insAtlanticLevels*.ts`.
- **Probe:** `InsurgencyWorldProbe.tsx`, with `src/Root.InsurgencyWorldProbe.tsx` and `src/entry.InsurgencyWorldProbe.ts`. Its props are `{grade, debug, bands}`. With `debug` on, the ground paints a magenta disc and the SVG draws a green ring at the same world point, which is the lock check.
- **Map configs:** `scripts/maps/configs/insurgency-china.mjs` and `scripts/maps/configs/insurgency-atlantic.mjs`. Rebuild with `bun scripts/maps/build.mjs <config>` and then `bun scripts/maps/bake.mjs <config>`.
- **Assets:** `public/sarah-insurgency/`, which holds the tiles plus `grain.png` and `mottle.png`.
