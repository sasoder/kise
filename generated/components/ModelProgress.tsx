import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/LibreBaskerville";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { z } from "zod";

const { fontFamily: serif } = loadSerif("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: mono } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

export const schema = z.object({ paper: z.string(), ink: z.string(), accent: z.string() });
export const defaultProps = schema.parse({ paper: "brown-paper.png", ink: "#28251f", accent: "#943d2b" });

// Kraft-paper editorial drawing. Ink = structure; rust = the halted capability frontier.
// Keep the model graph fixed after the stop; keep the SAME product modules during rebuilding.
// Source SRT 00:00.000–00:04.879, quantized at 24fps; bottom 240px reserved for captions.
const beats = { progress: 0, models: 19, stopped: 33, building: 54, products: 68, change: 85, instantly: 100, end: 117 };
const motion = { ease: Easing.bezier(0.22, 1, 0.36, 1), fast: Easing.bezier(0.65, 0, 0.2, 1) };
const tokens = { cream: "#ede0c7", muted: "#716047", stroke: 5 };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const progress = (f: number, start: number, end: number) => interpolate(f, [start, end], [0, 1], { ...clamp, easing: motion.ease });

const Chip = ({ x, y, ink }: { x: number; y: number; ink: string }) => (
  <g transform={`translate(${x} ${y})`} stroke={ink} strokeWidth={4} fill="none">
    <rect x={-34} y={-34} width={68} height={68} rx={5} fill={tokens.cream} />
    <rect x={-17} y={-17} width={34} height={34} rx={2} />
    {[-19, 0, 19].map((n) => <g key={n}>
      <path d={`M ${n},-46 v12 M ${n},34 v12 M -46,${n} h12 M 34,${n} h12`} />
    </g>)}
  </g>
);

export default function ModelProgress({ paper, ink, accent }: z.infer<typeof schema>) {
  const frame = useCurrentFrame();
  const reveal = progress(frame, 0, beats.stopped);
  const halt = progress(frame, beats.stopped, beats.stopped + 4);
  const build = progress(frame, beats.building, beats.products + 2);
  const reform = interpolate(frame, [beats.change, beats.instantly], [0, 1], { ...clamp, easing: motion.fast });
  const label = progress(frame, beats.instantly, beats.instantly + 4);
  const points = [{ x: 180, y: 724 }, { x: 386, y: 666 }, { x: 592, y: 570 }, { x: 798, y: 443 }];
  const modules = [
    { from: [270, 1100, 220, 230], to: [270, 1100, 540, 86], fill: ink },
    { from: [510, 1100, 300, 104], to: [270, 1206, 250, 124], fill: tokens.cream },
    { from: [510, 1224, 300, 106], to: [540, 1206, 270, 124], fill: tokens.cream },
  ];

  return <AbsoluteFill style={{ backgroundColor: "#b79a6f", color: ink }}>
    <Img src={staticFile(paper)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #ead8ac20, #49331812)" }} />

    <div style={{ position: "absolute", top: 219, left: 100, width: 880, textAlign: "center", fontFamily: serif, fontSize: 74, letterSpacing: -3 }}>Model progress</div>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", overflow: "visible" }}>
      {/* Diagram, deliberately without invented data or numeric axes. */}
      <path d="M 143,398 L 143,791 L 918,791" fill="none" stroke={ink} strokeWidth={3} opacity={0.35} />
      <path d="M 909,782 L 920,791 L 909,800" fill="none" stroke={ink} strokeWidth={3} opacity={0.35} />
      <path d="M 180,724 L 386,666 L 592,570 L 798,443" pathLength={1} stroke={ink} strokeWidth={6} fill="none" strokeDasharray={1} strokeDashoffset={1 - reveal} strokeLinecap="round" />
      {points.map((point, i) => {
        const p = progress(frame, i * 8, i * 8 + 7);
        return <g key={i} opacity={p} transform={`translate(0 ${16 * (1 - p)})`}>
          <Chip x={point.x} y={point.y} ink={ink} />
        </g>;
      })}
      {/* A halt is a physical brake at the frontier, never a falling model line. */}
      <g opacity={halt} transform={`translate(798 443) scale(${1.3 - halt * 0.3})`}>
        <circle r={66} fill={tokens.cream} stroke={accent} strokeWidth={7} />
        <path d="M -15,-24 v48 M 15,-24 v48" stroke={accent} strokeWidth={13} />
      </g>
      <g opacity={build} transform={`translate(0 ${28 * (1 - build)})`}>
        <path d="M 540,848 V 918 M 526,904 L 540,919 L 554,904" stroke={ink} strokeWidth={4} fill="none" opacity={0.55} />
        <rect x={230} y={1032} width={620} height={350} rx={11} fill={tokens.cream} stroke={ink} strokeWidth={5} />
        <path d="M 230,1072 H 850" stroke={ink} strokeWidth={4} />
        {[254, 274, 294].map((x) => <circle key={x} cx={x} cy={1052} r={4} fill={ink} />)}
        {modules.map((m, index) => {
          const [x, y, w, h] = m.from.map((v, i) => v + (m.to[i] - v) * reform);
          return <g key={index}>
            <rect x={x} y={y} width={w} height={h} rx={4} fill={m.fill} stroke={ink} strokeWidth={3} />
            {index === 0 ? <g stroke={tokens.cream} strokeWidth={4} fill="none">
              <rect x={x + 24} y={y + 23} width={39} height={39} rx={3} />
              <path d={`M ${x + 34},${y + 42} h19 M ${x + 43},${y + 33} v19`} />
              <path d={`M ${x + 85},${y + 35} h${Math.max(45, w - 115)}`} />
              <path d={`M ${x + 85},${y + 53} h${Math.max(30, w - 164)}`} opacity={0.45} />
              <path d={`M ${x + 25},${y + 112} h${w - 50} M ${x + 25},${y + 140} h${w - 80} M ${x + 25},${y + 190} h${w - 110}`} opacity={1 - reform} />
            </g> : <g stroke={ink} strokeWidth={4} fill="none">
              {index === 1 ? <>
                <circle cx={x + 35} cy={y + 34} r={11} />
                <path d={`M ${x + 65},${y + 26} h${w - 95} M ${x + 65},${y + 43} h${w - 128} M ${x + 23},${y + 73} h${w - 46}`} />
              </> : <>
                <path d={`M ${x + 23},${y + h - 23} V ${y + h - 42} M ${x + 48},${y + h - 23} V ${y + h - 62} M ${x + 73},${y + h - 23} V ${y + h - 80}`} strokeWidth={12} />
                <path d={`M ${x + 112},${y + 35} h${w - 140} M ${x + 112},${y + 55} h${w - 160}`} />
              </>}
            </g>}
          </g>;
        })}
      </g>
    </svg>
    <div style={{ position: "absolute", left: 690, top: 332, width: 240, textAlign: "center", fontFamily: mono, fontSize: 37, fontWeight: 500, color: accent, opacity: halt, transform: "rotate(-7deg)" }}>STOPPED</div>
    <div style={{ position: "absolute", left: 100, top: 948, width: 880, textAlign: "center", fontFamily: mono, fontSize: 39, letterSpacing: -1, opacity: build }}>How we build products</div>
    <div style={{ position: "absolute", left: 85, top: 1463, width: 910, textAlign: "center", fontFamily: serif, fontSize: 65, letterSpacing: -2, opacity: label, transform: `translateY(${(1 - label) * 9}px)` }}>Changes instantly.</div>
    <svg width={1080} height={1920} style={{ position: "absolute" }}><path d="M 265,1556 Q 535,1547 815,1555" stroke={accent} strokeWidth={5} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - label} /></svg>
  </AbsoluteFill>;
}
