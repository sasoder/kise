# Core memory podcast style

Follow CRAFT.md. "Core memory podcast style" names more than one product. Pick by the request:

| Request | Product | Where |
|---|---|---|
| Transcript or SRT plus "core memory podcast style" / "core memory graphic" | Opaque explainer graphic on squared paper | The graphic standard |
| "Text only", a title, a logo, a mark, "OUT NOW", a place name | Transparent logo or type sting | The text-only sting |
| Icons to animate in this style | Icon In clip + Loop clip | styles/icon-loops.md, core memory look |
| On a Core Memory clip: "blend in with the footage", "more realistic", "not core memory style" | Photoreal, footage-matched cut | Footage-matched variant |

Name tag: `generated/components/NameTagCoreMemory.tsx` (see styles/name-tags.md).

## The graphic standard

### Look

| Kit token | Hex | Job |
|---|---|---|
| `INK` / `WHITE` | `#FFFFFF` | The ink. Every subject is white: the material, the money, the people, the record |
| `SHADOW` / `BLACK` | `#000000` | The hard shadow, and black marks printed on white |
| `ORANGE` | `#FFB765` | Chain colour, back of the stack |
| `PURPLE` | `#BC37FF` | Chain colour, middle |
| `BLUE` | `#0046FF` | Chain colour, directly under the core |
| `PAPER_BASE` | `#C0C0C0` | Root fill behind the paper photo |

- **Ground:** `public/paper-supaclean-still.png` (real squared paper, 3864×2164 landscape). Turn it 90° at 9:16; use
  it unrotated at 16:9. Apply `brightness(0.88) blur(3px)` in screen px, to the image only. The paper sits on its own
  plane: parallax 0.15 in both axes, drifting 0.3 px per frame upward, scale `1 + (k − 1) × 0.3`. Never show it above
  1.0× of source, or the squares go soft. Never invert it, and never use the Dwarkesh grid image.
- **Hard shadow:** every white element sits on a pure black copy of itself at +4/+4 world px (`SHADOW_OFF`), zero blur.
  Draw it as an SVG copy, never as a CSS `drop-shadow`. Never put an outline, casing or stroke around a white element,
  even where it crosses another white element. The shadow copy is the only separation.
- **Raw colour:** no bloom, glow, gradient, `mixBlendMode` or `saturate()`. A chain layer never fades: it exists or
  it does not.
- **Weight:** one line weight (`STROKE`, 6 world px); one opacity ladder (`OP_FULL` 1.0, `OP_MID` 0.55, `OP_LOW` 0.3).
- **Type:** Barlow 800–900, uppercase, white on the hard shadow (`fontFamily`, `type()`, `ShadowText`). Start from
  PeakForSolar's sizes: labels 56, numeral ~190, tag 44 world px.

### Kit

There is no single core-memory kit. The Brent modules are the base. Import from them and never copy-paste the paper or
chain code. A new clip's own shared module imports its base from here.

- **9:16:** `generated/components/deathCountShared.tsx` re-exports the base and adds `TallPaper` (portrait ground),
  `WorldTall` / `worldTransformTall` (world layer; `blurX` = horizontal-only blur for a fast pan), `Figure`, `gridPos`,
  `Newspaper` and `CaptionStripDebug` (preview aid). `PAPERS_NUMBER` is that clip's data.
- **16:9:** `generated/components/cerroShared.tsx` provides `PaperGround`, `World`, `worldTransform169` and
  `camMove169`. Everything from `SECTION_PROFILE` down is that clip's mine section, not the style. Recompose for the
  width (a grid or a wider layout): a centred phone column leaves two-thirds of a 16:9 frame empty.
- **Base (both):** the tokens above, `CHAIN`, `SHADOW_OFF`, `STROKE`, `OP_*`; `EASE_LAND`
  (`Easing.bezier(0.16, 1, 0.3, 1)`), `CHAIN_TRAVEL` 22, `CHAIN_STAGGER` 2, `CROWN_STEP` 12; `Inked`, `ShadowText`,
  `RiseText` / `textRise` (24 screen px up while fading in, 12 frames), `ChainEcho`, `Person`; `runCamera2` (damped
  x/y/k tracker). deathCountShared re-exports all of these except `Inked` and `Person`: import those two from
  `generated/components/cerroShared.tsx`.
- Both kits export an `FPS` from their own clip. Ignore it and set each cut's FPS from its own sequence.

### Visual language

- Build each picture as one mechanism made of a few flat white glyphs: people, bars, sheets, word-bars (for
  language), dots. Word-bars stay white: black bars read as redaction.
- **People:** `Person` (`public/person.png` tinted white) or `Figure` (vector bust). Solid = counted; hollow outline =
  the "up to" part of a range. Counts sit in rows of ten (`gridPos`). Each figure rises from behind its own row rule
  and sinks back the same way. Never file figures along the rows, or they cross.
- **Black on white** is for print and for silhouettes under white rubble. It gets no shadow
  (`Figure shadow={false}`). Make black marks solid, because hollow outlines get lost among the shadow edges.
