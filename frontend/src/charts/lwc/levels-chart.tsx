import { createChart, LineSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { useEffect, useRef } from 'react'

import { CHART_THEME } from '@/lib/colors'

export interface LevelsChartProps {
  dates: string[]
  benchmark: number[]
  strategy: number[]
}

interface ChartHandles {
  chart: IChartApi
  benchmark: ISeriesApi<'Line'>
  strategy: ISeriesApi<'Line'>
}

/** Lightweight Charts renderer for Benchmark and Strategy Levels. */
export function LevelsChart({ dates, benchmark, strategy }: LevelsChartProps) {
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
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    })
    handles.current = {
      chart,
      benchmark: chart.addSeries(LineSeries, { color: CHART_THEME.benchmark, lineWidth: 2 }),
      strategy: chart.addSeries(LineSeries, { color: CHART_THEME.strategy, lineWidth: 2 }),
    }
    return () => {
      chart.remove()
      handles.current = null
    }
  }, [])

  useEffect(() => {
    const h = handles.current
    if (!h) return
    const toData = (values: number[]) => dates.map((time, i) => ({ time, value: values[i] }))
    h.benchmark.setData(toData(benchmark))
    h.strategy.setData(toData(strategy))
    h.chart.timeScale().fitContent()
  }, [dates, benchmark, strategy])

  return <div ref={container} className="h-full w-full" />
}
