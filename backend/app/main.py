import datetime as dt
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Annotated

import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query

from app.buckets import BUCKET_LABELS, Frequency, bucket_means
from app.data import get_dataset
from app.schemas import (
    BarsResponse,
    DrawdownPeriod,
    DrawdownPeriodsResponse,
    DrawdownsResponse,
    IndicesResponse,
    LevelsResponse,
    Series,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    # Generate the data at startup, honouring a test override of the dependency.
    app.dependency_overrides.get(get_dataset, get_dataset)()
    yield


app = FastAPI(title="Performance Charting", lifespan=lifespan)

Dataset = Annotated[pd.DataFrame, Depends(get_dataset)]


@app.get("/api/indices")
def list_indices(data: Dataset) -> IndicesResponse:
    return IndicesResponse(
        indices=list(data.columns),
        start=data.index[0].date(),
        end=data.index[-1].date(),
    )


def require_known(data: pd.DataFrame, names: list[str]) -> None:
    unknown = [n for n in names if n not in data.columns]
    if unknown:
        raise HTTPException(404, f"Unknown Index: {', '.join(unknown)}")


def window_of(data: pd.DataFrame, start: dt.date, end: dt.date) -> pd.DataFrame:
    """The days of the Window; a running maximum over them starts afresh on the first day."""
    return data.loc[pd.Timestamp(start) : pd.Timestamp(end)]


def drawdown(values: pd.Series) -> pd.Series:
    """Drawdown in %: Level over its running maximum so far, minus 1."""
    return (values / values.cummax() - 1) * 100


def deepest_drawdown_periods(values: pd.Series, n: int) -> list[DrawdownPeriod]:
    """Peak-to-trough spans of the n deepest Drawdown Episodes, in chronological order.

    An episode starts at a peak, the last day at 0 Drawdown, and lasts while the Level stays below
    it; an episode still under water on the last day counts.
    """
    dd = drawdown(values)
    at_peak = dd == 0
    underwater = dd[~at_peak]
    if underwater.empty:
        return []
    peak_dates = dd.index[at_peak]
    # Each day at 0 opens a new episode number, which the under-water days after it share.
    episode = at_peak.cumsum()[underwater.index]
    by_episode = underwater.groupby(episode)
    deepest = by_episode.min().nsmallest(n).index.sort_values()
    troughs = by_episode.idxmin()
    return [DrawdownPeriod(start=peak_dates[e - 1].date(), end=troughs[e].date()) for e in deepest]


@app.get("/api/drawdown-periods")
def drawdown_periods(
    data: Dataset,
    benchmark: str,
    start: dt.date,
    end: dt.date,
    n: Annotated[int, Query(ge=1, le=10)] = 2,
) -> DrawdownPeriodsResponse:
    require_known(data, [benchmark])
    return DrawdownPeriodsResponse(
        periods=deepest_drawdown_periods(window_of(data, start, end)[benchmark], n)
    )


def period_label(period: DrawdownPeriod) -> str:
    """E.g. "Jan 2022 – Sep 2022"."""
    return f"{period.start:%b %Y} – {period.end:%b %Y}"


@app.get("/api/drawdown-performance")
def drawdown_performance(
    data: Dataset,
    benchmark: str,
    strategy: str,
    start: dt.date,
    end: dt.date,
    n: Annotated[int, Query(ge=1, le=10)] = 2,
) -> BarsResponse:
    require_known(data, [benchmark, strategy])
    window = window_of(data, start, end)
    periods = deepest_drawdown_periods(window[benchmark], n)

    starts = pd.DatetimeIndex([p.start for p in periods])
    ends = pd.DatetimeIndex([p.end for p in periods])

    def period_returns(name: str) -> list[float]:
        levels = window[name]
        return (levels.loc[ends].to_numpy() / levels.loc[starts].to_numpy() - 1).tolist()

    return BarsResponse(
        categories=[period_label(p) for p in periods],
        series=[
            Series(name=benchmark, values=period_returns(benchmark)),
            Series(name=strategy, values=period_returns(strategy)),
        ],
    )


@app.get("/api/drawdowns")
def drawdowns(
    data: Dataset,
    start: dt.date,
    end: dt.date,
    benchmark: str | None = None,
    strategy: str | None = None,
) -> DrawdownsResponse:
    names = [n for n in (benchmark, strategy) if n]
    if not names:
        raise HTTPException(422, "Choose a Benchmark or a Strategy")
    require_known(data, names)
    window = window_of(data, start, end)

    def drawdown_series(name: str) -> Series:
        return Series(name=name, values=drawdown(window[name]).round(4).tolist())

    return DrawdownsResponse(
        dates=[d.date() for d in window.index],
        benchmark=drawdown_series(benchmark) if benchmark else None,
        strategy=drawdown_series(strategy) if strategy else None,
    )


@app.get("/api/levels")
def levels(data: Dataset, names: Annotated[list[str], Query()]) -> LevelsResponse:
    require_known(data, names)
    return LevelsResponse(
        dates=[d.date() for d in data.index],
        series=[Series(name=n, values=data[n].round(4).tolist()) for n in names],
    )


@app.get("/api/performance-buckets")
def performance_buckets(
    data: Dataset,
    benchmark: str,
    strategy: str,
    start: dt.date,
    end: dt.date,
    frequency: Frequency = "daily",
) -> BarsResponse:
    require_known(data, [benchmark, strategy])
    window = window_of(data, start, end)
    benchmark_means, strategy_means = bucket_means(window, benchmark, strategy, frequency)
    return BarsResponse(
        categories=BUCKET_LABELS if benchmark_means else [],
        series=[
            Series(name=benchmark, values=benchmark_means),
            Series(name=strategy, values=strategy_means),
        ],
    )
