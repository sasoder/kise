# Memory

## Creative direction (North Star)

For transcript graphics, use somewhat abstract, visually meaningful metaphors that
complement and elevate the voiceover. Avoid text by default and avoid illustrating each
spoken phrase literally.

Make the underlying relationship apparent through motion and physical cause and effect;
viewers should not have to decode arbitrary shapes. Visual consistency must preserve
meaning. Keep corner treatment, visual weight, spacing, and motion coherent across the
scene.

User feedback on the Dario opening, 2026-09-05: free-floating modules lost the message;
the labelled graph and UI restated the sentence too literally.

## Animated icons from static PNGs

Whenever the user supplies static icons (black line art or solid glyphs, transparent
background) and asks for subtle animation / "a bit more character", follow this spec
without re-asking:

**Output**

- Transparent ProRes 4444 `.mov` with alpha — icons are overlay assets, so ignore the
  "opaque background by default" rule in `AGENTS.md` for this kind of brief.
- Square canvas, 1080x1080.
- **24fps**, 96 frames (4s).
- One composition per icon, each rendered to its own file, so they stay separate assets.
- Review with `KISE_TRANSPARENT=1 bun run review out/<name>.mov`.

**Motion**

- Seamless loop. Drive everything off one normalised
  `cycle = (frame % durationInFrames) / durationInFrames` so there is no seam and so
  changing fps/duration resamples the motion instead of retiming it.
- Keep the supplied PNG as the base layer via `<Img src={staticFile(...)} />` — never
  redraw or trace over the icon. Added flair is drawn in SVG in the icon's own 512x512
  viewBox and layered *behind* the PNG so the artwork occludes it correctly.
- Flair is pure black (`#000000`) at low opacity, stroke weights matched to the icon.
- Whole-icon motion stays very restrained: sway ~1-2deg, scale ~1-2%, translate a few px.
  Use volume-preserving squash (x up, y down) rather than uniform scale.
- Give the physics a reason: matter accelerating inward with `Easing.in(Easing.quad)`,
  streaks stretching along travel, elements fading in and out at the ends of their path.
- Use a stable hash (`sin(i*12.9898 + k*78.233)` fract) for per-particle scatter so it
  looks organic but never flickers frame to frame.

**Props**

Expose a `liveliness` number (0-2, default 1) multiplying all motion amplitudes, plus
counts for the flair elements, so intensity is dialable without editing the component.

Reference implementations: `generated/components/WormholeIconLoop.tsx` and
`generated/components/BlackholeIconLoop.tsx` (both approved by the user).

## Dwarkesh style

The user's named house style for explainer graphics cut to a podcast transcript.
When they say "dwarkesh style", build to this without re-asking.

**Output**

- Transparent ProRes 4444 `.mov` with alpha — these are overlays on a talking head,
  so ignore the "opaque background by default" rule in `AGENTS.md`.
- 1080x1920, 30fps. Review with `KISE_TRANSPARENT=1 bun run review out/<name>.mov`.
- Duration comes from the SRT: `round((end - start) * 30)` frames. Report the exact
  timecode the clip is placed at.
- Hold resolved on the last frame. Never fade out — the editor controls the out.
- Judge renders over dark grey (`0x141414`), not the review checkerboard, which
  consistently overstates faint elements. Build a preview `.mp4` for the user.

**Palette and form**

- Mono plus one accent. `ink #FFFFFF`, `accent #48D9FF`, `shadow rgba(0,0,0,0.28)`.
- One soft `drop-shadow(0 2px 6px <shadow>)` over the whole graphic, for legibility
  against arbitrary footage. Nothing else.
- Flat shapes. No glow, no gradients, no blend modes — a glow filter was tried and
  rejected for turning the accent into a neon tube.
- Three states, in this order: unknown (~0.10 ink) -> read (~0.80-0.95 ink) ->
  understood/structural (accent).

**Colour grammar — keep this consistent across scenes**

- Ink = raw material, the read state, and the human.
- Accent = comprehension, structure, the deep thing, and the AI.
- Depth means understanding: downward on a cartesian plot, inward on a radial one.

**Motion**

- Beat frames are lifted literally from the SRT and exposed as a `beats` prop object
  of named frames, commented with the words each lands on. A few frames of
  anticipation is fine; landing late is not.
- Derive state from the visible thing, never from a parallel timer — e.g. compute a
  bar's lit state from the wavefront radius so the two cannot drift when retimed.
- Encode a quantity twice where possible (a long duration is both a longer bar and a
  slower draw).
- Stagger entrances; give each beat one clear event.

**Type** (only when the user asks for labels — default is no text)

- Roboto Condensed 700, uppercase, 58px at 1080 wide, `letterSpacing: 0.11em` with a
  compensating `marginRight: -0.11em` so the tracking does not throw pairs off centre.
