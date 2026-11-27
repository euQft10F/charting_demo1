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
import { useEffect, useRef, useState } from 'react'

import { formatBarValue } from '@/charts/format'
import { themedChartOptions } from '@/charts/lwc/shared'
import type { BarChartProps } from '@/charts/types'

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
  // The category under the pointer, and where to put its tooltip; null when the pointer is off the chart.
  const [hover, setHover] = useState<{ index: number; x: number; flip: boolean } | null>(null)
  const container = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof createChart>>(null)
  const barsRef = useRef<ISeriesApi<'Custom', Time, GroupedBarData | CustomSeriesWhitespaceData<Time>, GroupedBarOptions>>(null)
  useEffect(() => {
    const chart = createChart(container.current!, {
      ...themedChartOptions(),
      handleScroll: false,
      handleScale: false,
    })
    chartRef.current = chart
    chart.subscribeCrosshairMove(({ time, point }) => {
      if (time === undefined || !point) return setHover(null)
      setHover({ index: indexOf(time), x: point.x, flip: point.x > container.current!.clientWidth / 2 })
    })
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
    // The time axis labels each stand-in time with its category; set with the data so it always
    // reads these categories. The default label width estimate is 8 characters; long categories
    // need room or get overlapped.
    const label = (time: Time) => categories[indexOf(time)] ?? ''
    chartRef.current?.applyOptions({
      localization: { timeFormatter: label },
      timeScale: {
        tickMarkFormatter: label,
        tickMarkMaxCharacterLength: Math.max(8, ...categories.map((c) => c.length)),
      },
    })
    chartRef.current?.timeScale().fitContent()
  }, [categories, series])

  const shown = hover && categories[hover.index] !== undefined ? hover : null
  return (
    <div className="relative h-full w-full">
      <div ref={container} className="h-full w-full" />
      {shown && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-md border bg-card px-3 py-2 text-sm shadow-md"
          style={{ left: shown.x, transform: `translateX(${shown.flip ? 'calc(-100% - 12px)' : '12px'})` }}
        >
          <div className="mb-1 font-medium">{categories[shown.index]}</div>
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              <span>{s.name}</span>
              <span className="ml-auto pl-4 tabular-nums">{formatBarValue(s.values[shown.index])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
