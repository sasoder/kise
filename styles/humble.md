# Humble Co. style

Follow CRAFT.md. This file holds only what is specific to The Humble Co. (a Swedish oral-care brand).

When a job says Humble, Humble Co or Humble Company, build to this without re-asking. The graphics are transparent
overlays that the editor drops onto the footage.

## Look

| Token | Hex | Use |
|---|---|---|
| PURPLE | `#7970b4` | fills and panels: the state that has happened |
| WHITE | `#FFFFFF` | outlines, type, icon ink |

- Use these two colours and nothing else: no black, no grey, no tints or opacity steps of the purple, no gradients,
  no glows, no drop shadows.
- Transparent overlays (ProRes 4444) with no background, paper or grid.
- Shapes are rounded and friendly. Either white 8 px outlines that the purple fills flush, or solid purple panels with
  white type. Clip the fill under the stroke so it meets the outline's inner edge.
- Round every join with a fillet. No sharp corners.

## Type

- Neulis Cursive Bold only: `public/NeulisCursive-Bold.otf`. Load it with `@remotion/fonts` `loadFont` + `staticFile`
  + `delayRender`, copying the block at the top of `generated/components/kits/name-tags/NameTagHumble.tsx`.
- Use proper capitalisation and letter-spacing 0.
- Copy is Swedish, in sentence case ("För hårt", "Fel vinkel", "Tandläkare").

## Icons

- One family on Lucide's grammar: a 24 grid, stroke 2, round caps and joins, no fill. Draw it x4 in a 96 px box, so
  strokes are 8 px and match the outlines. White, on or inside the purple.
- Lucide has no toothbrush. Reuse the glyph in `generated/components/kits/clients/BrushingMistakes.tsx`: a plain closed head, a
  tight four-bristle tuft at a 2.5 pitch, and a handle that rises 10°. Change one modifier per icon: a splayed tuft
  for "too hard", an angle arc for "wrong angle", speed lines for "too fast".
- A slotted head with spaced bristles reads as a table, and a tooth crown is a jumble at phone size. Avoid both.

## Motion

- Entrances slide up while fading in, on `Easing.bezier(0.16, 1, 0.3, 1)`. Use 24 px for a graphic or a text line and
  16 px for an icon. Nothing pops.
- A fill is one continuous flow on `Easing.bezier(0.65, 0, 0.35, 1)` with a plain vertical front (no meniscus, no
  wave).
- The purple fills first. The icon rises in, overlapping the end of the fill.
- No camera move and no idle motion. End on a long static hold that the editor trims (BrushingMistakes holds for
  15 s per step).
- FPS = the sequence's rate (CRAFT.md); Humble sequences are usually 30 fps.

## Multi-point graphics

- The start state is all white and hollow, so the footage shows through.
- Make one clip per spoken point, chosen by a prop (`step` in BrushingMistakes) and numbered in order.
- Each clip's first frame must be pixel-identical to the previous clip's last frame. Use clamped interpolation so the
  rest values are exact, and compare the decoded .movs.

## Options rounds

When the user asks for options:
- build one component with a `variant` prop;
- render real stills of the final state in this font and these colours, over a warm mid-tone stand-in and over a
  light backdrop;
- add a 270 px-wide phone check.

Once the user picks one, remove the other variants from the component and build the per-point clips.

## Exemplars

- `generated/components/kits/clients/BrushingMistakes.tsx`: the three-point tube timeline. The outline enters, purple flows through
  the tube station by station, and a toothbrush icon rises in each station (`step` 1–3).
- `generated/components/kits/name-tags/NameTagHumble.tsx`: the name tag. See `styles/name-tags.md` for its size and position.

## Don't

- Don't take style from the Humble Premiere projects, the Humble brand book or `~/.colleague` notes. The green and
  white cards there are not the Humble look.
- Don't copy `generated/components/kits/clients/ToothPieChart.tsx`. It is not this style (a dark background and a second purple).
- Don't use the core-memory chain colours, Barlow or the house amber `#FFB000`.
- To find Humble pieces in the source, search for `Neulis` or `7970b4`.
