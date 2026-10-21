// ---------------------------------------------------------------------------
// creaturesProbe: V3 look sheets of the clip's two animals (kyle-pandemics), not a cut. The zombie ant of cut 58 at
// 2x its on-screen size in the cut (side: f4 walking; three-quarter: standing, turned 35 deg; grip: f136 hanging from
// the vein with the stalk) in the clip's medium (pandemicAir AirStage, palette A). The marmot's probes (cut 1) are in
// creaturesProbeMarmot.tsx. Compositions: src/Root.CreaturesV3.tsx.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CordycepsStalk } from "./cordyceps";
import { AIRS, type Air } from "./creatureAir";
import { AirStage, makeAirView } from "./pandemicAir";
import { BITE_TONES, LeafShape, antAt, stalkGrow, stalkSpecAt } from "./ZombieAnt";
import { AntBody, AntLeg, Antenna, Jaw, JointTufts, antLook, headOutline, jawOutline, viewPoint, type AntView, type LegGeo } from "./zombieAntFigure";
import { ANT_S, BITE_LEAF, LEG_BONES, NODE, T, camAt, eyeOf, rigidPose, segPoint, type BodyPose, type P2 } from "./zombieAntWorld";

export const airSchema = z.object({ air: z.enum(["A", "B"]).default("A") });

/** the medium for a probe: pandemicAir's AirStage (day mood), the subject a little below the horizon */
export const probeView = (look: "A" | "B", frame = 0) =>
  makeAirView({ scene: { look, mood: "day", F: 1100, fogNear: 0, fogVis: 3000, fogMax: 0.85, hLow: 0, hHigh: 2000, moteUnit: 120 }, frame, horizon: 760 });
export const AirBackdrop: React.FC<{ air: Air; children?: React.ReactNode; frame?: number }> = ({ air, children, frame = 0 }) => (
  <AirStage v={probeView(air.id, frame)} shafts={0.8} motes={0.6}>
    {children}
  </AirStage>
);

// ---------------------------------------------------------------------------
// THE ANT
// ---------------------------------------------------------------------------
type V3 = [number, number, number];
const v3 = {
  add: (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  len: (a: V3) => Math.hypot(a[0], a[1], a[2]),
  norm: (a: V3): V3 => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  },
};
/** two-bone IK in 3D: the knee in the plane of hip, ankle and the pole, toward the pole */
const ik3 = (hip: V3, ankle: V3, a: number, b: number, pole: V3): V3 => {
  const d = v3.sub(ankle, hip);
  const L = Math.min(v3.len(d), (a + b) * 0.995);
  const u = v3.norm(d);
  const x = (a * a + L * L - b * b) / (2 * L);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  const pp = v3.sub(pole, v3.mul(u, v3.dot(pole, u)));
  return v3.add(v3.add(hip, v3.mul(u, x)), v3.mul(v3.norm(pp), h));
};
/** the standing ant for the three-quarter view: body level, legs splayed in 3D (world: Y up is -, Z far +) */
const standing = (view: AntView) => {
  const { yaw, cx } = view;
  const O: P2 = [0, -92];
  const b = rigidPose(O, 0, 0.05);
  const P = (q: V3): P2 => viewPoint(view, q[0], q[1], q[2]);
  const depth = (q: V3) => q[2] * Math.cos(yaw) - (q[0] - cx) * Math.sin(yaw);
  const TOE: [number, number][] = [
    [205, 175],
    [45, 215],
    [-215, 200],
  ];
  const legs: (LegGeo & { depth: number })[] = [];
  for (const side of [-1, 1])
    for (let pair = 0; pair < 3; pair++) {
      const B = LEG_BONES[pair];
      const r2 = segPoint(b.meso, B.attach);
      const root: V3 = [r2[0], r2[1], side * 20];
      const hip: V3 = v3.add(root, [-B.coxa * 0.3 * ANT_S, B.coxa * 0.85 * ANT_S, side * B.coxa * 0.35 * ANT_S]);
      const toe: V3 = [TOE[pair][0], 0, side * TOE[pair][1]];
      const tdir = v3.norm([pair === 0 ? 0.5 : pair === 1 ? -0.1 : -0.6, 0.25, side * 0.8]);
      const ankle = v3.sub(toe, v3.mul(tdir, B.tarsus * ANT_S * 0.92));
      const knee = ik3(hip, ankle, B.femur * ANT_S, B.tibia * ANT_S, [0, -1, side * 0.55]);
      legs.push({ id: `${side}${pair}`, side, pair, root: P(root), hip: P(hip), knee: P(knee), ankle: P(ankle), toe: P(toe), r: 1, depth: depth(knee) });
    }
  return { b, legs, P, depth };
};

