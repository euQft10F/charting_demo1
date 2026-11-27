import type { IndicesResponse } from '@/lib/api'
import type { AxisSide } from '@/lib/axis-side'
import type { ChartingLibrary } from '@/lib/charting-library'

/** What every chart card takes from the page. */
export interface CardProps {
  /** The Indices on offer and the dates their history covers. */
  history: IndicesResponse
  /** The shared Axis Side: where the chart's main value axis sits. */
  axisSide: AxisSide
  /** The Charting Libraries that render the chart: the global one on the dashboard, all of them side by side in the compare view. */
  libraries: readonly ChartingLibrary[]
  /** Changes the shared Axis Side; only the Comparison Chart card offers the control. */
  onAxisSideChange: (side: AxisSide) => void
}
