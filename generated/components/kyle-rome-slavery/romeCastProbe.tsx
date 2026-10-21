// ---------------------------------------------------------------------------
// romeCastProbe: the probe sheets of the Roman cast (romeCast.tsx). Render entry src/entry.RomeCast.ts.
//   RomeCastHeroes   every character and variant at hero size (a man ~600 px)
//   RomeCastPhone    a 1080 x 1920 frame: the four kinds at ~220 px and a crowd at ~120 px (judge at 270 px wide)
//   RomeCastPoses    every pose, for each kind
//   RomeCastWork     a row of 6 slaves pushing a bar, 4 freemen working, a Dominus reclining by a CoinHeap, props
//   RomeCastFetters  the fetters' chain following a walk, every frame of one 30-frame cycle
//   RomeCastHeads    the heads at yaw 0 -> 1.4 (and -0.7)
//   RomeCastAudit    a London Worker beside a Rome Slave (and a Freeman) at the same scale
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { type P2 } from "../kits/maps/incaShared";
import { Worker, POSES as LPOSES } from "../kyle-london/londonCastV2";
import { ContactShadow, GroundPlane, perspective, type Persp } from "../kyle-london/londonDepth";
import {
  Amphora,
  Basket,
  Chain,
  CoinHeap,
  Couch,
  Dominus,
  Freeman,
  GRIND,
  Hammer,
  Overseer,
  POSES,
  POTTER,
  Pick,
  PotterWheel,
  Rod,
  RotaryQuern,
  Sack,
  Slave,
  Stool,
  WALK_CYCLE,
  headTurn,
  quernHandle,
  reclineAt,
  romeAnchors,
  scaleForPx,
  type FigPose,
  RomeFigure,
  type RomeKind,
} from "./romeCast";

const PAGE = "#3F3428";
const Sheet: React.FC<{ w: number; h: number; children?: React.ReactNode }> = ({ w, h, children }) => (
  <AbsoluteFill style={{ backgroundColor: PAGE }}>
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
      {children}
    </svg>
  </AbsoluteFill>
);
const Lbl: React.FC<{ x: number; y: number; t: string; size?: number }> = ({ x, y, t, size = 22 }) => (
  <text x={x} y={y} fill="#E9DDBF" fillOpacity={0.55} fontSize={size} fontFamily="Georgia, serif">
    {t}
  </text>
);
/** a shadow on the sheet's flat floor (no perspective): an ellipse to the lower right */
const Shadow: React.FC<{ at: P2; s: number; w?: number }> = ({ at, s, w = 70 }) => <ellipse cx={at[0] + 12 * s} cy={at[1] + 4 * s} rx={w * s} ry={12 * s} fill="#17120D" opacity={0.45} />;

// ---------------------------------------------------------------------------
type Cast = { kind: RomeKind; v: number; label: string; props?: Record<string, unknown>; pose: FigPose };
const HERO: Cast[][] = [
  [
    { kind: "slave", v: 0, label: "slave 0 tunic", pose: POSES.stand(1) },
    { kind: "slave", v: 1, label: "slave 1 exomis + fetters", props: { garb: "exomis", fetters: true }, pose: POSES.front() },
    { kind: "slave", v: 2, label: "slave 2 loincloth + collar", props: { garb: "loincloth", collar: true }, pose: POSES.stand(-1) },
    { kind: "slave", v: 3, label: "slave 3 woman", pose: headTurn(POSES.stand(1), 0.4) },
    { kind: "slave", v: 4, label: "slave 4 older, collar + fetters", props: { collar: true, fetters: true }, pose: POSES.stoop(1) },
  ],
  [
    { kind: "freeman", v: 0, label: "freeman 0", pose: POSES.stand(1) },
    { kind: "freeman", v: 1, label: "freeman 1", pose: POSES.front() },
    { kind: "freeman", v: 2, label: "freeman 2 older", pose: POSES.stand(-1) },
    { kind: "freeman", v: 3, label: "freeman 3 shopkeeper", pose: POSES.gesture(1, 1) },
    { kind: "overseer", v: 0, label: "overseer 0 rod", pose: POSES.stand(-1) },
  ],
  [
    { kind: "dominus", v: 0, label: "dominus 0", pose: POSES.stand(1) },
    { kind: "dominus", v: 1, label: "dominus 1 older, stripe", props: { stripe: true }, pose: POSES.front() },
    { kind: "dominus", v: 2, label: "dominus 2 younger, pointing", pose: POSES.point(1, 1) },
    { kind: "overseer", v: 1, label: "overseer 1 whip", props: { tool: "whip" }, pose: POSES.raiseRod(1, 0.4) },
    { kind: "overseer", v: 2, label: "overseer 2 (auctioneer)", props: { tool: "none" }, pose: POSES.gesture(-1, 1) },
  ],
];
export const HERO_W = 3300;
export const HERO_H = 2250;
export const RomeCastHeroes: React.FC = () => {
  const s = scaleForPx(600);
  return (
    <Sheet w={HERO_W} h={HERO_H}>
      {HERO.map((row, i) =>
        row.map((c, j) => {
          const at: P2 = [330 + j * 660, 700 + i * 740];
          return (
            <g key={`${i}-${j}`}>
              <Shadow at={at} s={s} />
              <RomeFigure kind={c.kind} variant={c.v} pose={c.pose} at={at} scale={s} uid={`h${i}x${j}`} shade={1} {...c.props} />
              <Lbl x={at[0] - 290} y={at[1] + 34} t={c.label} />
            </g>
          );
        }),
      )}
    </Sheet>
  );
};

