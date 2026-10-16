# chinatalkVintage: the ChinaTalk newsprint kit (API contract)

This is the contract for `generated/components/chinatalkVintage.tsx`, the only kit for ChinaTalk cuts.
`styles/chinatalk.md` covers what to draw and what each shape means. `generated/components/VintageKitSheet.tsx` is
a working example of every part.

## Import

- Import everything from `./chinatalkVintage`, which re-exports the shared helpers you need. The one exception is the
  crowd field mechanics (`hash`, `feather`, `wobble`, `makeTone`) from `./fieldShared` (`styles/chinatalk.md`).
- Never import `./chinatalkShared`. The kit builds on it internally, but there `RED`, `WORD_PX`, `VALUE_PX`, `DASH`,
  `Label`, `WetLine`, `DashedPath`, `InkPath`, `Bead`, `Seal`, `HatchFill`, `Stage`, `PAPER`, `INK` and the camera have
  other values. The kit has its own versions under the same names.
- Do not hand-set a colour, stroke width or font size that is defined here.
- Everything time-dependent takes the master clock `S`, never `useCurrentFrame()` inside a part.

## Tokens

| Name | Value | Use |
|---|---|---|
| `V_PAPER` | `#EDE7D9` | the newsprint page (`VStage` draws it); use it for paper-coloured knock-outs and seams |
| `V_INK` | `#211D1A` | newspaper black, always at a rung |
| `INK_HI` / `INK_LO` | 0.90 / 0.42 | ink rungs: the subject now / context |
| `RED` | `#C9281C` | letterpress red, one meaning per cut |
| `RED_DEEP` | `#89190F` | red at rest, negative or missed |
| `RED_WET` | `#E2432D` | only on the wet stretch being drawn |
| `RED_HI` | `#EC5C46` | one travelling highlight |
| `V_PRINT_WHITE` | `#F2EDE1` | a clipping's own paper (its margin) |
| `HALFTONE_INK` | `#1D1B1A` | a clipping's blacks |
| `LINE` | 6 | every ink outline (screen px at k = 1) |
| `RED_LINE` | 14 | a red data line |
| `HAIR` | 2 | the only thin line: axis hairlines and hair rules |
| `RULE_BOLD` / `RULE_GAP` | 5 / 6 | bold rule / the paper gap of a double rule |
| `DASH` / `GAP` / `DASH_LINE` / `MARCH` | 22 / 16 / 5 / 0.5 | dashed ink; dashes march 0.5 px per frame |
| `SEAM` | 3 | the paper seams that divide a `RedBar` into units |
| `WORD_PX` / `HEAD_PX` / `VALUE_PX` | 40 / 64 / 60 | label sizes on screen (floors) |
| `SOURCE_PX` | 28 | source line on screen (floor) |
| `CUTLINE_PX` | 30 | cutline, in WORLD px (it belongs to the clipping) |
| `FONT_SANS` / `FONT_SERIF` / `FONT_SERIF_ITALIC` | | Source Sans 3 SemiBold / Source Serif 4 Bold / Source Serif 4 Italic |
| `CORNER` / `SEAL_R` | 18 / 5 | container corners / seal-square corners; pills are fully round |
| `UNIT_PX` | 26 | one resource unit (a seal square) |
| `ICON_MIN_PX` | 96 | no icon is smaller on screen |
| `BEAD_RATIO` | 1.28 | bead radius as a multiple of the line weight |
| `WET_LEN` / `WET_DRY_F` | 90 / 18 | wet stretch behind a tip (world px) / frames it takes to dry |
| `PHOTO_BORDER` / `CUTLINE_BAND` | 14 / 44 | clipping margin / how much a cutline adds to the bottom margin (world px) |
| `HALFTONE_PERIOD` / `HALFTONE_MIX` | 5.5 / 0.38 | dot pitch (world px, 45°) / how strongly the screen is mixed in |
| `KICKER_PAD` | 20 | space between a kicker's caps and its rules |
| `FRAME_W` / `FRAME_H` | 1080 / 1920 | |
| `CAPTION_Y0` / `CAPTION_Y1` | 1080 / 1250 | the caption strip just below the middle (screen y); caption bands are in CRAFT.md |
| `SIDE_SAFE` / `EDGE_SAFE` | 60 / 48 | side margin / labels fade out within this distance of a frame edge |

The stage owns the print finish, so never change it per cut: `EDGE_TONE` 0.1 toward `EDGE_BROWN #7C6747`,
`FIBRE_OPACITY` 0.62 (hard-light), `GRAIN_OPACITY` 0.6 (soft-light, new every `GRAIN_HOLD` 2 frames), `PAPER_TILE`
{2400, 4200}, `PAPER_ORIGIN` {-660, -1140}. The textures `PAPER_VINTAGE_SRC`, `FIBRE_VINTAGE_SRC` and `GRAIN_SRCS` are
in `public/china/`, baked by `scripts/build-china-paper-vintage.py`.

