// SameMomentZoomsV2 — cold-review V2 of 88_SameMoment_Zooms_SP (Sarah Paine, "How the
// Depression pushed Japan to Pearl Harbor", marker 00:01:28:19). Dwarkesh map style,
// PACIFIC world of the Pearl kit (pearlShared.tsx, read-only). ORANGE = JAPAN.
// Started from the smooth-pass snapshot (SameMomentZooms_SP.tsx); new file, nothing
// existing is edited.
//
// CHECK LINE: Japan hit Pearl Harbor and, in the same hours, a whole arc of places
// from Malaya to Wake to Shanghai.
//
// SPOKEN ("...it's at the same moment") "that the Japanese attack Pearl Harbor. They
// also attack Malaya, Philippines, Singapore, Wake Island, Guam, Thailand, International
// Settlement in Shanghai, because…"
// WORDS (local frames, automated alignment ±2): that 3, the 6, Japanese 10, attack 22,
// Pearl 33, Harbor 38, They 45, also 50, attack 56, Malaya 64, Philippines 87,
// Singapore 104, Wake 128, Island 139, Guam 150, Thailand 168, international 203,
// settlement 215, in 230, Shanghai 237, because 256.
// DURATION: seq 2131..2386 = 256 frames used + 12 frames of living hold handle = 268
// at 24 fps (as the delivered 88_SameMoment_Zooms_SP.mov).
//
// MOTION: one continuous camera (sameMomentZoomsCameraV2.ts) eases in onto Pearl
// Harbor, then makes gentle zooms on the places in spoken order (Luzon, Guam and Wake
// share one Pacific framing). Every struck place gets ONE strike: an orange arc from
// its real origin landing on its word (the arc then drains), and the ring and burst
// that STAY lit to the last frame. After Thailand the camera pulls to the theatre
// wide (Malaya to Hawaii): every place's own strike arc re-flies from the SAME real
// origin as its first strike and all land on ONE frame (FLARE, f196), each ring
// snapping out with a crisp pulse, then the arcs drain: the same moment. From
// ~f203 one push into Shanghai through "international settlement" (struck on
// "international", named on "Shanghai"), its neighbours still lit. At wide zooms
// the Singora / Kota Bharu / Singapore marks take a small cartographic screen
// offset (markAt) so they read as three marks, not one blob.
// Labels: only spoken names, landing on their word, cleared within 6 frames.
// CAUSE -> EFFECT: each arc's head touches its target on `land` (word - 1); the ring
// starts drawing on that frame from the side the arc came from. Shanghai has no arc:
// the strike came from Japanese forces already in the city (the hatch round it).
//
// SOURCES (as the delivered cut): strike origins and targets in pearlPacificMapData.ts
// (the carrier force from Hitokappu Bay, Etorofu, 147.6 E 44.9 N, to Pearl Harbor;
// the Samah convoy to Singora/Kota Bharu; Saigon bombers to
// Singapore; Formosa (Takao) to Clark Field; Kwajalein (Roi) to Wake; Saipan to Guam;
// Japanese forces on the Huangpu at Shanghai), 7-8 Dec 1941. Japan's 1941 holdings:
// JAPAN_1941 (pearl map set, scripts/maps/configs/pearl.mjs).
import React, { useLayoutEffect, useRef } from "react";
import { z } from "zod";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  ACCENT,
  CAP_RATIO,
  FRAME_W,
  FRAME_H,
  INK,
  IslandDots,
  Hatch,
  MapPage,
  SHADOW,
  fellSC,
  labelIn,
  lin,
  runCamera,
  toScreen,
  StrikeArc,
  Target,
  WorldSvg,
  greatCirclePath,
  smoothstep,
  type P2,
  viaPath,
} from "./pearlShared";
import { CONVOY_VIA_LL, JAPAN_1941, MANDATE_POINTS, ORIGINS_LL, project } from "./pearlPacificMapData";
import { MARK_LL, type MarkId } from "./sameMomentCamera";
import { CAM_KEYS, CAP, DURATION, FAN_FLY, FLARE, FLARE_LEN, FPS, LABELS, LABEL_LEAD, LABEL_OUT, RING_PEARL, RING_SIZE, SPACING, STRIKES, markAt } from "./sameMomentZoomsCameraV2";

export { DURATION, FPS };
export const camAt = (f: number) => runCamera(CAM_KEYS, f);

// the south (Australia) recedes under a dim that starts below New Guinea, so it
// never owns the lower frame, without going dead black
const DIM_Y0 = project(140, -9)[1];
const DIM_Y1 = project(140, -26)[1];
const DIM_MAX = 0.4;
const DIM_STOPS: [number, number][] = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map((o) => [o, DIM_MAX * o * o * (3 - 2 * o)]);

