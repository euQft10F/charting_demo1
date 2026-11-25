"""Synthetic Index Levels, generated once in memory at startup."""

from functools import cache

import numpy as np
import pandas as pd

SEED = 12
YEARS = 6
START_LEVEL = 100.0
TRADING_DAYS_PER_YEAR = 252  # business days per year

# name -> (annual drift, annual volatility, beta to the common market factor)
INDEX_PARAMS: dict[str, tuple[float, float, float]] = {
    "Alpha Equity": (0.07, 0.17, 1.0),
    "Beta Low Vol": (0.05, 0.10, 0.6),
    "Gamma Momentum": (0.10, 0.22, 1.1),
    "Delta Value": (0.06, 0.19, 0.9),
    "Epsilon Defensive": (0.04, 0.08, 0.4),
    "Zeta Growth": (0.09, 0.25, 1.3),
}

MARKET_VOL = 0.009  # daily volatility of the common market factor
REBOUND_SHARE = 0.8  # share of each crash recovered afterwards
REBOUND_LENGTH = 3  # rebound lasts this many times the crash length

# Crash regimes: (start offset in business days, length in days, total market move)
CRASHES: list[tuple[int, int, float]] = [
    (180, 25, -0.22),
    (520, 60, -0.12),
    (900, 120, -0.22),
    (1350, 15, -0.10),
]


def generate_dataset(seed: int = SEED, end: pd.Timestamp | None = None) -> pd.DataFrame:
    """Correlated random walks with injected crash regimes, all starting at 100.

    Returns a DataFrame indexed by business day with one column per Index.
    """
    rng = np.random.default_rng(seed)
    end = (end or pd.Timestamp.today()).normalize()
    dates = pd.bdate_range(end=end, periods=YEARS * TRADING_DAYS_PER_YEAR + 1)
    n = len(dates) - 1  # number of Daily Returns

    market = rng.normal(0.0, MARKET_VOL, n)
    for offset, length, move in CRASHES:
        market[offset : offset + length] += move / length
        rebound = slice(offset + length, offset + length * (1 + REBOUND_LENGTH))
        market[rebound] += -move * REBOUND_SHARE / (length * REBOUND_LENGTH)

    columns: dict[str, np.ndarray] = {}
    for name, (drift, vol, beta) in INDEX_PARAMS.items():
        daily_vol = vol / np.sqrt(TRADING_DAYS_PER_YEAR)
        idio_vol = np.sqrt(max(daily_vol**2 - (beta * MARKET_VOL) ** 2, (0.3 * daily_vol) ** 2))
        returns = drift / TRADING_DAYS_PER_YEAR + beta * market + rng.normal(0.0, idio_vol, n)
        levels = START_LEVEL * np.cumprod(np.concatenate([[1.0], 1.0 + returns]))
        columns[name] = levels

    return pd.DataFrame(columns, index=dates)


@cache
def get_dataset() -> pd.DataFrame:
    """FastAPI dependency providing the Index Levels; overridden in tests."""
    return generate_dataset()
