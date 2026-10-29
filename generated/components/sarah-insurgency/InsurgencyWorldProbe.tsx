// ---------------------------------------------------------------------------
// InsurgencyWorldProbe: the world builder's probe of sarah-insurgency (NOT a cut). Five scenes, 48 frames each, one
// slow camera move per scene:
//   a (0-47)     China, oblique over the North China plain: 3 cream garrisons, a cream Japan block, an orange ROC
//                block, 6 orange pawns rising, the occupied hatch, two railways, "JAPAN" lying on Japan
//   b (48-95)    the thirteen states looking north-east: an orange Continental block, a cream British block with the
//                Union sticker, pawns in four states
//   c (96-143)   close and low on the farmhouse, an orange value column rising
//   d (144-191)  from the American coast looking east, a cream column at London far in the haze
//   e (192-239)  the umber page: an orange and a cream block, the cream one toppling
// props: grade "A" | "B" (the two style frames), debug (the lock check: a magenta disc painted by the ground shader
// and a green SVG ring at the same world point), bands (the caption bands outlined).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import {
  ATLANTIC,
  Block,
  CHINA,
  CityDot,
  Farmhouse,
  Garrison,
  GroundLabel,
  GroundLine,
  HorizonHaze,
  InsurgencyStage,
  MapGround3D,
  PageGround3D,
  Pawn,
  SoftPatch,
  ValueColumn,
  VIEWS,
  WorldLayer,
  blockSpec,
  camTrack,
  insWorld,
  sortFarToNear,
  toScreen,
  type CamKey,
  type Grade,
  type InsWorld,
  type P2,
} from "./insurgencyShared";

export type ProbeProps = { grade?: Grade; debug?: boolean; bands?: boolean };
export const PROBE_FRAMES = 240;
const SCENE = 48;

const key = (f: number, v: Omit<CamKey, "f">, d: Partial<CamKey> = {}): CamKey => ({ f, ...v, ...d });
// each scene's move (keys frame-local; the track's pre-roll makes f0 already moving)
const KEYS_A: CamKey[] = [key(0, VIEWS.chinaPlain, { yaw: 74, D: 1200 }), key(47, VIEWS.chinaPlain, { yaw: 81, D: 1040 })];
const KEYS_B: CamKey[] = [key(0, VIEWS.thirteenStates, { D: 1450 }), key(47, VIEWS.thirteenStates, { D: 1280, yaw: 40 })];
const KEYS_C: CamKey[] = [key(0, VIEWS.farm, { D: 165, yaw: 35 }), key(47, VIEWS.farm, { D: 140, yaw: 44 })];
const KEYS_D: CamKey[] = [key(0, VIEWS.atlanticEast, { x: 900, z: -200, D: 1300, pitch: 24 }), key(47, VIEWS.atlanticEast)];
const KEYS_E: CamKey[] = [key(0, VIEWS.page, { yaw: -6 }), key(47, VIEWS.page, { yaw: 4, D: 470 })];

type Item = { at: P2; el: (A: InsWorld) => React.ReactNode };
const Pieces: React.FC<{ A: InsWorld; items: Item[] }> = ({ A, items }) => <>{sortFarToNear(A, items, (it) => it.at).map((it, i) => <React.Fragment key={i}>{it.el(A)}</React.Fragment>)}</>;

/** the lock check: a green ring in SVG at the same world point as the ground's magenta disc */
const LockRing: React.FC<{ A: InsWorld; at: [number, number, number] }> = ({ A, at }) => {
  const pts: string[] = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const s = toScreen(A.cam, at[0] + Math.cos(a) * at[2] * 1.6, 0, at[1] + Math.sin(a) * at[2] * 1.6);
    pts.push(`${s.x.toFixed(2)},${s.y.toFixed(2)}`);
  }
  return <path d={`M${pts.join("L")}Z`} fill="none" stroke="#00FF00" strokeWidth={2} />;
};
const Bands: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    {[
      [1080, 1250],
      [1360, 1460],
    ].map(([a, b]) => (
      <rect key={a} x={2} y={a} width={1076} height={b - a} fill="#FFFFFF" fillOpacity={0.06} stroke="#FFFFFF" strokeOpacity={0.5} strokeDasharray="8 6" />
    ))}
  </svg>
);

