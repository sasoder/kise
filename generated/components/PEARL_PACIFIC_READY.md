# PEARL KIT — PACIFIC READY (gate 2: the PACIFIC world for cut F)

Everything in `PEARL_KIT_READY.md` (camera, MapPage, Hatch, Label, StrikeArc, Target, Dots...) applies; read it first.
Use `world="pacific"` and import geography from `./pearlPacificMapData`.

## The world
- North-up Mercator rotated to 160 E (the cut meridian is 20 W, far away): Hawaii at 158 W lies to the RIGHT of Wake.
  World px == screen px at k 1 = 120 deg of longitude (90 E .. 150 W) across 1080 px; (150 E, 20 N) = world (540, 960).
  `project(lon, lat)` (any longitude convention: −157.97 and 202.03 are the same point), `unproject(x, y)`.
- Natural Earth 10m, same palette and engraving as Asia; graticule every 10 deg; borders of Dec 1941 (dashed cream):
  the Asian ones + Borneo (British / Dutch), Dutch New Guinea / Australian New Guinea, Portuguese Timor. The
  Philippines (US), Guam (US) and Wake (US) have no land borders: label / ring them as points.

## Regions `{ d, edge, box }` (land-clipped; `<Hatch region cam id/>`)
- `JAPAN_1941` everything Japan held on 7 Dec 1941: the 1931 empire (home islands incl. Kurils, Ryukyu, Bonins;
  Korea; Taiwan; Karafuto; Kwantung), Manchukuo, occupied China (1938-39 front + Canton + Hainan; no Yichang salient),
  French Indochina (Japanese troops throughout since July 1941), the South Seas Mandate islands' land.
- Parts, for staged reveals: `EMPIRE_1931`, `MANCHUKUO`, `OCCUPIED_CHINA`, `INDOCHINA`, `MANDATE` (tiny islands: also
  draw the dots below).
- `MANDATE_POINTS` (Japanese, world px): palau 400,1078 · yap 433,1058 · ulithi 447,1053 · woleai 485,1077 · truk
  556,1077 · ponape 614,1081 · kusaie 657,1096 · saipan 502,1006 · tinian 501,1007 · rota 497,1015 · pagan 502,978 ·
  eniwetok 651,1040 · kwajalein 700,1065 · roi 697,1059 · wotje 722,1058 · maloelap 730,1065 · majuro 732,1080 ·
  jaluit 717,1090 · mili 736,1089. Draw with the new kit component
  `<IslandDots pts={Object.values(MANDATE_POINTS)} cam r?=2.4 rMin?=2.6 rMax?=13 tone? ops?/>`: an orange disc + ring
  at map scale (r world px) held between rMin..rMax SCREEN px (never vanishes at the wide, never swamps the island).

## Strikes of 7/8 December 1941 (world px; `_LL` twins in lon, lat)
`TARGETS`: pearlHarbor 1008.3,947.0 · kotaBharu 110.2,1088.5 · singora 95.4,1078.8 · pattani 101.3,1081.8 · singapore
124.7,1132.2 · clarkField 275.0,1005.5 · wake 689.9,966.9 · guam 493.1,1021.7 · shanghai (International Settlement)
283.4,847.6.
`ORIGINS`: kidoButai (carrier force, 26 N 158 W, ~230 nmi N of Oahu) 1008.0,901.3 · samah (Hainan, the Malaya convoy)
175.5,977.1 · saigon (bombers → Singapore) 150.3,1046.0 · takao (Formosa → Clark) 272.7,934.9 · roi (Kwajalein → Wake)
697.5,1058.8 · saipan (→ Guam) 501.8,1005.3 · huangpu (Japanese forces already in Shanghai, on the river) 283.5,847.4.
`STRIKES`: `{ id, from, to, via? }` for the nine. `CONVOY_VIA_LL`: the convoy's sea track Samah → past the Indochina
coast → round Cape Ca Mau → into the Gulf of Siam (approximate); append the landing point.
Paths (as the demo): convoy `viaPath([...CONVOY_VIA_LL, TARGETS_LL[to]].map(([lo, la]) => project(lo, la)))`; the
rest `greatCirclePath(project, ORIGINS_LL[from], TARGETS_LL[to], bow)` (bow ~0.12; the demo uses −0.1 for Pearl
Harbor so it bows west). Draw `<StrikeArc pts t={lin(frame, f0, f1)} cam/>` then `<Target x y cam arrive from=
{pts[pts.length - 4]}/>` with arrive starting the frame t reaches 1 (cause before effect).
Shanghai is a ~3 km arc: at the Pacific wide it is a point (the Target alone reads); it needs k ~150+ to see the arc.

