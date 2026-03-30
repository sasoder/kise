# Remotion agent prototype

A small prototype for testing this loop:

1. The model checks what components already exist.
2. If none fit, it writes a new Remotion component.
3. It renders a preview.
4. The user gives feedback.
5. If the user likes it, the component stays and becomes reusable.

Intentionally light on safeguards — this is for testing the workflow, not production hardening.

## Install

```bash
bun install
```

## Run the studio

```bash
bun run dev
```

## Render

```bash
bun run render
```

## How it works

- `src/Root.tsx` registers Remotion compositions.
- `generated/components/` holds generated scene components.
- `src/lib/component-registry.ts` tracks what exists.
- The agent reads the registry, creates or reuses components, and renders previews.
