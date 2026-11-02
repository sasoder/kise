# Works in Progress style

Follow CRAFT.md. For the magazine's clips (worksinprogress.co). Principle from the Core Memory archive collage
(`generated/components/neal-stephenson-trailer/nealShared.tsx`, `generated/components/pushp-trailer/`): **real things in
black and white are placed on the page, still visibly on the page, and the graphic and the real thing make one picture.**
Not a colour photo with graphics pasted on it ("cheap", Nov 2). None of Core Memory's look carries over: no squared
paper, no chain colours, no Barlow, no hard black shadow.

Brand tokens come from the site's own stylesheet (Nov 2026). Reference images: the clip's
`animation_source/notes/brand_refs/`; a reference lends its colours and method, never its page.

## Look

Each page is one theme pair from the site: a pale printed paper and its dark ink. One pair per clip.

| Paper | Ink | Site use |
|---|---|---|
| `#CEE0DC` mint | `#073429` deep green | the current lead feature, and the print cover's green |
| `#F8E6EA` pink | `#E20A39` red | |
| `#D8D9F1` lilac | `#363B8F` indigo | |
| `#F4D06F` yellow | `#4C3906` umber | |
| `#FFF7F4` off-white | `#121212` near-black | the site's page |

- **Spot inks:** red `#E20A39` and indigo `#363B8F` print over any paper, like a two-colour press. Accents only, one
  meaning per clip.
- **Ground:** the paper tone with fine fibre grain, a few faint scuffs and stray ink specks, as a scanned printed sheet.
  It never looks clean digital flat and never turns into a pattern.
- **Real objects:** real photographs in black and white, cut out, with a thin paper border where they read as a pasted
  print (halftone or slight grain, matched blacks and whites across the cut). A soft low contact shadow on the page, never
  a hard offset one.
- **Ink marks:** postmarks, stamps and rules print into the paper: `mix-blend-mode: multiply` with a rough, uneven ink
  texture and slight misregistration. Ink overlapping a photo darkens it.
- **Postage stamps** are the house object, from the magazine's own feature art: perforated white-bordered prints with a
  real picture, cancelled by a postmark. Use them when a thing is one of many, or sent, or counted.
- **Real colours** only for a real brand mark or a real material whose colour is the point (gold, a lab's mark).
- **Film life:** faint grain, new every frame. No gate weave, no glow, no gradient fills.

## Type

The site's faces (Editor, GT America Mono) are commercially licensed and not on this Mac. Until the user supplies them,
use the Google stand-ins named in the kit. Serif for names and big words, mono light for small labels and postmark
lettering, in mixed case like the site (mono labels may be uppercase inside a postmark). Burned-in captions carry the
speech, so type stays rare.

## Motion

Paper things move like paper: slid, dealt, pressed, and lifted, with ease in and out and one family of speeds. A stamp
lands with a short press, not a bounce. The camera moves through the page continuously; depth comes from parallax
between the page and the pasted objects.

## Kit

`generated/components/kits/works-in-progress/wipShared.tsx`. Start a cut with `bun run cut <Name> --clip <clip> --style wip
--fps 24 --seconds <slot>`.
