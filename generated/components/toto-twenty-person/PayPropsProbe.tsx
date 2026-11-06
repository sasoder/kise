import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { StoutStage } from "../kits/cheeky-pint/stoutShared";
import { PayProps, payBox } from "./payProps";

// ---------------------------------------------------------------------------
// PayPropsProbe — stills of cut 20's SALARY and BONUS props (payProps.tsx) alone on the stout board: the entrance
// stages (salary half in / settled; bonus envelope in; coins landing; all settled; mirrored), and one hero at a phone
// reading size. Probe only: never delivered. k = 1 (world = screen).
// ---------------------------------------------------------------------------
export const FPS = 25;
export const DURATION = 1;
export const VIEWS = ["sheet", "hero"] as const;
export const schema = z.object({ view: z.enum(VIEWS) });
export const defaultProps = schema.parse({ view: "sheet" });

const CAM = { x: 540, y: 960, k: 1 };
type Inst = { x: number; y: number; scale: number; side: 1 | -1; salary: number; bonus: number };
const SHEET: Inst[] = [
  { x: 120, y: 470, scale: 0.72, side: 1, salary: 0.45, bonus: 0 },
  { x: 470, y: 470, scale: 0.72, side: 1, salary: 1, bonus: 0 },
  { x: 820, y: 470, scale: 0.72, side: 1, salary: 1, bonus: 0.3 },
  { x: 120, y: 820, scale: 0.72, side: 1, salary: 1, bonus: 0.6 },
  { x: 470, y: 820, scale: 0.72, side: 1, salary: 1, bonus: 0.8 },
  { x: 820, y: 820, scale: 0.72, side: 1, salary: 1, bonus: 1 },
  { x: 900, y: 1180, scale: 0.72, side: -1, salary: 1, bonus: 1 },
  { x: 230, y: 1180, scale: 0.72, side: 1, salary: 1, bonus: 1 },
];
const HERO_SCALE = 1.12; // ~335 px wide at k 1: the director's phone size (300-340 px, words cap >= 24 px)
const heroX = () => {
  const b = payBox(0, 0, HERO_SCALE, 1, true);
  return 540 - (b.x0 + b.x1) / 2;
};

const PayPropsProbe: React.FC<z.infer<typeof schema>> = ({ view }) => {
  const list: Inst[] = view === "sheet" ? SHEET : [{ x: heroX(), y: 1100, scale: HERO_SCALE, side: 1, salary: 1, bonus: 1 }];
  return (
    <AbsoluteFill>
      <StoutStage S={0} cam={CAM} pool={{ x: 540, y: view === "sheet" ? 800 : 1000, strength: 1.4 }} sway={false}>
        {list.map((p, i) => (
          <PayProps key={i} k={CAM.k} {...p} />
        ))}
      </StoutStage>
    </AbsoluteFill>
  );
};
export default PayPropsProbe;
