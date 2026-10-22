# Dwarkesh 3D style

Follow CRAFT.md. The look of the Kyle Harper clips the user approved on Oct 22, 2026 ("definitely in the right
direction ... I'm happy with it"): a one-point-perspective 3D stage set INSIDE one misty teal air, inhabited by a
picture-book gouache cast, with house orange as the one glowing accent. Every object sits in the same medium, so the
whole clip reads as one consistent world. It grew out of the map style's London depth pass and the Will ocean cuts'
underwater feel, carried onto land. Not the umber paper page, not engraved cream-on-dark-casing figures, not realism.

Use it for history and explainer clips the user asks to have "in the Dwarkesh 3D style" (or "like the pandemics /
Rome clips"). Real maps stay in `styles/dwarkesh-map.md`; a 3D cut may still fly over a baked map laid as a ground
(`kyle-pandemics/RodentFromCentralAsia.tsx`).

## Look

The medium is palette A of `generated/components/kyle-pandemics/pandemicAir.tsx` (`AIR.A`; the Will water ramp
carried to air). Read its header and the pandemics notes `AIR_READY.md` before building.

| Token | Hex | Use |
|---|---|---|
| air ramp, high → low | `#A9C7B4` `#86AB9B` `#5F877D` `#466C66` `#375957` `#30494A` `#313E3A` `#363731` `#3D342B` `#3F3226` | the medium by height and distance: sage-teal near the light, petrol in the middle, espresso low and deep. Never black. |
| cream / creamLo | `#F3EBDD` / `#D9CDB4` | rims, shafts, motes, carvings |
| shadow | `#22180F` | contact and cast shadows (soft, fading with fog) |
| line | `#2B241D` | the darkest outline allowed; prefer a darker version of the object's own colour |
| ground | `#857659` / `#6B5E49` / `#3A3128` | warm sand-umber floors (the "seabed") |
| stone | `#938270` / `#5F5447` / `#2F2721` | warm grey-umber |
| `ACCENT` / `ACCENT_DEEP` | `#FFB000` / `#D98A0C` | orange: the clip rule's one subject, the only warm glowing material (bloom 0.2–0.25) |
| `DEAD` | `#8A7B62` | a fallen figure, a drained one |

- **Local colour survives near; the air takes it only with distance.** Near figures keep warm skin, crisp dot eyes
  and their clothes' colour; only the back rows and the far set sink into the air (the director's most frequent fix).
- Materials in muted earthy local colours: plaster oatmeal, brick and stucco muted red-brown, timber umber, iron
  slate, marble cream, terracotta red-brown. Nothing near the orange hue except the accent (an ochre tunic near the
  lens read as the accent: mute ochre to khaki `#9A9070`).
- No type in the picture unless the brief needs it; labels sit on soft plates (`TuberculosisToll.tsx`).

## The medium (every cut)

- The cut renders inside `<AirStage v={makeAirView(...)}>` instead of a page: the graded air by screen row, soft
  diagonal SHAFTS from the upper left (swaying, parallax with the camera), MOTES at three depths, the soft-light
  film grade (cream highs, espresso lows), grain on twos, a brown vignette, a faint bloom on orange.
- Moods (`scene.mood`): `day` (open ground, streets, building sites), `interior` (denser, darker: halls, rooms),
  `night` (dim, one lamp's cone), `micro` (particles in a fluid).
- Ground opaque, one continuous tone by distance (`fogHex` per row), joints few, thin and in a darker local tone,
  fading early; the horizon a soft haze zone (`AirHorizonHaze`), never a ridge or line.
- Fog every object by ITS distance toward `v.airAt(d, h)` (the air at that distance and height, not the horizon
  colour). Crane and pull-back cuts fog by depth behind the subject's front line, or a high wide buries the payoff.
- Lower frame: a big flat face in the bottom third reads as dead space. Let it sink into the dense low air (the
  height ramp) or continue the floor to the bottom edge with a little soft foreground.
- Motes are part of the medium, but no mote may ride a hero's head for more than a few frames (offset the mote view
  if one does: `ExtractNotCreate.tsx` `MOTE_OFFSET`).

## Objects and architecture

- Soft form light from the upper left (lit top, mid, a soft core shadow, a little reflected air), a CREAM RIM on the
  top / upper-left edges, thin outlines in a darker local colour. No black casing, no engraved hatching (at most a
  faint texture in shade).
- Volumes in one-point perspective on the depth kit `generated/components/kyle-london/londonDepth.tsx`
  (`perspective`, `placeAtRef`, ground, `Box`, `Cylinder`), drawn air-lit: the `AirBox` / `AirCyl` / `AirFloor` /
  `AirShadow` helpers in `generated/components/kits/dwarkesh-3d/` (see Build pattern).
- Simple, readable sets: one machine, one street, one stage. The user rejected busy compositions ("everyone is on top
  of each other") and praised one clear mechanism.
- The accent may be a dashed orange outline for something that never existed (the engine Rome never built, the
  wealth that could have been), drawn by a moving tip, glowing faintly through the air.

## People and animals: the picture-book gouache cast

The user: "more artsy and more like cute", "drawn", "spend some more love on" the characters. Two Miis and a
"grotesque 3D character" were rejected on the way here.
- Shapes: a small rounded head on a bean/pear body, ~4.3–4.5 heads tall, ears, tapered limbs (never capsules of
  constant width), mitten hands (a thumb notch at most), small feet. Sleeves flare out of the body's one silhouette
  (never separate shoulder pads). Clothes as simple flat shapes that say who is who.
- Faces: dot eyes (a glance option), a small nose, a blush dot, brows as two short strokes when acting, a mouth only
  when it acts (a small dark oval).
- Surface: flat matte fills, ONE soft crescent shadow per part from the upper left (strength ~0.4), the gouache
  texture filter (grain, dry-brush mottling, hand-wobbly edges), no outline, no hatching.
- Palette: cream, oatmeal, ochre-grey/khaki, umber, slate, dusty teal, muted red-brown; skin a warm light tone.
  People are never in the accent unless the clip's rule makes the accent a kind of person (pandemics: TB's toll).
- Casts built so far (read-only for new clips; import, never edit):
  - `kyle-pandemics/pandemicFolk.tsx`: the c.1900 Worker (a 2.5D rig that turns without flips; stand, slack,
    turn, reach, see-through), crowds baked to sprites (c.1900 and medieval; inks), `sway`, `fall`.
  - `kyle-pandemics/pandemicFolkAnimals.tsx` (ant), `rodentFolkMarmot.tsx`, `anotherPandemicFolkGoose.tsx`.
  - `kyle-rome-slavery/romeFolk.tsx`: Roman Slave / Freeman / Dominus / Overseer on the texcoco rig with every
    working pose (walk push tread carry grind strike potter recline haul stoop raiseRod), grips, anchors and props;
    `fog`, `drain`, `chalk`, `titulus`, `RomeContactShadow`. Its header is the API.
  - The paint: `kyle-pandemics/pandemicFolkPaint.tsx` (`FolkPaint`, `FolkCanvas`, sprites, the texture filter).
    A new cast imports this filter so every clip is painted by the same hand.
- A new period gets its own cast file built on the same paint and the same proportions (a cast builder, style sheet
  first: the new figures next to the pandemics Worker in one row, checked for the same hand before any cut uses it).
- Every figure: fog by its own distance, a soft contact shadow in the air's shadow colour.

## Camera and motion

- One continuous camera per cut on the depth kit's perspective (dolly + lens zoom, parallax), eased, one smooth lobe
  per move. No zig-zag weave (the user: "better if it just is a smooth pan").
- Put the camera on the words: hold on the subject, pan at the same zoom on the turn of the sentence, pull back to
  reveal on the summing-up line.
- Figures act with weight: walks with planted feet, fists on bars, seats under sitters, chains following feet.

## Finish (the user judges frame by frame)

The glitch audit before any preview goes to the director (as `REVISION_1.md` in the Rome clip's notes): every-frame
sheets of every figure that moves; a pop detector on head, hands, feet, hem corners and tools; painter's order (nothing
behind a wall or house drawn in front of it on any frame, tips and coins included); contact; a camera plot. Faces and
hands out of the caption bands (y 1080–1250 and 1360–1460 at 1080x1920).

## Build pattern

1. `bun run cut <Name> --clip <slug> --style 3d --fps <sequence rate> --frames N`: starts from
   `scripts/templates/3d.tsx` (AirStage + makeAirView on a londonDepth perspective, a floor, one air-lit box and one
   folk figure with a contact shadow, all as markers to replace).
2. The kit: `generated/components/kits/dwarkesh-3d/dwarkesh3d.tsx`, one import (read-only; additions through the
   director). Its header is the API. It re-exports the medium flat (all of `pandemicAir`), the depth kit's
   `perspective` / `placeAtRef` / `depthTint` (the whole module as `Depth`), the camera (`WorldSvg`, `makeCamera`,
   `swayCam`, `pchip`), and the casts as namespaces: `RomeFolk` (romeFolk), `PandemicFolk` (pandemicFolk), `Paint`
   (pandemicFolkPaint). Its own: `airWorldOf({cam, rest, depth, frame, scene?, fogBy?})` -> `A` (the AirView `A.v`
   for `<AirStage>`, the Persp `A.P`, `A.tone` / `A.toneO` / `A.fog` / `A.airHex` / `A.screenAir`, the people's
   `A.figFog` / `A.folkFog(Z)` (a RomeFolk `fog`) / `A.workerInks(Z)`, `A.lw()`); `fogBy` "eye" (default: by
   the eye's distance) or "depth" (by world depth, for crane-ups and pull-backs); the air-lit `AirFloor`,
   `AirHorizonHazeW`, `AirBox`, `AirCyl` (both with `orange`), `AirShadow`; `MAT`, `lineOf`, `ACCENT`, `DEAD`,
   `workerScale`.
3. A clip with several cuts in one place: a shared world file in the clip folder (`marketWorkshopWorld.tsx` +
   `marketWorkshopAir.tsx` is the pattern; cut 33 opens on cut 20's last frame exactly).
4. Renders: `--concurrency=4`; three.js cuts `--gl=angle`. Finals `--muted`, ProRes 4444 as CRAFT.md.

## Reference cuts

- `kyle-rome-slavery/SlavesTurnTheCrane.tsx` (one machine, crane-up through the height ramp)
- `kyle-rome-slavery/FreeStreetNoEngine.tsx` (a street dolly, the dashed accent far in the haze)
- `kyle-rome-slavery/WeKeepThemApart.tsx` + `SlavesInTheWorkshop.tsx` (a split stage, a chasm of dense air)
- `kyle-pandemics/WeirdWaysToExploit.tsx` (night lane, lamp cone, the Worker's turn and reach)
- `kyle-pandemics/TuberculosisToll.tsx` (a folk crowd in depth, crowd fog by depth band)
- Overviews: `.../Kyle_Slavery_didnt_stop_Rome_from_industrializing/animation_source/review/V3_all_six.jpg` and
  `.../Kyle_The_pandemics_to_worry_about_are_the_weird_ones/animation_source/review/V3_all_seven.jpg`
  (in `/Users/tom/Documents/tom fant/dwarkesh podcast/oct/`).

## Not perfect yet (the user, Oct 22: "right direction, not perfect yet")

Open for the next clip in this style, not fixed in the reference cuts:
- Hero-size faces: a three-quarter head shows cropped hair as a large dark area; a full beard at landing size is a
  solid dark shape; the stoop brows read as a frown.
- Small far figures and props can read as pale pills; give them a clearer silhouette or leave them out.
- Interior mood still reads fairly light teal; a darker interior is a knob (`eyeT`), not yet tuned by the user.
- The folk cast's default fetter chain snaps taut in a walk (pass a longer `chainLen`).
