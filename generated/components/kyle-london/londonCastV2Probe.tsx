// ---------------------------------------------------------------------------
// londonCastV2Probe: the check sheets of the redesigned London cast (londonCastV2.tsx) beside the current one
// (londonCast.tsx). Render entry src/entry.LondonCastV2.ts.
//   LondonCastV2Heads  every character at five head yaws, hero size; the current cast's head at the left of each row
//   LondonCastV2Phone  the cut-22 framings (f88 pair, k 2.82; f147 circle, k 1.32): current cast left, V2 right;
//                      scaled to 25 % afterwards it is the 270 px-wide phone view of each
//   LondonCastV2Sheet  every character in every pose (the cast sheet)
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import * as V1 from "./londonCast";
import * as V2 from "./londonCastV2";
import { type FigPose } from "./londonCastV2";

type P2 = [number, number];
type Cast = typeof V2;
const PAGE = "#3F3428";

type Who = { label: string; el: (C: Cast, q: FigPose, at: P2, s: number, uid: string) => React.ReactNode };
const WHO: Who[] = [
  { label: "pepys", el: (C, q, at, s, u) => <C.Pepys pose={q} at={at} scale={s} uid={u} /> },
  { label: "newton", el: (C, q, at, s, u) => <C.Newton pose={q} at={at} scale={s} uid={u} coat={C.ORANGE} /> },
  ...[0, 1, 2, 3, 4].map(
    (v): Who => ({
      label: `fellow${v}`,
      el: (C, q, at, s, u) => <C.Fellow variant={v} pose={v === 3 ? C.POSES.stoop(q, Math.sin(q.yaw) >= 0 ? 1 : -1) : q} at={at} scale={s} uid={u} coat={v % 2 ? C.CREAM : C.ORANGE} />,
    }),
  ),
  { label: "worker", el: (C, q, at, s, u) => <C.Worker pose={q} at={at} scale={s} uid={u} /> },
  { label: "worker bare", el: (C, q, at, s, u) => <C.Worker pose={q} at={at} scale={s} uid={u} cap={false} coat={C.ORANGE} /> },
];

const Svg: React.FC<{ w: number; h: number; children?: React.ReactNode }> = ({ w, h, children }) => (
  <AbsoluteFill style={{ backgroundColor: PAGE }}>
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
      {children}
    </svg>
  </AbsoluteFill>
);

/** rows: the nine characters; col 0 the CURRENT cast at yaw .9, cols 1..5 V2 at yaws 0, .45, .9, 1.4, -.7 */
export const HEADS_W = 2280;
export const HEADS_H = 9 * 280 + 20;
export const LondonCastV2Heads: React.FC = () => {
  const yaws = [0.9, 0, 0.45, 0.9, 1.4, -0.7];
  const s = 2.1;
  const cw = 370;
  const ch = 280;
  return (
    <Svg w={HEADS_W} h={HEADS_H}>
      {WHO.map((row, i) =>
        yaws.map((y, j) => {
          const C = (j === 0 ? V1 : V2) as Cast;
          const q: FigPose = { ...C.POSES.stand(y >= 0 ? 1 : -1), yaw: y * 0.75, headYaw: y };
          const x0 = 10 + j * (cw + 10) + (j > 0 ? 20 : 0);
          const y0 = 10 + i * ch;
          const hc = C.castAnchors(row.label.startsWith("fellow") ? "fellow" : row.label.startsWith("worker") ? "worker" : (row.label as "pepys" | "newton"), q, [0, 0], s, Number(row.label.replace(/\D/g, "") || 0)).headC;
          return (
            <g key={`${i}-${j}`}>
              <clipPath id={`hc${i}x${j}`}>
                <rect x={x0} y={y0} width={cw} height={ch - 8} />
              </clipPath>
              {j === 0 ? <rect x={x0} y={y0} width={cw} height={ch - 8} fill="#2E261D" /> : null}
              <g clipPath={`url(#hc${i}x${j})`}>{row.el(C, q, [x0 + cw / 2, y0 + 150 - hc[1]], s, `h${i}x${j}`)}</g>
            </g>
          );
        }),
      )}
    </Svg>
  );
};

