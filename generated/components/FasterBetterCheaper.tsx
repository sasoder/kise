import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { z } from "zod";
import countriesJson from "../../public/machina06/countries.json";
import { FRAME_H, FRAME_W, clamp01, smoothstep, sway, worldTransform } from "./fieldShared";

const { fontFamily } = loadFont("normal", {
  weights: ["800", "900"],
  subsets: ["latin"],
});

// ---------------------------------------------------------------------------
// "FASTER BETTER CHEAPER" — Hadrian Machina 06. Core memory podcast graphic
// standard (ref `PeakForSolar`): squared paper, white ink on a hard black
// +4/+4 shadow, the orange / purple / blue chain used once.
//
// CHECK LINE (what the viewer can say after this cut): "China makes the very
// same things America makes, and it is pulling away from it."
//
// DURATION. The slot is sequence 0.000 - 4.292 s at 24 fps:
// round(4.292 * 24) = 103 frames. No tail; the edit cuts to another shot at
// f103. Spoken: "China's producing everything the US does, just faster and
// better and cheaper." Word onsets: China's 0, producing 9, everything 16,
// the 32, US 34, does 40, just 53, faster 56, and 67, better 74, and 80,
// cheaper 88.
//
// THE MOTION, in three sentences. A two-lane track seen from above runs up the
// frame, already streaming at f0: the United States in the left lane and China
// in the right run level, each leaving the same goods in the same order on its
// lane (car, phone, chip, solar panel, ship). From f39 China accelerates (its
// burst peaks at f48) so that it is clearly ahead on "faster" (f56), leaving its own shape behind it in
// orange, purple and blue and dropping its goods closer together, while the
// camera eases back so China rides high and the US drops lower. From f67 the
// gap only creeps, the colour trail tucks to a short tail, and the frame keeps
// streaming to the cut.
//
// THE WORLD. Track distance s runs UP the frame: world y = -s. The US covers
// `speed` px per frame for the whole cut. China covers the same plus a lead
// G(f), the running sum of a lead velocity that is zero through f39, one skewed
// bump peaking at f48, and a small creep that never stops. Goods are left ON
// the track at fixed s, so they slide back down the lane as the racers advance;
// a good comes into existence only once its racer (and, for China, the colour
// trail) has fully cleared it, scaling 0 -> 1 from its own centre over 4
// frames. China's spacing eases from 290 to 195 track px across the break.
//
// STROBING. The dashed divider has a 300 px period (150 dash / 150 gap) and the
// track passes the camera at 34 world px per frame (about 36 screen px at the
// open, 31-40 through the pull-back): 0.11-0.13 of a period per frame, nowhere
// near a half or whole period, so the dashes always read as travelling down.
//
// THE CAMERA is analytic (frame 0 has to be moving, and a damper starts from
// rest): the US's SCREEN y and the zoom k each ride one smoothstep f39-f77, and
// cy is derived from them, so the pull-back and the tilt are one move. China's
// screen y is then the US's minus k * G.
//
// THE COLOURS, raw hex, no filter on the ink, no blend mode, no glow, no
// opacity fade: white #FFFFFF on black #000000, and orange #FFB765 / purple
// #BC37FF / blue #0046FF, which have ONE job: they are China's own shape left
// behind it as it pulls away. Stack, back to front: shadow, orange, purple,
// blue, white.
//
// The silhouettes are Natural Earth 1:50m outlines baked by
// `scripts/build-machina06-countries.mjs` (contiguous 48; mainland China
// only), each in its own Albers conic.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 103;

type Country = { w: number; h: number; d: string };
const countries = countriesJson as { us: Country; china: Country };

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const PAPER_BASE = "#C0C0C0";
const BG_OVERSIZE_FBC = 1.6;

