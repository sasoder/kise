// ---------------------------------------------------------------------------
// youthUnemploymentData -- the monthly series behind YouthUnemploymentTwentyPlus.
//
// SOURCE: NBS National Data portal (data.stats.gov.cn), monthly urban surveyed
// unemployment rate, ages 16–24, old methodology incl. students, Jan 2018 –
// Jun 2023; verified 2026-10-09; copy at
// out/jordan-hu/youth_unemployment_verified.json
//
// Percent, one row per year, January -> December (2023 ends in June, the last
// month published under the old methodology). A correction is a one-number
// edit here: the path, the peaks, the kiss, the crossing frame and the readout
// are all derived from this array (youthUnemploymentGeom.ts), never typed.
// Notes on the shape: the series low is May 2018 (9.6); July and August 2020
// are BOTH 16.8 (a two-month plateau, kept flat); the pre-2023 high is July
// 2022 (19.9); the first month above 20 % is April 2023 (20.4).
// ---------------------------------------------------------------------------

/** the first month of the series */
export const START_YEAR = 2018;
export const START_MONTH = 1;

export const YOUTH_UNEMPLOYMENT_BY_YEAR: number[][] = [
  /* 2018 */ [11.2, 11.0, 10.4, 10.1, 9.6, 10.0, 13.3, 13.1, 11.2, 9.8, 10.0, 10.1],
  /* 2019 */ [11.2, 11.0, 11.3, 9.9, 10.5, 11.6, 13.9, 13.1, 13.0, 12.4, 12.5, 12.2],
  /* 2020 */ [12.5, 13.6, 13.3, 13.8, 14.8, 15.4, 16.8, 16.8, 15.0, 13.2, 12.8, 12.3],
  /* 2021 */ [12.7, 13.1, 13.6, 13.6, 13.8, 15.4, 16.2, 15.3, 14.6, 14.2, 14.3, 14.3],
  /* 2022 */ [15.3, 15.3, 16.0, 18.2, 18.4, 19.3, 19.9, 18.7, 17.9, 17.9, 17.1, 16.7],
  /* 2023 */ [17.3, 18.1, 19.6, 20.4, 20.8, 21.3],
];

/** the series as one plain array, index 0 = January 2018 */
export const YOUTH_UNEMPLOYMENT: number[] = YOUTH_UNEMPLOYMENT_BY_YEAR.flat();

/** the reference level the spoken line names ("20 plus percent") */
export const REFERENCE_PCT = 20;
/** the one scale hairline */
export const SCALE_PCT = 10;
