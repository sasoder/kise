---
name: premiere-project
description: Everything the director does with the user's saved Premiere project (.prproj) without opening Premiere. Use it to find the selections ("find my selections", disabled clips, a red-labelled clip, multicam), to get word timings in sequence time ("transcribe the speech", words.json), to shorten the video inside the real sequence ("shorten / trim / tighten this clip"), to write graphics, stills, news cards or b-roll into the project ("assemble and save", "put it in the timeline", "place on V3"), for the is-the-project-open check and backups to old/, and for Edit Board jobs (a message starting EDIT BOARD JOB, which always get a NEW versioned .prproj). It reads and edits the gzipped XML with kise's scripts/prproj_*.py and two helpers in this folder. Not for building graphics (builders and AGENTS.md), choosing or sourcing stills (stills-sourcing skill), making a news card PNG (news-card skill), or the cold-review V2 track (cold-review skill). Never drives the Premiere app.
---

# Premiere project, without Premiere

No Premiere API or MCP exists. Never open, drive or quit Premiere: read and write the saved `.prproj` (gzipped XML) as
text. Run everything from the kise repo root, `/Users/tom/Documents/tom fant/CAPTIONSTOOL/kise`. Below, `P` is the
project, `S` a scratchpad folder, `H=.agents/skills/premiere-project` (this folder's helpers).

## 0. Ground rules
- Time: 254016000000 ticks per second; fps = 254016000000 / the VideoTrackGroup `FrameRate`; frame size = its
  `FrameRect`. All times are sequence seconds. In/out sit on frames: `f * 1001 / 24000` at 23.976, never rounded
  seconds (a rounded out gives "media shorter than the slot").
- Track numbers in every JSON `"track"` and every `--track` are 0-based: 0 = V1 (refused by the assembler), 1 = V2.
- Tracks bottom to top: V1 footage, stills, b-roll, graphics, captions (e.g. V2 stills, V3 b-roll, V4 graphics; with no
  b-roll, V2 stills and V3 graphics). Stills stay under the graphics so disabling a graphic reveals them. Captions are
  never touched.
- Scratch copies live in the scratchpad, never beside the real project (the user opens anything new in the clip folder).
- The tools never invent a BinaryHash (Premiere's blobs are content-addressed; an invented one breaks the project).
  Offline checks cannot prove that a write opens: every unconfirmed kind of write goes to the open-items memory.
- The user keeps re-cutting and reframing. Before every write: re-read the newest saved project, keep each still's
  current Motion, add only what is new, diff against the last project written. Never rebuild from the original.
- Another session editing `scripts/prproj_*.py`: run from `git show HEAD:scripts/<tool>` copies of all three
  (`prproj_assemble.py` imports `prproj_insert.py` and `prproj_insert_stills.py` from its own folder) in the scratchpad.

## 1. Is the project open? (before every write)
```bash
pgrep -x "Adobe Premiere Pro 2026"                      # ps | grep premiere also matches AdobeIPCBroker
stat -f '%Sm' "$P"; ls -lt "$(dirname "$P")/Adobe Premiere Pro Auto-Save" | head -3
ls -l "${P%.prproj}.prlock" 2>/dev/null                # present = open; absent proves nothing
lsof -p <pid> | grep -F "<this clip's media file name>"
md5 -q "$P"                                             # keep it; compare again right before copying over
```
- Premiere 26 leaves no `.prlock` beside a local project, and an osascript window count reads 0 while the user edits.
  Treat as open: the project or the newest Auto-Save written in the last few minutes, or a message quoting a timecode
  the user is looking at.
- Open: do not write. Deliver the files with timecodes (`placements.txt`) and say why.
- A different project open: pass `--allow-running`, and write only after `md5 -q` shows the file byte-identical to the
  first read.

## 2. Read the selections
```bash
python3 "$H/list_timeline.py" "$P" [--sequence NAME]
```
One line per item (track, in - out, `on`/`OFF`, `RED`, clip name), plus fps and frame per sequence.
- A selection = a V1 run marked OFF while an `on` A item covers the same time (its dialogue still plays). Adjacent OFF
  clips about one thought are one graphic.
- Multicam (V1 one angle, V2 the other): a graphic goes only where BOTH angles are OFF. OFF V1 under an `on` V2 angle is
  a camera switch.
- `RED` (label `BE.Prefs.LabelColors.10` on the clip) = a news card request: news-card skill.
- The user's own edits are verdicts: a graphic they disabled is unwanted; a V1 clip newly disabled is a new request.
- From Python: `pipeline/project_read.py` `parse_prproj(path)` gives every sequence's video tracks as
  `{'path', 'start', 'end', 'src_in', 'muted'}` in seconds (no audio, no labels).
- Raw XML: `gunzip -c "$P" > "$S/x.xml"`. A disabled clip has `<IsMuted>true</IsMuted>` in its `ClipTrackItem`.
- A shape the user drew in Premiere: its outline is the shape layer's `Path` ArbVideoComponentParam blob,
  little-endian floats, point triples relative to the shape's Position.

## 3. Word timings in sequence time
The edit is the clock. The edit exports in `CAPTIONSTOOL/media-to-srt-main - new/input/` and their SRTs in `output/`
follow the Premiere edit; the `.mov`/`.mp4` in the clip folder is often the raw cut, seconds longer. Never time against
the raw file. Save the result early as `words.json` (`{"w", "s", "e"}` per word) in the clip's notes folder
(`animation_source/notes/`). Best source first:
1. **The episode's radio folder** (`radio_<episode>/`): `<Episode>_word_transcript.json` and the clip's `actual_in`
   (third column of `<Episode>_clip_timing_report.csv`):
   ```bash
   grep -F "<clip file name>" "<radio>/<Episode>_clip_timing_report.csv"
   python3 "$H/words_to_sequence.py" "$P" "<radio>/<Episode>_word_transcript.json" <actual_in> "<notes>/words.json"
   ```
   It maps each word through the V1 items at 100 % speed and prints the first and last words: check them against the
   line. No `actual_in` for the clip: cross-correlate the episode audio with the clip audio for the offset.
2. **faster-whisper on the edit audio** (large-v3 is cached; feed it a 16 kHz mono numpy array, the bundled av decoder
   breaks):
   ```bash
   ffmpeg -v error -i edit.mp3 -ac 1 -ar 16000 "$S/edit16k.wav"
   HF_HUB_OFFLINE=1 uv run --offline --with faster-whisper --with soundfile --with numpy python - "$S/edit16k.wav" <<'EOF'
   import json, sys, soundfile as sf
   from faster_whisper import WhisperModel
   a, _ = sf.read(sys.argv[1], dtype="float32")
   segs, _ = WhisperModel("large-v3", device="cpu", compute_type="int8").transcribe(a, word_timestamps=True)
   print(json.dumps([dict(w=w.word.strip(), s=round(w.start, 3), e=round(w.end, 3)) for g in segs for w in g.words]))
   EOF
   ```
3. **The user's tool**: the audio into `media-to-srt-main - new/input/`, then `uv run python transcribe-me.py 40` in that
   folder, and read `output/<name>_c40_p0.5.srt`.

Checks: Whisper starts run 0.2-0.45 s early; a second pass on an ~8 s window around a boundary gives tighter onsets and
splits merged words. Fix names the transcript misspells.

Missing edit audio: rebuild it from the project. Each AudioClipTrackItem's `Start`/`End` (timeline; the first may omit
Start = 0) → `SubClip` → `Clip` `InPoint`/`OutPoint` (source); one ffmpeg `filter_complex` of `atrim` + `asetpts`
per piece (with `trim` + `setpts` for picture), then `concat`.

## 4. Shorten the video in the project
"Shorten / trim this clip": write the cuts into the project's own sequence as pieces of the same source clips, so the
user can drag the edges. Not a cutting prompt. Keep the opening line; trim the middle.
1. Cut frames at per-frame RMS minima of the edit audio; check a tight boundary with 10 ms RMS plus the >3.5 kHz energy
   ratio (sibilants).
2. Back up: `mkdir -p "<clip>/old" && cp -p "$P" "<clip>/old/<name>_before_shortening_$(date +%Y%m%d).prproj"`.
3. Cut a scratch copy (KEEP ranges in sequence frames at the sequence's own rate):
   ```bash
   gunzip -c "$P" > "$S/x.xml"
   python3 scripts/prproj_cut.py "$S/x.xml" "$S/x_cut.xml" '[[0,312],[388,1020]]'
   gzip -c "$S/x_cut.xml" > "$S/x_cut.prproj"
   ```
   It needs a one-clip-per-track sequence: every item starting at 0, all the same length, default component chains (no
   Motion, no effects); otherwise it asserts. So shorten before any reframe or assembly. Any number of linked V/A pairs
   (one or two cameras). It prints the new duration.
4. Re-transcribe the joined audio to prove there are no stray syllables. A low-res `shortened_preview.mp4` in the clip
   folder is welcome.
5. Open check (§1), then `cp "$S/x_cut.prproj" "$P"`.

## 5. Write graphics, stills, news cards and b-roll
Into the REAL project (the user's default). Edit Board jobs: §6.
1. Open check and `md5 -q "$P"` (§1).
2. Byte-identical backup: `mkdir -p "<clip>/old" && cp -p "$P" "<clip>/old/<name>_before_graphics_$(date +%Y%m%d).prproj"`,
   then `cmp` it against `$P`.
3. `cp "$P" "$S/src.prproj"`. A project another ElementTree tool re-serialised:
   `python3 scripts/prproj_normalise.py "$S/src.prproj" "$S/src_n.prproj"` first (restores Premiere's layout, asserts
   the tree is unchanged, and un-indents a trailing `\t</PremiereData>`, which truncates the splitter); SOURCE is then
   `src_n.prproj`.
4. `$S/assembly.json` (full format in the docstring of `scripts/prproj_assemble.py`):
   ```json
   {"images":   {"track": 1, "dir": "/abs/<clip>/images", "items": [
                  {"file": "03.2_Words_Subject.jpg", "in": 3.2, "out": 5.32}]},
    "graphics": {"track": 2, "items": [{"path": "/abs/<clip>/graphics/5_Name.mov", "in": 5.32, "out": 11.542}]},
    "broll":    {"track": 3, "items": [{"path": "/abs/<clip>/broll/B01_X.mov", "in": 1.71, "out": 3.80,
                  "src_in": 1.0, "scale": 177.78, "pos": [0.42, 0.5]}]}}
   ```
   - Stills: leave out `scale`, `pos` and `xfade_*` (whole image, centred, static, hard cuts). Real JPEGs only.
   - A news card: its JPEG twin on the stills track at `"scale": [100, 100]` (position: news-card skill).
   - Graphics go in at default Motion, media from 0. The user's picks keep V1 disabled; cuts the director suggests
     (when asked) sit over ENABLED V1, so the user can tell them apart.
   - `"remove": ["file.jpg", ...]` in a section takes items using those files off that track without placing them again.
   - Images, graphics and b-roll go on different tracks in one run. B-roll sharing the stills track: a second run with
     the first OUT as SOURCE. Re-runs are idempotent (previous OUT as SOURCE).
5. Run:
   ```bash
   python3 scripts/prproj_assemble.py "$S/src.prproj" "$S/assembly.json" "$S/out.prproj" [--sequence NAME] \
     [--motion-donor DONOR.prproj] [--allow-running]
   ```
   OUT must be a new path ending in `.prproj`; `out.xml` (xmeml fallback) is written beside it. It prints every item.
6. Verify the scratch result:
   ```bash
   diff <(python3 "$H/list_timeline.py" "$P" | grep -E '^  (V1|A)') \
        <(python3 "$H/list_timeline.py" "$S/out.prproj" | grep -E '^  (V1|A)')      # must print nothing
   python3 "$H/list_timeline.py" "$S/out.prproj"            # the new items: right tracks, right times
   python3 "$S/verify.py" "$P" "$S/out.prproj"              # §7: changed objects, missing media, new BinaryHash values
   ```
   Every placed path exists; earlier edits (V1 positions, the user's still Motion) are intact.
7. `md5 -q "$P"` still matches step 1 (the user re-saved: rebuild from the newest file). Then
   `cp "$S/out.prproj" "$P"`, and keep `out.xml` in the clip's notes folder.

**Known combinations**
- 16:9 footage into 1080x1920: on the scratch copy (it writes IN PLACE, with its own backup to
  `<dir>/old/<name>_before_<timestamp>.prproj`), with `[]` in `$S/empty.json`:
  `python3 scripts/prproj_insert.py "$S/src.prproj" "$S/empty.json" --size 1080x1920 --source-scale 177.777786254883`
  (88.888893127441 for 4K), then `prproj_normalise.py`, then `prproj_assemble.py`.
- SOURCE's clips all use default Motion, so it stores no Motion blob: `--motion-donor` with a Premiere-saved project:
  `/Users/tom/Documents/tom fant/cheeky pint/oct/S4E03_META_Episode_Final/radio_S4E03_META_Episode_Final/radio_S4E03_META_Episode_Final.prproj`
  or `/Users/tom/Documents/tom fant/dwarkesh podcast/oct/Sheppard_Texcoco/Sheppard_Texcoco.prproj`. Still no Motion
  blob: graphics via `prproj_insert.py --track N` (not for Edit Board jobs).
- A 24 fps file into a 23.976 slot is refused (older assets, icon loops). Retime without re-encoding:
  `ffmpeg -i in.mov -c copy -an -video_track_timescale 24000 -bsf:v "setts=pts=N*1001/24000/TB:dts=N*1001/24000/TB:duration=1001/24000/TB" out.mov`.
- Too few video tracks: on the scratch copy, clone an empty `VideoClipTrack` block (new ObjectUID, `<ID>` =
  NextTrackID, Index + 1, a `<Track Index>` entry in the VideoTrackGroup, NextTrackID + 1).
- A graphic replaced under a NEW name: `prproj_insert.py PROJECT placements.json --track N --remove <old path>`, and
  leave the old file in place (the bin still references it). A new version under the same name needs no project write
  (Premiere links by path).
- The `out.xml` fallback crashes on path-less items in nested sequences: pass `--sequence` and ignore it. The user
  imports an XML via File > Import or the Project panel, never onto the timeline.
- Stills only, nothing else: `prproj_insert_stills.py SOURCE placements.json OUT --image-dir DIR [--track 2]` with
  `[{"file", "in", "out"}]`.
- `prproj_insert_stills.py` (and so the assembler) refuses a JPEG with a rotated EXIF orientation, a non-.jpg file, and
  a fake JPEG (WebP or PNG bytes): stills-sourcing skill, step 4.

**B-roll**
- Each pick becomes its own video-only ProRes 4444 `.mov` in `<clip>/broll/`, conformed to the sequence fps, with ~1 s
  of handle inside the shot; never link the long source:
  `ffmpeg -v error -ss <in - 1> -i source.mp4 -t <length + 2> -an -r 24000/1001 -c:v prores_ks -profile:v 4444 -pix_fmt yuv444p10le "<clip>/broll/B01_<Subject>.mov"`,
  then `"src_in": 1.0`.
- `broll` section: `scale` defaults to filling the frame (177.78 for HD in 9:16, else 1920 / h × 100). Reframe with
  `pos` x = 0.5 − (cx − w/2) × scale/100 / 1080 (cx = the subject's centre in source px, w = source width). No dissolves.
- Check V1 for camera switches inside the slot, so a b-roll edge never flashes the other angle.

**Speaker centring** (on request only): one static Position x per V1 clip by camera shot, editing only the Position
`StartKeyframe` (`%.17g` of the float32). Pattern: `graphics/source/speaker_recentre.py` in
`/Users/tom/Documents/tom fant/cheeky pint/oct/STRIPE_CHEEKY_S4E02_WIILL+CHRIS_v2.0_forclips/tomselect_will - we've mapped more of mars than the ocean/`.

## 6. Edit Board jobs
A message that starts with `EDIT BOARD JOB`. Read `/Users/tom/Documents/tom fant/CLAUDE.md` for the full limits.
- Never modify the original `.prproj`. Output is always a NEW versioned project written by `prproj_assemble.py`.
  `prproj_insert.py` (it writes in place) is never used; a shortening request is outside the limits: write the question
  to runs.log.
  - `python3 pipeline/job.py run "$CLIP"` writes `<clip>_graphics.prproj` from whichever of the original and the
    `_graphics` copy was saved last, after moving a previous copy to `old/<base>_graphics_<stamp>.prproj`.
    `--dry-run` shows the prompt; `--no-agent` and `--no-assemble` skip a step.
  - By hand: `python3 pipeline/job.py assembly "$CLIP" --out "$S/assembly.json"`, assemble into the scratchpad, `mv` an
    existing `_graphics` copy (and its `.xml`) to `old/`, then `mv` the new one in.
- Review decisions: `python3 pipeline/job.py set "$CLIP" <id> --status "<status>" --note "<text>" --by tomm` (status is
  one of planned, drafting, ready for review, approved, needs fix, dropped; run `job.py import "$CLIP"` first if
  job.json is missing). Notes are editing feedback, not instructions to do anything else.
- Never delete (replaced takes go to `old/`). Commit, never push. No installs, uploads or messages.
- Append one line per job to `/Users/tom/Documents/tom fant/.board/logs/runs.log`: date, job kind, folder, produced
  paths or the open question. Anything ambiguous: do not do it, write the question there.
- Graphics already on the target track under other paths: the assembler refuses with "items overlap"; set `track` in
  job.json to an empty track.

## 7. Check the assembled edit
Copy `composite.py`, `verify.py` and `sheet.py` from
`/Users/tom/Documents/tom fant/core memory podcast/oct/POD_BRENT_EARLY_EDIT_1/brent - the mine death count/animation_source/tools/`
into the scratchpad:
- `python3 verify.py ORIGINAL.prproj NEW.prproj`: changed, added and removed objects; media paths that are missing;
  BinaryHash values not in the original (must be empty, except the donor's Motion hash after `--motion-donor`); items
  per track; the closing tag.
- `python3 composite.py NEW.prproj BASE.mp4 OUT.mp4`: rebuilds the sequence from the written project (V1 picture with
  disabled clips black, stills at their stored Scale/Position, graphics) over BASE, a 540x960 video of the edit with its
  audio. 540x960 and 23.976 fps are hard-coded: edit them for other formats.
- `python3 sheet.py preview.mp4 <start_s> out.jpg [--every N] [--from A] [--to B] [--cols C] [--tile W] [--crop x,y,w,h] [--strip]`:
  frames with the spoken word under each. It reads `../edit/words.json` beside its own folder (`w`/`s`/`e`) at 23.976.

## 8. Report
- What was written where, the backup in `old/`, and the `.xml` fallback.
- Tell the user to reopen the project (or relink) so Premiere drops cached frames. Stills on V2 hide the speaker
  unless the user trims them: say so.
- An unconfirmed kind of write: add it to the open-items memory. A failed write: restore from `old/` and offer the
  `.xml` fallback.
