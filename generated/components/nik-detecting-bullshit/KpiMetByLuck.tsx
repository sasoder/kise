// ---------------------------------------------------------------------------
// KpiMetByLuck (nik-detecting-bullshit, cut 20). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 90 frames. Palette B1 (the stoutShared default).
// World: ./kpiWorld.tsx (own file; the board look copied from cut B's wealthWorld, nothing imported from it).
// Replaces RisingTide (the harbour tide), which the user rejected as "way too far fetched".
//
// CHECK LINE: "The KPI bar hit its target line, but when you open it up, most of it was the market and luck;
// only a small part at the bottom was the team's own work."
//
// THE LINE (sequence 20.395-24.149 s): "(because KPI) can be met because of external factors and because of
// luck, and"
// WORD -> FRAME: (KPI tail to ~f7) can f9 · be f13 · met f17 · because f24 · of f35 · external f43 · factors f55 ·
// and f63 · because f70 · of f74 · luck f78 · (luck ends ~f83) · and f85 · slot ends f90.
// DURATION: the slot 20.395 -> 24.149 s = 3.754 s x 23.976 = 90 frames (f0..f89).
//
// THE MOTION: one cream KPI tile (REVENUE in ink on its face, counter-scaled to 52 px: the middle tile of cut 7's row `KpisAllMet`), a dashed target line above it with a pennant at its
// right end. The KPI bar is already rising out of the tile's slot on f0 (one decelerating curve, f-4..14) and
// touches the line; the line lights amber outward from the contact point (contact ~f10 -> fully lit f16, before
// "met" f17). Then the bar opens up into what it is made of, ONE eased exploded view: the seam over the small
// cream base opens (f28-54) as the upper body tones down to board (f40-54) and its ink rising-market glyph +
// MARKET come in on "external" (f43-55); three ink busts come in on the cream base (f30-42); the seam under the
// top opens (f65-83) and an ink four-leaf clover comes in on its face (f70-82, "of luck" f74-78). The stack's
// top never leaves the lit line, the base never leaves its slot (each seam's gap is taken from its two
// neighbours). The camera pushes in gently the whole cut (k 1.64 -> ~1.75, +7 %); living hold to f89.
// Contacts: the bar touches the line on the frame its gap drops under 1.5 screen px (CONTACT_S); the light's
// front starts there. AMBER = the KPI being met (COMMON.md): only the lit line. Cream = ours (the team's base),
// board = not ours (market, luck).
//
// SOURCES: none (no figures; the shares 19 / 52 / 29 % are a picture of the idea, not data, and never labelled).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, amberBandFor, clamp01, easeOutCubic, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack, restToRest, winU, type Cam } from "../kits/cheeky-pint/museShared";
import {
  BAR_W,
  CloverGlyph,
  FACE,
  FLAG,
  FLOOR,
  FaceInk,
  FaceWord,
  GAP,
  KpiTile,
  LINE,
  LINE_Y,
  MarketGlyph,
  PieceBody,
  RADIUS,
  SEAM1,
  SEAM2,
  STACK_H,
  StackShadows,
  TILE,
  TILE_X0,
  TILE_X1,
  TargetLine,
  TeamBusts,
  type Piece,
  SHIFT_Y,
} from "./kpiWorld";

export const FPS = 24000 / 1001;
export const DURATION = 90;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- timing (cut frames) --------------------------------------------------------------------------------
const T = {
  RISE: [-5, 12.5] as const, // the bar's one rise, rest to rest (already rising on f0)
  LIGHT_F: 5, // the light's front runs out from the contact over this many frames
  SEAM1: [28, 54] as const, // base | upper body: opens on "because of external", settled by "factors"
  TONE: [40, 54] as const, // the upper body cream -> board
  BUSTS: 30, // the team busts on the base (12 f entrance)
  MARKET: 43, // the market glyph + MARKET on "external"
  SEAM2: [65, 83] as const, // market | luck: opens through "because of luck", settled ~f83
  CLOVER: 70, // the clover on "because of luck"
  ENTER_F: 12,
} as const;
const RISE_B = 3;
const riseCurve = (t: number) => {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, RISE_B) * (1 + RISE_B * u);
};
const barH = (S: number) => STACK_H * riseCurve(winU(S, T.RISE[0], T.RISE[1]));
/** A lift envelope over a window: up to `peak` mid-window, rest at both ends. */
const liftEnv = (S: number, [a, b]: readonly [number, number], peak: number) => {
  const t = winU(S, a, b);
  return t <= 0 || t >= 1 ? 0 : peak * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 2);
};

