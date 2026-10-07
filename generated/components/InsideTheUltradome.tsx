import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  camEase,
  clamp,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// The Premiere slot is 22.458 s - 29.583 s = 7.125 s.  7.125 * 24 = 171 frames
// exactly. No tail: the edit cuts back to the speaker on frame 171.
export const DURATION = 171;

// ---------------------------------------------------------------------------
// "INSIDE THE ULTRADOME". Core memory podcast graphic standard; the sibling of
// `PeakForSolar` — same paper, same hard shadow, same chain, same damped camera.
//
// CHECK LINE (what the viewer can say after this cut): "The show inside the
// Ultradome is one thing made of three parts: news, gossip and sports TV."
//
// THE MOTION, one continuous unfolding: we arrive from outside, already pushing
// in on a white outline dome with a shape-shifting blob inside it that will not
// settle into anything nameable. Two lines split the dome into three equal
// sectors; the blob gives up a third of itself three times, and each third
// travels to its own sector and resolves into an icon while that sector's chain
// colour slides up behind it — a newspaper on orange, two speech bubbles on
// purple, a TV with a ball on blue. Nothing is left of the blob, and the camera
// eases back a touch on the finished dome. NO TEXT anywhere.
//
// THE LINE, frames at 24 fps from composition start:
//   What happens 1-10 | inside 11-21 | the Ultradome 22-38 | is kind of 38-49 |
//   hard to 50-55 | describe 56-65 | part 72 | journalism 74-87 | part 96 |
//   gossip 100-109 | and part 117-132 | sports 133-147 | broadcast 148-163 |
//   (cut) 171
//
// THE BEATS the words guide (they do not each get a gesture):
//   f0      alive: the camera is mid-push (12 frames of pre-roll), the blob is
//           already inside and growing
//   f0-36   the push lands on the rest framing                — "inside the Ultradome"
//   f36-70  the blob shape-shifts, at its most restless ~f58  — "hard to describe"
//   f70     split 1 leaves, the two radial lines draw out of the door;
//           newspaper on orange by ~f92                       — "part journalism"
//   f95     split 2 leaves; bubbles on purple by ~f116        — "part gossip"
//   f119    the last third leaves; TV on blue by ~f141        — "and part sports"
//   f138-171 a slight ease back; bubbles bob, the ball rolls, the paper's
//           corner flutters. The last frame is the composed picture.
//
// THE COLOURS, raw hex, no filter, no blend, no gradient, no glow, no fades:
//   ink #FFFFFF, shadow #000000 hard at +4/+4 WORLD px as an SVG copy,
//   orange #FFB765 = journalism, purple #BC37FF = gossip, blue #0046FF = sports
//   broadcast. Each colour has that one job and is nowhere else.
//
// THE GEOMETRY, world px (world = screen at the rest camera): the dome is a
// semicircle of radius 460 on (540, 1050) — base y 1050, apex y 590, 920 wide —
// so its floor sits just above the caption strip (y 1080-1250). The camera
// zooms about the door, which is on that floor, so the floor stays on screen
// y ~1050 at every k and nothing ever enters the strip.
//
// THE CAMERA: `PeakForSolar`'s `runCamera2` tracker (same CAM_STIFF / CAM_DAMP),
// one key per frame, started CAM_PRE frames before frame 0 so frame 0 is
// already travelling. Push k 0.79 -> 1.00 (f-12..36), creep 1.00 -> 1.06
// (f36..136), ease back 1.06 -> 1.00 (f138..162). cy = 1050 - 90 / k.
// ---------------------------------------------------------------------------

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const PAPER_BASE = "#C0C0C0";
const BG_OVERSIZE_ITU = 1.6;

