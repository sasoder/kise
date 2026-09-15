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
- 1080x1920. **24fps** for every transcript cut since Sep 2026 (the user's standing
  instruction; the older overlays were 30). Review with
  `KISE_TRANSPARENT=1 bun run review out/<name>.mov` for transparent ones.
- Duration comes from the SRT: `round((end - start) * fps)` frames, plus a 16-frame
  tail so the resolved state holds. Report the exact timecode the clip is placed at.
- Hold resolved on the last frame. Never fade out — the editor controls the out.
- Judge renders over dark grey (`0x141414`), not the review checkerboard, which
  consistently overstates faint elements. Build a preview `.mp4` for the user.

**Palette and form**

- Mono plus one accent. `ink #FFFFFF`, `accent #48D9FF`, `shadow rgba(0,0,0,0.28)`.
- One soft `drop-shadow(0 2px 6px <shadow>)` over the whole graphic, for legibility
  against arbitrary footage. Nothing else.
- Flat shapes. No glow, no gradients, no blend modes — a glow filter was tried and
  rejected for turning the accent into a neon tube. One exception, asked for by the
  user on 2026-09-07: on the opaque grid look, a quiet vignette over everything
  (`Vignette` in `fieldShared.tsx`, strength 0.45) for depth.
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

## Cheeky Pint style (rewritten 2026-09-15 — the D1 "year off shorting" set is the standard)

The user's named house style for the Cheeky Pint podcast cuts. On 2026-09-15 they
said "overwrite the old cheeky pint style and make this one the new one": the
amber-accent-overlay definition and the separate "brown paper" variant below are
gone; THIS is Cheeky Pint. When they say "cheeky pint style", build to it without
re-asking. Every value named here is an export of
`generated/components/d1Shared.tsx` (+ `fieldShared.tsx` for the palette and
camera); import, never restate.

**Output.** 1080x1920, **24fps**, OPAQUE ProRes 4444, rendered `--muted` (video
stream only). Duration `round((end − start) × 24)` + a 16-frame tail, hold
resolved, never fade. Each cut renders through its own `out/<abbr>-entry/index.tsx`.
Delivered to the clip's folder as `<inSeconds>_<Name>.mov` (`15_BackIntoIt.mov`),
versions `_V2`, `_V3`…, one `placements.txt`.

**The sheet.** `KraftBackground` — the kraft photo (`public/brown-paper-backdrop.jpg`)
blurred 13, dimmed 0.68, with parallax and drift from `GridBackground`, plus a top
light (`DEPTH_TOP_LIGHT`) and a foot shade (`DEPTH_FOOT_SHADE`). `<Vignette strength={0.55} />`
on top. No ground line (user, 2026-09-15): things stand on their contact shadows.

**Palette.** Ink `#FFFFFF`; two tones of one amber, `ACCENT #FFB000` (lit, live,
held, the gain) and `ACCENT_DEEP #D98A0C` (at rest, waiting). Type, if ever asked
for, is Söhne (vendored in `public/Sohne-*.otf`).

**Material — one tile, everything is made of it.** A white squircle tile (radius
floors to 2 px, so hard-square like the D1 logo) with a vertical gradient
`TILE_GRAD_TOP → TILE_GRAD_BOTTOM`, `TILE_SHADOW`, and the figure KNOCKED OUT so the
paper shows through:
- The actor is a brand mark redrawn this way — `D1Mark`: ink tile, the serif "1"
  knocked out, the logo's dot in the accent. Do the same for any brand (measure the
  real logo, keep its figure/ground, tile 108 world px).
- A noun is a `CompanyCard`: tile 72 with a Lucide glyph knocked out (square caps,
  stroke 2.6, ISC, fetched raw and inlined, never installed). Twelve sectors exist in
  `SECTOR_GLYPHS`; a cast is **six** (`SECTOR_SET`, pitch 120) — eight read as
  "overwhelming". Cards get a contact shadow on the ground.
- Money is a `Coin`: r 11, radial highlight, a "$" knocked out; piled on top of the
  actor's tile 4 wide (`returnCoinPosV4`), ripe when live, deep when at rest.
- Connections are threads: 2.5 px, accent, 0.95 live / 0.40 idle, leaving the mark's
  bottom edge spread across `originX(i)` — never from a knot in mid-air.

