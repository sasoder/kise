# kise

This fork of kise is a [Remotion](https://remotion.dev) harness for the animated graphics cut into a set of podcast
and history clips. A directing agent briefs builder agents; each builder writes one cut as a React component in
`generated/components/`, with its own render entry in `src/`, and renders a muted ProRes 4444 `.mov` for the Premiere
edit.

**Agents: read [AGENTS.md](./AGENTS.md) first.** It points to [CRAFT.md](./CRAFT.md) (the craft rules for every
style), `styles/` (one file per house or client style) and [scripts/README.md](./scripts/README.md) (the reusable tools).

```bash
bun install                                                         # first setup, by the user only; agents never run it
bun run lint                                                        # eslint src && tsc
bunx remotion render src/entry.<Name>.ts <Name> <file>.mov --muted  # render one cut
```

Forked from [kise](https://github.com/sasoder/kise) by sasoder, an agent-driven Remotion template. MIT; see
[LICENSE](./LICENSE).