export const schema = z.object({
  paperSrc: z.string(),
  parallax: z.number(),
  paperDim: z.number(),
  paperBlur: z.number(),
  ink: z.string(),
  shadow: z.string(),
  orange: z.string(),
  purple: z.string(),
  blue: z.string(),
  shadowOffset: z.number(),
  stroke: z.number(),
  beats: z.object({
    split1: z.number(), // "part journalism"
    split2: z.number(), // "part gossip"
    split3: z.number(), // "and part sports"
  }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  paperSrc: "paper-supaclean-still.png",
  parallax: 0.15,
  paperDim: 0.88,
  paperBlur: 3,
  ink: WHITE,
  shadow: BLACK,
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  shadowOffset: 4,
  stroke: 12,
  beats: { split1: 70, split2: 95, split3: 119 },
});

// -- geometry ----------------------------------------------------------------
export const DOME_CX = 540;
export const DOME_BASE = 1050;
export const DOME_R = 460;
export const DOOR_R = 34;
// v2: about twice the area, so "hard to describe" registers at phone size. The
// body sinks toward the floor as it gives its thirds away, which keeps what is
// left of it clear of the bubbles above.
const BLOB_C = { x: 540, y: 826 };
const BLOB_SINK = 132; // world px of sink per unit of area given away
const BLOB_R = 145;
const ICON_SCALE = 1.0;
// the centre of each sector's inscribed circle (2R/3 out on its bisector)
const polar = (deg: number, r: number) => ({
  x: DOME_CX + r * Math.cos((deg * Math.PI) / 180),
  y: DOME_BASE - r * Math.sin((deg * Math.PI) / 180),
});
const ICON_AT = [polar(150, 300), { x: 540, y: 722 }, polar(30, 300)];
const SECTOR_DEG: [number, number][] = [
  [180, 120],
  [120, 60],
  [60, 0],
];

// -- motion ------------------------------------------------------------------
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_GO = Easing.bezier(0.4, 0, 0.2, 1);
const RISE_FRAMES = 22;
const TRAVEL_FRAMES = 18;

// -- camera ------------------------------------------------------------------
export const CAM_PRE = 12;
const K_OUT = 0.79; // v2: opens closer, damped k is ~0.82 at f0
const K_REST = 1.0;
const K_TIGHT = 1.06;
const PUSH_END = 36;
const CREEP_END = 136;
const BACK_F0 = 138;
const BACK_F1 = 162;
const kTarget = (f: number) => {
  if (f <= PUSH_END) {
    return K_OUT + (K_REST - K_OUT) * camEase((f + CAM_PRE) / (PUSH_END + CAM_PRE), 0.8);
  }
  if (f <= CREEP_END) {
    return K_REST + (K_TIGHT - K_REST) * ((f - PUSH_END) / (CREEP_END - PUSH_END));
  }
  return K_TIGHT + (K_REST - K_TIGHT) * camEase((f - BACK_F0) / (BACK_F1 - BACK_F0), 1);
};
const cyFor = (k: number) => DOME_BASE - 90 / k;
const CAM_N = DURATION + CAM_PRE + 1;
const ITU_CAM_F = Array.from({ length: CAM_N }, (_, i) => i);
const ITU_CAM_K = ITU_CAM_F.map((s) => kTarget(s - CAM_PRE));
const ITU_CAM_CY = ITU_CAM_K.map(cyFor);
const ITU_CAM_CX = ITU_CAM_F.map(() => DOME_CX);

// `PeakForSolar`'s `runCamera2`, copied so this cut does not import that
// component's font. Same tracker, same constants.
const runCamera2 = (upto: number, F: number[], CY: number[], CX: number[], K: number[]) => {
  let cy = CY[0];
  let cx = CX[0];
  let k = K[0];
  let vy = 0;
  let vx = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, F, CY, clamp);
    const tx = interpolate(f, F, CX, clamp);
    const tk = interpolate(f, F, K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, cx, k };
};
export const cameraAt = (frame: number) =>
  runCamera2(frame + CAM_PRE, ITU_CAM_F, ITU_CAM_CY, ITU_CAM_CX, ITU_CAM_K);

