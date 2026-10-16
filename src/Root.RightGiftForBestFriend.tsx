import {Composition} from 'remotion';
import RightGiftForBestFriend, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/alex-agentic-commerce/RightGiftForBestFriend';

// Private render entry for RightGiftForBestFriend (Alexandr Wang, "Alex on agentic commerce", Cheeky Pint
// S4E03, cut 6), so this cut renders while other builders own their own entries. World: museShared.tsx.
// Opaque, 1080x1920 (9:16), 23.976 fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="RightGiftForBestFriend"
        component={RightGiftForBestFriend}
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
