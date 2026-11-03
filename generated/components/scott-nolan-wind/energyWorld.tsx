// ENERGY_WORLD
// ===================================================================================================================
// energyWorld: the shared 3D world of scott-nolan-wind (Cheeky Pint S4E04, Scott Nolan, "nuclear is safer than wind
// power"), on nuclearWorld (scott-nolan-uranium): the espresso board, cream clay under one key light from the upper
// left, one soft shadow per object, amber = nuclear. RENDER EVERY CUT WITH --gl=angle.
//
// WORLD UNITS: X right, Y up (board = 0), Z away from the camera. The row runs along X at Z = 0.
// API: see ENERGY_WORLD_READY.md in the clip's notes folder. Summary:
//   LINEUP, PLANTS, PLINTH, ROW_PITCH, APRON, SLOT, SOCKET, plinthTopOf(kind), slotOf(kind), socketOf(kind)
//   <Lineup S only? dim? lift? smoke? spin? glint?>    the five plants on their plinths, one shadow layer
//   <Plant kind S dim? lift? smoke? spin? glint? shadow?>  one of them
//   <Smoke at S kind? amount? seed?>                    a plume (coal: brown-grey smoke, gas: pale haze)
//   <DataCenter S lit? dim? shadow?>, DC, DC_AT, DC_OUTLET
//   <PowerCable end dir roll? current? from? rise? lead? shadow?>, PLUG, CABLE_R, cablePoints(...)
//   <PlinthColumn kind rise height level fill? camF rung? order?>, columnShadowItems(...), COLUMN
//   <PlantLabels only? dim? shadow?>, LABEL, LABEL_TEXT, labelFootOf, labelTopOf, labelWidthOf, labelShadowItems (opt-in)
//   CUT_A_END_CAM, CUT_A_PLUG_END (cut A's resolved camera and plug, where cut C opens)
// ===================================================================================================================
export * from "./energyCore";
export * from "./energyPlants";
export * from "./energyDataCenter";
export * from "./energyColumn";
export * from "./energyLabels";
export * from "./cutAState";
