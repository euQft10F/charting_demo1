import type { ComponentType } from 'react'

import { BarChart as LwcBarChart } from '@/charts/lwc/bar-chart'
import { ComparisonChart as LwcComparisonChart } from '@/charts/lwc/comparison-chart'
import { DrawdownChart as LwcDrawdownChart } from '@/charts/lwc/drawdown-chart'
import { DrawdownPeriodsChart as LwcDrawdownPeriodsChart } from '@/charts/lwc/drawdown-periods-chart'
import { BarChart as RechartsBarChart } from '@/charts/recharts/bar-chart'
import { ComparisonChart as RechartsComparisonChart } from '@/charts/recharts/comparison-chart'
import { DrawdownChart as RechartsDrawdownChart } from '@/charts/recharts/drawdown-chart'
import { DrawdownPeriodsChart as RechartsDrawdownPeriodsChart } from '@/charts/recharts/drawdown-periods-chart'
import type {
  BarChartProps,
  ComparisonChartProps,
  DrawdownChartProps,
  DrawdownPeriodsChartProps,
} from '@/charts/types'
import type { ChartingLibrary } from '@/lib/charting-library'

/** One Charting Library's renderers: every chart, each taking the same library-agnostic props. */
export interface ChartAdapter {
  ComparisonChart: ComponentType<ComparisonChartProps>
  DrawdownChart: ComponentType<DrawdownChartProps>
  DrawdownPeriodsChart: ComponentType<DrawdownPeriodsChartProps>
  /** Shared by the Performance Buckets and Drawdown Performance charts. */
  BarChart: ComponentType<BarChartProps>
}

export const CHART_ADAPTERS: Record<ChartingLibrary, ChartAdapter> = {
  'lightweight-charts': {
    ComparisonChart: LwcComparisonChart,
    DrawdownChart: LwcDrawdownChart,
    DrawdownPeriodsChart: LwcDrawdownPeriodsChart,
    BarChart: LwcBarChart,
  },
  recharts: {
    ComparisonChart: RechartsComparisonChart,
    DrawdownChart: RechartsDrawdownChart,
    DrawdownPeriodsChart: RechartsDrawdownPeriodsChart,
    BarChart: RechartsBarChart,
  },
}
