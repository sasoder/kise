// Probe of the shared world (kidsShared): Kid on a Stool at a Desk with a Laptop, Friends, Adults, Laptop views.
import React from "react";
import { AbsoluteFill } from "remotion";
import { StoutStage } from "../kits/cheeky-pint/stoutShared";
import { Adult, Desk, Friend, Kid, Laptop, Stool, laptopFrame, worldToLocal } from "./kidsShared";

const cam = { x: 540, y: 960, k: 1 };
export const KidsProbe: React.FC = () => {
  const lap = { x: 700, y: 640, w: 320, yaw: 30 };
  const F = laptopFrame(lap);
  const kid = { x: 372, y: 760, scale: 1.3 };
  return (
    <AbsoluteFill>
      <StoutStage S={0} cam={cam} pool={{ x: 540, y: 760 }} sway={false}>
        <Stool x={kid.x - 10} seatY={kid.y} floorY={1130} w={170} shadow />
        <Desk x0={470} x1={1020} y={620} floorY={1130} shadow />
        <Laptop {...lap} shadow />
        <Kid {...kid} hand={worldToLocal(F.deck(0.3, 0.8), kid)} farHand={worldToLocal(F.deck(0.55, 0.7), kid)} swing={18} swingFar={-8} tongue={1} headTilt={6} shadow />
        {/* friends */}
        <Friend x={150} y={1290} scale={0.8} variant={0} legs="stand" smile={1} shadow />
        <Friend x={330} y={1290} scale={0.8} variant={1} legs="stand" happy={1} smile={1} shadow />
        <Friend x={510} y={1290} scale={0.8} variant={2} legs="stand" mouth={0.7} shadow facing={-1} />
        <Friend x={690} y={1290} scale={0.8} variant={3} legs="stand" smile={0.7} shadow facing={-1} />
        <Kid x={870} y={1290} scale={0.8} legs="stand" smile={1} mouth={0.5} shadow facing={-1} />
        {/* adults */}
        {[0, 1, 2, 3, 4, 5].map((v) => (
          <Adult key={v} x={110 + v * 172} y={1660} scale={0.72} variant={v} shadow facing={v % 2 ? -1 : 1} />
        ))}
        {/* laptop views */}
        <Laptop x={170} y={250} w={200} yaw={0} pitch={10} shadow />
        <Laptop x={440} y={250} w={200} yaw={90} shadow />
        <Laptop x={720} y={250} w={200} yaw={130} shadow />
        <Laptop x={950} y={250} w={160} yaw={-30} shadow />
      </StoutStage>
    </AbsoluteFill>
  );
};
