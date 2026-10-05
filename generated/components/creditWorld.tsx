import React from "react";
import {
  INK,
  INK_HI,
  INK_LO,
  DOT_R,
  Label,
  PAPER,
  RED,
  RED_HI,
  RED_WET,
  Seal,
  WetLine,
  FlagWorld,
  clamp01,
  easeOutCubic,
  enterFrom,
  evenEase,
  labelCapH,
  mixHex,
  paperShadow,
  rungAt,
  smoothstep,
  sz,
  textBlurPx,
  RISE_PX,
  enterU,
  inkDiffuse,
  worldBlur,
} from "./chinatalkShared";
import type { Cam } from "./chinatalkShared";
import {
  A1,
  BOOMS,
  BOOM_W,
  DIP_D,
  DIP_FLOOR_YEAR,
  E_LEFT_X,
  E_RECEDE_S,
  E_Y,
  FLAG_GAP_PX,
  FLAG_WORD_S,
  PX_PER_T,
  TICK2008_GROW_S,
  TICK2008_LABEL_S,
  TICK2008_RECEDE_S,
  TOWER_RISE1,
  TOWER_W,
  X,
  boomH,
  boomState,
  eLeftXAt,
  eLenAtYear,
  ePoints,
  eTipLen,
  eTipYear,
  eY,
  eYearAtLen,
  flagWorldW,
  sAtEYear,
  sAtTowerH,
  towerGrowing,
  towerT,
  towerX0,
} from "./creditGeom";

// ---------------------------------------------------------------------------
// creditWorld — the STANDING world as a function of the master clock S (builder
// A). Draws, in z-order: the past credit booms (ink pills, INK_LO, one union
// group), E (the economy line / time axis, written in wet ink), the tower
// (China's credit, RED, paper shadow, wet-ink gradient, bead while growing), the
// 2008 seal tick + "2008", the PRC flag riding the tower's top.
// Act 2 draws the same world and bends it through `over` (WorldOverride).
//
// Gestures (the words they serve; frames S):
//   E writes left -> right, wet bead tip ............ "after the global financial" S 0-21
//   E plunges into the 2008 V and climbs out ......... "crisis" S 21-44
//   seal tick + "2008" under the floor ............... "crisis" seal S 26-34, label lands S 35
//   E -> context rung as credit takes over ............ "credit" S 92-104
//   flag slides up at the dip's right lip ............ "China" S 33-45 (lands on 41)
//   booms rise in one wave, right -> left ............ "largest single country" S 56-88
//   tower shoots up, flag riding it ................... "credit expansion" S 86-124
//   rescales slide the booms together, stubs slide in
//     from beyond the frame's left edge, E running out
//     past it (stubs >= 24 screen px tall as they enter) "century" / "many centuries" S 172-232, back to era S 240-264
//   wet surge runs down the tower ..................... "bank assets" S 310-338
//   tower grows $25T -> $54T, bead + flag rising out
//     of the frame (the camera re-finds them) ......... "never seen anything remotely like this" S 374-430
//   travelling highlight runs up the tower ............ "there's a few aspects of that" S 440-486
//   (B2: Act 2's override diffuses the booms out like ink during the dive, S 449-477: `boomsDiffuse`)
// ---------------------------------------------------------------------------

export type WorldOverride = Partial<{
  /** E's tip year (default: eTipYear(S)) */
  eTipYear: number;
  /** E's ink rung (default: 0.90 -> 0.42 at S 92) */
  eRung: number;
  /** extra y offset (world px, down +) added to E at a year */
  eDy: (year: number) => number;
  /** E's tip bead opacity (default: by tip speed) */
  eBead: number;
  /** the tower's height in $T (default towerT(S)) */
  towerT: number;
  /** the tower's base fill (default RED); e.g. RED_DEEP */
  towerColor: string;
  /** extra wetness 0..1 at height h (world px above E) for Act 2 surges */
  towerWet: (h: number) => number;
  /** the S 446-486 travelling highlight (default true) */
  highlight: boolean;
  /** the flag (default true once it has entered) */
  flag: boolean;
  /** opacity multiplier of the booms (default 1) */
  boomsOpacity: number;
  /** B2: ink-diffusion progress 0..1 of the booms (each pill bleeds about its
   *  own centre while the group blurs and fades; gone at 1) */
  boomsDiffuse: number;
  /** the 2008 tick + label rung (default 0.90 -> 0.42 at S 58) */
  tick2008Rung: number;
}>;

