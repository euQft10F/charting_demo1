import type { Series } from '@/lib/api'

export const WINDOW_PRESETS = ['1W', '1M', '3M', '1Y', '5Y', 'Max'] as const
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

interface Shift {
  days?: number
  months?: number
}

/** The Lookback of each preset, counted back from the latest date; Max is the whole history. */
const LOOKBACK: Record<Exclude<WindowPreset, 'Max'>, Shift> = {
  '1W': { days: -7 },
  '1M': { months: -1 },
  '3M': { months: -3 },
  '1Y': { months: -12 },
  '5Y': { months: -60 },
}

/** Shift an ISO date; month shifts clamp to the end of the target month (Mar 31 − 1M = Feb 28/29). */
function shift(iso: string, { days = 0, months = 0 }: Shift): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const targetMonth = d.getUTCMonth() + months
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), targetMonth + 1, 0)).getUTCDate()
  const result = new Date(
    Date.UTC(d.getUTCFullYear(), targetMonth, Math.min(d.getUTCDate(), lastDay) + days),
  )
  return result.toISOString().slice(0, 10)
}

/** Resolve a Window to concrete start/end dates within the available history. */
export function resolveWindow(window: Window, available: DateRange): DateRange {
  if (window.preset === 'Custom') return { start: window.start, end: window.end }
  if (window.preset === 'Max') return available
  const start = shift(available.end, LOOKBACK[window.preset])
  return { start: start < available.start ? available.start : start, end: available.end }
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
