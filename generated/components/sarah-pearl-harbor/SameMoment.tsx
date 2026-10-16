// SameMoment — Sarah Paine, "How the Depression pushed Japan to Pearl Harbor",
// cut F (sequence 00:01:28:19 - 00:01:39:11). Dwarkesh map style, PACIFIC world
// of the Pearl kit (pearlShared / pearlPacificMapData).
//
// CHECK LINE: "Pearl Harbor was only one of eight Japanese strikes across Asia
// and the Pacific at the same moment."
//
// THE MOTION (round 2): frame 0 is wide on the whole theatre, Malaya to Hawaii,
// Japan's holdings of 7 Dec 1941 in orange and JAPAN named on "Japanese". All
// eight strikes leave their real launch points together (f4), each head at its
// own constant speed, and all eight land on the same frame, "Pearl" (f28): eight
// bursts and rings set at once in one picture, PEARL HARBOR named at Hawaii. Then
// one smooth move west and in (f32-74): Hawaii's ring slides out to the right as
// the Asian theatre fills the frame, and a slow push (k +15%) runs through the
// list while each name lands beside its own ring.
//
// DURATION: the slot is frames 2131..2387 at 24 fps = 256 frames; + 12 frames of
// living tail = 268.
import React, { useLayoutEffect, useRef } from "react";
import { z } from "zod";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ACCENT, CAP_RATIO, FRAME_W, FRAME_H, INK, IslandDots, Hatch, MapPage, SHADOW, fellSC, labelIn, lin, toScreen, StrikeArc, Target, WorldSvg, greatCirclePath, type Cam, type P2, viaPath } from "./pearlShared";
import { CONVOY_VIA_LL, JAPAN_1941, MANDATE_POINTS, ORIGINS_LL, project } from "./pearlPacificMapData";
import { CAP, DURATION, FPS, JAPAN_AT, LABELS, LABEL_LEAD, MARKS, MARK_LL, SPACING, W, camAt, clamp01, type MarkId } from "./sameMomentCamera";

// the southern dimming: from just south of the equator, easing in over ~25 deg
const DIM_Y0 = project(140, -3)[1];
const DIM_Y1 = project(140, -28)[1];
const DIM_MAX = 0.42;
const DIM_STOPS: [number, number][] = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map((o) => [o, DIM_MAX * o * o * (3 - 2 * o)]);

const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export { DURATION, FPS };

export const schema = z.object({
  labels: z.object({
    japan: z.string(),
    pearl: z.string(),
    malaya: z.string(),
    philippines: z.string(),
    singapore: z.string(),
    wake: z.string(),
    island: z.string(),
    guam: z.string(),
    thailand: z.string(),
    international: z.string(),
    settlement: z.string(),
    shanghai: z.string(),
  }),
});
export const defaultProps = schema.parse({
  labels: {
    japan: "JAPAN",
    pearl: "PEARL HARBOR",
    malaya: "MALAYA",
    philippines: "PHILIPPINES",
    singapore: "SINGAPORE",
    wake: "WAKE",
    island: "ISLAND",
    guam: "GUAM",
    thailand: "THAILAND",
    international: "INTERNATIONAL",
    settlement: "SETTLEMENT",
    shanghai: "SHANGHAI",
  },
});

// ---------------------------------------------------------------------------
// THE STRIKES of 7/8 December 1941, from their real launch points (kit
// ORIGINS): all eight leave together (LAUNCH) and every head runs at its own
// constant speed so that all eight land on the same frame (LAND, on "Pearl"):
// eight rings set at once, in one picture. Pearl Harbor: the air strike from the
// carriers ~230 nmi north of Oahu. Kota Bharu and Singora: the Malaya convoy
// from Samah (Hainan) round Cape Ca Mau. Singapore from Saigon, Clark Field from
// Takao, Wake from Roi (Kwajalein), Guam from Saipan. Shanghai: the Japanese
// forces were already in the city (a ~3 km move), so its ring sets with no line.
// ---------------------------------------------------------------------------
const LAUNCH = 4;
const LAND = W.pearl; // 28
const ARRIVE = 16; // frames the Target takes to ring (rays, ring drawn round)
const ARC_W = 3.2; // screen px, + the kit's dark casing
const ARC_HEAD = 17;
const ORIGIN_OF: Record<MarkId, keyof typeof ORIGINS_LL> = {
  pearlHarbor: "kidoButai",
  kotaBharu: "samah",
  singora: "samah",
  singapore: "saigon",
  clarkField: "takao",
  wake: "roi",
  guam: "saipan",
  shanghai: "huangpu",
};
type Strike = { id: MarkId; pts: P2[] | null };
const strikePts = (id: MarkId): P2[] | null => {
  if (id === "shanghai") return null;
  if (id === "kotaBharu" || id === "singora") return viaPath([...CONVOY_VIA_LL, MARK_LL[id]].map(([lo, la]) => project(lo, la)), 14);
  return greatCirclePath(project, ORIGINS_LL[ORIGIN_OF[id]], MARK_LL[id], id === "pearlHarbor" ? -0.1 : id === "singapore" ? 0 : 0.12);
};
const STRIKE_IDS: MarkId[] = ["pearlHarbor", "kotaBharu", "singora", "singapore", "clarkField", "wake", "guam", "shanghai"];
const STRIKES: Strike[] = STRIKE_IDS.map((id) => ({ id, pts: strikePts(id) }));