- Legend: dots are exact copies of the on-chart markers (28px), centred pair, gap 64.

**Craft rules learned the hard way**

- Snap horizontal rules to `Math.round(y) + 0.5` with an odd stroke width. Otherwise
  identical lines antialias anywhere from 4% to 13% alpha and the field shimmers.
- Never put ink annotation on top of a bright ink field. Recede the context layer
  first (animate it down to ~0.25) so the new layer can exist.
- Verify contrast by sampling alpha from the render, not by eye.
- Tint a supplied PNG with an `feColorMatrix` that forces RGB to the accent and keeps
  alpha, driven off the same `accent` prop. Draw it with Remotion `<Img>`, not SVG
  `<image>`, so the frame waits for it to load.
- A linear time axis cannot carry hours against years. Say so rather than faking it.

**SFX** (built on request, as a separate stem)

- Synthesised with ffmpeg `aevalsrc` — no sample library, no network. 48kHz, 24-bit,
  stereo, `pcm_s24le`. See `scripts/build-codebase-comprehension-sfx.mjs`.
- Regenerate the component's geometry and hash inside the script so cues land on the
  exact frames the visuals move, including inverting easing curves where needed.
- `air()` noise expressions peak around 0.16, not 1 — they need gains roughly ten
  times the tone gains or they are inaudible.
- Deliver at stem level to sit under the VO. Two clear peaks and a crescendo beat
  the flat middle it will otherwise have.

Reference implementations, all approved: `DomainExpertiseSweep.tsx`,
`CodebaseComprehensionFold.tsx`, `UnderstandingDepthPlateau.tsx`,
`HourVersusWeeks.tsx`.

## Cheeky Pint style

A second named house style for transcript-cut explainer overlays. It is
`## Dwarkesh style` above in every respect — transparent 1080x1920 ProRes 4444
at 30fps, duration from the SRT, hold resolved on the last frame, flat shapes,
one soft `drop-shadow(0 2px 6px rgba(0,0,0,0.28))`, no glow or gradients, three
states (unknown ~0.10 ink -> read ~0.85 ink -> understood/structural accent),
beat frames lifted literally from the SRT into a `beats` prop, state derived
from the visible thing rather than a parallel timer, quantities encoded twice —
with exactly two differences:

- **Accent is `#FFC543`** (warm amber), not the Dwarkesh cyan `#48D9FF`. Ink
  stays `#FFFFFF`. The colour grammar is unchanged: ink = raw material, the read
  state, the human; accent = comprehension, structure, the deep thing, the AI.
- **Type is Söhne** (Klim, the Stripe face) wherever a scene needs text —
  replacing Roboto Condensed. Default is still no text; add labels only when
  asked. Söhne is now vendored in the repo: `public/Sohne-Buch.otf`,
  `Sohne-Kraftig.otf`, `Sohne-Halbfett.otf`, `Sohne-Dreiviertelfett.otf`
  (copied from the user's `~/Library/Fonts/StripeSöhne-*.otf`, Klim's Stripe
  cut). Load it with `loadFont` from `@remotion/fonts` + `staticFile` at module
  scope (see `ToothPieChart.tsx` for the pattern). Never substitute a lookalike.

- **Brand marks come from the Simple Icons set** so any lockup stays one style:
  `public/si-meta.svg`, `si-shopify.svg`, `si-openai.svg`, `si-spacex.svg` —
  all monochrome, all `viewBox="0 0 24 24"`, all centred on (12,12). Size a pair
  by **ink area**, not bounding box: rasterised into a common 24-unit box Meta's
  mark inks 79.8k px and Shopify's 139.8k, so Shopify is drawn at **0.82x** Meta
  (a blend of the 0.755 equal-ink and 0.869 equal-bbox factors). Pull a missing
  mark from
  `raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/<name>.svg`.

Reference implementation: `SaasNotAllNecessary.tsx`.

## Dwarkesh style — grid background

A modifier on `## Dwarkesh style` above, triggered when the user asks for a graphic
"in dwarkesh style **with the grid background**". Everything in the Dwarkesh spec
still applies — beat frames lifted from the SRT, state derived from the visible
thing, quantities encoded twice, hold resolved on the last frame — with three
additions and one consequence.

**1. The grid backdrop**

- `public/grid-background.jpg` (canonical copy:
  `~/Documents/PERMANENT ASSETS/VISUAL/grid background.jpg`). 6001x4001, grey lines
  on white with a perspective floor curve.
- Blur it and dim it. **Never invert it.** Its lines are *darker* than its field;
  inverting flips that into a glowing dark grid, which the user reads as the wrong
  asset. This was tried and rejected.
