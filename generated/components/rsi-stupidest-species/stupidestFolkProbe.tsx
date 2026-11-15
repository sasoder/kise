// ---------------------------------------------------------------------------
// stupidestFolkProbe — probe sheets of the clip's cast (stupidestFolk.tsx). Render entry src/entry.StupidestFolk.ts.
//   FolkStyle   THE STYLE SHEET on palette A's air: a covidFolk Commuter (the approved hand) beside Einstein, Me, the
//               chimp (sit + on all fours), the bonobo and the foragers v0..v7, all at the same scale (a man 600 px)
//   FolkPoses   every pose (people and chimp)
//   FolkHero    Einstein and Me side by side at hero size (~520 px) as cut E frames them, 1080 x 1920
//   FolkPhone   the phone check: every figure at 160 px and at 60 px in one 1080 x 1920 frame
//   FolkStrip   one cycle or gesture, EVERY frame (props.strip): knuckleWalk | walk | unify | shrug | teach | haul |
//               drawPlan | think | lookUp
// ---------------------------------------------------------------------------
import React from "react";
import {
  AirStage,
  H as AH,
  makeAirView,
  mixHex,
  type AirScene,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  Commuter,
  CovidContactShadow,
  POSES as COVID_POSES,
  scaleForPx as covidScale,
} from "../kyle-covid/covidFolk";
import {
  CHIMP_POSES,
  CHIMP_WALK_CYCLE,
  Chimp,
  Einstein,
  FOLK_WALK_CYCLE,
  FORAGER_LOOKS,
  Forager,
  GESTURE_FRAMES,
  HAUL,
  HAUL_CYCLE,
  KNAP_CYCLE,
  Me,
  PAIR_YAW,
  PERSON_POSES,
  chimpAnchors,
  chimpWalkAdvance,
  folkWalkAdvance,
  haulAdvance,
  knapContact,
  personAnchors,
  planDrawn,
  scaleForPx,
  type ChimpPose,
  type PersonId,
  type PersonPose,
} from "./stupidestFolk";

