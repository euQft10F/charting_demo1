import type {
  DataZoomComponentOption,
  GridComponentOption,
  LineSeriesOption,
  TooltipComponentOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from 'echarts'
import { format } from 'echarts/core'

import type { AxisSide } from '@/lib/axis-side'
import { CHART_THEME } from '@/lib/colors'

/** Room around the plot; `containLabel` keeps the axis labels inside it. */
export const GRID: GridComponentOption = { left: 8, right: 8, top: 8, bottom: 4, containLabel: true }

/** Scroll to zoom and drag to pan the time axis, as in Lightweight Charts. */
export const ZOOM: DataZoomComponentOption[] = [{ type: 'inside' }]

const AXIS_LABEL = { color: CHART_THEME.text, fontSize: 12 }
const NO_LINE = { axisLine: { show: false }, axisTick: { show: false } }

/**
 * A native time axis: ECharts picks and formats the date ticks itself. Unlike the other libraries'
 * business-day axes, weekends and holidays take up their share of the width.
 */
export const dateAxis = (): XAXisComponentOption => ({
  type: 'time',
  ...NO_LINE,
  axisLabel: { ...AXIS_LABEL, hideOverlap: true },
  splitLine: { show: false },
})

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
 * the ticks (and grid lines) are set to round values between the lowest and highest of `values`. They're fixed for the
 * whole Window, so zooming in can leave few of them in view.
 */
export function logAxis(
  side: AxisSide,
  formatLabel: (value: number) => string,
  values: number[][],
): YAXisComponentOption {
  const all = values.flat()
  const ticks = roundTicks(Math.min(...all), Math.max(...all))
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

/** ECharts time-series data from parallel date and value arrays: one `[date, value]` pair per day. */
export const toData = (dates: string[], values: number[]) => dates.map((date, i): [string, number] => [date, values[i]])

/** A Level or Drawdown line, keyed by `id` so tooltips can format each series its own way. */
export function lineSeries(id: string, name: string, color: string, data: [string, number][]): LineSeriesOption {
  return { type: 'line', id, name, data, color, lineStyle: { width: 2 }, showSymbol: false }
}

/** A % area hanging from the 0 line, in one flat fill. */
export const shadedArea = (fill: string): LineSeriesOption['areaStyle'] => ({ color: fill, opacity: 1, origin: 0 })

interface TooltipItem {
  seriesId?: string
  seriesName?: string
  name: string
  value: unknown
  color?: unknown
}

/**
 * Tooltip in the dashboard's card style, listing every series at the hovered date or category, in
 * series order. ECharts takes the content as an HTML string, so names are escaped; the Tailwind
 * classes resolve because the tooltip is rendered inside the page.
 */
export function axisTooltip({
  formatLabel = (label) => label,
  formatValue,
  shadow = false,
}: {
  /** The heading, from the date or category under the pointer. */
  formatLabel?: (label: string) => string
  /** Each value's text; by series id, so one chart can mix Levels and %. */
  formatValue: (value: number, seriesId: string) => string
  /** Highlight the hovered category (bar charts) instead of drawing a line at the hovered date. */
  shadow?: boolean
}): TooltipComponentOption {
  return {
    trigger: 'axis',
    axisPointer: shadow ? { type: 'shadow', shadowStyle: { color: CHART_THEME.grid, opacity: 0.6 } } : { type: 'line' },
    // The card styling comes from the formatter's own markup.
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    extraCssText: 'box-shadow: none;',
    formatter: (params) => {
      const items = (Array.isArray(params) ? params : [params]) as TooltipItem[]
      if (!items.length) return ''
      // Time series data is `[date, value]`; bar data is the bare value, with the category as name.
      const [first] = items
      const label = Array.isArray(first.value) ? String(first.value[0]) : first.name
      const rows = items.map((item) => {
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
        `<div class="mb-1 font-medium">${format.encodeHTML(formatLabel(label))}</div>` +
        rows.join('') +
        '</div>'
      )
    },
  }
}
