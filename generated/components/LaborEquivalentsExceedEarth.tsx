import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:30.940 -> 00:00:37.619 of the source cut: "it doesn't take many more
// years before each company individually has more labor equivalents than there
// are people on earth".
export const DURATION = 200;

const W = 1080;
const H = 1920;
const CX = 540;

// The lattice is inherited verbatim from the clip before this one: 25 columns
// at a 30px pitch, one dot per ten million people, so 25 x 32 = 800 dots is
// eight billion and the container is the world. That clip resolved with the
// field an eighth full and deliberately left the headroom unexplained. This is
// the line that spends it, so the lattice is extended to 64 rows while only the
// bottom 32 remain the world. Everything above the rim is surplus.
const COLS = 25;
const WORLD_ROWS = 32;
const ROWS = 64;
const PITCH = 30;
const WORLD = COLS * WORLD_ROWS; // 800 dots = every person alive
const FIELD_W = COLS * PITCH; // 750
const X0 = CX - FIELD_W / 2; // 165
const X1 = X0 + FIELD_W; // 915
const Y1 = 1480; // the floor, unchanged from the previous clip
const Y0 = Y1 - WORLD_ROWS * PITCH; // 520, the rim

// The mass is never allowed above this line. When it would be, the diagram
// pulls back instead — so the world is seen to shrink under a fixed ceiling
// rather than the tower quietly running out of canvas. The pull-back is
// computed from the mass itself, so the zoom cannot drift from the count.
const CEIL = 330;
const HEADROOM = Y1 - CEIL; // 1150
// Where the pull-back settles: the scale at which the finished mass, twice the
// world, stands exactly from the floor to the ceiling.
const FINAL_ZOOM = HEADROOM / (ROWS * PITCH);

// Where the previous clip left the count: a billion laborers, four rows deep.
const START = 100;
// Four more years, each a doubling: 1 -> 2 -> 4 -> 8 -> 16 billion. The third
// of them lands exactly on the rim, and that exactness is the only reason the
// fourth reads as "more than" rather than "a lot". The steps also shorten in
// dots-per-frame terms only by getting faster — 6.3, 8.3, 11.8, 19 dots per
// frame — so the doubling is encoded twice: more dots, arriving quicker.
const YEARS = [200, 400, 800, 1600];
const DURS = [16, 24, 34, 42];
// Width of the lighting wavefront, in dots. It grows with the step so a year
// that adds eight hundred dots arrives as a surge, not a queue.
const RAMPS = [10, 18, 34, 64];

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const rgbOf = (hex: string) => {
  const h = hex.replace('#', '');
  const n =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
};

const LIT = 1.15;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// Half-pixel edges with an odd stroke, or identical rules antialias anywhere
// between 4% and 13% alpha and the field shimmers.
const snap = (v: number) => Math.round(v) + 0.5;

type Cell = {x: number; y: number; d: number; p1: number; p2: number};