## Framings and the deep zoom
`FRAMINGS`: PACIFIC_WIDE {553.5, 916.5, k 1.1} (Malaya to Hawaii; a portrait frame at k 1.1 sees ~50 S .. 72 N, all
baked) · OAHU_CLOSE {1008.3, 945.7, k 114.3} (Oahu ~60% of the frame width, 10m coast; Pearl Harbor marked by the
Target glyph, no lochs drawn) · MALAYA {135, 1056.7, k 8.1} · FORMOSA_LUZON {279, 973.1, k 8.1}. `OAHU_BOX`
[1005.5, 943.5, 1011.2, 947.9].
LOD: p0 base · p1 k>0.8, p2 k>1.5 over 78 E–138 W × 50 S–74 N · p3 k>2.7 over 80–220 E × 35 S–66 N · p4 k 5–9.5 over
86–214 E × 16 S–54 N · p5 k 9.5–18 round Oahu AND over Malaya / Gulf of Siam (97–113 E, 2 S–20 N), Formosa–Luzon
(113–126 E, 11–26 N), Shanghai (119–123 E, 29–33 N), Saipan–Guam (142–148 E, 11.5–17 N), Kwajalein–Wake (163–170 E,
7–21 N) · p6..p9 (s 32 / 60 / 112 / 170) only round Oahu, up to k ~170. The deep boxes hold any view at their zoom with
the camera centre from ~1.4 views EAST to ~2.6 views WEST of Oahu and ±1.3 views N/S: so in the pull-back keep the
camera near Oahu while k > ~15 and drift west as it widens (the demo's keys: k 114 at Oahu → k 16 at Oahu −2 px → k 3.2
at Oahu −150 px → the wide). Check with `mapLevelsAt("pacific", cam)`.
Motion test `PearlPacificPullback` (96 f, Oahu k 114 → the wide, every strike landing): frame-difference curve smooth
(1.1–8.5, no spikes: no LOD pops). runCamera pre-rolls by extrapolating the first keys: for a still opening, repeat the
first key ~20 frames earlier (e.g. `{ f: -20, ...OAHU }`).

## Facts and caveats
- Hong Kong was also attacked on 8 Dec (from the mainland); the brief's list does not include it: `PLACES.hongKong`
  exists if wanted. Midway (`PLACES.midway`) was shelled on 7 Dec too. Bangkok / Thailand: not in the list.
- The convoy track, the Huangpu origin point and the Yichang omission are approximate. Mandate island set is
  representative (19 named atolls), not exhaustive; the MANDATE region has all their Natural Earth land.
- Oahu at k 114 is the Natural Earth 10m polygon: recognisable but faceted at that size (vertices ~0.5-1 km apart).

## Files and demo stills (looked at)
`scripts/build-pearl-maps.mjs pacific`, `scripts/bake-pearl-rasters.mjs pacific` (416 tiles, 18 MB,
`public/pearl/pacific-*.png`), `generated/components/pearlPacificMapData.ts`, `pearlLevelsPacific.ts`.
Compositions in `src/entry.PearlKitDemo.ts`: `PearlPacificDemo` (8 states), `PearlPacificPullback` (96 f motion test).
Stills: `/private/tmp/claude-501/-Users-tom-Documents-tom-fant-CAPTIONSTOOL-kise/a8032af7-a3a7-444c-95e5-98b113e3d218/scratchpad/gfx/build/PearlKit/stills/pacific/element-0.jpeg` … `element-7.jpeg`:
P0 the wide, JAPAN_1941 + mandate dots, strikes in flight · P1 all landed + targets · P2 Oahu close k 114 · P3 k 14 on
the pull-back · P4 Malaya k 8.1: convoy, Saigon → Singapore, Indochina hatched · P5 Formosa → Clark · P6 Saipan → Guam
k 14 · P7 Roi → Wake k 5. Sheets: `.../build/PearlKit/sheet_p1.jpg`, `sheet_p2.jpg`, `sheet_p3.jpg`; motion test:
`.../build/PearlKit/pullback.mp4`, strip `pullback_strip.jpg`.
