// ---------------------------------------------------------------------------
// ExecutionOutweighs (nik-any-idea, cut 4). Cheeky Pint style, the stout board (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 74 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "the idea counts, but execution weighs far more."
//
// THE LINE (Nik Storonsky): "even though the idea is important, I think it's about execution."
// WORD -> FRAME (from the composition start): even f-4 · though f4 · (the) idea f6 · is f15 · important f26 ·
// I f41 · think f42 · it's f46 · about f50 · execution f56.
// DURATION: the slot 4.880 -> 7.966 s = 3.086 s x 23.976 = 74 frames (f0..f73), the slot exactly.
//
// THE MOTION: a tall cream balance scale on the board (pivot y 422, hangers 468, wide matched dishes 52 deep).
// The idea bulb sits on the LEFT pan from f0, the beam already rocking gently. On "idea" (f6) the bulb lights:
// its filament warms f-1 -> f6 and a soft CREAM halo opens with it (not amber: amber is execution). On
// "important" (f26) the idea's pan dips a little (an angular kick at f21, deepest -6.5 deg on f26-27): the idea
// has some weight. The camera holds close on the bulb's pan through the idea, then eases out to the whole scale
// f10-36. From ~f35 ten amber execution blocks pour in from just above the frame's top edge over the right pan
// and land in quick succession into a 4-3-2-1 pyramid that rises far above the pan rim: the first two balance
// and pass the idea (the beam crosses level ~f49.5), the rest tip it decisively RIGHT-down: 19.2 deg on
// "execution" (f56), peak 20.4 at f58-60, settled 19.6 by f64, then the living hold (19.3) to f73 under a slow
// creep. The resolved frame fills y ~298 (left hook) to ~1044 (low pan).
// Physics (executionScale.ts): the beam is a damped spring toward the torque angle of the weights; pans hang
// plumb from the beam ends; a block enters moving 54 px/f, speeds up at 6 px/f^2 to a terminal 66 px/f (never
// more than ~68 screen px in a frame) and lands on what is under it.
// CONTACT FRAMES (a block's foot touches the pan or the blocks under it; the beam's first reaction is the next
// frame). Bottom row (pan): f47 (x-126, x+42), f48 (x+126, x-42) · row 2: f50 (x-84, x0), f51 (x+84) ·
// row 3: f52 (x-42), f53 (x+42) · top: f55. Same-frame pairs are never neighbours (a pour, not a formation);
// every block lands >= 2 frames after those under it.
// The blocks fall lifted (their own float shadow) and so pass OVER the beam's right arm and the hanger rods,
// the board's grammar for something above the card; on contact they join the scale's one union shadow.
// Checked per frame (probe script): no two blocks overlap; each enters through the top edge inside the frame;
// the pyramid clears the rods by >= 8 px; the low pan clears the foot by >= 22 px; pans < y 1052 incl. sway.
// LABEL: none by default (the user, Nov 13: "we shouldn't write out execution"). Optional: "EXECUTION" (45 px) in ink on the right pan's front face, rising out of the pan's lower
// edge f44 -> f56 (labels prop; "both" adds IDEA on the left pan by f10; "none").
// CAMERA: k 1.38-1.41 on the bulb's pan (creeping in), out to the whole scale f10-36 (k 1), then a creep to
// k ~1.01. The narrow foot dips into the top caption band during the opening close-up only (context, no detail).
// AMBER = what makes an idea work (here: the execution blocks); cream = the subject (the scale, the unlit
// idea bulb); nothing else glows.
//
// SOURCES: none (no figures, no logos). The idea bulb is builder D's shared IdeaBulb (./ideaBulb).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  Label,
  METRIC,
  StoutStage,
  amberBandFor,
  bloomFilter,
  clamp01,
  mixHex,
  rectPath,
  smoothstep,
} from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, makeClockCam, makePoolTrack, type SilItem } from "../kits/cheeky-pint/museShared";
import { BULB, IdeaBulb, bulbGlass, bulbSilhouette } from "./ideaBulb";
import { ARM, CONTACT, HANG, PAN, PIVOT, ROD_AT, ROD_W, blockAt, blockRect, endsAt, type BlockState } from "./executionScale";

