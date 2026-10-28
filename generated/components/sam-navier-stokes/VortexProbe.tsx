// ---------------------------------------------------------------------------
// VortexProbe (sam-navier-stokes world builder's probe stills; not a cut). One still per frame, 1080x1920, 23.976 fps.
// RENDER WITH --gl=angle.
//   f0  a_cut10_open   cut 10's f0: close on the foot of the Navier-Stokes vortex in the deck, all cream
//   f1  b_cut10_end    cut 10's f109 (CUT10_END): the whole vortex, amber just past the ~$10M tick
//   f2  c_half         the hero framing with the front half way (the front's look)
//   f3  d_front_close  close on the front: amber tubes, the hot top edge, the warm glow above
//   f4  e_field_lo     a few "lo" vortices of other seeds over the deck (cut 19's family), small fills
//   f5  f_turn         cut 10's end camera 24 frames later (the turn)
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import type { SideCam, V3 } from "../scott-aircraft-order/aircraftShared";
import { CUT10_END, CostTick, NS_TICK, NS_VORTEX, Vortex, VortexStage, cut10Cam, vortexAxis } from "./vortexSky";

export const FPS = 24000 / 1001;
export const DURATION = 6;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const V = NS_VORTEX;
const Tick: React.FC = () => <CostTick at={NS_TICK.at} length={NS_TICK.length} text={NS_TICK.text} size={NS_TICK.size} sub={NS_TICK.sub} subSize={NS_TICK.subSize} />;

const VortexProbe: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  if (f === 0) {
    const cam = cut10Cam(0);
    return <VortexStage cam={cam} S={0} world={<Vortex at={V.at} height={V.height} seed={V.seed} fill={0} />} />;
  }
  if (f === 1 || f === 5) {
    const S = CUT10_END.S + (f === 5 ? 24 : 0);
    const cam = f === 5 ? cut10Cam(109 + 24) : CUT10_END.cam;
    return <VortexStage cam={cam} S={S} world={<Vortex at={V.at} height={V.height} seed={V.seed} fill={CUT10_END.fill} />} overlay={<Tick />} />;
  }
  if (f === 2) {
    return <VortexStage cam={CUT10_END.cam} S={60} world={<Vortex at={V.at} height={V.height} seed={V.seed} fill={0.5} />} />;
  }
  if (f === 3) {
    const c = vortexAxis(V, 0.5);
    const cam: SideCam = { mode: "side", x: c[0] + 300, y: c[1] + 200, z: c[2] - 2600, f: 1500, horizon: 960, pitch: 2 };
    return <VortexStage cam={cam} S={60} world={<Vortex at={V.at} height={V.height} seed={V.seed} fill={0.5} />} />;
  }
  const cam: SideCam = { mode: "side", x: 2000, y: 4600, z: -9000, f: 1500, horizon: 960, pitch: -6 };
  const items: { at: V3; h: number; seed: number; fill: number }[] = [
    { at: [-2550, 1700, 2550], h: 6300, seed: 1, fill: 0.88 },
    { at: [3500, 1900, 3000], h: 3200, seed: 2, fill: 0.22 },
    { at: [6400, 1900, 6500], h: 2800, seed: 3, fill: 0.2 },
    { at: [1200, 1900, 9000], h: 2600, seed: 4, fill: 0.25 },
    { at: [9000, 1900, 1500], h: 2400, seed: 5, fill: 0.18 },
  ];
  return (
    <VortexStage
      cam={cam}
      S={60}
      world={items.map((v, i) => (
        <Vortex key={i} at={v.at} height={v.h} seed={v.seed} fill={v.fill} detail={i === 0 ? "hi" : "lo"} />
      ))}
    />
  );
};

export default VortexProbe;
