// ---------------------------------------------------------------------------
// SpreadsForACentury (kyle-vaccine, cut 53). Dwarkesh 3D style (styles/dwarkesh-3d.md): a 3D cut flying over a baked
// map laid as a ground (the pattern of kyle-pandemics/RodentFromCentralAsia.tsx), inside the misty teal air.
// Opaque 1080x1920, 29.97 fps, 133 frames. RENDER WITH --gl=angle (the ground is WebGL2).
//
// CHECK LINE: "The smallpox-inoculation trick came out of Africa and China and crept across the map for generations
// until, in one English village, Jenner found the vaccine."
//
// THE LINE: "[And so we actually don't know where that comes from. It may come from Africa. It may come from China.]
// It spreads for like a century or more before Jenner discovered [vaccine]."
// WORD -> FRAME (f0 = 53.287 s): It -5 · SPREADS 2 · for 7 · like 17 · a 21 · CENTURY 24 · or 36 · more 45 · before 53 ·
//   JENNER 71 · DISCOVERED 87 · (And 106) · end 133.
// DURATION: the slot 53.287 -> 57.724 s = 4.437 s x 29.97 = 133 frames (f0..f132).
//
// THE MOTION: one continuous camera over a baked map of Africa, Europe and western Asia (land the style's warm
// sand-umber, sea a deeper air-petrol, soft coast, no borders), high and oblique, always looking north
// (spreadCamera.ts: one Bezier glide from over the Sahara round the eastern Mediterranean and north-west onto England,
// D 6200 -> 1000, pitch 45 -> 53 deg, one speed lobe peaking ~f44 (centre pan <= ~32 px/frame), then a slow creep). f0: the practice (SMALLPOX
// plum, a matte stain with ink dots, soft ink-in-paper edges) already lies over West Africa (low in frame, ~y 1130-1300)
// and comes in as a line from the frame's east edge, labelled AFRICA (over the Sahara) and CHINA (just north of the
// line) in caps ~35 px on soft plates, lying on the ground, sliding up f0-f10, readable to ~f34 / ~f36; each sinks
// back into the air before the move would carry it out of frame or into a caption band. As the camera settles on
// England (f62-f86) the continent's plum recedes 25 % so Britain and the orange lead. f0-f60 the plum creeps town by town along the
// trade roads (spreadPlan.ts: each trail's tip at a constant speed, each town's dot inking when the tip reaches it):
// across Persia and Anatolia to Constantinople (f22), up over the Sahara to Tripoli and Fez, then across Europe to
// London (f49) and out over Britain and the near continent; Berkeley is the old trick's last station (its dot inks
// f62). CAUSE: the orange kindles AT the Berkeley plum dot (contact: the dot is there from f62; first reaction: the
// point lights on f71, "Jenner"), one eased ramp f70 -> f87 (lit from f71) to a soft glow warming the land round it ("discovered");
// the medium's bloom picks it out. f90-f132 a settled living frame: England and the near continent, plum everywhere,
// the stains still creeping, the one orange glow near the middle (Berkeley y ~905-925).
// Orange = THE VACCINE only (the light at Berkeley); SMALLPOX plum = the inoculation practice's spread; the map and
// the air in the style's earthy tones. No years, no numbers, no arrows; labels only AFRICA and CHINA.
//
// DEPTH: a pinhole camera (F 1300 px) aimed at a ground target from a distance D, pitched down, yawed to the local LCC
// meridian; the map's world px are the ground plane (Y = 0); the ground is ray-cast per pixel (spreadGround.tsx), the
// labels are affine maps of the ground at their anchors. Haze into the air by distance / D (spreadGround), the air's
// medium (AirStage, palette A, mood day) on top: shafts, motes, grade, vignette, grain, bloom on orange.
//
// SOURCES: Natural Earth 10m through scripts/maps/configs/vaccine.mjs (LCC 20/50 N, centre 10 E, Berkeley at (0, 0)).
//   The history and every town of the spread: spreadPlan.ts header (variolation in China by the 16th c.; West Africa,
//   Onesimus and Cotton Mather, Boston 1721; Lady Mary Wortley Montagu at Constantinople, letter of 1 April 1717, son
//   inoculated 1718, daughter in London 1721; the Suttons 1760s; Jenner at Berkeley, Gloucestershire, 51.69 N 2.46 W,
//   14 May 1796).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { z } from "zod";
import { AIR, AirStage, makeAirView, type AirScene } from "../kits/dwarkesh-3d/dwarkesh3d";
import { DURATION, FPS, H, W, camAt, horizonY, toScreen, type Cam } from "./spreadCamera";
import { SpreadGround } from "./spreadGround";
import { LABELS, type GLabel } from "./spreadPlan";
import { project } from "./spreadMapData";