## Size law

Weights and sizes are named in SCREEN px at k = 1. They pass through `vz(k) = k^-0.25`, so a weight shows on screen
as `px * k^0.75` (LINE is 5.1 at k 0.8 and 8.1 at k 1.5). The parts apply this themselves from the `k` you pass, so
always pass the CURRENT `cam.k`. For your own SVG:
- `lineW(k)`, `redW(k)`, `hairW(k)`: world stroke widths for LINE, RED_LINE and HAIR.
- `wpx(px, k)`: the world size of anything named in screen px (e.g. `rx={wpx(CORNER, k)}`).
- `constPx(px, k)`: a world size that is exactly `px` on screen. Use it sparingly.
- `labelPx(size, k)`, `labelWidth(text, size, k)`, `labelCapH(size, k)` for `"word" | "head" | "value"`.

## Camera

A plain centre camera `Cam = {x, y, k}`: world (cam.x, cam.y) is the true centre of the frame,
`screen = (540 + (wx - cam.x) * k, 960 + (wy - cam.y) * k)`, plus the house sway (5 / 3 px, slow).
- `vCam(x, y, k)`: the camera that centres a world point. `vCam(540, 960, 1)` shows screen-laid-out world 1:1.
- `runVCamera(keys: VCamKey[], lastFrame?) => (S) => Cam`. `VCamKey = {f, x, y, k, ease?: "smooth" | "linear"}`, where
  `ease` shapes the segment ARRIVING at the key. The house damped follower (`CAM_STIFF` / `CAM_DAMP`) chases the
  keys and starts at rest on the first one. To be moving on frame 0, put the first key at a negative frame
  (`f: -24`). To keep a settled frame alive, end on a slow `"linear"` key at the last frame. The follower lags its
  keys by about 8–10 frames, so key early.
- `runVGlides(start, glides, f0, f1)`: the same follower over a glide list.
- `vTargetAt`, `toScreen(cam, wx, wy)`, `toWorld(cam, sx, sy)`, `camJerkAt(camAt, S0, S1)` (smoothness check),
  `camEase`, `evenEase`, `camFromTrack`.
- Author the camera as its own track, never from the subject's position.

## Stage

`<VStage S cam photos? finish? swayOn? paperLock? rest?>{svg world}</VStage>`
- `children` is the SVG WORLD layer in world px. `photos` is the HTML WORLD layer UNDER it, with the same camera
  transform.
- Bottom to top it draws: `V_PAPER` and the tiled newsprint page, `photos`, the drawing, the edge toning, and the
  print finish (fibre locked to the page, grain in screen space).
- `paperLock` defaults to 1: the page is one object with the drawing. Keep it at 1 and constant for the whole cut.
  `rest` only matters below 1.
- `finish={false}` is only for timing tests. `swayOn={false}` drops the house sway.
- `useVStageView()` returns `{cam, dx, dy}` inside the stage. `PrintFinish` is for a frame with no `VStage`.

## Photographs

`VintagePhoto {src, box: {x, y, w, h}, focus?, zoom?, rotate?, border?, shadow?, tone?, cutline?}`, passed in
`VStage photos=`.
- `src`: a path under `public/` (`"brezhnev/brezhnev_1972.jpg"`) or a resolved `staticFile()` URL.
- `box`: the picture window in world px. The margin lies outside it. The image covers the window, `focus` (0..1)
  picks the crop, and `zoom` ≥ 1 enlarges about the focus point.
- `tone` defaults to `"news"`: a sharp black-and-white photograph with a soft 45° dot screen mixed in, a paper
  margin, a fine keyline, a light contact shadow and square corners. The screen is fixed to the clipping.
  `"print"` is a warm monochrome print. Use one tone per cut.
- `cutline`: one line in the bottom margin, Source Serif 4 Italic, as written. It makes the clipping
  `CUTLINE_BAND` (44) taller, so its bottom edge sits at `box.y + box.h + PHOTO_BORDER + CUTLINE_BAND`.
- `photoPoint(box, natural: {w, h}, u, v, focus?, zoom?)` gives the world point of the source image's (u, v), for
  pinning ink to the picture. `rotate` must be 0.
- Move a clipping by its `box` or `rotate`. Never animate `zoom` or `focus` on a news clipping, because the picture
  would slide under its dots. Never add filters, opacity fades or blurs.

## Labels and type