- Approved: `filter: blur(13px) brightness(0.32)`, over a `#232323` base. Field lands
  around `#505050` with the grid still legible and white line-work at ~5:1. Pushing
  to `brightness(0.36) blur(16px)` starts dissolving the lines into flat grey.
- Size the element at 1.8x the frame with `objectFit: cover` so it can move without
  exposing an edge.

**2. Tracking camera**

Lay the scene out in a tall world (e.g. 1080x4900) and move a camera through it,
ending in a pull-back that reveals the whole composition at once. Author the camera
as its own keyed track and damp it — see the Camera section comment in
`ThreadFromKnot.tsx`, which explains why chasing the subject fails.

**3. Parallax**

The grid moves at ~0.15 of the camera and scales at ~0.3 of the zoom, so travel reads
as depth rather than a sliding layer. Add a slow constant drift so it is never static
during a camera hold.

**Consequence: the render is opaque.** It is a cutaway, not an overlay on the talking
head — ignore the transparency rule from `## Dwarkesh style` for this variant. Codec
stays ProRes 4444. Judge it directly; the grey-preview step is unnecessary.

**Drop shadow.** Still one soft shadow for separation, but the grid needs less than
footage does: `drop-shadow(0 2px 9px rgba(0,0,0,0.22))` was approved over the
Dwarkesh default. Expose it as props so it stays dialable.

**Recede floor.** When dimming a layer back behind a resolving element, set the floor
against the grid's value, not out of habit — 0.5 went muddy on the lighter field and
was raised to 0.62.

Reference implementation, approved: `generated/components/ThreadFromKnot.tsx`
(Ajeya "sophisticated, difficult things", Sep 2026).

## Dwarkesh style — the agent-crowd language (approved Sep 2026)

Built for the "nobody alerted the humans" clip and approved by the user as the
way to do this kind of segment. All four scenes are on the grid background at
24fps, so `## Dwarkesh style — grid background` applies throughout.

**Casting**
- Agents are cyan dots. A population is an organic crowd, never a lattice:
  scatter each dot off its cell by up to ~90% of the step and vary the radius
  0.75–1.25 with the stable hash. A regular grid reads as "organized" and was
  rejected.
- Humans are `public/person.png` tinted with `brightness(0) invert(1)`, drawn
  with `<Img>`, ~120px in world space. Not a dot.
- A human-made thing (a scorer, evidence, the law) is ink geometry made of the
  same circles, rings, bars and lines as everything else. Never a literal prop:
  a gear box and a document were rejected as "not the same language".
- The OpenAI mark (`openai-chatgpt-logo.png`, tinted white) is the origin the
  agents spawn from.

**Mechanisms that were approved, reuse them**
- *Message board*: threads. A line one agent posts to another draws (with a
  small white head at the tip), holds, fades. Endpoints brighten from the
  thread, never from a separate timer. Tempo, reach and count all ride one
  escalation curve when the line escalates. See `MessageBoardV2.tsx`.
- *A single one of N*: ring one agent while tight, then pull back to the crowd.
- *Searching for one that did X*: a white scan bar sweeps the crowd, reading
  each row white as it passes, and finds nothing.
- *Quantities in a line (many / few / none)*: make each count a group that
  physically moves into its own tier toward the human: a band, a short row,
  then an empty dashed slot. Decorating dots in place reads as "a lot happening
  but nothing happens". See `NoneAlertedTiersV2.tsx`.
- *Culminating in one act*: the crowd pours into a single point beneath an
  ink line, bottom rows first, each dot on its own curve.
- *Time dilation*: the tree folds sideways onto its own spine; the spine runs
  off the bottom of the frame; a playhead rises from below the frame to the
  start. See `SubjectiveLongTimeV2.tsx`.
- *Organized project*: spawn bursts, snap into a staircase tree, twigs keep
  sprouting, camera visits each branch, pull-back reveal. See
  `SprawlingProjectV2.tsx`.

**Framing**
- Captions sit at the bottom of the frame. Gather attention at centre and keep
  the content block's centre near y≈835 of 1920 (`cy = contentCentre + 125/k`
  for a tracking camera). The bottom is low priority, not a hard no-go zone.
- Consecutive cuts share a framing: the end frame of one is the start frame of
  the next when the subject carries over.

**Polish pass ("sleek")**
The user's word for the last 10%. Same concept and beats, then: a white tip on
every drawing line and a short click-bright as it completes; groups that move
travel on individual shallow arcs, never straight lines in unison; a fold or
drop sags slightly mid-travel; rings and locks land with a small overshoot
(`Easing.out(Easing.back(1.6))`); fewer, gentler camera keys with a longer
pull-back ramp; ambient packet traffic dimmed to ~0.4. Re-choreographing a
moment is allowed when it makes it smoother.

