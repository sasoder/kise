// ---------------------------------------------------------------------------
// KpisAllMet (nik-detecting-bullshit, cut 7). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 66 frames. Palette B1 (the stoutShared default).
// World: ./kpiWorld.tsx, shared with cut 20 `KpiMetByLuck`: this row's middle tile (REVENUE) IS cut 20's tile
// (same tile, bar, target line, face print, at the same world size; cut 20 is a ~2.4x closer look at it).
//
// CHECK LINE: "These are a company's KPIs — the key numbers a team is judged by — and every one of them hits
// its target."
//
// THE LINE (sequence 7.132-9.885 s): "is rosy, KPIs are good, everything is met,"
// WORD -> FRAME: is f7 · rosy f10 · KPIs f22 · are f32 · good f35 · everything f44 · is f50 · met f55 ·
// (met ends ~f62) · But f66 = slot end.
// DURATION: the slot 7.132 -> 9.885 s = 2.753 s x 23.976 = 66 frames (f0..f65).
//
// THE MOTION: three cream KPI tiles in a row (USERS · REVENUE · RETENTION in ink on their faces), each with a
// dashed target line and a pennant. All three bars are already rising out of their slots on f0, each ONE
// decelerating rise, staggered so they meet their lines one after another; each line lights amber outward
// from its bar's contact point: left lit by ~f31 ("good" f35), middle by ~f49 ("is" f50), right by ~f54 ("met"
// f55). "KPIs*" (Dreiviertelfett) comes in over the row by "KPIs" (f10-22) and its two-line footnote (38-40 px, cream
// at 85 %) under it right after (f18-30). One slow push-in toward the middle tile the whole cut (k 0.69 -> 0.73, +6 %); living hold to f65.
// Contacts: a line's light starts on the frame its bar's gap drops under 1.5 screen px.
// AMBER = a KPI being met (COMMON.md): only the lit lines. Cream = the KPIs.
//
// SOURCES: none (no figures; KPI names are generic examples, the bar heights are not data).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_LABEL, FONT_NUM, METRIC, StoutStage, TYPE, amberBandFor, clamp01, easeOutCubic, mixHex, subWidth } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack, winU, type Cam } from "../kits/cheeky-pint/museShared";
import { BAR_W, FLAG, FLOOR, KpiTile, LINE, PieceBody, RADIUS, ROW, StackShadows, TILE, TargetLine, inkEntrance, type Piece } from "./kpiWorld";

export const FPS = 24000 / 1001;
export const DURATION = 66;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- timing (cut frames) --------------------------------------------------------------------------------
/** Each bar's one rise (rest to rest; all already rising on f0) and the frame its line must be lit by. */
const RISES = [
  { win: [-8, 32] as const, litBy: 35 }, // USERS, by "good"
  { win: [-8, 46] as const, litBy: 50 }, // REVENUE (cut 20's tile), by "is"
  { win: [-8, 51] as const, litBy: 55 }, // RETENTION, on "met"
];
const LIGHT_F = 5;
const HEAD_IN = 10; // "KPIs*" in over 12 f: landed f22 ("KPIs")
const FOOT_IN = 18; // the footnote: landed f30
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
const CAM = makeClockCam({ x: TILE.X, y: 1235, k: K0 }, [{ f0: -10, f1: 96, k: K1, dy: -4 }], DURATION);
const POOL = makePoolTrack({ x: TILE.X, y: TILE.TOP - 200 }, [{ f0: 0, f1: 60, x: TILE.X, y: TILE.TOP - 150 }], DURATION);

// --- the heading and its footnote (WORLD px; sizes at the final k are the TYPE tokens) ---------------------
const HEAD = { text: "KPIs*", fs: TYPE.SECONDARY / K1, y: 572 } as const;
/** The footnote: two centred lines, 38 -> 40 screen px with the push-in, cream at 85 % (a tone mixed into
 *  the ground, not a transparency). */
const FOOT_LINES = ["*Key performance indicators:", "the numbers a team is judged by"] as const;
const FOOT_PX = 38 / K0;
const FOOT_LEAD = 1.22 * FOOT_PX;
const FOOT_Y = HEAD.y + (24 + METRIC.cap * 39) / K1; // the first line's baseline
const FOOT_LAST_Y = FOOT_Y + (FOOT_LINES.length - 1) * FOOT_LEAD;
const FOOT_COLOR = mixHex(COLOR.ground, COLOR.inkCream, 0.85);

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
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={POOL(S)}>
      <Entering enter={(S - HEAD_IN) / ENTER_F} k={k}>
        <text x={TILE.X} y={HEAD.y} fontFamily={FONT_NUM} fontWeight={700} fontSize={HEAD.fs.toFixed(3)} letterSpacing="-0.015em" textAnchor="middle" fill={COLOR.inkCream}>
          {HEAD.text}
        </text>
      </Entering>
      <Entering enter={(S - FOOT_IN) / ENTER_F} k={k}>
        {FOOT_LINES.map((t, i) => (
          <text key={i} x={TILE.X} y={(FOOT_Y + i * FOOT_LEAD).toFixed(3)} fontFamily={FONT_LABEL} fontWeight={500} fontSize={FOOT_PX.toFixed(3)} textAnchor="middle" fill={FOOT_COLOR}>
            {t}
          </text>
        ))}
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
    if (barH(0, i) * K0 < 8) fail(`${ROW[i].name}'s bar is not visibly rising on f0`);
  });
  const footW = Math.max(...FOOT_LINES.map((t) => subWidth(t, FOOT_PX)));
  for (let S = 0; S < DURATION; S += 0.5) {
    const c = CAM.at(S);
    const L = ROW[0].x - TILE.W / 2;
    const R = ROW[2].x + TILE.W / 2;
    if (SX(c, L) - 3 < 65 || SX(c, R) + 3 > 990) fail(`S${S}: the row spans x ${SX(c, L).toFixed(0)}-${SX(c, R).toFixed(0)}`);
    if (SY(c, FLOOR) + 5 > 1068) fail(`S${S}: the tiles' foot at y ${SY(c, FLOOR).toFixed(0)}`);
    const headTop = SY(c, HEAD.y - HEAD.fs * METRIC.cap) - 5;
    if (headTop < 300) fail(`S${S}: the heading's top at y ${headTop.toFixed(0)}`);
    const fw = footW * c.k;
    if (540 - fw / 2 - 3 < 65 || 540 + fw / 2 + 3 > 1015) fail(`S${S}: the footnote is ${fw.toFixed(0)} px wide`);
    for (const t of ROW) if (SY(c, FOOT_LAST_Y + 0.22 * FOOT_PX) > SY(c, TILE.TOP - t.h - FLAG.POLE) - 40) fail(`S${S}: the footnote crowds the pennants`);
    if (BAR_W * c.k < 80) fail(`S${S}: the bars are thin`);
  }
}
