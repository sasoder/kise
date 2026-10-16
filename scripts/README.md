# scripts

The reusable tools. Run them from the repo root. Every script not listed here is a one-off named after its clip or cut
(`build-<x>-map.mjs`, `bake-<x>-rasters.mjs`, `build-<x>-sfx.mjs`, `bake-<x>.py`, `check-<x>.ts`, `render-<x>-*.sh`,
`_*_<Cut>.tsx`, and their `*.json` / `*.geojson` inputs): copy a pattern from one, but never run or edit another clip's
for new work. The Edit Board job pipeline lives in `pipeline/` (see `pipeline/README.md`).

## Review

- `review.mjs`: a contact sheet sampled evenly from a render, first and last frame included, over a checkerboard.
  `bun run review <file>.mov [--frames 9]` writes `out/review/<name>/<name>-contact-sheet.jpg`. Prefix
  `KISE_TRANSPARENT=1` to require an alpha channel (overlays).
- `preview-over-grey.sh <file>.mov`: flattens a transparent render over `#141414` into `<file>-preview.mp4`. The
  checkerboard overstates faint elements; judge an overlay here.

## Premiere projects (.prproj)

All of them edit the saved project as text, with the project closed in Premiere. `prproj_assemble.py` and
`prproj_insert.py` refuse while Premiere runs unless `--allow-running` (use it only when a different project is open).
None invents a `BinaryHash`: every blob a new object needs is reused from the project (or a `--motion-donor`). Times are sequence seconds unless stated. Keep temp
copies in the scratchpad, never beside the real project. Stills must be real JPEGs: check with `file` (a CDN `.jpg`
can be WebP) and convert PNGs.

Order:

1. `prproj_normalise.py IN.prproj OUT.prproj`: only when another tool re-serialised the project. Restores Premiere's
   own layout so the block splitters below work; asserts the parsed tree is unchanged.
2. `prproj_cut.py in.xml out.xml '[[f0,f1],...]'`: shortens a one-clip-per-track sequence. Works on the gunzipped XML
   (gzip the result back to `.prproj`); KEEP ranges in sequence frames at the sequence's own rate. Splits every linked
   V/A item into pieces of the same media, so handles stay. Default component chains only (no Motion or effects).
3. `prproj_assemble.py SOURCE.prproj assembly.json OUT.prproj [--sequence NAME] [--motion-donor DONOR.prproj]`:
   graphics, stills and b-roll in one pass, written to a NEW project (SOURCE is only read) plus an `OUT.xml` xmeml
   fallback. The full `assembly.json` format is in its docstring. Graphics go in at default Motion, media from 0.
   For stills leave out `scale`, `pos` and `xfade_*`: the whole image, centred, static, hard cuts. V1 is refused.
   Idempotent: re-run with the previous OUT as SOURCE. B-roll sharing a track with stills goes in a second run.
   `--motion-donor` (a Premiere-saved project) supplies the Motion blob when SOURCE's clips all use default Motion.
   This is the only tool for Edit Board jobs, which always write a new versioned `.prproj`.
4. `prproj_insert.py PROJECT.prproj placements.json [--track 1] [--size 1080x1920 --source-scale 177.777786254883]`:
   graphics only, `[{"path", "in", "out"}]`, written IN PLACE after a backup to `<project dir>/old/`. `--size` switches
   the sequence frame and `--source-scale` fills V1 with 16:9 media. Use it when `prproj_assemble.py` cannot find a
   Motion blob even with a donor. Not for Edit Board jobs.
5. `prproj_insert_stills.py SOURCE.prproj placements.json OUT.prproj --image-dir DIR [--track 2]`: stills only, fitted
   whole and centred, to a new project. `prproj_assemble.py` builds on it; call it directly only for a stills-only job.

## News card

`python3 scripts/make_news_card.py OUT.png "SOURCE" "Month D, YYYY" "Headline" photo.jpg ["Photo: credit"] [crop_y]`:
a 1080x1080 RGBA PNG of a real modern article (orange dash, source, date, headline in Inter Display Bold, the article's
own photo cover-cropped at `crop_y` 0..1). Needs the Inter variable font in `~/Library/Fonts`. Name it
`newscard_<outlet>_<topic>.png`. A historical event gets the plain newspaper scan instead of a card.

## House texture bakers

Deterministic and offline; run once, and commit what they write to `public/`.

- `build-brown-textures.py`: the stout grounds `public/cheekypint2/brown-b1.jpg` (B1, the default), `brown-b2.jpg`,
  `brown-b3.jpg`, from `public/brown-paper.png`. Touches nothing else.
- `build-cheekypint2-textures.py`: `public/cheekypint2/grain.png` (the stout kit's grain), `card.png` and
  `speckle.png`. The `kraft-*.jpg` and `stout.jpg` it also writes belong to other looks; see `styles/cheeky-pint.md`.
- `build-china-paper-vintage.py`: the ChinaTalk newsprint, `public/china/paper_vintage.png`, `fibre_vintage.png` and
  `grain_0..3.png`, all read by `generated/components/chinatalkVintage.tsx`.
- `build-china-paper.py`: `public/china/paper.png`, read only by the stage in `generated/components/chinatalkShared.tsx`.
  Not part of the ChinaTalk look.

## Maps

Each history clip gets its own map pipeline: `<x>-geo.json|mjs` → `build-<x>-map.mjs` → `bake-<x>-rasters.mjs` →
`generated/components/<x>Shared.tsx`. Copy the newest set (`pearl-geo.mjs`, `build-pearl-maps.mjs`,
`bake-pearl-rasters.mjs`). Projection, borders, rasters and performance rules are in `styles/dwarkesh-map.md`.