// ---- scene a: China --------------------------------------------------------------------------------------------------
const trackA = camTrack(KEYS_A, 60);
const OSAKA = CHINA.project(135.6, 34.75);
// the ROC block south of the 1938 Yellow River flood, by Zhengzhou (held by China until 1941)
const ROC_AT: P2 = [CHINA.PLACES.zhengzhou[0] + 10, CHINA.PLACES.zhengzhou[1] + 45];
const PAWNS_A: { at: P2; start: number }[] = [
  { at: CHINA.BASE_AREAS.jizhong.c, start: -14 },
  { at: [CHINA.BASE_AREAS.jinchaji.c[0] + 70, CHINA.BASE_AREAS.jinchaji.c[1] + 40], start: -6 },
  { at: CHINA.BASE_AREAS.shandong.c, start: -18 },
  { at: [CHINA.BASE_AREAS.shandong.c[0] - 120, CHINA.BASE_AREAS.shandong.c[1] + 40], start: -2 },
  { at: CHINA.BASE_AREAS.jinjiluyu.c, start: -10 },
  { at: [CHINA.PLACES.jinan[0] - 70, CHINA.PLACES.jinan[1] + 110], start: 0 },
];
const SceneA: React.FC<ProbeProps> = ({ grade, debug }) => {
  const frame = useCurrentFrame();
  const cam = trackA(frame);
  const A = insWorld({ cam, rest: trackA(0), frame, grade });
  const dbg: [number, number, number] = [CHINA.PLACES.jinan[0] + 40, CHINA.PLACES.jinan[1] + 60, 9];
  const P = CHINA.PLACES;
  const items: Item[] = [
    { at: P.shijiazhuang, el: (A) => <Garrison A={A} x={P.shijiazhuang[0]} z={P.shijiazhuang[1]} size={34} face={258} uid="g1" /> },
    { at: P.jinan, el: (A) => <Garrison A={A} x={P.jinan[0]} z={P.jinan[1]} size={34} face={258} uid="g2" /> },
    { at: P.xuzhou, el: (A) => <Garrison A={A} x={P.xuzhou[0]} z={P.xuzhou[1]} size={34} face={258} uid="g3" /> },
    { at: OSAKA, el: (A) => <Block A={A} spec={blockSpec(OSAKA[0], OSAKA[1], 80, 258)} color="cream" sticker="japan" uid="jp" /> },
    { at: ROC_AT, el: (A) => <Block A={A} spec={blockSpec(ROC_AT[0], ROC_AT[1], 64, 258)} color="orange" sticker="roc" uid="roc" /> },
    ...PAWNS_A.map((p, i) => ({ at: p.at, el: (A: InsWorld) => <Pawn A={A} x={p.at[0]} z={p.at[1]} size={34} rise={Math.max(0, Math.min(1, (frame - p.start) / 44))} uid={`pa${i}`} seed={i + 1} /> })),
  ];
  return (
    <InsurgencyStage A={A}>
      <MapGround3D world="china" cam={cam} air={A.ground} fog={A.fog} territory={[{ d: CHINA.OCCUPIED_1939.d, color: "cream", amount: 1 }]} debug={debug ? dbg : undefined} />
      <HorizonHaze A={A} id="hzA" />
      <WorldLayer>
        {Object.values(CHINA.BASE_AREAS).map((b, i) => (
          <SoftPatch key={i} A={A} c={b.c} r={b.r} rot={b.rot} />
        ))}
        <GroundLine A={A} pts={CHINA.RAIL_PINGHAN.pts} kind="rail" w={6} dash={9} />
        <GroundLine A={A} pts={CHINA.RAIL_JINPU.pts} kind="rail" w={6} dash={9} />
        {(["beiping", "tianjin", "shijiazhuang", "jinan", "xuzhou", "zhengzhou", "nanjing", "wuhan", "taiyuan", "qingdao"] as const).map((k) => (
          <CityDot key={k} A={A} at={P[k]} r={5} />
        ))}
        <GroundLabel A={A} text="JAPAN" at={CHINA.LABEL_AT.japan} size={60} yaw={78} />
        <GroundLabel A={A} text="North China" at={[-20, 90]} size={24} yaw={78} />
        <Pieces A={A} items={items} />
        {debug ? <LockRing A={A} at={dbg} /> : null}
      </WorldLayer>
    </InsurgencyStage>
  );
};

