import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

export const FPS = 24;
// Dwarkesh, "now a very natural question to ask is whether even a single one
// of these 1,200 agents who participated in the message board attempted to
// alert humans about this ever-escalating conspiracy, which culminated in a
// felony-level crime" — SRT 38.719s -> 51.780s. round(13.061 * 24) = 313.
export const DURATION = 313;

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
  dotRadius: z.number(),
  replyLines: z.number(),
  beats: z.object({
    natural: z.number(), // "natural"
    question: z.number(), // "question"
    toAsk: z.number(), // "to ask is"
    whetherEven: z.number(), // "whether even a"
    singleOne: z.number(), // "single one"
    ofThese: z.number(), // "of these 1"
    agents: z.number(), // "200 agents who"
    participated: z.number(), // "participated"
    message: z.number(), // "in the message"
    board: z.number(), // "board attempted"
    alertHumans: z.number(), // "to alert humans"
    aboutThis: z.number(), // "about this ever"
    escalating: z.number(), // "escalating"
    conspiracy: z.number(), // "conspiracy"
    which: z.number(), // "which"
    culminated: z.number(), // "culminated in a"
    felony: z.number(), // "felony level"
    crime: z.number(), // "crime"
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#48D9FF",
  backgroundBase: "#232323",
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: 0.32,
  parallax: 0.15,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  dotRadius: 7,
  replyLines: 80,
  beats: {
    natural: 11,
    question: 19,
    toAsk: 26,
    whetherEven: 38,
    singleOne: 57,
    ofThese: 74,
    agents: 87,
    participated: 110,
    message: 124,
    board: 139,
    alertHumans: 165,
    aboutThis: 190,
    escalating: 217,
    conspiracy: 228,
    which: 247,
    culminated: 255,
    felony: 285,
    crime: 301,
  },
});

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 3300;

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// Layout. The human is one ink dot at the top. The field is exactly 1,200
// agents, 25 across by 48 down, centred on the axis; the "single one" is the
// dot at column 12, row 10. The law is an ink line below the field, and the
// crime is the point below it that the field drains into.
// ---------------------------------------------------------------------------
const HUMAN: P = { x: 540, y: 500 };
const HUMAN_R = 30;
const FEELER_END = 900;

const COLS = 25;
const ROWS = 48;
const SPACING = 34;
const FIELD_X0 = 540 - 12 * SPACING;
const FIELD_Y0 = 1000;
const SINGLE = { c: 12, r: 10 };
const SINGLE_I = SINGLE.r * COLS + SINGLE.c;

const LAW = { y: 2720, x0: 240, x1: 840 };
const CRIME: P = { x: 540, y: 2815 };

const CAM_F = [0, 14, 24, 34, 50, 60, 80, 180, 200, 240, 272, 288, DURATION];
const CAM_CY = [720, 760, 1100, 1300, 1320, 1400, 1560, 1560, 1700, 2400, 2450, 1655, 1655];
const CAM_K = [1.0, 1.05, 1.5, 2.0, 2.0, 1.4, 0.78, 0.78, 0.8, 0.85, 0.85, 0.62, 0.62];
const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468;

const camera = (upto: number) => {
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, CAM_F, CAM_CY, clamp);
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, k };
};

const BG_OVERSIZE = 1.8;

type Dot = { x: number; y: number; r: number; opacity: number; drained: number };

