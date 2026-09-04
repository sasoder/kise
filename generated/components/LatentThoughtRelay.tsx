import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// Ajeya, 1:06.859 -> 1:14.900 of the cut: "and if these agents stop thinking in
// english and start thinking in neural activations, then you'd be forced to
// just ask another ai agent what was happening". Duration = round(8.041 * 30).
export const DURATION = 241;

// ---------------------------------------------------------------------------
// World. A single vertical reasoning trace: the agent at the bottom emits rows
// of thought that scroll upward past a human read-head. The row is the unit of
// meaning — ragged word-shaped bars while it is english, a fixed-width block of
// activation cells once it is not. Everything below the seam is unreadable;
// everything above it is the record from before the switch.
// ---------------------------------------------------------------------------
const WORLD_W = 1080;
const WORLD_H = 3400;

const COL_X0 = 280;
const COL_X1 = 800;
const COL_W = COL_X1 - COL_X0;
const ROW_PITCH = 76;
const BAR_GAP = 14;

// Rows live in content space: base y minus the accumulated scroll gives screen
// y. The list has to cover the whole travel, top of world to below the source.
const BASE_TOP = 3950;
const ROW_COUNT = 58;

const N_CELLS = 20;
const CELL_PITCH = COL_W / N_CELLS;
const CELL_W = 15;
const CELL_H = 44;

// The agent producing the trace, sitting at the foot of its own column. Rows
// are hidden until they clear its mouth.
const SRC = {x: 540, y: 2570, size: 165};
const SRC_EMIT = 2490;

// The read-head is the pair of brackets holding the newest row — the frame of
// attention itself, with no instrument drawn around it.
const READ_Y = 2120;
const BRACKET_GAP = 44;

// The ai you are forced to ask, and the one readable line it hands back into
// the brackets you were reading with.
const HELPER = {x: 940, y: 2380, size: 140};
const HELPER_X0 = HELPER.x - HELPER.size / 2;
const CARD = {x: 540, y: READ_Y, w: 300, h: 96};

const BG_OVERSIZE = 1.8;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  agentLogo: z.string(),
  // Beat frames from the SRT at 30fps, relative to 00:01:06.859:
  //   0 "and if these" · 26 "agents stop" · 54 "thinking" · 66 "in english" ·
  //   83 "and start" · 100 "thinking" · 109 "in neural" · 122 "activations" ·
  //   149 "then you'd" · 160 "be forced" · 170 "to just ask" ·
  //   194 "another ai" · 211 "agent what was" · 232 "happening" · 241 end.
  beats: z.object({
    english: z.number(), // "in english" — the trace at its most legible
    waveBirth: z.number(), // "and start" — the conversion front leaves the agent
    thinking: z.number(), // "thinking" — the stream begins to accelerate
    waveArrive: z.number(), // "in neural" — the front reaches the read-head
    activations: z.number(), // "activations" — the front fills the frame
    waveStop: z.number(), // the front spends itself and becomes a seam
    breakLine: z.number(), // "then you'd" — the read line fails
    recoil: z.number(), // "be forced"
    reachOut: z.number(), // "to just ask" — the human sends a query out
    helper: z.number(), // "another ai" — the second agent arrives
    helperRead: z.number(), // "agent what was" — it reads the latent stream
    card: z.number(), // "happening" — one readable line comes back
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  backgroundBase: '#232323',
  backgroundSrc: 'grid-background.jpg',
  // The grid's lines are darker than its field; inverting it flips that into a
  // glowing grid, which reads as a different asset. Dim it only.
  backgroundBlur: 13,
  backgroundDim: 0.32,
  parallax: 0.15,
  // The grid needs less separation than footage does.
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  agentLogo: 'openai-chatgpt-logo.png',
  beats: {
    english: 66,
    waveBirth: 83,
    thinking: 100,
    waveArrive: 109,
    activations: 122,
    waveStop: 130,
    breakLine: 149,
    recoil: 160,
    reachOut: 170,
    helper: 194,
    helperRead: 211,
    card: 232,
  },
});

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

const keyed = (f: number, K: number[], V: number[]) =>
  interpolate(f, K, V, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
};

// ---------------------------------------------------------------------------
// Trace motion. Both curves are integrated from keyed speeds rather than keyed
// positions, so velocity is continuous and the front never snaps: it leaves the
// agent slowly, peaks through "in neural", and spends itself on "activations".
// The scroll accelerates at the same moment — latent thought is also faster, so
// the same quantity is encoded twice.
// ---------------------------------------------------------------------------
const WAVE_BASE = 2772; // = SRC_EMIT + scroll at waveBirth: born at the mouth.
const MORPH_FRAMES = 9;

