# CRAFT

The craft rules for every graphic built in kise, in every style. A style file (`styles/<style>.md`) adds its look,
kit and visual language on top of this file. On anything cross-style, this file wins. Quotes are the user's words.
Numbers marked *hint* are starting points that worked once, not thresholds (principle 9).

## Principles

1. **The words guide one continuous motion.** "Continuous motion, and the words kind of guide it. You still should
   remember that we are making the graphics to something that's being said." Following every beat "has just led to
   overcomplicating things and forcing animations where they're not really necessary."
2. **Something is always happening, and the graphic has one job.** "Ideally something always should be happening,
   otherwise we wouldn't make a graphic for that part." "Extra little animations are fine"; the failure is a graphic
   "trying to fill too many purposes and do too many things at the same time". The skill is balance.
3. **The camera guides the eye.** Focus near the centre, moves and zooms through quiet stretches, no fixed count of moves.
4. **Animate, do not type it out.** The picture carries the idea; text only identifies. "I also don't want you to take
   this no text literally, because obviously sometimes text is needed … I just don't want you to completely rely on text."
5. **Icons and props are allowed.** "Sometimes you can't visualize something with just abstract animation … you should
   not ban this." Any drawing style, "as long as you're able to make icons that are consistent with the weight of all
   the other things in the graphic".
6. **Dots or shapes.** Dots for AI agents and crowds; "sometimes dots might be too abstract and more detailed stuff will
   be necessary".
7. **Framing.** "The most of the interesting animation stuff should be happening in the middle, but it should not be
   limited to the middle … the captions, which I will add myself, will just sit maybe one or two centimeters below the
   middle."
8. **A new concept per segment, unless the line returns to the same thing.** "Try to make different concepts for stuff
   all the time" … "if it's a graph … the graph should obviously then be used." The style is shared; pictures are not.
9. **No numeric thresholds as rules.** "I'm not sure if thresholds are necessary … it just causes confusion."
10. **Weak segments still get built.** "Some lines obviously will animate worse … but you should still generate it and
    then maybe I will just disable it in the next pass." Build the best version and say so in the hand-off.
11. **The idea finishes inside its slot.** The main action starts early, the payoff lands before the cut back to the
    speaker, and the last frame is a settled, living picture.
12. **Opaque full frame by default.** A transparent overlay only when one is asked for.
13. **Real logos, redrawn to fit the style.** "If we're talking about a sports team … we should use that logo, but the
    logo should be remade to fit the style." Not a pasted full-colour logo, not a generic stand-in.
14. **Colour follows the style's own palette.** A style may carry several colours, each with its own meaning.
15. **Frame rate matches the Premiere sequence** (often 23.976).

## The picture

- The brief gives a **Check line**: what can the viewer say after this cut that they could not say before? Put it in the
  header comment and build so a viewer with the sound off can say it. A picture that only restates the words is not ready.
- **If the line names a real artefact** (a message, an email, a report, a listing, a chart, a map, a specific person),
  draw that artefact recognisably and animate it doing what it does: typed, sent, landing, ranked. The viewer should
  recognise it in the first half second.
- **Otherwise show one mechanism**, built from what the speaker actually means (look up the real referent of a charged
  or opinion line) and drawn in the style's vocabulary. A metaphor that has to be decoded loses the viewer.
- One thought is one graphic, even when it spans two disabled clips.
- Few element types, one motion; answer "too abstract" with a clearer picture, not more kinds of things. Reference:
  `generated/components/CityStates.tsx` (map, orange land, walls; one push-in).
- One material that changes shape beats several overlapping containers; spent containers leave the frame physically.
  The start state must not resemble the end state: the change is the payoff.
- A comparison's payoff frame keeps the other side in shot, dimmed: "few from many" needs the many still there.
- Ask what else each shape reads as: a plumb shaft crossed by straight levels is a cross, a fan of dots under a mark is a
  Christmas tree, a lens opened as a wedge is a Pac-Man. Redraw whatever reads as the wrong object.
- Beauty is part of the job: few elements, negative space, precise alignment, one weight. First passes over-animate; cut
  whatever does not serve the one job (flashes, pulses, ripples, rims, breathing glyphs, boxes that stretch).
- The subject separates from its ground in value (a cream army on cream walls makes a grey frame). Recede the context,
  by the style's own dim, before a new layer arrives on top of it.
- Orange or amber never sits on a black or near-black ground: a dark ground is visibly brown (about L* 20 at the
  subject, 12+ in the darkest corner), its shadows and casings deep brown. No dark type in an orange box by a light word.
- Pacing reference: `generated/components/AllAdultMales.tsx`, "something is always happening while still being simple
  and it looks satisfying": one transformation sweeping through many figures under a continuous pull-back.

## Framing

- The main focus sits at the true middle of the frame (y ≈ 960 of 1920). Action may range beyond it.
- **Caption bands.** Keep readable elements and important detail out of **y 1080–1250** and **y 1360–1460** of 1920
  (y 1270–1340 between them is tight; at another frame height keep the same proportions clear). A name tag is the one
  exception: it sits where `styles/name-tags.md` puts it. Check the bands along the whole camera path, not only at
  rest: derive the vertical framing from the zoom so a pull-back cannot carry the subject into a band.