export { DURATION, FPS };
export const schema = z.object({});
export const defaultProps = schema.parse({});

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });

const INK = AIR.A.cream;
/** the medium's dense low air (ramp t ~0.7) */
const LOW_AIR = "#3D342B";

// ---------------------------------------------------------------------------
// THE AIR: the medium in the map's world px (the pandemics crane's scene, motes laid out more sparsely for the long
// descent)
// ---------------------------------------------------------------------------
const AIR_SCENE: AirScene = { look: "A", mood: "day", F: 1300, fogNear: 400, fogVis: 3000, fogMax: 0.9, hLow: 0, hHigh: 2600, moteUnit: 2400 };
const camOf = (c: Cam) => ({ x: c.C[0], y: c.C[1], z: -c.C[2] });
const to01 = (c: [number, number, number]) => c.map((q) => q / 255) as [number, number, number];

// ---------------------------------------------------------------------------
// THE LABELS: lying on the ground at their anchors (an affine of the ground there: text x along the local east, text y
// along the local south), sized so the caps are `size` screen px on f0, then world space (they scale with the camera).
// In: slide 26 px up the ground while fading in, f0 -> f10. Out: before the move would carry its plate into a caption
// band or its text across the frame's edge (no sliver at the edge; found by scanning the camera, LABEL_OUT), it sinks
// back into the air (slides down, fades) over OUT_T frames.
// ---------------------------------------------------------------------------
const IN = { f0: 0, f1: 10, lift: 26 };
const OUT_T = 7;
/** the text's width in font units (Fell SC caps + 0.16 em tracking), approx. */
const textW = (L: GLabel) => 0.84 * L.size * L.text.length;
/** the stacked first line: its size (a fraction of the word's) and how far above the word's baseline it sits (in sizes) */
const PRE = { scale: 0.56, dy: 1.08 };
const labelGeo = (cam: Cam, L: GLabel) => {
  const [x, zz] = project(L.lon, L.lat);
  const e = project(L.lon + 0.2, L.lat);
  const nn = project(L.lon, L.lat + 0.2);
  const ex = [e[0] - x, e[1] - zz];
  const el = Math.hypot(ex[0], ex[1]);
  const east = [ex[0] / el, ex[1] / el];
  const sx = [x - nn[0], zz - nn[1]];
  const sl = Math.hypot(sx[0], sx[1]);
  const south = [sx[0] / sl, sx[1] / sl];
  const p = toScreen(cam, x, 0, zz);
  const pe = toScreen(cam, x + east[0], 0, zz + east[1]);
  const ps = toScreen(cam, x + south[0], 0, zz + south[1]);
  return { p: [p.x, p.y], je: [pe.x - p.x, pe.y - p.y], js: [ps.x - p.x, ps.y - p.y] };
};
/** font px -> world px: the caps are L.size screen px tall on f0 */
const labelK = (L: GLabel) => {
  const g = labelGeo(camAt(0), L);
  return 1 / Math.hypot(g.je[0], g.je[1]);
};
/** the label's box on screen at frame f (corners of its local box through the ground affine): the plate, or the text */
export const labelBox = (f: number, L: GLabel, part: "plate" | "text" = "plate") => {
  const g = labelGeo(camAt(f), L);
  const k = labelK(L);
  const hw = (part === "plate" ? 0.62 : 0.52) * textW(L);
  const hh = (part === "plate" ? 0.9 : 0.45) * L.size;
  // a small first line ("FROM") stacks above the word, north of it on the ground
  const top = -hh - (L.pre ? PRE.dy * L.size : 0);
  const pts = [
    [-hw, top],
    [hw, top],
    [hw, hh],
    [-hw, hh],
  ].map(([u, v]) => [g.p[0] + (g.je[0] * u + g.js[0] * v) * k, g.p[1] + (g.je[1] * u + g.js[1] * v) * k]);
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
};
const BAND_TOP = 1080;
/** the first frame each label's plate would touch a caption band, or its text the frame's edge (DURATION if never) */
export const LABEL_OUT = LABELS.map((L) => {
  for (let f = 0; f < DURATION; f++) {
    const b = labelBox(f, L);
    const t = labelBox(f, L, "text");
    if (b.y1 > BAND_TOP - 6 || t.x0 < 10 || t.x1 > W - 10) return f;
  }
  return DURATION;
});