// Built once. Index order is fill order — rows from the floor up, and within a
// row cells alternate outward from the centre column, so a part-filled row is a
// centred mesa rather than a stub in a corner.
const CELLS: Cell[] = [];
{
  const worldH = WORLD_ROWS * PITCH;
  const worldCy = Y1 - worldH / 2;
  const half = Math.hypot(FIELD_W, worldH) / 2;
  for (let row = 0; row < ROWS; row++) {
    const y = Y1 - (row + 0.5) * PITCH;
    for (let s = 0; s < COLS; s++) {
      const col = (COLS - 1) / 2 + Math.ceil(s / 2) * (s % 2 === 1 ? 1 : -1);
      const x = X0 + (col + 0.5) * PITCH;
      const i = CELLS.length;
      CELLS.push({
        x,
        y,
        d: Math.hypot(x - CX, y - worldCy) / half,
        p1: hash(i, 1) * Math.PI * 2,
        p2: hash(i, 11) * Math.PI * 2,
      });
    }
  }
}

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  fieldOpacity: z.number().min(0).max(1),
  boundsOpacity: z.number().min(0).max(1),
  rimOpacity: z.number().min(0).max(1),
  dotOpacity: z.number().min(0).max(1),
  levelOpacity: z.number().min(0).max(1),
  ghostOpacity: z.number().min(0).max(1),
  // The globe rides inside the container at diagram scale, so the label
  // shrinks with the thing it is labelling and never floats free of it.
  earthIcon: z.string(),
  earthSize: z.number().min(80).max(700),
  earthOpacity: z.number().min(0).max(1),
  earthSettledOpacity: z.number().min(0).max(1),
  yearSize: z.number().min(20).max(120),
  yearTop: z.number().min(0).max(1900),
  yearOpacity: z.number().min(0).max(1),
  // One year per state of the count, starting with the billion the previous
  // clip resolved on. Index 0 is showing when this clip opens; each doubling
  // rolls the next one into the same spot.
  years: z.array(z.number().int()).min(2),
  strokeWidth: z.number().min(1).max(9),
  wallWidth: z.number().min(1).max(12),
  levelWidth: z.number().min(1).max(9),
  rimWidth: z.number().min(1).max(9),
  // How far the counted world recedes once the mass starts arriving above it.
  settledOpacity: z.number().min(0).max(1),
  driftAmp: z.number().min(0).max(20),
  // How far, in screen pixels, the two other companies stand out from behind
  // the one being counted.
  ghostOffset: z.number().min(0).max(160),
  marks: z.array(
    z.object({name: z.string(), cx: z.number(), aspect: z.number(), delay: z.number().int()}),
  ),
  markSize: z.number().min(40).max(240),
  markCy: z.number().min(0).max(600),
  markOpacity: z.number().min(0).max(1),
  // Beat frames from the SRT at 30fps, relative to 00:00:30.940:
  //   0 "it doesn't" · 7 "take many" · 17 "more years" · 35 "before each"
  //   58 "company" · 68 "individually" · 80 "has more labor" · 130 "equivalents"
  //   151 "than there" · 169 "are people" · 182 "on earth"
  beats: z.object({
    resume: z.number().int(),
    year4: z.number().int(),
    year5: z.number().int(),
    company: z.number().int(),
    individually: z.number().int(),
    year6: z.number().int(),
    pull: z.number().int(),
    year7: z.number().int(),
  }),
});

export type LaborEquivalentsExceedEarthProps = z.infer<typeof schema>;

export const defaultProps: LaborEquivalentsExceedEarthProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  fieldOpacity: 0.16,
  boundsOpacity: 0.3,
  rimOpacity: 0.88,
  dotOpacity: 0.92,
  levelOpacity: 0.9,
  ghostOpacity: 0.62,
  earthIcon: 'earth-globe.png',
  earthSize: 392,
  earthOpacity: 0.17,
  earthSettledOpacity: 0.32,
  yearSize: 58,
  yearTop: 1544,
  yearOpacity: 0.9,
  years: [2029, 2030, 2031, 2032, 2033],
  strokeWidth: 3,
  wallWidth: 8,
  levelWidth: 5,
  rimWidth: 5,
  settledOpacity: 0.46,
  driftAmp: 1.6,
  ghostOffset: 46,
  // OpenAI is inherited from the previous clip, so it opens centred at the size
  // that clip left it and only steps aside to make room for the second lab.
  marks: [
    {name: 'anthropic-logo.png', cx: 467, aspect: 1, delay: 8},
    {name: 'openai-logo.png', cx: 613, aspect: 1, delay: 0},
  ],
  markSize: 92,
  markCy: 209,
  markOpacity: 0.82,
  beats: {
    resume: 0,
    year4: 17,
    year5: 35,
    company: 58,
    individually: 68,
    // Pulled two frames ahead of "has more labor" so the surge to parity is
    // already moving on the word rather than starting on it.
    year6: 78,
    // The container is full at 112. He then pauses for a second and a half
    // before "equivalents", which is the only place a move this big fits.
    pull: 114,
    year7: 151,
  },
});

