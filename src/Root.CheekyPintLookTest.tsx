import {Composition} from 'remotion';
import CheekyPintLookTest, {
  defaultProps,
  schema,
} from '../generated/components/CheekyPintLookTest';

// Private render entry for the Cheeky Pint 2.0 look development (stills only:
// props `look` x `frame`), so it renders while other sessions own src/Root.tsx.
export const RemotionRoot = () => {
  return (
    <Composition
      id="CheekyPintLookTest"
      component={CheekyPintLookTest}
      schema={schema}
      defaultProps={defaultProps}
      durationInFrames={1}
      fps={24}
      width={1080}
      height={1920}
    />
  );
};
