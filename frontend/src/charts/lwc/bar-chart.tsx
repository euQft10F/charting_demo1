import {
  createChart,
  customSeriesDefaultOptions,
  type CustomData,
  type CustomSeriesOptions,
  type CustomSeriesWhitespaceData,
  type ICustomSeriesPaneRenderer,
  type ICustomSeriesPaneView,
  type ISeriesApi,
  type PaneRendererCustomData,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'

import { themedChartOptions } from '@/charts/lwc/shared'
import type { AxisSide } from '@/lib/axis-side'

export interface BarChartProps {
  /** One label per group of bars, left to right. */
  categories: string[]
  /** One bar per series in every category; `values[i]` belongs to `categories[i]`. */
  series: { color: string; values: number[] }[]
  /** The side the value axis sits on. */
  axisSide: AxisSide
}

/** Fraction of each category's width taken by its group of bars; the rest is the gap between groups. */
const GROUP_FILL = 0.7

/**
 * Lightweight Charts has no category axis, so category `i` sits on the stand-in time point
 * `i` days after an arbitrary start, and the time axis labels those points with the categories.
 */
const DAY = 24 * 60 * 60
const FIRST_TIME = Date.UTC(2000, 0, 1) / 1000

const timeOf = (index: number) => (FIRST_TIME + index * DAY) as UTCTimestamp
const indexOf = (time: Time) => Math.round(((time as number) - FIRST_TIME) / DAY)

interface GroupedBarData extends CustomData<Time> {
  /** The value of each series in this category. */
  values: number[]
}

interface GroupedBarOptions extends CustomSeriesOptions {
  /** Fill colour of each series' bar. */
  colors: string[]
}

/** Custom series drawing one group of side-by-side bars, one per series, at every time point. */
class GroupedBarsView implements ICustomSeriesPaneView<Time, GroupedBarData, GroupedBarOptions> {
  private data: PaneRendererCustomData<Time, GroupedBarData> | null = null
  private options: GroupedBarOptions | null = null

  private readonly paneRenderer: ICustomSeriesPaneRenderer = {
    draw: (target, priceConverter) => {
      const { data, options } = this
      const range = data?.visibleRange
      if (!data || !range || !options) return
      target.useBitmapCoordinateSpace(({ context, horizontalPixelRatio: hr, verticalPixelRatio: vr }) => {
        const zero = priceConverter(0)
        if (zero === null) return
        const groupWidth = data.barSpacing * GROUP_FILL * hr
        for (let i = range.from; i <= range.to; i++) {
          const bar = data.bars[i]
          if (!bar) continue
          const { values } = bar.originalData
          const barWidth = groupWidth / values.length
          const left = bar.x * hr - groupWidth / 2
          values.forEach((value, j) => {
            const y = priceConverter(value)
            if (y === null) return
            const x0 = Math.round(left + j * barWidth)
            const x1 = Math.round(left + (j + 1) * barWidth)
            const top = Math.round(Math.min(y, zero) * vr)
            const bottom = Math.round(Math.max(y, zero) * vr)
            context.fillStyle = options.colors[j]
            context.fillRect(x0, top, x1 - x0, Math.max(bottom - top, 1))
          })
        }
      })
    },
  }

  renderer() {
    return this.paneRenderer
  }

  update(data: PaneRendererCustomData<Time, GroupedBarData>, options: GroupedBarOptions) {
    this.data = data
    this.options = options
  }

  /** The bars grow from zero, so the value axis always includes it. */
  priceValueBuilder({ values }: GroupedBarData) {
    return [Math.max(0, ...values), Math.min(0, ...values)]
  }

  isWhitespace(data: GroupedBarData | CustomSeriesWhitespaceData<Time>): data is CustomSeriesWhitespaceData<Time> {
    return (data as GroupedBarData).values === undefined
  }

  defaultOptions(): GroupedBarOptions {
    return { ...customSeriesDefaultOptions, colors: [] }
  }
}

/**
 * Lightweight Charts renderer for category bar charts: grouped bars with the categories as axis
 * labels. Values are percentages (the axis is formatted as %), so callers convert fractions
 * first. Reused by every chart whose data is `{ categories, series }` of percentages.
 */
export function BarChart({ categories, series, axisSide }: BarChartProps) {
  const container = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart>>(null)
  const barsRef = useRef<ISeriesApi<'Custom', Time, GroupedBarData | CustomSeriesWhitespaceData<Time>, GroupedBarOptions>>(null)
  // The time axis reads the latest categories without recreating the chart.
  const labels = useRef(categories)
  useEffect(() => {
    labels.current = categories
  }, [categories])

  useEffect(() => {
    const label = (time: Time) => labels.current[indexOf(time)] ?? ''
    const chart = createChart(container.current!, {
      ...themedChartOptions(),
      timeScale: { borderVisible: false, tickMarkFormatter: label },
      localization: { timeFormatter: label },
      handleScroll: false,
      handleScale: false,
    })
    chartRef.current = chart
    barsRef.current = chart.addCustomSeries(new GroupedBarsView(), {
      priceFormat: { type: 'percent' },
      priceLineVisible: false,
      lastValueVisible: false,
    })
    return () => {
      chart.remove()
      chartRef.current = null
      barsRef.current = null
    }
  }, [])

  useEffect(() => {
    barsRef.current?.applyOptions({ priceScaleId: axisSide })
    chartRef.current?.priceScale('right').applyOptions({ visible: axisSide === 'right' })
    chartRef.current?.priceScale('left').applyOptions({ visible: axisSide === 'left' })
  }, [axisSide])

  useEffect(() => {
    // Typed separately: the series API's option type doesn't know about the custom `colors`.
    const options: Partial<GroupedBarOptions> = { colors: series.map((s) => s.color) }
    barsRef.current?.applyOptions(options)
    barsRef.current?.setData(
      categories.map((_, i) => ({ time: timeOf(i), values: series.map((s) => s.values[i]) })),
    )
    chartRef.current?.timeScale().fitContent()
  }, [categories, series])

  return <div ref={container} className="h-full w-full" />
}
