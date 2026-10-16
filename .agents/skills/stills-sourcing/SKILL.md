---
name: stills-sourcing
description: Choose, source, licence-check, name and place the still images for a clip. Use it for "source relevant images" (line 3 of the kickoff prompt), "find pictures / stills for this clip", "rely more on images", "use wikipedia commons or pics from their website", for the image sub-agent the director starts at the top of every clip job, and for finding the real-world material a graphic needs (period engravings and maps, a company logo SVG, daily stock closes, ocean depth, company filings, public-domain footage when the user asks). It covers casting (people first, with the line's emotion), sources with endpoints and gotchas (Commons API, Internet Archive, BnF, the Met, Nasdaq closes, Commons logo SVGs, Downie), download integrity, real-JPEG checks, naming, image_sources.txt and the timeline rule (whole image, static, hard cuts). Not for a news card of a modern article (news-card skill), not for the .prproj write itself (premiere-project skill), not for building a graphic.
---

# Stills sourcing

Images cover the whole clip, including the passages that get an animation (stills sit under the graphics). Run
commands from the kise repo root, `/Users/tom/Documents/tom fant/CAPTIONSTOOL/kise`; `S` = a scratchpad folder.

## 0. Setup
- Inputs: the clip folder, `words.json` (sequence seconds; premiere-project skill §3), the segment list, the show's
  style, any licence constraint and any note under the kickoff prompt.
- As the image sub-agent: the director launches it before directing, because rate limits make sourcing slow. A
  general-purpose sub-agent in the background, prompted "Read and follow
  `~/.claude/skills/stills-sourcing/SKILL.md`" plus the inputs above. It does not render, so it does not count against
  the three-builder memory cap.
- Output: `<clip>/images/` (the set), `<clip>/images/alternates/`, `<clip>/images/image_sources.txt`, and a placement
  list (file, in, out) for the assembly.

## 1. Cast the beats
- People first: whoever said, decided or embodies the line, wearing its emotion (beaming on "looking great", downcast
  on "now"), as an arc across the clip where possible. Not skylines, buildings or factories.
- Smart literal touches land: a dated photo on "the fall of 2026", a masked leader on "COVID".
- Pick expressions from a labelled contact sheet, never from file titles.
- Cover the whole clip with no filler and no near-duplicates. Verify subject and period; say when a photo is not the
  actual place.
- A reference image lends a graphic its colours, never its page.

## 2. Licences
- Default: free licences with credits.
- Client-safe request (e.g. Cheeky Pint: "use wikipedia commons or pics from their website"): Commons PD / CC0 / CC BY /
  CC BY-SA, Unsplash / Pexels / Pixabay, government PD archives, the subject's official site or press page. Never news
  sites, agencies or random search results. A beat with no safe option is skipped and named in the report.
- From this Mac: Pexels returns 403, Pixabay's API needs a key, Unsplash napi returns nothing, Openverse is mostly
  Flickr (not safe). Commons does the work.

## 3. Sources
Every request carries a descriptive User-Agent (e.g. `-A "kise-stills/1.0 (personal video research)"`).

**Wikimedia Commons** (`https://commons.wikimedia.org/w/api.php?format=json&action=query&...`)
- Search: `generator=search&gsrnamespace=6&gsrsearch=<2-3 keywords> filetype:bitmap&gsrlimit=50&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=600`.
  Search is strict AND: 2-3 keywords; long queries return nothing.
- Categories are the treasure: `prop=categories` on a good hit, then
  `list=categorymembers&cmtitle=Category:<Name>&cmtype=file&cmlimit=500` (`Category:Battle of Cempoala`,
  `Category:Xi Jinping in <Month> <Year>` under `... by year`, event subcategories).
- Licence and credit: `extmetadata` (`LicenseShortName`, `Artist`, `Credit`).
- Rate limits: API calls ~1.5 s apart; upload.wikimedia.org downloads ~4 s apart with retries. After ~600 thumbnails
  it answers `retry-after: 600` to everything: wait the full 10 minutes, then 15 s apart. Originals that keep 429ing:
  request `iiurlwidth=1920` and download `thumburl` (standard widths only; others return 400).

**History**
- Engraved plate sets give a clip one look: Solís, *Historia de la conquista de México* (1783 and 1851) and Prescott,
  *Historia de la conquista del Perú* (1851), scanned by the Universidad de Sevilla Fondo Antiguo, CC BY 2.0 (credit the
  library).
- Internet Archive beats Commons for rare books (John Carter Brown scans ~3348x5096). IIIF page:
  `https://iiif.archive.org/image/iiif/3/{id}%2f{id}_jp2.zip%2f{id}_jp2%2f{id}_{NNNN}.jp2/full/max/0/default.jpg`;
  `full/160,/` gives thumbnails of every page first. Crop a plate from its page with a row/column dark-pixel profile;
  place an unlabelled plate by grepping the item's OCR text. de Bry, *Americae pars sexta* 1596 =
  `americaeparssext00benz_0` (Cajamarca plates n129, n131, n133; blank 1596 leaves n177-n179).
- Old newspapers with OCR on IA (e.g. the *Inyo Independent* 1870-1901,
  `inyo-independent-<year>-all-issues[-from-cdnc]`): text `https://archive.org/download/<id>/<doc>_djvu.txt`; leaf
  and box `https://<server>/fulltext/inside.php?item_id=<id>&doc=<doc>&path=<dir>&q="phrase"` (server and dir from
  `https://archive.org/metadata/<id>`); scan `https://archive.org/download/<id>/page/n<leaf>.jpg` (`_w2000` = half
  size). CDNC and Chronicling America sit behind bot checks: look for the same title on IA.
- Maps: BnF Gallica scans and the 1524 Nuremberg Tenochtitlan (Newberry), 3-7k px.
- Objects: Met Open Access (CC0). Brooklyn Museum
  `d1lfxha3ugu3d4.cloudfront.net/images/opencollection/objects/size4/<accession>_SL1.jpg` (~2000 px; size5+ is 403).
  Guaman Poma `http://img.kb.dk/ha/manus/POMA/poma550/POMA{NNNN}v.jpg` caps at 830 px. The Prado and GNM give nothing
  beyond Commons.
- Period photographs: O'Sullivan's 1867-68 Comstock mine series (NARA, PD).

**Politicians and modern people**
- White House photos (PD, 3000 px, candid close-ups) via Commons event categories (e.g. `Category:Busan Summit`);
  Brazil's Planalto (CC BY 2.0, 6240 px); kremlin.ru, European Commission, EU AV (CC BY 4.0); Casa Rosada (CC BY 2.5
  AR); Ecuador presidency (PD); China News Service YouTube stills (CC BY 4.0, watermarked); old WEF Davos (CC BY-SA 2.0).
