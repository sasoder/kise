// ---------------------------------------------------------------------------
// sinceWritingProbe — probe stills of the rsi-since-writing shared world (sinceWritingFolk.tsx, sinceWritingWorld.tsx).
// Render entry src/entry.SinceWritingProbe.ts.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { AirBox, AirFloor, AirStage, AirShadow, H as AH, WorldSvg, airWorldOf, makeAirView, mixHex, type AirScene, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CovidContactShadow } from "../kyle-covid/covidFolk";
import { GENIUS_POSES, Genius, geniusScaleForPx } from "../rsi-ten-earths/tenEarthsGenius";
import { MAT_LAMINATE } from "../rsi-ten-earths/tenEarthsHall";
import {
  CoffeeMug,
  CoffeePot,
  CoffeeStream,
  CrumpledSheet,
  MAT_FLOORWOOD,
  MUG,
  coffeeMugMouth,
  coffeePotForSpout,
  coffeePotSpout,
  MugSteam,
  OFFICE,
  OfficeDesk,
  OfficeRoom,
  OfficeShafts,
  OfficeTint,
  Plate,
  SheetStack,
  Shelf,
  WireBin,
  WorkSheet,
  YearBinder,
  heapLayout,
  officeScene,
  plateT,
  sheetFlight,
  shelfSlots,
  stackTop,
} from "./sinceWritingWorld";
import { HUMAN_DESK, HUMAN_POSES, HUMAN_WALK_CYCLE, Human, humanAnchors, humanLookName, humanScaleForPx, type HumanPose, type P2 } from "./sinceWritingFolk";