// --- camera + light pool ---------------------------------------------------------------------------------
const CAM = makeClockCam(
  { x: TILE.X, y: 1210, k: 1.64 },
  [
    { f0: -12, f1: 46, k: 1.715, dy: -2 }, // in with the rise and the met line
    { f0: 30, f1: 130, k: 1.765, dy: -3 }, // the creep through the unstacking and the hold (runs past the end)
  ],
  DURATION,
);
const POOL = makePoolTrack(
  { x: TILE.X, y: TILE.TOP - 90 },
  [
    { f0: -4, f1: 16, x: TILE.X, y: LINE_Y + 120 }, // up with the bar
    { f0: 22, f1: 80, x: TILE.X, y: TILE.TOP - STACK_H * 0.48 }, // settles on the stack's middle
  ],
  DURATION,
);

// the contact frame: the bar's gap to the line under 1.5 screen px
const CONTACT_S = (() => {
  for (let s = T.RISE[0]; s <= T.RISE[1]; s += 0.05) if ((STACK_H - barH(s)) * CAM.at(Math.max(0, s)).k < 1.5) return s;
  return T.RISE[1];
})();
const litAt = (S: number) => LINE.HALF * easeOutCubic((S - CONTACT_S) / T.LIGHT_F);

/** The tile's print, counter-scaled in this close-up to a steady 52 SCREEN px (world-sized it would be ~75). */
const NAME_PX = 52;

const enterAt = (S: number, f0: number) => clamp01((S - f0) / T.ENTER_F);

/** The stack's pieces at frame S (merged where a seam is still shut). */
export const piecesAt = (S: number, k: number): Piece[] => {
  const h = barH(S);
  const top = TILE.TOP - h;
  const u1 = restToRest(winU(S, T.SEAM1[0], T.SEAM1[1]));
  const u2 = restToRest(winU(S, T.SEAM2[0], T.SEAM2[1]));
  const g1 = (GAP / 2) * u1;
  const g2 = (GAP / 2) * u2;
  const open1 = 2 * g1 * k > 0.3;
  const open2 = 2 * g2 * k > 0.3;
  const dim = smoothstep(winU(S, T.TONE[0], T.TONE[1]));
  const L1 = liftEnv(S, T.SEAM1, 0.3);
  const L2 = liftEnv(S, T.SEAM2, 0.3);
  const r1 = RADIUS * clamp01(u1 * 2);
  const r2 = RADIUS * clamp01(u2 * 2);
  const busts = (
    <FaceInk key="b" enter={enterAt(S, T.BUSTS)} k={k}>
      <TeamBusts cx={TILE.X} cy={FACE.BASE_CY} />
    </FaceInk>
  );
  const chartCy = FACE.MID_CY - (FACE.MARKET_GAP + FACE.MARKET_FS * 0.718) / 2;
  const market = (
    <FaceInk key="m" enter={enterAt(S, T.MARKET)} k={k}>
      <MarketGlyph cx={TILE.X} cy={chartCy} size={FACE.CHART} />
      <FaceWord cx={TILE.X} y={chartCy + (FACE.CHART * 0.68) / 2 + FACE.MARKET_GAP + FACE.MARKET_FS * 0.718} fs={FACE.MARKET_FS} text="Market" />
    </FaceInk>
  );
  const clover = (
    <FaceInk key="c" enter={enterAt(S, T.CLOVER)} k={k}>
      <CloverGlyph cx={TILE.X} cy={FACE.TOP_CY} size={FACE.CLOVER} />
    </FaceInk>
  );
  if (!open1 && !open2) {
    return [{ key: "bar", top, bot: TILE.TOP, rTop: RADIUS, rBot: 0, dim: 0, lift: liftEnv(S, T.RISE, 0.5), content: <>{busts}</> }];
  }
  const out: Piece[] = [];
  out.push({ key: "base", top: open1 ? SEAM1 + g1 : open2 ? SEAM2 + g2 : top, bot: TILE.TOP, rTop: open1 ? r1 : RADIUS, rBot: 0, dim: 0, lift: 0, content: <>{busts}</> });
  if (open1) {
    if (open2) {
      out.push({ key: "mid", top: SEAM2 + g2, bot: SEAM1 - g1, rTop: r2, rBot: r1, dim, lift: L1, content: <>{market}</> });
      out.push({ key: "top", top, bot: SEAM2 - g2, rTop: RADIUS, rBot: r2, dim, lift: L1 + L2, content: <>{clover}</> });
    } else {
      out.push({ key: "upper", top, bot: SEAM1 - g1, rTop: RADIUS, rBot: r1, dim, lift: L1, content: <>{market}{clover}</> });
    }
  } else {
    // (not reached: seam 2 never opens before seam 1)
    out.push({ key: "top", top, bot: SEAM2 - g2, rTop: RADIUS, rBot: r2, dim, lift: L2, content: <>{clover}</> });
  }
  return out;
};

