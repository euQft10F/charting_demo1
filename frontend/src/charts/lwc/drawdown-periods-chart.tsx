import {
  createChart,
  LineSeries,
  type IChartApi,
  type IPrimitivePaneRenderer,
  type ISeriesApi,
  type ISeriesPrimitive,
  type SeriesAttachedParameter,
  type Time,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'

import { themedChartOptions, toData } from '@/charts/lwc/shared'
import type { DrawdownPeriodsChartProps } from '@/charts/types'
import type { DrawdownPeriod } from '@/lib/api'
import { oppositeSide } from '@/lib/axis-side'
import { CHART_THEME } from '@/lib/colors'

interface ChartHandles {
  chart: IChartApi
  benchmark: ISeriesApi<'Line'>
  strategy: ISeriesApi<'Line'>
  bands: PeriodBands
}

type Target = Parameters<IPrimitivePaneRenderer['draw']>[0]

/** Series primitive shading each Drawdown Period as a full-height band, behind the series. */
class PeriodBands implements ISeriesPrimitive<Time> {
  private periods: DrawdownPeriod[] = []
  private attachedTo?: SeriesAttachedParameter<Time>
  private readonly views = [
    { zOrder: () => 'bottom' as const, renderer: () => ({ draw: (t: Target) => this.draw(t) }) },
  ]

  attached(param: SeriesAttachedParameter<Time>) {
    this.attachedTo = param
  }

  detached() {
    this.attachedTo = undefined
  }

  setPeriods(periods: DrawdownPeriod[]) {
    this.periods = periods
    this.attachedTo?.requestUpdate()
  }

  paneViews() {
    return this.views
  }

  private draw(target: Target) {
    const timeScale = this.attachedTo?.chart.timeScale()
    if (!timeScale) return
    target.useBitmapCoordinateSpace(({ context, horizontalPixelRatio, bitmapSize }) => {
      context.fillStyle = CHART_THEME.periodBand
      for (const { start, end } of this.periods) {
        const x1 = timeScale.timeToCoordinate(start as Time)
        const x2 = timeScale.timeToCoordinate(end as Time)
        // A Period whose dates are not on the chart (mid-refresh) is simply not drawn.
        if (x1 === null || x2 === null) continue
        const left = Math.round(x1 * horizontalPixelRatio)
        context.fillRect(left, 0, Math.round(x2 * horizontalPixelRatio) - left, bitmapSize.height)
      }
    })
  }
}

/** Lightweight Charts renderer for the Drawdown Periods Chart: both Levels with shaded Periods. */
export function DrawdownPeriodsChart({
  dates,
  benchmark,
  strategy,
  periods,
  axisSide,
}: DrawdownPeriodsChartProps) {
  const container = useRef<HTMLDivElement>(null)
  const handles = useRef<ChartHandles>(null)

  useEffect(() => {
    const chart = createChart(container.current!, themedChartOptions())
    const benchmarkSeries = chart.addSeries(LineSeries, { color: CHART_THEME.benchmark, lineWidth: 2 })
    const bands = new PeriodBands()
    benchmarkSeries.attachPrimitive(bands)
    handles.current = {
      chart,
      benchmark: benchmarkSeries,
      strategy: chart.addSeries(LineSeries, { color: CHART_THEME.strategy, lineWidth: 2 }),
      bands,
    }
    return () => {
      chart.remove()
      handles.current = null
    }
  }, [])

  useEffect(() => {
    const h = handles.current
    if (!h) return
    h.benchmark.applyOptions({ priceScaleId: axisSide })
    h.strategy.applyOptions({ priceScaleId: axisSide })
    // Only the Level axis is shown; the other edge stays empty.
    h.chart.priceScale(axisSide).applyOptions({ visible: true })
    h.chart.priceScale(oppositeSide(axisSide)).applyOptions({ visible: false })
  }, [axisSide])

  useEffect(() => {
    handles.current?.benchmark.setData(toData(dates, benchmark))
  }, [dates, benchmark])
  useEffect(() => {
    handles.current?.strategy.setData(toData(dates, strategy))
  }, [dates, strategy])
  useEffect(() => {
    handles.current?.bands.setPeriods(periods)
  }, [periods])

  // Refit the time axis only when the Window changes, not on Rebase.
  useEffect(() => {
    handles.current?.chart.timeScale().fitContent()
  }, [dates])

  return <div ref={container} className="h-full w-full" />
}
