"""Performance Buckets: days ranked into quantile groups by the Benchmark's Daily Return."""

import datetime as dt

import pandas as pd

BUCKET_LABELS = ["Worst", "2", "3", "4", "Best"]
TRADING_DAYS_PER_YEAR = 252  # scales a mean Daily Return to its Annualised Mean Return


def bucket_means(
    levels: pd.DataFrame,
    benchmark: str,
    strategy: str,
    start: dt.date,
    end: dt.date,
    annualise: bool = False,
) -> tuple[list[float], list[float]]:
    """Mean Daily Return of the Benchmark and of the Strategy in each Performance Bucket.

    Only the days from `start` to `end` count, and the first of them has no Daily Return. Days
    are ranked by the Benchmark's Daily Return (ties broken by date) and cut into five even
    groups, Worst first. With `annualise` the means are scaled to Annualised Mean Returns.

    Returns the Benchmark means and the Strategy means, five values each, or two empty lists
    when the Window holds fewer Daily Returns than buckets.
    """
    window = levels.loc[pd.Timestamp(start) : pd.Timestamp(end)]
    returns = (
        pd.DataFrame({"benchmark": window[benchmark], "strategy": window[strategy]})
        .pct_change()
        .dropna()
    )
    if len(returns) < len(BUCKET_LABELS):
        return [], []
    ranks = returns["benchmark"].rank(method="first")
    bucket = ((ranks - 1) * len(BUCKET_LABELS) // len(returns)).astype(int)
    means = returns.groupby(bucket).mean()
    if annualise:
        means *= TRADING_DAYS_PER_YEAR
    return means["benchmark"].tolist(), means["strategy"].tolist()
