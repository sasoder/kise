# kise

Agent-driven motion graphics harness built on [Remotion](https://remotion.dev).

Describe what you want in natural language. The agent creates a Remotion component, renders it, and opens the video for you. Iterate with feedback until it's right.

Over time, Kise learns how you work. Preferred fonts, colors, and motion styles are saved to a persistent memory file (`MEMORY.md`). Compositions you approve get added to a reusable registry. The more you use it, the less you have to explain.

## Setup

```bash
bun install
```

## How it works

1. **You describe** a motion graphic in plain language.
2. **The agent builds** a Remotion component, loads the relevant best-practice rules, and renders it.
3. **You watch and iterate.** The agent explains its creative choices and suggests improvements.
4. **Preferences stick.** Recurring choices (fonts, palettes, easing) can be saved to memory so future sessions start closer to what you want.
5. **Good components are reusable.** Approve a composition and it joins the registry for future use with different props.

## Defaults

| Setting    | Default        | Configurable? |
|------------|----------------|---------------|
| Resolution | 1080×1080      | Yes           |
| Frame rate | 30fps          | Yes           |
| Duration   | 180 frames (6s)| Yes           |
| Background | Transparent    | Yes           |
| Codec      | ProRes 4444    | Yes           |

Override any default per composition as needed.

## Project structure

```
src/
  index.ts                    Entry point
  Root.tsx                    Composition definitions
  lib/component-registry.ts  Reusable component registry
generated/components/         Agent-created scenes
out/                          Rendered output (gitignored)
MEMORY.md                     Persistent user preferences
.agents/skills/               Remotion best-practice rules (36 rule files)
```

## License

MIT
