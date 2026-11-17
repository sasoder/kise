// ---------------------------------------------------------------------------
// KpisAllMet (nik-detecting-bullshit, cut 7). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 89 frames. Palette B1 (the stoutShared default).
//
// REV 2 (the user, Nov 17): "remove the header text and only make it say 'Key performance indicators'",
// start at 00:00:06:04 (23 frames earlier, "so the viewer has a bit more time to see and understand
// everything"), and "move everything down slightly like we usually do" (StoutStage dy SHIFT_Y = 190).
// The "KPIs*" heading and its footnote are gone; ONE line "Key performance indicators" (sentence case,
// Dreiviertelfett, cream) enters first, f2-14, over the empty row; the bars then rise one by one and meet
// their lines on the same words as before (good / is / met, now f58 / f73 / f78).
// World: ./kpiWorld.tsx, shared with cut 20 `KpiMetByLuck`: this row's middle tile (REVENUE) IS cut 20's tile
// (same tile, bar, target line, face print, at the same world size; cut 20 is a ~2.4x closer look at it).
//
// CHECK LINE: "These are a company's KPIs — the key numbers a team is judged by — and every one of them hits
// its target."
//
// THE LINE (sequence 6.173-9.885 s): "(when) everything is rosy, KPIs are good, everything is met,"
// WORD -> FRAME: everything f8 · is f30 · rosy f34 · KPIs f45 · are f55 · good f58 · everything f67 · is f73 ·
// met f78 · (met ends ~f85) · But f89 = slot end. Placed 6.173-9.801 (f0..f86, the user's selection end).
// DURATION: 00:00:06:04 (sequence frame 148) -> 9.885 s = 89 frames (f0..f88).
//
// THE MOTION: three cream KPI tiles in a row (USERS · REVENUE · RETENTION in ink on their faces), each with a
// dashed target line and a pennant, in shot from f0 with empty slots. "Key performance indicators" comes in
// over the row first (f2-14). Then each bar makes ONE eased rise out of its slot (starts f8 / f13 / f18),
// staggered so they meet their lines one after another; each line lights amber outward from its bar's
// contact point: left by "good" (f58), middle by "is" (f73), right on "met" (f78). One slow push-in toward
// the middle tile the whole cut (k 0.69 -> 0.73); living hold to f88.
// Contacts: a line's light starts on the frame its bar's gap drops under 1.5 screen px.
// AMBER = a KPI being met (COMMON.md): only the lit lines. Cream = the KPIs.
//
// SOURCES: none (no figures; KPI names are generic examples, the bar heights are not data).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_NUM, METRIC, StoutStage, amberBandFor, clamp01, easeOutCubic } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack, winU, type Cam } from "../kits/cheeky-pint/museShared";
import { BAR_W, FLAG, FLOOR, KpiTile, LINE, PieceBody, RADIUS, ROW, SHIFT_Y, STACK_H, StackShadows, TILE, TargetLine, inkEntrance, type Piece } from "./kpiWorld";

export const FPS = 24000 / 1001;
export const DURATION = 89;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- timing (cut frames) --------------------------------------------------------------------------------
/** Each bar's one rise (rest to rest; all already rising on f0) and the frame its line must be lit by. */
const RISES = [
  { win: [8, 55] as const, litBy: 58 }, // USERS, by "good"
  { win: [13, 69] as const, litBy: 73 }, // REVENUE (cut 20's tile), by "is"
  { win: [18, 74] as const, litBy: 78 }, // RETENTION, on "met"
];
const LIGHT_F = 5;
const HEAD_IN = 2; // "Key performance indicators" in over 12 f: landed f14, read before the bars move much
const ENTER_F = 12;

const RISE_B = 3;
const riseCurve = (t: number) => {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, RISE_B) * (1 + RISE_B * u);
};
const liftEnv = (S: number, [a, b]: readonly [number, number], peak: number) => {
  const t = winU(S, a, b);
  return t <= 0 || t >= 1 ? 0 : peak * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 2);
};
const barH = (S: number, i: number) => ROW[i].h * riseCurve(winU(S, RISES[i].win[0], RISES[i].win[1]));

// --- camera + light pool ---------------------------------------------------------------------------------
const K0 = 0.69;
const K1 = 0.73;
const CAM = makeClockCam({ x: TILE.X, y: 1235, k: K0 }, [{ f0: -10, f1: 119, k: K1, dy: -4 }], DURATION);
const POOL = makePoolTrack({ x: TILE.X, y: TILE.TOP - 200 }, [{ f0: 0, f1: 83, x: TILE.X, y: TILE.TOP - 150 }], DURATION);

// --- the heading (WORLD px) ------------------------------------------------------------------------------
/** One line, sentence case, cream Dreiviertelfett at HEAD_PX SCREEN px at the final k; its baseline HEAD_GAP
 *  screen px over the middle pennant's top (the row's highest point). */
