/** The single source of chart colours, shared by every Charting Library renderer and the legend. */
export const CHART_THEME = {
  strategy: '#d0202e',
  benchmark: '#8a8a8a',
  /** Drawdown Chart areas: the Benchmark grey and Strategy red, see-through so they can overlay. */
  benchmarkFill: 'rgba(138, 138, 138, 0.4)',
  strategyFill: 'rgba(208, 32, 46, 0.3)',
  /** Drawdown Periods Chart bands: the Benchmark grey, light enough to sit behind the Level lines. */
  periodBand: 'rgba(138, 138, 138, 0.22)',
  /** Cumulative Difference: shaded area, so kept light enough to sit behind the Level lines. */
  difference: '#3b82c4',
  differenceFill: 'rgba(59, 130, 196, 0.25)',
  background: '#ffffff',
  text: '#444444',
  grid: '#eeeeee',
}
