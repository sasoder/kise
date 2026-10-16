# ChinaTalk style (newsprint)

Follow CRAFT.md. "ChinaTalk style" is a quiet newspaper page: greyish newsprint, newspaper-black ink, one letterpress
red, and real photographs set as clippings. It should feel like a newspaper without distracting from the picture.

## Kit

- Import everything from `generated/components/kits/chinatalk/chinatalkVintage.tsx`; the one exception is the crowd field mechanics
  (`hash`, `feather`, `wobble`, `makeTone`) from `generated/components/kits/dwarkesh/fieldShared.tsx` (Visual language). Its API,
  every token and the traps are in `generated/components/kits/chinatalk/chinatalkVintage.md`. Read that file before you write a line.
- Never import `generated/components/kits/chinatalk/chinatalkShared.tsx`. The kit builds on it internally, but it holds other colours, weights and a
  lifted camera under the same names. Never copy the imports of a cut that uses it.
- Do not hand-set a colour, stroke width or font size that the kit defines. If a cut needs a new part, ask the
  director to add it to the kit.
- `generated/components/kits/chinatalk/VintageKitSheet.tsx` shows every part in use.

## Look

- **Page:** `VStage` draws the newsprint: `V_PAPER #EDE7D9`, visible fibre and specks, one faint fold crease,
  grey-brown edge toning and fine print grain. The page is locked to the world (`paperLock` 1), so it pans and zooms
  with the drawing. Never draw your own paper, grain, vignette, fold or tint.
- **Ink:** `V_INK #211D1A` at two rungs only: `INK_HI` 0.90 for the subject now, `INK_LO` 0.42 for context. Ink sits
  flat, as printed, with no shadow.
- **Red:** `RED #C9281C`. Use `RED_DEEP #89190F` for red at rest, negative or missed, `RED_WET #E2432D` only on the wet
  stretch behind a drawing tip, and `RED_HI #EC5C46` for one travelling highlight. Red things get the warm paper
  shadow through `RedGroup`. Nothing else casts a shadow.
- **Type:** set every number with `size="value"` (Source Serif 4 Bold). Set words with `"word"` (Source Sans 3
  SemiBold, tracked caps). Use `"head"` (64 px) for the one word that names the thing on screen, and Source Serif 4
  Italic for cutlines and `SourceLine`. Text comes only from `Label`, `Kicker`, `SourceLine` and `cutline`.
- **Newspaper furniture:** title a chart with a `Kicker` (a word between a bold rule and a hair rule). Use `Rule`s
  (hair, bold or double) to organise the page: a hair rule under a chart, a double rule to divide. Every chart gets a
  `SourceLine` that names a verified source. Use no more furniture than `VintageKitSheet` shows.
- **Never:** columns of fake body text, mastheads, headlines to read, torn edges, stains, show-through, plate
  misregistration or flicker.

## Photographs

- When a cut uses a photograph, it is a real, verified picture set as a newspaper clipping: `VintagePhoto` in
  `VStage photos=`. The default `tone="news"` gives a sharp black-and-white photo with a light dot screen, a paper
  margin, a keyline and a light shadow.
- Give every clipping a one-line `cutline` that names the subject, like "Leonid Brezhnev, 1972". When the clipping
  is the subject, frame all of it with its cutline. A cutline cut off by the frame edge looks sloppy.
- Red ink can run over a photo because it uses the same world coordinates. Use `photoPoint` to pin ink to something
  in the picture.
- Move a clipping only by changing its `box` or `rotate`. Never animate its `zoom` or `focus`, and never add filters,
  fades or blurs to it. Use one tone per cut.
- Everything you make on a ChinaTalk clip is ChinaTalk material, even when it sits on a photo or on footage.
- **Footage into print:** freeze the frame as the editor framed it and print it into halftone in code from those same
  pixels, so the print lines up exactly. Reveal it with an ink-soak wipe from top to bottom. The reference is the
  transition in frames 0–24 of `generated/components/jordan-25-million-jobs/HuLiveToPrint.tsx`. The halftone script is
  `/Users/tom/Documents/tom fant/chinatalk/oct/China's Economy is Broken | Logan Wright/jordan - hu jintao's 25 million jobs/animation_source/newsprint.py`.
  Never let AI redraw a real face.

## Visual language

- **Red means one thing per cut,** and the brief names it ("RED = resources. Nothing else is red."). Everything else
  is ink.
- **Dashed means planned, expected or projected, or the road not taken. Solid means what happened.** Use
  `DashedPath`, `Slot dashed`, or `PlanMark`, whose `solid` turns the plan into fact. Dashes march toward the head.
