import type {
  BaselineSeriesPartialOptions,
  ChartOptions,
  DeepPartial,
  PriceScaleOptions,
} from 'lightweight-charts'

import { CHART_THEME } from '@/lib/colors'

/** Lightweight Charts time-series data from parallel date and value arrays. */
export const toData = (dates: string[], values: number[]) =>
  dates.map((time, i) => ({ time, value: values[i] }))

/** The themed chart every Lightweight Charts renderer starts from; `scale` applies to both value axes. */
export function themedChartOptions(scale: DeepPartial<PriceScaleOptions> = {}): DeepPartial<ChartOptions> {
  return {
    autoSize: true,
    layout: {
      background: { color: CHART_THEME.background },
      textColor: CHART_THEME.text,
      attributionLogo: false,
    },
    grid: { vertLines: { visible: false }, horzLines: { color: CHART_THEME.grid } },
    rightPriceScale: { borderVisible: false, visible: true, ...scale },
    leftPriceScale: { borderVisible: false, visible: true, ...scale },
    // Keep the same dates in view when the chart is resized (by default it keeps the bar spacing and
    // shows fewer dates), so a chart reused in a narrower compare panel still shows its whole Window.
    timeScale: { borderVisible: false, lockVisibleTimeRangeOnResize: true },
  }
}

/** A percent-valued area hanging from the 0 line: one line colour, one flat fill, either side of 0. */
export function shadedAreaOptions(line: string, fill: string, lineWidth: 1 | 2): BaselineSeriesPartialOptions {
  return {
    baseValue: { type: 'price', price: 0 },
    topLineColor: line,
    topFillColor1: fill,
    topFillColor2: fill,
    bottomLineColor: line,
    bottomFillColor1: fill,
    bottomFillColor2: fill,
    lineWidth,
    priceFormat: { type: 'percent' },
    priceLineVisible: false,
  }
}
