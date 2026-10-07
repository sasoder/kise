import {Composition} from 'remotion';
import HisOwnPeopleV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HisOwnPeopleV2';

// Private render entry for HisOwnPeopleV2 (38_HisOwnPeople, round 3 of the
// strings set; the trimmed slot 38.497-42.417 s). Si Sheppard on Moctezuma:
// "It was his own people, because they realized that he had sold them out and
// he had to go." Opaque engraved page, 1080x1920, 24 fps, 97 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HisOwnPeopleV2"
        component={HisOwnPeopleV2}
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
