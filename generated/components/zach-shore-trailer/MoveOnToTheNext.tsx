// ---------------------------------------------------------------------------
// MoveOnToTheNext (zach-shore-trailer, cut 31). Core memory podcast style (styles/core-memory.md).
// Opaque 2048x1080, 23.976 fps, 145 frames.
// The graphic standard: flat white glyphs on their hard black shadow on squared paper. Chain echo once, at the
// payoff (JetEcho). Core Memory edits carry burned-in captions: no label for what the speaker says.
//
// CHECK LINE: "when a crewed F-15 is shot down, two pilots come down with it; when an uncrewed jet is shot down,
// nobody comes down — the next one just takes its place."
//
// THE LINE: "Instead of having the risk of, you know, two downed pilots in Iran, okay, we treat it like an MQ-9,
// move on to the next one."
// WORD -> FRAME: Instead -6 · of 3 · having 7 · the 10 · risk 13 · of 18 · you know 24 · two 29 · downed 31 ·
// pilots 37 · in 44 · Iran 53 · okay 67 · we 81 · treat 88 · it like an 93-98 · MQ-9 101 · move 115 · on 125 ·
// to the 129 · next 134 · one 139 · speech ends ~143.
// DURATION: the slot 31.573208 -> 37.620917 s = 6.048 s x 23.976 = 145 frames (f0..f144), sequence f757 -> f902.
//
// THE MOTION: one continuous flight to the right — the camera rides with the formation (V = 22 world px/f; the
// paper's parallax is the speed). An F-15E Strike Eagle in profile (long nose, raked intake block with its dark
// mouth, twin tails, stabilator), its long tandem canopy holding the two crew as black busts; the camera creeps,
// then pushes onto the canopy through "two ... pilots" (k 1.00 -> 1.32). A white missile (~165 screen px) with a
// short tapering exhaust streak (1.5 missile lengths, riding with it) comes up from the bottom edge (in frame
// ~f37) and touches the belly on f45 (CONTACT f45, first reaction f46); it goes INTO the jet (clipped at the belly
// line), its streak drained by f51, and the jet noses over and dives out of the bottom of the frame by ~f66. The
// crew eject — the back seat f48, the front f50 — rise out of the canopy, and two white chutes stream up out of
// them and snap open (f51-64), drifting down, the two downed pilots, above y 600 from f53. On "okay" the camera
// pans on right along the formation (f58-100, k 0.98 -> 0.85, a horizontal blur of 0.18 x its speed above
// 20 px/f; the chutes fall behind out of frame left by ~f82) to a column of the shared uncrewed jet in trail, the
// lead in the lead slot (screen x ~1450), framed by "MQ-9". The same missile (~170 screen px, in frame ~f103)
// hits the lead (CONTACT f112, first reaction f113; streak drained by f118): it dives forward out of the bottom
// (gone ~f132), and nothing comes out of it. The next jet surges into the lead slot (f114-136) wearing the chain
// crown, the column closes up behind it and a new jet joins from off frame left (f112-141). f136-144: the column
// flies on, lead in the slot, the camera creeping.
// CHAIN = the uncrewed fast jet's speed (zachShared legend): only on the next jet's surge, the crown opening with
// its speed to 26 px and closing with it: fully stacked behind the core by ~f133, no colour in the settled frame.
//
// SOURCES: F-15E Strike Eagle side profile (length 19.43 m, two-seat tandem canopy with the rear seat raised,
// raked intake, twin canted tails, stabilators past the nozzles), a flat silhouette whose stations follow the side
// elevation in refs/ref_f15_eagle_three-view_drawing.png (windscreen ~3.3 m aft of the nose tip, canopy to ~9 m,
// intake lip ~3.9-4.9 m, fin root LE ~15.4 m with a near-vertical trailing edge); the depth is drawn deeper than
// the drawing so the cockpit and crew read at this size. Ejection order (rear seat first) is the F-15E's sequenced
// ejection. The uncrewed jet is the clip's shared glyph (zachShared.tsx, builder A). No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLACK,
  Inked,
  PaperGround,
  STROKE,
  sway,
} from "../kits/core-memory/cerroShared";
import { Jet, JetEcho } from "./zachShared";
import {
  CHUTE_BASE,
  CHUTE_H,
  CREW,
  DURATION as PLAN_DURATION,
  H,
  JET_SCALE,
  PAPER_REST_X,
  SHOT1,
  SHOT2,
  SILL_M,
  W,
  camAt,
  chuteAt,
  crewAt,
  f15At,
  f15Local,
  jetAt,
  missileAt,
  panBlurAt,
  surgeStep,
  trailAt,
  type Place,
  type Shot,
} from "./moveOnPlan";