// ---- scene b: the thirteen states ------------------------------------------------------------------------------------
const trackB = camTrack(KEYS_B, 60);
const SceneB: React.FC<ProbeProps> = ({ grade, debug }) => {
  const frame = useCurrentFrame();
  const cam = trackB(frame);
  const A = insWorld({ cam, rest: trackB(0), frame, grade });
  const S = ATLANTIC.STATES;
  const P = ATLANTIC.PLACES;
  const dbg: [number, number, number] = [P.philadelphia[0], P.philadelphia[1], 8];
  const pawnAt: P2[] = [S.NC.at, [S.PA.at[0] - 40, S.PA.at[1] + 10], S.VA.at, [S.NY.at[0] - 30, S.NY.at[1] + 20]];
  const items: Item[] = [
    { at: P.morristown, el: (A) => <Block A={A} spec={blockSpec(P.morristown[0] - 70, P.morristown[1] + 50, 110, 218)} color="orange" sticker="grandUnion" uid="cont" /> },
    { at: P.newYork, el: (A) => <Block A={A} spec={blockSpec(P.newYork[0] + 70, P.newYork[1] + 90, 110, 218)} color="cream" sticker="union1606" uid="brit" /> },
    ...pawnAt.map((p, i) => ({ at: p, el: (A: InsWorld) => <Pawn A={A} x={p[0]} z={p[1]} size={56} rise={Math.min(1, (frame + 30 - i * 8) / 50)} uid={`pb${i}`} seed={i + 7} /> })),
  ];
  return (
    <InsurgencyStage A={A}>
      <MapGround3D world="atlantic" cam={cam} air={A.ground} fog={A.fog} debug={debug ? dbg : undefined} />
      <HorizonHaze A={A} id="hzB" />
      <WorldLayer>
        {(["boston", "newYork", "philadelphia", "charleston", "saratoga", "yorktown"] as const).map((k) => (
          <CityDot key={k} A={A} at={P[k]} r={5} />
        ))}
        <GroundLabel A={A} text="Thirteen Colonies" at={[ATLANTIC.LABEL_AT.america[0] - 60, ATLANTIC.LABEL_AT.america[1] - 40]} size={34} yaw={38} />
        <Pieces A={A} items={items} />
        {debug ? <LockRing A={A} at={dbg} /> : null}
      </WorldLayer>
    </InsurgencyStage>
  );
};

// ---- scene c: the farmhouse --------------------------------------------------------------------------------------------
const trackC = camTrack(KEYS_C, 60);
const SceneC: React.FC<ProbeProps> = ({ grade, debug }) => {
  const frame = useCurrentFrame();
  const cam = trackC(frame);
  const A = insWorld({ cam, rest: trackC(0), frame, grade });
  const F = ATLANTIC.PLACES.farm;
  const dbg: [number, number, number] = [F[0] - 18, F[1] + 14, 1.2];
  const h = 6 + 46 * Math.min(1, Math.max(0, (frame + 10) / 50));
  const items: Item[] = [
    { at: F, el: (A) => <Farmhouse A={A} x={F[0]} z={F[1]} size={26} face={185} uid="farm" /> },
    { at: [F[0] + 17, F[1] + 14], el: (A) => <ValueColumn A={A} x={F[0] + 17} z={F[1] + 14} r={4.2} height={h} uid="vc" /> },
  ];
  return (
    <InsurgencyStage A={A}>
      <MapGround3D world="atlantic" cam={cam} air={A.ground} fog={A.fog} debug={debug ? dbg : undefined} />
      <HorizonHaze A={A} id="hzC" />
      <WorldLayer>
        <GroundLabel A={A} text="Massachusetts" at={[F[0] - 19, F[1] + 23]} size={5} yaw={40} />
        <Pieces A={A} items={items} />
        {debug ? <LockRing A={A} at={dbg} /> : null}
      </WorldLayer>
    </InsurgencyStage>
  );
};

