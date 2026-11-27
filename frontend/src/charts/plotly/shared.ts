import type { Data, Layout, LayoutAxis } from 'plotly.js'

import { CHART_THEME } from '@/lib/colors'

/** The value axis style shared by every Plotly.js renderer: no axis line or ticks, grid lines only. */
export const VALUE_AXIS: Partial<LayoutAxis> = {
  showline: false,
  ticks: '',
  gridcolor: CHART_THEME.grid,
  zeroline: false,
  automargin: true,
  // Only the x axis zooms, as in Lightweight Charts; the value axis always fits the data.
  fixedrange: true,
}

/**
 * A date axis without weekend gaps. The Indices are plain business days, so breaking on weekends
 * gives the same evenly spaced axis as the other libraries; a holiday calendar would need its dates
 * listed as extra breaks.
 */
export const DATE_AXIS: Partial<LayoutAxis> = {
  type: 'date',
  rangebreaks: [{ bounds: ['sat', 'mon'] }],
  showgrid: false,
  showline: false,
  ticks: '',
  automargin: true,
  hoverformat: '%b %-d, %Y',
}

/**
 * The themed layout every Plotly.js renderer starts from. `uirevision` keeps the user's zoom across
 * updates until it changes, so date charts pass their Window and the zoom resets on a new one.
 */
export function baseLayout(uirevision: string): Partial<Layout> {
  return {
    autosize: true,
    margin: { t: 8, r: 8, b: 8, l: 8, pad: 4 },
    paper_bgcolor: CHART_THEME.background,
    plot_bgcolor: CHART_THEME.background,
    font: { family: 'Geist Variable, sans-serif', size: 12, color: CHART_THEME.text },
    showlegend: false,
    // One tooltip listing every series at the hovered x, like the other libraries' tooltips.
    hovermode: 'x unified',
    hoverlabel: { bgcolor: CHART_THEME.background, bordercolor: CHART_THEME.grid, font: { size: 13 } },
    dragmode: 'zoom',
    uirevision,
  }
}

/** The Window a date chart shows, as a `uirevision`. */
export const windowKey = (dates: string[]) => `${dates[0]}/${dates.at(-1)}`

export const LEVEL_HOVER = '%{y:,.2f}'
export const PERCENT_HOVER = '%{y:.2f}%'

/** An Index's Levels as a line, on the given value axis. */
export function levelTrace(name: string, dates: string[], levels: number[], color: string, yaxis = 'y'): Data {
  return {
    type: 'scatter',
    mode: 'lines',
    name,
    x: dates,
    y: levels,
    yaxis,
    line: { color, width: 2 },
    hovertemplate: LEVEL_HOVER,
  }
}
