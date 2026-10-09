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
  Label,
  PlanMark,
  RedBar,
  RedGroup,
  Slot,
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
// VintageKitSheet — the kit sheet of chinatalkVintage.tsx ("ChinaTalk, slightly
// vintage", Logan Wright "Brezhnev chose decay"). Not a graphic: one composed
// frame that shows the look at a glance: the aged paper stage, a VintagePhoto
// (placeholder: public/maven/pentagon.jpg), a red wet-ink line with its bead
// running off the photo onto the paper, a Slot half-filled by a segmented
// RedBar with a PlanMark, a dashed ink path carrying Units between two icons,
// one word label and one value label. 1080x1920, 24 fps, 24 frames; the camera
// drifts a little so grain and edges can be checked for shimmer.
// `finish: false` drops the print finish (render-time comparison); `test: true`
// swaps the lower block for a parts test of every shared shape.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 24;
export const schema = z.object({ finish: z.boolean(), test: z.boolean() });
export const defaultProps = schema.parse({ finish: true, test: false });

const PLACEHOLDER = "maven/pentagon.jpg";
const REST = vCam(540, 960, 1);
const camAt = runVCamera(
  [
    { f: -24, x: 534, y: 963, k: 1 },
    { f: 24, x: 546, y: 957, k: 1.035, ease: "linear" },
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

const PHOTO = { x: 150, y: 250, w: 780, h: 520 };
const RED_PATH = bezier({ x: 318, y: 612 }, { x: 520, y: 500 }, { x: 540, y: 905 }, { x: 852, y: 985 }, 60);
const RED_SPEED = 14; // world px per frame while it was written
const SLOT_A = { x: 150, y: 1425 };
const SLOT_B = { x: 930, y: 1425 };
const SLOT_W = 120;
const TRACK = bezier({ x: 338, y: 1690 }, { x: 470, y: 1590 }, { x: 610, y: 1590 }, { x: 742, y: 1690 }, 40);

const LowerBlock: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const mark = barCross(SLOT_A, SLOT_B, SLOT_W, 585, 26);
  const cum = cumLen(TRACK);
  const total = cum[cum.length - 1];
  return (
    <>
      <RedBar id="sheet-bar" from={SLOT_A} to={SLOT_B} width={SLOT_W} k={k} slot seam={65} len={390 + 0.6 * S} wet={0.6} />
      <Slot from={SLOT_A} to={SLOT_B} width={SLOT_W} k={k} />
      <PlanMark from={mark.from} to={mark.to} k={k} S={S} />
      <Label text="Plan" x={mark.from.x} y={mark.from.y - 42} k={k} size="word" />
      <DashedPath points={TRACK} k={k} S={S} rung={INK_LO} />
      <RedGroup k={k}>
        {[0.26, 0.5, 0.74].map((t, i) => {
          const p = pointAtLen(TRACK, cum, ((t + S * 0.0016) % 1) * total);
          return <Unit key={i} x={p.x} y={p.y} k={k} />;
        })}
      </RedGroup>
      <Icon d={ICONS.factory} x={240} y={1690} size={150} k={k} />
      <Icon d={ICONS.cpu} x={840} y={1690} size={150} k={k} />
    </>
  );
};

const TestBlock: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const y0 = 1300;
  const bars = [14, 60, 200, 380];
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
      <InkPath points={[{ x: 100, y: 1640 }, { x: 980, y: 1640 }]} k={k} width={HAIR} rung={INK_LO} />
      <RedGroup k={k}>
        <Unit x={140} y={1700} k={k} />
        <Unit x={190} y={1700} k={k} rotate={12} />
      </RedGroup>
      <Unit x={240} y={1700} k={k} hollow />
      <Icon d={ICONS.wheat} x={380} y={1760} size={130} k={k} draw={0.6} />
      <Icon d={ICONS.tractor} x={540} y={1760} size={130} k={k} rung={INK_LO} />
      <Icon d={ICONS.rocket} x={700} y={1760} size={130} k={k} />
      <Icon d={ICONS.trainFront} x={860} y={1760} size={130} k={k} />
      <HatchFill id="t-hatch" region={[{ x: 940, y: 1680 }, { x: 1020, y: 1680 }, { x: 1020, y: 1840 }, { x: 940, y: 1840 }]} k={k} fill={0.1} lineOpacity={0.35} />
      <Label text={`S ${S}`} x={960} y={1600} k={k} size="word" rung={INK_LO} anchor="end" />
    </>
  );
};

const VintageKitSheet: React.FC<z.infer<typeof schema>> = ({ finish, test }) => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const cum = cumLen(RED_PATH);
  const total = cum[cum.length - 1];
  const tip = RED_PATH[RED_PATH.length - 1];
  return (
    <VStage
      S={S}
      cam={cam}
      rest={REST}
      finish={finish}
      photos={<VintagePhoto src={PLACEHOLDER} box={PHOTO} focus={{ x: 0.35, y: 0.6 }} rotate={-1.2} />}
    >
      <WetLine id="sheet-red" points={RED_PATH} k={k} bead={1} ageAt={(s) => (total - s) / RED_SPEED} />
      <Label text="1964" x={tip.x + 6} y={tip.y - 84} k={k} size="value" />
      {test ? <TestBlock S={S} k={k} /> : <LowerBlock S={S} k={k} />}
    </VStage>
  );
};

export default VintageKitSheet;
