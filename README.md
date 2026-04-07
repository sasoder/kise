# kise

Agent-driven motion graphics harness built on [Remotion](https://remotion.dev).

An AI agent creates, previews, and iterates on motion graphics components based on natural-language requests. Components are Remotion compositions rendered as square (1080×1080) video at 30fps.

## Setup

```bash
bun install
```

## Usage

Describe what you want to the agent. It will:

1. Create a Remotion component in `generated/components/`.
2. Register a composition in `src/Root.tsx`.
3. Render to MOV and open the file for you to watch.
4. Iterate based on your feedback until you're happy.

When a prompt is broad, the project usually maps best to concise motion-graphics work.

The repo may start with no reusable components and no prebuilt scenes. In that case, the first request simply becomes the initial composition.

## Project structure

```
src/
  index.ts                    Entry point
  Root.tsx                    Composition definitions
  lib/component-registry.ts  Reusable component registry
generated/components/         Agent-created scenes
out/                          Rendered output (gitignored)
.agents/skills/               Remotion best-practice rules
```
