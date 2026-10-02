import {Composition} from 'remotion';
import NameTagHumble, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NameTagHumble';

// Private render entry for the Humble name tag, so it renders while another
// builder owns src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="NameTagHumble"
      component={NameTagHumble}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};
