# PEARL KIT — READY (gate 1: ASIA world + vocabulary). PACIFIC world: now READY too (see PEARL_PACIFIC_READY.md)

Gate 1 of 2. The ASIA world (cuts B, C, D, E) and the whole vocabulary are done and render. The PACIFIC
world (cut F) is documented in `generated/components/PEARL_PACIFIC_READY.md`. Cuts B-E never import
`pearlPacificMapData.ts`.
UPDATE after gate 1 (no API change): the ASIA raster boxes were enlarged so no camera inside a level's band meets a
seam (a1/a2 now cover the whole base box, a3/a4/a5 boxes below); the tiles and `pearlLevelsAsia.ts` were re-baked.
Re-render anything rendered before 13:57.

Shared read-only. Import from `./pearlShared` (paper, camera, vocabulary) and `./pearlAsiaMapData` (geography).
Do not edit either; additions only, by the kit.

## Files
- `scripts/pearl-geo.mjs` — shared geometry (projections, Natural Earth 10m rings, region lines, borders).
- `scripts/build-pearl-maps.mjs [asia|pacific]` → `generated/components/pearlAsiaMapData.ts` (+ pacific later).
- `scripts/bake-pearl-rasters.mjs [asia|pacific]` → `public/pearl/asia-<level>-<col>-<row>.png` (tiled LOD
  pyramid, 127 tiles, 15 MB), `public/pearl/mottle.png`, `grain.png`, `generated/components/pearlLevels*.ts`.
- `generated/components/pearlShared.tsx` — the kit.
- `generated/components/PearlKitDemo.tsx` + `src/Root.PearlKitDemo.tsx` + `src/entry.PearlKitDemo.ts` — review sheet.

## Conventions
- FPS 24, 1080x1920. Camera `{ x, y, k }`: the WORLD point (x, y) sits on the frame centre (540, 960) at zoom k.
  Author keys `CamKey[] = [{ f, x, y, k }, ...]` at module level and call `runCamera(KEYS, frame)` (monotone cubic,
  k in log space, damped follow trailing ~5 f, pre-rolled so f0 is already moving). Screen px → world: `px(cam, v)`.
- ASIA world px: north-up Lambert conformal conic, parallels 25/45, centre meridian 112 E. k 1 = "all of China"
  scale (65 deg of longitude across 1080 px). (112 E, 30 N) = world (540, 960). `project(lon, lat)` in
  `pearlAsiaMapData.ts` (identical to the baked map; checked against d3 to 1e-12 px).
