// ---------------------------------------------------------------------------
// burdenProbe (sarah-gulf-war): probe stills of the shared burdenWorld.tsx (owner: cut 69 SmallPotatoes).
//   mode "icons": the soldier's gait phases and the bundle, large, on the air (a style check of the paint)
//   mode "end":   the world at cut 69's last frame (f86), exactly as SmallPotatoes draws it
//   mode "cash":  a cash-stack test on the end camera: a "$50B+" stack of bundles (4 across) building over the US block
//                 (two bundles mid-fall) and a "+$14B" stack (2 across) over the allies, with their plates (cuts 74 / 80 to decide)
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, Paint, WorldSvg, swayCam, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { ALLIES, BUNDLE_H, BurdenDefs, BurdenPlate, CUT69_LEN, CashCanvas, GAIT_PHASES, PLATE_TOP, REST_CAM, TroopCanvas, US, burdenAirOf, camAt, drainAt, planCash, stackTop, troopOptsAt, useBurdenSprites, type CashSpec } from "./burdenWorld";

export const FPS = 24;
export const DURATION = 1;
export const schema = z.object({ mode: z.enum(["icons", "end", "cash"]).default("end") });
export const defaultProps = schema.parse({});

const END_F = CUT69_LEN - 1;

const Icons: React.FC = () => {
  const get = useBurdenSprites();
  const cam: Cam = { k: 1, cx: 540, cy: 960 };
  const { v } = burdenAirOf(cam, cam, 0);
  return (
    <AirStage v={v} bloom={0.22} motes={0}>
      <Paint.FolkCanvas
        draw={(ctx) => {
          ctx.imageSmoothingQuality = "high";
          // phases 0, 3, 5, 8, 10, 13, 15 at 240 px; then the drawn sizes 66 / 50 / 33 px; the bundle
          [0, 3, 5, 8, 10, 13, 15].forEach((p, i) => Paint.blitFolk(ctx, get(`burden-soldier-v5-p${p}`), 90 + (i % 4) * 300, 520 + Math.floor(i / 4) * 330, 240));
          [125, 112, 70].forEach((h, i) => [0, 5, 10].forEach((p, j) => Paint.blitFolk(ctx, get(`burden-soldier-v5-p${p}`), 100 + i * 330 + j * 90, 1340, h)));
          Paint.blitFolk(ctx, get("burden-bundle-v3"), 300, 1600, 80);
          Paint.blitFolk(ctx, get("burden-bundle-v3"), 760, 1600, 36.75);
          Paint.blitFolk(ctx, get("burden-bundle-v3"), 760, 1700, 36.75 * 0.625);
        }}
      />
    </AirStage>
  );
};
void GAIT_PHASES;

const World: React.FC<{ cash: boolean }> = ({ cash }) => {
  useCurrentFrame();
  const get = useBurdenSprites();
  const wf = END_F;
  const cam = swayCam(camAt(wf), wf);
  const { v } = burdenAirOf(cam, REST_CAM, wf);
  const o = troopOptsAt(wf, v);
  const dim = 0.25 * drainAt(wf);
  // a test stack over the US block: 6 across, built up to 84 bundles (one mid-fall), from above the frame top
  const big: CashSpec = { cx: US.cx, baseY: 0, cols: 4, n: 64, landAt: (i) => i * 0.6, fall: 8, fromY: cam.cy - 1100 / cam.k };
  const small: CashSpec = { cx: ALLIES.cx, baseY: 0, cols: 2, n: 10, landAt: (i) => i * 3, fall: 8, fromY: cam.cy - 1100 / cam.k };
  const tBig = 36.4;
  const bigB = cash ? planCash(big, tBig) : [];
  const smallB = cash ? planCash(small, 34) : [];
  return (
    <AirStage v={v} bloom={0.22}>
      <TroopCanvas cam={cam} wf={wf} get={get} o={o} />
      {cash ? <CashCanvas cam={cam} get={get} bundles={[...smallB, ...bigB]} /> : null}
      <WorldSvg cam={cam}>
        <BurdenDefs uid="pr" />
        <BurdenPlate uid="pr" x={ALLIES.cx} y={PLATE_TOP} name="Allies" num="200,000+" o={1} lift={0} dim={dim} />
        <BurdenPlate uid="pr" x={US.cx} y={PLATE_TOP} name="U.S." num="700,000" o={1} lift={0} dim={dim} />
        {cash ? <BurdenPlate uid="pr" x={US.cx} y={stackTop(big, 64) - 300} name="Paid by allies" num="$50B+" o={1} lift={0} tone="cash" /> : null}
        {cash ? <BurdenPlate uid="pr" x={ALLIES.cx} y={stackTop(small, 10) - 240} name="Partners" num="+$14B" o={1} lift={0} tone="cash" /> : null}
      </WorldSvg>
    </AirStage>
  );
};
void BUNDLE_H;

const BurdenProbe: React.FC<z.infer<typeof schema>> = ({ mode }) => (mode === "icons" ? <Icons /> : <World cash={mode === "cash"} />);
export default BurdenProbe;
