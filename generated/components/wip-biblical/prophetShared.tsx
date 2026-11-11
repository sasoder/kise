// ---------------------------------------------------------------------------
// prophetShared (wip-biblical): the Doré prophets and the indigo century rule. Owned by cut 0 (NewStageForetold); cut 86
// (ProphetsPointedHere) returns to them. Exports stay stable once reported; additions get NEW names and a line in
// animation_source/notes/SHARED_CHANGES.md.
//
//   PROPHETS            the processed cut-outs in public/wip-biblical/pr_<name>.png, with their aspect, the way the
//                       figure faces as engraved, whether it may be mirrored, and its landmarks (head, hand) as
//                       fractions of the PNG, so a cut can aim at a raised hand or set heads in a line.
//   ProphetCutOut       one prophet on the page: asset name, height, facing, anchored at his feet (x, footY).
//   prophetLandmark     where a landmark of a placed prophet lands in plane px (mirroring included).
//   CenturyRule         the printed indigo rule with one small tick per century (put it on an `ink` WipPlane).
//   centuryTickX        x of tick i on a rule.
//
// Sources and processing: the header of NewStageForetold.tsx.
// ---------------------------------------------------------------------------
import React from "react";
import { CutOut, INDIGO, InkPrint } from "../kits/works-in-progress/wipShared";

export type Facing = "left" | "right";
export type ProphetAsset = {
  /** public/ path */
  src: string;
  /** width / height of the PNG */
  aspect: number;
  /** which way the figure faces (or points) as engraved */
  facing: Facing;
  /** true when the engraving holds no lettering, so it may be mirrored */
  mirrorOk: boolean;
  /** landmarks as fractions of the PNG (0..1, unmirrored): the top of the head, the raised hand's tip, the feet */
  head: [number, number];
  hand: [number, number];
  feet: [number, number];
  /** who and which plate, for headers */
  note: string;
};

// The processed engravings: scripts/clips/wip-biblical/bake-prophets-0.py (Vision fg matte inside a hand-drawn polygon
// round the one prophet, then bake-photo.py's grade). Plates: Gustave Doré, La Sainte Bible (Tours: Mame, 1866), PD;
// the BnF copy of tome 2 scanned by Gallica, via Internet Archive bnf-bpt6k10443187
// (assets_raw/prophets/, page numbers below). Landmarks measured on the baked PNGs.
// `hand` is where a line to the thing he looks at should leave him: the raised fingertip for the pointers, the eyes for
// the gazers (John), the hands for the bowed heads (Daniel, Amos).
export const PROPHETS: Record<string, ProphetAsset> = {
  ezekiel: {
    src: "wip-biblical/pr_ezekiel.png",
    aspect: 0.5964,
    facing: "right",
    mirrorOk: true,
    head: [0.569, 0.1173],
    hand: [0.9314, 0.0409],
    feet: [0.434, 0.9645],
    note: "Ezekiel prophesying, standing, right arm raised pointing up to the right; print cut at the shins (BnF t2 p0064)",
  },
  jeremiah: {
    src: "wip-biblical/pr_jeremiah.png",
    aspect: 0.66,
    facing: "right",
    mirrorOk: true,
    head: [0.4629, 0.1094],
    hand: [0.9242, 0.0418],
    feet: [0.7396, 0.9591],
    note: "Jeremiah, flung forward on the steps, right arm thrown up to the right (BnF t2 p0040)",
  },
  john: {
    src: "wip-biblical/pr_john.png",
    aspect: 0.8791,
    facing: "left",
    mirrorOk: true,
    head: [0.5395, 0.0328],
    hand: [0.5311, 0.1226],
    feet: [0.2667, 0.9655],
    note: "Saint John on Patmos, seated on his rock with tablet and pen, gazing up (left as engraved) (BnF t2 p0654)",
  },
  daniel: {
    src: "wip-biblical/pr_daniel.png",
    aspect: 0.6218,
    facing: "right",
    mirrorOk: false,
    head: [0.6556, 0.0307],
    hand: [0.0711, 0.4175],
    feet: [0.7013, 0.9682],
    note: "Daniel, standing, head bowed, a written scroll in his hand (lettering: never mirror) (BnF t2 p0076)",
  },
  amos: {
    src: "wip-biblical/pr_amos.png",
    aspect: 0.5273,
    facing: "right",
    mirrorOk: true,
    head: [0.5655, 0.0303],
    hand: [0.7508, 0.2465],
    feet: [0.4106, 0.9682],
    note: "Amos, standing on the hill with his staff, head bowed (BnF t2 p0124)",
  },
};

/** The paper border round every prophet print, in world px at a 600 px tall figure (scaled with the height). */
export const PROPHET_BORDER_AT_600 = 7;

