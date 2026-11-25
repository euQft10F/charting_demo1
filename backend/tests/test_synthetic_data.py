from fastapi.testclient import TestClient

from app.main import app

INDICES = [
    "Alpha Equity",
    "Beta Low Vol",
    "Gamma Momentum",
    "Delta Value",
    "Epsilon Defensive",
    "Zeta Growth",
]


def test_serves_six_synthetic_indices_starting_at_100_with_six_years_of_history() -> None:
    with TestClient(app) as client:
        listing = client.get("/api/indices").json()
        levels = client.get("/api/levels", params={"names": INDICES}).json()

    assert listing["indices"] == INDICES
    assert len(levels["dates"]) > 6 * 250
    assert all(s["values"][0] == 100.0 for s in levels["series"])
    assert all(min(s["values"]) > 0 for s in levels["series"])
