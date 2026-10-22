// ---------------------------------------------------------------------------
// AircraftProbe — the world builder's style stills for scott-aircraft-order (aircraftShared.tsx). One still per frame:
//   f0 a  the yard wide, the row lit, United at its front
//   f1 b  the same, the row drained and stored
//   f2 c  the hangar's doors open, two new United 787s on the lane
//   f3 d  a close side profile of United's 787 (cut 4's shot)
//   f4 e  plan: a grid of 200 787s (10 x 20)
//   f5 e2 plan: a field of 737 MAX and A321neo
//   f6 f  plan: one 787 at ~700 px over a runway, 40 m up, with its altitude shadow
//   f7 g  every type side by side at one scale (labels for the probe only)
//   f8 h  every airline's fin paint
//   f9 i  oblique: a 787 taxiing toward the camera (cut 2's lead jet)
//   f10 j close on the row: slots 1-2 drained + stored, the rest lit
//   f11 k close on the hangar, doors half open, a 787 inside on the lane
//   f12 l amber check: the fin and a flat amber patch in the overlay (pixel-measured)
// Render with --gl=angle.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FONT_LABEL } from "../kits/cheeky-pint/stoutShared";
import {
  AIRLINES,
  AirStage,
  JET_DIMS,
  JET_TYPES,
  Jet,
  JetField,
  Runway,
  YARD,
  YARD_CAM_HANGAR,
  YARD_CAM_WIDE,
  Yard,
  airCamAt,
  airProject,
  airTrack,
  type AirCam,
  type FieldItem,
} from "./aircraftShared";
import { paintFin } from "./aircraftPaint";
import { SPECS, finGeo } from "./aircraftModels";

export const FPS = 24000 / 1001;
export const DURATION = 13;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const S = 40;