/** The tower's outline: a slim pill standing on its base (flat foot, round top). */
export const towerPathD = (x0: number, w: number, base: number, h: number) => {
  const r = w / 2;
  if (h <= 0.01) return "";
  const ry = Math.min(r, h);
  const top = base - h;
  return `M${x0.toFixed(2)} ${base.toFixed(2)}L${x0.toFixed(2)} ${(top + ry).toFixed(2)}A${r.toFixed(2)} ${ry.toFixed(2)} 0 0 1 ${(x0 + w).toFixed(2)} ${(top + ry).toFixed(2)}L${(x0 + w).toFixed(2)} ${base.toFixed(2)}Z`;
};

// --- the surge and the highlight on the tower (Act 1 schedule) -------------------
const H25 = TOWER_RISE1.T * PX_PER_T;
/** S at which the surge front (top -> bottom of the $25T tower) passes height h. */
const surgePassS = (h: number) => {
  const target = 1 - clamp01(h / H25); // fraction of the way down
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (evenEase(mid, 0.2) < target) lo = mid;
    else hi = mid;
  }
  return A1.surge0 + (A1.surge1 - A1.surge0) * ((lo + hi) / 2);
};
const surgeWet = (h: number, S: number) => {
  if (S < A1.surge0 - 2 || S > A1.surge1 + 24 || h > H25 + 2) return 0;
  const d = S - surgePassS(h);
  if (d < -2) return 0;
  if (d < 0) return (d + 2) / 2;
  return 1 - smoothstep(d / 16);
};
const highlightAt = (h: number, S: number, H: number) => {
  if (S < A1.hi0 || S > A1.hi1) return 0;
  const u = (S - A1.hi0) / (A1.hi1 - A1.hi0);
  const hc = -250 + (H + 500) * evenEase(u, 0.25);
  return Math.exp(-Math.pow((h - hc) / 190, 2)) * smoothstep(u / 0.12) * smoothstep((1 - u) / 0.12);
};

const STOPS = 28;
const Tower: React.FC<{ S: number; k: number; T: number; base: string; extraWet?: (h: number) => number; highlight: boolean }> = ({
  S,
  k,
  T,
  base,
  extraWet,
  highlight,
}) => {
  const H = T * PX_PER_T;
  if (H <= 0.5) return null;
  const x0 = towerX0(S);
  const top = E_Y - H;
  const stops: React.ReactNode[] = [];
  for (let i = 0; i <= STOPS; i++) {
    const h = (H * i) / STOPS;
    const age = S - sAtTowerH(h);
    const grow = Number.isFinite(age) ? 1 - smoothstep(age / 18) : 0;
    const wet = Math.max(grow, surgeWet(h, S), extraWet ? extraWet(h) : 0);
    const hi = highlight ? highlightAt(h, S, H) : 0;
    let col = mixHex(base, RED_WET, wet);
    if (hi > 0.01) {
      const m = col.match(/\d+/g);
      const hex = m ? `#${m.map((v) => Number(v).toString(16).padStart(2, "0")).join("")}` : base;
      col = mixHex(hex, RED_HI, 0.9 * hi);
    }
    stops.push(<stop key={i} offset={(i / STOPS).toFixed(4)} stopColor={col} />);
  }
  const r = TOWER_W / 2;
  const grow = towerGrowing(S);
  const cx = x0 + r;
  return (
    <g>
      <defs>
        <linearGradient id="cw-tower-ink" gradientUnits="userSpaceOnUse" x1={0} y1={E_Y} x2={0} y2={top.toFixed(2)}>
          {stops}
        </linearGradient>
        <radialGradient id="cw-tower-bloom">
          <stop offset={0} stopColor={RED} stopOpacity={0.22} />
          <stop offset={0.45} stopColor={RED} stopOpacity={0.11} />
          <stop offset={1} stopColor={RED} stopOpacity={0} />
        </radialGradient>
      </defs>
      {grow > 0.01 ? (
        <circle cx={cx.toFixed(2)} cy={(top + r).toFixed(2)} r={(2.6 * r).toFixed(2)} fill="url(#cw-tower-bloom)" opacity={grow.toFixed(4)} />
      ) : null}
      <g style={{ filter: paperShadow(k) }}>
        <path d={towerPathD(x0, TOWER_W, E_Y, H)} fill="url(#cw-tower-ink)" />
      </g>
      {grow > 0.01 ? (
        <circle cx={(cx - 0.38 * r).toFixed(2)} cy={(top + 0.62 * r).toFixed(2)} r={(0.15 * r).toFixed(2)} fill={PAPER} opacity={(0.5 * grow).toFixed(4)} />
      ) : null}
    </g>
  );
};

/** A boom pill (flat foot on E, round top), world path. */
const pillD = (cx: number, w: number, base: number, h: number) => towerPathD(cx - w / 2, w, base, h);

