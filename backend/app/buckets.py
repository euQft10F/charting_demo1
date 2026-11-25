"""Performance Buckets: returns ranked into quantile groups by the Benchmark's return."""

from typing import Literal

import numpy as np
import pandas as pd

BUCKET_LABELS = ["Worst", "2", "3", "4", "Best"]

# Keep in step with RETURN_FREQUENCIES in frontend/src/lib/api.ts.
Frequency = Literal["daily", "weekly", "monthly"]
# The calendar period each Return Frequency groups business days into.
PERIOD_CODE: dict[Frequency, str] = {"daily": "D", "weekly": "W", "monthly": "M"}


def bucket_means(
    window: pd.DataFrame,
    benchmark: str,
    strategy: str,
    frequency: Frequency = "daily",
) -> tuple[list[float], list[float]]:
    """Mean return of the Benchmark and of the Strategy in each Performance Bucket.

    `window` holds the Levels of the days in the Window. The Levels used are the last one of each
    calendar period (day, week or month) plus the Window's first day, and a return runs from one
    of these Levels to the next, so the first and last periods can be partial. Returns are ranked
    by the Benchmark's (ties broken by date) and cut into five even groups, Worst first.

    Returns the Benchmark means and the Strategy means, five values each, or two empty lists
    when the Window holds fewer returns than buckets.
    """
    if window.empty:
        return [], []
    pair = pd.DataFrame({"benchmark": window[benchmark], "strategy": window[strategy]})
    periods = pd.DatetimeIndex(window.index).to_period(PERIOD_CODE[frequency])
    last_of_period = np.append(periods[1:] != periods[:-1], True)
    first_day = np.arange(len(window)) == 0
    returns = pair[last_of_period | first_day].pct_change().dropna()
    if len(returns) < len(BUCKET_LABELS):
        return [], []
    ranks = returns["benchmark"].rank(method="first")
    bucket = ((ranks - 1) * len(BUCKET_LABELS) // len(returns)).astype(int)
    means = returns.groupby(bucket).mean()
    return means["benchmark"].tolist(), means["strategy"].tolist()