// ---------------------------------------------------------------------------
/** a 1080 x 1920 frame: a slave, a freeman, a dominus and an overseer at ~220 px; below, a mixed crowd at ~120 px */
export const RomeCastPhone: React.FC = () => {
  const s1 = scaleForPx(220);
  const s2 = scaleForPx(120);
  const big: Cast[] = [
    { kind: "slave", v: 1, label: "", props: { fetters: true, collar: true }, pose: POSES.stand(1) },
    { kind: "freeman", v: 0, label: "", pose: POSES.stand(1) },
    { kind: "dominus", v: 0, label: "", pose: POSES.gesture(-1, 1) },
    { kind: "overseer", v: 0, label: "", pose: POSES.raiseRod(-1, 1) },
  ];
  const small: Cast[] = [
    { kind: "slave", v: 0, label: "", pose: POSES.walk(1, 0.1) },
    { kind: "slave", v: 2, label: "", props: { garb: "exomis" }, pose: POSES.walk(1, 0.6) },
    { kind: "slave", v: 3, label: "", pose: POSES.stand(1) },
    { kind: "freeman", v: 1, label: "", pose: POSES.stand(1) },
    { kind: "freeman", v: 3, label: "", pose: POSES.stand(-1) },
    { kind: "dominus", v: 1, label: "", pose: POSES.stand(-1) },
    { kind: "overseer", v: 1, label: "", pose: POSES.stand(-1) },
  ];
  return (
    <Sheet w={1080} h={1920}>
      {big.map((c, j) => {
        const at: P2 = [150 + j * 260, 900];
        return (
          <g key={j}>
            <Shadow at={at} s={s1} />
            <RomeFigure kind={c.kind} variant={c.v} pose={c.pose} at={at} scale={s1} uid={`pb${j}`} shade={1} {...c.props} />
          </g>
        );
      })}
      {small.map((c, j) => {
        const at: P2 = [110 + j * 143, 1650];
        return (
          <g key={j}>
            <Shadow at={at} s={s2} />
            <RomeFigure kind={c.kind} variant={c.v} pose={c.pose} at={at} scale={s2} uid={`ps${j}`} shade={1} {...c.props} />
          </g>
        );
      })}
    </Sheet>
  );
};

