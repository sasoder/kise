import React from 'react';
import {Composition} from 'remotion';
import {GeneratedScene} from '../generated/components/GeneratedScene';

export const Root: React.FC = () => {
  return (
    <Composition
      id="GeneratedScene"
      component={GeneratedScene}
      durationInFrames={180}
      fps={30}
      width={1080}
      height={1080}
      defaultProps={{
        title: 'Nordic market update',
        subtitle: 'Q2 outlook',
        accent: '#65d6ad',
      }}
    />
  );
};