- Use the frame. Build to the stated fill; first passes come out too small. One centred column, never everything parked
  to one side or at an edge. Fix emptiness with scale (push in on a lone subject), not with more objects. In 9:16 the
  height binds: solve a wide's zoom from the world's height; a shallow diagonal layout makes the wides tiny.
- An inset over a picture (an article, a photo, a card) keeps clear padding around it (*hint*: about 70 % of frame width).

## Motion and camera

- Decide the camera per cut from where the eye should be and where the content goes quiet. Move or zoom where the
  content is quiet, stay calmer where it is busy, so movement is balanced across the whole cut. Keep the focus near the
  centre as a tendency; never pin the subject rigidly to it.
- Move in on whoever or whatever the line is about; a static wide tableau reads slow. Open on one place, then reveal; an
  opening that shows everything at once overwhelms.
- First passes open empty and gesture small. Run the main move from f0, frame what exists (never hold space for a
  later arrival), space scenes so no frame of a pan is empty, and make the key gesture big enough to read on a phone.
- The payoff stays big: no closing pull-back that shrinks it to specks (let the passed trail leave frame). A pull-back
  also cancels visible growth unless the growth outpaces it.
- Pans are smooth and controlled: no whips, and no motion blur unless a style file's recipe calls for it (the still pan
  with a logo, a core-memory fast pan with `blurX`). Slow everything down in close-ups.
- No hold-move-hold (opaque cuts): a slow drift runs between moves; two same-way moves with a short dwell become one.
- A drawn object travels in the direction it points. Things that march or sail move at constant speed; ease only where a
  real thing would slow. Walkers climb a stair or a straight lift, never through air; arriving rows travel as one
  block, so nothing passes over a seated item.
- An opaque cut holds its resolved picture alive to the last frame (a creep, ambient life); a transparent overlay ends
  on a static hold. A style file may say otherwise. Nothing fades out at the end: the editor cuts.

## Words and motion

- One continuous motion per cut; the words inflect it. The words do not each get their own gesture.
- Beat frames come from the word table in the brief. A landing may settle a few frames before its word, never after it.
  Several fast changes in a row read as flicker: space them or merge them into one change.
- Back-to-back cuts on the same picture join pixel for pixel: the later cut opens on the earlier cut's last frame.

## Text

- Design the cut as if it had no text, then add only the labels the viewer needs to know what they are looking at (a
  place, a name, a real figure, a unit, the real years of a timeline). Test: does it still work with every word deleted?
