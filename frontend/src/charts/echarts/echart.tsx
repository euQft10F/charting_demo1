import { BarChart, LineChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components'
import { init, use as registerParts, type ECharts, type EChartsCoreOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useRef } from 'react'

// Only the pieces these charts use are bundled (ECharts' tree-shakable entry points).
registerParts([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  MarkAreaComponent,
  MarkLineComponent,
  DataZoomComponent,
  CanvasRenderer,
])

interface EChartProps {
  option: EChartsCoreOption
  /**
   * When this changes (by identity), the chart is rebuilt from `option`, resetting any zoom.
   * Otherwise the axes and series are replaced but the zoom is kept: pass the Window's dates, so
   * toggling Rebase, log scale or Axis Side keeps the user's zoom, as in Lightweight Charts.
   */
  resetOn: unknown
}

/** An ECharts instance filling its parent, redrawn whenever `option` changes. */
export function EChart({ option, resetOn }: EChartProps) {
  const container = useRef<HTMLDivElement>(null)
  const chart = useRef<ECharts>(null)
  const lastResetOn = useRef<unknown>(undefined)

  useEffect(() => {
    const element = container.current!
    const instance = init(element)
    chart.current = instance
    // ECharts doesn't follow its container's size by itself.
    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(element)
    return () => {
      observer.disconnect()
      instance.dispose()
      chart.current = null
      lastResetOn.current = undefined
    }
  }, [])

  useEffect(() => {
    const instance = chart.current
    if (!instance) return
    // A series can come and go (a Drawdown with no Strategy), and merging would leave it drawn;
    // replacing the axes too drops settings the new option leaves out (a log axis's bounds).
    const reset = lastResetOn.current !== resetOn
    instance.setOption(option, reset ? { notMerge: true } : { replaceMerge: ['xAxis', 'yAxis', 'series'] })
    lastResetOn.current = resetOn
  }, [option, resetOn])

  return <div ref={container} className="h-full w-full" />
}