- `Label {text, x, y, k, size: "word" | "head" | "value", rung?, appear?, exit?, diffuse?, anchor?, color?, transformCase?}`.
  (x, y) is the centre of the capitals. `"word"` and `"head"` are tracked caps (upper-cased unless
  `transformCase="none"`, e.g. "1950s"), and `"value"` is serif lining figures. `appear={enterU(S, wordS)}` (lands on
  the word) or `enterFrom(S, startS)` slides it up 24 px with a fade and blur-in over 12 frames. `exit={exitU(S, s)}`
  takes it out, and `diffuse` (0..1) bleeds it away like ink. Never set a font size.
- `SourceLine {text, x, y, k, rung?, appear?, exit?, anchor?, color?}`: a chart's source, Source Serif 4 Italic,
  `INK_LO`, anchored at the start, as written.
- `Kicker {text, x, y, k, width, rung?, appear?, anchor?}`: a chart title. It is a `"word"` label between a bold rule
  above and a hair rule below, both `width` world px wide. With `appear`, the rules draw in from the left as the label
  enters.
- `Rule {from, to, k, kind?: "hair" | "bold" | "double", rung?, draw?, color?}`: a newspaper rule with butt ends.
  `"double"` is a bold rule with a hair rule `RULE_GAP` below it. `draw` (0..1) writes it in from `from`.

## Lines, bars, units

- `WetLine {id, points, len?, k, ageAt?, ink?, rung?, width?, bead?, wetLen?, shadow?}`: a line written in wet ink
  over `[0, len]` world px of arc length. It is red by default (RED_LINE with the paper shadow), and `ink` makes it
  an ink line (LINE). `ageAt(s)` is the number of frames since arc length s was drawn; the wet stretch dries over
  `WET_DRY_F`. `bead` (0..1) shows the bead at the tip.
- `Bead {id, x, y, k, r?, color?, opacity?, bloom?}`: the tip bead (bloom, dot, paper specular).
- `InkPath {points, k, draw?, rung?, width?, color?, close?}`: a plain ink stroke. Use `width={HAIR}` for an axis.
- `DashedPath {points, k, S?, draw?, rung?, width?, color?, march?, dashMod?}`: dashed ink. The dashes march toward
  the head on `S` unless `march={false}`. `dashMod(i, sMid, total)` moves, fades or blurs single dashes.
- `PlanMark {from, to, k, S?, rung?, draw?, solid?, march?, color?}`: the dashed plan line. `solid` (0..1) writes a
  solid LINE over it from `from` when the plan becomes fact.
- `RedBar {id, from, to, width, k, len?, seam?, slot?, head?, radius?, color?, wet?, shadow?, opacity?}`: a thick red
  bar, `width` world px, drawn up to `len`. On its own it is a pill with a round head. With `slot`, it is the fill of
  a `Slot` (container corners, flat front). `seam` is the world-px pitch of the unit seams, and `wet` (0..1) wets the
  head while it draws.
- `Slot {from, to, width, k, rung?, radius?, dashed?, wash?, color?}`: the ink outline that a `RedBar slot` fills. Draw
  it AFTER the bar. `radius={width / 2}` makes a pill slot, `dashed` a planned slot, and `wash` (≤ 0.10) tints the
  inside.
- `barCross(from, to, width, at, over = 18)` returns the ends of a mark crossing a bar at `at`.
- `Unit {x, y, k, size?, color?, rotate?, opacity?, hollow?}`: one red seal-square unit. `hollow` is an empty place
  drawn as an ink outline. Wrap red units in ONE `RedGroup`.
- `Seal {x, y, k, grow?, size?, color?, opacity?}`: a red data-point marker that grows in place.
- `HatchFill {id, region, k, color?, opacity?, pitch?, angleDeg?, width?, anchor?, fill?, lineOpacity?}`: a hatch
  clipped to a closed region. `pitch` and `width` are screen px. Pass the house values explicitly: `fill={0.1}` and
  `lineOpacity={0.35}` (the defaults are 0 and 1).
- `RedGroup {k}`: a `<g>` that gives its red children the warm paper shadow. Use one per group, never one per element.

## Pictograms and icons

- `Pictogram {d, x, y, size, color?, rung?, rotate?}` with `d={PICTOS.factory}`: a solid Phosphor silhouette (256 box)
  centred on (x, y), `size` world px. It takes no `k`. For red, use `color={RED} rung={1}` inside a `RedGroup`; for an
  ink tint, use `rung={INK_LO}`. `PICTOS`: `barn, bread, buildings, cpu, factory, gasPump, grains, hammer, hardHat,
  houseLine, lightning, plant, rocketLaunch, rocket, tractor, trainSimple, train, truck, wrench`.
