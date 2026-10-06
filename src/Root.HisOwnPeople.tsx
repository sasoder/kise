import {Composition} from 'remotion';
import HisOwnPeople, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HisOwnPeople';
import NotRockTheBoat, {
  DURATION as NRB_DURATION,
  defaultProps as nrbProps,
  schema as nrbSchema,
} from '../generated/components/NotRockTheBoat';

// Private render entry for HisOwnPeople (36_HisOwnPeople, round 2 of the
// strings set). Si Sheppard on Moctezuma: "In the end, it wasn't Cortés who
// disposed of him. It was his own people, because they realized that he had
// sold them out and he had to go." Opaque engraved page, 1080x1920, 24 fps,
// 152 frames. NotRockTheBoat is registered beside it only as the join
// reference (this cut's f0 = that cut's last frame).
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HisOwnPeople"
        component={HisOwnPeople}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="HisOwnPeopleJoinRef"
        component={NotRockTheBoat}
        schema={nrbSchema}
        defaultProps={nrbProps}
        durationInFrames={NRB_DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
