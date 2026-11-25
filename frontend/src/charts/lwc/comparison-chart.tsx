import {
  BaselineSeries,
  createChart,
  LineSeries,
  PriceScaleMode,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'

import { shadedAreaOptions, themedChartOptions, toData } from '@/charts/lwc/shared'
import { oppositeSide, type AxisSide } from '@/lib/axis-side'
import { CHART_THEME } from '@/lib/colors'

export interface ComparisonChartProps {
  dates: string[]
  /** Benchmark Levels, rebased or raw. */
  benchmark: number[]
  /** Strategy Levels, rebased or raw. */
  strategy: number[]
  /** Cumulative Difference in %. */
  difference: number[]
  /** Log (true) or linear (false) Level axis. */
  logScale: boolean
  /** The side the Level axis sits on; the Cumulative Difference axis takes the other. */
  axisSide: AxisSide
}

interface ChartHandles {
  chart: IChartApi
  benchmark: ISeriesApi<'Line'>
  strategy: ISeriesApi<'Line'>
  difference: ISeriesApi<'Baseline'>
}

/** Lightweight Charts renderer for the Comparison Chart: Levels plus the Cumulative Difference. */
export function ComparisonChart({
  dates,
  benchmark,
  strategy,
  difference,
  logScale,
  axisSide,
}: ComparisonChartProps) {
  const container = useRef<HTMLDivElement>(null)
  const handles = useRef<ChartHandles>(null)

  useEffect(() => {
    const chart = createChart(container.current!, themedChartOptions())
    // Added first so the Level lines draw on top of the shaded area.
    const differenceSeries = chart.addSeries(
      BaselineSeries,
      shadedAreaOptions(CHART_THEME.difference, CHART_THEME.differenceFill, 1),
    )
    handles.current = {
      chart,
      difference: differenceSeries,
      benchmark: chart.addSeries(LineSeries, { color: CHART_THEME.benchmark, lineWidth: 2 }),
      strategy: chart.addSeries(LineSeries, { color: CHART_THEME.strategy, lineWidth: 2 }),
    }
    return () => {
      chart.remove()
      handles.current = null
    }
  }, [])

  // Axis Side and log/linear only change options, so the zoom and Window are left alone.
  useEffect(() => {
    const h = handles.current
    if (!h) return
    const differenceSide = oppositeSide(axisSide)
    h.benchmark.applyOptions({ priceScaleId: axisSide })
    h.strategy.applyOptions({ priceScaleId: axisSide })
    h.difference.applyOptions({ priceScaleId: differenceSide })
    h.chart
      .priceScale(axisSide)
      .applyOptions({ mode: logScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal })
    h.chart.priceScale(differenceSide).applyOptions({ mode: PriceScaleMode.Normal })
  }, [axisSide, logScale])

  // One effect per series, so toggling Rebase only replaces the two Level series.
  useEffect(() => {
    handles.current?.benchmark.setData(toData(dates, benchmark))
  }, [dates, benchmark])
  useEffect(() => {
    handles.current?.strategy.setData(toData(dates, strategy))
  }, [dates, strategy])
  useEffect(() => {
    handles.current?.difference.setData(toData(dates, difference))
  }, [dates, difference])

  // Refit the time axis only when the Window changes, not on Rebase.
  useEffect(() => {
    handles.current?.chart.timeScale().fitContent()
  }, [dates])

  return <div ref={container} className="h-full w-full" />
}
