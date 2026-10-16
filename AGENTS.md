# kise: agent contract

kise is the user's Remotion (React) harness for the animated graphics in their podcast and history clips: a directing
agent briefs builders, and each builder writes and renders one cut. Remotion only; ignore HyperFrames and any video
skill that calls itself the entry point. The director's workflow (project reading, storyboards, dispatch, reviews,
stills, Premiere assembly) lives in the director's memory; builders follow their brief and this file.

## Read before building

1. This file, then `CRAFT.md`: the craft rules for every style. It wins on anything cross-style.
2. The one `styles/<style>.md` the brief names, the kit file it names, and any file the brief names.
3. Only the `.agents/skills/remotion-best-practices/` files the job needs: its `SKILL.md`, then e.g.
   `remotion-markup/timing.md`, `remotion-markup/google-fonts.md` or `remotion-markup/local-fonts.md`,
   `remotion-render/transparent-videos.md`.

Nothing else. Do not browse old cuts, other kits or other styles unless the style file or the brief names them.

## Styles

| The user says | Style file | Kit to import (`generated/components/`) | Reference cuts (`generated/components/`) |
|---|---|---|---|
| "Dwarkesh style", "orange Dwarkesh" | `styles/dwarkesh.md` | `kits/dwarkesh/fieldShared.tsx`, `kits/dwarkesh/brandGlyphs.tsx` | `ajeya-superhuman-hackers/MoreThanAllOfHistory.tsx`, `jcb-experience/MillionsOfYears.tsx`, `noam-alignment/HonestyGoesUpV2.tsx` |
| "map style", any history clip | `styles/dwarkesh-map.md` | the clip's own `<clip>/<clip>Shared.tsx` on the `sarah-pearl-harbor/pearlShared.tsx` pattern; figures on `kits/maps/texcocoFigures.tsx` | `sarah-winning-battle-vs-war/SouthManchuriaRailway.tsx`, `sheppard-capture-not-kill/AllAdultMales.tsx`, `sheppard-conquistador-advantages/SteelAndHorses.tsx` |
| "ChinaTalk style" | `styles/chinatalk.md` | `kits/chinatalk/chinatalkVintage.tsx` (API: `kits/chinatalk/chinatalkVintage.md`) | `logan-brezhnev/SovietEconomicDecline.tsx`, `logan-brezhnev/TechnologyAllocates.tsx`, `logan-brezhnev/BrezhnevChoseDecay.tsx` |
| "Cheeky Pint style" | `styles/cheeky-pint.md` | `kits/cheeky-pint/stoutShared.tsx`; at sea `kits/cheeky-pint/oceanShared.tsx` | `toto-mercedes-financials/BillionInRevenueStout.tsx`, `meta-talent-density/TalentDensity.tsx`, `will-guinness-ttest/InsideThePint.tsx`; at sea `will-hunting-mines/HuntingMines.tsx` |
| "core memory podcast style" | `styles/core-memory.md` | `kits/core-memory/deathCountShared.tsx` (9:16), `kits/core-memory/cerroShared.tsx` (16:9) | `joel-oil-companies-solar/PeakForSolar.tsx`, `brent-death-count/RockCollapsedReports.tsx`, `brent-death-count/ZeroedItDown.tsx`; sting `kits/core-memory/VastLogoChannelSplit.tsx` |
| icons to animate | `styles/icon-loops.md` | `kits/core-memory/coreMemoryIcon.tsx` (core memory look only) | `kits/core-memory/WormholeIconLoop.tsx`, `joel-hyperscalers-solar/ServerIconCoreMemory.tsx` |
| name tag, lower third | `styles/name-tags.md` | the style's tag component | `kits/name-tags/NameTagStout.tsx`, `kits/name-tags/NameTagNewsprint.tsx`, `kits/name-tags/NameTagMapStyle.tsx` |
| Humble, Humble Co. | `styles/humble.md` | none; font block from `kits/name-tags/NameTagHumble.tsx` | `kits/clients/BrushingMistakes.tsx` |
| Sporttouchen | `styles/sporttouchen.md` | none; font block from `kits/clients/SporttouchenTimer.tsx` | `kits/clients/SporttouchenTimer.tsx`, `kits/clients/SporttouchenQuiz.tsx` |
| Lovable | `styles/lovable.md` | none; `FULL_STOPS`, `Wordmark` from `kits/clients/LovableHotOrNot.tsx` | `kits/clients/MaxIntro.tsx`, `kits/clients/LovableHotOrNot.tsx` |

## Build contract

- Use `bun` and `bunx`, never npm or npx. Dependencies are installed; never install or upgrade a package.
- Folders: shared kits live in `generated/components/kits/<style>/`; each clip has its own folder
  `generated/components/<clip>/` (lowercase slug such as `sarah-death-ground`) for its cuts and its own world files.
  Import kits from the clip folder as `../kits/<style>/<kit>`.
- Start every cut with `bun run cut`. It writes `generated/components/<clip>/<Name>.tsx` from the style's template
  (kit imports, ground, fonts, camera, exports, header skeleton, one centred marker to delete) plus its render entry
  `src/Root.<Name>.tsx` + `src/entry.<Name>.ts`, never overwrites, and prints the preview and final commands:

  ```bash
  bun run cut KingStillThere --clip sarah-death-ground --style map --fps 24 --seconds 9.792
  ```

  Styles: `dwarkesh`, `map`, `chinatalk`, `cheeky-pint`, `core-memory`, `humble`, `sporttouchen`, `lovable`,
  `name-tag --tag <style>`. `--frames N` instead of `--seconds`; `--wide` composes a 16:9 trailer at 2048x1080
  (CRAFT.md Format); `--size WxH` another frame (Lovable); `--overlay` a transparent overlay. Only when no template
  fits, write the Root and entry by hand: several people's tags in one Root on `src/Root.NameTagMapStyle.tsx` (one
  composition per person); icon loops (no `bun run cut` style; In + Loop per icon, `styles/icon-loops.md`) on
  `src/Root.CoreMemoryIcons.tsx` + `src/entry.CoreMemoryIcons.ts`.
