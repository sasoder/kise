// ---------------------------------------------------------------------------
// EuropeAlreadyTheirs (nik-revolut-ipo, cut 21). Cheeky Pint style (stout) in real 3D, the same slab world as cut 4
// (StillToLaunch: scott-nolan-uranium/nuclearWorld.tsx's NuclearStage + this clip's revolutWorld.tsx).
// Opaque 1080x1920, 23.976 fps, 61 frames. RENDER WITH --gl=angle.
//
// CHECK LINE: "In Europe Revolut is already established: the whole continent uses it, 1 in 5 adults."
//
// THE LINE (John Collison, host, right after the news card on Revolut's record $2.3bn profit): "…isn't Revolut a huge
// bank already with billions of dollars in profits, like you're plenty scaled already?"
// WORD -> FRAME (words.json, f = round((t - 21.605) x 24000/1001)): like -3 · you're 5 · plenty 13 · scaled 20 ·
//   already 37 · (Nik answers) Of 54 · course 66 (after the cut)
// DURATION: the slot 21.605 -> 24.149 s = 2.544 s x 23.976 = 61 frames (f0..f60).
//
// THE MOTION: one eased push-in with a slight crane down over the whole cut (europeAlreadyTheirsCam.ts), close on
// Europe, all of it board at f0. From f2 a cream wave leaves London and spreads country by country (by distance from
// London) over every market Revolut serves in Europe, each warming board -> cream and lifting a little out of the slab;
// the last (Cyprus) is lit by f25, just after "scaled" (f20): one solid lit continent. The stat then rises in the empty
// board above it: "1 in 5" (Numeral, the stout entrance, f24-37, settled on "already") and a cream card under it in ink,
// "ADULTS IN EUROPE / USE REVOLUT" (f28-40). The camera's slow tail and the grain keep the hold alive to the cut.
// Text lives in world space: both are pinned to a board point (the one under the numeral's baseline at f60) and scale
// with its depth, exactly the token size at f60.
// CREAM = where Revolut is today (as cut 4); BOARD = the rest. No amber: amber in this clip means "still to launch".
// Non-served neighbours (Russia, Belarus, Ukraine, Moldova, Turkey, the western Balkans outside the EU, North Africa)
// and Svalbard (outside the EEA) stay board.
//
// SOURCES (verified by the director, brief_EuropeAlreadyTheirs.md):
//  - served European markets (cream): EEA = EU 27 + Iceland, Liechtenstein, Norway; the United Kingdom; Switzerland.
//    Revolut 2025 annual results, 24 Mar 2026. The slab drops land under islandMin 1.2 sq units: Malta and
//    Liechtenstein are not drawn (too small to read here); Luxembourg and Cyprus are.
//  - "1 in 5": the same release: "Growth momentum was strong across Europe, where 1 in 5 working-age adults now use
//    Revolut." The label shortens it to "adults in Europe use Revolut" (the director's call).
//    https://www.revolut.com/en-AT/news/revolut_reports_record_profit_of_2_3bn_for_2025_as_revenue_surges_to_6bn/
//  - London (the wave's source): Revolut's headquarters.
//  - land: world-atlas countries-50m (Natural Earth) on the clip's tall Miller map (revolutGeo.projTall).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, Label, Numeral } from "../kits/cheeky-pint/stoutShared";
import { NuclearStage, type NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { project } from "./revolutGeo";
import { RevolutWorld, useRevolutBoard, type CountryTone } from "./revolutWorld";
import { DURATION as CAM_DURATION, EU_CENTRES, WAVE, WAVE_LEN, camAt } from "./europeAlreadyTheirsCam";

export const FPS = 24000 / 1001;
export const DURATION = 61;
export const schema = z.object({});
export const defaultProps = schema.parse({});
if (CAM_DURATION !== DURATION) throw new Error("EuropeAlreadyTheirs: camera track length differs from DURATION");

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - c01(t), 3);

// the board and islands as StillToLaunch; the fog is closer (the far north recedes into the ground)
const FOG: [number, number] = [1.25, 1.45];
const BOARD_UNITS = 560;
const ISLAND_MIN = 1.2;
/** the small lift of a lit market, in WORLD_SLAB.RAISE (2.6 units on a 3.4 slab) */
const LIFT = 0.32;

const tonesAt = (f: number): Record<string, CountryTone> => {
  const t: Record<string, CountryTone> = {};
  for (const c of Object.keys(EU_CENTRES)) {
    // ease-out: a country starts warming visibly on the frame the front reaches it, then settles
    const u = 1 - Math.pow(1 - c01((f - WAVE[c]) / WAVE_LEN), 2);
    t[c] = { cream: u, lift: LIFT * u };
  }
  return t;
};

