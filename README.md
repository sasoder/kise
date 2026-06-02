# kise

Agent-driven motion graphics harness built on [Remotion](https://remotion.dev).

Describe what you want in natural language. kise plans the motion, composes it from reusable Remotion primitives where possible, renders it, reviews the output, and iterates until it's right.

Over time, kise learns how you work. Preferred fonts, colors, and motion styles are saved to a persistent memory file (`MEMORY.md`). Compositions you approve get added to a reusable registry.

![kise.gif](./kise.gif)
One-shot overview of how kise works 🧑‍💻

## Setup

```bash
git clone https://github.com/sasoder/kise.git
cd kise
bun install # install deps + remotion skills
```

## How it works

1. Open the folder with any agent harness (OpenCode, Codex, Cursor, Claude, etc.)
2. You describe a motion graphic in plain language
3. The agent writes a compact motion plan: beats, timing, palette, type, primitives, and review checks
4. The agent builds with timeline primitives or a bespoke Remotion component when needed
5. The agent renders the video, creates a contact sheet, and writes a basic QA report
6. The agent explains its creative choices and suggests possible improvements
7. Recurring choices (fonts, palettes, easing) can be saved to memory so future sessions start closer to what you want
8. Approve a composition and it joins the registry for future use

## Defaults

| Setting    | Default        | 
|------------|----------------|
| Resolution | 1080×1080      |
| Frame rate | 30fps          |
| Duration   | 180 frames (6s)|
| Background | Transparent    |
| Codec      | ProRes 4444    |

Override any default by simply asking the agent.

## Project structure

```
src/
  index.ts                    Entry point
  Root.tsx                    Composition definitions
  lib/component-registry.ts   Reusable component registry
  lib/motion/                 Reusable motion primitives
  lib/timeline/               Motion plan schema + timeline renderer
generated/components/         Agent-created scenes
generated/timelines/          Agent-created motion plans
scripts/                      Contact sheet and render review utilities
out/                          Rendered output (gitignored)
MEMORY.md                     Persistent user preferences
.agents/skills/               Remotion best-practice rules (36 rule files)
```

## Review utilities

```bash
bun run render TimelinePreview out/TimelinePreview.mov
bun run review:contact-sheet -- --composition TimelinePreview
bun run review:render -- --composition TimelinePreview --video out/TimelinePreview.mov
```

## License

MIT
