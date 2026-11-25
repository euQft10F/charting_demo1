import type { Series } from '@/lib/api'

export const WINDOW_PRESETS = ['5D', '1M', '3M', '1Y', '5Y', 'Max'] as const
export type WindowPreset = (typeof WINDOW_PRESETS)[number]
/** Every choice offered by the Window selector. */
export const WINDOW_CHOICES = [...WINDOW_PRESETS, 'Custom'] as const
export const DEFAULT_PRESET: WindowPreset = '1Y'

/** A Window: a preset ending at the latest date, or a Custom Window. Dates are ISO `YYYY-MM-DD`. */
export type Window =
  | { preset: WindowPreset }
  | { preset: 'Custom'; start: string; end: string }

export interface DateRange {
  start: string
  end: string
}

/** Levels of the Benchmark and Strategy on shared dates. */
export interface PairLevels {
  dates: string[]
  benchmark: Series
  strategy: Series
}

/** Shift an ISO date; month/year shifts clamp to the end of the target month (Mar 31 − 1M = Feb 28/29). */
function shift(iso: string, { days = 0, months = 0, years = 0 }): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const targetMonth = d.getUTCMonth() + months + years * 12
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), targetMonth + 1, 0)).getUTCDate()
  const result = new Date(
    Date.UTC(d.getUTCFullYear(), targetMonth, Math.min(d.getUTCDate(), lastDay) + days),
  )
  return result.toISOString().slice(0, 10)
}

/** Resolve a Window to concrete start/end dates within the available history. */
export function resolveWindow(window: Window, available: DateRange): DateRange {
  const end = available.end
  const clamp = (start: string) => ({ start: start < available.start ? available.start : start, end })
  switch (window.preset) {
    case '5D':
      return clamp(shift(end, { days: -7 }))
    case '1M':
      return clamp(shift(end, { months: -1 }))
    case '3M':
      return clamp(shift(end, { months: -3 }))
    case '1Y':
      return clamp(shift(end, { years: -1 }))
    case '5Y':
      return clamp(shift(end, { years: -5 }))
    case 'Max':
      return { start: available.start, end }
    case 'Custom':
      return { start: window.start, end: window.end }
  }
}

/** Keep only the days of the Levels that fall inside the date range. */
export function sliceLevels(levels: PairLevels, range: DateRange): PairLevels {
  let from = levels.dates.findIndex((d) => d >= range.start)
  if (from === -1) from = levels.dates.length
  let to = levels.dates.length
  while (to > from && levels.dates[to - 1] > range.end) to--
  const slice = (s: Series) => ({ ...s, values: s.values.slice(from, to) })
  return {
    dates: levels.dates.slice(from, to),
    benchmark: slice(levels.benchmark),
    strategy: slice(levels.strategy),
  }
}
