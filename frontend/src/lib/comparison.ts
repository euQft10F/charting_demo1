/** Rescale Levels so the first day of the Window is 100 (Rebase). */
export function rebase(levels: number[]): number[] {
  const first = levels[0]
  return levels.map((v) => (v * 100) / first)
}

/**
 * The Cumulative Difference in %: the running sum, from the start of the Window, of the
 * Strategy's Daily Return minus the Benchmark's Daily Return. It is 0 on the first day.
 */
export function cumulativeDifference(benchmark: number[], strategy: number[]): number[] {
  let sum = 0
  return benchmark.map((_, i) => {
    if (i > 0) {
      const strategyReturn = strategy[i] / strategy[i - 1] - 1
      const benchmarkReturn = benchmark[i] / benchmark[i - 1] - 1
      sum += (strategyReturn - benchmarkReturn) * 100
    }
    return sum
  })
}
