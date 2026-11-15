// ---------------------------------------------------------------------------
// brainProbe (rsi-stupidest-species, W3): probe sheets for brainShared (the Brain and the Pelvis) in the clip's air.
// Not a cut. sheet: "sizes" (60 / 200 / 500 px) | "glow" (0 / 0.5 / 1) | "swell" (0 / 0.5 / 1, a squash) |
// "variants" (v0 and v1 side by side, large and small) | "pelvis" (the pelvis, and a brain stuck in its inlet).
// Render: src/Root.RsiBrainProbe.tsx (bunx remotion still ... RsiBrainProbe --props='{"sheet":"glow"}').
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, WorldSvg, airWorldOf, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { BRAIN_ASPECT, Brain, BrainShadow, Pelvis, pelvisInlet } from "./brainShared";

export const FPS = 24000 / 1001;
export const DURATION = 24;
export const schema = z.object({ sheet: z.enum(["sizes", "glow", "swell", "variants", "pelvis"]).default("sizes") });
export const defaultProps = schema.parse({});

const DEPTH: DepthOpts = { eyeY: 200, dRef: 1800, kRef: 1, dolly: 0.5 };
const CAM = { cx: 540, cy: 960, k: 1 };

/** a soft cream shelf the brains stand on (screen px) */
const Shelf: React.FC<{ y: number; x0: number; x1: number }> = ({ y, x0, x1 }) => <rect x={x0} y={y} width={x1 - x0} height={10} rx={5} fill="#6F5D44" opacity={0.75} />;

const BrainProbe: React.FC<z.infer<typeof schema>> = ({ sheet }) => {
  const frame = useCurrentFrame();
  const A = airWorldOf({ cam: CAM, rest: CAM, depth: DEPTH, frame });
  const els: React.ReactNode[] = [];
  const stand = (key: string, x: number, y: number, size: number, p: Partial<React.ComponentProps<typeof Brain>> = {}) => {
    els.push(
      <g key={key}>
        <BrainShadow x={x} y={y} size={size} uid={`${key}s`} />
        <Brain x={x} y={y} size={size} uid={key} {...p} />
      </g>,
    );
  };
  if (sheet === "sizes") {
    els.push(<Shelf key="sh" y={1100} x0={80} x1={1000} />);
    stand("b60", 150, 1100, 60);
    stand("b200", 340, 1100, 200);
    stand("b500", 730, 1100, 500);
    stand("b60g", 150, 760, 60, { glow: 1 });
    stand("b200g", 340, 760, 200, { glow: 1, variant: 1 });
  }
  if (sheet === "glow") {
    [0, 0.5, 1].forEach((g, i) => {
      const y = 620 + i * 430;
      els.push(<Shelf key={`sh${i}`} y={y} x0={300} x1={780} />);
      stand(`g${i}`, 540, y, 380, { glow: g });
    });
  }
  if (sheet === "swell") {
    [0, 0.5, 1].forEach((s, i) => {
      const y = 560 + i * 430;
      stand(`s${i}`, 330, y, 230, { swell: s, glow: 0.4 * s });
    });
    stand("sq0", 800, 760, 230, { swell: 0.8, squashX: 1.14, squashY: 0.84 });
    stand("sq1", 800, 1340, 230, { swell: 0.8, squashX: 0.86, squashY: 1.14, pivot: "center" });
  }
  if (sheet === "variants") {
    els.push(<Shelf key="sh" y={900} x0={80} x1={1000} />);
    stand("v0", 300, 900, 380, { variant: 0 });
    stand("v1", 780, 900, 380, { variant: 1 });
    els.push(<Shelf key="sh2" y={1350} x0={300} x1={780} />);
    stand("w0", 455, 1350, 140, { variant: 0 });
    stand("w1", 625, 1350, 140, { variant: 1 });
  }
  if (sheet === "pelvis") {
    const pc: [number, number] = [540, 1180];
    const PS = 720;
    const inl = pelvisInlet(PS);
    els.push(<Pelvis key="pb" x={pc[0]} y={pc[1]} size={PS} uid="pb" part="back" />);
    // a brain too big for the opening: squashed into the inlet, its lower half behind the front rim
    const bs = inl.r * 2 * 1.28;
    els.push(<Brain key="bs" x={pc[0]} y={pc[1] + inl.r * 0.55} size={bs} uid="bs" squashX={0.86} squashY={1.08} swell={0.15} glow={0.3} />);
    els.push(<Pelvis key="pf" x={pc[0]} y={pc[1]} size={PS} uid="pf" part="front" />);
    els.push(<Pelvis key="p2" x={540} y={500} size={360} uid="p2" />);
  }
  return (
    <AirStage v={A.v} bloom={0.22} motes={0.4}>
      <WorldSvg cam={CAM}>{els}</WorldSvg>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <text x={40} y={60} fill="#F3EBDD" fontSize={28} fontFamily="sans-serif" opacity={0.6}>
          {`brain probe: ${sheet} (aspect ${BRAIN_ASPECT.toFixed(3)})`}
        </text>
      </svg>
    </AirStage>
  );
};

export default BrainProbe;