export const schema = z.object({
  paperSrc: z.string(),
  paperDim: z.number(),
  paperBlur: z.number(),
  parallax: z.number(),
  ink: z.string(),
  shadow: z.string(),
  orange: z.string(),
  purple: z.string(),
  blue: z.string(),
  shadowOffset: z.number(), // WORLD px
  labels: z.object({ us: z.string(), china: z.string() }),
  labelSize: z.number(),
  usWidth: z.number(),
  chinaWidth: z.number(),
  iconSize: z.number(), // px per 100 icon units
  // the track
  laneX: z.tuple([z.number(), z.number()]),
  edgeX: z.tuple([z.number(), z.number()]),
  lineWidth: z.number(),
  dashPeriod: z.number(),
  dashLength: z.number(),
  // the race
  speed: z.number(), // world px per frame, both racers
  breakFrame: z.number(), // China starts to pull away
  burstFrames: z.number(), // length of the burst; it peaks a third of the way in
  burstPeak: z.number(), // extra px per frame at the peak
  creep: z.number(), // extra px per frame China keeps for good
  spacingLevel: z.number(), // track px between goods, both lanes
  spacingAhead: z.number(), // track px between China's goods once it breaks
  spacingRamp: z.number(), // track px over which China's spacing eases down
  // the trail
  trailGain: z.number(),
  trailRest: z.number(),
  // the camera
  kOpen: z.number(),
  kDrift: z.number(), // zoom lost per frame, the whole cut
  kPull: z.number(), // zoom lost by the pull-back
  pullFrames: z.number(),
  usScreenLevel: z.number(),
  usScreenRest: z.number(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  paperSrc: "paper-supaclean-still.png",
  paperDim: 0.88,
  paperBlur: 3,
  parallax: 0.13,
  ink: WHITE,
  shadow: BLACK,
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  shadowOffset: 4,
  labels: { us: "US", china: "CHINA" },
  labelSize: 62,
  usWidth: 420,
  chinaWidth: 410,
  iconSize: 1.6,
  laneX: [308, 782],
  edgeX: [64, 1016],
  lineWidth: 12,
  dashPeriod: 300,
  dashLength: 150,
  speed: 34,
  breakFrame: 39,
  burstFrames: 27,
  burstPeak: 23.5,
  creep: 2.1,
  spacingLevel: 290,
  spacingAhead: 195,
  spacingRamp: 1100,
  trailGain: 0.53,
  trailRest: 11,
  kOpen: 1.055,
  kDrift: 0.0004,
  kPull: 0.115,
  pullFrames: 38,
  usScreenLevel: 850,
  usScreenRest: 925,
});

// -- the race ----------------------------------------------------------------
const LEAD_IN = 40; // the race began this many frames before the cut
// China's lead over the US, in track px, at an integer frame.
export const leadAt = (frame: number, p: Props) => {
  let g = 0;
  for (let f = p.breakFrame + 1; f <= frame; f++) {
    const t = (f - p.breakFrame) / p.burstFrames;
    const bump = t < 1 ? (t * (1 - t) * (1 - t) * 27) / 4 : 0;
    g += p.burstPeak * bump + p.creep * smoothstep((f - p.breakFrame) / 24);
  }
  return g;
};
export const usDistance = (frame: number, p: Props) => p.speed * (frame + LEAD_IN);

// -- the camera --------------------------------------------------------------
export const cameraAt = (frame: number, p: Props) => {
  const g = smoothstep((frame - p.breakFrame) / p.pullFrames);
  const k = p.kOpen - p.kDrift * frame - p.kPull * g;
  const usScreen = p.usScreenLevel + (p.usScreenRest - p.usScreenLevel) * g;
  // screen y = 960 + (worldY - cy) * k, and the US is at world y = -distance
  const cy = -usDistance(frame, p) - (usScreen - FRAME_H / 2) / k;
  return { k, cy, usScreen, chinaScreen: usScreen - k * leadAt(frame, p) };
};

// -- the goods: chunky flat glyphs in a 100-unit box centred on (0, 0) --------
// One path each, nonzero fill: shapes run clockwise, holes anticlockwise.
const n1 = (v: number) => Number(v.toFixed(2));
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
const rrHole = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}A${r} ${r} 0 0 0 ${x} ${y + r}V${y + h - r}A${r} ${r} 0 0 0 ${x + r} ${y + h}H${x + w - r}A${r} ${r} 0 0 0 ${x + w} ${y + h - r}V${y + r}A${r} ${r} 0 0 0 ${x + w - r} ${y}Z`;
const disc = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}Z`;
const discHole = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;

