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
The date range a chart covers, always ending at the latest available date unless Custom. Chosen from a preset (1W, 1M, 3M, 1Y, 5Y, Max) or a custom date range.
_Avoid_: Period (reserved for Drawdown Period), range

**Lookback**:
How far a preset Window reaches back in calendar time from the latest date: 1W is the last week (five Daily Returns), 1M the last month, and so on. Max has no Lookback; it covers the whole history.

**Custom Window**:
A Window with a user-chosen start and end date.

**Rebase**:
Rescaling both Indices so their Level equals 100 on the first day of the Window.
_Avoid_: Normalise

## Measures

**Daily Return**:
The simple return of an Index from one business day to the next.

**Weekly Return**:
The simple return of an Index from its last Level in one calendar week to its last Level in the next. The first and last of a Window can cover a partial week.

**Monthly Return**:
The simple return of an Index from its last Level in one calendar month to its last Level in the next. The first and last of a Window can cover a partial month.

**Return Frequency**:
Whether the returns a chart ranks and averages are Daily, Weekly or Monthly Returns. Daily unless chosen otherwise.
_Avoid_: Granularity, resolution, interval

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
One of five quantile groups (Worst, 2, 3, 4, Best) of the Window's days, weeks or months, ranked by the Benchmark's return at the chosen Return Frequency.
_Avoid_: Quintile, bin

## Charts

**Comparison Chart**:
The Levels of the Benchmark and Strategy over the Window, with their Cumulative Difference.

**Drawdown Chart**:
The Drawdowns of the Benchmark and Strategy overlaid.

**Drawdown Periods Chart**:
The Levels of both Indices with the Benchmark's Drawdown Periods highlighted.

**Performance Buckets Chart**:
The mean return, at the chosen Return Frequency, of each Index within each Performance Bucket.

**Drawdown Performance Chart**:
The return of each Index from start to end of each Drawdown Period.

**Axis Side**:
Which edge of a chart, Left or Right, its value axis sits on. One setting shared by all charts; Right by default.
_Avoid_: Y-axis position, price scale

**Charting Library**:
One of Lightweight Charts, Recharts, Apache ECharts or Plotly.js, any of which can render every chart.