**The mechanism must be literal.** A viewer with no sound must be able to name the
financial action from the picture. A short is `PriceLine`: a zigzag chart rising
from the card's top-left to a tip; D1's thread drags the tip DOWN so the last leg
falls; that leg is drawn in the accent while held (the drop IS the gain); a coin is
MINTED at the tip (5-frame scale-in while the tip is still falling) for every 36 px
of new low and climbs the thread onto the actor. Depth-under-a-line, abstract dots
and unlabeled rules were all tried and rejected as "too abstract" / "only implied".

**Motion — one continuous motion per cut.** The words are inflections in one arc,
never separate events; if a word does not change the motion it is not animated.
Every moving thing has one authored track spanning the cut; holds carry the motion
still going (a held tip strains, coins keep climbing); the camera is one damped
curve (`runCamera`) with at most one ≤ 8-frame held breath; landings 4–10 frames
before their word; `flow` on travels, `back(0.75)` settles (written as a zero-sloped
bump, not a kinked max()); at most ONE single-object ink click per cut, groups take
the half-step `#FFD98A` as a wash; speed cap 45 screen px/frame; band y 200–1450,
x 60–1020 at every frame. Builders prove continuity with a velocity scan sampled at
h = 1 and h = ¼ (a real step does not shrink with h).

**Continuity.** All cuts of a clip are one world: same objects meaning the same
thing, and a later cut opens on the earlier cut's resolved camera, drops and pile
(import its `K_FINAL / CY_FINAL / RESOLVED_DROPS / RETURN_*`, run `sway`/drift on
`frame + CONTINUE_FROM`, prove the join with a difference image).

**Loop.** Fable directs (concept in a few lines, then dispatch — no check-in), an
Opus sub-agent per cut builds in parallel and STOPS at a half-res preview with an
8 fps strip, per-frame strips at the inflections, the velocity scan and the
READING TEST ("what would a viewer with no narration say happened?"); Fable reviews
as motion, runs the cross-cut audit on the three last frames, then final ProRes,
deliver, commit, push.

**Charts and type (from the "500 mile hurricane" cut, 2026-09-15).** When a line
calls for real data, draw it as a chart in the same material: the ink price line
with the accent tip, minimal axes (a couple of ticks each way, Söhne 26 px ink 0.55,
no grid, no box), the title in Söhne Halbfett 40 with the relevant `CompanyCard` as
its badge, start/peak callouts in Söhne (`$17` ink, `$483` accent, the callout pops
with a 6-frame `back(0.75)` scale-in and the half-step wash). Use exactly the data
the user gives; never fetch or invent points. The camera opens tight on the dull
part so the event has somewhere to go, and it REACTS to the line rather than
leading it (keyed two frames after the spike starts) — the line kicks past the
frame edge before the frame opens, which is what reads as violent. **Padding:** on
the resolved frame every label sits inside x 120–960 / y 300–1350 screen, measured
off the render, with type sizes kept and the chart shrunk in world space instead.
**Fill the segment:** an animation that resolves halfway through its line reads as
stopping; stretch the draw so the payoff lands in the last third of the words
(here: climbing through "hurricane", topping out on "existed"), then hold.

**What the user likes about it, in their words (2026-09-15):** "the overall video
language is very smooth and motivated" — every move traces to a word, nothing
restarts, the camera follows the action, and the picture never needs the audio.

Reference set, all approved (Sep 2026), in
`cheeky pint/sep/Pint_S2E12_Dan_Final_YT/tom_select_dan - year off shorting/`:
`FiveHundredMileHurricaneV2.tsx` (`7_FiveHundredMileHurricane_V2.mov`),
`BackIntoItV5.tsx`, `IsItEvenWorthItV5.tsx`, `AsGoodOrBetterV5.tsx` (delivered as
`_V6.mov`, the ground line removed). The V1–V4 siblings are the iteration trail:
dots → cards → one world → price line; `AfterGameStopV4.tsx` is an opener the user
rejected (the clip should open on the speaker).

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

**The field (Sep 2026, the "three secret AI societies" set) — the current standard**

Three cuts of one clip built as one world, approved 2026-09-07 with "awesome, I
want to work in this way in the future". Reference set, in edit order:
`SocietiesFromTheAshes.tsx` (1.4–8.8s), `InTheDarkAboutTheScope.tsx`
(13.0–17.9s), `ScopeOfTheReport.tsx` (23.3–37.1s). Everything they share lives
in `generated/components/fieldShared.tsx` — import it, never copy it:

- The ladder: `OP_UNREAD 0.45`, `OP_READ 0.9` (+0.1 when a thread is on the
  agent), `OP_RECEDE 0.3`, `OP_DARK 0.16`. Every agent, ash line, floor and mark
  sits on a rung. The subject is always `OP_READ + 0.1 * lit`.
