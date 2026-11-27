import { CHART_THEME } from '@/lib/colors'

/** Room around the plot so axis labels at the edges aren't clipped. */
export const CHART_MARGIN = { top: 8, right: 8, bottom: 0, left: 8 }

/** Axis styling shared by every Recharts renderer: no axis lines or ticks, themed labels (like Lightweight Charts). */
export const AXIS_STYLE = {
  axisLine: false,
  tickLine: false,
  tick: { fill: CHART_THEME.text, fontSize: 12 },
} as const

/** Horizontal grid lines only, as in Lightweight Charts. */
export const GRID_STYLE = { vertical: false, stroke: CHART_THEME.grid } as const

/**
 * Recharts wants one object per x position, so the parallel `dates`/values arrays become rows.
 * A column left undefined leaves its key out, which Recharts draws as no data.
 */
export function toRows(dates: string[], columns: Record<string, number[] | undefined>) {
  const entries = Object.entries(columns)
  return dates.map((date, i) => {
    const row: Record<string, string | number> = { date }
    for (const [key, values] of entries) if (values) row[key] = values[i]
    return row
  })
}

const asUtcDate = (iso: string) => new Date(`${iso}T00:00:00Z`)
const dayMonth = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' })
const monthYear = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' })
const fullDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' })

/**
 * Recharts has no time axis, only categories, so the date labels are formatted here: day and month
 * for Windows under half a year, month and year beyond that.
 */
export function dateTickFormatter(dates: string[]) {
  const span = dates.length < 2 ? 0 : asUtcDate(dates.at(-1)!).getTime() - asUtcDate(dates[0]).getTime()
  const format = span > 183 * 24 * 60 * 60 * 1000 ? monthYear : dayMonth
  return (iso: string) => format.format(asUtcDate(iso))
}

export const formatFullDate = (iso: string) => fullDate.format(asUtcDate(iso))

const upToTwoDecimals = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
export const formatLevel = (value: number) => upToTwoDecimals.format(value)
export const formatPercent = (value: number) => `${upToTwoDecimals.format(value)}%`