/** The user asked for everything 190 px lower (Nov 13): the whole picture shifts down in screen px (StoutStage dy). */
const SHIFT_Y = 190;

export const FPS = 24000 / 1001;
export const DURATION = 74;
export const schema = z.object({
  /** labels in ink on the pans' front faces, rising out of the pan's lower edge: EXECUTION lands on f56
   *  ("execution"), IDEA by f10. The bulb reads alone; the amber blocks need their name. */
  labels: z.enum(["execution", "both", "none"]).default("none"), // Nov 13: the user asked for no EXECUTION text
});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// --- geometry (WORLD px; = screen px at the wide) -----------------------------------------------------------
const BEAM = { mid: 48, end: 28, knob: 22 } as const; // thickness at the pivot / at the ends; the end knobs' radius
const HUB = { r: 38, pin: 13 } as const;
const POST = { w: 44, top: PIVOT.y, foot: 1010 } as const;
const BASE = { top: 1010, bottom: 1048, wTop: 70, wBot: 108 } as const; // narrow: the low pan swings in beside it
const BULB_SIZE = 150;

/** the beam in its own frame (x along the beam from the pivot, y down), tapered, round-ended */
const BEAM_D = (() => {
  const a = BEAM.mid / 2;
  const b = BEAM.end / 2;
  const L = ARM;
  return (
    `M${-L} ${-b}L${-40} ${-a}H${40}L${L} ${-b}` +
    `A${b} ${b} 0 0 1 ${L} ${b}L${40} ${a}H${-40}L${-L} ${b}A${b} ${b} 0 0 1 ${-L} ${-b}Z`
  );
})();
const BEAM_TOP_D = `M${-ARM} ${-BEAM.end / 2}L${-40} ${-BEAM.mid / 2}H${40}L${ARM} ${-BEAM.end / 2}`;
const circleD = (cx: number, cy: number, r: number) =>
  `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 0 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 0 ${f3(cx + r)} ${f3(cy)}Z`;
const POST_D = rectPath(PIVOT.x - POST.w / 2, POST.top, POST.w, POST.foot - POST.top + 2, 0);
const BASE_D = (() => {
  const { top, bottom, wTop, wBot } = BASE;
  const r = 5;
  const x = PIVOT.x;
  return (
    `M${x - wTop / 2 + r} ${top}H${x + wTop / 2 - r}Q${x + wTop / 2} ${top} ${x + wTop / 2 + 2} ${top + 4}` +
    `L${x + wBot / 2} ${bottom - r}Q${x + wBot / 2 + 1} ${bottom} ${x + wBot / 2 - r} ${bottom}H${x - wBot / 2 + r}` +
    `Q${x - wBot / 2 - 1} ${bottom} ${x - wBot / 2} ${bottom - r}L${x - wTop / 2 - 2} ${top + 4}Q${x - wTop / 2} ${top} ${x - wTop / 2 + r} ${top}Z`
  );
})();
/** a pan (a shallow dish) whose top surface is centred at (x, y) */
const panD = (x: number, y: number) => {
  const { top: t, bottom: b, depth: d } = PAN;
  return (
    `M${f3(x - t)} ${f3(y)}H${f3(x + t)}` +
    `C${f3(x + t)} ${f3(y + d * 0.55)} ${f3(x + b + 18)} ${f3(y + d)} ${f3(x + b)} ${f3(y + d)}` +
    `H${f3(x - b)}C${f3(x - b - 18)} ${f3(y + d)} ${f3(x - t)} ${f3(y + d * 0.55)} ${f3(x - t)} ${f3(y)}Z`
  );
};
const rodsD = (hook: { x: number; y: number }, panY: number) =>
  `M${f3(hook.x)} ${f3(hook.y)}L${f3(hook.x - ROD_AT)} ${f3(panY)}M${f3(hook.x)} ${f3(hook.y)}L${f3(hook.x + ROD_AT)} ${f3(panY)}`;