// ---------------------------------------------------------------------------
// THE GROUND — `PeakForSolar`'s `PaperGround`, unchanged.
// ---------------------------------------------------------------------------
const PaperGround: React.FC<{
  src: string;
  frame: number;
  cy: number;
  cyRest: number;
  cx: number;
  cxRest: number;
  k: number;
  parallax: number;
  dim: number;
  blur: number;
}> = ({ src, frame, cy, cyRest, cx, cxRest, k, parallax, dim, blur }) => {
  const bgY = -(cy - cyRest) * k * parallax - frame * 0.3;
  const bgX = -(cx - cxRest) * k * parallax;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE_ITU,
          height: FRAME_W * BG_OVERSIZE_ITU,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// THE BLOB. A closed curve r(theta) of three slow harmonics whose phases run at
// unrelated rates, so the outline keeps moving and never repeats or settles.
// Frame-driven and smooth: no noise, no per-frame jitter.
// ---------------------------------------------------------------------------
const blobPath = (cx: number, cy: number, r: number, t: number, amp: number) => {
  const N = 90;
  let d = "";
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    const m =
      1 +
      amp *
        (0.24 * Math.sin(2 * th + t * 0.078) +
          0.19 * Math.sin(3 * th - t * 0.061 + 1.3) +
          0.05 * Math.sin(5 * th + t * 0.09 + 2.1) +
          0.08 * Math.sin(th - t * 0.045));
    const x = cx + r * m * Math.cos(th);
    const y = cy + r * m * Math.sin(th) * 0.92;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}Z`;
};

// -- icon path helpers (even-odd, so details are holes onto the colour) -------
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
const circ = (x: number, y: number, r: number) =>
  `M${x - r} ${y}A${r} ${r} 0 1 0 ${x + r} ${y}A${r} ${r} 0 1 0 ${x - r} ${y}Z`;

// A folded newspaper: the front page with a masthead bar, a picture box and
// text bars cut out of it, and the fold's back leaf showing down the right.
// `ear` is how far the top-right corner is turned (the flutter).
const newspaper = (ear: number) => {
  const front =
    `M-96 -98H${70 - ear}L70 ${-98 + ear}V98H-96Z` +
    rr(-76, -78, 110, 30, 4) +
    rr(-76, -30, 58, 58, 4) +
    rr(-4, -30, 54, 14, 4) +
    rr(-4, -8, 54, 14, 4) +
    rr(-4, 14, 54, 14, 4) +
    rr(-76, 44, 126, 14, 4) +
    rr(-76, 66, 90, 14, 4);
  const back = `M82 -70H88A10 10 0 0 1 98 -60V88A10 10 0 0 1 88 98H82Z`;
  return [front, back];
};

// Two speech bubbles. The upper-left one is in front, so its hard shadow falls
// on the lower-right one and keeps them apart.
const bubbleFront =
  `M-70 -92H2A28 28 0 0 1 30 -64V-18A28 28 0 0 1 2 10H-42L-82 44L-72 10A28 28 0 0 1 -98 -18V-64A28 28 0 0 1 -70 -92Z` +
  circ(-66, -41, 10) +
  circ(-34, -41, 10) +
  circ(-2, -41, 10);
const bubbleBack =
  `M-4 -28H70A28 28 0 0 1 98 0V44A28 28 0 0 1 72 72L82 100L42 72H-4A28 28 0 0 1 -32 44V0A28 28 0 0 1 -4 -28Z` +
  circ(8, 42, 10) +
  circ(38, 42, 10) +
  circ(68, 42, 10);

// A TV set: body with the screen and two knobs cut out, two feet.
const tvBody =
  rr(-98, -58, 196, 140, 18) +
  rr(-80, -40, 124, 104, 10) +
  circ(70, -14, 10) +
  circ(70, 18, 10) +
  `M-66 82H-40V96H-66Z` +
  `M40 82H66V96H40Z`;

const InsideTheUltradome: React.FC<Props> = ({
  paperSrc,
  parallax,
  paperDim,
  paperBlur,
  ink,
  shadow,
  orange,
  purple,
  blue,
  shadowOffset,
  stroke,
  beats,
}) => {
  const frame = useCurrentFrame();
  const so = shadowOffset;

  // -- the camera ------------------------------------------------------------
  const cam = cameraAt(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy * 0.6;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  const prog = (f0: number, len: number, easing: (t: number) => number) =>
    interpolate(frame, [f0, f0 + len], [0, 1], { easing, ...clamp });

  const starts = [beats.split1, beats.split2, beats.split3];
  const colors = [orange, purple, blue];

  // -- the blob ----------------------------------------------------------------
  // It is already inside at frame 0 and still arriving; most restless under
  // "hard to describe"; then it gives up a third of its AREA at each split.
  const arrive = interpolate(frame, [-CAM_PRE, 34], [0.45, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const restless =
    0.8 +
    0.2 * smoothstep((frame - 30) / 16) -
    0.45 * smoothstep((frame - (beats.split1 - 4)) / 16);
  const area =
    1 - prog(beats.split1, 14, EASE_GO) / 3 - prog(beats.split2, 14, EASE_GO) / 3;
  const mainR = BLOB_R * arrive * Math.sqrt(area);
  const mainAlive = frame < beats.split3;
  const areaAt = (f: number) =>
    1 -
    interpolate(f, [beats.split1, beats.split1 + 14], [0, 1], { easing: EASE_GO, ...clamp }) / 3 -
    interpolate(f, [beats.split2, beats.split2 + 14], [0, 1], { easing: EASE_GO, ...clamp }) / 3;
  const mainY = (f: number) => BLOB_C.y + (1 - areaAt(f)) * BLOB_SINK;
  const mainC = { x: BLOB_C.x, y: mainY(frame) };
  const pieceR = BLOB_R * Math.sqrt(1 / 3);
  const blobT = frame + 40;

  const pieces = starts.map((s, i) => {
    if (frame < s) {
      return null;
    }
    const p = prog(s, TRAVEL_FRAMES, EASE_GO);
    // it leaves from wherever the body is at that moment
    const y0 = mainY(s);
    const x = BLOB_C.x + (ICON_AT[i].x - BLOB_C.x) * p;
    const y = y0 + (ICON_AT[i].y - y0) * p;
    // v2: the third shrinks to nothing by s+16 and the icon grows from the same
    // point from s+13 — three frames of overlap, with the blob drawn IN FRONT,
    // so no blob white ever shows through an icon's cut-outs.
    const shrink = 1 - prog(s + 7, 9, EASE_GO);
    const icon = frame >= s + 13 ? prog(s + 12, 15, EASE_LAND) : 0;
    const life = smoothstep((frame - (s + 20)) / 14);
    return { x, y, r: pieceR * shrink, icon: icon * ICON_SCALE, life };
  });

  const bodies = (off: number) => (
    <>
      {mainAlive ? (
        <path d={blobPath(mainC.x + off, mainC.y + off, mainR, blobT, restless)} />
      ) : null}
      {pieces.map((p, i) =>
        p && p.r > 0.5 ? (
          <path key={i} d={blobPath(p.x + off, p.y + off, p.r, blobT, restless)} />
        ) : null,
      )}
    </>
  );

  // -- the sector fills ---------------------------------------------------------
  const sectorPath = ([a0, a1]: [number, number]) => {
    const p0 = polar(a0, DOME_R);
    const p1 = polar(a1, DOME_R);
    return `M${DOME_CX} ${DOME_BASE}L${p0.x.toFixed(2)} ${p0.y.toFixed(2)}A${DOME_R} ${DOME_R} 0 0 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}Z`;
  };
  const sectorTop = (i: number) => (i === 1 ? DOME_BASE - DOME_R : polar(60, DOME_R).y);

  // -- the dome ------------------------------------------------------------------
  const linesT = prog(beats.split1, RISE_FRAMES, EASE_LAND);
  const flagTip = 3 * Math.sin(frame / 5);
  const domeShapes = (color: string) => (
    <>
      <path
        d={`M-1400 ${DOME_BASE}H2480M${DOME_CX - DOME_R} ${DOME_BASE}A${DOME_R} ${DOME_R} 0 0 1 ${DOME_CX + DOME_R} ${DOME_BASE}M${DOME_CX} ${DOME_BASE - DOME_R}V${DOME_BASE - DOME_R - 74}`}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="butt"
      />
      {/* the pennant */}
      <path
        d={`M${DOME_CX} ${DOME_BASE - DOME_R - 80}L${DOME_CX + 62} ${DOME_BASE - DOME_R - 58 + flagTip}L${DOME_CX} ${DOME_BASE - DOME_R - 36}Z`}
        fill={color}
      />
      {/* the door */}
      <path
        d={`M${DOME_CX - DOOR_R} ${DOME_BASE + stroke / 2}V${DOME_BASE}A${DOOR_R} ${DOOR_R} 0 0 1 ${DOME_CX + DOOR_R} ${DOME_BASE}V${DOME_BASE + stroke / 2}Z`}
        fill={color}
      />
    </>
  );

  // The two lines that make it three parts, drawn out of the door. v2: they
  // pass BEHIND the blob and its thirds, with a keyline of paper around each
  // body (the mask below), so white never merges into white.
  const lineShapes = (color: string) =>
    frame >= beats.split1
      ? [120, 60].map((deg) => {
          const a = polar(deg, DOOR_R - 4);
          const b = polar(deg, DOOR_R - 4 + (DOME_R - DOOR_R + 4) * linesT);
          return (
            <line
              key={deg}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="butt"
            />
          );
        })
      : null;

  // -- the icons -------------------------------------------------------------------
  // Each returns its shapes in one colour, so the same call draws the hard
  // shadow (black, +4/+4) and the ink.
  const iconShapes = (i: number, color: string, life: number, layer: "back" | "front" | "all") => {
    if (i === 0) {
      const ear = 22 + 9 * life * Math.sin(frame / 3.4);
      const [front, back] = newspaper(ear);
      return (
        <>
          <path d={back} fill={color} />
          <path d={front} fill={color} fillRule="evenodd" />
        </>
      );
    }
    if (i === 1) {
      const bob = 6 * life * Math.sin(frame / 4.2);
      return (
        <>
          {layer !== "front" ? (
            <path d={bubbleBack} fill={color} fillRule="evenodd" transform={`translate(0 ${(-bob).toFixed(2)})`} />
          ) : null}
          {layer !== "back" ? (
            <path d={bubbleFront} fill={color} fillRule="evenodd" transform={`translate(0 ${bob.toFixed(2)})`} />
          ) : null}
        </>
      );
    }
    return (
      <>
        <path d={tvBody} fill={color} fillRule="evenodd" />
        <path
          d="M-8 -58L-46 -112M8 -58L46 -112"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
      </>
    );
  };

  // the ball on the screen: it rolls a little, side to side
  const ball = (life: number, off: number) => {
    const bx = -18 + 20 * life * Math.sin(frame / 6.5);
    const rot = ((20 * life * Math.sin(frame / 6.5)) / 32) * (180 / Math.PI);
    return (
      <g transform={`translate(${(bx + off).toFixed(2)} ${12 + off})`}>
        {off ? (
          <circle r={32} fill={shadow} />
        ) : (
          <>
            <circle r={32} fill={ink} />
            <g transform={`rotate(${rot.toFixed(2)})`} stroke={blue} strokeWidth={6} fill="none">
              <path d="M0 -32V32M-25 -20Q-9 0 -25 20M25 -20Q9 0 25 20" />
            </g>
          </>
        )}
      </g>
    );
  };

  const placed = (x: number, y: number, s: number, off: number) =>
    `translate(${(x + off).toFixed(2)} ${(y + off).toFixed(2)}) scale(${s.toFixed(4)})`;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround
        src={paperSrc}
        frame={frame}
        cy={cy}
        cyRest={ITU_CAM_CY[0]}
        cx={cx}
        cxRest={DOME_CX}
        k={k}
        parallax={parallax}
        dim={paperDim}
        blur={paperBlur}
      />

      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <defs>
              {SECTOR_DEG.map((deg, i) => (
                <clipPath key={i} id={`itu-sector-${i}`}>
                  <path d={sectorPath(deg)} />
                </clipPath>
              ))}
              <mask id="itu-behind-blob" maskUnits="userSpaceOnUse" x={-200} y={0} width={1480} height={1200}>
                <rect x={-200} y={0} width={1480} height={1200} fill="#FFFFFF" />
                <g fill="#000000" stroke="#000000" strokeWidth={28} strokeLinejoin="round">
                  {bodies(0)}
                </g>
              </mask>
            </defs>

            {/* THE THREE PARTS: each sector's colour slides up from the floor,
                clipped to its own sector. It exists or it does not. */}
            {SECTOR_DEG.map((_, i) => {
              const f0 = starts[i] + 3;
              if (frame < f0) {
                return null;
              }
              const top = sectorTop(i);
              const h = DOME_BASE - top;
              const dy = (1 - prog(f0, RISE_FRAMES, EASE_LAND)) * h;
              return (
                <g key={i} clipPath={`url(#itu-sector-${i})`}>
                  <rect x={0} y={top + dy} width={FRAME_W} height={h + 4} fill={colors[i]} />
                </g>
              );
            })}

            {/* THE DOME, on its hard shadow. */}
            <g transform={`translate(${so} ${so})`}>{domeShapes(shadow)}</g>
            {domeShapes(ink)}
            <g mask="url(#itu-behind-blob)">
              <g transform={`translate(${so} ${so})`}>{lineShapes(shadow)}</g>
              {lineShapes(ink)}
            </g>

            {/* THE ICONS each third resolves into. */}
            {pieces.map((p, i) => {
              if (!p || p.icon <= 0) {
                return null;
              }
              if (i === 1) {
                // back bubble, then the front one with its own shadow over it
                return (
                  <g key={i}>
                    <g transform={placed(p.x, p.y, p.icon, so)}>{iconShapes(i, shadow, p.life, "back")}</g>
                    <g transform={placed(p.x, p.y, p.icon, 0)}>{iconShapes(i, ink, p.life, "back")}</g>
                    <g transform={placed(p.x, p.y, p.icon, so)}>{iconShapes(i, shadow, p.life, "front")}</g>
                    <g transform={placed(p.x, p.y, p.icon, 0)}>{iconShapes(i, ink, p.life, "front")}</g>
                  </g>
                );
              }
              return (
                <g key={i}>
                  <g transform={placed(p.x, p.y, p.icon, so)}>{iconShapes(i, shadow, p.life, "all")}</g>
                  <g transform={placed(p.x, p.y, p.icon, 0)}>{iconShapes(i, ink, p.life, "all")}</g>
                  {i === 2 ? (
                    <g transform={placed(p.x, p.y, p.icon, 0)}>
                      {ball(p.life, so)}
                      {ball(p.life, 0)}
                    </g>
                  ) : null}
                </g>
              );
            })}

            {/* THE BLOB AND ITS THIRDS, in front of the icons: every shadow
                first, then every white, so overlapping pieces read as one body
                until they part. */}
            <g fill={shadow}>{bodies(so)}</g>
            <g fill={ink}>{bodies(0)}</g>
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default InsideTheUltradome;