- Idle thread traffic `idleThreads(n)` = 180 per 1,200 agents. A "busy" line
  runs 1.6× that and eases back to it.
- `runCamera` (stiffness 0.09, damping 0.468), `sway`, `worldTransform`,
  `GridBackground` (blur 13, brightness 0.32, 1.8× oversize, parallax 0.15,
  drift −0.3px/frame), `Vignette` last in the tree.
- `DOT_RADIUS 5.5`, `breath`, `hash`, `clamp`.

Rules that came out of the set:
- **Less is more.** The header comment lists every gesture with the word it
  serves and its frames. A gesture with no word is deleted before render. No
  springs, flashes, ripples, rims, glyph breathing, or a box that stretches.
  One camera move where one will do; three at most, each on a word.
- **Every piece opens inside the crowd** (k ≥ 1.25, crowd bleeding off both
  edges) and the first move is the pull-back that reveals its edges. The crowd
  resolves at k 1.0 wherever it plays "the crowd"; a piece whose pull-back is
  the gesture may resolve wider.
- **The crowd is the material.** 40×30 hashed grid, step 940/39 × 440/29,
  jitter 0.9, radius 0.75–1.25. A bigger field keeps the same step. A society
  is a band lifted out of it on individual arcs; a wipe is a fall to a flat
  dark line; the next society rises from that line. Three placeholder slots
  (dashed, equal, drawn one after another) make a count readable up front.
- **The box** (solid, stroke 3, head-led draw, click on close) means "what was
  looked at". Dashed means "a position in a sequence". Never mix them.
- **Humans** are `person.png` tinted white when unnamed; a named org is its
  logo converted to a white-on-alpha PNG in `public/` (`metr-logo.png`,
  `redwood-logo.png`), ~118 world px. Product marks 108. No text unless asked.
- Content centred near screen y≈835, crowd bottom ≤ ~1480, margins ≥ 60.
- Stroke 3 for lines, 3.5 for a ring, 1.5 for seat rings. 16-frame tail.

Delivered to `~/Downloads/` (originals) and `~/Downloads/three-societies-sleek/`
(the consistency pass); never overwrite a delivered file, make a sibling folder.

## Cheeky Pint — brown paper background (superseded 2026-09-15)

Folded into `## Cheeky Pint style` above, which is opaque on kraft by definition
now. The older brown-paper pieces (`MoreBusinessesColumnV2.tsx`,
`NicheProductsDoingBetterV2.tsx`, `IdeaIntoRetailV2.tsx`, their shared
`cheekyPintSystem.ts`) still render as built, but new work does not use that
system: geometry, materials and depth come from `d1Shared.tsx`.

## Orange Dwarkesh style (approved 2026-09-08)

The user's third named house style, born on the Ajeya "Superhuman Hackers" clip
and approved with "I'm really happy with this style … the colours play nicely
into each other, it's clearly visible what's happening, the camera movement is
great." When they say "orange dwarkesh style", build to this without re-asking.

It is `## Dwarkesh style — grid background` plus `## Dwarkesh style — the
agent-crowd language` ("The field") in every respect — 24fps, 1080x1920,
opaque grid cutaway, beats lifted from the SRT, one gesture per word, header
gesture list, `fieldShared.tsx` imported never copied, `runCamera` / `sway` /
`GridBackground` / `Vignette`, the clearing, the structure as ink rings and
lines with its own packets, humans as `person.png` white, marks white at 108 —
with these replacements. Every value below is a shared export in
`generated/components/fieldShared.tsx`; import it, do not restate it.

**Colour: two tones of one warm yellow, dots solid.**
- `ACCENT_DEEP #D98A0C` = an agent at rest (the unread rung). `ACCENT #FFB000`
  = a lit agent, every thread, every converted ring/edge, provenance lines.
- Agent dots are **fully opaque** (`OP_UNREAD_DOT = OP_READ_DOT = 1.0`). The
  unread → read ladder is carried by tone, not transparency: a read-wave is
  deep → ripe, a recede is ripe → deep (`makeTone` ramps it). Threads keep
  their opacities (0.95 live, 0.4 idle); ink keeps `OP_*`.
- **No stroke on dots.** White outlines were tried at 1px and 1.5px and
  rejected: they lightened the colour and read as rings.
- Rejected on the way: cyan (the original), `#E0643A` (too dark, rust over the
  grid), `#FFC543` at 58% / 86% (pale, "a yellow left out in the sun").
  Transparency on the dots was the root of "washed out" every time.