// --- the camera ---------------------------------------------------------------------------------------------
// Opens close on the bulb's pan (k 1.35, the bulb a touch left of centre, the hub and post at the right),
// eases out to the whole scale f2-26 (k 1, look (540, 960): world = screen) so the right pan is in frame
// before the first block enters (~f23), then a slow creep in that never stops (no closing pull-back).
const OPEN = { k: 1.35, bulb: { x: endsAt(0).L.x, y: endsAt(0).L.y + HANG - BULB_SIZE / 2 }, at: { x: 440, y: 840 } } as const;
const LOOK0 = { x: OPEN.bulb.x - (OPEN.at.x - 540) / OPEN.k, y: OPEN.bulb.y - (OPEN.at.y - 960) / OPEN.k, k: OPEN.k };
export const CAM = makeClockCam(
  LOOK0,
  [
    { f0: -24, f1: 16, k: 1.42, dx: 4 }, // the creep on the bulb, already running on f0 (idea ... important)
    { f0: 10, f1: 36, dx: 540 - LOOK0.x - 4, dy: 960 - LOOK0.y, k: 1.0, warp: 0.9 }, // out to the whole scale
    { f0: 34, f1: 110, k: 1.014, dy: -12 }, // the living creep
  ],
  DURATION,
);
const POOL = makePoolTrack(
  { x: OPEN.bulb.x, y: OPEN.bulb.y },
  [
    { f0: 14, f1: 36, x: 560, y: 720 },
    { f0: 42, f1: 62, x: 740, y: 820 },
  ],
  DURATION,
);