const LaborEquivalentsExceedEarth: React.FC<LaborEquivalentsExceedEarthProps> = ({
  ink,
  accent,
  shadow,
  fieldOpacity,
  boundsOpacity,
  rimOpacity,
  dotOpacity,
  levelOpacity,
  ghostOpacity,
  earthIcon,
  earthSize,
  earthOpacity,
  earthSettledOpacity,
  yearSize,
  yearTop,
  yearOpacity,
  years,
  strokeWidth,
  wallWidth,
  levelWidth,
  rimWidth,
  settledOpacity,
  driftAmp,
  ghostOffset,
  marks,
  markSize,
  markCy,
  markOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const [tr, tg, tb] = rgbOf(accent);
  const [ir, ig, ib] = rgbOf(ink);
  const steps = [beats.year4, beats.year5, beats.year6, beats.year7];

  const ease = (a: number, b: number) =>
    interpolate(frame, [a, b], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  // The picture is resumed rather than built: the previous clip's resolved
  // state sweeps back up in half a second and is fully present on "more years".
  const resume = ease(beats.resume + 4, beats.resume + 16);

  // A breath in before each year, so the jump has somewhere to come from.
  let pre = 1;
  for (const s of steps) {
    pre *= interpolate(frame, [s - 6, s - 1, s + 4], [1, 0.984, 1], {
      easing: Easing.inOut(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  // The live count. Seeded with the resume sweep so a single expression covers
  // both the arrival and every year after it.
  let from = 0;
  let to = START;
  let ramp = 8;
  let t = resume;
  for (let k = 0; k < steps.length; k++) {
    if (frame >= steps[k]) {
      from = k === 0 ? START : YEARS[k - 1];
      to = YEARS[k];
      ramp = RAMPS[k];
      t = interpolate(frame, [steps[k], steps[k] + DURS[k]], [0, 1], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
  }
  const count = from + (to - from) * t;
  // The wavefront overshoots by exactly one ramp so the last dot of a year is
  // fully lit when the count lands on it.
  const wf = from + (to + ramp - from) * t;

  // The pull-back, derived from the mass and nothing else: keep its top pinned
  // at the ceiling once it would pass, otherwise leave the diagram alone. Full
  // scale therefore survives all the way to parity — the world is at its
  // largest exactly when the field finishes filling it.
  const massTop = Y1 - (count / COLS) * PITCH;
  // Two things set the scale. `fit` is the hard invariant, read off the mass
  // itself: its top can never pass the ceiling, so the count and the framing
  // cannot drift apart however the beats are retimed. `pull` is the editorial
  // move — the container is full and nothing is moving, so the camera backs off
  // during the pause and makes the room the next year is going to need. Taking
  // the minimum means the pull-back is deliberate but the invariant still wins.
  const fit = HEADROOM / Math.max(1, Y1 - massTop);
  const pull = interpolate(frame, [beats.pull, beats.pull + 34], [1, FINAL_ZOOM], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const zoom = Math.min(1, fit, pull);
  const k = zoom * pre;
  const ghost = ease(beats.individually, beats.individually + 18);
  const off = ghostOffset * ghost;
  const sx = (x: number) => CX + (x - CX) * k;
  const sy = (y: number) => Y1 + (y - Y1) * k;

  // Everything about the rim is read off the count, so the emphasis cannot
  // drift from the fill: it comes up as the field spends its last fifth.
  const parity = clamp01((count - 620) / 180);
  // Once the world is full it stops being the news and becomes the baseline, so
  // it recedes and lets the surplus above it arrive at full strength.
  const spill = clamp01((count - WORLD) / 260);
  // One clear event on the crossing itself.
  const crossPulse = Math.sin(Math.PI * clamp01((count - 740) / 120));

  const levelPath = () => {
    const rowsF = count / COLS;
    const full = Math.floor(rowsF + 1e-9);
    const frac = Math.max(0, rowsF - full);
    const yMid = snap(sy(Y1 - full * PITCH));
    const yTop = snap(sy(Y1 - (full + 1) * PITCH));
    const halfW = (frac * COLS * PITCH) / 2;
    const xL = Math.round(sx(CX - halfW)) + 0.5;
    const xR = Math.round(sx(CX + halfW)) + 0.5;
    const parts: string[] = [];
    if (full >= 1) {
      parts.push(`M ${snap(sx(X0))} ${yMid} L ${xL} ${yMid}`);
      parts.push(`M ${xR} ${yMid} L ${snap(sx(X1))} ${yMid}`);
    }
    if (xR - xL >= 2) {
      parts.push(`M ${xL} ${yMid} L ${xL} ${yTop} L ${xR} ${yTop} L ${xR} ${yMid}`);
    }
    return parts.join(' ');
  };

  // The other company, as a card sitting directly behind the one being counted
  // and standing out equally on both sides. Offsetting it to one side is the
  // truer picture of two objects, but it drags the whole diagram off the centre
  // axis, and every other element here — the globe, the marks, the year, the
  // level — is centred on it. A symmetric card keeps the axis and still reads
  // as a second tower, because what says "individually" is the shared top edge,
  // not which way it is nudged.
  const gl = snap(sx(X0));
  const gr = snap(sx(X1));
  const gTop = snap(sy(massTop));
  const gBot = snap(sy(Y1));

  // The rim, extended past the towers into clear space: the level of everyone
  // alive, held still while the accent goes over it.
  // How far the level runs past the towers. At full scale the field is already
  // 750 wide and a 118px wing on each side puts the rule ten pixels off the
  // canvas; the room for it only exists once the diagram has pulled back, so
  // the reach grows with the pull-back instead of being a constant.
  const rimReach = interpolate(k, [FINAL_ZOOM, 1], [118, 40], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rimY = snap(sy(Y0));
  // Held as a half-length about the axis rather than two independent ends:
  // rounding each end on its own pushes them the same way and leaves the rule
  // two pixels off centre under a graphic that is otherwise mirror-exact.
  const rimHalf = Math.round(gr - gl) / 2 + off + rimReach;

  const r0 = PITCH * 0.187;
  const perim = 2 * (FIELD_W + WORLD_ROWS * PITCH);
  // The globe scales with the container and sits behind everything, so it reads
  // as a mark on the box rather than an object in front of the count. Its
  // continents are holes in the disc, so tinting to ink gives a white world
  // with the land showing whatever is behind the overlay.
  const earthW = earthSize * k;
  const earthLift = interpolate(spill, [0, 1], [earthOpacity, earthSettledOpacity]);

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="lee-ink" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${ir} 0 0 0 0 ${ig} 0 0 0 0 ${ib} 0 0 0 1 0`}
            />
          </filter>
          <filter id="lee-tint" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${tr} 0 0 0 0 ${tg} 0 0 0 0 ${tb} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      {earthIcon === '' ? null : (
        <Img
          src={staticFile(earthIcon)}
          style={{
            position: 'absolute',
            left: sx(CX) - earthW / 2,
            top: sy(Y1 - (WORLD_ROWS * PITCH) / 2) - earthW / 2,
            width: earthW,
            height: earthW,
            opacity: earthLift * resume,
            filter: `url(#lee-ink) drop-shadow(0 2px 6px ${shadow})`,
          }}
        />
      )}

      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}
      >
        {/* The world, unknown: eight billion people as a bounded lattice. */}
        <g transform={`translate(${CX} ${Y1}) scale(${k}) translate(${-CX} ${-Y1})`}>
          {CELLS.slice(0, WORLD).map((c, i) => {
            const a = clamp01((frame - (beats.resume + 1) - c.d * 8) / 9);
            if (a <= 0) return null;
            return (
              <circle
                key={`w${i}`}
                cx={c.x}
                cy={c.y}
                r={r0}
                fill={ink}
                opacity={fieldOpacity * a}
              />
            );
          })}
        </g>

        {/* The other company, behind. Only the two outer slivers are filled, so
            the card shows without washing out the field it sits under. */}
        {ghost > 1e-3 ? (
          <g opacity={ghost}>
            <rect x={gl - off} y={gTop} width={off} height={gBot - gTop} fill={accent} opacity={0.07} />
            <rect x={gr} y={gTop} width={off} height={gBot - gTop} fill={accent} opacity={0.07} />
            <rect
              x={gl - off}
              y={gTop}
              width={gr - gl + off * 2}
              height={gBot - gTop}
              fill="none"
              stroke={accent}
              strokeWidth={strokeWidth + 1}
              strokeLinejoin="miter"
              opacity={ghostOpacity}
            />
          </g>
        ) : null}

        {/* The AI labour: the same lattice cells, counted, spilling out of the
            container once there are no cells left inside it. */}
        <g transform={`translate(${CX} ${Y1}) scale(${k}) translate(${-CX} ${-Y1})`}>
          {CELLS.slice(0, Math.ceil(to)).map((c, i) => {
            const appear = i < from ? 1 : clamp01((wf - i) / ramp);
            if (appear <= 0) return null;
            const eased = 1 - Math.pow(1 - appear, 3);
            const crest = clamp01(1 - Math.abs(wf - i) / (ramp * 1.6));
            const amp = driftAmp * eased;
            const dx = Math.sin(frame * 0.055 + c.p1) * amp;
            const dy = Math.sin(frame * 0.043 + c.p2) * amp * 0.8;
            // Below the rim is now settled fact, so it steps back and lets the
            // surplus above it be the bright thing. Without this the last year
            // reads as a line sliding down a field rather than a field growing
            // past a line.
            const settle = i < WORLD ? interpolate(spill, [0, 1], [1, settledOpacity]) : 1;
            return (
              <circle
                key={`a${i}`}
                cx={c.x + dx}
                cy={c.y + dy}
                r={r0 * LIT * eased * (1 + crest * 0.2)}
                fill={accent}
                opacity={Math.min(1, dotOpacity * eased * settle)}
              />
            );
          })}
        </g>

        {/* The container of the world, drawn over the field rather than under
            it. For most of the previous clip it was a faint frame around an
            unknown quantity; here it has to survive on top of eight hundred lit
            dots and then be the thing they climb out of, so it thickens and
            comes up to full ink as it fills. A 3px hairline at 30% simply
            vanishes against this much accent — measured, not guessed. */}
        <rect
          x={gl}
          y={rimY}
          width={gr - gl}
          height={gBot - rimY}
          rx={10 * k}
          fill="none"
          stroke={ink}
          strokeWidth={interpolate(parity, [0, 1], [strokeWidth, wallWidth])}
          strokeDasharray={perim}
          strokeDashoffset={perim * (1 - resume)}
          opacity={interpolate(parity, [0, 1], [boundsOpacity, 0.95]) * resume}
        />

        {/* The level of the counted mass: height is complete rows, width is the
            row in progress, so a year is a line that stands higher and runs
            further at once. */}
        <path
          d={levelPath()}
          fill="none"
          stroke={accent}
          strokeWidth={levelWidth}
          strokeLinecap="butt"
          opacity={levelOpacity * resume}
        />

        {/* Everyone alive, as a level. Drawn last of the ink so it survives on
            top of the field it is measuring. */}
        {parity > 0.01 ? (
          <line
            x1={CX - Math.round(rimHalf * parity)}
            y1={rimY}
            x2={CX + Math.round(rimHalf * parity)}
            y2={rimY}
            stroke={ink}
            strokeWidth={rimWidth + 4 * crossPulse}
            opacity={Math.min(1, (rimOpacity + 0.12 * crossPulse) * parity)}
          />
        ) : null}

      </svg>

      {/* The year, in one place, rolling over as the count doubles. A tally of
          strokes says how many years; the year itself says which, and lands the
          claim inside a decade the viewer can picture. */}
      {years.map((y, i) => {
        // The opening year is inherited state, not an arrival: it is simply
        // there with the rest of the picture, so it does not roll in. Rolling
        // it left it still climbing to full when it was already handing over.
        const first = i === 0;
        const inF = steps[i - 1] ?? 0;
        const outF = i < steps.length ? steps[i] : null;
        const rise = first
          ? 0
          : interpolate(frame, [inF + 6, inF + 16], [46, 0], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
        const fall =
          outF === null
            ? 0
            : interpolate(frame, [outF, outF + 8], [0, -46], {
                easing: Easing.in(Easing.cubic),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
        const gone =
          outF === null
            ? 0
            : interpolate(frame, [outF, outF + 6], [0, 1], {
                easing: Easing.in(Easing.quad),
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
        // The outgoing year is fully gone at outF+6 and the incoming starts at
        // inF+6, which is the same frame — so a roll hands over cleanly instead
        // of showing two numbers stacked on each other for two frames.
        const a = (first ? resume : ease(inF + 6, inF + 16)) * (1 - gone);
        if (a <= 0.004) return null;
        return (
          <div
            key={y}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: yearTop + rise + fall,
              textAlign: 'center',
              fontFamily: roboto.fontFamily,
              fontWeight: 700,
              fontSize: yearSize,
              lineHeight: 1,
              color: ink,
              letterSpacing: '0.11em',
              marginRight: '-0.11em',
              opacity: yearOpacity * a,
              filter: `drop-shadow(0 2px 6px ${shadow})`,
            }}
          >
            {y}
          </div>
        );
      })}

      {marks.map((m, i) => {
        const on = m.delay === 0 ? resume : ease(beats.company + m.delay, beats.company + m.delay + 16);
        if (on <= 0) return null;
        // OpenAI is already there and only settles down to the row size; the
        // other two slide out from behind it as they arrive.
        const settle = m.delay === 0 ? ease(beats.company, beats.company + 16) : on;
        const size = m.delay === 0 ? interpolate(settle, [0, 1], [118, markSize]) : markSize;
        // The arriving marks travel only the last fifth of the gap. Sliding
        // them the whole way puts them straight through the mark that is
        // already there, and two logos on top of each other for ten frames
        // reads as a glitch rather than an entrance.
        const cx =
          m.delay === 0
            ? CX + (m.cx - CX) * settle
            : m.cx - (m.cx - CX) * (1 - on) * 0.22;
        const h = size;
        const w = size * m.aspect;
        return (
          <Img
            key={m.name}
            src={staticFile(m.name)}
            style={{
              position: 'absolute',
              left: cx - w / 2,
              top: markCy - h / 2,
              width: w,
              height: h,
              opacity: markOpacity * on,
              filter: `url(#lee-tint) drop-shadow(0 2px 6px ${shadow})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export default LaborEquivalentsExceedEarth;