export const FPS = 24000 / 1001;
export const DURATION = PLAN_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// -- the F-15E glyph (plane-local world px, nose +x, centre 0,0) -----------------------------------
type Pt = [number, number];
const path = (pts: Pt[]) =>
  `M${pts
    .map(([x, y]) =>
      f15Local(x, y)
        .map((v) => v.toFixed(1))
        .join(" "),
    )
    .join(" L")} Z`;
// Five layers, back to front, each on its own hard shadow — the shadow of the layer in front is the only line:
//   the far fin; the intake + belly block (raked lip, conformal tanks); the fuselage (long nose, spine, near fin,
//   nozzle), whose shadow draws the intake's raked lip and its shoulder line; the stabilator; the tandem canopy,
//   whose shadow draws the cockpit sill. Black print marks on top: the intake mouth, the windscreen arch and the
//   two crew busts inside the canopy.
const F15_FUSELAGE: Pt[] = [
  [0, 1.5],
  [0.5, 1.76],
  [1.2, 1.98],
  [2.2, 2.3],
  [3.35, 2.62],
  // the spine under the canopy (the canopy sits on it)
  [10.8, 2.8],
  [15.4, 2.72],
  // near fin (set aft, short root, near-vertical trailing edge — refs/ three-view)
  [17.45, 5.66],
  [18.7, 5.66],
  [18.6, 2.38],
  // nozzle
  [18.65, 2.02],
  [19.4, 1.9],
  [19.4, 1.02],
  [18.4, 0.92],
  [17.2, 0.7],
  // the fuselage's lower edge over the intake block: the CFT's end, the shoulder, down the raked lip
  [14.2, 1.25],
  [11.6, 2.08],
  [4.26, 2.08],
  [4.62, 0.6],
  // the nose's lower line
  [3.6, 0.66],
  [2.9, 0.86],
  [2.2, 1.08],
  [1.1, 1.22],
  [0.4, 1.36],
];
const F15_FUSELAGE_D = path(F15_FUSELAGE);
// the intake + belly block: raked lip, flat intake floor, conformal tank belly back up to the tail
const F15_INTAKE_D = path([
  [3.9, 2.3],
  [12.0, 2.3],
  [17.4, 0.75],
  [17.2, 0.66],
  [15.4, 0.36],
  [13.4, 0.14],
  [11.8, -0.02],
  [4.9, -0.02],
]);
// the intake mouth: a black wedge (the duct seen past the raked lip), a white lip rim ahead of it
const F15_MOUTH_D = path([
  [4.2, 2.14],
  [5.15, 2.14],
  [5.45, 0.12],
  [5.05, 0.12],
]);
// the far fin, a clear step forward of the near one (two tips show), behind everything
const F15_FAR_FIN_D = path([
  [13.8, 2.7],
  [15.85, 5.62],
  [17.1, 5.62],
  [17.0, 2.6],
]);
// the stabilator: a swept slab past the nozzles
const F15_STAB_D = path([
  [15.5, 1.98],
  [19.2, 2.02],
  [20.55, 1.56],
  [20.15, 1.3],
  [17.0, 1.52],
]);
// the tandem canopy: a long two-seat bubble, the rear seat raised, on the spine
const F15_CANOPY: Pt[] = [
  [3.35, SILL_M],
  [3.85, 3.0],
  [4.4, 3.5],
  [5.05, 3.88],
  [5.9, 4.0],
  [6.7, 4.07],
  [7.45, 4.0],
  [8.05, 3.76],
  [8.6, 3.36],
  [9.1, 2.95],
  [9.45, 2.72],
  [9.45, SILL_M],
];
const F15_CANOPY_D = path(F15_CANOPY);
const ARCH_A = f15Local(4.45, SILL_M + 0.04);
const ARCH_B = f15Local(4.85, 3.66);
const SILL_LY = f15Local(0, SILL_M)[1];
const FIG_S = 1.15; // the crew figure's scale (head r 20.7 world px)

const placeT = (p: Place) => `translate(${p.x} ${p.y}) rotate(${p.angle})`;

// -- the crew figure (black on white, no shadow): head centre at 0,0 -----------------------------------
const Figure: React.FC<{ armsUp: number }> = ({ armsUp }) => {
  const hx = 21;
  const hyDown = 52;
  const hyUp = -24;
  const hy = hyDown + (hyUp - hyDown) * armsUp;
  const hxx = 15 + (hx - 15) * armsUp;
  return (
    <g fill={BLACK} transform={`scale(${FIG_S})`}>
      <circle cx={0} cy={0} r={18} />
      <rect x={-17} y={14} width={34} height={52} rx={10} />
      <rect x={-13} y={58} width={11} height={44} rx={5.5} />
      <rect x={2} y={58} width={11} height={44} rx={5.5} />
      <line
        x1={-11}
        y1={21}
        x2={-hxx}
        y2={hy}
        stroke={BLACK}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <line
        x1={11}
        y1={21}
        x2={hxx}
        y2={hy}
        stroke={BLACK}
        strokeWidth={9}
        strokeLinecap="round"
      />
    </g>
  );
};