// ---------------------------------------------------------------------------
// LABELS (layout in sameMomentCamera.ts): a leader, where there is one, is a
// cased cream line drawn out of the ring's edge toward the label as it lands.
// ---------------------------------------------------------------------------
const MANDATE = Object.values(MANDATE_POINTS) as P2[];
const RING_SIZE = 20; // Target ring radius = 20 k^0.2 screen px (~40 px across at the wide)
const ringR = (k: number) => RING_SIZE * Math.pow(k, 0.2);

const Leader: React.FC<{ at: P2; to: [number, number]; frame: number; appear: number; cam: Cam }> = ({ at, to, frame, appear, cam }) => {
  const u = smootherstep((frame - (appear - 3)) / 9);
  if (u <= 0) return null;
  const k = cam.k;
  const d = Math.hypot(to[0], to[1]);
  const r0 = ringR(k) + 4;
  const r1 = d - 6;
  const r = r0 + (r1 - r0) * u;
  const ux = to[0] / d;
  const uy = to[1] / d;
  const p0: P2 = [at[0] + (ux * r0) / k, at[1] + (uy * r0) / k];
  const p1: P2 = [at[0] + (ux * r) / k, at[1] + (uy * r) / k];
  const dd = `M${p0[0]},${p0[1]}L${p1[0]},${p1[1]}`;
  return (
    <g fill="none" strokeLinecap="round">
      <path d={dd} stroke={SHADOW} strokeOpacity={0.75} strokeWidth={5 / k} />
      <path d={dd} stroke={INK} strokeWidth={2.2 / k} />
    </g>
  );
};

/** THE LABELS, in SCREEN space on a canvas. Text is always rasterised with its
 *  baseline snapped to the pixel grid (SVG and canvas alike), so a label riding
 *  the slow push would tick 1 px every few frames. Each label is drawn at an
 *  integer position (2x) into its own small canvas, and that bitmap is placed at
 *  the label's exact sub-pixel position (resampled): it glides. Same look as the
 *  kit's Label: IM Fell English SC caps, cream, a dark halo under the fill,
 *  sliding up 24 px while fading in. */
type DrawLabel = { x: number; y: number; text: string; op: number; anchor: "start" | "middle" | "end"; spacing: number; orange: boolean };
const SS = 2; // supersampling of the label bitmaps
const LabelCanvas: React.FC<{ items: DrawLabel[] }> = ({ items }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const size = CAP / CAP_RATIO;
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const sc = cv.width / FRAME_W;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const font = `${size * SS}px ${fellSC}`;
    for (const it of items) {
      if (it.op <= 0.002) continue;
      const ls = `${(it.spacing * size * SS).toFixed(2)}px`;
      const off = document.createElement("canvas");
      const oc = off.getContext("2d");
      if (!oc) continue;
      oc.font = font;
      oc.letterSpacing = ls;
      const w = Math.ceil(oc.measureText(it.text).width);
      const pad = Math.ceil(size * SS * 0.25);
      const asc = Math.ceil(size * SS * 0.95);
      off.width = w + 2 * pad;
      off.height = asc + Math.ceil(size * SS * 0.35) + pad;
      oc.font = font; // (resizing resets the context)
      oc.letterSpacing = ls;
      oc.lineJoin = "round";
      oc.textBaseline = "alphabetic";
      // a dark casing under every letter, so a label reads over the orange hatch too
      oc.globalAlpha = 0.85;
      oc.strokeStyle = SHADOW;
      oc.lineWidth = size * SS * 0.2;
      oc.strokeText(it.text, pad, pad + asc);
      oc.globalAlpha = 1;
      oc.fillStyle = it.orange ? ACCENT : INK;
      oc.fillText(it.text, pad, pad + asc);
      // letter-spacing trails the last glyph: anchor on the glyphs themselves
      const glyphW = (w - it.spacing * size * SS) / SS;
      const left = it.anchor === "start" ? it.x : it.anchor === "end" ? it.x - glyphW : it.x - glyphW / 2;
      ctx.globalAlpha = it.op;
      ctx.drawImage(off, sc * (left - pad / SS), sc * (it.y - (pad + asc) / SS), (sc * off.width) / SS, (sc * off.height) / SS);
    }
  });
  return <canvas ref={ref} width={FRAME_W} height={FRAME_H} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />;
};

