import type { DrawdownPeriod } from '@/lib/api'
import type { AxisSide } from '@/lib/axis-side'

// The library-agnostic props every Charting Library adapter takes. Cards build these once;
// switching library swaps the renderer, never the data.

export interface ComparisonChartProps {
  dates: string[]
  /** Benchmark Levels, rebased or raw. */
  benchmark: number[]
  /** Strategy Levels, rebased or raw. */
  strategy: number[]
  /** Cumulative Difference in %. */
  difference: number[]
  /** Log (true) or linear (false) Level axis. */
  logScale: boolean
  /** The side the Level axis sits on; the Cumulative Difference axis takes the other. */
  axisSide: AxisSide
}

export interface DrawdownChartProps {
  dates: string[]
  /** Benchmark Drawdown in %; undefined when no Benchmark is chosen. */
  benchmark?: number[]
  /** Strategy Drawdown in %; undefined when no Strategy is chosen. */
  strategy?: number[]
  axisSide: AxisSide
}

export interface DrawdownPeriodsChartProps {
  dates: string[]
  /** Benchmark Levels, rebased or raw. */
  benchmark: number[]
  /** Strategy Levels, rebased or raw. */
  strategy: number[]
  /** Drawdown Periods to shade, peak to trough. */
  periods: DrawdownPeriod[]
  axisSide: AxisSide
}

export interface BarChartProps {
  /** One label per group of bars, left to right. */
  categories: string[]
  /** One bar per series in every category; `values[i]` belongs to `categories[i]`. Values are %. */
  series: { name: string; color: string; values: number[] }[]
  /** The side the value axis sits on. */
  axisSide: AxisSide
}
