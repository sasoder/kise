import {Composition} from 'remotion';
import StillDecideWhatWeWantV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/StillDecideWhatWeWantV2';

// Private render entry for StillDecideWhatWeWantV2, so this cut renders while
// another builder owns src/Root.tsx. Orange Dwarkesh on the grid background:
// four white tools in a row, the AI crowds take them, the person under them
// decides a target in a thought bubble and sends it up into the row.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="StillDecideWhatWeWantV2"
        component={StillDecideWhatWeWantV2}
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
