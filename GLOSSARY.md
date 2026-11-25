# Performance Charting

Comparing the performance of two financial indices over a chosen time window, through a fixed set of analytical charts.

## Series

**Index**:
A synthetic daily time series of financial index levels, starting at 100.
_Avoid_: Ticker, asset, instrument

**Benchmark**:
The Index that performance is judged against; its drawdowns and returns define periods and buckets. Always shown in grey.
_Avoid_: Reference, base, index A

**Strategy**:
The Index being evaluated against the Benchmark. Always shown in the accent red.
_Avoid_: Portfolio, comparison, index B

**Level**:
The value of an Index on a given business day.
_Avoid_: Price, NAV

## Windows

**Window**:
The date range a chart covers, always ending at the latest available date unless Custom. Chosen from a preset (5D, 1M, 3M, 1Y, 5Y, Max) or a custom date range.
_Avoid_: Period (reserved for Drawdown Period), range, lookback

**Custom Window**:
A Window with a user-chosen start and end date.

**Rebase**:
Rescaling both Indices so their Level equals 100 on the first day of the Window.
_Avoid_: Normalise

## Measures

**Daily Return**:
The simple return of an Index from one business day to the next.

**Cumulative Difference**:
The running sum, from the start of the Window, of the Strategy's Daily Return minus the Benchmark's Daily Return.
_Avoid_: Relative return, excess return, spread

**Drawdown**:
The percentage by which an Index's Level sits below its highest Level so far within the Window. Each Index has its own Drawdown.
_Avoid_: Underwater, DD

**Drawdown Episode**:
A stretch of the Benchmark from a peak Level until it regains that Level (or the Window ends). Its depth is the deepest Drawdown within it.

**Drawdown Period**:
The span from the peak to the trough of one of the N deepest Benchmark Drawdown Episodes in the Window.
_Avoid_: Drawdown window, crash period

**Performance Bucket**:
One of five quantile groups (Worst, 2, 3, 4, Best) of days, ranked by the Benchmark's Daily Return within the Window.
_Avoid_: Quintile, bin

**Annualised Mean Return**:
A mean Daily Return scaled by 252.

## Charts

**Comparison Chart**:
The Levels of the Benchmark and Strategy over the Window, with their Cumulative Difference.

**Drawdown Chart**:
The Drawdowns of the Benchmark and Strategy overlaid.

**Drawdown Periods Chart**:
The Levels of both Indices with the Benchmark's Drawdown Periods highlighted.

**Performance Buckets Chart**:
The mean (or Annualised Mean) Daily Return of each Index within each Performance Bucket.

**Drawdown Performance Chart**:
The return of each Index from start to end of each Drawdown Period.

**Charting Library**:
One of Lightweight Charts, Recharts, Apache ECharts or Plotly.js, any of which can render every chart.
