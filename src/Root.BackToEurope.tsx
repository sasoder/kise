import {Composition} from 'remotion';
import BackToEurope, {
  BackToEuropeSheet,
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/sheppard-conquistador-advantages/BackToEurope';

// Private render entry for BackToEurope (Si Sheppard, "Conquistador
// advantages", cut D): the conquistador in his quilted cotton armour meets a
// hedge of European pikes. Opaque umber page, 1080x1920, 23.976 fps, 92 frames.
// BackToEuropeSheet is the review sheet of the figures.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="BackToEurope"
        component={BackToEurope}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition id="BackToEuropeSheet" component={BackToEuropeSheet} durationInFrames={1} fps={24} width={1080} height={1920} />
    </>
  );
};
