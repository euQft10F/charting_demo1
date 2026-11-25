import { describe, expect, it } from 'vitest'

import { cumulativeDifference, rebase } from '@/lib/comparison'

describe('rebase', () => {
  it('rescales Levels so the first day of the Window is 100', () => {
    expect(rebase([50, 55, 40])).toEqual([100, 110, 80])
  })
})

describe('cumulativeDifference', () => {
  const expectCloseTo = (actual: number[], expected: number[]) => {
    expect(actual).toHaveLength(expected.length)
    expected.forEach((e, i) => expect(actual[i]).toBeCloseTo(e, 9))
  }

  it('is 0 at the start of the Window and the running sum of Strategy minus Benchmark Daily Returns, in %', () => {
    // Benchmark Daily Returns: +10%, -10%. Strategy Daily Returns: +20%, -10%.
    // Differences: +10pp, 0pp, so the running sum is 0, 10, 10.
    const benchmark = [100, 110, 99]
    const strategy = [100, 120, 108]
    expectCloseTo(cumulativeDifference(benchmark, strategy), [0, 10, 10])
  })

  it('goes negative when the Strategy lags the Benchmark', () => {
    // Daily Returns: Benchmark +10%, +10%. Strategy 0%, -10%. Differences: -10pp, -20pp.
    const benchmark = [100, 110, 121]
    const strategy = [50, 50, 45]
    expectCloseTo(cumulativeDifference(benchmark, strategy), [0, -10, -30])
  })

  it('does not depend on where the Indices start', () => {
    const a = cumulativeDifference([100, 110, 99], [100, 120, 108])
    const b = cumulativeDifference([1000, 1100, 990], [7, 8.4, 7.56])
    expectCloseTo(a, b)
  })
})