const FieldOfTwelveHundred: React.FC<Props> = ({
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
  dotRadius,
  replyLines,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Escalation runs from "about this ever" to "which": everything on the
  // board gets faster and brighter on this one curve.
  const esc = interpolate(frame, [beats.aboutThis, beats.which], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  });
  // Brightness wave rolling down the field, quickening as it escalates.
  const waveFreq = 0.12 + 0.4 * esc;
  const wavePhase = (frame - beats.aboutThis) * waveFreq;

  // -- the field ------------------------------------------------------------
  let arrived = 0;
  const dots: Dot[] = Array.from({ length: COLS * ROWS }, (_, i) => {
    const c = i % COLS;
    const r = Math.floor(i / COLS);
    const x0 = FIELD_X0 + c * SPACING;
    const y0 = FIELD_Y0 + r * SPACING;
    const isSingle = i === SINGLE_I;

    const dist = Math.hypot(c - SINGLE.c, r - SINGLE.r);
    const appear = isSingle ? beats.whetherEven : beats.ofThese - 8 + dist * 0.68;
    const pop = spring({ frame: frame - appear, fps, config: { damping: 11, stiffness: 170, mass: 0.6 } });
    if (frame < appear) return { x: x0, y: y0, r: 0, opacity: 0, drained: 0 };

    // The single one starts big enough to be the subject, then settles to the
    // size of everyone else as the rest of the field arrives around it.
    const singleR = interpolate(frame, [beats.singleOne + 4, beats.agents], [26, dotRadius], {
      ...clamp,
      easing: Easing.inOut(Easing.quad),
    });
    const baseR = isSingle ? singleR : dotRadius;

    // Message-board flicker: short bright posts, more of them as it escalates.
    const boardOn = frame >= beats.participated;
    const rate = 0.014 + 0.03 * esc;
    const duty = 0.05 + 0.22 * esc;
    const ph = hash(i, 1) + frame * rate;
    const blink = boardOn && ph - Math.floor(ph) < duty ? 1 : 0;
    const blinkIn = interpolate(frame, [beats.participated, beats.participated + 12], [0, 1], clamp);
    const wave = frame >= beats.aboutThis ? Math.max(0, Math.sin(wavePhase - r * 0.22)) * esc : 0;
    const brightness = Math.min(1, 0.62 + 0.38 * blink * blinkIn + 0.3 * wave);

    // The drain: bottom rows first, accelerating into the crime.
    const d = beats.culminated + (ROWS - 1 - r) * 0.6 + hash(i, 2) * 8;
    const t = interpolate(frame, [d, d + 18], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
    if (t >= 1) arrived += 1;
    const x = x0 + (CRIME.x - x0) * t;
    const y = y0 + (CRIME.y - y0) * t;
    const fade = interpolate(t, [0.85, 1], [1, 0], clamp);
    const breath = 1 + 0.06 * Math.sin(frame * 0.11 + hash(i, 3) * 6.28);
    return {
      x,
      y,
      r: baseR * pop * breath * (1 + 0.45 * blink * blinkIn + 0.2 * wave),
      opacity: brightness * fade,
      drained: t,
    };
  });

  // Reply lines between neighbours: each pair posts on its own rhythm.
  const lines = Array.from({ length: replyLines }, (_, j) => {
    const a = Math.floor(hash(j, 4) * (COLS * ROWS - COLS - 1));
    const b = hash(j, 5) < 0.5 ? a + 1 : a + COLS;
    if (a % COLS === COLS - 1 && b === a + 1) return null;
    const ph = hash(j, 6) + frame * (0.01 + 0.03 * esc);
    const on = ph - Math.floor(ph) < 0.09 + 0.25 * esc;
    if (!on || frame < beats.message) return null;
    const da = dots[a];
    const db = dots[b];
    if (da.r <= 0 || db.r <= 0) return null;
    const op = Math.min(da.opacity, db.opacity) * Math.max(0, 1 - 4 * Math.max(da.drained, db.drained));
    if (op <= 0.02) return null;
    return { key: j, x1: da.x, y1: da.y, x2: db.x, y2: db.y, op };
  });

  // -- the human and the feeler --------------------------------------------
  const humanIn = spring({ frame: frame + 8, fps, config: { damping: 12, stiffness: 140, mass: 0.8 } });
  const humanBreath = 1 + 0.02 * Math.sin(frame / 17);
  const ask = spring({ frame: frame - beats.alertHumans, fps, config: { damping: 9, stiffness: 180, mass: 0.7 } });
  const humanScale = humanIn * humanBreath * (1 + 0.12 * (frame >= beats.alertHumans ? 1 - ask : 0));
  const feelerDraw = interpolate(frame, [beats.question, beats.question + 16], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const feelerY1 = HUMAN.y + HUMAN_R + 14 + (FEELER_END - HUMAN.y - HUMAN_R - 14) * feelerDraw;
  const askPulse = interpolate(frame, [beats.alertHumans, beats.alertHumans + 12], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.quad),
  });
  const askRing = interpolate(frame, [beats.alertHumans + 10, beats.alertHumans + 30], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });
  // The question keeps asking, quietly, for the rest of the piece.
  const askAgain = (frame - beats.alertHumans) % 48;
  const askAgainT = frame > beats.alertHumans + 30 ? askAgain / 48 : -1;

  // -- the law and the crime ------------------------------------------------
  const lawDraw = interpolate(frame, [beats.which, beats.culminated + 4], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const felony = spring({ frame: frame - beats.felony, fps, config: { damping: 10, stiffness: 160, mass: 0.8 } });
  const lawW = 10 + 6 * (frame >= beats.felony ? felony : 0);
  const crimeR = 6 + 60 * (arrived / (COLS * ROWS));
  const crimeHit = spring({ frame: frame - beats.crime, fps, config: { damping: 8, stiffness: 200, mass: 0.8 } });
  const crimeRing = interpolate(frame, [beats.crime, beats.crime + 14], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });

  // -- camera ---------------------------------------------------------------
  const cam = camera(frame);
  const cy = cam.cy + 5 * Math.sin(frame / 19);
  const cx = 540 + 3 * Math.sin(frame / 23);
  const k = cam.k;
  const tx = 540 - cx * k;
  const ty = 960 - cy * k;
  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.3;
  const bgScale = 1 + (k - 1) * 0.3;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: WORLD_W * BG_OVERSIZE,
            height: 1920 * BG_OVERSIZE,
            objectFit: "cover",
            transform: `translate(-50%, -50%) translateY(${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)})`,
            filter: `blur(${backgroundBlur}px) brightness(${backgroundDim})`,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* reply lines */}
            {lines.map((l) =>
              l ? (
                <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={accent} strokeWidth={3} strokeLinecap="round" opacity={l.op} />
              ) : null,
            )}

            {/* the field */}
            {dots.map((d, i) =>
              d.r > 0.2 && d.opacity > 0.01 ? <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={accent} opacity={d.opacity} /> : null,
            )}

            {/* the feeler */}
            {feelerDraw > 0 ? (
              <g>
                <line x1={HUMAN.x} y1={HUMAN.y + HUMAN_R + 14} x2={HUMAN.x} y2={feelerY1} stroke={ink} strokeWidth={6} strokeLinecap="round" opacity={0.9} />
                {askPulse > 0 && askPulse < 1 ? (
                  <line
                    x1={HUMAN.x}
                    y1={HUMAN.y + HUMAN_R + 14 + (FEELER_END - HUMAN.y - HUMAN_R - 14) * Math.max(0, askPulse - 0.3)}
                    x2={HUMAN.x}
                    y2={HUMAN.y + HUMAN_R + 14 + (FEELER_END - HUMAN.y - HUMAN_R - 14) * askPulse}
                    stroke={ink}
                    strokeWidth={10}
                    strokeLinecap="round"
                  />
                ) : null}
                {askRing > 0 && askRing < 1 ? (
                  <circle cx={HUMAN.x} cy={FEELER_END} r={10 + 60 * askRing} fill="none" stroke={ink} strokeWidth={4} opacity={0.8 * (1 - askRing)} />
                ) : null}
                {askAgainT >= 0 && askAgainT < 0.5 ? (
                  <circle cx={HUMAN.x} cy={FEELER_END} r={8 + 40 * (askAgainT * 2)} fill="none" stroke={ink} strokeWidth={3} opacity={0.5 * (1 - askAgainT * 2)} />
                ) : null}
                <circle cx={HUMAN.x} cy={FEELER_END} r={7} fill={ink} opacity={feelerDraw >= 1 ? 0.9 : 0} />
              </g>
            ) : null}

            {/* the human */}
            <circle cx={HUMAN.x} cy={HUMAN.y} r={HUMAN_R * humanScale} fill={ink} />

            {/* the law */}
            {lawDraw > 0 ? (
              <line
                x1={LAW.x0 + (LAW.x1 - LAW.x0) * 0.5 * (1 - lawDraw)}
                y1={LAW.y}
                x2={LAW.x1 - (LAW.x1 - LAW.x0) * 0.5 * (1 - lawDraw)}
                y2={LAW.y}
                stroke={ink}
                strokeWidth={lawW}
                strokeLinecap="round"
              />
            ) : null}

            {/* the crime */}
            {arrived > 0 || frame >= beats.culminated ? (
              <g>
                {crimeRing > 0 && crimeRing < 1 ? (
                  <circle cx={CRIME.x} cy={CRIME.y} r={crimeR + 140 * crimeRing} fill="none" stroke={accent} strokeWidth={6} opacity={0.9 * (1 - crimeRing)} />
                ) : null}
                <circle
                  cx={CRIME.x}
                  cy={CRIME.y}
                  r={crimeR * (1 + (frame >= beats.crime ? 0.35 * (1 - crimeHit) : 0))}
                  fill={accent}
                />
              </g>
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default FieldOfTwelveHundred;
