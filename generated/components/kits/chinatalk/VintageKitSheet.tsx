import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  DashedPath,
  HAIR,
  HatchFill,
  ICONS,
  INK_LO,
  Icon,
  InkPath,
  Kicker,
  Label,
  PICTOS,
  Pictogram,
  PlanMark,
  RED,
  RedBar,
  RedGroup,
  Rule,
  Seal,
  Slot,
  SourceLine,
  Unit,
  VStage,
  VintagePhoto,
  WetLine,
  barCross,
  cumLen,
  pointAtLen,
  runVCamera,
  vCam,
} from "./chinatalkVintage";
import type { Pt } from "./chinatalkVintage";

// ---------------------------------------------------------------------------
// VintageKitSheet — the kit sheet of chinatalkVintage.tsx, pass 2 "newsprint"
// (Logan Wright "Brezhnev chose decay"). Not a graphic: one composed frame that
// shows the look at a glance: the newsprint page; brezhnev_1972.jpg as a
// halftone clipping with its cutline; a Kicker; a red wet line with seals and
// two value labels over a hair rule, with a SourceLine; a "head" label; a
// double and a bold Rule; a RedBar in a Slot with a PlanMark; two solid
// pictograms (red, ink tint). 1080x1920, 24 fps, 48 frames.
// Props: `finish: false` drops the print finish (render-time comparison);
// `test: true` swaps the lower block for a parts test of every shared shape;
// `move: true` runs the proof camera (a 600 px pan, then a 1.0 -> 1.3 zoom over
// the clipping) instead of the slow drift; `lock` is VStage's paperLock;
// `tone` switches the clipping between "news" and the pass-1 "print"; `fix`
// pins the camera for proof stills; `proof` shows one photograph alone
// ("face": cut B's portrait; "irkutsk": cut A's print under a slow pan).
// The numbers on the sheet are specimens, not data.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 48;
export const schema = z.object({
  finish: z.boolean(),
  test: z.boolean(),
  move: z.boolean(),
  lock: z.number(),
  tone: z.enum(["news", "print"]),
  /** proof stills: a fixed camera {x, y, k} instead of the track (k = 0 means "use the track") */
  fix: z.object({ x: z.number(), y: z.number(), k: z.number() }),
  /** photo proofs instead of the sheet: "face" = the Brezhnev clipping at the size cut B shows it (still camera);
   *  "irkutsk" = the Irkutsk photograph at the size cut A shows it, a slow 300 px pan at k 1.28 */
  proof: z.enum(["none", "face", "irkutsk"]),
});
export const defaultProps = schema.parse({
  finish: true,
  test: false,
  move: false,
  lock: 1,
  tone: "news",
  fix: { x: 540, y: 960, k: 0 },
  proof: "none",
});

const PHOTO_SRC = "brezhnev/brezhnev_1972.jpg";
// the photo proofs: cut B's portrait window, and cut A's print of the Irkutsk queue (1500 px tall)
const FACE_BOX = { x: 200, y: 100, w: 680, h: 902 };
const IRKUTSK_SRC = "brezhnev/irkutsk_queue_1981.jpg";
const IRKUTSK_BOX = { x: 0, y: 210, w: (1500 * 3128) / 2088, h: 1500 };
const REST = vCam(540, 960, 1);
const driftCam = runVCamera(
  [
    { f: -24, x: 537, y: 962, k: 1 },
    { f: 48, x: 544, y: 957, k: 1.02, ease: "linear" },
  ],
  DURATION,
);
const moveCam = runVCamera(
  [
    { f: -12, x: 1140, y: 640, k: 1 },
    { f: 26, x: 540, y: 640, k: 1, ease: "linear" },
    { f: 47, x: 310, y: 600, k: 1.3 },
  ],
  DURATION,
);

const bezier = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = (1 - t) ** 3;
    const b = 3 * (1 - t) ** 2 * t;
    const c = 3 * (1 - t) * t ** 2;
    const d = t ** 3;
    return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
  });

const L = 70;
const R = 1010;
const PHOTO = { x: 86, y: 300, w: 420, h: 566 };
const RED_PATH = bezier({ x: 604, y: 520 }, { x: 760, y: 520 }, { x: 800, y: 700 }, { x: 990, y: 722 }, 60);
const RED_SPEED = 14; // world px per frame while it was written
const BASE_Y = 880;
const SLOT_A = { x: L, y: 1420 };
const SLOT_B = { x: R, y: 1420 };
const SLOT_W = 120;
const GROUND_Y = 1800;

const LowerBlock: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const mark = barCross(SLOT_A, SLOT_B, SLOT_W, 705, 26);
  return (
    <>
      <RedBar id="sheet-bar" from={SLOT_A} to={SLOT_B} width={SLOT_W} k={k} slot seam={78} len={468 + 0.5 * S} wet={0.6} />
      <Slot from={SLOT_A} to={SLOT_B} width={SLOT_W} k={k} />
      <PlanMark from={mark.from} to={mark.to} k={k} S={S} />
      <Label text="Plan" x={mark.from.x} y={mark.from.y - 42} k={k} size="word" />
      <RedGroup k={k}>
        <Pictogram d={PICTOS.factory} x={300} y={GROUND_Y - 108} size={236} color={RED} rung={1} />
      </RedGroup>
      <Pictogram d={PICTOS.tractor} x={770} y={GROUND_Y - 100} size={236} rung={INK_LO} />
      <Rule from={{ x: L, y: GROUND_Y }} to={{ x: R, y: GROUND_Y }} k={k} kind="bold" />
    </>
  );
};

