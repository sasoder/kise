import React from "react";

/**
 * User note (Nov 12): bring every wip-biblical graphic down "ever so slightly, like 1 cm". One value for all eight cuts,
 * so joined cuts (16 -> 23, 43 -> 73, 0 -> 86 and 86's point in 73) stay matched on screen.
 */
export const BIBLICAL_SHIFT_Y = 100;

/**
 * Moves its children down by BIBLICAL_SHIFT_Y screen px. Put it INSIDE WipFilmLife (so the grain stays put) and around
 * BOTH the PaperGround and the ink layers: the transform makes this an isolated blend group, so the paper must be inside
 * it for multiply to keep printing onto the paper. No overflow clip, so the paper sheet (2200x3800) still fills the top
 * strip; check that the top 100 px show paper texture, not a flat band.
 */
export const ShiftDown: React.FC<{ children?: React.ReactNode; y?: number }> = ({ children, y = BIBLICAL_SHIFT_Y }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", transform: `translateY(${y}px)` }}>
    {children}
  </div>
);