- `Icon {d, x, y, size, k, rung?, color?, rotate?, draw?}` with `ICONS` (Lucide outlines at LINE). The style uses solid
  pictograms. Use `Icon` only when the director asks for an outline.

## Re-exported helpers

`InkDiffuse {u, k, cx, cy}` and `inkDiffuse(u)` make a thing that stops existing blur, spread and fade.
`FeatherWipe {id, box: {x0, y0, x1, y1}, u, feather, dir?}` is ink soaking in. Also re-exported: `paperShadow(k)`,
`worldBlur(px, k)`, `enterU`, `enterFrom`, `exitU`,
`rungAt(S, startS, from, to)`, `ENTER_F`, `ENTER_LEAD`, `EXIT_F`, `RISE_PX`, `RUNG_F`, `lerp`, `clamp01`, `smoothstep`,
`easeOutCubic`, `easeInCubic`, `easeInOutCubic`, `shootEase`, `hash01`, `mixHex`, `cumLen`, `pointAtLen`, `subPathD`,
`polyD`. Types: `Cam`, `Pt`, `Anchor`, `VLabelSize`, `Glide`, `DashMod`, `StageView`, `FollowerState`, `VCamKey`,
`PhotoBox`, `PhotoTone`, `RuleKind`, `PictoName`.

## Minimal cut

```tsx
import React from "react";
import { useCurrentFrame } from "remotion";
import { INK_LO, Kicker, Label, PICTOS, Pictogram, RED, RedBar, RedGroup, Slot, VStage, VintagePhoto, enterFrom, enterU, runVCamera } from "./chinatalkVintage";

const camAt = runVCamera([{ f: -24, x: 540, y: 990, k: 1 }, { f: 60, x: 540, y: 960, k: 1.12 }, { f: 116, x: 544, y: 956, k: 1.15, ease: "linear" }], 116);
const A = { x: 160, y: 1420 }, B = { x: 920, y: 1420 };

export const Cut: React.FC = () => {
  const S = useCurrentFrame();
  const cam = camAt(S), k = cam.k;
  return (
    <VStage S={S} cam={cam} photos={<VintagePhoto src="brezhnev/brezhnev_1972.jpg" box={{ x: 230, y: 300, w: 620, h: 560 }} focus={{ x: 0.5, y: 0.2 }} cutline="Leonid Brezhnev, 1972" />}>
      <Kicker text="Industrial output" x={160} y={200} k={k} width={760} appear={enterFrom(S, 0)} />
      <RedBar id="bar" from={A} to={B} width={120} k={k} slot seam={76} len={Math.min(760, 40 + S * 9)} wet={S < 80 ? 1 : 0} />
      <Slot from={A} to={B} width={120} k={k} />
      <Label text="Plan" x={540} y={1560} k={k} size="head" appear={enterU(S, 48)} />
      <RedGroup k={k}><Pictogram d={PICTOS.factory} x={300} y={1720} size={200} color={RED} rung={1} /></RedGroup>
      <Pictogram d={PICTOS.tractor} x={780} y={1720} size={200} rung={INK_LO} />
    </VStage>
  );
};
```

## Traps

- `width` on `WetLine`, `InkPath`, `DashedPath` and `HatchFill` is screen px at k = 1 (a kit weight). On `RedBar` and
  `Slot`, `width`, `seam`, `len` and `radius` are world px, like every position.
- Photos go in `photos=`, never in an SVG `<image>`, which drops frames. Nothing in the SVG layer can sit under a
  photo.
- Every `id` (`WetLine`, `Bead`, `RedBar`, `HatchFill`, `FeatherWipe`) must be unique in the frame.
- `rung` on an `Icon`, `Pictogram` or ink `WetLine` is a group opacity, so don't wrap it in another opacity.
- Never draw paper texture, grain, specks, a fold, a vignette or a tint, and never draw a paper-coloured rect to
  erase something. A knock-out uses `fill={V_PAPER}` and matches, because the fibre is laid over everything.
- The page has one faint fold crease at world y 1165, which repeats every 4200 world px. Never land a face or a
  label's baseline exactly on it.
- Labels are floors (40 / 64 / 60 px on screen) and grow with zoom above k = 1. Check fit with `labelWidth`. There is
  no odometer: a number that changes becomes a new `Label`.
- Nothing readable goes in either caption band (CRAFT.md: y 1080–1250 and y 1360–1460): `toWorld(cam, 540, CAPTION_Y0).y`
  is the first band's world y. Check both on every camera state.
- Judge the halftone dots on a full-res still. A half-res preview halves their pitch.
- Do not add edge roughness (SVG turbulence). It more than doubles render time and makes edges wobble. Vector edges
  stay clean.
- Cost: about 95 ms per frame at full res for a cut with a news clipping.