const CAR = [
  // one solid body with the wheels fused to it; windows and hubs are cut-outs
  "M-50 16L-50 -5Q-50 -13 -41 -14L-33 -16L-22 -35Q-20 -38 -16 -38L16 -38Q20 -38 22 -35L34 -16L43 -14Q50 -12.5 50 -5L50 16Z",
  disc(-27, 17, 14),
  disc(27, 17, 14),
  discHole(-27, 17, 4.5),
  discHole(27, 17, 4.5),
  "M-14 -30L-19.5 -19L-4 -19L-4 -30Z",
  "M4 -30L4 -19L20.5 -19L14 -30Z",
].join("");

// a solid slab: only the speaker slot and the home button are cut out
const PHONE = [rr(-28, -48, 56, 96, 11), rrHole(-10, -39, 20, 6, 3), discHole(0, 34, 6)].join("");

const CHIP = [
  rr(-31, -31, 62, 62, 6),
  rrHole(-9, -9, 18, 18, 2),
  ...[-18, 0, 18].flatMap((o) => [
    rr(o - 6, -47, 12, 18, 2),
    rr(o - 6, 29, 12, 18, 2),
    rr(-47, o - 6, 18, 12, 2),
    rr(29, o - 6, 18, 12, 2),
  ]),
].join("");

const SOLAR = (() => {
  const cells: string[] = [];
  const shear = (x: number, y: number) => `${n1(x - (y + 10) * 0.22)} ${n1(y)}`;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const x = -47 + c * 32;
      const y = -40 + r * 28;
      cells.push(`M${shear(x, y)}L${shear(x + 29, y)}L${shear(x + 29, y + 25)}L${shear(x, y + 25)}Z`);
    }
  }
  return [...cells, rr(-7, 13, 14, 20, 0), rr(-26, 31, 52, 11, 2)].join("");
})();

const SHIP = [
  "M-50 6L50 6L38 34L-44 34Z",
  rr(-40, -13, 21, 16, 1),
  rr(-16, -13, 21, 16, 1),
  rr(8, -13, 21, 16, 1),
  rr(-40, -32, 21, 16, 1),
  rr(-16, -32, 21, 16, 1),
  rr(33, -38, 14, 45, 1),
].join("");

const GOODS = [CAR, PHONE, CHIP, SOLAR, SHIP];
const goodAt = (i: number) => GOODS[((i % GOODS.length) + GOODS.length) % GOODS.length];

// ---------------------------------------------------------------------------
// THE GROUND. `PeakForSolar`'s `PaperGround`: the landscape photograph turned
// 90 deg to cover the portrait frame, knocked back, on its own plane. Here the
// camera travels ~3700 world px up the track, so the plane's y is passed in:
// it starts high and drifts DOWN with the track at `parallax` of its speed.
// COVERAGE: the element is 1728 x 3072 at scale 1 (576 px of vertical margin);
// at the widest camera (bgScale 0.974) the margin is 536 px, and bgY runs
// -240 .. about +215.
// ---------------------------------------------------------------------------
const PaperGround: React.FC<{
  src: string;
  bgX: number;
  bgY: number;
  k: number;
  dim: number;
  blur: number;
}> = ({ src, bgX, bgY, k, dim, blur }) => {
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE_FBC,
          height: FRAME_W * BG_OVERSIZE_FBC,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};
const BG_Y0 = -240;
const GROW_FRAMES = 4;
const TRAIL_MASK = "fbc-trail-inlet";
// the northern inlet, in the baked silhouette's units (1000 wide, centre 0,0)
const INLET = { x: 160, y: -310, w: 150, h: 100 };