- Colour: ORANGE = JAPAN only (hatch, its places' labels, strikes); dashed orange = planned; cream = everyone else.

## pearlShared.tsx — API
Palette `SEA LAND LAND_RIM INK DARK SHADOW ACCENT ACCENT_DEEP INK_HI INK_LO`; fonts `fellSC`, `fell`; maths `clamp01
smoothstep smoother ramp(f,a,b) lin(f,a,b) mixColor pchip hash`.
- **Page**: `<MapPage world="asia" cam={cam} vignette? grain? mottle?>{overlays}</MapPage>` = SEA ground + static map
  (LOD tiles for this k + world-space mottle in octaves) + your children + screen grain + vignette. `<MapBase world cam/>`,
  `<Grain/>`, `<Vignette/>` separately if you need to layer differently. `mapLevelsAt(world, cam)` reports which LOD
  levels draw and their magnification (check: `magnify` should stay <= ~1.1).
- **World layers**: `<WorldSvg cam defs?>` children in world px; `<WorldDiv cam>` for Img/HTML in world px.
  `toScreen(cam,x,y)`, `viewRect(cam, margin)`.
- **Polylines**: `cumOf lengthOf pointAt(pts, s) -> {x,y,tx,ty} slicePts(pts, s0, s1) dOf(pts, close)`.
- **Ink**: `roughen inkPath <InkStroke d cam width tone dash/>` (tone 0 cream → 1 orange; width in screen px).
- **Hatch** ("Japan holds this"): `<Hatch region={MANCHUKUO} cam id="mk" reveal? front? ghost? opacity?/>`
  orange wash 0.2 + octave-stable world-anchored 45° hatch (~10-20 px on screen, never swims) + the region's dashed
  orange `edge` (inland boundary only, never along the coast). `reveal={{ from: [x,y], progress }}` grows it radially
  from a point (e.g. the Kwantung tip, Korea); `reveal={{ from, dir: [dx,dy], progress }}` sweeps a straight front
  along dir; progress 1 reaches the region's far corner; a thin orange leading edge is drawn (front={false} hides it).
  `ghost` = PLANNED: sparse faint hatch + the WHOLE outline dashed (coast too). `HatchPattern` exported. `id` unique.
- **Plan outline**: `<PlanOutline pts={CHINA_OUTLINE_PTS} cam drawn={0..1}/>` dashed orange drawn by a pen nib;
  dashes anchored to the start (no crawl). CHINA_OUTLINE_PTS starts at the Yalu mouth (next to Japan's Korea) and runs
  down the coast first. `HAINAN_OUTLINE_PTS` separately.
- **Label**: `<Label x y text appear frame cam cap?=38 color? anchor? dx? dy? sc?=true italic? spacing? out?=[f0,f1]/>`
  IM Fell English SC, spaced caps (0.16 em), slides up 24 px while fading in over 14 f from `appear` (start ~8 f before
  the word). Counter-scaled: `cap` = cap height in screen px at any zoom (checked against a 38 px bar). `sc={false}`
  = IM Fell roman for towns. `<CityDot x y cam r? color?/>` (6.5 px, dark ring). `labelIn(frame, appear)` → {dy, op}.
- **Route**: `<Route route={BURMA_RAIL} kind="rail"|"road" cam drawn?={world px of arclength} cut? tone? dashK?/>`
  rail = the reference's chequered symbol; road = cased cream line with a dark dashed centre. `cut={{ s, open, dim }}`:
  the line breaks at arclength s with two clean ends (gap opens with `open` 0..1), the remainder beyond drops to 0.35
  with `dim` 0..1. In a zooming shot pass a constant `dashK` (e.g. the cut's middle k) so the chequers do not crawl.
- **Packets**: `packetsAt({ len, frame, f0, speed, gap, cut?: { s, frame, gap }, decel?, qGap? })` → `[{id, s, op,
  beyond}]` constant speed (world px/frame), even spacing, emitted from the route start every gap/speed frames since f0
  (negative f0 = already flowing on frame 0), fade in/out over the first/last ~14 world px. With `cut`: packets beyond
  the break brake to a stop where they are (decel frames, C1) and stay; packets before it queue up behind the break.
  Draw: `<Packets route packets cam size?=21 dimBeyond? tone?/>` — small cased cream wagons wider than the line.
- **Strikes**: `arcPath(a, b, bow?)` (bowed, left of travel; negative bow = right), `greatCirclePath(project, aLL,
  bLL, bow?)`, `viaPath(waypoints)`; `<StrikeArc pts t cam width? head?/>` drawn by a travelling arrowhead (t LINEAR
  0..1 = constant speed; use `lin(frame, f0, f1)`), the tail a fine orange line; the head is gone at t 1.
  `<Target x y cam arrive from? size?=30 grow?=0.2/>`: nothing until arrive > 0; then the burst rays shoot out of the
  impact point and the thin orange ring draws round from the side the strike came from (`from` = a point on the arc
  just before the end). Ring radius = size·k^grow screen px.
- **Dot fields (D)**: `dotsInRings(poly, spacing, seed, max?, cacheKey?)` even blue-noise (Bridson) inside a polygon
  (`CHINA_POLY`, `FREE_CHINA_POLY`, `MANCHUKUO_POLY`, `OCCUPIED_POLY`, or any ring); `dotsInDisc(cx, cy, r, spacing,
  seed, within?)` (a crowd round a seat, clipped to China); `bandRing(line, side, gap, depth)` (a band polygon beside
  e.g. FRONT_1938_PTS; side -1 = right of travel = WEST of the N→S front, i.e. the Chinese side); `matchDots(from, to,
  axis?)` (non-crossing pairing); `lerpDots(from, to, u, stagger, seed)` (per-dot eased, staggered);
  `relaxDots(pts, minSep, iters)` (min spacing); `dotScreen(k)` = 9.5·k^0.35 px (house law; spacing ~1.45 diameters);
  `<Dots pts cam d? tone? ops?/>`. `inRings`, `ringsBox`, `poissonDots` exported.
- **Resource glyphs (B)**: `<CoalHeap|IronPig|SoySack x y cam id h?=54 reveal? tone?/>` engraved cream objects (dark
  body, cream outline, hatch on the shaded side, a ground line). (x, y) = the ground point under the middle; h = height
  in screen px; `reveal` 0..1 raises them out of the ground line; `tone` 1 = orange (seized). Fushun, Mukden and
  Anshan are ~8-18 world px apart: at k ~5 offset the glyphs from the town dots (demo frame 2), or go closer
  (SOUTH_MANCHURIA k 9.7).

## pearlAsiaMapData.ts — geography (world px; all regions land-clipped, Natural Earth 10m)
Regions are `{ d, edge, box }` (fill path, inland-edge path, bbox):
- `JAPAN_1931` home islands incl. Ryukyu and the Kurils, Korea (ONE country), Taiwan, Karafuto (Sakhalin S of 50 N),
  Kwantung. `KWANTUNG` (lease line 39.45 N, as the approved SouthManchuriaRailway).
- `MANCHUKUO` 1933 incl. Jehol, minus Kwantung: China NE of the Great Wall / Jehol line (brief's vertices), then the
  real Mongolia–China border (it follows Natural Earth from the brief's meeting point westward round the Mongolian
  bulge, so no Chahar sliver), the Argun / Amur / Ussuri, the Yalu / Tumen and the sea.
- `OCCUPIED_1938` east of `FRONT_1938` (+ `CANTON` pocket, Hong Kong and Macau left out, + `HAINAN`).
  `FRONT_1938_PTS` / `_D`: N (Mongolia border at 110 E) → Baotou → Yellow River (Shanxi–Shaanxi) → Fenglingdu → river
  east past Zhengzhou (Chinese) → just W of Kaifeng → flood course → Xinyang → W of Wuhan → Yueyang → W of Nanchang →
  Hangzhou bay. Smoothed (Catmull-Rom) through the vertices; `FRONT_1938_LL` holds them.
- `FREE_CHINA` = China − Manchukuo − Kwantung − occupied. `CHINA_ALL` `{ d, box }` mainland + Hainan (no Taiwan).
- `INDOCHINA_NORTH` Tonkin = Vietnam north of 20.0 N.
- Routes `RouteData { pts, len, stations }` (stations = arclength of each stop): `BURMA_RAIL` Rangoon–Toungoo–Thazi–
  Mandalay–Maymyo–Hsipaw–Lashio (len 152); `BURMA_ROAD` Lashio–Kutkai–Wanting–Longling–Baoshan–Xiaguan–Chuxiong–
  Kunming–Qujing–Guiyang–Chongqing (272); `BURMA_ROUTE` the whole Rangoon→Chongqing line for packets (424; road from
  stations.lashio 152); `YUNNAN_RAILWAY` Haiphong–Hanoi–Yen Bai–Lao Cai–Kaiyuan–Kunming (125; laoCai at 65.4).
- `PLACES` (+ `PLACES_LL`): tokyo 998,778 · osaka 935,816 · seoul 784,785 · mukden 717,706 · fushun 725,703 ·
  anshan 712,721 · dairen 694,768 · portArthur 689,771 · hsinking 740,659 · harbin 752,617 · beijing 610,754 ·
  tianjin 623,769 · shanghai 707,927 · nanjing 659,913 · wuhan 581,947 · chongqing 442,966 · kunming 364,1055 ·
  yanan 498,823 · taiyuan 549,797 · xian 488,869 · chengdu 399,941 · guilin 508,1058 · guangzhou 564,1103 ·
  hongKong 582,1121 · lanzhou 404,829 · hanoi 418,1144 · haiphong 434,1149 · lashio 264,1088 · rangoon 213,1213 ·
  mandalay 229,1103.
- `FACTIONS` (1936-37 approx. seats): nationalists 619,927 · communists 499,823 · shanxi 548,797 · guangxi 483,1074 ·
  sichuan 406,943 · yunnan 364,1056 · ma 382,828. `RESOURCES`: coal (Fushun) 725,703 · iron (Anshan) 712,721 ·
  soybeans (central plain 44.5 N 125.5 E) 741,646.
- `FRAMINGS` suggestions: CHINA_WIDE {398,859,k1.14} · EAST_ASIA {700,847,k1.21} · MANCHURIA_CLOSE {726,610,k3.77} ·
  SOUTH_MANCHURIA {721,722,k9.67} · SOUTHWEST {329,1090,k4.19}.

## Static map (LOD) coverage — keep the camera inside it
a0 base (any view, s 0.7) · a1 k>0.74 and a2 k>1.32 over the whole base box (62–168 E, −8–64 N and beyond) · a3 k
2.3–4 over 74–166 E × −6–64 N · a4 k 4–6.8 over 100–156 E × 19–62 N (China east of Sichuan, Manchuria, Korea, Japan)
and 86–116 E × 6–36 N (the southwest, Burma to Guangxi) · a5 k 6.8–11 over 111–138 E × 32–54 N (North China plain,
Manchuria, Korea) and 94–113 E × 14–32 N (Yunnan, Burma Road east of Lashio, Tonkin). Outside a4/a5 boxes a closer
camera falls back to the level below (soft): check with `mapLevelsAt("asia", cam)` (magnify <= ~1.1) or ask the kit
for another box. Render time: ~0.1-0.2 s per 1080x1920 frame (8 demo states: 2.0 s at concurrency 1 incl. ~1.2 s
startup).

## Facts and caveats (approximate, say so if asked)
- Manchukuo's west boundary (Jehol/Hsingan vs Chahar) is the brief's approximate line. The 1938–39 front, the Canton
  pocket (now an organic shape round Guangzhou and the delta, ~112.8–114.5 E, to ~23.7 N) and the Tonkin line (20 N:
  the Tonkin–Annam boundary ran at about 20 N; the brief said ~19.5) are approximate. Zhengzhou stays Chinese; Kaifeng
  is just inside the occupied side. No Yichang salient (1940) in OCCUPIED_1938.
- Borders 1931–41 (dashed cream ~0.5): USSR–China/Mongolia, Mongolia–China, Korea–China/USSR (no 38th parallel),
  British India one (no India–Pakistan–Bangladesh lines), Nepal, Bhutan, British Burma, French Indochina one (no
  Vietnam/Laos/Cambodia lines), Thailand, British Malaya one (Malaysia+Singapore), Borneo colonial lines, Hong Kong
  and Macau, Karafuto line at 50 N on Sakhalin. No internal Chinese lines (Tibet, Xinjiang, Manchuria all China).
- The Kurils are inside JAPAN_1931 (Japanese since 1875) — the brief listed home islands only; drop if unwanted.

## Demo stills (looked at)
`/private/tmp/claude-501/-Users-tom-Documents-tom-fant-CAPTIONSTOOL-kise/a8032af7-a3a7-444c-95e5-98b113e3d218/scratchpad/gfx/build/PearlKit/stills/asia/element-0.jpeg` … `element-7.jpeg`:
0 all China + Japan 1931 + Manchukuo growing from Kwantung + plan outline · 1 occupied 1938 + faction crowds ·
2 Manchuria k 5 + coal/iron/soy glyphs · 3 southwest k 4.2: rail, road, packets, Tonkin sweep · 4 k 9: Yunnan
railway cut, packets stopped/queued · 5 crowds halfway to a band behind the front · 6 k 6: ghost hatch, strike arc +
target, label ruler, big glyphs · 7 East Asia: CHINA_ALL ghost plan + empire hatched.
Contact sheets: `.../build/PearlKit/sheet_a.jpg`, `sheet_b.jpg`, `phone270.jpg`.
Re-render: `bunx remotion render src/entry.PearlKitDemo.ts PearlKitDemo <dir> --sequence --image-format=jpeg`.
