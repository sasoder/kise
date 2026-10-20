// ---------------------------------------------------------------------------
// londonDepthProbe: the check frame of londonDepth + the cast's form shadow: one Fellow at three depths on the
// boards, each with a contact shadow and form shading and the depth tint, beside a box and a cylinder; the camera of
// cut 22's wide (k 1.32). Render entry src/entry.LondonDepth.ts (LondonDepthProbe, and LondonDepthProbeClose at k 2.8).
// ---------------------------------------------------------------------------
import React from "react";
import { TexcocoPage, WorldSvg, type Cam } from "../kits/maps/texcocoShared";
import { CREAM, Fellow, Newton, ORANGE, POSES, headTurn, shadeInk } from "./londonCastV2";
import { Box, ContactShadow, Cylinder, GroundPlane, depthTint, perspective, tintInk, volInk, type DepthOpts } from "./londonDepth";

export const DEPTH_OPTS: DepthOpts = { eyeY: -747, dRef: 1500, kRef: 1.32, dolly: 0.4 };
const Probe: React.FC<{ cam: Cam }> = ({ cam }) => {
  const P = perspective(cam, DEPTH_OPTS);
  const men = [
    { X: -40, Z: 0, v: 0 },
    { X: 260, Z: 320, v: 2 },
    { X: -330, Z: 760, v: 4 },
  ];
  const far = [...men].sort((a, b) => b.Z - a.Z);
  const vol = volInk(CREAM);
  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        <GroundPlane P={P} uid="gp" />
        <ContactShadow P={P} X={-420} Z={250} w={90} d={70} uid="bx" />
        <Box P={P} X0={-500} X1={-340} Y0={-120} Y1={0} Z0={180} Z1={320} ink={vol} uid="box" />
        <ContactShadow P={P} X={430} Z={120} w={70} d={60} uid="cy" />
        <Cylinder P={P} X={430} Z={120} R={52} Y0={-150} Y1={0} ink={vol} uid="cyl" />
        {far.map((m, i) => {
          const a = P.at(m.X, m.Z);
          const t = depthTint(m.Z);
          return (
            <g key={i}>
              <ContactShadow P={P} X={m.X} Z={m.Z} uid={`m${i}`} />
              {m.Z === 0 ? (
                <Newton pose={headTurn(POSES.stand(-1), -0.6)} at={a.at} scale={a.scale} uid={`n${i}`} coat={ORANGE} shade={1} />
              ) : (
                <Fellow variant={m.v} pose={headTurn(POSES.stand(1), 0.7)} at={a.at} scale={a.scale} uid={`f${i}`} coat={tintInk(shadeInk(0.66), t)} ink={tintInk(shadeInk(0.72), t)} shade={1} />
              )}
            </g>
          );
        })}
      </WorldSvg>
    </TexcocoPage>
  );
};
export const LondonDepthProbe: React.FC = () => <Probe cam={{ k: 1.32, cx: 4, cy: -77 }} />;
export const LondonDepthProbeClose: React.FC = () => <Probe cam={{ k: 2.8, cx: 30, cy: -230 }} />;