/** E's tip bead opacity from its speed (world px / frame). */
const eBeadAt = (S: number) => smoothstep((eTipLen(S + 0.5) - eTipLen(S - 0.5) - 0.6) / 3);

export const CreditWorld: React.FC<{ S: number; cam: Cam; over?: WorldOverride }> = ({ S, cam, over = {} }) => {
  const k = cam.k;
  const out: React.ReactNode[] = [];

  // -- the booms: one union group at INK_LO (overlapping pills merge, never darken) --
  const pills: React.ReactNode[] = [];
  const bd = over.boomsDiffuse ?? 0;
  const dif = bd > 0 ? inkDiffuse(bd) : null;
  for (const b of BOOMS) {
    const st = boomState(b, S);
    if (st.rise <= 0.002) continue;
    const base = eY(b.year, S) + 3;
    const h = boomH(b) * st.rise;
    const d = pillD(st.x, BOOM_W, base, h);
    if (dif) {
      const sc = 1 + dif.spread;
      const cy = base - h / 2;
      pills.push(<path key={b.id} d={d} transform={`translate(${st.x.toFixed(2)} ${cy.toFixed(2)}) scale(${sc.toFixed(4)}) translate(${(-st.x).toFixed(2)} ${(-cy).toFixed(2)})`} />);
    } else pills.push(<path key={b.id} d={d} />);
  }
  const bo = (over.boomsOpacity ?? 1) * (dif ? dif.opacity : 1);
  if (pills.length && bo > 0.002) {
    out.push(
      <g key="booms" fill={INK} opacity={(INK_LO * bo).toFixed(4)} style={dif ? { filter: worldBlur(dif.blur, k) } : undefined}>
        {pills}
      </g>,
    );
  }

  // -- E: the economy line, written in wet ink --
  const tipYear = over.eTipYear ?? eTipYear(S);
  const pts = ePoints(S, tipYear, over.eDy);
  const eRung = over.eRung ?? rungAt(S, E_RECEDE_S, INK_HI, INK_LO);
  // (A3: E may run out past the frame's left edge, beyond 1985: offset the arc by that run-out)
  const runOut = E_LEFT_X - eLeftXAt(S);
  const ageAt = S < 170 && !over.eTipYear ? (s: number) => S - sAtEYear(eYearAtLen(s - runOut + eLenAtYear(1985))) : undefined;
  out.push(
    <WetLine key="E" id="cw-e" points={pts} k={k} ink rung={eRung} ageAt={ageAt} bead={over.eBead ?? eBeadAt(S)} />,
  );

  // -- the tower --
  const T = over.towerT ?? towerT(S);
  out.push(
    <Tower key="tower" S={S} k={k} T={T} base={over.towerColor ?? RED} extraWet={over.towerWet} highlight={over.highlight ?? true} />,
  );

  // -- the 2008 seal tick + "2008" under the dip floor --
  const tRung = over.tick2008Rung ?? rungAt(S, TICK2008_RECEDE_S, INK_HI, INK_LO);
  const fx = X(DIP_FLOOR_YEAR, S);
  const sealR = DOT_R * 0.62;
  const sealY = E_Y + DIP_D + 30 * sz(k);
  const sg = clamp01((S - TICK2008_GROW_S) / 8);
  if (sg > 0) out.push(<Seal key="t2008" x={fx} y={sealY} k={k} grow={sg} r={sealR} color={INK} opacity={tRung} />);
  const capV = labelCapH("value", k);
  out.push(
    <Label
      key="l2008"
      text="2008"
      x={fx}
      y={sealY + sealR * sz(k) + 14 * sz(k) + capV / 2}
      k={k}
      size="value"
      rung={tRung}
      appear={enterFrom(S, TICK2008_LABEL_S)}
    />,
  );

  // -- the flag: lands on "China" at the dip's right lip, then rides the tower's top --
  const fa = enterU(S, FLAG_WORD_S);
  if ((over.flag ?? true) && fa > 0) {
    const w = flagWorldW(k);
    const h = (w * 2) / 3;
    const top = E_Y - T * PX_PER_T;
    const lift = (1 - easeOutCubic(fa)) * (RISE_PX / k);
    const cx = towerX0(S) + TOWER_W / 2;
    out.push(
      <FlagWorld
        key="flag"
        id="cw-flag"
        x0={cx - w / 2}
        y0={top - (FLAG_GAP_PX + 30 * (1 - smoothstep((T * PX_PER_T) / 240))) / k - h + lift}
        w={w}
        k={k}
        opacity={smoothstep(fa)}
        blurPx={textBlurPx(fa, 0)}
      />,
    );
  }

  return <>{out}</>;
};

export { INK, PAPER };
