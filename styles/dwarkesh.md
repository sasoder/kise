# Dwarkesh style

Follow CRAFT.md. This file holds only what is specific to Dwarkesh style.

"Dwarkesh style" (also "orange Dwarkesh") is warm yellow on the dimmed grid: agents are solid two-tone dots, people
and what they build are white, and the cutaway is opaque full-frame. History clips use `styles/dwarkesh-map.md`.

## Kit
- Import `generated/components/fieldShared.tsx` and never copy or restate a value. Main exports:
  - Colour: `ACCENT`, `ACCENT_DEEP`, `makeTone`, `OP_UNREAD`, `OP_READ`, `OP_RECEDE`, `OP_DARK`, `OP_UNREAD_DOT`, `OP_READ_DOT`
  - Ground: `GridBackground`, `BG_BASE`, `BG_DIM`, `BG_OVERSIZE`, `Vignette`, `SHADOW_Y/BLUR/OPACITY`, `iconShadow`
  - Crowd: `DOT_RADIUS`, `breath`, `hash`, `idleThreads`, `feather`, `FEATHER_STEPS`, `wobble`, `WOBBLE_R`
  - Camera and shapes: `runCamera`, `camEase`, `camMove`, `CAM_LIFT`, `sway`, `worldTransform`, `squirclePath`
- Brand marks: `generated/components/brandGlyphs.tsx` (`OPENAI`, `ANTHROPIC`, `CLAUDE`, `DEEPMIND`, `GEMINI`,
  `GOOGLE`, `DEEPSEEK`, `META`, `MISTRAL`, `GROK`, `HUGGINGFACE`, `MOONSHOT`, `MINIMAX`). Each is an inline path on a
  24-unit box, scaled with `scale(size / 24)`.
- Put a new clip's world in its own `<name>Shared.tsx` that imports fieldShared. If one cut needs a different
  value, use a local multiplier. Never change fieldShared or another clip's world for it.
- `camMove` adds `CAM_LIFT / k` to cy, which lifts the content 125 px above centre. To frame per CRAFT.md, build the
  keys with `camEase`, set cy to the focus point, and feed them to `runCamera`. Ignore the `FPS = 24` that clip worlds
  export and use the sequence's frame rate.

Clip worlds worth borrowing from (import the named exports, never their cut state or coordinates):

| File | Status | Reuse |
|---|---|---|
| `generated/components/punishShared.tsx` | **reusable** | the generated-text kit (section below) |
| `generated/components/alignShared.tsx` | clip world | `Label`, `labelIn`, `FONT_LABEL`; `Comet`, `cometPath`, `turn`; `Link`, `linkPackets`; `buildFormation`, `waveArrival`, `flockWander`; `camKnots3` + `runCam3` (camera with x) |
| `generated/components/trapShared.tsx` | clip world | `Station` (ring + Lucide glyph), `Thread` + `threadPackets`, `Gaze`, `Wire`, `PersonGlyph`, `ICON_*` paths |
| `generated/components/outgrowShared.tsx` | clip world | `GoBoard`, `ChessBoard` (real game records), `ModelMark`, `DeepMindMark`, `cameraTrack` + `camJerk` |
| `generated/components/levelUp.tsx` | optional experiments | `Trail`/`Streak` (speed smear), `softFront`, `HIGHLIGHT`, `packetsOn`/`Packet`, `marchDash` |

## Look
| Token | Value | Use |
|---|---|---|
| `ACCENT_DEEP` | `#D98A0C` | an agent or model mark at rest / unread |
| `ACCENT` | `#FFB000` | a lit agent, every thread and packet, anything the AI has taken over |
| ink | `#FFFFFF` | people, structure, instruments, labels |
| `BG_BASE` + `BG_DIM` | `#232323`, 0.45 | the grid's base and exposure (field ≈ `#727272`) |
| `SHADOW_*` | 2 / 7 / 0.12 | one soft drop-shadow over the whole graphic layer |
| `iconShadow(k)` | 2 / 3 / 0.38 screen px | per icon (person glyphs, rings, structure, marks, labels); never on dots or threads |
| `HIGHLIGHT` (levelUp) | `#FFD98A` | optional brighter tone for one payoff or a speed-up |

