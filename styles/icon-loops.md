# Icon loops

Follow CRAFT.md. Use this only on request: the user hands over static icon PNGs (black line art or solid glyphs on
alpha) and asks you to "animate them", give them "a bit more character", or similar. Build to this spec without
re-asking setup questions.

There are two looks:

- **Plain** (the default): the supplied artwork exactly as delivered, plus subtle flair.
- **Core memory**: when the request says core memory style. The icon turns white on a hard black shadow, enters on
  the chain slide-up in an In clip, and then loops in a Loop clip.

## Output (both looks)

- Each icon is a transparent overlay asset: ProRes 4444 with alpha on a square 1080×1080 canvas.
- Give each icon its own composition and its own file, so the icons stay separate assets.
- One loop lasts 4 s (`LOOP_FRAMES` = 96 in the existing kit). The frame rate follows CRAFT.md.
- Check the alpha channel with `KISE_TRANSPARENT=1 bun run review out/<name>.mov`.

## Motion (both looks)

- **Seamless loop:** drive everything off one normalised value,
  `cycle = (frame % durationInFrames) / durationInFrames`. The loop then has no seam, and a change of fps or length
  resamples the motion instead of retiming it.
- **Whole cycles:** every periodic part completes a whole number of cycles per loop. For example, clock hands at 4:1
  both loop without strobing; LED blink windows are whole frame counts.
- **Restraint:** keep whole-icon motion very small: sway ~1–2°, scale ~1–2%, translation of a few px. Prefer a
  volume-preserving squash (x up, y down) to a uniform scale. Anchor the motion where the object would move from: a
  server rack breathes from its feet and does not sway.
- **Physics with a reason:** matter accelerates inward on `Easing.in(Easing.quad)`, streaks stretch along their
  direction of travel, and motes enter and leave at the ends of their path.
- **Stable scatter:** take per-particle scatter from a stable hash,
  `fract(sin(i * 12.9898 + k * 78.233) * 43758.5453)`, so it looks organic and never flickers from frame to frame.
- **Props:** expose `liveliness` (0–2, default 1), which multiplies every amplitude. Also expose `iconSize` and a
  count for each kind of flair element (`moteCount`, `pulseRings`, `glintCount`), so intensity can be dialled
  without editing the component.

## Plain look

- Keep the supplied PNG as the base layer with `<Img src={staticFile(icon)} />`. Never trace or redraw it.
- Draw flair as SVG in the icon's own 512×512 viewBox, traced against the artwork's geometry. Layer it BEHIND the PNG
  so the artwork occludes it.
- Flair is pure black `#000000` at low opacity, with stroke weights matched to the icon's.
- Exemplars:
  - `generated/components/WormholeIconLoop.tsx`: motes spiral down the funnel and speed up as the radius collapses,
    with pulse rings.
  - `generated/components/BlackholeIconLoop.tsx`: infalling matter is swallowed inside the sphere, with glints.

## Core memory look

Each icon ships as two files:

- `<Name>_In.mov`: the entrance plus enough of the loop to hand over;
- `<Name>_Loop.mov`: one loop.

The In clip's last frame is loop frame 95, so the cut from In to Loop is an ordinary one-frame step.

- **Kit:** build on `generated/components/coreMemoryIcon.tsx`. Use `CoreMemoryIconStack`,
  `coreMemoryTiming(mode, frame, inFrames)`, `maskStyle`, `slideOffset`, `bootRamp`, and the constants `CHAIN_COLORS`,
  `CORE_COLOR`, `SHADOW_OFFSET` (6), `LOOP_FRAMES`, `CORE_LAND` and `LAST_COLOR_LAND`. Add a `<NAME>_IN_FRAMES`
  constant for the new icon: 48 frames is typical, longer when a living part needs time to build up (the power
  plume uses `CORE_LAND + LOOP_FRAMES`).
- **Entrance:** the text-only sting from styles/core-memory.md. The black shadow, then orange at f0, purple at f2, blue
  at f4 and the white core at f6, each sliding up 130 px over 22 frames. Nothing fades.
- **Artwork:** the PNG's alpha masks a flat colour on every layer. Never recolour the bitmap, so holes in the artwork
  stay holes. An icon whose moving parts a static mask cannot hold passes `renderLayer(color)` and draws its silhouette
  at the current frame in one flat colour.
- **Rest state:** the stack stops rendering the colour layers once blue has landed, so the loop carries no coloured
  fringe.
- **One wrapper:** the breath and the flair ride inside one wrapper with the core (the `transform` and `flair`
  props), so nothing shears apart.
- **Flair:** white at a fixed low opacity, or the chain colours as hard on/off states (lit or not lit, never faded).
  Living parts start only after the core lands: a rack's LEDs boot one by one.
- **Size:** `iconSize` 760 on the 1080 canvas, optically centred.
- Exemplars:
  - `generated/components/ServerIconCoreMemory.tsx`: a PNG mask, with LEDs that are chain-colour discs behind the
    artwork's holes.
  - `generated/components/ClockIconCoreMemory.tsx`: a drawn icon with moving hands, through `renderLayer`.
  - Compositions: `src/Root.CoreMemoryIcons.tsx` (server, power) and `src/Root.ClockIconCoreMemory.tsx`.
