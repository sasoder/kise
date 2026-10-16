# Sporttouchen style

Follow CRAFT.md. This file holds only what is specific to Sporttouchen (sporttouchen.nu), a Swedish sports media
channel that publishes TikTok-first.

When a job says "sporttouchen style", build to this without re-asking. Any copy is in Swedish.

## Look

| Token | Value | Use |
|---|---|---|
| INK | `#FFFFFF` | all type and line work |
| GRADIENT | `linear-gradient(90deg, #A300AF, #520EF1)` | the one brand colour, magenta to violet, left to right (as on their buttons and round logo) |
| BG | `#0B0A12` | the opaque background |
| GLOW | `radial-gradient(900px 900px at 540px 1400px, rgba(82,14,241,0.18) 0%, rgba(82,14,241,0) 70%)` | the only glow, in the opaque render only |
| TRACK | `#FFFFFF` at 0.12 on BG, 0.20 on a card body | rests, tracks, empty states |
| STROKE | `#000000` under white ink, `#FFFFFF` under a gradient fill | outside stroke on big type |

- No other colours, glows, blur or blend modes.
- Rectangles get 12 px corners. An element thinner than 12 px gets a radius of half its height (an 8 px track gets 4).
- Logo: `public/sporttouchen-logo.png`, drawn as a 200 px disc (50 % radius). Untinted, with no ring, shadow or
  stroke. Never paint over it.

## Type

- The font is MADE Tommy Soft: `public/MADETommySoft-ExtraBold.otf` (800, display) and
  `public/MADETommySoft-Medium.otf` (500, labels).
- Load it with `@remotion/fonts` `loadFont` + `staticFile` at module scope, with no fallback stack. Copy the block at
  the top of `generated/components/SporttouchenTimer.tsx`.
- Not Montserrat, which is only the website's fallback.
- Display type: ExtraBold, tracking -0.02em with a compensating `marginRight`. The timer's hero numeral is 400 px. The
  quiz question is 66 px, line-height 1.1, centred.
- Labels: Medium 40 px, uppercase, tracking 0.22em with a compensating negative `marginRight`.
- No label under a hero element. The numeral stands alone.

## Stroked type

- Every big numeral or word carries a 4 px outside stroke at 1080 wide. Draw a back copy with `color: transparent` and
  a centred 8 px text stroke, then the fill copy on top in the same masked box. Only the outer 4 px of the stroke
  shows.
- Never put `-webkit-text-stroke` on the fill glyph itself. It eats half the letterform.
- Both copies share one wrapper (same metrics, same slide, same opacity), so they cannot separate mid-motion.
- The stroke colour follows the glyph's own state: black under white ink, white when the fill is the gradient.
- No stroke on small labels on solid gradient, on tracks, or on the logo.

## Motion

- Time is linear: a ring drains clockwise from 12 o'clock with no easing.
- A glyph changes by an 8-frame masked swap:
  - the outgoing glyph slides up 130 px and is gone by frame 3 (`Easing.in(Easing.quad)`);
  - the incoming glyph rises from +130 px over frames 2–8 (`Easing.out(Easing.quad)`);
  - both are masked to the element, so no frame shows two half-lit glyphs.
- One pop per tick: 1 → 1.03 → 1 over the swap. The last three ticks pop to 1.06 and take the gradient fill.
- The payoff is one thin ring (stroke 6) that expands and fades (ink 0.6 → 0). It stops before it reaches the frame
  edge. A dead hold follows.
- Where something talks, keep the hold alive: the quiz waveform keeps speaking to the last frame, so any trim lands
  on a live frame.
- Enter by sliding up while fading in, or from behind a mask. Do not copy the exemplars' 0.92 → 1 scale-in.

## Renders

- Render twice every time from the same component: opaque (BG + GLOW) and a transparent overlay (`transparent: true`).
- Judge the overlay's stroke over mid-grey (SporttouchenQuiz `backdrop: 'grey'`), not over the dark background.
- FPS = the sequence's rate; with no sequence, 30 (the exemplars' rate).
- The layout is a phone-first centred column on x 540. Centre the hero per CRAFT.md (y ≈ 960), not at the exemplars'
  y 880.

## Exemplars

- `generated/components/SporttouchenTimer.tsx`: a 15 s countdown. A gradient ring (outer diameter 720, stroke 36,
  INK track at 0.12) drains while the stroked numeral swaps each second, and the payoff ring closes it. Props:
  `seconds`, `transparent`, `label` (keep it empty), stroke colours.
- `generated/components/SporttouchenQuiz.tsx`: the "Quizkortet" question card, 920 px wide at x 80–1000. It has a
  112 px gradient header band ("FRÅGA n / 3", unstroked), a BG body with the stroked question, and a progress track.
  The round logo sits 45 px above the card and talks into a 13-bar white waveform on each side. Props: `questions`,
  `index`, `total`, `transparent`, `backdrop`, `logoSrc`.