const TestBlock: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const y0 = 1300;
  const bars = [14, 60, 200, 380];
  const track = bezier({ x: 120, y: 1610 }, { x: 240, y: 1570 }, { x: 420, y: 1650 }, { x: 560, y: 1600 }, 30);
  const cum = cumLen(track);
  return (
    <>
      {bars.map((len, i) => (
        <RedBar key={i} id={`t-pill-${i}`} from={{ x: 120 + i * 20, y: y0 + i * 70 }} to={{ x: 520 + i * 20, y: y0 + i * 70 }} width={50} k={k} len={len} seam={i === 3 ? 40 : 0} />
      ))}
      <RedBar id="t-vert" from={{ x: 640, y: 1560 }} to={{ x: 640, y: 1290 }} width={64} k={k} len={200} wet={1} />
      <Slot from={{ x: 640, y: 1560 }} to={{ x: 640, y: 1290 }} width={64} k={k} radius={32} rung={INK_LO} />
      <Slot from={{ x: 760, y: 1560 }} to={{ x: 760, y: 1290 }} width={64} k={k} dashed />
      <RedBar id="t-slotv" from={{ x: 880, y: 1560 }} to={{ x: 880, y: 1290 }} width={64} k={k} slot len={120} seam={30} />
      <Slot from={{ x: 880, y: 1560 }} to={{ x: 880, y: 1290 }} width={64} k={k} wash={0.08} />
      <PlanMark {...barCross({ x: 880, y: 1560 }, { x: 880, y: 1290 }, 64, 200)} k={k} solid={0.5} />
      <DashedPath points={track} k={k} S={S} rung={INK_LO} />
      <InkPath points={[{ x: 100, y: 1660 }, { x: 980, y: 1660 }]} k={k} width={HAIR} rung={INK_LO} />
      <RedGroup k={k}>
        <Unit x={140} y={1710} k={k} />
        <Unit x={190} y={1710} k={k} rotate={12} />
        <Unit {...pointAtLen(track, cum, cum[cum.length - 1] * 0.5)} k={k} />
      </RedGroup>
      <Unit x={240} y={1710} k={k} hollow />
      <Icon d={ICONS.wheat} x={380} y={1770} size={130} k={k} draw={0.6} />
      <Icon d={ICONS.tractor} x={540} y={1770} size={130} k={k} rung={INK_LO} />
      <Icon d={ICONS.rocket} x={700} y={1770} size={130} k={k} />
      <Icon d={ICONS.trainFront} x={860} y={1770} size={130} k={k} />
      <HatchFill id="t-hatch" region={[{ x: 940, y: 1690 }, { x: 1020, y: 1690 }, { x: 1020, y: 1850 }, { x: 940, y: 1850 }]} k={k} fill={0.1} lineOpacity={0.35} />
      <Label text="1950s" x={960} y={1610} k={k} size="word" rung={INK_LO} anchor="end" transformCase="none" />
    </>
  );
};

const VintageKitSheet: React.FC<z.infer<typeof schema>> = ({ finish, test, move, lock, tone, fix, proof }) => {
  const S = useCurrentFrame();
  if (proof === "face") {
    const c = fix.k > 0 ? vCam(fix.x, fix.y, fix.k) : vCam(540, 960, 1);
    return (
      <VStage
        S={S}
        cam={c}
        finish={finish}
        swayOn={false}
        photos={<VintagePhoto src={PHOTO_SRC} box={FACE_BOX} focus={{ x: 0.5, y: 0.4 }} tone={tone} cutline="Leonid Brezhnev, 1972" />}
      />
    );
  }
  if (proof === "irkutsk") {
    const c = vCam(940 + (300 * S) / (DURATION - 1), 960, 1.28);
    return (
      <VStage S={S} cam={c} finish={finish} photos={<VintagePhoto src={IRKUTSK_SRC} box={IRKUTSK_BOX} tone={tone} cutline="Irkutsk, 1981" />} />
    );
  }
  const cam = fix.k > 0 ? vCam(fix.x, fix.y, fix.k) : move ? moveCam(S) : driftCam(S);
  const k = cam.k;
  const cum = cumLen(RED_PATH);
  const total = cum[cum.length - 1];
  const a = RED_PATH[0];
  const tip = RED_PATH[RED_PATH.length - 1];
  return (
    <VStage
      S={S}
      cam={cam}
      rest={REST}
      finish={finish}
      paperLock={lock}
      photos={<VintagePhoto src={PHOTO_SRC} box={PHOTO} focus={{ x: 0.5, y: 0 }} tone={tone} cutline="Leonid Brezhnev, 1972" />}
    >
      <Kicker text="Industrial output" x={L} y={170} k={k} width={R - L} />
      <Label text="Growth" x={596} y={332} k={k} size="head" anchor="start" />
      <Rule from={{ x: 580, y: BASE_Y }} to={{ x: R, y: BASE_Y }} k={k} kind="hair" rung={INK_LO} />
      <WetLine id="sheet-red" points={RED_PATH} k={k} bead={1} ageAt={(s) => (total - s) / RED_SPEED} />
      <RedGroup k={k}>
        {[0, 0.36, 0.7].map((t) => {
          const p = pointAtLen(RED_PATH, cum, t * total);
          return <Seal key={t} x={p.x} y={p.y} k={k} />;
        })}
      </RedGroup>
      <Label text="1960" x={a.x - 8} y={a.y - 70} k={k} size="value" anchor="start" />
      <Label text="1980" x={tip.x + 16} y={tip.y + 88} k={k} size="value" anchor="end" />
      <SourceLine text="Specimen figures, not data" x={580} y={BASE_Y + 46} k={k} />
      <Rule from={{ x: L, y: 1010 }} to={{ x: R, y: 1010 }} k={k} kind="double" />
      {test ? <TestBlock S={S} k={k} /> : <LowerBlock S={S} k={k} />}
    </VStage>
  );
};

export default VintageKitSheet;
