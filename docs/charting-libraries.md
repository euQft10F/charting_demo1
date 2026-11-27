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

## Plotly.js

- **Bundle size.** The full `plotly.js` is ~3.5 MB minified; the adapters use `plotly.js-basic-dist-min` (scatter and bar traces only), still ~1.2 MB minified / ~400 KB gzipped, far more than the other libraries. `adapters.ts` therefore loads the Plotly renderers with `React.lazy` on first use, and `ChartCard` shows a spinner while they arrive. The bundle ships no types, so `plotly.d.ts` points it at `@types/plotly.js`.
- **No React component.** `react-plotly.js` is an old class-component wrapper, so `PlotlyChart` calls `Plotly.react` from an effect, purges on unmount, and resizes through a `ResizeObserver` (`config.responsive` only follows window resizes, not the card's).
- **Weekend gaps on the date axis.** A `type: 'date'` axis spaces points in calendar time; `rangebreaks` on weekends make it a business-day axis like the others. This works because the synthetic Indices have no holidays: real data would need every holiday listed as a break too. Range breaks are also known to slow hover and zoom on long series; a category axis would avoid that but lose date-aware ticks.
- **Overlay axes draw on top.** An axis with `overlaying` is drawn above the one it overlays whatever the trace order, so the Comparison Chart puts the Cumulative Difference on the base axis and the Levels on the overlay to keep the shaded area behind the lines.
- **Overlay axes sync their ticks by default**, giving odd Level ticks (181.8, 220, 258.2) and no grid of their own; the Level axis sets `tickmode: 'auto'` and `showgrid: true`.
- **Zoom kept by `uirevision`.** Each chart passes its Window (plus log/linear on the Comparison Chart, since the zoom range is in axis units) as `uirevision`, so the zoom survives Rebase but resets on a new Window. Value axes are `fixedrange` so only the x axis zooms; unlike Lightweight Charts, the value axis then fits the whole Window, not the zoomed part.
- **Drawdown axis capped at 0** with `autorangeoptions.maxallowed: 0` (autorange otherwise pads above 0), plus a fixed `[-1, 0]` range for a Window with no Drawdown.
- **Unified tooltip is fixed-format.** `hovermode: 'x unified'` lists every series as `name : value`; the order follows the trace order and the look is limited to `hoverlabel` colours and fonts, so it can't match the card-style tooltip of the other libraries exactly.
- Strengths: native date and category axes, grouped bars (`barmode: 'group'`), shaded x-ranges (`layout.shapes` with `yref: 'paper'`, placed by date so a Period needn't fall on a date in the data), log axes and drag-to-zoom all built in; the figures are plain data, so each adapter is a single object literal.
