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

Use a transparent canvas when the user requests transparency, an alpha channel, an overlay, or a lower third, or when the requested approved style in `MEMORY.md` specifies it. Explicit brief constraints and applicable approved styles override defaults.

## Before building

Read these files completely:

- `MEMORY.md`
- `src/Root.tsx`
- `src/lib/component-registry.ts`
- `.agents/skills/kise-creative-direction/SKILL.md`
- `.agents/skills/remotion-best-practices/SKILL.md`

Follow the installed Remotion skill router and load only references relevant to the request. Its file layout can change; do not assume old rule filenames exist.

For video creation, implement after reading them and choosing the visual language and named beats described in the creative-direction skill. Keep those decisions beside the scene, not in a separate planning system. Do not explore unrelated configuration. For harness maintenance, inspect and change the relevant tooling without replacing the current composition.

Check `git status` before edits. Preserve unrelated work; use an isolated worktree for a harness PR when the current checkout contains unfinished scenes.

## Build

Create one component at `generated/components/<Name>.tsx`.

- Use `AbsoluteFill` as the root and frame-driven Remotion APIs such as `useCurrentFrame()`, `interpolate()`, and `spring()`.
- Set the root background according to the brief or applicable approved style; otherwise use an opaque background.
- Export a Zod schema and create default props with `schema.parse(...)`. Register both on the composition so invalid inputs fail before rendering.
- When using text, load its font at module scope and use the returned `fontFamily`, so font failures surface before rendering frames. Use `@remotion/google-fonts`, or the approved local font when the brief/style supplies one. A text-free scene needs no font import.
- Keep visual tokens and named beats in small objects. Related scenes share their style/motion constants; geometry stays local. Drive coupled events from the same progress value.
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
bun run review out/<name>.mov --preview
open out/review/<name>/<name>-preview.mp4
```

`remotion.config.ts` defines the ProRes 4444 codec and alpha-capable PNG/pixel format. Do not duplicate or override those settings at the call site.

For an explicitly transparent composition, require the alpha channel during review:

```bash
KISE_TRANSPARENT=1 bun run review out/<name>.mov --background dark --preview
```

Read `out/review/<name>/<name>-contact-sheet.jpg` and watch the preview at normal speed before showing the result. Pass important named beat frames with `--at 24,60,105` (use actual scene frames); review includes each beat and its neighbours as well as evenly spaced samples. Use `--background light` or `--background '#141414'` to judge overlays on their intended backing; the default checkerboard helps inspect alpha edges. The preview is a review copy; deliver the original ProRes master.

Check meaning and staging first, then continuity and rhythm, then surface polish as described in the creative-direction skill. For loops, watch the seam across repeated playback; for related scenes, compare the outgoing and incoming poses. Fix concrete issues and repeat render/review. If playback cannot be inspected, say so; sampled frames cannot prove smooth motion. The JSON review report records technical evidence, not creative approval.

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
