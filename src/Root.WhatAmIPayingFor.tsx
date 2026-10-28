import {Composition} from 'remotion';
import WhatAmIPayingFor, {DURATION, FPS, defaultProps, schema} from '../generated/components/sam-pricing-tokens/WhatAmIPayingFor';

// Private render entry for WhatAmIPayingFor (sam-pricing-tokens; Cheeky Pint style (stout)): cut 11's tag in the OpenAI tile; two customers lean in from the frame sides and sour on "negative"; the tile prints a receipt of blank "?" lines up out of the slot (the tag drops back in behind it), the amber $3.40 total last.
// Opaque 1080x1920, 23.976 fps, 130 frames.
export const RemotionRoot = () => (
  <Composition
    id="WhatAmIPayingFor"
    component={WhatAmIPayingFor}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
