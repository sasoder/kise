// ---------------------------------------------------------------------------
// pandemicFolkProbe — probe sheets of the drawn cast (pandemicFolk, kyle-pandemics V3 take 2). Stills unless Motion.
//   FolkTurnaround     the Worker rig at yaw 180 / 135 / 90 / 45 / 0, beside the approved style-frame drawings
//   FolkTurnStrip      the cut-74 turn, every 2nd frame (TURN_N frames), on 2s as delivered
//   FolkReachStrip     the zombie reach, every 2nd frame (REACH_N frames), at the cut-74 size, perspective on
//   FolkSeeThrough     cut-32 framing (head to waist): normal | see-through with placeholder glass lungs + orange
//   FolkCrowdSheet     every crowd kind in every ink, as baked sprites at 200 / 150 / 70 px
//   FolkFallStrip      a fall, every 2nd frame (FALL_N), sprites at 200 px
//   FolkTurnMotion / FolkReachMotion / FolkFallMotion / FolkSlackMotion   1080x1920 motion probes (the every-frame
//                      continuity audit)
// Backdrop: the palette-A air as a plain ramp (pandemicAir AIR.A), so sheets render fast.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CROWD_KINDS, FIGURE_PX, REACH_DIST, FolkCanvas, FolkWorker, blitFolk, crowdSpriteReq, fall, onTwos, reach, slack, stand, sway, turn, useFolkSprites, workerAnchors, type CrowdInk, type CrowdKind } from "./pandemicFolk";
import { FolkFigure, VARIANTS, workerBack, workerFront, workerProfile } from "./pandemicFolkSketch";

const CREAMTXT = "#F3EBDD";
const Ramp: React.FC<{ w: number; h: number; id: string }> = ({ w, h, id }) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#A9C7B4" />
        <stop offset="0.25" stopColor="#6E9688" />
        <stop offset="0.7" stopColor="#466C66" />
        <stop offset="1" stopColor="#3B4B45" />
      </linearGradient>
    </defs>
    <rect width={w} height={h} fill={`url(#${id})`} />
  </>
);
const Lbl: React.FC<{ x: number; y: number; t: string; size?: number; anchor?: "start" | "middle" }> = ({ x, y, t, size = 22, anchor = "middle" }) => (
  <text x={x} y={y} fill={CREAMTXT} fontFamily="Helvetica, Arial, sans-serif" fontSize={size} textAnchor={anchor} opacity={0.85}>
    {t}
  </text>
);
const Shadow: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => <ellipse cx={x + w * 0.08} cy={y} rx={w * 0.55} ry={w * 0.09} fill="#22180F" opacity={0.28} />;

