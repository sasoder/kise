# starlinkShared.tsx — changes after SHARED_READY

- 2026-11-04 (builder A, director round 1): additive only, every default keeps the old look.
  - `UplinkPulse` new optional props: `twinkle` (the dot swells by up to 1.1x its radius and soaks to RED_HI over 4 f
    as each ring leaves, then eases back over 20 f: cut B's terminal flash), `ringFrom` (ring base radius as a multiple
    of the dot's; B's look is 2), `grow` (0..1, the dot grows in place from its centre).
  - New exports: `FLASH_IN` (4), `FLASH_OUT` (20), `FLASH_SWELL` (1.1), `uplinkFlash(age)` (the twinkle's 0..1 strength
    `age` frames after a ring's birth).
- 2026-11-04 (builder A, director round 2): additive only. `UplinkPulse` new optional prop `rings` (default true);
  `rings={false}` draws only the dot (with its twinkle when `twinkle`). Ring props stay as they were.
