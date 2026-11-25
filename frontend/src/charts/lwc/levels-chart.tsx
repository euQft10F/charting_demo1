import { createChart, LineSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { useEffect, useRef } from 'react'

import { BENCHMARK_COLOR, STRATEGY_COLOR } from '@/lib/colors'

export interface LevelsChartProps {
  dates: string[]
  benchmark: number[]
  strategy: number[]
}

/** Lightweight Charts renderer for Benchmark and Strategy Levels. */
export function LevelsChart({ dates, benchmark, strategy }: LevelsChartProps) {
  const container = useRef<HTMLDivElement>(null)
  const chart = useRef<IChartApi>(null)
  const series = useRef<{ benchmark: ISeriesApi<'Line'>; strategy: ISeriesApi<'Line'> }>(null)

  useEffect(() => {
    const c = createChart(container.current!, {
      autoSize: true,
      layout: { background: { color: '#ffffff' }, textColor: '#444', attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { color: '#eee' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    })
    chart.current = c
    series.current = {
      benchmark: c.addSeries(LineSeries, { color: BENCHMARK_COLOR, lineWidth: 2 }),
      strategy: c.addSeries(LineSeries, { color: STRATEGY_COLOR, lineWidth: 2 }),
    }
    return () => {
      c.remove()
      chart.current = null
      series.current = null
    }
  }, [])

  useEffect(() => {
    if (!series.current || !chart.current) return
    const toData = (values: number[]) => dates.map((time, i) => ({ time, value: values[i] }))
    series.current.benchmark.setData(toData(benchmark))
    series.current.strategy.setData(toData(strategy))
    chart.current.timeScale().fitContent()
  }, [dates, benchmark, strategy])

  return <div ref={container} className="h-full w-full" />
}
