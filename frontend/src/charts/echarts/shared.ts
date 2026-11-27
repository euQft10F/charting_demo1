import type {
  EChartsOption,
  LineSeriesOption,
  TooltipComponentOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from 'echarts'
import { format } from 'echarts/core'

import { asUtcDate, formatFullDate } from '@/charts/format'
import type { AxisSide } from '@/lib/axis-side'
import { CHART_THEME } from '@/lib/colors'

const AXIS_LABEL = { color: CHART_THEME.text, fontSize: 12 }
const NO_LINE = { axisLine: { show: false }, axisTick: { show: false } }

/**
 * What every chart starts from: animations off (they make Window changes sluggish at ~1,500 points)
 * and room around the plot, with `containLabel` keeping the axis labels inside it.
 */
export const BASE_OPTION: EChartsOption = {
  animation: false,
  grid: { left: 8, right: 8, top: 8, bottom: 4, containLabel: true },
}

/**
 * What every chart over dates starts from. A native time axis: ECharts picks and formats the date
 * ticks itself, though unlike the other libraries' business-day axes, weekends and holidays take up
 * their share of the width. Dates are UTC timestamps (see `toData`), so the axis formats in UTC.
 * Scroll zooms and dragging pans, as in Lightweight Charts.
 */
export const TIME_SERIES_OPTION: EChartsOption = {
  ...BASE_OPTION,
  useUTC: true,
  dataZoom: [{ type: 'inside' }],
  xAxis: { type: 'time', ...NO_LINE, axisLabel: { ...AXIS_LABEL, hideOverlap: true }, splitLine: { show: false } },
}

/** An ISO date as the UTC timestamp the time axis is plotted in. */
export const toTime = (iso: string) => asUtcDate(iso).getTime()

/** A category axis labelling every category, for the bar charts. */
export const categoryAxis = (categories: string[]): XAXisComponentOption => ({
  type: 'category',
  data: categories,
  ...NO_LINE,
  axisLabel: { ...AXIS_LABEL, interval: 0 },
})

/**
 * A value axis on `side`, with horizontal grid lines unless `grid` is false (a second axis would
 * draw a second, misaligned set). ECharts value axes always include 0 unless `scale` is set.
 */
export function valueAxis(
  side: AxisSide,
  formatLabel: (value: number) => string,
  { grid = true, scale = false }: { grid?: boolean; scale?: boolean } = {},
): YAXisComponentOption & { type: 'value' } {
  return {
    type: 'value',
    position: side,
    ...NO_LINE,
    axisLabel: { ...AXIS_LABEL, formatter: formatLabel },
    splitLine: { show: grid, lineStyle: { color: CHART_THEME.grid } },
    scale,
  }
}

/** About five round values (steps of 1, 2, 2.5 or 5 × 10^k) spanning `min` to `max`. */
function roundTicks(min: number, max: number): number[] {
  const rough = (max - min) / 5
  if (!(rough > 0)) return [min]
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)!
  const ticks: number[] = []
  // Rounded to the step's precision so float error doesn't leak into the labels.
  for (let i = Math.ceil(min / step); i * step <= max; i++) ticks.push(Number((i * step).toPrecision(12)))
  return ticks
}

/**
 * A log value axis on `side`, bounded by the data: Levels are always positive, so it can't reach 0.
 * ECharts only ticks a log axis at powers of 10, which within one Window is often no tick at all, so
 * the ticks (and grid lines) are set to round values between the lowest and highest of `values`.
 * They're fixed for the whole Window, so zooming in can leave few of them in view.
 */
export function logAxis(
  side: AxisSide,
  formatLabel: (value: number) => string,
  values: number[][],
): YAXisComponentOption {
  let min = Infinity
  let max = -Infinity
  for (const series of values) {
    for (const v of series) {
      min = Math.min(min, v)
      max = Math.max(max, v)
    }
  }
  const ticks = roundTicks(min, max)
  return {
    type: 'log',
    position: side,
    ...NO_LINE,
    axisLabel: { ...AXIS_LABEL, formatter: formatLabel, customValues: ticks },
    axisTick: { show: false, customValues: ticks },
    splitLine: { lineStyle: { color: CHART_THEME.grid } },
    min: 'dataMin',
    max: 'dataMax',
  }
}

/**
 * ECharts time-series data from parallel date and value arrays: one `[time, value]` pair per day.
 * ECharts would read a bare `YYYY-MM-DD` as local midnight, so dates go in as UTC timestamps.
 */
export const toData = (dates: string[], values: number[]) =>
  dates.map((date, i): [number, number] => [toTime(date), values[i]])

/** A Level or Drawdown line, keyed by `id` so tooltips can format each series its own way. */
export function lineSeries(id: string, name: string, color: string, data: [number, number][]): LineSeriesOption {
  return { type: 'line', id, name, data, color, showSymbol: false }
}

/** A % area hanging from the 0 line, in one flat fill. */
export const shadedArea = (fill: string): LineSeriesOption['areaStyle'] => ({ color: fill, opacity: 1, origin: 0 })

interface TooltipItem {
  seriesId?: string
  seriesName?: string
  /** A UTC timestamp on the time axis, the category on a category axis. */
  axisValue?: string | number
  value: unknown
  color?: unknown
}

/** The heading: the full date for a time axis's timestamp, the category as it is. */
const headingOf = (axisValue: string | number) =>
  typeof axisValue === 'number' ? formatFullDate(new Date(axisValue).toISOString().slice(0, 10)) : axisValue

/**
 * Tooltip in the dashboard's card style, listing every series at the hovered date or category, in
 * series order. ECharts takes the content as an HTML string, so names are escaped; the Tailwind
 * classes resolve because the tooltip is rendered inside the page.
 */
export function axisTooltip({
  formatValue,
  shadow = false,
}: {
  /** Each value's text; by series id, so one chart can mix Levels and %. */
  formatValue: (value: number, seriesId: string) => string
  /** Highlight the hovered category (bar charts) instead of drawing a line at the hovered date. */
  shadow?: boolean
}): TooltipComponentOption {
  return {
    trigger: 'axis',
    axisPointer: shadow
      ? // Below the series (z 2), so it highlights behind the bars instead of washing them out.
        { type: 'shadow', z: 0, shadowStyle: { color: CHART_THEME.grid, opacity: 0.6 } }
      : undefined,
    // The card styling comes from the formatter's own markup.
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    extraCssText: 'box-shadow: none;',
    formatter: (params) => {
      const items = (Array.isArray(params) ? params : [params]) as TooltipItem[]
      if (!items.length) return ''
      const rows = items.map((item) => {
        // Time series data is `[time, value]`; bar data is the bare value.
        const value = Number(Array.isArray(item.value) ? item.value[1] : item.value)
        return (
          '<div class="flex items-center gap-2">' +
          `<span class="size-2.5 rounded-sm" style="background-color: ${String(item.color)}"></span>` +
          `<span>${format.encodeHTML(item.seriesName ?? '')}</span>` +
          `<span class="ml-auto pl-4 tabular-nums">${formatValue(value, item.seriesId ?? '')}</span>` +
          '</div>'
        )
      })
      return (
        '<div class="rounded-md border bg-card px-3 py-2 text-sm text-card-foreground shadow-md">' +
        `<div class="mb-1 font-medium">${format.encodeHTML(String(headingOf(items[0].axisValue ?? '')))}</div>` +
        rows.join('') +
        '</div>'
      )
    },
  }
}
