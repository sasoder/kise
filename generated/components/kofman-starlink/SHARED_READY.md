# starlinkShared.tsx — ready (builder A, StarlinkLinksDrones)

Import from `./starlinkShared`. Probe: `starlinkSharedProbe.tsx` (entry `src/entry.StarlinkSharedProbe.ts`).

- `DRONE_D` — Phosphor "drone" fill (MIT, 256 box), verbatim from `assets-src/kofman-starlink/phosphor_drone_fill.svg`; draw with the kit's `Pictogram d={DRONE_D}`.
- `UGV_D` — a solid tracked ground robot in the same weight (256 box, faces right, nonzero winding): track loop with road wheels knocked out, low flat hull with sloped nose, short sensor mast at the rear. No turret, no gun.
- `UGV_TRACK`, `UGV_HULL`, `UGV_MAST` — the UGV's geometry in box units (for contact points).
- `UplinkPulse {x, y, k, S, period?=40, phase?=0, r?=10, reach?=6, start?, dot?=true, on?=1, color?=RED}` — the Starlink "alive" signal: a red dot (radius `r` screen px at k 1, size law applies) sending out a thin RED_HI ring every `period` f that spreads to `reach` x r, thins, blurs and fades (never pops). `start` = first ring's birth frame (omit: already running on f0); `phase` staggers many pulses; `dot={false}` draws rings only (e.g. over your own seal/dot); `on` (0..1) fades the rings in.
- `PULSE_PERIOD` (40), `PULSE_DOT_PX` (10) — the defaults above.
