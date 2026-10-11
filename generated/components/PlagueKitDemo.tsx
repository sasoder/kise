// PlagueKitDemo: a 60-frame sheet of the plague kit (plagueShared.tsx): the
// Page, eight Persons (two orange, two toppling), both Medallions, a Label and
// a handful of germs under a slow camera pull. Not a deliverable.
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { type CamKey, FPS as KIT_FPS, Germs, Label, Medallion, Page, Person, WorldSvg, runCamera } from "./plagueShared";

export const FPS = KIT_FPS;
export const DURATION = 60;
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const CAM: CamKey[] = [
  { f: 0, x: 540, y: 940, k: 1.12 },
  { f: 59, x: 540, y: 960, k: 1 },
];
const GERMS = Array.from({ length: 14 }, (_, i) => ({ x: 250 + ((i * 137) % 580), y: 1420 + ((i * 71) % 150), seed: i }));

const PlagueKitDemo: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const cam = runCamera(CAM, frame);
  return (
    <Page>
      <WorldSvg cam={cam}>
        <Medallion kind="marmot" cx={320} cy={520} r={120} />
        <Medallion kind="flea" cx={760} cy={520} r={120} accent />
        <Label x={540} y={760} size={64} sc appear={4} frame={frame}>
          Central Asia, 1338
        </Label>
        <Label x={540} y={820} size={40} italic appear={10} frame={frame}>
          Yersinia pestis
        </Label>
        {Array.from({ length: 8 }, (_, i) => (
          <Person
            key={i}
            x={120 + i * 120}
            y={1060 + (i % 2) * 14}
            h={i === 3 ? 200 : 170}
            seed={i + 1}
            tone={i === 2 || i === 5 || i === 6 ? 1 : 0}
            fallen={i === 6 ? frame / 44 : i === 7 ? frame / 30 : 0}
            facing={i === 6 ? -1 : 1}
          />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <Person key={`s${i}`} x={150 + i * 70} y={1330} h={62} seed={40 + i} tone={i % 5 === 1 ? 1 : 0} />
        ))}
        <Germs points={GERMS} r={9} />
      </WorldSvg>
    </Page>
  );
};
export default PlagueKitDemo;
