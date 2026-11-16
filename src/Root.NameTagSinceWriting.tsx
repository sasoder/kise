import React from 'react';
import {AbsoluteFill, Composition, Sequence} from 'remotion';
import NameTagDwarkesh3d, {FPS, wrapFor} from '../generated/components/kits/name-tags/NameTagDwarkesh3d';

// Private render entry for the two name tags over the still of Paul Erdős with the young Terence Tao
// (RSI_Part2_Short_S3_Since_Writing, 49.7a_SpentDecades_ErdosWithTao.jpg; fitted whole to the 1080 width, centred
// vertically: the photo spans y 595-1325). Dwarkesh 3D tag (kits/name-tags/NameTagDwarkesh3d.tsx) at the 0.72x house
// wrap. One composition per tag, 1080x1920 at 24000/1001.
//
// Round 3 (user: "more of a like combined lower third graphic ... Erdős and Tao doing math and then the year"):
// LowerThird-ErdosTao replaces the two separate tags (which stay rendered and referenced in the bin), and
// NameTag-Stokes labels the portrait that follows. Both sit in the lower part of the keep-in box ABOVE the caption
// bands (panel bottom y 1068, clear of y 1080-1250 and 1360-1460), inside x 65-1015, with the entrance compressed
// to settle by f8 (short slots), then a static hold to the cut.
//   LowerThird-ErdosTao  49.716-51.969 s = 54 f. "Paul Erdős and Terence Tao" / "1985" (Commons "Paul Erdos with
//     Terence Tao.jpg", 1985, Tao aged 10). Checked over 49.7a at 551.72 %, centre x 0.927 (Erdős only, Tao cropped
//     out): the plate sits on his jacket, under his face and hand.
//   NameTag-Stokes  51.969-53.887 s = 46 f. "George Gabriel Stokes" / "Mathematician and physicist, 1819–1903".
//     Checked over 47.1b at 34.71 %, centre x 0.448: the plate sits on his waistcoat, under his face.
//
// Round 2 (kept): a viewer pausing on the still reads, without effort, who each of the two is.
// Erdős is on the LEFT of the photo: his tag left-aligned, panel x 180-572, y 1140-1279 (under his lap).
// Tao is on the RIGHT: his tag mirrored onto the right edge, panel x 432-900. At the same height the two panels
// overlap in x, so Tao's is staggered 165 px lower (y 1305-1444, a 25 px gap under Erdős's, under the photo's
// bottom-right, still above y ~1460). His entrance starts 6 frames after Erdős's (it follows, never leads).
//
// CONTRAST (rendered f60 over the photo, WCAG, cream text core vs the panel behind each line): name 10.5:1 (9.8:1
// against the lightest panel pixel at the lit top), descriptor 11.6:1 (11.1:1), both tags. The panel is opaque, so
// the photo behind does not change it.
// panel bottom at y 1068 (the house bottom is 1280): above the first caption band
const LOWER_DY = -212;
// x offsets from the house left edge (x 180), measured on the f30 stills
const ERDOS_TAO_DX = -102;
const STOKES_DX = -102;
type TagSpec = {
  id: string;
  name: string;
  job: string;
  align: 'left' | 'right';
  frames: number;
  dx?: number;
  dy?: number;
  delay?: number;
  settle?: number;
};
const TAGS: TagSpec[] = [
  {id: 'NameTag-Erdos', name: 'Paul Erdős', job: 'Mathematician', align: 'left', frames: 98},
  {id: 'NameTag-Tao', name: 'Terence Tao', job: 'Mathematician, here aged 10', align: 'right', frames: 98, dy: 165, delay: 6},
  {id: 'LowerThird-ErdosTao', name: 'Paul Erdős and Terence Tao', job: '1985', align: 'left', frames: 54, dx: ERDOS_TAO_DX, dy: LOWER_DY, settle: 8},
  {id: 'NameTag-Stokes', name: 'George Gabriel Stokes', job: 'Mathematician and physicist, 1819–1903', align: 'left', frames: 46, dx: STOKES_DX, dy: LOWER_DY, settle: 8},
];

const Tag: React.FC<Omit<TagSpec, 'id'>> = ({name, job, align, frames, dx = 0, dy = 0, delay = 0, settle}) => (
  <AbsoluteFill style={wrapFor(align, dy, dx)}>
    <Sequence from={delay} layout="none">
      <NameTagDwarkesh3d name={name} job={job} align={align} durationInFrames={frames - delay} settle={settle} />
    </Sequence>
  </AbsoluteFill>
);

export const RemotionRoot = () => (
  <>
    {TAGS.map(({id, ...p}) => (
      <Composition
        key={id}
        id={id}
        component={Tag}
        defaultProps={p}
        durationInFrames={p.frames}
        fps={FPS}
        width={1080}
        height={1920}
      />
    ))}
  </>
);
