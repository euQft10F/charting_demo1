from fastapi.testclient import TestClient
from httpx2 import Response


def levels_from(returns: list[float]) -> list[float]:
    """Levels that start at 100 and compound each return in turn."""
    levels = [100.0]
    for r in returns:
        levels.append(levels[-1] * (1 + r))
    return levels


def request_buckets(client: TestClient, **overrides: str) -> Response:
    """Ask for Performance Buckets of hand-built Index A and B, over 2024-01-01 to 2024-01-15."""
    params = {
        "benchmark": "Index A",
        "strategy": "Index B",
        "start": "2024-01-01",
        "end": "2024-01-15",
        **overrides,
    }
    return client.get("/api/performance-buckets", params=params)


def get_buckets(client: TestClient, **overrides: str) -> dict:
    res = request_buckets(client, **overrides)
    assert res.status_code == 200
    return res.json()
