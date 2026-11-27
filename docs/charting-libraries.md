# Charting Library comparison notes

Each Charting Library has one adapter per chart under `frontend/src/charts/<library>/`, all taking the library-agnostic props in `frontend/src/charts/types.ts`. `frontend/src/charts/adapters.ts` maps each library to its renderers; the cards pick theirs from the global Charting Library switcher. Forms, queries and calculations live in the cards and `lib/`, so switching library only swaps renderers and makes no backend requests.

These notes record where a library needed a workaround, to weigh in the final choice.

## Lightweight Charts

- **No category axis.** The bar charts (Performance Buckets, Drawdown Performance) put category `i` on a stand-in time `i` days after an arbitrary start, and label the time axis with the categories via `tickMarkFormatter`. Long category labels need `tickMarkMaxCharacterLength` raised or they overlap.
- **No grouped bars.** A custom series (`GroupedBarsView`) draws each group of side-by-side bars on a canvas, including its own autoscale range so the axis always includes 0.
- **No bar tooltip.** The tooltip is a React overlay driven by `subscribeCrosshairMove`.
- **No shaded x-ranges.** Drawdown Period bands are a series primitive drawing full-height rectangles behind the series.
- **Drawdown axis capped at 0** needs a custom `autoscaleInfoProvider`, plus a fallback range for a Window with no Drawdown.
- Strengths: fast with thousands of points; built-in crosshair, last-value labels, pan and zoom.

## Recharts

- **No time axis.** The x axis is categorical over the date strings, so date labels are formatted by hand (`dateTickFormatter`: day/month under half a year, month/year beyond) and spaced with `minTickGap`. Gaps between dates (weekends, holidays) aren't spaced in proportion to time, which is the same as Lightweight Charts' business-day axis.
- **Data must be rows.** Parallel `dates`/values arrays are zipped into one object per date (`toRows`); bar series are keyed by position (`s0`, `s1`) so two series with the same name can't collide.
- **Drawdown Period bands must start and end on a date in the data.** `ReferenceArea` on a category axis can only use existing categories, so the adapter drops any Period whose dates aren't in the Window (they're briefly stale while a new Window loads).
- **A function-valued axis domain turns off nice ticks** (e.g. -5.47%, -11.47%). The Drawdown axis uses `['auto', 0]` instead, switching to a fixed `[-1, 0]` when the Window has no Drawdown at all.
- **Log scale** needs the domain set to `['dataMin', 'dataMax']`: the usual `'auto'` rounds the bounds outward to round numbers, which on a log scale could reach 0.
- **Tooltip order follows drawing order.** The Cumulative Difference area is drawn first so it sits behind the Level lines, and `itemSorter` does not reach custom tooltip content, so `ChartTooltip` takes a `sortKey` to list it last.
- **Animations off** (`isAnimationActive={false}`) everywhere: with ~1,500 points per series at Max they make Window changes feel sluggish.
- **No built-in crosshair value labels or pan/zoom.** A custom tooltip (`ChartTooltip`) lists every series at the hovered date or category.
- Strengths: native category axis and grouped bars, so the bar charts need no workaround; declarative JSX, and styling via props matches the dashboard easily; SVG output is easy to inspect.

## Apache ECharts

- **Imperative API in React.** One `EChart` host component (`echart.tsx`) creates the instance, resizes it with a `ResizeObserver` (ECharts doesn't follow its container), and calls `setOption` with a whole new option on every change. Only the chart types and components used are registered (`echarts/core` + `use`), to keep the bundle down.
- **Keeping the zoom across updates.** A plain `setOption` merge would leave a removed series drawn (Drawdown with Strategy set to None) and keep stale axis settings (a log axis's bounds after switching back to linear). The host uses `replaceMerge: ['xAxis', 'yAxis', 'series']`, which keeps the `dataZoom` state, and rebuilds the chart (`notMerge`) only when the Window's dates change.
- **Log axes only tick at powers of 10.** Within one Window that's often no tick at all, just the odd-looking data bounds. The Level axis sets `axisLabel.customValues` and `axisTick.customValues` (which the grid lines follow) to round values between the Window's lowest and highest Level, and the bounds are `'dataMin'`/`'dataMax'` so the axis neither rounds out past the data nor shows a power of 10 far beyond it. The ticks are fixed per Window, so zooming far in can leave few labels in view.
- **Time axis spaces by calendar time.** The native `time` axis picks and formats date ticks itself, but weekends and holidays take up width, unlike the business-day axes of the other two. ECharts would parse a bare `YYYY-MM-DD` as local midnight, so dates go in as UTC timestamps and the option sets `useUTC: true`, keeping axis labels, tooltip headings and Drawdown Period bands on the right day in any time zone.
- **Value axes include 0 by default.** The Level and Cumulative Difference axes set `scale: true` so they fit the data instead.
- **Drawdown axis capped at 0** with `max: 0` (ECharts keeps nice ticks below it), and `min: -1` for a Window with no Drawdown at all.
- **Tooltip content is an HTML string.** The card-style tooltip is built as markup in the formatter (with Index names escaped), its own background, border and padding cleared. The Tailwind classes work because the tooltip is rendered inside the page.
- **No reference-line primitive for 0 on the bar charts.** A `markLine` at `yAxis: 0` on the first bar series draws it (`axisLine.onZero` would move the category labels to the 0 line too).
- **Animations off** (`animation: false`), as with Recharts.
- Strengths: native time and category axes, grouped bars, `markArea` bands on any date (no need to drop stale Drawdown Periods), built-in pan and zoom (`dataZoom` inside), and series `z` order is separate from tooltip order. Canvas rendering stays smooth at Max.