const KpiMetByLuck: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const pieces = piecesAt(S, k);
  const lit = litAt(S);
  return (
    <StoutStage dy={SHIFT_Y} S={S} cam={cam} rest={CAM.rest} pool={POOL(S)}>
      <TargetLine k={k} lit={lit} band={band} flagTone={lit / LINE.HALF} />
      <StackShadows pieces={pieces} />
      <KpiTile k={k} namePx={NAME_PX} />
      {pieces.map((p) => (
        <PieceBody key={p.key} p={p} k={k} gradTop={LINE_Y} />
      ))}
    </StoutStage>
  );
};

export default KpiMetByLuck;

// --- load-time checks: every frame, every camera state (sway: +-3 x, +-5 y) ---------------------------------------
const SX = (c: Cam, wx: number) => 540 + (wx - c.x) * c.k;
const SY = (c: Cam, wy: number) => 960 + (wy - c.y) * c.k;
{
  const fail = (m: string) => {
    throw new Error(`KpiMetByLuck: ${m}`);
  };
  if (CONTACT_S + T.LIGHT_F > 17) fail(`the line is lit only by f${(CONTACT_S + T.LIGHT_F).toFixed(1)} (met f17)`);
  if (barH(T.SEAM1[0]) < STACK_H) fail("the seams open before the bar has landed");
  if (smoothstep(winU(T.TONE[0], T.TONE[0], T.TONE[1])) > 0 || T.TONE[0] <= T.SEAM1[0] + 2) fail("the tone must start after seam 1 is open");
  for (let S = 0; S < DURATION; S += 0.5) {
    const c = CAM.at(S);
    const ps = piecesAt(S, c.k);
    // pieces never overlap each other or sink into the tile
    for (let i = 0; i < ps.length; i++) {
      if (ps[i].bot > TILE.TOP + 1e-6 || ps[i].top > ps[i].bot) fail(`S${S}: piece ${ps[i].key} is malformed`);
      if (i > 0 && ps[i].bot > ps[i - 1].top + 1e-6) fail(`S${S}: ${ps[i].key} overlaps ${ps[i - 1].key}`);
    }
    // the stack's top never above the line
    if (Math.min(...ps.map((p) => p.top)) < LINE_Y - 1e-6) fail(`S${S}: the stack pokes through the line`);
    // keep-in box: the tile, the line + pennant
    if (SX(c, TILE_X0) - 3 < 65 || SX(c, TILE_X1) + 3 > 955) fail(`S${S}: the tile spans x ${SX(c, TILE_X0).toFixed(0)}-${SX(c, TILE_X1).toFixed(0)}`);
    if (SY(c, FLOOR) + 5 > 1068) fail(`S${S}: the tile's foot at y ${SY(c, FLOOR).toFixed(0)}`);
    if (SY(c, LINE_Y - FLAG.POLE) - 5 < 300) fail(`S${S}: the pennant's top at y ${SY(c, LINE_Y - FLAG.POLE).toFixed(0)}`);
    if (SX(c, TILE.X + LINE.HALF + 6 + FLAG.W) + 3 > 1005) fail(`S${S}: the pennant runs out of the box`);
    if (BAR_W * c.k < 180) fail(`S${S}: the bar is under 180 px wide`);
  }
}
