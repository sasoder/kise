// energyFacts: every displayed figure of scott-nolan-wind comes from here, filled by the director from the blind
// fact-check (full summary with URLs: FACT_CHECK.md in the clip's animation_source/notes/). Final values.

/** Deaths per TWh of electricity (accidents + air pollution). Our World in Data, "Death rates per unit of electricity
 *  production" (Hannah Ritchie), data last revised July 2022, chart data downloaded 2026-11-03. Fossil fuels from
 *  Markandya & Wilkinson (2007); nuclear OWID's own (Chernobyl + Fukushima over 1965-2021 generation); wind and solar
 *  Sovacool et al. (2016). OWID's own chart rounds wind to 0.04; the data value is 0.035. */
export const DEATHS_PER_TWH = { coal: 24.62, oil: 18.43, gas: 2.821, hydro: 1.3, wind: 0.035, nuclear: 0.03, solar: 0.019 } as const;

/** On-screen numerals for DEATHS_PER_TWH (what the graphic prints). */
export const DEATHS_LABEL = { coal: "24.6", gas: "2.8", wind: "0.035", nuclear: "0.03" } as const;

/** Levelized cost of electricity, unsubsidized new build, $/MWh, [low, high]. Lazard LCOE+ July 2026 (press release
 *  13 July 2026). Nuclear is "based on publicly available cost estimates for Vogtle units 3 and 4". */
export const LCOE_USD_MWH = {
  coal: [72, 177],
  gas: [51, 129],
  nuclear: [175, 255],
  wind: [37, 99],
  solar: [40, 98],
} as const;
/** Lazard 2026's stated midpoints, $/MWh. */
export const LCOE_MID = { coal: 125, gas: 90, nuclear: 215, wind: 68, solar: 69 } as const;
export const lcoeMid = (k: keyof typeof LCOE_MID) => LCOE_MID[k];
