import {Composition} from 'remotion';
import WhatIfGptTen, {DURATION, FPS, defaultProps, schema} from '../generated/components/paul-hugging-face/WhatIfGptTen';

// Private render entry for WhatIfGptTen (paul-hugging-face; look C graphite air): the title plate "What if GPT-10 did the Hugging Face hack?" with the orange robot growing 0.6x -> 1.3x beside it on "scale it up".
// Opaque 1080x1920, 23.976 fps, 59 frames.
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
