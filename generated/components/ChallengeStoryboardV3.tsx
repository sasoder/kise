import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ChessBoard,
  DashedPath,
  DeepMindMark,
  FONT_LABEL,
  GoBoard,
  INK_LO,
  Label,
  ModelMark,
  Person,
  PERSON_H,
  PERSON_TOP,
  QRing,
  Stage,
  contactDist,
  hash,
  markR,
} from "./outgrowShared";

// Storyboard stills for the V3 set: each frame of this composition is one posed
// key frame, with a note band in the caption zone. Not a deliverable.

export const schema = z.object({});
export const defaultProps = schema.parse({});

type Panel = { cut: string; at: string; note: string; cam: { x: number; y: number; k: number }; draw: (k: number) => React.ReactNode };

const cam = (x: number, look: number, k: number) => ({ x, y: look + 125 / k, k });
const polar = (cx: number, cy: number, d: number, deg: number) => ({
  x: cx + d * Math.cos((deg * Math.PI) / 180),
  y: cy + d * Math.sin((deg * Math.PI) / 180),
});

// --- cut 1 world ---
const M1 = { x: 540, y: 760 };
const PEOPLE1 = [170, 265, 360, 450, 540, 630, 720, 815, 910].map((x, i) => ({
  x: x + (hash(i, 3) - 0.5) * 30,
  y: 1560 + (i % 2) * 40 + (hash(i, 5) - 0.5) * 20,
}));

// --- cut 2 world ---
const M2 = { x: 540, y: 0 };
const GO1 = { x: 540, y: 2000, cell: 46 };
const CH1 = { x: 540, y: 3150, cell: 100 };
const HALL: { kind: "go" | "chess"; x: number; y: number; cell: number; rec: number; t: number }[] = [
  { kind: "go", x: -600, y: 1700, cell: 34, rec: 1, t: 70 },
  { kind: "chess", x: 1680, y: 1640, cell: 78, rec: 0, t: 30 },
  { kind: "chess", x: -620, y: 2800, cell: 74, rec: 0, t: 52 },
  { kind: "go", x: 1700, y: 2830, cell: 36, rec: 0, t: 95 },
  { kind: "go", x: -1350, y: 2240, cell: 27, rec: 0, t: 60 },
  { kind: "go", x: 2420, y: 2230, cell: 28, rec: 1, t: 40 },
  { kind: "chess", x: -1330, y: 1300, cell: 56, rec: 0, t: 70 },
  { kind: "go", x: 2420, y: 1250, cell: 26, rec: 1, t: 100 },
  { kind: "go", x: -1320, y: 3380, cell: 29, rec: 1, t: 85 },
  { kind: "chess", x: 2400, y: 3380, cell: 62, rec: 0, t: 44 },
  { kind: "go", x: -580, y: 3880, cell: 30, rec: 0, t: 110 },
  { kind: "go", x: 1680, y: 3920, cell: 29, rec: 1, t: 25 },
];
const Lockup: React.FC<{ k: number; x: number; y: number; text: string; em?: number; size?: number }> = ({
  k,
  x,
  y,
  text,
  em = 96,
  size = 70,
}) => {
  const tw = text.length * size * 0.47;
  const w = em + 26 + tw;
  const x0 = x - w / 2;
  return (
    <>
      <DeepMindMark k={k} x={x0 + em / 2} y={y} em={em} />
      <Label x={x0 + em + 26} y={y + size * 0.04} size={size} k={k} text={text} anchor="start" />
    </>
  );
};

// --- cut 3 world ---
const B3 = { x: 540, y: 960, cell: 42 };

// --- cut 4 world ---
const M4 = { x: 540, y: 600, em: 900 };
const P4 = { x: 540, y: 1900 };

// --- cut 5 world ---
const M5 = { x: 540, y: 250, em: 900 };
const CROWD5 = (() => {
  const out: { x: number; y: number }[] = [];
  const rows = [
    { y: 1640, n: 7, w: 640 },
    { y: 1730, n: 8, w: 760 },
    { y: 1820, n: 9, w: 860 },
  ];
  rows.forEach((r, ri) => {
    for (let i = 0; i < r.n; i++) {
      const u = r.n === 1 ? 0.5 : i / (r.n - 1);
      out.push({
        x: 540 - r.w / 2 + u * r.w + (hash(i + ri * 20, 9) - 0.5) * 40,
        y: r.y + (hash(i + ri * 20, 11) - 0.5) * 30,
      });
    }
  });
  return out;
})();

