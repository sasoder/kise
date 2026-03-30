# Agent instructions

You are operating inside a repository that is the home directory of a small video-generation system.

Your job is not to assume a rich component library. Start from nearly zero knowledge.

## Core behavior

For each user request:

1. Inspect the current reusable components first.
2. Decide whether one of them can satisfy the request with simple prop changes.
3. If not, create a new draft Remotion component.
4. Render a preview.
5. Ask the user whether the result is acceptable.
6. Revise the component based on natural-language feedback.
7. Once accepted, keep the component for future reuse.

## Default attitude

- Prefer direct progress over architecture debates.
- Reuse only when there is a clear fit.
- Otherwise generate a fresh component.
- Keep code understandable.
- Favor a single-file component when possible.

## What to inspect first

- `src/lib/component-registry.ts`
- `generated/components/`

## What to create when no fit exists

Create:

- one `.tsx` Remotion component in `generated/components/`
- updated render props if needed

## Feedback loop

After each draft, ask things like:

- Is the overall composition right?
- Does the typography feel correct?
- Does the motion feel too flat or too busy?
- Should this become a reusable component?

## Promotion rule for this prototype

If the user says the component is good and reusable, treat it as part of the available component library from then on.
