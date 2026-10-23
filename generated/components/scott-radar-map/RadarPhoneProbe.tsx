// Probe stills for the shared radarPhone prop (scott-radar-map): f0 the phone at full size (radar variant, swept),
// f1 the phone at ~200 and ~260 px wide (plain and radar, cut 3's size), f2 the radar map alone big, f3 the sweep part-way.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { PHONE_H, PHONE_W, Phone, RadarMap } from "./radarPhone";

export const FPS = 24000 / 1001;
export const DURATION = 4;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const BG = "#B79A78";
const RadarPhoneProbe: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: f === 1 ? COLOR.ground : BG }}>
      {f === 0 ? (
        <div style={{ position: "absolute", left: (1080 - PHONE_W) / 2, top: 120 }}>
          <Phone variant="radar" drift={40} sun={0} />
        </div>
      ) : null}
      {f === 1 ? (
        <>
          {[0.256, 0.333, 0.333].map((sc, i) => (
            <div key={i} style={{ position: "absolute", left: [60, 360, 700][i], top: 600 }}>
              <Phone variant={i === 1 ? "plain" : "radar"} scale={sc} drift={40} res={0.5} id={`p${i}`} />
            </div>
          ))}
          <div style={{ position: "absolute", left: 90, top: 1450 }}>
            <RadarMap width={260} drift={40} res={0.5} />
          </div>
          <div style={{ position: "absolute", left: 400, top: 1450 }}>
            <RadarMap width={200} drift={40} res={0.5} />
          </div>
        </>
      ) : null}
      {f === 2 ? (
        <div style={{ position: "absolute", left: 40, top: 600 }}>
          <RadarMap width={1000} drift={40} />
        </div>
      ) : null}
      {f === 3 ? (
        <div style={{ position: "absolute", left: 40, top: 600 }}>
          <RadarMap width={1000} drift={20} reveal={0.3} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 20, top: 20, color: COLOR.inkCream, fontSize: 28 }}>{PHONE_H > 0 ? `probe f${f}` : ""}</div>
    </AbsoluteFill>
  );
};
export default RadarPhoneProbe;
