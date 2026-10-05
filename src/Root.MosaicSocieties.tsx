import React from "react";
import { Composition, useCurrentFrame } from "remotion";
import { IraqABScene } from "../generated/components/iraqAB";
import MosaicSocieties, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from "../generated/components/MosaicSocieties";

// Private render entry for MosaicSocieties (builder M): cut C of Si Sheppard,
// "Regime change in Iraq was the easy part" — "Iraq and neighbors are mosaic
// societies ... kill one or two more colors on that map ... and vice versa."
// Opaque Dwarkesh map style, 1080x1920, 24 fps, 561 frames (global g599-1159).
const JoinRef: React.FC = () => {
  const f = useCurrentFrame();
  return <IraqABScene g={598 + f} />;
};

export const RemotionRoot = () => (
  <>
    <Composition
      id="MosaicSocieties"
      component={MosaicSocieties}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
    {/* join check: B's scene continued (frame f = global 598 + f) */}
    <Composition
      id="MosaicSocietiesJoinRef"
      component={JoinRef}
      durationInFrames={3}
      fps={FPS}
      width={1080}
      height={1920}
    />
  </>
);