- **Glyphs:** chunky, never spindly (thin sticks read as combs or sunbursts). Hanging things hang under gravity.
- **Newspaper:** the masthead is a black bar. Name the paper only when it is verified.
- **Chat UI:** frame it like a phone. The input capsule (with its send button) is the floor of the picture, clear of the
  caption bands; messages stack up from it, and the camera pulls back from there. User messages are white pills with
  black Barlow text; replies are word-bars written behind a caret.
- **Labels:** Core Memory edits carry burned-in captions, so never add a depth, count or name label the speaker says.

### The chain echo

The chain is a gesture, not the entrance. Most elements sit flat, with only the hard shadow.

- Give the chain ONE meaning for the whole clip, and write it into the clip's shared-module legend. Examples: the peak
  (PeakForSolar), the retelling (deathCountShared), the copy of the speaker's data that leaves (cottageShared).
- Use it sparingly. It marks the cut's payoff, usually one moment where a word calls for emphasis, arrival, motion or
  multiplication.
- The echo is the shape's own silhouette, stacked orange (back), then purple, then blue, then the white core. The black
  shadow sits behind the core only and follows the core's timing. `ChainEcho` does this.
- At rest the echo is a CROWN: copies in the same column, each `CROWN_STEP` further along `dir` (up by default). Never
  fan the copies out beside the shape, where they collide with the neighbour's shadow.
- Forms: a rise (`order="colorsLead"`), a drop or trail (`order="coreLeads"`), colours peeking from behind a static
  shape (`core="static"`), one colour splitting off, copies stepping out from behind a shape (ZeroedItDown's "30").
- A fast mover's trail stays a crown: let the steps open with speed to about 26 px. A fixed frame lag spreads into wide
  stripes that read as a flag.
- Copy the shape only, because text riding on a colour band reads as another object. For a ring, clip the echo copies
  to the area outside the ring.
- On multi-line text, crown only the top line: stacked crowns stripe. A thin arch takes the crown as three touching
  thin stripes.

### Exemplars

- `generated/components/RockCollapsedReports.tsx` (9:16, deathCountShared): a mine section, figures turning solid under
  rubble, a peaked pan with blur to a newspaper, a solid/hollow count.
- `generated/components/ZeroedItDown.tsx`: the count shrinks; a plain white strike on the hard shadow; chain copies
  step out of the struck number.
- `generated/components/PeakForSolar.tsx`: a bar chart with the crown on the peak bar, and the reference for paper,
  shadow and crown geometry. Take framing, frame rate and camera from CRAFT.md, not from its header.
- At 16:9: `generated/components/GhostTownForSale.tsx` on cerroShared.

## The text-only sting

A logo, word or title enters as copies of its own silhouette in the chain colours (sampled from the CORE MEMORY logo,
`public/core.png`), sliding up into place one after another. The copies end perfectly stacked, so only the white core
shows. It is a transparent overlay over footage.

- **Layers,** back to front: black shadow, orange, purple, blue, white core. All copies land at the same position and
  scale.
- **Timing:** orange f0, purple f2, blue f4, core f6. Each layer slides up 130 px over 22 frames on
  `Easing.bezier(0.16, 1, 0.3, 1)`. Nothing fades: a layer is not rendered before its start frame.
- **Shadow:** a zero-blur black copy of the core, offset down and right. It rides with the core at the very back, so it
  never darkens the colours. Offset it about 1.8% of the artwork's size for chunky glyphs, about 1% or less for thin
  open strokes.
- **PNG artwork:** never recolour the bitmap. Use its alpha as a CSS `mask-image` over a flat `backgroundColor`, one
  node per layer.
- **Type:** Barlow 900, uppercase, with the same text node rendered once per layer.
- **Long rest** (a loop or long hold): stop rendering the colour layers once blue lands, or the antialiased edges leave
  a coloured fringe (see `LAST_COLOR_LAND` in `coreMemoryIcon.tsx`).

Exemplars: `generated/components/VastLogoChannelSplit.tsx` (PNG logo, the canonical sting),
`generated/components/OutNowCoreMemory.tsx` (a word), `generated/components/DesertSunlightCoreMemory.tsx` (a two-line
place title with a pin drawn on every layer).

Never copy `NameTag.tsx`, `AngryIconChannelSplit.tsx`, `CoreLogoChannelSplit.tsx`, `MicrobeIconChannelSplit.tsx` or
`IngredientJarCoreMemory.tsx`. They use a different, converging effect with bloom, screen blend and `saturate()`.

## Footage-matched variant

Use this only when asked. It is for a graphic on a Core Memory clip that has to blend in with a b-roll shot or a
picture, and it is photographic, not paper.

- **Reference:** `generated/components/DownTheShaft.tsx`. The editor's real clip plays untouched, then the camera
  moves into a photoreal plate baked from the footage's own frames (`scripts/bake-down-the-shaft.py`, assets in
  `public/cerro/shaft/`), with a clean white readout in Barlow Condensed.
- Lock the plate to the footage's measured motion. Keep it photographic: real footage on top, sliced real rock below.
  A stylised dark field with glowing passages does not blend. Colour match: CRAFT.md, Graphics built from real footage.
