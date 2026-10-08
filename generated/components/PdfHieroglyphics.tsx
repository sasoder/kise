import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { z } from "zod";
import { FRAME_H, FRAME_W, clamp, smoothstep } from "./fieldShared";
import { DrawingBase, DrawingLate, PH, PW } from "./pdfHieroglyphicsDrawing";

const { fontFamily } = loadFont("normal", { weights: ["900"], subsets: ["latin"] });
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["600"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
// "PDF HIEROGLYPHICS" — Hadrian 05.
//
// CHECK LINE (what the viewer can say after this cut): "The factory's
// instructions live in PDFs, and when you open one it is a wall of symbols only
// a specialist can read."
//
// DURATION. The slot is sequence 11.458 - 15.083 s at 24.000 fps:
// round(3.625 * 24) = 87 frames. No tail; the edit cuts to the speaker at 87.
// Spoken: "The industry operates basically on PDFs full of manufacturing
// hieroglyphics." Word onsets: The 0, industry 3, operates 10, basically 20,
// on 28, PDFs 32, full 48, of 53, manufacturing 58, hieroglyphics 71.
//
// THE MOTION, in three sentences. A PDF file icon (white page, folded corner,
// PDF badge) slides up into the middle of the frame behind its orange / purple
// / blue chain copies (the rise began 8 frames before the cut, so f0 is already
// travelling and the page rests by f20), which stay peeking out as a pile of sheets, while the
// camera is already creeping in. From f44 the camera pushes INTO the page in
// one smooth move (it lands at f72): the thumbnail on the page IS the drawing,
// and it resolves into a real ASME Y14.5 engineering drawing of a flanged
// bearing housing. From f46 to the cut more notation keeps drawing itself on
// (callouts, feature control frames, datum flags, a weld symbol), so the frame
// ends crowded edge to edge and still filling.
//
// THE CAMERA is analytic, as in `LittleTownInLA`: ln(scale) is a linear creep
// over the whole cut plus one smoothstep f44 -> f72, and the focal point's
// SCREEN position rides the same smoothstep, so pan and zoom are one move.
// After it lands a slow drift carries the frame across the sheet.
//
// THE LOOK: paper ground on its own plane (`PeakForSolar`'s `PaperGround`),
// white ink on a hard black +4/+4 screen-px shadow drawn as a translated SVG
// copy, raw hex, no glow, no blend mode, no opacity fade on anything. The
// chain colours appear once: the three sheets behind the page.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 87;

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const PAPER_BASE = "#C0C0C0";
const BG_OVERSIZE = 1.6;

export const schema = z.object({
  paperSrc: z.string(),
  paperDim: z.number(),
  paperBlur: z.number(),
  ink: z.string(),
  shadow: z.string(),
  orange: z.string(),
  purple: z.string(),
  blue: z.string(),
  shadowOffset: z.number(), // SCREEN px
  badge: z.string(),
  // the icon
  fold: z.number(), // page units
  stackStep: z.number(), // page units between the peeking sheets
  rise: z.number(), // frame the first (orange) sheet starts
  riseFrames: z.number(),
  riseDistance: z.number(), // SCREEN px
  // the camera
  openScale: z.number(), // screen px per page unit at f0
  creep: z.number(), // zoom gained by the creep over the whole cut
  pushRatio: z.number(), // zoom gained by the push
  pushStart: z.number(),
  pushEnd: z.number(),
  focus: z.tuple([z.number(), z.number()]), // page point the push aims at
  focusScreen: z.tuple([z.number(), z.number()]), // where it lands on screen
  drift: z.tuple([z.number(), z.number()]), // SCREEN px per frame once inside
  // debug: [page x, page y, scale] freezes the camera on the finished sheet
  debugView: z.tuple([z.number(), z.number(), z.number()]).nullable(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  paperSrc: "paper-supaclean-still.png",
  paperDim: 0.88,
  paperBlur: 3,
  ink: WHITE,
  shadow: BLACK,
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  shadowOffset: 4,
  badge: "PDF",
  fold: 230,
  stackStep: 34,
  rise: -8,
  riseFrames: 22,
  riseDistance: 1500,
  openScale: 0.58,
  creep: 0.16,
  pushRatio: 3.45,
  pushStart: 44,
  pushEnd: 72,
  focus: [790, 1050],
  focusScreen: [540, 750],
  drift: [-0.6, 0.5],
  debugView: null,
});

// -- the camera --------------------------------------------------------------
export const cameraAt = (frame: number, p: Props) => {
  if (p.debugView) {
    const [x, y, s] = p.debugView;
    return { s, tx: FRAME_W / 2 - x * s, ty: FRAME_H / 2 - y * s };
  }
  const g = smoothstep((frame - p.pushStart) / (p.pushEnd - p.pushStart));
  const sBase = p.openScale * Math.exp((Math.log(1 + p.creep) * frame) / DURATION);
  const s = sBase * Math.exp(Math.log(p.pushRatio) * g);
  const [Fx, Fy] = p.focus;
  // before the push the page sits centred, so the focal point is wherever that puts it
  const fx0 = FRAME_W / 2 + (Fx - PW / 2) * sBase;
  const fy0 = FRAME_H / 2 + (Fy - PH / 2) * sBase;
  const inside = g * Math.max(0, frame - p.pushStart);
  const fx = fx0 + (p.focusScreen[0] - fx0) * g - inside * p.drift[0];
  const fy = fy0 + (p.focusScreen[1] - fy0) * g - inside * p.drift[1];
  return { s, tx: fx - Fx * s, ty: fy - Fy * s };
};

const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const CHAIN_STAGGER = 2;

// `PeakForSolar`'s ground: the squared paper turned to cover portrait, knocked
// back, on its own slow plane.
const PaperGround: React.FC<{ src: string; frame: number; zoom: number; dim: number; blur: number }> = ({
  src,
  frame,
  zoom,
  dim,
  blur,
}) => {
  const bgScale = 1 + Math.min(0.3, Math.log(zoom) * 0.3);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE,
          height: FRAME_W * BG_OVERSIZE,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(0px, ${(-frame * 0.3).toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const PdfHieroglyphics: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const { s, tx, ty } = cameraAt(frame, p);
  const debug = p.debugView !== null;

  // one rise, sampled per sheet: fast off the mark, long ease into place
  const riseAt = (f0: number) =>
    debug ? 0 : (1 - interpolate(frame, [f0, f0 + p.riseFrames], [0, 1], { easing: EASE_LAND, ...clamp })) * p.riseDistance;

  const sheet = `M0 0H${PW - p.fold}L${PW} ${p.fold}V${PH}H0Z`;
  const coreStart = p.rise + 3 * CHAIN_STAGGER;
  const chain = [
    { color: p.orange, start: p.rise, n: 3 },
    { color: p.purple, start: p.rise + CHAIN_STAGGER, n: 2 },
    { color: p.blue, start: p.rise + 2 * CHAIN_STAGGER, n: 1 },
  ];
  const place = (dy: number, offPage = 0, offScreen = 0) =>
    `translate(${(tx + offScreen - offPage * s).toFixed(3)} ${(ty + dy + offScreen - offPage * s).toFixed(3)}) scale(${s.toFixed(5)})`;
  const coreDy = riseAt(coreStart);
  const pageOn = debug || frame >= coreStart;

  // the badge: a black plate with PDF knocked out in white, upper half of the page
  const badge = { x: 92, y: 262, w: 640, h: 326, size: 300 };
  const foldW = 10;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround src={p.paperSrc} frame={frame} zoom={s / p.openScale} dim={p.paperDim} blur={p.paperBlur} />
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="pdfh-sheet">
            <path d={sheet} />
          </clipPath>
        </defs>

        {/* the hard shadow, on the white page's own timing */}
        {pageOn ? <path d={sheet} transform={place(coreDy, 0, p.shadowOffset)} fill={p.shadow} /> : null}

        {/* THE CHAIN: three sheets on the same path, two frames apart, which
            stay peeking out up and to the left as a pile of PDFs */}
        {chain.map((c) =>
          debug || frame >= c.start ? (
            <path key={c.color} d={sheet} transform={place(riseAt(c.start), c.n * p.stackStep)} fill={c.color} />
          ) : null,
        )}

        {/* THE PAGE, and the drawing that is on it from the start */}
        {pageOn ? (
          <g transform={place(coreDy)}>
            <path d={sheet} fill={p.ink} />
            <g clipPath="url(#pdfh-sheet)" style={{ fontFamily: monoFamily, fontWeight: 600 }}>
              <DrawingBase />
              <DrawingLate frame={debug ? 999 : frame} />
            </g>
            {/* the folded corner */}
            <path
              d={`M${PW - p.fold} 0V${p.fold}H${PW}Z`}
              fill={p.ink}
              stroke={p.shadow}
              strokeWidth={foldW}
              strokeLinejoin="miter"
            />
            {/* the badge */}
            <rect x={badge.x} y={badge.y} width={badge.w} height={badge.h} fill={p.shadow} />
            <text
              x={badge.x + badge.w / 2}
              y={badge.y + badge.h / 2 + 0.35 * badge.size}
              textAnchor="middle"
              fill={p.ink}
              style={{ fontFamily, fontWeight: 900, fontSize: badge.size, letterSpacing: "0.02em" }}
            >
              {p.badge}
            </text>
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

export default PdfHieroglyphics;