// ---- turnaround (rig vs the approved drawings) ------------------------------------------------------------------
export const TA_W = 3000;
export const TA_H = 1300;
export const FolkTurnaround: React.FC = () => {
  const yaws = [180, 135, 90, 45, 0];
  const sc = FIGURE_PX(820);
  return (
    <AbsoluteFill>
      <svg width={TA_W} height={TA_H}>
        <Ramp w={TA_W} h={TA_H} id="ta" />
        {yaws.map((y, i) => {
          const x = 260 + i * 400;
          return (
            <g key={i}>
              <Shadow x={x} y={1000} w={170} />
              <FolkWorker pose={stand(y)} x={x} y={1000} scale={sc} uid={`ta${i}`} />
              <Lbl x={x} y={1070} t={`rig, yaw ${y}`} />
            </g>
          );
        })}
        <line x1={2190} y1={80} x2={2190} y2={1200} stroke={CREAMTXT} strokeOpacity={0.3} strokeDasharray="6 10" />
        {[workerBack, workerProfile, workerFront].map((f, i) => (
          <g key={i}>
            <FolkFigure d={f()} v={VARIANTS.A} x={2330 + i * 260} y={1000} scale={(820 / 512) * 0.62} uid={`sk${i}`} />
          </g>
        ))}
        <Lbl x={2590} y={1070} t="approved style frames (0.62x)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---- strips ------------------------------------------------------------------------------------------------------
export const TURN_N = 44;
export const REACH_N = 40;
export const FALL_N = 36;
const STRIP_COLS = 11;
export const STRIP_W = 2640;
export const STRIP_H = 1520;
export const FolkTurnStrip: React.FC = () => {
  const frames = Array.from({ length: TURN_N / 2 }, (_, i) => i * 2);
  const sc = FIGURE_PX(560);
  return (
    <AbsoluteFill>
      <svg width={STRIP_W} height={STRIP_H}>
        <Ramp w={STRIP_W} h={STRIP_H} id="ts" />
        {frames.map((f, i) => {
          const col = i % STRIP_COLS;
          const row = Math.floor(i / STRIP_COLS);
          const x = 120 + col * 240;
          const y = 680 + row * 740;
          return (
            <g key={f}>
              <Shadow x={x} y={y} w={120} />
              <FolkWorker pose={turn(f / (TURN_N - 1))} x={x} y={y} scale={sc} uid={`ts${f}`} />
              <Lbl x={x} y={y + 44} t={`f${f}`} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
export const FolkReachStrip: React.FC = () => {
  const frames = Array.from({ length: REACH_N / 2 }, (_, i) => i * 2);
  const sc = FIGURE_PX(560);
  return (
    <AbsoluteFill>
      <svg width={STRIP_W} height={STRIP_H}>
        <Ramp w={STRIP_W} h={STRIP_H} id="rs" />
        {frames.map((f, i) => {
          const col = i % 10;
          const row = Math.floor(i / 10);
          const x = 140 + col * 260;
          const y = 680 + row * 740;
          return (
            <g key={f}>
              <Shadow x={x} y={y} w={120} />
              <FolkWorker pose={reach(f / (REACH_N - 1))} x={x} y={y} scale={sc} uid={`rs${f}`} dist={REACH_DIST} />
              <Lbl x={x} y={y + 44} t={`f${f}`} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ---- see-through (cut 32 framing) --------------------------------------------------------------------------------
export const SEE_W = 2160;
export const SEE_H = 1920;
const GlassLungs: React.FC = () => (
  // placeholder organs in figure units (cut 32 draws its own): two glass lungs, the trachea, orange tubercles
  <g>
    <path d="M -6 -404 L 6 -404 L 7 -340 L -7 -340 Z" fill="none" stroke="#F3EBDD" strokeWidth={1.6} opacity={0.8} />
    {[-1, 1].map((s) => (
      <g key={s}>
        <path
          d={`M ${s * 8} -350 C ${s * 30} -372 ${s * 60} -366 ${s * 66} -330 C ${s * 72} -296 ${s * 70} -270 ${s * 58} -262 C ${s * 40} -258 ${s * 20} -264 ${s * 10} -280 C ${s * 4} -300 ${s * 4} -330 ${s * 8} -350 Z`}
          fill="#DDEBE4"
          fillOpacity={0.18}
          stroke="#F3EBDD"
          strokeWidth={1.8}
          opacity={0.9}
        />
      </g>
    ))}
    {[
      [30, -340, 7],
      [42, -322, 5],
      [-38, -300, 6],
      [24, -296, 4],
      [50, -290, 5],
    ].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="#FFB000" opacity={0.95} />
    ))}
  </g>
);
export const FolkSeeThrough: React.FC = () => {
  const sc = FIGURE_PX(1700);
  return (
    <AbsoluteFill>
      <svg width={SEE_W} height={SEE_H}>
        <Ramp w={SEE_W} h={SEE_H} id="st" />
        <FolkWorker pose={slack(0)} x={540} y={1180 + 512 * sc * 0.62} scale={sc} uid="st0" />
        <FolkWorker pose={slack(0)} x={1620} y={1180 + 512 * sc * 0.62} scale={sc} uid="st1" see={1} inside={<GlassLungs />} />
        <Lbl x={540} y={60} t="cut 32: slack, normal" size={30} />
        <Lbl x={1620} y={60} t="see-through (see 1), placeholder glass lungs + orange" size={30} />
        {(() => {
          const a = workerAnchors(slack(0), 1620, 1180 + 512 * sc * 0.62, sc);
          const mk = (k: keyof typeof a, c = "#FF3B6B") => <circle key={k} cx={a[k][0]} cy={a[k][1]} r={6} fill={c} />;
          return (
            <g>
              {(["trachea", "sternumTop", "sternum", "sternumBottom", "shoulderL", "shoulderR", "lungL", "lungR", "eyeL", "eyeR", "mouth", "nape"] as const).map((k) => mk(k))}
              <rect x={a.lungsTL[0]} y={a.lungsTL[1]} width={a.lungsBR[0] - a.lungsTL[0]} height={a.lungsBR[1] - a.lungsTL[1]} fill="none" stroke="#FF3B6B" strokeDasharray="8 8" strokeWidth={2} />
            </g>
          );
        })()}
      </svg>
    </AbsoluteFill>
  );
};

// ---- crowd (sprites) ---------------------------------------------------------------------------------------------
export const CROWD_W = 2400;
export const CROWD_H = 1500;
const INKS: CrowdInk[] = ["orange", "cream", "dead"];
const useCrowdReqs = (sizes: number[], kinds: CrowdKind[], inks: CrowdInk[], seeds: number[]) =>
  useMemo(() => sizes.flatMap((px) => kinds.flatMap((k) => inks.flatMap((ink) => seeds.map((s) => crowdSpriteReq(k, ink, s, px))))), []); // eslint-disable-line react-hooks/exhaustive-deps
export const FolkCrowdSheet: React.FC = () => {
  const reqs = useCrowdReqs([200, 150, 70], CROWD_KINDS, INKS, [1]);
  const get = useFolkSprites(reqs);
  return (
    <AbsoluteFill>
      <svg width={CROWD_W} height={CROWD_H} style={{ position: "absolute" }}>
        <Ramp w={CROWD_W} h={CROWD_H} id="cs" />
        <Lbl x={30} y={40} t="crowd sprites (gouache filter baked in): rows 200 px (orange), 150 px (cream), 70 px (dead / orange / cream)" anchor="start" />
      </svg>
      <FolkCanvas
        width={CROWD_W}
        height={CROWD_H}
        draw={(ctx) => {
          CROWD_KINDS.forEach((k, i) => {
            const r = reqs.find((q) => q.key.startsWith(`${k}|orange|`) && q.hPx === 200);
            if (r) blitFolk(ctx, get(r.key), 140 + i * 225, 340, 200);
            const c = reqs.find((q) => q.key.startsWith(`${k}|cream|`) && q.hPx === 150);
            if (c) blitFolk(ctx, get(c.key), 140 + i * 225, 640, 150);
          });
          let x = 60;
          for (const ink of INKS)
            for (const k of CROWD_KINDS) {
              const r = reqs.find((q) => q.key.startsWith(`${k}|${ink}|`) && q.hPx === 70);
              if (r) blitFolk(ctx, get(r.key), x, 900, 70);
              x += 75;
            }
          // a TB row as in cut 13: mixed kinds at 120 px, orange
          for (let i = 0; i < 20; i++) {
            const k = CROWD_KINDS[(i * 7) % CROWD_KINDS.length];
            const r = reqs.find((q) => q.key.startsWith(`${k}|orange|`) && q.hPx === 150);
            if (r) blitFolk(ctx, get(r.key), 80 + i * 112, 1300, 150);
          }
        }}
      />
    </AbsoluteFill>
  );
};

// ---- fall --------------------------------------------------------------------------------------------------------
export const FALL_W = 2640;
export const FALL_H = 1400;
export const FolkFallStrip: React.FC = () => {
  const reqs = useCrowdReqs([200], ["man", "woman", "medOld"], ["orange", "dead"], [1]);
  const get = useFolkSprites(reqs);
  const frames = Array.from({ length: FALL_N / 2 }, (_, i) => i * 2);
  const pos = (i: number): [number, number] => [80 + (i % 9) * 290, 470 + Math.floor(i / 9) * 640];
  return (
    <AbsoluteFill>
      <svg width={FALL_W} height={FALL_H} style={{ position: "absolute" }}>
        <Ramp w={FALL_W} h={FALL_H} id="fs" />
        <Lbl x={30} y={40} t="the cut-1 fall, every 2nd frame (the woman: orange -> DEAD as she falls; f = frame)" anchor="start" />
        {frames.map((f, i) => (
          <Lbl key={f} x={pos(i)[0] + 60} y={pos(i)[1] + 60} t={`f${f}`} />
        ))}
      </svg>
      <FolkCanvas
        width={FALL_W}
        height={FALL_H}
        draw={(ctx) => {
          frames.forEach((f, i) => {
            const t = f / (FALL_N - 1);
            const fl = fall(t, 1);
            const [x, y] = pos(i);
            const k = reqs.find((q) => q.key.startsWith("woman|orange|"));
            const d = reqs.find((q) => q.key.startsWith("woman|dead|"));
            const m = Math.max(0, Math.min(1, (t - 0.3) / 0.5));
            if (k) blitFolk(ctx, get(k.key), x, y, 200, { rot: fl.rot, pivot: fl.pivot });
            if (d) blitFolk(ctx, get(d.key), x, y, 200, { rot: fl.rot, pivot: fl.pivot, alpha: m });
          });
        }}
      />
    </AbsoluteFill>
  );
};

// ---- motion probes (1080x1920) -----------------------------------------------------------------------------------
const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    <svg width={1080} height={1920} style={{ position: "absolute" }}>
      <Ramp w={1080} h={1920} id="mo" />
      {children}
    </svg>
  </AbsoluteFill>
);
export const FolkTurnMotion: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Stage>
      <Shadow x={540} y={1500} w={240} />
      <FolkWorker pose={turn(Math.min(1, onTwos(f) / (TURN_N - 1)))} x={540} y={1500} scale={FIGURE_PX(1100)} uid="tm" />
    </Stage>
  );
};
export const FolkReachMotion: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Stage>
      <Shadow x={540} y={1700} w={260} />
      <FolkWorker pose={reach(Math.min(1, f / (REACH_N - 1)))} x={540} y={1700} scale={FIGURE_PX(1250)} uid="rm" dist={REACH_DIST} />
    </Stage>
  );
};
export const FolkSlackMotion: React.FC = () => {
  const f = useCurrentFrame();
  const sc = FIGURE_PX(1700);
  return (
    <Stage>
      <FolkWorker pose={slack(f)} x={540} y={1180 + 512 * sc * 0.62} scale={sc} uid="sm" see={Math.min(1, f / 30)} inside={<GlassLungs />} />
    </Stage>
  );
};
export const FolkFallMotion: React.FC = () => {
  const f = useCurrentFrame();
  const reqs = useCrowdReqs([200], ["woman", "man", "medOld", "girl"], ["orange", "dead"], [1]);
  const get = useFolkSprites(reqs);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <Ramp w={1080} h={1920} id="fm" />
      </svg>
      <FolkCanvas
        draw={(ctx) => {
          const kinds = ["woman", "man", "medOld", "girl"];
          kinds.forEach((k, i) => {
            const x = 200 + i * 230;
            const y = 900 + (i % 2) * 300;
            const t = Math.max(0, Math.min(1, (f - 8 - i * 6) / (FALL_N - 1)));
            const fl = fall(t, i % 2 ? -1 : 1);
            const sw = sway(f, i);
            const live = reqs.find((q) => q.key.startsWith(`${k}|orange|`));
            const dead = reqs.find((q) => q.key.startsWith(`${k}|dead|`));
            const rot = t > 0 ? fl.rot : sw.rot;
            const m = Math.max(0, Math.min(1, (t - 0.3) / 0.5));
            if (live) blitFolk(ctx, get(live.key), x, y, 200, { rot, pivot: t > 0 ? fl.pivot : [0, 0], sy: t > 0 ? 1 : sw.sy });
            if (dead) blitFolk(ctx, get(dead.key), x, y, 200, { rot, pivot: t > 0 ? fl.pivot : [0, 0], alpha: m });
          });
        }}
      />
    </AbsoluteFill>
  );
};
export const FALL_MOTION_N = 70;
