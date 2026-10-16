# Name tags

Follow CRAFT.md. This file holds the name tag for each style, and the size and position every tag uses.

A name tag is a transparent 1080x1920 overlay: the name over the job, left-aligned, on a panel that hugs the text.
Reuse the current tag for the clip's style with new props. Never rebuild one from scratch.

## Current tag per style

| Style | Component | Props | Look |
|---|---|---|---|
| Core memory | `generated/components/kits/name-tags/NameTagCoreMemory.tsx` | `name`, `job` | Barlow 800/88 name over Barlow 700/42 job, white with a `#000` hard shadow; black bar at 50 % (`rgba(0,0,0,0.5)`), radius 10; each line lands as the core-memory chain stack (`#FFB765`, `#BC37FF`, `#0046FF`, white core) |
| Cheeky Pint | `generated/components/kits/name-tags/NameTagStout.tsx` (draws `StoutNameTag` from `generated/components/kits/cheeky-pint/stoutShared.tsx`) | `name`, `job` (`StoutNameTag` also takes `left`, `bottom`, `frame`) | name on a cream strip (Söhne Dreiviertelfett, `TYPE.TAG` 96), job on a narrower amber strip under it (Söhne Kräftig, `TYPE.TAG_SUB` 36, sentence case), 8 px apart, one lifted shadow for the pair |
| ChinaTalk | `generated/components/kits/name-tags/NameTagNewsprint.tsx` | `name`, `job`, `durationInFrames`; leave `variant` at its default `"slip"` | one slip of newsprint: red rule, name in Source Serif 4 Bold 86, hair rule, job in Source Serif 4 Medium Italic 42, square corners, one frozen grain frame |
| Dwarkesh map (history clips) | `generated/components/kits/name-tags/NameTagMapStyle.tsx` | `name`, `job`, `durationInFrames` | IM Fell English 84 name over IM Fell English SC 40 descriptor, both cream `#E9DDBF`, on a `#2A221A` plate at 0.97, hard corners, a 6 px `#FFB000` rule down the left edge |
| Humble Co. | `generated/components/kits/name-tags/NameTagHumble.tsx` | `name`, `job` | Neulis Cursive Bold 88 over 42, white on a solid `#7970b4` bar, radius 10, padding 34/52/38/52, no shadow |
| Dwarkesh, Sporttouchen, Lovable | none | | see "A style without a tag" |

`generated/components/kits/clients/MaxIntro.tsx` (Lovable) is a freeze-frame guest intro, not a lower third.

Do not use these for new tags. They carry other looks: `generated/components/kits/name-tags/NameTag.tsx`,
`generated/components/kits/name-tags/NameTagCentered.tsx`, `generated/components/kits/name-tags/NameTagCheekyPint.tsx`,
`generated/components/kits/name-tags/NameTagChinaTalk.tsx`, `generated/components/kits/name-tags/NameTagMap.tsx`.

## Size and position (every style)

The components draw at full size at their own spot (left 84 / bottom 300; `NameTagMapStyle` at y 1330–1500). Every
new tag goes out smaller and higher than that:
- about **0.72x** the component's size (the stout tag: name strip ~715 x 90 px, job strip ~43 px tall);
- tag top at about **y 1140**, tag bottom at about **y 1280**, left edge at about **x 180**.

This overlaps the first caption band on purpose; use it unless the user asks otherwise.

Bake the size and position into the render. Graphics go into the project at default Motion
(`scripts/prproj_assemble.py`), so the .mov must already be correct. Wrap the tag:

```tsx
// (x0, y0) = the panel's top-left at full size, read off a full-size still
<AbsoluteFill style={{transformOrigin: '0 0', transform: `translate(${180 - 0.72 * x0}px, ${1140 - 0.72 * y0}px) scale(0.72)`}}>
  <NameTagNewsprint {...props} />
</AbsoluteFill>
```

Check a still of the settled tag against the numbers above.

## Shared rules

- **Text:** proper capitalisation. Names in title case, jobs in sentence case, never all caps. Small caps only where
  the face carries them (map style).
- **Names:** take them from the job, the project or the user. Never guess a surname or a title. Guests' surnames are
  often not in the audio, so ask.
- **Readability:** both lines high-contrast against their own panel (the current tags measure 10:1 or better on the
  name). Measure on the render, not from the hex values.
- **Entrance:** keep each component's own entrance. The common one: the panel slides up 64 px and fades in (f0–20).
  The name slides up 24 px and fades in from f3, the job from f12. A second strip follows the first (f7–27, it never
  leads). Everything uses `Easing.bezier(0.16, 1, 0.3, 1)` and has settled by about f27. The stout and newsprint tags
  also blur the lines in (6 → 0 px). Core memory lands each line as the chain stack instead of a fade.
- **Hold:** static to the last frame. No exit, no idle motion; the editor cuts away.
- **Short slot:** run the same choreography faster. `NameTagMapStyle` compresses its entrance to end by f12 when it
  is shorter than 30 f. If the tag must clear before its clip ends (a handle), reverse the entrance as the exit. Ref
  `generated/components/kits/name-tags/GossetNameTag.tsx`: the stout entrance at 27/7 speed, held, then reversed.
- **Length:** `NameTagNewsprint` and `NameTagMapStyle` take `durationInFrames` (pass the slot). The others are fixed
  at 96 f (core memory, stout) or 150 f (Humble). The editor trims them.
- **Frame rate:** the components export their own `FPS` (24, 30 or 24000/1001). The private Root still sets the
  sequence's rate. Example: `src/Root.NameTagKyleHarper.tsx` renders `NameTagMapStyle` at 30000/1001.
- **Placement:** start the tag on the first frame of the clip that shows the person, and cut it with that clip.
- **Also a lower third:** the same tag labels a person or a place in b-roll or a still (name = who or where,
  job = one descriptor). In map-style history clips, every portrait still of a person gets a tag.
- **Rendering:** one private Root per tag, or one per clip with a composition per person. Ref
  `src/Root.NameTagMapStyle.tsx`: compositions `NameTag-<Key>`, each with its own name, job and frame count.

## Stout tag: long names

`StoutNameTag` sizes the cream strip from `TAG_ADV_EM[name]` (the measured advance in em). Without an entry it
estimates 0.55 em per character, which is wrong for long names and can run off the frame. Measure the advance with
`hb-shape public/Sohne-Dreiviertelfett.otf "<name>"` and register it before rendering:
`TAG_ADV_EM["William Sealy Gosset"] = 9.615;` (as in `generated/components/kits/name-tags/GossetNameTag.tsx`).

## A style without a tag

Build one on this structure in the style's own materials: its font, palette tokens and kit, with name over job and a
panel or strips that hug the text. Make it one component with `name` / `job` props (plus `durationInFrames`). When the
user asks for options, put the options behind a `variant` prop and render stills of the settled tag over a real frame
of the clip. Animate only the picked variant, using the common entrance above. Then add the new tag to the table.
