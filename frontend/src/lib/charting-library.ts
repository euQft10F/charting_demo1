/** The Charting Library every chart card renders with. One global setting; Lightweight Charts by default. */
export const CHARTING_LIBRARIES = ['lightweight-charts', 'recharts', 'echarts', 'plotly'] as const
export type ChartingLibrary = (typeof CHARTING_LIBRARIES)[number]

export const CHARTING_LIBRARY_LABELS: Record<ChartingLibrary, string> = {
  'lightweight-charts': 'Lightweight Charts',
  recharts: 'Recharts',
  echarts: 'Apache ECharts',
  plotly: 'Plotly.js',
}

export const DEFAULT_CHARTING_LIBRARY: ChartingLibrary = 'lightweight-charts'