/** Where a landmark of a prophet placed with ProphetCutOut lands, in its plane's px. */
export const prophetLandmark = (
  name: string,
  x: number,
  footY: number,
  height: number,
  facing: Facing,
  which: "head" | "hand" | "feet",
) => {
  const a = PROPHETS[name];
  if (!a) throw new Error(`prophetLandmark: no prophet "${name}"`);
  const w = height * a.aspect;
  const flip = facing !== a.facing;
  const fx = flip ? 1 - a[which][0] : a[which][0];
  const left = x - w / 2;
  const top = footY - a.feet[1] * height;
  return { x: left + fx * w, y: top + a[which][1] * height };
};

/**
 * One prophet print lying on the page: the kit's CutOut (one grade, hand-cut paper border, soft low contact shadow).
 * (x, footY) = the middle of the PNG's width at the height of his feet; `height` = the PNG's height in world px.
 * `facing` mirrors the print when it differs from the engraving's own facing; mirroring a print with lettering throws.
 * `lift` 0 flat .. 1 carried (a slide's shadow).
 */
export const ProphetCutOut: React.FC<{
  name: string;
  x: number;
  footY: number;
  height: number;
  facing?: Facing;
  lift?: number;
  border?: number;
  shadow?: number;
  seed?: string;
}> = ({ name, x, footY, height, facing, lift = 0, border, shadow = 1, seed }) => {
  const a = PROPHETS[name];
  if (!a) throw new Error(`ProphetCutOut: no prophet "${name}"`);
  const want = facing ?? a.facing;
  const flip = want !== a.facing;
  if (flip && !a.mirrorOk) throw new Error(`ProphetCutOut: "${name}" carries lettering and may not be mirrored`);
  const w = height * a.aspect;
  const top = footY - a.feet[1] * height;
  return (
    <CutOut
      src={a.src}
      x={x}
      y={top + height / 2}
      w={w}
      aspect={a.aspect}
      flipX={flip}
      border={border ?? (PROPHET_BORDER_AT_600 * height) / 600}
      lift={lift}
      shadow={shadow}
      gamma={1}
      grain={0.11}
      seed={seed ?? `prophet-${name}`}
    />
  );
};

// -- the century rule ---------------------------------------------------------------------------------------------
/** Default look, at the cut-0 scale (2,000 years over about 420 world px). */
export const RULE_WEIGHT = 3.4;
export const RULE_TICK = 13;
export const RULE_CENTURIES = 20;

/** x of tick i (0 = the rule's left end, n = its right end) on a rule from x0 to x1 with n centuries. */
export const centuryTickX = (x0: number, x1: number, i: number, n = RULE_CENTURIES) => x0 + ((x1 - x0) * i) / n;

/**
 * The printed indigo rule: a straight line from x0 to x1 at height y, with one small tick hanging below it at every
 * century boundary 1..n (the left end, n centuries ago, stays bare: a finger or a figure meets it there). `endTick`
 * makes the right end's tick (today) a little taller. Put it on an `ink` WipPlane: it multiplies into the paper.
 * Optional (added after the first report; the defaults draw exactly what they drew before):
 *   `span`   the centuries the whole rule covers (default n): tick i sits at i / span of the length, so a rule from AD 1 to
 *            2026 is span 20.25 with its 2000 tick just short of the right end.
 *   `major`  every major-th tick is `majorTick` times as tall (default 0: none). 5 = every five centuries.
 *   `misregister` the ink's second strike (default 0.9 world px).
 */
export const CenturyRule: React.FC<{
  x0: number;
  x1: number;
  y: number;
  n?: number;
  weight?: number;
  tick?: number;
  endTick?: number;
  ink?: string;
  seed?: string;
  span?: number;
  major?: number;
  majorTick?: number;
  misregister?: number;
}> = ({
  x0,
  x1,
  y,
  n = RULE_CENTURIES,
  weight = RULE_WEIGHT,
  tick = RULE_TICK,
  endTick = 1.6,
  ink = INDIGO,
  seed = "century-rule",
  span,
  major = 0,
  majorTick = 1.9,
  misregister = 0.9,
}) => {
  const pad = 20;
  const len = x1 - x0;
  const sp = span ?? n;
  const tallest = tick * Math.max(endTick, major > 0 ? majorTick : 1);
  const w = len + 2 * pad;
  const h = tallest + weight + 2 * pad;
  return (
    <InkPrint x={x0 - pad} y={y - weight / 2 - pad} w={w} h={h} ink={ink} seed={seed} rough={0.9} wear={0} tile={1.6} misregister={misregister}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`translate(${pad} ${pad + weight / 2})`}>
          <rect x={0} y={-weight / 2} width={len} height={weight} fill="currentColor" />
          {Array.from({ length: n }, (_, k) => {
            const i = k + 1;
            const tx = (len * i) / sp;
            const isMajor = major > 0 && i % major === 0;
            const th = tick * Math.max(i === n && sp === n ? endTick : 1, isMajor ? majorTick : 1);
            const tw = weight * (isMajor ? 0.9 : 0.72);
            return <rect key={i} x={Math.min(len - tw, tx - tw / 2)} y={0} width={tw} height={th} fill="currentColor" />;
          })}
        </g>
      </svg>
    </InkPrint>
  );
};