export const FPS = 24000 / 1001;
const SCENE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 800, fogVis: 2200, fogMax: 0.97, hLow: 0, hHigh: 300, moteUnit: 100 };
const FONT = "Helvetica, Arial, sans-serif";
const TXT = "#F3EBDD";
const airCss = (v: ReturnType<typeof makeAirView>, f: number) => {
  const c = v.airAtScreen(f * AH);
  return `rgb(${c.map((x) => Math.round(x)).join(",")})`;
};
const SheetAir: React.FC<{ w: number; h: number; base: number[]; id: string; children?: React.ReactNode }> = ({ w, h, base, id, children }) => {
  const v = makeAirView({ scene: SCENE, frame: 0, horizon: 1250 });
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
      <AirStage v={v} shafts={0} motes={0} grain={0} bloom={0.22}>
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            {base.map((b, i) => (
              <linearGradient key={i} id={`fl${id}${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={airCss(v, 0.55)} stopOpacity={0} />
                <stop offset="0.35" stopColor={mixHex("#857659", "#5F877D", 0.35)} stopOpacity={0.55} />
                <stop offset="1" stopColor={mixHex("#6B5E49", "#3A3128", 0.3)} stopOpacity={1} />
              </linearGradient>
            ))}
          </defs>
          {base.map((b, i) => (
            <rect key={i} x={0} y={b - 140} width={w} height={150 + (i < base.length - 1 ? 0 : h - b)} fill={`url(#fl${id}${i})`} />
          ))}
          {children}
        </svg>
      </AirStage>
    </div>
  );
};
const Lbl: React.FC<{ x: number; y: number; t: string; size?: number; op?: number }> = ({ x, y, t, size = 22, op = 0.85 }) => (
  <text x={x} y={y} fill={TXT} fontFamily={FONT} fontSize={size} textAnchor="middle" opacity={op}>
    {t}
  </text>
);

// ---------------------------------------------------------------------------
// STYLE: the human v0-v2 next to the Genius v0
// ---------------------------------------------------------------------------
const MANPX = 600;
export const STYLE_W = 6 * 360 + 120;
export const STYLE_H = 860;
export const ProbeStyle: React.FC = () => {
  const s = humanScaleForPx(MANPX);
  const base = 740;
  const X = (j: number) => 220 + j * 360;
  const cells: React.ReactNode[] = [];
  for (let v = 0; v < 3; v++)
    cells.push(
      <g key={`h${v}`}>
        <CovidContactShadow at={[X(v), base]} scale={s} uid={`hs${v}`} />
        <Human variant={v} pose={HUMAN_POSES.stand(1, 0)} at={[X(v), base]} scale={s} uid={`h${v}`} />
        <Lbl x={X(v)} y={base + 60} t={humanLookName(v).split(":")[0]} />
        <Lbl x={X(v)} y={base + 88} t={humanLookName(v).split(": ")[1]} size={17} op={0.7} />
      </g>,
    );
  cells.push(
    <g key="g0">
      <CovidContactShadow at={[X(3), base]} scale={s} uid="gs0" />
      <Genius variant={0} pose={GENIUS_POSES.stand(-1, 0)} at={[X(3), base]} scale={geniusScaleForPx(MANPX)} uid="g0" />
      <Lbl x={X(3)} y={base + 60} t="Genius v0" />
    </g>,
  );
  cells.push(
    <g key="h0f">
      <CovidContactShadow at={[X(4), base]} scale={s} uid="hsf" />
      <Human variant={0} pose={HUMAN_POSES.look(0, 0)} at={[X(4), base]} scale={s} uid="h0f" />
      <Lbl x={X(4)} y={base + 60} t="v0 front" />
    </g>,
  );
  cells.push(
    <g key="h1b">
      <CovidContactShadow at={[X(5), base]} scale={s} uid="hsb" />
      <Human variant={2} pose={HUMAN_POSES.stand(-1, 0)} at={[X(5), base]} scale={s} uid="h2l" />
      <Lbl x={X(5)} y={base + 60} t="v2 facing left" />
    </g>,
  );
  return (
    <SheetAir w={STYLE_W} h={STYLE_H} base={[base]} id="st">
      {cells}
    </SheetAir>
  );
};

// ---------------------------------------------------------------------------
// POSES: every pose at 5 values of t
// ---------------------------------------------------------------------------
const CHAIR = "#566D6A";
const DESKC = "#A39B88";
const DeskStub: React.FC<{ at: P2; s: number; dir: 1 | -1; front?: boolean }> = ({ at, s, dir, front }) => {
  const P = (x: number, y: number): string => `${at[0] + dir * x * s},${at[1] + y * s}`;
  const D = HUMAN_DESK;
  if (front)
    return (
      <g>
        <polygon points={[P(D.front, -D.deskH), P(230, -D.deskH), P(230, -D.deskH + 7), P(D.front, -D.deskH + 7)].join(" ")} fill={DESKC} />
        <polygon points={[P(205, -D.deskH + 7), P(213, -D.deskH + 7), P(213, 0), P(205, 0)].join(" ")} fill={mixHex(DESKC, "#22180F", 0.4)} />
      </g>
    );
  return (
    <g>
      <polygon points={[P(-30, -D.seatH), P(26, -D.seatH), P(26, -D.seatH + 9), P(-30, -D.seatH + 9)].join(" ")} fill={CHAIR} />
      <polygon points={[P(-3, -D.seatH + 9), P(3, -D.seatH + 9), P(3, -12), P(-3, -12)].join(" ")} fill={mixHex(CHAIR, "#22180F", 0.3)} />
      <polygon points={[P(-36, -D.seatH - 120), P(-28, -D.seatH - 120), P(-26, -D.seatH + 4), P(-34, -D.seatH + 4)].join(" ")} fill={CHAIR} />
      <polygon points={[P(D.sheet[0] - 26, -D.deskH - 0.5), P(D.sheet[0] + 26, -D.deskH - 0.5), P(D.sheet[0] + 22, -D.deskH + 2), P(D.sheet[0] - 22, -D.deskH + 2)].join(" ")} fill="#EFE7D6" />
    </g>
  );
};
type PoseCell = { label: string; pose: HumanPose; v?: number; desk?: boolean; dot?: P2[] };
const T5 = [0, 0.25, 0.5, 0.75, 1];
const cellsOf = (): PoseCell[][] => [
  [
    { label: "stand", pose: HUMAN_POSES.stand(1, 0) },
    { label: "stand (left) v1", pose: HUMAN_POSES.stand(-1, 30), v: 1 },
    ...[0, 0.62, 1.3, 2.4, Math.PI].map((y) => ({ label: `look ${y.toFixed(2)}`, pose: HUMAN_POSES.look(y, 0) })),
  ],
  [...[0, 5, 10, 15, 20].map((f) => ({ label: `walk f${f}`, pose: HUMAN_POSES.walk(1, f) })), ...[0, 12].map((f) => ({ label: `walk left f${f} v2`, pose: HUMAN_POSES.walk(-1, f), v: 2 }))],
  [...[0, 13, 26, 39, 47].map((f) => ({ label: `seatedWrite f${f}`, pose: HUMAN_POSES.seatedWrite(1, f), desk: true })), { label: "seatedWrite (left) v1", pose: HUMAN_POSES.seatedWrite(-1, 10), v: 1, desk: true }],
  [...T5.map((t) => ({ label: `seatedSip t ${t}`, pose: HUMAN_POSES.seatedSip(1, t).pose, desk: true })), { label: "seatedSip 0.5 (left) v2", pose: HUMAN_POSES.seatedSip(-1, 0.5).pose, v: 2, desk: true }],
  [
    ...T5.map((t) => {
      const r = HUMAN_POSES.pour(1, t);
      return { label: `pour t ${t}`, pose: r.pose, dot: r.flow > 0 ? [r.spout, r.mouth] : undefined };
    }),
    { label: "pour 0.55 (left) v1", pose: HUMAN_POSES.pour(-1, 0.55).pose, v: 1 },
  ],
  [...T5.map((t) => ({ label: `handOver t ${t}`, pose: HUMAN_POSES.handOver(1, t).pose, desk: true })), { label: "handOver standing 0.5", pose: HUMAN_POSES.handOver(1, 0.5, 0, false).pose }],
];
const PCOLW = 330;
const PROWH = 600;
const PPX = 430;
export const POSES_W = 7 * PCOLW + 80;
export const POSES_H = 6 * PROWH + 60;
export const ProbePoses: React.FC = () => {
  const rows = cellsOf();
  const s = humanScaleForPx(PPX);
  const bases = rows.map((_, i) => 520 + i * PROWH);
  return (
    <SheetAir w={POSES_W} h={POSES_H} base={bases} id="ps">
      {rows.map((row, i) =>
        row.map((c, j) => {
          const x = 180 + j * PCOLW;
          const at: P2 = [x, bases[i]];
          const key = `${i}x${j}`;
          const dir: 1 | -1 = Math.sin(c.pose.yaw) >= 0 ? 1 : -1;
          const an = humanAnchors(c.v ?? 0, c.pose, at, s);
          return (
            <g key={key}>
              {c.desk ? <DeskStub at={at} s={s} dir={dir} /> : <CovidContactShadow at={at} scale={s} uid={`pcs${key}`} />}
              <Human variant={c.v ?? 0} pose={c.pose} at={at} scale={s} uid={`p${key}`} />
              {c.desk ? <DeskStub at={at} s={s} dir={dir} front /> : null}
              {c.dot ? <line x1={at[0] + c.dot[0][0] * s} y1={at[1] + c.dot[0][1] * s} x2={at[0] + c.dot[1][0] * s} y2={at[1] + c.dot[1][1] * s} stroke="#4A3426" strokeWidth={3} /> : null}
              {c.pose.pencil ? <circle cx={an.pencilTip[0]} cy={an.pencilTip[1]} r={3} fill="none" stroke="#2B6F8F" strokeWidth={1.5} /> : null}
              <Lbl x={x} y={bases[i] + 50} t={c.label} />
            </g>
          );
        }),
      )}
    </SheetAir>
  );
};

// ---------------------------------------------------------------------------
// THE OFFICE (1080x1920): the human with the mug (left, facing right) and the Genius typing (right, facing left)
// ---------------------------------------------------------------------------
const camAt = (wx: number, wy: number, k: number, sy = 960): Cam => ({ k, cx: wx, cy: wy - (sy - 960) / k });
export type OfficeView = "wide" | "phone";
const officeSetup = (view: OfficeView): { cam: Cam; depth: DepthOpts } =>
  view === "phone"
    ? { cam: camAt(0, -120, 1.32, 900), depth: { eyeY: -285, dRef: 1700, kRef: 1.32, dolly: 0.5 } }
    : { cam: camAt(0, -330, 1.0, 860), depth: { eyeY: -300, dRef: 1700, kRef: 1.0, dolly: 0.5 } };
export const OFFICE_SEATS = { human: { X: -232, Z: 0 }, genius: { X: 232, Z: 0 } };
const OfficeCast: React.FC<{ A: AirWorld; frame: number; sipT: number; uid: string }> = ({ A, frame, sipT, uid }) => {
  const h = OFFICE_SEATS.human;
  const g = OFFICE_SEATS.genius;
  const ha = A.P.at(h.X, h.Z);
  const ga = A.P.at(g.X, g.Z);
  const sip = HUMAN_POSES.seatedSip(1, sipT, frame);
  const an = humanAnchors(0, sip.pose, ha.at, ha.scale);
  return (
    <g>
      <OfficeDesk A={A} X={g.X} Z={g.Z} dir={-1} uid={`${uid}-gd`} layer="back" />
      <Genius variant={0} pose={GENIUS_POSES.typeAtDesk(-1, frame)} at={ga.at} scale={ga.scale} uid={`${uid}-g`} fog={A.folkFog(g.Z)} unitPx={A.k} frame={frame} />
      <OfficeDesk A={A} X={g.X} Z={g.Z} dir={-1} uid={`${uid}-gdf`} layer="front" />
      <OfficeDesk A={A} X={h.X} Z={h.Z} dir={1} uid={`${uid}-hd`} layer="back" />
      <WorkSheet A={A} pose={{ X: h.X + HUMAN_DESK.sheet[0] + 22, Y: -132.3, Z: h.Z + 46, yaw: 8, pitch: 0, roll: 0, curl: 0 }} uid={`${uid}-ws`} />
      <Human variant={0} pose={sip.pose} at={ha.at} scale={ha.scale} uid={`${uid}-h`} fog={A.folkFog(h.Z)} unitPx={A.k} frame={frame} />
      <MugSteam at={an.mugMouth} scale={ha.scale} frame={frame} amount={0.8} uid={`${uid}-st`} />
      <OfficeDesk A={A} X={h.X} Z={h.Z} dir={1} uid={`${uid}-hdf`} layer="front" />
    </g>
  );
};
export const ProbeOffice: React.FC<{ sunT: number; view: OfficeView; sipT?: number }> = ({ sunT, view, sipT = 0.5 }) => {
  const frame = 30;
  const S = officeSetup(view);
  const A = airWorldOf({ cam: S.cam, rest: S.cam, depth: S.depth, frame, scene: officeScene(sunT) });
  const tod = 7.5 * 3600 + sunT * 11 * 3600;
  return (
    <AbsoluteFill>
      <AirStage v={A.v} shafts={0} bloom={0.22} overlay={<OfficeTint sunT={sunT} />}>
        <WorldSvg cam={S.cam}>
          <OfficeRoom A={A} sunT={sunT} uid="room" clock={{ X: -560, Y: -560, secondT: tod }} />
          <WireBin A={A} X={-470} Z={60} uid="bin" layer="back" />
          <WireBin A={A} X={-470} Z={60} uid="binf" layer="front" />
          <OfficeCast A={A} frame={frame} sipT={sipT} uid="oc" />
          <OfficeShafts A={A} sunT={sunT} uid="sh" />
        </WorldSvg>
      </AirStage>
      {view === "phone" ? <PhoneGuides /> : null}
    </AbsoluteFill>
  );
};
/** the 9:16 keep-in box and the caption bands, as thin guides */
const PhoneGuides: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    <rect x={65} y={290} width={950} height={780} fill="none" stroke="#2B6F8F" strokeWidth={2} strokeDasharray="10 8" opacity={0.7} />
    <rect x={0} y={1080} width={1080} height={170} fill="#2B6F8F" opacity={0.12} />
    <rect x={0} y={1360} width={1080} height={100} fill="#2B6F8F" opacity={0.12} />
    <line x1={0} x2={1080} y1={800} y2={800} stroke="#2B6F8F" strokeWidth={1} opacity={0.5} />
    <line x1={0} x2={1080} y1={880} y2={880} stroke="#2B6F8F" strokeWidth={1} opacity={0.5} />
  </svg>
);

