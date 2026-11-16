import React from 'react';
import {AbsoluteFill, Composition, Sequence} from 'remotion';
import NameTagDwarkesh3d, {FPS, wrapFor} from '../generated/components/kits/name-tags/NameTagDwarkesh3d';

// Private render entry for the two name tags over the still of Paul Erdős with the young Terence Tao
// (RSI_Part2_Short_S3_Since_Writing, 49.7a_SpentDecades_ErdosWithTao.jpg; fitted whole to the 1080 width, centred
// vertically: the photo spans y 595-1325). Dwarkesh 3D tag (kits/name-tags/NameTagDwarkesh3d.tsx) at the 0.72x house
// wrap. One composition per person (NameTag-<Key>), 1080x1920 at 24000/1001, 98 frames each.
//
// Check: a viewer pausing on the still reads, without effort, who each of the two is.
// Erdős is on the LEFT of the photo: his tag left-aligned, panel x 180-572, y 1140-1279 (under his lap).
// Tao is on the RIGHT: his tag mirrored onto the right edge, panel x 432-900. At the same height the two panels
// overlap in x, so Tao's is staggered 165 px lower (y 1305-1444, a 25 px gap under Erdős's, under the photo's
// bottom-right, still above y ~1460). His entrance starts 6 frames after Erdős's (it follows, never leads).
//
// CONTRAST (rendered f60 over the photo, WCAG, cream text core vs the panel behind each line): name 10.5:1 (9.8:1
// against the lightest panel pixel at the lit top), descriptor 11.6:1 (11.1:1), both tags. The panel is opaque, so
// the photo behind does not change it.
const PEOPLE = [
  {key: 'Erdos', name: 'Paul Erdős', job: 'Mathematician', align: 'left', dy: 0, delay: 0},
  {key: 'Tao', name: 'Terence Tao', job: 'Mathematician, here aged 10', align: 'right', dy: 165, delay: 6},
] as const;
const FRAMES = 98;

const Tag: React.FC<{name: string; job: string; align: 'left' | 'right'; dy: number; delay: number}> = ({name, job, align, dy, delay}) => (
  <AbsoluteFill style={wrapFor(align, dy)}>
    <Sequence from={delay} layout="none">
      <NameTagDwarkesh3d name={name} job={job} align={align} durationInFrames={FRAMES - delay} />
    </Sequence>
  </AbsoluteFill>
);

export const RemotionRoot = () => (
  <>
    {PEOPLE.map(({key, ...p}) => (
      <Composition
        key={key}
        id={`NameTag-${key}`}
        component={Tag}
        defaultProps={p}
        durationInFrames={FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
    ))}
  </>
);
