# Dwarkesh map style

Follow CRAFT.md. The look for every history clip: a real, north-up, period-correct dark vintage map, or the same
umber page without a map, in cream engraved line with house orange as the accent. Never on the Dwarkesh grid.

## Look

| Token | Hex | Use |
|---|---|---|
| `SEA` | `#1B2226` | sea, deepest shade |
| `LAND` | `#3F3428` | land, and the page of non-map cuts |
| `LAND_RIM` | `#6A5838` | hand-coloured rim just inside the coast |
| `INK` / `INK_DEEP` | `#E9DDBF` / `#D3C5A2` | cream: coast, borders, type, figures; its shaded side |
| `ACCENT` / `ACCENT_DEEP` | `#FFB000` / `#D98A0C` | orange: the clip rule's one subject |
| `DARK` | `#17120D` | casing and outline (deep brown, never black) |
| `DEAD` | `#8A7B62` | a fallen figure, a dead line |

- Cream at two levels: in play (~0.9) and context (~0.5). Every ground stays coloured; behind a globe is warm umber.
- Paper: world-space mottle `public/manchuria/mottle.png` blended in octaves by k (stains keep their screen size),
  then screen-space grain `public/manchuria/grain.png` and a soft vignette. No per-frame turbulence.
- Restrained vintage: 4 engraved water-lines offshore along the coast, fading outward; a cream 5° graticule at ~0.12.
  No compass roses, cartouches or sea monsters.
- Type: IM Fell English SC for regions (widely spaced caps, may follow a parallel), IM Fell English roman for cities
  (small cream dot), italic for seas. Fell's old-style figures misread ("10,000" as "IO,OOO"): set numbers and years
  in Libre Caslon Text lining figures (as in `generated/components/OnlyDivergenceV2.tsx`) or Fell at ~150 px+.

## The map

- Natural Earth 10m from the installed `world-atlas` + `d3-geo`, `topojson-client`, `polygon-clipping`. Always
  north-up: Lambert conformal conic fitted to the region by default; Albers equal-area when areas are compared
  (`scripts/build-multiple-map.mjs`); Mercator or Equal Earth for ocean or world spans (`scripts/build-world-map.mjs`).
  Rotated or globe views that turn a route vertical do not read.
- Period borders only (merge what was one country, drop lines that did not exist), fine dashed cream at ~0.5. Add
  period water (Lake Texcoco 1519); leave out modern lakes.
- Historical polygons: aourednik/historical-basemaps (`scripts/build-ww1-map.mjs`); check early-period ones, they can
  be crude. Then georeference the scholarly Commons SVG map (affine fit to its towns + coastline ICP). Clip territories
  to land, and look at them over Natural Earth with key cities before building.
- Framing: a close-up keeps its geography (a peninsula and its strait), never an anonymous blob or open sea; a named
  empire fits whole in frame; a world map uses the largest k that keeps every lit country in; no plate edge shows.

## Build pattern (copy per clip)

1. `scripts/<x>-geo.json` or `scripts/<x>-geo.mjs`: projection, sites, routes, georeferenced polygons, sourced facts.
2. `scripts/build-<x>-map.mjs` → `generated/components/<x>Static.ts` (heavy static layers, read only by the bake) +
   `<x>MapData.ts` (light overlays: `project`, places, routes, regions clipped to land). It throws on failed checks.
3. `scripts/bake-<x>-rasters.mjs` (`@resvg/resvg-js`) → tiled LOD pyramid `public/<x>/<level>-<i>-<j>.png` +
   `<x>Levels.ts`: a whole-extent level for the wides, finer levels only where the camera goes close, crossfaded by k.
4. `generated/components/<x>Shared.tsx`: the clip's kit. Read-only once its READY file exists; additions only.

- **Copy Pearl** (newest): `scripts/pearl-geo.mjs` → `scripts/build-pearl-maps.mjs` → `scripts/bake-pearl-rasters.mjs`
  → `generated/components/pearlShared.tsx` (`MapPage`, `MapBase`, `runCamera`, `WorldSvg`, `Label`, `InkStroke`,
  `Hatch`, `Route`, `Packets`, `StrikeArc`, `poissonDots`, `relaxDots`, `Dots`). Single-world variant: Cortes
  (`scripts/cortes-geo.json`, `build-cortes-map.mjs`, `bake-cortes-rasters.mjs`, `cortesShared.tsx`).
