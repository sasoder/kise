import {Composition} from 'remotion';
import {FigureSheet, SHEET} from '../generated/components/pageFigures';

// Private render entry for the V2 page figures' sheet (each figure at 16, 32
// and 64 px; cream / orange / dead), a single still.
export const RemotionRoot = () => {
  return (
    <>
      <Composition id="PageFigureSheet" component={FigureSheet} durationInFrames={1} fps={24} width={SHEET.w} height={SHEET.h} />
    </>
  );
};