export const schema = z.object({
  labels: z.object({
    pearl: z.string(),
    malaya: z.string(),
    philippines: z.string(),
    singapore: z.string(),
    wake: z.string(),
    guam: z.string(),
    thailand: z.string(),
    shanghai: z.string(),
  }),
});
export const defaultProps = schema.parse({
  labels: {
    pearl: "PEARL HARBOR",
    malaya: "MALAYA",
    philippines: "PHILIPPINES",
    singapore: "SINGAPORE",
    wake: "WAKE ISLAND",
    guam: "GUAM",
    thailand: "THAILAND",
    shanghai: "SHANGHAI",
  },
});

// THE STRIKES: one per place, each landing on its word (sameMomentZoomsCameraV2 STRIKES)
const ARRIVE = 12; // the ring is drawn round in ~8 frames after the arc touches
const ARC_W = 3.2;
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
const strikePts = (id: MarkId): P2[] | null => {
  if (id === "shanghai") return null;
  // Pearl Harbor: from Japan (the carriers sailed from Hitokappu Bay), visible across the opening
  if (id === "pearlHarbor") return greatCirclePath(project, HITOKAPPU_LL, MARK_LL[id], 0.08);
  if (id === "kotaBharu" || id === "singora") return viaPath([...CONVOY_VIA_LL, MARK_LL[id]].map(([lo, la]) => project(lo, la)), 14);
  return greatCirclePath(project, ORIGINS_LL[ORIGIN_OF[id]], MARK_LL[id], id === "singapore" ? 0 : 0.12);
};
const HITOKAPPU_LL: [number, number] = [147.6, 44.9];
const STRIKE_GEOM = STRIKES.map((s) => ({ ...s, pts: strikePts(s.id) }));
const MANDATE = Object.values(MANDATE_POINTS) as P2[];
const ringSize = (id: MarkId) => (id === "pearlHarbor" ? RING_PEARL : RING_SIZE);
/** the simultaneous re-strike: each lit place's OWN arc (the same real origin and
 *  path as its first strike), its end bent onto where the mark is drawn (markAt) */
const FAN = STRIKE_GEOM.filter((s) => s.land < FLARE && s.pts);
const toMark = (pts: P2[], id: MarkId, k: number): P2[] => {
  const m = markAt(id, k);
  const e = pts[pts.length - 1];
  const dx = m[0] - e[0];
  const dy = m[1] - e[1];
  if (Math.abs(dx) + Math.abs(dy) < 1e-6) return pts;
  const n = pts.length - 1;
  return pts.map(([x, y], i) => [x + (dx * i) / n, y + (dy * i) / n] as P2);
};

/** THE SAME MOMENT: one crisp ring pulse out of every lit mark, all on one frame
 *  (a thin cased ring growing to ~1.85x the mark and thinning out; no glow). */
const Flare: React.FC<{ x: number; y: number; cam: { x: number; y: number; k: number }; size: number; u: number }> = ({ x, y, cam, size, u }) => {
  if (u <= 0 || u >= 1) return null;
  const k = cam.k;
  const R0 = (size * Math.pow(k, 0.2)) / k;
  const e = 1 - Math.pow(1 - u, 3);
  const R = R0 * (1 + 0.85 * e);
  const op = Math.pow(1 - u, 1.6);
  const w = (1 - 0.5 * u) * 2.6;
  return (
    <g fill="none" opacity={op}>
      <circle cx={x} cy={y} r={R} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={(w + 2.2) / k} />
      <circle cx={x} cy={y} r={R} stroke={ACCENT} strokeWidth={w / k} />
    </g>
  );
};

// THE LABELS on a canvas, gliding at sub-pixel positions. Never clamped to the
// frame (a clamped label detaches from its marker); a label at the frame edge
// fades with its marker instead.
type DrawLabel = { x: number; y: number; text: string; op: number; anchor: "start" | "middle" | "end"; spacing: number; orange: boolean };
const SS = 2;
const EDGE = 20;
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
      oc.font = font;
      oc.letterSpacing = ls;
      oc.lineJoin = "round";
      oc.textBaseline = "alphabetic";
      oc.globalAlpha = 0.85;
      oc.strokeStyle = SHADOW;
      oc.lineWidth = size * SS * 0.2;
      oc.strokeText(it.text, pad, pad + asc);
      oc.globalAlpha = 1;
      oc.fillStyle = it.orange ? ACCENT : INK;
      oc.fillText(it.text, pad, pad + asc);
      const glyphW = (w - it.spacing * size * SS) / SS;
      const left = it.anchor === "start" ? it.x : it.anchor === "end" ? it.x - glyphW : it.x - glyphW / 2;
      const right = left + glyphW;
      // fully gone once any part of it would cross the frame edge
      const edge = smoothstep((left - EDGE) / 30) * smoothstep((FRAME_W - EDGE - right) / 30);
      const op = it.op * edge;
      if (op <= 0.002) continue;
      ctx.globalAlpha = op;
      ctx.drawImage(off, sc * (left - pad / SS), sc * (it.y - (pad + asc) / SS), (sc * off.width) / SS, (sc * off.height) / SS);
    }
  });
  return <canvas ref={ref} width={FRAME_W} height={FRAME_H} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />;
};