// The chute's dome: a half-ellipse crown over a scalloped skirt, base centre at (0, base).
const domeD = (w: number, h: number, base: number) => {
  const l = -w / 2;
  const r = w / 2;
  const top = base - h;
  const sc = h * 0.14;
  const n = 4;
  let d = `M${l} ${base} C${l} ${top + h * 0.12} ${l + w * 0.12} ${top} 0 ${top} C${r - w * 0.12} ${top} ${r} ${
    top + h * 0.12
  } ${r} ${base}`;
  for (let i = 0; i < n; i++) {
    const x0 = r - (w * i) / n;
    const x1 = r - (w * (i + 1)) / n;
    d += ` Q${(x0 + x1) / 2} ${base - sc} ${x1} ${base}`;
  }
  return `${d} Z`;
};

const Chute: React.FC<{ s: number }> = ({ s }) => {
  const c = chuteAt(s);
  if (!c.on) return null;
  const hand = {
    x: FIG_S * (21 * c.armsUp + 15 * (1 - c.armsUp)),
    y: FIG_S * -24,
  };
  const lines = c.base < hand.y - 6;
  return (
    <g>
      <Inked
        render={(fill) => <path d={domeD(c.w, c.h, c.base)} fill={fill} />}
      />
      {lines
        ? [-1, 1].flatMap((sgn) => [
            <line
              key={`o${sgn}`}
              x1={sgn * hand.x}
              y1={hand.y}
              x2={(sgn * c.w) / 2}
              y2={c.base}
              stroke={BLACK}
              strokeWidth={STROKE * 0.75}
              strokeLinecap="round"
            />,
            <line
              key={`i${sgn}`}
              x1={sgn * hand.x}
              y1={hand.y}
              x2={(sgn * c.w) / 6}
              y2={c.base + CHUTE_H * 0.02}
              stroke={BLACK}
              strokeWidth={STROKE * 0.75}
              strokeLinecap="round"
            />,
          ])
        : null}
    </g>
  );
};

// -- the missile (unit length, nose at 0,0 pointing +x) and its trail -------------------------------------
const missileD = [
  "M0 0 C-0.06 -0.055 -0.13 -0.077 -0.2 -0.077 L-0.905 -0.077 L-0.976 -0.2 L-1.035 -0.2 L-1 -0.077 L-1 0.077",
  "L-1.035 0.2 L-0.976 0.2 L-0.905 0.077 L-0.2 0.077 C-0.13 0.077 -0.06 0.055 0 0 Z",
  "M-0.55 -0.077 L-0.48 -0.155 L-0.42 -0.155 L-0.42 -0.077 Z M-0.55 0.077 L-0.48 0.155 L-0.42 0.155 L-0.42 0.077 Z",
].join(" ");
// The exhaust streak: STROKE wide at the missile's tail, tapering to a point at its far end.
const streakD = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  const nx = (-dy / l) * (STROKE / 2);
  const ny = (dx / l) * (STROKE / 2);
  return `M${a.x} ${a.y} L${b.x + nx} ${b.y + ny} L${b.x - nx} ${b.y - ny} Z`;
};

// Missile and streak are clipped to the half-plane below the target's belly line, so at contact the missile
// goes INTO the aircraft and the streak follows it in.
const Missile: React.FC<{
  shot: Shot;
  frame: number;
  target: Place;
  id: string;
}> = ({ shot, frame, target, id }) => {
  const m = missileAt(shot, frame);
  const t = trailAt(shot, frame);
  if (!m && !t) return null;
  const render = (fill: string) => (
    <g>
      {t ? <path d={streakD(t.a, t.b)} fill={fill} /> : null}
      {m ? (
        <path
          d={missileD}
          fill={fill}
          transform={`${placeT(m)} scale(${shot.len})`}
        />
      ) : null}
    </g>
  );
  return (
    <g clipPath={`url(#${id})`}>
      <defs>
        <clipPath id={id} clipPathUnits="userSpaceOnUse">
          <rect
            x={-6000}
            y={shot.bellyLy}
            width={12000}
            height={8000}
            transform={placeT(target)}
          />
        </clipPath>
      </defs>
      <Inked render={render} />
    </g>
  );
};