export const SameMomentScene: React.FC<{ frame: number; labels: z.infer<typeof schema>["labels"] }> = ({ frame, labels }) => {
  const cam = camAt(frame);
  const t = lin(frame, LAUNCH, LAND);
  const arrive = frame < LAND ? 0 : Math.min(1, (frame - LAND + 1) / ARRIVE);
  return (
    <MapPage world="pacific" cam={cam} vignette={0.5}>
      <WorldSvg
        cam={cam}
        defs={
          <linearGradient id="southDim" gradientUnits="userSpaceOnUse" x1={0} y1={DIM_Y0} x2={0} y2={DIM_Y1}>
            {DIM_STOPS.map(([o, a]) => (
              <stop key={o} offset={o} stopColor={SHADOW} stopOpacity={a} />
            ))}
          </linearGradient>
        }
      >
        {/* the south (Australia, New Guinea) is not in the story: it sinks into the paper */}
        <rect x={-4000} y={DIM_Y0} width={9000} height={4000} fill="url(#southDim)" />
        {/* what Japan held on 7 Dec 1941 */}
        <Hatch region={JAPAN_1941} cam={cam} id="j41" />
        <IslandDots pts={MANDATE} cam={cam} />
        {/* the eight strikes, then the rings they set, all on the same frame */}
        {STRIKES.map((s) => (s.pts ? <StrikeArc key={`a-${s.id}`} pts={s.pts} t={t} cam={cam} width={ARC_W} head={ARC_HEAD} /> : null))}
        {STRIKES.map((s) => {
          const m = MARKS[s.id];
          return <Target key={`t-${s.id}`} x={m[0]} y={m[1]} cam={cam} arrive={arrive} from={s.pts ? s.pts[Math.max(0, s.pts.length - 4)] : undefined} size={RING_SIZE} />;
        })}
        {LABELS.map((l) =>
          l.leader && l.at !== "japan" ? <Leader key={`ld-${l.key}`} at={MARKS[l.at] as P2} to={l.leader} frame={frame} appear={l.word - LABEL_LEAD} cam={cam} /> : null,
        )}
      </WorldSvg>
      <LabelCanvas
        items={LABELS.map((l) => {
          const sl = labelIn(frame, l.word - LABEL_LEAD);
          const p = l.at === "japan" ? JAPAN_AT : MARKS[l.at];
          const [sx, sy] = toScreen(cam, p[0], p[1]);
          const out = l.out ? 1 - smootherstep((frame - l.out[0]) / (l.out[1] - l.out[0])) : 1;
          return { x: sx + l.dx, y: sy + l.dy + sl.dy, text: labels[l.key], op: sl.op * out, anchor: l.anchor, spacing: l.spacing ?? SPACING, orange: !!l.orange };
        })}
      />
      {/* the theatre is the picture: the paper darkens a little more toward the foot of the frame */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 140% 50% at 50% 38%, rgba(8,6,4,0) 55%, rgba(8,6,4,0.2) 78%, rgba(8,6,4,0.38) 100%)" }} />
    </MapPage>
  );
};

const SameMoment: React.FC<z.infer<typeof schema>> = ({ labels }) => {
  const frame = useCurrentFrame();
  return <SameMomentScene frame={frame} labels={labels} />;
};
export default SameMoment;