// ---- scene d: east across the Atlantic --------------------------------------------------------------------------------
const trackD = camTrack(KEYS_D, 60);
const SceneD: React.FC<ProbeProps> = ({ grade, debug }) => {
  const frame = useCurrentFrame();
  const cam = trackD(frame);
  const A = insWorld({ cam, rest: trackD(0), frame, grade });
  const L = ATLANTIC.PLACES.london;
  const B = ATLANTIC.PLACES.boston;
  const dbg: [number, number, number] = [B[0] + 260, B[1] + 40, 14];
  return (
    <InsurgencyStage A={A}>
      <MapGround3D world="atlantic" cam={cam} air={A.ground} fog={A.fog} debug={debug ? dbg : undefined} />
      <HorizonHaze A={A} id="hzD" />
      <WorldLayer>
        <CityDot A={A} at={B} r={7} />
        <GroundLabel A={A} text="Atlantic" at={[1860, -396]} size={80} yaw={78} />
        <ValueColumn A={A} x={L[0]} z={L[1]} r={60} height={520} color="cream" uid="ldn" />
        <Block A={A} spec={blockSpec(B[0] + 40, B[1] + 50, 70, 258)} color="orange" sticker="grandUnion" uid="am" />
        {debug ? <LockRing A={A} at={dbg} /> : null}
      </WorldLayer>
    </InsurgencyStage>
  );
};

// ---- scene e: the page -----------------------------------------------------------------------------------------------
const trackE = camTrack(KEYS_E, 60);
const SceneE: React.FC<ProbeProps> = ({ grade, debug }) => {
  const frame = useCurrentFrame();
  const cam = trackE(frame);
  const A = insWorld({ cam, rest: trackE(0), frame, grade });
  const dbg: [number, number, number] = [0, 90, 6];
  const items: Item[] = [
    { at: [-80, 30], el: (A) => <Block A={A} spec={blockSpec(-80, 30, 90, 180)} color="orange" uid="po" /> },
    { at: [80, -10], el: (A) => <Block A={A} spec={blockSpec(80, -10, 90, 180)} color="cream" sticker="union1606" topple={Math.min(1, Math.max(0, (frame - 2) / 22))} toppleDir="back" uid="pc" /> },
  ];
  return (
    <InsurgencyStage A={A}>
      <PageGround3D cam={cam} air={A.ground} fog={A.fog} debug={debug ? dbg : undefined} />
      <HorizonHaze A={A} id="hzE" />
      <WorldLayer>
        <Pieces A={A} items={items} />
        {debug ? <LockRing A={A} at={dbg} /> : null}
      </WorldLayer>
    </InsurgencyStage>
  );
};

export const InsurgencyWorldProbe: React.FC<ProbeProps> = (p) => (
  <AbsoluteFill style={{ backgroundColor: "#2A2620" }}>
    {[SceneA, SceneB, SceneC, SceneD, SceneE].map((S, i) => (
      <Sequence key={i} from={i * SCENE} durationInFrames={SCENE} layout="none">
        <AbsoluteFill>
          <S {...p} />
        </AbsoluteFill>
      </Sequence>
    ))}
    {p.bands ? <Bands /> : null}
  </AbsoluteFill>
);
