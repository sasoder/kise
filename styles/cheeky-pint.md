# Cheeky Pint style

Follow CRAFT.md. "Cheeky Pint style" (also "Cheeky Pint S4 style") means the **stout** look: an espresso-brown board,
cream card objects under one key light, and amber as the only glowing material. Lines set underwater or at sea use
the **realistic ocean variant** (last section). Every other line uses the stout board.

## Kit
- Import everything from `generated/components/stoutShared.tsx` and never restate a value. Palette: `B1`, the default
  (no `palette` prop). Never render with `palette: "stout"`: it is near-black.
- Objects: `StoutStage`, `Pillar` (tile + bar + slice + glass + fill as one object), `MercedesTile`, `CrestTile`,
  `SportTile`, `TeamTile`, `ChartBar` + `Rule`, `ElevationShadow`, `LightSweep`, `Numeral`, `Label`. Overlays:
  `StoutNameTag`, `StoutWatchHere`.
- Tokens: `COLOR`, `GEO`, `TYPE`, `TRACK`, `SPACE`, `ELEVATION`, `EDGE`, `STROKE`, `FONT_NUM`, `FONT_LABEL`. Helpers:
  `bloomFilter`, `amberBandFor`, `camFor`, `toScreen`, `snapLen`, `mixHex`, `opticalFit`, `rectPath`, `numeralWidth`.
- Map world to camera the way `generated/components/StoutFrames.tsx` does. Pass `amberBandFor(cam)` to every
  `Pillar` and `ChartBar` in a frame, and run data heights at rest through `snapLen()`.
- `StoutStage`'s `S` is the story clock. Pass the shared clock so ground drift, sway and grain carry across joined
  cuts. Camera: `cameraTrack` (`generated/components/outgrowShared.tsx`), or `makeClockCam` + `makePoolTrack`
  (`generated/components/museShared.tsx`).
- Pieces built on the kit: `museShared.tsx` has `UnionShadow`, `toneTop`/`toneFoot`, `liftAt`, `travel`, `PersonTile`,
  `BigBust`, `bustPaths`, `GlyphMark` and `GlassColumn`. `talentShared.tsx` has `PersonPeg`, `PegShadows` and
  `MetaMark`. Alias its `TeamTile`, which clashes with stoutShared's.
- Never import `d1Shared.tsx`, `cheekyPintSystem.ts`, `cheekyPint2.tsx` or `NameTagCheekyPint.tsx`. Never load
  `public/brown-paper-backdrop.jpg` or `public/cheekypint2/{stout,kraft-fresh,kraft-frost}.jpg`. They are other looks.

## Palette (B1)
| Token | Hex | Role |
|---|---|---|
| `ground` | `#432C1C` | espresso board (mean of `public/cheekypint2/brown-b1.jpg`) |
| `cream` → `creamFoot` | `#F5EEE1` → `#E7DCC8` | lit card: the subject |
| `board` → `boardFoot` | `#AD8E6F` → `#A28365` | context and dimmed card |
| `inkDark` | `#2E1E14` | ink on cream and amber, logo marks |
| `inkCream` / `inkCreamLo` | `#F3EBDD` / `#B1A494` | type on the ground, hi / lo |
| `amberTop` → `amberFoot`, `amberHot` | `#FFB000` → `#E38E00`, `#FFE7A8` | the one glow, its hot top edge |
| `shadow` | `#22150B` | every shadow |

- Nothing is black (CRAFT.md, The picture): not the ground, corners, shadows, vignette, marks or ink.
- Contrast minimums: cream on ground ≥ 7:1, amber and lo type on ground ≥ 4.5:1, dimmed tile against ground ≥ 3:1,
  ink on cream ≥ 10:1.
- `StoutStage` draws the ground: `brown-b1.jpg` with its fibres showing, parallax, drift and mirror-padded edges. On
  top it adds a cream light pool that follows `pool`, a gentle brown vignette and `public/cheekypint2/grain.png` on twos.