- Dots are fully opaque, with no stroke. Carry state by tone (`makeTone(ACCENT_DEEP, ACCENT)`), never by alpha:
  any transparency washes the yellow into the grid. Flat fills only, no glow, gradients or blend modes. `Vignette`
  (0.45) goes last in the tree.
- White ink has two rungs: `INK_HI` 1.0 for the subject, `INK_LO` ~0.5 for context. A wiped field drops to `OP_DARK`.
- One stroke weight, about 6–6.5 screen px at rest, covers rings, outlines, arrows, icons and brackets. Threads and
  links are half that. Get the world width from the resting k: `strokeFor(kRest)` or `worldPx(px, k)`.
- Every rounded shape is `squirclePath(w, h)` (ratio 0.012, floor 2, smoothing 0.6). Never set an `rx` by hand.
- Labels are Roboto Condensed 700, uppercase, tracking 0.04em, white, drawn with alignShared's `Label`. It is a DOM
  element, so it goes in the world div. Measure widths in that face (caps run wide). Size labels to read on a phone
  (about 48 screen px). Labels side by side share one baseline.

## Grid background
- Draw `public/grid-background.jpg` through `GridBackground` with blur 13, `dim={BG_DIM}` and parallax 0.15, over a
  `BG_BASE` fill. Never invert it: its lines are darker than its field. Keep it opaque and keep `BG_DIM` as it is.
- When the camera pans, pass `cx`/`cxRest`. On a long travel, check the worst offset against the 1.8x oversize. If
  the edge would show, lower parallax for that cut (`generated/components/HonestyGoesUpV2.tsx` uses 0.26).
- Joined cuts pass one continuous clock (`frame={W0 + frame}`), so the drift never restarts at an edit point.

## Visual language
- **Orange = the AI, nothing else:** agents, the model, its threads, packets and written thoughts. A white ring or
  edge that turns orange means the AI reached it or took it over. Nothing decorative is orange.
- **White = people and what they build:** person glyphs, rings, structure, reader lines, brackets, boxes, labels.
- **An agent is a dot** (`DOT_RADIUS` × 0.75–1.25 hashed, `breath`). A population is dots. **A heading needs a
  comet** (`Comet`): one path from the tangents to the tip. A dot with a triangle reads as a map pin.
- **The model is its lab's mark** when the speaker is from a lab or names one. Use the brandGlyphs path filled in
  tone, upright, with nothing behind it. Its instances stay dots.
- **A person** is `public/person.png` tinted with `brightness(0) invert(1)`, about 118 screen px tall, drawn with
  `<Img>`. A named organisation is its mark in white (brandGlyphs, or a white PNG such as `public/metr-logo.png`).
- **A named thing gets a shape** when a dot would not say what it is: a white Lucide outline icon in a station ring
  (about 65 screen px radius), a squircle card, or a flag. Prefer closed outlines to thin stick glyphs. A country is
  its flag, drawn in SVG, at one screen size across the clip (`generated/components/DidTheyJustHockeyStick.tsx`).
- **Thought bubble** over a person: a check means "they think it's fine", a "?" means "we don't know". **An agent seen
  as something else** morphs its own body into that shape; never lay an icon over it.
- **Dashed = not real (yet):** an empty slot, a forecast, a simulation. One meaning per clip, and the dashes march.
  **A solid box** round a region means "what was looked at". It draws head-led and clicks bright as it closes.

### The crowd
- Organic, never a lattice: a hashed grid (for example 40×30, step 940/39 × 440/29), seats jittered up to 0.9 of a
  step. No edge is ever a ruled line: `feather` + `wobble` on every visible boundary, and an edge that stays in frame
  dissolves over about 12 rows (`EDGE_FEATHER` in `generated/components/MoreThanAllOfHistory.tsx`). A group is a
  superellipse blob, n ≈ 2.4 (`generated/components/RogueInstancesInterfere.tsx`). A block of humans stays countable.
- A crowd that is only context is a band feathered on both edges, never a sea. A body that has to read as one
  thing needs a couple of hundred seats. "Bigger" means wider and larger dots, never denser. "Many" needs a count
  that fills the frame.
