---
name: kise-creative-direction
description: Turn broad or non-technical requests into coherent creative direction for Remotion videos and motion graphics. Use when interpreting a visual brief, choosing an art direction, composing a vertical short, defining motion language and pacing, or reviewing whether a rendered piece feels intentional.
---

# Kise Creative Direction

Translate the request into decisions, then build. Keep the working direction in
short comments or constants beside the scene; do not make the user fill out a brief.
Explicit requests and applicable approved styles in `MEMORY.md` take precedence
over these defaults.

## Choose a visual language

Before animating, decide what changes and why the viewer should care. Prefer a
visible mechanism (gather, divide, align, pass, grow, resolve) to decorating a caption.
For clean, satisfying graphics, start with a restrained palette, generous negative
space, and a small family of shapes. Add texture, depth, or expressive type when the
brief calls for it; minimal does not have to mean the same look every time.

Define the few choices that must stay consistent:

- **Meaning:** what each shape, colour, and state represents. Keep the same meaning
  across cuts; do not turn a person into a different symbol without showing why.
- **Form:** palette roles, stroke weights, corner treatment, spacing unit, and type
  hierarchy if text is needed. Derive repeated geometry from a shared unit.
- **Motion:** travel and settling character, stagger cadence, and camera behaviour.
  Choose a restrained default; accent motion is a deliberate exception.
- **Framing:** focal area, caption clearance, background, and end behaviour (hold,
  cut, or loop). A continuing subject should retain its position at the next cut.

For related scenes, import the same small style/motion object from a sibling module
rather than copying constants. Keep geometry scene-specific. Reuse an approved
system when it fits; do not build a theme engine for a single scene.

## Choreograph beats

Name the meaningful moments in a `beats` object and use them in the animation.
A beat describes a visible change, not just “scene 2 starts.” For each beat choose
one focal action, its cause, and the resolved state the viewer needs time to read.

- With a transcript, map the actual words to local frames and record the source
  timecodes. Land on the phrase; anticipation may start earlier. Never invent cues.
- Without timing cues, budget setup → action → settle/read. Adjust the balance to
  the amount of information; do not distribute everything evenly by habit.
- Use one progress value for coupled events: an arrival drives its highlight, a
  growing edge drives its label, a transfer drives both sender and receiver.
- Design start and end poses before filling in the motion. Preserve object identity
  through transformations; avoid resetting the canvas for every sentence.
- Stagger by reading order or physical cause. Identical delays everywhere can feel
  mechanical. Let a group finish settling before the next competing action.

## Apply animation principles selectively

These seven practical lenses adapt traditional animation principles to motion
graphics; they are not a requirement to add seven effects to every scene.

| Lens                       | Use it for                                                           | Restraint for clean graphics                                             |
| -------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Staging                    | One clear subject per beat; dim context before adding detail         | Remove competing motion before adding emphasis                           |
| Anticipation               | A small pullback, compression, or pause prepares a meaningful action | Skip it when it delays a transcript cue                                  |
| Timing and spacing         | Acceleration, purposeful travel, and readable holds create weight    | Use linear speed for constant flow, not for every entrance               |
| Arcs                       | Shallow curved paths connect origins and destinations                | Keep measurement axes and mechanical motion straight                     |
| Follow-through and overlap | A follower or secondary part settles after the main mass             | One small settle is often enough; avoid perpetual wobble                 |
| Squash and stretch         | A restrained response makes impact or transfer tactile               | Preserve area/volume; keep text, logos, and data legible and undistorted |
| Secondary action           | A tip, ripple, or brief state change confirms the primary event      | Keep it causally linked and quieter than the subject                     |

Use exaggeration and appeal through silhouette, contrast, and timing when useful.
Bounce, glow, particles, blur, and camera movement are choices, not a polish checklist.
The satisfying moment should come from a relationship becoming clear or resolving.

## Implement without timing drift

- Evaluate each frame independently. Use frame-driven Remotion APIs, deterministic
  per-element variation, and no wall clock, unseeded randomness, or CSS animations.
- Define reusable durations in seconds and convert with the composition fps. Keep
  transcript cues as explicit local frames. Inside a `Sequence`, account for its
  local frame origin rather than mixing global and local time.
- Use shared easing/spring settings for related objects. Bound opacity and reveals;
  allow overshoot only on properties where it makes physical sense.
- Author camera keys around the composition. Do not blindly chase a moving subject
  or keep the camera moving while the viewer needs to read a fine change.
- For loops, match position and velocity across the seam. Do not duplicate the
  first frame at the end, which creates a pause on every repeat.

## Review the result

Use the review command in `AGENTS.md`. Supply important beat frames with `--at` so
fast arrivals, handoffs, and cuts are sampled before, on, and after the event.
A contact sheet checks composition; it cannot establish whether motion feels good.
Watch the preview at normal speed and inspect a short frame range if something snaps.
If playback cannot be inspected with the available tools, disclose that limitation.

Check these in order, fixing the earliest failing layer first:

1. **Meaning:** is the change understandable without an explanation? Are quantities,
   direction, and visual metaphors truthful?
2. **Staging:** one focal action, comfortable mobile margins, legible type and marks,
   sufficient contrast on the intended background, no unintended collisions.
3. **Continuity:** stable shape/colour meanings, connected paths, consistent camera
   and settling, intentional first/last poses. For a series, compare adjacent cuts.
4. **Rhythm:** preparation → action → readable resolution; no dead wait, abrupt
   velocity change, competing peaks, or loop hitch.
5. **Finish:** clean edges, consistent strokes, subtle secondary action. Remove any
   flourish that weakens the previous four layers.

Name concrete defects and fix them. A successful encode or attractive still is not
creative approval, and a checklist should not become an automatic quality score.
