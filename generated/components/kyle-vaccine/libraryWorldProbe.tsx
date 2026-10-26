// libraryWorldProbe: stills of the kyle-vaccine library world (libraryWorld.tsx) from any camera, for its proofs.
// props: k (zoom), X / Y / Z (the 3D point held at screen (540, sy)), sy, frame (ambient life), store (true = cut 68's
// own camera at `frame`).
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, WorldSvg, swayCam, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { DEPTH, LIB_BLOOM, LibraryStage, libraryAir, storeCamAt } from "./libraryWorld";

export const schema = z.object({ k: z.number(), X: z.number(), Y: z.number(), Z: z.number(), sy: z.number(), frame: z.number(), store: z.boolean(), shafts: z.number().default(1) });
export const defaultProps = schema.parse({ k: 0.75, X: 0, Y: -700, Z: 0, sy: 960, frame: 0, store: false });

const camFor = (k: number, X: number, Y: number, Z: number, sy: number): Cam => {
  const Dc = DEPTH.dRef * Math.pow(DEPTH.kRef / k, DEPTH.dolly);
  const r = Dc / (Dc + Z);
  const y2 = DEPTH.eyeY + (Y - DEPTH.eyeY) * r;
  return { k, cx: X, cy: y2 - (sy - 960) / k };
};

const LibraryWorldProbe: React.FC<z.infer<typeof schema>> = (p) => {
  const f = useCurrentFrame() + p.frame;
  const cam = p.store ? storeCamAt(f) : swayCam(camFor(p.k, p.X, p.Y, p.Z, p.sy), f);
  const A = libraryAir(cam, f);
  return (
    <AirStage v={A.v} shafts={0} bloom={LIB_BLOOM}>
      <WorldSvg cam={cam}>
        <LibraryStage A={A} frame={f} shafts={p.shafts} />
      </WorldSvg>
    </AirStage>
  );
};
export default LibraryWorldProbe;
