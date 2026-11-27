import type { Config, Data, Layout } from 'plotly.js'
import Plotly from 'plotly.js-basic-dist-min'
import { useEffect, useRef } from 'react'

/** No mode bar or logo: drag zooms the x axis and a double click resets it. */
const CONFIG: Partial<Config> = { displayModeBar: false, displaylogo: false }

interface PlotlyChartProps {
  data: Data[]
  layout: Partial<Layout>
}

/**
 * Plotly.js has no React component of its own (react-plotly.js is a thin class wrapper), so this
 * draws into a div: `Plotly.react` diffs against the last figure, and `layout.uirevision` decides
 * whether the user's zoom survives an update.
 */
export function PlotlyChart({ data, layout }: PlotlyChartProps) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void Plotly.react(container.current!, data, layout, CONFIG)
  }, [data, layout])

  // `config.responsive` only follows window resizes; the card can change size on its own.
  useEffect(() => {
    const element = container.current!
    const observer = new ResizeObserver(() => void Plotly.Plots.resize(element))
    observer.observe(element)
    return () => {
      observer.disconnect()
      Plotly.purge(element)
    }
  }, [])

  return <div ref={container} className="h-full w-full" />
}