const ExecutionOutweighs: React.FC<z.infer<typeof schema>> = ({ labels }) => {
  const uid = `eo${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const f = useCurrentFrame();
  const cam = CAM.at(f);
  const k = cam.k;
  const band = amberBandFor(cam);
  const ends = endsAt(f);
  const panL = { x: ends.L.x, y: ends.L.y + HANG };
  const panR = { x: ends.R.x, y: ends.R.y + HANG };
  const rot = `rotate(${f3(ends.deg)} ${PIVOT.x} ${PIVOT.y})`;
  const beamTf = `translate(${PIVOT.x} ${PIVOT.y}) rotate(${f3(ends.deg)})`;
  const bulb = { x: panL.x, y: panL.y - BULB_SIZE / 2 };
  const blocks = CONTACT.map((_, i) => blockAt(i, f));
  const landed = blocks.filter((b): b is BlockState => !!b && b.landed);
  const falling = blocks.filter((b): b is BlockState => !!b && b.falling);

  // ONE object, ONE shadow: the scale with everything resting on it (bulb + landed blocks)
  const sil: SilItem[] = [
    { d: POST_D },
    { d: BASE_D },
    { d: BEAM_D, tf: beamTf },
    { d: circleD(ends.L.x, ends.L.y, BEAM.knob) },
    { d: circleD(ends.R.x, ends.R.y, BEAM.knob) },
    { d: circleD(PIVOT.x, PIVOT.y, HUB.r) },
    { d: rodsD(ends.L, panL.y), stroke: ROD_W },
    { d: rodsD(ends.R, panR.y), stroke: ROD_W },
    { d: panD(panL.x, panL.y) },
    { d: panD(panR.x, panR.y) },
    ...bulbSilhouette(bulb.x, bulb.y, BULB_SIZE).map((s) => ({ d: s.d })),
    ...landed.map((b) => {
      const r = blockRect(b);
      return { d: rectPath(r.x, r.y, r.w, r.h) };
    }),
  ];
  const cream = `url(#${uid}c)`;
  const edge = (d: string, tf?: string) => (
    <path d={d} transform={tf} fill="none" stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f3(EDGE.CREAM / k)} strokeLinecap="round" />
  );
  const amberBlocks = [...landed, ...falling];
  const lab = (on: number) => clamp01(on / 12);
  // "idea" (f6): the filament warms f-1 -> f6, the cream halo opens one frame behind it (full by f6.5)
  const warm = smoothstep((f + 1) / 7);
  const glow = smoothstep((f + 0.5) / 7);
  return (
    <StoutStage dy={SHIFT_Y} S={f} cam={cam} rest={CAM.rest} pool={POOL(f)}>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={PIVOT.y - 60} x2="0" y2={BASE.bottom}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
      </defs>

      <UnionShadow sil={sil} contact={{ x: PIVOT.x, y: BASE.bottom, w: BASE.wBot }} />

      {/* the stand */}
      <path d={POST_D} fill={cream} />
      <path d={BASE_D} fill={cream} />
      {edge(`M${PIVOT.x - BASE.wTop / 2 + 5} ${BASE.top + 0.75 / k}H${PIVOT.x + BASE.wTop / 2 - 5}`)}

      {/* the hangers and pans (plumb from the beam's ends) */}
      <path d={rodsD(ends.L, panL.y)} stroke={cream} strokeWidth={ROD_W} strokeLinecap="round" fill="none" />
      <path d={rodsD(ends.R, panR.y)} stroke={cream} strokeWidth={ROD_W} strokeLinecap="round" fill="none" />
      <path d={panD(panL.x, panL.y)} fill={cream} />
      <path d={panD(panR.x, panR.y)} fill={cream} />
      {edge(`M${f3(panL.x - PAN.top + 3)} ${f3(panL.y + 0.75 / k)}H${f3(panL.x + PAN.top - 3)}`)}
      {edge(`M${f3(panR.x - PAN.top + 3)} ${f3(panR.y + 0.75 / k)}H${f3(panR.x + PAN.top - 3)}`)}

      {/* the beam, its end knobs and the pivot hub */}
      <path d={BEAM_D} transform={beamTf} fill={cream} />
      {edge(BEAM_TOP_D, `${beamTf} translate(0 ${f3(0.75 / k)})`)}
      <path d={circleD(ends.L.x, ends.L.y, BEAM.knob)} fill={cream} />
      <path d={circleD(ends.R.x, ends.R.y, BEAM.knob)} fill={cream} />
      <path d={circleD(PIVOT.x, PIVOT.y, HUB.r)} fill={cream} />
      {edge(`M${PIVOT.x - HUB.r * 0.72} ${PIVOT.y - HUB.r * 0.69}A${HUB.r} ${HUB.r} 0 0 1 ${PIVOT.x + HUB.r * 0.72} ${PIVOT.y - HUB.r * 0.69}`, `translate(0 ${f3(0.75 / k)})`)}
      <path d={circleD(PIVOT.x, PIVOT.y, HUB.pin)} fill={COLOR.board} transform={rot} />

      {/* the idea: the unlit bulb on the left pan (its shadow is the scale's) */}
      <BulbHalo x={bulb.x} y={bulb.y} on={glow} id={`${uid}h`} />
      <IdeaBulb x={bulb.x} y={bulb.y} size={BULB_SIZE} k={k} lit={0} shadow={false} filament={false} />
      <WarmFilament x={bulb.x} y={bulb.y} warm={warm} k={k} />

      {/* the falling blocks' own shadows (they join the scale's once they land) */}
      {falling.map((b, i) => {
        const r = blockRect(b);
        return <UnionShadow key={i} sil={[{ d: rectPath(r.x, r.y, r.w, r.h) }]} elevation="lifted" lift={b.lift} />;
      })}

      {/* the execution blocks: amber, one bloom pass, the hot top edge */}
      <g style={{ filter: bloomFilter(k) }}>
        {amberBlocks.map((b, i) => {
          const r = blockRect(b);
          return <path key={i} d={rectPath(r.x, r.y, r.w, r.h)} fill={`url(#${uid}a)`} />;
        })}
      </g>
      {amberBlocks.map((b, i) => {
        const r = blockRect(b);
        const rr = 4;
        return (
          <path
            key={`h${i}`}
            d={`M${f3(r.x + rr)} ${f3(r.y + EDGE.HOT / k / 2)}H${f3(r.x + r.w - rr)}`}
            stroke={COLOR.amberHot}
            strokeWidth={f3(EDGE.HOT / k)}
          />
        );
      })}

      {labels === "both" ? <PanLabel pan={panL} k={k} text="idea" enter={lab(f + 2)} id={`${uid}l`} /> : null}
      {labels !== "none" ? <PanLabel pan={panR} k={k} text="execution" enter={lab(f - LABEL_IN)} id={`${uid}r`} /> : null}
    </StoutStage>
  );
};

