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
3. Kise chooses a visual language and named action beats, builds the Remotion composition, renders a ProRes MOV, and reviews both sampled frames and playback.
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
scripts/review.mjs             Beat-aware contact sheets and playback previews
out/                           Rendered output (gitignored)
MEMORY.md                     Persistent creative preferences
```

## Motion direction

For clean motion graphics, Kise defines consistent shape/colour meanings, spacing,
strokes, timing, and camera behaviour before animating. Related scenes share a small
set of constants. Named beats connect the action to transcript cues or a deliberate
setup → action → settle rhythm. Animation principles guide useful choices such as
anticipation, curved paths, and follow-through; they do not require a bouncy style.
Explicit briefs and applicable approved styles in `MEMORY.md` override defaults.

## Reviewing renders

Install `ffmpeg` and `ffprobe` on your PATH for review. Rendering still uses Remotion.

```bash
bun run review out/scene.mov --preview
# Inspect a handoff at f42 and a landing at f96, including their adjacent frames:
bun run review out/scene.mov --at 42,96 --preview
# Judge a transparent overlay over its intended backing:
KISE_TRANSPARENT=1 bun run review out/overlay.mov --background dark --preview
```

The review directory contains a contact sheet, a JSON report mapping samples to
source frames, and an optional H.264 MP4 with source audio when present. The ProRes
master is untouched. Inspect the sheet for staging and edges, then watch playback
for continuity, timing, and settling. For a loop, watch repeated playback across the
seam. Neither the report nor successful encoding constitutes creative approval.

Options:

| Option                 | Behaviour                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `--frames 9`           | 2–60 evenly spaced samples, always including first and last                               |
| `--at 42,96`           | Add up to 30 exact beat frames and their immediate neighbours                             |
| `--background checker` | `checker` (default), `dark`, `light`, or quoted `'#RRGGBB'`; applies to sheet and preview |
| `--preview`            | Create a playback copy with its longest edge at most 960px                                |
| `--out-dir path`       | Put review artifacts here; existing unrelated files are preserved                         |
| `--sheet path`         | Override the contact-sheet path                                                           |

Frame indices are zero-based. Review targets constant-frame-rate rendered masters;
variable-frame-rate inputs should be normalized before judging beat timing.
`KISE_TRANSPARENT=1` requires an alpha-capable pixel format; it does not prove that
any pixel is transparent. Inspect the overlay against its backing. Frame labels are
burned in when FFmpeg has drawtext and a supported font; otherwise use the report's
reading-order map.

For changes to review tooling, run `bun test scripts/review.test.mjs` (requires
FFmpeg), plus `bun run lint`. The tests use generated video fixtures with alpha,
frame-varying content, and an audio track longer than the video.

## License

MIT
