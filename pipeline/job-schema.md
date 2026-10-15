# job.json — the shared contract (v1, 2026-10-10)

Owner: the "Map the motion graphics pipeline" thread. Other threads read and write job.json but propose schema
changes to the owner instead of adding fields on their own. Unknown fields must be kept when a tool rewrites the file.

## Where it lives

One `job.json` per polished clip folder, beside its `.prproj`:
`/Users/tom/Documents/tom fant/<client>/<month>/<episode or project>/<clip>/job.json`.
Paths inside it are relative to that folder unless they start with `/`.

## Who writes what

| Field | Written by | Read by |
| --- | --- | --- |
| `source`, `sequence`, `srt` | pipeline runner (kickoff) or FilmCraft cut step | everyone |
| `graphics[]` plan fields (name, in, out, line, style) | kise director | builders, board, timeline export |
| `graphics[].status` / `version` / `file` | kise runner (planned, drafting, ready for review) and the board (approved, needs fix) | everyone |
| `graphics[].note` | the board (your feedback) | kise runner, which builds the next version |
| `images[]` | image-finding step | board, timeline export |
| `status` (whole clip) | derived by the runner, never set by hand | board |

Tool: `kise/pipeline/job.py` (import, status, set, placements, assembly, run). `job.py import` builds job.json
for an existing clip folder from its .mov files, placements.txt and last assembly JSON; items whose in-point had to
be guessed from the file name carry `"in_guessed": true`.

Writers re-read the file just before writing, change only their own fields, and write atomically (temp file + rename).

## Statuses

Per graphic or image: `planned` → `drafting` → `ready for review` → `approved`, or `needs fix` (goes back to
`drafting` with `version` + 1). `dropped` = rendered but no longer on the timeline. Whole clip `status`: `raw`, `cut`, `graphics`, `ready for review`
(every item ready or approved), `approved` (every item approved), `rendered`, `delivered`.

## Shape

```json
{
  "schema": 1,
  "client": "dwarkesh podcast",
  "clip": "Noam_Alignment",
  "status": "ready for review",
  "source": { "file": "Noam_Alignment.mov", "fps": 23.976, "width": 1920, "height": 1080 },
  "sequence": { "prproj": "Noam_Alignment.prproj", "name": null },
  "srt": "Noam_Alignment.srt",
  "style": "Orange Dwarkesh",
  "graphics": [
    {
      "id": "g27",
      "name": "HonestyGoesUp",
      "in": 27.82, "out": 35.028,
      "line": "honesty goes up, instruction following goes up … more honesty out of these models",
      "style": "Orange Dwarkesh",
      "version": 2,
      "file": "27_HonestyGoesUp.mov",
      "status": "ready for review",
      "note": null,
      "track": 2, "xfade_in": 0, "xfade_out": 0,
      "preview": "graphics/review/27_HonestyGoesUp-contact-sheet.jpg",
      "preview_video": "graphics/review/27_HonestyGoesUp_V2-proxy.mp4",
      "on_timeline": true,
      "log": [{ "at": "2026-10-10T08:01:00", "by": "tomm", "version": 1, "status": "needs fix", "note": "too cluttered" }],
      "history": [{ "version": 1, "file": "old/27_HonestyGoesUp_V1.mov", "note": "too cluttered" }]
    }
  ],
  "images": [
    {
      "id": "i0",
      "file": "images/0.0_OtherNativeForces_RugendasMapucheMalon.jpg",
      "in": 0.0, "out": 1.8,
      "focus": [0.46, 0.5],
      "scale": [70.239, 70.239], "pos": [[0.5832, 0.5], [0.5832, 0.5]], "ease": false,
      "xfade_in": 0, "xfade_out": 0, "track": 1,
      "status": "approved", "note": "Rugendas, 'El rapto (El malon)'"
    }
  ],
  "broll": []
}
```

Rules:
- Times are seconds on the clip's sequence timeline, snapped to `sequence.fps` frames by whoever renders or exports.
- `file` always names the current version under its original name (Premiere relinks); older versions move to `old/`
  and are listed in `history`.
- `id` is stable for the life of the item; the board keys approvals and notes on it.
- `track`, `xfade_*`, `scale`, `pos`, `ease`, `src_in` mean exactly what they mean in
  `kise/scripts/prproj_assemble.py`, so an assembly JSON is a straight projection of job.json.

## The .prproj wins over job.json for timing

Hand edits in Premiere (trims, ripple deletes, a graphic placed by hand) are read back with `job.py sync`, which
`import` and `run` also do first. It reads the newest of `<clip>.prproj` and `<clip>_graphics.prproj` and, for every
enabled item on V2 and up: updates `in`, `out`, `track` (and `media_in` when the head was trimmed) of the graphic or
image with that name; adds graphics that exist only on the timeline (status `ready for review`); sets
`on_timeline: false` on items no longer there. `synced` records which file and when. `sequence.timebase` is
Premiere's ticks per frame.

Extra item fields: `preview_video` (per-version proxy mp4 for the board, optional), `on_timeline`, `media_in`,
`log` (append-only; every status or note change with `at`, `by`, `version`). Writers that act on a board click
reject it when the clicked `version` is not the current `version`.

Every save also regenerates `.job/timeline.json` with `job_timeline.py` (format owned by the editor clones thread).

## Derived files (generated, never edited by hand)

- `placements.txt`: one line per graphic, `<file> | <in> | "<line>"` plus its note, for humans and the editor.
- `assembly.json`: input for `prproj_assemble.py` (`graphics`, `images`, `broll` sections from the items above,
  every item with a rendered file, i.e. all but `planned` and `dropped`; a graphic waiting on a fix keeps its current
  version on the timeline).
- Timeline export (FilmCraft / Premiere XML): owned by the "Open source editor clones" thread, built from the same fields.