export const AntSheetProbe: React.FC<{ air: "A" | "B"; pose: "side" | "3q" | "grip" }> = ({ air, pose }) => {
  useCurrentFrame();
  const A = AIRS[air];
  const W = 1080;
  const H = 1920;
  const look = antLook(A, 0.06);
  const far = antLook(A, 0.24);
  if (pose === "3q") {
    const cx = 0;
    const view: AntView = { yaw: 0.62, cx, pitch: 0.36, cy: 0 };
    const st = standing(view);
    // the ground under it, seen from the same view
    const gr = Array.from({ length: 48 }, (_, i) => {
      const t = (i / 48) * Math.PI * 2;
      return viewPoint(view, 260 * Math.cos(t) - 10, 0, 230 * Math.sin(t));
    });
    const S = 2 * 1.3;
    const farLegs = st.legs.filter((g) => g.depth > 0);
    const nearLegs = st.legs.filter((g) => g.depth <= 0);
    const sockN = st.P([segPoint(st.b.head, [38 * 1.1, -26 * 1.1])[0], segPoint(st.b.head, [38 * 1.1, -26 * 1.1])[1], -24]);
    const sockF = st.P([segPoint(st.b.head, [38 * 1.1, -26 * 1.1])[0], segPoint(st.b.head, [38 * 1.1, -26 * 1.1])[1], 24]);
    return (
      <AirBackdrop air={A}>
        <svg width={W} height={H} style={{ position: "absolute" }}>
          <g transform={`translate(${W / 2} ${H * 0.52}) scale(${S}) translate(${-cx} 40)`}>
            <defs>
              <radialGradient id="p3q-sh" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor={A.shade} stopOpacity={0.45} />
                <stop offset="0.6" stopColor={A.shade} stopOpacity={0.22} />
                <stop offset="1" stopColor={A.shade} stopOpacity={0} />
              </radialGradient>
            </defs>
            <path d={`M${gr.map((p) => p.join(",")).join("L")}Z`} fill="url(#p3q-sh)" />
            {farLegs.map((g) => (
              <AntLeg key={g.id} g={g} look={far} />
            ))}
            <Antenna head={st.b.head} scapeA={-2.0} funA={-0.5} look={far} sock={sockF} />
            <AntBody uid="p3q" b={st.b} look={look} mandOpen={0.06} myc={0.7} mycOpacity={0.95} mycWidth={2.7} view={view} threads={false} />
            <Antenna head={st.b.head} scapeA={-2.3} funA={-0.3} look={look} sock={sockN} />
            {nearLegs.map((g) => (
              <AntLeg key={g.id} g={g} look={look} />
            ))}
          </g>
        </svg>
      </AirBackdrop>
    );
  }
  const f = pose === "side" ? 4 : 136;
  const cam = camAt(f);
  const e = eyeOf(cam, f);
  const ant = antAt(e, f);
  const b: BodyPose = ant.b;
  const c: P2 = [(b.head.p[0] + b.gaster.p[0]) / 2, (b.head.p[1] + b.gaster.p[1]) / 2];
  const S = 2 * cam.k;
  const nearLegs = ant.legs.filter((g) => g.side < 0);
  const farLegs = ant.legs.filter((g) => g.side > 0);
  const grow = stalkGrow(f);
  const spec = stalkSpecAt(b, f);
  return (
    <AirBackdrop air={A}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <g transform={`translate(${W / 2} ${H / 2 + (pose === "grip" ? 120 : 0)}) scale(${S}) translate(${-c[0]} ${-c[1]})`}>
          {pose === "side" ? <ellipse cx={b.meso.p[0]} cy={0} rx={260} ry={18} fill={A.shade} opacity={0.3} /> : null}
          {farLegs.map((g) => (
            <AntLeg key={g.id} g={g} look={far} />
          ))}
          <Antenna head={b.head} scapeA={ant.antF[0]} funA={ant.antF[1]} look={far} />
          {pose === "grip" ? <LeafShape e={e} leaf={BITE_LEAF} uid="pl" detail={1} litEdge tones={BITE_TONES} /> : null}
          <AntBody uid="pa" b={b} look={look} mandOpen={ant.mandOpen} myc={ant.myc} mycOpacity={ant.mycOp} mycWidth={ant.mycW} nearJaw={false} />
          <Antenna head={b.head} scapeA={ant.antN[0]} funA={ant.antN[1]} look={look} />
          {nearLegs.map((g) => (
            <AntLeg key={g.id} g={g} look={look} />
          ))}
          {pose === "grip" ? <JointTufts b={b} t={(f - 100) / 40} legs={nearLegs} /> : null}
          <Jaw head={b.head} which="near" open={ant.mandOpen} look={look} />
          {pose === "grip" && grow > 0 ? (
            <>
              <mask id="pm" maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={9000} height={9000}>
                <rect x={-4000} y={-4000} width={9000} height={9000} fill="white" />
                <path d={headOutline(b)} fill="black" />
                <path d={jawOutline(b.head, ant.mandOpen)} fill="black" />
              </mask>
              <g mask="url(#pm)">
                <CordycepsStalk uid="ps" {...spec} grow={grow} ripen={1} shadow={1} />
              </g>
            </>
          ) : null}
        </g>
      </svg>
    </AirBackdrop>
  );
};
void NODE;
void T;