const GroundLabel: React.FC<{ cam: Cam; frame: number; L: GLabel; out: number }> = ({ cam, frame, L, out }) => {
  const ease = Easing.bezier(0.16, 1, 0.3, 1);
  const uIn = interpolate(frame, [IN.f0, IN.f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const uOut = interpolate(frame, [out - OUT_T, out - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.55, 1) });
  const op = Math.min(interpolate(frame, [IN.f0, IN.f0 + 8], [0.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 1 - uOut);
  if (op <= 0.001) return null;
  const g = labelGeo(cam, L);
  const k = labelK(L);
  // the slide, in screen px along the ground's north (up the frame): up into place, then down into the air
  const jsl = Math.hypot(g.js[0], g.js[1]);
  const shift = (IN.lift * (1 - uIn) - 0.6 * IN.lift * uOut) / Math.max(1e-6, jsl * k);
  const ox = g.p[0] + g.js[0] * k * shift;
  const oy = g.p[1] + g.js[1] * k * shift;
  const m = [g.je[0] * k, g.je[1] * k, g.js[0] * k, g.js[1] * k, ox, oy];
  if (m.some((v) => !Number.isFinite(v))) return null;
  const tw = textW(L);
  const id = `sfc-pl-${L.text}`;
  return (
    <g transform={`matrix(${m.map((v) => v.toFixed(5)).join(",")})`} opacity={op}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={AIR.A.shadow} stopOpacity={0.5} />
          <stop offset="0.55" stopColor={AIR.A.shadow} stopOpacity={0.3} />
          <stop offset="1" stopColor={AIR.A.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={L.pre ? -0.42 * PRE.dy * L.size : 0} rx={tw * 0.66} ry={L.size * (L.pre ? 0.95 + 0.5 * PRE.dy : 0.95)} fill={`url(#${id})`} />
      {L.pre ? (
        <text
          x={0.08 * L.size * PRE.scale}
          y={L.size * 0.36 - PRE.dy * L.size}
          textAnchor="middle"
          fill={INK}
          stroke={AIR.A.line}
          strokeOpacity={0.85}
          strokeWidth={L.size * PRE.scale * 0.16}
          strokeLinejoin="round"
          paintOrder="stroke"
          style={{ fontFamily: fellSC, fontSize: L.size * PRE.scale, letterSpacing: `${0.16 * L.size * PRE.scale}px` }}
        >
          {L.pre}
        </text>
      ) : null}
      <text
        x={0.08 * L.size}
        y={L.size * 0.36}
        textAnchor="middle"
        fill={INK}
        stroke={AIR.A.line}
        strokeOpacity={0.85}
        strokeWidth={L.size * 0.16}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: fellSC, fontSize: L.size, letterSpacing: `${0.16 * L.size}px` }}
      >
        {L.text}
      </text>
    </g>
  );
};

const SpreadsForACentury: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const v = makeAirView({ scene: AIR_SCENE, frame, horizon: horizonY(cam), cam: camOf(cam), rest: camOf(camAt(0)) });
  const near = v.airAt(cam.D * 1.5, 0);
  const far = v.airAt(1e9, 0);
  return (
    <AbsoluteFill style={{ backgroundColor: AIR.A.ground.mid }}>
      <AirStage v={v} bloom={0.22}>
        <SpreadGround cam={cam} frame={frame} air={{ near: to01(near), far: to01(far), shadow: AIR.A.shadow }} />
        {/* the lower frame sinks into the dense low air (styles/dwarkesh-3d.md: no flat dead face in the bottom third) */}
        <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${LOW_AIR}00 0%, ${LOW_AIR}00 64%, ${LOW_AIR}5c 86%, ${LOW_AIR}80 100%)` }} />
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          {LABELS.map((L, i) => (
            <GroundLabel key={L.text} cam={cam} frame={frame} L={L} out={LABEL_OUT[i]} />
          ))}
        </svg>
      </AirStage>
    </AbsoluteFill>
  );
};

export default SpreadsForACentury;