- One component per cut, PascalCase, named for the idea. It renders an `AbsoluteFill` root driven only by
  `useCurrentFrame()`, `interpolate()`, `spring()` and `Easing` (no CSS animation, timers or `Math.random()`; use
  Remotion's `random(seed)`). It exports `FPS`, `DURATION`, a Zod `schema`, `defaultProps = schema.parse({...})` and
  the component as default. Its header comment holds the Check line, the spoken line, the word → frame table, the
  `DURATION` derivation, the motion in two or three sentences, and the source of every real figure.
- `FPS` = the Premiere sequence's rate (23.976 is `24000 / 1001`); `DURATION` = the slot's in → out × `FPS`. 1080x1920
  unless the brief asks for 16:9. Opaque full frame unless the brief asks for an overlay.
- Fonts come from the style file: Google fonts via `loadFont()` from `@remotion/google-fonts/<Font>` at module scope
  (use the `fontFamily` it returns); local OTF/TTF via `@remotion/fonts` `loadFont({family, url: staticFile('<file>')})`
  at module scope. Assets live in `public/<clip>/` (map tiles: the config's `tileDir`), load through `staticFile()`
  and are committed with the cut. Raw sources that only a bake script reads go in `assets-src/<clip>/`, not
  `public/`: every render copies all of `public/`.
- Never edit another cut's files, `src/Root.tsx`, or a kit a style file names. Ask the director for a kit addition.

## Render

`remotion.config.ts` sets ProRes 4444, PNG frames and `yuva444p10le` for finals; never override them. Previews are
half-res H.264 in your session scratchpad (never `out/` or a clip folder) through the committed
`scripts/preview.config.ts` (h264, JPEG frames, yuv420p).

```bash
bunx remotion render src/entry.<Name>.ts <Name> <scratch>/<Name>.mp4 --config=scripts/preview.config.ts --scale=0.5 --concurrency=4
bunx remotion render src/entry.<Name>.ts <Name> <scratch>/<Name>.mov --muted --concurrency=4   # final
ffprobe -v error -show_entries stream=codec_type -of csv=p=0 <scratch>/<Name>.mov              # prints only: video
bun run lint                                                                                    # must pass
git add <your paths> && bun run check --errors   # 0 errors in your own files (check reads git ls-files, so staged files count)
```

- Run the checks in CRAFT.md on the preview and iterate. Then stop and report the preview path, the key frames and
  anything that did not work, unless the brief says to finalise (final render, delivery, git).
- `bun run check` errors in other sessions' files are not yours to fix; report them.
- Add only the flags CRAFT.md, the style file or the brief call for (`--color-space=bt709`, `--scale 2`,
  `--gl=angle`). Several builders share one 36 GB Mac, so every render uses `--concurrency=4` and renders never run
  in parallel within one builder. For an overlay, confirm the alpha with
  `KISE_TRANSPARENT=1 bun run review <scratch>/<Name>.mov` (the sheet lands in `<scratch>/review/`).

## Deliver

- Copy the final into the working folder the brief names as `<inSeconds>_<Name>.mov`: the whole second the cut comes
  in at, floored, no padding (`15_BackIntoIt.mov` for 00:00:15.480). Only the `.mov`; never delete anything.
- A new version takes the original name, because Premiere links by path: move the delivered file to
  `old/<inSeconds>_<Name>_V<n>.mov` beside it (next free n, `mv -n`), then copy the new render in under the original
  name. Keep the frame count unless the brief changes the length. The one exception is the `cold-review` skill, which
  delivers `<inSeconds>_<Name>_V2.mov` for the track above.

## Git

- One branch: local `main` tracks `origin/tom/consolidated` with `push.default=upstream`, so a bare `git push` is
  right. Never create a branch or worktree, and never change that config. Other sessions commit here at the same
  time: stage explicit paths only (never `git add -A`, `git add .` or `git commit -a`), and leave others' files alone.
- After each finished cut, commit its component, Root/entry pair and every asset or data module it reads, then push:
  `git add <paths> && git commit -m "Add <Name>: <what the picture does> (<clip>, cut <inSeconds>)" -- <paths> && git push`
- **Edit Board jobs** (a message that starts with `EDIT BOARD JOB`): commit but never push. Premiere output goes to a
  new versioned `.prproj` written by `scripts/prproj_assemble.py`; never modify an original `.prproj`. Their other
  limits are in `tom fant/CLAUDE.md`, two folders above this repo.

## Safety

- Kill processes by exact PID only: `pgrep -fl '<specific full path>'`, check by eye, `kill <pid>` (`kill -9` for a
  stuck render's node, compositor and chrome-headless-shell). Never `pkill`, `pkill -f` or `killall` with a pattern: on
  macOS a pattern kill takes down the user's open apps and every running agent.
- Never open, drive or quit Premiere or any other app of the user's. Work from the local files the brief hands you; if
  an asset is missing, say so instead of downloading it.
