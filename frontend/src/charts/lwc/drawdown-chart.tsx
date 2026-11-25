import {
  BaselineSeries,
  createChart,
  type AutoscaleInfo,
  type BaselineSeriesPartialOptions,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'

import { oppositeSide, type AxisSide } from '@/lib/axis-side'
import { CHART_THEME } from '@/lib/colors'

export interface DrawdownChartProps {
  dates: string[]
  /** Benchmark Drawdown in %. */
  benchmark: number[]
  /** Strategy Drawdown in %. */
  strategy: number[]
  axisSide: AxisSide
}

interface ChartHandles {
  chart: IChartApi
  benchmark: ISeriesApi<'Baseline'>
  strategy: ISeriesApi<'Baseline'>
}

const toData = (dates: string[], values: number[]) => dates.map((time, i) => ({ time, value: values[i] }))

/** Drawdowns are never above 0, so the area hangs from the 0 line and the y-axis tops out at 0. */
function drawdownSeriesOptions(line: string, fill: string): BaselineSeriesPartialOptions {
  return {
    baseValue: { type: 'price', price: 0 },
    topLineColor: line,
    topFillColor1: fill,
    topFillColor2: fill,
    bottomLineColor: line,
    bottomFillColor1: fill,
    bottomFillColor2: fill,
    lineWidth: 2,
    priceFormat: { type: 'percent' },
    priceLineVisible: false,
    autoscaleInfoProvider: (original: () => AutoscaleInfo | null) => {
      const info = original()
      if (!info?.priceRange) return info
      // A Window with no Drawdown at all is flat at 0; give it room below so 0 stays the top.
      const minValue = info.priceRange.minValue < 0 ? info.priceRange.minValue : -1
      return { ...info, priceRange: { minValue, maxValue: 0 } }
    },
  }
}

/** Lightweight Charts renderer for the Drawdown Chart: both Drawdowns, overlaid. */
export function DrawdownChart({ dates, benchmark, strategy, axisSide }: DrawdownChartProps) {
  const container = useRef<HTMLDivElement>(null)
  const handles = useRef<ChartHandles>(null)

  useEffect(() => {
    // No top margin: the top edge of the axis is exactly 0.
    const scaleMargins = { top: 0, bottom: 0.1 }
    const chart = createChart(container.current!, {
      autoSize: true,
      layout: {
        background: { color: CHART_THEME.background },
        textColor: CHART_THEME.text,
        attributionLogo: false,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: CHART_THEME.grid } },
      rightPriceScale: { borderVisible: false, visible: true, scaleMargins },
      leftPriceScale: { borderVisible: false, visible: true, scaleMargins },
      timeScale: { borderVisible: false },
    })
    // The Benchmark is added first, so the Strategy overlays it.
    handles.current = {
      chart,
      benchmark: chart.addSeries(
        BaselineSeries,
        drawdownSeriesOptions(CHART_THEME.benchmark, CHART_THEME.benchmarkFill),
      ),
      strategy: chart.addSeries(
        BaselineSeries,
        drawdownSeriesOptions(CHART_THEME.strategy, CHART_THEME.strategyFill),
      ),
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
    // Only the Drawdown axis is shown; the other edge stays empty.
    h.chart.priceScale(axisSide).applyOptions({ visible: true })
    h.chart.priceScale(oppositeSide(axisSide)).applyOptions({ visible: false })
  }, [axisSide])

  useEffect(() => {
    handles.current?.benchmark.setData(toData(dates, benchmark))
  }, [dates, benchmark])
  useEffect(() => {
    handles.current?.strategy.setData(toData(dates, strategy))
  }, [dates, strategy])

  // Refit the time axis whenever the Window changes.
  useEffect(() => {
    handles.current?.chart.timeScale().fitContent()
  }, [dates])

  return <div ref={container} className="h-full w-full" />
}
