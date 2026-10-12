import {Composition} from 'remotion';
import AllAdultMales, {
  AllAdultMalesSheet,
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/AllAdultMales';

// Private render entry for AllAdultMales (Si Sheppard, "Capture, not kill"):
// ranks of cream commoners take up shield and club and stand as orange
// warriors, rank after rank, while the camera pulls back over the whole host;
// then every club is raised. Opaque umber page, 1080x1920, 23.976 fps, 137
// frames. AllAdultMalesSheet is the review sheet of one man's 41 states.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AllAdultMales"
        component={AllAdultMales}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="AllAdultMalesSheet" component={AllAdultMalesSheet} durationInFrames={1} fps={24} width={1080} height={1920} />
    </>
  );
};