const FasterBetterCheaper: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const so = p.shadowOffset;

  // -- the camera, first -----------------------------------------------------
  const cam = cameraAt(frame, p);
  const cam0 = cameraAt(0, p);
  const drift = sway(frame);
  const k = cam.k;
  const cy = cam.cy + drift.dy * 0.6;
  const cx = FRAME_W / 2 + drift.dx;
  const { tx, ty } = worldTransform(cx, cy, k);
  const worldTop = cy - FRAME_H / 2 / k;
  const worldBottom = cy + FRAME_H / 2 / k;

  // -- the race --------------------------------------------------------------
  const lead = leadAt(frame, p);
  const dUS = usDistance(frame, p);
  const dCN = dUS + lead;
  const breakS = usDistance(p.breakFrame, p);

  // -- the track -------------------------------------------------------------
  const lw = p.lineWidth;
  const midX = (p.edgeX[0] + p.edgeX[1]) / 2;
  const dashes: number[] = [];
  for (
    let n = Math.floor(-worldBottom / p.dashPeriod) - 1;
    n <= Math.ceil(-worldTop / p.dashPeriod) + 1;
    n++
  ) {
    dashes.push(-(n * p.dashPeriod) - p.dashLength);
  }
  const trackRects = (off: number, fill: string) => (
    <g fill={fill}>
      {p.edgeX.map((x) => (
        <rect key={x} x={x - lw / 2 + off} y={worldTop - 60 + off} width={lw} height={worldBottom - worldTop + 120} />
      ))}
      {dashes.map((y) => (
        <rect key={y} x={midX - lw / 2 + off} y={y + off} width={lw} height={p.dashLength} />
      ))}
    </g>
  );

  // China's own shape left behind it: each colour is where the white was 2, 4,
  // 6 frames ago in the race (not on the track, which would leave them a full
  // stride behind even at level pace), plus a short tail it keeps.
  const breaking = frame > p.breakFrame;
  const tail = smoothstep((frame - p.breakFrame) / 10);
  const echo = (i: number) =>
    p.trailGain * (lead - leadAt(frame - 2 * i, p)) + p.trailRest * i * tail;
  const chain = [
    { color: p.orange, off: echo(3) },
    { color: p.purple, off: echo(2) },
    { color: p.blue, off: echo(1) },
  ];
  const trailReach = breaking ? Math.max(0, chain[0].off) : 0;


  // -- the goods -------------------------------------------------------------
  // Left on the track at fixed s. Both lanes share the same positions and the
  // same order up to the break; after it China's come closer together.
  const nBreak = Math.floor(breakS / p.spacingLevel);
  // China's goods past the break: each step is the spacing AT that point of the
  // track, easing from spacingLevel down to spacingAhead over spacingRamp px.
  const chinaAhead: number[] = [];
  for (let s = nBreak * p.spacingLevel, n = 0; n < 60; n++) {
    s += p.spacingLevel + (p.spacingAhead - p.spacingLevel) * smoothstep((s - breakS) / p.spacingRamp);
    chinaAhead.push(s);
  }
  const goodS = (i: number, china: boolean) =>
    !china || i <= nBreak ? i * p.spacingLevel : chinaAhead[i - nBreak - 1];
  const lane = (china: boolean) => {
    const d = china ? dCN : dUS;
    const x = p.laneX[china ? 1 : 0];
    // how far behind its racer a good has to be before it exists: the
    // silhouette's half height, the glyph's own half height, a margin, and for
    // China the colour trail's reach at this frame
    const clear =
      // the taller silhouette's half height for BOTH lanes, so the two lanes'
      // goods appear on the same frame while the racers are level
      Math.max((countries.china.h * p.chinaWidth) / countries.china.w, (countries.us.h * p.usWidth) / countries.us.w) / 2 +
      50 * p.iconSize +
      14 +
      (china ? trailReach : 0);
    const perFrame = china ? dCN - (usDistance(frame - 1, p) + leadAt(frame - 1, p)) : p.speed;
    const out: { key: string; x: number; y: number; s: number; path: string }[] = [];
    for (let i = nBreak + 59; i > nBreak - 60; i--) {
      const s = goodS(i, china);
      if (s + clear >= d) continue;
      const y = -s;
      if (y > worldBottom + 120) break;
      // 0 -> 1 from its own centre over 4 frames, no overshoot
      const u = clamp01((d - s - clear) / (GROW_FRAMES * perFrame));
      out.push({ key: `${china ? "c" : "u"}${i}`, x, y, s: p.iconSize * (1 - (1 - u) * (1 - u)), path: goodAt(i) });
    }
    return out;
  };
  const goods = [...lane(false), ...lane(true)];

  // -- the racers ------------------------------------------------------------
  const usS = p.usWidth / countries.us.w;
  const cnS = p.chinaWidth / countries.china.w;
  const usY = -dUS;
  const cnY = -dCN;
  const usX = p.laneX[0];
  const cnX = p.laneX[1];

  const label = (text: string, x: number, y: number) => (
    <g
      style={{
        fontFamily,
        fontWeight: 900,
        fontSize: p.labelSize,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      <text x={x + so + p.labelSize * 0.02} y={y + so} textAnchor="middle" fill={p.shadow}>
        {text}
      </text>
      <text x={x + p.labelSize * 0.02} y={y} textAnchor="middle" fill={p.ink}>
        {text}
      </text>
    </g>
  );
  const LABEL_GAP = 22;

  // the paper drifts down with the track
  const travelled = cam0.cy - cam.cy;
  const bgY = BG_Y0 + travelled * p.parallax - drift.dy * k * p.parallax;
  const bgX = -drift.dx * k * p.parallax;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround src={p.paperSrc} bgX={bgX} bgY={bgY} k={k} dim={p.paperDim} blur={p.paperBlur} />

      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx.toFixed(3)}px, ${ty.toFixed(3)}px) scale(${k.toFixed(5)})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* THE TRACK: two edges and a dashed divider streaming down. */}
            {trackRects(so, p.shadow)}
            {trackRects(0, p.ink)}

            {/* CHINA'S SHADOW, then the one job the chain has: its shape, left behind.
                Both sit under the goods, so a good never hides in the trail. */}
            <path d={countries.china.d} transform={`translate(${cnX + so} ${n1(cnY + so)}) scale(${cnS})`} fill={p.shadow} />
            {breaking ? (
              <>
                {/* The mainland outline has a narrow inlet on its northern border,
                    west of the north-east spur. A colour copy sliding down the
                    lane shows through it as a speck INSIDE the white, so the
                    copies are hard-clipped out of that one box (silhouette
                    units). Not a fade, and nothing else of the trail is in it. */}
                <mask
                  id={TRAIL_MASK}
                  maskUnits="userSpaceOnUse"
                  x={cnX - 500}
                  y={cnY - 800}
                  width={1000}
                  height={1600}
                >
                  <rect x={cnX - 500} y={cnY - 800} width={1000} height={1600} fill="#FFFFFF" />
                  <rect
                    x={INLET.x}
                    y={INLET.y}
                    width={INLET.w}
                    height={INLET.h}
                    transform={`translate(${cnX} ${n1(cnY)}) scale(${cnS})`}
                    fill="#000000"
                  />
                </mask>
                <g mask={`url(#${TRAIL_MASK})`}>
                  {chain.map((c) => (
                    <path
                      key={c.color}
                      d={countries.china.d}
                      transform={`translate(${cnX} ${n1(cnY + c.off)}) scale(${cnS})`}
                      fill={c.color}
                    />
                  ))}
                </g>
              </>
            ) : null}

            {/* THE GOODS, the same in both lanes. */}
            {goods.map((g) => (
              <g key={g.key}>
                <path d={g.path} transform={`translate(${g.x + so} ${n1(g.y + so)}) scale(${n1(g.s)})`} fill={p.shadow} />
                <path d={g.path} transform={`translate(${g.x} ${n1(g.y)}) scale(${n1(g.s)})`} fill={p.ink} />
              </g>
            ))}

            {/* THE UNITED STATES. */}
            <path d={countries.us.d} transform={`translate(${usX + so} ${n1(usY + so)}) scale(${usS})`} fill={p.shadow} />
            <path d={countries.us.d} transform={`translate(${usX} ${n1(usY)}) scale(${usS})`} fill={p.ink} />
            {label(p.labels.us, usX, usY - (countries.us.h * usS) / 2 - LABEL_GAP)}

            {/* CHINA, the white core, in front of its trail. */}
            <path d={countries.china.d} transform={`translate(${cnX} ${n1(cnY)}) scale(${cnS})`} fill={p.ink} />
            {label(p.labels.china, cnX, cnY - (countries.china.h * cnS) / 2 - LABEL_GAP)}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default FasterBetterCheaper;