**Field and shadows.**
- `BG_DIM 0.45` over `BG_BASE #232323` (field ≈ `#727272`, white ink ≈ 4.8:1).
  0.32 read as near-black under orange; 0.46+ started costing the dots.
- One global `drop-shadow(SHADOW_Y 2, SHADOW_BLUR 7, SHADOW_OPACITY 0.12)`
  over the graphic — the old 2/9/0.22 was a visible halo.
- **Per-icon shadow** `iconShadow(k)` = `drop-shadow(2px 3px rgba(0,0,0,.38))`
  in screen px on every icon: person glyphs, the structure's rings/lines/
  packets, brand marks. Bodies stay pure white. This is the "slight 3D":
  a Tailwind `shadow-sm` character. Rejected: emboss/bevel rims (invisible on a
  silhouette, chrome on a ring), a hard cut-out ledge (good, but the soft
  shadow won), a receding-ground perspective on the human block (two cameras).

**Crowd shapes: never a box.**
- `feather(insideSteps, width)` + `wobble(along, seed)` on every crowd
  boundary that is ever seen: density falls on a smoothstep, radius tapers,
  the nominal edge undulates. A field edge that stays in frame dissolves over
  **12 rows** with radius to 0.6× (`EDGE_FEATHER` in `MoreThanAllOfHistory`);
  4 rows still read as a line. A fleet is a superellipse blob (n ≈ 2.4)
  inscribed in a ~10×9 box, ~75 alive. Wave boundaries that land as a disc are
  feathered by re-ranking seats, so counts stay exact.
- The human block stays a countable rectangle on purpose — finite against an
  endless field is the point.

**Camera: one move per cut, eased per frame.**
- `camMove({f0, f1, k0, k1, c0, c1, warp})` writes a warped smoothstep as a
  key per frame; `runCamera` damps it; `cy = c + CAM_LIFT/k` off the same
  eased k so zoom and framing settle together (content-centre sag ≤ 2px).
  Warp 0.7–0.75 puts the speed early in a pull-back.
- One move where one will do. Two keys close together read as a stall; a push
  too small to read (<1%/frame) reads as a hesitation — drop it. Landings
  settle 4–10 frames before their word, never late. Diagnose with a k/dk/d²k
  plot before re-keying: the target shape is one deceleration lobe and one
  settle lobe, nothing else.

Reference set, in edit order, all approved: `ConstantlyBombarding.tsx`
(0:04.379), `RogueInstancesInterfere.tsx` (0:19.940),
`MoreThanAllOfHistory.tsx` (0:40.200). Delivered as
`~/Downloads/Ajeya_Superhuman_Hackers-final-v9/` with `placements.txt`; v1–v8
are the iteration trail. Render each through its private entry under `out/`
(`out/cb-entry`, `ri-entry`, `mh-entry`) — `src/Root.tsx` is shared with other
sessions.

## Sporttouchen style

The user's named house style for the client Sporttouchen (sporttouchen.nu, Swedish
sports channel). When they say "sporttouchen style", build to this without re-asking.
Reference: `generated/components/SporttouchenTimer.tsx` (v2).

- **Type:** MADE Tommy Soft, loaded locally from `public/MADETommySoft-ExtraBold.otf`
  (display) and `public/MADETommySoft-Medium.otf` with the `loadFont` + `staticFile`
  pattern in `explainerShared.tsx`. Display numerals ExtraBold, tracking -0.02em with
  a compensating marginRight. Not Montserrat (the website's fallback).
- **Colour:** ink `#FFFFFF`; one brand gradient `#A300AF` -> `#520EF1` at 90deg
  left-to-right; opaque background `#0B0A12` with one low violet radial glow (~18%
  around y1400); track elements ink at 0.12. No glow, blur or blend modes.
- **Stroked type:** every big glyph gets a 4px outside stroke made as a stroked copy
  behind the fill copy. Black under white ink, white whenever the fill is the gradient.
  No caption label under the hero element.
- **Motion:** time is linear (ring drains clockwise from 12 o'clock, no easing).
  8-frame masked swap: outgoing slides up 130px and is gone by frame 3, incoming rises
  from +130px over frames 2-8; one 1.03 pop per tick, 1.06 plus gradient fill on the
  last three; payoff is one thin ring (stroke 6) expanding and fading, then a dead
  hold. Never fade out at the end. 30fps, 1080x1920, hero centred at y880.
- **Delivery:** two renders every time, opaque and `transparent: true` overlay, both to
  `~/Downloads/`, versions as `_V2` beside the original. Judge the overlay over
  mid-grey, not the dark background.