- Kits export their clip's `FPS`; use the sequence's. Ignore `cortesShared` / `incaShared` framing constants
  (`CONTENT_Y`, `CAM_LIFT`, `CAPTION_TOP`, `camFor`'s default point); frame per CRAFT.md.
- Performance: only dynamic overlays stay vector, simplified to the current k; border-state changes are masked raster
  layers. Hold the camera outside level crossfade bands (`mapSharpness` in cortesShared). Render heavy raster pieces
  with `--concurrency=4`. Thousands of figures: rasterise each distinct pose state once to sprites and blit far to near
  (`generated/components/pageFigures.tsx` `sprite` / `blit`, as in `AllAdultMales.tsx`).

## Visual language

- Each clip states one orange rule in the brief ("orange = Cortés's side", "= Japan", "= the plague"); everything
  else is cream. Colour the orange side first, so orange is defined before anything moves.
- Dashed orange = planned or claimed, not held. A fallen state drains to a dashed cream outline.
- Territory gained = orange hatch clipped to land, dashed edge over land only, converted by a crisp travelling front
  (a soft radial reads as glow) that moves monotonically. A distance-ordered hatch thinning out reads as seeping
  influence. Under orange people, recede the land hatch to ~0.3.
- Railway = chequered symbol (cream casing, dark core, cream dashes), the gained section in orange, heavier; anything
  on it stays on the track. Defended border = wall with teeth (`generated/components/CityStates.tsx`). Point of
  interest = Lucide outline glyph in a thin orange ring. No plan-view symbols the viewer must decode.
- Map objects live in world space at map scale; no separately scaled stickers. Ships travel along their heading through
  open water and carry people over sea; an invasion is a column leaving ships, not an arrow. Show force and cause:
  "invade" gets orange advance arrows; a withdrawal shows what pushes it back.
- On a world map, lit country washes and one ring carry it; many arcs plus packets read as noise.
- Value: mosaics differ by hatch density, not only angle; cracks are angular and branching (else rivers); a country
  among same-colour neighbours gets a lifted land tone. A line about a real coloured map may take hand-tinted
  watercolour washes under the cream hatch (`generated/components/PickAColor.tsx`).

## People and crowds

- People are engraved figures, not dots or war glyphs; in a figure-led set a crowd is rows of figures. Manner: cream
  form on a dark casing, firm dark outline, hatching, light from the upper left; orange figures get a solid orange coat.
- Rig: `generated/components/texcocoFigures.tsx` (`Figure`, `figureRig`, `STAND`, `lerpFig`) on `texcocoShared.tsx`
  (`TexcocoPage`, `makeCamera`, `poseTrack`, `walkPose`, `idle`). Build a new cast on it as `captureFigures.tsx`
  (`Commoner`, `Warrior`, `Shield`, `Macuahuitl`) and `dgFigures.tsx` (`Soldier`, `King`, `General`) do; never fork it.
- Crowds in depth (rear rows smaller, painter's order), stipple only in the widest shot. Marching groups are compact
  bodies arriving in distance order, never strings. Dots stand for counted masses ("1 dot = N men"), arriving from a
  source in formation as an even blue-noise band, never a scatter.
- Architecture is dark umber planes in cream line, never pale masses. A victor stands upright with armed guards.
- Phone scale: the subject fills the frame; a glyph row needs ~45 px+ in the wide; a realm-wide with a tiny subject is
  dead air, so stage close → wide → close.

## Labels

- A place name appears only when the speaker says it, on its word. No capital, sea, unspoken-region or date labels;
  a capital dot stays only while a tie or arrow is anchored to it. Name the orange side when its homeland is off frame.
- No name labels on figures (colour and costume say who), except to tell two similar figures apart.
- A label sits inside its territory with a dark halo, anchored under its group so a push-in cannot carry it elsewhere.

## Real period images and non-map pages

- Real engravings and woodcuts are welcome as ONE material: cut-outs or soft vignettes inked as cream duotone, never a
  bright rectangular plate (`plagueShared.tsx` `MarmotVignette`, `public/plague/`). Uncoloured scans bake cleanly.
  Never replace a drawn subject with a full-frame antique map: dense linework buries the orange.
- A line that names no place stays on the umber page: engraved charts, timelines, balances, isotype rows, period
  objects. Charts carry weight (thick strokes, solid barbed arrowheads); compared bars share one dense hatch and wash.

## Old-paper overlay (thesis or callback line, or on request)

Transparent: a real 1596 de Bry leaf aged hard (`public/playbook/playbook-sheet.png`, `scripts/bake-playbook-paper.py`),
~820×1160, turned −1.5°. Diagram in sepia iron-gall ink, engraved manner; the play in `#D98A0C` as a pen draws it
(✕ start, route, flicked arrowhead, lasso), orange soaking in as hatching plus wash. No camera, outer 40 px at alpha 0,
the sheet slides up 24 px with a fade, then holds. Reference: `generated/components/GoToTheTop.tsx`.

## Still pan with a logo (only on request)

ONE opaque baked clip (still + pan + dim/blur + logo), slot length. Match both framings from the user's split clips in
the .prproj. One move first to last frame on a solved `cubic-bezier(0.8, 0, 0.2, 1)`, horizontal motion blur σ ≈ 0.22
× px/frame in the burst. The real logo, cream on a dark-umber roundel with a thin orange ring, anchored to the image,
pops in and leaves before the fast part; meanwhile the still sits at ~74% brightness under a ~5 px blur. Ending on the
logo mirrors it. Reference: `generated/components/EastIndiaHousePan.tsx`.

## Exemplars

- `generated/components/SouthManchuriaRailway.tsx`: the map look, railway symbol, orange gain (not its framing).
- `generated/components/AllAdultMales.tsx`: pacing; one transformation sweeps many figures under a steady pull-back.
- `generated/components/SteelAndHorses.tsx`: figures pull back into the map in one log-space move.

Name tag for portraits: `styles/name-tags.md`.