// ---------------------------------------------------------------------------
/** every pose (columns) for each kind (rows) */
const POSE_COLS: { label: string; q: (k: RomeKind) => FigPose; props?: Record<string, unknown> }[] = [
  { label: "front", q: () => POSES.front() },
  { label: "stand L", q: () => POSES.stand(-1) },
  { label: "walk .25", q: () => POSES.walk(1, 0.25) },
  { label: "gesture", q: () => POSES.gesture(1, 1) },
  { label: "point", q: () => POSES.point(1, 1, [300, -200]) },
  { label: "push", q: () => POSES.push(1, 0.2) },
  { label: "tread", q: () => POSES.tread(1, 0.2) },
  { label: "carry amphora", q: () => POSES.carry(1, 0.3), props: { load: "amphora" } },
  { label: "carry sack", q: () => POSES.carry(-1, 0.7), props: { load: "sack" } },
  { label: "strike .6", q: () => POSES.strike(1, 0.6), props: { tool: "hammer" } },
  { label: "strike 0", q: () => POSES.strike(1, 0), props: { tool: "pick" } },
  { label: "haul", q: () => POSES.haul(1, 0.2) },
  { label: "stoop", q: () => POSES.stoop(1) },
  { label: "raiseRod", q: () => POSES.raiseRod(1, 1), props: { tool: "rod" } },
];
const POSE_ROWS: { kind: RomeKind; v: number; props?: Record<string, unknown> }[] = [
  { kind: "slave", v: 0, props: { fetters: true } },
  { kind: "slave", v: 3 },
  { kind: "freeman", v: 0 },
  { kind: "dominus", v: 0 },
  { kind: "overseer", v: 1 },
];
export const POSES_W = 14 * 300 + 60;
export const POSES_H = 5 * 420 + 80;
export const RomeCastPoses: React.FC = () => {
  const s = 1.05;
  return (
    <Sheet w={POSES_W} h={POSES_H}>
      {POSE_COLS.map((c, j) => (
        <Lbl key={c.label} x={40 + j * 300} y={40} t={c.label} />
      ))}
      {POSE_ROWS.map((row, i) =>
        POSE_COLS.map((c, j) => {
          const at: P2 = [170 + j * 300, 440 + i * 420];
          return (
            <g key={`${i}-${j}`}>
              <Shadow at={at} s={s} w={50} />
              <RomeFigure kind={row.kind} variant={row.v} pose={c.q(row.kind)} at={at} scale={s} uid={`q${i}x${j}`} shade={1} {...row.props} {...c.props} />
            </g>
          );
        }),
      )}
    </Sheet>
  );
};

// ---------------------------------------------------------------------------
/** the work sheet on a perspective floor: 6 slaves pushing a mill bar; 4 freemen working (potter, quern, hammer,
 *  carrying); a Dominus reclining on his couch beside a coin heap; an overseer; the props */