type Trace = {scroll: number[]; wave: number[]};

const buildTrace = (b: Props['beats']): Trace => {
  const sk = [0, b.waveBirth, b.thinking, 112, b.waveStop, 150, 175, DURATION];
  const sv = [3.4, 3.4, 3.6, 7.4, 7.8, 6.0, 5.4, 5.4];
  const wk = [
    b.waveBirth,
    b.waveBirth + 9,
    b.thinking,
    b.waveArrive,
    b.waveArrive + 7,
    b.activations,
    b.activations + 4,
    b.waveStop,
  ];
  const wv = [0, 8, 14, 19, 21, 17, 7, 0];

  const scroll = [0];
  const wave = [WAVE_BASE];
  for (let f = 1; f <= DURATION; f++) {
    scroll.push(scroll[f - 1] + keyed(f, sk, sv));
    wave.push(wave[f - 1] - (f > b.waveBirth ? keyed(f, wk, wv) : 0));
  }
  return {scroll, wave};
};

// First frame at which the front has passed a row, by binary search on the
// non-increasing wave track. Infinity for rows it never reaches.
const crossedAt = (wave: number[], base: number) => {
  if (wave[0] < base) return 0;
  let lo = 0;
  let hi = wave.length - 1;
  if (wave[hi] >= base) return Infinity;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (wave[mid] < base) hi = mid;
    else lo = mid + 1;
  }
  return lo;
};

type Bar = {x: number; w: number};

const wordRow = (i: number): Bar[] => {
  const n = 3 + Math.floor(hash(i, 1) * 3);
  const raw: number[] = [];
  for (let j = 0; j < n; j++) raw.push(0.45 + hash(i, 2 + j));
  const sum = raw.reduce((a, c) => a + c, 0);
  const fill = COL_W * (0.62 + 0.33 * hash(i, 9));
  const avail = fill - BAR_GAP * (n - 1);
  const bars: Bar[] = [];
  // Centred in the column, ragged both sides, so the word rows sit on the same
  // axis as the full-width cell blocks that replace them.
  let x = COL_X0 + (COL_W - fill) / 2;
  for (let j = 0; j < n; j++) {
    const w = (avail * raw[j]) / sum;
    bars.push({x, w});
    x += w + BAR_GAP;
  }
  return bars;
};

// ---------------------------------------------------------------------------
// Camera. Its own coarse key track, deliberately still through the conversion —
// the front does the moving — then one ramped pull-back that is just another
// key, so it inherits the same damping instead of reading as a separate move.
// ---------------------------------------------------------------------------
const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468; // zeta ~0.78