const StillA: React.FC<{ drained: boolean }> = ({ drained }) => (
  <AirStage cam={YARD_CAM_WIDE} S={S} world={<Yard drain={drained ? 1 : 0} stored={drained ? 1 : 0} />} />
);
const StillC: React.FC = () => (
  <AirStage
    cam={YARD_CAM_HANGAR}
    S={S}
    world={
      <>
        <Yard drain={1} stored={1} doors={1} />
        <Jet type="B787_9" airline="united" at={YARD.lane.at(135)} heading={YARD.lane.heading} />
        <Jet type="B787_9" airline="united" at={YARD.lane.at(330)} heading={YARD.lane.heading} />
      </>
    }
  />
);
const CAM_D: AirCam = { mode: "side", x: 2, y: 7.5, z: -10, f: 1500, horizon: 840 };
const StillD: React.FC = () => <AirStage cam={CAM_D} S={S} world={<Jet type="B787_10" airline="united" at={[0, 98]} heading={-90} />} />;
const gridItems = (): FieldItem[] => {
  const out: FieldItem[] = [];
  for (let r = 0; r < 20; r++) for (let c = 0; c < 10; c++) out.push({ at: [(c - 4.5) * 132, (9.5 - r) * 121], heading: 0 });
  return out;
};
const StillE: React.FC = () => (
  <AirStage cam={{ mode: "plan", x: 0, z: 0, k: 0.75 }} S={S} ground={{ aprons: [[-5000, -5000, 5000, 5000]], joints: 7.5 }} world={<JetField type="B787_9" airline="united" items={gridItems()} />} />
);
const StillE2: React.FC = () => {
  const a: FieldItem[] = [];
  const b: FieldItem[] = [];
  for (let r = 0; r < 12; r++)
    for (let c = 0; c < 8; c++) {
      const it: FieldItem = { at: [(c - 3.5) * 50, (5.5 - r) * 52], heading: 0 };
      if ((r + c) % 3 === 0) b.push(it);
      else a.push(it);
    }
  return (
    <AirStage
      cam={{ mode: "plan", x: 0, z: 0, k: 2.6 }}
      S={S}
      ground={{ aprons: [[-5000, -5000, 5000, 5000]] }}
      world={
        <>
          <JetField type="B737MAX" airline="united" items={a} detail="hi" />
          <JetField type="A321" airline="united" items={b} detail="hi" />
        </>
      }
    />
  );
};
const StillF: React.FC = () => (
  <AirStage
    cam={{ mode: "plan", x: 0, z: 0, k: 11.5 }}
    S={S}
    ground={{ aprons: [] }}
    world={
      <>
        <Runway at={[0, 900]} heading={0} length={3000} width={45} />
        <Jet type="B787_9" airline="united" at={[0, 0]} heading={0} alt={40} detail="hi" />
      </>
    }
  />
);
const LINE_K = 6.6;
const LINE_CAM: AirCam = { mode: "side", x: 0, y: 0, z: -6000, f: 6000 * LINE_K, horizon: 960, near: 5000 };
const LINE_AIRLINE: Record<string, (typeof AIRLINES)[number]> = {
  B787_9: "united",
  B787_10: "united",
  B777: "delta",
  B747: "britishAirways",
  A380: "airFrance",
  A340: "virginAtlantic",
  A330: "american",
  B737MAX: "united",
  A321: "united",
};
const StillG: React.FC = () => {
  const types = JET_TYPES;
  const cell = (i: number) => ({ x: i < 5 ? -41 : 41, y: 100 - (i % 5) * 44 });
  return (
    <AirStage
      cam={LINE_CAM}
      S={S}
      ground={null}
      motes={0}
      fog={0}
      world={types.map((t, i) => (
        <Jet key={t} type={t} airline={LINE_AIRLINE[t]} at={[cell(i).x, 0]} heading={-90} alt={cell(i).y} shadow={0} detail="hi" />
      ))}
      overlay={
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          {types.map((t, i) => {
            const p = airProject(LINE_CAM, [cell(i).x - 37, cell(i).y - 3, 0]);
            return (
              <text key={t} x={p.x} y={p.y + 30} fontFamily={FONT_LABEL} fontSize={19} fill="#2E1E14">
                {`${SPECS[t].label}  ${JET_DIMS[t].length} / ${JET_DIMS[t].span} / ${JET_DIMS[t].height} m`}
              </text>
            );
          })}
        </svg>
      }
    />
  );
};
const FinCell: React.FC<{ airline: (typeof AIRLINES)[number] }> = ({ airline }) => {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
    const src = paintFin("B787_10", airline, false);
    const fg = finGeo(SPECS.B787_10);
    const bx = fg.box;
    ctx.fillStyle = "#6B5440";
    ctx.fillRect(0, 0, cv.width, cv.height);
    const sc = cv.width / (bx.s1 - bx.s0);
    const X = (s: number) => (s - bx.s0) * sc;
    const Y = (y: number) => (bx.y1 - y) * (cv.height / (bx.y1 - bx.y0));
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(X(fg.s0), Y(fg.yRoot));
    ctx.lineTo(X(fg.leAt(fg.yTip)), Y(fg.yTip));
    ctx.lineTo(X(fg.leAt(fg.yTip) + SPECS.B787_10.fin.ct), Y(fg.yTip));
    ctx.lineTo(X(fg.s0 + SPECS.B787_10.fin.cr), Y(fg.yRoot));
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(src, 0, 0, cv.width, cv.height);
    ctx.restore();
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <canvas ref={ref} width={300} height={Math.round((300 * (finGeo(SPECS.B787_10).box.y1 - finGeo(SPECS.B787_10).box.y0)) / (finGeo(SPECS.B787_10).box.s1 - finGeo(SPECS.B787_10).box.s0))} />
      <div style={{ fontFamily: FONT_LABEL, fontSize: 22, color: "#F3EBDD", marginTop: 6 }}>{airline}</div>
    </div>
  );
};
const StillH: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#432C1C", display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 24, padding: 40 }}>
    {AIRLINES.map((a) => (
      <FinCell key={a} airline={a} />
    ))}
  </AbsoluteFill>
);
const CAM_I: AirCam = { mode: "side", x: 0, y: 9, z: 0, f: 1500, horizon: 820, pitch: 0 };
const StillI: React.FC = () => (
  <AirStage
    cam={CAM_I}
    S={S}
    world={
      <>
        <Jet type="B787_9" airline="united" at={[-14, 120]} heading={160} />
        <Jet type="B787_9" airline="united" at={[-75, 300]} heading={160} />
      </>
    }
  />
);