export const WORK_W = 2400;
export const WORK_H = 2700;
const FLOOR1 = 900;
const FLOOR2 = 1700;
const FLOOR3 = 2560;
const Floor: React.FC<{ y: number; uid: string; children: (P: Persp) => React.ReactNode }> = ({ y, uid, children }) => {
  const P = perspective({ k: 1, cx: WORK_W / 2, cy: 0 }, { eyeY: -520, dRef: 1600, kRef: 1, dolly: 0 });
  return (
    <g transform={`translate(0 ${y})`}>
      <GroundPlane P={P} kind="flags" x0={-200} x1={WORK_W + 200} z0={-120} zFar={1800} uid={uid} />
      {children(P)}
    </g>
  );
};
export const RomeCastWork: React.FC<{ phase?: number }> = ({ phase = 0.2 }) => {
  const sP = 1.1;
  return (
    <Sheet w={WORK_W} h={WORK_H}>
      <Floor y={FLOOR1} uid="f1">
        {(P) => {
          // six slaves walking in step, each pushing his own bar (a capstan's spokes seen side-on)
          const men = Array.from({ length: 6 }, (_, i) => ({ X: 180 + i * 360, Z: 0, v: i % 5 }));
          return men.map((m, i) => {
            const a = P.at(m.X, m.Z);
            const q = POSES.push(1, phase + i * 0.08);
            const anc = romeAnchors("slave", q, a.at, sP, { variant: m.v });
            const g = anc.handNear;
            return (
              <g key={i}>
                <ContactShadow P={P} X={m.X} Z={m.Z} uid={`ws${i}`} />
                <path d={`M${g[0] - 14},${g[1] + 10}L${g[0] + 60},${g[1] - 6}`} stroke="#17120D" strokeWidth={15} strokeLinecap="round" />
                <path d={`M${g[0] - 14},${g[1] + 10}L${g[0] + 60},${g[1] - 6}`} stroke="#8C7A5A" strokeWidth={10} strokeLinecap="round" />
                <Slave variant={m.v} pose={q} at={a.at} scale={sP} uid={`push${i}`} shade={1} garb={i % 2 ? "exomis" : "tunic"} fetters={i === 2} />
              </g>
            );
          });
        }}
      </Floor>
      <Floor y={FLOOR2} uid="f2">
        {(P) => {
          const s = 1.15;
          const potAt = P.at(260, 0).at;
          const qAt = P.at(860, 0).at;
          const quernAt: P2 = [qAt[0] + GRIND.quernDX * s, qAt[1]];
          const qGrip = quernHandle(quernAt, s, phase, 1);
          const hAt = P.at(1420, 0).at;
          const cAt = P.at(2000, 0).at;
          return (
            <>
              <ContactShadow P={P} X={260} Z={0} uid="c1" />
              <Stool at={[potAt[0] + POTTER.stoolDX * s, potAt[1]]} scale={s} uid="stool" />
              <PotterWheel at={[potAt[0] + POTTER.wheelDX * s, potAt[1]]} scale={s} uid="wheel" turn={phase} />
              <Freeman variant={0} pose={POSES.potter(1, phase)} at={potAt} scale={s} uid="fpot" shade={1} />
              <ContactShadow P={P} X={860} Z={0} uid="c2" />
              <RotaryQuern at={quernAt} scale={s} uid="quern" turn={phase} />
              <Freeman variant={3} pose={POSES.grind(1, phase)} at={qAt} scale={s} uid="fgr" shade={1} grip={{ L: qGrip }} />
              <ContactShadow P={P} X={1420} Z={0} uid="c3" />
              <Freeman variant={1} pose={POSES.strike(1, 0.62)} at={hAt} scale={s} uid="fst" shade={1} tool="hammer" />
              <ContactShadow P={P} X={2000} Z={0} uid="c4" />
              <Freeman variant={2} pose={POSES.carry(1, phase)} at={cAt} scale={s} uid="fca" shade={1} load="amphora" />
            </>
          );
        }}
      </Floor>
      <Floor y={FLOOR3} uid="f3">
        {(P) => {
          const s = 1.2;
          const couchAt = P.at(520, 60).at;
          return (
            <>
              <ContactShadow P={P} X={520} Z={60} w={200} d={50} uid="cc" />
              <Couch at={couchAt} scale={s} uid="couch" />
              <Dominus variant={1} pose={POSES.recline(1)} at={reclineAt(couchAt, s, 1)} scale={s} uid="drec" shade={1} stripe />
              <ContactShadow P={P} X={980} Z={20} w={130} d={50} uid="ch" />
              <CoinHeap at={P.at(980, 20).at} scale={s} amount={1} uid="heap" />
              <CoinHeap at={P.at(1250, 20).at} scale={s} amount={0.35} uid="heap2" />
              <ContactShadow P={P} X={1530} Z={0} uid="co" />
              <Overseer variant={0} pose={POSES.raiseRod(-1, 0.6)} at={P.at(1530, 0).at} scale={s} uid="ovr" shade={1} />
              <Amphora at={P.at(1760, 0).at} scale={s} uid="am" />
              <Sack at={P.at(1900, 0).at} scale={s} uid="sk" />
              <Basket at={P.at(2040, 0).at} scale={s} uid="bk" />
              <Hammer at={[2120, -30]} scale={s} angle={-20} uid="hm" />
              <Pick at={[1700, -250]} scale={s} angle={-10} uid="pk" />
              <Rod at={[1950, -250]} scale={s} angle={-10} uid="rd" />
              <Chain a={[1700, -150]} b={[2250, -170]} slack={1.12} groundY={-40} uid="chn" />
            </>
          );
        }}
      </Floor>
    </Sheet>
  );
};

// ---------------------------------------------------------------------------
/** the fetters following a walk: one 30-frame cycle, every frame (the legs only), the figure held in place */
export const FETTER_W = 30 * 150 + 40;
export const FETTER_H = 520;
export const RomeCastFetters: React.FC = () => {
  const s = 1.3;
  return (
    <Sheet w={FETTER_W} h={FETTER_H}>
      {Array.from({ length: 30 }, (_, f) => {
        const x0 = 20 + f * 150;
        const at: P2 = [x0 + 70, 460];
        return (
          <g key={f}>
            <clipPath id={`fc${f}`}>
              <rect x={x0} y={0} width={140} height={FETTER_H} />
            </clipPath>
            <g clipPath={`url(#fc${f})`}>
              <Shadow at={at} s={s} w={44} />
              <Slave variant={0} pose={POSES.walk(1, f / WALK_CYCLE)} at={at} scale={s} uid={`fw${f}`} fetters shade={1} />
            </g>
            <Lbl x={x0 + 4} y={30} t={`f${f}`} size={20} />
          </g>
        );
      })}
    </Sheet>
  );
};