const PANELS: Panel[] = [
  // ---------------- CUT 1 ----------------
  {
    cut: "1  TOO EASY",
    at: "f0  “that…”",
    note: "Tight on a SMALL model among questions bigger than it. Already chewing one: orange arc = working on it.",
    cam: cam(540, 800, 2.3),
    draw: (k) => {
      const R = markR(90);
      const c1 = polar(M1.x, M1.y, contactDist(R, 54), 52);
      const c2 = polar(M1.x, M1.y, contactDist(R, 44) * 0.55, 200);
      return (
        <>
          <QRing x={420} y={960} r={58} k={k} />
          <QRing x={690} y={1030} r={46} k={k} />
          <QRing x={560} y={1170} r={62} k={k} />
          <QRing x={380} y={700} r={50} k={k} />
          <QRing x={c2.x} y={c2.y} r={30} k={k} done={1} tone={1} opacity={0.7} />
          <ModelMark k={k} x={M1.x} y={M1.y} em={90} />
          <QRing x={c1.x} y={c1.y} r={54} k={k} work={0.55} />
        </>
      );
    },
  },
  {
    cut: "1  TOO EASY",
    at: "f53  “…smarter and smarter”",
    note: "Each hard question it finishes pours in and it GROWS (area adds). Camera pulls back to keep up.",
    cam: cam(540, 840, 1.15),
    draw: (k) => {
      const em = 330;
      const R = markR(em);
      const a = polar(M1.x, M1.y, contactDist(R, 56), 72);
      const b = polar(M1.x, M1.y, contactDist(R, 60), 122);
      const c = polar(M1.x, M1.y, contactDist(R, 50), 28);
      const d = polar(M1.x, M1.y, R * 0.6, 150);
      return (
        <>
          {[
            [300, 1230, 52],
            [770, 1270, 58],
            [520, 1400, 46],
            [660, 1540, 54],
            [380, 1560, 60],
            [180, 1000, 48],
            [900, 1050, 44],
          ].map(([x, y, r], i) => (
            <QRing key={i} x={x} y={y} r={r} k={k} />
          ))}
          <QRing x={d.x} y={d.y} r={34} k={k} done={1} tone={1} opacity={0.6} />
          <ModelMark k={k} x={M1.x} y={M1.y} em={em} />
          <QRing x={a.x} y={a.y} r={56} k={k} work={0.8} />
          <QRing x={b.x} y={b.y} r={60} k={k} work={0.3} />
          <QRing x={c.x} y={c.y} r={50} k={k} work={1} done={0.7} tone={1} />
        </>
      );
    },
  },
  {
    cut: "1  TOO EASY",
    at: "f92  “…questions we can ask them”",
    note: "Pull-back finds where the questions come from: people. Their questions are the size of a person.",
    cam: cam(540, 1010, 0.74),
    draw: (k) => {
      const em = 860;
      const R = markR(em);
      const rim = polar(M1.x, M1.y, contactDist(R, 48), 96);
      return (
        <>
          {PEOPLE1.map((p, i) => (
            <Person key={i} k={k} x={p.x} y={p.y} />
          ))}
          {PEOPLE1.map((p, i) => {
            const t = hash(i, 17);
            const y = lerpN(p.y + PERSON_TOP() - 60, 1250, t);
            const x = lerpN(p.x, 540 + (p.x - 540) * 0.5, t);
            return <QRing key={`q${i}`} x={x} y={y} r={40 + hash(i, 4) * 20} k={k} />;
          })}
          <ModelMark k={k} x={M1.x} y={M1.y} em={em} />
          <QRing x={rim.x} y={rim.y} r={48} k={k} work={0.9} />
        </>
      );
    },
  },
  {
    cut: "1  TOO EASY",
    at: "f131  “…too easy”",
    note: "Now every question snaps solved on contact (✓ in 4 frames) and is LET GO: white, dim, drifting away. It stopped growing.",
    cam: cam(540, 1000, 0.72),
    draw: (k) => {
      const em = 900;
      const R = markR(em);
      const r1 = polar(M1.x, M1.y, contactDist(R, 46), 80);
      const r2 = polar(M1.x, M1.y, contactDist(R, 52), 108);
      return (
        <>
          {PEOPLE1.map((p, i) => (
            <Person key={i} k={k} x={p.x} y={p.y} />
          ))}
          {[
            [200, 1290, 44, 0.8],
            [860, 1240, 50, 0.6],
            [110, 1000, 42, 0.4],
            [960, 950, 46, 0.3],
            [300, 1420, 40, 0.5],
          ].map(([x, y, r, o], i) => (
            <QRing key={`f${i}`} x={x} y={y} r={r} k={k} done={1} opacity={INK_LO * o * 1.6} />
          ))}
          {[
            [380, 1400, 48],
            [700, 1430, 44],
            [560, 1500, 58],
          ].map(([x, y, r], i) => (
            <QRing key={`u${i}`} x={x} y={y} r={r} k={k} />
          ))}
          <ModelMark k={k} x={M1.x} y={M1.y} em={em} />
          <QRing x={r1.x} y={r1.y} r={46} k={k} work={1} done={0.8} tone={0.8} />
          <QRing x={r2.x} y={r2.y} r={52} k={k} work={0.6} />
        </>
      );
    },
  },
  // ---------------- CUT 2 ----------------
  {
    cut: "2  SAME PATH",
    at: "f20  “…might not see LLMs”",
    note: "The giant model (LLMs), its last too-easy questions still drifting off. A dashed would-be path starts down.",
    cam: cam(540, 120, 0.82),
    draw: (k) => (
      <>
        <QRing x={180} y={420} r={44} k={k} done={1} opacity={INK_LO} />
        <QRing x={930} y={330} r={50} k={k} done={1} opacity={INK_LO * 0.7} />
        <ModelMark k={k} x={M2.x} y={M2.y} em={900} />
        <DashedPath x0={540} y0={470} x1={540} y1={1460} draw={0.25} frame={20} k={k} />
      </>
    ),
  },
  {
    cut: "2  SAME PATH",
    at: "f78  “…AlphaGo”",
    note: "Camera rides the path down onto a REAL game: AlphaGo v Lee Sedol, game 2, stone per 3 f, move 37 lands here.",
    cam: cam(540, 1930, 1.02),
    draw: (k) => (
      <>
        <DashedPath x0={540} y0={470} x1={540} y1={1460} draw={1} frame={78} k={k} />
        <Lockup k={k} x={540} y={1505} text="ALPHAGO" />
        <GoBoard x={GO1.x} y={GO1.y} cell={GO1.cell} k={k} record={0} movesF={37} />
      </>
    ),
  },
  {
    cut: "2  SAME PATH",
    at: "f100  “…AlphaZero”",
    note: "Pull-back continues and finds AlphaZero below, playing its real chess game v Stockfish (2017, game 10).",
    cam: cam(540, 2560, 0.52),
    draw: (k) => (
      <>
        <Lockup k={k} x={540} y={1505} text="ALPHAGO" />
        <GoBoard x={GO1.x} y={GO1.y} cell={GO1.cell} k={k} record={0} movesF={45} />
        <Lockup k={k} x={540} y={2655} text="ALPHAZERO" />
        <ChessBoard x={CH1.x} y={CH1.y} cell={CH1.cell} k={k} plyF={14} />
      </>
    ),
  },
  {
    cut: "2  SAME PATH",
    at: "f139  “…game-playing AIs”",
    note: "OH: it keeps pulling back — a whole hall of games playing themselves. The LLM hangs above, alone.",
    cam: cam(540, 1900, 0.26),
    draw: (k) => (
      <>
        <ModelMark k={k} x={M2.x} y={M2.y} em={900} />
        <DashedPath x0={540} y0={470} x1={540} y1={1460} draw={1} frame={139} k={k} />
        <Lockup k={k} x={540} y={1505} text="ALPHAGO" />
        <GoBoard x={GO1.x} y={GO1.y} cell={GO1.cell} k={k} record={0} movesF={60} />
        <Lockup k={k} x={540} y={2655} text="ALPHAZERO" />
        <ChessBoard x={CH1.x} y={CH1.y} cell={CH1.cell} k={k} plyF={27} />
        {HALL.map((h, i) =>
          h.kind === "go" ? (
            <GoBoard key={i} x={h.x} y={h.y} cell={h.cell} k={k} record={h.rec} movesF={h.t} />
          ) : (
            <ChessBoard key={i} x={h.x} y={h.y} cell={h.cell} k={k} plyF={h.t % 80} />
          ),
        )}
      </>
    ),
  },
  // ---------------- CUT 3 ----------------
  {
    cut: "3  EQUALLY STRONG",
    at: "f4  “…always playing”",
    note: "Close on one self-play game (AlphaGo Zero, real record). The player: the DeepMind mark.",
    cam: cam(540, 720, 1.45),
    draw: (k) => (
      <>
        <GoBoard x={B3.x} y={B3.y} cell={B3.cell} k={k} record={1} movesF={62} />
        <DeepMindMark k={k} x={540} y={470} em={150} />
      </>
    ),
  },
  {
    cut: "3  EQUALLY STRONG",
    at: "f34  “…against an AI”",
    note: "Camera crosses the board to the opponent: the SAME mark, same size, sat opposite (rotated 180°).",
    cam: cam(540, 1180, 1.05),
    draw: (k) => (
      <>
        <GoBoard x={B3.x} y={B3.y} cell={B3.cell} k={k} record={1} movesF={72} />
        <DeepMindMark k={k} x={540} y={470} em={160} />
        <DeepMindMark k={k} x={540} y={1450} em={160} rot={180} />
      </>
    ),
  },
  {
    cut: "3  EQUALLY STRONG",
    at: "f70  “…equally strong”",
    note: "OH: every exchange, BOTH grow by the same step — the opponent is always its own size. Pull-back keeps pace, never ends.",
    cam: cam(540, 960, 0.7),
    draw: (k) => (
      <>
        <GoBoard x={B3.x} y={B3.y} cell={B3.cell} k={k} record={1} movesF={86} />
        <DeepMindMark k={k} x={540} y={440} em={250} />
        <DeepMindMark k={k} x={540} y={1480} em={250} rot={180} />
      </>
    ),
  },
  // ---------------- CUT 4 ----------------
  {
    cut: "4  SOLVE IN A SECOND",
    at: "f8  “…right now, you”",
    note: "Human scale: one person holds up one problem. Something orange looms off the top of frame.",
    cam: cam(540, 1800, 1.8),
    draw: (k) => (
      <>
        <ModelMark k={k} x={M4.x} y={M4.y} em={M4.em} />
        <Person k={k} x={P4.x} y={P4.y} />
        <QRing x={540} y={P4.y + PERSON_TOP() - 50} r={44} k={k} />
      </>
    ),
  },
  {
    cut: "4  SOLVE IN A SECOND",
    at: "f70  “…ask it to solve it”",
    note: "OH: the problem floats up and the camera pulls back with it — the model is enormous next to it.",
    cam: cam(540, 1180, 0.56),
    draw: (k) => (
      <>
        <ModelMark k={k} x={M4.x} y={M4.y} em={M4.em} />
        <Person k={k} x={P4.x} y={P4.y} />
        <QRing x={540} y={1420} r={44} k={k} />
      </>
    ),
  },
  {
    cut: "4  SOLVE IN A SECOND",
    at: "f146  “…solve it in a second”",
    note: "Push in on the touch: a wall of orange, a speck of a problem. The arc whips round in ~5 frames.",
    cam: cam(540, 980, 1.55),
    draw: (k) => {
      const R = markR(M4.em);
      const p = polar(M4.x, M4.y, contactDist(R, 44), 90);
      return (
        <>
          <ModelMark k={k} x={M4.x} y={M4.y} em={M4.em} />
          <QRing x={p.x} y={p.y} r={44} k={k} work={0.7} />
        </>
      );
    },
  },
  {
    cut: "4  SOLVE IN A SECOND",
    at: "f180  “…not really learning anything”",
    note: "Solved — and let go. It drops away white and dim; the model is exactly the size it was.",
    cam: cam(540, 1180, 1.05),
    draw: (k) => (
      <>
        <ModelMark k={k} x={M4.x} y={M4.y} em={M4.em} />
        <QRing x={590} y={1280} r={44} k={k} done={1} opacity={INK_LO} />
        <Person k={k} x={P4.x} y={P4.y} />
      </>
    ),
  },
  // ---------------- CUT 5 ----------------
  {
    cut: "5  HARDER TO MAKE PROGRESS",
    at: "f8  “then that is…”",
    note: "Inside a crowd of people, each holding up their one question.",
    cam: cam(540, 1640, 1.25),
    draw: (k) => (
      <>
        {CROWD5.map((p, i) => (
          <React.Fragment key={i}>
            <Person k={k} x={p.x} y={p.y} />
            <QRing x={p.x} y={p.y + PERSON_TOP() - 48 - (hash(i, 2) > 0.6 ? 40 : 0)} r={40 + hash(i, 6) * 10} k={k} />
          </React.Fragment>
        ))}
      </>
    ),
  },
  {
    cut: "5  HARDER TO MAKE PROGRESS",
    at: "f45  “…where actually, like”",
    note: "Everyone's questions flow together and merge into ONE bigger question (area adds, same law).",
    cam: cam(540, 1470, 0.8),
    draw: (k) => (
      <>
        {CROWD5.map((p, i) => (
          <Person key={i} k={k} x={p.x} y={p.y} />
        ))}
        {CROWD5.filter((_, i) => i % 3 === 0).map((p, i) => {
          const t = 0.35 + hash(i, 8) * 0.5;
          return (
            <QRing
              key={`q${i}`}
              x={lerpN(p.x, 540, t)}
              y={lerpN(p.y - 110, 1330, t)}
              r={44}
              k={k}
            />
          );
        })}
        <QRing x={540} y={1330} r={175} k={k} />
      </>
    ),
  },
  {
    cut: "5  HARDER TO MAKE PROGRESS",
    at: "f78  “…much harder”",
    note: "The pooled question rises; the camera follows it up and finds the giant model.",
    cam: cam(540, 900, 0.56),
    draw: (k) => (
      <>
        <ModelMark k={k} x={M5.x} y={M5.y} em={M5.em} />
        {CROWD5.map((p, i) => (
          <Person key={i} k={k} x={p.x} y={p.y} />
        ))}
        <QRing x={540} y={1010} r={237} k={k} />
      </>
    ),
  },
  {
    cut: "5  HARDER TO MAKE PROGRESS",
    at: "f118  “…to make progress” (tail)",
    note: "It IS a challenge: the arc crawls round (slowest in the film). It took everyone for one step. Ends mid-sweep.",
    cam: cam(540, 720, 0.8),
    draw: (k) => {
      const R = markR(M5.em);
      const p = polar(M5.x, M5.y, contactDist(R, 237), 90);
      return (
        <>
          <ModelMark k={k} x={M5.x} y={M5.y} em={M5.em} />
          {CROWD5.map((q, i) => (
            <Person key={i} k={k} x={q.x} y={q.y} opacity={1} />
          ))}
          <QRing x={p.x} y={p.y} r={237} k={k} work={0.62} />
        </>
      );
    },
  },
];

function lerpN(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export const PANEL_COUNT = PANELS.length;

const ChallengeStoryboardV3: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const p = PANELS[Math.min(PANELS.length - 1, f)];
  return (
    <AbsoluteFill>
      <Stage frame={0} cam={p.cam} rest={p.cam}>
        {p.draw(p.cam.k)}
      </Stage>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 430,
          background: "rgba(0,0,0,0.72)",
          color: "#fff",
          fontFamily: FONT_LABEL,
          padding: "34px 48px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "0.04em", color: "#FFB000" }}>{p.cut}</div>
        <div style={{ fontSize: 50, fontWeight: 700, marginTop: 10 }}>{p.at}</div>
        <div style={{ fontSize: 40, marginTop: 18, lineHeight: 1.25, opacity: 0.9 }}>{p.note}</div>
      </div>
      <div style={{ display: "none" }}>{PERSON_H}</div>
    </AbsoluteFill>
  );
};

export default ChallengeStoryboardV3;
