# Lovable style

Follow CRAFT.md. This file holds only what is specific to the client Lovable.

There is no user-approved Lovable style profile yet. What follows is what the delivered pieces share. Build from it
and match the exemplars. When a choice is not covered here, it is the director's call, not a rule.

## Look

| Token | Value | Use |
|---|---|---|
| BLACK | `#1B1B1B` | cards, dark grades |
| CREME | `#F7F4ED` | type, the wordmark letters |
| PAPER | `#FCFBF8` | light fills (the slider knob) |
| GRADIENT | 90°, `FULL_STOPS` in `generated/components/LovableHotOrNot.tsx`: `#4F88FF` 0, `#CEAFFB` 0.33, `#FD49A8` 0.52, `#FA2733` 0.71, `#FF8F1B` 1 | the accent: bars, tracks, highlights |

- The gradient is the only colour. Everything else is BLACK, CREME, PAPER and black-and-white footage.
- Copy `FULL_STOPS` (all eleven stops) and the `FULL` string from LovableHotOrNot.tsx. Don't retype a shorter
  gradient.
- Wordmark: the heart plus "lovable" SVG, inlined as `Wordmark` in LovableHotOrNot.tsx. The heart is a radial
  gradient (`#FE7B02`, `#FE3F21`, `#F858BC`, `#575ECF`) and the letters are `currentColor` (CREME). Reuse that SVG;
  never redraw it.
- Materials:
  - a BLACK card with radius 44, a soft drop shadow and a CREME hairline inset at 0.08 (HotOrNot);
  - a 12 px gradient bar under a name (MaxIntro);
  - footage graded to black and white behind the type.

## Type

- Camera Plain, variable: `public/fonts/CameraPlainVariable.ttf` (weights 400–900). Load it with `@remotion/fonts`
  `loadFont({family: 'LovableCameraPlain', url: staticFile('fonts/CameraPlainVariable.ttf'), weight: '400 900'})`.
- Big name: 800, tracking -0.035em (MaxIntro sets "Max" at 250 px).
- Headline: 600, tracking -0.035em, line-height 0.98.
- Subtitle: 500, tracking -0.01em.
- Eyebrow: 500, caps, tracking 0.02em, CREME at 0.6.

## Format

- Lovable clip folders are `tom fant/lovable/<month>/<name>/`.
- The format changes from project to project. Before building, read the sequence's FrameRect and the V1 clip's Motion
  (Scale, Position, Rotation), and match them exactly.
- Full Stack Fika is a 1080x1080 sequence. The 9:16 footage sits at Scale 102, Position y 0.526 and Rotation -1. The
  editor's captions fill y 830–1080, so keep that band dark and empty.

## Exemplars

- `generated/components/MaxIntro.tsx`: a freeze-frame guest intro (opaque, 1:1), built as follows.
  - The footage starts at the editor's placement, then punches in on the guest on his name and freezes.
  - The colour drains to black and white.
  - The big first name, the gradient bar and the title slide up from behind masks, left-lower. The wordmark sits
    top-left.
  - A slow continuous push-in holds until the hard cut.
  - Source frames live in `public/lovable/fika1/src/` (local only, gitignored).
- `generated/components/LovableHotOrNot.tsx`: a transparent quiz overlay that runs for the whole cut, built as
  follows.
  - A BLACK card holds the eyebrow ("HOT OR NOT · 01") and the wordmark.
  - A CREME headline swaps per question.
  - A knob on a gradient track swings to HOT or NOT on the answers. Its halo colour is sampled from the gradient
    under the knob.
  - The NOT and HOT labels take the gradient's two end colours.

## Rules from delivered work

- Freeze frames and punch-ins built from the user's footage only match it when the frames and the render are set up
  this way:
  - extract untagged PNGs (ffmpeg
    `-vf "...,format=rgb24,setparams=color_primaries=unknown:color_trc=unknown:colorspace=unknown"`);
  - render with `--color-space=bt709`.
- A guest's surname and title are often not in the audio. Ask; never guess.
- For a guest name card, see `styles/name-tags.md`. Lovable has no lower-third tag yet.
