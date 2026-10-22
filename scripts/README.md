# scripts

Run everything from the repo root.

| Where | What |
|---|---|
| `scripts/` | the tools below: `new-cut.mjs`, `check.mjs`, `review.mjs`, `preview-over-grey.sh`, `preview.config.ts`, `prproj_*.py`, `make_news_card.py` |
| `scripts/templates/` | one starting component per style, used by `bun run cut` |
| `scripts/textures/` | the house texture makers (below) |
| `scripts/maps/` | the shared map tool (`build.mjs`, `bake.mjs`, `lib/`, `configs/`); see `scripts/maps/README.md` |
| `scripts/maps/data/` | geo inputs several maps share |
| `scripts/maps/sets/<set>/` | an older map set's own scripts and bake-only data: only for re-baking that delivered map |
| `scripts/clips/<clip>/` | one-off bakes for one clip's cut: copy a pattern, never run another clip's for new work |
| `assets-src/` (repo root) | raw sources only bake scripts read; renders never copy it |

The Edit Board job pipeline lives in `pipeline/` (see `pipeline/README.md`). The director's Premiere, news-card and
stills procedures are skills in `.agents/skills/` (`premiere-project`, `news-card`, `stills-sourcing`).

## New cut

`bun run cut <Name> --clip <clip-slug> --style <dwarkesh|map|3d|chinatalk|cheeky-pint|core-memory|humble|sporttouchen|lovable|name-tag>
[--fps 24000/1001] [--seconds S | --frames N] [--wide] [--size WxH] [--overlay] [--tag <style>]` writes
`generated/components/<clip>/<Name>.tsx` from `scripts/templates/<style>.tsx` plus `src/Root.<Name>.tsx` and
`src/entry.<Name>.ts`, never overwrites, and prints the preview and final render commands. `--tag` is required for
`name-tag`; `--wide` and `--overlay` are refused where the style has no such product.

## Check

`bun run check` (or `--errors` for errors only): missing or uncommitted `staticFile()` assets, script imports and paths
that point nowhere, doc paths that do not exist, Root/entry mismatches (errors, exit 1); components nothing uses and
older takes a newer V<n> replaces (notes). The docs it reads: `README.md`, `AGENTS.md`, `CRAFT.md`, `styles/`, this
file, `scripts/maps/README.md`, `pipeline/README.md`, `kits/chinatalk/chinatalkVintage.md` and the three director
skills; backticked `kits/...` and `<clip>/...` paths resolve against `generated/components/`. It reads
`git ls-files`, so stage your paths first: run it after staging, before committing, and at the end of every clip.

## Review

- `review.mjs`: a contact sheet sampled evenly from a render, first and last frame included, over a checkerboard.
  `bun run review <scratch>/<name>.mov [--frames 9]` writes `<scratch>/review/<name>-contact-sheet.jpg`, next to its
  input. Prefix `KISE_TRANSPARENT=1` to require an alpha channel (overlays).
- `preview-over-grey.sh <file>.mov`: flattens a transparent render over `#141414` into `<file>-preview.mp4`. The
  checkerboard overstates faint elements; judge an overlay here.

## Premiere projects (.prproj)

All of them edit the saved project as text, with the project closed in Premiere. `prproj_assemble.py` and
`prproj_insert.py` refuse while Premiere runs unless `--allow-running` (use it only when a different project is open).
None invents a `BinaryHash`: every blob a new object needs is reused from the project (or a `--motion-donor`).
Times are sequence seconds unless stated. Keep temp copies in the scratchpad, never beside the real project. Stills
must be real JPEGs: check with `file` (a CDN `.jpg` can be WebP) and convert PNGs.

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

## House texture makers (`scripts/textures/`)

Deterministic and offline; run once, and commit what they write to `public/`.

- `build-brown-textures.py`: the stout grounds `public/cheekypint2/brown-b1.jpg` (B1, the default), `brown-b2.jpg`,
  `brown-b3.jpg`, from `assets-src/brown-paper.png`. Touches nothing else.
- `build-cheekypint2-textures.py`: `public/cheekypint2/grain.png` (the stout kit's grain), `card.png` and
  `speckle.png`. The `kraft-*.jpg` and `stout.jpg` it also writes belong to other looks; see `styles/cheeky-pint.md`.
- `build-china-paper-vintage.py`: the ChinaTalk newsprint, `public/china/paper_vintage.png`, `fibre_vintage.png` and
  `grain_0..3.png`, all read by `generated/components/kits/chinatalk/chinatalkVintage.tsx`.
- `build-china-paper.py`: `public/china/paper.png`, read only by the older stage in
  `generated/components/kits/chinatalk/chinatalkShared.tsx`.
- `bake-ulysses-ocean.py`: the realistic ocean textures in `public/ulysses/` for `kits/cheeky-pint/oceanShared.tsx`.
- `bake-playbook-paper.py`: the old-paper playbook leaf (`styles/dwarkesh-map.md`).

## Maps

A new history-clip map is one config: copy `scripts/maps/configs/example.mjs`, then
`bun scripts/maps/build.mjs scripts/maps/configs/<set>.mjs` and `bun scripts/maps/bake.mjs scripts/maps/configs/<set>.mjs`
(the bake alone, nothing else heavy running; it peaks near 1 GB). Details in `scripts/maps/README.md`; style rules in
`styles/dwarkesh-map.md`. The older sets in `scripts/maps/sets/<set>/` bake without memory pauses and can reach ~10 GB:
run one only when nothing else is rendering.
