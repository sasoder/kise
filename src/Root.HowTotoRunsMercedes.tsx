import {Composition} from 'remotion';
import HowTotoRunsMercedes, {DURATION, FPS, defaultProps, schema} from '../generated/components/toto-twenty-person/HowTotoRunsMercedes';

// Private render entry for HowTotoRunsMercedes (toto-twenty-person; Cheeky Pint style (stout)): the clip title card, "How Toto runs" / "Mercedes F1" as the name-tag strips title (TitleCardCheekyPint, as in toto-mercedes-job).
// Transparent overlay 1080x1920, 25 fps, 54 frames.
export const RemotionRoot = () => (
  <Composition
    id="HowTotoRunsMercedes"
    component={HowTotoRunsMercedes}
    schema={schema}
    defaultProps={defaultProps}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
