import {Composition} from 'remotion';
import CameToTheUS, {DURATION, FPS, defaultProps, schema} from '../generated/components/CameToTheUS';

// Private render entry for CameToTheUS. Hadrian Machina 06: "...this young
// Australian entrepreneur came to the US." One eased pan from Chris Power to
// the flag; the US silhouette arrives as the core-memory stack.
// 1080x1920, 24fps, 83 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CameToTheUS"
        component={CameToTheUS}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
