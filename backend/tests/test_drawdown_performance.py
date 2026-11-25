from collections.abc import Callable

import pandas as pd
import pytest
from fastapi.testclient import TestClient
from httpx2 import Response

# The Benchmark has three Drawdown Episodes (see test_drawdown_periods.py), one business day per
# Level from 2024-01-01:
#   Jan 1 -> Jan 2:   100 -> 90   (-10%)
#   Jan 5 -> Jan 9:   110 -> 88   (-20%)
#   Jan 12 -> Jan 15: 120 -> 102  (-15%)
# The Strategy's Levels over the same days give it +10% in the second and -10% in the third.
BENCHMARK = [100, 90, 95, 100, 110, 99, 88, 105, 110, 120, 102, 115]
STRATEGY = [100, 95, 95, 100, 200, 210, 220, 230, 140, 150, 135, 140]


@pytest.fixture
def dataset() -> pd.DataFrame:
    """Overrides the shared fixture: twelve business days, 2024-01-01 to 2024-01-16."""
    return pd.DataFrame(
        {"Index A": BENCHMARK, "Index B": STRATEGY},
        index=pd.bdate_range("2024-01-01", periods=len(BENCHMARK)),
    )


def request_performance(client: TestClient, **overrides: str | int) -> Response:
    """Ask for the Drawdown Performance of Index A and B over the whole history."""
    params = {
        "benchmark": "Index A",
        "strategy": "Index B",
        "start": "2024-01-01",
        "end": "2024-01-16",
        "n": 2,
        **overrides,
    }
    return client.get("/api/drawdown-performance", params=params)


def get_drawdown_performance(client: TestClient, **overrides: str | int) -> dict:
    res = request_performance(client, **overrides)
    assert res.status_code == 200
    return res.json()


def test_returns_each_index_over_each_of_the_deepest_drawdown_periods(client: TestClient) -> None:
    body = get_drawdown_performance(client)

    assert body["categories"] == ["Jan 2024 – Jan 2024", "Jan 2024 – Jan 2024"]
    assert [s["name"] for s in body["series"]] == ["Index A", "Index B"]
    assert body["series"][0]["values"] == pytest.approx([-0.20, -0.15])
    assert body["series"][1]["values"] == pytest.approx([0.10, -0.10])


def test_labels_name_the_month_and_year_of_the_peak_and_the_trough(
    client_for: Callable[[pd.DataFrame], TestClient],
) -> None:
    # Peak 2021-12-30 (100), trough 2022-03-01 (80);
    # then peak 2022-04-01 (110), trough 2022-09-01 (55).
    dates = pd.to_datetime(["2021-12-30", "2022-03-01", "2022-04-01", "2022-09-01"])
    levels = pd.DataFrame({"Index A": [100, 80, 110, 55], "Index B": [50, 60, 66, 33]}, index=dates)

    body = get_drawdown_performance(client_for(levels), start="2021-12-30", end="2022-09-01")

    assert body["categories"] == ["Dec 2021 – Mar 2022", "Apr 2022 – Sep 2022"]
    assert body["series"][0]["values"] == pytest.approx([-0.20, -0.50])
    assert body["series"][1]["values"] == pytest.approx([0.20, -0.50])


def test_only_uses_periods_inside_the_window(client: TestClient) -> None:
    # The Window starts after the first two episodes, leaving only Jan 12 -> Jan 15.
    body = get_drawdown_performance(client, start="2024-01-10", n=10)

    assert body["categories"] == ["Jan 2024 – Jan 2024"]
    assert body["series"][0]["values"] == pytest.approx([-0.15])
    assert body["series"][1]["values"] == pytest.approx([-0.10])


def test_fewer_periods_than_n_are_returned_when_there_are_not_enough_episodes(
    client: TestClient,
) -> None:
    assert len(get_drawdown_performance(client, n=10)["categories"]) == 3


def test_a_window_without_any_drawdown_is_empty(client: TestClient) -> None:
    # Jan 4 (100) to Jan 5 (110): the Benchmark only rises.
    body = get_drawdown_performance(client, start="2024-01-04", end="2024-01-05")

    assert body["categories"] == []
    assert body["series"] == [
        {"name": "Index A", "values": []},
        {"name": "Index B", "values": []},
    ]


def test_unknown_index_is_rejected(client: TestClient) -> None:
    for name in ("benchmark", "strategy"):
        assert request_performance(client, **{name: "Nope"}).status_code == 404


def test_n_must_be_between_1_and_10(client: TestClient) -> None:
    for n in (0, 11):
        assert request_performance(client, n=n).status_code == 422
