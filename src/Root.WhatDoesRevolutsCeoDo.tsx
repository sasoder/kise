import {Composition} from 'remotion';
import WhatDoesRevolutsCeoDo, {DURATION, FPS, defaultProps, schema} from '../generated/components/nik-detecting-bullshit/WhatDoesRevolutsCeoDo';

// Private render entry for WhatDoesRevolutsCeoDo (nik-detecting-bullshit; Cheeky Pint style (stout)): the clip title card, "What does" / "Revolut's CEO do?" as the name-tag strips title (TitleCardCheekyPint, as in toto-mercedes-job).
// Transparent overlay 1080x1920, 23.976 fps, 61 frames.
export const RemotionRoot = () => (
  <Composition
    id="WhatDoesRevolutsCeoDo"
    component={WhatDoesRevolutsCeoDo}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