## Type
- Fonts: local `public/Sohne-Dreiviertelfett.otf`, `public/Sohne-Kraftig.otf`, loaded by stoutShared (`@remotion/fonts`).
- Numerals are Dreiviertelfett (`FONT_NUM`), tabular when they count. Words are Kräftig caps (`FONT_LABEL`), +0.06 em.
- Sizes are `TYPE` tokens in screen px at rest: HERO 184, SECONDARY 136, LABEL 30 (overlays: TAG 96, TAG_SUB 36).
  Between rests, ease token to token with the camera. Spacing follows the 8 px `SPACE` grid.
- LABEL is tiny on a phone. A label that must be read goes inside its card, in ink, at a larger size.
- `Label` and `Numeral` already do the stout entrance (blur in plus a 24 px slide up), and the exit reverses it.
- A changing value rolls as an odometer, with `rollBlur` proportional to its speed. A unit change turns a feathered
  drum between whole, centred strings that never overlap or dip. At the end of a count, N−1 never visibly holds.

## Materials and light
- One key light, from above and slightly left. Each object casts **one** shadow from its union silhouette
  (`ElevationShadow`, `UnionShadow`). A touching group counts as one object, and no part casts its own shadow.
- Elevations: rest (with a contact shadow), lifted, float. Whatever travels lifts one level and settles on landing.
- Cream card is lit (the subject); board is context. Dim by tone (`dim`, `toneTop`/`toneFoot`, ~12 f), never opacity.
- Tone ladder: dark (ground mixed toward board) → board → cream → amber. Whatever would give a reveal away stays
  dark until its line. The fronts that cause a change: the light pool, a waterline, an outline drawing, an amber wave.
- Hidden context stays fully hidden until revealed: no shadow, no edge, no sliver at the frame edge.
- **Slot joint:** a bar or piece rises out of a slot in its tile's top edge. It never sits on top like a sticker.
  Keep a rising piece's face blank, and bring its label in whole afterwards.
- **Amber** is the only glow: band gradient, fixed bloom (`bloomFilter`, never a pulse), 2 px hot top edge. Decide what
  it stands for in the clip (profit, the person, the picked few, the agent), keep it, and give every cut its amber touch.
- **Glass** is the one transparent material: a cream hairline and a faint tint, for columns, jars, tubes and silos.
  Amber fills inside it carry rungs. Use glass whenever a level has to be seen changing.
- `LightSweep` is the click of the payoff; save it for that. Group arrivals never click. A sweep on cream is
  invisible, so put it on amber or drop it. Motion is weighty and damped: no flashes, pulses, bounces or springs.

## Visual language
- A team or company is a tile, and its money is a bar rising out of that tile. The share that matters is an amber
  slice. A multiple is a glass column stretched from that slice.
- People are head-and-shoulder busts or pegs cut from card (`PersonPeg`, `PersonTile`, `bustPaths`). Board is anyone;
  cream or amber is whoever the line is about. A crowd shares one shadow layer (`PegShadows`). Discs read as pebbles.
- Icons are one heavy Lucide-grammar glyph in ink on a tile (`SportTile`, `GlyphMark`), at `GLYPH_STROKE` weight
  (`generated/components/museShared.tsx`).
- Real objects (a pint glass, a hop cone, a ship) get the same card material and light (`HopCone` in
  `generated/components/guinnessShared.tsx`).
- Logos are the real mark, redrawn as a one-colour stamp in `COLOR.inkDark` on a cream tile. Dark parts become ink,
  light parts stay tile, and the background is dropped. Keep the silhouette and the feature a fan knows it by, and
  inline the path data. Normalise a set as one family (`opticalFit`, `GEO.CREST_FILL`). Existing marks:
  `MercedesTile`, `CrestTile` (`generated/components/wolffLogos.ts`), `MetaMark`, `MuseMark`. A logo over its subject
  is counter-scaled to stay readable.

## Scale in 9:16
- World units are small (`GEO.TILE` 96): the subject spans most of the width and uses the height.
- Many tiles: one long row running off both edges, a skyline with one tower. Never stack rows behind rows, and never
  pull back until tiles are crumbs. Travel along the row at a readable size, or push in on one tile.
