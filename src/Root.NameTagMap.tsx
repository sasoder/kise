import {Composition} from 'remotion';
import NameTagMap, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NameTagMap';

// Private render entry for the map-style name tag, so it renders while
// another builder owns src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NameTagMap"
      component={NameTagMap}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
