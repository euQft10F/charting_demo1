/**
 * Drawdowns are never above 0, so every library's Drawdown axis tops out at 0. A Window with no
 * Drawdown at all is flat at 0, and its axis takes this range so there is room below and 0 stays the top.
 */
export const FLAT_DRAWDOWN_RANGE: [number, number] = [-1, 0]

/** Whether any of the given Drawdown series (in %, undefined when no Index is chosen) dips below 0. */
export const hasDrawdown = (...series: (number[] | undefined)[]) => series.some((values) => values?.some((v) => v < 0))