// ---------------------------------------------------------------------------
// THE PAPER (1080x1920, four panels with their own cameras): A stacks 1 / 10 / 37 / 100 + a flyer landing as 38 +
// the expert standing; B a crumple cream -> dead and the bin with a heap; C coffee: pot, mug with steam, the stream
// running and frozen; D binders on a shelf and a plate
// ---------------------------------------------------------------------------
const PANEL_H = 480;
const Panel: React.FC<{ i: number; k: number; look: [number, number]; eyeY: number; sunT?: number; label: string; children: (A: AirWorld) => React.ReactNode }> = ({ i, k, look, eyeY, sunT = 0.5, label, children }) => {
  const frame = 20;
  const cam = camAt(look[0], look[1], k, PANEL_H / 2);
  const A = airWorldOf({ cam, rest: cam, depth: { eyeY, dRef: 1700, kRef: k, dolly: 0.5 }, frame, scene: officeScene(sunT) });
  return (
    <div style={{ position: "absolute", left: 0, top: i * PANEL_H, width: 1080, height: PANEL_H, overflow: "hidden" }}>
      <AirStage v={A.v} shafts={0} bloom={0.22} grain={0.5}>
        <WorldSvg cam={cam}>{children(A)}</WorldSvg>
      </AirStage>
      <svg width={1080} height={PANEL_H} style={{ position: "absolute", left: 0, top: 0 }}>
        <Lbl x={540} y={PANEL_H - 16} t={label} size={19} />
        <line x1={0} x2={1080} y1={PANEL_H - 1} y2={PANEL_H - 1} stroke="#F3EBDD" strokeOpacity={0.4} strokeWidth={2} />
      </svg>
    </div>
  );
};
export const ProbePaper: React.FC = () => {
  const frame = 20;
  const Zs = 0;
  const stacks = [
    { X: -330, n: 1 },
    { X: -230, n: 10 },
    { X: -110, n: 37 },
    { X: 30, n: 100 },
  ];
  const to = stackTop(-110, Zs, 38, 0, 0, 0);
  const from = { X: 300, Y: -190, Z: Zs - 30, yaw: -30 };
  const ts = [0, 0.2, 0.4, 0.6, 0.8, 0.93];
  const heap = heapLayout(7, 2, 11);
  return (
    <AbsoluteFill style={{ backgroundColor: "#55706B" }}>
      <Panel i={0} k={1.05} look={[0, -150]} eyeY={-330} label="stacks 1 / 10 / 37 / 100 (100 = 250 u = a seated person) + a flyer landing on 37 as 38, the expert v1 (312 u)">
        {(A) => (
          <>
            <AirFloor A={A} x0={-1400} x1={1400} z0={-900} z1={1600} mat={MAT_FLOORWOOD} course={260} plank={44} />
            {stacks.map((s) => (
              <SheetStack key={s.X} A={A} X={s.X} Z={Zs} n={s.n} uid={`stk${s.n}`} seed={s.n} />
            ))}
            <AirShadow A={A} X={170} Z={Zs + 20} w={62} d={30} uid="hsh" amt={0.8} />
            <Human variant={1} pose={HUMAN_POSES.stand(-1, frame)} at={A.P.at(170, Zs + 20).at} scale={A.P.at(170, Zs + 20).scale} uid="ph" fog={A.folkFog(Zs)} unitPx={A.k} />
            {ts.map((t, i) => (
              <WorkSheet key={i} A={A} pose={sheetFlight(from, to, t, 1)} uid={`fl${i}`} shadowY={0} />
            ))}
          </>
        )}
      </Panel>
      <Panel i={1} k={2.4} look={[0, -40]} eyeY={-150} label="CrumpledSheet crumple 0 / .25 / .5 / .75 / 1 with drain = crumple; WireBin back + heapLayout(7) dead + front">
        {(A) => (
          <>
            <AirFloor A={A} x0={-1400} x1={1400} z0={-600} z1={1600} mat={MAT_FLOORWOOD} course={260} plank={44} />
            {[0, 0.25, 0.5, 0.75, 1].map((c, i) => (
              <CrumpledSheet key={i} A={A} X={-190 + i * 58} Y={-60} Z={0} seed={i} crumple={c} drain={c} uid={`cr${i}`} />
            ))}
            <WireBin A={A} X={150} Z={0} uid="bb" layer="back" />
            {heap.map((q, i) => (
              <CrumpledSheet key={i} A={A} X={150 + q.dx * 0.55} Y={-62 + q.dy * 0.5 + 18} Z={q.dz * 0.5} seed={i + 3} drain={1} size={0.85} uid={`hp${i}`} />
            ))}
            <WireBin A={A} X={150} Z={0} uid="bf" layer="front" />
            {heap.slice(0, 3).map((q, i) => (
              <CrumpledSheet key={i} A={A} X={215 + i * 26} Y={-11} Z={-20 + i * 8} seed={i + 20} drain={1} size={0.85} uid={`fl${i}`} />
            ))}
          </>
        )}
      </Panel>
      <Panel i={2} k={2.6} look={[20, -175]} eyeY={-230} label="CoffeePot upright / tilted 70 + stream (freeze 0) into a CoffeeMug; a mug with steam; the stream frozen (freeze 1)">
        {(A) => {
          const pt = 70;
          const m1 = coffeeMugMouth(A, -10, -132, 0);
          const p1 = coffeePotForSpout(-14, -132 - MUG.h - 60, pt);
          const sp = coffeePotSpout(A, p1.X, p1.Y, 0, pt);
          const m2 = coffeeMugMouth(A, 150, -132, 0);
          const p2 = coffeePotForSpout(146, -132 - MUG.h - 60, pt);
          const sp2 = coffeePotSpout(A, p2.X, p2.Y, 0, pt);
          return (
            <>
              <AirBox A={A} X0={-260} X1={260} Y0={-132} Y1={-126} Z0={-60} Z1={120} mat={MAT_LAMINATE} uid="tbl" />
              <CoffeePot A={A} X={-178} Y={-132} Z={10} uid="pot0" />
              <CoffeePot A={A} X={p1.X} Y={p1.Y} Z={0} tilt={pt} level={0.5} uid="pot1" />
              <CoffeeMug A={A} X={-10} Y={-132} Z={0} level={0.6} frame={frame} uid="mug1" />
              <CoffeeStream from={sp} to={[m1[0], m1[1] + 2]} scale={A.P.r(0)} frame={frame} freeze={0} uid="cs0" />
              <CoffeePot A={A} X={p2.X} Y={p2.Y} Z={0} tilt={pt} level={0.5} uid="pot2" />
              <CoffeeMug A={A} X={150} Y={-132} Z={0} level={0.5} frame={frame} uid="mug2" />
              <CoffeeStream from={sp2} to={[m2[0], m2[1] + 2]} scale={A.P.r(0)} frame={frame} freeze={1} uid="cs1" />
              <CoffeeMug A={A} X={208} Y={-132} Z={30} level={0.8} steam={1} frame={frame} handle={-1} uid="mug3" />
            </>
          );
        }}
      </Panel>
      <Panel i={3} k={1.25} look={[0, -560]} eyeY={-520} label="Shelf + 14 YearBinders (2-char and vertical spines, the last pulled 40), a Plate on the wall, the WallClock">
        {(A) => {
          const slots = shelfSlots(-330, 330, 14);
          return (
            <>
              <OfficeRoom A={A} sunT={0.5} uid="proom" room={{ ...OFFICE, back: 300, win: { ...OFFICE.win, x0: 520, x1: 900 } }} clock={{ X: -420, Y: -760, secondT: 10 * 3600 + 8 * 60 + 15 }} />
              <Shelf A={A} X0={-350} X1={350} Y={-520} Z={300 - 62} uid="shf" />
              {slots.map((x, i) => (
                <YearBinder key={i} A={A} X={x} Y={-520} Z={300 - 58} text={i < 3 ? `${26 + i}` : `${2026 + i}`} color={i} pull={i === slots.length - 1 ? 40 : 0} uid={`yb${i}`} />
              ))}
              <Plate A={A} X={0} Y={-700} Z={300 - 70} text="2026-2039" t={plateT(30, 0)} uid="pl" size={56} />
            </>
          );
        }}
      </Panel>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// STRIPS: every frame of seatedSip (t over 72 frames) and walk (one 24-frame cycle), a pop audit
// ---------------------------------------------------------------------------
const STRIP_COLS = 12;
const STRIP_CW = 190;
const STRIP_RH = 420;
export const STRIP_W = STRIP_COLS * STRIP_CW + 40;
export const STRIP_H = (6 + 2) * STRIP_RH + 40;
export const ProbeStrips: React.FC = () => {
  const s = humanScaleForPx(330);
  const rows = 8;
  const bases = Array.from({ length: rows }, (_, i) => 360 + i * STRIP_RH);
  const cells: React.ReactNode[] = [];
  for (let f = 0; f < 72; f++) {
    const r = Math.floor(f / STRIP_COLS);
    const c = f % STRIP_COLS;
    const at: P2 = [110 + c * STRIP_CW, bases[r]];
    const sip = HUMAN_POSES.seatedSip(1, f / 71, f);
    cells.push(
      <g key={`s${f}`}>
        <DeskStub at={at} s={s} dir={1} />
        <Human variant={0} pose={sip.pose} at={at} scale={s} uid={`ss${f}`} frame={f} />
        <DeskStub at={at} s={s} dir={1} front />
        <Lbl x={at[0]} y={at[1] + 34} t={`sip f${f}`} size={16} op={0.7} />
      </g>,
    );
  }
  for (let f = 0; f < HUMAN_WALK_CYCLE; f++) {
    const r = 6 + Math.floor(f / STRIP_COLS);
    const c = f % STRIP_COLS;
    const at: P2 = [110 + c * STRIP_CW, bases[r]];
    cells.push(
      <g key={`w${f}`}>
        <CovidContactShadow at={at} scale={s} uid={`wcs${f}`} />
        <line x1={at[0] - 60} x2={at[0] + 60} y1={at[1]} y2={at[1]} stroke="#2B6F8F" strokeWidth={1} opacity={0.6} />
        <Human variant={0} pose={HUMAN_POSES.walk(1, f)} at={at} scale={s} uid={`sw${f}`} frame={f} />
        <Lbl x={at[0]} y={at[1] + 34} t={`walk f${f}`} size={16} op={0.7} />
      </g>,
    );
  }
  return (
    <SheetAir w={STRIP_W} h={STRIP_H} base={bases} id="sp">
      {cells}
    </SheetAir>
  );
};