- latimes.com blocks WebFetch: open the page in the built-in browser and read `og:image`; the original is the S3 URL
  inside its `?url=`. api.army.mil needs full browser headers including Referer `https://www.army.mil/`.

**Footage** (only when the user asks)
- archive.org / NARA public-domain films first. YouTube through Downie, which works headless:
  `open -a "Downie 4" "<url>"`; the file lands in `~/Downloads`.
- Matching a long b-roll video to the narration: read 4 s contact sheets against the transcript. Cutting and placing:
  premiere-project skill (b-roll).

**Logos**
- Commons SVGs: `list=search&srnamespace=6&srsearch=<name> logo filemime:image/svg+xml`, then
  `https://commons.wikimedia.org/wiki/Special:FilePath/<File name>.svg`.
- `https://cdn.simpleicons.org/<slug>/ffffff` covers many brands (f1, Target, Uber, eBay), not Equifax, Yahoo,
  LinkedIn, Adobe, T-Mobile, Capital One, AT&T, Home Depot or sports clubs.
- Club crests: Commons (Lakers, Cowboys) or the en.wikipedia infobox file (Real Madrid, Man United).
- AI-lab marks not yet in `generated/components/kits/dwarkesh/brandGlyphs.tsx`: lobehub's monochrome set,
  `https://unpkg.com/@lobehub/icons-static-svg@latest/icons/<name>.svg` (single colour, evenodd), copied in as
  `{viewBox, paths}`.
