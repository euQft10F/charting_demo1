import pandas as pd
import pytest
from fastapi.testclient import TestClient

# Daily Returns on days 2..11 of the hand-built Indices below. Sorted by Benchmark return the
# days fall into five pairs, so each Performance Bucket holds two days:
#   Worst  Benchmark -4%, -3%   Strategy -6%, -2%   -> means -3.5%, -4.0%
#   2      Benchmark -2%, -1%   Strategy -4%,  0%   -> means -1.5%, -2.0%
#   3      Benchmark  0%, +1%   Strategy +2%,  0%   -> means +0.5%, +1.0%
#   4      Benchmark +2%, +3%   Strategy +1%, +2%   -> means +2.5%, +1.5%
#   Best   Benchmark +4%, +5%   Strategy +3%, +8%   -> means +4.5%, +5.5%
BENCHMARK_RETURNS = [-0.04, 0.02, -0.01, 0.05, 0.00, -0.03, 0.01, 0.03, -0.02, 0.04]
STRATEGY_RETURNS = [-0.06, 0.01, 0.00, 0.08, 0.02, -0.02, 0.00, 0.02, -0.04, 0.03]


def levels_from(returns: list[float]) -> list[float]:
    levels = [100.0]
    for r in returns:
        levels.append(levels[-1] * (1 + r))
    return levels


@pytest.fixture
def dataset() -> pd.DataFrame:
    """Overrides the shared fixture: eleven business days, 2024-01-01 to 2024-01-15."""
    return pd.DataFrame(
        {
            "Index A": levels_from(BENCHMARK_RETURNS),
            "Index B": levels_from(STRATEGY_RETURNS),
        },
        index=pd.bdate_range("2024-01-01", periods=11),
    )


def get_buckets(client: TestClient, **overrides: str | bool) -> dict:
    params = {
        "benchmark": "Index A",
        "strategy": "Index B",
        "start": "2024-01-01",
        "end": "2024-01-15",
        "annualise": False,
        **overrides,
    }
    res = client.get("/api/performance-buckets", params=params)
    assert res.status_code == 200
    return res.json()


def test_returns_mean_daily_return_of_each_index_in_each_performance_bucket(
    client: TestClient,
) -> None:
    body = get_buckets(client)

    assert body["categories"] == ["Worst", "2", "3", "4", "Best"]
    assert [s["name"] for s in body["series"]] == ["Index A", "Index B"]
    assert body["series"][0]["values"] == pytest.approx([-0.035, -0.015, 0.005, 0.025, 0.045])
    assert body["series"][1]["values"] == pytest.approx([-0.04, -0.02, 0.01, 0.015, 0.055])


def test_only_ranks_days_inside_the_window(client: TestClient) -> None:
    # Days 1..6 hold five Daily Returns (the first day has none inside the Window), one per bucket:
    # Benchmark -4%, -1%, 0%, +2%, +5% with Strategy -6%, 0%, +2%, +1%, +8%.
    body = get_buckets(client, start="2024-01-01", end="2024-01-08")

    assert body["series"][0]["values"] == pytest.approx([-0.04, -0.01, 0.0, 0.02, 0.05])
    assert body["series"][1]["values"] == pytest.approx([-0.06, 0.0, 0.02, 0.01, 0.08])


def test_annualise_scales_the_mean_daily_returns_by_252(client: TestClient) -> None:
    body = get_buckets(client, annualise=True)

    assert body["series"][0]["values"] == pytest.approx(
        [-0.035 * 252, -0.015 * 252, 0.005 * 252, 0.025 * 252, 0.045 * 252]
    )
    assert body["series"][1]["values"] == pytest.approx(
        [-0.04 * 252, -0.02 * 252, 0.01 * 252, 0.015 * 252, 0.055 * 252]
    )


def test_window_with_fewer_daily_returns_than_buckets_is_empty(client: TestClient) -> None:
    # Four days hold three Daily Returns, too few to fill five buckets.
    body = get_buckets(client, start="2024-01-01", end="2024-01-04")

    assert body["categories"] == []
    assert body["series"] == [
        {"name": "Index A", "values": []},
        {"name": "Index B", "values": []},
    ]


def test_unknown_index_is_rejected(client: TestClient) -> None:
    res = client.get(
        "/api/performance-buckets",
        params={
            "benchmark": "Index A",
            "strategy": "Nope",
            "start": "2024-01-01",
            "end": "2024-01-15",
        },
    )

    assert res.status_code == 404


def test_same_index_as_benchmark_and_strategy_has_identical_series(client: TestClient) -> None:
    body = get_buckets(client, strategy="Index A")

    assert body["series"][0]["values"] == pytest.approx([-0.035, -0.015, 0.005, 0.025, 0.045])
    assert body["series"][1] == body["series"][0]