type P2 = [number, number];
export const FPS = 24000 / 1001;
const SCENE: AirScene = {
  look: "A",
  mood: "day",
  F: 1000,
  fogNear: 800,
  fogVis: 2200,
  fogMax: 0.97,
  hLow: 0,
  hHigh: 300,
  moteUnit: 100,
};
const FONT = "Helvetica, Arial, sans-serif";
const TXT = "#F3EBDD";
const airCss = (v: ReturnType<typeof makeAirView>, f: number) => {
  const c = v.airAtScreen(f * AH);
  return `rgb(${c.map((x) => Math.round(x)).join(",")})`;
};
/** a sheet's backdrop: AirStage + a sand-umber floor band under each row */
const SheetAir: React.FC<{
  w: number;
  h: number;
  base: number[];
  id: string;
  children?: React.ReactNode;
}> = ({ w, h, base, id, children }) => {
  const v = makeAirView({ scene: SCENE, frame: 0, horizon: 1250 });
  return (
    <div
      style={{ position: "relative", width: w, height: h, overflow: "hidden" }}
    >
      <AirStage v={v} shafts={0} motes={0} grain={0} bloom={0.22}>
        <svg
          width={w}
          height={h}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <defs>
            {base.map((b, i) => (
              <linearGradient
                key={i}
                id={`fl${id}${i}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0" stopColor={airCss(v, 0.55)} stopOpacity={0} />
                <stop
                  offset="0.35"
                  stopColor={mixHex("#857659", "#5F877D", 0.35)}
                  stopOpacity={0.55}
                />
                <stop
                  offset="1"
                  stopColor={mixHex("#6B5E49", "#3A3128", 0.3)}
                  stopOpacity={1}
                />
              </linearGradient>
            ))}
          </defs>
          {base.map((b, i) => (
            <rect
              key={i}
              x={0}
              y={b - 140}
              width={w}
              height={150 + (i < base.length - 1 ? 0 : h - b)}
              fill={`url(#fl${id}${i})`}
            />
          ))}
          {children}
        </svg>
      </AirStage>
    </div>
  );
};
const Lbl: React.FC<{
  x: number;
  y: number;
  t: string;
  size?: number;
  op?: number;
}> = ({ x, y, t, size = 22, op = 0.85 }) => (
  <text
    x={x}
    y={y}
    fill={TXT}
    fontFamily={FONT}
    fontSize={size}
    textAnchor="middle"
    opacity={op}
  >
    {t}
  </text>
);
const Shadow: React.FC<{ at: P2; s: number; uid: string; w?: number }> = ({
  at,
  s,
  uid,
  w,
}) => <CovidContactShadow at={at} scale={s} w={w} uid={uid} />;

// ---------------------------------------------------------------------------
// THE STYLE SHEET
// ---------------------------------------------------------------------------
const MANPX = 600;
const SCOL = 300;
export const STYLE_W = 9 * SCOL + 120;
export const STYLE_H = 1640;
export const FolkStyle: React.FC = () => {
  const s = scaleForPx(MANPX);
  const b0 = 760;
  const b1 = 1540;
  const X = (j: number) => 180 + j * SCOL;
  const cells: React.ReactNode[] = [];
  cells.push(
    <g key="c">
      <Shadow at={[X(0), b0]} s={s} uid="csc" />
      <Commuter
        variant={0}
        pose={COVID_POSES.stand(1)}
        at={[X(0), b0]}
        scale={covidScale(MANPX)}
        uid="cm"
        frame={0}
      />
      <Lbl x={X(0)} y={b0 + 60} t="covidFolk Commuter (ref)" />
    </g>,
  );
  cells.push(
    <g key="e">
      <Shadow at={[X(1), b0]} s={s} uid="cse" />
      <Einstein
        pose={PERSON_POSES.stand(-0.2, 0)}
        at={[X(1), b0]}
        scale={s}
        uid="e0"
      />
      <Lbl x={X(1)} y={b0 + 60} t="Einstein" />
    </g>,
  );
  cells.push(
    <g key="m">
      <Shadow at={[X(2), b0]} s={s} uid="csm" />
      <Me
        pose={PERSON_POSES.stand(0.2, 0)}
        at={[X(2), b0]}
        scale={s}
        uid="m0"
      />
      <Lbl x={X(2)} y={b0 + 60} t="Me (the speaker)" />
    </g>,
  );
  cells.push(
    <g key="ch">
      <Shadow at={[X(3), b0]} s={s} uid="csch" w={70} />
      <Chimp
        variant={0}
        pose={CHIMP_POSES.sit(1, 0)}
        at={[X(3), b0]}
        scale={s}
        uid="ch0"
      />
      <Lbl x={X(3)} y={b0 + 60} t="chimp: sit" />
    </g>,
  );
  cells.push(
    <g key="cq">
      <Shadow at={[X(4) + 10, b0]} s={s} uid="cscq" w={80} />
      <Chimp
        variant={0}
        pose={CHIMP_POSES.stand(1, 0)}
        at={[X(4) + 10, b0]}
        scale={s}
        uid="ch1"
      />
      <Lbl x={X(4)} y={b0 + 60} t="chimp: on all fours" />
    </g>,
  );
  cells.push(
    <g key="bo">
      <Shadow at={[X(5), b0]} s={s} uid="csbo" w={70} />
      <Chimp
        variant={1}
        pose={CHIMP_POSES.sit(-1, 0)}
        at={[X(5), b0]}
        scale={s}
        uid="bo0"
      />
      <Lbl x={X(5)} y={b0 + 60} t="bonobo: sit" />
    </g>,
  );
  cells.push(
    <g key="bq">
      <Shadow at={[X(6) + 10, b0]} s={s} uid="csbq" w={80} />
      <Chimp
        variant={1}
        pose={CHIMP_POSES.stand(-1, 0)}
        at={[X(6) + 10, b0]}
        scale={s}
        uid="bo1"
      />
      <Lbl x={X(6)} y={b0 + 60} t="bonobo: on all fours" />
    </g>,
  );
  for (let v = 0; v < 8; v++) {
    const x = X(v + (v >= 4 ? 1 : 0)) + (v >= 4 ? 0 : 0);
    const bb = v < 4 ? b1 : b1;
    const xx = v < 4 ? X(v) : X(v + 1);
    void x;
    const dir: 1 | -1 = v % 2 === 0 ? 1 : -1;
    cells.push(
      <g key={`f${v}`}>
        <Shadow at={[xx, bb]} s={s} uid={`csf${v}`} />
        <Forager
          variant={v}
          pose={
            v === 2 ? PERSON_POSES.stand(0, 0) : PERSON_POSES.stand3q(dir, 0)
          }
          at={[xx, bb]}
          scale={s}
          uid={`f${v}`}
        />
        <Lbl x={xx} y={bb + 60} t={FORAGER_LOOKS[v].name.split(":")[0]} />
        <Lbl
          x={xx}
          y={bb + 88}
          t={FORAGER_LOOKS[v].name.split(":")[1] ?? ""}
          size={16}
          op={0.7}
        />
      </g>,
    );
  }
  cells.push(
    <g key="c2">
      <Shadow at={[X(4), b1]} s={s} uid="csc2" />
      <Commuter
        variant={2}
        pose={COVID_POSES.stand(-1)}
        at={[X(4), b1]}
        scale={covidScale(MANPX)}
        uid="cm2"
        frame={0}
      />
      <Lbl x={X(4)} y={b1 + 60} t="covidFolk Commuter v2 (ref)" />
    </g>,
  );
  return (
    <SheetAir w={STYLE_W} h={STYLE_H} base={[b0, b1]} id="st">
      {cells}
    </SheetAir>
  );
};

// ---------------------------------------------------------------------------
// EVERY POSE
// ---------------------------------------------------------------------------
type Cell = {
  label: string;
  who?: PersonId;
  v?: number;
  pose?: PersonPose;
  chimp?: ChimpPose;
  cv?: number;
  dx?: number;
  plan?: number;
  extra?: "unify" | "rope";
};
const POSE_ROWS: Cell[][] = [
  [
    {
      label: "Einstein stand",
      who: "einstein",
      pose: PERSON_POSES.stand(PAIR_YAW.einstein, 0),
    },
    {
      label: "Einstein think",
      who: "einstein",
      pose: PERSON_POSES.think("einstein", PAIR_YAW.einstein, 1, 0),
    },
    {
      label: "Einstein unify 0.38 (apart)",
      who: "einstein",
      pose: PERSON_POSES.unify(PAIR_YAW.einstein, 0.38, 0),
      extra: "unify",
    },
    {
      label: "Einstein unify 1 (together)",
      who: "einstein",
      pose: PERSON_POSES.unify(PAIR_YAW.einstein, 1, 0),
      extra: "unify",
    },
    {
      label: "Einstein glance (to Me)",
      who: "einstein",
      pose: PERSON_POSES.glance(
        PERSON_POSES.stand(PAIR_YAW.einstein, 0),
        -1,
        1,
      ),
    },
    {
      label: "Einstein 3/4",
      who: "einstein",
      pose: PERSON_POSES.stand3q(-1, 0),
    },
  ],
  [
    { label: "Me stand", who: "me", pose: PERSON_POSES.stand(PAIR_YAW.me, 0) },
    {
      label: "Me lookUp",
      who: "me",
      pose: PERSON_POSES.lookUp(PERSON_POSES.stand(PAIR_YAW.me, 0), 1, 1),
    },
    {
      label: "Me shrug",
      who: "me",
      pose: PERSON_POSES.shrug("me", PAIR_YAW.me, 0.5, 0),
    },
    {
      label: "Me glance (to Einstein)",
      who: "me",
      pose: PERSON_POSES.glance(PERSON_POSES.stand(PAIR_YAW.me, 0), 1, 1),
    },
    { label: "Me 3/4", who: "me", pose: PERSON_POSES.stand3q(1, 0) },
    {
      label: "Me think",
      who: "me",
      pose: PERSON_POSES.think("me", PAIR_YAW.me, 1, 0),
    },
  ],
  [
    {
      label: "forager walk",
      who: "forager",
      v: 0,
      pose: PERSON_POSES.walk(1, 6),
    },
    {
      label: "teach (strike)",
      who: "forager",
      v: 0,
      pose: PERSON_POSES.teach(1, Math.round(KNAP_CYCLE * 0.62), 1, 0),
      dx: -50,
    },
    {
      label: "watch (child)",
      who: "forager",
      v: 2,
      pose: PERSON_POSES.watch(-1, 10, 2),
      dx: 30,
    },
    {
      label: "haul",
      who: "forager",
      v: 4,
      pose: PERSON_POSES.haul(1, 9, 0, 4),
      extra: "rope",
    },
    {
      label: "drawPlan t 0.6",
      who: "forager",
      v: 1,
      pose: PERSON_POSES.drawPlan(1, 0.6, 0, 1),
      plan: 0.6,
      dx: -60,
    },
    {
      label: "squat",
      who: "forager",
      v: 3,
      pose: PERSON_POSES.squat(1, 0),
      dx: -40,
    },
  ],
  [
    {
      label: "chimp sit, look left",
      chimp: CHIMP_POSES.sit(1, 0, { headYaw: -0.6, look: [-0.5, 0] }),
    },
    {
      label: "chimp sit, look up",
      chimp: CHIMP_POSES.sit(1, 0, {
        headYaw: 0.2,
        look: [0.2, -0.8],
        pitch: -10,
      }),
    },
    {
      label: "chimp stand, face us",
      chimp: CHIMP_POSES.stand(1, 0, { headYaw: 0.55 }),
      dx: -10,
    },
    {
      label: "chimp knuckleWalk f8",
      chimp: CHIMP_POSES.knuckleWalk(1, 8),
      dx: -30,
    },
    {
      label: "bonobo walk f20",
      chimp: CHIMP_POSES.knuckleWalk(1, 20),
      cv: 1,
      dx: -30,
    },
    {
      label: "teach (show, amount 0)",
      who: "forager",
      v: 4,
      pose: PERSON_POSES.teach(-1, 0, 0, 4),
      dx: 50,
    },
  ],
];
const PCOLW = 340;
const PROWH = 720;
export const POSES_W = 6 * PCOLW + 60;
export const POSES_H = POSE_ROWS.length * PROWH + 60;
export const FolkPoses: React.FC = () => {
  const s = scaleForPx(560);
  const bases = POSE_ROWS.map((_, i) => 40 + (i + 1) * PROWH - 110);
  return (
    <SheetAir w={POSES_W} h={POSES_H} base={bases} id="po">
      {POSE_ROWS.flatMap((row, i) =>
        row.map((c, j) => {
          const at: P2 = [190 + j * PCOLW + (c.dx ?? 0), bases[i]];
          const key = `${i}-${j}`;
          let mark: React.ReactNode = null;
          if (c.who && c.pose) {
            const an = personAnchors(c.who, c.pose, at, s, { variant: c.v });
            const dots: P2[] = [];
            if (c.extra === "unify") dots.push(an.mittenL, an.mittenR);
            if (an.stickTip) dots.push(an.stickTip);
            if (an.propL) dots.push(an.propL);
            if (an.propR) dots.push(an.propR);
            mark = (
              <g>
                {c.extra === "rope" ? (
                  <line
                    x1={at[0] - 40}
                    y1={at[1] + HAUL.y * s}
                    x2={at[0] + 250}
                    y2={at[1] + HAUL.y * s}
                    stroke="#BCA97E"
                    strokeWidth={5}
                  />
                ) : null}
                {c.plan !== undefined ? (
                  <polyline
                    points={planDrawn(1, c.plan)
                      .map((p) => `${at[0] + p[0] * s},${at[1] + p[1] * s}`)
                      .join(" ")}
                    fill="none"
                    stroke="#4A3C2E"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                ) : null}
                {dots.map((d, k) => (
                  <circle
                    key={k}
                    cx={d[0]}
                    cy={d[1]}
                    r={4}
                    fill="none"
                    stroke="#2B6F8F"
                    strokeWidth={1.5}
                  />
                ))}
              </g>
            );
          }
          return (
            <g key={key}>
              <Shadow at={at} s={s} uid={`ps${key}`} w={c.chimp ? 75 : 62} />
              {c.who === "einstein" && c.pose ? (
                <Einstein pose={c.pose} at={at} scale={s} uid={`p${key}`} />
              ) : null}
              {c.who === "me" && c.pose ? (
                <Me pose={c.pose} at={at} scale={s} uid={`p${key}`} />
              ) : null}
              {c.who === "forager" && c.pose ? (
                <Forager
                  variant={c.v}
                  pose={c.pose}
                  at={at}
                  scale={s}
                  uid={`p${key}`}
                />
              ) : null}
              {c.chimp ? (
                <Chimp
                  variant={c.cv ?? 0}
                  pose={c.chimp}
                  at={at}
                  scale={s}
                  uid={`p${key}`}
                />
              ) : null}
              {mark}
              <Lbl x={190 + j * PCOLW} y={bases[i] + 50} t={c.label} />
            </g>
          );
        }),
      )}
    </SheetAir>
  );
};

// ---------------------------------------------------------------------------
// HERO: cut E's pair, 1080 x 1920 (faces above the caption band y 1080, the focus round y ~800)
// ---------------------------------------------------------------------------
export const FolkHero: React.FC<{ t?: number }> = ({ t = 0 }) => {
  const v = makeAirView({ scene: SCENE, frame: 0, horizon: 1250 });
  const s = scaleForPx(530);
  const base = 1190;
  const eAt: P2 = [720, base];
  const mAt: P2 = [360, base];
  return (
    <div style={{ position: "relative", width: 1080, height: 1920 }}>
      <AirStage v={v} shafts={1} motes={0} grain={1} bloom={0.22}>
        <svg
          width={1080}
          height={1920}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <rect
            x={0}
            y={base - 160}
            width={1080}
            height={1920 - base + 160}
            fill={mixHex("#6B5E49", "#3A3128", 0.3)}
            opacity={0.8}
          />
          <Shadow at={mAt} s={s} uid="hs1" />
          <Shadow at={eAt} s={s} uid="hs2" />
          <Me
            pose={
              t > 0
                ? PERSON_POSES.glance(PERSON_POSES.stand(PAIR_YAW.me, 0), 1, t)
                : PERSON_POSES.stand(PAIR_YAW.me, 0)
            }
            at={mAt}
            scale={s}
            uid="hm"
          />
          <Einstein
            pose={
              t > 0
                ? PERSON_POSES.glance(
                    PERSON_POSES.stand(PAIR_YAW.einstein, 0),
                    -1,
                    t,
                  )
                : PERSON_POSES.stand(PAIR_YAW.einstein, 0)
            }
            at={eAt}
            scale={s}
            uid="he"
          />
          <rect
            x={0}
            y={1080}
            width={1080}
            height={170}
            fill="#FF00FF"
            opacity={0.08}
          />
          <rect
            x={0}
            y={1360}
            width={1080}
            height={100}
            fill="#FF00FF"
            opacity={0.08}
          />
        </svg>
      </AirStage>
    </div>
  );
};

// ---------------------------------------------------------------------------
// THE PHONE CHECK: every figure at 160 px and at 60 px
// ---------------------------------------------------------------------------
export const FolkPhone: React.FC = () => {
  const v = makeAirView({ scene: SCENE, frame: 0, horizon: 1250 });
  const row = (px: number, y: number, x0: number, dx: number, id: string) => {
    const s = scaleForPx(px);
    const items: React.ReactNode[] = [];
    let x = x0;
    const put = (el: (at: P2) => React.ReactNode, key: string, w = 1) => {
      items.push(
        <g key={key}>
          <Shadow at={[x, y]} s={s} uid={`${id}s${key}`} />
          {el([x, y])}
        </g>,
      );
      x += dx * w;
    };
    put(
      (at) => (
        <Me
          pose={PERSON_POSES.stand(PAIR_YAW.me, 0)}
          at={at}
          scale={s}
          uid={`${id}m`}
        />
      ),
      "m",
    );
    put(
      (at) => (
        <Einstein
          pose={PERSON_POSES.stand(PAIR_YAW.einstein, 0)}
          at={at}
          scale={s}
          uid={`${id}e`}
        />
      ),
      "e",
    );
    put(
      (at) => (
        <Chimp pose={CHIMP_POSES.sit(1, 0)} at={at} scale={s} uid={`${id}c`} />
      ),
      "c",
    );
    put(
      (at) => (
        <Chimp
          pose={CHIMP_POSES.knuckleWalk(1, 6)}
          at={[at[0] + 8, at[1]]}
          scale={s}
          uid={`${id}q`}
        />
      ),
      "q",
      1.3,
    );
    for (let f = 0; f < 4; f++)
      put(
        (at) => (
          <Forager
            variant={f}
            pose={
              f === 2
                ? PERSON_POSES.stand(0, 0)
                : PERSON_POSES.stand3q(f % 2 ? -1 : 1, 0)
            }
            at={at}
            scale={s}
            uid={`${id}f${f}`}
          />
        ),
        `f${f}`,
        0.8,
      );
    return items;
  };
  return (
    <div style={{ position: "relative", width: 1080, height: 1920 }}>
      <AirStage v={v} shafts={1} motes={0} grain={1} bloom={0.22}>
        <svg
          width={1080}
          height={1920}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <rect
            x={0}
            y={620}
            width={1080}
            height={1300}
            fill={mixHex("#6B5E49", "#3A3128", 0.3)}
            opacity={0.8}
          />
          {row(160, 760, 90, 128, "a")}
          {row(60, 1000, 120, 70, "b")}
          <Lbl x={540} y={820} t="160 px (a man's height)" />
          <Lbl x={540} y={1050} t="60 px" />
        </svg>
      </AirStage>
    </div>
  );
};

// ---------------------------------------------------------------------------
// EVERY-FRAME STRIPS
// ---------------------------------------------------------------------------
export const STRIPS = [
  "knuckleWalk",
  "walk",
  "unify",
  "shrug",
  "teach",
  "haul",
  "drawPlan",
  "think",
  "lookUp",
  "haulStep",
  "watch",
] as const;
export type StripName = (typeof STRIPS)[number];
const stripFrames = (s: StripName) =>
  s === "knuckleWalk"
    ? CHIMP_WALK_CYCLE
    : s === "walk"
      ? FOLK_WALK_CYCLE
      : s === "unify"
        ? GESTURE_FRAMES.unify + 1
        : s === "shrug"
          ? GESTURE_FRAMES.shrug + 1
          : s === "teach" || s === "watch"
            ? KNAP_CYCLE
            : s === "haul" || s === "haulStep"
              ? HAUL_CYCLE
              : s === "drawPlan"
                ? 61
                : s === "think"
                  ? GESTURE_FRAMES.think + 1
                  : GESTURE_FRAMES.lookUp + 1;
const SCOLS = 8;
const SCW = 240;
const SRH = 400;
export const stripSize = (s: StripName) => ({
  w: SCOLS * SCW + 40,
  h: Math.ceil(stripFrames(s) / SCOLS) * SRH + 40,
});
export const FolkStrip: React.FC<{ strip: StripName }> = ({ strip }) => {
  const n = stripFrames(strip);
  const { w, h } = stripSize(strip);
  const s = scaleForPx(310);
  const bases = Array.from(
    { length: Math.ceil(n / SCOLS) },
    (_, i) => 20 + (i + 1) * SRH - 50,
  );
  return (
    <SheetAir w={w} h={h} base={bases} id="sp">
      {Array.from({ length: n }, (_, f) => {
        const r = Math.floor(f / SCOLS);
        const c = f % SCOLS;
        const cx = 20 + c * SCW + SCW / 2;
        const t = f / (n - 1);
        let fig: React.ReactNode = null;
        let mark: React.ReactNode = null;
        let at: P2 = [cx, bases[r]];
        const ref: P2 = [cx, bases[r]];
        if (strip === "knuckleWalk") {
          // the chimp walks: at moves; a fixed tick on the ground at the cell's centre shows the planted contacts
          at = [
            cx -
              40 +
              chimpWalkAdvance(s) * f -
              chimpWalkAdvance(s) * n * 0.5 +
              40,
            bases[r],
          ];
          const pose = CHIMP_POSES.knuckleWalk(1, f);
          const an = chimpAnchors(0, pose, at, s);
          fig = <Chimp pose={pose} at={at} scale={s} uid={`s${f}`} />;
          mark = (
            <g>
              {[an.handL, an.handR, an.footL, an.footR].map((p, k) => (
                <circle
                  key={k}
                  cx={p[0]}
                  cy={p[1]}
                  r={2.5}
                  fill={["#2B6F8F", "#8F2B6F", "#2B8F4F", "#8F6F2B"][k]}
                />
              ))}
            </g>
          );
        } else if (strip === "walk") {
          at = [cx + folkWalkAdvance(s) * (f - n / 2), bases[r]];
          const pose = PERSON_POSES.walk(1, f);
          const an = personAnchors("forager", pose, at, s, { variant: 0 });
          fig = (
            <Forager variant={0} pose={pose} at={at} scale={s} uid={`s${f}`} />
          );
          mark = (
            <g>
              <circle cx={an.toeL[0]} cy={an.toeL[1]} r={2.5} fill="#2B6F8F" />
              <circle cx={an.toeR[0]} cy={an.toeR[1]} r={2.5} fill="#8F2B6F" />
            </g>
          );
        } else if (strip === "unify" || strip === "think") {
          const pose =
            strip === "unify"
              ? PERSON_POSES.unify(PAIR_YAW.einstein, t, f)
              : PERSON_POSES.think("einstein", PAIR_YAW.einstein, t, f);
          const an = personAnchors("einstein", pose, at, s);
          fig = (
            <Einstein pose={pose} at={at} scale={s} uid={`s${f}`} frame={f} />
          );
          mark =
            strip === "unify" ? (
              <g>
                <circle
                  cx={an.mittenL[0]}
                  cy={an.mittenL[1]}
                  r={3}
                  fill="none"
                  stroke="#2B6F8F"
                  strokeWidth={1.2}
                />
                <circle
                  cx={an.mittenR[0]}
                  cy={an.mittenR[1]}
                  r={3}
                  fill="none"
                  stroke="#2B6F8F"
                  strokeWidth={1.2}
                />
              </g>
            ) : null;
        } else if (strip === "shrug" || strip === "lookUp") {
          const pose =
            strip === "shrug"
              ? PERSON_POSES.shrug("me", PAIR_YAW.me, t, f)
              : PERSON_POSES.lookUp(PERSON_POSES.stand(PAIR_YAW.me, f), 1, t);
          fig = <Me pose={pose} at={at} scale={s} uid={`s${f}`} frame={f} />;
        } else if (strip === "teach" || strip === "watch") {
          at = strip === "teach" ? [cx - 50, bases[r]] : [cx, bases[r]];
          const pose =
            strip === "teach"
              ? PERSON_POSES.teach(1, f, 1, 0)
              : PERSON_POSES.watch(-1, f, 2);
          fig =
            strip === "teach" ? (
              <Forager
                variant={0}
                pose={pose}
                at={at}
                scale={s}
                uid={`s${f}`}
              />
            ) : (
              <Forager
                variant={2}
                pose={pose}
                at={at}
                scale={s}
                uid={`s${f}`}
              />
            );
          mark =
            strip === "teach" && knapContact(f) ? (
              <Lbl x={cx + 80} y={20 + r * SRH + 26} t="contact" size={16} />
            ) : null;
        } else if (strip === "haul" || strip === "haulStep") {
          const step = strip === "haulStep" ? 1 : 0;
          at = [cx - 30 - haulAdvance(s) * step * (f - n / 2), bases[r]];
          const pose = PERSON_POSES.haul(1, f, step, 4);
          const an = personAnchors("forager", pose, at, s, { variant: 4 });
          fig = (
            <Forager variant={4} pose={pose} at={at} scale={s} uid={`s${f}`} />
          );
          mark = (
            <g>
              <line
                x1={at[0] - 20}
                y1={at[1] + HAUL.y * s}
                x2={at[0] + 140}
                y2={at[1] + HAUL.y * s}
                stroke="#BCA97E"
                strokeWidth={3}
              />
              <circle cx={an.toeL[0]} cy={an.toeL[1]} r={2.5} fill="#2B6F8F" />
              <circle cx={an.toeR[0]} cy={an.toeR[1]} r={2.5} fill="#8F2B6F" />
            </g>
          );
        } else if (strip === "drawPlan") {
          at = [cx - 55, bases[r]];
          const pose = PERSON_POSES.drawPlan(1, t, f, 1);
          fig = (
            <Forager variant={1} pose={pose} at={at} scale={s} uid={`s${f}`} />
          );
          const pd = planDrawn(1, t);
          mark =
            pd.length > 1 ? (
              <polyline
                points={pd
                  .map((p) => `${at[0] + p[0] * s},${at[1] + p[1] * s}`)
                  .join(" ")}
                fill="none"
                stroke="#4A3C2E"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            ) : null;
        }
        return (
          <g key={f}>
            <rect
              x={20 + c * SCW + 2}
              y={20 + r * SRH + 2}
              width={SCW - 4}
              height={SRH - 4}
              fill="none"
              stroke="#F3EBDD"
              strokeOpacity={0.15}
            />
            <line
              x1={ref[0]}
              y1={ref[1] + 6}
              x2={ref[0]}
              y2={ref[1] + 14}
              stroke="#F3EBDD"
              strokeOpacity={0.4}
            />
            <Shadow
              at={at}
              s={s}
              uid={`sc${f}`}
              w={strip === "knuckleWalk" ? 75 : 62}
            />
            {fig}
            {mark}
            <Lbl
              x={20 + c * SCW + 22}
              y={20 + r * SRH + 26}
              t={`${f}`}
              size={20}
            />
          </g>
        );
      })}
    </SheetAir>
  );
};
