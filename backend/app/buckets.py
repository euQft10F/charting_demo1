"""Performance Buckets: returns ranked into quantile groups by the Benchmark's return."""

import datetime as dt
from typing import Literal

import pandas as pd

BUCKET_LABELS = ["Worst", "2", "3", "4", "Best"]

Frequency = Literal["daily", "weekly", "monthly"]
# The calendar period each Return Frequency groups business days into.
PERIOD_CODE: dict[Frequency, str] = {"daily": "D", "weekly": "W", "monthly": "M"}


def bucket_means(
    levels: pd.DataFrame,
    benchmark: str,
    strategy: str,
    start: dt.date,
    end: dt.date,
    frequency: Frequency = "daily",
) -> tuple[list[float], list[float]]:
    """Mean return of the Benchmark and of the Strategy in each Performance Bucket.

    Only the days from `start` to `end` count. The Levels used are the last one of each calendar
    period (day, week or month) plus the Window's first day, and a return runs from one of these
    Levels to the next, so the first and last periods can be partial. Returns are ranked by the
    Benchmark's (ties broken by date) and cut into five even groups, Worst first.

    Returns the Benchmark means and the Strategy means, five values each, or two empty lists
    when the Window holds fewer returns than buckets.
    """
    window = levels.loc[pd.Timestamp(start) : pd.Timestamp(end)]
    if window.empty:
        return [], []
    period_ends = window.groupby(window.index.to_period(PERIOD_CODE[frequency])).tail(1)
    kept = (
        period_ends
        if period_ends.index[0] == window.index[0]
        else pd.concat([window.iloc[:1], period_ends])
    )
    returns = (
        pd.DataFrame({"benchmark": kept[benchmark], "strategy": kept[strategy]})
        .pct_change()
        .dropna()
    )
    if len(returns) < len(BUCKET_LABELS):
        return [], []
    ranks = returns["benchmark"].rank(method="first")
    bucket = ((ranks - 1) * len(BUCKET_LABELS) // len(returns)).astype(int)
    means = returns.groupby(bucket).mean()
    return means["benchmark"].tolist(), means["strategy"].tolist()
