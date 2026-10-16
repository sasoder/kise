---
name: news-card
description: Make the house news card, a square 1080x1080 PNG of a REAL modern article (orange dash, outlet, date, the article's own headline and lead photo), and place it as a still. Use it when a V1 clip carries the red label (list_timeline.py shows RED), when the user asks for "a news card" or "a headline card", or when a line names a real recent article, report or headline ("there was a Reuters story", "it was all over the news"). It covers picking the one article, getting its headline, date and photo, running scripts/make_news_card.py, naming, the JPEG twin and its placement. A historical event (a period newspaper exists) gets the plain newspaper scan instead, also covered here. Not for a card drawn inside an animation (that is the builder's job under the style file; ChinaTalk never draws one on the newsprint page), not for ordinary stills (stills-sourcing skill), not for the project write itself (premiere-project skill).
---

# News card

One real article per card, picked by me; no list for the user to choose from. Run from the kise repo root,
`/Users/tom/Documents/tom fant/CAPTIONSTOOL/kise`. `S` = a scratchpad folder.

## 0. The slot
- A red-labelled V1 clip: its in/out from `python3 .agents/skills/premiere-project/list_timeline.py "$P"` (premiere-project
  skill) is the slot. Otherwise the slot runs from the onset of the word that names the story to the end of that
  thought, from `words.json`.
- Modern digital article → a card (§1-§4). An event from before online news (a period newspaper exists) → the plain
  scan (§5), no card.

## 1. Pick the article
- A credible mainstream outlet: Reuters, CNBC, NBC, CNN, BBC, NPR, TIME, AP/AFP, MIT Technology Review, SCMP, Fast
  Company, Rolling Stone, Platformer. Never aggregators, SEO pages or AI-news sites.
- A headline that reads at a glance and matches the speaker's exact point, not just the topic.
- A strong lead photo of people or action. No photo, or a logo-only photo: pick another article.
- The real publication date of that article.
- If the user named or linked an article, use exactly that one.

## 2. Headline, date and photo from the page
- From the page itself: the headline as published (it may drop "EXCLUSIVE:" or a trailing "| Reuters"; otherwise keep
  the wording), the date, and the photo from `og:image`. Note the photo credit shown on the page.
- latimes.com blocks WebFetch: open the article in the built-in browser and read `og:image`; the original is the S3 URL
  inside its `?url=`.
- Download the photo into its own new folder, e.g. `$S/dl/`. Then re-encode it with ffmpeg into the clip's source
  folder `<src>`: `<clip>/animation_source/` (an older clip that already has `graphics/source/`: that folder). The
  card script needs PIL, which `python3 -I` hides, so it never reads the raw download:
  ```bash
  mkdir -p "<src>"
  ffmpeg -v error -i "$S/dl/<file>" -q:v 2 "<src>/newscard_<outlet>_<topic>_photo.jpg"
  ```

## 3. Make the card
```bash
python3 scripts/make_news_card.py "<clip>/graphics/newscard_<outlet>_<topic>.png" "<OUTLET>" "Month D, YYYY" \
  "<Headline as published>" "<src>/newscard_<outlet>_<topic>_photo.jpg" "Photo: <credit>" [crop_y]
```
- All arguments are positional. `crop_y` (0 top .. 1 bottom, default 0.5) picks the vertical crop of the photo; to set
  it without a credit, pass `""` as the credit.
- Needs `~/Library/Fonts/Inter-VariableFont_opsz,wght.ttf` (it is installed).
- It prints `headline <px>px, <n> lines`. Two lines is the design. More than two lines at 42 px makes a tall header and
  a short photo: pick an article with a shorter headline rather than rewording it.
- Name: `newscard_<outlet>_<topic>.png`, lowercase words joined by underscores (`newscard_axios_titan_prototype.png`).
  A new version keeps the name; the previous file goes to `old/` first (`mv -n`).

## 4. The JPEG twin and placement
The PNG has 8 px transparent rounded corners; the timeline gets a JPEG twin with square corners, same name:
```bash
sed -e '/^im.putalpha(mask)$/d' -e 's/\.save(out)$/.convert("RGB").save(out, quality=95)/' \
  scripts/make_news_card.py > "$S/make_news_card_square.py"
python3 "$S/make_news_card_square.py" "<clip>/graphics/newscard_<outlet>_<topic>.jpg" <same arguments as §3>
file -b "<clip>/graphics/newscard_<outlet>_<topic>.jpg" | grep -a JPEG
```
- Place the `.jpg` on the stills track through the `images` section of the assembly (premiere-project skill, §5),
  `"file"` relative to the section's `dir` (e.g. `"../graphics/newscard_<outlet>_<topic>.jpg"`):
  - 9:16: `"scale": [100, 100], "pos": [[0.5, 0.28125], [0.5, 0.28125]]`: the card spans y 0-1080, above the caption
    bands (y 1080-1250 and 1360-1460).
  - 16:9: `"scale": [100, 100]`, `pos` left out (centred, full height).
  - Static, hard cuts: no `xfade_*`.
- The PNG stays beside the JPEG for the user.

## 5. Historical event: the plain scan
- No card header, no retyped headline. Deliver the scan of the period newspaper: the clipping crop, the full page and
  the source link.
- Sources and endpoints (Internet Archive newspapers with OCR, leaf and box search, page scans): stills-sourcing skill.
- Name and place them as stills, whole image, static (e.g.
  `images/13.3_NewspaperReports_InyoIndependent1897-04-16Page.jpg`).
- Read the report. When the paper's numbers contradict the speaker, flag it in the hand-off.

## 6. Record and report
- `images/image_sources.txt`, a NEWS CARD section: where it sits on the timeline (file, in-out), outlet, date, headline,
  URL, photo credit.
- In chat, 2-3 lines: the pick and why, with 1-2 runners-up (outlet, headline, URL). Never a list to choose from.
