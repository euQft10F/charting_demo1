# Charting Library comparison notes

Each Charting Library has one adapter per chart under `frontend/src/charts/<library>/`, all taking the library-agnostic props in `frontend/src/charts/types.ts`. `frontend/src/charts/adapters.ts` maps each library to its renderers; the cards pick theirs from the global Charting Library switcher. Forms, queries and calculations live in the cards and `lib/`, so switching library only swaps renderers and makes no backend requests.

The **Compare libraries** view (header toggle) shows one chart, chosen from the five, rendered by all four libraries side by side, driven by that chart's single form. Each card takes a list of libraries and `ChartCard` draws one panel per library from the same data, so the four renderers always show identical inputs.

These notes record where each library needed a workaround, and what it still can't do, to weigh in the final choice. The [overall fit](#overall-fit) section at the end sums up.

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

## Plotly.js

- **Bundle size.** The full `plotly.js` is ~3.5 MB minified; the adapters use `plotly.js-basic-dist-min` (scatter and bar traces only), still ~1.2 MB minified / ~400 KB gzipped, far more than the other libraries. `adapters.ts` therefore loads the Plotly renderers with `React.lazy` on first use, and `ChartCard` shows a spinner while they arrive. The bundle ships no types, so `plotly.d.ts` points it at `@types/plotly.js`.
- **No React component.** `react-plotly.js` is an old class-component wrapper, so `PlotlyChart` calls `Plotly.react` from an effect, purges on unmount, and resizes through a `ResizeObserver` (`config.responsive` only follows window resizes, not the card's).
- **Weekend gaps on the date axis.** A `type: 'date'` axis spaces points in calendar time; `rangebreaks` on weekends make it a business-day axis like Lightweight Charts' and Recharts' (ECharts keeps calendar spacing). This works because the synthetic Indices have no holidays: real data would need every holiday listed as a break too. Range breaks are also known to slow hover and zoom on long series; a category axis would avoid that but lose date-aware ticks.
- **Overlay axes draw on top.** An axis with `overlaying` is drawn above the one it overlays whatever the trace order, so the Comparison Chart puts the Cumulative Difference on the base axis and the Levels on the overlay to keep the shaded area behind the lines.
- **Overlay axes sync their ticks by default**, giving odd Level ticks (181.8, 220, 258.2) and no grid of their own; the Level axis sets `tickmode: 'auto'` and `showgrid: true`.
- **Zoom kept by `uirevision`.** Each chart passes its Window (plus log/linear on the Comparison Chart, since the zoom range is in axis units) as `uirevision`, so the zoom survives Rebase but resets on a new Window. Value axes are `fixedrange` so only the x axis zooms; unlike Lightweight Charts, the value axis then fits the whole Window, not the zoomed part.
- **Drawdown axis capped at 0** with `autorangeoptions.maxallowed: 0` (autorange otherwise pads above 0), plus a fixed `[-1, 0]` range for a Window with no Drawdown.
- **Unified tooltip is fixed-format.** `hovermode: 'x unified'` lists every series as `name : value`; the order follows the trace order and the look is limited to `hoverlabel` colours and fonts, so it can't match the card-style tooltip of the other libraries exactly.
- Strengths: native date and category axes, grouped bars (`barmode: 'group'`), shaded x-ranges (`layout.shapes` with `yref: 'paper'`, placed by date so a Period needn't fall on a date in the data), log axes and drag-to-zoom all built in; the figures are plain data, so each adapter is a single object literal.

## Overall fit

How each library handled the five charts, with the workaround effort and what remains a limitation.

| | Lightweight Charts | Recharts | Apache ECharts | Plotly.js |
|---|---|---|---|---|
| Comparison Chart (two axes, log scale, shaded difference) | Native: two value axes, log mode, baseline series for the shaded difference | Works; log domain needs care | Works; log ticks need `customValues` | Works; overlay axis order and tick sync need fixing |
| Drawdown Chart | Needs a custom autoscale to cap at 0 | Works | Works | Works |
| Drawdown Periods Chart (shaded x-ranges) | Custom primitive | `ReferenceArea`, but only on dates in the data | Native `markArea` | Native `layout.shapes` |
| Bar charts: Performance Buckets, Drawdown Performance (category axis, grouped bars) | Hardest: fake times, custom series, custom tooltip | Native | Native | Native |
| Pan / zoom (time-series charts; the bar charts don't zoom in any library here) | Built in, value axis refits to the visible range | None | Built in (`dataZoom`) | Built in (x only) |
| Hover values | Time series: crosshair with axis value labels, no tooltip. Bar charts: custom React overlay | Custom tooltip content, easy | HTML string formatter | Fixed format, limited styling |
| Business-day x axis | Native | Category axis (by accident) | No: calendar spacing | Needs `rangebreaks` (weekends only) |
| Bundle cost | Small | Medium | Medium (tree-shaken) | Large (lazy loaded) |
| Performance at Max (~1,500 points × 3) | Best | Fine with animations off; SVG gets heavy with more data | Very good (canvas) | Fine; range breaks slow hover |

**Lightweight Charts.** Best for the time-series charts: it's built for financial data, with a business-day axis, crosshair labels, last-value markers and smooth pan and zoom. It's the wrong tool for anything categorical: the two bar charts took the most custom code in the project (fake times, a hand-drawn grouped bar series, a hand-built tooltip), and Drawdown Period bands needed a primitive. Pick it if the site is mostly time series and the bar charts can live with custom code.

**Recharts.** The most React-native: declarative JSX, easy styling, simple custom tooltips, and bar charts that need no workaround. The weak spots are on the time-series side: no real time axis, no pan or zoom, bands only on dates in the data, and SVG that slows with long histories. Good for a small dashboard with short Windows; weaker for analysts who want to zoom into six years of daily data.

**Apache ECharts.** The broadest built-in coverage: time and category axes, grouped bars, `markArea` bands on any date, `dataZoom`, canvas performance. The cost is an imperative, option-object API that needs a React host component and careful `setOption` merging, plus fiddly log-axis ticks and a calendar-spaced time axis (weekend gaps). Every chart works without drawing anything by hand; the only stand-in is a `markLine` for the 0 line on the bar charts.

**Plotly.js.** Everything needed is built in and each adapter is a single data literal, but it is by far the heaviest bundle, the business-day axis relies on `rangebreaks` (which would also need every holiday in real data), the tooltip can't be styled to match the dashboard, and the default overlay axis behaviour had to be overridden. Strongest for exploratory or scientific use; overkill for this dashboard.

**Recommendation.** For a performance-charting site comparing two Indices, **Apache ECharts** is the best single choice: it renders all five charts with no hand-drawn parts, handles long daily histories smoothly and has zoom built in; its integration cost is a one-off host component, already written here. **Lightweight Charts** is the strongest alternative if the time-series charts matter most and the look of a trading terminal is wanted: its time-series experience is the best of the four, but its bar charts are workarounds. A hybrid (Lightweight Charts for time series, ECharts or Recharts for the bar charts) is possible but means two libraries to style and maintain.
