import {Composition} from 'remotion';
import MercJobProbe, {defaultProps, schema} from '../generated/components/MercJobProbe';

// Private still entry for the mercJob world (checks only, not a deliverable): Act B's rest state at
// the pair framing, or its end state at a wide that shows the industry row. 1080x1920.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MercJobProbe"
        component={MercJobProbe}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={1}
        fps={24}
        width={1080}
        height={1920}
      />
    </>
  );
};