const camera = (upto: number, b: Props['beats']) => {
  const F = [0, 60, b.waveBirth, b.activations, b.breakLine, b.reachOut, 180, 186, 206, DURATION];
  const CY = [2155, 2130, 2120, 2120, 2085, 2100, 2140, 2170, 1795, 1795];
  const K = [1, 1, 1, 1, 1, 1, 1, 0.99, 0.628, 0.628];
  let cy = CY[0];
  let k = K[0];
  let vcy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    vcy += (keyed(f, F, CY) - cy) * CAM_STIFF - vcy * CAM_DAMP;
    cy += vcy;
    vk += (keyed(f, F, K) - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return {cy, k};
};

const LatentThoughtRelay: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  agentLogo,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const {scroll, wave} = buildTrace(beats);
  const S = scroll[Math.min(frame, DURATION)];
  const waveBase = wave[Math.min(frame, DURATION)];
  const waveY = waveBase - S;
  const mouth = SRC_EMIT + S; // content position of the agent's mouth

  const {cy, k} = camera(frame, beats);
  const tx = 540 - 540 * k;
  const ty = 960 - cy * k;

  // The grid sits on its own plane at a fraction of the camera, so the move
  // reads as travel through a space rather than a layer sliding about.
  const bgY = -(cy - 2155) * k * parallax - frame * 0.28;
  const bgScale = 1 + (k - 1) * 0.3;

  const enter = interpolate(frame, [0, 9], [0.72, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  // A ripple of full legibility running up the read record on "in english":
  // the trace at its clearest, one beat before it stops being a trace.
  const rippleY = READ_Y - (frame - beats.english) * 95;
  const rippleLife = interpolate(frame, [beats.english, beats.english + 4, beats.english + 20], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Activity sweeping up through the latent field on a loop that does not
  // divide into the beat grid, so it never lines up with anything else.
  const bandY = 2800 - ((frame * 26) % 3600);

  const [tr, tg, tb] = hexToRgb(accent);

  // ---- The frame of attention. It ratchets down the trace row by row, loses
  // its grip when the rows stop being readable, tries twice, then hangs open
  // until one readable line is placed back into it. ----
  const grip = interpolate(frame, [beats.breakLine, beats.breakLine + 8], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const slip = (at: number) =>
    interpolate(frame, [at, at + 3, at + 9], [0, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    });
  const cardSettle = spring({
    frame: frame - beats.card,
    fps,
    config: {damping: 13, stiffness: 170, mass: 0.8},
  });
  const held = Math.max(grip, cardSettle);
  const bracketOut =
    54 * (1 - held) + 26 * (1 - grip) * Math.max(slip(beats.breakLine + 9), slip(beats.recoil + 2));

  // ---- The query out, and the ai that answers it. ----
  const askGrow = interpolate(frame, [beats.reachOut, beats.helper - 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  const helperIn = spring({
    frame: frame - (beats.helper - 8),
    fps,
    config: {damping: 14, stiffness: 120, mass: 1},
  });
  const helperX = HELPER.x + (1 - helperIn) * 240;
  const helperReadX = interpolate(frame, [beats.helper + 2, beats.helperRead - 2], [HELPER_X0, COL_X1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const helperReading = frame >= beats.helperRead - 2 ? 1 : 0;

  const cardT = interpolate(frame, [beats.helperRead, beats.card], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const cardX = HELPER.x + (CARD.x - HELPER.x) * cardT;
  const cardY = HELPER.y - 60 + (CARD.y - (HELPER.y - 60)) * cardT;
  const cardScale = (0.34 + 0.66 * cardT) * (1 + 0.06 * cardSettle * (1 - cardSettle) * 4);
  const cardOn = frame >= beats.helperRead;

  // ---- Rows. ----
  const rows: React.ReactNode[] = [];
  for (let i = 0; i < ROW_COUNT; i++) {
    const base = BASE_TOP - i * ROW_PITCH;
    const y = base - S;
    if (y < -560 || y > SRC_EMIT + 90) continue;
    if (base > mouth) continue;

    // Birth: the row clears the agent's mouth over 70px of travel.
    const born = clamp01((mouth - base) / 70);
    const t = crossedAt(wave, base);
    const converted = t === Infinity ? 0 : clamp01((frame - t) / MORPH_FRAMES);
    const m = Math.min(born, converted);

    const stagger = interpolate(Math.abs(y - READ_Y), [0, 2400], [0, 4], {
      extrapolateRight: 'clamp',
    });
    const appear = clamp01((frame - stagger) / 5 + 0.72) * enter;
    const fadeTop = interpolate(y, [-460, -260], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const alive = appear * fadeTop;
    if (alive <= 0.002) continue;

    // Read state: rows are dim until the head has passed them, and the ripple
    // on "in english" lifts the read record to full for a moment.
    const read = interpolate(y, [READ_Y - 12, READ_Y + 44], [0.9, 0.42], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const boost =
      rippleLife > 0 ? 0.3 * rippleLife * Math.exp(-Math.pow((y - rippleY) / 150, 2)) : 0;
    const inkAlpha = Math.min(1, read + boost) * alive;

    if (m < 1) {
      const bars = wordRow(i);
      const collapse = clamp01(m / 0.6);
      const h = 22 - 16 * collapse;
      rows.push(
        <g key={`w${i}`} opacity={(1 - collapse) * inkAlpha}>
          {bars.map((bar, j) => {
            // The row writes itself out left to right as it clears the mouth,
            // so there is always a thought being formed at the bottom.
            const w = bar.w * clamp01((born - (j / bars.length) * 0.72) / 0.26);
            if (w <= 0.5) return null;
            return (
              <rect key={j} x={bar.x} y={y - h / 2} width={w} height={h} rx={h / 2} fill={ink} />
            );
          })}
        </g>,
      );
    }

    if (m > 0) {
      // The block blooms left to right as it lands, so the conversion has a
      // direction and never reads as a crossfade.
      const cells: React.ReactNode[] = [];
      for (let j = 0; j < N_CELLS; j++) {
        const cp = clamp01((m * 1.45 - (j / N_CELLS) * 0.45) / 1);
        if (cp <= 0) continue;
        const a = 0.2 + 0.72 * hash(i + j * 97, 5);
        const drift = 0.16 * Math.sin(frame * 0.08 + hash(i + j * 97, 7) * Math.PI * 2);
        const band = 0.36 * Math.exp(-Math.pow((y - bandY) / 260, 2)) * Math.max(0, Math.sin(frame * 0.11 + j * 0.35));
        // Never put ink over a live field: the stream gives way under the card.
        const shade = cardOn
          ? 1 - 0.74 * clamp01(1 - Math.abs(y - cardY) / 116) * clamp01((cardT - 0.45) / 0.55)
          : 1;
        const h = CELL_H * (0.24 + 0.76 * cp);
        cells.push(
          <rect
            key={j}
            x={COL_X0 + j * CELL_PITCH + (CELL_PITCH - CELL_W) / 2}
            y={y - h / 2}
            width={CELL_W}
            height={h}
            rx={2}
            fill={accent}
            opacity={Math.min(1, Math.max(0.1, a + drift + band)) * cp * alive * shade}
          />,
        );
      }
      // A flash of the whole row as it flips, under the words it is replacing.
      const flash = m < 0.55 ? Math.sin(clamp01(m / 0.55) * Math.PI) * 0.2 : 0;
      if (flash > 0.01) {
        rows.push(
          <rect
            key={`f${i}`}
            x={COL_X0}
            y={y - 14 - 8 * m}
            width={COL_W}
            height={28 + 16 * m}
            rx={6}
            fill={accent}
            opacity={flash * alive}
          />,
        );
      }
      rows.push(<g key={`c${i}`}>{cells}</g>);
    }
  }

  // The row the head is on, so the brackets ratchet with the trace instead of
  // running off a timer of their own. Once the grip is gone they stop tracking
  // and hang at the height where reading stopped working.
  const nearest = Math.round((BASE_TOP - (READ_Y + S)) / ROW_PITCH);
  const bracketY = (BASE_TOP - nearest * ROW_PITCH - S) * grip + READ_Y * (1 - grip);
  const bracketAlpha = (0.28 + 0.62 * held) * enter;

  // Ticks running the other way once the ai is the one doing the reading.
  const helperTicks: React.ReactNode[] = [];
  if (helperReading) {
    for (let d = 0; d < 2; d++) {
      const ph = ((frame - beats.helperRead - d * 6) % 12) / 9;
      if (ph < 0 || ph > 1) continue;
      helperTicks.push(
        <circle
          key={d}
          cx={COL_X1 + (HELPER_X0 - COL_X1) * ph}
          cy={HELPER.y}
          r={5}
          fill={accent}
          opacity={Math.sin(ph * Math.PI) * 0.9}
        />,
      );
    }
  }

  // The agent works the whole time and speeds up once it stops serialising its
  // thoughts into english.
  const spin = frame * 0.25 + Math.max(0, frame - beats.waveBirth) * 0.34;
  const srcBob = Math.sin(frame * 0.07) * 5;
  const emitPulse = Math.pow(1 - ((mouth - BASE_TOP) / ROW_PITCH - Math.floor((mouth - BASE_TOP) / ROW_PITCH)), 3);

  const waveAlive = frame >= beats.waveBirth;
  const waveSeam = interpolate(frame, [beats.waveStop, beats.waveStop + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const waveBirthFlash = interpolate(frame, [beats.waveBirth, beats.waveBirth + 7], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const waveSnap = Math.round(waveY) + 0.5;

  return (
    <AbsoluteFill style={{backgroundColor: backgroundBase}}>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Img
          src={staticFile(backgroundSrc)}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: WORLD_W * BG_OVERSIZE,
            height: 1920 * BG_OVERSIZE,
            objectFit: 'cover',
            transform: `translate(-50%, -50%) translateY(${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)})`,
            filter: `blur(${backgroundBlur}px) brightness(${backgroundDim})`,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: '0 0',
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}
          >
            <defs>
              <filter id="ltr-tint">
                <feColorMatrix type="matrix" values={`0 0 0 0 ${tr} 0 0 0 0 ${tg} 0 0 0 0 ${tb} 0 0 0 1 0`} />
              </filter>
            </defs>

            {rows}

            {/* The conversion front, then the seam it leaves behind. */}
            {waveAlive ? (
              <g>
                <line
                  x1={COL_X0 - 34}
                  y1={waveSnap}
                  x2={COL_X1 + 34}
                  y2={waveSnap}
                  stroke={accent}
                  strokeWidth={5}
                  strokeLinecap="round"
                  opacity={1 - 0.14 * waveSeam}
                />
                {waveSeam < 1 ? (
                  <g opacity={(1 - waveSeam) * 0.55}>
                    <line
                      x1={COL_X0 + 40}
                      y1={waveSnap - 16}
                      x2={COL_X0 + 150}
                      y2={waveSnap - 16}
                      stroke={accent}
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                    <line
                      x1={COL_X1 - 190}
                      y1={waveSnap - 28}
                      x2={COL_X1 - 60}
                      y2={waveSnap - 28}
                      stroke={accent}
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                  </g>
                ) : null}
                {waveBirthFlash > 0.01 ? (
                  <circle
                    cx={SRC.x}
                    cy={waveSnap}
                    r={40 + 150 * (1 - waveBirthFlash)}
                    fill="none"
                    stroke={accent}
                    strokeWidth={4}
                    opacity={waveBirthFlash * 0.7}
                  />
                ) : null}
              </g>
            ) : null}

            {/* The agent's mouth: a pulse for every row it puts out. */}
            <line
              x1={SRC.x - 46}
              y1={SRC_EMIT + 18}
              x2={SRC.x + 46}
              y2={SRC_EMIT + 18}
              stroke={accent}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={emitPulse * 0.8 * enter}
            />

            {/* The row being held, and the grip coming off it. */}
            <g opacity={bracketAlpha}>
              <path
                d={`M ${COL_X0 - BRACKET_GAP - bracketOut} ${bracketY - 34} l -15 0 l 0 68 l 15 0`}
                fill="none"
                stroke={ink}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={`M ${COL_X1 + BRACKET_GAP + bracketOut} ${bracketY - 34} l 15 0 l 0 68 l -15 0`}
                fill="none"
                stroke={ink}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* The query out to another agent. */}
            {askGrow > 0 ? (
              <line
                x1={COL_X1 + 74}
                y1={READ_Y + 54}
                x2={COL_X1 + 74 + (HELPER.x - 40 - (COL_X1 + 74)) * askGrow}
                y2={READ_Y + 54 + (HELPER.y - 92 - (READ_Y + 54)) * askGrow}
                stroke={ink}
                strokeWidth={3}
                strokeDasharray="12 12"
                strokeDashoffset={-frame * 1.6}
                strokeLinecap="round"
                opacity={0.5 * askGrow * (1 - 0.6 * cardT)}
              />
            ) : null}

            {/* The ai's own read line into the latent stream. */}
            {frame >= beats.helper ? (
              <g>
                <line
                  x1={HELPER_X0}
                  y1={HELPER.y}
                  x2={helperReadX}
                  y2={HELPER.y}
                  stroke={accent}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                {helperTicks}
              </g>
            ) : null}

            {/* One readable line, handed back. */}
            {cardOn ? (
              <g transform={`translate(${cardX} ${cardY}) scale(${cardScale.toFixed(3)})`} opacity={clamp01(cardT * 2)}>
                <rect
                  x={-CARD.w / 2}
                  y={-CARD.h / 2}
                  width={CARD.w}
                  height={CARD.h}
                  rx={14}
                  fill="none"
                  stroke={ink}
                  strokeWidth={4}
                  opacity={0.62}
                />
                <g opacity={clamp01((cardT - 0.25) / 0.5) * 0.92}>
                  <rect x={-114} y={-11} width={80} height={22} rx={11} fill={ink} />
                  <rect x={-20} y={-11} width={50} height={22} rx={11} fill={ink} />
                  <rect x={44} y={-11} width={70} height={22} rx={11} fill={ink} />
                </g>
              </g>
            ) : null}
          </svg>

          <Img
            src={staticFile(agentLogo)}
            style={{
              position: 'absolute',
              left: SRC.x - SRC.size / 2,
              top: SRC.y - SRC.size / 2 + srcBob,
              width: SRC.size,
              height: SRC.size,
              filter: 'url(#ltr-tint)',
              transform: `rotate(${spin.toFixed(1)}deg) scale(${(0.6 + 0.4 * enter).toFixed(3)})`,
              transformOrigin: 'center center',
              opacity: enter,
            }}
          />

          {frame >= beats.helper - 8 ? (
            <Img
              src={staticFile(agentLogo)}
              style={{
                position: 'absolute',
                left: helperX - HELPER.size / 2,
                top: HELPER.y - HELPER.size / 2 + Math.sin(frame * 0.09) * 4,
                width: HELPER.size,
                height: HELPER.size,
                filter: 'url(#ltr-tint)',
                transform: `rotate(${(-frame * 0.42).toFixed(1)}deg)`,
                transformOrigin: 'center center',
                opacity: helperIn,
              }}
            />
          ) : null}

        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default LatentThoughtRelay;
