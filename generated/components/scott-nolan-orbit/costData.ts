// costData: the two price series of scott-nolan-orbit's cost-curve chart (cuts A BothComingDown and B BelieveTheSolarCurve).
// Copied row for row from the director's fact-check data (notes/data/, retrieved 2026-11-04); never recalled.
//
// SOLAR: Our World in Data, "Solar photovoltaic panel prices" (solar-pv-prices.csv, column "Solar PV module cost"),
//   constant 2025 US$ per watt, module only. Underlying: Nemet (2009) 1975-2003, Farmer & Lafond (2016) 2004-2009,
//   IRENA Renewable Power Generation Costs 2024 / 2025 from 2010. 1975 $132.38/W -> 2025 $0.12/W.
// BATTERIES: BloombergNEF lithium-ion battery pack price survey, volume-weighted average, real 2025 US$/kWh
//   (bnef_battery_pack_prices_real2025.csv): 2010 $1,474 (BNEF, Figure-17 alt text) and 2025 $108 (press release
//   9 Dec 2025) are stated; 2011-2023 are read off BNEF's Figure-17 pixels (+/- ~10 $/kWh), 2024 implied by the stated
//   8 % drop. Good for the shape only: never show these as numbers.
// On screen: no prices, no y numbers. Each series is plotted as an index of its own 2010 value on one log scale.

export type Series = "solar" | "battery";

/** OWID solar PV module price, constant 2025 US$/W, one row per year 1975-2025 */
export const SOLAR_USD_PER_W: [number, number][] = [
  [1975, 132.3757], [1976, 99.59758], [1977, 72.66112], [1978, 51.408165], [1979, 43.19512],
  [1980, 36.604977], [1981, 29.266363], [1982, 26.295176], [1983, 21.2281], [1984, 19.725023],
  [1985, 17.220385], [1986, 14.24468], [1987, 12.110387], [1988, 11.311608], [1989, 11.690053],
  [1990, 12.091146], [1991, 11.200797], [1992, 10.435116], [1993, 9.758667], [1994, 9.231527],
  [1995, 8.535535], [1996, 7.9798346], [1997, 7.952008], [1998, 7.165558], [1999, 6.6192613],
  [2000, 6.495887], [2001, 6.284449], [2002, 5.747254], [2003, 5.463806], [2004, 4.695495],
  [2005, 4.7456656], [2006, 5.172746], [2007, 5.211057], [2008, 4.7491965], [2009, 3.1742926],
  [2010, 2.5118067], [2011, 2.060892], [2012, 1.1107162], [2013, 0.85660523], [2014, 0.79053074],
  [2015, 0.7357285], [2016, 0.6802508], [2017, 0.57135326], [2018, 0.5090506], [2019, 0.46694848],
  [2020, 0.32486692], [2021, 0.34456873], [2022, 0.36692584], [2023, 0.2734925], [2024, 0.1330806],
  [2025, 0.12021687],
];

/** BNEF Li-ion pack price, real 2025 US$/kWh, 2010-2025 (2011-2024 digitized / implied: shape only) */
export const BATTERY_USD_PER_KWH: [number, number][] = [
  [2010, 1474], [2011, 1145], [2012, 903], [2013, 832], [2014, 734], [2015, 481], [2016, 370], [2017, 279],
  [2018, 229], [2019, 198], [2020, 174], [2021, 165], [2022, 174], [2023, 152], [2024, 117], [2025, 108],
];

export const INDEX_YEAR = 2010;
const toIndex = (rows: [number, number][]): [number, number][] => {
  const base = rows.find((r) => r[0] === INDEX_YEAR);
  if (!base) throw new Error("costData: no 2010 row");
  return rows.map(([y, v]) => [y, v / base[1]]);
};
/** each series as [year, price / its own 2010 price] */
export const INDEXED: Record<Series, [number, number][]> = {
  solar: toIndex(SOLAR_USD_PER_W),
  battery: toIndex(BATTERY_USD_PER_KWH),
};
/** first and last data year of each series */
export const SPAN: Record<Series, [number, number]> = {
  solar: [SOLAR_USD_PER_W[0][0], SOLAR_USD_PER_W[SOLAR_USD_PER_W.length - 1][0]],
  battery: [BATTERY_USD_PER_KWH[0][0], BATTERY_USD_PER_KWH[BATTERY_USD_PER_KWH.length - 1][0]],
};