- `qlmanage -t -s 400 -o "$S" *.svg` rasterises for a look (no rsvg or magick on this Mac). How a logo enters a graphic:
  CRAFT.md. Builders get a prepared local file (a coloured logo turned into white-on-alpha PNG).

**Stock prices**: `https://api.nasdaq.com/api/quote/<TICKER>/chart?assetclass=stocks&fromdate=YYYY-MM-DD&todate=YYYY-MM-DD`
with a Chrome User-Agent and `Accept: application/json` returns ~20 years of daily closes (`data.chart[].z.dateTime`,
`close`). `/historical` caps at 10 years; Yahoo, stooq and MarketWatch block curl. Resample long spans to weekly closes.

**Other data**
- Ocean depth: GEBCO WMS `wms.gebco.net/mapserv` (layers GEBCO_LATEST, GEBCO_LATEST_TID, GEBCO_LATEST_3), 4096² per
  request.
- UK company accounts: Companies House scans. The Read tool cannot open them (no poppler): render pages with a small
  Swift PDFKit tool and OCR with macOS Vision. FX at Fed G.5A annual averages.

## 4. Download and check
- Downloads go into their own new folder (`$S/dl/`); scripts that read them run with `python3 -I`, which hides PIL:
  crop and convert with ffmpeg instead. Never name a script `select.py` (it shadows the stdlib).
- Integrity: reset the buffer per file in retry loops; check each size against `imageinfo.size`; take the extension
  from the file title, not the URL; `md5 -r` the set (a failed retry can save one file's bytes under the next name).
- Real JPEGs only: `file -b <f> | grep -a JPEG` (`-a`: Photoshop-comment JPEGs fail a plain grep). A CDN `.jpg` can be
  WebP. Convert PNG/WebP: `ffmpeg -v error -i in.webp -q:v 2 out.jpg`.
- A rotated EXIF orientation is refused by the assembler (the error names it). Re-encode upright, which drops the tag:
  `ffmpeg -v error -noautorotate -i in.jpg -vf transpose=1 -q:v 2 out.jpg` (orientation 6; `transpose=2` for 8,
  `hflip,vflip` for 3), and check it on the sheet.
- Contact sheets: a labelled sheet of ~600 px thumbs (`iiurlwidth=600`) to choose from, then a sheet of the downloaded
  files to confirm.

## 5. Name and record
- In `<clip>/images/`: `<SS.s>_<Words>_<Subject>.<ext>`, `SS.s` = the word onset in sequence seconds, one decimal,
  zero-padded (`05.9_TooMuchCeiling_OSullivanMinersTimberingComstock1867.jpg`).
- Exactly one image per timestamp, so the names count up. A follow-on shot takes its own later word. True alternates go
  in `images/alternates/` under the same timestamp.
- `images/image_sources.txt`: file → source URL, licence, credit. The main set in order, then the alternates.

## 6. Place
- The rule: every still at fit scale, the whole image inside the frame, centred, letterboxed, never cover-cropped.
  Static, hard cuts, placed roughly on the line it illustrates; the user adds motion and reframes.
- Each still runs from its onset to the next still's onset (or the end of the thought it illustrates), on the stills
  track under the graphics. In the assembly `images` section leave out `scale`, `pos` and `xfade_*`. The write:
  premiere-project skill §5.
- Motion only on request. When the user splits a still in two, the halves mark a pan's start and end. The still pan with
  a logo is in `styles/dwarkesh-map.md`; it goes on a track above the user's own still (theirs stays underneath) as
  `<inSeconds>_<Subject>Pan.mov`, replacing any earlier overlay there.

## 7. Report
- `image_sources.txt` path, the count per section of the clip, and the placement list (file → sequence timecode).
- Beats skipped for want of a safe licence, subjects that could not be verified, photos that are not the actual place.
- Stills on V2 hide the speaker unless the user trims them: say so.
