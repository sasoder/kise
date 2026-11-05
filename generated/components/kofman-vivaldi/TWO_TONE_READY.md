# Two-tone map: approved (director, 5 Nov)

The full list of changes is in SHARED_CHANGES.md (2026-11-05).
- Blue: UA_BLUE #3F6A8C at UA_WASH 0.33 (raised from 0.28 at the colour review). Red and the RED_DEEP edge still win.
- Russian-held: wash 0.18 plus hatch lines at 0.45.
- Side labels: kit "word" labels at INK_HI (SIDE_LABELS, SALIENT_RUSSIAN_LABEL, SideLabel).
- Lyman label at FRAMING_SECTOR sits in the lower caption band (y 1360-1460): director says leave it.

## Cut 0 end state, for cut 11 (opens on the exact last frame of 0_VivaldiTookBack)

Import from `./VivaldiTookBack`:
- `VivaldiEndMap({ k, id?, patch? })` draws the whole map of the last frame (from f100 the cut itself draws it).
  Pass `patch={{ fill, edge }}` to turn the red patch into the remembered patch (fill 1 -> 0, edge 0 -> 1).
- `VIVALDI_END_CAM` the camera on f144 (`camAt(DURATION - 1)`); `camAt` is exported too.
- `VIVALDI_END_HELD` (= HELD_20261015), `VIVALDI_END_FRONTS` ([FRONT_OCT_NORTH, NEW_EDGE, SOUTH_STATIC]).
- `VIVALDI_END_PATCH` = { fill: 1, edge: 0 } (flat RED, no edge yet).
- `VIVALDI_END_LABELS` = { ukraine: true, russian: false, places: ["Lyman"] } (the Russian label is gone).
- `VIVALDI_HEADER` kicker / date ("Oct 2026") / source text and positions at the end camera.
- `VIVALDI_HATCH_K` (0.95), `VIVALDI_PLACES` (["Lyman"]).
In lymanShared: `RetakenPatch({ id, k, fill, edge })`, `SideLabel`, `SIDE_LABELS`, `UkraineWash`.

Checkpoint stills (scratch):
- /private/tmp/claude-501/-Users-tom-Documents-tom-fant-CAPTIONSTOOL-kise/cdc1b1fb-4fe0-4920-93ba-8b308d705842/scratchpad/cut0/two_tone_sector.png
- /private/tmp/claude-501/-Users-tom-Documents-tom-fant-CAPTIONSTOOL-kise/cdc1b1fb-4fe0-4920-93ba-8b308d705842/scratchpad/cut0/two_tone_salient.png
- /private/tmp/claude-501/-Users-tom-Documents-tom-fant-CAPTIONSTOOL-kise/cdc1b1fb-4fe0-4920-93ba-8b308d705842/scratchpad/cut0/two_tone_stalemate.png
