from collections.abc import Callable, Iterator

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.data import get_dataset
from app.main import app

# Three Drawdown Episodes, listed with their peak, trough and depth:
#   Jan 1 (100) -> Jan 2 (90), regained Jan 4:   -10%
#   Jan 5 (110) -> Jan 9 (88), regained Jan 11:  -20%
#   Jan 12 (120) -> Jan 15 (102), never regained: -15%
LEVELS: list[float] = [100, 90, 95, 100, 110, 99, 88, 105, 110, 120, 102, 115]

EPISODE_1 = {"start": "2024-01-01", "end": "2024-01-02"}
EPISODE_2 = {"start": "2024-01-05", "end": "2024-01-09"}
EPISODE_3 = {"start": "2024-01-12", "end": "2024-01-15"}

Fetch = Callable[..., list[dict[str, str]]]


@pytest.fixture
def periods() -> Iterator[Fetch]:
    """Fetch the Drawdown Periods of a Benchmark with the given Levels, one per business day."""

    def fetch(levels: list[float] = LEVELS, n: int = 2, **window: str) -> list[dict[str, str]]:
        dates = pd.bdate_range("2024-01-01", periods=len(levels))
        app.dependency_overrides[get_dataset] = lambda: pd.DataFrame({"Bench": levels}, index=dates)
        with TestClient(app) as client:
            res = client.get(
                "/api/drawdown-periods",
                params={
                    "benchmark": "Bench",
                    "start": window.get("start", str(dates[0].date())),
                    "end": window.get("end", str(dates[-1].date())),
                    "n": n,
                },
            )
        assert res.status_code == 200
        return res.json()["periods"]

    yield fetch
    app.dependency_overrides.clear()


def test_selects_the_n_deepest_episodes(periods: Fetch) -> None:
    assert periods(n=1) == [EPISODE_2]
    assert periods(n=2) == [EPISODE_2, EPISODE_3]


def test_returns_periods_in_chronological_order_not_by_depth(periods: Fetch) -> None:
    assert periods(n=3) == [EPISODE_1, EPISODE_2, EPISODE_3]


def test_an_unrecovered_final_episode_counts(periods: Fetch) -> None:
    # The last episode is still under water when the Window ends; it spans peak to trough.
    assert periods(n=1, start="2024-01-12") == [EPISODE_3]


def test_an_unrecovered_episode_ending_at_its_trough_on_the_last_day_counts(
    periods: Fetch,
) -> None:
    assert periods(levels=[100, 105, 90], n=1) == [{"start": "2024-01-02", "end": "2024-01-03"}]


def test_returns_fewer_than_n_when_there_are_not_enough_episodes(periods: Fetch) -> None:
    assert periods(n=10) == [EPISODE_1, EPISODE_2, EPISODE_3]


def test_a_window_without_any_drawdown_has_no_periods(periods: Fetch) -> None:
    assert periods(levels=[100, 101, 102, 103], n=5) == []


def test_episodes_are_measured_from_the_start_of_the_window(periods: Fetch) -> None:
    # The Jan 5 peak lies before this Window, so the Window's own peak is Jan 8 (99 -> 88 -> 105).
    assert periods(n=1, start="2024-01-08", end="2024-01-10") == [
        {"start": "2024-01-08", "end": "2024-01-09"}
    ]


def test_a_recovery_to_exactly_the_peak_ends_the_episode(periods: Fetch) -> None:
    # 100 -> 90 -> 100 is one episode; the next dip from the regained 100 is a separate one.
    assert periods(levels=[100, 90, 100, 95, 100], n=2) == [
        {"start": "2024-01-01", "end": "2024-01-02"},
        {"start": "2024-01-03", "end": "2024-01-04"},
    ]


def test_n_must_be_between_1_and_10(client: TestClient) -> None:
    for n in (0, 11):
        res = client.get(
            "/api/drawdown-periods",
            params={"benchmark": "Index A", "start": "2024-01-01", "end": "2024-01-05", "n": n},
        )
        assert res.status_code == 422


def test_rejects_an_unknown_benchmark(client: TestClient) -> None:
    res = client.get(
        "/api/drawdown-periods",
        params={"benchmark": "Nope", "start": "2024-01-01", "end": "2024-01-05", "n": 2},
    )

    assert res.status_code == 404
