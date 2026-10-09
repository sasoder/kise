import React from 'react';
import {Composition} from 'remotion';
import CodeLines, {DURATION, FPS, defaultProps, schema} from '../generated/components/CodeLines';

// Private render entry for CodeLines, so this cut renders while other builders
// own src/Root.tsx. "...we will need more than just fancy lines of code." Core
// memory ink, TRANSPARENT overlay on top of the talking head (no roto),
// 1080x1920, 24 fps, 72 frames. Reuses the WRITE phase of CodeAndApps.

export const RemotionRoot = () => {
  return (
    <Composition
      id="CodeLines"
      component={CodeLines}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
