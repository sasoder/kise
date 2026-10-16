import {Composition} from 'remotion';
import {DgFiguresCrowdSheet, DgFiguresSheet} from '../generated/components/sarah-death-ground/dgFigures';

// Private render entry for the review sheets of dgFigures (Sarah Paine,
// "Death ground"): the Warring States cast in both inks, its poses and props,
// and a 40-man crowd in guard. The world is 2160x3840 seen at k = 0.5: render
// the stills with --scale 2.
export const RemotionRoot = () => {
  return (
    <>
      <Composition id="DgFiguresSheet" component={DgFiguresSheet} durationInFrames={1} fps={24} width={1080} height={1920} />
      <Composition id="DgFiguresCrowdSheet" component={DgFiguresCrowdSheet} durationInFrames={1} fps={24} width={1080} height={1920} />
    </>
  );
};