// ---------------------------------------------------------------------------
/** head and shoulders of every kind at head yaws 0 .. 1.4 and -0.7 */
const HEAD_ROWS: { kind: RomeKind; v: number; props?: Record<string, unknown> }[] = [
  { kind: "slave", v: 0, props: { collar: true } },
  { kind: "slave", v: 1 },
  { kind: "slave", v: 3 },
  { kind: "slave", v: 4 },
  { kind: "freeman", v: 0 },
  { kind: "freeman", v: 2 },
  { kind: "dominus", v: 0 },
  { kind: "dominus", v: 1 },
  { kind: "overseer", v: 0 },
];
const YAWS = [0, 0.35, 0.7, 1.05, 1.4, -0.7];
export const HEADS_W = YAWS.length * 380 + 20;
export const HEADS_H = HEAD_ROWS.length * 300 + 20;
export const RomeCastHeads: React.FC = () => {
  const s = 2.3;
  return (
    <Sheet w={HEADS_W} h={HEADS_H}>
      {HEAD_ROWS.map((row, i) =>
        YAWS.map((y, j) => {
          const q: FigPose = { ...POSES.stand(y >= 0 ? 1 : -1), yaw: y * 0.75, headYaw: y };
          const x0 = 10 + j * 380;
          const y0 = 10 + i * 300;
          return (
            <g key={`${i}-${j}`}>
              <clipPath id={`hc${i}x${j}`}>
                <rect x={x0} y={y0} width={370} height={292} />
              </clipPath>
              <g clipPath={`url(#hc${i}x${j})`}>
                <RomeFigure kind={row.kind} variant={row.v} pose={q} at={[x0 + 185, y0 + 50 + 330 * s]} scale={s} uid={`hd${i}x${j}`} shade={1} tool="none" {...row.props} />
              </g>
            </g>
          );
        }),
      )}
    </Sheet>
  );
};

// ---------------------------------------------------------------------------
/** the self-audit: the approved London Worker beside a Rome Slave and Freeman at the same scale */
export const RomeCastAudit: React.FC = () => {
  const s = scaleForPx(600);
  return (
    <Sheet w={2000} h={800}>
      <Shadow at={[330, 720]} s={s} />
      <Worker pose={LPOSES.stand(1)} at={[330, 720]} scale={s} uid="lw" shade={1} />
      <Shadow at={[1000, 720]} s={s} />
      <Slave variant={0} pose={POSES.stand(1)} at={[1000, 720]} scale={s} uid="rs" shade={1} />
      <Shadow at={[1670, 720]} s={s} />
      <Freeman variant={0} pose={POSES.stand(1)} at={[1670, 720]} scale={s} uid="rf" shade={1} />
      <Lbl x={120} y={770} t="London Worker (approved)" />
      <Lbl x={820} y={770} t="Rome Slave 0" />
      <Lbl x={1480} y={770} t="Rome Freeman 0" />
    </Sheet>
  );
};

/** a debug close-up (one figure, big) */
export const RomeCastDebug: React.FC = () => (
  <Sheet w={1600} h={900}>
    <Couch at={[800, 800]} scale={2} uid="dc" />
    <Dominus variant={0} pose={POSES.recline(1)} at={reclineAt([800, 800], 2, 1)} scale={2} uid="dd" shade={1} />
  </Sheet>
);

/** (cut E's hero) a Dominus reclining on his couch with a wine cup, beside a coin heap at amount 0.5; a man ~500 px
 *  long, on the depth floor, 1080 x 1920 */
export const RomeCastRecline: React.FC = () => {
  const P = perspective({ k: 1, cx: 540, cy: 0 }, { eyeY: -760, dRef: 1500, kRef: 1, dolly: 0 });
  const s = 2;
  const couch = P.at(-60 + 540, 40);
  const heap = P.at(860, -60);
  return (
    <Sheet w={1080} h={1920}>
      <g transform="translate(0 1180)">
        <GroundPlane P={P} kind="flags" x0={-600} x1={1700} z0={-300} zFar={2200} uid="rgp" />
        <ContactShadow P={P} X={480} Z={40} w={330} d={70} uid="rcs" />
        <Couch at={couch.at} scale={s} uid="rcouch" />
        <Dominus variant={0} pose={POSES.recline(1)} at={reclineAt(couch.at, s, 1)} scale={s} uid="rdom" shade={1} held="cup" />
        <ContactShadow P={P} X={860} Z={-60} w={240} d={80} uid="rch" />
        <CoinHeap at={heap.at} scale={heap.scale * 1.7} amount={0.5} uid="rheap" />
      </g>
    </Sheet>
  );
};
