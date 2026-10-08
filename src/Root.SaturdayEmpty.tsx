import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import SaturdayEmpty, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/SaturdayEmpty';

// Private render entry for SaturdayEmpty, so this cut renders while other
// builders own src/Root.tsx. "Durin... empty. Oh, this is Radiant... Empty."
// Core memory ink, TRANSPARENT overlay under the 16:9 video band, 1080x1920,
// 24 fps, 269 frames.
//
// `SaturdayEmpty` is the deliverable (alpha). `SaturdayEmptyPreview` is for
// judging it in context only and is never delivered: grey paper with a dark
// block standing in for the video band at y 575-1209.

const Preview: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#C8C8C6'}}>
    <div style={{position: 'absolute', left: 0, top: 575, width: 1080, height: 634, backgroundColor: '#333333'}} />
    <SaturdayEmpty {...defaultProps} />
  </AbsoluteFill>
);

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SaturdayEmpty"
        component={SaturdayEmpty}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="SaturdayEmptyPreview"
        component={Preview}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