// --- the stat: pinned to a board point, scaled by its depth ----------------------------------------------------------
const D2R = Math.PI / 180;
/** the board point (Y = 0) under screen (x, y) for camera c */
const boardUnder = (c: NuclearCam, x: number, y: number): [number, number, number] => {
  const sy = Math.sin(c.yaw * D2R);
  const cy = Math.cos(c.yaw * D2R);
  const sp = Math.sin(c.pitch * D2R);
  const cp = Math.cos(c.pitch * D2R);
  const e = [c.tx - sy * cp * c.d, c.ty + sp * c.d, c.tz - cy * cp * c.d];
  const fw = [sy * cp, -sp, cy * cp];
  const rt = [cy, 0, -sy];
  const up = [sy * sp, cp, cy * sp];
  const a = (x - c.cx) / c.f;
  const b = (y - c.cy) / c.f;
  const dir = [0, 1, 2].map((i) => fw[i] + a * rt[i] - b * up[i]);
  const t = -e[1] / dir[1];
  return [e[0] + t * dir[0], 0, e[2] + t * dir[2]];
};
const STAT_X = 540;
const STAT_BASE = 418;
const NUM_PX = 200; // a little over HERO (184), as the brief allows
const LAB_PX = 46; // LABEL (30) is tiny on a phone: the label goes in a cream card, in ink, larger (style file)
const CARD = { w: 560, h: 140, gap: 28, r: 10, line: 56 };
const REF = camAt(DURATION - 1);
const ANCHOR = boardUnder(REF, STAT_X, STAT_BASE);
const S_REF = project(REF, ANCHOR).s;
/** onsets: the numeral settles on "already" (f37), the card a moment after it */
const NUM_IN: [number, number] = [24, 37];
const CARD_IN: [number, number] = [28, 40];

const Stat: React.FC<{ cam: NuclearCam; f: number }> = ({ cam, f }) => {
  const p = project(cam, ANCHOR);
  const m = p.s / S_REF;
  const numEnter = c01((f - NUM_IN[0]) / (NUM_IN[1] - NUM_IN[0]));
  const cardEnter = c01((f - CARD_IN[0]) / (CARD_IN[1] - CARD_IN[0]));
  const ce = easeOutCubic(cardEnter);
  const cw = CARD.w * m;
  const ch = CARD.h * m;
  const cx = p.x - cw / 2;
  const cyTop = p.y + CARD.gap * m + (1 - ce) * 24;
  const cr = CARD.r * m;
  const lab = LAB_PX * m;
  const l1 = cyTop + (CARD.h / 2 - CARD.line / 2 + 0.718 * LAB_PX * 0.5) * m;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <Numeral x={p.x} y={p.y} k={1} px={NUM_PX * m} text="1 in 5" tone="cream" enter={numEnter} />
      {ce > 0.002 ? (
        <g opacity={ce} style={{ filter: cardEnter < 1 ? `blur(${(6 * (1 - ce)).toFixed(2)}px)` : undefined }}>
          {/* one shadow, from the key light above and a little left */}
          <rect x={cx + 6 * m} y={cyTop + 12 * m} width={cw} height={ch} rx={cr} fill={COLOR.shadow} opacity={0.42} style={{ filter: `blur(${(14 * m).toFixed(2)}px)` }} />
          <rect x={cx} y={cyTop} width={cw} height={ch} rx={cr} fill={COLOR.cream} />
          <Label x={p.x} y={l1} k={1} px={lab} text="Adults in Europe" tone="dark" />
          <Label x={p.x} y={l1 + CARD.line * m} k={1} px={lab} text="use Revolut" tone="dark" />
        </g>
      ) : null}
    </svg>
  );
};

const EuropeAlreadyTheirs: React.FC<z.infer<typeof schema>> = () => {
  useRevolutBoard();
  const f = useCurrentFrame();
  const cam = camAt(f);
  return (
    <NuclearStage
      cam={cam}
      S={f + 1300}
      fog={FOG}
      boardUnits={BOARD_UNITS}
      floor={false}
      pool={{ x: 560, y: 760, strength: 1 }}
      world={<RevolutWorld cam={cam} tones={tonesAt(f)} boardUnits={BOARD_UNITS} fog={FOG} islandMin={ISLAND_MIN} />}
      overlay={<Stat cam={cam} f={f} />}
    />
  );
};

export default EuropeAlreadyTheirs;
