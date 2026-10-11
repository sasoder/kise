# KIT_READY — `generated/components/chinatalkVintage.tsx` ("ChinaTalk, slightly vintage")

Import EVERYTHING from `./chinatalkVintage` (it re-exports what you need from `chinatalkShared`). Do not import
`chinatalkShared` yourself: its `Label`, `WetLine`, `DashedPath`, `InkPath`, `Bead`, `Seal`, `HatchFill`, `Stage`,
`PAPER`, `INK`, `RED`, `INK_W`, `WORD_PX` … carry the OLD colours, weights and the y-835 camera. The kit has its own
versions under the same names. Look: `out/logan-brezhnev/kit/kit_sheet.png` (source of that frame:
`generated/components/VintageKitSheet.tsx`, a working example of every part).

## Tokens
| name | value | meaning |
|---|---|---|
| `V_PAPER` | `#F2EBDB` | aged rice paper (the stage draws it; use it for paper-coloured seams / knock-outs) |
| `V_INK` | `#241C16` | sepia-black ink. Rungs `INK_HI` 0.90 (the subject now) / `INK_LO` 0.42 (context) |
| `RED` | `#C9281C` | letterpress vermilion: ONE meaning per cut |
| `RED_DEEP` / `RED_WET` / `RED_HI` | `#89190F` / `#E2432D` / `#EC5C46` | at rest or negative / the wet stretch being drawn / one travelling highlight |
| `V_PRINT_WHITE` | `#F8F2E4` | a photo print's border |
| `LINE` | 6 | every ink outline, SCREEN px at k = 1 |
| `RED_LINE` | 14 | a red data line |
| `HAIR` | 2 | the only thin line allowed (axis hairlines) |
| `DASH` / `GAP` / `DASH_LINE` | 22 / 16 / 5 | dashed ink = planned / expected / the road not taken |
| `WORD_PX` / `VALUE_PX` | 40 / 60 | label sizes on screen (a floor) |
| `CORNER` / `SEAL_R` | 18 / 5 | container corners / seal-square corners; pills are fully round |
| `UNIT_PX` | 26 | one resource unit (seal square) |
| `ICON_MIN_PX` | 96 | icons are never smaller on screen |
| `SEAM` | 3 | the paper seams that count a `RedBar` into units |
| `CAPTION_Y0` / `CAPTION_Y1` / `SIDE_SAFE` | 1080 / 1250 / 60 | the caption strip (screen y) and the side margin |
| `FRAME_W` / `FRAME_H` | 1080 / 1920 | |

## Camera: world -> screen
A plain CENTRE camera `Cam = {x, y, k}`: `screen = (540 + (wx - cam.x) * k, 960 + (wy - cam.y) * k)` (+ the house sway,
≤ 5 px). World (cam.x, cam.y) is the TRUE CENTRE of the frame. No `CAM_LIFT`. If you lay your world out in screen
coordinates, `vCam(540, 960, 1)` shows it 1:1.
- `vCam(lookX, lookY, k): Cam` — the camera that centres a world point.
- `type VCamKey = {f, x, y, k, ease?: "smooth" | "linear"}` — "at frame f look at (x, y) with zoom k"; `ease` shapes the
  segment ARRIVING at the key.
