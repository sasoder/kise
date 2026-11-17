// ---------------------------------------------------------------------------
// GrewSixtyToEighty (nik-detecting-bullshit, cut 32). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 102 frames. Palette B1 (the stoutShared default).
// World: ./wealthWorld.tsx (shared with cut C, which opens on this cut's last frame, S = 101).
//
// CHECK LINE: "Revolut's wealth & trading product grew by about 60–80 % in a year — this year's bar is under
// twice last year's."
//
// THE LINE (sequence 32.407-36.662 s): "I think two or three years ago it grew 60 or 80% year on year"
// WORD -> FRAME: think f7 · two f10 · or f16 · three f19 · years f21 · ago f27 · it f32 · grew f40 · up f45 ·
// 60 % f50 · or f62 · 80 % f66 · year f75 · on f81 · year f83 · (ends ~f86) · and f88 · slot ends f102.
// DURATION: the slot 32.407 -> 36.662 s = 4.255 s x 23.976 = 102 frames (f0..f101).
//
// THE MOTION (rev 2: one centred, symmetric composition shared with cut C): one wide cream product tile
// centred on x 540, three symmetric slots on its top (last year left, this year centre, C's right); on its
// face one centred row: a recessed window holding the product team as three picture-book busts (board-tone
// kraft, big round heads, flat fills, no outlines or shadows), the Revolut R stamped in ink, WEALTH & TRADING.
// The camera stays on x 540; it is already drifting in on f0 and tilts up with the bars in one eased glide
// (k 1.85 -> 1.98, max 1.7 px/f; tile top ends y ~782, foot y ~893).
// Last year's cream bar rises out of the left slot to 1.0 unit (f-4..26, already emerging on f0, one
// decelerating curve, its shadow lifted mid-rise, at rest on landing); then this year's bar rises out of the
// centre slot in ONE continuous rise (f32-66): cream up to last year's height (~f47), and on above it as an
// AMBER slice, the growth itself, to 1.7 units, landing on "80" (f66) and just settling (no light sweep: the
// clip saves its one click for cut C's +300 %). "+60–80%" (the speaker's own range, amber Dreiviertelfett at a
// fixed 80 screen px, the size cut C keeps it at) blurs in and slides up, centred over the centre bar, f56-68.
// Then a living hold (camera creep, light pool, sway, grain); the right slot stays empty and dark (cut C's).
// Contacts: each bar is in its slot from its first frame (it emerges from the open pocket, which closes to
// the joint line over its first 6 screen px); the amber starts where the bar's top passes last year's height.
// AMBER = growth / the KPI going up (COMMON.md): the +0.7 slice and its label. Cream = the subject (the
// product, its bars), board = context (the team).
//
// SOURCES: the figures are the speaker's own statement about his company ("60 or 80 %", year on year, "two
// or three years ago"), on screen as he says them; no other number. Director's data note
// (animation_source/notes/revolut_wealth_data.md, Revolut annual reports): no reported year matches 60-80 %
// exactly — 2023 Wealth grew ~+47 % on a derived 2022 base; 2024 +298 % (CFO review, 2024 annual report,
// p13). So "60–80 %" is his recollection, on screen as his words (flagged in the hand-off). Revolut R: revolutMark.ts (Commons
// "File:Revolut_logo.svg", public-domain text logo), redrawn as an ink stamp.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, amberBandFor, clamp01 } from "../kits/cheeky-pint/stoutShared";
import {
  B_CAM,
  B_DURATION,
  B_LAST_S,
  B_POOL,
  B_T,
  FPS as WORLD_FPS,
  FACE_MAX_Y,
  KEEP_IN,
  SX,
  SY,
  TEAM_OLD,
  TILE,
  TILE_X0,
  TILE_X1,
  FLOOR,
  WEALTH_REST,
  WealthBoard,
  BLabel,
  bBarSpecs,
  bBars,
  labelBox,
  SHIFT_Y,
} from "./wealthWorld";

export const FPS = 24000 / 1001;
export const DURATION = 102;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ENTER_F = 12;

const GrewSixtyToEighty: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = B_CAM.at(S);
  const k = cam.k;
  const band = amberBandFor(cam);
  const bars = bBarSpecs(S);
  return (
    <StoutStage dy={SHIFT_Y} S={S} cam={cam} rest={WEALTH_REST} pool={B_POOL(S)}>
      <WealthBoard k={k} band={band} bars={bars} team={TEAM_OLD} />
      <BLabel k={k} enter={clamp01((S - B_T.LABEL_IN) / ENTER_F)} />
    </StoutStage>
  );
};

export default GrewSixtyToEighty;

// --- load-time checks: every frame, every camera state -------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`GrewSixtyToEighty: ${m}`);
  };
  if (DURATION !== B_DURATION || FPS !== WORLD_FPS) fail("DURATION / FPS differ from wealthWorld's");
  for (let S = 0; S <= B_LAST_S; S++) {
    const c = B_CAM.at(S);
    const b = bBars(S);
    // the tile (and its face) wholly inside the keep-in box, clear of the right button column below y 900
    const tx0 = SX(c, TILE_X0);
    const tx1 = SX(c, TILE_X1);
    if (tx0 < KEEP_IN.x0 || tx1 > 955) fail(`S${S}: the tile spans x ${tx0.toFixed(0)}-${tx1.toFixed(0)}`);
    if (Math.abs(tx0 + tx1 - 1080) > 0.5) fail(`S${S}: the tile is off the centre line`);
    if (SY(c, FLOOR) > FACE_MAX_Y) fail(`S${S}: the tile face ends at y ${SY(c, FLOOR).toFixed(0)} (max ${FACE_MAX_Y})`);
    // the bars' tops inside it
    if (SY(c, TILE.TOP - Math.max(b.last, b.now)) < KEEP_IN.y0) fail(`S${S}: a bar's top above the keep-in box`);
    // the label, once it is entering: inside the box, and clear of this year's bar top (>= 16 px)
    if (S >= B_T.LABEL_IN) {
      const L = labelBox(c);
      if (L.x0 < KEEP_IN.x0 || L.x1 > KEEP_IN.x1 || L.y0 - 24 < KEEP_IN.y0) fail(`S${S}: the label's box ${L.x0.toFixed(0)}-${L.x1.toFixed(0)} / ${L.y0.toFixed(0)}`);
      const barTop = SY(c, TILE.TOP - b.now);
      if (barTop - L.y1 < 16) fail(`S${S}: the label sits ${(barTop - L.y1).toFixed(1)} px over the rising bar`);
    }
  }
}
