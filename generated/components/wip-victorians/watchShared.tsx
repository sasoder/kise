// ---------------------------------------------------------------------------
// The pocket watch of wip-victorians, shared by FourOrFiveHours (cut 13) and DirtyDogs (cut 17), which opens on 13's last
// frame. Baked by scripts/clips/wip-victorians/bake-watch.py from the real watch: its two real hands are lifted off the
// enamel and rotate here about the real arbor. The watch has no seconds hand of its own: a thin one is drawn in the hands' black.
//
// SOURCE: watch by Francois Czapek, Metropolitan Museum DP338176, CC0 (commons File:Watch_MET_DP338176.jpg).
//
// STACK: <PocketWatch> is three WipPlanes in print order, so it goes inside <WipFilmLife>, after <PaperGround>: the watch, the
// red ink multiplied into the enamel, the hands on top.
// `hours`: the wedge of red, from IX clockwise. 12 = the whole dial, 5 = the settled state and the default.
// The minute hand is the wedge's moving edge; the hour hand lies on the wedge's fixed edge at IX, so the enamel always opens
// between the two hands and never as a bare needle of white beside one of them.
// ---------------------------------------------------------------------------
import React from "react";
import { interpolate } from "remotion";
import { CutOut, InkPrint, RED, WipCam, WipPlane, inkOn, paperEase } from "../kits/works-in-progress/wipShared";

/** World px. The pivot of the hands, the watch's centre. */
export const WATCH_X = 540;
export const WATCH_Y = 720;
/** The dial's outer diameter, gold case included, so its bottom sits at y 1080 and 180 px of paper stay clear each side. */
export const WATCH_D = 720;

// bake-watch.py's numbers: output px = 2 x world px. Pivot on the canvas: (780, 1290).
const BAKE = 0.5;
const CANVAS_W = 1560;
const CANVAS_H = 2080;
const PIVOT_Y = 1290;
const HOUR_SIDE = 838;
const MINUTE_SIDE = 1305;
const BOSS_SIDE = 160;
/** The angles the hands were shot at, clockwise from XII. */
const HOUR_SHOT = 272.555;
const MINUTE_SHOT = 12.929;
/** The white enamel relative to the pivot, world px: a hair off centre, as shot. */
const ENAMEL_DX = -3.4;
const ENAMEL_DY = -3.1;
const ENAMEL_R = 334.5;

const IX = 270;
const SETTLED_HOURS = 5;
const SECOND = 24;
const SECONDS_START = 96;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Clockwise degrees from XII of a point on the wedge's moving edge. */
const edgeDeg = (hours: number) => IX + hours * 30;
const polar = (deg: number, r: number) => ({
  x: WATCH_X + Math.sin((deg * Math.PI) / 180) * r,
  y: WATCH_Y - Math.cos((deg * Math.PI) / 180) * r,
});
/** The pie from IX clockwise by `hours`, world px, drawn far past the rim; the rim's clip finishes it. */
export const wedgePath = (hours: number) => {
  const R = 520;
  if (hours >= 11.999) return `M ${WATCH_X - R} ${WATCH_Y - R} H ${WATCH_X + R} V ${WATCH_Y + R} H ${WATCH_X - R} Z`;
  const a = polar(IX, R);
  const b = polar(edgeDeg(hours), R);
  const large = hours * 30 > 180 ? 1 : 0;
  return `M ${WATCH_X} ${WATCH_Y} L ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y} Z`;
};

/** A tick every second, three frames of travel, no bounce. Pass a global frame so the join to cut 17 keeps counting. */
const secondsDeg = (frame: number) => {
  const whole = Math.floor(frame / SECOND);
  const into = frame - whole * SECOND;
  return SECONDS_START + (whole + interpolate(into, [0, 3], [0, 1], { ...clamp, easing: paperEase })) * 6;
};

/** The world box the ink is laid in: the dial and a margin for the rough edge. */
const INK_X = WATCH_X - 400;
const INK_Y = WATCH_Y - 400;
const INK_S = 800;

