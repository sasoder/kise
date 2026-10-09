import {Composition} from 'remotion';
import NameTagMapStyle, {FPS, schema} from '../generated/components/NameTagMapStyle';

// Private render entry for the Dwarkesh-map-style name tags of the East India
// Company clip: one composition per person (id NameTag-<Key>; Remotion ids take no underscore), each at its own
// frame count, so each renders by id while other sessions own src/Root.tsx.
const PEOPLE = [
  {key: 'Clive', name: 'Robert Clive', job: 'East India Company commander', frames: 84},
  {key: 'Alivardi', name: 'Alivardi Khan', job: 'Nawab of Bengal, 1740–1756', frames: 71},
  {key: 'Siraj', name: 'Siraj ud-Daulah', job: 'Nawab of Bengal, 1756–1757', frames: 80},
  {key: 'Hastings', name: 'Warren Hastings', job: 'Governor-General of Bengal', frames: 66},
  {key: 'Cornwallis', name: 'Lord Cornwallis', job: 'Governor-General of India', frames: 89},
  {key: 'CharlesVI', name: 'Charles VI', job: 'King of France, 1380–1422', frames: 59},
  {key: 'HenryVI', name: 'Henry VI', job: 'King of England', frames: 47},
  {key: 'Cortes', name: 'Hernán Cortés', job: 'Conquistador of Mexico', frames: 24},
  {key: 'Pizarro', name: 'Francisco Pizarro', job: 'Conquistador of Peru', frames: 69},
] as const;

export const RemotionRoot = () => {
  return (
    <>
      {PEOPLE.map((p) => (
        <Composition
          key={p.key}
          id={`NameTag-${p.key}`}
          component={NameTagMapStyle}
          schema={schema}
          defaultProps={{name: p.name, job: p.job, durationInFrames: p.frames}}
          durationInFrames={p.frames}
          fps={FPS}
          width={1080}
          height={1920}
        />
      ))}
    </>
  );
};
