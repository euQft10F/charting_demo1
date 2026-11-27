import type { Data, Layout, LayoutAxis, PlotData } from 'plotly.js'

import { CHART_THEME } from '@/lib/colors'

/** The value axis style shared by every Plotly.js renderer: grid lines only (no axis line or ticks, by default). */
export const VALUE_AXIS: Partial<LayoutAxis> = {
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
    // Plotly draws its own text, so it needs the page font (Tailwind's --font-sans) spelled out.
    font: { family: 'Geist Variable, sans-serif', size: 12, color: CHART_THEME.text },
    showlegend: false,
    // One tooltip listing every series at the hovered x, like the other libraries' tooltips.
    hovermode: 'x unified',
    hoverlabel: { bgcolor: CHART_THEME.background, bordercolor: CHART_THEME.grid, font: { size: 13 } },
    uirevision,
  }
}

/** The Window a date chart shows, as a `uirevision`. */
export const windowKey = (dates: string[]) => `${dates[0]}/${dates.at(-1)}`

export const PERCENT_HOVER = '%{y:.2f}%'

/**
 * One series over the dates as a 2px line, read as Levels in the tooltip; `overrides` turn it into a
 * filled area, move it to another axis or change its tooltip.
 */
export function lineTrace(
  name: string,
  dates: string[],
  values: number[],
  color: string,
  overrides: Partial<PlotData> = {},
): Data {
  return {
    type: 'scatter',
    mode: 'lines',
    name,
    x: dates,
    y: values,
    line: { color, width: 2 },
    hovertemplate: '%{y:,.2f}',
    ...overrides,
  }
}
