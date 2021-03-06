/**
 * @file Define the parameters for the activity's chart.
 */
define({
  yLimitsUSD: {
    label: 'y-axis limits ($USD)',
    min: 0,
    max: 280000,
    step: 1000
  },
  yLimitsPct: {
    label: 'y-axis limits (% change)',
    min: 0,
    max: 1.3,
    step: 0.01
  },
  xLimits: {
    label: 'x-axis limits (year)',
    min: 1960,
    max: 2013,
    step: 1
  },
  yUnit: {
    label: 'y-axis unit',
    dflt: 'USD',
    values: {
      Pct: '% change in USD',
      USD: 'Real GDP per capita ($USD)'
    }
  }
});
