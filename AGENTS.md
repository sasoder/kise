# kise — Agent-driven motion graphics

You are working in a Remotion project that serves as a harness for AI agents to create high-quality motion graphics on behalf of users.

## Tooling

- **Runtime/package manager:** bun (never npm/npx — use `bun` and `bunx`)
- **Lint:** `bun run lint`

## Defaults

- **Resolution:** 1080×1080 — override per composition when the user asks
- **Frame rate:** 30fps
- **Duration:** 180 frames (6 seconds) — adjust as needed
- **Background:** transparent — never set a background color on `AbsoluteFill` unless the user explicitly asks for one

## Execution

All dependencies are pre-installed. Never check `node_modules`, grep `package.json` for installed packages, or attempt to install packages. If a render fails due to a missing import, that's the time to install — not before.

For a new animation, read only what you need to build and render:

- `MEMORY.md`, `src/Root.tsx`, `src/lib/component-registry.ts`
- Relevant skill rules from `.agents/skills/`

Then implement immediately. Do not explore project config, lint setup, or unrelated source files unless a render error forces it.

## Working with the user

Be a creative collaborator, not just an executor.

- If a request is ambiguous, ask one or two clarifying questions. When it's clear, just build it.
- After rendering, briefly explain the creative choices you made so the user can give targeted feedback.
- If you notice the user gravitating toward the same choices across sessions, ask if they want to save it to `MEMORY.md`.

## Session memory

**Read `MEMORY.md` at the start of every session.** It contains persistent preferences that apply across compositions.

Save to `MEMORY.md` when the user states a clear imperative ("never use green") or confirms a recurring preference you've surfaced. Always confirm before saving. Keep entries terse. Replace contradicted entries.

## Core workflow

The default flow for a new motion graphic is now:

1. Read `MEMORY.md`, `src/Root.tsx`, `src/lib/component-registry.ts`, and the timeline/primitives in `src/lib/timeline/` and `src/lib/motion/`.
2. Create a compact motion plan before writing JSX:
   - concept
   - beats with frame ranges
   - palette/type/motion style
   - tracks or primitives to use
   - review checks
3. Prefer composing from reusable primitives and timeline tracks before writing bespoke animation code.
4. Render.
5. Create a contact sheet and QA report.
6. Patch and rerender when the review finds concrete issues.

The user still experiences this as a single prompt. The internal plan is for quality and iteration, not for user busywork.

## File pipeline

### 1. Create the component

For most new animations, prefer one of these approaches:

- Create a timeline plan using `MotionPlan` from `src/lib/timeline/schema.ts`, then render it with `TimelineComposition`.
- Write a single bespoke `.tsx` file to `generated/components/<Name>.tsx` only when the requested motion needs custom logic that the timeline primitives cannot express cleanly.

- `AbsoluteFill` as root container; `useCurrentFrame()`, `interpolate()`, `spring()` for animation.
- Zod schemas for configurable props. Default-export the component.
- Use `@remotion/google-fonts` for fonts.
- **Load the relevant skill rules before writing code.** Match the request to files in `.agents/skills/remotion-best-practices/rules/` — e.g. text work → `text-animations.md` + `fonts.md`, charts → `charts.md`, audio → `audio.md`. See `SKILL.md` for the full index.

### 2. Register the composition

Add a `<Composition>` entry in `src/Root.tsx`:

```tsx
<Composition
  id="MyScene"
  component={React.lazy(() => import("../generated/components/MyScene"))}
  durationInFrames={180}
  fps={30}
  width={1080}
  height={1080}
/>
```

### 3. Render and show

```bash
bunx remotion render src/index.ts <CompositionId> out/<name>.mov
bun scripts/contact-sheet.mjs --composition <CompositionId>
bun scripts/review-render.mjs --composition <CompositionId> --video out/<name>.mov
open out/<name>.mov
```

### 4. Iterate

Edit the timeline or component in place and re-render. Use the QA report for objective fixes: transparent background, dimensions, duration, sampled stills, contact sheet, safe margins, legibility, and resolved final frame. Repeat until the user is happy. Prompt them about saving to the registry.

### 5. Promote to registry (only if user approves)

Add an entry to `src/lib/component-registry.ts`. Check the registry before creating new components — reuse with different props when possible.

## What NOT to do

- Don't over-architect. This is a creative tool, not a framework.
- Don't add components to the registry unless the user explicitly approves.
- Don't use npm or npx. Always bun/bunx.
- Don't ask the user to open Remotion Studio. Render and open the file directly.
- Don't add multiple compositions to Root.tsx. Replace the existing composition with the new one when a new composition is requested.