const CAM_J: AirCam = { mode: "side", x: -45, y: 8, z: 215, f: 1450, horizon: 860, yaw: 38 };
const StillJ: React.FC = () => <AirStage cam={CAM_J} S={S} world={<Yard drain={(i) => (i <= 2 ? 1 : 0)} stored={(i) => (i <= 2 ? 1 : 0)} />} />;

const CAM_K: AirCam = { mode: "side", x: -150, y: 14, z: 520, f: 1600, horizon: 900, yaw: -14 };
const StillK: React.FC = () => (
  <AirStage
    cam={CAM_K}
    S={S}
    world={
      <>
        <Yard drain={1} stored={1} doors={0.45} />
        <Jet type="B787_9" airline="united" at={YARD.lane.at(110)} heading={YARD.lane.heading} />
      </>
    }
  />
);

/** amber check: the 787's fin and a flat stout-amber patch (#FFB000 -> #E38E00, hot edge #FFE7A8) in the overlay */
const StillL: React.FC = () => (
  <AirStage
    cam={CAM_D}
    S={S}
    world={<Jet type="B787_10" airline="united" at={[0, 98]} heading={-90} />}
    overlay={
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="amb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFB000" />
            <stop offset="1" stopColor="#E38E00" />
          </linearGradient>
        </defs>
        <rect x={120} y={300} width={300} height={300} fill="url(#amb)" />
        <rect x={120} y={298} width={300} height={4} fill="#FFE7A8" />
        <rect x={600} y={1500} width={200} height={200} fill="url(#amb)" />
      </svg>
    }
  />
);

const AircraftProbe: React.FC = () => {
  const f = useCurrentFrame();
  if (f === 0) return <StillA drained={false} />;
  if (f === 1) return <StillA drained />;
  if (f === 2) return <StillC />;
  if (f === 3) return <StillD />;
  if (f === 4) return <StillE />;
  if (f === 5) return <StillE2 />;
  if (f === 6) return <StillF />;
  if (f === 7) return <StillG />;
  if (f === 8) return <StillH />;
  if (f === 9) return <StillI />;
  if (f === 10) return <StillJ />;
  if (f === 11) return <StillK />;
  return <StillL />;
};
export default AircraftProbe;

// ---------------------------------------------------------------------------
// AircraftMotion — a motion check of the world (not a cut): the camera glides back along the row to the yard wide,
// the hangar's doors open, a 787 rolls out along the lane at constant speed, a drain + storage wave runs down the
// row front to back. 96 frames.
// ---------------------------------------------------------------------------
export const MOTION_DURATION = 96;
const MOTION_START: AirCam = { mode: "side", x: 150, y: 14, z: 330, f: 1450, horizon: 760, yaw: 10 };
const MOTION_TRACK = airTrack(MOTION_START, [{ f0: 0, f1: 70, to: { x: 0, y: 24, z: 0, horizon: 720, yaw: 0 } }], MOTION_DURATION);
export const AircraftMotion: React.FC = () => {
  const f = useCurrentFrame();
  const cam = airCamAt(MOTION_TRACK, f);
  const doors = Math.max(0, Math.min(1, (f - 10) / 40));
  const ease = (t: number) => t * t * (3 - 2 * t);
  const doorsE = ease(doors);
  // the wave's front runs from slot 1 (f 40) to slot 8 (f 82); each jet takes 14 f to drain
  const wave = (slot: number) => ease(Math.max(0, Math.min(1, (f - (40 + (slot - 1) * 6)) / 14)));
  const s = 60 + Math.max(0, f - 30) * 2.2;
  return (
    <AirStage
      cam={cam}
      S={f}
      rest={MOTION_START}
      world={
        <>
          <Yard drain={wave} stored={wave} doors={doorsE} />
          <Jet type="B787_9" airline="united" at={YARD.lane.at(s)} heading={YARD.lane.heading} />
        </>
      }
    />
  );
};
