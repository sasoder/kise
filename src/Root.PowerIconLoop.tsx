import {Composition} from 'remotion';
import PowerIconLoop, {
  defaultProps,
  schema,
} from '../generated/components/PowerIconLoop';

// Private render entry for PowerIconLoop, so this icon renders while another
// builder owns src/Root.tsx. Transparent overlay asset: 1080x1080, 24fps, 96
// frames, one seamless cycle.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PowerIconLoop"
        component={PowerIconLoop}
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
