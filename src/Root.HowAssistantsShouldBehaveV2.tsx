import {Composition} from 'remotion';
import HowAssistantsShouldBehaveV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HowAssistantsShouldBehaveV2';

// Private render entry for HowAssistantsShouldBehaveV2, so this cut renders
// while another builder owns src/Root.tsx. Orange Dwarkesh style on the grid
// background: five people draw an ink shape around an orange crowd, the crowd
// conforms to it, the shape is redrawn, and human feedback settles the crowd.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HowAssistantsShouldBehaveV2"
        component={HowAssistantsShouldBehaveV2}
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