const SameMomentZoomsV2: React.FC<z.infer<typeof schema>> = ({ labels }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <MapPage world="pacific" cam={cam} vignette={0.42}>
      <WorldSvg
        cam={cam}
        defs={
          <linearGradient id="southDimZ2" gradientUnits="userSpaceOnUse" x1={0} y1={DIM_Y0} x2={0} y2={DIM_Y1}>
            {DIM_STOPS.map(([o, a]) => (
              <stop key={o} offset={o} stopColor={SHADOW} stopOpacity={a} />
            ))}
          </linearGradient>
        }
      >
        <rect x={-4000} y={DIM_Y0} width={9000} height={4000} fill="url(#southDimZ2)" />
        <Hatch region={JAPAN_1941} cam={cam} id="j41z2" />
        <IslandDots pts={MANDATE} cam={cam} />
        {STRIKE_GEOM.map((s) =>
          s.pts ? (
            <StrikeArc
              key={`a-${s.id}`}
              pts={s.pts}
              t={lin(frame, s.land - s.fly, s.land)}
              cam={cam}
              width={ARC_W}
              head={ARC_HEAD}
              // the spent arc drains away: the mark carries the strike, no web of arcs
              opacity={1 - smoothstep((frame - s.land - 6) / 14)}
            />
          ) : null,
        )}
        {/* THE SAME MOMENT: every place's own strike re-flies from its real origin,
            all landing on one frame (FLARE), then drain at once (no lingering web) */}
        {frame >= FLARE - FAN_FLY && frame < FLARE + 14
          ? FAN.map((s) => {
              return (
                <StrikeArc
                  key={`fan-${s.id}`}
                  pts={toMark(s.pts as P2[], s.id, cam.k)}
                  t={lin(frame, FLARE - FAN_FLY, FLARE)}
                  cam={cam}
                  width={4.4}
                  head={20}
                  opacity={1 - smoothstep((frame - FLARE - 1) / 10)}
                />
              );
            })
          : null}
        {STRIKE_GEOM.map((s) => {
          if (!(frame >= FLARE && s.land < FLARE)) return null;
          const m = markAt(s.id, cam.k);
          return <Flare key={`f-${s.id}`} x={m[0]} y={m[1]} cam={cam} size={ringSize(s.id)} u={(frame - FLARE) / FLARE_LEN} />;
        })}
        {STRIKE_GEOM.map((s) => {
          const m = markAt(s.id, cam.k);
          const arrive = frame < s.land ? 0 : Math.min(1, (frame - s.land + 1) / ARRIVE);
          // the shared strike: every lit ring snaps out bigger on FLARE and settles back
          const snap = s.land < FLARE && frame >= FLARE ? 0.55 * Math.min(1, (frame - FLARE + 1) / 2) * Math.pow(1 - Math.min(1, (frame - FLARE) / FLARE_LEN), 2) : 0;
          return (
            <Target
              key={`t-${s.id}`}
              x={m[0]}
              y={m[1]}
              cam={cam}
              arrive={arrive}
              from={s.pts ? s.pts[Math.max(0, s.pts.length - 4)] : undefined}
              size={ringSize(s.id) * (1 + snap)}
            />
          );
        })}
      </WorldSvg>
      <LabelCanvas
        items={LABELS.map((l) => {
          const sl = labelIn(frame, l.word - (l.lead ?? LABEL_LEAD));
          const p = markAt(l.at, cam.k);
          const [sx, sy] = toScreen(cam, p[0], p[1]);
          const out = l.out !== undefined ? 1 - smoothstep((frame - l.out) / LABEL_OUT) : 1;
          return { x: sx + l.dx, y: sy + l.dy + sl.dy, text: labels[l.key], op: sl.op * out, anchor: l.anchor, spacing: SPACING, orange: false };
        })}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 140% 55% at 50% 42%, rgba(8,6,4,0) 60%, rgba(8,6,4,0.12) 82%, rgba(8,6,4,0.22) 100%)" }} />
    </MapPage>
  );
};
export default SameMomentZoomsV2;