const HEAD_PX = 60;
const HEAD_GAP = 92;
const HEAD = { text: "Key performance indicators", fs: HEAD_PX / K1, y: TILE.TOP - STACK_H - FLAG.POLE - HEAD_GAP / K1 } as const;
/** The heading's advance per em (Söhne Dreiviertelfett, measured on a render: see the sheet). */
const HEAD_EM_W = 12.9;

const contactOf = (i: number) => {
  for (let s = RISES[i].win[0]; s <= RISES[i].win[1]; s += 0.05) if ((ROW[i].h - barH(s, i)) * CAM.at(Math.max(0, s)).k < 1.5) return s;
  return RISES[i].win[1];
};
const CONTACT = ROW.map((_, i) => contactOf(i));

const Entering: React.FC<{ enter: number; k: number; children: React.ReactNode }> = ({ enter, k, children }) => {
  const en = inkEntrance(clamp01(enter));
  if (en.opacity <= 0.002) return null;
  return (
    <g opacity={en.opacity.toFixed(4)} transform={`translate(0 ${(en.lift / k).toFixed(4)})`} style={{ filter: en.blur > 0.05 ? `blur(${(en.blur / k).toFixed(3)}px)` : undefined }}>
      {children}
    </g>
  );
};

const KpisAllMet: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const pieces: Piece[] = ROW.map((t, i) => ({
    key: t.name,
    cx: t.x,
    top: TILE.TOP - barH(S, i),
    bot: TILE.TOP,
    rTop: RADIUS,
    rBot: 0,
    dim: 0,
    lift: liftEnv(S, RISES[i].win, 0.5),
  }));
  return (
    <StoutStage dy={SHIFT_Y} S={S} cam={cam} rest={CAM.rest} pool={POOL(S)}>
      <Entering enter={(S - HEAD_IN) / ENTER_F} k={k}>
        <text x={TILE.X} y={HEAD.y.toFixed(3)} fontFamily={FONT_NUM} fontWeight={700} fontSize={HEAD.fs.toFixed(3)} letterSpacing="-0.01em" textAnchor="middle" fill={COLOR.inkCream}>
          {HEAD.text}
        </text>
      </Entering>
      {ROW.map((t, i) => (
        <TargetLine key={t.name} k={k} cx={t.x} y={TILE.TOP - t.h} lit={LINE.HALF * easeOutCubic((S - CONTACT[i]) / LIGHT_F)} band={band} flagTone={easeOutCubic((S - CONTACT[i]) / LIGHT_F)} />
      ))}
      <StackShadows pieces={pieces} />
      {ROW.map((t) => (
        <KpiTile key={t.name} k={k} cx={t.x} name={t.name} />
      ))}
      {pieces.map((p, i) => (
        <PieceBody key={p.key} p={p} k={k} gradTop={TILE.TOP - ROW[i].h} />
      ))}
    </StoutStage>
  );
};

export default KpisAllMet;

// --- load-time checks: every frame, every camera state (sway: +-3 x, +-5 y) ---------------------------------------
const SX = (c: Cam, wx: number) => 540 + (wx - c.x) * c.k;
const SY = (c: Cam, wy: number) => 960 + (wy - c.y) * c.k;
{
  const fail = (m: string) => {
    throw new Error(`KpisAllMet: ${m}`);
  };
  RISES.forEach((r, i) => {
    if (CONTACT[i] + LIGHT_F > r.litBy) fail(`${ROW[i].name}'s line is lit only by f${(CONTACT[i] + LIGHT_F).toFixed(1)} (want <= f${r.litBy})`);
    if (barH(r.win[0] + 6, i) * K0 < 4) fail(`${ROW[i].name}'s bar is not visibly rising 6 f after its start`);
  });
  if (HEAD_IN + ENTER_F > 24) fail("the heading lands after the first second");
  for (let S = 0; S < DURATION; S += 0.5) {
    const c = CAM.at(S);
    const L = ROW[0].x - TILE.W / 2;
    const R = ROW[2].x + TILE.W / 2;
    if (SX(c, L) - 3 < 65 || SX(c, R) + 3 > 990) fail(`S${S}: the row spans x ${SX(c, L).toFixed(0)}-${SX(c, R).toFixed(0)}`);
    if (SY(c, FLOOR) + 5 > 1068) fail(`S${S}: the tiles' foot at y ${SY(c, FLOOR).toFixed(0)}`);
    const headTop = SY(c, HEAD.y - HEAD.fs * METRIC.cap) - 5;
    if (headTop < 300) fail(`S${S}: the heading's top at y ${headTop.toFixed(0)}`);
    const hw = HEAD_EM_W * HEAD.fs * c.k;
    if (540 - hw / 2 - 3 < 65 || 540 + hw / 2 + 3 > 1015) fail(`S${S}: the heading is ${hw.toFixed(0)} px wide`);
    if (BAR_W * c.k < 80) fail(`S${S}: the bars are thin`);
  }
}
