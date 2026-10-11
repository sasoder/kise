// PlagueKitDemo: a 60-frame sheet of the plague kit v2 (plagueShared.tsx): the
// Page, a crowd of 14 Vecellio figures (3 orange, 2 dead, one mid-fall), both
// Medallions, the MarmotVignette, InkStrokes, a hatch-filled shape and germs
// under a slow camera pull. Not a deliverable.
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { type CamKey, type Pt, DARK, FPS as KIT_FPS, Germs, Hatch, INK, InkStroke, Label, MARMOT, MarmotVignette, Medallion, Page, Person, WorldSvg, inkPath, marmotPoint, roughen, runCamera } from "./plagueShared";

export const FPS = KIT_FPS;
export const DURATION = 60;
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const CAM: CamKey[] = [
  { f: 0, x: 540, y: 940, k: 1.1 },
  { f: 59, x: 540, y: 960, k: 1 },
];
const GERMS = Array.from({ length: 12 }, (_, i) => ({ x: 640 + ((i * 137) % 330), y: 1500 + ((i * 71) % 110), seed: i }));
const LINE_A = inkPath(roughen([[80, 1700], [420, 1660], [1000, 1700]], 3, 2));
const LINE_B = inkPath(roughen([[80, 1770], [520, 1740], [1000, 1780]], 5, 2));
const BLOB: Pt[] = [[110, 1480], [300, 1440], [520, 1470], [540, 1580], [330, 1620], [120, 1590]];
const BLOB_D = inkPath(roughen(BLOB, 9, 2.5), true);
const VX = 230;
const VY = 150;
const VW = 620;
const SIL = `M${MARMOT.silhouette.map((f) => marmotPoint(VX, VY, VW, f).join(",")).join("L")}Z`;

const PlagueKitDemo: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const cam = runCamera(CAM, frame);
  return (
    <Page>
      <WorldSvg cam={cam} defs={<Hatch id="demoHatch" spacing={8} angle={-38} width={1.3} opacity={0.75} />}>
        <MarmotVignette x={VX} y={VY} w={VW} />
        <path d={SIL} fill="none" stroke={INK} strokeWidth={1} strokeOpacity={frame < 0 ? 0.6 : 0} />
        <Medallion kind="marmot" cx={150} cy={330} r={95} />
        <Medallion kind="flea" cx={930} cy={330} r={95} />
        <Label x={540} y={850} size={56} sc appear={4} frame={frame}>
          Central Asia
        </Label>
        {Array.from({ length: 14 }, (_, i) => {
          const row = i < 7 ? 0 : 1;
          const c = i % 7;
          return (
            <Person
              key={i}
              x={110 + c * 142 + row * 30}
              y={1070 + row * 290}
              h={row === 0 ? 150 : 210}
              seed={i + 1}
              variant={i}
              tone={i === 2 || i === 5 || i === 9 ? 1 : 0}
              fallen={i === 4 || i === 12 ? 1 : i === 10 ? frame / 52 : 0}
              facing={i === 12 ? -1 : 1}
            />
          );
        })}
        <path d={BLOB_D} fill={DARK} fillOpacity={0.5} />
        <path d={BLOB_D} fill="url(#demoHatch)" />
        <InkStroke d={BLOB_D} width={3} />
        <Germs points={GERMS} r={9} />
        <InkStroke d={LINE_A} width={3} />
        <InkStroke d={LINE_B} width={8} tone={1} />
      </WorldSvg>
    </Page>
  );
};
export default PlagueKitDemo;
