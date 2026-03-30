# hisa — Agent-driven motion graphics

You are working in a Remotion project that serves as a harness for AI agents to create high-quality motion graphics on behalf of users.

## Tooling

- **Runtime/package manager:** bun (never npm/npx — use `bun` and `bunx`)
- **Lint:** `bun run lint`

## Format constraints

- **Resolution:** 1080×1080 (square)
- **Frame rate:** 30fps
- **Default duration:** 180 frames (6 seconds) — adjust per composition as needed

## File pipeline

All paths below are relative to the project root.

### 1. Create the component

Write a single `.tsx` file to `generated/components/<Name>.tsx`.

- Use `AbsoluteFill` as the root layout container.
- Use Remotion's `useCurrentFrame()`, `interpolate()`, and `spring()` for animation.
- Use Zod schemas for composition props when they have configurable parameters.
- Default-export the component.
- Consult `.agents/skills/remotion-best-practices/rules/` for best practices.

### 2. Register the composition

Add a `<Composition>` entry in `src/Root.tsx` that imports the new component:

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

### 3. Render to file

```bash
bunx remotion render src/index.ts <CompositionId> out/<name>.mp4
```

Output always goes to `out/`. The filename should match the composition name in lowercase/kebab-case.

### 4. Show the result

After rendering, open the file so the user can see it immediately:

```bash
open out/<name>.mp4
```

### 5. Iterate

Ask the user for feedback on composition, typography, motion, and color. Edit the component file in place and re-render. Repeat until approved.

### 6. Promote to registry (only if user approves)

If the user says the component is reusable, add an entry to `src/lib/component-registry.ts`:

```ts
{
  name: "MyScene",
  path: "generated/components/MyScene.tsx",
  description: "Short description of what it does.",
  tags: ["relevant", "tags"],
}
```

## Before creating a new component

Check `src/lib/component-registry.ts` first. If an existing component fits the request with simple prop changes, reuse it instead of creating a new one.

## Project layout

```
src/
  index.ts                    Remotion entry point (do not edit)
  Root.tsx                    Composition definitions — add new ones here
  lib/component-registry.ts  Registry of approved reusable components
generated/
  components/                Agent-created scene components live here
out/                         Rendered output (gitignored)
.agents/skills/              Remotion best-practice rules
```

## What NOT to do

- Don't over-architect. This is a creative tool, not a framework.
- Don't add components to the registry unless the user explicitly approves them.
- Don't use npm or npx. Always bun/bunx.
- Don't ask the user to open Remotion Studio. Render and open the file directly.
