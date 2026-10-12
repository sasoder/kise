import {Composition} from 'remotion';
import {CaptureFiguresSheet} from '../generated/components/captureFigures';

// Private render entry for the review sheet of captureFigures (Si Sheppard,
// "Capture, not kill"): the cast, poses, props and a 110 px silhouette row.
// The world is 2160x3840 seen at k = 0.5: render the still with --scale 2.
export const RemotionRoot = () => {
  return (
    <>
      <Composition id="CaptureFiguresSheet" component={CaptureFiguresSheet} durationInFrames={1} fps={24} width={1080} height={1920} />
    </>
  );
};