export const PocketWatch: React.FC<{
  frame: number;
  cam: WipCam;
  hours?: number;
  /** Anything printed on the red itself: it leaves with the ink. World px, drawn in the ink plane, clipped to the wedge. */
  onInk?: React.ReactNode;
}> = ({ frame, cam, hours = SETTLED_HOURS, onInk }) => {
  const minuteDeg = edgeDeg(hours);
  const hourDeg = IX;
  const secDeg = secondsDeg(frame);
  const canvasW = CANVAS_W * BAKE;
  const canvasH = CANVAS_H * BAKE;
  const path = wedgePath(hours);
  return (
    <>
      <WipPlane cam={cam}>
        <CutOut
          src="wip-victorians/pw_watch.png"
          x={WATCH_X}
          y={WATCH_Y + (CANVAS_H / 2 - PIVOT_Y) * BAKE}
          w={canvasW}
          aspect={canvasW / canvasH}
          border={7}
          gamma={0.85}
          grain={0.06}
          seed="pocketwatch"
        />
      </WipPlane>
      <WipPlane cam={cam} ink>
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `circle(${ENAMEL_R}px at ${WATCH_X + ENAMEL_DX}px ${WATCH_Y + ENAMEL_DY}px)`,
          }}
        >
          {/* the flood's body under the rough print, so a dry patch reads as thin ink and not as a hole down to the enamel */}
          <svg width={INK_S} height={INK_S} viewBox={`${INK_X} ${INK_Y} ${INK_S} ${INK_S}`} style={{ position: "absolute", left: INK_X, top: INK_Y, opacity: 0.72 }}>
            <path d={path} fill={inkOn(RED)} />
          </svg>
          {/* isolated, so the print lays its own red over the body rather than doubling it */}
          <div style={{ position: "absolute", inset: 0, isolation: "isolate" }}>
            <InkPrint x={INK_X} y={INK_Y} w={INK_S} h={INK_S} ink={RED} seed="watch-red" rough={1.5} wear={0.2} misregister={0}>
              <svg width={INK_S} height={INK_S} viewBox={`${INK_X} ${INK_Y} ${INK_S} ${INK_S}`} style={{ position: "absolute", left: 0, top: 0 }}>
                <path d={path} fill="currentColor" />
              </svg>
            </InkPrint>
          </div>
          {onInk ? <div style={{ position: "absolute", inset: 0, clipPath: `path("${path}")` }}>{onInk}</div> : null}
        </div>
      </WipPlane>
      <WipPlane cam={cam}>
        <CutOut src="wip-victorians/pw_hour.png" x={WATCH_X} y={WATCH_Y} w={HOUR_SIDE * BAKE} aspect={1} rotate={hourDeg - HOUR_SHOT} gamma={2.2} grain={0.05} seed="pw-hour" shadow={0.8} />
        <div
          style={{
            position: "absolute",
            left: WATCH_X - 1.5,
            top: WATCH_Y - 205,
            width: 3,
            height: 245,
            backgroundColor: "#14191A",
            transformOrigin: "1.5px 205px",
            transform: `rotate(${secDeg}deg)`,
            filter: "drop-shadow(0 2px 1.5px rgba(14,31,26,0.35))",
          }}
        />
        <CutOut src="wip-victorians/pw_minute.png" x={WATCH_X} y={WATCH_Y} w={MINUTE_SIDE * BAKE} aspect={1} rotate={minuteDeg - MINUTE_SHOT} gamma={2.2} grain={0.05} seed="pw-minute" shadow={0.8} />
        <CutOut src="wip-victorians/pw_boss.png" x={WATCH_X} y={WATCH_Y} w={BOSS_SIDE * BAKE} aspect={1} rotate={minuteDeg - MINUTE_SHOT} gamma={2.2} grain={0.05} seed="pw-boss" shadow={0.9} />
      </WipPlane>
    </>
  );
};