- `runVCamera(keys: VCamKey[], lastFrame?: number): (S) => Cam` — the house damped follower (CAM_STIFF / CAM_DAMP)
  chasing the keys. Author the camera as its own track (never from the subject's position). It starts at rest on the
  first key: to be already moving on frame 0 put the first key at `f: -24`; to keep the settled frame alive end with a
  slow `ease: "linear"` key on the last tail frame.
- `runVGlides(start, glides: Glide[], f0, f1): (S) => Cam` — the same, from a `chinatalkShared` glide list.
- `vTargetAt(keys, f)`, `toScreen(cam, wx, wy)`, `toWorld(cam, sx, sy)`, `camJerkAt(camAt, S0, S1)`, `camEase`,
  `evenEase`, `camFromTrack`.

## Keeping weights on screen under zoom
Everything is named in SCREEN px at k = 1 and goes through `vz(k) = k^-0.25` (the `sz(k)` law, re-based at k = 1): on
screen a weight is `px * k^0.75` (LINE is 6 px at k = 1, 5.1 at k = 0.8, 8.1 at k = 1.5). The components do this
themselves from the `k` you pass (always pass the CURRENT `cam.k`). For your own SVG shapes:
- `lineW(k)`, `redW(k)`, `hairW(k)` — WORLD stroke width of LINE / RED_LINE / HAIR.
- `wpx(px, k)` — world size of anything named in screen px (e.g. `rx={wpx(CORNER, k)}`); `vz(k)` the multiplier.
- `constPx(px, k)` — world size that is EXACTLY px on screen (use sparingly).
- Labels: `labelPx(size, k)` (world font size; on screen 40 / 60 at k ≤ 1, growing k^0.75 above), `labelWidth(text,
  size, k)`, `labelCapH(size, k)`.

## Stage
`<VStage S cam rest? photos? finish? swayOn?>{svg world}</VStage>`
- `S` master clock (frame); `cam` from your `camAt(S)`; `rest` = the fixed camera the paper parallax is measured against
  (default `vCam(540, 960, 1)`; pass your opening camera).
- `children` = the SVG WORLD layer (world px). `photos` = the HTML WORLD layer UNDER it, same camera transform.
- Draws: V_PAPER + `public/china/paper_vintage.png` (parallax 0.15, slow drift), photos, drawing, aged edge toning
  (~11 % toward warm brown at the corners), then the print finish (fine grain changing every 2 frames + paper fibre
  through ink and red). `finish={false}` only for timing tests. The house sway is KEPT (`swayOn={false}` drops it).
- `useVStageView()` — `{cam, dx, dy}` inside the stage. `PrintFinish` is exported but the stage already draws it.

## A photograph under the drawing
```tsx
const BOX = { x: 150, y: 250, w: 780, h: 520 };            // the PICTURE window, world px
<VStage S={S} cam={cam} photos={<VintagePhoto src="logan-brezhnev/photo.jpg" box={BOX} focus={{ x: 0.35, y: 0.6 }} />}>
  <WetLine id="r" points={pts} k={cam.k} len={len} bead={1} />   {/* red ink over the photo: same world coords */}
</VStage>
```
`VintagePhoto {src, box: {x, y, w, h}, focus?: {x, y}, zoom?, rotate?, border?, shadow?}`
- `src`: a path under `public/` (or an already resolved `staticFile()` URL).
- `box`: the picture window in WORLD px. The 14 px print border (`PHOTO_BORDER`) lies OUTSIDE it.
- The image covers the window; `focus` = object-position as fractions 0..1 (default centre) chooses the crop; `zoom ≥ 1`
  enlarges about the focus point. `rotate` degrees; `border` / `shadow` default on.
- Treatment is built in (grayscale, gentle contrast, sepia duotone `PHOTO_BLACK`..`PHOTO_WHITE`, print border, contact
  shadow). Do not add filters. Move / animate it by changing `box`.
- `photoPoint(box, natural: {w, h}, u, v, focus?, zoom?): Pt` — where the source image's point (u, v in 0..1) lands in
  the world (rotate must be 0), to pin ink to something in the picture.

## Components (SVG world; always pass the current `k`)
- `Label {text, x, y, k, size: "word" | "value", rung?, appear?, exit?, diffuse?, anchor?, color?}` — (x, y) = centre of
  the capitals. `appear={enterU(S, wordS)}` or `enterFrom(S, startS)` slides up 24 px + fade + blur over 12 f;
  `exit={exitU(S, startS)}`; `diffuse` retires it like ink. Words are upper-cased. Never set a font size.
- `WetLine {id, points: Pt[], len?, k, ageAt?, ink?, rung?, width?, bead?, wetLen?, shadow?}` — a line WRITTEN in wet
  ink, drawn `[0, len]` world px of arc length. Red (RED_LINE + paper shadow) by default; `ink` = an ink line (LINE).
  `bead` 0..1 = the bead at the tip; `ageAt(s)` = frames since arc length s was drawn (wet stretch dries over 18 f).
- `Bead {id, x, y, k, r?, color?, opacity?, bloom?}`.
- `InkPath {points, k, draw?, rung?, width?, color?, close?}` — a plain ink stroke `[0, draw]`; `width={HAIR}` for an
  axis hairline.
- `DashedPath {points, k, S?, draw?, rung?, width?, color?, march?, dashMod?}` — dashed ink (planned). Dashes march
  toward the head on S unless `march={false}`.
- `RedBar {id, from: Pt, to: Pt, width, k, len?, seam?, slot?, head?, radius?, color?, wet?, shadow?, opacity?}` — a
  thick red bar from `from` toward `to`, `width` world px thick, drawn from its start to `len` world px. Alone: a PILL
  with a round head. With `slot`: the fill of a `Slot` with the same from / to / width (container corners, flat front).
  `seam` = world px pitch of the paper seams (counted units). `wet` 0..1 wets the head while it is drawn.
- `Slot {from, to, width, k, rung?, radius?, dashed?, wash?, color?}` — the ink outline a `RedBar slot` fills; draw it
  AFTER the bar. `radius={width / 2}` = a pill slot; `dashed` = a planned slot; `wash` ≤ 0.10 ink tint inside.
- `barCross(from, to, width, at, over = 18): {from, to}` — the ends of a mark crossing a bar at `at` world px.
- `PlanMark {from, to, k, S?, rung?, draw?, solid?, march?, color?}` — the dashed PLAN line; `solid` 0..1 writes a solid
  LINE over it from `from` (the plan became what happened).
- `Unit {x, y, k, size?, color?, rotate?, opacity?, hollow?}` — one resource unit (red seal square; `hollow` = an empty
  place, ink outline). No shadow of its own: wrap red units in ONE `<RedGroup k={k}>…</RedGroup>`.
- `Seal {x, y, k, grow?, size?, color?, opacity?}` — a red data-point marker.
- `Icon {d, x, y, size, k, rung?, color?, rotate?, draw?}` — inline Lucide icon centred on (x, y), 24-box `size` world
  px, stroked at LINE on screen. `d={ICONS.factory}`; `ICONS` has `building2, cpu, factory, house, rocket, tractor,
  trainFront, utilityPole, wheat, zap` (the local SVGs, rects / circles already converted to paths). `draw` 0..1 writes
  the strokes in.
- `HatchFill {id, region: Pt[], k, color?, opacity?, pitch?, angleDeg?, width?, anchor?, fill?, lineOpacity?}` — ink
  hatch (+ wash `fill` 0.10, `lineOpacity` 0.35) clipped to a closed region.
- `RedGroup {k}` — a `<g>` with the warm paper shadow for red things; ink sits flat (no shadow).
- Re-exported unchanged from `chinatalkShared`: `InkDiffuse {u, k, cx, cy}` + `inkDiffuse(u)` (things that stop existing),
  `FeatherWipe {id, box, u, feather, dir?}`, `paperShadow(k)`, `worldBlur(px, k)`, `enterU`, `enterFrom`, `exitU`,
  `rungAt(S, startS, from, to)`, `ENTER_F`, `ENTER_LEAD`, `EXIT_F`, `RISE_PX`, `RUNG_F`, `lerp`, `clamp01`, `smoothstep`,
  `easeOutCubic`, `easeInCubic`, `easeInOutCubic`, `shootEase`, `hash01`, `mixHex`, `cumLen`, `pointAtLen`, `subPathD`,
  `polyD`, `FONT_SANS`, `FONT_SERIF`, `EDGE_SAFE`; types `Cam`, `Pt`, `Anchor`, `LabelSize`, `Glide`, `DashMod`,
  `StageView`, `FollowerState`.

## Minimal cut
```tsx
import React from "react";
import { useCurrentFrame } from "remotion";
import { ICONS, INK_LO, Icon, Label, RedBar, Slot, VStage, VintagePhoto, enterU, runVCamera } from "./chinatalkVintage";
const camAt = runVCamera([{ f: -24, x: 540, y: 990, k: 1 }, { f: 60, x: 540, y: 960, k: 1.12 }, { f: 116, x: 544, y: 956, k: 1.15, ease: "linear" }], 116);
const A = { x: 160, y: 1400 }, B = { x: 920, y: 1400 };
const Cut: React.FC = () => {
  const S = useCurrentFrame();
  const cam = camAt(S), k = cam.k;
  return (
    <VStage S={S} cam={cam} rest={camAt(0)} photos={<VintagePhoto src="logan-brezhnev/photo.jpg" box={{ x: 150, y: 300, w: 780, h: 520 }} />}>
      <RedBar id="bar" from={A} to={B} width={120} k={k} slot seam={76} len={Math.min(760, 40 + S * 9)} wet={S < 80 ? 1 : 0} />
      <Slot from={A} to={B} width={120} k={k} />
      <Icon d={ICONS.factory} x={240} y={1640} size={150} k={k} rung={INK_LO} />
      <Label text="Plan" x={540} y={1290} k={k} size="word" appear={enterU(S, 48)} />
    </VStage>
  );
};
```

## Traps
- `RED`, `WORD_PX`, `VALUE_PX`, `DASH`, `Label`, `WetLine`, `DashedPath`, `InkPath`, `Bead`, `Seal`, `HatchFill` exist
  in BOTH kits with different values. Import them from `./chinatalkVintage` only.
- `width` props of `WetLine` / `InkPath` / `DashedPath` / `HatchFill` are SCREEN px at k = 1 (kit weights), not world px.
  `RedBar` / `Slot` `width`, `seam`, `len`, `radius` and every position are WORLD px.
- Photos go in `photos=`, never as SVG `<image>` (it drops frames). An SVG child cannot go UNDER a photo.
- Every `id` (WetLine, Bead, RedBar, HatchFill, FeatherWipe) must be unique in the frame.
- `rung` on an `Icon` / ink `WetLine` is a group opacity; do not also wrap them in another opacity.
- One paper shadow filter per group is cheap, one per Unit is not: use `RedGroup`.
- The print finish is two neutral soft-light layers over everything: do not add your own grain, noise, vignette or
  paper tint, and do not draw a paper-coloured rect to "erase" something (the fibre and grain still show; use `V_PAPER`
  and it will match).
- The camera's follower lags its keys by ~8-10 frames; key the look a little early.
- Label sizes are floors at 40 / 60 px on screen and grow with zoom above k = 1; check `labelWidth` for fit.
- No `Odometer` in this kit (the shared one has the old sizes); a number that changes is a new `Label`.
- Nothing readable in screen y 1080-1250: `toWorld(cam, 540, CAPTION_Y0).y` gives the strip's world y.

## Print finish (what VStage draws on top) and its cost
- Fibre: `public/china/fibre_vintage.png` (the SAME fibres as the paper, as a neutral mean-128 map), soft-light at
  `FIBRE_OPACITY` 0.45, moving with the paper ground. Grain: `public/china/grain_0..3.png` (neutral mean-128 noise),
  soft-light at `GRAIN_OPACITY` 0.6, a new frame (hashed offset + flip) every `GRAIN_HOLD` = 2 frames.
- Neutral soft-light instead of multiply: no tint, about 4-5 % on mid-tones (red, photo), under 1 % on bare paper.
- Measured on the kit sheet at full res, concurrency 1, jpeg frames: about 86 ms / frame with the finish, 69 ms
  without (+17 ms, about +25 %).
- Edge roughness (SVG turbulence displacement) was tried and LEFT OUT: +140 % render time (about 207 ms / frame) and
  it read as wobbly rather than printed. Vector edges are clean.

## CHANGED (since first publish)
- No exported name, signature or token value changed.
- Look only: the paper was re-baked calmer (less mottle), `FIBRE_OPACITY` 0.55 -> 0.45, `GRAIN_OPACITY` 0.5 -> 0.6.

## PASS 2 (newsprint)
The client asked for the set to lean toward a newspaper page, quietly. The kit was changed in place; every name and
signature above still works. Full contract of the pass: `KIT_NEWS_READY.md`. Look: `kit_news_sheet.png` (the pass-1
sheet `kit_sheet.png` is kept for comparison: `kit_news_side_by_side.jpg`).

Changed values and treatments (superseding the tables above):
- `V_PAPER` `#F2EBDB` -> `#EDE7D9` (newsprint); `V_INK` `#241C16` -> `#211D1A` (newspaper black); `V_PRINT_WHITE`
  `#F8F2E4` -> `#F2EDE1` (the clipping's paper); edge toning 11 % warm brown -> 10 % grey-brown (`EDGE_BROWN`
  `#7C6747`). Red, weights, label sizes, camera, grain: unchanged.
- Paper: `paper_vintage.png` re-baked as newsprint and made tileable; `fibre_vintage.png` is now full-res (2400x4200),
  carries the visible fibre, shives and fine specks, and is laid over everything in HARD-LIGHT (was soft-light) at
  `FIBRE_OPACITY` 0.62. Both repeat in world space (`PAPER_TILE`, `PAPER_ORIGIN`). One soft fold crease at world
  y 1165.
- The page is locked to the world: `VStage paperLock` (0..1, default 1). The 0.15 parallax and the paper drift of
  pass 1 are gone unless `paperLock={0}`. `rest` only matters below 1.
- `VintagePhoto` defaults to `tone="news"`: a newspaper clipping, since HALFTONE v2 a sharp black-and-white
  photograph with a 45 degree dot screen (5.5 world px, neutral ink) mixed in at `HALFTONE_MIX` 0.38.
  The pass-1 warm print is `tone="print"`. The contact shadow is lighter, the corners square.

New exports: `VintagePhoto` props `tone`, `cutline`; `Label` size `"head"` (64 px) and prop `transformCase`; `Rule`,
`Kicker`, `SourceLine`, `Pictogram` + `PICTOS` (solid Phosphor pictograms); `FONT_SERIF_ITALIC`, `HEAD_PX`,
`RULE_BOLD`, `RULE_GAP`, `CUTLINE_PX`, `CUTLINE_BAND`, `SOURCE_PX`, `KICKER_PAD`, `HALFTONE_PERIOD`, `HALFTONE_INK`,
`PAPER_TILE`, `PAPER_ORIGIN`; types `VLabelSize`, `RuleKind`, `PhotoTone`, `PictoName`. Signatures and usage:
`KIT_NEWS_READY.md`.

Superseded lines above: "Print finish ... soft-light at FIBRE_OPACITY 0.45, moving with the paper ground" (now
hard-light 0.62, locked to the page); the Stage paragraph's "parallax 0.15, slow drift"; `VintagePhoto` "Treatment is
built in (grayscale, gentle contrast, sepia duotone ...)" (that is `tone="print"` now).



---

# KIT_NEWS_READY — `chinatalkVintage.tsx`, pass 2 "newsprint"

Same file, same import (`./chinatalkVintage`). Every pass-1 export keeps its name and signature; values and treatments
changed in place and a few exports are new. `KIT_READY.md` is still the full reference for everything not listed here.
Look: `out/logan-brezhnev/kit/kit_news_sheet.png` (source: `generated/components/VintageKitSheet.tsx`, a working
example of every new part). An untouched pass-1 cut on the new kit: `out/logan-brezhnev/kit/b_on_news_f52.png`.

## What changed without you doing anything
| | pass 1 | pass 2 |
|---|---|---|
| `V_PAPER` | `#F2EBDB` aged ivory | `#EDE7D9` newsprint (greyer, less yellow, still a light page) |
| `V_INK` | `#241C16` sepia | `#211D1A` newspaper black |
| `V_PRINT_WHITE` | `#F8F2E4` print border | `#F2EDE1` the clipping's own newsprint |
| paper | parallax 0.15, drifting | LOCKED to the world (`paperLock` 1): the page pans, zooms and sways with the drawing |
| fibre | faint, soft-light | visible fibre, shives and fine specks, hard-light over everything, locked to the page |
| `VintagePhoto` | warm monochrome print | `tone="news"`: a black-and-white newspaper photograph with a halftone screen mixed in (v2 hybrid); the old look is `tone="print"` |
| edge toning | 11 % warm brown | 10 % grey-brown |
`RED`, `RED_DEEP`, `RED_WET`, `RED_HI`, every weight, `WORD_PX`, `VALUE_PX`, the camera and the grain are unchanged.

## New and extended exports
- `VStage {…, paperLock?: number}` — 0..1, default 1. 1 = the page is ONE object with the drawing. 0 = the pass-1
  paper (parallax 0.15 against `rest`, slow drift). `rest` only matters below 1; you can keep passing it.
- `VintagePhoto {…, tone?: "news" | "print", cutline?: string}`
  - `tone` default `"news"` (HALFTONE v2, a hybrid): a sharp continuous-tone black-and-white photograph (neutral ink
    `HALFTONE_INK` as black, the clipping's paper as white, tones unchanged) with a 45° dot screen
    (`HALFTONE_PERIOD` 5.5 WORLD px, soft cosine dots) mixed INTO it at `HALFTONE_MIX` 0.38. The photograph comes
    first; the dots are a printed texture on it, strongest in the mid-tones and gone in solid black and paper white.
    14 px margin (`PHOTO_BORDER`, unchanged), a fine keyline, a light contact shadow, square corners.
  - `cutline`: one line in the bottom margin, Source Serif 4 Italic, `CUTLINE_PX` 30 world px, ink high rung, left,
    as written (not upper-cased). The bottom margin grows by `CUTLINE_BAND` 44 world px: the clipping's bottom edge is
    then `box.y + box.h + PHOTO_BORDER + CUTLINE_BAND`.
- `Label {…, size: "word" | "value" | "head", transformCase?: "upper" | "none"}` — `"head"`: tracked caps like
  `"word"` at `HEAD_PX` 64 screen px, for the word that NAMES the thing on screen. `transformCase="none"` keeps the
  text as written (`1950s`); default `"upper"` as before. Type `VLabelSize`; `labelPx` / `labelWidth` / `labelCapH`
  accept `"head"`.
- `Rule {from: Pt, to: Pt, k, kind?: "hair" | "bold" | "double", rung?, draw?, color?}` — a newspaper rule, butt ends.
  hair = `HAIR` 2; bold = `RULE_BOLD` 5; double = a bold ON the line and a hair `RULE_GAP` 6 below it (to the right of
  the direction of travel). `draw` 0..1 writes it in from `from`. Default rung `INK_HI`.
- `Kicker {text, x, y, k, width, rung?, appear?, anchor?}` — a `"word"` label between a bold rule above and a hair rule
  below, both `width` world px. (x, y) = the label's caps centre; `anchor` default `"start"` (rules run right from x).
  `appear` (raw 0..1, e.g. `enterU(S, wordS)`) writes the rules in from the left while the label enters.
- `SourceLine {text, x, y, k, rung?, appear?, exit?, anchor?, color?}` — Source Serif 4 Italic, `SOURCE_PX` 28 screen
  px (a floor like the labels), default rung `INK_LO`, anchor `"start"`, as written.
- `Pictogram {d, x, y, size, color?, rung?, rotate?}` + `PICTOS` — SOLID pictograms (Phosphor fill, MIT, 256 box)
  centred on (x, y), `size` world px. `PICTOS` has `barn, bread, buildings, cpu, factory, gasPump, grains, hammer,
  hardHat, houseLine, lightning, plant, rocketLaunch, rocket, tractor, trainSimple, train, truck, wrench`.
  Solid red: `color={RED} rung={1}` inside a `RedGroup`; solid ink tint: `rung={INK_LO}`. No `k` (no stroke).
- `FONT_SERIF_ITALIC`, `HEAD_PX`, `RULE_BOLD`, `RULE_GAP`, `CUTLINE_PX`, `CUTLINE_BAND`, `SOURCE_PX`, `KICKER_PAD`,
  `HALFTONE_PERIOD`, `HALFTONE_INK`, `HALFTONE_MIX`, `PAPER_TILE`, `PAPER_ORIGIN`, types `VLabelSize`, `RuleKind`, `PhotoTone`,
  `PictoName`. `PrintFinish` gained optional `paperLock` / `swayOn` (the stage passes them).

```tsx
<VStage S={S} cam={cam} photos={<VintagePhoto src="brezhnev/brezhnev_1972.jpg" box={BOX} focus={{ x: 0.5, y: 0 }} cutline="Leonid Brezhnev, 1972" />}>
  <Kicker text="Industrial output" x={70} y={170} k={k} width={940} appear={enterFrom(S, 0)} />
  <Label text="Growth" x={596} y={332} k={k} size="head" anchor="start" />
  <Rule from={{ x: 580, y: 880 }} to={{ x: 1010, y: 880 }} k={k} kind="hair" rung={INK_LO} />
  <SourceLine text="Source: (your verified source)" x={580} y={926} k={k} />
  <RedGroup k={k}><Pictogram d={PICTOS.factory} x={300} y={1692} size={236} color={RED} rung={1} /></RedGroup>
  <Pictogram d={PICTOS.tractor} x={770} y={1700} size={236} rung={INK_LO} />
</VStage>
```

## What a cut builder must do differently
- The paper no longer slides under the drawing. A pan now carries the page's fibres and specks with it; if a cut
  leaned on the paper parallax for depth, it is gone on purpose (`paperLock={0}` brings it back; do not use it without
  the director's say).
- Photographs are newspaper photographs now: black and white, with a fine dot screen on them. They hold at half
  resolution too (the screen is a pure cosine, so it does not alias), but judge the dots themselves on a full-res
  still: the pitch is 5.5 px at k = 1 and 2.75 px in a half-res preview.
- The halftone screen is fixed to the CLIPPING (anchored at its top-left). Camera pans and zooms are fine. Do NOT
  animate `zoom` or `focus` on a `"news"` clipping (the picture would slide under its dots), and do not add filters,
  opacity fades or blurs to it. Moving the clipping (`box.x` / `box.y`, `rotate`) is fine.
- A `cutline` makes the clipping 44 world px taller at the bottom: re-check what sits under it and the caption strip.
- Paper-coloured knock-outs (`fill={V_PAPER}`) still match: the fibre and specks are laid over everything.
- The page has ONE soft fold crease at world y 1165 (the caption strip of a centred k = 1 frame; the page texture
  repeats every 2400 x 4200 world px, so it comes again at y 5365 and -3035). It is very faint; just do not land a
  face or a label's baseline exactly on it.
- Use `"head"` for the one word that names the thing; keep `"word"` for secondary labels and kickers.
- Rules organise, they are not decoration: a hair under a chart, a Kicker over it, a double to divide. Not more than
  the sheet shows.

## Dropped, and why
- Show-through (the ghost of the other side's print): tried at 2.5 %. The text lines read as horizontal banding over
  the whole page, strongest exactly where the captions go. Off (`SHOW_THROUGH = 0` in the bake script).
- Red-plate misregistration: tried at 1 screen px on the sheet (red shifted against black). It cannot be seen at
  full size, so it is not added.
- Imperfect cut edge on the clipping: not added (it needs a clip-path, which costs the box shadow or a second filter).

## Traps
- `tone="print"` still exists and looks as before, but mixed with news photographs on one page it reads as a
  different object. One tone per cut unless the director says otherwise.
- Do not draw your own paper texture, specks or fold; do not tint the page.
- `paperLock` is one value for the whole cut. Changing it over time makes the paper swim.
- Everything in `KIT_READY.md` → "Traps" still holds.

## Cost
`BrezhnevChoseDecay` frames 40-63, full res, concurrency 1, jpeg frames, one warm run each: about 93 ms / frame on
pass 1, about 123 ms / frame on pass 2 with the pure halftone, about 95 ms / frame with HALFTONE v2 (no filters left
in the photograph, only blends).

## Proofs (all in `out/logan-brezhnev/kit/`)
`kit_news_sheet.png`, `kit_news_side_by_side.jpg` (pass 1 | pass 2), `kit_news_phone270.png`, `kit_news_face100.png`,
`kit_news_move-preview.mp4` (600 px pan, then 1.0 -> 1.3 zoom over the clipping): all re-rendered on HALFTONE v2.
HALFTONE v2: `face_mix_100.png` (100 %: pass-1 print | pure halftone | hybrid), `b_on_news_v2_f0.png`,
`b_on_news_v2_face100.png`, `b_on_news_v2_phone270.png`, `b_v2_half_f0-29.mp4` + `b_v2_half_sheet.png` (cut B, first
30 frames at half res; every frame 0-11), `irkutsk_pan_v2_half.mp4` + `irkutsk_pan_v2_half_sheet.png` (300 px pan
over the Irkutsk photograph at k 1.28, half res; every frame 12-23).
Pure-halftone stills kept for comparison only: `b_on_news_f52.png`, `b_on_news_face100.png`, `b_on_news_phone270.png`.

## CHANGED (since this file was first published)
- No export, signature or token value changed.
- The page texture now REPEATS (baked tileable) instead of being mirrored: the mirror showed as a butterfly symmetry
  at the tile edge. The crease's other copies moved (see above).
- The light fibres showing through black were turned down (they read as scratches in a dark suit).
- The example's source line is now a placeholder: use only a source you have verified.
- Misregistration was actually tried after publishing; the "Dropped" note says what was seen.
- **2026-10-09 19:00 — HALFTONE v2 (values and treatment only; no name, signature, size, margin or cutline band
  changed).** `tone="news"` is no longer a pure dot screen. It is a hybrid: a sharp continuous-tone black-and-white
  photograph with the screen mixed into it. New constant `HALFTONE_MIX` = 0.38 (0 = plain photograph, 1 = a screen
  that swings a mid-grey from black to white). Why: the pure screen turned eyes into dark slots and flattened skin at
  100 %, and at half resolution its hard dot edges folded into moire (alias peaks at a 2.06 px period next to the
  2.74 px screen). What changed inside: the thresholded screen (SVG tone table + contrast filter) is gone; the screen
  is now two cosine gratings laid over the photograph in overlay. A cosine has no hard edges, so at half res the
  spectrum of a flat patch shows the screen's own frequency and nothing else. Settled on 0.38 with the soft cosine
  dots; it did not need lowering. Nothing to change in a cut: re-render.

HALFTONE v2 READY
