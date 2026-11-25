from fastapi.testclient import TestClient


def test_lists_indices_with_available_date_range(client: TestClient) -> None:
    res = client.get("/api/indices")

    assert res.status_code == 200
    assert res.json() == {
        "indices": ["Index A", "Index B"],
        "start": "2024-01-01",
        "end": "2024-01-05",
    }


def test_returns_levels_of_requested_indices_in_request_order(client: TestClient) -> None:
    res = client.get("/api/levels", params={"names": ["Index B", "Index A"]})

    assert res.status_code == 200
    body = res.json()
    assert body["dates"] == [
        "2024-01-01",
        "2024-01-02",
        "2024-01-03",
        "2024-01-04",
        "2024-01-05",
    ]
    assert body["series"] == [
        {"name": "Index B", "values": [100.0, 102.0, 104.0, 90.0, 95.0]},
        {"name": "Index A", "values": [100.0, 110.0, 99.0, 105.0, 120.0]},
    ]


def test_unknown_index_is_rejected(client: TestClient) -> None:
    res = client.get("/api/levels", params={"names": ["Index A", "Nope"]})

    assert res.status_code == 404
