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
- **Postage stamps and postmarks** come from the magazine's own feature art, and the site is a reference, not a template.
  Use one only when the line is about post or sending something. Never as decoration or as a way to
  "label" a subject: the user rejected a Penny Black, an empire postmark, a school postmark and a £0 salary postmark in one
  clip as forced (Nov 3: "these red stamps [don't] really add anything"). Show the real thing instead (the school's own
  building, the MP's own banknotes): real cut-outs blended into the page are what the user likes.
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

Keep it sleek: few things moving at once, one camera curve, and same-size stamps set down in place. When several things
compete, cut them rather than slow them down. In the settled frame, stamps, maps and heads stay about 90-120 px from the
left and right edges. A ground strip that bleeds off the frame needs no padding.

## Stripped-down variant (user, Nov 6–7, "entertainment industry")

When the user asks for "stripped down / messier": the off-white paper, hand-cut b&w prints, masking tape and a red
felt-tip as the only accent (shared module `generated/components/wip-entertainment/messyShared.tsx`). The focus is on the
things happening, not on animation: "the red pen getting drawn is very extra and over the top" (Nov 7).
- Changes of state are **hard cuts on the words**: a print is there or it is not; a pile is whole, then half. No
  slides, deals, draw-ons, write-ons, tears in progress or settle wobbles.
- Markings (circles, arrows, lines, a scrawled year or number) are welcome but **cut in whole** on their frame, static:
  no draw-on, no boil.
- The camera stays still. The frame lives through the paper grain only.
- Nov 7 ranking: "ya boom" (`wip-ya-boom/yaShared.tsx`: b&w photocopy cut-outs on one page, tape, mono labels, red
  marker only) was judged better than the first "entertainment industry" pass, "definitely a step more in the right
  direction", but "still a bit over the top, can be more stripped down". Both first passes still moved too much (camera
  pulls and descents, deals, slap-downs, write-ons, a hand, a toppling tower). Keep ya boom's look; apply the rules above.
- Nov 8, on ya boom's hard-cut pass: "a lot more raw and authentic now … matches the style more", but "stripped down" never
  meant losing colour: "bring back all the colors". Photos, covers and logos keep their own colours (bake-photo.py
  `--colour`, XeroxCutOut `colour`): no greyscale, no photocopy grade. Stripped down is about motion, not colour.

## Kit

`generated/components/kits/works-in-progress/wipShared.tsx`. Start a cut with `bun run cut <Name> --clip <clip> --style wip
--fps 24 --seconds <slot>`.