- **Lines are written in wet ink:** `WetLine` with a bead at the tip. The stretch behind the tip is wet and dries.
  Leave a red `Seal` at each data point as the bead passes it. Never morph the bead into a seal.
- **Shapes flood from the point of contact.** When a feed touches a pictogram or a bar, red soaks through it from
  that point: a clean ink front with the wet colour just behind it.
- **Things that stop existing bleed away** like ink on wet paper (`InkDiffuse`, `Label diffuse`). They blur, spread
  and fade in place until fully gone. They never pop, sink or stay behind as a faint ghost. A label for a state that
  is over bleeds away too.
- **Areas** are an ink wash under a fine hatch (`HatchFill` with `fill` 0.10 and `lineOpacity` 0.35), revealed with a
  `FeatherWipe` like ink soaking down. For a fall or anything below zero, a `RED_DEEP` wash and hatch fills the
  whole wedge the line fell through.
- **A growth wash hugs the red line** and fades toward the baseline (`GrowthWash` in
  `generated/components/logan-brezhnev/SovietEconomicDecline.tsx`). Never use a flat pink fog or an uneven wash, which looks like
  a stain.
- **Bars** are `RedBar` pills, or a `RedBar slot` filling an ink `Slot` to show a level. `seam` divides a bar into
  countable units. Never use heavy black slabs.
- **Pictograms** are big solid silhouettes (`Pictogram` from `PICTOS`): an ink tint (`INK_LO`) while waiting, solid
  red when active. Do not use outline icons or drawn machinery. Keep moving items solid too, because a thin-rimmed
  item among solid shapes looks like an outline.
- **Crowds, workforces, applicants, firms in bulk and AI agents** use the Dwarkesh crowd language (`styles/dwarkesh.md`):
  an organic scattered field, a clearing, a finite countable block, threads, and a pull-back from inside the crowd.
  Never use a lattice or a grid of icons. Draw it in ChinaTalk materials: dots on `makeTone(RED_DEEP, RED)` with no
  stroke, spaced so they don't merge (about 40 % cover on paper), structure and labels in ink, red threads with an
  ink head. Import the field mechanics (`hash`, `feather`, `wobble`, `makeTone`) from
  `generated/components/kits/dwarkesh/fieldShared.tsx` and everything else from this kit. `generated/components/jordan-25-million-jobs/FiniteJobs.tsx`
  shows the field, clearing, block and threads, but copy its geometry, not its `chinatalkShared` imports.
- **A country:** when a chart's red line is one country, the chart can carry that country's flag as its title. The
  flag is a world object above the chart: it moves with the camera, is sized through the size law like a label
  (`wpx(px, k)`), enters on the country's name, and nothing in the chart passes under it.

## Weight

- Use a few big, simple shapes. Red owns the frame as real shapes (thick lines, tall pills, slabs, hatched wedges),
  never as specks or tiny squares.
- Draw the argument in the proven grammar: bars on a baseline, a level line, slabs, one cycle, a fork in a road.
  Don't invent apparatus like brackets, conveyors or stations.
- Keep few kinds of element and few labels on screen at once. Every frame should read in half a second at phone size.
- Open on a substantial first frame. Never start with thin hairlines on empty paper. `HAIR` is only for axes and
  rules.
- Before you build, pull frames from the reference renders (Exemplars) and hold your first frame up against them.

## Motion feel

- Motion is eased and ink-like. A bead writes each line, launching fast and settling (`shootEase`), shapes flood,
  and anything removed bleeds away.

## Exemplars

- `generated/components/logan-brezhnev/SovietEconomicDecline.tsx`: a full-bleed photo clipping and a smooth pan to a chart with a
  kicker title. A red line is written through real data with seals and the growth wash, and the chart has a source
  line.
- `generated/components/logan-brezhnev/TechnologyAllocates.tsx`: a newspaper figure. A photo clipping with its cutline sits in the
  middle, and six solid pictograms around it flood red where the feeds touch them.
- `generated/components/logan-brezhnev/BrezhnevChoseDecay.tsx`: a portrait clipping over a fork. Both roads are dashed and red takes
  one. A `RED_DEEP` hatch wash soaks into the wedge, and the other road bleeds away with its `"head"` label.
- Reference renders of these cuts, plus `AIReplacesMarkets`, are in
  `/Users/tom/Documents/tom fant/chinatalk/oct/China's Economy is Broken | Logan Wright/logan - brezhnev chose decay/graphics/`.

## Name tag

`generated/components/kits/name-tags/NameTagNewsprint.tsx` (props `name`, `job`). Its size and position are in `styles/name-tags.md`.

## News cards

A news card is never drawn on the newsprint page or in kit material; cards and period-newspaper scans are the
director's (news-card skill).
