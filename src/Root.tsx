import {Composition} from 'remotion';
import GreatTasksPoorToStart, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/GreatTasksPoorToStart';

// kyle — why the home robot won't do your dishes first.
export const RemotionRoot = () => {
  return (
    <>
      {/* 0:05.059 -> 0:10.419 */}
      <Composition
        id="GreatTasksPoorToStart"
        component={GreatTasksPoorToStart}
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
