import React from "react";
import { Composition } from "remotion";

const Blank = React.lazy(() => import("../generated/components/Blank"));

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Scene"
      component={Blank}
      durationInFrames={180}
      fps={30}
      width={1080}
      height={1080}
    />
  );
};
