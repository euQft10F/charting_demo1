from collections.abc import Callable

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from tests.helpers import get_buckets, levels_from, request_buckets

ClientFor = Callable[[pd.DataFrame], TestClient]


def period_levels(
    index: pd.DatetimeIndex, period: str, benchmark: list[float], strategy: list[float]
) -> pd.DataFrame:
    """Index A and B whose last Level of each calendar period compounds the given returns.

    Every other day sits 50% above the previous period's last Level, so the path inside a
    period is wild: only the period-end Levels can produce the expected Weekly or Monthly Returns.
    """
    periods = index.to_period(period)
    ranks = {p: k for k, p in enumerate(periods.unique())}

    def levels(returns: list[float]) -> list[float]:
        assert len(ranks) == len(returns) + 1
        ends = levels_from(returns)
        return [
            ends[ranks[p]]
            if i == len(index) - 1 or periods[i + 1] != p
            else ends[max(ranks[p] - 1, 0)] * 1.5
            for i, p in enumerate(periods)
        ]

    return pd.DataFrame({"Index A": levels(benchmark), "Index B": levels(strategy)}, index=index)


def test_weekly_returns_run_between_the_last_levels_of_consecutive_weeks(
    client_for: ClientFor,
) -> None:
    # Fridays 2024-01-05 to 2024-02-09: six weeks, so five Weekly Returns, one per bucket.
    # Benchmark +2%, -1%, +5%, -3%, 0% sorts to -3%, -1%, 0%, +2%, +5%, and the Strategy's
    # +4%, +1%, -2%, +3%, +6% in the same weeks gives +3%, +1%, +6%, +4%, -2% bucket by bucket.
    index = pd.bdate_range("2024-01-05", "2024-02-09")
    client = client_for(
        period_levels(index, "W", [0.02, -0.01, 0.05, -0.03, 0.00], [0.04, 0.01, -0.02, 0.03, 0.06])
    )

    body = get_buckets(client, frequency="weekly", start="2024-01-05", end="2024-02-09")

    assert body["categories"] == ["Worst", "2", "3", "4", "Best"]
    assert body["series"][0]["values"] == pytest.approx([-0.03, -0.01, 0.0, 0.02, 0.05])
    assert body["series"][1]["values"] == pytest.approx([0.03, 0.01, 0.06, 0.04, -0.02])


def test_monthly_returns_run_between_the_last_levels_of_consecutive_months(
    client_for: ClientFor,
) -> None:
    # 2024-01-31 to 2024-06-28: six months, so five Monthly Returns, one per bucket.
    # Benchmark -2%, +4%, +1%, -5%, +3% sorts to -5%, -2%, +1%, +3%, +4%, and the Strategy's
    # +2%, -3%, +5%, -1%, 0% in the same months gives -1%, +2%, +5%, 0%, -3% bucket by bucket.
    index = pd.bdate_range("2024-01-31", "2024-06-28")
    client = client_for(
        period_levels(
            index, "M", [-0.02, 0.04, 0.01, -0.05, 0.03], [0.02, -0.03, 0.05, -0.01, 0.00]
        )
    )

    body = get_buckets(client, frequency="monthly", start="2024-01-31", end="2024-06-28")

    assert body["series"][0]["values"] == pytest.approx([-0.05, -0.02, 0.01, 0.03, 0.04])
    assert body["series"][1]["values"] == pytest.approx([-0.01, 0.02, 0.05, 0.0, -0.03])


def test_first_period_is_cut_off_at_the_start_of_the_window(client_for: ClientFor) -> None:
    # The Window starts on Wednesday 2024-01-03, so the first week is partial and its return
    # runs from that day's Level, which sits 50% above the week's last Level: -1/3 for both
    # Indices. Four full weeks follow: Benchmark +2%, -1%, +5%, -3% and Strategy +4%, +1%, -2%, +3%.
    # The Benchmark's five returns sort to -1/3, -3%, -1%, +2%, +5%.
    index = pd.bdate_range("2024-01-03", "2024-02-02")
    client = client_for(
        period_levels(index, "W", [0.02, -0.01, 0.05, -0.03], [0.04, 0.01, -0.02, 0.03])
    )

    body = get_buckets(client, frequency="weekly", start="2024-01-03", end="2024-02-02")

    assert body["series"][0]["values"] == pytest.approx([-1 / 3, -0.03, -0.01, 0.02, 0.05])
    assert body["series"][1]["values"] == pytest.approx([-1 / 3, 0.03, 0.01, 0.04, -0.02])


def test_window_with_fewer_weekly_returns_than_buckets_is_empty(client_for: ClientFor) -> None:
    # The same six weeks, but the Window covers only the last three Fridays: two Weekly Returns.
    index = pd.bdate_range("2024-01-05", "2024-02-09")
    client = client_for(
        period_levels(index, "W", [0.02, -0.01, 0.05, -0.03, 0.00], [0.04, 0.01, -0.02, 0.03, 0.06])
    )

    body = get_buckets(client, frequency="weekly", start="2024-01-26", end="2024-02-09")

    assert body["categories"] == []
    assert body["series"] == [
        {"name": "Index A", "values": []},
        {"name": "Index B", "values": []},
    ]


def test_unknown_return_frequency_is_rejected(client: TestClient) -> None:
    assert request_buckets(client, frequency="hourly").status_code == 422