/** the cut-22 framings at their on-screen size in a 1080-wide frame: the current cast (left), V2 (right) */
export const LondonCastV2Phone: React.FC = () => {
  const half = (C: Cast, x0: number) => {
    const P = C.POSES;
    // f88: the pair, k 2.82, heads at y ~ 700
    const k1 = 2.82;
    const pair = (
      <g>
        <clipPath id={`ph1${x0}`}>
          <rect x={x0} y={0} width={1080} height={960} />
        </clipPath>
        <g clipPath={`url(#ph1${x0})`}>
          <C.Newton pose={C.headTurn(P.stand(-1), -0.84, 4)} at={[x0 + 540 + 58 * k1, 702 + 292 * k1]} scale={k1} uid={`pn${x0}`} coat={C.ORANGE} />
          <C.Pepys pose={C.headTurn(P.stand(1), 0.78, 2)} at={[x0 + 540 - 56 * k1, 702 + 292 * k1]} scale={k1} uid={`pp${x0}`} />
        </g>
      </g>
    );
    // f147: the circle, k 1.32, floor at y ~ 1062 + 960
    const k2 = 1.32;
    const fy = 960 + 1062 - 960 * 0.5;
    const sx = (x: number) => x0 + 540 + (x - 4) * k2;
    const ctx = C.shadeInk(0.72);
    const ctc = C.shadeInk(0.66);
    const circle = (
      <g>
        <clipPath id={`ph2${x0}`}>
          <rect x={x0} y={960} width={1080} height={960} />
        </clipPath>
        <g clipPath={`url(#ph2${x0})`}>
          <C.Fellow variant={3} pose={P.stoop(C.headTurn(P.stand(1), 0.78), 1)} at={[sx(-200), fy - 112 * k2]} scale={0.85 * k2} uid={`c3${x0}`} coat={ctc} ink={ctx} />
          <C.Fellow variant={1} pose={C.headTurn(P.stand(-1), -0.86)} at={[sx(232), fy - 112 * k2]} scale={0.85 * k2} uid={`c1${x0}`} coat={ctc} ink={ctx} />
          <C.Fellow variant={2} pose={C.headTurn(P.stand(1), 0.7)} at={[sx(-298), fy - 24 * k2]} scale={0.95 * k2} uid={`c2${x0}`} coat={ctc} ink={ctx} />
          <C.Fellow variant={4} pose={C.headTurn(P.stand(-1), -0.94)} at={[sx(318), fy - 20 * k2]} scale={0.95 * k2} uid={`c4${x0}`} coat={ctc} ink={ctx} />
          <C.Newton pose={C.headTurn(P.stand(-1), -0.84, 4)} at={[sx(58), fy]} scale={k2} uid={`cn${x0}`} coat={C.ORANGE} />
          <C.Pepys pose={C.headTurn(P.stand(1), 0.78, 2)} at={[sx(-56), fy]} scale={k2} uid={`cp${x0}`} />
        </g>
      </g>
    );
    return (
      <g>
        {pair}
        {circle}
      </g>
    );
  };
  return (
    <Svg w={2160} h={1920}>
      {half(V1 as Cast, 0)}
      {half(V2, 1080)}
      <path d="M1080,0V1920M0,960H2160" stroke="#17120D" strokeWidth={6} />
    </Svg>
  );
};

const COLS: { label: string; q: (C: Cast) => FigPose }[] = [
  { label: "front", q: (C) => C.POSES.front() },
  { label: "stand", q: (C) => C.POSES.stand(1) },
  { label: "stand L", q: (C) => C.POSES.stand(-1) },
  { label: "walk 0", q: (C) => C.POSES.walk(1, 0) },
  { label: "stroll .5", q: (C) => C.POSES.strollGent(-1, 0.5) },
  { label: "head turn", q: (C) => C.headTurn(C.POSES.stand(1), -0.5, 6) },
  { label: "bow", q: (C) => C.POSES.bow(1, 1) },
  { label: "greet", q: (C) => C.POSES.greet(-1, 1) },
];
/** every character (rows) in every pose (columns), V2 */
export const LondonCastV2Sheet: React.FC = () => (
  <Svg w={2400} h={2700}>
    {WHO.map((row, i) => COLS.map((col, j) => <g key={`${i}-${j}`}>{row.el(V2, col.q(V2), [150 + j * 295, 300 + i * 296], 0.74, `p${i}x${j}`)}</g>))}
  </Svg>
);

/** close-ups of the hands, sleeves and coats (V2): Pepys standing, bowing, greeting; Newton; the worker shovelling */
export const LondonCastV2Zoom: React.FC = () => {
  const C = V2;
  const s = 2.2;
  const y = 1880;
  return (
    <Svg w={2400} h={1920}>
      <C.Pepys pose={C.POSES.stand(1)} at={[260, y]} scale={s} uid="z1" />
      <C.Pepys pose={C.POSES.bow(1, 1)} at={[760, y]} scale={s} uid="z2" />
      <C.Newton pose={C.POSES.greet(-1, 1)} at={[1300, y]} scale={s} uid="z3" coat={C.ORANGE} />
      <C.Worker pose={C.POSES.shovel(1, 0.35)} at={[1900, y]} scale={s} uid="z4" tool="shovel" />
    </Svg>
  );
};

/** the lock-swap probe: Pepys, Newton, Fellow 2 at head yaws 0 .. 1.4 (both directions mirror) */
export const SWAP_YAWS = Array.from({ length: 15 }, (_, i) => i * 0.1);
export const LondonCastV2Swap: React.FC = () => {
  const C = V2;
  const s = 1.6;
  return (
    <Svg w={15 * 220} h={3 * 600}>
      {[0, 1, 2].map((r) =>
        SWAP_YAWS.map((y, j) => {
          const q: FigPose = { ...C.POSES.stand(1), yaw: y * 0.75, headYaw: y };
          const at: P2 = [110 + j * 220, 560 + r * 600];
          return (
            <g key={`${r}-${j}`}>
              {r === 0 ? <C.Pepys pose={q} at={at} scale={s} uid={`sw${r}x${j}`} /> : r === 1 ? <C.Newton pose={q} at={at} scale={s} uid={`sw${r}x${j}`} coat={C.ORANGE} /> : <C.Fellow variant={2} pose={q} at={at} scale={s} uid={`sw${r}x${j}`} hat={false} />}
            </g>
          );
        }),
      )}
    </Svg>
  );
};
