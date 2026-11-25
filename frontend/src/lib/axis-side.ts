/** Which edge of a chart its value axis sits on. One global setting; Right by default. */
export type AxisSide = 'left' | 'right'

export const DEFAULT_AXIS_SIDE: AxisSide = 'right'

export function oppositeSide(side: AxisSide): AxisSide {
  return side === 'left' ? 'right' : 'left'
}