// -- the composition --------------------------------------------------------------------------------------
const MoveOnToTheNext: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const { cx, cy, k } = cam;
  const s = sway(frame);
  const transform = `translate(${W / 2 - cx * k + s.dx}px, ${H / 2 - cy * k + s.dy}px) scale(${k})`;

  const f15 = f15At(frame);
  const jets = [0, 1, 2, 3].map((i) => jetAt(i, frame));
  const step = surgeStep(frame);
  const blur = panBlurAt(frame);

  return (
    <AbsoluteFill>
      <PaperGround
        frame={frame}
        cx={cx}
        cy={cy}
        cxRest={PAPER_REST_X}
        cyRest={395}
        k={k}
      />
      {blur > 0 ? (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter
              id="mo-pan-blur"
              colorInterpolationFilters="sRGB"
              x="-12%"
              y="0%"
              width="124%"
              height="100%"
            >
              <feGaussianBlur stdDeviation={`${blur} 0`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      <AbsoluteFill
        style={blur > 0 ? { filter: "url(#mo-pan-blur)" } : undefined}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: H,
            transformOrigin: "0 0",
            transform,
          }}
        >
          <svg
            width={W}
            height={H}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              overflow: "visible",
            }}
          >
            <defs>
              <clipPath id="mo-canopy" clipPathUnits="userSpaceOnUse">
                <path d={F15_CANOPY_D} transform={placeT(f15)} />
              </clipPath>
              <clipPath id="mo-sill" clipPathUnits="userSpaceOnUse">
                <rect
                  x={-4000}
                  y={-6000}
                  width={8000}
                  height={6000 + SILL_LY}
                  transform={placeT(f15)}
                />
              </clipPath>
            </defs>

            {/* THE COLUMN: the hit lead (behind its missile's path), then the rest */}
            <Missile
              shot={SHOT2}
              frame={frame}
              target={jets[0]}
              id="mo-shot2"
            />
            <Jet
              view="side"
              x={jets[0].x}
              y={jets[0].y}
              angle={jets[0].angle}
              scale={JET_SCALE}
            />
            {jets[3].visible ? (
              <Jet view="side" x={jets[3].x} y={jets[3].y} scale={JET_SCALE} />
            ) : null}
            <Jet view="side" x={jets[2].x} y={jets[2].y} scale={JET_SCALE} />
            {step > 0.25 ? (
              <JetEcho
                view="side"
                x={jets[1].x}
                y={jets[1].y}
                scale={JET_SCALE}
                step={step}
              />
            ) : (
              <Jet view="side" x={jets[1].x} y={jets[1].y} scale={JET_SCALE} />
            )}

            {/* THE F-15E: far fin, its missile (behind it), the body, the crew */}
            <Inked
              render={(fill) => (
                <path d={F15_FAR_FIN_D} transform={placeT(f15)} fill={fill} />
              )}
            />
            <Missile shot={SHOT1} frame={frame} target={f15} id="mo-shot1" />
            <Inked
              render={(fill) => (
                <path d={F15_INTAKE_D} transform={placeT(f15)} fill={fill} />
              )}
            />
            <Inked
              render={(fill) => (
                <path d={F15_FUSELAGE_D} transform={placeT(f15)} fill={fill} />
              )}
            />
            <path d={F15_MOUTH_D} transform={placeT(f15)} fill={BLACK} />
            <Inked
              render={(fill) => (
                <path d={F15_STAB_D} transform={placeT(f15)} fill={fill} />
              )}
            />
            <Inked
              render={(fill) => (
                <path d={F15_CANOPY_D} transform={placeT(f15)} fill={fill} />
              )}
            />
            <line
              x1={ARCH_A[0]}
              y1={ARCH_A[1]}
              x2={ARCH_B[0]}
              y2={ARCH_B[1]}
              transform={placeT(f15)}
              stroke={BLACK}
              strokeWidth={STROKE}
            />

            {CREW.map((c, i) => {
              const a = crewAt(c, frame);
              const ch = chuteAt(Math.max(0, a.s));
              const fig = (
                <g
                  transform={`translate(${a.x} ${a.y}) rotate(${a.rot}) rotate(${ch.swing} 0 ${CHUTE_BASE})`}
                >
                  {a.s >= 0 ? <Chute s={a.s} /> : null}
                  <Figure armsUp={a.s >= 0 ? ch.armsUp : 0} />
                </g>
              );
              return (
                <g
                  key={i}
                  clipPath={
                    a.s < 0
                      ? "url(#mo-canopy)"
                      : a.s < 6
                        ? "url(#mo-sill)"
                        : undefined
                  }
                >
                  {fig}
                </g>
              );
            })}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default MoveOnToTheNext;
