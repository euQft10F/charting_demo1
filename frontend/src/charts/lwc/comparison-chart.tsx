import {
  BaselineSeries,
  createChart,
  LineSeries,
  PriceScaleMode,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'

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

const toData = (dates: string[], values: number[]) => dates.map((time, i) => ({ time, value: values[i] }))

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
    const chart = createChart(container.current!, {
      autoSize: true,
      layout: {
        background: { color: CHART_THEME.background },
        textColor: CHART_THEME.text,
        attributionLogo: false,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: CHART_THEME.grid } },
      rightPriceScale: { borderVisible: false, visible: true },
      leftPriceScale: { borderVisible: false, visible: true },
      timeScale: { borderVisible: false },
    })
    // Added first so the Level lines draw on top of the shaded area.
    const differenceSeries = chart.addSeries(BaselineSeries, {
      baseValue: { type: 'price', price: 0 },
      topLineColor: CHART_THEME.difference,
      topFillColor1: CHART_THEME.differenceFill,
      topFillColor2: CHART_THEME.differenceFill,
      bottomLineColor: CHART_THEME.difference,
      bottomFillColor1: CHART_THEME.differenceFill,
      bottomFillColor2: CHART_THEME.differenceFill,
      lineWidth: 1,
      priceFormat: { type: 'percent' },
      priceLineVisible: false,
    })
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
