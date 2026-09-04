# kise — Agent-driven video and motion graphics

Build polished Remotion videos from natural-language creative briefs.

## Tooling

- Use `bun` and `bunx`, never npm or npx.
- Run `bun run lint` before delivery.
- Dependencies are pre-installed. Do not inspect `node_modules`, search `package.json` for packages, or install anything unless a render reports a missing import.

## Creative brief

Treat the user's request as a description of the finished piece. Infer the visual style, palette, typography, background, pacing, and motion language. Ask at most one or two questions only when a missing choice would materially change the result.

Defaults when the brief does not specify them:

- Resolution: 1080×1920 vertical
- Frame rate: 30fps
- Duration: infer from the content; use 180 frames only when there are no timing cues
- Canvas: design a complete opaque scene with an intentional background
- Output: ProRes 4444 `.mov`

Use a transparent canvas only when the user explicitly requests transparency, an alpha channel, an overlay, or a lower third.

## Before building

Read these files completely:

- `MEMORY.md`
- `src/Root.tsx`
- `src/lib/component-registry.ts`
- `.agents/skills/kise-creative-direction/SKILL.md`
- `.agents/skills/remotion-best-practices/SKILL.md`

Then load only the Remotion rule files relevant to the request. For example, text work needs `video-layout.md`, `text-animations.md`, and `google-fonts.md`; audio needs `audio.md`; transparent output needs `transparent-videos.md`.

Implement immediately after reading them. Do not explore project configuration or unrelated files unless a concrete error requires it.

## Build

Create one component at `generated/components/<Name>.tsx`.

- Use `AbsoluteFill` as the root and frame-driven Remotion APIs such as `useCurrentFrame()`, `interpolate()`, and `spring()`.
- Set an opaque background on the root unless transparency was explicitly requested.
- Export a Zod schema and create default props with `schema.parse(...)`. Register both on the composition so invalid inputs fail before rendering.
- Load a font through `@remotion/google-fonts` at module scope and use its returned `fontFamily`, so font failures surface before rendering frames.
- Default-export the component.

Replace the existing composition in `src/Root.tsx`; never accumulate compositions. Use dimensions and duration chosen for the current brief:

```tsx
import MyScene, { defaultProps, schema } from "../generated/components/MyScene";

<Composition
  id="MyScene"
  component={MyScene}
  schema={schema}
  defaultProps={defaultProps}
  durationInFrames={180}
  fps={30}
  width={1080}
  height={1920}
/>;
```

## Render and review

Render ProRes 4444 by default:

```bash
bunx remotion render src/index.ts <CompositionId> out/<name>.mov
bun run review out/<name>.mov
open out/<name>.mov
```

`remotion.config.ts` defines the ProRes 4444 codec and alpha-capable PNG/pixel format. Do not duplicate or override those settings at the call site.

For an explicitly transparent composition, require the alpha channel during review:

```bash
KISE_TRANSPARENT=1 bun run review out/<name>.mov
```

Read `out/review/<name>/<name>-contact-sheet.jpg` before showing the result. Check the first and last frames, safe margins, clipping, text legibility, unintended collisions, pacing across sampled frames, and whether the final state resolves cleanly. Fix concrete issues and repeat the render and review until the output is presentable.

## Commit and push

Required after every animation you generate. As soon as a scene renders and
passes review, commit it and push — do not batch several scenes into one commit
at the end of a session, and do not leave generated work sitting uncommitted.

```bash
git add -A
git commit -m "Add <SceneName>: <one-line description>"
git push
```

`git add -A` is safe here: `node_modules`, `out`, `.claude/` and the installed
skills are all gitignored. It also picks up `MEMORY.md` and the component
registry, which a narrower `git add` would silently leave behind.

Work stays on a single branch, used as a folder. Do not create branches or
worktrees for individual scenes: unpushed work in a side worktree is invisible
in the branch list and is lost the moment that directory is cleaned up. If you
are already on a side branch, push it to the same place rather than opening
another.

Commit the scene file and any assets it references together, so a fresh
checkout renders it without missing `staticFile` targets.

## Work with the user

After showing the render:

1. Briefly explain the palette, type, motion, and pacing choices.
2. Ask what they would change, offering one or two concrete directions when useful.
3. Once they approve it, ask both:
   - "Want me to save any of these choices (font, palette, easing) to `MEMORY.md` for next time?"
   - "Should I promote this to the component registry so it's reusable?"

Never update memory or the registry without a clear yes.

## Memory and reuse

Save a preference to `MEMORY.md` only when the user states a clear imperative or confirms a recurring choice. Keep entries terse and replace contradicted entries.

Promote an approved scene by adding it to `src/lib/component-registry.ts`. Reuse a registered component with different props when it fits the brief.

## Constraints

- Do not over-architect.
- Do not ask the user to open Remotion Studio.
- Do not preserve legacy compositions, output modes, or fallback paths.
