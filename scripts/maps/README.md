# Map tool

A history-clip map is one config file. `build.mjs` writes the overlay data the cuts import (projection, regions clipped
to land with their inland edges, places, routes, framings); `bake.mjs` rasterises the static map (sea, water-lines,
graticule, land + rim, period water and borders, coast) into a tiled LOD pyramid. Style: `styles/dwarkesh-map.md`.
Code: `lib/projection.mjs`, `lib/geo.mjs` (Natural Earth, inputs, regions), `lib/data.mjs` (exports),
`lib/raster.mjs` (levels, tiles), `lib/config.mjs` (every config key, with comments).

## A new map

1. Copy `configs/example.mjs` (one world, ~50 lines) to `configs/<set>.mjs`; `configs/pearl.mjs` is the full two-world
   case. Set `name` (tile and module prefix),
   `dataDir` (`generated/components/<clip>`), `tileDir` (`public/<set>`), `textures: "public/manchuria"`.
2. Per world: `projection` (`lcc` fitted to the region by default; `albers` when areas are compared, `mercator` or
   `equalEarth` for oceans and the world; `scale: { span: [[lon, lat], [lon, lat]], px: 1080 }` sets how much of the
   map spans the frame at k 1, `anchor` where a point sits), `clip` (a lon/lat box well beyond every level: land is
   cut there with a false coast, and the bake warns if one shows inside a level), `borders.pairs` (period borders
   only), `lakes` (period water), and `regions(W)` built with `lib/geo.mjs` (`countryMP`, `featureMP` for
   `loadFeatures("scripts/maps/data/<x>.geojson")`, `llPoly`, `union` / `inter` / `diff`, `toLand`, `clean`).
3. `data.exports`, in order: `{ name, region }`, `{ name, places }`, `{ name, route }`, `{ name, value }` (see the top of
   `lib/data.mjs`); `comment` and `types` head the module.
4. `levels`: a base level (`band: null`) over the whole extent for the wides, finer levels only where the camera goes
   close; `rects` hold every view taken in the level's band, `s` >= the largest k it serves (~1-1.25 texels per screen
   px), `kBake` ~1.4x the band's start (as in pearl; see `lib/raster.mjs`).

```bash
bun scripts/maps/build.mjs scripts/maps/configs/<set>.mjs                    # seconds; throws on a failed check
bun scripts/maps/bake.mjs  scripts/maps/configs/<set>.mjs                    # heavy: alone, one world at a time if big
bun scripts/maps/bake.mjs  scripts/maps/configs/<set>.mjs asia --levels a0   # just these tiles, no levels module
bun scripts/maps/build.mjs scripts/maps/configs/<set>.mjs --out /tmp/x       # write under /tmp/x (tests)
```

Outputs: `<dataDir>/<data.file>` per world; `<tileDir>/<world>-<level>-<col>-<row>.png` (1024 + 2 x 2 px) plus the
copied `mottle.png` / `grain.png`; `<dataDir>/<name>Levels<World>.ts` and the index `<dataDir>/<name>Levels.ts`
(`<Name>Level`, `<NAME>_LEVELS_<WORLD>`, `<NAME>_TILE`, `<NAME>_PAD`). Commit all of them with the clip.

## The clip kit

`<clip>/<clip>Shared.tsx` copies the map half of `sarah-pearl-harbor/pearlShared.tsx` (`runCamera`, `WorldSvg`,
`MapBase`, `MapPage`): change its `./pearlLevels` import to `./<name>Levels`, the `LEVELS` record to your worlds, and
`staticFile("pearl/...")` to your `tileDir` without `public/`. Cuts import `project`, regions, places and `FRAMINGS`
from the world's data module and draw them inside `<WorldSvg cam>` over `<MapPage world cam>`.

Delivered sets keep their own scripts in `sets/<set>/` (only to re-bake those maps); `configs/pearl.mjs` reproduces
`sets/pearl/` exactly (cut data such as `allOfChinaData.ts` stays in its own script).
