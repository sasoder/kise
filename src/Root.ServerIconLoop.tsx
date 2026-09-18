import {Composition} from 'remotion';
import ServerIconLoop, {
  defaultProps,
  schema,
} from '../generated/components/ServerIconLoop';

// Private render entry for ServerIconLoop, so this icon renders while another
// builder owns src/Root.tsx. Transparent overlay asset: 1080x1080, 24fps, 96
// frames, one seamless cycle.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ServerIconLoop"
        component={ServerIconLoop}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={96}
        fps={24}
        width={1080}
        height={1080}
      />
    </>
  );
};
