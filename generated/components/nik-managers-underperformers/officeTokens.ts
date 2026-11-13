// officeTokens.ts — shared look of the office (nik-managers-underperformers). Values only.
import { COLOR, mixHex } from "../kits/cheeky-pint/stoutShared";
export const OFFICE = {
  /** the wall: context, a warm caramel board tone lit from the upper left, never grey, never near-black */
  wallTop: mixHex(COLOR.board, "#FFF4E2", 0.10),
  wallFoot: mixHex(COLOR.board, COLOR.ground, 0.30),
  /** the soft window-light patch that drifts slowly across the wall (life in a held frame) */
  lightPatch: "#FFF4E2",
  lightPatchOpacity: 0.16,
  /** floor and skirting */
  floor: mixHex(COLOR.ground, COLOR.board, 0.22),
  skirting: mixHex(COLOR.board, COLOR.ground, 0.55),
  /** paper and card objects (the subject): stoutShared cream -> creamFoot; ink = COLOR.inkDark */
  /** key light: from above and slightly left; one union shadow per object in COLOR.shadow */
} as const;
