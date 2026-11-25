import type { DeepPartial, ChartOptions } from 'lightweight-charts'

import { CHART_THEME } from '@/lib/colors'

/** The look every Lightweight Charts chart shares, so a theme change is made in one place. */
export const THEMED_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  autoSize: true,
  layout: {
    background: { color: CHART_THEME.background },
    textColor: CHART_THEME.text,
    attributionLogo: false,
  },
  grid: { vertLines: { visible: false }, horzLines: { color: CHART_THEME.grid } },
}
