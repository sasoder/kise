import {Composition} from 'remotion';
import WhatIfGptTen, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-hugging-face/WhatIfGptTen';

// Private render entry for WhatIfGptTen (paul-hugging-face; round 2): the opening title "What if GPT-10 did the Hugging Face hack?" as
// Cheeky-Pint-style strips in the look-C graphite material, GPT-10 on the one orange strip, over the talking head.
// TRANSPARENT 1080x1920 overlay, 23.976 fps, 59 frames.
export const RemotionRoot = () => (
  <Composition
    id="WhatIfGptTen"
    component={WhatIfGptTen}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
