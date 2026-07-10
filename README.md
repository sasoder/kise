# kise

Agent-driven video and motion graphics built with [Remotion](https://remotion.dev).

Describe the finished piece in natural language. Kise interprets the creative brief, builds and renders the composition, visually reviews it, and iterates with you until it is right.

![kise.gif](./kise.gif)

## Setup

```bash
git clone https://github.com/sasoder/kise.git
cd kise
bun install
```

`bun install` also installs the current Remotion best-practice skill for supported coding agents. Run `bun run install:skills` to refresh it later.

## Use

1. Open the folder with a coding agent (Codex, Claude Code, Cursor etc.).
2. Describe the video you want, including only the constraints you care about (transparency, font, colors, etc.)
3. Kise chooses the remaining creative direction, builds the Remotion composition, renders a ProRes MOV, and checks sampled frames for visual problems.
4. Refine it conversationally.
5. Save recurring preferences or promote an approved composition for reuse when Kise asks.

## Defaults

| Setting    | Default                                         |
| ---------- | ----------------------------------------------- |
| Resolution | 1080×1920 vertical                              |
| Frame rate | 30fps                                           |
| Duration   | Inferred from the brief; 6s without timing cues |
| Canvas     | Complete opaque scene                           |
| Output     | ProRes 4444 MOV                                 |

Ask for a transparent background, alpha channel, overlay, or lower third when you need compositing output.

## Project structure

```text
src/
  index.ts                    Entry point
  Root.tsx                    Current composition
  lib/component-registry.ts  Approved reusable components
generated/components/         Agent-created scenes
.agents/skills/               Kise and installed Remotion guidance
scripts/review.mjs             Render contact-sheet review
out/                           Rendered output (gitignored)
MEMORY.md                     Persistent creative preferences
```

## License

MIT