Reference set: `generated/components/SprawlingProjectV2.tsx`,
`SubjectiveLongTimeV2.tsx`, `MessageBoardV2.tsx`, `NoneAlertedTiersV2.tsx`.
Delivered to `dwarkesh podcast/sep/nobody-alerted-the-humans/sleek/`.

## Cheeky Pint — brown paper background

A modifier on `## Cheeky Pint style` above, triggered when the user asks for a
graphic "in cheeky pint style **with the brown paper background**". Everything
in the Cheeky Pint spec still applies — ink `#FFFFFF`, accent `#FFC543`, beat
frames lifted from the SRT, flat shapes, one soft drop shadow, the unknown ->
read -> accent ladder, Söhne if text is ever asked for — with the additions
below and one consequence.

**The backdrop**

- `public/brown-paper-backdrop.jpg` (canonical:
  `~/Documents/PERMANENT ASSETS/VISUAL/brown paper backdrop image.png`).
- `filter: blur(16px) brightness(0.68)` over a `#2B2118` base, at 1.8x the frame
  with `objectFit: cover`. Kraft is already a midtone, so it wants far less
  dimming than the grid's 0.32 — 0.68 lands the field near `#67553B`, holds
  white line-work near 8:1, and drops the paper far enough that the amber reads
  as its own colour rather than as part of the sheet. The vignette and mottle
  still come through.

**Consequence: the render is opaque.** A cutaway, not an overlay. ProRes 4444,
24fps, 1080x1920. Duration is `round((end - start) * 24)` frames from the SRT.

**The shared system**

`generated/components/cheekyPintSystem.ts` holds what has to match across every
graphic in this style, because they get cut into one edit minutes apart. None of
it is visible inside a single piece; all of it is visible in a row. Import it
rather than redeclaring any of it:

- **One camera hand.** `CAM_STIFF 0.145 / CAM_DAMP 0.59` (zeta ~0.77, ~13 frame
  settle), run over a coarse authored key track by `runCamera`. Three graphics
  once had three different stiffnesses and read as three different operators.
- **One ground.** 5px, `0.24`, lifted to `0.40` only where something is actually
  being measured against it.
- **One landing.** `Easing.out(Easing.back(1.5))`.
- **One paper depth.** parallax `0.15`, backdrop scaling at `0.24` of the zoom,
  a constant `0.25px/frame` drift so a hold is never fully still.
- **One ambient ceiling.** `0.38` for anything subordinate — packets,
  impressions, drifting background figures.
- **One click-bright.** Ink for `4` frames, because ink is the ladder. Dense
  fronts are the exception: at five arrivals a frame the beat overlaps itself
  into a pale band laid through the mass, so they take a half-step —
  `#FFD98A` for `2` frames. Measured on the tower, where full ink left a seam.

**The motion language** — this is what "the same type of thing" means

- **One repeating unit, one grid, one gap.** A dot is a business or a person; a
  rounded-rect tile is a product. Quantities are countable, never asserted:
  the ridge of policies is 16, 9 and 4 dots because heap *n* is *n* wide and *n*
  tall; the mass-market product is exactly six units so every stack that beats
  it beats it by a number. Derive positions from other geometry — the ridge
  starts from the tower's own edge — instead of placing them by eye.
- **A scene is a ground, things standing on it, an actor above, and a
  connection between them.** The actor is a brand mark (Simple Icons,
  monochrome, 24x24 box centred on (12,12), sized by ink area — Shopify 0.82x
  Meta). An actor with no brand gets a mark drawn to those same rules, at half
  opacity, anchored to the thing it labels. The connection is a beam, a thread,
  an arc, a relay.
- **Mechanisms that have worked, reuse them.** A lob between two marks that
  drops a unit on landing. A pile that becomes a tower its makers ride up on. A
  broad beam collapsing into individual threads, one per thing it can now reach.
  Stacks growing past a reference rule drawn out from the thing they beat. A
  token descending into a rack and relaying through it, each arrival refining
  what it lands on. Identical coarse blobs becoming specific exact objects.
- **Comparison is height and count against a shared floor.** Never a chart.
- **The camera is one continuous authored move**, damped, usually a widening or
  a climb into a pull-back. It resolves with the composition's centre near
  y 825 and everything inside y 200–1450, under the burned-in captions.
- **Density cap: the main action plus one ambient layer.** Count per beat.
- **Variety over lattice.** Identical repeated objects read as a UI mockup — vary
  sizes, scatter off the cell, let each thing be its own size.

Reference set, all approved: `generated/components/MoreBusinessesColumnV2.tsx`,
`NicheProductsDoingBetterV2.tsx`, `IdeaIntoRetailV2.tsx`. Delivered to
`cheeky pint/sep/S2E8_Pint_Tobi_FINAL_YT/tobi-more-businesses-than-any-government-policy/v2/`.
