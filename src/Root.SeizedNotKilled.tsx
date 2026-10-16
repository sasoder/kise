import {Composition} from 'remotion';
import SeizedNotKilled, {
  DURATION,
  FPS,
  SeizedSheet,
  defaultProps,
  schema,
} from '../generated/components/sheppard-capture-not-kill/SeizedNotKilled';

// Private render entry for SeizedNotKilled (Si Sheppard, "Capture, not kill"):
// Cortes down on the ground under the raised clubs of four orange warriors, who
// lower them and haul him off alive. Opaque umber page, 1080x1920, 23.976 fps,
// 265 frames. SeizedSheet is the review sheet of the lying Cortes and his horse.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SeizedNotKilled"
        component={SeizedNotKilled}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="SeizedSheet" component={SeizedSheet} durationInFrames={1} fps={24} width={1080} height={1920} />
    </>
  );
};
