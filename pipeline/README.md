# pipeline/ — job.json and the one-command run

`job.json` sits in each clip folder beside its .prproj and is the one record of that clip's graphics and images:
where each one lands, which version is current, and its status (planned, drafting, ready for review, approved,
needs fix, dropped). Format: `job-schema.md`. The project board and the FilmCraft timeline export read the same file.

```bash
cd "~/Documents/tom fant/CAPTIONSTOOL/kise"
CLIP="$HOME/Documents/tom fant/dwarkesh podcast/sep/Noam_Alignment"

python3 pipeline/job.py import "$CLIP"            # job.json from what is already there (.movs, placements.txt, assembly JSON)
python3 pipeline/job.py status "$CLIP"
python3 pipeline/job.py set "$CLIP" g_HonestyGoesUp --note "fewer beads, slower climb"   # a note = needs fix
python3 pipeline/job.py run "$CLIP"               # agent revises / builds, then placements + <clip>_graphics.prproj
python3 pipeline/job.py run "$CLIP" --dry-run     # show the prompt it would send, change nothing
```

`run` does, in order:
1. No graphics yet: the usual clip-job kickoff ("Create motion graphics in: … / Working folder: …").
   Graphics marked `needs fix`: a revision prompt with your notes, same file names, old versions to `old/`.
2. The agent runs headless in this repo: `$KISE_AGENT` (default `claude -p`), with your normal Claude Code permissions.
3. Re-imports the folder, writes `placements.txt` (or `placements.generated.txt` when the existing one was written by
   hand) and `.job/assembly.json`.
4. `scripts/prproj_assemble.py` writes `<clip>_graphics.prproj` (+ XML fallback). The source .prproj is only read.

Older folders: if graphics already sit on V3 under other paths (for example from `final/`), assembly refuses with
"items overlap"; open the `_graphics` copy only after moving those, or set `track` in job.json to an empty track.