- Never typeset the spoken line, a quote placard or jargon labels, and never let a label do the explaining. Text that
  belongs to a real artefact (the message being typed, the report's real headline) is the artefact, not a label.
- No label for what the picture already identifies (an icon that reads, a figure whose colour and costume say who). A
  place the speaker names on a map gets its label on the word. A label that tells two similar things apart stays.
- Text enters by sliding up while fading in, or by another entrance that suits the graphic better; it never pops on.
- Put text where the camera lands, readable in a settled frame; text along a pan is unreadable. Text lives in world
  space and moves with the camera: no screen-fixed titles or badges. Font and type scale come from the style file.

## Icons, props, logos

- Reach for an icon or prop when abstraction cannot show the thing. Match the weight of everything else: one family per
  graphic, no mix of icon packs, no thin outlines among solid shapes. Icon geometry (Lucide, or the style's own set) is
  inlined as `<path>`. Never draw an icon on by stroke-dash: it scatters into specks.
- A thing named in the line (a company, a document, money, one specific person) gets a recognisable shape; a population
  gets the style's crowd unit (dots by default; pegs or busts in Cheeky Pint, engraved figures in map style). Crowds
  arrive from a source, hold the style's formation or field and keep a minimum spacing; no free random scatter.
- Logos: the real mark, redrawn into the style's colours and materials, sized and anchored to its subject in world space.
  Vector marks are inline `<path>` geometry (`generated/components/brandGlyphs.tsx`); team crests come from the
  Wikipedia infobox logo. Whiten a mark through its fill; `brightness(0) invert(1)` turns anything with interior detail
  or a face into a blob.

## Entrances, exits, state changes

- **No object fades in or scales in from nothing.** Things come from something: out from behind an occluder, off a
  frame edge, out of a source object, drawn by a moving tip; at full size and full opacity. Text and an overlay's panel
  or sheet may slide up while fading in; a style file may name its own entrance (Humble, the still-pan logo pop).
- Exits are just as motivated: leave the frame, go behind or into something, drain into the style's dim tone. Nothing is
  left behind as a ghost. Off-frame subjects stay fully off until revealed; a sliver at the frame edge steals the eye.
- **Cause before effect.** Whatever knocks, plants, pushes or pours is touching on the frame it acts; write the contact
  frame and the first reaction frame in the header comment. Every change shows its cause: a change with no visible
  cause reads as an animation reset.
- One eased timeline per change of state, timed in frames. A glyph swap is a crossfade (*hint*: ~14 frames), not an
  un-draw then a draw. A counter that changes unit ($900M → $1B) decelerates: hold the last old value, then a slow swap.
- Derive state from the visible thing (a bar lights when the wavefront reaches it), never from a parallel timer.
- Objects in a world (a map, a page, a field) live in world space at world scale and share the camera transform; no
  separately scaled sticker symbols.

## Charts

- Real, sourced figures only, each value verified rather than recalled, with the source in the header comment.
  Estimates and invented data never go on screen unless the user asks for an estimate (then it carries a tilde, ~$5M,
  and is flagged). If the speaker's number is wrong, keep numbers off screen and flag it in the hand-off.
- Sparse: one centred column with a small title, one big readout, one line or bar set and the style's accent. No y-axis
  gridlines, month ticks, event markers or explanatory captions unless the line names them.
- When the series is a proxy for the speaker's general claim, draw the shape unlabelled (source in the header comment);
  only the years stay on screen. A linear axis cannot carry hours against years: say so rather than fake it.
- Plot only the sourced points, with no interpolated curve between them. Encode a quantity twice where you can (a
  longer bar and a slower draw). Foreign-currency figures convert at each year's average rate, stated in the header.

## Format

- **1080x1920** unless the user literally asks for 16:9. A 16:9 sequence, 16:9 footage or a 16:9 backdrop is not a
  request; use the backdrop's 1080x1920 sibling. A YouTube trailer project (`trailer_*` with a 16:9 sequence) is built
  at 16:9: compose 2048x1080 and render `--scale 2` for a 4096x2160 sequence. A client style file that says to match
  the sequence (`styles/lovable.md`) overrides this and the caption bands.
- **Frame rate = the Premiere sequence.** 23.976 is `fps={24000 / 1001}`; word frames and durations at that rate.
- **Opaque** full frame by default. Transparent ProRes 4444 with alpha only when an overlay is asked for (name tags,
  calls to action, icon loops, Humble, Sporttouchen's second render); an overlay keeps a static camera, crops nothing
  and leaves the outer edge of the frame empty so the editor can move and scale it.

## Build technique

- **Camera.** A coarse keyed track of its own through the kit's damped follow (`runCamera`, `CAM_STIFF` 0.09 /
  `CAM_DAMP` 0.468 in `generated/components/fieldShared.tsx`; other kits have their own), never derived from the
  subject's position (it bobs). A pull-back is another key on the same track. Diagnose with a k / dk / d²k plot: one
  deceleration lobe, one settle lobe. Keys too close read as a stall; a push too small to read, as a hesitation.
- **Full precision.** Never round scale or position under a moving camera: slow zooms step.
- **Strobing** (*hints*). What is fine wide strobes zoomed in: slow lines and thin ambient traffic as the zoom rises
  (once: under ~45 screen px per frame at 2x). A fast pan over a static page: backdrop and added elements in world
  space, only grain in screen space (once: pans under ~26 px per frame).
- **Bitmaps inside an SVG.** `<image href={staticFile(...)}>` races frame capture and drops on scattered frames. Inline
  the bitmap as a `data:image/png;base64,...` string exported from `generated/components/<name>Data.ts` (pattern:
  `generated/components/bronzeData.ts`) and verify with a per-frame pixel count of its region. Bitmaps outside the SVG
  use Remotion `<Img>`.
- **Heavy static geometry** (maps, thousands of paths, big textures): bake it to rasters once, animate only the
  overlays, measure ms per frame, and run final renders with `--concurrency=4`.
- **Graphics built from real footage** (freeze frames, punch-ins): render with `--color-space=bt709`, extract the
  frame PNGs untagged, and check a 1x1 average of render and source:
  ```
  ffmpeg -i src.mp4 -vf "...,format=rgb24,setparams=color_primaries=unknown:color_trc=unknown:colorspace=unknown" f%04d.png
  ffmpeg -i x -vf "scale=in_color_matrix=bt709,format=rgb24,scale=1:1:flags=area" -f rawvideo - | xxd -p
  ```
- **Joined cuts** (the same picture back to back): import the earlier cut's constants, assert them at module load, and
  prove the join with a still-vs-still difference image.
- Fonts, final-render flags (`--muted`, the ffprobe check) and stopping a render by exact PID: AGENTS.md.

## Checks before hand-off

- Every-frame sheets (cropped, labelled) of each entrance, exit and hand-off and of each moving object's whole travel;
  a spaced strip shows states, not motion. Frames scaled to 270 px wide for phone legibility; contrast measured on
  rendered pixels, not by eye; the caption bands on every camera state; the shape-reading question on every shape.
- Sheets get gutters (butted frames read as a render bug). Judge framing and scale on a full-size still, never a contact sheet.
- Dead stretches (frame-to-frame difference): `ffmpeg -v error -i preview.mp4 -vf "tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null - 2>/dev/null | grep YAVG`