/** A label in ink on a pan's front face (LABEL_PX screen px), clipped to the face: it rises out of the
 *  pan's lower edge into place (the kit's entrance: slide up 24 px + blur in). */
const LABEL_PX = 45; // 1.5 x the house LABEL: read on a phone, inside the 52-deep pan face
const LABEL_IN = 44; // EXECUTION: f44 -> lands f56 ("execution")
const PanLabel: React.FC<{ pan: { x: number; y: number }; k: number; text: string; enter: number; id: string }> = ({ pan, k, text, enter, id }) => (
  <g>
    <defs>
      <clipPath id={id}>
        <path d={panD(pan.x, pan.y)} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id})`}>
      <Label x={pan.x} y={pan.y + PAN.depth / 2 + (LABEL_PX * METRIC.cap) / k / 2} k={k} text={text} px={LABEL_PX} tone="dark" enter={enter} />
    </g>
  </g>
);

/** The idea's light: NOT amber (amber is execution). A soft cream halo round the glass, screen-blended,
 *  opening with the filament. */
const HALO = { r: 2.1, a0: 0.42, a1: 0.2, color: "255,246,226" } as const;
const BulbHalo: React.FC<{ x: number; y: number; on: number; id: string }> = ({ x, y, on, id }) => {
  if (on <= 0.002) return null;
  const G = bulbGlass(x, y, BULB_SIZE);
  const R = G.r * HALO.r;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f3(G.cx)} cy={f3(G.cy)} r={f3(R)}>
          <stop offset="0.3" stopColor={`rgb(${HALO.color})`} stopOpacity={f3(HALO.a0 * on)} />
          <stop offset="0.55" stopColor={`rgb(${HALO.color})`} stopOpacity={f3(HALO.a1 * on)} />
          <stop offset="1" stopColor={`rgb(${HALO.color})`} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={f3(G.cx)} cy={f3(G.cy)} r={f3(R)} fill={`url(#${id})`} />
    </g>
  );
};
/** The bulb's filament (IdeaBulb's own geometry, BULB.FIL), drawn here so it can warm WITHOUT the glass turning
 *  amber: board tone (off) -> the hot cream-gold (on), with a soft cream glow round it. */
const WarmFilament: React.FC<{ x: number; y: number; warm: number; k: number }> = ({ x, y, warm, k }) => {
  const s = BULB_SIZE;
  const F = BULB.FIL;
  const d =
    `M${f3(x - F.hw * s)} ${f3(y + F.y0 * s)}V${f3(y + F.y1 * s)}` +
    `A${f3(F.hw * s)} ${f3(F.hw * s)} 0 0 1 ${f3(x + F.hw * s)} ${f3(y + F.y1 * s)}V${f3(y + F.y0 * s)}`;
  const off = mixHex(COLOR.creamFoot, COLOR.board, 0.62);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {warm > 0.002 ? (
        <path d={d} stroke="#FFFFFF" strokeOpacity={f3(0.55 * warm)} strokeWidth={f3(F.w * s * 2.4)} style={{ filter: `blur(${f3(5 / k)}px)` }} />
      ) : null}
      <path d={d} stroke={mixHex(off, COLOR.amberHot, warm)} strokeWidth={f3(F.w * s)} />
    </g>
  );
};

export default ExecutionOutweighs;