- Show a count as a stack or grid of chunky units, not one thin column. Sorted, labelled stacks read as a bar chart.
- A recap of earlier points mounts miniatures of their real scenes; a row of small icons in an empty frame reads as a
  placeholder.

## Overlays
- Name tag: `StoutNameTag` (`generated/components/NameTagStout.tsx`). Size and position are in `styles/name-tags.md`.
- Call to action: `StoutWatchHere` (`generated/components/CtaWatchHere.tsx`). A cream "Watch here" card sits above
  three amber chevrons side by side, with a brightness wave every 36 f. The last frame equals the loop start.
- Both render transparent. For review only, `backdrop: true` adds `public/cheekypint2/toto_backdrop_9x16.jpg`.

## Exemplars
- `generated/components/BillionInRevenueStout.tsx` (world `stoutActA.tsx`): a bar rises out of the Mercedes tile, and
  amber pours into profit as an odometer counts. Siblings: `ConservativeMultiplesStout.tsx`, `MostSponsorshipStout.tsx`.
- `generated/components/TalentDensity.tsx`: the crowd sinks to dim heads, and the amber few pack onto a team tile.
- `generated/components/InsideThePint.tsx`: a real object (pint, harp) in stout material.

## Realistic ocean variant
Use it for lines set underwater, at sea, or about mapping the ocean. Keep stout cream, amber bloom, Söhne, grain, a
brown vignette, a warm grade; nothing black. Amber still marks one thing (the vehicle's sensing, what is mapped, money).
- **Underwater**, `generated/components/oceanShared.tsx`: `OceanStage` grades the water by depth and adds god rays,
  marine snow and a cream/brown soft-light grade. Depth model: `Scene`, `makeView`, `DepthGroup`, `InFog`/`fogAt`.
  `SeabedPlane`/`SurfacePlane` read `public/ulysses/` (baked by `scripts/bake-ulysses-ocean.py`). Objects:
  `UlyssesVehicle`, `NavalMine`, `FloatingPlatform`, `DynamicCable`, `GhostLine`, `Dolphin`, `Whale`, `SonarFan`,
  `LockBracket`, `RimLit`.
- **At the surface**, `generated/components/droneSeaShared.tsx`: `SeaStage` splits over/under at the waterline, with
  sky above and `OceanStage` below. Also `ResearchShip` (`part="above"|"below"`), `SurfaceWake`, `BubbleTrail`.
- **Globes**, `generated/components/marsOceanShared.tsx` on `StoutStage`: `LitGlobe` (WebGL sphere, stout key light),
  `GlobeGrid`/`GlobeLines` (amber graticules, tracks), textures in `public/marsocean/`. Render with `--gl=angle`.
- Water warms toward espresso, never blue-black. By depth (oceanShared `WATER`): `#A9C7B4`, `#5F877D` (10 m),
  `#375957` (28 m), `#313E3A` (55 m), `#3F3226` (deep). Globe ocean `#2F7377` → `#10262F`, night side `NIGHT`
  `#2A1A10`. Sky (droneSeaShared `SKY`): `#F3DEB6` at the horizon up to `#3D291C`.
- Light real-leaning objects from above, with a cream rim on top edges, and fog them by distance. Real textures
  (seabed, gold, planets) are fine when they share the light and the grade.
- At the surface, use the over/under split, because a side-on cross-section fights 9:16. Show what sits above the
  waterline: from below, a floater reads as a pier.
- A vehicle shows its tail, prop and wake, and flies near level. Otherwise it reads as a pipe. A net is a snarl of
  lines, never a dome, which reads as a creature.
- Earth needs blue seafloor relief and natural land colours, or it reads as the Moon. Keep the water lit, because
  dark water reads as night.
- Exemplars: `generated/components/HuntingMines.tsx`, `generated/components/MarsVsOcean.tsx`,
  `generated/components/SameBigShip.tsx`.