- Idle traffic always runs (`idleThreads(n)`). Agents stay the brightest orange in frame. Idle links sit at about
  0.3–0.4 and light only as a travelling band. Packets are small and sparse, sized against their line.
- Nothing vanishes: a departing dot leaves itself behind at `OP_UNREAD`, a merge shrinks into the dot that landed.

### Mechanisms to reuse before inventing one
- **Thread:** an accent line draws with a small white head, holds, then fades; its endpoints light when it arrives.
- **Wave:** tone spreads deep → ripe, ordered by distance from the source plus a small hash jitter, never by graph hops.
- **One of N:** ring one agent close, then pull back. **Search:** a white scan bar sweeps the crowd row by row.
- **Counts (many / few / none):** each group moves into its own tier (band, short row, empty dashed slot); never
  decorate dots in place.
- **Society:** a band lifts out on individual arcs; a wipe falls to a flat `OP_DARK` line and the next rises from it.
- **Culmination:** the crowd pours into one point, each dot on its own curve, absorbed on arrival. **Station:** a ring
  with a Lucide icon converts white → orange when the AI takes it.
- **Finish:** groups travel on individual shallow arcs, never in unison. Rings land with `Easing.out(Easing.back(1.6))`.

## Generated text: chain of thought, transcripts, code, monitoring
Use this language unprompted whenever a line is about an AI's text or reasoning. Kit: `generated/components/punishShared.tsx`.
- Draw one centred column of solid `ACCENT` word-bars (`makeColumn`, `WordBars`), ragged right with paragraph gaps,
  never letters. The non-blinking `Caret` is the AI. One `makeClock` drives words, caret and a smoothed scroll. Words
  grow from their left edge up to the caret, never past it.
- When people read, show a white `ReaderLine` (end dots, constant rate) with `ReaderPerson` in the margin. It never
  overtakes the caret. Plain generation has no reader line, and findings bracket a few frames after they are written.
- A finding gets a white `Bracket` and a margin mark (an orange `SkullMark` is a malicious thought). Hiding is
  generation in reverse (`wipeAt` un-types right to left), and it leaves the bracket empty.
- Bar height is legibility: `WORD_H` reads, `HAIR_H` is hidden but present, 0 is gone. No `iconShadow` on word-bars.
- Lines leaving the top thin to zero height (`makeExit`). Never clip a growing column's bottom (`assertNonDecreasing`).
- The camera is a magnifier: the column fills the frame width, and a push-in crops the sides when a flag is noticed.
  Centre on the block including its margin marks, and keep at least 30 screen px of air at both edges.
- To scan an existing block (code review), sweep the line and bracket what it finds: the mechanic of
  `generated/components/DualUseMirrorScan.tsx` (not its palette).
- Exemplars: `generated/components/HidingTranscriptsV5.tsx`, `generated/components/LaidOutToRead.tsx`.

## Build mechanics
- People and raster logos use `<Img>` in the world div. Marks and icons are inline `<path>`, never SVG `<image>`.
- Put `iconShadow(k)` on a wrapper outside any glyph's `scale()`; filled marks take about 0.27 opacity to match strokes.
- Put a `clip-path` on an untransformed wrapper. Snap horizontal rules to `Math.round(y) + 0.5` with an odd stroke width.
- Derive state from the visible thing (a dot lights because the front reached it), never from a parallel timer.
  Recede the context before annotating over a busy field.
- Tone alone does not read on thin strokes or small marks, so add shape, size or count. A speed-up shows by colour
  (`ACCENT` → `HIGHLIGHT` → white), size and count. Once resolved, the picture stays alive through `sway`, idle
  traffic and the grid drift; it never fades out.

## Exemplars
- `generated/components/MoreThanAllOfHistory.tsx`: crowd field, feathered edges, two-tone dots, damped camera.
- `generated/components/MillionsOfYears.tsx`: the model at the core, station rings, an endless pour, rings converting.
- `generated/components/HonestyGoesUpV2.tsx`: comets, the person seat and arrow, labels, a sparse frame.
